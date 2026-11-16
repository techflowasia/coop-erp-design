// ════════════════════════════════════════════════════════════════════
//  เปิดงานประจำวัน (Open Daily Work)
//  · เปิดรอบทำการของวัน — ยกยอดเงินสด/เช็คคงเหลือจากรอบก่อนมาตั้งต้น
//  · เปิดได้เฉพาะสถานะ fresh (วันก่อนหน้าต้องปิดงานแล้ว) วันละครั้ง
//  · ผูกกับ DaySession (components-day-session.jsx)
// ════════════════════════════════════════════════════════════════════
const { useState: doUseState, useContext: doUseContext } = React;

function DayOpenWorkspace({ onToast }) {
  const audit = doUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  const coop = React.useMemo(() => (window.vchCoopInfo ? window.vchCoopInfo() : (window.COOP_INFO_DEFAULTS || {})), []);
  const DS = window.DaySession;
  const [st, setSt] = doUseState(() => DS.status());
  const [askOpen, setAskOpen] = doUseState(false);

  const phase = st.phase;                 // fresh | open | closed | prevUnclosed
  const canOpen = phase === 'fresh';
  const carry = st.carry, chequeCarry = st.chequeCarry;
  const total = carry + chequeCarry;

  const doOpen = () => {
    setAskOpen(false);
    const res = DS.open();
    if (!res.ok) { setSt(DS.status()); return; }
    setSt(DS.status());
    if (window.depSuccess) window.depSuccess({ title: 'เปิดงานประจำวันเรียบร้อยแล้ว', desc: 'เปิดรอบทำการวันที่ ' + DS.thDate(res.session.date) + ' · ยอดยกมา ' + fmt.money(res.session.cashCarry + res.session.chequeCarry, 2) + ' บาท' });
    else onToast && onToast('เปิดงานประจำวันเรียบร้อยแล้ว');
    audit.log && audit.log({ action: 'create', module: 'การเงิน — เปิดงานประจำวัน', target: DS.thDate(res.session.date), summary: `ยอดยกมา ${fmt.money(res.session.cashCarry, 2)} บาท` });
  };

  // ค่าที่แสดง: ถ้าเปิด/ปิดแล้วให้ใช้ค่าจาก session, ไม่งั้นค่าตั้งต้นของรอบใหม่
  const s = st.session;
  const view = (phase === 'open' || phase === 'closed') && s
    ? { date: s.date, time: s.openTime, cashCarry: s.cashCarry, chequeCarry: s.chequeCarry, total: s.cashCarry + s.chequeCarry, by: s.by, branch: s.branch, host: s.host }
    : { date: DS.todayISO(), time: DS.nowTime(), cashCarry: carry, chequeCarry, total, by: 'Chaiwat', branch: 'สำนักงานใหญ่', host: '192.168.102.22' };

  return (
    <div data-screen-label="หน้าเปิดงานประจำวัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปิดงานประจำวัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เปิดรอบทำการของวัน — ยกยอดเงินสดและเช็คคงเหลือมาตั้งต้นสำหรับงานเคาน์เตอร์รับ–จ่ายเงิน
          </div>
        </div>
        <span className="spacer" />
        {(phase === 'open' || phase === 'closed') && <span className="pill ok" style={{ marginRight: 8 }}>เปิดงานแล้ว</span>}
        <button className="btn primary" disabled={!canOpen} onClick={() => setAskOpen(true)}>
          <Icon name="check" /> เปิดงานประจำวัน
        </button>
      </div>

      {phase === 'open' && (
        <div className="dayopen-warn">
          <Icon name="info" size={16} /> ได้เปิดงานประจำวันแล้ว เมื่อ {view.time} น. — ทำรายการที่เคาน์เตอร์ได้ และไปที่ “ปิดงานประจำวัน” เมื่อสิ้นวัน
        </div>
      )}
      {phase === 'closed' && (
        <div className="dayopen-warn">
          <Icon name="info" size={16} /> รอบทำการของวันนี้ปิดแล้ว — เปิดรอบใหม่ได้อีกครั้งในวันทำการถัดไป
        </div>
      )}
      {phase === 'prevUnclosed' && (
        <div className="dayopen-warn">
          <Icon name="info" size={16} /> ยังมีรอบทำการวันที่ {DS.thDate(st.session.date)} ที่เปิดค้างอยู่ — ต้อง “ปิดงานประจำวัน” ของรอบนั้นก่อนจึงจะเปิดวันใหม่ได้
        </div>
      )}

      <div className="search-card">
        <div className="section-head"><Icon name="bank" size={15} /> สหกรณ์</div>
        <div className="dayopen-grid">
          <div className="do-row"><span className="do-k">ชื่อสหกรณ์</span><span className="do-v strong">{coop.name || '—'}</span></div>
          <div className="do-row2">
            <div className="do-row"><span className="do-k">เปิดงานประจำวันที่</span><span className="do-v mono strong">{doThDateSafe(view.date)}</span></div>
            <div className="do-row"><span className="do-k">เวลา</span><span className="do-v mono strong">{view.time}</span></div>
          </div>
        </div>
      </div>

      <div className="dayopen-cols">
        <div className="search-card">
          <div className="section-head"><Icon name="money" size={15} /> จำนวนเงินสดในสหกรณ์</div>
          <div className="dayopen-grid">
            <div className="do-row"><span className="do-k">เงินสดยกมา</span><span className="do-v mono num">{fmt.money(view.cashCarry, 2)}</span></div>
            <div className="do-row"><span className="do-k">เช็คยกมา</span><span className="do-v mono num">{fmt.money(view.chequeCarry, 2)}</span></div>
            <div className="do-row do-total"><span className="do-k">รวม</span><span className="do-v mono num">{fmt.money(view.total, 2)}</span></div>
          </div>
        </div>

        <div className="search-card">
          <div className="section-head"><Icon name="info" size={15} /> รายละเอียดอื่น ๆ</div>
          <div className="dayopen-grid">
            <div className="do-row"><span className="do-k">ผู้ทำรายการ</span><span className="do-v">{view.by}</span></div>
            <div className="do-row"><span className="do-k">วันที่ทำรายการ</span><span className="do-v mono">{doThDateSafe(view.date)}</span></div>
            <div className="do-row"><span className="do-k">สาขา</span><span className="do-v">{view.branch}</span></div>
            <div className="do-row"><span className="do-k">ชื่อเครื่อง</span><span className="do-v mono">{view.host}</span></div>
          </div>
        </div>
      </div>

      {askOpen && window.DepConfirmModal && (
        <window.DepConfirmModal title="ยืนยันการเปิดงานประจำวัน" okLabel="ยืนยันเปิดงาน"
          lines={[
            ['เปิดงานประจำวันที่', doThDateSafe(view.date)],
            ['เวลา', view.time + ' น.'],
            ['เงินสดยกมา', fmt.money(view.cashCarry, 2) + ' บาท'],
            ['เช็คยกมา', fmt.money(view.chequeCarry, 2) + ' บาท'],
            ['ยอดยกมารวม', fmt.money(view.total, 2) + ' บาท'],
          ]}
          onOk={doOpen} onClose={() => setAskOpen(false)} />
      )}

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> การเปิดงานประจำวันทำได้วันละหนึ่งครั้ง — ยอดเงินสด/เช็คยกมาดึงจากยอดคงเหลือปลายวันของรอบก่อนหน้า
      </div>
    </div>
  );
}

function doThDateSafe(iso) { return window.DaySession ? window.DaySession.thDate(iso) : iso; }

Object.assign(window, { DayOpenWorkspace });
