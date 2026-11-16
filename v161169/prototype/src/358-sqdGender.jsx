// ════════════════════════════════════════════════════════════════════
//  รายละเอียดอายัดหนี้ — หน้าจอสอบถาม (inquiry, read-only)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  เลือกสมาชิก → รวมรายการที่เกี่ยวข้องกับการอายัดหนี้ของสมาชิกรายนั้น
//   ① รายการอายัดหนี้        (ทะเบียนอายัดเงิน — window.sqLoad)
//   ② รายการแจ้งให้ชำระหนี้    (หนังสือแจ้งชำระหนี้ — window.dnLoad)
//   ③ รายการแจ้งเปลี่ยนผู้ค้ำ   (แจ้งเปลี่ยนผู้ค้ำประกัน — window.gcnLoad)
//  ใช้ DnMemberSearchModal / DN_MEMBERS ร่วมกับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

// เพศจากคำนำหน้า
const sqdGender = (m) => {
  if (!m) return '';
  const t = m.title || '';
  if (t === 'นาย' || /^นาย/.test(m.name || '')) return 'ชาย';
  if (t === 'นาง' || t === 'นางสาว' || /^นาง/.test(m.name || '')) return 'หญิง';
  return '—';
};

// ─── ฟิลด์แสดงผล (label + ค่าอ่านอย่างเดียว) ─────────────────────────
function SqdField({ label, value, mono, placeholder, span }) {
  const st = span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="dn-field" style={st}>
      <label>{label}</label>
      <input className={'cfg-input sr-auto' + (mono ? ' mono' : '')}
             value={value || ''} readOnly placeholder={placeholder || '—'} />
    </div>
  );
}

