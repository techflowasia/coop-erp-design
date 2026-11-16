// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน (Agent Debtor) — ค่าคงที่พื้นฐาน 5 ชุด
//  ─ เปิด-ปิดวัน (day/month/year status per system)
//  ─ ประเภทใบเสร็จ (receipt types)
//  ─ สังกัดตัวแทน (agent affiliations)
//  ─ สาเหตุการยกเลิก (cancellation reasons)
//  ─ ประเภทการชำระ (payment types)
//  ทุกชุดเก็บ/อ่านผ่าน localStorage — แก้ที่นี่มีผลกับทุกเมนูในระบบลูกหนี้ตัวแทน
// ════════════════════════════════════════════════════════════════════

// ─── โรงงานสร้าง store อย่างง่าย (load/save ผ่าน localStorage + seed) ──
window.__agentStore = function (lsKey, seed) {
  return {
    load() {
      try { const s = localStorage.getItem(lsKey); if (s) return JSON.parse(s); } catch (e) {}
      return seed.map(x => ({ ...x }));
    },
    save(list) { try { localStorage.setItem(lsKey, JSON.stringify(list)); } catch (e) {} },
    seed() { return seed.map(x => ({ ...x })); },
  };
};

// ─── 1. เปิด-ปิดวัน ─────────────────────────────────────────────────
//  กำหนดสถานะการทำงานรายระบบ: สถานะวัน / เดือน / ปี ('open' | 'closed')
window.AGENT_DAY_SEED = [
  { id: 'DY-01', sysCode: '01', sysName: 'ระบบทะเบียนสมาชิกและหุ้น', workDate: '2026-07-21', lastWorkDate: '2026-07-18', day: 'open',   month: 'open',   year: 'open' },
  { id: 'DY-02', sysCode: '02', sysName: 'ระบบเงินกู้',              workDate: '2026-07-21', lastWorkDate: '2026-07-18', day: 'open',   month: 'open',   year: 'open' },
  { id: 'DY-03', sysCode: '03', sysName: 'ระบบเงินฝาก',             workDate: '2026-07-21', lastWorkDate: '2026-07-18', day: 'open',   month: 'open',   year: 'open' },
  { id: 'DY-04', sysCode: '04', sysName: 'ระบบลูกหนี้ตัวแทน',        workDate: '2026-07-21', lastWorkDate: '2026-07-18', day: 'open',   month: 'open',   year: 'open' },
  { id: 'DY-05', sysCode: '05', sysName: 'ระบบการเงิน',             workDate: '2026-07-21', lastWorkDate: '2026-07-18', day: 'open',   month: 'closed', year: 'open' },
  { id: 'DY-06', sysCode: '06', sysName: 'ระบบบัญชีแยกประเภท',       workDate: '2026-06-30', lastWorkDate: '2026-06-30', day: 'closed', month: 'closed', year: 'open' },
];
const _agDay = window.__agentStore('coop_agent_day_v1', window.AGENT_DAY_SEED);
window.agentDayLoad = () => _agDay.load();
window.agentDaySave = (l) => _agDay.save(l);
window.agentDaySeed = () => _agDay.seed();

// ─── 2. ประเภทใบเสร็จ ───────────────────────────────────────────────
//  code · desc · sign ('+' รับเข้า / '-' จ่ายออก) · printCode · reportType
window.AGENT_RECEIPT_REPORTS = ['ใบเสร็จรับเงิน', 'ใบรับฝาก', 'ใบสำคัญจ่าย', 'ใบเสร็จ/ใบกำกับภาษี', 'ใบรับเงินชั่วคราว'];
window.AGENT_RECEIPT_TYPE_SEED = [
  { id: 'RT-01', code: '01', desc: 'ค่าหุ้นรายเดือน',        sign: '+', printCode: 'R01', report: 'ใบเสร็จรับเงิน' },
  { id: 'RT-02', code: '02', desc: 'ชำระหนี้เงินกู้',         sign: '+', printCode: 'R01', report: 'ใบเสร็จรับเงิน' },
  { id: 'RT-03', code: '03', desc: 'ดอกเบี้ยเงินกู้',         sign: '+', printCode: 'R01', report: 'ใบเสร็จรับเงิน' },
  { id: 'RT-04', code: '04', desc: 'รับฝากออมทรัพย์ตัวแทน',   sign: '+', printCode: 'R02', report: 'ใบรับฝาก' },
  { id: 'RT-05', code: '05', desc: 'ค่าธรรมเนียมตัวแทน',      sign: '+', printCode: 'R01', report: 'ใบเสร็จ/ใบกำกับภาษี' },
  { id: 'RT-06', code: '06', desc: 'คืนเงินรับเกินให้ตัวแทน',  sign: '-', printCode: 'R03', report: 'ใบสำคัญจ่าย' },
];
const _agRT = window.__agentStore('coop_agent_receipt_type_v1', window.AGENT_RECEIPT_TYPE_SEED);
window.agentReceiptTypeLoad = () => _agRT.load();
window.agentReceiptTypeSave = (l) => _agRT.save(l);
window.agentReceiptTypeSeed = () => _agRT.seed();

