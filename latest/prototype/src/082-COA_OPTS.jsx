// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ค่าคงที่ : ผังบัญชี (Chart of Accounts)
//  ผังบัญชีแบบต้นไม้ รองรับ 5+ ระดับ · รหัสบัญชี 6 หลัก · บัญชีคุม/บัญชีย่อย
//  · สถานะ Active/Inactive · แก้ไขแยกตามปีงบประมาณ
//  หมวดบัญชี (catType) อ้างอิงค่าคงที่จาก "หมวดบัญชี" (data-acctcat.js)
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก / ค่าคงที่ระบบ ────────────────────────────────────────
window.COA_OPTS = {
  kind: [
    { v: 'control', l: 'บัญชีคุม' },
    { v: 'posting', l: 'บัญชีย่อย (ลงรายการ)' },
  ],
};
window.coaKindLabel = (v) => (window.COA_OPTS.kind.find(o => o.v === v) || {}).l || v;

window.COA_CODE_LEN = 6;       // รหัสบัญชี 6 หลัก
window.COA_MAX_LEVEL = 6;      // รองรับ 5 ระดับขึ้นไป (ขยายได้ในอนาคต)
window.COA_FISCAL_YEARS = [2569, 2568, 2567];
window.COA_CURRENT_YEAR = 2569;

// หมวดบัญชีจากหลักแรกของรหัส (เชื่อมกับค่าคงที่ "หมวดบัญชี")
window.coaCatType = (code) => {
  const m = { '1': 'asset', '2': 'liability', '3': 'equity', '4': 'revenue', '5': 'expense' };
  return m[String(code)[0]] || 'asset';
};

// ─── ตัวช่วยสร้าง seed ──────────────────────────────────────────────
function _coaN(code, name, en, kind, children) {
  const kids = children || [];
  return {
    code: String(code), name, en: en || '',
    kind: kind || (kids.length ? 'control' : 'posting'),
    enabled: true, note: '',
    children: kids,
  };
}
function _coaAssignIds(list) {
  return (list || []).map(n => ({ ...n, id: 'C-' + n.code, children: _coaAssignIds(n.children) }));
}

