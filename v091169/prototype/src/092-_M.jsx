// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน — ข้อมูลการทำงาน (ใช้ร่วมกันหลายหน้าจอ)
//  • ทะเบียนพอร์ตลงทุน        (IV_PORT_SEED)
//  • ตารางรับผลตอบแทน          (IV_RETURN_SEED)
//  • รายการขายก่อนครบกำหนด     (IV_SALE_SEED)
//  • ประวัตินำเข้าจาก Excel     (IV_IMPORT_SEED)
//  • กระแสเงินสด — เงินสดตั้งต้น (IV_CASH_OPENING) + แผนลงทุนใหม่ (IV_CASH_PLAN)
//
//  หมายเหตุ: assetTypeCode อ้างอิง IV_ASSET_TYPE_SEED, issuerCode อ้างอิง
//           IV_ISSUER_SEED (ทั้งคู่อยู่ใน data-invest.js) — เพื่อให้ข้อมูล
//           เชื่อมโยงกันทั้งระบบ
// ════════════════════════════════════════════════════════════════════

const _M = 1000000;

// แหล่งเงิน / Tag — กลุ่มวงเงินที่ใช้ลงทุน
window.IV_FUND_TAGS = [
  { tag: 'ทุนดำเนินงาน',   color: 'primary' },
  { tag: 'ทุนสำรอง',       color: 'info' },
  { tag: 'เงินรับฝาก',     color: 'warning' },
  { tag: 'ทุนสะสมพิเศษ',   color: 'success' },
];

// รอบจ่ายผลตอบแทน
window.IV_COUPON_FREQ = ['รายเดือน', 'ราย 3 เดือน', 'ราย 6 เดือน', 'รายปี', 'ครบกำหนดครั้งเดียว'];

// สถานะรายการลงทุน
window.IV_PORT_STATUS = {
  draft:    { l: 'ร่าง',        pill: 'neutral' },
  pending:  { l: 'รออนุมัติ',   pill: 'warn' },
  approved: { l: 'อนุมัติแล้ว', pill: 'info' },
  active:   { l: 'Active',      pill: 'ok' },
  matured:  { l: 'ครบกำหนด',    pill: 'neutral' },
  sold:     { l: 'ขายแล้ว',     pill: 'bad' },
};
window.IV_PORT_STATUS_ORDER = ['draft', 'pending', 'approved', 'active', 'matured', 'sold'];

