// ════════════════════════════════════════════════════════════════════
//  อนุมัติคำขอ — WelfareApprovalPage  (ระบบงานสวัสดิการสมาชิก › การทำงาน)
//  ดึงคำขอทุกประเภทที่ผ่านการประมวลผลแล้ว → เปิดใบสำคัญจ่าย (แก้ไขได้ + ตัดงบ)
//  → อนุมัติในใบสำคัญจ่าย → บันทึกเป็นใบสำคัญจ่ายให้ฝ่ายการเงินทำรายการ
// ════════════════════════════════════════════════════════════════════

const WA_PILL_COLOR = {
  ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)',
  info: 'var(--info)', neutral: 'var(--text-faint, #9aa3ab)', primary: 'var(--primary)',
};

// ─── แผงรายละเอียด (drawer) — ตรวจสอบ + ส่งอนุมัติ/ไม่อนุมัติ ─────────
function WaDetailDrawer({ rec, onClose, onApprove, onReject }) {
  const [remark, setRemark] = useState(rec.remark || '');
  const [err, setErr] = useState('');
  const t = window.waType(rec.type);
  const st = window.waStatus(rec.status);
  const pending = rec.status === 'pending';

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer dba-drawer">
        <div className="drawer-head">
          <div className="dba-dico" style={{ background: 'color-mix(in srgb, ' + WA_PILL_COLOR[t.chip] + ' 13%, transparent)', color: WA_PILL_COLOR[t.chip] }}>
            <Icon name={t.icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{t.l}</h2>
            <div className="muted mono" style={{ fontSize: 11 }}>{rec.id} · ต้นเรื่อง {rec.srcDoc}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="drawer-body">
          <div className="dba-headcard">
            <div className="dba-hc-top">
              <span className="row-avatar lg">{rec.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dba-hc-name">{rec.memberName}</div>
                <div className="muted mono" style={{ fontSize: 11.5 }}>{rec.memberCode}{rec.dept ? ' · ' + rec.dept : ''}</div>
              </div>
              <span className={'pill ' + st.pill}>{st.l}</span>
            </div>
            <div className="dba-hc-facts">
              <div className="dba-fact"><span className="dba-fact-k">ผู้รับเงิน</span><span className="dba-fact-v">{rec.payee}</span></div>
              <div className="dba-fact"><span className="dba-fact-k">วิธีจ่าย</span><span className="dba-fact-v">{window.waPayBy(rec.payBy)}</span></div>
              <div className="dba-fact"><span className="dba-fact-k">จำนวนเงิน</span><span className="dba-fact-v mono hl">{window.fmt.money(rec.amount, 2)}</span></div>
            </div>
          </div>

          <div className="dba-sec">
            <div className="dba-sec-head">รายละเอียดคำขอ</div>
            <p className="dba-summary">{rec.note}</p>
            <div className="dba-kv-list">
              <div className="dba-kv"><span className="dba-kv-k">ประเภทสวัสดิการ</span><span className="dba-kv-v">{t.l}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">เลขที่ต้นเรื่อง</span><span className="dba-kv-v mono">{rec.srcDoc}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">บัญชีรับเงิน</span><span className="dba-kv-v mono">{rec.payAccount || '—'}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">บัญชีบันทึก (GL)</span><span className="dba-kv-v">{t.gl}</span></div>
            </div>
          </div>

          <div className="dba-sec">
            <div className="dba-sec-head">ข้อมูลการประมวลผล</div>
            <div className="dba-kv-list">
              <div className="dba-kv"><span className="dba-kv-k">ผู้ประมวลผล</span><span className="dba-kv-v">{rec.processedBy}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">วันที่ประมวลผล</span><span className="dba-kv-v mono">{window.fmt.date(rec.processedDate)}</span></div>
            </div>
          </div>

          {rec.status !== 'pending' && (
            <div className={'dba-decision ' + (rec.status === 'rejected' ? 'rejected' : 'approved')}>
              <div className="dba-decision-head">
                <Icon name={rec.status === 'rejected' ? 'close' : 'check'} size={14} />
                <span>{st.l}{rec.voucherNo ? ' · ใบสำคัญจ่าย ' + rec.voucherNo : ''}</span>
                <span className="spacer" />
                <span className="muted" style={{ fontSize: 11 }}>{rec.approvedBy || ''}{rec.approvedDate || rec.voucherDate ? ' · ' + window.fmt.date(rec.approvedDate || rec.voucherDate) : ''}</span>
              </div>
              {rec.remark && <div className="dba-decision-note">{rec.remark}</div>}
            </div>
          )}

          {pending && (
            <div className="dba-sec">
              <div className="dba-sec-head">เหตุผล (กรณีไม่อนุมัติ)</div>
              <textarea className="cfg-input" rows={2} value={remark}
                        onChange={(e) => { setRemark(e.target.value); setErr(''); }}
                        placeholder="ระบุเหตุผลการไม่อนุมัติ (จำเป็นเฉพาะกรณีไม่อนุมัติ)" />
              {err && <div className="sr-hint" style={{ color: 'var(--danger)', marginTop: 6 }}><Icon name="info" size={11} /> {err}</div>}
            </div>
          )}
        </div>

        {pending && (
          <div className="dba-drawer-foot">
            <button className="btn danger" onClick={() => { if (!remark.trim()) { setErr('กรุณาระบุเหตุผลการไม่อนุมัติ'); return; } onReject(rec, remark.trim()); }}>
              <Icon name="close" size={13} /> ไม่อนุมัติ
            </button>
            <button className="btn primary" onClick={() => onApprove(rec)}><Icon name="receipt" size={13} /> ทำใบสำคัญจ่าย</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Popup ใบสำคัญจ่าย — แก้ไขได้ (จำนวนเงิน + ตัดงบประมาณ) แล้วอนุมัติ ──
function WaVoucherModal({ voucher, mode, onClose, onApprove, onPrint }) {
  const editable = mode === 'edit';
  const [lines, setLines] = useState(() => (voucher.items || []).map(it => ({ ...it, amount: Number(it.amount) || 0 })));
  const [docDate, setDocDate] = useState(voucher.date || new Date().toISOString().slice(0, 10));
  const [structure] = useState(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])));
  const [disburse, setDisburse] = useState(() => voucher.disburse && voucher.disburse.length ? voucher.disburse.map(l => ({ ...l })) : [window.bdBlankLine()]);
  const [printing, setPrinting] = useState(false);
  const [err, setErr] = useState('');
  const catName = (cat) => { const f = (window.bdLeafCats ? window.bdLeafCats(structure) : []).find(x => x.id === cat); return f ? (f.name || f.code || cat) : cat; };

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const disburseTotal = (editable ? disburse : (voucher.disburse || [])).reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const balanced = Math.abs(disburseTotal - total) < 0.005;
  const hasBudget = (editable ? disburse : (voucher.disburse || [])).some(l => l.cat && Number(l.amount) > 0);

  const setAmount = (id, v) => setLines(ls => ls.map(l => l.id === id ? { ...l, amount: v } : l));

  // จัดกลุ่มตามบัญชี GL (สำหรับแผ่นพิมพ์)
  const glGroups = {};
  lines.forEach(it => { const t = window.waType(it.type); (glGroups[t.gl] = glGroups[t.gl] || []).push(it); });

  const approve = () => {
    if (!hasBudget) { setErr('กรุณาเลือกงบประมาณที่เกี่ยวข้องอย่างน้อย 1 รายการ เพื่อใช้ตัดจ่าย'); return; }
    if (!balanced) { setErr(`ยอดตัดงบประมาณ (${window.fmt.money(disburseTotal, 2)}) ต้องเท่ากับยอดจ่ายรวม (${window.fmt.money(total, 2)})`); return; }
    onApprove({
      no: voucher.no, date: docDate,
      lines: lines.map(l => ({ ...l, amount: Number(l.amount) || 0 })),
      total, disburse: disburse.filter(l => l.cat || Number(l.amount)),
    });
  };

  const doPrint = () => { setPrinting(true); setTimeout(() => onPrint(), 30); };

  // แผ่นพิมพ์ ใบสำคัญจ่าย
  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">
        <CoopDocHead title="ใบสำคัญจ่าย (Payment Voucher)" meta={<>
            <span>เลขที่ {voucher.no}</span><span>วันที่เอกสาร {window.fmt.date(docDate)}</span>
            <span>ประเภท เงินสวัสดิการสมาชิก</span>
        </>} />
        <table className="mp-id-table">
          <tbody>
            <tr><th>เลขที่ใบสำคัญจ่าย</th><td className="mono">{voucher.no}</td><th>ผู้จัดทำ/อนุมัติ</th><td>{voucher.by || window.WA_APPROVER}</td></tr>
            <tr><th>จำนวนรายการ</th><td>{lines.length} รายการ</td><th>รวมจ่าย</th><td className="mono">{window.fmt.money(total, 2)} บาท</td></tr>
          </tbody>
        </table>
        <table className="wa-vch-table">
          <thead><tr><th style={{ width: 40 }}>ลำดับ</th><th>ผู้รับเงิน / รายละเอียด</th><th>สมาชิก</th><th>วิธีจ่าย</th><th className="num">จำนวนเงิน (บาท)</th></tr></thead>
          <tbody>
            {Object.entries(glGroups).map(([gl, items]) => (
              <React.Fragment key={gl}>
                <tr className="wa-vch-glrow"><td colSpan={5}>บัญชี {gl}</td></tr>
                {items.map((it, i) => (
                  <tr key={it.id}>
                    <td className="center mono">{i + 1}</td>
                    <td>{it.payee}<div className="muted" style={{ fontSize: 11 }}>{it.note}</div></td>
                    <td className="mono" style={{ fontSize: 11.5 }}>{it.memberCode}</td>
                    <td style={{ fontSize: 12 }}>{window.waPayBy(it.payBy)}{it.payAccount ? ' · ' + it.payAccount : ''}</td>
                    <td className="num mono">{window.fmt.money(it.amount, 2)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr className="wa-vch-total"><td colSpan={4} className="right"><b>รวมเงินจ่ายทั้งสิ้น</b></td><td className="num mono"><b>{window.fmt.money(total, 2)}</b></td></tr>
          </tbody>
        </table>
        {(editable ? disburse : (voucher.disburse || [])).filter(l => l.cat || Number(l.amount)).length > 0 && (
          <table className="wa-vch-table" style={{ marginTop: 10 }}>
            <thead><tr><th>ตัดจ่ายจากงบประมาณ</th><th>รายละเอียด</th><th className="num">จำนวนเงิน (บาท)</th></tr></thead>
            <tbody>
              {(editable ? disburse : (voucher.disburse || [])).filter(l => l.cat || Number(l.amount)).map((l, i) => (
                <tr key={i}><td>{catName(l.cat)}</td><td>{l.desc || '—'}</td><td className="num mono">{window.fmt.money(Number(l.amount) || 0, 2)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="wa-vch-sign">
          <div><span className="wa-sign-line" />ผู้จัดทำ</div>
          <div><span className="wa-sign-line" />ผู้ตรวจสอบ</div>
          <div><span className="wa-sign-line" />ผู้อนุมัติจ่าย</div>
          <div><span className="wa-sign-line" />ผู้รับเงิน</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card wa-vch-modal" style={{ width: 820, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{editable ? 'ใบสำคัญจ่าย (ตรวจสอบและอนุมัติ)' : 'ใบสำคัญจ่าย'} · {voucher.no}</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
              {lines.length} รายการ · รวม {window.fmt.money(total, 2)} บาท{editable ? ' · ปรับจำนวนเงินและเลือกงบประมาณที่ใช้ตัดจ่ายได้' : ''}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ maxHeight: '72vh', overflow: 'auto' }}>
          {/* หัวเอกสาร */}
          <div className="wa-vch-meta">
            <div><span className="wa-vch-meta-k">เลขที่ใบสำคัญจ่าย</span><span className="wa-vch-meta-v mono">{voucher.no}</span></div>
            <div><span className="wa-vch-meta-k">วันที่เอกสาร</span>
              {editable
                ? <ErpDate value={docDate} onChange={(v) => ((e) => setDocDate(e.target.value))({ target: { value: v } })} style={{ height: 30, width: 160 }} className="cfg-input" />
                : <span className="wa-vch-meta-v mono">{window.fmt.date(docDate)}</span>}
            </div>
            <div><span className="wa-vch-meta-k">ผู้อนุมัติ</span><span className="wa-vch-meta-v">{voucher.by || window.WA_APPROVER}</span></div>
          </div>

          {/* รายการจ่าย */}
          <div className="section-head" style={{ margin: '4px 0 10px' }}><span className="head-bar" /><h3>รายการจ่าย</h3></div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>ผู้รับเงิน / รายละเอียด</th><th>ประเภท</th><th>วิธีจ่าย</th><th className="num" style={{ width: 160 }}>จำนวนเงิน (บาท)</th></tr></thead>
              <tbody>
                {lines.map(it => {
                  const t = window.waType(it.type);
                  return (
                    <tr key={it.id}>
                      <td>{it.payee}<div className="muted mono" style={{ fontSize: 10.5 }}>{it.memberCode} · {it.srcDoc}</div></td>
                      <td><span className={'chip ' + t.chip}>{t.short}</span></td>
                      <td style={{ fontSize: 12 }}>{window.waPayBy(it.payBy)}</td>
                      <td className="num">
                        {editable
                          ? <input className="cfg-input mono" type="number" step="0.01" min="0" style={{ textAlign: 'right', height: 30 }}
                                   value={it.amount} onChange={(e) => { setAmount(it.id, e.target.value); setErr(''); }} />
                          : <span className="mono">{window.fmt.money(it.amount, 2)}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} className="right"><b>รวมจ่ายทั้งสิ้น</b></td><td className="num mono"><b>{window.fmt.money(total, 2)}</b></td></tr>
              </tfoot>
            </table>
          </div></div>

          {/* ตัดงบประมาณ */}
          <div style={{ marginTop: 14 }}>
            {editable ? (
              <BudgetDisburseSection structure={structure} lines={disburse} onChange={(l) => { setDisburse(l); setErr(''); }}
                                     target={total} targetLabel="ยอดเบิกจ่ายใบสำคัญจ่าย"
                                     title="ตัดจ่ายจากงบประมาณ" sub="เลือกหมวดงบประมาณที่ใช้ตัดจ่าย — ยอดรวมต้องเท่ากับยอดจ่ายทั้งสิ้น" />
            ) : (
              (voucher.disburse && voucher.disburse.length > 0) && <BudgetDisburseDetail structure={structure} lines={voucher.disburse} title="ตัดจ่ายจากงบประมาณ" />
            )}
          </div>

          {err && <div className="sr-elig-warn" style={{ marginTop: 12 }}><Icon name="info" size={14} /> {err}</div>}
        </div>

        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          {editable ? (
            <>
              <span className={'wa-bal' + (balanced && hasBudget ? ' ok' : '')}>
                <Icon name={balanced && hasBudget ? 'check' : 'info'} size={12} />
                ตัดงบ {window.fmt.money(disburseTotal, 2)} / {window.fmt.money(total, 2)}
              </span>
              <span className="spacer" />
              <button className="btn" onClick={onClose}>ยกเลิก</button>
              <button className="btn primary" onClick={approve}><Icon name="check" size={13} /> อนุมัติ &amp; ออกใบสำคัญจ่าย</button>
            </>
          ) : (
            <>
              <span className="spacer" />
              <button className="btn" onClick={onClose}>ปิด</button>
              <button className="btn primary" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์ / บันทึก PDF</button>
            </>
          )}
        </div>
      </div>
      {printing && ReactDOM.createPortal(sheet, document.body)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function WelfareApprovalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.waLoad);
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('pending');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [open, setOpen] = useState(null);
  const [voucher, setVoucher] = useState(null);   // { mode:'edit'|'view', ... }

  const reload = () => setList(window.waLoad());
  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(() => {
    let r = list;
    if (typeF !== 'all') r = r.filter(x => x.type === typeF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || (x.srcDoc || '').toLowerCase().includes(n) ||
                        (x.payee || '').toLowerCase().includes(n));
    }
    return [...r].sort((a, b) =>
      (a.status === 'pending' ? 0 : a.status === 'voucher' ? 1 : 2) - (b.status === 'pending' ? 0 : b.status === 'voucher' ? 1 : 2) ||
      (b.processedDate || '').localeCompare(a.processedDate || ''));
  }, [list, typeF, statusF, q]);

  const pending = list.filter(x => x.status === 'pending');
  const voucherDone = list.filter(x => x.status === 'voucher');
  const pendingAmt = pending.reduce((s, x) => s + Number(x.amount || 0), 0);
  const typeCounts = window.WA_TYPES.map(t => ({ ...t, n: pending.filter(x => x.type === t.v).length }));

  const toggleSel = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selItems = rows.filter(r => sel.has(r.id));
  const selPending = selItems.filter(r => r.status === 'pending');
  const clearSel = () => setSel(new Set());

  // เปิดใบสำคัญจ่ายแบบแก้ไขได้ (อนุมัติภายใน)
  const openApprove = (items) => {
    if (!items.length) return;
    setOpen(null);
    setVoucher({ mode: 'edit', no: window.waNextVoucherNo(), date: today, by: window.WA_APPROVER,
                 items: items.map(i => ({ ...i })), total: items.reduce((s, x) => s + Number(x.amount || 0), 0) });
  };

  // อนุมัติจากภายในใบสำคัญจ่าย → บันทึก + แสดงโหมดดู
  const approveVoucher = (payload) => {
    payload.lines.forEach(it => window.waSaveDecision(it.id, {
      status: 'voucher', voucherNo: payload.no, voucherDate: payload.date,
      approvedBy: window.WA_APPROVER, amount: Number(it.amount) || 0, disburse: payload.disburse,
    }));
    reload(); clearSel();
    setVoucher({ mode: 'view', no: payload.no, date: payload.date, by: window.WA_APPROVER,
                 items: payload.lines, total: payload.total, disburse: payload.disburse });
    audit.log && audit.log({
      action: 'approve', module: 'สวัสดิการ — อนุมัติคำขอ', target: 'ใบสำคัญจ่าย ' + payload.no,
      summary: `อนุมัติและออกใบสำคัญจ่าย ${payload.no} · ${payload.lines.length} รายการ · รวม ${window.fmt.money(payload.total, 2)} บาท (ตัดงบประมาณแล้ว)`,
      changes: payload.lines.map(it => ({ field: it.id, before: 'รอพิจารณา', after: 'ออกใบสำคัญจ่าย ' + payload.no + ' · ' + window.fmt.money(Number(it.amount) || 0, 2) })),
    });
    onToast && onToast(`อนุมัติและออกใบสำคัญจ่าย ${payload.no} (${payload.lines.length} รายการ) เรียบร้อยแล้ว`);
  };

  const reject = (rec, remark) => {
    window.waSaveDecision(rec.id, { status: 'rejected', approvedBy: window.WA_APPROVER, approvedDate: today, remark });
    reload(); setOpen(null);
    audit.log && audit.log({
      action: 'reject', module: 'สวัสดิการ — อนุมัติคำขอ', target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ไม่อนุมัติ${window.waType(rec.type).l} ${rec.id}`,
      changes: [{ field: 'ผลการพิจารณา', before: 'รอพิจารณา', after: 'ไม่อนุมัติ' }, { field: 'เหตุผล', before: '—', after: remark }],
    });
    onToast && onToast(`ไม่อนุมัติคำขอ ${rec.id} แล้ว`);
  };

  const viewVoucher = (rec) => {
    const items = list.filter(x => x.voucherNo === rec.voucherNo);
    setVoucher({ mode: 'view', no: rec.voucherNo, date: rec.voucherDate, by: rec.approvedBy || window.WA_APPROVER,
                 items, total: items.reduce((s, x) => s + Number(x.amount || 0), 0), disburse: rec.disburse || [] });
  };

  const printVoucher = () => { window.printVoucher && window.printVoucher(onToast); };

  return (
    <div data-screen-label="หน้าอนุมัติคำขอสวัสดิการ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติคำขอ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ดึงคำขอสวัสดิการทุกประเภทที่ผ่านการประมวลผลแล้ว — อนุมัติผ่านใบสำคัญจ่าย (ปรับยอด/ตัดงบประมาณได้) ให้ฝ่ายการเงินทำรายการจ่าย
          </div>
        </div>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>รอพิจารณา <b style={{ color: 'var(--warning)' }}>{window.fmt.int(pending.length)}</b> · มูลค่า ฿ {window.fmt.money(pendingAmt, 0)}</span>
      </div>

      {/* ตัวกรองประเภท */}
      <div className="dba-typebar">
        <button className={'dba-typechip' + (typeF === 'all' ? ' active' : '')} onClick={() => { setTypeF('all'); clearSel(); }}>
          <span>ทั้งหมด</span><span className="dba-typecount">{pending.length}</span>
        </button>
        {typeCounts.map(t => (
          <button key={t.v} className={'dba-typechip' + (typeF === t.v ? ' active' : '')} onClick={() => { setTypeF(t.v); clearSel(); }}>
            <span className="dba-typeico" style={{ color: WA_PILL_COLOR[t.chip] }}><Icon name={t.icon} size={14} /></span>
            <span>{t.short}</span>
            {t.n > 0 && <span className="dba-typecount">{t.n}</span>}
          </button>
        ))}
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่คำขอ / ต้นเรื่อง / สมาชิก / ผู้รับเงิน</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา…" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => { setStatusF(e.target.value); clearSel(); }} style={{ width: 190 }}>
              <option value="all">ทุกสถานะ</option>
              {window.WA_STATUS.filter(s => s.v !== 'approved').map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        {sel.size > 0 && selPending.length > 0 && (
          <div className="wa-selbar">
            <span><b>{selPending.length}</b> รายการรอพิจารณาที่เลือก</span>
            <span className="muted">· รวม {window.fmt.money(selPending.reduce((s, x) => s + Number(x.amount || 0), 0), 2)} บาท</span>
            <span className="spacer" />
            <button className="btn primary sm" onClick={() => openApprove(selPending)}><Icon name="receipt" size={12} /> ทำใบสำคัญจ่ายรวม ({selPending.length})</button>
            <button className="btn text sm" onClick={clearSel}>ยกเลิกการเลือก</button>
          </div>
        )}

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 34 }} className="center">
                  <input type="checkbox" className="wa-chk"
                         checked={rows.length > 0 && rows.filter(r => r.status === 'pending').length > 0 && rows.filter(r => r.status === 'pending').every(r => sel.has(r.id))}
                         onChange={(e) => setSel(e.target.checked ? new Set(rows.filter(r => r.status === 'pending').map(r => r.id)) : new Set())} />
                </th>
                <th>เลขที่คำขอ / ต้นเรื่อง</th>
                <th>ประเภท</th>
                <th>สมาชิก / ผู้รับเงิน</th>
                <th>รายละเอียด</th>
                <th className="num">จำนวนเงิน (บาท)</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 180 }}>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="check" size={24} /></div>
                  ไม่มีคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const t = window.waType(r.type);
                const st = window.waStatus(r.status);
                const pendingRow = r.status === 'pending';
                return (
                  <tr key={r.id} className={'clickable' + (sel.has(r.id) ? ' wa-row-sel' : '')} onClick={() => setOpen(r)}>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {pendingRow && <input type="checkbox" className="wa-chk" checked={sel.has(r.id)} onChange={() => toggleSel(r.id)} />}
                    </td>
                    <td>
                      <div className="mono">{r.id}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.srcDoc} · {window.fmt.date(r.processedDate)}</div>
                    </td>
                    <td><span className={'chip ' + t.chip}>{t.short}</span></td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode} → {r.payee}</div>
                    </td>
                    <td style={{ maxWidth: 280 }}><div className="dba-cell-summary">{r.note}</div></td>
                    <td className="num mono">{window.fmt.money(r.amount, 0)}</td>
                    <td className="center">
                      <span className={'pill ' + st.pill}>{st.l}</span>
                      {r.voucherNo && <div className="muted mono" style={{ fontSize: 10, marginTop: 2 }}>{r.voucherNo}</div>}
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {pendingRow ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn sm" onClick={() => setOpen(r)}><Icon name="eye" size={12} /> ตรวจสอบ</button>
                          <button className="btn primary sm" onClick={() => openApprove([r])}><Icon name="receipt" size={12} /> อนุมัติ</button>
                        </div>
                      ) : r.status === 'voucher' ? (
                        <button className="btn text sm" onClick={() => viewVoucher(r)}>ดูใบสำคัญจ่าย</button>
                      ) : (
                        <button className="btn text sm" onClick={() => setOpen(r)}>ดูผลพิจารณา</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> กด “อนุมัติ” เพื่อเปิดใบสำคัญจ่ายที่ระบบสร้างให้ — ปรับจำนวนเงินและเลือกงบประมาณที่ใช้ตัดจ่าย แล้วยืนยันอนุมัติ · เลือกหลายรายการเพื่อรวมในใบสำคัญจ่ายเดียว
        </p>
      </div>

      {open && <WaDetailDrawer rec={open} onClose={() => setOpen(null)} onApprove={(r) => openApprove([r])} onReject={reject} />}
      {voucher && <WaVoucherModal voucher={voucher} mode={voucher.mode} onClose={() => setVoucher(null)} onApprove={approveVoucher} onPrint={printVoucher} />}
    </div>
  );
}

Object.assign(window, { WelfareApprovalPage });
