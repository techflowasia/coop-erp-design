// ════════════════════════════════════════════════════════════════════
//  หนังสือขอให้ชำระหนี้ (สำเนา — แจ้งหน่วยงานต้นสังกัด) — OrqPrintSheet
//  เอกสารราชการสำหรับพิมพ์ / บันทึก PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  ใช้คลาสพิมพ์ชุด dn-* ร่วมกับหนังสือแจ้งให้ชำระหนี้ + แสตมป์ "สำเนา"
// ════════════════════════════════════════════════════════════════════

window.printOrgRequest = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมสำเนาหนังสือแจ้งต้นสังกัด — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

function OrqPrintDebtTable({ rec }) {
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

function OrqSignBlock({ rec }) {
  return (
    <div className="dn-sign-wrap">
      <div className="dn-sign-box">
        <div>ขอแสดงความนับถือ</div>
        <div className="dn-sign-line" />
        <div>( {rec.signer} )</div>
        <div>{rec.signerPosition}</div>
        <div className="muted" style={{ fontSize: '.92em' }}>สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด</div>
      </div>
    </div>
  );
}

function OrqPrintSheet({ rec }) {
  if (!rec) return null;
  const now = new Date();
  const cause = (window.dnCause(rec.causeCode) || {}).label || '';
  const causeTxt = rec.causeCode === 'C99' ? (rec.causeOther || cause) : cause;
  const org = rec.org || {};
  const guarantors = rec.guarantors || [];

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet dn-letter orq-letter">

        {/* ═══ แสตมป์ "สำเนา" (สำหรับแจ้งต้นสังกัด) ═══ */}
        <div className="orq-copy-stamp">สำเนา</div>

        {/* ═══ ส่วนหัวเอกสารราชการ ═══ */}
        <div className="dn-letter-head">
          <div className="dn-lh-no">ที่ {rec.docNo}</div>
          <div className="dn-lh-org">
            <div className="dn-lh-org-name">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
            <div className="dn-lh-org-addr">99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 โทร. 0 2104 4344</div>
          </div>
        </div>
        <div className="dn-lh-date">วันที่ {fmt.date(rec.regDate)}</div>

        <div className="dn-letter-title">
          หนังสือขอให้ชำระหนี้ <span className="orq-title-tag">แจ้งหน่วยงานต้นสังกัด</span>
          <span className="dn-letter-round">ครั้งที่ {rec.round}</span>
        </div>

        <div className="dn-letter-meta">
          <div><span className="dn-lm-k">เรื่อง</span> ขอความอนุเคราะห์ให้สมาชิกในสังกัดชำระหนี้ที่ค้างชำระต่อสหกรณ์</div>
          <div>
            <span className="dn-lm-k">เรียน</span>{' '}
            {org.head ? `หัวหน้า${org.name || 'หน่วยงานต้นสังกัด'} (${org.head})` : `หัวหน้า${org.name || 'หน่วยงานต้นสังกัด'}`}
          </div>
          <div><span className="dn-lm-k">อ้างถึง</span> ทะเบียนขอให้ชำระหนี้เลขที่ {rec.id}</div>
        </div>

        {/* ═══ เนื้อความ ═══ */}
        <div className="dn-letter-body">
          <p>
            ด้วย {rec.memberName} สมาชิกสหกรณ์ออมทรัพย์ เลขทะเบียน {rec.memberCode}{' '}
            สังกัด{org.unit ? `${org.name} ${org.unit}` : (org.name || rec.dept)}{' '}
            ซึ่งเป็นผู้ปฏิบัติงานในหน่วยงานของท่าน ได้{causeTxt}{' '}
            เป็นเหตุให้มีหนี้ค้างชำระต่อสหกรณ์ ตามรายละเอียดดังต่อไปนี้
          </p>

          <OrqPrintDebtTable rec={rec} />

          <p style={{ marginTop: 10 }}>
            สหกรณ์จึงขอความอนุเคราะห์ให้หน่วยงานต้นสังกัด กำชับและแจ้งให้สมาชิกผู้กู้{' '}
            รวมทั้งผู้ค้ำประกันตามรายชื่อแนบท้าย นำเงินจำนวน{' '}
            <b>{fmt.money(rec.totalOutstanding, 2)} บาท</b> ({window.bahtText(rec.totalOutstanding)}){' '}
            มาชำระต่อสหกรณ์ หรือพิจารณาหักเงินได้รายเดือน/เงินอื่นใดที่พึงได้รับส่งชำระหนี้ให้แก่สหกรณ์{' '}
            <b>ภายในวันที่ {fmt.date(rec.dueDate)}</b>{' '}
            หากพ้นกำหนดดังกล่าว สหกรณ์จำเป็นต้องดำเนินการตามกฎหมายต่อไป
          </p>

          <p style={{ marginTop: 10 }}>จึงเรียนมาเพื่อโปรดพิจารณาให้ความอนุเคราะห์ และแจ้งผลให้สหกรณ์ทราบด้วย จักขอบคุณยิ่ง</p>
        </div>

        <OrqSignBlock rec={rec} />

        {/* ═══ รายชื่อผู้กู้และผู้ค้ำประกันที่แจ้งในหนังสือฉบับเดียว ═══ */}
        <div className="dn-cc">
          <div className="dn-cc-title">รายชื่อผู้เกี่ยวข้องที่แจ้งในหนังสือฉบับนี้ (ผู้กู้และผู้ค้ำประกัน)</div>
          <table className="mp-table dn-cc-table">
            <thead>
              <tr>
                <th style={{ width: 30 }} className="center">ลำดับ</th>
                <th>ฐานะ</th>
                <th>สัญญา</th>
                <th>เลขสมาชิก</th>
                <th>ชื่อ-ชื่อสกุล</th>
                <th>สังกัด</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="center">1</td>
                <td>ผู้กู้</td>
                <td className="mono">{(rec.debts[0] || {}).contractNo || '—'}</td>
                <td className="mono">{rec.memberCode}</td>
                <td>{rec.memberName}</td>
                <td>{org.name || rec.dept}</td>
              </tr>
              {guarantors.map((g, i) => (
                <tr key={i}>
                  <td className="center">{i + 2}</td>
                  <td>ผู้ค้ำประกัน</td>
                  <td className="mono">{g.contractNo}</td>
                  <td className="mono">{g.memberCode || '—'}</td>
                  <td>{g.prefix}{g.name}</td>
                  <td>{g.dept || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span>ทะเบียนขอให้ชำระหนี้ {rec.id} · ครั้งที่ {rec.round}{rec.emsNo ? ` · EMS ${rec.emsNo}` : ''}</span>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { OrqPrintSheet });
