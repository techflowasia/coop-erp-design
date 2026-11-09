// ════════════════════════════════════════════════════════════════════
//  ระบบงานสินเชื่อ — เบิกเงินกู้ค้างจ่าย (LoanPayoutPage)
//  รายการสัญญาเงินกู้พิเศษที่รอเบิกจ่ายเป็นงวด → ระบุวิธีจ่ายเงินกู้ราย
//  งวด → ยืนยันเพื่อส่ง Order ไปยัง การเงิน › อนุมัติจ่ายสินเชื่อ
//  (data: data-loan-payout.js · window.lpo*)
// ════════════════════════════════════════════════════════════════════
const { useState: lpoUseState, useMemo: lpoUseMemo } = React;

// ── คอลัมน์ "โครงการเงินกู้" — ตรรกะเดียวกับบันทึกจ่ายเงินกู้พิเศษ (โครงการพิเศษ, คงที่ต่อเลขใบขอกู้)
// ง-03 — แสดงโครงการ/รอบที่บันทึกไว้ในใบคำขอจริง (lpjProjectId · lpjRoundId) ไม่สุ่มจากเลขที่ใบคำขอ
function lpoProjectOf(r) {
  const pjs = window.lpjLoad ? window.lpjLoad() : [];
  let pj = pjs.find(p => p.id === r.lpjProjectId);
  if (!pj && r.projectKey) pj = pjs.find(p => p.id === String(r.projectKey).split('|')[0]);
  return pj || null;
}
function lpoProjectCell(r) {
  const pj = lpoProjectOf(r);
  const typeLbl = r.productCode + '-' + r.productName;
  if (!pj) return { title: 'ไม่อยู่ในโครงการ (กู้ปกติ)', sub: typeLbl, pid: '' };
  const rid = r.lpjRoundId || (r.projectKey ? String(r.projectKey).split('|')[1] : '');
  const rd = (pj.rounds || []).find(x => x.id === rid);
  return { title: rd ? rd.name : pj.name, sub: typeLbl, pid: pj.id };
}

// ── ช่องกรอกในตารางวิธีจ่าย (compact) ──────────────────────────────
function LpoCell({ value, onChange, placeholder, disabled, mono, width }) {
  return (
    <input
      className={"cfg-input lpo-cell" + (mono ? " mono" : "")}
      style={width ? { width } : undefined}
      value={value == null ? '' : value}
      placeholder={placeholder || 'โปรดระบุ…'}
      disabled={disabled}
      onChange={(e) => onChange && onChange(e.target.value)} />
  );
}

