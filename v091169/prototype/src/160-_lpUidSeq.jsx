// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ข้อกำหนดประเภทเงินกู้ — LoanTypeConfigPage
//  ผลิตภัณฑ์เงินกู้ของสหกรณ์ (หลายผลิตภัณฑ์) · เปิด/ปิดการใช้งานได้
//  ระบุระยะเวลาโครงการ (เริ่ม–สิ้นสุด) · แก้ไขย้อนหลังได้
//  เก็บประวัติการเพิ่ม/แก้ไขทุกครั้ง (ในรายการ + ส่ง audit รวมของระบบ)
// ════════════════════════════════════════════════════════════════════

let _lpUidSeq = 0;
const lpUid = () => 'LP-N' + (++_lpUidSeq);
const lpToday = () => new Date().toISOString().slice(0, 10);
const lpNow = () => new Date().toISOString().slice(0, 19);

// ทำให้เรกคอร์ดเก่า (บันทึกก่อนเพิ่มตารางใหม่) มีตารางย่อยครบทุกชุด
const LP_COLL_GROUP_MIGRATE = { 'คนค้ำ': '01', 'หุ้น': '02', 'เงินฝาก': '03', 'หลักทรัพย์': '04' };
function lpNormalize(r) {
  const t = lpTablesOf(r);
  // ย้ายค่ากลุ่มหลักประกันแบบข้อความเดิม → รหัส 01–04
  t.collateralValues = t.collateralValues.map(c => ({
    ...c, group: LP_COLL_GROUP_MIGRATE[c.group] || c.group,
  }));
  // เติมค่าตั้งใหม่ (สิทธิการกู้ ฯลฯ) ให้เรกคอร์ดเก่าที่บันทึกไว้ก่อนเพิ่มฟิลด์
  const settings = { ...window.LP_SETTINGS_DEFAULTS, ...(r.settings || {}) };
  if (!r.settings || !r.settings.rightMode) {
    settings.rightMode = (settings.limitMethod === '2' && (t.limitRights || []).length) ? 'matrix' : 'salary';
  }
  return { ...r, settings, ...t };
}
function lpLoad() {
  try {
    const saved = localStorage.getItem('loan_types');
    if (saved) {
      let arr = JSON.parse(saved);
      // ลบรายการทดลอง รหัส 11 (ครั้งเดียว)
      if (!localStorage.getItem('loan_types_purge_11')) {
        const clean = arr.filter(r => String(r.code || '').trim() !== '11');
        if (clean.length !== arr.length) { arr = clean; localStorage.setItem('loan_types', JSON.stringify(arr)); }
        localStorage.setItem('loan_types_purge_11', '1');
      }
      return arr.map(lpNormalize);
    }
  } catch (e) {}
  return window.LP_SEED.map(r => JSON.parse(JSON.stringify(r)));
}
window.lpLoadAll = lpLoad;
function lpSaveLS(list) {
  try { localStorage.setItem('loan_types', JSON.stringify(list)); } catch (e) {}
}

// ─── แม่แบบ (Template) — ชุดค่าคงที่ที่บันทึกไว้ใช้ซ้ำ ────────────────
let _lpTplUidSeq = 0;
const lpTplUid = () => 'TPL-N' + (++_lpTplUidSeq);
function lpTplLoad() {
  try {
    const saved = localStorage.getItem('loan_type_templates');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return (window.LP_TEMPLATE_SEED || []).map(r => JSON.parse(JSON.stringify(r)));
}
function lpTplSave(list) {
  try { localStorage.setItem('loan_type_templates', JSON.stringify(list)); } catch (e) {}
}
// ดึงตารางย่อยทั้ง 7 จาก record/template
function lpTablesOf(src) {
  return {
    limitRights: src.limitRights || [], limitCollateral: src.limitCollateral || [],
    interestTiers: src.interestTiers || [],
    amountInterestTiers: src.amountInterestTiers || [],
    guaranteeRules: src.guaranteeRules || [],
    collateralValues: src.collateralValues || [], offsetLoans: src.offsetLoans || [],
    installmentLimits: src.installmentLimits || [], banRules: src.banRules || [], reduceRules: src.reduceRules || [],
  };
}

// ─── ป้ายชื่อฟิลด์สำหรับสร้างประวัติการแก้ไข ─────────────────────────
const LP_FIELD_LABELS = {
  code: 'รหัสเงินกู้', name: 'ชื่อเงินกู้', abbr: 'ตัวย่อเงิน', group: 'กลุ่มเงินกู้',
  packageStart: 'วันที่เริ่มโครงการ', packageEnd: 'วันที่สิ้นสุดโครงการ', note: 'หมายเหตุ',
  maxLoanAmount: 'วงเงินกู้สูงสุด', limitGroup: 'กลุ่มวงเงินกู้', limitMethod: 'การกำหนดวงเงินกู้',
  rightMode: 'สิทธิการกู้ — วิธีกำหนด', rightSalaryMult: 'สิทธิ (เท่าของเงินเดือน)', rightSalaryCap: 'สิทธิ — เพดาน (เงินเดือน)',
  rightShareMult: 'สิทธิ (เท่าของค่าหุ้น)', rightShareCap: 'สิทธิ — เพดาน (ค่าหุ้น)',
  rightRefDoc: 'อ้างอิงประกาศ/ระเบียบ', rightRefDate: 'วันที่ประกาศมีผล',
  rateTable: 'ตารางอัตราดอกเบี้ย', instantApprove: 'การอนุมัติทันที', maxContracts: 'จำนวนสัญญาสูงสุด',
  minMembershipMonths: 'อายุสมาชิกขั้นต่ำ', warnDays: 'เตือนล่วงหน้า', loanInsurance: 'การทำประกันเงินกู้',
  repayMode: 'รูปแบบการชำระคืน', minPayment: 'ผ่อนชำระขั้นต่ำ', postRetirePeriods: 'งวดหลังเกษียณ',
  salaryRemainValue: 'เงินเดือนคงเหลือขั้นต่ำ', needCollateral: 'ขอกู้ต้องใช้หลักประกัน',
  maxTimesPerYear: 'จำนวนครั้งกู้/ปี', maxTimesTotal: 'จำนวนครั้งกู้ทั้งหมด',
  maxTimesPerYearGroup: 'จำนวนครั้งกู้/ปี (กลุ่ม)', maxTimesTotalGroup: 'จำนวนครั้งกู้ทั้งหมด (กลุ่ม)',
  balloonBase: 'ฐานงวดบอลลูน', balloonValue: 'งวดท้าย (บอลลูน)',
  limitCalcBasis: 'คิดวงเงินกู้ได้จาก',
  nearRetireLimitOn: 'จำกัดวงเงินใกล้เกษียณ', nearRetireMonths: 'ใกล้เกษียณ (เดือน)',
  nearRetireSalaryMult: 'ใกล้เกษียณ (เท่าเงินเดือน)', nearRetireMaxAmount: 'เพดานวงเงินใกล้เกษียณ',
  penaltyInterestOn: 'คิดดอกเบี้ยผิดนัด', penaltyInterestRate: 'อัตราดอกเบี้ยผิดนัด',
  warnBasis: 'เกณฑ์พิจารณาเงินกู้', warnThreshold: 'ค่าเกณฑ์เตือน',
  noMonthlyInstallment: 'ไม่ผ่อนรายเดือน', dividendRepayBase: 'ตัดชำระจาก',
  accrueInterestMonthly: 'สะสมดอกเบี้ยรายเดือน', interestOnlyAllowed: 'จ่ายเฉพาะดอกเบี้ยได้',
  checkRebateHistory: 'ตรวจยอดเฉลี่ยคืน', rebatePayPercent: '% การจ่ายจากปันผล',
};
const LP_TABLE_LABELS = {
  limitRights: 'สิทธิแบบกำหนดเอง', limitCollateral: 'สิทธิจากหลักประกัน', interestTiers: 'ดอกเบี้ยตามช่วงเวลา', amountInterestTiers: 'ดอกเบี้ยตามเงินกู้',guaranteeRules: 'กำหนดหุ้น/บุคคลค้ำ', collateralValues: 'มูลค่าหลักประกัน',
  offsetLoans: 'เงินกู้ที่ต้องหักกลบ', banLoans: 'เงินกู้ที่ห้ามกู้', installmentLimits: 'จำนวนงวดสูงสุด', banRules: 'เงื่อนไขห้ามกู้', reduceRules: 'เงื่อนไขลดสิทธิ์',
};
function lpFmtVal(k, v) {
  if (v === true) return 'เปิด'; if (v === false) return 'ปิด';
  if (v === '' || v == null) return '—';
  if (['packageStart', 'packageEnd', 'rightRefDate'].includes(k)) return fmt.date(v);
  if (k === 'maxLoanAmount' || k === 'minPayment') return fmt.money(Number(v), 2);
  if (['rightSalaryCap', 'rightShareCap'].includes(k)) return Number(v) > 0 ? fmt.money(Number(v), 0) : 'ไม่จำกัด';
  if (k === 'rightMode') return window.lpLabel ? window.lpLabel('rightMode', v) : String(v);
  return String(v);
}
// diff header + settings + table row-counts → changes[]
function lpDiff(before, after) {
  const changes = [];
  ['code', 'name', 'abbr', 'group', 'packageStart', 'packageEnd', 'note'].forEach(k => {
    if (before[k] !== after[k]) changes.push({ field: LP_FIELD_LABELS[k] || k, before: lpFmtVal(k, before[k]), after: lpFmtVal(k, after[k]) });
  });
  const bs = before.settings || {}, as = after.settings || {};
  Object.keys(as).forEach(k => {
    if (bs[k] !== as[k] && LP_FIELD_LABELS[k]) changes.push({ field: LP_FIELD_LABELS[k], before: lpFmtVal(k, bs[k]), after: lpFmtVal(k, as[k]) });
  });
  Object.keys(LP_TABLE_LABELS).forEach(k => {
    const b = (before[k] || []).length, a = (after[k] || []).length;
    if (b !== a) changes.push({ field: 'ตาราง: ' + LP_TABLE_LABELS[k], before: b + ' แถว', after: a + ' แถว' });
  });
  return changes;
}

// ════════════════════════════════════════════════════════════════════
//  History modal — ไทม์ไลน์การเพิ่ม/แก้ไขของผลิตภัณฑ์
// ════════════════════════════════════════════════════════════════════
function LpHistoryModal({ record, onClose }) {
  const hist = record.history || [];
  const actionMeta = (a) => a === 'create'
    ? { label: 'สร้างผลิตภัณฑ์', color: 'var(--success)', icon: 'plus' }
    : a === 'toggle' ? { label: 'เปิด/ปิดการใช้งาน', color: 'var(--warning)', icon: 'refresh' }
    : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการเพิ่ม/แก้ไขผลิตภัณฑ์</h2>
            <div className="muted" style={{ fontSize: 11 }}>{record.code} · {record.name} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hist.map((h, i) => {
              const m = actionMeta(h.action);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={m.icon} size={14} />
                    </div>
                    {i < hist.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                      {h.effective && <span className="pill neutral" title="มีผลตั้งแต่">มีผล {fmt.date(h.effective)}</span>}
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.date(h.ts.slice(0, 10))} · {h.ts.slice(11, 16)} น.</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                    {h.changes && h.changes.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.changes.map((c, ci) => (
                          <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span className="muted" style={{ minWidth: 110 }}>{c.field}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                            <Icon name="chevRight" size={11} />
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail page — header + 7 แท็บ (view/edit + แก้ไขย้อนหลัง)
// ════════════════════════════════════════════════════════════════════
const LP_TABS = [
  { id: 'general', label: 'ทั่วไป' },
  { id: 'limit', label: 'วงเงินกู้' },
  { id: 'interest', label: 'ดอกเบี้ย' },
  { id: 'collateral', label: 'หลักประกัน' },
  { id: 'offset', label: 'หักชำระ' },
  { id: 'installment', label: 'งวดชำระ' },
  { id: 'restrict', label: 'จำกัดกู้' },
  { id: 'docs', label: 'เอกสารประกอบการยื่นกู้' },
];

// ── ยืนยันทิ้งการแก้ไข (เปลี่ยนแท็บขณะแก้ไข) ──────────────────────────
function LpDiscardModal({ onKeep, onDiscard }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onKeep} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
        <button className="close-btn" onClick={onKeep} aria-label="ปิด" style={{ position: 'absolute', top: 14, right: 14, background: '#fff', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}><Icon name="close" /></button>
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 34, paddingBottom: 26 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--warning-50)', color: 'var(--warning)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="info" size={26} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>ทิ้งการแก้ไข?</h2>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>หากออกจากหน้านี้ การเปลี่ยนแปลงล่าสุดจะไม่ถูกบันทึก</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
            <button className="btn" style={{ minWidth: 120, justifyContent: 'center' }} onClick={onKeep}>แก้ไขต่อ</button>
            <button className="btn primary" style={{ minWidth: 140, justifyContent: 'center' }} onClick={onDiscard}>ละทิ้ง</button>
          </div>
        </div>
      </div>
    </>
  );
}

window.LpDiscardModal = LpDiscardModal;

// ── ยืนยันการบันทึกก่อนเปลี่ยนแท็บ ────────────────────────────────────
function LpSaveModal({ onClose, onDiscard, onSave }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
        <button className="close-btn" onClick={onClose} aria-label="ปิด" style={{ position: 'absolute', top: 14, right: 14, background: '#fff', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}><Icon name="close" /></button>
        <div className="modal-body" style={{ textAlign: 'center', paddingTop: 34, paddingBottom: 26 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--brand-100)', color: 'var(--brand)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name="info" size={26} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>บันทึกการแก้ไข?</h2>
          <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>บันทึกการเปลี่ยนแปลงก่อน จึงจะเปลี่ยนไปแท็บอื่นได้</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
            <button className="btn" style={{ minWidth: 120, justifyContent: 'center' }} onClick={onDiscard}>ละทิ้ง</button>
            <button className="btn primary" style={{ minWidth: 140, justifyContent: 'center' }} onClick={onSave}><Icon name="check" /> บันทึก</button>
          </div>
        </div>
      </div>
    </>
  );
}

function LpDetail({ record, onBack, onSave, onShowHistory, onSaveTemplate, startEditing, onMode }) {
  const [editing, setEditing] = useState(!!startEditing);
  useEffect(() => { onMode && onMode(editing ? 'edit' : 'view'); }, [editing]);
  const [tab, setTab] = useState('general');
  const [draft, setDraft] = useState(record);
  const [effectiveDate, setEffectiveDate] = useState(lpToday());
  const [savedAt, setSavedAt] = useState(null);
  const [pendingTab, setPendingTab] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // เปลี่ยนแท็บขณะแก้ไข → ให้บันทึกก่อน
  const requestTab = (id) => {
    if (id === tab) return;
    if (editing) { setPendingTab(id); return; }
    setTab(id);
  };
  const discardAndGo = () => { setDraft(record); setEditing(false); setTab(pendingTab); setPendingTab(null); };
  const saveAndGo    = () => { onSave(draft, effectiveDate, { silent: true }); setTab(pendingTab); setPendingTab(null); };

  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const startEdit = () => { setDraft(record); setEffectiveDate(lpToday()); setEditing(true); };
  const cancel    = () => setConfirmCancel(true);
  const doCancel  = () => { setDraft(record); setEditing(false); setConfirmCancel(false); };
  const save = () => { onSave(draft, effectiveDate); setSavedAt(new Date()); setEditing(false); };

  const cur = editing ? draft : record;
  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setSettings = (settings) => setDraft(d => ({ ...d, settings }));
  const setTable = (key, rows) => setDraft(d => ({ ...d, [key]: rows }));
  const backdating = editing && effectiveDate < lpToday();

  const tabProps = { record: cur, editing, onSettings: setSettings, onTable: setTable };

  return (
    <div data-screen-label="หน้ารายละเอียดประเภทเงินกู้">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        <button className="btn sm" onClick={() => onShowHistory(record)}><Icon name="history" /> ประวัติ ({(record.history || []).length})</button>

        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขผลิตภัณฑ์</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ละทิ้ง</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกผลิตภัณฑ์</button>
          </>
        )}
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="loans" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="lt-modal-label">รหัสเงินกู้ <span className="cfg-required">*</span></label>
                  <input className="cfg-input mono" value={draft.code} disabled style={{ background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                </div>
                <div>
                  <label className="lt-modal-label">ชื่อเงินกู้ <span className="cfg-required">*</span></label>
                  <input className="cfg-input" value={draft.name} placeholder="ชื่อเงินกู้" onChange={(e) => setHdr('name', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={draft.note || ''} placeholder="หมายเหตุประกอบรายการ" onChange={(e) => setHdr('note', e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
                <div className="lt-head-meta">
                  <span>กลุ่มเงินกู้: {window.lpLabel('loanGroup', record.group)}</span>
                  <span className="dot" />
                  <span>หมายเหตุ: {record.note || '—'}</span>
                </div>
              </>
            )}
          </div>
          {!editing && (record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
        </div>


      </div>

      {/* แท็บ */}
      <div className="tabs-container" style={{ marginTop: 12 }}>
        <div className="tabs-bar" style={{ flexWrap: 'wrap' }}>
          {LP_TABS.map(t => (
            <button key={t.id} className={"tab" + (t.id === tab ? ' active' : '')} onClick={() => requestTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'general' && <LpTabGeneral {...tabProps} />}
      {tab === 'limit' && <LpTabLimit {...tabProps} />}
      {tab === 'interest' && <LpTabInterest {...tabProps} />}
      {tab === 'collateral' && <LpTabCollateral {...tabProps} />}
      {tab === 'offset' && <LpTabOffset {...tabProps} />}
      {tab === 'installment' && <LpTabInstallment {...tabProps} />}
      {tab === 'restrict' && <LpTabRestrict {...tabProps} />}
      {tab === 'docs' && <LpTabDocs {...tabProps} />}

      {pendingTab && <LpSaveModal onClose={() => setPendingTab(null)} onDiscard={discardAndGo} onSave={saveAndGo} />}
      {confirmCancel && <LpDiscardModal onKeep={() => setConfirmCancel(false)} onDiscard={doCancel} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add modal
// ════════════════════════════════════════════════════════════════════
function LpAddModal({ list, templates = [], onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('normal');
  const start = lpToday();
  const [copyFrom, setCopyFrom] = useState('__default');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('กรุณาระบุรหัสเงินกู้'); return; }
    if (!name.trim()) { setError('กรุณาระบุชื่อเงินกู้'); return; }
    if (list.some(r => r.code === code.trim())) { setError('รหัสเงินกู้นี้ถูกใช้แล้ว'); return; }
    let base, tables;
    if (copyFrom === '__default') {
      base = { ...window.LP_SETTINGS_DEFAULTS }; tables = window.LP_TABLE_DEFAULTS();
    } else if (copyFrom.startsWith('tpl:')) {
      const tpl = templates.find(t => t.id === copyFrom.slice(4));
      base = tpl ? JSON.parse(JSON.stringify(tpl.settings)) : { ...window.LP_SETTINGS_DEFAULTS };
      tables = tpl ? JSON.parse(JSON.stringify(tpl.tables || window.LP_TABLE_DEFAULTS())) : window.LP_TABLE_DEFAULTS();
    } else {
      const src = list.find(r => r.id === copyFrom);
      base = src ? JSON.parse(JSON.stringify(src.settings)) : { ...window.LP_SETTINGS_DEFAULTS };
      tables = src ? JSON.parse(JSON.stringify(lpTablesOf(src))) : window.LP_TABLE_DEFAULTS();
    }
    base.loanGroup = group;
    onCreate({
      id: lpUid(), code: code.trim(), name: name.trim(), abbr: '', group,
      enabled: false, packageStart: start, packageEnd: null,
      createdDate: lpToday(), createdBy: 'จันทร์เพ็ญ มาลี', note: note.trim(),
      settings: base, ...JSON.parse(JSON.stringify(tables)), history: [],
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มผลิตภัณฑ์เงินกู้</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างประเภทเงินกู้ใหม่ — ปิดใช้งานไว้จนกว่าจะเปิดสถานะ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัสเงินกู้ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={code} autoFocus placeholder="10" onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อเงินกู้ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} placeholder="เช่น ฉุกเฉินเงินสด" onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>กลุ่มเงินกู้ <span className="cfg-required">*</span></label>
          <select className="filter-select" style={{ width: '100%' }} value={group} onChange={(e) => setGroup(e.target.value)}>
            {window.LP_OPTS.loanGroup.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>เทมเพลตเริ่มต้น</label>
          <select className="filter-select" style={{ width: '100%' }} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="__default">ค่าเริ่มต้นของระบบ</option>
            <optgroup label="คัดลอกจากผลิตภัณฑ์เดิม">
              {list.map(r => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
            </optgroup>
          </select>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <textarea className="cfg-input" rows={3} value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)" style={{ resize: 'vertical', minHeight: 68, fontFamily: 'inherit' }} onChange={(e) => setNote(e.target.value)} />

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างผลิตภัณฑ์</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Save-as-Template modal — บันทึกชุดค่าคงที่ปัจจุบันเป็นแม่แบบ
// ════════════════════════════════════════════════════════════════════
function LpSaveTemplateModal({ record, onClose, onSave }) {
  const [name, setName] = useState(`แม่แบบจาก ${record.name}`);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('กรุณาระบุชื่อแม่แบบ'); return; }
    onSave({
      id: lpTplUid(), name: name.trim(), note: note.trim(),
      createdBy: 'จันทร์เพ็ญ มาลี', createdDate: lpToday(),
      settings: JSON.parse(JSON.stringify(record.settings)),
      tables: JSON.parse(JSON.stringify(lpTablesOf(record))),
    });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="column" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>บันทึกเป็นแม่แบบ (Template)</h2>
            <div className="muted" style={{ fontSize: 11 }}>เก็บชุดค่าคงที่ของ “{record.name}” ไว้ใช้เป็นจุดเริ่มต้นผลิตภัณฑ์ใหม่</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="lt-modal-label">ชื่อแม่แบบ <span className="cfg-required">*</span></label>
          <input className="cfg-input" value={name} autoFocus
                 onChange={(e) => { setName(e.target.value); setError(''); }} />
          <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
          <input className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                 onChange={(e) => setNote(e.target.value)} />
          <div className="as-vat-note muted" style={{ marginTop: 12 }}>
            <Icon name="info" size={12} /> แม่แบบจะเก็บค่าตั้งทั้ง 7 แท็บ (ไม่รวมชื่อ/รหัส/ระยะเวลาโครงการ) — เลือกใช้ได้ในช่อง “เริ่มจาก” ตอนเพิ่มผลิตภัณฑ์ใหม่
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> บันทึกแม่แบบ
            </button>
          </div>
          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Toggle confirm modal — เปิด/ปิดการใช้งานผลิตภัณฑ์
// ════════════════════════════════════════════════════════════════════
function LpToggleModal({ target, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานผลิตภัณฑ์' : 'ปิดการใช้งานผลิตภัณฑ์'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {turningOn ? (
            <p className="lt-confirm-text">
              เปิดให้บริการผลิตภัณฑ์ <b>“{target.name}”</b> — สมาชิกจะสามารถยื่นขอกู้ประเภทนี้ได้
              {target.packageEnd ? <> ภายในระยะเวลาโครงการ ({fmt.date(target.packageStart)} – {fmt.date(target.packageEnd)})</> : <> ตั้งแต่ {fmt.date(target.packageStart)} เป็นต้นไป</>}
            </p>
          ) : (
            <p className="lt-confirm-text">
              ปิดการใช้งาน <b>“{target.name}”</b> — ระบบจะ<b>ไม่เปิดรับคำขอกู้ใหม่</b>ของผลิตภัณฑ์นี้
              สัญญาที่มีอยู่เดิมยังคงดำเนินการตามปกติ
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className={"btn " + (turningOn ? 'primary' : 'danger')} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="check" /> ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function LoanTypeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(lpLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);   // { rec, turningOn }
  const [blocked, setBlocked] = useState(null);
  const [histRec, setHistRec] = useState(null);
  const [templates, setTemplates] = useState(lpTplLoad);
  const [tplFromRec, setTplFromRec] = useState(null);

  const persist = (next) => { setList(next); lpSaveLS(next); };
  const persistTpl = (next) => { setTemplates(next); lpTplSave(next); };
  const handleSaveTemplate = (tpl) => {
    persistTpl([tpl, ...templates]);
    audit.log({
      action: 'create', module: 'สินเชื่อ — ค่าคงที่ประเภทเงินกู้ (แม่แบบ)',
      target: tpl.name, summary: `บันทึกแม่แบบประเภทเงินกู้ “${tpl.name}”`,
    });
    onToast && onToast(`บันทึกแม่แบบ “${tpl.name}” เรียบร้อยแล้ว`);
    setTplFromRec(null);
  };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;
  const [dMode, setDMode] = useState('view');
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3('ประเภทเงินกู้', openRec ? dMode : 'list',
      () => { setOpenId(null); setStartEditing(false); }),
    [openId, dMode]
  );

  const handleCreate = (rec) => {
    const withHist = {
      ...rec,
      history: [{
        ts: lpNow(), user: 'จันทร์เพ็ญ มาลี', action: 'create', effective: rec.packageStart,
        summary: `สร้างผลิตภัณฑ์เงินกู้ “${rec.name}” (รหัส ${rec.code})`,
        changes: [{ field: 'รหัสเงินกู้', before: '—', after: rec.code }, { field: 'ชื่อเงินกู้', before: '—', after: rec.name },
                  { field: 'ระยะเวลาโครงการ', before: '—', after: fmt.date(rec.packageStart) + (rec.packageEnd ? ' – ' + fmt.date(rec.packageEnd) : ' (ไม่มีกำหนดสิ้นสุด)') }],
      }],
    };
    persist([withHist, ...list]);
    audit.log({
      action: 'create', module: 'สินเชื่อ — ค่าคงที่ประเภทเงินกู้',
      target: `${rec.code} · ${rec.name}`, summary: `เพิ่มผลิตภัณฑ์เงินกู้ “${rec.name}”`,
      changes: [{ field: 'รหัสเงินกู้', before: '—', after: rec.code }],
    });
    setAdding(false);
    onToast && onToast(`สร้างผลิตภัณฑ์ “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(withHist.id);
  };

  const handleSaveDetail = (draft, effectiveDate, opts) => {
    const before = list.find(r => r.id === draft.id);
    const changes = lpDiff(before, draft);
    const entry = {
      ts: lpNow(), user: 'จันทร์เพ็ญ มาลี', action: 'update', effective: effectiveDate,
      summary: changes.length ? `แก้ไขผลิตภัณฑ์ “${draft.name}” (${changes.length} รายการ)` + (effectiveDate < lpToday() ? ' — แก้ไขย้อนหลัง' : '') : `บันทึกผลิตภัณฑ์ “${draft.name}” (ไม่มีการเปลี่ยนแปลง)`,
      changes,
    };
    const next = list.map(r => r.id === draft.id ? { ...draft, history: [entry, ...(draft.history || [])] } : r);
    persist(next);
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่ประเภทเงินกู้',
      target: `${draft.code} · ${draft.name}`, summary: entry.summary, changes,
    });
    if (!(opts && opts.silent)) onToast && onToast(`บันทึกผลิตภัณฑ์ “${draft.name}” เรียบร้อยแล้ว`);
  };

  const applyToggle = () => {
    const { rec, turningOn } = toggleTarget;
    const entry = {
      ts: lpNow(), user: 'จันทร์เพ็ญ มาลี', action: 'toggle', effective: lpToday(),
      summary: turningOn ? `เปิดการใช้งานผลิตภัณฑ์ “${rec.name}”` : `ปิดการใช้งานผลิตภัณฑ์ “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }],
    };
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: turningOn, history: [entry, ...(r.history || [])] } : r));
    audit.log({
      action: 'update', module: 'สินเชื่อ — ค่าคงที่ประเภทเงินกู้',
      target: `${rec.code} · ${rec.name}`, summary: entry.summary, changes: entry.changes,
    });
    onToast && onToast(turningOn ? `เปิดใช้งาน “${rec.name}” แล้ว` : `ปิดใช้งาน “${rec.name}” แล้ว`);
    setToggleTarget(null);
  };

  // โครงการที่อ้างอิงผลิตภัณฑ์นี้ (ค่าคงที่ › โครงการเงินกู้)
  const projectCell = (r) => {
    const ps = window.lpjProjectsUsingType ? window.lpjProjectsUsingType(r.id) : [];
    if (!ps.length) return <span className="muted">—</span>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {ps.map(p => {
          const st = window.lpjProjectStatus(p);
          return (
            <div key={p.id} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span>{p.name}</span>
              <span className={'pill ' + st.pill} style={{ flexShrink: 0 }}>{st.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const periodCell = (r) => {
    const now = lpToday();
    const expired = r.packageEnd && r.packageEnd < now;
    return (
      <div style={{ fontSize: 12, lineHeight: 1.35 }}>
        <div className="mono">{fmt.date(r.packageStart)}</div>
        <div className="mono muted">{r.packageEnd ? '– ' + fmt.date(r.packageEnd) : '– ไม่มีกำหนด'}{expired && <span className="pill bad" style={{ marginLeft: 6 }}>หมดอายุ</span>}</div>
      </div>
    );
  };

  // ─── Detail view ──────────────────────────────────────────────────
  if (openRec) {
    return (
      <>
        <LpDetail record={openRec} startEditing={startEditing} onMode={setDMode}
                  onBack={() => { setOpenId(null); setStartEditing(false); }}
                  onSave={handleSaveDetail} onShowHistory={setHistRec} />
        {histRec && <LpHistoryModal record={list.find(r => r.id === histRec.id) || histRec} onClose={() => setHistRec(null)} />}
        {tplFromRec && <LpSaveTemplateModal record={tplFromRec} onClose={() => setTplFromRec(null)} onSave={handleSaveTemplate} />}
      </>
    );
  }

  // ─── List view ────────────────────────────────────────────────────
  return (
    <div data-screen-label="หน้าค่าคงที่ประเภทเงินกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ประเภทเงินกู้ (ผลิตภัณฑ์เงินกู้)</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดประเภทเงินกู้แต่ละผลิตภัณฑ์ของสหกรณ์ — เปิด/ปิดการใช้งาน, ระบุระยะเวลาโครงการ และแก้ไขย้อนหลังได้พร้อมเก็บประวัติ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มผลิตภัณฑ์</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="loans" /></div>
        <div>
          <div className="lt-ab-label">ผลิตภัณฑ์เงินกู้ทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ผลิตภัณฑ์
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>รหัสเงินกู้</th>
                <th style={{ minWidth: 220 }}>ชื่อเงินกู้</th>
                <th style={{ width: 150 }}>กลุ่มเงินกู้</th>
                <th className="right" style={{ width: 130 }}>วงเงินสูงสุด</th>
                <th className="center" style={{ width: 70 }}>ประวัติ</th>
                <th className="center" style={{ width: 90 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 74 }} />
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className={"clickable" + (r.enabled ? ' selected' : '')}
                    onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                  <td className="mono">{r.code}</td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td>{window.lpLabel('loanGroup', r.group)}</td>
                  <td className="right mono">{fmt.money(Number(r.settings.maxLoanAmount || 0), 0)}</td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn text sm" title="ดูประวัติการแก้ไข" aria-label="ดูประวัติการแก้ไข"
                            style={{ border: 'none', background: 'transparent', padding: '0 6px' }}
                            onClick={() => setHistRec(r)}>
                      <Icon name="history" size={15} />
                    </button>
                  </td>
                  <td className="center">
                    {r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            onClick={() => {
                              if (r.enabled) {
                                const ps = (window.lpjProjectsUsingType ? window.lpjProjectsUsingType(r.id) : []).filter(p => p.enabled);
                                if (ps.length) { setBlocked({ title: 'ปิดการใช้งานประเภทเงินกู้', subtitle: r.code + ' · ' + r.name,
                                  detail: `ปิดใช้งานไม่ได้ — ประเภทเงินกู้ “${r.name}” ถูกใช้อยู่ใน ${ps.length} โครงการเงินกู้: ${ps.map(p => p.code + ' — ' + p.name).join(' · ')}\nกรุณาปิดใช้งานโครงการเหล่านี้ก่อน` }); return; }
                              }
                              setToggleTarget({ rec: r, turningOn: !r.enabled });
                            }}>
                      <span className="lt-switch-knob" />
                    </button>
                  </td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <button className="btn sm" onClick={() => { setStartEditing(false); setOpenId(r.id); }}>
                      <Icon name="eye" size={13} /> ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ผลิตภัณฑ์เงินกู้ไม่สามารถลบได้ — ปิดการใช้งานเพื่อหยุดรับคำขอ และเก็บประวัติทุกการแก้ไขเพื่อการตรวจสอบย้อนหลัง
      </div>

      {adding && <LpAddModal list={list} templates={templates} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {toggleTarget && <LpToggleModal target={toggleTarget.rec} turningOn={toggleTarget.turningOn}
                                      onClose={() => setToggleTarget(null)} onConfirm={applyToggle} />}
      {blocked && window.ConstBlockedModal && <window.ConstBlockedModal {...blocked} onClose={() => setBlocked(null)} />}
      {histRec && <LpHistoryModal record={list.find(r => r.id === histRec.id) || histRec} onClose={() => setHistRec(null)} />}
    </div>
  );
}

Object.assign(window, { LoanTypeConfigPage });
