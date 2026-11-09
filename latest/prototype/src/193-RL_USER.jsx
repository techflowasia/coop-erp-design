// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: ขอส่งคืนคำขอกู้
//  ทำรายการส่งคืนใบคำขอเงินกู้ของสมาชิก + บันทึกประวัติการยกเลิก
//  + พิมพ์ใบส่งคืนคำขอกู้
// ════════════════════════════════════════════════════════════════════

const RL_USER = 'จันทร์เพ็ญ มาลี';
const rlNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

// ─── popup เลือกใบคำขอกู้ของสมาชิก ──────────────────────────────────
function LrAppSearchModal({ member, onPick, onClose }) {
  const apps = window.lmMemberApplications(member.code);
  const statusPill = (s) =>
    s === 'อนุมัติแล้ว' ? <span className="pill ok">{s}</span>
    : s === 'รออนุมัติ' ? <span className="pill warn">{s}</span>
    : <span className="pill info">{s}</span>;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 720 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เลือกใบคำขอกู้</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member.code} · {member.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 340 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่ใบคำขอ</th><th>ประเภทเงินกู้</th>
                  <th className="num">จำนวนเงิน</th><th className="center">วันที่ยื่น</th>
                  <th className="center">สถานะ</th><th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.reqNo} className="clickable" onClick={() => onPick(a)}>
                    <td className="mono">{a.reqNo}</td>
                    <td>{a.loanType}</td>
                    <td className="num">{fmt.money(a.amount, 2)}</td>
                    <td className="center mono">{fmt.date(a.reqDate)}</td>
                    <td className="center">{statusPill(a.status)}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(a); }}><Icon name="chevRight" /></button>
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

