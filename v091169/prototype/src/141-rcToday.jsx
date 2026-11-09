// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › พิมพ์ใบเสร็จ
//   • ใบเสร็จการเงิน            (RcFinReceiptPage)
//   • ใบหักภาษี ณ ที่จ่าย        (RcWhtCertPage)
// ════════════════════════════════════════════════════════════════════
const { useState: rcUseState, useMemo: rcUseMemo } = React;

const rcToday = () => window.DEPOSIT_WORKING_DATE || '2026-06-02';
const rcThai = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${Number(y) + 543}`; };
const rcMoney = (n, d = 2) => (window.fmt ? window.fmt.money(n, d) : Number(n).toFixed(d));
const rcMembers = () => (window.DN_MEMBERS || []);
const rcName = (m) => (window.msFullName ? window.msFullName(m) : (m && m.name) || '');

function rcRng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const rcSeed = (str) => String(str).split('').reduce((a, c) => a + c.charCodeAt(0) * 13, 41);

const RC_SYSTEMS = [
  { v: 'finance', l: 'การเงิน' },
  { v: 'loan',    l: 'สินเชื่อ' },
  { v: 'deposit', l: 'เงินฝาก' },
  { v: 'share',   l: 'หุ้น' },
  { v: 'welfare', l: 'สวัสดิการ' },
];
const RC_MEMBER_TYPES = [
  { v: 'member',    l: 'สมาชิก' },
  { v: 'associate', l: 'สมาชิกสมทบ' },
  { v: 'external',  l: 'บุคคลภายนอก' },
];
const RC_ITEMS = {
  finance: ['รับชำระหนี้เงินกู้สามัญ', 'รับค่าหุ้นรายเดือน', 'รับชำระดอกเบี้ยเงินกู้', 'รับเงินค่าธรรมเนียม'],
  loan:    ['รับชำระเงินกู้ฉุกเฉิน', 'รับชำระเงินกู้สามัญ', 'รับชำระเบี้ยประกันเงินกู้'],
  deposit: ['รับฝากออมทรัพย์', 'รับฝากออมทรัพย์พิเศษ', 'รับฝากประจำ 12 เดือน'],
  share:   ['รับค่าหุ้นรายเดือน', 'รับซื้อหุ้นเพิ่ม'],
  welfare: ['รับคืนเงินสวัสดิการ', 'รับเงินสงเคราะห์ล่วงหน้า'],
};
const RC_OPERATORS = ['สุนิสา ทองแท้', 'วิสุทธิ์ เจริญพร', 'นารี กมล', 'ประยุทธ มานะ'];

// ── ใบเสร็จของวันที่/ระบบที่เลือก (demo, deterministic) ───────────────
function rcReceiptsOf({ system, date, memberType }) {
  const rnd = rcRng(rcSeed(system + date + memberType) || 97);
  const be = String(Number(date.slice(0, 4)) + 543).slice(2);
  const mm = date.slice(5, 7);
  const pool = rcMembers().slice(0, 14);
  const items = RC_ITEMS[system] || RC_ITEMS.finance;
  let seq = 2100 + Math.floor(rnd() * 400);
  return pool.slice(0, 5 + Math.floor(rnd() * 4)).map((m, i) => {
    seq += 1 + Math.floor(rnd() * 9);
    return {
      key: `${system}-${i}`,
      voucher: `RV${be}${mm}-${String(seq).padStart(5, '0')}`,
      receipt: `RC${be}${mm}-${String(seq + 400).padStart(5, '0')}`,
      member: m,
      item: items[Math.floor(rnd() * items.length)],
      amount: Math.round((500 + rnd() * 48000) * 100) / 100,
      by: RC_OPERATORS[Math.floor(rnd() * RC_OPERATORS.length)],
      printed: rnd() < 0.3,
    };
  });
}

function RcFinReceiptPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'พิมพ์ใบเสร็จการเงิน', current: true }], []);
  const [system, setSystem] = rcUseState('finance');
  const [date, setDate] = rcUseState(rcToday());
  const [memberType, setMemberType] = rcUseState('member');
  const [memberNo, setMemberNo] = rcUseState('');
  const [receiptNo, setReceiptNo] = rcUseState('');
  const [rows, setRows] = rcUseState(null);
  const [sel, setSel] = rcUseState({});
  const [preview, setPreview] = rcUseState(null);

  const search = () => {
    let r = rcReceiptsOf({ system, date, memberType });
    if (memberNo.trim()) r = r.filter(x => String(x.member.code).includes(memberNo.trim()));
    if (receiptNo.trim()) r = r.filter(x => x.receipt.toLowerCase().includes(receiptNo.trim().toLowerCase()));
    setRows(r); setSel({});
  };
  const clear = () => { setMemberNo(''); setReceiptNo(''); setRows(null); setSel({}); };

  const list = rows || [];
  const selKeys = Object.keys(sel).filter(k => sel[k]);
  const allSel = list.length > 0 && list.every(r => sel[r.key]);
  const toggleAll = () => setSel(allSel ? {} : Object.fromEntries(list.map(r => [r.key, true])));
  const total = list.filter(r => sel[r.key]).reduce((a, r) => a + r.amount, 0);

  const openPreview = () => setPreview(list.filter(r => sel[r.key]));
  const doPrint = () => {
    setRows(prev => (prev || []).map(r => (sel[r.key] ? { ...r, printed: true } : r)));
    window.rcsPrintDocs && window.rcsPrintDocs(onToast);
    setPreview(null); setSel({});
  };

  return (
    <div data-screen-label="หน้าพิมพ์ใบเสร็จการเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>พิมพ์ใบเสร็จการเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            เลือกระบบงานต้นทางและวันที่ทำรายการ เพื่อค้นหาใบเสร็จรับเงินที่ออกไว้ แล้วเลือกรายการที่ต้องการสั่งพิมพ์
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{rcThai(rcToday())}</span>
        </div>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>เงื่อนไขการค้นหา</h3>
        </div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <label className="ap-field">
            <span className="ap-label">เลือกระบบ</span>
            <select className="cfg-input" value={system} onChange={e => { setSystem(e.target.value); setRows(null); }}>
              {RC_SYSTEMS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
          <label className="ap-field">
            <span className="ap-label">ข้อมูลวันที่</span>
            <ErpDate value={date} onChange={(v) => (e => { setDate(e.target.value); setRows(null); })({ target: { value: v } })} className="cfg-input" />
          </label>
          <label className="ap-field">
            <span className="ap-label">ประเภทสมาชิก</span>
            <select className="cfg-input" value={memberType} onChange={e => { setMemberType(e.target.value); setRows(null); }}>
              {RC_MEMBER_TYPES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
          <label className="ap-field">
            <span className="ap-label">เลขที่สมาชิก</span>
            <input className="cfg-input mono" value={memberNo} placeholder="เช่น 050123"
                   onChange={e => setMemberNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          </label>
          <label className="ap-field" style={{ gridColumn: 'span 2' }}>
            <span className="ap-label">เลขที่ใบเสร็จ</span>
            <input className="cfg-input mono" value={receiptNo} placeholder="เช่น RC6906-02540"
                   onChange={e => setReceiptNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          </label>
          <div className="ap-field" style={{ gridColumn: 'span 2', alignSelf: 'end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={search}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={clear}><Icon name="close" /> ล้างเงื่อนไข</button>
            </div>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head">
          <span className="head-bar" /><h3>รายการใบเสร็จ</h3>
          <span className="muted" style={{ fontSize: 11 }}>
            {rows ? `พบ ${list.length} รายการ · ระบบ${(RC_SYSTEMS.find(s => s.v === system) || {}).l} · ${rcThai(date)}` : 'ยังไม่ได้ค้นหา'}
          </span>
        </div>

        {!rows ? (
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="receipt" size={26} /></div>
            ระบุเงื่อนไขด้านบนแล้วกด “ค้นหา” เพื่อแสดงรายการใบเสร็จ
          </div>
        ) : (
          <>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}>
                      <input type="checkbox" className="ct-check" checked={allSel} disabled={list.length === 0}
                             onChange={toggleAll} aria-label="เลือกทั้งหมด" />
                    </th>
                    <th style={{ width: 140 }}>เลขที่ใบสำคัญ</th>
                    <th style={{ width: 110 }}>เลขสมาชิก</th>
                    <th style={{ minWidth: 190 }}>ชื่อ – สกุล</th>
                    <th style={{ minWidth: 240 }}>รายการ</th>
                    <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
                    <th className="center" style={{ width: 100 }}>สถานะพิมพ์</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.key} className={sel[r.key] ? 'sel' : ''}>
                      <td className="center">
                        <input type="checkbox" className="ct-check" checked={!!sel[r.key]}
                               onChange={() => setSel(p => ({ ...p, [r.key]: !p[r.key] }))} aria-label={`เลือก ${r.receipt}`} />
                      </td>
                      <td className="mono">{r.voucher}</td>
                      <td className="mono">{r.member.code}</td>
                      <td>{rcName(r.member)}</td>
                      <td>
                        <div>{r.item}</div>
                        <div className="muted" style={{ fontSize: 11 }}>ใบเสร็จ <span className="mono">{r.receipt}</span> · โดย {r.by}</div>
                      </td>
                      <td className="right mono">{rcMoney(r.amount)}</td>
                      <td className="center">
                        {r.printed ? <span className="pill ok">พิมพ์แล้ว</span> : <span className="pill neutral">ยังไม่พิมพ์</span>}
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan="7" className="center muted" style={{ padding: 28 }}>ไม่พบใบเสร็จตามเงื่อนไขที่ระบุ</td></tr>
                  )}
                </tbody>
              </table>
            </div></div>

            <div className="ct-actionbar">
              <Icon name="info" size={13} />
              <span className="muted" style={{ fontSize: 12 }}>
                {selKeys.length > 0
                  ? <>เลือก <b style={{ color: 'var(--text)' }}>{selKeys.length}</b> ฉบับ · รวม <b className="mono" style={{ color: 'var(--text)' }}>฿ {rcMoney(total)}</b></>
                  : 'เลือกใบเสร็จที่ต้องการพิมพ์'}
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn primary" disabled={selKeys.length === 0} onClick={openPreview}>
                <Icon name="print" /> ดูตัวอย่าง / พิมพ์{selKeys.length > 0 ? ` (${selKeys.length})` : ''}
              </button>
            </div>
          </>
        )}
      </div>

      {preview && (
        <RcSheetPreviewModal
          title="ตัวอย่างใบเสร็จรับเงิน" subtitle="ระบบการเงิน · ใบเสร็จการเงิน"
          docs={preview.map(r => <RcReceiptDoc key={r.key} rec={{ ...r, receiptDate: date }} />)}
          onClose={() => setPreview(null)} onPrint={doPrint} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ใบหักภาษี ณ ที่จ่าย
// ════════════════════════════════════════════════════════════════════
const RC_WHT_FORMS = [
  { v: 'coop',  l: 'จากสหกรณ์' },
  { v: 'payee', l: 'หนังสือสำหรับผู้ถูกหักภาษี ณ ที่จ่าย' },
  { v: 'payer', l: 'หนังสือสำหรับผู้หักภาษี ณ ที่จ่าย' },
];

function rcWhtRows({ from, to, memberType }) {
  const rnd = rcRng(rcSeed(from + to + memberType) || 61);
  const be = String(Number(from.slice(0, 4)) + 543).slice(2);
  const mm = from.slice(5, 7);
  let seq = 700 + Math.floor(rnd() * 200);
  return rcMembers().slice(0, 6 + Math.floor(rnd() * 3)).map((m, i) => {
    seq += 1 + Math.floor(rnd() * 7);
    const amount = Math.round((8000 + rnd() * 320000) * 100) / 100;
    return {
      key: `wht-${i}`,
      no: i + 1,
      txnNo: `TX${be}${mm}-${String(seq).padStart(5, '0')}`,
      member: m,
      taxId: String(3100000000000 + Math.floor(rnd() * 899999999999)),
      amount,
      tax: Math.round(amount * 0.01 * 100) / 100,
      date: from,
    };
  });
}

function RcWhtCertPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'พิมพ์ใบหักภาษี ณ ที่จ่าย', current: true }], []);
  const [from, setFrom] = rcUseState(rcToday());
  const [to, setTo] = rcUseState(rcToday());
  const [txnNo, setTxnNo] = rcUseState('');
  const [memberType, setMemberType] = rcUseState('member');
  const [memberFrom, setMemberFrom] = rcUseState('');
  const [memberTo, setMemberTo] = rcUseState('');
  const [forms, setForms] = rcUseState({ payee: true });
  const [rows, setRows] = rcUseState(null);
  const [sel, setSel] = rcUseState({});
  const [preview, setPreview] = rcUseState(null);

  const search = () => {
    let r = rcWhtRows({ from, to, memberType });
    if (txnNo.trim()) r = r.filter(x => x.txnNo.toLowerCase().includes(txnNo.trim().toLowerCase()));
    if (memberFrom.trim()) r = r.filter(x => String(x.member.code) >= memberFrom.trim());
    if (memberTo.trim()) r = r.filter(x => String(x.member.code) <= memberTo.trim());
    setRows(r.map((x, i) => ({ ...x, no: i + 1 }))); setSel({});
  };

  const list = rows || [];
  const selKeys = Object.keys(sel).filter(k => sel[k]);
  const allSel = list.length > 0 && list.every(r => sel[r.key]);
  const pickedForms = RC_WHT_FORMS.filter(f => forms[f.v]);
  const totalTax = list.filter(r => sel[r.key]).reduce((a, r) => a + r.tax, 0);

  const openPreview = () => setPreview(list.filter(r => sel[r.key]));
  const doPrint = () => {
    window.rcsPrintDocs && window.rcsPrintDocs(onToast);
    setPreview(null); setSel({});
  };

  return (
    <div data-screen-label="หน้าพิมพ์ใบหักภาษี ณ ที่จ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>พิมพ์ใบหักภาษี ณ ที่จ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ค้นหาใบทำรายการที่มีการหักภาษี ณ ที่จ่ายตามช่วงวันที่ แล้วเลือกแบบหนังสือที่ต้องการพิมพ์
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{rcThai(rcToday())}</span>
        </div>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>เงื่อนไขการค้นหา</h3>
        </div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <label className="ap-field">
            <span className="ap-label">ตั้งแต่วันที่</span>
            <ErpDate value={from} onChange={(v) => (e => { setFrom(e.target.value); setRows(null); })({ target: { value: v } })} className="cfg-input" />
          </label>
          <label className="ap-field">
            <span className="ap-label">ถึงวันที่</span>
            <ErpDate value={to} onChange={(v) => (e => { setTo(e.target.value); setRows(null); })({ target: { value: v } })} className="cfg-input" />
          </label>
          <label className="ap-field" style={{ gridColumn: 'span 2' }}>
            <span className="ap-label">เลขที่ใบทำรายการ</span>
            <input className="cfg-input mono" value={txnNo} placeholder="เช่น TX6906-00712"
                   onChange={e => setTxnNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          </label>
          <label className="ap-field">
            <span className="ap-label">ประเภทสมาชิก</span>
            <select className="cfg-input" value={memberType} onChange={e => { setMemberType(e.target.value); setRows(null); }}>
              {RC_MEMBER_TYPES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
          <div className="ap-field" style={{ gridColumn: 'span 2' }}>
            <span className="ap-label">เลขที่สมาชิก (ตั้งแต่ – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono" value={memberFrom} placeholder="050000" onChange={e => setMemberFrom(e.target.value)} />
              <span className="muted">–</span>
              <input className="cfg-input mono" value={memberTo} placeholder="059999" onChange={e => setMemberTo(e.target.value)} />
            </div>
          </div>
          <div className="ap-field" style={{ alignSelf: 'end' }}>
            <button className="btn primary block" onClick={search}><Icon name="search" /> ค้นหา</button>
          </div>
        </div>

        <div className="section" style={{ marginTop: 14 }}>
          <div className="section-head">
            <span className="head-bar" /><h3>แบบหนังสือที่ต้องการพิมพ์</h3>
            <span className="muted" style={{ fontSize: 11 }}>เลือกได้มากกว่าหนึ่งแบบ</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, paddingTop: 4 }}>
            {RC_WHT_FORMS.map(f => (
              <label key={f.v} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, cursor: 'pointer' }}>
                <input type="checkbox" className="ct-check" checked={!!forms[f.v]}
                       onChange={() => setForms(p => ({ ...p, [f.v]: !p[f.v] }))} />
                {f.l}
              </label>
            ))}
          </div>
          {pickedForms.length === 0 && (
            <div className="ap-hint" style={{ marginTop: 8, color: 'var(--danger)' }}>
              <Icon name="info" size={13} /> กรุณาเลือกแบบหนังสืออย่างน้อยหนึ่งรายการก่อนสั่งพิมพ์
            </div>
          )}
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head">
          <span className="head-bar" /><h3>รายการใบสำคัญจ่าย</h3>
          <span className="muted" style={{ fontSize: 11 }}>
            {rows ? `พบ ${list.length} รายการ · ${rcThai(from)} – ${rcThai(to)}` : 'ยังไม่ได้ค้นหา'}
          </span>
        </div>

        {!rows ? (
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="receipt" size={26} /></div>
            ระบุช่วงวันที่แล้วกด “ค้นหา” เพื่อแสดงรายการที่มีการหักภาษี ณ ที่จ่าย
          </div>
        ) : (
          <>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}>
                      <input type="checkbox" className="ct-check" checked={allSel} disabled={list.length === 0}
                             onChange={() => setSel(allSel ? {} : Object.fromEntries(list.map(r => [r.key, true])))}
                             aria-label="เลือกทั้งหมด" />
                    </th>
                    <th className="center" style={{ width: 60 }}>ลำดับ</th>
                    <th style={{ width: 150 }}>เลขที่ใบทำรายการ</th>
                    <th style={{ minWidth: 230 }}>ผู้เสียภาษี</th>
                    <th style={{ width: 160 }}>เลขผู้เสียภาษี</th>
                    <th className="right" style={{ width: 140 }}>จำนวนเงิน</th>
                    <th className="right" style={{ width: 120 }}>ภาษี</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(r => (
                    <tr key={r.key} className={sel[r.key] ? 'sel' : ''}>
                      <td className="center">
                        <input type="checkbox" className="ct-check" checked={!!sel[r.key]}
                               onChange={() => setSel(p => ({ ...p, [r.key]: !p[r.key] }))} aria-label={`เลือก ${r.txnNo}`} />
                      </td>
                      <td className="center mono">{r.no}</td>
                      <td className="mono">{r.txnNo}</td>
                      <td>
                        <div>{rcName(r.member)}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          <span className="mono">{r.member.code}</span> · {rcThai(r.date)}
                        </div>
                      </td>
                      <td className="mono">{r.taxId}</td>
                      <td className="right mono">{rcMoney(r.amount)}</td>
                      <td className="right mono">{rcMoney(r.tax)}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan="7" className="center muted" style={{ padding: 28 }}>ไม่พบรายการหักภาษี ณ ที่จ่ายในช่วงวันที่ที่ระบุ</td></tr>
                  )}
                </tbody>
              </table>
            </div></div>

            <div className="ct-actionbar">
              <Icon name="info" size={13} />
              <span className="muted" style={{ fontSize: 12 }}>
                {selKeys.length > 0
                  ? <>เลือก <b style={{ color: 'var(--text)' }}>{selKeys.length}</b> รายการ · ภาษีรวม <b className="mono" style={{ color: 'var(--text)' }}>฿ {rcMoney(totalTax)}</b></>
                  : 'เลือกรายการที่ต้องการพิมพ์หนังสือรับรอง'}
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn primary" disabled={selKeys.length === 0 || pickedForms.length === 0} onClick={openPreview}>
                <Icon name="print" /> ดูตัวอย่าง / พิมพ์{selKeys.length > 0 ? ` (${selKeys.length})` : ''}
              </button>
            </div>
          </>
        )}
      </div>

      {preview && (
        <RcSheetPreviewModal
          title="ตัวอย่างหนังสือรับรองการหักภาษี ณ ที่จ่าย"
          subtitle={pickedForms.map(f => f.l).join(' · ')}
          docs={preview.flatMap(r => pickedForms.map(f => (
            <RcWhtDoc key={r.key + f.v} rec={r} form={f.v} />
          )))}
          onClose={() => setPreview(null)} onPrint={doPrint} />
      )}
    </div>
  );
}

Object.assign(window, { RcFinReceiptPage, RcWhtCertPage });
