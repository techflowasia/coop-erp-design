// ════════════════════════════════════════════════════════════════════
//  แท็บวงเงินกู้ (หน้ารายละเอียดประเภทเงินกู้)
//  ช่องจำนวนเงินที่ไม่ได้ผ่าน LpNum (input.cfg-input) — ใส่ลูกน้ำและทศนิยม 2 ตำแหน่ง
//  จัดรูปเมื่อออกจากช่อง / แสดงเลขล้วนขณะพิมพ์  เช่น 50,000.00
//  แตะเฉพาะช่องที่บริบทเป็นจำนวนเงิน (บาท / วงเงิน / เพดาน / ยอด) เท่านั้น
// ════════════════════════════════════════════════════════════════════
(function () {
  const SCREEN = '[data-screen-label="หน้ารายละเอียดประเภทเงินกู้"]';
  const MONEY = /บาท|วงเงิน|เพดาน|ยอดเงิน|จำนวนเงิน/;
  const SKIP = /เท่า|เดือน|ปี|งวด|วัน|ครั้ง|สัญญา|ร้อยละ|%/;

  const num = (x) => {
    const s = String(x == null ? '' : x).replace(/,/g, '').trim();
    if (s === '') return null;
    const n = Number(s);
    return isFinite(n) ? n : null;
  };
  const show = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function context(input) {
    const row = input.closest('.l2-row') || input.closest('label') || input.parentElement;
    return row ? row.textContent || '' : '';
  }

  function isMoney(input) {
    const t = context(input);
    return MONEY.test(t) && !SKIP.test(t.replace(/บาท/g, ''));
  }

  function attach(input) {
    if (input.__moneyFmt) return;
    input.__moneyFmt = true;
    if (input.hasAttribute('data-numtext')) return;   // ช่องตัวเลขกลาง (170-numText) จัดรูปให้เองแล้ว
    if (input.type === 'number') input.type = 'text';
    input.inputMode = 'decimal';

    const format = () => {
      const n = num(input.value);
      if (n != null) input.value = show(n);
    };
    input.addEventListener('focus', () => {
      const n = num(input.value);
      input.value = n == null ? '' : String(n);
    });
    input.addEventListener('input', () => {
      let t = input.value.replace(/[^\d.]/g, '');
      const i = t.indexOf('.');
      if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
      if (t !== input.value) input.value = t;
    });
    input.addEventListener('blur', format);
    if (document.activeElement !== input) format();
  }

  let busy = false;
  function pass() {
    if (busy) return;
    busy = true;
    requestAnimationFrame(() => {
      busy = false;
      const screen = document.querySelector(SCREEN);
      if (!screen) return;
      screen.querySelectorAll('input.cfg-input').forEach((input) => {
        if (input.type === 'date' || input.readOnly) return;
        if (!isMoney(input)) return;
        attach(input);
      });
    });
  }

  const start = () => {
    pass();
    new MutationObserver(pass).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
