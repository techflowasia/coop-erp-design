// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › เงินสดย่อย (Petty Cash) — workspace + modals
//  หน้าเดียวครบวงจร imprest: ตั้งวงเงิน / เบิก / ค่าใช้จ่าย / แนบหลักฐาน /
//  ส่งเคลียร์ / อนุมัติ / เติมเงิน / ตรวจยอด / รายงาน / ลงบัญชีอัตโนมัติ
// ════════════════════════════════════════════════════════════════════
const { useState: pcUseState, useMemo: pcUseMemo, useRef: pcUseRef } = React;

const pcNum = (v) => Number(String(v == null ? '' : v).replace(/,/g, '')) || 0;
const pcTodayIso = () => new Date().toISOString().slice(0, 10);

// ─── ฟิลด์ในโมดัล (label + เนื้อหา) ─────────────────────────────────
function PcFld({ label, required, hint, span2, children }) {
  return (
    <div className={"bud-fld" + (span2 ? ' span2' : '')}>
      <label className="lt-modal-label">{label}{required && <span className="cfg-required"> *</span>}</label>
      {children}
      {hint && <div className="bud-fld-hint">{hint}</div>}
    </div>
  );
}

// ─── โครงโมดัลมาตรฐาน ───────────────────────────────────────────────
function PcModal({ icon, title, sub, width, onClose, children }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: width || 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={icon} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            {sub && <div className="muted" style={{ fontSize: 11 }}>{sub}</div>}
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}

// ─── แถวเดบิต/เครดิต (ใช้ในพรีวิวและโมดัลลงบัญชี) ───────────────────
function PcEntryTable({ entries }) {
  const tot = entries.reduce((t, e) => { t.d += e.debit; t.c += e.credit; return t; }, { d: 0, c: 0 });
  return (
    <table className="tbl pc-gl-tbl">
      <thead><tr><th style={{ width: 90 }}>รหัสบัญชี</th><th>ชื่อบัญชี</th><th className="right" style={{ width: 110 }}>เดบิต</th><th className="right" style={{ width: 110 }}>เครดิต</th></tr></thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={i}>
            <td className="mono">{e.acct}</td>
            <td style={e.credit ? { paddingLeft: 24 } : null}>{e.name}</td>
            <td className="right mono">{e.debit ? window.fmt.money(e.debit) : '—'}</td>
            <td className="right mono">{e.credit ? window.fmt.money(e.credit) : '—'}</td>
          </tr>
        ))}
        <tr className="pc-gl-tot">
          <td colSpan={2} className="right">รวม</td>
          <td className="right mono">{window.fmt.money(tot.d)}</td>
          <td className="right mono">{window.fmt.money(tot.c)}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   หน้าหลัก                                                       │
