// ════════════════════════════════════════════════════════════════════
//  ระบบงานผู้ดูแลระบบ — ข้อมูลตั้งต้น (ผู้ใช้งาน · สิทธิ์ · สำรองข้อมูล)
//  ใช้ร่วมกับ components-admin-users / -roles / -backup / -constants
// ════════════════════════════════════════════════════════════════════

// ─── ระบบงานทั้งหมด (ใช้สร้างเมตริกซ์สิทธิ์ + หน้าค่าคงที่รวม) ──────────
window.ADM_SYSTEMS = [
  { code: '1', key: 'credit',  label: 'สินเชื่อ',                sub: ['เงินกู้สามัญ', 'เงินกู้พิเศษ', 'เงินกู้ฉุกเฉิน'] },
  { code: '2', key: 'deposit', label: 'เงินฝาก',                sub: ['บัญชีและธุรกรรม', 'ดอกเบี้ย', 'นำเข้า–ส่งออก'] },
  { code: '3', key: 'process', label: 'ประมวลผลและจัดเก็บ',      sub: ['ทะเบียนสมาชิก', 'หุ้น–หนี้', 'ประมวลผลรายเดือน'] },
  { code: '4', key: 'account', label: 'บัญชี',                  sub: ['บันทึกบัญชี', 'ลูกหนี้ตัวแทน', 'งบประมาณ'] },
  { code: '5', key: 'invest',  label: 'การเงินการลงทุน',         sub: ['เคาน์เตอร์', 'เช็ค/ธนาณัติ', 'การลงทุน'] },
  { code: '6', key: 'debt',    label: 'ทะเบียนและติดตามหนี้',     sub: ['ปันผล', 'ติดตามหนี้', 'ดำเนินคดี'] },
  { code: '7', key: 'admin',   label: 'ผู้ดูแลระบบ',             sub: ['ผู้ใช้งาน', 'สิทธิ์', 'สำรองข้อมูล'] },
  { code: '8', key: 'welfare', label: 'สวัสดิการสมาชิก',          sub: ['ทุนการศึกษา', 'อบรม/สัมมนา', 'สงเคราะห์'] },
];

// ─── ระดับสิทธิ์ของแต่ละระบบย่อย ──────────────────────────────────────
//  none = ไม่มีสิทธิ์ · read = อ่านอย่างเดียว · edit = แก้ไข · approve = อนุมัติ
window.ADM_PERM_LEVELS = [
  { v: 'none',    l: 'ไม่มีสิทธิ์',   pill: 'neutral' },
  { v: 'read',    l: 'อ่าน',         pill: 'info' },
  { v: 'edit',    l: 'แก้ไข',        pill: 'warn' },
  { v: 'approve', l: 'อนุมัติ',       pill: 'ok' },
];
window.admPermLevel = (v) => window.ADM_PERM_LEVELS.find(x => x.v === v) || window.ADM_PERM_LEVELS[0];

// ─── ลำดับชั้นผู้อนุมัติ (ฝาก-ถอน / รายการสำคัญ) ──────────────────────
window.ADM_APPROVAL_TIERS = [
  { v: '1', l: 'เจ้าหน้าที่',          limit: 50000 },
  { v: '2', l: 'หัวหน้างาน',           limit: 200000 },
  { v: '3', l: 'ผู้ช่วยผู้จัดการ',      limit: 1000000 },
  { v: '4', l: 'ผู้จัดการสหกรณ์',       limit: null },
];

// ─── บทบาท (Role) + เมตริกซ์สิทธิ์ตั้งต้น ──────────────────────────────
//  perms: { systemKey: 'none'|'read'|'edit'|'approve' }
function admPerms(map) {
  const o = {};
  window.ADM_SYSTEMS.forEach(s => { o[s.key] = map[s.key] || 'none'; });
  return o;
}
window.ADM_ROLES = [
  { id: 'R-SUPER', name: 'Super Admin', en: 'Super Admin', tier: '4', system: true, locked: true,
    desc: 'สิทธิ์สูงสุดทั้งระบบ (ไม่สามารถปิดใช้งาน)',
    createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00', active: true,
    perms: admPerms({ credit:'approve', deposit:'approve', process:'approve', account:'approve', invest:'approve', debt:'approve', admin:'approve', welfare:'approve' }) },
  { id: 'R-ADMIN', name: 'ผู้ดูแลระบบ', en: 'Administrator', tier: '4', system: true,
    desc: 'จัดการผู้ใช้ บทบาท และตั้งค่าระบบทั้งหมด',
    createdAt: '2026-01-12T09:15:00', updatedAt: '2026-07-07T09:59:00', active: true,
    perms: admPerms({ credit:'approve', deposit:'approve', process:'approve', account:'approve', invest:'approve', debt:'approve', admin:'approve', welfare:'approve' }) },
  { id: 'R-MANAGER', name: 'ผู้จัดการสหกรณ์', en: 'Manager', tier: '4', system: false,
    desc: 'อนุมัติรายการและดูรายงานทั้งหมด',
    createdAt: '2026-01-12T09:20:00', updatedAt: '2026-06-02T14:30:00', active: true,
    perms: admPerms({ credit:'approve', deposit:'approve', process:'approve', account:'approve', invest:'approve', debt:'approve', admin:'read', welfare:'approve' }) },
  { id: 'R-REG', name: 'เจ้าหน้าที่ทะเบียน', en: 'Registrar', tier: '1', system: false,
    desc: 'จัดการข้อมูลทะเบียนสมาชิกและการสมัคร',
    createdAt: '2026-01-15T10:33:00', updatedAt: '2026-04-28T10:33:00', active: true,
    perms: admPerms({ process:'edit', welfare:'edit', credit:'read', deposit:'read' }) },
  { id: 'R-CREDIT', name: 'เจ้าหน้าที่สินเชื่อ', en: 'Credit Officer', tier: '2', system: false,
    desc: 'จัดการคำขอกู้และสัญญาเงินกู้',
    createdAt: '2026-01-15T10:41:00', updatedAt: '2026-05-20T11:12:00', active: true,
    perms: admPerms({ credit:'edit', deposit:'read', process:'read', debt:'edit', welfare:'read' }) },
  { id: 'R-FINANCE', name: 'เจ้าหน้าที่การเงิน', en: 'Finance Officer', tier: '2', system: false,
    desc: 'จัดการรายการรับ-จ่ายเงิน',
    createdAt: '2026-01-15T10:52:00', updatedAt: '2026-06-09T13:48:00', active: true,
    perms: admPerms({ deposit:'edit', invest:'edit', account:'read', credit:'read' }) },
  { id: 'R-AUDIT', name: 'ผู้ตรวจสอบ', en: 'Auditor', tier: '1', system: false,
    desc: 'ดูข้อมูลเพื่อการตรวจสอบ (อ่านอย่างเดียว)',
    createdAt: '2026-02-22T15:05:00', updatedAt: '2026-07-01T10:29:00', active: false,
    perms: admPerms({ credit:'read', deposit:'read', process:'read', account:'read', invest:'read', debt:'read', welfare:'read', admin:'read' }) },
  { id: 'R-ACCT', name: 'เจ้าหน้าที่บัญชี', en: 'Accountant', tier: '2', system: false,
    desc: 'บันทึกและตรวจสอบรายการทางบัญชี',
    createdAt: '2026-01-15T11:02:00', updatedAt: '2026-06-11T09:20:00', active: true,
    perms: admPerms({ account:'edit', invest:'read', deposit:'read', credit:'read' }) },
];
window.admRole = (id) => window.ADM_ROLES.find(r => r.id === id) || null;

// ─── รายการสิทธิ์ละเอียด (Permission catalog) — สำหรับหน้า "กำหนดสิทธิ์" ──
//  type: 'Menu' | 'Edit' | 'Approve'
window.ADM_PERM_CATALOG = (() => {
  const rows = [];
  window.ADM_SYSTEMS.forEach(s => {
    s.sub.forEach((sub, i) => {
      const base = s.key.toUpperCase() + '_' + (i + 1);
      rows.push({ sysKey: s.key, sys: 'ระบบ' + s.label, module: 'การทำงาน', menu: sub, code: base + '.MAIN', name: sub, type: 'Menu' });
      rows.push({ sysKey: s.key, sys: 'ระบบ' + s.label, module: 'การทำงาน', menu: sub, code: base + '.EDIT', name: 'แก้ไข' + sub, type: 'Edit' });
    });
  });
  rows.push({ sysKey: 'admin', sys: 'ระบบผู้ดูแลระบบ', module: 'การจัดการสิทธิ์', menu: 'ข้อมูลผู้ใช้งาน', code: 'EMPLOYEE_LIST.MAIN', name: 'ข้อมูลผู้ใช้งาน', type: 'Menu' });
  rows.push({ sysKey: 'admin', sys: 'ระบบผู้ดูแลระบบ', module: 'การจัดการสิทธิ์', menu: 'ข้อมูลผู้ใช้งาน', code: 'EMPLOYEE_LIST.EDIT', name: 'แก้ไขข้อมูลผู้ใช้งาน', type: 'Edit' });
  rows.push({ sysKey: 'admin', sys: 'ระบบผู้ดูแลระบบ', module: 'การตั้งค่า', menu: 'นโยบาย Session & Token', code: 'SESSION_POLICY.MAIN', name: 'นโยบาย Session & Token', type: 'Menu' });
  return rows;
})();
// สิทธิ์ที่ถือว่า Assign แล้วสำหรับบทบาทหนึ่ง ๆ (คำนวณจากระดับสิทธิ์รายระบบ)
window.admAssignedPerms = (role) => window.ADM_PERM_CATALOG.filter(p => {
  const lv = role.perms[p.sysKey] || 'none';
  if (lv === 'none') return false;
  if (p.type === 'Menu') return true;
  if (p.type === 'Edit') return lv === 'edit' || lv === 'approve';
  if (p.type === 'Approve') return lv === 'approve';
  return false;
});

// ─── รายการที่ต้องขออนุมัติก่อนทำ (Permission gate) ────────────────────
window.ADM_GATED_ACTIONS = [
  { id: 'GA-01', label: 'เบิกเงินสดจากเคาน์เตอร์',          tier: '2', system: 'การเงินการลงทุน' },
  { id: 'GA-02', label: 'รับ-จ่ายเกินวงเงินที่กำหนด',        tier: '3', system: 'การเงินการลงทุน' },
  { id: 'GA-03', label: 'ยกเลิกใบเสร็จรับเงิน',              tier: '2', system: 'บัญชี' },
  { id: 'GA-04', label: 'ยกเลิก/แก้ไขใบคำขอกู้',             tier: '2', system: 'สินเชื่อ' },
  { id: 'GA-05', label: 'ยกเลิกรายการฝาก-ถอน',              tier: '2', system: 'เงินฝาก' },
  { id: 'GA-06', label: 'แก้ไขยอดหุ้น / หนี้ / เงินฝาก',      tier: '3', system: 'ประมวลผลและจัดเก็บ' },
  { id: 'GA-07', label: 'แก้ไขยอดปันผล–เฉลี่ยคืน',           tier: '3', system: 'ทะเบียนและติดตามหนี้' },
  { id: 'GA-08', label: 'อนุมัติรายการนอกเหนือเงื่อนไข',      tier: '4', system: 'สินเชื่อ' },
];

