// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — อนุมัติทำรายการ
//  ดึงรายการเงินฝากที่รออนุมัติ (รหัสรายการ / ชื่อบัญชี / จำนวน)
//  เมื่ออนุมัติ ระบบแสตมป์: เลขที่รายการอนุมัติ · เครื่อง/วันที่/ผู้ขอ · เครื่อง/วันที่/ผู้อนุมัติ · จำนวนรวม
// ════════════════════════════════════════════════════════════════════

function depApvStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear() + 543} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function DepApproveField({ label, value, mono, strong }) {
  return (
    <div className="dat-field">
      <label>{label}</label>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly value={value || ''} placeholder="—"
             style={strong ? { fontWeight: 700, color: 'var(--primary-700)' } : undefined} />
    </div>
  );
}

// ประเภทหลัก + ช่องทาง จากชื่อรายการ
const APV_KIND = [
  { k: 'ถอนเงิน', re: /^ถอน/, c: '#cf1322', bg: '#fff1f0', bd: '#ffa39e' },
  { k: 'ปิดบัญชี', re: /^ปิดบัญชี/, c: '#d46b08', bg: '#fff7e6', bd: '#ffd591' },
  { k: 'โอนระหว่างบัญชี', re: /^โอน/, c: '#0958d9', bg: '#e6f4ff', bd: '#91caff' },
  { k: 'ปลดล็อกบัญชี', re: /^ปลดล็อก/, c: '#531dab', bg: '#f9f0ff', bd: '#d3adf7' },
  { k: 'ฝากเงิน', re: /^ฝาก/, c: '#237450', bg: '#eafef2', bd: '#b7e4c7' },
];
const apvKindOf = (kind) => APV_KIND.find(x => x.re.test(String(kind || ''))) || { k: kind, c: 'rgba(0,0,0,.65)', bg: '#fafafa', bd: '#d9d9d9' };
const apvChannelOf = (kind) => { const m = String(kind || '').match(/—\s*(.+)$/); return m ? m[1] : (/ก่อนครบกำหนด/.test(kind) ? 'ก่อนครบกำหนด' : ''); };

function DepApprovePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  // รายการที่อนุมัติแล้ว (จำไว้ — ไม่กลับมาในคิว)
  const DONE_KEY = 'dep_apv_done';
  const loadDone = () => { try { return JSON.parse(localStorage.getItem(DONE_KEY) || '[]'); } catch (e) { return []; } };
  const parseD = (s) => { const m = String(s || '').match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?/); return m ? [m[3], m[2], m[1], m[4] || '00', m[5] || '00'].join('') : ''; };
  const queue = () => {
    const done = loadDone();
    const ul = (window.dpcUnlockReqLoad ? window.dpcUnlockReqLoad() : []).filter(r => r.status === 'pending').map(r => ({
      id: r.id, accNo: r.accNo, name: r.name, kind: 'ปลดล็อกบัญชี', amount: 0, reqBy: r.reqBy, reqTerm: r.reqTerm, reqDate: r.reqDate,
      reason: 'ไม่เคลื่อนไหว ' + Math.floor((r.idleDays || 0) / 365) + ' ปี — ' + r.reason, _unlock: true }));
    const wa = (window.dpcWdReqLoad ? window.dpcWdReqLoad() : []).filter(r => r.status === 'pending').map(r => ({
      id: r.id, accNo: r.accNo, name: r.name, kind: 'ถอนเงิน — ' + (r.money === 'CSH' ? 'เงินสด' : r.money === 'CHQ' ? 'เช็ค' : 'โอน'),
      amount: r.amount, reqBy: r.reqBy, reqTerm: r.reqTerm, reqDate: r.reqDate,
      reason: 'ถอนตั้งแต่ ' + (window.fmt ? window.fmt.money(window.DEP_WD_APV_LIMIT, 0) : '2,000,000') + ' บาทขึ้นไป · ' + r.code + ' ' + (r.codeLabel || ''), _wd: true }));
    return [...window.DEP_DAILY_APPROVALS.filter(r => !done.includes(r.id)).map(r => ({ ...r })), ...ul, ...wa]
      .sort((a, b) => parseD(a.reqDate).localeCompare(parseD(b.reqDate)));
  };
  const [rows, setRows] = useState(queue);
  const [sel, setSel] = useState([]);
  const [stamp, setStamp] = useState(null);
  const [qD, setQD] = useState(''); const [kD, setKD] = useState('');
  const [q, setQ] = useState('');   const [k, setK] = useState('');
  const kinds = APV_KIND.map(x => x.k);
  const refresh = () => { setRows(queue()); setSel([]); onToast && onToast('อัปเดตรายการรออนุมัติแล้ว'); };

  const nq = q.trim().toLowerCase();
  const list = rows.filter(r => (!k || apvKindOf(r.kind).k === k) &&
    (!nq || [r.id, r.accNo, r.name, r.reqBy].some(x => String(x || '').toLowerCase().includes(nq))));
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allOn = list.length > 0 && list.every(r => sel.includes(r.id));
  const picked = list.filter(r => sel.includes(r.id));
  const total = picked.reduce((s, r) => s + r.amount, 0);

  const [viewRow, setViewRow] = useState(null);
  const [rejectTxt, setRejectTxt] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const approve = (only) => {
    const picked = only ? [only] : list.filter(r => sel.includes(r.id));
    const total = picked.reduce((s, r) => s + r.amount, 0);
    const pickIds = picked.map(r => r.id);
    const first = picked[0];
    const st = {
      system: 'เงินฝาก',
      docNo: 'APV-2569-06-' + String(1200 + Math.floor(Math.random() * 90)),
      reqTerm: first.reqTerm, reqDate: first.reqDate, reqBy: first.reqBy,
      apvTerm: window.DEP_DAILY_TERMINAL, apvDate: depApvStamp(), apvBy: window.DEP_DAILY_APPROVER,
      count: picked.length, total,
    };
    setStamp(st);
    try { localStorage.setItem(DONE_KEY, JSON.stringify([...loadDone(), ...picked.filter(r => !r._unlock && !r._wd).map(r => r.id)])); } catch (e) {}
    const waIds = picked.filter(r => r._wd).map(r => r.id);
    if (waIds.length && window.dpcWdReqLoad) {
      window.dpcWdReqSave(window.dpcWdReqLoad().map(r => waIds.includes(r.id) ? { ...r, status: 'approved', apvBy: window.DEP_DAILY_APPROVER, apvDate: st.apvDate, apvNo: st.docNo } : r));
    }
    const ulIds = picked.filter(r => r._unlock).map(r => r.id);
    if (ulIds.length && window.dpcUnlockReqLoad) {
      const reqs = window.dpcUnlockReqLoad();
      const today = window.dpcToday ? window.dpcToday() : '';
      const un = window.dpcUnlocksLoad ? window.dpcUnlocksLoad() : {};
      reqs.forEach(r => { if (ulIds.includes(r.id)) {
        r.status = 'approved'; r.apvBy = window.DEP_DAILY_APPROVER; r.apvDate = st.apvDate;
        un[r.accNo] = { by: String(window.DEP_DAILY_APPROVER).replace(/\s*\(.*\)$/, ''), role: (String(window.DEP_DAILY_APPROVER).match(/\((.*)\)/) || [])[1] || 'หัวหน้า',
                        reason: r.reason, date: today, at: new Date().toISOString(), reqId: r.id, apvNo: st.docNo };
      } });
      window.dpcUnlockReqSave(reqs);
      window.dpcUnlocksSave && window.dpcUnlocksSave(un);
    }
    setRows(rows.filter(r => !pickIds.includes(r.id)));
    setSel(sel.filter(id => !pickIds.includes(id))); setViewRow(null);
    audit.log({
      action: 'approve', module: 'เงินฝาก — อนุมัติทำรายการ', target: st.docNo,
      summary: `อนุมัติรายการเงินฝาก ${st.count} รายการ รวม ${fmt.money(st.total, 2)} บาท`,
      changes: picked.map(r => ({ field: r.id, before: 'รออนุมัติ', after: 'อนุมัติแล้ว' })),
    });
    window.depSuccess({ title: 'อนุมัติรายการเรียบร้อยแล้ว', desc: 'เลขที่ ' + st.docNo,
      lines: [['จำนวนรายการ', st.count + ' รายการ'], ['ผู้อนุมัติ', st.apvBy], ['วันที่อนุมัติ', st.apvDate + ' น.'],
              ['จำนวนเงินที่อนุมัติ', fmt.money(st.total, 2) + ' บาท']] });
  };

  const reject = (r, why) => {
    const upd = (load, save) => { if (!load) return; save(load().map(x => x.id === r.id ? { ...x, status: 'rejected', rejectReason: why, apvBy: window.DEP_DAILY_APPROVER, apvDate: depApvStamp() } : x)); };
    if (r._wd) upd(window.dpcWdReqLoad, window.dpcWdReqSave);
    else if (r._unlock) upd(window.dpcUnlockReqLoad, window.dpcUnlockReqSave);
    else { try { localStorage.setItem(DONE_KEY, JSON.stringify([...loadDone(), r.id])); } catch (e) {} }
    setRows(rows.filter(x => x.id !== r.id)); setSel(sel.filter(id => id !== r.id));
    setViewRow(null); setRejecting(false); setRejectTxt('');
    audit.log({ action: 'reject', module: 'เงินฝาก — อนุมัติทำรายการ', target: r.id + ' · ' + r.accNo,
      summary: 'ไม่อนุมัติ' + r.kind + ' — ' + why, changes: [{ field: r.id, before: 'รออนุมัติ', after: 'ไม่อนุมัติ' }] });
    window.depSuccess({ title: 'บันทึกการไม่อนุมัติแล้ว', desc: r.id + ' · ' + r.accNo, lines: [['เหตุผล', why]] });
  };

  // ── popup รายละเอียดคำขอ ──
  const detailEl = viewRow && (() => {
    const r = viewRow;
    const acc = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : (window.DEP_TXN_ACCOUNTS_SEED || [])).find(a => a.accNo === r.accNo) || {};
    const ledger = window.depTxnLoadLedger ? window.depTxnLoadLedger() : [];
    const moves = window.dpcMoves ? window.dpcMoves(r.accNo, ledger).slice(0, 5) : [];
    const last = window.dpcLastMove ? window.dpcLastMove(r.accNo, ledger) : null;
    const idle = window.dpcIdleDays ? window.dpcIdleDays(last) : 0;
    const t = apvKindOf(r.kind), ch = apvChannelOf(r.kind);
    const isWd = t.k === 'ถอนเงิน';
    const bal = Number(acc.balance || 0);
    const kv = (k, v, mono) => <div className="dpc-kv"><span>{k}</span><b className={mono ? 'mono' : undefined}>{v == null || v === '' ? '—' : v}</b></div>;
    return ReactDOM.createPortal(<>
      <div className="modal-backdrop" style={{ zIndex: 1100, top: 'var(--navbar-h, 64px)' }} onClick={() => { setViewRow(null); setRejecting(false); }} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ zIndex: 1101, width: 760, maxWidth: '94vw',
           height: 'min(640px, calc(100vh - var(--navbar-h, 64px) - 48px))', maxHeight: 'none',
           top: 'calc(var(--navbar-h, 64px) + (100vh - var(--navbar-h, 64px)) / 2)', transform: 'translate(-50%, -50%)',
           display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              รายละเอียดคำขออนุมัติ
              <span className="apv-tag" style={{ color: t.c, background: t.bg, borderColor: t.bd }}>{t.k}</span>
            </h2>
            <div className="muted" style={{ fontSize: 12 }}><span className="mono">{r.id}</span> · ขอโดย {r.reqBy} ({r.reqTerm}) · {r.reqDate} น.</div>
          </div>
          <button className="close-btn" onClick={() => { setViewRow(null); setRejecting(false); }} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body apv-detail" style={{ overflowY: 'auto', minHeight: 0 }}>
          <div className="apv-sec-t">ข้อมูลบัญชี</div>
          <div className="apv-grid">
            {kv('เลขที่บัญชี', r.accNo, true)}{kv('ชื่อบัญชี', r.name)}
            {kv('ประเภทบัญชี', acc.typeCode ? acc.typeCode + ' ' + (acc.type || '') : acc.type)}
            {kv('ยอดคงเหลือ', fmt.money(bal, 2) + ' บาท', true)}
            {kv('เคลื่อนไหวล่าสุด', last ? fmt.date(last) : '—')}
            {kv('สถานะบัญชี', acc.frozen ? 'อายัด' : (acc.status === 'active' ? 'ปกติ' : acc.status))}
          </div>

          <div className="apv-sec-t">รายละเอียดคำขอ</div>
          <div className="apv-grid">
            {kv('ประเภทรายการ', r.kind)}
            {ch ? kv('วิธีทำรายการ', ch) : null}
            {!r._unlock && kv('จำนวนเงิน', fmt.money(r.amount, 2) + ' บาท', true)}
            {isWd && kv('ยอดคงเหลือหลังถอน', fmt.money(bal - r.amount, 2) + ' บาท', true)}
            {r._unlock && kv('ไม่เคลื่อนไหว', Math.floor(idle / 365) + ' ปี ' + (idle % 365) + ' วัน')}
            <div className="dpc-kv" style={{ gridColumn: '1 / -1' }}><span>เหตุผล / หมายเหตุ</span><b>{r.reason || '—'}</b></div>
            {acc.withdrawCond && isWd && (
              <div className="dpc-kv" style={{ gridColumn: '1 / -1' }}><span>เงื่อนไขการถอน</span><b style={{ whiteSpace: 'pre-line' }}>{acc.withdrawCond}</b></div>
            )}
          </div>

          <div className="apv-sec-t">รายการเคลื่อนไหวล่าสุด</div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>วันที่</th><th>รายการ</th><th className="right">ถอน</th><th className="right">ฝาก</th><th className="right">คงเหลือ</th></tr></thead>
            <tbody>
              {moves.length === 0 ? <tr><td colSpan="5" className="center muted">ไม่มีรายการเคลื่อนไหว</td></tr>
                : moves.map((m, i) => (
                  <tr key={i}>
                    <td className="mono">{fmt.date(m.date)}</td><td>{m.desc || m.label || m.code}</td>
                    <td className="right mono">{m.wd ? fmt.money(m.wd, 2) : ''}</td>
                    <td className="right mono">{m.dep ? fmt.money(m.dep, 2) : ''}</td>
                    <td className="right mono">{m.bal != null ? fmt.money(m.bal, 2) : ''}</td>
                  </tr>))}
            </tbody>
          </table></div>

          {rejecting && (
            <div style={{ marginTop: 14 }}>
              <label className="cfg-label" style={{ display: 'block', marginBottom: 6 }}>เหตุผลที่ไม่อนุมัติ <span className="cfg-required">*</span></label>
              <textarea className="cfg-input" rows={3} autoFocus value={rejectTxt} onChange={(e) => setRejectTxt(e.target.value)}
                        placeholder="ระบุเหตุผล — เจ้าหน้าที่ผู้ขอจะเห็นข้อความนี้" style={{ width: '100%', resize: 'vertical' }} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          {!rejecting ? <>
            <button className="btn" onClick={() => setRejecting(true)} style={{ color: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)' }}>ไม่อนุมัติ</button>
            <button className="btn primary" onClick={() => approve(r)}><Icon name="check" /> อนุมัติ</button>
          </> : <>
            <button className="btn" onClick={() => { setRejecting(false); setRejectTxt(''); }}>ย้อนกลับ</button>
            <button className="btn primary" disabled={!rejectTxt.trim()} onClick={() => reject(r, rejectTxt.trim())}
                    style={rejectTxt.trim() ? { background: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)' } : undefined}>ยืนยันไม่อนุมัติ</button>
          </>}
        </div>
      </div>
    </>, document.body);
  })();

  return (
    <div data-screen-label="อนุมัติทำรายการ">
      <div className="page-actions dep-open-sticky" ref={(el) => {
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
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติทำรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ผู้อนุมัติ: {window.DEP_DAILY_APPROVER} · เครื่อง {window.DEP_DAILY_TERMINAL}{false && <>อนุมัติรายการเงินฝากที่ต้องได้รับการอนุมัติจากผู้มีอำนาจ — ระบบแสตมป์ข้อมูลผู้ขอและผู้อนุมัติทุกครั้ง</>}</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" data-keep-top="" disabled={picked.length === 0} onClick={() => approve()}>
          <Icon name="check" /> อนุมัติรายการที่เลือก{picked.length ? ' (' + picked.length + ')' : ''}
        </button>
      </div>

      <div className="search-card" style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto auto', gap: 8, alignItems: 'center' }}>
        <div className="dep-input" style={{ height: 32, minHeight: 32, boxSizing: 'border-box', background: '#fff', minWidth: 0, margin: 0, padding: '0 10px', borderRadius: 2 }}>
          <Icon name="search" size={14} />
          <input value={qD} onChange={(e) => setQD(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setQ(qD); setK(kD); } }}
                 placeholder="ค้นหารหัสรายการ / เลขที่บัญชี / ชื่อบัญชี / ผู้ขออนุมัติ" />
        </div>
        <select className="cfg-input" style={{ height: 32, minHeight: 32, boxSizing: 'border-box', margin: 0 }} value={kD} onChange={(e) => setKD(e.target.value)}>
          <option value="">ทุกประเภทรายการ</option>
          {kinds.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="btn primary" style={{ height: 32 }} onClick={() => { setQ(qD); setK(kD); }}>ค้นหา</button>
        <button className="btn" style={{ height: 32 }} onClick={() => { setQD(''); setKD(''); setQ(''); setK(''); }}>รีเซ็ต</button>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <DepSecHead bar icon="filter" title={'รายการที่รออนุมัติ (' + rows.length + ')'} sub="เรียงตามวันที่ขอ — รายการที่รอนานที่สุดอยู่บนสุด" meta={'เครื่องที่ใช้อนุมัติ ' + window.DEP_DAILY_TERMINAL}
          right={<button className="btn sm" onClick={refresh} title="อัปเดตรายการที่ส่งเข้ามาใหม่"><Icon name="refresh" /> รีเฟรช</button>} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1040 }}>
            <thead><tr>
              <th className="center" style={{ width: 40 }}>
                <input type="checkbox" className="apv-chk" checked={allOn} disabled={list.length === 0}
                       onChange={() => setSel(allOn ? sel.filter(id => !list.some(r => r.id === id)) : [...new Set([...sel, ...list.map(r => r.id)])])} />
              </th>
              <th style={{ width: 150 }}>รหัสรายการ</th>
              <th style={{ width: 132 }}>เลขที่บัญชี</th>
              <th>ชื่อบัญชี</th>
              <th style={{ width: 180 }}>ประเภทรายการ</th>
              <th style={{ width: 150 }}>ผู้ขออนุมัติ</th>
              <th className="center" style={{ width: 130 }}>วันที่ขอ</th>
              <th className="right" style={{ width: 120 }}>จำนวน</th>
              <th className="center" style={{ width: 76 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan="9" className="center muted" style={{ padding: '28px 12px' }}>
                  {rows.length === 0 ? 'ไม่มีรายการรออนุมัติ' : 'ไม่พบรายการที่ตรงกับเงื่อนไข'}
                </td></tr>
              ) : list.map(r => (
                <tr key={r.id} className={sel.includes(r.id) ? 'is-selected' : ''}>
                  <td className="center"><input type="checkbox" className="apv-chk" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                  <td className="mono">{r.id}</td>
                  <td className="mono">{r.accNo}</td>
                  <td>{r.name}<div className="muted" style={{ fontSize: 11 }}>{r.reason}</div></td>
                  <td>{(() => { const t = apvKindOf(r.kind), ch = apvChannelOf(r.kind); return (<>
                    <span className="apv-tag" style={{ color: t.c, background: t.bg, borderColor: t.bd }}>{t.k}</span>
                    {ch && <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{ch}</div>}
                  </>); })()}</td>
                  <td>{r.reqBy}<div className="muted" style={{ fontSize: 11 }}>{r.reqTerm}</div></td>
                  <td className="center mono" style={{ fontSize: 11.5 }}>{r.reqDate}</td>
                  <td className="right mono">{r._unlock ? <span className="muted">—</span> : fmt.money(r.amount, 2)}</td>
                  <td className="center"><button className="btn sm" onClick={() => { setViewRow(r); setRejecting(false); setRejectTxt(''); }}><Icon name="eye" size={12} /> ดู</button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan="7" className="right"><b>รวมจำนวนที่เลือกอนุมัติ ({picked.length} รายการ)</b></td>
              <td className="right mono"><b>{fmt.money(total, 2)}</b></td>
              <td />
            </tr></tfoot>
          </table>
        </div></div>
      </div>
      {detailEl}
    </div>
  );
}

Object.assign(window, { DepApprovePage });
