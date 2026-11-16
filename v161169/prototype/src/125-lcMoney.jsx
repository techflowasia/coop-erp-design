// ═════════════════════════════════════════════════════════════════
//  Popup รายละเอียดสัญญาเงินกู้ (เรียกจากแท็บ "เงินกู้" ในหน้าทะเบียนสมาชิก)
//  5 แท็บ: รายละเอียดสัญญา · Statement · หลักประกัน · ประวัติการส่ง · ชำระเงินกู้ล่วงหน้า
//  อ้างอิงหน้าจอเดิม — เรนเดอร์ใหม่ตามดีไซน์ระบบ (การ์ด/ตาราง/KV)
// ═════════════════════════════════════════════════════════════════

// ── helpers ─────────────────────────────────────────────────────────
const lcMoney = (v, d = 2) => (v == null ? '0.00' : window.fmt.money(v, d));
// วันที่แบบ dd/mm/yyyy (พ.ศ.)
function lcBE(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear() + 543}`;
}
function lcAddMonths(iso, n) {
  const d = new Date(iso); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10);
}
// เลขทะเบียนสมาชิกแบบตัวเลข (จากรหัส M-058241 → 058241)
const lcReg = (code) => (code || '').replace(/[^0-9]/g, '') || '—';

// ── ประกอบข้อมูล statement (จำลองจากข้อมูลสัญญา) ────────────────────
function lcBuildStatement(loan) {
  const rows = [];
  const amount = loan.amount || 0;
  const n = Math.max(1, loan.lastTerm || 0);
  const rate = (loan.rate || 0) / 100;
  const start = loan.startDate;
  const totalPrincipalPaid = Math.max(0, amount - (loan.remaining || 0));
  const avgPrincipal = Math.round(totalPrincipalPaid / n);
  const officers = ['RUNGAROO', 'SOMMART', 'PEERAPOL', 'WICHAI'];

  // แถวรับเงินกู้ (LRC)
  rows.push({
    seq: 1, txnDate: start, receiptDate: start, receiptNo: '', code: 'LRC', term: 1,
    inPrincipal: null, inInterest: null, outPrincipal: amount, outInterest: 0,
    balance: amount, intFrom: start, intTo: '', intPeriod: 0, intOwed: 0, intBack: 0,
    fund: 'TRN', officer: `${lcBE(start)} 14:40-${officers[0]}`, note: '', head: true,
  });

  let bal = amount;
  let intFrom = start;
  for (let i = 0; i < n; i++) {
    const txn = lcAddMonths(start, i + 1);
    const principal = i === n - 1 ? bal - (loan.remaining || 0) : avgPrincipal;
    const interest = Math.round(bal * rate / 12 * 100) / 100;
    bal = Math.max(0, bal - principal);
    const intTo = lcAddMonths(intFrom, 1);
    rows.push({
      seq: i + 2, txnDate: txn, receiptDate: txn,
      receiptNo: `69${String(i + 1).padStart(2, '0')}01${7800 + i * 7}`,
      code: 'LPM', term: i + 1,
      inPrincipal: principal, inInterest: interest, outPrincipal: null, outInterest: null,
      balance: bal, intFrom, intTo, intPeriod: interest, intOwed: 0, intBack: 0,
      fund: 'TRN', officer: `${lcBE(txn)} ${18 + (i % 4)}:${20 + i}-${officers[(i + 1) % officers.length]}`,
      note: '',
    });
    intFrom = intTo;
  }
  return rows;
}

// ── รายการค้ำประกัน (หลักประกัน) ────────────────────────────────────
function lcBuildCollateral(loan) {
  const gs = loan.guarantors || [];
  const remain = loan.remaining || 0;
  if (!gs.length) return [];
  const pct = Math.round((100 / gs.length) * 100) / 100;
  return gs.map((g, i) => {
    const isAsset = /หลักทรัพย์|โฉนด|ที่ดิน/.test(g);
    const m = g.match(/^(.*?)\s*\((.*?)\)/);
    return {
      type: isAsset ? '04' : '01',
      ref: String(48509 + i * 137),
      name: m ? m[1].trim() : g,
      sub: isAsset ? 'หลักทรัพย์ค้ำประกัน' : 'ค้ำประกันด้วยบุคคล',
      remain: Math.round(remain * pct / 100),
      pct,
      amount: Math.round(remain * pct / 100),
      status: loan.paymentStatus === 'ล่าช้า' ? 'ค้างชำระ' : 'หนี้ไหล',
      sued: 0,
    };
  });
}

// ── KV cell ─────────────────────────────────────────────────────────
function LcKV({ label, children, strong, mono, tone }) {
  return (
    <div className="lcd-kv">
      <span className="lcd-k">{label}</span>
      <span className={"lcd-v" + (mono ? ' mono' : '') + (strong ? ' strong' : '') + (tone ? ' ' + tone : '')}>
        {children == null || children === '' ? '—' : children}
      </span>
    </div>
  );
}
function LcSection({ title, children, cols }) {
  return (
    <div className="lcd-sec">
      <div className="lcd-sec-head"><span className="lcd-dot" />{title}</div>
      <div className={"lcd-grid cols-" + (cols || 3)}>{children}</div>
    </div>
  );
}

// ═══ TAB 1 · รายละเอียดสัญญา ════════════════════════════════════════
function LcTabDetail({ loan }) {
  const remain = loan.remaining || 0;
  return (
    <div className="lcd-detail">
      <div className="lcd-topgrid">
        <LcKV label="ประเภทสัญญา" mono>{loan.contractCategory || '1'}</LcKV>
        <LcKV label="วัตถุประสงค์" mono>{loan.purposeCode || '01'}</LcKV>
        <LcKV label="จ่ายเงินกู้โดย">{loan.disburseVia || 'เงินฝาก สอ. 0100121237'}</LcKV>
      </div>

      <div className="lcd-cols3">
        <LcSection title="เริ่มสัญญา" cols={1}>
          <LcKV label="เริ่มสัญญา" mono>{lcBE(loan.startDate)}</LcKV>
          <LcKV label="สิ้นสุดสัญญา" mono>{lcBE(lcAddMonths(loan.startDate, loan.totalTerms || 0))}</LcKV>
          <LcKV label="เริ่มเก็บ" mono>{new Date(loan.startDate).getFullYear() + 543}/{loan.totalTerms}</LcKV>
          <LcKV label="จำนวนอนุมัติ" mono strong>{lcMoney(loan.amount)}</LcKV>
        </LcSection>

        <LcSection title="การชำระเงินกู้" cols={1}>
          <LcKV label="ประเภทการส่ง">{loan.payType}</LcKV>
          <LcKV label="สถานะการส่ง">{loan.paymentStatus}</LcKV>
          <LcKV label="งวดชำระล่าสุด" mono>{loan.lastTerm} / {loan.totalTerms}</LcKV>
          <LcKV label="ชำระ / งวด" mono>{lcMoney(loan.installment)}</LcKV>
          <LcKV label="เพิ่มต้นปีละ" mono>{lcMoney(loan.annualStepUp || 0)}</LcKV>
        </LcSection>

        <LcSection title="การคิดดอกเบี้ยแบบแยกต้นเงิน" cols={1}>
          <LcKV label="ต้นเงินรวมตั้งต้น" mono>{lcMoney(loan.amount)}</LcKV>
          <LcKV label="ต้นเงินตนเอง" mono>{lcMoney(loan.principalSelf != null ? loan.principalSelf : loan.amount)}</LcKV>
          <LcKV label="ต้นเงินรับโอน" mono>{lcMoney(loan.principalTransfer || 0)}</LcKV>
          <LcKV label="อัตราดอกเบี้ย R" mono>{loan.rate ? loan.rate.toFixed(3) + '%' : '—'}</LcKV>
        </LcSection>
      </div>

      <div className="lcd-cols3">
        <LcSection title="คงเหลือ / รอเบิก" cols={1}>
          <LcKV label="งวดรับเงินล่าสุด" mono>{loan.lastDisburseTerm || 1}</LcKV>
          <LcKV label="จำนวนรอเบิก" mono tone="hl-dark">{lcMoney(loan.pendingDisburse || 0)}</LcKV>
          <LcKV label="คงเหลือ" mono tone="hl-green">{lcMoney(remain)}</LcKV>
        </LcSection>

        <LcSection title="ค้างชำระ" cols={1}>
          <LcKV label="ด/บ ค้างชำระ" mono tone={loan.interestDue ? 'neg' : ''}>{lcMoney(loan.interestDue || 0)}</LcKV>
          <LcKV label="ด/บ เดือนค้าง" mono>{lcMoney(loan.interestMonthOwed || 0)}</LcKV>
          <LcKV label="ต้นค้างชำระ" mono>{lcMoney(loan.principalOwed || 0)}</LcKV>
          <LcKV label="ผ่อนดอกค้าง" mono>{lcMoney(loan.interestInstOwed || 0)}</LcKV>
          <LcKV label="ด/บ ปีค้าง" mono>{lcMoney(loan.interestYearOwed || 0)}</LcKV>
        </LcSection>

        <LcSection title="การรับโอนหนี้" cols={1}>
          <LcKV label="รับโอนจาก">{loan.transferFrom || ''}</LcKV>
          <LcKV label="การผ่อนผัน">{loan.forbearance || ''}</LcKV>
          <LcKV label="ยอดเงินโอนไป" mono tone="hl-dark">{lcMoney(loan.transferOut || 0)}</LcKV>
          <LcKV label="ด/บ สะสม" mono>{lcMoney(loan.interestOver || 0)}</LcKV>
        </LcSection>
      </div>

      <div className="lcd-cols3">
        <LcSection title="วันที่ล่าสุด" cols={1}>
          <LcKV label="รับเงินกู้ล่าสุด" mono>{lcBE(loan.startDate)}</LcKV>
          <LcKV label="ชำระล่าสุด" mono>{lcBE(loan.lastPaymentDate)}</LcKV>
          <LcKV label="คิด ด/บ ล่าสุด" mono tone="hl-yellow">{lcBE(loan.lastInterestDate)}</LcKV>
          <LcKV label="เรียกเก็บล่าสุด" mono>{lcBE(loan.lastCollectDate)}</LcKV>
        </LcSection>

        <LcSection title="อัตราดอกเบี้ย / ยอดรอเรียกเก็บ" cols={1}>
          <LcKV label="อัตราดอกเบี้ย" mono tone="neg">{loan.rate ? loan.rate.toFixed(3) + '%' : '—'}</LcKV>
          <LcKV label="ต้นรอเรียกเก็บ" mono>{lcMoney(loan.principalToCollect || 0)}</LcKV>
          <LcKV label="ด/บ เรียกเก็บ" mono>{lcMoney(loan.interestToCollect || 0)}</LcKV>
        </LcSection>

        <LcSection title="สถานะ" cols={1}>
          <LcKV label="สถานะสัญญา">
            <span className={"pill " + (loan.contractStatus === 'ปกติ' ? 'ok' : 'warn')}>{loan.contractStatus}</span>
          </LcKV>
          <LcKV label="สถานะการชำระหนี้">
            <span className={"pill " + (loan.debtSettleStatus === 'ปกติ' ? 'ok' : 'warn')}>{loan.debtSettleStatus}</span>
          </LcKV>
          <LcKV label="ปรับโครงสร้างหนี้">{loan.debtSettleDate ? 'เมื่อ ' + lcBE(loan.debtSettleDate) : 'ไม่มี'}</LcKV>
        </LcSection>
      </div>

      <div className="lcd-sec">
        <div className="lcd-sec-head"><span className="lcd-dot" />หมายเหตุ</div>
        <div className="lcd-note">{loan.contractNote || '—'}</div>
      </div>
    </div>
  );
}

// ═══ TAB 2 · Statement ══════════════════════════════════════════════
const LC_CODE_LEGEND = [
  ['B/F', 'ยกยอดมาต้นปี'], ['LPM', 'ชำระรายเดือน'], ['LRC', 'รับเงินกู้'],
  ['LTL', 'โอนหุ้นมาชำระหนี้'], ['TLG', 'โอนหนี้ให้ผู้ค้ำ'], ['LNF', 'กองทุนช่วยเหลือผู้ค้ำประกัน'],
  ['RPM', 'ยกเลิกชำระรายเดือน'], ['RRC', 'ยกเลิกการรับเงินกู้'], ['RTL', 'ยกเลิกโอนหุ้นมาชำระหนี้'],
  ['RLG', 'ยกเลิกโอนหนี้ให้ผู้ค้ำ'], ['INS', 'เบี้ยประกัน'],
  ['LPX', 'ชำระหนี้พิเศษ'], ['LCL', 'หักกลบกู้สัญญาใหม่'], ['LRT', 'คืนเงินต้น, ดอกเบี้ย'],
  ['TRG', 'รับโอนหนี้ค้ำประกัน'], ['RPX', 'ยกเลิกชำระหนี้พิเศษ'], ['RCL', 'ยกเลิกหักกลบกู้สัญญาใหม่'],
  ['RRT', 'ยกเลิกคืนเงินต้น, ดอกเบี้ย'], ['RRG', 'ยกเลิกรับโอนหนี้ค้ำประกัน'],
];
function LcTabStatement({ loan }) {
  const rows = React.useMemo(() => lcBuildStatement(loan), [loan]);
  return (
    <div>
      <div className="table-wrap lcd-stmt-wrap">
        <table className="tbl lcd-stmt">
          <thead>
            <tr>
              <th rowSpan="2" className="center">#</th>
              <th rowSpan="2">วันที่ทำรายการ</th>
              <th rowSpan="2">วันที่ใบเสร็จ</th>
              <th rowSpan="2">เลขที่ใบเสร็จ</th>
              <th rowSpan="2" className="center">รายการ</th>
              <th rowSpan="2" className="center">งวด</th>
              <th colSpan="2" className="center grp">รับ</th>
              <th colSpan="2" className="center grp">จ่าย / ยกเลิก</th>
              <th rowSpan="2" className="num">คงเหลือ</th>
              <th rowSpan="2">ด/บ ตั้งแต่</th>
              <th rowSpan="2">ด/บ ถึง</th>
              <th rowSpan="2" className="num">ด/บ งวด</th>
              <th rowSpan="2" className="num">ด/บ ค้าง</th>
              <th rowSpan="2" className="num">ด/บ คืน</th>
              <th rowSpan="2" className="center">ประเภทเงิน</th>
              <th rowSpan="2">ผู้บันทึก</th>
            </tr>
            <tr>
              <th className="num sub">เงินต้น</th><th className="num sub">ดอกเบี้ย</th>
              <th className="num sub">เงินต้น</th><th className="num sub">ดอกเบี้ย</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.seq} className={r.head ? 'lcd-stmt-head' : ''}>
                <td className="center mono">{r.seq}</td>
                <td className="mono">{lcBE(r.txnDate)}</td>
                <td className="mono">{lcBE(r.receiptDate)}</td>
                <td className="mono">{r.receiptNo || '—'}</td>
                <td className="center mono">{r.code}</td>
                <td className="center mono">{r.term}</td>
                <td className="num">{r.inPrincipal != null ? lcMoney(r.inPrincipal) : ''}</td>
                <td className="num">{r.inInterest != null ? lcMoney(r.inInterest) : ''}</td>
                <td className="num">{r.outPrincipal != null ? lcMoney(r.outPrincipal) : ''}</td>
                <td className="num">{r.outInterest != null ? lcMoney(r.outInterest) : ''}</td>
                <td className="num strong">{lcMoney(r.balance)}</td>
                <td className="mono">{lcBE(r.intFrom)}</td>
                <td className="mono">{r.intTo ? lcBE(r.intTo) : '—'}</td>
                <td className="num">{lcMoney(r.intPeriod)}</td>
                <td className="num">{lcMoney(r.intOwed)}</td>
                <td className="num">{lcMoney(r.intBack)}</td>
                <td className="center mono">{r.fund}</td>
                <td className="mono lcd-officer">{r.officer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lcd-legend">
        {LC_CODE_LEGEND.map(([c, t]) => (
          <div className="lcd-legend-item" key={c}><b className="mono">{c}</b><span>{t}</span></div>
        ))}
      </div>
    </div>
  );
}

// ═══ TAB 3 · หลักประกัน ═════════════════════════════════════════════
function LcTabCollateral({ loan }) {
  const rows = lcBuildCollateral(loan);
  if (!rows.length) return <div className="lcd-empty">ไม่มีข้อมูลหลักประกันสำหรับสัญญานี้</div>;
  const totAmt = rows.reduce((a, x) => a + x.amount, 0);
  const totPct = rows.reduce((a, x) => a + x.pct, 0);
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th className="center">ประเภท</th>
            <th>เลขที่อ้างอิง</th>
            <th>รายการ</th>
            <th className="num">คงเหลือ / รอเบิก</th>
            <th className="num">% ค้ำ</th>
            <th className="num">จำนวนเงินค้ำ</th>
            <th className="center">สถานะรับหนี้</th>
            <th className="center">ฟ้องคนค้ำ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="center mono">{r.type}</td>
              <td className="mono">{r.ref}</td>
              <td>{r.name}<div className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.sub}</div></td>
              <td className="num">{lcMoney(r.remain)}</td>
              <td className="num mono">{r.pct.toFixed(2)}%</td>
              <td className="num">{lcMoney(r.amount)}</td>
              <td className="center">
                <span className={"chip " + (r.status === 'หนี้ไหล' ? 'success' : 'warning')}>{r.status}</span>
              </td>
              <td className="center mono">{r.sued}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4" className="num">รวม</td>
            <td className="num mono">{totPct.toFixed(2)}%</td>
            <td className="num">{lcMoney(totAmt)}</td>
            <td colSpan="2" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ═══ TAB 4 · ประวัติการส่ง ══════════════════════════════════════════
// เอกสารเปลี่ยนแปลงการส่งชำระ — แต่ละเอกสารมี 2 บรรทัด: ค่าใหม่ (บน) / ค่าเดิม (ล่าง)
function lcBuildSendHistory(loan) {
  const base = loan.installment || 0;
  const officers = ['PEERAPOL', 'PUNYANUCH', 'AUTO-SCHEDULE', 'END_PERIOD', 'PAWIN'];
  const specs = [
    { back: 0, m: 0, form: 'คงยอด', to: base, from: base - 200, sNew: 'ส่งปกติ', sOld: 'งดต้น',
      note: `ครบกำหนดพักชำระหนี้ เพิ่มยอดส่ง เป็น ${lcMoney(base)}` },
    { back: 0, m: -5, form: 'คงยอด', to: base - 200, from: base - 200, sNew: 'งดต้น', sOld: 'ส่งปกติ',
      note: `บริหารจัดการหนี้ พักหนี้ตั้งแต่ 256804 ถึง 256808 ยอดส่ง/เดือน = ${lcMoney(base)}` },
    { back: 0, m: -8, form: 'คงยอด', to: base - 200, from: base - 300, sNew: 'ส่งปกติ', sOld: 'ส่งปกติ',
      note: 'ปรับงวดผ่อนชำระ ตามประกาศโครงการพักชำระหนี้ 2567' },
    { back: 1, m: 0, form: 'คงยอด', to: base - 300, from: base - 300, sNew: 'ส่งปกติ', sOld: 'งดต้น',
      note: 'ครบกำหนดพักชำระหนี้' },
    { back: 1, m: -3, form: 'คงยอด', to: base - 300, from: base - 300, sNew: 'งดต้น', sOld: 'ส่งปกติ',
      note: `โครงการพักชำระหนี้ พักหนี้ตั้งแต่ 256706 ถึง 256708 ยอดส่ง/เดือน = ${lcMoney(base - 200)}` },
    { back: 1, m: -3, form: 'คงยอด', to: base - 300, from: base - 300, sNew: 'ส่งปกติ', sOld: 'งดต้น', note: '' },
    { back: 1, m: -4, form: 'คงยอด', to: base - 300, from: base - 300, sNew: 'งดต้น', sOld: 'ส่งปกติ',
      note: `โครงการพักชำระหนี้ พักหนี้ตั้งแต่ 256705 ถึง 256705 ยอดส่ง/เดือน = ${lcMoney(base - 300)}` },
  ];
  const anchor = loan.lastPaymentDate || loan.startDate;
  return specs.map((s, i) => {
    const d = new Date(anchor);
    d.setFullYear(d.getFullYear() - s.back);
    d.setMonth(d.getMonth() + s.m);
    const iso = d.toISOString().slice(0, 10);
    const be = (d.getFullYear() + 543) % 100;
    return {
      docNo: `CL${be}${String(1000 + i * 1373).padStart(6, '0')}`.slice(0, 12),
      date: iso, officer: officers[i % officers.length],
      form: s.form, amtNew: s.to, amtOld: s.from, stNew: s.sNew, stOld: s.sOld,
      owedPerTerm: 0, stepUp: loan.annualStepUp || 0, note: s.note,
    };
  });
}

function LcTabSendHistory({ loan }) {
  const rows = React.useMemo(() => lcBuildSendHistory(loan), [loan]);
  if (!rows.length) return <div className="lcd-empty">ยังไม่มีประวัติการส่งชำระของสัญญานี้</div>;
  return (
    <div className="table-wrap">
      <table className="tbl lcd-sh">
        <thead>
          <tr>
            <th className="center">เลขที่เอกสาร</th>
            <th className="center">รูปแบบ</th>
            <th className="num">ชำระ / งวด</th>
            <th className="center">สถานะ</th>
            <th className="num">ด/บ ค้าง<br />ต่องวด</th>
            <th className="num">เพิ่มชำระ<br />ต้นเงินปีละ</th>
            <th className="center">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <React.Fragment key={i}>
              <tr className="lcd-sh-a">
                <td rowSpan="2" className="center lcd-sh-doc">
                  <div className="mono lcd-sh-no">{r.docNo}</div>
                  <div className="mono muted">{lcBE(r.date)}</div>
                  <div className="muted lcd-sh-off">{r.officer}</div>
                </td>
                <td className="center">{r.form}</td>
                <td className="num mono">{lcMoney(r.amtNew)}</td>
                <td className="center">{r.stNew}</td>
                <td rowSpan="2" className="num mono">{lcMoney(r.owedPerTerm)}</td>
                <td rowSpan="2" className="num mono">{lcMoney(r.stepUp)}</td>
                <td rowSpan="2" className="lcd-sh-note">{r.note || ''}</td>
              </tr>
              <tr className="lcd-sh-b">
                <td className="center">{r.form}</td>
                <td className="num mono">{lcMoney(r.amtOld)}</td>
                <td className="center">{r.stOld}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══ TAB 5 · ชำระเงินกู้ล่วงหน้า ════════════════════════════════════
function LcTabAdvance({ loan }) {
  const adv = loan.advance || null;
  return (
    <div>
      <div className="lcd-adv-summary">
        <LcKV label="เลขสัญญา" mono>{loan.contract}</LcKV>
        <LcKV label="ต้นเงินล่วงหน้า" mono strong>{lcMoney(adv ? adv.principal : 0)}</LcKV>
        <LcKV label="ดอกเบี้ยล่วงหน้า" mono tone="hl-dark">{lcMoney(adv ? adv.interest : 0)}</LcKV>
        <LcKV label="คงเหลือ" mono tone="hl-green">{lcMoney(adv ? adv.balance : 0)}</LcKV>
      </div>
      <div className="table-wrap">
        <table className="tbl lcd-adv-tbl">
          <thead>
            <tr>
              <th rowSpan="2" className="center">ลำดับ</th>
              <th rowSpan="2">รายการ</th>
              <th rowSpan="2">วันที่ใบเสร็จ</th>
              <th rowSpan="2">เลขที่เอกสาร</th>
              <th colSpan="2" className="center grp">รับ</th>
              <th colSpan="2" className="center grp">จ่าย / ยกเลิก</th>
              <th rowSpan="2" className="num">คงเหลือ</th>
              <th rowSpan="2">ผู้บันทึก</th>
            </tr>
            <tr>
              <th className="num sub">ต้นเงิน</th><th className="num sub">ดอกเบี้ย</th>
              <th className="num sub">ต้นเงิน</th><th className="num sub">ดอกเบี้ย</th>
            </tr>
          </thead>
          <tbody>
            {(adv && adv.rows ? adv.rows : []).map((r, i) => (
              <tr key={i}>
                <td className="center mono">{i + 1}</td>
                <td className="mono">{r.code}</td>
                <td className="mono">{lcBE(r.date)}</td>
                <td className="mono">{r.docNo}</td>
                <td className="num">{lcMoney(r.inP)}</td>
                <td className="num">{lcMoney(r.inI)}</td>
                <td className="num">{lcMoney(r.outP)}</td>
                <td className="num">{lcMoney(r.outI)}</td>
                <td className="num strong">{lcMoney(r.balance)}</td>
                <td className="mono">{r.officer}</td>
              </tr>
            ))}
            {(!adv || !adv.rows || !adv.rows.length) && (
              <tr><td colSpan="10" className="lcd-empty" style={{ padding: '26px 0' }}>ไม่มีรายการชำระเงินกู้ล่วงหน้าของสัญญานี้</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══ MODAL SHELL ════════════════════════════════════════════════════
const LC_TABS = [
  { id: 'detail', label: 'รายละเอียดสัญญา' },
  { id: 'statement', label: 'Statement' },
  { id: 'collateral', label: 'หลักประกัน' },
  { id: 'sendhist', label: 'ประวัติการส่ง' },
  { id: 'advance', label: 'ชำระเงินกู้ล่วงหน้า' },
];

function LoanContractDetailModal({ loan, member, onClose }) {
  const { useState, useEffect } = React;
  const [tab, setTab] = useState('detail');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!loan) return null;
  const typeName = loan.typeName || 'เงินกู้สามัญ';

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lcd-modal" role="dialog" aria-modal="true">
        <div className="modal-head lcd-head">
          <h2>รายละเอียดสัญญา</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        {/* การ์ดหัวสัญญา */}
        <div className="lcd-contract-head">
          <div className="lcd-ch-field"><span className="lcd-ch-k">เลขที่สัญญา</span><span className="lcd-ch-v mono">{loan.contract}</span></div>
          <div className="lcd-ch-field wide"><span className="lcd-ch-k">ประเภทเงินกู้</span><span className="lcd-ch-v">{loan.typeCode ? loan.typeCode + ' ' : ''}{typeName}</span></div>
          <div className="lcd-ch-field"><span className="lcd-ch-k">ทะเบียน</span><span className="lcd-ch-v mono">{lcReg(member && member.code)}</span></div>
          <div className="lcd-ch-field wide"><span className="lcd-ch-k">ชื่อ-ชื่อสกุล</span><span className="lcd-ch-v">{member && member.name}</span></div>
        </div>

        {/* แท็บ */}
        <div className="tabs-bar lcd-tabs">
          {LC_TABS.map(t => (
            <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* เนื้อหา */}
        <div className="modal-body lcd-body">
          {tab === 'detail' && <LcTabDetail loan={loan} />}
          {tab === 'statement' && <LcTabStatement loan={loan} />}
          {tab === 'collateral' && <LcTabCollateral loan={loan} />}
          {tab === 'sendhist' && <LcTabSendHistory loan={loan} />}
          {tab === 'advance' && <LcTabAdvance loan={loan} />}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { LoanContractDetailModal });
