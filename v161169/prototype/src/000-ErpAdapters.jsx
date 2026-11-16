// ═══════════════════════════════════════════════════════════════════
//  ตัวเชื่อม shared/erp-components.jsx → ระบบสินเชื่อ
//  ให้ช่องวันที่ / ช่องค้นหา ทั้งระบบใช้รูปแบบเดียวกับ ERP สหกรณ์
//  ต้องโหลดหลัง shared/erp-components.jsx
// ═══════════════════════════════════════════════════════════════════

const ERP_DATE_PLACEHOLDER = 'วว/ดด/ปปปป';

// ── ช่องวันที่ พ.ศ. (แก้ไขได้) · รองรับ min/max แบบ "เตือน ไม่บล็อก" ──
function ErpDate({ value, onChange, disabled, placeholder, style, className, min, max, title }) {
  const Cmp = window.ThaiDateInput;
  const v = value || '';
  const under = min && v && v < min;
  const over = max && v && v > max;
  const bad = !!(under || over);
  const msg = under ? 'วันที่ต้องไม่ก่อน ' + (window.isoToTh ? window.isoToTh(min) : min)
            : over ? 'วันที่ต้องไม่เกิน ' + (window.isoToTh ? window.isoToTh(max) : max) : '';

  if (!Cmp) {
    return <input className={className || 'cfg-input'} type="date" value={v} disabled={disabled}
                  min={min} max={max} title={title}
                  onChange={(e) => onChange && onChange(e.target.value)} />;
  }
  return (
    <div style={style} title={title}>
      <Cmp value={v} onChange={onChange} disabled={disabled} error={bad}
           placeholder={placeholder || ERP_DATE_PLACEHOLDER} />
      {bad && <div style={{ color: 'var(--danger)', fontSize: 11, marginTop: 3 }}>{msg}</div>}
    </div>
  );
}

// ── วันที่แบบอ่านอย่างเดียว → ข้อความ พ.ศ. (ว่าง = ขีดกลาง) ────────
function ErpDateText({ value, className, style }) {
  const th = window.isoToTh ? window.isoToTh(value) : '';
  return <span className={'mono' + (className ? ' ' + className : '')}
               style={{ display: 'inline-block', ...style }}>{th || '–'}</span>;
}

// ── ช่องค้นหาสมาชิก (พิมพ์รหัส + Enter · แว่นขยายเปิด modal เดิม) ──
function ErpMemberPicker({ member, onPick, source, searchFn, title, placeholder, disabled, style, className,
                           showName = false, codeOnly = false }) {
  const list = source || window.GUAR_MEMBERS || window.MEMBERS_LIST || [];
  const [open, setOpen] = React.useState(false);
  const Picker = window.SearchPickerField;
  const Modal = window.MemberSearchModal;
  if (!Picker) return null;
  const name = member && (member.name || [member.firstName, member.lastName].filter(Boolean).join(' '));
  return (
    <div style={{ position: 'relative', ...style }}>
      <Picker value={member ? member.code : ''} items={list}
              keyOf={(m) => m.code}
              labelOf={(m) => codeOnly ? m.code : [m.code, m.name || [m.firstName, m.lastName].filter(Boolean).join(' ')].filter(Boolean).join(' - ')}
              className={className || 'cfg-input'}
              placeholder={placeholder || 'เลขสมาชิก…'}
              notFoundText="ไม่พบเลขสมาชิกนี้ในระบบ"
              disabled={disabled}
              onPick={(m) => onPick && onPick(m)}
              onOpenModal={() => setOpen(true)} />
      {showName && name && (
        <div className="muted" style={{ fontSize: 11, marginTop: 3, whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      )}
      {open && Modal && (
        (window.ReactDOM && window.ReactDOM.createPortal ? window.ReactDOM.createPortal : (n) => n)(
          <Modal source={list} searchFn={searchFn} title={title || 'ค้นหาสมาชิก'} onClose={() => setOpen(false)}
                 onPick={(m) => { setOpen(false); onPick && onPick(m); }} />,
          document.body
        )
      )}
    </div>
  );
}

// ── ช่องค้นหาสัญญา (พิมพ์เลขสัญญา/เลขสมาชิก + Enter · แว่นเปิด modal เดิม) ──
function ErpContractPicker({ contract, member, onPick, source, debtsOf, statusMap, showUnit,
                             title, placeholder, disabled, style, className }) {
  const [open, setOpen] = React.useState(false);
  const Picker = window.SearchPickerField;
  const Modal = window.ContractSearchModal;
  const rows = React.useMemo(
    () => (window.csContractRows ? window.csContractRows(source, {}, debtsOf) : []),
    [source, debtsOf]);
  const no = typeof contract === 'string' ? contract : (contract && contract.contractNo);
  if (!Picker) return null;
  return (
    <div style={{ position: 'relative', ...style }}>
      <Picker value={no || ''} items={rows}
              keyOf={(r) => r.debt && r.debt.contractNo}
              labelOf={(r) => [r.debt.contractNo, (r.member && r.member.name) || r.memberName || r.debt.memberName || ''].filter(Boolean).join(' - ')}
              className={className || 'cfg-input'}
              placeholder={placeholder || 'เลขที่สัญญา / เลขสมาชิก…'}
              notFoundText="ไม่พบเลขที่สัญญานี้ในระบบ"
              disabled={disabled}
              onPick={(r) => onPick && onPick(r)}
              onOpenModal={() => setOpen(true)} />
      {false && member && no && (
        <div className="muted" style={{ fontSize: 11, marginTop: 3, whiteSpace: 'nowrap',
                                        overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {member.code} · {member.name || ''}
        </div>
      )}
      {open && Modal && (
        <Modal source={source} debtsOf={debtsOf} statusMap={statusMap} showUnit={showUnit} title={title}
               onPick={(r) => { setOpen(false); onPick && onPick(r); }}
               onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { ErpDate, ErpDateText, ErpMemberPicker, ErpContractPicker });