// ─── ผู้ใช้งานระบบ (เต็มรูปแบบ — ต่อยอดจาก SYSTEM_USERS) ──────────────
//  status: active | locked | disabled
window.ADM_USER_GROUPS = ['ฝ่ายทะเบียนสมาชิก', 'ฝ่ายสินเชื่อ', 'ฝ่ายการเงิน', 'ฝ่ายบัญชี', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'หน่วยตรวจสอบภายใน', 'ผู้บริหาร'];
window.ADM_DEPTS = window.ADM_USER_GROUPS;
window.ADM_USERS_SEED = [
  { id: 'u01', username: 'janpen.m',  name: 'จันทร์เพ็ญ มาลี',  initials: 'จม', roleId: 'R-REG', roleIds: ['R-REG'],
    citizenId: '1-1099-00123-45-6',
    dept: 'ฝ่ายทะเบียนสมาชิก', group: 'ฝ่ายทะเบียนสมาชิก', groupIds: ['ฝ่ายทะเบียนสมาชิก'], email: 'janpen.m@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-29T08:55:01', createdAt: '2562-05-01', pwChangedAt: '2026-04-01',
    pwExpireDays: 90, mustChange: false },
  { id: 'u02', username: 'prasert.w', name: 'ประเสริฐ วัฒนชัย', initials: 'ปว', roleId: 'R-CREDIT', roleIds: ['R-CREDIT'],
    citizenId: '1-1099-00456-78-2',
    dept: 'ฝ่ายสินเชื่อ', group: 'ฝ่ายสินเชื่อ', groupIds: ['ฝ่ายสินเชื่อ'], email: 'prasert.w@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-28T16:42:37', createdAt: '2560-02-15', pwChangedAt: '2026-05-20',
    pwExpireDays: 90, mustChange: false },
  { id: 'u03', username: 'sunisa.t',  name: 'สุนิสา ทองแท้',     initials: 'สท', roleId: 'R-FINANCE', roleIds: ['R-FINANCE'],
    citizenId: '1-1099-00789-12-3',
    dept: 'ฝ่ายการเงิน', group: 'ฝ่ายการเงิน', groupIds: ['ฝ่ายการเงิน'], email: 'sunisa.t@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-29T08:12:44', createdAt: '2561-08-10', pwChangedAt: '2026-03-02',
    pwExpireDays: 90, mustChange: true },
  { id: 'u04', username: 'apichat.s', name: 'อภิชาติ ศรีสุข',    initials: 'อศ', roleId: 'R-MANAGER', roleIds: ['R-MANAGER'],
    citizenId: '1-1099-01011-34-4',
    dept: 'ผู้บริหาร', group: 'ผู้บริหาร', groupIds: ['ผู้บริหาร'], email: 'apichat.s@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-29T07:30:10', createdAt: '2558-01-05', pwChangedAt: '2026-06-01',
    pwExpireDays: 60, mustChange: false },
  { id: 'u05', username: 'montri.s',  name: 'มนตรี ศรีสุข',      initials: 'มศ', roleId: 'R-ADMIN', roleIds: ['R-ADMIN'],
    citizenId: '1-1099-01234-56-5',
    dept: 'ฝ่ายเทคโนโลยีสารสนเทศ', group: 'ฝ่ายเทคโนโลยีสารสนเทศ', groupIds: ['ฝ่ายเทคโนโลยีสารสนเทศ'], email: 'admin@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-29T09:01:55', createdAt: '2557-11-20', pwChangedAt: '2026-06-15',
    pwExpireDays: 60, mustChange: false },
  { id: 'u06', username: 'wipa.j',    name: 'วิภา จันทร์เพ็ญ',   initials: 'วจ', roleId: 'R-ACCT', roleIds: ['R-ACCT'],
    citizenId: '1-1099-01567-89-6',
    dept: 'ฝ่ายบัญชี', group: 'ฝ่ายบัญชี', groupIds: ['ฝ่ายบัญชี'], email: 'wipa.j@coopthai.or.th', status: 'locked', lockedBy: 'system',
    lastLogin: '2026-05-14T11:20:00', createdAt: '2563-06-01', pwChangedAt: '2026-02-01',
    pwExpireDays: 90, mustChange: false },
  { id: 'u07', username: 'anong.b',   name: 'อรอนงค์ บุญมาก',    initials: 'อบ', roleId: 'R-AUDIT', roleIds: ['R-AUDIT'],
    citizenId: '1-1099-01890-23-7',
    dept: 'หน่วยตรวจสอบภายใน', group: 'หน่วยตรวจสอบภายใน', groupIds: ['หน่วยตรวจสอบภายใน'], email: 'anong.b@coopthai.or.th', status: 'active',
    lastLogin: '2026-06-27T14:05:18', createdAt: '2564-03-12', pwChangedAt: '2026-05-30',
    pwExpireDays: 90, mustChange: false },
  { id: 'u08', username: 'somsak.k',  name: 'สมศักดิ์ การะเกตุ',  initials: 'สก', roleId: 'R-CREDIT', roleIds: ['R-CREDIT'],
    citizenId: '1-1099-02123-45-8',
    dept: 'ฝ่ายสินเชื่อ', group: 'ฝ่ายสินเชื่อ', groupIds: ['ฝ่ายสินเชื่อ'], email: 'somsak.k@coopthai.or.th', status: 'disabled', disabledBy: 'hr',
    lastLogin: '2025-12-30T17:00:00', createdAt: '2562-09-01', pwChangedAt: '2025-10-01',
    pwExpireDays: 90, mustChange: false },
  { id: 'u09', username: 'wipa.j2',   name: 'วิภา จันทร์เพ็ญ',   initials: 'วจ', roleId: 'R-ACCT', roleIds: ['R-ACCT', 'R-FINANCE', 'R-AUDIT'],
    citizenId: '1-1099-02456-78-9',
    dept: 'ฝ่ายบัญชี', group: 'ฝ่ายบัญชี', groupIds: ['ฝ่ายบัญชี', 'ฝ่ายการเงิน', 'หน่วยตรวจสอบภายใน'], email: 'wipa.j2@coopthai.or.th', status: 'active',
    lastLogin: '2026-07-13T15:20:00', createdAt: '2564-09-10', pwChangedAt: '2026-07-01',
    pwExpireDays: 90, mustChange: false },
];
window.ADM_USER_STATUS = {
  active:   { l: 'เปิดใช้งาน', pill: 'ok' },
  locked:   { l: 'ปิดใช้งาน',  pill: 'neutral' },
  disabled: { l: 'ปิดใช้งาน',  pill: 'neutral' },
};

