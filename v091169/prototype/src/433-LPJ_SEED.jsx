// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ › ค่าคงที่ — โครงการเงินกู้ (Loan Project)
//  • สร้างโครงการ (โครงการหลัก) และโครงการย่อย (รอบของโครงการ — ทำซ้ำทุกปี)
//  • แต่ละรอบระบุช่วงเวลาเริ่ม–สิ้นสุดได้มากกว่า 1 ช่วง
//  • กำหนดจำนวนสิทธิ์การกู้สูงสุดของรอบ
//  • เลือกได้ว่ารอบนั้นใช้ค่าคงที่ "ประเภทเงินกู้" ใดบ้าง (ผูกกับ loan_types)
//  • เก็บประวัติการเปลี่ยนแปลงเงื่อนไขประเภทเงินกู้/ช่วงเวลา/สิทธิ์ ของทุกรอบ
// ════════════════════════════════════════════════════════════════════

const LPJ_G = '#237450';
const LPJ_SOFT = '#eafef2';
const LPJ_LINE = '#f0f0f0';
const LPJ_TH = { textAlign: 'left', fontWeight: 600, fontSize: 12, padding: '9px 12px', borderBottom: '1px solid ' + LPJ_LINE, color: 'rgba(0,0,0,.65)' };
const LPJ_TD = { padding: '10px 12px', borderBottom: '1px solid ' + LPJ_LINE, verticalAlign: 'top' };
const LPJ_MONO = { fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12 };
const lpjBtn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? LPJ_G : '#d9d9d9'), background: primary ? LPJ_G : '#fff',
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', borderRadius: 4, fontFamily: 'inherit',
  fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
});

let _lpjSeq = 0;
const lpjUid = (p) => (p || 'PJ') + '-N' + (++_lpjSeq);
const lpjToday = () => (window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10));
const lpjNow = () => new Date().toISOString().slice(0, 19);
const lpjUser = () => 'จันทร์เพ็ญ มาลี';
const lpjThYear = (iso) => (iso ? Number(iso.slice(0, 4)) + 543 : '');

// ─── ค่าตั้งต้น ──────────────────────────────────────────────────────
const lpjMk = (code, name, type, note, maxRights) => ({
  id: 'PJ-' + code, code: 'PJ-' + code, name, note, enabled: true, loanTypeIds: [type],
  rounds: [{
    id: 'PJR-' + code + '-69', name: name + ' ปี 2569', year: 2569,
    enabled: true, maxRights: maxRights || 1, memberUsed: {}, loanTypeIds: [type],
    periods: [{ id: 'PD-' + code, start: '2026-01-02', end: '2026-12-30', rights: maxRights || 1 }],
    note: '', history: [],
  }],
  history: [{ ts: '2026-01-02T09:00:00', user: 'จันทร์เพ็ญ มาลี', action: 'create', effective: '2026-01-02',
    summary: 'สร้างโครงการ “' + name + '”', changes: [] }],
});
// ประเภทเงินกู้: สามัญ (LP-20 · กลุ่มเงินกู้สามัญ) — แสดงในใบคำขอกู้เงิน
window.LPJ_NORMAL_SEED = [
  ['NRM',    'สามัญปกติ', 2],
  ['NSHR',   'สามัญหุ้น'],
  ['NCONS',  'สามัญเพื่อการรวมหนี้'],
  ['NLIFE',  'สามัญเพื่อการปรับปรุงคุณภาพชีวิต'],
  ['NMULTI', 'สามัญเพื่อสินเชื่อเอนกประสงค์'],
  ['NNEED',  'สามัญเพื่อเหตุจำเป็น'],
  ['NGUAR',  'สามัญช่วยเหลือผู้ค้ำประกัน'],
  ['NLEGAL', 'สามัญเพื่อชำระหนี้บังคับคดีและสถาบันการเงิน'],
  ['NEMDB',  'สามัญเพื่อชำระหนี้ฉุกเฉิน'],
  ['NECON',  'สามัญเพื่อแก้ไขปัญหาเศรษฐกิจ'],
].map(([c, n, r]) => lpjMk(c, n, 'LP-20', 'เงินกู้สามัญ — แสดงในใบคำขอกู้เงิน', r));
// ประเภทเงินกู้: ฉุกเฉิน (LP-10 · กลุ่มเงินกู้ฉุกเฉิน) — แสดงในใบคำขอกู้เงิน
window.LPJ_EMERGENCY_SEED = [lpjMk('EMCASH', 'ฉุกเฉินเงินสด', 'LP-10', 'เงินกู้ฉุกเฉิน — แสดงในใบคำขอกู้เงิน', 3)];
// ประเภทเงินกู้: พิเศษ (LP-30 · กลุ่มเงินกู้พิเศษ) — แสดงในบันทึกจ่ายเงินกู้พิเศษ
window.LPJ_SPECIAL_SEED = [
  ['SPWELF',  'พิเศษเคหะสงเคราะห์'],
  ['SPCAR',   'พิเศษยานพาหนะ'],
  ['SPJOB',   'พิเศษเพื่อประกอบอาชีพ'],
  ['SPWELFR', 'พิเศษเคหะสงเคราะห์ (อัตราดอกเบี้ยพิเศษ)'],
].map(([c, n]) => lpjMk(c, n, 'LP-30', 'เงินกู้พิเศษ — แสดงในบันทึกจ่ายเงินกู้พิเศษ', 1));
window.LPJ_SEED = [...window.LPJ_NORMAL_SEED, ...window.LPJ_EMERGENCY_SEED, ...window.LPJ_SPECIAL_SEED];

function lpjNormalizeRound(r) {
  return {
    id: r.id || lpjUid('PJR'), name: r.name || '', abbr: r.abbr || '', year: r.year || lpjThYear(lpjToday()),
    // ข้อมูลเก่าเก็บ maxRights เป็นโควต้ารวม — จำกัดลงเป็นจำนวนครั้งต่อราย
    enabled: !!r.enabled, maxRights: Math.min(Number(r.maxRights) || 0, 20), memberUsed: r.memberUsed || {},
    noRepeat: !!r.noRepeat,
    loanTypeIds: (r.loanTypeIds || []).slice(0, 1), periods: (r.periods || []).map((p, i) => ({ id: p.id || 'PD-' + i, start: p.start || '', end: p.end || '', rights: Number(p.rights) || Number(r.maxRights) || 1 })),
    note: r.note || '', history: r.history || [],
  };
}
function lpjNormalize(p) {
  return {
    ...p, enabled: !!p.enabled, loanTypeIds: (p.loanTypeIds || []).slice(0, 1),
    rounds: (p.rounds || []).map(lpjNormalizeRound), history: p.history || [],
  };
}
window.lpjLoad = () => {
  try {
    // รีเซ็ตเป็นข้อมูลตัวอย่างชุดใหม่ครั้งเดียว (ชื่อโครงการ = ชื่อประเภทเงินกู้)
    // v3: สิทธิ์การกู้ = จำนวนครั้งต่อผู้กู้ 1 ราย (เดิมเก็บเป็นโควต้ารวม) — รีเซ็ตข้อมูลตัวอย่างครั้งเดียว
    if (!localStorage.getItem('loan_projects_seed_v6')) {
      localStorage.removeItem('loan_projects');
      localStorage.setItem('loan_projects_seed_v6', '1');
    }
    const saved = localStorage.getItem('loan_projects');
    if (saved) {
      // ล้างรายการทดลองที่รหัสสั้นกว่า 3 ตัวอักษร (ครั้งเดียว)
      let arr = JSON.parse(saved);
      // ลบรายการทดลองรหัส 123 (ครั้งเดียว)
      if (!localStorage.getItem('loan_projects_purge_123')) {
        const c2 = arr.filter(r => String(r.code || '').trim() !== '123');
        if (c2.length !== arr.length) { arr = c2; localStorage.setItem('loan_projects', JSON.stringify(arr)); }
        localStorage.setItem('loan_projects_purge_123', '1');
      }
      if (!localStorage.getItem('loan_projects_purged_v1')) {
        const clean = arr.filter(r => String(r.code || '').trim().length >= 3);
        if (clean.length !== arr.length) { arr = clean; localStorage.setItem('loan_projects', JSON.stringify(arr)); }
        localStorage.setItem('loan_projects_purged_v1', '1');
      }
      // เพิ่มโครงการเงินกู้พิเศษ 4 ประเภท (ครั้งเดียว — ไม่ทับข้อมูลเดิม)
      if (!localStorage.getItem('loan_projects_special_v1')) {
        const add = window.LPJ_SPECIAL_SEED.filter(x => !arr.some(r => r.id === x.id))
          .map(x => JSON.parse(JSON.stringify(x)));
        if (add.length) { arr = [...arr, ...add]; localStorage.setItem('loan_projects', JSON.stringify(arr)); }
        localStorage.setItem('loan_projects_special_v1', '1');
      }
      return arr.map(lpjNormalize);
    }
  } catch (e) {}
  return window.LPJ_SEED.map(r => lpjNormalize(JSON.parse(JSON.stringify(r))));
};

