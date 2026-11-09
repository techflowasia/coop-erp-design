// ════════════════════════════════════════════════════════════════════
//  สถานะสมาชิก — ปรับสถานะสมาชิก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง:
//    • ค้นหาสมาชิก (รูปแบบกลาง Design System) + สรุปภาระผูกพัน
//    • เลือกสถานะที่ต้องการปรับ (ลาออก / ปลดออก / ให้ออก / เสียชีวิต)
//    • ฟอร์มข้อมูลตามสถานะ (ขับด้วย MS_FIELDS)
//    • แถบอธิบายผลของการบันทึก (เสียชีวิต = ทันที · อื่น ๆ = ล็อกกู้/ค้ำ)
// ════════════════════════════════════════════════════════════════════

// ─── ฟิลด์ (label เล็กด้านบน + control) ─────────────────────────────
function MsFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 160 } : { width: w || 160 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function MsRO({ value, mono, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── control ตามชนิดฟิลด์ ───────────────────────────────────────────
function MsFieldControl({ f, value, onChange, disabled }) {
  if (f.type === 'textarea') {
    return (
      <div className="icr-note-wrap">
        <textarea className="cfg-input" rows={f.rows || 2} value={value || ''} maxLength={500}
                  disabled={disabled} placeholder={f.placeholder || ''}
                  onChange={(e) => onChange(e.target.value)} />
        <span className="icr-note-count">{(value || '').length}/500</span>
      </div>
    );
  }
  if (f.type === 'select') {
    const opts = typeof f.options === 'function' ? f.options() : (f.options || []);
    return (
      <select className="cfg-input" value={value || ''} disabled={disabled}
              onChange={(e) => onChange(e.target.value)}>
        <option value="">— เลือก —</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === 'file') {
    return (
      <label className={'ms-file' + (disabled ? ' disabled' : '') + (value ? ' has' : '')}>
        <Icon name={value ? 'attach' : 'upload'} size={14} />
        <span className="ms-file-name">{value || 'แนบไฟล์ PDF / รูปภาพ'}</span>
        <input type="file" hidden disabled={disabled}
               onChange={(e) => onChange(e.target.files[0] ? e.target.files[0].name : '')} />
      </label>
    );
  }
  return (
    <input className={'cfg-input' + (f.mono ? ' mono' : '')} type={f.type || 'text'}
           value={value || ''} disabled={disabled} placeholder={f.placeholder || ''}
           onChange={(e) => onChange(e.target.value)} />
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function MsFormScreen({ onToast, audit }) {
  const { useState } = React;
  const fmt = window.fmt;
  const today = window.msToday();

  const [member, setMember] = useState(null);
  const [statusV, setStatusV] = useState('');
  const [form, setForm] = useState({});
  const [savedNo, setSavedNo] = useState('');
  const [applied, setApplied] = useState(null);   // ผลหลังบันทึก
  const [error, setError] = useState('');

  const def = window.msStatusDef(statusV);
  const fields = statusV ? (window.MS_FIELDS[statusV] || []) : [];
  const sum = window.rsnSummary(member);
  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const pickMember = (m) => {
    setMember(m); setError('');
    setStatusV(''); setForm({}); setSavedNo(''); setApplied(null);
    // ถ้าสมาชิกเคยถูกปรับสถานะแล้ว แสดงผลเดิม
    const prev = window.msAppliedOf(m.code);
    if (prev) setApplied(prev);
  };

  const chooseStatus = (v) => {
    if (applied) return;                         // ปรับแล้ว ล็อกไว้
    setStatusV(v); setError('');
    // เติมค่าเริ่มต้นวันที่ให้ฟิลด์วันที่หลัก
    const init = {};
    if (v === 'resign') { init.submitDate = today; init.effectiveDate = today; }
    if (v === 'deceased') { init.deathDate = ''; }
    setForm(init);
  };

  const clearScreen = () => {
    setMember(null); setStatusV(''); setForm({}); setSavedNo(''); setApplied(null); setError('');
  };

  const validate = () => {
    if (!member) return 'กรุณาค้นหาและเลือกสมาชิกก่อนทำรายการ';
    if (!statusV) return 'กรุณาเลือกสถานะที่ต้องการปรับ';
    for (const f of fields) {
      if (f.required && !String(form[f.key] || '').trim()) return `กรุณาระบุ “${f.label}”`;
      if (f.otherWhen && form[f.key] === f.otherWhen && !String(form[f.otherKey] || '').trim())
        return `กรุณาระบุ “${f.otherLabel || 'รายละเอียด (อื่น ๆ)'}”`;
    }
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); onToast && onToast(err); return; }
    setError('');
    const no = savedNo || window.msNextDocNo(window.msBeYear(today));
    setSavedNo(no);
    const extra = statusV === 'deceased' ? { deathDate: form.deathDate } : {};
    const res = window.msApply(member, statusV, no, extra);
    setApplied(res);
    audit && audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — สถานะสมาชิก',
      target: `${member.code} · ${member.name}`,
      summary: `ปรับสถานะเป็น “${def.l}” · เลขที่รายการ ${no}`,
    });
    const tail = def.effect === 'immediate'
      ? ' — อัปเดตสถานะทะเบียนสมาชิกทันที'
      : ' — ระงับการทำรายการกู้เงิน/ค้ำประกันของสมาชิก';
    onToast && onToast(`บันทึกการปรับสถานะ ${no} · ${member.name} เป็น “${def.l}” เรียบร้อย${tail}`);
  };

  const doPrint = () => {
    if (!member || !statusV) { setError('กรุณาเลือกสมาชิกและสถานะก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์เอกสารปรับสถานะสมาชิก…');
    setTimeout(() => window.print(), 80);
  };

  const curPill = member ? ((window.DN_MEMBER_STATUS && window.DN_MEMBER_STATUS[member.status]) || {}).pill || 'ok' : 'neutral';

  return (
    <div data-screen-label="สถานะสมาชิก">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="member" size={20} /></span>
          <div>
            <h1>แจ้งเปลี่ยนสถานะ</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · แจ้งเปลี่ยนสถานะสมาชิก — ลาออก · ปลดออก · ให้ออก · เสียชีวิต พร้อมบันทึกเอกสารอ้างอิงและผลต่อการทำรายการ</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn primary sm" onClick={doSave} disabled={!!applied}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn danger sm" onClick={clearScreen}><Icon name="close" size={13} /> ยกเลิก</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      {/* ── ค้นหาสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>เลือกสมาชิกที่ต้องการปรับสถานะ</h3></div>
        <div className="icr-strip">
          <MsFld label="เลขที่รายการ" w={180}>
            {savedNo ? <MsRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </MsFld>
          <MsFld label="ทะเบียนสมาชิก" w={260} required>
            <MemberSearchField member={member} onPick={pickMember}
                               source={window.RSN_MEMBERS} searchFn={window.rsnSearchMembers}
                               title="ค้นหาสมาชิกที่ต้องการปรับสถานะ" placeholder="คลิกเพื่อค้นหาเลขสมาชิก / ชื่อ…" />
          </MsFld>
          <MsFld label="ชื่อ - ชื่อสกุล" grow w={240}><MsRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></MsFld>
          <MsFld label="สังกัด" grow w={220}><MsRO value={member ? `${member.dept} (${member.deptCode})` : ''} placeholder="(ดึงอัตโนมัติ)" /></MsFld>
          <MsFld label="สถานะปัจจุบัน" w={130}>
            {member
              ? <div className="icr-ro" style={{ padding: '0 8px' }}><span className={'pill ' + curPill}>{member.status}</span></div>
              : <MsRO value="" />}
          </MsFld>
          <MsFld label="สถานะที่ต้องการปรับ" w={220} required>
            <select className="cfg-input" value={statusV} disabled={!member || !!applied}
                    onChange={(e) => chooseStatus(e.target.value)}>
              <option value="">— เลือกสถานะ —</option>
              {window.MS_STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </MsFld>
        </div>
      </div>

      {/* ── ฟอร์มตามสถานะ ── */}
      {statusV && (
        <div className="search-card icr-sec">
          <div className="section-head">
            <span className="head-bar" /><h3>ข้อมูลการปรับสถานะ — {def.l}</h3>
            <span style={{ marginLeft: 'auto' }}><span className={'chip ' + def.chip}>{def.l}</span></span>
          </div>
          <div className="icr-strip icr-wrap">
            {fields.map(f => {
              const showOther = f.otherWhen && form[f.key] === f.otherWhen;
              return (
                <React.Fragment key={f.key}>
                  <MsFld label={f.label} w={f.w} grow={f.grow} required={f.required}>
                    <MsFieldControl f={f} value={form[f.key]} onChange={(v) => setF(f.key, v)} disabled={!!applied} />
                  </MsFld>
                  {showOther && (
                    <MsFld label={f.otherLabel || 'ระบุ (อื่น ๆ)'} grow w={300} required>
                      <input className="cfg-input" value={form[f.otherKey] || ''} disabled={!!applied}
                             placeholder="โปรดระบุรายละเอียด"
                             onChange={(e) => setF(f.otherKey, e.target.value)} />
                    </MsFld>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* แถบอธิบายผล */}
          <div className={'ms-effect ' + (def.effect === 'immediate' ? 'now' : 'lock')}>
            <Icon name={def.effect === 'immediate' ? 'refresh' : 'lock'} size={15} />
            <span>
              {def.effect === 'immediate'
                ? <>เมื่อบันทึก ระบบจะ<b>อัปเดตสถานะที่ทะเบียนสมาชิกเป็น “{def.regStatus}” ทันที</b></>
                : <>เมื่อบันทึก สถานะทะเบียนสมาชิกจะเปลี่ยนเป็น “{def.regStatus}” และสมาชิก<b>จะไม่สามารถทำรายการกู้เงินหรือค้ำประกันเงินกู้ได้อีก</b></>}
            </span>
          </div>
        </div>
      )}

      {/* ── ผลหลังบันทึก ── */}
      {applied && (
        <div className={'ms-result ' + (applied.effect === 'immediate' ? 'now' : 'lock')}>
          <span className="ms-result-ico"><Icon name={applied.effect === 'immediate' ? 'check' : 'lock'} size={18} /></span>
          <div className="ms-result-body">
            <div className="ms-result-title">
              บันทึกการปรับสถานะเรียบร้อย — <b>{applied.statusLabel}</b>
              <span className="mono muted" style={{ fontWeight: 400, marginLeft: 8 }}>{applied.docNo}</span>
            </div>
            <div className="ms-result-sub">
              {applied.effect === 'immediate'
                ? <>สถานะทะเบียนสมาชิกถูกอัปเดตเป็น “{applied.regStatus}” แล้ว{applied.deathDate ? ` (วันที่เสียชีวิต ${fmt.date(applied.deathDate)})` : ''}</>
                : <>สมาชิกรายนี้ถูกระงับการทำรายการกู้เงินและค้ำประกันเงินกู้แล้ว — สถานะทะเบียน “{applied.regStatus}”</>}
            </div>
          </div>
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> ทำรายการใหม่</button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function MemberStatusPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <MsFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { MemberStatusPage, MsFormScreen });
