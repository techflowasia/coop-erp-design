// ═════════════════════════════════════════════════════════════════
//  ระบบลูกหนี้ตัวแทน › ลูกหนี้ตัวแทน (ทะเบียน) + รายละเอียดลูกหนี้ตัวแทน
//  หน้ารายการ: ค้นหา/กรองตามสังกัดตัวแทน → ตารางลูกหนี้ตัวแทน → เปิดรายละเอียด
//  หน้ารายละเอียด: ข้อมูลสมาชิก · ยอดสรุป · งวดที่ค้างชำระ · ประวัติรับชำระ
// ═════════════════════════════════════════════════════════════════
const { useState: adrUseState, useMemo: adrUseMemo } = React;

const ADR_SEL_KEY = 'coop_agent_debtor_selected_v1';
window.adrSelect = function (reg) {
  window.__adrSelected = reg;
  try { localStorage.setItem(ADR_SEL_KEY, reg || ''); } catch (e) {}
};
window.adrSelected = function () {
  if (window.__adrSelected) return window.__adrSelected;
  try { return localStorage.getItem(ADR_SEL_KEY) || ''; } catch (e) { return ''; }
};

// ── ทะเบียนลูกหนี้ตัวแทน (อ้างอิงยอดจาก AGP_ROWS ให้สอดคล้องทั้งระบบ) ──
window.adrRows = function () {
  return (window.AGP_ROWS || []).map((r, i) => {
    const billed = Number(r.agentAmt) || 0;
    const remaining = Number(r.remaining) || 0;
    return {
      seq: i + 1,
      reg: r.reg,
      name: r.name,
      memberDept: r.memberDept || '-',
      agentCode: r.agentCode || '-',
      agentName: r.agentName || '-',
      billed,
      paid: Math.max(billed - remaining, 0),
      remaining,
      status: remaining <= 0 ? 'clear' : (remaining >= billed ? 'unpaid' : 'partial'),
    };
  });
};
window.adrRow = (reg) => window.adrRows().find(r => r.reg === reg) || null;

window.ADR_STATUS = {
  clear:   { label: 'ชำระครบ',   chip: 'success' },
  partial: { label: 'ชำระบางส่วน', chip: 'warning' },
  unpaid:  { label: 'ค้างชำระ',   chip: 'danger' },
};

// งวดค้างชำระ / ประวัติรับชำระ (deterministic จากเลขทะเบียน)
window.adrPeriods = function (row) {
  if (!row) return [];
  const seed = parseInt(String(row.reg).replace(/\D/g, ''), 10) || 1;
  const count = row.remaining <= 0 ? 0 : (seed % 3) + 1;
  const per = count ? Math.round((row.remaining / count) * 100) / 100 : 0;
  const out = [];
  for (let i = 0; i < count; i++) {
    const month = ((seed + i) % 12) + 1;
    out.push({
      seq: i + 1,
      period: '2569/' + String(month).padStart(2, '0'),
      due: '25/' + String(month).padStart(2, '0') + '/2569',
      billed: per,
      remaining: i === count - 1 ? Math.round((row.remaining - per * (count - 1)) * 100) / 100 : per,
    });
  }
  return out;
};
window.adrPayments = function (row) {
  if (!row || row.paid <= 0) return [];
  const seed = parseInt(String(row.reg).replace(/\D/g, ''), 10) || 1;
  const n = (seed % 2) + 2;
  const per = Math.round((row.paid / n) * 100) / 100;
  const methods = ['เงินสด', 'เงินโอน', 'เช็ค'];
  const out = [];
  for (let i = 0; i < n; i++) {
    const month = ((seed + i) % 9) + 1;
    out.push({
      receipt: 'AR-69' + String((seed + i * 37) % 100000).padStart(5, '0'),
      date: '1' + ((i % 8) + 1) + '/' + String(month).padStart(2, '0') + '/2569',
      period: '2569/' + String(month).padStart(2, '0'),
      method: methods[(seed + i) % 3],
      amount: i === n - 1 ? Math.round((row.paid - per * (n - 1)) * 100) / 100 : per,
    });
  }
  return out;
};

function AdrStatusChip({ status }) {
  const s = window.ADR_STATUS[status] || window.ADR_STATUS.unpaid;
  return <span className={'chip ' + s.chip}>{s.label}</span>;
}

function AdrField({ label, children }) {
  return (
    <div className="ap-field">
      <label className="cfg-label">{label}</label>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  หน้า “ลูกหนี้ตัวแทน” — ทะเบียนลูกหนี้ตัวแทน
// ═════════════════════════════════════════════════════════════════
function AgentDebtorListPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ลูกหนี้ตัวแทน', current: true }], []);

  const all = adrUseMemo(() => window.adrRows(), []);
  const agents = adrUseMemo(() => {
    const seen = {};
    all.forEach(r => { seen[r.agentCode] = r.agentName; });
    return Object.keys(seen).map(code => ({ code, name: seen[code] }));
  }, [all]);

  const [agent, setAgent] = adrUseState('all');
  const [status, setStatus] = adrUseState('all');
  const [query, setQuery] = adrUseState('');

  const rows = adrUseMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(r =>
      (agent === 'all' || r.agentCode === agent) &&
      (status === 'all' || r.status === status) &&
      (!q || r.reg.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || String(r.memberDept).toLowerCase().includes(q))
    );
  }, [all, agent, status, query]);

  const sum = adrUseMemo(() => rows.reduce((a, r) => ({
    billed: a.billed + r.billed, paid: a.paid + r.paid, remaining: a.remaining + r.remaining,
  }), { billed: 0, paid: 0, remaining: 0 }), [rows]);

  const openDetail = (row) => {
    window.adrSelect(row.reg);
    window.location.hash = '#agent/registry-detail';
  };

  return (
    <div data-screen-label="หน้าลูกหนี้ตัวแทน (ทะเบียน)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ลูกหนี้ตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ทะเบียนลูกหนี้ตัวแทนรายสมาชิก — ยอดเรียกเก็บ ยอดรับชำระ และยอดคงค้างของแต่ละสังกัดตัวแทน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('ส่งออกทะเบียนลูกหนี้ตัวแทนเป็น Excel แล้ว')}>
          <Icon name="download" size={13} /> Excel
        </button>
      </div>

      {/* ── เงื่อนไขการค้นหา ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>เงื่อนไขการค้นหา</h3>
        </div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <AdrField label="สังกัดตัวแทน">
            <select className="cfg-input" value={agent} onChange={e => setAgent(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              {agents.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
            </select>
          </AdrField>
          <AdrField label="สถานะ">
            <select className="cfg-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="all">ทั้งหมด</option>
              <option value="unpaid">ค้างชำระ</option>
              <option value="partial">ชำระบางส่วน</option>
              <option value="clear">ชำระครบ</option>
            </select>
          </AdrField>
          <AdrField label="ค้นหา">
            <input className="cfg-input" value={query} onChange={e => setQuery(e.target.value)}
                   placeholder="เลขทะเบียน / ชื่อสมาชิก / สังกัด…" />
          </AdrField>
        </div>
      </div>

      {/* ── ตารางทะเบียนลูกหนี้ตัวแทน ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการลูกหนี้ตัวแทน</h3>
          <div className="head-actions">
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {rows.length} ราย</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0 }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 56 }}>ลำดับ</th>
                <th style={{ width: 96 }}>ทะเบียน</th>
                <th style={{ minWidth: 210 }}>ชื่อ–สกุล</th>
                <th style={{ minWidth: 200 }}>สังกัดสมาชิก</th>
                <th style={{ width: 140 }}>สังกัดตัวแทน</th>
                <th className="right" style={{ width: 120 }}>ยอดเรียกเก็บ</th>
                <th className="right" style={{ width: 120 }}>รับชำระแล้ว</th>
                <th className="right" style={{ width: 120 }}>คงค้าง</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
                <th className="center" style={{ width: 96 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="10" className="center muted" style={{ padding: '26px 12px' }}>ไม่พบรายการที่ตรงกับเงื่อนไข</td></tr>
              )}
              {rows.map(r => (
                <tr key={r.reg}>
                  <td className="center muted">{r.seq}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.reg}</td>
                  <td>{r.name}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{r.memberDept}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.agentCode} · {r.agentName}</td>
                  <td className="right mono">{window.fmt.money(r.billed, 2)}</td>
                  <td className="right mono">{window.fmt.money(r.paid, 2)}</td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.remaining, 2)}</td>
                  <td className="center"><AdrStatusChip status={r.status} /></td>
                  <td className="center">
                    <button className="btn text sm" onClick={() => openDetail(r)}><Icon name="search" size={12} /> รายละเอียด</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="fbt-foot">
                <td colSpan="5" className="right">รวม :</td>
                <td className="right mono">{window.fmt.money(sum.billed, 2)}</td>
                <td className="right mono">{window.fmt.money(sum.paid, 2)}</td>
                <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(sum.remaining, 2)}</td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  หน้า “รายละเอียดลูกหนี้ตัวแทน” — ทะเบียนเคลื่อนไหวลูกหนี้ตัวแทนรายปี
// ═════════════════════════════════════════════════════════════════

// รายการเคลื่อนไหว (AGR = เรียกเก็บเพิ่ม, ARE = รับชำระ/ตัดลด) รายงวดต่อปี
window.adrLedger = function (row, fromYear, toYear) {
  if (!row) return [];
  const seed = parseInt(String(row.reg).replace(/[^0-9]/g, ''), 10) || 1;
  const base = row.billed > 0 ? row.billed : 21000;
  const thisYear = 2569;
  const out = [];
  let seq = 1;
  for (let y = Number(fromYear); y <= Number(toYear); y++) {
    if (y > thisYear || y < thisYear - 4) continue;
    const months = y === thisYear ? 8 : 12;
    for (let m = 1; m <= months; m++) {
      const raw = base + (((seed * 3 + m * 17 + y) % 41) - 20) * 3;
      const amt = Math.round(raw * 4) / 4;
      const period = y + '/' + String(m).padStart(2, '0');
      const yy = String(y).slice(-2);
      const mm = String(m).padStart(2, '0');
      const d1 = String(11 + ((seed + m) % 6)).padStart(2, '0');
      const d2 = String(25 + ((seed + m * 2) % 5)).padStart(2, '0');
      const h1 = String(8 + ((seed + m) % 3)).padStart(2, '0');
      const n1 = String((seed * 7 + m * 11) % 60).padStart(2, '0');
      const h2 = String(9 + ((seed + m) % 8)).padStart(2, '0');
      const n2 = String((seed * 5 + m * 23) % 60).padStart(2, '0');
      out.push({
        seq: seq++, docDate: d1 + '/' + mm + '/' + y, txnDate: d1 + '/' + mm + '/' + y,
        code: 'AGR', period, add: amt, less: null, balance: amt, payType: '', payType2: '',
        by: d1 + '/' + mm + '/' + yy + ' ' + h1 + ':' + n1 + '  PROG',
        note: 'เรียกเก็บงวด ' + period, operator: 'PROG',
      });
      out.push({
        seq: seq++, docDate: d2 + '/' + mm + '/' + y, txnDate: d2 + '/' + mm + '/' + y,
        code: 'ARE', period, add: null, less: amt, balance: 0, payType: '', payType2: 'CQE',
        by: d2 + '/' + mm + '/' + yy + ' ' + h2 + ':' + n2 + '  DISKCUT',
        note: 'รับชำระผ่านตัวแทน งวด ' + period, operator: 'DISKCUT',
      });
    }
  }
  return out;
};

function AdrMemberPicker({ member, onPick, source }) {
  const MSF = window.MemberSearchField;
  if (!MSF) {
    return <input className="cfg-input" value={member ? (member.code || '') : ''} readOnly
                  placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />;
  }
  return (
    <MSF member={member} source={source}
         searchFn={window.msSearchMembers ? (c) => window.msSearchMembers(source, c) : undefined}
         title="ค้นหาสมาชิก" changeLabel="เปลี่ยนสมาชิก"
         placeholder="คลิกเพื่อค้นหาสมาชิก…"
         onPick={onPick} />
  );
}

function AgentDebtorDetailPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([
    { label: 'ลูกหนี้ตัวแทน', onClick: () => { window.location.hash = '#agent/registry'; } },
    { label: 'รายละเอียดลูกหนี้ตัวแทน', current: true },
  ], []);

  const all = adrUseMemo(() => window.adrRows(), []);

  const [reg, setReg] = adrUseState('');
  const [fromY, setFromY] = adrUseState('2569');
  const [toY, setToY] = adrUseState('2569');
  const [applied, setApplied] = adrUseState({ reg: '', from: '2569', to: '2569' });

  const row = adrUseMemo(() => all.find(r => r.reg === reg) || null, [all, reg]);
  const shownRow = adrUseMemo(() => (applied.reg ? all.find(r => r.reg === applied.reg) : null) || null, [all, applied]);
  const ledgerAll = adrUseMemo(() => window.adrLedger(shownRow, applied.from, applied.to), [shownRow, applied]);
  const ledger = adrUseMemo(() => ledgerAll.slice(0, 16), [ledgerAll]);

  const lastPeriod = ledger.length ? ledger[ledger.length - 1].period : '';
  const outstanding = shownRow ? shownRow.remaining : 0;

  // เลือกจาก popup แล้วแสดงรายการเคลื่อนไหวทันที
  const pickMember = (m) => {
    if (!m) { setReg(''); setApplied({ reg: '', from: fromY, to: toY }); return; }
    const code = m.code || m.memberNo || '';
    const hit = all.find(r => r.reg === code) || all.find(r => r.name === m.name);
    const next = hit ? hit.reg : '';
    setReg(next);
    setApplied({ reg: next, from: fromY, to: toY });
    if (next) window.adrSelect(next); else onToast && onToast('ไม่พบข้อมูลลูกหนี้ตัวแทนของสมาชิกรายนี้');
  };

  const doSearch = () => {
    if (!row) { onToast && onToast('กรุณาเลือกสมาชิกก่อนค้นหา'); return; }
    if (Number(fromY) > Number(toY)) { onToast && onToast('ปีเริ่มต้นต้องไม่มากกว่าปีสิ้นสุด'); return; }
    setApplied({ reg, from: fromY, to: toY });
    window.adrSelect(reg);
  };
  const doReset = () => {
    setFromY('2569'); setToY('2569');
    setReg(''); setApplied({ reg: '', from: '2569', to: '2569' });
    window.adrSelect('');
  };

  // แหล่งข้อมูลของ popup ค้นหา = สมาชิกที่มีลูกหนี้ตัวแทน
  const memberSource = adrUseMemo(() => all.map(r => ({
    code: r.reg, name: r.name, dept: r.memberDept, deptCode: String(r.memberDept).split(':')[0],
    type: 'สมาชิกถาวร', status: 'ปฏิบัติงาน',
  })), [all]);
  const pickerMember = row ? { code: row.reg, name: row.name, dept: row.memberDept } : null;

  return (
    <div data-screen-label="หน้ารายละเอียดลูกหนี้ตัวแทน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายละเอียดลูกหนี้ตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ค้นหาสมาชิกเพื่อแสดงรายการเคลื่อนไหวลูกหนี้ตัวแทนรายงวด ตามช่วงปีที่เลือก
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" disabled={!shownRow}
                onClick={() => onToast && onToast('ส่งออกรายละเอียดลูกหนี้ตัวแทนเป็น Excel แล้ว')}>
          <Icon name="download" size={13} /> Excel
        </button>
        <button className="btn sm" disabled={!shownRow}
                onClick={() => onToast && onToast('เตรียมพิมพ์รายละเอียดลูกหนี้ตัวแทน ' + (shownRow ? shownRow.reg : ''))}>
          <Icon name="print" size={13} /> พิมพ์
        </button>
      </div>

      {/* ── เงื่อนไขการค้นหา ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>เงื่อนไขการค้นหา</h3>
        </div>

        <div className="ap-form-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,0.55fr) minmax(0,0.55fr)', alignItems: 'start' }}>
          <AdrField label="เลขสมาชิก">
            <AdrMemberPicker member={pickerMember} source={memberSource} onPick={pickMember} />
          </AdrField>
          <AdrField label="ชื่อ–สกุล">
            <input className="cfg-input" value={row ? row.name : ''} readOnly placeholder="—" />
          </AdrField>
          <div className="ap-field" style={{ gridColumn: 'span 2', gridRow: 'span 2', alignSelf: 'stretch', display: 'flex' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr', border: '1px solid var(--line, #d9d9d9)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--brand-100, #eafef2)', color: 'var(--brand, #237450)', borderRight: '1px solid var(--line, #d9d9d9)', borderBottom: '1px solid var(--line, #d9d9d9)' }}>งวดเรียกเก็บ</div>
              <div style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'var(--brand-100, #eafef2)', color: 'var(--brand, #237450)', borderBottom: '1px solid var(--line, #d9d9d9)' }}>ยอดค้าง</div>
              <div className="mono" style={{ padding: '0 10px', fontSize: 17, borderRight: '1px solid var(--line, #d9d9d9)', minHeight: 34, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{lastPeriod}</div>
              <div className="mono" style={{ padding: '0 10px', fontSize: 18, fontWeight: 700, background: '#fff6cc', minHeight: 34, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                {shownRow ? window.fmt.money(outstanding, 2) : ''}
              </div>
            </div>
          </div>
          <div className="ap-field" style={{ gridColumn: '1 / span 2' }}>
            <label>สังกัด</label>
            <input className="cfg-input" value={row ? row.memberDept : ''} readOnly placeholder="—" style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 13, paddingBottom: 8 }}>แสดงรายการข้อมูล ระหว่างปี</span>
          <div style={{ width: 110 }}>
            <input className="cfg-input mono" style={{ textAlign: 'center' }} value={fromY} inputMode="numeric" maxLength={4}
                   onChange={e => setFromY(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} />
          </div>
          <span style={{ fontSize: 13, paddingBottom: 8 }}>ถึง</span>
          <div style={{ width: 110 }}>
            <input className="cfg-input mono" style={{ textAlign: 'center' }} value={toY} inputMode="numeric" maxLength={4}
                   onChange={e => setToY(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} />
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn primary" onClick={doSearch} style={{ minWidth: 96, justifyContent: 'center', textAlign: 'center' }}>ค้นหา</button>
          <button className="btn" onClick={doReset} style={{ minWidth: 96, justifyContent: 'center', textAlign: 'center' }}>รีเซ็ต</button>
        </div>
      </div>

      {/* ── ตารางรายการเคลื่อนไหว ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการเคลื่อนไหวลูกหนี้ตัวแทน</h3>
          <div className="head-actions">
            <span className="muted" style={{ fontSize: 11.5 }}>
              {shownRow ? ((applied.from === applied.to ? 'ปี ' + applied.from : 'ปี ' + applied.from + ' – ' + applied.to) + ' · แสดง ' + ledger.length + ' จาก ' + ledgerAll.length + ' รายการ') : ''}
            </span>
          </div>
        </div>
        <div className="table-wrap adr-scroll" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 1520, tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th className="center" rowSpan="2" style={{ width: 56 }}>ลำดับ</th>
                <th className="center" rowSpan="2" style={{ width: 118 }}>วันที่ใบทำรายการ</th>
                <th className="center" rowSpan="2" style={{ width: 108 }}>วันที่รายการ</th>
                <th className="center" rowSpan="2" style={{ width: 84 }}>รหัสรายการ</th>
                <th className="center" rowSpan="2" style={{ width: 94 }}>งวดรายการ</th>
                <th className="center" colSpan="2" style={{ width: 240 }}>ยอดทำรายการ</th>
                <th className="right" rowSpan="2" style={{ width: 120 }}>ยอดคงเหลือ</th>
                <th className="center" rowSpan="2" style={{ width: 86 }}>ประเภท<br />ชำระ</th>
                <th className="center" rowSpan="2" style={{ width: 86 }}>ประเภท<br />ชำระ</th>
                <th className="center" rowSpan="2" style={{ minWidth: 190 }}>ผู้บันทึกรายการ</th>
                <th className="center" rowSpan="2" style={{ minWidth: 180 }}>หมายเหตุ</th>
                <th className="center" rowSpan="2" style={{ minWidth: 140 }}>ผู้ทำรายการ</th>
              </tr>
              <tr>
                <th className="right" style={{ width: 120 }}>เพิ่ม</th>
                <th className="right" style={{ width: 120 }}>ลด</th>
              </tr>
            </thead>
            <tbody>
              {!shownRow && (
                <tr><td colSpan="13" className="center muted" style={{ padding: '30px 12px' }}>ค้นหาและเลือกสมาชิกเพื่อแสดงรายการเคลื่อนไหว</td></tr>
              )}
              {shownRow && ledger.length === 0 && (
                <tr><td colSpan="13" className="center muted" style={{ padding: '30px 12px' }}>ไม่พบรายการในช่วงปีที่เลือก</td></tr>
              )}
              {ledger.map(r => (
                <tr key={r.seq}>
                  <td className="center muted">{r.seq}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.docDate}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.txnDate}</td>
                  <td className="center mono" style={{ fontSize: 12, fontWeight: 600 }}>{r.code}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.period}</td>
                  <td className="right mono">{r.add != null ? window.fmt.money(r.add, 2) : ''}</td>
                  <td className="right mono">{r.less != null ? window.fmt.money(r.less, 2) : ''}</td>
                  <td className="right mono" style={{ fontWeight: r.balance > 0 ? 600 : 400 }}>{window.fmt.money(r.balance, 2)}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.payType}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.payType2}</td>
                  <td className="mono muted" style={{ fontSize: 11.5, whiteSpace: 'pre' }}>{r.by}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{r.note}</td>
                  <td className="center mono" style={{ fontSize: 12 }}>{r.operator}</td>
                </tr>
              ))}
            </tbody>
            {shownRow && ledger.length > 0 && (
              <tfoot>
                <tr className="fbt-foot">
                  <td colSpan="5" className="right">รวม :</td>
                  <td className="right mono">{window.fmt.money(ledger.reduce((a, r) => a + (r.add || 0), 0), 2)}</td>
                  <td className="right mono">{window.fmt.money(ledger.reduce((a, r) => a + (r.less || 0), 0), 2)}</td>
                  <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(ledger[ledger.length - 1].balance, 2)}</td>
                  <td colSpan="5" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AgentDebtorListPage, AgentDebtorDetailPage });
