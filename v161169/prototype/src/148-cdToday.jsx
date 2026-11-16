// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ยกเลิกการจ่ายเงินกู้ประจำวัน (CancelDailyDisbursePage)
//  ค้นหาสมาชิก → แสดง "รายการ Slip" การจ่ายเงินกู้ในช่วงวันที่เลือก →
//  เลือก slip เพื่อดู "จ่ายเงินโดย" (วิธี/ธนาคาร/เลขที่เอกสาร ฯลฯ) และ
//  "รายละเอียดการจ่ายเงิน + จำนวนเงิน" (ถอนหุ้น/ยอดหักชำระ/รับสุทธิ) พร้อม
//  รายการ Slip การหักชำระต่องวด → กด "ยกเลิกการจ่าย" เพื่อล้างรายการวันนั้น
//  ─ ยกเลิก "ข้ามวัน" (payDate < วันทำการ) ต้องติดต่อแผนกประมวลผล (ล็อก)
//  ใช้รูปแบบกลาง: MemberSearchField · icr-strip/icr-fld/icr-ro · DN_MEMBERS
// ════════════════════════════════════════════════════════════════════

const cdToday = () => window.DEPOSIT_WORKING_DATE || '2026-07-24';
const cdAddDays = (iso, d) => { const t = new Date(iso); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10); };
const cdHash = (s) => { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) >>> 0; return h; };
const cdMoney = (v) => window.fmt.money(v || 0, 2);

// ประเภทเงินที่จ่าย
const CD_PAY_TYPES = [
  { v: 'transfer', l: 'โอนเข้าบัญชีธนาคาร' },
  { v: 'cheque',   l: 'จ่ายด้วยเช็ค' },
  { v: 'cash',     l: 'เงินสด' },
  { v: 'draft',    l: 'ตั๋วแลกเงิน / แคชเชียร์เช็ค' },
];
const cdPayTypeLabel = (v) => (CD_PAY_TYPES.find(t => t.v === v) || {}).l || v;
const CD_BANKS = ['ธ.กรุงไทย', 'ธ.กรุงเทพ', 'ธ.ออมสิน', 'ธ.กสิกรไทย', 'ธ.เพื่อการเกษตรฯ'];
const CD_BRANCHES = ['สาขาสำนักงานใหญ่', 'สาขาเทศบาล', 'สาขาถนนราชดำเนิน', 'สาขาศาลากลางจังหวัด'];
const CD_OPERATORS = ['สุภาพร ทองใบ', 'มนตรี ศรีสุข', 'อารีย์ พูนสุข'];

// ── สร้างรายการ Slip การจ่ายเงินกู้ของสมาชิก (deterministic ต่อ contract) ──
function cdSlipsOf(member) {
  const today = cdToday();
  const yy = String(new Date(today).getFullYear() + 543).slice(-2);
  return (member.debts || []).map((d, i) => {
    const h = cdHash(member.code + d.contractNo);
    const dayOffset = h % 3;                          // 0 = วันทำการ (ยกเลิกได้), 1-2 = ข้ามวัน (ล็อก)
    const payDate = cdAddDays(today, -dayOffset);
    const term = d.installment || 5000;
    const payAmount = Math.round((term * (d.totalTerms || 60)) / 100) * 100;  // วงเงินจ่ายโดยประมาณ
    const withdrawShare = (h % 4) === 0;
    const shareAmount = withdrawShare ? Math.round(((member.shares || 0) * 0.08) / 100) * 100 : 0;
    const deductAmount = ((h >> 3) % 2) === 0 ? Math.round((payAmount * 0.12) / 100) * 100 : 0;
    const netReceive = payAmount + shareAmount - deductAmount;
    const startTerm = (d.paidTerms || 0) + 1;
    // การหักชำระต่องวด (breakdown) — งวดที่ปิดจากยอดหักชำระ
    const nRows = deductAmount > 0 ? 1 + (h % 2) : 1;
    let remaining = d.principalRemaining || payAmount;
    const rows = [];
    for (let k = 0; k < nRows; k++) {
      const payPrincipal = Math.round((term * 0.82) / 10) * 10;
      const payInterest = Math.round((term * 0.18) / 10) * 10;
      remaining = Math.max(0, remaining - payPrincipal);
      rows.push({
        item: deductAmount > 0 ? 'หักชำระหนี้เดิม' : 'ชำระงวด',
        period: startTerm + k,
        payPrincipal, payInterest,
        payTotal: payPrincipal + payInterest,
        remaining,
      });
    }
    return {
      slipId: member.code + '-' + i,
      payNo: `PV-${yy}-${String(10000 + (h % 89999)).padStart(5, '0')}`,
      payDate,
      contractNo: d.contractNo,
      loanType: d.type,
      payAmount, crossDay: dayOffset > 0,
      // จ่ายเงินโดย
      payType: ['transfer', 'cheque', 'cash', 'draft'][h % 4],
      bank: CD_BANKS[h % CD_BANKS.length],
      branch: CD_BRANCHES[(h >> 2) % CD_BRANCHES.length],
      account: `${900 + (h % 90)}-${(h % 9)}-${String(10000 + (h % 89999)).padStart(5, '0')}-${h % 10}`,
      docNo: `LDV-${yy}-${String(20000 + ((h >> 1) % 79999)).padStart(5, '0')}`,
      txnDate: payDate,
      slipNo: `SLP-${String(300000 + (h % 699999)).padStart(6, '0')}`,
      operator: CD_OPERATORS[h % CD_OPERATORS.length],
      // รายละเอียดการจ่ายเงิน
      withdrawShare, shareAmount,
      payDateDetail: payDate,
      withdrawCount: withdrawShare ? 1 + (h % 3) : 0,
      deductAmount, netReceive,
      rows,
    };
  });
}

