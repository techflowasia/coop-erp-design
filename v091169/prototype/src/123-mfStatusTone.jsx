// ════════════════════════════════════════════════════════════════════
//  แท็บ "ข้อมูลการเงินและสัญญา" ในหน้าทะเบียนสมาชิก
//  หุ้น · เงินกู้ · ฉุกเฉินหักโอน · เรียกเก็บ · ค้ำให้ผู้อื่น · ผู้ค้ำให้สมาชิก
//  (เรนเดอร์แบบหน้าจอ — ใช้คลาส .summary-card / .tbl / .pill / .chip)
// ════════════════════════════════════════════════════════════════════

// ── helper: แปลงสถานะ (ข้อความไทย) → โทนของ pill ──
function mfStatusTone(status) {
  if (!status) return 'neutral';
  if (/ผิดนัด|ล่าช้า|ค้าง|เกินกำหนด|อายัด/.test(status)) return 'bad';
  if (/หยุดส่ง|งดส่ง|พัก/.test(status)) return 'warn';
  if (/ปรับ.*โครงสร้าง|โครงสร้างหนี้|ดำเนินคดี/.test(status)) return 'info';
  if (/ปกติ|ส่งปกติ|ชำระแล้ว/.test(status)) return 'ok';
  return 'neutral';
}
const mfPill = (status) => <span className={"pill " + mfStatusTone(status)}>{status || '—'}</span>;
const mfMoney = (v, d = 2) => fmt.money(v || 0, d);

function MFEmpty({ children }) {
  return <div className="empty-state">{children}</div>;
}

// reusable summary strip
function MFSummary({ cards }) {
  return (
    <div className="summary-row" style={{ marginTop: 0 }}>
      {cards.map((c, i) => (
        <div key={i} className={"summary-card" + (c.accent ? " accent" : "")}>
          <div className="label">{c.label}</div>
          <div className="value">{c.value}</div>
          {c.sub ? <div className="sub">{c.sub}</div> : null}
        </div>
      ))}
    </div>
  );
}

// reusable scrollable table wrapper
function MFTableWrap({ minWidth, children }) {
  return (
    <div className="table-wrap" style={{ marginTop: 12 }}>
      <div className="table-scroll">
        <table className="tbl" style={{ minWidth }}>{children}</table>
      </div>
    </div>
  );
}

// ─── หุ้น — Statement รายการส่งหุ้น ──────────────────────────────────
//  แสดงทุนเรือนหุ้นเป็น "ใบแสดงรายการเคลื่อนไหว" (statement) แทนตารางบัญชีหุ้น
//  · แถบสรุปยอด → ตัวกรองปี → ตารางรายการส่งหุ้นพร้อมยอดสะสมต่อเนื่อง
const SHARE_CHANNELS = {
  payroll:  { label: 'หักเงินเดือน',  tone: 'primary' },
  cash:     { label: 'เงินสด',        tone: '' },
  transfer: { label: 'โอนเงิน',       tone: 'info' },
  internal: { label: 'ปันผล/เฉลี่ยคืน', tone: 'success' },
};

