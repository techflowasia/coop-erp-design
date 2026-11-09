// ════════════════════════════════════════════════════════════════════
//  ระบบขอสินไหม / ประกันสมาชิก — สมาชิก สสอร. / สส.ชสอ.
//  ทะเบียนสมาชิกสมาคมฌาปนกิจสงเคราะห์ (สมาชิก 1 คน สังกัดได้ 1 สมาคม)
//  เรียกเก็บแบบรายศพ · สมัคร → ส่งสมาคม → อนุมัติ → รอคุ้มครอง → คุ้มครอง
// ════════════════════════════════════════════════════════════════════
const { useState: useStateCM, useMemo: useMemoCM, useRef: useRefCM } = React;

window.CM_ASSOCS_SEED = [
  { id: 'SSOR', short: 'สสอร.', name: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกสหกรณ์ออมทรัพย์ไทย (สสอร.)',
    ratePerDeath: 1, advance: 3000, regFee: 20, annualFee: 20, waitDays: 180, maxAge: 70, lapseRule: '3p' },
  { id: 'SSCHSO', short: 'สส.ชสอ.', name: 'สมาคมฌาปนกิจสงเคราะห์สมาชิกชุมนุมสหกรณ์ออมทรัพย์แห่งประเทศไทย (สส.ชสอ.)',
    ratePerDeath: 1, advance: 4000, regFee: 50, annualFee: 20, waitDays: 180, maxAge: 75, lapseRule: '90d' },
];
const CM_LAPSE_RULES = [
  { v: '3p', l: 'ค้างชำระ 3 งวดติดกัน' },
  { v: '90d', l: 'ค้างชำระเกิน 90 วัน' },
];
const CM_PAY = [
  { v: 'invoice', l: 'หักผ่านใบเรียกเก็บรายเดือน' },
  { v: 'deposit', l: 'หักบัญชีเงินฝาก' },
  { v: 'loan', l: 'หักจากเงินกู้ตอนรับเงิน' },
  { v: 'cash', l: 'ชำระเงินสด / โอน' },
];
const CM_STATUS = {
  submit:   { l: 'รอยื่นสมาคม', pill: 'neutral' },
  approve:  { l: 'รออนุมัติ', pill: 'info' },
  waiting:  { l: 'รอคุ้มครอง', pill: 'warn' },
  active:   { l: 'คุ้มครอง', pill: 'ok' },
  lapsed:   { l: 'พ้นสภาพ', pill: 'bad' },
  deceased: { l: 'เสียชีวิต', pill: 'bad' },
};
const CM_END_TYPES = [
  { v: 'resign', l: 'ลาออกจากสมาคม' },
  { v: 'arrears', l: 'ขาดส่งเงินสงเคราะห์' },
  { v: 'deceased', l: 'เสียชีวิต' },
];
const CM_USER = 'จันทร์เพ็ญ มาลี';

// ผู้สมัครได้ (สาธิต)
window.CM_CANDIDATES = [
  { code: 'M-061120', name: 'นางสาวกมลวรรณ ศรีสุข', citizenId: '1-1002-00451-22-9', birthDate: '1988-07-02', dept: 'ฝ่ายบริการลูกค้า' },
  { code: 'M-047733', name: 'นายประสิทธิ์ ทองดี', citizenId: '3-1201-00733-18-4', birthDate: '1960-01-21', dept: 'กองโครงข่าย' },
  { code: 'M-052008', name: 'นางรัชนี วงศ์ใหญ่', citizenId: '3-1005-00208-61-2', birthDate: '1972-11-30', dept: 'สำนักงานปลัด' },
  { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3', birthDate: '1962-03-14', dept: 'กองคลัง สำนักงานปลัด' },
];

const cmMoney = (n) => (window.fmt ? window.fmt.money(Number(n) || 0, 0) : Number(n || 0).toLocaleString('th-TH'));
const cmDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
};
const CM_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const cmPeriod = (ym) => { const [y, m] = String(ym).split('-'); return `${CM_MON[+m - 1]} ${+y + 543}`; };
const cmAddDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const cmAge = (birth, at) => { const b = new Date(birth), a = new Date(at); let y = a.getFullYear() - b.getFullYear(); if (a < new Date(a.getFullYear(), b.getMonth(), b.getDate())) y--; return y; };
const cmPayLabel = (v) => (CM_PAY.find(p => p.v === v) || {}).l || '—';
let _cmSeq = 100;
const CM_WD = window.DEPOSIT_WORKING_DATE || '2026-06-02';
const cmYmShift = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const CM_WM = CM_WD.slice(0, 7);

// งวดย้อนหลัง (สาธิต) — unpaidLast = จำนวนงวดล่าสุดที่ยังไม่ชำระ
function cmMakePeriods(channel, unpaidLast) {
  const deaths = [262, 281, 274, 296, 288, 280];
  const months = [-6, -5, -4, -3, -2, -1].map(n => cmYmShift(CM_WM, n));
  return months.map((ym, i) => {
    const unpaid = i >= months.length - unpaidLast;
    return { ym, deaths: deaths[i], amount: deaths[i], paid: unpaid ? 0 : deaths[i],
      channel, payDate: unpaid ? '' : ym + '-28', status: unpaid ? 'unpaid' : 'paid' };
  });
}

