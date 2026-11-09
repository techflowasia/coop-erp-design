// ════════════════════════════════════════════════════════════════════
//  ช่องกรอกตัวเลขทั้งระบบ — แทน <input type="number"> ด้วยช่องข้อความที่รับเฉพาะตัวเลข
//  · ไม่มีปุ่ม Spinner / ลูกกลิ้งและลูกศรคีย์บอร์ดไม่เปลี่ยนค่า
//  · รับเฉพาะ 0-9 จุดทศนิยม 1 จุด และเครื่องหมายลบ (เมื่อ min < 0) — วาง "1,250,000" ได้
//  · ขณะพิมพ์แสดงเลขล้วน · ออกจากช่องแสดงลูกน้ำ (ยกเว้นเลขปี 4 หลัก)
//  · ค่าที่ส่งให้ onChange ยังเป็นเลขล้วน — โค้ดเดิมใช้ Number(e.target.value) ได้ตามเดิม
// ════════════════════════════════════════════════════════════════════
(function () {
  if (!window.React || window.__numTextPatched) return;
  window.__numTextPatched = true;
  const R = window.React, ce = R.createElement;

  const isYear = (n) => Number.isInteger(n) && ((n >= 2400 && n <= 2700) || (n >= 1900 && n <= 2100));
  function fmtShow(v, money2) {
    const s = String(v == null ? '' : v).replace(/,/g, '').trim();
    if (!/^-?\d+(\.\d*)?$/.test(s)) return s;
    const n = Number(s);
    if (money2) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (Math.abs(n) < 1000 || isYear(n)) return s;
    const neg = s[0] === '-', body = neg ? s.slice(1) : s;
    const [i, d] = body.split('.');
    return (neg ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d != null ? '.' + d : '');
  }
  function clean(t, allowNeg) {
    let s = String(t).replace(/,/g, '').replace(allowNeg ? /[^\d.\-]/g : /[^\d.]/g, '');
    if (allowNeg) s = (s[0] === '-' ? '-' : '') + s.replace(/-/g, '');
    const i = s.indexOf('.');
    if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
    return s;
  }

  const NumText = R.forwardRef(function NumText(props, ref) {
    const { type, min, max, step, onChange, onFocus, onBlur, value, ...rest } = props;
    const [focus, setFocus] = R.useState(false);
    const elRef = R.useRef(null);
    const setRef = (el) => {
      elRef.current = el;
      if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
    };
    const allowNeg = min != null && min !== '' && Number(min) < 0;
    const p = {
      ...rest, ref: setRef, type: 'text', inputMode: allowNeg ? 'text' : 'decimal', autoComplete: rest.autoComplete || 'off',
      'data-numtext': '',
      onChange: (e) => {
        const c = clean(e.target.value, allowNeg);
        if (c !== e.target.value) e.target.value = c;
        onChange && onChange(e);
      },
      onFocus: (e) => { setFocus(true); onFocus && onFocus(e); },
      onBlur: (e) => { setFocus(false); onBlur && onBlur(e); },
    };
    if (value !== undefined) {
      const raw = value == null ? '' : String(value);
      p.value = focus ? raw.replace(/,/g, '') : fmtShow(raw, !!(elRef.current && elRef.current.__moneyFmt));
    }
    return ce('input', p);
  });

  R.createElement = function (t, cfg) {
    if (t === 'input' && cfg && cfg.type === 'number') {
      const args = Array.prototype.slice.call(arguments);
      args[0] = NumText;
      return ce.apply(R, args);
    }
    return ce.apply(R, arguments);
  };
})();
