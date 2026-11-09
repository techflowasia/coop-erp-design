// ════════════════════════════════════════════════════════════════════
//  อายัดตามหมายศาล — บันทึกการอายัดเงินปันผล/เฉลี่ยคืนตามคำสั่งศาล
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  หน้าเดียว: ค้นหาสมาชิก · กรอกรายละเอียดหมายอายัด · ประวัติรายการอายัด
//  ใช้ DnField / DnMemberSearchModal ร่วมกับ แจ้งให้ชำระหนี้
// ════════════════════════════════════════════════════════════════════

// ─── ฟอร์มเปล่า ─────────────────────────────────────────────────────
const csBlankForm = () => ({
  seizeType: '1', status: 'active',
  recvDate: '', recvNo: '', letterNo: '', seizeDate: '',
  withdrawRecvDate: '', withdrawRecvNo: '', withdrawLetterNo: '', withdrawDate: '',
  redCaseNo: '', plaintiff: '', court: '', execOffice: '', note: '',
});

function CourtSeizurePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.csLoad);
  const [member, setMember] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(csBlankForm);
  const [editingId, setEditingId] = useState(null);   // null = รายการใหม่
  const [reqNo, setReqNo] = useState('');              // '' = Auto (ยังไม่บันทึก)
  const [error, setError] = useState('');
  const [lastEdit, setLastEdit] = useState(null);      // {at, by}

  const persist = (next) => { setList(next); window.csSaveLS(next); };
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const isWithdrawn = form.status === 'withdrawn';

  // ── ค้นหา / เลือกสมาชิก ──
  const pickMember = (m) => { setMember(m); setCodeInput(m.code); setModal(false); setError(''); };
  const resolveCode = () => {
    const q = codeInput.trim();
    if (!q) { setModal(true); return; }
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
    const hit = (window.DN_MEMBERS || []).find(m => norm(m.code) === norm(q) || norm(m.code).endsWith(norm(q)));
    if (hit) pickMember(hit); else setModal(true);
  };

  // ── ปุ่มหลัก ──
  const clearAll = () => {
    setMember(null); setCodeInput(''); setForm(csBlankForm());
    setEditingId(null); setReqNo(''); setError(''); setLastEdit(null);
  };
  const newSeizure = () => {
    if (!member) { setError('กรุณาเลือกสมาชิกก่อนเพิ่มหมายอายัด'); return; }
    setForm(csBlankForm()); setEditingId(null);
    setReqNo(window.csNextReqNo(list)); setError(''); setLastEdit(null);
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิกก่อนบันทึกรายการอายัด';
    if (!form.seizeType) return 'กรุณาเลือกประเภทการอายัด';
    if (!form.status) return 'กรุณาระบุสถานะหมายอายัด';
    if (!form.recvDate && !form.seizeDate) return 'กรุณาระบุวันที่ลงรับ สอ. หรือวันที่อายัดอย่างน้อย 1 ช่อง';
    if (form.status === 'withdrawn') {
      if (!form.withdrawLetterNo.trim()) return 'สถานะถอนอายัด — ต้องระบุเลขหนังสือถอน';
      if (!form.withdrawDate) return 'สถานะถอนอายัด — ต้องระบุวันที่ถอนอายัด';
    }
    if (form.seizeDate && form.withdrawDate && form.withdrawDate < form.seizeDate)
      return 'วันที่ถอนอายัดต้องไม่ก่อนวันที่อายัด';
    if (form.letterNo.trim()) {
      const dup = list.find(r => r.id !== editingId && (r.letterNo || '').trim() === form.letterNo.trim());
      if (dup) return `เลขหนังสืออายัด "${form.letterNo.trim()}" ซ้ำกับรายการ ${dup.reqNo}`;
    }
    return '';
  };

  const save = () => {
    const err = validate();
    if (err) { setError(err); return; }
    const now = new Date().toISOString().slice(0, 16);
    if (editingId) {
      const updated = list.map(r => r.id === editingId ? {
        ...r, ...form,
        memberCode: member.code, memberName: member.name, dept: member.dept, deptCode: member.deptCode, memberStatus: member.status,
        editedBy: window.CS_USER, editedAt: now,
      } : r);
      persist(updated);
      setLastEdit({ at: now, by: window.CS_USER });
      audit.log && audit.log({
        action: 'update', module: 'ทะเบียนและติดตามหนี้ — อายัดตามหมายศาล',
        target: `${member.code} · ${member.name}`,
        summary: `แก้ไขหมายอายัด ${reqNo} · ${window.csSeizeType(form.seizeType).l} · ${window.csStatus(form.status).l}`,
      });
      onToast && onToast(`บันทึกการแก้ไขหมายอายัด ${reqNo} เรียบร้อยแล้ว`);
    } else {
      const no = reqNo || window.csNextReqNo(list);
      const rec = {
        id: 'CS-' + Date.now().toString(36), reqNo: no, ...form,
        memberCode: member.code, memberName: member.name, dept: member.dept, deptCode: member.deptCode, memberStatus: member.status,
        enteredBy: window.CS_USER, enteredAt: now,
      };
      persist([rec, ...list]);
      setEditingId(rec.id); setReqNo(no); setLastEdit({ at: now, by: window.CS_USER });
      audit.log && audit.log({
        action: 'create', module: 'ทะเบียนและติดตามหนี้ — อายัดตามหมายศาล',
        target: `${member.code} · ${member.name}`,
        summary: `บันทึกหมายอายัด ${no} · ${window.csSeizeType(form.seizeType).l} · ${window.csStatus(form.status).l}`,
      });
      onToast && onToast(`บันทึกหมายอายัด ${no} · ${member.name} เรียบร้อยแล้ว`);
    }
  };

  // ── ประวัติ: ดู / แก้ไข / ลบ ──
  const loadRow = (r) => {
    const m = (window.DN_MEMBERS || []).find(x => x.code === r.memberCode)
      || { code: r.memberCode, name: r.memberName, dept: r.dept, deptCode: r.deptCode, status: r.memberStatus };
    setMember(m); setCodeInput(r.memberCode);
    const { id, reqNo: rn, memberCode, memberName, dept, deptCode, memberStatus, enteredBy, enteredAt, editedBy, editedAt, ...rest } = r;
    setForm({ ...csBlankForm(), ...rest });
    setEditingId(r.id); setReqNo(r.reqNo); setError('');
    setLastEdit(editedAt ? { at: editedAt, by: editedBy } : { at: enteredAt, by: enteredBy });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const delRow = (r) => {
    persist(list.filter(x => x.id !== r.id));
    if (editingId === r.id) clearAll();
    onToast && onToast(`ลบหมายอายัด ${r.reqNo} แล้ว`);
  };

  const memberSeizures = member ? list.filter(r => r.memberCode === member.code) : list;

  return (
    <div data-screen-label="อายัดตามหมายศาล">
      {/* ── หัวเรื่อง + ปุ่มหลัก ── */}
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>อายัดตามหมายศาล</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
            บันทึกการอายัดเงินปันผล/เฉลี่ยคืนของสมาชิกตามคำสั่งศาลหรือสำนักงานบังคับคดี
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={save}><Icon name="save" /> บันทึก</button>
        <button className="btn" onClick={clearAll}><Icon name="refresh" /> ล้างข้อมูล</button>
        <button className="btn" disabled><Icon name="print" /> พิมพ์</button>
        <button className="btn primary" onClick={newSeizure}><Icon name="plus" /> เพิ่มหมายอายัด</button>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ข้อมูลสมาชิก ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
        </div>
        <div className="cs-member-grid">
          <DnField label="เลขสมาชิก" required hint="(ค้นหาจากทะเบียนสมาชิก)">
            <div className="cs-code-wrap">
              <input className="cfg-input mono" value={codeInput}
                     onChange={(e) => setCodeInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && resolveCode()}
                     placeholder="เช่น 050000" />
              <button className="btn primary cs-code-btn" onClick={resolveCode} title="ค้นหาสมาชิก"><Icon name="search" /></button>
            </div>
          </DnField>
          <DnField label="ชื่อ - สกุล">
            <input className="cfg-input sr-auto" value={member ? member.name : ''} readOnly placeholder="(แสดงอัตโนมัติ)" />
          </DnField>
          <DnField label="สังกัด">
            <input className="cfg-input sr-auto" value={member ? `${member.deptCode || ''} - ${member.dept || ''}` : ''} readOnly placeholder="(แสดงอัตโนมัติ)" />
          </DnField>
          <div className="cs-mstatus" data-empty={!member}>
            <span className="cs-mstatus-ico"><Icon name="user" size={16} /></span>
            <div>
              <div className="cs-mstatus-label">สถานะสมาชิก</div>
              <div className="cs-mstatus-value">{member ? (member.memberType || member.status || 'สมาชิกปกติ') : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── รายละเอียดการอายัด ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>รายละเอียดการอายัด</h3>
          {editingId && (
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className="chip info"><Icon name="edit" size={11} /> กำลังแก้ไข {reqNo}</span>
            </div>
          )}
        </div>

        <div className="form-grid cols-4 cs-fg">
          <DnField label="เลขที่คำขอ" hint="(ออกอัตโนมัติ)">
            <input className="cfg-input mono ds-auto-field" value={reqNo || 'Auto'} readOnly />
          </DnField>
          <DnField label="อายัดประเภท" required span={2}>
            <select className="cfg-input" value={form.seizeType} onChange={(e) => set('seizeType', e.target.value)}>
              {window.CS_SEIZE_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </DnField>
          <DnField label="สถานะ" required>
            <div className="cs-status-wrap">
              <span className="cs-status-dot" style={{ background: window.csStatus(form.status).dot }} />
              <select className="cfg-input cs-status-select" value={form.status} onChange={(e) => set('status', e.target.value)}>
                {window.CS_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
          </DnField>

          <DnField label="วันที่ลงรับ สอ." hint="(วันที่สหกรณ์รับเอกสาร)">
            <ErpDate value={form.recvDate} onChange={(v) => ((e) => set('recvDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>
          <DnField label="เลขลงรับ สอ.">
            <input className="cfg-input mono" value={form.recvNo} onChange={(e) => set('recvNo', e.target.value)} placeholder="-" />
          </DnField>
          <DnField label="เลขหนังสืออายัด">
            <input className="cfg-input mono" value={form.letterNo} onChange={(e) => set('letterNo', e.target.value)} placeholder="-" />
          </DnField>
          <DnField label="วันที่อายัด" hint="(วันที่คำสั่งมีผล)">
            <ErpDate value={form.seizeDate} onChange={(v) => ((e) => set('seizeDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DnField>

          <DnField label="วันที่ลงรับถอน สอ.">
            <ErpDate value={form.withdrawRecvDate} onChange={(v) => ((e) => set('withdrawRecvDate', e.target.value))({ target: { value: v } })} disabled={!isWithdrawn} className="cfg-input" />
          </DnField>
          <DnField label="เลขลงรับถอน สอ.">
            <input className="cfg-input mono" value={form.withdrawRecvNo} onChange={(e) => set('withdrawRecvNo', e.target.value)} placeholder="-" disabled={!isWithdrawn} />
          </DnField>
          <DnField label="เลขหนังสือถอน" required={isWithdrawn}>
            <input className="cfg-input mono" value={form.withdrawLetterNo} onChange={(e) => set('withdrawLetterNo', e.target.value)} placeholder="-" disabled={!isWithdrawn} />
          </DnField>
          <DnField label="วันที่ถอนอายัด" required={isWithdrawn}>
            <ErpDate value={form.withdrawDate} onChange={(v) => ((e) => set('withdrawDate', e.target.value))({ target: { value: v } })} disabled={!isWithdrawn} className="cfg-input" />
          </DnField>

          <DnField label="เลขคดีแดง" span={2}>
            <input className="cfg-input mono" value={form.redCaseNo} onChange={(e) => set('redCaseNo', e.target.value)} placeholder="-" />
          </DnField>
          <DnField label="โจทก์ผู้ฟ้อง" span={2}>
            <input className="cfg-input" value={form.plaintiff} onChange={(e) => set('plaintiff', e.target.value)} placeholder="-" />
          </DnField>

          <DnField label="ศาล" span={2}>
            <input className="cfg-input" list="cs-courts" value={form.court} onChange={(e) => set('court', e.target.value)} placeholder="-" />
          </DnField>
          <DnField label="สนง.บังคับคดี" span={2}>
            <select className="cfg-input" value={form.execOffice} onChange={(e) => set('execOffice', e.target.value)}>
              <option value="">- กรุณาเลือก -</option>
              {window.CS_EXEC_OFFICES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </DnField>

          <DnField label="หมายเหตุ" full>
            <textarea className="cfg-input" rows={3} value={form.note} onChange={(e) => set('note', e.target.value)}
                      placeholder="ระบุหมายเหตุ (ถ้ามี) — คำอธิบายหมายอายัด เงื่อนไข ข้อสังเกตของเจ้าหน้าที่ เหตุผลการถอนอายัด" />
          </DnField>
        </div>
        <datalist id="cs-courts">{window.CS_COURTS.map(c => <option key={c} value={c} />)}</datalist>

        <div className="cs-edited">
          แก้ไขล่าสุด {lastEdit ? `${window.csBeDateTime(lastEdit.at)} โดย ${lastEdit.by}` : '— (ยังไม่บันทึก)'}
        </div>
      </div>

      {/* ── ประวัติรายการอายัด ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ประวัติรายการอายัด</h3>
          {member && (
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <span className="muted" style={{ fontSize: 11.5 }}>{member.code} · {member.name}</span>
            </div>
          )}
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่คำขอ</th>
                <th>ประเภทอายัด</th>
                <th className="center">สถานะ</th>
                <th className="center">วันที่อายัด</th>
                <th className="center">วันที่ถอนอายัด</th>
                <th>ศาล</th>
                <th>ผู้บันทึก</th>
                <th className="center">วันที่บันทึก</th>
                <th className="center" style={{ width: 118 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {memberSeizures.length === 0 ? (
                <tr><td colSpan="9" className="empty-state" style={{ padding: '20px 8px' }}>
                  ยังไม่มีประวัติการอายัด — เลือกสมาชิกและกด “เพิ่มหมายอายัด”
                </td></tr>
              ) : memberSeizures.map((r) => {
                const st = window.csStatus(r.status);
                return (
                  <tr key={r.id} className={editingId === r.id ? 'cs-row-active' : ''}>
                    <td className="mono">{r.reqNo}</td>
                    <td>{window.csSeizeType(r.seizeType).l}</td>
                    <td className="center"><span className={`pill ${st.pill}`}>{st.l}</span></td>
                    <td className="center">{window.csBeDate(r.seizeDate)}</td>
                    <td className="center">{window.csBeDate(r.withdrawDate)}</td>
                    <td>{r.court || '-'}</td>
                    <td>{r.enteredBy}</td>
                    <td className="center">{window.csBeDateTime(r.enteredAt)}</td>
                    <td className="center">
                      <div className="cs-row-actions">
                        <button className="btn ghost sm info" onClick={() => loadRow(r)} title="ดูรายละเอียด"><Icon name="eye" size={13} /></button>
                        <button className="btn ghost sm" onClick={() => loadRow(r)} title="แก้ไข"><Icon name="edit" size={13} /></button>
                        <button className="btn ghost sm danger" onClick={() => delRow(r)} title="ลบ"><Icon name="trash" size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
          แสดง {memberSeizures.length} รายการ
          {member ? ' ของสมาชิกที่เลือก' : ' (ทั้งหมด)'}
        </div>
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { CourtSeizurePage });