window.CM_SEED = [
  { code: 'M-058112', name: 'นายวิชัย พึ่งบุญ', citizenId: '3-1007-00112-09-1', dept: 'กองคลัง', birthDate: '1965-02-10',
    assoc: 'SSOR', assocNo: 'สสอร-0412233', applyDate: '2019-03-01', approveDate: '2019-03-20', coverStart: '2019-09-16',
    status: 'active', pay: 'invoice', unpaid: 0 },
  { code: 'M-049920', name: 'นางสุภาพร แก้วมณี', citizenId: '3-1101-00920-77-5', dept: 'ฝ่ายบัญชี', birthDate: '1968-09-05',
    assoc: 'SSCHSO', assocNo: 'ชสอ-1088120', applyDate: '2018-06-11', approveDate: '2018-07-02', coverStart: '2018-12-29',
    status: 'active', pay: 'deposit', unpaid: 0 },
  { code: 'M-055418', name: 'นายอนุชา รุ่งเรือง', citizenId: '3-1209-00418-33-0', dept: 'กองโครงข่าย', birthDate: '1970-04-17',
    assoc: 'SSOR', assocNo: 'สสอร-0533019', applyDate: '2021-01-15', approveDate: '2021-02-01', coverStart: '2021-07-31',
    status: 'active', pay: 'cash', unpaid: 2 },
  { code: 'M-044207', name: 'นายธนพล ศรีวงศ์', citizenId: '3-1003-00207-15-8', dept: 'ฝ่ายพัสดุ', birthDate: '1961-12-01',
    assoc: 'SSCHSO', assocNo: 'ชสอ-0977341', applyDate: '2016-05-20', approveDate: '2016-06-10', coverStart: '2016-12-07',
    status: 'active', pay: 'cash', unpaid: 3 },
  { code: 'M-060315', name: 'นางสาวปิยะดา มีสุข', citizenId: '1-1009-00315-40-6', dept: 'ฝ่ายบริการลูกค้า', birthDate: '1990-08-22',
    assoc: 'SSOR', assocNo: 'สสอร-0710552', applyDate: '2026-05-02', approveDate: '2026-05-20', coverStart: '2026-11-16',
    status: 'waiting', pay: 'loan', unpaid: 0 },
  { code: 'M-061004', name: 'นายกิตติศักดิ์ บุญมา', citizenId: '1-1205-01004-12-3', dept: 'กองโครงข่าย', birthDate: '1985-03-09',
    assoc: 'SSCHSO', assocNo: '', applyDate: '2026-09-18', approveDate: '', coverStart: '',
    status: 'approve', pay: 'invoice', unpaid: 0 },
  { code: 'M-061188', name: 'นางวราภรณ์ จันทร์งาม', citizenId: '3-1006-01188-50-7', dept: 'สำนักงานปลัด', birthDate: '1979-10-14',
    assoc: 'SSOR', assocNo: '', applyDate: '2026-10-01', approveDate: '', coverStart: '',
    status: 'submit', pay: 'deposit', unpaid: 0 },
  { code: 'M-039902', name: 'นายสมศักดิ์ ประเสริฐ', citizenId: '3-1002-00902-66-1', dept: 'กองคลัง', birthDate: '1955-06-30',
    assoc: 'SSOR', assocNo: 'สสอร-0200981', applyDate: '2012-02-01', approveDate: '2012-02-25', coverStart: '2012-08-23',
    status: 'deceased', pay: 'invoice', unpaid: 0, endDate: '2026-03-12', endType: 'deceased', endNote: 'เปิดเคสสมาชิกถึงแก่กรรม' },
  { code: 'M-050777', name: 'นางนิภา สายทอง', citizenId: '3-1104-00777-28-9', dept: 'ฝ่ายบัญชี', birthDate: '1966-01-19',
    assoc: 'SSCHSO', assocNo: 'ชสอ-1010236', applyDate: '2017-08-01', approveDate: '2017-08-21', coverStart: '2018-02-17',
    status: 'lapsed', pay: 'cash', unpaid: 0, endDate: '2026-02-28', endType: 'arrears', endNote: 'ขาดส่งเงินสงเคราะห์เกิน 90 วัน' },
].map(r => {
  const o = { ...r };
  if (r.status === 'submit') o.applyDate = cmAddDays(CM_WD, -3);
  if (r.status === 'approve') o.applyDate = cmAddDays(CM_WD, -14);
  if (r.status === 'waiting') { o.applyDate = cmAddDays(CM_WD, -40); o.approveDate = cmAddDays(CM_WD, -25); o.coverStart = cmAddDays(o.approveDate, 180); }
  if (r.status === 'deceased') o.endDate = cmAddDays(CM_WD, -60);
  if (r.status === 'lapsed') o.endDate = cmAddDays(CM_WD, -95);
  return o;
}).map((r, i) => ({
  id: 'CM-' + String(i + 1).padStart(4, '0'),
  ...r,
  regFeePaid: true, advancePaid: r.status !== 'submit',
  health: true,
  bens: i % 2 === 0
    ? [{ name: 'คู่สมรสของ ' + r.name.split(' ')[0], relation: 'คู่สมรส', pct: 100, citizenId: '' }]
    : [{ name: 'บุตรคนที่ 1', relation: 'บุตร', pct: 50, citizenId: '' }, { name: 'บุตรคนที่ 2', relation: 'บุตร', pct: 50, citizenId: '' }],
  periods: ['active', 'lapsed', 'deceased'].includes(r.status) ? cmMakePeriods(r.pay, r.unpaid) : [],
  files: r.status === 'submit' ? [] : [{ name: 'ใบสมัครสมาชิก_' + r.code + '.pdf', size: '182 KB' }],
  history: [
    { date: r.applyDate, text: 'บันทึกใบสมัคร', by: CM_USER },
    ...(r.approveDate ? [{ date: r.approveDate, text: 'สมาคมอนุมัติ เลขสมาชิก ' + r.assocNo, by: CM_USER }] : []),
    ...(r.endDate ? [{ date: r.endDate, text: 'พ้นสภาพ — ' + r.endNote, by: CM_USER }] : []),
  ],
}));

const cmArrears = (r) => (r.periods || []).reduce((s, p) => s + (p.amount - p.paid), 0);
const cmUnpaidCount = (r) => (r.periods || []).filter(p => p.status === 'unpaid').length;
// เข้าเกณฑ์พ้นสภาพตามกฎของสมาคม
function cmHitsLapse(r, assoc, workDate) {
  if (r.status !== 'active' || !assoc) return false;
  const unpaid = (r.periods || []).filter(p => p.status === 'unpaid');
  if (!unpaid.length) return false;
  if (assoc.lapseRule === '3p') return unpaid.length >= 3;
  const oldest = unpaid[0].ym + '-28';
  return (new Date(workDate) - new Date(oldest)) / 86400000 > 90;
}

