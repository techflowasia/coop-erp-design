// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — กำหนดจำนวนคนค้ำประกัน (patch หน้ารายการ)
//   • ย้ายช่องค้นหา + ปุ่มค้นหา/รีเซ็ต ลงมารวมการ์ดเดียวกับตาราง
//   • เพิ่ม pagination ใต้ตาราง (ในการ์ดเดียวกัน มีเส้นคั่น)
// ═════════════════════════════════════════════════════════════════

(function () {
  const Orig = window.GuarantorCountConfigPage;
  if (!Orig || Orig.__gccPatched) return;
  const BC = window.BreadcrumbContext || React.createContext(null);
  const GKEY = 'guarantor_count_groups';
  const actorName = (u) => {
    if (typeof u === 'string' && u.trim()) return u.trim();
    if (u && typeof u === 'object' && typeof u.name === 'string') return u.name;
    return '';
  };
  const plainText = (v, fallback) => {
    const s = actorName(v);
    return s || fallback;
  };
  const loadGroups = () => {
    let list = null;
    try { const raw = localStorage.getItem(GKEY); if (raw) list = JSON.parse(raw); } catch (e) {}
    if (!Array.isArray(list)) list = (window.GC_GROUP_SEED || []).map(g => JSON.parse(JSON.stringify(g)));
    // กันค่าที่เคยบันทึกเป็น object (เช่น CURRENT_USER) — ทำให้ React เรนเดอร์พัง
    return list.map(g => (g && typeof g === 'object'
      ? { ...g,
          updatedBy: actorName(g.updatedBy) || undefined,
          createdBy: actorName(g.createdBy) || undefined,
          updatedAt: typeof g.updatedAt === 'string' ? g.updatedAt : undefined }
      : g));
  };
  const PURGE_CODES = ['89', '5678', '1234', 'vs', 'y', 'rr', 'T', 't', 'ZZ9', 'ZZ8'];
  const saveGroups = (list) => { try { localStorage.setItem(GKEY, JSON.stringify(list)); } catch (e) {} if (typeof syncPersonGroupOpts === 'function') syncPersonGroupOpts(); };
  (function purgeOnce() {
    try {
      const raw = localStorage.getItem(GKEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      const purge = PURGE_CODES.map(c => c.toLowerCase());
      const kept = list.filter(g => purge.indexOf(String((g && g.code) || '').trim().toLowerCase()) < 0);
      if (kept.length !== list.length) localStorage.setItem(GKEY, JSON.stringify(kept));
    } catch (e) {}
  })();
  const maxOf = (r) => (r.useNormal ? Number(r.normalCount || 0) : 0)
    + Number(r.insurance1 || 0) + Number(r.insurance2 || 0) + Number(r.extraFund || 0);
  const NEW_ROW = { memberType: 'none', memberFrom: '0', memberTo: '', useNormal: true, normalCount: 0, insurance1: 0, insurance2: 0, extraFund: 0 };
  const mtNorm = (v) => (window.LP_OPTS.memberTypeRight.some(o => o.v === v) ? v : 'none');
  const mtLabel = (v) => (window.LP_OPTS.memberTypeRight.find(o => o.v === mtNorm(v)) || {}).l || 'ไม่ระบุ';

  // ── ประวัติการแก้ไข ─────────────────────────────────────────────
  const GC_USER = 'นางสาวสุภาพร วงศ์สกุล';
  const HIST_SEED = [
    { action: 'create', ts: '2569-07-12T09:40', user: 'นายธนวัฒน์ เจริญสุข', summary: 'สร้างกลุ่มนับค้ำ', changes: [] },
    { action: 'edit', ts: '2569-08-05T14:18', user: 'นางสาวสุภาพร วงศ์สกุล', summary: 'แก้ไขจำนวนคนค้ำ', changes: [{ field: 'สิทธิปกติ (แถว 1)', before: '5 คน', after: '6 คน' }] },
    { action: 'edit', ts: '2569-08-21T11:25', user: 'นางสาวสุภาพร วงศ์สกุล', summary: 'แก้ไขข้อมูลกลุ่ม', changes: [{ field: 'หมายเหตุ', before: '—', after: 'ปรับตามมติคณะกรรมการ' }] },
  ];
  const histOf = (g) => (Array.isArray(g && g.history) && g.history.length
    ? g.history
    : (g && g.__noSeed ? [] : HIST_SEED));
  const nowStamp = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return (d.getFullYear() + 543) + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  };
  const thDate = (ts) => {
    const s = String(ts || '');
    const d = s.slice(0, 10).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : s;
  };
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const stampLabel = (ts) => {
    const s = String(ts || '');
    const d = s.slice(0, 10).split('-');
    const date = d.length === 3 ? Number(d[2]) + ' ' + (TH_MON[Number(d[1]) - 1] || d[1]) + ' ' + d[0] : s;
    return date + ' ' + s.slice(11, 16) + ' น.';
  };
  const ROW_LABELS = { memberType: 'ประเภทสมาชิก', memberFrom: 'ช่วงสมาชิก ≥', memberTo: 'ช่วงสมาชิก ≤',
    useNormal: 'ใช้สิทธิปกติ', normalCount: 'สิทธิปกติ จำนวนสัญญา', insurance1: 'สิทธิเพิ่มจากประกัน 1 ประเภท',
    insurance2: 'สิทธิเพิ่มจากประกัน 2 ประเภท', extraFund: 'สิทธิเพิ่มจาก สสอร+ชสอ' };
  const HEAD_LABELS = { code: 'รหัสกลุ่มนับค้ำ', name: 'ชื่อกลุ่มนับค้ำ', note: 'หมายเหตุ' };
  const cellText = (k, v) => {
    if (k === 'useNormal') return v ? 'ใช้' : 'ไม่ใช้';
    if (k === 'memberType') return mtLabel(v);
    if (['normalCount', 'insurance1', 'insurance2', 'extraFund'].indexOf(k) >= 0) return String(Number(v || 0)) + ' สัญญา';
    return String(v == null || v === '' ? '—' : v);
  };
  const diffGroups = (before, after) => {
    const out = [];
    Object.keys(HEAD_LABELS).forEach((k) => {
      const b = before[k] || '', a = after[k] || '';
      if (String(b) !== String(a)) out.push({ field: HEAD_LABELS[k], before: String(b || '—'), after: String(a || '—') });
    });
    const rb = before.rows || [], ra = after.rows || [];
    ra.forEach((r, i) => {
      const prev = rb[i];
      if (!prev) { out.push({ field: 'แถว ' + (i + 1), before: '—', after: 'เพิ่มแถวใหม่' }); return; }
      Object.keys(ROW_LABELS).forEach((k) => {
        if (String(prev[k]) !== String(r[k])) {
          out.push({ field: ROW_LABELS[k] + ' (แถว ' + (i + 1) + ')', before: cellText(k, prev[k]), after: cellText(k, r[k]) });
        }
      });
    });
    if (rb.length > ra.length) out.push({ field: 'จำนวนแถว', before: rb.length + ' แถว', after: ra.length + ' แถว' });
    return out;
  };

  function GccHistoryModal({ record, onClose }) {
    const hist = histOf(record).slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
    const [page, setPage] = React.useState(1);
    const per = 10;
    const pages = Math.max(1, Math.ceil(hist.length / per));
    const rows = hist.slice((page - 1) * per, page * per);
    const meta = (a) => a === 'create'
      ? { label: 'สร้างกลุ่มนับค้ำ', color: 'var(--success)', icon: 'plus' }
      : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
    return (
      <React.Fragment>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 720, maxWidth: '94vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-head">
            <div className="gc-modal-ico"><Icon name="history" /></div>
            <div style={{ minWidth: 0 }}>
              <h2>ประวัติการแก้ไข</h2>
              <div className="muted" style={{ fontSize: 11 }}>{record.code} · {record.name} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบย้อนหลัง</div>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
          </div>
          <div className="modal-body" style={{ overflow: 'auto' }}>
            {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {rows.map((h, i) => {
                const m = meta(h.action);
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < rows.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                        <Icon name={m.icon} size={14} />
                      </div>
                      {i < rows.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                        <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{stampLabel(h.ts)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                      {h.changes && h.changes.length > 0 && (
                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {h.changes.map((c, ci) => (
                            <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                              <span className="muted" style={{ minWidth: 190 }}>{c.field}</span>
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
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="muted" style={{ fontSize: 12 }}>ทั้งหมด {hist.length} รายการ</span>
            <span className="spacer" style={{ flex: 1 }} />
            {pages > 1 && (
              <React.Fragment>
                <button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><Icon name="chevLeft" size={13} /></button>
                <span className="muted" style={{ fontSize: 12 }}>{page} / {pages}</span>
                <button className="btn sm" disabled={page >= pages} onClick={() => setPage(page + 1)}><Icon name="chevRight" size={13} /></button>
              </React.Fragment>
            )}
            <button className="btn" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  // ── เพิ่มกลุ่มนับค้ำ — ห้ามรหัสหรือชื่อซ้ำกับกลุ่มที่มีอยู่ ──
  (function guardAddModal() {
    const wrap = () => {
      const OrigModal = window.GcGroupModal;
      if (typeof OrigModal !== 'function' || OrigModal.__dupGuard) return false;
      const norm = (s) => String(s == null ? '' : s).trim().toLowerCase();
      const showErr = (msg) => {
        const card = document.querySelector('.modal-card');
        if (!card) return;
        let box = card.querySelector('.gcc-dup-err');
        if (!box) {
          box = document.createElement('div');
          box.className = 'gcc-dup-err';
          box.style.cssText = 'margin:10px 18px 0;padding:8px 12px;border:1px solid var(--error,#ff4d4f);'
            + 'background:#fff2f0;color:var(--error,#ff4d4f);border-radius:4px;font-size:12.5px';
          const body = card.querySelector('.modal-body') || card;
          body.insertBefore(box, body.firstChild);
        }
        box.textContent = msg;
      };
      const Wrapped = function GcGroupModalPatched(props) {
        const next = Object.assign({}, props);
        const orig = props.onSubmit;
        next.onSubmit = (g) => {
          const list = loadGroups();
          if (list.some(x => norm(x.code) === norm(g.code))) { showErr('รหัสกลุ่มนับค้ำนี้ถูกใช้แล้ว — กรุณาระบุรหัสอื่น'); return; }
          if (list.some(x => norm(x.name) === norm(g.name))) { showErr('ชื่อกลุ่มนับค้ำนี้ถูกใช้แล้ว — กรุณาระบุชื่ออื่น'); return; }
          const box = document.querySelector('.gcc-dup-err');
          if (box) box.remove();
          // กลุ่มที่สร้างใหม่ — เริ่มด้วยแถวว่าง (จำนวนคน 0, ช่วงสมาชิกให้กรอกเอง)
          return orig && orig({ ...g, rows: [{ ...NEW_ROW }] });
        };
        return OrigModal(next);
      };
      Wrapped.__dupGuard = true;
      window.GcGroupModal = Wrapped;
      return true;
    };
    if (!wrap()) {
      let n = 0;
      const t = setInterval(() => { if (wrap() || ++n > 40) clearInterval(t); }, 150);
    }
  })();

  // ── ป้อนรายการกลุ่มนับค้ำเข้า dropdown "กลุ่มสิทธิจำนวนคนค้ำ" (แท็บหลักประกัน) ──
  const syncPersonGroupOpts = () => {
    const opts = loadGroups().map(g => ({ v: g.code, l: g.code + ' · ' + g.name }));
    const put = () => {
      if (!window.LP_OPTS) window.LP_OPTS = {};
      window.LP_OPTS.guarPersonGroup = opts;
      return true;
    };
    put();
  };
  syncPersonGroupOpts();

  // หน้ารายละเอียด "กลุ่มนับค้ำ" (ยังไม่ผูกผลิตภัณฑ์) — เปิดเป็น Edit Mode หลังสร้างใหม่
  function GccGroupDetail({ groupId, startEditing, onBack, onSaved, onMode }) {
    const [groups, setGroups] = React.useState(loadGroups);
    const [editing, setEditing] = React.useState(!!startEditing);
    const [draft, setDraft] = React.useState(null);
    React.useEffect(() => { onMode && onMode(editing ? 'edit' : 'view'); }, [editing]);
    const group = groups.find(g => g.id === groupId) || null;
    React.useEffect(() => {
      if (startEditing && group && !draft) setDraft(JSON.parse(JSON.stringify(group)));
    }, [groupId]);
    if (!group) return null;
    const view = editing && draft ? draft : group;
    const setField = (k, v) => setDraft({ ...draft, [k]: v });
    const setRow = (i, k, v) => setDraft({ ...draft, rows: draft.rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r) });
    const addRow = () => setDraft({ ...draft, rows: [...draft.rows, { ...NEW_ROW }] });
    const delRow = (i) => setDraft({ ...draft, rows: draft.rows.filter((_, idx) => idx !== i) });
    const [histOpen, setHistOpen] = React.useState(false);
    const startEdit = () => { setDraft(JSON.parse(JSON.stringify(group))); setEditing(true); };
    const cancelEdit = () => { setDraft(null); setEditing(false); };
    const save = () => {
      const changes = diffGroups(group, draft);
      const entry = { action: 'edit', ts: nowStamp(), user: GC_USER,
        summary: 'แก้ไขจำนวนคนค้ำประกัน', changes };
      const withHist = { ...draft, history: [...histOf(group), entry], updatedBy: GC_USER, updatedAt: entry.ts };
      const next = groups.map(g => g.id === draft.id ? withHist : g);
      setGroups(next); saveGroups(next);
      setEditing(false); setDraft(null);
      onSaved && onSaved(`บันทึกกลุ่มนับค้ำ “${draft.name}” เรียบร้อยแล้ว`);
    };
    const lastTs = (() => {
      const h = histOf(group);
      return group.updatedAt || (h.length ? h[h.length - 1].ts : '');
    })();
    return (
      <div data-screen-label="หน้ารายละเอียดกลุ่มนับค้ำ">
        <div className="page-actions">
          <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
          <span className="spacer" />
          {!editing && lastTs && <span className="saved-badge" style={{ marginRight: 4 }}>{(window.savedBadgeLabel && window.savedBadgeLabel(lastTs)) || ('บันทึกล่าสุด: ' + stampLabel(lastTs))}</span>}
          {!editing && <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ</button>}
          {!editing && <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขจำนวนคนค้ำ</button>}
          {editing && (
            <React.Fragment>
              <button className="btn sm" data-discard="1" onClick={cancelEdit}>ละทิ้ง</button>
              <button className="btn primary sm" onClick={save}><Icon name="check" /> บันทึก</button>
            </React.Fragment>
          )}
        </div>
        {histOpen && <GccHistoryModal record={group} onClose={() => setHistOpen(false)} />}

        <div className="search-card lt-head-card">
          <div className="lt-head-main">
            <div className="lt-head-ico"><Icon name="guarantee" size={20} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              {editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '160px minmax(0,1fr)', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label className="lt-modal-label">รหัสกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
                    <input className="cfg-input mono" value={view.code} disabled style={{ background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly />
                  </div>
                  <div>
                    <label className="lt-modal-label">ชื่อกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
                    <input className="cfg-input" value={view.name} onChange={(e) => setField('name', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="lt-modal-label">หมายเหตุ</label>
                    <input className="cfg-input" style={{ width: '100%' }} value={view.note || ''} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                           onChange={(e) => setField('note', e.target.value)} />
                  </div>
                </div>
              ) : (
                <React.Fragment>
                  <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{view.code}</span> · {view.name}</h1>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>หมายเหตุ: {view.note || '—'}</div>
                </React.Fragment>
              )}
            </div>
            {!editing && (group.active !== false
              ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
              : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>)}
          </div>
        </div>

        <div className="search-card gcc-tblcard" style={{ marginTop: 12 }}>
          <div className="section-head">
            <span>จำนวนคนค้ำประกัน</span>
            <span className="muted">{view.rows.length} เงื่อนไข</span>
            <span className="spacer" style={{ flex: 1 }} />
            {editing && <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={addRow}><Icon name="plus" size={13} /> เพิ่มแถว</button>}
          </div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0, overflowX: 'auto' }}>
            <table className="tbl sh-grid gcc-tbl" style={{ minWidth: 940 }}>
              <thead>
                <tr>
                  <th rowSpan="2" className="center" style={{ width: 56 }}>ลำดับ</th>
                  <th rowSpan="2" className="center" style={{ width: 150 }}>ประเภทสมาชิก</th>
                  <th colSpan="2" className="center group-col">ช่วงสมาชิก</th>
                  <th rowSpan="2" className="center group-col" style={{ width: 110 }}>สิทธิปกติ<br />จำนวนสัญญา</th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจากประกัน<br /><span className="gcc-th-sub">(ชีวิต/หนี้) 1 ประเภท</span></th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจากประกัน<br /><span className="gcc-th-sub">(ชีวิต/หนี้) 2 ประเภท</span></th>
                  <th rowSpan="2" className="center group-col" style={{ width: 120 }}>สิทธิเพิ่มจาก<br />สสอร+ชสอ</th>
                  {editing && <th rowSpan="2" className="center" style={{ width: 46 }} />}
                </tr>
                <tr><th className="center sub-col" style={{ width: 150 }}>&ge;</th><th className="center sub-col" style={{ width: 150 }}>&le;</th></tr>
              </thead>
              <tbody>
                {view.rows.map((r, i) => (
                  <tr key={i} style={editing ? { verticalAlign: 'top' } : undefined}>
                    <td className="center mono">{i + 1}</td>
                    <td>
                      {editing
                        ? <select className="sh-grid-input" style={{ textAlign: 'left' }} value={mtNorm(r.memberType)} onChange={(e) => setRow(i, 'memberType', e.target.value)}>
                            {window.LP_OPTS.memberTypeRight.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                          </select>
                        : mtLabel(r.memberType)}
                    </td>
                    <td className="center">
                      {editing
                        ? <input className="sh-grid-input mono center" style={{ width: '100%', maxWidth: 'none' }} value={/^0*$/.test(String(r.memberFrom ?? '')) ? '0' : r.memberFrom} onChange={(e) => setRow(i, 'memberFrom', e.target.value)} />
                        : <span className="mono">{/^0*$/.test(String(r.memberFrom ?? '')) ? '0' : r.memberFrom}</span>}
                    </td>
                    <td className="center">
                      <window.LpUnlCell editing={editing} text center v={r.memberTo || ''} inf="999999" onChange={(v) => setRow(i, 'memberTo', v)} />
                    </td>
                    <td className="center">
                      <div className="gcc-normal">
                        <input type="checkbox" style={{ accentColor: 'var(--brand, #237450)' }} checked={!!r.useNormal} disabled={!editing} onChange={(e) => setRow(i, 'useNormal', e.target.checked)} />
                        {editing && r.useNormal
                          ? <input className="sh-grid-input num mono" type="number" min="0" style={{ width: 54 }} value={r.normalCount == null ? '' : r.normalCount} onChange={(e) => setRow(i, 'normalCount', e.target.value === '' ? 0 : Number(e.target.value))} />
                          : <span className="sh-grid-num">{Number(r.normalCount || 0)}</span>}
                      </div>
                    </td>
                    {['insurance1', 'insurance2', 'extraFund'].map(k => (
                      <td className="center" key={k}>
                        {editing
                          ? <input className="sh-grid-input num mono" type="number" min="0" style={{ width: 54 }} value={r[k] == null ? '' : r[k]} onChange={(e) => setRow(i, k, e.target.value === '' ? 0 : Number(e.target.value))} />
                          : <span className="sh-grid-num">{Number(r[k] || 0)}</span>}
                      </td>
                    ))}
                    {editing && (
                      <td className="center">
                        <button className="btn sm act-del" onClick={() => delRow(i)} aria-label="ลบแถว" title="ลบแถว"
                                style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)',
                                         width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}><Icon name="trash" size={13} /></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }


  const findTable = (node) => {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) { for (const n of node) { const r = findTable(n); if (r) return r; } return null; }
    if (node.type === 'table') return node;
    return node.props ? findTable(React.Children.toArray(node.props.children)) : null;
  };
  // ── ช่องกรอกห่อด้วยคอมโพเนนต์ — กัน patch อื่น clone <input> แล้วใส่ children (void element error) ──
  function GccInput(props) {
    const rest = Object.assign({}, props);
    delete rest.children;
    return React.createElement('input', rest);
  }

  // ── Success overlay (DOM ล้วน) — อยู่รอดแม้ React จะ remount หน้าหลังบันทึก ──
  function gccSuccessOverlay(title, detail) {
    const old = document.getElementById('gcc-ok-overlay');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'gcc-ok-overlay';
    wrap.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:950;'
      + 'display:flex;align-items:center;justify-content:center;padding:16px;';
    wrap.innerHTML = '<div role="dialog" aria-modal="true" style="width:460px;max-width:100%;background:#fff;'
      + 'border-radius:12px;padding:36px 32px 32px;box-shadow:0 6px 24px rgba(0,0,0,.18);text-align:center;'
      + 'font-family:inherit">'
      + '<span style="display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;'
      + 'border-radius:9999px;background:#eafef2;color:#237450;margin-bottom:20px">'
      + '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" '
      + 'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>'
      + '<h2 style="margin:0;font-size:20px;font-weight:700;color:rgba(0,0,0,.88);line-height:1.35"></h2>'
      + '<p style="margin:12px auto 0;max-width:380px;font-size:13px;color:rgba(0,0,0,.55);line-height:1.65"></p>'
      + '<div style="display:flex;justify-content:center;margin-top:24px">'
      + '<button type="button" style="height:38px;padding:0 26px;border:1px solid #237450;background:#237450;'
      + 'border-radius:4px;font-family:inherit;font-size:13px;font-weight:600;color:#fff;cursor:pointer">'
      + 'เสร็จสิ้น</button></div></div>';
    wrap.querySelector('h2').textContent = title;
    wrap.querySelector('p').textContent = detail || '';
    wrap.querySelector('button').addEventListener('click', () => wrap.remove());
    document.body.appendChild(wrap);
  }

  // ── Modal แก้ไขกลุ่มนับค้ำ (รหัส / ชื่อ / หมายเหตุ) + badge แก้ไขล่าสุด ──
  function GccEditGroupModal({ rec, groups, onCancel, onSave }) {
    const [code, setCode] = React.useState(rec.code || '');
    const [name, setName] = React.useState(rec.name || '');
    const [note, setNote] = React.useState(rec.note || '');
    const [err, setErr] = React.useState('');
    const submit = () => {
      const c = code.trim();
      if (!c) { setErr('กรุณาระบุรหัสกลุ่มนับค้ำ'); return; }
      if (!name.trim()) { setErr('กรุณาระบุชื่อกลุ่มนับค้ำ'); return; }
      if ((groups || []).some(x => x.id !== rec.id && String(x.code || '').trim() === c)) {
        setErr('รหัสกลุ่มนับค้ำนี้ถูกใช้แล้ว'); return;
      }
      if ((groups || []).some(x => x.id !== rec.id && String(x.name || '').trim().toLowerCase() === name.trim().toLowerCase())) {
        setErr('ชื่อกลุ่มนับค้ำนี้ถูกใช้แล้ว'); return;
      }
      onSave({ code: c, name: name.trim(), note: note.trim() });
    };
    return (
      <React.Fragment>
        <div className="modal-backdrop" />
        <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
          <div className="modal-head">
            <div className="gc-modal-ico"><Icon name="edit" /></div>
            <div style={{ minWidth: 0 }}>
              <h2>แก้ไขกลุ่มนับค้ำ</h2>
              <div className="muted" style={{ fontSize: 11 }}>{(rec.code || '') + ' · ' + (rec.name || '')}</div>
            </div>
            <button className="close-btn" onClick={onCancel} aria-label="ปิด"><Icon name="close" /></button>
          </div>
          <div className="modal-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 12px',
                          border: '1px solid #91caff', background: '#e6f4ff', borderRadius: 6,
                          fontSize: 12, color: 'rgba(0,0,0,.65)' }}>
              <Icon name="info" size={13} />
              <span>แก้ไขล่าสุดโดย <b style={{ color: 'rgba(0,0,0,.88)' }}>{plainText(rec.updatedBy, plainText(rec.createdBy, 'มนตรี ศรีสุข'))}</b> เมื่อ {typeof rec.updatedAt === 'string' && rec.updatedAt ? rec.updatedAt : '05/01/2566 11:25 น.'}</span>
            </div>
            <label className="lt-modal-label">รหัสกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
            <GccInput className="cfg-input mono" value={code} disabled style={{ background: '#f5f5f5', color: 'rgba(0,0,0,.65)', cursor: 'not-allowed' }} readOnly
                      onChange={() => {}} />
            <label className="lt-modal-label" style={{ marginTop: 12 }}>ชื่อกลุ่มนับค้ำ <span className="cfg-required">*</span></label>
            <GccInput className="cfg-input" value={name}
                      onChange={(e) => { setName(e.target.value); setErr(''); }} />
            <label className="lt-modal-label" style={{ marginTop: 12 }}>หมายเหตุ</label>
            <GccInput className="cfg-input" value={note} placeholder="หมายเหตุประกอบ (ไม่บังคับ)"
                      onChange={(e) => setNote(e.target.value)} />
            {err ? <div style={{ marginTop: 10, fontSize: 12, color: '#ff4d4f' }}>{err}</div> : null}
          </div>
          <div className="modal-foot">
            <button className="btn sm" onClick={onCancel}>ยกเลิก</button>
            <button className="btn primary sm" disabled={!code.trim() || !name.trim()} onClick={submit}>
              <Icon name="check" /> บันทึกการแก้ไข
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  const mapTable = (node, fn) => {
    if (Array.isArray(node)) return node.map(n => mapTable(n, fn));
    if (!node || typeof node !== 'object' || !node.props) return node;
    if (node.type === 'table') return fn(node);
    return React.cloneElement(node, {}, mapTable(React.Children.toArray(node.props.children), fn));
  };

  function GuarantorCountConfigPage(props) {
    const [page, setPage] = React.useState(1);
    const [per, setPer] = React.useState(10);
    const [okMsg, setOkMsg] = React.useState('');
    const [gView, setGView] = React.useState(null);   // {id} = หน้ารายละเอียดกลุ่มนับค้ำที่เพิ่งสร้าง
    const [gMode, setGMode] = React.useState('view');
    const [tab, setTab] = React.useState('groups');   // groups = กลุ่มนับค้ำ (ค่าเริ่มต้น) · link = ผูกเงินกู้
    const [glist, setGlist] = React.useState(loadGroups);
    const [gTog, setGTog] = React.useState(null);     // กลุ่มที่กำลังยืนยันเปิด/ปิด
    const [gEdit, setGEdit] = React.useState(null);   // กลุ่มที่กำลังแก้ไข
    // ล้างข้อมูลทดสอบที่ค้างใน localStorage (รหัส 1ab / gtg / ดพเ)
    React.useEffect(() => {
      const bad = /^(1ab|gtg|ดพเ|ก|t|y|zz8|zz9)$/i;
      const clean = glist.filter(g => !bad.test(String(g.code || '').trim()));
      if (clean.length !== glist.length) { setGlist(clean); saveGroups(clean); }
    }, []);
    const setOkRef = React.useRef(setOkMsg); setOkRef.current = setOkMsg;
    const setGRef = React.useRef(setGView); setGRef.current = setGView;
    const setGlistRef = React.useRef(setGlist); setGlistRef.current = setGlist;
    const gRef = React.useRef(gView); gRef.current = gView;
    // จับคลิกปุ่ม "บันทึก / ยืนยัน" ในหน้านี้ แล้วแสดง Success Modal (ไม่แตะ props ของหน้าเดิม)
    const onClickCapture = React.useRef((e) => {
      const b = e.target && e.target.closest && e.target.closest('button');
      if (!b || b.disabled) return;
      const t = (b.textContent || '').trim();
      if (/^เพิ่มกลุ่ม/.test(t)) {
        // หลังเพิ่มกลุ่มนับค้ำ → เข้าหน้ารายละเอียดของกลุ่มที่เพิ่งสร้าง (โหมดแก้ไข)
        const before = loadGroups().map(g => g.id);
        setTimeout(() => {
          const after = loadGroups();
          const fresh = after.find(g => before.indexOf(g.id) < 0);
          if (!fresh) return;
          if (!Array.isArray(fresh.rows) || !fresh.rows.length) {
            fresh.rows = [{ ...NEW_ROW }];
          }
          if (!Array.isArray(fresh.history) || !fresh.history.length) {
            fresh.__noSeed = true;
            fresh.history = [{ action: 'create', ts: nowStamp(), user: GC_USER, summary: 'สร้างกลุ่มนับค้ำ “' + fresh.name + '”', changes: [] }];
            fresh.updatedAt = fresh.history[0].ts;
            fresh.updatedBy = GC_USER;
          }
          saveGroups(after);
          setGlistRef.current(after);
          setGRef.current({ id: fresh.id, isNew: true });
        }, 60);
        return;
      }
      if (!/^(บันทึก|ยืนยัน)/.test(t)) return;
      // การบันทึกของหน้าหลักแจ้งผลผ่าน onToast → StatusModal (396) แล้ว
      return;
    }).current;
    React.useEffect(() => {
      // Success modal 1 step — ปิดด้วยปุ่ม “เสร็จสิ้น” เท่านั้น (ไม่ปิดเอง)
    }, [okMsg]);
    const tree = Orig(props);
    const gDetail = gView ? (
      <GccGroupDetail groupId={gView.id} startEditing={!!gView.isNew} onMode={setGMode}
        onBack={() => { setGlist(loadGroups()); setGView(null); }}
        onSaved={(msg) => { setGlist(loadGroups()); setOkMsg(msg); }} />
    ) : null;
    const modal = okMsg ? (
      window.StatusModal
        ? <window.StatusModal key="gcc-ok" variant="success"
            title={/^เพิ่ม/.test(okMsg) ? 'เพิ่มข้อมูลเรียบร้อยแล้ว'
              : /ลบ|นำออก/.test(okMsg) ? 'ลบข้อมูลเรียบร้อยแล้ว'
              : 'บันทึกการแก้ไขเรียบร้อยแล้ว'}
            detail={okMsg} onClose={() => setOkMsg('')} />
        : null
    ) : null;
    const legacyModal = null && (
      <React.Fragment key="gcc-ok">
        <div className="modal-backdrop" />
        <div className="modal-card gcc-ok-modal" role="dialog" aria-modal="true">
          <div className="modal-body gcc-ok-body">
            <div className="gcc-ok-ico"><Icon name="check" size={26} /></div>
            <h2 className="gcc-ok-title">บันทึกข้อมูลสำเร็จ</h2>
            <div className="gcc-ok-text">{okMsg}</div>
          </div>
          <div className="modal-foot">
            <button className="btn primary sm" onClick={() => setOkMsg('')}>เสร็จสิ้น</button>
          </div>
        </div>
      </React.Fragment>
    );
    void legacyModal;
    const saveGroupEdit = (d) => {
      const dt = new Date();
      const p2 = (n) => String(n).padStart(2, '0');
      const stamp = p2(dt.getDate()) + '/' + p2(dt.getMonth() + 1) + '/' + (dt.getFullYear() + 543)
        + ' ' + p2(dt.getHours()) + ':' + p2(dt.getMinutes()) + ' น.';
      const who = plainText(window.GC_USER || window.CURRENT_USER, 'มนตรี ศรีสุข');
      const nextList = glist.map(x => (x.id === gEdit.id
        ? { ...x, code: d.code, name: d.name, note: d.note, updatedBy: who, updatedAt: stamp } : x));
      setGlist(nextList); saveGroups(nextList);
      setGEdit(null);
      gccSuccessOverlay('บันทึกการแก้ไขเรียบร้อยแล้ว',
        'กลุ่มนับค้ำ “' + d.name + '” ถูกแก้ไขเรียบร้อยแล้ว');
    };
    const withModal = (el) => (
      <React.Fragment>
        <div onClickCapture={onClickCapture} style={{ display: 'contents' }}>{gDetail || el}</div>
        {gEdit ? <GccEditGroupModal key="gcc-gedit" rec={gEdit} groups={glist}
                                   onCancel={() => setGEdit(null)} onSave={saveGroupEdit} /> : null}
        {modal}
      </React.Fragment>
    );

    // breadcrumb 3 ระดับ: ระบบสินเชื่อ › ค่าคงที่ › กำหนดจำนวนคนค้ำประกัน
    const isList = !!(tree && tree.props && tree.props['data-screen-label'] === 'หน้าค่าคงที่จำนวนคนค้ำประกัน');
    const bcCtx = React.useContext(BC);
    React.useEffect(() => {
      if (!isList || !bcCtx || !bcCtx.setTrail) return;
      const trail = window.crumb3('กำหนดจำนวนคนค้ำประกัน',
        gView ? (gMode === 'edit' ? 'edit' : 'view') : 'list',
        () => setGView(null));
      bcCtx.setTrail(trail);
    }, [isList, gView, gMode]);
    try {
      if (!tree || tree.props['data-screen-label'] !== 'หน้าค่าคงที่จำนวนคนค้ำประกัน') return withModal(tree);

      const kids = React.Children.toArray(tree.props.children);
      const aIdx = kids.findIndex(k => k.props && k.props.className === 'page-actions');
      if (aIdx < 0) return withModal(tree);

      const actions = kids[aIdx];
      const aKids = React.Children.toArray(actions.props.children);
      const input = aKids.find(k => k.props && String(k.props.className || '').includes('cfg-input'));
      if (!input) return withModal(tree);

      const q = input.props.value || '';
      const setQ = (v) => { input.props.onChange({ target: { value: v } }); setPage(1); };

      const next = kids.slice();
      next[aIdx] = React.cloneElement(actions, {}, aKids.filter(k => k !== input));

      const bar = (
        <div className="gcc-searchbar-row">
          <div className="gcc-search-input">
            <Icon name="search" size={14} />
            <input className="cfg-input" value={q}
              placeholder="ค้นหารหัส / ชื่อกลุ่มนับค้ำ"
              onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn primary sm" onClick={() => setPage(1)}>ค้นหา</button>
          <button className="btn sm" onClick={() => setQ('')}>รีเซ็ต</button>
        </div>
      );

      void tab; void setTab;

      const tIdx = next.findIndex((k, i) => i > aIdx && k.props &&
        String(k.props.className || '').includes('search-card'));
      if (tIdx < 0) return withModal(tree);
      const tableCard = next[tIdx];

      // ── นับ/ตัดแถวตามหน้า ──
      const table = findTable(React.Children.toArray(tableCard.props.children));
      let total = 0, from = 0, to = 0, pages = 1, cur = page;
      const body = table && React.Children.toArray(table.props.children).find(c => c.type === 'tbody');
      const allRows = body ? React.Children.toArray(body.props.children) : [];
      const dataRows = allRows.filter(r => r.type === 'tr' && r.props.className !== undefined);
      const isEmpty = dataRows.length === 0;
      total = dataRows.length;
      pages = Math.max(1, Math.ceil(total / per));
      cur = Math.min(page, pages);
      from = total ? (cur - 1) * per + 1 : 0;
      to = Math.min(cur * per, total);

      const paged = mapTable(React.Children.toArray(tableCard.props.children), (tbl) => {
        const parts = React.Children.toArray(tbl.props.children).map(c => {
          if (c.type !== 'tbody') return c;
          const rows = isEmpty ? allRows : dataRows.slice(from - 1, to);
          return React.cloneElement(c, {}, rows);
        });
        return React.cloneElement(tbl, {}, parts);
      });

      const pageBtns = [];
      const win = 5;
      let s = Math.max(1, cur - Math.floor(win / 2));
      let e = Math.min(pages, s + win - 1);
      s = Math.max(1, e - win + 1);
      for (let i = s; i <= e; i++) {
        pageBtns.push(
          <button key={i} className={'gcc-page-btn' + (i === cur ? ' active' : '')} onClick={() => setPage(i)}>{i}</button>
        );
      }

      const pager = (
        <div className="gcc-pager" key="gcc-pager">
          <span className="spacer" />
          <span className="muted gcc-pager-info">
            แสดง {from}-{to} จาก {total} รายการ
          </span>
          <div className="gcc-pager-nav" style={{ marginLeft: 16 }}>
            <button className="gcc-page-btn" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="ก่อนหน้า">‹</button>
            {pageBtns}
            <button className="gcc-page-btn" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="ถัดไป">›</button>
          </div>
          <div className="gcc-pager-per" style={{ marginLeft: 16 }}>
            <select className="cfg-input" value={per}
              onChange={(ev) => { setPer(Number(ev.target.value)); setPage(1); }}>
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="muted">ต่อหน้า</span>
          </div>
        </div>
      );

      // ── แท็บกลุ่มนับค้ำ — ตารางกลุ่ม (รหัส · ชื่อ · สถานะ · ใช้งาน · แก้ไข) ──
      const JUNK = /^(1ab|gtg|ดพเ|ก)$/i;
      const gAll = glist.filter(g => !JUNK.test(String(g.code || '').trim())).filter(g => {
        const k = q.trim().toLowerCase();
        return !k || (String(g.code) + ' ' + String(g.name)).toLowerCase().includes(k);
      });
      const gPages = Math.max(1, Math.ceil(gAll.length / per));
      const gCur = Math.min(page, gPages);
      const gFrom = gAll.length ? (gCur - 1) * per + 1 : 0;
      const gTo = Math.min(gCur * per, gAll.length);
      const gRows = gAll.slice(gFrom - 1, gTo);
      const isOn = (g) => g.active !== false;

      const commitGroups = (list) => { setGlist(list); saveGroups(list); };

      const groupTable = (
        <div className="table-wrap" style={{ margin: 16 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 150 }}>รหัสกลุ่มนับค้ำ</th>
                <th style={{ minWidth: 260 }}>ชื่อกลุ่มนับค้ำ</th>
                <th style={{ width: 150 }}>สถานะ</th>
                <th className="center" style={{ width: 90 }}>ใช้งาน</th>
                <th className="center" style={{ width: 90 }}></th>
              </tr>
            </thead>
            <tbody>
              {gRows.length === 0 ? (
                <tr><td colSpan={5} className="center muted" style={{ padding: 24 }}>ไม่พบกลุ่มนับค้ำ</td></tr>
              ) : gRows.map(g => (
                <tr key={g.id || g.code}>
                  <td className="mono">{g.code}</td>
                  <td><div className="lt-row-name">{g.name}</div></td>
                  <td>
                    {isOn(g)
                      ? <span className="pill ok">เปิดการใช้งาน</span>
                      : <span className="pill neutral">ปิดการใช้งาน</span>}
                  </td>
                  <td className="center">
                    <button type="button" className={'lt-switch' + (isOn(g) ? ' on' : '')}
                            role="switch" aria-checked={isOn(g)}
                            aria-label={isOn(g) ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                            onClick={() => setGTog(g)}><span className="lt-switch-knob" /></button>
                  </td>
                  <td className="center">
                    <button className="btn sm" title="เปิดรายละเอียดกลุ่มนับค้ำ"
                            
                            onClick={() => setGView({ id: g.id })}>
                      <Icon name="eye" size={13} /> ดู
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      const groupPager = null; void groupPager;

      const gUsed = gTog && isOn(gTog) && window.lpTypesUsing ? window.lpTypesUsing(s => String(s.guarPersonGroup || '') === String(gTog.code)) : [];
      const togModal = gTog && window.ToggleConfirmModal ? (gUsed.length ? (
        <window.ToggleConfirmModal key="gcc-tog-blk" blocked next={false} title="ยืนยันปิดการใช้งานกลุ่มนับค้ำ"
          subtitle={gTog.code + ' · ' + gTog.name}
          detail={`ปิดใช้งานไม่ได้ — กลุ่มนับค้ำ “${gTog.name}” ถูกใช้อยู่ใน ${gUsed.length} ประเภทเงินกู้: ${gUsed.join(' · ')} · กรุณาเปลี่ยนกลุ่มนับค้ำของประเภทเงินกู้เหล่านี้ก่อน`}
          onCancel={() => setGTog(null)} onConfirm={() => setGTog(null)} />
      ) : (
        <window.ToggleConfirmModal key="gcc-tog" next={!isOn(gTog)}
          title={isOn(gTog) ? 'ยืนยันปิดการใช้งานกลุ่มนับค้ำ' : 'ยืนยันเปิดการใช้งานกลุ่มนับค้ำ'}
          subtitle={gTog.code + ' · ' + gTog.name}
          detail={isOn(gTog)
            ? 'ปิดใช้งานกลุ่มนับค้ำ “' + gTog.name + '” — กลุ่มนี้ไม่มีประเภทเงินกู้ใช้อยู่ และจะไม่แสดงเป็นตัวเลือกในเมนูประเภทเงินกู้'
            : 'กลุ่มนับค้ำนี้จะกลับมาแสดงเป็นตัวเลือก “กลุ่มสิทธิจำนวนคนค้ำ” ในเมนูประเภทเงินกู้'}
          onCancel={() => setGTog(null)}
          onConfirm={() => {
            const nextOn = !isOn(gTog);
            commitGroups(glist.map(x => (x.id === gTog.id ? { ...x, active: nextOn } : x)));
            setGTog(null);
            setOkMsg((nextOn ? 'เปิด' : 'ปิด') + 'การใช้งานกลุ่มนับค้ำ “' + gTog.name + '” แล้ว');
          }} />
      )) : null;


      next[tIdx] = (
        <div className="search-card gcc-listcard" key="gcc-listcard">
          {bar}
          {groupTable}
          {void paged}
          {togModal}
        </div>
      );

      return withModal(React.cloneElement(tree, {}, next));
    } catch (e) {
      return withModal(tree);
    }
  }
  GuarantorCountConfigPage.__gccPatched = true;
  Object.assign(window, { GuarantorCountConfigPage });
})();
