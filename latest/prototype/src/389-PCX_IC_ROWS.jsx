// ════════════════════════════════════════════════════════════════════
//  ประมวลผลและจัดเก็บ › สินเชื่อ — อนุมัติเปลี่ยนแปลงงวดชำระ
//  ขั้นตอน: ① เลือกช่วง "วันที่เปลี่ยน" → ดึงข้อมูล
//           ② พิจารณาทีละรายการ / เลือกหลายรายการ / ทั้งหมด
//           ③ ยืนยันผ่านโมดัล (ไม่อนุมัติต้องระบุสาเหตุ + การดำเนินการ)
//  รูปแบบขั้นตอนเดียวกับเมนู "อนุมัติสินเชื่อ" (ระบบสินเชื่อ)
// ════════════════════════════════════════════════════════════════════

const PCX_IC_ROWS = [
  { doc: 'CL69001163', contract: 'ส7.66-009233', reg: '049049', date: '2026-01-14', om: 'คงยอด', op: 15500, os: 'ส่งปกติ', nm: 'คงยอด', np: 15500, ns: 'งดต้น', by: 'jeerana' },
  { doc: 'CL69001191', contract: 'ส7.67-008930', reg: '059798', date: '2026-01-16', om: 'คงยอด', op: 6300, os: 'งดส่ง', nm: 'คงยอด', np: 6300, ns: 'ส่งปกติ', by: 'jeerana' },
  { doc: 'CL69001192', contract: 'ส7.67-080313', reg: '059798', date: '2026-01-16', om: 'คงยอด', op: 400, os: 'งดส่ง', nm: 'คงยอด', np: 400, ns: 'ส่งปกติ', by: 'jeerana' },
  { doc: 'CL69001193', contract: 'ส7.67-067933', reg: '059798', date: '2026-01-16', om: 'คงยอด', op: 2167, os: 'งดส่ง', nm: 'คงยอด', np: 2167, ns: 'ส่งปกติ', by: 'jeerana' },
  { doc: 'CL69001295', contract: 'สจ.66-005617', reg: '052970', date: '2026-01-16', om: 'ตามงวด', op: 8500, os: 'ส่งปกติ', nm: 'ตามงวด', np: 10000, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
  { doc: 'CL69001223', contract: 'ส6.66-007532', reg: '057245', date: '2026-01-20', om: 'คงยอด', op: 5000, os: 'งดส่ง', nm: 'คงยอด', np: 5000, ns: 'ส่งปกติ', by: 'jeerana' },
  { doc: 'CL69001237', contract: 'ส7.62-001599', reg: '034240', date: '2026-01-22', om: 'คงยอด', op: 35400, os: 'ส่งปกติ', nm: 'คงยอด', np: 45400, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
  { doc: 'CL69001239', contract: 'สห.67-003476', reg: '039620', date: '2026-01-22', om: 'คงต้น', op: 8600, os: 'ส่งปกติ', nm: 'คงต้น', np: 14000, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
  { doc: 'CL69001241', contract: 'ส7.67-000358', reg: '055255', date: '2026-01-22', om: 'คงยอด', op: 10600, os: 'ส่งปกติ', nm: 'คงยอด', np: 10600, ns: 'งดต้น', by: 'jeerana' },
  { doc: 'CL69001242', contract: 'ส6.67-004363', reg: '030885', date: '2026-01-23', om: 'คงยอด', op: 31000, os: 'ส่งปกติ', nm: 'คงยอด', np: 31000, ns: 'งดต้น', by: 'PRAPAWAN' },
  { doc: 'CL69001251', contract: 'ฉฉ.68-015825', reg: '055292', date: '2026-01-26', om: 'คงต้น', op: 700, os: 'ส่งปกติ', nm: 'คงต้น', np: 3000, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
  { doc: 'CL69001261', contract: 'ส6.65-002665', reg: '049401', date: '2026-01-28', om: 'คงยอด', op: 22000, os: 'ส่งปกติ', nm: 'คงยอด', np: 25000, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
  { doc: 'CL69001264', contract: 'ส6.68-003334', reg: '029302', date: '2026-01-28', om: 'คงยอด', op: 43900, os: 'ส่งปกติ', nm: 'คงยอด', np: 43900, ns: 'งดต้น', by: 'jeerana' },
  { doc: 'CL69001272', contract: 'สห.67-009394', reg: '018789', date: '2026-02-02', om: 'คงต้น', op: 300, os: 'ส่งปกติ', nm: 'คงต้น', np: 500, ns: 'ส่งปกติ', by: 'SORACHAI.I' },
];

const PCX_IC_TABS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'wait', label: 'รออนุมัติ' },
  { id: 'yes', label: 'อนุมัติแล้ว' },
  { id: 'no', label: 'ไม่อนุมัติ' },
];
const pcxIcPill = (r) => r.decision === 'yes' ? { l: 'อนุมัติแล้ว', pill: 'ok' }
  : r.decision === 'no' ? { l: 'ไม่อนุมัติ', pill: 'bad' } : { l: 'รออนุมัติ', pill: 'warn' };

function PcxIcApproveModal({ items, onClose, onConfirm }) {
  const total = items.reduce((s, x) => s + (Number(x.np) || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 620, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="check" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ยืนยันการอนุมัติ ({items.length} รายการ)</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>ยอดส่งชำระใหม่รวม {pcxMoney(total)} บาท/งวด</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่เอกสาร</th><th>สัญญา</th>
                  <th style={{ textAlign: 'right' }}>เดิม</th>
                  <th style={{ textAlign: 'right' }}>ใหม่</th>
                  <th>สถานะใหม่</th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.doc}>
                    <td className="mono">{r.doc}</td>
                    <td className="mono">{r.contract}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.op)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.np)}</td>
                    <td>{r.ns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            <Icon name="info" size={13} /> การดำเนินการนี้จะถูกบันทึกใน Audit Trail
          </div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={() => onConfirm(items)}>
            <Icon name="check" size={13} /> ยืนยันอนุมัติ {items.length} รายการ
          </button>
        </div>
      </div>
    </>
  );
}

function PcxIcRejectModal({ items, onClose, onConfirm }) {
  const [reason, setReason] = React.useState('');
  const [disposition, setDisposition] = React.useState('return');
  const [err, setErr] = React.useState('');
  const submit = () => {
    if (!reason.trim()) { setErr('กรุณาระบุสาเหตุที่ไม่อนุมัติ'); return; }
    onConfirm(items, disposition, reason.trim());
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="close" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ไม่อนุมัติ ({items.length} รายการ)</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>ระบุสาเหตุและการดำเนินการต่อ</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <label className="lt-modal-label">การดำเนินการ</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
            <label className="lrq-check">
              <input type="radio" name="pcx-disp" checked={disposition === 'return'} onChange={() => setDisposition('return')} />
              ส่งกลับให้ผู้ทำรายการแก้ไข
            </label>
            <label className="lrq-check">
              <input type="radio" name="pcx-disp" checked={disposition === 'closed'} onChange={() => setDisposition('closed')} />
              ปิดการทำงาน (ยกเลิกคำขอ)
            </label>
          </div>
          <label className="lt-modal-label" style={{ marginTop: 14 }}>สาเหตุที่ไม่อนุมัติ <span className="cfg-required">*</span></label>
          <textarea className="cfg-input" rows={3} value={reason} maxLength={300}
                    onChange={(e) => { setReason(e.target.value); setErr(''); }}
                    placeholder="เช่น ยอดส่งชำระใหม่ต่ำกว่าเกณฑ์ขั้นต่ำของประเภทเงินกู้" />
          {err && (<div className="sr-error" style={{ marginTop: 10 }}><Icon name="info" size={14} /> {err}</div>)}
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn danger" onClick={submit}><Icon name="close" size={13} /> ยืนยันไม่อนุมัติ</button>
        </div>
      </div>
    </>
  );
}

function PcxIcResultModal({ result, onClose }) {
  const ok = result.kind === 'approved';
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 470, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={ok ? 'check' : 'close'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{ok ? 'อนุมัติเรียบร้อยแล้ว' : 'บันทึกผลไม่อนุมัติแล้ว'}</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>
              {result.items.length} รายการ{result.dispLabel ? ' · ' + result.dispLabel : ''}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ccd-audit">
            {result.items.slice(0, 8).map(r => (
              <div className="ccd-audit-row" key={r.doc}>
                <span className="ccd-audit-k mono">{r.doc}</span>
                <span className="ccd-audit-v mono">{r.contract} · {pcxMoney(r.np)}</span>
              </div>
            ))}
            {result.items.length > 8 && (
              <div className="ccd-audit-row">
                <span className="ccd-audit-k muted">และอีก {result.items.length - 8} รายการ</span><span />
              </div>
            )}
          </div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn primary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

function InstallmentChangeApprovePage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState(today);
  const [fetched, setFetched] = useState(null);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState(() => new Set());
  const [approveItems, setApproveItems] = useState(null);
  const [rejectItems, setRejectItems] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const cnt = {
    all: rows.length,
    wait: rows.filter(r => r.decision === 'wait').length,
    yes: rows.filter(r => r.decision === 'yes').length,
    no: rows.filter(r => r.decision === 'no').length,
  };
  const shown = rows.filter(r => {
    if (tab !== 'all' && r.decision !== tab) return false;
    if (!q.trim()) return true;
    const k = q.trim().toLowerCase();
    return [r.doc, r.contract, r.reg, r.by].some(v => String(v).toLowerCase().includes(k));
  });
  const selItems = shown.filter(r => sel.has(r.doc));
  const waitRows = shown.filter(r => r.decision === 'wait');
  const allSelected = waitRows.length > 0 && waitRows.every(r => sel.has(r.doc));
  const clearSel = () => setSel(new Set());
  const toggleSel = (doc) => setSel(s => { const n = new Set(s); n.has(doc) ? n.delete(doc) : n.add(doc); return n; });

  const doFetch = () => {
    if (!from || !to) { setError('กรุณาระบุ "วันที่เปลี่ยน — จากวันที่ / ถึงวันที่" ก่อนดึงข้อมูล'); return; }
    if (from > to) { setError('ช่วงวันที่ไม่ถูกต้อง — จากวันที่ต้องไม่มากกว่าถึงวันที่'); return; }
    setError('');
    const data = PCX_IC_ROWS
      .filter(r => r.date >= from && r.date <= to)
      .map(r => ({ ...r, decision: 'wait', reason: '', decidedBy: '', decidedAt: '' }));
    setRows(data);
    setFetched({ from, to });
    setTab('all'); setQ(''); clearSel();
    onToast && onToast(data.length
      ? 'ดึงข้อมูลคำขอเปลี่ยนแปลงงวดชำระ ' + data.length + ' รายการ'
      : 'ไม่พบข้อมูลในช่วงวันที่ที่ระบุ');
  };
  const clearAll = () => { setRows([]); setFetched(null); clearSel(); setQ(''); setTab('all'); setError(''); };

  const applyDecision = (items, decision, disposition, reason) => {
    const at = window.fmt.date(today) + ' ' + new Date().toTimeString().slice(0, 5) + ' น.';
    const by = window.CCD_USER || 'ผู้อนุมัติ';
    const ids = new Set(items.map(i => i.doc));
    setRows(rs => rs.map(r => ids.has(r.doc)
      ? { ...r, decision, reason: reason || '', decidedBy: by, decidedAt: at } : r));
    clearSel(); setApproveItems(null); setRejectItems(null);
    const dispLabel = disposition === 'closed' ? 'ปิดการทำงาน'
      : disposition === 'return' ? 'ส่งกลับให้ผู้ทำรายการแก้ไข' : '';
    audit && audit.log && audit.log({
      action: decision === 'yes' ? 'approve' : 'reject',
      module: 'ประมวลผลและจัดเก็บ — อนุมัติเปลี่ยนแปลงงวดชำระ',
      target: items.length > 1 ? items.length + ' รายการ' : items[0].doc + ' · ' + items[0].contract,
      summary: decision === 'yes'
        ? 'อนุมัติเปลี่ยนแปลงงวดชำระ ' + items.length + ' รายการ (ช่วง ' + window.fmt.date(fetched.from) + ' - ' + window.fmt.date(fetched.to) + ')'
        : 'ไม่อนุมัติ ' + items.length + ' รายการ · ' + dispLabel + ' · ' + reason,
      changes: items.slice(0, 12).map(r => ({
        field: r.doc + ' · ' + r.contract,
        before: r.om + ' ' + pcxMoney(r.op) + ' (' + r.os + ')',
        after: r.nm + ' ' + pcxMoney(r.np) + ' (' + r.ns + ')',
      })),
    });
    setResult({ kind: decision === 'yes' ? 'approved' : 'rejected', items, dispLabel });
    onToast && onToast(decision === 'yes'
      ? 'อนุมัติ ' + items.length + ' รายการเรียบร้อยแล้ว'
      : 'ไม่อนุมัติ ' + items.length + ' รายการ — ' + dispLabel);
  };

  return (
    <div data-screen-label="อนุมัติเปลี่ยนแปลงงวดชำระ">
      <PcxHead icon="check" title="อนุมัติเปลี่ยนแปลงงวดชำระ"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — ดึงข้อมูลตามช่วงวันที่ แล้วพิจารณาอนุมัติทีละรายการ / หลายรายการ / ทั้งหมด"
        actions={<>
          <button className="btn primary sm" disabled={!fetched || !waitRows.length}
                  onClick={() => setApproveItems(waitRows)}>
            <Icon name="check" size={13} /> อนุมัติทั้งหมด ({waitRows.length})
          </button>
          <button className="btn sm" disabled={!fetched} onClick={clearAll}>
            <Icon name="refresh" size={13} /> ล้างข้อมูล
          </button>
          <button className="btn sm" disabled={!fetched}
                  onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์รายการอนุมัติเปลี่ยนแปลงงวดชำระ…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="เงื่อนไขการดึงข้อมูล">
        <div className="icr-strip">
          <PcxFld label="วันที่เปลี่ยน — จากวันที่" w={165} required>
            <ErpDate value={from} onChange={(v) => ((e) => { setFrom(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="ถึงวันที่" w={165} required>
            <ErpDate value={to} onChange={(v) => ((e) => { setTo(e.target.value); setError(''); })({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <div className="icr-fld" style={{ width: 230 }}>
            <span className="icr-fld-l">&nbsp;</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary sm" onClick={doFetch}><Icon name="search" size={13} /> ดึงข้อมูล</button>
              <button className="btn sm" onClick={clearAll}><Icon name="refresh" size={13} /> รีเซ็ต</button>
            </div>
          </div>
          <PcxFld label="ชุดข้อมูลที่ดึง" grow w={220}>
            <PcxRO mono placeholder="(ยังไม่ได้ดึงข้อมูล)"
                   value={fetched ? window.fmt.date(fetched.from) + ' - ' + window.fmt.date(fetched.to) + ' · ' + rows.length + ' รายการ' : ''} />
          </PcxFld>
        </div>
        {!fetched && (
          <div className="dn-status-alert warn" style={{ marginTop: 12 }}>
            <Icon name="info" size={15} />
            <span>เลือกช่วง “วันที่เปลี่ยน” แล้วกด <b>ดึงข้อมูล</b> ก่อน จึงจะสามารถทำรายการอนุมัติได้</span>
          </div>
        )}
      </PcxSec>

      {fetched && (
        <PcxSec title="รายการคำขอเปลี่ยนแปลงงวดชำระ" style={{ marginTop: 12 }}>
          <div className="lrq-inbox-toolbar" style={{ marginTop: 10, marginBottom: 10 }}>
            <div className="lrq-inbox-tabs">
              {PCX_IC_TABS.map(t => (
                <button key={t.id} className={'lrq-itab' + (tab === t.id ? ' active' : '')}
                        onClick={() => { setTab(t.id); clearSel(); }}>
                  {t.label}<span className="lrq-itab-c">{cnt[t.id]}</span>
                </button>
              ))}
            </div>
            <span className="spacer" />
            <div className="search lrq-inbox-search" style={{ width: 300 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="เลขที่เอกสาร / สัญญา / ทะเบียน / ผู้ทำรายการ…" />
            </div>
          </div>

          {selItems.length > 0 && (
            <div className="wa-selbar">
              <span><b>{selItems.length}</b> รายการที่เลือก</span>
              <span className="spacer" />
              <button className="btn primary sm" onClick={() => setApproveItems(selItems)}>
                <Icon name="check" size={12} /> อนุมัติที่เลือก ({selItems.length})
              </button>
              <button className="btn danger sm" onClick={() => setRejectItems(selItems)}>
                <Icon name="close" size={12} /> ไม่อนุมัติที่เลือก ({selItems.length})
              </button>
              <button className="btn text sm" onClick={clearSel}>ยกเลิกการเลือก</button>
            </div>
          )}

          <div className="table-wrap" style={{ marginTop: 10 }}>
            <div className="table-scroll">
              <table className="tbl" style={{ minWidth: 1300, fontSize: 12 }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: 38 }}>
                      <input type="checkbox" checked={allSelected} disabled={!waitRows.length}
                             onChange={(e) => setSel(e.target.checked ? new Set(waitRows.map(r => r.doc)) : new Set())} />
                    </th>
                    <th rowSpan={2}>เลขที่เอกสาร</th>
                    <th rowSpan={2}>สัญญา</th>
                    <th rowSpan={2}>ทะเบียน</th>
                    <th rowSpan={2}>วันที่เปลี่ยน</th>
                    <th colSpan={3} style={{ textAlign: 'center' }}>การส่งเดิม</th>
                    <th colSpan={3} style={{ textAlign: 'center' }}>การส่งใหม่</th>
                    <th rowSpan={2}>ผู้ทำรายการ</th>
                    <th rowSpan={2}>สถานะ</th>
                    <th rowSpan={2} style={{ width: 180 }}>ทำรายการ</th>
                  </tr>
                  <tr>
                    <th>รูปแบบ</th><th style={{ textAlign: 'right' }}>ชำระ/งวด</th><th>สถานะ</th>
                    <th>รูปแบบ</th><th style={{ textAlign: 'right' }}>ชำระ/งวด</th><th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(r => {
                    const st = pcxIcPill(r);
                    const wait = r.decision === 'wait';
                    return (
                      <tr key={r.doc} className={sel.has(r.doc) ? 'selected' : ''}>
                        <td>
                          <input type="checkbox" checked={sel.has(r.doc)} disabled={!wait} onChange={() => toggleSel(r.doc)} />
                        </td>
                        <td className="mono">{r.doc}</td>
                        <td className="mono">{r.contract}</td>
                        <td className="mono">{r.reg}</td>
                        <td className="mono">{window.fmt.date(r.date)}</td>
                        <td>{r.om}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.op)}</td>
                        <td>{r.os}</td>
                        <td>{r.nm}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.np)}</td>
                        <td>{r.ns}</td>
                        <td>{r.by}</td>
                        <td>
                          <span className={'pill ' + st.pill}>{st.l}</span>
                          {!wait && r.decidedAt && (
                            <div className="muted" style={{ fontSize: 10.5, marginTop: 2 }}>{r.decidedBy} · {r.decidedAt}</div>
                          )}
                        </td>
                        <td>
                          {wait ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn primary sm" onClick={() => setApproveItems([r])}><Icon name="check" size={12} /> อนุมัติ</button>
                              <button className="btn danger sm" onClick={() => setRejectItems([r])}><Icon name="close" size={12} /> ไม่อนุมัติ</button>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontSize: 11.5 }}>{r.reason || 'พิจารณาแล้ว'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!shown.length && (
                    <tr><td colSpan={14} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>ไม่พบข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PcxSec>
      )}

      {approveItems && <PcxIcApproveModal items={approveItems} onClose={() => setApproveItems(null)}
                                          onConfirm={(items) => applyDecision(items, 'yes')} />}
      {rejectItems && <PcxIcRejectModal items={rejectItems} onClose={() => setRejectItems(null)}
                                        onConfirm={(items, disp, reason) => applyDecision(items, 'no', disp, reason)} />}
      {result && <PcxIcResultModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}

Object.assign(window, { InstallmentChangeApprovePage });
