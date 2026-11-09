// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ข้อกำหนดระบบเงินฝาก (System Configuration)
//  ค่าระดับระบบที่ควบคุมการคำนวณดอกเบี้ย การนับวัน/วันหยุด การรับฝาก–ถอน
//  การผ่านเช็ค การปัดเศษ การพิมพ์สมุด/Card การสร้าง Slip และการลงบัญชี
//  แก้ไข → บันทึก พร้อมเก็บ Audit Log ทุกครั้ง (แก้ย้อนหลังได้)
// ════════════════════════════════════════════════════════════════════

const SCFG_USER = 'จันทร์เพ็ญ มาลี';
const scfgNow = () => new Date().toISOString().slice(0, 19);

const SC_ROUND_OPTS = [
    { v: '5/4', l: 'ปัด 5/4' },
    { v: 'up25', l: 'ปัดขึ้นเต็มสลึง' },
    { v: 'up10', l: 'ปัดขึ้นเต็มสิบสตางค์' },
    { v: 'upbaht', l: 'ปัดขึ้นเต็มบาท' },
    { v: '1/0', l: 'ปัด 1/0' },
    { v: '6/5', l: 'ปัด 6/5' },
    { v: 'trunc', l: 'ปัดทิ้ง' },
    { v: 'down25', l: 'ปัดลงเต็มสลึง' },
    { v: 'down10', l: 'ปัดลงเต็มสิบสตางค์' },
    { v: 'downbaht', l: 'ปัดลงเต็มบาท' },
    { v: 'fullbaht', l: 'ปัดให้เต็มบาท' },
  ];
const SC_OPTS = {
  dayCountYear: [
    { v: 'actual', l: 'แปรผันตามจริง' },
    { v: 'fixed365', l: 'คงที่' },
  ],
  dayCountMethod: [
    { v: 'front', l: 'นับหน้าไม่นับหลัง' },
    { v: 'back', l: 'นับหลังไม่นับหน้า' },
    { v: 'both', l: 'นับหน้านับหลัง' },
  ],
  compoundTiming: [
    { v: 'bod', l: 'ก่อนเริ่มวัน' },
    { v: 'eod', l: 'หลังสิ้นวัน' },
  ],
  accrueCut: [
    { v: 'onevent', l: 'ตัดเมื่อเกิดดอกเบี้ย' },
    { v: 'none', l: 'ไม่มีการตัด' },
  ],
  checkInterest: [
    { v: 'deposit', l: 'คิดวันฝาก' },
    { v: 'cleared', l: 'คิดวันเคลียริ่ง' },
  ],
  cashCheckMode: [
    { v: 'no', l: 'ไม่ตรวจสอบ' },
    { v: 'yes', l: 'ตรวจสอบ' },
  ],
  roundMethod: SC_ROUND_OPTS,
  roundScope: [
    { v: 'sumthenround', l: 'รวมทุกขั้นแล้วปัด' },
    { v: 'roundthensum', l: 'ปัดทุกขั้นแล้วรวม' },
  ],
  intCalcBase: [
    { v: 'lumpsum', l: 'คิดรวมหน่วยทีเดียว' },
    { v: 'perunit', l: 'คิด 1 หน่วยแล้วคูณหน่วย' },
  ],
  taxRound: SC_ROUND_OPTS,
  counterPosting: [
    { v: 'bytype', l: 'ตามประเภทที่ทำรายการ' },
    { v: 'transfer', l: 'รายการโอน' },
  ],
  slipMode: [
    { v: 'auto', l: 'สร้าง' },
    { v: 'none', l: 'ไม่สร้าง' },
  ],
  voucherPrint: [
    { v: 'none', l: 'ไม่พิมพ์' },
    { v: 'positive', l: 'พิมพ์เฉพาะมากกว่า 0' },
    { v: 'all', l: 'พิมพ์ทุกกรณี' },
  ],
  transferPosting: [
    { v: 'bymove', l: 'ลงบัญชีตามการเคลื่อนไหว' },
    { v: 'summary', l: 'ลงบัญชีแบบรวม' },
  ],
  maintOrder: [
    { v: 'bod', l: 'ก่อนเริ่มวัน' },
    { v: 'eod', l: 'หลังสิ้นวัน' },
  ],
  holidayMode: [
    { v: 'next', l: 'ส่งข้อมูลวันทำการถัดไป' },
    { v: 'prev', l: 'ส่งข้อมูลวันทำการก่อนหน้า' },
    { v: 'keep', l: 'ส่งข้อมูลวันเดิม' },
  ],
  compoundDayCount: [
    { v: 'include', l: 'นับวันเข้าตัว' },
    { v: 'exclude', l: 'ไม่นับวันเข้าตัว' },
  ],
  accrueDayCount: [
    { v: 'last', l: 'นับวันสุดท้าย' },
    { v: 'nolast', l: 'ไม่นับวันสุดท้าย' },
  ],
  accrueSet: [
    { v: 'monthly', l: 'ทุกเดือน' },
    { v: 'quarterly', l: 'ทุกไตรมาส' },
    { v: 'halfyear', l: 'ทุกครึ่งปี' },
    { v: 'yearly', l: 'ทุกปี' },
  ],
  cashTxnCheck: [
    { v: 'yes', l: 'ตรวจสอบ' },
    { v: 'no', l: 'ไม่ตรวจสอบ' },
  ],
  backdateUnit: [
    { v: 'calendar', l: 'วันปฏิทิน' },
    { v: 'workday', l: 'วันทำการ' },
  ],
};
const scLabel = (group, v) => {
  const o = (SC_OPTS[group] || []).find(x => x.v === v);
  return o ? o.l : (v == null || v === '' ? '—' : String(v));
};

