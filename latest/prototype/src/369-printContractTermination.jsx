// ════════════════════════════════════════════════════════════════════
//  หนังสือบอกเลิกสัญญาเงินกู้ — ContractTerminationPrintSheet
//  เอกสารราชการสำหรับพิมพ์ / บันทึก PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  ใช้คลาสพิมพ์ชุดเดียวกับหนังสือแจ้งชำระหนี้ (mp-* / dn-letter-*)
// ════════════════════════════════════════════════════════════════════

window.printContractTermination = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

// แถวตารางสัญญา/หนี้คงเหลือสำหรับเอกสาร
function CtPrintContractTable({ rec }) {
  const tP = rec.contracts.reduce((s, d) => s + (Number(d.principalRemaining) || 0), 0);
  const tI = rec.contracts.reduce((s, d) => s + (Number(d.interestDue) || 0), 0);
  const tF = rec.contracts.reduce((s, d) => s + (Number(d.penalty) || 0), 0);
  return (
    <table className="mp-table">
      <thead>
        <tr>
          <th>ประเภท / สัญญาเลขที่</th>
          <th className="center">ค้างชำระ</th>
          <th className="right">เงินต้นคงเหลือ</th>
          <th className="right">ดอกเบี้ยค้าง</th>
          <th className="right">ค่าปรับ</th>
          <th className="right">รวม (บาท)</th>
        </tr>
      </thead>
      <tbody>
        {rec.contracts.map((d, i) => (
          <tr key={i}>
            <td>{d.loanType}<br /><span className="mono" style={{ fontSize: '.92em' }}>{d.contractNo}</span></td>
            <td className="center">{d.overdueInstallments} งวด</td>
            <td className="right mono">{fmt.money(d.principalRemaining, 2)}</td>
            <td className="right mono">{fmt.money(d.interestDue, 2)}</td>
            <td className="right mono">{fmt.money(d.penalty, 2)}</td>
            <td className="right mono">{fmt.money(window.ctContractTotal(d), 2)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan="2">รวมทั้งสิ้น</td>
          <td className="right mono">{fmt.money(tP, 2)}</td>
          <td className="right mono">{fmt.money(tI, 2)}</td>
          <td className="right mono">{fmt.money(tF, 2)}</td>
          <td className="right mono"><b>{fmt.money(rec.totalOutstanding, 2)}</b></td>
        </tr>
      </tfoot>
    </table>
  );
}

function CtSignBlock({ rec }) {
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

function ContractTerminationPrintSheet({ rec }) {
  if (!rec) return null;
  const now = new Date();
  const c = (window.ctCase(rec.caseCode) || {});
  const caseTxt = rec.caseCode === 'TC99' ? (rec.caseOther || c.label) : c.label;
  const sendAddr = rec.useOtherAddress && rec.sendAddress ? rec.sendAddress : rec.regAddress;
  const allGuar = (rec.contracts || []).flatMap(ct => (ct.guarantors || []).map(g => ({ ...g, contractNo: ct.contractNo })));

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet dn-letter">

        {/* ═══ หัวเอกสารราชการ ═══ */}
        <div className="dn-letter-head">
          <div className="dn-lh-no">ที่ {rec.docNo}</div>
          <div className="dn-lh-org">
            <div className="dn-lh-org-name">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
            <div className="dn-lh-org-addr">99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 โทร. 0 2104 4344</div>
          </div>
        </div>
        <div className="dn-lh-date">วันที่ {fmt.date(rec.regDate)}</div>

        <div className="dn-letter-title">หนังสือบอกเลิกสัญญาเงินกู้</div>

        <div className="dn-letter-meta">
          <div><span className="dn-lm-k">เรื่อง</span> ขอบอกเลิกสัญญาเงินกู้และให้ชำระหนี้ที่ค้างชำระต่อสหกรณ์</div>
          <div><span className="dn-lm-k">เรียน</span> {rec.memberName} (สมาชิกเลขทะเบียน {rec.memberCode})</div>
          <div><span className="dn-lm-k">อ้างถึง</span> ทะเบียนบอกเลิกเลขที่ {rec.id}{rec.resolutionNo ? ` · มติ ${rec.resolutionNo} ลงวันที่ ${fmt.date(rec.resolutionDate)}` : ''}</div>
          <div><span className="dn-lm-k">ที่อยู่</span> {sendAddr || '—'}{rec.useOtherAddress && rec.sendAddress ? ' (ที่อยู่จัดส่งอื่นนอกทะเบียน)' : ''}</div>
        </div>

        {/* ═══ เนื้อความ ═══ */}
        <div className="dn-letter-body">
          <p>
            ด้วยปรากฏว่าท่านในฐานะสมาชิกและผู้กู้ของสหกรณ์ออมทรัพย์ สังกัด{rec.dept}{' '}
            ได้{caseTxt} เป็นเหตุให้ผิดนัดชำระหนี้ตามสัญญาเงินกู้ที่ทำไว้ต่อสหกรณ์{' '}
            โดยมีรายละเอียดหนี้คงค้างดังต่อไปนี้
          </p>

          <CtPrintContractTable rec={rec} />

          <p style={{ marginTop: 10 }}>
            อาศัยอำนาจตามข้อบังคับและสัญญาเงินกู้ สหกรณ์จึงขอ<b>บอกเลิกสัญญาเงินกู้</b>ดังกล่าวข้างต้น{' '}
            และขอให้ท่านนำเงินจำนวน <b>{fmt.money(rec.totalOutstanding, 2)} บาท</b>{' '}
            ({window.bahtText(rec.totalOutstanding)}) พร้อมดอกเบี้ยและค่าปรับที่จะเกิดขึ้น{' '}
            มาชำระต่อสหกรณ์ให้เสร็จสิ้น <b>ภายใน 30 วัน</b> นับแต่วันที่ได้รับหนังสือฉบับนี้
          </p>
          <p style={{ marginTop: 10 }}>
            หากพ้นกำหนดดังกล่าว สหกรณ์จำเป็นต้องเรียกเก็บจากผู้ค้ำประกัน และ/หรือดำเนินการตามกฎหมายต่อไป{' '}
            โดยท่านจะต้องรับผิดชอบค่าใช้จ่ายในการดำเนินคดีและค่าธรรมเนียมต่าง ๆ ทั้งสิ้น
          </p>
          <p style={{ marginTop: 10 }}>จึงเรียนมาเพื่อโปรดทราบและดำเนินการชำระหนี้ภายในกำหนด</p>
        </div>

        <CtSignBlock rec={rec} />

        {/* ═══ สำเนาเรียน ผู้ค้ำประกัน ═══ */}
        {allGuar.length > 0 && (
          <div className="dn-cc">
            <div className="dn-cc-title">สำเนาเรียน — ผู้ค้ำประกัน</div>
            <table className="mp-table dn-cc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }} className="center">ลำดับ</th>
                  <th>สัญญา</th><th>ผู้ค้ำประกัน</th><th>ชื่อ-ชื่อสกุล</th><th>สังกัด</th>
                </tr>
              </thead>
              <tbody>
                {allGuar.map((g, i) => (
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

        {/* ═══ สำเนาเรียน ทายาท (กรณีเสียชีวิต) ═══ */}
        {(rec.heirs || []).length > 0 && (
          <div className="dn-cc">
            <div className="dn-cc-title">สำเนาเรียน — ทายาท / ผู้เกี่ยวข้อง</div>
            <table className="mp-table dn-cc-table">
              <thead>
                <tr>
                  <th style={{ width: 30 }} className="center">ลำดับ</th>
                  <th>ฐานะ</th><th>ชื่อ-ชื่อสกุล</th><th>ความสัมพันธ์</th><th>สังกัด / ที่อยู่</th>
                </tr>
              </thead>
              <tbody>
                {rec.heirs.map((h, i) => (
                  <tr key={i}>
                    <td className="center">{i + 1}</td>
                    <td>{h.prefix ? h.prefix.trim() : '—'}</td>
                    <td>{h.name}</td>
                    <td>{h.relation || '—'}</td>
                    <td>{h.dept || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span>ทะเบียนบอกเลิก {rec.id}{rec.emsNo ? ` · EMS ${rec.emsNo}` : ''}</span>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { ContractTerminationPrintSheet });
