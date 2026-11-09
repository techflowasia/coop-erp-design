// ════════════════════════════════════════════════════════════════════
//  Design System — การค้นหาสัญญา (Contract Search) · รูปแบบกลาง
//  ────────────────────────────────────────────────────────────────────
//  รูปแบบมาตรฐานสำหรับ "ค้นหา/เลือกสัญญาเงินกู้" ใช้ซ้ำได้ทุกเมนู ทุกระบบ
//  ค้นหาได้ 2 ทาง:
//    • ระบุ "เลขที่สัญญา"  → ตรงไปยังสัญญานั้น
//    • ระบุ "เลขทะเบียน/ชื่อสมาชิก" → แสดง "สัญญาเงินกู้ทั้งหมดของสมาชิก"
//      (จัดกลุ่มใต้หัวสมาชิก) ให้เลือกสัญญาที่ต้องการทำงาน
//
//  ประกอบด้วย 3 ส่วน:
//    • <ContractSearchModal>  — popup ค้นหา (สัญญา · ทะเบียน · ชื่อ · นามสกุล · หน่วย)
//                               ผลลัพธ์เป็นรายการ "สัญญา" จัดกลุ่มตามสมาชิก
//    • <ContractSearchField>  — ปุ่ม trigger ที่วางเป็น "value" ในฟอร์ม
//    • csContractRows(source, criteria) — ตัวค้นหากลาง (คืน [{member, debt}])
//
//  การใช้งานแบบสั้นที่สุด:
//    <ContractSearchField contract={contract} member={member}
//        onPick={({ member, debt }) => loadContract(member, debt)} />
//
//  • source   : array สมาชิก (record มี .code + .debts[] เป็นอย่างน้อย)
//               ดีฟอลต์ = window.DN_MEMBERS
//  • debtsOf  : (member) => debts[]  — วิธีดึงรายการสัญญาของสมาชิก
//               (ดีฟอลต์ = member.debts) — ใช้ปรับให้รวมสัญญา R ฯลฯ
//  • onPick   : ({ member, debt }) => void — คืนทั้งสมาชิกและสัญญาที่เลือก
// ════════════════════════════════════════════════════════════════════

const csNorm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
const csFullName = (m) =>
  (m && (m.name || [m.title || '', m.firstName || '', m.lastName || ''].join(' ').replace(/\s+/g, ' ').trim())) || '';
const csInitial = (m) =>
  String((m && (m.firstName || m.name)) || '?').replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1);
const csUnit = (m) => (m && (m.unit || m.dept || m.department)) || '';
const csDebtsOf = (m) => (m && m.debts) || [];

// ยอดคงเหลือรวมต่อสัญญา (เงินต้น + ดอกเบี้ยค้าง + ค่าปรับ) — เผื่อ field ต่างชื่อ
const csOutstanding = (d) =>
  (Number(d.principalRemaining ?? d.outstanding ?? d.balance) || 0) +
  (Number(d.interestDue || 0)) + (Number(d.penalty || 0));

// ─── ตัวค้นหากลาง — คืนรายการสัญญาเป็น [{member, debt}] ───────────────
//  criteria: { contractNo, code, firstName, lastName, unit }
//  กรองสมาชิกด้วย รหัส/ชื่อ/นามสกุล/หน่วย แล้ว "แตกเป็นรายสัญญา"
//  จากนั้นกรองด้วยเลขที่สัญญา (ถ้าระบุ)
const csContractRows = (source, criteria, debtsOf) => {
  const all = source || [];
  const c = criteria || {};
  const get = debtsOf || csDebtsOf;
  const cNo = csNorm(c.contractNo), code = csNorm(c.code), fn = csNorm(c.firstName),
        ln = csNorm(c.lastName), un = csNorm(c.unit);
  const rows = [];
  all.forEach((m) => {
    const name = csNorm(csFullName(m));
    const memberOk =
      (!code || csNorm(m.code).includes(code)) &&
      (!fn || csNorm(m.firstName || m.name).includes(fn) || name.includes(fn)) &&
      (!ln || csNorm(m.lastName || m.name).includes(ln) || name.includes(ln)) &&
      (!un || csNorm(csUnit(m)).includes(un));
    if (!memberOk) return;
    (get(m) || []).forEach((d) => {
      if (cNo && !csNorm(d.contractNo).includes(cNo)) return;
      rows.push({ member: m, debt: d });
    });
  });
  return rows;
};