function CmField({ label, required, hint, error, children, full }) {
  return (
    <div className="sr-field" style={full ? { gridColumn: '1 / -1' } : null}>
      <label className="sr-label">
        {label}{required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
        {hint && <span className="sr-hint"> {hint}</span>}
      </label>
      {children}
      {error && <div className="mf-err"><Icon name="info" size={11} /> {error}</div>}
    </div>
  );
}
const cmBtnTrash = { background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' };
const cmBtnEye = { background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' };

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function CremationMembersPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const log = (e) => audit && audit.log && audit.log({ module: 'ขอสินไหม — สมาชิก สสอร. / สส.ชสอ.', changes: [], ...e });
  const workDate = CM_WD;
  const [assocs, setAssocs] = useStateCM(() => window.CM_ASSOCS_SEED.map(a => ({ ...a })));
  const [records, setRecords] = useStateCM(() => window.CM_SEED.map(r => ({ ...r })));
  const [q, setQ] = useStateCM('');
  const [assocF, setAssocF] = useStateCM('all');
  const [statusF, setStatusF] = useStateCM('all');
  const [payF, setPayF] = useStateCM('all');
  const [openId, setOpenId] = useStateCM(null);
  const [modal, setModal] = useStateCM(null); // 'new' | 'bill' | 'export' | 'cfg' | {end: rec} | {approve: rec}
  const [okMsg, setOkMsg] = useStateCM(null);

  const assocOf = (id) => assocs.find(a => a.id === id);
  const update = (id, fn) => setRecords(rs => rs.map(r => r.id === id ? fn(r) : r));
  const addHist = (r, text) => [...r.history, { date: workDate, text, by: CM_USER }];

  const yr = workDate.slice(0, 4);
  const stats = useMemoCM(() => ({
    active: records.filter(r => r.status === 'active').length,
    pending: records.filter(r => ['submit', 'approve', 'waiting'].includes(r.status)).length,
    arrears: records.filter(r => r.status === 'active' && cmArrears(r) > 0).length,
    ended: records.filter(r => ['lapsed', 'deceased'].includes(r.status) && String(r.endDate).startsWith(yr)).length,
  }), [records, yr]);

  const rows = useMemoCM(() => {
    let l = records;
    if (q.trim()) {
      const n = q.toLowerCase().replace(/[\s-]/g, '');
      l = l.filter(r => [r.code, r.name, r.citizenId, r.assocNo].some(v => String(v).toLowerCase().replace(/[\s-]/g, '').includes(n)));
    }
    if (assocF !== 'all') l = l.filter(r => r.assoc === assocF);
    if (payF !== 'all') l = l.filter(r => r.pay === payF);
    if (statusF === 'arrears') l = l.filter(r => r.status === 'active' && cmArrears(r) > 0);
    else if (statusF !== 'all') l = l.filter(r => r.status === statusF);
    return l;
  }, [records, q, assocF, statusF, payF]);

  // ── สมัครใหม่ ──
  const handleCreate = (f) => {
    const a = assocOf(f.assoc);
    const rec = {
      id: 'CM-' + String(++_cmSeq).padStart(4, '0'), code: f.member.code, name: f.member.name, citizenId: f.member.citizenId,
      dept: f.member.dept, birthDate: f.member.birthDate, assoc: f.assoc, assocNo: '', applyDate: f.applyDate,
      approveDate: '', coverStart: '', status: 'submit', pay: f.pay, health: f.health,
      regFeePaid: false, advancePaid: false, bens: f.bens.map(b => ({ ...b, pct: Number(b.pct) })), periods: [], files: [],
      history: [{ date: workDate, text: 'บันทึกใบสมัคร ' + a.short, by: CM_USER }],
    };
    setRecords(rs => [rec, ...rs]);
    log({ action: 'create', target: `${rec.code} · ${rec.name}`, summary: `บันทึกใบสมัคร ${a.short}` });
    setModal(null);
    setOkMsg({ title: 'บันทึกใบสมัครเรียบร้อยแล้ว', detail: `${rec.code} · ${rec.name} สถานะ “รอยื่นสมาคม” — ส่งรายชื่อให้สมาคมได้ที่ปุ่ม “ส่งออกไฟล์ให้สมาคม”` });
  };

  // ── ผลอนุมัติจากสมาคม ──
  const handleApprove = (rec, f) => {
    const a = assocOf(rec.assoc);
    const coverStart = cmAddDays(f.approveDate, a.waitDays);
    const status = coverStart <= workDate ? 'active' : 'waiting';
    update(rec.id, r => ({ ...r, assocNo: f.assocNo, approveDate: f.approveDate, coverStart, status, advancePaid: true, regFeePaid: true,
      history: addHist(r, `สมาคมอนุมัติ เลขสมาชิก ${f.assocNo} · เริ่มคุ้มครอง ${cmDate(coverStart)}`) }));
    log({ action: 'update', target: `${rec.code} · ${rec.name}`, summary: `บันทึกผลอนุมัติ ${a.short} (${f.assocNo})` });
    setModal(null);
    onToast && onToast(`บันทึกผลอนุมัติ ${rec.code} แล้ว — เริ่มคุ้มครอง ${cmDate(coverStart)}`);
  };

  // ── พ้นสภาพ / เสียชีวิต ──
  const handleEnd = (rec, f) => {
    const t = CM_END_TYPES.find(x => x.v === f.type);
    update(rec.id, r => ({ ...r, status: f.type === 'deceased' ? 'deceased' : 'lapsed', endType: f.type, endDate: f.date, endNote: f.note,
      history: addHist(r, `${f.type === 'deceased' ? 'แจ้งเสียชีวิต' : 'พ้นสภาพ'} — ${t.l}${f.note ? ' · ' + f.note : ''}`) }));
    log({ action: 'update', target: `${rec.code} · ${rec.name}`, summary: `แจ้ง${t.l} (${assocOf(rec.assoc).short})` });
    setModal(null);
    setOkMsg({ title: f.type === 'deceased' ? 'บันทึกแจ้งเสียชีวิตแล้ว' : 'บันทึกพ้นสภาพแล้ว',
      detail: f.type === 'deceased'
        ? `${rec.code} · ${rec.name} — ข้อมูลผู้รับเงินสงเคราะห์ถูกส่งไปที่เมนู “สมาชิกถึงแก่กรรม / ฌาปนกิจ” แล้ว`
        : `${rec.code} · ${rec.name} — หยุดเรียกเก็บเงินสงเคราะห์ตั้งแต่งวดถัดไป` });
  };

  // ── นำเข้าประกาศรายศพ → ตั้งเรียกเก็บ ──
  const handleBill = (f) => {
    const a = assocOf(f.assoc);
    const amount = Math.round(f.deaths * a.ratePerDeath);
    let n = 0;
    setRecords(rs => rs.map(r => {
      if (r.assoc !== f.assoc || r.status !== 'active' || r.periods.some(p => p.ym === f.ym)) return r;
      n++;
      return { ...r, periods: [...r.periods, { ym: f.ym, deaths: f.deaths, amount, paid: 0, channel: r.pay, payDate: '', status: 'unpaid' }] };
    }));
    log({ action: 'import', target: `${a.short} งวด ${cmPeriod(f.ym)}`, summary: `ตั้งเรียกเก็บรายศพ ${f.deaths} ศพ × ${a.ratePerDeath} บาท` });
    setModal(null);
    setOkMsg({ title: 'ตั้งเรียกเก็บเงินสงเคราะห์แล้ว', detail: `${a.short} งวด ${cmPeriod(f.ym)} — ${f.deaths} ศพ · ${cmMoney(amount)} บาท/คน ส่งเข้าช่องทางชำระของสมาชิกแต่ละคนเรียบร้อย` });
  };

  // ── ส่งออก ──
  const handleExport = (kind, assocId) => {
    const a = assocOf(assocId);
    if (kind === 'new') {
      const list = records.filter(r => r.assoc === assocId && r.status === 'submit');
      const cols = [{ key: 'code', label: 'เลขสมาชิกสหกรณ์' }, { key: 'name', label: 'ชื่อ-นามสกุล' }, { key: 'citizenId', label: 'เลขบัตรประชาชน' },
        { key: 'birthDate', label: 'วันเกิด' }, { key: 'applyDate', label: 'วันที่สมัคร' }, { key: 'benText', label: 'ผู้รับเงินสงเคราะห์' }];
      const data = list.map(r => ({ ...r, benText: r.bens.map(b => `${b.name} (${b.relation} ${b.pct}%)`).join('; ') }));
      window.downloadFile && window.downloadFile(`สมัครใหม่_${a.id}_${workDate}.csv`, window.buildCSV(cols, data), 'text/csv');
      setRecords(rs => rs.map(r => r.assoc === assocId && r.status === 'submit' ? { ...r, status: 'approve', history: addHist(r, 'ส่งรายชื่อให้สมาคมพิจารณา') } : r));
      log({ action: 'export', target: a.short, summary: `ส่งรายชื่อสมัครใหม่ ${list.length} คน` });
      onToast && onToast(`ส่งออกรายชื่อสมัครใหม่ ${list.length} คน — สถานะเปลี่ยนเป็น “รออนุมัติ”`);
    } else {
      const ym = cmYmShift(workDate.slice(0, 7), -1);
      const list = records.filter(r => r.assoc === assocId && r.periods.some(p => p.ym === ym));
      const cols = [{ key: 'assocNo', label: 'เลขสมาชิกสมาคม' }, { key: 'code', label: 'เลขสมาชิกสหกรณ์' }, { key: 'name', label: 'ชื่อ-นามสกุล' },
        { key: 'amount', label: 'ยอดเรียกเก็บ' }, { key: 'paid', label: 'ยอดที่เก็บได้' }];
      const data = list.map(r => { const p = r.periods.find(x => x.ym === ym); return { ...r, amount: p.amount, paid: p.paid }; });
      window.downloadFile && window.downloadFile(`นำส่งเงิน_${a.id}_${ym}.csv`, window.buildCSV(cols, data), 'text/csv');
      onToast && onToast(`ส่งออกไฟล์นำส่งเงิน ${a.short} งวด ${cmPeriod(ym)} (${list.length} คน)`);
    }
    setModal(null);
  };

  const open = records.find(r => r.id === openId);

  return (
    <div data-screen-label="สมาชิก สสอร. / สส.ชสอ.">
      {open ? (
        <CmDetail rec={open} assoc={assocOf(open.assoc)} workDate={workDate} onBack={() => setOpenId(null)} onToast={onToast}
          onApprove={() => setModal({ approve: open })} onEnd={() => setModal({ end: open })}
          onSaveBens={(bens) => { update(open.id, r => ({ ...r, bens, history: addHist(r, 'แก้ไขผู้รับเงินสงเคราะห์') }));
            log({ action: 'update', target: `${open.code} · ${open.name}`, summary: 'แก้ไขผู้รับเงินสงเคราะห์' }); onToast && onToast('บันทึกผู้รับเงินสงเคราะห์แล้ว'); }}
          onPay={(ym) => { update(open.id, r => ({ ...r, periods: r.periods.map(p => p.ym === ym ? { ...p, paid: p.amount, payDate: workDate, status: 'paid' } : p),
            history: addHist(r, `รับชำระงวด ${cmPeriod(ym)}`) })); onToast && onToast(`รับชำระงวด ${cmPeriod(ym)} แล้ว`); }}
          onFiles={(files) => update(open.id, r => ({ ...r, files }))} />
      ) : (
        <>
          <div className="page-actions" style={{ flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px', minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สมาชิก สสอร. / สส.ชสอ.</h1>
              <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
                ทะเบียนสมาชิกสมาคมฌาปนกิจสงเคราะห์ · สมัคร ส่งสมาคม บันทึกผลอนุมัติ ตั้งเรียกเก็บรายศพ และแจ้งพ้นสภาพ — สมาชิก 1 คนสังกัดได้ 1 สมาคม
              </div>
            </div>
            <button className="btn sm" onClick={() => setModal('cfg')}><Icon name="cog" size={13} /> ตั้งค่าสมาคม</button>
            <button className="btn sm" onClick={() => setModal('export')}><Icon name="download" size={13} /> ส่งออกไฟล์ให้สมาคม</button>
            <button className="btn sm dashed" onClick={() => setModal('bill')}><Icon name="upload" size={13} /> นำเข้าประกาศรายศพ</button>
            <button className="btn primary sm" onClick={() => setModal('new')}><Icon name="plus" /> สมัครสมาชิกใหม่</button>
          </div>

          <div className="dxc-stat-row">
            <div className="dxc-stat"><span className="k">คุ้มครองอยู่</span><span className="v mono" style={{ color: 'var(--primary)' }}>{stats.active}</span></div>
            <div className="dxc-stat"><span className="k">รอยื่น / รออนุมัติ / รอคุ้มครอง</span><span className="v mono" style={{ color: 'var(--warning)' }}>{stats.pending}</span></div>
            <div className="dxc-stat"><span className="k">ค้างชำระเงินสงเคราะห์</span><span className="v mono" style={{ color: 'var(--danger)' }}>{stats.arrears}</span></div>
            <div className="dxc-stat"><span className="k">พ้นสภาพ / เสียชีวิต ปี {+yr + 543}</span><span className="v mono">{stats.ended}</span></div>
          </div>

          <div className="search-card">
            <div className="toolbar" style={{ flexWrap: 'wrap' }}>
              <div className="search" style={{ flex: '1 1 280px' }}>
                <Icon name="search" size={14} />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเลขสมาชิก, ชื่อ-สกุล, เลขบัตร, เลขสมาชิกสมาคม..." />
              </div>
              <select className="filter-select" value={assocF} onChange={e => setAssocF(e.target.value)}>
                <option value="all">ทุกสมาคม</option>
                {assocs.map(a => <option key={a.id} value={a.id}>{a.short}</option>)}
              </select>
              <select className="filter-select" value={statusF} onChange={e => setStatusF(e.target.value)}>
                <option value="all">ทุกสถานะ</option>
                {Object.entries(CM_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
                <option value="arrears">ค้างชำระ</option>
              </select>
              <select className="filter-select" value={payF} onChange={e => setPayF(e.target.value)}>
                <option value="all">ทุกช่องทางชำระ</option>
                {CM_PAY.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
            </div>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 1080 }}>
                <thead><tr>
                  <th>เลขสมาชิก</th><th>สมาชิก</th><th>สมาคม</th><th>เลขสมาชิกสมาคม</th>
                  <th>เริ่มคุ้มครอง</th><th>ช่องทางชำระ</th><th className="num">ยอดค้าง</th>
                  <th className="center">สถานะ</th><th className="center" style={{ width: 150 }}>จัดการ</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={9}><div className="empty-state">ไม่พบข้อมูล</div></td></tr>}
                  {rows.map(r => {
                    const a = assocOf(r.assoc), st = CM_STATUS[r.status], arr = cmArrears(r), hit = cmHitsLapse(r, a, workDate);
                    const ended = ['lapsed', 'deceased'].includes(r.status);
                    return (
                      <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
                        <td className="mono">{r.code}</td>
                        <td><div style={{ fontWeight: 500 }}>{r.name}</div><div className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.dept}</div></td>
                        <td><span className="chip">{a.short}</span></td>
                        <td className="mono">{r.assocNo || <span className="muted">—</span>}</td>
                        <td>{r.coverStart ? cmDate(r.coverStart) : <span className="muted">—</span>}</td>
                        <td style={{ fontSize: 'var(--font-sm)' }}>{cmPayLabel(r.pay)}</td>
                        <td className="num mono" style={arr > 0 ? { color: 'var(--danger)', fontWeight: 600 } : null}>
                          {arr > 0 ? cmMoney(arr) : '—'}
                          {arr > 0 && <div className="muted" style={{ fontSize: 'var(--font-xs)', fontWeight: 400 }}>{cmUnpaidCount(r)} งวด</div>}
                        </td>
                        <td className="center">
                          <span className={"pill " + st.pill}>{st.l}</span>
                          {hit && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--danger)', marginTop: 3 }}>เข้าเกณฑ์พ้นสภาพ</div>}
                        </td>
                        <td className="center"><div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn sm" style={{ background: '#fff' }} onClick={(e) => { e.stopPropagation(); setOpenId(r.id); }}><Icon name="eye" size={12} /> ดู</button>
                          {!ended && r.status !== 'submit' && r.status !== 'approve' &&
                            <button className="btn danger sm" onClick={(e) => { e.stopPropagation(); setModal({ end: r }); }}>พ้นสภาพ</button>}
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          </div>
        </>
      )}

      {modal === 'new' && <CmNewModal assocs={assocs} records={records} workDate={workDate} onClose={() => setModal(null)} onSave={handleCreate} />}
      {modal === 'bill' && <CmBillModal assocs={assocs} records={records} onClose={() => setModal(null)} onSave={handleBill} />}
      {modal === 'export' && <CmExportModal assocs={assocs} records={records} onClose={() => setModal(null)} onExport={handleExport} />}
      {modal === 'cfg' && <CmCfgModal assocs={assocs} onClose={() => setModal(null)}
        onSave={(next) => { setAssocs(next); log({ action: 'update', target: 'ตั้งค่าสมาคม', summary: 'แก้ไขอัตราและเงื่อนไขสมาคม' }); setModal(null); onToast && onToast('บันทึกการตั้งค่าสมาคมแล้ว'); }} />}
      {modal && modal.approve && <CmApproveModal rec={modal.approve} assoc={assocOf(modal.approve.assoc)} workDate={workDate} onClose={() => setModal(null)} onSave={handleApprove} />}
      {modal && modal.end && <CmEndModal rec={modal.end} assoc={assocOf(modal.end.assoc)} workDate={workDate} onClose={() => setModal(null)} onSave={handleEnd} />}
      {okMsg && window.StatusModal && <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail} onClose={() => setOkMsg(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดสมาชิก
// ════════════════════════════════════════════════════════════════════
const CM_TABS = [
  { id: 'info', label: 'ข้อมูลการสมัคร' },
  { id: 'ben', label: 'ผู้รับเงินสงเคราะห์' },
  { id: 'pay', label: 'การชำระเงิน' },
  { id: 'doc', label: 'เอกสาร' },
  { id: 'hist', label: 'ประวัติ' },
];

function CmDetail({ rec, assoc, workDate, onBack, onApprove, onEnd, onSaveBens, onPay, onFiles, onToast }) {
  const [tab, setTab] = useStateCM('info');
  const [editBen, setEditBen] = useStateCM(null);
  const [dragOver, setDragOver] = useStateCM(false);
  const fileRef = useRefCM(null);
  const st = CM_STATUS[rec.status];
  const ended = ['lapsed', 'deceased'].includes(rec.status);
  const arr = cmArrears(rec), hit = cmHitsLapse(rec, assoc, workDate);
  const Row = window.CrRow;
  const loanOk = rec.status === 'active';
  const benSum = (editBen || []).reduce((s, b) => s + (Number(b.pct) || 0), 0);

  const addFiles = (list) => onFiles([...rec.files, ...Array.from(list).map(f => ({ name: f.name, size: Math.max(1, Math.round(f.size / 1024)) + ' KB' }))]);

  return (
    <>
      <div className="page-actions" style={{ flexWrap: 'wrap' }}>
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" size={13} /> กลับ</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{rec.name}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}><span className="mono">{rec.code}</span> · {assoc.name}</div>
        </div>
        <span className="spacer" />
        {rec.status === 'approve' && <button className="btn primary sm" onClick={onApprove}><Icon name="check" /> บันทึกผลอนุมัติ</button>}
        {!ended && <button className="btn danger sm" onClick={onEnd}>แจ้งพ้นสภาพ / เสียชีวิต</button>}
      </div>

      <div className={"cr-sum-strip tone-" + (ended || arr > 0 ? 'bad' : rec.status === 'active' ? 'ok' : 'info')}>
        <div className="cr-sum-cell"><span className="k">เลขสมาชิกสมาคม</span><span className="v mono">{rec.assocNo || '—'}</span></div>
        <div className="cr-sum-cell"><span className="k">เริ่มคุ้มครอง</span><span className="v">{cmDate(rec.coverStart)}</span></div>
        <div className="cr-sum-cell"><span className="k">เงินสงเคราะห์ล่วงหน้า</span><span className="v mono">฿{cmMoney(assoc.advance)}</span></div>
        <div className="cr-sum-cell hl"><span className="k">ยอดค้างชำระ</span><span className="v mono">฿{cmMoney(arr)}</span></div>
        <span className="spacer" />
        {hit && <span className="pill bad">เข้าเกณฑ์พ้นสภาพ</span>}
        <span className={"pill " + st.pill}>{st.l}</span>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="tabs-bar" style={{ borderRadius: 0, flexWrap: 'wrap' }}>
          {CM_TABS.map(t => <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
        <div className="tab-panel">
          {tab === 'info' && (
            <>
              <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
              <div className="form-grid">
                <Row label="เลขสมาชิกสหกรณ์" value={rec.code} mono />
                <Row label="ชื่อ – นามสกุล" value={rec.name} />
                <Row label="เลขบัตรประชาชน" value={rec.citizenId} mono />
                <Row label="วันเกิด / อายุตอนสมัคร" value={`${cmDate(rec.birthDate)} · ${cmAge(rec.birthDate, rec.applyDate)} ปี`} />
                <Row label="สังกัด" value={rec.dept} />
                <Row label="สิทธิกู้ประเภทสามัญฌาปนกิจ" value={loanOk ? 'มีสิทธิ' : 'ไม่มีสิทธิ (ต้องอยู่ในสถานะคุ้มครอง)'} tone={loanOk ? 'ok' : 'bad'} />
              </div>
              <div className="dxc-subhead" style={{ marginTop: 18 }}>การสมัคร</div>
              <div className="form-grid">
                <Row label="สมาคม" value={assoc.short} />
                <Row label="วันที่สมัคร" value={cmDate(rec.applyDate)} />
                <Row label="วันที่สมาคมอนุมัติ" value={cmDate(rec.approveDate)} />
                <Row label="วันเริ่มคุ้มครอง" value={rec.coverStart ? `${cmDate(rec.coverStart)} (รอคุ้มครอง ${assoc.waitDays} วัน)` : '—'} />
                <Row label="ใบรับรองสุขภาพ" value={rec.health ? 'แนบแล้ว' : 'ยังไม่แนบ'} />
                <Row label="ช่องทางชำระ" value={cmPayLabel(rec.pay)} />
                <Row label="ค่าสมัคร" value={`฿${cmMoney(assoc.regFee)} · ${rec.regFeePaid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}`} />
                <Row label="ค่าบำรุงรายปี" value={`฿${cmMoney(assoc.annualFee)}`} />
                <Row label="เงินสงเคราะห์ล่วงหน้า" value={`฿${cmMoney(assoc.advance)} · ${rec.advancePaid ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}`} />
                {ended && <Row label="วันที่พ้นสภาพ" value={cmDate(rec.endDate)} tone="bad" />}
                {ended && <Row label="สาเหตุ" value={(CM_END_TYPES.find(t => t.v === rec.endType) || {}).l + (rec.endNote ? ' · ' + rec.endNote : '')} />}
              </div>
            </>
          )}

          {tab === 'ben' && (
            <>
              <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ผู้รับเงินสงเคราะห์</h3>
                <span className="spacer" />
                {!editBen && !ended && <button className="btn sm" onClick={() => setEditBen(rec.bens.map(b => ({ ...b })))}><Icon name="edit" size={12} /> แก้ไข</button>}
              </div>
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th style={{ width: 50 }}>ลำดับ</th><th>ชื่อ – นามสกุล</th><th>ความสัมพันธ์</th><th>เลขบัตรประชาชน</th><th className="num" style={{ width: 110 }}>สัดส่วน (%)</th>{editBen && <th style={{ width: 50 }}></th>}</tr></thead>
                <tbody>
                  {(editBen || rec.bens).map((b, i) => editBen ? (
                    <tr key={i}>
                      <td className="center">{i + 1}</td>
                      <td><input className="cfg-input" value={b.name} onChange={e => setEditBen(bs => bs.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} /></td>
                      <td><select className="cfg-input" value={b.relation} onChange={e => setEditBen(bs => bs.map((x, j) => j === i ? { ...x, relation: e.target.value } : x))}>
                        {['คู่สมรส', 'บุตร', 'บิดา', 'มารดา', 'พี่น้อง', 'อื่น ๆ'].map(o => <option key={o}>{o}</option>)}</select></td>
                      <td><input className="cfg-input mono" value={b.citizenId} onChange={e => setEditBen(bs => bs.map((x, j) => j === i ? { ...x, citizenId: e.target.value } : x))} /></td>
                      <td><input className="cfg-input mono" type="number" value={b.pct} onChange={e => setEditBen(bs => bs.map((x, j) => j === i ? { ...x, pct: e.target.value } : x))} style={{ textAlign: 'right' }} /></td>
                      <td>{editBen.length > 1 && <button className="btn sm" style={cmBtnTrash} title="ลบรายการ" onClick={() => setEditBen(bs => bs.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>}</td>
                    </tr>
                  ) : (
                    <tr key={i}><td className="center">{i + 1}</td><td>{b.name}</td><td>{b.relation}</td><td className="mono">{b.citizenId || '—'}</td><td className="num mono">{b.pct}</td></tr>
                  ))}
                </tbody>
              </table></div>
              {editBen && (
                <div className="ct-actionbar" style={{ marginTop: 12 }}>
                  <button className="btn sm dashed" onClick={() => setEditBen(bs => [...bs, { name: '', relation: 'บุตร', pct: '', citizenId: '' }])}><Icon name="plus" size={12} /> เพิ่มผู้รับเงิน</button>
                  <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1, color: benSum === 100 ? undefined : 'var(--danger)' }}>รวมสัดส่วน {benSum}% {benSum !== 100 && '— ต้องรวมเท่ากับ 100%'}</span>
                  <button className="btn" onClick={() => setEditBen(null)}>ยกเลิก</button>
                  <button className="btn primary" disabled={benSum !== 100 || editBen.some(b => !b.name.trim())}
                    onClick={() => { onSaveBens(editBen.map(b => ({ ...b, pct: Number(b.pct) }))); setEditBen(null); }}><Icon name="check" /> บันทึก</button>
                </div>
              )}
            </>
          )}

          {tab === 'pay' && (
            <>
              <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เงินสงเคราะห์รายศพ</h3>
                <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>อัตรา {assoc.ratePerDeath} บาท/ศพ · เกณฑ์พ้นสภาพ: {(CM_LAPSE_RULES.find(x => x.v === assoc.lapseRule) || {}).l}</span></div>
              {rec.periods.length === 0 ? (
                <div className="cl-empty"><Icon name="info" size={14} /> ยังไม่มีงวดเรียกเก็บ — เริ่มเรียกเก็บเมื่อสถานะเป็น “คุ้มครอง”</div>
              ) : (
                <div className="table-wrap"><div className="table-scroll"><table className="tbl" style={{ minWidth: 860 }}>
                  <thead><tr><th>งวด</th><th className="num">จำนวนศพ</th><th className="num">ยอดเรียกเก็บ</th><th className="num">ชำระแล้ว</th><th>ช่องทาง</th><th>วันที่ชำระ</th><th className="center">สถานะ</th><th className="center" style={{ width: 110 }}></th></tr></thead>
                  <tbody>
                    {rec.periods.slice().reverse().map(p => (
                      <tr key={p.ym}>
                        <td>{cmPeriod(p.ym)}</td><td className="num mono">{p.deaths}</td><td className="num mono">{cmMoney(p.amount)}</td>
                        <td className="num mono">{cmMoney(p.paid)}</td><td style={{ fontSize: 'var(--font-sm)' }}>{cmPayLabel(p.channel)}</td>
                        <td>{cmDate(p.payDate)}</td>
                        <td className="center"><span className={"pill " + (p.status === 'paid' ? 'ok' : 'bad')}>{p.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}</span></td>
                        <td className="center">{p.status === 'unpaid' && !ended && <button className="btn sm" onClick={() => onPay(p.ym)}><Icon name="money" size={12} /> รับชำระ</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div></div>
              )}
            </>
          )}

          {tab === 'doc' && (
            <>
              <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เอกสารประกอบการสมัคร</h3>
                <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{rec.files.length} ไฟล์</span></div>
              <div className="lrq-dropzone" style={{ cursor: 'pointer', ...(dragOver ? { borderColor: 'var(--primary)', background: 'var(--brand-100, #EAFEF2)' } : null) }}
                onClick={() => fileRef.current && fileRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}>
                <Icon name="upload" size={16} /><span>คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด</span>
                <input ref={fileRef} type="file" multiple hidden onChange={(e) => { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; }} />
              </div>
              {rec.files.length > 0 && (
                <div className="lrq-filelist">
                  {rec.files.map((fl, i) => (
                    <div key={i} className="lrq-file">
                      <span className="lrq-file-ico"><Icon name="attach" size={14} /></span>
                      <span className="lrq-file-name">{fl.name}</span><span className="lrq-file-size muted">{fl.size}</span>
                      <button className="lrq-eyebtn lrq-eyebtn-g" style={cmBtnEye} title="ดูข้อมูล" onClick={() => onToast && onToast('เปิดไฟล์ ' + fl.name)}><Icon name="eye" size={14} /></button>
                      <button className="btn sm" style={cmBtnTrash} title="ลบรายการ" onClick={() => onFiles(rec.files.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'hist' && (
            <>
              <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ประวัติการเปลี่ยนแปลง</h3></div>
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th style={{ width: 140 }}>วันที่</th><th>รายการ</th><th style={{ width: 180 }}>ผู้ดำเนินการ</th></tr></thead>
                <tbody>{rec.history.slice().reverse().map((h, i) => <tr key={i}><td>{cmDate(h.date)}</td><td>{h.text}</td><td>{h.by}</td></tr>)}</tbody>
              </table></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Modal shell ────────────────────────────────────────────────────
function CmModal({ icon, title, sub, width, onClose, children }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: width || 640, maxWidth: '96vw' }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name={icon} /></span>
          <div style={{ minWidth: 0 }}><h2>{title}</h2>{sub && <div className="muted" style={{ fontSize: 11 }}>{sub}</div>}</div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}

// ─── สมัครสมาชิกใหม่ ────────────────────────────────────────────────
function CmNewModal({ assocs, records, workDate, onClose, onSave }) {
  const [member, setMember] = useStateCM(null);
  const [f, setF] = useStateCM({ assoc: assocs[0].id, applyDate: workDate, pay: 'invoice', health: false });
  const [bens, setBens] = useStateCM([{ name: '', relation: 'คู่สมรส', pct: 100, citizenId: '' }]);
  const [touched, setTouched] = useStateCM(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const a = assocs.find(x => x.id === f.assoc);
  const existing = member && records.find(r => r.code === member.code && !['lapsed', 'deceased'].includes(r.status));
  const age = member ? cmAge(member.birthDate, f.applyDate) : null;
  const pctSum = bens.reduce((s, b) => s + (Number(b.pct) || 0), 0);
  const errs = {};
  if (!member) errs.member = 'กรุณาเลือกสมาชิก';
  else if (existing) errs.member = `เป็นสมาชิก ${assocs.find(x => x.id === existing.assoc).short} อยู่แล้ว — สมัครได้ 1 สมาคม ต้องลาออกก่อนจึงสมัครใหม่ได้`;
  else if (age > a.maxAge) errs.member = `อายุ ${age} ปี เกินเกณฑ์รับสมัครของ ${a.short} (ไม่เกิน ${a.maxAge} ปี)`;
  if (!f.health) errs.health = 'ต้องแนบใบรับรองสุขภาพ';
  if (pctSum !== 100) errs.bens = `สัดส่วนรวม ${pctSum}% — ต้องเท่ากับ 100%`;
  if (bens.some(b => !b.name.trim())) errs.bens = 'กรุณาระบุชื่อผู้รับเงินให้ครบ';
  const err = (k) => (touched || (k === 'member' && member)) ? errs[k] : null;
  const setBen = (i, k, v) => setBens(bs => bs.map((b, j) => j === i ? { ...b, [k]: v } : b));
  const submit = () => { if (Object.keys(errs).length) { setTouched(true); return; } onSave({ ...f, member, bens }); };

  return (
    <CmModal icon="userPlus" title="สมัครสมาชิก สสอร. / สส.ชสอ." sub="บันทึกใบสมัคร → ส่งรายชื่อให้สมาคมพิจารณาอนุมัติ" width={780} onClose={onClose}>
      <div className="sr-child-grid">
        <CmField label="สมาชิกสหกรณ์" required full error={err('member')}>
          <div className="reg-member-search crf-member-search" style={{ width: '100%', maxWidth: 'none' }}>
            <MemberSearchField member={member} onPick={setMember} source={window.CM_CANDIDATES}
              title="ค้นหาสมาชิกผู้สมัคร" changeLabel="เปลี่ยน" placeholder="คลิกเพื่อค้นหาสมาชิก…" />
          </div>
          {member && !errs.member && <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 4 }}>{member.dept} · อายุ {age} ปี</div>}
        </CmField>
        <CmField label="สมาคม" required>
          <select className="cfg-input" value={f.assoc} onChange={e => set('assoc', e.target.value)}>
            {assocs.map(x => <option key={x.id} value={x.id}>{x.short}</option>)}
          </select>
        </CmField>
        <CmField label="วันที่สมัคร" required>
          <ErpDate value={f.applyDate} onChange={(v) => set('applyDate', v)} className="cfg-input" />
        </CmField>
        <CmField label="ช่องทางชำระเงินสงเคราะห์" required>
          <select className="cfg-input" value={f.pay} onChange={e => set('pay', e.target.value)}>
            {CM_PAY.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
        </CmField>
        <CmField label="ใบรับรองสุขภาพ" required error={err('health')}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
            <input type="checkbox" checked={f.health} onChange={e => set('health', e.target.checked)} /> แนบใบรับรองสุขภาพแล้ว
          </label>
        </CmField>
        <CmField label="ค่าสมัคร (บาท)" hint="(ตามสมาคม)"><input className="cfg-input mono sr-auto" value={cmMoney(a.regFee)} readOnly /></CmField>
        <CmField label="เงินสงเคราะห์ล่วงหน้า (บาท)" hint="(ตามสมาคม)"><input className="cfg-input mono sr-auto" value={cmMoney(a.advance)} readOnly /></CmField>
      </div>

      <div className="dxc-subhead" style={{ marginTop: 18 }}>ผู้รับเงินสงเคราะห์</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bens.map((b, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1.4fr) 90px 28px', gap: 8, alignItems: 'center' }}>
            <input className="cfg-input" placeholder="ชื่อ – นามสกุล" value={b.name} onChange={e => setBen(i, 'name', e.target.value)} />
            <select className="cfg-input" value={b.relation} onChange={e => setBen(i, 'relation', e.target.value)}>
              {['คู่สมรส', 'บุตร', 'บิดา', 'มารดา', 'พี่น้อง', 'อื่น ๆ'].map(o => <option key={o}>{o}</option>)}
            </select>
            <input className="cfg-input mono" placeholder="เลขบัตรประชาชน" value={b.citizenId} onChange={e => setBen(i, 'citizenId', e.target.value)} />
            <input className="cfg-input mono" type="number" placeholder="%" value={b.pct} onChange={e => setBen(i, 'pct', e.target.value)} style={{ textAlign: 'right' }} />
            {bens.length > 1 ? <button className="btn sm" style={cmBtnTrash} title="ลบรายการ" onClick={() => setBens(bs => bs.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button> : <span />}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn sm dashed" onClick={() => setBens(bs => [...bs, { name: '', relation: 'บุตร', pct: '', citizenId: '' }])}><Icon name="plus" size={12} /> เพิ่มผู้รับเงิน</button>
          <span className="muted" style={{ fontSize: 'var(--font-xs)' }}>รวมสัดส่วน {pctSum}%</span>
        </div>
        {err('bens') && <div className="mf-err"><Icon name="info" size={11} /> {errs.bens}</div>}
      </div>

      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <Icon name="info" size={14} />
        <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>เมื่อบันทึก สถานะจะเป็น “รอยื่นสมาคม” · เริ่มคุ้มครองหลังสมาคมอนุมัติ {a.waitDays} วัน</span>
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" onClick={submit}><Icon name="check" /> บันทึกใบสมัคร</button>
      </div>
    </CmModal>
  );
}

// ─── บันทึกผลอนุมัติ ────────────────────────────────────────────────
function CmApproveModal({ rec, assoc, workDate, onClose, onSave }) {
  const [f, setF] = useStateCM({ assocNo: '', approveDate: workDate });
  const cover = f.approveDate ? cmAddDays(f.approveDate, assoc.waitDays) : '';
  return (
    <CmModal icon="check" title="บันทึกผลอนุมัติจากสมาคม" sub={`${rec.code} · ${rec.name} · ${assoc.short}`} onClose={onClose}>
      <div className="sr-child-grid">
        <CmField label="เลขสมาชิกสมาคม" required><input className="cfg-input mono" value={f.assocNo} placeholder="เช่น ชสอ-1100235" onChange={e => setF(s => ({ ...s, assocNo: e.target.value }))} /></CmField>
        <CmField label="วันที่อนุมัติ" required><ErpDate value={f.approveDate} onChange={(v) => setF(s => ({ ...s, approveDate: v }))} className="cfg-input" /></CmField>
        <CmField label="วันเริ่มคุ้มครอง" hint={`(อนุมัติ + ${assoc.waitDays} วัน)`} full><input className="cfg-input sr-auto" value={cmDate(cover)} readOnly /></CmField>
      </div>
      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" disabled={!f.assocNo.trim() || !f.approveDate} onClick={() => onSave(rec, f)}><Icon name="check" /> บันทึก</button>
      </div>
    </CmModal>
  );
}

// ─── แจ้งพ้นสภาพ / เสียชีวิต ───────────────────────────────────────
function CmEndModal({ rec, assoc, workDate, onClose, onSave }) {
  const [f, setF] = useStateCM({ type: cmHitsLapse(rec, assoc, workDate) ? 'arrears' : 'resign', date: workDate, note: '' });
  const arr = cmArrears(rec);
  return (
    <CmModal icon="close" title="แจ้งพ้นสภาพ / เสียชีวิต" sub={`${rec.code} · ${rec.name} · ${assoc.short} ${rec.assocNo}`} onClose={onClose}>
      <div className="sr-child-grid">
        <CmField label="ประเภท" required>
          <select className="cfg-input" value={f.type} onChange={e => setF(s => ({ ...s, type: e.target.value }))}>
            {CM_END_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>
        </CmField>
        <CmField label={f.type === 'deceased' ? 'วันที่เสียชีวิต' : 'วันที่พ้นสภาพ'} required>
          <ErpDate value={f.date} onChange={(v) => setF(s => ({ ...s, date: v }))} className="cfg-input" />
        </CmField>
        <CmField label="หมายเหตุ" full>
          <textarea className="cfg-input" rows={2} value={f.note} placeholder="ระบุรายละเอียดเพิ่มเติม" onChange={e => setF(s => ({ ...s, note: e.target.value }))} />
        </CmField>
      </div>
      <div className="ct-warnbox" style={{ marginTop: 12 }}>
        <Icon name="info" /> {f.type === 'deceased'
          ? `ระบบจะส่งข้อมูลผู้รับเงินสงเคราะห์ ${rec.bens.length} คน ไปที่เมนู “สมาชิกถึงแก่กรรม / ฌาปนกิจ” เพื่อยื่นขอรับเงินจากสมาคม`
          : `หยุดเรียกเก็บเงินสงเคราะห์ตั้งแต่งวดถัดไป และสิทธิกู้ประเภทสามัญฌาปนกิจจะสิ้นสุดทันที`}
        {arr > 0 && ` · มียอดค้างชำระ ${cmMoney(arr)} บาท`} — การดำเนินการนี้จะถูกบันทึกใน Audit Trail
      </div>
      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn danger" disabled={!f.date} onClick={() => onSave(rec, f)}>ยืนยัน</button>
      </div>
    </CmModal>
  );
}

// ─── นำเข้าประกาศรายศพ ──────────────────────────────────────────────
function CmBillModal({ assocs, records, onClose, onSave }) {
  const [f, setF] = useStateCM({ assoc: assocs[0].id, ym: CM_WM, deaths: '', file: null });
  const fileRef = useRefCM(null);
  const a = assocs.find(x => x.id === f.assoc);
  const deaths = Number(f.deaths) || 0;
  const per = Math.round(deaths * a.ratePerDeath);
  const members = records.filter(r => r.assoc === f.assoc && r.status === 'active' && !r.periods.some(p => p.ym === f.ym));
  const byPay = CM_PAY.map(p => ({ ...p, n: members.filter(r => r.pay === p.v).length })).filter(p => p.n);
  const months = [-1, 0, 1].map(n => cmYmShift(CM_WM, n));
  return (
    <CmModal icon="upload" title="นำเข้าประกาศรายศพ" sub="ตั้งเรียกเก็บเงินสงเคราะห์ตามจำนวนสมาชิกสมาคมที่เสียชีวิตในงวด" width={720} onClose={onClose}>
      <div className="sr-child-grid">
        <CmField label="สมาคม" required>
          <select className="cfg-input" value={f.assoc} onChange={e => setF(s => ({ ...s, assoc: e.target.value }))}>{assocs.map(x => <option key={x.id} value={x.id}>{x.short}</option>)}</select>
        </CmField>
        <CmField label="งวด" required>
          <select className="cfg-input" value={f.ym} onChange={e => setF(s => ({ ...s, ym: e.target.value }))}>{months.map(m => <option key={m} value={m}>{cmPeriod(m)}</option>)}</select>
        </CmField>
        <CmField label="ไฟล์ประกาศรายชื่อผู้เสียชีวิต" hint="(จากสมาคม)" full>
          <div className="lrq-dropzone" style={{ cursor: 'pointer' }} onClick={() => fileRef.current && fileRef.current.click()}>
            <Icon name="upload" size={16} /><span>{f.file ? f.file : 'คลิกเพื่อเลือกไฟล์ — ระบบนับจำนวนศพให้อัตโนมัติ'}</span>
            <input ref={fileRef} type="file" hidden accept=".csv,.xlsx,.pdf" onChange={(e) => { const fl = e.target.files[0]; if (fl) setF(s => ({ ...s, file: fl.name, deaths: s.deaths || '284' })); e.target.value = ''; }} />
          </div>
        </CmField>
        <CmField label="จำนวนศพในงวด" required><input className="cfg-input mono" type="number" value={f.deaths} placeholder="0" onChange={e => setF(s => ({ ...s, deaths: e.target.value }))} /></CmField>
        <CmField label="ยอดเรียกเก็บต่อคน (บาท)" hint={`(${a.ratePerDeath} บาท/ศพ)`}><input className="cfg-input mono sr-auto" value={cmMoney(per)} readOnly /></CmField>
      </div>
      <div className="cr-sum-strip tone-info" style={{ marginTop: 14 }}>
        <div className="cr-sum-cell"><span className="k">สมาชิกที่เรียกเก็บ</span><span className="v mono">{members.length} คน</span></div>
        <div className="cr-sum-cell"><span className="k">ยอดต่อคน</span><span className="v mono">฿{cmMoney(per)}</span></div>
        <div className="cr-sum-cell hl"><span className="k">ยอดรวมนำส่งสมาคม</span><span className="v mono">฿{cmMoney(per * members.length)}</span></div>
      </div>
      {byPay.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {byPay.map(p => <span key={p.v} className="chip">{p.l} · {p.n} คน</span>)}
        </div>
      )}
      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <Icon name="info" size={14} />
        <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>ยอดจะถูกส่งเข้าใบเรียกเก็บรายเดือน / หักบัญชี / หักเงินกู้ ตามช่องทางของสมาชิกแต่ละคน</span>
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" disabled={!deaths || !members.length} onClick={() => onSave({ assoc: f.assoc, ym: f.ym, deaths })}><Icon name="check" /> ตั้งเรียกเก็บ</button>
      </div>
    </CmModal>
  );
}

// ─── ส่งออกไฟล์ให้สมาคม ─────────────────────────────────────────────
function CmExportModal({ assocs, records, onClose, onExport }) {
  const [assoc, setAssoc] = useStateCM(assocs[0].id);
  const nNew = records.filter(r => r.assoc === assoc && r.status === 'submit').length;
  return (
    <CmModal icon="download" title="ส่งออกไฟล์ให้สมาคม" onClose={onClose}>
      <div className="sr-child-grid">
        <CmField label="สมาคม" full>
          <select className="cfg-input" value={assoc} onChange={e => setAssoc(e.target.value)}>{assocs.map(x => <option key={x.id} value={x.id}>{x.short}</option>)}</select>
        </CmField>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
        <div className="ct-acct-strip">
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>รายชื่อสมัครใหม่</div><div className="muted" style={{ fontSize: 'var(--font-xs)' }}>สมาชิกสถานะ “รอยื่นสมาคม” {nNew} คน — หลังส่งออกจะเปลี่ยนเป็น “รออนุมัติ”</div></div>
          <button className="btn sm" disabled={!nNew} onClick={() => onExport('new', assoc)}><Icon name="download" size={12} /> ส่งออก</button>
        </div>
        <div className="ct-acct-strip">
          <div style={{ flex: 1 }}><div style={{ fontWeight: 600 }}>ไฟล์นำส่งเงินสงเคราะห์</div><div className="muted" style={{ fontSize: 'var(--font-xs)' }}>ยอดเรียกเก็บและยอดที่เก็บได้ของงวดล่าสุด สำหรับกระทบยอดกับสมาคม</div></div>
          <button className="btn sm" onClick={() => onExport('remit', assoc)}><Icon name="download" size={12} /> ส่งออก</button>
        </div>
      </div>
    </CmModal>
  );
}

// ─── ตั้งค่าสมาคม ───────────────────────────────────────────────────
function CmCfgModal({ assocs, onClose, onSave }) {
  const [list, setList] = useStateCM(() => assocs.map(a => ({ ...a })));
  const set = (id, k, v) => setList(ls => ls.map(a => a.id === id ? { ...a, [k]: v } : a));
  const num = (a, k, label) => (
    <CmField label={label}><input className="cfg-input mono" type="number" value={a[k]} onChange={e => set(a.id, k, e.target.value)} /></CmField>
  );
  return (
    <CmModal icon="cog" title="ตั้งค่าสมาคม" sub="อัตราเรียกเก็บและเงื่อนไขของแต่ละสมาคม" width={820} onClose={onClose}>
      {list.map((a, i) => (
        <div key={a.id} style={{ marginTop: i ? 18 : 0 }}>
          <div className="dxc-subhead">{a.name}</div>
          <div className="sr-child-grid">
            {num(a, 'ratePerDeath', 'เงินสงเคราะห์ต่อศพ (บาท)')}
            {num(a, 'advance', 'เงินสงเคราะห์ล่วงหน้า (บาท)')}
            {num(a, 'regFee', 'ค่าสมัคร (บาท)')}
            {num(a, 'annualFee', 'ค่าบำรุงรายปี (บาท)')}
            {num(a, 'waitDays', 'ระยะรอคุ้มครอง (วัน)')}
            {num(a, 'maxAge', 'อายุรับสมัครสูงสุด (ปี)')}
            <CmField label="เกณฑ์พ้นสภาพเมื่อค้างชำระ" full>
              <select className="cfg-input" value={a.lapseRule} onChange={e => set(a.id, 'lapseRule', e.target.value)}>
                {CM_LAPSE_RULES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
              </select>
            </CmField>
          </div>
        </div>
      ))}
      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" onClick={() => onSave(list.map(a => ({ ...a,
          ratePerDeath: Number(a.ratePerDeath), advance: Number(a.advance), regFee: Number(a.regFee),
          annualFee: Number(a.annualFee), waitDays: Number(a.waitDays), maxAge: Number(a.maxAge) })))}><Icon name="check" /> บันทึก</button>
      </div>
    </CmModal>
  );
}

window.CremationMembersPage = CremationMembersPage;