// ╰─────────────────────────────────────────────────────────────────╯
function PettyCashWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [fund, setFund] = pcUseState(window.pcFundLoad);
  const [list, setList] = pcUseState(window.pcLoad);
  const [view, setView] = pcUseState('ledger');
  const [sel, setSel] = pcUseState(() => new Set());
  const [modal, setModal] = pcUseState(null);   // {kind, tx?}

  const persist = (next) => { setList(next); window.pcSave(next); };
  const saveFund = (f) => { setFund(f); window.pcFundSave(f); };

  const rows = pcUseMemo(() => window.pcWithBalance(list).reverse(), [list]);
  const rec = pcUseMemo(() => window.pcReconcile(list, fund), [list, fund]);
  const clearedTotal = pcUseMemo(() => list.filter(t => t.type === 'expense' && t.status === 'cleared').reduce((s, t) => s + Number(t.amount || 0), 0), [list]);
  const pendingClearCount = pcUseMemo(() => list.filter(t => t.status === 'pending_clear').length, [list]);
  const draftSel = pcUseMemo(() => rows.filter(r => sel.has(r.id) && r.status === 'draft'), [rows, sel]);

  // ── การกระทำ ──
  const addTx = (tx, msg) => {
    const id = window.pcNextNo(list, tx.date);
    const rec2 = { id, by: 'นางจันทร์เพ็ญ มาลี', files: [], ...tx };
    persist([...list, rec2]);
    audit.log && audit.log({ action: 'create', module: 'บัญชี — เงินสดย่อย', target: id, summary: msg });
    onToast && onToast(msg);
    setModal(null);
    return id;
  };

  const submitClear = () => {
    if (!draftSel.length) { onToast && onToast('เลือกค่าใช้จ่าย (สถานะร่าง) ที่ต้องการส่งเคลียร์ก่อน'); return; }
    const ids = new Set(draftSel.map(r => r.id));
    persist(list.map(t => ids.has(t.id) ? { ...t, status: 'pending_clear' } : t));
    audit.log && audit.log({ action: 'update', module: 'บัญชี — เงินสดย่อย', target: `${draftSel.length} รายการ`, summary: `ส่งเคลียร์เงินสดย่อย ${draftSel.length} รายการ` });
    onToast && onToast(`ส่งเคลียร์ ${draftSel.length} รายการ — รออนุมัติ`);
    setSel(new Set());
  };

  const approveClear = () => {
    const n = list.filter(t => t.status === 'pending_clear').length;
    persist(list.map(t => t.status === 'pending_clear' ? { ...t, status: 'cleared' } : t));
    audit.log && audit.log({ action: 'approve', module: 'บัญชี — เงินสดย่อย', target: `${n} รายการ`, summary: `อนุมัติการเคลียร์เงินสดย่อย ${n} รายการ` });
    onToast && onToast(`อนุมัติการเคลียร์ ${n} รายการเรียบร้อย`);
    setModal(null);
  };

  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const fundBank = (window.VCH_COOP_BANKS || []).find(b => b.v === fund.bank);

  return (
    <div data-screen-label="หน้าเงินสดย่อย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เงินสดย่อย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ผู้รักษาเงิน: <strong>{fund.custodian}</strong> · {fund.dept} · ตั้งวงเงินเมื่อ {window.fmt.date(fund.startDate)}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setModal({ kind: 'fund' })}><Icon name="cog" /> ตั้งวงเงิน</button>
        <button className="btn sm" onClick={() => setModal({ kind: 'advance' })}><Icon name="upload" /> เบิกเงินสดย่อย</button>
        <button className="btn sm" onClick={() => setModal({ kind: 'replenish' })}><Icon name="download" /> เติมเงิน</button>
        <button className="btn primary sm" onClick={() => setModal({ kind: 'expense' })}><Icon name="plus" /> บันทึกค่าใช้จ่าย</button>
      </div>

      {/* กระทบยอดวงเงิน */}
      <div className="pc-recon">
        <div className="pc-stat">
          <div className="pc-stat-lab">วงเงินสดย่อย</div>
          <div className="pc-stat-val">{window.fmt.money(rec.ceiling)}</div>
          <div className="pc-stat-sub muted">{fundBank ? fundBank.l.split('·')[0] : '—'}</div>
        </div>
        <div className="pc-stat-op">=</div>
        <div className="pc-stat accent">
          <div className="pc-stat-lab">เงินสดคงเหลือในมือ</div>
          <div className="pc-stat-val">{window.fmt.money(rec.cash)}</div>
          <div className="pc-stat-sub muted">ตรวจนับจริง ณ ปัจจุบัน</div>
        </div>
        <div className="pc-stat-op">+</div>
        <div className="pc-stat">
          <div className="pc-stat-lab">ค่าใช้จ่ายรอเติมคืน</div>
          <div className="pc-stat-val">{window.fmt.money(rec.pendingExp)}</div>
          <div className="pc-stat-sub muted">ใบเสร็จที่ยังไม่เติมเงิน</div>
        </div>
        <div className="pc-stat-op">+</div>
        <div className="pc-stat">
          <div className="pc-stat-lab">เงินทดรองค้างล้าง</div>
          <div className="pc-stat-val">{window.fmt.money(rec.openAdvance)}</div>
          <div className="pc-stat-sub muted">เบิกแล้วรอล้างบัญชี</div>
        </div>
        <div className="pc-recon-flag">
          {rec.balanced
            ? <span className="pill ok"><Icon name="check" size={11} /> กระทบยอดตรง</span>
            : <span className="pill bad"><Icon name="info" size={11} /> ต่าง {window.fmt.money(Math.abs(rec.diff))}</span>}
          {clearedTotal > 0 && <div className="muted pc-recon-note">พร้อมเติมเงิน {window.fmt.money(clearedTotal)} บาท</div>}
        </div>
      </div>

      {/* แถบสลับมุมมอง + เคลียร์ */}
      <div className="pc-toolbar">
        <div className="seg">
          <button className={"seg-btn" + (view === 'ledger' ? ' active' : '')} onClick={() => setView('ledger')}>รายการเคลื่อนไหว</button>
          <button className={"seg-btn" + (view === 'report' ? ' active' : '')} onClick={() => setView('report')}>รายงานการใช้</button>
        </div>
        <span className="spacer" />
        {view === 'ledger' && (
          <>
            <button className="btn sm" disabled={!draftSel.length} onClick={submitClear}>
              <Icon name="upload" /> ส่งเคลียร์{draftSel.length ? ` (${draftSel.length})` : ''}
            </button>
            <button className="btn sm accent" disabled={!pendingClearCount} onClick={() => setModal({ kind: 'clear' })}>
              <Icon name="check" /> อนุมัติการเคลียร์{pendingClearCount ? ` (${pendingClearCount})` : ''}
            </button>
          </>
        )}
      </div>

      {view === 'ledger'
        ? <PcLedger rows={rows} sel={sel} toggleSel={toggleSel}
                    onGL={(tx) => setModal({ kind: 'gl', tx })}
                    onFiles={(tx) => setModal({ kind: 'files', tx })} />
        : <PcReport list={list} />}

      {/* โมดัล */}
      {modal && modal.kind === 'fund' && <PcFundModal fund={fund} onClose={() => setModal(null)} onSave={(f) => {
        saveFund(f.fund);
        if (f.topUp > 0) addTx({ date: f.fund.startDate, type: 'setup', cat: '', desc: 'ตั้ง/ปรับวงเงินสดย่อย', amount: f.topUp, payee: '', status: 'posted', files: [] }, `ตั้งวงเงินสดย่อย ${window.fmt.money(f.fund.amount)} บาท`);
        else { setModal(null); onToast && onToast('บันทึกข้อมูลวงเงินสดย่อยแล้ว'); }
      }} />}

      {modal && modal.kind === 'advance' && <PcAdvanceModal onClose={() => setModal(null)}
        onSubmit={(d) => addTx({ date: d.date, type: 'advance', cat: '', desc: d.desc, amount: d.amount, payee: d.payee, status: 'open', files: d.files }, `เบิกเงินสดย่อย ${window.fmt.money(d.amount)} บาท — ${d.payee}`)} />}

      {modal && modal.kind === 'expense' && <PcExpenseModal onClose={() => setModal(null)}
        onSubmit={(d) => addTx({ date: d.date, type: 'expense', cat: d.cat, desc: d.desc, amount: d.amount, payee: d.payee, status: 'draft', files: d.files }, `บันทึกค่าใช้จ่ายเงินสดย่อย ${window.fmt.money(d.amount)} บาท`)} />}

      {modal && modal.kind === 'replenish' && <PcReplenishModal fund={fund} suggested={clearedTotal} onClose={() => setModal(null)}
        onSubmit={(d) => {
          // เติมเงิน + ทำเครื่องหมายค่าใช้จ่ายที่เคลียร์แล้วว่าเติมคืนแล้ว
          const id = window.pcNextNo(list, d.date);
          const next = list.map(t => (t.type === 'expense' && t.status === 'cleared') ? { ...t, status: 'replenished' } : t);
          next.push({ id, by: 'นางจันทร์เพ็ญ มาลี', date: d.date, type: 'replenish', cat: '', desc: d.desc, amount: d.amount, payee: '', status: 'posted', files: [] });
          persist(next);
          audit.log && audit.log({ action: 'create', module: 'บัญชี — เงินสดย่อย', target: id, summary: `เติมเงินสดย่อย ${window.fmt.money(d.amount)} บาท` });
          onToast && onToast(`เติมเงินสดย่อย ${window.fmt.money(d.amount)} บาท เรียบร้อย`);
          setModal(null);
        }} />}

      {modal && modal.kind === 'gl' && <PcGLModal tx={modal.tx} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'files' && <PcFilesModal tx={modal.tx} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'clear' && <PcClearModal list={list} onClose={() => setModal(null)} onApprove={approveClear} />}
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   ตารางรายการเคลื่อนไหว                                          │
// ╰─────────────────────────────────────────────────────────────────╯
if (!document.getElementById('pc-card-style')) {
  const st = document.createElement('style');
  st.id = 'pc-card-style';
  st.textContent = '.pc-recon { display: grid; grid-template-columns: 1fr 0 1fr 0 1fr 0 1fr 1fr; align-items: stretch; column-gap: 17px; row-gap: 12px; background: transparent; border: 0; box-shadow: none; padding: 0; }'
    + '.pc-recon .pc-stat { min-width: 0; background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; min-width: 0; text-align: left; }'
    + '.pc-recon .pc-stat-lab { font-size: 12.5px; font-weight: 600; color: var(--text); }'
    + '.pc-recon .pc-stat-val { font-size: 22px; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; font-family: inherit; font-variant-numeric: tabular-nums; }'
    + '.pc-recon .pc-stat-sub { font-size: 11px; }'
    + '.pc-recon .pc-stat.accent { margin: 0; background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.pc-recon .pc-stat.accent .pc-stat-lab, .pc-recon .pc-stat.accent .pc-stat-val { color: #237450; }'
    + '.pc-recon .pc-stat-op { display: flex; align-items: center; justify-content: center; width: 0; overflow: visible; font-size: 15px; font-weight: 700; color: var(--text-muted); padding: 0; }'
    + '.pc-recon .pc-recon-flag { min-width: 0; background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; margin-left: 17px; text-align: center; align-items: center; justify-content: center; }'
    + '@media (max-width: 1100px) { .pc-recon { grid-template-columns: 1fr 1fr; column-gap: 12px; } .pc-recon .pc-stat-op { display: none; } .pc-recon .pc-recon-flag { margin-left: 0; } }'
    + '@media (max-width: 560px) { .pc-recon { grid-template-columns: 1fr; } }';
  document.head.appendChild(st);
}

function PcLedger({ rows, sel, toggleSel, onGL, onFiles }) {
  return (
    <div className="search-card fbt-card">
      <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
        <table className="tbl pc-tbl" style={{ minWidth: 1040 }}>
          <thead>
            <tr>
              <th style={{ width: 34 }}></th>
              <th style={{ width: 92 }}>วันที่</th>
              <th style={{ width: 118 }}>เลขที่</th>
              <th style={{ width: 116 }}>ประเภท</th>
              <th style={{ minWidth: 240 }}>รายละเอียด</th>
              <th className="center" style={{ width: 64 }}>หลักฐาน</th>
              <th className="right" style={{ width: 96 }}>เงินเข้า</th>
              <th className="right" style={{ width: 96 }}>เงินออก</th>
              <th className="right" style={{ width: 104 }}>คงเหลือ</th>
              <th className="center" style={{ width: 104 }}>สถานะ</th>
              <th className="center" style={{ width: 70 }}>บัญชี</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const ty = window.PC_TYPES[r.type] || {};
              const st = window.pcStatus(r.status);
              const cat = r.type === 'expense' ? window.pcCat(r.cat) : null;
              const selectable = r.status === 'draft';
              const delta = window.pcCashDelta(r);
              return (
                <tr key={r.id}>
                  <td className="center">
                    {selectable && <input type="checkbox" className="pc-cb" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(r.date)}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.id}</td>
                  <td><span className={"chip " + (ty.tone || 'neutral')}>{ty.l}</span></td>
                  <td>
                    <div className="pc-desc">{r.desc}</div>
                    <div className="pc-meta muted">
                      {cat && <span className="pc-cat-tag">{cat.l}</span>}
                      {r.payee && <span>{cat ? ' · ' : ''}{r.payee}</span>}
                    </div>
                  </td>
                  <td className="center">
                    {r.files && r.files.length
                      ? <button className="pc-clip" onClick={() => onFiles(r)} title={`${r.files.length} ไฟล์แนบ`}><Icon name="attach" size={13} /> {r.files.length}</button>
                      : (r.type === 'expense' ? <span className="pc-noclip" title="ยังไม่มีหลักฐาน"><Icon name="attach" size={12} /></span> : <span className="muted">—</span>)}
                  </td>
                  <td className="right mono pc-in">{delta > 0 ? window.fmt.money(delta) : '—'}</td>
                  <td className="right mono pc-out">{delta < 0 ? window.fmt.money(-delta) : '—'}</td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(r._balance)}</td>
                  <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  <td className="center"><button className="btn text sm" onClick={() => onGL(r)} title="ดูการลงบัญชีอัตโนมัติ"><Icon name="report" size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ติ๊กเลือกค่าใช้จ่ายสถานะ “ร่าง” เพื่อส่งเคลียร์ · กดไอคอนบัญชีเพื่อดูคู่บัญชีเดบิต/เครดิตที่ระบบลงให้อัตโนมัติ
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   รายงานการใช้เงินสดย่อย (สรุปตามหมวด)                           │
// ╰─────────────────────────────────────────────────────────────────╯
function PcReport({ list }) {
  const data = pcUseMemo(() => {
    const exp = list.filter(t => t.type === 'expense' && t.status !== 'cancelled');
    const total = exp.reduce((s, t) => s + Number(t.amount || 0), 0) || 1;
    const byCat = {};
    exp.forEach(t => { const c = window.pcCat(t.cat); if (!byCat[c.v]) byCat[c.v] = { cat: c, count: 0, sum: 0 }; byCat[c.v].count++; byCat[c.v].sum += Number(t.amount || 0); });
    return { rows: Object.values(byCat).sort((a, b) => b.sum - a.sum), total: exp.reduce((s, t) => s + Number(t.amount || 0), 0), totalRef: total, count: exp.length };
  }, [list]);
  return (
    <div className="search-card fbt-card">
      <div className="bud-toolbar" style={{ padding: 0, border: 0, marginBottom: 10, background: 'transparent' }}><div style={{ fontWeight: 600, fontSize: 13 }}>สรุปการใช้เงินสดย่อยตามหมวดค่าใช้จ่าย</div></div>
      <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
        <table className="tbl" style={{ minWidth: 680 }}>
          <thead><tr>
            <th style={{ minWidth: 220 }}>หมวดค่าใช้จ่าย</th>
            <th className="mono" style={{ width: 90 }}>ผังบัญชี</th>
            <th className="center" style={{ width: 90 }}>จำนวนรายการ</th>
            <th className="right" style={{ width: 120 }}>ยอดรวม (บาท)</th>
            <th style={{ width: 200 }}>สัดส่วน</th>
          </tr></thead>
          <tbody>
            {data.rows.length === 0 && <tr><td colSpan={5} className="center muted" style={{ padding: '24px' }}>ยังไม่มีค่าใช้จ่าย</td></tr>}
            {data.rows.map(r => {
              const pct = Math.round(r.sum / data.totalRef * 100);
              return (
                <tr key={r.cat.v}>
                  <td><span className={"chip " + r.cat.tone}>{r.cat.l}</span></td>
                  <td className="mono">{r.cat.gl}</td>
                  <td className="center">{r.count}</td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.sum)}</td>
                  <td><div className="pc-bar-wrap"><div className="pc-bar" style={{ width: pct + '%' }} /><span className="pc-bar-pct">{pct}%</span></div></td>
                </tr>
              );
            })}
          </tbody>
          {data.rows.length > 0 && <tfoot><tr className="pc-rep-tot">
            <td colSpan={2} className="right">รวมค่าใช้จ่ายทั้งสิ้น</td>
            <td className="center">{data.count}</td>
            <td className="right mono">{window.fmt.money(data.total)}</td>
            <td></td>
          </tr></tfoot>}
        </table>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   โมดัล: ตั้งวงเงิน                                              │
// ╰─────────────────────────────────────────────────────────────────╯
function PcFundModal({ fund, onClose, onSave }) {
  const [amount, setAmount] = pcUseState(String(fund.amount || ''));
  const [custodian, setCustodian] = pcUseState(fund.custodian || '');
  const [dept, setDept] = pcUseState(fund.dept || '');
  const [bank, setBank] = pcUseState(fund.bank || (window.VCH_COOP_BANKS[0] || {}).v);
  const [startDate, setStartDate] = pcUseState(fund.startDate || pcTodayIso());
  const [err, setErr] = pcUseState('');
  const firstTime = !fund.set || !(window.pcLoad() || []).some(t => t.type === 'setup');

  const submit = (e) => {
    e.preventDefault();
    const a = pcNum(amount);
    if (!(a > 0)) { setErr('กรุณาระบุวงเงินให้ถูกต้อง'); return; }
    if (!custodian.trim()) { setErr('กรุณาระบุผู้รักษาเงิน'); return; }
    const newFund = { amount: a, custodian: custodian.trim(), dept: dept.trim(), bank, startDate, set: true };
    onSave({ fund: newFund, topUp: firstTime ? a : 0 });
  };

  return (
    <PcModal icon="cog" title="ตั้งวงเงินสดย่อย" sub="กำหนดวงเงิน imprest และผู้รักษาเงิน" onClose={onClose}>
      <form className="bud-form-grid" onSubmit={submit}>
        <PcFld label="วงเงินสดย่อย (บาท)" required hint="ยอด imprest ที่ตรึงไว้ — ตรวจนับเงินสด + ใบเสร็จต้องเท่ายอดนี้เสมอ">
          <input className="cfg-input mono" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value.replace(/[^\d.,]/g, '')); setErr(''); }} placeholder="30,000.00" />
        </PcFld>
        <PcFld label="วันที่ตั้งวงเงิน" required>
          <ErpDate value={startDate} onChange={(v) => (e => setStartDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
        </PcFld>
        <PcFld label="ผู้รักษาเงินสดย่อย" required span2>
          <input className="cfg-input" value={custodian} onChange={e => { setCustodian(e.target.value); setErr(''); }} placeholder="ชื่อ–สกุลผู้รับผิดชอบ" />
        </PcFld>
        <PcFld label="หน่วยงาน">
          <input className="cfg-input" value={dept} onChange={e => setDept(e.target.value)} placeholder="ฝ่ายการเงิน" />
        </PcFld>
        <PcFld label="เบิกจ่ายจากบัญชีธนาคาร">
          <select className="filter-select" style={{ width: '100%' }} value={bank} onChange={e => setBank(e.target.value)}>
            {(window.VCH_COOP_BANKS || []).map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
          </select>
        </PcFld>
        {firstTime && (
          <div className="bud-fld span2">
            <div className="pc-gl-preview">
              <div className="pc-gl-preview-h"><Icon name="report" size={12} /> ระบบจะลงบัญชีอัตโนมัติเมื่อตั้งวงเงิน</div>
              <PcEntryTable entries={window.pcEntries({ type: 'setup', amount: pcNum(amount) })} />
            </div>
          </div>
        )}
        {err && <div className="dep-error span2"><Icon name="info" size={13} /> {err}</div>}
        <div className="span2" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> บันทึกวงเงิน</button>
        </div>
      </form>
    </PcModal>
  );
}

// ─── โมดัล: เบิกเงินสดย่อย (เงินทดรอง) ───────────────────────────────
function PcAdvanceModal({ onClose, onSubmit }) {
  const [date, setDate] = pcUseState(pcTodayIso());
  const [payee, setPayee] = pcUseState('');
  const [desc, setDesc] = pcUseState('');
  const [amount, setAmount] = pcUseState('');
  const [files, setFiles] = pcUseState([]);
  const [err, setErr] = pcUseState('');
  const fileRef = pcUseRef(null);

  const submit = (e) => {
    e.preventDefault();
    const a = pcNum(amount);
    if (!payee.trim()) { setErr('กรุณาระบุผู้ขอเบิก'); return; }
    if (!(a > 0)) { setErr('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return; }
    onSubmit({ date, payee: payee.trim(), desc: desc.trim() || 'เบิกเงินทดรองจ่าย', amount: a, files });
  };

  return (
    <PcModal icon="upload" title="เบิกเงินสดย่อย (เงินทดรองจ่าย)" sub="จ่ายเงินสดให้ผู้ขอเบิกล่วงหน้า รอล้างบัญชีด้วยใบเสร็จ" onClose={onClose}>
      <form className="bud-form-grid" onSubmit={submit}>
        <PcFld label="ผู้ขอเบิก" required span2>
          <input className="cfg-input" value={payee} onChange={e => { setPayee(e.target.value); setErr(''); }} placeholder="ชื่อ–สกุลผู้รับเงินทดรอง" />
        </PcFld>
        <PcFld label="วัตถุประสงค์" span2>
          <input className="cfg-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="เช่น จัดประชุมใหญ่ / จัดซื้อเร่งด่วน" />
        </PcFld>
        <PcFld label="จำนวนเงิน (บาท)" required>
          <input className="cfg-input mono" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value.replace(/[^\d.,]/g, '')); setErr(''); }} placeholder="0.00" />
        </PcFld>
        <PcFld label="วันที่เบิก" required>
          <ErpDate value={date} onChange={(v) => (e => setDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
        </PcFld>
        <div className="bud-fld span2">
          <label className="lt-modal-label">เอกสารแนบ (บันทึกขอเบิก)</label>
          <PcFilePicker files={files} setFiles={setFiles} fileRef={fileRef} />
        </div>
        <div className="bud-fld span2">
          <div className="pc-gl-preview">
            <div className="pc-gl-preview-h"><Icon name="report" size={12} /> การลงบัญชีอัตโนมัติ</div>
            <PcEntryTable entries={window.pcEntries({ type: 'advance', amount: pcNum(amount) })} />
          </div>
        </div>
        {err && <div className="dep-error span2"><Icon name="info" size={13} /> {err}</div>}
        <div className="span2" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> บันทึกการเบิก</button>
        </div>
      </form>
    </PcModal>
  );
}

// ─── โมดัล: บันทึกค่าใช้จ่าย + แนบหลักฐาน ────────────────────────────
function PcExpenseModal({ onClose, onSubmit }) {
  const [date, setDate] = pcUseState(pcTodayIso());
  const [cat, setCat] = pcUseState(window.PC_CATEGORIES[0].v);
  const [desc, setDesc] = pcUseState('');
  const [payee, setPayee] = pcUseState('');
  const [amount, setAmount] = pcUseState('');
  const [files, setFiles] = pcUseState([]);
  const [err, setErr] = pcUseState('');
  const fileRef = pcUseRef(null);

  const submit = (e) => {
    e.preventDefault();
    const a = pcNum(amount);
    if (!desc.trim()) { setErr('กรุณาระบุรายละเอียดค่าใช้จ่าย'); return; }
    if (!(a > 0)) { setErr('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return; }
    onSubmit({ date, cat, desc: desc.trim(), payee: payee.trim(), amount: a, files });
  };

  return (
    <PcModal icon="plus" title="บันทึกค่าใช้จ่ายเงินสดย่อย" sub="ระบุหมวด รายละเอียด และแนบใบเสร็จ/หลักฐาน" width={600} onClose={onClose}>
      <form className="bud-form-grid" onSubmit={submit}>
        <PcFld label="หมวดค่าใช้จ่าย" required>
          <select className="filter-select" style={{ width: '100%' }} value={cat} onChange={e => setCat(e.target.value)}>
            {window.PC_CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
        </PcFld>
        <PcFld label="วันที่" required>
          <ErpDate value={date} onChange={(v) => (e => setDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
        </PcFld>
        <PcFld label="รายละเอียด" required span2>
          <input className="cfg-input" value={desc} onChange={e => { setDesc(e.target.value); setErr(''); }} placeholder="รายละเอียดค่าใช้จ่าย" />
        </PcFld>
        <PcFld label="ผู้รับเงิน / ร้านค้า">
          <input className="cfg-input" value={payee} onChange={e => setPayee(e.target.value)} placeholder="ชื่อร้าน / ผู้ขาย" />
        </PcFld>
        <PcFld label="จำนวนเงิน (บาท)" required>
          <input className="cfg-input mono" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value.replace(/[^\d.,]/g, '')); setErr(''); }} placeholder="0.00" />
        </PcFld>
        <div className="bud-fld span2">
          <label className="lt-modal-label">แนบใบเสร็จ / หลักฐาน</label>
          <PcFilePicker files={files} setFiles={setFiles} fileRef={fileRef} />
        </div>
        <div className="bud-fld span2">
          <div className="pc-gl-preview">
            <div className="pc-gl-preview-h"><Icon name="report" size={12} /> การลงบัญชีอัตโนมัติ</div>
            <PcEntryTable entries={window.pcEntries({ type: 'expense', cat, amount: pcNum(amount) })} />
          </div>
        </div>
        {err && <div className="dep-error span2"><Icon name="info" size={13} /> {err}</div>}
        <div className="span2" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> บันทึกค่าใช้จ่าย</button>
        </div>
      </form>
    </PcModal>
  );
}

// ─── โมดัล: เติมเงินสดย่อย ───────────────────────────────────────────
function PcReplenishModal({ fund, suggested, onClose, onSubmit }) {
  const [amount, setAmount] = pcUseState(String(suggested || ''));
  const [date, setDate] = pcUseState(pcTodayIso());
  const [err, setErr] = pcUseState('');
  const submit = (e) => {
    e.preventDefault();
    const a = pcNum(amount);
    if (!(a > 0)) { setErr('กรุณาระบุจำนวนเงินที่เติม'); return; }
    onSubmit({ amount: a, date, desc: 'เติมเงินสดย่อยคืนวงเงินตามใบเสร็จที่เคลียร์แล้ว' });
  };
  return (
    <PcModal icon="download" title="เติมเงินสดย่อย" sub="เติมเงินคืนวงเงิน imprest ตามยอดค่าใช้จ่ายที่อนุมัติเคลียร์แล้ว" onClose={onClose}>
      <form className="bud-form-grid" onSubmit={submit}>
        {suggested > 0
          ? <div className="bud-fld span2"><div className="pc-hint-ok"><Icon name="info" size={12} /> มีค่าใช้จ่ายที่เคลียร์แล้วพร้อมเติมคืน {window.fmt.money(suggested)} บาท</div></div>
          : <div className="bud-fld span2"><div className="pc-hint-warn"><Icon name="info" size={12} /> ยังไม่มีค่าใช้จ่ายที่อนุมัติเคลียร์ — เติมเงินจะเพิ่มยอดเงินสดในมือทันที</div></div>}
        <PcFld label="จำนวนเงินที่เติม (บาท)" required>
          <input className="cfg-input mono" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value.replace(/[^\d.,]/g, '')); setErr(''); }} placeholder="0.00" />
        </PcFld>
        <PcFld label="วันที่เติมเงิน" required>
          <ErpDate value={date} onChange={(v) => (e => setDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
        </PcFld>
        <div className="bud-fld span2">
          <div className="pc-gl-preview">
            <div className="pc-gl-preview-h"><Icon name="report" size={12} /> การลงบัญชีอัตโนมัติ</div>
            <PcEntryTable entries={window.pcEntries({ type: 'replenish', amount: pcNum(amount) })} />
          </div>
        </div>
        {err && <div className="dep-error span2"><Icon name="info" size={13} /> {err}</div>}
        <div className="span2" style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
          <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> เติมเงิน</button>
        </div>
      </form>
    </PcModal>
  );
}

// ─── โมดัล: อนุมัติการเคลียร์ ────────────────────────────────────────
function PcClearModal({ list, onClose, onApprove }) {
  const pending = list.filter(t => t.status === 'pending_clear');
  const total = pending.reduce((s, t) => s + Number(t.amount || 0), 0);
  return (
    <PcModal icon="check" title="อนุมัติการเคลียร์เงินสดย่อย" sub={`รายการรออนุมัติ ${pending.length} รายการ`} width={600} onClose={onClose}>
      <table className="tbl" style={{ marginBottom: 14 }}>
        <thead><tr><th>วันที่</th><th>รายละเอียด</th><th>หมวด</th><th className="right">จำนวนเงิน</th></tr></thead>
        <tbody>
          {pending.map(t => (
            <tr key={t.id}>
              <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(t.date)}</td>
              <td>{t.desc}</td>
              <td><span className={"chip " + window.pcCat(t.cat).tone}>{window.pcCat(t.cat).l}</span></td>
              <td className="right mono">{window.fmt.money(t.amount)}</td>
            </tr>
          ))}
          <tr className="pc-gl-tot"><td colSpan={3} className="right">รวมที่ขออนุมัติเคลียร์</td><td className="right mono">{window.fmt.money(total)}</td></tr>
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onApprove}><Icon name="check" /> อนุมัติการเคลียร์ทั้งหมด</button>
      </div>
    </PcModal>
  );
}

// ─── โมดัล: ดูการลงบัญชีอัตโนมัติ ────────────────────────────────────
function PcGLModal({ tx, onClose }) {
  return (
    <PcModal icon="report" title="การลงบัญชีอัตโนมัติ" sub={`${tx.id} · ${(window.PC_TYPES[tx.type] || {}).l}`} width={560} onClose={onClose}>
      <div className="pc-gl-doc">
        <div className="pc-gl-doc-row"><span className="muted">วันที่</span><span>{window.fmt.date(tx.date)}</span></div>
        <div className="pc-gl-doc-row"><span className="muted">รายละเอียด</span><span>{tx.desc}</span></div>
      </div>
      <PcEntryTable entries={window.pcEntries(tx)} />
      <div className="muted" style={{ fontSize: 11, marginTop: 10 }}><Icon name="info" size={11} /> ระบบสร้างคู่บัญชีนี้อัตโนมัติและส่งเข้าสมุดรายวันทั่วไปเมื่อรายการได้รับการอนุมัติ</div>
      <div style={{ marginTop: 14 }}><button className="btn block" style={{ justifyContent: 'center' }} onClick={onClose}>ปิด</button></div>
    </PcModal>
  );
}

// ─── โมดัล: ดูไฟล์แนบ ────────────────────────────────────────────────
function PcFilesModal({ tx, onClose }) {
  return (
    <PcModal icon="attach" title="หลักฐาน / เอกสารแนบ" sub={`${tx.id} · ${tx.desc}`} width={480} onClose={onClose}>
      <div className="pc-files">
        {(tx.files || []).map((f, i) => (
          <div key={i} className="pc-file-row"><Icon name="attach" size={14} /><span className="pc-file-name">{f}</span><span className="muted pc-file-meta">แนบโดย {tx.by}</span></div>
        ))}
        {(!tx.files || !tx.files.length) && <div className="muted center" style={{ padding: 16 }}>ยังไม่มีไฟล์แนบ</div>}
      </div>
      <div style={{ marginTop: 14 }}><button className="btn block" style={{ justifyContent: 'center' }} onClick={onClose}>ปิด</button></div>
    </PcModal>
  );
}

// ─── ตัวเลือกไฟล์แนบ (เก็บชื่อไฟล์) ──────────────────────────────────
function PcFilePicker({ files, setFiles, fileRef }) {
  const add = (list) => { const names = Array.from(list).map(f => f.name); setFiles([...files, ...names]); };
  return (
    <div>
      <input type="file" ref={fileRef} multiple style={{ display: 'none' }} accept="image/*,.pdf" onChange={e => { if (e.target.files?.length) add(e.target.files); e.target.value = ''; }} />
      <button type="button" className="btn dashed sm block" style={{ justifyContent: 'center' }} onClick={() => fileRef.current?.click()}>
        <Icon name="attach" /> เลือกไฟล์ใบเสร็จ / รูปถ่าย (PDF, รูปภาพ)
      </button>
      {files.length > 0 && (
        <div className="pc-file-chips">
          {files.map((f, i) => (
            <span key={i} className="pc-file-chip"><Icon name="attach" size={11} /> {f}<button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="ลบ"><Icon name="close" size={11} /></button></span>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PettyCashWorkspace });
