// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ใบสำคัญรับ (หน้าหลัก)
//  รายการใบสำคัญรับ + สถานะ → เปิด/แก้ไข/พิมพ์ RV/พิมพ์ใบเสร็จ · สร้างใหม่
// ════════════════════════════════════════════════════════════════════

const rcvTodayIso = () => new Date().toISOString().slice(0, 10);

function rcvBlankDoc(list) {
  const today = rcvTodayIso();
  return {
    id: window.rcvNextNo(list, today), docDate: today, postDate: today,
    fiscalYear: window.rcvYearOf(today), period: window.rcvPeriodOf(today),
    docType: 'general', dept: 'ฝ่ายการเงิน', createdBy: 'นางจันทร์เพ็ญ มาลี', status: 'draft',
    refNo: '', headerNote: '',
    budget: { mode: 'none', cats: [] },
    claimRef: null,
    payer: { type: 'member', payerId: '', code: '', name: '', memberNo: '', dept: '', taxId: '', address: '', phone: '' },
    receive: { method: 'cash', receiveDate: today, coopAccount: 'cash', bank: '', bankAccount: '',
               transferRef: '', chequeNo: '', chequeDate: '', chequeBank: '', bankFee: 0 },
    lines: [],
    entries: [],
    files: [],
    receipt: { issue: true, no: '', date: today, name: '', address: '', status: 'none' },
    _new: true,
  };
}

// ════════════════════════════════════════════════════════════════════
//  Popup — ทำรายการสำเร็จ (สรุปประกอบการบันทึกใบสำคัญรับ + พิมพ์เอกสาร)
// ════════════════════════════════════════════════════════════════════
function RcvSaveSuccessModal({ doc, onPrintRv, onPrintReceipt, onClose }) {
  const gross = (doc.receive && doc.receive.grossAmount !== '' && doc.receive.grossAmount != null)
    ? Number(doc.receive.grossAmount) : window.rcvSumReceived(doc.lines);
  const fee = Number((doc.receive || {}).bankFee || 0);
  const net = gross - fee;
  const st = window.RCV_STATUS[doc.status] || window.RCV_STATUS.draft;
  const rcp = doc.receipt || {};
  const rows = [
    { k: 'เลขที่ใบสำคัญรับ', v: doc.id, mono: true },
    { k: 'ผู้ชำระเงิน', v: `${doc.payer.name || '—'}${doc.payer.memberNo ? ' · ' + doc.payer.memberNo : ''}` },
    { k: 'ประเภทใบสำคัญรับ', v: window.rcvDocTypeLabel(doc) },
    { k: 'จำนวนรายการรับเงิน', v: `${(doc.lines || []).length} รายการ` },
    { k: 'เลขที่ใบเสร็จรับเงิน', v: rcp.no || '—', mono: true },
  ];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 460 }}>
        <div className="modal-body" style={{ paddingTop: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, marginBottom: 16 }}>
            <div className="rcv-ok-badge"><Icon name="check" size={26} /></div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'rgba(0,0,0,.88)', lineHeight: 1.35 }}>ทำรายการสำเร็จ</h2>
            <div style={{ fontSize: 13, color: 'rgba(0,0,0,.55)', lineHeight: 1.65 }}>บันทึกใบสำคัญรับและออกใบเสร็จรับเงินเรียบร้อยแล้ว</div>
          </div>
          <div className="rcv-ok-summary">
            {rows.map((r, i) => (
              <div className="rcv-ok-row" key={i}>
                <span className="k">{r.k}</span>
                <span className={"v" + (r.mono ? ' mono' : '')}>{r.v}</span>
              </div>
            ))}
            <div className="rcv-ok-row total">
              <span className="k">ยอดสุทธิรับเข้า</span>
              <span className="v mono">{fmt.money(net, 2)} บาท</span>
            </div>
            <div className="rcv-ok-row">
              <span className="k">สถานะเอกสาร</span>
              <span className="v"><span className={"pill " + st.pill}>{st.l}</span></span>
            </div>
          </div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn sm" onClick={onPrintRv}><Icon name="print" /> พิมพ์ใบสำคัญรับ</button>
          <button className="btn sm accent" onClick={onPrintReceipt}><Icon name="receipt" /> พิมพ์ใบเสร็จรับเงิน</button>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn primary sm" onClick={onClose}>เสร็จสิ้น</button>
        </div>
      </div>
    </>
  );
}

function ReceiptWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.rcvLoad);
  const [structure] = useState(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])));
  const [mode, setMode] = useState('list');     // 'list' | 'form'
  const [editDoc, setEditDoc] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);
  const [printMode, setPrintMode] = useState('rv');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [qD, setQD] = useState('');
  const [typeD, setTypeD] = useState('all');
  const [statusD, setStatusD] = useState('all');
  const applySearch = () => { setQ(qD); setTypeFilter(typeD); setStatusFilter(statusD); };
  const resetSearch = () => { setQD(''); setTypeD('all'); setStatusD('all'); setQ(''); setTypeFilter('all'); setStatusFilter('all'); };
  const [claimReport, setClaimReport] = useState(false);
  const [savedDoc, setSavedDoc] = useState(null);   // เอกสารที่เพิ่งบันทึกสำเร็จ → popup

  const persist = (next) => { setList(next); window.rcvSave(next); };

  const doPrint = (v, what) => {
    setPrintMode(what === 'receipt' ? 'receipt' : 'rv');
    setPrintDoc(v);
    setTimeout(() => window.printReceiptDoc(onToast, what === 'receipt' ? 'ใบเสร็จรับเงิน' : 'ใบสำคัญรับ'), 80);
  };

  const newReceipt = () => { setEditDoc(rcvBlankDoc(list)); setMode('form'); };
  const openReceipt = (v) => { setEditDoc(JSON.parse(JSON.stringify(v))); setMode('form'); };

  const handleSave = (doc, alsoPrint) => {
    const clean = { ...doc }; delete clean._new;
    // — ออกเลขที่ใบเสร็จให้อัตโนมัติเมื่อบันทึก — เพื่อให้พิมพ์ใบเสร็จได้ทันที
    const rcp = clean.receipt || {};
    if (rcp.status !== 'issued') {
      const no = rcp.no || window.rcvNextReceiptNo(list, clean.docDate);
      clean.receipt = { ...rcp, issue: true, no, date: rcp.date || clean.docDate, status: 'issued',
        name: rcp.name || clean.payer.name, address: rcp.address || clean.payer.address };
    }
    const exists = list.some(v => v.id === clean.id);
    const next = exists ? list.map(v => v.id === clean.id ? clean : v) : [clean, ...list];
    persist(next);
    const gross = (clean.receive && clean.receive.grossAmount !== '' && clean.receive.grossAmount != null)
      ? Number(clean.receive.grossAmount) : window.rcvSumReceived(clean.lines);
    audit.log({
      action: exists ? 'update' : 'create', module: 'บัญชี — ใบสำคัญรับ',
      target: `${clean.id} · ${clean.payer.name || '—'}`,
      summary: `${exists ? 'แก้ไข' : 'สร้าง'}ใบสำคัญรับ ${clean.id} (${window.fmt.money(gross, 2)} บาท)`,
      changes: exists ? [] : [{ field: 'เลขที่ใบสำคัญรับ', before: '—', after: clean.id }],
    });
    if (alsoPrint) doPrint(clean, 'rv');
    setMode('list'); setEditDoc(null);
    // popup บันทึกสำเร็จ — แบบกลางเดียวกับทั้งระบบ
    const rcNo = clean.receipt && clean.receipt.status === 'issued' ? clean.receipt.no : '';
    window.depSuccess ? window.depSuccess({
      title: 'บันทึกใบสำคัญรับเรียบร้อยแล้ว', desc: 'เลขที่ ' + clean.id,
      lines: [['ผู้ชำระเงิน', clean.payerName || (clean.payer && clean.payer.name) || '—'], ...(rcNo ? [['เลขที่ใบเสร็จ', rcNo]] : []),
        ['ยอดรับสุทธิ', fmt.money((window.rcvTotals ? window.rcvTotals(clean).net : clean.total) || 0, 2) + ' บาท']],
      onPrint: () => doPrint(clean, rcNo ? 'receipt' : 'rv'), printLabel: rcNo ? 'พิมพ์ใบเสร็จรับเงิน' : 'พิมพ์ใบสำคัญรับ',
    }) : setSavedDoc(clean);
  };

  const printReceiptFromForm = (doc) => doPrint(doc, 'receipt');

  // ─── ฟอร์ม ────────────────────────────────────────────────────────
  if (mode === 'form' && editDoc) {
    return (
      <>
        <ReceiptForm receipt={editDoc} receipts={list} structure={structure}
                     onSave={handleSave} onCancel={() => { setMode('list'); setEditDoc(null); }}
                     onPrintReceipt={printReceiptFromForm} onPrintRv={(doc) => doPrint(doc, 'rv')} onToast={onToast} />
        <ReceiptPrintSheet doc={printDoc} mode={printMode} />
      </>
    );
  }

  // ─── รายการ ──────────────────────────────────────────────────────
  const filtered = list.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (typeFilter !== 'all' && v.docType !== typeFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return v.id.toLowerCase().includes(n) || (v.payer.name || '').toLowerCase().includes(n)
        || (v.payer.code || '').toLowerCase().includes(n) || (v.refNo || '').toLowerCase().includes(n);
    }
    return true;
  });

  return (
    <div data-screen-label="หน้ารายการใบสำคัญรับ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบสำคัญรับ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            บันทึกรายการรับเงินของสหกรณ์ — รับชำระหนี้ เงินฝาก ค่าหุ้น ลูกหนี้ตัวแทน รายได้อื่น พร้อมสร้างคู่บัญชีและออกใบเสร็จ
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setClaimReport(true)}><Icon name="report" /> รายงานรับเงินสินไหม</button>
        <button className="btn primary sm" onClick={newReceipt}><Icon name="plus" /> สร้างใบสำคัญรับ</button>
      </div>

      <div className="search-card">
        <div className="rcv-list-toolbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ค้นหา</span>
            <div className="dep-input" style={{ width: '100%', minWidth: 0, height: 32, boxSizing: 'border-box', background: '#fff' }}>
              <Icon name="search" size={14} />
              <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applySearch(); }}
                     placeholder="เลขที่ / ผู้ชำระเงิน / อ้างอิง" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภท</span>
            <window.RcvSelect className="filter-select" value={typeD} onChange={(e) => setTypeD(e.target.value)} style={{ width: '100%' }}>
              <option value="all">ทุกประเภท</option>
              {window.RCV_DOC_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </window.RcvSelect>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <window.RcvSelect className="filter-select" value={statusD} onChange={(e) => setStatusD(e.target.value)} style={{ width: '100%' }}>
              <option value="all">ทุกสถานะ</option>
              {window.RCV_STATUS_ORDER.map(k => <option key={k} value={k}>{window.RCV_STATUS[k].l}</option>)}
            </window.RcvSelect>
          </div>
          <button className="btn primary rcv-tb-btn" onClick={applySearch}>ค้นหา</button>
          <button className="btn rcv-tb-btn" onClick={resetSearch}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 150 }}>เลขที่</th>
                <th style={{ width: 110 }}>วันที่เอกสาร</th>
                <th style={{ minWidth: 200 }}>ผู้ชำระเงิน</th>
                <th style={{ width: 130 }}>ประเภท</th>
                <th className="num" style={{ width: 130 }}>ยอดรับ (บาท)</th>
                <th className="center" style={{ width: 100 }}>ใบเสร็จ</th>
                <th className="center" style={{ width: 130 }}>สถานะ</th>
                <th className="center" style={{ width: 260, whiteSpace: 'nowrap' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>
                  ไม่พบใบสำคัญรับที่ตรงกับเงื่อนไข
                </td></tr>
              )}
              {filtered.map(v => {
                const st = window.RCV_STATUS[v.status] || window.RCV_STATUS.draft;
                const gross = window.rcvSumReceived(v.lines);
                const rcp = v.receipt || {};
                const rcpIssued = rcp.status === 'issued';
                return (
                  <tr key={v.id} className="clickable" onClick={() => openReceipt(v)}>
                    <td>
                      <div className="mono">{v.id}</div>
                      {v.refNo && <div className="muted mono" style={{ fontSize: 10.5 }}>{v.refNo}</div>}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.docDate)}</td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{v.payer.name || '—'}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{window.rcvPayerTypeLabel(v.payer.type)}{v.payer.memberNo ? ` · ${v.payer.memberNo}` : ''}</div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{window.rcvDocTypeLabel(v)}</td>
                    <td className="num"><div className="mono" style={{ fontWeight: 600 }}>{fmt.money(gross, 2)}</div></td>
                    <td className="center">{rcpIssued ? <span className="chip success" style={{ fontSize: 11 }}>ออกแล้ว</span>
                      : rcp.status === 'cancelled' ? <span className="chip danger" style={{ fontSize: 11 }}>ยกเลิก</span>
                      : <span className="muted" style={{ fontSize: 11 }}>—</span>}</td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'nowrap' }}>
                        <button className="btn sm" onClick={() => openReceipt(v)}><Icon name="eye" size={12} /> ดู</button>
                        <button className="btn sm" onClick={() => doPrint(v, 'rv')}><Icon name="print" size={12} /> พิมพ์</button>
                        <button className="btn sm" disabled={!rcpIssued}
                                title={rcpIssued ? 'พิมพ์ใบเสร็จรับเงิน' : 'ยังไม่ได้ออกใบเสร็จ'}
                                onClick={() => doPrint(v, 'receipt')}><Icon name="receipt" size={12} /> ใบเสร็จ</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ใบสำคัญรับสร้างคู่บัญชีเดบิต/เครดิตอัตโนมัติจาก Mapping — เมื่อผ่านรายการจะเข้าบัญชีแยกประเภท และทุกขั้นตอนถูกบันทึกใน “ประวัติการใช้งาน”
      </div>

      <ReceiptPrintSheet doc={printDoc} mode={printMode} />
      {savedDoc && (
        <RcvSaveSuccessModal doc={savedDoc}
          onPrintRv={() => doPrint(savedDoc, 'rv')}
          onPrintReceipt={() => doPrint(savedDoc, 'receipt')}
          onClose={() => setSavedDoc(null)} />
      )}
      {claimReport && (
        <RcvClaimReportModal receipts={list} onClose={() => setClaimReport(false)}
          onOpenReceipt={(id) => { const v = list.find(x => x.id === id); if (v) { setClaimReport(false); openReceipt(v); } }} />
      )}
    </div>
  );
}

Object.assign(window, { ReceiptWorkspace });
