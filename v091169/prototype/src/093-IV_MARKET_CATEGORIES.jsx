// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน — ราคาตลาดประจำวัน (Daily Market Price)
//  • หมวดสินทรัพย์ที่ใช้ราคาตลาด (IV_MARKET_CATEGORIES)
//  • เกณฑ์การคิดมูลค่าตลาด (par = % ของมูลค่าหน้าตั๋ว / unit = ราคาต่อหน่วย)
//  • คลังราคาตลาด (load/save) + การหาค่าตั้งต้นจากพอร์ตให้สอดคล้องกัน
// ════════════════════════════════════════════════════════════════════

// หมวดสินทรัพย์ที่ต้องอัปเดทราคาตลาดประจำวัน (ตามที่กำหนด)
//  codes  : รหัสประเภทสินทรัพย์ที่จัดอยู่ในหมวดนี้
//  basis  : par  = ราคาเป็น % ของมูลค่าหน้าตั๋ว (ตราสารหนี้)
//           unit = ราคาต่อหน่วย/ราคาต่อหุ้น/NAV (ตราสารทุน·กองทุน)
window.IV_MARKET_CATEGORIES = [
  { key: 'tbill', label: 'ตั๋วเงินคลัง',                  codes: ['TBILL'],         basis: 'unit', priceLabel: 'ราคา (บาท/หน่วย)' },
  { key: 'bond',  label: 'พันธบัตร',                      codes: ['GOVB', 'SOEB'],  basis: 'unit', priceLabel: 'ราคา (บาท/หน่วย)' },
  { key: 'pfund', label: 'กองทุนส่วนบุคคล',               codes: ['PFND'],          basis: 'unit', priceLabel: 'มูลค่า (บาท/หน่วย)' },
  { key: 'mfund', label: 'กองทุนรวม',                     codes: ['FUND'],          basis: 'unit', priceLabel: 'NAV (บาท/หน่วย)' },
  { key: 'stock', label: 'หุ้นสามัญ',                     codes: ['STOCK'],         basis: 'unit', priceLabel: 'ราคา (บาท/หุ้น)' },
  { key: 'corp',  label: 'บริษัทเอกชนในตลาดหลักทรัพย์',   codes: ['DEBT', 'PVTB'],  basis: 'unit', priceLabel: 'ราคา (บาท/หน่วย)' },
];

// หมวดราคาตลาดของรหัสประเภทสินทรัพย์ (null = ไม่ต้องอ้างอิงราคาตลาด)
window.ivMarketCatOf = (code) => (window.IV_MARKET_CATEGORIES || []).find(c => c.codes.includes(code)) || null;

// เกณฑ์การคิดมูลค่าตลาด — ระบุราคา "ต่อ 1 หน่วย" เสมอ (บาท/หน่วย)
window.ivMarketBasis = function (rec) { return 'unit'; };

// รายการนี้ต้องระบุราคาตลาดในวันที่ลงทุนหรือไม่
//  → ใช่ เมื่ออยู่ในหมวดราคาตลาด หรือประเภทกำหนดให้บันทึกมูลค่าตลาด
window.ivNeedsMarketPrice = function (assetTypeCode) {
  if (window.ivMarketCatOf(assetTypeCode)) return true;
  const t = window.ivAssetType(assetTypeCode);
  return !!(t && t.needMarketValue);
};

// มูลค่าตลาด = จำนวนหน่วย × ราคาตลาดต่อ 1 หน่วย (บาท/หน่วย)
window.ivMarketValue = function (rec, price) {
  return Number(rec.units || 0) * Number(price || 0);
};

// ราคาตั้งต้นต่อหน่วย (ให้ผลรวมตรงกับ currentValue ของพอร์ต เพื่อความสอดคล้อง)
window.ivDerivePrice = function (rec) {
  return rec.units ? +(rec.currentValue / rec.units).toFixed(4) : 0;
};

// ราคาปิดวันก่อนหน้า (deterministic ±0.6% เพื่อให้มีการเคลื่อนไหวรายวันที่สมจริง)
window.ivDerivePrevClose = function (rec, price) {
  price = price != null ? price : window.ivDerivePrice(rec);
  let h = 0; const s = rec.securityCode || rec.id || '';
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  const pct = ((h % 13) - 6) / 1000;   // -0.6% .. +0.6%
  return +(price * (1 - pct)).toFixed(4);
};

// วันที่อ้างอิงราคาตลาดเริ่มต้น (วันนี้ของระบบ)
window.ivMarketDefaultDate = () => (window.ivToday ? window.ivToday() : new Date().toISOString().slice(0, 10));

// คลังราคาตลาด: { asOf, prices: { [securityCode]: { price, prevClose, asOf } } }
window.ivLoadMarket = function () {
  try { const s = localStorage.getItem('invest_market_v2'); if (s) return JSON.parse(s); } catch (e) {}
  return { asOf: window.ivMarketDefaultDate(), prices: {} };
};
window.ivSaveMarket = function (store) { try { localStorage.setItem('invest_market_v2', JSON.stringify(store)); } catch (e) {} };

// ราคาตลาดของรายการ (override ที่บันทึกไว้ หรือค่าตั้งต้นจากพอร์ต)
window.ivMarketPriceOf = function (store, rec) {
  const o = store && store.prices ? store.prices[rec.securityCode] : null;
  const price = (o && o.price != null) ? o.price : window.ivDerivePrice(rec);
  const prevClose = (o && o.prevClose != null) ? o.prevClose : window.ivDerivePrevClose(rec, price);
  return { price, prevClose, asOf: (o && o.asOf) || (store && store.asOf) || window.ivMarketDefaultDate() };
};

// % เปลี่ยนแปลงวันนี้ (เทียบราคาปิดก่อนหน้า)
window.ivMarketDayChange = (price, prevClose) => (prevClose ? ((price - prevClose) / prevClose) * 100 : 0);
// % เติบโต/ผลตอบแทนรวม (เทียบต้นทุน)
window.ivGrowthPct = (rec, marketValue) => (rec.investAmount ? ((marketValue - rec.investAmount) / rec.investAmount) * 100 : 0);
