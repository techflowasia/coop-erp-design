// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: คอมโพเนนต์ร่วม
//  LmMemberSearchModal — popup ค้นหาสมาชิก ใช้ร่วมหลายหน้าจอ
//  คอลัมน์: รหัสสมาชิก · ชื่อ · นามสกุล · เลขที่บัตรประชาชน [· สังกัด]
// ════════════════════════════════════════════════════════════════════

function LmMemberSearchModal({ onPick, onClose, showDept, title }) {
  const [q, setQ] = useState('');
  const results = window.lmSearchMembers(q);
  const cols = showDept ? 6 : 5;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>{title || 'ค้นหาสมาชิก'}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="toolbar" style={{ marginBottom: 12 }}>
            <div className="search" style={{ flex: 1 }}>
              <Icon name="search" size={14} />
              <input value={q} autoFocus onChange={(e) => setQ(e.target.value)}
                     placeholder="ค้นหารหัสสมาชิก, ชื่อ-สกุล, เลขบัตรประชาชน, สังกัด…" />
            </div>
          </div>
          <div className="gc-sub-title" style={{ marginTop: 0 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ</th>
                  <th>นามสกุล</th>
                  <th>เลขที่บัตรประชาชน</th>
                  {showDept && <th>สังกัด</th>}
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={cols} className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map(m => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                        <span>{m.title}{m.firstName}</span>
                      </div>
                    </td>
                    <td>{m.lastName}</td>
                    <td className="mono">{m.citizenId}</td>
                    {showDept && <td>{m.dept}</td>}
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

// ปุ่มเรียก popup เลือกสมาชิก (ใช้ในฟิลด์ “เลขสมาชิก”)
function LmMemberTrigger({ member, onOpen, placeholder }) {
  return (
    <button className="gc-member-trigger" onClick={onOpen}>
      {member ? (
        <>
          <span className="row-avatar">{member.firstName.slice(0, 1)}</span>
          <span className="gc-mt-code mono">{member.code}</span>
          <span className="gc-mt-name">{member.name}</span>
          <span className="lm-change"><Icon name="search" size={13} /> เปลี่ยน</span>
        </>
      ) : (
        <>
          <Icon name="search" size={14} />
          <span className="muted">{placeholder || 'คลิกเพื่อค้นหาเลขสมาชิก…'}</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-faint)' }}>…</span>
        </>
      )}
    </button>
  );
}

Object.assign(window, { LmMemberSearchModal, LmMemberTrigger });
