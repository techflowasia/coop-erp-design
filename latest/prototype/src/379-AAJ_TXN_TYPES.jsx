// ════════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ปรับปรุงลูกหนี้ตัวแทน
//  บันทึกปรับปรุงยอดลูกหนี้ตัวแทนรายสมาชิก — เลือกงวด/ประเภทรายการ →
//  ค้นหาสมาชิก (เติมชื่อ + ยอดคงเหลือ) → ระบุยอดปรับปรุง + หมายเหตุ →
//  บันทึก (สร้างใบทำรายการอัตโนมัติ) → ทะเบียนรายการปรับปรุงล่าสุด
// ════════════════════════════════════════════════════════════════════
const { useState: aajUseState, useMemo: aajUseMemo } = React;

// ─── ประเภทรายการปรับปรุง (sign: +เพิ่ม / −ลด ยอดคงเหลือ) ─────────────
const AAJ_TXN_TYPES = [
  { v: 'AGR', l: 'ปรับเพิ่มยอดลูกหนี้ (ตั้งเรียกเก็บ)', sign: 1 },
  { v: 'ARE', l: 'ปรับลดยอดลูกหนี้ (นำส่งชำระ)', sign: -1 },
  { v: 'ADJ+', l: 'ปรับปรุงยอดยกมา — เพิ่ม', sign: 1 },
  { v: 'ADJ-', l: 'ปรับปรุงยอดยกมา — ลด', sign: -1 },
];
const aajType = (v) => AAJ_TXN_TYPES.find(t => t.v === v) || null;

const aajToday = () => new Date().toISOString().slice(0, 10);
const aajThaiDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
// งวดเรียกเก็บ default = ปี พ.ศ. + เดือนปัจจุบัน เช่น 256907
const aajDefaultPeriod = () => {
  const n = new Date();
  return String(n.getFullYear() + 543) + String(n.getMonth() + 1).padStart(2, '0');
};

// ─── ยอดคงเหลือลูกหนี้ตัวแทนของสมาชิก (demo — เสถียรตามรหัส) ───────────
//  ปกติดึงจากระบบจริง; ที่นี่คำนวณแบบ deterministic ให้ข้อมูลสาธิตมีความหลากหลาย
const aajBalanceOf = (m) => {
  if (!m) return 0;
  const digits = String(m.code).replace(/\D/g, '');
  const sum = digits.split('').reduce((a, c) => a + Number(c), 0);
  if (sum % 3 === 0) return 0;                       // นำส่งครบแล้ว
  const base = 18000 + (sum % 7) * 850 + (Number(digits.slice(-2)) || 0) * 12.25;
  return Math.round(base * 100) / 100;
};

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

function AajField({ label, required, children, span, hint }) {
  return (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}{required && <b className="req"> *</b>}{hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 6 }}>{hint}</span>}</span>
      {children}
    </label>
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

      {/* ── ฟอร์มปรับปรุง ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>รายการปรับปรุงลูกหนี้ตัวแทน</h3></div>

        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AajField label="งวดเรียกเก็บ" required>
            <input className="cfg-input mono" value={period} maxLength={6}
              onChange={e => setPeriod(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="เช่น 256907" />
          </AajField>
          <AajField label="ประเภทรายการ" required>
            <select className="cfg-input" value={txnType} onChange={e => setTxnType(e.target.value)}>
              {AAJ_TXN_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </AajField>
          <AajField label="ใบทำรายการ">
            <input className="cfg-input mono" value="AUTO" readOnly tabIndex={-1}
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-500)', fontWeight: 600 }} />
          </AajField>

          <AajField label="ทะเบียนสมาชิก" required hint="(คลิกเพื่อค้นหา)">
            <MemberSearchField member={member} onPick={setMember}
              source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
              title="ค้นหาสมาชิก — ปรับปรุงลูกหนี้ตัวแทน" placeholder="คลิกเพื่อค้นหาเลขทะเบียน / ชื่อสมาชิก…" />
          </AajField>
          <AajField label="วันที่ทำรายการ" required>
            <ErpDate value={txnDate} onChange={(v) => (e => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </AajField>
          <AajField label="วันที่ออกใบเสร็จ" required>
            <ErpDate value={receiptDate} onChange={(v) => (e => setReceiptDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
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
          <Icon name="info" size={13} /> เลขที่ใบทำรายการจะถูกสร้างอัตโนมัติเมื่อบันทึก · ประเภท “ปรับเพิ่ม” จะเพิ่มยอดคงเหลือ ส่วน “ปรับลด/นำส่งชำระ” จะลดยอดคงเหลือ
        </div>

        <div className="dep-submit-bar" style={{ flexDirection: 'row', marginTop: 14, justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn" onClick={reset} disabled={!member && !note && !amount}><Icon name="refresh" /> ล้างฟอร์ม</button>
          <button className="btn primary" onClick={save} disabled={!canSave}><Icon name="check" /> บันทึกปรับปรุง</button>
        </div>
      </div>

      {/* ── ทะเบียนรายการปรับปรุงล่าสุด ── */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
        <div className="toolbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--divider)' }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>รายการปรับปรุงล่าสุด</span>
          <span className="gc-count">{listFiltered.length} รายการ</span>
          <span className="spacer" />
          <button className="btn sm" onClick={() => onToast && onToast('ส่งออกรายการปรับปรุง (.xlsx) แล้ว')}><Icon name="download" /> Export</button>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
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
                    <td className="center"><button className="iv-doc-x" title="ลบรายการ" onClick={() => delRow(r.id)}><Icon name="trash" size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> AGR = ตั้งเรียกเก็บ (เพิ่ม) · ARE = นำส่งชำระ (ลด) · ADJ = ปรับปรุงยอดยกมา — ยอดคงเหลือ 0.00 หมายถึงนำส่งครบแล้ว
      </div>
    </div>
  );
}

Object.assign(window, { AgentAdjustPage });