// ─── 3. สังกัดตัวแทน ────────────────────────────────────────────────
//  code · name · enabled (เปิด/ปิดการใช้งานได้)
window.AGENT_AFFIL_SEED = [
  { id: 'AA-01', code: '01', name: 'ตัวแทนเขตกรุงเทพฯ และปริมณฑล', enabled: true },
  { id: 'AA-02', code: '02', name: 'ตัวแทนภาคกลาง',              enabled: true },
  { id: 'AA-03', code: '03', name: 'ตัวแทนภาคเหนือ',             enabled: true },
  { id: 'AA-04', code: '04', name: 'ตัวแทนภาคตะวันออกเฉียงเหนือ',  enabled: true },
  { id: 'AA-05', code: '05', name: 'ตัวแทนภาคใต้',               enabled: true },
  { id: 'AA-06', code: '06', name: 'ตัวแทนหน่วยงานราชการ (ยุบรวม)', enabled: false },
];
const _agAF = window.__agentStore('coop_agent_affil_v1', window.AGENT_AFFIL_SEED);
window.agentAffilLoad = () => _agAF.load();
window.agentAffilSave = (l) => _agAF.save(l);
window.agentAffilSeed = () => _agAF.seed();

// ─── 4. สาเหตุการยกเลิก ─────────────────────────────────────────────
//  code · desc
window.AGENT_CANCEL_REASON_SEED = [
  { id: 'CR-01', code: '01', desc: 'ยกเลิกตามคำร้องขอของสมาชิก' },
  { id: 'CR-02', code: '02', desc: 'บันทึกข้อมูลผิดพลาด' },
  { id: 'CR-03', code: '03', desc: 'ชำระซ้ำซ้อน' },
  { id: 'CR-04', code: '04', desc: 'ตัวแทนนำส่งเงินไม่ครบถ้วน' },
  { id: 'CR-05', code: '05', desc: 'ยกเลิกตามคำสั่งเจ้าหน้าที่การเงิน' },
  { id: 'CR-06', code: '06', desc: 'ยกเลิกเพื่อแก้ไขประเภทใบเสร็จ' },
];
const _agCR = window.__agentStore('coop_agent_cancel_reason_v1', window.AGENT_CANCEL_REASON_SEED);
window.agentCancelReasonLoad = () => _agCR.load();
window.agentCancelReasonSave = (l) => _agCR.save(l);
window.agentCancelReasonSeed = () => _agCR.seed();

// ─── 5. ประเภทการชำระ ───────────────────────────────────────────────
//  code · desc (เพิ่ม/ลบ/แก้ไขได้)
window.AGENT_PAYMENT_TYPE_SEED = [
  { id: 'PT-01', code: '01', desc: 'เงินสด' },
  { id: 'PT-02', code: '02', desc: 'เช็ค' },
  { id: 'PT-03', code: '03', desc: 'โอนผ่านธนาคาร' },
  { id: 'PT-04', code: '04', desc: 'หักบัญชีเงินฝากสหกรณ์' },
  { id: 'PT-05', code: '05', desc: 'หักจากเงินปันผล–เฉลี่ยคืน' },
];
const _agPT = window.__agentStore('coop_agent_payment_type_v1', window.AGENT_PAYMENT_TYPE_SEED);
window.agentPaymentTypeLoad = () => _agPT.load();
window.agentPaymentTypeSave = (l) => _agPT.save(l);
window.agentPaymentTypeSeed = () => _agPT.seed();
