// ════════════════════════════════════════════════════════════════════
//  ทำรายการหุ้นหนี้ (2021) — ระบบการเงิน (เคาน์เตอร์รับ–จ่ายเงิน)
//  รับชำระจากสมาชิก: ชำระหนี้ + ซื้อหุ้นเพิ่ม + รายการอื่น ๆ · ออกใบเสร็จ
//  โครงสร้างตามแบบฟอร์มเดิม:
//    หัวเรื่อง + ออกใบเสร็จ
//    ① การรับชำระจากสมาชิก (เลขที่ใบเสร็จ/วันที่/รหัสรายการ/สมาชิก/สังกัด
//       /ทำรายการโดย/คู่บัญชี/รวม/ออกใบเสร็จชื่อ)
//    ② รายการหนี้  ③ รายการหุ้น  ④ รายการอื่น ๆ
//  ใช้ข้อมูลสาธิตร่วมกับ data-share-refund.js (SRF_*) + SrfMemberSearchModal
//  ใช้ icr-* / sr-* / sw-* / fsr-* จาก styles.css · fmt จาก data.js
// ════════════════════════════════════════════════════════════════════

const shdToday = () => new Date().toISOString().slice(0, 10);

// รหัสรายการ (ธุรกรรมเคาน์เตอร์)
window.SHD_TXN_CODES = window.SHD_TXN_CODES || [
  { v: 'PX', l: 'PX — รับชำระหุ้น–หนี้ (เงินสด)' },
  { v: 'PT', l: 'PT — รับชำระโดยเงินโอน' },
  { v: 'PC', l: 'PC — รับชำระโดยเช็ค' },
  { v: 'PJ', l: 'PJ — ปรับปรุงรายการ' },
];
// ทำรายการโดย (พนักงานเคาน์เตอร์)
window.SHD_MAKERS = window.SHD_MAKERS || [
  'นางสาวพรทิพย์ เกษมสุข · เคาน์เตอร์ 1',
  'นายวีระ ตั้งมั่น · เคาน์เตอร์ 2',
  'นางสุดารัตน์ พงษ์ไพบูลย์ · เคาน์เตอร์ 3',
];
// สร้างแถวหุ้นเริ่มต้นจากข้อมูลสมาชิก
window.shdShareRows = (m) => {
  if (!m) return [];
  const perMonth = m.sharePerMonth || 1000;
  const periods = m.sharePeriods || Math.max(1, Math.round((m.shareBalance || 0) / perMonth));
  return [{
    detail: '01 - ทุนเรือนหุ้น', period: periods,
    perMonth, buyMore: perMonth, accumulated: m.shareBalance || 0,
  }];
};

// รหัสรายการอื่น ๆ (รับชำระ)
window.SHD_OTHER_CODES = window.SHD_OTHER_CODES || [
  { code: 'IN001', detail: 'ดอกเบี้ยรับจากเงินให้กู้' },
  { code: 'IN002', detail: 'ค่าธรรมเนียมแรกเข้า' },
  { code: 'IN003', detail: 'ค่าปรับชำระล่าช้า' },
  { code: 'IN004', detail: 'เงินรับฝากออมทรัพย์' },
];