const SC_DEFAULTS = {
  // ── ดอกเบี้ยและการนับวัน ──
  dayCountYear: 'actual', fixedYearDays: 365, dayCountMethod: 'front',
  compoundDayCount: 'include', accrueDayCount: 'last',
  compoundTiming: 'eod', accrueCut: 'onevent', accrueSet: 'yearly', holidayMode: 'next',
  closeIntDays: 0, payIntOnCloseMin: 0,
  // ── การปัดเศษ ──
  decimalsBeforeRound: 7, roundMethod: '5/4', roundScope: 'sumthenround', intCalcBase: 'lumpsum',
  taxRound: 'upbaht',
  // ── เช็ค / รับฝาก–ถอน ──
  checkInterest: 'cleared', checkClearDays: 1, checkLateTime: '12:00:00',
  cashCheckMode: 'no', cashTxnCheck: 'yes',
  wdTiers: [
    { role: 'เจ้าหน้าที่',        min: 0,        max: 1999999.99 },
    { role: 'หัวหน้าแผนก',        min: 2000000,  max: 4999999.99 },
    { role: 'ผู้ช่วยฝ่ายการเงิน', min: 5000000,  max: 9999999.99 },
    { role: 'ผู้จัดการ',          min: 10000000, max: '' },
  ],
  pbWithdrawNeed: true, pbDepositNeed: false, pbBalanceNeed: false,
  // ── การลงบัญชีและ Slip ──
  counterPosting: 'transfer', slipMode: 'none', cashGl: '110110',
  voucherPrint: 'none', transferPosting: 'bymove',
  maintOrder: 'bod',
  // ── เลขที่บัญชีและการพิมพ์ ──
  acctStoreFormat: 'BTTrrrrrrr', acctDisplayFormat: 'X-XX-XXXXXXX',
  progPrintCommand: '', progControlCode: '', progTemplate: '', progMapping: '',
};

