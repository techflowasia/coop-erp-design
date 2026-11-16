// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — แทน modal ยืนยัน "เปิด/ปิดใช้งาน" ของแต่ละหน้า
//  ด้วย ToggleConfirmModal กลาง (สไตล์ design system) แล้วต่อด้วย modal สำเร็จ
//  ทำงานระดับ DOM ด้วย MutationObserver — ไม่ผูกกับ render ของหน้า
// ═════════════════════════════════════════════════════════════════

(function () {
  const G = '#237450';
  const TOGGLE_RE = /(เปิด|ปิด)(การ)?(ใช้งาน|บังคับใช้)/;
  const txt = (el) => ((el && el.textContent) || '').trim();
  let overlay = null, success = null, current = null;

  const btnStyle = (primary) => `display:inline-flex;align-items:center;justify-content:center;gap:7px;height:38px;` +
    `border:1px solid ${primary ? G : '#d9d9d9'};background:${primary ? G : '#fff'};border-radius:4px;` +
    `font-family:inherit;font-size:13px;font-weight:600;color:${primary ? '#fff' : 'rgba(0,0,0,.65)'};` +
    `cursor:pointer;flex:1;`;

  const CHECK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5.5 5.5L20 7"/></svg>';
  const WARN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" stroke-width="1.8"/><path d="M12 7.5v5.5"/><path d="M12 16.3v.4"/></svg>';
  const CHECK_SM = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5.5 5.5L20 7"/></svg>';

  const removeOverlay = () => { if (overlay) { overlay.remove(); overlay = null; } current = null; };

  const showSuccess = (title, detail) => {
    if (success) success.remove();
    success = document.createElement('div');
    success.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:950;display:flex;align-items:center;justify-content:center;padding:16px;';
    success.innerHTML =
      `<div role="dialog" aria-modal="true" style="width:460px;max-width:100%;background:#fff;border-radius:12px;padding:36px 32px 32px;box-shadow:0 6px 24px rgba(0,0,0,.18);text-align:center;font-family:inherit">
         <span style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:9999px;background:#eafef2;color:${G};margin-bottom:20px">
           <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12.5 5.5 5.5L20 7"/></svg>
         </span>
         <h2 style="margin:0;font-size:20px;font-weight:700;color:rgba(0,0,0,.88);line-height:1.35">${title}</h2>
         <p style="margin:12px auto 0;max-width:380px;font-size:13px;color:rgba(0,0,0,.55);line-height:1.65">${detail}</p>
         <div style="display:flex;justify-content:center;margin-top:24px">
           <button type="button" data-close style="${btnStyle(true)}flex:0 0 auto;padding:0 26px">เสร็จสิ้น</button>
         </div>
       </div>`;
    const close = () => { if (success) { success.remove(); success = null; } };
    success.querySelector('[data-close]').addEventListener('click', close);
    document.body.appendChild(success);
  };

  const buildOverlay = (card) => {
    const title = txt(card.querySelector('.modal-head h2, h2, h3'));
    const sub = txt(card.querySelector('.modal-head .muted, .modal-head .mono'));
    const detail = txt(card.querySelector('.modal-body p, p'));
    const btns = Array.from(card.querySelectorAll('button'));
    const okBtn = btns.find((b) => /^(ยืนยัน|ตกลง|บันทึก)/.test(txt(b)));
    const cancelBtn = btns.find((b) => /ยกเลิก/.test(txt(b))) || card.querySelector('.close-btn');
    const next = /เปิด/.test(title);
    // ปิด/เปิดใช้งานไม่ได้ (ค่าคงที่ถูกใช้อยู่) → ปุ่ม "ปิด" ปุ่มเดียว ไม่มี "ยืนยัน"
    const blocked = !okBtn || /^(ปิด|เปิด)ใช้งานไม่ได้/.test(detail);
    const tone = blocked ? { bg: '#fff1f0', fg: '#cf1322', ico: WARN }
      : next ? { bg: '#eafef2', fg: G, ico: CHECK } : { bg: '#fffbe6', fg: '#d48806', ico: WARN };

    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:940;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML =
      `<div role="dialog" aria-modal="true" style="width:460px;max-width:100%;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);overflow:hidden;font-family:inherit">
         <div style="display:flex;align-items:flex-start;gap:12px;padding:20px 20px 16px;border-bottom:1px solid #f0f0f0">
           <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;flex-shrink:0;background:${tone.bg};color:${tone.fg}">${tone.ico}</span>
           <div style="min-width:0;flex:1">
             <h2 style="margin:0;font-size:16px;font-weight:700;color:rgba(0,0,0,.88);line-height:1.4">${title}</h2>
             ${sub ? `<div style="font-size:12px;color:rgba(0,0,0,.45);margin-top:2px">${sub}</div>` : ''}
           </div>
           <button type="button" data-cancel aria-label="ปิด" style="border:none;background:transparent;cursor:pointer;color:rgba(0,0,0,.35);font-size:18px;line-height:1;padding:0;margin-top:2px">×</button>
         </div>
         <p style="margin:0;padding:20px 20px 0;font-size:13px;color:rgba(0,0,0,.65);line-height:1.7;white-space:pre-line">${detail}</p>
         <div style="display:flex;gap:10px;padding:20px">
           ${blocked
             ? `<button type="button" data-cancel style="${btnStyle(false)}">ปิด</button>`
             : `<button type="button" data-cancel style="${btnStyle(false)}">ยกเลิก</button>
                <button type="button" data-ok style="${btnStyle(true)}">${CHECK_SM} ยืนยัน</button>`}
         </div>
       </div>`;

    const doCancel = () => { removeOverlay(); if (cancelBtn) cancelBtn.click(); };
    overlay.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', doCancel));
    const okEl = overlay.querySelector('[data-ok]');
    if (okEl) okEl.addEventListener('click', () => {
      removeOverlay();
      if (okBtn) okBtn.click();
      // ไม่แสดง popup "เรียบร้อยแล้ว" ซ้ำ — สวิตช์/แถวเปลี่ยนสีให้เห็นผลทันที
    });
    document.body.appendChild(overlay);
  };

  const scan = () => {
    const card = Array.from(document.querySelectorAll('.modal-card')).find(
      (el) => TOGGLE_RE.test(txt(el.querySelector('.modal-head h2, h2, h3')))
    );
    if (!card) { if (overlay) removeOverlay(); return; }
    card.style.visibility = 'hidden';
    const bd = card.parentElement && card.parentElement.querySelector('.modal-backdrop');
    if (bd) bd.style.visibility = 'hidden';
    if (current === card) return;
    if (overlay) overlay.remove();
    current = card;
    buildOverlay(card);
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    const run = () => { if (!queued) return; queued = false; try { scan(); } catch (e) {} };
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
