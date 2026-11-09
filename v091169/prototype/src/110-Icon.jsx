// Sidebar, Topbar, MemberHeader, TabBar — chrome of the ERP

const { useState, useEffect, useMemo, useRef } = React;

// ─── Minimal inline-SVG icon set (stroke-based, 16x16) ───────────────
const Icon = ({ name, size = 16 }) => {
  const paths = {
    dashboard: "M3 13V8.5L8 4l5 4.5V13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z",
    members: "M5.5 7.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm-2 6c0-1.7 1.8-3 4-3s4 1.3 4 3v.5h-8v-.5Zm8.5-8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-.5 4.5c1.5 0 3 .8 3 2.2v.3h-2.7",
    loans: "M2.5 4.5h11v8h-11zM4.5 8h2M9.5 8h2M5 11h6",
    shares: "M3 13l3-4 3 3 4-6M11 6h2v2",
    guarantee: "M8 2l4 1.5v4.5c0 3-2 5-4 6-2-1-4-3-4-6V3.5L8 2Z",
    receipt: "M4 2h7l2 2v10l-1.5-1L10 14l-1.5-1L7 14l-1.5-1L4 14V2Zm2 4h6m-6 3h6m-6 3h4",
    report: "M3 3v10h10M6 10l2-3 2 2 3-4",
    cog: "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0-3v1.5m0 8V13.5M2.5 8h1.5m8 0h1.5M4 4l1 1m6 6 1 1M4 12l1-1m6-6 1-1",
    calendar: "M3 4h10v9H3zM3 7h10M5 2v3M11 2v3M6 10h1M9 10h1",
    search: "M11.5 11.5l3 3M7 13a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z",
    bell: "M8 2.5a4 4 0 0 0-4 4v2L2.5 11h11L12 8.5v-2a4 4 0 0 0-4-4Zm-1.5 9.5a1.5 1.5 0 0 0 3 0",
    chevDown: "m4 6 4 4 4-4",
    chevRight: "m6 4 4 4-4 4",
    chevLeft: "m10 4-4 4 4 4",
    menu: "M3 5h10M3 8h10M3 11h10",
    menuFold: "M2.5 4h11M2.5 12h11M9 8h4.5M2.5 8h3.5M7 6l-2 2 2 2",
    plus: "M8 3v10M3 8h10",
    edit: "m3 13 1-3 7-7 2 2-7 7-3 1Z",
    download: "M8 2v8m-3-3 3 3 3-3M3 13h10",
    upload: "M8 10V2m-3 3 3-3 3 3M3 13h10",
    attach: "M12 7.5 7.5 12a2.5 2.5 0 0 1-3.5-3.5l5-5a1.6 1.6 0 0 1 2.3 2.3l-5 5",
    filter: "M3 4h10l-4 5v3l-2 1V9L3 4Z",
    close: "m4 4 8 8M12 4l-8 8",
    info: "M8 7v4M8 5v.5M2.5 8a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z",
    warning: "M8 1.9 14.9 13.6H1.1L8 1.9ZM8 6.3v3.2M8 11.3v.5",
    check: "m3 8 3 3 7-7",
    user: "M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5 6c0-2.8 2.2-5 5-5s5 2.2 5 5",
    member: "M2 4.3h12v7.4H2zM5.4 8a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3ZM3.7 10.8c0-1 .8-1.6 1.7-1.6s1.7.6 1.7 1.6M9.3 7h3.2M9.3 9.2h3.2",
    history: "M8 4v4l3 2M2.5 8a5.5 5.5 0 1 0 11 0 5.5 5.5 0 0 0-11 0Zm0 0h2",
    logout: "M8 2.3V8M5.2 4.7a4.6 4.6 0 1 0 5.6 0",
    print: "M5 5V2h6v3M3.5 5.5h9v5h-2v3h-5v-3h-2v-5Z",
    money: "M2.5 4.5h11v7h-11zM8 6v4M6.5 7.5h3M6.5 9h3",
    eye: "M1.5 8s2-5 6.5-5 6.5 5 6.5 5-2 5-6.5 5-6.5-5-6.5-5ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    moon: "M13 9.5A5 5 0 0 1 6.5 3a.5.5 0 0 0-.7-.6 6 6 0 1 0 7.8 7.8.5.5 0 0 0-.6-.7Z",
    sun: "M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm0-3V1m0 14v-1.5m5.5-5.5H15M1 8h1.5m1.6-3.9 1 1m6.8 6.8 1 1m-8.8 0 1-1m6.8-6.8 1-1",
    sort: "M5 4l-2 2h4l-2-2Zm6 8 2-2H9l2 2Z",
    sortAsc: "m4 10 4-4 4 4",
    sortDesc: "m4 6 4 4 4-4",
    column: "M3 3h3v10H3zM10 3h3v10h-3z",
    refresh: "M13 8a5 5 0 1 1-1.5-3.5M13 2v3h-3",
    barcode: "M2.5 4v8M4.5 4v8M6 4v8M8 4v8M10 4v8M11.5 4v8M13.5 4v8",
    lock: "M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v6.5h-9zM8 9.5v2",
    unlock: "M4.5 7V5a3.5 3.5 0 0 1 6.9-.8M3.5 7h9v6.5h-9zM8 9.5v2",
    wallet: "M2.5 4.5h11v8h-11zM2.5 7h11M11 9.5h1.5",
    swap: "M2.5 5.5h9l-2.5-2.5M13.5 10.5h-9l2.5 2.5",
    bank: "M8 2.5 2.5 5.5h11L8 2.5ZM4 7v4.5M6.5 7v4.5M9.5 7v4.5M12 7v4.5M2.5 13.5h11",
    shield: "M8 2l4.5 1.7v4c0 3.2-2.2 5.4-4.5 6.3-2.3-.9-4.5-3.1-4.5-6.3v-4L8 2Zm-2 6 1.5 1.5L10.5 6",
    trash: "M2.1 4.6h11.8M6 4.6V3.7a1.1 1.1 0 0 1 1.1-1.1h1.8A1.1 1.1 0 0 1 10 3.7v.9M3.8 4.6l.68 8.1a1.35 1.35 0 0 0 1.35 1.25h4.34a1.35 1.35 0 0 0 1.35-1.25l.68-8.1M6.5 7.1v4.1M9.5 7.1v4.1",
    mail: "M2.5 4h11v8h-11zM2.5 4.5 8 9l5.5-4.5",
    database: "M8 2.5c2.8 0 5 .8 5 1.8S10.8 6 8 6 3 5.3 3 4.3 5.2 2.5 8 2.5ZM3 4.3v7.4c0 1 2.2 1.8 5 1.8s5-.8 5-1.8V4.3M3 8c0 1 2.2 1.8 5 1.8s5-.8 5-1.8",
    copy: "M5.5 5.5V3.5h7v7h-2M3.5 5.5h7v7h-7z",
    insert: "M8 3.5v9M3.5 8h9M2.5 2.5h11",
    dots: "M8 3.2v.2M8 8v.2M8 12.8v.2",
    send: "M14 2 7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2Z",
    home: "M2.5 7.5 8 3l5.5 4.5M4 6.7V13h8V6.7M6.5 13V9.5h3V13",
    userPlus: "M7 8a2.6 2.6 0 1 0 0-5.2A2.6 2.6 0 0 0 7 8Zm-4.5 6c0-2.6 2-4.3 4.5-4.3.8 0 1.6.2 2.3.5M11.6 10.3v4M9.6 12.3h4"
  };
  // Ant Design · PrinterOutlined (สีตาม currentColor ของปุ่มเดิม)
  if (name === 'print') return (
    <svg width={size} height={size} viewBox="64 64 896 896" fill="currentColor" aria-hidden="true" data-icon={name} style={{ flexShrink: 0 }}>
      <path d="M820 436h-40c-4.4 0-8 3.6-8 8v40c0 4.4 3.6 8 8 8h40c4.4 0 8-3.6 8-8v-40c0-4.4-3.6-8-8-8zm32-104H732V120c0-4.4-3.6-8-8-8H300c-4.4 0-8 3.6-8 8v212H172c-44.2 0-80 35.8-80 80v328c0 17.7 14.3 32 32 32h168v132c0 4.4 3.6 8 8 8h424c4.4 0 8-3.6 8-8V772h168c17.7 0 32-14.3 32-32V412c0-44.2-35.8-80-80-80zM360 180h304v152H360V180zm304 664H360V568h304v276zm200-140H732V500H292v204H160V412c0-6.6 5.4-12 12-12h680c6.6 0 12 5.4 12 12v292z" />
    </svg>);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
    stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d={paths[name] || ''} />
    </svg>);

};

