// ════════════════════════════════════════════════════════════════════
//  ปิดงานประจำวัน (Close Daily Work)
//  · สรุปเงินสดเข้า–ออกของวัน คำนวณยอดยกไป และตรวจเช็คค้าง รอนำส่ง
//  · ปิดได้เมื่อมีรอบที่เปิดค้างอยู่ (opened && !closed) — ปิดวันละครั้ง
//  · ยอดยกไป → กลายเป็นยอดยกมาของรอบเปิดถัดไป (ผ่าน DaySession)
// ════════════════════════════════════════════════════════════════════
const { useState: dcUseState, useContext: dcUseContext, useMemo: dcUseMemo } = React;

// เช็คค้าง รอนำส่ง (ยังไม่ได้นำส่งธนาคาร ณ สิ้นวัน)
function dcPendingCheques() {
  return [
    { chequeNo: '06700143', bank: 'ธนาคารกรุงไทย', amount: 125000, source: 'เงินฝาก' },
    { chequeNo: '06700145', bank: 'ธนาคารกรุงไทย', amount: 42150, source: 'ค่าใช้จ่าย' },
    { chequeNo: '01200334', bank: 'ธนาคารกสิกรไทย', amount: 50000, source: 'เงินกู้' },
  ];
}

function DayCloseWorkspace({ onToast }) {
  const audit = dcUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  const coop = dcUseMemo(() => (window.vchCoopInfo ? window.vchCoopInfo() : (window.COOP_INFO_DEFAULTS || {})), []);
  const DS = window.DaySession;
  const [st, setSt] = dcUseState(() => DS.status());
  const [confirmClose, setConfirmClose] = dcUseState(false);

  const phase = st.phase;                            // fresh | open | closed | prevUnclosed
  const canClose = phase === 'open' || phase === 'prevUnclosed';
  const isClosed = phase === 'closed';

  const pendingCheques = dcUseMemo(dcPendingCheques, []);
  const chequePending = pendingCheques.reduce((a, c) => a + c.amount, 0);

  // ยอดเงินสด: ยกมาจากรอบที่เปิด, เข้า–ออก ของวัน
  const carry = st.session ? st.session.cashCarry : DS.DEFAULT_CARRY;
  const cashIn = 27156.00;
  const cashOut = 1163358.50;
  const carryForward = carry + cashIn - cashOut;

  const doClose = () => {
    setConfirmClose(false);
    // ยังไม่ได้เปิดงาน → เปิดรอบทำการของวันให้ก่อน แล้วจึงปิด
    if (DS.status().phase === 'fresh') DS.open({ by: 'Chaiwat', branch: '000', host: '192.168.100.82' });
    const res = DS.close({ cashIn, cashOut, chequePending, closedBy: 'Chaiwat', branch: '000', host: '192.168.100.82' });
    if (!res.ok) { setSt(DS.status()); return; }
    setSt(DS.status());
    onToast && onToast('ปิดงานประจำวันเรียบร้อยแล้ว');
    audit.log && audit.log({ action: 'create', module: 'การเงิน — ปิดงานประจำวัน', target: DS.thDate(res.session.date), summary: `ยอดยกไป ${fmt.money(res.session.carryForward, 2)} บาท` });
  };

  const s = st.session;
  const view = isClosed && s
    ? { date: s.date, time: s.closeTime, carry: s.cashCarry, cashIn: s.cashIn, cashOut: s.cashOut, carryForward: s.carryForward, chequePending: s.chequePending, by: s.by, closedBy: s.closedBy, branch: s.closeBranch, host: s.closeHost }
    : { date: (s ? s.date : DS.todayISO()), time: DS.nowTime(), carry, cashIn, cashOut, carryForward, chequePending, by: (s ? s.by : 'Chaiwat'), closedBy: 'Chaiwat', branch: '000', host: '192.168.100.82' };

  return (
    <div data-screen-label="หน้าปิดงานประจำวัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปิดงานประจำวัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            สรุปเงินสดเข้า–ออกของวัน คำนวณยอดยกไป และตรวจรายการเช็คค้าง รอนำส่ง
          </div>
        </div>
        <span className="spacer" />
        {isClosed && <span className="pill neutral" style={{ marginRight: 8 }}>ปิดงานแล้ว</span>}
        <button className="btn primary" onClick={() => setConfirmClose(true)}>
          <Icon name="check" /> ปิดงานประจำวัน
        </button>
      </div>

      {phase === 'fresh' && (
        <div className="dayopen-warn"><Icon name="info" size={16} /> ยังไม่ได้เปิดงานประจำวัน — ต้องไปที่ “เปิดงานประจำวัน” เพื่อเปิดรอบทำการก่อนจึงจะปิดงานได้</div>
      )}
      {phase === 'prevUnclosed' && (
        <div className="dayopen-warn"><Icon name="info" size={16} /> กำลังปิดรอบทำการวันที่ {DS.thDate(s.date)} ที่เปิดค้างอยู่</div>
      )}
      {isClosed && (
        <div className="dayopen-warn"><Icon name="info" size={16} /> ได้ปิดงานประจำวันแล้ว เมื่อ {view.time} น. — ยอดยกไป {fmt.money(view.carryForward, 2)} บาท จะเป็นยอดยกมาของรอบถัดไป</div>
      )}

      <div className="search-card">
        <div className="section-head"><Icon name="bank" size={15} /> สหกรณ์</div>
        <div className="dayopen-grid">
          <div className="do-row"><span className="do-k">ชื่อสหกรณ์</span><span className="do-v strong">{coop.name || 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด'}</span></div>
          <div className="do-row2">
            <div className="do-row"><span className="do-k">ปิดงานประจำวันที่</span><span className="do-v mono strong">{DS.thDate(view.date)}</span></div>
            <div className="do-row"><span className="do-k">เวลา</span><span className="do-v mono strong">{view.time}</span></div>
          </div>
        </div>
      </div>

      <div className="dayopen-cols">
        <div className="search-card">
          <div className="section-head"><Icon name="money" size={15} /> จำนวนเงินสดในสหกรณ์</div>
          <div className="dayopen-grid">
            <div className="do-row"><span className="do-k">ยอดยกมา</span><span className="do-v mono num">{fmt.money(view.carry, 2)}</span></div>
            <div className="do-row"><span className="do-k">จำนวนเงินเข้า</span><span className="do-v mono num" style={{ color: 'var(--brand-700)' }}>{fmt.money(view.cashIn, 2)}</span></div>
            <div className="do-row"><span className="do-k">จำนวนเงินออก</span><span className="do-v mono num" style={{ color: 'var(--danger, #c0392b)' }}>{fmt.money(view.cashOut, 2)}</span></div>
            <div className="do-row do-total"><span className="do-k">ยอดยกไป</span><span className="do-v mono num">{fmt.money(view.carryForward, 2)}</span></div>
          </div>
        </div>

        <div className="search-card">
          <div className="section-head"><Icon name="info" size={15} /> รายละเอียดอื่น ๆ</div>
          <div className="dayopen-grid">
            <div className="do-row"><span className="do-k">ผู้ทำรายการ</span><span className="do-v">{view.by}</span></div>
            <div className="do-row"><span className="do-k">วันที่ทำรายการ</span><span className="do-v mono">{DS.thDate(view.date)}</span></div>
            <div className="do-row"><span className="do-k">ผู้ปิดงาน</span><span className="do-v">{isClosed ? view.closedBy : '—'}</span></div>
            <div className="do-row"><span className="do-k">วันที่ปิดงาน</span><span className="do-v mono">{isClosed ? DS.thDate(view.date) : '—'}</span></div>
            <div className="do-row"><span className="do-k">สาขา</span><span className="do-v mono">{view.branch}</span></div>
            <div className="do-row"><span className="do-k">ชื่อเครื่อง</span><span className="do-v mono">{view.host}</span></div>
          </div>
        </div>
      </div>

      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <h3>รายการเช็คค้าง รอนำส่ง</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}>{pendingCheques.length} รายการ</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 140 }}>เลขที่เช็ค</th>
                <th style={{ minWidth: 220 }}>ธนาคาร</th>
                <th className="center" style={{ width: 130 }}>จากระบบ</th>
                <th className="num" style={{ width: 180 }}>จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody>
              {pendingCheques.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">ไม่มีเช็คค้างรอนำส่ง</td></tr>
              ) : pendingCheques.map(c => (
                <tr key={c.chequeNo}>
                  <td className="mono"><b>{c.chequeNo}</b></td>
                  <td>{c.bank}</td>
                  <td className="center"><span className="chip info">{c.source}</span></td>
                  <td className="num mono">{fmt.money(c.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
            {pendingCheques.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="3" className="center"><b>รวมเช็คค้างรอนำส่ง</b></td>
                  <td className="num mono"><b>{fmt.money(chequePending, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted"><Icon name="info" size={12} /> การปิดงานประจำวันทำได้วันละหนึ่งครั้ง — ยอดยกไปจะกลายเป็นยอดยกมาของรอบทำการถัดไป</div>

      {confirmClose && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirmClose(false)} />
          <div className="modal-card" style={{ width: 480, maxWidth: '94vw' }}>
            <div className="modal-head">
              <h2>ยืนยันการปิดงานประจำวัน</h2>
              <button className="close-btn" onClick={() => setConfirmClose(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 14px' }}>
                คุณต้องการปิดงานประจำวันที่ <b>{DS.thDate(view.date)}</b> ใช่หรือไม่?
                การปิดงานทำได้วันละหนึ่งครั้งและไม่สามารถย้อนกลับได้
              </p>
              <div className="dayopen-grid" style={{ marginBottom: 14 }}>
                <div className="do-row"><span className="do-k">ยอดยกไป</span><span className="do-v mono num strong">{fmt.money(view.carryForward, 2)}</span></div>
                <div className="do-row"><span className="do-k">เช็คค้างรอนำส่ง</span><span className="do-v mono num">{fmt.money(chequePending, 2)}</span></div>
              </div>
              {!canClose && (
                <div className="dayopen-warn" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={14} /> {isClosed
                    ? 'ได้ปิดงานประจำวันนี้แล้ว — ปิดได้วันละหนึ่งครั้ง'
                    : 'ยังไม่ได้เปิดงานประจำวัน — ระบบจะเปิดรอบทำการของวันให้ก่อนแล้วปิดงานให้ในขั้นตอนเดียว'}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn" onClick={() => setConfirmClose(false)}>ยกเลิก</button>
                <button className="btn primary" disabled={isClosed} onClick={doClose}><Icon name="check" /> ยืนยันปิดงาน</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DayCloseWorkspace });
