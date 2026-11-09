// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน › ออกเช็ค
//  รวมหน้าจอกลุ่มออกเช็คทั้งหมด — ใช้โครง Design System กลาง
//   • ออกเช็ค 1 ใบจากหลาย Slip / …Slip cbt
//   • ออกเช็คเงินกู้ / ออกเช็คเงินฝาก
//   • เช็คหลายใบจาก 1 Slip / 1 Slip แตกเช็คหลายใบ
//   • พิมพ์เช็ค (พิมพ์ / Reprint)
//   • ยกเลิกนำส่งเช็ค / เปลี่ยนสถานะเช็ค
// ════════════════════════════════════════════════════════════════════
const { useState: ciUseState, useMemo: ciUseMemo, useContext: ciUseContext } = React;

// ประเภทเช็ค
const CI_TYPES = [
  { code: '00', label: '00 - เช็คเงินฝาก' },
  { code: '01', label: '01 - เช็คเงินกู้' },
  { code: '02', label: '02 - เช็คปันผล–เฉลี่ยคืน' },
  { code: '03', label: '03 - เช็คคืนค่าหุ้น' },
  { code: '04', label: '04 - เช็คค่าใช้จ่าย' },
];
// สถานะเช็ค (สำหรับ dropdown / เปลี่ยนสถานะ)
const CI_STATUSES = [
  { code: 'transit', label: 'เช็คระหว่างทาง', pill: 'warn' },
  { code: 'onhand',  label: 'เช็คในมือ', pill: 'info' },
  { code: 'remitted',label: 'นำส่งแล้ว', pill: 'info' },
  { code: 'cleared', label: 'ขึ้นเงินแล้ว', pill: 'ok' },
  { code: 'void',    label: 'ยกเลิก', pill: 'neutral' },
];
const CI_STATUS_MAP = Object.fromEntries(CI_STATUSES.map(s => [s.code, s]));
const CI_PRINTERS = ['Laser', 'Dot Matrix'];
const CI_SIZES = ['ใหญ่', 'เล็ก'];
const CI_CR = ['CR01 - เจ้าหนี้การค้า', 'CR02 - เจ้าหนี้อื่น', 'CR05 - เงินฝากรอจ่าย', 'CR07 - เงินกู้รอจ่าย'];

const ciToday = () => (typeof ivToday === 'function' ? ivToday() : '2026-07-23');
const ciBooks = () => (window.CHQ_BOOK_SEED || []).filter(b => b.status === 'active');
const ciFreeLeaves = (bookId) => (window.CHQ_LEAF_SEED || []).filter(l => l.status === 'free' && (!bookId || l.bookId === bookId));

// แหล่งรายการรอออกเช็ค (slip) แยกตามชนิดงาน
function ciSourceRows(kind) {
  const base = {
    deposit: [
      { ref: 'DP-2569-0451', memberCode: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', date: '2026-07-22', detail: 'ถอนเงินฝากออมทรัพย์พิเศษ', amount: 125000 },
      { ref: 'DP-2569-0452', memberCode: 'M-058242', name: 'นางสาวกานต์ ศิริวงศ์', date: '2026-07-22', detail: 'ถอนเงินฝากประจำครบกำหนด', amount: 300000 },
      { ref: 'DP-2569-0453', memberCode: 'M-058248', name: 'นางสาวศิริพร ใจงาม', date: '2026-07-23', detail: 'ปิดบัญชีเงินฝากออมทรัพย์', amount: 84250 },
      { ref: 'DP-2569-0454', memberCode: 'M-058250', name: 'นางอรอนงค์ บุญมาก', date: '2026-07-23', detail: 'ถอนดอกเบี้ยเงินฝากประจำ', amount: 15400 },
    ],
    loan: [
      { ref: 'LN-2569-1180', contractNo: 'SL-6512-0044', memberCode: 'M-058245', name: 'นายธีรพงษ์ ขำเพชร', date: '2026-07-22', detail: 'จ่ายเงินกู้สามัญ งวดแรก', amount: 450000 },
      { ref: 'LN-2569-1181', contractNo: 'SP-6602-0012', memberCode: 'M-058251', name: 'นายภาคภูมิ รัตนา', date: '2026-07-22', detail: 'จ่ายเงินกู้พิเศษเพื่อการเคหะ', amount: 1200000 },
      { ref: 'LN-2569-1182', contractNo: 'EM-6607-0231', memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', date: '2026-07-23', detail: 'จ่ายเงินกู้ฉุกเฉิน', amount: 50000 },
    ],
    expense: [
      { ref: 'PV-2569-0231', memberCode: '—', name: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', date: '2026-07-21', detail: 'ค่าบริการ รปภ. ประจำเดือน ก.ค. 2569', amount: 86400 },
      { ref: 'PV-2569-0232', memberCode: '—', name: 'บจก. ไอที โซลูชั่น', date: '2026-07-22', detail: 'ค่าบำรุงรักษาระบบประจำปี', amount: 128400 },
      { ref: 'PV-2569-0233', memberCode: '—', name: 'การไฟฟ้านครหลวง', date: '2026-07-23', detail: 'ค่าไฟฟ้าสำนักงานใหญ่', amount: 42150 },
    ],
  };
  return base[kind] || base.deposit;
}
// สมาชิก/สัญญา สำหรับหน้า cbt (จ่ายเงินกู้แบบกลุ่ม)
function ciCbtRows() {
  return [
    { seq: 1, contractNo: 'EM-6607-0231', memberCode: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', date: '2026-07-23', amount: 50000 },
    { seq: 2, contractNo: 'EM-6607-0232', memberCode: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', date: '2026-07-23', amount: 30000 },
    { seq: 3, contractNo: 'EM-6607-0233', memberCode: 'M-058252', name: 'นางสาวจุฬาลักษณ์ พัฒนกุล', date: '2026-07-23', amount: 45000 },
    { seq: 4, contractNo: 'EM-6607-0234', memberCode: 'M-058249', name: 'นายสุรชัย วงศ์ประเสริฐ', date: '2026-07-23', amount: 80000 },
    { seq: 5, contractNo: 'EM-6607-0235', memberCode: 'M-058248', name: 'นางสาวศิริพร ใจงาม', date: '2026-07-23', amount: 25000 },
  ];
}

// ─── การ์ดหัวเช็ค (ฟิลด์ร่วมของทุกหน้าออกเช็ค) ─────────────────────────
function CiChequeHeader({ f, set, showCR = true, showNote = true, showPayee = true, showDateToggle = false, title = 'ออกเช็ค' }) {
  const books = ciBooks();
  const leaves = ciFreeLeaves(f.bookId);
  return (
    <div className="search-card">
      <div className="section-head"><Icon name="money" size={15} /> {title}</div>
      <div className="iv-form-grid c3">
        <IvField label="ประเภทเช็ค" required>
          <select className="cfg-input" value={f.type} onChange={(e) => set('type', e.target.value)}>
            {CI_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
          </select>
        </IvField>
        <IvField label="วันที่หน้าเช็ค" required>
          {showDateToggle ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="ci-chk" title="พิมพ์วันที่บนหน้าเช็ค">
                <input type="checkbox" checked={f.printDate} onChange={(e) => set('printDate', e.target.checked)} />
              </label>
              <ErpDate value={f.faceDate} onChange={(v) => ((e) => set('faceDate', e.target.value))({ target: { value: v } })} disabled={!f.printDate} className="cfg-input" />
            </div>
          ) : (
            <ErpDate value={f.faceDate} onChange={(v) => ((e) => set('faceDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          )}
        </IvField>
        <IvField label="เลขที่บัญชี (ตัดจาก)" required>
          <select className="cfg-input" value={f.accountId} onChange={(e) => set('accountId', e.target.value)}>
            {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.accountNo}</option>)}
          </select>
        </IvField>

        <IvField label="เล่มที่เช็ค" required>
          <select className="cfg-input mono" value={f.bookId} onChange={(e) => { set('bookId', e.target.value); set('chequeNo', ''); }}>
            {books.map(b => <option key={b.id} value={b.id}>{b.id} · {b.bank}</option>)}
          </select>
        </IvField>
        <IvField label="เลขที่เช็ค" required>
          <select className="cfg-input mono" value={f.chequeNo} onChange={(e) => set('chequeNo', e.target.value)}>
            <option value="">— เลือกใบว่าง —</option>
            {leaves.map(l => <option key={l.no} value={l.no}>{l.no}</option>)}
          </select>
        </IvField>
        <IvField label="สถานะเช็ค">
          <select className="cfg-input" value={f.status} onChange={(e) => set('status', e.target.value)}>
            {CI_STATUSES.filter(s => s.code !== 'void').map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
        </IvField>

        {showCR && (
          <IvField label="รหัสบัญชี CR">
            <select className="cfg-input" value={f.cr} onChange={(e) => set('cr', e.target.value)}>
              <option value="">— ไม่ระบุ —</option>
              {CI_CR.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </IvField>
        )}
        <IvField label="เครื่องพิมพ์">
          <select className="cfg-input" value={f.printer} onChange={(e) => set('printer', e.target.value)}>
            {CI_PRINTERS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </IvField>
        <IvField label="ขนาดเช็ค">
          <select className="cfg-input" value={f.size} onChange={(e) => set('size', e.target.value)}>
            {CI_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </IvField>

        {showPayee && (
          <IvField label="สั่งจ่าย" span={showNote ? 2 : 3}>
            <input className="cfg-input" value={f.payee} placeholder="ชื่อผู้รับเงินบนหน้าเช็ค" onChange={(e) => set('payee', e.target.value)} />
          </IvField>
        )}
        {showNote && (
          <IvField label="หมายเหตุ" span={showPayee ? 1 : 3}>
            <input className="cfg-input" value={f.note} placeholder="บันทึกเพิ่มเติม" onChange={(e) => set('note', e.target.value)} />
          </IvField>
        )}
      </div>
    </div>
  );
}

// ─── กล่องแสดงจำนวนเงินรวมตามเช็ค ──────────────────────────────────────
function CiTotalBox({ total, label = 'รวมจำนวนเงินตามเช็ค', count }) {
  return (
    <div className="iv-net-box" style={{ marginTop: 12 }}>
      {count != null && <div className="iv-net-row"><span>จำนวนรายการที่เลือก</span><span className="mono">{count} รายการ</span></div>}
      <div className="iv-net-row strong"><span>{label}</span><span className="mono"><b>{fmt.money(total, 2)}</b></span></div>
    </div>
  );
}

function ciNewForm(kind) {
  const defType = kind === 'loan' ? '01' : kind === 'expense' ? '04' : '00';
  const b = ciBooks()[0];
  return {
    type: defType, faceDate: ciToday(), printDate: true, accountId: b ? b.bankId : (window.COOP_BANK_ACCOUNTS[0] || {}).id,
    bookId: b ? b.id : '', chequeNo: '', status: 'transit', cr: '', printer: 'Laser', size: 'ใหญ่', payee: '', note: '',
  };
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: ออกเช็ค 1 ใบ จากหลาย Slip  (เงินฝาก / เงินกู้ / ค่าใช้จ่าย)
//  รวมหลายรายการ (slip) → ออกเช็คหนึ่งใบ
// ════════════════════════════════════════════════════════════════════
function ChequeMultiSlipPage({ onToast, kind = 'deposit', title = 'ออกเช็ค 1 ใบ จากหลาย Slip', crumb }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb(crumb || [{ label: 'ออกเช็ค' }, { label: title, current: true }], [title]);
  const [f, setF] = ciUseState(() => ciNewForm(kind));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const rows = ciUseMemo(() => ciSourceRows(kind), [kind]);
  const [picked, setPicked] = ciUseState(() => new Set());
  const [loaded, setLoaded] = ciUseState(false);
  const [pullDate, setPullDate] = ciUseState(ciToday());

  const selRows = rows.filter(r => picked.has(r.ref));
  const total = selRows.reduce((a, r) => a + r.amount, 0);
  const allChecked = loaded && picked.size === rows.length && rows.length > 0;
  const toggle = (ref) => setPicked(s => { const n = new Set(s); n.has(ref) ? n.delete(ref) : n.add(ref); return n; });
  const toggleAll = () => setPicked(allChecked ? new Set() : new Set(rows.map(r => r.ref)));
  const canIssue = f.chequeNo && selRows.length > 0 && f.payee.trim();

  const issue = () => {
    audit.log && audit.log({ action: 'create', module: 'การเงิน — ออกเช็ค', target: `เช็ค ${f.chequeNo}`,
      summary: `${title}: รวม ${selRows.length} รายการ ${fmt.money(total, 0)} บาท` });
    onToast && onToast(`ออกเช็ค ${f.chequeNo} จำนวน ${fmt.money(total, 2)} บาท เรียบร้อย · กำลังพิมพ์เช็ค`);
  };

  return (
    <div data-screen-label={title}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ดึงรายการที่รอจ่าย เลือกหลายรายการ แล้วรวมออกเป็นเช็คหนึ่งใบ</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" disabled={!canIssue} onClick={issue}><Icon name="print" /> ออกเช็ค &amp; พิมพ์</button>
      </div>

      <CiChequeHeader f={f} set={set} />
      <CiTotalBox total={total} count={selRows.length} />

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>รายการรอออกเช็ค</span>
          <div className="ci-inline"><span className="ci-inline-k">วันที่</span>
            <ErpDate value={pullDate} onChange={(v) => ((e) => setPullDate(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="cfg-input" /></div>
          <button className="btn sm" onClick={() => { setLoaded(true); onToast && onToast('ดึงข้อมูลรายการรอจ่ายแล้ว'); }}><Icon name="download" /> ดึงข้อมูล</button>
          <span className="spacer" />
          {loaded && <span className="muted" style={{ fontSize: 11 }}>{rows.length} รายการ</span>}
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 860 }}>
            <thead><tr>
              <th style={{ width: 40 }} className="center"><input type="checkbox" checked={allChecked} disabled={!loaded} onChange={toggleAll} /></th>
              <th style={{ width: 130 }}>เลขที่อ้างอิง</th>
              {kind === 'loan' && <th style={{ width: 130 }}>เลขที่สัญญา</th>}
              <th style={{ width: 110 }}>เลขที่สมาชิก</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 220 }}>รายละเอียด</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              {!loaded && <tr><td colSpan={kind === 'loan' ? 7 : 6} className="center muted" style={{ padding: 30 }}>กด “ดึงข้อมูล” เพื่อแสดงรายการรอออกเช็ค</td></tr>}
              {loaded && rows.map(r => (
                <tr key={r.ref} className={picked.has(r.ref) ? 'selected' : ''}>
                  <td className="center"><input type="checkbox" checked={picked.has(r.ref)} onChange={() => toggle(r.ref)} /></td>
                  <td className="mono">{r.ref}</td>
                  {kind === 'loan' && <td className="mono" style={{ fontSize: 12 }}>{r.contractNo}</td>}
                  <td className="mono" style={{ fontSize: 12 }}>{r.memberCode}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                  <td><div className="lt-row-name">{r.name}</div><div className="lt-row-note muted">{r.detail}</div></td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted"><Icon name="info" size={12} /> รายการที่เลือกทั้งหมดจะถูกรวมเป็นยอดเช็คใบเดียว และส่งเข้าระบบบัญชีเมื่อออกเช็ค</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: ออกเช็ค 1 ใบ จากหลาย Slip (cbt)
//  จ่ายเงินกู้แบบกลุ่ม — เลือกกลุ่มเงินกู้ + ตัดจากบัญชีธนาคาร + CBT
// ════════════════════════════════════════════════════════════════════
function ChequeMultiSlipCbtPage({ onToast }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: 'ออกเช็ค 1 ใบ จากหลาย Slip cbt', current: true }], []);
  const [f, setF] = ciUseState(() => ciNewForm('loan'));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const rows = ciUseMemo(ciCbtRows, []);
  const [picked, setPicked] = ciUseState(() => new Set());
  const [loaded, setLoaded] = ciUseState(false);
  const [group, setGroup] = ciUseState('เงินกู้ฉุกเฉิน');
  const [withDividend, setWithDividend] = ciUseState(false);
  const [drawFromId, setDrawFromId] = ciUseState((window.COOP_BANK_ACCOUNTS[0] || {}).id);
  const [pullDate, setPullDate] = ciUseState(ciToday());

  const selRows = rows.filter(r => picked.has(r.contractNo));
  const total = selRows.reduce((a, r) => a + r.amount, 0);
  const allChecked = loaded && picked.size === rows.length && rows.length > 0;
  const toggle = (id) => setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setPicked(allChecked ? new Set() : new Set(rows.map(r => r.contractNo)));
  const canIssue = f.chequeNo && selRows.length > 0 && f.payee.trim();

  return (
    <div data-screen-label="ออกเช็ค 1 ใบ จากหลาย Slip cbt">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ออกเช็ค 1 ใบ จากหลาย Slip cbt</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>รวมรายการจ่ายเงินกู้แบบกลุ่มออกเป็นเช็คหนึ่งใบ พร้อมกำหนดบัญชีที่ตัดจ่าย (CBT)</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" disabled={!canIssue}
                onClick={() => { audit.log && audit.log({ action: 'create', module: 'การเงิน — ออกเช็ค (cbt)', target: `เช็ค ${f.chequeNo}`, summary: `รวม ${selRows.length} รายการ ${fmt.money(total, 0)} บาท` }); onToast && onToast(`ออกเช็ค ${f.chequeNo} ${fmt.money(total, 2)} บาท เรียบร้อย`); }}>
          <Icon name="print" /> ออกเช็ค &amp; พิมพ์
        </button>
      </div>

      <CiChequeHeader f={f} set={set} />

      <div className="dayopen-cols">
        <div className="search-card">
          <div className="section-head"><Icon name="bank" size={15} /> ตัดจากบัญชีธนาคาร</div>
          <div className="iv-form-grid c1" style={{ gridTemplateColumns: '1fr' }}>
            <IvField label="บัญชีที่ตัดจ่าย">
              <select className="cfg-input" value={drawFromId} onChange={(e) => setDrawFromId(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.branch} · {b.accountNo}</option>)}
              </select>
            </IvField>
          </div>
        </div>
        <CiTotalBox total={total} count={selRows.length} />
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>รายการ</span>
          <div className="ci-inline"><span className="ci-inline-k">วันที่</span>
            <ErpDate value={pullDate} onChange={(v) => ((e) => setPullDate(e.target.value))({ target: { value: v } })} style={{ width: 150 }} className="cfg-input" /></div>
          <div className="ci-inline"><span className="ci-inline-k">กลุ่มเงินกู้</span>
            <select className="cfg-input" value={group} onChange={(e) => setGroup(e.target.value)} style={{ width: 170 }}>
              <option>เงินกู้ฉุกเฉิน</option><option>เงินกู้สามัญ</option><option>เงินกู้พิเศษ</option>
            </select></div>
          <label className="ci-chk-lbl"><input type="checkbox" checked={withDividend} onChange={(e) => setWithDividend(e.target.checked)} /> จ่ายปันผลและเฉลี่ยคืน</label>
          <button className="btn sm" onClick={() => { setLoaded(true); onToast && onToast('ดึงข้อมูลรายการแล้ว'); }}><Icon name="download" /> ดึงข้อมูล</button>
          <button className="btn sm" onClick={() => onToast && onToast('เชื่อมต่อ CBT — ดึงยอดจากธนาคาร')}>CBT</button>
          <span className="spacer" />
          {loaded && <span className="muted" style={{ fontSize: 11 }}>เลือก {selRows.length}/{rows.length} รายการ</span>}
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead><tr>
              <th style={{ width: 40 }} className="center"><input type="checkbox" checked={allChecked} disabled={!loaded} onChange={toggleAll} /></th>
              <th className="center" style={{ width: 50 }}>ลำดับ</th>
              <th style={{ width: 140 }}>เลขที่สัญญา</th>
              <th style={{ width: 110 }}>เลขที่สมาชิก</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 200 }}>ชื่อ – สกุล</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              {!loaded && <tr><td colSpan="7" className="center muted" style={{ padding: 30 }}>กด “ดึงข้อมูล” เพื่อแสดงรายการจ่ายเงินกู้ตามกลุ่ม</td></tr>}
              {loaded && rows.map(r => (
                <tr key={r.contractNo} className={picked.has(r.contractNo) ? 'selected' : ''}>
                  <td className="center"><input type="checkbox" checked={picked.has(r.contractNo)} onChange={() => toggle(r.contractNo)} /></td>
                  <td className="center mono">{r.seq}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.contractNo}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.memberCode}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                  <td>{r.name}</td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: เช็คหลายใบ จาก 1 Slip  /  1 Slip แตกเช็คหลายใบ
//  เลือก slip ต้นทาง → แตกเป็นหลายเช็ค (หลายผู้รับ) พร้อมยอดรวม
// ════════════════════════════════════════════════════════════════════
function ChequeSplitPage({ onToast, variant = 'many-from-one' }) {
  const title = variant === 'split' ? '1 Slip แตกเช็คหลายใบ' : 'เช็คหลายใบ จาก 1 Slip';
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: title, current: true }], [title]);
  const [f, setF] = ciUseState(() => ({ ...ciNewForm('expense'), type: '04' }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const source = ciUseMemo(() => ciSourceRows('expense'), []);
  const [srcRef, setSrcRef] = ciUseState('');
  const [lines, setLines] = ciUseState([{ id: 1, payee: '', amount: '' }, { id: 2, payee: '', amount: '' }]);
  const nextId = React.useRef(3);

  const srcRow = source.find(r => r.ref === srcRef);
  const total = lines.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const addLine = () => setLines(ls => [...ls, { id: nextId.current++, payee: '', amount: '' }]);
  const delLine = (id) => setLines(ls => ls.filter(l => l.id !== id));
  const setLine = (id, k, v) => setLines(ls => ls.map(l => l.id === id ? { ...l, [k]: v } : l));
  const validLines = lines.filter(l => l.payee.trim() && Number(l.amount) > 0);
  const canIssue = f.chequeNo && validLines.length > 0;

  return (
    <div data-screen-label={title}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกรายการ Slip ต้นทาง แล้วแตกยอดออกเป็นเช็คหลายใบตามผู้รับเงิน</div>
        </div>
        <span className="spacer" />
        <button className="btn primary" disabled={!canIssue}
                onClick={() => { audit.log && audit.log({ action: 'create', module: 'การเงิน — ' + title, target: srcRef || '—', summary: `แตก ${validLines.length} เช็ค รวม ${fmt.money(total, 0)} บาท` }); onToast && onToast(`ออกเช็ค ${validLines.length} ใบ รวม ${fmt.money(total, 2)} บาท เรียบร้อย`); }}>
          <Icon name="print" /> ออกเช็ค &amp; พิมพ์
        </button>
      </div>

      <CiChequeHeader f={f} set={set} showPayee={false} showDateToggle={variant === 'split'} />

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar"><span style={{ fontWeight: 600, fontSize: 13 }}>รายการ Slip ต้นทาง</span><span className="spacer" /><span className="muted" style={{ fontSize: 11 }}>เลือก 1 รายการ</span></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead><tr>
              <th style={{ width: 40 }} className="center" />
              <th className="center" style={{ width: 50 }}>ลำดับ</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 220 }}>สั่งจ่าย / รายละเอียด</th>
              <th className="right" style={{ width: 140 }}>จำนวนเงิน</th>
            </tr></thead>
            <tbody>
              {source.map((r, i) => (
                <tr key={r.ref} className={srcRef === r.ref ? 'selected' : ''} style={{ cursor: 'pointer' }} onClick={() => setSrcRef(r.ref)}>
                  <td className="center"><input type="radio" name="ci-src" checked={srcRef === r.ref} onChange={() => setSrcRef(r.ref)} /></td>
                  <td className="center mono">{i + 1}</td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                  <td><div className="lt-row-name">{r.name}</div><div className="lt-row-note muted">{r.detail}</div></td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="toolbar"><span style={{ fontWeight: 600, fontSize: 13 }}>รายการแตกเช็ค</span>
          <button className="btn sm" onClick={addLine}><Icon name="plus" /> เพิ่มแถว</button>
          <span className="spacer" />{srcRow && <span className="muted" style={{ fontSize: 11 }}>จาก {srcRow.ref} · {fmt.money(srcRow.amount, 2)}</span>}</div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ minWidth: 300 }}>สั่งจ่าย</th>
              <th className="right" style={{ width: 160 }}>จำนวนเงิน</th>
              <th style={{ width: 56 }} />
            </tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.id}>
                  <td className="center mono">{i + 1}</td>
                  <td><input className="cfg-input" value={l.payee} placeholder="ชื่อผู้รับเงิน" onChange={(e) => setLine(l.id, 'payee', e.target.value)} /></td>
                  <td><IvMoneyInput value={l.amount} onChange={(v) => setLine(l.id, 'amount', v)} /></td>
                  <td className="center"><button className="bud-act danger" title="ลบแถว" disabled={lines.length <= 1} onClick={() => delLine(l.id)}><Icon name="trash" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan="2" className="right" style={{ fontWeight: 600 }}>รวมจ่ายทั้งหมด</td>
              <td className="right mono"><b>{fmt.money(total, 2)}</b></td><td /></tr></tfoot>
          </table>
        </div></div>
      </div>
      {srcRow && Math.abs(total - srcRow.amount) > 0.005 && validLines.length > 0 && (
        <div className="lt-list-foot" style={{ color: 'var(--danger, #c0392b)' }}><Icon name="info" size={12} /> ยอดแตกเช็ครวม {fmt.money(total, 2)} ไม่เท่ากับยอด Slip ต้นทาง {fmt.money(srcRow.amount, 2)}</div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: พิมพ์เช็ค (พิมพ์ / Reprint)
// ════════════════════════════════════════════════════════════════════
function ci_printSeed() {
  return [
    { chequeNo: '06700143', date: '2026-07-23', payee: 'นายสมชาย ใจดี รักษ์ออม', amount: 125000, printed: false },
    { chequeNo: '06700144', date: '2026-07-23', payee: 'บจก. ไอที โซลูชั่น', amount: 128400, printed: true, printedAt: '2026-07-23 10:14' },
    { chequeNo: '06700145', date: '2026-07-23', payee: 'การไฟฟ้านครหลวง', amount: 42150, printed: false },
    { chequeNo: '06700146', date: '2026-07-22', payee: 'นายธีรพงษ์ ขำเพชร', amount: 450000, printed: true, printedAt: '2026-07-22 15:40' },
  ];
}
function ChequePrintPage({ onToast }) {
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: 'พิมพ์เช็ค', current: true }], []);
  const [f, setF] = ciUseState(() => ({ ...ciNewForm('expense'), type: '04' }));
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const [rows, setRows] = ciUseState(ci_printSeed);
  const [picked, setPicked] = ciUseState(() => new Set());
  const [loaded, setLoaded] = ciUseState(false);
  const [pullDate, setPullDate] = ciUseState(ciToday());

  const allChecked = loaded && picked.size === rows.length && rows.length > 0;
  const toggle = (no) => setPicked(s => { const n = new Set(s); n.has(no) ? n.delete(no) : n.add(no); return n; });
  const toggleAll = () => setPicked(allChecked ? new Set() : new Set(rows.map(r => r.chequeNo)));
  const sel = rows.filter(r => picked.has(r.chequeNo));
  const hasReprint = sel.some(r => r.printed);

  const doPrint = () => {
    const now = (typeof ivNow === 'function' ? ivNow() : '2026-07-23 12:00');
    setRows(rs => rs.map(r => picked.has(r.chequeNo) ? { ...r, printed: true, printedAt: now } : r));
    onToast && onToast(`${hasReprint ? 'พิมพ์ซ้ำ (Reprint)' : 'พิมพ์'}เช็ค ${sel.length} ใบ เรียบร้อย`);
    setPicked(new Set());
  };

  return (
    <div data-screen-label="พิมพ์เช็ค">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>พิมพ์เช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกเช็คที่ต้องการพิมพ์ — เช็คที่พิมพ์แล้วสามารถสั่งพิมพ์ซ้ำ (Reprint) ได้</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" disabled={sel.length === 0} onClick={doPrint}>
          <Icon name={hasReprint ? 'refresh' : 'print'} /> {hasReprint ? 'พิมพ์ซ้ำ (Reprint)' : 'พิมพ์เช็ค'} {sel.length > 0 ? `(${sel.length})` : ''}
        </button>
      </div>

      <CiChequeHeader f={f} set={set} showPayee={false} showNote={false} showDateToggle />

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการเช็ค</h3></div>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="ci-inline"><span className="ci-inline-k">วันที่</span>
            <input className="cfg-input" type="date" value={pullDate} onChange={(e) => setPullDate(e.target.value)} style={{ width: 160, height: 32, minHeight: 32, boxSizing: 'border-box' }} /></div>
          <button className="btn primary pa-tb-btn" onClick={() => { setLoaded(true); onToast && onToast('ดึงข้อมูลเช็คที่รอพิมพ์แล้ว'); }}><Icon name="download" /> ดึงข้อมูล</button>
          <span className="spacer" />
          {loaded && <span className="muted" style={{ fontSize: 12 }}>เลือก {sel.length}/{rows.length}</span>}
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead><tr>
              <th style={{ width: 40 }} className="center"><input type="checkbox" checked={allChecked} disabled={!loaded} onChange={toggleAll} /></th>
              <th className="center" style={{ width: 50 }}>ลำดับ</th>
              <th style={{ width: 120 }}>เลขที่เช็ค</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 220 }}>สั่งจ่าย</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 130 }}>สถานะพิมพ์</th>
            </tr></thead>
            <tbody>
              {!loaded && <tr><td colSpan="7" className="center muted" style={{ padding: '32px 12px' }}>กด “ดึงข้อมูล” เพื่อแสดงเช็คที่รอพิมพ์</td></tr>}
              {loaded && rows.map((r, i) => (
                <tr key={r.chequeNo} className={picked.has(r.chequeNo) ? 'selected' : ''}>
                  <td className="center"><input type="checkbox" checked={picked.has(r.chequeNo)} onChange={() => toggle(r.chequeNo)} /></td>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono"><b>{r.chequeNo}</b></td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                  <td>{r.payee}</td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                  <td className="center">{r.printed
                    ? <><span className="chip success">พิมพ์แล้ว</span><div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{r.printedAt}</div></>
                    : <span className="chip">ยังไม่พิมพ์</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> การพิมพ์ซ้ำจะไม่กินเลขเช็คใหม่ — ใช้กรณีเครื่องพิมพ์ขัดข้องหรือกระดาษเสีย</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: ยกเลิกนำส่งเช็ค  — ดึงเช็คที่ “นำส่งแล้ว” กลับมาเป็น “เช็คในมือ”
// ════════════════════════════════════════════════════════════════════
function ci_remitSeed() {
  return [
    { chequeNo: '06700140', bank: 'ธนาคารกรุงไทย', date: '2026-07-20', payee: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย', amount: 25050000, remitBatch: 'RM-2569-0088', status: 'remitted' },
    { chequeNo: '02055041', bank: 'ธนาคารออมสิน', date: '2026-07-21', payee: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', amount: 86400, remitBatch: 'RM-2569-0089', status: 'remitted' },
    { chequeNo: '01200333', bank: 'ธนาคารกสิกรไทย', date: '2026-07-22', payee: 'นายสมชาย ใจดี รักษ์ออม', amount: 250000, remitBatch: 'RM-2569-0090', status: 'remitted' },
  ];
}
function ChequeCancelRemitPage({ onToast }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: 'ยกเลิกนำส่งเช็ค', current: true }], []);
  const [rows, setRows] = ciUseState(ci_remitSeed);
  const [q, setQ] = ciUseState('');
  const [query, setQuery] = ciUseState('');
  const doSearch = () => setQuery(q);
  const doReset = () => { setQ(''); setQuery(''); };
  const filtered = rows.filter(r => !query.trim() || r.chequeNo.includes(query) || (r.payee || '').includes(query) || r.remitBatch.includes(query));

  const cancel = (r) => {
    setRows(rs => rs.map(x => x.chequeNo === r.chequeNo ? { ...x, status: 'onhand' } : x));
    audit.log && audit.log({ action: 'update', module: 'การเงิน — ยกเลิกนำส่งเช็ค', target: `เช็ค ${r.chequeNo}`, summary: `ยกเลิกนำส่ง (${r.remitBatch}) → เช็คในมือ` });
    onToast && onToast(`ยกเลิกนำส่งเช็ค ${r.chequeNo} — สถานะกลับเป็น “เช็คในมือ”`);
  };

  return (
    <div data-screen-label="ยกเลิกนำส่งเช็ค">
      <div className="page-actions">
        <div><h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกนำส่งเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ดึงเช็คที่นำส่งธนาคารแล้วกลับมาเป็น “เช็คในมือ” กรณีนำส่งผิดหรือยกเลิกการนำส่ง</div></div>
      </div>
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เช็คที่นำส่งแล้ว</h3></div>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} placeholder="ค้นหาเลขเช็ค / ผู้รับเงิน / รอบนำส่ง" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={doSearch}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={doReset}>รีเซ็ต</button>
          <span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 960 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 120 }}>เลขที่เช็ค</th>
              <th style={{ width: 140 }}>ธนาคาร</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 220 }}>ผู้รับเงิน</th>
              <th className="center" style={{ width: 130 }}>รอบนำส่ง</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 120 }}>สถานะ</th>
              <th className="center" style={{ width: 140 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {filtered.map((r, i) => {
                const st = CI_STATUS_MAP[r.status];
                return (
                  <tr key={r.chequeNo}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono"><b>{r.chequeNo}</b></td>
                    <td style={{ fontSize: 12 }}>{r.bank}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                    <td>{r.payee}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{r.remitBatch}</td>
                    <td className="right mono">{fmt.money(r.amount, 2)}</td>
                    <td className="center"><span className={window.chqChip(st.pill)}>{st.label}</span></td>
                    <td className="center">{r.status === 'remitted'
                      ? <button className="btn sm ex-row-btn del" onClick={() => cancel(r)}><Icon name="close" size={13} /> ยกเลิกนำส่ง</button>
                      : <span className="muted" style={{ fontSize: 11 }}>ยกเลิกแล้ว</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้า: เปลี่ยนสถานะเช็ค
// ════════════════════════════════════════════════════════════════════
function ci_statusSeed() {
  return [
    { chequeNo: '06700143', bank: 'ธนาคารกรุงไทย', date: '2026-07-23', payee: 'นายสมชาย ใจดี รักษ์ออม', amount: 125000, status: 'transit' },
    { chequeNo: '06700144', bank: 'ธนาคารกรุงไทย', date: '2026-07-23', payee: 'บจก. ไอที โซลูชั่น', amount: 128400, status: 'onhand' },
    { chequeNo: '02055041', bank: 'ธนาคารออมสิน', date: '2026-07-21', payee: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', amount: 86400, status: 'remitted' },
    { chequeNo: '06700140', bank: 'ธนาคารกรุงไทย', date: '2026-07-20', payee: 'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย', amount: 25050000, status: 'cleared' },
  ];
}
function ChequeStatusPage({ onToast }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'ออกเช็ค' }, { label: 'เปลี่ยนสถานะเช็ค', current: true }], []);
  const [rows, setRows] = ciUseState(ci_statusSeed);
  const [q, setQ] = ciUseState('');
  const [query, setQuery] = ciUseState('');
  const doSearch = () => setQuery(q);
  const doReset = () => { setQ(''); setQuery(''); };
  const filtered = rows.filter(r => !query.trim() || r.chequeNo.includes(query) || (r.payee || '').includes(query));

  const change = (no, next) => {
    setRows(rs => rs.map(r => r.chequeNo === no ? { ...r, status: next } : r));
    const r = rows.find(x => x.chequeNo === no);
    audit.log && audit.log({ action: 'update', module: 'การเงิน — เปลี่ยนสถานะเช็ค', target: `เช็ค ${no}`,
      summary: `เปลี่ยนสถานะเป็น ${CI_STATUS_MAP[next].label}`, changes: [{ field: 'สถานะ', before: CI_STATUS_MAP[r.status].label, after: CI_STATUS_MAP[next].label }] });
    onToast && onToast(`เปลี่ยนสถานะเช็ค ${no} เป็น “${CI_STATUS_MAP[next].label}”`);
  };

  return (
    <div data-screen-label="เปลี่ยนสถานะเช็ค">
      <div className="page-actions">
        <div><h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปลี่ยนสถานะเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปรับสถานะเช็คด้วยตนเอง เช่น ระหว่างทาง → ในมือ → นำส่งแล้ว → ขึ้นเงินแล้ว หรือยกเลิก</div></div>
      </div>
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายการเช็ค</h3></div>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} placeholder="ค้นหาเลขเช็ค / ผู้รับเงิน" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={doSearch}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={doReset}>รีเซ็ต</button>
          <span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>{filtered.length} รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 940 }}>
            <thead><tr>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 120 }}>เลขที่เช็ค</th>
              <th style={{ width: 140 }}>ธนาคาร</th>
              <th className="center" style={{ width: 100 }}>วันที่</th>
              <th style={{ minWidth: 220 }}>ผู้รับเงิน</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 130 }}>สถานะปัจจุบัน</th>
              <th style={{ width: 180 }}>เปลี่ยนเป็น</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="8" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {filtered.map((r, i) => {
                const st = CI_STATUS_MAP[r.status];
                return (
                  <tr key={r.chequeNo}>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono"><b>{r.chequeNo}</b></td>
                    <td style={{ fontSize: 12 }}>{r.bank}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.date)}</td>
                    <td>{r.payee}</td>
                    <td className="right mono">{fmt.money(r.amount, 2)}</td>
                    <td className="center"><span className={window.chqChip(st.pill)}>{st.label}</span></td>
                    <td>
                      <select className="cfg-input" style={{ height: 32, minHeight: 32, boxSizing: 'border-box' }} value={r.status} onChange={(e) => change(r.chequeNo, e.target.value)}>
                        {CI_STATUSES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
      <div className="lt-list-foot muted"><Icon name="info" size={12} /> การเปลี่ยนสถานะจะถูกบันทึกในประวัติการใช้งาน (Audit Log) ทุกครั้ง</div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════════
//  หน้า: ยกเลิกเช็ค — ค้นหาเช็คที่ออกแล้วตามช่วงวันที่ / เลขเช็ค / ธนาคาร / สาขา
//  ติ๊กเลือก → ระบุเหตุผล (ค่าคงที่ “เหตุผลการยกเลิกเช็ค”) + วิธียกเลิก → ยืนยัน
// ════════════════════════════════════════════════════════════════════
const CI_CX_MODES = [{ v: 'void', l: 'ยกเลิกทิ้ง' }, { v: 'reissue', l: 'ยกเลิกเพื่อออกใหม่' }];
function ci_cancelSeed() {
  return [
    { chequeNo: '10070837', bank: 'ธนาคารกรุงไทย', branch: 'สาขาแจ้งวัฒนะ', date: '2026-02-25', payee: 'บริษัท บัตรกรุงไทย จำกัด (มหาชน)', amount: 34186.25, status: 'onhand' },
    { chequeNo: '10070838', bank: 'ธนาคารกรุงไทย', branch: 'สาขาแจ้งวัฒนะ', date: '2026-02-25', payee: 'นายสรายุทธิ์ สมถะธัญกรณ์', amount: 132827.66, status: 'onhand' },
    { chequeNo: '06700144', bank: 'ธนาคารกรุงไทย', branch: 'สาขาหลักสี่', date: '2026-07-23', payee: 'บจก. ไอที โซลูชั่น', amount: 128400, status: 'onhand' },
    { chequeNo: '02055041', bank: 'ธนาคารออมสิน', branch: 'สาขาบางเขน', date: '2026-07-21', payee: 'บจก. รักษาความปลอดภัย ไทยซีเคียว', amount: 45000, status: 'onhand' },
    { chequeNo: '01200333', bank: 'ธนาคารกสิกรไทย', branch: 'สาขาแจ้งวัฒนะ', date: '2026-07-22', payee: 'นายสมชาย ใจดี รักษ์ออม', amount: 250000, status: 'onhand' },
  ];
}
function ciCancelReasons() {
  try { if (typeof gcLoad === 'function' && typeof ttCat === 'function') { const l = gcLoad(ttCat('chqcancel')).filter(r => r.enabled !== false).map(r => r.name); if (l.length) return l; } } catch (e) {}
  return ['เช็คชำรุด', 'เขียนผิด', 'ผู้รับเงินขอยกเลิก', 'เปลี่ยนวิธีการจ่าย', 'อื่น ๆ'];
}
function ChequeCancelPage({ onToast }) {
  const audit = ciUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  if (typeof useBreadcrumb === 'function') useBreadcrumb([{ label: 'จัดการเช็ค' }, { label: 'ยกเลิกเช็ค', current: true }], []);
  const [rows, setRows] = ciUseState(ci_cancelSeed);
  const allDates = rows.map(r => r.date).sort();
  const blank = { from: allDates[0] || '', to: allDates[allDates.length - 1] || '', chequeNo: '', bank: '', branch: '' };
  const [f, setF] = ciUseState(blank);
  const [qf, setQf] = ciUseState(blank);
  const [sel, setSel] = ciUseState({});
  const [ask, setAsk] = ciUseState(false);
  const reasons = ciCancelReasons();
  const set = (k, v) => setF(p => ({ ...p, [k]: v, ...(k === 'bank' ? { branch: '' } : {}) }));
  const banks = [...new Set(rows.map(r => r.bank))];
  const branches = [...new Set(rows.filter(r => !f.bank || r.bank === f.bank).map(r => r.branch))];
  const shown = rows.filter(r => r.status !== 'void'
    && (!qf.from || r.date >= qf.from) && (!qf.to || r.date <= qf.to)
    && (!qf.chequeNo.trim() || r.chequeNo.includes(qf.chequeNo.trim()))
    && (!qf.bank || r.bank === qf.bank) && (!qf.branch || r.branch === qf.branch));
  const picked = shown.filter(r => sel[r.chequeNo]);
  const missing = picked.some(r => !sel[r.chequeNo].reason);
  const total = picked.reduce((a, r) => a + r.amount, 0);
  const toggle = (r, on) => setSel(p => { const n = { ...p }; if (on) n[r.chequeNo] = p[r.chequeNo] || { reason: '', mode: 'void' }; else delete n[r.chequeNo]; return n; });
  const setPick = (no, k, v) => setSel(p => ({ ...p, [no]: { ...(p[no] || { reason: '', mode: 'void' }), [k]: v } }));
  const allOn = shown.length > 0 && shown.every(r => sel[r.chequeNo]);
  const toggleAll = (on) => setSel(p => { const n = { ...p }; shown.forEach(r => { if (on) n[r.chequeNo] = p[r.chequeNo] || { reason: '', mode: 'void' }; else delete n[r.chequeNo]; }); return n; });
  const doSearch = () => { setQf(f); setSel({}); };
  const doReset = () => { setF(blank); setQf(blank); setSel({}); };
  const doCancel = () => {
    const nos = picked.map(r => r.chequeNo);
    setRows(rs => rs.map(x => nos.includes(x.chequeNo) ? { ...x, status: 'void' } : x));
    picked.forEach(r => audit.log && audit.log({ action: 'delete', module: 'การเงิน — ยกเลิกเช็ค', target: 'เช็ค ' + r.chequeNo,
      summary: (CI_CX_MODES.find(m => m.v === sel[r.chequeNo].mode) || CI_CX_MODES[0]).l + ' เช็ค ' + r.chequeNo + ' · ' + fmt.money(r.amount, 2) + ' บาท · เหตุผล: ' + sel[r.chequeNo].reason }));
    setAsk(false); setSel({});
    if (window.depSuccess) window.depSuccess({ title: 'ยกเลิกเช็คสำเร็จ', desc: 'ยกเลิกเช็ค ' + nos.length + ' ใบ รวม ' + fmt.money(total, 2) + ' บาท เรียบร้อยแล้ว' });
    else onToast && onToast('ยกเลิกเช็ค ' + nos.length + ' ใบแล้ว');
  };
  const DateIn = ({ v, onChange }) => window.ThaiDateField
    ? <window.ThaiDateField value={v} onChange={onChange} />
    : <input className="cfg-input" type="date" value={v} onChange={(e) => onChange(e.target.value)} />;
  return (
    <div data-screen-label="ยกเลิกเช็ค">
      <div className="page-actions">
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกเช็ค</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ค้นหาเช็คที่ออกแล้ว เลือกรายการ ระบุเหตุผลและวิธียกเลิก แล้วกดยกเลิกเช็ค</div>
        </div>
        <button className={'btn sm' + (picked.length ? ' primary danger' : '')} style={{ marginLeft: 'auto' }} disabled={!picked.length || missing} onClick={() => setAsk(true)}>
          <Icon name="close-circle" /> ยกเลิกเช็ค{picked.length ? ' (' + picked.length + ')' : ''}
        </button>
      </div>

      <div className="search-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div className="ap-field"><span className="ap-label">ตั้งแต่วันที่</span><DateIn v={f.from} onChange={(v) => set('from', v)} /></div>
          <div className="ap-field"><span className="ap-label">ถึงวันที่</span><DateIn v={f.to} onChange={(v) => set('to', v)} /></div>
          <div className="ap-field"><span className="ap-label">เลขที่เช็ค</span>
            <input className="cfg-input mono" value={f.chequeNo} placeholder="ระบุเลขที่เช็ค" onChange={(e) => set('chequeNo', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }} /></div>
          <div className="ap-field"><span className="ap-label">ธนาคาร</span>
            <select className="cfg-input" value={f.bank} onChange={(e) => set('bank', e.target.value)}>
              <option value="">ทุกธนาคาร</option>{banks.map(b => <option key={b} value={b}>{b}</option>)}
            </select></div>
          <div className="ap-field"><span className="ap-label">สาขา</span>
            <select className="cfg-input" value={f.branch} onChange={(e) => set('branch', e.target.value)}>
              <option value="">ทุกสาขา</option>{branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary pa-tb-btn" onClick={doSearch}>ค้นหา</button>
            <button className="btn pa-tb-btn" onClick={doReset}>รีเซ็ต</button>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการเช็คในระบบ</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>เลือก {picked.length}/{shown.length} รายการ{picked.length ? ' · รวม ' + fmt.money(total, 2) + ' บาท' : ''}</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th className="center" style={{ width: 44 }}><input type="checkbox" checked={allOn} onChange={(e) => toggleAll(e.target.checked)} aria-label="เลือกทั้งหมด" /></th>
              <th className="center" style={{ width: 60 }}>ลำดับ</th>
              <th style={{ width: 110 }}>เลขที่เช็ค</th>
              <th className="center" style={{ width: 110 }}>วันที่หน้าเช็ค</th>
              <th style={{ width: 150 }}>ธนาคาร / สาขา</th>
              <th style={{ minWidth: 220 }}>สั่งจ่าย</th>
              <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
              <th style={{ width: 190 }}>เหตุผล</th>
              <th style={{ width: 170 }}>วิธียกเลิก</th>
            </tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={9} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {shown.map((r, i) => {
                const s = sel[r.chequeNo];
                return (
                  <tr key={r.chequeNo} className={s ? 'selected' : undefined}>
                    <td className="center"><input type="checkbox" checked={!!s} onChange={(e) => toggle(r, e.target.checked)} aria-label={'เลือกเช็ค ' + r.chequeNo} /></td>
                    <td className="center mono">{i + 1}</td>
                    <td className="mono"><b>{r.chequeNo}</b></td>
                    <td className="center mono">{fmt.date(r.date)}</td>
                    <td style={{ fontSize: 12 }}>{r.bank}<div className="muted" style={{ fontSize: 11 }}>{r.branch}</div></td>
                    <td>{r.payee}</td>
                    <td className="right mono">{fmt.money(r.amount, 2)}</td>
                    <td>
                      <select className={'cfg-input' + (s && !s.reason ? ' error' : '')} style={{ height: 32 }} disabled={!s} value={s ? s.reason : ''} onChange={(e) => setPick(r.chequeNo, 'reason', e.target.value)}>
                        <option value="">— เลือกเหตุผล —</option>{reasons.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="cfg-input" style={{ height: 32 }} disabled={!s} value={s ? s.mode : 'void'} onChange={(e) => setPick(r.chequeNo, 'mode', e.target.value)}>
                        {CI_CX_MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        {missing && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> กรุณาเลือกเหตุผลให้ครบทุกรายการที่เลือก</div>}
      </div>

      {ask && window.DepConfirmModal && (
        <window.DepConfirmModal title="ยืนยันการยกเลิกเช็ค" okLabel="ยืนยันยกเลิกเช็ค" tone="danger"
          lines={[['จำนวนเช็ค', picked.length + ' ใบ'], ['เลขที่เช็ค', picked.map(r => r.chequeNo).join(', ')], ['จำนวนเงินรวม', fmt.money(total, 2) + ' บาท']]}
          onOk={doCancel} onClose={() => setAsk(false)} />
      )}
    </div>
  );
}

Object.assign(window, {
  ChequeMultiSlipPage, ChequeMultiSlipCbtPage, ChequeSplitPage,
  ChequePrintPage, ChequeCancelRemitPage, ChequeStatusPage, ChequeCancelPage,
});