// ─── Popup ค้นหาสัญญา ────────────────────────────────────────────────
function ContractSearchModal({
  onPick,
  onClose,
  title = 'ค้นหาสัญญาเงินกู้',
  source,               // array สมาชิก (ดีฟอลต์ window.DN_MEMBERS)
  debtsOf,              // (member) => debts[]  (ดีฟอลต์ member.debts)
  statusMap,            // map สถานะสมาชิก → { pill } (ดีฟอลต์ DN_MEMBER_STATUS)
  showUnit = true,
}) {
  const all = source || window.DN_MEMBERS || [];
  const smap = statusMap || window.DN_MEMBER_STATUS || {};
  const [c, setC] = useState({ contractNo: '', code: '', firstName: '', lastName: '', unit: '' });
  const [rows, setRows] = useState(() => csContractRows(all, {}, debtsOf));
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => { setRows(csContractRows(all, c, debtsOf)); setDirty(true); };
  const reset = () => { setC({ contractNo: '', code: '', firstName: '', lastName: '', unit: '' }); setRows(csContractRows(all, {}, debtsOf)); setDirty(false); };

  // จัดกลุ่มรายการสัญญาตามสมาชิก (เพื่อแสดง "สัญญาของสมาชิก")
  const groups = [];
  const idx = {};
  rows.forEach((r) => {
    let g = idx[r.member.code];
    if (!g) { g = idx[r.member.code] = { member: r.member, debts: [] }; groups.push(g); }
    g.debts.push(r.debt);
  });

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 980 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>{title}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. เลขที่สัญญา</span>
              <input value={c.contractNo} onChange={(e) => set('contractNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น L-2022-0455" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. เลขทะเบียนสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-067012" className="mono" />
            </label>
            <label className="gc-sf">
              <span>3. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>4. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            {showUnit && (
              <label className="gc-sf gc-sf-wide">
                <span>5. หน่วย</span>
                <input value={c.unit} onChange={(e) => set('unit', e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="หน่วยงาน / รหัสสังกัด" />
              </label>
            )}
            <div className="gc-sf-actions" style={showUnit ? null : { gridColumn: 'span 4' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการสัญญาเงินกู้{' '}
            <span className="muted" style={{ fontWeight: 400 }}>
              · พบ {rows.length} สัญญา{groups.length > 1 ? ` จาก ${groups.length} สมาชิก` : ''}
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th>เลขที่สัญญา</th>
                  <th>ประเภทเงินกู้</th>
                  <th>สมาชิก</th>
                  {showUnit && <th>หน่วยงาน</th>}
                  <th className="num">ยอดคงเหลือ</th>
                  <th className="center">งวดคงค้าง</th>
                  <th className="center">สถานะสัญญา</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={showUnit ? 8 : 7} className="empty-state">
                    {dirty ? 'ไม่พบสัญญาที่ตรงกับเงื่อนไข' : 'ระบุเลขที่สัญญา หรือเลขทะเบียนสมาชิก แล้วกดค้นหา'}
                  </td></tr>
                ) : groups.map((g) => {
                  const ms = smap[g.member.status] || { pill: 'neutral' };
                  return (
                    <React.Fragment key={g.member.code}>
                      <tr className="cs-group">
                        <td colSpan={showUnit ? 8 : 7}>
                          <div className="cs-group-row">
                            <span className="row-avatar">{csInitial(g.member)}</span>
                            <span className="cs-group-code mono">{g.member.code}</span>
                            <span className="cs-group-name">{csFullName(g.member)}</span>
                            {showUnit && csUnit(g.member) && <span className="cs-group-unit muted">· {csUnit(g.member)}</span>}
                            {g.member.status && <span className={'pill ' + ms.pill} style={{ marginLeft: 6 }}>{g.member.status}</span>}
                            <span className="cs-group-count muted">{g.debts.length} สัญญา</span>
                          </div>
                        </td>
                      </tr>
                      {g.debts.map((d) => {
                        const over = Number(d.overdueInstallments || 0);
                        return (
                          <tr key={g.member.code + '/' + d.contractNo} className="clickable cs-crow"
                              onClick={() => onPick && onPick({ member: g.member, debt: d })}>
                            <td className="mono"><span className="cs-indent" />{d.contractNo}</td>
                            <td>{d.type || '—'}</td>
                            <td className="mono muted">{g.member.code}</td>
                            {showUnit && <td>{csUnit(g.member)}</td>}
                            <td className="num mono">{fmt.money(csOutstanding(d), 0)}</td>
                            <td className="center mono">{over > 0 ? <span className="cs-over">{over}</span> : '—'}</td>
                            <td className="center">{d.status ? <span className="chip">{d.status}</span> : '—'}</td>
                            <td className="center">
                              <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                      onClick={(e) => { e.stopPropagation(); onPick && onPick({ member: g.member, debt: d }); }} title="เลือกสัญญา">
                                <Icon name="chevRight" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── Trigger field — ปุ่มเรียก popup (ใช้เป็น value ในกริดฟอร์ม) ─────
function ContractSearchField({
  contract, member, onPick, placeholder, title,
  source, debtsOf, statusMap, showUnit = true, disabled, style, className,
}) {
  return (
    <ErpContractPicker contract={contract} member={member} onPick={onPick}
                       source={source} debtsOf={debtsOf} statusMap={statusMap} showUnit={showUnit}
                       title={title} disabled={disabled} style={style} className={className}
                       placeholder={placeholder && !/^คลิก/.test(placeholder) ? placeholder : 'เลขที่สัญญา / เลขสมาชิก…'} />
  );
}

Object.assign(window, {
  ContractSearchModal, ContractSearchField, csContractRows,
});
