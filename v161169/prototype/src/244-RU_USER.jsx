// ════════════════════════════════════════════════════════════════════
//  เงินสงเคราะห์สมาชิก — RuCreateForm (แบบฟอร์มหน้าจอเดียว)
//  แสดงกลุ่ม Field ตามประเภทสวัสดิการที่เลือก (เสียชีวิต/ภัยพิบัติ/
//  ทุพพลภาพ/ทั่วไป) · ตรวจสอบเงื่อนไขก่อนบันทึก
// ════════════════════════════════════════════════════════════════════

const RU_USER = 'จันทร์เพ็ญ มาลี';
const ruToday = () => new Date().toISOString().slice(0, 10);

function ruLoad() {
  try {
    const saved = localStorage.getItem('relief_requests');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.RELIEF_SEED.map(r => ({ ...r }));
}
function ruSaveLS(list) {
  try { localStorage.setItem('relief_requests', JSON.stringify(list)); } catch (e) {}
}

function RuMemberSearchModal({ onPick, onClose }) {
  return (
    <MemberSearchModal onPick={(m) => onPick(window.reliefMember(m.code))} onClose={onClose}
                       title="ค้นหาสมาชิกผู้ขอใช้สิทธิ" source={window.MEMBERS_LIST} />
  );
}

// ─── ฟิลด์ย่อย ───────────────────────────────────────────────────────
function RuField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

// ─── หัวข้อกลุ่ม Field ───────────────────────────────────────────────
function RuGroupCard({ title, desc, tag, children, style }) {
  return (
    <div className="search-card ru-group" style={style}>
      <div className="section-head ru-group-head">
        <span className="head-bar" />
        <div style={{ minWidth: 0 }}>
          <h3>{title}</h3>
          {desc && <div className="ru-group-desc">{desc}</div>}
        </div>
        {tag && <span className="chip info ru-group-tag">{tag}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── โมดัลยืนยันการเปลี่ยนประเภทสวัสดิการ ────────────────────────────
function RuConfirmTypeModal({ message, onConfirm, onCancel }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="modal-warnico" style={{ background: 'var(--warning-50, #fef3c7)', color: 'var(--warning)' }}>
            <Icon name="info" />
          </div>
          <h2>เปลี่ยนประเภทสวัสดิการ</h2>
          <button className="close-btn" onClick={onCancel}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">{message}</p>
        </div>
        <div className="ins-modal-foot" style={{ padding: '0 18px 16px' }}>
          <button className="btn sm" onClick={onCancel}>ยกเลิก</button>
          <button className="btn primary sm" onClick={onConfirm}>ดำเนินการต่อ</button>
        </div>
      </div>
    </>
  );
}

// ─── โมดัลประวัติการใช้สิทธิ ──────────────────────────────────────────
function RuUsageModal({ member, onClose }) {
  const rows = member ? window.reliefUsageHistory(member.code) : [];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="modal-warnico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการใช้สิทธิสวัสดิการ</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member ? `${member.name} · ${member.code}` : ''}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {rows.length === 0 ? (
            <div className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>ยังไม่เคยขอรับสวัสดิการ</div>
          ) : (
            <table className="tbl"><thead><tr>
              <th>เลขใบคำขอ</th><th>วันยื่น</th><th>ประเภท</th><th className="num">ยอดที่ขอ</th><th className="center">สถานะ</th>
            </tr></thead><tbody>
              {rows.map(r => {
                const t = window.reliefType(r.typeCode) || {}; const st = window.reliefStatus(r.status);
                return (<tr key={r.id}>
                  <td className="mono">{r.id}</td><td className="mono">{fmt.date(r.reqDate)}</td>
                  <td><span className="mono" style={{ fontSize: 11 }}>{t.code}</span> · {t.label}</td>
                  <td className="num"><b>{fmt.money(r.requested, 0)}</b></td>
                  <td className="center"><span className={"pill " + st.pill}>{st.step} : {st.l}</span></td>
                </tr>);
              })}
            </tbody></table>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มสร้างคำขอ
// ════════════════════════════════════════════════════════════════════
const RU_INIT = {
  typeCode: '4001', trackingNo: '',
  // ผู้เสียชีวิต
  deceasedName: '', deceasedCitizenId: '', deceasedDeathDate: '', deceasedAge: '', deceasedCause: '',
  deathCertNo: '', deathCertDate: '', deathCertOrg: '',
  // ผู้รับเงิน (กรณีสมาชิกเสียชีวิต)
  benefName: '', benefCitizenId: '', benefRelation: 'spouse', benefPhone: '', benefAddr: '',
  // ภัยพิบัติ
  disasterDate: '', damage: 'medium', disasterDetail: '', otherKind: '',
  certOrg: '', certNo: '', certDate: '',
  // บ้านที่ประสบภัย
  houseRegNo: '', houseNo: '', moo: '', soi: '', road: '',
  province: '', amphoe: '', tambon: '', postal: '', residence: 'owner', mainHouse: false,
  // ทุพพลภาพ
  disabDate: '', disabLevel: 'partial', disabCause: '', hospital: '', medCertNo: '', medCertDate: '', renewDate: '',
  // สวัสดิการทั่วไป
  eventDate: '', reqDetail: '', reqReason: '', boardRef: '',
  // สิทธิและยอดเงิน
  requested: '', over120: false, over120Reason: '', note: '',
  // การรับเงิน
  payBy: 'CBT', bank: 'ktb', acctType: 'saving', payAccount: '', accName: '', branch: '',
  cashName: '', cashCitizenId: '', cashPhone: '', cashNote: '',
  moName: '', moAddr: '', moProvince: '', moPostal: '', moNo: '',
  coopAccount: '', coopAcctType: 'ออมทรัพย์', coopAccName: '',
  otherPay: '',
};

function RuCreateForm({ list, onSubmit, onCancel }) {
  const [reqDate, setReqDate] = useState(ruToday);
  const [member, setMember] = useState(null);
  const [welfareCode, setWelfareCode] = useState('DEATH');
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(null);   // {welfare?, type?}
  const [usageOpen, setUsageOpen] = useState(false);
  const [docs, setDocs] = useState([]);
  const [reqTouched, setReqTouched] = useState(false);
  const [structure] = useState(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])));
  const [disburse, setDisburse] = useState(() => [window.bdBlankLine()]);

  const [f, setF] = useState(RU_INIT);
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); setDirty(true); };

  const cat = window.reliefCatOf(welfareCode);
  const groups = window.reliefGroups(f.typeCode);
  const has = (g) => groups.includes(g);
  const typeObj = window.reliefType(f.typeCode) || {};
  const isMemberDeath = cat === 'death' && typeObj.memberDeath;

  const memberYears = member ? window.reliefMemberYears(member.joinDate) : 0;
  const eligible = window.reliefAmount(f.typeCode, { memberYears, damage: f.damage });
  const effRequested = f.requested === '' ? eligible : Number(f.requested);

  // ── ค่าคงที่ประเภทเงินสงเคราะห์ (เมนูค่าคงที่ · ประเภทเงินสงเคราะห์) ──
  const typeCfg = window.reliefTypeCfg ? window.reliefTypeCfg(f.typeCode) : null;
  const cfgMaxRights = typeCfg ? Number(typeCfg.maxRights) || 0 : 0;
  const cfgMaxAmount = typeCfg ? Number(typeCfg.maxAmount) || 0 : 0;
  const rightsUsed = member ? window.reliefRightsUsed(list, member.code, f.typeCode) : 0;
  const rightsLeft = cfgMaxRights > 0 ? Math.max(0, cfgMaxRights - rightsUsed) : null;
  const rightsExhausted = cfgMaxRights > 0 && member && rightsUsed >= cfgMaxRights;

  // วันที่เกิดเหตุ (ตามหมวด) — สำหรับตรวจ 120 วัน
  const eventDate = cat === 'death' ? f.deceasedDeathDate
    : cat === 'disaster' ? f.disasterDate
    : cat === 'disability' ? f.disabDate
    : f.eventDate;
  const daysSince = window.reliefDaysSince(eventDate, reqDate);
  const over120Auto = eventDate && daysSince > 120;

  // เอกสารแนบตามประเภท → เซ็ตใหม่เมื่อเปลี่ยนประเภท
  useEffect(() => {
    setDocs(window.reliefDocTypes(f.typeCode).map((t, i) => ({ id: i, type: t, attached: false, status: 'pending' })));
  }, [f.typeCode]);

  // กรณีสมาชิกเสียชีวิต → ดึงข้อมูลผู้เสียชีวิต = สมาชิก
  useEffect(() => {
    if (isMemberDeath && member) {
      setF(s => ({ ...s, deceasedName: member.name, deceasedCitizenId: member.citizenId || '', benefName: s.benefName || '' }));
    }
  }, [isMemberDeath, member]);

  const memberEligible = member ? window.reliefMemberEligible(member.status) : true;

  const reqNo = window.reliefNextDocNo(list, (new Date(reqDate).getFullYear() + 543));

  // ── เปลี่ยนประเภท/สวัสดิการ (เตือนหากกรอกข้อมูลแล้ว) ──
  const doChangeWelfare = (v) => {
    const first = window.reliefTypesOf(v)[0];
    setWelfareCode(v);
    setF(s => ({ ...RU_INIT, typeCode: first ? first.code : '', trackingNo: s.trackingNo, payBy: s.payBy }));
    setDirty(false); setError('');
  };
  const doChangeType = (v) => {
    setF(s => {
      const keep = { ...RU_INIT, typeCode: v, trackingNo: s.trackingNo, note: s.note, requested: reqTouched ? s.requested : '', payBy: s.payBy };
      return keep;
    });
    setDirty(false); setError('');
  };
  const changeWelfare = (v) => {
    if (v === welfareCode) return;
    if (dirty) setPending({ welfare: v });
    else doChangeWelfare(v);
  };
  const changeType = (v) => {
    if (v === f.typeCode) return;
    if (dirty) setPending({ type: v });
    else doChangeType(v);
  };
  const confirmPending = () => {
    if (pending.welfare) doChangeWelfare(pending.welfare);
    else if (pending.type) doChangeType(pending.type);
    setPending(null);
  };

  const pickMember = (m) => {
    setMember(m); setError('');
    setF(s => {
      const next = { ...s };
      if (s.payBy === 'CBT') { next.payAccount = window.memberPrimaryAccount(m.code, 'bank'); next.accName = m.name; }
      if (s.payBy === 'TRN') { next.coopAccount = window.memberPrimaryAccount(m.code, 'coop'); next.coopAccName = m.name; }
      if (isMemberDeath) { next.deceasedName = m.name; next.deceasedCitizenId = m.citizenId || ''; }
      return next;
    });
  };
  const setDefaultPay = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนดึงบัญชีเริ่มต้น'); return; }
    setF(s => {
      if (s.payBy === 'CBT') return { ...s, payAccount: window.memberPrimaryAccount(member.code, 'bank'), accName: member.name, bank: s.bank || 'ktb' };
      if (s.payBy === 'TRN') return { ...s, coopAccount: window.memberPrimaryAccount(member.code, 'coop'), coopAccName: member.name };
      return s;
    });
    setDirty(true);
  };
  const changePayBy = (v) => {
    setF(s => {
      const next = { ...s, payBy: v };
      if (v === 'CBT' && member) { next.payAccount = window.memberPrimaryAccount(member.code, 'bank'); next.accName = member.name; }
      if (v === 'TRN' && member) { next.coopAccount = window.memberPrimaryAccount(member.code, 'coop'); next.coopAccName = member.name; }
      return next;
    });
    setError(''); setDirty(true);
  };

  // ── ที่อยู่บ้านที่ประสบภัย (cascade) ──
  const setProvince = (v) => setF(s => ({ ...s, province: v, amphoe: '', tambon: '', postal: '' }));
  const setAmphoe = (v) => setF(s => ({ ...s, amphoe: v, tambon: '', postal: '' }));
  const setTambon = (v) => setF(s => ({ ...s, tambon: v, postal: window.reliefPostal(s.province, s.amphoe, v) }));

  const toggleDoc = (id) => setDocs(ds => ds.map(d => d.id === id ? { ...d, attached: !d.attached } : d));
  const setDocStatus = (id, v) => setDocs(ds => ds.map(d => d.id === id ? { ...d, status: v } : d));

  // ── สร้าง record ──
  const build = () => {
    const base = {
      id: reqNo, reqDate, enteredBy: RU_USER,
      welfareCode, welfareName: window.reliefWelfareName(welfareCode),
      typeCode: f.typeCode, memberCode: member.code, memberName: member.name,
      trackingNo: f.trackingNo.trim(),
      eligible, requested: effRequested,
      over120: f.over120 || over120Auto, over120Reason: f.over120Reason.trim(),
      note: f.note.trim(),
      payBy: f.payBy, status: 'entered', payDate: '',
      disburse: disburse.filter(l => l.cat || Number(l.amount)),
      docs: docs.map(d => ({ type: d.type, attached: d.attached, status: d.status })),
    };
    if (cat === 'death') Object.assign(base, {
      deceasedName: f.deceasedName.trim(), deceasedCitizenId: f.deceasedCitizenId.trim(),
      deceasedDeathDate: f.deceasedDeathDate, deceasedAge: Number(f.deceasedAge) || 0, deceasedCause: f.deceasedCause.trim(),
      deathCertNo: f.deathCertNo.trim(), deathCertDate: f.deathCertDate, deathCertOrg: f.deathCertOrg.trim(),
    });
    if (isMemberDeath) Object.assign(base, {
      benefName: f.benefName.trim(), benefCitizenId: f.benefCitizenId.trim(),
      benefRelation: f.benefRelation, benefPhone: f.benefPhone.trim(), benefAddr: f.benefAddr.trim(),
    });
    if (cat === 'disaster') Object.assign(base, {
      disasterDate: f.disasterDate, disasterKind: typeObj.other ? f.otherKind.trim() : typeObj.kind,
      damage: f.damage, disasterDetail: f.disasterDetail.trim(),
      certOrg: f.certOrg.trim(), certNo: f.certNo.trim(), certDate: f.certDate,
      houseRegNo: f.houseRegNo.trim(), houseNo: f.houseNo.trim(), moo: f.moo.trim(), soi: f.soi.trim(), road: f.road.trim(),
      province: f.province, amphoe: f.amphoe, tambon: f.tambon, postal: f.postal,
      residence: f.residence, mainHouse: f.mainHouse,
    });
    if (cat === 'disability') Object.assign(base, {
      disabDate: f.disabDate, disabType: typeObj.dtype, disabLevel: f.disabLevel, disabCause: f.disabCause.trim(),
      hospital: f.hospital.trim(), medCertNo: f.medCertNo.trim(), medCertDate: f.medCertDate, renewDate: f.renewDate,
    });
    if (cat === 'general') Object.assign(base, {
      eventDate: f.eventDate, reqDetail: f.reqDetail.trim(), reqReason: f.reqReason.trim(), boardRef: f.boardRef.trim(),
    });
    // ฟิลด์การรับเงินตามวิธี
    if (f.payBy === 'CBT') Object.assign(base, { bank: f.bank, acctType: f.acctType, payAccount: f.payAccount.trim(), accName: f.accName.trim(), branch: f.branch.trim() });
    if (f.payBy === 'CSH') Object.assign(base, { cashName: f.cashName.trim(), cashCitizenId: f.cashCitizenId.trim(), cashPhone: f.cashPhone.trim(), cashNote: f.cashNote.trim() });
    if (f.payBy === 'MON') Object.assign(base, { moName: f.moName.trim(), moAddr: f.moAddr.trim(), moProvince: f.moProvince, moPostal: f.moPostal.trim(), moNo: f.moNo.trim() });
    if (f.payBy === 'TRN') Object.assign(base, { coopAccount: f.coopAccount.trim(), coopAcctType: f.coopAcctType, coopAccName: f.coopAccName.trim() });
    if (f.payBy === 'ZZZ') Object.assign(base, { otherPay: f.otherPay.trim() });
    return base;
  };

  // ── ตรวจสอบก่อนบันทึก ──
  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิกผู้ขอใช้สิทธิก่อนบันทึก';
    if (!memberEligible) return `สมาชิกไม่เข้าเงื่อนไขการขอสวัสดิการ (สถานะ: ${member.status})`;
    if (cat === 'death') {
      if (!f.deceasedName.trim()) return 'กรุณากรอกชื่อผู้เสียชีวิต';
      if (f.deceasedCitizenId.trim() && f.deceasedCitizenId.replace(/\D/g, '').length !== 13) return 'เลขบัตรประชาชนผู้เสียชีวิตต้องมี 13 หลัก';
      if (!f.deceasedDeathDate) return 'กรุณาระบุวันเสียชีวิต';
      if (!f.deceasedCause.trim()) return 'กรุณาระบุสาเหตุการเสียชีวิต';
      if (isMemberDeath) {
        if (!f.benefName.trim()) return 'กรุณาระบุชื่อผู้รับเงิน (กรณีสมาชิกเสียชีวิต)';
        if (f.benefCitizenId.replace(/\D/g, '').length !== 13) return 'เลขบัตรประชาชนผู้รับเงินต้องมี 13 หลัก';
      }
    }
    if (cat === 'disaster') {
      if (!f.disasterDate) return 'กรุณาระบุวันประสบภัย';
      if (!f.disasterDetail.trim()) return 'กรุณาระบุรายละเอียดเหตุการณ์';
      if (typeObj.other && !f.otherKind.trim()) return 'กรุณาระบุประเภทภัยพิบัติอื่น';
      if (!f.houseRegNo.trim()) return 'กรุณากรอกรหัสทะเบียนบ้าน';
      if (!f.houseNo.trim()) return 'กรุณากรอกบ้านเลขที่';
      if (!f.province) return 'กรุณาเลือกจังหวัด';
      if (!f.amphoe) return 'กรุณาเลือกอำเภอ/เขต';
      if (!f.tambon) return 'กรุณาเลือกตำบล/แขวง';
      if (!f.postal.trim()) return 'กรุณาระบุรหัสไปรษณีย์';
      if (typeObj.ownerOnly && f.residence !== 'owner') return 'ประเภทอุทกภัยเจ้าของบ้าน ต้องเลือกสถานะที่พักอาศัย = เจ้าของบ้าน';
    }
    if (cat === 'disability') {
      if (!f.disabDate) return 'กรุณาระบุวันที่ทุพพลภาพ';
      if (!f.disabCause.trim()) return 'กรุณาระบุสาเหตุการทุพพลภาพ';
      if (typeObj.renew && !f.renewDate) return 'ทุพพลภาพชั่วคราว ต้องระบุวันที่ครบกำหนดต่ออายุ';
    }
    if (cat === 'general') {
      if (!f.reqDetail.trim()) return 'กรุณาระบุรายละเอียดคำขอ';
      if (!f.reqReason.trim()) return 'กรุณาระบุเหตุผลการขอ';
    }
    if (effRequested <= 0) return 'ยอดที่ขอต้องมากกว่า 0';
    if (eligible > 0 && effRequested > eligible) return 'ยอดที่ขอต้องไม่เกินยอดสิทธิ';
    if (cfgMaxAmount > 0 && effRequested > cfgMaxAmount) return `ยอดที่ขอต้องไม่เกินสิทธิสูงสุด ${fmt.money(cfgMaxAmount, 2)} บาท (ตั้งค่าในเมนูค่าคงที่ประเภทเงินสงเคราะห์)`;
    if (rightsExhausted) return `สมาชิกใช้สิทธิสวัสดิการประเภทนี้ครบตามจำนวนสิทธิสูงสุดแล้ว (${rightsUsed}/${cfgMaxRights} ครั้ง)`;
    if ((f.over120 || over120Auto) && !f.over120Reason.trim()) return 'กรุณาระบุเหตุผลกรณียื่นเอกสารเกิน 120 วัน';
    // วิธีรับเงิน
    if (f.payBy === 'CBT' && (!f.bank || !f.payAccount.trim() || !f.accName.trim())) return 'กรุณากรอกธนาคาร เลขที่บัญชี และชื่อบัญชี (CBT)';
    if (f.payBy === 'CSH' && !f.cashName.trim()) return 'กรุณาระบุชื่อผู้รับเงินสด (CSH)';
    if (f.payBy === 'MON' && (!f.moName.trim() || !f.moAddr.trim() || !f.moPostal.trim())) return 'กรุณากรอกชื่อผู้รับ ที่อยู่ และรหัสไปรษณีย์ (MON)';
    if (f.payBy === 'TRN' && !f.coopAccount.trim()) return 'กรุณาระบุบัญชีเงินฝากสหกรณ์ (TRN)';
    return '';
  };
  const submit = (alsoPrint) => {
    const err = validate();
    if (err) { setError(err); return; }
    onSubmit(build(), alsoPrint);
  };

  const provs = window.reliefProvinces();

  return (
    <div data-screen-label="หน้าสร้างคำขอเงินสงเคราะห์สมาชิก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างคำขอเงินสงเคราะห์สมาชิก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เลือกประเภทสวัสดิการ — ระบบจะแสดงเฉพาะกลุ่มข้อมูลที่เกี่ยวข้อง
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนคำขอ</button>
        <button className="btn sm" onClick={() => submit(true)}><Icon name="print" /> บันทึกและพิมพ์</button>
        <button className="btn primary sm" onClick={() => submit(false)}><Icon name="check" /> บันทึกคำขอ</button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ══ 1. ข้อมูลคำขอ ══ */}
      <RuGroupCard title="ข้อมูลคำขอ" desc="เลือกสวัสดิการและประเภทเพื่อแสดงกลุ่มข้อมูลที่เกี่ยวข้อง" style={{ background: 'var(--bg-subtle, var(--bg-hover))' }}>
        <div className="ru-head-grid">
          <RuField label="สวัสดิการ" required>
            <select className="cfg-input" value={welfareCode} onChange={(e) => changeWelfare(e.target.value)}>
              {window.RELIEF_WELFARES.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>
          </RuField>
          <RuField label="ประเภทสวัสดิการ" required>
            <select className="cfg-input" value={f.typeCode} onChange={(e) => changeType(e.target.value)}>
              {window.reliefTypesOf(welfareCode).map(t => <option key={t.code} value={t.code}>{t.code} - {t.label}</option>)}
            </select>
          </RuField>
          <RuField label="วันที่ยื่นคำขอ" required hint="(พ.ศ.)">
            <ErpDate value={reqDate} onChange={(v) => ((e) => { setReqDate(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </RuField>
          <RuField label="เลขใบคำขอ" hint="(อัตโนมัติเมื่อบันทึก)">
            <input className="cfg-input mono sr-readonly" value="Auto" readOnly />
          </RuField>
          <RuField label="ผู้ป้อนคำขอ" hint="(ล็อกอิน)">
            <input className="cfg-input sr-readonly" value={RU_USER} readOnly />
          </RuField>
          <RuField label="สถานะคำขอ">
            <div style={{ paddingTop: 4 }}><span className="pill neutral">0 : ป้อนคำขอ</span></div>
          </RuField>
        </div>
      </RuGroupCard>

      {/* ══ 2. ข้อมูลสมาชิกผู้ขอใช้สิทธิ ══ */}
      <RuGroupCard title={isMemberDeath ? 'รายละเอียดสมาชิกผู้เสียชีวิต' : 'ข้อมูลสมาชิกผู้ขอใช้สิทธิ'}
                   style={{ marginTop: 12 }}
                   tag={member ? (memberEligible ? 'สถานะ: ' + member.status : '⚠ ' + member.status) : null}>
        <div className="sr-member-row1">
          <RuField label="เลขสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={(m) => pickMember(window.reliefMember(m.code))}
                               source={window.MEMBERS_LIST} title="ค้นหาสมาชิกผู้ขอใช้สิทธิ" />
          </RuField>
          <RuField label="ชื่อ-สกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </RuField>
        </div>
        {member && !memberEligible && (
          <div className="ru-inline-warn"><Icon name="info" size={13} /> สมาชิกไม่เข้าเงื่อนไขการขอสวัสดิการประเภทนี้ (สถานะ {member.status})</div>
        )}
        <div className="ru-member-grid" style={{ marginTop: 14 }}>
          <RuField label="วันที่เป็นสมาชิก">
            <input className="cfg-input sr-auto mono" value={member ? fmt.date(member.joinDate) : ''} readOnly placeholder="—" />
          </RuField>
          <RuField label="อายุสมาชิก" hint="(ปี)">
            <input className="cfg-input sr-auto mono" value={member ? memberYears.toFixed(2) : ''} readOnly placeholder="—" />
          </RuField>
          <RuField label="งวดหุ้นที่ส่ง">
            <input className="cfg-input sr-auto mono" value={member ? member.shareTerms + ' งวด' : ''} readOnly placeholder="—" />
          </RuField>
          <RuField label="สถานะสมาชิก">
            <input className="cfg-input sr-auto" value={member ? member.status : ''} readOnly placeholder="—" />
          </RuField>
          <RuField label="สังกัด" span={2}>
            <input className="cfg-input sr-auto" value={member ? member.deptCode + ' · ' + member.dept : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </RuField>
          <RuField label="เลขติดตามงาน" hint="(ไม่บังคับ)">
            <input className="cfg-input mono sr-in-green" value={f.trackingNo}
                   onChange={(e) => set('trackingNo', e.target.value)} placeholder="เช่น TRK-690608-01" />
          </RuField>
          <RuField label="ประวัติการใช้สิทธิ">
            <button className="btn dashed sm" type="button" disabled={!member} onClick={() => setUsageOpen(true)} style={{ width: '100%' }}>
              <Icon name="history" size={13} /> ดูประวัติ{member ? ` (${window.reliefUsageHistory(member.code).length})` : ''}
            </button>
          </RuField>
        </div>
      </RuGroupCard>

      {/* ══ 3. รายละเอียดผู้เสียชีวิต (death) ══ */}
      {has('deceased') && (
        <RuGroupCard title="รายละเอียดผู้เสียชีวิต" desc={isMemberDeath ? 'ดึงจากข้อมูลสมาชิกโดยอัตโนมัติ' : `ความสัมพันธ์: ${typeObj.relation}`} style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="ชื่อผู้เสียชีวิต" required>
              <input className={"cfg-input" + (isMemberDeath ? ' sr-auto' : '')} value={f.deceasedName} readOnly={isMemberDeath}
                     onChange={(e) => set('deceasedName', e.target.value)} placeholder="ชื่อ-สกุลผู้เสียชีวิต" />
            </RuField>
            <RuField label="ความสัมพันธ์" required>
              <input className="cfg-input sr-auto" value={typeObj.relation || '—'} readOnly />
            </RuField>
            <RuField label="เลขบัตรประชาชนผู้เสียชีวิต" required hint="(13 หลัก)">
              <input className={"cfg-input mono" + (isMemberDeath ? ' sr-auto' : '')} value={f.deceasedCitizenId} maxLength={20} readOnly={isMemberDeath}
                     onChange={(e) => set('deceasedCitizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" />
            </RuField>
            <RuField label="วันเสียชีวิต" required>
              <ErpDate value={f.deceasedDeathDate} onChange={(v) => ((e) => set('deceasedDeathDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
            <RuField label="อายุผู้เสียชีวิต" hint="(ปี · ไม่บังคับ)">
              <input className="cfg-input mono" type="number" min="0" value={f.deceasedAge} onChange={(e) => set('deceasedAge', e.target.value)} placeholder="0" />
            </RuField>
            <RuField label="สาเหตุการเสียชีวิต" required>
              <input className="cfg-input" value={f.deceasedCause} onChange={(e) => set('deceasedCause', e.target.value)} placeholder="เช่น ชราภาพ, โรคประจำตัว, อุบัติเหตุ" />
            </RuField>
            <RuField label="เลขที่ใบมรณบัตร" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.deathCertNo} onChange={(e) => set('deathCertNo', e.target.value)} placeholder="—" />
            </RuField>
            <RuField label="วันที่ออกใบมรณบัตร" hint="(ไม่บังคับ)">
              <ErpDate value={f.deathCertDate} onChange={(v) => ((e) => set('deathCertDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
            <RuField label="หน่วยงานที่ออกเอกสาร" hint="(ไม่บังคับ)" full>
              <input className="cfg-input" value={f.deathCertOrg} onChange={(e) => set('deathCertOrg', e.target.value)} placeholder="เช่น ที่ว่าการอำเภอ / สำนักงานเขต" />
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 4. ผู้รับผลประโยชน์ / ผู้รับเงิน (สมาชิกเสียชีวิต) ══ */}
      {has('beneficiary') && (
        <RuGroupCard title="ผู้รับผลประโยชน์ / ผู้รับเงิน" desc="กรณีสมาชิกเสียชีวิต — ระบุผู้มีสิทธิรับเงิน" style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="ชื่อผู้รับเงิน" required>
              <input className="cfg-input" value={f.benefName} onChange={(e) => set('benefName', e.target.value)} placeholder="ชื่อ-สกุลผู้รับเงิน" />
            </RuField>
            <RuField label="ความสัมพันธ์กับสมาชิก" required>
              <select className="cfg-input" value={f.benefRelation} onChange={(e) => set('benefRelation', e.target.value)}>
                {window.RELIEF_RELATIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            <RuField label="เลขบัตรประชาชนผู้รับเงิน" required hint="(13 หลัก)">
              <input className="cfg-input mono" value={f.benefCitizenId} maxLength={20} onChange={(e) => set('benefCitizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" />
            </RuField>
            <RuField label="เบอร์โทรศัพท์" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.benefPhone} onChange={(e) => set('benefPhone', e.target.value)} placeholder="08x-xxx-xxxx" />
            </RuField>
            <RuField label="ที่อยู่ผู้รับเงิน" hint="(กรณีจ่ายเงินสด/ธนาณัติ)" full>
              <textarea className="cfg-input" rows={2} value={f.benefAddr} onChange={(e) => set('benefAddr', e.target.value)} placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ / จังหวัด" />
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 5. รายละเอียดภัยพิบัติ (disaster) ══ */}
      {has('disaster') && (
        <RuGroupCard title="รายละเอียดภัยพิบัติ" desc={`ประเภทภัย: ${typeObj.kind}`} tag={typeObj.special ? 'ส่งอนุมัติพิเศษ' : null} style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="วันประสบภัย" required>
              <ErpDate value={f.disasterDate} onChange={(v) => ((e) => set('disasterDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
            <RuField label="ประเภทภัยพิบัติ" required>
              <input className="cfg-input sr-auto" value={typeObj.kind || '—'} readOnly />
            </RuField>
            {typeObj.other && (
              <RuField label="ระบุประเภทภัยพิบัติอื่น" required full>
                <input className="cfg-input" value={f.otherKind} onChange={(e) => set('otherKind', e.target.value)} placeholder="ระบุประเภทภัยพิบัติ" />
              </RuField>
            )}
            <RuField label="ระดับความเสียหาย" required>
              <select className="cfg-input" value={f.damage} onChange={(e) => set('damage', e.target.value)}>
                {window.RELIEF_DAMAGE_LEVELS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            <RuField label="หน่วยงานรับรอง" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.certOrg} onChange={(e) => set('certOrg', e.target.value)} placeholder="เช่น อบต., เทศบาล, อำเภอ" />
            </RuField>
            <RuField label="สาเหตุ / รายละเอียดเหตุการณ์" required full>
              <textarea className="cfg-input" rows={2} value={f.disasterDetail} onChange={(e) => set('disasterDetail', e.target.value)} placeholder="อธิบายเหตุการณ์และความเสียหาย" />
            </RuField>
            <RuField label="เลขที่หนังสือรับรอง" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.certNo} onChange={(e) => set('certNo', e.target.value)} placeholder="—" />
            </RuField>
            <RuField label="วันที่ออกหนังสือรับรอง" hint="(ไม่บังคับ)">
              <ErpDate value={f.certDate} onChange={(v) => ((e) => set('certDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 6. บ้านที่ประสบภัยพิบัติ (disaster) ══ */}
      {has('house') && (
        <RuGroupCard title="บ้านที่ประสบภัยพิบัติ" desc={typeObj.ownerOnly ? 'ประเภทเจ้าของบ้าน — สถานะที่พักอาศัยต้องเป็น “เจ้าของบ้าน”' : null} style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="รหัสทะเบียนบ้าน" required hint="(ไม่ต้องใส่ -)">
              <input className="cfg-input mono" value={f.houseRegNo} onChange={(e) => set('houseRegNo', e.target.value.replace(/\D/g, ''))} placeholder="11 หลัก" maxLength={11} />
            </RuField>
            <RuField label="บ้านเลขที่" required>
              <input className="cfg-input" value={f.houseNo} onChange={(e) => set('houseNo', e.target.value)} placeholder="เช่น 88/12" />
            </RuField>
            <RuField label="หมู่" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.moo} onChange={(e) => set('moo', e.target.value)} />
            </RuField>
            <RuField label="ซอย" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.soi} onChange={(e) => set('soi', e.target.value)} />
            </RuField>
            <RuField label="ถนน" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.road} onChange={(e) => set('road', e.target.value)} />
            </RuField>
            <RuField label="จังหวัด" required>
              <select className="cfg-input" value={f.province} onChange={(e) => setProvince(e.target.value)}>
                <option value="">— เลือกจังหวัด —</option>
                {provs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </RuField>
            <RuField label="อำเภอ/เขต" required>
              <select className="cfg-input" value={f.amphoe} disabled={!f.province} onChange={(e) => setAmphoe(e.target.value)}>
                <option value="">— เลือกอำเภอ —</option>
                {window.reliefAmphoes(f.province).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </RuField>
            <RuField label="ตำบล/แขวง" required>
              <select className="cfg-input" value={f.tambon} disabled={!f.amphoe} onChange={(e) => setTambon(e.target.value)}>
                <option value="">— เลือกตำบล —</option>
                {window.reliefTambons(f.province, f.amphoe).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </RuField>
            <RuField label="รหัสไปรษณีย์" required hint="(Auto จากตำบล)">
              <input className="cfg-input mono" value={f.postal} onChange={(e) => set('postal', e.target.value)} placeholder="—" maxLength={5} />
            </RuField>
            <RuField label="สถานะที่พักอาศัย" required>
              <select className="cfg-input" value={f.residence} onChange={(e) => set('residence', e.target.value)}>
                {window.RELIEF_RESIDENCE.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            <RuField label="เป็นบ้านหลักหรือไม่">
              <label className="ru-inline-check"><input type="checkbox" checked={f.mainHouse} onChange={(e) => set('mainHouse', e.target.checked)} /> <span>เป็นบ้านหลัก</span></label>
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 7. รายละเอียดทุพพลภาพ (disability) ══ */}
      {has('disability') && (
        <RuGroupCard title="รายละเอียดทุพพลภาพ" desc={`ประเภท: ${typeObj.dtype}`} tag={typeObj.renew ? 'ต้องต่ออายุ' : null} style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="เลขบัตรประชาชน" hint="(ดึงจากสมาชิก)">
              <input className="cfg-input mono sr-auto" value={member ? (member.citizenId || '—') : ''} readOnly placeholder="—" />
            </RuField>
            <RuField label="ผู้ทุพพลภาพ" hint="(ดึงจากสมาชิก)">
              <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="—" />
            </RuField>
            <RuField label="วันที่ทุพพลภาพ" required>
              <ErpDate value={f.disabDate} onChange={(v) => ((e) => set('disabDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
            <RuField label="ประเภททุพพลภาพ" required>
              <input className="cfg-input sr-auto" value={typeObj.dtype || '—'} readOnly />
            </RuField>
            <RuField label="ระดับทุพพลภาพ" required>
              <select className="cfg-input" value={f.disabLevel} onChange={(e) => set('disabLevel', e.target.value)}>
                {window.RELIEF_DISAB_LEVELS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            {typeObj.renew && (
              <RuField label="วันที่ครบกำหนดต่ออายุ" required>
                <ErpDate value={f.renewDate} onChange={(v) => ((e) => set('renewDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
              </RuField>
            )}
            <RuField label="สาเหตุ" required full>
              <textarea className="cfg-input" rows={2} value={f.disabCause} onChange={(e) => set('disabCause', e.target.value)} placeholder="อุบัติเหตุ / โรค / การทำงาน / อื่น ๆ" />
            </RuField>
            <RuField label="โรงพยาบาล / หน่วยแพทย์" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.hospital} onChange={(e) => set('hospital', e.target.value)} placeholder="ออกใบรับรองแพทย์" />
            </RuField>
            <RuField label="เลขที่ใบรับรองแพทย์" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.medCertNo} onChange={(e) => set('medCertNo', e.target.value)} placeholder="—" />
            </RuField>
            <RuField label="วันที่ออกใบรับรองแพทย์" hint="(ไม่บังคับ)">
              <ErpDate value={f.medCertDate} onChange={(v) => ((e) => set('medCertDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 8. สวัสดิการทั่วไป (general) ══ */}
      {has('general') && (
        <RuGroupCard title="รายละเอียดคำขอ (สวัสดิการทั่วไป)" tag={typeObj.special ? 'ส่งอนุมัติพิเศษ' : null} style={{ marginTop: 12 }}>
          <div className="ru-dec-grid">
            <RuField label="วันที่เกิดเหตุ" hint="(ตามเงื่อนไข)">
              <ErpDate value={f.eventDate} onChange={(v) => ((e) => set('eventDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </RuField>
            <RuField label="อ้างอิงมติกรรมการ" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.boardRef} onChange={(e) => set('boardRef', e.target.value)} placeholder="เลขที่ประชุม / มติ" />
            </RuField>
            <RuField label="รายละเอียดคำขอ" required full>
              <textarea className="cfg-input" rows={2} value={f.reqDetail} onChange={(e) => set('reqDetail', e.target.value)} placeholder="ระบุรายละเอียดการขอรับเงิน" />
            </RuField>
            <RuField label="เหตุผลการขอ" required full>
              <textarea className="cfg-input" rows={2} value={f.reqReason} onChange={(e) => set('reqReason', e.target.value)} placeholder="ระบุเหตุผล" />
            </RuField>
          </div>
        </RuGroupCard>
      )}

      {/* ══ 9. สิทธิและยอดเงิน ══ */}
      <RuGroupCard title="สิทธิและยอดเงิน" style={{ marginTop: 12 }}>
        {typeCfg && (cfgMaxAmount > 0 || cfgMaxRights > 0) && (
          <div className={"ru-cfg-strip" + (rightsExhausted ? ' warn' : '')}>
            <Icon name={rightsExhausted ? 'lock' : 'shield'} size={13} />
            <span>ค่าคงที่ประเภทนี้:</span>
            {cfgMaxAmount > 0 && <span className="ru-cfg-item">สิทธิสูงสุด <b>฿ {fmt.money(cfgMaxAmount, 0)}</b>/ครั้ง</span>}
            {cfgMaxRights > 0 && (
              <span className="ru-cfg-item">
                จำนวนสิทธิสูงสุด <b>{cfgMaxRights}</b> ครั้ง
                {member && <> · ใช้ไปแล้ว <b>{rightsUsed}</b> · เหลือ <b>{rightsLeft}</b></>}
              </span>
            )}
            {rightsExhausted && <span className="ru-cfg-item bad">ใช้สิทธิครบแล้ว</span>}
          </div>
        )}
        <div className="ru-amt-wrap">
          <div className="ru-amt-fields">
            <RuField label="สิทธิ" hint="(คำนวณอัตโนมัติ)">
              <input className="cfg-input mono sr-readonly" value={typeObj.manual ? 'กำหนดโดยผู้อนุมัติ' : fmt.money(eligible, 2)} readOnly />
            </RuField>
            <RuField label="ยอดที่ขอ" required>
              <input className="cfg-input mono" type="number" step="0.01" min="0"
                     value={f.requested === '' ? '' : f.requested}
                     onChange={(e) => { setReqTouched(true); set('requested', e.target.value); }}
                     placeholder={fmt.money(eligible, 2)} />
            </RuField>
          </div>
          <div className="ru-eligible-box">
            <div className="sr-amount-label">ยอดที่จะอนุมัติจ่าย</div>
            <div className="sr-amount-value">฿ {fmt.money(effRequested, 2)}</div>
            <div className="sr-amount-sub">
              {typeObj.manual ? 'สวัสดิการทั่วไป — ยอดตามที่ขอ/อนุมัติ'
                : eligible > 0
                  ? (typeObj.member ? `สิทธิตามอายุการเป็นสมาชิก ${window.reliefTierLabel(memberYears)}`
                    : typeObj.byDamage ? `สิทธิตามระดับความเสียหาย: ${window.reliefLabel('damage', f.damage)}`
                    : `${typeObj.label} · สิทธิคงที่`)
                  : 'ไม่พบสิทธิสำหรับเงื่อนไขที่เลือก'}
            </div>
          </div>
        </div>
        <div className="ru-note-block">
          <label className={"ru-check" + (over120Auto ? ' on' : '')}>
            <input type="checkbox" checked={f.over120 || over120Auto} disabled={over120Auto}
                   onChange={(e) => set('over120', e.target.checked)} />
            <span>ยื่นเอกสารเกินกว่า 120 วัน{eventDate ? ` — นับจากวันเกิดเหตุ ${daysSince} วัน` : ''}{over120Auto ? ' (ระบบบังคับเลือก)' : ''}</span>
          </label>
          {(f.over120 || over120Auto) && (
            <RuField label="เหตุผลกรณียื่นเกิน 120 วัน" required full>
              <textarea className="cfg-input" rows={2} value={f.over120Reason} onChange={(e) => set('over120Reason', e.target.value)} placeholder="ระบุเหตุผลที่ยื่นเอกสารเกินกำหนด" />
            </RuField>
          )}
          <RuField label="หมายเหตุ" hint="(ไม่บังคับ)" full>
            <textarea className="cfg-input" rows={2} value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="บันทึกรายละเอียดเพิ่มเติม…" />
          </RuField>
        </div>
      </RuGroupCard>

      {/* ══ 10. รายละเอียดการรับเงิน ══ */}
      <RuGroupCard title="รายละเอียดการรับเงิน" style={{ marginTop: 12 }}>
        <div className="ru-pay-head">
          <RuField label="รับเงินโดย" required>
            <select className="cfg-input" value={f.payBy} onChange={(e) => changePayBy(e.target.value)}>
              {window.RELIEF_PAY_BY.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </RuField>
          {(f.payBy === 'CBT' || f.payBy === 'TRN') && (
            <button className="btn dashed sm" type="button" onClick={setDefaultPay} style={{ alignSelf: 'flex-end' }}>
              <Icon name="download" size={13} /> Set default รับจ่าย
            </button>
          )}
        </div>

        {f.payBy === 'CBT' && (
          <div className="ru-dec-grid" style={{ marginTop: 12 }}>
            <RuField label="ธนาคาร" required>
              <select className="cfg-input" value={f.bank} onChange={(e) => set('bank', e.target.value)}>
                {window.RELIEF_BANKS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            <RuField label="ประเภทบัญชี">
              <select className="cfg-input" value={f.acctType} onChange={(e) => set('acctType', e.target.value)}>
                {window.RELIEF_ACCT_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </RuField>
            <RuField label="เลขที่บัญชี" required>
              <input className="cfg-input mono" value={f.payAccount} onChange={(e) => set('payAccount', e.target.value)} placeholder="เลขที่บัญชีธนาคาร" />
            </RuField>
            <RuField label="ชื่อบัญชี" required>
              <input className="cfg-input" value={f.accName} onChange={(e) => set('accName', e.target.value)} placeholder="ชื่อเจ้าของบัญชี" />
            </RuField>
            <RuField label="สาขา" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.branch} onChange={(e) => set('branch', e.target.value)} placeholder="สาขาธนาคาร" />
            </RuField>
          </div>
        )}
        {f.payBy === 'CSH' && (
          <div className="ru-dec-grid" style={{ marginTop: 12 }}>
            <RuField label="ชื่อผู้รับเงินสด" required>
              <input className="cfg-input" value={f.cashName} onChange={(e) => set('cashName', e.target.value)} placeholder="ชื่อ-สกุลผู้รับเงิน" />
            </RuField>
            <RuField label="เลขบัตรประชาชนผู้รับเงิน" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.cashCitizenId} onChange={(e) => set('cashCitizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" maxLength={20} />
            </RuField>
            <RuField label="เบอร์โทรศัพท์" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.cashPhone} onChange={(e) => set('cashPhone', e.target.value)} placeholder="08x-xxx-xxxx" />
            </RuField>
            <RuField label="หมายเหตุการรับเงินสด" hint="(ไม่บังคับ)">
              <input className="cfg-input" value={f.cashNote} onChange={(e) => set('cashNote', e.target.value)} placeholder="—" />
            </RuField>
            <div className="ru-pay-note" style={{ gridColumn: '1 / -1' }}><Icon name="info" size={12} /> ต้องพิมพ์ใบสำคัญจ่ายและมีลายเซ็นผู้รับเงิน</div>
          </div>
        )}
        {f.payBy === 'MON' && (
          <div className="ru-dec-grid" style={{ marginTop: 12 }}>
            <RuField label="ชื่อผู้รับธนาณัติ" required>
              <input className="cfg-input" value={f.moName} onChange={(e) => set('moName', e.target.value)} placeholder="ชื่อ-สกุลผู้รับ" />
            </RuField>
            <RuField label="เลขที่ธนาณัติ" hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.moNo} onChange={(e) => set('moNo', e.target.value)} placeholder="—" />
            </RuField>
            <RuField label="ที่อยู่จัดส่ง" required full>
              <textarea className="cfg-input" rows={2} value={f.moAddr} onChange={(e) => set('moAddr', e.target.value)} placeholder="บ้านเลขที่ / หมู่ / ตำบล / อำเภอ" />
            </RuField>
            <RuField label="จังหวัด">
              <select className="cfg-input" value={f.moProvince} onChange={(e) => set('moProvince', e.target.value)}>
                <option value="">— เลือกจังหวัด —</option>
                {provs.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </RuField>
            <RuField label="รหัสไปรษณีย์" required>
              <input className="cfg-input mono" value={f.moPostal} onChange={(e) => set('moPostal', e.target.value)} placeholder="—" maxLength={5} />
            </RuField>
          </div>
        )}
        {f.payBy === 'TRN' && (
          <div className="ru-dec-grid" style={{ marginTop: 12 }}>
            <RuField label="บัญชีเงินฝากสหกรณ์" required>
              <input className="cfg-input mono" value={f.coopAccount} onChange={(e) => set('coopAccount', e.target.value)} placeholder="เลขที่บัญชีเงินฝาก" />
            </RuField>
            <RuField label="ประเภทบัญชีเงินฝาก">
              <input className="cfg-input" value={f.coopAcctType} onChange={(e) => set('coopAcctType', e.target.value)} placeholder="เช่น ออมทรัพย์" />
            </RuField>
            <RuField label="ชื่อบัญชีเงินฝาก">
              <input className="cfg-input" value={f.coopAccName} onChange={(e) => set('coopAccName', e.target.value)} placeholder="ชื่อบัญชี" />
            </RuField>
            <div className="ru-pay-note" style={{ gridColumn: '1 / -1' }}><Icon name="info" size={12} /> เมื่อจ่ายแล้วระบบจะสร้างรายการฝากเข้าในระบบเงินฝาก และอ้างอิงเลขคำขอนี้</div>
          </div>
        )}
        {f.payBy === 'ZZZ' && (
          <div className="ru-dec-grid" style={{ marginTop: 12 }}>
            <RuField label="ระบุวิธีรับเงินอื่น" full>
              <input className="cfg-input" value={f.otherPay} onChange={(e) => set('otherPay', e.target.value)} placeholder="ระบุรายละเอียดวิธีรับเงิน" />
            </RuField>
          </div>
        )}

        <div className="ru-status-row">
          <div className="ru-status-item"><div className="ru-status-k">สถานะคำขอ</div><div className="ru-status-v"><span className="pill neutral">0 : ป้อนคำขอ</span></div></div>
          <div className="ru-status-item"><div className="ru-status-k">วันที่จ่าย</div><div className="ru-status-v mono">—</div></div>
          <div className="ru-status-item"><div className="ru-status-k">สถานะการจ่าย</div><div className="ru-status-v"><span className="ru-unpaid">UNPAID</span></div></div>
        </div>
      </RuGroupCard>

      {/* ══ 10.5 รายการเบิกจ่ายและตัดงบประมาณ ══ */}
      <div style={{ marginTop: 12 }}>
        <BudgetDisburseSection structure={structure} lines={disburse} onChange={setDisburse}
                               target={effRequested} targetLabel="ยอดที่จะอนุมัติจ่าย" />
      </div>

      {/* ══ 11. เอกสารแนบ ══ */}
      <RuGroupCard title="เอกสารแนบ" desc="รายการเอกสารปรับตามประเภทสวัสดิการ" style={{ marginTop: 12 }}>
        <div className="ru-doc-list">
          {docs.map(d => {
            const ds = window.RELIEF_DOC_STATUS.find(x => x.v === d.status) || window.RELIEF_DOC_STATUS[0];
            return (
              <div className={"ru-doc-row" + (d.attached ? ' attached' : '')} key={d.id}>
                <div className="ru-doc-type"><Icon name="attach" size={14} /> {d.type}</div>
                <button className={"btn sm " + (d.attached ? 'primary' : 'dashed')} type="button" onClick={() => toggleDoc(d.id)}>
                  <Icon name={d.attached ? 'check' : 'upload'} size={13} /> {d.attached ? 'แนบแล้ว' : 'แนบไฟล์'}
                </button>
                <select className="cfg-input sm" value={d.status} disabled={!d.attached} onChange={(e) => setDocStatus(d.id, e.target.value)} style={{ width: 120 }}>
                  {window.RELIEF_DOC_STATUS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <span className={"pill " + ds.pill}>{ds.l}</span>
              </div>
            );
          })}
        </div>
      </RuGroupCard>

      {pending && (
        <RuConfirmTypeModal
          message="การเปลี่ยนประเภทสวัสดิการอาจล้างข้อมูลรายละเอียดเดิม ต้องการดำเนินการต่อหรือไม่"
          onConfirm={confirmPending} onCancel={() => setPending(null)} />
      )}
      {usageOpen && <RuUsageModal member={member} onClose={() => setUsageOpen(false)} />}
    </div>
  );
}

Object.assign(window, { RuCreateForm, RuMemberSearchModal, RuField });
