// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — ปรับ Popup ทั้งหมดให้เป็นรูปแบบกลาง
//  โครงเดียวกับ popup "ค้นหาสมาชิก" ของ Design System:
//    หัวข้อ (ไอคอนวงกลม + ชื่อ + ปิด) → แผงเงื่อนไขแบบมีลำดับ 1..n
//    + ปุ่มค้นหา/ล้าง → บรรทัดสรุปจำนวน → ตารางผล (แบ่งหน้าอัตโนมัติ)
//  ทับ (override) โมดัลเดิมของเมนูสวัสดิการหลังไฟล์ต้นฉบับโหลดแล้ว
// ════════════════════════════════════════════════════════════════════

// ─── โครงกลางของ popup สวัสดิการ ─────────────────────────────────────
//  fields: [{ key, label, ph, mono }]  ·  onRun(criteria) => rows
function WsStdSearchModal({
  title, sub, icon = 'search', fields = [], initial, filterFn,
  caption = 'รายการ', columns = [], rowKey, renderRow, onPick, onClose,
  emptyText = 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข', children,
}) {
  const blank = {};
  fields.forEach(f => { blank[f.key] = ''; });
  const [c, setC] = useState(blank);
  const [rows, setRows] = useState(() => (initial || []));
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const run = () => setRows(filterFn(c));
  const reset = () => { setC(blank); setRows(initial || []); };
  const cols = columns.length + (onPick ? 1 : 0);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={icon} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <div className="muted" style={{ fontSize: 11.5 }}>{sub}</div>}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {fields.length > 0 && (
            <div className="gc-search-grid lb-search-grid">
              {fields.map((f, i) => (
                <label className="gc-sf" key={f.key}>
                  <span>{i + 1}. {f.label}</span>
                  <input value={c[f.key]} onChange={(e) => set(f.key, e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && run()}
                         placeholder={f.ph} className={f.mono ? 'mono' : ''}
                         autoFocus={i === 0} />
                </label>
              ))}
              <div className="gc-sf-actions" style={{ gridColumn: 'span 4' }}>
                <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
                <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
              </div>
            </div>
          )}

          {children}

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            {caption} <span className="muted" style={{ fontWeight: 400 }}>· พบ {rows.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} className={col.cls || ''} style={col.w ? { width: col.w } : null}>{col.label}</th>
                  ))}
                  {onPick && <th style={{ width: 40 }} />}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={cols} className="empty-state">{emptyText}</td></tr>
                ) : rows.map((r, i) => (
                  <tr key={rowKey ? rowKey(r) : i} className={onPick ? 'clickable' : ''}
                      onClick={onPick ? () => onPick(r) : undefined}>
                    {renderRow(r)}
                    {onPick && (
                      <td className="center">
                        <button className="btn ghost sm" style={{ padding: '0 6px' }}
                                onClick={(e) => { e.stopPropagation(); onPick(r); }} title="เลือกรายการ">
                          <Icon name="chevRight" />
                        </button>
                      </td>
                    )}
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

const wsNorm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
const wsHit = (v, q) => !q || wsNorm(v).includes(wsNorm(q));

// ─── คำขอทุนสวัสดิการทุนการศึกษา — ค้นหาบัญชีรับเงิน ─────────────────
function SrAccountSearchModal({ member, kind, onPick, onClose }) {
  const accounts = window.memberAccounts(member.code, kind) || [];
  const kindLabel = kind === 'coop' ? 'เงินฝากสหกรณ์' : 'บัญชีธนาคาร';
  return (
    <WsStdSearchModal
      title={`ค้นหาบัญชีรับเงิน — ${kindLabel}`}
      sub={`สมาชิก ${member.name} · ${member.code}`}
      icon="wallet"
      fields={[
        { key: 'accNo', label: 'เลขที่บัญชี', ph: 'เช่น 0123456789', mono: true },
        { key: 'type', label: 'ประเภทบัญชี', ph: 'ประเภทบัญชี' },
        { key: 'label', label: 'รายละเอียด', ph: 'ชื่อบัญชี / สาขา' },
      ]}
      initial={accounts}
      filterFn={(c) => accounts.filter(a => wsHit(a.accNo, c.accNo) && wsHit(a.type, c.type) && wsHit(a.label, c.label))}
      caption="บัญชีรับเงิน"
      columns={[{ label: 'เลขที่บัญชี' }, { label: 'ประเภท' }, { label: 'รายละเอียด' }]}
      rowKey={(a) => a.accNo}
      renderRow={(a) => (<>
        <td className="mono">{a.accNo}</td>
        <td>{a.type}</td>
        <td>{a.label || '—'}</td>
      </>)}
      emptyText="ไม่พบบัญชีที่ตรงกับเงื่อนไข"
      onPick={(a) => onPick(a.accNo)}
      onClose={onClose}
    />
  );
}

// ─── ขอสินไหมกรณีสมาชิกเสียชีวิต — หุ้น/หนี้และภาระผูกพัน ────────────
function DxcContractsModal({ member, onClose }) {
  const contracts = window.dxcContracts(member) || [];
  const shares = Number(member.shares || 0);
  const totalPrincipal = contracts.reduce((s, c) => s + c.principal, 0);
  const totalInterest = contracts.reduce((s, c) => s + c.interest, 0);
  return (
    <WsStdSearchModal
      title="รายละเอียดหุ้น–หนี้ และภาระผูกพัน"
      sub={`${member.name} · ${member.code}`}
      icon="wallet"
      fields={[
        { key: 'no', label: 'เลขที่สัญญา', ph: 'เช่น LN-2569-0001', mono: true },
        { key: 'type', label: 'ประเภทสัญญา', ph: 'ประเภทเงินกู้' },
      ]}
      initial={contracts}
      filterFn={(c) => contracts.filter(x => wsHit(x.no, c.no) && wsHit(x.type, c.type))}
      caption="สัญญาเงินกู้คงเหลือ"
      columns={[
        { label: 'เลขที่สัญญา' }, { label: 'ประเภท' },
        { label: 'เงินต้นคงเหลือ', cls: 'num' }, { label: 'ดอกเบี้ยค้าง', cls: 'num' },
      ]}
      rowKey={(c) => c.no}
      renderRow={(c) => (<>
        <td className="mono">{c.no}</td>
        <td>{c.type}</td>
        <td className="num mono">{fmt.money(c.principal, 0)}</td>
        <td className="num mono">{fmt.money(c.interest, 0)}</td>
      </>)}
      emptyText="ไม่มีสัญญาเงินกู้คงค้าง"
      onClose={onClose}
    >
      <div className="dxc-share-strip">
        <div><span className="k">ทุนเรือนหุ้นคงเหลือ</span><span className="v mono">฿ {fmt.money(shares, 0)}</span></div>
        <div><span className="k">จำนวนสัญญาเงินกู้</span><span className="v mono">{contracts.length} สัญญา</span></div>
        <div><span className="k">หนี้คงค้างรวม</span><span className="v mono" style={{ color: 'var(--danger)' }}>฿ {fmt.money(totalPrincipal + totalInterest, 0)}</span></div>
      </div>
    </WsStdSearchModal>
  );
}

// ─── เงินสงเคราะห์สมาชิก — ประวัติการใช้สิทธิสวัสดิการ ───────────────
function RuUsageModal({ member, onClose }) {
  const rows = member ? (window.reliefUsageHistory(member.code) || []) : [];
  const typeLabel = (r) => {
    const t = window.reliefType(r.typeCode) || {};
    return `${t.code || ''} ${t.label || ''}`;
  };
  return (
    <WsStdSearchModal
      title="ประวัติการใช้สิทธิสวัสดิการ"
      sub={member ? `${member.name} · ${member.code}` : ''}
      icon="history"
      fields={[
        { key: 'id', label: 'เลขใบคำขอ', ph: 'เช่น WS-2569-0001', mono: true },
        { key: 'type', label: 'ประเภทสวัสดิการ', ph: 'รหัส / ชื่อประเภท' },
        { key: 'status', label: 'สถานะ', ph: 'สถานะคำขอ' },
      ]}
      initial={rows}
      filterFn={(c) => rows.filter(r => wsHit(r.id, c.id) && wsHit(typeLabel(r), c.type)
        && wsHit((window.reliefStatus(r.status) || {}).l, c.status))}
      caption="รายการคำขอที่ใช้สิทธิ"
      columns={[
        { label: 'เลขใบคำขอ' }, { label: 'วันยื่น' }, { label: 'ประเภท' },
        { label: 'ยอดที่ขอ', cls: 'num' }, { label: 'สถานะ', cls: 'center' },
      ]}
      rowKey={(r) => r.id}
      renderRow={(r) => {
        const t = window.reliefType(r.typeCode) || {};
        const st = window.reliefStatus(r.status);
        return (<>
          <td className="mono">{r.id}</td>
          <td className="mono">{fmt.date(r.reqDate)}</td>
          <td><span className="mono" style={{ fontSize: 11 }}>{t.code}</span> · {t.label}</td>
          <td className="num"><b>{fmt.money(r.requested, 0)}</b></td>
          <td className="center"><span className={'pill ' + st.pill}>{st.step} : {st.l}</span></td>
        </>);
      }}
      emptyText="ยังไม่เคยขอรับสวัสดิการ"
      onClose={onClose}
    />
  );
}

Object.assign(window, { WsStdSearchModal, SrAccountSearchModal, DxcContractsModal, RuUsageModal });