// ─── ฟิลด์ (label เล็กด้านบน) ────────────────────────────────────────
function CdFld({ label, w, grow, fill, span, required, children }) {
  const style = fill ? { minWidth: 0, gridColumn: span ? `span ${span}` : undefined } : grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function CdRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
// แถวคู่ label/ค่า ในบล็อก "จ่ายเงินโดย"
function CdKv({ label, children }) {
  return (
    <div className="ldc-kv">
      <span className="ldc-kv-l">{label}</span>
      <span className="ldc-kv-c">{children}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function CdFormScreen({ onToast, audit }) {
  const today = cdToday();

  const [member, setMember]   = useState(null);
  const [slips, setSlips]     = useState([]);
  const [fromDate, setFrom]   = useState(cdAddDays(today, -2));
  const [toDate, setTo]       = useState(today);
  const [selId, setSelId]     = useState(null);      // slip ที่กำลังดูรายละเอียด
  const [checked, setChecked] = useState(() => new Set());  // slip ที่ติ๊กเพื่อยกเลิก
  const [error, setError]     = useState('');

  const loaded = !!member;
  const inRange = (d) => d >= fromDate && d <= toDate;
  const visibleSlips = slips.filter(s => inRange(s.payDate));
  const sel = visibleSlips.find(s => s.slipId === selId) || null;

  const pickMember = (m) => {
    const all = cdSlipsOf(m);
    setMember(m);
    setSlips(all);
    setChecked(new Set());
    setError('');
    // auto-select slip แรกในช่วงวันที่
    const first = all.find(s => inRange(s.payDate));
    setSelId(first ? first.slipId : null);
  };

  const clearScreen = () => {
    setMember(null); setSlips([]); setSelId(null); setChecked(new Set());
    setFrom(cdAddDays(today, -2)); setTo(today); setError('');
  };

  const toggleCheck = (id) => setChecked(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const checkedSlips = visibleSlips.filter(s => checked.has(s.slipId));
  const hasCrossDay = checkedSlips.some(s => s.crossDay) || (sel && sel.crossDay);

  const doCancel = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อน'); return; }
    if (checkedSlips.length === 0) { setError('กรุณาเลือกรายการ Slip ที่ต้องการยกเลิกอย่างน้อย 1 รายการ'); return; }
    const locked = checkedSlips.filter(s => s.crossDay);
    if (locked.length > 0) {
      setError(`มี ${locked.length} รายการเป็นการยกเลิก "ข้ามวัน" (จ่ายก่อนวันทำการ) — ไม่สามารถยกเลิกได้ที่หน้าจอนี้ กรุณาติดต่อแผนกประมวลผล`);
      return;
    }
    setError('');
    const total = checkedSlips.reduce((s, x) => s + x.payAmount, 0);
    // ลบ slip ที่ยกเลิกออกจากรายการวันนั้น
    const remain = slips.filter(s => !checked.has(s.slipId));
    setSlips(remain);
    setChecked(new Set());
    const nextSel = remain.find(s => inRange(s.payDate));
    setSelId(nextSel ? nextSel.slipId : null);
    audit && audit.log && audit.log({
      action: 'cancel', module: 'สินเชื่อ — ยกเลิกการจ่ายเงินกู้ประจำวัน',
      target: `${member.code} · ${member.name}`,
      summary: `ยกเลิกการจ่ายเงินกู้ ${checkedSlips.length} รายการ · รวม ${cdMoney(total)} บาท`,
      changes: checkedSlips.map(s => ({ field: s.payNo, before: `จ่ายแล้ว · ${cdMoney(s.payAmount)}`, after: 'ยกเลิกการจ่าย' })),
    });
    onToast && onToast(`ยกเลิกการจ่ายเงินกู้ ${checkedSlips.length} รายการ (${member.name}) — รวม ${cdMoney(total)} บาท เรียบร้อยแล้ว`);
  };

  const doPrint = () => {
    if (!sel) { setError('กรุณาเลือกรายการ Slip ก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบยกเลิกการจ่ายเงินกู้…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="ยกเลิกการจ่ายเงินกู้ประจำวัน">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ยกเลิกการจ่ายเงินกู้ประจำวัน</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · ยกเลิกรายการจ่ายเงินกู้ที่ทำในวันทำการ — ค้นหาสมาชิก เลือก Slip ที่ต้องการยกเลิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn danger sm" onClick={doCancel}><Icon name="close" size={13} /> ยกเลิกการจ่าย</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างหน้าจอ</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
        </div>
      </div>

      {/* ── แถบเตือนยกเลิกข้ามวัน ── */}
      {hasCrossDay && (
        <div className="ldc-warn"><Icon name="info" size={15} /> เป็นรายการยกเลิกข้ามวัน กรุณาติดต่อแผนกประมวลผล</div>
      )}
      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ① รายละเอียดสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ข้อมูลสมาชิก</h3></div>
        <div className="icr-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          <CdFld label="เลขสมาชิก / เลขที่สัญญา" fill span={2} required>
            <ContractSearchField contract={member && member.debts && member.debts[0] ? member.debts[0].contractNo : ''} member={member}
                                 onPick={({ member: m }) => pickMember(m)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสมาชิก — ยกเลิกการจ่ายเงินกู้ประจำวัน"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </CdFld>
          <CdFld label="ชื่อ-นามสกุล" fill><CdRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></CdFld>
          <CdFld label="สังกัด" fill><CdRO value={member ? `${member.deptCode || ''}  ${member.dept || ''}`.trim() : ''} placeholder="—" /></CdFld>
          <CdFld label="ทุนเรือนหุ้น" fill><CdRO value={member ? cdMoney(member.shares) : ''} mono num placeholder="—" /></CdFld>
          <CdFld label="ช่วงวันที่ต้องการยกเลิกรายการ" fill>
            <ErpDate value={fromDate} onChange={(v) => ((e) => setFrom(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </CdFld>
          <CdFld label="ถึงวันที่" fill>
            <ErpDate value={toDate} onChange={(v) => ((e) => setTo(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </CdFld>
        </div>
      </div>

      {/* ── ② รายการ Slip (ซ้าย) + จ่ายเงินโดย/รายละเอียด (ขวา) ── */}
      <div className="ldc-grid">
        {/* ซ้าย — รายการ Slip การจ่าย */}
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>รายการ Slip</h3>
            <span className="muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>
              {loaded ? `พบ ${visibleSlips.length} รายการในช่วงวันที่ · เลือกยกเลิก ${checkedSlips.length}` : '— ค้นหาสมาชิกเพื่อแสดงรายการจ่าย —'}
            </span>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ldc-slip-tbl">
              <thead>
                <tr>
                  <th className="center" style={{ width: 36 }} />
                  <th>เลขที่จ่าย</th>
                  <th className="center" style={{ width: 100 }}>วันที่จ่าย</th>
                  <th>เลขที่สัญญา</th>
                  <th className="num" style={{ width: 120 }}>ยอดจ่าย</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr><td colSpan="5" className="empty-state">ค้นหาสมาชิกเพื่อแสดงรายการ Slip การจ่ายเงินกู้</td></tr>
                ) : visibleSlips.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบรายการจ่ายในช่วงวันที่ที่เลือก</td></tr>
                ) : visibleSlips.map(s => (
                  <tr key={s.slipId} className={'clickable' + (s.slipId === selId ? ' ldc-row-on' : '')} onClick={() => setSelId(s.slipId)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={checked.has(s.slipId)} onChange={() => toggleCheck(s.slipId)} aria-label="เลือกยกเลิก" style={{ accentColor: 'var(--primary)' }} />
                    </td>
                    <td className="mono">{s.payNo}{s.crossDay && <span className="chip warning" style={{ marginLeft: 6, fontSize: 10 }}>ข้ามวัน</span>}</td>
                    <td className="center mono">{window.fmt.date(s.payDate)}</td>
                    <td className="mono">{s.contractNo}<div className="muted" style={{ fontSize: 10.5 }}>{s.loanType}</div></td>
                    <td className="num mono">{cdMoney(s.payAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>

        {/* ขวา — จ่ายเงินโดย + รายละเอียดการจ่ายเงิน + slip หักชำระ */}
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>จ่ายเงินโดย</h3>
            {sel && <span className="mono muted" style={{ fontSize: 11.5, marginLeft: 'auto' }}>{sel.payNo}</span>}
          </div>

          {!sel ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              เลือกรายการ Slip ทางซ้ายเพื่อแสดงรายละเอียดการจ่ายเงิน
            </div>
          ) : (
            <>
              <div className="ldc-kv-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px 16px' }}>
                <CdKv label="ประเภทเงิน"><CdRO value={cdPayTypeLabel(sel.payType)} /></CdKv>
                <div style={{ display: 'contents' }}>
                  <CdKv label="ธนาคาร"><CdRO value={sel.payType === 'cash' ? '—' : sel.bank} /></CdKv>
                  <CdKv label="สาขา"><CdRO value={sel.payType === 'cash' ? '—' : sel.branch} /></CdKv>
                </div>
                <CdKv label="เลขที่บัญชี"><CdRO value={sel.payType === 'cash' ? '—' : sel.account} mono /></CdKv>
                <div style={{ display: 'contents' }}>
                  <CdKv label="เลขที่เอกสาร"><CdRO value={sel.docNo} mono /></CdKv>
                  <CdKv label="วันที่ทำรายการ"><CdRO value={window.fmt.date(sel.txnDate)} mono /></CdKv>
                </div>
                <div style={{ display: 'contents' }}>
                  <CdKv label="เลขที่สลิป"><CdRO value={sel.slipNo} mono /></CdKv>
                  <CdKv label="ผู้ทำรายการ"><CdRO value={sel.operator} /></CdKv>
                </div>
              </div>

              {/* รายละเอียดการจ่ายเงิน + จำนวนเงิน */}
              <div className="ldc-subhead">รายละเอียดการจ่ายเงิน · จำนวนเงิน</div>
              <div className="ldc-pay-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <label className="ia-check" style={{ gridColumn: '1 / -1' }}>
                  <input type="checkbox" checked={sel.withdrawShare} readOnly disabled />
                  <span>ถอนหุ้นบางส่วน</span>
                </label>
                <CdKv label="วันที่จ่ายเงิน"><CdRO value={window.fmt.date(sel.payDateDetail)} mono /></CdKv>
                <CdKv label="ยอดหุ้น"><CdRO value={cdMoney(sel.shareAmount)} mono num /></CdKv>
                <CdKv label="ครั้งที่ถอน"><CdRO value={sel.withdrawShare ? sel.withdrawCount : '—'} mono num /></CdKv>
                <CdKv label="ยอดหักชำระ"><CdRO value={cdMoney(sel.deductAmount)} mono num /></CdKv>
                <div className="ldc-net" style={{ gridColumn: '1 / -1' }}>
                  <span className="ldc-net-l">ยอดรับเงินสุทธิ</span>
                  <span className="ldc-net-v mono">{cdMoney(sel.netReceive)}</span>
                </div>
              </div>

              {/* รายการ Slip — การหักชำระต่องวด */}
              <div className="ldc-subhead">รายการ Slip <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>(การหักชำระต่องวด)</span></div>
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl ldc-break-tbl">
                  <thead>
                    <tr>
                      <th>รายการ</th>
                      <th className="center" style={{ width: 54 }}>งวด</th>
                      <th className="num">ชำระต้น</th>
                      <th className="num">ชำระด/บ</th>
                      <th className="num">รวมชำระ</th>
                      <th className="num">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sel.rows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.item}</td>
                        <td className="center mono">{r.period}</td>
                        <td className="num mono">{cdMoney(r.payPrincipal)}</td>
                        <td className="num mono">{cdMoney(r.payInterest)}</td>
                        <td className="num mono">{cdMoney(r.payTotal)}</td>
                        <td className="num mono">{cdMoney(r.remaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="ia-total-row">
                      <td colSpan="2" className="ia-total-label">รวม</td>
                      <td className="num mono">{cdMoney(sel.rows.reduce((s, r) => s + r.payPrincipal, 0))}</td>
                      <td className="num mono">{cdMoney(sel.rows.reduce((s, r) => s + r.payInterest, 0))}</td>
                      <td className="num mono">{cdMoney(sel.rows.reduce((s, r) => s + r.payTotal, 0))}</td>
                      <td className="num mono">{cdMoney(sel.rows[sel.rows.length - 1].remaining)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div></div>
            </>
          )}
        </div>
      </div>

      {loaded && (
        <div className="icr-restruct-note" style={{ marginTop: 12 }}>
          <Icon name="info" size={13} />
          <span>ติ๊กเลือกรายการ Slip ที่ต้องการยกเลิก แล้วกด <b>ยกเลิกการจ่าย</b> — ระบบยกเลิกได้เฉพาะรายการที่จ่ายใน<b>วันทำการปัจจุบัน</b> รายการที่จ่าย<b>ข้ามวัน</b>ต้องติดต่อแผนกประมวลผล</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function CancelDailyDisbursePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb(window.crumb3('ยกเลิกจ่ายเงินประจำวัน', 'list'), []);
  return <CdFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { CancelDailyDisbursePage, CdFormScreen });
