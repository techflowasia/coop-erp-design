// ════════════════════════════════════════════════════════════════════
//  อัปเดตหมายเลข EMS ด้วยเครื่องสแกนบาร์โค้ด — ใช้ร่วม
//  แจ้งให้ชำระหนี้ (DebtNoticePage) + ขอให้ชำระหนี้ (DebtOrgRequestPage)
//
//  EmsScanStation — สถานีสแกนต่อเนื่อง
//    ① สแกนบาร์โค้ด "เลขที่เอกสาร" เพื่อค้นหาหนังสือ
//    ② สแกน "เลข EMS" ของเอกสารนั้น → ระบบบันทึกอัตโนมัติ
//    ③ วนกลับไปข้อ ① เรื่อย ๆ ตราบใดที่สแกนตามลำดับถูกต้อง
//    · ค้นหาเอกสารไม่พบ → ป๊อบอัพแจ้งเตือนที่หน้าจอ
//
//  EmsQuickModal — ปุ่มไมครอนต่อท้ายหนังสือ (อัปเดตเลข EMS รายฉบับภายหลัง)
// ════════════════════════════════════════════════════════════════════

const emsNorm = (s) => String(s ?? '').toLowerCase().replace(/[\s\-.]/g, '');

// ค้นหาเอกสารจากรหัสที่สแกน — เทียบ id / เลขที่หนังสือ (seizeNo หรือ docNo)
function emsFindDoc(records, code, docNoOf) {
  const n = emsNorm(code);
  if (!n) return null;
  return (records || []).find(r =>
    emsNorm(r.id) === n || emsNorm(docNoOf(r)) === n) ||
    (records || []).find(r => n.length >= 5 &&
      (emsNorm(r.id).includes(n) || emsNorm(docNoOf(r)).includes(n))) || null;
}