// ─── โครงสร้างแท็บ (declarative) ─────────────────────────────────────
const SC_TABS = [
  { id: 'interest', label: 'ดอกเบี้ยและการนับวัน', groups: [
    { title: 'หลักเกณฑ์การนับวันคำนวณดอกเบี้ย', sub: 'ใช้กับการคำนวณระยะเวลาที่เงินฝากได้รับดอกเบี้ย เช่น วันเริ่มฝาก วันถอน วันปิดบัญชี', fields: [
      { k: 'dayCountYear', label: 'จำนวนวันคำนวณดอกเบี้ย/ปี', type: 'sel', opts: 'dayCountYear' },
      { k: 'fixedYearDays', label: 'จำนวนวันต่อปี', type: 'num', suffix: 'วัน', max: 366, when: (s) => s.dayCountYear === 'fixed365', indent: true },
      { k: 'dayCountMethod', label: 'วิธีนับวันคิดดอกเบี้ย', type: 'sel', opts: 'dayCountMethod' },
    ] },
    { title: 'การนับวันสำหรับการทบดอกเบี้ย', sub: 'ควบคุมการประมวลผลดอกเบี้ยค้างและดอกเบี้ยทบต้น', fields: [
      { k: 'compoundDayCount', label: 'การนับวันทบดอกเบี้ย', type: 'sel', opts: 'compoundDayCount' },
      { k: 'accrueDayCount', label: 'การนับวันดอกเบี้ยค้าง', type: 'sel', opts: 'accrueDayCount' },
    ] },
    { title: 'ดอกเบี้ยทบต้นและดอกเบี้ยค้าง', fields: [
      { k: 'compoundTiming', label: 'การเข้าดอกเบี้ยทบต้น (ช่วงเวลา)', type: 'sel', opts: 'compoundTiming' },
      { k: 'accrueCut', label: 'การตัดดอกเบี้ยค้างจ่าย', type: 'sel', opts: 'accrueCut' },
      { k: 'holidayMode', label: 'ข้อมูลวันหยุดไปบัญชี', type: 'sel', opts: 'holidayMode' },
    ] },
    { title: 'การปิดบัญชี', fields: [
      { k: 'closeIntDays', label: 'วันคิดดอกเบี้ยกรณีปิดบัญชี', type: 'num', suffix: 'วัน', max: 130 },
      { k: 'payIntOnCloseMin', label: 'จ่ายดอกเบี้ยเมื่อปิดบัญชี เมื่อมากกว่า', type: 'num', decimals: 2, suffix: 'บาท', max: 130 },
    ] },
  ] },
  { id: 'rounding', label: 'การปัดเศษ', groups: [
    { title: 'การปัดเศษดอกเบี้ย', sub: 'รักษาความแม่นยำของการคำนวณก่อนแสดงหรือบันทึกยอดจริง', fields: [
      { k: 'decimalsBeforeRound', label: 'จำนวนตำแหน่งทศนิยมก่อนปัด', type: 'num', suffix: 'ตำแหน่ง', max: 90 },
      { k: 'roundMethod', label: 'วิธีปัดเศษดอกเบี้ยสะสม', type: 'sel', opts: 'roundMethod' },
      { k: 'roundScope', label: 'วิธีการปัดเศษ', type: 'sel', opts: 'roundScope' },
      { k: 'intCalcBase', label: 'วิธีคิดดอกเบี้ย', type: 'sel', opts: 'intCalcBase' },
    ] },
    { title: 'การปัดเศษภาษี', sub: 'ใช้คำนวณและสร้างรายการบัญชีภาษีหัก ณ ที่จ่ายโดยอัตโนมัติ', fields: [
      { k: 'taxRound', label: 'วิธีปัดเศษภาษี', type: 'sel', opts: 'taxRound' },
    ] },
  ] },
  { id: 'checkcash', label: 'เช็คและการรับฝาก–ถอน', groups: [
    { title: 'รายการเช็ค', sub: 'หลักเกณฑ์การคิดดอกเบี้ยและการรอผ่านเช็ค', fields: [
      { k: 'checkInterest', label: 'การคิดดอกเบี้ยรายการเช็ค', type: 'sel', opts: 'checkInterest' },
      { k: 'checkClearDays', label: 'จำนวนวันผ่านเช็ค', type: 'num', suffix: 'วัน', max: 90 },
      { k: 'checkLateTime', label: 'เวลาเช็ค Late / Cut-off', type: 'time' },
    ] },
    { title: 'การตรวจสอบรายการเงินสด', fields: [
      { k: 'cashCheckMode', label: 'การตรวจสอบรายการเงินสด', type: 'sel', opts: 'cashCheckMode' },
    ] },
    { title: 'เงื่อนไขการใช้สมุดคู่ฝาก', sub: 'เมื่อเปิดใช้งาน ระบบจะตรวจสอบข้อมูลสมุดก่อนอนุญาตให้ทำรายการ', fields: [
      { k: 'pbWithdrawNeed', label: 'ถอนเงินต้องใช้สมุด', type: 'check' },
      { k: 'pbDepositNeed', label: 'ฝากเงินต้องใช้สมุด', type: 'check' },
      { k: 'pbBalanceNeed', label: 'ดูยอดคงเหลือต้องใช้สมุด', type: 'check' },
    ] },
  ] },
  { id: 'wdlimit', label: 'กำหนดการถอนตามวงเงิน', full: true, groups: [
    { title: '', sub: 'ผู้มีอำนาจอนุมัติการถอนตามยอดเงินต่อรายการ — ยอดที่เกินวงเงินของผู้ทำรายการต้องส่งให้ผู้มีอำนาจลำดับถัดไปอนุมัติ', fields: [
      { k: 'wdTiers', type: 'wdtiers', label: 'ช่วงวงเงินการถอน' },
    ] },
  ] },
  { id: 'posting', label: 'การลงบัญชีและ Slip', groups: [
    { title: 'การลงบัญชีดอกเบี้ย', sub: 'กำหนดประเภทรายการและรูปแบบการส่งเข้าสู่ระบบบัญชี', fields: [
      { k: 'transferPosting', label: 'การลงบัญชีดอกเบี้ยโอน', type: 'sel', opts: 'transferPosting' },
      { k: 'maintOrder', label: 'ลำดับการประมวลผลค่ารักษาบัญชี', type: 'sel', opts: 'maintOrder' },
      { k: 'cashGl', label: 'คู่บัญชีเงินสด', type: 'txt', mono: true, placeholder: '110110' },
    ] },
    { title: 'Slip และใบสำคัญ', fields: [
      { k: 'slipMode', label: 'การสร้าง Slip ดอกเบี้ย', type: 'sel', opts: 'slipMode' },
      { k: 'voucherPrint', label: 'การพิมพ์ใบสำคัญจ่ายดอกเบี้ย', type: 'sel', opts: 'voucherPrint' },
    ] },
  ] },
  { id: 'format', label: 'เลขที่บัญชี', groups: [
    { title: 'รูปแบบเลขที่บัญชี', sub: 'แยกเลขบัญชีจริงที่จัดเก็บออกจากรูปแบบที่ใช้แสดงผลในหน้าจอ/รายงาน/ใบเสร็จ/Slip/สมุด', fields: [
      { k: 'acctStoreFormat', label: 'รูปแบบจัดเก็บในฐานข้อมูล', type: 'txt', mono: true, placeholder: 'BTTrrrrrrr' },
      { k: 'acctDisplayFormat', label: 'รูปแบบการแสดงผล', type: 'txt', mono: true, placeholder: 'X-XX-XXXXXXX' },
    ] },
  ] },
];

