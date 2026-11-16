// ════════════════════════════════════════════════════════════════════
//  แท็บ "ปรับโครงสร้างหนี้" — หน้าทะเบียนสมาชิก (กลุ่มข้อมูลการเงินและสัญญา)
//  แสดงสัญญาเงินกู้ที่เคยปรับโครงสร้าง · จำนวนครั้ง · รายละเอียดแต่ละครั้ง
//  + ตารางผ่อนชำระ (งวด) — ล้อกับเมนูปรับโครงสร้างหนี้/ใบคำขอเปลี่ยนแปลง
//  ยอดชำระหนี้ของจริง (DRC_METHODS · ICR_* · icrBuildSchedule)
// ════════════════════════════════════════════════════════════════════

// helper: หา label การจัดชั้นลูกหนี้จากค่า v
function rsClassLabel(v) {
  const c = (window.ICR_CLASS || []).find(x => x.v === v);
  return c ? { l: c.l, pill: c.pill } : { l: v || '—', pill: 'neutral' };
}

// helper: chip วิธีปรับโครงสร้าง (DRC)
function rsMethodChip(v) {
  const m = window.drcMethod ? window.drcMethod(v) : { l: v };
  return <span className="chip info">{m.l}</span>;
}

// ─── การ์ดต่อสัญญา — ส่วนหัว + รายการปรับโครงสร้างแต่ละครั้ง ──────────
function RestructContractCard({ group }) {
  const { loan, contractNo, rounds } = group;
  const [activeRound, setActiveRound] = React.useState(null);   // round object ที่เปิด popup
  const times = rounds.length;

  return (
    <div className="search-card rs-card">
      {/* ── หัวการ์ดสัญญา ── */}
      <div className="rs-card-head">
        <div className="rs-card-ico"><Icon name="refresh" size={18} /></div>
        <div className="rs-card-title">
          <div className="rs-card-no">
            <span className="mono">{contractNo}</span>
            <span className="chip">{loan.typeName}</span>
          </div>
          <div className="rs-card-sub muted">
            วงเงินกู้ {mfMoney(loan.amount, 2)} บาท · เริ่มสัญญา {fmt.date(loan.startDate)} · คงเหลือ {mfMoney(loan.remaining, 2)} บาท
          </div>
        </div>
        <div className="rs-card-meta">
          <span className="chip info rs-count"><Icon name="history" size={12} /> ปรับโครงสร้าง {times} ครั้ง</span>
          {mfPill(loan.contractStatus)}
        </div>
      </div>

      {/* ── ไทม์ไลน์รายการปรับโครงสร้าง (เก่า→ใหม่) ── */}
      <div className="rs-rounds">
        {rounds.map(r => {
          const cat = window.icrNoteCat ? window.icrNoteCat(r.noteCategory) : null;
          const st = window.icrReqStatus ? window.icrReqStatus(r.status) : { l: r.status, pill: 'neutral' };
          return (
            <div key={r.round} className="rs-round">
              <button className="rs-round-row" onClick={() => setActiveRound(r)}>
                <span className="rs-round-badge">ครั้งที่ {r.round}</span>
                <span className="rs-round-date">
                  <span className="rs-round-date-lbl muted">มีผล</span>
                  <span className="mono">{fmt.date(r.effectiveDate)}</span>
                </span>
                {rsMethodChip(r.method)}
                {cat && <span className={"pill " + (cat.pill === 'info' ? 'info' : cat.pill)}>{cat.l}</span>}
                <span className="rs-round-delta muted">
                  {r.before.perInstallment.toLocaleString()} → <b>{r.after.perInstallment.toLocaleString()}</b> บาท/งวด
                  <span className="rs-sep">·</span>
                  {r.before.terms} → <b>{r.after.terms}</b> งวด
                </span>
                <span className="rs-round-spacer" />
                <span className={"pill " + st.pill}>{st.l}</span>
                <span className="rs-round-view"><Icon name="eye" size={13} /> ดูรายละเอียด</span>
              </button>
            </div>
          );
        })}
      </div>

      {activeRound && (
        <RestructRoundModal round={activeRound} loan={loan} contractNo={contractNo}
                            onClose={() => setActiveRound(null)} />
      )}
    </div>
  );
}

