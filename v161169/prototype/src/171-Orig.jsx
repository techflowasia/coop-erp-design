// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — วงเงินกู้กลุ่ม (patch)
//   • เพิ่ม badge "ประวัติการแก้ไขล่าสุด" ในป๊อบอัพแก้ไข (เหนือช่องรหัส)
//   • ประทับผู้แก้ไข/เวลาแก้ไขล่าสุดลงข้อมูลเมื่อกดบันทึก
// ═════════════════════════════════════════════════════════════════

(function () {
  const Orig = window.LoanGroupConfigPage;
  if (!Orig || Orig.__lgBadgePatched) return;
  const KEY = 'loan_groups';
  const USER = () => window.LC_USER || 'มนตรี ศรีสุข';

  const load = () => {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
    return (window.LG_SEED || []).map(r => ({ ...r }));
  };
  const save = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} };
  const stamp = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())} น.`;
  };
  const fmtWhen = (v) => {
    if (!v) return '—';
    if (/^\d{2}\/\d{2}\/\d{4}/.test(String(v))) return v;
    const dOnly = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dOnly) return `${dOnly[3]}/${dOnly[2]}/${Number(dOnly[1]) + 543}`;
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return stamp(d);
  };

  const textOf = (node) => {
    if (node == null || typeof node === 'boolean') return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (node.props) return textOf(node.props.children);
    return '';
  };

  // ห่อ LgFormModal เพื่อแทรก badge ในโหมดแก้ไข
  function LgFormModalWithBadge(props) {
    const el = props.__inner(props);
    const rec = load().find(r => r.id === props.editRec.id || r.code === props.editRec.code);
    const by = (rec && (rec.updatedBy || rec.createdBy)) || props.editRec.createdBy || '—';
    const when = fmtWhen(rec && (rec.updatedAt || rec.createdDate));
    const badge = (
      <div className="lg-edit-badge" key="lg-edit-badge">
        <Icon name="info" size={13} />
        <span>แก้ไขล่าสุดโดย <b>{by}</b> เมื่อ <b>{when}</b></span>
      </div>
    );
    const inject = (node) => {
      if (Array.isArray(node)) return node.map(inject);
      if (!node || typeof node !== 'object' || !node.props) return node;
      if (node.type === 'form' && String(node.props.className || '').includes('modal-body')) {
        return React.cloneElement(node, {}, [badge, ...React.Children.toArray(node.props.children)]);
      }
      return React.cloneElement(node, {}, inject(React.Children.toArray(node.props.children)));
    };
    return inject(el);
  }

  function LoanGroupConfigPage(props) {
    const onClickCapture = React.useRef((e) => {
      const b = e.target && e.target.closest && e.target.closest('button');
      if (!b || b.disabled) return;
      if (!/^บันทึก/.test((b.textContent || '').trim())) return;
      const card = b.closest('.modal-card');
      if (!card) return;
      const sub = card.querySelector('.modal-head .muted');
      const code = sub ? String(sub.textContent).split('·')[0].trim() : '';
      setTimeout(() => {
        const list = load();
        const rec = list.find(r => r.code === code);
        if (!rec) return;
        rec.updatedBy = USER();
        rec.updatedAt = stamp(new Date());
        save(list);
      }, 30);
    }).current;

    const tree = Orig(props);

    const wrap = (node) => {
      if (Array.isArray(node)) return node.map(wrap);
      if (!node || typeof node !== 'object' || !node.props) return node;
      if (typeof node.type === 'function' && node.type.name === 'LgFormModal' && node.props.editRec) {
        return React.createElement(LgFormModalWithBadge, { ...node.props, __inner: node.type, key: 'lg-form-modal' });
      }
      return React.cloneElement(node, {}, wrap(React.Children.toArray(node.props.children)));
    };

    return (
      <div onClickCapture={onClickCapture} style={{ display: 'contents' }}>
        {wrap(tree)}
      </div>
    );
  }
  LoanGroupConfigPage.__lgBadgePatched = true;
  Object.assign(window, { LoanGroupConfigPage });
})();
