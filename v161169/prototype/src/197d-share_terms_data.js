// ข้อมูลค่าคงที่ข้อกำหนดประเภทหุ้น (SH_*) — ใช้โดย ShareTermsConfigPage (198)
window.SH_OPTS = {
  shareGroup: [
    { v: 'common',     l: 'หุ้นสามัญ' },
    { v: 'special',    l: 'หุ้นพิเศษ' },
    { v: 'preferred',  l: 'หุ้นบุริมสิทธิ' },
  ],
  useForLoanRight: [
    { v: 'use',    l: 'ใช้คำนวณ' },
    { v: 'notuse', l: 'ไม่ใช้คำนวณ' },
  ],
  specialCountPeriod: [
    { v: 'no',  l: 'ไม่นับงวด' },
    { v: 'yes', l: 'นับงวด' },
  ],
  changeCountType: [
    { v: 'separate', l: 'นับแยกรายการ' },
    { v: 'combined', l: 'นับรวมรายการ' },
  ],
};

window.shLabel = (group, value) => {
  const o = (window.SH_OPTS[group] || []).find(x => x.v === value);
  return o ? o.l : (value || '—');
};

window.SH_SETTINGS_DEFAULTS = {
  shareGroup: 'common',
  parValue: 10.00,
  useForLoanRight: 'use',
  minHold: 0,
  maxHold: 0,
  specialBuyCutoffDay: 7,
  specialCountPeriod: 'no',
  defaultNoDividend: 9999,
  reduceMinPeriod: '',
  reduceMinShares: 0,
  suspendRequirePeriod: 180,
  suspendMinShares: 0,
  changeCountType: 'separate',
  combinedMax: 0,
  sepAdd: 1, sepReduce: 1, sepStop: 1, sepResume: 1,
};

function shTierSeed() {
  return [
    { salaryFrom: 0,     salaryTo: 20001,   sharesMin: 30,  sharesMax: 1000, user: 'admin', date: '2011-04-07' },
    { salaryFrom: 20001, salaryTo: 40001,   sharesMin: 60,  sharesMax: 1000, user: 'admin', date: '2011-04-07' },
    { salaryFrom: 40001, salaryTo: 60001,   sharesMin: 90,  sharesMax: 1500, user: 'admin', date: '2011-04-07' },
    { salaryFrom: 60001, salaryTo: 80001,   sharesMin: 120, sharesMax: 2000, user: 'admin', date: '2011-04-07' },
    { salaryFrom: 80001, salaryTo: 9999999, sharesMin: 300, sharesMax: 2500, user: 'admin', date: '2011-04-07' },
  ];
}
window.shTierSeed = shTierSeed;

window.SH_SEED = [
  {
    id: 'SH-01', name: 'หุ้นสามัญ', createdDate: '2011-04-07', createdBy: 'admin',
    note: 'ประเภทหุ้นหลักของสมาชิก — ส่งรายเดือนตามฐานเงินเดือน', enabled: true,
    settings: {
      ...window.SH_SETTINGS_DEFAULTS,
      shareGroup: 'common', parValue: 10.00, useForLoanRight: 'use',
      specialBuyCutoffDay: 7, defaultNoDividend: 9999, suspendRequirePeriod: 180,
      changeCountType: 'separate', combinedMax: 0,
      sepAdd: 1, sepReduce: 1, sepStop: 1, sepResume: 1,
    },
    tiers: shTierSeed(),
  },
  {
    id: 'SH-02', name: 'หุ้นพิเศษ', createdDate: '2018-10-01', createdBy: 'admin',
    note: 'หุ้นซื้อเพิ่มเป็นกรณีพิเศษ — ไม่บังคับส่งรายเดือน', enabled: true,
    settings: {
      ...window.SH_SETTINGS_DEFAULTS,
      shareGroup: 'special', parValue: 10.00, useForLoanRight: 'notuse',
      minHold: 0, maxHold: 50000, specialBuyCutoffDay: 15, specialCountPeriod: 'yes',
      defaultNoDividend: 12, suspendRequirePeriod: 0,
      changeCountType: 'combined', combinedMax: 3,
      sepAdd: 1, sepReduce: 1, sepStop: 1, sepResume: 1,
    },
    tiers: [
      { salaryFrom: 0, salaryTo: 9999999, sharesMin: 0, sharesMax: 5000, user: 'admin', date: '2018-10-01' },
    ],
  },
];
