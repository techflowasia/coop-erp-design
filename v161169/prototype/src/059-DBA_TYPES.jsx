// ════════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — อนุมัติใบคำขอ (Debt Request Approval)
//  ศูนย์รวมใบคำขอรออนุมัติจากหลายเมนู:
//   ① เปลี่ยนแปลงยอดชำระหนี้  ② บอกเลิกสัญญา  ③ พักชำระหนี้
//   ④ ปรับโครงสร้างหนี้        ⑤ ดำเนินคดี
//  อ้างอิงสมาชิก/สัญญาจาก DN_MEMBERS (data-debt-notice.js)
// ════════════════════════════════════════════════════════════════════

// ─── ประเภทใบคำขอ ───────────────────────────────────────────────────
window.DBA_TYPES = [
  { v: 'inst-change', l: 'เปลี่ยนแปลงยอดชำระหนี้', short: 'เปลี่ยนยอดชำระ', icon: 'edit',    chip: 'info',    route: { view: 'debt', page: 'installment-change' } },
  { v: 'share-change', l: 'เปลี่ยนแปลงค่าหุ้น',     short: 'เปลี่ยนค่าหุ้น', icon: 'shares',  chip: 'primary', route: { view: 'debt', page: 'share-change' } },
  { v: 'terminate',   l: 'บอกเลิกสัญญา',           short: 'บอกเลิกสัญญา',   icon: 'close',   chip: 'warning', route: { view: 'debt', page: 'terminate' } },
  { v: 'suspend',     l: 'ขอพักชำระหนี้',           short: 'พักชำระหนี้',     icon: 'lock',    chip: 'primary', route: { view: 'debt', page: 'suspension' } },
  { v: 'restructure', l: 'ปรับโครงสร้างหนี้',        short: 'ปรับโครงสร้าง',   icon: 'refresh', chip: 'success', route: { view: 'debt', page: 'installment-change' } },
  { v: 'transfer-dept', l: 'ย้ายสังกัดสมาชิก',       short: 'ย้ายสังกัด',     icon: 'swap',    chip: 'primary', route: { view: 'debt', page: 'transfer-dept' } },
  { v: 'resign',      l: 'ลาออกจากสมาชิก',           short: 'ลาออก',          icon: 'logout',  chip: 'warning', route: { view: 'debt', page: 'resign' } },
  { v: 'legal',       l: 'ดำเนินคดี',               short: 'ดำเนินคดี',       icon: 'shield',  chip: 'danger',  route: null },
];
window.dbaType = (v) => window.DBA_TYPES.find(t => t.v === v) || window.DBA_TYPES[0];

// ─── สถานะการอนุมัติ ────────────────────────────────────────────────
window.DBA_STATUS = [
  { v: 'pending',  l: 'รออนุมัติ',  pill: 'warn'    },
  { v: 'approved', l: 'อนุมัติ',    pill: 'ok'      },
  { v: 'rejected', l: 'ไม่อนุมัติ',  pill: 'bad'     },
];
window.dbaStatus = (v) => window.DBA_STATUS.find(s => s.v === v) || window.DBA_STATUS[0];

// ─── ผู้มีอำนาจอนุมัติ (ล็อกอินปัจจุบัน) ──────────────────────────────
window.DBA_APPROVER = 'มนตรี ศรีสุข';

// ─── ใบคำขอรออนุมัติ (demo seed) ────────────────────────────────────
//  amount = มูลค่าที่เกี่ยวข้อง (ยอดหนี้คงเหลือ/ทุนทรัพย์) ใช้รวมยอด KPI
//  fields[] = ข้อมูลเฉพาะประเภท แสดงในแผงรายละเอียด
window.DBA_SEED = [
  {
    id: 'REQ-2569-0148', type: 'inst-change', docNo: 'CHG-69-0007',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข', dept: 'กองช่าง',
    contractNo: 'L-2022-0455', loanType: 'เงินกู้สามัญ', amount: 458200,
    requestedBy: 'จันทร์เพ็ญ มาลี', requestDate: '2026-06-15',
    meetingRef: 'ครั้งที่ 4/2569', priority: 'normal',
    detail: {
      title: 'คำขอเปลี่ยนแปลงยอดชำระหนี้', badge: 'เปลี่ยนยอดชำระ', badgeChip: 'info',
      sections: [
        { kind: 'compare', title: 'รายละเอียดการเปลี่ยนแปลง', leftLabel: 'เงื่อนไขเดิม', rightLabel: 'เงื่อนไขใหม่',
          left: [{ k: 'ยอดชำระต่องวด', v: '9,680.00 บาท', mono: true }, { k: 'จำนวนงวดคงเหลือ', v: '120 งวด', mono: true }, { k: 'อัตราดอกเบี้ย', v: '6.75% ต่อปี', mono: true }],
          right: [{ k: 'ยอดชำระต่องวด', v: '7,250.00 บาท', mono: true }, { k: 'จำนวนงวดคงเหลือ', v: '156 งวด', mono: true }, { k: 'อัตราดอกเบี้ย', v: '6.75% ต่อปี', mono: true }],
          note: 'ลดยอดผ่อนต่องวด 2,430 บาท โดยขยายระยะเวลาผ่อนเพิ่ม 36 งวด' },
        { kind: 'grid', title: 'ข้อมูลสัญญา', rows: [
          { k: 'ทะเบียนคำขอ', v: 'REQ-2569-0148', mono: true },
          { k: 'เลขที่เอกสาร', v: 'CHG-69-0007', mono: true },
          { k: 'สัญญาเลขที่', v: 'L-2022-0455', mono: true },
          { k: 'ประเภทเงินกู้', v: 'เงินกู้สามัญ' },
          { k: 'ยอดอนุมัติ', v: '700,000.00', mono: true },
          { k: 'เงินต้นคงเหลือ', v: '458,200.00', mono: true },
          { k: 'งวดชำระล่าสุด', v: '48 งวด', mono: true },
          { k: 'อ้างอิงมติที่ประชุม', v: 'ครั้งที่ 4/2569' }] },
        { kind: 'grid', title: 'ข้อมูลผู้ยื่นคำขอ', rows: [
          { k: 'ทะเบียนสมาชิก', v: 'M-067012', mono: true },
          { k: 'ชื่อ-ชื่อสกุล', v: 'นายวิรัตน์ ทองสุข' },
          { k: 'สังกัด', v: '0301 · กองช่าง' },
          { k: 'ผู้จัดทำ', v: 'จันทร์เพ็ญ มาลี' },
          { k: 'วันที่ยื่น', v: '15 มิ.ย. 2569' }] },
        { kind: 'note', title: 'หมายเหตุ / เหตุผล', text: 'ถูกปรับลดเงินเดือน — ขอลดภาระค่างวดต่อเดือน' },
      ],
    },
    summary: 'ขอลดยอดผ่อนชำระต่องวด จาก 9,680 เป็น 7,250 บาท ขยายงวดเป็น 156 งวด',
    fields: [
      { k: 'ยอดชำระเดิม', v: '9,680.00 บาท/งวด' },
      { k: 'ยอดชำระใหม่', v: '7,250.00 บาท/งวด', hl: true },
      { k: 'งวดชำระเดิม', v: '120 งวด' },
      { k: 'งวดชำระใหม่', v: '156 งวด', hl: true },
      { k: 'เหตุผล', v: 'ถูกปรับลดเงินเดือน — ขอลดภาระค่างวด' },
    ],
    status: 'pending',
  },
  {
    id: 'REQ-2569-0149', type: 'terminate', docNo: 'CT-69-0033',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์', dept: 'กองการศึกษา',
    contractNo: 'L-2021-0332', loanType: 'เงินกู้สามัญ', amount: 298720,
    requestedBy: 'พิมพ์ใจ สุวรรณโชติ', requestDate: '2026-06-14',
    meetingRef: 'ครั้งที่ 4/2569', priority: 'urgent',
    detail: {
      title: 'หนังสือบอกเลิกสัญญาเงินกู้', badge: 'บอกเลิกสัญญา', badgeChip: 'warning',
      head: [
        { k: 'ผู้กู้ลูกหนี้', v: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์ (M-066238)' },
        { k: 'หนี้คงเหลือที่บอกเลิก', v: '฿ 298,720.00', danger: true },
        { k: 'กรณีบอกเลิก', v: 'ผู้กู้ลาออก / ไล่ออก / เกษียณ' },
        { k: 'สถานะสมาชิก', v: 'ลาออก', pill: 'warn' }],
      sections: [
        { kind: 'grid', title: 'ข้อมูลเอกสาร และการบอกเลิก', rows: [
          { k: 'ทะเบียนบอกเลิก', v: 'REQ-2569-0149', mono: true },
          { k: 'เลขที่หนังสือ', v: 'สอ.กสท.(บล) 0033/2569', mono: true },
          { k: 'วันที่รายการ', v: '14 มิ.ย. 2569' },
          { k: 'กรณีบอกเลิก', v: 'ผู้กู้ลาออก / ไล่ออก / เกษียณ' },
          { k: 'วันที่เริ่มเก็บ', v: '1 พ.ค. 2569' },
          { k: 'มติ คสอ.', v: 'คสอ. 4/2569' },
          { k: 'วันที่มติ', v: '20 พ.ค. 2569' },
          { k: 'เลขนำส่ง EMS', v: 'EI778812345TH', mono: true },
          { k: 'วันที่ส่งหนังสือ', v: '—' }] },
        { kind: 'grid', title: 'ข้อมูลผู้กู้ และที่อยู่จัดส่ง',
          rows: [
            { k: 'ทะเบียนสมาชิก', v: 'M-066238', mono: true },
            { k: 'ชื่อ-ชื่อสกุล', v: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์' },
            { k: 'สังกัด', v: '0204 · กองการศึกษา' },
            { k: 'เลขบัตรประชาชน', v: '3-1014-00512-44-2', mono: true },
            { k: 'ทุนเรือนหุ้น', v: '฿ 72,400.00' },
            { k: 'ผู้ลงนาม', v: 'นายประสิทธิ์ คงทอง · ผู้จัดการสหกรณ์' }],
          addr: [
            { k: 'ที่อยู่ตามทะเบียน', v: '88/12 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000' },
            { k: 'ที่อยู่จัดส่งหนังสือ', v: '88/12 ต.บางกระสอ อ.เมือง จ.นนทบุรี 11000', chip: 'ตามทะเบียน', chipTone: 'neutral' }] },
        { kind: 'table', title: 'สัญญาเงินกู้ที่บอกเลิก',
          cols: [{ label: 'ประเภท' }, { label: 'สัญญาเลขที่' }, { label: 'วันที่ทำสัญญา', align: 'center' }, { label: 'เงินต้นคงเหลือ', align: 'num' }, { label: 'ดอกเบี้ยค้าง', align: 'num' }, { label: 'ค่าปรับ', align: 'num' }, { label: 'งวดค้าง', align: 'center' }, { label: 'รวมต่อสัญญา', align: 'num' }],
          rows: [[{ v: 'เงินกู้สามัญ' }, { v: 'L-2021-0332', mono: true }, { v: '10 ก.ค. 2564', align: 'center', mono: true }, { v: '276,400.00', align: 'num', mono: true }, { v: '18,920.00', align: 'num', mono: true }, { v: '3,400.00', align: 'num', mono: true }, { v: '8 งวด', align: 'center' }, { v: '298,720.00', align: 'num', mono: true, bold: true }]],
          foot: [{ v: 'รวม', colSpan: 3, align: 'right', bold: true }, { v: '276,400.00', align: 'num', mono: true, bold: true }, { colSpan: 3 }, { v: '298,720.00', align: 'num', mono: true, bold: true }] },
        { kind: 'table', title: 'ผู้ค้ำประกัน',
          cols: [{ label: 'ลำดับ', align: 'center', w: 44 }, { label: 'สัญญา' }, { label: 'ผู้ค้ำประกัน' }, { label: 'ชื่อ-ชื่อสกุล' }, { label: 'สังกัด' }],
          rows: [
            [{ v: '1', align: 'center' }, { v: 'L-2021-0332', mono: true }, { v: 'M-058241', mono: true }, { v: 'นายสมชาย ใจดี รักษ์ออม' }, { v: 'กองคลัง สำนักงานปลัด' }],
            [{ v: '2', align: 'center' }, { v: 'L-2021-0332', mono: true }, { v: 'M-061190', mono: true }, { v: 'นางวิไล ทองคำ' }, { v: 'กองการศึกษา' }]] },
      ],
    },
    summary: 'บอกเลิกสัญญา กรณีผู้กู้ลาออกแต่ยังมีหนี้ค้าง ขาดส่ง 8 งวด',
    fields: [
      { k: 'กรณีบอกเลิก', v: 'ผู้กู้ลาออก / ไล่ออก / เกษียณ' },
      { k: 'ยอดหนี้คงเหลือ', v: '276,400.00 บาท', hl: true },
      { k: 'ดอกเบี้ยค้าง', v: '18,920.00 บาท' },
      { k: 'ค่าปรับ', v: '3,400.00 บาท' },
      { k: 'ค้างชำระ', v: '8 งวด' },
    ],
    status: 'pending',
  },
  {
    id: 'REQ-2569-0150', type: 'suspend', docNo: 'SP-69-0012',
    memberCode: 'M-064120', memberName: 'นางสาวปิยะนุช เกษมสุข', dept: 'กองสาธารณสุข',
    contractNo: 'L-2023-0612', loanType: 'เงินกู้สามัญ', amount: 184500,
    requestedBy: 'จันทร์เพ็ญ มาลี', requestDate: '2026-06-16',
    meetingRef: 'ครั้งที่ 5/2569', priority: 'normal',
    detail: {
      title: 'ใบคำขอพักชำระหนี้', badge: '6 เดือน', badgeChip: 'info',
      head: [
        { k: 'สมาชิก', v: 'นางสาวปิยะนุช เกษมสุข (M-064120)' },
        { k: 'สัญญาเงินกู้', v: 'L-2023-0612 · เงินกู้สามัญ', mono: true },
        { k: 'เริ่มมีผล', v: 'กรกฎาคม 2569' },
        { k: 'วันที่ขอ', v: '16 มิ.ย. 2569' }],
      sections: [
        { kind: 'compare', title: 'รายละเอียดสัญญา',
          left: [{ k: 'งวดชำระล่าสุด', v: '30 งวด', mono: true }, { k: 'ยอดอนุมัติ', v: '320,000.00', mono: true }, { k: 'ยอดรอเบิก', v: '0.00', mono: true }],
          right: [{ k: 'ยอดคงเหลือ', v: '184,500.00', mono: true }, { k: 'ดอกเบี้ยค้าง', v: '5,420.00', mono: true }, { k: 'รูปแบบพักชำระ', v: 'พักเงินต้น ชำระเฉพาะดอกเบี้ย' }],
          note: 'งดชำระเงินต้น ผ่อนเฉพาะดอกเบี้ยค้างเป็นงวด' },
        { kind: 'tiles', title: 'ความสามารถในการชำระ',
          tiles: [
            { icon: 'wallet', label: 'รวมเงินได้', value: 38600, tone: 'income' },
            { icon: 'receipt', label: 'รวมเงินหัก', value: 14200, tone: 'deduct' },
            { icon: 'money', label: 'ดอกเบี้ย (คงต้น)', value: 5420, tone: 'warn' },
            { icon: 'check', label: 'รายได้คำนวณ', value: 24400, tone: 'net' }] },
        { kind: 'table', title: 'ตารางการชำระหนี้',
          cols: [{ label: 'ลำดับ', align: 'center', w: 56 }, { label: 'ตั้งแต่งวด', align: 'center' }, { label: 'ถึงงวด', align: 'center' }, { label: 'ชำระต่องวด', align: 'num' }, { label: 'ผ่อนดอกเบี้ยค้าง', align: 'num' }, { label: 'วันที่ป้อน', align: 'center' }],
          rows: [
            [{ v: '1', align: 'center', mono: true }, { v: '31', align: 'center', mono: true }, { v: '32', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '903.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }],
            [{ v: '2', align: 'center', mono: true }, { v: '32', align: 'center', mono: true }, { v: '33', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '903.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }],
            [{ v: '3', align: 'center', mono: true }, { v: '33', align: 'center', mono: true }, { v: '34', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '903.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }],
            [{ v: '4', align: 'center', mono: true }, { v: '34', align: 'center', mono: true }, { v: '35', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '903.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }],
            [{ v: '5', align: 'center', mono: true }, { v: '35', align: 'center', mono: true }, { v: '36', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '903.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }],
            [{ v: '6', align: 'center', mono: true }, { v: '36', align: 'center', mono: true }, { v: '37', align: 'center', mono: true }, { v: '2,750.00', align: 'num', mono: true }, { v: '905.00', align: 'num', mono: true }, { v: '16 มิ.ย. 2569', align: 'center', mono: true }]],
          foot: [{ v: 'รวม', colSpan: 3, align: 'right', bold: true }, { v: '16,500.00', align: 'num', mono: true, bold: true }, { v: '5,420.00', align: 'num', mono: true, bold: true }, { colSpan: 1 }] },
        { kind: 'note', title: 'หมายเหตุ', text: 'พักชำระต้นเงิน 6 เดือน คงชำระดอกเบี้ยตามปกติ เนื่องจากประสบอุทกภัย' },
      ],
    },
    summary: 'ขอพักชำระเงินต้น 6 เดือน ชำระเฉพาะดอกเบี้ย เนื่องจากประสบอุทกภัย',
    fields: [
      { k: 'รูปแบบการพัก', v: 'พักเงินต้น ชำระเฉพาะดอกเบี้ย' },
      { k: 'ระยะเวลาพัก', v: '6 เดือน', hl: true },
      { k: 'เริ่มมีผล', v: 'กรกฎาคม 2569' },
      { k: 'สิ้นสุด', v: 'ธันวาคม 2569' },
      { k: 'เหตุผล', v: 'ประสบอุทกภัย — รายได้ลดลงชั่วคราว' },
    ],
    status: 'pending',
  },
  {
    id: 'REQ-2569-0151', type: 'restructure', docNo: 'RS-69-0009',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข', dept: 'กองช่าง',
    contractNo: 'EM-2024-0771', loanType: 'เงินกู้ฉุกเฉิน', amount: 18600,
    requestedBy: 'พิมพ์ใจ สุวรรณโชติ', requestDate: '2026-06-13',
    meetingRef: 'ครั้งที่ 4/2569', priority: 'normal',
    detail: {
      title: 'คำขอปรับโครงสร้างหนี้', badge: 'ปรับโครงสร้าง', badgeChip: 'success',
      head: [
        { k: 'สมาชิก', v: 'นายวิรัตน์ ทองสุข (M-067012)' },
        { k: 'สัญญาเงินกู้', v: 'EM-2024-0771 · เงินกู้ฉุกเฉิน', mono: true },
        { k: 'เริ่มมีผล', v: 'สิงหาคม 2569' },
        { k: 'วันที่ขอ', v: '13 มิ.ย. 2569' }],
      sections: [
        { kind: 'compare', title: 'เงื่อนไขการปรับโครงสร้าง', leftLabel: 'เดิม', rightLabel: 'ใหม่',
          left: [{ k: 'อัตราดอกเบี้ย', v: '6.75% ต่อปี', mono: true }, { k: 'จำนวนงวด', v: '12 งวด', mono: true }, { k: 'ค่างวด', v: '1,620.00 บาท', mono: true }],
          right: [{ k: 'อัตราดอกเบี้ย', v: '5.75% ต่อปี', mono: true }, { k: 'จำนวนงวด', v: '24 งวด', mono: true }, { k: 'ค่างวด', v: '835.00 บาท', mono: true }],
          note: 'รวมดอกเบี้ยค้างเข้าเงินต้น ผ่อนต้น+ดอกเท่ากันทุกงวด' },
        { kind: 'grid', title: 'ข้อมูลหนี้ก่อนปรับ', cols4: true, rows: [
          { k: 'เงินต้นคงเหลือ', v: '16,800.00', mono: true },
          { k: 'ดอกเบี้ยค้าง', v: '1,420.00', mono: true },
          { k: 'ค่าปรับ', v: '380.00', mono: true },
          { k: 'มูลหนี้รวม', v: '18,600.00', mono: true }] },
        { kind: 'note', title: 'หมายเหตุ', text: 'ลดภาระดอกเบี้ยตามมติช่วยเหลือสมาชิก' },
      ],
    },
    summary: 'ปรับโครงสร้างหนี้ ลดดอกเบี้ยเหลือ 5.75% ขยายงวดและรวมหนี้ค้าง',
    fields: [
      { k: 'อัตราดอกเบี้ยเดิม', v: '6.75% ต่อปี' },
      { k: 'อัตราดอกเบี้ยใหม่', v: '5.75% ต่อปี', hl: true },
      { k: 'งวดชำระใหม่', v: '24 งวด' },
      { k: 'เงื่อนไขใหม่', v: 'รวมดอกเบี้ยค้างเข้าเงินต้น ผ่อนต้น+ดอกเท่ากัน' },
      { k: 'เริ่มมีผล', v: 'สิงหาคม 2569' },
    ],
    status: 'pending',
  },
  {
    id: 'REQ-2569-0152', type: 'legal', docNo: 'LG-69-0004',
    memberCode: 'M-065471', memberName: 'นายประเสริฐ ชูเกียรติ', dept: 'สำนักงานปลัด',
    contractNo: 'L-2020-0118', loanType: 'เงินกู้พิเศษ', amount: 661880,
    requestedBy: 'พิมพ์ใจ สุวรรณโชติ', requestDate: '2026-06-10',
    meetingRef: 'ครั้งที่ 3/2569', priority: 'urgent',
    detail: {
      title: 'คำขอส่งดำเนินคดี', badge: 'ดำเนินคดี', badgeChip: 'danger',
      head: [
        { k: 'ผู้กู้ลูกหนี้', v: 'นายประเสริฐ ชูเกียรติ (M-065471)' },
        { k: 'มูลหนี้ฟ้อง', v: '฿ 661,880.00', danger: true },
        { k: 'ขั้นตอน', v: 'ยื่นฟ้องศาลแพ่ง' },
        { k: 'สถานะสมาชิก', v: 'เสียชีวิต', pill: 'bad' }],
      sections: [
        { kind: 'grid', title: 'ข้อมูลคดี', rows: [
          { k: 'มูลหนี้ฟ้อง', v: '661,880.00 บาท', mono: true, danger: true },
          { k: 'ขั้นตอน', v: 'ยื่นฟ้องศาลแพ่ง' },
          { k: 'ศาล', v: 'ศาลแพ่งนนทบุรี' },
          { k: 'ทนายความ', v: 'สนง.กฎหมายธนวัฒน์และเพื่อน' },
          { k: 'อายุความ', v: 'คงเหลือ 8 เดือน', warn: true },
          { k: 'มติ คสอ.', v: 'คสอ. 3/2569' }] },
        { kind: 'table', title: 'สัญญา / มูลหนี้ที่ฟ้อง',
          cols: [{ label: 'ประเภท' }, { label: 'สัญญาเลขที่' }, { label: 'เงินต้นคงเหลือ', align: 'num' }, { label: 'ดอกเบี้ยค้าง', align: 'num' }, { label: 'ค่าปรับ', align: 'num' }, { label: 'รวม', align: 'num' }],
          rows: [[{ v: 'เงินกู้พิเศษ' }, { v: 'L-2020-0118', mono: true }, { v: '612,000.00', align: 'num', mono: true }, { v: '42,880.00', align: 'num', mono: true }, { v: '7,000.00', align: 'num', mono: true }, { v: '661,880.00', align: 'num', mono: true, bold: true }]],
          foot: [{ v: 'รวม', colSpan: 2, align: 'right', bold: true }, { v: '612,000.00', align: 'num', mono: true, bold: true }, { v: '42,880.00', align: 'num', mono: true, bold: true }, { v: '7,000.00', align: 'num', mono: true, bold: true }, { v: '661,880.00', align: 'num', mono: true, bold: true }] },
        { kind: 'table', title: 'ผู้ค้ำประกัน (เรียกร่วม)',
          cols: [{ label: 'ลำดับ', align: 'center', w: 44 }, { label: 'สัญญา' }, { label: 'ผู้ค้ำประกัน' }, { label: 'ชื่อ-ชื่อสกุล' }, { label: 'สังกัด' }],
          rows: [
            [{ v: '1', align: 'center' }, { v: 'L-2020-0118', mono: true }, { v: 'M-060044', mono: true }, { v: 'นายอำนวย สุขเจริญ' }, { v: 'สำนักงานปลัด' }],
            [{ v: '2', align: 'center' }, { v: 'L-2020-0118', mono: true }, { v: 'M-062815', mono: true }, { v: 'นางสมหญิง แก้วมณี' }, { v: 'กองคลัง' }]] },
        { kind: 'note', title: 'หมายเหตุ', text: 'ผู้กู้เสียชีวิต ทายาทไม่ชำระตามหนังสือบอกเลิก — เสนอส่งดำเนินคดี' },
      ],
    },
    summary: 'ส่งดำเนินคดี กรณีผู้กู้เสียชีวิต ทายาทไม่ชำระตามหนังสือบอกเลิก',
    fields: [
      { k: 'มูลหนี้ฟ้อง', v: '661,880.00 บาท', hl: true },
      { k: 'ขั้นตอน', v: 'ยื่นฟ้องศาลแพ่ง' },
      { k: 'ผู้ค้ำประกัน', v: '2 ราย (เรียกร่วม)' },
      { k: 'ทนายความ', v: 'สนง.กฎหมายธนวัฒน์ฯ' },
      { k: 'อายุความ', v: 'คงเหลือ 8 เดือน', warn: true },
    ],
    status: 'pending',
  },
  {
    id: 'REQ-2569-0145', type: 'inst-change', docNo: 'CHG-69-0006',
    memberCode: 'M-066238', memberName: 'นางสาวสุดารัตน์ พงษ์ไพบูลย์', dept: 'กองการศึกษา',
    contractNo: 'L-2021-0332', loanType: 'เงินกู้สามัญ', amount: 276400,
    requestedBy: 'จันทร์เพ็ญ มาลี', requestDate: '2026-06-09',
    meetingRef: 'ครั้งที่ 3/2569', priority: 'normal',
    summary: 'ปรับเพิ่มยอดส่งชำระรายปี 12,000 บาท ตามหนังสือรับสภาพหนี้',
    fields: [
      { k: 'รูปแบบ', v: 'ปรับเพิ่มส่งรายปี' },
      { k: 'ยอดปรับเพิ่ม', v: '12,000.00 บาท/ปี', hl: true },
      { k: 'เริ่มมีผล', v: 'กรกฎาคม 2569' },
      { k: 'เหตุผล', v: 'ตามหนังสือรับสภาพหนี้' },
    ],
    status: 'approved',
    decidedBy: 'มนตรี ศรีสุข', decidedDate: '2026-06-11', remark: 'เห็นชอบตามมติที่ประชุม',
  },
  {
    id: 'REQ-2569-0142', type: 'suspend', docNo: 'SP-69-0010',
    memberCode: 'M-067012', memberName: 'นายวิรัตน์ ทองสุข', dept: 'กองช่าง',
    contractNo: 'L-2022-0455', loanType: 'เงินกู้สามัญ', amount: 458200,
    requestedBy: 'จันทร์เพ็ญ มาลี', requestDate: '2026-06-05',
    meetingRef: 'ครั้งที่ 3/2569', priority: 'normal',
    summary: 'ขอพักชำระ 3 เดือน — ไม่ผ่านเกณฑ์ความสามารถในการชำระ',
    fields: [
      { k: 'รูปแบบการพัก', v: 'พักเงินต้นและดอกเบี้ย' },
      { k: 'ระยะเวลาพัก', v: '3 เดือน' },
      { k: 'เหตุผล', v: 'รายได้ไม่แน่นอน' },
    ],
    status: 'rejected',
    decidedBy: 'มนตรี ศรีสุข', decidedDate: '2026-06-07', remark: 'มีประวัติค้างชำระต่อเนื่อง ให้ทำสัญญาปรับโครงสร้างแทน',
  },
];

// ─── โหลด / บันทึก localStorage ─────────────────────────────────────
window.dbaLoad = () => {
  try {
    const saved = localStorage.getItem('debt_approvals');
    if (saved) {
      const list = JSON.parse(saved);
      const seedById = {};
      window.DBA_SEED.forEach(s => { seedById[s.id] = s; });
      // เติมข้อมูลคงที่จาก seed (เช่น detail) ให้เรกคอร์ดเดิม โดยคงสถานะ/ผลพิจารณาที่ผู้ใช้บันทึกไว้
      return list.map(r => {
        const s = seedById[r.id];
        if (!s) return r;
        return { ...s, ...r, detail: s.detail };
      });
    }
  } catch (e) {}
  return window.DBA_SEED.map(r => ({ ...r }));
};
window.dbaSaveLS = (list) => {
  try { localStorage.setItem('debt_approvals', JSON.stringify(list)); } catch (e) {}
};

// ─── ส่งใบคำขอเข้าคิวรออนุมัติ (เรียกจากหน้าจอบันทึกของแต่ละเมนู) ─────
window.dbaNextReqNo = (beYear) => {
  const list = window.dbaLoad();
  let mx = 152;
  list.forEach(r => { const m = /^REQ-\d+-(\d+)$/.exec(r.id || ''); if (m) { const n = parseInt(m[1], 10); if (n > mx) mx = n; } });
  return `REQ-${beYear}-${String(mx + 1).padStart(4, '0')}`;
};
window.dbaPush = (rec) => {
  const list = window.dbaLoad();
  list.unshift(rec);
  window.dbaSaveLS(list);
  return rec;
};
