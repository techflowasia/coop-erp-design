// ติดชื่อระบบไว้ที่ <html data-sys="…"> ตาม route ปัจจุบัน เพื่อให้ CSS ของแต่ละระบบมีผลเฉพาะหน้าของระบบนั้น
// credit = สินเชื่อ/หลักทรัพย์/ขอสินไหม · dep = เงินฝาก/การเงิน/การลงทุน/บัญชี/ลูกหนี้ตัวแทน · proc = ประมวลผล · core = อื่นๆ
(function () {
  var MAP = { loan: 'credit', claims: 'credit', deposit: 'dep', finance: 'dep', invest: 'dep', account: 'dep', agent: 'dep', process: 'proc' };
  function sysOf(h) { var m = (h || '').match(/^#([a-z-]+)\//); return (m && MAP[m[1]]) || 'core'; }
  function apply() { var s = sysOf(location.hash); if (document.documentElement.dataset.sys !== s) document.documentElement.dataset.sys = s; }
  ['pushState', 'replaceState'].forEach(function (k) { var o = history[k]; history[k] = function () { var r = o.apply(this, arguments); apply(); return r; }; });
  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', apply);
  apply();
})();
