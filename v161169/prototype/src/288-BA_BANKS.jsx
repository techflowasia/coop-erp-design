// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › รายการธนาคาร (Bank Account Register)
//  ทะเบียนบัญชีธนาคารของสหกรณ์ + รายการเดินบัญชี (statement)
//  เลือกบัญชีจากรายการซ้าย → แก้ไขรายละเอียด / ดูรายการเคลื่อนไหว
// ════════════════════════════════════════════════════════════════════
const { useState: baUseState, useMemo: baUseMemo } = React;

const BA_BANKS = [
  { code: '006', name: 'ธ. กรุงไทย จำกัด (มหาชน)' },
  { code: '004', name: 'ธ. กสิกรไทย จำกัด (มหาชน)' },
  { code: '002', name: 'ธ. กรุงเทพ จำกัด (มหาชน)' },
  { code: '014', name: 'ธ. ไทยพาณิชย์ จำกัด (มหาชน)' },
  { code: '011', name: 'ธ. ทหารไทยธนชาต จำกัด (มหาชน)' },
  { code: '030', name: 'ธ. ออมสิน' },
  { code: '034', name: 'ธ.ก.ส.' },
];
const BA_TYPES = ['กระแสรายวัน', 'ออมทรัพย์', 'ประจำ 3 เดือน', 'ประจำ 12 เดือน'];
const BA_COA = [
  '110101 · เงินสด',
  '110111 · ธ.กรุงไทย — ออมทรัพย์',
  '110112 · ธ.ออมสิน — ออมทรัพย์',
  '110120 · เงินฝากธนาคาร–กระแสรายวัน',
  '110201 · ลูกหนี้เงินกู้ฉุกเฉิน',
  '110202 · ลูกหนี้เงินกู้สามัญ',
  '110203 · ลูกหนี้เงินกู้พิเศษ',
  '110300 · ดอกเบี้ยค้างรับ',
  '120101 · ที่ดิน',
  '120102 · อาคารสำนักงาน',
];
const baCoaLabel = (c) => c;

const baTxn = (rows) => rows.map((r, i) => ({ ...r, no: i + 1 }));

const BA_SEED = [
  {
    id: 'b1', bankCode: '006', branchCode: '0093', branch: 'สาขา ไปรษณีย์ไทย (กสท)',
    acctNo: '093-6-01847-2', acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด', type: 'กระแสรายวัน',
    passbook: '—', rate: 0, coa: '110120 · เงินฝากธนาคาร–กระแสรายวัน', status: 'ใช้งาน',
    bankBal: 8452310.55, coopBal: 8452310.55, lastTxn: 'โอนเงินกู้สามัญ 12 ราย', lastDate: '2569-07-28',
    note: 'บัญชีหลักสำหรับจ่ายเงินกู้และเช็ค',
    txns: baTxn([
      { date: '2569-07-28', desc: 'โอนเงินกู้สามัญ 12 ราย', amt: -3120000, bal: 8452310.55 },
      { date: '2569-07-27', desc: 'รับชำระหนี้หักหน้าซอง งวด 07/2569', amt: 4860500, bal: 11572310.55 },
      { date: '2569-07-25', desc: 'จ่ายเช็คเลขที่ 0034821 — ค่าสาธารณูปโภค', amt: -84200, bal: 6711810.55 },
      { date: '2569-07-22', desc: 'รับเงินฝากออมทรัพย์สมาชิก', amt: 1250000, bal: 6796010.55 },
      { date: '2569-07-18', desc: 'จ่ายเงินปันผล–เฉลี่ยคืน (รอบเพิ่มเติม)', amt: -940000, bal: 5546010.55 },
    ]),
  },
  {
    id: 'b2', bankCode: '004', branchCode: '0271', branch: 'สาขา ปากเกร็ด',
    acctNo: '271-1-05529-8', acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด', type: 'กระแสรายวัน',
    passbook: '—', rate: 0.125, coa: '110120 · เงินฝากธนาคาร–กระแสรายวัน', status: 'ใช้งาน',
    bankBal: 2140880.2, coopBal: 2138880.2, lastTxn: 'ค่าธรรมเนียมโอนเงิน', lastDate: '2569-07-26',
    note: 'ใช้รับเงินโอนจากต้นสังกัด',
    txns: baTxn([
      { date: '2569-07-26', desc: 'ค่าธรรมเนียมโอนเงิน', amt: -2000, bal: 2140880.20 },
      { date: '2569-07-24', desc: 'รับโอนเงินจากต้นสังกัด (กสท.)', amt: 1980000, bal: 2142880.20 },
      { date: '2569-07-15', desc: 'โอนเข้าบัญชีกรุงไทย', amt: -1500000, bal: 162880.20 },
    ]),
  },
  {
    id: 'b3', bankCode: '014', branchCode: '0455', branch: 'สาขา แจ้งวัฒนะ',
    acctNo: '455-2-33871-0', acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด (ออมทรัพย์)', type: 'ออมทรัพย์',
    passbook: '4552338710', rate: 0.55, coa: '110111 · ธ.กรุงไทย — ออมทรัพย์', status: 'ใช้งาน',
    bankBal: 15600000, coopBal: 15600000, lastTxn: 'ดอกเบี้ยรับ ครึ่งปี', lastDate: '2569-06-30',
    note: 'บัญชีสำรองสภาพคล่อง',
    txns: baTxn([
      { date: '2569-06-30', desc: 'ดอกเบี้ยรับ ครึ่งปี', amt: 42350, bal: 15600000.00 },
      { date: '2569-05-12', desc: 'โอนเข้าจากบัญชีกระแสฯ กรุงไทย', amt: 5000000, bal: 15557650.00 },
    ]),
  },
  {
    id: 'b4', bankCode: '030', branchCode: '0118', branch: 'สาขา หลักสี่',
    acctNo: '020-1-77410-6', acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด (ประจำ)', type: 'ประจำ 12 เดือน',
    passbook: '0201774106', rate: 1.85, coa: '110112 · ธ.ออมสิน — ออมทรัพย์', status: 'ใช้งาน',
    bankBal: 30000000, coopBal: 30000000, lastTxn: 'ฝากประจำครบกำหนด — ต่ออายุ', lastDate: '2569-04-01',
    note: 'ครบกำหนด 01/04/2570',
    txns: baTxn([
      { date: '2569-04-01', desc: 'ฝากประจำครบกำหนด — ต่ออายุ', amt: 0, bal: 30000000.00 },
    ]),
  },
  {
    id: 'b5', bankCode: '002', branchCode: '0210', branch: 'สาขา ศูนย์ราชการฯ',
    acctNo: '210-0-99215-4', acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด (สวัสดิการ)', type: 'ออมทรัพย์',
    passbook: '2100992154', rate: 0.45, coa: '110101 · เงินสด', status: 'ปิดบัญชี',
    bankBal: 0, coopBal: 0, lastTxn: 'ปิดบัญชี โอนยอดคงเหลือ', lastDate: '2568-12-20',
    note: 'ปิดบัญชีเมื่อ 20/12/2568',
    txns: baTxn([
      { date: '2568-12-20', desc: 'ปิดบัญชี โอนยอดคงเหลือ', amt: -318420.75, bal: 0 },
    ]),
  },
];

const BA_KEY = 'coop.bankAccounts.v1';
// คู่บัญชีต้องเป็นรายการในผังบัญชีเสมอ (รหัส · ชื่อ) — ค่าที่เก็บไว้เดิมจะถูกแปลงตามประเภทบัญชี
const baCoaFor = (a) => {
  if (BA_COA.includes(a.coa)) return a.coa;
  const t = String(a.type || '');
  if (t.includes('กระแส')) return BA_COA[3];
  if (t.includes('ประจำ')) return BA_COA[2];
  if (t.includes('ออมทรัพย์')) return BA_COA[1];
  return BA_COA[0];
};
const baNormalize = (list) => list.map(a => ({ ...a, coa: baCoaFor(a) }));
const baLoad = () => { try { const s = JSON.parse(localStorage.getItem(BA_KEY)); if (s && s.length) return baNormalize(s); } catch (e) {} return baNormalize(BA_SEED); };
const baSave = (d) => { try { localStorage.setItem(BA_KEY, JSON.stringify(d)); } catch (e) {} };
const baMoney = (n) => (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const baDate = (s) => (s && s.includes('-') ? s.split('-').reverse().join('/') : s || '—');
const baBankName = (c) => (BA_BANKS.find(b => b.code === c) || {}).name || '—';

function BankAccountPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'รายการธนาคาร', current: true }], []);
  const [list, setList] = baUseState(baLoad);
  const [selId, setSelId] = baUseState(() => baLoad()[0].id);
  const [q, setQ] = baUseState('');
  const [onlyActive, setOnlyActive] = baUseState(false);
  const [dirty, setDirty] = baUseState(false);

  const acct = list.find(a => a.id === selId) || list[0];
  const filtered = list.filter(a =>
    (!onlyActive || a.status === 'ใช้งาน') &&
    (!q.trim() || (baBankName(a.bankCode) + a.acctNo + a.acctName + a.branch).toLowerCase().includes(q.trim().toLowerCase())));

  const totals = baUseMemo(() => list.filter(a => a.status === 'ใช้งาน')
    .reduce((s, a) => ({ bank: s.bank + a.bankBal, coop: s.coop + a.coopBal }), { bank: 0, coop: 0 }), [list]);

  const patch = (fn) => { setList(ls => ls.map(a => (a.id === acct.id ? fn(a) : a))); setDirty(true); };
  const set = (k, v) => patch(a => ({ ...a, [k]: v }));

  const save = () => { baSave(list); setDirty(false); onToast && onToast(`บันทึกข้อมูลบัญชี ${acct.acctNo} เรียบร้อย`); };
  const addAcct = () => {
    const id = 'b' + Date.now().toString(36);
    const blank = { id, bankCode: '006', branchCode: '', branch: '', acctNo: '', acctName: '', type: 'ออมทรัพย์',
      passbook: '', rate: 0, coa: BA_COA[0], status: 'ใช้งาน', bankBal: 0, coopBal: 0, lastTxn: '—', lastDate: '', note: '', txns: [] };
    setList(ls => [...ls, blank]); setSelId(id); setDirty(true);
  };
  const diff = acct.bankBal - acct.coopBal;

  const field = (label, node, span) => (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}</span>{node}
    </label>
  );

  return (
    <div data-screen-label="หน้ารายการธนาคาร">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายการธนาคาร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ทะเบียนบัญชีธนาคารของสหกรณ์ — รายละเอียดบัญชี คู่บัญชีทางบัญชี และรายการเดินบัญชีของแต่ละเลขที่บัญชี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" data-keep-top="" onClick={addAcct}><Icon name="plus" /> เพิ่มบัญชี</button>
        <button className="btn sm" data-keep-top="" disabled={!dirty} onClick={() => { setList(baLoad()); setDirty(false); onToast && onToast('ยกเลิกการแก้ไขแล้ว'); }}>ยกเลิก</button>
        <button className="btn primary sm" data-keep-top="" disabled={!dirty} onClick={save}><Icon name="check" /> บันทึก</button>
      </div>

      <div className="ba-layout">
        {/* ── รายการบัญชี ── */}
        <div className="search-card ba-list-card">
          <div className="section-head"><h3>บัญชีธนาคาร</h3></div>
          <div className="dep-picker-input" style={{ margin: '10px 0 8px', height: 32, boxSizing: 'border-box' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)}
                   placeholder="ค้นหาธนาคาร / เลขที่บัญชี…" />
            {q && <button className="dep-picker-clear" onClick={() => setQ('')} aria-label="ล้าง"><Icon name="close" size={13} /></button>}
          </div>
          <label className="ba-check">
            <input type="checkbox" checked={onlyActive} onChange={e => setOnlyActive(e.target.checked)} />
            <span>เฉพาะบัญชีที่ใช้งาน</span>
          </label>
          <div className="ba-list">
            {filtered.map(a => (
              <button key={a.id} className={'ba-item' + (a.id === acct.id ? ' sel' : '')} onClick={() => setSelId(a.id)}>
                <div className="ba-item-top">
                  <span className="ba-item-bank">{baBankName(a.bankCode)}</span>
                  {a.status !== 'ใช้งาน' && <span className="pill neutral">ปิด</span>}
                </div>
                <div className="ba-item-acct mono">{a.acctNo || '— ยังไม่ระบุเลขที่บัญชี —'}</div>
                <div className="ba-item-foot">
                  <span className="muted">{a.type}</span>
                  <span className="mono">{baMoney(a.coopBal)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="empty-state" style={{ padding: 20 }}>ไม่พบบัญชีตามเงื่อนไข</div>}
          </div>
          <div className="ba-total">
            <div><span className="muted">รวมคงเหลือ (ธนาคาร)</span><b className="mono">{baMoney(totals.bank)}</b></div>
            <div><span className="muted">รวมคงเหลือ (สหกรณ์)</span><b className="mono">{baMoney(totals.coop)}</b></div>
          </div>
        </div>

        {/* ── รายละเอียดบัญชี ── */}
        <div className="ba-detail">
          <div className="search-card">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <h3>รายละเอียดบัญชี</h3>
              {dirty && <span className="chip warning" style={{ marginLeft: 'auto' }}>ยังไม่บันทึก</span>}
            </div>
            <div className="ap-form-grid ba-grid">
              {field('ธนาคาร', (
                <BaSelect className="cfg-input" value={acct.bankCode} onChange={e => set('bankCode', e.target.value)}>
                  {BA_BANKS.map(b => <option key={b.code} value={b.code}>{b.code} {b.name}</option>)}
                </BaSelect>), 2)}
              {field('ประเภท', (
                <BaSelect className="cfg-input" value={acct.type} onChange={e => set('type', e.target.value)}>
                  {BA_TYPES.map(t => <option key={t}>{t}</option>)}
                </BaSelect>))}
              {field('สถานะ', (
                <BaSelect className="cfg-input" value={acct.status} onChange={e => set('status', e.target.value)}>
                  <option>ใช้งาน</option><option>ปิดบัญชี</option>
                </BaSelect>))}
              {field('สาขา', (
                <div className="ba-branch">
                  <input className="cfg-input mono" style={{ width: 74 }} value={acct.branchCode} onChange={e => set('branchCode', e.target.value)} placeholder="รหัส" />
                  <input className="cfg-input" value={acct.branch} onChange={e => set('branch', e.target.value)} placeholder="ชื่อสาขา" />
                </div>), 2)}
              {field('เลขที่สมุด', <input className="cfg-input mono" value={acct.passbook} onChange={e => set('passbook', e.target.value)} />)}
              {field('อัตราดอกเบี้ย (%)', <input className="cfg-input mono" type="number" step="0.001" value={acct.rate} onChange={e => set('rate', Number(e.target.value) || 0)} />)}
              {field('เลขที่บัญชี', <input className="cfg-input mono" value={acct.acctNo} onChange={e => set('acctNo', e.target.value)} />, 2)}
              {field('ชื่อบัญชี', <input className="cfg-input" value={acct.acctName} onChange={e => set('acctName', e.target.value)} />, 2)}
              {field('คงเหลือธนาคาร', <input className="cfg-input mono" type="number" step="0.01" value={acct.bankBal} onChange={e => set('bankBal', Number(e.target.value) || 0)} />)}
              {field('คงเหลือสหกรณ์', <input className="cfg-input mono" type="number" step="0.01" value={acct.coopBal} onChange={e => set('coopBal', Number(e.target.value) || 0)} />)}
              <div className="ap-field">
                <span className="ap-label">รายการล่าสุด</span>
                <div className="cfg-display-box">{acct.lastTxn || '—'}</div>
              </div>
              <div className="ap-field">
                <span className="ap-label">วันที่รายการล่าสุด</span>
                <div className="cfg-display-box mono">{baDate(acct.lastDate)}</div>
              </div>
              {field('คู่บัญชี', (
                <BaSelect className="cfg-input" value={acct.coa} onChange={e => set('coa', e.target.value)}>
                  <option value="">— เลือกบัญชี —</option>
                  {BA_COA.map(c => <option key={c} value={c}>{baCoaLabel(c)}</option>)}
                </BaSelect>), 4)}
              {field('หมายเหตุ', <textarea className="cfg-input" rows={2} value={acct.note} onChange={e => set('note', e.target.value)} />, 4)}
            </div>
            {Math.abs(diff) > 0.004 && (
              <div className="ba-diff">
                <Icon name="info" size={13} />
                <span>ยอดคงเหลือธนาคารและสหกรณ์ต่างกัน <b className="mono">{baMoney(Math.abs(diff))}</b> บาท — ควรจัดทำงบกระทบยอด</span>
              </div>
            )}
          </div>

          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head">
              <h3>รายการเดินบัญชี</h3>
              <span className="spacer" style={{ flex: 1 }} />
              <span className="muted" style={{ fontSize: 11 }}>{acct.txns.length} รายการล่าสุด</span>
            </div>
            <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ba-tbl">
              <thead><tr>
                <th style={{ width: 56 }}>ลำดับ</th>
                <th style={{ width: 110 }}>วันที่</th>
                <th>รายการ</th>
                <th style={{ width: 140, textAlign: 'right' }}>จำนวนเงิน</th>
                <th style={{ width: 150, textAlign: 'right' }}>คงเหลือ</th>
              </tr></thead>
              <tbody>
                {acct.txns.map(t => (
                  <tr key={t.no}>
                    <td className="mono">{t.no}</td>
                    <td className="mono">{baDate(t.date)}</td>
                    <td>{t.desc}</td>
                    <td className={'mono num' + (t.amt < 0 ? ' ba-out' : t.amt > 0 ? ' ba-in' : '')} style={{ textAlign: 'right' }}>
                      {t.amt === 0 ? '—' : (t.amt > 0 ? '+' : '−') + baMoney(Math.abs(t.amt))}
                    </td>
                    <td className="mono num" style={{ textAlign: 'right' }}>{baMoney(t.bal)}</td>
                  </tr>
                ))}
                {acct.txns.length === 0 && <tr><td colSpan={5} className="empty-state" style={{ padding: 24 }}>ยังไม่มีรายการเดินบัญชี</td></tr>}
              </tbody>
            </table>
            </div></div>
          </div>

          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>{dirty ? 'มีการแก้ไขที่ยังไม่ได้บันทึก' : 'ข้อมูลบัญชีเป็นปัจจุบัน'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  Dropdown ที่วางรายการตรงกับตำแหน่งช่อง — หน้าตาช่องเดิม
// ═════════════════════════════════════════════════════════════════
function BaSelect({ value, onChange, className, style, disabled, children }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrap = React.useRef(null);
  const place = () => { if (wrap.current) setRect(wrap.current.getBoundingClientRect()); };
  React.useEffect(() => {
    if (!open) return;
    place();
    const h = () => place();
    const out = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', out);
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open]);

  const items = [];
  const text = (n) => React.Children.toArray(n).map(x => (x && x.props ? text(x.props.children) : String(x == null ? '' : x))).join('');
  React.Children.forEach(children, (o) => {
    if (!o || !o.props) return;
    items.push({ value: o.props.value !== undefined ? o.props.value : text(o.props.children), label: text(o.props.children) });
  });
  const same = (a) => String(a == null ? '' : a) === String(value == null ? '' : value);

  return (
    <div ref={wrap} style={Object.assign({ position: 'relative', width: '100%', minWidth: 0 }, style || {})}>
      <select className={className} value={value == null ? '' : value} disabled={disabled} onChange={onChange}
              onMouseDown={(e) => { if (!disabled) { e.preventDefault(); place(); setOpen(o => !o); } }}
              onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); place(); setOpen(o => !o); } }}
              style={{ width: '100%' }}>
        {children}
      </select>
      {open && rect && (
        <div style={{ position: 'fixed', zIndex: 4000,
                      top: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? undefined : rect.bottom + 1,
                      bottom: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? (window.innerHeight - rect.top + 1) : undefined,
                      left: rect.left, width: rect.width, maxHeight: 250, overflowY: 'auto', boxSizing: 'border-box',
                      background: 'var(--surface-card, #fff)', border: '1px solid var(--border-strong)', borderRadius: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,.08)', padding: 0 }}>
          {items.map((it, i) => (
            <div key={i} onClick={() => { setOpen(false); onChange && onChange({ target: { value: it.value } }); }}
                 style={{ padding: '5px 8px', fontSize: 13, lineHeight: 1.5, cursor: 'pointer', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          background: same(it.value) ? '#1254CC' : 'transparent',
                          color: same(it.value) ? '#fff' : 'var(--text)' }}
                 onMouseEnter={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                 onMouseLeave={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'transparent'; }}>
              {it.label || '—'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { BankAccountPage, BA_BANKS, BA_COA, baLoad, baBankName, BaSelect, baCoaLabel });
