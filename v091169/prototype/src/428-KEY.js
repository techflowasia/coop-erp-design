// ลบผลิตภัณฑ์รหัส "ก" (ข้อมูลทดสอบ) ออกจากรายการประเภทเงินกู้
(function () {
  const KEY = 'loan_types';
  const JUNK = /^(ก)$/;
  const drop = (list) => (Array.isArray(list)
    ? list.filter((p) => !JUNK.test(String(p && p.code || '').trim()))
    : list);

  if (window.LP_SEED) window.LP_SEED = drop(window.LP_SEED);

  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const cur = JSON.parse(raw);
      const next = drop(cur);
      if (Array.isArray(cur) && next.length !== cur.length) {
        localStorage.setItem(KEY, JSON.stringify(next));
      }
    }
  } catch (e) { /* ignore */ }
})();
