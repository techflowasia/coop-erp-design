// ════════════════════════════════════════════════════════════════════
//  ใบคำขอรับเงินสงเคราะห์สมาชิก / ใบสำคัญรับเงิน — ReliefPrintSheet
//  เอกสารสำหรับพิมพ์ / บันทึก PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  ใช้คลาสพิมพ์ชุดเดียวกับใบสมาชิก (mp-*) เพื่อความสม่ำเสมอ
// ════════════════════════════════════════════════════════════════════

// trigger พิมพ์ (กลไกเดียวกับใบสมาชิก / ใบสำคัญจ่าย)
window.printRelief = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

function ReliefPrintSheet({ rec }) {
  if (!rec) return null;
  const now = new Date();
  const t = window.reliefType(rec.typeCode) || {};
  const st = window.reliefStatus(rec.status);
  const welfareName = rec.welfareName || window.reliefWelfareName(rec.welfareCode || window.reliefWelfareOfType(rec.typeCode)) || window.RELIEF_WELFARE_NAME;
  const m = (window.MEMBERS_LIST || []).find(x => x.code === rec.memberCode) || {};
  const memberYears = window.reliefMemberYears(m.joinDate);
  const payByLabel = window.reliefLabel('payBy', rec.payBy);
  const bankLabel = rec.bank ? window.reliefLabel('bank', rec.bank) : '';
  const paid = rec.status === 'paid';
  const cat = window.reliefCatOf(rec.welfareCode || window.reliefWelfareOfType(rec.typeCode));

  const KV = ({ k, children }) => (
    <div className="mp-kv-item"><div className="mp-kv-k">{k}</div><div className="mp-kv-v">{children}</div></div>
  );

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">

        {/* ═══ ส่วนหัวเอกสาร ═══ */}
        <CoopDocHead title="ใบคำขอรับเงินสงเคราะห์สมาชิก" meta={<>
            <span>เลขที่ {rec.id}</span>
            <span>วันยื่นคำขอ {fmt.date(rec.reqDate)}</span>
            <span>สถานะ {st.step} : {st.l}</span>
            <span className="mp-pageno">หน้า <span className="mp-pp" /></span>
        </>} />

        {/* ═══ ข้อมูลส่วนหัวของคำขอ ═══ */}
        <table className="mp-id-table">
          <tbody>
            <tr>
              <th>สวัสดิการ</th><td colSpan="3">{welfareName}</td>
            </tr>
            <tr>
              <th>ประเภท</th><td>{t.code} · {t.label}</td>
              <th>เลขติดตามงาน</th><td className="mono">{rec.trackingNo || '—'}</td>
            </tr>
            <tr>
              <th>ผู้ป้อนคำขอ</th><td>{rec.enteredBy}</td>
              <th>เลขที่ใบคำขอ</th><td className="mono">{rec.id}</td>
            </tr>
          </tbody>
        </table>

        {/* ═══ รายละเอียดสมาชิกผู้ขอใช้สิทธิ ═══ */}
        <div className="mp-sec-title">รายละเอียดสมาชิกผู้ขอใช้สิทธิ</div>
        <div className="mp-kv">
          <KV k="เลขสมาชิก"><span className="mono">{rec.memberCode}</span></KV>
          <KV k="ชื่อ-สกุล">{rec.memberName}</KV>
          <KV k="เป็นสมาชิกตั้งแต่">{m.joinDate ? fmt.date(m.joinDate) : '—'}</KV>
          <KV k="อายุสมาชิก">{memberYears.toFixed(2)} ปี</KV>
          <KV k="งวดหุ้นที่ส่ง">{window.reliefShareTerms(m.joinDate)} งวด</KV>
          <KV k="สังกัด">{m.deptCode ? m.deptCode + ' · ' : ''}{m.dept || '—'}</KV>
        </div>

        {/* ═══ รายละเอียดเฉพาะหมวด ═══ */}
        {cat === 'death' && (<>
          <div className="mp-sec-title">รายละเอียดผู้เสียชีวิต</div>
          <table className="mp-id-table"><tbody>
            <tr><th>ชื่อผู้เสียชีวิต</th><td>{rec.deceasedName || '—'}</td><th>ความสัมพันธ์</th><td>{t.relation || '—'}</td></tr>
            <tr><th>เลขบัตรประชาชน</th><td className="mono">{rec.deceasedCitizenId || '—'}</td><th>วันเสียชีวิต</th><td>{rec.deceasedDeathDate ? fmt.date(rec.deceasedDeathDate) : '—'}</td></tr>
            <tr><th>เสียชีวิตอายุ</th><td>{rec.deceasedAge ? rec.deceasedAge + ' ปี' : '—'}</td><th>สาเหตุการเสียชีวิต</th><td>{rec.deceasedCause || '—'}</td></tr>
          </tbody></table>
          {rec.benefName && (<>
            <div className="mp-sec-title">ผู้รับผลประโยชน์ / ผู้รับเงิน</div>
            <table className="mp-id-table"><tbody>
              <tr><th>ชื่อผู้รับเงิน</th><td>{rec.benefName}</td><th>ความสัมพันธ์</th><td>{window.reliefLabel('relation', rec.benefRelation)}</td></tr>
              <tr><th>เลขบัตรประชาชน</th><td className="mono">{rec.benefCitizenId || '—'}</td><th>เบอร์โทรศัพท์</th><td className="mono">{rec.benefPhone || '—'}</td></tr>
            </tbody></table>
          </>)}
        </>)}
        {cat === 'disaster' && (<>
          <div className="mp-sec-title">รายละเอียดภัยพิบัติ และบ้านที่ประสบภัย</div>
          <table className="mp-id-table"><tbody>
            <tr><th>ประเภทภัยพิบัติ</th><td>{rec.disasterKind || '—'}</td><th>วันประสบภัย</th><td>{rec.disasterDate ? fmt.date(rec.disasterDate) : '—'}</td></tr>
            <tr><th>ระดับความเสียหาย</th><td>{window.reliefLabel('damage', rec.damage)}</td><th>สถานะที่พักอาศัย</th><td>{window.reliefLabel('residence', rec.residence)}</td></tr>
            <tr><th>รหัสทะเบียนบ้าน</th><td className="mono">{rec.houseRegNo || '—'}</td><th>หน่วยงานรับรอง</th><td>{rec.certOrg || '—'}</td></tr>
            <tr><th>ที่อยู่บ้านที่ประสบภัย</th><td colSpan="3">{[rec.houseNo, rec.moo && 'หมู่ ' + rec.moo, rec.tambon, rec.amphoe, rec.province, rec.postal].filter(Boolean).join(' ') || '—'}</td></tr>
            <tr><th>รายละเอียดเหตุการณ์</th><td colSpan="3">{rec.disasterDetail || '—'}</td></tr>
          </tbody></table>
        </>)}
        {cat === 'disability' && (<>
          <div className="mp-sec-title">รายละเอียดทุพพลภาพ</div>
          <table className="mp-id-table"><tbody>
            <tr><th>ผู้ทุพพลภาพ</th><td>{rec.memberName}</td><th>ประเภททุพพลภาพ</th><td>{rec.disabType || '—'}</td></tr>
            <tr><th>ระดับทุพพลภาพ</th><td>{window.reliefLabel('disab', rec.disabLevel)}</td><th>วันที่ทุพพลภาพ</th><td>{rec.disabDate ? fmt.date(rec.disabDate) : '—'}</td></tr>
            <tr><th>โรงพยาบาล/หน่วยแพทย์</th><td>{rec.hospital || '—'}</td><th>เลขที่ใบรับรองแพทย์</th><td className="mono">{rec.medCertNo || '—'}</td></tr>
            <tr><th>สาเหตุ</th><td colSpan="3">{rec.disabCause || '—'}</td></tr>
          </tbody></table>
        </>)}
        {cat === 'general' && (<>
          <div className="mp-sec-title">รายละเอียดคำขอ</div>
          <table className="mp-id-table"><tbody>
            <tr><th>วันที่เกิดเหตุ</th><td>{rec.eventDate ? fmt.date(rec.eventDate) : '—'}</td><th>อ้างอิงมติกรรมการ</th><td>{rec.boardRef || '—'}</td></tr>
            <tr><th>รายละเอียดคำขอ</th><td colSpan="3">{rec.reqDetail || '—'}</td></tr>
            <tr><th>เหตุผลการขอ</th><td colSpan="3">{rec.reqReason || '—'}</td></tr>
          </tbody></table>
        </>)}

        {/* ═══ สิทธิสวัสดิการ ═══ */}
        <div className="mp-sec-title">สิทธิสวัสดิการ</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th>รายการ</th>
              <th className="center">เงื่อนไขการคำนวณ</th>
              <th className="right">จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>สิทธิที่ได้รับ</td>
              <td className="center">{t.member ? `อายุการเป็นสมาชิก ${window.reliefTierLabel(memberYears)}` : t.label}</td>
              <td className="right mono">{fmt.money(rec.eligible, 2)}</td>
            </tr>
            <tr>
              <td>ยอดที่ขอเบิก</td>
              <td className="center">{rec.over120 ? 'ยื่นเอกสารเกินกว่า 120 วัน' : 'ยื่นภายในกำหนด'}</td>
              <td className="right mono">{fmt.money(rec.requested, 2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colSpan="2">รวมจำนวนเงินที่อนุมัติจ่าย</td><td className="right mono">{fmt.money(rec.requested, 2)}</td></tr>
          </tfoot>
        </table>
        <div className="mp-note-box">
          <span className="mp-note-label">จำนวนเงินเป็นตัวอักษร</span>
          <div style={{ fontWeight: 600 }}>({window.bahtText(rec.requested)})</div>
        </div>

        {rec.note && (
          <div className="mp-note-box">
            <span className="mp-note-label">หมายเหตุ</span>
            <div>{rec.note}</div>
          </div>
        )}

        {/* ═══ รายละเอียดการรับเงิน ═══ */}
        <div className="mp-sec-title">รายละเอียดการรับเงิน</div>
        <div className="mp-kv">
          <KV k="รับเงินโดย">{payByLabel}</KV>
          <KV k="ธนาคาร">{bankLabel || '—'}</KV>
          <KV k="เลขที่บัญชี"><span className="mono">{rec.payAccount || rec.coopAccount || '—'}</span></KV>
          <KV k="ชื่อบัญชี / ผู้รับ">{rec.accName || rec.cashName || rec.moName || rec.coopAccName || '—'}</KV>
          <KV k="วันที่จ่าย">{rec.payDate ? fmt.date(rec.payDate) : '—'}</KV>
          <KV k="สถานะการจ่าย">{paid ? 'PAID — จ่ายแล้ว' : 'UNPAID — ยังไม่จ่าย'}</KV>
        </div>

        {/* ═══ ลายเซ็นรับรอง ═══ */}
        <div className="mp-sign-row vch-sign-row">
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้ยื่นคำขอ / ผู้รับเงิน</div><div className="vch-sign-name">{rec.memberName}</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>เจ้าหน้าที่ทะเบียน</div><div className="vch-sign-name">{rec.enteredBy}</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้จัดการสหกรณ์</div><div className="vch-sign-name">นายประสิทธิ์ คงทอง</div></div>
        </div>

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { ReliefPrintSheet });