// ─── คอลัมน์ "โครงการเงินกู้" ในตารางรายการ (ใบคำขอกู้เงิน / บันทึกจ่ายเงินกู้พิเศษ / อนุมัติสินเชื่อ) ───
//  ใช้ตรรกะเดียวกันทุกหน้า: โครงการที่ผูกไว้ → ถ้าไม่มี เลือก mock ตามประเภทเงินกู้ (คงที่ต่อเลข CRM)
window.lpjIsSpecialProject = (p) => (p.loanTypeIds || []).some(id => { const lp = window.lrFindProduct && window.lrFindProduct(id); return lp && lp.group === 'special'; });
window.lpjListCell = ({ key, productId, projectId, roundId }) => {
  const prod = window.lrFindProduct ? window.lrFindProduct(productId) : null;
  const special = !!(prod && prod.group === 'special');
  const pjs = window.lpjLoad().filter(p => window.lpjIsSpecialProject(p) === special);
  const seed = String(key || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const byType = pjs.filter(p => (p.loanTypeIds || []).includes(productId));
  const pool = byType.length ? byType : pjs;
  const pj = pjs.find(p => p.id === projectId) || pool[seed % Math.max(1, pool.length)];
  const rd = pj && ((pj.rounds || []).find(x => x.id === roundId) || (pj.rounds || [])[0]);
  const typeId = pj && (pj.loanTypeIds || [])[0];
  return {
    title: rd ? rd.name : pj ? pj.name : (prod ? prod.name : ''),
    sub: typeId ? window.lpjTypeLabel(typeId) : (prod ? prod.code + ' — ' + prod.name : ''),
  };
};
window.lpjSave = (list) => { try { localStorage.setItem('loan_projects', JSON.stringify(list)); } catch (e) {} };

// ─── ประเภทเงินกู้ (ค่าคงที่เดียวกับหน้า ค่าคงที่ › ประเภทเงินกู้) ─────
window.lpjLoanTypes = () => {
  let list = [];
  try {
    const saved = localStorage.getItem('loan_types');
    list = saved ? JSON.parse(saved) : (window.LP_SEED || []);
  } catch (e) { list = window.LP_SEED || []; }
  return list.map(p => ({ id: p.id, code: p.code, name: p.name, enabled: !!p.enabled }));
};
window.lpjTypeLabel = (id) => {
  const t = window.lpjLoanTypes().find(x => x.id === id);
  return t ? t.code + ' — ' + t.name : id;
};
// ค่าจำกัดจากแท็บ “ทั่วไป” ของประเภทเงินกู้ — สแตมประกอบในโมดอลโครงการย่อย (ดูอย่างเดียว)
window.lpjTypeLimits = (ids) => {
  let list = [];
  try {
    const saved = localStorage.getItem('loan_types');
    list = saved ? JSON.parse(saved) : (window.LP_SEED || []);
  } catch (e) { list = window.LP_SEED || []; }
  const t = list.find(x => x.id === (ids || [])[0]);
  const n = (v) => (Number(v) > 0 ? Number(v) : 0);
  return t
    ? { maxContracts: n(t.maxContracts), maxTimesPerYear: n(t.maxTimesPerYear), maxTimesTotal: n(t.maxTimesTotal) }
    : null;
};

// ─── ช่วงเวลา ───────────────────────────────────────────────────────
window.lpjRoundActive = (round, asOf) => {
  if (!round || !round.enabled) return false;
  const d = asOf || lpjToday();
  return (round.periods || []).some(p => p.start && p.start <= d && (!p.end || p.end >= d));
};
window.lpjRoundStatus = (round, asOf) => {
  const d = asOf || lpjToday();
  if (!round.enabled) return { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
  if (window.lpjRoundActive(round, d)) return { key: 'open', label: 'เปิดรับคำขอ', pill: 'ok' };
  const future = (round.periods || []).some(p => p.start && p.start > d);
  if (future) return { key: 'wait', label: 'ยังไม่เริ่ม', pill: 'warn' };
  return { key: 'done', label: 'สิ้นสุดแล้ว', pill: 'bad' };
};
window.lpjProjectStatus = (p, asOf) => {
  if (!p.enabled) return { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
  const rs = (p.rounds || []).map(r => window.lpjRoundStatus(r, asOf).key);
  if (rs.includes('open')) return { key: 'open', label: 'กำลังดำเนินการ', pill: 'ok' };
  if (rs.includes('wait')) return { key: 'wait', label: 'ยังไม่เริ่ม', pill: 'warn' };
  return { key: 'done', label: 'สิ้นสุดแล้ว', pill: 'bad' };
};
const lpjPeriodText = (p) => (p.start ? fmt.date(p.start) : '—') + ' – ' + (p.end ? fmt.date(p.end) : 'ไม่มีกำหนด');

// ─── ใช้ในใบคำขอกู้: โครงการที่เปิดรับคำขอของประเภทเงินกู้นั้น ──────────
// จำนวนครั้งที่สมาชิกรายนี้เคยกู้โครงการย่อยนี้ (อนุมัติแล้ว)
window.lpjMemberUsed = (round, memberCode) => {
  if (!round || !memberCode) return 0;
  return Number((round.memberUsed || {})[String(memberCode)]) || 0;
};
window.lpjOptionsForType = (loanTypeId, asOf, memberCode) => {
  if (!loanTypeId) return [];
  const d = asOf || lpjToday();
  const out = [];
  window.lpjLoad().forEach(p => {
    (p.rounds || []).forEach(r => {
      if (!(r.loanTypeIds || []).includes(loanTypeId) && !(p.loanTypeIds || []).includes(loanTypeId)) return;
      const rs = window.lpjRoundStatus(r, d);
      const st = !p.enabled ? { key: 'off', label: 'โครงการปิดใช้งาน', pill: 'neutral' } : rs;
      const used = window.lpjMemberUsed(r, memberCode);
      const remain = Math.max(0, (Number(r.maxRights) || 0) - used);
      out.push({
        v: p.id + '|' + r.id, l: p.name + ' · ' + r.name,
        status: st.key, statusLabel: st.label, active: st.key === 'open',
        projectId: p.id, projectCode: p.code, projectName: p.name,
        roundId: r.id, roundName: r.name, year: r.year,
        maxRights: Number(r.maxRights) || 0, memberUsed: used, remain, memberChecked: !!memberCode,
        periods: r.periods || [],
      });
    });
  });
  return out;
};
window.lpjFindOption = (key, loanTypeId, asOf, memberCode) =>
  window.lpjOptionsForType(loanTypeId, asOf, memberCode).find(o => o.v === key) || null;
// โครงการทั้งหมดที่อ้างถึงประเภทเงินกู้นี้ (ใช้แสดงในหน้าค่าคงที่ประเภทเงินกู้)
window.lpjProjectsUsingType = (loanTypeId) =>
  window.lpjLoad().filter(p => (p.rounds || []).some(r => (r.loanTypeIds || []).includes(loanTypeId))
    || (p.loanTypeIds || []).includes(loanTypeId));

// ════════════════════════════════════════════════════════════════════
//  ประวัติ — ไทม์ไลน์ (ใช้ทั้งโครงการและโครงการย่อย)
// ════════════════════════════════════════════════════════════════════
function LpjHistoryModal({ title, subtitle, entries, onClose }) {
  const hist = (entries || []).slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  const meta = (a) => a === 'create' ? { label: 'สร้างรายการ', color: 'var(--success)', icon: 'plus' }
    : a === 'toggle' ? { label: 'เปิด/ปิดการใช้งาน', color: 'var(--warning)', icon: 'refresh' }
    : { label: 'แก้ไขเงื่อนไข', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{subtitle}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hist.map((h, i) => {
              const m = meta(h.action);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={m.icon} size={14} />
                    </div>
                    {i < hist.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                      {h.effective && <span className="pill neutral" title="มีผลตั้งแต่">มีผล {fmt.date(h.effective)}</span>}
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.date(String(h.ts).slice(0, 10))} · {String(h.ts).slice(11, 16)} น.</span>
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 3 }}>{h.summary}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                    {(h.changes || []).length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.changes.map((c, ci) => (
                          <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span className="muted" style={{ minWidth: 130 }}>{c.field}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                            <Icon name="chevRight" size={11} />
                            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ป๊อบอัพ เพิ่ม/แก้ไข โครงการ (หลัก)
// ════════════════════════════════════════════════════════════════════
function LpjProjectModal({ list, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const [f, setF] = useState(editRec ? { ...editRec } : { code: '', name: '', note: '', loanTypeIds: [] });
  const [error, setError] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };
  const types = React.useMemo(() => window.lpjLoanTypes(), []);
  const pickType = (id) => {
    const t = types.find(x => x.id === id);
    setF(s => ({ ...s, loanTypeIds: id ? [id] : [], name: t ? t.name : '' }));
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim()) return setError('กรุณาระบุรหัสโครงการ');
    if (!f.name.trim()) return setError('กรุณาระบุชื่อโครงการ');
    if (!(f.loanTypeIds || []).length) return setError('กรุณาเลือกประเภทเงินกู้ที่ใช้ในโครงการ');
    const dup = list.some(r => r.code.toUpperCase() === f.code.trim().toUpperCase() && (!isEdit || r.id !== editRec.id));
    if (dup) return setError('รหัสโครงการนี้ถูกใช้แล้ว');
    onSubmit({
      ...(isEdit ? editRec : { id: lpjUid('PJ'), enabled: false, rounds: [], history: [] }),
      code: f.code.trim().toUpperCase(), name: f.name.trim(), note: (f.note || '').trim(),
      loanTypeIds: f.loanTypeIds,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขโครงการเงินกู้' : 'สร้างโครงการเงินกู้'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {isEdit ? editRec.code + ' · ' + editRec.name : 'โครงการหลัก — เพิ่มโครงการย่อย (รอบปี) ได้ภายหลังในหน้ารายละเอียด'}
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', gap: 10, alignItems: 'start' }}>
            <div>
              <label className="lt-modal-label">รหัสโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={f.code} placeholder="เช่น PJ-HOME" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="lt-modal-label">ประเภทเงินกู้ที่ใช้ในโครงการ <span className="cfg-required">*</span></label>
              <select className="cfg-input" value={(f.loanTypeIds || [])[0] || ''} autoFocus={!isEdit} onChange={(e) => pickType(e.target.value)}>
                <option value="">เลือกประเภทเงินกู้</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.code} — {t.name}{t.enabled ? '' : ' (ปิดใช้งาน)'}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="lt-modal-label">ชื่อโครงการ <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={f.name} placeholder="ตามชื่อประเภทเงินกู้ที่เลือก — แก้ไขได้" onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>
            ดึงจากค่าคงที่ › ประเภทเงินกู้ — เลือกประเภทเงินกู้ซ้ำกับโครงการอื่นได้ · ชื่อโครงการตั้งต้นตามชื่อประเภทเงินกู้ และแก้ไขเองได้
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">หมายเหตุ</label>
            <input className="cfg-input" value={f.note || ''} placeholder="รายละเอียดโครงการ (ไม่บังคับ)" onChange={(e) => set('note', e.target.value)} />
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'สร้างโครงการ'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ป๊อบอัพ เพิ่ม/แก้ไข โครงการย่อย (รอบของโครงการ)
// ════════════════════════════════════════════════════════════════════
function LpjRoundModal({ project, editRec, onClose, onSubmit }) {
  const isEdit = !!editRec;
  const types = React.useMemo(() => window.lpjLoanTypes(), []);
  const lastRound = (project.rounds || [])[0];
  const [f, setF] = useState(() => {
    if (isEdit) return { ...editRec, periods: editRec.periods.map(p => ({ ...p })) };
    const y = lastRound ? Number(lastRound.year) + 1 : lpjThYear(lpjToday());
    return {
      name: project.name + ' ปี ' + y, abbr: '', year: y,
      maxRights: lastRound ? lastRound.maxRights : 1, noRepeat: lastRound ? !!lastRound.noRepeat : false,
      noPeriodLimit: false, banWithRounds: [],
      loanTypeIds: (lastRound ? lastRound.loanTypeIds : project.loanTypeIds) || [],
      periods: [{ id: lpjUid('PD'), start: '', end: '', rights: 1 }], note: '',
      copyFrom: lastRound ? lastRound.id : '',
    };
  });
  const [error, setError] = useState('');
  const typeLimits = window.lpjTypeLimits(project.loanTypeIds || []);
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setError(''); };
  const otherGroups = React.useMemo(() => {
    const out = [];
    (window.lpjLoad() || []).forEach(p => {
      const items = (p.rounds || []).filter(r => !(isEdit && editRec && r.id === editRec.id))
        .map(r => ({ v: r.id, l: r.name }));
      if (items.length) out.push({ id: p.id, name: p.name, code: p.code, items });
    });
    return out;
  }, [project.id, isEdit]);
  const [openGroups, setOpenGroups] = useState(() => {
    const sel = (editRec && editRec.banWithRounds) || [];
    return otherGroups.filter(g => g.items.some(i => sel.includes(i.v))).map(g => g.id);
  });
  const toggleGroupOpen = (id) => setOpenGroups(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleGroupAll = (g, on) => setF(s => {
    const ids = g.items.map(i => i.v);
    const cur = (s.banWithRounds || []).filter(x => !ids.includes(x));
    return { ...s, banWithRounds: on ? [...cur, ...ids] : cur };
  });
  const banOpts = otherGroups.flatMap(g => g.items.map(i => ({ value: i.v, label: i.l })));
  const banLabel = (id) => (banOpts.find(o => o.value === id) || { label: id }).label;
  // ช่วงเวลาทับซ้อน — วันที่สิ้นสุดว่าง = ไม่มีกำหนดสิ้นสุด
  const overlaps = (() => {
    if (f.noPeriodLimit) return [];
    const ps = f.periods.map((p, i) => ({ i, s: p.start, e: p.end || '9999-12-31' })).filter(p => p.s);
    const out = [];
    for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++)
      if (ps[a].s <= ps[b].e && ps[b].s <= ps[a].e) out.push([ps[a].i + 1, ps[b].i + 1]);
    return out;
  })();
  const overlapRows = new Set(overlaps.flat());
  const toggleBan = (id) => setF(s => ({
    ...s, banWithRounds: (s.banWithRounds || []).includes(id)
      ? s.banWithRounds.filter(x => x !== id) : [...(s.banWithRounds || []), id],
  }));
  const toggleType = (id) => setF(s => ({
    ...s, loanTypeIds: (s.loanTypeIds || []).includes(id)
      ? s.loanTypeIds.filter(x => x !== id) : [...(s.loanTypeIds || []), id],
  }));
  const setPeriod = (i, k, v) => setF(s => ({ ...s, periods: s.periods.map((p, j) => j === i ? { ...p, [k]: v } : p) }));
  const addPeriod = () => setF(s => ({ ...s, periods: [...s.periods, { id: lpjUid('PD'), start: '', end: '', rights: 1 }] }));
  const delPeriod = (i) => setF(s => ({ ...s, periods: s.periods.filter((p, j) => j !== i) }));
  // ทำซ้ำจากรอบปีก่อน — คัดลอกช่วงเวลาเลื่อนปี + สิทธิ์ + ประเภทเงินกู้
  const repeatFrom = (id) => {
    const src = (project.rounds || []).find(r => r.id === id);
    if (!src) return;
    const shift = (iso) => {
      if (!iso) return '';
      const d = new Date(iso); d.setFullYear(d.getFullYear() + (Number(f.year) - Number(src.year) || 1));
      return d.toISOString().slice(0, 10);
    };
    setF(s => ({
      ...s, copyFrom: id, maxRights: src.maxRights, noRepeat: !!src.noRepeat, loanTypeIds: [...(src.loanTypeIds || [])],
      periods: (src.periods || []).map(p => ({ id: lpjUid('PD'), start: shift(p.start), end: shift(p.end), rights: Number(p.rights) || Number(src.maxRights) || 1, maxPct: p.maxPct ?? '' })),
    }));
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!String(f.name).trim()) return setError('กรุณาระบุชื่อโครงการย่อย');
    if (!(f.loanTypeIds || []).length) return setError('กรุณาเลือกประเภทเงินกู้ที่ใช้ในโครงการย่อยนี้');
    const ps = f.periods.filter(p => p.start || p.end);
    if (!f.noPeriodLimit) {
      if (!ps.length) return setError('กรุณาระบุช่วงเวลาเริ่มต้น–สิ้นสุดอย่างน้อย 1 ช่วง');
      if (ps.some(p => !p.start)) return setError('ทุกช่วงเวลาต้องระบุวันที่เริ่มต้น');
      if (ps.some(p => p.end && p.end < p.start)) return setError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น');
      if (overlaps.length) return setError('ช่วงเวลาโครงการทับซ้อนกัน — กรุณาแก้ไขก่อนบันทึก');
      if (!f.noRepeat && ps.some(p => !(Number(p.rights) > 0)))
        return setError('กรุณาระบุจำนวนสิทธิ์การกู้สูงสุด/ราย ของทุกช่วงเวลา (มากกว่า 0 ครั้ง)');
    }
    if (f.noPeriodLimit && !f.noRepeat && !(Number(f.maxRights) > 0))
      return setError('กรุณาระบุสิทธิ์การกู้สูงสุด/ราย (มากกว่า 0 ครั้ง)');
    const usePs = f.noPeriodLimit ? [] : ps;
    const totalRights = f.noRepeat ? 1 : (f.noPeriodLimit ? Number(f.maxRights) || 0 : usePs.reduce((a, p) => a + (Number(p.rights) || 0), 0));
    onSubmit({
      round: {
        ...(isEdit ? editRec : { id: lpjUid('PJR'), enabled: false, memberUsed: {}, history: [] }),
        name: String(f.name).trim(), abbr: String(f.abbr || '').trim(), year: Number(f.year) || lpjThYear(lpjToday()),
        maxRights: totalRights, noRepeat: !!f.noRepeat, noPeriodLimit: !!f.noPeriodLimit,
        banWithRounds: (f.banWithRounds || []).slice(),
        loanTypeIds: (project.loanTypeIds || []).slice(),
        periods: usePs.map(p => ({ id: p.id || lpjUid('PD'), start: p.start, end: p.end || '', rights: f.noRepeat ? 1 : (Number(p.rights) || 0), maxPct: p.maxPct === '' || p.maxPct == null ? '' : Number(p.maxPct) })),
        note: String(f.note || '').trim(),
      },
      effective: lpjToday(),
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 780, maxWidth: '94vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขโครงการย่อย' : 'สร้างโครงการย่อย (รอบของโครงการ)'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{project.code} · {project.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit} style={{ overflow: 'auto' }}>
          {!isEdit && (project.rounds || []).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: '#fafafa', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <label className="lt-modal-label">ทำซ้ำจากรอบเดิม</label>
                <select className="filter-select" style={{ width: '100%' }} value={f.copyFrom || ''}
                        onChange={(e) => repeatFrom(e.target.value)}>
                  <option value="">— ไม่ทำซ้ำ (กรอกใหม่) —</option>
                  {project.rounds.map(r => <option key={r.id} value={r.id}>{r.name} (ปี {r.year})</option>)}
                </select>
              </div>
              <div className="muted" style={{ fontSize: 11, flex: '1 1 200px' }}>
                คัดลอกช่วงเวลา (เลื่อนปีให้อัตโนมัติ) · จำนวนสิทธิ์การกู้/ราย · ประเภทเงินกู้ที่ใช้
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="lt-modal-label">ชื่อโครงการย่อย <span className="cfg-required">*</span></label>
              <input className="cfg-input" style={{ width: '100%' }} value={f.name} autoFocus={!isEdit} placeholder="เช่น โครงการที่อยู่อาศัย ปี 2569" onChange={(e) => set('name', e.target.value)} />
            </div>
            <div style={{ flex: '0 0 104px' }}>
              <label className="lt-modal-label">ตัวย่อโครงการ</label>
              <input className="cfg-input" style={{ width: '100%' }} value={f.abbr || ''} placeholder="พศ68" onChange={(e) => set('abbr', e.target.value)} />
            </div>
            <div style={{ flex: '0 0 88px' }}>
              <label className="lt-modal-label">ปี (พ.ศ.)</label>
              <input className="cfg-input mono" style={{ width: '100%' }} value={f.year} onChange={(e) => set('year', e.target.value.replace(/[^0-9]/g, ''))} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={!!f.noPeriodLimit} onChange={(e) => set('noPeriodLimit', e.target.checked)}
                     style={{ width: 15, height: 15, marginTop: 2, accentColor: 'var(--brand-700, #237450)', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,.88)' }}>
                ไม่มีระยะเวลาโครงการ <span className="muted" style={{ fontSize: 11 }}>(เปิดรับคำขอตลอด — ไม่กำหนดช่วงเวลาเริ่มต้น–สิ้นสุด)</span>
              </span>
            </label>
            {f.noPeriodLimit ? (
              !f.noRepeat && (
                <div style={{ maxWidth: 260 }}>
                  <label className="lt-modal-label">สิทธิ์การกู้สูงสุด/ราย (ครั้ง)</label>
                  <input className="cfg-input mono" style={{ width: '100%', textAlign: 'right' }} value={f.maxRights ?? ''}
                         onChange={(e) => set('maxRights', e.target.value.replace(/[^0-9]/g, ''))} />
                </div>
              )
            ) : (
            <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="lt-modal-label" style={{ margin: 0 }}>ช่วงเวลาโครงการ <span className="cfg-required">*</span></label>
              <span className="muted" style={{ fontSize: 11 }}>เพิ่มได้มากกว่า 1 ช่วง · ระบุสิทธิ์การกู้สูงสุด/ราย ของแต่ละช่วง</span>
              <span className="spacer" style={{ flex: 1 }} />
              <button type="button" onClick={addPeriod}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px',
                               border: '1px solid var(--brand-700, #237450)', background: 'var(--brand-700, #237450)', borderRadius: 4,
                               fontFamily: 'inherit', fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                <Icon name="plus" size={13} /> เพิ่มช่วงเวลา
              </button>
            </div>
            <div style={{ marginTop: 8, border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ ...LPJ_TH, width: 62 }}>ช่วงที่</th>
                    <th style={{ ...LPJ_TH }}>วันที่เริ่มต้น</th>
                    <th style={{ ...LPJ_TH }}>วันที่สิ้นสุด</th>
                    <th style={{ ...LPJ_TH, width: 124, textAlign: 'right' }}>สิทธิ์ (ครั้ง/ราย)</th>
                    <th style={{ ...LPJ_TH, width: 140, textAlign: 'right' }}>วงเงินกู้สูงสุด (%)</th>
                    <th style={{ ...LPJ_TH, width: 48, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {f.periods.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: '1px solid #f0f0f0', background: overlapRows.has(i + 1) ? '#fff1f0' : undefined }}>
                      <td style={{ ...LPJ_TD, ...LPJ_MONO, color: 'rgba(0,0,0,.45)' }}>{i + 1}</td>
                      <td style={{ ...LPJ_TD }}>
                        <ErpDate value={p.start} onChange={(v) => setPeriod(i, 'start', v)} className="cfg-input" style={{ width: '100%' }} />
                      </td>
                      <td style={{ ...LPJ_TD }}>
                        <ErpDate value={p.end} onChange={(v) => setPeriod(i, 'end', v)} className="cfg-input" style={{ width: '100%' }} />
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'right' }}>
                        <input className="cfg-input mono" style={{ width: '100%', textAlign: 'right', background: f.noRepeat ? '#fafafa' : '#fff' }}
                               disabled={!!f.noRepeat} value={f.noRepeat ? 1 : (p.rights ?? '')}
                               onChange={(e) => setPeriod(i, 'rights', e.target.value.replace(/[^0-9]/g, ''))} />
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'right' }}>
                        <input className="cfg-input mono" style={{ width: '100%', textAlign: 'right' }} placeholder="0.00"
                               value={p.maxPct ?? ''}
                               onChange={(e) => {
                                 let v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                 if (Number(v) > 100) v = '100';
                                 setPeriod(i, 'maxPct', v);
                               }} />
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}>
                        <button className="act-del" type="button" disabled={f.periods.length <= 1}
                                onClick={() => delPeriod(i)} aria-label="ลบช่วงเวลา" title="ลบช่วงเวลา"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                         width: 28, height: 28, border: '1px solid #ffa39e', background: '#fff', borderRadius: 4,
                                         color: '#ff4d4f', cursor: f.periods.length <= 1 ? 'not-allowed' : 'pointer',
                                         opacity: f.periods.length <= 1 ? .45 : 1 }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {overlaps.length > 0 && (
              <div className="dep-error" style={{ marginTop: 8 }}>
                <Icon name="info" size={13} /> ช่วงเวลาทับซ้อนกัน: {overlaps.map(([a, b]) => 'ช่วงที่ ' + a + ' กับช่วงที่ ' + b).join(', ')} — กำหนดช่วงเวลาไม่ให้ซ้อนกันจึงจะบันทึกได้
              </div>
            )}
            </>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12 }}>
              <button type="button" role="switch" aria-checked={!!f.noRepeat} onClick={() => set('noRepeat', !f.noRepeat)}
                      style={{ flex: '0 0 auto', width: 44, height: 22, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer',
                               background: f.noRepeat ? 'var(--brand-700, #237450)' : '#d9d9d9', position: 'relative',
                               transition: 'background .15s ease' }}>
                <span style={{ position: 'absolute', top: 2, left: f.noRepeat ? 24 : 2, width: 18, height: 18, borderRadius: '50%',
                               background: '#fff', transition: 'left .15s ease', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
              </button>
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,.88)' }}>
                กู้ซ้ำไม่ได้
                <span className="muted" style={{ display: 'block', fontSize: 11 }}>
                  {f.noRepeat
                    ? 'เปิดอยู่ — ผู้กู้ 1 ราย เข้าร่วมโครงการย่อยนี้ได้เพียงครั้งเดียว'
                    : 'ปิดอยู่ — กรอกสิทธิ์ต่อรายได้ (กู้ได้เรื่อย ๆ จนกว่าจะเต็มวงเงิน)'}
                </span>
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="lt-modal-label">ห้ามกู้ซ้ำกับโครงการอื่น</label>
              <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>
                เลือกได้มากกว่า 1 รายการ — รวมโครงการย่อยของประเภทเงินกู้อื่น ถ้าสมาชิกเคยกู้โครงการที่เลือกจะกู้รอบนี้ไม่ได้
              </div>
              {banOpts.length === 0
                ? <div className="muted" style={{ fontSize: 12 }}>ยังไม่มีโครงการย่อยอื่นในระบบ</div>
                : <SearchSelect value="" onChange={(v) => v && toggleBan(v)}
                    options={banOpts.filter(o => !(f.banWithRounds || []).includes(o.value))}
                    placeholder="— ค้นหา / เพิ่มโครงการที่ห้ามกู้ซ้ำ —"
                    searchPlaceholder="พิมพ์ชื่อโครงการย่อย…" />}
              {(f.banWithRounds || []).length > 0 && (
                <div className="sem-dept-picker" style={{ marginTop: 8 }}>
                  {(f.banWithRounds || []).map(id => (
                    <span key={id} className="sem-dept-chip on">
                      {banLabel(id)}
                      <button type="button" className="sem-file-x" style={{ marginLeft: 2 }} onClick={() => toggleBan(id)} aria-label="นำออก">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label className="lt-modal-label">หมายเหตุ / อ้างอิงประกาศ</label>
            <input className="cfg-input" style={{ width: '100%' }} value={f.note || ''} placeholder="เช่น ตามประกาศที่ 4/2568" onChange={(e) => set('note', e.target.value)} />
          </div>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'สร้างโครงการย่อย'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้ารายละเอียดโครงการ — โครงการย่อย (รอบ) ทั้งหมด
// ════════════════════════════════════════════════════════════════════
function LpjDetail({ project, onBack, onSaveProject, onAddRound, onEditRound, onToggleRound, onProjectHistory, initialEdit }) {
  const [edit, setEdit] = useState(initialEdit
    ? { code: project.code, name: project.name, note: project.note || '', loanTypeIds: (project.loanTypeIds || []).slice() }
    : null);
  const [editErr, setEditErr] = useState('');
  const types = React.useMemo(() => window.lpjLoanTypes(), []);
  const startEdit = () => { setEditErr(''); setEdit({ code: project.code, name: project.name, note: project.note || '', loanTypeIds: (project.loanTypeIds || []).slice() }); };
  const pickType = (id) => {
    const t = types.find(x => x.id === id);
    setEdit(e => ({ ...e, loanTypeIds: id ? [id] : [], name: t ? t.name : '' }));
    setEditErr('');
  };
  const saveEdit = () => {
    if (!String(edit.code).trim()) return setEditErr('กรุณาระบุรหัสโครงการ');
    if (!(edit.loanTypeIds || []).length) return setEditErr('กรุณาเลือกประเภทเงินกู้ที่ใช้ในโครงการ');
    if (!String(edit.name || '').trim()) return setEditErr('กรุณาระบุชื่อโครงการ');
    onSaveProject({ ...project, code: String(edit.code).trim().toUpperCase(), name: String(edit.name).trim(),
                    note: String(edit.note || '').trim(), loanTypeIds: edit.loanTypeIds });
    setEdit(null);
  };
  const savedBadge = (() => {
    const last = (project.history || [])[0];
    if (!last || !last.ts) return null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(String(last.ts))) || null;
  })();
  const st = project.enabled
    ? { key: 'on', label: 'เปิดใช้งาน', pill: 'ok' }
    : { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
  return (
    <div data-screen-label="หน้ารายละเอียดโครงการเงินกู้">
      <div className="page-actions">
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        {!edit && savedBadge && <span className="saved-badge">{savedBadge}</span>}
        {!edit && <button className="btn sm" onClick={onProjectHistory}><Icon name="history" /> ประวัติ</button>}
        {!edit
          ? <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขโครงการ</button>
          : (
            <>
              <button className="btn sm" data-discard="1" onClick={() => { setEdit(null); setEditErr(''); }}>ละทิ้ง</button>
              <button className="btn primary sm" onClick={saveEdit}><Icon name="check" /> บันทึกโครงการ</button>
            </>
          )}
      </div>

      <div className="search-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div className="lt-head-ico"><Icon name="calendar" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {edit ? (
              <div style={{ display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                <div>
                  <label className="lt-modal-label">รหัสโครงการ <span className="cfg-required">*</span></label>
                  <input className="cfg-input mono" value={edit.code} disabled style={{ background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                </div>
                <div>
                  <label className="lt-modal-label">ประเภทเงินกู้ที่ใช้ <span className="cfg-required">*</span></label>
                  <select className="cfg-input" value={(edit.loanTypeIds || [])[0] || ''} onChange={(e) => pickType(e.target.value)}>
                    <option value="">เลือกประเภทเงินกู้</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.code} — {t.name}{t.enabled ? '' : ' (ปิดใช้งาน)'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="lt-modal-label">ชื่อโครงการ <span className="cfg-required">*</span></label>
                  <input className="cfg-input" value={edit.name} placeholder="ตามชื่อประเภทเงินกู้ที่เลือก — แก้ไขได้"
                         onChange={(e) => { const v = e.target.value; setEdit(s2 => ({ ...s2, name: v })); setEditErr(''); }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="lt-modal-label">หมายเหตุ</label>
                  <input className="cfg-input" style={{ width: '100%' }} value={edit.note} placeholder="รายละเอียดโครงการ (ไม่บังคับ)"
                         onChange={(e) => setEdit(s2 => ({ ...s2, note: e.target.value }))} />
                </div>
                {editErr && <div className="dep-error" style={{ gridColumn: '1 / -1' }}><Icon name="info" size={13} /> {editErr}</div>}
              </div>
            ) : (
              <>
                <h1 className="lt-head-title">
                  <span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{project.code}</span> · {project.name}
                </h1>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>หมายเหตุ: {project.note || '—'}</div>
              </>
            )}
          </div>
          {!edit && <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.label}</span>}
        </div>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>โครงการย่อย (ทำซ้ำได้ทุกปี)</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            แต่ละรอบเก็บประวัติการเปลี่ยนแปลงเงื่อนไขประเภทเงินกู้ ช่วงเวลา และจำนวนสิทธิ์ของตนเอง
          </div>
          </div>
          <button className="btn primary sm" style={{ flex: '0 0 auto', opacity: edit ? 1 : .5, cursor: edit ? 'pointer' : 'not-allowed' }}
                  disabled={!edit} title={edit ? '' : 'กด “แก้ไขโครงการ” ก่อนจึงจะสร้างโครงการย่อยได้'} onClick={onAddRound}>
            <Icon name="plus" size={13} /> สร้างโครงการย่อย
          </button>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...LPJ_TH, minWidth: 220 }}>ชื่อโครงการย่อย</th>
                  <th style={{ ...LPJ_TH, width: 110 }}>ตัวย่อโครงการ</th>
                  <th style={{ ...LPJ_TH, width: 70, textAlign: 'center' }}>ปี</th>
                  <th style={{ ...LPJ_TH, minWidth: 220 }}>ช่วงเวลาโครงการ</th>
                  <th style={{ ...LPJ_TH, minWidth: 200 }}>ประเภทเงินกู้ที่ใช้</th>
                  <th style={{ ...LPJ_TH, width: 150, textAlign: 'right' }}>สิทธิ์การกู้สูงสุด/ราย</th>
                  <th style={{ ...LPJ_TH, width: 108, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ ...LPJ_TH, width: 70, textAlign: 'center' }}>ใช้งาน</th>
                  <th style={{ ...LPJ_TH, width: 84, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {(project.rounds || []).map(r => {
                  const rs = r.enabled
                    ? { key: 'on', label: 'เปิดใช้งาน', pill: 'ok' }
                    : { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
                  return (
                    <tr key={r.id} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                      <td style={LPJ_TD}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{r.name}</span>
                        {r.note && <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>{r.note}</span>}
                      </td>
                      <td style={LPJ_TD}>{r.abbr || <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}</td>
                      <td style={{ ...LPJ_TD, ...LPJ_MONO, textAlign: 'center' }}>{r.year}</td>
                      <td style={LPJ_TD}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {(r.periods || []).map((p, i) => (
                            <span key={p.id || i} style={{ ...LPJ_MONO, color: 'rgba(0,0,0,.65)' }}>
                              {lpjPeriodText(p)}
                              {!r.noRepeat && p.rights ? <span style={{ color: 'rgba(0,0,0,.45)' }}> · {p.rights} ครั้ง/ราย</span> : null}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={LPJ_TD}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(r.loanTypeIds || []).map(id => <span key={id} className="chip">{window.lpjTypeLabel(id)}</span>)}
                        </div>
                      </td>
                      <td style={{ ...LPJ_TD, ...LPJ_MONO, textAlign: 'right' }}>
                        {r.noRepeat ? '1 ครั้ง' : r.maxRights + ' ครั้ง'}
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)' }}>
                          {r.noRepeat ? 'กู้ซ้ำไม่ได้ (ทุกช่วงรวมกัน)' : Number(r.maxRights) === 1 ? 'กู้ได้ครั้งเดียวต่อราย' : 'รวมทุกช่วง ต่อผู้กู้ 1 ราย'}
                        </span>
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}><span className={'pill ' + rs.pill}>{rs.label}</span></td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}>
                        <button type="button" role="switch" aria-checked={!!r.enabled}
                                aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                onClick={() => onToggleRound(r, !r.enabled)}
                                style={{ position: 'relative', width: 44, height: 22, border: 'none', borderRadius: 9999,
                                         cursor: 'pointer', padding: 0, transition: 'background .18s',
                                         background: r.enabled ? LPJ_G : 'rgba(0,0,0,.25)' }}>
                          <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18,
                                         borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                        </button>
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}>
                        <button type="button" onClick={() => onEditRound(r)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 9px',
                                         border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4,
                                         fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer' }}>
                          <Icon name="edit" size={13} /> แก้ไข
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {(project.rounds || []).length === 0 && (
                  <tr><td colSpan={9} style={{ ...LPJ_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>
                    ยังไม่มีโครงการย่อย — กด “สร้างโครงการย่อย” เพื่อเปิดรอบแรก
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> โครงการย่อยที่ “เปิดใช้งาน” และอยู่ในช่วงเวลาโครงการ จะแสดงเป็นตัวเลือก “โครงการเงินกู้” ในใบคำขอกู้เงิน ตามประเภทเงินกู้ที่เลือกไว้
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — รายการโครงการ ⇄ รายละเอียด
// ════════════════════════════════════════════════════════════════════
const LPJ_TABS = [
  { k: '', l: 'ทั้งหมด' },
  { k: 'open', l: 'กำลังดำเนินการ' },
  { k: 'wait', l: 'ยังไม่เริ่ม' },
  { k: 'done', l: 'สิ้นสุดแล้ว' },
  { k: 'off', l: 'ปิดใช้งาน' },
];

function LoanProjectConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.lpjLoad);
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState(null);         // { editRec }
  const [roundForm, setRoundForm] = useState(null); // { project, editRec }
  const [hist, setHist] = useState(null);         // { title, subtitle, entries }
  const [confirm, setConfirm] = useState(null);   // { kind, rec, round, next }
  const [done, setDone] = useState(null);
  const [detailEdit, setDetailEdit] = useState(false);
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(20);

  const MODULE = 'สินเชื่อ — ค่าคงที่โครงการเงินกู้';
  const persist = (next) => { setList(next); window.lpjSave(next); };
  const openRec = list.find(r => r.id === openId);
  window.useBreadcrumb && window.useBreadcrumb(
    window.crumb3 ? window.crumb3('โครงการเงินกู้', openRec ? 'view' : 'list', () => setOpenId(null)) : null,
    [openId]
  );

  // ── โครงการหลัก ──
  const submitProject = (rec) => {
    const exists = list.some(r => r.id === rec.id);
    if (exists) {
      const before = list.find(r => r.id === rec.id);
      const changes = [];
      if (before.name !== rec.name) changes.push({ field: 'ชื่อโครงการ', before: before.name, after: rec.name });
      if ((before.loanTypeIds || []).join() !== (rec.loanTypeIds || []).join())
        changes.push({ field: 'ประเภทเงินกู้ที่ใช้', before: (before.loanTypeIds || []).map(window.lpjTypeLabel).join(', ') || '—', after: (rec.loanTypeIds || []).map(window.lpjTypeLabel).join(', ') });
      const entry = { ts: lpjNow(), user: lpjUser(), action: 'update', effective: lpjToday(),
        summary: `แก้ไขโครงการ “${rec.name}”`, changes };
      persist(list.map(r => r.id === rec.id ? { ...rec, history: [entry, ...(rec.history || [])] } : r));
      audit.log({ action: 'update', module: MODULE, target: `${rec.code} · ${rec.name}`, summary: entry.summary, changes });
      setDone({ title: 'บันทึกการแก้ไขเรียบร้อยแล้ว', detail: rec.name });
    } else {
      const entry = { ts: lpjNow(), user: lpjUser(), action: 'create', effective: lpjToday(),
        summary: `สร้างโครงการ “${rec.name}”`,
        changes: [{ field: 'ประเภทเงินกู้ที่ใช้', before: '—', after: (rec.loanTypeIds || []).map(window.lpjTypeLabel).join(', ') }] };
      persist([{ ...rec, history: [entry] }, ...list]);
      audit.log({ action: 'create', module: MODULE, target: `${rec.code} · ${rec.name}`, summary: entry.summary });
      setDone({ title: 'สร้างโครงการเงินกู้เรียบร้อยแล้ว', detail: rec.name, gotoId: rec.id });
    }
    setForm(null);
  };

  const toggleProject = (rec, next) => {
    const entry = { ts: lpjNow(), user: lpjUser(), action: 'toggle', effective: lpjToday(),
      summary: (next ? 'เปิด' : 'ปิด') + `การใช้งานโครงการ “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: next ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: next ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }] };
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: next, history: [entry, ...(r.history || [])] } : r));
    audit.log({ action: 'update', module: MODULE, target: `${rec.code} · ${rec.name}`, summary: entry.summary });
    setConfirm(null);
    setDone({ title: (next ? 'เปิด' : 'ปิด') + 'การใช้งานเรียบร้อยแล้ว', detail: rec.name });
  };

  // ── โครงการย่อย ──
  const submitRound = ({ round, effective }) => {
    const project = roundForm.project;
    const isEdit = (project.rounds || []).some(r => r.id === round.id);
    const before = isEdit ? project.rounds.find(r => r.id === round.id) : null;
    const changes = [];
    if (before) {
      if (before.name !== round.name) changes.push({ field: 'ชื่อโครงการย่อย', before: before.name, after: round.name });
      if ((before.abbr || '') !== (round.abbr || '')) changes.push({ field: 'ตัวย่อ', before: before.abbr || '—', after: round.abbr || '—' });
      if (Number(before.maxRights) !== Number(round.maxRights))
        changes.push({ field: 'จำนวนสิทธิ์การกู้สูงสุด/ราย', before: before.maxRights + ' ครั้ง', after: round.maxRights + ' ครั้ง' });
      if (!!before.noRepeat !== !!round.noRepeat)
        changes.push({ field: 'กู้ซ้ำไม่ได้', before: before.noRepeat ? 'ใช่' : 'ไม่ใช่', after: round.noRepeat ? 'ใช่' : 'ไม่ใช่' });
      const pTxt = (r) => (r.periods || []).map(p => lpjPeriodText(p) + (r.noRepeat ? '' : ' (' + (p.rights || 0) + ' ครั้ง)')).join(' / ') || '—';
      if (pTxt(before) !== pTxt(round)) changes.push({ field: 'ช่วงเวลาโครงการ', before: pTxt(before), after: pTxt(round) });
      const tTxt = (r) => (r.loanTypeIds || []).map(window.lpjTypeLabel).join(', ') || '—';
      if (tTxt(before) !== tTxt(round)) changes.push({ field: 'เงื่อนไขประเภทเงินกู้', before: tTxt(before), after: tTxt(round) });
      if ((before.note || '') !== (round.note || '')) changes.push({ field: 'หมายเหตุ', before: before.note || '—', after: round.note || '—' });
    } else {
      changes.push({ field: 'ช่วงเวลาโครงการ', before: '—', after: (round.periods || []).map(lpjPeriodText).join(' / ') });
      changes.push({ field: 'จำนวนสิทธิ์การกู้สูงสุด/ราย', before: '—', after: round.maxRights + ' ครั้ง' });
      changes.push({ field: 'เงื่อนไขประเภทเงินกู้', before: '—', after: (round.loanTypeIds || []).map(window.lpjTypeLabel).join(', ') });
    }
    const entry = { ts: lpjNow(), user: lpjUser(), action: isEdit ? 'update' : 'create', effective,
      summary: isEdit
        ? `แก้ไขเงื่อนไขโครงการย่อย “${round.name}”` + (changes.length ? ` (${changes.length} รายการ)` : ' (ไม่มีการเปลี่ยนแปลง)')
        : `สร้างโครงการย่อย “${round.name}”`,
      changes };
    const nextRound = { ...round, history: [entry, ...(round.history || [])] };
    const rounds = isEdit
      ? project.rounds.map(r => r.id === round.id ? nextRound : r)
      : [nextRound, ...(project.rounds || [])];
    persist(list.map(p => p.id === project.id ? { ...p, rounds } : p));
    audit.log({ action: isEdit ? 'update' : 'create', module: MODULE,
      target: `${project.code} · ${round.name}`, summary: entry.summary, changes });
    setRoundForm(null);
    setDone({ title: isEdit ? 'บันทึกการแก้ไขเรียบร้อยแล้ว' : 'สร้างโครงการย่อยเรียบร้อยแล้ว', detail: round.name });
  };

  const toggleRound = (project, round, next) => {
    const entry = { ts: lpjNow(), user: lpjUser(), action: 'toggle', effective: lpjToday(),
      summary: (next ? 'เปิด' : 'ปิด') + `การใช้งานโครงการย่อย “${round.name}”`,
      changes: [{ field: 'การใช้งาน', before: next ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: next ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }] };
    persist(list.map(p => p.id === project.id
      ? { ...p, rounds: p.rounds.map(r => r.id === round.id ? { ...r, enabled: next, history: [entry, ...(r.history || [])] } : r) }
      : p));
    audit.log({ action: 'update', module: MODULE, target: `${project.code} · ${round.name}`, summary: entry.summary });
    setConfirm(null);
    setDone({ title: (next ? 'เปิด' : 'ปิด') + 'การใช้งานเรียบร้อยแล้ว', detail: round.name });
  };

  // ── รายละเอียด ──
  if (openRec) {
    return (
      <>
        <LpjDetail key={openRec.id + (detailEdit ? '-edit' : '')} project={openRec} initialEdit={detailEdit}
          onBack={() => { setDetailEdit(false); setOpenId(null); }}
          onSaveProject={submitProject}
          onAddRound={() => setRoundForm({ project: openRec })}
          onEditRound={(r) => setRoundForm({ project: openRec, editRec: r })}
          onToggleRound={(r, next) => setConfirm({ kind: 'round', rec: openRec, round: r, next })}
          onProjectHistory={() => setHist({
            title: 'ประวัติ', subtitle: openRec.code + ' · ' + openRec.name,
            entries: [
              ...(openRec.history || []),
              ...(openRec.rounds || []).flatMap(r => (r.history || []).map(h => ({ ...h, summary: h.summary }))),
            ].slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts))),
          })} />
        {form && <LpjProjectModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={submitProject} />}
        {roundForm && <LpjRoundModal project={roundForm.project} editRec={roundForm.editRec}
                                     onClose={() => setRoundForm(null)} onSubmit={submitRound} />}
        {hist && <LpjHistoryModal {...hist} onClose={() => setHist(null)} />}
        {confirm && window.ToggleConfirmModal && (
          <window.ToggleConfirmModal next={confirm.next}
            title={(confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานโครงการย่อย'}
            subtitle={confirm.round.name + ' · ปี ' + confirm.round.year}
            detail={confirm.next
              ? `โครงการย่อยนี้จะแสดงเป็นตัวเลือกในใบคำขอกู้เงิน ภายในช่วงเวลาโครงการ และรับคำขอได้ไม่เกิน ${confirm.round.maxRights} ราย`
              : 'โครงการย่อยนี้จะไม่แสดงเป็นตัวเลือกในใบคำขอกู้เงิน — คำขอที่บันทึกไว้แล้วยังคงอยู่'}
            onCancel={() => setConfirm(null)}
            onConfirm={() => toggleRound(confirm.rec, confirm.round, confirm.next)} />
        )}
        {done && window.StatusModal && (
          <window.StatusModal variant="success" title={done.title} detail={done.detail} onClose={() => { const g = done.gotoId; setDone(null); if (g) { setDetailEdit(true); setOpenId(g); } }} />
        )}
      </>
    );
  }

  // ── รายการ ──
  const term = applied.trim().toLowerCase();
  const match = (r) => {
    if (!term) return true;
    const types = (r.loanTypeIds || []).map(window.lpjTypeLabel).join(' ');
    const rounds = (r.rounds || []).map(x => x.name + ' ' + x.year).join(' ');
    return [r.code, r.name, r.note, types, rounds].some(v => String(v ?? '').toLowerCase().includes(term));
  };
  const inTab = (r, k) => !k || window.lpjProjectStatus(r).key === k;
  const matched = list.filter(r => match(r) && inTab(r, tab));
  const total = matched.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const cur = Math.min(page, pages);
  const start = (cur - 1) * per;
  const shown = matched.slice(start, start + per);
  const tabCount = (k) => list.filter(r => match(r) && inTab(r, k)).length;

  const segBtn = (k, label) => {
    const on = tab === k;
    return (
      <button key={k || 'all'} type="button" onClick={() => { setTab(k); setPage(1); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 2px',
                       border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13,
                       cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid ' + (on ? LPJ_G : 'transparent'),
                       color: on ? LPJ_G : 'rgba(0,0,0,.65)', fontWeight: on ? 600 : 400,
                       transition: 'color .15s, border-color .15s' }}>
        {label}
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 18,
                       padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                       background: on ? LPJ_SOFT : '#f5f5f5', color: on ? LPJ_G : 'rgba(0,0,0,.45)' }}>{tabCount(k)}</span>
      </button>
    );
  };
  const pageBtn = (n, label, disabled, active) => (
    <button key={label} type="button" disabled={disabled} onClick={() => !disabled && setPage(n)}
            aria-current={active ? 'page' : undefined}
            style={{ minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
                     cursor: disabled ? 'default' : 'pointer',
                     border: '1px solid ' + (active ? LPJ_G : '#d9d9d9'),
                     background: active ? LPJ_G : '#fff',
                     color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)') }}>{label}</button>
  );

  return (
    <div data-screen-label="หน้าค่าคงที่โครงการเงินกู้">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>โครงการเงินกู้</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            สร้างโครงการและโครงการย่อยที่ทำซ้ำได้ทุกปี — กำหนดช่วงเวลาเริ่มต้น–สิ้นสุดได้มากกว่า 1 ช่วง,
            จำนวนสิทธิ์การกู้สูงสุดต่อราย และเลือกประเภทเงินกู้ที่โครงการใช้ พร้อมเก็บประวัติการเปลี่ยนแปลงเงื่อนไขของทุกรอบ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setForm({})}><Icon name="plus" /> สร้างโครงการ</button>
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff',
                          border: '1px solid #d9d9d9', borderRadius: 2, minWidth: 300, flex: '0 1 340px' }}>
            <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}><Icon name="search" size={14} /></span>
            <input value={q} placeholder="ค้นหารหัสโครงการ, ชื่อโครงการ, โครงการย่อย, ประเภทเงินกู้..."
                   onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { setApplied(q); setPage(1); } }}
                   style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit',
                            fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' }} />
          </label>
          <button type="button" style={lpjBtn(true)} onClick={() => { setApplied(q); setPage(1); }}>ค้นหา</button>
          <button type="button" style={lpjBtn(false)} onClick={() => { setQ(''); setApplied(''); setTab(''); setPage(1); }}>รีเซ็ต</button>
        </div>

        <div style={{ padding: '4px 16px 0', borderTop: '1px solid ' + LPJ_LINE }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 1080, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ ...LPJ_TH, width: 110 }}>รหัสโครงการ</th>
                  <th style={{ ...LPJ_TH, minWidth: 250 }}>ชื่อโครงการ</th>
                  <th style={{ ...LPJ_TH, minWidth: 190 }}>ประเภทเงินกู้ที่ใช้</th>
                  <th style={{ ...LPJ_TH, minWidth: 210 }}>รอบล่าสุด / ช่วงเวลา</th>
                  <th style={{ ...LPJ_TH, width: 140, textAlign: 'right' }}>สิทธิ์การกู้สูงสุด/ราย</th>
                  <th style={{ ...LPJ_TH, width: 116, textAlign: 'center' }}>สถานะ</th>
                  <th style={{ ...LPJ_TH, width: 70, textAlign: 'center' }}>ใช้งาน</th>
                  <th style={{ ...LPJ_TH, width: 76, textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const st = r.enabled
                    ? { key: 'on', label: 'เปิดใช้งาน', pill: 'ok' }
                    : { key: 'off', label: 'ปิดใช้งาน', pill: 'neutral' };
                  const rounds = r.rounds || [];
                  const latest = rounds[0];
                  const latestPeriod = latest && (latest.periods || []).slice().sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')))[0];
                  return (
                    <tr key={r.id} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                      <td style={{ ...LPJ_TD, ...LPJ_MONO, color: 'rgba(0,0,0,.65)' }}>{r.code}</td>
                      <td style={LPJ_TD}>
                        <span style={{ display: 'block', fontWeight: 600 }}>{r.name}</span>
                        <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>
                          โครงการย่อย {rounds.length} รอบ{r.note ? ' · ' + r.note : ''}
                        </span>
                      </td>
                      <td style={LPJ_TD}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {(r.loanTypeIds || []).length
                            ? r.loanTypeIds.map(id => <span key={id} className="chip">{window.lpjTypeLabel(id)}</span>)
                            : <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}
                        </div>
                      </td>
                      <td style={LPJ_TD}>
                        {latest ? (
                          <>
                            <span style={{ display: 'block' }}>{latest.name}</span>
                            <span style={{ display: 'block', ...LPJ_MONO, color: 'rgba(0,0,0,.45)', marginTop: 3 }}>
                              {latestPeriod ? lpjPeriodText(latestPeriod) : (latest.noPeriodLimit ? 'ไม่มีระยะเวลาโครงการ' : '—')}
                            </span>
                          </>
                        ) : <span style={{ color: 'rgba(0,0,0,.35)' }}>ยังไม่มีโครงการย่อย</span>}
                      </td>
                      <td style={{ ...LPJ_TD, ...LPJ_MONO, textAlign: 'right' }}>{latest ? latest.maxRights + ' ครั้ง' : <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}</td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}><span className={'pill ' + st.pill}>{st.label}</span></td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}>
                        <button type="button" role="switch" aria-checked={!!r.enabled}
                                aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                                onClick={() => setConfirm({ kind: 'project', rec: r, next: !r.enabled })}
                                style={{ position: 'relative', width: 44, height: 22, border: 'none', borderRadius: 9999,
                                         cursor: 'pointer', padding: 0, transition: 'background .18s',
                                         background: r.enabled ? LPJ_G : 'rgba(0,0,0,.25)' }}>
                          <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18,
                                         borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                        </button>
                      </td>
                      <td style={{ ...LPJ_TD, textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button type="button" onClick={() => setOpenId(r.id)} title="ดูรายละเอียดโครงการ"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px',
                                           border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4,
                                           fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer' }}>
                            <Icon name="eye" size={14} /> ดู
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {total === 0 && (
                  <tr><td colSpan={9} style={{ ...LPJ_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 0', borderTop: '1px solid ' + LPJ_LINE, display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
              {total === 0 ? '0 รายการ' : (start + 1) + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pageBtn(cur - 1, '‹', cur <= 1, false)}
              {Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, cur === i + 1))}
              {pageBtn(cur + 1, '›', cur >= pages, false)}
              <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }} aria-label="จำนวนต่อหน้า"
                      style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                               fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> โครงการผูกกับค่าคงที่ › ประเภทเงินกู้ — ใบคำขอกู้เงินจะแสดงเฉพาะโครงการที่เปิดใช้งาน อยู่ในช่วงเวลา และผู้กู้ยังใช้สิทธิ์ไม่ครบตามจำนวนครั้ง/ราย
      </div>

      {form && <LpjProjectModal list={list} editRec={form.editRec} onClose={() => setForm(null)} onSubmit={submitProject} />}
      {hist && <LpjHistoryModal {...hist} onClose={() => setHist(null)} />}
      {confirm && window.ToggleConfirmModal && (() => {
        // ข-01 ข้อ 4 — ห้ามเปิดโครงการที่ประเภทเงินกู้ถูกปิดอยู่
        const ids = [...new Set([...(confirm.rec.loanTypeIds || []), ...(confirm.rec.rounds || []).flatMap(x => x.loanTypeIds || [])])];
        const off = confirm.next ? window.lpjLoanTypes().filter(t => ids.includes(t.id) && !t.enabled) : [];
        return off.length ? (
          <window.ToggleConfirmModal blocked next={false} title="เปิดการใช้งานโครงการเงินกู้"
            subtitle={confirm.rec.code + ' · ' + confirm.rec.name}
            detail={`เปิดใช้งานไม่ได้ — ประเภทเงินกู้ ${off.map(t => t.code + ' — ' + t.name).join(' · ')} ปิดใช้งานอยู่ กรุณาเปิดใช้งานประเภทเงินกู้ก่อน`}
            onCancel={() => setConfirm(null)} onConfirm={() => setConfirm(null)} />
        ) : (
        <window.ToggleConfirmModal next={confirm.next}
          title={(confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานโครงการเงินกู้'}
          subtitle={confirm.rec.code + ' · ' + confirm.rec.name}
          detail={confirm.next
            ? 'โครงการนี้และโครงการย่อยที่เปิดใช้งานจะแสดงเป็นตัวเลือกในใบคำขอกู้เงิน'
            : 'โครงการนี้จะไม่แสดงเป็นตัวเลือกในใบคำขอกู้เงินทุกรอบ — คำขอที่บันทึกไว้แล้วยังคงอยู่'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => toggleProject(confirm.rec, confirm.next)} />
        );
      })()}
      {done && window.StatusModal && (
        <window.StatusModal variant="success" title={done.title} detail={done.detail} onClose={() => { const g = done.gotoId; setDone(null); if (g) { setDetailEdit(true); setOpenId(g); } }} />
      )}
    </div>
  );
}

Object.assign(window, { LoanProjectConfigPage, LpjHistoryModal });
