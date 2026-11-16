// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — พิมพ์สมุด–สลิป (สมุดคู่ฝาก / Auto Passbook)
//  โครงหน้าจอตามระบบเดิม: หัวข้อมูลบัญชี → รายการเคลื่อนไหว (พิมพ์ Book /
//  พิมพ์สลิป ต่อบรรทัด) → ปุ่มพิมพ์ BOOK · ออกสมุดใหม่ · Re-Print ปกสมุด
//  + โมดัล “พิมพ์รายการสมุดคู่ฝาก” (ช่วงรายการ / หน้าที่ / บรรทัดที่)
// ════════════════════════════════════════════════════════════════════

const PBW_PER_PAGE = 10;

// รวมรายการเคลื่อนไหวของบัญชี: บรรทัดรอปรับสมุด (ยังไม่พิมพ์) + ประวัติที่พิมพ์แล้ว
// รหัสรายการ: [รหัสประเภท][ปี พ.ศ. 2 หลัก][เดือน][วัน]-[ลำดับ 4 หลัก]
function pbwTxnId(r, seq) {
  if (r.txnId) return r.txnId;
  const d = new Date(r.date);
  const y = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  const md = String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  return `${(r.code || 'DEP').slice(0, 3).toUpperCase()}${y}${md}-${String(seq).padStart(4, '0')}`;
}

function pbwRows(q, ledger) {
  const pending = (q.pending || []).map(p => ({ ...p, code: p.code || 'DEP', printed: false }));
  const hist = (window.dpcMoves ? window.dpcMoves(q.accNo, ledger) : []).map(m => ({
    date: m.date, desc: m.label, code: m.code,
    wd: m.dc === '−' ? m.amount : 0, dp: m.dc === '−' ? 0 : m.amount,
    bal: m.balance, printed: true,
  }));
  const all = [...pending, ...hist].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const n = all.length;
  return all.map((r, i) => ({ ...r, seq: n - i, txnId: pbwTxnId(r, n - i) }));
}

function PbwPrintModal({ q, rows, cfg, onClose, onPrint }) {
  const unprinted = rows.filter(r => !r.printed);
  const first = unprinted.length ? unprinted[unprinted.length - 1].seq : (rows[0] ? rows[0].seq : 1);
  const last = unprinted.length ? unprinted[0].seq : first;
  const [from, setFrom] = useState(String(first));
  const [to, setTo] = useState(String(last));
  const [page, setPage] = useState('1');
  const [line, setLine] = useState(String((q.lastLine || 0) + 1));
  const count = Math.max(0, Number(to) - Number(from) + 1);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94vw', padding: 0 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="print" size={16} /></span>
          <h2>พิมพ์รายการสมุดคู่ฝาก</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="dpc-rows" style={{ padding: 0 }}>
            <div className="dpc-srow"><span className="dpc-lbl">ชื่อบัญชี</span><span className="dpc-ro">{q.name}</span></div>
            <div className="dpc-srow"><span className="dpc-lbl">เลขที่สมุด</span><span className="dpc-ro yl mono">{pbwBookLabel(q.bookNo)}</span></div>
            <div className="dpc-srow"><span className="dpc-lbl">ตั้งแต่รายการ</span>
              <div className="pbw-range">
                <input className="cfg-input mono num" value={from} onChange={(e) => setFrom(e.target.value)} />
                <span className="pbw-sep">/</span>
                <input className="cfg-input mono num" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div className="dpc-srow"><span className="dpc-lbl">หน้าที่</span><input className="cfg-input mono num" value={page} onChange={(e) => setPage(e.target.value)} /></div>
            <div className="dpc-srow"><span className="dpc-lbl">บรรทัดที่</span><input className="cfg-input mono num" value={line} onChange={(e) => setLine(e.target.value)} /></div>
          </div>
          <div className="pbw-total">พิมพ์ทั้งหมด {count.toLocaleString()} รายการ</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8, lineHeight: 1.5 }}>
            <Icon name="info" size={11} /> รูปแบบสมุด {cfg.format} · {cfg.linesPerPage} บรรทัด/หน้า · เครื่องพิมพ์ {cfg.printer}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" disabled={count <= 0} onClick={() => onPrint({ from: Number(from), to: Number(to), page: Number(page), line: Number(line), count })}>
            <Icon name="print" /> พิมพ์
          </button>
        </div>
      </div>
    </>
  );
}

