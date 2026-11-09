// ════════════════════════════════════════════════════════════════════
//  ประมวลผลคัดเลือกผู้รับทุนการศึกษา — ScholarshipSelectionPage (TOR 8.1)
//  ระบบงานสวัสดิการสมาชิก › การทำงาน
//  คำนวณค่าสัมประสิทธิ์ · แปลงร้อยละเป็นเกรด · ตรวจซ้ำซ้อน ·
//  สุ่มคัดเลือก (Random) ตามจำนวนทุน · ตัดสิทธิเกรดไม่ผ่าน · Export รายชื่อ
// ════════════════════════════════════════════════════════════════════

const SSEL_USER = 'จันทร์เพ็ญ มาลี';

// แปลงร้อยละ → เกรด (สเกล 4.00)
function ssPercentToGrade(pct) {
  if (pct >= 80) return 4.0; if (pct >= 75) return 3.5; if (pct >= 70) return 3.0;
  if (pct >= 65) return 2.5; if (pct >= 60) return 2.0; if (pct >= 55) return 1.5;
  if (pct >= 50) return 1.0; return 0;
}
// ค่าสัมประสิทธิ์ถ่วงน้ำหนัก = เกรด/4 (ใช้จัดลำดับ/ถ่วงโอกาสสุ่ม)
function ssCoefficient(grade) { return Math.round((grade / 4) * 100) / 100; }

function ssLoadReqs() {
  if (window.schReqLoadStore) return window.schReqLoadStore();
  try { const s = localStorage.getItem('scholarship_requests'); if (s) return JSON.parse(s); } catch (e) {}
  return (window.SCHREQ_SEED || []).map(r => ({ ...r }));
}

function ScholarshipSelectionPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [year, setYear] = useState('2569');
  const [minGrade, setMinGrade] = useState(2.0);
  const reqs = useMemo(ssLoadReqs, []);
  const [result, setResult] = useState(null);   // null until processed
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState(false);     // บันทึกผล & ส่งเมนูอนุมัติแล้วหรือยัง

  // ─── สร้างชุดข้อมูลผู้สมัครพร้อมคำนวณเกรด/สัมประสิทธิ์/ตรวจซ้ำ ───────
  const applicants = useMemo(() => {
    const inYear = reqs.filter(r => String(r.schoolYear) === String(year)
      && r.status !== 'approved' && r.status !== 'paid' && r.status !== 'selected');   // เฉพาะรายที่ยังไม่ตัดสิน (รอคัดเลือก/ส่งกลับ)
    // นับการยื่นซ้ำของสมาชิก (จำกัดปีละครั้ง)
    const byMember = {};
    inYear.forEach(r => { byMember[r.memberCode] = (byMember[r.memberCode] || 0) + 1; });
    const childSeen = {};
    return inYear.map(r => {
      const pct = Number(r.percent) || 0;
      const gpa = Number(r.gpa) || 0;
      const grade = pct > 0 ? ssPercentToGrade(pct) : gpa;
      const m = window.schReqMember ? window.schReqMember(r.memberCode) : null;
      const salary = m ? Number(m.salary) || 0 : 0;
      const studying = Number(r.childrenStudying) || 1;
      // ค่าสัมประสิทธิ์ = (เงินเดือน ÷ เกรด) ÷ จำนวนบุตรที่กำลังศึกษา — น้อย = ได้รับก่อน
      const coef = (salary > 0 && grade > 0 && studying > 0) ? (salary / grade) / studying : (Number(r.coefficient) || ssCoefficient(grade));
      // เกณฑ์ขั้นต่ำจากหลักเกณฑ์จำนวนทุนการศึกษา (ถ้าไม่กำหนด ใช้ค่าตั้งต้น)
      const crit = window.schReqCriteria ? window.schReqCriteria(year, r.scholarType, r.eduLevel) : { minGpa: 0 };
      const minReq = crit.minGpa || minGrade;
      const childKey = (r.childCitizenId || `${r.memberCode}-${r.childFirst}${r.childLast}`).trim();
      const dupChild = childSeen[childKey] ? true : (childSeen[childKey] = false, false);
      childSeen[childKey] = true;
      const dupMember = byMember[r.memberCode] > 1;
      const passed = grade >= minReq;
      return { ...r, _grade: grade, _coef: coef, _pct: pct, _passed: passed, _minReq: minReq, _dupMember: dupMember, _dupChild: dupChild, _childKey: childKey };
    });
  }, [reqs, year, minGrade]);

  // ─── ประมวลผลการคัดเลือกตามค่าสัมประสิทธิ์ ────────────────────────────────
  const runDraw = () => {
    setRunning(true);
    setTimeout(() => {
      const quotaCfg = (window.SCH_SEED || []).filter(q => String(q.year) === String(year));
      const quotaOf = (type, level) => { const q = quotaCfg.find(x => x.scholarType === type && x.eduLevel === level); return q ? q.quota : 0; };
      // จัดกลุ่มตามประเภท+ระดับชั้น
      const groups = {};
      applicants.forEach(a => { const k = a.scholarType + '|' + a.eduLevel; (groups[k] = groups[k] || []).push(a); });
      const decided = [];
      // ตัดสิทธิรายที่ไม่ผ่าน/ซ้ำซ้อนก่อน แล้วสุ่มในกลุ่มที่เหลือ
      Object.entries(groups).forEach(([k, arr]) => {
        const [type, level] = k.split('|');
        const quota = quotaOf(type, level);
        const eligible = arr.filter(a => a._passed && !a._dupMember && !a._dupChild);
        const ineligible = arr.filter(a => !(a._passed && !a._dupMember && !a._dupChild));
        // เรียงตามค่าสัมประสิทธิ์ น้อย → มาก (เสมอกันใช้เกรดสูงกว่าตัดสิน)
        const ranked = [...eligible].sort((x, y) => x._coef - y._coef || y._grade - x._grade);
        ranked.forEach((a, i) => decided.push({ ...a, _outcome: i < quota ? 'won' : 'waitlist', _rank: i + 1, _quota: quota }));
        ineligible.forEach(a => decided.push({ ...a, _outcome: 'rejected', _quota: quota,
          _reason: !a._passed ? `เกรดไม่ถึงเกณฑ์ (${a._grade.toFixed(2)} < ${(a._minReq || minGrade).toFixed(2)})` : a._dupMember ? 'ยื่นซ้ำ — เกินสิทธิ์ปีละครั้ง' : 'บุตรซ้ำซ้อนในระบบ' }));
      });
      const won = decided.filter(d => d._outcome === 'won');
      const budget = won.reduce((s, d) => s + (Number(d.amount) || 0), 0);
      // ยังไม่บันทึกสถานะ — รอเจ้าหน้าที่ตรวจสอบผลแล้วกด "บันทึกผลการคัดเลือก"
      setResult({ decided, won: won.length, waitlist: decided.filter(d => d._outcome === 'waitlist').length, rejected: decided.filter(d => d._outcome === 'rejected').length, budget, ts: new Date() });
      setSaved(false);
      setRunning(false);
      audit.log({ action: 'status', module: 'สวัสดิการ — คัดเลือกผู้รับทุนการศึกษา', target: `ประจำปี ${year}`,
        summary: `ประมวลผลการคัดเลือกผู้รับทุน ประจำปี ${year} — ได้รับทุน ${won.length} ราย · งบประมาณ ${fmt.money(budget, 0)} บาท (รอเจ้าหน้าที่บันทึก)`,
        changes: [{ field: 'ผู้สมัคร', before: '—', after: applicants.length + ' ราย' }, { field: 'ได้รับทุน', before: '—', after: won.length + ' ราย' }, { field: 'งบประมาณ', before: '—', after: fmt.money(budget, 2) + ' บาท' }] });
      onToast && onToast(`ประมวลผลการคัดเลือกเสร็จ — ได้รับทุน ${won.length} ราย · ตรวจสอบผลแล้วกด “บันทึกผลการคัดเลือก” เพื่อส่งอนุมัติ`);
    }, 500);
  };

  // ─── บันทึกผลการคัดเลือก → ส่งผู้ได้รับทุนไปเมนูอนุมัติ (status 'selected') ───
  const saveResult = () => {
    if (!result || saved) return;
    const wonIds = new Set(result.decided.filter(d => d._outcome === 'won').map(d => d.id));
    try {
      const store = ssLoadReqs().map(r => wonIds.has(r.id)
        ? { ...r, status: 'selected', returnedForReselect: false, rejectReason: '' } : r);
      localStorage.setItem('scholarship_requests', JSON.stringify(store));
    } catch (e) {}
    setSaved(true);
    audit.log({ action: 'update', module: 'สวัสดิการ — คัดเลือกผู้รับทุนการศึกษา', target: `ประจำปี ${year}`,
      summary: `บันทึกผลการคัดเลือกผู้รับทุน ประจำปี ${year} — ส่งผู้ได้รับทุน ${wonIds.size} ราย · งบประมาณ ${fmt.money(result.budget, 0)} บาท ไปเมนูอนุมัติคำขอทุนการศึกษา`,
      changes: [{ field: 'ผู้ได้รับทุน (ส่งอนุมัติ)', before: 'รอบันทึก', after: wonIds.size + ' ราย' }] });
    onToast && onToast(`บันทึกผลการคัดเลือกแล้ว — ส่งผู้ได้รับทุน ${wonIds.size} ราย ไปเมนู “อนุมัติคำขอทุนการศึกษา”`);
  };

  const exportList = () => {
    audit.log({ action: 'export', module: 'สวัสดิการ — คัดเลือกผู้รับทุนการศึกษา', target: `ประจำปี ${year}`,
      summary: `ส่งออกรายชื่อผู้ได้รับทุน ประจำปี ${year} (${result ? result.won : 0} ราย) เป็นไฟล์ Excel` });
    onToast && onToast('ส่งออกรายชื่อผู้ได้รับทุนเป็นไฟล์ Excel เรียบร้อยแล้ว');
  };

  const passCnt = applicants.filter(a => a._passed && !a._dupMember && !a._dupChild).length;
  const dupCnt = applicants.filter(a => a._dupMember || a._dupChild).length;

  const outcomePill = (o) => o === 'won' ? 'ok' : o === 'waitlist' ? 'warn' : 'bad';
  const outcomeLabel = (o) => o === 'won' ? 'ได้รับทุน' : o === 'waitlist' ? 'สำรอง' : 'ตัดสิทธิ';

  return (
    <div data-screen-label="หน้าประมวลผลคัดเลือกผู้รับทุนการศึกษา">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ประมวลผลคัดเลือกผู้รับทุนการศึกษา</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            แปลงร้อยละเป็นเกรด · คำนวณค่าสัมประสิทธิ์ · ตรวจรายชื่อซ้ำซ้อน · คัดเลือกตามค่าสัมประสิทธิ์ (น้อย→มาก) ตามจำนวนทุน
          </div>
        </div>
        <span className="spacer" />
        {result && <button className="btn sm" onClick={exportList}><Icon name="download" /> Export รายชื่อผู้ได้รับทุน</button>}
        {result && (saved
          ? <span className="chip success"><Icon name="check" size={11} /> บันทึกผล & ส่งอนุมัติแล้ว</span>
          : <button className="btn primary sm" onClick={saveResult}><Icon name="check" /> บันทึกผลการคัดเลือก</button>)}
        <button className="btn sm" onClick={runDraw} disabled={running || applicants.length === 0}>
          <Icon name="refresh" /> {running ? 'กำลังประมวลผล…' : (result ? 'ประมวลผลใหม่' : 'ประมวลผลการคัดเลือก')}
        </button>
      </div>

      {/* เงื่อนไขการประมวลผล */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="lt-modal-label">ปีการศึกษา (พ.ศ.)</label>
            <input className="cfg-input mono" type="number" value={year} style={{ width: 130, textAlign: 'center' }} onChange={(e) => { setYear(e.target.value); setResult(null); setSaved(false); }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label className="lt-modal-label">เกณฑ์เกรดขั้นต่ำเริ่มต้น (GPA)</label>
            <input className="cfg-input mono" type="number" step="0.25" min="0" max="4" value={minGrade} style={{ width: 130, textAlign: 'center' }} onChange={(e) => { setMinGrade(Number(e.target.value) || 0); setResult(null); setSaved(false); }} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
              <Icon name="info" size={11} /> เกณฑ์แปลงร้อยละ→เกรด: ≥80% = 4.0 · ≥70% = 3.0 · ≥60% = 2.0 · ≥50% = 1.0<br />
              ผู้สมัครที่เกรดไม่ผ่าน หรือยื่นซ้ำ (เกินสิทธิ์ปีละครั้ง) / บุตรซ้ำซ้อน จะถูกตัดสิทธิก่อนคัดเลือก · เกณฑ์เกรดขั้นต่ำอ้างอิงตามเมนูกำหนดจำนวนทุน
            </div>
          </div>
        </div>
      </div>

      {/* KPI */}

      {/* ผลการคัดเลือก */}

      {/* ผลการคัดเลือก */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sh-grid-head"><div>
          <div className="sh-grid-title">{result ? 'ผลการคัดเลือกผู้รับทุน' : 'รายชื่อผู้สมัครและการตรวจสอบ'} <span className="muted" style={{ fontWeight: 400 }}>· {applicants.length} ราย</span></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{result ? `ประมวลผลเมื่อ ${result.ts.toLocaleString('th-TH')} — ได้รับทุน ${result.won} · สำรอง ${result.waitlist} · ตัดสิทธิ ${result.rejected}${saved ? ' · บันทึกและส่งอนุมัติแล้ว' : ' · รอกดบันทึกเพื่อส่งอนุมัติ'}` : 'กดปุ่ม “ประมวลผลการคัดเลือก” เพื่อจัดสรรทุนตามจำนวนที่กำหนด'}</div>
        </div></div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>สมาชิก / บุตรผู้รับทุน</th><th>ประเภท · ระดับชั้น</th>
              <th className="center">ร้อยละ</th><th className="center">เกรด</th><th className="center">สัมประสิทธิ์</th>
              <th className="center">ตรวจสอบ</th><th className="center">ผลคัดเลือก</th>
            </tr></thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบใบคำขอทุนสำหรับปี {year}</td></tr>
              ) : (result ? result.decided : applicants).map((a, i) => {
                const flagged = a._dupMember || a._dupChild || !a._passed;
                return (
                  <tr key={a.id || i}>
                    <td>
                      <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{a.childTitle}{a.childFirst} {a.childLast}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{a.memberCode} · {a.memberName}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{window.schLabel('scholarType', a.scholarType)}<div className="muted" style={{ fontSize: 11 }}>{window.schLabel('eduLevel', a.eduLevel)}</div></td>
                    <td className="center mono">{a._pct > 0 ? a._pct.toFixed(0) + '%' : '—'}</td>
                    <td className="center mono"><b style={{ color: a._passed ? 'var(--text)' : 'var(--danger)' }}>{a._grade.toFixed(2)}</b></td>
                    <td className="center mono">{a._coef.toFixed(2)}</td>
                    <td className="center">
                      {a.returnedForReselect ? <span className="chip warning" title={a.rejectReason || 'ส่งกลับให้คัดเลือกใหม่'}>ส่งกลับคัดเลือก</span>
                        : a._dupMember ? <span className="chip danger">ยื่นซ้ำ</span>
                        : a._dupChild ? <span className="chip danger">บุตรซ้ำ</span>
                        : !a._passed ? <span className="chip warning">เกรดไม่ผ่าน</span>
                        : <span className="chip success">ผ่าน</span>}
                    </td>
                    <td className="center">
                      {result ? <span className={"pill " + outcomePill(a._outcome)} title={a._reason || ''}>{outcomeLabel(a._outcome)}{a._outcome === 'waitlist' && a._rank ? ` #${a._rank}` : ''}</span>
                              : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> คัดเลือกโดยเรียงค่าสัมประสิทธิ์จากน้อยไปมากตามจำนวนทุน — ผู้ผ่านเกณฑ์เกินจำนวนทุนจัดเป็นรายชื่อสำรองตามลำดับ · หลังประมวลผล เจ้าหน้าที่ต้องกด “บันทึกผลการคัดเลือก” ก่อน ระบบจึงจะส่งผู้ได้รับทุนไปเมนู “อนุมัติคำขอทุนการศึกษา” · รายการที่ถูก “ไม่อนุมัติ” จะถูกส่งกลับมาคัดเลือกใหม่ที่นี่
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScholarshipSelectionPage });
