// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน — ค่าคงที่ (Agent Debtor · master-data config)
//  ─ AgentCrudPage : ตาราง CRUD ทั่วไป (เพิ่ม / แก้ไข / ลบ / เปิด-ปิดใช้งาน)
//    ขับเคลื่อนด้วย fields config — ใช้ซ้ำกับหลายเมนู
//  ─ 4 หน้าค่าคงที่แบบตาราง: ประเภทใบเสร็จ · สังกัดตัวแทน · สาเหตุการยกเลิก ·
//    ประเภทการชำระ
//  ─ AgentDayConfigPage : เปิด-ปิดวัน (สถานะวัน/เดือน/ปี รายระบบ)
// ════════════════════════════════════════════════════════════════════

let _agSeq = 0;
const agUid = (pfx) => (pfx || 'AG') + '-' + Date.now().toString(36) + '-' + (++_agSeq);

// ─── Add / edit modal (generic, fields-driven) ──────────────────────
function AgentCrudModal({ mode, cfg, draft0, existing, onClose, onSubmit }) {
  const isEdit = mode === 'edit';
  const fields = cfg.fields;
  const [vals, setVals] = useState(() => {
    const v = {};
    fields.forEach(f => {
      v[f.key] = isEdit ? (draft0[f.key] != null ? draft0[f.key] : (f.def ?? '')) : (f.def ?? (f.type === 'toggle' ? true : (f.type === 'sign' ? '+' : '')));
    });
    return v;
  });
  const [error, setError] = useState('');
  const set = (k, v) => { setVals(p => ({ ...p, [k]: v })); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    for (const f of fields) {
      if (f.required && !String(vals[f.key] ?? '').trim()) { setError(`กรุณาระบุ${f.label}`); return; }
    }
    const codeKey = cfg.codeKey || 'code';
    const c = String(vals[codeKey]).trim();
    const dup = (existing || []).some(x => String(x[codeKey]) === c && (!isEdit || x.id !== draft0.id));
    if (dup) { setError(`รหัส “${c}” มีอยู่แล้ว — กรุณาใช้รหัสอื่น`); return; }
    const out = {};
    fields.forEach(f => {
      let val = vals[f.key];
      if (f.type === 'text' || f.type === 'code') val = String(val).trim();
      out[f.key] = val;
    });
    onSubmit(out);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? `แก้ไข${cfg.entity}` : `เพิ่ม${cfg.entity}`}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{cfg.modalHint || cfg.subtitle}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="bud-form-grid">
            {fields.map(f => (
              <div className={"bud-fld" + (f.half ? '' : ' span2')} key={f.key}>
                <label className="lt-modal-label">
                  {f.label}{f.required && <span className="cfg-required"> *</span>}
                </label>
                {f.type === 'select' ? (
                  <select className="cfg-input" value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)}>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'sign' ? (
                  <div className="ac-status-pick">
                    <button type="button" className={"ac-status-opt" + (vals[f.key] === '+' ? ' active' : '')}
                            onClick={() => set(f.key, '+')}>
                      <span className="ac-dot ok" /> รับเข้า (+)
                    </button>
                    <button type="button" className={"ac-status-opt" + (vals[f.key] === '-' ? ' active off' : '')}
                            onClick={() => set(f.key, '-')}>
                      <span className="ac-dot off" /> จ่ายออก (−)
                    </button>
                  </div>
                ) : f.type === 'toggle' ? (
                  <div className="ac-status-pick">
                    <button type="button" className={"ac-status-opt" + (vals[f.key] ? ' active' : '')}
                            onClick={() => set(f.key, true)}>
                      <span className="ac-dot ok" /> ใช้งาน
                    </button>
                    <button type="button" className={"ac-status-opt" + (!vals[f.key] ? ' active off' : '')}
                            onClick={() => set(f.key, false)}>
                      <span className="ac-dot off" /> ปิดใช้งาน
                    </button>
                  </div>
                ) : (
                  <input className={"cfg-input" + (f.mono ? ' mono' : '')} value={vals[f.key]}
                         autoFocus={f.autoFocus} maxLength={f.maxLength} placeholder={f.placeholder || ''}
                         onChange={(e) => set(f.key, f.numeric ? e.target.value.replace(/\D/g, '') : e.target.value)} />
                )}
                {f.hint && <div className="bud-fld-hint">{f.hint}</div>}
              </div>
            ))}
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : `บันทึก${cfg.entity}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Delete-confirm modal ───────────────────────────────────────────
function AgentDeleteModal({ cfg, rec, onClose, onConfirm }) {
  const label = rec[cfg.descKey || 'desc'] || rec.name || rec.code;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 440 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'color-mix(in srgb, var(--danger) 12%, transparent)', color: 'var(--danger)' }}><Icon name="trash" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ลบ{cfg.entity}</h2>
            <div className="muted" style={{ fontSize: 11 }}>การลบไม่สามารถย้อนกลับได้</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.6 }}>
            ยืนยันการลบ{cfg.entity} <b>“{label}”</b> (รหัส {rec.code}) ออกจากค่าคงที่หรือไม่?
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>
              <Icon name="trash" /> ลบรายการ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Generic CRUD page ──────────────────────────────────────────────
function AgentCrudPage({ cfg, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(cfg.load);
  const [modal, setModal] = useState(null);
  const codeKey = cfg.codeKey || 'code';
  const descKey = cfg.descKey || 'desc';
  const enableField = cfg.fields.find(f => f.type === 'toggle');

  const persist = (next) => { setList(next); cfg.save(next); };
  const sorted = React.useMemo(
    () => [...list].sort((a, b) => String(a[codeKey]).localeCompare(String(b[codeKey]), 'th')), [list, codeKey]);

  const submit = (vals) => {
    const label = vals[descKey] || vals.name || vals[codeKey];
    if (modal.mode === 'edit') {
      persist(list.map(x => x.id === modal.rec.id ? { ...x, ...vals } : x));
      audit.log({ action: 'update', module: cfg.module, target: `${vals[codeKey]} · ${label}`, summary: `แก้ไข${cfg.entity} “${label}”` });
      onToast && onToast(`บันทึกการแก้ไข${cfg.entity} “${label}” เรียบร้อยแล้ว`);
    } else {
      persist([...list, { id: agUid(cfg.uidPrefix), ...vals }]);
      audit.log({ action: 'create', module: cfg.module, target: `${vals[codeKey]} · ${label}`, summary: `เพิ่ม${cfg.entity} “${label}”`,
        changes: [{ field: 'รหัส', before: '—', after: vals[codeKey] }] });
      onToast && onToast(`เพิ่ม${cfg.entity} “${label}” เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  const doDelete = () => {
    const d = modal.rec;
    persist(list.filter(x => x.id !== d.id));
    audit.log({ action: 'delete', module: cfg.module, target: `${d[codeKey]} · ${d[descKey] || d.name}`, summary: `ลบ${cfg.entity} “${d[descKey] || d.name}”` });
    onToast && onToast(`ลบ${cfg.entity} “${d[descKey] || d.name}” แล้ว`);
    setModal(null);
  };

  const toggleEnabled = (d) => {
    persist(list.map(x => x.id === d.id ? { ...x, enabled: !x.enabled } : x));
    audit.log({ action: 'update', module: cfg.module, target: `${d[codeKey]} · ${d.name || d[descKey]}`,
      summary: `${d.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}${cfg.entity} “${d.name || d[descKey]}”` });
    onToast && onToast(`${d.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}${cfg.entity} “${d.name || d[descKey]}” แล้ว`);
  };

  const resetSeed = () => { persist(cfg.seed()); onToast && onToast(`คืนค่า${cfg.entity}ตั้งต้นเรียบร้อยแล้ว`); };

  // คอลัมน์ที่แสดง = ทุก field ยกเว้น toggle (toggle แสดงเป็นสวิตช์สถานะ)
  const dataCols = cfg.fields.filter(f => f.type !== 'toggle');
  const colSpan = dataCols.length + (enableField ? 1 : 0) + 1;

  const renderCell = (f, r) => {
    const v = r[f.key];
    if (f.key === codeKey) return <span className="ac-code-badge mono" style={{ width: 'auto', minWidth: 44, padding: '0 9px', fontSize: 13, borderRadius: 6 }}>{v}</span>;
    if (f.type === 'sign') return <span className={"chip " + (v === '+' ? 'success' : 'neutral')}>{v === '+' ? 'รับเข้า +' : 'จ่ายออก −'}</span>;
    if (f.mono) return v ? <span className="mono">{v}</span> : <span className="muted">—</span>;
    return v ? v : <span className="muted">—</span>;
  };

  return (
    <div data-screen-label={`หน้าค่าคงที่${cfg.entity}`}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cfg.title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>{cfg.subtitle}</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่ม{cfg.entity}
        </button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bud-toolbar">
          <div className="muted" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="info" size={12} /> {cfg.toolbarHint}
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl ac-tbl" style={{ minWidth: cfg.minWidth || 720 }}>
            <thead>
              <tr>
                {dataCols.map(f => (
                  <th key={f.key} className={f.center || f.key === codeKey ? 'center' : ''}
                      style={{ width: f.colWidth, minWidth: f.colMin }}>{f.thLabel || f.label}</th>
                ))}
                {enableField && <th className="center" style={{ width: 140 }}>สถานะใช้งาน</th>}
                <th className="center" style={{ width: cfg.canDelete ? 96 : 72 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={colSpan} className="center muted" style={{ padding: '32px 12px' }}>
                  ยังไม่มีข้อมูล — กดปุ่ม “เพิ่ม{cfg.entity}” เพื่อเริ่มกำหนดค่าคงที่
                </td></tr>
              )}
              {sorted.map(r => (
                <tr key={r.id} className={"ac-row" + (enableField && !r.enabled ? ' is-off' : '')}>
                  {dataCols.map(f => (
                    <td key={f.key} className={f.center || f.key === codeKey ? 'center' : ''}>{renderCell(f, r)}</td>
                  ))}
                  {enableField && (
                    <td className="center">
                      <button className={"ac-switch" + (r.enabled ? ' on' : '')} onClick={() => toggleEnabled(r)}
                              title={r.enabled ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'} aria-pressed={r.enabled}>
                        <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                        <span className="ac-switch-label">{r.enabled ? 'ใช้งาน' : 'ปิดใช้งาน'}</span>
                      </button>
                    </td>
                  )}
                  <td className="bud-act-cell">
                    <div className="bud-acts" style={{ justifyContent: 'center', opacity: 1 }}>
                      <button className="bud-act" title="แก้ไข" onClick={() => setModal({ mode: 'edit', rec: r })}>
                        <Icon name="edit" size={13} />
                      </button>
                      {cfg.canDelete && (
                        <button className="bud-act danger" title="ลบ" onClick={() => setModal({ mode: 'del', rec: r })}>
                          <Icon name="trash" size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> {cfg.footHint}
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>

      {modal && (modal.mode === 'add' || modal.mode === 'edit') && (
        <AgentCrudModal mode={modal.mode} cfg={cfg}
                        draft0={modal.mode === 'edit' ? modal.rec : null}
                        existing={list} onClose={() => setModal(null)} onSubmit={submit} />
      )}
      {modal && modal.mode === 'del' && (
        <AgentDeleteModal cfg={cfg} rec={modal.rec} onClose={() => setModal(null)} onConfirm={doDelete} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าค่าคงที่ 4 เมนู (ผูก cfg เข้ากับ AgentCrudPage)
// ════════════════════════════════════════════════════════════════════
function AgentReceiptTypeConfigPage({ onToast }) {
  const cfg = {
    title: 'ประเภทใบเสร็จ', entity: 'ประเภทใบเสร็จ', uidPrefix: 'RT',
    subtitle: 'กำหนดประเภทใบเสร็จของระบบลูกหนี้ตัวแทน — รหัส รายละเอียด สถานะเข้าระบบ (รับเข้า +/จ่ายออก −) รหัสพิมพ์ และประเภทรายงาน เพิ่ม/ลบรายการได้',
    modalHint: 'สถานะเข้าระบบกำหนดทิศทางเงิน + รับเข้า / − จ่ายออก',
    toolbarHint: 'กดไอคอนดินสอเพื่อแก้ไข · ถังขยะเพื่อลบ · “สถานะเข้าระบบ” ระบุทิศทางเงิน (+ รับเข้า / − จ่ายออก)',
    footHint: 'ประเภทใบเสร็จนี้ใช้ร่วมกับการรับ–จ่ายเงินและการออกใบเสร็จของระบบลูกหนี้ตัวแทน',
    canDelete: true, minWidth: 880,
    load: window.agentReceiptTypeLoad, save: window.agentReceiptTypeSave, seed: window.agentReceiptTypeSeed,
    fields: [
      { key: 'code', label: 'รหัสประเภทใบเสร็จ', type: 'code', mono: true, numeric: true, maxLength: 3, half: true, required: true, colWidth: 130, placeholder: 'เช่น 01' },
      { key: 'sign', label: 'สถานะเข้าระบบ', type: 'sign', half: true, colWidth: 130, center: true },
      { key: 'desc', label: 'รายละเอียดใบเสร็จ', type: 'text', required: true, autoFocus: true, colMin: 220, placeholder: 'เช่น ชำระหนี้เงินกู้' },
      { key: 'printCode', label: 'รหัสพิมพ์', type: 'code', mono: true, half: true, colWidth: 110, center: true, placeholder: 'เช่น R01' },
      { key: 'report', label: 'ประเภทรายงาน', type: 'select', half: true, colMin: 180, options: window.AGENT_RECEIPT_REPORTS, def: window.AGENT_RECEIPT_REPORTS[0] },
    ],
  };
  return <AgentCrudPage cfg={cfg} onToast={onToast} />;
}

function AgentAffiliationConfigPage({ onToast }) {
  const cfg = {
    title: 'สังกัดตัวแทน', entity: 'สังกัดตัวแทน', uidPrefix: 'AA', descKey: 'name',
    subtitle: 'กำหนดสังกัดของตัวแทนในระบบลูกหนี้ตัวแทน — ระบุรหัสสังกัดและชื่อสังกัด สามารถเพิ่มสังกัดใหม่หรือปิดการใช้งานสังกัดที่ไม่ใช้แล้วได้',
    modalHint: 'รหัสสังกัดใช้อ้างอิงตัวแทนในทุกเมนูของระบบลูกหนี้ตัวแทน',
    toolbarHint: 'คลิกสวิตช์คอลัมน์ “สถานะใช้งาน” เพื่อเปิด/ปิดการใช้งานสังกัดได้ทันที · กดดินสอเพื่อแก้ไข',
    footHint: 'สังกัดที่ปิดใช้งานจะไม่ปรากฏให้เลือกในเมนูบันทึกลูกหนี้ตัวแทน แต่ข้อมูลเดิมที่อ้างอิงไว้ยังคงอยู่',
    minWidth: 640,
    load: window.agentAffilLoad, save: window.agentAffilSave, seed: window.agentAffilSeed,
    fields: [
      { key: 'code', label: 'รหัสสังกัด', type: 'code', mono: true, numeric: true, maxLength: 3, half: true, required: true, colWidth: 120, placeholder: 'เช่น 01' },
      { key: 'enabled', label: 'สถานะใช้งาน', type: 'toggle', half: true, def: true },
      { key: 'name', label: 'ชื่อสังกัด', type: 'text', required: true, autoFocus: true, colMin: 260, placeholder: 'เช่น ตัวแทนภาคกลาง' },
    ],
  };
  return <AgentCrudPage cfg={cfg} onToast={onToast} />;
}

function AgentCancelReasonConfigPage({ onToast }) {
  const cfg = {
    title: 'สาเหตุการยกเลิก', entity: 'สาเหตุการยกเลิก', uidPrefix: 'CR',
    subtitle: 'ระบุสาเหตุการยกเลิกรายการในระบบลูกหนี้ตัวแทน — เพิ่มรหัสสาเหตุและรายละเอียดสาเหตุการยกเลิก เพื่อใช้เลือกตอนยกเลิกรายการรับ–จ่ายเงิน',
    toolbarHint: 'กดไอคอนดินสอเพื่อแก้ไข · ถังขยะเพื่อลบ',
    footHint: 'รายการนี้ใช้เป็นตัวเลือก “สาเหตุการยกเลิก” เมื่อยกเลิกรายการในระบบลูกหนี้ตัวแทน',
    canDelete: true, minWidth: 620,
    load: window.agentCancelReasonLoad, save: window.agentCancelReasonSave, seed: window.agentCancelReasonSeed,
    fields: [
      { key: 'code', label: 'รหัสสาเหตุ', type: 'code', mono: true, numeric: true, maxLength: 3, half: true, required: true, colWidth: 120, placeholder: 'เช่น 01' },
      { key: 'desc', label: 'รายละเอียดสาเหตุการยกเลิก', type: 'text', required: true, autoFocus: true, colMin: 320, placeholder: 'เช่น บันทึกข้อมูลผิดพลาด' },
    ],
  };
  return <AgentCrudPage cfg={cfg} onToast={onToast} />;
}

function AgentPaymentTypeConfigPage({ onToast }) {
  const cfg = {
    title: 'ประเภทการชำระ', entity: 'ประเภทการชำระ', uidPrefix: 'PT',
    subtitle: 'ระบุประเภทการชำระเงินในระบบลูกหนี้ตัวแทน — เพิ่มรหัสการชำระและรายละเอียดการชำระ เพิ่ม ลบ และแก้ไขได้',
    toolbarHint: 'กดไอคอนดินสอเพื่อแก้ไข · ถังขยะเพื่อลบ',
    footHint: 'ประเภทการชำระนี้ใช้เป็นตัวเลือกเมื่อบันทึกการรับชำระเงินจากตัวแทน',
    canDelete: true, minWidth: 620,
    load: window.agentPaymentTypeLoad, save: window.agentPaymentTypeSave, seed: window.agentPaymentTypeSeed,
    fields: [
      { key: 'code', label: 'รหัสการชำระ', type: 'code', mono: true, numeric: true, maxLength: 3, half: true, required: true, colWidth: 120, placeholder: 'เช่น 01' },
      { key: 'desc', label: 'รายละเอียดการชำระ', type: 'text', required: true, autoFocus: true, colMin: 320, placeholder: 'เช่น โอนผ่านธนาคาร' },
    ],
  };
  return <AgentCrudPage cfg={cfg} onToast={onToast} />;
}

// ════════════════════════════════════════════════════════════════════
//  เปิด-ปิดวัน (Day / Month / Year status per system) — grid แก้ไขในที่
// ════════════════════════════════════════════════════════════════════
function AgentDayStatusToggle({ value, onToggle, kind }) {
  const on = value === 'open';
  return (
    <button className={"ac-switch" + (on ? ' on' : '')} onClick={onToggle}
            title={on ? `คลิกเพื่อปิด${kind}` : `คลิกเพื่อเปิด${kind}`} aria-pressed={on}>
      <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
      <span className="ac-switch-label">{on ? 'เปิด' : 'ปิด'}</span>
    </button>
  );
}

function AgentDayConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.agentDayLoad);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const setRow = (id, k, v) => { setDirty(true); setList(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r)); };
  const toggle = (id, k, kind) => setRow(id, k, (list.find(r => r.id === id)[k] === 'open') ? 'closed' : 'open');

  const save = () => {
    window.agentDaySave(list);
    setDirty(false); setSavedAt(new Date());
    audit.log({ action: 'update', module: 'ลูกหนี้ตัวแทน — ค่าคงที่เปิด-ปิดวัน', target: 'สถานะเปิด-ปิดวันรายระบบ',
      summary: `บันทึกสถานะเปิด-ปิดวัน ${list.length} ระบบ`,
      changes: list.map(r => ({ field: `${r.sysCode} · ${r.sysName}`, before: '—', after: `วัน:${r.day==='open'?'เปิด':'ปิด'} เดือน:${r.month==='open'?'เปิด':'ปิด'} ปี:${r.year==='open'?'เปิด':'ปิด'}` })) });
    onToast && onToast('บันทึกสถานะเปิด-ปิดวันเรียบร้อยแล้ว');
  };
  const resetSeed = () => { setList(window.agentDaySeed()); setDirty(true); onToast && onToast('คืนค่าเปิด-ปิดวันตั้งต้นแล้ว'); };

  return (
    <div data-screen-label="หน้าค่าคงที่เปิด-ปิดวัน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เปิด-ปิดวัน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            กำหนดสถานะการทำงานรายระบบ — เลือกระบบที่ต้องการเปิด-ปิดวัน กำหนดวันที่ทำการ และสถานะการเปิด-ปิด ระดับวัน เดือน และปี
          </div>
        </div>
        <span className="spacer" />
        {savedAt && !dirty && (
          <span className="chip success"><Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}</span>
        )}
        <button className="btn primary sm" onClick={save} disabled={!dirty}><Icon name="check" /> บันทึกข้อมูล</button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="bud-toolbar">
          <div className="muted" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="info" size={12} /> คลิกสวิตช์ “สถานะวัน / เดือน / ปี” เพื่อสลับ เปิด/ปิด · แก้ไข “วันที่ทำการ” ได้โดยตรง · “วันที่ทำการล่าสุด” ระบบบันทึกอัตโนมัติ
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl ac-tbl" style={{ minWidth: 940 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 70 }}>ระบบ</th>
                <th style={{ minWidth: 220 }}>ชื่อระบบ</th>
                <th className="center" style={{ width: 160 }}>วันที่ทำการ</th>
                <th className="center" style={{ width: 140 }}>วันที่ทำการล่าสุด</th>
                <th className="center" style={{ width: 108 }}>สถานะวัน</th>
                <th className="center" style={{ width: 108 }}>สถานะเดือน</th>
                <th className="center" style={{ width: 108 }}>สถานะปี</th>
              </tr>
            </thead>
            <tbody>
              {list.map(r => (
                <tr key={r.id} className="ac-row">
                  <td className="center"><span className="ac-code-badge mono" style={{ width: 'auto', minWidth: 40, padding: '0 9px', fontSize: 13, borderRadius: 6 }}>{r.sysCode}</span></td>
                  <td>{r.sysName}</td>
                  <td className="center">
                    <ErpDate value={r.workDate} onChange={(v) => ((e) => setRow(r.id, 'workDate', e.target.value))({ target: { value: v } })} style={{ maxWidth: 148, textAlign: 'left' }} className="sh-grid-input" />
                  </td>
                  <td className="center mono muted" style={{ fontSize: 12 }}>{fmt.date(r.lastWorkDate)}</td>
                  <td className="center"><AgentDayStatusToggle value={r.day} kind="วัน" onToggle={() => toggle(r.id, 'day')} /></td>
                  <td className="center"><AgentDayStatusToggle value={r.month} kind="เดือน" onToggle={() => toggle(r.id, 'month')} /></td>
                  <td className="center"><AgentDayStatusToggle value={r.year} kind="ปี" onToggle={() => toggle(r.id, 'year')} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> การปิดวัน/เดือน/ปี จะป้องกันการบันทึกรายการย้อนหลังในระบบนั้น — อย่าลืมกด “บันทึกข้อมูล”
        <span className="spacer" />
        <button className="btn ghost sm" onClick={resetSeed}>คืนค่าตั้งต้น</button>
      </div>
    </div>
  );
}

Object.assign(window, {
  AgentCrudPage, AgentReceiptTypeConfigPage, AgentAffiliationConfigPage,
  AgentCancelReasonConfigPage, AgentPaymentTypeConfigPage, AgentDayConfigPage,
});
