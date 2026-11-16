// ════════════════════════════════════════════════════════════════════
//  รายละเอียดโครงการอบรม/สัมมนา — ปุ่ม "แก้ไขโครงการ" มุมขวาบน เป็นสี primary
//  (การคงปุ่มไว้มุมบนขวาทำที่ 375_bottom_action_bar.js ผ่าน KEEP_TOP)
// ════════════════════════════════════════════════════════════════════
(function () {
  function run() {
    document.querySelectorAll('.page-actions button').forEach((b) => {
      if (!/แก้ไขโครงการ/.test(b.textContent || '')) return;
      if (!b.classList.contains('primary')) b.classList.add('primary');
    });
  }

  let busy = false;
  const tick = () => {
    if (busy) return;
    busy = true;
    requestAnimationFrame(() => { busy = false; try { run(); } catch (e) {} });
  };

  const start = () => {
    tick();
    new MutationObserver(tick).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
