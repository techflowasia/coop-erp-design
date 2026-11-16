// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ประมวลผลตัดยอดเงินฝาก (DepCutoffProcessPage)
//  ดึงยอดเงินฝากคงเหลือรายบัญชีของหน่วยงาน/งวดที่เลือก มาปรับปรุงและ
//  โอนยอดออก (ตัดยอด) แล้วผ่านรายการ + บันทึกเข้าระบบบัญชี
// ════════════════════════════════════════════════════════════════════

const DEP_CO_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// หน่วยงานต้นสังกัด (สำหรับตัดยอดโอนเข้าบัญชีหน่วยงาน)
const DEP_CO_ORGS = [
  { code: '3', label: '3 — กสท' },
  { code: '1', label: '1 — สำนักงานใหญ่' },
  { code: '2', label: '2 — ทีโอที' },
  { code: '4', label: '4 — ไปรษณีย์ไทย' },
];

// ยอดฝากรายเดือนรายบัญชี — ดึงจากทะเบียนบัญชีจริง (ยอดตั้งที่เมนูเปลี่ยนแปลงฝากรายเดือน / ส่งงวดละตอนเปิดบัญชี)
//  เรียกเก็บเฉพาะ: บัญชีใช้งาน · ยอดฝากรายเดือน > 0 · งวดยังไม่เลย "เรียกเก็บถึงงวด" · ไม่ถูกอายัดห้ามฝาก · สมาชิกไม่ลาออก/พ้นสภาพ
//  หน่วยงานของบัญชี = orgCode ของบัญชี (ยังไม่ระบุ = 3 กสท)
function depCoPull(org, period) {
  const accs = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
  const rows = [], skip = { expired: 0, notStarted: 0, frozen: 0, gone: 0 };
  accs.forEach(a => {
    if (a.status !== 'active' || String(a.orgCode || '3') !== String(org)) return;
    const st = window.depMonthlyState ? window.depMonthlyState(a, period) : { active: Number(a.monthlyDeposit) > 0, amt: Number(a.monthlyDeposit) || 0 };
    if (!(st.amt > 0)) return;
    if (st.notStarted) { skip.notStarted++; return; }
    if (!st.active) { skip.expired++; return; }
    const frz = window.dpcFreezeOf ? window.dpcFreezeOf(a.accNo) : null;
    if (frz && window.dpcFreezeRule && window.dpcFreezeRule(frz).in) { skip.frozen++; return; }
    const live = window.depMemberLive ? window.depMemberLive(a.member) : null;
    const status = (live && live.status) || a.memberStatus || '';
    if (window.depMemberGone && window.depMemberGone(status)) { skip.gone++; return; }
    rows.push({ reg: a.member, accNo: a.accNo, name: (live && live.name) || a.name, amount: st.amt, adjust: 0 });
  });
  return { rows, skip };
}
const depCoRunsLoad = () => { try { return JSON.parse(localStorage.getItem('dep_cutoff_runs') || '{}'); } catch (e) { return {}; } };

function DepCutoffProcessPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));

  const today = window.DEP_OPS_TODAY || '2026-07-20';
  const now = new Date(today);
  const [year, setYear] = useState(now.getFullYear() + 543);
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-based (07)
  const [org, setOrg] = useState('3');
  const [txnDate, setTxnDate] = useState(today);
  const [rows, setRows] = useState(null);
  const [posted, setPosted] = useState(false);
  const [sel, setSel] = useState([]);
  const [ask, setAsk] = useState(false);

  const orgLabel = (DEP_CO_ORGS.find(o => o.code === org) || {}).label || org;
  const period = String(year) + String(month).padStart(2, '0');
  const runKey = org + '/' + period;
  const [runs, setRuns] = useState(depCoRunsLoad);
  const doneRun = runs[runKey] || null;
  const opsUser = window.depOpsUser ? window.depOpsUser() : (window.DEP_OPS_USER || '');

  const pull = () => {
    const { rows: raw, skip } = depCoPull(org, period);
    const found = raw.map((a, i) => ({
      seq: i + 1, ...a,
      transfer: a.amount + a.adjust, // ยอดโอน = จำนวนเงิน + ยอดปรับปรุง
    }));
    setRows(found); setSel(doneRun ? [] : found.map(r => r.accNo));
    setPosted(!!doneRun);
    const tot = found.reduce((s, x) => s + x.transfer, 0);
    const skipTxt = [skip.expired && `หมดงวด ${skip.expired}`, skip.notStarted && `ยังไม่ถึงงวดเริ่มหัก ${skip.notStarted}`, skip.frozen && `อายัดห้ามฝาก ${skip.frozen}`, skip.gone && `ลาออก/พ้นสภาพ ${skip.gone}`].filter(Boolean).join(' · ');
    onToast && onToast(`ดึงข้อมูลยอดฝากรายเดือน ${orgLabel} งวด ${DEP_CO_MONTHS[month - 1]} ${year} — ${found.length} ราย รวม ${fmt.money(tot, 2)} บาท` + (skipTxt ? ` (ข้าม: ${skipTxt})` : '') + (doneRun ? ' · งวดนี้ผ่านรายการแล้ว' : ''));
    audit.log({ action: 'process', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก',
      target: `${orgLabel} · ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `ดึงข้อมูลยอดตัด ${found.length} บัญชี รวม ${fmt.money(tot, 2)} บาท` });
  };

  const postTxn = () => {
    setAsk(false);
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนผ่านรายการ'); return; }
    if (doneRun) { onToast && onToast('งวดนี้ผ่านรายการไปแล้ว'); return; }
    // ฝากเข้าบัญชีตามยอดฝากรายเดือน + บันทึกรายการเคลื่อนไหว · กันผ่านรายการซ้ำงวดเดิม
    const pick = rows.filter(r => sel.includes(r.accNo));
    const amtOf = {}; pick.forEach(r => { amtOf[r.accNo] = r.transfer; });
    const accs = window.depTxnLoadAccounts();
    const nextAccs = accs.map(a => amtOf[a.accNo] ? { ...a, balance: Math.round((Number(a.balance) + amtOf[a.accNo]) * 100) / 100 } : a);
    window.depTxnSaveAccounts(nextAccs);
    const ledger = window.depTxnLoadLedger();
    const add = nextAccs.filter(a => amtOf[a.accNo]).map(a => ({ id: window.depTxnNextId(), date: txnDate, accNo: a.accNo, member: a.member, type: 'deposit',
      channel: 'ฝากรายเดือน (หักเงินเดือน) งวด ' + DEP_CO_MONTHS[month - 1] + ' ' + year, amount: amtOf[a.accNo], balance: a.balance, ref: 'MONTHLY-' + period, by: opsUser }));
    window.depTxnSaveLedger([...add, ...ledger]);
    const nr = { ...runs, [runKey]: { date: txnDate, count: pick.length, total: pick.reduce((s, r) => s + r.transfer, 0), by: opsUser, at: new Date().toISOString() } };
    setRuns(nr); try { localStorage.setItem('dep_cutoff_runs', JSON.stringify(nr)); } catch (e) {}
    setPosted(true);
    onToast && onToast(`ผ่านรายการตัดยอดเงินฝาก ${pick.length} รายการเรียบร้อย — ฝากเข้าบัญชีแล้ว`);
    audit.log({ action: 'update', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก', user: opsUser,
      target: `ผ่านรายการ ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `ผ่านรายการตัดยอด ${pick.length} บัญชี` });
  };

  const saveTxn = (force) => {
    if (!rows) { onToast && onToast('กรุณาดึงข้อมูลก่อนบันทึกรายการ'); return; }
    if (!posted && force !== true) { onToast && onToast('กรุณาผ่านรายการก่อนบันทึก'); return; }
    const sr = rows.filter(r => sel.includes(r.accNo));
    const tot = sr.reduce((s, x) => s + x.transfer, 0);
    onToast && onToast(`บันทึกรายการตัดยอดเงินฝาก ${sr.length} รายการ รวม ${fmt.money(tot, 2)} บาท เข้าระบบบัญชีเรียบร้อย`);
    audit.log({ action: 'create', module: 'เงินฝาก — ประมวลผลตัดยอดเงินฝาก', user: opsUser,
      target: `บันทึกรายการ ${DEP_CO_MONTHS[month - 1]} ${year}`,
      summary: `บันทึกตัดยอดเงินฝาก ${sr.length} บัญชี รวม ${fmt.money(tot, 2)} บาท ลงวันที่ ${fmt.date(txnDate)}` });
  };

  const totAmount = rows ? rows.reduce((s, x) => s + x.amount, 0) : 0;
  const totAdjust = rows ? rows.reduce((s, x) => s + x.adjust, 0) : 0;
  const totTransfer = rows ? rows.reduce((s, x) => s + x.transfer, 0) : 0;

  return (
    <div data-screen-label="หน้าประมวลผลตัดยอดเงินฝาก">
      <div className="page-actions dep-open-sticky" ref={(el) => { if (!el || el.__stk) return; el.__stk = true; const sc = el.closest('.main') || window; const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null; el.style.top = ((bc ? bc.offsetHeight : 0) - 16) + 'px'; }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลตัดยอดเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>พิมพ์รายงานการปรับยอด · ดึงยอดฝากรายเดือนรายบัญชีของหน่วยงานตามงวด แล้วปรับปรุง–โอนยอด (ตัดยอด) เพื่อผ่านและบันทึกลงระบบบัญชี</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={!rows || posted || sel.length === 0} onClick={() => setAsk(true)}>{posted ? 'ผ่านรายการแล้ว' : 'ผ่านรายการ' + (rows && sel.length ? ' (' + sel.length + ' ราย)' : '')}</button>
      </div>

      <div className="search-card" style={{ padding: 14 }}>
        <div className="dep-int-controls dep-co-controls" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr)) auto', alignItems: 'end' }}>
          <DatFieldLite label="ปี (พ.ศ.)">
            <input className="cfg-input mono" type="number" value={year} onChange={(e) => { setYear(parseInt(e.target.value, 10) || year); setRows(null); }} />
          </DatFieldLite>
          <DatFieldLite label="เดือน">
            <select className="cfg-input" value={month} onChange={(e) => { setMonth(parseInt(e.target.value, 10)); setRows(null); }}>
              {DEP_CO_MONTHS.map((m, i) => <option key={m} value={i + 1}>{String(i + 1).padStart(2, '0')} — {m}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="หน่วยงาน">
            <select className="cfg-input" value={org} onChange={(e) => { setOrg(e.target.value); setRows(null); }}>
              {DEP_CO_ORGS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="รายการลงวันที่">
            <window.ThaiDateField value={txnDate} onChange={(v) => setTxnDate(v)} />
          </DatFieldLite>
          <button className="btn primary" style={{ height: 32 }} onClick={pull}>ดึงข้อมูล</button>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          <Icon name="info" size={11} /> จำนวนเงิน = ยอดฝากรายเดือนของบัญชี (เมนูเปลี่ยนแปลงฝากรายเดือน) · ยอดโอน = จำนวนเงิน + ยอดปรับปรุง · ไม่รวมบัญชีที่หมดงวดเรียกเก็บ อายัดห้ามฝาก หรือสมาชิกลาออก · ผ่านรายการแล้วยอดเข้าบัญชีทันที และผ่านซ้ำงวดเดิมไม่ได้
        </div>
      </div>

      {rows && (
        <>
          <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
            <IvStat label="จำนวนราย" value={rows.length + ' ราย'} accent />
            <IvStat label="รวมจำนวนเงิน" value={'฿ ' + fmt.money(totAmount, 2)} />
            <IvStat label="รวมยอดปรับปรุง" value={'฿ ' + fmt.money(totAdjust, 2)} />
            <IvStat label="รวมยอดโอน" value={'฿ ' + fmt.money(totTransfer, 2)} tone="ok" />
          </div>
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="dat-section-head is-bar"><span className="head-bar" />
              <div className="dat-section-title">รายงานการปรับยอด · {orgLabel} · {DEP_CO_MONTHS[month - 1]} {year}</div>
              {posted && <span className="pill ok" style={{ marginLeft: 'auto' }}>ผ่านรายการแล้ว{doneRun ? ' · ' + fmt.date(doneRun.date) : ''}</span>}
            </div>
            <div className="table-wrap" style={{ margin: '12px 16px 16px', overflowX: 'auto' }}>
              <table className="tbl" style={{ minWidth: 960 }}>
                <thead><tr>
                  <th className="center" style={{ width: 40 }}><input type="checkbox" className="ct-check" disabled={posted} checked={rows.length > 0 && sel.length === rows.length} onChange={() => setSel(sel.length === rows.length ? [] : rows.map(r => r.accNo))} /></th>
                  <th className="center" style={{ width: 54 }}>ลำดับ</th>
                  <th className="mono" style={{ width: 92 }}>ทะเบียน</th>
                  <th className="mono" style={{ width: 128 }}>เลขที่บัญชี</th>
                  <th>ชื่อบัญชี</th>
                  <th className="right" style={{ width: 120 }}>จำนวนเงิน</th>
                  <th className="right" style={{ width: 120 }}>ยอดปรับปรุง</th>
                  <th className="right" style={{ width: 120 }}>ยอดโอน</th>
                  <th className="center" style={{ width: 116 }}>วันที่ปิดบัญชี</th>
                </tr></thead>
                <tbody>
                  <tr className="dep-co-sumrow">
                    <td colSpan="5"><b>จำนวนราย {rows.length} ราย</b></td>
                    <td className="right mono"><b>{fmt.money(totAmount, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totAdjust, 2)}</b></td>
                    <td className="right mono"><b>{fmt.money(totTransfer, 2)}</b></td>
                    <td></td>
                  </tr>
                  {rows.map(r => (
                    <tr key={r.accNo}>
                    <td className="center"><input type="checkbox" className="ct-check" disabled={posted} checked={sel.includes(r.accNo)} onChange={() => setSel(s => s.includes(r.accNo) ? s.filter(x => x !== r.accNo) : [...s, r.accNo])} /></td>
                      <td className="center mono">{r.seq}</td>
                      <td className="mono">{r.reg}</td>
                      <td className="mono">{r.accNo}</td>
                      <td>{r.name}</td>
                      <td className="right mono">{fmt.money(r.amount, 2)}</td>
                      <td className="right mono">{fmt.money(r.adjust, 2)}</td>
                      <td className="right mono">{fmt.money(r.transfer, 2)}</td>
                      <td className="center mono">{r.closed ? fmt.date(r.closed) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan="5" className="right">รวมทั้งสิ้น</td>
                  <td className="right mono"><b>{fmt.money(totAmount, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totAdjust, 2)}</b></td>
                  <td className="right mono"><b>{fmt.money(totTransfer, 2)}</b></td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
          </div>
          {ask && window.DepConfirmModal && <window.DepConfirmModal title="ยืนยันผ่านรายการตัดยอดเงินฝาก"
            lines={[['งวด', DEP_CO_MONTHS[month - 1] + ' ' + year], ['หน่วยงาน', orgLabel], ['ผ่านรายการ', sel.length + ' ราย'],
              ['ยอดโอนรวม', fmt.money(rows.filter(r => sel.includes(r.accNo)).reduce((s, r) => s + (r.transfer || 0), 0), 2) + ' บาท']]}
            okLabel="ยืนยันผ่านรายการ" onOk={() => { postTxn(); setTimeout(() => saveTxn(true), 0); }} onClose={() => setAsk(false)} />}
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepCutoffProcessPage });
