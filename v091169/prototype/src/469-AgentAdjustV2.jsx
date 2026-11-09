// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ปรับปรุงลูกหนี้ตัวแทน — เวอร์ชันปรับปรุง (override 365)
//  · วันที่ทำรายการ / วันที่ออกใบเสร็จ: ช่องเดียวกับหน้ารับชำระตัวแทน
//  · ประเภทรายการ: ปรับเพิ่มยอดลูกหนี้ / ปรับลดยอดลูกหนี้
//  · ตารางรายการปรับปรุงล่าสุด: การ์ดหัวข้อแบบตารางงวดเรียกเก็บที่ค้างชำระ
// ════════════════════════════════════════════════════════════════════
(function () {
const { useState: aajUseState, useMemo: aajUseMemo } = React;

const AAJ_TXN_TYPES = [
  { v: 'AGR', l: 'ปรับเพิ่มยอดลูกหนี้', sign: 1 },
  { v: 'ARE', l: 'ปรับลดยอดลูกหนี้', sign: -1 },
];
const AAJ_ALL_TYPES = AAJ_TXN_TYPES.concat([
  { v: 'ADJ+', l: 'ปรับปรุงยอดยกมา — เพิ่ม', sign: 1 },
  { v: 'ADJ-', l: 'ปรับปรุงยอดยกมา — ลด', sign: -1 },
]);
const aajType = (v) => AAJ_ALL_TYPES.find(t => t.v === v) || null;

const aajToday = () => new Date().toISOString().slice(0, 10);
const aajThaiDate = (iso) => {
  if (!iso) return '';
  const p = String(iso).split('-');
  return `${p[2]}/${p[1]}/${Number(p[0]) + 543}`;
};
const aajDefaultPeriod = () => {
  const n = new Date();
  return String(n.getFullYear() + 543) + String(n.getMonth() + 1).padStart(2, '0');
};

// ─── ช่องวันที่ (เหมือนหน้ารับชำระตัวแทน) ──────────────────────────────
const AAJ_TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const AAJ_TH_DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function aajIsoToDmy(iso) {
  const p = String(iso || '').split('-');
  if (p.length !== 3) return '';
  return p[2] + '/' + p[1] + '/' + (parseInt(p[0], 10) + 543);
}
function aajDmyToIso(s) {
  const d = String(s || '').replace(/[^0-9]/g, '');
  if (d.length < 8) return null;
  let year = parseInt(d.slice(4, 8), 10);
  if (year > 2400) year -= 543;
  return year + '-' + d.slice(2, 4) + '-' + d.slice(0, 2);
}

function AajDate({ value, onChange }) {
  const [txt, setTxt] = aajUseState(aajIsoToDmy(value));
  const [open, setOpen] = aajUseState(false);
  const base = aajUseMemo(() => {
    const p = String(value || '').split('-');
    return p.length === 3 ? new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])) : new Date();
  }, [value]);
  const [view, setView] = aajUseState({ y: base.getFullYear(), m: base.getMonth() });
  const wrapRef = React.useRef(null);

  React.useEffect(() => { setTxt(aajIsoToDmy(value)); }, [value]);
  React.useEffect(() => { setView({ y: base.getFullYear(), m: base.getMonth() }); }, [base]);
  React.useEffect(() => {
    if (!open) return;
    const off = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);

  const handle = (raw) => {
    const d = raw.replace(/[^0-9]/g, '').slice(0, 8);
    let out = d;
    if (d.length > 4) out = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4);
    else if (d.length > 2) out = d.slice(0, 2) + '/' + d.slice(2);
    setTxt(out);
    const iso = aajDmyToIso(out);
    if (iso) onChange(iso);
  };
  const pick = (day) => {
    onChange(view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0'));
    setOpen(false);
  };
  const shift = (n) => setView(v => {
    const d = new Date(v.y, v.m + n, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const selIso = String(value || '');

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input className="cfg-input mono" value={txt} placeholder="วว/ดด/ปปปป" inputMode="numeric"
        style={{ width: '100%', paddingRight: 34 }} onChange={e => handle(e.target.value)} />
      <button type="button" title="เลือกวันที่" onClick={() => setOpen(o => !o)}
        style={{
          position: 'absolute', right: 1, bottom: 1, height: 'calc(100% - 2px)', width: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0,
          background: 'transparent', cursor: 'pointer', color: 'var(--text-body)', padding: 0,
        }}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.8" y="3.2" width="12.4" height="11.4" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.8 6.3h12.4" stroke="currentColor" strokeWidth="2" />
          <path d="M4.9 1.7v2.8M11.1 1.7v2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, width: 268,
          background: '#fff', border: '1px solid var(--line, #d9d9d9)', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,.14)', padding: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{AAJ_TH_MONTHS[view.m]} {view.y + 543}</div>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn sm" style={{ padding: '0 8px' }} onClick={() => shift(-1)}>‹</button>
            <button type="button" className="btn sm" style={{ padding: '0 8px', marginLeft: 4 }} onClick={() => shift(1)}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 2 }}>
            {AAJ_TH_DOW.map(d => <div key={d} style={{ padding: '2px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
            {cells.map((d, i) => {
              if (!d) return <div key={'e' + i} />;
              const iso = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
              const on = iso === selIso;
              return (
                <button key={d} type="button" onClick={() => pick(d)}
                  style={{
                    height: 30, border: on ? '1px solid var(--brand-700)' : '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: on ? 'var(--brand-700)' : 'transparent',
                    color: on ? '#fff' : 'inherit', fontWeight: on ? 700 : 400,
                  }}>{d}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--divider)' }}>
            <button type="button" className="btn sm" onClick={() => { onChange(''); setTxt(''); setOpen(false); }}>ล้าง</button>
            <span style={{ flex: 1 }} />
            <button type="button" className="btn sm primary" onClick={() => { onChange(aajToday()); setOpen(false); }}>วันนี้</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ทะเบียนรายการปรับปรุง (persist) ────────────────────────────────
const AAJ_LS_KEY = 'coop_agent_adjust_v1';
const AAJ_SEED = [
  { id: 'AJ-256906-0007', period: '256906', type: 'ARE', memberCode: 'M-067012', memberName: 'นายวิวัฒน์ จงรุ่งสำราญ', txnDate: '2569-06-27', receiptDate: '2569-06-27', before: 20974.00, amount: 20974.00, after: 0, note: 'นำส่งชำระงวด มิ.ย. ครบ', by: 'มนตรี ศรีสุข', at: '27/06/69 10:41' },
  { id: 'AJ-256906-0006', period: '256906', type: 'ADJ-', memberCode: 'M-058241', memberName: 'นางวิภา จันทร์เพ็ญ', txnDate: '2569-06-18', receiptDate: '2569-06-18', before: 5250.00, amount: 5250.00, after: 0, note: 'ปรับปรุงยอดยกมาผิดพลาด', by: 'สุดา ทองใบ', at: '18/06/69 14:22' },
];
function aajLoad() {
  try { const raw = localStorage.getItem(AAJ_LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return AAJ_SEED.slice();
}
function aajSave(list) { try { localStorage.setItem(AAJ_LS_KEY, JSON.stringify(list)); } catch (e) {} }
function aajNextId(period, list) {
  const prefix = 'AJ-' + period + '-';
  const max = list.reduce((m, r) => {
    if (!String(r.id).startsWith(prefix)) return m;
    return Math.max(m, parseInt(String(r.id).slice(prefix.length), 10) || 0);
  }, 0);
  return prefix + String(max + 1).padStart(4, '0');
}

const aajBalanceOf = (m) => {
  if (!m) return 0;
  const digits = String(m.code).replace(/\D/g, '');
  const sum = digits.split('').reduce((a, c) => a + Number(c), 0);
  if (sum % 3 === 0) return 0;
  const base = 18000 + (sum % 7) * 850 + (Number(digits.slice(-2)) || 0) * 12.25;
  return Math.round(base * 100) / 100;
};

function AajField({ label, required, children, span, hint }) {
  return (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}{required && <b className="req"> *</b>}{hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}</span>
      {children}
    </label>
  );
}

function AajMemberTrigger({ member, onOpen }) {
  const full = member && window.msFullName ? window.msFullName(member) : '';
  return (
    <button type="button" className="gc-member-trigger lb-trigger"
      onClick={(e) => { e.preventDefault(); onOpen(); }}>
      {member ? (
        <React.Fragment>
          <span className="gc-mt-code mono">{member.code}</span>
          {full && <span className="gc-mt-name">{full}</span>}
          <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยนสมาชิก</span>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <Icon name="search" size={14} />
          <span className="muted">คลิกเพื่อค้นหาสมาชิก…</span>
          <span className="gc-dots" style={{ marginLeft: 'auto' }}>…</span>
        </React.Fragment>
      )}
    </button>
  );
}

function AgentAdjustPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ปรับปรุงลูกหนี้ตัวแทน', current: true }], []);

  const [list, setList] = aajUseState(aajLoad);
  const [period, setPeriod] = aajUseState(aajDefaultPeriod);
  const [txnType, setTxnType] = aajUseState('AGR');
  const [member, setMember] = aajUseState(null);
  const [txnDate, setTxnDate] = aajUseState(aajToday());
  const [receiptDate, setReceiptDate] = aajUseState(aajToday());
  const [note, setNote] = aajUseState('');
  const [amount, setAmount] = aajUseState('');
  const [searchOpen, setSearchOpen] = aajUseState(false);

  const balance = member ? aajBalanceOf(member) : null;
  const t = aajType(txnType);
  const amt = parseFloat(amount) || 0;
  const newBalance = balance == null ? null : Math.max(0, balance + (t ? t.sign : 1) * amt);

  const canSave = !!member && !!period.trim() && period.length >= 6 && amt > 0;
  const reset = () => { setMember(null); setNote(''); setAmount(''); setTxnType('AGR'); };

  const save = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนบันทึก'); return; }
    if (!period.trim() || period.length < 6) { onToast && onToast('กรุณาระบุงวดเรียกเก็บให้ครบถ้วน'); return; }
    if (amt <= 0) { onToast && onToast('กรุณาระบุยอดปรับปรุงให้มากกว่า 0'); return; }
    const id = aajNextId(period, list);
    const now = new Date();
    const rec = {
      id, period, type: txnType, memberCode: member.code, memberName: window.msFullName(member),
      txnDate, receiptDate, before: balance, amount: amt, after: newBalance, note: note.trim(),
      by: 'มนตรี ศรีสุข',
      at: `${String((now.getDate())).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${String((now.getFullYear() + 543)).slice(-2)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
    const next = [rec, ...list];
    setList(next); aajSave(next);
    audit.log && audit.log({
      action: 'create', module: 'ลูกหนี้ตัวแทน — ปรับปรุงลูกหนี้ตัวแทน',
      target: `${id} · ${member.code}`,
      summary: `ปรับปรุงลูกหนี้ตัวแทน ${window.msFullName(member)} (${t ? t.l : txnType}) ยอด ${window.fmt.money(amt, 2)} บาท`,
      changes: [{ field: 'ยอดคงเหลือ', before: window.fmt.money(balance, 2), after: window.fmt.money(newBalance, 2) }],
    });
    onToast && onToast(`บันทึกปรับปรุงลูกหนี้ตัวแทน ${id} เรียบร้อย`);
    reset();
  };

  const delRow = (id) => {
    const next = list.filter(r => r.id !== id);
    setList(next); aajSave(next);
    onToast && onToast('ลบรายการปรับปรุงแล้ว');
  };

  // ฐานสมาชิกของ popup — สมาชิกที่มีลูกหนี้ตัวแทน + ฐานสมาชิกกลาง
  const aajMemberSource = aajUseMemo(() => {
    const arc = (window.ARC_MEMBERS || []).map(m => ({
      code: m.code || m.reg, title: m.title || '', firstName: m.firstName || '', lastName: m.lastName || '',
      name: m.name || '', citizenId: m.citizenId || '', dept: m.dept || '', deptCode: m.deptCode || '',
    }));
    const dn = (window.DN_MEMBERS || []);
    const seen = {};
    return arc.concat(dn).filter(m => {
      if (!m || !m.code || seen[m.code]) return false;
      seen[m.code] = 1; return true;
    });
  }, []);

  const listFiltered = aajUseMemo(() => list.slice().sort((a, b) => (a.id < b.id ? 1 : -1)), [list]);

  return (
    <div data-screen-label="หน้าปรับปรุงลูกหนี้ตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปรับปรุงลูกหนี้ตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกปรับปรุงยอดลูกหนี้ตัวแทนรายสมาชิก — เลือกงวดและประเภทรายการ ค้นหาสมาชิก แล้วระบุยอดปรับปรุงพร้อมหมายเหตุ
          </div>
        </div>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายการปรับปรุงลูกหนี้ตัวแทน</h3></div>

        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AajField label="งวดเรียกเก็บ" required>
            <input className="cfg-input mono" value={period} maxLength={6}
              onChange={e => setPeriod(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="เช่น 256907" />
          </AajField>
          <AajField label="ประเภทรายการ" required>
            <select className="cfg-input" value={txnType} onChange={e => setTxnType(e.target.value)}>
              {AAJ_TXN_TYPES.map(x => <option key={x.v} value={x.v}>{x.l}</option>)}
            </select>
          </AajField>
          <AajField label="ใบทำรายการ">
            <input className="cfg-input mono" value="AUTO" readOnly tabIndex={-1}
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-500)', fontWeight: 600 }} />
          </AajField>

          <AajField label="ทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <AajMemberTrigger member={member} onOpen={() => setSearchOpen(true)} />
          </AajField>
          <AajField label="วันที่ทำรายการ" required>
            <AajDate value={txnDate} onChange={setTxnDate} />
          </AajField>
          <AajField label="วันที่ออกใบเสร็จ" required>
            <AajDate value={receiptDate} onChange={setReceiptDate} />
          </AajField>

          <AajField label="ชื่อ – สกุล" span={2}>
            <input className="cfg-input" readOnly tabIndex={-1}
              value={member ? window.msFullName(member) : ''} placeholder="— เลือกสมาชิกเพื่อแสดงชื่อ —"
              style={{ background: 'var(--surface-muted)' }} />
          </AajField>
          <AajField label="ยอดคงเหลือ">
            <input className="cfg-input mono" readOnly tabIndex={-1}
              value={balance == null ? '' : window.fmt.money(balance, 2)} placeholder="0.00"
              style={{ background: 'var(--surface-muted)', textAlign: 'right', fontWeight: 600 }} />
          </AajField>

          <AajField label="หมายเหตุ" span={3}>
            <input className="cfg-input" value={note} onChange={e => setNote(e.target.value)}
              placeholder="ระบุเหตุผลการปรับปรุง / เอกสารอ้างอิง" />
          </AajField>

          <AajField label="ยอดปรับปรุง" required span={3}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <input className="cfg-input mono num" type="number" step="0.01" min="0" value={amount}
                onChange={e => setAmount(e.target.value)} placeholder="0.00"
                style={{ maxWidth: 240, textAlign: 'right' }} />
              {member && amt > 0 && t && (
                <div className="aaj-preview">
                  <span className="aaj-prev-item"><span className="lbl">ยอดคงเหลือเดิม</span><span className="mono">{window.fmt.money(balance, 2)}</span></span>
                  <span className={"aaj-prev-op " + (t.sign > 0 ? 'up' : 'down')}>{t.sign > 0 ? '+' : '−'} {window.fmt.money(amt, 2)}</span>
                  <span className="aaj-prev-eq"><Icon name="chevRight" size={13} /></span>
                  <span className="aaj-prev-item"><span className="lbl">ยอดคงเหลือใหม่</span><span className="mono new">{window.fmt.money(newBalance, 2)}</span></span>
                </div>
              )}
            </div>
          </AajField>
        </div>

        <div className="ap-hint muted">
          <Icon name="info" size={13} /> เลขที่ใบทำรายการจะถูกสร้างอัตโนมัติเมื่อบันทึก · ประเภท “ปรับเพิ่มยอดลูกหนี้” จะเพิ่มยอดคงเหลือ ส่วน “ปรับลดยอดลูกหนี้” จะลดยอดคงเหลือ
        </div>

        <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 14, justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn" onClick={reset} disabled={!member && !note && !amount}><Icon name="refresh" /> ล้างฟอร์ม</button>
          <button className="btn primary" onClick={save} disabled={!canSave}><Icon name="check" /> บันทึกปรับปรุง</button>
        </div>
      </div>

      {/* ── ทะเบียนรายการปรับปรุงล่าสุด ── */}
      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="head-bar" /><h3>รายการปรับปรุงล่าสุด</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {listFiltered.length} รายการ</span>
            <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายการปรับปรุง (.xlsx) แล้ว')}>Export</button>
          </div>
        </div>
        <div className="table-wrap adr-scroll" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th style={{ width: 150 }}>ใบทำรายการ</th>
              <th className="center" style={{ width: 90 }}>งวด</th>
              <th style={{ minWidth: 220 }}>สมาชิก</th>
              <th style={{ minWidth: 180 }}>ประเภทรายการ</th>
              <th className="right" style={{ width: 120 }}>ยอดเดิม</th>
              <th className="right" style={{ width: 120 }}>ยอดปรับปรุง</th>
              <th className="right" style={{ width: 120 }}>ยอดคงเหลือ</th>
              <th className="center" style={{ width: 100 }}>วันที่รายการ</th>
              <th style={{ minWidth: 150 }}>ผู้บันทึก</th>
              <th style={{ width: 44 }} />
            </tr></thead>
            <tbody>
              {listFiltered.length === 0 && <tr><td colSpan="10" className="center muted" style={{ padding: 28 }}>ยังไม่มีรายการปรับปรุง</td></tr>}
              {listFiltered.map(r => {
                const rt = aajType(r.type);
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td className="center mono">{r.period}</td>
                    <td><div className="lt-row-name">{r.memberName}</div><div className="lt-row-note muted mono">{r.memberCode}</div></td>
                    <td>
                      <span className={"chip " + (rt && rt.sign > 0 ? 'primary' : 'success')}>{r.type}</span>
                      <span style={{ fontSize: 12, marginLeft: 6 }}>{rt ? rt.l : r.type}</span>
                    </td>
                    <td className="right mono">{window.fmt.money(r.before, 2)}</td>
                    <td className="right mono" style={{ color: rt && rt.sign > 0 ? 'var(--brand-700)' : 'var(--danger)' }}>
                      {rt && rt.sign > 0 ? '+' : '−'}{window.fmt.money(r.amount, 2)}
                    </td>
                    <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(r.after, 2)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{aajThaiDate(r.txnDate)}</td>
                    <td style={{ fontSize: 12 }}>{r.by}<div className="muted mono" style={{ fontSize: 11 }}>{r.at}</div></td>
                    <td className="center"><button className="iv-doc-x" title="ลบรายการ" onClick={() => delRow(r.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                        <path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />
                        <path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />
                        <path d="M10 10.5v6M14 10.5v6" />
                      </svg>
                    </button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {searchOpen && window.MemberSearchModal && (
        <MemberSearchModal title="ค้นหาสมาชิก" source={aajMemberSource}
          searchFn={window.msSearchMembers ? (c) => window.msSearchMembers(aajMemberSource, c) : undefined}
          onClose={() => setSearchOpen(false)}
          onPick={(m) => { setMember(m); setSearchOpen(false); }} />
      )}

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> AGR = ปรับเพิ่มยอดลูกหนี้ · ARE = ปรับลดยอดลูกหนี้ · ADJ = ปรับปรุงยอดยกมา — ยอดคงเหลือ 0.00 หมายถึงนำส่งครบแล้ว
      </div>
    </div>
  );
}

Object.assign(window, { AgentAdjustPage });
})();
