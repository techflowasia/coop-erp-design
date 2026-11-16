// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — ผ่านเช็ค / คืนเช็ค
//  ดึงเช็คที่นำส่งตามวันที่ → เลือกเช็ค → บันทึกผ่านเช็ค หรือ คืนเช็ค (พร้อมเหตุผล)
//  เลือกแถวเพื่อดูรายละเอียดบัญชี/ธนาคารด้านล่าง (ฟิลด์ว่างก่อนเลือก)
// ════════════════════════════════════════════════════════════════════

const chqToIso = (s) => { const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? (Number(m[3]) - 543) + '-' + m[2] + '-' + m[1] : ''; };
const chqToTh = (iso) => { const [y, m, d] = String(iso || '').split('-'); return y ? d + '/' + m + '/' + (Number(y) + 543) : ''; };
// ── ทะเบียนเช็ครับฝาก — เช็คจากหน้าฝาก/ถอนหลายยอด และฝาก/ถอน/โอน/ปิดบัญชี (สถานะ pending → cleared / returned)
const DEP_CHQ_REG_KEY = 'dep_cheque_register_v1';
const chqIsoToday = () => (window.dpcToday ? window.dpcToday() : new Date().toISOString().slice(0, 10));
window.depChqRegLoad = function () {
  try { const s = localStorage.getItem(DEP_CHQ_REG_KEY); if (s) return JSON.parse(s); } catch (e) {}
  const seed = (window.DEP_DAILY_CHEQUES || []).map((c, i) => ({ id: 'CHQ-S' + String(i + 1).padStart(3, '0'), chqNo: c.chqNo, bank: c.bank, branch: c.branch,
    type: '', floatDays: 0, faceDate: chqToIso(c.faceDate), sendDate: chqToIso(c.sendDate), amount: c.amount, accNo: c.accNo, accName: c.accName,
    src: 'ข้อมูลตั้งต้น', status: 'pending', actDate: '', reason: '', fee: 0, by: '' }));
  try { localStorage.setItem(DEP_CHQ_REG_KEY, JSON.stringify(seed)); } catch (e) {}
  return seed;
};
window.depChqRegSave = (l) => { try { localStorage.setItem(DEP_CHQ_REG_KEY, JSON.stringify(l)); } catch (e) {} };
window.depChqRegAdd = (rows) => {
  if (!rows || !rows.length) return;
  const cur = window.depChqRegLoad();
  window.depChqRegSave([...rows.map((r, i) => ({ id: 'CHQ-' + Date.now() + '-' + i, status: 'pending', actDate: '', reason: '', fee: 0, ...r })), ...cur]);
};
const DEP_CHQ_ST = { pending: 'รอเรียกเก็บ', cleared: 'ผ่านเช็คแล้ว', returned: 'คืนเช็คแล้ว' };
// ประเภท / กลุ่มเงินฝากของบัญชี — จากข้อมูลบัญชี + ค่าคงที่ประเภทเงินฝาก / ประเภทกลุ่มเงินฝาก
const chqAccInfo = (accNo, accounts, types, kinds) => {
  const a = accounts.find(x => x.accNo === accNo) || {};
  const rec = types.find(t => t.code === a.typeCode);
  const g = rec && rec.settings ? (window.depKindNorm ? window.depKindNorm(rec.settings.depGroup) : rec.settings.depGroup) : '';
  const k = kinds.find(o => o.v === g);
  return { acc: a, depType: a.typeCode ? a.typeCode + ' ' + (a.type || '') : '', depGroup: k ? k.l.replace(/^\S+\s/, '') : '' };
};
const chqTxnName = (code, fb) => { try { const r = (window.depTxnTypeLoad ? window.depTxnTypeLoad() : []).find(x => x.code === code); return (r && r.name) || fb; } catch (e) { return fb; } };