// ─── Popup รายการปรับโครงสร้างหนี้ (1 ครั้ง) ─────────────────────────
function RestructRoundModal({ round: r, loan, contractNo, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const cat = window.icrNoteCat ? window.icrNoteCat(r.noteCategory) : null;
  const st = window.icrReqStatus ? window.icrReqStatus(r.status) : { l: r.status, pill: 'neutral' };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card rs-modal" role="dialog" aria-modal="true">
        <div className="modal-head rs-modal-head">
          <div className="rs-modal-title">
            <span className="rs-round-badge">ครั้งที่ {r.round}</span>
            <div>
              <h2>รายการปรับโครงสร้างหนี้</h2>
              <div className="rs-modal-sub muted">
                <span className="mono">{contractNo}</span> · {loan.typeName} · มีผล {fmt.date(r.effectiveDate)}
              </div>
            </div>
          </div>
          <div className="rs-modal-tags">
            {rsMethodChip(r.method)}
            {cat && <span className={"pill " + (cat.pill === 'info' ? 'info' : cat.pill)}>{cat.l}</span>}
            <span className={"pill " + st.pill}>{st.l}</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body rs-modal-body">
          <RestructRoundDetail round={r} loan={loan} />
        </div>
      </div>
    </>
  );
}

// ─── รายละเอียดการปรับโครงสร้าง 1 ครั้ง (กางออก) ─────────────────────
function RestructRoundDetail({ round: r, loan }) {
  const clsB = rsClassLabel(r.classBefore);
  const clsA = rsClassLabel(r.classAfter);
  const payM = window.icrPayMethod ? window.icrPayMethod(r.payMethod) : { l: r.payMethod };

  // ── ตารางผ่อนชำระ (คำนวณด้วยฟังก์ชันจริงของระบบ) ──
  const schedule = React.useMemo(() => {
    if (!window.icrBuildSchedule) return null;
    return window.icrBuildSchedule({
      outstanding: r.after.outstanding,
      rate: r.after.rate,
      terms: r.after.terms,
      perInstallment: r.after.perInstallment,
      graceTerms: r.after.graceTerms || 0,
      graceInstallment: r.after.graceInstallment || 0,
      startDate: r.effectiveDate,
      role: (r.sched && r.sched.role) || 'borrower',
    });
  }, [r]);

  const totPrincipal = schedule ? schedule.rows.reduce((a, x) => a + x.principal, 0) : 0;
  const totInterest = schedule ? schedule.rows.reduce((a, x) => a + x.interest, 0) : 0;
  const totPay = schedule ? schedule.rows.reduce((a, x) => a + x.pay, 0) : 0;

  return (
    <div className="rs-detail">
      {/* คำขอ / มติ */}
      <div className="rs-kv-grid">
        <RSKV k="เลขที่ใบคำขอเปลี่ยนแปลง" mono>{r.docNo}</RSKV>
        <RSKV k="เลขที่คำขอ (ทะเบียน)" mono>{r.reqNo}</RSKV>
        <RSKV k="มติที่ประชุม">{r.meetingRef}{r.resolutionDate ? ` · ${fmt.date(r.resolutionDate)}` : ''}</RSKV>
        <RSKV k="รูปแบบที่ใช้">{r.configName}{r.configCode ? ` (${r.configCode})` : ''}</RSKV>
        <RSKV k="รูปแบบการชำระ">{payM.l}</RSKV>
        <RSKV k="วันที่บันทึก / มีผล">{fmt.date(r.recordDate)} → {fmt.date(r.effectiveDate)}</RSKV>
        <RSKV k="ผู้บันทึกรายการ">{r.by}</RSKV>
      </div>

      {/* เปรียบเทียบก่อน → หลังปรับ */}
      <div className="rs-cmp">
        <div className="rs-cmp-head"><span className="head-bar" /><h4>เงื่อนไขก่อน → หลังปรับโครงสร้าง</h4></div>
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="tbl rs-cmp-tbl" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>รายการ</th>
                  <th className="num">ก่อนปรับ</th>
                  <th className="center rs-arrow-col" />
                  <th className="num">หลังปรับ</th>
                </tr>
              </thead>
              <tbody>
                <RSCmpRow label="อัตราดอกเบี้ย (ต่อปี)"
                          before={r.before.rate.toFixed(2) + '%'} after={r.after.rate.toFixed(2) + '%'}
                          improved={r.after.rate < r.before.rate} />
                <RSCmpRow label="จำนวนงวดผ่อน"
                          before={r.before.terms + ' งวด'} after={r.after.terms + ' งวด'} />
                <RSCmpRow label="ยอดผ่อนชำระต่องวด"
                          before={mfMoney(r.before.perInstallment, 2)} after={mfMoney(r.after.perInstallment, 2)}
                          improved={r.after.perInstallment < r.before.perInstallment} />
                <RSCmpRow label="เงินต้นคงเหลือ ณ วันปรับ"
                          before={mfMoney(r.before.outstanding, 2)} after={mfMoney(r.after.outstanding, 2)} />
                <tr>
                  <td>การจัดชั้นลูกหนี้</td>
                  <td className="num"><span className={"pill " + clsB.pill}>{clsB.l}</span></td>
                  <td className="center rs-arrow-col"><Icon name="chevRight" size={13} /></td>
                  <td className="num"><span className={"pill " + clsA.pill}>{clsA.l}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/* เงื่อนไขเสริม */}
        <div className="rs-flags">
          {r.before.overdueTerms ? <span className="chip warning">ค้างชำระก่อนปรับ {r.before.overdueTerms} งวด</span> : null}
          {r.penaltyWaived ? <span className="chip">ลดค่าปรับ {mfMoney(r.penaltyWaived, 2)} บาท</span> : null}
          {r.after.graceTerms ? <span className="chip info">ปลอดเงินต้น {r.after.graceTerms} งวดแรก</span> : null}
          {r.capitalizeInterest ? <span className="chip">รวมดอกเบี้ยค้างเป็นเงินต้น</span> : null}
          <span className="chip">{r.guarantorConsent ? 'ผู้ค้ำยินยอม' : 'ไม่ต้องขอความยินยอมผู้ค้ำ'}</span>
        </div>
        {r.note && (
          <div className="rs-note"><Icon name="info" size={13} /><span>{r.note}</span></div>
        )}
      </div>

      {/* ตารางผ่อนชำระหลังปรับ */}
      {schedule && (
        <div className="rs-cmp">
          <div className="rs-cmp-head">
            <span className="head-bar" /><h4>ตารางผ่อนชำระหลังปรับโครงสร้าง</h4>
            <span className="muted rs-sched-note">{schedule.rows.length} งวด · เริ่ม {fmt.date(r.effectiveDate)}{schedule.capped ? ' · จำกัด 60 งวด (ผู้ค้ำ)' : ''}</span>
          </div>
          <div className="table-wrap">
            <div className="table-scroll rs-sched-scroll">
              <table className="tbl" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 56 }}>งวดที่</th>
                    <th style={{ width: 120 }}>วันครบกำหนด</th>
                    <th className="num">ยอดชำระ</th>
                    <th className="num">เงินต้น</th>
                    <th className="num">ดอกเบี้ย</th>
                    <th className="num">คงเหลือ</th>
                    <th className="center" style={{ width: 96 }}>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.rows.map(row => (
                    <tr key={row.term} className={row.collectFull ? 'rs-row-final' : (row.grace ? 'rs-row-grace' : '')}>
                      <td className="center mono">{row.term}</td>
                      <td className="mono">{fmt.date(row.due)}</td>
                      <td className="num mono" style={{ fontWeight: 500 }}>{mfMoney(row.pay, 2)}</td>
                      <td className="num mono">{mfMoney(row.principal, 2)}</td>
                      <td className="num mono">{mfMoney(row.interest, 2)}</td>
                      <td className="num mono">{mfMoney(row.balance, 2)}</td>
                      <td className="center">
                        {row.collectFull ? <span className="chip success">งวดปิดบัญชี</span>
                          : row.grace ? <span className="chip info">ปลอดเงินต้น</span>
                          : <span className="muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>รวม {schedule.rows.length} งวด</td>
                    <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(totPay, 2)}</td>
                    <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(totPrincipal, 2)}</td>
                    <td className="num mono" style={{ fontWeight: 700 }}>{mfMoney(totInterest, 2)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// key-value ในกล่องรายละเอียด
function RSKV({ k, children, mono }) {
  return (
    <div className="rs-kv">
      <span className="rs-kv-k">{k}</span>
      <span className={"rs-kv-v" + (mono ? " mono" : "")}>{children}</span>
    </div>
  );
}

// แถวเปรียบเทียบ before → after
function RSCmpRow({ label, before, after, improved }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="num mono muted">{before}</td>
      <td className="center rs-arrow-col"><Icon name="chevRight" size={13} /></td>
      <td className={"num mono" + (improved ? " rs-improved" : "")} style={{ fontWeight: 500 }}>{after}</td>
    </tr>
  );
}

// ─── แท็บหลัก ────────────────────────────────────────────────────────
function RestructTab({ data }) {
  const loans = data.loans || [];
  const groups = React.useMemo(() => (window.mrsForMember ? window.mrsForMember(loans) : []), [loans]);

  if (!groups.length) {
    return <MFEmpty>สมาชิกรายนี้ยังไม่มีประวัติการปรับโครงสร้างหนี้</MFEmpty>;
  }

  const totalTimes = groups.reduce((a, g) => a + g.rounds.length, 0);

  return (
    <div>
      {groups.map(g => <RestructContractCard key={g.contractNo} group={g} />)}

      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">ข้อมูลอ้างอิงจากเมนู “ปรับโครงสร้างหนี้ / ใบคำขอเปลี่ยนแปลงยอดชำระหนี้” — คลิกแต่ละครั้งเพื่อดูรายละเอียดคำขอ เงื่อนไขก่อน–หลังปรับ และตารางผ่อนชำระ</span>
      </div>
    </div>
  );
}

Object.assign(window, { RestructTab });
