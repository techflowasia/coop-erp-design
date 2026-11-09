// ════════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก — (1) Pop up ประวัติการทำรายการ (modal)
//                  (2) พิมพ์รายละเอียดสมาชิกครบทุกแท็บ (รูปแบบเดียวกับ
//                      ใบรายละเอียดสมาชิกในเมนูสร้างใบคำขอกู้เงิน)
// ════════════════════════════════════════════════════════════════════

// ─── (1) Pop up ประวัติการทำรายการ ──────────────────────────────────
// รูปแบบเดียวกับ modal ประวัติในหน้ารายละเอียดประเภทเงินกู้ (timeline + diff)
const txActionMeta = (a) => {
  const map = {
    create:  { label: 'สร้างข้อมูล',          color: 'var(--success)',     icon: 'plus' },
    update:  { label: 'แก้ไขข้อมูล',          color: 'var(--primary)',     icon: 'edit' },
    toggle:  { label: 'เปิด/ปิดการใช้งาน',    color: 'var(--warning)',     icon: 'refresh' },
    delete:  { label: 'ลบข้อมูล',             color: 'var(--danger)',      icon: 'trash' },
    print:   { label: 'พิมพ์เอกสาร',          color: 'var(--text-muted)',  icon: 'print' },
    approve: { label: 'อนุมัติ',              color: 'var(--success)',     icon: 'check' },
  };
  if (map[a]) return map[a];
  const f = (window.AUDIT_ACTIONS || {})[a];
  return { label: (f && f.label) || a, color: 'var(--primary)', icon: 'edit' };
};
function TxHistoryModal({ memberCode, memberName, modules, title, onClose, defaultScoped }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const allEntries = ctx.entries || window.AUDIT_SEED || [];
  const [scoped, setScoped] = useState(!!defaultScoped);

  const rows = useMemo(() => {
    let r = allEntries.filter(e => (e.target || '').includes(memberCode));
    if (scoped && modules && modules.length) r = r.filter(e => modules.includes(e.module));
    return [...r].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [allEntries, memberCode, modules, scoped]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true"
           style={{ width: 620, maxWidth: '95vw', maxHeight: '82vh', marginTop: 32, display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{title || 'ประวัติการทำรายการ'}</h2>
            <div className="muted" style={{ fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {memberCode} · {memberName} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>
          {modules && modules.length > 0 && (
            <div className="toolbar" style={{ marginTop: 0, marginBottom: 12 }}>
              <button className={"filter-chip" + (scoped ? " active" : "")} onClick={() => setScoped(true)}>เฉพาะหน้าจอนี้</button>
              <button className={"filter-chip" + (!scoped ? " active" : "")} onClick={() => setScoped(false)}>ทุกรายการของสมาชิก</button>
              <span className="spacer" />
              <span className="muted" style={{ fontSize: 12 }}>{rows.length} เหตุการณ์</span>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="empty-state">
              <div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>
              ยังไม่มีประวัติการทำรายการของสมาชิกรายนี้
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rows.map((e, i) => {
                const m = txActionMeta(e.action);
                return (
                  <div key={e.id} style={{ display: 'flex', gap: 12, padding: '10px 2px',
                                           borderBottom: i < rows.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%',
                                    background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)',
                                    color: m.color, display: 'grid', placeItems: 'center' }}>
                        <Icon name={m.icon} size={14} />
                      </div>
                      {i < rows.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                        {e.module && <span className="pill neutral">{e.module}</span>}
                        <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.datetime(e.ts)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{e.summary}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {e.user} · {e.role}</div>
                      {e.changes && e.changes.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {e.changes.map((c, ci) => (
                            <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                              <span className="muted" style={{ minWidth: 110 }}>{c.field}</span>
                              <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                              <Icon name="chevRight" size={11} />
                              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mp-note" style={{ marginTop: 16 }}>
            <div className="mp-note-title">บันทึกเพื่อการตรวจสอบ</div>
            ประวัติการทำรายการถูกบันทึกอัตโนมัติจากระบบ Audit Log และไม่สามารถแก้ไขย้อนหลังได้
          </div>
        </div>

        <div className="ins-modal-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ─── (2) ใบรายละเอียดสมาชิก — ครบทุกแท็บ ────────────────────────────
const mfpMoney = (v) => (v || v === 0 ? fmt.money(v) : '-');
const mfpDate = (v) => (v ? fmt.date(v) : '-');
const mfpOpt = (opts, v) => ((opts || []).find(o => o.value === v) || {}).label || v || '-';
const mfpFlags = (obj, labels) => {
  const on = Object.keys(labels).filter(k => obj && obj[k]);
  return on.length ? on.map(k => labels[k]).join(' , ') : '- ไม่มี -';
};
const mfpEmpty = (n) => <tr><td colSpan={n} className="center">- ไม่มีรายการ -</td></tr>;
const mfpTaxStatus = (v) => ({ issued: 'ออกหนังสือแล้ว', pending: 'รอออกหนังสือ', draft: 'ร่าง', cancelled: 'ยกเลิก', canceled: 'ยกเลิก' }[v] || v || '-');
const mfpInsStatus = (p) => {
  try {
    const wd = (window.INSURANCE_WORK_DATE || new Date().toISOString().slice(0, 10));
    const st = window.insRenewState ? window.insRenewState(p, wd) : null;
    if (st && st.label) return st.label;
  } catch (e) { /* ignore */ }
  const map = { pending: 'ยังไม่ต่ออายุ', renewed: 'ต่ออายุแล้ว', review: 'รอตรวจสอบ', overdue: 'เกินกำหนด' };
  return map[p.status] || p.status || '-';
};

function MemberFullPrintSheet({ data }) {
  const meta = lrqPrintMeta();
  const m = data.member;
  const user = (window.CURRENT_USER && (window.CURRENT_USER.name || window.CURRENT_USER)) || 'ผู้ใช้งานระบบ';
  const amlo = data.amlo || {};
  const st = data.status || {};
  const shares = data.shares || [];
  const loans = data.loans || [];
  const dep = data.deposits || { accounts: [], transactions: [] };
  const agent = data.agentDebt || { rows: [] };
  const ins = (() => { try { return window.memberInsurancePolicies(m.code) || []; } catch (e) { return []; } })();
  const taxRows = (() => {
    try {
      const num = (v) => Number(String(v == null ? '' : v).replace(/\D/g, ''));
      const codeNum = num(m.code);
      const accNos = new Set((data.deposits && data.deposits.accounts || []).map(a => a.accNo));
      return (window.depTaxLoad() || []).filter(r => num(r.member) === codeNum || accNos.has(r.accNo));
    } catch (e) { return []; }
  })();
  const restruct = [];
  Object.keys(window.MEMBER_RESTRUCT || {}).forEach(cn => {
    if (loans.some(l => l.contract === cn)) {
      (window.MEMBER_RESTRUCT[cn] || []).forEach(r => restruct.push({ contract: cn, ...r }));
    }
  });

  const totShare = shares.reduce((a, x) => a + (x.shareValue || 0), 0);
  const totLoanRemain = loans.reduce((a, x) => a + (x.remaining || 0), 0);
  const totGuarRemain = (data.guaranteeGiven || []).reduce((a, x) => a + (x.remaining || 0), 0);
  const totDepBal = (dep.accounts || []).reduce((a, x) => a + (x.balance || 0), 0);

  return (
    <div className="lrqd-sheet">
      <div className="lrqd-letterhead"><CoopLetterheadBlock /></div>
      <table className="lrqd-mdsheet"><thead><tr><td>
        <div className="lrqd-md-head">
          <div className="lrqd-head">
            <div className="lrqd-barcode">
              <span dangerouslySetInnerHTML={{ __html: (window.barcode128 ? window.barcode128(m.code, { module: 1.4, height: 42, quiet: 6 }) : '') }} />
              <div className="lrqd-barcode-txt mono">{m.code}</div>
            </div>
            <div className="lrqd-head-meta">พิมพ์วันที่ {meta.date} &nbsp; เวลา {meta.time} &nbsp; ผู้พิมพ์ : {user}</div>
          </div>
          <div className="lrqd-title">รายละเอียดของสมาชิก</div>
          <div className="lrqd-info">
            <LrqKV label="เลขที่สมาชิก" value={m.code} />
            <LrqKV label="ชื่อ - ชื่อสกุล" value={m.name} wide />
            <LrqKV label="สังกัด" value={(m.departmentCode ? m.departmentCode + ' · ' : '') + (m.department || '-')} wide />
            <LrqKV label="เงินเดือน" value={fmt.money(m.salary)} />
            <LrqKV label="อายุ" value={fmt.ageYM ? fmt.ageYM(m.birthDate) : fmt.age(m.birthDate)} />
          </div>
          <div className="lrqd-md-amlo">
            <b>สถานะ AMLO :::&gt;</b> {amlo.designatedLabel || 'ไม่เป็นบุคคลที่ถูกกำหนด'} &nbsp;&nbsp;&nbsp;
            <b>ระดับความเสี่ยง :::&gt;</b> {amlo.risk || 'ต่ำ'}
          </div>
          <div className="lrqd-sec-title">หมายเหตุ สถานะสมาชิก</div>
          <div className="lrqd-md-notes">
            {(data.statusNotes || []).length === 0
              ? <p>- ไม่มีหมายเหตุ -</p>
              : (data.statusNotes || []).map((t, i) => <p key={i}>{t}</p>)}
          </div>
        </div>
      </td></tr></thead><tbody><tr><td>

      {/* ── แท็บ รายละเอียดสมาชิก ── */}
      <LrqDocSection title="ข้อมูลส่วนบุคคล (แท็บรายละเอียดสมาชิก)">
        <table className="lrqd-tbl"><tbody>
          <tr><th>คำนำหน้า / ชื่อ / ชื่อสกุล</th><td>{[m.title, m.firstName, m.lastName].filter(Boolean).join(' ') || '-'}</td>
              <th>ชื่อเล่น</th><td>{m.nickname || '-'}</td></tr>
          <tr><th>เลขประจำตัวประชาชน</th><td className="mono">{m.citizenId || '-'}</td>
              <th>วันเกิด</th><td>{mfpDate(m.birthDate)}</td></tr>
          <tr><th>เพศ / สัญชาติ</th><td>{(m.gender || '-') + ' / ' + (m.nationality || '-')}</td>
              <th>สถานภาพสมรส</th><td>{m.maritalStatus || '-'}</td></tr>
          <tr><th>คู่สมรส</th><td>{m.spouse || '-'}</td>
              <th>คู่สมรสเป็นสมาชิก</th><td>{m.spouseInfo && m.spouseInfo.isMember ? ('ใช่ · ' + (m.spouseInfo.memberCode || '')) : 'ไม่ใช่'}</td></tr>
          <tr><th>ที่อยู่</th><td colSpan="3">{m.address || '-'}</td></tr>
          <tr><th>เลขที่พนักงาน</th><td className="mono">{m.employeeId || '-'}</td>
              <th>หน่วยงานที่ปฏิบัติงาน</th><td>{m.workDepartment || '-'}</td></tr>
          <tr><th>สถานะการทำงาน</th><td>{m.workStatus || '-'}</td>
              <th>วันที่เกษียณ</th><td>{mfpDate(m.retireDate)}</td></tr>
          <tr><th>วันที่เป็นสมาชิก</th><td>{mfpDate(m.joinDate)}</td>
              <th>ประเภทสมาชิก</th><td>{m.memberType || '-'}</td></tr>
          <tr><th>มติที่ประชุม</th><td>{m.resolution || '-'}</td>
              <th>ดอกเบี้ยสะสม</th><td className="num">{mfpMoney(m.accumulatedInterest)}</td></tr>
          {m.note ? <tr><th>หมายเหตุ</th><td colSpan="3">{m.note}</td></tr> : null}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="ผู้รับผลประโยชน์">
        <table className="lrqd-tbl"><thead><tr>
          <th>ลำดับ</th><th>ชื่อ - ชื่อสกุล</th><th>ความสัมพันธ์</th><th>เลขประจำตัวประชาชน</th><th className="num">สัดส่วน (%)</th>
        </tr></thead><tbody>
          {(data.beneficiaries || []).length === 0 ? mfpEmpty(5) : (data.beneficiaries || []).map((b, i) => (
            <tr key={i}><td className="num">{i + 1}</td>
              <td>{[b.title, b.firstName, b.lastName].filter(Boolean).join(' ')}</td>
              <td>{b.relation || '-'}</td><td className="mono">{b.citizenId || '-'}</td>
              <td className="num">{b.share != null ? b.share : '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ สถานะภาพ ── */}
      <LrqDocSection title="สถานะภาพสมาชิก (แท็บสถานะภาพ)">
        <table className="lrqd-tbl"><tbody>
          <tr><th>ประเภทการสมัคร</th><td>{mfpOpt(window.APPLICATION_TYPE_OPTIONS, st.applicationType)}</td>
              <th>สถานะการเรียกเก็บ</th><td>{mfpOpt(window.COLLECTION_STATUS_OPTIONS, st.collectionStatus)}</td></tr>
          <tr><th>เอกสารประกอบคำขอกู้</th><td colSpan="3">{mfpFlags(st.loanReqs, {
                providentFund: 'กองทุนสำรองเลี้ยงชีพ', assignmentDeed: 'หนังสือโอนสิทธิ',
                spouseConsent: 'หนังสือยินยอมคู่สมรส', lifeInsurance: 'ประกันชีวิต', beneficiary: 'ผู้รับผลประโยชน์' })}</td></tr>
          <tr><th>เงื่อนไขการกู้ / ค้ำประกัน</th><td colSpan="3">{mfpFlags(st.loanGuarantee, { noGuarantee: 'ห้ามค้ำประกัน', noLoan: 'ห้ามกู้' })}</td></tr>
          <tr><th>เงื่อนไขปันผล</th><td colSpan="3">{mfpFlags(st.dividend, { freezeDividend: 'อายัดปันผล', noDividend: 'ไม่จ่ายปันผล', noRebate: 'ไม่จ่ายเฉลี่ยคืน' })}</td></tr>
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ หักประจำเดือน ── */}
      <LrqDocSection title="รายการหักประจำเดือน (แท็บหักประจำเดือน)">
        <table className="lrqd-tbl"><thead><tr>
          <th>ลำดับ</th><th>รายละเอียด</th><th className="center">งวด</th>
          <th className="num">ต้นเงิน (บาท)</th><th className="num">ดอกเบี้ย (บาท)</th><th className="num">คงเหลือ (บาท)</th>
        </tr></thead><tbody>
          {(data.deductions || []).length === 0 ? mfpEmpty(6) : (data.deductions || []).map((r, i) => (
            <tr key={i}><td className="num">{r.no}</td><td>{r.detail}</td><td className="center mono">{r.term || '-'}</td>
              <td className="num">{mfpMoney(r.principal)}</td><td className="num">{mfpMoney(r.interest)}</td>
              <td className="num">{mfpMoney(r.remaining)}</td></tr>
          ))}
          <tr className="lrqd-foot"><td colSpan="3" className="right">โอนเงินกู้ฉุกเฉิน / ยอดหักสุทธิ</td>
            <td className="num" colSpan="2">{mfpMoney((data.deductionSummary || {}).emergencyTransfer)}</td>
            <td className="num">{mfpMoney((data.deductionSummary || {}).net)}</td></tr>
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ หุ้น ── */}
      <LrqDocSection title="รายละเอียดหุ้น (แท็บหุ้น)">
        <table className="lrqd-tbl"><thead><tr>
          <th>บัญชีหุ้น</th><th className="num">งวดหุ้น</th><th className="num">ทุนเรือนหุ้น (บาท)</th>
          <th className="num">หุ้นยกมาปีก่อน (บาท)</th><th className="num">ค่าหุ้น/เดือน (บาท)</th>
          <th>สถานะส่ง</th><th>วันที่หยุดส่ง</th><th>สถานะ</th>
        </tr></thead><tbody>
          {shares.length === 0 ? mfpEmpty(8) : shares.map((s, i) => (
            <tr key={i}><td>{s.name}</td><td className="num">{s.term || '-'}</td><td className="num">{mfpMoney(s.shareValue)}</td>
              <td className="num">{mfpMoney(s.bf)}</td><td className="num">{mfpMoney(s.perMonth)}</td>
              <td>{s.sendStatus || '-'}</td><td>{mfpDate(s.stopDate)}</td><td>{s.status || '-'}</td></tr>
          ))}
          {shares.length > 0 && <tr className="lrqd-foot"><td colSpan="2" className="right">รวมทุนเรือนหุ้น</td>
            <td className="num">{mfpMoney(totShare)}</td><td colSpan="5" /></tr>}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="การเปลี่ยนแปลงหุ้น">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่เปลี่ยน</th><th className="num">งวดหุ้น</th><th className="num">ทุนเรือนหุ้น (บาท)</th><th>ก่อนเปลี่ยนแปลง</th><th>หลังเปลี่ยนแปลง</th>
        </tr></thead><tbody>
          {(data.shareChanges || []).length === 0 ? mfpEmpty(5) : (data.shareChanges || []).map((r, i) => (
            <tr key={i}><td>{mfpDate(r.changeDate)}</td><td className="num">{r.term}</td>
              <td className="num">{mfpMoney(r.shareCapital)}</td><td>{r.before}</td><td>{r.after}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ เงินกู้ ── */}
      <LrqDocSection title="รายละเอียดสัญญาเงินกู้ที่มีในระบบ (แท็บเงินกู้)">
        <table className="lrqd-tbl"><thead><tr>
          <th>เลขที่สัญญา</th><th>ประเภท</th><th>วันที่สัญญา</th><th className="num">เงินกู้/วงเงิน</th><th className="num">อัตรา</th>
          <th className="num">ชำระ/งวด</th><th className="center">งวด</th><th className="num">เงินกู้คงเหลือ</th>
          <th>ชำระล่าสุด</th><th>เก็บล่าสุด</th><th className="num">ด.บ.ค้าง</th>
        </tr></thead><tbody>
          {loans.length === 0 ? mfpEmpty(11) : loans.map((c, i) => (
            <React.Fragment key={i}>
              <tr>
                <td className="mono">{c.contract}{c.typeName ? <div className="lrqd-md-guarname">{c.typeCode} {c.typeName}</div> : null}</td>
                <td>{c.payType || '-'}</td><td>{mfpDate(c.startDate)}</td><td className="num">{mfpMoney(c.amount)}</td>
                <td className="num">{c.rate ? c.rate.toFixed(2) + '%' : '-'}</td>
                <td className="num">{mfpMoney(c.installment)}</td>
                <td className="center mono">{c.lastTerm}/{c.totalTerms}</td>
                <td className="num">{mfpMoney(c.remaining)}</td>
                <td>{mfpDate(c.lastPaymentDate)}</td><td>{mfpDate(c.lastCollectDate)}</td>
                <td className="num">{mfpMoney(c.interestDue)}</td>
              </tr>
              {(c.guarantors || []).length > 0 && (
                <tr><td colSpan="11" className="lrqd-md-guarname">
                  - คนค้ำประกัน
                  {c.guarantors.map((g, gi) => <div key={gi}>{g}</div>)}
                </td></tr>
              )}
            </React.Fragment>
          ))}
          {loans.length > 0 && <tr className="lrqd-foot"><td colSpan="7" className="right">รวมเงินกู้คงเหลือ</td>
            <td className="num">{mfpMoney(totLoanRemain)}</td><td colSpan="3" /></tr>}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection flow title="รายละเอียดการรับชำระเงินกู้">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่ใบเสร็จ</th><th>วันที่รับชำระ</th><th>เลขที่สัญญา</th><th className="num">อัตรา</th><th>เลขที่เอกสาร</th><th>รายการ</th>
          <th className="num">เงินชำระ</th><th className="num">เป็นต้นเงิน</th><th className="num">เป็นดอกเบี้ย</th><th className="num">คงเหลือ (บาท)</th>
        </tr></thead><tbody>
          {(data.loanReceipts || []).length === 0 ? mfpEmpty(10) : (data.loanReceipts || []).map((r, i) => (
            <tr key={i}><td>{mfpDate(r.receiptDate)}</td><td>{mfpDate(r.payDate)}</td><td className="mono">{r.contract}</td>
              <td className="num">{r.rate != null ? r.rate.toFixed(2) : '-'}</td><td className="mono">{r.docNo}</td><td>{r.txnType}</td>
              <td className="num">{mfpMoney(r.paid)}</td><td className="num">{mfpMoney(r.principal)}</td>
              <td className="num">{mfpMoney(r.interest)}</td><td className="num">{mfpMoney(r.remaining)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ฉุกเฉิน ── */}
      <LrqDocSection title="เงินกู้ฉุกเฉิน (แท็บฉุกเฉิน)">
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">ปี</th><th>เลขที่สัญญา</th><th>เลขที่คำขอ</th><th>วันที่คำขอ</th>
          <th className="num">จำนวนเงิน (บาท)</th><th>เริ่มหักเดือน</th><th>วันที่ล่าสุด</th><th>ผู้ค้ำประกัน</th><th>สถานะ</th>
        </tr></thead><tbody>
          {(data.emergencyLoans || []).length === 0 ? mfpEmpty(9) : (data.emergencyLoans || []).map((r, i) => (
            <tr key={i}><td className="num">{r.year}</td><td className="mono">{r.contract}</td><td className="mono">{r.reqNo}</td>
              <td>{mfpDate(r.reqDate)}</td><td className="num">{mfpMoney(r.amount)}</td><td>{r.startMonth || '-'}</td>
              <td>{mfpDate(r.lastDate)}</td><td>{r.guarantor || '-'}</td><td>{r.status || '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ เรียกเก็บ ── */}
      <LrqDocSection flow title="รายการเรียกเก็บ (แท็บเรียกเก็บ)">
        <table className="lrqd-tbl"><thead><tr>
          <th>หน่วยงาน</th><th className="center">งวด</th><th>เลขที่ใบเสร็จ</th><th className="num">เรียกเก็บ (บาท)</th>
          <th className="num">ฉุกเฉิน (บาท)</th><th className="num">ตัวแทน (บาท)</th><th className="num">เก็บได้ (บาท)</th><th className="num">คืนเงิน (บาท)</th>
        </tr></thead><tbody>
          {(data.collections || []).length === 0 ? mfpEmpty(8) : (data.collections || []).map((r, i) => (
            <tr key={i}><td>{r.dept}</td><td className="center mono">{r.term}</td><td className="mono">{r.receipt || '-'}</td>
              <td className="num">{mfpMoney(r.amount)}</td><td className="num">{mfpMoney(r.emergency)}</td>
              <td className="num">{mfpMoney(r.agent)}</td><td className="num">{mfpMoney(r.collected)}</td>
              <td className="num">{mfpMoney(r.refund)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ เงินฝาก ── */}
      <LrqDocSection title="บัญชีเงินฝาก (แท็บเงินฝาก)">
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">ลำดับ</th><th>เลขที่บัญชี</th><th>ประเภทบัญชี</th><th>วันที่เปิดบัญชี</th>
          <th className="num">อัตราดอกเบี้ย</th><th className="num">ยอดคงเหลือ (บาท)</th><th className="num">ดอกเบี้ยปีนี้ (บาท)</th><th>สถานะ</th>
        </tr></thead><tbody>
          {(dep.accounts || []).length === 0 ? mfpEmpty(8) : (dep.accounts || []).map((a, i) => (
            <tr key={i}><td className="num">{a.no}</td><td className="mono">{a.accNo}</td><td>{a.type}</td>
              <td>{mfpDate(a.openDate)}</td><td className="num">{a.rate != null ? a.rate + '%' : '-'}</td>
              <td className="num">{mfpMoney(a.balance)}</td><td className="num">{mfpMoney(a.ytdInterest)}</td><td>{a.status}</td></tr>
          ))}
          {(dep.accounts || []).length > 0 && <tr className="lrqd-foot"><td colSpan="5" className="right">รวมเงินฝาก</td>
            <td className="num">{mfpMoney(totDepBal)}</td><td colSpan="2" /></tr>}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection flow title="รายการเคลื่อนไหวเงินฝาก">
        <table className="lrqd-tbl"><thead><tr>
          <th>วันที่</th><th>เลขที่บัญชี</th><th>รายการ</th><th>ช่องทาง</th>
          <th className="num">จำนวนเงิน (บาท)</th><th className="num">คงเหลือ (บาท)</th><th>อ้างอิง</th><th>ผู้ทำรายการ</th>
        </tr></thead><tbody>
          {(dep.transactions || []).length === 0 ? mfpEmpty(8) : (dep.transactions || []).map((r, i) => (
            <tr key={i}><td>{mfpDate(r.date)}</td><td className="mono">{r.accNo}</td><td>{r.type}</td><td>{r.channel}</td>
              <td className="num">{mfpMoney(r.amount)}</td><td className="num">{mfpMoney(r.balance)}</td>
              <td className="mono">{r.ref || '-'}</td><td>{r.by || '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ค้ำประกัน ── */}
      <LrqDocSection title="รายละเอียดการค้ำประกันเงินกู้ให้บุคคลอื่น (แท็บค้ำประกันให้ผู้อื่น)">
        <table className="lrqd-tbl"><thead><tr>
          <th>เลขที่สมาชิก</th><th>สังกัด</th><th>ชื่อ - ชื่อสกุลผู้กู้</th><th>เลขที่สัญญา</th><th>วันเริ่มสัญญา</th>
          <th className="num">เงินกู้ (บาท)</th><th className="num">วงเงินค้ำ (บาท)</th><th className="num">คงเหลือ (บาท)</th><th>สถานะ</th>
        </tr></thead><tbody>
          {(data.guaranteeGiven || []).length === 0 ? mfpEmpty(9) : (data.guaranteeGiven || []).map((r, i) => (
            <tr key={i}><td className="mono">{r.debtorCode || r.code || '-'}</td><td>{r.debtorDept || '-'}</td><td>{r.debtor}</td>
              <td className="mono">{r.contract}</td><td>{mfpDate(r.startDate)}</td>
              <td className="num">{mfpMoney(r.loanAmount)}</td><td className="num">{mfpMoney(r.maxAmount)}</td>
              <td className="num">{mfpMoney(r.remaining)}</td><td>{r.status || '-'}</td></tr>
          ))}
          {(data.guaranteeGiven || []).length > 0 && <tr className="lrqd-foot"><td colSpan="7" className="right">รวมหนี้คงเหลือที่ค้ำประกัน</td>
            <td className="num">{mfpMoney(totGuarRemain)}</td><td /></tr>}
        </tbody></table>
      </LrqDocSection>

      <LrqDocSection title="หลักประกันของสัญญาสมาชิก (แท็บผู้ค้ำ/หลักประกันที่ได้รับ)">
        <table className="lrqd-tbl"><thead><tr>
          <th>เลขที่สัญญา</th><th>เลขที่สมาชิก</th><th>รายละเอียดหลักประกัน</th>
          <th className="num">วงเงินค้ำ (บาท)</th><th className="num">คงเหลือ (บาท)</th><th className="num">สัดส่วน (%)</th><th>สถานะ</th>
        </tr></thead><tbody>
          {(data.guaranteeReceived || []).length === 0 ? mfpEmpty(7) : (data.guaranteeReceived || []).map((r, i) => (
            <tr key={i}><td className="mono">{r.contract}</td><td className="mono">{r.code || '-'}</td><td>{r.collateralDetail}</td>
              <td className="num">{mfpMoney(r.maxAmount)}</td><td className="num">{mfpMoney(r.remaining)}</td>
              <td className="num">{r.percent != null ? r.percent : '-'}</td><td>{r.status || '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ หลักทรัพย์ ── */}
      <LrqDocSection title="หลักทรัพย์ (แท็บหลักทรัพย์)">
        <table className="lrqd-tbl"><thead><tr>
          <th>รหัส</th><th>ชื่อหลักทรัพย์</th><th>ประเภท</th><th>ที่ตั้ง / รายละเอียด</th>
          <th className="num">ราคาประเมิน (บาท)</th><th className="num">คงเหลือหลังค้ำ (บาท)</th><th>เลขที่สัญญา</th>
        </tr></thead><tbody>
          {(data.securities || []).length === 0 ? mfpEmpty(7) : (data.securities || []).map((r, i) => (
            <tr key={i}><td className="mono">{r.code}</td><td>{r.name}</td><td>{r.type}</td><td>{r.address || '-'}</td>
              <td className="num">{mfpMoney(r.appraisal)}</td><td className="num">{mfpMoney(r.remainAfterGuarantee)}</td>
              <td className="mono">{r.contract || '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ประกัน ── */}
      <LrqDocSection title="กรมธรรม์ประกันของสมาชิก (แท็บประกัน)">
        <table className="lrqd-tbl"><thead><tr>
          <th>ประเภทประกัน</th><th>บริษัท</th><th>เลขกรมธรรม์</th><th>เลขที่สัญญาเงินกู้</th>
          <th className="num">ทุนประกัน (บาท)</th><th className="num">เบี้ยประกัน (บาท)</th><th>คุ้มครองตั้งแต่</th><th>ถึงวันที่</th><th>สถานะ</th>
        </tr></thead><tbody>
          {ins.length === 0 ? mfpEmpty(9) : ins.map((p, i) => (
            <tr key={i}><td>{p.insuranceType || '-'}</td><td>{p.company || '-'}</td>
              <td className="mono">{p.newPolicyNo || p.oldPolicyNo || '-'}</td><td className="mono">{p.loanContractNo || '-'}</td>
              <td className="num">{mfpMoney(p.coverage)}</td><td className="num">{mfpMoney(p.premium)}</td>
              <td>{mfpDate(p.startDate)}</td><td>{mfpDate(p.endDate)}</td><td>{mfpInsStatus(p)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ลูกหนี้ตัวแทน ── */}
      <LrqDocSection flow title={'ลูกหนี้ตัวแทน (แท็บลูกหนี้ตัวแทน) — ปี ' + (agent.year || '-') + (agent.yearTo ? ' ถึง ' + agent.yearTo : '')}>
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">ลำดับ</th><th>วันที่เอกสาร</th><th>วันที่รายการ</th><th>รหัส</th><th className="center">งวด</th>
          <th className="num">เพิ่ม (บาท)</th><th className="num">ลด (บาท)</th><th className="num">คงเหลือ (บาท)</th><th>ประเภทชำระ</th><th>ผู้บันทึก</th>
        </tr></thead><tbody>
          {(agent.rows || []).length === 0 ? mfpEmpty(10) : (agent.rows || []).map((r, i) => (
            <tr key={i}><td className="num">{r.seq}</td><td>{mfpDate(r.docDate)}</td><td>{mfpDate(r.txnDate)}</td>
              <td className="mono">{r.code}</td><td className="center mono">{r.period || '-'}</td>
              <td className="num">{mfpMoney(r.add)}</td><td className="num">{mfpMoney(r.reduce)}</td>
              <td className="num">{mfpMoney(r.balance)}</td><td>{r.payType || '-'}</td><td>{r.recordedBy || '-'}</td></tr>
          ))}
          <tr className="lrqd-foot"><td colSpan="7" className="right">ยอดคงค้างลูกหนี้ตัวแทน</td>
            <td className="num">{mfpMoney(agent.outstanding)}</td><td colSpan="2" /></tr>
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ปรับโครงสร้างหนี้ ── */}
      <LrqDocSection title="ประวัติการปรับโครงสร้างหนี้ (แท็บปรับโครงสร้างหนี้)">
        <table className="lrqd-tbl"><thead><tr>
          <th>เลขที่สัญญา</th><th className="center">ครั้งที่</th><th>เลขที่คำขอ</th><th>วันที่มีผล</th>
          <th>วิธีปรับโครงสร้าง</th><th>มติที่ประชุม</th><th className="num">ค่าปรับที่ยกเว้น (บาท)</th><th>สถานะ</th>
        </tr></thead><tbody>
          {restruct.length === 0 ? mfpEmpty(8) : restruct.map((r, i) => (
            <tr key={i}><td className="mono">{r.contract}</td><td className="center">{r.round}</td><td className="mono">{r.reqNo || '-'}</td>
              <td>{mfpDate(r.effectiveDate)}</td>
              <td>{(window.icrChangeType ? (window.icrChangeType(r.method) || {}).l : null) || r.configName || r.method || '-'}</td>
              <td>{r.meetingRef || '-'}</td><td className="num">{mfpMoney(r.penaltyWaived)}</td>
              <td>{(window.icrStatus ? (window.icrStatus(r.status) || {}).l : null) || r.status || '-'}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ หนังสือรับรองภาษี ── */}
      <LrqDocSection title="หนังสือรับรองการหักภาษี ณ ที่จ่าย (แท็บหนังสือรับรองภาษี)">
        <table className="lrqd-tbl"><thead><tr>
          <th className="num">ปีภาษี</th><th>เลขที่บัญชี</th><th>ประเภท</th><th className="num">ดอกเบี้ยที่จ่าย (บาท)</th>
          <th className="num">อัตราภาษี</th><th className="num">ภาษีหัก ณ ที่จ่าย (บาท)</th><th>วันที่จ่าย</th><th>เลขที่หนังสือ</th><th>สถานะ</th>
        </tr></thead><tbody>
          {taxRows.length === 0 ? mfpEmpty(9) : taxRows.map((r, i) => (
            <tr key={i}><td className="num">{r.taxYear}</td><td className="mono">{r.accNo}</td><td>{r.type}</td>
              <td className="num">{mfpMoney(r.interestPaid)}</td><td className="num">{r.taxRate != null ? r.taxRate + '%' : '-'}</td>
              <td className="num">{mfpMoney(r.taxWithheld)}</td><td>{mfpDate(r.payDate)}</td>
              <td className="mono">{r.certNo || '-'}</td><td>{mfpTaxStatus(r.status)}</td></tr>
          ))}
        </tbody></table>
      </LrqDocSection>

      {/* ── แท็บ ลายเซ็น ── */}
      <LrqDocSection title="ลายมือชื่อสมาชิก (แท็บลายเซ็น)">
        <table className="lrqd-tbl"><tbody><tr>
          <th style={{ width: 160 }}>ตัวอย่างลายมือชื่อ</th>
          <td>{m.signatureUrl
            ? <img src={m.signatureUrl} alt="ลายมือชื่อสมาชิก" style={{ height: 64 }} />
            : '- ไม่มีข้อมูลลายมือชื่อในระบบ -'}</td>
        </tr></tbody></table>
      </LrqDocSection>

      <div className="lrqd-legend">
        I = ประกัน, &nbsp;S = หยุดเก็บ, &nbsp;C = ดำเนินคดี, &nbsp;J = พิพากษา, &nbsp;R = รับโอน, &nbsp;P = ชำระพิเศษตัดเฉพาะต้น, &nbsp;W = รอสินไหมจากบริษัทประกัน<br />
        D = ผ่อนผันการกู้เงินเดือนต่ำกว่าเกณฑ์ /งวดเกินเกณฑ์, &nbsp;T = รับโอนจากผู้กู้ (ตาย ให้ออก ไล่ออก ปลดออก), &nbsp;E = ยื่นขอรับชำระหนี้ล้มละลาย<br />
        ป1 = ปรับโครงสร้างหนี้โครงการ 1, &nbsp;ป2 = ปรับโครงสร้างหนี้โครงการ 2, &nbsp;M = พักชำระต้นเงิน Covid-19
      </div>

      </td></tr></tbody></table>

      <div className="lrqd-sign-row">
        <div className="lrqd-sign"><div className="lrqd-sign-line" />ผู้จัดทำรายงาน</div>
        <div className="lrqd-sign"><div className="lrqd-sign-line" />หัวหน้าหน่วยผู้ตรวจสอบ</div>
      </div>
    </div>
  );
}

// ─── Overlay พรีวิว + พิมพ์ (รูปแบบเดียวกับพรีวิวใบคำขอกู้เงิน) ────────
function MemberFullPrintOverlay({ data, onClose }) {
  const clearPrintClass = () => document.documentElement.classList.remove('lrq-printing');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearPrintClass(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const mq = window.matchMedia && window.matchMedia('print');
    const onMq = (x) => { if (!x.matches) clearPrintClass(); };
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
        <span className="lrq-printview-title">พรีวิว — ใบรายละเอียดสมาชิก (ครบทุกแท็บ)</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          <MemberFullPrintSheet data={data} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TxHistoryModal, MemberFullPrintSheet, MemberFullPrintOverlay });
