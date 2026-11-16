// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — เปลี่ยนแปลงฝากรายเดือน
//  ปรับยอดฝากประจำเดือน (หักผ่านเงินเดือน) ของบัญชีเงินฝาก + งวดที่เรียกเก็บถึง
//  โครงสร้าง: ① ข้อมูลคำร้อง ② รายละเอียดการเปลี่ยนแปลง ③ ประวัติการเปลี่ยนแปลง
// ════════════════════════════════════════════════════════════════════

const DMC_COLLECT_ALL = '9999999';
// "หักตลอด" ใช้ค่าเดียว 9999999 (ข้อมูลเดิม 999999 ถือเป็นค่าเดียวกัน)
const dmcNormCu = (v) => { const s = String(v == null ? '' : v).trim(); return !s || /^9{6,7}$/.test(s) ? DMC_COLLECT_ALL : s; };
const dmcToday = () => (window.dpcToday ? window.dpcToday() : (window.DEP_OPS_TODAY || new Date().toISOString().slice(0, 10)));
// งวดปัจจุบัน (YYYYMM พ.ศ.) ตามวันทำการ
const dmcCurPeriod = () => { const t = dmcToday(); return String(Number(t.slice(0, 4)) + 543) + t.slice(5, 7); };
// ค่าตั้งประเภทเงินฝาก
const dmcTypeSet = (code) => { try { const r = (window.datLoad ? window.datLoad() : []).find(x => x.code === code); return (r && r.settings) || null; } catch (e) { return null; } };
// บัญชีที่ฝากรายเดือนได้ — ประเภทเงินฝากติ๊ก "มีการฝากรายเดือน" หรือ "ส่งแบบรายงวด" · บัญชีที่มียอดฝากรายเดือนอยู่แล้วแก้ไขต่อได้
const dmcTypeAllows = (s) => !!s && (s.monthlyDeposit === true || s.periodicSend === 'period' || s.periodicSend === true);
const dmcEligible = (a) => !!a && a.status === 'active' && (dmcTypeAllows(dmcTypeSet(a.typeCode)) || Number(a.monthlyDeposit) > 0);
// เหตุผลที่ค้นไม่เจอ (แสดงในหน้าค้นหาบัญชี)
const dmcWhyNot = (a) => {
  if (a.status !== 'active') return 'บัญชีสถานะ “' + (a.status === 'closed' ? 'ปิดบัญชี' : a.status) + '”';
  return 'ประเภทเงินฝาก “' + (a.typeCode ? a.typeCode + ' ' : '') + (a.type || '') + '” ไม่ได้กำหนดให้มีการฝากรายเดือน (ตั้งที่ ค่าคงที่ › ประเภทเงินฝาก)';
};
// ป้ายที่มาของประวัติ
const dmcSourceLabel = (h) => h.source === 'open' ? 'ตั้งยอดตอนเปิดบัญชี' : h.source === 'legacy' ? 'ยอดยกมาจากระบบเดิม'
  : h.source === 'base' ? 'ยอดตั้งต้น (ไม่มีคำร้อง)' : h.kind === 'first' ? 'ตั้งยอดครั้งแรก' : '';
