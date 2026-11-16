// ─── Page scope gate ────────────────────────────────────────────────
//  แต่ละไฟล์หน้า (page) ประกาศ window.__PAGE_SCOPE = ['<system id>', ...]
//  เมนูทุกระบบยังคงแสดงครบตามเดิม แต่เมื่อกดเข้าเมนูของระบบที่ไม่อยู่ใน scope
//  จะแสดงสถานะ "ไม่มีข้อมูลให้ทำรายการ" แทนหน้าจอทำงานจริง
(function () {
  var SCOPE = window.__PAGE_SCOPE;
  if (!SCOPE || !SCOPE.length || typeof React === 'undefined') return;

  // เมนูส่วนบน — มีข้อมูลให้ทำรายการทุกหน้า
  var ALWAYS = ['members', 'dt-member-status', 'ac-voucher'];

  var VIEWS = ['system', 'deposit', 'loan', 'claims', 'process', 'invest',
               'debt', 'finance', 'welfare', 'account', 'agent'];

  function parseHash(h) {
    if (!h || h === '#' || h === '#search') return { view: 'search' };
    if (h === '#member-new') return { view: 'member-new' };
    var m = h.match(/^#member\/(.+)$/);
    if (m) return { view: 'member', code: decodeURIComponent(m[1]) };
    for (var i = 0; i < VIEWS.length; i++) {
      var v = VIEWS[i];
      if (h.indexOf('#' + v + '/') === 0) return { view: v, page: h.slice(v.length + 2) };
    }
    return { view: 'search' };
  }

  function systemOf(route) {
    var fn = window.navRouteToActiveId || window.routeToActiveId;
    var id = fn ? fn(route) : null;
    if (!id || ALWAYS.indexOf(id) >= 0) return null;
    var systems = window.NAV_SYSTEMS || [];
    for (var s = 0; s < systems.length; s++) {
      var groups = systems[s].groups || [];
      for (var g = 0; g < groups.length; g++) {
        var items = groups[g].items || [];
        for (var t = 0; t < items.length; t++) {
          if (items[t].id === id) return systems[s];
          var kids = items[t].children || [];
          for (var k = 0; k < kids.length; k++) if (kids[k].id === id) return systems[s];
        }
      }
    }
    return null;
  }

  function blockedSystem() {
    var sys = systemOf(parseHash(window.location.hash));
    if (!sys) return null;
    return SCOPE.indexOf(sys.id) >= 0 ? null : sys;
  }

  function ScopeEmptyState(props) {
    var h = React.createElement;
    return h('div', {
      style: {
        background: 'var(--surface-card, #fff)',
        border: '1px solid var(--border-light, #F0F0F0)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-card, 0 1px 2px rgba(0,0,0,.05))',
        padding: '64px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, textAlign: 'center',
      },
    },
      h('div', {
        style: {
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--brand-soft, #EAFEF2)',
          color: 'var(--brand-700, #237450)',
          display: 'grid', placeItems: 'center',
          fontSize: 20, fontWeight: 700, marginBottom: 6,
        },
      }, 'สอ'),
      h('div', { style: { fontSize: 16, fontWeight: 700, color: 'var(--text, rgba(0,0,0,.88))' } },
        'ไม่มีข้อมูลให้ทำรายการ'),
      h('div', { style: { fontSize: 13, color: 'var(--text-muted, rgba(0,0,0,.65))', maxWidth: 420, lineHeight: 1.6 } },
        'เมนู “' + props.label + '” อยู่นอกขอบเขตของหน้านี้ ' +
        'จึงยังไม่มีข้อมูลให้ทำรายการ กรุณาเปิดหน้าของระบบดังกล่าวเพื่อใช้งาน')
    );
  }

  var origCreateElement = React.createElement;
  React.createElement = function (type, props) {
    if (type === 'main' && props && props.className === 'main') {
      var sys = blockedSystem();
      if (sys) {
        var breadcrumb = arguments[2];
        return origCreateElement(type, props, breadcrumb,
          origCreateElement(ScopeEmptyState, { key: 'scope-empty', label: sys.label }));
      }
    }
    return origCreateElement.apply(null, arguments);
  };
})();