const PBW_NEWBOOK_REASONS = ['สมุดเต็มเล่ม', 'สมุดสูญหาย', 'สมุดชำรุด', 'อื่นๆ'];
const PBW_BOOK_ST = { active: { l: 'ใช้งาน', p: 'ok' }, closed: { l: 'ปิดเล่ม', p: '' }, lost: { l: 'สูญหาย', p: 'bad' }, damaged: { l: 'ชำรุด', p: 'warn' }, full: { l: 'เต็มเล่ม', p: '' } };
const pbwBookLabel = (no) => (window.depBookLabel ? window.depBookLabel(no) : no) || '—';

function PbwNewBookModal({ acc, bookNo, onClose, onOk }) {
  const [reason, setReason] = useState(PBW_NEWBOOK_REASONS[0]);
  const [other, setOther] = useState('');
  const today = window.dpcToday ? window.dpcToday() : new Date().toISOString().slice(0, 10);
  const nextNo = window.depBookPeek ? window.depBookPeek(acc, today) : '';
  let st = null;
  try { st = ((window.datLoad ? window.datLoad() : []).find(t => t.code === acc.typeCode) || {}).settings || null; } catch (e) {}
  const lostFee = reason === 'สมุดสูญหาย' && st && st.lostBookPenaltyOn ? Number(st.lostBookFee) || 0 : 0;
  const ok = nextNo && (reason !== 'อื่นๆ' || other.trim());
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94vw', padding: 0 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="plus" size={16} /></span>
          <h2>ออกสมุดคู่ฝากเล่มใหม่</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="dpc-rows" style={{ padding: 0 }}>
            <div className="dpc-srow"><span className="dpc-lbl">ชื่อบัญชี</span><span className="dpc-ro">{acc.name}</span></div>
            <div className="dpc-srow"><span className="dpc-lbl">เล่มเดิม</span><span className="dpc-ro mono">{pbwBookLabel(bookNo)}</span></div>
            <div className="dpc-srow"><span className="dpc-lbl">เหตุผล</span>
              <select className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)}>
                {PBW_NEWBOOK_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            {reason === 'อื่นๆ' && <div className="dpc-srow"><span className="dpc-lbl">ระบุเหตุผล</span><input className="cfg-input" value={other} onChange={(e) => setOther(e.target.value)} placeholder="ระบุเหตุผล" /></div>}
            <div className="dpc-srow"><span className="dpc-lbl">เลขที่สมุดใหม่</span><span className="dpc-ro yl mono">{nextNo ? pbwBookLabel(nextNo) : 'ประเภทเงินฝากนี้กำหนดไม่มีสมุด'}</span></div>
          </div>
          {lostFee > 0 && <div className="dat-warn" style={{ marginTop: 10 }}><Icon name="info" size={14} /><span>สมุดสูญหาย — ค่าธรรมเนียมตามประเภทเงินฝาก <b>{fmt.money(lostFee, 2)} บาท</b></span></div>}
          {!nextNo && <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}><Icon name="info" size={11} /> กำหนดได้ที่ ค่าคงที่ › ประเภทเงินฝาก (การถือสมุด)</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" disabled={!ok} onClick={() => onOk({ reason: reason === 'อื่นๆ' ? other.trim() : reason, kind: reason, lostFee })}>
            <Icon name="check" /> ออกสมุดเล่มใหม่
          </button>
        </div>
      </div>
    </>
  );
}

function DepPassbookWorkPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const cfg = window.DEP_PASSBOOK_SEED;
  const [accTick, setAccTick] = useState(0);
  const accounts = React.useMemo(() => window.depTxnLoadAccounts(), [accTick]);
  const ledger = window.depTxnLoadLedger ? window.depTxnLoadLedger() : [];
  // เลขที่สมุดดึงจากบัญชี (ไม่มี → เลขเดิมของระบบเก่า)
  const [queue0, setQueue] = useState(() => window.DEP_PASSBOOK_QUEUE_SEED.map((q, i) => ({
    ...q, legacyBookNo: String(20317 + i * 118).padStart(10, '0'),
    pending: q.pending.map(p => ({ ...p })),
  })));
  const queue = queue0.map(q => {
    const a = accounts.find(x => x.accNo === q.accNo);
    const hist = (a && a.bookHistory) || [];
    return { ...q, bookNo: (a && a.certNo) || q.legacyBookNo, bookSeq: Math.max(1, hist.length), bookHistory: hist };
  });
  const [newBookOpen, setNewBookOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);

  const cur = sel ? queue.find(q => q.accNo === sel) : null;
  const accRec = cur ? accounts.find(a => a.accNo === cur.accNo) : null;
  const rows = cur ? pbwRows(cur, ledger) : [];
  const pages = Math.max(1, Math.ceil(rows.length / PBW_PER_PAGE));
  const pageRows = rows.slice((page - 1) * PBW_PER_PAGE, page * PBW_PER_PAGE);
  const pendingCount = cur ? cur.pending.length : 0;
  const minBal = accRec ? ((window.DEP_ACCTYPE_SEED || []).find(t => t.code === accRec.typeCode)?.cond?.minBalance || 0) : 0;
  const withdrawable = accRec ? Math.max(0, accRec.balance - minBal) : 0;

  const pick = (q) => { setSel(q.accNo); setPage(1); };

  const fireBrowserPrint = () => {
    document.documentElement.classList.add('dep-printing');
    const cleanup = () => { document.documentElement.classList.remove('dep-printing'); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 60);
  };

  const doPrintBook = (opt) => {
    setModal(false);
    fireBrowserPrint();
    setQueue(queue0.map(x => x.accNo === cur.accNo ? { ...x, lastLine: (x.lastLine || 0) + x.pending.length, pending: [] } : x));
    audit.log({ action: 'print', module: 'เงินฝาก — พิมพ์สมุด–สลิป', target: `${cur.accNo} · ${cur.name}`,
      summary: `พิมพ์สมุดคู่ฝาก ${opt.count} รายการ (รายการที่ ${opt.from}–${opt.to}) หน้า ${opt.page} บรรทัดที่ ${opt.line}` });
    onToast && onToast(`พิมพ์สมุดคู่ฝากบัญชี ${cur.accNo} จำนวน ${opt.count} รายการ`);
  };

  const printSlip = (r) => {
    fireBrowserPrint();
    audit.log({ action: 'print', module: 'เงินฝาก — พิมพ์สมุด–สลิป', target: `${cur.accNo} · ${cur.name}`,
      summary: `พิมพ์สลิปรายการ ${r.txnId} (ลำดับ ${r.seq} · ${fmt.date(r.date)})` });
    onToast && onToast(`พิมพ์สลิปรายการ ${r.txnId} — ${r.desc}`);
  };

  const newBook = ({ reason, kind }) => {
    if (!accRec) return;
    const today = window.dpcToday ? window.dpcToday() : new Date().toISOString().slice(0, 10);
    const no = window.depBookIssue ? window.depBookIssue(accRec, today) : '';
    if (!no) return;
    const stOld = kind === 'สมุดสูญหาย' ? 'lost' : kind === 'สมุดชำรุด' ? 'damaged' : kind === 'สมุดเต็มเล่ม' ? 'full' : 'closed';
    const hist0 = accRec.bookHistory && accRec.bookHistory.length ? accRec.bookHistory
      : (cur.bookNo ? [{ no: cur.bookNo, status: 'active', issuedAt: accRec.openDate || '', reason: window.depBookValid && window.depBookValid(cur.bookNo) ? 'เปิดบัญชี' : 'สมุดเดิม (ระบบเก่า)' }] : []);
    const hist = [{ no, issuedAt: today, reason, status: 'active', by: window.DEP_OPS_USER },
      ...hist0.map(h => h.status === 'active' ? { ...h, status: stOld, closedAt: today, closeReason: reason } : h)];
    const all = window.depTxnLoadAccounts().map(a => a.accNo === accRec.accNo ? { ...a, certNo: no, noBook: false, bookHistory: hist } : a);
    window.depTxnSaveAccounts(all); setAccTick(t => t + 1);
    setQueue(queue0.map(x => x.accNo === cur.accNo ? { ...x, lastLine: 0 } : x));
    setNewBookOpen(false);
    audit.log({ action: 'create', module: 'เงินฝาก — พิมพ์สมุด–สลิป', target: `${cur.accNo} · ${cur.name}`,
      summary: `ออกสมุดคู่ฝากเล่มใหม่ ${pbwBookLabel(no)} (เล่มที่ ${hist.length}) — ${reason}`,
      changes: [{ field: 'เลขที่สมุด', before: pbwBookLabel(cur.bookNo), after: pbwBookLabel(no) }] });
    onToast && onToast(`ออกสมุดเล่มใหม่ ${window.depBookFmt ? window.depBookFmt(no) : no} ให้บัญชี ${cur.accNo} แล้ว — เริ่มพิมพ์บรรทัดที่ 1`);
  };

  const reprintCover = () => {
    fireBrowserPrint();
    audit.log({ action: 'print', module: 'เงินฝาก — พิมพ์สมุด–สลิป', target: `${cur.accNo} · ${cur.name}`, summary: 'Re-Print ปกสมุดคู่ฝาก' });
    onToast && onToast(`Re-Print ปกสมุดบัญชี ${cur.accNo}`);
  };

  return (
    <div data-screen-label="หน้าพิมพ์สมุด–สลิป">
      <div className="page-actions dep-open-sticky" style={{ flexWrap: 'wrap', gap: 10 }} ref={(el) => {
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
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>พิมพ์สมุด–สลิป</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปรับสมุดคู่ฝาก (Auto Passbook) · พิมพ์สลิปต่อรายการ · ออกสมุดเล่มใหม่และ Re-Print ปกสมุด</div>
        </div>
        <span className="spacer" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn primary sm" disabled={!cur || !pendingCount} onClick={() => setModal(true)}><Icon name="print" /> พิมพ์สมุด{pendingCount ? ` (${pendingCount})` : ''}</button>
          <button className="btn sm" disabled={!cur || !accRec} onClick={() => setNewBookOpen(true)}><Icon name="plus" /> ออกสมุดใหม่</button>
          <button className="btn sm danger" disabled={!cur} onClick={reprintCover}><Icon name="print" /> Reprint ปกสมุด</button>
        </div>
      </div>

      <div className="search-card dpc-card">
        <div className="dpc-toolbar" style={{ flexWrap: 'wrap' }}>
          <span className="dpc-print-label">เครื่องพิมพ์ <Icon name="chevRight" size={12} /></span>
          <span className="dpc-ro" style={{ flex: '1 1 240px', maxWidth: 420, minWidth: 0 }}>{cfg.printer}</span>
          <span className="spacer" />
          <span className="chip">{cfg.template} · {cfg.linesPerPage} บรรทัด/หน้า</span>
        </div>
        <div className="dpc-rows pbw-head" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          <div className="dpc-srow"><span className="dpc-lbl">เลขที่บัญชี</span>
            <div className="pbw-acc" style={{ gridTemplateColumns: '62px minmax(0, 1fr)', minWidth: 0 }}>
              <span className="dpc-ro mono center" style={{ width: 62 }}>{cur ? cur.accNo.slice(0, 3) : '000'}</span>
              <DepAccountSearchField accounts={accounts} value={accRec || null} placeholder="ค้นหาเลขบัญชี"
                onPick={(a) => { const q = queue.find(x => x.accNo === a.accNo); if (q) pick(q); else onToast && onToast('บัญชีนี้ไม่มีคิวสมุดคู่ฝาก'); }} />
            </div>
          </div>
          <div className="dpc-srow"><span className="dpc-lbl">สมุดคู่ฝาก</span><span className="dpc-ro mono center">{cur ? cur.bookSeq : '—'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">เลขสมาชิก</span><span className="dpc-ro mono">{cur ? cur.member : '—'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">ชื่อบัญชี</span><span className="dpc-ro">{cur ? cur.name : '—'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">ยอดคงเหลือ</span><span className="dpc-ro num mono">{accRec ? fmt.money(accRec.balance, 2) : '0.00'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">ประเภทบัญชี</span><span className="dpc-ro">{accRec ? `${accRec.typeCode}  ${accRec.type}` : (cur ? cur.type : '—')}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">ยอดถอนได้</span><span className="dpc-ro num mono neg">{accRec ? fmt.money(withdrawable, 2) : '0.00'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">เลขที่สมุด</span><span className="dpc-ro mono" title={cur ? pbwBookLabel(cur.bookNo) : ''}>{cur ? pbwBookLabel(cur.bookNo) : '—'}</span></div>
          <div className="dpc-srow"><span className="dpc-lbl">พิมพ์ล่าสุดบรรทัด</span><span className="dpc-ro mono center">{cur ? cur.lastLine : '—'}</span></div>
        </div>
      </div>

      {!cur ? (
        <div className="pbw-queue search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
          <div className="dat-section-head"><span className="dat-section-ico"><Icon name="wallet" size={15} /></span>
            <div className="dat-section-title">คิวบัญชีรอปรับสมุด<span className="muted" style={{ fontWeight: 400 }}> · {queue.filter(q => q.pending.length).length} บัญชี</span></div></div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 620 }}>
              <thead><tr><th style={{ width: 150 }}>เลขที่บัญชี</th><th>สมาชิก</th><th>ประเภท</th><th className="center" style={{ width: 130 }}>เลขที่สมุด</th><th className="center" style={{ width: 90 }}>รอปรับ</th><th className="center" style={{ width: 80 }} /></tr></thead>
              <tbody>
                {queue.map(q => (
                  <tr key={q.accNo} className="clickable" onClick={() => pick(q)}>
                    <td className="mono">{q.accNo}</td>
                    <td><div className="lt-row-name">{q.name}</div><div className="lt-row-note muted mono">{q.member}</div></td>
                    <td style={{ fontSize: 12 }}>{q.type}</td>
                    <td className="center mono">{window.depBookFmt ? window.depBookFmt(q.bookNo) : q.bookNo}</td>
                    <td className="center">{q.pending.length ? <span className="pill warn">{q.pending.length}</span> : <span className="pill ok">ครบ</span>}</td>
                    <td className="center"><button className="btn ghost sm">เปิด <Icon name="chevRight" size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="tabs-container" style={{ marginTop: 12, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div className="dat-section-head" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="dat-section-ico"><Icon name="history" size={15} /></span>
                <span className="dat-section-title">รายการเคลื่อนไหว<span className="muted" style={{ fontWeight: 400 }}> · {rows.length} รายการ · รอปรับสมุด {pendingCount} บรรทัด</span></span>
              </span>
              <button className="btn ghost sm" onClick={() => { setSel(null); setPage(1); }}>เปลี่ยนบัญชี</button>
            </div>
            <div className="table-wrap" style={{ margin: 16 }}><div className="table-scroll">
              <table className="tbl pbw-tbl" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 62 }}>ลำดับ</th>
                    <th className="center" style={{ width: 132 }}>รหัสรายการ</th>
                    <th className="center" style={{ width: 118 }}>วันที่</th>
                    <th className="center" style={{ width: 100 }}>รายการ</th>
                    <th className="right">ถอน</th>
                    <th className="right">ฝาก</th>
                    <th className="right">ยอดคงเหลือ</th>
                    <th className="center" style={{ width: 90 }}>พิมพ์ Book</th>
                    <th className="center" style={{ width: 130 }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={r.seq + '-' + i} className={r.printed ? '' : 'pbw-pending'}>
                      <td className="center mono">{r.seq}</td>
                      <td className="center mono" style={{ fontSize: 11.5 }}>{r.txnId}</td>
                      <td className="center mono">{fmt.date(r.date)}</td>
                      <td className="center mono">{r.code}</td>
                      <td className="right mono">{r.wd ? fmt.money(r.wd, 2) : ''}</td>
                      <td className="right mono">{r.dp ? fmt.money(r.dp, 2) : ''}</td>
                      <td className="right mono">{fmt.money(r.bal, 2)}</td>
                      <td className="center"><input type="checkbox" className="ct-check" checked={r.printed} disabled readOnly /></td>
                      <td className="center"><div className="col-gap" style={{ justifyContent: 'center', gap: 6 }}><button className="btn sm ex-row-btn" onClick={() => printSlip(r)}><Icon name="print" size={13} /> พิมพ์สลิป</button></div></td>
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 22 }}>ไม่มีรายการเคลื่อนไหว</td></tr>}
                </tbody>
              </table>
            </div></div>
            {pages > 1 && (
              <div className="pbw-pager" style={{ padding: '0 16px 16px', flexWrap: 'wrap' }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={"pbw-pg" + (p === page ? ' active' : '')} onClick={() => setPage(p)}>[{p}]</button>
                ))}
                <span className="muted" style={{ marginLeft: 10, fontSize: 12 }}>Go To:</span>
                <select className="cfg-input" style={{ width: 72, height: 28 }} value={page} onChange={(e) => setPage(Number(e.target.value))}>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="lt-list-foot muted"><Icon name="info" size={12} /> ช่องพิมพ์ Book ที่ติ๊กแล้วคือรายการที่ปรับลงสมุดเรียบร้อย · แถวไฮไลต์คือบรรทัดที่ยังรอปรับสมุด</div>

          {/* ทะเบียนสมุดของบัญชี */}
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 12 }}>
            <div className="dat-section-head"><span className="dat-section-ico"><Icon name="report" size={15} /></span>
              <div className="dat-section-title">ทะเบียนสมุดคู่ฝาก<span className="muted" style={{ fontWeight: 400 }}> · {Math.max(1, cur.bookHistory.length)} เล่ม</span></div></div>
            <div className="table-wrap" style={{ margin: 16 }}><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 760 }}>
                <thead><tr>
                  <th className="center" style={{ width: 62 }}>เล่มที่</th><th>เลขที่สมุด</th>
                  <th className="center" style={{ width: 120 }}>วันที่ออก</th><th>เหตุผลที่ออก</th>
                  <th className="center" style={{ width: 110 }}>สถานะ</th><th>หมายเหตุ</th>
                </tr></thead>
                <tbody>
                  {(cur.bookHistory.length ? cur.bookHistory : [{ no: cur.bookNo, status: 'active', issuedAt: accRec ? accRec.openDate : '', reason: 'เปิดบัญชี' }]).map((h, i, arr) => {
                    const st = PBW_BOOK_ST[h.status] || { l: h.status || '—', p: '' };
                    return (
                      <tr key={h.no + '-' + i}>
                        <td className="center mono">{arr.length - i}</td>
                        <td className="mono">{pbwBookLabel(h.no)}</td>
                        <td className="center mono">{h.issuedAt ? fmt.date(h.issuedAt) : '—'}</td>
                        <td>{h.reason || '—'}</td>
                        <td className="center"><span className={'pill ' + st.p}>{st.l}</span></td>
                        <td className="muted">{h.closedAt ? 'ปิดเล่ม ' + fmt.date(h.closedAt) + (h.closeReason ? ' · ' + h.closeReason : '') : (window.depBookValid && !window.depBookValid(h.no) ? 'เลขระบบเดิม' : '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div></div>
          </div>
        </>
      )}

      {newBookOpen && cur && accRec && <PbwNewBookModal acc={accRec} bookNo={cur.bookNo} onClose={() => setNewBookOpen(false)} onOk={newBook} />}
      {modal && cur && <PbwPrintModal q={cur} rows={rows} cfg={cfg} onClose={() => setModal(false)} onPrint={doPrintBook} />}
    </div>
  );
}

Object.assign(window, { DepPassbookWorkPage, PbwPrintModal });
