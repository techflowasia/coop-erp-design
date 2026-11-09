// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ควบคุมเงินกู้ (Loan Control)
//  โครงสร้าง: ① ข้อมูลสมาชิก (ค้นหาสัญญา — ContractSearchField)
//             ② รายละเอียดสัญญา (ฟิลด์ข้อเท็จจริง + ฟิลด์ควบคุมแก้ไขได้)
//             ③ เหตุผลการเปลี่ยนแปลง  ④ ประวัติการเปลี่ยนแปลง
//  ใช้สมาชิก/สัญญาจาก DN_MEMBERS · ควบคุมจาก data-loan-control.js
// ════════════════════════════════════════════════════════════════════

const lcToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── ฟิลด์ (label เล็กด้านบน + control) ──────────────────────────────
function LcFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function LcRO({ value, mono, num, danger, success, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}
         style={success && !danger ? { color: 'var(--success)', fontWeight: 600 } : undefined}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
// ─── Modal ประวัติการแก้ไข — ไทม์ไลน์จาก Audit Trail ───────────
const LC_MODULES = ['สินเชื่อ — ควบคุมเงินกู้'];

function LcCtrlHistoryModal({ title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
  const rows = all
    .filter((e) => LC_MODULES.includes(e.module))
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการแก้ไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>
              ยังไม่มีประวัติการแก้ไข
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map((e) => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{window.fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>
                        <span className="sep">·</span>
                        <span className="mono muted">{e.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

function LoanControlPage({ onToast }) {
  const { useState } = React;
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const today = lcToday();
  const fmt = window.fmt;

  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [ctrl, setCtrl] = useState(null);      // ฟิลด์ควบคุมที่แก้ไขได้ (snapshot)
  const [orig, setOrig] = useState(null);      // ค่าตั้งต้น (เทียบ diff)
  const [reason, setReason] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [editing, setEditing] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [okMsg, setOkMsg] = useState(null);

  const contracts = member ? (member.debts || []) : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const info = contract ? window.lcControlInfo(contract) : null;
  const loaded = !!info;

  const loadContract = (m, debt) => {
    const i = window.lcControlInfo(debt);
    setMember(m);
    setContractNo(debt.contractNo);
    const editable = {
      seizureCollection: i.seizureCollection,
      seizureAmount: i.seizureAmount,
      creditStatus: i.creditStatus,
      contractStatus: i.contractStatus,
    };
    setCtrl(editable);
    setOrig({ ...editable });
    setReason('');
    setSavedNo('');
    setError('');
    setHistory(window.lcHistory(debt.contractNo));
    setEditing(false);
  };
  const pickContract = (no) => {
    const c = contracts.find(d => d.contractNo === no);
    if (c) loadContract(member, c);
  };
  const setC = (patch) => setCtrl(p => ({ ...p, ...patch }));

  const clearScreen = () => {
    setMember(null); setContractNo(''); setCtrl(null); setOrig(null);
    setReason(''); setSavedNo(''); setHistory([]); setError(''); setEditing(false);
  };

  // ── เข้า/ออกโหมดแก้ไข ──
  const startEdit = () => { if (loaded) { setError(''); setEditing(true); } };
  const cancelEdit = () => {
    if (orig) setCtrl({ ...orig });
    setReason(''); setError(''); setEditing(false);
  };

  // ── คำนวณรายการที่เปลี่ยน (diff) ──
  const changes = (() => {
    if (!ctrl || !orig) return [];
    const out = [];
    const money = (v) => fmt.money(Number(v) || 0, 2);
    if (Number(ctrl.seizureCollection) !== Number(orig.seizureCollection))
      out.push({ action: 'อายัดเรียกเก็บ', change: `${money(orig.seizureCollection)} → ${money(ctrl.seizureCollection)}` });
    if (Number(ctrl.seizureAmount) !== Number(orig.seizureAmount))
      out.push({ action: 'อายัดยอดเงิน', change: `${money(orig.seizureAmount)} → ${money(ctrl.seizureAmount)}` });
    if (ctrl.creditStatus !== orig.creditStatus)
      out.push({ action: 'สถานะวงเงิน', change: `${orig.creditStatus} → ${ctrl.creditStatus}` });
    if (ctrl.contractStatus !== orig.contractStatus)
      out.push({ action: 'สถานะสัญญา', change: `${orig.contractStatus} → ${ctrl.contractStatus}` });
    return out;
  })();
  const dirty = changes.length > 0;

  const doSave = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนบันทึกการควบคุม'); return; }
    if (!dirty) { setError('ยังไม่มีการเปลี่ยนแปลงค่าควบคุมใด ๆ'); return; }
    if (!reason.trim()) { setError('กรุณาระบุเหตุผลการเปลี่ยนแปลงก่อนบันทึก'); return; }
    setError('');
    const stamp = `${today} ${new Date().toTimeString().slice(0, 5)}`;
    const newRows = changes.map(ch => ({ date: stamp.replace(/-/g, '-'), action: ch.action, change: ch.change, reason: reason.trim(), by: window.LC_USER }));
    setHistory(h => [...newRows, ...h]);
    setOrig({ ...ctrl });
    setReason('');
    const no = `LC-${String(new Date().getFullYear() + 543).slice(-2)}-${String(140 + Math.floor(Math.random() * 40)).padStart(4, '0')}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'update', module: 'สินเชื่อ — ควบคุมเงินกู้',
      target: `${member.code} · ${member.name}`,
      summary: `ควบคุมสัญญา ${contractNo} · ${changes.length} รายการ (${no})`,
      changes: changes.map(ch => ({ field: ch.action, before: ch.change.split(' → ')[0], after: ch.change.split(' → ')[1] })),
    });
    onToast && onToast(`บันทึกการควบคุมสัญญา ${contractNo} (${no}) · ${changes.length} รายการเรียบร้อยแล้ว`);
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: `บันทึกการควบคุมสัญญา ${contractNo} · เลขที่รายการ ${no} · เปลี่ยนแปลง ${changes.length} รายการ เรียบร้อยแล้ว`,
    });
    setEditing(false);
  };

  // ── badge “บันทึกล่าสุด” — เวลาจาก Audit Trail ของเมนูนี้ ──
  const savedBadge = (() => {
    if (!loaded) return null;
    const entries = (audit && audit.entries) || window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs ? window.savedBadgeTs(entries, LC_MODULES, 'lc.' + contractNo) : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  })();

  const neg = info && info.withdrawable < 0;

  return (
    <div data-screen-label="ควบคุมเงินกู้">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ควบคุมเงินกู้</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · ควบคุมสถานะวงเงิน สถานะสัญญา และการอายัดของสัญญาเงินกู้</div>
          </div>
        </div>
        <div className="icr-form-actions">
          {editing ? (
            <>
              <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
              <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
            </>
          ) : (
            <>
              {savedBadge && <span className="saved-badge">{savedBadge}</span>}
              <button className="btn sm" onClick={() => setHistOpen(true)} disabled={!loaded}><Icon name="history" size={13} /> ประวัติ</button>
              <button className="btn primary sm" onClick={startEdit} disabled={!loaded}><Icon name="edit" size={13} /> แก้ไขข้อมูล</button>
            </>
          )}
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {savedNo && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50)', borderColor: 'var(--success-border)', color: 'var(--success)' }}>
          <Icon name="check" size={15} /><span>บันทึกการควบคุมเรียบร้อย · เลขที่รายการ {savedNo}</span>
        </div>
      )}

      {/* ── ① ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
          {loaded && <span className="chip warning" style={{ marginLeft: 'auto' }}>REQ</span>}
        </div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <LcFld label="เลขสมาชิก / เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={contractNo} member={member}
                                 onPick={({ member: m, debt }) => loadContract(m, debt)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสัญญาเงินกู้ — ควบคุมเงินกู้"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </LcFld>
          <LcFld label="ชื่อ-นามสกุล" fill><LcRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></LcFld>
          <LcFld label="สังกัด" fill><LcRO value={member ? `${member.deptCode || ''}  ${member.dept || ''}`.trim() : ''} /></LcFld>
          <LcFld label="ลาออก" fill><LcRO value={member && member.status === 'ลาออก' ? '01/2565' : (member ? '-' : '')} mono /></LcFld>
          <LcFld label="เกษียณ" fill><LcRO value={member ? '-' : ''} mono /></LcFld>
          <LcFld label="เบอร์รับ SMS" fill><LcRO value={info ? info.smsPhone : ''} mono /></LcFld>
        </div>
      </div>

      {/* ── ② รายละเอียดสัญญา ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสัญญา</h3>
          <div className="head-actions"><span className="muted" style={{ fontSize: 12 }}>ฟิลด์ที่แก้ไขได้แสดงด้วยกรอบสีเขียว</span></div>
        </div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <LcFld label="เลขที่สัญญา" fill required>
            <select className="cfg-input mono" value={contractNo} onChange={(e) => pickContract(e.target.value)} disabled={!member || contracts.length === 0}>
              {!member && <option value="">— เลือกสมาชิกก่อน —</option>}
              {member && contracts.length === 0 && <option value="">— ไม่มีสัญญา —</option>}
              {contracts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo}</option>)}
            </select>
          </LcFld>
          <LcFld label="ยอดอนุมัติ" fill><LcRO value={info ? fmt.money(info.approvedAmount, 2) : ''} mono num /></LcFld>
          <LcFld label="เลขที่บัญชี" fill><LcRO value={info ? info.accountNo : ''} mono /></LcFld>
          <LcFld label="เริ่มสัญญา" fill><LcRO value={info ? fmt.date(info.startDate) : ''} mono /></LcFld>
          <LcFld label="หนี้คงเหลือ" fill><LcRO value={info ? fmt.money(info.outstanding, 2) : ''} mono num danger={info && info.outstanding > 0} /></LcFld>

          <LcFld label="คิด ต.บ ล่าสุด" fill><LcRO value={info ? fmt.date(info.lastInterestCalc) : ''} mono /></LcFld>
          <LcFld label="ดอกเบี้ยค้าง" fill><LcRO value={info ? fmt.money(info.interestArrears, 2) : ''} mono num danger={info && info.interestArrears > 0} /></LcFld>
          <LcFld label="ชำระรายเดือน" fill><LcRO value={info ? fmt.money(info.monthlyPayment, 2) : ''} mono num /></LcFld>
          <LcFld label="ยอดถอนได้" fill><LcRO value={info ? fmt.money(info.withdrawable, 2) : ''} mono num danger={neg} success={info && info.withdrawable > 0} /></LcFld>

          {/* ฟิลด์ควบคุมแก้ไขได้ */}
          <LcFld label="อายัดเรียกเก็บ" fill>
            <input className="cfg-input mono lc-ctrl num" type="number" min="0" step="0.01" value={ctrl ? ctrl.seizureCollection : ''}
                   onChange={(e) => setC({ seizureCollection: e.target.value })} disabled={!loaded || !editing} placeholder="0.00" style={{ textAlign: 'right' }} />
          </LcFld>
          <LcFld label="อายัดยอดเงิน" fill>
            <input className="cfg-input mono lc-ctrl num" type="number" min="0" step="0.01" value={ctrl ? ctrl.seizureAmount : ''}
                   onChange={(e) => setC({ seizureAmount: e.target.value })} disabled={!loaded || !editing} placeholder="0.00" style={{ textAlign: 'right' }} />
          </LcFld>
          <LcFld label="สถานะวงเงิน" fill>
            <select className="cfg-input lc-ctrl" value={ctrl ? ctrl.creditStatus : ''} onChange={(e) => setC({ creditStatus: e.target.value })} disabled={!loaded || !editing}>
              {!loaded && <option value="">—</option>}
              {window.LC_CREDIT_STATUS.map(s => <option key={s.v} value={s.v}>{s.v}</option>)}
            </select>
          </LcFld>
          <LcFld label="สถานะสัญญา" fill>
            <select className="cfg-input lc-ctrl" value={ctrl ? ctrl.contractStatus : ''} onChange={(e) => setC({ contractStatus: e.target.value })} disabled={!loaded || !editing}>
              {!loaded && <option value="">—</option>}
              {window.LC_CONTRACT_STATUS.map(s => <option key={s.v} value={s.v}>{s.v}</option>)}
            </select>
          </LcFld>
        </div>

        {/* หลักประกัน (เต็มแถว) + สถานะปัจจุบัน (pill) */}
        <div className="lc-coll-row">
          <span className="lc-coll-l">หลักประกัน</span>
          <span className="lc-coll-v">{info ? info.collateral : '—'}</span>
          {loaded && (
            <div className="lc-status-pills">
              <span className={'pill ' + window.lcCreditPill(ctrl.creditStatus)}>วงเงิน: {ctrl.creditStatus}</span>
              <span className={'pill ' + window.lcContractPill(ctrl.contractStatus)}>สัญญา: {ctrl.contractStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ③ เหตุผลการเปลี่ยนแปลง ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>เหตุผลการเปลี่ยนแปลง</h3>
          {dirty && <span className="chip primary" style={{ marginLeft: 'auto' }}>{changes.length} รายการที่จะบันทึก</span>}
        </div>
        <div className="icr-note-wrap">
          <textarea className="cfg-input" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} disabled={!loaded || !editing} maxLength={500}
                    placeholder="ระบุเหตุผล/คำสั่งอ้างอิงของการเปลี่ยนแปลงค่าควบคุม เช่น อายัดตามคำสั่งเจ้าพนักงานบังคับคดี เลขที่…" />
          <span className="icr-note-count">{reason.length}/500</span>
        </div>
        {dirty && (
          <div className="lc-change-preview">
            {changes.map((ch, i) => (
              <div key={i} className="lc-change-chip"><b>{ch.action}</b><span className="mono">{ch.change}</span></div>
            ))}
          </div>
        )}
      </div>

      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}

      {histOpen && (
        <LcCtrlHistoryModal title={contractNo ? `สัญญา ${contractNo}${member ? ' · ' + member.name : ''}` : 'ควบคุมเงินกู้'}
                            onClose={() => setHistOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { LoanControlPage, LcCtrlHistoryModal });
