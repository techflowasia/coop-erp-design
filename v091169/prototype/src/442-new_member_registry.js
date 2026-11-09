// ═════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก › เพิ่มสมาชิกใหม่ — ทำให้บันทึกแล้วใช้งานได้จริง
//  1) สร้างชุดข้อมูลสมาชิก (แบบเดียวกับ MEMBER_DATA) จากใบสมัคร
//     โดยล้างรายการเคลื่อนไหวทั้งหมดให้เป็นศูนย์ — สมาชิกใหม่ยังไม่มี
//     หุ้น / เงินกู้ / เงินฝาก / ค้ำประกัน
//  2) ลงทะเบียนสมาชิกใหม่เข้า pool ที่เมนูอื่นใช้ค้นหา (ค้ำประกัน,
//     เงินฝาก, ตัวแทน, เงินเดือน) เพื่อให้เลือกได้ทุกระบบ
//  3) ตรวจเลขบัตรประชาชนซ้ำก่อนบันทึก
// ═════════════════════════════════════════════════════════════════

// ─── แก้บั๊กช่องกรอกในใบสมัคร ────────────────────────────────────────
//  MFInput เดิมใช้ object rest spread ({...rest}) ซึ่ง Babel คอมไพล์เป็น
//  ตัวแปร global `_excluded` — ชื่อนี้ถูกไฟล์คอมโพเนนต์ที่โหลดทีหลังเขียนทับ
//  ทำให้ onChange/value หลุดเข้าไปใน rest แล้ว spread ทับ handler จริง
//  ผลคือทุกช่องในหน้าเพิ่มสมาชิกรับค่าเป็น event ("[object Object]")
//  แก้โดยประกาศ MFInput ใหม่แบบไม่พึ่ง rest spread
function MFInput(props) {
  const consumed = { value: 1, onChange: 1, mono: 1, error: 1, danger: 1 };
  const rest = {};
  Object.keys(props || {}).forEach(k => { if (!consumed[k]) rest[k] = props[k]; });
  const cls = 'mf-input'
    + (props.mono ? ' mono' : '')
    + (props.error ? ' has-error' : '')
    + (props.danger ? ' danger-text' : '');
  return React.createElement('input', Object.assign({}, rest, {
    className: cls,
    value: props.value == null ? '' : props.value,
    onChange: (e) => props.onChange && props.onChange(e.target.value),
  }));
}
window.MFInput = MFInput;

// ─── ล้างค่าโครงสร้างข้อมูล: array → [] · number → 0 · string → null ──
function mnBlank(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === 'object') {
    const o = {};
    Object.keys(v).forEach(k => { o[k] = mnBlank(v[k]); });
    return o;
  }
  if (typeof v === 'number') return 0;
  if (typeof v === 'boolean') return false;
  return null;
}

// ─── ที่อยู่แบบข้อความจากช่องที่กรอกในใบสมัคร ────────────────────────
window.mnFormAddress = (f) => {
  const parts = [];
  if (f.addrNo) parts.push(f.addrNo);
  if (f.addrMoo) parts.push('หมู่ ' + f.addrMoo);
  if (f.village) parts.push(f.village);
  if (f.soi) parts.push('ซ.' + f.soi);
  if (f.road) parts.push('ถ.' + f.road);
  if (f.tambon) parts.push('ต.' + f.tambon);
  if (f.amphoe) parts.push('อ.' + f.amphoe);
  if (f.province) parts.push('จ.' + f.province);
  if (f.zipcode) parts.push(f.zipcode);
  return parts.join(' ');
};

// ─── เลขบัตรประชาชนซ้ำในทะเบียนหรือไม่ ─────────────────────────────
window.mnDupCitizen = (list, cid) => {
  const norm = (s) => String(s || '').replace(/\D/g, '');
  const target = norm(cid);
  if (target.length < 13) return null;
  return (list || []).find(m => norm(m.citizenId) === target) || null;
};

// ─── สร้างชุดข้อมูลสมาชิกใหม่ (ใช้ในหน้ารายละเอียดสมาชิก) ────────────
window.mnBuildMemberData = (rec) => {
  const src = window.MEMBER_DATA || {};
  const data = mnBlank(src);

  const fullName = rec.name || `${rec.title || ''}${rec.firstName || ''} ${rec.lastName || ''}`.trim();
  const married = rec.maritalStatus === 'สมรส';

  data.member = {
    code: rec.code,
    name: fullName,
    nickname: rec.firstName || '',
    department: rec.deptName || '',
    departmentCode: rec.deptCode || '',
    accumulatedInterest: 0,
    note: rec.note || '',

    memberType: rec.memberType || 'ไม่ระบุ',
    title: rec.title || '',
    firstName: rec.firstName || '',
    lastName: rec.lastName || '',
    birthDate: rec.birthDate || '',
    gender: rec.gender || '',
    nationality: rec.nationality || 'ไทย',
    citizenId: rec.citizenId || '',
    maritalStatus: rec.maritalStatus || 'โสด',
    photoUrl: rec.photoUrl || null,
    signatureUrl: rec.signatureUrl || null,
    address: window.mnFormAddress(rec),
    addrNo: rec.addrNo || '', addrMoo: rec.addrMoo || '', village: rec.village || '', soi: rec.soi || '', road: rec.road || '',
    province: rec.province || '', amphoe: rec.amphoe || '', tambon: rec.tambon || '', zipcode: rec.zipcode || '',
    phoneWorkExt: rec.phoneWorkExt || '',
    entryDeposit: rec.entryDeposit || '', shareValue: rec.shareValue || '', shareBaseSalary: rec.shareBaseSalary || '',

    phoneHome: rec.phoneHome || '',
    phoneWork: rec.phoneWork || '',
    mobile: rec.mobile || '',
    email: rec.email || '',

    spouse: married ? (rec.spouse && rec.spouse.name) || '' : '',
    spouseInfo: married && rec.spouse ? {
      isMember: !!rec.spouse.isMember,
      memberCode: rec.spouse.memberCode || null,
      title: rec.spouse.title || '', firstName: rec.spouse.firstName || rec.spouse.name || '', lastName: rec.spouse.lastName || '',
      citizenId: '', birthDate: '', gender: '', nationality: 'ไทย',
    } : null,

    employeeId: rec.employeeId || '',
    workDepartment: rec.deptUnit || rec.workDepartment || '',
    salary: Number(rec.salary) || 0,
    workStatus: rec.workStatus || 'ปฏิบัติงาน',
    retireDate: rec.retireDate || null,

    joinDate: rec.joinDate || '',
    expireDate: null,
    resignDate: null,
    resignReason: null,
    resolution: rec.applicationNo ? 'ใบสมัครเลขที่ ' + rec.applicationNo : '',

    applicationNo: rec.applicationNo || '',
    applyCount: rec.applyCount || '',
    isNewRecord: true,
  };

  data.status = {
    applicationType: /สมทบ/.test(rec.memberType || '') ? 'subsidiary' : 'permanent',
    collectionStatus: 'normal',
    loanReqs: { providentFund: false, assignmentDeed: false, spouseConsent: false, lifeInsurance: false, beneficiary: false },
    loanGuarantee: { noGuarantee: false, noLoan: false },
    dividend: { freezeDividend: false, noDividend: false, noRebate: false },
  };

  // ค่าหุ้นรายเดือนจากใบสมัคร — ยังไม่มีการส่งจริง จึงเป็นทะเบียนเปล่า
  const perMonth = Number(rec.shareValue) || 0;
  data.shares = perMonth > 0 ? [{
    name: 'ค่าหุ้นสะสมรายเดือน', bf: 0, term: 0, perMonth,
    sendStatus: 'ปกติ', stopDate: null, shareValue: 0, status: 'ปกติ',
  }] : [];
  data.deductions = perMonth > 0 ? [{
    no: 1, detail: 'ค่าหุ้นรายเดือน', term: 'เดือนต่อเดือน',
    principal: perMonth, interest: 0, remaining: null,
  }] : [];
  data.deductionSummary = { emergencyTransfer: 0, net: perMonth };

  if (data.shareStatement) {
    data.shareStatement.parValue = (src.shareStatement && src.shareStatement.parValue) || 10;
    data.shareStatement.openingBalance = 0;
    data.shareStatement.openingShares = 0;
    data.shareStatement.entries = [];
  }

  return data;
};

