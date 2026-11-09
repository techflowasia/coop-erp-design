// ════════════════════════════════════════════════════════════════════
//  ปรับช่องค้นหาแบบพิมพ์อิสระ (รายการเบิกเงินกู้ค้าง ฯลฯ) ให้เป็นรูปแบบ
//  "คลิกเพื่อค้นหาสมาชิก" ตาม Design system — ใช้ MemberSearchField เดิม
//  ทำงานโดยดักการสร้าง element ของ input ที่มี placeholder ตรงรูปแบบรายการ
// ════════════════════════════════════════════════════════════════════
(function () {
  if (window.__memberSearchFieldPatch) return;
  window.__memberSearchFieldPatch = true;

  const isListMemberSearch = (ph) =>
    typeof ph === 'string' && /เลขสมาชิก\s*,\s*ชื่อสมาชิก/.test(ph);

  function ListMemberSearch({ value, onChange, onKeyDown, placeholder }) {
    const [member, setMember] = React.useState(null);
    const MSF = window.MemberSearchField;
    const source = window.MEMBERS_LIST || window.DN_MEMBERS || window.MEMBERS || [];

    const emit = (v) => {
      if (onChange) onChange({ target: { value: v } });
      if (onKeyDown) onKeyDown({ key: 'Enter', preventDefault() {} });
    };

    React.useEffect(() => { if (!value && member) setMember(null); }, [value]);

    if (!MSF) {
      return (
        <input value={value || ''} onChange={onChange} onKeyDown={onKeyDown}
               placeholder={placeholder} style={{ height: 32 }} />
      );
    }
    return (
      <MSF member={member} source={source}
           searchFn={window.msSearchMembers ? (c) => window.msSearchMembers(source, c) : undefined}
           title="ค้นหาสมาชิก" changeLabel="เปลี่ยนสมาชิก"
           placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อสมาชิก…"
           onPick={(m) => { setMember(m); emit(m ? (m.code || m.memberNo || m.name) : ''); }} />
    );
  }

  const create = React.createElement.bind(React);
  React.createElement = function (type, props, ...children) {
    if (type === 'input' && props && isListMemberSearch(props.placeholder)) {
      return create(ListMemberSearch, {
        value: props.value, onChange: props.onChange,
        onKeyDown: props.onKeyDown, placeholder: props.placeholder,
      });
    }
    return create(type, props, ...children);
  };
  window.ListMemberSearch = ListMemberSearch;

  // ลบกรอบ/ไอคอนของช่อง .search เดิม เมื่อภายในเป็นปุ่มค้นหาสมาชิกแล้ว
  const css = `
    .search:has(.gc-member-trigger), .search:has(.lb-trigger) {
      border: 0; padding: 0; height: auto !important; background: transparent; box-shadow: none;
    }
    .search:has(.gc-member-trigger) > svg, .search:has(.lb-trigger) > svg { display: none; }
    .search:has(.gc-member-trigger) > div, .search:has(.gc-member-trigger) > button,
    .search:has(.lb-trigger) > div, .search:has(.lb-trigger) > button { flex: 1; min-width: 0; }`;
  const el = document.createElement('style');
  el.id = 'list-member-search-ds';
  el.textContent = css;
  if (!document.getElementById(el.id)) document.head.appendChild(el);
})();
