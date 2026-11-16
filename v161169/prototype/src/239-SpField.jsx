// ════════════════════════════════════════════════════════════════════
//  เพิ่ม / แก้ไขโครงการอบรม / สัมมนา / อบรมวิชาชีพ  (TOR 8.2)
//  ระบบสวัสดิการสมาชิก › งานอบรมสัมมนาและอบรมวิชาชีพ › สร้างโครงการสัมมนา
//  ฟอร์มเดียวลื่นไหล · กริด 6 คอลัมน์ (ยุบ 6→3→2→1) · หัวข้อคั่นแทนการ์ด
// ════════════════════════════════════════════════════════════════════

// ── ฟิลด์ในกริด (c = จำนวนคอลัมน์ที่กิน 1–6) ────────────────────────
function SpField({ label, required, hint, children, c = 2, note }) {
  return (
    <div className={"sr-field c" + c}>
      {label && (
        <label className="sr-label">
          {label}{required && <span className="cfg-required"> *</span>}
          {hint && <span className="sr-hint" style={{ display: 'inline', margin: 0 }}> {hint}</span>}
        </label>
      )}
      {children}
      {note && <div className="muted" style={{ fontSize: 11 }}>{note}</div>}
    </div>
  );
}

// ── ช่องอ่านอย่างเดียวที่ระบบสร้าง/คำนวณให้ ─────────────────────────
function SpAuto({ value, mono }) {
  return <div className={"cfg-input sr-auto" + (mono ? ' mono' : '')} style={{ display: 'flex', alignItems: 'center' }}>{value}</div>;
}

// ── แถวตัวเลือก (checkbox) แบบ neutral ──────────────────────────────
function SpOpt({ checked, onChange, children, hint }) {
  return (
    <label className="sem-opt">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span><b>{children}</b>{hint && <span className="muted" style={{ fontWeight: 400 }}> — {hint}</span>}</span>
    </label>
  );
}

// ── หัวข้อคั่นส่วน ───────────────────────────────────────────────────
function SecHead({ n, title, sub, right }) {
  return (
    <div className="sem-sec-head">
      <div style={{ minWidth: 0 }}>
        <h3>{title}</h3>
        {sub && <div className="sem-sec-sub">{sub}</div>}
      </div>
      {right && <span className="spacer" />}
      {right}
    </div>
  );
}

// ── ปุ่มอัปโหลดไฟล์ (จำลอง) ─────────────────────────────────────────
function SpUpload({ value, onChange }) {
  const ref = React.useRef(null);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={(e) => onChange((e.target.files[0] || {}).name || '')} />
      <button className="btn sm" type="button" onClick={() => ref.current && ref.current.click()}><Icon name="attach" size={13} /> เลือกไฟล์</button>
      {value ? (
        <span className="chip info sem-file-chip">{value}
          <button type="button" onClick={() => onChange('')} className="sem-file-x">×</button></span>
      ) : <span className="muted" style={{ fontSize: 12 }}>ยังไม่มีไฟล์ (PDF, Word)</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มหลัก
// ════════════════════════════════════════════════════════════════════
function SeminarProjectForm({ list, initial, onSubmit, onCancel, onToast }) {
  const isNew = !initial;
  const [f, setF] = useState(() => ({ ...window.semBlankProject(), ...(initial || {}) }));
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(null);
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setErr(''); setReady(null); };

  const projCode = f.id || `SEM-${f.fiscalYear || '2569'}-XXXX`;
  const confirmedCount = (f.registrants || []).filter(r => r.status === 'confirmed').length;
  const affilOpts = useMemo(() => window.semAffilOptions(), []);
  const officerOpts = useMemo(() => window.semOfficerOptions(), []);
  const budStructure = useMemo(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])), []);
  const budLeaves = useMemo(() => (window.bdLeafCats ? window.bdLeafCats(budStructure) : []), [budStructure]);
  const budCatOpts = useMemo(() => budLeaves.map(l => ({ value: l.id, label: l.name, sub: `${l.code || ''}${l.top ? ' · ' + l.top : ''}` })), [budLeaves]);

  const dn = useMemo(() => window.semDaysNights(f.dateFrom, f.dateTo || f.dateFrom), [f.dateFrom, f.dateTo]);
  const headCount = confirmedCount || Number(f.capacity) || 0;
  const expenses = f.expenses || [];
  const expensesTotal = window.semExpensesTotal(expenses, headCount);

  const amphoeOpts = window.AMPHOES[f.province] || [];
  const tambonOpts = window.TAMBONS[f.amphoe] || [];
  const setProvince = (v) => { setF(s => ({ ...s, province: v, amphoe: '', tambon: '' })); setErr(''); setReady(null); };
  const setAmphoe = (v) => { setF(s => ({ ...s, amphoe: v, tambon: '' })); setErr(''); setReady(null); };

  // ── สังกัดที่มีสิทธิ์ (multi search-select) ──
  const addDept = (code) => { if (!code) return; setF(s => ({ ...s, allowDepts: (s.allowDepts || []).includes(code) ? s.allowDepts : [...(s.allowDepts || []), code] })); setErr(''); setReady(null); };
  const removeDept = (code) => setF(s => ({ ...s, allowDepts: (s.allowDepts || []).filter(x => x !== code) }));

  // ── เจ้าหน้าที่ผู้รับผิดชอบ (multi search-select) ──
  const addOfficer = (code) => { if (!code) return; setF(s => ({ ...s, officers: (s.officers || []).includes(code) ? s.officers : [...(s.officers || []), code] })); setErr(''); setReady(null); };
  const removeOfficer = (code) => setF(s => ({ ...s, officers: (s.officers || []).filter(x => x !== code) }));

  // ── รายการค่าใช้จ่ายโครงการ ──
  const setExpenses = (next) => { setF(s => ({ ...s, expenses: next })); setErr(''); setReady(null); };
  const addExpense = () => setExpenses([...(f.expenses || []), window.semBlankExpense()]);
  const setExpense = (key, patch) => setExpenses((f.expenses || []).map(e => e.key === key ? { ...e, ...patch } : e));
  const removeExpense = (key) => setExpenses((f.expenses || []).filter(e => e.key !== key));

  // ── ตรวจสอบข้อมูล ────────────────────────────────────────────────
  const requiredChecks = () => [
    ['ชื่อโครงการ', !!f.title.trim()],
    ['ประเภทโครงการ', !!f.type],
    ['ปีงบประมาณ', !!f.fiscalYear],
    ['วันที่เริ่มโครงการ', !!f.dateFrom],
    ['วันที่สิ้นสุดโครงการ', !!(f.dateTo || f.dateFrom)],
    ['สถานที่จัดโครงการ', !!f.venue.trim()],
    ['จังหวัด / อำเภอ', !!(f.province && f.amphoe)],
    ['หน่วยงานผู้จัด', !!f.orgDept],
    ['เจ้าหน้าที่ผู้รับผิดชอบ', (f.officers || []).length > 0],
    ['จำนวนผู้เข้าร่วมสูงสุด > 0', Number(f.capacity) > 0],
  ];
  const dateChecks = () => {
    const c = [];
    const to = f.dateTo || f.dateFrom;
    if (f.dateFrom && to) c.push(['วันที่สิ้นสุด ≥ วันที่เริ่ม', to >= f.dateFrom]);
    if (f.regFrom && f.regTo) c.push(['วันเปิดรับสมัคร ≤ วันปิดรับสมัคร', f.regFrom <= f.regTo]);
    if (f.regTo && f.dateFrom) c.push(['วันปิดรับสมัคร ≤ วันเริ่มโครงการ', f.regTo <= f.dateFrom]);
    if (f.dateFrom && to && f.dateFrom === to && f.startTime && f.endTime)
      c.push(['เวลาเริ่ม < เวลาสิ้นสุด', f.startTime < f.endTime]);
    return c;
  };
  const countChecks = () => {
    const c = [['จำนวนรับสูงสุด > 0', Number(f.capacity) > 0], ['จำนวนสำรอง ≥ 0', Number(f.reserve) >= 0]];
    if (!isNew) c.push(['จำนวนรับ ≥ ผู้สมัครปัจจุบัน (' + confirmedCount + ')', Number(f.capacity) >= confirmedCount]);
    return c;
  };
  const firstFail = (groups) => { for (const g of groups) for (const [label, ok] of g) if (!ok) return label; return null; };

  const build = (status) => ({
    ...f, days: dn.days, nights: dn.nights,
    id: f.id || window.semNextNo(list, f.fiscalYear || 2569),
    capacity: Number(f.capacity) || 0, reserve: Number(f.reserve) || 0, buses: Number(f.buses) || 0,
    dateTo: f.dateTo || f.dateFrom, title: f.title.trim(),
    registrants: f.registrants || [], disburse: f.disburse || [], status,
    officers: f.officers || [],
    officer: (f.officers && f.officers.length) ? (window.semOfficerByCode(f.officers[0]) || {}).name || f.officer : f.officer,
    expenses: f.expenses || [],
    allowDepts: f.eligible === 'dept' ? (f.allowDepts || []) : [],
    createdAt: f.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
    updatedBy: isNew ? '' : (f.createdBy || 'เจ้าหน้าที่'),
    updatedAt: isNew ? '' : new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  const doSave = (status) => {
    const fail = firstFail([requiredChecks(), dateChecks(), countChecks()]);
    if (fail) return setErr('กรุณาตรวจสอบ: ' + fail);
    if (f.eligible === 'dept' && !(f.allowDepts || []).length) return setErr('กรุณาเลือกรหัสสังกัดที่มีสิทธิ์เข้าร่วมอย่างน้อย 1 รายการ');
    onSubmit(build(status), isNew, status === 'open' ? 'open' : 'save');
  };
  const doCheck = () => {
    const groups = { 'ข้อมูลบังคับ': requiredChecks(), 'วันเวลา': dateChecks(), 'จำนวนผู้เข้าร่วม': countChecks() };
    groups['เตรียมเปิดรับสมัคร'] = [
      ['กำหนดช่วงวันเปิด–ปิดรับสมัคร', !!(f.regFrom && f.regTo)],
      ['เลือก Template เอกสารเชิญ', !!f.inviteTemplate],
      ['ระบุเงื่อนไขผู้มีสิทธิ์', f.eligible !== 'dept' || (f.allowDepts || []).length > 0],
    ];
    setReady({ groups, allPass: Object.values(groups).every(g => g.every(([, ok]) => ok)) });
    setErr('');
  };
  const doCopy = () => {
    const { id, registrants, createdAt, updatedAt, updatedBy, ...rest } = f;
    onSubmit({ ...rest, id: window.semNextNo(list, f.fiscalYear || 2569), title: (f.title || '').trim() + ' (สำเนา)',
      status: 'draft', registrants: [], days: dn.days, nights: dn.nights,
      capacity: Number(f.capacity) || 0, reserve: Number(f.reserve) || 0, buses: Number(f.buses) || 0,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), updatedBy: '', updatedAt: '' }, true, 'copy');
  };
  const doCancel = () => {
    const reason = window.prompt('กรุณาระบุเหตุผลในการยกเลิกโครงการ');
    if (reason === null) return;
    if (!reason.trim()) { onToast && onToast('กรุณาระบุเหตุผลการยกเลิก'); return; }
    onSubmit({ ...build('cancelled'), remark: (f.remark ? f.remark + '\n' : '') + '[ยกเลิก] ' + reason.trim() }, false, 'cancel');
  };

  return (
    <div data-screen-label="หน้าเพิ่ม/แก้ไขโครงการอบรม-สัมมนา">
      {/* หัวเรื่อง + สถานะ */}
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{isNew ? 'สร้างโครงการอบรม / สัมมนา / อบรมวิชาชีพ' : 'แก้ไขโครงการ'}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 3, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>รหัสโครงการ <b className="mono" style={{ color: 'var(--text)' }}>{projCode}</b></span>
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> ย้อนกลับ</button>
      </div>

      {/* แท็บของหน้า */}
      <div className="tabs-bar sem-form-tabs">
        <button className="tab active">1 · ข้อมูลโครงการ</button>
        {['เงื่อนไขผู้เข้าร่วม', 'ค่าใช้จ่าย', 'เอกสารเชิญ', 'ห้องพัก', 'รายชื่อผู้สมัคร', 'ประวัติการแก้ไข'].map((t, i) => (
          <button key={t} className="tab" disabled title="เปิดใช้งานหลังบันทึกโครงการ">{i + 2} · {t}</button>
        ))}
      </div>

      {err && <div className="sr-error"><Icon name="info" size={14} /> {err}</div>}

      {ready && (
        <div className={"sem-ready " + (ready.allPass ? 'ok' : 'bad')}>
          <div className="sem-ready-head">
            <Icon name={ready.allPass ? 'check' : 'info'} size={15} />
            {ready.allPass ? 'ข้อมูลครบถ้วน พร้อมเปิดรับสมัคร' : 'ยังมีข้อมูลไม่ครบ — โปรดแก้ไขก่อนเปิดรับสมัคร'}
          </div>
          <div className="sem-ready-grid">
            {Object.entries(ready.groups).map(([g, items]) => (
              <div key={g} className="sem-ready-col">
                <div className="sem-ready-gt">{g}</div>
                {items.map(([label, ok]) => (
                  <div key={label} className={"sem-ready-row " + (ok ? 'ok' : 'no')}><Icon name={ok ? 'check' : 'close'} size={12} /> {label}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ฟอร์มเดียวลื่นไหล ── */}
      <div className="search-card sem-sheet">
        {/* 1. ข้อมูลทั่วไป */}
        <section className="sem-sec">
          <SecHead n="1" title="ข้อมูลทั่วไปของโครงการ" />
          <div className="sem-g6">
            <SpField c={1} label="ปีงบประมาณ" required>
              <select className="cfg-input" value={f.fiscalYear} onChange={(e) => set('fiscalYear', e.target.value)}>
                {window.SEM_FISCAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </SpField>
            <SpField c={2} label="ประเภทโครงการ" required>
              <select className="cfg-input" value={f.type} onChange={(e) => set('type', e.target.value)}>
                {window.SEM_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </SpField>
            <SpField c={1} label="รุ่น / ครั้งที่">
              <input className="cfg-input" value={f.round} onChange={(e) => set('round', e.target.value)} placeholder="เช่น 1" />
            </SpField>
            <SpField c={6} label="ชื่อโครงการ" required>
              <input className="cfg-input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="เช่น สัมมนาสมาชิกผู้ปฏิบัติงานประจำปี 2569" />
            </SpField>
            <SpField c={3} label="วัตถุประสงค์โครงการ">
              <textarea className="cfg-input" rows={2} value={f.objective} onChange={(e) => set('objective', e.target.value)} placeholder="วัตถุประสงค์ของการจัดโครงการ" />
            </SpField>
            <SpField c={3} label="รายละเอียดโครงการ">
              <textarea className="cfg-input" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="รายละเอียดเพิ่มเติม" />
            </SpField>
          </div>
        </section>

        {/* 2. วันเวลาและสถานที่ */}
        <section className="sem-sec">
          <SecHead n="2" title="วันเวลาและสถานที่จัดโครงการ" />
          <div className="sem-g6">
            <SpField c={1} label="วันที่เริ่ม" required><ErpDate value={f.dateFrom} onChange={(v) => ((e) => set('dateFrom', e.target.value))({ target: { value: v } })} className="cfg-input" /></SpField>
            <SpField c={1} label="เวลาเริ่ม"><input className="cfg-input mono" type="time" value={f.startTime} onChange={(e) => set('startTime', e.target.value)} /></SpField>
            <SpField c={1} label="วันที่สิ้นสุด" required><ErpDate value={f.dateTo} onChange={(v) => ((e) => set('dateTo', e.target.value))({ target: { value: v } })} min={f.dateFrom || undefined} className="cfg-input" /></SpField>
            <SpField c={1} label="เวลาสิ้นสุด"><input className="cfg-input mono" type="time" value={f.endTime} onChange={(e) => set('endTime', e.target.value)} /></SpField>
            <SpField c={1} label="จำนวนวัน" hint="(อัตโนมัติ)"><SpAuto mono value={dn.days + ' วัน'} /></SpField>
            <SpField c={1} label="จำนวนคืน" hint="(อัตโนมัติ)"><SpAuto mono value={dn.nights + ' คืน'} /></SpField>
            <SpField c={6} label="สถานที่จัดโครงการ" required><input className="cfg-input" value={f.venue} onChange={(e) => set('venue', e.target.value)} placeholder="ชื่อสถานที่ / โรงแรม / ห้องประชุม" /></SpField>
            <SpField c={1} label="จังหวัด" required>
              <select className="cfg-input" value={f.province} onChange={(e) => setProvince(e.target.value)}>
                <option value="">— เลือก —</option>{window.PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </SpField>
            <SpField c={1} label="อำเภอ / เขต" required>
              <select className="cfg-input" value={f.amphoe} onChange={(e) => setAmphoe(e.target.value)} disabled={!f.province}>
                <option value="">{f.province ? '— เลือก —' : 'เลือกจังหวัด'}</option>{amphoeOpts.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </SpField>
            <SpField c={1} label="ตำบล / แขวง">
              <select className="cfg-input" value={f.tambon} onChange={(e) => set('tambon', e.target.value)} disabled={!f.amphoe}>
                <option value="">{f.amphoe ? '— เลือก —' : 'เลือกอำเภอ'}</option>{tambonOpts.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </SpField>
            <SpField c={1} label="รหัสไปรษณีย์"><input className="cfg-input mono" value={f.postcode} onChange={(e) => set('postcode', e.target.value)} placeholder="20000" maxLength={5} /></SpField>
            <SpField c={1} label="ละติจูด"><input className="cfg-input mono" value={f.lat} onChange={(e) => set('lat', e.target.value)} placeholder="13.36" /></SpField>
            <SpField c={1} label="ลองจิจูด"><input className="cfg-input mono" value={f.lng} onChange={(e) => set('lng', e.target.value)} placeholder="100.98" /></SpField>
            <SpField c={2} label="เขตพื้นที่" hint="(ใช้คำนวณค่าพาหนะ)">
              <select className="cfg-input" value={f.zone} onChange={(e) => set('zone', e.target.value)}>
                {window.SEM_ZONES.map(z => <option key={z.zone} value={z.zone}>{z.zone} (~{z.km} กม.)</option>)}
              </select>
            </SpField>
            <SpField c={4} label="รายละเอียดการเดินทาง"><input className="cfg-input" value={f.travelDetail} onChange={(e) => set('travelDetail', e.target.value)} placeholder="วิธีเดินทาง / จุดสังเกต / จุดนัดขึ้นรถ" /></SpField>
          </div>
        </section>

        {/* 3. ผู้รับผิดชอบ */}
        <section className="sem-sec">
          <SecHead n="3" title="ข้อมูลผู้รับผิดชอบโครงการ"
            sub="เพิ่มเจ้าหน้าที่ผู้รับผิดชอบได้มากกว่าหนึ่งคน — ค้นหาและเลือกจากทะเบียนเจ้าหน้าที่" />
          <div className="sem-g6">
            <SpField c={2} label="หน่วยงานผู้จัด" required>
              <select className="cfg-input" value={f.orgDept} onChange={(e) => set('orgDept', e.target.value)}>
                <option value="">— เลือกหน่วยงาน —</option>{window.SEM_ORG_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </SpField>
            <SpField c={2} label="ผู้อนุมัติโครงการ">
              <select className="cfg-input" value={f.approver} onChange={(e) => set('approver', e.target.value)}>
                <option value="">— เลือกผู้อนุมัติ —</option>{window.SEM_APPROVERS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </SpField>
            <SpField c={2} label="อีเมลกลางโครงการ"><input className="cfg-input" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="seminar@coop.or.th" /></SpField>
            <SpField c={6} label="เจ้าหน้าที่ผู้รับผิดชอบ" required
              hint={`เลือกแล้ว ${(f.officers || []).length} คน`}>
              <SearchSelect value="" onChange={addOfficer}
                options={officerOpts.filter(o => !(f.officers || []).includes(o.value))}
                placeholder="— ค้นหา / เพิ่มเจ้าหน้าที่ผู้รับผิดชอบ —"
                searchPlaceholder="พิมพ์รหัส / ชื่อ / ฝ่าย…" />
            </SpField>
            {(f.officers || []).length > 0 && (
              <div className="sr-field c6">
                <div className="table-wrap"><div className="table-scroll">
                  <table className="tbl sem-officer-tbl">
                    <thead><tr>
                      <th style={{ width: 110 }}>รหัสเจ้าหน้าที่</th><th>ชื่อเจ้าหน้าที่</th><th>ฝ่าย</th>
                      <th style={{ width: 130 }}>เบอร์โทรศัพท์</th><th>อีเมลติดต่อ</th><th className="center" style={{ width: 56 }}>ลบ</th>
                    </tr></thead>
                    <tbody>
                      {(f.officers || []).map(code => {
                        const o = window.semOfficerByCode(code) || { code, name: code, dept: '—', phone: '—', email: '—' };
                        return (
                          <tr key={code}>
                            <td className="mono">{o.code}</td>
                            <td>{o.name}</td>
                            <td className="muted" style={{ fontSize: 12 }}>{o.dept}</td>
                            <td className="mono" style={{ fontSize: 12 }}>{o.phone}</td>
                            <td className="mono" style={{ fontSize: 12 }}>{o.email}</td>
                            <td className="center"><button type="button" className="bud-act" title="นำออก" onClick={() => removeOfficer(code)}><Icon name="trash" size={13} /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div></div>
              </div>
            )}
          </div>
        </section>

        {/* 4. เงื่อนไขการรับสมัคร */}
        <section className="sem-sec">
          <SecHead n="4" title="เงื่อนไขการรับสมัครและสิทธิ์เข้าร่วม"
            sub="กำหนดจำนวนรับ ช่วงเวลารับสมัคร และกลุ่มสมาชิกที่มีสิทธิ์เข้าร่วม (ตามรหัสสังกัด)" />
          <div className="sem-g6">
            <SpField c={1} label="จำนวนรับสูงสุด (คน)" required><input className="cfg-input mono" type="number" min="1" value={f.capacity} onChange={(e) => set('capacity', e.target.value)} /></SpField>
            <SpField c={1} label="สำรอง (คน)"><input className="cfg-input mono" type="number" min="0" value={f.reserve} onChange={(e) => set('reserve', e.target.value)} /></SpField>
            <SpField c={2} label="เปิดรับสมัคร">
              <div style={{ display: 'flex', gap: 6 }}>
                <ErpDate value={f.regFrom} onChange={(v) => ((e) => set('regFrom', e.target.value))({ target: { value: v } })} style={{ flex: 1 }} className="cfg-input" />
                <input className="cfg-input mono" type="time" style={{ width: 92 }} value={f.regFromTime} onChange={(e) => set('regFromTime', e.target.value)} />
              </div>
            </SpField>
            <SpField c={2} label="ปิดรับสมัคร">
              <div style={{ display: 'flex', gap: 6 }}>
                <ErpDate value={f.regTo} onChange={(v) => ((e) => set('regTo', e.target.value))({ target: { value: v } })} style={{ flex: 1 }} className="cfg-input" />
                <input className="cfg-input mono" type="time" style={{ width: 92 }} value={f.regToTime} onChange={(e) => set('regToTime', e.target.value)} />
              </div>
            </SpField>
            <SpField c={2} label="ผู้มีสิทธิ์เข้าร่วม" required>
              <select className="cfg-input" value={f.eligible} onChange={(e) => set('eligible', e.target.value)}>
                {window.SEM_ELIGIBLE.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </SpField>
            {f.eligible === 'range' && (
              <SpField c={4} label="ช่วงรหัสสมาชิกที่มีสิทธิ์" required hint="(เลขที่… ถึง เลขที่…)">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input className="cfg-input mono" style={{ flex: 1 }} value={f.memberFrom} onChange={(e) => set('memberFrom', e.target.value)} placeholder="ตั้งแต่ เช่น M-058000" />
                  <span className="muted">ถึง</span>
                  <input className="cfg-input mono" style={{ flex: 1 }} value={f.memberTo} onChange={(e) => set('memberTo', e.target.value)} placeholder="ถึง เช่น M-059000" />
                </div>
              </SpField>
            )}
            {f.eligible === 'newbie' && (
              <SpField c={4} label="เงื่อนไข"><SpAuto value="สมาชิกที่สมัครไม่เกิน 1 ปี (ระบบตรวจจากวันที่เข้าเป็นสมาชิก)" /></SpField>
            )}
            {f.eligible === 'all' && (
              <SpField c={4} label="เงื่อนไข"><SpAuto value="เปิดให้สมาชิกทุกคนมีสิทธิ์ลงทะเบียนเข้าร่วม" /></SpField>
            )}
            {f.eligible === 'dept' && (
              <SpField c={4} label="สังกัดที่มีสิทธิ์เข้าร่วม" required
                hint={`เลือกได้มากกว่าหนึ่งสังกัด · เลือกแล้ว ${(f.allowDepts || []).length}`}>
                <SearchSelect value="" onChange={addDept}
                  options={affilOpts.filter(o => !(f.allowDepts || []).includes(o.value))}
                  placeholder="— ค้นหา / เพิ่มสังกัดที่มีสิทธิ์ —"
                  searchPlaceholder="พิมพ์รหัสสังกัด / ชื่อ…" />
                {(f.allowDepts || []).length > 0 && (
                  <div className="sem-dept-picker" style={{ marginTop: 8 }}>
                    {(f.allowDepts || []).map(code => (
                      <span key={code} className="sem-dept-chip on">
                        <span className="mono">{code}</span> {window.semAffilName(code)}
                        <button type="button" className="sem-file-x" style={{ marginLeft: 2 }} onClick={() => removeDept(code)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </SpField>
            )}
          </div>
          <div className="sem-opt-list sem-opt-row">
            <SpOpt checked={f.autoClose} onChange={(v) => set('autoClose', v)} hint="เมื่อครบจำนวนสูงสุด">ปิดรับสมัครอัตโนมัติ</SpOpt>
            <SpOpt checked={f.allowWaiting} onChange={(v) => set('allowWaiting', v)} hint="เต็มแล้วบันทึกเป็นสำรอง">อนุญาตรายชื่อสำรอง</SpOpt>
            <SpOpt checked={f.preventDup} onChange={(v) => set('preventDup', v)} hint="กันสมัครโครงการเดิมซ้ำ">ป้องกันการสมัครซ้ำ</SpOpt>
            <SpOpt checked={f.preventOverlap} onChange={(v) => set('preventOverlap', v)} hint="กันวันเวลาชนกัน">ป้องกันโครงการคาบเกี่ยว</SpOpt>
            <SpOpt checked={f.biennial} onChange={(v) => set('biennial', v)} hint="ผู้ที่เข้าร่วมปีที่แล้วจะเข้าร่วมซ้ำไม่ได้ (ปีเว้นปี)">จำกัดสิทธิ์แบบปีเว้นปี</SpOpt>
          </div>
        </section>

        {/* 5. เอกสาร/ประกาศ */}
        <section className="sem-sec">
          <SecHead n="5" title="ข้อมูลประกาศ / เอกสารแนบ" />
          <div className="sem-g6">
            <SpField c={2} label="เลขที่ประกาศ / หนังสือ"><input className="cfg-input" value={f.announceNo} onChange={(e) => set('announceNo', e.target.value)} placeholder="สอ.กสท. 001/2569" /></SpField>
            <SpField c={2} label="วันที่ประกาศ"><ErpDate value={f.announceDate} onChange={(v) => ((e) => set('announceDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></SpField>
            <SpField c={2} label="Template เอกสารเชิญ">
              <select className="cfg-input" value={f.inviteTemplate} onChange={(e) => set('inviteTemplate', e.target.value)}>
                <option value="">— เลือก —</option>{window.SEM_INVITE_TEMPLATES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
              </select>
            </SpField>
            <SpField c={3} label="ไฟล์แนบประกาศ"><SpUpload value={f.fileAnnounce} onChange={(v) => set('fileAnnounce', v)} /></SpField>
            <SpField c={3} label="เอกสารกำหนดการ"><SpUpload value={f.fileAgenda} onChange={(v) => set('fileAgenda', v)} /></SpField>
          </div>
        </section>

        {/* 6. การแสดงผล */}
        <section className="sem-sec">
          <SecHead n="6" title="การแสดงผลบน Mobile Application" />
          <div className="sem-g6">
            <div className="sr-field c6">
              <label className="sr-label">การแสดงผลบน Mobile Application</label>
              <div className="sem-opt-list sem-opt-row">
                <SpOpt checked={f.showMobile} onChange={(v) => set('showMobile', v)}>แสดงบนแอป</SpOpt>
                <SpOpt checked={f.allowMobileReg} onChange={(v) => set('allowMobileReg', v)}>ลงทะเบียนเองได้ (กลุ่ม A)</SpOpt>
                <SpOpt checked={f.sendNotif} onChange={(v) => set('sendNotif', v)}>ส่ง Notification</SpOpt>
              </div>
            </div>
            <SpField c={6} label="หมายเหตุ"><textarea className="cfg-input" rows={2} value={f.remark} onChange={(e) => set('remark', e.target.value)} placeholder="หมายเหตุเพิ่มเติม" /></SpField>
          </div>
        </section>

        {/* ค่าใช้จ่ายโครงการ */}
        <section className="sem-sec">
          <SecHead n="฿" title="ค่าใช้จ่ายโครงการ"
            sub="เพิ่มรายการค่าใช้จ่ายได้หลายรายการ — เลือกว่าคิดรายบุคคล (× จำนวนผู้เข้าร่วม) หรือเป็นมูลค่ารวม พร้อมเลือกหมวดงบประมาณที่ใช้เบิกจ่าย"
            right={<button type="button" className="btn sm primary" onClick={addExpense}><Icon name="plus" /> เพิ่มรายการ</button>} />
          <div className="sem-exp-note muted">
            <Icon name="info" size={11} /> จำนวนผู้เข้าร่วมสำหรับคิดรายบุคคล = <b className="mono" style={{ color: 'var(--text)' }}>{headCount}</b> คน (จากจำนวนรับสูงสุด/ผู้ยืนยัน — ปรับจำนวนต่อรายการได้)
          </div>
          {expenses.length === 0 ? (
            <div className="sem-exp-empty">
              ยังไม่มีรายการค่าใช้จ่าย — กด “เพิ่มรายการ” เพื่อเริ่มบันทึก
            </div>
          ) : (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl sem-exp-tbl">
                <thead><tr>
                  <th style={{ minWidth: 180 }}>รายการค่าใช้จ่าย</th>
                  <th style={{ width: 150 }}>รูปแบบ</th>
                  <th style={{ width: 120 }} className="num">อัตรา/หน่วย (บาท)</th>
                  <th style={{ width: 96 }} className="num">จำนวน (คน)</th>
                  <th style={{ width: 130 }} className="num">รวม (บาท)</th>
                  <th style={{ minWidth: 200 }}>หมวดงบประมาณ</th>
                  <th className="center" style={{ width: 48 }}></th>
                </tr></thead>
                <tbody>
                  {expenses.map(e => {
                    const rowTotal = window.semExpenseTotal(e, headCount);
                    const perhead = e.mode === 'perhead';
                    return (
                      <tr key={e.key}>
                        <td><input className="sh-grid-input" value={e.desc} onChange={(ev) => setExpense(e.key, { desc: ev.target.value })} placeholder="เช่น ค่าอาหาร, ค่าที่พัก, ค่าวิทยากร" /></td>
                        <td>
                          <select className="sh-grid-input" value={e.mode} onChange={(ev) => setExpense(e.key, { mode: ev.target.value })}>
                            {window.SEM_EXPENSE_MODES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                          </select>
                        </td>
                        <td className="num">
                          {perhead
                            ? <input className="sh-grid-input mono num" type="number" min="0" value={e.rate} onChange={(ev) => setExpense(e.key, { rate: ev.target.value })} placeholder="0" />
                            : <span className="muted">—</span>}
                        </td>
                        <td className="num">
                          {perhead
                            ? <input className="sh-grid-input mono num" type="number" min="0" value={e.qty} onChange={(ev) => setExpense(e.key, { qty: ev.target.value })} placeholder={String(headCount)} />
                            : <span className="muted">—</span>}
                        </td>
                        <td className="num">
                          {perhead
                            ? <span className="mono" style={{ fontWeight: 600 }}>{fmt.money(rowTotal, 0)}</span>
                            : <input className="sh-grid-input mono num" type="number" min="0" value={e.amount} onChange={(ev) => setExpense(e.key, { amount: ev.target.value })} placeholder="0" />}
                        </td>
                        <td>
                          <SearchSelect value={e.cat} onChange={(v) => setExpense(e.key, { cat: v })} options={budCatOpts} allowClear
                            placeholder="— เลือกหมวดงบประมาณ —" searchPlaceholder="พิมพ์รหัส / ชื่อหมวด…" />
                        </td>
                        <td className="center"><button type="button" className="bud-act" title="ลบรายการ" onClick={() => removeExpense(e.key)}><Icon name="trash" size={13} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="sem-exp-total">
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 600 }}>รวมค่าใช้จ่ายโครงการ</td>
                    <td className="num mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>{fmt.money(expensesTotal, 0)}</td>
                    <td colSpan="2" className="muted" style={{ fontSize: 11.5 }}>เฉลี่ยต่อคน ฿ {fmt.money(headCount ? Math.round(expensesTotal / headCount) : 0, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
          )}
        </section>

        {/* 7. ประวัติการบันทึก */}
        <section className="sem-sec" style={{ borderBottom: 0, paddingBottom: 0 }}>
          <SecHead n="7" title="ประวัติการบันทึกข้อมูล" sub="ระบบบันทึกอัตโนมัติ — ไม่สามารถแก้ไขได้" />
          <div className="sem-audit-grid">
            <div className="sem-audit-cell"><span className="sem-audit-k">ผู้สร้างรายการ</span><span className="sem-audit-v">{f.createdBy || '—'}</span></div>
            <div className="sem-audit-cell"><span className="sem-audit-k">วันที่สร้าง</span><span className="sem-audit-v mono">{f.createdAt || (isNew ? 'บันทึกเมื่อกดบันทึก' : '—')}</span></div>
            <div className="sem-audit-cell"><span className="sem-audit-k">ผู้แก้ไขล่าสุด</span><span className="sem-audit-v">{f.updatedBy || '—'}</span></div>
            <div className="sem-audit-cell"><span className="sem-audit-k">วันที่แก้ไขล่าสุด</span><span className="sem-audit-v mono">{f.updatedAt || '—'}</span></div>
          </div>
        </section>
      </div>

      {/* แถบปุ่มคำสั่ง (sticky) */}
      <div className="sem-action-bar">
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> ย้อนกลับ</button>
        <span className="spacer" />
        {!isNew && <button className="btn sm" onClick={doCopy}><Icon name="column" /> คัดลอกโครงการ</button>}
        {!isNew && f.status !== 'cancelled' && <button className="btn sm danger" onClick={doCancel}><Icon name="close" /> ยกเลิกโครงการ</button>}
        <button className="btn sm" onClick={doCheck}><Icon name="check" /> ตรวจสอบความพร้อม</button>
        {isNew ? (
          <>
            <button className="btn sm" onClick={() => doSave('draft')}><Icon name="download" /> บันทึกร่าง</button>
            <button className="btn primary sm" onClick={() => doSave('open')}><Icon name="check" /> บันทึกและเปิดรับสมัคร</button>
          </>
        ) : (
          <button className="btn primary sm" onClick={() => doSave(f.status)}><Icon name="check" /> บันทึก</button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SeminarProjectForm });
