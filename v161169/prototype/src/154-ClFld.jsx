// ════════════════════════════════════════════════════════════════════
//  ระบบงานขอสินไหม / งานประกันสมาชิก
//  ตรวจสอบสิทธิการเข้าโครงการประกัน (Claim Eligibility Check)
//  จุดเริ่มต้นก่อนบันทึกคำขอสินไหม — ค้นหาสมาชิก → ตรวจสอบสถานะเสียชีวิต →
//  ข้อมูลโครงการประกัน → ช่วงคุ้มครอง → การขอซ้ำ → เอกสาร → สรุปสิทธิ
// ════════════════════════════════════════════════════════════════════

// ─── ฟิลด์ค้นหา (label เล็กด้านบน) ───────────────────────────────────
function ClFld({ label, children, w }) {
  return (
    <div className="cl-fld" style={w ? { width: w } : null}>
      <label className="cl-fld-l">{label}</label>
      {children}
    </div>
  );
}
function ClRow({ label, value, mono, tone }) {
  return (
    <div className="cl-drow">
      <span className="cl-drow-k">{label}</span>
      <span className={"cl-drow-v" + (mono ? ' mono' : '') + (tone ? ' ' + tone : '')}>{value || '—'}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════
//  Main page
// ═════════════════════════════════════════════════════════════════════
function ClaimEligibilityPage({ onToast }) {
  const [selCode, setSelCode]   = useState(null);
  const [selPolId, setSelPolId] = useState(null);
  const [checked, setChecked]   = useState(false);   // กด "ตรวจสอบสิทธิ์" แล้วหรือยัง

  // สมาชิกตัวอย่างสำหรับปุ่มสาธิตบนหน้าจอสถานะว่าง
  const exampleMembers = React.useMemo(() => {
    const codes = ['M-058241', 'M-058251', 'M-058243'];
    return codes.map(c => (window.CL_MEMBERS || []).find(m => m.code === c)).filter(Boolean);
  }, []);

  const member = React.useMemo(() => selCode ? window.CL_MEMBERS.find(m => m.code === selCode) : null, [selCode]);
  const selPolicy = React.useMemo(() => {
    if (!member || !member.policies.length) return null;
    return member.policies.find(p => p.id === selPolId) || member.policies[0];
  }, [member, selPolId]);
  const elig = React.useMemo(() => member ? window.clEligibility(member, selPolicy) : null, [member, selPolicy]);

  const pickMember = (m) => {
    setSelCode(m.code);
    setSelPolId(m.policies && m.policies.length ? m.policies[0].id : null);
    setChecked(false);
  };

  const doCheck = () => { setChecked(true); onToast && onToast('ตรวจสอบสิทธิเรียบร้อย'); };
  const notImpl = (t) => onToast && onToast(`${t} (สาธิต)`);

  const canCreateClaim = elig && (elig.summary.key === 'ok' || elig.summary.key === 'docwait');

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
        {member && <>
          <button className="btn sm" onClick={() => notImpl('ส่งออก Excel')}>
            <Icon name="download" size={13} /> ส่งออก Excel
          </button>
          <button className="btn sm" onClick={() => notImpl('พิมพ์รายงาน')}>
            <Icon name="print" size={13} /> พิมพ์รายงาน
          </button>
        </>}
      </div>

      {/* ── สถานะว่าง / ค้นหาสมาชิก (รูปแบบเดียวกับหน้าทะเบียนสมาชิก) ── */}
      {!member ? (
        <MemberSearchEmptyState
          icon="member"
          title="ยังไม่ได้เลือกสมาชิก"
          description="ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อตรวจสอบสิทธิการเข้าโครงการประกัน สถานะความคุ้มครอง และบันทึกคำขอสินไหม"
          buttonLabel="ค้นหาเลขสมาชิก"
          modalTitle="ค้นหาสมาชิก"
          source={window.CL_MEMBERS}
          examples={exampleMembers}
          onPick={pickMember} />
      ) : (
        <div className="reg-member-search" style={{ marginBottom: 12 }}>
          <MemberSearchField member={member}
                             onPick={pickMember}
                             source={window.CL_MEMBERS}
                             title="ค้นหาสมาชิก" changeLabel="เปลี่ยนสมาชิก"
                             placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
        </div>
      )}

      {/* ── รายละเอียดเมื่อเลือกสมาชิก ── */}
      {member && (
        <>
          {/* ส่วนที่ 3: ข้อมูลสมาชิก */}
          <div className="search-card">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
              <span className="spacer" />
              <span className={"pill " + (member.deathStatus === 'deceased' ? 'bad' : 'ok')}>
                {member.deathStatus === 'deceased' ? 'เสียชีวิตแล้ว' : 'ยังไม่เสียชีวิต'}
              </span>
            </div>
            <div className="cl-detail-grid">
              <ClRow label="เลขสมาชิก" value={member.code} mono />
              <ClRow label="ชื่อ-นามสกุล" value={member.name} />
              <ClRow label="เลขบัตรประชาชน" value={member.citizenId} mono />
              <ClRow label="วันเกิด" value={fmt.date(member.birthDate)} />
              <ClRow label="อายุ" value={window.clAge(member.birthDate) + ' ปี'} />
              <ClRow label="สังกัด" value={window.affilLabel ? window.affilLabel(member.deptCode, member.dept) : member.dept} />
              <ClRow label="สถานะสมาชิกปัจจุบัน" value={member.memberStatus}
                     tone={member.memberStatus === 'เสียชีวิต' ? 'danger' : ''} />
              <ClRow label="สถานะการทำงาน" value={member.workStatus} />
              <ClRow label="วันที่เข้าเป็นสมาชิก" value={fmt.date(member.joinDate)} />
              <ClRow label="วันที่พ้นสภาพ" value={member.resignDate ? fmt.date(member.resignDate) : '—'} />
              <ClRow label="วันที่เสียชีวิต" value={member.deathDate ? fmt.date(member.deathDate) : '—'}
                     tone={member.deathDate ? 'danger' : ''} />
              <ClRow label="แหล่งข้อมูลการเสียชีวิต" value={member.deathSource || '—'} />
            </div>
          </div>

          {/* ส่วนที่ 4: ข้อมูลโครงการประกัน */}
          <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head cl-card-head">
              <span className="head-bar" /><h3>ข้อมูลโครงการประกันที่เข้าร่วม</h3>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 11.5 }}>{member.policies.length} โครงการ</span>
            </div>
            {member.policies.length === 0 ? (
              <div className="cl-empty"><Icon name="info" size={14} /> สมาชิกไม่มีข้อมูลเข้าโครงการประกัน</div>
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
                    {member.policies.map((p, i) => {
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

            {/* รายละเอียดโครงการที่เลือก */}
            {selPolicy && (
              <div className="cl-policy-detail">
                <div className="cl-policy-detail-head">รายละเอียดโครงการประกันที่เลือก · <span className="mono">{selPolicy.policyNo}</span></div>
                <div className="cl-detail-grid">
                  <ClRow label="รหัสโครงการประกัน" value={selPolicy.projCode} mono />
                  <ClRow label="ชื่อโครงการประกัน" value={selPolicy.projName} />
                  <ClRow label="ประเภทประกัน" value={selPolicy.insType} />
                  <ClRow label="บริษัทประกัน" value={selPolicy.company} />
                  <ClRow label="เลขกรมธรรม์" value={selPolicy.policyNo} mono />
                  <ClRow label="เลขอ้างอิงประกัน" value={selPolicy.refNo} mono />
                  <ClRow label="วันที่เริ่มคุ้มครอง" value={fmt.date(selPolicy.startDate)} />
                  <ClRow label="วันที่สิ้นสุดความคุ้มครอง" value={fmt.date(selPolicy.endDate)} />
                  <ClRow label="วงเงินคุ้มครอง" value={'฿ ' + fmt.money(selPolicy.coverage, 2)} mono />
                  <ClRow label="เบี้ยประกัน" value={'฿ ' + fmt.money(selPolicy.premium, 2)} mono />
                  <ClRow label="ผู้รับผลประโยชน์" value={selPolicy.beneficiary} />
                  <ClRow label="สถานะความคุ้มครอง" value={window.clCoverageTag(selPolicy.coverageStatus).l} />
                </div>
                <div className="cl-cond"><Icon name="info" size={12} /> <b>เงื่อนไขการเคลม:</b> {selPolicy.claimCond}</div>
              </div>
            )}
          </div>

          {/* ส่วนที่ 5: ผลการตรวจสอบสิทธิ์อัตโนมัติ */}
          <div className="search-card">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <span className="head-bar" /><h3>ผลการตรวจสอบสิทธิ์อัตโนมัติ</h3>
              <span className="spacer" />
              {!checked && <button className="btn primary sm" onClick={doCheck}><Icon name="check" size={13} /> ตรวจสอบสิทธิ์</button>}
            </div>

            {!checked ? (
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
                    <ul>{elig.missingDocs.map(d => <li key={d}>{d}</li>)}</ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ส่วนที่ 6: เอกสารประกอบ */}
          <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head cl-card-head">
              <span className="head-bar" /><h3>ตรวจสอบเอกสารประกอบ</h3>
              <span className="spacer" />
              <button className="btn text sm" onClick={() => notImpl('แนบเอกสาร')}><Icon name="attach" size={13} /> แนบเอกสาร</button>
            </div>
            {(!member.docs || member.docs.length === 0) ? (
              <div className="cl-empty"><Icon name="info" size={14} /> ยังไม่มีการแนบเอกสารประกอบ
                {selPolicy && <> — เอกสารที่ต้องใช้: {(window.CL_DOC_TEMPLATE[selPolicy.insType] || []).join(', ')}</>}
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
                    {member.docs.map((d, i) => {
                      const st = window.clDocTag(d.required ? d.status : (d.status === 'complete' ? 'complete' : 'na'));
                      return (
                        <tr key={i}>
                          <td className="center muted">{i + 1}</td>
                          <td>{d.name}</td>
                          <td className="center">{d.required ? <span className="chip danger">จำเป็น</span> : <span className="chip">ไม่บังคับ</span>}</td>
                          <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                          <td className="center mono">{d.attachDate ? fmt.date(d.attachDate) : '—'}</td>
                          <td>{d.attachBy || '—'}</td>
                          <td className="muted" style={{ fontSize: 12 }}>{d.note || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ส่วนที่ 7: ประวัติการขอสินไหม */}
          <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="section-head cl-card-head">
              <span className="head-bar" /><h3>ประวัติการขอสินไหม</h3>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 11.5 }}>{member.claims.length} รายการ</span>
            </div>
            {member.claims.length === 0 ? (
              <div className="cl-empty"><Icon name="history" size={14} /> ไม่พบประวัติการขอสินไหมของสมาชิกรายนี้</div>
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
                    {member.claims.map(c => {
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

        </>
      )}
    </div>
  );
}

Object.assign(window, { ClaimEligibilityPage });
