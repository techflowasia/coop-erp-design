// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ค่าคงที่ — โครงการประเภทเงินฝาก
//  โครงการ (ทำซ้ำทุกปี) › รอบโครงการรายปี › ช่วงเวลารับสมัคร (หลายช่วง)
//  · กำหนดสิทธิ์จำนวนผู้เข้าร่วมสูงสุดต่อรอบ
//  · เลือกประเภทเงินฝาก (ค่าคงที่ประเภทบัญชี) ที่โครงการนี้ใช้
//  · เก็บประวัติการเปลี่ยนแปลงเงื่อนไขของแต่ละรอบเพื่อตรวจสอบย้อนหลัง
// ════════════════════════════════════════════════════════════════════

const DPJ_KEY = 'dep_projects_v1';
const DPJ_USER = 'จันทร์เพ็ญ มาลี';
const dpjNow = () => new Date().toISOString().slice(0, 19);
const dpjToday = () => new Date().toISOString().slice(0, 10);
const dpjUid = (p) => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const dpjThYear = (iso) => Number(String(iso || '').slice(0, 4)) + 543;

const DPJ_SEED = [
  {
    id: 'DPJ-01', code: 'PJ01', typeCode: 'S02', groupCode: 'DEP', name: 'ออมทรัพย์ทวีทรัพย์', enabled: true, createdDate: '2021-01-04',
    note: 'โครงการออมทรัพย์รายปี เปิดรับสมัครต้นปีและกลางปี',
    rounds: [
      { id: 'PJR-0101', year: 2569, name: 'ทวีทรัพย์ ปี 2569', quotaMax: 500, joined: 128, enabled: true,
        accTypes: ['S02'], minOpen: 5000, rateBonus: 0.25, termMonths: 12,
        periods: [
          { id: 'PP-1', from: '2026-01-05', to: '2026-02-28', note: 'รอบต้นปี' },
          { id: 'PP-2', from: '2026-07-01', to: '2026-08-31', note: 'รอบกลางปี' },
        ],
        history: [{ ts: '2026-01-04T09:15:00', user: 'ประภาส ทองสุข', action: 'create',
          summary: 'สร้างรอบโครงการ “ทวีทรัพย์ ปี 2569”', changes: [] }] },
      { id: 'PJR-0102', year: 2568, name: 'ทวีทรัพย์ ปี 2568', quotaMax: 400, joined: 400, enabled: false,
        accTypes: ['S02'], minOpen: 5000, rateBonus: 0.20, termMonths: 12,
        periods: [{ id: 'PP-3', from: '2025-01-06', to: '2025-02-28', note: 'รอบเดียว' }],
        history: [{ ts: '2025-01-05T10:00:00', user: 'ประภาส ทองสุข', action: 'create',
          summary: 'สร้างรอบโครงการ “ทวีทรัพย์ ปี 2568”', changes: [] }] },
    ],
  },
  {
    id: 'DPJ-02', code: 'PJ02', typeCode: 'F12', groupCode: 'OPN', name: 'ฝากประจำปันผลพิเศษ', enabled: true, createdDate: '2023-05-02',
    note: 'ฝากประจำ 12 เดือน อัตราพิเศษเฉพาะช่วงรับสมัคร',
    rounds: [
      { id: 'PJR-0201', year: 2569, name: 'ปันผลพิเศษ ปี 2569', quotaMax: 250, joined: 61, enabled: true,
        accTypes: ['F12'], minOpen: 100000, rateBonus: 0.50, termMonths: 12,
        periods: [{ id: 'PP-4', from: '2026-09-01', to: '2026-10-31', note: 'ไตรมาส 4' }],
        history: [{ ts: '2026-08-20T14:05:00', user: DPJ_USER, action: 'create',
          summary: 'สร้างรอบโครงการ “ปันผลพิเศษ ปี 2569”', changes: [] }] },
    ],
  },
];