function ReturnLoanReqPage({ onToast }) {
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [docNo]          = useState(() => window.nextReturnDocNo());
  const [loanType, setLoanType] = useState(window.RETURN_LOAN_TYPES[0]);
  const [member, setMember]     = useState(null);
  const [app, setApp]           = useState(null);     // ใบคำขอที่เลือก
  const [note, setNote]         = useState('');
  const [memModal, setMemModal] = useState(false);
  const [appModal, setAppModal] = useState(false);
  const [voidModal, setVoidModal] = useState(false);

  // สถานะ + ประวัติ
  const [status, setStatus] = useState('รอป้อนข้อมูล');
  const [voidBy, setVoidBy] = useState('');
  const [voidAt, setVoidAt] = useState('');
  const voided = status === 'ยกเลิกแล้ว';
  const saved  = status === 'บันทึกแล้ว' || voided;

  const pickMember = (m) => { setMember(m); setApp(null); setMemModal(false); };
  const pickApp = (a) => {
    setApp(a); setAppModal(false);
    const t = window.RETURN_LOAN_TYPES.find(x => x.replace(/\*$/, '') === a.loanType);
    if (t) setLoanType(t);
  };

  const statusPill = () =>
    voided ? <span className="pill bad">ยกเลิกแล้ว (Void)</span>
    : saved ? <span className="pill ok">บันทึกแล้ว</span>
    : <span className="pill neutral">รอป้อนข้อมูล</span>;

  const save = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนบันทึก'); return; }
    if (!app)    { onToast && onToast('กรุณาเลือกเลขที่ใบคำขอกู้ที่ต้องการส่งคืน'); return; }
    if (!note.trim()) { onToast && onToast('กรุณากรอกหมายเหตุ/เหตุผลในการส่งคืนใบคำขอกู้'); return; }
    setStatus('บันทึกแล้ว');
    onToast && onToast(`บันทึกเอกสารส่งคืนคำขอกู้ ${docNo} · ${app.reqNo} เรียบร้อยแล้ว`);
  };
  const confirmVoid = () => {
    setStatus('ยกเลิกแล้ว'); setVoidBy(RL_USER); setVoidAt(rlNow()); setVoidModal(false);
    onToast && onToast(`ยกเลิก (Void) เอกสารส่งคืนคำขอกู้ ${docNo} เรียบร้อยแล้ว`);
  };
  const printSlip = () => onToast && onToast(`กำลังพิมพ์ใบส่งคืนคำขอกู้ ${docNo}…`);

  const lock = voided;

  return (
    <div data-screen-label="หน้าขอส่งคืนคำขอกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ขอส่งคืนคำขอกู้
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทำรายการส่งคืนใบคำขอเงินกู้ของสมาชิก พร้อมบันทึกประวัติการยกเลิกและพิมพ์ใบส่งคืน
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันที่ทำรายการ</span>
          <span className="ct-workdate-value mono">{fmt.date(workDate)}</span>
        </div>
      </div>

      {/* ── ส่วนที่ 1: ข้อมูลเอกสารและประเภทเงินกู้ ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสารและประเภทเงินกู้</h3>
          <span className="head-actions">
            <span className="lm-docno">
              <span className="lm-docno-k">เลขที่เอกสาร</span>
              <span className="lm-docno-v mono">{docNo}</span>
            </span>
          </span>
        </div>

        <div className="lr-grid">
          <div className="lm-field">
            <label className="lm-label">ประเภทเงินกู้ <span className="cfg-required">*</span></label>
            <select className="cfg-input" value={loanType} disabled={lock}
                    onChange={(e) => setLoanType(e.target.value)}>
              {window.RETURN_LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="lm-field">
            <label className="lm-label">สถานะ</label>
            <div className="lr-status-box">{statusPill()}</div>
          </div>

          <div className="lm-field">
            <label className="lm-label">เลขสมาชิก <span className="cfg-required">*</span></label>
            <LmMemberTrigger member={member} onOpen={() => !lock && setMemModal(true)} />
          </div>
          <div className="lm-field">
            <label className="lm-label">ชื่อ-สกุล</label>
            <input className="cfg-input lm-readonly" value={member ? member.name : ''} readOnly
                   placeholder="(แสดงอัตโนมัติ)" />
          </div>

          <div className="lm-field">
            <label className="lm-label">สังกัด</label>
            <input className="cfg-input lm-readonly" value={member ? member.dept : ''} readOnly
                   placeholder="(แสดงอัตโนมัติ)" />
          </div>
          <div className="lm-field">
            <label className="lm-label">เลขที่ใบคำขอ <span className="cfg-required">*</span></label>
            <button type="button" className="gc-member-trigger lb-trigger"
                    disabled={!member || lock}
                    onClick={() => member && !lock && setAppModal(true)}>
              {app ? (
                <>
                  <Icon name="receipt" size={14} />
                  <span className="gc-mt-code mono">{app.reqNo}</span>
                  <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
                </>
              ) : (
                <>
                  <Icon name="search" size={14} />
                  <span className="muted">{member ? 'คลิกเพื่อเลือกใบคำขอของสมาชิก…' : 'เลือกสมาชิกก่อน'}</span>
                  <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 2: ประวัติการทำงานและการยกเลิก ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ประวัติการทำงานและการยกเลิก</h3>
          <span className="head-actions">
            <button className="btn danger sm" disabled={!saved || voided}
                    onClick={() => setVoidModal(true)}>
              <Icon name="close" size={13} /> ยกเลิกเอกสาร (Void)
            </button>
          </span>
        </div>
        <div className="lr-log-grid">
          <div className="lr-log">
            <span className="lr-log-k">วันที่ทำรายการ</span>
            <span className="lr-log-v mono">{fmt.date(workDate)}</span>
          </div>
          <div className="lr-log">
            <span className="lr-log-k">ผู้ทำรายการ</span>
            <span className="lr-log-v">{RL_USER}</span>
          </div>
          <div className="lr-log">
            <span className="lr-log-k">ผู้ยกเลิก</span>
            <span className={"lr-log-v" + (voidBy ? '' : ' muted')}>{voidBy || '—'}</span>
          </div>
          <div className="lr-log">
            <span className="lr-log-k">วันที่ยกเลิก</span>
            <span className={"lr-log-v mono" + (voidAt ? '' : ' muted')}>{voidAt || '—'}</span>
          </div>
        </div>
      </div>

      {/* ── ส่วนที่ 3: บันทึกเพิ่มเติม ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>บันทึกเพิ่มเติม</h3>
        </div>
        <div className="lm-field">
          <label className="lm-label">หมายเหตุ <span className="lm-hint">(เหตุผลในการส่งคืนใบคำขอกู้)</span></label>
          <textarea className="cfg-input" rows={3} value={note} disabled={lock}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ระบุเหตุผลในการส่งคืนใบคำขอกู้ หรือรายละเอียดเพิ่มเติมเพื่อการตรวจสอบย้อนหลัง…" />
        </div>
        <div className="lr-actions">
          <span className="muted" style={{ marginRight: 'auto', fontSize: 11 }}>
            <Icon name="info" size={12} /> เอกสารที่ยกเลิกแล้วจะถูกล็อกไม่ให้แก้ไข
          </span>
          <button className="btn" onClick={printSlip}><Icon name="print" /> พิมพ์ใบส่งคืนคำขอกู้</button>
          <button className="btn primary" onClick={save} disabled={lock}>
            <Icon name="check" /> บันทึกข้อมูล
          </button>
        </div>
      </div>

      {memModal && <LmMemberSearchModal showDept onPick={pickMember} onClose={() => setMemModal(false)}
                                        title="ค้นหาสมาชิก — ขอส่งคืนคำขอกู้" />}
      {appModal && member && <LrAppSearchModal member={member} onPick={pickApp} onClose={() => setAppModal(false)} />}
      {voidModal && (
        <>
          <div className="modal-backdrop" onClick={() => setVoidModal(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
            <div className="modal-head">
              <div className="modal-warnico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}>
                <Icon name="close" />
              </div>
              <h2>ยืนยันการยกเลิกเอกสาร</h2>
              <button className="close-btn" onClick={() => setVoidModal(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 14px', lineHeight: 1.55 }}>
                ยืนยันการยกเลิก (Void) เอกสารส่งคืนคำขอกู้ <b className="mono">{docNo}</b> หรือไม่?
                ระบบจะบันทึกผู้ยกเลิกและวันเวลาที่ยกเลิก และล็อกเอกสารฉบับนี้ไม่ให้แก้ไข
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setVoidModal(false)}>ปิดหน้าต่าง</button>
                <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={confirmVoid}><Icon name="check" /> ยืนยันยกเลิก</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { ReturnLoanReqPage });
