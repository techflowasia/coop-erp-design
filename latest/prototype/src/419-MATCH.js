// ═════════════════════════════════════════════════════════════════
//  ประเภทเงินกู้ (รายละเอียด) — ช่อง "หลักการปัดเศษ" เปลี่ยนจาก dropdown
//  เป็นกรอกตัวเลขเอง (บาท) โดยเขียนค่ากลับเข้า state เดิมของหน้า
// ═════════════════════════════════════════════════════════════════

(function () {
  const MATCH = ['หลักหน่วย', 'หลักสิบ', 'หลักร้อย', 'หลักพัน'];
  const isPlaceSelect = (sel) => {
    const labels = Array.from(sel.options).map((o) => (o.textContent || '').trim());
    return MATCH.every((m) => labels.includes(m));
  };
  const setSelectValue = (sel, value) => {
    if (!Array.from(sel.options).some((o) => o.value === value)) {
      const o = document.createElement('option');
      o.value = value; o.textContent = value;
      sel.appendChild(o);
    }
    const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
    desc.set.call(sel, value);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const swap = (sel) => {
    if (sel.dataset.rpSwapped) return;
    sel.dataset.rpSwapped = '1';
    sel.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = sel.className.replace('l2-select', 'l2-input') + ' cfg-input';
    input.setAttribute('aria-label', 'หลักการปัดเศษ');
    input.placeholder = 'เช่น หลักสิบ';
    input.style.cssText = 'width:140px;height:32px;padding:0 10px;border:1px solid #d9d9d9;border-radius:2px;' +
      'font-family:inherit;font-size:13px;color:rgba(0,0,0,.88);box-sizing:border-box;';
    input.value = (sel.options[sel.selectedIndex] || {}).textContent || sel.value || '';
    input.disabled = sel.disabled;

    input.addEventListener('change', () => {
      const v = input.value.trim();
      if (v) setSelectValue(sel, v);
    });

    sel.insertAdjacentElement('afterend', input);
    sel.__rpInput = input;
    input.__rpSel = sel;
    injected.add(input);
  };

  const injected = new Set();

  const sync = () => {
    // เก็บกวาด input ที่ select คู่กันหายไปแล้ว (หน้าเปลี่ยนเป็นโหมดอ่าน)
    injected.forEach((input) => {
      const sel = input.__rpSel;
      if (!sel || !document.contains(sel) || !document.contains(input)) {
        input.remove();
        injected.delete(input);
        if (sel) delete sel.dataset.rpSwapped;
      }
    });
    document.querySelectorAll('select').forEach((sel) => {
      if (!isPlaceSelect(sel)) return;
      swap(sel);
      const input = sel.__rpInput;
      if (input && document.activeElement !== input) {
        const label = (sel.options[sel.selectedIndex] || {}).textContent || sel.value || '';
        if (input.value !== label) input.value = label;
        input.disabled = sel.disabled;
      }
    });
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    const run = () => { if (!queued) return; queued = false; try { sync(); } catch (e) {} };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    setTimeout(run, 50);
  };
  const start = () => {
    schedule();
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