// ─── การ์ดว่าง / prompt ให้เลือกสมาชิก ──────────────────────────────
function SqdEmpty({ text }) {
  return (
    <tr><td colSpan="99" className="empty-state" style={{ padding: '18px 8px' }}>{text}</td></tr>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function DebtSeizureDetailPage({ onToast }) {
  const [member, setMember] = useState(null);

  // แหล่งข้อมูลทะเบียน (โหลดครั้งเดียวต่อการ mount)
  const seizures = useMemo(() => window.sqLoad(), []);
  const notices = useMemo(() => window.dnLoad(), []);
  const guarChanges = useMemo(() => window.gcnLoad(), []);

  const code = member ? member.code : '';
  const nameKey = member ? (member.name || '') : '';

  const mySeizures = useMemo(
    () => seizures.filter(r => r.memberCode === code),
    [seizures, code]);
  const myNotices = useMemo(
    () => notices.filter(r => r.memberCode === code),
    [notices, code]);
  const myGuarChanges = useMemo(
    () => guarChanges.filter(r => r.memberCode === code || (nameKey && r.memberName === nameKey)),
    [guarChanges, code, nameKey]);

  const pick = (m) => setMember(window.dnMember(m.code) || m);
  const clear = () => setMember(null);

  const totalSeized = mySeizures.filter(r => r.status !== 'cancelled')
    .reduce((s, r) => s + (Number(r.seizureAmount) || 0), 0);

  return (
    <div data-screen-label="หน้ารายละเอียดอายัดหนี้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายละเอียดอายัดหนี้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนและติดตามหนี้ · สอบถามรายการอายัดหนี้ หนังสือแจ้งให้ชำระหนี้ และการแจ้งเปลี่ยนผู้ค้ำของสมาชิกรายบุคคล
          </div>
        </div>
        <span className="spacer" />
        {member && (
          <div className="sq-action-group">
            <button className="btn sm" onClick={clear}><Icon name="close" size={13} /> ล้างค่า</button>
          </div>
        )}
      </div>

      {/* ── ข้อมูลสมาชิก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
        </div>

        <div className="form-grid cols-3">
          {/* เลขสมาชิก — ฟิลด์ค้นหากลาง (MemberSearchField ตาม Design System) */}
          <div className="dn-field">
            <label>เลขสมาชิก</label>
            <MemberSearchField member={member} onPick={pick}
                               source={window.DN_MEMBERS} title="ค้นหาสมาชิกลูกหนี้"
                               placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อสมาชิก…" />
          </div>
          <SqdField label="ชื่อสมาชิก" value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" />
          <SqdField label="เพศ" value={sqdGender(member)} placeholder="(ดึงอัตโนมัติ)" />
          <SqdField label="ประเภทสมาชิก" value={member ? member.memberType : ''} placeholder="(ดึงอัตโนมัติ)" />
          <SqdField label="หน่วยสมาชิก"
                    value={member ? `${member.deptCode || ''}${member.deptCode ? ' · ' : ''}${member.dept || ''}` : ''}
                    placeholder="(ดึงอัตโนมัติ)" />
          <SqdField label="สถานะสมาชิก" value={member ? member.status : ''} placeholder="(ดึงอัตโนมัติ)" />
        </div>

        {!member && (
          <div className="dn-status-alert info" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>คลิกช่อง <b>เลขสมาชิก</b> เพื่อค้นหาและเลือกสมาชิก แล้วระบบจะแสดงรายการอายัดหนี้ที่เกี่ยวข้อง</span>
          </div>
        )}
      </div>

      {/* ── ① รายการอายัดหนี้ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการอายัดหนี้</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            {member && <span className="muted" style={{ fontSize: 11.5 }}>พบ <b style={{ color: 'var(--text)' }}>{mySeizures.length}</b> รายการ · ยอดเงินอายัดรวม <b className="mono" style={{ color: 'var(--text)' }}>{fmt.money(totalSeized, 2)}</b> บาท</span>}
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 160 }}>เลขที่อายัด</th>
                <th className="center" style={{ width: 150 }}>วันที่ลงทะเบียน</th>
                <th className="num">ยอดเงิน (บาท)</th>
                <th className="center" style={{ width: 130 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {!member ? <SqdEmpty text="เลือกสมาชิกเพื่อดูรายการอายัดหนี้" />
                : mySeizures.length === 0 ? <SqdEmpty text="ไม่พบรายการอายัดหนี้ของสมาชิกรายนี้" />
                  : mySeizures.map(r => {
                      const st = window.sqStatus(r.status);
                      return (
                        <tr key={r.id}>
                          <td className="mono">{r.seizureNo}</td>
                          <td className="center mono">{fmt.date(r.regDate)}</td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.seizureAmount, 2)}</td>
                          <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div></div>
      </div>

      {/* ── ② รายการแจ้งให้ชำระหนี้ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการแจ้งให้ชำระหนี้</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            {member && <span className="muted" style={{ fontSize: 11.5 }}>พบ <b style={{ color: 'var(--text)' }}>{myNotices.length}</b> รายการ</span>}
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 170 }}>เลขที่อายัด</th>
                <th className="center" style={{ width: 90 }}>ครั้งที่</th>
                <th className="center" style={{ width: 150 }}>วันที่ลงทะเบียน</th>
                <th className="num">ยอดเงิน (บาท)</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {!member ? <SqdEmpty text="เลือกสมาชิกเพื่อดูรายการแจ้งให้ชำระหนี้" />
                : myNotices.length === 0 ? <SqdEmpty text="ไม่พบหนังสือแจ้งให้ชำระหนี้ของสมาชิกรายนี้" />
                  : myNotices.map(r => {
                      const stv = window.dnStatus ? window.dnStatus(r.status) : null;
                      return (
                        <tr key={r.id}>
                          <td className="mono">{r.seizeNo}</td>
                          <td className="center mono">{r.round}</td>
                          <td className="center mono">{fmt.date(r.regDate)}</td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.totalOutstanding, 2)}</td>
                          <td className="center">{stv ? <span className={'pill ' + stv.pill}>{stv.l}</span> : <span className="chip">{r.status}</span>}</td>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div></div>
      </div>

      {/* ── ③ รายการแจ้งเปลี่ยนผู้ค้ำ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการแจ้งเปลี่ยนผู้ค้ำ</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            {member && <span className="muted" style={{ fontSize: 11.5 }}>พบ <b style={{ color: 'var(--text)' }}>{myGuarChanges.length}</b> รายการ</span>}
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 170 }}>เลขที่อายัด</th>
                <th className="center" style={{ width: 90 }}>ครั้งที่</th>
                <th className="center" style={{ width: 150 }}>วันที่ลงทะเบียน</th>
                <th className="num">ยอดเงิน (บาท)</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {!member ? <SqdEmpty text="เลือกสมาชิกเพื่อดูรายการแจ้งเปลี่ยนผู้ค้ำ" />
                : myGuarChanges.length === 0 ? <SqdEmpty text="ไม่พบรายการแจ้งเปลี่ยนผู้ค้ำของสมาชิกรายนี้" />
                  : myGuarChanges.map(r => {
                      const st = window.gcnStatus ? window.gcnStatus(r.status) : null;
                      return (
                        <tr key={r.id}>
                          <td className="mono">{r.refNo || r.id}</td>
                          <td className="center mono">{r.round}</td>
                          <td className="center mono">{fmt.date(r.regDate)}</td>
                          <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(r.totalRemaining, 2)}</td>
                          <td className="center">{st ? <span className={'pill ' + st.pill}>{st.l}</span> : <span className="chip">{r.status}</span>}</td>
                        </tr>
                      );
                    })}
            </tbody>
          </table>
        </div></div>
      </div>

      <SqTodayBadge />
    </div>
  );
}

Object.assign(window, { DebtSeizureDetailPage, SqdField, sqdGender });