function dpjLoad() {
  try { const s = localStorage.getItem(DPJ_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(DPJ_SEED));
}
function dpjSave(list) { try { localStorage.setItem(DPJ_KEY, JSON.stringify(list)); } catch (e) {} }

// ── สถานะรอบตามช่วงเวลา + โควตา ──
function dpjRoundState(round, today) {
  const d = today || dpjToday();
  if (!round.enabled) return { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
  const full = Number(round.joined || 0) >= Number(round.quotaMax || 0) && Number(round.quotaMax || 0) > 0;
  const open = (round.periods || []).some(p => p.from && p.to && p.from <= d && d <= p.to);
  const future = (round.periods || []).some(p => p.from > d);
  if (full) return { key: 'full', label: 'เต็มจำนวน', pill: 'warn' };
  if (open) return { key: 'open', label: 'เปิดรับสมัคร', pill: 'ok' };
  if (future) return { key: 'soon', label: 'ยังไม่ถึงช่วง', pill: 'neutral' };
  return { key: 'closed', label: 'สิ้นสุดแล้ว', pill: 'neutral' };
}

// รอบที่รับสมัครได้จริงของประเภทบัญชีหนึ่ง ๆ (ใช้ร่วมกับหน้าเปิดบัญชี)
function dpjOpenRoundsFor(typeCode, today) {
  const d = today || dpjToday();
  const out = [];
  dpjLoad().forEach(p => {
    if (!p.enabled) return;
    (p.rounds || []).forEach(r => {
      if (!(r.accTypes || []).includes(typeCode)) return;
      const st = dpjRoundState(r, d);
      if (st.key !== 'open') return;
      out.push({ project: p, round: r, state: st });
    });
  });
  return out;
}
// โครงการที่อ้างถึงประเภทบัญชีนี้ (ทุกสถานะ) — ใช้แสดงความสอดคล้องในหน้าค่าคงที่ประเภทบัญชี
function dpjProjectsUsing(typeCode) {
  const out = [];
  dpjLoad().forEach(p => (p.rounds || []).forEach(r => {
    if ((r.accTypes || []).includes(typeCode)) out.push({ project: p, round: r });
  }));
  return out;
}

const dpjAccTypes = () => (window.DEP_ACCTYPE_SEED || []).filter(t => t.enabled);
// กลุ่มประเภทเงินฝาก (ค่าคงที่) — ใช้เป็นตัวเลือกประเภทเงินฝากของโครงการ
const dpjDepGroups = () => {
  try { const s = localStorage.getItem('dep_const_depgroup_v2'); if (s) return JSON.parse(s).filter(g => g.enabled !== false).map(g => ({ code: g.code, name: g.name })); } catch (e) {}
  return [
    { code: 'DEP', name: 'ฝากเงิน' }, { code: 'WID', name: 'ถอนเงิน' }, { code: 'OPN', name: 'เปิดบัญชี' },
    { code: 'CLS', name: 'ปิดบัญชี' }, { code: 'INT', name: 'ดอกเบี้ย' }, { code: 'FEE', name: 'ค่าธรรมเนียม' }, { code: 'ADJ', name: 'รายการปรับปรุง' },
  ];
};
const dpjGroupName = (code) => { const g = dpjDepGroups().find(x => x.code === code); return g ? g.name : ''; };
const dpjProjGroup = (p) => (p && p.groupCode) || 'DEP';
const dpjProjType = (p) => {
  if (!p) return '';
  const known = (c) => !!c && (window.DEP_ACCTYPE_SEED || []).some(t => t.code === c);
  if (known(p.typeCode)) return p.typeCode;
  const r = ((p.rounds || []).find(x => (x.accTypes || []).some(known)) || {});
  return (r.accTypes || []).find(known) || '';
};
const dpjTypeName = (code) => { const t = (window.DEP_ACCTYPE_SEED || []).find(x => x.code === code); return t ? t.name : code; };

// ─── ประวัติการเปลี่ยนแปลงเงื่อนไขของรอบโครงการ ─────────────────────
function DpjHistoryModal({ project, round, onClose }) {
  const hist = round.history || [];
  const meta = (a) => a === 'create' ? { label: 'สร้างรอบโครงการ', color: 'var(--success)', icon: 'plus' }
    : a === 'toggle' ? { label: 'เปิด/ปิดการใช้งาน', color: 'var(--warning)', icon: 'refresh' }
    : { label: 'แก้ไขเงื่อนไข', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop dpj-modal-bd" onClick={onClose} />
      <div className="modal-card dpj-modal" role="dialog" aria-modal="true" style={{ width: 640, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการเปลี่ยนแปลงเงื่อนไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{project.code} · {project.name} — {round.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          {hist.map((h, i) => {
            const m = meta(h.action);
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center',
                              background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color }}>
                  <Icon name={m.icon} size={14} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.date(h.ts.slice(0, 10))} · {h.ts.slice(11, 16)} น.</span>
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 3 }}>{h.summary}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                  {(h.changes || []).length > 0 && (
                    <div className="table-wrap" style={{ marginTop: 6 }}>
                      <table className="tbl">
                        <thead><tr><th>รายการ</th><th>ค่าเดิม</th><th>ค่าใหม่</th></tr></thead>
                        <tbody>{h.changes.map((c, j) => (
                          <tr key={j}><td>{c.field}</td><td className="muted">{c.before}</td><td><b>{c.after}</b></td></tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── เพิ่ม/แก้ไขโครงการหลัก ─────────────────────────────────────────
function DpjProjectModal({ rec, list, onClose, onSubmit }) {
  const [f, setF] = useState(() => rec ? { ...rec, typeCode: dpjProjType(rec), groupCode: dpjProjGroup(rec) } : { code: '', typeCode: '', groupCode: '', name: '', note: '' });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  // เลือกประเภทเงินฝาก → ตั้งชื่อโครงการตาม (ถ้ายังไม่ได้แก้ชื่อเอง)
  const pickType = (code) => setF(s => {
    const prevName = dpjTypeName(s.typeCode);
    const autoName = !s.name || s.name === prevName;
    return { ...s, typeCode: code, name: autoName ? (code ? dpjTypeName(code) : '') : s.name };
  });
  const dupCode = list.some(p => p.code.toLowerCase() === String(f.code || '').trim().toLowerCase() && p.id !== (rec && rec.id));
  const ok = String(f.code || '').trim() && f.typeCode && String(f.name || '').trim() && !dupCode;
  return (
    <>
      <div className="modal-backdrop dpj-modal-bd" onClick={onClose} />
      <div className="modal-card dpj-modal" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="wallet" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{rec ? 'แก้ไขโครงการ' : 'เพิ่มโครงการเงินฝาก'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>โครงการหลักใช้ซ้ำได้ทุกปี — สร้างรอบรายปีภายในโครงการ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="cfg-field">
            <label className="cfg-label">รหัสโครงการ <span className="cfg-required">*</span></label>
            <div>
              <input className="cfg-input mono" style={{ maxWidth: 160 }} value={f.code} disabled={!!rec}
                     onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="PJ03" />
              {dupCode && <div className="cfg-error">รหัสนี้ถูกใช้แล้ว</div>}
            </div>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ประเภทเงินฝากที่ใช้ในโครงการ <span className="cfg-required">*</span></label>
            <div>
              <select className="cfg-input" value={f.typeCode} onChange={(e) => pickType(e.target.value)}>
                <option value="">— เลือกประเภทเงินฝาก —</option>
                {dpjAccTypes().map(t => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
              </select>
              <div className="bud-fld-hint">อ้างอิงจากค่าคงที่ › ประเภทเงินฝาก</div>
            </div>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ชื่อโครงการ <span className="cfg-required">*</span></label>
            <div>
              <input className="cfg-input" value={f.name} onChange={(e) => set('name', e.target.value)}
                     placeholder="ตั้งตามประเภทเงินฝากที่เลือก — แก้ไขได้" />
              <div className="bud-fld-hint">ระบบตั้งชื่อตามประเภทเงินฝากที่เลือกให้ — พิมพ์แก้ไขได้</div>
            </div>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">หมายเหตุ</label>
            <textarea className="cfg-input" rows={2} value={f.note || ''} onChange={(e) => set('note', e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!ok} onClick={() => onSubmit({ ...f, code: f.code.trim(), name: f.name.trim() })}>
            <Icon name="check" /> บันทึก
          </button>
        </div>
      </div>
    </>
  );
}

// ─── เพิ่ม/แก้ไขรอบโครงการ (ชื่อรอบ · ช่วงเวลา · โควตา · ประเภทเงินฝาก) ──
function DpjRoundModal({ project, rec, onClose, onSubmit }) {
  const blank = {
    name: (project && project.name ? project.name + ' ปี ' + dpjThYear(dpjToday()) : ''), year: dpjThYear(dpjToday()), quotaMax: 100, joined: 0, enabled: true,
    accTypes: dpjProjType(project) ? [dpjProjType(project)] : [], minOpen: 0, rateBonus: 0, termMonths: 0,
    periods: [{ id: dpjUid('PP'), from: '', to: '', note: '' }],
  };
  const [f, setF] = useState(rec ? JSON.parse(JSON.stringify(rec)) : blank);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const setPeriod = (i, k, v) => setF(s => ({ ...s, periods: s.periods.map((p, j) => j === i ? { ...p, [k]: v } : p) }));
  const addPeriod = () => setF(s => ({ ...s, periods: [...s.periods, { id: dpjUid('PP'), from: '', to: '', note: '' }] }));
  const delPeriod = (i) => setF(s => ({ ...s, periods: s.periods.filter((_, j) => j !== i) }));
  // ประเภทเงินฝากของรอบ = ประเภทเงินฝากของโครงการ (ไม่ต้องเลือกซ้ำ)
  React.useEffect(() => {
    const pt = dpjProjType(project);
    if (pt && !(f.accTypes || []).includes(pt)) setF(s => ({ ...s, accTypes: [pt] }));
  }, []);

  const badPeriod = f.periods.some(p => !p.from || !p.to || p.from > p.to);
  const ok = String(f.name || '').trim() && Number(f.quotaMax) > 0 && !badPeriod;

  return (
    <>
      <div className="modal-backdrop dpj-modal-bd" onClick={onClose} />
      <div className="modal-card dpj-modal" role="dialog" aria-modal="true" style={{ width: 760, maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="calendar" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{rec ? 'แก้ไขรอบโครงการ' : 'เพิ่มรอบโครงการ'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{project.code} · {project.name} — ทุกการแก้ไขเงื่อนไขจะถูกเก็บประวัติ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>ข้อมูลรอบโครงการ</h3></div>
          <div className="cfg-field">
            <label className="cfg-label">ชื่อโครงการย่อย <span className="cfg-required">*</span></label>
            <input className="cfg-input" value={f.name} onChange={(e) => set('name', e.target.value)}
                   placeholder={`เช่น ${project.name} ปี ${dpjThYear(dpjToday())}`} />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ปีโครงการ (พ.ศ.)</label>
            <input className="cfg-input mono right" style={{ maxWidth: 120 }} value={f.year}
                   onChange={(e) => set('year', e.target.value.replace(/[^0-9]/g, ''))} />
          </div>
          <div className="cfg-field">
            <label className="cfg-label">สิทธิ์ผู้เข้าร่วมสูงสุด <span className="cfg-required">*</span></label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono right" style={{ maxWidth: 130 }} value={f.quotaMax}
                     onChange={(e) => set('quotaMax', e.target.value.replace(/[^0-9]/g, ''))} />
              <span className="muted" style={{ fontSize: 12 }}>คน · เข้าร่วมแล้ว {Number(f.joined || 0).toLocaleString()} คน</span>
            </div>
          </div>

          <div className="section-head" style={{ margin: '16px 0 10px' }}>
            <span className="head-bar" /><h3>ช่วงเวลาโครงการ</h3>
            <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
              <button className="btn sm" onClick={addPeriod}><Icon name="plus" size={13} /> เพิ่มช่วงเวลา</button>
            </div>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th style={{ width: 170 }}>วันที่เริ่มต้น</th>
                  <th style={{ width: 170 }}>วันที่สิ้นสุด</th>
                  <th>หมายเหตุ</th>
                  <th className="center" style={{ width: 70 }}>ลบ</th>
                </tr>
              </thead>
              <tbody>
                {f.periods.map((p, i) => (
                  <tr key={p.id}>
                    <td className="muted mono">{i + 1}</td>
                    <td><window.ThaiDateField value={p.from} onChange={(v) => setPeriod(i, 'from', v)} /></td>
                    <td><window.ThaiDateField value={p.to} onChange={(v) => setPeriod(i, 'to', v)} /></td>
                    <td><input className="cfg-input" value={p.note || ''} onChange={(e) => setPeriod(i, 'note', e.target.value)} placeholder="เช่น รอบต้นปี" /></td>
                    <td className="center">
                      <button className="btn sm tt-del-btn" disabled={f.periods.length <= 1} onClick={() => delPeriod(i)}>
                        <Icon name="trash" size={13} /> ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          {badPeriod && <div className="cfg-error" style={{ marginTop: 6 }}>ทุกช่วงเวลาต้องระบุวันที่เริ่มต้นและสิ้นสุด และวันเริ่มต้นต้องไม่เกินวันสิ้นสุด</div>}

          <div className="section-head" style={{ margin: '16px 0 10px' }}><span className="head-bar" /><h3>เงื่อนไขเพิ่มเติมของรอบ</h3></div>
          <div className="cfg-field">
            <label className="cfg-label">เปิดบัญชีขั้นต่ำ</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono right" style={{ maxWidth: 140 }} value={f.minOpen}
                     onChange={(e) => set('minOpen', e.target.value.replace(/[^0-9.]/g, ''))} />
              <span className="muted" style={{ fontSize: 12 }}>บาท</span>
            </div>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">อัตราดอกเบี้ยพิเศษ (+)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono right" style={{ maxWidth: 140 }} value={f.rateBonus}
                     onChange={(e) => set('rateBonus', e.target.value.replace(/[^0-9.]/g, ''))} />
              <span className="muted" style={{ fontSize: 12 }}>% ต่อปี</span>
            </div>
          </div>
          <div className="cfg-field">
            <label className="cfg-label">ระยะเวลาฝากตามโครงการ</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono right" style={{ maxWidth: 140 }} value={f.termMonths}
                     onChange={(e) => set('termMonths', e.target.value.replace(/[^0-9]/g, ''))} />
              <span className="muted" style={{ fontSize: 12 }}>เดือน (0 = ไม่กำหนด)</span>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!ok} onClick={() => onSubmit({
            ...f, name: f.name.trim(), year: Number(f.year) || dpjThYear(dpjToday()),
            quotaMax: Number(f.quotaMax) || 0, minOpen: Number(f.minOpen) || 0,
            rateBonus: Number(f.rateBonus) || 0, termMonths: Number(f.termMonths) || 0,
          })}><Icon name="check" /> บันทึก</button>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก ───────────────────────────────────────────────────────
function DepProjectConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(dpjLoad);
  const [q, setQ] = React.useState('');
  const [query, setQuery] = React.useState('');
  const qn = query.trim().toLowerCase();
  const shown = qn ? list.filter(r => (String(r.code) + ' ' + r.name + ' ' + (r.note || '')).toLowerCase().includes(qn)) : list;
  const [openId, setOpenId] = useState(null);
  const [projModal, setProjModal] = useState(null);   // { rec } | { rec: null }
  const [roundModal, setRoundModal] = useState(null); // { project, rec }
  const [histTarget, setHistTarget] = useState(null);
  const [draft, setDraft] = useState(null);
  const persist = (next) => { setList(next); dpjSave(next); };
  const cur = list.find(p => p.id === openId);
  const today = dpjToday();
  const draftOf = (p) => ({ code: p.code, typeCode: dpjProjType(p), name: p.name, note: p.note || '' });
  React.useEffect(() => { setDraft(cur ? draftOf(cur) : null); }, [openId, cur && cur.code, cur && cur.name, cur && cur.typeCode]);
  const setD = (k, v) => setDraft(s => ({ ...s, [k]: v }));
  const pickDraftType = (code) => setDraft(s => {
    const autoName = !s.name || s.name === dpjTypeName(s.typeCode);
    return { ...s, typeCode: code, name: autoName ? dpjTypeName(code) : s.name };
  });
  const draftDirty = !!(cur && draft) && (draft.code !== cur.code || draft.typeCode !== dpjProjType(cur) || draft.name !== cur.name || (draft.note || '') !== (cur.note || ''));
  const draftDup = !!(cur && draft) && list.some(p => p.id !== cur.id && p.code.toLowerCase() === String(draft.code || '').trim().toLowerCase());
  const draftOk = !!draft && String(draft.code || '').trim() && draft.typeCode && String(draft.name || '').trim() && !draftDup;

  const totalRounds = list.reduce((a, p) => a + (p.rounds || []).length, 0);
  const openRounds = list.reduce((a, p) => a + (p.rounds || []).filter(r => dpjRoundState(r, today).key === 'open').length, 0);

  const saveProject = (f) => {
    if (f.id) {
      persist(list.map(p => p.id === f.id ? { ...p, ...f } : p));
      audit.log({ action: 'update', module: 'เงินฝาก — โครงการประเภทเงินฝาก', target: `${f.code} · ${f.name}`, summary: `แก้ไขโครงการ “${f.name}”` });
      window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกโครงการ “' + f.code + '-' + f.name + '” เรียบร้อยแล้ว' });
    } else {
      const rec = { ...f, id: dpjUid('DPJ'), enabled: true, createdDate: today, rounds: [] };
      persist([rec, ...list]);
      audit.log({ action: 'create', module: 'เงินฝาก — โครงการประเภทเงินฝาก', target: `${rec.code} · ${rec.name}`, summary: `เพิ่มโครงการ “${rec.name}”` });
      onToast && onToast(`เพิ่มโครงการ “${rec.name}” แล้ว`);
      setOpenId(rec.id);
    }
    setProjModal(null);
  };

  const toggleProject = (p) => window.depConfirmOff(p.enabled, p.code + ' · ' + p.name, () => {
    persist(list.map(x => x.id === p.id ? { ...x, enabled: !x.enabled } : x));
    onToast && onToast((p.enabled ? 'ปิด' : 'เปิด') + `ใช้งานโครงการ “${p.name}” แล้ว`);
  }, 'โครงการนี้จะไม่แสดงให้เลือกตอนเปิดบัญชีเงินฝาก', 'ปิดการใช้งานโครงการ');

  const saveRound = (f) => {
    const project = roundModal.project;
    const before = roundModal.rec;
    const changes = [];
    if (before) {
      const cmp = [
        ['ชื่อโครงการย่อย', before.name, f.name],
        ['ปีโครงการ', before.year, f.year],
        ['สิทธิ์ผู้เข้าร่วมสูงสุด', before.quotaMax + ' คน', f.quotaMax + ' คน'],
        ['ประเภทเงินฝาก', (before.accTypes || []).join(', ') || '—', (f.accTypes || []).join(', ') || '—'],
        ['เปิดบัญชีขั้นต่ำ', fmt.money(before.minOpen, 2), fmt.money(f.minOpen, 2)],
        ['อัตราดอกเบี้ยพิเศษ', before.rateBonus + '%', f.rateBonus + '%'],
        ['ระยะเวลาฝาก', (before.termMonths || 0) + ' เดือน', (f.termMonths || 0) + ' เดือน'],
        ['จำนวนช่วงเวลา', (before.periods || []).length + ' ช่วง', (f.periods || []).length + ' ช่วง'],
      ];
      cmp.forEach(([field, b, a]) => { if (String(b) !== String(a)) changes.push({ field, before: String(b), after: String(a) }); });
    }
    const entry = {
      ts: dpjNow(), user: DPJ_USER, action: before ? 'update' : 'create',
      summary: before ? `แก้ไขเงื่อนไขรอบ “${f.name}” (${changes.length} รายการ)` : `สร้างรอบโครงการ “${f.name}”`,
      changes,
    };
    const nextRound = { ...f, id: f.id || dpjUid('PJR'), history: [entry, ...(before ? before.history || [] : [])] };
    persist(list.map(p => p.id !== project.id ? p : {
      ...p, rounds: before ? p.rounds.map(r => r.id === before.id ? nextRound : r) : [nextRound, ...(p.rounds || [])],
    }));
    audit.log({ action: before ? 'update' : 'create', module: 'เงินฝาก — โครงการประเภทเงินฝาก',
      target: `${project.code} · ${f.name}`, summary: entry.summary, changes });
    onToast && onToast(entry.summary);
    setRoundModal(null);
  };

  const toggleRound = (project, r) => window.depConfirmOff(r.enabled, r.name, () => doToggleRound(project, r), 'รอบนี้จะไม่เปิดรับสมัคร และไม่แสดงให้เลือกตอนเปิดบัญชี', 'ปิดการใช้งานรอบโครงการ');
  const doToggleRound = (project, r) => {
    const entry = { ts: dpjNow(), user: DPJ_USER, action: 'toggle',
      summary: (r.enabled ? 'ปิด' : 'เปิด') + `การใช้งานรอบ “${r.name}”`,
      changes: [{ field: 'การใช้งาน', before: r.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน', after: r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }] };
    persist(list.map(p => p.id !== project.id ? p : {
      ...p, rounds: p.rounds.map(x => x.id === r.id ? { ...x, enabled: !x.enabled, history: [entry, ...(x.history || [])] } : x),
    }));
    onToast && onToast(entry.summary);
  };

  // ══ รายละเอียดโครงการ ══
  if (cur && draft) {
    return (
      <div data-screen-label="หน้าโครงการประเภทเงินฝาก — รายละเอียด">
        <div className="page-actions dep-open-sticky">
          <button className="btn ghost sm" onClick={() => setOpenId(null)}><Icon name="chevLeft" size={13} /> กลับสู่รายการ</button>
          <span className="spacer" />
          <button className="btn sm" disabled={!draftDirty} onClick={() => setDraft(draftOf(cur))}>ละทิ้ง</button>
          <button className="btn primary sm" data-keep-top="" disabled={!draftDirty || !draftOk}
                  onClick={() => { setProjModal(null); saveProject({ ...cur, ...draft, code: draft.code.trim(), name: draft.name.trim() }); }}>
            <Icon name="check" /> บันทึกโครงการ
          </button>
        </div>

        <div className="search-card dpj-head-card">
          <div className="dpj-head-ico"><Icon name="calendar" size={18} /></div>
          <div className="dpj-head-grid">
            <div className="dpj-fld">
              <label className="dat-label">รหัสโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={draft.code} disabled onChange={(e) => setD('code', e.target.value.toUpperCase())} />
              {draftDup && <div className="cfg-error">รหัสนี้ถูกใช้แล้ว</div>}
            </div>
            <div className="dpj-fld">
              <label className="dat-label">ประเภทเงินฝากที่ใช้ <span className="cfg-required">*</span></label>
              <select className="cfg-input" value={draft.typeCode} onChange={(e) => pickDraftType(e.target.value)}>
                <option value="">— เลือกประเภทเงินฝาก —</option>
                {dpjAccTypes().map(t => <option key={t.code} value={t.code}>{t.code} — {t.name}</option>)}
              </select>
            </div>
            <div className="dpj-fld">
              <label className="dat-label">ชื่อโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={draft.name} onChange={(e) => setD('name', e.target.value)} />
            </div>
            <div className="dpj-fld dpj-fld-full">
              <label className="dat-label">หมายเหตุ</label>
              <input className="cfg-input" value={draft.note} onChange={(e) => setD('note', e.target.value)} placeholder="รายละเอียดเพิ่มเติมของโครงการ" />
            </div>
          </div>
        </div>

        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0 }}>โครงการย่อย (ทำซ้ำได้ทุกปี)</h3>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>แต่ละรอบเก็บประวัติการเปลี่ยนแปลงเงื่อนไขประเภทเงินฝาก ช่วงเวลา และจำนวนสิทธิ์ของตนเอง</div>
            </div>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn primary sm" onClick={() => setRoundModal({ project: cur, rec: null })}><Icon name="plus" /> สร้างโครงการย่อย</button>
          </div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>ชื่อโครงการย่อย</th>
                  <th className="center" style={{ width: 70 }}>ปี</th>
                  <th style={{ minWidth: 220 }}>ช่วงเวลาโครงการ</th>
                  <th style={{ minWidth: 180 }}>ประเภทเงินฝากที่ใช้</th>
                  <th className="right" style={{ width: 150 }}>สิทธิ์ผู้เข้าร่วมสูงสุด</th>
                  <th className="center" style={{ width: 120 }}>สถานะ</th>
                  <th className="center" style={{ width: 70 }}>ใช้งาน</th>
                  <th className="center" style={{ width: 150 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {(cur.rounds || []).length === 0 && (
                  <tr><td colSpan={8}><div className="empty-state">ยังไม่มีโครงการย่อย — กด “สร้างโครงการย่อย” เพื่อเริ่มต้น</div></td></tr>
                )}
                {(cur.rounds || []).map(r => {
                  const st = dpjRoundState(r, today);
                  return (
                    <tr key={r.id} className={r.enabled ? undefined : 'dat-off'}>
                      <td>
                        <div className="lt-row-name">{r.name}</div>
                        {r.note && <div className="lt-row-note muted">{r.note}</div>}
                      </td>
                      <td className="center mono">{r.year}</td>
                      <td>
                        {(r.periods || []).map(p => (
                          <div key={p.id} style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                            <span className="mono">{fmt.date(p.from)} – {fmt.date(p.to)}</span>
                            {p.note && <span className="muted"> · {p.note}</span>}
                          </div>
                        ))}
                      </td>
                      <td>{(r.accTypes || []).map(c => <span key={c} className="chip" style={{ marginRight: 4, marginBottom: 2 }}>{c} — {dpjTypeName(c)}</span>)}</td>
                      <td className="right">
                        <div className="mono"><b>{Number(r.quotaMax || 0).toLocaleString()}</b> คน</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>เข้าร่วมแล้ว {Number(r.joined || 0).toLocaleString()} คน</div>
                      </td>
                      <td className="center"><span className={'pill ' + st.pill}>{st.label}</span></td>
                      <td className="center">
                        <button className={'lt-switch' + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                                aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggleRound(cur, r)}>
                          <span className="lt-switch-knob" />
                        </button>
                      </td>
                      <td className="center">
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button className="btn sm" title="ประวัติการเปลี่ยนแปลงเงื่อนไข"
                                  onClick={() => { if (r.enabled) setHistTarget({ project: cur, round: r }); }}>
                            <Icon name="history" size={13} /> {(r.history || []).length}
                          </button>
                          <button className="btn sm" title="แก้ไขโครงการย่อย"
                                  onClick={() => { if (r.enabled) setRoundModal({ project: cur, rec: r }); }}>
                            <Icon name="edit" size={13} /> แก้ไข
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="lt-list-foot muted">
          <Icon name="info" size={12} /> โครงการย่อยที่ “เปิดใช้งาน” และอยู่ในช่วงเวลาโครงการ จะแสดงเป็นตัวเลือก “โครงการ” ในหน้าเปิดบัญชีเงินฝาก ตามประเภทเงินฝากที่เลือกไว้
        </div>

        {projModal && <DpjProjectModal rec={projModal.rec} list={list} onClose={() => setProjModal(null)} onSubmit={saveProject} />}
        {roundModal && <DpjRoundModal project={roundModal.project} rec={roundModal.rec} onClose={() => setRoundModal(null)} onSubmit={saveRound} />}
        {histTarget && <DpjHistoryModal project={histTarget.project} round={histTarget.round} onClose={() => setHistTarget(null)} />}
      </div>
    );
  }

  // ══ รายการโครงการ ══
  return (
    <div data-screen-label="หน้าโครงการประเภทเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>โครงการประเภทเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>สร้างโครงการที่ทำซ้ำได้ทุกปี กำหนดช่วงเวลารับสมัครหลายช่วง สิทธิ์ผู้เข้าร่วมสูงสุด และประเภทเงินฝากที่ใช้</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setProjModal({ rec: null })}><Icon name="plus" /> เพิ่มโครงการ</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="wallet" /></div>
        <div>
          <div className="lt-ab-label">โครงการเงินฝากทั้งหมด</div>
          <div className="lt-ab-name">{list.length} โครงการ
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · {totalRounds} รอบ · เปิดรับสมัครอยู่ {openRounds} รอบ</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }}
                   placeholder="ค้นหารหัส หรือชื่อโครงการ" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={() => setQuery(q)}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); }}>รีเซ็ต</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 90 }}>รหัส</th>
                <th style={{ minWidth: 230 }}>ชื่อโครงการ</th>
                <th className="center" style={{ width: 90 }}>รอบทั้งหมด</th>
                <th style={{ minWidth: 190 }}>รอบล่าสุด</th>
                <th className="center" style={{ width: 120 }}>สถานะรอบล่าสุด</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 84 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={7} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {shown.map(p => {
                const latest = (p.rounds || [])[0];
                const st = latest ? dpjRoundState(latest, today) : null;
                return (
                  <tr key={p.id} className={p.enabled ? 'clickable' : 'dat-off'}
                      onClick={() => { if (p.enabled) setOpenId(p.id); }}>
                    <td className="mono">{p.code}</td>
                    <td>
                      <div className="lt-row-name">{p.name}</div>
                      {p.note && <div className="lt-row-note muted">{p.note}</div>}
                    </td>
                    <td className="center mono">{(p.rounds || []).length}</td>
                    <td>{latest ? <span>{latest.name} <span className="muted mono">· {latest.year}</span></span> : <span className="muted">— ยังไม่มีรอบ —</span>}</td>
                    <td className="center">{st ? <span className={'pill ' + st.pill}>{st.label}</span> : <span className="muted">—</span>}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className={'lt-switch' + (p.enabled ? ' on' : '')} role="switch" aria-checked={p.enabled}
                              aria-label={p.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} onClick={() => toggleProject(p)}>
                        <span className="lt-switch-knob" />
                      </button>
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn sm dat-view-btn" title="ดูรอบโครงการ"
                              onClick={() => { if (p.enabled) setOpenId(p.id); }}><Icon name="eye" size={13} /> ดู</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> โครงการไม่สามารถลบได้ — ปิดการใช้งานเพื่อหยุดรับสมัครใหม่ ประวัติการเปลี่ยนแปลงเงื่อนไขของทุกรอบจะถูกเก็บไว้เพื่อการตรวจสอบย้อนหลัง
      </div>

      {projModal && <DpjProjectModal rec={projModal.rec} list={list} onClose={() => setProjModal(null)} onSubmit={saveProject} />}
    </div>
  );
}

Object.assign(window, { DepProjectConfigPage, dpjLoad, dpjRoundState, dpjOpenRoundsFor, dpjProjectsUsing, dpjTypeName });
