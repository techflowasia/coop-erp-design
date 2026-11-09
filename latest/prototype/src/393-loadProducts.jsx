// ════════════════════════════════════════════════════════════════════
//  ห้ามกู้ — ดึงรายการประเภทเงินกู้จาก "ค่าคงที่ประเภทเงินกู้"
//  แหล่งข้อมูลเดียวกับหน้า ค่าคงที่ › ประเภทเงินกู้ (localStorage: loan_types)
//  ถ้ายังไม่มีข้อมูลที่บันทึกไว้ ใช้ค่าตั้งต้น window.LP_SEED
//  รูปแบบที่แสดง: "10 (ฉฉ) - ฉุกเฉินเงินสด"  (เฉพาะประเภทที่เปิดใช้งาน)
// ════════════════════════════════════════════════════════════════════
(function () {
  const loadProducts = () => {
    try {
      const s = localStorage.getItem('loan_types');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return window.LP_SEED ? JSON.parse(JSON.stringify(window.LP_SEED)) : [];
  };

  const label = (p) => [p.code, p.abbr ? '(' + p.abbr + ')' : '', '-', p.name]
    .filter(Boolean).join(' ');

  const products = loadProducts()
    .filter(p => p && p.name && p.enabled !== false)
    .sort((a, b) => String(a.code).localeCompare(String(b.code), 'th', { numeric: true }));

  if (!products.length) return;   // ไม่มีค่าคงที่ → คงรายการเดิมไว้

  window.LOAN_BAN_PRODUCTS = products;
  window.LOAN_BAN_TYPES = products.map(label);

  // เทียบรายการห้ามกู้เดิม (seed) กับชื่อประเภทจากค่าคงที่ เพื่อให้ยังแสดงสถานะ "ห้ามกู้อยู่แล้ว" ได้
  if (Array.isArray(window.LOAN_BAN_SEED)) {
    window.LOAN_BAN_SEED = window.LOAN_BAN_SEED.map(b => {
      const hit = products.find(p => p.name === b.loanType)
        || products.find(p => b.loanType && (p.name.includes(b.loanType) || b.loanType.includes(p.name)));
      return hit ? { ...b, loanType: label(hit) } : b;
    });
  }
})();
