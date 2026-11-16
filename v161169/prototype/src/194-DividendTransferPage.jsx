// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: โอนปันผล–เข้ารับจ่าย
//  ประมวลผลย้ายข้อมูลจากระบบย่อย (เช่น เงินปันผล) เข้าสู่ระบบบัญชีรับ–จ่าย
//  มีกล่องยืนยันก่อนประมวลผลเสมอ เพื่อป้องกันการกดซ้ำซ้อน
// ════════════════════════════════════════════════════════════════════

function DividendTransferPage({ onToast }) {
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [source, setSource] = useState('DIV');
  const [date, setDate]     = useState(workDate);
  const [confirm, setConfirm] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const sourceLabel = (window.TRANSFER_SOURCES.find(s => s.v === source) || {}).l || source;

  const doProcess = () => {
    setConfirm(false);
    // จำลองผลการประมวลผล
    const h = (source.charCodeAt(0) * 7 + new Date(date).getDate()) % 200;
    const records = 120 + h;
    const amount = records * (1850 + h * 3);
    setLastRun({
      ts: new Date().toISOString().slice(0, 19).replace('T', ' '),
      source: sourceLabel, date, records, amount,
    });
    setOkMsg({
      title: 'ประมวลผลเรียบร้อยแล้ว',
      detail: `โอน “${sourceLabel}” เข้าระบบรับ–จ่าย ${records} รายการ · รวม ${window.fmt.money(amount, 2)} บาท เรียบร้อยแล้ว`,
    });
  };

  return (
    <div data-screen-label="หน้าโอนปันผลเข้ารับจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ขอส่งโอนปันผล–เข้ารับจ่าย
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ประมวลผลย้ายข้อมูลจากระบบย่อย (เช่น เงินปันผลสมาชิก) เข้าสู่ระบบบัญชีรับ–จ่ายหลัก
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{fmt.date(workDate)}</span>
        </div>
      </div>

      <div className="dv-wrap">
        {/* ── ส่วนที่ 1 + 2: เงื่อนไข + ปุ่มประมวลผล ── */}
        <div className="search-card dv-card">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <span className="head-bar" /><h3>ข้อมูลและเงื่อนไขการโอนรายการ</h3>
          </div>

          <div className="lm-field" style={{ marginBottom: 14 }}>
            <label className="lm-label">จากระบบ <span className="cfg-required">*</span></label>
            <select className="cfg-input" value={source} onChange={(e) => setSource(e.target.value)}>
              {window.TRANSFER_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <span className="lm-hint">เลือกโมดูล/ระบบต้นทางที่ต้องการดึงข้อมูลมาโอนเข้าบัญชีรับ–จ่าย</span>
          </div>

          <div className="lm-field">
            <label className="lm-label">วันที่ต้องการโอนรายการ <span className="cfg-required">*</span></label>
            <ErpDate value={date} onChange={(v) => ((e) => setDate(e.target.value))({ target: { value: v } })} className="cfg-input mono" />
            <span className="lm-hint">ค่าเริ่มต้นเป็นวันที่ปัจจุบัน · {fmt.date(date)} (แก้ไข/เลือกย้อนหลังได้)</span>
          </div>

          <div className="dv-action">
            <button className="btn primary dv-process" onClick={() => setConfirm(true)}>
              <Icon name="refresh" /> ประมวลผลโอนรายการเข้าระบบรับ–จ่าย
            </button>
          </div>
        </div>

        {/* ── ผลการประมวลผลล่าสุด ── */}
        <div className="search-card dv-card">
          <div className="section-head" style={{ marginBottom: 16 }}>
            <span className="head-bar" /><h3>ผลการประมวลผลล่าสุด</h3>
          </div>
          {lastRun ? (
            <>
              <div className="dv-result-grid">
                <div className="dv-res">
                  <span className="dv-res-k">ระบบต้นทาง</span>
                  <span className="dv-res-v">{lastRun.source}</span>
                </div>
                <div className="dv-res">
                  <span className="dv-res-k">วันที่ข้อมูล</span>
                  <span className="dv-res-v mono">{fmt.date(lastRun.date)}</span>
                </div>
                <div className="dv-res">
                  <span className="dv-res-k">จำนวนรายการ</span>
                  <span className="dv-res-v mono">{fmt.int(lastRun.records)}</span>
                </div>
                <div className="dv-res accent">
                  <span className="dv-res-k">ยอดรวมที่โอนเข้า</span>
                  <span className="dv-res-v mono">฿ {fmt.money(lastRun.amount, 2)}</span>
                </div>
              </div>
              <div className="dv-result-foot">
                <span className="pill ok">สำเร็จ</span>
                <span className="muted mono" style={{ fontSize: 11 }}>ประมวลผลเมื่อ {lastRun.ts}</span>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ padding: 28 }}>
              — ยังไม่มีการประมวลผลในรอบนี้ —
            </div>
          )}
        </div>
      </div>

      {/* ── ส่วนที่ 3: กล่องยืนยันการประมวลผล ── */}
      {confirm && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirm(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
            <div className="modal-head">
              <div className="modal-warnico"><Icon name="info" /></div>
              <h2>ยืนยันการประมวลผล</h2>
              <button className="close-btn" onClick={() => setConfirm(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>
                ยืนยันการประมวลผลโอนรายการเข้าระบบรับ–จ่าย
              </p>
              <div className="dv-confirm-info">
                <div className="dv-ci-row"><span>ระบบต้นทาง</span><b>{sourceLabel}</b></div>
                <div className="dv-ci-row"><span>วันที่ต้องการโอน</span><b className="mono">{fmt.date(date)}</b></div>
              </div>
              <p className="muted" style={{ margin: '12px 0 16px', fontSize: 12, lineHeight: 1.5 }}>
                เป็นกระบวนการด้านบัญชีที่สำคัญ — โปรดตรวจสอบเงื่อนไขให้ถูกต้องก่อนกดตกลง เพื่อป้องกันการประมวลผลซ้ำซ้อน
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setConfirm(false)}>ยกเลิก</button>
                <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={doProcess}><Icon name="check" /> ตกลง</button>
              </div>
            </div>
          </div>
        </>
      )}

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}
    </div>
  );
}

Object.assign(window, { DividendTransferPage });