// ─── ทะเบียนพอร์ตลงทุน ────────────────────────────────────────────────
window.IV_PORT_SEED = [
  { id: 'INV-2569-0012', investDate: '2026-05-18', assetTypeCode: 'GOVB', securityName: 'พันธบัตรรัฐบาล LB29DA',
    securityCode: 'LB29DA', issuerCode: 'MOF', rating: 'AAA (รัฐบาล)',
    faceValue: 50*_M, buyPrice: 99.85, units: 50000, investAmount: 49.925*_M, currentValue: 50.42*_M,
    couponRate: 3.25, yieldRate: 3.31, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-05-18', maturityDate: '2029-12-17', nextCouponDate: '2026-06-17',
    fundTag: 'ทุนดำเนินงาน', accrued: 137500, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['สัญญาซื้อขาย LB29DA.pdf', 'ใบยืนยันการซื้อ KTB.pdf'] },

  { id: 'INV-2569-0011', investDate: '2026-05-02', assetTypeCode: 'DEBT', securityName: 'หุ้นกู้ ปตท. PTTC295A',
    securityCode: 'PTTC295A', issuerCode: 'PTT', rating: 'AAA (tris)',
    faceValue: 30*_M, buyPrice: 100.00, units: 30000, investAmount: 30*_M, currentValue: 30.18*_M,
    couponRate: 3.65, yieldRate: 3.65, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-05-02', maturityDate: '2029-05-02', nextCouponDate: '2026-11-02',
    fundTag: 'ทุนสำรอง', accrued: 127750, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['หนังสือชี้ชวน PTTC295A.pdf', 'ใบยืนยันการซื้อ.pdf'] },

  { id: 'INV-2569-0010', investDate: '2026-04-21', assetTypeCode: 'FIXD', securityName: 'เงินฝากประจำ 12 เดือน ธ.ออมสิน',
    securityCode: 'FD-GSB-12M', issuerCode: 'GSB', rating: 'AAA (รัฐบาล)',
    faceValue: 40*_M, buyPrice: 100, units: 0, investAmount: 40*_M, currentValue: 40*_M,
    couponRate: 2.05, yieldRate: 2.05, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2026-04-21', maturityDate: '2027-04-21', nextCouponDate: '2027-04-21',
    fundTag: 'เงินรับฝาก', accrued: 119452, owner: 'จันทร์เพ็ญ มาลี',
    status: 'active', approver: 'ผู้จัดการ',
    docs: ['ใบเปิดบัญชีเงินฝากประจำ.pdf'] },

  { id: 'INV-2569-0009', investDate: '2026-04-09', assetTypeCode: 'SOEB', securityName: 'พันธบัตร กฟผ. EGAT296A',
    securityCode: 'EGAT296A', issuerCode: 'EGAT', rating: 'AAA (tris)',
    faceValue: 25*_M, buyPrice: 100.20, units: 25000, investAmount: 25.05*_M, currentValue: 25.31*_M,
    couponRate: 3.48, yieldRate: 3.42, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-04-09', maturityDate: '2029-04-09', nextCouponDate: '2026-10-09',
    fundTag: 'ทุนดำเนินงาน', accrued: 78300, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['สัญญาซื้อขาย.pdf'] },

  { id: 'INV-2569-0008', investDate: '2026-03-30', assetTypeCode: 'FUND', securityName: 'กองทุนตราสารหนี้ KFAFIX-A',
    securityCode: 'KFAFIX-A', issuerCode: 'KBANK', rating: '—',
    faceValue: 0, buyPrice: 12.4821, units: 1602450, investAmount: 20*_M, currentValue: 20.46*_M,
    couponRate: 0, yieldRate: 2.96, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2026-03-30', maturityDate: null, nextCouponDate: null,
    fundTag: 'ทุนสะสมพิเศษ', accrued: 0, owner: 'จันทร์เพ็ญ มาลี',
    status: 'active', approver: 'ผู้จัดการ',
    docs: ['ใบยืนยันการซื้อหน่วยลงทุน.pdf'] },

  { id: 'INV-2569-0007', investDate: '2026-03-12', assetTypeCode: 'STOCK', securityName: 'หุ้นสามัญ ปตท. (PTT)',
    securityCode: 'PTT', issuerCode: 'PTT', rating: '—',
    faceValue: 0, buyPrice: 34.25, units: 300000, investAmount: 10.275*_M, currentValue: 10.05*_M,
    couponRate: 0, yieldRate: 4.10, couponFreq: 'รายปี',
    startDate: '2026-03-12', maturityDate: null, nextCouponDate: '2026-09-15',
    fundTag: 'ทุนสะสมพิเศษ', accrued: 0, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['ใบยืนยันการซื้อหลักทรัพย์.pdf'] },

  { id: 'INV-2569-0006', investDate: '2026-02-26', assetTypeCode: 'DEBT', securityName: 'หุ้นกู้ ปูนซิเมนต์ไทย SCC284A',
    securityCode: 'SCC284A', issuerCode: 'SCC', rating: 'A+ (tris)',
    faceValue: 20*_M, buyPrice: 99.95, units: 20000, investAmount: 19.99*_M, currentValue: 20.12*_M,
    couponRate: 3.85, yieldRate: 3.88, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-02-26', maturityDate: '2028-08-26', nextCouponDate: '2026-08-26',
    fundTag: 'ทุนสำรอง', accrued: 168200, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['หนังสือชี้ชวน.pdf', 'ใบยืนยันการซื้อ.pdf'] },

  { id: 'INV-2569-0005', investDate: '2026-01-20', assetTypeCode: 'GOVB', securityName: 'พันธบัตรออมทรัพย์ SB266A',
    securityCode: 'SB266A', issuerCode: 'MOF', rating: 'AAA (รัฐบาล)',
    faceValue: 35*_M, buyPrice: 100, units: 35000, investAmount: 35*_M, currentValue: 35.28*_M,
    couponRate: 3.00, yieldRate: 3.00, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-01-20', maturityDate: '2026-07-20', nextCouponDate: '2026-07-20',
    fundTag: 'ทุนดำเนินงาน', accrued: 412500, owner: 'จันทร์เพ็ญ มาลี',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['ใบยืนยันการซื้อ.pdf'] },

  { id: 'INV-2569-0004', investDate: '2025-12-15', assetTypeCode: 'FIXD', securityName: 'เงินฝากประจำ 6 เดือน ธ.ก.ส.',
    securityCode: 'FD-BAAC-6M', issuerCode: 'BAAC', rating: 'AAA (รัฐบาล)',
    faceValue: 30*_M, buyPrice: 100, units: 0, investAmount: 30*_M, currentValue: 30*_M,
    couponRate: 1.85, yieldRate: 1.85, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2025-12-15', maturityDate: '2026-06-15', nextCouponDate: '2026-06-15',
    fundTag: 'เงินรับฝาก', accrued: 277500, owner: 'จันทร์เพ็ญ มาลี',
    status: 'active', approver: 'ผู้จัดการ',
    docs: ['ใบเปิดบัญชีเงินฝากประจำ.pdf'] },

  { id: 'INV-2569-0003', investDate: '2025-11-28', assetTypeCode: 'BE', securityName: 'ตั๋วแลกเงิน ธ.กรุงไทย BE-KTB-118',
    securityCode: 'BE-KTB-118', issuerCode: 'KTB', rating: 'AA+ (tris)',
    faceValue: 20*_M, buyPrice: 98.60, units: 20000, investAmount: 19.72*_M, currentValue: 19.94*_M,
    couponRate: 2.80, yieldRate: 2.84, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2025-11-28', maturityDate: '2026-05-28', nextCouponDate: '2026-05-28',
    fundTag: 'ทุนดำเนินงาน', accrued: 0, owner: 'ประภาส ทองสุข',
    status: 'matured', approver: 'ผู้จัดการ',
    docs: ['ตั๋วแลกเงิน.pdf'] },

  { id: 'INV-2568-0148', investDate: '2025-09-10', assetTypeCode: 'DEBT', securityName: 'หุ้นกู้ ซีพี ออลล์ CPALL285A',
    securityCode: 'CPALL285A', issuerCode: 'CPALL', rating: 'A (tris)',
    faceValue: 15*_M, buyPrice: 100, units: 15000, investAmount: 15*_M, currentValue: 0,
    couponRate: 3.95, yieldRate: 3.95, couponFreq: 'ราย 6 เดือน',
    startDate: '2025-09-10', maturityDate: '2026-03-10', nextCouponDate: null,
    fundTag: 'ทุนสำรอง', accrued: 0, owner: 'ประภาส ทองสุข',
    status: 'sold', approver: 'คณะกรรมการดำเนินการ ชุดที่ 47',
    docs: ['หนังสือชี้ชวน.pdf'] },

  { id: 'INV-2569-0013', investDate: '2026-06-08', assetTypeCode: 'SOEB', securityName: 'พันธบัตร กฟภ. PEA300A',
    securityCode: 'PEA300A', issuerCode: 'EGAT', rating: 'AAA (tris)',
    faceValue: 30*_M, buyPrice: 100, units: 30000, investAmount: 30*_M, currentValue: 30*_M,
    couponRate: 3.55, yieldRate: 3.55, couponFreq: 'ราย 6 เดือน',
    startDate: '2026-06-08', maturityDate: '2030-06-08', nextCouponDate: '2026-12-08',
    fundTag: 'ทุนดำเนินงาน', accrued: 0, owner: 'ประภาส ทองสุข',
    status: 'pending', approver: '',
    docs: ['ใบขออนุมัติการลงทุน.pdf'] },

  { id: 'INV-2569-0014', investDate: '2026-06-11', assetTypeCode: 'FUND', securityName: 'กองทุน TISCO Fixed Income TISCOFIX',
    securityCode: 'TISCOFIX', issuerCode: 'KBANK', rating: '—',
    faceValue: 0, buyPrice: 10.2140, units: 1468000, investAmount: 15*_M, currentValue: 15*_M,
    couponRate: 0, yieldRate: 2.78, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2026-06-11', maturityDate: null, nextCouponDate: null,
    fundTag: 'ทุนสะสมพิเศษ', accrued: 0, owner: 'จันทร์เพ็ญ มาลี',
    status: 'draft', approver: '',
    docs: [] },

  { id: 'INV-2569-0015', investDate: '2026-05-26', assetTypeCode: 'TBILL', securityName: 'ตั๋วเงินคลัง รุ่น TB26909A',
    securityCode: 'TB26909A', issuerCode: 'MOF', rating: 'AAA (รัฐบาล)',
    faceValue: 30*_M, buyPrice: 98.9520, units: 30000, investAmount: 29.6856*_M, currentValue: 29.83*_M,
    couponRate: 0, yieldRate: 2.18, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2026-05-26', maturityDate: '2026-09-09', nextCouponDate: '2026-09-09',
    fundTag: 'ทุนดำเนินงาน', accrued: 0, owner: 'ประภาส ทองสุข',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['ใบยืนยันการประมูลตั๋วเงินคลัง.pdf'] },

  { id: 'INV-2569-0016', investDate: '2026-04-30', assetTypeCode: 'PFND', securityName: 'กองทุนส่วนบุคคล สอ.กสท. (KTAM Mandate)',
    securityCode: 'PVTF-KTAM-01', issuerCode: 'KBANK', rating: '—',
    faceValue: 0, buyPrice: 10.5000, units: 2000000, investAmount: 21*_M, currentValue: 21.46*_M,
    couponRate: 0, yieldRate: 3.24, couponFreq: 'ครบกำหนดครั้งเดียว',
    startDate: '2026-04-30', maturityDate: null, nextCouponDate: null,
    fundTag: 'ทุนสะสมพิเศษ', accrued: 0, owner: 'จันทร์เพ็ญ มาลี',
    status: 'active', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    docs: ['สัญญาแต่งตั้งผู้จัดการกองทุนส่วนบุคคล.pdf', 'รายงาน NAV รายเดือน.pdf'] },
];

