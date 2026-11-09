// ════════════════════════════════════════════════════════════════════
//  ตรวจสอบสิทธิการเข้าโครงการประกัน — ปรับรูปแบบการเข้าใช้งาน
//  แสดงโครงหน้าจอ (ฟิลด์ว่าง) ทั้งหมดก่อน แล้วจึงเลือกสมาชิก
//  เหมือนหน้าจอรายละเอียดสมาชิก — override ของ ClaimEligibilityPage (155)
// ════════════════════════════════════════════════════════════════════

function ClaimEligibilityPage({ onToast }) {
  const [selCode, setSelCode]   = useState(null);
  const [selPolId, setSelPolId] = useState(null);
  const [checked, setChecked]   = useState(false);

  const member = React.useMemo(() => selCode ? window.CL_MEMBERS.find(m => m.code === selCode) : null, [selCode]);
  const policies = member && member.policies ? member.policies : [];
  const docs = member && member.docs ? member.docs : [];
  const claims = member && member.claims ? member.claims : [];

  const selPolicy = React.useMemo(() => {
    if (!policies.length) return null;
    return policies.find(p => p.id === selPolId) || policies[0];
  }, [member, selPolId]);
  const elig = React.useMemo(() => member ? window.clEligibility(member, selPolicy) : null, [member, selPolicy]);

  const pickMember = (m) => {
    setSelCode(m.code);
    setSelPolId(m.policies && m.policies.length ? m.policies[0].id : null);
    setChecked(false);
  };
  const doCheck = () => { setChecked(true); onToast && onToast('ตรวจสอบสิทธิเรียบร้อย'); };
  const notImpl = (t) => onToast && onToast(`${t} (สาธิต)`);
  const d = (v) => v ? fmt.date(v) : '';

  return (
    <div data-screen-label="หน้าตรวจสอบสิทธิการเข้าโครงการประกัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตรวจสอบสิทธิการเข้าโครงการประกัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            ค้นหาสมาชิก ตรวจสอบข้อมูลการเสียชีวิต ข้อมูลโครงการประกัน ช่วงความคุ้มครอง และเอกสารประกอบ
            เพื่อยืนยันสิทธิก่อนบันทึกคำขอสินไหม
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" disabled={!member} onClick={() => notImpl('ส่งออก Excel')}>
          <Icon name="download" size={13} /> ส่งออก Excel
        </button>
        <button className="btn sm" disabled={!member} onClick={() => notImpl('พิมพ์รายงาน')}>
          <Icon name="print" size={13} /> พิมพ์รายงาน
        </button>
      </div>

      {/* ── แถบค้นหาสมาชิก (แสดงตลอด) ── */}
      <div className="reg-member-search" style={{ marginBottom: 16 }}>
        <MemberSearchField member={member}
                           onPick={pickMember}
                           source={window.CL_MEMBERS}
                           title="ค้นหาสมาชิก" changeLabel="เปลี่ยนสมาชิก"
                           placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
      </div>

      {/* ── ข้อมูลสมาชิก ── */}
      <div className="search-card" style={{ marginBottom: 16 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
          <span className="spacer" />
          {member
            ? <span className={"pill " + (member.deathStatus === 'deceased' ? 'bad' : 'ok')}>
                {member.deathStatus === 'deceased' ? 'เสียชีวิตแล้ว' : 'ยังไม่เสียชีวิต'}
              </span>
            : <span className="muted" style={{ fontSize: 11.5 }}>ยังไม่ได้เลือกสมาชิก</span>}
        </div>
        <div className="cl-detail-grid" style={{ gap: '20px 24px' }}>
          <ClRow label="เลขสมาชิก" value={member ? member.code : ''} mono />
          <ClRow label="ชื่อ-นามสกุล" value={member ? member.name : ''} />
          <ClRow label="เลขบัตรประชาชน" value={member ? member.citizenId : ''} mono />
          <ClRow label="วันเกิด" value={member ? d(member.birthDate) : ''} />
          <ClRow label="อายุ" value={member ? window.clAge(member.birthDate) + ' ปี' : ''} />
          <ClRow label="สังกัด" value={member ? (window.affilLabel ? window.affilLabel(member.deptCode, member.dept) : member.dept) : ''} />
          <ClRow label="สถานะสมาชิกปัจจุบัน" value={member ? member.memberStatus : ''}
                 tone={member && member.memberStatus === 'เสียชีวิต' ? 'danger' : ''} />
          <ClRow label="สถานะการทำงาน" value={member ? member.workStatus : ''} />
          <ClRow label="วันที่เข้าเป็นสมาชิก" value={member ? d(member.joinDate) : ''} />
          <ClRow label="วันที่พ้นสภาพ" value={member ? d(member.resignDate) : ''} />
          <ClRow label="วันที่เสียชีวิต" value={member ? d(member.deathDate) : ''}
                 tone={member && member.deathDate ? 'danger' : ''} />
          <ClRow label="แหล่งข้อมูลการเสียชีวิต" value={member ? member.deathSource : ''} />
        </div>
      </div>

      {/* ── ข้อมูลโครงการประกัน ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className="section-head cl-card-head">
          <span className="head-bar" /><h3>ข้อมูลโครงการประกันที่เข้าร่วม</h3>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>{policies.length} โครงการ</span>
        </div>
        {!policies.length ? (
          <div className="cl-empty"><Icon name="info" size={14} />
            {member ? ' สมาชิกไม่มีข้อมูลเข้าโครงการประกัน' : ' เลือกสมาชิกเพื่อแสดงข้อมูลโครงการประกัน'}
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 1180 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }} className="center">#</th>
                  <th style={{ minWidth: 210 }}>โครงการประกัน</th>
                  <th style={{ width: 110 }}>ประเภท</th>
                  <th style={{ minWidth: 160 }}>บริษัทประกัน</th>
                  <th style={{ width: 130 }}>เลขกรมธรรม์</th>
                  <th className="center" style={{ width: 96 }}>เริ่มคุ้มครอง</th>
                  <th className="center" style={{ width: 96 }}>สิ้นสุด</th>
                  <th className="num" style={{ width: 110 }}>วงเงินคุ้มครอง</th>
                  <th className="center" style={{ width: 110 }}>ความคุ้มครอง</th>
                  <th className="center" style={{ width: 100 }}>ขอสินไหม</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p, i) => {
                  const cov = window.clCoverageTag(p.coverageStatus);
                  const clm = window.clClaimTag(p.claimStatus);
                  return (
                    <tr key={p.id} className={"clickable" + (selPolicy && selPolicy.id === p.id ? ' cl-row-sel' : '')} onClick={() => setSelPolId(p.id)}>
                      <td className="center muted">{i + 1}</td>
                      <td>{p.projName}<div className="muted mono" style={{ fontSize: 11 }}>{p.projCode}</div></td>
                      <td>{p.insType}</td>
                      <td>{p.company}</td>
                      <td className="mono">{p.policyNo}</td>
                      <td className="center mono">{fmt.date(p.startDate)}</td>
                      <td className="center mono">{fmt.date(p.endDate)}</td>
                      <td className="num mono">{fmt.money(p.coverage, 0)}</td>
                      <td className="center"><span className={"pill " + cov.pill}>{cov.l}</span></td>
                      <td className="center"><span className={"pill " + clm.pill}>{clm.l}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="cl-policy-detail" style={{ background: '#fff' }}>
          <div className="cl-policy-detail-head">
            รายละเอียดโครงการประกันที่เลือก{selPolicy && <> · <span className="mono">{selPolicy.policyNo}</span></>}
          </div>
          <div className="cl-detail-grid" style={{ gap: '20px 24px' }}>
            <ClRow label="รหัสโครงการประกัน" value={selPolicy ? selPolicy.projCode : ''} mono />
            <ClRow label="ชื่อโครงการประกัน" value={selPolicy ? selPolicy.projName : ''} />
            <ClRow label="ประเภทประกัน" value={selPolicy ? selPolicy.insType : ''} />
            <ClRow label="บริษัทประกัน" value={selPolicy ? selPolicy.company : ''} />
            <ClRow label="เลขกรมธรรม์" value={selPolicy ? selPolicy.policyNo : ''} mono />
            <ClRow label="เลขอ้างอิงประกัน" value={selPolicy ? selPolicy.refNo : ''} mono />
            <ClRow label="วันที่เริ่มคุ้มครอง" value={selPolicy ? d(selPolicy.startDate) : ''} />
            <ClRow label="วันที่สิ้นสุดความคุ้มครอง" value={selPolicy ? d(selPolicy.endDate) : ''} />
            <ClRow label="วงเงินคุ้มครอง" value={selPolicy ? '฿ ' + fmt.money(selPolicy.coverage, 2) : ''} mono />
            <ClRow label="เบี้ยประกัน" value={selPolicy ? '฿ ' + fmt.money(selPolicy.premium, 2) : ''} mono />
            <ClRow label="ผู้รับผลประโยชน์" value={selPolicy ? selPolicy.beneficiary : ''} />
            <ClRow label="สถานะความคุ้มครอง" value={selPolicy ? window.clCoverageTag(selPolicy.coverageStatus).l : ''} />
          </div>
          {selPolicy && (
            <div className="cl-cond"><Icon name="info" size={12} /> <b>เงื่อนไขการเคลม:</b> {selPolicy.claimCond}</div>
          )}
        </div>
      </div>

      {/* ── ผลการตรวจสอบสิทธิ์อัตโนมัติ ── */}
      <div className="search-card" style={{ marginBottom: 16 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ผลการตรวจสอบสิทธิ์อัตโนมัติ</h3>
          <span className="spacer" />
          {!checked && (
            <button className="btn primary sm" disabled={!member} onClick={doCheck}>
              <Icon name="check" size={13} /> ตรวจสอบสิทธิ์
            </button>
          )}
        </div>

        {!member ? (
          <div className="cl-empty"><Icon name="shield" size={14} /> เลือกสมาชิกก่อน จึงจะสามารถตรวจสอบสิทธิการขอสินไหมได้</div>
        ) : !checked ? (
          <div className="cl-empty"><Icon name="shield" size={14} /> กดปุ่ม “ตรวจสอบสิทธิ์” เพื่อประเมินเงื่อนไขการขอสินไหมอัตโนมัติ</div>
        ) : (
          <>
            <div className={"cl-verdict tone-" + elig.summary.tone}>
              <div className="cl-verdict-ico"><Icon name={elig.summary.key === 'ok' ? 'check' : elig.summary.key === 'docwait' ? 'attach' : elig.summary.key === 'staff' ? 'user' : 'close'} /></div>
              <div className="cl-verdict-body">
                <div className="cl-verdict-label">ผลการตรวจสอบ: {elig.summary.label}</div>
                <div className="cl-verdict-sub">
                  {elig.summary.key === 'ok' && 'ผ่านทุกเงื่อนไข สามารถดำเนินการบันทึกคำขอสินไหมได้'}
                  {elig.summary.key === 'docwait' && 'เข้าเงื่อนไขประกัน แต่เอกสารประกอบยังไม่ครบถ้วน'}
                  {elig.summary.key === 'staff' && 'ข้อมูลไม่สมบูรณ์ หรือพบความขัดแย้งของข้อมูล — ต้องตรวจสอบโดยเจ้าหน้าที่'}
                  {elig.summary.key === 'no' && (elig.reasons[0] || 'ไม่เข้าเงื่อนไขสำคัญของการขอสินไหม')}
                </div>
              </div>
            </div>

            <ul className="cl-check-list">
              {elig.checks.map(c => (
                <li key={c.key} className={"cl-check cl-" + c.result}>
                  <span className="cl-check-mark">
                    <Icon name={c.result === 'pass' ? 'check' : c.result === 'fail' ? 'close' : c.result === 'warn' ? 'info' : 'chevRight'} size={12} />
                  </span>
                  <span className="cl-check-label">{c.label}</span>
                  <span className="cl-check-detail">{c.detail}</span>
                  <span className={"cl-check-tag " + c.result}>
                    {c.result === 'pass' ? 'ผ่าน' : c.result === 'fail' ? 'ไม่ผ่าน' : c.result === 'warn' ? 'ตรวจสอบ' : 'ไม่เกี่ยวข้อง'}
                  </span>
                </li>
              ))}
            </ul>

            {elig.missingDocs.length > 0 && (elig.summary.key === 'docwait') && (
              <div className="cl-missing">
                <div className="cl-missing-h"><Icon name="attach" size={13} /> เอกสารที่ยังขาด</div>
                <ul>{elig.missingDocs.map(x => <li key={x}>{x}</li>)}</ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── เอกสารประกอบ ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className="section-head cl-card-head">
          <span className="head-bar" /><h3>ตรวจสอบเอกสารประกอบ</h3>
          <span className="spacer" />
          <button className="btn text sm" disabled={!member} onClick={() => notImpl('แนบเอกสาร')}>
            <Icon name="attach" size={13} /> แนบเอกสาร
          </button>
        </div>
        {!docs.length ? (
          <div className="cl-empty"><Icon name="info" size={14} />
            {member ? ' ยังไม่มีการแนบเอกสารประกอบ' : ' เลือกสมาชิกเพื่อแสดงรายการเอกสารประกอบ'}
            {member && selPolicy && <> — เอกสารที่ต้องใช้: {(window.CL_DOC_TEMPLATE[selPolicy.insType] || []).join(', ')}</>}
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }} className="center">#</th>
                  <th style={{ minWidth: 220 }}>รายการเอกสาร</th>
                  <th className="center" style={{ width: 80 }}>จำเป็น</th>
                  <th className="center" style={{ width: 110 }}>สถานะเอกสาร</th>
                  <th className="center" style={{ width: 100 }}>วันที่แนบ</th>
                  <th style={{ minWidth: 130 }}>ผู้แนบเอกสาร</th>
                  <th style={{ minWidth: 160 }}>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((x, i) => {
                  const st = window.clDocTag(x.required ? x.status : (x.status === 'complete' ? 'complete' : 'na'));
                  return (
                    <tr key={i}>
                      <td className="center muted">{i + 1}</td>
                      <td>{x.name}</td>
                      <td className="center">{x.required ? <span className="chip danger">จำเป็น</span> : <span className="chip">ไม่บังคับ</span>}</td>
                      <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                      <td className="center mono">{x.attachDate ? fmt.date(x.attachDate) : '—'}</td>
                      <td>{x.attachBy || '—'}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{x.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ประวัติการขอสินไหม ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div className="section-head cl-card-head">
          <span className="head-bar" /><h3>ประวัติการขอสินไหม</h3>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 11.5 }}>{claims.length} รายการ</span>
        </div>
        {!claims.length ? (
          <div className="cl-empty"><Icon name="history" size={14} />
            {member ? ' ไม่พบประวัติการขอสินไหมของสมาชิกรายนี้' : ' เลือกสมาชิกเพื่อแสดงประวัติการขอสินไหม'}
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 1040 }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>เลขที่คำขอ</th>
                  <th className="center" style={{ width: 100 }}>วันที่ขอ</th>
                  <th style={{ minWidth: 200 }}>โครงการประกัน</th>
                  <th style={{ minWidth: 150 }}>บริษัทประกัน</th>
                  <th className="num" style={{ width: 110 }}>วงเงินเรียกร้อง</th>
                  <th className="center" style={{ width: 100 }}>สถานะคำขอ</th>
                  <th className="center" style={{ width: 100 }}>ส่งบริษัท</th>
                  <th className="center" style={{ width: 100 }}>วันที่อนุมัติ</th>
                  <th className="num" style={{ width: 110 }}>เงินที่ได้รับ</th>
                </tr>
              </thead>
              <tbody>
                {claims.map(c => {
                  const st = window.clClaimTag(c.status);
                  return (
                    <tr key={c.claimNo}>
                      <td className="mono">{c.claimNo}</td>
                      <td className="center mono">{fmt.date(c.date)}</td>
                      <td>{c.projName}</td>
                      <td>{c.company}</td>
                      <td className="num mono">{fmt.money(c.claimAmount, 0)}</td>
                      <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                      <td className="center mono">{c.sentDate ? fmt.date(c.sentDate) : '—'}</td>
                      <td className="center mono">{c.approveDate ? fmt.date(c.approveDate) : '—'}</td>
                      <td className="num mono">{c.paidAmount ? fmt.money(c.paidAmount, 0) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ClaimEligibilityPage });