// ── ตารางวิธีจ่ายเงินกู้ (แถวอ่านอย่างเดียวของงวดที่เบิกแล้ว) ─────────
function LpoDisbursedTable({ inst }) {
  const t = window.lpoLinesTotal(inst.lines);
  return (
    <div className="table-wrap"><div className="table-scroll">
      <table className="tbl lpo-pay-tbl" style={{ minWidth: 1180 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 150 }}>จ่ายเงินกู้เป็น</th>
            <th>เลขที่บัญชี/เช็ค/ตั๋วแลกเงิน</th>
            <th>ธนาคารต้นทาง</th>
            <th>สาขาธนาคาร</th>
            <th>สาขาปลายทาง</th>
            <th>รหัสไปรษณีย์ปลายทาง</th>
            <th>ชื่อนามสกุลผู้สั่งจ่าย</th>
            <th className="num">ค่าธรรมเนียม</th>
            <th className="num">ค่าบริการ</th>
            <th className="num">ภาษี</th>
            <th className="num">รวมค่าโอน</th>
            <th className="num">จ่ายสุทธิ</th>
          </tr>
        </thead>
        <tbody>
          <tr className="lpo-inst-row"><td colSpan={12}>{window.lpoInstLabel(inst)}</td></tr>
          {inst.lines.map((l, i) => {
            const m = window.lpoPayMethod(l.method);
            return (
              <tr key={i}>
                <td>{m.l}</td>
                <td className="mono">{l.acct || '-'}</td>
                <td>{l.fromBank || '-'}</td>
                <td>{l.fromBranch || '-'}</td>
                <td>{l.toBranch || '-'}</td>
                <td className="mono">{l.zip || '-'}</td>
                <td>{l.payee || '-'}</td>
                <td className="num mono">{fmt.money(l.fee, 2)}</td>
                <td className="num mono">{fmt.money(l.service, 2)}</td>
                <td className="num mono">{fmt.money(l.tax, 2)}</td>
                <td className="num mono">{fmt.money(l.transferTotal, 2)}</td>
                <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(l.net, 2)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={7}>รวม{window.lpoInstLabel(inst)}</td>
            <td className="num mono">{fmt.money(t.fee, 2)}</td>
            <td className="num mono">{fmt.money(t.service, 2)}</td>
            <td className="num mono">{fmt.money(t.tax, 2)}</td>
            <td className="num mono">{fmt.money(t.transferTotal, 2)}</td>
            <td className="num mono" style={{ fontWeight: 700 }}>{fmt.money(t.net, 2)}</td>
          </tr>
        </tfoot>
      </table>
    </div></div>
  );
}

// ── ตารางแก้ไข "งวดที่เหลือ" (ระบุวิธีจ่าย) ─────────────────────────
function LpoEditableTable({ inst, lines, setLines, methods, title }) {
  const methodOpts = methods || window.LPO_REST_METHODS;
  const addRow = () => setLines([...lines, window.lpoLineFactory('')]);
  const delRow = (i) => setLines(lines.filter((_, idx) => idx !== i));
  const setField = (i, k, v) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const t = window.lpoLinesTotal(lines);

  return (
    <div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl lpo-pay-tbl" style={{ minWidth: 1220 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 168 }}>จ่ายเงินกู้เป็น</th>
              <th>เลขที่บัญชี/เช็ค/ตั๋วแลกเงิน</th>
              <th>ธนาคารต้นทาง</th>
              <th>สาขาธนาคาร</th>
              <th>สาขาปลายทาง</th>
              <th>รหัสไปรษณีย์ปลายทาง</th>
              <th>ชื่อนามสกุลผู้สั่งจ่าย</th>
              <th className="num">ค่าธรรมเนียม</th>
              <th className="num">ค่าบริการ</th>
              <th className="num">ภาษี</th>
              <th className="num">รวมค่าโอน</th>
              <th className="num">จ่ายสุทธิ</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            <tr className="lpo-inst-row"><td colSpan={13}>{title || window.lpoInstLabel(inst)}</td></tr>
            {lines.length === 0 && (
              <tr><td colSpan={13} className="muted center" style={{ padding: '18px 12px' }}>
                ยังไม่มีรายการวิธีจ่าย — กด “เพิ่มข้อมูล” เพื่อระบุวิธีจ่ายเงินกู้ของงวดนี้
              </td></tr>
            )}
            {lines.map((l, i) => {
              const picked = !!l.method;
              const need = window.lpoPayMethod(l.method).need || [];
              const on = (f) => picked && need.includes(f);
              // ยังไม่เลือกวิธีจ่าย → แสดงเฉพาะคอลัมน์วิธีจ่าย + ข้อความให้เลือกก่อน
              const dash = <span className="lpo-dash">-</span>;
              const txt = (f, mono) => on(f)
                ? <LpoCell mono={mono} value={l[f]} onChange={(v) => setField(i, f, v)} placeholder="โปรดระบุ…" />
                : dash;
              const money = (f) => picked
                ? <LpoCell mono value={l[f]} onChange={(v) => setField(i, f, v)} placeholder="0.00" />
                : dash;
              return (
                <tr key={i} className={picked ? '' : 'lpo-row-empty'}>
                  <td>
                    <select className="cfg-input lpo-cell" value={l.method}
                            onChange={(e) => setField(i, 'method', e.target.value)}>
                      <option value="">--- โปรดเลือก ---</option>
                      {window.LPO_PAY_METHODS.filter(m => methodOpts.includes(m.v) && m.enabled !== false && !m.deleted).map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </td>
                  {picked ? (
                    <>
                      <td>{txt('acct', true)}</td>
                      <td>{txt('fromBank')}</td>
                      <td>{txt('fromBranch')}</td>
                      <td>{txt('toBranch')}</td>
                      <td>{txt('zip', true)}</td>
                      <td>{txt('payee')}</td>
                      <td>{money('fee')}</td>
                      <td>{money('service')}</td>
                      <td>{money('tax')}</td>
                      <td>{money('transferTotal')}</td>
                      <td>{money('net')}</td>
                    </>
                  ) : (
                    <td colSpan={11} className="lpo-pick-hint">
                      <Icon name="info" size={12} /> เลือกรายการจ่ายเงินก่อน ระบบจะแสดงช่องกรอกข้อมูลที่เกี่ยวข้อง
                    </td>
                  )}
                  <td className="center">
                    <button className="lpo-del act-del" title="ลบรายการ" onClick={() => delRow(i)}><Icon name="trash" size={14} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {lines.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={7}>รวมงวดนี้</td>
                <td className="num mono">{fmt.money(t.fee, 2)}</td>
                <td className="num mono">{fmt.money(t.service, 2)}</td>
                <td className="num mono">{fmt.money(t.tax, 2)}</td>
                <td className="num mono">{fmt.money(t.transferTotal, 2)}</td>
                <td className="num mono" style={{ fontWeight: 700 }}>{fmt.money(t.net, 2)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div></div>
      <button className="btn text sm lpo-add" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มข้อมูล</button>
    </div>
  );
}

// ── หน้ารายละเอียด / ระบุวิธีจ่ายเงินกู้ (งวด) ───────────────────────
// ── Modal ประวัติการแก้ไข — ไทม์ไลน์จาก Audit Trail ──
const LPO_MODULES = ['สินเชื่อ — เบิกเงินกู้ค้างจ่าย'];

function LpoHistoryModal({ title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const all = (ctx && ctx.entries) || window.AUDIT_SEED || [];
  const rows = all
    .filter((e) => LPO_MODULES.includes(e.module))
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการแก้ไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>
              ยังไม่มีประวัติการแก้ไข
            </div>
          ) : (
            <div className="tx-timeline">
              {rows.map((e) => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{window.fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta">
                        <span>โดย {e.user}</span>
                        <span className="sep">·</span>
                        <span className="mono muted">{e.id}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn sm" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ── หน้ารายละเอียด / ระบุวิรีจ่ายเงินกู้ (งวด) ─────────────────
function LpoDetail({ rec, onBack, onConfirm, readOnly }) {
  const nextInst = window.lpoNextInstallment(rec);
  const disbursed = rec.installments.filter(i => i.state === 'disbursed');
  const [mode, setMode] = lpoUseState(rec.payoutMode || 'multi');
  const pullRest = () => {
    const p = window.lpoRestPlan ? window.lpoRestPlan(rec) : { lines: [], found: false };
    return { ...p, lines: p.found ? p.lines : [window.lpoLineFactory('')] };
  };
  const [plan, setPlan] = lpoUseState(pullRest);
  const [lines, setLines] = lpoUseState(() => plan.lines.map(l => ({ ...l })));
  const repull = () => { const p = pullRest(); setPlan(p); setLines(p.lines.map(l => ({ ...l }))); };
  const [histOpen, setHistOpen] = lpoUseState(false);
  const savedBadge = (() => {
    const entries = window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs ? window.savedBadgeTs(entries, LPO_MODULES, 'lpo.' + rec.id) : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  })();
  const sum = window.lpoInstSummary(rec);

  const netTotal = window.lpoLinesTotal(lines).net;
  // ง-02 / ง-04 — งวดที่เหลือเบิกได้หลายครั้งจนครบยอด
  const isRest = !!(nextInst && nextInst.no === 'rest');
  const draws = (nextInst && nextInst.draws) || [];
  const drawn = draws.reduce((t, d) => t + (Number(d.amount) || 0), 0);
  const remain = Math.max(0, (Number(nextInst && nextInst.amount) || 0) - drawn);

  const confirm = () => {
    const valid = lines.filter(l => l.method);
    if (!readOnly && valid.length === 0) { onConfirm(null, 'กรุณาระบุวิธีจ่ายเงินกู้อย่างน้อย 1 รายการก่อนยืนยัน'); return; }
    onConfirm({ inst: nextInst, lines: valid, netTotal });
  };

  return (
    <div>
      <div className="page-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button className="btn sm" onClick={onBack} title="กลับไปยังรายการ" aria-label="กลับไปยังรายการ"
                  style={{ width: 32, padding: 0, justifyContent: 'center' }}><Icon name="chevLeft" size={14} /></button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            เลขที่สัญญา {rec.contractNo}
          </h1>
        </div>
        <span className="spacer" />
        {readOnly ? (
          <>
            {savedBadge && <span className="saved-badge">{savedBadge}</span>}
            <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" size={13} /> ประวัติ</button>
          </>
        ) : (
          <>
            <button className="btn sm" onClick={repull}>ยกเลิก</button>
            {nextInst && (
              <button className="btn primary sm" onClick={confirm}><Icon name="check" size={13} /> ยืนยันส่งอนุมัติจ่าย</button>
            )}
          </>
        )}
      </div>

      {/* ── การ์ดหัวเรื่อง — ข้อมูลใบขอกู้ ── */}
      <div className="search-card lpo-info-card">
        <div className="lpo-info-grid">
          <LpoKV k="เลขที่ใบขอกู้" mono>{rec.reqNo}</LpoKV>
          <LpoKV k="ประเภทเงินกู้">{rec.productCode}-{rec.productName}</LpoKV>
          <LpoKV k="เลขสมาชิก" mono>{rec.memberCode}</LpoKV>
          <LpoKV k="ชื่อ-นามสกุลผู้กู้">{rec.memberName}</LpoKV>
          <LpoKV k="หน่วย/สังกัด" wide>{rec.dept}</LpoKV>
          <LpoKV k="วัตถุประสงค์" wide>{rec.purpose}</LpoKV>
          <LpoKV k="วันที่ขอกู้">{fmt.date(rec.reqDate)}</LpoKV>
          <LpoKV k="วันที่จ่าย">{fmt.date(rec.payDate)}</LpoKV>
          <LpoKV k="วันที่เริ่มเก็บ">{fmt.date(rec.collectDate)}</LpoKV>
          <LpoKV k="วงเงินอนุมัติ"><span style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(rec.amount, 2)}</span></LpoKV>
          <LpoKV k="เบอร์โทรศัพท์รับ SMS" mono>{rec.phone}</LpoKV>
          <LpoKV k="สถานะสมาชิก">{rec.memberStatus}</LpoKV>
          <LpoKV k="สถานภาพ">{rec.maritalStatus}</LpoKV>
          <LpoKV k="ชื่อคู่สมรส (กรณีสมรส)">{rec.spouseName}</LpoKV>
        </div>
        {rec.alert && (
          <div className="lpo-alert"><Icon name="info" size={13} /><span>ข้อความแจ้งเตือน: {rec.alert}</span></div>
        )}
      </div>

      {/* ── งวดที่เบิกจ่ายแล้ว ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head"><span className="head-bar" /><h3>การจ่ายเงินกู้ (งวดที่เบิกจ่ายแล้ว)</h3>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>รูปแบบการจ่ายกู้: <b style={{ color: 'var(--text)' }}>{(window.LPO_PAYOUT_MODES.find(m => m.v === rec.payoutMode) || {}).l}</b></span>
        </div>
        {disbursed.length === 0 ? (
          <div className="muted" style={{ fontSize: 12.5, padding: '8px 2px' }}>ยังไม่มีงวดที่เบิกจ่าย</div>
        ) : disbursed.map(i => <LpoDisbursedTable key={i.no} inst={i} />)}
      </div>

      {/* ── ระบุวิธีจ่ายเงินกู้ของงวดที่เหลือ ── */}
      {!readOnly && nextInst && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head"><span className="head-bar" /><h3>การจ่ายเงินกู้ (งวดที่เหลือ)</h3>
            <span className="spacer" />
            <span className="muted" style={{ fontSize: 12 }}>
              {plan.found
                ? <>ดึงข้อมูลจาก <b style={{ color: 'var(--text)' }}>บันทึกจ่ายเงินกู้พิเศษ</b> · {rec.reqNo}{plan.ts ? ' · ' + fmt.datetime(plan.ts) : ''} — แก้ไขเพิ่มเติมได้</>
                : 'ไม่พบข้อมูลงวดที่เหลือในบันทึกจ่ายเงินกู้พิเศษ — โปรดระบุวิธีจ่าย'}
            </span>
          </div>
          <LpoEditableTable inst={nextInst} lines={lines} setLines={setLines} />
          <div className="lpo-net-line">
            <span className="muted">ยอดเบิก{window.lpoInstLabel(nextInst)} (วงเงินงวด ฿{fmt.money(nextInst.amount, 2)})</span>
            <span className="spacer" />
            <span>รวมจ่ายสุทธิที่ระบุ: <b className="mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(netTotal, 2)}</b></span>
          </div>
        </div>
      )}

      {isRest && draws.length > 0 && (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head"><span className="head-bar" /><h3>ประวัติการเบิกงวดที่เหลือ</h3>
            <span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>{draws.length} ครั้ง · เบิกแล้ว ฿{fmt.money(drawn, 2)}</span></div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th className="center" style={{ width: 70 }}>ครั้งที่</th><th>วันที่เบิก</th><th>วิธีจ่ายจริง</th><th className="num">ยอดเบิก</th></tr></thead>
            <tbody>
              {draws.map((d, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{fmt.date(d.date)}</td>
                  <td>{(d.lines || []).map(l => window.lpoPayMethod(l.method).l).join(' · ') || '—'}</td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{fmt.money(d.amount, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </div>
      )}

      {readOnly && (
        <div className="search-card lpo-done-note" style={{ marginTop: 12 }}>
          <Icon name="check" size={14} /> เบิกจ่ายครบทุกงวดแล้ว — ไม่มีงวดค้างจ่ายสำหรับสัญญานี้
        </div>
      )}

      {/* ── modal ประวัติ ── */}
      {histOpen && (
        <LpoHistoryModal title={`สัญญา ${rec.contractNo} · ${rec.memberName}`} onClose={() => setHistOpen(false)} />
      )}
    </div>
  );
}

function LpoKV({ k, children, mono, wide }) {
  return (
    <div className={"lpo-kv" + (wide ? " wide" : "")}>
      <span className="lpo-kv-k">{k}</span>
      <span className={"lpo-kv-v" + (mono ? " mono" : "")}>{children}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — รายการเบิกเงินกู้ค้างจ่าย
// ════════════════════════════════════════════════════════════════════
function LoanPayoutPage({ onToast, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = lpoUseState(window.lpoLoad);
  const [tab, setTab] = lpoUseState('all');           // all | pending | done
  const [q, setQ] = lpoUseState('');
  const [typeF, setTypeF] = lpoUseState('');
  const [pjF, setPjF] = lpoUseState('');
  const [dFrom, setDFrom] = lpoUseState('');
  const [dTo, setDTo] = lpoUseState('');
  const [applied, setApplied] = lpoUseState({ q: '', typeF: '', pjF: '', dFrom: '', dTo: '' });
  const projectOpts = lpoUseMemo(() => {
    const m = new Map();
    list.forEach(r => { const pj = lpoProjectOf(r); if (pj) m.set(pj.id, pj.name); });
    return [...m.entries()];
  }, [list]);
  const [detail, setDetail] = lpoUseState(null);

  const productTypes = lpoUseMemo(() => {
    const s = new Map();
    list.forEach(r => s.set(r.productCode, `${r.productCode}-${r.productName}`));
    return [...s.entries()];
  }, [list]);

  const runSearch = () => setApplied({ q, typeF, pjF, dFrom, dTo });
  const reset = () => {
    setQ(''); setTypeF(''); setPjF(''); setDFrom(''); setDTo('');
    setApplied({ q: '', typeF: '', pjF: '', dFrom: '', dTo: '' });
  };

  const filtered = lpoUseMemo(() => list.filter(r => {
    if (tab !== 'all' && r.status !== tab) return false;
    if (applied.typeF && r.productCode !== applied.typeF) return false;
    if (applied.pjF && lpoProjectCell(r).pid !== applied.pjF) return false;
    const d = String(r.reqDate || '').slice(0, 10);
    if (applied.dFrom && d < applied.dFrom) return false;
    if (applied.dTo && d > applied.dTo) return false;
    const s = applied.q.trim().toLowerCase();
    if (s && !(`${r.contractNo} ${r.reqNo} ${r.memberCode} ${r.memberName}`.toLowerCase().includes(s))) return false;
    return true;
  }), [list, tab, applied]);

  const counts = lpoUseMemo(() => ({
    all: list.length,
    pending: list.filter(r => r.status === 'pending').length,
    done: list.filter(r => r.status === 'done').length,
  }), [list]);

  const rows = filtered;

  const confirmPayout = (payload, err) => {
    if (err) { onToast && onToast(err); return; }
    const rec = detail;
    const inst = payload.inst;
    // อัปเดตงวดที่เบิก → disbursed + บันทึกสถานะสัญญา
    let drawDone = true;
    const nextInstallments = rec.installments.map(i => {
      if (i.no !== inst.no) return i;
      if (!payload.draw) return { ...i, state: 'disbursed', lines: payload.lines };
      const draws = [...(i.draws || []), payload.draw];
      const drawnSum = draws.reduce((t, d) => t + (Number(d.amount) || 0), 0);
      drawDone = drawnSum >= (Number(i.amount) || 0) - 0.005;
      return { ...i, draws, lines: payload.lines, state: drawDone ? 'disbursed' : i.state };
    });
    const allDone = nextInstallments.every(i => i.state === 'disbursed');
    const patch = { installments: nextInstallments, status: allDone ? 'done' : 'pending' };
    window.lpoSave(rec.id, patch);
    setList(window.lpoLoad());
    setDetail(null);
    audit && audit.log && audit.log({
      action: 'update', module: 'สินเชื่อ — เบิกเงินกู้ค้างจ่าย',
      target: `${rec.contractNo} · ${rec.memberName}`,
      summary: payload.draw
        ? `เบิกงวดที่เหลือ ฿${fmt.money(payload.draw.amount, 2)} (${payload.draw.lines.map(l => window.lpoPayMethod(l.method).l).join(', ')})${drawDone ? ' — เบิกครบยอดแล้ว' : ''} → ส่งอนุมัติจ่ายสินเชื่อ`
        : `บันทึกวิธีจ่ายเงินกู้ ${window.lpoInstLabel(inst)} (${payload.lines.length} รายการ · สุทธิ ฿${fmt.money(payload.netTotal, 2)}) → ส่งอนุมัติจ่ายสินเชื่อ`,
    });
    onToast && onToast(`บันทึกวิธีจ่าย${window.lpoInstLabel(inst)} แล้ว — ส่ง Order ไปยัง การเงิน › อนุมัติจ่ายสินเชื่อ`);
    if (onNav) setTimeout(() => onNav({ view: 'finance', page: 'loan-disbursement' }), 900);
  };

  // ── หน้ารายละเอียด ──
  if (detail) {
    const readOnly = detail.status === 'done';
    return (
      <div data-screen-label="หน้าเบิกเงินกู้ค้างจ่าย (รายละเอียด)">
        <LpoDetail rec={detail} readOnly={readOnly}
                   onBack={() => setDetail(null)} onConfirm={confirmPayout} />
      </div>
    );
  }

  // ── หน้ารายการ ──
  return (
    <div data-screen-label="หน้ารายการเบิกเงินกู้ค้างจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รายการเบิกเงินกู้ค้างจ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เบิกจ่ายเงินกู้พิเศษเป็นงวด — ระบุวิธีจ่ายแล้วส่งอนุมัติจ่ายที่ระบบการเงิน
          </div>
        </div>
      </div>

      {/* ── แถบค้นหา (รูปแบบเดียวกับเมนูใบคำขอกู้) ── */}
      <div className="search-card">
        <div className="lpo-filters-row lrq-inbox-filters">
          <div className="lrq-inbox-msearch">
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <input className="cfg-input" style={{ width: 260 }} value={q}
                   onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                   placeholder="เลขที่คำร้อง / เลขสมาชิก / ชื่อสมาชิก" />
          </div>
          <div className="lrq-inbox-msearch">
            <span className="muted" style={{ fontSize: 12 }}>ประเภทเงินกู้</span>
            <select className="cfg-input" style={{ width: 220 }} value={typeF} onChange={(e) => setTypeF(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {productTypes.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div className="lrq-inbox-msearch">
            <span className="muted" style={{ fontSize: 12 }}>โครงการเงินกู้</span>
            <select className="cfg-input" style={{ width: 220 }} value={pjF} onChange={(e) => setPjF(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {projectOpts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </div>
          <div className="lrq-daterange">
            <span className="muted" style={{ fontSize: 12 }}>วันที่ขอกู้</span>
            <ErpDate value={dFrom} onChange={setDFrom} style={{ width: 186 }} />
            <span className="muted">—</span>
            <ErpDate value={dTo} onChange={setDTo} style={{ width: 186 }} />
          </div>
          <span className="spacer" />
          <div className="lrq-inbox-search-actions">
            <button type="button" className="btn primary" onClick={runSearch}>ค้นหา</button>
            <button type="button" className="btn" onClick={reset}>รีเซ็ต</button>
          </div>
        </div>
      </div>

      {/* ── แท็บ ── */}
      <div className="lpo-tabs lrq-inbox-tabs">
        <button className={"lrq-itab" + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>
          เบิกเงินกู้ค้างจ่ายทั้งหมด<span className="lrq-itab-c">{counts.all}</span>
        </button>
        <button className={"lrq-itab" + (tab === 'pending' ? ' active' : '')} onClick={() => setTab('pending')}>
          รอบันทึกจ่าย<span className="lrq-itab-c">{counts.pending}</span>
        </button>
        <button className={"lrq-itab" + (tab === 'done' ? ' active' : '')} onClick={() => setTab('done')}>
          บันทึกจ่ายสำเร็จ<span className="lrq-itab-c">{counts.done}</span>
        </button>
      </div>

      {/* ── ตาราง ── */}
      <div className="search-card" style={{ paddingTop: 8 }}>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lpo-list-tbl">
            <thead>
              <tr>
                <th>เลขที่สัญญา</th>
                <th>เลขสมาชิก</th>
                <th>ชื่อ-นามสกุลผู้กู้</th>
                <th>โครงการเงินกู้</th>
                <th>วันที่ขอกู้</th>
                <th>สถานะใบคำขอ</th>
                <th className="center" style={{ width: 150 }}>การปรับแต่ง</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="empty-state" style={{ padding: '36px 12px' }}>
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบรายการเบิกเงินกู้ที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const st = window.lpoStatus(r.status);
                const done = r.status === 'done';
                return (
                  <tr key={r.id} className="clickable" onClick={() => setDetail(r)}>
                    <td className="mono">{r.contractNo}</td>
                    <td className="mono">{r.memberCode}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.memberName}</td>
                    <td>{(() => { const c = lpoProjectCell(r); return (<>
                      <div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{c.title}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{c.sub}</div>
                    </>); })()}</td>
                    <td className="mono">{fmt.date(r.reqDate)}</td>
                    <td><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn sm" onClick={() => setDetail(r)}>
                        {done ? 'ดูสัญญาเงินกู้' : 'เบิกจ่ายเงินกู้'}
                      </button>
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

Object.assign(window, { LoanPayoutPage, LpoHistoryModal });
