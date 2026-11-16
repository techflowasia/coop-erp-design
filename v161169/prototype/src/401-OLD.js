// เปลี่ยนชื่อหน้าจอ: ใบคำขอเปลี่ยนแปลงยอดชำระหนี้ → ใบคำขอเปลี่ยนแปลงงวดชำระ
(function () {
  const OLD = 'ใบคำขอเปลี่ยนแปลงยอดชำระหนี้';
  const NEW = 'ใบคำขอเปลี่ยนแปลงงวดชำระ';
  const fix = () => {
    const host = document.querySelector('[data-screen-label="' + OLD + '"]');
    if (!host) return;
    host.setAttribute('data-screen-label', NEW);
    const h1 = host.querySelector('.icr-form-title h1');
    if (h1 && h1.textContent.trim() === OLD) h1.textContent = NEW;
  };
  setInterval(fix, 600);
  document.addEventListener('DOMContentLoaded', fix);
})();
