// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — นำเข้ารายการฝาก (batch import)
//  โหลดไฟล์ (หักเงินเดือน/ตัวแทน) → ตรวจจับคู่บัญชี → บันทึกฝากเป็นชุด
// ════════════════════════════════════════════════════════════════════

function DepImportPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [file, setFile] = useState(null);
  const [posted, setPosted] = useState(false);

  const loadSample = () => {
    const s = window.DEP_IMPORT_SAMPLE;
    // re-validate match against live accounts
    const rows = s.rows.map(r => ({ ...r, match: accounts.some(a => a.accNo === r.accNo) ? 'matched' : 'unmatched' }));
    setFile({ ...s, rows }); setPosted(false);
  };

  const matched = file ? file.rows.filter(r => r.match === 'matched') : [];
  const unmatched = file ? file.rows.filter(r => r.match === 'unmatched') : [];
  const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0);

  const post = () => {
    let nextAcc = accounts.map(a => ({ ...a }));
    const newLedger = [];
    matched.forEach(r => {
      const idx = nextAcc.findIndex(a => a.accNo === r.accNo);
      if (idx < 0) return;
      const nb = nextAcc[idx].balance + r.amount;
      nextAcc[idx] = { ...nextAcc[idx], balance: nb };
      newLedger.unshift({ id: window.depTxnNextId(), date: window.DEP_OPS_TODAY, accNo: r.accNo, member: r.member,
        type: 'deposit', channel: 'นำเข้า ' + file.channel, amount: r.amount, fee: 0, balance: nb, ref: file.fileName, by: window.DEP_OPS_USER });
    });
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    const nextL = [...newLedger, ...ledger]; setLedger(nextL); window.depTxnSaveLedger(nextL);
    audit.log({ action: 'create', module: 'เงินฝาก — นำเข้ารายการฝาก', target: file.fileName,
      summary: `นำเข้ารายการฝาก ${matched.length} รายการ รวม ${fmt.money(sum(matched), 2)} บาท (งวด ${file.period})`,
      changes: [{ field: 'จำนวนรายการ', before: '—', after: String(matched.length) }] });
    setPosted(true);
    onToast && onToast(`นำเข้ารายการฝาก ${matched.length} รายการเรียบร้อย${unmatched.length ? ` · ข้าม ${unmatched.length} รายการที่ไม่พบบัญชี` : ''}`);
  };

  return (
    <div data-screen-label="หน้านำเข้ารายการฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>นำเข้ารายการฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>นำเข้ารายการฝากเป็นชุดจากไฟล์หักเงินเดือนหรือไฟล์จากตัวแทน — ระบบจับคู่บัญชีและบันทึกฝากให้อัตโนมัติ</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={loadSample}><Icon name="upload" /> เลือกไฟล์นำเข้า</button>
      </div>

      {!file ? (
        <div className="dep-import-drop" onClick={loadSample}>
          <Icon name="upload" size={30} />
          <div style={{ fontWeight: 600, marginTop: 8 }}>เลือกไฟล์รายการฝาก (.csv / .txt / .xlsx)</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>รองรับไฟล์หักเงินเดือน, ไฟล์รับจากตัวแทน และ Bill Payment — คลิกเพื่อโหลดไฟล์ตัวอย่าง</div>
        </div>
      ) : (
        <>
          <div className="search-card" style={{ padding: '12px 14px', marginTop: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="dep-file-chip-lg"><Icon name="attach" size={14} /> {file.fileName}</span>
            <span className="muted" style={{ fontSize: 12 }}>ช่องทาง: <b>{file.channel}</b> · งวด {file.period}</span>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={() => { setFile(null); setPosted(false); }}><Icon name="close" size={12} /> ล้างไฟล์</button>
          </div>

          <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="รายการในไฟล์" value={file.rows.length + ' รายการ'} sub={'฿ ' + fmt.money(sum(file.rows), 2)} accent />
            <IvStat label="จับคู่บัญชีได้" value={matched.length + ' รายการ'} sub={'฿ ' + fmt.money(sum(matched), 2)} tone="success" />
            <IvStat label="ไม่พบบัญชี" value={unmatched.length + ' รายการ'} tone={unmatched.length ? 'danger' : undefined} />
            <IvStat label="สถานะ" value={posted ? 'นำเข้าแล้ว' : 'รอนำเข้า'} tone={posted ? 'success' : 'warning'} />
          </div>

          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="tbl" style={{ minWidth: 720 }}>
                <thead><tr>
                  <th className="center" style={{ width: 48 }}>บรรทัด</th><th className="mono">รหัสสมาชิก</th><th>ชื่อ</th>
                  <th className="mono">เลขที่บัญชี</th><th className="right">จำนวนเงิน</th><th className="center">ผลจับคู่</th>
                </tr></thead>
                <tbody>
                  {file.rows.map(r => (
                    <tr key={r.line} className={r.match === 'unmatched' ? 'iv-void-row' : ''}>
                      <td className="center mono">{r.line}</td>
                      <td className="mono">{r.member}</td>
                      <td>{r.name}</td>
                      <td className="mono">{r.accNo}</td>
                      <td className="right mono">{fmt.money(r.amount, 2)}</td>
                      <td className="center">{r.match === 'matched' ? <span className="pill ok">พบบัญชี</span> : <span className="pill bad">ไม่พบบัญชี</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td colSpan="4" className="right">รวมรายการที่จับคู่ได้</td><td className="right mono"><b>{fmt.money(sum(matched), 2)}</b></td><td /></tr></tfoot>
              </table>
            </div>
          </div>

          {unmatched.length > 0 && !posted && (
            <div className="dat-warn" style={{ marginTop: 12 }}>
              <Icon name="info" size={14} />
              <span>มี {unmatched.length} รายการที่<b>ไม่พบบัญชีเงินฝาก</b> — ระบบจะข้ามรายการเหล่านี้ ตรวจสอบรหัส/เลขบัญชีในไฟล์ก่อนนำเข้า</span>
            </div>
          )}

          <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' }}>
            <button className="btn primary" disabled={posted || matched.length === 0} onClick={post}>
              <Icon name="check" /> {posted ? 'นำเข้าแล้ว' : `บันทึกนำเข้า ${matched.length} รายการ`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepImportPage });
