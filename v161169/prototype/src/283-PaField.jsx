// ════════════════════════════════════════════════════════════════════
//  ขอยืมเงินทดรอง (Petty / Advance Loan Request)
//  ระบบการเงิน › เงินทดรอง
//  ทะเบียนคำขอ (list) · แบบฟอร์มบันทึก (form) · รายละเอียด (detail)
//  ใช้ MemberSearchField / DN_MEMBERS · ค่าคงที่+helpers จาก data-petty-advance.js
// ════════════════════════════════════════════════════════════════════
const { useState: paUseState, useMemo: paUseMemo, useEffect: paUseEffect } = React;

// ─── ฟิลด์ย่อย (label + control) — โครง form-grid ────────────────────
function PaField({ label, required, hint, children, full, span }) {
  const st = full ? { gridColumn: '1 / -1' } : (span ? { gridColumn: `span ${span}` } : null);
  return (
    <div className="sr-field" style={st}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนคำขอ (list)
// ════════════════════════════════════════════════════════════════════
function PaListView({ list, onCreate, onOpen }) {
  const [q, setQ] = paUseState('');
  const [typeF, setTypeF] = paUseState('all');
  const [statusF, setStatusF] = paUseState('all');

  const rows = paUseMemo(() => {
    let r = list;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) ||
                        x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n));
    }
    if (typeF !== 'all') r = r.filter(x => x.type === typeF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => b.recordDate.localeCompare(a.recordDate) || b.id.localeCompare(a.id));
  }, [list, q, typeF, statusF]);

  const hasFilter = q || typeF !== 'all' || statusF !== 'all';
  const clear = () => { setQ(''); setTypeF('all'); setStatusF('all'); };

  const openCnt = list.filter(r => r.status === 'submitted' || r.status === 'approved').length;
  const outstanding = list.filter(r => r.status === 'approved' || r.status === 'paid')
    .reduce((s, r) => s + window.paSummary(r.lines, r).requested, 0);

  return (
    <div data-screen-label="หน้าทะเบียนคำขอยืมเงินทดรอง">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอยืมเงินทดรอง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ระบบการเงิน · บันทึกคำขอยืมเงินทดรองจ่ายของบุคลากร พร้อมประมาณการค่าใช้จ่าย เอกสารประกอบ และวิธีรับเงิน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างคำขอยืมเงินทดรอง</button>
      </div>

      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">คำขอทั้งหมด</div>
          <div className="stat-value">{fmt.int(list.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">อยู่ระหว่างดำเนินการ</div>
          <div className="stat-value">{fmt.int(openCnt)}</div>
          <div className="stat-sub">รออนุมัติ / รอจ่าย</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">ยอดทดรองคงค้าง</div>
          <div className="stat-value">{fmt.money(outstanding, 0)}</div>
          <div className="stat-sub">บาท</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่ / ผู้ขอ</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เช่น AV-2569-000120, วิรัตน์" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทเงินทดรอง</span>
            <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ width: 180 }}>
              <option value="all">ทุกประเภท</option>
              {window.PA_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกสถานะ</option>
              {Object.keys(window.PA_STATUS).map(s => <option key={s} value={s}>{window.PA_STATUS[s].l}</option>)}
            </select>
          </div>
          {hasFilter && <button className="btn ghost sm" onClick={clear}><Icon name="close" size={12} /> ล้างตัวกรอง</button>}
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่รายการ</th>
                <th>วันที่</th>
                <th>ผู้ขอยืม</th>
                <th className="center">ประเภท</th>
                <th>วัตถุประสงค์</th>
                <th className="center">ครบกำหนดคืน</th>
                <th className="num">ยอดที่ขอยืม</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const st = window.paStatus(r.status);
                const t = window.paType(r.type);
                const sum = window.paSummary(r.lines, r);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.id}</td>
                    <td>{fmt.date(r.recordDate)}</td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.dept}</div>
                    </td>
                    <td className="center"><span className="chip info">{t.short}</span></td>
                    <td><div className="pa-clamp">{r.purpose}</div></td>
                    <td className="center mono">{fmt.date(r.dueDate)}</td>
                    <td className="num mono">{fmt.money(sum.requested, 0)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดคำขอยืมเงินทดรอง
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มบันทึกคำขอยืมเงินทดรอง
// ════════════════════════════════════════════════════════════════════
const paBlankLine = () => {
  const cats = window.paActiveCats();
  const first = window.paCat(cats[0]);
  return { cat: cats[0] || '', desc: '', qty: 1, unit: (first && first.unit) || 'รายการ',
    price: 0, budget: '', fund: 'budget', cc: '', note: '' };
};
const paBlankDoc = () => ({ docType: window.PA_DOC_TYPES[0], docNo: '', docDate: '', fileName: '', note: '' });

function PaCreateForm({ list, onSubmit, onCancel, onToast }) {
  const [recordDate, setRecordDate] = paUseState(window.paToday);
  const [type, setType] = paUseState('travel');
  const [refDoc, setRefDoc] = paUseState('');
  const [refDate, setRefDate] = paUseState('');
  const [member, setMember] = paUseState(null);

  const [purpose, setPurpose] = paUseState('');
  const [project, setProject] = paUseState('');
  const [projectNo, setProjectNo] = paUseState('');
  const [useStart, setUseStart] = paUseState('');
  const [useEnd, setUseEnd] = paUseState('');
  const [place, setPlace] = paUseState('');
  const [extra, setExtra] = paUseState('');

  const [lines, setLines] = paUseState([paBlankLine()]);
  const [vat, setVat] = paUseState(false);
  const [wht, setWht] = paUseState(false);

  const [method, setMethod] = paUseState('transfer');
  const [bank, setBank] = paUseState(window.PA_BANKS[0]);
  const [acctNo, setAcctNo] = paUseState('');
  const [receiveDate, setReceiveDate] = paUseState('');
  const [cashPlace, setCashPlace] = paUseState('');
  const [payNote, setPayNote] = paUseState('');

  const [docs, setDocs] = paUseState([]);
  const [error, setError] = paUseState('');

  const info = paUseMemo(() => window.paMemberInfo(member), [member]);
  const t = window.paType(type);
  const fiscal = paUseMemo(() => window.paFiscal(recordDate), [recordDate]);
  const requestNo = paUseMemo(() => window.paNextNo(list, window.paBeYear(recordDate)), [list, recordDate]);
  const sum = paUseMemo(() => window.paSummary(lines, { vat, wht }), [lines, vat, wht]);
  const cats = paUseMemo(() => window.paActiveCats(), []);

  // ครบกำหนดคืน = วันสิ้นสุด + 15 วัน (เงื่อนไของค์กร)
  const dueDate = paUseMemo(() => {
    if (!useEnd) return '';
    const d = new Date(useEnd); d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  }, [useEnd]);

  // งบคงเหลือรวมของรหัสงบที่เลือกในรายการ
  const budgetRemaining = paUseMemo(() => {
    const codes = [...new Set(lines.map(l => l.budget).filter(Boolean))];
    return codes.reduce((s, c) => s + (window.paBudget(c)?.remaining || 0), 0);
  }, [lines]);
  const budgetOver = budgetRemaining > 0 && sum.requested > budgetRemaining;

  const setLine = (i, k, v) => setLines(s => s.map((r, idx) => {
    if (idx !== i) return r;
    if (k === 'cat') {
      const c = window.paCat(v);
      return { ...r, cat: v, unit: (c && c.unit) || r.unit };
    }
    return { ...r, [k]: (k === 'qty' || k === 'price') ? (v === '' ? 0 : Number(v)) : v };
  }));
  const addLine = () => setLines(s => [...s, paBlankLine()]);
  const delLine = (i) => setLines(s => s.filter((_, idx) => idx !== i));

  const setDoc = (i, k, v) => setDocs(s => s.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addDoc = () => setDocs(s => [...s, paBlankDoc()]);
  const delDoc = (i) => setDocs(s => s.filter((_, idx) => idx !== i));

  const reset = () => {
    setType('travel'); setRefDoc(''); setRefDate(''); setMember(null);
    setPurpose(''); setProject(''); setProjectNo(''); setUseStart(''); setUseEnd('');
    setPlace(''); setExtra(''); setLines([paBlankLine()]); setVat(false); setWht(false);
    setMethod('transfer'); setBank(window.PA_BANKS[0]); setAcctNo(''); setReceiveDate('');
    setCashPlace(''); setPayNote(''); setDocs([]); setError('');
  };

  const build = (status) => ({
    id: requestNo, recordDate, type,
    fiscalYear: fiscal.year, fiscalPeriod: fiscal.periodLabel,
    refDoc: refDoc.trim(), refDate,
    memberCode: member.code, memberName: member.name, dept: info.dept,
    position: info.position, supervisor: info.supervisor, phone: info.phone, email: info.email,
    purpose: purpose.trim(), project: project.trim(), projectNo: projectNo.trim(),
    useStart, useEnd, dueDate, place: place.trim(), extra: extra.trim(),
    lines: lines.map(l => ({ ...l })), vat, wht,
    method, bank: method === 'transfer' ? bank : '', acctNo: method === 'transfer' ? acctNo.trim() : '',
    acctName: method === 'transfer' ? member.name : '',
    receiveDate, place2: method === 'cash' ? cashPlace.trim() : '', payNote: payNote.trim(),
    docs: docs.map(d => ({ ...d, by: window.PA_USER, at: recordDate, verified: 'pending' })),
    status, enteredBy: window.PA_USER, enteredAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  const validate = () => {
    if (!member) { setError('กรุณาระบุผู้ขอยืม (รหัสพนักงาน/สมาชิก)'); return false; }
    if (info.hasOverdue) { setError('ผู้ขอมีรายการเงินทดรองเกินกำหนด — ต้องเคลียร์ก่อนจึงจะยืมใหม่ได้'); return false; }
    if (!purpose.trim()) { setError('กรุณาระบุวัตถุประสงค์การยืม'); return false; }
    if (t.needProject && !project.trim()) { setError('เงินทดรองประเภทโครงการ ต้องระบุโครงการ/กิจกรรม'); return false; }
    if (!useStart || !useEnd) { setError('กรุณาระบุวันที่เริ่มและสิ้นสุดการใช้เงิน'); return false; }
    if (useEnd < useStart) { setError('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม'); return false; }
    if (!(sum.requested > 0)) { setError('กรุณาระบุรายการประมาณการค่าใช้จ่ายอย่างน้อย 1 รายการ'); return false; }
    if (!receiveDate) { setError('กรุณาระบุวันที่ต้องการรับเงิน'); return false; }
    if (method === 'transfer' && !acctNo.trim()) { setError('วิธีรับเงินแบบโอน ต้องระบุเลขที่บัญชี'); return false; }
    setError(''); return true;
  };

  const submit = (status) => {
    if (status === 'submitted' && !validate()) return;
    if (status === 'draft' && !member) { setError('กรุณาระบุผู้ขอยืมก่อนบันทึกร่าง'); return; }
    onSubmit(build(status), status);
  };

  return (
    <div data-screen-label="หน้าบันทึกคำขอยืมเงินทดรอง">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สร้างคำขอยืมเงินทดรอง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกข้อมูลผู้ขอ · รายละเอียดการยืม · ประมาณการค่าใช้จ่าย · วิธีรับเงิน · เอกสารแนบ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <button className="btn sm" onClick={reset}><Icon name="close" size={13} /> ล้างค่า</button>
        <button className="btn sm" onClick={() => submit('draft')}><Icon name="edit" size={13} /> บันทึกร่าง</button>
        <button className="btn primary sm" onClick={() => submit('submitted')} disabled={info && info.hasOverdue}>
          <Icon name="check" /> บันทึก & ส่งอนุมัติ
        </button>
      </div>

      {error && (<div className="sr-error"><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ① ข้อมูลเอกสาร ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลเอกสาร</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>เลขที่รายการ <b className="mono" style={{ color: 'var(--text)' }}>{requestNo}</b></span>
          </div>
        </div>
        <div className="form-grid cols-4">
          <PaField label="เลขที่รายการยืมเงิน" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono ds-auto-field" value="Auto" readOnly />
          </PaField>
          <PaField label="วันที่ทำรายการ" required>
            <ErpDate value={recordDate} onChange={(v) => ((e) => setRecordDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PaField>
          <PaField label="ปีบัญชี / งวดบัญชี" hint="(อ้างวันที่ทำรายการ)">
            <input className="cfg-input mono sr-auto" value={`${fiscal.year} · งวด ${fiscal.periodLabel}`} readOnly />
          </PaField>
          <PaField label="สถานะ">
            <input className="cfg-input sr-readonly" value="ร่าง (ยังไม่บันทึก)" readOnly />
          </PaField>
        </div>
        <div className="form-grid cols-4" style={{ marginTop: 14 }}>
          <PaField label="ประเภทเงินทดรอง" required span={2}>
            <select className="cfg-input" value={type} onChange={(e) => setType(e.target.value)}>
              {window.PA_TYPES.map(x => (
                <option key={x.v} value={x.v}>{x.l || x.short}</option>
              ))}
            </select>
          </PaField>
          <PaField label="เลขที่เอกสารอ้างอิง" hint="(ถ้ามี)">
            <input className="cfg-input" value={refDoc} onChange={(e) => setRefDoc(e.target.value)} placeholder="เช่น หนังสืออนุมัติโครงการ" />
          </PaField>
          <PaField label="วันที่เอกสารอ้างอิง">
            <ErpDate value={refDate} onChange={(v) => ((e) => setRefDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PaField>
        </div>
        <p className="muted" style={{ fontSize: 11.5, margin: '10px 0 0' }}>
          <Icon name="info" size={11} /> {t.l} — {t.needProject ? 'ต้องระบุโครงการ/กิจกรรมประกอบ' : 'ระบบตรวจสอบว่างวดบัญชีเปิดอยู่'}
        </p>
      </div>

      {/* ── ② ข้อมูลผู้ขอยืม ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้ขอยืม</h3></div>
        <div className="form-grid cols-4">
          <PaField label="รหัสพนักงาน / สมาชิก" required hint="(ค้นหา)">
            <MemberSearchField member={member} onPick={setMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาบุคลากร — ขอยืมเงินทดรอง" changeLabel="เปลี่ยน"
              placeholder="ค้นหารหัส / ชื่อบุคลากร…" />
          </PaField>
          <PaField label="ชื่อ-นามสกุล">
            <input className="cfg-input sr-auto" value={info ? info.name : ''} readOnly placeholder="(ดึงอัตโนมัติ)" />
          </PaField>
          <PaField label="เลขประจำตัวประชาชน" hint="(ตามสิทธิ์)">
            <input className="cfg-input mono sr-auto" value={info ? info.citizenId : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="ตำแหน่ง">
            <input className="cfg-input sr-auto" value={info ? info.position : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="หน่วยงาน / สังกัด">
            <input className="cfg-input sr-auto" value={info ? info.dept : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="ผู้บังคับบัญชา">
            <input className="cfg-input sr-auto" value={info ? info.supervisor : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="เบอร์โทรศัพท์" hint="(ถ้ามี)">
            <input className="cfg-input" value={info ? info.phone : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="อีเมล" hint="(แจ้งเตือน)">
            <input className="cfg-input" value={info ? info.email : ''} readOnly placeholder="—" />
          </PaField>
          <PaField label="สถานะทดรองคงค้าง">
            <input className={'cfg-input mono sr-auto' + (info && info.hasOverdue ? ' pa-danger-field' : '')}
                   value={info ? `${info.openCount} รายการ · ${fmt.money(info.openTotal, 0)} บ.` : '—'} readOnly />
          </PaField>
        </div>

        {info && info.openCount > 0 && (
          <div className={'dn-status-alert' + (info.hasOverdue ? ' bad' : '')} style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>
              {info.hasOverdue
                ? <>ผู้ขอมีรายการเงินทดรอง<b>เกินกำหนดคืน</b> — ระบบระงับการยืมใหม่จนกว่าจะเคลียร์รายการเดิม</>
                : <>ผู้ขอมีเงินทดรองคงค้าง {info.openCount} รายการ รวม {fmt.money(info.openTotal, 2)} บาท (ยังไม่เกินกำหนด)</>}
            </span>
          </div>
        )}
      </div>

      {/* ── ③ รายละเอียดการขอยืม ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายละเอียดการขอยืม</h3></div>
        <div className="form-grid cols-1">
          <PaField label="วัตถุประสงค์การยืม" required full>
            <textarea className="cfg-input" rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)}
                      placeholder="ระบุเหตุผลและการนำเงินไปใช้" />
          </PaField>
        </div>
        <div className="form-grid cols-4" style={{ marginTop: 4 }}>
          <PaField label="โครงการ / กิจกรรม" required={t.needProject} hint={t.needProject ? '' : '(ตามเงื่อนไข)'}>
            <input className="cfg-input" value={project} onChange={(e) => setProject(e.target.value)}
                   placeholder={t.needProject ? 'บังคับเมื่อเป็นเงินโครงการ' : 'ระบุถ้ามี'} />
          </PaField>
          <PaField label="เลขที่โครงการ" hint="(อัตโนมัติ)">
            <input className="cfg-input mono sr-auto" value={projectNo} onChange={(e) => setProjectNo(e.target.value)} placeholder="—" />
          </PaField>
          <PaField label="สถานที่ดำเนินการ" hint="(ถ้ามี)">
            <input className="cfg-input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="เช่น จังหวัด/สถานที่" />
          </PaField>
          <PaField label="วันที่เริ่มใช้เงิน" required>
            <ErpDate value={useStart} onChange={(v) => ((e) => setUseStart(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PaField>
        </div>
        <div className="form-grid cols-4" style={{ marginTop: 14 }}>
          <PaField label="วันที่สิ้นสุดการใช้เงิน" required>
            <ErpDate value={useEnd} onChange={(v) => ((e) => setUseEnd(e.target.value))({ target: { value: v } })} min={useStart} className="cfg-input" />
          </PaField>
          <PaField label="วันที่ครบกำหนดคืน" hint="(อัตโนมัติ +15 วัน)">
            <input className="cfg-input mono ds-auto-field" value={dueDate ? fmt.date(dueDate) : 'Auto'} readOnly />
          </PaField>
          <PaField label="รายละเอียดเพิ่มเติม" hint="(ถ้ามี)">
            <input className="cfg-input" value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="ข้อมูลประกอบอื่น" />
          </PaField>
        </div>
      </div>

      {/* ── ④ รายการประมาณการค่าใช้จ่าย ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>รายการประมาณการค่าใช้จ่าย</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={addLine}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl pa-line-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>#</th>
                <th style={{ width: 200 }}>หมวดค่าใช้จ่าย</th>
                <th style={{ width: 200 }}>รายละเอียด</th>
                <th className="center" style={{ width: 90 }}>จำนวน</th>
                <th className="center" style={{ width: 120 }}>หน่วยนับ</th>
                <th className="num" style={{ width: 130 }}>ราคา/หน่วย</th>
                <th className="num" style={{ width: 140 }}>จำนวนเงิน</th>
                <th style={{ width: 150 }}>รหัสงบประมาณ</th>
                <th style={{ width: 150 }}>แหล่งเงิน</th>
                <th className="center" style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {lines.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>
                    <select className="cfg-input pa-cell" value={r.cat} onChange={(e) => setLine(i, 'cat', e.target.value)}>
                      {!cats.includes(r.cat) && r.cat && <option value={r.cat}>{r.cat}</option>}
                      {cats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><input className="cfg-input pa-cell" value={r.desc} onChange={(e) => setLine(i, 'desc', e.target.value)} placeholder="ระบุรายละเอียด" /></td>
                  <td className="center"><input className="cfg-input mono pa-cell num" type="number" min="0" value={r.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} /></td>
                  <td>
                    <select className="cfg-input pa-cell" value={r.unit} onChange={(e) => setLine(i, 'unit', e.target.value)}>
                      {window.PA_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </td>
                  <td className="num"><input className="cfg-input mono pa-cell num" type="number" min="0" step="0.01" value={r.price} onChange={(e) => setLine(i, 'price', e.target.value)} /></td>
                  <td className="num mono pa-line-amt">{fmt.money(window.paLineAmount(r), 2)}</td>
                  <td>
                    <select className="cfg-input pa-cell" value={r.budget} onChange={(e) => setLine(i, 'budget', e.target.value)}>
                      <option value="">— เลือก —</option>
                      {window.PA_BUDGETS.map(b => <option key={b.code} value={b.code}>{b.code}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="cfg-input pa-cell" value={r.fund} onChange={(e) => setLine(i, 'fund', e.target.value)}>
                      {window.PA_FUND_SRC.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                    </select>
                  </td>
                  <td className="center">
                    <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delLine(i)}
                            disabled={lines.length === 1} title="ลบรายการ"><Icon name="close" size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="pa-line-tot">
                <td colSpan="6" className="right">ยอดรวมก่อนภาษี</td>
                <td className="num mono">{fmt.money(sum.subtotal, 2)}</td>
                <td colSpan="3" />
              </tr>
            </tfoot>
          </table>
        </div></div>

        {/* ── ยอดสรุป ── */}
        <div className="pa-sum-wrap">
          <label className="pa-tax-toggle"><input type="checkbox" checked={vat} onChange={(e) => setVat(e.target.checked)} /> ประมาณการภาษีมูลค่าเพิ่ม (VAT 7%)</label>
          <label className="pa-tax-toggle"><input type="checkbox" checked={wht} onChange={(e) => setWht(e.target.checked)} /> ประมาณการภาษีหัก ณ ที่จ่าย (3%)</label>
          <div className="pa-sum-box">
            <div className="pa-sum-row"><span>ยอดรวมก่อนภาษี</span><b className="mono">{fmt.money(sum.subtotal, 2)}</b></div>
            <div className="pa-sum-row"><span>ภาษีมูลค่าเพิ่มโดยประมาณ</span><b className="mono">{fmt.money(sum.vat, 2)}</b></div>
            <div className="pa-sum-row"><span>ภาษีหัก ณ ที่จ่ายโดยประมาณ</span><b className="mono">-{fmt.money(sum.wht, 2)}</b></div>
            <div className="pa-sum-row grand"><span>ยอดที่ขอยืม</span><b className="mono">{fmt.money(sum.requested, 2)}</b></div>
            <div className="pa-sum-row sub"><span>ยอดงบประมาณคงเหลือ</span><b className={'mono' + (budgetOver ? ' pa-over' : '')}>{budgetRemaining ? fmt.money(budgetRemaining, 2) : '—'}</b></div>
          </div>
        </div>
        {budgetOver && (
          <div className="dn-status-alert bad" style={{ marginTop: 10 }}>
            <Icon name="info" size={15} />
            <span>ยอดที่ขอยืมเกินงบประมาณคงเหลือของรหัสงบที่เลือก — โปรดตรวจสอบรหัสงบประมาณ</span>
          </div>
        )}
        <p className="muted" style={{ fontSize: 11.5, margin: '8px 0 0' }}>
          <Icon name="info" size={11} /> ยอดที่ขอยืมต้องเท่ากับผลรวมรายการประมาณการค่าใช้จ่าย · ยอดที่เสนออนุมัติ/อนุมัติ/จ่ายจริง จะบันทึกในขั้นอนุมัติและจ่ายเงิน
        </p>
      </div>

      {/* ── ⑤ วิธีรับเงิน ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>วิธีรับเงิน</h3></div>
        <div className="form-grid cols-4">
          <PaField label="วิธีรับเงิน" required>
            <div className="seg">
              {window.PA_METHODS.map(m => (
                <button key={m.v} className={'seg-btn' + (method === m.v ? ' active' : '')} onClick={() => setMethod(m.v)}>{m.l}</button>
              ))}
            </div>
          </PaField>
          <PaField label="วันที่ต้องการรับเงิน" required>
            <ErpDate value={receiveDate} onChange={(v) => ((e) => setReceiveDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PaField>
          <PaField label="หมายเหตุการจ่าย" hint="(ถ้ามี)" span={2}>
            <input className="cfg-input" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="ข้อมูลเพิ่มเติม" />
          </PaField>
        </div>

        {method === 'transfer' && (
          <div className="form-grid cols-4" style={{ marginTop: 14 }}>
            <PaField label="ธนาคาร" required>
              <select className="cfg-input" value={bank} onChange={(e) => setBank(e.target.value)}>
                {window.PA_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </PaField>
            <PaField label="เลขที่บัญชี" required>
              <input className="cfg-input mono" value={acctNo} onChange={(e) => setAcctNo(e.target.value)} placeholder="เลือกบัญชีที่ตรวจสอบแล้ว" />
            </PaField>
            <PaField label="ชื่อบัญชี" span={2}>
              <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(ต้องตรงกับผู้ขอ)" />
            </PaField>
          </div>
        )}
        {method === 'cash' && (
          <div className="form-grid cols-4" style={{ marginTop: 14 }}>
            <PaField label="สถานที่รับเงิน" required span={2}>
              <input className="cfg-input" value={cashPlace} onChange={(e) => setCashPlace(e.target.value)} placeholder="จุดรับเงิน / ช่องจ่ายเงิน" />
            </PaField>
          </div>
        )}
        {method === 'cheque' && (
          <p className="muted" style={{ fontSize: 11.5, margin: '12px 0 0' }}>
            <Icon name="info" size={11} /> จ่ายด้วยเช็ค — ระบบจะออกเช็คในขั้นตอนจ่ายเงิน (เมนู “จ่ายเงินด้วยเช็ค”)
          </p>
        )}
      </div>

      {/* ── ⑥ เอกสารแนบ ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>เอกสารแนบ</h3>
          <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn sm" onClick={addDoc}><Icon name="attach" size={13} /> แนบเอกสาร</button>
          </div>
        </div>
        {docs.length === 0 ? (
          <div className="pa-doc-empty">
            <Icon name="attach" size={22} />
            <div>ยังไม่มีเอกสารแนบ — เช่น หนังสืออนุมัติโครงการ · กำหนดการอบรม · ใบเสนอราคา · คำสั่งเดินทาง</div>
          </div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl pa-doc-tbl">
              <thead>
                <tr>
                  <th style={{ minWidth: 150 }}>ประเภทเอกสาร</th>
                  <th style={{ width: 130 }}>เลขที่เอกสาร</th>
                  <th className="center" style={{ width: 130 }}>วันที่เอกสาร</th>
                  <th style={{ minWidth: 150 }}>ชื่อไฟล์</th>
                  <th style={{ minWidth: 120 }}>หมายเหตุ</th>
                  <th className="center" style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {docs.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <select className="cfg-input pa-cell" value={d.docType} onChange={(e) => setDoc(i, 'docType', e.target.value)}>
                        {window.PA_DOC_TYPES.map(x => <option key={x} value={x}>{x}</option>)}
                      </select>
                    </td>
                    <td><input className="cfg-input pa-cell" value={d.docNo} onChange={(e) => setDoc(i, 'docNo', e.target.value)} placeholder="—" /></td>
                    <td><ErpDate value={d.docDate} onChange={(v) => ((e) => setDoc(i, 'docDate', e.target.value))({ target: { value: v } })} className="cfg-input pa-cell" /></td>
                    <td>
                      <label className="pa-file">
                        <Icon name="upload" size={12} />
                        <input className="cfg-input pa-cell" value={d.fileName} onChange={(e) => setDoc(i, 'fileName', e.target.value)} placeholder="เลือก/ระบุชื่อไฟล์" />
                      </label>
                    </td>
                    <td><input className="cfg-input pa-cell" value={d.note} onChange={(e) => setDoc(i, 'note', e.target.value)} placeholder="—" /></td>
                    <td className="center">
                      <button className="btn ghost sm danger" style={{ padding: '0 6px' }} onClick={() => delDoc(i)} title="ลบ"><Icon name="close" size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        )}
        <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          <Icon name="info" size={11} /> ผู้อัปโหลด/วันที่อัปโหลด บันทึกอัตโนมัติ · สถานะตรวจสอบเอกสารกำหนดในขั้นตรวจรับเอกสาร
        </p>
      </div>

      <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
        <Icon name="calendar" size={13} /><span>วันที่ปัจจุบัน</span><b className="mono">{fmt.date(window.paToday())}</b>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดคำขอ (อ่านอย่างเดียว) — รูปแบบ lt-head-card
// ════════════════════════════════════════════════════════════════════
function PaKv({ label, value, mono, span }) {
  const st = span ? { gridColumn: `span ${span}` } : null;
  return (
    <div className="icr-kv" style={st}>
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')}>{value ?? '—'}</span>
    </div>
  );
}

const PA_VERIFY = { ok: { l: 'ตรวจแล้ว', pill: 'ok' }, pending: { l: 'รอตรวจ', pill: 'warn' }, bad: { l: 'ไม่ผ่าน', pill: 'bad' } };

function PaDetailView({ rec, onBack, onApprove, onPay, onCancel }) {
  if (!rec) return null;
  const st = window.paStatus(rec.status);
  const t = window.paType(rec.type);
  const sum = window.paSummary(rec.lines, rec);
  const m = window.paMethod(rec.method);

  return (
    <div data-screen-label="หน้ารายละเอียดคำขอยืมเงินทดรอง">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียน</button>
        <span className="spacer" />
        <button className="btn sm" disabled><Icon name="print" /> พิมพ์</button>
        {rec.status === 'submitted' && (
          <>
            <button className="btn sm danger" onClick={() => onCancel(rec)}><Icon name="close" size={13} /> ยกเลิก</button>
            <button className="btn primary sm" onClick={() => onApprove(rec)}><Icon name="check" /> อนุมัติ</button>
          </>
        )}
        {rec.status === 'approved' && (
          <button className="btn primary sm" onClick={() => onPay(rec)}><Icon name="money" /> บันทึกจ่ายเงิน</button>
        )}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="money" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">คำขอยืมเงินทดรอง — {t.l}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{rec.memberName} ({rec.memberCode})</span><span className="dot" />
              <span>{rec.dept}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            <span className="chip info">{fmt.money(sum.requested, 0)} บ.</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">วันที่ทำรายการ</span><span className="lt-date-v">{fmt.date(rec.recordDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">เริ่ม–สิ้นสุดใช้เงิน</span><span className="lt-date-v">{fmt.date(rec.useStart)} – {fmt.date(rec.useEnd)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ครบกำหนดคืน</span><span className="lt-date-v">{fmt.date(rec.dueDate)}</span></div>
          <div className="lt-date"><span className="lt-date-k">วิธีรับเงิน</span><span className="lt-date-v">{m.l}</span></div>
        </div>
      </div>

      {/* ผู้ขอ + วัตถุประสงค์ */}
      <div className="pa-two" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ข้อมูลผู้ขอยืม</h3></div>
          <PaKv label="ตำแหน่ง" value={rec.position} />
          <PaKv label="หน่วยงาน / สังกัด" value={rec.dept} />
          <PaKv label="ผู้บังคับบัญชา" value={rec.supervisor} />
          <PaKv label="เบอร์โทร" value={rec.phone} mono />
          <PaKv label="อีเมล" value={rec.email} />
        </div>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายละเอียดการขอยืม</h3></div>
          <div className="icr-note-view" style={{ marginBottom: 10 }}>{rec.purpose}</div>
          <PaKv label="โครงการ / กิจกรรม" value={rec.project || '—'} />
          <PaKv label="สถานที่ดำเนินการ" value={rec.place || '—'} />
          <PaKv label="เอกสารอ้างอิง" value={rec.refDoc ? `${rec.refDoc}${rec.refDate ? ' · ' + fmt.date(rec.refDate) : ''}` : '—'} />
          <PaKv label="ปีบัญชี / งวด" value={`${rec.fiscalYear} · ${rec.fiscalPeriod || '—'}`} mono />
        </div>
      </div>

      {/* ประมาณการค่าใช้จ่าย */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายการประมาณการค่าใช้จ่าย</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 40 }}>#</th>
                <th>หมวด</th>
                <th>รายละเอียด</th>
                <th className="center">จำนวน</th>
                <th className="num">ราคา/หน่วย</th>
                <th className="num">จำนวนเงิน</th>
                <th>รหัสงบ / แหล่งเงิน</th>
              </tr>
            </thead>
            <tbody>
              {rec.lines.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>{r.cat}</td>
                  <td>{r.desc}</td>
                  <td className="center mono">{r.qty} {r.unit}</td>
                  <td className="num mono">{fmt.money(r.price, 2)}</td>
                  <td className="num mono">{fmt.money(window.paLineAmount(r), 2)}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.budget || '—'} · {(window.PA_FUND_SRC.find(f => f.v === r.fund) || {}).l || r.fund}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="pa-line-tot"><td colSpan="5" className="right">ยอดรวมก่อนภาษี</td><td className="num mono">{fmt.money(sum.subtotal, 2)}</td><td /></tr>
            </tfoot>
          </table>
        </div></div>
        <div className="pa-sum-box" style={{ marginLeft: 'auto', marginTop: 12 }}>
          <div className="pa-sum-row"><span>ภาษีมูลค่าเพิ่มโดยประมาณ</span><b className="mono">{fmt.money(sum.vat, 2)}</b></div>
          <div className="pa-sum-row"><span>ภาษีหัก ณ ที่จ่ายโดยประมาณ</span><b className="mono">-{fmt.money(sum.wht, 2)}</b></div>
          <div className="pa-sum-row grand"><span>ยอดที่ขอยืม</span><b className="mono">{fmt.money(sum.requested, 2)}</b></div>
        </div>
      </div>

      {/* วิธีรับเงิน */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>วิธีรับเงิน</h3></div>
        <div className="form-grid cols-4">
          <PaKv label="วิธีรับเงิน" value={m.l} />
          <PaKv label="วันที่ต้องการรับ" value={fmt.date(rec.receiveDate)} />
          {rec.method === 'transfer' ? (
            <>
              <PaKv label="ธนาคาร" value={rec.bank} />
              <PaKv label="เลขที่บัญชี" value={rec.acctNo} mono />
            </>
          ) : rec.method === 'cash' ? (
            <PaKv label="สถานที่รับเงิน" value={rec.place2 || '—'} span={2} />
          ) : (
            <PaKv label="หมายเหตุ" value="จ่ายด้วยเช็ค" span={2} />
          )}
        </div>
      </div>

      {/* เอกสารแนบ */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เอกสารแนบ</h3></div>
        {(!rec.docs || rec.docs.length === 0) ? (
          <div className="muted" style={{ fontSize: 12 }}>— ไม่มีเอกสารแนบ —</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ประเภทเอกสาร</th><th>เลขที่</th><th className="center">วันที่เอกสาร</th>
                  <th>ชื่อไฟล์</th><th>ผู้อัปโหลด</th><th className="center">วันที่อัปโหลด</th><th className="center">สถานะตรวจ</th>
                </tr>
              </thead>
              <tbody>
                {rec.docs.map((d, i) => {
                  const v = PA_VERIFY[d.verified] || PA_VERIFY.pending;
                  return (
                    <tr key={i}>
                      <td>{d.docType}</td>
                      <td className="mono">{d.docNo || '—'}</td>
                      <td className="center mono">{d.docDate ? fmt.date(d.docDate) : '—'}</td>
                      <td><span className="pa-file-name"><Icon name="attach" size={12} /> {d.fileName || '—'}</span></td>
                      <td>{d.by}</td>
                      <td className="center mono">{d.at ? fmt.date(d.at) : '—'}</td>
                      <td className="center"><span className={'pill ' + v.pill}>{v.l}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        )}
      </div>

      <div className="icr-today-badge" title="วันที่ปัจจุบันของระบบ">
        <Icon name="calendar" size={13} /><span>วันที่ปัจจุบัน</span><b className="mono">{fmt.date(window.paToday())}</b>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สลับ list / form / detail
// ════════════════════════════════════════════════════════════════════
function PettyAdvancePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = paUseState(window.paLoad);
  const [mode, setMode] = paUseState('list');
  const [current, setCurrent] = paUseState(null);

  window.useBreadcrumb(
    mode === 'form'
      ? [{ label: 'ขอยืมเงินทดรอง', onClick: () => setMode('list') }, { label: 'สร้างคำขอยืมเงินทดรอง', current: true }]
      : mode === 'detail'
        ? [{ label: 'ขอยืมเงินทดรอง', onClick: () => setMode('list') }, { label: current ? current.id : 'รายละเอียด', current: true }]
        : [{ label: 'ขอยืมเงินทดรอง', current: true }],
    [mode, current]);

  const persist = (next) => { setList(next); window.paSave(next); };
  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };

  const submit = (rec, status) => {
    persist([rec, ...list]);
    const sum = window.paSummary(rec.lines, rec);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — ขอยืมเงินทดรอง',
      target: `${rec.id} · ${rec.memberName}`,
      summary: `${status === 'draft' ? 'บันทึกร่าง' : 'สร้าง'}คำขอยืมเงินทดรอง ${rec.id} · ${window.paType(rec.type).l} · ${fmt.money(sum.requested, 2)} บาท`,
    });
    onToast && onToast(status === 'draft'
      ? `บันทึกร่างคำขอ ${rec.id} แล้ว`
      : `บันทึกและส่งอนุมัติคำขอ ${rec.id} · ${rec.memberName} เรียบร้อย`);
    setMode('list');
  };

  const setStatus = (rec, status, verb) => {
    const updated = { ...rec, status };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setCurrent(updated);
    audit.log && audit.log({
      action: 'update', module: 'การเงิน — ขอยืมเงินทดรอง',
      target: `${rec.id} · ${rec.memberName}`, summary: `${verb}คำขอยืมเงินทดรอง ${rec.id}`,
    });
    onToast && onToast(`${verb}คำขอ ${rec.id} แล้ว`);
  };

  return (
    <>
      {mode === 'list'
        ? <PaListView list={list} onCreate={() => setMode('form')} onOpen={openDetail} />
        : mode === 'detail'
          ? <PaDetailView rec={current} onBack={() => setMode('list')}
              onApprove={(r) => setStatus(r, 'approved', 'อนุมัติ')}
              onPay={(r) => setStatus(r, 'paid', 'บันทึกจ่ายเงิน')}
              onCancel={(r) => setStatus(r, 'cancelled', 'ยกเลิก')} />
          : <PaCreateForm list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
    </>
  );
}

Object.assign(window, { PettyAdvancePage, PaListView, PaCreateForm, PaDetailView });
