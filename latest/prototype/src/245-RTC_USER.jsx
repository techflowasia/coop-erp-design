// ════════════════════════════════════════════════════════════════════
//  ประเภทเงินสงเคราะห์ — ReliefTypeConfigPage
//  ระบบงานสวัสดิการสมาชิก › ค่าคงที่
//  กำหนดค่าคงที่รายประเภทย่อย: จำนวนเงินที่ได้ · สิทธิสูงสุด · จำนวนสิทธิสูงสุด
//  ค่าเหล่านี้ถูกใช้โดยเมนู "เงินสงเคราะห์สมาชิก" เมื่อคำนวณสิทธิและตรวจสอบ
// ════════════════════════════════════════════════════════════════════

const RTC_USER = 'จันทร์เพ็ญ มาลี';

function rtcLoad() { return window.reliefTypeCfgLoad(); }

function ReliefTypeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(rtcLoad);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const setRow = (code, k, v) => {
    setDirty(true);
    setList(prev => prev.map(r => r.code === code ? { ...r, [k]: v } : r));
  };

  // จัดกลุ่มตามสวัสดิการ (welfare) — เรียงตามลำดับใน RELIEF_WELFARES
  const groups = window.RELIEF_WELFARES.map(w => ({
    ...w, rows: list.filter(r => r.welfareCode === w.code),
  })).filter(g => g.rows.length);

  const save = () => {
    window.reliefTypeCfgSave(list);
    setDirty(false);
    setSavedAt(new Date());
    audit.log({
      action: 'update', module: 'สวัสดิการ — ประเภทเงินสงเคราะห์',
      target: 'ค่าคงที่ประเภทเงินสงเคราะห์',
      summary: `บันทึกค่าคงที่ประเภทเงินสงเคราะห์ ${list.length} ประเภทย่อย`,
      changes: groups.map(g => ({
        field: g.name, before: '—', after: `${g.rows.length} ประเภทย่อย`,
      })),
    });
    onToast && onToast('บันทึกค่าคงที่ประเภทเงินสงเคราะห์เรียบร้อยแล้ว');
  };

  const modeChip = (mode) => {
    const cls = mode === 'fixed' ? 'primary' : mode === 'tier' ? 'info' : mode === 'damage' ? 'warning' : 'neutral';
    return <span className={"chip " + cls}>{window.RELIEF_TYPE_MODE_LABEL[mode] || mode}</span>;
  };

  return (
    <div data-screen-label="หน้าค่าคงที่ประเภทเงินสงเคราะห์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประเภทเงินสงเคราะห์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดค่าคงที่รายประเภทย่อย — จำนวนเงินที่ได้รับ ยอดสิทธิสูงสุด และจำนวนสิทธิสูงสุด · ใช้ร่วมกับเมนูเงินสงเคราะห์สมาชิก
          </div>
        </div>
        <span className="spacer" />
        {savedAt && !dirty && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        <button className="btn primary sm" onClick={save} disabled={!dirty}>
          <Icon name="check" /> บันทึกข้อมูล
        </button>
      </div>

      {/* คำอธิบายคอลัมน์ */}
      <div className="lt-active-banner" style={{ marginBottom: 12 }}>
        <div className="lt-ab-ico"><Icon name="shield" /></div>
        <div>
          <div className="lt-ab-label">ค่าคงที่ที่กำหนดได้ต่อประเภทย่อย</div>
          <div className="lt-ab-name" style={{ fontWeight: 400, fontSize: 12.5 }}>
            <b>ได้รับ</b> = จำนวนเงินต่อครั้ง · <b>สิทธิสูงสุด</b> = ยอดเงินสูงสุดที่ขอได้ต่อครั้ง · <b>จำนวนสิทธิสูงสุด</b> = จำนวนครั้งที่ขอได้ (0 = ไม่จำกัด)
          </div>
        </div>
      </div>

      {groups.map(g => (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }} key={g.code}>
          <div className="sh-grid-head">
            <div>
              <div className="sh-grid-title">{g.name} <span className="muted" style={{ fontWeight: 400 }}>· {g.rows.length} ประเภทย่อย</span></div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                กำหนดจำนวนเงินและจำนวนสิทธิของแต่ละประเภทย่อยในสวัสดิการนี้
              </div>
            </div>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl sh-grid" style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th style={{ width: 90 }}>รหัส</th>
                  <th style={{ width: 240 }}>ประเภทย่อย</th>
                  <th className="center" style={{ width: 150 }}>รูปแบบการคิดสิทธิ</th>
                  <th className="center" style={{ width: 140 }}>ได้รับ (บาท)</th>
                  <th className="center" style={{ width: 140 }}>สิทธิสูงสุด (บาท)</th>
                  <th className="center" style={{ width: 130 }}>จำนวนสิทธิสูงสุด</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map(r => {
                  const amtEditable = r.mode === 'fixed';
                  return (
                    <tr key={r.code}>
                      <td className="mono">{r.code}</td>
                      <td>{r.label}</td>
                      <td className="center">{modeChip(r.mode)}</td>
                      <td className="num-cell">
                        {amtEditable ? (
                          <input className="sh-grid-input" type="number" inputMode="decimal" step="100" min="0"
                                 value={r.amount} onChange={(e) => setRow(r.code, 'amount', e.target.value)} />
                        ) : (
                          <span className="sh-grid-num muted" title={r.mode === 'manual' ? 'ผู้อนุมัติกำหนดยอดเอง' : 'คำนวณตามเกณฑ์อัตโนมัติ'}>
                            {r.mode === 'manual' ? '—' : 'ตามเกณฑ์'}
                          </span>
                        )}
                      </td>
                      <td className="num-cell">
                        <input className="sh-grid-input" type="number" inputMode="decimal" step="100" min="0"
                               value={r.maxAmount} placeholder="0"
                               onChange={(e) => setRow(r.code, 'maxAmount', e.target.value)} />
                      </td>
                      <td className="num-cell">
                        <input className="sh-grid-input" type="number" inputMode="numeric" min="0"
                               value={r.maxRights} placeholder="0"
                               onChange={(e) => setRow(r.code, 'maxRights', e.target.value)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="search-card" style={{ background: 'var(--bg-subtle, var(--bg-hover))' }}>
        <div className="muted" style={{ fontSize: 11.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="info" size={13} />
          <span>
            ประเภท <b>ยอดคงที่</b> แก้ไขจำนวนเงินที่ได้รับได้โดยตรง · ประเภท <b>ตามอายุสมาชิก</b> และ <b>ตามระดับความเสียหาย</b> คำนวณจำนวนเงินอัตโนมัติ แต่จำกัดได้ด้วยยอดสิทธิสูงสุด · ประเภท <b>ผู้อนุมัติกำหนด</b> ระบุยอดตอนอนุมัติ ·
            การตั้ง <b>จำนวนสิทธิสูงสุด</b> ระบบจะตรวจไม่ให้สมาชิกขอเกินจำนวนครั้งที่กำหนดในเมนูเงินสงเคราะห์สมาชิก — อย่าลืมกด “บันทึกข้อมูล”
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReliefTypeConfigPage });
