// ════════════════════════════════════════════════════════════════════
//  ขอสินไหมกรณีสมาชิกเสียชีวิต — DeceasedClaimPage
//  ระบบงานสวัสดิการสมาชิก › การทำงาน
//  list = ทะเบียนคำขอ · form = สร้างคำขอ · detail = รายละเอียด (อ่านอย่างเดียว)
// ════════════════════════════════════════════════════════════════════

const DXC_USER = 'จันทร์เพ็ญ มาลี';
const dxcToday = () => new Date().toISOString().slice(0, 10);
const dxcYear = () => new Date().getFullYear() + 543;

function dxcLoad() {
  try { const s = localStorage.getItem('deceased_claims'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DXC_SEED.map(r => ({ ...r, beneficiaries: (r.beneficiaries || []).map(b => ({ ...b })) }));
}
function dxcSaveLS(list) { try { localStorage.setItem('deceased_claims', JSON.stringify(list)); } catch (e) {} }

// ─── ฟิลด์ย่อยของฟอร์ม ─────────────────────────────────────────────────
function DxField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}
function DxRow({ label, value, mono, strong }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={"value" + (mono ? ' mono' : '')} style={strong ? { fontWeight: 700 } : null}>{value ?? '—'}</span>
    </div>
  );
}
const dxcCid13 = (s) => String(s || '').replace(/\D/g, '').length === 13;

let _dxcBenSeq = 0;
const dxcBenKey = () => 'b' + (++_dxcBenSeq) + '-' + Date.now().toString().slice(-4);
function dxcBlankBen(ov) {
  return { key: dxcBenKey(), name: '', relation: 'บุตร', citizenId: '', pct: '',
           payMethod: 'transfer', bank: 'ktb', accountNo: '', docStatus: 'partial', ...ov };
}

// ════════════════════════════════════════════════════════════════════
//  ป็อปอัป — รายละเอียดหุ้น / หนี้ / ภาระผูกพัน
// ════════════════════════════════════════════════════════════════════
function DxcContractsModal({ member, onClose }) {
  const contracts = window.dxcContracts(member);
  const shares = Number(member.shares || 0);
  const totalPrincipal = contracts.reduce((s, c) => s + c.principal, 0);
  const totalInterest = contracts.reduce((s, c) => s + c.interest, 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 640, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="wallet" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>รายละเอียดหุ้น–หนี้ และภาระผูกพัน</h2>
            <div className="muted" style={{ fontSize: 11.5 }}>
              {member.name} <span className="mono">({member.code})</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '62vh', overflowY: 'auto' }}>
          <div className="dxc-share-strip">
            <div><span className="k">ทุนเรือนหุ้นคงเหลือ</span><span className="v mono">฿ {fmt.money(shares, 0)}</span></div>
            <div><span className="k">จำนวนสัญญาเงินกู้</span><span className="v mono">{contracts.length} สัญญา</span></div>
            <div><span className="k">หนี้คงค้างรวม</span><span className="v mono" style={{ color: 'var(--danger)' }}>฿ {fmt.money(totalPrincipal + totalInterest, 0)}</span></div>
          </div>
          <div className="section-head" style={{ margin: '4px 0 10px' }}><span className="head-bar" /><h3 style={{ fontSize: 13 }}>สัญญาเงินกู้คงเหลือ</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>เลขที่สัญญา</th><th>ประเภท</th><th className="num">เงินต้นคงเหลือ</th><th className="num">ดอกเบี้ยค้าง</th></tr></thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state" style={{ padding: '20px 12px' }}>ไม่มีสัญญาเงินกู้คงค้าง</td></tr>
                ) : contracts.map(c => (
                  <tr key={c.no}>
                    <td className="mono">{c.no}</td>
                    <td>{c.type}</td>
                    <td className="num mono">{fmt.money(c.principal, 0)}</td>
                    <td className="num mono">{fmt.money(c.interest, 0)}</td>
                  </tr>
                ))}
              </tbody>
              {contracts.length > 0 && (
                <tfoot><tr className="sh-grid-total">
                  <td colSpan="2" className="right"><b>รวม</b></td>
                  <td className="num mono"><b>{fmt.money(totalPrincipal, 0)}</b></td>
                  <td className="num mono"><b>{fmt.money(totalInterest, 0)}</b></td>
                </tr></tfoot>
              )}
            </table>
          </div></div>
          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
            <Icon name="info" size={11} /> ยอดหนี้ดึงจากระบบทะเบียนและติดตามหนี้ · ใช้คำนวณยอดหักกลบหนี้ก่อนจ่ายสินไหม
          </p>
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <span className="spacer" />
          <button className="btn primary sm" onClick={onClose}><Icon name="check" /> ปิด</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มสร้างคำขอ
// ════════════════════════════════════════════════════════════════════
function DxcCreateForm({ list, onSubmit, onCancel }) {
  const [reqDate, setReqDate] = useState(dxcToday);
  const [welfareType, setWelfareType] = useState('death');
  const [member, setMember] = useState(null);
  const [error, setError] = useState('');
  const [contractsOpen, setContractsOpen] = useState(false);
  const [files, setFiles] = useState([]);

  // ข้อมูลการเสียชีวิต / ใบมรณบัตร (แก้ไขได้)
  const [d, setD] = useState({ deathDate: '', cause: 'เจ็บป่วย / โรคประจำตัว', place: '', certNo: '', certDate: '', birthDate: '' });
  const setDeath = (k, v) => { setD(s => ({ ...s, [k]: v })); setError(''); };

  // ผู้ยื่นคำขอ
  const [a, setA] = useState({ name: '', relation: 'คู่สมรส', citizenId: '', phone: '', address: '',
                               payMethod: 'transfer', bank: 'ktb', accountNo: '', accountName: '' });
  const setApp = (k, v) => { setA(s => ({ ...s, [k]: v })); setError(''); };
  const [poaFiles, setPoaFiles] = useState([]);
  const [applicantIsBen, setApplicantIsBen] = useState(true);

  // ผู้รับผลประโยชน์
  const [bens, setBens] = useState([dxcBlankBen({ relation: 'คู่สมรส', pct: 100, docStatus: 'partial' })]);
  const setBen = (key, patch) => { setBens(bs => bs.map(x => x.key === key ? { ...x, ...patch } : x)); setError(''); };
  const addBen = () => { setBens(bs => [...bs, dxcBlankBen()]); setError(''); };
  const removeBen = (key) => setBens(bs => bs.length > 1 ? bs.filter(x => x.key !== key) : bs);

  // ขออนุมัติพิเศษ (กรณีไม่ผ่านสิทธิ)
  const [special, setSpecial] = useState({ enabled: false, reason: '' });
  // ผู้รับผลประโยชน์ถูกดึงจากทะเบียนสมาชิกหรือไม่
  const [benFromRegistry, setBenFromRegistry] = useState(false);

  // ── เลือกสมาชิก → ดึงข้อมูล + วันเกิดสังเคราะห์ + ผู้รับผลประโยชน์จากทะเบียน ──
  const pick = (m) => {
    setMember(m); setError('');
    setD(s => ({ ...s, birthDate: window.dxcSynthBirth(m) }));
    setSpecial({ enabled: false, reason: '' });
    // ดึงผู้รับผลประโยชน์ที่ขึ้นทะเบียนไว้ (ถ้ามี)
    const reg = (window.loadMemberBeneficiaries ? window.loadMemberBeneficiaries(m.code) : []) || [];
    if (reg.length) {
      setBens(reg.map(rb => dxcBlankBen({
        name: window.benFullName ? window.benFullName(rb) : `${rb.title || ''}${rb.firstName || ''} ${rb.lastName || ''}`.trim(),
        relation: window.DXC_RELATIONS.includes(rb.relation) ? rb.relation : 'อื่น ๆ',
        citizenId: rb.citizenId || '', pct: rb.share != null ? rb.share : '',
        payMethod: 'transfer', bank: 'ktb', accountNo: '', docStatus: 'partial',
      })));
      setBenFromRegistry(true);
      setApplicantIsBen(false);
    } else {
      setBens([dxcBlankBen({ relation: 'คู่สมรส', pct: 100, docStatus: 'partial' })]);
      setBenFromRegistry(false);
    }
  };

  // ── คำนวณ ──
  const memberYears = (member && d.deathDate) ? window.dxcYearsBetween(member.joinDate, d.deathDate) : null;
  const ageAtDeath = window.dxcAgeAt(d.birthDate, d.deathDate);
  const rate = window.dxcBenefitRate(memberYears, d.cause);
  const elig = member ? window.dxcEligibility({ status: member.status, memberYears }) : null;
  const debt = member ? window.dxcDebtBreakdown(member) : { principal: 0, interest: 0, penalty: 0, total: 0 };
  const net = window.dxcNet(rate.gross, debt.total);
  const debtRemain = window.dxcDebtRemain(rate.gross, debt.total);
  const pctSum = bens.reduce((s, b) => s + (Number(b.pct) || 0), 0);
  const pctOk = Math.abs(pctSum - 100) < 0.001;

  // ผู้ยื่น = ผู้รับผลประโยชน์รายแรก
  const syncApplicantBen = () => {
    if (!applicantIsBen) return;
    setBens(bs => {
      const first = { ...(bs[0] || dxcBlankBen()), name: a.name, relation: a.relation, citizenId: a.citizenId,
        payMethod: a.payMethod, bank: a.bank, accountNo: a.accountNo };
      return [first, ...bs.slice(1)];
    });
  };

  const onFiles = (e, setter) => {
    const names = [...e.target.files].map(x => x.name);
    if (names.length) setter(prev => [...prev, ...names]);
    e.target.value = '';
  };

  const submit = () => {
    if (!member) return setError('กรุณาเลือกสมาชิกผู้เสียชีวิตก่อนบันทึก');
    if (!d.deathDate) return setError('กรุณาระบุวันที่เสียชีวิต');
    if (!d.certNo.trim()) return setError('กรุณาระบุเลขที่ใบมรณบัตร');
    if (!a.name.trim()) return setError('กรุณาระบุชื่อผู้ยื่นคำขอ');
    if (!a.phone.trim()) return setError('กรุณาระบุเบอร์โทรศัพท์ผู้ยื่นคำขอ');
    if (!a.address.trim()) return setError('กรุณาระบุที่อยู่ติดต่อผู้ยื่นคำขอ');
    if (a.citizenId && !dxcCid13(a.citizenId)) return setError('เลขบัตรประชาชนผู้ยื่นคำขอต้องมี 13 หลัก');
    if (!applicantIsBen && poaFiles.length === 0) return setError('ผู้ยื่นไม่ใช่ผู้รับเงินโดยตรง — กรุณาแนบเอกสารมอบอำนาจ');
    const validBens = bens.filter(b => b.name.trim());
    if (validBens.length === 0) return setError('กรุณาระบุผู้รับผลประโยชน์อย่างน้อย 1 คน');
    if (!pctOk) return setError(`กรุณาระบุสัดส่วนผู้รับผลประโยชน์ให้ครบ 100% (ปัจจุบันรวม ${pctSum}%)`);
    if (elig && !elig.ok && !special.enabled) return setError('สมาชิกไม่ผ่านเงื่อนไขสิทธิ — เปิด "ขออนุมัติพิเศษ" พร้อมระบุเหตุผล จึงจะส่งอนุมัติได้');
    if (elig && !elig.ok && special.enabled && !special.reason.trim()) return setError('กรุณาระบุเหตุผลการขออนุมัติพิเศษ');

    const rec = {
      id: window.dxcNextNo(list, dxcYear()), reqDate, enteredBy: DXC_USER, welfareType,
      member: { code: member.code, name: member.name, citizenId: member.citizenId, dept: member.dept,
        memberType: member.type, status: member.status, joinDate: member.joinDate, birthDate: d.birthDate },
      death: { date: d.deathDate, cause: d.cause, place: d.place.trim(), certNo: d.certNo.trim(),
        certDate: d.certDate, age: ageAtDeath, memberYears: memberYears ? Number(memberYears.toFixed(2)) : null },
      applicant: { ...a, name: a.name.trim(), citizenId: a.citizenId.trim(), phone: a.phone.trim(),
        address: a.address.trim(), accountName: a.accountName.trim() || a.name.trim(), poa: [...poaFiles], isBeneficiary: applicantIsBen },
      benefit: { ...rate },
      debt: { ...debt }, net,
      beneficiaries: validBens.map(b => ({ name: b.name.trim(), relation: b.relation, citizenId: b.citizenId.trim(),
        pct: Number(b.pct) || 0, payMethod: b.payMethod, bank: b.bank, accountNo: b.accountNo.trim(), docStatus: b.docStatus })),
      eligibility: { ok: elig ? elig.ok : true, reasons: elig ? elig.reasons : [],
        special: elig && !elig.ok ? special.enabled : false, specialReason: special.reason.trim() },
      attachments: [...files],
      approval: { approver: '—', approveDate: '', note: '' },
      status: 'submitted',
    };
    onSubmit(rec);
  };

  return (
    <div data-screen-label="หน้าสร้างคำขอสินไหมสมาชิกเสียชีวิต">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างคำขอสินไหมกรณีสมาชิกเสียชีวิต</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาสมาชิก · ตรวจสอบสิทธิและหนี้คงค้าง · แบ่งสัดส่วนผู้รับผลประโยชน์ · ส่งอนุมัติ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <button className="btn primary sm" onClick={submit}><Icon name="check" /> ส่งอนุมัติ</button>
      </div>

      {error && <div className="sr-error"><Icon name="info" size={14} /> {error}</div>}

      {/* ── ข้อมูลระบบคำขอ ── */}
      <div className="search-card sr-sys">
        <div className="dxc-sys-grid">
          <DxField label="วันที่ยื่นคำขอ">
            <ErpDate value={reqDate} onChange={(v) => ((e) => setReqDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DxField>
          <DxField label="ประเภทสวัสดิการ">
            <select className="cfg-input" value={welfareType} onChange={(e) => setWelfareType(e.target.value)}>
              {window.DXC_WELFARE_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </DxField>
          <DxField label="เลขที่คำขอ" hint="(สร้างอัตโนมัติเมื่อบันทึก)">
            <input className="cfg-input mono sr-readonly" value="Auto" readOnly />
          </DxField>
          <DxField label="ผู้บันทึกคำขอ" hint="(จากการล็อกอิน)">
            <input className="cfg-input sr-readonly" value={DXC_USER} readOnly />
          </DxField>
        </div>
      </div>

      {/* ── ค้นหา + ข้อมูลสมาชิกผู้เสียชีวิต ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิกผู้เสียชีวิต</h3>
        </div>
        <div className="dxc-grid">
          <DxField label="เลขทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={pick} source={window.MEMBERS_LIST}
                               title="ค้นหาสมาชิกผู้เสียชีวิต" placeholder="ค้นหาเลขทะเบียน / บัตรประชาชน / ชื่อ…" showName={false} />
          </DxField>
          <DxField label="ชื่อ – นามสกุล" span={2}>
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </DxField>
          <DxField label="เลขบัตรประชาชน">
            <input className="cfg-input mono sr-auto" value={member ? member.citizenId : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="สังกัด / หน่วยงาน" span={2}>
            <input className="cfg-input sr-auto" value={member ? window.affilMemberLabel(member) : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="ประเภทสมาชิก">
            <input className="cfg-input sr-auto" value={member ? member.type : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="วันที่เป็นสมาชิก">
            <input className="cfg-input mono sr-auto" value={member ? fmt.date(member.joinDate) : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="สถานะสมาชิก">
            <input className="cfg-input sr-auto" value={member ? member.status : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="วันเกิด">
            <ErpDate value={d.birthDate} onChange={(v) => ((e) => setDeath('birthDate', e.target.value))({ target: { value: v } })} disabled={!member} className="cfg-input" />
          </DxField>
          <DxField label="อายุ ณ วันที่เสียชีวิต" hint="(คำนวณอัตโนมัติ)">
            <input className="cfg-input mono sr-auto" value={ageAtDeath != null ? ageAtDeath + ' ปี' : ''} readOnly placeholder="—" />
          </DxField>
          <DxField label="อายุสมาชิก ณ วันเสียชีวิต" hint="(คำนวณอัตโนมัติ)">
            <input className="cfg-input mono sr-auto" value={memberYears != null ? window.dxcYMLabel(member.joinDate, d.deathDate) : ''} readOnly placeholder="—" />
          </DxField>
        </div>

        <div className="dxc-subhead">ข้อมูลการเสียชีวิตและใบมรณบัตร</div>
        <div className="dxc-grid">
          <DxField label="วันที่เสียชีวิต" required>
            <ErpDate value={d.deathDate} onChange={(v) => ((e) => setDeath('deathDate', e.target.value))({ target: { value: v } })} disabled={!member} className="cfg-input" />
          </DxField>
          <DxField label="สาเหตุการเสียชีวิต">
            <select className="cfg-input" value={d.cause} onChange={(e) => setDeath('cause', e.target.value)} disabled={!member}>
              {window.DXC_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </DxField>
          <DxField label="สถานที่เสียชีวิต" span={2}>
            <input className="cfg-input" value={d.place} onChange={(e) => setDeath('place', e.target.value)} placeholder="เช่น โรงพยาบาล / ที่พัก" disabled={!member} />
          </DxField>
          <DxField label="เลขที่ใบมรณบัตร" required>
            <input className="cfg-input mono" value={d.certNo} onChange={(e) => setDeath('certNo', e.target.value)} placeholder="มบ.xxxx-xxxx" disabled={!member} />
          </DxField>
          <DxField label="วันที่ออกใบมรณบัตร">
            <ErpDate value={d.certDate} onChange={(v) => ((e) => setDeath('certDate', e.target.value))({ target: { value: v } })} disabled={!member} className="cfg-input" />
          </DxField>
        </div>
        {window.dxcIsAccident(d.cause) && member && (
          <div className="dxc-note-line"><Icon name="info" size={12} /> เสียชีวิตจากอุบัติเหตุ — คำนวณเงินสินไหมเพิ่มเติมตามระเบียบสหกรณ์</div>
        )}
      </div>

      {/* ── ตรวจสอบสิทธิ ── */}
      {member && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ตรวจสอบสิทธิรับสินไหม</h3>
            <span className="spacer" />
            {d.deathDate && (
              <span className={"pill " + (elig.ok ? 'ok' : 'bad')} style={{ height: 24 }}>
                {elig.ok ? 'ผ่านเงื่อนไข' : 'ไม่ผ่านเงื่อนไข'}
              </span>
            )}
          </div>
          {!d.deathDate ? (
            <div className="dxc-note-line"><Icon name="info" size={12} /> ระบุวันที่เสียชีวิตเพื่อตรวจสอบสิทธิตามอายุสมาชิก</div>
          ) : elig.ok ? (
            <div className="dxc-elig ok">
              <Icon name="check" size={15} />
              <div>
                <b>สมาชิกมีสิทธิรับเงินสินไหม</b>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {rate.tier} · อายุสมาชิก {window.dxcYMLabel(member.joinDate, d.deathDate)} · สถานะ {member.status}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="dxc-elig bad">
                <Icon name="close" size={15} />
                <div>
                  <b>สถานะสิทธิ: ไม่ผ่าน</b>
                  <ul className="dxc-elig-reasons">{elig.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              </div>
              <label className="dxc-special-toggle">
                <input type="checkbox" checked={special.enabled} onChange={(e) => { setSpecial(s => ({ ...s, enabled: e.target.checked })); setError(''); }} />
                <span>ขออนุมัติเป็นกรณีพิเศษ (ต้องระบุเหตุผลประกอบ)</span>
              </label>
              {special.enabled && (
                <textarea className="cfg-input" rows={2} style={{ marginTop: 8 }} value={special.reason}
                          onChange={(e) => { setSpecial(s => ({ ...s, reason: e.target.value })); setError(''); }}
                          placeholder="ระบุเหตุผลการขออนุมัติพิเศษ เช่น มติที่ประชุมคณะกรรมการ ครั้งที่…" />
              )}
            </>
          )}
        </div>
      )}

      {/* ── ตรวจสอบหนี้คงเหลือ + ยอดสุทธิ ── */}
      {member && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ตรวจสอบหนี้คงเหลือ และยอดเงินรับสุทธิ</h3>
            <span className="spacer" />
            <button className="btn sm dashed" onClick={() => setContractsOpen(true)}><Icon name="wallet" size={13} /> ดูรายละเอียดหุ้น–หนี้</button>
          </div>
          <div className="dxc-calc-wrap">
            <div className="sem-cost-list">
              <div className="sem-cost-row"><span>เงินสินไหมตามสิทธิ ({rate.tier})</span><b className="mono">{fmt.money(rate.base, 0)}</b></div>
              {rate.accidentBonus > 0 && <div className="sem-cost-row"><span>เงินเพิ่มกรณีอุบัติเหตุ</span><b className="mono">{fmt.money(rate.accidentBonus, 0)}</b></div>}
              <div className="sem-cost-row total"><span>เงินสินไหมก่อนหัก</span><b className="mono">฿ {fmt.money(rate.gross, 0)}</b></div>
              <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>เงินต้นคงเหลือ</span><b className="mono">− {fmt.money(debt.principal, 0)}</b></div>
              <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>ดอกเบี้ยค้างชำระ</span><b className="mono">− {fmt.money(debt.interest, 0)}</b></div>
              {debt.penalty > 0 && <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>ค่าปรับ / ภาระผูกพันอื่น</span><b className="mono">− {fmt.money(debt.penalty, 0)}</b></div>}
              <div className="sem-cost-row sub"><span>ยอดหักกลบหนี้รวม</span><b className="mono">{fmt.money(debt.total, 0)}</b></div>
            </div>
            <div className={"sr-amount-box" + (net === 0 ? ' dxc-zero' : '')}>
              <div className="sr-amount-label">ยอดเงินรับสุทธิ</div>
              <div className="sr-amount-value">฿ {fmt.money(net, 0)}</div>
              <div className="sr-amount-sub">
                {debtRemain > 0
                  ? <>หนี้มากกว่าสินไหม — หักกลบเต็มจำนวน · คงเหลือหนี้ {fmt.money(debtRemain, 0)} บาท</>
                  : <>สินไหมก่อนหัก {fmt.money(rate.gross, 0)} − หนี้ {fmt.money(debt.total, 0)}</>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ข้อมูลผู้ยื่นคำขอ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลผู้ยื่นคำขอ</h3>
        </div>
        <div className="dxc-grid">
          <DxField label="ชื่อ – นามสกุลผู้ยื่นคำขอ" required span={2}>
            <input className="cfg-input" value={a.name} onChange={(e) => setApp('name', e.target.value)} placeholder="ชื่อ-สกุลผู้ยื่นคำขอ" />
          </DxField>
          <DxField label="ความสัมพันธ์กับสมาชิก" required>
            <select className="cfg-input" value={a.relation} onChange={(e) => setApp('relation', e.target.value)}>
              {window.DXC_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </DxField>
          <DxField label="เลขบัตรประชาชน" hint="(13 หลัก)">
            <input className="cfg-input mono" value={a.citizenId} onChange={(e) => setApp('citizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" />
          </DxField>
          <DxField label="เบอร์โทรศัพท์" required>
            <input className="cfg-input mono" value={a.phone} onChange={(e) => setApp('phone', e.target.value)} placeholder="08x-xxx-xxxx" />
          </DxField>
          <DxField label="ที่อยู่ติดต่อ" required span={2}>
            <input className="cfg-input" value={a.address} onChange={(e) => setApp('address', e.target.value)} placeholder="ที่อยู่สำหรับติดต่อ" />
          </DxField>
          <DxField label="วิธีรับเงิน" required>
            <select className="cfg-input" value={a.payMethod} onChange={(e) => setApp('payMethod', e.target.value)}>
              {window.DXC_PAY_METHODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
            </select>
          </DxField>
          <DxField label="ธนาคาร" hint={a.payMethod === 'transfer' ? '' : '(เฉพาะโอนเงิน)'}>
            <select className="cfg-input" value={a.bank} onChange={(e) => setApp('bank', e.target.value)} disabled={a.payMethod !== 'transfer'}>
              {window.DXC_BANKS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
            </select>
          </DxField>
          <DxField label="เลขที่บัญชี" hint={a.payMethod === 'transfer' ? '' : '(เฉพาะโอนเงิน)'}>
            <input className="cfg-input mono" value={a.accountNo} onChange={(e) => setApp('accountNo', e.target.value)} placeholder="xxx-x-xxxxx-x" disabled={a.payMethod !== 'transfer'} />
          </DxField>
          <DxField label="ชื่อบัญชี" hint="(ควรตรงกับผู้รับเงิน)">
            <input className="cfg-input" value={a.accountName} onChange={(e) => setApp('accountName', e.target.value)} placeholder={a.name || 'ชื่อบัญชีผู้รับเงิน'} disabled={a.payMethod !== 'transfer'} />
          </DxField>
        </div>
        <label className="dxc-special-toggle" style={{ marginTop: 12 }}>
          <input type="checkbox" checked={applicantIsBen}
                 onChange={(e) => { const v = e.target.checked; setApplicantIsBen(v); if (v) syncApplicantBen(); setError(''); }} />
          <span>ผู้ยื่นคำขอเป็นผู้รับผลประโยชน์โดยตรง</span>
        </label>
        {!applicantIsBen && (
          <DxField label="เอกสารมอบอำนาจ" required full hint="(จำเป็นเมื่อผู้ยื่นไม่ใช่ผู้รับเงินโดยตรง)">
            <label className="sr-file-btn">
              <Icon name="attach" size={14} /> แนบเอกสารมอบอำนาจ…
              <input type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => onFiles(e, setPoaFiles)} />
            </label>
            {poaFiles.length > 0 && (
              <div className="sr-file-list">
                {poaFiles.map((nm, i) => (
                  <span className="sr-file-chip" key={i}><Icon name="attach" size={11} /><span className="nm">{nm}</span>
                    <button type="button" onClick={() => setPoaFiles(p => p.filter((_, idx) => idx !== i))}><Icon name="close" size={10} /></button></span>
                ))}
              </div>
            )}
          </DxField>
        )}
      </div>

      {/* ── ผู้รับผลประโยชน์ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ผู้รับผลประโยชน์</h3>
          {benFromRegistry && <span className="chip info" style={{ marginLeft: 4 }}><Icon name="member" size={11} /> ดึงจากทะเบียนสมาชิก</span>}
          <span className="spacer" />
          <span className={"chip " + (pctOk ? 'success' : 'danger')}>รวมสัดส่วน {pctSum}%</span>
        </div>

        <div className="dxc-ben-list">
          {bens.map((b, idx) => {
            const amt = net * (Number(b.pct) || 0) / 100;
            return (
              <div className="dxc-ben-card" key={b.key}>
                <div className="dxc-ben-head">
                  <span className="dxc-ben-no"><Icon name="user" size={12} /> ผู้รับผลประโยชน์คนที่ {idx + 1}</span>
                  <span className="spacer" />
                  <span className="dxc-ben-amt mono">฿ {fmt.money(amt, 0)}</span>
                  {bens.length > 1 && (
                    <button className="btn text sm danger" onClick={() => removeBen(b.key)} title="นำออก"><Icon name="close" size={12} /> นำออก</button>
                  )}
                </div>
                <div className="dxc-grid">
                  <DxField label="ชื่อผู้รับผลประโยชน์" required span={2}>
                    <input className="cfg-input" value={b.name} onChange={(e) => setBen(b.key, { name: e.target.value })} placeholder="ชื่อ-สกุล" />
                  </DxField>
                  <DxField label="ความสัมพันธ์">
                    <select className="cfg-input" value={b.relation} onChange={(e) => setBen(b.key, { relation: e.target.value })}>
                      {window.DXC_RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </DxField>
                  <DxField label="เลขบัตรประชาชน">
                    <input className="cfg-input mono" value={b.citizenId} onChange={(e) => setBen(b.key, { citizenId: e.target.value })} placeholder="x-xxxx-xxxxx-xx-x" />
                  </DxField>
                  <DxField label="สัดส่วนรับเงิน" hint="(%)">
                    <input className="cfg-input mono dxc-pct-in" type="number" min="0" max="100" value={b.pct}
                           onChange={(e) => setBen(b.key, { pct: e.target.value })} placeholder="0" />
                  </DxField>
                  <DxField label="จำนวนเงินที่ได้รับ" hint="(คำนวณอัตโนมัติ)">
                    <input className="cfg-input mono sr-auto" value={'฿ ' + fmt.money(amt, 0)} readOnly />
                  </DxField>
                  <DxField label="วิธีรับเงิน">
                    <select className="cfg-input" value={b.payMethod} onChange={(e) => setBen(b.key, { payMethod: e.target.value })}>
                      {window.DXC_PAY_METHODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
                    </select>
                  </DxField>
                  <DxField label="ธนาคาร" hint={b.payMethod === 'transfer' ? '' : '(เฉพาะโอนเงิน)'}>
                    <select className="cfg-input" value={b.bank} onChange={(e) => setBen(b.key, { bank: e.target.value })} disabled={b.payMethod !== 'transfer'}>
                      {window.DXC_BANKS.map(bk => <option key={bk.v} value={bk.v}>{bk.l}</option>)}
                    </select>
                  </DxField>
                  <DxField label="เลขที่บัญชี" hint={b.payMethod === 'transfer' ? '' : '(เฉพาะโอนเงิน)'}>
                    <input className="cfg-input mono" value={b.accountNo} onChange={(e) => setBen(b.key, { accountNo: e.target.value })} placeholder="xxx-x-xxxxx-x" disabled={b.payMethod !== 'transfer'} />
                  </DxField>
                  <DxField label="สถานะเอกสาร">
                    <select className="cfg-input" value={b.docStatus} onChange={(e) => setBen(b.key, { docStatus: e.target.value })}>
                      {window.DXC_DOCSTATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                    </select>
                  </DxField>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn dashed sm" style={{ marginTop: 12 }} onClick={addBen}><Icon name="plus" size={13} /> เพิ่มผู้รับผลประโยชน์</button>

        <div className={"dxc-pct-bar" + (pctOk ? ' ok' : '')}>
          <div className="dxc-pct-track"><div className="dxc-pct-fill" style={{ width: Math.min(100, pctSum) + '%' }} /></div>
          <span className="dxc-pct-label">
            {pctOk ? <><Icon name="check" size={12} /> สัดส่วนครบ 100% · แบ่งยอดสุทธิ ฿{fmt.money(net, 0)}</>
                   : <><Icon name="info" size={12} /> กรุณาระบุสัดส่วนผู้รับผลประโยชน์ให้ครบ 100% (ปัจจุบัน {pctSum}%)</>}
          </span>
        </div>
      </div>

      {/* ── เอกสารประกอบ + ข้อมูลการอนุมัติ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>เอกสารประกอบการเสียชีวิต</h3>
        </div>
        <DxField label="แนบเอกสาร" full hint="(ใบมรณบัตร · สำเนาบัตร/ทะเบียนบ้าน · เอกสารสิทธิ · รองรับรูปภาพ / PDF)">
          <label className="sr-file-btn">
            <Icon name="attach" size={14} /> เลือกไฟล์เพื่อแนบ…
            <input type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => onFiles(e, setFiles)} />
          </label>
          {files.length > 0 && (
            <div className="sr-file-list">
              {files.map((nm, i) => (
                <span className="sr-file-chip" key={i}><Icon name="attach" size={11} /><span className="nm">{nm}</span>
                  <button type="button" onClick={() => setFiles(p => p.filter((_, idx) => idx !== i))}><Icon name="close" size={10} /></button></span>
              ))}
            </div>
          )}
        </DxField>
        <div className="dxc-approve-note muted">
          <Icon name="info" size={12} /> เมื่อส่งอนุมัติ คำขอจะเข้าสถานะ "รออนุมัติ" · ข้อมูลการอนุมัติ (ผู้อนุมัติ / วันที่อนุมัติ) จะบันทึกในขั้นตอนพิจารณา
        </div>
      </div>

      {contractsOpen && member && <DxcContractsModal member={member} onClose={() => setContractsOpen(false)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนคำขอ (list)
// ════════════════════════════════════════════════════════════════════
function DxcListView({ list, onCreate, onOpen }) {
  const [q, setQ] = useState('');
  const [statusF, setStatusF] = useState('all');

  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.member.name.toLowerCase().includes(n) || x.member.code.toLowerCase().includes(n) ||
                        String(x.id).toLowerCase().includes(n) || (x.applicant.name || '').toLowerCase().includes(n));
    }
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => String(b.reqDate).localeCompare(String(a.reqDate)) || String(b.id).localeCompare(String(a.id)));
  }, [list, q, statusF]);

  const pending = list.filter(r => r.status === 'submitted').length;
  const totalNet = list.filter(r => r.status !== 'rejected').reduce((s, r) => s + (Number(r.net) || 0), 0);

  return (
    <div data-screen-label="หน้าทะเบียนคำขอสินไหมสมาชิกเสียชีวิต">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอสินไหมกรณีสมาชิกเสียชีวิต</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกคำขอรับเงินสินไหม/สงเคราะห์เมื่อสมาชิกถึงแก่กรรม · ตรวจสอบสิทธิ · หักกลบหนี้ · แบ่งผู้รับผลประโยชน์
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างคำขอ</button>
      </div>

      <div className="dxc-stat-row">
        <div className="dxc-stat"><span className="k">คำขอทั้งหมด</span><span className="v mono">{list.length}</span></div>
        <div className="dxc-stat"><span className="k">รออนุมัติ</span><span className="v mono" style={{ color: 'var(--warning)' }}>{pending}</span></div>
        <div className="dxc-stat"><span className="k">ยอดสินไหมสุทธิรวม</span><span className="v mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(totalNet, 0)}</span></div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: ชื่อสมาชิก, เลขทะเบียน, เลขคำขอ, ผู้ยื่น…" style={{ height: 32, fontSize: 13 }} />
          </div>
          <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">ทุกสถานะ</option>
            {Object.entries(window.DXC_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>เลขที่คำขอ</th><th className="center">วันที่ยื่น</th><th>สมาชิกผู้เสียชีวิต</th>
              <th>ผู้ยื่นคำขอ</th><th className="center">วันเสียชีวิต</th><th className="num">ยอดรับสุทธิ</th><th className="center">สถานะ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const st = window.dxcStatus(r.status);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.reqDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{r.member.name.replace(/^(นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').slice(0, 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{r.member.name}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.member.code}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.applicant.name}<div className="muted" style={{ fontSize: 10 }}>{r.applicant.relation}</div></td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.death.date)}</td>
                    <td className="num mono"><b>{fmt.money(r.net, 0)}</b></td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดคำขอ · คลิก "สร้างคำขอ" เพื่อบันทึกคำขอสินไหมรายใหม่
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดคำขอ (อ่านอย่างเดียว)
// ════════════════════════════════════════════════════════════════════
function DxcDetailView({ rec, onBack }) {
  if (!rec) return null;
  const st = window.dxcStatus(rec.status);
  const b = rec.benefit || {}, dt = rec.debt || {}, dth = rec.death || {}, m = rec.member || {}, ap = rec.applicant || {};
  return (
    <div data-screen-label="หน้ารายละเอียดคำขอสินไหมสมาชิกเสียชีวิต">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <span className="spacer" />
        <button className="btn sm"><Icon name="print" /> พิมพ์คำขอ</button>
      </div>

      {/* หัวเรื่อง — รูปแบบ detail header card ของ DS */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{m.name}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>เงินสงเคราะห์สมาชิกเสียชีวิต</span><span className="dot" />
              <span>ยื่นเมื่อ {fmt.date(rec.reqDate)}</span><span className="dot" />
              <span>โดย {rec.enteredBy}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">สมาชิกผู้เสียชีวิต</span><span className="lt-date-v">{m.name} <span className="muted mono" style={{ fontWeight: 400 }}>({m.code})</span></span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่เสียชีวิต</span><span className="lt-date-v">{fmt.date(dth.date)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ยอดเงินรับสุทธิ</span><span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(rec.net, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">สิทธิ</span><span className="lt-date-v">{rec.eligibility && rec.eligibility.ok ? 'ผ่านเงื่อนไข' : (rec.eligibility && rec.eligibility.special ? 'อนุมัติพิเศษ' : 'ไม่ผ่าน')}</span></div>
        </div>
      </div>

      {rec.eligibility && !rec.eligibility.ok && (
        <div className="search-card" style={{ marginBottom: 12, borderColor: 'var(--danger)' }}>
          <div className="dxc-elig bad" style={{ margin: 0 }}>
            <Icon name="info" size={15} />
            <div><b>สถานะสิทธิ: ไม่ผ่าน{rec.eligibility.special ? ' (ขออนุมัติพิเศษ)' : ''}</b>
              <ul className="dxc-elig-reasons">{(rec.eligibility.reasons || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
              {rec.eligibility.special && rec.eligibility.specialReason && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>เหตุผล: {rec.eligibility.specialReason}</div>}
            </div>
          </div>
        </div>
      )}

      {/* สมาชิกผู้เสียชีวิต */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลสมาชิกผู้เสียชีวิต</h3></div>
        <div className="form-grid">
          <DxRow label="เลขทะเบียนสมาชิก" value={m.code} mono />
          <DxRow label="ชื่อ – นามสกุล" value={m.name} />
          <DxRow label="เลขบัตรประชาชน" value={m.citizenId} mono />
          <DxRow label="สังกัด / หน่วยงาน" value={window.affilMemberLabel(m)} />
          <DxRow label="ประเภทสมาชิก" value={m.memberType} />
          <DxRow label="สถานะสมาชิก" value={m.status} />
          <DxRow label="วันที่เป็นสมาชิก" value={fmt.date(m.joinDate)} />
          <DxRow label="อายุสมาชิก ณ วันเสียชีวิต" value={dth.memberYears != null ? window.dxcYMLabel(m.joinDate, dth.date) : '—'} />
          <DxRow label="วันเกิด / อายุ" value={m.birthDate ? `${fmt.date(m.birthDate)} · ${dth.age != null ? dth.age + ' ปี' : '—'}` : '—'} />
          <DxRow label="สาเหตุ / สถานที่" value={`${dth.cause || '—'}${dth.place ? ' · ' + dth.place : ''}`} />
          <DxRow label="เลขที่ใบมรณบัตร" value={dth.certNo} mono />
          <DxRow label="วันที่ออกใบมรณบัตร" value={dth.certDate ? fmt.date(dth.certDate) : '—'} />
        </div>
      </div>

      {/* หนี้ + ยอดสุทธิ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เงินสินไหม การหักกลบหนี้ และยอดรับสุทธิ</h3></div>
        <div className="sem-cost-list" style={{ maxWidth: 520 }}>
          <div className="sem-cost-row"><span>เงินสินไหมตามสิทธิ ({b.tier})</span><b className="mono">{fmt.money(b.base, 0)}</b></div>
          {b.accidentBonus > 0 && <div className="sem-cost-row"><span>เงินเพิ่มกรณีอุบัติเหตุ</span><b className="mono">{fmt.money(b.accidentBonus, 0)}</b></div>}
          <div className="sem-cost-row total"><span>เงินสินไหมก่อนหัก</span><b className="mono">฿ {fmt.money(b.gross, 0)}</b></div>
          <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>เงินต้นคงเหลือ</span><b className="mono">− {fmt.money(dt.principal, 0)}</b></div>
          <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>ดอกเบี้ยค้างชำระ</span><b className="mono">− {fmt.money(dt.interest, 0)}</b></div>
          {dt.penalty > 0 && <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>ค่าปรับ / ภาระผูกพันอื่น</span><b className="mono">− {fmt.money(dt.penalty, 0)}</b></div>}
          <div className="sem-cost-row total"><span>ยอดเงินรับสุทธิ</span><b className="mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(rec.net, 0)}</b></div>
        </div>
      </div>

      {/* ผู้ยื่นคำขอ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้ยื่นคำขอ</h3></div>
        <div className="form-grid">
          <DxRow label="ชื่อ – นามสกุล" value={ap.name} />
          <DxRow label="ความสัมพันธ์กับสมาชิก" value={ap.relation} />
          <DxRow label="เลขบัตรประชาชน" value={ap.citizenId} mono />
          <DxRow label="เบอร์โทรศัพท์" value={ap.phone} mono />
          <DxRow label="ที่อยู่ติดต่อ" value={ap.address} />
          <DxRow label="วิธีรับเงิน" value={window.dxcPayLabel(ap.payMethod)} />
          {ap.payMethod === 'transfer' && <DxRow label="ธนาคาร / เลขบัญชี" value={`${window.dxcBankLabel(ap.bank)} · ${ap.accountNo || '—'}`} mono />}
          <DxRow label="ชื่อบัญชี" value={ap.accountName} />
          <DxRow label="เป็นผู้รับเงินโดยตรง" value={ap.isBeneficiary ? 'ใช่' : 'ไม่ใช่ (มอบอำนาจ)'} />
        </div>
      </div>

      {/* ผู้รับผลประโยชน์ */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
        <div className="sh-grid-head">
          <div><div className="sh-grid-title">ผู้รับผลประโยชน์</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ยอดรับสุทธิ ฿{fmt.money(rec.net, 0)} แบ่งตามสัดส่วน</div></div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 40 }} className="center">#</th><th>ชื่อผู้รับผลประโยชน์</th><th>ความสัมพันธ์</th>
              <th>วิธีรับเงิน</th><th className="center">เอกสาร</th><th className="center">สัดส่วน</th><th className="num">จำนวนเงินที่ได้รับ</th>
            </tr></thead>
            <tbody>
              {(rec.beneficiaries || []).map((h, i) => {
                const ds = window.DXC_DOCSTATUS.find(s => s.v === h.docStatus) || window.DXC_DOCSTATUS[1];
                return (
                  <tr key={i}>
                    <td className="center mono muted">{i + 1}</td>
                    <td><div style={{ fontWeight: 500 }}>{h.name}</div><div className="muted mono" style={{ fontSize: 10 }}>{h.citizenId || '—'}</div></td>
                    <td>{h.relation}</td>
                    <td>{window.dxcPayLabel(h.payMethod)}{h.payMethod === 'transfer' && h.accountNo ? ` · ${window.dxcBankLabel(h.bank)} ${h.accountNo}` : ''}</td>
                    <td className="center"><span className={"pill " + ds.pill}>{ds.l}</span></td>
                    <td className="center mono">{h.pct}%</td>
                    <td className="num mono"><b>{fmt.money(rec.net * h.pct / 100, 0)}</b></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr className="sh-grid-total">
              <td colSpan="5" className="right"><b>รวม</b></td>
              <td className="center mono"><b>{(rec.beneficiaries || []).reduce((s, h) => s + h.pct, 0)}%</b></td>
              <td className="num mono"><b>{fmt.money(rec.net, 0)}</b></td>
            </tr></tfoot>
          </table>
        </div>
      </div>

      {/* เอกสาร + อนุมัติ */}
      <div className="sr-two-col" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>เอกสารประกอบ</h3></div>
          {(rec.attachments && rec.attachments.length) ? (
            <div className="sr-file-list">
              {rec.attachments.map((nm, i) => <span className="sr-file-chip" key={i} style={{ paddingRight: 10 }}><Icon name="attach" size={11} /><span className="nm">{nm}</span></span>)}
            </div>
          ) : <div className="muted" style={{ fontSize: 12.5 }}>ไม่มีเอกสารแนบ</div>}
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการอนุมัติ</h3></div>
          <div className="form-grid">
            <DxRow label="สถานะ" value={st.l} />
            <DxRow label="ผู้อนุมัติ" value={(rec.approval && rec.approval.approver) || '—'} />
            <DxRow label="วันที่อนุมัติ" value={rec.approval && rec.approval.approveDate ? fmt.date(rec.approval.approveDate) : '—'} />
          </div>
          {rec.approval && rec.approval.note && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}><Icon name="info" size={11} /> {rec.approval.note}</div>}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main
// ════════════════════════════════════════════════════════════════════
function DeceasedClaimPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(dxcLoad);
  const [mode, setMode] = useState('list');   // 'list' | 'form' | 'detail'
  const [current, setCurrent] = useState(null);
  const persist = (next) => { setList(next); dxcSaveLS(next); };

  // Breadcrumb: หน้าหลัก › ขอสินไหมกรณีสมาชิกเสียชีวิต › [หน้าย่อย]
  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'ขอสินไหมกรณีสมาชิกเสียชีวิต', onClick: () => setMode('list') }, { label: 'สร้างคำขอ', current: true }]
      : mode === 'detail'
        ? [{ label: 'ขอสินไหมกรณีสมาชิกเสียชีวิต', onClick: () => setMode('list') }, { label: 'รายละเอียดคำขอ', current: true }]
        : [{ label: 'ขอสินไหมกรณีสมาชิกเสียชีวิต', current: true }],
    [mode, current && current.id]
  );

  const submit = (rec) => {
    persist([rec, ...list]);
    audit.log({ action: 'create', module: 'สวัสดิการ — ขอสินไหมสมาชิกเสียชีวิต',
      target: `${rec.member.code} · ${rec.member.name}`,
      summary: `ยื่นคำขอสินไหม ${rec.id} · เสียชีวิต ${fmt.date(rec.death.date)} · ยอดรับสุทธิ ${fmt.money(rec.net, 0)} บาท · ผู้รับผลประโยชน์ ${rec.beneficiaries.length} ราย`,
      changes: [
        { field: 'เลขที่คำขอ', before: '—', after: rec.id },
        { field: 'ยอดรับสุทธิ', before: '—', after: fmt.money(rec.net, 0) + ' บาท' },
      ] });
    onToast && onToast(`บันทึกคำขอสินไหม ${rec.id} · ${rec.member.name} เรียบร้อยแล้ว`);
    setCurrent(rec); setMode('detail');
  };

  return (
    <>
      {mode === 'list' && <DxcListView list={list} onCreate={() => setMode('form')} onOpen={(r) => { setCurrent(r); setMode('detail'); }} />}
      {mode === 'form' && <DxcCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} />}
      {mode === 'detail' && <DxcDetailView rec={current} onBack={() => setMode('list')} />}
    </>
  );
}

Object.assign(window, { DeceasedClaimPage });