const DEP_CHQ_CFG = {
  clear: { title: 'ผ่านเช็ค', desc: 'นำเช็คที่เรียกเก็บได้ผ่านรายการเข้าระบบเงินฝาก', sumLabel: 'รวมผ่านเช็ค', action: 'บันทึกผ่านเช็ค', dateCol: 'วันที่ผ่าน', doneStatus: 'ผ่านเช็คแล้ว' },
  ret:   { title: 'คืนเช็ค', desc: 'บันทึกรายการขอคืนเช็คที่เรียกเก็บไม่ได้ พร้อมเหตุผลการคืน', sumLabel: 'รวมคืนเช็ค', action: 'บันทึกคืนเช็ค', dateCol: 'วันที่คืนเช็ค', doneStatus: 'คืนเช็คแล้ว' },
};

function DepChqField({ label, value, mono, span }) {
  return (
    <div className="dat-field" style={span === 2 ? { gridColumn: 'span 2' } : undefined}>
      <label>{label}</label>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly value={value || ''} placeholder="—" />
    </div>
  );
}

function DepChequeOpsPage({ variant = 'clear', onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const cfg = DEP_CHQ_CFG[variant];
  const isRet = variant === 'ret';

  const today = chqIsoToday();
  const [date, setDate] = useState(chqToTh(today));
  const [status, setStatus] = useState('รอเรียกเก็บ');
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState([]);
  const [cur, setCur] = useState(null);
  const [actDate, setActDate] = useState(chqToTh(today));
  // เหตุผลการคืนเช็ค / ค่าธรรมเนียมเช็คคืน — กรอกเอง (ไม่ใช้ค่าคงที่)
  const [reason, setReason] = useState('');
  const [fee, setFee] = useState('');

  // ดึงจากทะเบียนเช็คจริง — กรองวันที่นำส่ง (ถึงวันที่เลือก) และสถานะ
  const pull = () => {
    const iso = chqToIso(date);
    const want = isRet ? (status === 'รอเรียกเก็บ' ? ['pending'] : status === 'คืนเช็คแล้ว' ? ['returned'] : ['pending', 'returned', 'cleared'])
                       : ['pending', 'cleared'];
    const accounts = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
    const types = window.datLoad ? window.datLoad() : [];
    const kinds = window.depKindOpts ? window.depKindOpts() : [];
    const got = window.depChqRegLoad().filter(c => want.includes(c.status) && (!iso || !c.sendDate || c.sendDate <= iso))
      .sort((a, b) => String(a.sendDate).localeCompare(String(b.sendDate)));
    setRows(got.map((c, i) => { const inf = chqAccInfo(c.accNo, accounts, types, kinds); return {
      ...c, _id: c.id, seq: i + 1, done: c.status !== 'pending', status: DEP_CHQ_ST[c.status] || c.status,
      sendDate: chqToTh(c.sendDate), faceDate: chqToTh(c.faceDate), actDate: chqToTh(c.actDate),
      accName: c.accName || inf.acc.name || '', depType: inf.depType, depGroup: inf.depGroup }; }));
    setSel([]); setCur(null);
    onToast && onToast(`ดึงข้อมูลเช็คนำส่งถึงวันที่ ${date} — ${got.length} รายการ`);
  };

  const list = rows || [];
  const toggle = (n) => setSel(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);
  const picked = list.filter(r => sel.includes(r.seq) && !r.done);
  const total = list.reduce((s, r) => s + r.amount, 0);
  const doneTotal = list.filter(r => r.done).reduce((s, r) => s + r.amount, 0);

  const commit = () => {
    if (isRet && !reason.trim()) { onToast && onToast('กรุณาระบุเหตุผลการคืนเช็ค'); return; }
    const ids = picked.map(r => r.seq);
    const regIds = picked.map(r => r._id);
    const actIso = chqToIso(actDate) || today;
    const feeNum = isRet ? (Number(fee) || 0) : 0;
    const user = window.DEP_OPS_USER || '';
    // คืนเช็ค → หักยอดเช็ค (RCL) + ค่าธรรมเนียมเช็คคืน (FEE) ออกจากบัญชี · บันทึกสถานะลงทะเบียนเช็ค
    let accs = window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [];
    const newL = [];
    const reg = window.depChqRegLoad().map(c => {
      if (!regIds.includes(c.id)) return c;
      if (!isRet) return { ...c, status: 'cleared', actDate: actIso, by: user };
      const a = accs.find(x => x.accNo === c.accNo);
      if (a && window.depTxnNextId) {
        let bal = Number(a.balance) - Number(c.amount);
        newL.push({ id: window.depTxnNextId(), date: actIso, accNo: a.accNo, member: a.member, type: 'withdraw',
          channel: 'RCL ' + chqTxnName('RCL', 'เช็คคืน') + ' ' + c.chqNo, code: 'RCL', amount: Number(c.amount), fee: 0, balance: bal, ref: c.chqNo, by: user });
        if (feeNum) {
          bal -= feeNum;
          newL.push({ id: window.depTxnNextId(), date: actIso, accNo: a.accNo, member: a.member, type: 'withdraw',
            channel: 'FEE ค่าธรรมเนียมเช็คคืน ' + c.chqNo, code: 'FEE', amount: feeNum, fee: 0, balance: bal, ref: c.chqNo, by: user });
        }
        accs = accs.map(x => x.accNo === a.accNo ? { ...x, balance: bal } : x);
      }
      return { ...c, status: 'returned', actDate: actIso, reason, fee: feeNum, by: user };
    });
    window.depChqRegSave(reg);
    if (isRet && newL.length) {
      window.depTxnSaveAccounts && window.depTxnSaveAccounts(accs);
      window.depTxnSaveLedger && window.depTxnSaveLedger([...newL.reverse(), ...(window.depTxnLoadLedger ? window.depTxnLoadLedger() : [])]);
    }
    setRows(list.map(r => ids.includes(r.seq)
      ? { ...r, done: true, status: cfg.doneStatus, actDate, reason: isRet ? reason : '', fee: feeNum } : r));
    setSel([]);
    audit.log({
      action: 'update', module: 'เงินฝาก — ' + cfg.title, target: date,
      summary: `${cfg.action} ${ids.length} ฉบับ รวม ${fmt.money(picked.reduce((s, r) => s + r.amount, 0), 2)} บาท${isRet ? ' · เหตุผล: ' + reason + (feeNum ? ' · ค่าธรรมเนียม ' + fmt.money(feeNum, 2) + ' บาท/ฉบับ' : '') : ''}`,
      changes: picked.map(r => ({ field: 'เช็คเลขที่ ' + r.chqNo, before: 'รอเรียกเก็บ', after: cfg.doneStatus })),
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: cfg.action + ' ' + ids.length + ' ฉบับเรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label={cfg.title}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cfg.title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{cfg.desc}</div>
        </div>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <DepSecHead icon="filter" title="แสดงรายละเอียดข้อมูลวันที่" sub="ดึงเช็คที่นำส่งถึงวันที่ระบุ จากทะเบียนเช็ครับฝาก" />
        <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="dat-grid" style={{ padding: 0, flex: 1, minWidth: 300, gridTemplateColumns: isRet ? '200px 200px' : '200px', justifyContent: 'start' }}>
            <DatFieldLite label="นำส่งถึงวันที่">
              <window.ThaiDateField value={chqToIso(date)} onChange={(v) => { setDate(chqToTh(v)); setRows(null); }} />
            </DatFieldLite>
            {isRet && (
              <DatFieldLite label="สถานะ">
                <select className="cfg-input" value={status} onChange={(e) => { setStatus(e.target.value); setRows(null); }}>
                  <option>รอเรียกเก็บ</option><option>คืนเช็คแล้ว</option><option>ทั้งหมด</option>
                </select>
              </DatFieldLite>
            )}
          </div>
          <button className="btn" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
        </div>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <DepSecHead bar icon="receipt" title="รายการเช็ค" sub="เช็คที่นำส่งตามวันที่ที่เลือก" meta={list.length ? list.length + ' ฉบับ' : null} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl chq-ops-tbl" style={{ minWidth: isRet ? 1120 : 1000 }}>
            <thead><tr>
              <th className="center" style={{ width: 32 }} />
              <th className="center" style={{ width: 44 }}>ลำดับ</th>
              <th style={{ width: 84 }}>เลขที่เช็ค</th>
              <th style={{ minWidth: 180 }}>บัญชี</th>
              <th style={{ minWidth: 130 }}>ธนาคาร / สาขา</th>
              <th className="center" style={{ width: 96 }}>วันที่นำส่ง</th>
              <th className="center" style={{ width: 96 }}>วันที่หน้าเช็ค</th>
              <th className="right" style={{ width: 110 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 96 }}>{isRet ? 'สถานะคืน' : 'สถานะเช็ค'}</th>
              <th className="center" style={{ width: 96 }}>{cfg.dateCol}</th>
              {isRet && <th>เหตุผล</th>}
            </tr></thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={isRet ? 11 : 10} className="center muted" style={{ padding: '28px 12px' }}>
                  กด “ดึงข้อมูล” เพื่อแสดงรายการเช็คของวันที่ที่ระบุ
                </td></tr>
              ) : list.map(r => (
                <tr key={r.seq}>
                  <td className="center"><input type="checkbox" checked={sel.includes(r.seq)} disabled={r.done} onChange={() => toggle(r.seq)} /></td>
                  <td className="center mono">{r.seq}</td>
                  <td className="mono">{r.chqNo}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div><span className="mono">{r.accNo}</span> · {r.accName}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{[r.depType, r.depGroup].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div>{r.bank || '—'}</div>
                    {r.branch && <div className="muted" style={{ fontSize: 11.5 }}>{r.branch}</div>}
                  </td>
                  <td className="center mono">{r.sendDate}</td>
                  <td className="center mono">{r.faceDate}</td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                  <td className="center"><span className={'pill ' + (r.done ? (isRet ? 'bad' : 'ok') : 'warn')}>{r.status}</span></td>
                  <td className="center mono">{r.actDate || '—'}</td>
                  {isRet && <td>{r.reason || <span className="muted">—</span>}{r.fee ? <div className="muted" style={{ fontSize: 11.5 }}>ค่าธรรมเนียม {fmt.money(r.fee, 2)}</div> : null}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan="7" className="right"><b>รวม</b></td>
              <td className="right mono"><b>{fmt.money(total, 2)}</b></td>
              <td className="right" colSpan={isRet ? 2 : 1}><b>{cfg.sumLabel}</b></td>
              <td className="right mono" style={{ color: isRet ? 'var(--danger-600, #cf1322)' : 'var(--primary-700)' }}><b>{fmt.money(doneTotal, 2)}</b></td>
            </tr></tfoot>
          </table>
        </div></div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isRet ? '200px minmax(0,1fr) 160px auto' : '200px max-content', justifyContent: isRet ? 'start' : 'space-between', gap: 12, alignItems: 'end', borderTop: '1px solid var(--border)' }}>
          <div className="dat-field" style={{ minWidth: 0 }}>
            <label className="dat-label">{cfg.dateCol}</label>
            <div style={list.length === 0 ? { opacity: .55, pointerEvents: 'none' } : undefined}>
              <window.ThaiDateField value={chqToIso(actDate)} onChange={(v) => setActDate(chqToTh(v))} />
            </div>
          </div>
          {isRet && (
            <div className="dat-field" style={{ minWidth: 0 }}>
              <label className="dat-label">เหตุผลการคืนเช็ค</label>
              <input className="cfg-input" value={reason} disabled={list.length === 0} placeholder="ระบุเหตุผลการคืนเช็ค"
                     onChange={(e) => setReason(e.target.value)} />
            </div>
          )}
          {isRet && (
            <div className="dat-field" style={{ minWidth: 0 }}>
              <label className="dat-label">ค่าธรรมเนียมเช็คคืน / ฉบับ</label>
              <input className="cfg-input mono" style={{ textAlign: 'right' }} inputMode="decimal" value={fee} disabled={list.length === 0}
                     onChange={(e) => setFee(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            </div>
          )}
          <button className="btn primary" style={{ whiteSpace: 'nowrap' }} disabled={picked.length === 0} onClick={commit}>
            <Icon name="check" /> {cfg.action}{picked.length ? ` (${picked.length})` : ''}
          </button>
        </div>
      </div>

    </div>
  );
}

Object.assign(window, { DepChequeOpsPage });
