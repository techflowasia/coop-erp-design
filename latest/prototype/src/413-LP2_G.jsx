// ═════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ › ค่าคงที่ — วัตถุประสงค์การกู้ (แบบใหม่)
//  duplicate layout จาก artifact: หัวข้อ + แถบค้นหา/ตัวกรอง + ตาราง + แบ่งหน้า
//  ใช้สไตล์/โทเคนของระบบนี้ (สอ.กสท. green #237450, Sarabun)
// ═════════════════════════════════════════════════════════════════
const { useState: lp2State, useMemo: lp2Memo } = React;

const LP2_G = '#237450';
const LP2_SOFT = '#eafef2';
const LP2_LINE = '#f0f0f0';
const LP2_MODULE = 'สินเชื่อ — ค่าคงที่วัตถุประสงค์การกู้ (แบบใหม่)';
const LP2_KEY = 'loan_purpose_const_v2';

const lp2Load = () => {
  try { const s = localStorage.getItem(LP2_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return JSON.parse(JSON.stringify(window.lpuLoad ? window.lpuLoad() : []));
};
const lp2Save = (l) => { try { localStorage.setItem(LP2_KEY, JSON.stringify(l)); } catch (e) {} };

const LP2_TH = { textAlign: 'left', fontWeight: 600, fontSize: 12, padding: '9px 12px', borderBottom: '1px solid ' + LP2_LINE };
const LP2_TD = { padding: '10px 12px', borderBottom: '1px solid ' + LP2_LINE, verticalAlign: 'top' };
const lp2Btn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, height: 32, padding: '0 14px',
  border: '1px solid ' + (primary ? LP2_G : '#d9d9d9'), background: primary ? LP2_G : '#fff',
  borderRadius: 4, fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
  color: primary ? '#fff' : 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
});
const Lp2Ico = ({ d, s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d={d} /></svg>
);
const LP2_SEARCH = 'M11.5 11.5l3 3M7 13a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z';
const LP2_PLUS = 'M8 3v10M3 8h10';
const LP2_EDIT = 'm3 13 1-3 7-7 2 2-7 7-3 1Z';
const LP2_INFO = 'M8 7v4M8 5v.5M2.5 8a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z';

// ─── modal เพิ่ม/แก้ไข ─────────────────────────────────────────────
function Lp2Form({ rec, list, onClose, onSave }) {
  const isEdit = !!rec;
  const [f, setF] = lp2State(() => rec
    ? { ...rec, details: (rec.details || []).slice() }
    : { code: '', name: '', note: '', taxCert: false, certNote: '', details: [], enabled: true });
  const [detail, setDetail] = lp2State('');
  const [err, setErr] = lp2State('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = () => {
    if (!f.code.trim()) return setErr('กรุณาระบุรหัสวัตถุประสงค์');
    if (!f.name.trim()) return setErr('กรุณาระบุชื่อวัตถุประสงค์การกู้');
    if (list.some(r => r.code === f.code.trim() && (!isEdit || r.id !== rec.id)))
      return setErr('รหัสวัตถุประสงค์นี้ถูกใช้แล้ว');
    if (f.taxCert && (f.details || []).length === 0)
      return setErr('วัตถุประสงค์ที่ออกหนังสือรับรองดอกเบี้ยได้ ต้องระบุรายละเอียดอย่างน้อย 1 รายการ');
    onSave({ ...f, code: f.code.trim(), name: f.name.trim() });
  };

  const lp2When = (v) => {
    if (!v) return '—';
    if (/^\d{2}\/\d{2}\/\d{4}/.test(String(v))) return v;
    const d = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!d) return String(v);
    const y = Number(d[1]);
    return d[3] + '/' + d[2] + '/' + (y > 2400 ? y : y + 543) + (d[4] ? ' ' + d[4] + ':' + d[5] + ' น.' : '');
  };

  const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,.65)', marginBottom: 5 };
  const inp = { width: '100%', height: 32, padding: '0 10px', border: '1px solid #d9d9d9', borderRadius: 2,
                fontFamily: 'inherit', fontSize: 13, color: 'rgba(0,0,0,.88)', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 900,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 16px', overflowY: 'auto' }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ width: 640, maxWidth: '100%', background: '#fff', borderRadius: 8,
                    boxShadow: '0 6px 24px rgba(0,0,0,.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid ' + LP2_LINE }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34,
                         borderRadius: 9999, background: LP2_SOFT, color: LP2_G }}>
            <Lp2Ico d={isEdit ? LP2_EDIT : LP2_PLUS} s={16} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>
              {isEdit ? 'แก้ไขวัตถุประสงค์การกู้' : 'เพิ่มวัตถุประสงค์การกู้'}
            </h2>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>
              {isEdit ? rec.code + ' · ' + rec.name : 'ใช้เป็นตัวเลือกวัตถุประสงค์ในใบคำขอกู้เงิน'}
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                          border: '1px solid #1677ff', borderRadius: 4, background: '#e6f4ff',
                          fontSize: 12.5, color: 'rgba(0,0,0,.65)', lineHeight: 1.5 }}>
              <Lp2Ico d={LP2_INFO} s={13} />
              <span>
                แก้ไขล่าสุดโดย <b>{rec.updatedBy || (rec.createdBy && !/^ระบบ/.test(rec.createdBy) ? rec.createdBy : 'มนตรี ศรีสุข')}</b>{' '}
                เมื่อ <b>{lp2When(rec.updatedAt || rec.createdDate)}</b>
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>รหัส <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input style={{ ...inp, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', ...(isEdit ? { background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' } : {}) }}
                     disabled={isEdit} value={f.code} placeholder="09" onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>ชื่อวัตถุประสงค์การกู้ <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input style={inp} value={f.name} placeholder="เช่น เพื่อที่อยู่อาศัย"
                     onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={lbl}>คำอธิบายเพิ่มเติม</label>
            <input style={inp} value={f.note || ''} placeholder="แสดงใต้ชื่อวัตถุประสงค์ในตาราง"
                   onChange={(e) => set('note', e.target.value)} />
          </div>

          <div style={{ background: '#fafafa', border: '1px solid ' + LP2_LINE, borderRadius: 8, padding: 14, display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <button type="button" role="switch" aria-checked={!!f.taxCert}
                      onClick={() => set('taxCert', !f.taxCert)}
                      style={{ position: 'relative', width: 44, height: 22, flexShrink: 0, border: 'none',
                               borderRadius: 9999, cursor: 'pointer', padding: 0, transition: 'background .18s',
                               background: f.taxCert ? LP2_G : 'rgba(0,0,0,.25)' }}>
                <span style={{ position: 'absolute', top: 2, left: f.taxCert ? 24 : 2, width: 18, height: 18,
                               borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
              </button>
              <span style={{ fontSize: 13, color: 'rgba(0,0,0,.88)', fontWeight: 600 }}>ออกหนังสือรับรองดอกเบี้ย (ลดหย่อนภาษี) ได้</span>
            </label>

            {f.taxCert && (
              <>
                <div>
                  <label style={lbl}>อ้างอิงประกาศ</label>
                  <input style={inp} value={f.certNote || ''} placeholder="ประกาศอธิบดีกรมสรรพากร ฯ (ฉบับที่ 165)"
                         onChange={(e) => set('certNote', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>รายละเอียดวัตถุประสงค์ <span style={{ color: '#ff4d4f' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={inp} value={detail} placeholder="เช่น ซื้ออาคารพร้อมที่ดิน"
                           onChange={(e) => setDetail(e.target.value)}
                           onKeyDown={(e) => { if (e.key === 'Enter' && detail.trim()) { set('details', [...(f.details || []), detail.trim()]); setDetail(''); } }} />
                    <button type="button" style={lp2Btn(false)}
                            onClick={() => { if (detail.trim()) { set('details', [...(f.details || []), detail.trim()]); setDetail(''); } }}>
                      <Lp2Ico d={LP2_PLUS} /> เพิ่ม
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {(f.details || []).map((d, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 6px 0 9px',
                                             borderRadius: 9999, background: '#f5f5f5', border: '1px solid ' + LP2_LINE,
                                             color: 'rgba(0,0,0,.65)', fontSize: 11 }}>
                        {d}
                        <button type="button" aria-label="นำออก"
                                onClick={() => set('details', f.details.filter((_, j) => j !== i))}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,.35)',
                                         fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                    {(f.details || []).length === 0 && (
                      <span style={{ fontSize: 11, color: 'rgba(0,0,0,.35)' }}>ยังไม่มีรายละเอียด</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {err && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff2f0', border: '1px solid #ffccc7',
                          borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#cf1322' }}>
              <Lp2Ico d={LP2_INFO} s={13} /> {err}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 20px', borderTop: '1px solid ' + LP2_LINE, background: '#fafafa' }}>
          <button type="button" style={lp2Btn(false)} onClick={onClose}>ยกเลิก</button>
          <button type="button" style={lp2Btn(true)} onClick={submit}>
            {isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มวัตถุประสงค์'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── modal สำเร็จ (ลอกสไตล์ artifact) ─────────────────────────────
function Lp2Success({ title, detail, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 920,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
         onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
           style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 12, padding: '36px 32px 32px',
                    boxShadow: '0 6px 24px rgba(0,0,0,.18)', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72,
                       borderRadius: 9999, background: LP2_SOFT, color: LP2_G, marginBottom: 20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
               strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5.5 5.5L20 7" /></svg>
        </span>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,.88)', lineHeight: 1.35 }}>{title}</h2>
        <p style={{ margin: '12px auto 0', maxWidth: 380, fontSize: 13, color: 'rgba(0,0,0,.55)',
                    lineHeight: 1.65, textWrap: 'pretty' }}>{detail}</p>
        <button type="button" onClick={onClose}
                style={{ ...lp2Btn(true), height: 38, padding: '0 26px', marginTop: 24, justifyContent: 'center' }}>
          เสร็จสิ้น
        </button>
      </div>
    </div>
  );
}

// ─── หน้าจอหลัก ────────────────────────────────────────────────────
function LoanPurposeConstPageV2({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'วัตถุประสงค์การกู้', current: true }], []);

  const [list, setList] = lp2State(lp2Load);
  const [q, setQ] = lp2State('');
  const [applied, setApplied] = lp2State('');
  const [only, setOnly] = lp2State('all');
  const [page, setPage] = lp2State(1);
  const [per, setPer] = lp2State(20);
  const [form, setForm] = lp2State(null);          // { rec } | { rec: null }
  const [confirm, setConfirm] = lp2State(null);    // { rec, next }
  const [done, setDone] = lp2State(null);          // { title, detail }

  const persist = (next) => { setList(next); lp2Save(next); };

  const rows = lp2Memo(() => {
    const t = applied.trim().toLowerCase();
    return list.filter(r => {
      if (only === 'cert' && !r.taxCert) return false;
      if (only === 'nocert' && r.taxCert) return false;
      if (!t) return true;
      return [r.code, r.name, r.note, r.certNote, ...(r.details || [])]
        .filter(Boolean).some(s => String(s).toLowerCase().includes(t));
    });
  }, [list, applied, only]);

  const total = rows.length;
  const start = (page - 1) * per;
  const pageRows = rows.slice(start, start + per);
  const pages = Math.max(1, Math.ceil(total / per));

  const certCount = list.filter(r => r.taxCert).length;

  const doSave = (d) => {
    const isEdit = !!(form && form.rec);
    const nowStamp = (() => {
      const p = (n) => String(n).padStart(2, '0');
      const t = new Date();
      return t.getFullYear() + '-' + p(t.getMonth() + 1) + '-' + p(t.getDate()) + ' ' + p(t.getHours()) + ':' + p(t.getMinutes());
    })();
    const who = window.LC_USER || 'มนตรี ศรีสุข';
    if (isEdit) {
      persist(list.map(r => r.id === form.rec.id ? { ...r, ...d, updatedBy: who, updatedAt: nowStamp } : r));
      audit.log({ action: 'update', module: LP2_MODULE, target: d.code + ' · ' + d.name,
        summary: 'แก้ไขวัตถุประสงค์การกู้ “' + d.name + '”' });
      setDone({ title: 'บันทึกการแก้ไขเรียบร้อยแล้ว',
        detail: 'วัตถุประสงค์ “' + d.name + '” ถูกแก้ไขเรียบร้อยแล้ว' });
    } else {
      const rec = { ...d, id: 'LPU-N' + Date.now(), v: 'p' + d.code, updatedBy: who, updatedAt: nowStamp };
      persist([...list, rec]);
      audit.log({ action: 'create', module: LP2_MODULE, target: d.code + ' · ' + d.name,
        summary: 'เพิ่มวัตถุประสงค์การกู้ “' + d.name + '”' });
      setDone({ title: 'เพิ่มวัตถุประสงค์การกู้เรียบร้อยแล้ว',
        detail: 'วัตถุประสงค์ “' + d.name + '” ถูกเพิ่มเข้าระบบเรียบร้อยแล้ว' });
    }
    setForm(null);
  };

  const applyToggle = () => {
    const { rec, next } = confirm;
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: next } : r));
    audit.log({ action: 'update', module: LP2_MODULE, target: rec.code + ' · ' + rec.name,
      summary: (next ? 'เปิด' : 'ปิด') + 'การใช้งานวัตถุประสงค์ “' + rec.name + '”' });
    setDone({ title: (next ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + 'เรียบร้อยแล้ว',
      detail: 'วัตถุประสงค์ “' + rec.name + '” ถูก' + (next ? 'เปิด' : 'ปิด') +
              'ใช้งานเรียบร้อยแล้ว' });
    setConfirm(null);
  };

  const segBtn = (key, label, count) => {
    const on = only === key;
    return (
      <button key={key} type="button" onClick={() => { setOnly(key); setPage(1); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 40, padding: '0 2px',
                       border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13,
                       cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '2px solid ' + (on ? LP2_G : 'transparent'),
                       color: on ? LP2_G : 'rgba(0,0,0,.65)', fontWeight: on ? 600 : 400,
                       transition: 'color .15s, border-color .15s' }}>
        {label}
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 20, height: 18,
                       padding: '0 6px', borderRadius: 9999, fontSize: 11, fontWeight: 600,
                       background: on ? LP2_SOFT : '#f5f5f5', color: on ? LP2_G : 'rgba(0,0,0,.45)' }}>{count}</span>
      </button>
    );
  };

  const pageBtn = (n, label, disabled, active) => (
    <button key={label} type="button" disabled={disabled} onClick={() => !disabled && setPage(n)}
            aria-current={active ? 'page' : undefined}
            style={{ minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
                     cursor: disabled ? 'default' : 'pointer',
                     border: '1px solid ' + (active ? LP2_G : '#d9d9d9'),
                     background: active ? LP2_G : '#fff',
                     color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)') }}>{label}</button>
  );

  return (
    <div data-screen-label="ค่าคงที่วัตถุประสงค์การกู้ (แบบใหม่)">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginTop: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.3, color: 'rgba(0,0,0,.88)' }}>ค่าคงที่วัตถุประสงค์การกู้</h1>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(0,0,0,.45)', lineHeight: 1.55, maxWidth: 760, textWrap: 'pretty' }}>
            กำหนดวัตถุประสงค์การกู้ที่ใช้ในใบคำขอกู้เงิน และระบุวัตถุประสงค์ที่สามารถออกหนังสือรับรองดอกเบี้ยได้
          </p>
        </div>
        <button type="button" style={lp2Btn(true)} onClick={() => setForm({ rec: null })}>
          <Lp2Ico d={LP2_PLUS} s={15} /> เพิ่มวัตถุประสงค์
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12,
                    boxShadow: '0 1px 2px rgba(0,0,0,.03)', overflow: 'hidden', marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '14px 16px 12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', background: '#fff',
                        border: '1px solid #d9d9d9', borderRadius: 2, minWidth: 300, flex: '0 1 340px' }}>
          <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.35)' }}><Lp2Ico d={LP2_SEARCH} /></span>
          <input placeholder="ค้นหารหัส, ชื่อวัตถุประสงค์, รายละเอียด..." value={q}
                 onChange={(e) => setQ(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') { setApplied(q); setPage(1); } }}
                 style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', fontFamily: 'inherit',
                          fontSize: 13, color: 'rgba(0,0,0,.88)', background: 'transparent' }} />
        </label>
        <button type="button" style={lp2Btn(true)} onClick={() => { setApplied(q); setPage(1); }}>
          ค้นหา
        </button>
        <button type="button" style={lp2Btn(false)}
                onClick={() => { setQ(''); setApplied(''); setOnly('all'); setPage(1); }}>
          รีเซ็ต
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '0 16px',
                    borderBottom: '1px solid ' + LP2_LINE }}>
        {segBtn('all', 'ทั้งหมด', list.length)}
        {segBtn('cert', 'ออกหนังสือรับรองได้', certCount)}
        {segBtn('nocert', 'ไม่ออกหนังสือรับรอง', list.length - certCount)}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1020, borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#fafafa', color: 'rgba(0,0,0,.65)' }}>
                <th style={{ ...LP2_TH, width: 64 }}>รหัส</th>
                <th style={{ ...LP2_TH, minWidth: 210 }}>วัตถุประสงค์การกู้</th>
                <th style={{ ...LP2_TH, width: 150, textAlign: 'center' }}>หนังสือรับรองดอกเบี้ย</th>
                <th style={{ ...LP2_TH, minWidth: 320 }}>รายละเอียดวัตถุประสงค์</th>
                <th style={{ ...LP2_TH, width: 112, textAlign: 'center' }}>สถานะ</th>
                <th style={{ ...LP2_TH, width: 60, textAlign: 'center' }}>ใช้งาน</th>
                <th style={{ ...LP2_TH, width: 80, textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(r => (
                <tr key={r.id} style={r.enabled ? undefined : { background: '#fafafa', opacity: .72 }}>
                  <td style={{ ...LP2_TD, fontFamily: '"IBM Plex Mono", ui-monospace, monospace', fontSize: 12, color: 'rgba(0,0,0,.65)' }}>{r.code}</td>
                  <td style={LP2_TD}>
                    <span style={{ display: 'block', fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>{r.name}</span>
                    {r.note && <span style={{ display: 'block', fontSize: 11, color: 'rgba(0,0,0,.45)', marginTop: 3, lineHeight: 1.5 }}>{r.note}</span>}
                  </td>
                  <td style={{ ...LP2_TD, textAlign: 'center' }}>
                    {r.taxCert ? (
                      <>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 9px',
                                       borderRadius: 9999, background: LP2_SOFT, color: LP2_G, fontSize: 11, fontWeight: 600 }}>
                          <span style={{ width: 5, height: 5, borderRadius: 9999, background: LP2_G }} />ออกได้
                        </span>
                        {r.certNote && (
                          <span style={{ display: 'block', fontSize: 10.5, color: 'rgba(0,0,0,.45)', marginTop: 3, lineHeight: 1.45 }}>{r.certNote}</span>
                        )}
                      </>
                    ) : <span style={{ color: 'rgba(0,0,0,.35)' }}>—</span>}
                  </td>
                  <td style={LP2_TD}>
                    {(r.details || []).length > 0 ? (
                      <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {r.details.map((d, i) => (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', height: 22, padding: '0 8px',
                                                 borderRadius: 9999, background: '#f5f5f5', border: '1px solid ' + LP2_LINE,
                                                 color: 'rgba(0,0,0,.65)', fontSize: 11 }}>{d}</span>
                        ))}
                      </span>
                    ) : <span style={{ color: 'rgba(0,0,0,.35)', fontSize: 12 }}>ไม่ต้องระบุ</span>}
                  </td>
                  <td style={{ ...LP2_TD, textAlign: 'center' }}>
                    {r.enabled ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>}
                  </td>
                  <td style={{ ...LP2_TD, textAlign: 'center' }}>
                    <button type="button" role="switch" aria-checked={!!r.enabled}
                            aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            onClick={() => setConfirm({ rec: r, next: !r.enabled })}
                            style={{ position: 'relative', width: 44, height: 22, flexShrink: 0, border: 'none',
                                     borderRadius: 9999, cursor: 'pointer', padding: 0, transition: 'background .18s',
                                     background: r.enabled ? LP2_G : 'rgba(0,0,0,.25)' }}>
                      <span style={{ position: 'absolute', top: 2, left: r.enabled ? 24 : 2, width: 18, height: 18,
                                     borderRadius: 9999, background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .18s' }} />
                    </button>
                  </td>
                  <td style={{ ...LP2_TD, textAlign: 'center' }}>
                    <button type="button" onClick={() => setForm({ rec: r })}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, padding: '0 10px',
                                     border: '1px solid #d9d9d9', background: '#fff', borderRadius: 4,
                                     fontFamily: 'inherit', fontSize: 12, color: 'rgba(0,0,0,.65)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <Lp2Ico d={LP2_EDIT} s={13} /> แก้ไข
                    </button>
                  </td>
                </tr>
              ))}
              {total === 0 && (
                <tr><td colSpan={7} style={{ ...LP2_TD, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 12px' }}>ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px 0', borderTop: '1px solid ' + LP2_LINE, display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>
            {total === 0 ? '0 รายการ' : (start + 1) + '-' + Math.min(start + per, total) + ' จาก ' + total + ' รายการ'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {pageBtn(page - 1, '‹', page <= 1, false)}
            {Array.from({ length: pages }, (_, i) => pageBtn(i + 1, String(i + 1), false, page === i + 1))}
            {pageBtn(page + 1, '›', page >= pages, false)}
            <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }}
                    aria-label="จำนวนต่อหน้า"
                    style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                             fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
              <option value={20}>20 / หน้า</option>
              <option value={50}>50 / หน้า</option>
              <option value={100}>100 / หน้า</option>
            </select>
          </div>
        </div>
      </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 12, fontSize: 11.5,
                    color: 'rgba(0,0,0,.45)', lineHeight: 1.55, maxWidth: 900, textWrap: 'pretty' }}>
        <span style={{ display: 'inline-flex', flexShrink: 0, marginTop: 2 }}><Lp2Ico d={LP2_INFO} s={12} /></span>
        <span>
          เฉพาะวัตถุประสงค์ที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในใบคำขอกู้เงิน · เมื่อติ๊ก “หนังสือรับรองดอกเบี้ย” ในใบคำขอ
          ระบบจะตรวจสอบว่าวัตถุประสงค์ที่เลือกออกหนังสือรับรองได้หรือไม่
        </span>
      </div>

      {done && (window.StatusModal
        ? <window.StatusModal variant="success" title={done.title} detail={done.detail} onClose={() => setDone(null)} />
        : <Lp2Success title={done.title} detail={done.detail} onClose={() => setDone(null)} />)}

      {form && <Lp2Form rec={form.rec} list={list} onClose={() => setForm(null)} onSave={doSave} />}

      {confirm && (window.ToggleConfirmModal
        ? <window.ToggleConfirmModal
            next={confirm.next}
            title={(confirm.next ? 'เปิด' : 'ปิด') + 'การใช้งานวัตถุประสงค์การกู้'}
            subtitle={confirm.rec.code + ' · ' + confirm.rec.name}
            detail={confirm.next
              ? 'เปิดให้ใช้วัตถุประสงค์ “' + confirm.rec.name + '” — วัตถุประสงค์นี้จะแสดงเป็นตัวเลือกในใบคำขอกู้เงินทันที'
              : 'ปิดการใช้งาน “' + confirm.rec.name + '” — วัตถุประสงค์นี้จะไม่แสดงในใบคำขอกู้เงินใหม่ (สัญญาเดิมไม่กระทบ)'}
            onCancel={() => setConfirm(null)}
            onConfirm={applyToggle} />
        : null)}
    </div>
  );
}

Object.assign(window, { LoanPurposeConstPageV2 });