// label map + formatter for diff / audit
const SC_LABELS = {};
SC_TABS.forEach(t => t.groups.forEach(g => g.fields.forEach(f => { SC_LABELS[f.k] = f.label; })));
function scFmtVal(f, v) {
  if (f && f.type === 'wdtiers') {
    const m = (x) => x === '' || x == null ? 'ไม่จำกัด' : Number(x).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return Array.isArray(v) && v.length ? v.map(r => r.role + ' ' + m(r.min) + '–' + m(r.max)).join(' · ') : '—';
  }
  if (v === true) return 'เปิด'; if (v === false) return 'ปิด';
  if (v === '' || v == null) return '—';
  if (f && f.type === 'sel') return scLabel(f.opts, v);
  return String(v);
}
const SC_FIELD_BY_KEY = {};
SC_TABS.forEach(t => t.groups.forEach(g => g.fields.forEach(f => { SC_FIELD_BY_KEY[f.k] = f; })));
function scDiff(before, after) {
  const out = [];
  Object.keys(SC_LABELS).forEach(k => {
    const same = (Array.isArray(before[k]) || Array.isArray(after[k]))
      ? JSON.stringify(before[k]) === JSON.stringify(after[k]) : before[k] === after[k];
    if (!same) out.push({ field: SC_LABELS[k], before: scFmtVal(SC_FIELD_BY_KEY[k], before[k]), after: scFmtVal(SC_FIELD_BY_KEY[k], after[k]) });
  });
  return out;
}

function scfgLoad() {
  let v = { ...SC_DEFAULTS };
  try { const s = localStorage.getItem('dep_sysconfig'); if (s) v = { ...SC_DEFAULTS, ...JSON.parse(s) }; } catch (e) {}
  if (typeof v.cashTxnCheck === 'boolean') v.cashTxnCheck = v.cashTxnCheck ? 'yes' : 'no';
  if (v.taxGl && v.cashGl === '110101') v.cashGl = v.taxGl;
  // ค่าเดิมที่ไม่มีในตัวเลือกปัจจุบัน → ใช้ค่าตั้งต้น
  ['dayCountYear', 'dayCountMethod', 'compoundTiming', 'checkInterest', 'roundMethod', 'roundScope', 'intCalcBase', 'taxRound', 'counterPosting', 'slipMode', 'voucherPrint', 'maintOrder', 'transferPosting', 'accrueCut', 'accrueSet', 'holidayMode', 'compoundDayCount', 'accrueDayCount', 'cashTxnCheck'].forEach(k => { if (!SC_OPTS[k].some(o => o.v === v[k])) v[k] = SC_DEFAULTS[k]; });
  return v;
}
function scfgSaveLS(v) { try { localStorage.setItem('dep_sysconfig', JSON.stringify(v)); localStorage.setItem('dep_sysconfig_at', new Date().toISOString()); } catch (e) {} }
function scfgLoadAt() { try { const s = localStorage.getItem('dep_sysconfig_at'); return s ? new Date(s) : null; } catch (e) { return null; } }
const scfgFmtAt = (d) => d ? d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

