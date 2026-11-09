// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ตารางการชำระเงิน
//  เลือกสัญญา/คำขอ → กำหนดเงื่อนไขดอกเบี้ย/งวด/วันชำระ → แสดงตารางผ่อน
//  ดาวน์โหลดผังการชำระเงินเป็น PDF
// ════════════════════════════════════════════════════════════════════

// pill สถานะการจ่ายเงินกู้
const schStatusPill = (s) => {
  if (s === 'จ่ายแล้ว') return <span className="pill ok">{s}</span>;
  if (s === 'รอจ่าย')   return <span className="pill warn">{s}</span>;
  return <span className="pill neutral">{s}</span>;
};

// แปลงเดือน ISO (YYYY-MM) → MM/YYYY พ.ศ.
const schMonthBE = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  return `${m}/${Number(y) + 543}`;
};

// ─── Popup ค้นหารายการจ่ายเงินกู้ ───────────────────────────────────
//  เลขที่ใบคำขอ · วันที่จ่าย · เลขสัญญา · รหัสสมาชิก · ชื่อ-นามสกุล ·
//  จ่ายเงินกู้โดย · สั่งจ่าย ปณ. · สถานะ
function SchDisbursementSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ memberCode: '', reqNo: '', contractNo: '', name: '' });
  const [results, setResults] = useState(() => window.SCHED_DISBURSEMENTS);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => setResults(window.searchSchedDisbursements(c));
  const reset = () => { setC({ memberCode: '', reqNo: '', contractNo: '', name: '' }); setResults(window.SCHED_DISBURSEMENTS); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 940 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหารายการจ่ายเงินกู้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. รหัสสมาชิก</span>
              <input value={c.memberCode} onChange={(e) => set('memberCode', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-058241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. เลขที่ใบคำขอ</span>
              <input value={c.reqNo} onChange={(e) => set('reqNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น LR-2569-00421" className="mono" />
            </label>
            <label className="gc-sf">
              <span>3. เลขที่สัญญา</span>
              <input value={c.contractNo} onChange={(e) => set('contractNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น L-2569-0148" className="mono" />
            </label>
            <label className="gc-sf">
              <span>4. ชื่อ-นามสกุล</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อหรือนามสกุล" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: 'span 4' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการจ่ายเงินกู้ <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 320 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่ใบคำขอ</th>
                  <th className="center">วันที่จ่าย</th>
                  <th>เลขสัญญา</th>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>จ่ายเงินกู้โดย</th>
                  <th>สั่งจ่าย ปณ.</th>
                  <th className="center">สถานะ</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="9" className="empty-state">ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((d) => (
                  <tr key={d.reqNo} className="clickable" onClick={() => onPick(d)}>
                    <td className="mono">{d.reqNo}</td>
                    <td className="center mono">{fmt.date(d.payDate)}</td>
                    <td className="mono">{d.contractNo}</td>
                    <td className="mono">{d.memberCode}</td>
                    <td>{d.memberName}</td>
                    <td>{d.paidBy}</td>
                    <td>{d.poPayee}</td>
                    <td className="center">{schStatusPill(d.status)}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(d); }} title="เลือกรายการ">
                        <Icon name="chevRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก: ตารางการชำระเงิน ──────────────────────────────────────
function PaymentSchedulePage({ onToast }) {
  const workDate = window.DEPOSIT_WORKING_DATE;

  // ── ส่วนที่ 1: รายละเอียดผู้กู้ ──
  const [searchType, setSearchType] = useState('reqNo');
  const [docNo, setDocNo] = useState('');
  const [amountSource, setAmountSource] = useState('approved');
  const [disb, setDisb] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ── ช่องเลขที่สัญญา/คำขอ — พิมพ์ + Enter (รูปแบบเดียวกับช่องค้นหาเลขสมาชิกในใบคำขอกู้)
  //    "รูปแบบการค้นหา" เป็นตัวกรองว่าจะเทียบข้อความที่พิมพ์กับเลขใด
  const schKeyOf = (d) => d.reqNo || '';
  const schItems = React.useMemo(() => (window.SCHED_DISBURSEMENTS || []).flatMap(d =>
    [d.reqNo, d.contractNo, d.memberCode].filter(Boolean).map(k => ({ ...d, __k: k }))), []);
  const schPlaceholder = 'เลขสมาชิก หรือเลขที่สัญญา…';

  // ── ส่วนที่ 2: ดอกเบี้ยและการประมาณการ ──
  const [rate, setRate] = useState('');
  const [interestMethod, setInterestMethod] = useState('daily');

  // ── ส่วนที่ 3: รายละเอียดเงินกู้ ──
  const [amount, setAmount] = useState('');
  const [payType, setPayType] = useState('eqp');
  const [installments, setInstallments] = useState('');
  const [perInstallment, setPerInstallment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [balance, setBalance] = useState('');

  // ── ส่วนที่ 4: เงื่อนไขวันที่ชำระเงิน ──
  const [dueCondition, setDueCondition] = useState('eom');
  const [dueDay, setDueDay] = useState('');
  const [firstPayDate, setFirstPayDate] = useState('');
  const firstPayMonth = firstPayDate ? String(firstPayDate).slice(0, 7) : '';

  // ── ส่วนที่ 7: ตารางผลลัพธ์ ──
  const [schedule, setSchedule] = useState(null);

  const amountBySource = (d, src) =>
    src === 'requested' ? d.requestedAmount : src === 'balance' ? d.balance : d.approvedAmount;

  // เลือกรายการจ่ายเงินกู้จากป๊อปอัพ → เติมฟอร์ม
  const pick = (d) => {
    setDisb(d);
    setModalOpen(false);
    setDocNo(d.reqNo);
    setRate(String(d.annualRate));
    setInterestMethod(d.interestMethod || 'daily');
    setAmount(String(amountBySource(d, amountSource)));
    setPayType(d.payType || 'eqp');
    setInstallments(String(d.installments));
    setStartDate(d.startDate);
    setBalance(String(d.balance));
    setDueCondition(d.dueCondition || 'eom');
    setDueDay(String(d.dueDay || ''));
    setFirstPayDate(d.firstPayMonth ? d.firstPayMonth + '-01' : '');
    setPerInstallment('');
    setSchedule(null);
  };

  // เปลี่ยนแหล่งยอดเงินกู้ → อัปเดตจำนวนเงินจากรายการที่เลือก
  const changeAmountSource = (src) => {
    setAmountSource(src);
    if (disb) { setAmount(String(amountBySource(disb, src))); setSchedule(null); }
  };

  const params = () => ({
    amount: Number(amount) || 0,
    annualRate: Number(rate) || 0,
    installments: Number(installments) || 0,
    payType,
    installmentAmount: Number(perInstallment) || 0,
    startDate,
    firstPayMonth,
    dueCondition,
    dueDay: Number(dueDay) || 0,
    interestMethod,
  });

  const [error, setError] = useState('');
  const buildSchedule = () => {
    if (!disb) { setError('กรุณาเลือกสัญญา/ใบคำขอก่อน'); return; }
    if (!(Number(amount) > 0)) { setError('กรุณาระบุจำนวนเงินกู้'); return; }
    if (!(Number(installments) > 0)) { setError('กรุณาระบุจำนวนงวด'); return; }
    if (!firstPayMonth) { setError('กรุณาระบุเดือนที่เริ่มชำระครั้งแรก'); return; }
    setError('');
    const res = window.calcSchedule(params());
    setSchedule(res);
    // เติมค่างวดเฉลี่ยให้ช่อง "ชำระ/งวด" หากผู้ใช้ยังไม่ได้กรอก
    if (!(Number(perInstallment) > 0) && res.rows.length) {
      setPerInstallment(String(window.fmt.money(res.totals.total / res.rows.length).replace(/,/g, '')));
    }
    onToast && onToast(`คำนวณตารางการชำระเงินแล้ว · ${res.rows.length} งวด`);
  };

  const totals = schedule ? schedule.totals : { principal: 0, interest: 0, total: 0 };

  // ดาวน์โหลด PDF — เปิดกล่องพิมพ์ของเบราว์เซอร์ (Save as PDF)
  const downloadPdf = () => {
    document.documentElement.classList.add('ie-printing');
    const cleanup = () => {
      document.documentElement.classList.remove('ie-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 60);
    onToast && onToast('กำลังเตรียมเอกสาร PDF — เลือก “บันทึกเป็น PDF” ในกล่องพิมพ์');
  };

  const money2 = (n) => fmt.money(n, 2);



  return (
    <div data-screen-label="หน้าตารางการชำระเงิน" className="ie-page sch-page">
      <div className="page-actions ie-noprint">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ตารางการชำระเงิน
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            จำลองผังการผ่อนชำระเงินกู้ตามเงื่อนไขดอกเบี้ย จำนวนงวด และรอบวันชำระ
          </div>
        </div>
      </div>

      {/* หัวเอกสารสำหรับพิมพ์เท่านั้น */}
      <div className="ie-print-head">
        <CoopLetterheadBlock />
        <div className="ie-ph-title">ตารางแผนการชำระเงินกู้</div>
        <div className="ie-ph-meta">
          <span>ผู้กู้: {disb ? `${disb.memberCode} · ${disb.memberName}` : '—'}</span>
          <span>เลขที่สัญญา: {disb ? disb.contractNo : '—'}</span>
          <span>จำนวนเงิน: ฿ {money2(Number(amount) || 0)}</span>
          <span>จำนวนงวด: {installments || '—'}</span>
        </div>
      </div>

      {/* ── ส่วนที่ 1: รายละเอียดผู้กู้ ── */}
      <div className="search-card ie-noprint">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" />
          <h3>รายละเอียดผู้กู้</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '14px 18px' }}>
          <div className="icr-fld" style={{ minWidth: 0, gridColumn: 'span 2' }}>
            <span className="icr-fld-l">เลขสมาชิก / เลขที่สัญญา</span>
            {window.SearchPickerField && (
              <window.SearchPickerField
                value={disb ? schKeyOf(disb) : ''}
                items={schItems}
                keyOf={(d) => d.__k}
                labelOf={(d) => [d.reqNo, d.memberName].filter(Boolean).join(' - ')}
                className="cfg-input"
                style={{ width: '100%' }}
                placeholder={schPlaceholder}
                notFoundText="ไม่พบเลขที่นี้ในรายการจ่ายเงินกู้"
                onPick={(d) => pick(d)}
                onOpenModal={() => setModalOpen(true)} />
            )}
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">ใช้ยอดเงินกู้จาก</span>
            <select className="cfg-input" value={amountSource} onChange={(e) => changeAmountSource(e.target.value)}>
              {window.SCHED_AMOUNT_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="icr-fld" style={{ minWidth: 0, gridColumn: 'span 2' }}><span className="icr-fld-l">ชื่อ-นามสกุล</span><div className={'icr-ro' + (disb ? '' : ' empty')}>{disb ? `${disb.memberName} (${disb.memberCode})` : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0, gridColumn: 'span 2' }}><span className="icr-fld-l">สังกัด</span><div className={'icr-ro' + (disb ? '' : ' empty')}>{disb ? disb.unit : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0 }}><span className="icr-fld-l">ประเภทเงินกู้</span><div className={'icr-ro' + (disb ? '' : ' empty')}>{disb ? disb.loanType : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0 }}><span className="icr-fld-l">เลขที่สัญญา</span><div className={'icr-ro mono' + (disb ? '' : ' empty')}>{disb ? disb.contractNo : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0 }}><span className="icr-fld-l">เลขที่ใบคำขอ</span><div className={'icr-ro mono' + (disb ? '' : ' empty')}>{disb ? disb.reqNo : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0 }}><span className="icr-fld-l">สถานะการจ่าย</span><div className={'icr-ro' + (disb ? '' : ' empty')}>{disb ? disb.status : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0, gridColumn: 'span 2' }}><span className="icr-fld-l">จ่ายโดย</span><div className={'icr-ro' + (disb ? '' : ' empty')}>{disb ? disb.paidBy : '—'}</div></div>
          <div className="icr-fld" style={{ minWidth: 0 }}><span className="icr-fld-l">วันที่จ่าย</span><div className={'icr-ro mono' + (disb ? '' : ' empty')}>{disb ? fmt.date(disb.payDate) : '—'}</div></div>
        </div>
      </div>

      {/* ── เงื่อนไขการคำนวณ: ส่วนที่ 2 / 3 / 4 ── */}
      <div className="search-card ie-noprint" style={{ marginTop: 12 }}>
        <div className="sch-cond-cols">
          {/* ส่วนที่ 2 */}
          <div className="sch-cond-card">
            <div className="section-head"><span className="head-bar" /><h3>ดอกเบี้ยและการประมาณการ</h3></div>
            <div className="sch-card-fields sch-cols-2">
            <div className="lb-field">
              <label className="lb-label">อัตราดอกเบี้ย (ต่อปี)</label>
              <div className="sch-pct">
                <input type="number" step="0.01" className="cfg-input mono sch-num" value={rate}
                       placeholder="0.00" onChange={(e) => { setRate(e.target.value); setSchedule(null); }} />
                <span className="sch-suffix">%</span>
              </div>
            </div>
            <div className="lb-field">
              <label className="lb-label">ประมาณการดอกเบี้ย</label>
              <select className="filter-select lb-select" value={interestMethod}
                      onChange={(e) => { setInterestMethod(e.target.value); setSchedule(null); }}>
                {window.SCHED_INTEREST_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            </div>
          </div>

          {/* ส่วนที่ 3 */}
          <div className="sch-cond-card">
            <div className="section-head"><span className="head-bar" /><h3>รายละเอียดเงินกู้</h3></div>
            <div className="sch-loan-grid">
              <div className="lb-field">
                <label className="lb-label">จำนวนเงิน</label>
                <input type="number" step="0.01" className="cfg-input mono sch-num" value={amount}
                       placeholder="0.00" onChange={(e) => { setAmount(e.target.value); setSchedule(null); }} />
              </div>
              <div className="lb-field">
                <label className="lb-label">แบบการชำระ</label>
                <select className="filter-select lb-select" value={payType}
                        onChange={(e) => { setPayType(e.target.value); setSchedule(null); }}>
                  {window.SCHED_PAY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="lb-field">
                <label className="lb-label">จำนวนงวด</label>
                <input type="number" className="cfg-input mono sch-num" value={installments}
                       placeholder="0" onChange={(e) => { setInstallments(e.target.value); setSchedule(null); }} />
              </div>
              <div className="lb-field">
                <label className="lb-label">ชำระ/งวด</label>
                <input type="number" step="0.01" className="cfg-input mono sch-num" value={perInstallment}
                       placeholder="0.00" onChange={(e) => { setPerInstallment(e.target.value); setSchedule(null); }} />
              </div>
              <div className="lb-field">
                <label className="lb-label">เริ่มสัญญา</label>
                <ErpDate value={startDate} onChange={(v) => ((e) => { setStartDate(e.target.value); setSchedule(null); })({ target: { value: v } })} className="cfg-input" />
              </div>
              <div className="lb-field">
                <label className="lb-label">ยอดคงเหลือ</label>
                <input type="number" step="0.01" className="cfg-input mono sch-num" value={balance}
                       placeholder="0.00" onChange={(e) => setBalance(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ส่วนที่ 4 */}
          <div className="sch-cond-card">
            <div className="section-head"><span className="head-bar" /><h3>เงื่อนไขวันที่ชำระเงิน</h3></div>
            <div className="sch-card-fields sch-cols-3">
            <div className="lb-field">
              <label className="lb-label">เงื่อนไขวันชำระ</label>
              <select className="filter-select lb-select" value={dueCondition}
                      onChange={(e) => { setDueCondition(e.target.value); setSchedule(null); }}>
                {window.SCHED_DUE_CONDITIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="lb-field">
              <label className="lb-label">ทุกวันที่</label>
              <input type="number" min="1" max="31" className="cfg-input mono sch-num" value={dueDay}
                     placeholder="วันที่" disabled={dueCondition === 'eom'}
                     onChange={(e) => { setDueDay(e.target.value); setSchedule(null); }} />
              {dueCondition === 'eom' && <span className="sch-be-hint">ใช้วันสิ้นเดือนอัตโนมัติ</span>}
            </div>
            <div className="lb-field">
              <label className="lb-label">เริ่มชำระครั้งแรก</label>
              <ErpDate value={firstPayDate} onChange={(v) => { setFirstPayDate(v); setSchedule(null); }} className="cfg-input" />
            </div>
            </div>
          </div>
        </div>

        {/* ── ส่วนที่ 5 + 6: ประมาณการเงินที่ต้องชำระ + ปุ่ม ── */}
        <div className="sch-estimate-bar">
          <div className="sch-est-totals">
            <div className="sch-est">
              <span className="sch-est-label">รวมชำระต้น</span>
              <span className="sch-est-value mono">{money2(totals.principal)}</span>
            </div>
            <div className="sch-est">
              <span className="sch-est-label">รวมชำระดอกเบี้ย</span>
              <span className="sch-est-value mono">{money2(totals.interest)}</span>
            </div>
            <div className="sch-est sch-est-grand">
              <span className="sch-est-label">รวมชำระทั้งหมด</span>
              <span className="sch-est-value mono">{money2(totals.total)}</span>
            </div>
          </div>
          <button className="btn primary sch-build-btn" onClick={buildSchedule}>
            <Icon name="report" /> แสดงตารางชำระ
          </button>
        </div>
        {error && <div className="dep-error" style={{ marginTop: 12 }}><Icon name="info" size={13} /> {error}</div>}
      </div>

      {/* ── ส่วนที่ 7: ตารางแผนการชำระเงิน ── */}
      {schedule ? (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" />
            <h3>ตารางแผนการชำระเงิน</h3>
            <span className="head-actions ie-noprint">
              <button className="btn primary sm" onClick={downloadPdf}>
                <Icon name="download" /> ดาวน์โหลดเป็น PDF
              </button>
            </span>
          </div>

          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl ie-table sch-table">
              <thead>
                <tr>
                  <th className="center">งวดที่</th>
                  <th className="num">ยอดยกมา</th>
                  <th className="center">วันที่ชำระ</th>
                  <th className="center">วันดอกเบี้ย</th>
                  <th className="num">ชำระต้น</th>
                  <th className="num">ชำระดอกเบี้ย</th>
                  <th className="num">รวมเงินชำระ</th>
                  <th className="num">คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {schedule.rows.map((r) => (
                  <tr key={r.seq}>
                    <td className="center mono">{r.seq}</td>
                    <td className="num">{money2(r.broughtForward)}</td>
                    <td className="center mono">{fmt.date(r.dueDate)}</td>
                    <td className="center mono">{r.days}</td>
                    <td className="num">{money2(r.payPrincipal)}</td>
                    <td className="num">{money2(r.payInterest)}</td>
                    <td className="num"><b>{money2(r.totalPay)}</b></td>
                    <td className="num">{money2(r.remaining)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4" style={{ textAlign: 'left', fontWeight: 600 }}>รวมทั้งสิ้น</td>
                  <td className="num"><b>{money2(totals.principal)}</b></td>
                  <td className="num"><b>{money2(totals.interest)}</b></td>
                  <td className="num"><b>{money2(totals.total)}</b></td>
                  <td className="num">0.00</td>
                </tr>
              </tfoot>
            </table>
          </div></div>

          <div className="ie-foot-note muted ie-noprint">
            <Icon name="info" size={12} /> ดอกเบี้ยคำนวณจากยอดยกมาแต่ละงวด ×
            อัตราดอกเบี้ยต่อปี {interestMethod === 'daily' ? 'ตามจำนวนวันจริงในงวด (ฐาน 365 วัน)' : 'หารเฉลี่ยรายเดือน (÷ 12)'}
          </div>
        </div>
      ) : (
        <div className="search-card gc-placeholder ie-noprint" style={{ marginTop: 12 }}>
          <div className="gc-ph-ico"><Icon name="report" size={26} /></div>
          <div className="gc-ph-title">ยังไม่มีตารางการชำระเงิน</div>
          <div className="gc-ph-sub">
            เลือกสัญญา/ใบคำขอ กำหนดเงื่อนไขดอกเบี้ยและงวด แล้วกด “แสดงตารางชำระ”
          </div>
        </div>
      )}

      {modalOpen && <SchDisbursementSearchModal onPick={pick} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

Object.assign(window, { PaymentSchedulePage });