function SharesTab({ data }) {
  const [detailRef, setDetailRef] = React.useState(null);
  const shares = data.shares || [];
  const st = data.shareStatement;
  if (!st || !st.entries || !st.entries.length) {
    if (!shares.length) return <MFEmpty>ยังไม่มีบัญชีทุนเรือนหุ้นของสมาชิกรายนี้</MFEmpty>;
  }

  const par = (st && st.parValue) || 10;
  const opening = (st && st.openingBalance) || 0;

  // ── ปีงบ (พ.ศ.) ที่มีรายการ — สำหรับตัวกรอง ──
  const years = React.useMemo(() => {
    const ys = new Set((st ? st.entries : []).map(e => e.period.split('/')[0]));
    return Array.from(ys).sort().reverse();
  }, [st]);
  const [year, setYear] = React.useState('all');

  // ── คำนวณยอดสะสมต่อเนื่อง (เรียงเก่า→ใหม่) ──
  const withRunning = React.useMemo(() => {
    let bal = opening, sh = (st && st.openingShares) || 0;
    return (st ? st.entries : []).map(e => {
      bal += e.amount; sh += e.amount / par;
      return { ...e, running: bal, runningShares: sh, shares: e.amount / par };
    });
  }, [st, opening, par]);

  // กรองตามปี แล้วกลับลำดับเป็น ใหม่→เก่า สำหรับแสดงผล
  const filtered = withRunning.filter(e => year === 'all' || e.period.startsWith(year));
  const rows = filtered.slice().reverse();

  // ยอดสรุปของช่วงที่กรอง
  const periodIn = filtered.filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0);
  const periodOut = filtered.filter(e => e.amount < 0).reduce((a, e) => a - e.amount, 0);
  const closing = withRunning.length ? withRunning[withRunning.length - 1].running : opening;
  const closingShares = withRunning.length ? withRunning[withRunning.length - 1].runningShares : 0;
  const monthly = shares.reduce((a, x) => a + (x.status === 'ปกติ' ? (x.perMonth || 0) : 0), 0);
  const termCnt = Math.max(0, ...shares.map(x => x.term || 0));

  // ยอดยกมาต้นช่วงที่กรอง (ก่อนรายการแรกที่แสดง)
  const openOfRange = filtered.length ? filtered[0].running - filtered[0].amount : closing;

  return (
    <div>
      <div className="mf-stmt-sum">
        <MFSummary cards={[
          { label: 'มูลค่าหุ้นปัจจุบัน', value: '฿ ' + mfMoney(closing, 2), sub: 'ทุนเรือนหุ้นสะสม', accent: true },
          { label: 'จำนวนหุ้นสะสม', value: mfMoney(closingShares, 0) + ' หุ้น', sub: 'มูลค่าหุ้นละ ' + mfMoney(par, 2) + ' บาท' },
          { label: 'ค่าหุ้นส่งรายเดือน', value: '฿ ' + mfMoney(monthly, 2), sub: 'หักจากเงินเดือน' },
          { label: 'จำนวนงวดที่ส่งสะสม', value: mfMoney(termCnt, 0) + ' งวด', sub: 'บัญชีหุ้นสะสมรายเดือน' },
        ]} />
      </div>

      {/* แถบหัวข้อ statement + ตัวกรองปี */}
      <div className="mf-stmt-bar">
        <div className="mf-stmt-title">
          <Icon name="receipt" size={15} />
          <span>รายการส่งหุ้น (Statement)</span>
          <span className="muted" style={{ fontWeight: 400 }}>
            {filtered.length} รายการ{year !== 'all' ? ` · ปี ${year}` : ''}
          </span>
        </div>
        <div className="mf-stmt-filter">
          <span className="muted" style={{ fontSize: 12 }}>ปีบัญชี</span>
          <select className="cfg-input sm" value={year} onChange={e => setYear(e.target.value)}
                  style={{ width: 120 }}>
            <option value="all">ทุกปี</option>
            {years.map(y => <option key={y} value={y}>พ.ศ. {y}</option>)}
          </select>
        </div>
      </div>

      <MFTableWrap minWidth={980}>
        <thead>
          <tr>
            <th style={{ width: 96 }}>วันที่</th>
            <th className="center" style={{ width: 76 }}>งวด</th>
            <th>รายการ</th>
            <th className="center" style={{ width: 116 }}>ช่องทาง</th>
            <th style={{ width: 130 }}>เลขที่อ้างอิง</th>
            <th className="num" style={{ width: 84 }}>จำนวนหุ้น</th>
            <th className="num" style={{ width: 110 }}>ส่งเข้า</th>
            <th className="num" style={{ width: 110 }}>ลด / ถอน</th>
            <th className="num" style={{ width: 124 }}>ยอดสะสม</th>
            <th className="center" style={{ width: 96 }}>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x, i) => {
            const ch = SHARE_CHANNELS[x.channel] || { label: x.channel, tone: '' };
            const isIn = x.amount >= 0;
            return (
              <tr key={i}>
                <td className="mono">{fmt.date(x.date)}</td>
                <td className="center mono">{x.period}</td>
                <td style={{ fontWeight: 500 }}>{x.desc}</td>
                <td className="center"><span className={'chip ' + ch.tone}>{ch.label}</span></td>
                <td className="mono muted" style={{ fontSize: 'var(--font-xs)' }}>{x.ref}</td>
                <td className={'num mono ' + (isIn ? '' : 'warn-text')}>
                  {(isIn ? '+' : '−') + mfMoney(Math.abs(x.shares), 0)}
                </td>
                <td className="num mono">{isIn ? mfMoney(x.amount, 2) : '—'}</td>
                <td className="num mono">{!isIn ? <span className="warn-text">{mfMoney(-x.amount, 2)}</span> : '—'}</td>
                <td className="num mono" style={{ fontWeight: 600 }}>{mfMoney(x.running, 2)}</td>
                <td className="center">
                  <button className="btn link sm" onClick={() => setDetailRef(x.ref)}>
                    <Icon name="eye" size={13} /> ดูรายละเอียด
                  </button>
                </td>
              </tr>
            );
          })}
          <tr className="mf-stmt-bf">
            <td colSpan="6">ยอดยกมา ณ ต้นช่วง{year !== 'all' ? ` (ก่อนปี ${year})` : ''}</td>
            <td className="num mono">—</td>
            <td className="num mono">—</td>
            <td className="num mono" style={{ fontWeight: 600 }}>{mfMoney(openOfRange, 2)}</td>
            <td />
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="6">รวมเคลื่อนไหวในช่วง</td>
            <td className="num mono">{mfMoney(periodIn, 2)}</td>
            <td className="num mono">{periodOut ? <span className="warn-text">{mfMoney(periodOut, 2)}</span> : '—'}</td>
            <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(closing, 2)}</td>
            <td />
          </tr>
        </tfoot>
      </MFTableWrap>

      {/* บัญชีหุ้นที่เกี่ยวข้อง */}
      {shares.length > 0 && (
        <div className="mf-stmt-accts">
          <span className="muted" style={{ fontSize: 12 }}>บัญชีหุ้นของสมาชิก</span>
          {shares.map((s, i) => (
            <span key={i} className={'chip ' + mfStatusTone(s.status || s.sendStatus)}>
              {s.name} · {mfMoney(s.shareValue, 0)}
            </span>
          ))}
        </div>
      )}

      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">คลิก “ดูรายละเอียด” ที่รายการเพื่อเปิด Statement ทุนเรือนหุ้นเต็มรูปและประวัติการเปลี่ยนแปลงการส่ง — ยอดสะสมคำนวณต่อเนื่องจากยอดยกมา</span>
      </div>

      {detailRef && (
        <ShareStatementDetailModal data={data} focusRef={detailRef} onClose={() => setDetailRef(null)} />
      )}
    </div>
  );
}

