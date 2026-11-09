// จำกัดข้อมูลตัวอย่างหลักทรัพย์ในหน้า "นัดหมายออกสำรวจหลักทรัพย์" ให้แสดงไม่เกิน 5 รายการ
(function () {
  const css = '.sv-modal .sv-asset-list > .sv-asset:nth-child(n+6) { display: none; }';
  const el = document.createElement('style');
  el.id = 'sv-asset-cap-5';
  el.textContent = css;
  if (!document.getElementById(el.id)) document.head.appendChild(el);
})();