// ─── ข้อมูลหน้าทะเบียนของสมาชิกที่เลือกจากช่องค้นหา ──────────────────
//  สมาชิกตัวอย่าง (MEMBER_DATA) = ข้อมูลเต็ม · สมาชิกที่เพิ่มใหม่ = จากใบสมัคร
//  สมาชิกอื่นในทะเบียน = สร้างจากแถวรายชื่อ (ชื่อ สังกัด บัตร หุ้น หนี้ หักรายเดือน)
window.mnDataForMember = (code, members) => {
  const sample = window.MEMBER_DATA;
  if (sample && sample.member && sample.member.code === code) return sample;
  const row = (members || window.MEMBERS_LIST || []).find(m => m.code === code);
  if (!row) return null;
  if (row._full) return window.mnBuildMemberData(row._full);
  const nm = String(row.name || '').trim();
  const tm = nm.match(/^(นางสาว|นาง|นาย|ด\.ช\.|ด\.ญ\.|น\.ส\.)\s*/);
  const rest = tm ? nm.slice(tm[0].length) : nm;
  const sp = rest.indexOf(' ');
  const data = window.mnBuildMemberData({
    code: row.code, name: nm, title: tm ? tm[1] : '',
    firstName: sp > 0 ? rest.slice(0, sp) : rest, lastName: sp > 0 ? rest.slice(sp + 1) : '',
    citizenId: row.citizenId, deptName: row.dept, deptCode: row.deptCode,
    memberType: row.memberType || row.type,
    workStatus: window.mnWorkStatus ? (window.mnWorkStatus(row.workStatus || row.status) || row.status) : row.status,
    joinDate: row.joinDate, salary: row.salary,
  });
  data.member.isNewRecord = false;
  data.member.resolution = '';
  const shares = Number(row.shares) || 0, loans = Number(row.loans) || 0, monthly = Number(row.monthly) || 0;
  data.shares = shares > 0 ? [{ name: 'ค่าหุ้นสะสมรายเดือน', bf: shares, term: 0, perMonth: 0,
    sendStatus: 'ปกติ', stopDate: null, shareValue: shares, status: 'ปกติ' }] : [];
  data.loans = loans > 0 ? [{ seq: 1, contract: '—', typeCode: '', typeName: 'เงินกู้รวม ' + (row.loanCount || 1) + ' สัญญา',
    amount: loans, remaining: loans }] : [];
  data.deductions = monthly > 0 ? [{ no: 1, detail: 'ยอดหักรายเดือนรวม', term: 'เดือนต่อเดือน',
    principal: monthly, interest: 0, remaining: null }] : [];
  data.deductionSummary = { emergencyTransfer: 0, net: monthly };
  return data;
};

// ─── ลงทะเบียนสมาชิกใหม่เข้า pool ที่เมนูอื่นใช้ค้นหา ─────────────────
window.mnRegisterMember = (rec) => {
  const deptFull = rec.deptName
    ? (rec.deptUnit ? rec.deptName + ' · ' + rec.deptUnit : rec.deptName)
    : (rec.workDepartment || '—');
  const base = {
    code: rec.code, name: rec.name, dept: deptFull, deptCode: rec.deptCode || '',
    citizenId: rec.citizenId || '', salary: Number(rec.salary) || 0,
    memberType: rec.memberType || 'ไม่ระบุ', memberStatus: 'ปฏิบัติงาน',
    workStatus: rec.workStatus || 'ปฏิบัติงาน', joinDate: rec.joinDate || '',
    shares: 0, loans: 0, loanCount: 0, monthly: 0,
    regAddress: window.mnFormAddress(rec),
  };
  ['GUAR_MEMBERS', 'DN_MEMBERS', 'ARC_MEMBERS'].forEach(key => {
    const pool = window[key];
    if (Array.isArray(pool) && !pool.some(m => m.code === rec.code)) pool.unshift({ ...base });
  });
  if (window.MEMBER_SALARY_HISTORY && !window.MEMBER_SALARY_HISTORY[rec.code]) {
    window.MEMBER_SALARY_HISTORY[rec.code] = [{
      date: rec.joinDate || rec.recordDate || '', oldSalary: 0,
      newSalary: Number(rec.salary) || 0, actor: 'งานทะเบียนสมาชิก',
      note: 'บันทึกครั้งแรกจากใบสมัครสมาชิก',
    }];
  }
  return base;
};
