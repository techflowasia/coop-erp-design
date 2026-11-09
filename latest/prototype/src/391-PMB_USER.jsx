// ════════════════════════════════════════════════════════════════════
//  ระบบงานประมวลผลและจัดเก็บ › สมาชิก
//  8 หน้าจอ (Level 3):
//    · อนุมัติลาออก              (process/resign-approve)
//    · อนุมัติเปลี่ยนแปลงค่าหุ้น  (process/share-change-approve)
//    · ปิดบัญชีสมาชิก            (process/member-close)
//    · ใบลาออก                   (process/resign-form)
//    · ใบย้ายสังกัด              (process/affil-transfer-form)
//    · ใบเปลี่ยนแปลงค่าหุ้น       (process/share-change-form)
//    · ถอนหุ้นบางส่วน            (process/share-partial-withdraw)
//    · คืนค่าหุ้น                 (process/share-refund-pay)
//  ใช้ PcxHead / PcxSec / PcxFld / PcxRO / pcxMoney จาก 374_process_credit_pages
// ════════════════════════════════════════════════════════════════════

const PMB_USER = () => window.CCD_USER || 'PEERAPOL';
const pmbDate = (d) => d ? window.fmt.date(d) : '';
const pmbNo = (prefix) => prefix + String(Math.floor(Math.random() * 9000000) + 1000000);
const pmbPill = (dec) => dec === 'yes' ? { l: 'อนุมัติ', pill: 'ok' }
  : dec === 'no' ? { l: 'ไม่อนุมัติ', pill: 'bad' } : { l: 'รอ', pill: 'warn' };

const PMB_RESIGN_REASONS = ['ลาออกจากการเป็นสมาชิก', 'เกษียณอายุราชการ', 'เสียชีวิต', 'พ้นจากการปฏิบัติงาน', 'โอนย้ายต่างหน่วยงาน'];