// ─── สถานีสแกน EMS แบบต่อเนื่อง ─────────────────────────────────────
function EmsScanStation({ records, docNoOf, docLabel, onSaveEms, onClose }) {
  const [step, setStep] = useState('doc');      // 'doc' | 'ems'
  const [doc, setDoc] = useState(null);
  const [scan, setScan] = useState('');
  const [log, setLog] = useState([]);           // {id, docNo, member, ems, at}
  const [alertMsg, setAlertMsg] = useState('');
  const inputRef = React.useRef(null);

  const focusInput = () => { if (inputRef.current) inputRef.current.focus(); };
  useEffect(() => { if (!alertMsg) focusInput(); }, [step, alertMsg]);

  const nowT = () => new Date().toTimeString().slice(0, 8);

  const process = () => {
    const val = scan.trim();
    if (!val) return;
    if (step === 'doc') {
      const rec = emsFindDoc(records, val, docNoOf);
      if (!rec) {
        setAlertMsg(`ไม่พบเอกสารที่ตรงกับรหัส “${val}” ในทะเบียน — กรุณาตรวจสอบแล้วสแกนใหม่อีกครั้ง`);
        setScan('');
        return;
      }
      setDoc(rec);
      setStep('ems');
      setScan('');
    } else {
      const ems = val;
      onSaveEms(doc, ems);
      setLog(l => [{ id: doc.id, docNo: docNoOf(doc), member: doc.memberName, ems, at: nowT() }, ...l]);
      setDoc(null);
      setStep('doc');
      setScan('');
    }
  };

  const cancelDoc = () => { setDoc(null); setStep('doc'); setScan(''); };
  const dismissAlert = () => { setAlertMsg(''); setScan(''); setTimeout(focusInput, 30); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal ems-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="barcode" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>อัปเดตหมายเลข EMS ด้วยเครื่องสแกน</h2>
            <div className="muted" style={{ fontSize: 11 }}>สแกนเลขที่เอกสาร → สแกนเลข EMS → ระบบบันทึกอัตโนมัติ (ทำต่อเนื่องได้)</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          {/* ขั้นตอน */}
          <div className="ems-steps">
            <div className={'ems-step' + (step === 'doc' ? ' on' : ' done')}>
              <span className="ems-step-no">{step === 'doc' ? '1' : <Icon name="check" size={12} />}</span>
              <span>สแกนเลขที่เอกสาร</span>
            </div>
            <span className="ems-step-arr"><Icon name="chevRight" size={13} /></span>
            <div className={'ems-step' + (step === 'ems' ? ' on' : '')}>
              <span className="ems-step-no">2</span>
              <span>สแกนเลข EMS</span>
            </div>
          </div>

          {/* เอกสารที่จับคู่ได้ (ขั้นตอนที่ 2) */}
          {step === 'ems' && doc && (
            <div className="ems-matched">
              <div className="ems-matched-ico"><Icon name="guarantee" size={16} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="ems-matched-top">
                  <span className="mono">{doc.id}</span>
                  <span className="dot" />
                  <span className="muted mono" style={{ fontSize: 11 }}>{docLabel} {docNoOf(doc)}</span>
                </div>
                <div style={{ fontSize: 12.5 }}>{doc.memberName} <span className="muted mono">({doc.memberCode})</span></div>
                {doc.emsNo ? (
                  <div className="ems-matched-cur"><Icon name="info" size={11} /> เลข EMS เดิม: <span className="mono">{doc.emsNo}</span> — สแกนใหม่เพื่อทับ</div>
                ) : (
                  <div className="ems-matched-cur"><Icon name="info" size={11} /> ยังไม่มีเลข EMS — สแกนเพื่อบันทึก</div>
                )}
              </div>
              <button className="btn ghost sm" onClick={cancelDoc}><Icon name="close" size={12} /> เปลี่ยนเอกสาร</button>
            </div>
          )}

          {/* ช่องสแกน */}
          <div className={'ems-scan-box' + (step === 'ems' ? ' step2' : '')}>
            <Icon name="barcode" size={20} />
            <input
              ref={inputRef}
              value={scan}
              autoFocus
              onChange={(e) => setScan(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); process(); } }}
              placeholder={step === 'doc' ? 'สแกนบาร์โค้ดเลขที่เอกสาร แล้วกด Enter…' : 'สแกนเลข EMS ของเอกสารนี้ แล้วกด Enter…'}
              className="mono"
            />
            <button className="btn primary sm" onClick={process} disabled={!scan.trim()}>
              {step === 'doc' ? <><Icon name="search" size={13} /> ค้นหา</> : <><Icon name="check" size={13} /> บันทึก</>}
            </button>
          </div>
          <div className="ems-hint muted">
            <Icon name="info" size={11} /> เครื่องสแกนจะกรอกค่าและกด Enter ให้อัตโนมัติ — สแกนสลับ เลขที่เอกสาร แล้ว เลข EMS ไปเรื่อย ๆ ตามลำดับ
          </div>

          {/* บันทึกการสแกนในรอบนี้ */}
          <div className="gc-sub-title" style={{ marginTop: 14 }}>
            รายการที่บันทึกในรอบนี้ <span className="muted" style={{ fontWeight: 400 }}>· {log.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 220 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>เวลา</th>
                  <th>เลขที่เอกสาร / ทะเบียน</th>
                  <th>สมาชิก</th>
                  <th>เลข EMS ที่บันทึก</th>
                </tr>
              </thead>
              <tbody>
                {log.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">ยังไม่มีรายการ — เริ่มสแกนเลขที่เอกสาร</td></tr>
                ) : log.map((e, i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 11 }}>{e.at}</td>
                    <td><div className="mono">{e.id}</div><div className="muted mono" style={{ fontSize: 10 }}>{e.docNo}</div></td>
                    <td style={{ fontSize: 12 }}>{e.member}</td>
                    <td><span className="chip success mono"><Icon name="check" size={11} /> {e.ems}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>เสร็จสิ้น{log.length > 0 ? ` · บันทึกแล้ว ${log.length} รายการ` : ''}</button>
        </div>

        {/* ── ป๊อบอัพแจ้งเตือน: ค้นหาเอกสารไม่พบ ── */}
        {alertMsg && (
          <div className="ems-alert-wrap">
            <div className="ems-alert-card">
              <div className="ems-alert-ico"><Icon name="info" size={22} /></div>
              <h3>ไม่พบเอกสาร</h3>
              <p>{alertMsg}</p>
              <button className="btn primary block" onClick={dismissAlert}><Icon name="refresh" size={13} /> สแกนใหม่อีกครั้ง</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── ปุ่มไมครอน: อัปเดตเลข EMS รายฉบับ (ภายหลังออกหนังสือ) ──────────
function EmsQuickModal({ rec, docNoOf, docLabel, onSaveEms, onClose }) {
  const [ems, setEms] = useState(rec.emsNo || '');
  const inputRef = React.useRef(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const save = () => {
    const v = ems.trim();
    if (!v) return;
    onSaveEms(rec, v);
    onClose();
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal ems-quick">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="barcode" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>อัปเดตเลข EMS</h2>
            <div className="muted" style={{ fontSize: 11 }}>อัปเดตหมายเลขนำส่งภายหลังจากออกหนังสือแล้ว</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ems-matched" style={{ marginTop: 0 }}>
            <div className="ems-matched-ico"><Icon name="guarantee" size={16} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="ems-matched-top">
                <span className="mono">{rec.id}</span><span className="dot" />
                <span className="muted mono" style={{ fontSize: 11 }}>{docLabel} {docNoOf(rec)}</span>
              </div>
              <div style={{ fontSize: 12.5 }}>{rec.memberName} <span className="muted mono">({rec.memberCode})</span></div>
            </div>
          </div>
          <label className="sr-label" style={{ marginTop: 14, display: 'block' }}>เลข EMS <span className="sr-hint">(สแกนหรือพิมพ์)</span></label>
          <div className="ems-scan-box" style={{ marginTop: 6 }}>
            <Icon name="barcode" size={20} />
            <input ref={inputRef} value={ems} className="mono"
                   onChange={(e) => setEms(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
                   placeholder="เช่น EH123456789TH" />
          </div>
        </div>
        <div className="modal-foot" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={save} disabled={!ems.trim()}><Icon name="check" size={13} /> บันทึกเลข EMS</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { EmsScanStation, EmsQuickModal });