// ─── ชุดสิทธิ์สำหรับหน้า "ข้อมูลผู้ใช้งานและสิทธิ์" ──────────────────────
window.ADM_PERM_GROUPS = [
  { sys: 'ระบบผู้ดูแลระบบ — การตั้งค่า', modules: [
    { menu: 'ค่าคงที่ข้อมูลสหกรณ์', rows: [
      { code: 'COOPERATIVE_PROFILE.MAIN', name: 'ค่าคงที่ข้อมูลสหกรณ์', type: 'Menu', sysKey: 'process', need: 'menu' },
      { code: 'COOPERATIVE_PROFILE.EDIT', name: 'แก้ไขข้อมูลสหกรณ์', type: 'Action', sysKey: 'process', need: 'edit' },
    ] },
    { menu: 'ค่าคงที่ปฏิทินการทำงาน', rows: [
      { code: 'WORK_CALENDAR.MAIN', name: 'ปฏิทินวันทำงาน', type: 'Menu', sysKey: 'process', need: 'menu' },
      { code: 'WORK_CALENDAR.EXPORT', name: 'Export ปฏิทินวันทำงาน', type: 'Action', sysKey: 'process', need: 'approve' },
    ] },
  ] },
  { sys: 'ระบบทะเบียนสมาชิก — การทำงาน', modules: [
    { menu: 'ทะเบียนสมาชิก', rows: [
      { code: 'MEMBER_REGISTRY.MAIN', name: 'ทะเบียนสมาชิก', type: 'Menu', sysKey: 'process', need: 'menu' },
      { code: 'MEMBER_REGISTRY.DELETE', name: 'ลบข้อมูลสมาชิก', type: 'Action', sysKey: 'process', need: 'approve' },
      { code: 'MEMBER_REGISTRY.EXPORT', name: 'Export ทะเบียนสมาชิก', type: 'Action', sysKey: 'process', need: 'approve' },
    ] },
  ] },
  { sys: 'ระบบสินเชื่อ — การทำงาน', modules: [
    { menu: 'ใบคำขอกู้', rows: [
      { code: 'LOAN_REQUEST.MAIN', name: 'ใบคำขอกู้เงิน', type: 'Menu', sysKey: 'credit', need: 'menu' },
      { code: 'LOAN_REQUEST.APPROVE', name: 'อนุมัติใบคำขอกู้', type: 'Action', sysKey: 'credit', need: 'approve' },
    ] },
  ] },
  { sys: 'ระบบเงินฝาก — การทำงาน', modules: [
    { menu: 'บัญชีเงินฝาก', rows: [
      { code: 'DEPOSIT_ACC.MAIN', name: 'บัญชีเงินฝาก', type: 'Menu', sysKey: 'deposit', need: 'menu' },
      { code: 'DEPOSIT_ACC.EDIT', name: 'แก้ไขบัญชีเงินฝาก', type: 'Action', sysKey: 'deposit', need: 'edit' },
    ] },
  ] },
];

window.ADM_USER_PERM_OVERRIDES = {
  'janpen.m': {
    'COOPERATIVE_PROFILE.MAIN': { status: 'allow', source: 'Override รายบุคคล' },
    'COOPERATIVE_PROFILE.EDIT': { status: 'allow', source: 'บทบาท: เจ้าหน้าที่ทะเบียน' },
    'WORK_CALENDAR.MAIN': { status: 'allow', source: 'กลุ่ม: ฝ่ายทะเบียนสมาชิก' },
    'WORK_CALENDAR.EXPORT': { status: 'deny', source: '— ยังไม่ได้รับ' },
    'MEMBER_REGISTRY.MAIN': { status: 'allow', source: 'บทบาท: เจ้าหน้าที่ทะเบียน' },
    'MEMBER_REGISTRY.DELETE': { status: 'deny', source: 'Override รายบุคคล' },
    'MEMBER_REGISTRY.EXPORT': { status: 'deny', source: '— ยังไม่ได้รับ' },
  },
};

