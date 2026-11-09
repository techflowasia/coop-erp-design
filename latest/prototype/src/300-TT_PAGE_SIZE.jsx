// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ค่าคงที่ — กำหนดประเภทการทำรายการ (Deposit Code Master)
//  เลือก "ข้อกำหนด" (หมวดรหัส) ก่อน แล้วจึงสร้าง / แก้ไข / ลบรหัสในหมวดนั้น
//  หมวด "ประเภทการทำรายการ (DeptSlip)" เป็นตารางเต็มพร้อมการลงบัญชี Voucher
//  หมวดอื่นเป็นตารางรหัส–ชื่อ (บางหมวดมีคอลัมน์เพิ่ม) · ทุกตารางแบ่งหน้า
// ════════════════════════════════════════════════════════════════════

const TT_PAGE_SIZE = 10;

// ─── ตัวเลือก (dropdown options) สำหรับหมวด DeptSlip ─────────────────
const TT_SIDE = [
  { v: 1,  l: '1',  d: 'ฝั่งรับเข้า (Credit ยอดบัญชี)' },
  { v: -1, l: '-1', d: 'ฝั่งจ่ายออก (Debit ยอดบัญชี)' },
  { v: 0,  l: '0',  d: 'ไม่กระทบยอด' },
];
const TT_KIND = [
  { v: 'CSH', l: 'CSH', d: 'เงินสด' },
  { v: 'CHQ', l: 'CHQ', d: 'เช็ค' },
  { v: 'TRN', l: 'TRN', d: 'รายการปรับปรุง / โอน' },
  { v: 'CBT', l: 'CBT', d: 'โอนเข้าบัญชี' },
  { v: 'DIV', l: 'DIV', d: 'ปันผล' },
  { v: 'INT', l: 'INT', d: 'ดอกเบี้ย' },
];
const TT_GROUP = [
  { v: 'DEP', l: 'DEP', d: 'ฝากเงิน' },
  { v: 'WID', l: 'WID', d: 'ถอนเงิน' },
  { v: 'OPN', l: 'OPN', d: 'เปิดบัญชี' },
  { v: 'CLS', l: 'CLS', d: 'ปิดบัญชี' },
  { v: 'INT', l: 'INT', d: 'ดอกเบี้ย' },
  { v: 'FEE', l: 'FEE', d: 'ค่าธรรมเนียม' },
  { v: 'ADJ', l: 'ADJ', d: 'รายการปรับปรุง' },
  { v: 'ERR', l: 'ERR', d: 'รายการผิดพลาด' },
  { v: 'RCL', l: 'RCL', d: 'เช็คคืน' },
  { v: 'TAX', l: 'TAX', d: 'ภาษี' },
  { v: 'B/F', l: 'B/F', d: 'ยอดยกมา' },
  { v: 'DTE', l: 'DTE', d: 'ฝากเพิ่มด้วยการโอนภายนอก' },
  { v: 'VEC', l: 'VEC', d: 'ค่าใช้จ่ายประชุมใหญ่' },
  { v: 'ฮฮฮ', l: 'ฮฮฮ', d: 'ไม่ระบุ' },
];
const TT_VSIDE = [
  { v: '',   l: '—',  d: 'ไม่ระบุ' },
  { v: 'DR', l: 'DR', d: 'เดบิต' },
  { v: 'CR', l: 'CR', d: 'เครดิต' },
];
const TT_VGROUP = [
  { v: '',    l: '—',   d: 'ไม่ระบุ' },
  { v: 'AID', l: 'AID', d: 'กลุ่มใบสำคัญเงินฝาก' },
  { v: 'AIT', l: 'AIT', d: 'กลุ่มใบสำคัญดอกเบี้ย' },
];
const HT_PERSON_GROUPS = [
  { v: 'ทุกประเภทบุคคล', l: 'ทุกประเภทบุคคล' },
];
const ttDesc = (opts, v) => { const o = opts.find(x => String(x.v) === String(v)); return o ? o.d : ''; };

// ─── แคตตาล็อกข้อกำหนด DeptSlip (master) — เลือกมาสร้างรหัส ──────────
window.DEP_TXN_DEFS = window.DEP_TXN_DEFS || [
  { key: 'DCA', name: 'ฝากเพิ่มด้วยเงินสด',                    side: 1,  stm: 'DCA', kind: 'CSH', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DCC', name: 'ฝากเพิ่มด้วยแคชเชียร์เช็ค',              side: 1,  stm: 'DCC', kind: 'CHQ', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DCD', name: 'ฝากเพิ่มด้วยดราฟท์',                    side: 1,  stm: 'DCD', kind: 'CHQ', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DCH', name: 'บันทึกรายการฝากเมื่อเช็คนอกเขตเรียกเก็บได้', side: 1, stm: 'DCH', kind: 'CHQ', group: 'DEP', vside: 'CR', vc: true, vgroup: 'AID' },
  { key: 'DCP', name: 'ฝากเพิ่มด้วยเช็คส่วนบุคคล',              side: 1,  stm: 'DCP', kind: 'CHQ', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DTR', name: 'ฝากเพิ่มด้วยการโอน',                    side: 1,  stm: 'DTR', kind: 'TRN', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DTM', name: 'ฝากโอนรายเดือน',                        side: 1,  stm: 'DTM', kind: 'CBT', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DOR', name: 'ฝากตามสั่ง',                            side: 1,  stm: 'DOR', kind: 'CSH', group: 'DEP', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'DTO', name: 'ฝากย้อนวัน',                            side: 1,  stm: 'DTO', kind: 'CBT', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'DIV', name: 'ปันผล',                                 side: 1,  stm: 'DIV', kind: 'DIV', group: 'DEP', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'WCN', name: 'ถอนเช็ค (ไม่นับครั้งถอน)',              side: -1, stm: 'WCN', kind: 'CHQ', group: 'WID', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'WOR', name: 'ถอนตามสั่ง',                            side: -1, stm: 'WOR', kind: 'CBT', group: 'WID', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'WMO', name: 'ถอนเงินโดยธนาณัติ',                     side: -1, stm: 'WMO', kind: 'CSH', group: 'WID', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'FEE', name: 'ค่าธรรมเนียมการถอนเงิน',                side: -1, stm: 'FEE', kind: 'TRN', group: 'FEE', vside: '',   vc: true,  vgroup: '' },
  { key: 'OTN', name: 'เปิดบัญชีโดยธนาณัติ',                   side: 1,  stm: 'OTN', kind: 'CSH', group: 'OPN', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'INX', name: 'ดอกเบี้ยโบนัส',                         side: 1,  stm: 'INT', kind: 'TRN', group: 'INT', vside: 'CR', vc: true,  vgroup: 'AIT' },
  { key: 'ADJ', name: 'รายการปรับปรุง',                        side: 1,  stm: 'ADJ', kind: 'TRN', group: 'ADJ', vside: 'CR', vc: true,  vgroup: 'AID' },
  { key: 'CCA', name: 'ปิดบัญชีด้วยเงินสด',                    side: -1, stm: 'CCA', kind: 'CSH', group: 'CLS', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'CCL', name: 'ปิดบัญชีด้วยเช็ค',                      side: -1, stm: 'CCL', kind: 'CHQ', group: 'CLS', vside: 'DR', vc: true,  vgroup: 'AID' },
  { key: 'CTR', name: 'ปิดบัญชีด้วยการโอน',                    side: -1, stm: 'CTR', kind: 'TRN', group: 'CLS', vside: 'DR', vc: true,  vgroup: 'AID' },
];
const TT_SEED_ORDER = ['WCN','FEE','WMO','OTN','INX','WOR','DOR','DTM','ADJ','CCA','CCL','CTR','DCA','DCC','DCD','DCH','DCP','DIV','DTO','DTR'];
// ข้อมูลประเภทการทำรายการจากระบบเดิม — [รหัส, ชื่อ, ฝั่งรายการ, รหัสการพิมพ์, กลุ่มรายการ]
const TT_LEGACY_ROWS = [
  ["WCN", "ถอนเช็ค (ไม่นับครั้งถอน)", -1, "WCN", "WID"],
  ["FEE", "ค่าธรรมเนียมการถอน", -1, "FEE", "FEE"],
  ["WMO", "ถอนธนาณัติ", -1, "WMO", "WID"],
  ["INX", "ดอกเบี้ยโบนัส", 1, "INT", "INT"],
  ["DOR", "ฝากตามสั่ง", 1, "TRB", "DEP"],
  ["WOR", "ถอนตามสั่ง", -1, "AAA", "WID"],
  ["DQL", "ฝากเพิ่มด้วยเช็คส่วนบุคคล late", 1, "CHQ", "DEP"],
  ["DTM", "ฝากโอนรายเดือน", 1, "DPR", "DEP"],
  ["ADJ", "รายการปรับปรุง", 1, "ADJ", "ADJ"],
  ["CCA", "ปิดบัญชีด้วยเงินสด", -1, "CTD", "CLS"],
  ["CCL", "ปิดบัญชีด้วยเช็ค", -1, "CTD", "CLS"],
  ["CTR", "ปิดบัญชีด้วยการโอน", -1, "CTR", "CLS"],
  ["DCA", "ฝากเพิ่มด้วยเงินสด", 1, "DEP", "DEP"],
  ["DCC", "ฝากเพิ่มด้วยแคชเชียร์เช็ค", 1, "DCC", "DEP"],
  ["DCD", "ฝากเพิ่มด้วยดราฟท์", 1, "DCD", "DEP"],
  ["DCH", "บันทึกรายการฝากเมื่อเช็คนอกเขตเรียกเก็บได้", 1, "DCH", "DEP"],
  ["DCP", "ฝากเพิ่มด้วยเช็คส่วนบุคคล", 1, "CHQ", "DEP"],
  ["DIV", "ปันผล", 1, "DIV", "DEP"],
  ["DTO", "ฝากโอนย้อนหลัง", 1, "TRB", "DEP"],
  ["DTR", "ฝากเพิ่มด้วยการโอน", 1, "DTR", "DEP"],
  ["ERR", "รายการผิดพลาด", -1, "ERR", "ERR"],
  ["INT", "ดอกเบี้ย", 1, "INT", "INT"],
  ["OCA", "เปิดบัญชีใหม่ด้วยเงินสด", 1, "OPN", "OPN"],
  ["OCC", "เปิดบัญชีด้วยแคชเชียร์เช็ค", 1, "OCC", "OPN"],
  ["OCD", "เปิดบัญชีด้วยดราฟท์", 1, "OCD", "OPN"],
  ["OCP", "เปิดบัญชีด้วยเช็คส่วนบุคคล", 1, "OCP", "OPN"],
  ["OTR", "เปิดบัญชีใหม่ด้วยการโอน", 1, "OTR", "OPN"],
  ["RCL", "เช็คคืน", -1, "RCL", "RCL"],
  ["TAX", "ภาษี", -1, "TAX", "TAX"],
  ["WCA", "ถอนเงินสด", -1, "WTD", "WID"],
  ["WCL", "ถอนเช็ค/ตราสาร", -1, "WCQ", "WID"],
  ["WFS", "ถอนเพื่อจ่ายเป็นค่าหุ้น/ชำระหนี้", -1, "WFS", "WID"],
  ["WTE", "ถอนเพื่อการโอนภายนอก", -1, "WTE", "WID"],
  ["WTI", "ถอนเพื่อการโอนภายใน", -1, "WTI", "WID"],
  ["WTO", "ถอนโอนย้อนหลัง", -1, "WIB", "WID"],
  ["WTR", "ถอนเพื่อการโอน", -1, "WTR", "WID"],
  ["SUM", "ยอดยกมา", 1, "B/F", "B/F"],
  ["ERI", "รายการผิดพลาดเข้า", 1, "ERR", "ERR"],
  ["ERO", "รายการผิดพลาดออก", -1, "ERR", "ERR"],
  ["ฮฮฮ", "ไม่ระบุ", 0, "ฮฮฮ", "ฮฮฮ"],
  ["AJI", "รายการปรับปรุงเข้า", 1, "ADJ", "ADJ"],
  ["AJO", "รายการปรับปรุงออก", -1, "ADJ", "ADJ"],
  ["DTE", "ฝากเพิ่มด้วยการโอนภายนอก", 1, "DTE", "DTE"],
  ["WIN", "ถอนดอกเบี้ย", -1, "WIN", "WID"],
  ["DTS", "โอนเงินเดือน/เบี้ยประชุม", 1, "SAL", "DEP"],
  ["OTE", "เปิดบัญชีใหม่ด้วยการโอนนอกระบบ", 1, "OTE", "OPN"],
  ["CTE", "ปิดบัญชีด้วยการโอนภายนอก", -1, "CTE", "CLS"],
  ["INY", "ดอกเบี้ยรายปี", 1, "INT", "INT"],
  ["INM", "ดอกเบี้ยรายเดือน", 1, "INT", "INT"],
  ["WTM", "ถอนรายเดือน", -1, "WTM", "WID"],
  ["WII", "ถอนด/บเพื่อการโอนภายใน", -1, "WII", "WID"],
  ["WIE", "ถอนด/บเพื่อการโอนภายนอก", -1, "WIE", "WID"],
  ["DIM", "โอนฝากดอกเบี้ย", 1, "DIM", "DEP"],
  ["DMO", "ฝากโอนโดยธนาณัติ", 1, "DMO", "DEP"],
  ["INR", "ดอกเบี้ยเรียกคืน", -1, "INR", "INT"],
  ["INE", "ดอกเบี้ยโบนัส", 1, "INT", "INT"],
  ["DTL", "ฝากโอนเงินกู้", 1, "DTL", "DEP"],
  ["OTN", "เปิดบัญชี ธนาณัติ", 1, "OTN", "OPN"],
  ["CNM", "ปิดบัญชี หักค่ารักษาบัญชี", -1, "CNM", "WID"],
  ["WNM", "ถอน หักค่ารักษาบัญชี", -1, "WNM", "CLS"],
  ["OKP", "เปิดบัญชีจากลูกหนี้ตัวแทน", 1, "OKP", "OPN"],
  ["DAT", "ฝากเพิ่มด้วยการโอน ATM", 1, "DAT", "DEP"],
  ["WAT", "ถอนเพื่อการโอน ATM", -1, "WAT", "WID"],
  ["ASS", "สวัสดิการค่าตรวจสุขภาพสมาชิก", 1, "ASS", "DEP"],
  ["SHC", "ทุนการศึกษา", 1, "SHC", "DEP"],
  ["AHB", "สวัสดิการสุขสันต์วันเกิด", 1, "AHB", "DEP"],
  ["AMD", "สวัสดิการสมาชิกเสียชีวิต", 1, "AMD", "DEP"],
  ["AED", "สวัสดิการทุนการศึกษา", 1, "AED", "DEP"],
  ["ASF", "สวัสดิการสมาชิกประสบภัยบัติ", 1, "ASF", "DEP"],
  ["VEC", "ค่าใช้จ่ายประชุมใหญ่", 1, "VEC", "VEC"],
  ["ASO", "สวัสดิการเงินช่วยเหลือ สสอร.", 1, "ASO", "DEP"],
  ["DRT", "เงินจ่ายคืน", 1, "DRT", "DEP"],
  ["WPF", "ถอนเพื่อหักชำระ ณปท.", -1, "WPF", "WID"],
  ["DSV", "ฝากผ่าน Counter Service", 1, "DSV", "DEP"],
  ["ONB", "เปิดบัญชีใหม่ No book", 1, "ONB", "OPN"],
  ["DKL", "ฝาก Online กรุงไทย", 1, "DKL", "DEP"],
  ["WDC", "ถอนปันผลเงินสด (ไม่นับครั้งถอน)", -1, "WDC", "WID"],
  ["WDE", "ถอนปันผลโอนภายนอก (ไม่นับครั้งถอน)", -1, "WDE", "WID"],
  ["WPL", "ถอน Online ไปรษณีย์", -1, "WPL", "WID"],
  ["DPL", "ฝาก Online ไปรษณีย์", 1, "DPL", "DEP"],
  ["WKL", "ถอน Online กรุงไทย", -1, "WKL", "WID"],
  ["AFD", "สวัสดิการครอบครัวถึงแก่กรรม", 1, "AFD", "DEP"],
  ["ADB", "สวัสดิการทุพพลภาพ", 1, "ADB", "DEP"],
  ["DTC", "ฝากโอนระหว่างบัญชีจาก CMS", 1, "DTC", "DEP"],
  ["WTC", "ถอนโอนระหว่างบัญชีจาก CMS", -1, "WTC", "WID"],
  ["DRW", "ค่าตอบแทนตัวแทนสหกรณ์", 1, "DRW", "DEP"]
];
const ttGuessKind = (name, group) => {
  if (group === 'INT') return 'INT';
  if (/ปันผล/.test(name)) return 'DIV';
  if (/เช็ค|ดราฟท์|ตราสาร/.test(name)) return 'CHQ';
  if (/เงินสด/.test(name)) return 'CSH';
  return 'TRN';
};
window.DEP_TXNTYPE_SEED = TT_LEGACY_ROWS.map(([code, name, side, stm, group]) => {
  const d = (window.DEP_TXN_DEFS || []).find(x => x.key === code) || {};
  return { id: 'TT-' + code, code, defKey: d.key ? code : '', name, side, cross: '', stm, group,
           kind: d.kind || ttGuessKind(name, group),
           vside: side === 1 ? 'CR' : side === -1 ? 'DR' : '',
           vc: side !== 0, vgroup: group === 'INT' ? 'AIT' : (side === 0 ? '' : 'AID') };
});

// ════════════════════════════════════════════════════════════════════
//  หมวดข้อกำหนด (categories) — เลือกก่อนสร้างรหัส
// ════════════════════════════════════════════════════════════════════
//  kind: 'txnslip' = ตารางเต็ม DeptSlip · 'generic' = ตารางตาม fields
const TT_CAT_CODE   = { k: 'code', label: 'รหัส', w: 110, mono: true, up: true, required: true };
const TT_CATEGORIES = [
  { key: 'txnslip', label: 'ประเภทการทำรายการ', en: 'DeptSlip', kind: 'txnslip',
    desc: 'ประเภทการทำรายการเงินฝากพร้อมการลงบัญชี Voucher (ฝั่งบ/ช · ทำ VC · กลุ่ม VC)' },

  { key: 'dept', label: 'ประเภทคู่บัญชี', en: 'Dept', kind: 'generic',
    desc: 'รหัสประเภทคู่บัญชีสำหรับผูกการลงบัญชีเงินฝาก',
    fields: [TT_CAT_CODE, { k: 'name', label: 'ชื่อประเภทคู่บัญชี', required: true }],
    seed: [
      { code: '01', name: 'เงินฝากออมทรัพย์' },
      { code: '02', name: 'เงินฝากออมทรัพย์พิเศษ' },
      { code: '03', name: 'เงินฝากประจำ' },
      { code: '04', name: 'ดอกเบี้ยจ่าย' },
      { code: '05', name: 'ภาษีหัก ณ ที่จ่าย' },
    ] },

  { key: 'detitem', label: 'รหัสรายการ', en: 'DeptItem', kind: 'generic',
    desc: 'รหัสรายการย่อยสำหรับจำแนกธุรกรรมเงินฝาก',
    fields: [{ ...TT_CAT_CODE, up: true, ph: 'กรอกรหัสรายการ (ห้ามซ้ำ)' },
             { k: 'name',  label: 'ประเภทรายการ', required: true, ph: 'กรอกประเภทรายการ' }],
    storeKey: 'dep_const_detitem_v3',
    seedFn: () => ttLoad().map(r => ({ code: r.code, name: r.name, side: String(r.side), cross: r.cross || '', stm: r.stm, group: r.group })),
    seed: [
      { code: 'D01', name: 'รับฝากเงิน' },
      { code: 'W01', name: 'ถอนเงิน' },
      { code: 'I01', name: 'ดอกเบี้ยรับ' },
      { code: 'F01', name: 'ค่าธรรมเนียม' },
      { code: 'T01', name: 'ภาษีหัก ณ ที่จ่าย' },
      { code: 'A01', name: 'ปรับปรุงยอด' },
    ] },

  { key: 'expgroup', label: 'กลุ่มค่าใช้จ่าย', kind: 'generic',
    desc: 'กลุ่มค่าใช้จ่ายที่ใช้จัดหมวดค่าใช้จ่าย — แสดงเป็นตัวเลือกในเมนูหมวดค่าใช้จ่าย',
    storeKey: 'fin_const_expgroup_v1',
    fields: [TT_CAT_CODE, { k: 'name', label: 'กลุ่มค่าใช้จ่าย', required: true }],
    seed: (window.PA_CAT_GROUPS || ['ค่าเดินทาง', 'ค่าตอบแทน', 'ค่าวัสดุ / ครุภัณฑ์', 'ค่าใช้สอย', 'อื่น ๆ']).map((n, i) => ({ code: String(i + 1).padStart(2, '0'), name: n })) },

  { key: 'chqcancel', label: 'เหตุผลการยกเลิกเช็ค', kind: 'generic',
    desc: 'รายการเหตุผลที่ใช้เมื่อยกเลิกเช็ค',
    fields: [TT_CAT_CODE, { k: 'name', label: 'เหตุผลการยกเลิกเช็ค', required: true }],
    seed: [
      { code: '01', name: 'เช็คชำรุด' },
      { code: '02', name: 'พิมพ์เช็คผิดพลาด' },
      { code: '03', name: 'ผู้รับขอยกเลิก' },
      { code: '04', name: 'เช็คสูญหาย' },
      { code: '05', name: 'เปลี่ยนวิธีการจ่ายเงิน' },
    ] },

  { key: 'signer', label: 'ผู้ลงนามหนังสือรับรองเงินฝาก', kind: 'generic',
    desc: 'รายชื่อผู้มีอำนาจลงนามในหนังสือรับรองยอดเงินฝาก',
    fields: [TT_CAT_CODE, { k: 'name', label: 'ชื่อ – สกุล', required: true }, { k: 'position', label: 'ตำแหน่ง', w: 220 }],
    seed: [
      { code: '01', name: 'นายสมชาย ใจดี',        position: 'ผู้จัดการ' },
      { code: '02', name: 'นางสาวสุดา รักงาน',     position: 'รองผู้จัดการ' },
      { code: '03', name: 'นายวิชัย มั่นคง',        position: 'ผู้อำนวยการฝ่ายการเงิน' },
      { code: '04', name: 'นางพรทิพย์ ศรีสุข',      position: 'หัวหน้าฝ่ายเงินฝาก' },
    ] },

  { key: 'maintype', label: 'ประเภทเงินฝากหลัก', kind: 'generic',
    desc: 'ประเภทเงินฝากหลักที่ใช้จัดกลุ่มบัญชีเงินฝาก',
    fields: [TT_CAT_CODE, { k: 'name', label: 'ชื่อประเภทเงินฝากหลัก', required: true }],
    seed: [
      { code: '1', name: 'เงินฝากออมทรัพย์' },
      { code: '2', name: 'เงินฝากออมทรัพย์พิเศษ' },
      { code: '3', name: 'เงินฝากประจำ' },
      { code: '4', name: 'เงินฝากออมทรัพย์เกษียณสุข' },
    ] },

  { key: 'holdertype', label: 'ประเภทผู้ถือบัญชี', kind: 'generic',
    desc: 'ประเภทของผู้ถือบัญชีเงินฝาก',
    fields: [TT_CAT_CODE, { k: 'name', label: 'ชื่อประเภทผู้ถือบัญชี', required: true },
             { k: 'pgroup', label: 'กลุ่มประเภทบุคคล', type: 'opts', opts: HT_PERSON_GROUPS, required: true, w: 180 }],
    storeKey: 'dep_const_holdertype_v3',
    seed: [
      { code: '01', name: 'บุคคล (เจ้าของคนเดียว)', pgroup: 'ทุกประเภทบุคคล' },
      { code: '02', name: 'บุคคล (บัญชีร่วม)', pgroup: 'ทุกประเภทบุคคล' },
      { code: '03', name: 'มัสยิด', pgroup: 'ทุกประเภทบุคคล' },
      { code: '04', name: 'มูลนิธิ', pgroup: 'ทุกประเภทบุคคล' },
      { code: '05', name: 'โรงเรียน', pgroup: 'ทุกประเภทบุคคล' },
      { code: '06', name: 'สมาคม', pgroup: 'ทุกประเภทบุคคล' },
      { code: '07', name: 'ห้างหุ้นส่วน', pgroup: 'ทุกประเภทบุคคล' },
      { code: '08', name: 'บริษัท จำกัด', pgroup: 'ทุกประเภทบุคคล' },
      { code: '09', name: 'บริษัท มหาชน', pgroup: 'ทุกประเภทบุคคล' },
      { code: '10', name: 'องค์กรรัฐบาล', pgroup: 'ทุกประเภทบุคคล' },
      { code: '11', name: 'สหกรณ์', pgroup: 'ทุกประเภทบุคคล' },
      { code: '12', name: 'กองทุน', pgroup: 'ทุกประเภทบุคคล' },
      { code: '13', name: 'คณะต่างๆ ของมหาลัย', pgroup: 'ทุกประเภทบุคคล' },
      { code: '14', name: 'คณะต่างๆ ของมหาลัย', pgroup: 'ทุกประเภทบุคคล' },
      { code: '15', name: 'กองทุน', pgroup: 'ทุกประเภทบุคคล' },
      { code: '99', name: 'อื่นๆ', pgroup: 'ทุกประเภทบุคคล' },
    ] },

  { key: 'freezereason', label: 'เหตุผลการอายัดบัญชี', kind: 'generic',
    desc: 'รายการเหตุผลที่ใช้เมื่ออายัดบัญชีเงินฝาก',
    fields: [TT_CAT_CODE, { k: 'name', label: 'เหตุผลการอายัดบัญชี', required: true }],
    storeKey: 'dep_const_freezereason_v2',
    seed: [
      { code: '001', name: 'ค้ำประกันเงินกู้' },
      { code: '002', name: 'สมุดคู่ฝากหาย' },
      { code: '003', name: 'ตามคำสั่งศาล' },
      { code: '004', name: 'ค้ำประกันเจ้าหน้าที่' },
      { code: '005', name: 'อายัดวงเงินกู้พิเศษ' },
      { code: '999', name: 'อื่นๆ' },
    ] },

  { key: 'bank', label: 'ธนาคาร', kind: 'generic',
    desc: 'รหัสธนาคารสำหรับอ้างอิงบัญชีและการโอนเงิน',
    fields: [{ k: 'code', label: 'รหัสธนาคาร', w: 120, mono: true, required: true }, { k: 'name', label: 'ชื่อธนาคาร', required: true }],
    seed: [
      { code: '002', name: 'ธนาคารกรุงเทพ' },
      { code: '004', name: 'ธนาคารกสิกรไทย' },
      { code: '006', name: 'ธนาคารกรุงไทย' },
      { code: '011', name: 'ธนาคารทหารไทยธนชาต' },
      { code: '014', name: 'ธนาคารไทยพาณิชย์' },
      { code: '025', name: 'ธนาคารกรุงศรีอยุธยา' },
      { code: '069', name: 'ธนาคารเกียรตินาคินภัทร' },
    ] },

  { key: 'branch', label: 'สาขา ธนาคาร', kind: 'generic',
    desc: 'รหัสสาขาธนาคาร — อ้างอิงกับรหัสธนาคาร',
    fields: [{ k: 'bankCode', label: 'ธนาคาร', w: 200, type: 'bankref', required: true },
             { k: 'code', label: 'รหัสสาขา', w: 120, mono: true, required: true },
             { k: 'name', label: 'ชื่อสาขา', required: true }],
    seed: [
      { bankCode: '002', code: '0001', name: 'สำนักงานใหญ่สีลม' },
      { bankCode: '002', code: '0123', name: 'สาขาถนนแจ้งวัฒนะ' },
      { bankCode: '006', code: '0001', name: 'สาขาสำนักงานใหญ่' },
      { bankCode: '014', code: '0456', name: 'สาขารัชโยธิน' },
      { bankCode: '004', code: '0789', name: 'สาขาพหลโยธิน' },
    ] },

  { key: 'moneygroup', label: 'ประเภทกลุ่มเงิน', kind: 'generic',
    desc: 'กลุ่มของประเภทเงินที่ทำรายการ — ใช้จัดกลุ่มในเมนูประเภทการทำรายการ',
    fields: [{ ...TT_CAT_CODE, label: 'รหัสกลุ่มเงิน' }, { k: 'name', label: 'ชื่อกลุ่มประเภทเงิน', required: true }],
    storeKey: 'dep_const_moneygroup_v2',
    seed: [
      { code: 'CSH', name: 'เงินสด' },
      { code: 'CHQ', name: 'เช็ค' },
      { code: 'TBK', name: 'โอนผ่านธนาคาร' },
      { code: 'TRN', name: 'โอนภายในสหกรณ์' },
      { code: 'TMT', name: 'ชำระรายเดือน' },
      { code: 'TUS', name: 'โอนผ่านหน่วยงาน / ตัวแทนภายนอก' },
      { code: 'DIV', name: 'ปันผล' },
      { code: 'INT', name: 'ดอกเบี้ย' },
    ] },

  { key: 'moneytype', label: 'กำหนดประเภทเงินทำรายการ', kind: 'generic',
    desc: 'ประเภทเงินที่ใช้ทำรายการ พร้อมรหัสพิมพ์ กลุ่มเงิน บัญชีรับ/จ่าย และลำดับการแสดง',
    fields: [
      { ...TT_CAT_CODE, w: 90, ph: 'ตัวอักษรภาษาอังกฤษ 3 ตัว เช่น CSH', hint: 'ใช้ภาษาอังกฤษตัวพิมพ์ใหญ่หรือตัวเลข' },
      { k: 'name', label: 'ประเภทเงินทำรายการ', required: true, ph: 'ชื่อประเภทเงิน เช่น เงินสด, เช็คธนาคาร' },
      { k: 'print', label: 'รหัสพิมพ์', w: 100, mono: true, up: true, ph: 'รหัสที่พิมพ์ในสมุด/สลิป เช่น CSH' },
      { k: 'group', label: 'กลุ่มเงิน', w: 120, mono: true, type: 'opts', filter: true, required: true, hint: 'อ้างอิงจากเมนูประเภทกลุ่มเงิน',
        optsFn: () => gcLoad(ttCat('moneygroup')).filter(g => g.enabled !== false).map(g => ({ v: g.code, l: g.code + ' · ' + g.name })) },
      { k: 'acctIn', label: 'บัญชีรับ', w: 120, mono: true, type: 'coa' },
      { k: 'acctOut', label: 'บัญชีจ่าย', w: 120, mono: true, type: 'coa' },
      { k: 'order', label: 'ลำดับ', w: 80, mono: true, ph: 'เช่น 1' },
    ],
    storeKey: 'dep_const_moneytype_v1',
    seed: [
      { code: 'BEX', name: 'ตั๋วแลกเงิน', print: 'BEX', group: 'CHQ', acctIn: '111553', acctOut: '111553', order: '10' },
      { code: 'CAP', name: 'CA-POST', print: 'CAP', group: 'TUS', acctIn: '1105010', acctOut: '2203510', order: '13' },
      { code: 'CBT', name: 'โอนธนาคาร', print: 'BNK', group: 'TBK', acctIn: '111551', acctOut: '111551', order: '3' },
      { code: 'CHQ', name: 'เช็คธนาคาร', print: 'CHQ', group: 'CHQ', acctIn: '111232', acctOut: '111232', order: '2' },
      { code: 'CSC', name: 'แคชเชียร์เช็ค', print: 'CSC', group: 'CHQ', acctIn: '111553', acctOut: '111553', order: '12' },
      { code: 'CSH', name: 'เงินสด', print: 'CSH', group: 'CSH', acctIn: '111101', acctOut: '111101', order: '1' },
      { code: 'CSV', name: 'Counter Service', print: 'CTS', group: 'TUS', acctIn: '', acctOut: '', order: '16' },
      { code: 'DRF', name: 'ดราฟท์', print: 'DRF', group: 'CHQ', acctIn: '111553', acctOut: '111553', order: '9' },
      { code: 'MON', name: 'ธนาณัติธรรมดา', print: 'MON', group: 'CSH', acctIn: '111232', acctOut: '111232', order: '15' },
      { code: 'MOO', name: 'ธนาณัติ online', print: 'MOO', group: 'CSH', acctIn: '111101', acctOut: '111101', order: '12' },
      { code: 'MOS', name: 'ธนาณัติ EMS', print: 'MOS', group: 'CSH', acctIn: '111101', acctOut: '111101', order: '14' },
      { code: 'TAG', name: 'โอนลูกหนี้ตัวแทน', print: 'TAG', group: 'TUS', acctIn: '1105010', acctOut: '115403', order: '6' },
      { code: 'TBK', name: 'โอนภายใน', print: 'TBK', group: 'TBK', acctIn: '11220001', acctOut: '11220001', order: '4' },
      { code: 'TDF', name: 'โอนครบกำหนดเงินฝากประจำ', print: 'TDF', group: 'TRN', acctIn: '', acctOut: '', order: '7' },
      { code: 'TMT', name: 'ชำระรายเดือน', print: 'TMT', group: 'TMT', acctIn: '', acctOut: '', order: '11' },
      { code: 'TRN', name: 'โอนเงินฝากสหกรณ์', print: 'TRN', group: 'TRN', acctIn: '', acctOut: '', order: '5' },
      { code: 'TRS', name: 'โอนเงินเดือน', print: 'TRS', group: 'TUS', acctIn: '510070', acctOut: '510070', order: '8' },
      { code: 'ZZZ', name: '===UNKNOW===', print: '', group: '', acctIn: '', acctOut: '', order: '99' },
    ] },

  { key: 'txnpair', label: 'ประเภทคู่บัญชี', kind: 'generic', uniq: ['money', 'code'],
    desc: 'ผูกประเภทเงินกับรหัสบัญชีที่ทำรายการฝากถอนเงินฝาก และวิธีเปิดบัญชีที่ใช้คู่บัญชีนั้น',
    fields: [
      { k: 'money', label: 'ประเภทเงิน', w: 120, mono: true, required: true, filter: true, type: 'opts', hint: 'อ้างอิงจากเมนูกำหนดประเภทเงินทำรายการ (รหัส)',
        optsFn: () => gcLoad(ttCat('moneytype')).filter(g => g.enabled !== false).map(g => ({ v: g.code, l: g.code + ' · ' + g.name })) },
      { k: 'code', label: 'รหัสบัญชี', w: 130, mono: true, required: true },
      { k: 'name', label: 'ชื่อบัญชีที่ทำรายการฝากถอนเงินฝาก', required: true },
      { k: 'openBy', label: 'เปิดบัญชีโดย', w: 280, type: 'opts', opts: ["เปิดบัญชีใหม่ด้วยเงินสด","เปิดบัญชีด้วยแคชเชียร์เช็ค","เปิดบัญชีด้วยดราฟท์","เปิดบัญชีด้วยเช็คส่วนบุคคล","เปิดบัญชีจากลูกหนี้ตัวแทนหักเงินเดือน","เปิดบัญชีใหม่ด้วยการโอนนอกระบบ","เปิดบัญชีโดยธนาณัติ","เปิดบัญชีใหม่ด้วยการโอน"].map(s => ({ v: s, l: s })) },
    ],
    storeKey: 'dep_const_txnpair_v1',
    seed: [
      { money: 'CBT', code: '111232', name: 'นำฝาก ธ.กรุงไทย ปณท.(กสท.)(กระแส)', openBy: '' },
      { money: 'CBT', code: '111233', name: 'ธ.กรุงไทย ปณท. (กระแสรายวัน)7326', openBy: '' },
      { money: 'CBT', code: '111510', name: 'ธนาคารกรุงไทย แจ้งวัฒนะ (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111520', name: 'ธนาคารกสิกรไทยปากเกร็ด(ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111551', name: 'ธนาคารกรุงไทย ปณท.(กสท.) (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111552', name: 'ธนาคารกรุงไทย ปากเกร็ด (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111553', name: 'ธ.กรุงไทย ปณท. (ออมทรัพย์) 7318', openBy: '' },
      { money: 'CBT', code: '111573', name: 'นำฝาก ธ.ธนชาต แจ้งวัฒนะ (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111582', name: 'ธนาคารทหารไทย บก.สูงสุด (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '111600', name: 'ธ.ธนชาต อเวนิว แจ้งวัฒนะ (ออมทรัพย์)', openBy: '' },
      { money: 'CBT', code: '115403', name: 'ลูกหนี้ตัวแทนต่าง ๆ', openBy: '' },
      { money: 'CBT', code: '214101', name: 'เงินรับฝากออมทรัพย์', openBy: '' },
      { money: 'CBT', code: '214201', name: 'เงินรับฝากออมทรัพย์พิเศษ', openBy: '' },
      { money: 'CBT', code: '214301', name: 'เงินรับฝากประจำ', openBy: '' },
      { money: 'CBT', code: '214302', name: 'เงินรับฝากประจำสินเพิ่มพูน', openBy: '' },
      { money: 'CBT', code: '219902', name: 'เงินฝากธนาคาร (รอตรวจสอบ)', openBy: '' },
      { money: 'CHQ', code: '111230', name: 'ธนาคารกรุงไทยปากเกร็ด(กระแส)', openBy: '' },
      { money: 'CHQ', code: '111231', name: 'ธนาคารกรุงไทย แจ้งวัฒนะ (กระแส)', openBy: '' },
      { money: 'CHQ', code: '111232', name: 'ธนาคารกรุงไทย ปณท.(กสท.) (กระแส)', openBy: '' },
      { money: 'CHQ', code: '111233', name: 'ธ.กรุงไทย ปณท. (กระแสรายวัน)7326', openBy: '' },
      { money: 'CHQ', code: '111510', name: 'ธนาคารกรุงไทย แจ้งวัฒนะ (ออมทรัพย์)', openBy: '' },
      { money: 'CHQ', code: '111520', name: 'ธนาคารกสิกรไทยปากเกร็ด(ออมทรัพย์)', openBy: '' },
      { money: 'CHQ', code: '111551', name: 'ธนาคารกรุงไทย ปณท.(กสท.)(ออมทรัพย์)', openBy: '' },
      { money: 'CHQ', code: '111552', name: 'ธนาคารกรุงไทย ปากเกร็ด (ออมทรัพย์)', openBy: '' },
      { money: 'CHQ', code: '111553', name: 'ธ.กรุงไทย ปณท. (ออมทรัพย์) 7318', openBy: '' },
      { money: 'CHQ', code: '111582', name: 'ธนาคารทหารไทย บก.สูงสุด (ออมทรัพย์)', openBy: '' },
      { money: 'CHQ', code: '111600', name: 'ธ.ธนชาต อเวนิว แจ้งวัฒนะ (ออมทรัพย์)', openBy: '' },
      { money: 'CSH', code: '111101', name: 'เงินสด', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '111510', name: 'ธนาคารกรุงไทย แจ้งวัฒนะ (ออมทรัพย์)', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '111520', name: 'ธนาคารกสิกรไทยปากเกร็ด(ออมทรัพย์)', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '111551', name: 'ธนาคารกรุงไทย ปณท.(กสท.) (ออมทรัพย์)', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '111552', name: 'ธนาคารกรุงไทย ปากเกร็ด (ออมทรัพย์)', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '111553', name: 'ธ.กรุงไทย ปณท. (ออมทรัพย์) 7318', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'CSH', code: '115403', name: 'ลูกหนี้ตัวแทนต่าง ๆ', openBy: 'เปิดบัญชีใหม่ด้วยเงินสด' },
      { money: 'DIV', code: '219103', name: 'ปันผลเฉลี่ยคืน', openBy: '' },
      { money: 'TBK', code: '115403', name: 'ลูกหนี้ตัวแทนต่าง ๆ', openBy: 'เปิดบัญชีจากลูกหนี้ตัวแทนหักเงินเดือน' },
      { money: 'TBK', code: '219101', name: 'เงินรอจ่ายคืน', openBy: 'เปิดบัญชีจากลูกหนี้ตัวแทนหักเงินเดือน' },
      { money: 'TRN', code: '115110', name: 'ลูกหนี้เงินให้กู้แก่สมาชิกฉุกเฉิน', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '115403', name: 'ลูกหนี้ตัวแทนต่างต่าง', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '131010', name: 'ลูกหนี้เงินให้กู้แก่สมาชิกสามัญ (ระยะยาว)', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '131020', name: 'ลูกหนี้เงินให้กู้แก่สมาชิกพิเศษ (ระยะยาว)', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '214101', name: 'เงินรับฝากออมทรัพย์', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '214201', name: 'เงินรับฝากออมทรัพย์พิเศษ', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '214301', name: 'เงินรับฝากประจำ', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '214302', name: 'เงินรับฝากประจำสินเพิ่มพูน', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '219101', name: 'เงินรอจ่ายคืน', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '330100', name: 'สวัสดิการ ทุนการศึกษาบุตรสมาชิก', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510310', name: 'ค่าใช้จ่ายประชุมใหญ่', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510320', name: 'ค่าตอบแทนผู้เก็บเงินส่งให้สหกรณ์', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510660', name: 'สวัสดิการ สมาชิกเสียชีวิต', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510661', name: 'สวัสดิการ คู่สมรสเสียชีวิต', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510662', name: 'สวัสดิการ ทุพพลภาพ', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510663', name: 'สวัสดิการ บิดา มารดา บุตร เสียชีวิต', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510721', name: 'สวัสดิการ สมาชิกประสบภัยบัติ', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRN', code: '510722', name: 'สวัสดิการ ค่าตรวจสุขภาพสมาชิกเกษียณ', openBy: 'เปิดบัญชีใหม่ด้วยการโอน' },
      { money: 'TRS', code: '115403', name: 'ลูกหนี้ตัวแทนต่าง ๆ', openBy: '' },
      { money: 'TRS', code: '214101', name: 'เงินรับฝากออมทรัพย์', openBy: '' },
      { money: 'TRS', code: '214201', name: 'เงินรับฝากออมทรัพย์พิเศษ', openBy: '' },
      { money: 'TRS', code: '214301', name: 'เงินรับฝากประจำ', openBy: '' },
      { money: 'TRS', code: '214302', name: 'เงินรับฝากประจำสินเพิ่มพูน', openBy: '' },
      { money: 'TRS', code: '510070', name: 'เงินเดือนเจ้าหน้าที่สหกรณ์', openBy: '' },
    ] },

  { key: 'depgroup', label: 'รหัสกลุ่มรายการ', kind: 'generic',
    desc: 'กลุ่มที่ใช้จัดหมวดประเภทเงินฝากสำหรับรายงานและการประมวลผล',
    fields: [{ ...TT_CAT_CODE, up: true }, { k: 'name', label: 'ชื่อกลุ่มรายการ', required: true }],
    storeKey: 'dep_const_depgroup_v3',
    seed: TT_GROUP.map(g => ({ code: g.v, name: g.d })) },

  { key: 'depkind', label: 'ประเภทกลุ่มเงินฝาก', kind: 'generic',
    desc: 'กลุ่มของประเภทเงินฝาก — ใช้เป็นตัวเลือก “กลุ่มเงินฝาก” ในเมนูประเภทเงินฝาก',
    fields: [{ ...TT_CAT_CODE, label: 'รหัสกลุ่ม' }, { k: 'name', label: 'ชื่อประเภทกลุ่มเงินฝาก', required: true }],
    storeKey: 'dep_const_depkind_v2',
    seed: [
      { code: '00', name: 'เงินฝากออมทรัพย์' },
      { code: '01', name: 'เงินฝากออมทรัพย์พิเศษ' },
      { code: '02', name: 'เงินฝากประจำ 2 ปี' },
      { code: '03', name: 'เงินฝากสินเพิ่มพูน' },
      { code: '04', name: 'เงินฝากประจำ' },
      { code: '05', name: 'ตั๋วสัญญาใช้เงิน' },
    ] },
];
const ttCat = (key) => TT_CATEGORIES.find(c => c.key === key) || TT_CATEGORIES[0];

// ─── localStorage ───────────────────────────────────────────────────
//  txnslip เก็บที่ dep_txntype_v1 (คงเดิม) · หมวดอื่นที่ dep_const_<key>
function ttLoad() {
  let list = null;
  try { const s = localStorage.getItem('dep_txntype_v2'); if (s) list = JSON.parse(s); } catch (e) {}
  return (list || (window.DEP_TXNTYPE_SEED || [])).map(r => ({ ...r, kind: ttKindNorm(r.kind) }));
}
function ttSave(list) { try { localStorage.setItem('dep_txntype_v2', JSON.stringify(list)); } catch (e) {} }

const gcKey = (cat) => cat.storeKey || ('dep_const_' + cat.key);
function gcLoad(cat) {
  try { const s = localStorage.getItem(gcKey(cat)); if (s) return JSON.parse(s); } catch (e) {}
  return ((cat.seedFn ? cat.seedFn() : cat.seed) || []).map((r, i) => ({ id: cat.key.toUpperCase() + '-' + i, ...r }));
}
function gcSave(cat, list) { try { localStorage.setItem(gcKey(cat), JSON.stringify(list)); } catch (e) {} }
// รหัสกลุ่ม — ดึงจากค่าคงที่กลุ่มประเภทเงินฝาก
const ttMoneyGroups = () => gcLoad(ttCat('moneygroup')).map(g => ({ v: g.code, l: g.code, d: g.name }));
// ประเภทเงิน — ดึงจากกำหนดประเภทเงินทำรายการ (คอลัมน์รหัส)
const ttMoneyTypes = () => gcLoad(ttCat('moneytype')).filter(g => g.enabled !== false).map(g => ({ v: g.code, l: g.code, d: g.name, g: g.group }));
const ttKindNorm = (k) => (k === 'CBT' ? 'TBK' : k);
const ttGroups = () => gcLoad(ttCat('depgroup')).map(g => ({ v: g.code, l: g.code, d: g.name }));
// ประเภทกลุ่มเงินฝาก → ตัวเลือก “กลุ่มเงินฝาก” ของเมนูประเภทเงินฝาก (DAT_OPTS.depGroup)
const DEP_KIND_LEGACY = { saving: '00', fixed: '04', current: '04', special: '01', internal: '00' };
window.depKindNorm = (v) => DEP_KIND_LEGACY[v] || v;
window.depKindOpts = () => gcLoad(ttCat('depkind')).filter(g => g.enabled !== false).map(g => ({ v: g.code, l: g.code + ' ' + g.name }));
// กลุ่มลง ACC — ใช้รายการจากเมนูประเภทกลุ่มเงินฝากเช่นเดียวกับกลุ่มเงินฝาก (แปลงค่าเดิม DEP-xxx)
const DEP_ACC_LEGACY = { 'DEP-SAV': '00', 'DEP-FIX': '04', 'DEP-CUR': '04', 'DEP-INT': '00' };
window.depAccNorm = (v) => (v && DEP_ACC_LEGACY[v]) || (window.depKindNorm ? window.depKindNorm(v) : v);
if (window.DAT_OPTS) {
  Object.defineProperty(window.DAT_OPTS, 'depGroup', { get: () => window.depKindOpts(), configurable: true, enumerable: true });
  Object.defineProperty(window.DAT_OPTS, 'accGroupACC', { get: () => window.depKindOpts(), configurable: true, enumerable: true });
}
if (window.datLabel && !window.datLabel.__dk) { const _dl = window.datLabel; window.datLabel = (g, v) => _dl(g, g === 'depGroup' ? window.depKindNorm(v) : g === 'accGroupACC' ? window.depAccNorm(v) : v); window.datLabel.__dk = true; }

let _ttSeq = 0;
const ttUid = (p) => (p || 'TT') + '-' + Date.now().toString(36) + '-' + (++_ttSeq);
window.depBankLoad = () => gcLoad(ttCat('bank'));
window.depFreezeReasonLoad = () => gcLoad(ttCat('freezereason'));
window.depHolderTypeLoad = () => gcLoad(ttCat('holdertype'));
// ประเภทการทำรายการคู่บัญชี — ใช้ในหน้าเปิดบัญชี (เปิดบัญชีโดย → รหัสคู่บัญชี DR)
window.depTxnPairLoad = () => gcLoad(ttCat('txnpair'));
window.depOpenByOpts = () => ((ttCat('txnpair').fields || []).find(x => x.k === 'openBy') || { opts: [] }).opts.map(o => o.v);

// ════════════════════════════════════════════════════════════════════
//  Pagination (shared)
// ════════════════════════════════════════════════════════════════════
function TtPager({ page, pageCount, total, from, to, onPage }) {
  if (total === 0) return null;
  const nums = [];
  for (let n = 1; n <= pageCount; n++) {
    if (n === 1 || n === pageCount || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <div className="pagination">
      <span className="muted" style={{ fontSize: 12, marginRight: 'auto' }}>แสดง {from}–{to} จาก {total} รายการ</span>
      <button className="btn sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><Icon name="chevLeft" size={12} /></button>
      {nums.map((n, i) => n === '…'
        ? <span key={'d' + i} className="muted" style={{ padding: '0 4px' }}>…</span>
        : <button key={n} className={"btn sm" + (n === page ? ' primary' : '')} onClick={() => onPage(n)}>{n}</button>)}
      <button className="btn sm" disabled={page >= pageCount} onClick={() => onPage(page + 1)}><Icon name="chevRight" size={12} /></button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  DeptSlip: Add / edit modal — เลือกข้อกำหนด + กำหนดรหัสและรายละเอียด
// ════════════════════════════════════════════════════════════════════
function TxnTypeModal({ mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [defKey, setDefKey] = useState(isEdit ? (draft0.defKey || '') : '');
  const [code, setCode]     = useState(isEdit ? draft0.code : '');
  const [name, setName]     = useState(isEdit ? draft0.name : '');
  const [side, setSide]     = useState(isEdit ? draft0.side : 1);
  const [stm, setStm]       = useState(isEdit ? draft0.stm : '');
  const [kind, setKind]     = useState(isEdit ? ttKindNorm(draft0.kind) : '');
  const [group, setGroup]   = useState(isEdit ? draft0.group : 'DEP');
  const [vside, setVside]   = useState(isEdit ? (draft0.vside || '') : '');
  const [vc, setVc]         = useState(isEdit ? !!draft0.vc : true);
  const [vgroup, setVgroup] = useState(isEdit ? (draft0.vgroup || '') : '');
  const [pair, setPair]     = useState(isEdit ? (draft0.pair || '') : '');
  const pairOpts = React.useMemo(() => {
    const coas = (window.BA_COA || []).slice();
    (window.baLoad ? window.baLoad() : []).forEach(a => { if (a.coa && !coas.includes(a.coa)) coas.push(a.coa); });
    return coas.map(s => { const i = s.indexOf(' · '); return i > 0 ? { code: s.slice(0, i), name: s.slice(i + 3) } : { code: s, name: '' }; });
  }, []);
  const itemCodes = React.useMemo(() => gcLoad(ttCat('detitem')).map(r => ({ code: String(r.code).toUpperCase(), name: r.name })), []);
  const usedCodes = React.useMemo(() => new Set((existing || []).map(x => String(x.code).toUpperCase())), [existing]);
  const [error, setError]   = useState('');

  // เลือกรหัสรายการ → เติมค่าตั้งต้นจากข้อกำหนดของระบบ (ถ้ามีรหัสตรงกัน)
  const pickItem = (c) => {
    const it = itemCodes.find(x => x.code === c);
    setCode(c); if (it) setName(it.name);
    const d = (window.DEP_TXN_DEFS || []).find(x => x.key === c);
    if (d) { setDefKey(d.key); setSide(d.side); setStm(d.stm); setKind(d.kind); setGroup(d.group); setVside(d.vside); setVc(d.vc); setVgroup(d.vgroup); }
    setError('');
  };

  const submit = (e) => {
    if (!kind) { setError('กรุณาเลือกประเภทเงิน'); return; }
    e.preventDefault();
    const c = String(code).trim().toUpperCase();
    if (!c) { setError('กรุณาเลือกรหัสรายการ'); return; }
    if (!name.trim()) { setError('กรุณาระบุประเภทการทำรายการ'); return; }
    const dup = (existing || []).some(x => x.code.toUpperCase() === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัส “${c}” มีอยู่แล้วในตาราง — กรุณาใช้รหัสอื่น`); return; }
    onSubmit({ defKey: defKey || c, code: c, name: name.trim(), side: Number(side), stm: stm.trim().toUpperCase(), kind, group, vside, vc, vgroup, pair });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true"
           style={{ width: 640, maxWidth: '94vw', top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขประเภทการทำรายการ' : 'สร้างรหัสประเภทการทำรายการ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              เลือกข้อกำหนดจากรายการที่ระบบรองรับ แล้วกำหนดรหัสและรายละเอียดการลงบัญชี
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }} onSubmit={submit}>
          <div className="bud-form-grid">
            <div className="bud-fld">
              <label className="lt-modal-label">รหัส <span className="cfg-required">*</span></label>
              <select className="cfg-input" value={code} autoFocus disabled={isEdit}
                      onChange={(e) => pickItem(e.target.value)}>
                <option value="">— เลือกรหัสรายการ —</option>
                {isEdit && code && !itemCodes.some(x => x.code === code) && <option value={code}>{code}</option>}
                {itemCodes.map(x => <option key={x.code} value={x.code} disabled={usedCodes.has(x.code) && x.code !== code}>
                  {x.code} · {x.name}{usedCodes.has(x.code) && x.code !== code ? ' (ใช้แล้ว)' : ''}</option>)}
              </select>
              <div className="bud-fld-hint">อ้างอิงจากเมนูรหัสรายการ</div>
            </div>

            <div className="bud-fld">
              <label className="lt-modal-label">ฝั่งรายการ</label>
              <select className="cfg-input" value={side} onChange={(e) => setSide(Number(e.target.value))}>
                {TT_SIDE.map(o => <option key={o.v} value={o.v}>{o.l} · {o.d}</option>)}
              </select>
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">คู่บัญชี</label>
              <select className="cfg-input" value={pair} onChange={(e) => setPair(e.target.value)}>
                <option value="">— เลือกคู่บัญชี —</option>
                {pairOpts.map(o => <option key={o.code} value={o.code}>{o.code}{o.name ? ' · ' + o.name : ''}</option>)}
              </select>
              <div className="bud-fld-hint">อ้างอิงคู่บัญชีจากเมนูรายการธนาคาร</div>
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">ประเภทการทำรายการ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} placeholder="ชื่อประเภทการทำรายการ"
                     onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>

            <div className="bud-fld">
              <label className="lt-modal-label">รหัส Stm</label>
              <input className="cfg-input mono" value={stm} maxLength={6} style={{ textTransform: 'uppercase' }}
                     placeholder="เช่น DCA"
                     onChange={(e) => setStm(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())} />
            </div>

            <div className="bud-fld">
              <label className="lt-modal-label">ประเภทเงิน <span className="cfg-required">*</span></label>
              <select className="cfg-input" value={kind} onChange={(e) => { setKind(e.target.value); setError(''); }}>
                <option value="">— เลือกประเภทเงิน —</option>
                {kind && !ttMoneyTypes().some(o => o.v === kind) && <option value={kind}>{kind}</option>}
                {ttMoneyTypes().map(o => <option key={o.v} value={o.v}>{o.l} · {o.d}</option>)}
              </select>
              <div className="bud-fld-hint">อ้างอิงจากเมนูกำหนดประเภทเงินทำรายการ (รหัส)</div>
            </div>

            <div className="bud-fld span2">
              <label className="lt-modal-label">รหัสกลุ่ม</label>
              <select className="cfg-input" value={group} onChange={(e) => setGroup(e.target.value)}>
                {ttGroups().map(o => <option key={o.v} value={o.v}>{o.l} · {o.d}</option>)}
              </select>
              <div className="bud-fld-hint">อ้างอิงจากเมนูรหัสกลุ่มรายการ</div>
            </div>
          </div>

          <div className="tt-modal-vsec">
            <div className="tt-modal-vsec-head"><Icon name="report" size={13} /> การลงบัญชี (Voucher)</div>
            <div className="bud-form-grid" style={{ marginTop: 8 }}>
              <div className="bud-fld">
                <label className="lt-modal-label">ฝั่งบัญชี (บ/ช)</label>
                <select className="cfg-input" value={vside} onChange={(e) => setVside(e.target.value)}>
                  {TT_VSIDE.map(o => <option key={o.v} value={o.v}>{o.l === '—' ? 'ไม่ระบุ' : o.l + ' · ' + o.d}</option>)}
                </select>
              </div>
              <div className="bud-fld">
                <label className="lt-modal-label">กลุ่ม VC</label>
                <select className="cfg-input" value={vgroup} onChange={(e) => setVgroup(e.target.value)}>
                  {TT_VGROUP.map(o => <option key={o.v} value={o.v}>{o.l === '—' ? 'ไม่ระบุ' : o.l + ' · ' + o.d}</option>)}
                </select>
              </div>
              <div className="bud-fld span2">
                <label className="tt-vc-toggle">
                  <input type="checkbox" className="ct-check" checked={vc} onChange={(e) => setVc(e.target.checked)} />
                  <span>ทำ Voucher (สร้างใบสำคัญลงบัญชีอัตโนมัติเมื่อทำรายการ)</span>
                </label>
              </div>
            </div>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'สร้างรหัส'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Generic category: Add / edit modal (driven by cat.fields)
// ════════════════════════════════════════════════════════════════════
function GenericConstModal({ cat, mode, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const [vals, setVals] = useState(() => {
    const v = {};
    cat.fields.forEach(f => {
      const only = f.type === 'opts' && (f.opts || []).length === 1 ? f.opts[0].v : '';
      v[f.k] = isEdit ? (draft0[f.k] != null && draft0[f.k] !== '' ? draft0[f.k] : only) : only;
    });
    return v;
  });
  const [error, setError] = useState('');
  const banks = React.useMemo(() => gcLoad(ttCat('bank')), []);
  const txnCodes = React.useMemo(() => ttLoad(), []);
  const coaList = React.useMemo(() => {
    const all = window.coaFlatAccounts ? window.coaFlatAccounts() : [];
    const leaf = all.filter(a => a.kind !== 'control');
    const out = (leaf.length ? leaf : all).map(a => ({ code: String(a.code), name: a.name }));
    // รวมรหัสบัญชีที่ใช้จริงในเมนูประเภทการทำรายการคู่บัญชี (รหัสเดิมที่ยังไม่อยู่ในผังบัญชี)
    gcLoad(ttCat('txnpair')).forEach(r => { if (r.code && !out.some(a => a.code === String(r.code))) out.push({ code: String(r.code), name: r.name }); });
    // รหัสเดิมที่ใช้อยู่ในเมนูประเภทการทำรายการ แต่ยังไม่มีในผังบัญชี
    gcLoad(ttCat('moneytype')).forEach(r => ['acctIn', 'acctOut'].forEach(k => {
      const c = String(r[k] || '').trim();
      if (c && !out.some(a => a.code === c)) out.push({ code: c, name: '(รหัสเดิม — ยังไม่มีในผังบัญชี)' });
    }));
    return out.sort((a, b) => a.code.localeCompare(b.code));
  }, []);
  const keys = cat.uniq || (cat.key === 'branch' ? ['bankCode', 'code'] : ['code']);
  const dupNow = String(vals.code || '').trim() !== '' && (existing || []).some(x =>
    keys.every(k => String(x[k] || '').trim().toUpperCase() === String(vals[k] || '').trim().toUpperCase()) && (!isEdit || x.id !== draft0.id));
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    for (const f of cat.fields) {
      if (f.required && !String(vals[f.k] || '').trim()) { setError(`กรุณาระบุ${f.label}`); return; }
    }
    const codeVal = String(vals.code || '').trim();
    const keys = cat.uniq || (cat.key === 'branch' ? ['bankCode', 'code'] : ['code']);
    const dup = (existing || []).some(x => keys.every(k => String(x[k] || '').trim() === String(vals[k] || '').trim())
      && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(cat.uniq ? 'ประเภทเงินและรหัสบัญชีนี้มีอยู่แล้ว — กรุณาตรวจสอบ' : `รหัส “${codeVal}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    const out = {};
    cat.fields.forEach(f => {
      let v = vals[f.k];
      if (typeof v === 'string') { v = v.trim(); if (f.up) v = v.toUpperCase(); }
      out[f.k] = v;
    });
    onSubmit(out);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-const-modal" role="dialog" aria-modal="true"
           style={{ width: 560, maxWidth: '94vw', top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? `แก้ไข${cat.label}` : `สร้างรหัส${cat.label}`}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{cat.desc}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }} onSubmit={submit}>
          <div className="bud-form-grid">
            {(() => {
              const shorts = cat.fields.filter(x => x.k !== 'name');
              const names = cat.fields.filter(x => x.k === 'name');
              return [...shorts, ...names];
            })().map((f, i, arr) => {
              const isName = f.k === 'name';
              const shortCount = arr.filter(x => x.k !== 'name').length;
              const lastOddShort = !isName && shortCount % 2 === 1 && i === shortCount - 1;
              return (
                <div key={f.k} className={"bud-fld" + (isName || lastOddShort ? ' span2' : '')}>
                  <label className="lt-modal-label">{f.label} {f.required && <span className="cfg-required">*</span>}</label>
                  {f.type === 'txnref' ? (
                    <select className="cfg-input mono" value={vals[f.k]} autoFocus={i === 0}
                            onChange={(e) => { const t = txnCodes.find(x => x.code === e.target.value);
                                               setVals(p => ({ ...p, code: e.target.value, name: t ? t.name : '', side: t ? String(t.side) : '', cross: t ? (t.cross || '') : '', stm: t ? t.stm : '', group: t ? t.group : '' })); setError(''); }}>
                      <option value="">— เลือกรหัสจากกำหนดประเภทการทำรายการ —</option>
                      {txnCodes.map(t => <option key={t.code} value={t.code}>{t.code} · {t.name}</option>)}
                    </select>
                  ) : f.type === 'opts' ? (
                    <select className={'cfg-input' + (f.mono ? ' mono' : '')} value={vals[f.k]} autoFocus={i === 0} onChange={(e) => set(f.k, e.target.value)}>
                      <option value="">— {f.required ? 'เลือก' + f.label : 'ไม่ระบุ'} —</option>
                      {(f.optsFn ? f.optsFn() : f.opts).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : f.type === 'coa' ? (
                    <select className="cfg-input" value={vals[f.k]} onChange={(e) => set(f.k, e.target.value)}>
                      <option value="">— เลือกบัญชีจากผังบัญชี —</option>
                      {vals[f.k] && !coaList.some(a => a.code === String(vals[f.k])) && <option value={vals[f.k]}>{vals[f.k]} · (ไม่พบในผังบัญชี)</option>}
                      {coaList.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                    </select>
                  ) : f.ro ? (
                    <div className="cfg-display-box">{vals[f.k] || '—'}</div>
                  ) : f.type === 'bankref' ? (
                    <select className="cfg-input" value={vals[f.k]} onChange={(e) => set(f.k, e.target.value)} autoFocus={i === 0}>
                      <option value="">— เลือกธนาคาร —</option>
                      {banks.map(b => <option key={b.code} value={b.code}>{b.code} · {b.name}</option>)}
                    </select>
                  ) : (
                    <input className={'cfg-input' + (f.k === 'code' && dupNow ? ' is-error' : '')} value={vals[f.k]} placeholder={f.ph || ''}
                           disabled={isEdit && f.k === 'code'}
                           maxLength={f.mono ? 10 : undefined} autoFocus={i === 0 && !(isEdit && f.k === 'code')}
                           style={f.up ? { textTransform: 'uppercase' } : undefined}
                           onChange={(e) => set(f.k, f.up ? e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() : e.target.value)} />
                  )}
                  {f.k === 'code' && dupNow
                    ? <div className="bud-fld-hint" style={{ color: 'var(--danger, #cf1322)' }}><Icon name="info" size={11} /> รหัส “{String(vals.code).toUpperCase()}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น</div>
                    : f.hint && <div className="bud-fld-hint">{f.hint}</div>}
                </div>
              );
            })}
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'สร้างรหัส'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Delete confirm modal
// ════════════════════════════════════════════════════════════════════
const TT_REF_BY = {
  txnslip:    'หน้าฝาก / ถอน / โอน / ปิดบัญชี และรายการเงินฝากทั้งหมด',
  detitem:    'กำหนดประเภทการทำรายการ',
  depgroup:   'กำหนดประเภทการทำรายการ (รหัสกลุ่ม)',
  depkind:    'ประเภทเงินฝาก (กลุ่มเงินฝาก)',
  moneygroup: 'กำหนดประเภทการทำรายการ และประเภทการทำรายการ (กลุ่มเงิน)',
  moneytype:  'กำหนดประเภทการทำรายการ (ประเภทเงิน) และประเภทคู่บัญชี',
  txnpair:    'เปิดบัญชีเงินฝาก (เปิดบัญชีโดย / รหัสคู่บัญชี DR)',
  bank:       'สาขาธนาคาร · รายการธนาคาร · เช็ค และการโอนเงิน',
  branch:     'รายการธนาคาร · เช็ค และการโอนเงิน',
};
function TtRefNote({ catKey }) {
  const ref = TT_REF_BY[catKey];
  if (!ref) return null;
  return (
    <div className="sr-warn" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, textAlign: 'left' }}>
      <Icon name="info" size={13} /> ข้อมูลนี้ถูกใช้อ้างอิงใน <b>{ref}</b> — รายการที่ใช้รหัสนี้อยู่แล้วจะไม่พบข้อมูลอ้างอิง
    </div>
  );
}
function TtResetConfirm({ label, catKey, onOk, onClose }) {
  return (
    <window.DepStatusDialog tone="danger" icon="refresh" title="คืนค่าตั้งต้น?"
      desc={'ข้อมูล' + label + 'ที่เพิ่มหรือแก้ไขไว้ทั้งหมดจะถูกแทนที่ด้วยค่าตั้งต้น'}
      okLabel="ยืนยันคืนค่าตั้งต้น" onOk={onOk} onClose={onClose}>
      {TT_REF_BY[catKey] && <TtRefNote catKey={catKey} />}
    </window.DepStatusDialog>
  );
}
function TxnTypeDeleteModal({ label, rec, onConfirm, onClose, catKey }) {
  const ref = TT_REF_BY[catKey];
  return (
    <window.DepStatusDialog tone="danger" title={'ยืนยันการลบ' + (label || 'รายการ')}
      desc={<>ต้องการลบ “<span className="mono">{rec.code || '—'}</span> · {rec.name || '—'}” ใช่หรือไม่?</>}
      okLabel="ลบ" onOk={() => onConfirm(rec)} onClose={onClose} />
  );
}

// ════════════════════════════════════════════════════════════════════
//  DeptSlip grid (full table + inline Voucher + pagination)
// ════════════════════════════════════════════════════════════════════
function TxnSlipTable({ onToast, addRef }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(ttLoad);
  const [modal, setModal] = useState(null);
  const [del, setDel]     = useState(null);
  const [page, setPage]   = useState(1);

  const persist = (next) => { setList(next); ttSave(next); };
  React.useEffect(() => { if (addRef) addRef.current = () => setModal({ mode: 'add', rec: null }); }, [addRef]);
  const setField = (rec, field, value) => persist(list.map(x => x.id === rec.id ? { ...x, [field]: value } : x));

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({ action: 'update', module: 'เงินฝาก — กำหนดประเภทการทำรายการ (ประเภทการทำรายการ)', target: `${vals.code} · ${vals.name}`, summary: `แก้ไขประเภทการทำรายการ “${vals.name}”` });
      onToast && onToast(`บันทึกการแก้ไข “${vals.name}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: ttUid(), ...vals }]);
      audit.log({ action: 'create', module: 'เงินฝาก — กำหนดประเภทการทำรายการ (ประเภทการทำรายการ)', target: `${vals.code} · ${vals.name}`, summary: `สร้างรหัสประเภทการทำรายการ “${vals.name}”`,
        changes: [{ field: 'รหัส', before: '—', after: vals.code }, { field: 'ประเภทการทำรายการ', before: '—', after: vals.name }] });
      onToast && onToast(`สร้างรหัส “${vals.code}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };
  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({ action: 'delete', module: 'เงินฝาก — กำหนดประเภทการทำรายการ (ประเภทการทำรายการ)', target: `${c.code} · ${c.name}`, summary: `ลบประเภทการทำรายการ “${c.name}”` });
    onToast && onToast(`ลบ “${c.name}” เรียบร้อยแล้ว`);
    setDel(null);
  };
  const resetSeed = () => { persist((window.DEP_TXNTYPE_SEED || []).map(r => ({ ...r }))); onToast && onToast('คืนค่าตั้งต้นเรียบร้อยแล้ว'); };
  const vcCount = list.filter(r => r.vc).length;
  const [askReset, setAskReset] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const kw = query.trim().toLowerCase();
  const filtered = kw
    ? list.filter(r => String(r.code).toLowerCase().includes(kw) || String(r.name).toLowerCase().includes(kw))
    : list;
  React.useEffect(() => { setPage(1); }, [kw]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / TT_PAGE_SIZE));
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);
  const from = filtered.length ? (page - 1) * TT_PAGE_SIZE + 1 : 0;
  const to = Math.min(page * TT_PAGE_SIZE, filtered.length);
  const rows = filtered.slice(from - 1, to);

  return (
    <>
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }}
                   placeholder="ค้นหารหัส หรือประเภทการทำรายการ" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={() => setQuery(q)}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); }}>รีเซ็ต</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl tt-tbl" style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th rowSpan={2} className="center" style={{ width: 84 }}>รหัส</th>
                <th rowSpan={2} style={{ minWidth: 240 }}>ประเภทการทำรายการ</th>
                <th rowSpan={2} className="center" style={{ width: 90 }}>ฝั่งรายการ</th>
                <th rowSpan={2} className="center" style={{ width: 88 }}>รหัส Stm</th>
                <th rowSpan={2} className="center" style={{ width: 96 }}>ประเภทเงิน</th>
                <th rowSpan={2} className="center" style={{ width: 104 }}>รหัสกลุ่ม</th>
                <th colSpan={3} className="center tt-vc-head">Voucher</th>
                <th rowSpan={2} className="center" style={{ width: 100 }}>สถานะ</th>
                <th rowSpan={2} className="center" style={{ width: 80, paddingRight: 16 }}>ใช้งาน</th>
                <th rowSpan={2} className="center" style={{ width: 110, paddingLeft: 16 }}>จัดการ</th>
              </tr>
              <tr>
                <th className="center tt-vc-sub" style={{ width: 96 }}>ฝั่งบ/ช</th>
                <th className="center tt-vc-sub" style={{ width: 72 }}>ทำ VC</th>
                <th className="center tt-vc-sub" style={{ width: 96 }}>กลุ่ม VC</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={12} className="center muted" style={{ padding: '32px 12px' }}>ยังไม่มีประเภทการทำรายการ — กดปุ่ม “สร้างรหัส” เพื่อเลือกข้อกำหนดและกำหนดรหัส</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className={r.enabled === false ? 'dat-off' : undefined}>
                  <td className="center mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r.code}</td>
                  <td>{r.name}</td>
                  <td className="center mono" title={ttDesc(TT_SIDE, r.side)}>{r.side}</td>
                  <td className="center mono">{r.stm || '—'}</td>
                  <td className="center"><span className="chip" title={ttDesc(ttMoneyTypes(), r.kind)}>{r.kind}</span></td>
                  <td className="center"><span className="chip info" title={ttDesc(ttGroups(), r.group)}>{r.group}</span></td>
                  <td className="center tt-vc-cell mono">{(TT_VSIDE.find(o => o.v === r.vside) || {}).l || '—'}</td>
                  <td className={"center tt-vc-cell" + (r.vc ? '' : ' tt-vc-off')}>
                    {r.vc ? <Icon name="check" size={14} style={{ color: 'var(--brand, #237450)', display: 'inline-block' }} /> : <span className="muted">—</span>}
                  </td>
                  <td className="center tt-vc-cell mono">{r.vc ? ((TT_VGROUP.find(o => o.v === r.vgroup) || {}).l || '—') : <span className="muted">—</span>}</td>
                  <td className="center">{r.enabled !== false ? <span className="chip success">เปิดใช้งาน</span> : <span className="chip">ปิดใช้งาน</span>}</td>
                  <td className="center"><button type="button" role="switch" data-st="" aria-checked={r.enabled !== false} aria-label="ใช้งาน"
                        onClick={() => window.depConfirmOff(r.enabled !== false, (r.code || '') + ' · ' + (r.name || ''),
                          () => persist(list.map(x => x.id === r.id ? { ...x, enabled: x.enabled === false } : x)),
                          'รายการนี้จะไม่แสดงเป็นตัวเลือกในการทำรายการ', 'ปิดการใช้งานรายการ')}
                        style={{ width: 44, height: 22, borderRadius: 11, border: 0, padding: 2, cursor: 'pointer', display: 'inline-flex',
                                 justifyContent: r.enabled !== false ? 'flex-end' : 'flex-start', background: r.enabled !== false ? 'var(--brand, #237450)' : 'rgba(0,0,0,.25)', transition: 'background .2s' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                      </button></td>
                  <td className="center">
                    <div className="col-gap" style={{ justifyContent: 'center', display: 'inline-flex', gap: 6 }}>
                      <button className="btn sm ex-row-btn" onClick={() => setModal({ mode: 'edit', rec: r })}><Icon name="edit" size={13} /> แก้ไข</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        <TtPager page={page} pageCount={pageCount} total={filtered.length} from={from} to={to} onPage={setPage} />
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> แก้ไขค่า Voucher ได้ที่ปุ่ม “แก้ไข” · ทุกการแก้ไขจะถูกจัดเก็บใน Audit Log
      </div>


      {modal && <TxnTypeModal mode={modal.mode} draft0={modal.mode === 'edit' ? modal.rec : null} existing={list} onClose={() => setModal(null)} onSubmit={submit} />}
      {del && <TxnTypeDeleteModal label="ประเภทการทำรายการ" catKey="txnslip" rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Generic category grid (code/name + pagination)
// ════════════════════════════════════════════════════════════════════
function GenericConstTable({ cat, onToast, addRef }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(() => gcLoad(cat));
  const [modal, setModal] = useState(null);
  const [del, setDel]     = useState(null);
  const [page, setPage]   = useState(1);

  React.useEffect(() => { setList(gcLoad(cat)); setPage(1); }, [cat.key]);
  const persist = (next) => { setList(next); gcSave(cat, next); };
  React.useEffect(() => { if (addRef) addRef.current = () => setModal({ mode: 'add', rec: null }); }, [addRef, cat.key]);

  const bankName = (code) => { const b = (window.depBankLoad ? window.depBankLoad() : []).find(x => String(x.code) === String(code)); return b ? b.name : ''; };

  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const filterFld = (cat.fields || []).find(fd => fd.filter);
  const [fv, setFv] = useState('');
  const [fvQ, setFvQ] = useState('');
  React.useEffect(() => { setQ(''); setQuery(''); setFv(''); setFvQ(''); }, [cat.key]);
  const kw = query.trim().toLowerCase();
  // ค้นหาเฉพาะรหัส + ชื่อ ให้ตรงกับข้อความในช่องค้นหา (ช่องอื่นใช้ตัวกรอง dropdown)
  const filtered = list.filter(r => (!filterFld || !fvQ || String(r[filterFld.k] || '') === fvQ) && (!kw
    || String(r.code || '').toLowerCase().includes(kw) || String(r.name || '').toLowerCase().includes(kw)));
  React.useEffect(() => { setPage(1); }, [query, fvQ]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / TT_PAGE_SIZE));
  React.useEffect(() => { if (page > pageCount) setPage(pageCount); }, [pageCount, page]);
  const from = filtered.length ? (page - 1) * TT_PAGE_SIZE + 1 : 0;
  const to = Math.min(page * TT_PAGE_SIZE, filtered.length);
  const rows = filtered.slice(from - 1, to);

  const submit = (vals) => {
    const { mode, rec } = modal;
    const nm = vals.name || vals.code;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals } : x));
      audit.log({ action: 'update', module: `เงินฝาก — กำหนดประเภทการทำรายการ (${cat.label})`, target: `${vals.code} · ${nm}`, summary: `แก้ไข${cat.label} “${nm}”` });
      onToast && onToast(`บันทึกการแก้ไข “${nm}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: ttUid(cat.key.toUpperCase()), ...vals }]);
      audit.log({ action: 'create', module: `เงินฝาก — กำหนดประเภทการทำรายการ (${cat.label})`, target: `${vals.code} · ${nm}`, summary: `สร้างรหัส${cat.label} “${nm}”`,
        changes: [{ field: 'รหัส', before: '—', after: vals.code }, { field: cat.label, before: '—', after: nm }] });
      onToast && onToast(`สร้างรหัส “${vals.code}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };
  const confirmDelete = (c) => {
    persist(list.filter(x => x.id !== c.id));
    audit.log({ action: 'delete', module: `เงินฝาก — กำหนดประเภทการทำรายการ (${cat.label})`, target: `${c.code} · ${c.name || ''}`, summary: `ลบ${cat.label} “${c.name || c.code}”` });
    onToast && onToast(`ลบ “${c.name || c.code}” เรียบร้อยแล้ว`);
    setDel(null);
  };
  const [askReset, setAskReset] = useState(false);
  const resetSeed = () => { const fresh = ((cat.seedFn ? cat.seedFn() : cat.seed) || []).map((r, i) => ({ id: cat.key.toUpperCase() + '-' + i, ...r })); persist(fresh); onToast && onToast('คืนค่าตั้งต้นเรียบร้อยแล้ว'); };

  const cell = (f, r) => {
    if (f.type === 'bankref') return <span><span className="mono">{r[f.k]}</span> <span className="muted">· {bankName(r[f.k])}</span></span>;
    if (f.k === 'money' || (f.k === 'group' && cat.key === 'moneytype')) return r[f.k] ? <span className="chip mono">{r[f.k]}</span> : <span className="muted">—</span>;
    if (f.k === 'code') return <span className="mono" style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r[f.k]}</span>;
    if (f.type === 'opts' && !r[f.k]) return <span className="muted">—</span>;
    return <span className={f.mono ? 'mono' : ''}>{r[f.k] || '—'}</span>;
  };

  return (
    <>
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }}
                   placeholder={'ค้นหารหัส หรือ' + cat.label} />
          </div>
          {filterFld && (
            <select className="cfg-input" style={{ width: 220, flex: '0 0 220px', height: 32, minHeight: 32, boxSizing: 'border-box' }} value={fv} onChange={(e) => setFv(e.target.value)}>
              <option value="">ทุก{filterFld.label}</option>
              {(filterFld.optsFn ? filterFld.optsFn() : filterFld.opts).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          )}
          <button className="btn primary pa-tb-btn" onClick={() => { setQuery(q); setFvQ(fv); }}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); setFv(''); setFvQ(''); }}>รีเซ็ต</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 60 }}>ลำดับ</th>
                {cat.fields.map(f => <th key={f.k} className={f.k === 'code' || f.type === 'bankref' ? '' : ''} style={f.w ? { width: f.w } : { minWidth: 240 }}>{f.label}</th>)}
                <th className="center" style={{ width: 100 }}>สถานะ</th>
                <th className="center" style={{ width: 80, paddingRight: 16 }}>ใช้งาน</th>
                <th className="center" style={{ width: 110, paddingLeft: 16 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={cat.fields.length + 4} className="center muted" style={{ padding: '32px 12px' }}>ยังไม่มีรายการ — กดปุ่ม “สร้างรหัส” เพื่อเพิ่ม</td></tr>
              )}
              {list.length > 0 && filtered.length === 0 && (
                <tr><td colSpan={cat.fields.length + 4} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id} className={r.enabled === false ? 'dat-off' : undefined}>
                  <td className="center mono">{from + i}</td>
                  {cat.fields.map(f => <td key={f.k} className={f.align === 'center' ? 'center' : undefined}>{cell(f, r)}</td>)}
                  <td className="center">{r.enabled !== false ? <span className="chip success">เปิดใช้งาน</span> : <span className="chip">ปิดใช้งาน</span>}</td>
                  <td className="center"><button type="button" role="switch" data-st="" aria-checked={r.enabled !== false} aria-label="ใช้งาน"
                        onClick={() => window.depConfirmOff(r.enabled !== false, (r.code || '') + ' · ' + (r.name || ''),
                          () => persist(list.map(x => x.id === r.id ? { ...x, enabled: x.enabled === false } : x)),
                          'รายการนี้จะไม่แสดงเป็นตัวเลือกในการทำรายการ', 'ปิดการใช้งานรายการ')}
                        style={{ width: 44, height: 22, borderRadius: 11, border: 0, padding: 2, cursor: 'pointer', display: 'inline-flex',
                                 justifyContent: r.enabled !== false ? 'flex-end' : 'flex-start', background: r.enabled !== false ? 'var(--brand, #237450)' : 'rgba(0,0,0,.25)', transition: 'background .2s' }}>
                        <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                      </button></td>
                  <td className="center">
                    <div className="col-gap" style={{ justifyContent: 'center', display: 'inline-flex', gap: 6 }}>
                      <button className="btn sm ex-row-btn" onClick={() => setModal({ mode: 'edit', rec: r })}><Icon name="edit" size={13} /> แก้ไข</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        <TtPager page={page} pageCount={pageCount} total={filtered.length} from={from} to={to} onPage={setPage} />
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ทุกการแก้ไขจะถูกจัดเก็บใน Audit Log
      </div>

      {modal && <GenericConstModal cat={cat} mode={modal.mode} draft0={modal.mode === 'edit' ? modal.rec : null} existing={list} onClose={() => setModal(null)} onSubmit={submit} />}
      {del && <TxnTypeDeleteModal label={cat.label} catKey={cat.key} rec={del} onConfirm={confirmDelete} onClose={() => setDel(null)} />}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — category picker + table
// ════════════════════════════════════════════════════════════════════
function DepTxnTypeConfigPage({ onToast, cat: catProp }) {
  const locked = !!catProp;
  const [catKey, setCatKey] = useState(catProp || 'txnslip');
  React.useEffect(() => { if (catProp) setCatKey(catProp); }, [catProp]);
  const cat = ttCat(catKey);
  const addRef = React.useRef(null);

  return (
    <div data-screen-label={locked ? 'หน้าค่าคงที่ประเภทรายการ — ' + cat.label : 'หน้ากำหนดประเภทการทำรายการ'}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {locked ? cat.label + (cat.en ? ` (${cat.en})` : '') : 'กำหนดประเภทการทำรายการ'}
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            {locked ? cat.desc : 'ค้นหาด้วยรหัสหรือชื่อประเภทการทำรายการ แล้วสร้าง / แก้ไข / ลบรหัสได้จากตารางด้านล่าง'}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => addRef.current && addRef.current()}><Icon name="plus" /> สร้างรหัส</button>
      </div>

      {cat.kind === 'txnslip'
        ? <TxnSlipTable onToast={onToast} addRef={addRef} />
        : <GenericConstTable key={cat.key} cat={cat} onToast={onToast} addRef={addRef} />}
    </div>
  );
}

window.depTxnTypeLoad = ttLoad;
// รายการกลุ่มถอน (side −1) ที่เปิดใช้งาน — ใช้เลือก “รายการที่ไม่นับครั้งการถอน”
window.depWithdrawTxnOpts = () => ttLoad().filter(r => r.side === -1 && r.enabled !== false)
  .map(r => ({ v: r.code, l: r.name })).sort((a, b) => a.v.localeCompare(b.v));
// กลุ่มค่าใช้จ่าย — ค่าคงที่ระบบการเงิน (ใช้ใน popup หมวดค่าใช้จ่าย)
window.paCatGroups = function () {
  try { const l = gcLoad(ttCat('expgroup')).filter(g => g.enabled !== false).map(g => g.name).filter(Boolean); if (l.length) return l; } catch (e) {}
  return window.PA_CAT_GROUPS || [];
};

// ─── รหัสรายการสำหรับหน้าฝาก / ถอน / โอน / ปิดบัญชี — ดึงจากกำหนดประเภทการทำรายการ ───
//  แยกประเภทจากกลุ่มเงินฝาก (DEP/WID/CLS) · รหัส TR* = โอนระหว่างบัญชี
//  เงื่อนไขพิเศษ (ต้องกรอกเลขอ้างอิง/ธนาคาร/เคลียริ่ง) คิดจากกลุ่มเงิน
window.dpcCodesFor = function (type) {
  const base = (window.DPC_TXN_CODES || {});
  const legacy = {};
  Object.values(base).forEach(arr => (arr || []).forEach(c => { legacy[c.code] = c; }));
  const typeOf = (r) => {
    const code = String(r.code || '').toUpperCase();
    if (/^TR/.test(code)) return 'transfer';
    if (r.group === 'CLS') return 'close';
    if (r.group === 'DEP') return 'deposit';
    if (r.group === 'WID') return 'withdraw';
    // กลุ่มเงินฝากที่ตั้งเอง (เช่น DTE) — ดูจากรหัสกลุ่ม / ฝั่งรายการ
    const g = String(r.group || '').toUpperCase();
    if (/^TR/.test(g)) return 'transfer';
    if (/^CL/.test(g)) return 'close';
    if (/^D/.test(g)) return 'deposit';
    if (/^W/.test(g)) return 'withdraw';
    return null;
  };
  // คู่บัญชีสำรอง — จากประเภทการทำรายการคู่บัญชี (ตามกลุ่มเงิน)
  const pairByKind = {};
  try { gcLoad(ttCat('txnpair')).forEach(p => { if (p.kind && p.acct && !pairByKind[p.kind]) pairByKind[p.kind] = p.acct; }); } catch (e) {}
  const mtGroup = {};
  try { gcLoad(ttCat('moneytype')).forEach(m => { if (m.code && m.group) mtGroup[m.code] = m.group; }); } catch (e) {}
  const DEF = { deposit: 'DCA', withdraw: 'WCA', close: 'CLA', transfer: 'TRI' };
  const list = ttLoad().filter(r => r.enabled !== false && typeOf(r) === type).map(r => {
    const old = legacy[r.code] || {};
    const k0 = r.kind || old.money || 'CSH';
    const k = mtGroup[k0] || k0;
    const isChq = k === 'CHQ', isTrf = k === 'TRF' || k === 'TBK' || k === 'TRN';
    return {
      code: r.code, label: r.name || old.label || r.code, money: k,
      pair: r.pair || old.pair || pairByKind[k] || (window.DPC_KIND_PAIR || {})[k] || (window.DPC_KIND_PAIR || {}).TRF,
      needRef: old.needRef != null ? old.needRef : (isChq || (isTrf && type === 'deposit')),
      needBank: old.needBank != null ? old.needBank : (isChq && type === 'deposit') || (k === 'TBK'),
      clearing: old.clearing != null ? old.clearing : (isChq && type === 'deposit'),
      backdate: old.backdate || /ย้อนวัน/.test(r.name || ''),
    };
  });
  if (!list.length) return base[type] || [];
  // รหัสเริ่มต้นของเคาน์เตอร์ขึ้นก่อน แล้วเรียงตามรหัส
  return list.sort((a, b) => (a.code === DEF[type] ? -1 : b.code === DEF[type] ? 1 : String(a.code).localeCompare(String(b.code))));
};
window.DPC_KIND_PAIR = { CSH: '111101', TRF: '111201', TBK: '111201', TRN: '111201', CHQ: '111301', DIV: '211301', INT: '511101' };
Object.assign(window, { DepTxnTypeConfigPage });
