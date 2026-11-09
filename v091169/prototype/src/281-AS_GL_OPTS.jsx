// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — ค่าคงที่ : ตั้งค่าระบบบัญชี (Accounting System Settings)
//  หน้ารวมศูนย์สำหรับกำหนดข้อมูลพื้นฐานที่จำเป็นต่อระบบบัญชีทั้งหมด
//   Tab 1 ตั้งค่าข้อมูลองค์กร   — ข้อมูลสหกรณ์ + รอบปีบัญชี + ผู้มีอำนาจลงนาม
//   Tab 2 ตั้งค่างวดบัญชี       — ปีบัญชี / งวดรายเดือน / เปิด-ปิด-ล็อกงวด
//   Tab 3 ตั้งค่าภาษี           — WHT / VAT / ผังบัญชีภาษี
//   Tab 4 ตั้งค่าเลขที่เอกสาร   — รูปแบบเลขที่เอกสารแต่ละประเภท
// ════════════════════════════════════════════════════════════════════
const { useState: asUseState, useMemo: asUseMemo, useRef: asUseRef } = React;

// ─── ตัวเลือกผังบัญชีสำหรับผูกภาษี ───────────────────────────────────
const AS_GL_OPTS = [
  { v: '', l: '— เลือกบัญชี —' },
  { v: '110410', l: '110410 · ภาษีซื้อ (VAT ซื้อ)' },
  { v: '210310', l: '210310 · ภาษีขาย (VAT ขาย)' },
  { v: '210301', l: '210301 · ภาษีหัก ณ ที่จ่ายค้างจ่าย' },
  { v: '210305', l: '210305 · ภาษีมูลค่าเพิ่มค้างจ่าย' },
  { v: '110101', l: '110101 · เงินสด' },
];
const AS_GL_LABEL = (v) => (AS_GL_OPTS.find(o => o.v === v) || {}).l || v || '—';

// ─── ค่าตั้งต้น ──────────────────────────────────────────────────────
const AS_ORG_EXTRA_DEFAULTS = {
  fiscalType: 'calendar',                // calendar = 1 ม.ค.–31 ธ.ค.
  periodStart: '2026-01-01',
  periodEnd: '2026-12-31',
  signatories: [
    { id: 's1', name: 'นายประสงค์ ธีรกุล', position: 'ประธานกรรมการ', order: 1 },
    { id: 's2', name: 'นางสาวสุนิสา ทองแท้', position: 'ผู้จัดการสหกรณ์', order: 2 },
    { id: 's3', name: 'นางจันทร์เพ็ญ มาลี', position: 'ผู้จัดการฝ่ายบัญชี', order: 3 },
  ],
};

const AS_PERIOD_DEFAULTS = () => ({
  fiscalYear: 2569,
  requirePendingCheck: true,
  openRoles: ['ผู้จัดการฝ่ายบัญชี', 'ผู้จัดการสหกรณ์'],
  closeRoles: ['ผู้จัดการฝ่ายบัญชี'],
  // 12 งวดรายเดือน — open | closed | locked
  months: Array.from({ length: 12 }).map((_, i) => ({
    m: i + 1,
    status: i < 7 ? 'locked' : i < 8 ? 'closed' : i < 9 ? 'open' : 'pending',
    pending: i === 9 ? 4 : i === 10 ? 0 : 0,
  })),
});

const AS_TAX_DEFAULTS = () => ({
  vatEnabled: false,
  vatRate: 7,
  vatInputAcct: '110410',
  vatOutputAcct: '210310',
  whtAcct: '210301',
  whtTypes: [
    { id: 't1', code: 'WHT-3', name: 'ค่าจ้าง / ค่าบริการ', rate: 3, enabled: true },
    { id: 't2', code: 'WHT-5', name: 'ค่าเช่าอสังหาริมทรัพย์', rate: 5, enabled: true },
    { id: 't3', code: 'WHT-1', name: 'ดอกเบี้ยเงินฝาก', rate: 1, enabled: true },
    { id: 't4', code: 'WHT-2', name: 'เงินปันผล', rate: 10, enabled: false },
  ],
});

const AS_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('as-trash-style')) {
  const st = document.createElement('style');
  st.id = 'as-trash-style';
  st.textContent = '[data-screen-label="หน้าตั้งค่าระบบบัญชี"] .bud-act.danger:hover { border-color: var(--border) !important; }'
    + '[data-screen-label="หน้าตั้งค่าระบบบัญชี"] .section-head > .head-bar, [data-screen-label="หน้า Map คู่บัญชี"] .section-head > .head-bar, [data-screen-label="หน้าสูตรกระดาษทำการงบกระแสเงินสด"] .section-head > .head-bar, [data-screen-label="หน้าตั้งค่างวดบัญชี"] .section-head > .head-bar, [data-screen-label="หน้าเชื่อมโยงระบบย่อย"] .section-head > .head-bar, [data-screen-label="หน้านำเข้าส่งออกข้อมูล"] .section-head > .head-bar { display: none !important; }';
  document.head.appendChild(st);
}

const AS_DOCNUM_DEFAULTS = () => ([
  { id: 'rv',  name: 'ใบสำคัญรับ',                 prefix: 'RV',  pattern: 'RV-{YY}{MM}-{####}', digits: 4, reset: 'month', current: 128 },
  { id: 'pv',  name: 'ใบสำคัญจ่าย',                prefix: 'PV',  pattern: 'PV-{YY}{MM}-{####}', digits: 4, reset: 'month', current: 342 },
  { id: 'jv',  name: 'ใบสำคัญทั่วไป',              prefix: 'JV',  pattern: 'JV-{YY}{MM}-{####}', digits: 4, reset: 'month', current: 76 },
  { id: 're',  name: 'ใบเสร็จรับเงิน',             prefix: 'RE',  pattern: 'RE-{YYYY}-{#####}',  digits: 5, reset: 'year',  current: 10245 },
  { id: 'inv', name: 'ใบแจ้งหนี้',                 prefix: 'INV', pattern: 'INV-{YY}{MM}-{####}',digits: 4, reset: 'month', current: 53 },
  { id: 'tax', name: 'ใบกำกับภาษี',               prefix: 'TX',  pattern: 'TX-{YYYY}-{#####}',  digits: 5, reset: 'year',  current: 880 },
  { id: 'adj', name: 'เอกสารปรับปรุงบัญชี',       prefix: 'ADJ', pattern: 'ADJ-{YY}{MM}-{###}', digits: 3, reset: 'month', current: 12 },
  { id: 'trf', name: 'เอกสารโอนเงินระหว่างบัญชี', prefix: 'TF',  pattern: 'TF-{YY}{MM}-{###}',  digits: 3, reset: 'month', current: 27 },
]);

// localStorage helpers
const asLoad = (key, def) => {
  try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch (e) {}
  return typeof def === 'function' ? def() : def;
};
const asSave = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} };

if (!document.getElementById('as-period-style')) {
  const st = document.createElement('style');
  st.id = 'as-period-style';
  st.textContent = '.as-stat-card { flex-direction: column; align-items: flex-start; gap: 8px; background: var(--surface-card, #fff); border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; min-width: 132px; }'
    + '.as-stat-card .as-stat-lab { font-size: 12.5px; font-weight: 600; color: var(--text); }'
    + '.as-stat-card .as-stat-val { display: flex; align-items: baseline; gap: 5px; }'
    + '.as-stat-card .as-stat-num { font-size: 22px; font-weight: 700; line-height: 1; margin: 0; }'
    + '.as-stat-card .as-stat-unit { font-size: 11.5px; color: var(--text-muted); }'
    + '.as-stat-card.is-active { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.as-stat-card.is-active .as-stat-lab, .as-stat-card.is-active .as-stat-num { color: #237450; }';
  document.head.appendChild(st);
}

const AS_MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const AS_PERIOD_TONE = { locked: 'neutral', closed: 'info', open: 'ok', pending: 'warn' };
const AS_PERIOD_LABEL = { locked: 'ล็อกแล้ว', closed: 'ปิดงวด', open: 'เปิดอยู่', pending: 'ยังไม่เปิด' };

// ─── ฟิลด์ฟอร์มแบบ label/value (ใช้เฉพาะหน้านี้) ──────────────────────
function AsField({ label, required, children, hint, full }) {
  return (
    <div className="as-field" style={full ? { gridColumn: '1 / -1' } : null}>
      <label className="cfg-label">{label}{required && <span className="cfg-required">*</span>}</label>
      <div className="cfg-input-wrap">
        {children}
        {hint && <div className="cfg-hint">{hint}</div>}
      </div>
    </div>
  );
}

function AsSectionHead({ title, sub }) {
  return (
    <div className="section-head">
      <span className="head-bar" />
      <h3>{title}</h3>
      {sub && <span className="muted" style={{ fontSize: 11 }}>{sub}</span>}
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   หน้าหลัก — แท็บ 4 รายการ                                       │
// ╰─────────────────────────────────────────────────────────────────╯
function AccountingSettingsPage({ onToast }) {
  const [tab, setTab] = asUseState('org');
  const tabs = [
    ['org',    'ตั้งค่าข้อมูลองค์กร'],
    ['docnum', 'ตั้งค่าเลขที่เอกสาร'],
  ];
  return (
    <div data-screen-label="หน้าตั้งค่าระบบบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตั้งค่าระบบบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            กำหนดข้อมูลพื้นฐานที่จำเป็นต่อการทำงานของระบบบัญชีทั้งหมด — ข้อมูลองค์กร งวดบัญชี ภาษี และรูปแบบเลขที่เอกสาร
            ค่าที่กำหนดในหน้านี้จะถูกเรียกใช้ร่วมกันทุกเมนูในระบบบัญชี
          </div>
        </div>
      </div>

      <div className="tabs-container" style={{ marginTop: 4 }}>
        <div className="tabs-bar" style={{ flexWrap: 'wrap' }}>
          {tabs.map(([k, l]) => (
            <button key={k} className={"tab" + (tab === k ? ' active' : '')} onClick={() => setTab(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        {tab === 'org'    && <AsOrgTab onToast={onToast} />}
        {tab === 'docnum' && <AsDocNumTab onToast={onToast} />}
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   Tab 1 — ตั้งค่าข้อมูลองค์กร                                    │
// ╰─────────────────────────────────────────────────────────────────╯
function AsOrgTab({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const load = () => {
    const base = asLoad('coop_info', () => ({ ...window.COOP_INFO_DEFAULTS }));
    return { ...window.COOP_INFO_DEFAULTS, ...AS_ORG_EXTRA_DEFAULTS, ...base };
  };
  const [form, setForm] = asUseState(load);
  const [editing, setEditing] = asUseState(false);
  const [draft, setDraft] = asUseState(form);
  const [errors, setErrors] = asUseState({});

  const startEdit = () => { setDraft(form); setErrors({}); setEditing(true); };
  const cancelEdit = () => { setErrors({}); setEditing(false); };
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const digits = (v, n) => (v || '').replace(/\D/g, '').slice(0, n);

  const validate = (d) => {
    const e = {};
    if (!d.name?.trim()) e.name = 'กรุณาระบุชื่อสหกรณ์';
    if (!/^\d{13}$/.test(d.taxId || '')) e.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    if (!d.address?.trim()) e.address = 'กรุณาระบุที่อยู่';
    return e;
  };

  const save = () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length) { onToast && onToast('กรุณาตรวจสอบข้อมูลที่ยังไม่ถูกต้อง'); return; }
    setForm(draft);
    asSave('coop_info', draft);
    setEditing(false);
    audit.log && audit.log({ action: 'update', module: 'บัญชี — ตั้งค่าระบบบัญชี', target: 'ข้อมูลองค์กร', summary: 'แก้ไขข้อมูลองค์กรของสหกรณ์' });
    onToast && onToast('บันทึกข้อมูลองค์กรเรียบร้อยแล้ว');
  };

  const v = editing ? draft : form;
  const sigs = [...(v.signatories || [])].sort((a, b) => a.order - b.order);
  const addSig = () => set('signatories', [...(draft.signatories || []), { id: 's' + Date.now(), name: '', position: '', order: (draft.signatories || []).length + 1 }]);
  const setSig = (id, k, val) => set('signatories', (draft.signatories || []).map(s => s.id === id ? { ...s, [k]: val } : s));
  const delSig = (id) => set('signatories', (draft.signatories || []).filter(s => s.id !== id));

  return (
    <div>
      <div className="as-tab-head">
        <div className="muted as-tab-desc">
          ย้ายมาจาก “ค่าคงที่ข้อมูลสหกรณ์” เดิม — ข้อมูลในแท็บนี้ใช้พิมพ์หัวเอกสาร ใบเสร็จ ใบกำกับภาษี และรายงานทางบัญชี
        </div>
        <span className="spacer" />
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูล</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึกข้อมูล</button>
          </>
        )}
      </div>

      <div className="search-card" style={{ padding: 22 }}>
        <div className="section">
          <AsSectionHead title="ข้อมูลทั่วไปของสหกรณ์" />
          <div className="as-grid2">
            <AsField label="ชื่อสหกรณ์" required full error={errors.name}>
              {editing
                ? <input className={"cfg-input" + (errors.name ? ' has-error' : '')} value={v.name || ''} onChange={e => set('name', e.target.value)} placeholder="ชื่อเต็มของสหกรณ์" />
                : <div className="cfg-display">{v.name || <span className="muted">—</span>}</div>}
              {errors.name && <div className="cfg-error"><Icon name="info" size={11} /> {errors.name}</div>}
            </AsField>
            <AsField label="เลขทะเบียนสหกรณ์">
              {editing
                ? <input className="cfg-input mono" value={v.registrationNo || ''} onChange={e => set('registrationNo', e.target.value)} placeholder="กพ.0123/2520" />
                : <div className="cfg-display mono">{v.registrationNo || <span className="muted">—</span>}</div>}
            </AsField>
            <AsField label="เลขประจำตัวผู้เสียภาษี" required>
              {editing
                ? <input className={"cfg-input mono" + (errors.taxId ? ' has-error' : '')} value={v.taxId || ''} inputMode="numeric" onChange={e => set('taxId', digits(e.target.value, 13))} placeholder="ตัวเลข 13 หลัก" />
                : <div className="cfg-display mono">{v.taxId || <span className="muted">—</span>}</div>}
              {errors.taxId && <div className="cfg-error"><Icon name="info" size={11} /> {errors.taxId}</div>}
            </AsField>
            <AsField label="ที่อยู่" required full>
              {editing
                ? <textarea className={"cfg-input" + (errors.address ? ' has-error' : '')} rows={2} value={v.address || ''} onChange={e => set('address', e.target.value)} placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" />
                : <div className="cfg-display">{v.address || <span className="muted">—</span>}</div>}
              {errors.address && <div className="cfg-error"><Icon name="info" size={11} /> {errors.address}</div>}
            </AsField>
          </div>
        </div>

        <div className="section" style={{ marginTop: 18 }}>
          <AsSectionHead title="รอบปีบัญชี" sub="ใช้เป็นค่าตั้งต้นของงวดบัญชีและรายงานทางการเงิน" />
          <div className="as-grid2">
            <AsField label="รอบปีบัญชี">
              {editing ? (
                <select className="cfg-input" value={v.fiscalType} onChange={e => set('fiscalType', e.target.value)}>
                  <option value="calendar">ปีปฏิทิน (1 ม.ค. – 31 ธ.ค.)</option>
                  <option value="fiscal-oct">ปีงบประมาณ (1 ต.ค. – 30 ก.ย.)</option>
                  <option value="custom">กำหนดเอง</option>
                </select>
              ) : (
                <div className="cfg-display">{v.fiscalType === 'fiscal-oct' ? 'ปีงบประมาณ (1 ต.ค. – 30 ก.ย.)' : v.fiscalType === 'custom' ? 'กำหนดเอง' : 'ปีปฏิทิน (1 ม.ค. – 31 ธ.ค.)'}</div>
              )}
            </AsField>
            <AsField label="รูปแบบเลขที่เอกสาร" full>
              <div className="as-inline-note">
                <Icon name="info" size={12} /> กำหนดรายละเอียดได้ที่แท็บ <strong>“ตั้งค่าเลขที่เอกสาร”</strong> — เช่น <span className="mono">RV-{`{YY}{MM}`}-{`{####}`}</span>, <span className="mono">PV-{`{YY}{MM}`}-{`{####}`}</span>
              </div>
            </AsField>
          </div>
        </div>

        <div className="section" style={{ marginTop: 18 }}>
          <AsSectionHead title="ผู้มีอำนาจลงนาม" sub="พิมพ์ในช่องลงนามของเอกสารและรายงาน" />
          <div className="table-wrap" style={{ marginTop: 6 }}>
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 60 }}>ลำดับ</th>
                  <th style={{ minWidth: 240 }}>ชื่อ–สกุล</th>
                  <th style={{ minWidth: 200 }}>ตำแหน่ง</th>
                  {editing && <th className="center" style={{ width: 70 }}>จัดการ</th>}
                </tr>
              </thead>
              <tbody>
                {sigs.length === 0 && (
                  <tr><td colSpan={editing ? 4 : 3} className="center muted" style={{ padding: '20px 12px' }}>ยังไม่ได้กำหนดผู้มีอำนาจลงนาม</td></tr>
                )}
                {sigs.map((s, i) => (
                  <tr key={s.id}>
                    <td className="center mono">{i + 1}</td>
                    <td>{editing ? <input className="cfg-input" value={s.name} onChange={e => setSig(s.id, 'name', e.target.value)} placeholder="ชื่อ–สกุล" /> : (s.name || <span className="muted">—</span>)}</td>
                    <td>{editing ? <input className="cfg-input" value={s.position} onChange={e => setSig(s.id, 'position', e.target.value)} placeholder="ตำแหน่ง" /> : (s.position || <span className="muted">—</span>)}</td>
                    {editing && <td className="center"><button className="bud-act danger" title="ลบ" onClick={() => delSig(s.id)} dangerouslySetInnerHTML={{ __html: AS_TRASH }} /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editing && <button className="btn dashed sm" style={{ marginTop: 10 }} onClick={addSig}><Icon name="plus" /> เพิ่มผู้มีอำนาจลงนาม</button>}
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   Tab 2 — ตั้งค่างวดบัญชี                                        │
// ╰─────────────────────────────────────────────────────────────────╯
function AsPeriodTab({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [cfg, setCfg] = asUseState(() => asLoad('acct_periods', AS_PERIOD_DEFAULTS));
  const [permOpen, setPermOpen] = asUseState(false);
  const persist = (next) => { setCfg(next); asSave('acct_periods', next); };

  const setMonth = (m, status) => {
    persist({ ...cfg, months: cfg.months.map(x => x.m === m ? { ...x, status } : x) });
  };
  const handleAction = (mo) => {
    if (mo.status === 'pending') { setMonth(mo.m, 'open'); onToast && onToast(`เปิดงวด ${AS_MONTH_TH[mo.m - 1]} แล้ว`); return; }
    if (mo.status === 'open') {
      if (cfg.requirePendingCheck && mo.pending > 0) { onToast && onToast(`ปิดงวดไม่ได้ — มีรายการค้าง ${mo.pending} รายการ ต้องเคลียร์ก่อน`); return; }
      setMonth(mo.m, 'closed');
      audit.log && audit.log({ action: 'update', module: 'บัญชี — งวดบัญชี', target: `งวด ${AS_MONTH_TH[mo.m - 1]} ${cfg.fiscalYear}`, summary: `ปิดงวดบัญชี ${AS_MONTH_TH[mo.m - 1]}` });
      onToast && onToast(`ปิดงวด ${AS_MONTH_TH[mo.m - 1]} แล้ว`);
      return;
    }
    if (mo.status === 'closed') {
      setMonth(mo.m, 'locked');
      audit.log && audit.log({ action: 'update', module: 'บัญชี — งวดบัญชี', target: `งวด ${AS_MONTH_TH[mo.m - 1]} ${cfg.fiscalYear}`, summary: `ล็อกงวดบัญชี ${AS_MONTH_TH[mo.m - 1]}` });
      onToast && onToast(`ล็อกงวด ${AS_MONTH_TH[mo.m - 1]} แล้ว — แก้ไขรายการไม่ได้`);
      return;
    }
    if (mo.status === 'locked') { setMonth(mo.m, 'closed'); onToast && onToast(`ปลดล็อกงวด ${AS_MONTH_TH[mo.m - 1]} แล้ว`); }
  };
  const actionLabel = (s) => s === 'pending' ? 'เปิดงวด' : s === 'open' ? 'ปิดงวด' : s === 'closed' ? 'ล็อกงวด' : 'ปลดล็อก';

  const counts = asUseMemo(() => {
    const c = { open: 0, closed: 0, locked: 0, pending: 0 };
    cfg.months.forEach(m => c[m.status]++);
    return c;
  }, [cfg.months]);

  return (
    <div>
      <div className="as-tab-head">
        <div className="muted as-tab-desc">กำหนดปีบัญชี เปิด–ปิด–ล็อกงวดบัญชีรายเดือน และสิทธิ์ผู้ดำเนินการ</div>
        <span className="spacer" />
        <div className="year-switcher" style={{ marginLeft: 'auto' }}>
          <button className="btn ghost sm" onClick={() => persist({ ...cfg, fiscalYear: cfg.fiscalYear - 1 })}><Icon name="chevLeft" /></button>
          <div className="yr-display"><div className="yr-be">พ.ศ. {cfg.fiscalYear}</div></div>
          <button className="btn ghost sm" onClick={() => persist({ ...cfg, fiscalYear: cfg.fiscalYear + 1 })}><Icon name="chevRight" /></button>
        </div>
      </div>

      {/* สรุปสถานะ */}
      <div className="as-stat-row">
        {[['open', 'เปิดอยู่', 'ok'], ['closed', 'ปิดงวด', 'info'], ['locked', 'ล็อกแล้ว', 'neutral'], ['pending', 'ยังไม่เปิด', 'warn']].map(([k, l, tone]) => (
          <div key={k} className={"as-stat as-stat-card" + (k === 'open' ? ' is-active' : '')}>
            <span className="as-stat-lab">{l}</span>
            <span className="as-stat-val"><b className="as-stat-num">{counts[k]}</b><span className="as-stat-unit">งวด</span></span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <span className="head-bar" /><h3>งวดบัญชีรายเดือน</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {cfg.months.length} งวด</span>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
          <Icon name="info" size={12} /> ขั้นตอนงวด: <strong>ยังไม่เปิด → เปิดงวด → ปิดงวด → ล็อก</strong> · งวดที่ล็อกแล้วจะแก้ไขรายการไม่ได้จนกว่าจะปลดล็อก
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl" style={{ minWidth: 620 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 70 }}>งวดที่</th>
                <th style={{ minWidth: 160 }}>เดือน</th>
                <th className="center" style={{ width: 130 }}>สถานะ</th>
                <th className="center" style={{ width: 220 }}>การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {cfg.months.map(mo => (
                <tr key={mo.m}>
                  <td className="center mono">{String(mo.m).padStart(2, '0')}</td>
                  <td>{AS_MONTH_TH[mo.m - 1]} {cfg.fiscalYear}</td>
                  <td className="center"><span className={"pill " + AS_PERIOD_TONE[mo.status]}>{AS_PERIOD_LABEL[mo.status]}</span></td>
                  <td className="center">
                    <button className={"btn sm " + (mo.status === 'open' ? 'primary' : mo.status === 'pending' ? 'accent' : '')}
                            onClick={() => handleAction(mo)}>
                      {actionLabel(mo.status)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* สิทธิ์ + ตรวจสอบรายการค้าง */}
      <div className="as-grid2" style={{ marginTop: 14, alignItems: 'start' }}>
        <div className="search-card" style={{ padding: 18 }}>
          <div className="as-perm-head" role="button" tabIndex={0} aria-expanded={permOpen} onClick={() => setPermOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ flex: 1, minWidth: 0 }}><AsSectionHead title="สิทธิ์ผู้เปิด–ปิดงวดบัญชี" /></span>
            <span className="as-perm-chev" style={{ display: 'inline-flex', color: 'var(--text-muted)', transform: permOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s ease' }}><Icon name="chevDown" size={14} /></span>
          </div>
          <div className="as-perm as-perm-body" style={{ display: permOpen ? '' : 'none' }}>
            <div className="as-perm-row">
              <span className="as-perm-lab">ผู้มีสิทธิ์เปิดงวด</span>
              <div className="as-perm-chips">{cfg.openRoles.map(r => <span key={r} className="chip info">{r}</span>)}</div>
            </div>
            <div className="as-perm-row">
              <span className="as-perm-lab">ผู้มีสิทธิ์ปิด / ล็อกงวด</span>
              <div className="as-perm-chips">{cfg.closeRoles.map(r => <span key={r} className="chip primary">{r}</span>)}</div>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 10, display: permOpen ? '' : 'none' }}><Icon name="info" size={11} /> กำหนดบทบาทผู้ใช้งานได้ที่เมนู “ผู้ดูแลระบบ › ผู้ใช้งานและสิทธิ์”</div>
        </div>

        <div className="search-card" style={{ padding: 18 }}>
          <AsSectionHead title="ตรวจสอบรายการค้างก่อนปิดงวด" />
          <label className="as-toggle-row">
            <button className={"ac-switch" + (cfg.requirePendingCheck ? ' on' : '')} onClick={() => persist({ ...cfg, requirePendingCheck: !cfg.requirePendingCheck })} aria-pressed={cfg.requirePendingCheck}>
              <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
            </button>
            <div>
              <div style={{ fontWeight: 600 }}>บังคับเคลียร์รายการค้างก่อนปิดงวด</div>
              <div className="muted" style={{ fontSize: 11.5 }}>หากเปิดใช้งาน ระบบจะไม่อนุญาตให้ปิดงวดที่ยังมีใบสำคัญรอผ่านรายการหรือยังไม่ผ่านการอนุมัติ</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   Tab 3 — ตั้งค่าภาษี                                            │
// ╰─────────────────────────────────────────────────────────────────╯
function AsTaxTab({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [cfg, setCfg] = asUseState(() => asLoad('acct_tax', AS_TAX_DEFAULTS));
  const [editing, setEditing] = asUseState(false);
  const [draft, setDraft] = asUseState(cfg);

  const startEdit = () => { setDraft(cfg); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => {
    setCfg(draft); asSave('acct_tax', draft); setEditing(false);
    audit.log && audit.log({ action: 'update', module: 'บัญชี — ตั้งค่าภาษี', target: 'ภาษี', summary: 'แก้ไขการตั้งค่าภาษีของระบบบัญชี' });
    onToast && onToast('บันทึกการตั้งค่าภาษีเรียบร้อยแล้ว');
  };
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const v = editing ? draft : cfg;

  const addWht = () => set('whtTypes', [...draft.whtTypes, { id: 'w' + Date.now(), code: 'WHT-', name: '', rate: 0, enabled: true }]);
  const setWht = (id, k, val) => set('whtTypes', draft.whtTypes.map(t => t.id === id ? { ...t, [k]: val } : t));
  const delWht = (id) => set('whtTypes', draft.whtTypes.filter(t => t.id !== id));

  return (
    <div>
      <div className="as-tab-head">
        <div className="muted as-tab-desc">กำหนดประเภทและอัตราภาษีหัก ณ ที่จ่าย ภาษีมูลค่าเพิ่ม และผังบัญชีที่เกี่ยวข้อง</div>
        <span className="spacer" />
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขการตั้งค่า</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
          </>
        )}
      </div>

      {/* ภาษีมูลค่าเพิ่ม */}
      <div className="search-card" style={{ padding: 18 }}>
        <AsSectionHead title="ภาษีมูลค่าเพิ่ม (VAT)" sub="ถ้าสหกรณ์จดทะเบียน VAT" />
        <label className="as-toggle-row" style={{ marginBottom: v.vatEnabled ? 14 : 0 }}>
          <button className={"ac-switch" + (v.vatEnabled ? ' on' : '')} disabled={!editing}
                  onClick={() => editing && set('vatEnabled', !v.vatEnabled)} aria-pressed={v.vatEnabled}>
            <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
          </button>
          <div>
            <div style={{ fontWeight: 600 }}>{v.vatEnabled ? 'จดทะเบียนภาษีมูลค่าเพิ่ม' : 'ไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม'}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>สหกรณ์ออมทรัพย์โดยทั่วไปได้รับยกเว้น VAT — เปิดเฉพาะกรณีมีรายได้ที่อยู่ในข่ายต้องเสียภาษี</div>
          </div>
        </label>
        {v.vatEnabled && (
          <div className="as-grid3" style={{ marginTop: 4 }}>
            <AsField label="อัตราภาษี (%)">
              {editing ? <input className="cfg-input mono" inputMode="decimal" value={v.vatRate} onChange={e => set('vatRate', e.target.value.replace(/[^\d.]/g, ''))} /> : <div className="cfg-display mono">{v.vatRate}%</div>}
            </AsField>
            <AsField label="บัญชีภาษีซื้อ">
              {editing
                ? <select className="cfg-input" value={v.vatInputAcct} onChange={e => set('vatInputAcct', e.target.value)}>{AS_GL_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                : <div className="cfg-display mono">{AS_GL_LABEL(v.vatInputAcct)}</div>}
            </AsField>
            <AsField label="บัญชีภาษีขาย">
              {editing
                ? <select className="cfg-input" value={v.vatOutputAcct} onChange={e => set('vatOutputAcct', e.target.value)}>{AS_GL_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                : <div className="cfg-display mono">{AS_GL_LABEL(v.vatOutputAcct)}</div>}
            </AsField>
          </div>
        )}
      </div>

      {/* ภาษีหัก ณ ที่จ่าย */}
      <div className="search-card" style={{ padding: 18, marginTop: 14 }}>
        <AsSectionHead title="ภาษีหัก ณ ที่จ่าย (WHT)" sub="ประเภทและอัตราที่ใช้ในใบสำคัญจ่าย" />
        <div className="as-grid3" style={{ marginBottom: 12 }}>
          <AsField label="บัญชีภาษีหัก ณ ที่จ่ายค้างจ่าย">
            {editing
              ? <select className="cfg-input" value={v.whtAcct} onChange={e => set('whtAcct', e.target.value)}>{AS_GL_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
              : <div className="cfg-display mono">{AS_GL_LABEL(v.whtAcct)}</div>}
          </AsField>
        </div>
        <div className="table-wrap">
          <table className="tbl" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th style={{ width: 100 }}>รหัส</th>
                <th style={{ minWidth: 260 }}>ประเภทภาษี</th>
                <th className="center" style={{ width: 120 }}>อัตรา (%)</th>
                <th className="center" style={{ width: 110 }}>ใช้งาน</th>
                {editing && <th className="center" style={{ width: 70 }}>จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {v.whtTypes.map(t => (
                <tr key={t.id} className={t.enabled ? '' : 'is-off'} style={t.enabled ? null : { opacity: .55 }}>
                  <td>{editing ? <input className="cfg-input mono" value={t.code} onChange={e => setWht(t.id, 'code', e.target.value)} /> : <span className="mono">{t.code}</span>}</td>
                  <td>{editing ? <input className="cfg-input" value={t.name} onChange={e => setWht(t.id, 'name', e.target.value)} placeholder="ประเภทภาษี" /> : t.name}</td>
                  <td className="center">{editing ? <input className="cfg-input mono" style={{ textAlign: 'center' }} inputMode="decimal" value={t.rate} onChange={e => setWht(t.id, 'rate', e.target.value.replace(/[^\d.]/g, ''))} /> : <span className="mono">{t.rate}%</span>}</td>
                  <td className="center">
                    <button className={"ac-switch" + (t.enabled ? ' on' : '')} disabled={!editing} onClick={() => editing && setWht(t.id, 'enabled', !t.enabled)} aria-pressed={t.enabled}>
                      <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                    </button>
                  </td>
                  {editing && <td className="center"><button className="bud-act" onClick={() => delWht(t.id)} title="ลบ"><Icon name="trash" size={13} /></button></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editing && <button className="btn dashed sm" style={{ marginTop: 10 }} onClick={addWht}><Icon name="plus" /> เพิ่มประเภทภาษี</button>}
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   Tab 4 — ตั้งค่าเลขที่เอกสาร                                    │
// ╰─────────────────────────────────────────────────────────────────╯
const AS_RESET_LABEL = { month: 'รายเดือน', year: 'รายปี', never: 'ต่อเนื่อง' };
function asDocPreview(d) {
  const now = new Date();
  const yyyy = String(now.getFullYear() + 543);
  const yy = yyyy.slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const run = String((Number(d.current) || 0) + 1).padStart(Number(d.digits) || 4, '0');
  return (d.pattern || '')
    .replace('{YYYY}', yyyy).replace('{YY}', yy).replace('{MM}', mm)
    .replace(/\{#+\}/, run);
}

function AsDocNumTab({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [rows, setRows] = asUseState(() => asLoad('acct_docnum', AS_DOCNUM_DEFAULTS));
  const [editing, setEditing] = asUseState(false);
  const [draft, setDraft] = asUseState(rows);

  const startEdit = () => { setDraft(rows); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = () => {
    setRows(draft); asSave('acct_docnum', draft); setEditing(false);
    audit.log && audit.log({ action: 'update', module: 'บัญชี — เลขที่เอกสาร', target: 'รูปแบบเลขที่เอกสาร', summary: 'แก้ไขรูปแบบเลขที่เอกสาร' });
    onToast && onToast('บันทึกรูปแบบเลขที่เอกสารเรียบร้อยแล้ว');
  };
  const setRow = (id, k, val) => setDraft(draft.map(r => r.id === id ? { ...r, [k]: val } : r));
  const list = (editing ? draft : rows).filter(r => ['rv', 'pv', 'jv', 'adj'].includes(r.id));

  return (
    <div>
      <div className="as-tab-head">
        <div className="muted as-tab-desc">
          กำหนดคำนำหน้าและรูปแบบเลขที่เอกสารแต่ละประเภท · ตัวแปร <span className="mono">{`{YYYY}`}</span> ปี พ.ศ. · <span className="mono">{`{YY}`}</span> ปี 2 หลัก · <span className="mono">{`{MM}`}</span> เดือน · <span className="mono">{`{####}`}</span> เลขรันนิ่ง
        </div>
        <span className="spacer" />
        {!editing ? (
          <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขรูปแบบ</button>
        ) : (
          <>
            <button className="btn sm" onClick={cancel}>ยกเลิก</button>
            <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
          </>
        )}
      </div>

      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <span className="head-bar" /><h3>รูปแบบเลขที่เอกสาร</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {list.length} ประเภท</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 210 }}>ประเภทเอกสาร</th>
                <th style={{ width: 100 }}>คำนำหน้า</th>
                <th style={{ minWidth: 200 }}>รูปแบบ</th>
                <th className="center" style={{ width: 120 }}>รีเซ็ตเลข</th>
                <th className="center" style={{ width: 110 }}>เลขล่าสุด</th>
                <th style={{ minWidth: 180 }}>ตัวอย่างถัดไป</th>
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>{editing ? <input className="cfg-input mono" style={{ width: 80 }} value={d.prefix} onChange={e => setRow(d.id, 'prefix', e.target.value)} /> : <span className="mono">{d.prefix}</span>}</td>
                  <td>{editing ? <input className="cfg-input mono" value={d.pattern} onChange={e => setRow(d.id, 'pattern', e.target.value)} /> : <span className="mono">{d.pattern}</span>}</td>
                  <td className="center">
                    {editing
                      ? <select className="cfg-input" value={d.reset} onChange={e => setRow(d.id, 'reset', e.target.value)}><option value="month">รายเดือน</option><option value="year">รายปี</option><option value="never">ต่อเนื่อง</option></select>
                      : <span className="chip">{AS_RESET_LABEL[d.reset]}</span>}
                  </td>
                  <td className="center mono">{d.current}</td>
                  <td><span className="pill ok mono">{asDocPreview(d)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lt-list-foot muted" style={{ marginTop: 10 }}>
        <Icon name="info" size={12} /> ระบบจะออกเลขที่เอกสารถัดไปอัตโนมัติเมื่อมีการบันทึกใบสำคัญใหม่ และรีเซ็ตเลขรันนิ่งตามรอบที่กำหนด
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   หน้าแยก — ตั้งค่างวดบัญชี (เมนูค่าคงที่ในระบบบัญชี)             │
// ╰─────────────────────────────────────────────────────────────────╯
function AccountingPeriodPage({ onToast }) {
  return (
    <div data-screen-label="หน้าตั้งค่างวดบัญชี">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตั้งค่างวดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            กำหนดปีบัญชีและงวดบัญชีรายเดือน เปิด–ปิด–ล็อกงวด พร้อมสิทธิ์ผู้ดำเนินการและการตรวจสอบรายการค้างก่อนปิดงวด
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6 }}>
        <AsPeriodTab onToast={onToast} />
      </div>
    </div>
  );
}

Object.assign(window, { AccountingSettingsPage, AccountingPeriodPage });