// ─── Sidebar ─────────────────────────────────────────────────────────
// โครงสร้างเมนู 9 ระบบ — แต่ละระบบมี 3 กลุ่มย่อย: การทำงาน / รายงาน / ค่าคงที่
const NAV_TOP = [
  { id: 'members', icon: 'members',   label: 'ทะเบียนสมาชิก', badge: '2,481', route: { view: 'search' } },
  { id: 'dt-member-status', icon: 'swap', label: 'แจ้งเปลี่ยนสถานะ', route: { view: 'debt', page: 'member-status' } },
  { id: 'top-voucher-adv', icon: 'money', label: 'ใบสำคัญจ่าย / เงินทดรอง', children: [
    { id: 'ac-voucher', label: 'ใบสำคัญจ่าย', route: { view: 'account', page: 'voucher' } },
    { id: 'fn-advance', label: 'ขอยืมเงินทดรอง', route: { view: 'finance', page: 'advance' } },
    { id: 'fn-advance-return', label: 'คืนเงินทดรอง', route: { view: 'finance', page: 'advance-return' } },
  ] },
  // ระบบรายงานสหกรณ์ — ยังไม่ซิงก์ (แสดงปุ่มไว้ก่อน)
  { id: 'reports', icon: 'report', label: 'ระบบรายงาน' },
];
const NAV_SYSTEMS = [
  { id: 'credit', icon: 'loans', label: 'สินเชื่อ', groups: [
    { kind: 'work', label: '', items: [
      { id: 'cr-req',      label: 'ใบคำขอกู้เงิน', route: { view: 'loan', page: 'request' } },
      { id: 'cr-req-special', label: 'บันทึกจ่ายเงินกู้พิเศษ', route: { view: 'loan', page: 'request-special' } },
      { id: 'cr-approve',  label: 'อนุมัติสินเชื่อ', route: { view: 'loan', page: 'approve' } },
      { id: 'cr-return',   label: 'ขอส่งคืนคำขอกู้', route: { view: 'loan', page: 'return' }, hidden: true },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'cr-payout',   label: 'เบิกเงินกู้ค้างจ่าย', route: { view: 'loan', page: 'payout' } },
      { id: 'cr-guar',     label: 'ตรวจสอบสิทธิค้ำ', route: { view: 'loan', page: 'guarantee-check' } },
      { id: 'cr-contract-adjust', label: 'ปรับปรุงรายละเอียดสัญญา', route: { view: 'loan', page: 'contract-adjust' } },
      // [ซ่อนไว้ — เก็บไว้ใช้ภายหลัง] { id: 'cr-loan-control', label: 'ควบคุมเงินกู้', route: { view: 'loan', page: 'loan-control' } },
      // [ซ่อนไว้ — เก็บไว้ใช้ภายหลัง] { id: 'cr-atm-activities', label: 'ATM Activities', route: { view: 'loan', page: 'atm-activities' } },
      { id: 'cr-interest', label: 'ประมาณการดอกเบี้ย', route: { view: 'loan', page: 'interest' } },
      { id: 'cr-schedule', label: 'ตารางการชำระเงิน', route: { view: 'loan', page: 'schedule' } },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'cr-payment-order', label: 'ใบสั่งชำระเงิน', route: { view: 'loan', page: 'payment-order' } },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'cr-lot',      label: 'กำหนด Lot จ่ายเงินกู้', route: { view: 'loan', page: 'lot' } },
      { id: 'cr-dividend', label: 'โอนปันผล–เข้ารับจ่าย', route: { view: 'loan', page: 'dividend' } },
      { id: 'cr-int-cert', label: 'ออกหนังสือรับรองดอกเบี้ย', route: { view: 'loan', page: 'int-cert' } },
    ] },
    { kind: 'work', items: [
      { id: 'cr-cancel-group', label: 'งานยกเลิก', children: [
        { id: 'cr-cancel-disburse', label: 'ยกเลิกจ่ายเงินประจำวัน', route: { view: 'loan', page: 'cancel-disbursement' } },
        { id: 'cr-cancel-resign', label: 'ยกเลิกลาออก', route: { view: 'loan', page: 'cancel-resign' } },
        // [ซ่อนไว้ — เก็บไว้ใช้ภายหลัง] { id: 'cr-cancel-emreq', label: 'ยกเลิกคำขอกู้เงิน ฉ.โอน', route: { view: 'loan', page: 'cancel-em-request' } },
        { id: 'cr-cancel-special-pay', label: 'ยกเลิกชำระพิเศษ', route: { view: 'loan', page: 'cancel-special-pay' } },
        { id: 'cr-cancel-special-order', label: 'ยกเลิกใบสั่งชำระพิเศษ', route: { view: 'loan', page: 'cancel-special-order' } },
        { id: 'cr-cancel-contract', label: 'ยกเลิกสัญญาเงินกู้', route: { view: 'loan', page: 'cancel-contract' } },
      ] },
    ] },
    { kind: 'config', label: '', items: [
      { id: 'cr-cfg-group', label: 'ค่าคงที่', children: [
        { id: 'cr-cfg-type', label: 'ประเภทเงินกู้', route: { view: 'loan', page: 'loan-type' } },
        { id: 'cr-cfg-project', label: 'โครงการเงินกู้', route: { view: 'loan', page: 'loan-project' } },
        { id: 'cr-cfg-intrate', label: 'อัตราดอกเบี้ยเงินกู้', route: { view: 'loan', page: 'int-rate' } },
        { id: 'cr-cfg-salaryremain', label: 'กำหนดเงินเดือนคงเหลือ', route: { view: 'loan', page: 'salary-remain' } },
        { id: 'cr-cfg-limitgroup', label: 'วงเงินกู้กลุ่ม', route: { view: 'loan', page: 'loan-group' } },
        { id: 'cr-cfg-guarlimit', label: 'กำหนดวงเงินค้ำประกัน', route: { view: 'loan', page: 'guar-limit' } },
        { id: 'cr-cfg-guarcount', label: 'กำหนดจำนวนคนค้ำประกัน', route: { view: 'loan', page: 'guar-count' } },
        { id: 'cr-cfg-terms', label: 'ข้อกำหนดสินเชื่อ', route: { view: 'loan', page: 'loan-terms' } },
        { id: 'cr-cfg-purpose2', label: 'วัตถุประสงค์การกู้', route: { view: 'loan', page: 'purpose-const-v2' } },
      ] },
    ] },
  ] },
  // ระบบหลักทรัพย์ — แยกจากระบบสินเชื่อ (หน้าจอ/ข้อมูลเดิม ใช้ร่วมกับใบคำขอกู้ นิติกรรม และเบิกเงินกู้)
  { id: 'collateral', icon: 'bank', label: 'หลักทรัพย์', groups: [
    { kind: 'work', label: '', items: [
      { id: 'cr-collateral', label: 'บันทึกหลักทรัพย์', route: { view: 'loan', page: 'collateral' } },
      { id: 'cr-survey', label: 'นัดหมายออกสำรวจหลักทรัพย์', route: { view: 'loan', page: 'survey' } },
      { id: 'cr-appraisal', label: 'สำรวจหลักทรัพย์', route: { view: 'loan', page: 'appraisal' } },
      { id: 'cr-legal-act', label: 'นิติกรรม', route: { view: 'loan', page: 'legal-act' } },
    ] },
  ] },
  { id: 'claims', icon: 'guarantee', label: 'ขอสินไหม / ประกันสมาชิก', groups: [
    { kind: 'work', label: '', items: [
      { id: 'cl-eligibility', label: 'ตรวจสอบสิทธิการเข้าโครงการประกัน', route: { view: 'claims', page: 'eligibility' } },
      { id: 'cl-register', label: 'บันทึกทะเบียนขอสินไหม', route: { view: 'claims', page: 'register' } },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'cr-insure-renew', label: 'จัดการประกันภัยสมาชิก', route: { view: 'loan', page: 'insurance-renewal' } },
      { id: 'cr-insurance-arrears', label: 'บันทึกเบี้ยประกันค้าง', route: { view: 'loan', page: 'insurance-arrears' } },
      { id: 'cl-cremation', label: 'สมาชิก สสอร. / สส.ชสอ.', route: { view: 'claims', page: 'cremation-members' } },
    ] },
    { kind: 'config', label: '', items: [
      { id: 'cl-cfg-group', label: 'ค่าคงที่', children: [
        { id: 'cr-cfg-insurer', label: 'บริษัทประกันภัย', route: { view: 'loan', page: 'insurer-config' } },
      ] },
    ] },
  ] },
  { id: 'deposit', icon: 'wallet', label: 'เงินฝาก', groups: [
    { kind: 'work', label: '', items: [
      { id: 'dp-ct-open',  label: 'เปิดเคาน์เตอร์', route: { view: 'deposit', page: 'counter-open' } },
      { id: 'dp-ct-close', label: 'ปิดเคาน์เตอร์', route: { view: 'deposit', page: 'counter-close' } },
      { id: 'dp-basic',    label: 'ข้อมูลพื้นฐาน', route: { view: 'deposit', page: 'basic-info' } },
      { id: 'dp-daily', label: 'งานประจำวัน', children: [
        { id: 'dp-open',        label: 'เปิดบัญชีเงินฝาก', route: { view: 'deposit', page: 'open' } },
        { id: 'dp-counter',     label: 'ฝาก / ถอน / โอน / ปิดบัญชี', route: { view: 'deposit', page: 'counter' } },
        { id: 'dp-counter-loan', label: 'ยืมเงินระหว่างเคาน์เตอร์', hidden: true, route: { view: 'deposit', page: 'counter-loan' } },
        { id: 'dp-counter-vault', label: 'เบิกเงิน/คืนเงิน', hidden: true, route: { view: 'deposit', page: 'counter-vault' } },
        { id: 'dp-approve',     label: 'อนุมัติทำรายการ', route: { view: 'deposit', page: 'approve' } },
        { id: 'dp-chq-return',  label: 'คืนเช็ค', route: { view: 'deposit', page: 'cheque-return' } },
        { id: 'dp-ma-deposit',  label: 'ฝาก / ถอนหลายยอด', route: { view: 'deposit', page: 'multi-deposit' } },
        { id: 'dp-ma-withdraw', label: 'ถอนหลายยอด', hidden: true, route: { view: 'deposit', page: 'multi-withdraw' } },
      ] },
      { id: 'dp-adjust', label: 'ปรับปรุง', children: [
        { id: 'dp-cancel',     label: 'ยกเลิกรายการ', route: { view: 'deposit', page: 'cancel' } },
        { id: 'dp-edit-acc',   label: 'แก้ไขรายละเอียดประเภทบัญชี', route: { view: 'deposit', page: 'edit-account' } },
        { id: 'dp-freeze',     label: 'อายัดบัญชี', route: { view: 'deposit', page: 'freeze' } },
      ] },
      { id: 'dp-request', label: 'คำร้อง', children: [
        { id: 'dp-monthly',    label: 'เปลี่ยนแปลงฝากรายเดือน', route: { view: 'deposit', page: 'monthly-change' } },
        { id: 'dp-ext-person', label: 'เพิ่มแก้ไขบุคคลภายนอก', route: { view: 'deposit', page: 'external-person' } },
        { id: 'dp-atm',        label: 'ขอผูกบัญชีเงินฝาก KTB', route: { view: 'deposit', page: 'atm' } },
        { id: 'dp-atm-close',  label: 'ขอปิดการผูกบัญชีเงินฝาก KTB', route: { view: 'deposit', page: 'atm-close' } },
      ] },
      { id: 'dp-transfer', label: 'โอนรายการ', children: [
        { id: 'dp-md-welfare',     label: 'ฝากเงินสวัสดิการ', route: { view: 'deposit', page: 'md-welfare' } },
        { id: 'dp-md-scholarship', label: 'ฝากเงินทุนการศึกษา', route: { view: 'deposit', page: 'md-scholarship' } },
        { id: 'dp-md-salary',      label: 'ฝากเงินเดือนเจ้าหน้าที่', route: { view: 'deposit', page: 'md-salary' } },
        { id: 'dp-md-dividend',    label: 'ฝากปันผล', route: { view: 'deposit', page: 'md-dividend' } },
        { id: 'dp-md-meeting',     label: 'ฝากโอนเบี้ยประชุมและเลือกตั้ง', route: { view: 'deposit', page: 'md-meeting' } },
        { id: 'dp-proc-open',      label: 'ประมวลผลเปิดบัญชีเงินฝาก', route: { view: 'deposit', page: 'proc-open' } },
      ] },
      { id: 'dp-other', label: 'งานอื่นๆ', children: [
        { id: 'dp-int-accrued-calc', label: 'คำนวณดอกเบี้ยค้าง', route: { view: 'deposit', page: 'interest-accrued-calc' } },
        { id: 'dp-poontawee', label: 'ประมวลผลตัดหุ้นพูนทวี', route: { view: 'deposit', page: 'poontawee' } },
        { id: 'dp-int-proj', label: 'ประมาณการดอกเบี้ย', route: { view: 'deposit', page: 'interest-projection' } },
        { id: 'dp-int-advance', label: 'ประมาณการจ่ายดอกเบี้ยล่วงหน้า', route: { view: 'deposit', page: 'interest-advance' } },
        { id: 'dp-tax-pnd2', label: 'ข้อมูลภาษีส่งสรรพากร (ภ.ง.ด.2)', route: { view: 'deposit', page: 'pnd2' } },
      ] },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'dp-default', label: 'ประมวลผิดนัดการฝาก', route: { view: 'deposit', page: 'default-process' } },
      { id: 'dp-cutoff',  label: 'ประมวลผลตัดยอดเงินฝาก', route: { view: 'deposit', page: 'cutoff' } },
    ] },
    { kind: 'work', label: 'ฝากหลายประเภท', items: [
      { id: 'dp-md-loan',        label: 'ฝากเงินกู้', route: { view: 'deposit', page: 'md-loan' } },
    ] },
    { kind: 'work', label: '', items: [
      { id: 'dp-int-group', label: 'ดอกเบี้ย', children: [
        { id: 'dp-int-calc',    label: 'คำนวณดอกเบี้ย', route: { view: 'deposit', page: 'interest-calc' } },
        { id: 'dp-int-pay',     label: 'จ่ายดอกเบี้ย', route: { view: 'deposit', page: 'interest-pay' } },
        { id: 'dp-int-accrued', label: 'ดอกเบี้ยค้างจ่าย', route: { view: 'deposit', page: 'interest-accrued' } },
        { id: 'dp-rate-change', label: 'เปลี่ยนแปลงอัตราดอกเบี้ย', route: { view: 'deposit', page: 'rate-change' } },
      ] },
      { id: 'dp-doc-group', label: 'เอกสารและนำเข้า–ส่งออก', children: [
        { id: 'dp-funeral', label: 'หักเงิน ฌปท / ฌาปนกิจ', route: { view: 'deposit', page: 'funeral' } },
        { id: 'dp-passbook', label: 'สมุดคู่ฝาก / Auto Passbook', route: { view: 'deposit', page: 'passbook' } },
        { id: 'dp-tax-cert', label: 'หนังสือรับรองภาษี', route: { view: 'deposit', page: 'tax-cert' } },
        { id: 'dp-import', label: 'นำเข้ารายการฝาก', route: { view: 'deposit', page: 'import' } },
        { id: 'dp-bank-file', label: 'Export File ธนาคาร', route: { view: 'deposit', page: 'bank-file' } },
      ] },
    ] },
    { kind: 'report', label: '', items: [
      { id: 'dp-rpt-group', label: 'รายงาน', children: [
        { id: 'dp-rpt-balance',        label: 'รายงานยอดเงินฝาก' },
        { id: 'dp-rpt-bal-by-org',     label: 'รายงานยอดคงเหลือ ณ ปัจจุบันตามสังกัด' },
        { id: 'dp-rpt-bal-ind',        label: 'รายงานยอดคงเหลือรายตัว' },
        { id: 'dp-rpt-bal-ind-detail', label: 'รายงานยอดคงเหลือรายตัวแสดงรายละเอียด' },
        { id: 'dp-rpt-interest',       label: 'รายงานดอกเบี้ยจ่าย' },
        { id: 'dp-rpt-passbook-mem',   label: 'รายงานสมาชิกที่มีสมุดเงินฝาก' },
        { id: 'dp-rpt-gift',           label: 'รายงานการจ่ายของขวัญเงินฝาก' },
      ] },
    ] },
    { kind: 'config', items: [
      { id: 'dp-cfg-sys', label: 'ข้อกำหนดระบบเงินฝาก', route: { view: 'deposit', page: 'sys-config' } },
      { id: 'dp-cfg-type', label: 'ประเภทเงินฝาก', route: { view: 'deposit', page: 'acc-type' } },
      { id: 'dp-cfg-inttable', label: 'อัตราดอกเบี้ยเงินฝาก', route: { view: 'deposit', page: 'int-table' } },
      { id: 'dp-cfg-project', label: 'โครงการประเภทเงินฝาก', route: { view: 'deposit', page: 'dep-project' } },
      { id: 'dp-cs-detitem', label: 'รหัสรายการ', route: { view: 'deposit', page: 'const-detitem' } },
      { id: 'dp-cs-depgroup', label: 'รหัสกลุ่มรายการ', route: { view: 'deposit', page: 'const-depgroup' } },
      { id: 'dp-cs-depkind', label: 'ประเภทกลุ่มเงินฝาก', route: { view: 'deposit', page: 'const-depkind' } },
      { id: 'dp-cs-moneygroup', label: 'ประเภทกลุ่มเงิน', route: { view: 'deposit', page: 'const-moneygroup' } },
      { id: 'dp-cs-moneytype', label: 'กำหนดประเภทเงินทำรายการ', route: { view: 'deposit', page: 'const-moneytype' } },
      { id: 'dp-cs-txnpair', label: 'ประเภทคู่บัญชี', route: { view: 'deposit', page: 'const-txnpair' } },
      { id: 'dp-cfg-txntype', label: 'กำหนดประเภทการทำรายการ', route: { view: 'deposit', page: 'txn-type' } },
      { id: 'dp-cs-chqcancel', label: 'เหตุผลการยกเลิกเช็ค', route: { view: 'deposit', page: 'const-chqcancel' } },
      { id: 'dp-cs-freezereason', label: 'เหตุผลการอายัดบัญชี', route: { view: 'deposit', page: 'const-freezereason' } },
      { id: 'dp-cs-holdertype', label: 'ประเภทผู้ถือบัญชี', route: { view: 'deposit', page: 'const-holdertype' } },
      { id: 'dp-cs-signer', label: 'ผู้ลงนามหนังสือรับรองเงินฝาก', route: { view: 'deposit', page: 'const-signer' } },
      { id: 'dp-cfg-passbook', label: 'ตั้งค่าพิมพ์สมุดคู่ฝาก', route: { view: 'deposit', page: 'passbook-cfg' } },
    ] },
  ] },
  { id: 'process', icon: 'receipt', label: 'ประมวลผลและจัดเก็บ', groups: [
    { kind: 'work', items: [
      { id: 'pc-credit-group', label: 'สินเชื่อ', children: [
        { id: 'pc-cd-inst-approve', label: 'อนุมัติเปลี่ยนแปลงงวดชำระ', route: { view: 'process', page: 'inst-approve' } },
        { id: 'pc-cd-ban', label: 'ห้ามกู้', route: { view: 'loan', page: 'ban' } },
        { id: 'pc-cd-legal-status', label: 'เปลี่ยนแปลงสถานะทางกฎหมาย', route: { view: 'process', page: 'legal-status' } },
        { id: 'pc-cd-contract-change', label: 'เปลี่ยนแปลงรายละเอียดสัญญา', route: { view: 'debt', page: 'contract-change' } },
        { id: 'pc-cd-accrued-int', label: 'ปรับยอดดอกเบี้ยสะสม', route: { view: 'process', page: 'accrued-interest-adjust' } },
        { id: 'pc-cd-share-adjust', label: 'ปรับเพิ่ม-ลด หุ้น', route: { view: 'process', page: 'share-adjust' } },
        { id: 'pc-cd-debt-adjust', label: 'ปรับเพิ่ม-ลดหนี้', route: { view: 'process', page: 'debt-adjust' } },
        { id: 'pc-cd-collect-stop', label: 'ใบคำขอหยุดเก็บหนี้', route: { view: 'process', page: 'collect-stop' } },
        { id: 'pc-cd-inst-change-req', label: 'ใบคำขอเปลี่ยนแปลงงวดชำระ', route: { view: 'process', page: 'inst-change-req' } },
        { id: 'pc-cd-agent-affil', label: 'กำหนดสังกัดลูกหนี้ตัวแทน', route: { view: 'process', page: 'agent-affil' } },
      ] },
      { id: 'pc-close-group', label: 'ประมวลผล', children: [
        { id: 'pc-cl-day', label: 'ปิดงานประจำวัน', route: { view: 'process', page: 'day-close-run' } },
        { id: 'pc-cl-month', label: 'ปิดงานประจำเดือน', route: { view: 'process', page: 'month-close-run' } },
        { id: 'pc-cl-year', label: 'ปิดสิ้นปี', route: { view: 'process', page: 'year-close-run' } },
        { id: 'pc-cl-confirm', label: 'จัดทำหนังสือยืนยันยอด', route: { view: 'process', page: 'balance-confirm' } },
        { id: 'pc-cl-debt-term', label: 'จัดทำหนี้สั้นยาว', route: { view: 'process', page: 'debt-term' } },
        { id: 'pc-cl-rate', label: 'ประมวลผลปรับอัตราดอกเบี้ย', route: { view: 'process', page: 'rate-adjust' } },
        { id: 'pc-cl-gift', label: 'ประมวลผลหุ้นของขวัญ', route: { view: 'process', page: 'gift-share' } },
        { id: 'pc-cl-gift-cut', label: 'ตัดยอดรายการหุ้นของขวัญ', route: { view: 'process', page: 'gift-share-cut' } },
        { id: 'pc-cl-year-debt', label: 'ประมวลผลปิดสิ้นปี (หนี้)', route: { view: 'process', page: 'year-close-debt' } },
        { id: 'pc-cl-year-share', label: 'ประมวลผลปิดสิ้นปี (หุ้น)', route: { view: 'process', page: 'year-close-share' } },
        { id: 'pc-cl-meeting-fee', label: 'ค่าเบี้ยประชุมค้างจ่าย', route: { view: 'process', page: 'meeting-fee' } },
      ] },
      { id: 'pc-dividend-group', label: 'ปันผล–เฉลี่ยคืน', children: [
        { id: 'pc-dv-estimate', label: 'ประมาณปันผล', route: { view: 'process', page: 'dividend-estimate' } },
        { id: 'pc-dv-process', label: 'ประมวลปันผล', route: { view: 'process', page: 'dividend-process' } },
        { id: 'pc-dv-key', label: 'ประมวลตั้งค่าคีย์ปันผลเฉลี่ยคืน', route: { view: 'process', page: 'dividend-key-setup' } },
      ] },
      { id: 'pc-cancel-group', label: 'ยกเลิก', children: [
        { id: 'pc-cx-monthly-receipt', label: 'ยกเลิกใบเสร็จรับเงินรายเดือน', route: { view: 'process', page: 'cancel-monthly-receipt' } },
        { id: 'pc-cx-share-withdraw', label: 'ยกเลิกถอนหุ้น', route: { view: 'process', page: 'cancel-share-withdraw' } },
        { id: 'pc-cx-resign', label: 'ยกเลิกการลาออก', route: { view: 'process', page: 'cancel-resign' } },
        { id: 'pc-cx-loan-contract', label: 'ยกเลิกสัญญาเงินกู้', route: { view: 'process', page: 'cancel-loan-contract' } },
        { id: 'pc-cx-receipt-return', label: 'ยกเลิกคืนใบเสร็จ', route: { view: 'process', page: 'cancel-receipt-return' } },
        { id: 'pc-cx-loan-payout', label: 'ยกเลิกการจ่ายเงินกู้', route: { view: 'process', page: 'cancel-loan-payout' } },
        { id: 'pc-cx-special-order', label: 'ยกเลิกใบสั่งชำระพิเศษ', route: { view: 'process', page: 'cancel-special-order' } },
        { id: 'pc-cx-special-pay', label: 'ยกเลิกชำระพิเศษ', route: { view: 'process', page: 'cancel-special-pay' } },
      ] },
      { id: 'pc-member-group', label: 'สมาชิก', children: [
        { id: 'pc-mb-resign-approve', label: 'อนุมัติลาออก', route: { view: 'process', page: 'resign-approve' } },
        { id: 'pc-mb-share-change-approve', label: 'อนุมัติเปลี่ยนแปลงค่าหุ้น', route: { view: 'process', page: 'share-change-approve' } },
        { id: 'pc-mb-member-close', label: 'ปิดบัญชีสมาชิก', route: { view: 'process', page: 'member-close' } },
        { id: 'pc-mb-resign-form', label: 'ใบลาออก', route: { view: 'process', page: 'resign-form' } },
        { id: 'pc-mb-affil-transfer', label: 'ใบย้ายสังกัด', route: { view: 'process', page: 'affil-transfer-form' } },
        { id: 'pc-mb-share-change-form', label: 'ใบเปลี่ยนแปลงค่าหุ้น', route: { view: 'process', page: 'share-change-form' } },
        { id: 'pc-mb-share-partial', label: 'ถอนหุ้นบางส่วน', route: { view: 'process', page: 'share-partial-withdraw' } },
        { id: 'pc-mb-share-refund', label: 'คืนค่าหุ้น', route: { view: 'process', page: 'share-refund-pay' } },
      ] },
      { id: 'pc-monthly-group', label: 'รายเดือน', children: [
        { id: 'pc-mo-member-payout', label: 'จ่ายเงินให้สมาชิก', route: { view: 'process', page: 'member-payout' } },
        { id: 'pc-mo-collect', label: 'ประมวลผลเรียกเก็บ', route: { view: 'process', page: 'monthly-collect' } },
        { id: 'pc-mo-cutoff', label: 'ประมวลผลตัดยอด', route: { view: 'process', page: 'monthly-cutoff' } },
        { id: 'pc-mo-disk', label: 'ขึ้นแผ่นจัดเก็บ', route: { view: 'process', page: 'collect-disk' } },
        { id: 'pc-mo-other', label: 'รายการเรียกเก็บอื่น ๆ', route: { view: 'process', page: 'collect-other' } },
        { id: 'pc-mo-cutoff-disk', label: 'ตัดยอดเรียกเก็บจากแผ่น', route: { view: 'process', page: 'collect-cutoff-disk' } },
        { id: 'pc-mo-receipt-return', label: 'คืนใบเสร็จ', route: { view: 'process', page: 'receipt-return' } },
      ] },
      { id: 'pc-tax-cert', label: 'ส่งข้อมูลหนังสือรับรองดอกเบี้ยให้สรรพากร', route: { view: 'process', page: 'tax-cert' } },
    ] },
    { kind: 'report', items: [
      { id: 'pc-rpt-collect', label: 'รายงานการเรียกเก็บ' },
      { id: 'pc-rpt-arrear',  label: 'รายงานค้างชำระ' },
    ] },
    { kind: 'config', items: [
      { id: 'pc-const-group', label: 'ค่าคงที่', children: [
        { id: 'pc-cfg-sysstatus', label: 'กำหนดรายละเอียดระบบ (สถานะระบบ)', route: { view: 'process', page: 'system-status' } },
        { id: 'pc-cfg-affil', label: 'ข้อกำหนดรายละเอียดสังกัด', route: { view: 'process', page: 'affil-detail' } },
        { id: 'pc-cfg-share', label: 'ข้อกำหนดประเภทหุ้น', route: { view: 'process', page: 'share-terms' } },
        { id: 'pc-cfg-approval', label: 'กำหนดระดับการอนุมัติ', route: { view: 'process', page: 'approval-level' } },
      ] },
      { id: 'pc-const-item-group', label: 'ค่าคงที่ประเภทรายการ', children: [
        { id: 'pc-ci-keep', label: 'ประเภทคู่บัญชี (Keep)', route: { view: 'process', page: 'const-keep' } },
        { id: 'pc-ci-keepitem', label: 'รหัสรายการ (KeepItem)', route: { view: 'process', page: 'const-keepitem' } },
      ] },
      { id: 'pc-const-member-group', label: 'ค่าคงที่ระบบสมาชิก', children: [
        { id: 'pc-cm-prefix', label: 'คำนำหน้านาม', route: { view: 'process', page: 'const-prefix' } },
        { id: 'pc-cm-affil', label: 'สังกัดสมาชิก', route: { view: 'process', page: 'const-member-affil' } },
        { id: 'pc-cm-position', label: 'ตำแหน่ง', route: { view: 'process', page: 'const-position' } },
        { id: 'pc-cm-apply', label: 'ประเภทการสมัคร', route: { view: 'process', page: 'const-apply-type' } },
        { id: 'pc-cm-relation', label: 'ความสัมพันธ์ผู้รับโอนผลประโยชน์', route: { view: 'process', page: 'const-relation' } },
        { id: 'pc-cm-resign', label: 'สาเหตุการลาออก', route: { view: 'process', page: 'const-resign-reason' } },
        { id: 'pc-cm-mtype', label: 'ประเภทสมาชิก', route: { view: 'process', page: 'const-member-type' } },
        { id: 'pc-cm-shritem', label: 'รหัสรายการ (ShrItem)', route: { view: 'process', page: 'const-shritem' } },
        { id: 'pc-cm-mstatus', label: 'สถานะการเป็นสมาชิก', route: { view: 'process', page: 'const-member-status' } },
        { id: 'pc-cm-statusnote', label: 'หมายเหตุสถานะ', route: { view: 'process', page: 'const-status-note' } },
      ] },
      { id: 'pc-cfg-period', label: 'งวดเรียกเก็บ' },
    ] },
  ] },
  { id: 'finance', icon: 'money', label: 'การเงิน', groups: [
    { kind: 'work', label: '', items: [
      { id: 'fn-day-open', label: 'เปิดงานประจำวัน', route: { view: 'finance', page: 'day-open' } },
      { id: 'fn-day-close', label: 'ปิดงานประจำวัน', route: { view: 'finance', page: 'day-close' } },
      { id: 'fn-daily-group', label: 'ประจำวัน', children: [
        { id: 'fn-cash-check', label: 'ตรวจสอบเงินสด', route: { view: 'finance', page: 'cash-check' } },
        { id: 'fn-cash-control', label: 'ควบคุมเงินสด', route: { view: 'finance', page: 'cash-control' } },
        { id: 'fn-carry-forward', label: 'ตั้งยอดยกไป', route: { view: 'finance', page: 'carry-forward' } },
      ] },
      { id: 'fn-rp-group', label: 'รับ–จ่ายเงิน', children: [
        { id: 'ac-receipt', label: 'ใบสำคัญรับ', route: { view: 'account', page: 'receipt' } },
        { id: 'fn-bytype-both', label: 'รับ/จ่าย ตามประเภท', route: { view: 'finance', page: 'bytype-both' } },
        { id: 'fn-cancel-txn', label: 'ยกเลิกใบทำรายการ', route: { view: 'finance', page: 'cancel-txn' } },
      ] },
      { id: 'fn-share-group', label: 'หุ้น', children: [
        { id: 'fn-share-refund', label: 'คืนค่าหุ้น', route: { view: 'finance', page: 'share-refund' } },
        { id: 'fn-share-halfwithdraw', label: 'ถอนหุ้นกึ่งหนึ่ง', route: { view: 'finance', page: 'share-halfwithdraw' } },
        { id: 'fn-share-debt', label: 'ทำรายการหุ้นหนี้', route: { view: 'finance', page: 'share-debt' } },
      ] },
      { id: 'fn-approval-group', label: 'การอนุมัติ', children: [
        { id: 'fn-scholar-pay', label: 'อนุมัติจ่ายทุนการศึกษา', route: { view: 'finance', page: 'scholarship-pay' } },
        { id: 'fn-loan-pay', label: 'อนุมัติจ่ายสินเชื่อ', route: { view: 'finance', page: 'loan-disbursement' } },
        { id: 'fn-voucher-appr', label: 'อนุมัติจ่ายใบสำคัญจ่าย', route: { view: 'finance', page: 'voucher-approval' } },
        { id: 'fn-counter-vault', label: 'อนุมัติเบิก/คืนเงินเคาน์เตอร์', route: { view: 'finance', page: 'counter-vault' } },
      ] },
      { id: 'fn-receipt-print-group', label: 'พิมพ์ใบเสร็จ', children: [
        { id: 'fn-rc-fin', label: 'ใบเสร็จการเงิน', route: { view: 'finance', page: 'receipt-fin' } },
        { id: 'fn-rc-wht', label: 'ใบหักภาษี ณ ที่จ่าย', route: { view: 'finance', page: 'receipt-wht' } },
        { id: 'fn-rc-status', label: 'ใบสถานะการเงิน', route: { view: 'finance', page: 'receipt-status' } },
        { id: 'fn-rc-history', label: 'ปริ้นใบเสร็จย้อนหลัง', route: { view: 'finance', page: 'receipt-history' } },
      ] },
      { id: 'fn-cheque-issue', label: 'ออกเช็ค', children: [
        { id: 'fn-chq-unified', label: 'ออกเช็ค (รวมทุกรูปแบบ)', route: { view: 'finance', page: 'chq-unified' } },
        { id: 'fn-chq-multi-slip-cbt', label: 'ออกเช็ค 1 ใบ จากหลาย Slip cbt', route: { view: 'finance', page: 'chq-multi-slip-cbt' } },
        { id: 'fn-chq-multi-slip', label: 'ออกเช็ค 1 ใบ จากหลาย Slip', route: { view: 'finance', page: 'chq-multi-slip' } },
        { id: 'fn-chq-many-from-slip', label: 'ออกเช็คหลายใบ จาก 1 Slip', route: { view: 'finance', page: 'chq-many-from-slip' } },
        { id: 'fn-chq-loan', label: 'ออกเช็คเงินกู้', route: { view: 'finance', page: 'chq-loan' } },
        { id: 'fn-chq-deposit', label: 'ออกเช็คเงินฝาก', route: { view: 'finance', page: 'chq-deposit' } },
        { id: 'fn-chq-split', label: '1 Slip แตกเช็คหลายใบ', route: { view: 'finance', page: 'chq-split' } },
      ] },
      { id: 'fn-cheque-manage', label: 'จัดการเช็ค', children: [
        { id: 'iv-cheque-book', label: 'นำเข้าเล่มเช็ค', route: { view: 'invest', page: 'cheque-book' } },
        { id: 'fn-chq-print', label: 'พิมพ์เช็ค', route: { view: 'finance', page: 'chq-print' } },
        { id: 'iv-cheque-pay', label: 'จ่ายเงินด้วยเช็ค', route: { view: 'invest', page: 'cheque-pay' } },
        { id: 'fn-chq-cancel', label: 'ยกเลิกเช็ค', route: { view: 'finance', page: 'chq-cancel' } },
        { id: 'fn-chq-cancel-remit', label: 'ยกเลิกนำส่งเช็ค', route: { view: 'finance', page: 'chq-cancel-remit' } },
        { id: 'fn-chq-status', label: 'เปลี่ยนสถานะเช็ค', route: { view: 'finance', page: 'chq-status' } },
      ] },
      { id: 'fn-bank-mo-group', label: 'ธนาคาร / ธนาณัติ', children: [
        { id: 'fn-bank-txn', label: 'บันทึกทำรายการธนาคาร', route: { view: 'finance', page: 'bank-txn' } },
        { id: 'iv-bank-file', label: 'สร้างไฟล์โอนธนาคาร', route: { view: 'invest', page: 'bank-file' } },
        { id: 'fn-money-order', label: 'ธนาณัติ', route: { view: 'finance', page: 'money-order' } },
        { id: 'fn-mo-receive', label: 'ลงรับธนาณัติ', route: { view: 'finance', page: 'mo-receive' } },
      ] },
      { id: 'iv-agent-remit', label: 'บันทึกเงินจากตัวแทน', route: { view: 'invest', page: 'agent-remit' } },
    ] },
    { kind: 'report', label: '', items: [
      { id: 'fn-rpt-group', label: 'รายงาน', children: [
        { id: 'iv-rpt-cashflow', label: 'รายงานกระแสเงินสด' },
      ] },
    ] },
    { kind: 'config', items: [
      { id: 'fn-cfg-bank-acct', label: 'รายการธนาคาร', route: { view: 'finance', page: 'bank-account' } },
      { id: 'dp-cs-bank',   label: 'ธนาคาร', route: { view: 'deposit', page: 'const-bank' } },
      { id: 'dp-cs-branch', label: 'สาขา ธนาคาร', route: { view: 'deposit', page: 'const-branch' } },
      { id: 'fn-cfg-external', label: 'บุคคลภายนอก', route: { view: 'finance', page: 'external-party' } },
      { id: 'fn-cfg-terms', label: 'ข้อกำหนดระบบการเงิน', route: { view: 'finance', page: 'terms' } },
      { id: 'dp-cs-expgroup', label: 'กลุ่มค่าใช้จ่าย', route: { view: 'deposit', page: 'const-expgroup' } },
      { id: 'fn-cfg-exp-cat', label: 'หมวดค่าใช้จ่าย', route: { view: 'finance', page: 'expense-category' } },
      { id: 'fn-cfg-cheque-format', label: 'จัดการแบบเช็ค', route: { view: 'finance', page: 'cheque-format' } },
    ] },
  ] },
  { id: 'invest', icon: 'shares', label: 'การลงทุน', groups: [
    { kind: 'work', label: 'การลงทุน', items: [
      { id: 'iv-portfolio',   label: 'ทะเบียนพอร์ตลงทุน', route: { view: 'invest', page: 'portfolio' } },
      { id: 'iv-market',      label: 'ราคาตลาดประจำวัน', route: { view: 'invest', page: 'market-price' } },
      { id: 'iv-new',         label: 'บันทึกการลงทุนใหม่', route: { view: 'invest', page: 'new' } },
      { id: 'iv-import',      label: 'นำเข้าการลงทุนจาก Excel', route: { view: 'invest', page: 'import' } },
      { id: 'iv-return',      label: 'บันทึกรับผลตอบแทน', route: { view: 'invest', page: 'return' } },
      { id: 'iv-maturity',    label: 'ประมวลผลวันครบกำหนด', route: { view: 'invest', page: 'maturity' } },
      { id: 'iv-sell',        label: 'ขายเงินลงทุนก่อนครบกำหนด', route: { view: 'invest', page: 'sell' } },
      { id: 'iv-cashflow',    label: 'Cash Flow คาดการณ์', route: { view: 'invest', page: 'cashflow' } },
      { id: 'iv-limit-check', label: 'ตรวจสอบวงเงินลงทุน', route: { view: 'invest', page: 'limit-check' } },
    ] },
    { kind: 'report', items: [
      { id: 'iv-rpt-invest',   label: 'รายงานการลงทุน' },
    ] },
    { kind: 'config', items: [
      { id: 'iv-cfg-asset-type', label: 'ประเภทสินทรัพย์ลงทุน', route: { view: 'invest', page: 'asset-type' } },
      { id: 'iv-cfg-issuer', label: 'ผู้ออกหลักทรัพย์ / คู่สัญญา', route: { view: 'invest', page: 'issuer' } },
      { id: 'iv-cfg-limit', label: 'วงเงินลงทุนประจำปี', route: { view: 'invest', page: 'limit' } },
      { id: 'iv-cfg-fund-tag', label: 'แหล่งเงิน / Tagging', route: { view: 'invest', page: 'fund-tag' } },
    ] },
  ] },
  { id: 'debt', icon: 'guarantee', label: 'ทะเบียนและติดตามหนี้', groups: [
    { kind: 'work', label: '', items: [
      { id: 'dt-daily', label: 'งานประจำวัน', children: [
        { id: 'dt-dy-payment-order', label: 'ใบสั่งชำระเงิน', route: { view: 'loan', page: 'payment-order' } },
        { id: 'dt-dy-resign', label: 'บันทึกข้อมูลลาออก', route: { view: 'debt', page: 'resign' } },
        { id: 'dt-dy-resign-approve', label: 'อนุมัติลาออก', route: { view: 'process', page: 'resign-approve' } },
        { id: 'dt-dy-share-withdraw', label: 'ประมาณการถอนหุ้น', route: { view: 'debt', page: 'share-withdraw' } },
        { id: 'dt-dy-share-halfwithdraw', label: 'ใบสั่งถอนหุ้นกึ่งหนึ่ง', route: { view: 'debt', page: 'share-halfwithdraw' } },
        { id: 'dt-dy-share-refund', label: 'ใบสั่งคืนค่าหุ้น', route: { view: 'debt', page: 'share-refund' } },
        { id: 'dt-dy-share-refund-2024', label: 'ใบสั่งคืนค่าหุ้น2024', route: { view: 'debt', page: 'share-refund-2024' } },
        { id: 'dt-dy-share-refund-pay', label: 'คืนค่าหุ้น', route: { view: 'process', page: 'share-refund-pay' } },
        { id: 'dt-dy-guar-transfer', label: 'โอนหนี้ให้ผู้ค้ำ / โอนกลับผู้กู้', route: { view: 'debt', page: 'guarantor-transfer' } },
        { id: 'dt-dy-guar-return', label: 'โอนหนี้กลับผู้กู้', route: { view: 'debt', page: 'guarantor-return' } },
        { id: 'dt-dy-suspension-2567', label: 'ใบคำขอพักชำระหนี้', route: { view: 'debt', page: 'suspension' } },
        { id: 'dt-dy-inst-change', label: 'ใบคำขอแปลงเปลี่ยนงวดชำระ', route: { view: 'debt', page: 'installment-change' } },
        { id: 'dt-dy-inst-approve', label: 'อนุมัติแปลงเปลี่ยนงวดชำระ', route: { view: 'process', page: 'inst-approve' } },
        { id: 'dt-dy-inst-defer', label: 'แจ้งขอผ่อนผันงวดชำระ' },
        { id: 'dt-dy-contract-change', label: 'เปลี่ยนแปลงรายละเอียดสัญญา', route: { view: 'debt', page: 'contract-change' } },
        { id: 'dt-dy-transfer-dept', label: 'ย้ายสังกัดสมาชิก', route: { view: 'debt', page: 'transfer-dept' } },
        { id: 'dt-dy-inst-request', label: 'คำขอเปลี่ยนแปลงงวดชำระ', route: { view: 'debt', page: 'installment-change' } },
        { id: 'dt-dy-share-change', label: 'ใบเปลี่ยนแปลงค่าหุ้น', route: { view: 'debt', page: 'share-change' } },
        { id: 'dt-dy-share-change-approve', label: 'อนุมัติเปลี่ยนแปลงค่าหุ้น', route: { view: 'process', page: 'share-change-approve' } },
        { id: 'dt-dy-legal-register', label: 'ทะเบียนสัญญาฟ้องคดี', route: { view: 'debt', page: 'legal' } },
        { id: 'dt-dy-defer-records', label: 'เก็บข้อมูลการขอผ่อนผัน' },
        { id: 'dt-dy-member-edit', label: 'แก้ไขข้อมูลสมาชิก (ใหม่) แผนกทะเบียนและติดตามหนี้', route: { view: 'search' } },
        { id: 'dt-dy-accrued-int', label: 'ตั้งดอกเบี้ยค้าง', route: { view: 'process', page: 'accrued-interest-adjust' } },
        { id: 'dt-dy-cheque-receive', label: 'ลงรับเช็ค' },
        { id: 'dt-org-request', label: 'ขอให้ชำระหนี้', route: { view: 'debt', page: 'org-request' } },
        { id: 'dt-judgment', label: 'เรียกเก็บหนี้ตามคำพิพากษาตามยอม', route: { view: 'debt', page: 'judgment-collection' } },
        { id: 'dt-retiree', label: 'อายัดหนี้ผู้เกษียณ / เกษียณก่อนกำหนด', route: { view: 'debt', page: 'retiree-seizure' } },
        { id: 'dt-approve', label: 'อนุมัติใบคำขอ', route: { view: 'debt', page: 'approve' } },
        { id: 'dt-follow', label: 'ติดตามหนี้', route: { view: 'debt', page: 'follow' } },
        { id: 'dt-guar', label: 'ตรวจสอบสิทธิค้ำ', route: { view: 'debt', page: 'guarantee-check' } },
        { id: 'dt-dy-court-seizure', label: 'อายัดตามหมายศาล', route: { view: 'debt', page: 'court-seizure' } },
        { id: 'dt-dy-guar-change', label: 'เปลี่ยนค้ำประกันสัญญา', route: { view: 'debt', page: 'guarantor-change' } },
        { id: 'dt-dy-contract-convert', label: 'แปลงสัญญา' },
      ] },
      { id: 'dt-div-group', label: 'ปันผล', children: [
        { id: 'dt-dividend', label: 'รายละเอียดปันผล', route: { view: 'debt', page: 'dividend' } },
        { id: 'dt-dividend-key', label: 'คีย์ข้อมูลหักปันผล-เฉลี่ยคืนรายคน', route: { view: 'debt', page: 'dividend-key' } },
        { id: 'dt-div-key-affil', label: 'คีย์ข้อมูลหักปันผล-เฉลี่ยคืนตามสังกัด' },
        { id: 'dt-div-waive', label: 'เปลี่ยนแปลงงดปันผล งดเฉลี่ยคืน' },
        { id: 'dt-div-seizure', label: 'อายัดปันผล-เฉลี่ยคืน', route: { view: 'debt', page: 'seizure' } },
        { id: 'dt-div-pay-affil', label: 'จ่ายปันผล-เฉลี่ยคืน ตามช่วงสังกัด' },
        { id: 'dt-div-pay-reg', label: 'จ่ายปันผล-เฉลี่ยคืน ตามทะเบียน' },
        { id: 'dt-div-default', label: 'ผิดนัดชำระหนี้' },
        { id: 'dt-div-pay-cancel', label: 'ยกเลิกจ่ายปันผลเฉลี่ยคืน' },
        { id: 'dt-dividend-calc', label: 'ทดสอบการคำนวณปันผล เฉลี่ยคืน', route: { view: 'debt', page: 'dividend-calc' } },
        { id: 'dt-div-move-affil', label: 'ย้ายสังกัดปันผล เฉลี่ยคืน', route: { view: 'debt', page: 'div-affil' } },
        { id: 'dt-div-excel', label: 'ออกไฟล์ Excel ปันผล เฉลี่ยคืน' },
        { id: 'dt-dividend-adv', label: 'ทดลองจ่ายปันผล-เฉลี่ยคืน', route: { view: 'debt', page: 'dividend-adv' } },
      ] },
      { id: 'dt-registry-group', label: 'ทะเบียนติดตาม', children: [
        { id: 'dt-rg-seizure', label: 'ทะเบียนอายัดเงิน', route: { view: 'debt', page: 'seizure' } },
        { id: 'dt-rg-guar-change', label: 'แจ้งเปลี่ยนผู้ค้ำประกัน', route: { view: 'debt', page: 'guarantor-change' } },
        { id: 'dt-rg-notice', label: 'แจ้งให้ชำระหนี้', route: { view: 'debt', page: 'notice' } },
        { id: 'dt-rg-notice-cancel', label: 'ยกเลิกรายการแจ้ง', route: { view: 'debt', page: 'notice-cancel' } },
        { id: 'dt-rg-terminate-2567', label: 'แจ้งบอกเลิกสัญญา', route: { view: 'debt', page: 'terminate' } },
        { id: 'dt-rg-seizure-detail', label: 'รายละเอียดอายัดหนี้', route: { view: 'debt', page: 'seizure-detail' } },
        { id: 'dt-rg-agent-affil', label: 'ตัวแทนสังกัด', route: { view: 'process', page: 'agent-affil' } },
        { id: 'dt-rg-legal-status', label: 'เปลี่ยนแปลงสถานะทางกฎหมาย', route: { view: 'debt', page: 'legal-status' } },
        { id: 'dt-rg-doc-export', label: 'ประมวลเอกสารออก แผนก ทะเบียน-หุ้นหนี้' },
        { id: 'dt-rg-schedule-adjust', label: 'ปรับปรุงตารางชำระหนี้', route: { view: 'loan', page: 'schedule' } },
      ] },
      { id: 'dt-cancel-group', label: 'ยกเลิก', children: [
        { id: 'dt-cx-payment-order', label: 'ยกเลิกใบสั่งชำระเงิน', route: { view: 'loan', page: 'payment-order' } },
        { id: 'dt-cx-share-refund', label: 'ยกเลิกใบสั่งคืนค่าหุ้น', route: { view: 'debt', page: 'share-refund-cancel' } },
      ] },
      { id: 'dt-const-group', label: 'ค่าคงที่', children: [
        { id: 'dt-cs-cancel-reason', label: 'สาเหตุการยกเลิก', route: { view: 'agent', page: 'cancel-reason' } },
        { id: 'dt-cs-div-affil', label: 'สังกัดปันผลเฉลี่ยคืน', route: { view: 'debt', page: 'div-affil' } },
        { id: 'dt-cs-div-const', label: 'ค่าคงที่ปันผล เฉลี่ยคืน' },
        { id: 'dt-cfg-affiliation', label: 'ต้นสังกัด', route: { view: 'debt', page: 'affiliation-config' } },
        { id: 'dt-cfg-suspend-project', label: 'โครงการพักชำระหนี้', route: { view: 'debt', page: 'suspension-project' } },
        { id: 'dt-cfg-restruct', label: 'ดอกเบี้ย/การปรับโครงสร้างหนี้', route: { view: 'debt', page: 'restruct-config' } },
        { id: 'dt-cfg-status', label: 'สถานะหนี้' },
      ] },
    ] },
    { kind: 'report', items: [
      { id: 'dt-rpt-overdue', label: 'รายงานลูกหนี้ค้างชำระ' },
      { id: 'dt-rpt-follow',  label: 'รายงานการติดตามหนี้' },
    ] },
  ] },
  { id: 'account', icon: 'report', label: 'บัญชี', groups: [
    { kind: 'work', items: [
      { id: 'ac-g-entry', label: 'บันทึกบัญชี', children: [
          { id: 'ac-opening', label: 'ยอดยกมา', route: { view: 'account', page: 'opening' } },
          { id: 'ac-opening-bal', label: 'บันทึกแก้ยอดยกมาต้นปี', route: { view: 'account', page: 'opening-balance' } },
          { id: 'ac-journal', label: 'ลงรายวัน', route: { view: 'account', page: 'journal' } },
          { id: 'ac-journal-cancel', label: 'ยกเลิกรายการรายวัน', route: { view: 'account', page: 'journal-cancel' } },
          { id: 'ac-approval', label: 'อนุมัติรายการ', route: { view: 'account', page: 'approval' } },
          { id: 'ac-posting', label: 'ผ่านรายการไปแยกประเภท', route: { view: 'account', page: 'posting' } },
      ] },
      { id: 'ac-g-cash', label: 'เงินสด ธนาคาร และภาษี', children: [
          { id: 'ac-petty', label: 'เงินสดย่อย', route: { view: 'account', page: 'petty' } },
          { id: 'ac-bank', label: 'ธนาคาร', route: { view: 'account', page: 'bank' } },
          { id: 'ac-payable', label: 'เจ้าหนี้', route: { view: 'account', page: 'payable' } },
          { id: 'ac-receivable', label: 'ลูกหนี้', route: { view: 'account', page: 'receivable' } },
          { id: 'ac-wht', label: 'ภาษีหัก ณ ที่จ่าย', route: { view: 'account', page: 'wht' } },
      ] },
      { id: 'ac-g-asset', label: 'ครุภัณฑ์', children: [
          { id: 'ac-asset-receive', label: 'รับเข้าครุภัณฑ์', route: { view: 'account', page: 'asset-receive' } },
          { id: 'ac-asset', label: 'ทะเบียนครุภัณฑ์', route: { view: 'account', page: 'asset' } },
          { id: 'ac-asset-issue', label: 'เบิกครุภัณฑ์', route: { view: 'account', page: 'asset-issue' } },
      ] },
      { id: 'ac-g-close', label: 'ปิดงวดและจัดสรร', children: [
          { id: 'ac-close',   label: 'ปิดบัญชีประจำงวด' },
          { id: 'ac-profit', label: 'จัดสรรกำไร', route: { view: 'account', page: 'profit' } },
          { id: 'ac-dividend', label: 'เงินปันผล / เฉลี่ยคืน', route: { view: 'account', page: 'dividend' } },
      ] },
    ] },
    { kind: 'report', items: [
      { id: 'ac-rpt-trial',   label: 'งบทดลอง' },
      { id: 'ac-rpt-balance', label: 'งบแสดงฐานะการเงิน' },
      { id: 'ac-rpt-income',  label: 'งบกำไรขาดทุน' },
    ] },
    { kind: 'config', items: [
      { id: 'ac-cfg-settings', label: 'ตั้งค่าระบบบัญชี', route: { view: 'account', page: 'settings' } },
      { id: 'ac-mapcoa', label: 'Map คู่บัญชี', route: { view: 'account', page: 'map-coa' } },
      { id: 'ac-cfg-finformula', label: 'กำหนดสูตรงบการเงิน', route: { view: 'account', page: 'fin-formula' } },
      { id: 'ac-cfg-cfworksheet', label: 'สูตรกระดาษทำการกระแสเงินสด', route: { view: 'account', page: 'cf-worksheet' } },
      { id: 'ac-cfg-period', label: 'ตั้งค่างวดบัญชี', route: { view: 'account', page: 'period' } },
      { id: 'ac-cfg-subsystem', label: 'เชื่อมโยงระบบย่อย', route: { view: 'account', page: 'subsystem' } },
      { id: 'ac-cfg-data', label: 'นำเข้า / ส่งออกข้อมูล', route: { view: 'account', page: 'data' } },
      { id: 'ac-cfg-acctcat', label: 'หมวดบัญชี', route: { view: 'account', page: 'account-category' } },
      { id: 'ac-cfg-syscode', label: 'กำหนดชื่อระบบ', route: { view: 'account', page: 'system-code' } },
      { id: 'ac-cfg-acct-type', label: 'ประเภทบัญชี', route: { view: 'account', page: 'account-type' } },
      { id: 'ac-cfg-catconst', label: 'หมวดบัญชี (ค่าคงที่)', route: { view: 'account', page: 'category-const' } },
      { id: 'ac-cfg-jbook', label: 'ประเภทสมุดรายวัน', route: { view: 'account', page: 'journal-book' } },
      { id: 'ac-cfg-fyear', label: 'ปีบัญชี', route: { view: 'account', page: 'fiscal-year' } },
      { id: 'ac-cfg-coa', label: 'ผังบัญชี', route: { view: 'account', page: 'coa' } },
      { id: 'ac-cfg-budget', label: 'กำหนดโครงสร้างงบประมาณ', route: { view: 'account', page: 'budget' } },
      { id: 'ac-cfg-budget-plan', label: 'กำหนดงบประมาณ', route: { view: 'account', page: 'budget-plan' } },
    ] },
  ] },
  { id: 'agent', icon: 'member', label: 'ลูกหนี้ตัวแทน', groups: [
    { kind: 'work', items: [
      { id: 'ag-registry-detail', label: 'รายละเอียดลูกหนี้ตัวแทน', route: { view: 'agent', page: 'registry-detail' } },
      { id: 'ag-receive', label: 'รับชำระตัวแทน', route: { view: 'agent', page: 'receive' } },
      { id: 'ag-batch-receive', label: 'รับชำระแบบกลุ่ม', route: { view: 'agent', page: 'batch-receive' } },
      { id: 'ag-adjust', label: 'ปรับปรุงลูกหนี้ตัวแทน', route: { view: 'agent', page: 'adjust' } },
      { id: 'ag-process', label: 'ประมวลผลลูกหนี้ตัวแทน', route: { view: 'agent', page: 'process' } },
      { id: 'ag-return-money', label: 'ประมวลคืนเงินเพื่อรับชำระตัวแทน', route: { view: 'agent', page: 'return-money' } },
      { id: 'ag-receipt-return', label: 'คืนใบเสร็จลูกหนี้ตัวแทน', route: { view: 'agent', page: 'receipt-return' } },
      { id: 'ag-cancel-txn', label: 'ยกเลิกทำรายการ', route: { view: 'agent', page: 'cancel-txn' } },
    ] },
    { kind: 'config', items: [
      { id: 'ag-cfg-receipt-type', label: 'ประเภทใบเสร็จ', route: { view: 'agent', page: 'receipt-type' } },
      { id: 'ag-cfg-affil', label: 'สังกัดตัวแทน', route: { view: 'agent', page: 'affiliation' } },
      { id: 'ag-cfg-cancel', label: 'สาเหตุการยกเลิก', route: { view: 'agent', page: 'cancel-reason' } },
      { id: 'ag-cfg-payment', label: 'ประเภทการชำระ', route: { view: 'agent', page: 'payment-type' } },
    ] },
  ] },
  { id: 'welfare', icon: 'shield', label: 'สวัสดิการสมาชิก', groups: [
    { kind: 'work', items: [
      { id: 'wf-scholar-req', label: 'คำขอทุนการศึกษา', route: { view: 'welfare', page: 'scholarship-req' } },
      { id: 'wf-scholar-select', label: 'ประมวลผลคัดเลือกผู้รับทุน', route: { view: 'welfare', page: 'scholarship-select' } },
      { id: 'wf-scholar-approve', label: 'อนุมัติคำขอทุนการศึกษา', route: { view: 'welfare', page: 'scholarship-approve' } },
      { id: 'wf-approve', label: 'อนุมัติคำขอ', route: { view: 'welfare', page: 'approve' } },
      { id: 'wf-seminar', label: 'งานอบรม/สัมมนา', route: { view: 'welfare', page: 'seminar' } },
      { id: 'wf-relief', label: 'เงินสงเคราะห์สมาชิก', route: { view: 'welfare', page: 'relief' } },
      { id: 'wf-grant',   label: 'ทุนสวัสดิการ / เงินช่วยเหลือ', route: { view: 'welfare', page: 'grant' } },
      { id: 'wf-deceased', label: 'สมาชิกถึงแก่กรรม / ฌาปนกิจ', route: { view: 'welfare', page: 'deceased' } },
      { id: 'wf-death-claim', label: 'ขอสินไหมกรณีสมาชิกเสียชีวิต', route: { view: 'welfare', page: 'death-claim' } },
    ] },
    { kind: 'report', items: [
      { id: 'wf-rpt', label: 'รายงานการจ่ายสวัสดิการ' },
    ] },
    { kind: 'config', items: [
      { id: 'wf-cfg-type', label: 'ประเภทสวัสดิการ' },
      { id: 'wf-cfg-relief-type', label: 'ประเภทเงินสงเคราะห์', route: { view: 'welfare', page: 'relief-type' } },
      { id: 'wf-cfg-scholarship', label: 'กำหนดจำนวนทุนการศึกษา', route: { view: 'welfare', page: 'scholarship' } },
    ] },
  ] },
  { id: 'admin', icon: 'cog', label: 'ผู้ดูแลระบบ', groups: [
    { kind: 'work', items: [
      { id: 'adm-user', label: 'ผู้ใช้งานและสิทธิ์', route: { view: 'system', page: 'users' } },
      { id: 'adm-roles', label: 'บทบาท', route: { view: 'system', page: 'roles' } },
      { id: 'adm-usergroups', label: 'กลุ่มผู้ใช้', route: { view: 'system', page: 'usergroups' } },
      { id: 'adm-backup', label: 'สำรองและกู้คืนข้อมูล', route: { view: 'system', page: 'backup' } },
      { id: 'adm-log',  label: 'ประวัติการใช้งาน', route: { view: 'system', page: 'audit' } },
    ] },
    { kind: 'report', items: [
      { id: 'adm-rpt-access', label: 'รายงานการเข้าใช้งานระบบ' },
    ] },
    { kind: 'config', items: [
      { id: 'adm-constants', label: 'ค่าคงที่รวมทุกระบบ', route: { view: 'system', page: 'constants' } },
      { id: 'adm-coop', label: 'ค่าคงที่ข้อมูลสหกรณ์', route: { view: 'system', page: 'cooperative' } },
      { id: 'adm-cal',  label: 'ปฏิทินการทำงาน', route: { view: 'system', page: 'calendar' } },
      { id: 'adm-rate', label: 'อัตราดอกเบี้ย' },
    ] },
  ] },
];
const NAV_KIND_LABEL = { work: 'การทำงาน', report: 'รายงาน', config: 'ค่าคงที่' };
// รวมค่าคงที่ของแต่ละระบบ (ทุกกลุ่ม config + เมนูย่อยที่ซ้อนอยู่) เป็น dropdown "ค่าคงที่" อันเดียว
// เรียงตามลำดับเดิม: เมนูย่อยที่ซ้อนอยู่ขึ้นก่อน แล้วตามด้วยเมนูเดี่ยว
(function navMergeConfig() {
  NAV_SYSTEMS.forEach(sys => {
    if (!['deposit', 'finance', 'account'].includes(sys.id)) return; // ระบบรวม: จำกัดเฉพาะระบบที่ซิงก์จาก b394
    const cfg = sys.groups.filter(g => g.kind === 'config');
    if (!cfg.length) return;
    const nested = [], flat = [];
    cfg.forEach(g => g.items.forEach(it => {
      if (it.children) it.children.forEach(c => nested.push(c));
      else flat.push(it);
    }));
    const all = nested.concat(flat);
    if (all.length < 2) return;
    const merged = { kind: 'config', label: '', items: [{ id: sys.id + '-cfg-all', label: 'ค่าคงที่', children: all }] };
    const at = sys.groups.indexOf(cfg[0]);
    sys.groups = sys.groups.filter(g => g.kind !== 'config');
    sys.groups.splice(at, 0, merged);
  });
})();
window.NAV_TOP = NAV_TOP;
window.NAV_SYSTEMS = NAV_SYSTEMS;
window.navRouteToActiveId = (r) => routeToActiveId(r);

