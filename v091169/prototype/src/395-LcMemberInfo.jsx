// ═════════════════════════════════════════════════════════════════
//  บันทึกหลักทรัพย์ — ค้นหาสมาชิกด้วย "ช่องค้นหาสมาชิก" ตาม Design System
//  (โหลดทับ LoanCollateralPage เดิมจากไฟล์ 183)
//  • แถวปุ่มอยู่มุมบนขวา (ไม่มีแถบ action ด้านล่าง)
//      view mode : badge บันทึกล่าสุด › ประวัติ › แก้ไขข้อมูล
//      edit mode : ยกเลิก › บันทึกข้อมูล (ถามยืนยันก่อนบันทึก)
// ═════════════════════════════════════════════════════════════════

function LcMemberInfo({ member, count }) {
  if (!member) return null;
  const unit = member.deptCode ? member.deptCode + ' · ' + (member.dept || '') : (member.dept || member.unit || '—');
  const rows = [
    ['ชื่อ-นามสกุล', member.name || '—'],
    ['หน่วย/สังกัด', unit],
    ['เลขที่บัตรประชาชน', member.citizenId || '—'],
    ['สถานะสมาชิก', member.status || member.memberStatus || '—'],
    ['หลักทรัพย์ในทะเบียน', count + ' รายการ'],
  ];
  return (
    <div className="cs-member-info">
      {rows.map(([k, v]) => (
        <div key={k}>
          <span className="muted">{k}</span>
          <b className={k === 'เลขที่บัตรประชาชน' ? 'mono' : ''}>{v}</b>
        </div>
      ))}
    </div>
  );
}

// ── Popup ประวัติ — ไทม์ไลน์ (layout เดียวกับหน้ารายละเอียดประเภทเงินกู้) ──
function LcHistoryModal({ member, entries, onClose }) {
  const hist = (entries || []).slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  const actionMeta = (a) => a === 'create'
    ? { label: 'เพิ่มหลักทรัพย์', color: 'var(--success)', icon: 'plus' }
    : a === 'delete' ? { label: 'ลบหลักทรัพย์', color: 'var(--danger)', icon: 'trash' }
    : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการเพิ่ม/แก้ไขหลักทรัพย์</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member.code} · {member.name} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hist.map((h, i) => {
              const m = actionMeta(h.action);
              const ts = String(h.ts).replace('T', ' ');
              return (
                <div key={h.id || i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={m.icon} size={14} />
                    </div>
                    {i < hist.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.date(ts.slice(0, 10))} · {ts.slice(11, 16)} น.</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}{h.role ? ' · ' + h.role : ''}</div>
                    {h.changes && h.changes.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.changes.map((c, ci) => (
                          <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span className="muted" style={{ minWidth: 110 }}>{c.field}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                            <Icon name="chevRight" size={11} />
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ── Popup ยืนยันก่อนบันทึก ──
function LcSaveConfirmModal({ member, count, onConfirm, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="warning" /></div>
          <div style={{ minWidth: 0 }}><h2>ยืนยันการบันทึกข้อมูล</h2></div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.8 }}>
          คุณต้องการบันทึกทะเบียนหลักทรัพย์ของ <b>{member.code} · {member.name}</b> จำนวน <b>{count} รายการ</b> ใช่หรือไม่?
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>การดำเนินการนี้จะถูกบันทึกใน Audit Trail</div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={onConfirm}><Icon name="check" /> บันทึกข้อมูล</button>
        </div>
      </div>
    </>
  );
}

function LoanCollateralPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [member, setMember] = useState(null);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [histOpen, setHistOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const baseCount = React.useRef(0);
  const baseValue = React.useRef(0);
  const snapshot = React.useRef([]);
  const lcValue = (r) => Number(String(r.summaryPrice || r.coopPrice || r.govPrice ||
    (r.building && r.building.totalValue) || 0).replace(/,/g, '')) || 0;
  const totalValue = items.reduce((s, r) => s + lcValue(r), 0);

  window.useBreadcrumb([{ label: 'บันทึกหลักทรัพย์', current: true }], []);

  const MODULES = ['สินเชื่อ — บันทึกหลักทรัพย์'];
  const entries = (audit && audit.entries) || window.AUDIT_SEED || [];
  const memberHist = React.useMemo(() => entries.filter(e =>
    MODULES.indexOf(e.module) >= 0 && (!member || String(e.target || '').indexOf(member.code) >= 0)
  ), [entries, member]);
  const lastTs = window.savedBadgeTs ? window.savedBadgeTs(memberHist, MODULES, 'lcCollateral') : '';
  const savedBadge = window.savedBadgeLabel ? window.savedBadgeLabel(lastTs) : null;

  const pickMember = (m) => {
    if (!m) { setMember(null); setItems([]); setActiveId(null); setEditing(false); return; }
    const full = (window.MEMBERS_LIST || []).find(x => x.code === m.code) || m;
    setMember(full);
    const list = window.lcOf(full.code);
    setItems(list);
    baseCount.current = list.length;
    baseValue.current = list.reduce((s, r) => s + lcValue(r), 0);
    setActiveId(list.length ? list[0].id : null);
    setEditing(false);
    // สมาชิกที่ยังไม่มีหลักทรัพย์ → แสดง empty state (ต้องกด "เพิ่มหลักทรัพย์" ก่อนจึงขึ้นฟอร์ม)
  };
  const isEmpty = !!member && items.length === 0;

  const active = items.find(r => r.id === activeId) || null;
  const updateActive = (rec) => setItems(items.map(r => r.id === activeId ? rec : r));

  const addCollateral = () => {
    const blank = window.lcBlank('โฉนด');
    if (!editing) { snapshot.current = JSON.parse(JSON.stringify(items)); setEditing(true); }
    setItems([...items, blank]);
    setActiveId(blank.id);
  };
  const deleteCollateral = (id) => {
    const next = items.filter(r => r.id !== id);
    setItems(next);
    if (activeId === id) setActiveId(next.length ? next[0].id : null);
    onToast && onToast('ลบหลักทรัพย์ออกจากรายการแล้ว');
  };

  const startEdit = () => {
    snapshot.current = JSON.parse(JSON.stringify(items));
    setEditing(true);
  };
  const cancelEdit = () => {
    const prev = snapshot.current || [];
    setItems(prev);
    if (!prev.some(r => r.id === activeId)) setActiveId(prev.length ? prev[0].id : null);
    setEditing(false);
  };

  const confirm = () => {
    if (audit && audit.log) {
      audit.log({ action: 'update', module: 'สินเชื่อ — บันทึกหลักทรัพย์',
        target: `${member.code} · ${member.name}`,
        summary: `บันทึกทะเบียนหลักทรัพย์ ${items.length} รายการ`,
        changes: [
          { field: 'จำนวนหลักทรัพย์', before: String(baseCount.current), after: String(items.length) },
          { field: 'ราคาประเมินรวม (บาท)', before: fmt.money(baseValue.current, 2), after: fmt.money(totalValue, 2) },
        ] });
    }
    onToast && onToast(`บันทึกหลักทรัพย์ของ ${member.name} เรียบร้อยแล้ว (${items.length} รายการ)`);
    baseCount.current = items.length;
    baseValue.current = totalValue;
    setConfirmOpen(false);
    setEditing(false);
  };

  const formPane = active ? (
    <LcForm rec={active} onChange={updateActive} onUpdateItems={(u) => setItems(prev => prev.map(r => u[r.id] || r))} memberCollaterals={items} onToast={onToast} hideApprConfirm />
  ) : isEmpty ? (
    <div className="search-card cs-empty">
      <div className="gc-ph-ico"><Icon name="plus" size={26} /></div>
      <div className="gc-ph-title">สมาชิกรายนี้ยังไม่มีหลักทรัพย์ในทะเบียน</div>
      <div className="gc-ph-sub">กดปุ่ม “เพิ่มหลักทรัพย์” ด้านซ้าย เพื่อเริ่มบันทึกหลักทรัพย์ค้ำประกันเงินกู้ของ {member.code} · {member.name}</div>
    </div>
  ) : (
    <div className="search-card cs-empty">
      <div className="gc-ph-ico"><Icon name="search" size={26} /></div>
      <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
      <div className="gc-ph-sub">ค้นหาและเลือกสมาชิกจากช่อง “เลขสมาชิก” ด้านซ้าย เพื่อบันทึก/แก้ไขทะเบียนหลักทรัพย์ค้ำประกันเงินกู้</div>
    </div>
  );

  return (
    <div data-screen-label="บันทึกหลักทรัพย์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>บันทึกหลักทรัพย์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึก/แก้ไขทะเบียนหลักทรัพย์ค้ำประกันเงินกู้ของสมาชิก</div>
        </div>
        {member && (
          <div className="lc-topbtns">
            {editing ? (
              <>
                <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
                <button className="btn primary sm" onClick={() => {
                  const bad = items.find(r => window.lcBuildingRefError(r, items));
                  if (bad) { setActiveId(bad.id); onToast && onToast(window.lcBuildingRefError(bad, items)); return; }
                  setConfirmOpen(true);
                }}><Icon name="check" /> บันทึกข้อมูล</button>
              </>
            ) : isEmpty ? null : (
              <>
                {savedBadge && <span className="saved-badge">{savedBadge}</span>}
                <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ</button>
                <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูล</button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="cs-layout">
        {/* ── ซ้าย: สมาชิก + รายการหลักทรัพย์ ── */}
        <div className="cs-left">
          <div className="search-card cs-member-card">
            <LcField label="เลขสมาชิก">
              <MemberSearchField member={member} onPick={pickMember}
                source={window.MEMBERS_LIST} title="ค้นหาสมาชิก — บันทึกหลักทรัพย์"
                changeLabel="เปลี่ยน" placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
            </LcField>
            <LcMemberInfo member={member} count={items.length} />
          </div>

          {member && (
            <>
              <button className="btn primary block cs-add-btn" onClick={addCollateral}><Icon name="plus" /> เพิ่มหลักทรัพย์</button>
              {items.length > 0 && (
                <div className={editing ? '' : 'lc-list-view'}>
                  <LcList items={items} activeId={activeId} onSelect={setActiveId} />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── ขวา: ฟอร์มหลักทรัพย์ (view mode = ล็อกช่องกรอก) ── */}
        <div className="cs-right">
          {member && !editing && !isEmpty ? (
            <div className="lc-form-view">{formPane}</div>
          ) : formPane}
        </div>
      </div>

      {histOpen && member && (
        <LcHistoryModal member={member} entries={memberHist} onClose={() => setHistOpen(false)} />
      )}
      {confirmOpen && member && (
        <LcSaveConfirmModal member={member} count={items.length}
                            onConfirm={confirm} onClose={() => setConfirmOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { LoanCollateralPage, LcMemberInfo, LcHistoryModal });
