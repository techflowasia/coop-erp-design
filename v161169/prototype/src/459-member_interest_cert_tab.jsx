// ════════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก › ข้อมูลการเงินและสัญญา — แท็บ "หนังสือรับรองดอกเบี้ย"
//  แสดงเฉพาะประวัติหนังสือรับรองดอกเบี้ย (ล.ย.02) ที่ส่งสรรพากรแล้ว
//  พร้อมพิมพ์หนังสือได้รายฉบับหรือทั้งหมด
// ════════════════════════════════════════════════════════════════════

function TaxCertTab({ data, onToast }) {
  const member = data.member;
  const [printCerts, setPrintCerts] = useState(null);
  const [year, setYear] = useState('all');
  const address = member.address || (window.lmMemberAddress ? window.lmMemberAddress(member.code) : '');
  const allHistory = (window.lmCertHistory ? window.lmCertHistory(member.code) : []).filter(h => h.tax === 'sent');
  const years = [...new Set(allHistory.map(h => h.taxYear))].sort((a, b) => b - a);
  const history = year === 'all' ? allHistory : allHistory.filter(h => String(h.taxYear) === String(year));

  const toCert = (h) => ({
    memberName: member.name, address, citizenId: member.citizenId || '', memberTaxId: '',
    contract: h.contract, contractDate: '', principal: '', terms: '359 งวด', rate: '5%',
    mortgageTerms: '359 งวด', purpose: h.purpose,
    periodLabel: 'ประจำปี พ.ศ.', periodValue: String(h.taxYear),
    interestText: fmt.money(h.interest, 2),
    issuedText: window.lyThaiLongDate(h.issuedAt),
  });
  const printAll = () => {
    if (history.length === 0) { onToast && onToast('ไม่มีหนังสือรับรองดอกเบี้ยที่ส่งสรรพากรแล้วสำหรับพิมพ์'); return; }
    setPrintCerts(history.map(toCert));
  };
  const yearLabel = (y) => 'ปี ' + y;

  return (
    <div data-screen-label="แท็บหนังสือรับรองดอกเบี้ย">
      <div className="section-head" style={{ marginBottom: 12 }}>
        <span className="head-bar" /><h3>ประวัติการออกหนังสือรับรองดอกเบี้ย (ล.ย.02)</h3>
        <span className="gc-count">{history.length} ฉบับ</span>
        <span className="spacer" />
        <select className="cfg-input sm" style={{ width: 140 }} value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="all">ทุกปี</option>
          {years.map(y => <option key={y} value={y}>{yearLabel(y)}</option>)}
        </select>
        <button className="btn sm" onClick={printAll}><Icon name="print" /> พิมพ์{year === 'all' ? 'ทั้งหมด' : yearLabel(year)}</button>
      </div>
      <p className="muted" style={{ fontSize: 11, margin: '0 0 12px' }}>
        <Icon name="info" size={11} /> แสดงเฉพาะหนังสือรับรองที่ส่งข้อมูลให้กรมสรรพากรเรียบร้อยแล้ว
      </p>

      {history.length === 0 ? (
        <div className="empty-state">— สมาชิกรายนี้ยังไม่มีหนังสือรับรองดอกเบี้ยที่ส่งสรรพากรแล้ว —</div>
      ) : (
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>เลขที่หนังสือ</th><th className="center">ปีภาษี</th><th>สัญญาเงินกู้</th>
              <th>วัตถุประสงค์การกู้</th><th className="num">ดอกเบี้ยที่รับรอง</th>
              <th className="center">วันที่ออก</th><th>ผู้ออก</th>
              <th className="center">ส่งสรรพากร</th><th className="center" style={{ width: 96 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.certNo}>
                  <td className="mono">{h.certNo}</td>
                  <td className="center mono">{h.taxYear}</td>
                  <td className="mono">{h.contract}</td>
                  <td>{h.purpose}</td>
                  <td className="num">{fmt.money(h.interest, 2)}</td>
                  <td className="center mono">{fmt.date(h.issuedAt)}</td>
                  <td>{h.by}</td>
                  <td className="center">
                    <span className="pill ok">ส่งแล้ว {h.taxAt ? fmt.date(h.taxAt) : ''}</span>
                  </td>
                  <td className="center">
                    <button className="btn ghost sm" onClick={() => setPrintCerts([toCert(h)])}>
                      <Icon name="print" /> พิมพ์
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}

      {printCerts && <LoanCertPrintOverlay certs={printCerts} onClose={() => setPrintCerts(null)} />}
    </div>
  );
}

Object.assign(window, { TaxCertTab });