function routeToActiveId(r) {
  r = r || {};
  if (r.view === 'system' && r.page === 'showcase') return 'showcase';
  if (r.view === 'system' && r.page === 'usergroups') return 'adm-usergroups';
  if (r.view === 'deposit' && r.page === 'approve') return 'dp-approve';
  if (r.view === 'deposit' && r.page === 'cheque-return') return 'dp-chq-return';
  if (r.view === 'deposit' && r.page === 'cheque-clear') return 'dp-chq-clear';
  if (r.view === 'deposit' && r.page === 'multi-withdraw') return 'dp-ma-withdraw';
  if (r.view === 'deposit' && r.page === 'multi-deposit') return 'dp-ma-deposit';
  if (r.view === 'search' || r.view === 'member' || r.view === 'member-new') return 'members';
  if (r.view === 'loan' && r.page === 'request') return 'cr-req';
  if (r.view === 'loan' && r.page === 'request-special') return 'cr-req-special';
  if (r.view === 'loan' && r.page === 'approve') return 'cr-approve';
  if (r.view === 'loan' && r.page === 'payment-order') return 'cr-payment-order';
  if (r.view === 'claims' && r.page === 'eligibility') return 'cl-eligibility';
  if (r.view === 'claims' && r.page === 'register') return 'cl-register';
  if (r.view === 'claims' && r.page === 'cremation-members') return 'cl-cremation';
  if (r.view === 'loan' && r.page === 'guarantee-check') return 'cr-guar';
  if (r.view === 'loan' && r.page === 'contract-adjust') return 'cr-contract-adjust';
  if (r.view === 'loan' && r.page === 'insurance-arrears') return 'cr-insurance-arrears';
  if (r.view === 'loan' && r.page === 'cancel-disbursement') return 'cr-cancel-disburse';
  if (r.view === 'loan' && r.page === 'cancel-resign') return 'cr-cancel-resign';
  if (r.view === 'loan' && r.page === 'cancel-em-request') return 'cr-cancel-emreq';
  if (r.view === 'loan' && r.page === 'cancel-special-pay') return 'cr-cancel-special-pay';
  if (r.view === 'loan' && r.page === 'cancel-special-order') return 'cr-cancel-special-order';
  if (r.view === 'loan' && r.page === 'cancel-contract') return 'cr-cancel-contract';
  if (r.view === 'loan' && r.page === 'loan-control') return 'cr-loan-control';
  if (r.view === 'loan' && r.page === 'atm-activities') return 'cr-atm-activities';
  if (r.view === 'loan' && r.page === 'collateral') return 'cr-collateral';
  if (r.view === 'loan' && r.page === 'legal-act') return 'cr-legal-act';
  if (r.view === 'loan' && r.page === 'survey') return 'cr-survey';
  if (r.view === 'loan' && r.page === 'appraisal') return 'cr-appraisal';
  if (r.view === 'loan' && r.page === 'interest') return 'cr-interest';
  if (r.view === 'loan' && r.page === 'insurance') return 'cr-insurance';
  if (r.view === 'loan' && r.page === 'insurance-renewal') return 'cr-insure-renew';
  if (r.view === 'loan' && r.page === 'schedule') return 'cr-schedule';
  if (r.view === 'loan' && r.page === 'lot') return 'cr-lot';
  if (r.view === 'loan' && r.page === 'payout') return 'cr-payout';
  if (r.view === 'loan' && r.page === 'return') return 'cr-return';
  if (r.view === 'loan' && r.page === 'dividend') return 'cr-dividend';
  if (r.view === 'loan' && r.page === 'int-cert') return 'cr-int-cert';
  if (r.view === 'loan' && r.page === 'loan-terms') return 'cr-cfg-terms';
  if (r.view === 'loan' && r.page === 'purpose-const') return 'cr-cfg-purpose';
  if (r.view === 'loan' && r.page === 'purpose-const-v2') return 'cr-cfg-purpose2';
  if (r.view === 'loan' && r.page === 'insurer-config') return 'cr-cfg-insurer';
  if (r.view === 'loan' && r.page === 'loan-type') return 'cr-cfg-type';
  if (r.view === 'loan' && r.page === 'loan-group') return 'cr-cfg-limitgroup';
  if (r.view === 'loan' && r.page === 'guar-limit') return 'cr-cfg-guarlimit';
  if (r.view === 'loan' && r.page === 'guar-count') return 'cr-cfg-guarcount';
  if (r.view === 'loan' && r.page === 'loan-project') return 'cr-cfg-project';
  if (r.view === 'loan' && r.page === 'int-rate') return 'cr-cfg-intrate';
  if (r.view === 'loan' && r.page === 'ban') return 'pc-cd-ban';
  if (r.view === 'process' && r.page === 'collect-stop') return 'pc-cd-collect-stop';
  if (r.view === 'process' && r.page === 'inst-change-req') return 'pc-cd-inst-change-req';
  if (r.view === 'process' && r.page === 'agent-affil') return 'pc-cd-agent-affil';
  if (r.view === 'process' && r.page === 'inst-approve') return 'pc-cd-inst-approve';
  if (r.view === 'process' && r.page === 'resign-approve') return 'pc-mb-resign-approve';
  if (r.view === 'process' && r.page === 'share-change-approve') return 'pc-mb-share-change-approve';
  if (r.view === 'process' && r.page === 'member-close') return 'pc-mb-member-close';
  if (r.view === 'process' && r.page === 'resign-form') return 'pc-mb-resign-form';
  if (r.view === 'process' && r.page === 'affil-transfer-form') return 'pc-mb-affil-transfer';
  if (r.view === 'process' && r.page === 'share-change-form') return 'pc-mb-share-change-form';
  if (r.view === 'process' && r.page === 'share-partial-withdraw') return 'pc-mb-share-partial';
  if (r.view === 'process' && r.page === 'share-refund-pay') return 'pc-mb-share-refund';
  if (r.view === 'process' && r.page === 'accrued-interest-adjust') return 'pc-cd-accrued-int';
  if (r.view === 'process' && r.page === 'share-adjust') return 'pc-cd-share-adjust';
  if (r.view === 'process' && r.page === 'debt-adjust') return 'pc-cd-debt-adjust';
  if (r.view === 'process' && r.page === 'tax-cert') return 'pc-tax-cert';
  if (r.view === 'process' && r.page === 'share-terms') return 'pc-cfg-share';
  if (r.view === 'process' && r.page === 'affil-detail') return 'pc-cfg-affil';
  if (r.view === 'invest' && r.page === 'portfolio') return 'iv-portfolio';
  if (r.view === 'invest' && r.page === 'market-price') return 'iv-market';
  if (r.view === 'invest' && r.page === 'new') return 'iv-new';
  if (r.view === 'invest' && r.page === 'import') return 'iv-import';
  if (r.view === 'invest' && r.page === 'return') return 'iv-return';
  if (r.view === 'invest' && r.page === 'maturity') return 'iv-maturity';
  if (r.view === 'invest' && r.page === 'sell') return 'iv-sell';
  if (r.view === 'invest' && r.page === 'cashflow') return 'iv-cashflow';
  if (r.view === 'invest' && r.page === 'limit-check') return 'iv-limit-check';
  if (r.view === 'invest' && r.page === 'agent-remit') return 'iv-agent-remit';
  if (r.view === 'finance' && r.page === 'cheque-format') return 'fn-cfg-cheque-format';
  if (r.view === 'invest' && r.page === 'cheque-book') return 'iv-cheque-book';
  if (r.view === 'invest' && r.page === 'cheque-pay') return 'iv-cheque-pay';
  if (r.view === 'invest' && r.page === 'bank-file') return 'iv-bank-file';
  if (r.view === 'invest' && r.page === 'asset-type') return 'iv-cfg-asset-type';
  if (r.view === 'invest' && r.page === 'issuer') return 'iv-cfg-issuer';
  if (r.view === 'invest' && r.page === 'limit') return 'iv-cfg-limit';
  if (r.view === 'invest' && r.page === 'fund-tag') return 'iv-cfg-fund-tag';
  if (r.view === 'debt' && r.page === 'notice') return 'dt-rg-notice';
  if (r.view === 'debt' && r.page === 'follow') return 'dt-follow';
  if (r.view === 'debt' && r.page === 'org-request') return 'dt-org-request';
  if (r.view === 'debt' && r.page === 'notice-cancel') return 'dt-rg-notice-cancel';
  if (r.view === 'debt' && r.page === 'dividend') return 'dt-dividend';
  if (r.view === 'debt' && r.page === 'dividend-key') return 'dt-dividend-key';
  if (r.view === 'debt' && r.page === 'dividend-calc') return 'dt-dividend-calc';
  if (r.view === 'debt' && r.page === 'dividend-adv') return 'dt-dividend-adv';
  if (r.view === 'debt' && r.page === 'guarantee-check') return 'dt-guar';
  if (r.view === 'debt' && r.page === 'guarantor-transfer') return 'dt-guar-transfer';
  if (r.view === 'debt' && r.page === 'guarantor-change') return 'dt-rg-guar-change';
  if (r.view === 'debt' && r.page === 'terminate') return 'dt-rg-terminate-2567';
  if (r.view === 'debt' && r.page === 'installment-change') return 'dt-inst-change';
  if (r.view === 'debt' && r.page === 'contract-change') return 'dt-contract-change';
  if (r.view === 'debt' && r.page === 'share-change') return 'dt-share-change';
  if (r.view === 'debt' && r.page === 'share-withdraw') return 'dt-dy-share-withdraw';
  if (r.view === 'debt' && r.page === 'share-halfwithdraw') return 'dt-dy-share-halfwithdraw';
  if (r.view === 'debt' && r.page === 'share-refund') return 'dt-dy-share-refund';
  if (r.view === 'debt' && r.page === 'share-refund-2024') return 'dt-dy-share-refund-2024';
  if (r.view === 'debt' && r.page === 'share-refund-cancel') return 'dt-cx-share-refund';
  if (r.view === 'debt' && r.page === 'resign') return 'dt-resign';
  if (r.view === 'debt' && r.page === 'member-status') return 'dt-member-status';
  if (r.view === 'debt' && r.page === 'transfer-dept') return 'dt-transfer-dept';
  if (r.view === 'debt' && r.page === 'suspension') return 'dt-dy-suspension-2567';
  if (r.view === 'debt' && r.page === 'seizure') return 'dt-rg-seizure';
  if (r.view === 'debt' && r.page === 'seizure-detail') return 'dt-rg-seizure-detail';
  if (r.view === 'debt' && r.page === 'court-seizure') return 'dt-dy-court-seizure';
  if (r.view === 'debt' && r.page === 'judgment-collection') return 'dt-judgment';
  if (r.view === 'debt' && r.page === 'retiree-seizure') return 'dt-retiree';
  if (r.view === 'debt' && r.page === 'affiliation-config') return 'dt-cfg-affiliation';
  if (r.view === 'debt' && r.page === 'div-affil') return 'dt-cfg-div-affil';
  if (r.view === 'debt' && r.page === 'suspension-project') return 'dt-cfg-suspend-project';
  if (r.view === 'debt' && r.page === 'restruct-config') return 'dt-cfg-restruct';
  if (r.view === 'debt' && r.page === 'approve') return 'dt-approve';
  if (r.view === 'debt' && r.page === 'legal') return 'dt-dy-legal-register';
  if (r.view === 'debt' && r.page === 'legal-status') return 'dt-rg-legal-status';
  if (r.view === 'welfare' && r.page === 'scholarship') return 'wf-cfg-scholarship';
  if (r.view === 'welfare' && r.page === 'relief') return 'wf-relief';
  if (r.view === 'welfare' && r.page === 'relief-type') return 'wf-cfg-relief-type';
  if (r.view === 'welfare' && r.page === 'scholarship-req') return 'wf-scholar-req';
  if (r.view === 'welfare' && r.page === 'scholarship-select') return 'wf-scholar-select';
  if (r.view === 'welfare' && r.page === 'scholarship-approve') return 'wf-scholar-approve';
  if (r.view === 'welfare' && r.page === 'approve') return 'wf-approve';
  if (r.view === 'welfare' && r.page === 'seminar') return 'wf-seminar';
  if (r.view === 'welfare' && r.page === 'seminar-create') return 'wf-seminar';
  if (r.view === 'welfare' && r.page === 'deceased') return 'wf-deceased';
  if (r.view === 'welfare' && r.page === 'death-claim') return 'wf-death-claim';
  if (r.view === 'welfare' && r.page === 'grant') return 'wf-grant';
  if (r.view === 'deposit' && r.page === 'basic-info') return 'dp-basic';
  if (r.view === 'deposit' && r.page === 'open') return 'dp-open';
  if (r.view === 'deposit' && r.page === 'counter-open') return 'dp-ct-open';
  if (r.view === 'deposit' && r.page === 'counter-close') return 'dp-ct-close';
  if (r.view === 'deposit' && r.page === 'proc-open') return 'dp-proc-open';
  if (r.view === 'deposit' && String(r.page || '').indexOf('const-') === 0) return 'dp-cs-' + String(r.page).slice(6);
  if (r.view === 'deposit' && r.page === 'dep-project') return 'dp-cfg-project';
  if (r.view === 'finance' && r.page === 'bytype-both') return 'fn-bytype-both';
  if (r.view === 'deposit' && r.page === 'const-bank') return 'dp-cs-bank';
  if (r.view === 'deposit' && r.page === 'const-branch') return 'dp-cs-branch';
  if (r.view === 'deposit' && r.page === 'interest-advance') return 'dp-int-advance';
  if (r.view === 'deposit' && r.page === 'pnd2') return 'dp-tax-pnd2';
  if (r.view === 'deposit' && r.page === 'edit-account') return 'dp-edit-acc';
  if (r.view === 'deposit' && r.page === 'atm') return 'dp-atm';
  if (r.view === 'deposit' && r.page === 'atm-close') return 'dp-atm-close';
  if (r.view === 'deposit' && r.page === 'atm-freeze') return 'dp-atm-freeze';
  if (r.view === 'deposit' && r.page === 'atm-unfreeze') return 'dp-atm-unfreeze';
  if (r.view === 'deposit' && r.page === 'external-person') return 'dp-ext-person';
  if (r.view === 'deposit' && r.page === 'counter') return 'dp-counter';
  if (r.view === 'deposit' && r.page === 'deposit') return 'dp-counter';
  if (r.view === 'deposit' && r.page === 'withdraw') return 'dp-counter';
  if (r.view === 'deposit' && r.page === 'transfer') return 'dp-counter';
  if (r.view === 'deposit' && r.page === 'monthly-change') return 'dp-monthly';
  if (r.view === 'deposit' && r.page === 'default-process') return 'dp-default';
  if (r.view === 'deposit' && r.page === 'cutoff') return 'dp-cutoff';
  if (r.view === 'deposit' && r.page === 'poontawee') return 'dp-poontawee';
  if (r.view === 'deposit' && r.page === 'interest-calc') return 'dp-int-calc';
  if (r.view === 'deposit' && r.page === 'interest-pay') return 'dp-int-pay';
  if (r.view === 'deposit' && r.page === 'interest-accrued') return 'dp-int-accrued';
  if (r.view === 'deposit' && r.page === 'interest-accrued-calc') return 'dp-int-accrued-calc';
  if (r.view === 'deposit' && r.page === 'interest-projection') return 'dp-int-proj';
  if (r.view === 'deposit' && r.page === 'passbook') return 'dp-passbook';
  if (r.view === 'deposit' && r.page === 'book-register') return 'dp-book-reg';
  if (r.view === 'deposit' && r.page === 'tax-cert') return 'dp-tax-cert';
  if (r.view === 'deposit' && r.page === 'import') return 'dp-import';
  if (r.view === 'deposit' && r.page === 'bank-file') return 'dp-bank-file';
  if (r.view === 'deposit' && r.page === 'freeze') return 'dp-freeze';
  if (r.view === 'deposit' && r.page === 'rate-change') return 'dp-rate-change';
  if (r.view === 'deposit' && r.page === 'close') return 'dp-counter';
  if (r.view === 'deposit' && r.page === 'cancel') return 'dp-cancel';
  if (r.view === 'deposit' && r.page === 'md-dividend') return 'dp-md-dividend';
  if (r.view === 'deposit' && r.page === 'md-salary') return 'dp-md-salary';
  if (r.view === 'deposit' && r.page === 'md-scholarship') return 'dp-md-scholarship';
  if (r.view === 'deposit' && r.page === 'md-welfare') return 'dp-md-welfare';
  if (r.view === 'deposit' && r.page === 'md-meeting') return 'dp-md-meeting';
  if (r.view === 'deposit' && r.page === 'md-loan') return 'dp-md-loan';
  if (r.view === 'deposit' && r.page === 'sys-config') return 'dp-cfg-sys';
  if (r.view === 'deposit' && r.page === 'txn-type') return 'dp-cfg-txntype';
  if (r.view === 'deposit' && r.page === 'acc-type') return 'dp-cfg-type';
  if (r.view === 'deposit' && r.page === 'rate') return 'dp-cfg-type';
  if (r.view === 'deposit' && r.page === 'fee') return 'dp-cfg-fee';
  if (r.view === 'deposit' && r.page === 'funeral') return 'dp-funeral';
  if (r.view === 'deposit' && r.page === 'passbook-cfg') return 'dp-cfg-passbook';
  if (r.view === 'system' && r.page === 'audit') return 'adm-log';
  if (r.view === 'system' && r.page === 'users') return 'adm-user';
  if (r.view === 'system' && r.page === 'roles') return 'adm-roles';
  if (r.view === 'system' && r.page === 'backup') return 'adm-backup';
  if (r.view === 'system' && r.page === 'constants') return 'adm-constants';
  if (r.view === 'system' && r.page === 'calendar') return 'adm-cal';
  if (r.view === 'system' && r.page === 'cooperative') return 'adm-coop';
  if (r.view === 'finance' && r.page === 'receive') return 'fn-receive';
  if (r.view === 'finance' && r.page === 'pay') return 'fn-pay';
  if (r.view === 'finance' && r.page === 'bytype') return 'fn-bytype';
  if (r.view === 'finance' && r.page === 'cross-system') return 'fn-cross';
  if (r.view === 'finance' && r.page === 'cancel-txn') return 'fn-cancel-txn';
  if (r.view === 'finance' && r.page === 'cancel-other-slip') return 'fn-cancel-other-slip';
  if (r.view === 'finance' && r.page === 'receipt-fin') return 'fn-rc-fin';
  if (r.view === 'finance' && r.page === 'receipt-wht') return 'fn-rc-wht';
  if (r.view === 'finance' && r.page === 'receipt-status') return 'fn-rc-status';
  if (r.view === 'finance' && r.page === 'receipt-history') return 'fn-rc-history';
  if (r.view === 'finance' && r.page === 'scholarship-pay') return 'fn-scholar-pay';
  if (r.view === 'finance' && r.page === 'loan-disbursement') return 'fn-loan-pay';
  if (r.view === 'finance' && r.page === 'voucher-approval') return 'fn-voucher-appr';
  if (r.view === 'finance' && r.page === 'day-open') return 'fn-day-open';
  if (r.view === 'finance' && r.page === 'day-close') return 'fn-day-close';
  if (r.view === 'finance' && r.page === 'chq-multi-slip-cbt') return 'fn-chq-multi-slip-cbt';
  if (r.view === 'finance' && r.page === 'chq-multi-slip') return 'fn-chq-multi-slip';
  if (r.view === 'finance' && r.page === 'chq-many-from-slip') return 'fn-chq-many-from-slip';
  if (r.view === 'finance' && r.page === 'chq-loan') return 'fn-chq-loan';
  if (r.view === 'finance' && r.page === 'chq-deposit') return 'fn-chq-deposit';
  if (r.view === 'finance' && r.page === 'chq-split') return 'fn-chq-split';
  if (r.view === 'finance' && r.page === 'chq-print') return 'fn-chq-print';
  if (r.view === 'finance' && r.page === 'chq-cancel-remit') return 'fn-chq-cancel-remit';
  if (r.view === 'finance' && r.page === 'chq-status') return 'fn-chq-status';
  if (r.view === 'finance' && r.page === 'share-refund') return 'fn-share-refund';
  if (r.view === 'finance' && r.page === 'share-halfwithdraw') return 'fn-share-halfwithdraw';
  if (r.view === 'finance' && r.page === 'share-debt') return 'fn-share-debt';
  if (r.view === 'finance' && r.page === 'cash-check') return 'fn-cash-check';
  if (r.view === 'finance' && r.page === 'cash-control') return 'fn-cash-control';
  if (r.view === 'finance' && r.page === 'carry-forward') return 'fn-carry-forward';
  if (r.view === 'finance' && r.page === 'advance') return 'fn-advance';
  if (r.view === 'finance' && r.page === 'advance-return') return 'fn-advance-return';
  if (r.view === 'finance' && r.page === 'money-order') return 'fn-money-order';
  if (r.view === 'finance' && r.page === 'mo-receive') return 'fn-mo-receive';
  if (r.view === 'finance' && r.page === 'bank-txn') return 'fn-bank-txn';
  if (r.view === 'finance' && r.page === 'bank-account') return 'fn-cfg-bank-acct';
  if (r.view === 'finance' && r.page === 'external-party') return 'fn-cfg-external';
  if (r.view === 'finance' && r.page === 'terms') return 'fn-cfg-terms';
  if (r.view === 'finance' && r.page === 'expense-category') return 'fn-cfg-exp-cat';
  if (r.view === 'account' && r.page === 'petty') return 'ac-petty';
  if (r.view === 'account' && r.page === 'opening') return 'ac-opening';
  if (r.view === 'account' && r.page === 'opening-balance') return 'ac-opening-bal';
  if (r.view === 'account' && r.page === 'map-coa') return 'ac-mapcoa';
  if (r.view === 'account' && r.page === 'bank') return 'ac-bank';
  if (r.view === 'account' && r.page === 'payable') return 'ac-payable';
  if (r.view === 'account' && r.page === 'receivable') return 'ac-receivable';
  if (r.view === 'account' && r.page === 'approval') return 'ac-approval';
  if (r.view === 'account' && r.page === 'posting') return 'ac-posting';
  if (r.view === 'account' && r.page === 'profit') return 'ac-profit';
  if (r.view === 'account' && r.page === 'dividend') return 'ac-dividend';
  if (r.view === 'account' && r.page === 'subsystem') return 'ac-cfg-subsystem';
  if (r.view === 'account' && r.page === 'data') return 'ac-cfg-data';
  if (r.view === 'account' && r.page === 'settings') return 'ac-cfg-settings';
  if (r.view === 'account' && r.page === 'fin-formula') return 'ac-cfg-finformula';
  if (r.view === 'account' && r.page === 'cf-worksheet') return 'ac-cfg-cfworksheet';
  if (r.view === 'account' && r.page === 'period') return 'ac-cfg-period';
  if (r.view === 'account' && r.page === 'coa') return 'ac-cfg-coa';
  if (r.view === 'account' && r.page === 'account-category') return 'ac-cfg-acctcat';
  if (r.view === 'account' && r.page === 'system-code') return 'ac-cfg-syscode';
  if (r.view === 'account' && r.page === 'account-type') return 'ac-cfg-acct-type';
  if (r.view === 'account' && r.page === 'category-const') return 'ac-cfg-catconst';
  if (r.view === 'account' && r.page === 'journal-book') return 'ac-cfg-jbook';
  if (r.view === 'account' && r.page === 'fiscal-year') return 'ac-cfg-fyear';
  if (r.view === 'account' && r.page === 'budget') return 'ac-cfg-budget';
  if (r.view === 'account' && r.page === 'budget-plan') return 'ac-cfg-budget-plan';
  if (r.view === 'account' && r.page === 'journal-cancel') return 'ac-journal-cancel';
  if (r.view === 'account' && r.page === 'journal') return 'ac-journal';
  if (r.view === 'account' && r.page === 'voucher') return 'ac-voucher';
  if (r.view === 'account' && r.page === 'voucher-recv') return 'ac-voucher-recv';
  if (r.view === 'account' && r.page === 'receipt') return 'ac-receipt';
  if (r.view === 'account' && r.page === 'wht') return 'ac-wht';
  if (r.view === 'account' && r.page === 'asset') return 'ac-asset';
  if (r.view === 'account' && r.page === 'asset-receive') return 'ac-asset-receive';
  if (r.view === 'account' && r.page === 'asset-issue') return 'ac-asset-issue';
  if (r.view === 'agent' && r.page === 'registry') return 'ag-registry';
  if (r.view === 'agent' && r.page === 'registry-detail') return 'ag-registry-detail';
  if (r.view === 'agent' && r.page === 'receive') return 'ag-receive';
  if (r.view === 'agent' && r.page === 'batch-receive') return 'ag-batch-receive';
  if (r.view === 'agent' && r.page === 'adjust') return 'ag-adjust';
  if (r.view === 'agent' && r.page === 'process') return 'ag-process';
  if (r.view === 'agent' && r.page === 'return-money') return 'ag-return-money';
  if (r.view === 'agent' && r.page === 'receipt-return') return 'ag-receipt-return';
  if (r.view === 'agent' && r.page === 'poontawee') return 'ag-poontawee';
  if (r.view === 'agent' && r.page === 'cancel-txn') return 'ag-cancel-txn';
  if (r.view === 'agent' && r.page === 'day') return 'ag-cfg-day';
  if (r.view === 'agent' && r.page === 'receipt-type') return 'ag-cfg-receipt-type';
  if (r.view === 'agent' && r.page === 'affiliation') return 'ag-cfg-affil';
  if (r.view === 'agent' && r.page === 'cancel-reason') return 'ag-cfg-cancel';
  if (r.view === 'agent' && r.page === 'payment-type') return 'ag-cfg-payment';
  // ── fallback: หา id จาก NAV_SYSTEMS โดยตรง เพื่อไม่ให้ map ด้านบนหลุดเมื่อซิงก์เมนูใหม่
  const fromNav = navIdForRoute(r);
  if (fromNav) return fromNav;
  if (r.view === 'finance' && r.page === 'counter-vault') return 'fn-counter-vault';
  // ไม่มีใน map ด้านบน → หาจากเมนูจริง
  const hit = navFindIdByRoute(r);
  return hit || 'members';
}