window.admUserPermRow = function (user, row) {
  const ov = (window.ADM_USER_PERM_OVERRIDES[user.username] || {})[row.code];
  if (ov) return { ...row, status: ov.status, source: ov.source };
  const chk = (lv) => row.need === 'menu' ? lv !== 'none' : row.need === 'edit' ? (lv === 'edit' || lv === 'approve') : lv === 'approve';
  const roleIds = (user.roleIds && user.roleIds.length ? user.roleIds : [user.roleId]).filter(Boolean);
  for (const rid of roleIds) {
    const role = window.admRole(rid);
    if (role && chk(role.perms[row.sysKey] || 'none')) return { ...row, status: 'allow', source: 'บทบาท: ' + role.name };
  }
  const groupIds = (user.groupIds && user.groupIds.length ? user.groupIds : [user.group]).filter(Boolean);
  for (const gname of groupIds) {
    const g = (window.ADM_USER_GROUPS_SEED || []).find(x => x.name === gname);
    if (g && chk(g.perms[row.sysKey] || 'none')) return { ...row, status: 'allow', source: 'กลุ่ม: ' + g.name };
  }
  return { ...row, status: 'deny', source: '— ยังไม่ได้รับ' };
};
window.admUserPermGroups = function (user) {
  return window.ADM_PERM_GROUPS.map(g => ({
    sys: g.sys,
    modules: g.modules.map(m => ({ menu: m.menu, rows: m.rows.map(r => window.admUserPermRow(user, r)) })),
  }));
};

// ─── กลุ่มผู้ใช้ (User Group) — บทบาทตามหน่วยงาน ─────────────────────
window.ADM_USER_GROUPS_SEED = [
  { id: 'UG-01', name: 'ฝ่ายทะเบียนสมาชิก', desc: 'กลุ่มเจ้าหน้าที่งานทะเบียนสมาชิก', memberCount: 6,
    createdAt: '2026-01-12T09:30:00', updatedAt: '2026-04-28T10:15:00', active: true, locked: false,
    perms: admPerms({ process: 'edit', welfare: 'read' }) },
  { id: 'UG-02', name: 'ฝ่ายสินเชื่อ', desc: 'กลุ่มเจ้าหน้าที่งานสินเชื่อ', memberCount: 8,
    createdAt: '2026-01-12T09:35:00', updatedAt: '2026-05-20T11:05:00', active: true, locked: false,
    perms: admPerms({ credit: 'edit', debt: 'edit', process: 'read' }) },
  { id: 'UG-03', name: 'ฝ่ายการเงิน', desc: 'กลุ่มเจ้าหน้าที่งานการเงิน', memberCount: 5,
    createdAt: '2026-01-15T11:00:00', updatedAt: '2026-06-09T13:40:00', active: true, locked: false,
    perms: admPerms({ invest: 'edit', deposit: 'edit', account: 'read' }) },
  { id: 'UG-04', name: 'ฝ่ายบัญชี', desc: 'กลุ่มเจ้าหน้าที่งานบัญชี', memberCount: 4,
    createdAt: '2026-01-15T11:05:00', updatedAt: '2026-05-20T09:50:00', active: true, locked: false,
    perms: admPerms({ account: 'edit', invest: 'read' }) },
  { id: 'UG-05', name: 'ฝ่ายเทคโนโลยีสารสนเทศ', desc: 'กลุ่มงานระบบสารสนเทศ', memberCount: 3,
    createdAt: '2026-01-22T10:12:00', updatedAt: '2026-07-01T10:05:00', active: true, locked: false,
    perms: admPerms({ admin: 'approve', process: 'edit' }) },
  { id: 'UG-06', name: 'หน่วยตรวจสอบภายใน', desc: 'กลุ่มงานตรวจสอบภายใน (อ่านอย่างเดียว)', memberCount: 2,
    createdAt: '2026-02-22T15:10:00', updatedAt: '2026-07-01T10:29:00', active: true, locked: false,
    perms: admPerms({ credit: 'read', deposit: 'read', process: 'read', account: 'read', invest: 'read', debt: 'read', welfare: 'read', admin: 'read' }) },
  { id: 'UG-07', name: 'ผู้บริหาร', desc: 'กลุ่มผู้บริหารสหกรณ์', memberCount: 2,
    createdAt: '2026-01-12T09:40:00', updatedAt: '2026-06-02T14:30:00', active: true, locked: true,
    perms: admPerms({ credit: 'approve', deposit: 'approve', process: 'approve', account: 'approve', invest: 'approve', debt: 'approve', admin: 'approve', welfare: 'approve' }) },
];

