// ลบผลิตภัณฑ์รหัส 22 (ด่วน) ออกจากรายการประเภทเงินกู้ — ทำครั้งเดียว
(function () {
  const KEY = 'loan_types';
  const FLAG = 'loan_types.drop22.v1';
  const drop = (list) => (Array.isArray(list) ? list.filter((p) => String(p && p.code) !== '22') : list);

  if (window.LP_SEED) window.LP_SEED = drop(window.LP_SEED);

  try {
    if (!localStorage.getItem(FLAG)) {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const next = drop(JSON.parse(raw));
        localStorage.setItem(KEY, JSON.stringify(next));
      }
      localStorage.setItem(FLAG, '1');
    }
  } catch (e) { /* ignore */ }
})();
