// ════════════════════════════════════════════════════════════════════
//  badge "บันทึกล่าสุด" บนหน้ารายละเอียดสมาชิก (มุมขวาบน)
//  App หลักของระบบรวมมาจาก fork สินเชื่อ จึงไม่มีการเรนเดอร์ badge นี้
//  → ห่อ MemberDetailPage แล้วแทรก <span class="saved-badge"> ก่อนปุ่ม
//    "พิมพ์รายละเอียดสมาชิก" ใน .page-actions (ตำแหน่งเดียวกับไฟล์ 090969)
// ════════════════════════════════════════════════════════════════════
(function () {
  if (typeof React === 'undefined') return;
  var Base = window.MemberDetailPage;
  if (typeof Base !== 'function') return;

  var PRINT_LABEL = 'พิมพ์รายละเอียดสมาชิก';

  function elementText(node) {
    if (node == null || node === false) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(elementText).join('');
    if (React.isValidElement(node)) return elementText(node.props && node.props.children);
    return '';
  }

  function isPrintBtn(node) {
    if (!React.isValidElement(node) || node.type !== 'button') return false;
    return elementText(node).indexOf(PRINT_LABEL) >= 0;
  }

  function inject(node, badge) {
    if (!React.isValidElement(node) || !node.props || node.props.children == null) return node;
    var kids = React.Children.toArray(node.props.children);
    var hit = false;
    var next = [];
    kids.forEach(function (k, i) {
      if (isPrintBtn(k)) { hit = true; next.push(badge); next.push(k); return; }
      next.push(React.isValidElement(k) ? inject(k, badge) : k);
    });
    if (!hit && next.every(function (k, i) { return k === kids[i]; })) return node;
    return React.cloneElement(node, undefined, next.map(function (k, i) {
      return React.isValidElement(k) && k.key == null ? React.cloneElement(k, { key: 'sb' + i }) : k;
    }));
  }

  function MemberDetailPageWithBadge(props) {
    var audit = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
    var code = props && props.data && props.data.member ? props.data.member.code : null;
    var picked = props.picked === undefined ? true : props.picked;
    var label = null;
    if (picked && code && typeof window.savedBadgeTs === 'function') {
      var ts = window.savedBadgeTs(audit && audit.entries, ['ทะเบียนสมาชิก'], 'member:' + code);
      label = window.savedBadgeLabel ? window.savedBadgeLabel(ts) : null;
    }
    var tree = Base(props);
    if (!label) return tree;
    var badge = React.createElement('span',
      { key: 'saved-badge', className: 'saved-badge', style: { marginRight: 4 } }, label);
    return inject(tree, badge);
  }

  window.MemberDetailPage = MemberDetailPageWithBadge;
})();