// เดินสำรวจ NAV_TOP + NAV_SYSTEMS หา item ที่ route ตรงกับ r
function navIdForRoute(r) {
  if (!r || !r.view) return null;
  const match = (it) => it && it.route && it.route.view === r.view &&
    (it.route.page || null) === (r.page || null);
  for (const t of (NAV_TOP || [])) {
    if (match(t)) return t.id;
    for (const c of (t.children || [])) if (match(c)) return c.id;
  }
  for (const sys of (NAV_SYSTEMS || [])) {
    for (const g of (sys.groups || [])) {
      for (const it of (g.items || [])) {
        if (match(it)) return it.id;
        for (const c of (it.children || [])) if (match(c)) return c.id;
      }
    }
  }
  return null;
}

function navFindIdByRoute(r) {
  const same = (x) => x && x.route && x.route.view === r.view && (x.route.page || null) === (r.page || null);
  const walk = (items) => {
    for (const it of items || []) {
      if (same(it)) return it.id;
      const c = walk(it.children);
      if (c) return c;
    }
    return null;
  };
  const top = walk(typeof NAV_TOP !== 'undefined' ? NAV_TOP : window.NAV_TOP);
  if (top) return top;
  for (const s of (typeof NAV_SYSTEMS !== 'undefined' ? NAV_SYSTEMS : window.NAV_SYSTEMS) || []) {
    for (const g of s.groups || []) { const h = walk(g.items); if (h) return h; }
  }
  return null;
}

function Sidebar({ collapsed, currentRoute, onNavigate, onToggle }) {
  const ACTIVE_BG = 'var(--brand-soft)';
  const activeId = routeToActiveId(currentRoute);
  const [topOpen, setTopOpen] = React.useState([]);
  const [topClosed, setTopClosed] = React.useState([]);
  const toggleTop = (id, isOpen) => {
    if (isOpen) { setTopOpen(p => p.filter(x => x !== id)); setTopClosed(p => p.includes(id) ? p : [...p, id]); }
    else { setTopClosed(p => p.filter(x => x !== id)); setTopOpen(p => p.includes(id) ? p : [...p, id]); }
  };
  const itemHasActive = (it) => it.id === activeId || (it.children && it.children.some(c => c.id === activeId));
  const sysOfActive = NAV_SYSTEMS.find(s => s.groups.some(g => g.items.some(itemHasActive)))?.id;
  const subOfActive = (() => {
    for (const s of NAV_SYSTEMS) for (const g of s.groups) for (const it of g.items)
      if (it.children && it.children.some(c => c.id === activeId)) return it.id;
    return null;
  })();

  const [open, setOpen] = useState(() => sysOfActive ? [sysOfActive] : []);
  const [openSub, setOpenSub] = useState(() => subOfActive ? [subOfActive] : []);
  useEffect(() => {
    if (sysOfActive) setOpen(o => o.includes(sysOfActive) ? o : [...o, sysOfActive]);
  }, [sysOfActive]);
  useEffect(() => {
    if (subOfActive) setOpenSub(o => o.includes(subOfActive) ? o : [...o, subOfActive]);
  }, [subOfActive]);
  const toggle = (id) => setOpen(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id]);
  const toggleSub = (id) => setOpenSub(o => o.includes(id) ? o.filter(x => x !== id) : [...o, id]);
  const go = (it) => { if (it.route) onNavigate(it.route); };

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="sidebar-head-title">ระบบงานสหกรณ์</span>
        <button className="sidebar-fold" onClick={onToggle} aria-label="ย่อ/ขยายเมนู"><Icon name="menuFold" /></button>
      </div>

      <div className="sidebar-section">ภาพรวม</div>
      {NAV_TOP.map(it => it.children ? (() => {
        const childActive = it.children.some(c => c.id === activeId);
        const isOpen = topOpen.includes(it.id) || (childActive && !topClosed.includes(it.id));
        return (
          <div key={it.id} className="sidebar-group">
            <div className={"sidebar-group-head" + (isOpen ? " open" : "")}
                 onClick={() => toggleTop(it.id, isOpen)}
                 style={{ backgroundColor: childActive && !isOpen ? ACTIVE_BG : undefined,
                          color: childActive ? 'var(--brand-700)' : undefined }}>
              <Icon name={it.icon} />
              <span className="sidebar-group-label">{it.label}</span>
              <span className="sidebar-chev"><Icon name="chevDown" size={14} /></span>
            </div>
            {isOpen && (
              <div className="sidebar-group-body">
                <div className="sidebar-subgroup">
                  {it.children.filter(c => !c.hidden).map(c => (
                    <div key={c.id}
                         className={"sidebar-subitem" + (c.id === activeId ? " active" : "")}
                         onClick={() => go(c)}
                         style={{ backgroundColor: c.id === activeId ? ACTIVE_BG : undefined }}>
                      <span className="sidebar-dot" />
                      <span>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })() : (
        <div key={it.id}
             className={"sidebar-item" + (it.id === activeId ? " active" : "")}
             onClick={() => go(it)}
             style={{ backgroundColor: it.id === activeId ? ACTIVE_BG : undefined,
                      cursor: it.route ? 'pointer' : 'default' }}>
          <Icon name={it.icon} />
          <span>{it.label}</span>
          {it.badge && <span className="badge">{it.badge}</span>}
          {it.soon && <span className="badge" style={{ background: '#F0F0F0', color: 'rgba(0,0,0,.45)' }}>เร็วๆ นี้</span>}
        </div>
      ))}

      <div className="sidebar-section">ระบบงาน</div>
      {NAV_SYSTEMS.map(sys => {
        const isOpen = open.includes(sys.id);
        const hasActive = sys.groups.some(g => g.items.some(itemHasActive));
        return (
          <div key={sys.id} className="sidebar-group">
            <div className={"sidebar-group-head" + (isOpen ? " open" : "")}
                 onClick={() => toggle(sys.id)}
                 style={{ backgroundColor: hasActive && !isOpen ? ACTIVE_BG : undefined,
                          color: hasActive ? 'var(--brand-700)' : undefined }}>
              <Icon name={sys.icon} />
              <span className="sidebar-group-label">{sys.label}</span>
              <span className="sidebar-chev"><Icon name="chevDown" size={14} /></span>
            </div>
            {isOpen && (
              <div className="sidebar-group-body">
                {sys.groups.map((g, gi) => (
                  <div key={gi} className="sidebar-subgroup">
                    {(g.label || (g.label == null && g.kind !== 'work' && NAV_KIND_LABEL[g.kind])) &&
                      <div className="sidebar-subsection">{g.label || NAV_KIND_LABEL[g.kind]}</div>}
                    {g.items.filter(x => !x.hidden).map(it => {
                      if (it.children) {
                        const subOpen = openSub.includes(it.id);
                        const childActive = it.children.some(c => c.id === activeId);
                        return (
                          <div key={it.id} className="sidebar-subtree">
                            <div className={"sidebar-subitem parent" + (subOpen ? " open" : "") + (childActive && !subOpen ? " has-active" : "")}
                                 onClick={() => toggleSub(it.id)}
                                 style={{ backgroundColor: childActive && !subOpen ? ACTIVE_BG : undefined }}>
                              <span className="sidebar-dot" />
                              <span>{it.label}</span>
                              <span className="sidebar-subchev"><Icon name="chevDown" size={13} /></span>
                            </div>
                            {subOpen && it.children.filter(c => !c.hidden).map(c => (
                              <div key={c.id}
                                   className={"sidebar-subitem child" + (c.id === activeId ? " active" : "") + (c.route ? "" : " ghost")}
                                   onClick={() => go(c)}
                                   style={{ backgroundColor: c.id === activeId ? ACTIVE_BG : undefined }}>
                                <span className="sidebar-dot" />
                                <span>{c.label}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div key={it.id}
                             className={"sidebar-subitem" + (it.id === activeId ? " active" : "") + (it.route ? "" : " ghost")}
                             onClick={() => go(it)}
                             style={{ backgroundColor: it.id === activeId ? ACTIVE_BG : undefined }}>
                          <span className="sidebar-dot" />
                          <span>{it.label}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </aside>);

}

// ─── Topbar ──────────────────────────────────────────────────────────
function Topbar({ onToggleSidebar, onToggleTheme, dark, breadcrumb }) {
  const crumbs = breadcrumb || [{ label: 'ทะเบียนสมาชิก', current: true }];
  return (
    <header className="topbar">
      <div className="nav-brand">
        <div className="nav-logo"><img src={window.__resources.logo} alt="สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด" /></div>
        <span className="nav-org">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด</span>
      </div>
      <span className="topbar-spacer" />
      <div className="topbar-right">
        <button className="icon-btn nav-bell" aria-label="การแจ้งเตือน">
          <Icon name="bell" />
          <span className="nav-badge">11</span>
        </button>
        <div className="user-chip" title="ผู้ใช้งานปัจจุบัน">
          <span className="nav-user-ico"><Icon name="user" size={20} /></span>
          <div>
            <div className="name">มนตรี ศรีสุข</div>
            <div className="role">แอดมิน</div>
          </div>
        </div>
        <button className="nav-logout" aria-label="ออกจากระบบ">
          <Icon name="logout" size={18} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </header>);

}

// ─── Member Header (compact + chips + KPIs) ──────────────────────────
function MemberHeader({ data, variant }) {
  if (!data) return (
    <div className={"member-header" + (variant === "banner" ? " variant-banner" : "")}>
      <div>
        <div className="member-id-row">
          <span className="mid">—</span>
          <h1 className="muted">ยังไม่ได้เลือกสมาชิก</h1>
        </div>
        <div className="member-meta">
          <span><b>หน่วยงาน:</b> —</span>
          <span className="dot" />
          <span><b>รหัสสังกัด:</b> —</span>
          <span className="dot" />
          <span><b>สมาชิกตั้งแต่:</b> —</span>
        </div>
      </div>
      <div className="kpi-strip">
        <div className="kpi"><span className="k-label">ดอกเบี้ยสะสม</span><span className="k-value">฿ 0.00</span></div>
        <div className="kpi"><span className="k-label">ทุนเรือนหุ้น</span><span className="k-value">฿ 0</span></div>
        <div className="kpi"><span className="k-label">ยอดหนี้คงเหลือ</span><span className="k-value">฿ 0</span></div>
        <div className="kpi"><span className="k-label">หักรายเดือน</span><span className="k-value">฿ 0</span></div>
      </div>
    </div>
  );
  const m = data.member;
  // ── KPI คำนวนจากข้อมูลจริงของสมาชิกที่เลือก ──
  const parValue = (data.shareStatement && data.shareStatement.parValue) || 10;
  const shareTotal = (data.shares || []).reduce((s, x) => s + (Number(x.shareValue) || 0), 0);
  const shareUnits = parValue > 0 ? shareTotal / parValue : 0;
  const activeLoans = (data.loans || []).filter(l => (Number(l.remaining) || 0) > 0);
  const debtTotal = activeLoans.reduce((s, l) => s + (Number(l.remaining) || 0), 0);
  const monthlyTotal = data.deductionSummary && data.deductionSummary.net != null
    ? Number(data.deductionSummary.net) || 0
    : (data.deductions || []).reduce((s, d) => s + (Number(d.principal) || 0) + (Number(d.interest) || 0), 0);
  const monthlyPeriod = (() => {
    const now = new Date();
    return `งวด ${now.getFullYear() + 543}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();
  const tenure = (() => {
    if (!m.joinDate) return '—';
    const j = new Date(m.joinDate);
    if (isNaN(j)) return '—';
    const now = new Date();
    let months = (now.getFullYear() - j.getFullYear()) * 12 + (now.getMonth() - j.getMonth());
    if (now.getDate() < j.getDate()) months -= 1;
    if (months < 0) months = 0;
    return `${Math.floor(months / 12)} ปี ${months % 12} เดือน`;
  })();
  return (
    <div className={"member-header" + (variant === "banner" ? " variant-banner" : "")}>
      <div>
        <div className="member-id-row">
          <span className="mid">{m.code}</span>
          <h1>{m.name}</h1>
          <span className="chip primary"><span className="dot-c" />{window.normalizeMemberType ? window.normalizeMemberType(m.memberType) : m.memberType}</span>
          <span className="chip success"><span className="dot-c" />{m.workStatus}</span>
        </div>
        <div className="member-meta">
          <span><b>หน่วยงาน:</b> {m.department}</span>
          <span className="dot" />
          <span><b>รหัสสังกัด:</b> {m.departmentCode}</span>
          <span className="dot" />
          <span><b>สมาชิกตั้งแต่:</b> {fmt.date(m.joinDate)}</span>
          <span className="dot" />
          <span><b>อายุงานสมาชิก:</b> {tenure}</span>
        </div>
        <div className="member-meta" style={{ marginTop: 4, fontStyle: 'italic', maxWidth: 720 }}>
          <span title={m.note} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <b>หมายเหตุ:</b> {m.note}
          </span>
        </div>
      </div>
      <div className="kpi-strip">
        <div className="kpi">
          <span className="k-label">ดอกเบี้ยสะสม</span>
          <span className="k-value success">฿ {fmt.money(m.accumulatedInterest)}</span>
          <span className="k-sub">{(() => {
            const joinBE = m.joinDate ? new Date(m.joinDate).getFullYear() + 543 : null;
            const nowBE = new Date().getFullYear() + 543;
            return joinBE ? `ตั้งแต่ปี ${joinBE}–${nowBE}` : 'ตั้งแต่เป็นสมาชิก';
          })()}</span>
        </div>
        <div className="kpi">
          <span className="k-label">ทุนเรือนหุ้น</span>
          <span className="k-value">฿ {fmt.money(shareTotal, 0)}</span>
          <span className="k-sub">{fmt.money(shareUnits, 0)} หุ้น</span>
        </div>
        <div className="kpi">
          <span className="k-label">ยอดหนี้คงเหลือ</span>
          <span className="k-value">฿ {fmt.money(debtTotal, 0)}</span>
          <span className="k-sub">{activeLoans.length} สัญญาใช้งาน</span>
        </div>
        <div className="kpi">
          <span className="k-label">หักรายเดือน</span>
          <span className="k-value">฿ {fmt.money(monthlyTotal, 0)}</span>
          <span className="k-sub">{monthlyPeriod}</span>
        </div>
        {(() => {
          const items = window.pvrRecvByMember ? window.pvrRecvByMember(m.code) : [];
          const total = items.reduce((s, it) => s + (it.remain || 0), 0);
          return (
            <div className="kpi" title="ยอดที่รับเข้าจากใบสำคัญรับแล้วยังไม่ได้จ่ายคืนสมาชิก">
              <span className="k-label">เงินค้างรับ</span>
              <span className={"k-value" + (total > 0 ? " warn" : "")}>฿ {fmt.money(total, 0)}</span>
              <span className="k-sub">{total > 0 ? `${items.length} รายการรอจ่ายคืน` : 'ไม่มีรายการค้างรับ'}</span>
            </div>
          );
        })()}
      </div>
    </div>);

}

// ─── Tabs ────────────────────────────────────────────────────────────
// Two-row design: row 1 = top-level tabs; row 2 = sub-tabs (visible only
// when ข้อมูลสมาชิก is selected).
const TOP_TABS = [
{ id: "info", label: "ข้อมูลสมาชิก", subs: [
  { id: "details", label: "รายละเอียดสมาชิก" },
  { id: "status", label: "สถานะภาพ" },
  { id: "deductions", label: "หักประจำเดือน" },
  { id: "signature", label: "ลายเซ็นต์" }]
},
{ id: "shares", label: "หุ้น", count: 3 },
{ id: "loans", label: "เงินกู้", count: 4 },
{ id: "emergency", label: "ฉุกเฉินหักโอน", count: 4 },
{ id: "collect", label: "เรียกเก็บ", count: 8 },
{ id: "guarGiven", label: "ค้ำใคร", count: 4 },
{ id: "guarRecv", label: "ใครค้ำ", count: 4 }];


function TabBar({ active, sub, onChange, onSubChange }) {
  const top = TOP_TABS.find((t) => t.id === active);
  return (
    <div className="tabs-container">
      <div className="tabs-bar">
        {TOP_TABS.map((t) =>
        <button key={t.id} className={"tab" + (t.id === active ? " active" : "")}
        onClick={() => onChange(t.id)}>
            {t.label}
            {t.count != null && <span className="count">{t.count}</span>}
          </button>
        )}
      </div>
      {top?.subs &&
      <div className="tabs-bar subtab">
          {top.subs.map((s) =>
        <button key={s.id} className={"tab" + (s.id === sub ? " active" : "")}
        onClick={() => onSubChange(s.id)}>
              {s.label}
            </button>
        )}
        </div>
      }
    </div>);

}

// ─── Member Panel (persistent left side, always visible) ─────────────
// แสดงข้อมูลสมาชิกตลอดเวลาในกล่องของตัวเอง — เห็นได้ทุก Tab
function MemberPanel({ data }) {
  const m = data.member;
  return (
    <aside className="member-panel" data-screen-label="Member Info Panel">
      <div className="mp-head">
        <span className="mp-title">ข้อมูลสมาชิก</span>
        <span className="mp-status">สมาชิกใช้งาน</span>
      </div>

      <div className="mp-identity">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mp-id">{m.code}</div>
          <div className="mp-name">{m.name}</div>
          <div className="mp-chips">
            <span className="chip primary"><span className="dot-c" />{window.normalizeMemberType ? window.normalizeMemberType(m.memberType) : m.memberType}</span>
            <span className="chip success"><span className="dot-c" />{m.workStatus}</span>
          </div>
        </div>
      </div>

      <div className="mp-section">
        <div className="mp-section-title">หน่วยงานสังกัด</div>
        <div className="mp-row">
          <span className="mp-k">รหัสสังกัด</span>
          <span className="mp-v mono">{m.departmentCode}</span>
        </div>
        <div className="mp-row">
          <span className="mp-k">หน่วยงาน</span>
          <span className="mp-v" style={{ whiteSpace: 'normal' }}>{m.department}</span>
        </div>
        <div className="mp-row">
          <span className="mp-k">สมาชิกตั้งแต่</span>
          <span className="mp-v">{fmt.date(m.joinDate)}</span>
        </div>
        <div className="mp-row">
          <span className="mp-k">อายุงาน</span>
          <span className="mp-v">18 ปี 0 เดือน</span>
        </div>
      </div>

      <div className="mp-kpi accent">
        <span className="mp-kpi-label">ดอกเบี้ยสะสม</span>
        <span className="mp-kpi-value">฿ {fmt.money(m.accumulatedInterest)}</span>
        <span className="mp-kpi-sub">ตั้งแต่เป็นสมาชิก · ปี 2551–2569</span>
      </div>

      <div className="mp-mini-grid">
        <div className="mp-mini">
          <div className="lbl">ทุนเรือนหุ้น</div>
          <div className="val">฿ {fmt.money(789000, 0)}</div>
          <div className="sub">315.6 หุ้น</div>
        </div>
        <div className="mp-mini">
          <div className="lbl">หนี้คงเหลือ</div>
          <div className="val">฿ {fmt.money(1108250, 0)}</div>
          <div className="sub">4 สัญญา</div>
        </div>
        <div className="mp-mini">
          <div className="lbl">หักรายเดือน</div>
          <div className="val">฿ {fmt.money(18030, 0)}</div>
          <div className="sub">งวด 2569/04</div>
        </div>
        <div className="mp-mini">
          <div className="lbl">ค้ำให้ผู้อื่น</div>
          <div className="val">4 สัญญา</div>
          <div className="sub">฿ {fmt.money(745000, 0)}</div>
        </div>
      </div>

      <div className="mp-note">
        <div className="mp-note-title">หมายเหตุรายละเอียดอื่น ๆ</div>
        {m.note}
      </div>

      <div className="mp-actions">
        <button className="btn sm"><Icon name="edit" /> แก้ไข</button>
        <button className="btn sm"><Icon name="history" /> ประวัติ</button>
        <button className="btn sm"><Icon name="print" /> พิมพ์</button>
      </div>
    </aside>
  );
}

// ─── Breadcrumb (Design System) ──────────────────────────────────────
//  รูปแบบมาตรฐาน 2–3 ระดับ:  หน้าหลัก › [เมนู/ส่วนงาน] › [หน้า/การกระทำปัจจุบัน]
//  • "หน้าหลัก" คลิกเพื่อนำทางได้จริง
//  • ระดับ "เมนู" = ป้ายเมนูที่เลือก — เป็น current เมื่อไม่มีหน้าย่อย,
//    หรือคลิกได้เมื่อมีหน้าย่อย (หน้านั้นกำหนด trail เองผ่าน useBreadcrumb)
//  • ระดับปัจจุบัน (current) เป็นข้อความเน้น ไม่คลิก
//  • ไม่แสดงระดับ "ระบบ" และ "กลุ่ม" อีกต่อไป (แบนราบให้กระชับทั้งระบบ)
//
//  หน้าใดมีหน้าย่อยภายใน (เช่น list → create) เรียก useBreadcrumb(trail, deps)
//  เพื่อระบุ trail (ส่วนที่ต่อจาก "หน้าหลัก") เอง — ระบบจะเติม "หน้าหลัก" ให้
function breadcrumbHome(goRoute) {
  return { label: 'หน้าหลัก', icon: 'dashboard', onClick: () => goRoute({ view: 'search' }) };
}
// ─── Breadcrumb มาตรฐาน 3 ระดับ ────────────────────────────────────
//  หน้าหลัก › ชื่อเมนู › รายละเอียด | แก้ไขข้อมูล | สร้าง<ชื่อเมนู>
//  mode: 'list' | 'view' | 'edit' | 'create'
function crumb3(menu, mode, onBack) {
  const strip = (s) => String(s || '').replace(/^(กำหนด|บันทึก|สร้าง)\s*/, '');
  const lv3 = mode === 'edit' ? 'แก้ไขข้อมูล'
            : mode === 'create' ? 'สร้าง' + strip(menu)
            : mode === 'view' ? 'รายละเอียด' : null;
  return lv3 ? [{ label: menu, onClick: onBack }, { label: lv3, current: true }]
             : [{ label: menu, current: true }];
}
const BreadcrumbContext = React.createContext(null);
function useBreadcrumb(trail, deps) {
  const ctx = React.useContext(BreadcrumbContext);
  React.useEffect(() => {
    if (ctx && ctx.setTrail) ctx.setTrail(trail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || []);
}
function buildBreadcrumb(route, goRoute) {
  route = route || {};
  const home = breadcrumbHome(goRoute);
  if (route.view === 'search') return [{ label: 'ทะเบียนสมาชิก', icon: 'dashboard', current: true }];
  if (route.view === 'member-new')
    return [home, { label: 'ทะเบียนสมาชิก', onClick: () => goRoute({ view: 'search' }) }, { label: 'เพิ่มสมาชิกใหม่', current: true }];
  if (route.view === 'member')
    return [home, { label: 'ทะเบียนสมาชิก', onClick: () => goRoute({ view: 'search' }) }, { label: 'รายละเอียดสมาชิก', current: true }];

  const id = routeToActiveId(route);
  const top = NAV_TOP.find(t => t.id === id);
  if (top) return [home, { label: top.label, current: true }];
  const topParent = NAV_TOP.find(t => t.children && t.children.some(c => c.id === id));
  if (topParent) return [home, { label: topParent.label }, { label: topParent.children.find(c => c.id === id).label, current: true }];

  for (const sys of NAV_SYSTEMS) {
    for (const g of sys.groups) {
      const it = g.items.find(x => x.id === id);
      if (it) return [home, { label: it.label, current: true }];
      const parent = g.items.find(x => x.children && x.children.some(c => c.id === id));
      if (parent) {
        const child = parent.children.find(c => c.id === id);
        return [home, { label: child.label, current: true }];
      }
    }
  }
  return [{ label: 'หน้าหลัก', icon: 'dashboard', current: true }];
}

function Breadcrumb({ items }) {
  if (!items || !items.length) return null;
  return (
    <nav className="breadcrumb-bar" aria-label="breadcrumb">
      <div className="breadcrumb">
        {items.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="crumb-sep"><Icon name="chevRight" size={12} /></span>}
            {c.onClick && !c.current ? (
              <button type="button" className="crumb-link" onClick={c.onClick}>
                {c.icon && <Icon name={c.icon} size={13} />}<span>{c.label}</span>
              </button>
            ) : (
              <span className={c.current ? 'crumb-cur' : 'crumb-text'}>
                {c.icon && <Icon name={c.icon} size={13} />}<span>{c.label}</span>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

Object.assign(window, { Icon, Sidebar, Topbar, MemberHeader, MemberPanel, TabBar, TOP_TABS, Breadcrumb, buildBreadcrumb, breadcrumbHome, crumb3, BreadcrumbContext, useBreadcrumb });