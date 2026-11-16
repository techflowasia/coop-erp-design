// ════════════════════════════════════════════════════════════════════
//  ใบรายละเอียดของสมาชิก — MemberPrintSheet (รายงานฉบับเต็ม)
//  เอกสารสำหรับพิมพ์ / บันทึกเป็น PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  แสดงเฉพาะตอนพิมพ์ (html.member-printing) หรือเมื่อเปิดพรีวิว
// ════════════════════════════════════════════════════════════════════
function MemberPrintSheet({ data }) {
  const m = data.member;
  const now = new Date();
  const PRINT_USER = 'จันทร์เพ็ญ มาลี';

  const shares = data.shares || [];
  const loans = data.loans || [];
  const guar = data.guaranteeGiven || [];
  const receipts = data.loanReceipts || [];
  const shareChanges = data.shareChanges || [];
  const amlo = data.amlo || {};
  const statusNotes = data.statusNotes || [];

  // ── สรุปทุนเรือนหุ้น ──
  const primaryShare = shares[0] || {};
  const totShareValue = shares.reduce((a, x) => a + (x.shareValue || 0), 0);
  const totShareBf = shares.reduce((a, x) => a + (x.bf || 0), 0);
  const totSharePerMo = shares.reduce((a, x) => a + (x.perMonth || 0), 0);
  const stoppedShare = shares.find(x => x.stopDate);

  // ── ผลรวมตาราง ──
  const totGuarMax = guar.reduce((a, x) => a + (x.maxAmount || 0), 0);
  const totGuarRemain = guar.reduce((a, x) => a + (x.remaining || 0), 0);
  const totLoanAmount = loans.reduce((a, x) => a + (x.amount || 0), 0);
  const totLoanRemain = loans.reduce((a, x) => a + (x.remaining || 0), 0);
  const totLoanInterestDue = loans.reduce((a, x) => a + (x.interestDue || 0), 0);

  const M = ({ v, d = 2 }) => <span className="mono">{fmt.money(v, d)}</span>;
  const KV = ({ k, children }) => (
    <div className="mp-kv-item"><div className="mp-kv-k">{k}</div><div className="mp-kv-v">{children}</div></div>
  );

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">

        {/* ═══ ส่วนหัวรายงาน ═══ */}
        <CoopDocHead title="รายละเอียดของสมาชิก" meta={<>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
          <span>ผู้พิมพ์ : {PRINT_USER}</span>
          <span className="mp-pageno">หน้า <span className="mp-pp" /></span>
        </>} />

        {/* ═══ ข้อมูลรายละเอียดส่วนบุคคลและสถานะ ═══ */}
        <table className="mp-id-table">
          <tbody>
            <tr>
              <th>เลขที่สมาชิก</th><td className="mono">{m.code}</td>
              <th>ฐานเงินเดือน</th><td className="mono right">{fmt.money(m.salary, 2)}</td>
            </tr>
            <tr>
              <th>ชื่อ - ชื่อสกุล</th><td colSpan="3">{m.name}</td>
            </tr>
            <tr>
              <th>หน่วยงานต้นสังกัด</th><td>{m.departmentCode} · {m.department}</td>
              <th>อายุ</th><td>{fmt.age(m.birthDate)}</td>
            </tr>
            <tr>
              <th>สถานะ AMLO</th><td>{amlo.designatedLabel || 'ไม่เป็นบุคคลที่ถูกกำหนด'}</td>
              <th>ระดับความเสี่ยง</th><td>{amlo.risk || 'ต่ำ'}</td>
            </tr>
          </tbody>
        </table>
        {statusNotes.length > 0 && (
          <div className="mp-note-box">
            <span className="mp-note-label">หมายเหตุสถานะสมาชิก</span>
            <ul>{statusNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        )}

        {/* ═══ ข้อมูลบัญชีทุนเรือนหุ้น ═══ */}
        <div className="mp-sec-title">ข้อมูลบัญชีทุนเรือนหุ้น</div>
        <div className="mp-kv">
          <KV k="วันที่เริ่มเป็นสมาชิก">{fmt.date(m.joinDate)}</KV>
          <KV k="งวดหุ้นที่ส่งแล้ว">{primaryShare.term ?? '—'} งวด</KV>
          <KV k="อัตราค่าหุ้น/เดือน">{fmt.money(totSharePerMo, 2)} บาท</KV>
          <KV k="ทุนเรือนหุ้นปัจจุบัน">{fmt.money(totShareValue, 2)} บาท</KV>
          <KV k="หุ้นยกมาปีก่อน">{fmt.money(totShareBf, 2)} บาท</KV>
          <KV k="วันที่หยุดส่งหุ้น">{stoppedShare ? fmt.date(stoppedShare.stopDate) : '—'}</KV>
          <KV k="ดอกเบี้ยสะสม">{fmt.money(m.accumulatedInterest, 2)} บาท</KV>
        </div>

        {/* ═══ ภาระผูกพันการค้ำประกันเงินกู้ ═══ */}
        <div className="mp-sec-title">ภาระผูกพันการค้ำประกันเงินกู้ (ค้ำให้ผู้อื่น)</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>เลขที่สมาชิก</th>
              <th>ชื่อ-ชื่อสกุลผู้กู้</th>
              <th>เลขที่สัญญา</th>
              <th className="center">สังกัด</th>
              <th className="center">วันเริ่มสัญญา</th>
              <th className="right">จำนวนเงินกู้</th>
              <th className="right">หนี้คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {guar.map((x, i) => (
              <tr key={i}>
                <td className="mono">{x.debtorCode || '—'}</td>
                <td>{x.debtor}</td>
                <td className="mono">{x.contract}</td>
                <td className="center mono">{x.debtorDept || '—'}</td>
                <td className="center">{fmt.date(x.startDate)}</td>
                <td className="right"><M v={x.loanAmount} /></td>
                <td className="right"><M v={x.remaining} /></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5">รวมวงเงินที่ค้ำประกัน / รวมหนี้คงเหลือที่ค้ำประกัน</td>
              <td className="right"><M v={totGuarMax} /></td>
              <td className="right"><M v={totGuarRemain} /></td>
            </tr>
          </tfoot>
        </table>

        {/* ═══ ข้อมูลเงินกู้ของสมาชิก ═══ */}
        <div className="mp-sec-title">ข้อมูลเงินกู้ของสมาชิก (ผู้กู้)</div>
        <table className="mp-table mp-loan-table">
          <thead>
            <tr>
              <th>เลขที่สัญญา</th>
              <th>วันเริ่มสัญญา</th>
              <th>ประเภทการชำระ</th>
              <th className="center">งวด</th>
              <th className="center">อัตรา</th>
              <th className="right">วงเงินกู้</th>
              <th className="right">วงเงินคงเหลือ</th>
              <th className="right">เงินกู้คงเหลือ</th>
              <th className="right">ด.บ.ค้าง</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((x, i) => {
              const creditRemain = Math.max(0, (x.amount || 0) - (x.remaining || 0));
              return (
                <React.Fragment key={i}>
                  <tr>
                    <td className="mono">{x.contract}</td>
                    <td>{fmt.date(x.startDate)}</td>
                    <td>{x.payType}</td>
                    <td className="center mono">{x.lastTerm}/{x.totalTerms}</td>
                    <td className="center mono">{x.rate ? x.rate.toFixed(2) + '%' : '—'}</td>
                    <td className="right"><M v={x.amount} /></td>
                    <td className="right"><M v={creditRemain} /></td>
                    <td className="right"><M v={x.remaining} /></td>
                    <td className="right">{x.interestDue ? <M v={x.interestDue} /> : '—'}</td>
                  </tr>
                  <tr className="mp-loan-note">
                    <td colSpan="9">
                      <span className="mp-ln-dates">
                        ชำระล่าสุด {fmt.date(x.lastPaymentDate)} · คิด ด.บ. ล่าสุด {fmt.date(x.lastInterestDate)} · เก็บล่าสุด {fmt.date(x.lastCollectDate)}
                      </span>
                      <span className="mp-ln-guar">
                        หมายเหตุ — คนค้ำประกัน: {x.guarantors && x.guarantors.length ? x.guarantors.join(' , ') : 'ไม่มีผู้ค้ำประกัน'}
                      </span>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="5">รวมภาระเงินกู้ทั้งหมด</td>
              <td className="right"><M v={totLoanAmount} /></td>
              <td />
              <td className="right"><M v={totLoanRemain} /></td>
              <td className="right"><M v={totLoanInterestDue} /></td>
            </tr>
          </tfoot>
        </table>

        {/* ═══ ประวัติรายการรับชำระเงินกู้ ═══ */}
        <div className="mp-sec-title">ประวัติรายการรับชำระเงินกู้</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>วันที่ใบเสร็จ</th>
              <th>วันที่รับชำระ</th>
              <th>เลขที่สัญญา</th>
              <th className="center">อัตรา</th>
              <th>เลขที่เอกสาร</th>
              <th className="center">ประเภท</th>
              <th className="right">เป็นต้นเงิน</th>
              <th className="right">เป็นดอกเบี้ย</th>
              <th className="right">เงินชำระ</th>
              <th className="right">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((x, i) => (
              <tr key={i}>
                <td className="mono">{fmt.date(x.receiptDate)}</td>
                <td className="mono">{fmt.date(x.payDate)}</td>
                <td className="mono">{x.contract}</td>
                <td className="center mono">{x.rate.toFixed(2)}%</td>
                <td className="mono">{x.docNo}</td>
                <td className="center">{x.txnType}</td>
                <td className="right"><M v={x.principal} /></td>
                <td className="right"><M v={x.interest} /></td>
                <td className="right"><M v={x.paid} /></td>
                <td className="right"><M v={x.remaining} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ═══ ประวัติการเปลี่ยนแปลงหุ้น ═══ */}
        <div className="mp-sec-title">ประวัติการเปลี่ยนแปลงหุ้น</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>วันที่เปลี่ยน</th>
              <th className="center">งวดหุ้น</th>
              <th className="right">ทุนเรือนหุ้น (บาท)</th>
              <th>ก่อนเปลี่ยนแปลง</th>
              <th>หลังเปลี่ยนแปลง</th>
            </tr>
          </thead>
          <tbody>
            {shareChanges.map((x, i) => (
              <tr key={i}>
                <td className="mono">{fmt.date(x.changeDate)}</td>
                <td className="center mono">{x.term}</td>
                <td className="right"><M v={x.shareCapital} /></td>
                <td>{x.before}</td>
                <td>{x.after}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ═══ คำอธิบายสัญลักษณ์ ═══ */}
        <div className="mp-legend">
          <div className="mp-legend-title">คำอธิบายสัญลักษณ์สถานะ (Legend)</div>
          <div className="mp-legend-grid">
            <span><b>$</b> = ประกัน</span>
            <span><b>S</b> = หยุดเก็บ</span>
            <span><b>C</b> = ดำเนินคดี</span>
            <span><b>J</b> = พิพากษา</span>
            <span><b>R</b> = รับโอน</span>
            <span><b>P</b> = ชำระพิเศษตัดเฉพาะต้น</span>
            <span><b>W</b> = รอสินไหมจากบริษัทประกัน</span>
            <span><b>M</b> = พักชำระต้นเงิน Covid-19</span>
            <span><b>T</b> = รับโอนจากผู้กู้ (ตาย/ให้ออก/ไล่ออก)</span>
            <span><b>E</b> = ยื่นขอรับชำระหนี้ล้มละลาย</span>
            <span><b>1/1</b> = ปรับโครงสร้างหนี้โครงการ 1</span>
            <span><b>2/2</b> = ปรับโครงสร้างหนี้โครงการ 2</span>
          </div>
        </div>

        {/* ═══ ลายเซ็นรับรอง ═══ */}
        <div className="mp-sign-row">
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>เจ้าหน้าที่ทะเบียน</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้จัดการสหกรณ์</div></div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { MemberPrintSheet });
