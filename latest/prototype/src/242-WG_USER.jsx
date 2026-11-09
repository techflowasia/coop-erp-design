// ════════════════════════════════════════════════════════════════════
//  ทุนสวัสดิการ / เงินช่วยเหลือ — WelfareGrantPage  (TOR 8.3)
//  ระบบงานสวัสดิการสมาชิก › การทำงาน
//  แท็บ: ทุน/เงินช่วยเหลือ (เสนอ→อนุมัติ→ใบสำคัญจ่าย) · สวัสดิการวันเกิดอัตโนมัติ
// ════════════════════════════════════════════════════════════════════

const WG_USER = 'จันทร์เพ็ญ มาลี';

function wgLoad() {
  try { const s = localStorage.getItem('welfare_grants'); if (s) return JSON.parse(s); } catch (e) {}
  return window.WG_SEED.map(r => ({ ...r }));
}
function wgSaveLS(list) { try { localStorage.setItem('welfare_grants', JSON.stringify(list)); } catch (e) {} }

function WgField({ label, required, children, full }) {
  return (
    <div className="sr-field" style={full ? { gridColumn: '1 / -1' } : null}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}</label>
      {children}
    </div>
  );
}

// ─── Drawer สร้าง/แก้ไขทุน-เงินช่วยเหลือ ──────────────────────────────
function WgDrawer({ list, rec, onClose, onSave }) {
  const isNew = !rec;
  const [member, setMember] = useState(rec && rec.memberCode ? { code: rec.memberCode, name: rec.memberName } : null);
  const [f, setF] = useState(() => rec ? { ...rec } : {
    type: 'public', title: '', org: 'โรงเรียนในพื้นที่', amount: '', reqDate: new Date().toISOString().slice(0, 10), note: '', status: 'proposed',
  });
  const [err, setErr] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setErr(''); };
  const isMemberType = f.type === 'aid';

  const submit = () => {
    if (!f.title.trim()) return setErr('กรุณาระบุชื่อรายการ/วัตถุประสงค์');
    if (!(Number(f.amount) > 0)) return setErr('กรุณาระบุจำนวนเงิน');
    if (isMemberType && !member) return setErr('กรุณาเลือกสมาชิกผู้รับเงินช่วยเหลือ');
    onSave({
      ...f, id: f.id || window.wgNextNo(list, 2569), amount: Number(f.amount) || 0, title: f.title.trim(),
      org: isMemberType ? '' : f.org, memberCode: isMemberType ? member.code : '', memberName: isMemberType ? member.name : '',
      voucherNo: f.voucherNo || '', payDate: f.payDate || '', by: WG_USER,
    }, isNew);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: 500 }}>
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}><Icon name="shield" /></div>
          <div style={{ minWidth: 0 }}><h2 style={{ margin: 0 }}>{isNew ? 'เสนอทุน / เงินช่วยเหลือ' : 'แก้ไขรายการ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>เสนอผู้บริหารก่อนออกใบสำคัญจ่าย</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {err && <div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {err}</div>}
          <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <WgField label="ประเภท" required>
              <select className="cfg-input" value={f.type} onChange={(e) => set('type', e.target.value)}>
                {window.WG_TYPES.filter(t => t.v !== 'birthday').map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </WgField>
            <WgField label="วันที่เสนอ"><ErpDate value={f.reqDate} onChange={(v) => ((e) => set('reqDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></WgField>
            <WgField label="ชื่อรายการ / วัตถุประสงค์" required full>
              <input className="cfg-input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="เช่น สนับสนุนทุนอาหารกลางวันโรงเรียน…" />
            </WgField>
            {isMemberType ? (
              <WgField label="สมาชิกผู้รับเงินช่วยเหลือ" required full>
                <MemberSearchField member={member} onPick={(m) => { setMember(window.MEMBERS_LIST.find(x => x.code === m.code) || m); setErr(''); }} source={window.MEMBERS_LIST} title="ค้นหาสมาชิก" />
              </WgField>
            ) : (
              <WgField label="หน่วยงานที่ให้ทุน" full>
                <select className="cfg-input" value={f.org} onChange={(e) => set('org', e.target.value)}>
                  {window.WG_ORGS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </WgField>
            )}
            <WgField label="จำนวนเงิน (บาท)" required full>
              <input className="cfg-input mono" type="number" min="0" value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" />
            </WgField>
            <WgField label="หมายเหตุ" full>
              <textarea className="cfg-input" rows={3} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="รายละเอียดประกอบการพิจารณา…" />
            </WgField>
          </div>
          <div className="col-gap" style={{ marginTop: 20, borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
            <button className="btn" onClick={onClose}>ยกเลิก</button><span style={{ flex: 1 }} />
            <button className="btn primary" onClick={submit}><Icon name="check" /> {isNew ? 'เสนอผู้บริหาร' : 'บันทึก'}</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function WelfareGrantPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [tab, setTab] = useState('grant');
  const [list, setList] = useState(wgLoad);
  const [drawer, setDrawer] = useState(null);
  const [batch, setBatch] = useState(() => window.WG_BIRTHDAY_BATCH.members.map(m => ({ ...m })));
  const persist = (next) => { setList(next); wgSaveLS(next); };

  const totalApproved = list.filter(r => r.status === 'voucher').reduce((s, r) => s + r.amount, 0);
  const proposedCnt = list.filter(r => r.status === 'proposed').length;

  const save = (rec, isNew) => {
    persist(isNew ? [rec, ...list] : list.map(r => r.id === rec.id ? rec : r));
    audit.log({ action: isNew ? 'create' : 'update', module: 'สวัสดิการ — ทุน/เงินช่วยเหลือ', target: `${rec.id} · ${rec.title}`,
      summary: isNew ? `เสนอ${window.wgType(rec.type).l} ${rec.id} · ${fmt.money(rec.amount, 0)} บาท` : `แก้ไขรายการ ${rec.id}`,
      changes: [{ field: 'รายการ', before: '—', after: rec.title }, { field: 'จำนวนเงิน', before: '—', after: fmt.money(rec.amount, 2) + ' บาท' }] });
    onToast && onToast(isNew ? `เสนอรายการ ${rec.id} เรียบร้อยแล้ว` : `บันทึก ${rec.id} เรียบร้อยแล้ว`);
    setDrawer(null);
  };

  const advance = (rec) => {
    const next = rec.status === 'proposed' ? 'approved' : rec.status === 'approved' ? 'voucher' : rec.status;
    const upd = { ...rec, status: next };
    if (next === 'voucher') { upd.voucherNo = 'PV-2569-' + String(Math.floor(Math.random() * 900) + 100).padStart(5, '0'); upd.payDate = new Date().toISOString().slice(0, 10); }
    persist(list.map(r => r.id === rec.id ? upd : r));
    const label = next === 'approved' ? 'อนุมัติ' : 'ออกใบสำคัญจ่าย';
    audit.log({ action: 'status', module: 'สวัสดิการ — ทุน/เงินช่วยเหลือ', target: `${rec.id} · ${rec.title}`,
      summary: `${label} ${rec.id} · ${fmt.money(rec.amount, 0)} บาท`, changes: [{ field: 'สถานะ', before: window.wgStatus(rec.status).l, after: window.wgStatus(next).l }] });
    onToast && onToast(`${label} ${rec.id} เรียบร้อยแล้ว`);
  };

  // จ่ายสวัสดิการวันเกิด (อัตโนมัติ)
  const payBirthday = (code) => {
    setBatch(b => b.map(m => m.code === code ? { ...m, paid: true } : m));
    const m = batch.find(x => x.code === code);
    audit.log({ action: 'create', module: 'สวัสดิการ — สวัสดิการวันเกิด', target: `${m.code} · ${m.name}`,
      summary: `โอนสวัสดิการวันเกิด ${fmt.money(window.wgBirthdayAmount(m.years), 0)} บาท เข้าบัญชี ${m.account}`,
      changes: [{ field: 'จำนวนเงิน', before: '—', after: fmt.money(window.wgBirthdayAmount(m.years), 0) + ' บาท' }] });
    onToast && onToast(`โอนสวัสดิการวันเกิดให้ ${m.name} แล้ว`);
  };
  const payAllBirthday = () => {
    const unpaid = batch.filter(m => !m.paid);
    if (!unpaid.length) { onToast && onToast('จ่ายครบทุกรายแล้ว'); return; }
    setBatch(b => b.map(m => ({ ...m, paid: true })));
    const sum = unpaid.reduce((s, m) => s + window.wgBirthdayAmount(m.years), 0);
    audit.log({ action: 'create', module: 'สวัสดิการ — สวัสดิการวันเกิด', target: window.WG_BIRTHDAY_BATCH.monthLabel,
      summary: `ประมวลผลโอนสวัสดิการวันเกิดอัตโนมัติ ${unpaid.length} ราย · รวม ${fmt.money(sum, 0)} บาท`,
      changes: [{ field: 'จำนวนราย', before: '—', after: String(unpaid.length) }, { field: 'ยอดรวม', before: '—', after: fmt.money(sum, 2) + ' บาท' }] });
    onToast && onToast(`โอนสวัสดิการวันเกิดอัตโนมัติ ${unpaid.length} ราย เรียบร้อยแล้ว`);
  };

  const bdayTotal = batch.reduce((s, m) => s + window.wgBirthdayAmount(m.years), 0);
  const bdayPaid = batch.filter(m => m.paid).length;

  return (
    <div data-screen-label="หน้าทุนสวัสดิการและเงินช่วยเหลือ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ทุนสวัสดิการ / เงินช่วยเหลือ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ทุนสาธารณประโยชน์ เงินช่วยเหลือสมาชิก และสวัสดิการวันเกิดอัตโนมัติ</div>
        </div>
        <span className="spacer" />
        {tab === 'grant' && <button className="btn primary sm" onClick={() => setDrawer({})}><Icon name="plus" /> เสนอทุน/เงินช่วยเหลือ</button>}
      </div>

      <div className="tabs-bar" style={{ marginBottom: 12 }}>
        <button className={"tab" + (tab === 'grant' ? ' active' : '')} onClick={() => setTab('grant')}>ทุน / เงินช่วยเหลือ <span className="count">{list.length}</span></button>
        <button className={"tab" + (tab === 'birthday' ? ' active' : '')} onClick={() => setTab('birthday')}>สวัสดิการวันเกิด <span className="count">{batch.length}</span></button>
      </div>

      {tab === 'grant' ? (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-grid-head"><div><div className="sh-grid-title">ทุนสาธารณประโยชน์และเงินช่วยเหลือ</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>เสนอ → ผู้บริหารอนุมัติ → ออกใบสำคัญจ่าย (ส่งข้อมูลให้ฝ่ายการเงิน)</div></div></div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>รหัส</th><th>รายการ</th><th>ประเภท</th><th>ผู้รับ / หน่วยงาน</th><th className="num">จำนวนเงิน</th><th className="center">สถานะ</th><th className="center" style={{ width: 140 }}>จัดการ</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">ยังไม่มีรายการ</td></tr>
                ) : list.map(r => {
                  const st = window.wgStatus(r.status);
                  const nextLabel = r.status === 'proposed' ? 'อนุมัติ' : r.status === 'approved' ? 'ออกใบสำคัญจ่าย' : null;
                  return (
                    <tr key={r.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{r.id}</td>
                      <td style={{ fontWeight: 500, maxWidth: 240 }}>{r.title}</td>
                      <td>{window.wgType(r.type).l}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{r.memberName ? `${r.memberName} (${r.memberCode})` : r.org}</td>
                      <td className="num mono"><b>{fmt.money(r.amount, 0)}</b></td>
                      <td className="center"><span className={"pill " + st.pill}>{st.l}</span>{r.voucherNo && <div className="muted mono" style={{ fontSize: 9, marginTop: 2 }}>{r.voucherNo}</div>}</td>
                      <td className="center">
                        <div style={{ display: 'inline-flex', gap: 4 }}>
                          {r.status !== 'voucher' && <button className="bud-act" title="แก้ไข" onClick={() => setDrawer(r)}><Icon name="edit" size={13} /></button>}
                          {nextLabel && <button className="btn primary sm" style={{ padding: '0 8px', height: 26 }} onClick={() => advance(r)}>{nextLabel}</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
          <div className="sh-grid-foot muted"><Icon name="info" size={12} /> ทุกรายการต้องผ่านการเสนอและอนุมัติจากผู้บริหารก่อนออกใบสำคัญจ่าย — บันทึก Log ทุกขั้นตอนเพื่อการตรวจสอบ</div>
        </div>
      ) : (
        <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="sh-grid-head">
            <div><div className="sh-grid-title">สวัสดิการวันเกิดอัตโนมัติ — {window.WG_BIRTHDAY_BATCH.monthLabel}</div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>โอนเข้าบัญชีเงินฝากสหกรณ์อัตโนมัติ · จ่ายแล้ว {bdayPaid}/{batch.length} ราย · ยอดรวม ฿{fmt.money(bdayTotal, 0)}</div></div>
            <button className="btn primary sm" onClick={payAllBirthday}><Icon name="refresh" /> ประมวลผลโอนทั้งหมด</button>
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>สมาชิก</th><th className="center">วันเกิด</th><th className="center">อายุสมาชิก</th><th>บัญชีรับโอน</th><th className="num">จำนวนเงิน</th><th className="center">สถานะ</th><th className="center" style={{ width: 90 }}>จัดการ</th></tr></thead>
              <tbody>
                {batch.map(m => (
                  <tr key={m.code}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="row-avatar">{m.name.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
                      <div style={{ minWidth: 0 }}><div style={{ whiteSpace: 'nowrap' }}>{m.name}</div><div className="muted mono" style={{ fontSize: 10 }}>{m.code}</div></div>
                    </div></td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(m.birth)}</td>
                    <td className="center mono">{m.years} ปี</td>
                    <td className="mono" style={{ fontSize: 11 }}>{m.account}</td>
                    <td className="num mono"><b>{fmt.money(window.wgBirthdayAmount(m.years), 0)}</b></td>
                    <td className="center">{m.paid ? <span className="pill ok">โอนแล้ว</span> : <span className="pill warn">รอโอน</span>}</td>
                    <td className="center">{!m.paid && <button className="btn sm" style={{ padding: '0 8px', height: 26 }} onClick={() => payBirthday(m.code)}>โอน</button>}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="sh-grid-total"><td colSpan={4} className="right"><b>รวมทั้งเดือน</b></td><td className="num mono"><b>{fmt.money(bdayTotal, 0)}</b></td><td colSpan={2} /></tr></tfoot>
            </table>
          </div></div>
          <div className="sh-grid-foot muted"><Icon name="info" size={12} /> อัตราตามอายุการเป็นสมาชิก: ≤10 ปี ฿300 · 10–20 ปี ฿500 · 20–30 ปี ฿800 · 30 ปีขึ้นไป ฿1,200 — เก็บ Log ประวัติการโอนทุกครั้ง</div>
        </div>
      )}

      {drawer && <WgDrawer list={list} rec={drawer.id ? drawer : null} onClose={() => setDrawer(null)} onSave={save} />}
    </div>
  );
}

Object.assign(window, { WelfareGrantPage });
