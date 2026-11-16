// ════════════════════════════════════════════════════════════════════
//  ระบบรวม: ช่องวันที่ในหน้าระบบประมวลผล → ปฏิทินไทย (พ.ศ.)
//  ยกมาจาก 435a-thaidate-global.js ของระบบประมวลผล แต่จำกัดเฉพาะหน้า
//  #process/* และ #loan/ban (เมนูห้ามกู้ในกลุ่มประมวลผล) — ระบบอื่นไม่กระทบ
//  ใส่ data-native-date บน input ถ้าต้องการช่องวันที่ของเบราว์เซอร์
// ════════════════════════════════════════════════════════════════════
(function () {
  if (typeof React === 'undefined') return;
  var orig = React.createElement;
  var inScope = function () {
    var h = String(window.location.hash || '');
    return h.indexOf('#process/') === 0 || h === '#loan/ban';
  };

  function ThaiDateAdapter(props) {
    var p = props || {};
    var fire = function (iso) {
      if (!p.onChange) return;
      var ev = { target: { value: iso, name: p.name, type: 'date' }, currentTarget: { value: iso, name: p.name } };
      ev.preventDefault = function () {}; ev.stopPropagation = function () {}; ev.persist = function () {};
      p.onChange(ev);
    };
    var st = p.style || {};
    var wrapStyle = {};
    ['width', 'minWidth', 'maxWidth', 'flex', 'margin', 'marginTop', 'marginLeft', 'gridColumn'].forEach(function (k) {
      if (st[k] != null) wrapStyle[k] = st[k];
    });
    return orig('div', { style: wrapStyle, title: p.title },
      orig(window.ThaiDateInput, {
        value: p.value || '',
        onChange: fire,
        disabled: p.disabled || p.readOnly,
        onBlur: p.onBlur,
      }));
  }

  React.createElement = function (type, props) {
    if (type === 'input' && props && props.type === 'date' && !props['data-native-date']
        && window.ThaiDateInput && inScope()) {
      var args = Array.prototype.slice.call(arguments);
      args[0] = ThaiDateAdapter;
      return orig.apply(null, args);
    }
    return orig.apply(null, arguments);
  };
})();
