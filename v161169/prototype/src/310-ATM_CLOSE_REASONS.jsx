// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ขอปิดการผูกบัญชีเงินฝาก KTB
//  เลือกบัญชี ATM ที่มีอยู่ → ยกเลิกการผูกบัญชีกรุงไทย/ATM
//  โครงหน้าจอเดียวกับหน้าขอเปิดบัญชี ATM
// ════════════════════════════════════════════════════════════════════

const ATM_CLOSE_REASONS = ['สมาชิกขอยกเลิกบริการ ATM', 'บัตร ATM สูญหาย/ชำรุด', 'เปลี่ยนบัญชีผูก ATM', 'ปิดบัญชีเงินฝาก', 'อื่น ๆ'];

function DepAtmClosePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);

  const [acc, setAcc] = useState(null);
  const [reason, setReason] = useState(ATM_CLOSE_REASONS[0]);
  const [note, setNote] = useState('');
  const [slip, setSlip] = useState(null);

  const member = useMemo(
    () => acc ? (window.DEP_TXN_MEMBERS || []).find(m => m.code === acc.member) || null : null,
    [acc]);

  useEffect(() => { setReason(ATM_CLOSE_REASONS[0]); setNote(''); setSlip(null); }, [acc && acc.accNo]);

  const balance = acc?.balance || 0;
  const withdrawable = balance;
  const bookBalance = balance;
  const certNo = acc?.certNo || (acc ? '—' : '');
  const citizenId = member?.citizenId || '—';
  const ktbAcc = acc?.ktbAcc || (acc ? 'กท 0000000000' : '—');
  const phone = member?.phone || (acc ? '—' : '');

  const canSubmit = !!acc;

  const reset = () => { setAcc(null); setReason(ATM_CLOSE_REASONS[0]); setNote(''); setSlip(null); };

  const validate = () => {
    if (!acc) { onToast && onToast('กรุณาเลือกบัญชี ATM ที่ต้องการปิดก่อน'); return; }
    onToast && onToast('ตรวจสอบข้อมูลครบถ้วน — พร้อมบันทึกคำขอปิดบัญชี ATM');
  };

  const submit = () => {
    if (!canSubmit) { validate(); return; }
    const reqId = 'ATC' + String(Date.now()).slice(-6);
    audit.log({
      action: 'delete', module: 'เงินฝาก — ขอปิดบัญชี ATM',
      target: `${acc.accNo} · ${acc.name}`,
      summary: `ขอปิดบัญชี ATM (ยกเลิกการผูกบัญชีกรุงไทย ${ktbAcc}) เหตุผล: ${reason}`,
      changes: [
        { field: 'สถานะ ATM', before: 'เปิดใช้งาน', after: 'ยกเลิกการผูก ATM' },
        { field: 'บัญชีกรุงไทย', before: ktbAcc, after: '—' },
      ],
    });
    setSlip({
      title: 'คำขอปิดการผูกบัญชีเงินฝาก KTB',
      sub: `เลขที่คำขอ ${reqId} · วันที่ ${fmt.date(new Date().toISOString().slice(0, 10))}`,
      rows: [
        { k: 'เลขที่บัญชี', v: acc.accNo, mono: true },
        { k: 'ชื่อบัญชี', v: acc.name },
        { k: 'ประเภทเงินฝาก', v: acc.type },
        { k: 'บัญชีกรุงไทย (ATM)', v: ktbAcc, mono: true },
        { k: 'สมาชิก', v: `${acc.member} · ${member?.name || acc.name}` },
        { k: 'เบอร์โทร', v: phone, mono: true },
        { k: 'เหตุผลการปิด', v: reason },
        { k: 'ยอดคงเหลือ', v: fmt.money(balance, 2) + ' บาท', mono: true },
        { k: 'สถานะ', v: 'ส่งคำขอปิดใช้ ATM แล้ว', strong: true },
      ],
      foot: 'คำขอนี้จะส่งให้ธนาคารกรุงไทยยกเลิกการผูกบัญชีเพื่อปิดบริการ ATM',
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกคำขอปิดการผูกบัญชีเงินฝาก KTB “' + acc.accNo + '” เรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label="หน้าขอปิดการผูกบัญชีเงินฝาก KTB" className="dep-open">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอปิดการผูกบัญชีเงินฝาก KTB</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกบัญชี ATM ที่มีอยู่ เพื่อยกเลิกการผูกบัญชีกรุงไทยและปิดบริการ ATM</div>
        </div>
        <span className="spacer" />
        <div className="dep-open-toolbar">
          <button className="btn sm" data-keep-top="" style={{ justifyContent: 'center' }} onClick={reset}>ล้างหน้าจอ</button>
          {slip && <button className="btn sm" data-keep-top="" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์เอกสาร</button>}
          <button className="btn danger sm" data-keep-top="" style={canSubmit
              ? { background: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)', color: '#fff' }
              : { background: '#ffa39e', borderColor: '#ffa39e', color: '#fff', opacity: 1, cursor: 'not-allowed' }} disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกคำขอปิด ATM</button>
        </div>
      </div>

      {/* 1 · ข้อมูลบัญชีเงินฝาก */}
      <div className="search-card dat-section">
        <DepSecHead icon="wallet" title="ข้อมูลบัญชีเงินฝาก" sub="ค้นหาและเลือกบัญชี ATM ที่ต้องการปิดใช้งาน" />
        <div className="dat-grid g2">
          <DatFieldLite label="เลขที่บัญชี" required>
            <DepAccountSearchField accounts={accounts} value={acc}
                              onPick={setAcc} placeholder="คลิกเพื่อค้นหาเลขที่บัญชี / รหัสสมาชิก / ชื่อบัญชี…" />
          </DatFieldLite>
          <DatFieldLite label="PB / Cert.">
            <div className="cfg-display-box mono">{certNo || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ชื่อบัญชี">
            <div className="cfg-display-box">{acc ? acc.name : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ประเภทเงินฝาก">
            <div className="cfg-display-box">{acc ? acc.type : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="เลขบัตร / Tax ID">
            <div className="cfg-display-box mono">{acc ? citizenId : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="บัญชีกรุงไทย (ผูก ATM)">
            <div className="cfg-display-box mono">{acc ? ktbAcc : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="เหตุผลการปิดบัญชี ATM">
            <select className="cfg-input" value={reason} disabled={!acc} onChange={(e) => setReason(e.target.value)}>
              {ATM_CLOSE_REASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="หมายเหตุ">
            <input className="cfg-input" value={note} disabled={!acc}
                   onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุประกอบคำขอ (ถ้ามี)" />
          </DatFieldLite>
        </div>
      </div>

      {/* 2 · ข้อมูลสมาชิก */}
      <div className="search-card dat-section">
        <DepSecHead icon="members" title="ข้อมูลสมาชิก" sub="ข้อมูลเจ้าของบัญชีและยอดเงิน (ดึงจากบัญชีที่เลือก)" />
        <div className="dat-grid g2">
          <DatFieldLite label="ทะเบียนสมาชิก">
            <div className="cfg-display-box mono">{acc ? acc.member : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ชื่อ - นามสกุล">
            <div className="cfg-display-box">{member?.name || acc?.name || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="สังกัด">
            <div className="cfg-display-box">{member?.dept || acc?.dept || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="เบอร์โทร">
            <div className="cfg-display-box mono">{acc ? phone : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ยอดคงเหลือ">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(balance, 2) : '.00'}</div>
          </DatFieldLite>
          <DatFieldLite label="ยอดถอนได้">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(withdrawable, 2) : '.00'}</div>
          </DatFieldLite>
          <DatFieldLite label="ยอดในสมุด">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(bookBalance, 2) : '—'}</div>
          </DatFieldLite>
        </div>
      </div>


      {slip && (
        <div className="dep-slip-host">
          <DepSlip {...slip} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DepAtmClosePage });