// ─── ผังบัญชีตั้งต้น (ปีงบประมาณปัจจุบัน) — มาตรฐานสหกรณ์ออมทรัพย์ ─────
//  มีสาขาลึกถึง 5 ระดับ (สินทรัพย์ › หมุนเวียน › เงินฝาก › ออมทรัพย์ › ราย ธ.)
window.COA_SEED = _coaAssignIds([
  _coaN('100000', 'สินทรัพย์', 'Assets', 'control', [
    _coaN('110000', 'สินทรัพย์หมุนเวียน', 'Current Assets', 'control', [
      _coaN('110100', 'เงินสดและรายการเทียบเท่าเงินสด', '', 'control', [
        _coaN('110101', 'เงินสด', '', 'posting'),
        _coaN('110110', 'เงินฝากธนาคาร–ออมทรัพย์', '', 'control', [
          _coaN('110111', 'ธ.กรุงไทย — ออมทรัพย์', '', 'posting'),
          _coaN('110112', 'ธ.ออมสิน — ออมทรัพย์', '', 'posting'),
        ]),
        _coaN('110120', 'เงินฝากธนาคาร–กระแสรายวัน', '', 'posting'),
      ]),
      _coaN('110200', 'ลูกหนี้เงินให้กู้', '', 'control', [
        _coaN('110201', 'ลูกหนี้เงินกู้ฉุกเฉิน', '', 'posting'),
        _coaN('110202', 'ลูกหนี้เงินกู้สามัญ', '', 'posting'),
        _coaN('110203', 'ลูกหนี้เงินกู้พิเศษ', '', 'posting'),
      ]),
      _coaN('110300', 'ดอกเบี้ยค้างรับ', '', 'posting'),
    ]),
    _coaN('120000', 'สินทรัพย์ไม่หมุนเวียน', 'Non-current Assets', 'control', [
      _coaN('120100', 'ที่ดิน อาคารและอุปกรณ์', '', 'control', [
        _coaN('120101', 'ที่ดิน', '', 'posting'),
        _coaN('120102', 'อาคารสำนักงาน', '', 'posting'),
        _coaN('120103', 'ครุภัณฑ์สำนักงาน', '', 'posting'),
        _coaN('120104', 'ครุภัณฑ์คอมพิวเตอร์', '', 'posting'),
      ]),
      _coaN('120200', 'สินทรัพย์ไม่มีตัวตน', '', 'posting'),
    ]),
  ]),
  _coaN('200000', 'หนี้สิน', 'Liabilities', 'control', [
    _coaN('210000', 'หนี้สินหมุนเวียน', 'Current Liabilities', 'control', [
      _coaN('210100', 'เงินรับฝาก', '', 'control', [
        _coaN('210101', 'เงินรับฝากออมทรัพย์', '', 'posting'),
        _coaN('210102', 'เงินรับฝากออมทรัพย์พิเศษ', '', 'posting'),
        _coaN('210103', 'เงินรับฝากประจำ', '', 'posting'),
      ]),
      _coaN('210200', 'เจ้าหนี้และค่าใช้จ่ายค้างจ่าย', '', 'posting'),
      _coaN('29101', 'รายการค้างรับ', 'Receivable Clearing', 'posting'),
    ]),
    _coaN('220000', 'หนี้สินไม่หมุนเวียน', 'Non-current Liabilities', 'posting'),
  ]),
  _coaN('300000', 'ทุนของสหกรณ์', 'Equity', 'control', [
    _coaN('310000', 'ทุนเรือนหุ้น', '', 'posting'),
    _coaN('320000', 'ทุนสำรอง', '', 'posting'),
    _coaN('330000', 'ทุนสะสมตามข้อบังคับ', '', 'control', [
      _coaN('330100', 'ทุนสาธารณประโยชน์', '', 'posting'),
      _coaN('330200', 'ทุนสวัสดิการสมาชิก', '', 'posting'),
    ]),
    _coaN('340000', 'กำไร (ขาดทุน) สะสม', '', 'posting'),
  ]),
  _coaN('400000', 'รายได้', 'Revenue', 'control', [
    _coaN('410000', 'รายได้ดอกเบี้ยและบริการ', '', 'control', [
      _coaN('410100', 'ดอกเบี้ยรับเงินให้กู้', '', 'posting'),
      _coaN('410200', 'ค่าธรรมเนียมแรกเข้า', '', 'posting'),
    ]),
    _coaN('420000', 'รายได้อื่น', '', 'posting'),
  ]),
  _coaN('500000', 'ค่าใช้จ่าย', 'Expenses', 'control', [
    _coaN('510000', 'ค่าใช้จ่ายดอกเบี้ย', '', 'control', [
      _coaN('510100', 'ดอกเบี้ยจ่ายเงินรับฝาก', '', 'posting'),
    ]),
    _coaN('520000', 'ค่าใช้จ่ายดำเนินงาน', '', 'control', [
      _coaN('520100', 'เงินเดือนและค่าจ้าง', '', 'posting'),
      _coaN('520110', 'ค่าล่วงเวลาและเบี้ยเลี้ยง', '', 'posting'),
      _coaN('520120', 'สวัสดิการและค่ารักษาพยาบาลพนักงาน', '', 'posting'),
      _coaN('520200', 'ค่าสาธารณูปโภค', '', 'control', [
        _coaN('520201', 'ค่าน้ำประปาและไฟฟ้า', '', 'posting'),
        _coaN('520202', 'ค่าโทรศัพท์และอินเทอร์เน็ต', '', 'posting'),
      ]),
      _coaN('520300', 'ค่าตอบแทนกรรมการดำเนินการ', '', 'posting'),
      _coaN('520400', 'ค่าวัสดุสำนักงาน', '', 'posting'),
      _coaN('520500', 'ค่าซ่อมแซมและบำรุงรักษา', '', 'posting'),
      _coaN('520600', 'ค่าใช้จ่ายประชุมใหญ่สามัญ', '', 'posting'),
    ]),
    _coaN('530000', 'ค่าใช้จ่ายสวัสดิการสมาชิก', '', 'control', [
      _coaN('530100', 'ทุนการศึกษาบุตรสมาชิก', '', 'posting'),
      _coaN('530200', 'เงินสงเคราะห์ฌาปนกิจ', '', 'posting'),
      _coaN('530300', 'เงินช่วยเหลือสมาชิก', '', 'posting'),
    ]),
  ]),
]);

// ─── Flatten + lookup (ใช้โดยเมนูงบประมาณเพื่ออ้างอิงผังบัญชี) ────────
function _coaFlatten(tree) {
  const out = [];
  const walk = (ns, lvl) => (ns || []).forEach(n => {
    out.push({
      code: n.code, name: n.name, en: n.en || '',
      catType: window.coaCatType(n.code),
      kind: ((n.children && n.children.length) || n.kind === 'control') ? 'control' : 'posting',
      enabled: n.enabled, level: lvl,
    });
    walk(n.children || [], lvl + 1);
  });
  walk(tree, 1);
  return out;
}
// บัญชีทั้งหมดของปีงบประมาณปัจจุบัน (อ่านจากผังบัญชีล่าสุด ถ้ามี ไม่งั้นใช้ seed)
window.coaFlatAccounts = function () {
  const tree = (window.coaLoadTree ? window.coaLoadTree(window.COA_CURRENT_YEAR) : null) || window.COA_SEED;
  return _coaFlatten(tree);
};
// ชื่อบัญชีจากเลขบัญชี — ค้นจากผังบัญชีล่าสุดก่อน แล้วจึง seed
window.coaAccountName = function (code) {
  code = String(code);
  let a = window.coaFlatAccounts().find(x => x.code === code);
  if (a) return a.name;
  a = _coaFlatten(window.COA_SEED).find(x => x.code === code);
  return a ? a.name : null;
};