// ─── เงินกู้ ──────────────────────────────────────────────────────────
function LoansTab({ data }) {
  const [detailLoan, setDetailLoan] = React.useState(null);
  const loans = data.loans || [];
  if (!loans.length) return <MFEmpty>ไม่มีสัญญาเงินกู้ของสมาชิกรายนี้</MFEmpty>;

  const totAmount = loans.reduce((a, x) => a + (x.amount || 0), 0);
  const totRemain = loans.reduce((a, x) => a + (x.remaining || 0), 0);
  const totDue = loans.reduce((a, x) => a + (x.interestDue || 0), 0);
  const active = loans.filter(x => (x.remaining || 0) > 0).length;

  return (
    <div>
      <MFTableWrap minWidth={1440}>
        <thead>
          <tr>
            <th>เลขที่สัญญา</th>
            <th>วันเริ่มสัญญา</th>
            <th>ประเภทการชำระ</th>
            <th className="center">งวด</th>
            <th className="center">อัตรา</th>
            <th className="num">วงเงินกู้</th>
            <th className="num">เงินกู้คงเหลือ</th>
            <th className="num">ด.บ.ค้าง</th>
            <th className="center">ปรับโครงสร้างหนี้ (ครั้ง)</th>
            <th className="center">การชำระ</th>
            <th className="center">สถานะสัญญา</th>
            <th className="center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {loans.map((x, i) => (
            <tr key={i}>
              <td className="mono" style={{ fontWeight: 500 }}>{x.contract}
                <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>{x.insurer || '—'}</div>
              </td>
              <td>{fmt.date(x.startDate)}</td>
              <td>{x.payType}</td>
              <td className="center mono">{x.lastTerm}/{x.totalTerms}</td>
              <td className="center mono">{x.rate ? x.rate.toFixed(2) + '%' : '—'}</td>
              <td className="num">{mfMoney(x.amount, 2)}</td>
              <td className="num" style={{ fontWeight: 500 }}>{mfMoney(x.remaining, 2)}</td>
              <td className="num">{x.interestDue ? mfMoney(x.interestDue, 2) : '—'}</td>
              <td className="center mono">{x.restructureCount ? <span className="chip info">{x.restructureCount} ครั้ง</span> : <span className="muted">—</span>}</td>
              <td className="center">{mfPill(x.paymentStatus)}</td>
              <td className="center">{mfPill(x.contractStatus)}</td>
              <td className="center">
                <button className="btn link sm" onClick={() => setDetailLoan(x)}>
                  <Icon name="eye" size={13} /> ดูรายละเอียด
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5">รวมภาระเงินกู้ทั้งหมด</td>
            <td className="num">{mfMoney(totAmount, 2)}</td>
            <td className="num">{mfMoney(totRemain, 2)}</td>
            <td className="num">{mfMoney(totDue, 2)}</td>
            <td colSpan="4" />
          </tr>
        </tfoot>
      </MFTableWrap>
      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">คลิก “ดูรายละเอียด” เพื่อเปิดรายละเอียดสัญญา · Statement · หลักประกัน · ประวัติการส่ง · ชำระเงินกู้ล่วงหน้า</span>
      </div>
      {detailLoan && (
        <LoanContractDetailModal loan={detailLoan} member={data.member} onClose={() => setDetailLoan(null)} />
      )}
    </div>
  );
}

// ─── ฉุกเฉินหักโอน ────────────────────────────────────────────────────
function EmergencyTab({ data }) {
  const recs = data.emergencyLoans || [];
  if (!recs.length) return <MFEmpty>ไม่มีประวัติเงินกู้ฉุกเฉินหักโอนของสมาชิกรายนี้</MFEmpty>;

  const totAmount = recs.reduce((a, x) => a + (x.amount || 0), 0);
  const defaulted = recs.filter(x => mfStatusTone(x.status) === 'bad').length;

  return (
    <div>
      <MFTableWrap minWidth={920}>
        <thead>
          <tr>
            <th className="center">ปี (พ.ศ.)</th>
            <th>เลขที่สัญญา</th>
            <th>เลขที่คำขอ</th>
            <th>วันที่ขอ</th>
            <th className="num">จำนวนเงิน</th>
            <th className="center">เดือนเริ่มหัก</th>
            <th>หักล่าสุด</th>
            <th>ผู้ค้ำประกัน</th>
            <th className="center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((x, i) => (
            <tr key={i}>
              <td className="center mono">{x.year}</td>
              <td className="mono">{x.contract}</td>
              <td className="mono">{x.reqNo}</td>
              <td>{fmt.date(x.reqDate)}</td>
              <td className="num" style={{ fontWeight: 500 }}>{mfMoney(x.amount, 2)}</td>
              <td className="center mono">{x.startMonth}</td>
              <td>{fmt.date(x.lastDate)}</td>
              <td>{x.guarantor || '—'}</td>
              <td className="center">{mfPill(x.status)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4">รวมทั้งหมด</td>
            <td className="num">{mfMoney(totAmount, 2)}</td>
            <td colSpan="4" />
          </tr>
        </tfoot>
      </MFTableWrap>
    </div>
  );
}

// ─── เรียกเก็บ ────────────────────────────────────────────────────────
function CollectionTab({ data }) {
  const [detail, setDetail] = React.useState(null);   // { coll, index }
  const recs = data.collections || [];
  if (!recs.length) return <MFEmpty>ไม่มีประวัติการเรียกเก็บของสมาชิกรายนี้</MFEmpty>;

  const totBilled = recs.reduce((a, x) => a + (x.amount || 0), 0);
  const totCollected = recs.reduce((a, x) => a + (x.collected || 0), 0);
  const totRefund = recs.reduce((a, x) => a + (x.refund || 0), 0);

  return (
    <div>
      <MFTableWrap minWidth={920}>
        <thead>
          <tr>
            <th className="center">สังกัด</th>
            <th className="center">งวด</th>
            <th>เลขที่ใบเสร็จ</th>
            <th className="num">ยอดเรียกเก็บ</th>
            <th className="num">ฉุกเฉินหักโอน</th>
            <th className="num">ตัวแทนหัก</th>
            <th className="num">เก็บได้</th>
            <th className="num">คืนเงิน</th>
            <th className="center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((x, i) => (
            <tr key={i}>
              <td className="center mono">{x.dept}</td>
              <td className="center mono">{x.term}</td>
              <td className="mono">{x.receipt}</td>
              <td className="num">{mfMoney(x.amount, 2)}</td>
              <td className="num">{mfMoney(x.emergency, 2)}</td>
              <td className="num">{mfMoney(x.agent, 2)}</td>
              <td className="num" style={{ fontWeight: 500 }}>{mfMoney(x.collected, 2)}</td>
              <td className="num">{x.refund ? <span className="warn-text">{mfMoney(x.refund, 2)}</span> : '—'}</td>
              <td className="center">
                <button className="btn link sm" onClick={() => setDetail({ coll: x, index: i })}>
                  <Icon name="eye" size={13} /> ดูรายละเอียด
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3">รวมทั้งหมด</td>
            <td className="num">{mfMoney(totBilled, 2)}</td>
            <td colSpan="2" />
            <td className="num">{mfMoney(totCollected, 2)}</td>
            <td className="num">{mfMoney(totRefund, 2)}</td>
            <td />
          </tr>
        </tfoot>
      </MFTableWrap>
      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">คลิก “ดูรายละเอียด” เพื่อเปิดใบเสร็จเรียกเก็บของงวดนั้น — รายการหักชำระ ค่าหุ้น · เงินกู้ · ค่าธรรมเนียม พร้อมยอดคงเหลือ</span>
      </div>
      {detail && (
        <ReceiptDetailModal coll={detail.coll} index={detail.index} data={data} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

// ─── ค้ำให้ผู้อื่น ──────────────────────────────────────────────────────
function GuarGivenTab({ data }) {
  const recs = data.guaranteeGiven || [];
  if (!recs.length) return <MFEmpty>สมาชิกรายนี้ไม่ได้ค้ำประกันเงินกู้ให้ผู้อื่น</MFEmpty>;

  const totMax = recs.reduce((a, x) => a + (x.maxAmount || 0), 0);
  const totRemain = recs.reduce((a, x) => a + (x.remaining || 0), 0);
  const risky = recs.filter(x => mfStatusTone(x.status) !== 'ok').length;

  return (
    <div>
      <MFTableWrap minWidth={1080}>
        <thead>
          <tr>
            <th>เลขที่สมาชิกผู้กู้</th>
            <th>ชื่อ-สกุลผู้กู้</th>
            <th className="center">สังกัด</th>
            <th>เลขที่สัญญา</th>
            <th>วันเริ่มสัญญา</th>
            <th className="num">วงเงินกู้</th>
            <th className="center">% ค้ำ</th>
            <th className="num">วงเงินค้ำสูงสุด</th>
            <th className="num">หนี้คงเหลือ</th>
            <th className="center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((x, i) => (
            <tr key={i}>
              <td className="mono">{x.debtorCode || '—'}</td>
              <td style={{ fontWeight: 500 }}>{x.debtor}</td>
              <td className="center mono">{x.debtorDept || '—'}</td>
              <td className="mono">{x.contract}</td>
              <td>{fmt.date(x.startDate)}</td>
              <td className="num">{mfMoney(x.loanAmount, 2)}</td>
              <td className="center mono">{x.percent != null ? x.percent + '%' : '—'}</td>
              <td className="num">{mfMoney(x.maxAmount, 2)}</td>
              <td className="num" style={{ fontWeight: 500 }}>{mfMoney(x.remaining, 2)}</td>
              <td className="center">{mfPill(x.status)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="7">รวมทั้งหมด</td>
            <td className="num">{mfMoney(totMax, 2)}</td>
            <td className="num">{mfMoney(totRemain, 2)}</td>
            <td />
          </tr>
        </tfoot>
      </MFTableWrap>
    </div>
  );
}

// ─── ผู้ค้ำให้สมาชิก ─────────────────────────────────────────────────────
function GuarRecvTab({ data }) {
  const recs = data.guaranteeReceived || [];
  if (!recs.length) return <MFEmpty>ไม่มีผู้ค้ำประกัน/หลักประกันสำหรับเงินกู้ของสมาชิกรายนี้</MFEmpty>;

  const totMax = recs.reduce((a, x) => a + (x.maxAmount || 0), 0);
  const contracts = new Set(recs.map(x => x.contract)).size;

  return (
    <div>
      <MFTableWrap minWidth={920}>
        <thead>
          <tr>
            <th>เลขที่สัญญา</th>
            <th>รหัสค้ำประกัน</th>
            <th>ผู้ค้ำประกัน / หลักประกัน</th>
            <th className="center">% ค้ำ</th>
            <th className="num">วงเงินค้ำสูงสุด</th>
            <th className="num">หนี้คงเหลือ</th>
            <th className="center">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((x, i) => (
            <tr key={i}>
              <td className="mono">{x.contract}</td>
              <td className="mono">{x.code}</td>
              <td style={{ whiteSpace: 'normal' }}>{x.collateralDetail}</td>
              <td className="center mono">{x.percent != null ? x.percent + '%' : '—'}</td>
              <td className="num">{mfMoney(x.maxAmount, 2)}</td>
              <td className="num">{mfMoney(x.remaining, 2)}</td>
              <td className="center">{mfPill(x.status)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4">รวมวงเงินค้ำประกันสูงสุด</td>
            <td className="num">{mfMoney(totMax, 2)}</td>
            <td colSpan="2" />
          </tr>
        </tfoot>
      </MFTableWrap>
    </div>
  );
}

// ─── ข้อมูลหลักทรัพย์ — รายการขึ้นทะเบียนหลักทรัพย์ของสมาชิก ─────────────
function SecuritiesTab({ data }) {
  const recs = data.securities || [];
  if (!recs.length) return <MFEmpty>ไม่มีรายการขึ้นทะเบียนหลักทรัพย์ของสมาชิกรายนี้</MFEmpty>;

  const totAppraisal = recs.reduce((a, x) => a + (x.appraisal || 0), 0);
  const totRemain = recs.reduce((a, x) => a + (x.remainAfterGuarantee || 0), 0);
  const pledged = recs.filter(x => x.contract).length;

  return (
    <div>
      <MFTableWrap minWidth={1080}>
        <thead>
          <tr>
            <th>รหัส</th>
            <th>ชื่อหลักทรัพย์</th>
            <th className="center">ประเภท</th>
            <th>ที่อยู่</th>
            <th className="num">ราคาประเมิน</th>
            <th className="num">มูลค่าคงเหลือหลังค้ำประกัน</th>
          </tr>
        </thead>
        <tbody>
          {recs.map((x, i) => (
            <tr key={i}>
              <td className="mono" style={{ fontWeight: 500 }}>{x.code}
                {x.contract && <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>ค้ำสัญญา {x.contract}</div>}
              </td>
              <td style={{ whiteSpace: 'normal' }}>{x.name}</td>
              <td className="center"><span className="chip">{x.type}</span></td>
              <td style={{ whiteSpace: 'normal', minWidth: 240 }} className="muted">{x.address}</td>
              <td className="num">{mfMoney(x.appraisal, 2)}</td>
              <td className="num" style={{ fontWeight: 500 }}>{mfMoney(x.remainAfterGuarantee, 2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="4">รวมทั้งหมด</td>
            <td className="num">{mfMoney(totAppraisal, 2)}</td>
            <td className="num">{mfMoney(totRemain, 2)}</td>
          </tr>
        </tfoot>
      </MFTableWrap>
    </div>
  );
}

// ─── จ่ายเบี้ยประชุม — รายการรับเงินของสมาชิกจากใบสำคัญจ่าย ──────────
//  ดึงผู้รับเงินที่ตรงกับสมาชิกรายนี้จากทุกใบสำคัญจ่าย → แสดงรายละเอียดการรับเงิน
//  (เลขที่ใบสำคัญจ่าย · รายการ · วิธีรับเงิน · บัญชี/เช็ค · จำนวนเงิน · สถานะ)
function MeetingFeeTab({ data }) {
  const receipts = React.useMemo(
    () => (window.vchMemberReceipts ? window.vchMemberReceipts(data.member) : []),
    [data.member && data.member.code, data.member && data.member.name]
  );

  if (!receipts.length) {
    return <MFEmpty>ยังไม่มีรายการรับเบี้ยประชุม / ค่าตอบแทนของสมาชิกรายนี้จากใบสำคัญจ่าย</MFEmpty>;
  }

  const total = receipts.reduce((a, r) => a + Number(r.payee.amount || 0), 0);
  const paid = receipts.filter(r => r.voucher.status === 'paid');
  const paidTotal = paid.reduce((a, r) => a + Number(r.payee.amount || 0), 0);
  const pendingCnt = receipts.length - paid.length;

  const methodChip = (m) => {
    const l = window.vchPayMethodLabel(m);
    const cls = m === 'cheque' ? 'warning' : m === 'cash' ? 'info' : 'primary';
    return <span className={"chip " + cls}>{l}</span>;
  };
  const recvDetail = (r) => {
    const p = r.payee;
    const m = window.vchPayeeMethod(p, r.voucher);
    if (m === 'cheque') return <span>เลขที่เช็ค <span className="mono">{p.chequeNo || '—'}</span>{p.chequeDate ? ` · ${fmt.date(p.chequeDate)}` : ''}</span>;
    if (m === 'cash') return <span className="muted">รับเป็นเงินสด ณ ที่ทำการ</span>;
    return <span>{`${p.bank || ''} ${p.branch || ''}`.trim() || '—'}{p.acctNo ? <span className="mono muted"> · {p.acctNo}</span> : null}</span>;
  };

  return (
    <div>
      <div className="mf-stmt-bar">
        <div className="mf-stmt-title">
          <Icon name="receipt" size={15} />
          <span>รายการรับเบี้ยประชุม / ค่าตอบแทน</span>
          <span className="muted" style={{ fontWeight: 400 }}>ดึงจากเมนูใบสำคัญจ่าย · {receipts.length} รายการ</span>
        </div>
      </div>

      <MFTableWrap minWidth={980}>
        <thead>
          <tr>
            <th style={{ width: 100 }}>วันที่</th>
            <th style={{ width: 130 }}>เลขที่ใบสำคัญจ่าย</th>
            <th style={{ minWidth: 240 }}>รายการ</th>
            <th className="center" style={{ width: 120 }}>วิธีรับเงิน</th>
            <th style={{ minWidth: 200 }}>รายละเอียดการรับเงิน</th>
            <th className="num" style={{ width: 110 }}>จำนวนเงิน</th>
            <th className="center" style={{ width: 130 }}>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((r) => {
            const v = r.voucher;
            const st = window.VCH_STATUS[v.status] || window.VCH_STATUS.draft;
            return (
              <tr key={v.id + '-' + r.payeeIdx}>
                <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.docDate)}</td>
                <td className="mono">{v.id}</td>
                <td style={{ whiteSpace: 'normal' }}>{v.note || (v.lines && v.lines[0] && v.lines[0].desc) || '—'}</td>
                <td className="center">{methodChip(window.vchPayeeMethod(r.payee, v))}</td>
                <td style={{ whiteSpace: 'normal' }}>{recvDetail(r)}</td>
                <td className="num" style={{ fontWeight: 600 }}>{mfMoney(r.payee.amount, 2)}</td>
                <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5">รวมยอดรับทั้งสิ้น ({receipts.length} รายการ)</td>
            <td className="num" style={{ fontWeight: 700 }}>{mfMoney(total, 2)}</td>
            <td />
          </tr>
        </tfoot>
      </MFTableWrap>

      <div className="lt-list-foot muted" style={{ marginTop: 10 }}>
        <Icon name="info" size={12} /> รายการนี้ดึงจากเมนู “ใบสำคัญจ่าย” โดยจับคู่ชื่อ/รหัสสมาชิกกับผู้รับเงิน — วิธีรับเงินและรายละเอียดอ้างอิงตามที่บันทึกในใบสำคัญจ่ายแต่ละใบ
      </div>
    </div>
  );
}

// ─── ลูกหนี้ตัวแทน — รายการที่ตัวแทน (หน่วยงาน) เรียกเก็บ/นำส่งแทนสมาชิก ──
//  AGR = ตั้งยอดเรียกเก็บ (เพิ่ม) · ARE = นำส่งชำระ (ลด) → ยอดคงเหลือ
function AgentDebtTab({ data }) {
  const ad = data.agentDebt;
  if (!ad || !ad.rows || !ad.rows.length) {
    return <MFEmpty>ไม่มีรายการลูกหนี้ตัวแทนของสมาชิกรายนี้</MFEmpty>;
  }
  const rows = ad.rows;
  const totAdd = rows.reduce((a, r) => a + (r.add || 0), 0);
  const totReduce = rows.reduce((a, r) => a + (r.reduce || 0), 0);
  const codeChip = (c) => c === 'AGR'
    ? <span className="chip primary">AGR</span>
    : <span className="chip success">ARE</span>;

  return (
    <div>
      <MFSummary cards={[
        { label: 'ยอดค้างชำระ', value: '฿ ' + mfMoney(ad.outstanding, 2), sub: 'งวดเรียกเก็บ ' + (ad.billTerm || '—'), accent: true },
        { label: 'ยอดตั้งเรียกเก็บสะสม (AGR)', value: '฿ ' + mfMoney(totAdd, 2), sub: rows.filter(r => r.code === 'AGR').length + ' รายการ' },
        { label: 'ยอดนำส่งชำระสะสม (ARE)', value: '฿ ' + mfMoney(totReduce, 2), sub: rows.filter(r => r.code === 'ARE').length + ' รายการ' },
      ]} />

      <div className="mf-stmt-bar" style={{ marginTop: 12 }}>
        <div className="mf-stmt-title">
          <Icon name="receipt" size={15} />
          <span>รายการลูกหนี้ตัวแทน</span>
          <span className="muted" style={{ fontWeight: 400 }}>
            แสดงรายการข้อมูลระหว่างปี พ.ศ. {ad.year}{ad.yearTo && ad.yearTo !== ad.year ? ` ถึง ${ad.yearTo}` : ''} · {rows.length} รายการ
          </span>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 12 }}>
        <div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1120 }}>
            <thead>
              <tr>
                <th className="center" rowSpan={2} style={{ width: 52 }}>ลำดับ</th>
                <th rowSpan={2} style={{ width: 116 }}>วันที่ใบทำรายการ</th>
                <th rowSpan={2} style={{ width: 108 }}>วันที่รายการ</th>
                <th className="center" rowSpan={2} style={{ width: 76 }}>รหัสรายการ</th>
                <th className="center" rowSpan={2} style={{ width: 92 }}>งวดรายการ</th>
                <th className="center" colSpan={2} style={{ borderBottom: '1px solid var(--border)' }}>ยอดทำรายการ</th>
                <th className="num" rowSpan={2} style={{ width: 120 }}>ยอดคงเหลือ</th>
                <th className="center" rowSpan={2} style={{ width: 92 }}>ประเภทชำระ</th>
                <th rowSpan={2} style={{ minWidth: 190 }}>ผู้บันทึกรายการ</th>
                <th rowSpan={2} style={{ minWidth: 120 }}>หมายเหตุ</th>
              </tr>
              <tr>
                <th className="num" style={{ width: 110 }}>เพิ่ม</th>
                <th className="num" style={{ width: 110 }}>ลด</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.seq}>
                  <td className="center muted mono">{r.seq}</td>
                  <td className="mono">{r.docDate}</td>
                  <td className="mono">{r.txnDate}</td>
                  <td className="center">{codeChip(r.code)}</td>
                  <td className="center mono">{r.period}</td>
                  <td className="num mono">{r.add ? mfMoney(r.add, 2) : <span className="muted">—</span>}</td>
                  <td className="num mono">{r.reduce ? <span className="warn-text">{mfMoney(r.reduce, 2)}</span> : <span className="muted">—</span>}</td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{mfMoney(r.balance, 2)}</td>
                  <td className="center">{r.payType ? <span className="chip info">{r.payType}</span> : <span className="muted">—</span>}</td>
                  <td>
                    <span className="mono" style={{ fontSize: 12 }}>{r.recordedAt}</span>
                    {r.recordedBy ? <span className="chip" style={{ marginLeft: 6 }}>{r.recordedBy}</span> : null}
                  </td>
                  <td className="muted">{r.note || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5}>รวมรายการทั้งสิ้น ({rows.length} รายการ)</td>
                <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(totAdd, 2)}</td>
                <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(totReduce, 2)}</td>
                <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(ad.outstanding, 2)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">AGR = ตัวแทน (หน่วยงานต้นสังกัด) ตั้งยอดเรียกเก็บแทนสมาชิก · ARE = ตัวแทนนำส่งเงินชำระให้สหกรณ์ — ยอดคงเหลือ 0.00 หมายถึงนำส่งครบแล้ว</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  SharesTab, LoansTab, EmergencyTab, CollectionTab, GuarGivenTab, GuarRecvTab, SecuritiesTab,
  MeetingFeeTab, AgentDebtTab,
});