// เลขที่คำร้อง — ตามค่าคงที่ "เลขที่เอกสารอัตโนมัติ" (ประเภท monthly) · ปีตามวันทำการ · ไม่ซ้ำกับเลขที่มีอยู่
function dmcNextReqNo(history) {
  let cfg = null;
  try { const s = localStorage.getItem('admin_docno'); if (s) cfg = JSON.parse(s).find(d => d.key === 'monthly'); } catch (e) {}
  cfg = cfg || (window.SCH_DOCNO_DEFAULT || []).find(d => d.key === 'monthly') || { prefix: 'DMC', digits: 4, reset: 'year' };
  const t = dmcToday(), by = Number(t.slice(0, 4)) + 543, bm = t.slice(5, 7);
  const pre = cfg.prefix + '-' + by + (cfg.reset === 'month' ? '-' + bm : '') + '-';
  let seq = {};
  try { seq = JSON.parse(localStorage.getItem('dep_monthly_seq2') || '{}'); } catch (e) {}
  let n = Number(seq[pre]) || 0;
  (history || []).forEach(h => { if (String(h.id || '').startsWith(pre)) n = Math.max(n, Number(String(h.id).slice(pre.length)) || 0); });
  n += 1; seq[pre] = n;
  try { localStorage.setItem('dep_monthly_seq2', JSON.stringify(seq)); } catch (e) {}
  return pre + String(n).padStart(Number(cfg.digits) || 4, '0');
}
// ยอดรอมีผล — นำไปใช้เมื่อถึงวันที่มีผล
function dmcApplyDue(accounts, history) {
  const t = dmcToday();
  let changed = false;
  const applied = [];
  const accs = accounts.map(a => {
    const p = a.monthlyPending;
    if (!p || !p.effDate || p.effDate > t) return a;
    changed = true; applied.push(p.reqNo);
    const { monthlyPending, ...rest } = a;
    return { ...rest, monthlyDeposit: p.amount, collectUntil: p.collectUntil };
  });
  const hist = applied.length ? history.map(h => applied.includes(h.id) && h.status === 'pending' ? { ...h, status: 'applied' } : h) : history;
  return { changed, accs, hist };
}

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
  // เปิดหน้า → ยอดที่ถึงวันที่มีผลแล้วนำไปใช้กับบัญชี
  const [boot] = useState(() => {
    const r = (window.depMonthlyApplyDue || dmcApplyDue)(window.depTxnLoadAccounts(), window.depMonthlyLoadHistory());
    if (r.changed) { window.depTxnSaveAccounts(r.accs); window.depMonthlySaveHistory(r.hist); }
    return r;
  });
  const [accounts, setAccounts] = useState(boot.accs);
  const [history, setHistory] = useState(boot.hist);
  const [acc, setAcc] = useState(null);
  const eligibleAccounts = useMemo(() => accounts.filter(dmcEligible), [accounts]);

  const today = dmcToday();
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
  // ยังไม่เคยตั้งยอด = ไม่มียอด และไม่มีประวัติ · มียอดแต่ไม่มีประวัติ → แสดงแถว "ยอดตั้งต้น (ไม่มีคำร้อง)"
  const neverSet = !!cur && !(Number(cur.monthlyDeposit) > 0) && accHistory.length === 0;
  const histRows = cur && accHistory.length === 0 && Number(cur.monthlyDeposit) > 0
    ? [{ id: '—', source: 'base', reqDate: cur.openDate, date: cur.openDate, oldAmount: 0, newAmount: Number(cur.monthlyDeposit), collectUntil: cur.collectUntil, by: '—', note: '' }]
    : accHistory;
  const mstate = cur && window.depMonthlyState ? window.depMonthlyState(cur) : { expired: false, stopped: false };
  const live = cur && window.depMemberLive ? window.depMemberLive(cur.member) : null;
  const memName = (live && live.name) || (cur && cur.name) || '';
  const memDept = (live && live.dept) || (cur && cur.dept) || '—';
  const memStatus = (live && live.status) || (cur && cur.memberStatus) || '';
  const memGone = window.depMemberGone ? window.depMemberGone(memStatus) : /ลาออก|เสียชีวิต/.test(memStatus);
  const opsUser = window.depOpsUser ? window.depOpsUser() : window.DEP_OPS_USER;
  const pend = cur ? cur.monthlyPending : null;
  const tset = cur ? dmcTypeSet(cur.typeCode) : null;
  const frzInfo = cur && window.dpcFreezeInfo ? window.dpcFreezeInfo(cur.accNo) : { eff: null, pending: null };
  const frz = frzInfo.eff;
  const frzIn = !!(frz && window.dpcFreezeRule && window.dpcFreezeRule(frz).in);

  const selectAccount = (a) => {
    setAcc(a); setError(''); setSavedNo('');
    setChangeDate(today); setEffDate(today);
    if (a) {
      setNewAmount(String(a.monthlyDeposit || 0));
      setCollectUntil(dmcNormCu(a.collectUntil));
      setNote('');
    } else { setNewAmount(''); setCollectUntil(''); setNote(''); }
  };

  const validate = () => {
    if (!cur) return 'กรุณาเลือกบัญชีเงินฝากก่อนบันทึก';
    if (newAmount === '' || isNaN(Number(newAmount))) return 'กรุณาระบุยอดขอฝากเดือนละให้ถูกต้อง';
    if (newNum < 0) return 'ยอดขอฝากเดือนละต้องไม่ติดลบ';
    const cu = dmcNormCu(collectUntil);
    if (cu !== DMC_COLLECT_ALL && !/^\d{6}$/.test(cu)) return 'งวดเรียกเก็บถึงต้องอยู่ในรูปแบบ YYYYMM (เช่น 256912) หรือ 9999999 (หักตลอด)';
    if (cu !== DMC_COLLECT_ALL) {
      const mm = Number(cu.slice(4, 6));
      if (mm < 1 || mm > 12) return 'งวดเรียกเก็บถึง — เดือนต้องอยู่ระหว่าง 01–12';
      if (cu < dmcCurPeriod()) return 'งวดเรียกเก็บถึงต้องไม่ก่อนงวดปัจจุบัน (' + dmcFmtPeriod(dmcCurPeriod()) + ')';
    }
    if (!effDate || (changeDate && effDate < changeDate)) return 'วันที่มีผลต้องไม่ก่อนวันที่ขอเปลี่ยน';
    if (cu !== DMC_COLLECT_ALL && window.depPeriodOf && cu < window.depPeriodOf(effDate))
      return 'งวดเรียกเก็บถึงต้องไม่ก่อนงวดของวันที่มีผล (' + dmcFmtPeriod(window.depPeriodOf(effDate)) + ')';
    if (memGone && newNum > 0) return 'สมาชิกมีสถานะ “' + memStatus + '” — หักเงินเดือนไม่ได้ ตั้งได้เฉพาะยอด 0 (หยุดหัก)';
    if (newNum === oldAmount && cu === dmcNormCu(cur.collectUntil) && !pend) return 'ยังไม่มีการเปลี่ยนแปลง — โปรดปรับยอดฝากเดือนละหรือ งวดเรียกเก็บถึง';
    // เงื่อนไขจากประเภทเงินฝาก
    if (!dmcEligible(cur)) return 'ประเภทเงินฝาก “' + cur.type + '” ไม่ได้กำหนดให้มีการฝากรายเดือน (ตั้งที่ประเภทเงินฝาก › มีการฝากรายเดือน)';
    if (tset) {
      const minDep = Number(tset.minDeposit) || 0;
      if (newNum > 0 && minDep > 0 && newNum < minDep) return 'ยอดฝากเดือนละต้องไม่น้อยกว่ายอดฝากขั้นต่ำของประเภทเงินฝาก (' + fmt.money(minDep, 2) + ' บาท)';
      if (tset.depTxnLimitOn && tset.depTxnWithin === 'month' && Number(tset.depTxnMaxAmount) > 0 && newNum > Number(tset.depTxnMaxAmount))
        return 'ยอดฝากเดือนละเกินวงเงินฝากสูงสุดต่อเดือนของประเภทเงินฝาก (' + fmt.money(Number(tset.depTxnMaxAmount), 2) + ' บาท)';
      if (tset.maxBalanceOn && Number(tset.maxBalance) > 0 && newNum > 0 && cur.balance + newNum > Number(tset.maxBalance))
        return 'ฝากงวดถัดไปแล้วยอดคงเหลือจะเกินยอดสูงสุดของประเภทเงินฝาก (' + fmt.money(Number(tset.maxBalance), 2) + ' บาท)';
      if ((tset.periodicSend === 'period' || tset.periodicSend === true) && tset.periodicAmtMode === 'equal' && oldAmount > 0 && newNum !== oldAmount)
        return 'ประเภทเงินฝากนี้กำหนดจำนวนส่งเท่ากันทุกงวด — เปลี่ยนได้เฉพาะงวดเรียกเก็บถึง';
    }
    if (frzIn && newNum > 0) return 'บัญชีถูกอายัด — ' + frz.label + ' · ห้ามรับฝาก จึงกำหนดยอดฝากรายเดือนไม่ได้';
    return '';
  };

  const submit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const cu = dmcNormCu(collectUntil);
    const reqNo = dmcNextReqNo(history);
    // วันที่มีผลถึงแล้ว → ใช้ทันที · ยังไม่ถึง → เก็บเป็นยอดรอมีผล (คำร้องรอมีผลเดิมถูกแทนที่)
    const now = effDate <= today;
    const nextAcc = accounts.map(a => {
      if (a.accNo !== cur.accNo) return a;
      const { monthlyPending, ...rest } = a;
      return now ? { ...rest, monthlyDeposit: newNum, collectUntil: cu, payrollLinked: newNum > 0 }
                 : { ...rest, monthlyPending: { reqNo, amount: newNum, collectUntil: cu, effDate } };
    });
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);

    const rec = { id: reqNo, accNo: cur.accNo, member: cur.member, reqDate: changeDate, date: effDate,
      oldAmount, newAmount: newNum, collectUntil: cu, by: opsUser, note: note.trim(), status: now ? 'applied' : 'pending',
      ...(neverSet && newNum > 0 ? { kind: 'first' } : {}) };
    const nextHist = [rec, ...history.map(h => pend && h.id === pend.reqNo && h.status === 'pending' ? { ...h, status: 'replaced' } : h)];
    setHistory(nextHist); window.depMonthlySaveHistory(nextHist);

    audit.log && audit.log({
      action: 'update', module: 'เงินฝาก — เปลี่ยนแปลงฝากรายเดือน', user: opsUser,
      target: `${cur.member} · ${cur.name} · ${cur.accNo}`,
      summary: `คำร้อง ${reqNo} · ปรับฝากรายเดือน ${fmt.money(oldAmount, 2)} → ${fmt.money(newNum, 2)} บาท · เรียกเก็บถึง ${dmcFmtPeriod(cu)}`,
      changes: [
        { field: 'ฝากรายเดือน', before: fmt.money(oldAmount, 2), after: fmt.money(newNum, 2) },
        { field: 'เรียกเก็บถึงงวด', before: dmcFmtPeriod(cur.collectUntil), after: dmcFmtPeriod(cu) },
      ],
    });
    setSavedNo(reqNo);
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกคำร้องเปลี่ยนแปลงฝากรายเดือน “' + reqNo + '” เรียบร้อยแล้ว' + (now ? '' : ' — มีผลวันที่ ' + fmt.date(effDate)) });
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
      {savedNo && !error && (<div className="dn-status-alert" style={{ margin: '12px 0' }}><Icon name="check" size={15} /><span>บันทึกคำร้อง <b className="mono">{savedNo}</b> แล้ว — {pend && pend.reqNo === savedNo ? <>ยอดฝากรายเดือนใหม่มีผลวันที่ <b>{fmt.date(pend.effDate)}</b></> : 'ยอดฝากรายเดือนใหม่จะถูกใช้ในการเรียกเก็บรอบถัดไป'}</span></div>)}

          <div style={{ marginTop: error || savedNo ? 0 : 12 }}>
              {cur ? (
                <DepAccountCard acc={cur} extra={<>
                  <div className="dep-acc-f"><span className="k">ฝากรายเดือนปัจจุบัน</span><span className="v mono" style={{ fontWeight: 700 }}>{neverSet ? <span className="muted" style={{ fontWeight: 400 }}>ยังไม่ได้ตั้ง</span> : fmt.money(oldAmount, 2)}
                    {mstate.expired && <span className="pill warn" style={{ fontSize: 11, marginLeft: 6 }}>หมดงวดเรียกเก็บ</span>}
                    {mstate.stopped && <span className="pill neutral" style={{ fontSize: 11, marginLeft: 6 }}>หยุดหัก</span>}
                    {mstate.notStarted && <span className="pill neutral" style={{ fontSize: 11, marginLeft: 6 }}>เริ่มหักงวด {cur.collectFrom}</span>}</span></div>
                  {pend && <div className="dep-acc-f"><span className="k">ยอดใหม่ (รอมีผล)</span><span className="v mono" style={{ fontWeight: 700, color: 'var(--warning, #d48806)' }}>{fmt.money(pend.amount, 2)} <span className="muted" style={{ fontWeight: 400 }}>· มีผล {fmt.date(pend.effDate)}</span></span></div>}
                </>} />
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
          {cur && (frz || frzInfo.pending) && (
            <div className="dat-warn" style={{ marginTop: 12, ...{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' } }}>
              <Icon name="lock" size={14} />
              <span>{frz
                ? <>บัญชีถูกอายัด — <b>{frz.label}</b>{frz.reason ? ' · เหตุผล: ' + frz.reason : ''} · {window.dpcFreezeText ? window.dpcFreezeText(frz, cur.balance) : ''}</>
                : <>มีคำขออายัด <b>{frzInfo.pending.label}</b> รออนุมัติ — ยังไม่มีผลจนกว่าจะอนุมัติ</>}</span>
            </div>
          )}
          <div className="dep-form-cols" style={{ marginTop: 12 }}>
            <div className="dep-form-main">
              {/* ① ข้อมูลคำร้อง */}
              <div className="search-card dat-section" style={{ marginTop: 0 }}>
                <DepSecHead icon="report" title="ข้อมูลคำร้อง" sub="ค้นหาบัญชี เลขที่คำร้อง วันที่ขอเปลี่ยน และวันที่มีผล" />
                <div style={{ padding: '16px 16px 0' }}>
                  <label className="dat-label" style={{ display: 'block', marginBottom: 6 }}>ค้นหาบัญชีเงินฝาก</label>
                  <DepAccountSearchField accounts={eligibleAccounts} value={cur} onPick={selectAccount} allAccounts={accounts} whyNot={dmcWhyNot}
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
                    {cur ? <div className="cfg-display-box mono">{cur.member} · {memName}</div> : <div className="cfg-display-box muted">—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="สังกัด" span={2}>
                    {cur ? <div className="cfg-display-box">{memDept}</div> : <div className="cfg-display-box muted">—</div>}
                  </DatFieldLite>
                  <DatFieldLite label="เลขที่บัญชี" span={2}>
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
                    {cur ? (neverSet ? <div className="cfg-display-box muted" style={{ textAlign: 'right' }}>ยังไม่ได้ตั้ง</div> : <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{fmt.money(oldAmount, 2)}</div>) : <div className="cfg-display-box muted" style={{ textAlign: 'right' }}>—</div>}
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
                  <Icon name="info" size={12} /> <span>การใส่งวดเรียกเก็บอยู่ในรูปแบบ ปีและเดือน YYYYMM เช่น 256912 (หากต้องการหักตลอดใส่ 9999999) — งวดปัจจุบัน: <b>{dmcFmtPeriod(dmcCurPeriod())}</b> · เรียกเก็บถึง: <b>{cur ? dmcFmtPeriod(collectUntil) : '—'}</b></span>
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
                  meta={cur ? histRows.length + ' รายการ' : null} />
                <div className="table-wrap" style={{ margin: '16px' }}><div className="table-scroll">
                  <table className="tbl">
                    <thead><tr>
                      <th>เลขที่คำขอ</th><th className="center">วันที่เปลี่ยนแปลง</th>
                      <th className="num">ยอดฝากเก่า</th><th className="num">ยอดฝากใหม่</th>
                      <th className="center">ฝากถึงงวด</th><th>ผู้ทำรายการ</th><th>หมายเหตุ</th>
                    </tr></thead>
                    <tbody>
                      {histRows.length === 0 ? (
                        <tr><td colSpan="7" className="center muted" style={{ padding: 18 }}>{cur ? 'ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับบัญชีนี้' : 'เลือกบัญชีเพื่อแสดงประวัติการเปลี่ยนแปลง'}</td></tr>
                      ) : histRows.map(h => (
                        <tr key={h.id + (h.source || '')}>
                          <td className="mono">{h.id}
                            {dmcSourceLabel(h) && <div><span className="pill info" style={{ fontSize: 11 }}>{dmcSourceLabel(h)}</span></div>}</td>
                          <td className="center mono">{fmt.date(h.reqDate || h.date)}
                            {h.reqDate && h.reqDate !== h.date && <div className="muted" style={{ fontSize: 11 }}>มีผล {fmt.date(h.date)}</div>}</td>
                          <td className="num mono">{fmt.money(h.oldAmount, 2)}</td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(h.newAmount, 2)}
                            {h.status === 'pending' && <div><span className="pill warn" style={{ fontSize: 11 }}>รอมีผล</span></div>}
                            {h.status === 'replaced' && <div><span className="pill" style={{ fontSize: 11 }}>ยกเลิก (มีคำร้องใหม่)</span></div>}
                            {Number(h.newAmount) === 0 && h.status !== 'replaced' && <div><span className="pill neutral" style={{ fontSize: 11 }}>หยุดหัก</span></div>}</td>
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
