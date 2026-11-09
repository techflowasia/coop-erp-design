// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — เปลี่ยนแปลงฝากรายเดือน
//  ปรับยอดฝากประจำเดือน (หักผ่านเงินเดือน) ของบัญชีเงินฝาก + งวดที่เรียกเก็บถึง
//  โครงสร้าง: ① ข้อมูลคำร้อง ② รายละเอียดการเปลี่ยนแปลง ③ ประวัติการเปลี่ยนแปลง
// ════════════════════════════════════════════════════════════════════

const DMC_COLLECT_ALL = '9999999';

// จัดรูปงวดเรียกเก็บ YYYYMM → "เดือน ปี" (พ.ศ.)  ·  9999999/999999 = หักตลอด
function dmcFmtPeriod(v) {
  const s = String(v || '').trim();
  if (!s || /^9{6,7}$/.test(s)) return 'หักตลอด';
  if (/^\d{6}$/.test(s)) {
    const be = s.slice(0, 4), mm = parseInt(s.slice(4, 6), 10);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    if (mm >= 1 && mm <= 12) return `${months[mm - 1]} ${be}`;
  }
  return s;
}

function DepMonthlyChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [history, setHistory] = useState(window.depMonthlyLoadHistory);
  const [acc, setAcc] = useState(null);

  const today = window.DEP_OPS_TODAY;
  const [changeDate, setChangeDate] = useState(today);
  const [effDate, setEffDate] = useState(today);
  const [newAmount, setNewAmount] = useState('');
  const [collectUntil, setCollectUntil] = useState('');
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const oldAmount = cur ? (cur.monthlyDeposit || 0) : 0;
  const newNum = Number(newAmount) || 0;
  const diff = newNum - oldAmount;
  const accHistory = cur ? history.filter(h => h.accNo === cur.accNo) : [];

  const selectAccount = (a) => {
    setAcc(a); setError(''); setSavedNo('');
    setChangeDate(today); setEffDate(today);
    if (a) {
      setNewAmount(String(a.monthlyDeposit || 0));
      setCollectUntil(a.collectUntil || DMC_COLLECT_ALL);
      setNote('');
    } else { setNewAmount(''); setCollectUntil(''); setNote(''); }
  };

  const validate = () => {
    if (!cur) return 'กรุณาเลือกบัญชีเงินฝากก่อนบันทึก';
    if (newAmount === '' || isNaN(Number(newAmount))) return 'กรุณาระบุยอดขอฝากเดือนละให้ถูกต้อง';
    if (newNum < 0) return 'ยอดขอฝากเดือนละต้องไม่ติดลบ';
    const cu = String(collectUntil).trim();
    if (!/^\d{6}$/.test(cu) && !/^9{6,7}$/.test(cu)) return 'งวดเรียกเก็บถึงต้องอยู่ในรูปแบบ YYYYMM (เช่น 256912) หรือ 9999999 (หักตลอด)';
    if (newNum === oldAmount && cu === String(cur.collectUntil || DMC_COLLECT_ALL)) return 'ยังไม่มีการเปลี่ยนแปลง — โปรดปรับยอดฝากเดือนละหรือ งวดเรียกเก็บถึง';
    return '';
  };

  const submit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const cu = String(collectUntil).trim();
    const reqNo = window.depMonthlyNextReqNo();

    const nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, monthlyDeposit: newNum, collectUntil: cu } : a);
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);

    const rec = { id: reqNo, accNo: cur.accNo, member: cur.member, date: effDate,
      oldAmount, newAmount: newNum, collectUntil: cu, by: window.DEP_OPS_USER, note: note.trim() };
    const nextHist = [rec, ...history];
    setHistory(nextHist); window.depMonthlySaveHistory(nextHist);

    audit.log && audit.log({
      action: 'update', module: 'เงินฝาก — เปลี่ยนแปลงฝากรายเดือน',
      target: `${cur.member} · ${cur.name} · ${cur.accNo}`,
      summary: `คำร้อง ${reqNo} · ปรับฝากรายเดือน ${fmt.money(oldAmount, 2)} → ${fmt.money(newNum, 2)} บาท · เรียกเก็บถึง ${dmcFmtPeriod(cu)}`,
      changes: [
        { field: 'ฝากรายเดือน', before: fmt.money(oldAmount, 2), after: fmt.money(newNum, 2) },
        { field: 'เรียกเก็บถึงงวด', before: dmcFmtPeriod(cur.collectUntil), after: dmcFmtPeriod(cu) },
      ],
    });
    setSavedNo(reqNo);
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกคำร้องเปลี่ยนแปลงฝากรายเดือน “' + reqNo + '” เรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label="หน้าเปลี่ยนแปลงฝากรายเดือน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปลี่ยนแปลงฝากรายเดือน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปรับยอดเงินฝากประจำเดือน (หักผ่านเงินเดือน) และกำหนดงวดที่เรียกเก็บถึงของบัญชีเงินฝาก</div>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ margin: '12px 0' }}><Icon name="info" size={14} /> {error}</div>)}
      {savedNo && !error && (<div className="dn-status-alert" style={{ margin: '12px 0' }}><Icon name="check" size={15} /><span>บันทึกคำร้อง <b className="mono">{savedNo}</b> แล้ว — ยอดฝากรายเดือนใหม่จะถูกใช้ในการเรียกเก็บรอบถัดไป</span></div>)}

          <div style={{ marginTop: error || savedNo ? 0 : 12 }}>
              {cur ? (
                <DepAccountCard acc={cur} extra={
                  <div className="dep-acc-f"><span className="k">ฝากรายเดือนปัจจุบัน</span><span className="v mono" style={{ fontWeight: 700 }}>{fmt.money(oldAmount, 2)}</span></div>
                } />
              ) : (
                <div className="dep-acc-card dep-acc-card-empty">
                  <div className="dep-acc-card-top">
                    <div className="dep-acc-ico"><Icon name="wallet" size={18} /></div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="dep-acc-no muted">ยังไม่ได้เลือกบัญชี</div>
                      <div className="dep-acc-sub muted">ค้นหาและเลือกบัญชีเงินฝากด้านบนเพื่อเริ่มทำรายการ</div>
                    </div>
                  </div>
                </div>
              )}
          </div>
          <div className="dep-form-cols" style={{ marginTop: 12 }}>
            <div className="dep-form-main">
              {/* ① ข้อมูลคำร้อง */}
              <div className="search-card dat-section" style={{ marginTop: 0 }}>
                <DepSecHead icon="report" title="ข้อมูลคำร้อง" sub="ค้นหาบัญชี เลขที่คำร้อง วันที่ขอเปลี่ยน และวันที่มีผล" />
                <div style={{ padding: '16px 16px 0' }}>
                  <label className="dat-label" style={{ display: 'block', marginBottom: 6 }}>ค้นหาบัญชีเงินฝาก</label>
                  <DepAccountSearchField accounts={accounts} value={cur} onPick={selectAccount}
                                         placeholder="คลิกเพื่อค้นหาเลขที่บัญชี / เลขสมาชิก / ชื่อบัญชี…" />
                </div>
                <div className="dat-grid g3" style={{ padding: 16 }}>
                  <DatFieldLite label="เลขที่คำร้อง">
                    {savedNo ? <div className="cfg-display-box mono strong">{savedNo}</div> : <div className="cfg-display-box muted">Auto</div>}
                  </DatFieldLite>
                  <DatFieldLite label="วันที่ขอเปลี่ยน">
                    <window.ThaiDateField value={changeDate} onChange={setChangeDate} />
                  </DatFieldLite>
                  <DatFieldLite label="วันที่มีผล">
                    <window.ThaiDateField value={effDate} onChange={setEffDate} min={changeDate || undefined} />
                  </DatFieldLite>
                  <DatFieldLite label="ทะเบียนสมาชิก">
                    {cur ? <div className="cfg-display-box mono">{cur.member} · {cur.name}</div> : <div className="cfg-display-box muted">—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="สังกัด" span={2}>
                    {cur ? <div className="cfg-display-box">{cur.dept}</div> : <div className="cfg-display-box muted">—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="สาขา/เลขที่บัญชี" span={2}>
                    {cur ? <div className="cfg-display-box mono">{cur.accNo} <span className="muted">· {cur.type}</span></div> : <div className="cfg-display-box muted">—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="ยอดคงเหลือ">
                    {cur ? <div className="cfg-display-box mono" style={{ color: 'var(--success)', fontWeight: 700, textAlign: 'right' }}>{fmt.money(cur.balance, 2)}</div> : <div className="cfg-display-box muted" style={{ textAlign: 'right' }}>—</div>}
                  </DatFieldLite>
                </div>
              </div>

              {/* ② รายละเอียดการเปลี่ยนแปลง */}
              <div className="search-card dat-section" style={{ marginTop: 0 }}>
                <DepSecHead icon="edit" title="รายละเอียดการเปลี่ยนแปลง" sub="ระบุยอดฝากเดือนละใหม่ และงวดที่เรียกเก็บถึง" />
                <div className="dat-grid g3" style={{ padding: 16 }}>
                  <DatFieldLite label="เดิมฝากเดือนละ (บาท)">
                    {cur ? <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{fmt.money(oldAmount, 2)}</div> : <div className="cfg-display-box muted" style={{ textAlign: 'right' }}>—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="ขอฝากเดือนละ (บาท)" required>
                    <input className="cfg-input mono" type="number" min="0" step="0.01" value={newAmount} disabled={!cur}
                           onChange={(e) => setNewAmount(e.target.value)} placeholder="0.00"
                           style={{ fontWeight: 700, textAlign: 'right', background: cur ? 'var(--warning-bg, #fffbe6)' : undefined }} />
                  </DatFieldLite>
                  <DatFieldLite label="เรียกเก็บถึงงวด" required>
                    <input className="cfg-input mono" value={collectUntil} disabled={!cur} onChange={(e) => setCollectUntil(e.target.value.replace(/[^\d]/g, ''))}
                           placeholder="9999999" style={{ textAlign: 'right' }} />
                  </DatFieldLite>
                </div>
                <div className="dmc-hint">
                  <Icon name="info" size={12} /> การใส่งวดเรียกเก็บอยู่ในรูปแบบ ปีและเดือน YYYYMM เช่น 256912 (หากต้องการหักตลอดใส่ 9999999) — งวดปัจจุบัน: <b>{cur ? dmcFmtPeriod(collectUntil) : '—'}</b>
                </div>
                <div style={{ padding: '0 16px 16px' }}>
                  <label className="dat-label" style={{ display: 'block', marginBottom: 6 }}>หมายเหตุ</label>
                  <textarea className="cfg-input" rows={3} value={note} disabled={!cur} onChange={(e) => setNote(e.target.value)} maxLength={500}
                            placeholder="บันทึกเหตุผล/รายละเอียดการเปลี่ยนแปลง เช่น สมาชิกขอเพิ่มยอดฝาก ปรับตามฐานเงินเดือน" />
                </div>
              </div>

              {/* ③ ประวัติการเปลี่ยนแปลง */}
              <div className="search-card dat-section" style={{ marginTop: 0 }}>
                <DepSecHead bar icon="history" title="ประวัติการเปลี่ยนแปลงฝากรายเดือน" sub="การเปลี่ยนแปลงยอดฝากรายเดือนของบัญชีนี้"
                  meta={cur ? accHistory.length + ' รายการ' : null} />
                <div className="table-wrap" style={{ margin: '16px' }}><div className="table-scroll">
                  <table className="tbl">
                    <thead><tr>
                      <th>เลขที่คำขอ</th><th className="center">วันที่เปลี่ยนแปลง</th>
                      <th className="num">ยอดฝากเก่า</th><th className="num">ยอดฝากใหม่</th>
                      <th className="center">ฝากถึงงวด</th><th>ผู้ทำรายการ</th><th>หมายเหตุ</th>
                    </tr></thead>
                    <tbody>
                      {accHistory.length === 0 ? (
                        <tr><td colSpan="7" className="center muted" style={{ padding: 18 }}>{cur ? 'ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับบัญชีนี้' : 'เลือกบัญชีเพื่อแสดงประวัติการเปลี่ยนแปลง'}</td></tr>
                      ) : accHistory.map(h => (
                        <tr key={h.id}>
                          <td className="mono">{h.id}</td>
                          <td className="center mono">{fmt.date(h.date)}</td>
                          <td className="num mono">{fmt.money(h.oldAmount, 2)}</td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(h.newAmount, 2)}</td>
                          <td className="center mono">{dmcFmtPeriod(h.collectUntil)}</td>
                          <td>{h.by}</td>
                          <td className="muted">{h.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div></div>
              </div>
            </div>

            {/* ── ขวา: สรุป + ปุ่ม ── */}
            <div className="dep-form-side">
              <div className="dep-summary-card">
                <div className="dep-sum-row"><span>เดิมฝากเดือนละ</span><span className="mono">{fmt.money(oldAmount, 2)}</span></div>
                <div className="dep-sum-row"><span>ขอฝากเดือนละ</span><span className="mono" style={{ fontWeight: 700 }}>{fmt.money(newNum, 2)}</span></div>
                <div className="dep-sum-row"><span>ส่วนต่าง</span><span className="mono" style={{ color: diff > 0 ? 'var(--success)' : (diff < 0 ? 'var(--danger)' : undefined) }}>{diff > 0 ? '+ ' : diff < 0 ? '− ' : ''}{fmt.money(Math.abs(diff), 2)}</span></div>
                <div className="dep-sum-row total"><span>เรียกเก็บถึงงวด</span><span className="mono">{cur ? dmcFmtPeriod(collectUntil) : '—'}</span></div>
              </div>
              <div className="dep-submit-bar">
                <button className="btn block primary lg" disabled={!cur} onClick={submit}><Icon name="check" /> บันทึกการเปลี่ยนแปลง</button>
              </div>
              <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
                <Icon name="info" size={11} /> ยอดฝากรายเดือนใหม่จะถูกนำไปใช้ในการเรียกเก็บผ่านเงินเดือนรอบถัดไป และบันทึกลงประวัติพร้อม Audit Trail
              </p>
            </div>
          </div>
    </div>
  );
}

Object.assign(window, { DepMonthlyChangePage, dmcFmtPeriod });
