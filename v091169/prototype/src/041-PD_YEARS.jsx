// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — รายละเอียดปันผล (Dividend detail)
//  ข้อมูลปันผล/เฉลี่ยคืนรายสมาชิก รายปีปันผล + รายการเคลื่อนไหว
//  ผูกกับ DN_MEMBERS (เลขทะเบียน/ชื่อ/สังกัด/หนี้ค้าง) เพื่อใช้ค้นหา
//  หน้าจอตรวจสอบ (read-only) — ห้ามแก้ไขยอดปันผลโดยตรงจากหน้าจอนี้
// ═════════════════════════════════════════════════════════════════

// ปีปันผล (พ.ศ.) ที่เปิดให้เลือก
window.PD_YEARS = ['2567', '2566', '2565'];

// ประเภทสะสม / รอบบัญชี
window.PD_ACCUM_TYPES = [
  { v: 'year-acc',  l: 'สิ้นปี (สะสม)' },
  { v: 'year-pay',  l: 'สิ้นปี (จ่ายออก)' },
  { v: 'half',      l: 'ครึ่งปี' },
];

// สถานะปันผล
window.PD_STATUS = [
  { v: 'normal',  l: 'ปกติ',   pill: 'ok'  },
  { v: 'default', l: 'ผิดนัด', pill: 'bad' },
];
window.pdStatus = (v) => window.PD_STATUS.find(s => s.v === v) || window.PD_STATUS[0];
window.pdAccum  = (v) => window.PD_ACCUM_TYPES.find(s => s.v === v) || window.PD_ACCUM_TYPES[0];

// ─── ข้อมูลปันผลรายสมาชิก · รายปี ───────────────────────────────────
//  ยอดรวม      = ปันผล + เฉลี่ยคืน
//  คงเหลือรวม  = คงเหลือปันผล + คงเหลือเฉลี่ยคืน
//  ค้างจ่ายรวม = ค้างจ่ายปันผล + ค้างจ่ายเฉลี่ยคืน
//  ยอดคงเหลือหลังทำรายการ = คงเหลือก่อนหน้า − ยอดทำรายการ
window.PD_DIVIDEND = {
  // นางจิราพร แสงทอง — สมาชิกปกติ (ไม่มีหนี้ค้าง) — จ่ายปันผลตามปกติ
  'M-064120': [
    {
      year: '2567', status: 'normal', accumType: 'year-acc',
      rate: 5.50, avgRate: 12.00,
      dividend: 3520.00, avgReturn: 1180.00,
      divRemain: 900.00, avgRemain: 0.00,
      divArrears: 0.00,  avgArrears: 0.00,
      moves: [
        { date: '2024-01-01', amount:  4700.00, balance: 4700.00, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2567' },
        { date: '2024-01-25', amount: -3800.00, balance:  900.00, note: 'จ่ายปันผลเข้าบัญชีเงินฝากออมทรัพย์' },
        { date: '2024-03-31', amount:     0.00, balance:  900.00, note: 'ยกยอดคงเหลือ' },
        { date: '2024-04-30', amount:     0.00, balance:  900.00, note: 'รายการสิ้นสุด' },
      ],
    },
    {
      year: '2566', status: 'normal', accumType: 'year-acc',
      rate: 5.25, avgRate: 11.00,
      dividend: 3360.00, avgReturn: 990.00,
      divRemain: 0.00, avgRemain: 0.00,
      divArrears: 0.00, avgArrears: 0.00,
      moves: [
        { date: '2023-01-05', amount:  4350.00, balance: 4350.00, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2566' },
        { date: '2023-01-28', amount: -4350.00, balance:    0.00, note: 'จ่ายปันผลเข้าบัญชีเงินฝากออมทรัพย์ (เต็มจำนวน)' },
      ],
    },
  ],

  // นายวิรัตน์ ทองสุข — ผิดนัดชำระ (หนี้ค้างหลายสัญญา) — หักปันผลชำระหนี้
  'M-067012': [
    {
      year: '2567', status: 'default', accumType: 'year-acc',
      rate: 5.50, avgRate: 12.00,
      dividend: 10175.00, avgReturn: 3250.00,
      divRemain: 0.00, avgRemain: 0.00,
      divArrears: 0.00, avgArrears: 0.00,
      moves: [
        { date: '2024-01-01', amount: 13425.00, balance: 13425.00, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2567' },
        { date: '2024-01-31', amount: -9680.00, balance:  3745.00, note: 'หักชำระหนี้เงินกู้สามัญ (สัญญา L-2022-0455)' },
        { date: '2024-02-29', amount: -3120.00, balance:   625.00, note: 'หักชำระหนี้เงินกู้ฉุกเฉิน (สัญญา EM-2024-0771)' },
        { date: '2024-03-31', amount:  -625.00, balance:     0.00, note: 'กันยอดชำระหนี้เงินกู้พิเศษ (สัญญา SP-2021-0144)' },
        { date: '2024-04-30', amount:     0.00, balance:     0.00, note: 'รายการสิ้นสุด' },
      ],
    },
    {
      year: '2566', status: 'default', accumType: 'year-acc',
      rate: 5.25, avgRate: 11.00,
      dividend: 9712.50, avgReturn: 2860.00,
      divRemain: 0.00, avgRemain: 0.00,
      divArrears: 0.00, avgArrears: 0.00,
      moves: [
        { date: '2023-01-01', amount: 12572.50, balance: 12572.50, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2566' },
        { date: '2023-02-15', amount: -12572.50, balance:    0.00, note: 'หักชำระหนี้เงินกู้สามัญทั้งจำนวน' },
      ],
    },
  ],

  // นางสาวสุดารัตน์ พงษ์ไพบูลย์ — ผิดนัด/บอกเลิกสัญญา — กันยอดค้างจ่ายไว้
  'M-066238': [
    {
      year: '2567', status: 'default', accumType: 'year-acc',
      rate: 5.50, avgRate: 12.00,
      dividend: 5060.00, avgReturn: 1640.00,
      divRemain: 2500.00, avgRemain: 0.00,
      divArrears: 2500.00, avgArrears: 0.00,
      moves: [
        { date: '2024-01-01', amount:  6700.00, balance: 6700.00, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2567' },
        { date: '2024-01-31', amount: -4200.00, balance: 2500.00, note: 'หักชำระหนี้ตามสัญญาบอกเลิก (L-2021-0332)' },
        { date: '2024-02-28', amount:     0.00, balance: 2500.00, note: 'กันยอดค้างจ่าย — รอตรวจสอบสิทธิ์ทายาท/ผู้ค้ำประกัน' },
      ],
    },
  ],

  // นายประเสริฐ ชูเกียรติ — เสียชีวิต/ดำเนินคดี — ค้างจ่ายรอดำเนินคดี
  'M-065471': [
    {
      year: '2567', status: 'default', accumType: 'year-acc',
      rate: 5.50, avgRate: 12.00,
      dividend: 7397.50, avgReturn: 2100.00,
      divRemain: 9497.50, avgRemain: 0.00,
      divArrears: 9497.50, avgArrears: 0.00,
      moves: [
        { date: '2024-01-01', amount: 9497.50, balance: 9497.50, note: 'บันทึกปันผลและเฉลี่ยคืนประจำปี 2567' },
        { date: '2024-02-28', amount:    0.00, balance: 9497.50, note: 'กันยอดค้างจ่ายทั้งจำนวน — อยู่ระหว่างดำเนินคดี (สัญญา L-2020-0118)' },
      ],
    },
  ],
};

// คืนรายการปันผลของสมาชิก (ทุกปี)
window.pdRecordsOf = (code) => window.PD_DIVIDEND[code] || [];

// คืนรายการปันผลของสมาชิกตามปี (ถ้าไม่พบปีที่เลือก คืนปีล่าสุดที่มี)
window.pdRecord = (code, year) => {
  const recs = window.pdRecordsOf(code);
  if (!recs.length) return null;
  return recs.find(r => r.year === year) || recs[0];
};

// ปีปันผลที่สมาชิกรายนี้มีข้อมูล
window.pdYearsOf = (code) => window.pdRecordsOf(code).map(r => r.year);

// สรุปยอดหนี้ค้างของสมาชิก (สำหรับแผงตรวจสอบก่อนจ่าย เมื่อสถานะ "ผิดนัด")
window.pdDebtSummary = (code) => {
  const m = window.dnMember ? window.dnMember(code) : null;
  if (!m || !m.debts || !m.debts.length) return { rows: [], totalArrears: 0 };
  const rows = m.debts
    .filter(d => (d.arrears || 0) > 0 || /ผิดนัด|ค้าง|บอกเลิก|ดำเนินคดี/.test(d.status))
    .map(d => ({
      type: d.type, contractNo: d.contractNo, status: d.status,
      arrears: d.arrears || 0, overdue: d.overdueInstallments || 0,
    }));
  const totalArrears = rows.reduce((a, r) => a + r.arrears, 0);
  return { rows, totalArrears };
};
