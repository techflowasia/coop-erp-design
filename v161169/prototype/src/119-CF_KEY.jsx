// ════════════════════════════════════════════════════════════════════
//  ระบบการเงิน — ตั้งยอดยกไป (Carry-forward balance)
//  บันทึก "ยอดยกไป" ของเงินสด/เงินคงเหลือ โดยระบุ "วันที่" และ "ยอดยกไป"
//  เก็บประวัติการตั้งยอด (list) ไว้ใน localStorage · ยอดล่าสุดคือยอดที่ใช้งาน
// ════════════════════════════════════════════════════════════════════
const { useState: cfUseState, useMemo: cfUseMemo } = React;

const CF_KEY = 'coop_carry_forward_v1';
const cfLoad = () => { try { return JSON.parse(localStorage.getItem(CF_KEY)) || null; } catch (e) { return null; } };
const cfSave = (list) => { try { localStorage.setItem(CF_KEY, JSON.stringify(list)); } catch (e) {} };
const cfNum = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
const cfToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ─── ข้อมูลตั้งต้น (seed) — ตัวอย่างยอดยกไปที่เคยตั้งไว้ ─────────────
const CF_SEED = [
  { id: 'CF-2569-0002', date: '2026-04-01', amount: 3803441.44, note: 'ยอดยกไปต้นไตรมาส 3/2569', by: 'มนตรี ศรีสุข', at: '2026-04-01 08:15' },
  { id: 'CF-2569-0001', date: '2026-01-02', amount: 3512980.00, note: 'ยอดยกไปต้นปีบัญชี 2569', by: 'มนตรี ศรีสุข', at: '2026-01-02 09:02' },
];

function CfField({ label, hint, required, children, style }) {
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}{hint && <span className="muted" style={{ fontWeight: 400 }}> {hint}</span>}</span>
      {children}
    </div>
  );
}

function CarryForwardPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const fmt = window.fmt;
  const [list, setList] = cfUseState(() => cfLoad() || CF_SEED);
  const [date, setDate] = cfUseState(cfToday());
  const [amount, setAmount] = cfUseState('');
  const [note, setNote] = cfUseState('');
  const [error, setError] = cfUseState('');

  const commit = (next) => { setList(next); cfSave(next); };

  // ยอดที่ใช้งาน = รายการวันที่ล่าสุด
  const active = cfUseMemo(() => {
    if (!list.length) return null;
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  }, [list]);

  const nextId = () => {
    const be = new Date().getFullYear() + 543;
    const prefix = `CF-${be}-`;
    const max = list.reduce((mx, r) => {
      if (typeof r.id === 'string' && r.id.startsWith(prefix)) {
        const n = parseInt(r.id.slice(prefix.length), 10);
        return n > mx ? n : mx;
      }
      return mx;
    }, 0);
    return prefix + String(max + 1).padStart(4, '0');
  };

  const clearForm = () => { setDate(cfToday()); setAmount(''); setNote(''); setError(''); };

  const doSave = () => {
    if (!date) { setError('กรุณาระบุวันที่ยอดยกไป'); return; }
    const amt = cfNum(amount);
    if (!amount || amt <= 0) { setError('กรุณาระบุยอดยกไปให้ถูกต้อง (มากกว่า 0)'); return; }
    if (list.some(r => r.date === date)) { setError(`มีการตั้งยอดยกไปของวันที่ ${fmt.date(date)} อยู่แล้ว — กรุณาลบรายการเดิมก่อน หรือเลือกวันที่อื่น`); return; }
    setError('');
    const id = nextId();
    const rec = { id, date, amount: amt, note: note.trim(), by: window.LC_USER || 'มนตรี ศรีสุข', at: `${cfToday()} ${new Date().toTimeString().slice(0, 5)}` };
    commit([rec, ...list]);
    clearForm();
    audit && audit.log && audit.log({
      action: 'create', module: 'การเงิน — ตั้งยอดยกไป',
      target: id, summary: `ตั้งยอดยกไป ${fmt.money(amt, 2)} บาท ณ วันที่ ${fmt.date(date)}`,
      changes: [
        { field: 'วันที่', before: '—', after: fmt.date(date) },
        { field: 'ยอดยกไป', before: '—', after: fmt.money(amt, 2) },
      ],
    });
    onToast && onToast(`ตั้งยอดยกไป ${fmt.money(amt, 2)} บาท (${id}) เรียบร้อยแล้ว`);
  };

  const removeRow = (id) => {
    commit(list.filter(r => r.id !== id));
    onToast && onToast(`ลบรายการยอดยกไป ${id} แล้ว`);
  };

  return (
    <div data-screen-label="ตั้งยอดยกไป">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div className="icr-form-title">
          <div>
            <h1>ตั้งยอดยกไป</h1>
            <div className="icr-form-sub">ระบบการเงิน · กำหนดยอดยกไปของเงินสดคงเหลือ โดยระบุวันที่และจำนวนเงิน</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" data-keep-top="" style={{ minWidth: 120, justifyContent: 'center' }} onClick={clearForm}>ล้างข้อมูล</button>
          <button className="btn primary sm" data-keep-top="" style={{ minWidth: 120, justifyContent: 'center' }} onClick={doSave}>บันทึกยอดยกไป</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <div className="cf-grid">
        {/* ── ฟอร์มตั้งยอดยกไป ── */}
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>ตั้งยอดยกไปใหม่</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px 16px' }}>
            <CfField label="วันที่" required>
              <window.ThaiDateField value={date} onChange={(v) => setDate(v)} />
            </CfField>
            <CfField label="ยอดยกไป" hint="(บาท)" required>
              <input className="cfg-input mono" type="number" min="0" step="0.01" value={amount}
                     onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ textAlign: 'right' }}
                     onKeyDown={(e) => e.key === 'Enter' && doSave()} />
            </CfField>
            <CfField label="หมายเหตุ" style={{ gridColumn: '1 / -1' }}>
              <input className="cfg-input" value={note} onChange={(e) => setNote(e.target.value)}
                     placeholder="เช่น ยอดยกไปต้นไตรมาส / อ้างอิงงวดบัญชี" maxLength={120} />
            </CfField>
          </div>
          <div className="cf-hint">
            <Icon name="info" size={14} />
            <span>ยอดยกไปที่บันทึกล่าสุด (ตามวันที่) จะถูกใช้เป็นยอดคงเหลือยกมาของงวดถัดไป · ไม่สามารถตั้งซ้ำวันที่เดียวกันได้</span>
          </div>
        </div>

        {/* ── ยอดยกไปที่ใช้งาน ── */}
        <div className="cf-total-card">
          <div className="cf-total-head"><span>ยอดยกไปที่ใช้งาน</span><Icon name="wallet" size={18} /></div>
          <div className="cf-total-value">{active ? fmt.money(active.amount, 2) : '—'}</div>
          <div className="cf-total-sub">{active ? `ณ วันที่ ${fmt.date(active.date)} · ${active.id}` : 'ยังไม่มีการตั้งยอดยกไป'}</div>
        </div>
      </div>

      {/* ── ประวัติการตั้งยอดยกไป ── */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>ประวัติการตั้งยอดยกไป</h3>
          <div className="head-actions"><span className="muted" style={{ fontSize: 12 }}>{list.length} รายการ</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 150 }}>เลขที่รายการ</th>
                <th style={{ width: 130 }}>วันที่</th>
                <th className="num" style={{ width: 180 }}>ยอดยกไป</th>
                <th>หมายเหตุ</th>
                <th style={{ width: 140 }}>ผู้บันทึก</th>
                <th className="center" style={{ width: 84 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan="6" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="wallet" size={22} /></div>ยังไม่มีรายการตั้งยอดยกไป</td></tr>
              ) : [...list].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => {
                const isActive = active && r.id === active.id;
                return (
                  <tr key={r.id}>
                    <td className="mono">{r.id}{isActive && <span className="pill ok" style={{ marginLeft: 8 }}>ใช้งาน</span>}</td>
                    <td className="mono">{fmt.date(r.date)}</td>
                    <td className="num mono">{fmt.money(r.amount, 2)}</td>
                    <td style={{ whiteSpace: 'normal' }}>{r.note || '—'}</td>
                    <td>{r.by}<div className="muted mono" style={{ fontSize: 11 }}>{r.at}</div></td>
                    <td className="center">
                      <button className="btn sm ex-row-btn del" title="ลบรายการ" onClick={() => removeRow(r.id)}><Icon name="trash" size={13} /> ลบ</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
    </div>
  );
}

Object.assign(window, { CarryForwardPage });
