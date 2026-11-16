// ════════════════════════════════════════════════════════════════════
//  หนังสือแจ้งให้ชำระหนี้ / สำเนาเรียนผู้ค้ำประกัน — DebtNoticePrintSheet
//  เอกสารราชการสำหรับพิมพ์ / บันทึก PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  ใช้คลาสพิมพ์ชุดเดียวกับเอกสารอื่น (mp-*) เพื่อความสม่ำเสมอ
// ════════════════════════════════════════════════════════════════════

window.printDebtNotice = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

// แถวตารางหนี้ค้างชำระสำหรับเอกสาร
function DnPrintDebtTable({ rec }) {
  const totalPrincipal = rec.debts.reduce((s, d) => s + (Number(d.principalRemaining) || 0), 0);
  const totalInterest = rec.debts.reduce((s, d) => s + (Number(d.interestDue) || 0), 0);
  const totalPenalty = rec.debts.reduce((s, d) => s + (Number(d.penalty) || 0), 0);
  return (
    <table className="mp-table">
      <thead>
        <tr>
          <th>ประเภท / สัญญาเลขที่</th>
          <th className="center">สถานะ</th>
          <th className="right">เงินต้นคงเหลือ</th>
          <th className="right">ดอกเบี้ยค้าง</th>
          <th className="right">ค่าปรับ</th>
          <th className="right">รวม (บาท)</th>
        </tr>
      </thead>
      <tbody>
        {rec.debts.map((d, i) => (
          <tr key={i}>
            <td>{d.type}<br /><span className="mono" style={{ fontSize: '.92em' }}>{d.contractNo}</span></td>
            <td className="center">{d.status} · ค้าง {d.overdueInstallments} งวด</td>
            <td className="right mono">{fmt.money(d.principalRemaining, 2)}</td>
            <td className="right mono">{fmt.money(d.interestDue, 2)}</td>
            <td className="right mono">{fmt.money(d.penalty, 2)}</td>
            <td className="right mono">{fmt.money(window.dnContractTotal(d), 2)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="2">รวมทั้งสิ้น</td>
          <td className="right mono">{fmt.money(totalPrincipal, 2)}</td>
          <td className="right mono">{fmt.money(totalInterest, 2)}</td>
          <td className="right mono">{fmt.money(totalPenalty, 2)}</td>
          <td className="right mono"><b>{fmt.money(rec.totalOutstanding, 2)}</b></td>
        </tr>
      </tfoot>
    </table>
  );
}

function DnSignBlock({ rec }) {
  return (
    <div className="dn-sign-wrap">
      <div className="dn-sign-box">
        <div>ขอแสดงความนับถือ</div>
        <div className="dn-sign-line" />
        <div>( {rec.signer} )</div>
        <div>{rec.signerPosition}</div>
        <div className="muted" style={{ fontSize: '.92em' }}>สหกรณ์ออมทรัพย์</div>
      </div>
    </div>
  );
}

function DebtNoticePrintSheet({ rec, docType }) {
  if (!rec) return null;
  const now = new Date();
  const cause = (window.dnCause(rec.causeCode) || {}).label || '';
  const causeTxt = rec.causeCode === 'C99' ? (rec.causeOther || cause) : cause;
  const isCopy = docType === 'copy';
  const guarantors = rec.guarantors || [];

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet dn-letter">

        {/* ═══ ส่วนหัวเอกสารราชการ ═══ */}
        <div className="dn-letter-head">
          <div className="dn-lh-no">ที่ {rec.seizeNo}</div>
          <div className="dn-lh-org">
            <div className="dn-lh-org-name">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
            <div className="dn-lh-org-addr">99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 โทร. 0 2104 4344</div>
          </div>
        </div>
        <div className="dn-lh-date">วันที่ {fmt.date(rec.regDate)}</div>

        <div className="dn-letter-title">
          {isCopy
            ? 'หนังสือแจ้งให้ชำระหนี้ (สำเนาเรียนผู้ค้ำประกัน)'
            : 'หนังสือแจ้งให้ชำระหนี้'}
          <span className="dn-letter-round">ครั้งที่ {rec.round}</span>
        </div>

        <div className="dn-letter-meta">
          <div><span className="dn-lm-k">เรื่อง</span> ขอให้ชำระหนี้ที่ค้างชำระต่อสหกรณ์</div>
          <div>
            <span className="dn-lm-k">เรียน</span>{' '}
            {isCopy
              ? (guarantors.length ? 'ผู้ค้ำประกันตามรายชื่อแนบท้าย' : 'ผู้ค้ำประกัน')
              : `${rec.memberName} (สมาชิกเลขทะเบียน ${rec.memberCode})`}
          </div>
          <div><span className="dn-lm-k">อ้างถึง</span> ทะเบียนติดตามเลขที่ {rec.id}</div>
        </div>

        {/* ═══ ข้อความแจ้งเตือนให้ชำระหนี้ ═══ */}
        <div className="dn-letter-body">
          {isCopy ? (
            <p>
              ด้วย {rec.memberName} สมาชิกเลขทะเบียน {rec.memberCode} สังกัด{rec.dept}{' '}
              ซึ่งท่านเป็นผู้ค้ำประกันสัญญาเงินกู้ ได้{causeTxt}{' '}
              เป็นเหตุให้มีหนี้ค้างชำระต่อสหกรณ์ รวมเป็นเงินทั้งสิ้น{' '}
              <b>{fmt.money(rec.totalOutstanding, 2)} บาท</b> ({window.bahtText(rec.totalOutstanding)})
            </p>
          ) : (
            <p>
              ด้วยปรากฏว่าท่าน ในฐานะสมาชิกสหกรณ์ออมทรัพย์ เลขทะเบียน {rec.memberCode}{' '}
              สังกัด{rec.dept} ได้{causeTxt}{' '}
              เป็นเหตุให้มีหนี้ค้างชำระต่อสหกรณ์ ตามรายละเอียดดังต่อไปนี้
            </p>
          )}

          <DnPrintDebtTable rec={rec} />

          {isCopy ? (
            <p style={{ marginTop: 10 }}>
              อาศัยอำนาจตามสัญญาค้ำประกันที่ท่านได้ทำไว้ต่อสหกรณ์ จึงขอให้ท่านในฐานะผู้ค้ำประกัน{' '}
              ดำเนินการให้ผู้กู้ชำระหนี้ หรือร่วมรับผิดชำระหนี้ดังกล่าวให้แก่สหกรณ์{' '}
              <b>ภายในวันที่ {fmt.date(rec.dueDate)}</b> หากพ้นกำหนดสหกรณ์จำเป็นต้องดำเนินการตามกฎหมายต่อไป
            </p>
          ) : (
            <p style={{ marginTop: 10 }}>
              จึงขอให้ท่านนำเงินจำนวน <b>{fmt.money(rec.totalOutstanding, 2)} บาท</b>{' '}
              ({window.bahtText(rec.totalOutstanding)}) มาชำระต่อสหกรณ์{' '}
              <b>ภายในวันที่ {fmt.date(rec.dueDate)}</b>{' '}
              หากพ้นกำหนดดังกล่าว สหกรณ์จำเป็นต้องดำเนินการเรียกเก็บจากผู้ค้ำประกัน และ/หรือดำเนินการตามกฎหมายต่อไป
            </p>
          )}

          <p style={{ marginTop: 10 }}>จึงเรียนมาเพื่อโปรดทราบและดำเนินการ</p>
        </div>

        <DnSignBlock rec={rec} />

        {/* ═══ สำเนาเรียน ═══ */}
        {guarantors.length > 0 && (
          <div className="dn-cc">
            <div className="dn-cc-title">สำเนาเรียน — ผู้ค้ำประกัน</div>
            <table className="mp-table dn-cc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }} className="center">ลำดับ</th>
                  <th>สัญญา</th>
                  <th>ผู้ค้ำประกัน</th>
                  <th>ชื่อ-ชื่อสกุล</th>
                  <th>สังกัด</th>
                </tr>
              </thead>
              <tbody>
                {guarantors.map((g, i) => (
                  <tr key={i}>
                    <td className="center">{i + 1}</td>
                    <td className="mono">{g.contractNo}</td>
                    <td className="mono">{g.memberCode || '—'}</td>
                    <td>{g.prefix}{g.name}</td>
                    <td>{g.dept || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span>ทะเบียนติดตาม {rec.id} · ครั้งที่ {rec.round}{rec.emsNo ? ` · EMS ${rec.emsNo}` : ''}</span>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { DebtNoticePrintSheet });
