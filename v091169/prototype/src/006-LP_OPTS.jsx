// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — ค่าคงที่: ข้อกำหนดประเภทเงินกู้ (ผลิตภัณฑ์เงินกู้)
//  เก็บแต่ละ "ประเภทเงินกู้" เป็นผลิตภัณฑ์ของสหกรณ์ — เปิด/ปิดการใช้งานได้
//  ระบุระยะเวลาโครงการ (เริ่ม–สิ้นสุด) ชัดเจน · แก้ไขย้อนหลังได้
//  และเก็บประวัติการเพิ่ม/แก้ไขทุกครั้งเพื่อการตรวจสอบ
// ════════════════════════════════════════════════════════════════════

// ─── ตัวเลือก Dropdown ของแต่ละฟิลด์ (7 แท็บ) ───────────────────────
window.LP_OPTS = {
  // ── ทั่วไป ──
  loanGroup: [
    { v: 'emergency', l: 'กลุ่มเงินกู้ฉุกเฉิน' },
    { v: 'normal',    l: 'กลุ่มเงินกู้สามัญ' },
    { v: 'special',   l: 'กลุ่มเงินกู้พิเศษ' },
  ],
  salaryRemainType: [
    { v: 'percent', l: 'คิดเป็น % ของเงินเดือน' },
    { v: 'amount',  l: 'คิดเป็นจำนวนเงิน' },
  ],
  // ตรวจเงินเดือนคงเหลือ ไม่ต่ำกว่า — รายการสำเร็จรูป (type/value ใช้คำนวณจริง)
  salaryRemainRule: [
    { v: 'p15',    l: 'ไม่ต่ำกว่า 15%',   check: true,  type: 'percent', value: 15 },
    { v: 'p20',    l: 'ไม่ต่ำกว่า 20%',   check: true,  type: 'percent', value: 20 },
    { v: 'p25',    l: 'ไม่ต่ำกว่า 25%',   check: true,  type: 'percent', value: 25 },
    { v: 'p30',    l: 'ไม่ต่ำกว่า 30%',   check: true,  type: 'percent', value: 30 },
    { v: 'a500',   l: 'ไม่ต่ำกว่า 500 บาท',   check: true, type: 'amount', value: 500 },
    { v: 'a1000',  l: 'ไม่ต่ำกว่า 1,000 บาท', check: true, type: 'amount', value: 1000 },
    { v: 'a1100',  l: 'ไม่ต่ำกว่า 1,100 บาท', check: true, type: 'amount', value: 1100 },
    { v: 'a1500',  l: 'ไม่ต่ำกว่า 1,500 บาท', check: true, type: 'amount', value: 1500 },
    { v: 'c1000b', l: '2.ไม่ต่ำกว่า 1,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 1000 },
    { v: 'c1000a', l: '1.ไม่ต่ำกว่า 1,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 1000 },
    { v: 'c1200b', l: '2.ไม่ต่ำกว่า 1,200 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 1200 },
    { v: 'c1200a', l: '1.ไม่ต่ำกว่า 1,200 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 1200 },
    { v: 'a2000',  l: 'ไม่ต่ำกว่า 2,000 บาท', check: true, type: 'amount', value: 2000 },
    { v: 'a3000',  l: 'ไม่ต่ำกว่า 3,000 บาท', check: true, type: 'amount', value: 3000 },
    { v: 'a3300',  l: 'ไม่ต่ำกว่า 3,300 บาท', check: true, type: 'amount', value: 3300 },
    { v: 'c3000a', l: '1.ไม่ต่ำกว่า 3,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 3000 },
    { v: 'c3000b', l: '2.ไม่ต่ำกว่า 3,000 บาท สมาชิกตั้งแต่ 063225 ไม่ต่ำกว่า30%', check: true, type: 'amount', value: 3000 },
    { v: 'a3500',  l: 'ไม่ต่ำกว่า 3,500 บาท', check: true, type: 'amount', value: 3500 },
    { v: 'none',   l: 'ไม่เช็คเงินเดือนคงเหลือ', check: false, type: 'amount', value: 0 },
  ],
  roundMode: [
    { v: 'up',     l: '1 : ปัดขึ้น' },
    { v: 'down',   l: '2 : ปัดลง' },
    { v: 'none',   l: '0 : ไม่ปัด' },
  ],
  roundPlace: [
    { v: '1',    l: 'หลักหน่วย' },
    { v: '10',   l: 'หลักสิบ' },
    { v: '100',  l: 'หลักร้อย' },
    { v: '1000', l: 'หลักพัน' },
  ],
  specialPayBase: [
    { v: 'balance', l: '1 : B-ยอดคงเหลือ' },
    { v: 'payment', l: '2 : P-ยอดชำระ' },
  ],
  defaultPayType: [
    { v: 'cash',        l: '1 : เงินสด' },
    { v: 'transferDep', l: '2 : เงินโอน–เงินฝาก' },
    { v: 'transferBank',l: '3 : เงินโอน–ธนาคาร' },
    { v: 'cheque',      l: '4 : เช็คธนาคาร' },
  ],
  loanPurpose: [
    { v: 'family',  l: 'ใช้จ่ายในครอบครัวและส่วนตัว' },
    { v: 'edu',     l: 'เพื่อการศึกษา' },
    { v: 'house',   l: 'เพื่อที่อยู่อาศัย' },
    { v: 'debt',    l: 'เพื่อรวมหนี้' },
    { v: 'biz',     l: 'เพื่อการประกอบอาชีพ' },
  ],
  instantApprove: [
    { v: 'no',  l: '0 : ไม่อนุมัติทันที' },
    { v: 'yes', l: '1 : อนุมัติทันที' },
  ],

  // ── วงเงินกู้ ──
  limitGroup: [
    { v: 'g-emer-transfer', l: 'G-เงินกู้ฉุกเฉินโอน' },
    { v: 'g-emer',          l: 'G-เงินกู้ฉุกเฉิน' },
    { v: 'g-normal',        l: 'G-เงินกู้สามัญ' },
    { v: 'g-special',       l: 'G-เงินกู้พิเศษ' },
    { v: 'g-gun',           l: 'G-เงินกู้สามัญปืน' },
    { v: 'g-staff',         l: 'G-เงินกู้พนักงาน' },
    { v: 'g-normal-ctl',    l: 'G-เงินกู้สามัญคุมพิเศษ (ไม่นับรวมสามัญ02)' },
  ],
  limitMethod: [
    { v: '1', l: '1 : ตามหลักประกัน' },
    { v: '2', l: '2 : ตามสิทธิการกู้ (เท่าเงินเดือน/ค่าหุ้น)' },
    { v: '4', l: '3 : คิดจากเงินเดือนคงเหลือ' },
    { v: '5', l: '4 : รวมหนี้เก่าที่หักกลบ' },
    { v: '6', l: '5 : ปันผลเฉลี่ยคืน' },
  ],
  periodRef: [
    { v: '1', l: '1 : งวดหุ้น' },
    { v: '2', l: '2 : อายุการทำงาน' },
    { v: '3', l: '3 : อายุสมาชิก (วันชนวัน)' },
    { v: '4', l: '4 : อายุสมาชิก (งวดสมาชิก)' },
    { v: '5', l: '5 : อายุสมาชิก (งวดนับเดือนแรก)' },
  ],
  memberTypeRight: [
    { v: 'none', l: 'ไม่ระบุ' },
    { v: 'thp', l: 'ปณท.' },
    { v: 'cat', l: 'กสท.' },
    { v: 'nbtc', l: 'กสทช.' },
    { v: 'retire-central', l: 'เกษียณส่วนกลาง' },
    { v: 'retire-region', l: 'เกษียณส่วนภูมิภาค' },
    { v: 'chpt', l: 'ฌปท.' },
    { v: 'coop', l: 'สอ.กสท' },
    { v: 'coop-store', l: 'สหกรณ์ร้านค้า' },
    { v: 'associate', l: 'สมาชิกสมทบ' },
    { v: 'thp-db', l: 'ปณทดบ' },
  ],
  rightMultBase: [
    { v: 'period', l: 'งวด/เดือน' },
    { v: 'shares', l: 'จำนวนหุ้น' },
  ],
  // วิธีกำหนดสิทธิการกู้ (TOR 1.1.2) — ใช้เมื่อ “การกำหนดวงเงินกู้” = ตามสิทธิการกู้
  rightMode: [
    { v: 'salary',   l: 'ตามจำนวนเท่าของเงินเดือน' },
    { v: 'shares',   l: 'ตามค่าหุ้นสะสม' },
    { v: 'both-min', l: 'ทั้งสองเกณฑ์ — เลือกค่าที่ต่ำกว่า' },
    { v: 'both-max', l: 'ทั้งสองเกณฑ์ — เลือกค่าที่สูงกว่า' },
    { v: 'matrix',   l: 'ตารางกำหนดเอง (ขั้นบันได)' },
  ],

  // ── ดอกเบี้ย ──
  interestTierBasis: [
    { v: '1', l: '1 : ยอดอนุมัติ' },
    { v: '2', l: '2 : ยอดคงเหลือ' },
  ],
  interestCalcMode: [
    { v: '1', l: 'คิดเป็นรายวัน' },
  ],
  interestRateForm: [
    { v: '1', l: '1 : อัตราคงที่ตลอดอายุสัญญา' },
    { v: '2', l: '2 : อัตราลอยตัวตามประกาศ' },
    { v: '3', l: '3 : อัตราขั้นบันได' },
  ],
  rateTable: [
    { v: 'INT10', l: 'INT10 — ฉุกเฉิน' },
    { v: 'INT11', l: 'INT11 — สามัญการศึกษาบุตร' },
    { v: 'INT20', l: 'INT20 — สามัญปกติ' },
    { v: 'INT21', l: 'INT21 — สามัญกู้หุ้น' },
    { v: 'INT30', l: 'INT30 — เงินกู้พิเศษ' },
    { v: 'INT14', l: 'INT14 — สามัญซื้ออาวุธปืน' },
    { v: 'INT40', l: 'INT40 — สามัญอุทกภัย' },
    { v: 'INT57', l: 'INT57 — สามัญผู้เกษียณ 90%' },
    { v: 'INT50', l: 'INT50 — สามัญเพิ่มสุข (ปันผล–เฉลี่ยคืน)' },
    { v: 'INT49', l: 'INT49 — สามัญจำเป็น' },
    { v: 'INX49', l: 'INX49 — อัตราพิเศษ 49 (3.50%)' },
  ],
  monthlyInterestCond: [
    { v: '0', l: '0 : ไม่มีช่วงการไม่คิด' },
    { v: '1', l: '1 : ตามวันรับเงินกู้' },
    { v: '2', l: '2 : ตามวันชำระเงินกู้' },
    { v: '3', l: '3 : ตามวันที่กำหนดเอง' },
  ],
  interestStepForm: [
    { v: 'fixed',  l: 'คงที่' },
    { v: 'float',  l: 'ลอยตัว' },
    { v: 'tiered', l: 'ขั้นบันได' },
  ],

  // ── หลักประกัน ──
  guarLimitGroup: [
    { v: 'gr-emer',     l: 'GR — วงเงินค้ำฉุกเฉิน' },
    { v: 'gr-debt',     l: 'GR — วงเงินค้ำสามัญรวมหนี้' },
    { v: 'gr-35',       l: 'GR — วงเงินค้ำสามัญ 35 เท่า' },
    { v: 'gr-gun',      l: 'GR — วงเงินค้ำสามัญปืน' },
    { v: 'gr-60',       l: 'GR — วงเงินค้ำสามัญ 60 เท่า' },
    { v: 'gr-flood',    l: 'GR — วงเงินค้ำสามัญอุทกภัย' },
    { v: 'gr-multi',    l: 'GR — วงเงินค้ำสามัญอเนกประสงค์' },
    { v: 'gr-edu',      l: 'GR — วงเงินค้ำสามัญเพื่อการศึกษา' },
    { v: 'gr-atm',      l: 'GR — วงเงินค้ำฉุกเฉิน ATM' },
  ],
  guarCountMode: [
    { v: '0', l: '0 : ค้ำไม่จำกัดจำนวนเงิน' },
    { v: '1', l: '1 : ค้ำตามเงินเดือน' },
    { v: '2', l: '2 : ค้ำตามเงินเดือน เฉพาะผู้ลาออก กสล.' },
  ],
  guarPersonGroup: [
    { v: '01', l: '01-GM — จำนวนคนค้ำฉุกเฉิน' },
    { v: '02', l: '02-GM — จำนวนคนค้ำสามัญ' },
    { v: '03', l: '03-GM — จำนวนคนค้ำสามัญโครงการ' },
    { v: '04', l: '04-GM — จำนวนคนค้ำสามัญปืน' },
    { v: '05', l: '05-GM — จำนวนคนค้ำสามัญคุณภาพชีวิต' },
    { v: '09', l: '09-GM — จำนวนคนค้ำสามัญเพื่อการศึกษา' },
    { v: '10', l: '10-GM — จำนวนคนค้ำฉุกเฉิน ATM' },
  ],
  guarPersonCountMode: [
    { v: '0', l: '0 : ไม่นับรวมเป็นค้ำ' },
    { v: '1', l: '1 : นับรวมไปกับกลุ่มเงินกู้' },
    { v: '2', l: '2 : นับเฉพาะประเภทเงินกู้นี้' },
    { v: '3', l: '3 : สามัญ 50 เท่า + 50 เท่าผ่อนผัน' },
    { v: '5', l: '5 : สามัญ 50 เท่า (ผสม)' },
  ],
  useShareReduceGuar: [
    { v: '0', l: '0 : ไม่เอาหุ้นผู้กู้มาหักยอดค้ำ' },
    { v: '1', l: '1 : เอาหุ้นกู้หักยอดค้ำเสมอ' },
    { v: '2', l: '2 : เฉพาะผู้กู้ กสล. จึงหักยอดค้ำ' },
  ],
  loanInsurance: [
    { v: '0', l: '0 : ไม่บังคับทำประกัน' },
    { v: '1', l: '1 : บังคับทำประกัน' },
    { v: '2', l: '2 : ภาคสมัครใจ' },
  ],
  guarMemberType: [
    { v: 'all',    l: 'ค้ำได้ทุกประเภท' },
    { v: 'none',   l: 'ไม่ตรวจคนค้ำ' },
    { v: 'byType', l: 'ค้ำตามประเภท' },
  ],
  // ใช้หุ้นค้ำหรือไม่ (ตารางกำหนดหุ้น/บุคคลที่ใช้ค้ำประกัน)
  useShareGuar: [
    { v: '0', l: '0 : ไม่ใช้หุ้นค้ำ' },
    { v: '1', l: '1 : ใช้หุ้นค้ำ' },
  ],
  // ประเภทสมาชิกที่ค้ำได้
  guarPersonAllowType: [
    { v: '0', l: '0 : ไม่ตรวจคนค้ำ' },
    { v: '1', l: '1 : ค้ำได้ทุกประเภท' },
    { v: '2', l: '2 : ค้ำตามประเภท' },
  ],
  // มูลค่าหลักประกันที่ใช้ค้ำได้ — กลุ่มหลักประกัน
  collateralGroup: [
    { v: '01', l: '01 : คนค้ำประกัน' },
    { v: '02', l: '02 : หุ้นค้ำประกัน' },
    { v: '03', l: '03 : เงินฝากค้ำประกัน' },
    { v: '04', l: '04 : หลักทรัพย์ค้ำประกัน' },
    { v: '05', l: '05 : พันธบัตร' },
  ],
  // มูลค่าหลักประกันที่ใช้ค้ำได้ — หลักทรัพย์ (สัมพันธ์กับกลุ่ม — ดูอย่างเดียว)
  collateralAsset: [
    { v: 'คนค้ำประกัน',        l: 'คนค้ำประกัน' },
    { v: 'หุ้นค้ำประกัน',       l: 'หุ้นค้ำประกัน' },
    { v: 'เงินฝากค้ำประกัน',    l: 'เงินฝากค้ำประกัน' },
    { v: 'หลักทรัพย์ค้ำประกัน', l: 'หลักทรัพย์ค้ำประกัน' },
    { v: 'พันธบัตร',           l: 'พันธบัตร' },
  ],
  // ประเภทหลักทรัพย์ (ใช้เมื่อกลุ่ม = 04 หลักทรัพย์ค้ำประกัน)
  collateralSecurityType: [
    { v: '01', l: '01 โฉนด' },
    { v: '02', l: '02 นส3' },
    { v: '03', l: '03 นส3ก' },
    { v: '04', l: '04 นส3ข' },
    { v: '05', l: '05 ห้องชุด' },
    { v: '06', l: '06 สิ่งปลูกสร้าง' },
    { v: '07', l: '07 ที่ราชพัสดุ' },
    { v: '08', l: '08 โฉนดตราจอง' },
  ],

  // ── หักชำระ ──
  minShareCompare: [
    { v: '0', l: '0 : ไม่ตรวจสอบ' },
    { v: '1', l: '1 : ยอดขอกู้' },
    { v: '2', l: '2 : ยอดหนี้ทั้งหมด' },
    { v: '3', l: '3 : ยอดกลุ่มเงินกู้' },
  ],
  prepayInterest: [
    { v: '0', l: '0 : ไม่คิดดอกเบี้ยล่วงหน้า' },
    { v: '1', l: '1 : คิดดอกเบี้ยล่วงหน้า' },
  ],
  offsetPaidType: [
    { v: 'period', l: 'งวด' },
    { v: 'percent',l: '%' },
  ],
  offsetAction: [
    { v: '0', l: '0 : ไม่หักกลบ' },
    { v: '1', l: '1 : หักกลบ (บล็อก)' },
    { v: '2', l: '2 : หักกลบ (เตือน)' },
  ],

  // ── งวดชำระ ──
  repayMode: [
    { v: '1', l: '1 : ต้นเท่ากันทุกงวด + ดอก' },
    { v: '2', l: '2 : ต้น + ดอก เท่ากันทุกงวด' },
    { v: '3', l: '3 : ต้น + ดอก ขั้นบันได' },
    { v: '4', l: '4 : บอลลูน (งวดท้ายก้อนใหญ่)' },
  ],
  balloonBase: [
    { v: 'amount',  l: 'ระบุเป็นจำนวนเงิน (บาท)' },
    { v: 'percent', l: 'ระบุเป็น % ของเงินต้น' },
  ],
  periodCalc: [
    { v: '0', l: '0 : คำนวณงวดปกติ' },
    { v: '1', l: '1 : กำหนดงวดเอง' },
    { v: '2', l: '2 : ผ่อนชำระขั้นต่ำ' },
    { v: '4', l: '3 : งดต้น งดดอกเบี้ย' },
    { v: '5', l: '4 : ไม่ผ่อนรายเดือน (ชำระจากปันผล/เฉลี่ยคืน)' },
  ],
  lastInstallment: [
    { v: '0', l: '0 : จำนวนเงินที่เหลือ' },
    { v: '1', l: '1 : เท่ากับทุกงวด' },
  ],
  extendHelper: [
    { v: '0', l: '0 : ไม่ใช้ตัวช่วย' },
    { v: '1', l: '1 : คำนวณหัก 100% หุ้น' },
    { v: '2', l: '2 : หักหุ้นตาม % หลักทรัพย์' },
    { v: '3', l: '3 : คำนวณหักเงินเดือน 10 เท่า' },
  ],
  collateralType: [
    { v: '01', l: '01 : คนค้ำประกัน' },
    { v: '02', l: '02 : หุ้นค้ำประกัน' },
    { v: '03', l: '03 : เงินฝากค้ำประกัน' },
    { v: '04', l: '04 : หลักทรัพย์ค้ำประกัน' },
    { v: '05', l: '05 : พันธบัตร' },
  ],
  pvdCheck: [
    { v: '-1', l: '-1 : ไม่ตรวจกองทุน' },
    { v: '0',  l: '0 : ตรวจ–ต้องเป็นสมาชิก กสล.' },
    { v: '1',  l: '1 : ตรวจ–ไม่เป็นสมาชิก กสล.' },
  ],

  // ── ผู้มีสิทธิกู้ (ประเภทสมาชิก — อิงตามหน้าเพิ่มสมาชิกใหม่) ──
  memberEligType: [
    { v: 'regular',         l: 'สมาชิกสามัญ' },
    { v: 'associate-staff', l: 'สมาชิกสมทบ (พนักงาน)' },
    { v: 'associate-kin',   l: 'สมาชิกสมทบ (เครือญาติ)' },
  ],

  // ── ดอกเบี้ยเงินเตือน / เกณฑ์พิจารณา ──
  warnBasis: [
    { v: 'percent', l: 'ตามเปอร์เซ็นต์ (%)' },
    { v: 'balance', l: 'ตามยอดคงเหลือ (บาท)' },
  ],

  // ── ผลิตภัณฑ์ไม่ผ่อนรายเดือน (ชำระจากปันผล/เฉลี่ยคืน) ──
  dividendRepayBase: [
    { v: 'dividend', l: 'เงินปันผลประจำปี' },
    { v: 'rebate',   l: 'เงินเฉลี่ยคืน' },
    { v: 'both',     l: 'ปันผล + เฉลี่ยคืน' },
  ],
};

// หา "ตัวเลือกตรวจเงินเดือนคงเหลือ" ที่ตรงกับค่าที่บันทึกไว้ (รองรับข้อมูลเก่าที่ยังไม่มี salaryRemainRule)
window.lpSalaryRemainRuleOf = (s) => {
  const opts = window.LP_OPTS.salaryRemainRule;
  if (s.salaryRemainRule && opts.some(o => o.v === s.salaryRemainRule)) return s.salaryRemainRule;
  if (!s.checkSalaryRemain) return 'none';
  const hit = opts.find(o => o.check && o.type === s.salaryRemainType && Number(o.value) === Number(s.salaryRemainValue));
  return hit ? hit.v : 'none';
};
// เลือกตัวเลือกแล้ว → อัปเดตค่าที่ใช้คำนวณจริง
window.lpApplySalaryRemainRule = (s, v) => {
  const o = window.LP_OPTS.salaryRemainRule.find(x => x.v === v);
  if (!o) return s;
  return { ...s, salaryRemainRule: v, checkSalaryRemain: !!o.check, salaryRemainType: o.type, salaryRemainValue: o.value };
};

// ═════════════════════════════════════════════════════════════════════
//  รายการเงื่อนไข “เงินเดือนคงเหลือ ไม่ต่ำกว่า” — master list ใช้ร่วมทุกประเภท
// ═════════════════════════════════════════════════════════════════════
(function () {
  try {
    const saved = localStorage.getItem('salary_remain_rules');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length) window.LP_OPTS.salaryRemainRule = arr.filter(o => o.l !== 'เลิกใช้');
    }
  } catch (e) {}
})();
window.lpSalaryRules = () => window.LP_OPTS.salaryRemainRule;
window.lpSalaryRulesSave = (list) => {
  window.LP_OPTS.salaryRemainRule = list;
  try { localStorage.setItem('salary_remain_rules', JSON.stringify(list)); } catch (e) {}
};
// ตัวเลือกใน dropdown ประเภทเงินกู้ — เฉพาะที่เปิดใช้งาน (คงค่าที่เลือกไว้เดิมแม้ถูกปิด)
window.lpSalaryRuleOptions = (cur) => window.lpSalaryRules().filter(o => o.enabled !== false || o.v === cur);
// หาค่าขั้นต่ำที่มีผลจริงจากเงื่อนไข — เลือกชุดตามช่วงเลขสมาชิกก่อน แล้วจึงใช้ชุด “ไม่กำหนดช่วงสมาชิก”
window.lpSalaryRemainResolve = (s, memberCode) => {
  const rule = s && s.salaryRemainRule && window.lpSalaryRules().find(o => o.v === s.salaryRemainRule);
  if (!rule) return { check: !!(s && s.checkSalaryRemain), type: s && s.salaryRemainType, value: Number(s && s.salaryRemainValue) || 0 };
  if (rule.check === false) return { check: false, type: 'amount', value: 0 };
  const sets = rule.sets && rule.sets.length ? rule.sets : [{ noRange: true, type: rule.type, value: rule.value }];
  const no = parseInt(String(memberCode || '').replace(/\D/g, ''), 10);
  // ก-03 — ไม่ตรงชุดใด และไม่มีชุด “ไม่กำหนดช่วงสมาชิก” → ไม่ตรวจ (ไม่ใช้ชุดแรกแทน)
  const hit = (!isNaN(no) && sets.find(x => !x.noRange && no >= Number(x.from) && no <= Number(x.to)))
    || sets.find(x => x.noRange);
  if (!hit) return { check: false, type: 'amount', value: 0, label: rule.l, noMatch: true };
  return { check: true, type: hit.type, value: Number(hit.value) || 0, cap: Number(hit.cap) || 0, label: rule.l };
};
// ข้อความสรุปชุดของเงื่อนไข (ก-07) — แสดงอย่างเดียว ไม่บันทึกเก็บ
window.lpSalaryRuleSummary = (v) => {
  const rule = window.lpSalaryRules().find(o => o.v === v);
  if (!rule || rule.check === false) return '';
  const sets = rule.sets && rule.sets.length ? rule.sets : [{ noRange: true, type: rule.type, value: rule.value }];
  const n = (x, d) => fmt.money(Number(x) || 0, d).replace(/\.00$/, '');
  return sets.map(x => (x.noRange ? 'ทุกคน' : x.from + '–' + x.to) + ' ≥ ' + (
    x.type === 'percent' ? n(x.value, 2) + '% ของรายรับรวม'
    : x.type === 'min' ? n(x.value, 2) + '% ของรายรับรวม หรือ ' + n(x.cap, 0) + ' บาท แล้วแต่จำนวนใดน้อยกว่า'
    : n(x.value, 0) + ' บาท')).join(' · ');
};
// ประเภทเงินกู้ที่ใช้เงื่อนไขนี้อยู่ — ใช้กันลบ
window.lpSalaryRuleUsedBy = (v) => {
  if (!v) return [];
  // ก-06 — ค้นจากทะเบียนประเภทเงินกู้ทั้งหมด (ที่บันทึกไว้ + ข้อมูลตั้งต้นที่ยังไม่เคยบันทึก) — ทุกประเภทที่ยังไม่ถูกลบ ทุกสถานะ
  //  นับทั้งค่าที่เลือกไว้ตรง (salaryRemainRule) และค่าที่จับคู่ได้จากข้อมูลเก่า (ชนิด + ค่า)
  let saved = null;
  try { const s = localStorage.getItem('loan_types'); if (s) saved = JSON.parse(s); } catch (e) {}
  const seed = window.LP_SEED || [];
  const list = Array.isArray(saved) ? [...saved, ...seed.filter(p => !saved.some(x => x.id === p.id))] : seed;
  const uses = (p) => {
    const s = p.settings || {};
    return s.salaryRemainRule === v || window.lpSalaryRemainRuleOf(s) === v;
  };
  return list.filter(p => p && !p.deleted && uses(p)).map(p => p.code + ' — ' + p.name);
};

// ─── ค่าคงที่ที่ประเภทเงินกู้เลือกใช้อยู่ — ปิดใช้งานไม่ได้ (ข-02 · ข-03 · ข-04 · ข-05) ───
//  นับทุกประเภทเงินกู้ที่ยังไม่ถูกลบ ทุกสถานะ · ประเภทที่ปิดอยู่ต่อท้าย “(ปิดใช้งาน)”
window.lpTypesAll = () => {
  let list = [];
  try { const s = localStorage.getItem('loan_types'); list = s ? JSON.parse(s) : (window.LP_SEED || []); }
  catch (e) { list = window.LP_SEED || []; }
  return list.filter(p => !p.deleted);
};
window.lpTypesUsing = (pred, opts) => window.lpTypesAll()
  .filter(p => pred(p.settings || {}, p))
  .map(p => p.code + ' — ' + p.name + (p.enabled === false && !(opts && opts.noOffTag) ? ' (ปิดใช้งาน)' : ''));
const lpNormName = (s) => String(s || '').replace(/[\s\-—–·]/g, '').toLowerCase();
// กลุ่มการค้ำ (เมนูกำหนดวงเงินค้ำประกัน) ↔ ค่าใน dropdown “กลุ่มสิทธิวงเงินการค้ำ”
window.lpGuarLimitKeyOf = (gg) => {
  const o = (window.LP_OPTS.guarLimitGroup || []).find(x => lpNormName(x.l) === lpNormName(gg.name) || x.v === gg.code);
  return o ? o.v : gg.code;
};

// แปลงค่า → label สำหรับแสดงผลในโหมดดู
window.lpLabel = (group, value) => {
  const o = (window.LP_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};

// ════════════════════════════════════════════════════════════════════
//  สิทธิการกู้ (TOR 1.1.2) — helper คำนวณเพดานสิทธิรายบุคคล
//  ใช้ร่วมกันระหว่างหน้าตั้งค่า (preview) และเครื่องคำนวณใบคำขอกู้ (lrCalc)
// ════════════════════════════════════════════════════════════════════
// โหมดสิทธิที่มีผลจริง — เผื่อเรกคอร์ดเก่าที่ยังไม่มี rightMode
window.lpRightMode = (s, product) => {
  if (s && s.rightMode) return s.rightMode;
  if (s && s.limitMethod === '2' && product && (product.limitRights || []).length) return 'matrix';
  return 'salary';
};
// คำนวณสิทธิจากเงินเดือน/ค่าหุ้น ตามโหมด salary|shares|both-min|both-max
//  คืน { value, parts:[{ k, v, bind }] }  หรือ null ถ้าโหมดเป็น matrix (คิดจากตารางแยก)
window.lpComputeRight = (s, salary, shareCapital) => {
  const mode = (s && s.rightMode) || 'salary';
  const cap = (v, c) => (Number(c) > 0 ? Math.min(v, Number(c)) : v);
  const salaryV = cap((Number(s.rightSalaryMult) || 0) * (Number(salary) || 0), s.rightSalaryCap);
  const shareV  = cap((Number(s.rightShareMult)  || 0) * (Number(shareCapital) || 0), s.rightShareCap);
  if (mode === 'salary') return { value: salaryV, parts: [{ k: `${fmt.money(Number(s.rightSalaryMult) || 0, 0)}× เงินเดือน`, v: salaryV, bind: true }] };
  if (mode === 'shares') return { value: shareV,  parts: [{ k: `${fmt.money(Number(s.rightShareMult) || 0, 0)}× ค่าหุ้นสะสม`, v: shareV, bind: true }] };
  if (mode === 'both-min' || mode === 'both-max') {
    const value = mode === 'both-min' ? Math.min(salaryV, shareV) : Math.max(salaryV, shareV);
    return { value, parts: [
      { k: `${fmt.money(Number(s.rightSalaryMult) || 0, 0)}× เงินเดือน`, v: salaryV, bind: salaryV === value },
      { k: `${fmt.money(Number(s.rightShareMult) || 0, 0)}× ค่าหุ้นสะสม`, v: shareV, bind: shareV === value },
    ] };
  }
  return null; // matrix
};
// ป้ายสั้นของโหมด ใช้ในรายการ breakdown
window.lpRightModeShort = (mode) => ({
  salary: 'สิทธิตามเท่าของเงินเดือน', shares: 'สิทธิตามค่าหุ้นสะสม',
  'both-min': 'สิทธิ (เงินเดือน/หุ้น — ต่ำสุด)', 'both-max': 'สิทธิ (เงินเดือน/หุ้น — สูงสุด)',
  matrix: 'สิทธิตามตารางกำหนดเอง',
}[mode] || 'สิทธิการกู้');

// ─── ค่าตั้งต้น (ใช้เมื่อสร้างผลิตภัณฑ์ใหม่จากค่าเริ่มต้น) ────────────
window.LP_SETTINGS_DEFAULTS = {
  // ทั่วไป — เอกสารประกอบสัญญา
  interestCertSupported: false,
  // ทั่วไป — การตรวจสอบ
  retiredCanLoan: false,
  minMembershipMonths: 1,
  checkSalaryRemain: true,
  salaryRemainType: 'amount',
  salaryRemainValue: 3300,
  salaryRemainRule: 'a3300',
  isOD: false,
  contractMonths: 0,   // 0 = ไม่จำกัดอายุสัญญา
  warnDays: 30,
  // ทั่วไป — การปัดเศษ
  roundLoanMode: 'up',
  roundLoanFactor: '10',
  roundPayMode: 'up',
  roundPayFactor: '100',
  specialPayBase: 'balance',
  // ทั่วไป — อื่นๆ
  contractRefCode: 'CONTNO00',
  defaultPayType: 'cash',
  defaultPurpose: 'family',
  instantApprove: 'no',
  maxContracts: 0,

  // วงเงินกู้
  limitGroup: 'g-normal',
  maxLoanAmount: 1000000.00,
  limitMethod: '2',
  periodRef: '4',
  limitNotExceedGroup: true,
  limitGroupExcludePending: false,
  limitNotExceedShares: false,
  showRightAtRequest: true,
  limitCalcBasis: 'remaining',
  // สิทธิการกู้ (TOR 1.1.2) — กำหนดเป็นค่าตั้งระบบให้ชัดเจน
  rightMode: 'salary',        // salary | shares | both-min | both-max | matrix
  rightSalaryMult: 60,        // จำนวนเท่าของเงินเดือน
  rightSalaryCap: 0,          // เพดานบาท (0 = ไม่จำกัด นอกเหนือวงเงินสูงสุดผลิตภัณฑ์)
  rightShareMult: 5,          // จำนวนเท่าของค่าหุ้นสะสม
  rightShareCap: 0,           // เพดานบาท (0 = ไม่จำกัด)
  rightRefDoc: '',            // อ้างอิงระเบียบ/ประกาศ (เลขที่)
  rightRefDate: '',           // วันที่ประกาศมีผล

  // ดอกเบี้ย
  interestTierBasis: '1',
  interestCalcMode: '1',
  interestRateForm: '1',
  rateTable: 'INT20',
  fullLimitLoan: false,   // ให้กู้จนเต็มวงเงิน
  recvCondition: '0',
  recvDays: 0,
  recvHalfCondition: '0',
  recvHalfDays: 0,
  payCondition: '0',
  payDays: 0,
  payHalfCondition: '0',
  payHalfDays: 0,

  // หลักประกัน — checkbox
  needCollateral: true,
  allowPersonGuar: true,
  lockShareIfPerson: true,
  checkShareLock: false,
  checkGuarRetire: true,
  pvdInsuranceGuar: false,
  notExceedShareValue: false,
  countTransferAsGuar: true,
  countResignAsGuar: true,
  countDebtAckAsGuar: false,
  // จำนวนสัญญาสูงสุดที่สมาชิก 1 คนค้ำผลิตภัณฑ์นี้ได้ (ค่าคงที่สิทธิค้ำต่อคน)
  maxGuarPerPerson: 2,
  // หลักประกัน — เมนู
  guarLimitGroup: 'gr-35',
  guarCountMode: '1',
  guarPersonGroup: '02',
  guarPersonCountMode: '1',
  useShareReduceGuar: '0',
  loanInsurance: '1',
  loanInsuranceMinAmount: 300000,
  escapeDebtInsurance: '0',
  escapeDebtInsuranceMinAmount: 0,

  // หักชำระ
  offsetFirstOnly: true,
  offsetCancelWorksheet: false,
  minShareCompare: '0',
  prepayInterestOnOffset: '0',

  // งวดชำระ
  repayMode: '2',
  periodCalc: '0',
  minPayment: 0,
  lastInstallment: '0',
  // งวดบอลลูน (ใช้เมื่อ repayMode = 4) — งวดสุดท้ายเป็นก้อนใหญ่
  balloonBase: 'amount',
  balloonValue: 0,
  extendHelper: '0',
  postRetirePeriods: 0,
  waivePrincipalIfIncomplete: false,
  checkPVDOnCalc: false,

  // ผู้มีสิทธิกู้ (ประเภทสมาชิกที่กู้ผลิตภัณฑ์นี้ได้)
  eligibleMemberTypes: ['regular'],

  // จำนวนครั้งในการกู้ — ระดับผลิตภัณฑ์ (0 = ไม่จำกัด)
  maxTimesPerYear: 0,
  maxTimesTotal: 0,
  // จำนวนครั้งในการกู้ — ระดับกลุ่มเงินกู้ (นับรวมทุกผลิตภัณฑ์ในกลุ่มเดียวกัน, 0 = ไม่จำกัด)
  maxTimesPerYearGroup: 0,
  maxTimesTotalGroup: 0,

  // วงเงินกู้สมาชิกใกล้เกษียณ
  nearRetireLimitOn: false,
  nearRetireMonths: 12,
  nearRetireSalaryMult: 0,
  nearRetireMaxAmount: 0,

  // ดอกเบี้ยเงินเตือน / เกณฑ์พิจารณากู้
  penaltyInterestOn: false,
  penaltyInterestRate: 0,
  warnBasis: 'percent',
  warnThreshold: 0,

  // ผลิตภัณฑ์ไม่ผ่อนชำระรายเดือน (ชำระจากเงินปันผล/เฉลี่ยคืน)
  noMonthlyInstallment: false,
  dividendRepayBase: 'both',
  accrueInterestMonthly: true,   // สะสมดอกเบี้ยรายเดือนจนถึงรอบจ่าย
  interestOnlyAllowed: false,    // จ่ายเฉพาะดอกเบี้ยได้ (ไม่ต้องจ่ายต้น)
  checkRebateHistory: true,      // ตรวจยอดเฉลี่ยคืนย้อนหลัง
  rebatePayPercent: 100,         // % การจ่ายจากยอดปันผล/เฉลี่ยคืน
};

// ─── ตารางย่อยตั้งต้น (ว่าง) ─────────────────────────────────────────
window.LP_TABLE_DEFAULTS = () => ({
  limitRights: [],       // วงเงินกู้ — สิทธิแบบกำหนดเอง (matrix)
  limitCollateral: [],   // วงเงินกู้ — สิทธิจากหลักประกัน (ทุนเรือนหุ้น/เงินฝาก/หลักทรัพย์)
  interestTiers: [],     // ดอกเบี้ย — การคิดตามช่วงเวลา
  guaranteeRules: [],    // หลักประกัน — กำหนดหุ้น/บุคคลที่ใช้ค้ำประกัน
  collateralValues: [],  // หลักประกัน — % การค้ำได้
  offsetLoans: [],       // หักชำระ — เงินกู้ที่ต้องหักกลบ
  banLoans: [],          // หักชำระ — เงินกู้ที่ห้ามกู้
  installmentLimits: [], // งวดชำระ — จำนวนงวดสูงสุด
  banRules: [],          // จำกัดกู้ — ห้ามกู้
  reduceRules: [],       // จำกัดกู้ — ลดสิทธิ์
  docRequirements: [],   // เอกสารประกอบ — รายการประเภทเอกสารสำหรับใบคำขอกู้
});

// ─── แม่แบบ (Template) ตั้งต้น — ชุดค่าคงที่ที่บันทึกไว้ใช้ซ้ำได้ ──────
//  ใช้เป็นจุดเริ่มต้นตอนสร้างผลิตภัณฑ์ใหม่ (เลือกใน “เริ่มจาก”)
window.LP_TEMPLATE_SEED = [
  {
    id: 'TPL-RET', name: 'แม่แบบ: สมาชิกใกล้เกษียณ', createdBy: 'ประภาส ทองสุข', createdDate: '2025-01-10',
    note: 'จำกัดวงเงินและงวดสำหรับสมาชิกที่เหลือเวลาก่อนเกษียณไม่เกิน 24 เดือน',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      eligibleMemberTypes: ['regular'],
      nearRetireLimitOn: true, nearRetireMonths: 24, nearRetireSalaryMult: 30, nearRetireMaxAmount: 800000,
      rateTable: 'INT57', postRetirePeriods: 12, repayMode: '2',
    },
    tables: window.LP_TABLE_DEFAULTS(),
  },
  {
    id: 'TPL-DIV', name: 'แม่แบบ: ชำระจากปันผล (ไม่ผ่อนรายเดือน)', createdBy: 'ประภาส ทองสุข', createdDate: '2025-01-10',
    note: 'ผลิตภัณฑ์ที่ไม่ต้องผ่อนรายเดือน — ตัดชำระจากเงินปันผล/เฉลี่ยคืนประจำปี',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      limitMethod: '6', rateTable: 'INT50',
      noMonthlyInstallment: true, dividendRepayBase: 'both',
      accrueInterestMonthly: true, interestOnlyAllowed: true,
      checkRebateHistory: true, rebatePayPercent: 80,
    },
    tables: window.LP_TABLE_DEFAULTS(),
  },
];

// ─── ผลิตภัณฑ์ตัวอย่าง (master list) ─────────────────────────────────
window.LP_SEED = [
  {
    id: 'LP-10',
    code: '10', name: 'ฉุกเฉินเงินสด', abbr: 'ฉฉ', group: 'emergency',
    enabled: true,
    packageStart: '2024-10-01', packageEnd: null,
    createdDate: '2024-09-20', createdBy: 'ประภาส ทองสุข',
    note: 'เงินกู้ฉุกเฉินรับเป็นเงินสด อนุมัติทันทีหน้าเคาน์เตอร์',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      group: 'emergency', loanGroup: 'emergency',
      maxLoanAmount: 50000.00, limitGroup: 'g-emer', limitMethod: '4',
      instantApprove: 'yes', maxContracts: 1, rateTable: 'INT10',
      needCollateral: false, allowPersonGuar: false, loanInsurance: '0',
      repayMode: '1', roundLoanFactor: '100',
    },
    ...window.LP_TABLE_DEFAULTS(),
    installmentLimits: [
      { loanFrom: 0, loanTo: 50000, ageFrom: 0, ageTo: 720, pvd: '-1', maxPeriods: 12, notExceedRetire: true, purpose: 'ฉุกเฉินทั่วไป' },
    ],
    history: [
      { ts: '2025-11-12T10:24:00', user: 'จันทร์เพ็ญ มาลี', action: 'update', effective: '2025-11-01',
        summary: 'ปรับเพดานวงเงินฉุกเฉินจาก 40,000 เป็น 50,000 บาท',
        changes: [{ field: 'วงเงินกู้สูงสุด', before: '40,000.00', after: '50,000.00' }] },
      { ts: '2024-09-20T09:00:00', user: 'ประภาส ทองสุข', action: 'create', effective: '2024-10-01',
        summary: 'สร้างผลิตภัณฑ์เงินกู้ฉุกเฉินเงินสด',
        changes: [{ field: 'รหัสเงิน', before: '—', after: '10' }, { field: 'ชื่อเงิน', before: '—', after: 'ฉุกเฉินเงินสด' }] },
    ],
  },
  {
    id: 'LP-20',
    code: '20', name: 'สามัญปกติ', abbr: 'สป', group: 'normal',
    enabled: true,
    packageStart: '2024-10-01', packageEnd: null,
    createdDate: '2024-09-22', createdBy: 'ประภาส ทองสุข',
    note: 'เงินกู้สามัญหลัก 60 เท่าของเงินเดือน ใช้คนค้ำ/หุ้นค้ำ',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      group: 'normal', loanGroup: 'normal',
      maxLoanAmount: 3000000.00, limitGroup: 'g-normal', limitMethod: '2',
      rightMode: 'matrix',
      rateTable: 'INT20', maxContracts: 2, postRetirePeriods: 0,
    },
    ...window.LP_TABLE_DEFAULTS(),
    interestTiers: [
      { dueType: 'day', monthFrom: 1,  monthTo: 60,    form: 'float', fixedRate: 0, rateTable: 'INT20', adjust: -0.5 },
      { dueType: 'day', monthFrom: 61, monthTo: 99999, form: 'float', fixedRate: 0, rateTable: 'INT20', adjust: 0 },
    ],
    limitRights: [
      { memberType: 'none', monthFrom: 1, monthTo: 12, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 50000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 12, monthTo: 24, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 100000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 24, monthTo: 36, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 200000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 36, monthTo: 48, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 300000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 48, monthTo: 60, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 400000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 60, monthTo: 9999, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 500000, memberFrom: '053612', memberTo: '999999' },
      { memberType: 'none', monthFrom: 1, monthTo: 9999, shareFrom: 0, shareTo: 999999999, salaryFrom: 0, salaryTo: 9999999, mult: 12, multBase: 'period', maxAmount: 1000000, memberFrom: '000001', memberTo: '053611' },
    ],
    guaranteeRules: [
      { loanFrom: 0,       loanTo: 500000,  useShare: '1', allowType: '1', count: 2, normal: 1, cond: 1, assoc: 0 },
      { loanFrom: 500000,  loanTo: 1500000, useShare: '1', allowType: '1', count: 4, normal: 2, cond: 2, assoc: 1 },
      { loanFrom: 1500000, loanTo: 9999999, useShare: '1', allowType: '2', count: 5, normal: 3, cond: 2, assoc: 1 },
    ],
    collateralValues: [
      { group: '03', type: 'D', name: 'เงินฝากค้ำประกัน', percent: 100.00 },
      { group: '02', type: 'S', name: 'หุ้นค้ำประกัน',    percent: 90.00 },
      { group: '01', type: 'P', name: 'คนค้ำประกัน',      percent: 100.00 },
    ],
    installmentLimits: [
      { loanFrom: 0, loanTo: 1000000, ageFrom: 0, ageTo: 660, pvd: '-1', maxPeriods: 180, notExceedRetire: true, purpose: '' },
      { loanFrom: 1000000, loanTo: 3000000, ageFrom: 0, ageTo: 660, pvd: '-1', maxPeriods: 240, notExceedRetire: true, purpose: '' },
    ],
    banRules: [
      { loanType: '27 — สามัญเพื่อการรวมหนี้', minPeriods: 6 },
    ],
    history: [
      { ts: '2025-10-02T14:10:00', user: 'จันทร์เพ็ญ มาลี', action: 'update', effective: '2025-10-01',
        summary: 'ปรับสิทธิการกู้สูงสุดเป็น 60 เท่าตามมติ คกก. ชุดที่ 28',
        changes: [{ field: 'สิทธิการกู้ (เท่า)', before: '50', after: '60' }] },
      { ts: '2024-09-22T09:30:00', user: 'ประภาส ทองสุข', action: 'create', effective: '2024-10-01',
        summary: 'สร้างผลิตภัณฑ์เงินกู้สามัญปกติ',
        changes: [{ field: 'รหัสเงิน', before: '—', after: '20' }] },
    ],
  },
  {
    id: 'LP-30',
    code: '30', name: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', abbr: 'พศ', group: 'special',
    enabled: true,
    packageStart: '2025-01-01', packageEnd: '2027-12-31',
    createdDate: '2024-12-15', createdBy: 'ประภาส ทองสุข',
    note: 'โครงการพิเศษ ใช้หลักทรัพย์ค้ำ ผ่อนยาวสูงสุด 300 งวด',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      group: 'special', loanGroup: 'special',
      maxLoanAmount: 5000000.00, limitGroup: 'g-special', limitMethod: '1',
      rateTable: 'INT30', needCollateral: true, allowPersonGuar: false,
      notExceedShareValue: false, loanInsurance: '1', repayMode: '2',
    },
    ...window.LP_TABLE_DEFAULTS(),
    interestTiers: [
      { dueType: 'day', monthFrom: 1,  monthTo: 24,    form: 'float', fixedRate: 0, rateTable: 'INT30', adjust: -2.35 },
      { dueType: 'day', monthFrom: 25, monthTo: 48,    form: 'float', fixedRate: 0, rateTable: 'INT30', adjust: -1.35 },
      { dueType: 'day', monthFrom: 49, monthTo: 99999, form: 'float', fixedRate: 0, rateTable: 'INT30', adjust: 0 },
    ],
    guaranteeRules: [
      { loanFrom: 0, loanTo: 9999999, useShare: '0', allowType: '0', count: 0, normal: 0, cond: 0, assoc: 0 },
    ],
    collateralValues: [
      { group: '04', type: 'A', name: 'หลักทรัพย์ค้ำประกัน', percent: 80.00 },
      { group: '03', type: 'D', name: 'เงินฝากค้ำประกัน',    percent: 100.00 },
    ],
    installmentLimits: [
      { loanFrom: 0, loanTo: 5000000, ageFrom: 0, ageTo: 600, pvd: '-1', maxPeriods: 300, notExceedRetire: true, purpose: 'ที่อยู่อาศัย' },
    ],
    history: [
      { ts: '2024-12-15T11:00:00', user: 'ประภาส ทองสุข', action: 'create', effective: '2025-01-01',
        summary: 'สร้างผลิตภัณฑ์เงินกู้พิเศษเพื่อที่อยู่อาศัย (โครงการ 2568–2570)',
        changes: [{ field: 'รหัสเงิน', before: '—', after: '30' }, { field: 'ระยะเวลาโครงการ', before: '—', after: '01/01/2568 – 31/12/2570' }] },
    ],
  },
  {
    id: 'LP-40',
    code: '40', name: 'สามัญอุทกภัย 2567', abbr: 'อภ', group: 'normal',
    enabled: false,
    packageStart: '2024-10-01', packageEnd: '2025-03-31',
    createdDate: '2024-09-28', createdBy: 'ประภาส ทองสุข',
    note: 'โครงการช่วยเหลือผู้ประสบอุทกภัย — สิ้นสุดโครงการแล้ว เก็บเป็นประวัติ',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      group: 'normal', loanGroup: 'normal',
      maxLoanAmount: 200000.00, limitGroup: 'g-normal-ctl', limitMethod: '4',
      rateTable: 'INT40', maxContracts: 1, instantApprove: 'no',
      checkSalaryRemain: false, projectClosed: true,
    },
    ...window.LP_TABLE_DEFAULTS(),
    installmentLimits: [
      { loanFrom: 0, loanTo: 200000, ageFrom: 0, ageTo: 720, pvd: '-1', maxPeriods: 60, notExceedRetire: true, purpose: 'บรรเทาอุทกภัย' },
    ],
    history: [
      { ts: '2025-04-01T16:00:00', user: 'จันทร์เพ็ญ มาลี', action: 'update', effective: '2025-04-01',
        summary: 'ปิดการใช้งานผลิตภัณฑ์ — สิ้นสุดโครงการอุทกภัย',
        changes: [{ field: 'การใช้งาน', before: 'เปิดใช้งาน', after: 'ปิดใช้งาน' }] },
      { ts: '2024-09-28T10:15:00', user: 'ประภาส ทองสุข', action: 'create', effective: '2024-10-01',
        summary: 'สร้างผลิตภัณฑ์เงินกู้สามัญอุทกภัย 2567',
        changes: [{ field: 'รหัสเงิน', before: '—', after: '40' }] },
    ],
  },
  {
    id: 'LP-50',
    code: '50', name: 'สามัญเพิ่มสุข (ชำระจากปันผล)', abbr: 'พส', group: 'normal',
    enabled: true,
    packageStart: '2025-10-01', packageEnd: null,
    createdDate: '2025-09-15', createdBy: 'ประภาส ทองสุข',
    note: 'ผลิตภัณฑ์ไม่ผ่อนรายเดือน — ตัดชำระจากเงินปันผล/เฉลี่ยคืนประจำปี จ่ายเฉพาะดอกเบี้ยได้',
    settings: {
      ...window.LP_SETTINGS_DEFAULTS,
      group: 'normal', loanGroup: 'normal',
      maxLoanAmount: 500000.00, limitGroup: 'g-normal', limitMethod: '6',
      rateTable: 'INT50', maxContracts: 1,
      eligibleMemberTypes: ['regular', 'associate-staff', 'associate-kin'],
      maxTimesPerYear: 1, maxTimesTotal: 0,
      noMonthlyInstallment: true, dividendRepayBase: 'both',
      accrueInterestMonthly: true, interestOnlyAllowed: true,
      checkRebateHistory: true, rebatePayPercent: 80,
    },
    ...window.LP_TABLE_DEFAULTS(),
    history: [
      { ts: '2025-09-15T10:00:00', user: 'ประภาส ทองสุข', action: 'create', effective: '2025-10-01',
        summary: 'สร้างผลิตภัณฑ์สามัญเพิ่มสุข (ชำระจากปันผล–เฉลี่ยคืน)',
        changes: [{ field: 'รหัสเงิน', before: '—', after: '50' }] },
    ],
  },
];