// ─── Field primitives (view/edit aware) ──────────────────────────────
function ScNum({ v, editing, onChange, decimals, suffix, max }) {
  if (!editing) return <div className="l2-val num">{v === '' || v == null ? '—' : (decimals != null ? fmt.money(Number(v || 0), decimals) : v)}{suffix ? <span className="l2-suf"> {suffix}</span> : null}</div>;
  return (
    <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
      <input className="l2-input num" type="number" inputMode="decimal" style={{ width: max || 150, maxWidth: max || 150 }} step={decimals ? '0.01' : '1'} value={v} onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="l2-suf" style={{ minWidth: 30, textAlign: 'left' }}>{suffix}</span>}
    </div>
  );
}
function ScSel({ opts, v, editing, onChange }) {
  if (!editing) return <div className="l2-val">{scLabel(opts, v)}</div>;
  return <select className="l2-select" value={v} onChange={(e) => onChange(e.target.value)}>{SC_OPTS[opts].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>;
}
function ScTxt({ v, editing, onChange, mono, placeholder }) {
  if (!editing) return <div className={"l2-val" + (mono ? ' mono' : '')}>{v || '—'}</div>;
  return <input className={"l2-input" + (mono ? ' mono' : '')} value={v || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
// เวลาไทย 24 ชม. (ไม่ใช้ AM/PM) — เลือกชั่วโมง/นาที/วินาที
function ScTime({ v, editing, onChange }) {
  const p = String(v || '00:00:00').split(':');
  const hh = (p[0] || '00').padStart(2, '0'), mm = (p[1] || '00').padStart(2, '0'), ss = (p[2] || '00').padStart(2, '0');
  if (!editing) return <div className="l2-val mono">{v ? `${hh}:${mm}:${ss}` : '—'}<span className="l2-suf"> น.</span></div>;
  const pad = (n) => String(n).padStart(2, '0');
  const unit = (count, val, idx) => (
    <select className="l2-select mono" style={{ maxWidth: 66, textAlign: 'center' }} value={val}
      onChange={(e) => { const parts = [hh, mm, ss]; parts[idx] = e.target.value; onChange(parts.join(':')); }}>
      {Array.from({ length: count }, (_, i) => pad(i)).map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <div className="l2-inwrap" style={{ justifyContent: 'flex-end', gap: 4 }}>
      {unit(24, hh, 0)}<span className="l2-suf">:</span>{unit(60, mm, 1)}<span className="l2-suf">:</span>{unit(60, ss, 2)}
      <span className="l2-suf">น.</span>
    </div>
  );
}
function ScArea({ v, editing, onChange, mono, placeholder }) {
  if (!editing) return <div className={"l2-val" + (mono ? ' mono' : '')} style={{ whiteSpace: 'pre-wrap', textAlign: 'left', minHeight: 'auto' }}>{v || <span className="muted">—</span>}</div>;
  return <textarea className={"cfg-input" + (mono ? ' mono' : '')} rows={2} style={{ width: '100%', resize: 'vertical' }} value={v || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
function ScCheck({ label, checked, editing, onChange, indent }) {
  return (
    <label className={"l2-check lp-check-item" + (editing ? '' : ' ro') + (indent ? ' indent' : '')} style={indent ? { paddingLeft: 18 } : undefined}>
      <input type="checkbox" className="ct-check" checked={!!checked} disabled={!editing} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
const SC_WD_ROLES = ['เจ้าหน้าที่', 'หัวหน้าแผนก', 'ผู้ช่วยฝ่ายการเงิน', 'ผู้จัดการฝ่ายการเงิน', 'รองผู้จัดการ', 'ผู้จัดการ'];
function ScWdTiers({ v, editing, onChange }) {
  const rows = Array.isArray(v) ? v : [];
  const upd = (i, k, x) => onChange(rows.map((r, j) => j === i ? { ...r, [k]: x } : r));
  const r2 = (x) => Math.round(Number(x) * 100) / 100;
  const num = (x) => x === '' || x == null ? '' : String(x);
  const money = (x) => x === '' || x == null ? 'ไม่จำกัด' : Number(x).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const add = () => {
    const last = rows[rows.length - 1];
    if (!last) return onChange([{ role: SC_WD_ROLES[0], min: 0, max: '' }]);
    const nextRole = SC_WD_ROLES[Math.min(SC_WD_ROLES.indexOf(last.role) + 1, SC_WD_ROLES.length - 1)] || SC_WD_ROLES[0];
    if (last.max === '' || last.max == null) {
      // แถวสุดท้ายไม่จำกัด → ปิดเพดานแถวนั้น แล้วเพิ่มช่วงใหม่ต่อท้ายแบบไม่จำกัด
      const newMin = r2(Number(last.min || 0) + 1000000);
      return onChange([...rows.slice(0, -1), { ...last, max: r2(newMin - 0.01) }, { role: nextRole, min: newMin, max: '' }]);
    }
    onChange([...rows, { role: nextRole, min: r2(Number(last.max) + 0.01), max: '' }]);
  };
  const issues = [];
  rows.forEach((r, i) => {
    const mn = r.min === '' ? NaN : Number(r.min), mx = r.max === '' ? Infinity : Number(r.max);
    if (isNaN(mn)) issues.push('ลำดับ ' + (i + 1) + ': ยังไม่ระบุยอด "ตั้งแต่"');
    else if (mn > mx) issues.push('ลำดับ ' + (i + 1) + ': ยอด "ตั้งแต่" มากกว่ายอด "ถึง"');
    if (i > 0) {
      const pmx = rows[i - 1].max === '' ? Infinity : Number(rows[i - 1].max);
      if (pmx === Infinity) issues.push('ลำดับ ' + i + ': ช่วงไม่จำกัดต้องเป็นแถวสุดท้าย');
      else if (!isNaN(mn) && mn <= pmx) issues.push('ลำดับ ' + (i + 1) + ': ช่วงเงินซ้อนกับลำดับ ' + i);
      else if (!isNaN(mn) && r2(mn - pmx) > 0.01) issues.push('ลำดับ ' + (i + 1) + ': มีช่องว่างระหว่างลำดับ ' + i + ' (' + money(pmx) + ' → ' + money(mn) + ')');
    }
  });
  const del = (i) => onChange(rows.filter((_, j) => j !== i));
  return (
    <div style={{ padding: '4px 0 8px' }}>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl" style={{ width: '100%', tableLayout: 'fixed', minWidth: 0 }}>
          <colgroup>
            <col style={{ width: 56 }} />
            <col />
            <col style={{ width: '22%' }} />
            <col style={{ width: '22%' }} />
            {editing && <col style={{ width: 84 }} />}
          </colgroup>
          <thead><tr>
            <th className="center">ลำดับ</th>
            <th>ตำแหน่งผู้มีอำนาจ</th>
            <th className="num">ตั้งแต่ (บาท)</th>
            <th className="num">ถึง (บาท)</th>
            {editing && <th className="center">จัดการ</th>}
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="center muted">{i + 1}</td>
                <td>{editing
                  ? <select className="cfg-input" value={r.role} onChange={(e) => upd(i, 'role', e.target.value)}>
                      {[...new Set([...SC_WD_ROLES, r.role])].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  : r.role}</td>
                <td className="num mono">{editing
                  ? <input className="cfg-input mono num" inputMode="decimal" value={num(r.min)} onChange={(e) => upd(i, 'min', e.target.value.replace(/[^0-9.]/g, ''))} />
                  : money(r.min)}</td>
                <td className="num mono">{editing
                  ? <input className="cfg-input mono num" inputMode="decimal" value={num(r.max)} placeholder="ไม่จำกัด" onChange={(e) => upd(i, 'max', e.target.value.replace(/[^0-9.]/g, ''))} />
                  : money(r.max)}</td>
                {editing && <td className="center"><button className="btn sm tt-del-btn" disabled={rows.length <= 1} onClick={() => del(i)}><Icon name="trash" size={13} /> ลบ</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
      {issues.length > 0 && (
        <div className="sr-error" style={{ marginTop: 8, display: 'block' }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}><Icon name="info" size={13} /> ช่วงวงเงินไม่ต่อเนื่อง — กรุณาแก้ไขก่อนบันทึก</div>
          {issues.map((t, i) => <div key={i} style={{ fontSize: 12 }}>• {t}</div>)}
        </div>
      )}
      {editing && <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn sm" onClick={add}><Icon name="plus" size={13} /> เพิ่มช่วงวงเงิน</button>
      </div>}
    </div>
  );
}

function scWdTierError(rows) {
  if (!Array.isArray(rows)) return '';
  for (let i = 0; i < rows.length; i++) {
    const mn = rows[i].min === '' ? NaN : Number(rows[i].min), mx = rows[i].max === '' ? Infinity : Number(rows[i].max);
    if (isNaN(mn) || mn > mx) return 'ช่วงวงเงินลำดับ ' + (i + 1) + ' ไม่ถูกต้อง';
    if (i > 0) {
      const pmx = rows[i - 1].max === '' ? Infinity : Number(rows[i - 1].max);
      if (pmx === Infinity || mn <= pmx || Math.round((mn - pmx) * 100) / 100 > 0.01) return 'ช่วงวงเงินลำดับ ' + i + '–' + (i + 1) + ' ซ้อนกันหรือไม่ต่อเนื่อง';
    }
  }
  return '';
}

function ScField({ f, s, editing, set }) {
  if (f.when && !f.when(s)) return null;
  const v = s[f.k];
  if (f.type === 'wdtiers') return <ScWdTiers v={v} editing={editing} onChange={(x) => set(f.k, x)} />;
  if (f.type === 'check') return <ScCheck label={f.label} checked={v} editing={editing} indent={f.indent} onChange={(x) => set(f.k, x)} />;
  const ctrl =
    f.type === 'num' ? <ScNum v={v} editing={editing} decimals={f.decimals} suffix={f.suffix} max={f.max} onChange={(x) => set(f.k, x)} />
    : f.type === 'sel' ? <ScSel opts={f.opts} v={v} editing={editing} onChange={(x) => set(f.k, x)} />
    : f.type === 'time' ? <ScTime v={v} editing={editing} onChange={(x) => set(f.k, x)} />
    : f.type === 'area' ? <ScArea v={v} editing={editing} mono={f.mono} placeholder={f.placeholder} onChange={(x) => set(f.k, x)} />
    : <ScTxt v={v} editing={editing} mono={f.mono} placeholder={f.placeholder} onChange={(x) => set(f.k, x)} />;
  if (f.type === 'area') {
    return (
      <div className="l2-row" style={{ display: 'block' }}>
        <div className="l2-label" style={{ marginBottom: 4 }}>{f.label}</div>
        <div className="l2-ctrl" style={{ width: '100%' }}>{ctrl}</div>
      </div>
    );
  }
  return (
    <div className={"l2-row" + (f.indent ? ' indent' : '')}>
      <div className="l2-label">{f.label}</div>
      <div className="l2-ctrl">{ctrl}</div>
    </div>
  );
}
function ScGroup({ g, s, editing, set }) {
  return (
    <div className="l2-group">
      {g.title && <div className="l2-gh">
        <span className="l2-gh-t">{g.title}</span>
        {g.restricted && <span className="chip warning" style={{ marginLeft: 8 }}><Icon name="lock" size={11} /> จำกัดสิทธิ์</span>}
      </div>}
      {g.title && g.sub && <div className="muted" style={{ fontSize: 11, padding: '0 0 6px', lineHeight: 1.4 }}>{g.sub}</div>}
      {g.fields.map(f => <ScField key={f.k} f={f} s={s} editing={editing} set={set} />)}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function DepSystemConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [saved, setSaved] = useState(scfgLoad);
  const [draft, setDraft] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('interest');
  const [savedAt, setSavedAt] = useState(scfgLoadAt);
  const [askCancel, setAskCancel] = useState(false);
  const [askSave, setAskSave] = useState(null);
  const s = editing ? draft : saved;
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  const startEdit = () => { setDraft(saved); setEditing(true); };
  const cancel = () => { setDraft(saved); setEditing(false); setAskCancel(false); };
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const askToCancel = () => { if (isDirty) setAskCancel(true); else cancel(); };
  const requestSave = () => {
    const tierErr = scWdTierError(draft.wdTiers);
    if (tierErr) { setTab('wdlimit'); onToast && onToast(tierErr + ' — กรุณาแก้ไขก่อนบันทึก'); return; }
    setAskSave(scDiff(saved, draft));
  };
  const save = () => {
    setAskSave(null);
    const changes = scDiff(saved, draft);
    scfgSaveLS(draft); setSaved(draft); setEditing(false); setSavedAt(new Date());
    audit.log({ action: 'update', module: 'เงินฝาก — ข้อกำหนดระบบเงินฝาก', target: 'ค่าระดับระบบ (System Config)',
      summary: changes.length ? `แก้ไขข้อกำหนดระบบเงินฝาก (${changes.length} รายการ)` : 'บันทึกข้อกำหนดระบบเงินฝาก (ไม่มีการเปลี่ยนแปลง)', changes });
    window.depSuccess({ title: 'บันทึกข้อกำหนดระบบเงินฝากเรียบร้อยแล้ว', desc: changes.length ? 'เปลี่ยนแปลง ' + changes.length + ' รายการ — มีผลทันที' : 'ไม่มีค่าที่เปลี่ยนแปลง' });
    false && onToast(changes.length ? `บันทึกข้อกำหนดระบบเงินฝากแล้ว (${changes.length} รายการ)` : 'บันทึกข้อกำหนดระบบเงินฝากแล้ว');
  };

  const [askTab, setAskTab] = useState(null);
  const goTab = (id) => { if (id === tab) return; if (editing && isDirty) setAskTab(id); else setTab(id); };
  const stayOnTab = () => setAskTab(null);
  const discardTab = () => { setAskTab(null); setDraft(saved); };
  const saveTabAndGo = () => {
    const to = askTab;
    const tierErr = scWdTierError(draft.wdTiers);
    if (tierErr) { setAskTab(null); setTab('wdlimit'); onToast && onToast(tierErr + ' — กรุณาแก้ไขก่อนบันทึก'); return; }
    const changes = scDiff(saved, draft);
    scfgSaveLS(draft); setSaved(draft); setSavedAt(new Date());
    audit.log({ action: 'update', module: 'เงินฝาก — ข้อกำหนดระบบเงินฝาก', target: 'ค่าระดับระบบ (System Config)',
      summary: `แก้ไขข้อกำหนดระบบเงินฝาก (${changes.length} รายการ)`, changes });
    onToast && onToast('บันทึกการเปลี่ยนแปลงแล้ว');
    setAskTab(null); setTab(to);
  };
  const cur = SC_TABS.find(t => t.id === tab) || SC_TABS[0];

  return (
    <div data-screen-label="หน้าข้อกำหนดระบบเงินฝาก" className="sc-page">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ข้อกำหนดระบบเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตั้งค่ากลางของระบบเงินฝาก — ดอกเบี้ย การปัดเศษ เช็ค การฝาก–ถอน และการลงบัญชี</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flex: '0 0 auto' }}>
          <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            <Icon name="clock-circle" size={11} /> บันทึกล่าสุด: {savedAt ? scfgFmtAt(savedAt) : 'ยังไม่มีการบันทึก'}
          </span>
          {!editing
            ? <button className="btn primary sm" data-keep-top="" onClick={startEdit}><Icon name="edit" /> แก้ไขค่าระบบ</button>
            : <>
                <button className="btn sm" data-keep-top="" onClick={askToCancel}>ยกเลิก</button>
                <button className="btn primary sm" data-keep-top="" onClick={requestSave}><Icon name="check" /> บันทึกข้อกำหนด</button>
              </>}
        </div>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="cog" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="lt-ab-label">การกำหนดค่าระดับระบบ (System Configuration)</div>
          <div className="lt-ab-name">ระบบเงินฝาก
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · มีผลทันทีกับทุกบัญชีเงินฝาก</span>
          </div>
        </div>
        {editing
          ? <span className="chip warning"><Icon name="edit" size={11} /> กำลังแก้ไข</span>
          : <span className="chip"><Icon name="info" size={11} /> โหมดดูอย่างเดียว</span>}
      </div>

      <div className="tabs-container sc-scroll" style={{ marginTop: 12, borderRadius: 'var(--radius-lg)' }}>
        <div className="sc-scroll-inner">
        <div className="tabs-bar">
          {SC_TABS.map(t => (
            <button key={t.id} className={"tab" + (t.id === tab ? ' active' : '')} onClick={() => goTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="l2-card" style={{ background: 'transparent', border: 0, borderRadius: 0, padding: 16 }}>
          <div className="l2-cols" style={cur.full ? { gridTemplateColumns: 'minmax(0,1fr)' } : undefined}>
            {(() => {
              const gs = cur.groups;
              const mid = cur.full ? gs.length : Math.ceil(gs.length / 2);
              const colA = gs.slice(0, mid), colB = gs.slice(mid);
              return (
                <>
                  <div className="l2-col">{colA.map((g, i) => <ScGroup key={i} g={g} s={s} editing={editing} set={set} />)}</div>
                  {colB.length > 0 && <div className="l2-col">{colB.map((g, i) => <ScGroup key={i} g={g} s={s} editing={editing} set={set} />)}</div>}
                </>
              );
            })()}
          </div>
        </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ทุกการแก้ไขบันทึกใน Audit Log (ผู้แก้ไข วันเวลา ค่าเดิม/ค่าใหม่)
      </div>

      {askSave && (
        <window.DepChangeConfirm title="บันทึกการเปลี่ยนแปลง?"
          subtitle="มีผลกับการคิดดอกเบี้ยและการทำรายการของทุกบัญชี"
          changes={askSave} okLabel="ยืนยันบันทึก" onOk={save} onClose={() => setAskSave(null)} />
      )}
      {askCancel && <window.DepDiscardConfirm onKeep={() => setAskCancel(false)} onDiscard={cancel} />}
      {askTab && (
        <window.DepStatusDialog tone="confirm" title="บันทึกการแก้ไข?"
          desc="บันทึกการเปลี่ยนแปลงก่อน จึงจะเปลี่ยนไปแท็บอื่นได้"
          cancelLabel="ละทิ้ง" okLabel={<><Icon name="check" size={14} /> บันทึก</>}
          onCancel={discardTab} onOk={saveTabAndGo} onClose={stayOnTab} />
      )}
    </div>
  );
}

Object.assign(window, { DepSystemConfigPage });