// ─── ฟิลด์ (label เล็ก + control) ────────────────────────────────────
function ShdFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function ShdRO({ value, mono, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return <div className={'icr-ro' + (mono ? ' mono' : '') + (empty ? ' empty' : '')}>{empty ? (placeholder || '—') : value}</div>;
}

// ════════════════════════════════════════════════════════════════════
function ShdFormScreen({ onToast, audit }) {
  const today = shdToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [issueReceipt, setIssueReceipt] = useState(true);
  const [receiptDate, setReceiptDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [txnCode, setTxnCode] = useState('PX');
  const [maker, setMaker] = useState(window.SHD_MAKERS[0]);
  const [useCounter, setUseCounter] = useState(true);
  const [counterAcct, setCounterAcct] = useState(window.SRF_COUNTER_ACCTS[0]);
  const [receiptName, setReceiptName] = useState('');

  const [debts, setDebts] = useState([]);
  const [shares, setShares] = useState([]);
  const [others, setOthers] = useState([]);

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const loaded = !!member;
  const receiptNo = loaded ? window.srfNextDocNo(beYear).replace(/^RS/, 'RC') : 'Auto';

  const loadMember = (m) => {
    setMember(m);
    setReceiptName(m.name);
    setDebts((m.debts || []).map(d => ({ ...d, selected: true })));
    setShares(window.shdShareRows(m).map(s => ({ ...s, selected: true })));
    setOthers([]);
    setError(''); setSaved(false);
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };
  const clearScreen = () => {
    setMember(null); setReceiptName(''); setTxnCode('PX'); setUseCounter(true);
    setCounterAcct(window.SRF_COUNTER_ACCTS[0]); setMaker(window.SHD_MAKERS[0]);
    setDebts([]); setShares([]); setOthers([]); setError(''); setSaved(false);
  };

  // ── หนี้ ──
  const toggleDebt = (no) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, selected: !d.selected } : d)); };
  const setDebtField = (no, k, v) => { setError(''); setDebts(ds => ds.map(d => d.contractNo === no ? { ...d, [k]: v === '' ? '' : Number(v) } : d)); };
  const debtRowTotal = (d) => (Number(d.payPrincipal) || 0) + (Number(d.payInterest) || 0);
  const debtRowRemain = (d) => (Number(d.principal) || 0) - (Number(d.payPrincipal) || 0);

  // ── หุ้น ──
  const toggleShare = (i) => { setError(''); setShares(ss => ss.map((s, idx) => idx === i ? { ...s, selected: !s.selected } : s)); };
  const setShareField = (i, k, v) => { setError(''); setShares(ss => ss.map((s, idx) => idx === i ? { ...s, [k]: v === '' ? '' : Number(v) } : s)); };

  // ── อื่น ๆ ──
  const toggleOther = (i) => { setError(''); setOthers(os => os.map((o, idx) => idx === i ? { ...o, selected: !o.selected } : o)); };
  const setOtherField = (i, k, v) => {
    setError('');
    setOthers(os => os.map((o, idx) => {
      if (idx !== i) return o;
      if (k === 'code') { const def = window.SHD_OTHER_CODES.find(c => c.code === v); return { ...o, code: v, detail: def ? def.detail : o.detail }; }
      return { ...o, [k]: k === 'amount' ? (v === '' ? '' : Number(v)) : v };
    }));
  };
  const addOtherRow = () => { const def = window.SHD_OTHER_CODES[0]; setOthers(os => [...os, { code: def.code, detail: def.detail, amount: '', selected: true }]); };
  const removeOtherRow = (i) => setOthers(os => os.filter((_, idx) => idx !== i));

  // ── คำนวณยอดรวม (เงินรับ) ──
  const debtTotals = debts.reduce((a, d) => ({
    principal: a.principal + (Number(d.principal) || 0),
    interestArrears: a.interestArrears + (Number(d.interestArrears) || 0),
    interestNew: a.interestNew + (Number(d.interestNew) || 0),
    payPrincipal: a.payPrincipal + (d.selected ? (Number(d.payPrincipal) || 0) : 0),
    payInterest: a.payInterest + (d.selected ? (Number(d.payInterest) || 0) : 0),
    rowTotal: a.rowTotal + (d.selected ? debtRowTotal(d) : 0),
    remain: a.remain + debtRowRemain(d),
  }), { principal: 0, interestArrears: 0, interestNew: 0, payPrincipal: 0, payInterest: 0, rowTotal: 0, remain: 0 });

  const shareTotal = shares.reduce((s, r) => s + (r.selected ? (Number(r.buyMore) || 0) : 0), 0);
  const otherTotal = others.reduce((s, o) => s + (o.selected ? (Number(o.amount) || 0) : 0), 0);
  const grandTotal = debtTotals.rowTotal + shareTotal + otherTotal;

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขสมาชิก) ก่อนทำรายการ';
    if (!receiptDate) return 'กรุณาระบุวันที่ใบเสร็จ';
    if (!(grandTotal > 0)) return 'ยอดรวมต้องมากกว่า 0 — กรุณาระบุรายการชำระหนี้ / ซื้อหุ้น / รายการอื่น';
    if (!maker) return 'กรุณาเลือกผู้ทำรายการ';
    return '';
  };
  const doCalc = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนคำนวณ'); return; }
    setError('');
    onToast && onToast(`คำนวณแล้ว · ยอดรวมรับชำระ ${fmt.money(grandTotal, 2)} บาท (หนี้ ${fmt.money(debtTotals.rowTotal, 2)} · หุ้น ${fmt.money(shareTotal, 2)} · อื่น ๆ ${fmt.money(otherTotal, 2)})`);
  };
  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setSaved(true);
    audit && audit.log && audit.log({
      action: 'create', module: 'การเงิน — ทำรายการหุ้นหนี้',
      target: `${member.code} · ${member.name}`,
      summary: `รับชำระ ${receiptNo} · รวม ${fmt.money(grandTotal, 2)} (หนี้ ${fmt.money(debtTotals.rowTotal, 2)} · หุ้น ${fmt.money(shareTotal, 2)} · อื่น ๆ ${fmt.money(otherTotal, 2)})${issueReceipt ? ' · ออกใบเสร็จ' : ''}`,
      changes: [
        { field: 'ชำระหนี้', before: '—', after: fmt.money(debtTotals.rowTotal, 2) },
        { field: 'ซื้อหุ้นเพิ่ม', before: '—', after: fmt.money(shareTotal, 2) },
        { field: 'รายการอื่น ๆ', before: '—', after: fmt.money(otherTotal, 2) },
        { field: 'ยอดรวมรับชำระ', before: '—', after: fmt.money(grandTotal, 2) },
        { field: 'ออกใบเสร็จ', before: '—', after: issueReceipt ? 'ใช่' : 'ไม่' },
      ],
    });
    onToast && onToast(`บันทึกการรับชำระ ${receiptNo} · ${member.name} เรียบร้อยแล้ว`);
  };
  const doPrint = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบเสร็จรับเงิน…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="ทำรายการหุ้นหนี้">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="receipt" size={20} /></span>
          <div>
            <h1>ทำรายการหุ้นหนี้</h1>
            <div className="icr-form-sub">ระบบการเงิน · เคาน์เตอร์รับ–จ่ายเงิน — รับชำระหนี้ ซื้อหุ้นเพิ่ม และรับชำระรายการอื่นจากสมาชิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <label className="fsr-check">
            <input type="checkbox" className="ch-box" checked={issueReceipt} onChange={(e) => setIssueReceipt(e.target.checked)} />
            <span>ออกใบเสร็จ</span>
          </label>
          <button className="btn primary sm" onClick={doPrint} disabled={!issueReceipt}><Icon name="print" size={13} /> พิมพ์ใบเสร็จ</button>
        </div>
      </div>

      <div className="sr-toolbar">
        <button className="btn sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหาสมาชิก</button>
        <button className="btn sm" onClick={doCalc}><Icon name="refresh" size={13} /> คำนวณยอด</button>
        <span style={{ flex: 1 }} />
        <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึกรับชำระ</button>
        <button className="btn sm danger" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {saved && !error && (
        <div className="dn-status-alert" style={{ marginBottom: 12, background: 'var(--success-50, #f6ffed)', borderColor: 'var(--success)' }}>
          <Icon name="check" size={15} />
          <span>บันทึกการรับชำระเลขที่ <b>{receiptNo}</b> เรียบร้อยแล้ว — ยอดรวม <b>{fmt.money(grandTotal, 2)}</b> บาท{issueReceipt ? ' · ออกใบเสร็จให้สมาชิกแล้ว' : ''}</span>
        </div>
      )}

      {/* ① การรับชำระจากสมาชิก */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="money" size={15} /></span>
          <h3>การรับชำระจากสมาชิก</h3>
        </div>
        <div className="icr-strip">
          <ShdFld label="เลขที่ใบเสร็จ" w={150}>
            <div className="icr-ro mono sr-locked">{receiptNo}</div>
          </ShdFld>
          <ShdFld label="วันที่ใบเสร็จ" w={160} required>
            <ErpDate value={receiptDate} onChange={(v) => ((e) => { setReceiptDate(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </ShdFld>
          <ShdFld label="วันที่รายการ" w={160}>
            <ErpDate value={txnDate} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </ShdFld>
          <ShdFld label="รหัสรายการ" w={180}>
            <select className="cfg-input" value={txnCode} onChange={(e) => setTxnCode(e.target.value)}>
              {window.SHD_TXN_CODES.map(t => <option key={t.v} value={t.v}>{t.v}</option>)}
            </select>
          </ShdFld>
        </div>
        <div className="icr-strip">
          <ShdFld label="เลขสมาชิก" w={190} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </ShdFld>
          <ShdFld label="ชื่อ-ชื่อสกุล" grow w={260} required><ShdRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></ShdFld>
        </div>
        <div className="icr-strip">
          <ShdFld label="สังกัด" grow w={360}><ShdRO value={member ? window.affilMemberLabel(member) : ''} placeholder="(ดึงอัตโนมัติ)" /></ShdFld>
        </div>

        {/* ทำรายการโดย / คู่บัญชี  +  กล่องยอดรวม */}
        <div className="shd-pay-grid">
          <div className="shd-pay-fields">
            <ShdFld label="ทำรายการโดย" grow w={280} required>
              <select className="cfg-input" value={maker} onChange={(e) => { setMaker(e.target.value); setError(''); }} disabled={!loaded}>
                {window.SHD_MAKERS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </ShdFld>
            <div className="icr-fld" style={{ flex: '1 1 0', minWidth: 280 }}>
              <span className="icr-fld-l">
                <label className="fsr-check" style={{ fontSize: 11.5 }}>
                  <input type="checkbox" className="ch-box" checked={useCounter} onChange={(e) => setUseCounter(e.target.checked)} disabled={!loaded} />
                  <span>คู่บัญชี</span>
                </label>
              </span>
              <select className="cfg-input" value={counterAcct} onChange={(e) => setCounterAcct(e.target.value)} disabled={!loaded || !useCounter}>
                {window.SRF_COUNTER_ACCTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="shd-total">
            <span className="shd-total-l">รวม</span>
            <span className="shd-total-v">{fmt.money(grandTotal, 2)}</span>
          </div>
        </div>

        <div className="icr-strip" style={{ marginTop: 4 }}>
          <ShdFld label="ออกใบเสร็จชื่อ" grow w={360}>
            <input className="cfg-input" value={receiptName} onChange={(e) => setReceiptName(e.target.value)} disabled={!loaded} placeholder="ชื่อที่ปรากฏบนใบเสร็จ" />
          </ShdFld>
        </div>
      </div>

      {/* ② รายการหนี้ */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="loans" size={15} /></span>
          <h3>รายการหนี้</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={11} /> เลือกสัญญาและระบุยอดชำระ (ต้นเงิน / ดอกเบี้ย)</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: 38 }} className="center">เลือก</th>
                <th rowSpan="2">เลขสัญญา</th>
                <th rowSpan="2" className="num">ต้นเงิน</th>
                <th colSpan="3" className="center sw-grp">ดอกเบี้ย</th>
                <th colSpan="2" className="center sw-grp shd-grp-pay">การชำระ</th>
                <th rowSpan="2" className="num">รวมชำระ</th>
                <th rowSpan="2" className="num">ต้นเงินคงเหลือ</th>
              </tr>
              <tr>
                <th className="center sw-sub">ตั้งแต่</th>
                <th className="num sw-sub">ด/บ ค้าง</th>
                <th className="num sw-sub">ด/บ ใหม่</th>
                <th className="num sw-sub shd-grp-pay">ต้นเงิน</th>
                <th className="num sw-sub shd-grp-pay">ด/บ</th>
              </tr>
            </thead>
            <tbody>
              {debts.length === 0 ? (
                <tr><td colSpan="10" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="loans" size={22} /></div>
                  {loaded ? 'สมาชิกรายนี้ไม่มีสัญญาหนี้คงค้าง' : 'เลือกสมาชิกเพื่อแสดงรายการสัญญาหนี้'}
                </td></tr>
              ) : debts.map(d => (
                <tr key={d.contractNo} className={d.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={d.selected} onChange={() => toggleDebt(d.contractNo)} /></td>
                  <td className="mono">{d.contractNo}<div className="muted" style={{ fontSize: 10 }}>{d.loanType}</div></td>
                  <td className="num mono">{fmt.money(d.principal, 2)}</td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(d.interestFrom)}</td>
                  <td className="num mono" style={{ color: d.interestArrears > 0 ? 'var(--danger)' : undefined }}>{fmt.money(d.interestArrears, 2)}</td>
                  <td className="num mono">{fmt.money(d.interestNew, 2)}</td>
                  <td className="num"><input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payPrincipal} onChange={(e) => setDebtField(d.contractNo, 'payPrincipal', e.target.value)} disabled={!d.selected} /></td>
                  <td className="num"><input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={d.payInterest} onChange={(e) => setDebtField(d.contractNo, 'payInterest', e.target.value)} disabled={!d.selected} /></td>
                  <td className="num mono"><b>{fmt.money(debtRowTotal(d), 2)}</b></td>
                  <td className="num mono">{fmt.money(debtRowRemain(d), 2)}</td>
                </tr>
              ))}
            </tbody>
            {debts.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="2" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.principal, 2)}</b></td>
                  <td />
                  <td className="num mono" style={{ color: 'var(--danger)' }}><b>{fmt.money(debtTotals.interestArrears, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.interestNew, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.payPrincipal, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.payInterest, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.rowTotal, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(debtTotals.remain, 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ③ รายการหุ้น */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="shares" size={15} /></span>
          <h3>รายการหุ้น</h3>
          <div className="icr-sec-actions"><span className="muted" style={{ fontSize: 11.5 }}><Icon name="info" size={11} /> ระบุยอด “ซื้อเพิ่ม” เพื่อเพิ่มทุนเรือนหุ้น</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th>รายละเอียด</th>
                <th className="num" style={{ width: 120 }}>งวด</th>
                <th className="num" style={{ width: 170 }}>ทุนเรือนหุ้น</th>
                <th className="num shd-grp-pay" style={{ width: 180 }}>ซื้อเพิ่ม</th>
                <th className="num" style={{ width: 190 }}>ทุนเรือนหุ้นสะสม</th>
              </tr>
            </thead>
            <tbody>
              {shares.length === 0 ? (
                <tr><td colSpan="6" className="empty-state">เลือกสมาชิกเพื่อแสดงรายการหุ้น</td></tr>
              ) : shares.map((s, i) => (
                <tr key={i} className={s.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={s.selected} onChange={() => toggleShare(i)} /></td>
                  <td>{s.detail}</td>
                  <td className="num mono">{fmt.money(s.period, 0)}</td>
                  <td className="num mono">{fmt.money(s.perMonth, 2)}</td>
                  <td className="num"><input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={s.buyMore} onChange={(e) => setShareField(i, 'buyMore', e.target.value)} disabled={!s.selected} /></td>
                  <td className="num mono"><b>{fmt.money((Number(s.accumulated) || 0) + (s.selected ? (Number(s.buyMore) || 0) : 0), 2)}</b></td>
                </tr>
              ))}
            </tbody>
            {shares.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="4" className="center"><b>รวมซื้อเพิ่ม</b></td>
                  <td className="num mono"><b>{fmt.money(shareTotal, 2)}</b></td>
                  <td className="num mono"><b>{fmt.money(shares.reduce((a, s) => a + (Number(s.accumulated) || 0) + (s.selected ? (Number(s.buyMore) || 0) : 0), 0), 2)}</b></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
      </div>

      {/* ④ รายการอื่น ๆ */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <span className="sw-sec-ico"><Icon name="receipt" size={15} /></span>
          <h3>รายการอื่น ๆ</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl sw-debt-tbl">
            <thead>
              <tr>
                <th style={{ width: 38 }} className="center">เลือก</th>
                <th style={{ width: 140 }}>รหัส</th>
                <th>รายละเอียด</th>
                <th className="num shd-grp-pay" style={{ width: 200 }}>ยอดเงินชำระ</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {others.length === 0 ? (
                <tr><td colSpan="5" className="empty-state">{loaded ? 'ยังไม่มีรายการอื่น — กด “เพิ่มแถว” เพื่อเพิ่มรายการ' : 'เลือกสมาชิกเพื่อเพิ่มรายการอื่น'}</td></tr>
              ) : others.map((o, i) => (
                <tr key={i} className={o.selected ? 'dn-row-sel' : ''}>
                  <td className="center"><input type="checkbox" className="ch-box" checked={o.selected} onChange={() => toggleOther(i)} /></td>
                  <td><select className="cfg-input sm mono" value={o.code} onChange={(e) => setOtherField(i, 'code', e.target.value)} disabled={!loaded}>{window.SHD_OTHER_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}</select></td>
                  <td><input className="cfg-input sm" value={o.detail} onChange={(e) => setOtherField(i, 'detail', e.target.value)} disabled={!loaded} /></td>
                  <td className="num"><input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={o.amount} onChange={(e) => setOtherField(i, 'amount', e.target.value)} disabled={!loaded} placeholder="0.00" /></td>
                  <td className="center"><button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => removeOtherRow(i)} title="ลบแถว"><Icon name="close" size={13} /></button></td>
                </tr>
              ))}
            </tbody>
            {others.length > 0 && (
              <tfoot>
                <tr className="sw-foot">
                  <td colSpan="3" className="center"><b>รวมทั้งสิ้น</b></td>
                  <td className="num mono"><b>{fmt.money(otherTotal, 2)}</b></td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        <button className="btn dashed block sm sr-addrow" onClick={addOtherRow} disabled={!loaded}><Icon name="plus" size={13} /> เพิ่มแถว</button>
      </div>

      {modal && <window.SrfMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

function FinanceShareDebtPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <ShdFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { FinanceShareDebtPage, ShdFormScreen });