// ─── ประวัติการสำรอง / กู้คืนข้อมูล ───────────────────────────────────
//  kind: auto | manual | restore ; result: ok | fail | running
window.ADM_BACKUP_SEED = [
  { id: 'BK-20260629-0200', ts: '2026-06-29T02:00:14', kind: 'auto',   scope: 'ทุกระบบ', sizeMB: 4218, durationSec: 412, result: 'ok',     by: 'ระบบอัตโนมัติ', note: 'สำรองอัตโนมัติประจำวัน' },
  { id: 'BK-20260628-1645', ts: '2026-06-28T16:45:30', kind: 'manual', scope: 'บัญชี + การลงทุน', sizeMB: 1180, durationSec: 96, result: 'ok', by: 'มนตรี ศรีสุข', note: 'ก่อนปิดงวดบัญชีเดือน พ.ค.' },
  { id: 'BK-20260628-0200', ts: '2026-06-28T02:00:09', kind: 'auto',   scope: 'ทุกระบบ', sizeMB: 4201, durationSec: 405, result: 'ok',     by: 'ระบบอัตโนมัติ', note: 'สำรองอัตโนมัติประจำวัน' },
  { id: 'BK-20260627-0200', ts: '2026-06-27T02:00:11', kind: 'auto',   scope: 'ทุกระบบ', sizeMB: 4188, durationSec: 401, result: 'ok',     by: 'ระบบอัตโนมัติ', note: 'สำรองอัตโนมัติประจำวัน' },
  { id: 'RS-20260620-1030', ts: '2026-06-20T10:30:00', kind: 'restore',scope: 'ทะเบียนสมาชิก', sizeMB: 612, durationSec: 138, result: 'ok', by: 'มนตรี ศรีสุข', note: 'กู้คืนทะเบียนสมาชิกจากชุดสำรอง 19 มิ.ย.' },
  { id: 'BK-20260626-0200', ts: '2026-06-26T02:00:07', kind: 'auto',   scope: 'ทุกระบบ', sizeMB: 4175, durationSec: 399, result: 'fail',   by: 'ระบบอัตโนมัติ', note: 'พื้นที่จัดเก็บไม่เพียงพอ — ดำเนินการซ้ำสำเร็จเวลา 03:10' },
  { id: 'BK-20260625-0200', ts: '2026-06-25T02:00:13', kind: 'auto',   scope: 'ทุกระบบ', sizeMB: 4160, durationSec: 396, result: 'ok',     by: 'ระบบอัตโนมัติ', note: 'สำรองอัตโนมัติประจำวัน' },
];
window.ADM_BACKUP_KIND = {
  auto:    { l: 'อัตโนมัติ', pill: 'info', icon: 'refresh' },
  manual:  { l: 'สั่งเอง',   pill: 'neutral', icon: 'download' },
  restore: { l: 'กู้คืน',     pill: 'warn', icon: 'upload' },
};
window.ADM_BACKUP_RESULT = {
  ok:      { l: 'สำเร็จ',       pill: 'ok' },
  fail:    { l: 'ล้มเหลว',      pill: 'bad' },
  running: { l: 'กำลังทำงาน',   pill: 'warn' },
};

// ─── ค่าคงที่รวมของระบบ (System constants hub) ────────────────────────
//  หน้าจอรวมตั้งค่าคงที่ทุกระบบ — แต่ละรายการลิงก์ไปหน้าตั้งค่าที่มีอยู่
window.ADM_CONST_GROUPS = [
  { sys: 'ข้อมูลสหกรณ์', items: [
    { label: 'ค่าคงที่ข้อมูลสหกรณ์', desc: 'ชื่อ · เลขภาษี · ที่อยู่ · ตราสัญลักษณ์', route: { view: 'system', page: 'cooperative' }, ready: true },
    { label: 'ปฏิทินการทำงาน', desc: 'วันหยุด · วันตัดยอด · วันประมวลผล', route: { view: 'system', page: 'calendar' }, ready: true },
    { label: 'เลขที่เอกสารอัตโนมัติ', desc: 'รูปแบบเลขเอกสารแยกตามประเภท', route: null, ready: false },
  ] },
  { sys: 'สินเชื่อ', items: [
    { label: 'ประเภทเงินกู้', desc: 'ผลิตภัณฑ์เงินกู้และเงื่อนไข', route: { view: 'loan', page: 'loan-type' }, ready: true },
    { label: 'โครงการเงินกู้', desc: 'โครงการ/โครงการย่อยและสิทธิ์การกู้', route: { view: 'loan', page: 'loan-project' }, ready: true },
    { label: 'อัตราดอกเบี้ยเงินกู้', desc: 'อัตราตามประเภทและช่วงเวลา', route: { view: 'loan', page: 'int-rate' }, ready: true },
    { label: 'ข้อกำหนดสินเชื่อ', desc: 'หลักเกณฑ์และสิทธิการกู้', route: { view: 'loan', page: 'loan-terms' }, ready: true },
    { label: 'กำหนดวงเงินค้ำประกัน', desc: 'เพดานวงเงินค้ำต่อราย', route: { view: 'loan', page: 'guar-limit' }, ready: true },
  ] },
  { sys: 'เงินฝาก', items: [
    { label: 'ประเภทบัญชีเงินฝาก', desc: 'เงื่อนไขบัญชีเงินฝากแต่ละประเภท', route: { view: 'deposit', page: 'acc-type' }, ready: true },
    { label: 'อัตราดอกเบี้ยเงินฝาก', desc: 'อัตราตามขั้นและระยะเวลา', route: { view: 'deposit', page: 'rate' }, ready: true },
    { label: 'ค่าธรรมเนียมและค่าปรับ', desc: 'ค่าปรับถอนเกินครั้ง/ก่อนกำหนด', route: { view: 'deposit', page: 'fee' }, ready: true },
  ] },
  { sys: 'ประมวลผล / หุ้น', items: [
    { label: 'ข้อกำหนดประเภทหุ้น', desc: 'มูลค่าหุ้น · อัตราส่งรายเดือน', route: { view: 'process', page: 'share-terms' }, ready: true },
    { label: 'งวดเรียกเก็บ', desc: 'รอบและเงื่อนไขการเรียกเก็บ', route: null, ready: false },
  ] },
  { sys: 'บัญชี', items: [
    { label: 'ผังบัญชี', desc: 'โครงสร้างบัญชีแยกประเภท', route: { view: 'account', page: 'coa' }, ready: true },
    { label: 'งวดบัญชี', desc: 'ปีและงวดบัญชี', route: { view: 'account', page: 'period' }, ready: true },
    { label: 'โครงสร้างงบประมาณ', desc: 'หมวด/ประเภทงบประมาณ', route: { view: 'account', page: 'budget' }, ready: true },
  ] },
  { sys: 'การลงทุน', items: [
    { label: 'ประเภทสินทรัพย์ลงทุน', desc: 'ตราสารและประเภทการลงทุน', route: { view: 'invest', page: 'asset-type' }, ready: true },
    { label: 'วงเงินลงทุนประจำปี', desc: 'เพดานการลงทุนตามมติ', route: { view: 'invest', page: 'limit' }, ready: true },
  ] },
  { sys: 'ติดตามหนี้', items: [
    { label: 'ดอกเบี้ย/ปรับโครงสร้างหนี้', desc: 'ค่าคงที่การปรับโครงสร้าง', route: { view: 'debt', page: 'restruct-config' }, ready: true },
    { label: 'โครงการพักชำระหนี้', desc: 'เงื่อนไขโครงการพักชำระ', route: { view: 'debt', page: 'suspension-project' }, ready: true },
  ] },
  { sys: 'สวัสดิการ', items: [
    { label: 'กำหนดจำนวนทุนการศึกษา', desc: 'จำนวนทุน/ระดับชั้น/ปี', route: { view: 'welfare', page: 'scholarship' }, ready: true },
    { label: 'ประเภทสวัสดิการ', desc: 'อัตราเงินสงเคราะห์แต่ละประเภท', route: null, ready: false },
  ] },
];