const PMB_RESIGN_ROWS = [
  { doc: '6900000121', reg: '061402', name: 'น.ส.วรรณี  ยิ้มบางอ้อ', unit: '10110 - ปณ.พระโขนง', reqDate: '2026-01-14', shares: 214500, debt: 0 },
  { doc: '6900000122', reg: '058935', name: 'น.ส.ธัญญพร  เล้าจิรพงศ์', unit: '04264 - ส่วนปฏิบัติการคลัง', reqDate: '2026-01-16', shares: 386200, debt: 0 },
  { doc: '6900000123', reg: '050017', name: 'นางชลธิชา  จาเกาะ', unit: '04073 - ส่วนพัฒนาโซลูชัน', reqDate: '2026-01-21', shares: 512900, debt: 148300 },
  { doc: '6900000124', reg: '046106', name: 'นายปรีชา  ยุติศรี', unit: '00555 - พ้นจากการปฏิบัติงาน', reqDate: '2026-01-23', shares: 118000, debt: 0 },
  { doc: '6900000125', reg: '051169', name: 'น.ส.พรพิมล  ฝอยทอง', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', reqDate: '2026-01-28', shares: 745300, debt: 0 },
  { doc: '6900000126', reg: '047693', name: 'น.ส.ปอร์ศิริ  ไวเรืองศรี', unit: '05090 - ฝ่ายระบบการกำกับ', reqDate: '2026-02-02', shares: 268400, debt: 62150 },
];

const PMB_SHARE_REQ_ROWS = [
  { doc: '6900000031', reg: '049614', name: 'นางวิพารัตน์  ขันสำลี', unit: '10001 - ศูนย์ไปรษณีย์สุวรรณภูมิ', reqDate: '2026-01-19', os: 'ส่งหุ้นปกติ', op: 2500, ns: 'ส่งหุ้นปกติ', np: 4000 },
  { doc: '6900000032', reg: '054480', name: 'นายโชติอนันต์  ใยสวัสดิ์', unit: '12130 - ปณ.รังสิต', reqDate: '2026-01-21', os: 'ส่งหุ้นปกติ', op: 1800, ns: 'งดส่งหุ้นรายเดือน', np: 0 },
  { doc: '6900000033', reg: '061402', name: 'น.ส.วรรณี  ยิ้มบางอ้อ', unit: '10110 - ปณ.พระโขนง', reqDate: '2026-01-26', os: 'งดส่งหุ้นรายเดือน', op: 0, ns: 'ส่งหุ้นปกติ', np: 3000 },
  { doc: '6900000034', reg: '050017', name: 'นางชลธิชา  จาเกาะ', unit: '04073 - ส่วนพัฒนาโซลูชัน', reqDate: '2026-02-03', os: 'ส่งหุ้นปกติ', op: 5000, ns: 'ส่งหุ้นปกติ', np: 7500 },
];

const PMB_CLOSE_ROWS = [
  { seq: 1, reg: '000072', name: 'นายสายัณห์  สาลีพันธ์ (ค/ก)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-21', reason: 'เสียชีวิต', blocked: false },
  { seq: 2, reg: '000899', name: 'นายประเสริฐ  จันทร์ตรี (ก 47)', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-21', reason: 'เสียชีวิต', blocked: false },
  { seq: 3, reg: '001391', name: 'นายรวม  บางโม้ (ก 45)(ตาย)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-23', reason: 'เสียชีวิต', blocked: false },
  { seq: 4, reg: '002185', name: 'นายนิสสัย  หอมหวล (ก 46)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-22', reason: 'ลาออกจากการเป็นสมาชิก', blocked: true, hold: 'มีหนี้เงินกู้สามัญคงเหลือ 148,300.00 บาท' },
  { seq: 5, reg: '004885', name: 'นายอัมพร  สีดาคำ (ตาย)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-16', reason: 'เสียชีวิต', blocked: false },
  { seq: 6, reg: '005225', name: 'นายอุทัย  จันทร์ศิริ (ก 50)(ตาย)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-14', reason: 'เสียชีวิต', blocked: false },
  { seq: 7, reg: '005339', name: 'พระสุชาติ  เกลอสูงเนิน (ก 4)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-21', reason: 'เสียชีวิต', blocked: false },
  { seq: 8, reg: '005956', name: 'นายศาสตรา  แก้วไชโย (ก 5)', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-16', reason: 'เสียชีวิต', blocked: false },
  { seq: 9, reg: '007534', name: 'นายอุเทน  ตาราช (ลาออกงาน)', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-16', reason: 'ลาออกจากการเป็นสมาชิก', blocked: true, hold: 'ค้ำประกันสัญญา ส666000455 อยู่' },
  { seq: 10, reg: '009049', name: 'นายสลิด  ผากิ่ง (ก 54)(ตาย)', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-28', reason: 'เสียชีวิต', blocked: false },
  { seq: 11, reg: '009468', name: 'นางนภากุล  เมธีธนาดำรง (ก)', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-23', reason: 'เสียชีวิต', blocked: false },
  { seq: 12, reg: '011050', name: 'นายอนุศักดิ์  ว่องวุฒิ (ค/ก)', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-14', reason: 'เสียชีวิต', blocked: false },
];

const PMB_TRANSFER_ROWS = [
  { doc: '6900000027', reg: '061402', name: 'น.ส.วรรณี  ยิ้มบางอ้อ', from: '10110 - ปณ.พระโขนง', to: '00555 - พ้นจากการปฏิบัติงาน', reqDate: '2026-02-05' },
  { doc: '6900000028', reg: '058935', name: 'น.ส.ธัญญพร  เล้าจิรพงศ์', from: '04264 - ส่วนปฏิบัติการคลัง', to: '00111 - เกษียณอายุราชการ', reqDate: '2026-02-05' },
  { doc: '6900000029', reg: '050017', name: 'นางชลธิชา  จาเกาะ', from: '04073 - ส่วนพัฒนาโซลูชัน', to: '04240 - ส่วนขายและบริการ', reqDate: '2026-02-05' },
  { doc: '6900000030', reg: '046106', name: 'นายปรีชา  ยุติศรี', from: '00555 - พ้นจากการปฏิบัติงาน', to: '00111 - เกษียณอายุราชการ', reqDate: '2026-02-05' },
];

const PMB_UNITS = [
  '00100 - กองเกษียณ (ส่วนภูมิภาค)', '00111 - เกษียณอายุราชการ', '00555 - พ้นจากการปฏิบัติงาน',
  '04073 - ส่วนพัฒนาโซลูชัน', '04240 - ส่วนขายและบริการ', '04264 - ส่วนปฏิบัติการคลัง',
  '05090 - ฝ่ายระบบการกำกับ', '10001 - ศูนย์ไปรษณีย์สุวรรณภูมิ', '10110 - ปณ.พระโขนง',
  '10209 - ศป.หลักสี่', '12130 - ปณ.รังสิต',
];

const PMB_REFUND_ROWS = [
  { reg: '000072', name: 'นายสายัณห์  สาลีพันธ์', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-21', shares: 428500, wait: 428500, status: 'รอถอน' },
  { reg: '000899', name: 'นายประเสริฐ  จันทร์ตรี', unit: '00111 - เกษียณอายุราชการ', outDate: '2026-01-21', shares: 612000, wait: 612000, status: 'รอถอน' },
  { reg: '001391', name: 'นายรวม  บางโม้', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-23', shares: 184300, wait: 184300, status: 'รอถอน' },
  { reg: '004885', name: 'นายอัมพร  สีดาคำ', unit: '00100 - กองเกษียณ (ส่วนภูมิภาค)', outDate: '2026-01-16', shares: 96700, wait: 0, status: 'ถอนแล้ว' },
];

const PMB_MONEY_TYPES = [
  { v: '01', l: 'โอนเข้าบัญชีธนาคาร' },
  { v: '02', l: 'จ่ายด้วยเช็ค' },
  { v: '03', l: 'จ่ายเงินสด' },
  { v: '04', l: 'โอนชำระหนี้สหกรณ์' },
];

// ── แถบสรุปตัวเลข ───────────────────────────────────────────────────
function PmbTotals({ items }) {
  return (
    <div className="icr-strip" style={{ marginTop: 12 }}>
      {items.map(it => (
        <PcxFld key={it.label} label={it.label} w={it.w || 170}>
          <PcxRO value={it.value} num mono danger={it.danger} />
        </PcxFld>
      ))}
    </div>
  );
}

function PmbEmpty({ colSpan, label }) {
  return (
    <tr><td colSpan={colSpan} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>{label || 'ไม่พบข้อมูล'}</td></tr>
  );
}

// ── modal ยืนยันผลการพิจารณา ────────────────────────────────────────
function PmbDecisionModal({ items, decision, title, onClose, onConfirm, cols }) {
  const { useState } = React;
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const no = decision === 'no';
  const submit = () => {
    if (no && !reason.trim()) { setErr('กรุณาระบุสาเหตุที่ไม่อนุมัติ'); return; }
    onConfirm(items, reason.trim());
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 600, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={no ? 'close' : 'check'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title} ({items.length} รายการ)</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>การดำเนินการนี้จะถูกบันทึกใน Audit Trail</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 260 }}>
            <table className="tbl">
              <thead><tr>{cols.map(c => <th key={c.k}>{c.l}</th>)}</tr></thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.doc || r.reg}>{cols.map(c => <td key={c.k} className={c.mono ? 'mono' : ''}>{c.f ? c.f(r) : r[c.k]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div></div>
          {no && (<>
            <label className="lt-modal-label" style={{ marginTop: 14 }}>สาเหตุที่ไม่อนุมัติ <span className="cfg-required">*</span></label>
            <textarea className="cfg-input" rows={3} maxLength={300} value={reason}
                      onChange={(e) => { setReason(e.target.value); setErr(''); }}
                      placeholder="เช่น ยังมีภาระหนี้/ค้ำประกันคงเหลือกับสหกรณ์" />
          </>)}
          {err && (<div className="sr-error" style={{ marginTop: 10 }}><Icon name="info" size={14} /> {err}</div>)}
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className={no ? 'btn danger' : 'btn primary'} onClick={submit}>
            <Icon name={no ? 'close' : 'check'} size={13} /> ยืนยัน{no ? 'ไม่อนุมัติ' : 'อนุมัติ'} {items.length} รายการ
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ① อนุมัติลาออก
// ════════════════════════════════════════════════════════════════════
function MemberResignApprovePage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [rows, setRows] = useState(() => PMB_RESIGN_ROWS.map(r => ({ ...r, decision: 'wait', apprDate: '', reason: '' })));
  const [tab, setTab] = useState('wait');
  const [q, setQ] = useState('');
  const [holdAtm, setHoldAtm] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const [modal, setModal] = useState(null);

  const cnt = {
    wait: rows.filter(r => r.decision === 'wait').length,
    yes: rows.filter(r => r.decision === 'yes').length,
    no: rows.filter(r => r.decision === 'no').length,
  };
  const shown = rows.filter(r => {
    if (r.decision !== tab) return false;
    if (!q.trim()) return true;
    const k = q.trim().toLowerCase();
    return [r.doc, r.reg, r.name, r.unit].some(v => String(v).toLowerCase().includes(k));
  });
  const waitRows = shown.filter(r => r.decision === 'wait');
  const selItems = shown.filter(r => sel.has(r.doc));
  const toggle = (doc) => setSel(s => { const n = new Set(s); n.has(doc) ? n.delete(doc) : n.add(doc); return n; });

  const apply = (items, decision, reason) => {
    const at = pmbDate(today);
    const ids = new Set(items.map(i => i.doc));
    setRows(rs => rs.map(r => ids.has(r.doc) ? { ...r, decision, apprDate: decision === 'yes' ? at : '', reason: reason || '' } : r));
    setSel(new Set()); setModal(null);
    audit && audit.log && audit.log({
      action: decision === 'yes' ? 'approve' : 'reject',
      module: 'ประมวลผลและจัดเก็บ — อนุมัติลาออก',
      target: items.length > 1 ? items.length + ' รายการ' : items[0].doc + ' · ' + items[0].name,
      summary: (decision === 'yes' ? 'อนุมัติลาออก ' : 'ไม่อนุมัติลาออก ') + items.length + ' คน'
        + (decision === 'yes' && holdAtm ? ' · อายัด ATM' : '') + (reason ? ' · ' + reason : ''),
      changes: items.slice(0, 12).map(r => ({ field: r.doc + ' · ' + r.name, before: 'รอ', after: decision === 'yes' ? 'อนุมัติ ' + at : 'ไม่อนุมัติ' })),
    });
    onToast && onToast((decision === 'yes' ? 'อนุมัติลาออก ' : 'ไม่อนุมัติ ') + items.length + ' รายการเรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="อนุมัติลาออก">
      <PcxHead icon="check" title="อนุมัติลาออก"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — พิจารณาใบคำร้องลาออกจากการเป็นสมาชิก"
        actions={<>
          <button className="btn primary sm" disabled={!waitRows.length} onClick={() => setModal({ items: waitRows, decision: 'yes' })}>
            <Icon name="check" size={13} /> อนุมัติทั้งหมด ({waitRows.length})
          </button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์รายการอนุมัติลาออก…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {!cnt.wait && tab === 'wait' && (
        <div className="dn-status-alert warn" style={{ marginBottom: 12 }}>
          <Icon name="info" size={15} /><span>ไม่มีข้อมูลให้อนุมัติ</span>
        </div>
      )}

      <PcxSec title="รายการใบคำร้องลาออก">
        <div className="lrq-inbox-toolbar" style={{ marginTop: 10, marginBottom: 10 }}>
          <div className="lrq-inbox-tabs">
            {[{ id: 'wait', label: 'รอ' }, { id: 'yes', label: 'อนุมัติ' }, { id: 'no', label: 'ไม่อนุมัติ' }].map(t => (
              <button key={t.id} className={'lrq-itab' + (tab === t.id ? ' active' : '')}
                      onClick={() => { setTab(t.id); setSel(new Set()); }}>
                {t.label}<span className="lrq-itab-c">{cnt[t.id]}</span>
              </button>
            ))}
          </div>
          <span className="spacer" />
          <label className="lrq-check" style={{ marginRight: 12 }}>
            <input type="checkbox" checked={holdAtm} onChange={(e) => setHoldAtm(e.target.checked)} />
            อายัด ATM เมื่ออนุมัติ
          </label>
          <div className="search lrq-inbox-search" style={{ width: 280 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ใบคำร้อง / ทะเบียน / ชื่อ-สกุล / หน่วย…" />
          </div>
        </div>

        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการที่เลือก</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setModal({ items: selItems, decision: 'yes' })}><Icon name="check" size={12} /> อนุมัติที่เลือก</button>
            <button className="btn danger sm" onClick={() => setModal({ items: selItems, decision: 'no' })}><Icon name="close" size={12} /> ไม่อนุมัติที่เลือก</button>
            <button className="btn text sm" onClick={() => setSel(new Set())}>ยกเลิกการเลือก</button>
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1150, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input type="checkbox" disabled={!waitRows.length}
                           checked={waitRows.length > 0 && waitRows.every(r => sel.has(r.doc))}
                           onChange={(e) => setSel(e.target.checked ? new Set(waitRows.map(r => r.doc)) : new Set())} />
                  </th>
                  <th>ใบคำร้อง</th><th>ทะเบียน</th><th>ชื่อ-สกุล</th><th>หน่วย</th>
                  <th>วันที่ขอลาออก</th>
                  <th style={{ textAlign: 'right' }}>ทุนเรือนหุ้น</th>
                  <th style={{ textAlign: 'right' }}>หนี้คงเหลือ</th>
                  <th>วันที่อนุมัติ</th><th>สถานะ</th><th style={{ width: 190 }}>ทำรายการ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const st = pmbPill(r.decision);
                  const wait = r.decision === 'wait';
                  return (
                    <tr key={r.doc} className={sel.has(r.doc) ? 'selected' : ''}>
                      <td><input type="checkbox" disabled={!wait} checked={sel.has(r.doc)} onChange={() => toggle(r.doc)} /></td>
                      <td className="mono">{r.doc}</td>
                      <td className="mono">{r.reg}</td>
                      <td>{r.name}</td>
                      <td>{r.unit}</td>
                      <td className="mono">{pmbDate(r.reqDate)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.shares)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{r.debt ? pcxMoney(r.debt) : '—'}</td>
                      <td className="mono">{r.apprDate || '—'}</td>
                      <td><span className={'pill ' + st.pill}>{st.l}</span></td>
                      <td>
                        {wait ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn primary sm" onClick={() => setModal({ items: [r], decision: 'yes' })}><Icon name="check" size={12} /> อนุมัติ</button>
                            <button className="btn danger sm" onClick={() => setModal({ items: [r], decision: 'no' })}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
                          </div>
                        ) : <span className="muted" style={{ fontSize: 11.5 }}>{r.reason || 'พิจารณาแล้ว'}</span>}
                      </td>
                    </tr>
                  );
                })}
                {!shown.length && <PmbEmpty colSpan={11} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>

      {modal && (
        <PmbDecisionModal items={modal.items} decision={modal.decision}
          title={modal.decision === 'yes' ? 'ยืนยันการอนุมัติลาออก' : 'ไม่อนุมัติลาออก'}
          cols={[{ k: 'doc', l: 'ใบคำร้อง', mono: true }, { k: 'reg', l: 'ทะเบียน', mono: true }, { k: 'name', l: 'ชื่อ-สกุล' },
                 { k: 'shares', l: 'ทุนเรือนหุ้น', mono: true, f: (r) => pcxMoney(r.shares) }]}
          onClose={() => setModal(null)}
          onConfirm={(items, reason) => apply(items, modal.decision, reason)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ② อนุมัติเปลี่ยนแปลงค่าหุ้น
// ════════════════════════════════════════════════════════════════════
function ShareChangeApprovePage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const [rows, setRows] = useState(() => PMB_SHARE_REQ_ROWS.map(r => ({ ...r, decision: 'wait', reason: '' })));
  const [tab, setTab] = useState('wait');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [modal, setModal] = useState(null);

  const cnt = {
    wait: rows.filter(r => r.decision === 'wait').length,
    yes: rows.filter(r => r.decision === 'yes').length,
    no: rows.filter(r => r.decision === 'no').length,
  };
  const shown = rows.filter(r => r.decision === tab && (!q.trim()
    || [r.doc, r.reg, r.name].some(v => String(v).toLowerCase().includes(q.trim().toLowerCase()))));
  const waitRows = shown.filter(r => r.decision === 'wait');
  const selItems = shown.filter(r => sel.has(r.doc));
  const toggle = (doc) => setSel(s => { const n = new Set(s); n.has(doc) ? n.delete(doc) : n.add(doc); return n; });

  const apply = (items, decision, reason) => {
    const ids = new Set(items.map(i => i.doc));
    setRows(rs => rs.map(r => ids.has(r.doc) ? { ...r, decision, reason: reason || '' } : r));
    setSel(new Set()); setModal(null);
    audit && audit.log && audit.log({
      action: decision === 'yes' ? 'approve' : 'reject',
      module: 'ประมวลผลและจัดเก็บ — อนุมัติเปลี่ยนแปลงค่าหุ้น',
      target: items.length > 1 ? items.length + ' รายการ' : items[0].doc + ' · ' + items[0].name,
      summary: (decision === 'yes' ? 'อนุมัติ' : 'ไม่อนุมัติ') + 'คำขอเปลี่ยนแปลงค่าหุ้น ' + items.length + ' รายการ' + (reason ? ' · ' + reason : ''),
      changes: items.slice(0, 12).map(r => ({
        field: r.doc + ' · ' + r.name,
        before: r.os + ' ' + pcxMoney(r.op) + ' บาท/เดือน',
        after: r.ns + ' ' + pcxMoney(r.np) + ' บาท/เดือน',
      })),
    });
    onToast && onToast((decision === 'yes' ? 'อนุมัติ ' : 'ไม่อนุมัติ ') + items.length + ' รายการเรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="อนุมัติเปลี่ยนแปลงค่าหุ้น">
      <PcxHead icon="check" title="อนุมัติเปลี่ยนแปลงค่าหุ้น"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — พิจารณาคำขอเปลี่ยนแปลงค่าหุ้นรายเดือนของสมาชิก"
        actions={<>
          <button className="btn primary sm" disabled={!waitRows.length} onClick={() => setModal({ items: waitRows, decision: 'yes' })}>
            <Icon name="check" size={13} /> อนุมัติทั้งหมด ({waitRows.length})
          </button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์รายการอนุมัติเปลี่ยนแปลงค่าหุ้น…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      <PcxSec title="รายการคำขอเปลี่ยนแปลงค่าหุ้น">
        <div className="lrq-inbox-toolbar" style={{ marginTop: 10, marginBottom: 10 }}>
          <div className="lrq-inbox-tabs">
            {[{ id: 'wait', label: 'รอ' }, { id: 'yes', label: 'อนุมัติ' }, { id: 'no', label: 'ไม่อนุมัติ' }].map(t => (
              <button key={t.id} className={'lrq-itab' + (tab === t.id ? ' active' : '')}
                      onClick={() => { setTab(t.id); setSel(new Set()); }}>
                {t.label}<span className="lrq-itab-c">{cnt[t.id]}</span>
              </button>
            ))}
          </div>
          <span className="spacer" />
          <div className="search lrq-inbox-search" style={{ width: 280 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เลขที่คำขอ / ทะเบียน / ชื่อ-ชื่อสกุล…" />
          </div>
        </div>

        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการที่เลือก</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setModal({ items: selItems, decision: 'yes' })}><Icon name="check" size={12} /> อนุมัติที่เลือก</button>
            <button className="btn danger sm" onClick={() => setModal({ items: selItems, decision: 'no' })}><Icon name="close" size={12} /> ไม่อนุมัติที่เลือก</button>
            <button className="btn text sm" onClick={() => setSel(new Set())}>ยกเลิกการเลือก</button>
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1150, fontSize: 12 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ width: 38 }}>
                    <input type="checkbox" disabled={!waitRows.length}
                           checked={waitRows.length > 0 && waitRows.every(r => sel.has(r.doc))}
                           onChange={(e) => setSel(e.target.checked ? new Set(waitRows.map(r => r.doc)) : new Set())} />
                  </th>
                  <th rowSpan={2}>เลขที่คำขอ</th><th rowSpan={2}>ทะเบียน</th><th rowSpan={2}>ชื่อ-ชื่อสกุล</th>
                  <th rowSpan={2}>หน่วย</th><th rowSpan={2}>วันที่ขอ</th>
                  <th colSpan={2} style={{ textAlign: 'center' }}>ก่อนเปลี่ยนแปลง</th>
                  <th colSpan={2} style={{ textAlign: 'center' }}>หลังเปลี่ยนแปลง</th>
                  <th rowSpan={2}>สถานะ</th><th rowSpan={2} style={{ width: 190 }}>ทำรายการ</th>
                </tr>
                <tr>
                  <th>สถานะการส่ง</th><th style={{ textAlign: 'right' }}>หุ้น/เดือน</th>
                  <th>สถานะการส่ง</th><th style={{ textAlign: 'right' }}>หุ้น/เดือน</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const st = pmbPill(r.decision);
                  const wait = r.decision === 'wait';
                  return (
                    <tr key={r.doc} className={sel.has(r.doc) ? 'selected' : ''}>
                      <td><input type="checkbox" disabled={!wait} checked={sel.has(r.doc)} onChange={() => toggle(r.doc)} /></td>
                      <td className="mono">{r.doc}</td>
                      <td className="mono">{r.reg}</td>
                      <td>{r.name}</td>
                      <td>{r.unit}</td>
                      <td className="mono">{pmbDate(r.reqDate)}</td>
                      <td>{r.os}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.op)}</td>
                      <td>{r.ns}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.np)}</td>
                      <td><span className={'pill ' + st.pill}>{st.l}</span></td>
                      <td>
                        {wait ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn primary sm" onClick={() => setModal({ items: [r], decision: 'yes' })}><Icon name="check" size={12} /> อนุมัติ</button>
                            <button className="btn danger sm" onClick={() => setModal({ items: [r], decision: 'no' })}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
                          </div>
                        ) : <span className="muted" style={{ fontSize: 11.5 }}>{r.reason || 'พิจารณาแล้ว'}</span>}
                      </td>
                    </tr>
                  );
                })}
                {!shown.length && <PmbEmpty colSpan={12} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>

      {modal && (
        <PmbDecisionModal items={modal.items} decision={modal.decision}
          title={modal.decision === 'yes' ? 'ยืนยันการอนุมัติเปลี่ยนแปลงค่าหุ้น' : 'ไม่อนุมัติเปลี่ยนแปลงค่าหุ้น'}
          cols={[{ k: 'doc', l: 'เลขที่คำขอ', mono: true }, { k: 'name', l: 'ชื่อ-ชื่อสกุล' },
                 { k: 'op', l: 'เดิม', mono: true, f: (r) => pcxMoney(r.op) },
                 { k: 'np', l: 'ใหม่', mono: true, f: (r) => pcxMoney(r.np) },
                 { k: 'ns', l: 'สถานะใหม่' }]}
          onClose={() => setModal(null)}
          onConfirm={(items, reason) => apply(items, modal.decision, reason)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ③ ปิดบัญชีสมาชิก
// ════════════════════════════════════════════════════════════════════
function MemberCloseAccountPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const [rows, setRows] = useState(() => PMB_CLOSE_ROWS.map(r => ({ ...r, closed: false })));
  const [sel, setSel] = useState(() => new Set(PMB_CLOSE_ROWS.filter(r => !r.blocked).map(r => r.reg)));
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(false);

  const shown = rows.filter(r => !q.trim() || [r.reg, r.name, r.unit, r.reason].some(v => String(v).toLowerCase().includes(q.trim().toLowerCase())));
  const openRows = shown.filter(r => !r.blocked && !r.closed);
  const selItems = openRows.filter(r => sel.has(r.reg));
  const toggle = (reg) => setSel(s => { const n = new Set(s); n.has(reg) ? n.delete(reg) : n.add(reg); return n; });

  const doClose = () => {
    const ids = new Set(selItems.map(r => r.reg));
    setRows(rs => rs.map(r => ids.has(r.reg) ? { ...r, closed: true } : r));
    setSel(new Set()); setConfirm(false);
    audit && audit.log && audit.log({
      action: 'update', module: 'ประมวลผลและจัดเก็บ — ปิดบัญชีสมาชิก',
      target: selItems.length + ' คน',
      summary: 'ปิดบัญชีสมาชิก ' + selItems.length + ' คน',
      changes: selItems.slice(0, 12).map(r => ({ field: r.reg + ' · ' + r.name, before: 'ลาออก (ยังไม่ปิดบัญชี)', after: 'ปิดบัญชีแล้ว' })),
    });
    onToast && onToast('ปิดบัญชีสมาชิก ' + selItems.length + ' คน เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ปิดบัญชีสมาชิก">
      <PcxHead icon="members" title="ปิดบัญชีสมาชิก"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — ปิดบัญชีสมาชิกที่ลาออก/พ้นสภาพ และไม่มีภาระคงเหลือกับสหกรณ์"
        actions={<>
          <button className="btn primary sm" disabled={!selItems.length} onClick={() => setConfirm(true)}>
            <Icon name="check" size={13} /> ปิดบัญชีที่เลือก ({selItems.length})
          </button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์รายชื่อปิดบัญชีสมาชิก…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      <div className="dn-status-alert warn" style={{ marginBottom: 12 }}>
        <Icon name="info" size={15} />
        <span><b>หมายเหตุ</b> บรรทัดสีขาวเป็นรายชื่อสมาชิกที่สามารถปิดบัญชีได้ · บรรทัดสีเทายังปิดบัญชีไม่ได้ เนื่องจากมีภาระกับสหกรณ์</span>
      </div>

      <PcxSec title="รายชื่อสมาชิกที่รอปิดบัญชี">
        <div className="lrq-inbox-toolbar" style={{ marginTop: 10, marginBottom: 10 }}>
          <span className="muted" style={{ fontSize: 11.5 }}>
            ปิดบัญชีได้ {rows.filter(r => !r.blocked && !r.closed).length} คน · ติดภาระ {rows.filter(r => r.blocked).length} คน · ปิดบัญชีแล้ว {rows.filter(r => r.closed).length} คน
          </span>
          <span className="spacer" />
          <div className="search lrq-inbox-search" style={{ width: 300 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ทะเบียน / ชื่อ-สกุล / สังกัด / สาเหตุ…" />
          </div>
        </div>

        <div className="table-wrap">
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1150, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input type="checkbox" disabled={!openRows.length}
                           checked={openRows.length > 0 && openRows.every(r => sel.has(r.reg))}
                           onChange={(e) => setSel(e.target.checked ? new Set(openRows.map(r => r.reg)) : new Set())} />
                  </th>
                  <th style={{ width: 56 }}>ลำดับ</th><th>ทะเบียน</th><th>ชื่อ - สกุล</th><th>สังกัด</th>
                  <th>วันที่ลาออก</th><th>สาเหตุลาออก</th><th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.reg} className={sel.has(r.reg) ? 'selected' : ''}
                      style={r.blocked ? { background: '#FAFAFA', color: 'rgba(0,0,0,.45)' } : undefined}>
                    <td><input type="checkbox" disabled={r.blocked || r.closed} checked={sel.has(r.reg)} onChange={() => toggle(r.reg)} /></td>
                    <td className="mono">{r.seq}</td>
                    <td className="mono">{r.reg}</td>
                    <td>{r.name}</td>
                    <td>{r.unit}</td>
                    <td className="mono">{pmbDate(r.outDate)}</td>
                    <td>{r.reason}</td>
                    <td>
                      {r.closed ? <span className="pill ok">ปิดบัญชีแล้ว</span>
                        : r.blocked ? <span className="pill bad">ปิดบัญชีไม่ได้</span>
                        : <span className="pill warn">รอปิดบัญชี</span>}
                      {r.blocked && r.hold && <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{r.hold}</div>}
                    </td>
                  </tr>
                ))}
                {!shown.length && <PmbEmpty colSpan={8} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>

      {confirm && (
        <PmbDecisionModal items={selItems} decision="yes" title="ยืนยันการปิดบัญชีสมาชิก"
          cols={[{ k: 'reg', l: 'ทะเบียน', mono: true }, { k: 'name', l: 'ชื่อ - สกุล' },
                 { k: 'outDate', l: 'วันที่ลาออก', mono: true, f: (r) => pmbDate(r.outDate) }, { k: 'reason', l: 'สาเหตุลาออก' }]}
          onClose={() => setConfirm(false)} onConfirm={doClose} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ④ ใบลาออก
// ════════════════════════════════════════════════════════════════════
function MemberResignFormPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [outDate, setOutDate] = useState(today);
  const [reason, setReason] = useState(PMB_RESIGN_REASONS[0]);
  const [note, setNote] = useState('');
  const [instant, setInstant] = useState(false);
  const [holdAtm, setHoldAtm] = useState(true);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const shares = member ? (Number(member.shares) || 0) : 0;
  const debts = member && member.debts ? member.debts : [];
  const debtTotal = debts.reduce((s, d) => s + (Number(d.outstanding) || Number(d.principalDue) || 0), 0);
  const net = shares - debtTotal;

  const clear = () => { setMember(null); setOutDate(today); setReason(PMB_RESIGN_REASONS[0]); setNote(''); setSavedNo(''); setError(''); };

  const doSave = () => {
    if (!member) { setError('กรุณาเลือกทะเบียนสมาชิกก่อนบันทึก'); return; }
    if (!outDate) { setError('กรุณาระบุวันที่ลาออก'); return; }
    setError('');
    const no = pmbNo('69');
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ใบลาออก',
      target: member.code + ' · ' + member.name,
      summary: no + ' · ลาออก ' + pmbDate(outDate) + ' · ' + reason + (instant ? ' · อนุมัติทันที' : ''),
      changes: [
        { field: 'วันที่ลาออก', before: '—', after: pmbDate(outDate) },
        { field: 'สาเหตุลาออก', before: '—', after: reason },
        { field: 'อายัด ATM', before: '—', after: holdAtm ? 'อายัด' : 'ไม่อายัด' },
      ],
    });
    onToast && onToast('บันทึกใบลาออกเลขที่ ' + no + ' เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ใบลาออก">
      <PcxHead icon="edit" title="ใบลาออก"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — บันทึกใบคำร้องลาออกจากการเป็นสมาชิก"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบลาออก…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {savedNo && (
        <div className="dn-status-alert" style={{ marginBottom: 12 }}>
          <Icon name="check" size={15} /><span>บันทึกใบลาออกเลขที่ <b className="mono">{savedNo}</b> แล้ว {instant ? '· อนุมัติทันที' : '· รออนุมัติ'}</span>
        </div>
      )}

      <PcxSec title="ข้อมูลใบลาออก">
        <div className="icr-strip">
          <PcxFld label="เลขที่เอกสาร" w={160}><PcxRO value={savedNo} mono placeholder="(ระบบออกเลขเมื่อบันทึก)" /></PcxFld>
          <PcxFld label="วันที่ทำรายการ" w={140}><PcxRO value={pmbDate(today)} mono /></PcxFld>
          <PcxFld label="ผู้ทำรายการ" w={150}><PcxRO value={PMB_USER()} /></PcxFld>
          <PcxFld label="ทะเบียน" w={260} required>
            <MemberSearchField member={member} source={window.DN_MEMBERS}
                               onPick={(m) => { setMember(m); setSavedNo(''); setError(''); }}
                               title="ค้นหาสมาชิก — ใบลาออก" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="สังกัด" grow w={200}><PcxRO value={member ? (member.dept || '—') : ''} /></PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="วันที่ลาออก" w={165} required>
            <ErpDate value={outDate} onChange={(v) => ((e) => { setOutDate(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="สาเหตุลาออก" w={230}>
            <select className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)}>
              {PMB_RESIGN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="การอนุมัติ" w={170}>
            <label className="lrq-check"><input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} /> อนุมัติทันที</label>
          </PcxFld>
          <PcxFld label="บัตร ATM" w={150}>
            <label className="lrq-check"><input type="checkbox" checked={holdAtm} onChange={(e) => setHoldAtm(e.target.checked)} /> อายัด ATM</label>
          </PcxFld>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lt-modal-label">หมายเหตุ</label>
          <textarea className="cfg-input" rows={3} value={note} maxLength={400}
                    onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติมของคำร้องลาออก" />
        </div>
      </PcxSec>

      <PcxSec title="ภาระคงเหลือกับสหกรณ์" style={{ marginTop: 12 }}>
        <PmbTotals items={[
          { label: 'ทุนเรือนหุ้น', value: pcxMoney(shares) },
          { label: 'หนี้คงเหลือรวม', value: pcxMoney(debtTotal), danger: debtTotal > 0 },
          { label: 'คงเหลือสุทธิ', value: pcxMoney(net), w: 180 },
          { label: 'จำนวนสัญญาคงเหลือ', value: debts.length + ' สัญญา', w: 150 },
        ]} />
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr><th>เลขที่สัญญา</th><th>ประเภทเงินกู้</th>
                  <th style={{ textAlign: 'right' }}>เงินต้นคงเหลือ</th>
                  <th style={{ textAlign: 'right' }}>ดอกเบี้ยค้าง</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                {debts.map(d => (
                  <tr key={d.contractNo}>
                    <td className="mono">{d.contractNo}</td>
                    <td>{d.type || d.loanType || '—'}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(d.outstanding || d.principalDue || 0)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(d.interestDue || 0)}</td>
                    <td>{d.status || 'ปกติ'}</td>
                  </tr>
                ))}
                {!debts.length && <PmbEmpty colSpan={5} label={member ? 'ไม่มีสัญญาคงเหลือ' : 'เลือกสมาชิกเพื่อแสดงภาระคงเหลือ'} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ⑤ ใบย้ายสังกัด
// ════════════════════════════════════════════════════════════════════
function AffilTransferFormPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [effDate, setEffDate] = useState(today);
  const [note, setNote] = useState('');
  const [instant, setInstant] = useState(false);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');
  const [rows, setRows] = useState(() => PMB_TRANSFER_ROWS.map(r => ({ ...r, decision: 'wait' })));

  const pick = (m) => {
    setMember(m); setSavedNo(''); setError('');
    setFromUnit(m && m.dept ? m.dept : '');
  };
  const clear = () => { setMember(null); setFromUnit(''); setToUnit(''); setEffDate(today); setNote(''); setSavedNo(''); setError(''); };

  const doSave = () => {
    if (!member) { setError('กรุณาเลือกทะเบียนสมาชิกก่อนบันทึก'); return; }
    if (!toUnit) { setError('กรุณาระบุสังกัดใหม่'); return; }
    if (toUnit === fromUnit) { setError('สังกัดใหม่ต้องไม่ซ้ำกับสังกัดเดิม'); return; }
    setError('');
    const no = pmbNo('69');
    setSavedNo(no);
    setRows(rs => [{
      doc: no, reg: member.code, name: member.name, from: fromUnit || '—', to: toUnit,
      reqDate: effDate, decision: instant ? 'yes' : 'wait',
    }, ...rs]);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ใบย้ายสังกัด',
      target: member.code + ' · ' + member.name,
      summary: no + ' · ย้ายสังกัด ' + (fromUnit || '—') + ' → ' + toUnit + ' มีผล ' + pmbDate(effDate),
      changes: [{ field: 'สังกัด', before: fromUnit || '—', after: toUnit }],
    });
    onToast && onToast('บันทึกใบย้ายสังกัดเลขที่ ' + no + ' เรียบร้อยแล้ว');
  };

  const decide = (doc, decision) => {
    setRows(rs => rs.map(r => r.doc === doc ? { ...r, decision } : r));
    onToast && onToast(decision === 'yes' ? 'อนุมัติย้ายสังกัดเรียบร้อยแล้ว' : 'บันทึกผลไม่อนุมัติแล้ว');
  };

  return (
    <div data-screen-label="ใบย้ายสังกัด">
      <PcxHead icon="members" title="ใบย้ายสังกัด"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — บันทึกคำขอย้ายสังกัด/หน่วยงานของสมาชิก"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบย้ายสังกัด…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลใบย้ายสังกัด">
        <div className="icr-strip">
          <PcxFld label="เลขที่คำขอ" w={160}><PcxRO value={savedNo} mono placeholder="(ระบบออกเลขเมื่อบันทึก)" /></PcxFld>
          <PcxFld label="วันที่ทำรายการ" w={140}><PcxRO value={pmbDate(today)} mono /></PcxFld>
          <PcxFld label="ผู้ทำรายการ" w={150}><PcxRO value={PMB_USER()} /></PcxFld>
          <PcxFld label="ทะเบียน" w={260} required>
            <MemberSearchField member={member} source={window.DN_MEMBERS} onPick={pick} title="ค้นหาสมาชิก — ใบย้ายสังกัด" />
          </PcxFld>
          <PcxFld label="ชื่อ-สกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="สังกัดเดิม" w={280}><PcxRO value={fromUnit} placeholder="(ตามทะเบียนสมาชิก)" /></PcxFld>
          <PcxFld label="สังกัดใหม่" w={280} required>
            <select className="cfg-input" value={toUnit} onChange={(e) => { setToUnit(e.target.value); setError(''); }}>
              <option value="">— เลือกสังกัดใหม่ —</option>
              {PMB_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="วันที่มีผล" w={165} required>
            <ErpDate value={effDate} onChange={(v) => ((e) => setEffDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="การอนุมัติ" w={170}>
            <label className="lrq-check"><input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} /> อนุมัติทันที</label>
          </PcxFld>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lt-modal-label">หมายเหตุ</label>
          <textarea className="cfg-input" rows={3} value={note} maxLength={400}
                    onChange={(e) => setNote(e.target.value)} placeholder="เช่น คำสั่งย้ายเลขที่ / หน่วยงานต้นสังกัดใหม่" />
        </div>
      </PcxSec>

      <PcxSec title="คำขอย้ายสังกัดล่าสุด" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1100, fontSize: 12 }}>
              <thead>
                <tr><th>เลขที่คำขอ</th><th>ทะเบียน</th><th>ชื่อ-สกุล</th><th>สังกัดเดิม</th><th>สังกัดใหม่</th>
                  <th>วันที่มีผล</th><th>สถานะ</th><th style={{ width: 190 }}>ทำรายการ</th></tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const st = pmbPill(r.decision);
                  return (
                    <tr key={r.doc}>
                      <td className="mono">{r.doc}</td>
                      <td className="mono">{r.reg}</td>
                      <td>{r.name}</td>
                      <td>{r.from}</td>
                      <td>{r.to}</td>
                      <td className="mono">{pmbDate(r.reqDate)}</td>
                      <td><span className={'pill ' + st.pill}>{st.l}</span></td>
                      <td>
                        {r.decision === 'wait' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn primary sm" onClick={() => decide(r.doc, 'yes')}><Icon name="check" size={12} /> อนุมัติ</button>
                            <button className="btn danger sm" onClick={() => decide(r.doc, 'no')}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
                          </div>
                        ) : <span className="muted" style={{ fontSize: 11.5 }}>พิจารณาแล้ว</span>}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && <PmbEmpty colSpan={8} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ⑥ ใบเปลี่ยนแปลงค่าหุ้น
// ════════════════════════════════════════════════════════════════════
const PMB_SEND_STATUS = ['ส่งหุ้นปกติ', 'งดส่งหุ้นรายเดือน'];

function ShareChangeFormPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [newStatus, setNewStatus] = useState(PMB_SEND_STATUS[0]);
  const [newPerMonth, setNewPerMonth] = useState('');
  const [note, setNote] = useState('');
  const [instant, setInstant] = useState(false);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  const share = member && member.shares && member.shares.length ? member.shares[0] : null;
  const curStatus = share ? (share.sendStatus === 'ปกติ' ? 'ส่งหุ้นปกติ' : 'งดส่งหุ้นรายเดือน') : 'ส่งหุ้นปกติ';
  const curPerMonth = share ? Number(share.perMonth) || 0 : (member ? 0 : 0);
  const shareCapital = member ? (Number(member.shares) || (share ? Number(share.shareValue) || 0 : 0)) : 0;
  const term = share ? share.term : 0;

  const pick = (m) => {
    setMember(m); setSavedNo(''); setError('');
    const s = m && m.shares && m.shares.length ? m.shares[0] : null;
    setNewStatus(s && s.sendStatus !== 'ปกติ' ? 'งดส่งหุ้นรายเดือน' : 'ส่งหุ้นปกติ');
    setNewPerMonth(s ? String(Number(s.perMonth) || 0) : '');
  };
  const clear = () => { setMember(null); setNewPerMonth(''); setNote(''); setSavedNo(''); setError(''); };

  const doSave = () => {
    if (!member) { setError('กรุณาเลือกทะเบียนสมาชิกก่อนบันทึก'); return; }
    const np = newStatus === 'งดส่งหุ้นรายเดือน' ? 0 : Number(newPerMonth) || 0;
    if (newStatus === 'ส่งหุ้นปกติ' && np <= 0) { setError('กรุณาระบุค่าหุ้นรายเดือนใหม่'); return; }
    if (np === curPerMonth && newStatus === curStatus) { setError('ยังไม่มีการเปลี่ยนแปลงจากค่าเดิม'); return; }
    setError('');
    const no = pmbNo('69');
    setSavedNo(no);
    setHistory(h => [{ doc: no, capital: shareCapital, term, perMonth: np, status: newStatus, note: note || '—' }, ...h]);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ใบเปลี่ยนแปลงค่าหุ้น',
      target: member.code + ' · ' + member.name,
      summary: no + ' · ' + curStatus + ' ' + pcxMoney(curPerMonth) + ' → ' + newStatus + ' ' + pcxMoney(np) + ' บาท/เดือน' + (instant ? ' · อนุมัติทันที' : ''),
      changes: [
        { field: 'สถานะการส่ง', before: curStatus, after: newStatus },
        { field: 'หุ้น/เดือน', before: pcxMoney(curPerMonth), after: pcxMoney(np) },
      ],
    });
    onToast && onToast('บันทึกใบเปลี่ยนแปลงค่าหุ้นเลขที่ ' + no + ' เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ใบเปลี่ยนแปลงค่าหุ้น">
      <PcxHead icon="shares" title="ใบเปลี่ยนแปลงค่าหุ้น"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — บันทึกคำขอเปลี่ยนแปลงค่าหุ้นรายเดือน / งดส่งหุ้น"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบเปลี่ยนแปลงค่าหุ้น…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลใบเปลี่ยนแปลงค่าหุ้น">
        <div className="icr-strip">
          <PcxFld label="เลขที่เอกสาร" w={160}><PcxRO value={savedNo} mono placeholder="(ระบบออกเลขเมื่อบันทึก)" /></PcxFld>
          <PcxFld label="วันที่เปลี่ยน" w={140}><PcxRO value={pmbDate(today)} mono /></PcxFld>
          <PcxFld label="ผู้ทำรายการ" w={150}><PcxRO value={PMB_USER()} /></PcxFld>
          <PcxFld label="ทะเบียน" w={260} required>
            <MemberSearchField member={member} source={window.DN_MEMBERS} onPick={pick} title="ค้นหาสมาชิก — ใบเปลี่ยนแปลงค่าหุ้น" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="หน่วย" grow w={180}><PcxRO value={member ? (member.dept || '—') : ''} /></PcxFld>
          <PcxFld label="การอนุมัติ" w={150}>
            <label className="lrq-check"><input type="checkbox" checked={instant} onChange={(e) => setInstant(e.target.checked)} /> อนุมัติทันที</label>
          </PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="รายละเอียดหุ้น" style={{ marginTop: 12 }}>
        <PmbTotals items={[
          { label: 'ทุนเรือนหุ้น', value: pcxMoney(shareCapital) },
          { label: 'งวดหุ้น', value: term ? term + ' งวด' : '—', w: 130 },
          { label: 'หุ้น/เดือน (ปัจจุบัน)', value: pcxMoney(curPerMonth), w: 180 },
          { label: 'สถานะการส่ง (ปัจจุบัน)', value: member ? curStatus : '—', w: 200 },
        ]} />
      </PcxSec>

      <PcxSec title="รายละเอียดการเปลี่ยนแปลง" style={{ marginTop: 12 }}>
        <div className="icr-strip">
          <PcxFld label="ก่อนเปลี่ยนแปลง — สถานะการส่ง" w={230}><PcxRO value={member ? curStatus : ''} /></PcxFld>
          <PcxFld label="ก่อนเปลี่ยนแปลง — หุ้น/เดือน" w={200}><PcxRO value={pcxMoney(curPerMonth)} num mono /></PcxFld>
          <PcxFld label="หลังเปลี่ยนแปลง — สถานะการส่ง" w={230} required>
            <select className="cfg-input" value={newStatus}
                    onChange={(e) => { setNewStatus(e.target.value); if (e.target.value === 'งดส่งหุ้นรายเดือน') setNewPerMonth('0'); setError(''); }}>
              {PMB_SEND_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="หลังเปลี่ยนแปลง — หุ้น/เดือน" w={200} required>
            <input className="cfg-input" type="number" min="0" step="50" value={newPerMonth}
                   disabled={newStatus === 'งดส่งหุ้นรายเดือน'}
                   onChange={(e) => { setNewPerMonth(e.target.value); setError(''); }} placeholder="0.00" />
          </PcxFld>
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="lt-modal-label">หมายเหตุ</label>
          <textarea className="cfg-input" rows={3} value={note} maxLength={400}
                    onChange={(e) => setNote(e.target.value)} placeholder="เหตุผลการเปลี่ยนแปลงค่าหุ้น" />
        </div>
      </PcxSec>

      <PcxSec title="ประวัติการเปลี่ยนแปลง" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ fontSize: 12 }}>
              <thead>
                <tr><th>เลขที่เอกสาร</th>
                  <th style={{ textAlign: 'right' }}>ทุนเรือนหุ้น</th><th>งวดหุ้น</th>
                  <th style={{ textAlign: 'right' }}>หุ้น/เดือน</th><th>สถานะ</th><th>หมายเหตุ</th></tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.doc}>
                    <td className="mono">{h.doc}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(h.capital)}</td>
                    <td className="mono">{h.term || '—'}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(h.perMonth)}</td>
                    <td>{h.status}</td>
                    <td>{h.note}</td>
                  </tr>
                ))}
                {!history.length && <PmbEmpty colSpan={6} label="ยังไม่มีประวัติการเปลี่ยนแปลง" />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ⑦ ถอนหุ้นบางส่วน
// ════════════════════════════════════════════════════════════════════
function SharePartialWithdrawPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [payType, setPayType] = useState(PMB_MONEY_TYPES[0].v);
  const [bank, setBank] = useState('');
  const [branch, setBranch] = useState('');
  const [acctNo, setAcctNo] = useState('');
  const [payDate, setPayDate] = useState(today);
  const [period, setPeriod] = useState(String(pcxBE()) + '02');
  const [pair, setPair] = useState('');
  const [amount, setAmount] = useState('');
  const [debtPay, setDebtPay] = useState({});
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const shareCapital = member ? (Number(member.shares) || 0) : 0;
  const debts = member && member.debts ? member.debts : [];
  const withdraw = Number(amount) || 0;
  const toDebt = debts.reduce((s, d) => s + (Number(debtPay[d.contractNo]) || 0), 0);
  const netShare = shareCapital - withdraw;
  const netCash = withdraw - toDebt;

  const pick = (m) => { setMember(m); setSavedNo(''); setError(''); setAmount(''); setDebtPay({}); };
  const clear = () => { setMember(null); setAmount(''); setDebtPay({}); setBank(''); setBranch(''); setAcctNo(''); setPair(''); setSavedNo(''); setError(''); };

  const doSave = () => {
    if (!member) { setError('กรุณาเลือกทะเบียนสมาชิกก่อนบันทึก'); return; }
    if (withdraw <= 0) { setError('กรุณาระบุยอดถอนหุ้น'); return; }
    if (withdraw > shareCapital) { setError('ยอดถอนต้องไม่เกินทุนเรือนหุ้นคงเหลือ'); return; }
    if (toDebt > withdraw) { setError('ยอดโอนชำระหนี้ต้องไม่เกินยอดถอน'); return; }
    if (payType === '01' && (!bank.trim() || !acctNo.trim())) { setError('กรุณาระบุธนาคารและเลขที่บัญชีสำหรับการโอนเงิน'); return; }
    setError('');
    const no = pmbNo('SW69');
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ถอนหุ้นบางส่วน',
      target: member.code + ' · ' + member.name,
      summary: no + ' · ถอนหุ้น ' + pcxMoney(withdraw) + ' บาท · โอนชำระหนี้ ' + pcxMoney(toDebt) + ' บาท · จ่ายสุทธิ ' + pcxMoney(netCash) + ' บาท',
      changes: [
        { field: 'ทุนเรือนหุ้น', before: pcxMoney(shareCapital), after: pcxMoney(netShare) },
        { field: 'ยอดถอน', before: '—', after: pcxMoney(withdraw) },
        { field: 'ยอดโอนชำระหนี้', before: '—', after: pcxMoney(toDebt) },
      ],
    });
    onToast && onToast('บันทึกรายการถอนหุ้นบางส่วนเลขที่ ' + no + ' เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ถอนหุ้นบางส่วน">
      <PcxHead icon="money" title="ถอนหุ้นบางส่วน"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — ถอนทุนเรือนหุ้นบางส่วน พร้อมโอนชำระหนี้คงเหลือ"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบถอนหุ้นบางส่วน…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {savedNo && (
        <div className="dn-status-alert" style={{ marginBottom: 12 }}>
          <Icon name="check" size={15} /><span>บันทึกรายการเลขที่ <b className="mono">{savedNo}</b> · จ่ายสุทธิ {pcxMoney(netCash)} บาท</span>
        </div>
      )}

      <PcxSec title="ข้อมูลสมาชิก">
        <div className="icr-strip">
          <PcxFld label="ทะเบียน" w={260} required>
            <MemberSearchField member={member} source={window.DN_MEMBERS} onPick={pick} title="ค้นหาสมาชิก — ถอนหุ้นบางส่วน" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="สังกัด" grow w={200}><PcxRO value={member ? (member.dept || '—') : ''} /></PcxFld>
          <PcxFld label="ผู้ทำรายการ" w={150}><PcxRO value={PMB_USER()} /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="รายละเอียดการจ่ายเงิน" style={{ marginTop: 12 }}>
        <div className="icr-strip">
          <PcxFld label="ประเภทเงิน" w={230}>
            <select className="cfg-input" value={payType} onChange={(e) => { setPayType(e.target.value); setError(''); }}>
              {PMB_MONEY_TYPES.map(t => <option key={t.v} value={t.v}>{t.v} · {t.l}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="ธนาคาร" w={200}>
            <input className="cfg-input" value={bank} onChange={(e) => { setBank(e.target.value); setError(''); }} placeholder="เช่น ธนาคารกรุงไทย" />
          </PcxFld>
          <PcxFld label="สาขา" w={180}>
            <input className="cfg-input" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="สาขา" />
          </PcxFld>
          <PcxFld label="วันที่จ่ายเงิน" w={165}>
            <ErpDate value={payDate} onChange={(v) => ((e) => setPayDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="เลขที่บัญชี" w={230}>
            <input className="cfg-input" value={acctNo} onChange={(e) => { setAcctNo(e.target.value); setError(''); }} placeholder="เลขที่บัญชีธนาคาร" />
          </PcxFld>
          <PcxFld label="งวดจ่ายเงิน" w={150}>
            <input className="cfg-input" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="256902" />
          </PcxFld>
          <PcxFld label="คู่บัญชี" grow w={240}>
            <input className="cfg-input" value={pair} onChange={(e) => setPair(e.target.value)} placeholder="รหัสคู่บัญชี / คำอธิบาย" />
          </PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="ยอดถอนหุ้น" style={{ marginTop: 12 }}>
        <div className="icr-strip">
          <PcxFld label="ทุนเรือนหุ้น" w={180}><PcxRO value={pcxMoney(shareCapital)} num mono /></PcxFld>
          <PcxFld label="ยอดถอน" w={180} required>
            <input className="cfg-input" type="number" min="0" step="100" value={amount} style={{ textAlign: 'right' }}
                   onChange={(e) => { setAmount(e.target.value); setError(''); }} placeholder="0.00" />
          </PcxFld>
          <PcxFld label="ยอดโอนชำระหนี้" w={180}><PcxRO value={pcxMoney(toDebt)} num mono danger={toDebt > 0} /></PcxFld>
          <PcxFld label="หุ้นคงเหลือสุทธิ" w={180}><PcxRO value={pcxMoney(netShare)} num mono /></PcxFld>
          <PcxFld label="ยอดถอนคงเหลือ (จ่ายสมาชิก)" w={220}><PcxRO value={pcxMoney(netCash)} num mono /></PcxFld>
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1000, fontSize: 12 }}>
              <thead>
                <tr><th>เลขสัญญา</th><th>ประเภทเงินกู้</th>
                  <th style={{ textAlign: 'right' }}>เงินต้นคงเหลือ</th>
                  <th style={{ textAlign: 'right' }}>ด/บ ค้าง</th>
                  <th style={{ textAlign: 'right' }}>โอนชำระ</th>
                  <th style={{ textAlign: 'right' }}>ต้นเงินคงเหลือหลังชำระ</th></tr>
              </thead>
              <tbody>
                {debts.map(d => {
                  const out = Number(d.outstanding) || Number(d.principalDue) || 0;
                  const pay = Number(debtPay[d.contractNo]) || 0;
                  return (
                    <tr key={d.contractNo}>
                      <td className="mono">{d.contractNo}</td>
                      <td>{d.type || d.loanType || '—'}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(out)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(d.interestDue || 0)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input className="cfg-input" type="number" min="0" max={out} step="100" style={{ textAlign: 'right', width: 130 }}
                               value={debtPay[d.contractNo] || ''}
                               onChange={(e) => { setDebtPay(p => ({ ...p, [d.contractNo]: e.target.value })); setError(''); }}
                               placeholder="0.00" />
                      </td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(Math.max(0, out - pay))}</td>
                    </tr>
                  );
                })}
                {!debts.length && <PmbEmpty colSpan={6} label={member ? 'ไม่มีสัญญาคงเหลือ' : 'เลือกสมาชิกเพื่อแสดงสัญญาคงเหลือ'} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ⑧ คืนค่าหุ้น
// ════════════════════════════════════════════════════════════════════
function ShareRefundPayPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [rows, setRows] = useState(() => PMB_REFUND_ROWS.map(r => ({ ...r })));
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [confirm, setConfirm] = useState(false);

  const shown = rows.filter(r => !q.trim() || [r.reg, r.name, r.unit].some(v => String(v).toLowerCase().includes(q.trim().toLowerCase())));
  const waitRows = shown.filter(r => r.status === 'รอถอน');
  const selItems = waitRows.filter(r => sel.has(r.reg));
  const selTotal = selItems.reduce((s, r) => s + r.wait, 0);
  const toggle = (reg) => setSel(s => { const n = new Set(s); n.has(reg) ? n.delete(reg) : n.add(reg); return n; });

  const doWithdraw = () => {
    const ids = new Set(selItems.map(r => r.reg));
    setRows(rs => rs.map(r => ids.has(r.reg) ? { ...r, wait: 0, status: 'ถอนแล้ว', paidDate: today } : r));
    setSel(new Set()); setConfirm(false);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — คืนค่าหุ้น',
      target: selItems.length + ' คน',
      summary: 'คืนค่าหุ้น ' + selItems.length + ' คน · ยอดรวม ' + pcxMoney(selTotal) + ' บาท',
      changes: selItems.slice(0, 12).map(r => ({ field: r.reg + ' · ' + r.name, before: 'รอถอน ' + pcxMoney(r.wait), after: 'ถอนแล้ว ' + pmbDate(today) })),
    });
    onToast && onToast('ทำรายการถอนหุ้น ' + selItems.length + ' รายการ · รวม ' + pcxMoney(selTotal) + ' บาท');
  };

  return (
    <div data-screen-label="คืนค่าหุ้น">
      <PcxHead icon="money" title="คืนค่าหุ้น"
        subtitle="ประมวลผลและจัดเก็บ · สมาชิก — คืนทุนเรือนหุ้นให้สมาชิกที่ลาออกและปิดบัญชีแล้ว"
        actions={<>
          <button className="btn primary sm" disabled={!selItems.length} onClick={() => setConfirm(true)}>
            <Icon name="check" size={13} /> ถอนหุ้น ({selItems.length})
          </button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์รายการคืนค่าหุ้น…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      <PcxSec title="รายการรอคืนค่าหุ้น">
        <div className="lrq-inbox-toolbar" style={{ marginTop: 10, marginBottom: 10 }}>
          <span className="muted" style={{ fontSize: 11.5 }}>
            รอถอน {rows.filter(r => r.status === 'รอถอน').length} คน · ยอดรวม {pcxMoney(rows.reduce((s, r) => s + r.wait, 0))} บาท
          </span>
          <span className="spacer" />
          <div className="search lrq-inbox-search" style={{ width: 300 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ทะเบียน / ชื่อ-ชื่อสกุล / หน่วย…" />
          </div>
        </div>

        {selItems.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selItems.length}</b> รายการที่เลือก · ยอดรวม {pcxMoney(selTotal)} บาท</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => setConfirm(true)}><Icon name="check" size={12} /> ถอนหุ้นที่เลือก</button>
            <button className="btn text sm" onClick={() => setSel(new Set())}>ยกเลิกการเลือก</button>
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1050, fontSize: 12 }}>
              <thead>
                <tr>
                  <th style={{ width: 38 }}>
                    <input type="checkbox" disabled={!waitRows.length}
                           checked={waitRows.length > 0 && waitRows.every(r => sel.has(r.reg))}
                           onChange={(e) => setSel(e.target.checked ? new Set(waitRows.map(r => r.reg)) : new Set())} />
                  </th>
                  <th style={{ textAlign: 'right' }}>หุ้น</th><th>ทะเบียน</th><th>ชื่อ-ชื่อสกุล</th><th>หน่วย</th>
                  <th>วันที่ลาออก</th><th style={{ textAlign: 'right' }}>ยอดรอถอน</th><th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => (
                  <tr key={r.reg} className={sel.has(r.reg) ? 'selected' : ''}>
                    <td><input type="checkbox" disabled={r.status !== 'รอถอน'} checked={sel.has(r.reg)} onChange={() => toggle(r.reg)} /></td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.shares)}</td>
                    <td className="mono">{r.reg}</td>
                    <td>{r.name}</td>
                    <td>{r.unit}</td>
                    <td className="mono">{pmbDate(r.outDate)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{r.wait ? pcxMoney(r.wait) : '—'}</td>
                    <td>
                      {r.status === 'ถอนแล้ว' ? <span className="pill ok">ถอนแล้ว</span> : <span className="pill warn">รอถอน</span>}
                      {r.paidDate && <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{pmbDate(r.paidDate)}</div>}
                    </td>
                  </tr>
                ))}
                {!shown.length && <PmbEmpty colSpan={8} />}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>

      {confirm && (
        <PmbDecisionModal items={selItems} decision="yes" title="ยืนยันการคืนค่าหุ้น"
          cols={[{ k: 'reg', l: 'ทะเบียน', mono: true }, { k: 'name', l: 'ชื่อ-ชื่อสกุล' },
                 { k: 'wait', l: 'ยอดรอถอน', mono: true, f: (r) => pcxMoney(r.wait) },
                 { k: 'outDate', l: 'วันที่ลาออก', mono: true, f: (r) => pmbDate(r.outDate) }]}
          onClose={() => setConfirm(false)} onConfirm={doWithdraw} />
      )}
    </div>
  );
}

Object.assign(window, {
  MemberResignApprovePage, ShareChangeApprovePage, MemberCloseAccountPage,
  MemberResignFormPage, AffilTransferFormPage, ShareChangeFormPage,
  SharePartialWithdrawPage, ShareRefundPayPage,
});
