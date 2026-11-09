// แถวจัดเก็บรายเดือนที่ชำระผ่านหักกลบแล้ว — ไม่แสดงเป็นยอดเรียกเก็บรายเดือน
const lrqdMcOff = (f, d) => { const sel = (f.offsetLoans || []).filter(o => o.sel && o.contract).map(o => o.contract); return sel.some(c => d.contract === c || String(d.detail || '').indexOf(c) >= 0); };
// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ใบคำขอกู้เงิน: เอกสารพิมพ์ (Print preview + sheets)
//   • พิมพ์ใบคำขอกู้เงิน  (LoanAppPrintSheet)
//   • พิมพ์ตารางผ่อนชำระ  (RepaymentSchedulePrintSheet)
//   • พิมพ์ใบแจ้งชำระหนี้  (DebtNoticePrintSheet)
//  เปิดเป็น overlay พรีวิว → ปุ่ม "พิมพ์ข้อมูล" เรียก window.print()
// ════════════════════════════════════════════════════════════════════

const LRQ_ORG = 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด';

function lrqPrintMeta() {
  const d = new Date();
  return { date: fmt.date(d.toISOString().slice(0, 10)), time: d.toTimeString().slice(0, 8) };
}
const lrqQr = (text) => {
  try { const q = window.qrcode(0, 'M'); q.addData(String(text || '')); q.make(); return q.createSvgTag({ cellSize: 3, margin: 0, scalable: true }); }
  catch (e) { return ''; }
};
const lrqBarcode = (text) => {
  try { return window.barcode128(text, { module: 1.4, height: 42, quiet: 6 }); }
  catch (e) { return ''; }
};

// แถวคู่ป้าย:ค่า ในหัวเอกสาร
function LrqKV({ label, value, wide }) {
  return (
    <div className={"lrqd-kv" + (wide ? " wide" : "")}>
      <span className="lrqd-kv-l">{label}</span><span className="lrqd-kv-c">:</span>
      <span className="lrqd-kv-v">{value}</span>
    </div>
  );
}
function LrqDocSection({ title, children, flow }) {
  return (
    <div className={"lrqd-sec" + (flow ? " flow" : "")}>
      <div className="lrqd-sec-title">{title}</div>
      {children}
    </div>
  );
}

// ─── ใบคำขอกู้เงิน (เอกสารเต็ม) ──────────────────────────────────────
function LoanAppPrintSheet({ f, calc }) {
  const { derived, netRate, sendable, inst, entitlement, netReceive, otherDeductTotal, offsetTotal, colSum, remain, pctRemain } = calc;
  const meta = lrqPrintMeta();
  const purposeLabel = window.lpLabel ? window.lpLabel('loanPurpose', f.purpose) : f.purpose;
  const ptype = derived ? `${derived.productCode}-${derived.productName}` : '—';
  const projPick = (f.projectKey && window.lpjFindOption)
    ? window.lpjFindOption(f.projectKey, f.productId, f.reqDate, f.member && f.member.code) : null;
  const projLabel = projPick ? projPick.projectName + ' · ' + projPick.roundName : 'ไม่อยู่ในโครงการ (กู้ปกติ)';

  return (
    <div className="lrqd-sheet lrqd-app">
      <div className="lrqd-head-meta" style={{ padding: 0, marginBottom: 14 }}>
        พิมพ์วันที่ {meta.date} &nbsp; เวลา {meta.time} &nbsp; ผู้พิมพ์ : {f.recordedBy} &nbsp; หน้า 1/1
      </div>
      <div className="lrqd-letterhead lrqd-lh-wrap">
        <CoopLetterheadBlock />
        <div className="lrqd-qr">
          <span dangerouslySetInnerHTML={{ __html: lrqQr(f.reqNo) }} />
          <div className="lrqd-barcode-txt mono">{f.reqNo}</div>
        </div>
      </div>

      <div className="lrqd-title" style={{ borderBottom: '1px solid #cfe3d8', paddingBottom: 2 }}>ใบคำขอกู้เงิน</div>
      <div className="lrqd-info">
        <LrqKV label="เลขที่ใบขอกู้" value={f.reqNo} />
        <LrqKV label="ประเภทเงินกู้" value={ptype} wide />
        <LrqKV label="โครงการเงินกู้" value={projLabel} wide />
        <LrqKV label="เลขสมาชิก" value={f.member.code} />
        <LrqKV label="ชื่อ-นามสกุลผู้กู้" value={f.member.name} />
        <LrqKV label="หน่วย/สังกัด" value={f.member.unit} wide />
        <LrqKV label="วัตถุประสงค์" value={purposeLabel} wide />
        <LrqKV label="วันที่ขอกู้" value={fmt.date(f.reqDate)} />
        <LrqKV label="วันที่จ่าย" value={fmt.date(f.payDate)} />
        <LrqKV label="วันที่เริ่มเก็บ" value={f.receiveDate ? (([y, m, d]) => `${d}/${m}/${Number(y) + 543}`)(String(f.receiveDate).slice(0, 10).split('-')) : '—'} />
        <LrqKV label="เบอร์โทรศัพท์รับ SMS" value={f.member.phone} />
        <LrqKV label="สถานะสมาชิก" value={f.member.memberStatus} />
        <LrqKV label="สถานภาพ" value={f.member.maritalStatus} />
        <LrqKV label="ชื่อคู่สมรส (กรณีสมรส)" value={f.member.spouse || '-'} />
        <div className="lrqd-kv wide">
          <span className="lrqd-kv-l">ข้อความแจ้งเตือน</span><span className="lrqd-kv-c">:</span>
          <span className="lrqd-kv-v lrqd-warn">{f.member.memberStatus === 'ปกติ' ? '- ไม่มีรายการแจ้งเตือน -' : `สมาชิกมีสถานะ ${f.member.memberStatus}`}</span>
        </div>
      </div>

      <LrqDocSection title="ข้อมูลประกอบการกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันเกิด</th><th>อายุเกิด</th><th>วันเกษียณ</th><th>อายุงานคงเหลือ</th>
          <th>วันที่เป็นสมาชิก</th><th>อายุสมาชิก</th><th className="num">งวดชำระทุนเรือนหุ้น</th><th className="num">จำนวนทุนเรือนหุ้น</th>
        </tr></thead><tbody><tr>
          <td>{fmt.date(f.member.birthDate)}</td><td>{fmt.ageYM(f.member.birthDate)}</td>
          <td>{fmt.date(f.member.retireDate)}</td><td>{fmt.retireCountdown(f.member.retireDate)}</td>
          <td>{fmt.date(f.member.joinDate)}</td><td>{fmt.ageYM(f.member.joinDate)}</td>
          <td className="num">{sendable}</td><td className="num">{fmt.money(f.member.shareCapital)}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="สิทธิการขอกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">สิทธิการขอกู้</th><th className="num">จำนวนเงินขอกู้</th><th className="num">หนี้ภายนอก</th>
        </tr></thead><tbody><tr>
          <td className="num">{fmt.money(entitlement)}</td><td className="num">{fmt.money(f.amount)}</td><td className="num">{fmt.money(f.prevDebt)}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="อัตราดอกเบี้ย">
        <table className="lrqd-tbl"><thead><tr>
          <th>รูปแบบ</th><th className="num">อัตราดอกเบี้ย</th><th className="num">เพิ่ม</th><th className="num">ลด</th><th>หนังสือรับรองดอกเบี้ย</th>
        </tr></thead><tbody><tr>
          <td>{derived ? derived.interestRateFormLabel : '—'}</td><td className="num">{netRate.toFixed(3)}%</td>
          <td className="num">{(Number(f.rateAdd) || 0).toFixed(3)}%</td><td className="num">{(Number(f.rateReduce) || 0).toFixed(3)}%</td>
          <td>{f.interestCert ? '✓ ออกหนังสือรับรอง' + (f.certPurposeDetail ? ' — ' + f.certPurposeDetail : '') : '-'}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="การชำระ">
        <table className="lrqd-tbl"><thead><tr>
          <th>การชำระ</th><th>ประเภทส่ง</th><th className="num">งวดสูงสุดตามสิทธิ์</th><th className="num">งวดที่ส่งได้</th>
          <th className="num">ยอดชำระ/งวด</th><th className="num">หักหนี้เก่า</th><th className="num">หักอื่นๆ</th><th className="num">หักตัวแทน</th><th className="num">ต้นล่วงหน้า</th><th className="num">ดอกเบี้ยล่วงหน้า</th><th className="num">รับสุทธิ</th>
        </tr></thead><tbody><tr>
          <td>{(window.LR_PAY_METHODS.find(o => o.v === f.payMethod) || {}).l || (derived ? derived.periodCalcLabel : '—')}</td><td>{(window.LR_PAY_TYPES.find(o => o.v === f.payType) || {}).l || 'คงต้น'}</td>
          <td className="num">{derived ? derived.maxPeriods : 0}</td><td className="num">{sendable}</td>
          <td className="num">{fmt.money(inst.payment)}</td><td className="num">{fmt.money(calc.oldDebtPay)}</td>
          <td className="num">{fmt.money(otherDeductTotal)}</td><td className="num">{fmt.money(0)}</td><td className="num">{fmt.money(f.advPrincipal || 0)}</td><td className="num">{fmt.money(f.advInterest || 0)}</td><td className="num">{fmt.money(netReceive)}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="รายรับ-รายจ่าย">
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">เงินเดือน</th><th className="num">เงินได้อื่นๆ</th><th className="num">ยอดเงินหัก</th><th className="num">เงินกองทุน</th><th className="num">เงินเดือนคงเหลือ</th><th className="num">%คงเหลือ</th>
        </tr></thead><tbody><tr>
          <td className="num">{fmt.money(f.income.salary)}</td><td className="num">{fmt.money(f.income.other)}</td><td className="num">{fmt.money(f.income.deduct)}</td>
          <td className="num">{fmt.money(f.income.fund)}</td><td className="num">{fmt.money(remain)}</td><td className="num">{pctRemain.toFixed(2)}%</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="ประกัน">
        <table className="lrqd-tbl"><thead><tr>
          <th>ประเภทประกัน</th><th>ชื่อบริษัทประกัน</th><th className="num">จำนวนเงินประกัน</th><th className="num">เพิ่มทุน</th><th className="num">ลดทุน</th><th>ประเภทบ้าน</th><th className="num">ทุนประกันต่อบ้าน</th><th>รายละเอียด</th>
        </tr></thead><tbody>
          {f.insurances.map((r, i) => (
            <tr key={i}><td>{r.type}</td><td>{r.company}</td><td className="num">{fmt.money(r.amount)}</td>
              <td className="num">{r.addCap ? fmt.money(r.addCap) : '-'}</td><td className="num">{r.reduceCap ? fmt.money(r.reduceCap) : '-'}</td>
              <td>{r.houseType}</td><td className="num">{r.capPerHouse ? fmt.money(r.capPerHouse) : '-'}</td><td>{r.detail}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="การจ่ายเงินกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th>จ่ายเงินกู้เป็น</th><th>เลขที่บัญชี</th><th>ธนาคารต้นทาง</th><th>สาขาธนาคาร</th><th>สาขาปลายทาง</th><th>รหัสไปรษณีย์</th><th>ผู้สั่งจ่าย</th>
          <th className="num">ค่าธรรมเนียม</th><th className="num">ค่าบริการ</th><th className="num">ภาษี</th><th className="num">รวมค่าโอน</th><th className="num">จ่ายสุทธิ</th>
        </tr></thead><tbody>
          {f.disburses.map((r, i) => (
            <tr key={i}><td>{r.method}</td><td className="mono">{r.accNo}</td><td>{r.bankFrom}</td><td>{r.branch}</td><td>{r.branchTo}</td><td className="mono">{r.postcode}</td><td>{r.payer}</td>
              <td className="num">{fmt.money(r.fee)}</td><td className="num">{fmt.money(r.service)}</td><td className="num">{fmt.money(r.tax)}</td>
              <td className="num">{fmt.money(r.fee + r.service + r.tax)}</td><td className="num">{fmt.money(r.net)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="หลักประกัน">
        <table className="lrqd-tbl"><thead><tr>
          <th>ประเภทหลักประกัน</th><th>เลขที่อ้างอิง</th><th>รายละเอียด</th><th className="num">สิทธิสูงสุด</th><th className="num">สิทธิค้ำคงเหลือ</th>
          <th className="num">ยอดค้ำ</th><th className="num">%ค้ำ</th><th className="num">งวดหุ้น</th><th className="num">ค่าหุ้นสะสม</th><th className="num">เงินเดือน</th>
        </tr></thead><tbody>
          {f.collaterals.map((c, i) => {
            const ap = (window.COLL_EDITABLE_FIELDS[c.view && c.view.kind] || []);
            const show = (k, node) => ap.includes(k) ? node : '';
            return (
            <tr key={i}><td>{c.type}</td><td className="mono">{c.ref}</td><td>{c.detail}</td>
              <td className="num">{show('maxRight', fmt.money(c.maxRight, 0))}</td><td className="num">{show('remainRight', fmt.money(c.remainRight, 0))}</td><td className="num">{show('amount', fmt.money(c.amount, 0))}</td>
              <td className="num lrqd-red">{show('pct', (c.pct || 0).toFixed(2) + '%')}</td><td className="num">{show('sharePeriod', c.sharePeriod || 0)}</td><td className="num">{show('shareAcc', fmt.money(c.shareAcc, 0))}</td><td className="num">{show('salary', fmt.money(c.salary, 0))}</td></tr>
          );})}
          <tr className="lrqd-foot"><td colSpan="3" className="right">รวม</td><td className="num">{fmt.money(colSum.maxRight, 0)}</td><td className="num">{fmt.money(colSum.remainRight, 0)}</td>
            <td className="num lrqd-blue">{fmt.money(colSum.amount, 0)}</td><td className="num lrqd-red">0.00%</td><td className="num">0</td><td className="num">{fmt.money(colSum.shareAcc, 0)}</td><td className="num">{fmt.money(colSum.salary, 0)}</td></tr>
        </tbody></table>
      </LrqDocSection>

      <div className="lrqd-two">
        <LrqDocSection title="จัดเก็บรายเดือน">
          <table className="lrqd-tbl"><thead><tr><th>รายละเอียด</th><th className="num">ชำระต้น</th><th className="num">ชำระดอกเบี้ย</th><th className="num">รวมชำระ</th><th className="num">คงเหลือ</th></tr></thead>
            <tbody>
              {f.monthlyCollect.filter(d => !lrqdMcOff(f, d)).map((d, i) => (
                <tr key={i}><td>{d.detail}</td><td className="num">{fmt.money(d.payPrincipal)}</td><td className="num">{fmt.money(d.payInterest)}</td><td className="num">{fmt.money(d.payPrincipal + d.payInterest)}</td><td className="num">{fmt.money(d.remaining)}</td></tr>
              ))}
              <tr className="lrqd-foot"><td className="right">ยอดเรียกเก็บสุทธิ</td>
                <td className="num">{fmt.money(f.monthlyCollect.filter(d => !lrqdMcOff(f, d)).reduce((a, d) => a + d.payPrincipal, 0))}</td>
                <td className="num">{fmt.money(f.monthlyCollect.filter(d => !lrqdMcOff(f, d)).reduce((a, d) => a + d.payInterest, 0))}</td>
                <td className="num lrqd-red">{fmt.money(f.monthlyCollect.filter(d => !lrqdMcOff(f, d)).reduce((a, d) => a + d.payPrincipal + d.payInterest, 0))}</td>
                <td className="num">{fmt.money(f.monthlyCollect.filter(d => !lrqdMcOff(f, d)).reduce((a, d) => a + d.remaining, 0))}</td></tr>
            </tbody></table>
        </LrqDocSection>
        <LrqDocSection title="รายการหักกลบ">
          <table className="lrqd-tbl"><thead><tr><th>เลขที่สัญญา</th><th className="num">คงเหลือ</th><th className="num">ดอกเบี้ยงวด</th><th className="num">ดอกเบี้ยค้าง</th><th className="center">งวด</th><th className="num">ดอกเบี้ยคืน</th></tr></thead>
            <tbody>
              {window.lrOffsetRows(f).filter(o => o.sel).map((o, i) => (
                <tr key={i}><td className="mono">{o.contract}</td><td className="num">{fmt.money(o.remaining)}</td><td className="num">{fmt.money(o.interestPeriod)}</td><td className="num">{fmt.money(o.interestAccrued)}</td><td className="center mono">{o.period}</td><td className="num">{fmt.money(o.interestReturn)}</td></tr>
              ))}
              <tr className="lrqd-foot"><td className="right">ต้นเงินทั้งหมด</td><td className="num lrqd-blue">{fmt.money(offsetTotal)}</td><td colSpan="4" /></tr>
            </tbody></table>
        </LrqDocSection>
      </div>

      <LrqDocSection title="รายการหักอื่นๆ">
        <table className="lrqd-tbl"><thead><tr><th>รหัส</th><th>รายละเอียด</th><th className="num">ยอดหัก</th><th>สถานะ</th></tr></thead>
          <tbody>
            {window.lrFeeDeductRows(f).filter(d => d.amount > 0).map((d, i) => (
              <tr key={'fee' + i}><td>{d.code} {d.detail}</td><td>{d.payer}</td><td className="num">{fmt.money(d.amount)}</td><td>จากการจ่ายเงินกู้</td></tr>
            ))}
            {f.otherDeducts.filter(d => d.sel).map((d, i) => (
              <tr key={i}><td>{d.code} {d.detail}</td><td>{d.payer}</td><td className="num">{fmt.money(Number(d.amount) || 0)}</td><td>{d.status}</td></tr>
            ))}
            <tr className="lrqd-foot"><td colSpan="2" className="right">รวม</td><td className="num lrqd-red">{fmt.money(otherDeductTotal + window.lrFeeDeductRows(f).reduce((a, d) => a + d.amount, 0))}</td><td /></tr>
          </tbody></table>
      </LrqDocSection>

      <div className="lrqd-info lrqd-footer-info">
        <LrqKV label="รหัสตามงาน" value={f.cmsCode} />
        <LrqKV label="ผู้บันทึกข้อมูล" value={f.recordedBy} />
        <LrqKV label="วันที่บันทึกข้อมูล" value={fmt.date(f.recordDate)} />
      </div>
    </div>
  );
}

// ─── ตารางการผ่อนชำระเงินกู้ ────────────────────────────────────────
function RepaymentSchedulePrintSheet({ f, calc }) {
  const meta = lrqPrintMeta();
  const sch = window.lrBuildSchedule(f.amount, calc.netRate, calc.sendable, f.payDate);
  const payTypeLabel = (window.LR_PAY_TYPES.find(o => o.v === f.payType) || {}).l || 'คงต้น';
  return (
    <div className="lrqd-sheet">
      <div className="lrqd-sch-head">
        <div className="lrqd-letterhead"><CoopLetterheadBlock /></div>
        <div className="lrqd-sch-title">ตารางการผ่อนชำระเงินกู้</div>
        <div className="lrqd-sch-meta">พิมพ์วันที่ {meta.date} เวลา {meta.time} &nbsp; หน้า 1/1</div>
      </div>
      <div className="lrqd-sch-info">
        <span>จำนวนเงินกู้ : <b>{fmt.money(f.amount)}</b></span>
        <span>งวดส่ง : <b>{calc.sendable}</b></span>
        <span>ประเภทชำระ : <b>{payTypeLabel}</b></span>
        <span>สมาชิก : <b className="mono">{f.member.code}</b> {f.member.name}</span>
        <span>วันที่จ่ายเงินกู้ : <b>{fmt.date(f.payDate)}</b></span>
        <span>อัตราดอกเบี้ย : <b>{calc.netRate.toFixed(3)}%</b></span>
      </div>
      <table className="lrqd-tbl lrqd-sch-tbl"><thead><tr>
        <th className="num">งวด</th><th>วันที่ชำระ</th><th className="num">เงินกู้คงเหลือ</th><th className="num">รวมหัก</th>
        <th className="num">ดอกเบี้ย</th><th className="num">เงินต้น</th><th className="num">อัตราดอกเบี้ย</th><th className="num">จำนวนวัน</th>
      </tr></thead><tbody>
        {sch.rows.map(r => (
          <tr key={r.n}><td className="num">{r.n}</td><td>{fmt.date(r.date)}</td><td className="num">{fmt.money(r.balance)}</td><td className="num">{fmt.money(r.total)}</td>
            <td className="num">{fmt.money(r.interest)}</td><td className="num">{fmt.money(r.principal)}</td><td className="num">{r.rate.toFixed(2)}%</td><td className="num">{r.days}</td></tr>
        ))}
        <tr className="lrqd-foot"><td colSpan="3" className="right">รวมผ่อนชำระ</td><td className="num">{fmt.money(sch.totals.total)}</td>
          <td className="num">{fmt.money(sch.totals.interest)}</td><td className="num">{fmt.money(sch.totals.principal)}</td><td colSpan="2" /></tr>
      </tbody></table>
    </div>
  );
}

// ─── ใบแจ้งการจ่ายเงินกู้-หักกลบ (ใบแจ้งชำระหนี้) + บันทึกข้อความ ────
const LRQ_TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function lrqThaiDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return String(iso);
  return `${d.getDate()} ${LRQ_TH_MON[d.getMonth()]} ${d.getFullYear() + 543}`;
}
function LrqBlankLine({ w, children }) {
  return <span className="lrqd-nt-line" style={{ minWidth: w || 120 }}>{children}</span>;
}

function LrqDebtNoticeSheet({ f, calc }) {
  const meta = lrqPrintMeta();
  const { offsetTotal, otherDeductTotal, derived } = calc;
  const m = f.member;
  const productLabel = derived ? `${derived.productName} (${derived.productCode})` : '-';
  const reqNoText = f.reqNo || '-';
  const disb = f.disburses[0] || {};
  const feeTransfer = f.disburses.reduce((s, r) => s + Number(r.fee || 0) + Number(r.service || 0), 0);
  const vat = f.disburses.reduce((s, r) => s + Number(r.tax || 0), 0);
  const offsets = window.lrOffsetRows(f).filter(o => o.sel);
  const interestReturn = offsets.reduce((s, o) => s + Number(o.interestReturn || 0), 0);
  const agentAmount = Number(f.agentAmount || calc.agentDeduct || 0);
  const insurAmount = 0, escapeAmount = 0, prepayAmount = 0;
  const net = Math.max(0, f.amount - offsetTotal - otherDeductTotal - feeTransfer - vat - agentAmount);

  // แถวรายการฝั่งซ้าย — คงรูปแบบฟอร์ม 8 บรรทัดเสมอ
  const items = [
    { label: 'ซื้อหุ้นพิเศษ', principal: null, interest: null, amount: null },
    { label: `${productLabel}${offsets[0] ? ' ( ' + offsets[0].contract + ' )' : ''}`, principal: offsetTotal || f.amount, interest: 0, amount: offsetTotal || f.amount },
    ...offsets.slice(1).map(o => ({ label: `หักกลบ ( ${o.contract} )`, principal: o.remaining, interest: o.interestPeriod, amount: o.remaining + o.interestPeriod })),
    ...(f.otherDeducts || []).map(d => ({ label: d.detail, principal: null, interest: null, amount: d.amount })),
    { label: 'EMS', principal: null, interest: null, amount: null },
    { label: 'Online', principal: null, interest: null, amount: null },
    { label: 'ค่าธรรมเนียม - ค่าโอน', principal: null, interest: null, amount: feeTransfer || null },
    { label: 'VAT 7%', principal: null, interest: null, amount: vat || null },
  ];
  while (items.length < 9) items.splice(2, 0, { label: '', principal: null, interest: null, amount: null });
  const itemTotal = items.reduce((s, r) => s + Number(r.amount || 0), 0);
  const cash = (v) => (v === null || v === undefined || v === '') ? '' : fmt.money(v);

  // จำนวนวันที่เก็บดอกเบี้ยเกิน — นับจากวันปิดรับข้อมูล (วันที่ 10 ของเดือน) ถึงวันเบิกเงิน
  const payDay = f.payDate ? new Date(f.payDate).getDate() : 0;
  const overDays = Math.max(0, payDay - 10);

  return (
    <div className="lrqd-sheet lrqd-notice">
      {/* ── ส่วนที่ 1 : ใบแจ้งการจ่ายเงินกู้ - หักกลบ ── */}
      <div className="lrqd-nt-tline" style={{ justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}><b>ใบแจ้งการจ่ายเงินกู้-หักกลบ</b><span className="lrqd-nt-lbl">เลขที่ :</span><u>{reqNoText}</u></span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}><span className="lrqd-nt-lbl">คำขอกู้เลขที่ :</span><b>{reqNoText}{derived ? ' - ' + productLabel : ''}</b></span>
      </div>
      <div className="lrqd-nt-top">
        <div className="lrqd-nt-topL">
          <div className="lrqd-nt-tline"><span className="lrqd-nt-lbl">จ่ายเงินโดย :</span>{disb.method || '-'}{disb.accNo ? ' - ' + disb.accNo : ''}</div>
        </div>
        <div className="lrqd-nt-topR">
          <div className="lrqd-nt-tline"><span className="lrqd-nt-lbl">เบิกเงินวันที่ :</span><u>{lrqThaiDate(f.payDate)}</u></div>
          <div className="lrqd-nt-tline lrqd-nt-agent"><span className="lrqd-nt-lbl">ยอดตัวแทน:</span><b>{fmt.money(agentAmount)}</b></div>
        </div>
      </div>

      <table className="lrqd-nt-grid"><tbody>
        <tr>
          <td className="c1 center">ชื่อ - นามสกุล<div className="b">{m.name}</div></td>
          <td className="c2 center">เลขสมาชิก<div className="b">{String(m.code).replace(/^M-/, '')}</div></td>
          <td className="c3 center" colSpan="2">สังกัด<div className="b">{m.unit}</div></td>
          <td className="c5"><div className="lrqd-nt-box"><span>(3) เงินกู้อนุมัติ</span><span className="v">{fmt.money(f.amount)} บาท</span></div></td>
        </tr>
        <tr className="lrqd-nt-hd">
          <td className="center">รายการ</td><td className="center">ต้นเงิน</td><td className="center">ดอกเบี้ย</td><td className="center">จำนวนเงิน</td>
          <td><div className="lrqd-nt-box"><span>(4) หักเงินตัวแทน</span><span className="v">{fmt.money(agentAmount)} บาท</span></div></td>
        </tr>
        {items.map((r, i) => (
          <tr key={i}>
            <td>{r.label}</td>
            <td className="num">{cash(r.principal)}</td>
            <td className="num">{cash(r.interest)}</td>
            <td className="num">{cash(r.amount)}</td>
            {i === 0 && <td rowSpan="2"><div className="lrqd-nt-box"><span>(5) หักเงินประกันชีวิต</span><span className="v">{fmt.money(insurAmount)} บาท</span></div></td>}
            {i === 2 && <td rowSpan="2"><div className="lrqd-nt-box"><span>(6) หักประกันภัยหนีหนี้</span><span className="v">{fmt.money(escapeAmount)} บาท</span></div></td>}
            {i === 4 && <td rowSpan="2"><div className="lrqd-nt-box"><span>(7) ชำระเงินกู้ล่วงหน้า</span><span className="v">{fmt.money(prepayAmount)} บาท</span></div></td>}
            {i === 6 && <td rowSpan="4"><div className="lrqd-nt-box tall"><span>(8) หักชำระหนี้แล้ว</span><span className="ind">คงเหลือจ่าย</span><span className="v big">{fmt.money(net)} บาท</span></div></td>}
          </tr>
        ))}
        <tr>
          <td className="right">รวม</td><td /><td /><td className="num b">{fmt.money(itemTotal)}</td>
        </tr>
        <tr className="lrqd-nt-foot">
          <td className="center">วงเงินกู้ฉุกเฉิน<div className="lrqd-nt-u">จำนวนเงิน</div></td>
          <td colSpan="3">
            <div className="lrqd-nt-rc">ใบเสร็จเลขที่ <LrqBlankLine w={190} /></div>
            <div className="lrqd-nt-rc">วันที่ <LrqBlankLine w={190}>{lrqThaiDate(f.payDate)}</LrqBlankLine></div>
            <div className="lrqd-nt-rc">เจ้าหน้าที่ออกใบเสร็จ <LrqBlankLine w={150} /></div>
          </td>
          <td className="center">หัวหน้าหน่วยผู้ตรวจสอบ<div className="lrqd-nt-sigline" /><div className="lrqd-nt-sigline" /></td>
        </tr>
      </tbody></table>

      <div className="lrqd-nt-below">
        <span>เจ้าหน้าที่หน่วย &nbsp;<b>{f.recordedBy}</b></span>
        <span className="it">Printed date {meta.date} {meta.time.slice(0, 5)}</span>
        <span><b>ผู้ค้ำประกัน : {(f.collaterals || []).filter(c => c.type === 'คนค้ำประกัน').length} คน</b></span>
      </div>

      {/* ── ส่วนที่ 2 : บันทึกข้อความ ── */}
      <div className="lrqd-memo">
        <div className="lrqd-memo-title">บันทึกข้อความ</div>
        <div className="lrqd-memo-org">{LRQ_ORG} (สอ.กสท.)</div>
        <div className="lrqd-memo-tel">โทร. 02-1044344 กทม.ต่อ 110 &nbsp; ภูมิภาค ต่อ 109 &nbsp; โทรสาร ต่อ 125</div>
        <div className="lrqd-memo-row">ที่ <LrqBlankLine w={170} /> วันที่ <LrqBlankLine w={430} /></div>
        <div className="lrqd-memo-hr" />
        <div className="lrqd-memo-row">เรื่อง &nbsp; การหักลดยอดเงิน (ดอกเบี้ย) เก็บเกิน</div>
        <div className="lrqd-memo-row spread">
          <span>เรียน &nbsp; <b>{m.name}</b></span>
          <span>สมาชิกเลขที่ &nbsp; <b>{String(m.code).replace(/^M-/, '')}</b></span>
        </div>
        <div className="lrqd-memo-row indent">สังกัด &nbsp; {m.unit}</div>
        <p className="lrqd-memo-p">
          <span className="tab" />ตามที่ท่านได้กู้เงินฉุกเฉินจาก{LRQ_ORG} (สอ.กสท.) และรับเงินไปแล้วเมื่อวันที่ <b>{lrqThaiDate(f.payDate)}</b>
        </p>
        <div className="lrqd-memo-row">โดยมีหนี้เดิมค้างอยู่เป็นเงิน <LrqBlankLine w={200}><b>{fmt.money(offsetTotal)}</b></LrqBlankLine> บาท นั้น</div>
        <div className="lrqd-memo-sub">
          <span className="mono">{offsets[0] ? offsets[0].contract : '-'}</span>
          <span>{fmt.money(offsetTotal)} บาท</span>
          <span>คืนดอกเบี้ย</span>
          <span>{fmt.money(interestReturn)} บาท</span>
        </div>
        <p className="lrqd-memo-p">
          <span className="tab" />เนื่องจากท่านได้รับเงินกู้ไปหลังจากวันที่ สอ.กสท. ปิดรับข้อมูล ซึ่งกำหนดไว้ทุกวันที่ 10 ของเดือน จึงทำให้ สอ.กสท. เก็บดอกเบี้ย
          ของหนี้ค้างเดิมเกินไป <LrqBlankLine w={70}><b>{overDays}</b></LrqBlankLine> วัน คิดเป็นจำนวนเงิน <LrqBlankLine w={180}><b>{fmt.money(interestReturn)}</b></LrqBlankLine> บาท
        </p>
        <p className="lrqd-memo-p">
          <span className="tab" />ฉะนั้น สอ.กสท. จะทำการลดยอดเงิน (ดอกเบี้ย) ส่วนที่เก็บเกินไปให้ท่านในการเรียกเก็บดอกเบี้ยประจำเดือนของเดือนถัดไป
        </p>
        <p className="lrqd-memo-p"><span className="tab" />จึงเรียนมาเพื่อโปรดทราบด้วย จักขอบคุณมาก</p>
        <div className="lrqd-memo-sign">
          <div className="lrqd-nt-sigline" />
          <div>( นายมรุต หมุดเพ็ชร์ )</div>
          <div>ผู้จัดการ</div>
        </div>
      </div>
    </div>
  );
}

// ─── ใบประกอบคำขอกู้ — สรุปสมาชิก + ข้อมูลคำเสนอค้ำประกัน ─────
function LrqLoanAttachSheet({ f, calc }) {
  const meta = lrqPrintMeta();
  const m = f.member;
  // แสดงเฉพาะหลักประกันประเภท "คนค้ำประกัน"
  const guarRows = (f.collaterals || []).filter(c => c.type === 'คนค้ำประกัน').map(c => {
    const g = (window.GUAR_MEMBERS || []).find(x => x.code === c.ref || x.code === 'M-' + String(c.ref).replace(/^M-/, ''));
    const mem = window.MEMBER_DATA && window.MEMBER_DATA.member;
    return {
      code: String(c.ref || '').replace(/^M-/, ''),
      name: c.detail || (g ? g.name : '-'),
      marital: (g && g.maritalStatus) || (mem && mem.code === c.ref ? mem.maritalStatus : '') || '-',
      amount: Number(c.amount || 0),
    };
  });
  const guarTotal = guarRows.reduce((s, r) => s + r.amount, 0);
  const otherIncome = (f.income && (f.income.childSupport || f.income.other)) || 0;
  const purposeLabel = (window.LP_OPTS && (window.LP_OPTS.loanPurpose || []).find(o => o.v === f.purpose) || {}).l || '-';
  const oldNormal = (f.offsetLoans || []).filter(o => !/ฉุกเฉิน/.test(o.type || '')).reduce((s, o) => s + Number(o.remaining || 0), 0);
  const oldUrgent = (f.offsetLoans || []).filter(o => /ฉุกเฉิน/.test(o.type || '')).reduce((s, o) => s + Number(o.remaining || 0), 0);

  return (
    <div className="lrqd-sheet lrqd-attach">
      <div className="lrqd-sch-head">
        <div className="lrqd-letterhead"><CoopLetterheadBlock /></div>
        <div className="lrqd-sch-title">ใบประกอบคำขอกู้</div>
        <div className="lrqd-sch-meta">พิมพ์วันที่ {meta.date} เวลา {meta.time} &nbsp; หน้า 1/1</div>
      </div>

      <div className="lrqd-attach-top">
        <div className="lrqd-info">
          <LrqKV label="วันที่ขอกู้" value={fmt.date(f.reqDate)} />
          <LrqKV label="สมาชิก" value={`${String(m.code).replace(/^M-/, '')} - ${m.name}`} wide />
        </div>
        <div className="lrqd-attach-check">
          <span className="lrqd-cbox" /> ไม่ล้มละลาย
          <span className="lrqd-cbox" /> ล้มละลาย
          <div className="lrqd-attach-sign">ผู้ตรวจสอบ <span className="lrqd-dotline" /></div>
        </div>
      </div>

      <table className="lrqd-tbl lrqd-attach-tbl"><thead>
        <tr>
          <th rowSpan="2" className="center">เป็นสมาชิก<br />(เดือน)</th>
          <th rowSpan="2" className="num">รายได้รายเดือน<br />(บาท)</th>
          <th rowSpan="2" className="num">ค่าช่วยเหลือบุตร<br />/รายได้อื่นๆ (บาท)</th>
          <th rowSpan="2" className="num">ค่าหุ้น<br />(บาท)</th>
          <th colSpan="2" className="center">ต้นเงินคงเหลือ (บาท)</th>
          <th rowSpan="2" className="num">กู้ได้ไม่เกิน<br />(บาท)</th>
        </tr>
        <tr><th className="num">สามัญ</th><th className="num">ฉุกเฉิน</th></tr>
      </thead><tbody>
        <tr>
          <td className="center">{m.memberMonths || '-'}</td>
          <td className="num">{fmt.money(m.salary)}</td>
          <td className="num">{fmt.money(otherIncome)}</td>
          <td className="num">{fmt.money(m.shareCapital)}</td>
          <td className="num">{fmt.money(oldNormal)}</td>
          <td className="num">{fmt.money(oldUrgent)}</td>
          <td className="num">{fmt.money(calc.entitlement)}</td>
        </tr>
      </tbody></table>

      <div className="lrqd-guar">
        <div className="lrqd-guar-title">ข้อมูลคำเสนอค้ำประกัน</div>
        <table className="lrqd-tbl lrqd-guar-tbl"><thead><tr>
          <th>เลขที่สมาชิก</th><th>ชื่อ - นามสกุล</th><th>สถานะ</th><th className="num">จำกัดวงเงินค้ำประกัน (บาท)</th>
        </tr></thead><tbody>
          {guarRows.length === 0 && <tr><td colSpan="4" className="center">- ไม่มีผู้ค้ำประกัน -</td></tr>}
          {guarRows.map((r, i) => (
            <tr key={i}><td className="mono">{r.code}</td><td>{r.name}</td><td>{r.marital}</td><td className="num">{fmt.money(r.amount)}</td></tr>
          ))}
          <tr><td colSpan="3" className="lrqd-guar-note">หมายเหตุ ขอกู้{purposeLabel}</td><td className="num">{fmt.money(guarTotal)}</td></tr>
          <tr className="lrqd-foot"><td className="right">รวม</td><td colSpan="2" /><td className="num">{fmt.money(guarTotal)}</td></tr>
        </tbody></table>
      </div>

      <div className="lrqd-sign-row">
        <div className="lrqd-sign"><div className="lrqd-sign-line" />ผู้จัดทำคำขอกู้</div>
        <div className="lrqd-sign"><div className="lrqd-sign-line" />หัวหน้าหน่วยผู้ตรวจสอบ</div>
      </div>
    </div>
  );
}

// ─── หัวเอกสาร (ซ้ำทุกหน้าเมื่อพิมพ์) — ข้อมูลสมาชิก + AMLO + หมายเหตุสถานะ ──
function LrqMemberDetailHead({ m, meta, recordedBy, dr }) {
  return (
    <div className="lrqd-md-head">
      <div className="lrqd-title" style={{ borderBottom: '1px solid #cfe3d8', paddingBottom: 2 }}>รายละเอียดของสมาชิก</div>
      <div className="lrqd-info">
        <LrqKV label="เลขที่สมาชิก" value={m.code} />
        <LrqKV label="ชื่อ - ชื่อสกุล" value={m.name} wide />
        <LrqKV label="สังกัด" value={m.unit} wide />
        <LrqKV label="เงินเดือน" value={fmt.money(m.salary)} />
        <LrqKV label="อายุ" value={fmt.ageYM(m.birthDate)} />
      </div>
      <div className="lrqd-md-amlo"><b>สถานะ AMLO :::&gt;</b> {dr.amlo.status} &nbsp;&nbsp;&nbsp; <b>ระดับความเสี่ยง :::&gt;</b> {dr.amlo.risk}</div>
      <div className="lrqd-sec-title">หมายเหตุ สถานะสมาชิก</div>
      <div className="lrqd-md-notes">
        {(!dr.statusNotes || dr.statusNotes.length === 0) ? <p>- ไม่มีหมายเหตุ -</p> : dr.statusNotes.map((t, i) => <p key={i}>{t}</p>)}
      </div>
    </div>
  );
}

// ─── ใบรายละเอียดสมาชิก — ประวัติสมาชิก/หุ้น/เงินกู้/ชำระ/ค้ำประกัน (ครบตามเอกสารต้นฉบับ) ──
function LrqMemberDetailPrintSheet({ f, calc }) {
  const meta = lrqPrintMeta();
  const m = f.member;
  const dr = f.detailReport || {};
  const share = dr.share || {};
  const contracts = dr.loanContracts || [];
  const contractsTotal = contracts.reduce((s, c) => s + Number(c.remaining || 0), 0);

  // ── ค้ำประกันเงินกู้ให้ผู้อื่น — ไล่หาในทะเบียนลูกหนี้ที่มีสมาชิกรายนี้เป็นผู้ค้ำ ──
  const guarFor = [];
  (window.DN_MEMBERS || []).forEach(dn => {
    (dn.debts || []).forEach(d => {
      (d.guarantors || []).forEach(gt => {
        if (gt.memberCode === m.code) {
          guarFor.push({
            borrower: dn.name, borrowerCode: dn.code, dept: gt.dept || dn.dept, startDate: d.startDate,
            contract: d.contractNo, loan: (d.installment || 0) * (d.totalTerms || 0),
            remain: d.principalRemaining || 0,
          });
        }
      });
    });
  });
  const guarForTotal = guarFor.reduce((a, r) => a + r.remain, 0);

  return (
    <div className="lrqd-sheet lrqd-member">
      <div className="lrqd-head-meta" style={{ padding: 0, marginBottom: 14 }}>
        พิมพ์วันที่ {meta.date} &nbsp; เวลา {meta.time} &nbsp; ผู้พิมพ์ : {f.recordedBy || '-'}
      </div>
      <div className="lrqd-letterhead lrqd-lh-wrap">
        <CoopLetterheadBlock />
        <div className="lrqd-qr">
          <span dangerouslySetInnerHTML={{ __html: lrqQr(m.code) }} />
          <div className="lrqd-barcode-txt mono">{m.code}</div>
        </div>
      </div>
      <table className="lrqd-mdsheet"><thead><tr><td>
        <LrqMemberDetailHead m={m} meta={meta} recordedBy={f.recordedBy} dr={dr} />
      </td></tr></thead><tbody><tr><td>

      <LrqDocSection title="รายละเอียดหุ้น">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่เป็นสมาชิก</th><th className="num">งวดหุ้น</th><th className="num">ทุนเรือนหุ้น (บาท)</th>
          <th className="num">หุ้นยกมาปีก่อน (บาท)</th><th className="num">ค่าหุ้น/เดือน (บาท)</th>
          <th>วันที่หยุดส่ง</th><th className="num">ดอกเบี้ยสะสม (บาท)</th>
        </tr></thead><tbody><tr>
          <td>{fmt.date(m.joinDate)}</td><td className="num">{m.sharePeriod || calc.sendable || '-'}</td>
          <td className="num">{fmt.money(m.shareCapital)}</td>
          <td className="num">{share.broughtForward ? fmt.money(share.broughtForward) : '-'}</td>
          <td className="num">{share.perMonthValue ? fmt.money(share.perMonthValue) : '-'}</td>
          <td>{share.stopDate ? fmt.date(share.stopDate) : '-'}</td>
          <td className="num">{share.accruedInterest ? fmt.money(share.accruedInterest) : '-'}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <LrqDocSection title="รายละเอียดการค้ำประกันเงินกู้ให้บุคคลอื่น">
        <table className="lrqd-tbl"><thead><tr>
          <th>เลขที่สมาชิก</th><th>สังกัด</th><th>ชื่อ - ชื่อสกุลผู้กู้</th><th>เลขที่สัญญา</th><th>วันเริ่มสัญญา</th><th className="num">เงินกู้ (บาท)</th><th className="num">คงเหลือ (บาท)</th>
        </tr></thead><tbody>
          {guarFor.length === 0 && <tr><td colSpan="7" className="center">- ไม่มีการค้ำประกัน -</td></tr>}
          {guarFor.map((r, i) => (
            <tr key={i}><td className="mono">{r.borrowerCode}</td><td>{r.dept}</td><td>{r.borrower}</td><td className="mono">{r.contract}</td>
              <td>{r.startDate ? fmt.date(r.startDate) : '-'}</td><td className="num">{fmt.money(r.loan)}</td><td className="num">{fmt.money(r.remain)}</td></tr>
          ))}
          {guarFor.length > 0 && <tr className="lrqd-foot"><td colSpan="6" className="right">รวมค้ำประกันเงินกู้</td><td className="num">{fmt.money(guarForTotal)}</td></tr>}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="รายละเอียดสัญญาเงินกู้ที่มีในระบบ">
        <table className="lrqd-tbl lrqd-white"><thead><tr>
          <th>เลขที่สัญญา</th><th>ประเภท</th><th>วันที่สัญญา</th><th className="num">เงินกู้/วงเงิน</th><th className="num">อัตรา</th>
          <th className="num">ชำระ/งวด</th><th className="center">งวด</th><th className="num">เงินกู้คงเหลือ</th>
          <th>ชำระล่าสุด</th><th>เก็บล่าสุด</th><th className="num">ด.บ.ค้าง</th>
        </tr></thead><tbody>
          {contracts.length === 0 && <tr><td colSpan="11" className="center">- ไม่มีสัญญาเงินกู้ -</td></tr>}
          {contracts.map((c, i) => (
            <React.Fragment key={i}>
              <tr><td className="mono">{c.contract}{c.tag ? <div className="lrqd-md-guarname">{c.tag}</div> : null}</td>
                <td>{c.payType}</td><td>{fmt.date(c.contractDate)}</td><td className="num">{fmt.money(c.loanAmount)}</td><td className="num">{c.rate.toFixed(2)}%</td>
                <td className="num">{fmt.money(c.payPerTerm)}</td><td className="center mono">{c.termsPaid}/{c.totalTerms}</td><td className="num">{fmt.money(c.remaining)}</td>
                <td>{fmt.date(c.lastPayDate)}</td><td>{fmt.date(c.lastCollectDate)}</td><td className="num">{c.overdueDbTerms || 0}</td></tr>
              {(c.guarantors || []).length > 0 && (
                <tr><td colSpan="11" className="lrqd-md-guarname">
                  - คนค้ำประกัน
                  {c.guarantors.map((gt, gi) => <div key={gi}>{gt.code} {gt.name} ({gt.dept})</div>)}
                </td></tr>
              )}
            </React.Fragment>
          ))}
          {contracts.length > 0 && <tr className="lrqd-foot"><td colSpan="7" className="right">รวมเงินกู้</td><td className="num">{fmt.money(contractsTotal)}</td><td colSpan="3" /></tr>}
        </tbody></table>
      </LrqDocSection>

      {(dr.transferCoGuarantors || []).length > 0 && (
        <LrqDocSection title="ผู้ค้ำประกันร่วมของสัญญารับโอน">
          <table className="lrqd-tbl"><thead><tr><th>สัญญา</th><th>ผู้ค้ำประกันร่วม</th><th>เลขสมาชิก</th><th>สังกัด</th></tr></thead><tbody>
            {dr.transferCoGuarantors.map((r, i) => (
              <tr key={i}><td className="mono">{r.contract}</td><td>{r.name}</td><td className="mono">{r.memberCode || '-'}</td><td>{r.dept}</td></tr>
            ))}
          </tbody></table>
        </LrqDocSection>
      )}

      <LrqDocSection flow title="รายละเอียดการรับชำระเงินกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่ใบเสร็จ</th><th>วันที่รับชำระ</th><th>เลขที่สัญญา</th><th className="num">อัตรา</th><th>เลขที่เอกสาร</th><th>รายการ</th>
          <th className="num">เงินชำระ</th><th className="num">เป็นต้นเงิน</th><th className="num">เป็นดอกเบี้ย</th><th className="num">คงเหลือ (บาท)</th>
        </tr></thead><tbody>
          {(dr.paymentReceipts || []).length === 0 && <tr><td colSpan="10" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.paymentReceipts || []).map((r, i) => (
            <tr key={i}><td>{r.receiptDate}</td><td>{r.paidDate}</td><td className="mono">{r.contract}</td><td className="num">{r.rate.toFixed(2)}</td><td className="mono">{r.docNo}</td><td>{r.txnType}</td>
              <td className="num">{fmt.money(r.amount)}</td><td className="num">{fmt.money(r.principal)}</td><td className="num">{fmt.money(r.interest)}</td><td className="num">{r.remaining ? fmt.money(r.remaining) : '0.00'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection flow title="รายการปรับปรุงยอดคงเหลือเงินกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่ปรับปรุง</th><th>เลขที่สัญญา</th><th>เลขที่เอกสาร</th><th>บริษัทประกัน</th><th className="num">ปรับต้นเงิน</th><th className="num">ปรับดอกเบี้ย</th><th className="num">คงเหลือ (บาท)</th><th className="num">ดอกเบี้ยค้าง (บาท)</th>
        </tr></thead><tbody>
          {(dr.balanceAdjustments || []).length === 0 && <tr><td colSpan="8" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.balanceAdjustments || []).map((r, i) => (
            <tr key={i}><td>{fmt.date(r.adjustDate)}</td><td className="mono">{r.contract}</td><td className="mono">{r.docNo}</td><td>{r.insurer || '-'}</td>
              <td className="num">{fmt.money(r.adjustPrincipal)}</td><td className="num">{fmt.money(r.adjustInterest)}</td><td className="num">{fmt.money(r.remaining)}</td><td className="num">{fmt.money(r.interestOverdue)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="การเปลี่ยนแปลงหุ้น">
        <table className="lrqd-tbl"><thead><tr><th>วันที่เปลี่ยน</th><th className="num">งวดหุ้น</th><th className="num">ทุนเรือนหุ้น (บาท)</th><th>ก่อนเปลี่ยนแปลง</th><th>หลังเปลี่ยนแปลง</th></tr></thead><tbody>
          {(dr.shareChanges || []).length === 0 && <tr><td colSpan="5" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.shareChanges || []).map((r, i) => (
            <tr key={i}><td>{fmt.date(r.changeDate)}</td><td className="num">{r.period}</td><td className="num">{fmt.money(r.capital)}</td><td>{r.before}</td><td>{r.after}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection flow title="การเปลี่ยนแปลงการส่งหนี้">
        <table className="lrqd-tbl"><thead><tr><th>วันที่เปลี่ยน</th><th>เลขที่สัญญา</th><th>ก่อนเปลี่ยนแปลง</th><th>หลังเปลี่ยนแปลง</th><th className="num">ดบ.ค้าง/งวด เพิ่มปีละ</th><th>หมายเหตุ</th></tr></thead><tbody>
          {(dr.debtCollectionChanges || []).length === 0 && <tr><td colSpan="6" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.debtCollectionChanges || []).map((r, i) => (
            <tr key={i}><td>{fmt.date(r.changeDate)}</td><td className="mono">{r.contract}</td><td>{r.before}</td><td>{r.after}</td><td className="num">{r.extraPerYear || '-'}</td><td>{r.note}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection flow title="คืนใบเสร็จ (บางส่วน)">
        <table className="lrqd-tbl"><thead><tr><th>วันที่ใบเสร็จ</th><th>วันที่คืน</th><th>รายการ</th><th className="num">เงินต้น (บาท)</th><th className="num">ดอกเบี้ย (บาท)</th><th>หมายเหตุ</th></tr></thead><tbody>
          {(dr.partialReceiptReturns || []).length === 0 && <tr><td colSpan="6" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.partialReceiptReturns || []).map((r, i) => (
            <tr key={i}><td>{fmt.date(r.receiptDate)}</td><td>{fmt.date(r.returnDate)}</td><td>{r.item}</td><td className="num">{fmt.money(r.principal)}</td><td className="num">{fmt.money(r.interest)}</td><td>{r.note}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="เบี้ยประกันอัคคีภัย">
        <table className="lrqd-tbl"><thead><tr><th>เลขที่สัญญา</th><th>วันที่รายการ</th><th>วันที่คุ้มครอง</th><th>วันหมดอายุ</th><th className="num">ทุนประกัน (บาท)</th><th className="num">เบี้ยประกัน (บาท)</th><th>เลขกรมธรรม์</th><th>เลขสลักหลัง</th></tr></thead><tbody>
          {(dr.fireInsurance || []).length === 0 && <tr><td colSpan="8" className="center">- ไม่มีรายการ -</td></tr>}
          {(dr.fireInsurance || []).map((r, i) => (
            <tr key={i}><td className="mono">{r.contract}</td><td>{fmt.date(r.regDate)}</td><td>{fmt.date(r.coverDate)}</td><td>{fmt.date(r.expireDate)}</td>
              <td className="num">{fmt.money(r.insuredAmount)}</td><td className="num">{fmt.money(r.premium)}</td><td className="mono">{r.policyNo}</td><td className="mono">{r.endorsementNo}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      <div className="lrqd-legend">
        I = ประกัน, &nbsp;S = หยุดเก็บ, &nbsp;C = ดำเนินคดี, &nbsp;J = พิพากษา, &nbsp;R = รับโอน, &nbsp;P = ชำระพิเศษตัดเฉพาะต้น, &nbsp;W = รอสินไหมจากบริษัทประกัน<br />
        D = ผ่อนผันการกู้เงินเดือนต่ำกว่าเกณฑ์ /งวดเกินเกณฑ์, &nbsp;T = รับโอนจากผู้กู้ (ตาย ให้ออก ไล่ออก ปลดออก), &nbsp;E = ยื่นขอรับชำระหนี้ล้มละลาย<br />
        ป1 = ปรับโครงสร้างหนี้โครงการ 1, &nbsp;ป2 = ปรับโครงสร้างหนี้โครงการ 2, &nbsp;M = พักชำระต้นเงิน Covid-19
      </div>

      </td></tr></tbody></table>

    </div>
  );
}

// ─── Overlay พรีวิวเอกสาร + ปุ่มพิมพ์ ────────────────────────────────
function LoanReqPrintOverlay({ type, f, calc, onClose }) {
  const titles = { app: 'ใบคำขอกู้เงิน', schedule: 'ตารางผ่อนชำระ', notice: 'ใบแจ้งชำระหนี้', attach: 'ใบประกอบคำขอกู้', member: 'ใบรายละเอียดสมาชิก', all: 'พิมพ์รวม (5 เอกสาร)', allsp: 'พิมพ์รวม (7 เอกสาร)', special: 'หนังสือนำเสนอพิจารณาเงินกู้', contract: 'หนังสือสัญญาเงินกู้พิเศษ' };
  const clearPrintClass = () => document.documentElement.classList.remove('lrq-printing');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearPrintClass(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const mq = window.matchMedia && window.matchMedia('print');
    const onMq = (m) => { if (!m.matches) clearPrintClass(); };
    if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
      clearPrintClass();
    };
  }, []);

  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const cleanup = () => { clearPrintClass(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch (e) { /* ignore */ }
    setTimeout(clearPrintClass, 1500);
  };

  const close = () => { clearPrintClass(); onClose(); };

  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — {titles[type] || ''}</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          {type === 'app' && <LoanAppPrintSheet f={f} calc={calc} />}
          {type === 'schedule' && <RepaymentSchedulePrintSheet f={f} calc={calc} />}
          {type === 'notice' && <LrqDebtNoticeSheet f={f} calc={calc} />}
          {type === 'attach' && <LrqLoanAttachSheet f={f} calc={calc} />}
          {type === 'member' && <LrqMemberDetailPrintSheet f={f} calc={calc} />}
          {type === 'special' && <window.SpecialContractPrintSet f={f} calc={calc} />}
          {(type === 'all' || type === 'allsp') && [
            ...(type === 'allsp' ? [<window.SpecialContractPrintSet key="sp" f={f} calc={calc} />, <window.SpecialLoanContractPrintSet key="ct" f={f} calc={calc} />] : []),
            <RepaymentSchedulePrintSheet key="s" f={f} calc={calc} />,
            <LoanAppPrintSheet key="a" f={f} calc={calc} />,
            <LrqDebtNoticeSheet key="n" f={f} calc={calc} />,
            <LrqLoanAttachSheet key="t" f={f} calc={calc} />,
            <LrqMemberDetailPrintSheet key="m" f={f} calc={calc} />,
          ].map((el, i, arr) => (
            <div key={i} style={i < arr.length - 1 ? { breakAfter: 'page', pageBreakAfter: 'always', marginBottom: 16 } : null}>{el}</div>
          ))}
          {type === 'contract' && <window.SpecialLoanContractPrintSet f={f} calc={calc} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoanReqPrintOverlay });
