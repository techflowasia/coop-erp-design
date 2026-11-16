// ═════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — เปิดเคาน์เตอร์ / ปิดเคาน์เตอร์
//   · DepCounterOpenPage  — หัวหน้าคีย์เปิดทีละเครื่องผ่าน popup (แสดงเฉพาะเครื่องของตนเอง)
//   · DepCounterClosePage — นับเงินในเครื่อง กระทบยอด แล้วปิดเคาน์เตอร์ / ปิดวัน
//  Session ทุกเครื่องเก็บใน localStorage (dep.counter.sessions)
// ═════════════════════════════════════════════════════════════════

const DEP_COUNTERS = [
  { code: 'CT-01', name: 'เคาน์เตอร์ 1 — สำนักงานใหญ่ ชั้น 1' },
  { code: 'CT-02', name: 'เคาน์เตอร์ 2 — สำนักงานใหญ่ ชั้น 1' },
  { code: 'CT-03', name: 'เคาน์เตอร์ 3 — สำนักงานใหญ่ ชั้น 2' },
  { code: 'CT-04', name: 'เคาน์เตอร์ 4 — สาขาหลักสี่' },
  { code: 'CT-05', name: 'เคาน์เตอร์เคลื่อนที่ — หน่วยบริการนอกสถานที่' },
];


const DEP_CASH_DENOMS = [
  { v: 1000, l: 'ธนบัตร 1,000 บาท', u: 'ใบ' },
  { v: 500,  l: 'ธนบัตร 500 บาท',   u: 'ใบ' },
  { v: 100,  l: 'ธนบัตร 100 บาท',   u: 'ใบ' },
  { v: 50,   l: 'ธนบัตร 50 บาท',    u: 'ใบ' },
  { v: 20,   l: 'ธนบัตร 20 บาท',    u: 'ใบ' },
  { v: 10,   l: 'เหรียญ 10 บาท',    u: 'เหรียญ' },
  { v: 5,    l: 'เหรียญ 5 บาท',     u: 'เหรียญ' },
  { v: 2,    l: 'เหรียญ 2 บาท',     u: 'เหรียญ' },
  { v: 1,    l: 'เหรียญ 1 บาท',     u: 'เหรียญ' },
  { v: 0.5,  l: 'เหรียญ 50 สตางค์', u: 'เหรียญ' },
  { v: 0.25, l: 'เหรียญ 25 สตางค์', u: 'เหรียญ' },
];

const DEP_CT_KEY = 'dep.counter.sessions';

// ผู้ที่เข้าใช้งานระบบอยู่ — อ้างจากผู้ใช้งานระบบจริงของแอป (window.SYSTEM_USERS)
function depCtMe() {
  const name = window.LC_USER || window.DN_USER || 'มนตรี ศรีสุข';
  const u = (window.sysUserByName && window.sysUserByName(name)) || null;
  return u || { id: name, name: name, role: '' };
}
function depCtWho(n, r) { return n ? (r ? n + ' · ' + r : n) : null; }
// หัวหน้าผู้มีสิทธิ์อนุมัติเปิดเคาน์เตอร์ — ใช้ชุดผู้มีอำนาจของระบบ (รหัสอนุมัติ)
function depCtAuthorizers() { return window.CANCEL_AUTHORIZERS || []; }
const DEP_CT_AUTH_PIN = '12345';
const DEP_CT_LOG_KEY = 'dep.counter.closed';

function depCtLogLoad() {
  try { const raw = localStorage.getItem(DEP_CT_LOG_KEY); const a = raw ? JSON.parse(raw) : null; return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function depCtLogSave(list) {
  try { localStorage.setItem(DEP_CT_LOG_KEY, JSON.stringify(list || [])); } catch (e) { /* ignore */ }
}

// แถวข้อมูลแบบ label บน / control เต็มความกว้าง (ใช้ในคอลัมน์แคบ)
function DepCtRow({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="cfg-label" style={{ display: 'block', marginBottom: 6 }}>
        {label}{required && <span className="cfg-required"> *</span>}
      </label>
      {children}
    </div>
  );
}

function depCtLoadAll() {
  try { const raw = localStorage.getItem(DEP_CT_KEY); const o = raw ? JSON.parse(raw) : null; return (o && typeof o === 'object') ? o : {}; }
  catch (e) { return {}; }
}
function depCtSaveAll(map) {
  try { localStorage.setItem(DEP_CT_KEY, JSON.stringify(map || {})); } catch (e) { /* ignore */ }
}
function depCtNow() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return { iso: d.toISOString(), date: p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543),
           time: p(d.getHours()) + ':' + p(d.getMinutes()) };
}
function depCtNum(v) { const n = parseFloat(String(v).replace(/,/g, '')); return isFinite(n) ? n : 0; }
function depCtName(code) { const c = DEP_COUNTERS.find(x => x.code === code); return c ? c.name : code; }
// ยอดที่หัวหน้าจ่ายให้ทั้งหมดของ session (เงินตั้งต้น + รับเพิ่มระหว่างวัน)
function depCtIssued(s) { return depCtNum(s && s.opening) + ((s && s.topups) || []).reduce((a, t) => a + depCtNum(t.amount), 0); }
const DEP_CT_LOAN_KEY = 'dep_counter_loans';
function depCtLoansLoad() {
  try { const r = localStorage.getItem(DEP_CT_LOAN_KEY); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function depCtLoansSave(list) { try { localStorage.setItem(DEP_CT_LOAN_KEY, JSON.stringify(list || [])); } catch (e) {} }
// เงินเข้า(+)/ออก(−) สุทธิของเคาน์เตอร์ จากรายการยืม/คืนที่ยืนยันแล้ว ใน session ปัจจุบัน
function depCtLoanNet(s, list) {
  if (!s) return 0;
  const L = (list || depCtLoansLoad()).filter(x => x.status === 'done');
  return L.reduce((a, x) => {
    if (x.sessionFrom === s.openedAt && x.from === s.counter) return a - depCtNum(x.amount); // จ่ายออก
    if (x.sessionTo === s.openedAt && x.to === s.counter) return a + depCtNum(x.amount);     // รับเข้า
    return a;
  }, 0);
}
// ── เบิก/คืนเงินกับการเงิน ──
const DEP_CT_VAULT_KEY = 'dep_counter_vault';
function depCtVaultLoad() {
  try { const r = localStorage.getItem(DEP_CT_VAULT_KEY); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function depCtVaultSave(list) { try { localStorage.setItem(DEP_CT_VAULT_KEY, JSON.stringify(list || [])); } catch (e) {} }
// เบิก(+)/คืน(−) ที่ทำเสร็จแล้วของ session ปัจจุบัน
function depCtVaultNet(s, list) {
  if (!s) return 0;
  return (list || depCtVaultLoad()).filter(x => x.status === 'done' && x.counter === s.counter && x.session === s.openedAt)
    .reduce((a, x) => a + (x.kind === 'withdraw' ? 1 : -1) * depCtNum(x.approvedAmount != null ? x.approvedAmount : x.amount), 0);
}
// ─── เช็คที่รับ/จ่ายผ่านเคาน์เตอร์ (ไม่กระทบเงินสดในลิ้นชัก — ใช้สรุปตอนปิดเคาน์เตอร์) ───
const DEP_CT_CHQ_KEY = 'dep_counter_cheques';
function depCtChqLoad() {
  try { const r = localStorage.getItem(DEP_CT_CHQ_KEY); const a = r ? JSON.parse(r) : []; return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function depCtChqAdd(rows) {
  if (!rows || !rows.length) return;
  try { localStorage.setItem(DEP_CT_CHQ_KEY, JSON.stringify([...depCtChqLoad(), ...rows])); } catch (e) {}
}
function depCtChqOf(s) {
  if (!s) return [];
  return depCtChqLoad().filter(x => x.counter === s.counter && x.sessionAt === s.openedAt);
}
// เงินในเครื่องตอนนี้ = ตั้งต้น + รับเพิ่ม + ยืม/คืนระหว่างเคาน์เตอร์ + เบิก/คืนกับการเงิน
function depCtCashNow(s) { return s ? depCtIssued(s) + depCtLoanNet(s) + depCtVaultNet(s) : 0; }
// เคาน์เตอร์ของผู้ใช้ปัจจุบันที่ตรวจรับเงินแล้ว — ใช้เป็นเงื่อนไขเข้าหน้าฝาก/ถอน
function depCtReadyCounters() {
  const me = depCtMe(), all = depCtLoadAll();
  return DEP_COUNTERS.map(c => all[c.code]).filter(s =>
    s && s.status === 'open' && s.cashVerified &&
    (s.tellerId ? s.tellerId === me.id : s.teller === me.name));
}

// ─── Popup เปิดเคาน์เตอร์ ─────────────────────────────────────────
function DepCounterOpenModal({ taken, preset, onClose, onConfirm }) {
  const me = depCtMe();
  const [counter, setCounter] = useState(preset || '');
  const [code, setCode] = useState(preset || '');
  const [err, setErr] = useState('');

  const pickCounter = (v) => { setCounter(v); setCode(v || ''); };

  const submit = () => {
    if (!counter) return setErr('กรุณาเลือกเคาน์เตอร์');
    onConfirm({ counter, code: code.trim(), opening: 0,
                tellerId: me.id, teller: me.name, tellerRole: me.role });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="wallet" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เปิดเคาน์เตอร์</h2>
            <div className="muted" style={{ fontSize: 12 }}>เปิดเครื่องแล้วกดขอเบิกเงินตั้งต้น — หัวหน้าอนุมัติที่เมนูการเงิน</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}

          <div className="cfg-field">
            <label className="cfg-label">เคาน์เตอร์ <span className="cfg-required">*</span></label>
            <div className="cfg-input-wrap">
              <select className="cfg-input" value={counter} onChange={(e) => { pickCounter(e.target.value); setErr(''); }}>
                <option value="">— เลือกเคาน์เตอร์ —</option>
                {DEP_COUNTERS.map(c => (
                  <option key={c.code} value={c.code} disabled={!!(taken || {})[c.code]}>
                    {c.name}{(taken || {})[c.code] ? ' (เปิดอยู่แล้ว)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary sm" onClick={submit}><Icon name="check" /> เปิดเคาน์เตอร์</button>
        </div>
      </div>
    </>
  );
}

function DepCtKv({ label, value, mono }) {
  return (
    <div className="icr-kv">
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}>{value == null || value === '' ? <span className="muted">—</span> : value}</span>
    </div>
  );
}

// ─── หน้า เปิดเคาน์เตอร์ ──────────────────────────────────────────
function DepCounterOpenPage({ onToast }) {
  const me = depCtMe();
  const [sessions, setSessions] = useState(() => depCtLoadAll());
  const [modal, setModal] = useState(null); // null | { preset }
  const [tabCode, setTabCode] = useState(() => { try { return localStorage.getItem('dep_ct_tab') || ''; } catch (e) { return ''; } });
  const pickTab = (code) => { setTabCode(code); try { localStorage.setItem('dep_ct_tab', code); } catch (e) {} };
  window.useBreadcrumb([{ label: 'เปิดเคาน์เตอร์', current: true }], []);
  const [, setTick] = useState(0);
  const bump = () => { setSessions(depCtLoadAll()); setTick(x => x + 1); };

  const isMine = (s) => !!s && (s.tellerId ? s.tellerId === me.id : s.teller === me.name);
  // เรียงตามลำดับที่เปิด — เครื่องที่เปิดใหม่จะแสดงต่อจากด้านล่าง
  const mine = DEP_COUNTERS.filter(c => isMine(sessions[c.code]))
    .sort((a, b) => String(sessions[a.code].openedAt).localeCompare(String(sessions[b.code].openedAt)));
  const freeCount = DEP_COUNTERS.filter(c => !sessions[c.code]).length;

  const confirm = (d) => {
    const t = depCtNow();
    const s = { ...d, status: 'open', openedAt: t.iso, openedDate: t.date, openedTime: t.time };
    const next = { ...sessions, [d.counter]: s };
    depCtSaveAll(next); setSessions(next); setModal(null);
    window.depSuccess({ title: 'เปิดเคาน์เตอร์เรียบร้อยแล้ว', desc: 'เปิดเคาน์เตอร์ “' + s.code + '” แล้ว', next: 'กด “ขอเบิกเงิน” เพื่อให้หัวหน้าอนุมัติเงินตั้งต้น แล้วยืนยันรับเงินก่อนเริ่มทำรายการฝาก/ถอน' });
  };

  return (
    <div data-screen-label="เปิดเคาน์เตอร์">
      <div className="page-actions">
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปิดเคาน์เตอร์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เปิดเคาน์เตอร์ ขอเบิกเงินจากหัวหน้า ยืม/คืนเงิน และดูยอดเงินสดในเครื่อง — แสดงเฉพาะเครื่องที่คุณเปิด
          </div>
        </div>
        <span className="spacer" />
        <span className="chip primary">เครื่องที่คุณเปิด {mine.length} เครื่อง</span>
        <button className="btn primary" onClick={() => setModal({ preset: '' })} disabled={freeCount === 0}>
          <Icon name="wallet" /> เปิดเคาน์เตอร์
        </button>
      </div>

      {mine.length === 0 ? (
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><h3>เคาน์เตอร์ที่คุณเปิด</h3></div>
          <div className="muted" style={{ padding: '32px 4px', textAlign: 'center', fontSize: 13 }}>
            คุณยังไม่ได้เปิดเคาน์เตอร์ — กดปุ่ม “เปิดเคาน์เตอร์” แล้วขอเบิกเงินตั้งต้นจากหัวหน้า
          </div>
        </div>
      ) : (() => {
        const cur = mine.find(c => c.code === tabCode) || mine[mine.length - 1];
        const s = sessions[cur.code];
        const pendingOf = (code) => {
          const ss = sessions[code];
          const v = (window.depCtVaultLoad() || []).filter(x => x.counter === code && x.session === ss.openedAt && x.status === 'approved').length;
          const l = (window.depCtLoansLoad() || []).filter(x => x.status === 'pending' && ((x.kind === 'borrow' && x.from === code) || (x.kind === 'return' && x.to === code))).length;
          return v + l;
        };
        return (
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)' }}>
            {mine.length > 1 && (
              <div className="ct-view" role="tablist" aria-label="มุมมองเคาน์เตอร์">
                <span className="ct-view-l">ดูเคาน์เตอร์</span>
                {mine.map(c => (
                  <button key={c.code} role="tab" aria-selected={c.code === cur.code}
                          className={'btn sm' + (c.code === cur.code ? ' primary' : '')} onClick={() => pickTab(c.code)}>
                    <span className="mono">{sessions[c.code].code}</span> · {c.name}
                    {pendingOf(c.code) > 0 && <span className="ct-tab-dot" title="มีรายการรอคุณยืนยัน" />}
                  </button>
                ))}
              </div>
            )}

            <div className="search-card ct-cash">
              <div className="ct-cash-head">
                <div style={{ minWidth: 0 }}>
                  <div className="ct-cash-name">{cur.name} <span className="mono muted">· {s.code}</span></div>
                    </div>
                {s.cashVerified ? <span className="pill ok">พร้อมทำรายการ</span> : <span className="pill warn">รอเบิกเงิน</span>}
              </div>
              {(() => {
                const n = depCtNum;
                const V = (depCtVaultLoad() || []).filter(x => x.status === 'done' && x.counter === s.counter && x.session === s.openedAt);
                const Ln = (depCtLoansLoad() || []).filter(x => x.status === 'done');
                const amt = (x) => n(x.approvedAmount != null ? x.approvedAmount : x.amount);
                const inn = V.filter(x => x.kind === 'withdraw').reduce((a, x) => a + amt(x), 0)
                          + Ln.filter(x => x.to === s.counter && x.sessionTo === s.openedAt).reduce((a, x) => a + n(x.amount), 0);
                const out = V.filter(x => x.kind === 'return').reduce((a, x) => a + amt(x), 0)
                          + Ln.filter(x => x.from === s.counter && x.sessionFrom === s.openedAt).reduce((a, x) => a + n(x.amount), 0);
                return (
                  <div className="ct-sum">
                    <div><span>เงินตั้งต้นในเครื่อง</span><b className="mono">{fmt.money(depCtIssued(s), 2)}</b></div>
                    <div><span>เบิก / ยืมเข้า</span><b className="mono pos">+{fmt.money(inn, 2)}</b></div>
                    <div><span>คืน / ให้ยืมออก</span><b className="mono neg">−{fmt.money(out, 2)}</b></div>
                    <div className="main"><span>เงินในเครื่องเหลือ</span><b className="mono">{fmt.money(depCtCashNow(s), 2)}</b></div>
                  </div>
                );
              })()}
              {!s.cashVerified && (() => {
                const wr = (depCtVaultLoad() || []).filter(x => x.kind === 'withdraw' && x.counter === s.counter && x.session === s.openedAt)
                  .sort((a, b) => String(b.reqAt || '').localeCompare(String(a.reqAt || '')));
                const last = wr[0];
                if (last && last.status === 'pending') return (
                  <div className="sr-warn" style={{ marginTop: 12, marginBottom: 0 }}>
                    <Icon name="clock-circle" size={14} /> ส่งคำขอเบิกเงิน {fmt.money(last.amount, 2)} บาท แล้ว — รอหัวหน้าการเงินอนุมัติ · ระหว่างนี้ยังทำรายการใดในเคาน์เตอร์ไม่ได้
                  </div>);
                if (last && last.status === 'approved') return (
                  <div className="sr-warn" style={{ marginTop: 12, marginBottom: 0 }}>
                    <Icon name="info" size={14} /> หัวหน้าอนุมัติแล้ว — นับเงินและกด “ยืนยันรับเงิน” เพื่อเริ่มทำรายการ
                  </div>);
                if (last && last.status === 'rejected') return (
                  <div className="sr-warn" style={{ marginTop: 12, marginBottom: 0, background: 'var(--danger-50)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
                    <Icon name="close-circle" size={14} /> หัวหน้าไม่อนุมัติคำขอเบิกเงิน{last.rejectReason ? ' — เหตุผล: ' + last.rejectReason : ''} · เคาน์เตอร์นี้ยังทำรายการไม่ได้ จนกว่าจะขอเบิกใหม่และได้รับอนุมัติ
                  </div>);
                return (
                  <div className="sr-warn" style={{ marginTop: 12, marginBottom: 0 }}>
                    <Icon name="info" size={14} /> ยังไม่มีเงินในเครื่องนี้ — กด “ขอเบิกเงิน” ให้หัวหน้าการเงินอนุมัติ แล้วนับเงินและกด “ยืนยันรับเงิน” จึงจะทำรายการได้
                  </div>);
              })()}
            </div>

            {<CtCashActions key={cur.code} s={s} ready={!!s.cashVerified} sessions={sessions} me={me} onToast={onToast} onChange={bump} />}
          </div>
        );
      })()}


      {modal && (
        <DepCounterOpenModal taken={sessions} preset={modal.preset}
                             onClose={() => setModal(null)} onConfirm={confirm} />
      )}
    </div>
  );
}

// ─── หน้า ปิดเคาน์เตอร์ ───────────────────────────────────────────
function DepCounterClosePage({ onToast }) {
  const me = depCtMe();
  const isMine = (x) => !!x && (x.tellerId ? x.tellerId === me.id : x.teller === me.name);
  const [sessions, setSessions] = useState(() => depCtLoadAll());
  const [logAll, setLog] = useState(() => depCtLogLoad());
  const log = logAll.filter(isMine);
  const openList = DEP_COUNTERS.filter(c => isMine(sessions[c.code]))
    .sort((a, b) => String(sessions[a.code].openedAt).localeCompare(String(sessions[b.code].openedAt)));
  const [pick, setPick] = useState(() => (openList[0] ? openList[0].code : ''));
  const [counts, setCounts] = useState({});
  const [cashIn, setCashIn] = useState('');
  const [cashOut, setCashOut] = useState('');
  const [note, setNote] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const [rcvBy, setRcvBy] = useState('');
  const [rcvPin, setRcvPin] = useState('');
  const [rcvErr, setRcvErr] = useState('');
  window.useBreadcrumb([{ label: 'ปิดเคาน์เตอร์', current: true }], []);

  const cur = sessions[pick] || null;
  const counted = useMemo(
    () => DEP_CASH_DENOMS.reduce((s, d) => s + d.v * (parseInt(counts[d.v], 10) || 0), 0),
    [counts]);
  const opening = cur ? cur.opening : 0;
  const topupSum = cur ? depCtIssued(cur) - depCtNum(cur.opening) : 0;
  const loanNet = cur ? depCtLoanNet(cur) : 0;
  const vaultNet = cur ? depCtVaultNet(cur) : 0;
  const expected = opening + topupSum + loanNet + vaultNet + depCtNum(cashIn) - depCtNum(cashOut);
  const chqRows = cur ? depCtChqOf(cur) : [];
  const chqIn = chqRows.filter(x => x.dir === 'in').reduce((a, x) => a + depCtNum(x.amount), 0);
  const chqOut = chqRows.filter(x => x.dir === 'out').reduce((a, x) => a + depCtNum(x.amount), 0);
  const diff = counted - expected;
  const balanced = Math.abs(diff) < 0.005;

  const selectCounter = (code) => {
    setPick(code); setCounts({}); setCashIn(''); setCashOut(''); setNote('');
  };

  const doClose = () => {
    const sv = { name: cur.supervisor || 'หัวหน้าการเงิน', role: cur.supervisorRole || 'หัวหน้าการเงิน' };
    const t = depCtNow();
    const rec = { counter: cur.counter, code: cur.code, name: depCtName(cur.counter),
                  tellerId: cur.tellerId, teller: cur.teller, tellerRole: cur.tellerRole,
                  supervisor: cur.supervisor, supervisorRole: cur.supervisorRole,
                  returnedTo: sv.name, returnedToRole: sv.role, returnedAmount: counted,
                  openedDate: cur.openedDate, openedTime: cur.openedTime,
                  closedAt: t.iso, closedDate: t.date, closedTime: t.time,
                  opening: opening, topups: topupSum, loanNet: loanNet, vaultNet: vaultNet, cashIn: depCtNum(cashIn), cashOut: depCtNum(cashOut),
                  expected: expected, counted: counted, diff: diff, note: note,
                  chqCount: chqRows.length, chqIn: chqIn, chqOut: chqOut };
    const nextLog = [...logAll, rec];
    depCtLogSave(nextLog); setLog(nextLog);

    const next = { ...sessions };
    delete next[cur.counter];
    depCtSaveAll(next); setSessions(next); setConfirmClose(false); setRcvBy(''); setRcvPin(''); setRcvErr('');
    const rest = DEP_COUNTERS.filter(c => isMine(next[c.code]));
    selectCounter(rest[0] ? rest[0].code : '');
    window.depSuccess({ title: 'ปิดเคาน์เตอร์เรียบร้อยแล้ว', desc: 'ปิดเคาน์เตอร์ “' + cur.code + '” ส่งคืนเงิน ' + fmt.money(counted, 2) + ' บาท ให้ ' + sv.name });
  };

  const closedLogCard = (
    <div className="search-card" style={{ marginTop: 12 }}>
      <div className="section-head" style={{ marginBottom: 12 }}>
        <h3>รายการปิดเคาน์เตอร์</h3>
        <div className="head-actions">
          <span className="chip primary">คุณปิดแล้ว {log.length} เครื่อง</span>
        </div>
      </div>
      {log.length === 0 ? (
        <div className="muted" style={{ padding: '24px 4px', textAlign: 'center', fontSize: 13 }}>
          คุณยังไม่มีรายการปิดเคาน์เตอร์
        </div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 84 }}>รหัส</th>
              <th>เคาน์เตอร์</th>
              <th style={{ width: 118 }}>ปิดเมื่อ</th>
              <th style={{ width: 140, textAlign: 'right' }}>นับได้จริง</th>
            </tr>
          </thead>
          <tbody>
            {log.slice().reverse().map((r, i) => {
              return (
                <tr key={r.closedAt + '-' + i}>
                  <td className="mono">{r.code}</td>
                  <td>{r.name}</td>
                  <td>{r.closedDate + ' ' + r.closedTime + ' น.'}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmt.money(r.counted, 2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  if (!cur) {
    return (
      <div data-screen-label="ปิดเคาน์เตอร์">
        <div className="page-actions">
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปิดเคาน์เตอร์</h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>นับเงินในเครื่องเพื่อกระทบยอดกับเงินตั้งต้น แล้วปิดเคาน์เตอร์ / ปิดวัน</div>
          </div>
        </div>
        <div className="search-card">
          <div className="muted" style={{ padding: '36px 4px', textAlign: 'center', fontSize: 13 }}>
            คุณไม่มีเคาน์เตอร์ที่เปิดอยู่ — เปิดเคาน์เตอร์ที่เมนู <b>เปิดเคาน์เตอร์</b> ก่อน
          </div>
        </div>
        {closedLogCard}
      </div>
    );
  }

  const io = depCtInOut(cur);
  return (
    <div data-screen-label="ปิดเคาน์เตอร์">
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
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปิดเคาน์เตอร์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            นับเงินในเครื่องของคุณ กระทบยอดกับยอดที่ควรมี แล้วส่งคืนเงินทั้งหมดให้หัวหน้าก่อนปิดเคาน์เตอร์
          </div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" onClick={() => setConfirmClose(true)}>
          <Icon name="check" /> ปิดเคาน์เตอร์ / ปิดวัน
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(0, 1fr)', marginBottom: 12 }}>
        {openList.length > 1 && (
          <div className="ct-view" role="tablist" aria-label="มุมมองเคาน์เตอร์">
            <span className="ct-view-l">ดูเคาน์เตอร์</span>
            {openList.map(c => (
              <button key={c.code} role="tab" aria-selected={c.code === pick}
                      className={'btn sm' + (c.code === pick ? ' primary' : '')} onClick={() => selectCounter(c.code)}>
                <span className="mono">{sessions[c.code] ? sessions[c.code].code : c.code}</span> · {c.name}
              </button>
            ))}
          </div>
        )}
        <div className="search-card ct-cash">
          <div className="ct-cash-head">
            <div style={{ minWidth: 0 }}>
              <div className="ct-cash-name">{depCtName(cur.counter)} <span className="mono muted">· {cur.code}</span></div>
            </div>
            <span className="pill warn">รอปิดเคาน์เตอร์</span>
          </div>
          <div className="ct-sum">
            <div><span>เงินตั้งต้นในเครื่อง</span><b className="mono">{fmt.money(depCtIssued(cur), 2)}</b></div>
            <div><span>เบิก / ยืมเข้า</span><b className="mono pos">+{fmt.money(io.inn, 2)}</b></div>
            <div><span>คืน / ให้ยืมออก</span><b className="mono neg">−{fmt.money(io.out, 2)}</b></div>
            <div className="main"><span>เงินในเครื่องที่ควรมี</span><b className="mono">{fmt.money(expected, 2)}</b></div>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><h3>นับเงินในเครื่อง</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {[DEP_CASH_DENOMS.slice(0, 6), DEP_CASH_DENOMS.slice(6)].map((grp, gi) => (
            <table className="tbl" key={gi}>
              <thead>
                <tr>
                  <th>ชนิดธนบัตร / เหรียญ</th>
                  <th style={{ width: 170, textAlign: 'right' }}>จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {grp.map(d => (
                  <tr key={d.v}>
                    <td>{d.l}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <input className="cfg-input sm num-input" style={{ width: 96, flex: '0 0 96px' }}
                               inputMode="numeric" value={counts[d.v] == null ? '' : counts[d.v]}
                               placeholder="0"
                               onChange={(e) => setCounts({ ...counts, [d.v]: e.target.value.replace(/[^0-9]/g, '') })} />
                        <span className="muted" style={{ fontSize: 11, width: 34, textAlign: 'left' }}>{d.u}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14,
                      marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600 }}>รวมเงินสดที่นับได้</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary-700)' }}>{fmt.money(counted, 2)}</span>
          <span className="muted" style={{ fontSize: 12 }}>บาท</span>
        </div>
      </div>

      {chqRows.length > 0 && (
        <div className="search-card" style={{ marginBottom: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <h3>เช็คที่รับ / จ่ายในรอบนี้</h3>
            <div className="head-actions"><span className="muted" style={{ fontSize: 12 }}>ไม่นับรวมเงินสดในเครื่อง</span></div>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 280 }}>
            <table className="tbl">
              <thead><tr>
                <th>เวลา</th><th>รายการ</th><th>เลขที่บัญชี</th><th>เลขที่เช็ค</th><th>ธนาคาร</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
              </tr></thead>
              <tbody>
                {chqRows.map((x, i) => (
                  <tr key={i}>
                    <td className="mono">{x.time} น.</td>
                    <td><span className={'pill ' + (x.dir === 'in' ? 'ok' : 'bad')}>{x.dir === 'in' ? 'รับเช็ค' : 'จ่ายเช็ค'}</span></td>
                    <td className="mono">{x.accNo}</td>
                    <td className="mono">{x.chqNo || '—'}</td>
                    <td>{x.bank}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmt.money(x.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 12, fontSize: 13 }}>
            {chqIn > 0 && <span>รับเช็ค <b className="mono" style={{ color: 'var(--brand, #237450)' }}>{fmt.money(chqIn, 2)}</b> บาท</span>}
            {chqOut > 0 && <span>จ่ายเช็ค <b className="mono" style={{ color: '#cf1322' }}>{fmt.money(chqOut, 2)}</b> บาท</span>}
            <span className="muted">{chqRows.length} ฉบับ</span>
          </div>
        </div>
      )}

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><h3>กระทบยอด</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', columnGap: 24 }}>
          <DepCtRow label="เงินตั้งต้นในเครื่อง">
            <div className="cfg-display-box mono">{fmt.money(opening, 2)}</div>
          </DepCtRow>
          {topupSum !== 0 && (
            <DepCtRow label="รับเงินเพิ่มระหว่างวัน">
              <div className="cfg-display-box mono">{fmt.money(topupSum, 2)}</div>
            </DepCtRow>
          )}
          {vaultNet !== 0 && (
            <DepCtRow label="เบิก/คืนเงินกับหัวหน้า (สุทธิ)">
              <div className="cfg-display-box mono">{(vaultNet > 0 ? '+' : '') + fmt.money(vaultNet, 2)}</div>
            </DepCtRow>
          )}
          {loanNet !== 0 && (
            <DepCtRow label="ยืม/คืนระหว่างเคาน์เตอร์ (สุทธิ)">
              <div className="cfg-display-box mono">{(loanNet > 0 ? '+' : '') + fmt.money(loanNet, 2)}</div>
            </DepCtRow>
          )}
          <DepCtRow label="นับได้จริง">
            <div className="cfg-display-box mono strong">{fmt.money(counted, 2)}</div>
          </DepCtRow>
        </div>

        <div>
          <label className="cfg-label" style={{ display: 'block', marginBottom: 6 }}>หมายเหตุ</label>
          <div>
            <textarea className="cfg-input" style={{ width: '100%' }} rows={3} value={note} placeholder="ระบุสาเหตุกรณียอดไม่ตรง"
                      onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
      </div>


      {closedLogCard}

      {confirmClose && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirmClose(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 480, maxWidth: '94vw' }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={balanced ? null : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
                <Icon name={balanced ? 'check' : 'info'} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2>ยืนยันปิดเคาน์เตอร์ / ปิดวัน</h2>
                <div className="muted" style={{ fontSize: 12 }}>เคาน์เตอร์ <span className="mono">{cur.code}</span></div>
              </div>
              <button className="close-btn" onClick={() => setConfirmClose(false)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <DepCtKv label="ยอดที่ควรมีในเครื่อง" value={fmt.money(expected, 2) + ' บาท'} mono />
              <DepCtKv label="นับได้จริง" value={fmt.money(counted, 2) + ' บาท'} mono />
              <DepCtKv label="ผลต่าง" value={(diff > 0 ? '+' : '') + fmt.money(diff, 2) + ' บาท'} mono />
              <div style={{ marginTop: 14 }}>
                {rcvErr && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {rcvErr}</div>}
              </div>
              {!balanced && (
                <div className="ct-warnbox" style={{ marginTop: 12 }}>
                  <Icon name="info" size={14} />
                  <span>ยอดเงินในเครื่องไม่ตรงกับยอดที่ควรมี การปิดวันจะถูกบันทึกพร้อมผลต่างและหมายเหตุ</span>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn sm" onClick={() => setConfirmClose(false)}>ยกเลิก</button>
              <button className="btn primary sm" onClick={doClose}><Icon name="check" /> ยืนยันปิดวัน</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// เงื่อนไขรายการเงินสด — ต้องมีเคาน์เตอร์ของผู้ใช้ที่ตรวจรับเงินแล้ว
function depCtCashReady() { try { return depCtReadyCounters().length > 0; } catch (e) { return false; } }
function DepCtGateBanner({ what }) {
  return (
    <div className="sr-warn" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
      <Icon name="info" size={14} />
      <span style={{ flex: '1 1 320px', minWidth: 0 }}>
        {what || 'การทำรายการ'}ต้องทำผ่านเคาน์เตอร์ที่หัวหน้าการเงินอนุมัติเบิกเงินแล้ว — กรุณาเปิดเคาน์เตอร์ ขอเบิกเงิน รอหัวหน้าอนุมัติ และยืนยันรับเงินก่อนทำรายการ
      </span>
      <button className="btn sm" onClick={() => { window.location.hash = '#deposit/counter-open'; }}>ไปหน้าเปิดเคาน์เตอร์</button>
    </div>
  );
}


// ─── เคาน์เตอร์ของฉัน — ตารางรวมเบิก/คืน/ยืม + ปุ่มทำรายการชุดเดียว ─────
function depCtInOut(s) {
  if (!s) return { inn: 0, out: 0 };
  const n = depCtNum, amt = (x) => n(x.approvedAmount != null ? x.approvedAmount : x.amount);
  const V = (depCtVaultLoad() || []).filter(x => x.status === 'done' && x.counter === s.counter && x.session === s.openedAt);
  const Ln = (depCtLoansLoad() || []).filter(x => x.status === 'done');
  return {
    inn: V.filter(x => x.kind === 'withdraw').reduce((a, x) => a + amt(x), 0) + Ln.filter(x => x.to === s.counter && x.sessionTo === s.openedAt).reduce((a, x) => a + n(x.amount), 0),
    out: V.filter(x => x.kind === 'return').reduce((a, x) => a + amt(x), 0) + Ln.filter(x => x.from === s.counter && x.sessionFrom === s.openedAt).reduce((a, x) => a + n(x.amount), 0),
  };
}
const CT_V_ST = { pending: ['warn', 'รอหัวหน้าอนุมัติ'], approved: ['info', 'หัวหน้าอนุมัติแล้ว'], done: ['ok', 'เสร็จสิ้น'], rejected: ['bad', 'ถูกปฏิเสธ'], cancelled: ['', 'ยกเลิก'] };
function CtAmtModal({ mode, s, others, owed, cashNow, onClose, onSubmit }) {
  const [target, setTarget] = useState(mode === 'return' ? 'finance' : (others[0] ? others[0].counter : ''));
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const amt = depCtNum(amount);
  const title = mode === 'withdraw' ? 'ขอเบิกเงินจากหัวหน้า' : mode === 'borrow' ? 'ยืมเงินระหว่างเคาน์เตอร์' : 'คืนเงิน';
  const submit = () => {
    if (!(amt > 0)) return setErr('กรุณาระบุจำนวนเงินมากกว่า 0');
    if (mode !== 'withdraw' && !target) return setErr('กรุณาเลือกปลายทาง');
    if (mode === 'return' && amt > cashNow + 0.005) return setErr('เงินในเครื่องไม่พอสำหรับยอดคืนนี้');
    onSubmit({ target, amount: amt, note: note.trim() });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="money" /></div>
          <div style={{ minWidth: 0 }}><h2>{title}</h2>
            <div className="muted" style={{ fontSize: 12 }}>{s.code} · เงินในเครื่อง {fmt.money(cashNow, 2)} บาท</div></div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          {mode !== 'withdraw' && (
            <DepCtRow label={mode === 'borrow' ? 'ยืมจากเคาน์เตอร์' : 'คืนให้'} required>
              <select className="cfg-input" value={target} onChange={(e) => { setTarget(e.target.value); setErr(''); }}>
                {mode === 'borrow' && others.length === 0 && <option value="">— ไม่มีเคาน์เตอร์อื่นที่เปิดอยู่ —</option>}
                {mode === 'return' && <option value="finance">หัวหน้า (คืนเงินที่เกินในเครื่อง)</option>}
                {others.map(x => <option key={x.counter} value={x.counter}>
                  {x.code} · {depCtName(x.counter)}{mode === 'return' && owed(x) > 0 ? ' — ค้างคืน ' + fmt.money(owed(x), 2) : ''}</option>)}
              </select>
            </DepCtRow>
          )}
          <DepCtRow label="จำนวนเงิน (บาท)" required>
            <input className="cfg-input mono right" inputMode="decimal" value={amount} placeholder="0.00"
                   onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, '')); setErr(''); }} />
          </DepCtRow>
          <DepCtRow label="หมายเหตุ">
            <input className="cfg-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)" />
          </DepCtRow>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}><Icon name="check" /> ส่งคำขอ</button>
        </div>
      </div>
    </>
  );
}
function CtCashActions({ s, ready = true, sessions, me, onToast, onChange }) {
  const [vl, setVl] = useState(() => depCtVaultLoad());
  const [ln, setLn] = useState(() => depCtLoansLoad());
  const [modal, setModal] = useState(null);
  const [flt, setFlt] = useState('all');
  React.useEffect(() => {
    const sync = () => { setVl(depCtVaultLoad()); setLn(depCtLoansLoad()); onChange && onChange(); };
    window.addEventListener('storage', sync); const t = setInterval(sync, 4000);
    return () => { window.removeEventListener('storage', sync); clearInterval(t); };
  }, []);
  // บันทึกแล้วอัปเดตการ์ดยอดเงินด้านบนทันที
  const saveV = (n) => { depCtVaultSave(n); setVl(n); onChange && onChange(); };
  const saveL = (n) => { depCtLoansSave(n); setLn(n); onChange && onChange(); };
  const ok = (title, desc) => window.depSuccess ? window.depSuccess({ title, desc }) : (onToast && onToast(desc));
  const cashNow = depCtCashNow(s);
  const others = DEP_COUNTERS.map(c => sessions[c.code]).filter(x => x && x.status === 'open' && x.cashVerified && x.counter !== s.counter);
  const owed = (x) => ln.filter(l => l.status === 'done' && l.kind === 'borrow' && l.from === x.counter && l.to === s.counter && l.sessionTo === s.openedAt).reduce((a, l) => a + depCtNum(l.amount), 0)
                    - ln.filter(l => l.status === 'done' && l.kind === 'return' && l.from === s.counter && l.to === x.counter && l.sessionFrom === s.openedAt).reduce((a, l) => a + depCtNum(l.amount), 0);
  const codeOf = (c) => (sessions[c] && sessions[c].code) || c;
  const t = () => depCtNow();

  const submit = ({ target, amount, note }) => {
    const n = t();
    if (modal === 'withdraw' || (modal === 'return' && target === 'finance')) {
      const kind = modal === 'withdraw' ? 'withdraw' : 'return';
      saveV([...vl, { id: 'VR' + String(Date.now()).slice(-8), kind, counter: s.counter, session: s.openedAt, amount, note, status: 'pending',
                     requestedBy: me.name, reqAt: n.iso, reqDate: n.date, reqTime: n.time }]);
      setModal(null); ok('ส่งคำขอเรียบร้อยแล้ว', (kind === 'withdraw' ? 'ขอเบิกเงิน ' : 'คืนเงิน ') + fmt.money(amount, 2) + ' บาท — รอหัวหน้าอนุมัติ');
    } else {
      const o2 = sessions[target]; const borrow = modal === 'borrow';
      saveL([...ln, { id: 'LN' + Date.now(), kind: borrow ? 'borrow' : 'return', status: 'pending', amount, note,
                     from: borrow ? o2.counter : s.counter, to: borrow ? s.counter : o2.counter,
                     sessionFrom: borrow ? o2.openedAt : s.openedAt, sessionTo: borrow ? s.openedAt : o2.openedAt,
                     requestedBy: me.name, requestedAt: n.iso, reqDate: n.date, reqTime: n.time }]);
      setModal(null); ok('ส่งคำขอเรียบร้อยแล้ว', (borrow ? 'ขอยืม ' : 'คืนเงิน ') + fmt.money(amount, 2) + ' บาท — รอ ' + o2.code + ' ยืนยัน');
    }
  };
  const vPatch = (id, p) => saveV(vl.map(x => x.id === id ? { ...x, ...p } : x));
  const lPatch = (id, p) => saveL(ln.map(x => x.id === id ? { ...x, ...p } : x));
  const vAmt = (x) => depCtNum(x.approvedAmount != null ? x.approvedAmount : x.amount);

  const rows = [];
  vl.filter(x => x.counter === s.counter && x.session === s.openedAt).forEach(x => {
    const st = CT_V_ST[x.status] || ['', x.status]; const acts = [];
    if (x.status === 'pending') acts.push(['ยกเลิก', '', () => vPatch(x.id, { status: 'cancelled' })]);
    if (x.status === 'approved') acts.push([x.kind === 'withdraw' ? 'ยืนยันรับเงิน' : 'ยืนยันส่งเงิน', 'primary', () => {
      if (x.kind === 'return' && vAmt(x) > cashNow + 0.005) return onToast && onToast('เงินในเครื่องไม่พอสำหรับยอดคืนนี้');
      const n = t(); vPatch(x.id, { status: 'done', doneBy: me.name, doneDate: n.date, doneTime: n.time });
      if (x.kind === 'withdraw' && !s.cashVerified) {
        const all = depCtLoadAll(), cs = all[s.counter];
        if (cs && cs.openedAt === s.openedAt) {
          all[s.counter] = { ...cs, cashVerified: true, verifiedAmount: vAmt(x), verifiedAt: n.iso, verifiedDate: n.date, verifiedTime: n.time,
                             verifiedBy: me.name, verifiedByRole: me.role, supervisor: x.approvedBy || cs.supervisor };
          depCtSaveAll(all);
          window.depSuccess && window.depSuccess({ title: 'รับเงินเข้าเคาน์เตอร์เรียบร้อยแล้ว', desc: 'เคาน์เตอร์ “' + s.code + '” พร้อมทำรายการฝาก/ถอน' });
        }
      }
      onChange && onChange();
    }]);
    const adj = x.approvedAmount != null && Math.abs(depCtNum(x.approvedAmount) - depCtNum(x.amount)) > 0.005;
    rows.push({ id: x.id, at: x.reqAt || '', time: x.reqTime, type: x.kind === 'withdraw' ? 'ขอเบิกเงิน' : 'คืนหัวหน้า', with: 'หัวหน้า',
                amount: vAmt(x), dir: x.kind === 'withdraw' ? 1 : -1, status: x.status,
                sub: adj ? 'ขอ ' + fmt.money(x.amount, 2) + ' · อนุมัติ ' + fmt.money(x.approvedAmount, 2) : '',
                by: x.requestedBy, cf: x.doneBy || x.approvedBy || '', note: [x.note, x.finNote && ('หัวหน้า: ' + x.finNote), x.rejectReason && ('เหตุผล: ' + x.rejectReason)].filter(Boolean).join(' · '),
                pill: st[0], label: st[1], acts, mine: x.status === 'approved', off: x.status === 'rejected' || x.status === 'cancelled' });
  });
  ln.filter(x => (x.to === s.counter && x.sessionTo === s.openedAt) || (x.from === s.counter && x.sessionFrom === s.openedAt)).forEach(x => {
    const iRecv = x.to === s.counter; const other = iRecv ? x.from : x.to; const acts = [];
    const approverIsMe = x.kind === 'borrow' ? x.from === s.counter : x.to === s.counter;
    let type = x.kind === 'borrow' ? (iRecv ? 'ยืม' : 'ให้ยืม') : (iRecv ? 'รับคืน' : 'คืนเงินยืม');
    let pill = '', label = '';
    if (x.status === 'pending') {
      pill = approverIsMe ? 'warn' : 'info'; label = approverIsMe ? 'รอคุณยืนยัน' : 'รอ ' + codeOf(other) + ' ยืนยัน';
      if (approverIsMe) {
        acts.push([x.kind === 'borrow' ? 'ยืนยันจ่าย' : 'ยืนยันรับ', 'primary', () => {
          if (x.kind === 'borrow' && depCtNum(x.amount) > cashNow + 0.005) return onToast && onToast('เงินในเครื่องไม่พอสำหรับรายการนี้');
          const n = t(); lPatch(x.id, { status: 'done', confirmedBy: me.name, confirmedAt: n.iso, cfDate: n.date, cfTime: n.time });
        }]);
        acts.push(['ปฏิเสธ', '', () => { const n = t(); lPatch(x.id, { status: 'rejected', closedBy: me.name, closedAt: n.iso }); }]);
      } else acts.push(['ยกเลิก', '', () => { const n = t(); lPatch(x.id, { status: 'cancelled', closedBy: me.name, closedAt: n.iso }); }]);
    } else { const st = CT_V_ST[x.status] || ['', x.status]; pill = st[0]; label = st[1]; }
    rows.push({ id: x.id, at: x.requestedAt || '', time: x.reqTime, type, with: codeOf(other), amount: depCtNum(x.amount), dir: iRecv ? 1 : -1, status: x.status,
                sub: '', by: x.requestedBy, cf: x.confirmedBy || '', note: x.note || '', pill, label, acts,
                mine: x.status === 'pending' && approverIsMe, off: x.status === 'rejected' || x.status === 'cancelled' });
  });
  rows.sort((a, b) => (b.mine - a.mine) || String(b.at).localeCompare(String(a.at)));
  const isOpen = (r) => r.status === 'pending' || r.status === 'approved';
  const shown = rows.filter(r => flt === 'all' || (flt === 'open' ? isOpen(r) : r.status === 'done'));
  const doneIn = rows.filter(r => r.status === 'done' && r.dir > 0).reduce((a, r) => a + r.amount, 0);
  const doneOut = rows.filter(r => r.status === 'done' && r.dir < 0).reduce((a, r) => a + r.amount, 0);
  const cnt = { all: rows.length, open: rows.filter(isOpen).length, done: rows.filter(r => r.status === 'done').length };

  return (
    <div className="search-card dat-section">
      <div className="dat-section-head is-bar"><span className="head-bar" />
        <div><div className="dat-section-title">ทำรายการเงินสดของเคาน์เตอร์</div></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {ready && <button className="btn sm ct-btn-return" onClick={() => setModal('return')}><Icon name="upload" size={13} /> คืนเงิน</button>}
          {ready && <button className="btn sm ct-btn-borrow" disabled={others.length === 0} title={others.length ? '' : 'ไม่มีเคาน์เตอร์อื่นที่เปิดอยู่'} onClick={() => setModal('borrow')}>
            <Icon name="swap" size={13} /> ยืมเงินระหว่างเคาน์เตอร์</button>}
          <button className="btn sm ct-btn-withdraw" onClick={() => setModal('withdraw')}><Icon name="download" size={13} /> ขอเบิกเงิน</button>
        </div>
      </div>
      <div className="ct-flt" role="tablist">
        {[['all', 'ทั้งหมด'], ['open', 'รอดำเนินการ'], ['done', 'เสร็จสิ้น']].map(([k, l]) => (
          <button key={k} role="tab" aria-selected={flt === k} className={'ct-flt-b' + (flt === k ? ' active' : '')} onClick={() => setFlt(k)}>
            {l} <span className="ct-flt-n">{cnt[k]}</span>
          </button>
        ))}
      </div>
      <div className="table-wrap" style={{ margin: '8px 16px 16px' }}><div className="table-scroll">
        <table className="tbl" style={{ minWidth: 820 }}>
          <thead><tr>
            <th style={{ width: 70 }}>เวลา</th><th style={{ width: 110 }}>ประเภท</th><th style={{ width: 80 }}>กับ</th>
            <th className="right" style={{ width: 150 }}>เงินเข้า / ออก</th><th style={{ width: 140 }}>สถานะ</th>
            <th>ผู้ทำรายการ</th><th className="center" style={{ width: 170 }}>จัดการ</th>
          </tr></thead>
          <tbody>
            {shown.length === 0
              ? <tr><td colSpan="7" className="empty-state">{rows.length ? 'ไม่พบรายการ' : 'ยังไม่มีรายการวันนี้'}</td></tr>
              : shown.map(r => (
                <tr key={r.id} className={r.off ? 'dat-off' : undefined}>
                  <td className="mono">{r.time ? r.time + ' น.' : '—'}</td>
                  <td>{r.type}{r.note && <span className="ct-note" title={r.note}><Icon name="info" size={12} /></span>}</td>
                  <td className="mono">{r.with}</td>
                  <td className="right mono">
                    <b className={r.off ? '' : (r.dir > 0 ? 'ct-in' : 'ct-out')}>{r.dir > 0 ? '+' : '−'}{fmt.money(r.amount, 2)}</b>
                    {r.sub && <div className="ct-sub">{r.sub}</div>}
                  </td>
                  <td>{r.label ? <span className={'pill ' + r.pill}>{r.label}</span> : '—'}</td>
                  <td className="ct-by"><div>ขอ: {r.by || '—'}</div>{r.cf && <div>ยืนยัน: {r.cf}</div>}</td>
                  <td className="center">
                    {r.acts.length === 0 ? <span className="muted">—</span> : (
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {r.acts.map(([l, k, fn]) => <button key={l} className={'btn sm' + (k ? ' ' + k : '')} onClick={fn}>{l}</button>)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot><tr>
              <td colSpan="3" style={{ fontWeight: 600 }}>รวมรายการที่เสร็จสิ้น</td>
              <td className="right mono" colSpan="4">
                <b className="ct-in">รวมเข้า +{fmt.money(doneIn, 2)}</b>
                <span className="muted" style={{ margin: '0 8px' }}>·</span>
                <b className="ct-out">รวมออก −{fmt.money(doneOut, 2)}</b>
              </td>
            </tr></tfoot>
          )}
        </table>
      </div></div>
      {modal && <CtAmtModal mode={modal} s={s} others={others} owed={owed} cashNow={cashNow} onClose={() => setModal(null)} onSubmit={submit} />}
    </div>
  );
}

Object.assign(window, { depCtCashReady, DepCtGateBanner, depCtChqAdd, depCtChqLoad, depCtChqOf });
Object.assign(window, { DEP_COUNTERS, DEP_CASH_DENOMS, DepCounterOpenPage, DepCounterClosePage, depCtReadyCounters, depCtIssued,
  depCtLoadAll, depCtMe, depCtNow, depCtName, depCtNum, depCtWho, depCtLoansLoad, depCtLoansSave, depCtLoanNet, depCtVaultLoad, depCtVaultSave, depCtVaultNet, depCtCashNow, DepCtKv, DepCtRow });