// ─── ตารางรับผลตอบแทน (ดอกเบี้ย / เงินปันผล) ──────────────────────────
// status: pending | received | overdue
window.IV_RETURN_SEED = [
  { id: 'RC-2569-0051', invId: 'INV-2569-0005', type: 'ดอกเบี้ย', dueDate: '2026-07-20',
    expect: 525000, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  { id: 'RC-2569-0050', invId: 'INV-2569-0012', type: 'ดอกเบี้ย', dueDate: '2026-06-17',
    expect: 812500, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  { id: 'RC-2569-0049', invId: 'INV-2569-0007', type: 'เงินปันผล', dueDate: '2026-09-15',
    expect: 420000, actual: null, wht: 42000, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  { id: 'RC-2569-0048', invId: 'INV-2569-0009', type: 'ดอกเบี้ย', dueDate: '2026-10-09',
    expect: 435000, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  { id: 'RC-2569-0047', invId: 'INV-2569-0011', type: 'ดอกเบี้ย', dueDate: '2026-11-02',
    expect: 547500, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  { id: 'RC-2569-0046', invId: 'INV-2569-0006', type: 'ดอกเบี้ย', dueDate: '2026-08-26',
    expect: 385000, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'pending' },
  // เกินกำหนด — ยังไม่ได้บันทึกรับ
  { id: 'RC-2569-0040', invId: 'INV-2569-0005', type: 'ดอกเบี้ย', dueDate: '2026-06-05',
    expect: 262500, actual: null, wht: 0, fee: 0, net: null, receivedDate: null, bank: '', ref: '', status: 'overdue' },
  // รับแล้ว
  { id: 'RC-2569-0032', invId: 'INV-2569-0012', type: 'ดอกเบี้ย', dueDate: '2025-12-17',
    expect: 812500, actual: 812500, wht: 0, fee: 0, net: 812500, receivedDate: '2025-12-17',
    bank: 'KTB 067-1-23456-7', ref: 'CR-IN-25120017', status: 'received' },
  { id: 'RC-2569-0028', invId: 'INV-2569-0011', type: 'ดอกเบี้ย', dueDate: '2025-11-02',
    expect: 547500, actual: 547500, wht: 0, fee: 0, net: 547500, receivedDate: '2025-11-03',
    bank: 'KTB 067-1-23456-7', ref: 'CR-IN-25110003', status: 'received' },
  { id: 'RC-2569-0021', invId: 'INV-2569-0007', type: 'เงินปันผล', dueDate: '2026-04-25',
    expect: 615000, actual: 615000, wht: 61500, fee: 0, net: 553500, receivedDate: '2026-04-25',
    bank: 'SCB 444-2-11122-3', ref: 'DV-PTT-690425', status: 'received' },
  { id: 'RC-2569-0014', invId: 'INV-2569-0008', type: 'เงินปันผล', dueDate: '2026-03-31',
    expect: 132000, actual: 132000, wht: 13200, fee: 0, net: 118800, receivedDate: '2026-03-31',
    bank: 'KBANK 012-3-45678-9', ref: 'DV-KFAFIX-690331', status: 'received' },
];

// ─── รายการขายก่อนครบกำหนด ──────────────────────────────────────────
window.IV_SALE_SEED = [
  { id: 'SL-2569-0007', invId: 'INV-2568-0148', sellDate: '2026-03-02', sellPrice: 100.85,
    costValue: 15*_M, saleValue: 15.1275*_M, gainLoss: 127500, tax: 0, fee: 7500, net: 15.12*_M,
    reason: 'ปรับพอร์ตตามมติคณะกรรมการเพื่อเพิ่มสภาพคล่อง', approver: 'คณะกรรมการดำเนินการ ชุดที่ 48',
    status: 'processed', docs: ['มติอนุมัติการขาย.pdf'] },
  { id: 'SL-2568-0006', invId: 'INV-2568-0102', sellDate: '2025-08-14', sellPrice: 98.40,
    costValue: 20*_M, saleValue: 19.68*_M, gainLoss: -320000, tax: 0, fee: 10000, net: 19.67*_M,
    reason: 'ตัดขาดทุนตราสารที่เครดิตถูกปรับลด', approver: 'คณะกรรมการดำเนินการ ชุดที่ 47',
    status: 'processed', docs: ['รายงานความเสี่ยง.pdf', 'มติอนุมัติการขาย.pdf'] },
];

// ─── ประวัติการนำเข้าจาก Excel ──────────────────────────────────────
window.IV_IMPORT_SEED = [
  { id: 'IMP-2569-008', fileName: 'investment_may2026.xlsx', importDate: '2026-05-19 10:24', by: 'ประภาส ทองสุข',
    total: 12, success: 11, error: 1, status: 'completed' },
  { id: 'IMP-2569-007', fileName: 'port_migration_q1.xlsx', importDate: '2026-04-02 14:08', by: 'จันทร์เพ็ญ มาลี',
    total: 48, success: 48, error: 0, status: 'completed' },
  { id: 'IMP-2569-006', fileName: 'fixed_deposit_2026.xlsx', importDate: '2026-02-10 09:41', by: 'จันทร์เพ็ญ มาลี',
    total: 9, success: 7, error: 2, status: 'completed' },
  { id: 'IMP-2568-021', fileName: 'bond_holdings_2568.xlsx', importDate: '2025-10-15 16:30', by: 'ประภาส ทองสุข',
    total: 64, success: 64, error: 0, status: 'completed' },
];

// แถวตัวอย่างสำหรับ Preview การนำเข้า (จำลองไฟล์ที่อัปโหลด)
window.IV_IMPORT_PREVIEW = [
  { row: 2, assetType: 'พันธบัตรรัฐบาล', securityName: 'พันธบัตรรัฐบาล LB31DA', securityCode: 'LB31DA',
    issuer: 'กระทรวงการคลัง', amount: 40000000, rate: 3.40, maturity: '2031-12-17', errors: [] },
  { row: 3, assetType: 'หุ้นกู้', securityName: 'หุ้นกู้ ปตท. PTTC305A', securityCode: 'PTTC305A',
    issuer: 'บมจ. ปตท.', amount: 25000000, rate: 3.72, maturity: '2030-05-02', errors: [] },
  { row: 4, assetType: 'เงินฝากประจำ', securityName: 'เงินฝากประจำ 24 เดือน ธ.ออมสิน', securityCode: 'FD-GSB-24M',
    issuer: 'ธนาคารออมสิน', amount: 50000000, rate: 2.25, maturity: '2028-06-01', errors: [] },
  { row: 5, assetType: 'หุ้นกู้เอกชน', securityName: 'หุ้นกู้ XYZ', securityCode: 'XYZ291A',
    issuer: 'บมจ. เอ็กซ์วายแซด', amount: 18000000, rate: 4.85, maturity: '2029-01-15',
    errors: ['ไม่พบประเภทสินทรัพย์ "หุ้นกู้เอกชน" ในระบบ', 'ผู้ออกหลักทรัพย์ยังไม่ได้ลงทะเบียน'] },
  { row: 6, assetType: 'พันธบัตรรัฐวิสาหกิจ', securityName: 'พันธบัตร กฟผ. EGAT315A', securityCode: 'EGAT315A',
    issuer: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย', amount: 30000000, rate: 3.60, maturity: '2031-04-09', errors: [] },
  { row: 7, assetType: 'หุ้นกู้', securityName: 'หุ้นกู้ ปตท. PTTC295A', securityCode: 'PTTC295A',
    issuer: 'บมจ. ปตท.', amount: 30000000, rate: 3.65, maturity: '2029-05-02',
    errors: ['รายการซ้ำกับ INV-2569-0011 ที่มีอยู่ในระบบ'] },
];

// ─── กระแสเงินสด ─────────────────────────────────────────────────────
window.IV_CASH_OPENING = 185*_M;   // เงินสดคงเหลือยกมา ณ ต้นงวด
// แผนเงินลงทุนใหม่ที่ตั้งไว้ (รายเดือน) — bucket: YYYY-MM
window.IV_CASH_PLAN = [
  { month: '2026-06', planInvest: 45*_M, note: 'พันธบัตร กฟภ. + กองทุนตราสารหนี้' },
  { month: '2026-07', planInvest: 60*_M, note: 'รอบลงทุนพันธบัตรออกใหม่ ไตรมาส 3' },
  { month: '2026-08', planInvest: 30*_M, note: 'หุ้นกู้เอกชนเครดิต A ขึ้นไป' },
  { month: '2026-09', planInvest: 40*_M, note: 'พันธบัตรรัฐวิสาหกิจ' },
  { month: '2026-10', planInvest: 50*_M, note: '' },
  { month: '2026-11', planInvest: 35*_M, note: '' },
  { month: '2026-12', planInvest: 55*_M, note: 'ปิดงวดบัญชี 2569' },
];

// ─── Helpers — lookup + load/save ────────────────────────────────────
window.ivAssetType = (code) => (window.IV_ASSET_TYPE_SEED || []).find(t => t.code === code) || null;
window.ivIssuer = (code) => (window.IV_ISSUER_SEED || []).find(i => i.code === code) || null;
window.ivPortById = (id) => (window.ivLoadPort()).find(p => p.id === id) || (window.IV_PORT_SEED.find(p => p.id === id) || null);

window.ivLoadPort = function () {
  try { const s = localStorage.getItem('invest_port'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.IV_PORT_SEED));
};
window.ivSavePort = function (list) { try { localStorage.setItem('invest_port', JSON.stringify(list)); } catch (e) {} };

window.ivLoadReturns = function () {
  try { const s = localStorage.getItem('invest_returns'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.IV_RETURN_SEED));
};
window.ivSaveReturns = function (list) { try { localStorage.setItem('invest_returns', JSON.stringify(list)); } catch (e) {} };

window.ivLoadSales = function () {
  try { const s = localStorage.getItem('invest_sales'); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.IV_SALE_SEED));
};
window.ivSaveSales = function (list) { try { localStorage.setItem('invest_sales', JSON.stringify(list)); } catch (e) {} };

// เลขที่รายการลงทุนถัดไป
window.ivNextInvNo = function (list) {
  const yr = 2569;
  const nums = list.filter(p => p.id.includes('-' + yr + '-'))
    .map(p => parseInt(p.id.split('-').pop(), 10) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `INV-${yr}-${String(next).padStart(4, '0')}`;
};
