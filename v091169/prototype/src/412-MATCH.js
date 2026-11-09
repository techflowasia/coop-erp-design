// ════════════════════════════════════════════════════════════════════
//  Sticky bottom action bar
//  ย้ายปุ่ม "บันทึก / แก้ไข / ยกเลิก" ในแถวปุ่มด้านบนของหน้าจอ
//  ลงมาอยู่ในแถบติดขอบล่าง (ปุ่มเดิมถูกซ่อน แต่ยังทำงานเดิม)
// ════════════════════════════════════════════════════════════════════
(function () {
  const MATCH = [/^บันทึก/, /^แก้(ไข|ข้อมูล)/, /^ยกเลิก/, /^พิมพ์(ปกสมุด| BOOK)/, /^ส่งอนุมัติ/];
  const ROWS = '.page-actions > button, .lrq-topbar button, .lrq-topbtns button,' +
               ' .page-actions > span > button';
  const SKIP_IN = '.modal-card, .modal-backdrop, .lrq-printview, .lrqd-sheet, .fb-embed, .fb-vch-embed';
  // ปุ่มที่ให้คงอยู่มุมบนขวาของหน้า (ไม่ย้ายลงแถบล่าง)
  const KEEP_TOP = [/^\u0e41\u0e01\u0e49\u0e44\u0e02\u0e08\u0e33\u0e19\u0e27\u0e19\u0e04\u0e19\u0e04\u0e49\u0e33/, /^\u0e41\u0e01\u0e49\u0e44\u0e02\u0e42\u0e04\u0e23\u0e07\u0e01\u0e32\u0e23/, /\u0e2b\u0e19\u0e31\u0e07\u0e2a\u0e37\u0e2d\u0e40\u0e0a\u0e34\u0e0d/];

  const bar = document.createElement('div');
  bar.className = 'app-action-bar';
  bar.setAttribute('role', 'toolbar');

  const order = (t) => (/^ยกเลิก/.test(t) ? 0 : /^แก้(ไข|ข้อมูล)/.test(t) ? 1 : /^พิมพ์/.test(t) ? 2 : 3);
  let obs = null, lastSig = '';

  // หน้าที่จัดปุ่มไว้มุมบนขวาเองแล้ว — ไม่ต้องมีแถบล่าง
  const NO_BAR = '[data-screen-label="หน้ารายละเอียดกลุ่มนับค้ำ"],[data-screen-label="หน้ารายละเอียดสมาชิก"],[data-screen-label="หน้ารายละเอียดประเภทเงินกู้"],[data-screen-label="หน้ารายละเอียดจำนวนคนค้ำประกัน"],[data-screen-label="หน้ารายละเอียดข้อกำหนดสินเชื่อ"],[data-screen-label="หน้ารายละเอียดวงเงินค้ำประกัน"],[data-screen-label="หน้าข้อกำหนดระบบเงินฝาก"],[data-screen-label="หน้ารายการธนาคาร"],[data-screen-label="หน้ารายละเอียดประเภทบัญชีเงินฝาก"],[data-screen-label="หน้ารายละเอียดโครงการเงินกู้"],[data-screen-label="หน้ารายละเอียดอัตราดอกเบี้ยเงินกู้"],[data-screen-label="หน้าเพิ่มสมาชิกใหม่"],[data-screen-label*="สร้างคำขอกู้"],[data-screen-label="บันทึกหลักทรัพย์"],[data-screen-label="สำรวจหลักทรัพย์"],[data-screen-label="หน้าเบิกเงินกู้ค้างจ่าย (รายละเอียด)"],[data-screen-label="หน้ารายละเอียดคำขอสินไหม"],[data-screen-label="หน้าบันทึกทะเบียนขอสินไหม"],[data-screen-label="หน้ารายละเอียดกำหนดเงินเดือนคงเหลือ"]';

  function pass(main) {
    const originals = [];
    if (main.querySelector(NO_BAR)) {
      main.querySelectorAll('.ab-moved').forEach((b) => b.classList.remove('ab-moved'));
      if (lastSig !== '__nobar__') {
        lastSig = '__nobar__';
        bar.textContent = '';
        bar.classList.remove('show');
        document.body.classList.remove('has-action-bar');
      }
      return;
    }
    main.querySelectorAll(ROWS).forEach((b) => {
      const t = (b.textContent || '').trim();
      if (!MATCH.some((r) => r.test(t)) || KEEP_TOP.some((r) => r.test(t)) || b.hasAttribute('data-keep-top') || b.closest(SKIP_IN)) return;
      if (!b.classList.contains('ab-moved')) b.classList.add('ab-moved');
      originals.push(b);
    });
    originals.sort((a, c) => order((a.textContent || '').trim()) - order((c.textContent || '').trim()));

    // ปุ่มที่อยู่ในส่วน inert (โหมดดูอย่างเดียว) → แสดงในแถบแต่กดไม่ได้
    const locked = (b) => b.disabled || !!b.closest('[inert], fieldset[disabled], .fb-readonly');
    const sig = originals.map((b) => (b.textContent || '').trim() + '|' + (locked(b) ? 1 : 0)).join('~');
    if (sig === lastSig) return;
    lastSig = sig;

    bar.textContent = '';
    if (!originals.length) {
      bar.classList.remove('show');
      document.body.classList.remove('has-action-bar');
      return;
    }
    originals.forEach((b) => {
      const c = b.cloneNode(true);
      c.classList.remove('ab-moved');
      c.disabled = locked(b);
      c.addEventListener('click', (e) => { e.preventDefault(); if (locked(b)) return; b.click(); });
      bar.appendChild(c);
    });
    bar.classList.add('show');
    document.body.classList.add('has-action-bar');
  }

  let timer = 0;
  function sync() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const main = document.querySelector('.main');
      if (!main) return;
      if (obs) obs.disconnect();
      try { pass(main); } catch (e) { /* ignore */ }
      if (obs) { obs.takeRecords(); obs.observe(main, { childList: true, subtree: true }); }
    }, 200);
  }
  const start = () => {
    const main = document.querySelector('.main');
    if (!main) return setTimeout(start, 400);
    (main.parentElement || document.body).appendChild(bar);
    window.addEventListener('hashchange', sync);
    // สำรวจเป็นรอบ — ไม่ผูกกับโหนด .main ตัวใดตัวหนึ่ง และไม่เขียน DOM เมื่อไม่มีอะไรเปลี่ยน
    setInterval(() => {
      const m = document.querySelector('.main');
      if (m) { try { pass(m); } catch (e) { /* ignore */ } }
    }, 600);
    sync();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
