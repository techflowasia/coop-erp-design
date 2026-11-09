// ════════════════════════════════════════════════════════════════════
//  Design System — การค้นหาสมาชิก (Member Search) · รูปแบบกลาง
//  ────────────────────────────────────────────────────────────────────
//  รูปแบบมาตรฐานสำหรับ "ค้นหา/เลือกสมาชิก" ใช้ซ้ำได้ทุกเมนู ทุกระบบ
//  ที่มา (source of truth): หน้าจอ "ตรวจสอบสิทธิค้ำ" (ระบบค้ำประกัน)
//
//  ประกอบด้วย 3 ส่วน:
//    • <MemberSearchField>   — ปุ่ม trigger ที่วางเป็น "value" ในฟอร์ม
//                               (ว่าง = แว่นขยาย + "คลิกเพื่อค้นหา…" + …
//                                เลือกแล้ว = avatar + รหัส + ชื่อ + "เปลี่ยน")
//    • <MemberSearchModal>   — popup ค้นหา 4 เงื่อนไข + ปุ่มค้นหา/ล้าง + ตารางผล
//                               (ทะเบียน · ชื่อ · นามสกุล · บัตรประชาชน)
//    • <MemberSearchEmptyState> — สถานะว่างก่อนเลือกสมาชิก + ปุ่มค้นหา
//
//  การใช้งานแบบสั้นที่สุด (จัดการ popup ให้เองภายใน):
//    const [member, setMember] = useState(null);
//    <MemberSearchField member={member} onPick={setMember}
//                       source={window.GUAR_MEMBERS} />
//
//  • source   : array สมาชิก (record ต้องมี .code เป็นอย่างน้อย)
//  • searchFn : (criteria) => members  — ไม่ใส่จะใช้ตัวค้นหากลาง
//               (msSearchMembers) ที่กรองด้วย รหัส/ชื่อ/นามสกุล/บัตร/หน่วย
//  • รองรับ field ได้หลายชื่อ: ชื่อ (firstName|name) · นามสกุล (lastName)
//    · หน่วย (unit|dept|department)
// ════════════════════════════════════════════════════════════════════

// อักษรย่อสำหรับ avatar — รองรับทั้ง member.firstName และ member.name
const msInitial = (m) =>
  String((m && (m.firstName || m.name)) || '?')
    .replace(/^(นาย|นาง|นางสาว)\s*/, '')
    .slice(0, 1);

// ชื่อ-นามสกุลแบบเต็มสำหรับแสดงในตาราง/trigger
const msFullName = (m) => {
  if (!m) return '';
  if (m.name) return m.name;
  return [m.title || '', m.firstName || '', m.lastName || ''].join(' ').replace(/\s+/g, ' ').trim();
};
const msUnit = (m) => (m && (m.unit || m.dept || m.department)) || '';

// ─── ตัวค้นหากลาง — กรองด้วย 5 เงื่อนไข (รหัส/ชื่อ/นามสกุล/บัตร/หน่วย) ──
const msSearchMembers = (source, c) => {
  const all = source || [];
  c = c || {};
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const code = norm(c.code), fn = norm(c.firstName), ln = norm(c.lastName),
        cid = norm(c.citizenId), un = norm(c.unit);
  if (!code && !fn && !ln && !cid && !un) return all;
  return all.filter((m) => {
    const name = norm(msFullName(m));
    return (!code || norm(m.code).includes(code))
      && (!fn || norm(m.firstName || m.name).includes(fn) || name.includes(fn))
      && (!ln || norm(m.lastName || m.name).includes(ln) || name.includes(ln))
      && (!cid || norm(m.citizenId).includes(cid))
      && (!un || norm(msUnit(m)).includes(un));
  });
};

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// เงื่อนไข: ทะเบียน · ชื่อ · นามสกุล · เลขที่บัตรประชาชน
// คอลัมน์ผล: ทะเบียน · ชื่อ-นามสกุล · เลขที่บัตรประชาชน
function MemberSearchModal({
  onPick,
  onClose,
  title = 'ค้นหาสมาชิก',
  source,            // array สมาชิก (ดีฟอลต์ window.GUAR_MEMBERS)
  searchFn,          // (criteria) => members (ดีฟอลต์ = ตัวค้นหากลาง)
  showUnit = false,  // แสดงเงื่อนไข + คอลัมน์ "หน่วย" (ปิดโดยดีฟอลต์)
  variant,           // 'juristic' = ค้นหาด้วยทะเบียน · ชื่อนิติบุคคล · เลขผู้เสียภาษี
  onAdd,             // () => void — ปุ่ม "เพิ่ม" ข้างปุ่มค้นหา
  addLabel = 'เพิ่มข้อมูล',
}) {
  const all = source || window.GUAR_MEMBERS || [];
  const jur = variant === 'juristic';
  const ext = variant === 'person';
  const inline = jur || ext;
  const norm = (x) => String(x == null ? '' : x).replace(/[\s-]/g, '').toLowerCase();
  const jurSearch = (c) => all.filter(p =>
    (!c.code || norm(p.code).includes(norm(c.code))) &&
    (!c.firstName || norm(p.orgName || p.name).includes(norm(c.firstName))) &&
    (!c.citizenId || norm(p.taxId).includes(norm(c.citizenId))));
  const doSearch = searchFn || (jur ? jurSearch : ((c) => msSearchMembers(all, c)));

  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' });
  const [results, setResults] = useState(() => all);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => setResults(doSearch(c));
  const reset = () => {
    setC({ code: '', firstName: '', lastName: '', citizenId: '', unit: '' });
    setResults(all);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid" style={jur ? { gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr) minmax(0,1fr) auto', alignItems: 'end' }
                 : ext ? { gridTemplateColumns: 'repeat(4, minmax(0,1fr)) auto', alignItems: 'end' } : undefined}>
            <label className="gc-sf">
              <span>1. ทะเบียน</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder={jur ? 'เช่น L00001' : ext ? 'เช่น E00001' : 'เช่น M-058241'} className="mono" autoFocus />
            </label>
            {jur ? <>
            <label className="gc-sf" style={{ gridColumn: 'auto' }}>
              <span>2. ชื่อนิติบุคคล</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อบริษัท / หน่วยงาน" />
            </label>
            <label className="gc-sf">
              <span>3. เลขประจำตัวผู้เสียภาษี</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="13 หลัก" className="mono" />
            </label>
            </> : <>
            <label className="gc-sf">
              <span>2. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>3. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขที่บัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            </>}
            {showUnit && (
              <label className="gc-sf gc-sf-wide">
                <span>5. หน่วย</span>
                <input value={c.unit} onChange={(e) => set('unit', e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="หน่วยงาน / รหัสสังกัด" />
              </label>
            )}
            <div className="gc-sf-actions" style={inline ? { gridColumn: 'auto', alignSelf: 'end' } : (showUnit ? null : { gridColumn: 'span 4' })}>
              <button className="btn primary" style={{ minWidth: 76, justifyContent: 'center' }} onClick={run}>ค้นหา</button>
              <button className="btn" style={{ minWidth: 76, justifyContent: 'center' }} onClick={reset}>รีเซ็ต</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{jur ? 'รายชื่อนิติบุคคล' : ext ? 'รายชื่อบุคคลภายนอก' : 'รายชื่อสมาชิก'} <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span></span>
            {onAdd && <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={onAdd}><Icon name="plus" size={12} /> {addLabel}</button>}
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 110 }}>ทะเบียน</th>
                  <th>{jur ? 'ชื่อนิติบุคคล' : 'ชื่อ-นามสกุล'}</th>
                  <th style={{ width: 190 }}>{jur ? 'เลขประจำตัวผู้เสียภาษี' : 'เลขที่บัตรประชาชน'}</th>
                  {showUnit && <th>หน่วย</th>}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={showUnit ? 5 : 4} className="empty-state">{jur ? 'ไม่พบนิติบุคคลที่ตรงกับเงื่อนไข' : 'ไม่พบสมาชิกที่ตรงกับเงื่อนไข'}</td></tr>
                ) : results.map((m) => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{jur ? (m.orgName || m.name) : msFullName(m)}</span>
                      </div>
                    </td>
                    <td className="mono">{jur ? (m.taxId || '—') : m.citizenId}</td>
                    {showUnit && <td>{msUnit(m)}</td>}
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
                        <Icon name="chevRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── Trigger field — ปุ่มเรียก popup (ใช้เป็น value ในกริดฟอร์ม) ─────
//  จัดการเปิด/ปิด popup ภายในเอง แล้วเรียก onPick(member) เมื่อเลือก
// ระบบรวม: ช่องค้นหาสมาชิกแบบพิมพ์เลขได้ (ErpMemberPicker) · variant/onAdd → ใช้แบบ popup ของต้นทาง
function MemberSearchField(props) {
  if (props.variant || props.onAdd || !window.ErpMemberPicker) return <MemberSearchFieldLegacy {...props} />;
  const { member, onPick, placeholder, title, source, searchFn, showName = false, disabled, style, className } = props;
  return (
    <ErpMemberPicker member={member} onPick={onPick} source={source} searchFn={searchFn} title={title}
                     placeholder={placeholder && !/^คลิก/.test(placeholder) ? placeholder : 'เลขสมาชิก…'}
                     showName={showName} disabled={disabled} style={style} className={className} />
  );
}
function MemberSearchFieldLegacy({
  member,                                   // สมาชิกที่เลือกอยู่ (null = ยังไม่เลือก)
  onPick,                                   // (member) => void
  placeholder = 'คลิกเพื่อค้นหาเลขสมาชิก…',
  changeLabel = 'เปลี่ยน',
  title,                                    // หัวข้อ popup
  source,
  searchFn,
  showUnit = false,
  showName = true,                          // แสดงชื่อสมาชิกใน trigger เมื่อเลือกแล้ว
  variant, onAdd, addLabel,
}) {
  const [open, setOpen] = useState(false);
  const pick = (m) => { onPick && onPick(m); setOpen(false); };

  return (
    <>
      <button type="button" className="gc-member-trigger lb-trigger" onClick={() => setOpen(true)}>
        {member ? (
          <>
            <span className="gc-mt-code mono">{member.code}</span>
            {showName && msFullName(member) && <span className="gc-mt-name">{msFullName(member)}</span>}
            <span className="lb-change"><Icon name="search" size={13} /> {changeLabel}</span>
          </>
        ) : (
          <>
            <Icon name="search" size={14} />
            <span className="muted">{placeholder}</span>
            <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
          </>
        )}
      </button>
      {open && (
        <MemberSearchModal onPick={pick} onClose={() => setOpen(false)}
                           title={title} source={source} searchFn={searchFn} showUnit={showUnit}
                           variant={variant} addLabel={addLabel} onAdd={onAdd ? () => { setOpen(false); onAdd(); } : undefined} />
      )}
    </>
  );
}

// ─── Empty state — "ยังไม่ได้เลือกสมาชิก" + ปุ่มค้นหา (รูปแบบกลาง) ────
//  สถานะว่างมาตรฐานก่อนเลือกสมาชิก ใช้ซ้ำได้ทุกเมนู ทุกระบบ
//    <MemberSearchEmptyState
//        icon="member" title="ยังไม่ได้เลือกสมาชิก"
//        description="ค้นหาและเลือกสมาชิก…"
//        buttonLabel="ค้นหาเลขสมาชิก"
//        examples={[...members]}   // ปุ่มรหัสตัวอย่างสำหรับสาธิต (ไม่ใส่ก็ได้)
//        onPick={(m) => ...}       // เรียกเมื่อเลือกสมาชิก (จาก popup หรือปุ่มตัวอย่าง)
//        source={...} searchFn={...} />
function MemberSearchEmptyState({
  icon = 'member',
  title = 'ยังไม่ได้เลือกสมาชิก',
  description = 'ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อแสดงข้อมูล',
  buttonLabel = 'ค้นหาเลขสมาชิก',
  examples,                       // array สมาชิก (ต้องมี .code) — ปุ่มตัวอย่าง
  onPick,                         // (member) => void
  source, searchFn, showUnit = false,
  modalTitle = 'ค้นหาสมาชิก',
  className = '',
  style,
}) {
  const [open, setOpen] = useState(false);
  const pick = (m) => { onPick && onPick(m); setOpen(false); };
  return (
    <div className={"search-card gc-placeholder" + (className ? ' ' + className : '')} style={style}>
      <div className="gc-ph-ico"><Icon name={icon} size={26} /></div>
      <div className="gc-ph-title">{title}</div>
      {description && <div className="gc-ph-sub">{description}</div>}
      <button className="btn primary" onClick={() => setOpen(true)}>
        <Icon name="search" /> {buttonLabel}
      </button>
      {examples && examples.length > 0 && (
        <div className="gc-ph-hint muted">
          ตัวอย่างสำหรับสาธิต — เลือกได้จาก{' '}
          {examples.map((m, i) => (
            <React.Fragment key={m.code}>
              {i > 0 && ', '}
              <button className="ct-example mono" onClick={() => pick(m)}>{m.code}</button>
            </React.Fragment>
          ))}
        </div>
      )}
      {open && (
        <MemberSearchModal onPick={pick} onClose={() => setOpen(false)}
                           title={modalTitle} source={source} searchFn={searchFn} showUnit={showUnit} />
      )}
    </div>
  );
}

Object.assign(window, {
  MemberSearchModal, MemberSearchField, MemberSearchEmptyState,
  msInitial, msFullName, msUnit, msSearchMembers,
});
