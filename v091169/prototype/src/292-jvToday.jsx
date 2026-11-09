// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › บันทึกบัญชี — ลงรายวัน (บันทึกรายการบัญชี)
//  หน้าจอ Voucher แบบรวมในหน้าเดียว (all-in-one workspace)
//  ┌ ประจำวันที่ ────┬ รายละเอียด Voucher ─────────────────────┐
//  ├ รายการ Voucher ─┼ รายละเอียดรายการบัญชี (DR/CR) ──────────┤
//  │                 └ สรุปเงินสด + สมดุล DR/CR ────────────────┘
//  └ แถบปุ่ม: บันทึกร่าง · ส่งตรวจสอบ · พิมพ์ · คัดลอก · ยกเลิก ─┘
// ════════════════════════════════════════════════════════════════════
const { useState: jvUseState, useMemo: jvUseMemo, useRef: jvUseRef, useEffect: jvUseEffect } = React;

const jvToday = () => '2026-06-13';
const jvMoney = (n) => window.fmt.money(Number(n || 0), 2);
const jvNum = (v) => Number(String(v).replace(/[^\d.]/g, '')) || 0;
const jvClone = (o) => JSON.parse(JSON.stringify(o));

// บัญชีที่ลงรายการได้ (posting) — ใช้สร้าง datalist ค้นหา
function jvPostingAccounts() {
  const all = window.coaFlatAccounts ? window.coaFlatAccounts() : [];
  return all.filter(a => a.kind === 'posting' && a.enabled);
}

// ฟิลด์หัวรายการ (label ซ้าย + control ขวา แนวนอน)
function JvField({ label, required, children }) {
  return (
    <div className="jv-field">
      <label className="jv-field-lab">{label}{required && <span className="req"> *</span>} :</label>
      <div className="jv-field-ctl">{children}</div>
    </div>
  );
}

// สร้างเอกสารใหม่ (ร่างเปล่า)
function jvBlankDoc(list, date, createdBy) {
  return {
    id: window.jvNextNo(list, date, 'JV'), vtype: 'JV', mtype: 'CSH', docDate: date,
    createdBy, branch: window.JV_BRANCHES[0], ref: '', desc: '', note: '', status: 'draft',
    lines: [
      { acct: '', desc: '', ref: '', dr: 0, cr: 0 },
      { acct: '', desc: '', ref: '', dr: 0, cr: 0 },
    ],
    _new: true,
  };
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — สองโหมด: (1) รายการลงรายวันที่ผ่านมา  (2) หน้าลงรายวัน
//  • เข้าเมนูครั้งแรก = โหมด list (แสดงประวัติการลงรายวันประจำวันที่ผ่านมา)
//  • "ดึงข้อมูล" = ดึง Voucher ของวันที่เลือกเข้ามาพัก (staging)
//  • "ลงรายวัน" = เปิดหน้าลงรายวันพร้อมข้อมูลที่ดึงมา (ถ้ายังไม่ดึง = ฟิลด์ว่าง)
// ════════════════════════════════════════════════════════════════════
const JV_PAGE_SIZE = 10;
const JV_USER = 'น.ส.จิราภรณ์ ทองดี';

// สรุปการลงรายวันรายวัน — จัดกลุ่มตาม docDate
function jvDailyGroups(list) {
  const map = new Map();
  (list || []).forEach(v => {
    const g = map.get(v.docDate) || { date: v.docDate, count: 0, dr: 0, statuses: {} };
    g.count += 1;
    g.dr += window.jvTotals(v.lines).dr;
    g.statuses[v.status] = (g.statuses[v.status] || 0) + 1;
    map.set(v.docDate, g);
  });
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

const JV_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

if (!document.getElementById('jv-layout-style')) {
  const st = document.createElement('style');
  st.id = 'jv-layout-style';
  st.textContent = '.jv-page-head .jv-period { margin-left: auto; }'
    + '.jv-ws .jv-top { grid-template-columns: 1fr !important; }'
    + '.jv-ws .jv-daily { flex-direction: row; flex-wrap: wrap; align-items: flex-end; gap: 10px; }'
    + '.jv-ws .jv-daily .jv-card-head { flex: 0 0 100%; }'
    + '.jv-ws .jv-daily .jv-date-field { margin-bottom: 0; min-width: 220px; }'
    + '.jv-ws .jv-daily .btn.block { display: inline-flex; width: auto; margin-top: 0 !important; height: 32px; padding: 0 12px; }'
    + '.jv-ws .jv-daily .jv-date-field .thai-date, .jv-ws .jv-daily .jv-date-field .cfg-input { height: 32px; }'
    + '.jv-ws .jv-daily .jv-daily-note { flex: 1 1 100%; margin-top: 2px; }'
    + '.jv-list-search { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }'
    + '.jv-ws .head-bar, .jv-vmodal .head-bar { display: none !important; }'
    + '.jv-ico { display: inline-flex; align-items: center; }'
    + '.jv-row-del svg { display: block; }'
    + '.jv-list-search .search { min-width: 0; }'
    + '.jv-list-search select.cfg-input { flex: 0 1 180px; width: auto; min-width: 0; height: 32px; }'
    + '.jv-list-search .btn { height: 32px; justify-content: center; min-width: 78px; }'
    + '.modal-card.jv-vmodal { width: min(1160px, 95vw) !important; max-width: 95vw !important; max-height: 92vh; display: flex; flex-direction: column; padding: 0; }'
    + '.modal-card.jv-vmodal .jv-vmodal-body { overflow-x: hidden; }'
    + '.jv-vmodal .jv-radios { display: flex; flex-wrap: wrap; gap: 6px; }'
    + '.jv-vmodal .jv-radio { white-space: nowrap; flex: 0 0 auto; }';
  document.head.appendChild(st);
}

function DailyJournalWorkspace({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [mode, setMode] = jvUseState('list');    // 'list' | 'entry'
  const [fetched, setFetched] = jvUseState(false); // ดึงข้อมูลประจำวันแล้วหรือยัง
  const [list, setList] = jvUseState(window.jvLoad);
  const [date, setDate] = jvUseState(jvToday);
  const [q, setQ] = jvUseState('');
  const [statusFilter, setStatusFilter] = jvUseState('all');
  const [showFilter, setShowFilter] = jvUseState(false);
  const [page, setPage] = jvUseState(1);
  const [pageSize, setPageSize] = jvUseState(JV_PAGE_SIZE);
  const [cur, setCur] = jvUseState(null);        // เอกสารที่กำลังทำงาน
  const [vModalOpen, setVModalOpen] = jvUseState(false); // popup รายละเอียด Voucher
  const [moreOpen, setMoreOpen] = jvUseState(false);
  const [fetchBusy, setFetchBusy] = jvUseState(false);   // popup loading ระหว่างดึงข้อมูล
  const [fetchResult, setFetchResult] = jvUseState(null); // { count, date } — popup ผลลัพธ์

  const posting = jvUseMemo(jvPostingAccounts, []);
  const persist = (next) => { setList(next); window.jvSave(next); };
  const acctName = (c) => (window.coaAccountName && window.coaAccountName(String(c))) || '';

  // Breadcrumb: หน้าหลัก › ลงรายวัน › [ลงรายวันประจำวันที่ ...]
  window.useBreadcrumb && window.useBreadcrumb(
    mode === 'entry'
      ? [{ label: 'ลงรายวัน', onClick: () => setMode('list') }, { label: 'ลงรายวันประจำวันที่ ' + window.fmt.date(date), current: true }]
      : [{ label: 'ลงรายวัน', current: true }],
    [mode, date]);

  // กลุ่มสรุปประวัติการลงรายวัน (โหมด list)
  const groups = jvUseMemo(() => jvDailyGroups(list), [list]);

  // จำนวน Voucher ของวันที่เลือก (ใช้แสดงบนปุ่มดึงข้อมูล)
  const dayCount = jvUseMemo(() => list.filter(v => v.docDate === date).length, [list, date]);

  // Voucher ของวันที่เลือก — ในหน้าลงรายวันจะว่างจนกว่าจะกดดึงข้อมูล
  const dayList = jvUseMemo(
    () => (mode === 'entry' && !fetched) ? [] : list.filter(v => v.docDate === date),
    [list, date, mode, fetched]);

  // เลือกเอกสารแรกของวันเมื่อเปลี่ยนวันที่ (เฉพาะตอนดึงข้อมูลแล้ว)
  jvUseEffect(() => {
    if (mode !== 'entry') return;
    if (cur && !cur._new && cur.docDate === date && list.some(v => v.id === cur.id)) return;
    const first = dayList[0];
    setCur(first ? jvClone(first) : jvBlankDoc(list, date, JV_USER));
    setPage(1);
  }, [date, mode]);

  // ── ดึงข้อมูล / เปิดหน้าลงรายวัน ─────────────────────────────────
  const fetchDay = () => {
    if (fetchBusy) return;
    const d = date;
    setFetchBusy(true);
    setTimeout(() => {
      const dl = list.filter(v => v.docDate === d);
      setFetchBusy(false);
      setFetched(dl.length > 0);
      if (dl.length) setCur(jvClone(dl[0]));   // โหลดเอกสารแรกเข้าหน้าจอทันที
      setPage(1);
      setFetchResult({ count: dl.length, date: d });
    }, 900);
  };

  const openEntry = () => {
    const dl = list.filter(v => v.docDate === date);
    setCur(fetched && dl.length ? jvClone(dl[0]) : jvBlankDoc(list, date, JV_USER));
    setPage(1);
    setMode('entry');
  };

  const openDay = (d) => {          // คลิกแถวในประวัติ = ดึง + เปิดหน้าลงรายวันของวันนั้น
    const dl = list.filter(v => v.docDate === d);
    setDate(d); setFetched(true);
    setCur(dl.length ? jvClone(dl[0]) : jvBlankDoc(list, d, JV_USER));
    setPage(1); setMode('entry');
  };

  const backToList = () => { setMode('list'); setMoreOpen(false); };

  // ── Popup: loading + ผลการดึงข้อมูล (ใช้ร่วมทั้งหน้ารายการและหน้าลงรายวัน) ──
  const fetchPopups = (
    <>
      {fetchBusy && (
        <>
          <div className="modal-backdrop" />
          <div className="jv-loading-pop" role="alertdialog" aria-busy="true">
            <div className="jv-spinner" />
            <div className="jv-loading-txt">กำลังดึงข้อมูล Voucher…</div>
            <div className="jv-loading-sub muted">ประจำวันที่ {window.fmt.date(date)}</div>
          </div>
        </>
      )}
      {fetchResult && (
        <>
          <div className="modal-backdrop" onClick={() => setFetchResult(null)} />
          <div className="modal-card jv-result-pop" role="dialog" aria-modal="true">
            <div className={"jv-result-ico " + (fetchResult.count ? 'ok' : 'warn')}>
              <Icon name={fetchResult.count ? 'check' : 'info'} size={26} />
            </div>
            <h3 className="jv-result-title">{fetchResult.count ? 'ดึงข้อมูลสำเร็จ' : 'ไม่พบข้อมูล'}</h3>
            <div className="jv-result-body">
              {fetchResult.count ? (
                <>ดึงข้อมูล Voucher ประจำวันที่ <b>{window.fmt.date(fetchResult.date)}</b> ทั้งหมด <b className="jv-result-count">{fetchResult.count}</b> รายการ</>
              ) : (
                <>ไม่พบ Voucher ประจำวันที่ <b>{window.fmt.date(fetchResult.date)}</b> — สามารถสร้างรายการใหม่ได้ในหน้าลงรายวัน</>
              )}
            </div>
            <div className="jv-result-foot">
              <button className="btn primary" onClick={() => setFetchResult(null)}>ตกลง</button>
            </div>
          </div>
        </>
      )}
    </>
  );

  const filtered = jvUseMemo(() => dayList.filter(v => {
    if (statusFilter !== 'all' && v.status !== statusFilter) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return v.id.toLowerCase().includes(n) || (v.desc || '').toLowerCase().includes(n) || (v.ref || '').toLowerCase().includes(n);
    }
    return true;
  }), [dayList, statusFilter, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, pageCount);
  const rows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  const locked = cur && (cur.status === 'posted' || cur.status === 'cancelled');
  const totals = jvUseMemo(() => window.jvTotals(cur ? cur.lines : []), [cur]);
  const check = jvUseMemo(() => (cur ? window.jvValidate(cur) : { ok: false, errors: [], warnings: [] }), [cur]);

  // สรุปเงินสดประจำวัน (จากรายการเงินสดที่ผ่านรายการแล้ว + เอกสารปัจจุบัน)
  const cash = jvUseMemo(() => {
    let received = 0, paid = 0;
    const seen = new Set();
    const scan = (v) => {
      (v.lines || []).forEach(ln => {
        if (String(ln.acct) === window.JV_CASH_ACCT) { received += Number(ln.dr || 0); paid += Number(ln.cr || 0); }
      });
    };
    dayList.filter(v => v.status === 'posted').forEach(v => { seen.add(v.id); scan(v); });
    if (cur && cur.mtype === 'CSH' && !seen.has(cur.id)) scan(cur);
    const opening = window.JV_CASH_OPENING;
    return { opening, received, paid, closing: opening + received - paid };
  }, [dayList, cur]);

  // ── การกระทำ ──────────────────────────────────────────────────────
  const newDoc = () => { setCur(jvBlankDoc(list, date, JV_USER)); setFetched(true); setSelLine(0); setVModalOpen(true); onToast && onToast('สร้างใบรายการบัญชีใหม่ — พร้อมบันทึกรายการเดบิต/เครดิต'); };
  const selectDoc = (v) => { setCur(jvClone(v)); setSelLine(0); setVModalOpen(true); };
  const closeVModal = () => { setVModalOpen(false); setMoreOpen(false); };

  const set = (k, val) => setCur(p => ({ ...p, [k]: val }));
  const setLine = (i, k, val) => setCur(p => ({ ...p, lines: p.lines.map((ln, idx) => idx === i ? { ...ln, [k]: val } : ln) }));
  const setAmount = (i, side, raw) => {
    const val = jvNum(raw);
    setCur(p => {
      let lines = p.lines.map((ln, idx) => idx === i
        ? { ...ln, dr: side === 'dr' ? val : 0, cr: side === 'cr' ? val : 0 } : ln);
      // คำนวณอัตโนมัติ: ถ้าเหลือบรรทัดว่างเพียงบรรทัดเดียว เติมยอดฝั่งตรงข้ามให้ DR = CR
      const empties = lines
        .map((ln, idx) => ({ ln, idx }))
        .filter(x => x.idx !== i && !Number(x.ln.dr) && !Number(x.ln.cr));
      if (empties.length === 1) {
        const dr = lines.reduce((s, ln) => s + Number(ln.dr || 0), 0);
        const cr = lines.reduce((s, ln) => s + Number(ln.cr || 0), 0);
        const diff = Math.round((dr - cr) * 100) / 100;
        const t = empties[0].idx;
        if (diff > 0) lines = lines.map((ln, idx) => idx === t ? { ...ln, cr: diff, dr: 0 } : ln);
        else if (diff < 0) lines = lines.map((ln, idx) => idx === t ? { ...ln, dr: -diff, cr: 0 } : ln);
      }
      return { ...p, lines };
    });
  };
  const blankLine = () => ({ acct: '', desc: '', ref: '', dr: 0, cr: 0 });
  const addLine = () => setCur(p => ({ ...p, lines: [...p.lines, blankLine()] }));
  const insertLine = (i) => setCur(p => { const l = [...p.lines]; l.splice(i + 1, 0, blankLine()); return { ...p, lines: l }; });
  const dupLine = (i) => setCur(p => { const l = [...p.lines]; l.splice(i + 1, 0, { ...l[i] }); return { ...p, lines: l }; });
  const rmLine = (i) => setCur(p => ({ ...p, lines: p.lines.length <= 1 ? p.lines : p.lines.filter((_, idx) => idx !== i) }));

  const [selLine, setSelLine] = jvUseState(0);

  const commit = (status) => {
    if (!String(cur.desc || '').trim()) { onToast && onToast('กรุณาระบุรายละเอียดรายการก่อนบันทึก'); return; }
    let id = cur.id;
    if (cur._new) id = window.jvNextNo(list, cur.docDate, cur.vtype);
    const clean = { ...cur, id, status }; delete clean._new;
    const exists = list.some(v => v.id === clean.id);
    const next = exists ? list.map(v => v.id === clean.id ? clean : v) : [clean, ...list];
    persist(next); setCur(jvClone(clean));
    audit.log && audit.log({
      action: exists ? 'update' : 'create', module: 'บัญชี — ลงรายวัน', target: clean.id,
      summary: `${exists ? 'แก้ไข' : 'บันทึก'}รายการลงรายวัน ${clean.id} (${window.JV_STATUS[status].l})`,
    });
    onToast && onToast(status === 'pending' ? `บันทึกและส่งตรวจสอบ ${clean.id} แล้ว` : `บันทึกร่าง ${clean.id} แล้ว`);
  };

  const cancelDoc = () => {
    if (!cur) return;
    if (cur._new) { newDoc(); return; }
    const next = list.filter(v => v.id !== cur.id);
    persist(next);
    audit.log && audit.log({ action: 'cancel', module: 'บัญชี — ลงรายวัน', target: cur.id, summary: `ยกเลิก Voucher ${cur.id}` });
    onToast && onToast(`ยกเลิก Voucher ${cur.id} แล้ว`);
    const first = next.filter(v => v.docDate === date)[0];
    setCur(first ? jvClone(first) : jvBlankDoc(next, date, JV_USER));
    setVModalOpen(false);
  };

  const copyDoc = () => {
    const copy = { ...jvClone(cur), id: window.jvNextNo(list, date, cur.vtype), docDate: date, status: 'draft', _new: true };
    setCur(copy);
    onToast && onToast(`คัดลอกรายการเป็น Voucher ใหม่ (${copy.id})`);
  };

  // ═════ โหมดรายการ (list) — หน้าแรกที่เข้าเมนู ═════
  if (mode === 'list') {
    return (
      <div className="jv-ws" data-screen-label="ลงรายวัน — รายการประจำวัน">
        <div className="jv-page-head">
          <div>
            <h1>ลงรายวัน <span className="jv-page-sub">(บันทึกรายการบัญชี)</span></h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกประจำวันที่ต้องการ → ดึงข้อมูล Voucher → ลงรายวัน — หรือเลือกรายการที่ผ่านมาเพื่อดู/แก้ไข</div>
          </div>
          <span className="spacer" />
          <div className="jv-period"><Icon name="calendar" size={14} /> งวดบัญชี : มิถุนายน 2569 <span className="pill ok" style={{ marginLeft: 4 }}>เปิด</span></div>
        </div>

        {/* ── แถบเข้าหน้าลงรายวัน ── */}
        <div className="search-card jv-fetchbar">
          <div className="jv-fetch-field">
            <label className="jv-fetch-lab">ประจำวันที่ :</label>
            <window.ThaiDateField value={date} onChange={(v) => { setDate(v); setFetched(false); }} />
          </div>
          <button className="btn accent" onClick={openEntry}><Icon name="edit" size={14} /> ลงรายวัน</button>
          <span className="spacer" />
          <span className="jv-fetch-note"><Icon name="info" size={13} /> เลือกประจำวันแล้วกด “ลงรายวัน” — ดึงข้อมูล Voucher ได้ที่หน้าลงรายวัน</span>
        </div>

        {/* ── รายการลงรายวันที่ผ่านมา (จัดกลุ่มตามวัน) ── */}
        <div className="search-card">
          <div className="jv-card-head"><span className="head-bar" /><h3>รายการลงรายวันที่ผ่านมา</h3>
            <span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>ทั้งหมด {groups.length} วันทำการ</span>
          </div>
          <div className="jv-list-table">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 190 }}>ประจำวันที่</th>
                  <th className="center" style={{ width: 120 }}>จำนวน Voucher</th>
                  <th className="right" style={{ width: 150 }}>ยอดรวม (DR)</th>
                  <th>สถานะ</th>
                  <th className="center" style={{ width: 96 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 && (
                  <tr><td colSpan={5} className="center muted" style={{ padding: '28px 8px' }}>ไม่พบรายการลงรายวัน</td></tr>
                )}
                {groups.map(g => (
                  <tr key={g.date} className={"clickable" + (g.date === date ? ' is-sel' : '')} onClick={() => { setDate(g.date); setFetched(false); }}>
                    <td style={{ fontWeight: 600 }}>{window.fmt.date(g.date)}</td>
                    <td className="center mono">{g.count}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{jvMoney(g.dr)}</td>
                    <td>
                      <div className="jv-stat-chips">
                        {window.JV_STATUS_ORDER.filter(s => g.statuses[s]).map(s => (
                          <span key={s} className={"pill " + window.JV_STATUS[s].pill} style={{ fontSize: 10.5 }}>{window.JV_STATUS[s].l} {g.statuses[s]}</span>
                        ))}
                      </div>
                    </td>
                    <td className="center"><button className="btn sm" onClick={(e) => { e.stopPropagation(); openDay(g.date); }}><Icon name="eye" size={12} /> ดู</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {fetchPopups}
      </div>
    );
  }

  if (!cur) return null;

  return (
    <div className="jv-ws" data-screen-label="ลงรายวัน (บันทึกรายการบัญชี)">
      {/* ── หัวเรื่องหน้า ── */}
      <div className="jv-page-head">
        <button className="btn sm jv-back" onClick={backToList}><Icon name="chevLeft" size={13} /> รายการลงรายวัน</button>
        <div>
          <h1>ลงรายวัน <span className="jv-page-sub">(บันทึกรายการบัญชี)</span></h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึกรายการบัญชีประจำวันแบบ Voucher — เดบิต/เครดิต ตรวจสอบสมดุล และผ่านรายการไปบัญชีแยกประเภท</div>
        </div>
        <span className="spacer" />
        <div className="jv-period"><Icon name="calendar" size={14} /> งวดบัญชี : มิถุนายน 2569 <span className="pill ok" style={{ marginLeft: 4 }}>เปิด</span></div>
      </div>

      {/* ══ แถวบน: ประจำวันที่ + รายการ Voucher ══ */}
      <div className="jv-top">
        <div className="search-card jv-daily">
          <div className="jv-card-head"><span className="head-bar" /><h3>ประจำวันที่</h3></div>
          <div className="jv-date-field">
            <window.ThaiDateField value={date} onChange={(v) => { setDate(v); setFetched(false); setPage(1); }} />
          </div>
          <button className="btn primary block" onClick={fetchDay}><Icon name="download" size={13} /> ดึงข้อมูล Voucher ของวัน</button>
          <button className="btn block" style={{ marginTop: 8 }} onClick={newDoc}><Icon name="plus" /> บันทึกใบรายการใหม่</button>
          <div className="jv-daily-note muted">
            <Icon name="info" size={12} /> เลือก Voucher จากรายการเพื่อเปิดรายละเอียดและบันทึกรายการบัญชีในหน้าต่าง — หรือกด “บันทึกใบรายการใหม่” เพื่อกรอกเอง
          </div>
        </div>

        <div className="search-card jv-list">
          <div className="jv-card-head"><span className="head-bar" /><h3>รายการ Voucher</h3>
            <span className="spacer" /><span className="muted" style={{ fontSize: 11 }}>{window.fmt.date(date)}</span>
          </div>
          <div className="jv-list-search">
            <div className="search" style={{ flex: '1 1 200px' }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="ค้นหาเลขที่ / รายละเอียด" />
            </div>
            <select className="cfg-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="all">ทั้งหมด</option>
              {window.JV_STATUS_ORDER.map(s => (
                <option key={s} value={s}>{window.JV_STATUS[s].l}</option>
              ))}
            </select>
            <button className="btn primary" onClick={() => setPage(1)}>ค้นหา</button>
            <button className="btn" onClick={() => { setQ(''); setStatusFilter('all'); setPage(1); }}>รีเซ็ต</button>
          </div>
          <div className="jv-list-table">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 118 }}>เลขที่ Voucher</th>
                  <th>รายละเอียด</th>
                  <th className="center" style={{ width: 56 }}>ประเภท</th>
                  <th className="right" style={{ width: 92 }}>ยอดรวม</th>
                  <th className="center" style={{ width: 92 }}>สถานะ</th>
                  <th className="center" style={{ width: 84 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={6} className="center muted" style={{ padding: '28px 8px' }}>ไม่พบข้อมูลรายการบัญชีของวันที่เลือก</td></tr>
                )}
                {rows.map(v => {
                  const st = window.JV_STATUS[v.status];
                  const amt = window.jvTotals(v.lines).dr;
                  return (
                    <tr key={v.id}>
                      <td className="mono" style={{ fontSize: 11.5 }}>{v.id}</td>
                      <td><div className="jv-cell-desc" style={{ whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', WebkitLineClamp: 'unset', display: 'block', wordBreak: 'break-word', lineHeight: 1.45, maxWidth: 'none' }}>{v.desc || '—'}</div></td>
                      <td className="center"><span className="jv-mtag">{v.mtype}</span></td>
                      <td className="right mono" style={{ fontWeight: 600 }}>{jvMoney(amt)}</td>
                      <td className="center"><span className={"pill " + st.pill} style={{ fontSize: 10.5 }}>{st.l}</span></td>
                      <td className="center"><button className="btn sm" onClick={(e) => { e.stopPropagation(); selectDoc(v); }}><Icon name="eye" size={12} /> ดู</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="jv-list-foot">
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {filtered.length} รายการ</span>
            <span className="spacer" />
            <div className="jv-pages">
              <button className="jv-pg-btn" disabled={curPage <= 1} onClick={() => setPage(curPage - 1)}><Icon name="chevLeft" size={12} /></button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).slice(0, 5).map(n => (
                <button key={n} className={"jv-pg-btn" + (n === curPage ? ' on' : '')} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="jv-pg-btn" disabled={curPage >= pageCount} onClick={() => setPage(curPage + 1)}><Icon name="chevRight" size={12} /></button>
            </div>
            <select className="cfg-input jv-pg-size" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10 / หน้า</option>
              <option value={20}>20 / หน้า</option>
              <option value={50}>50 / หน้า</option>
            </select>
          </div>
        </div>
      </div>

      {/* ══ Popup: รายละเอียด Voucher + รายละเอียดรายการบัญชี (เปิดเมื่อเลือก Voucher) ══ */}
      {vModalOpen && cur && (
        <>
          <div className="modal-backdrop" onClick={closeVModal} />
          <div className="modal-card jv-vmodal" role="dialog" aria-modal="true">
            <div className="modal-head jv-vmodal-head">
              <div className="jv-vmodal-title">
                <h2>รายละเอียด Voucher</h2>
                <span className="mono jv-vmodal-id">{cur.id}</span>
                <span className={"pill " + window.JV_STATUS[cur.status].pill}>{window.JV_STATUS[cur.status].l}</span>
              </div>
              <span className="spacer" />
              <button className="close-btn" onClick={closeVModal} aria-label="ปิด"><Icon name="close" /></button>
            </div>

            <div className="modal-body jv-vmodal-body">
              {/* ── รายละเอียด Voucher ── */}
              <div className="jv-vmodal-sec">
                <div className="jv-head-grid">
                  <JvField label="เลขที่ Voucher" required>
                    <div className="jv-input-icon">
                      <input className="cfg-input mono" value={cur.id} readOnly />
                      <Icon name="search" size={13} />
                    </div>
                  </JvField>
                  <JvField label="วันที่รายการ" required>
                    <window.ThaiDateField value={cur.docDate} disabled={locked}
                                         onChange={(v) => setCur(c => ({ ...c, docDate: v, id: window.jvNextNo(list, v, c.vtype) }))} />
                  </JvField>
                  <JvField label="ประเภท Voucher" required>
                    <select className="cfg-input" value={cur.vtype} disabled={locked}
                            onChange={e => { const v = e.target.value; setCur(c => ({ ...c, vtype: v, id: window.jvNextNo(list, c.docDate, v) })); }}>
                      {window.JV_TYPES.map(o => <option key={o.v} value={o.v}>{o.v} — {o.l}</option>)}
                    </select>
                  </JvField>
                  <JvField label="ประเภทเงิน" required>
                    <div className="jv-radios">
                      {window.JV_MTYPES.map(o => (
                        <label key={o.v} className={"jv-radio" + (cur.mtype === o.v ? ' on' : '')}>
                          <input type="radio" name="jv-mtype" checked={cur.mtype === o.v} disabled={locked}
                                 onChange={() => set('mtype', o.v)} />
                          <span className="dot" /><span className="lbl">{o.v} {o.l}</span>
                        </label>
                      ))}
                    </div>
                  </JvField>
                  <div className="jv-field full">
                    <label className="jv-field-lab">รายละเอียด<span className="req"> *</span> :</label>
                    <div className="jv-field-ctl">
                      <input className="cfg-input" value={cur.desc} disabled={locked} maxLength={250}
                             placeholder="คำอธิบายภาพรวมของรายการ เช่น รับชำระเงินกู้สามัญ งวดเดือนมิถุนายน 2569"
                             onChange={e => set('desc', e.target.value)} />
                    </div>
                  </div>
                  <JvField label="ผู้บันทึก">
                    <input className="cfg-input" value={cur.createdBy} readOnly />
                  </JvField>
                  <JvField label="เอกสารอ้างอิง">
                    <input className="cfg-input mono" value={cur.ref} disabled={locked} placeholder="ไม่บังคับ"
                           onChange={e => set('ref', e.target.value)} />
                  </JvField>
                </div>
              </div>

              {/* ── รายละเอียดรายการบัญชี ── */}
              <div className="jv-vmodal-sec">
                <div className="jv-card-head"><span className="head-bar" /><h3>รายละเอียดรายการบัญชี</h3>
                  <span className="spacer" />
                  {!locked && (
                    <div className="jv-line-tools">
                      <button className="btn sm primary" onClick={addLine}><Icon name="plus" size={12} /> เพิ่มรายการ</button>
                      <button className="btn sm" onClick={() => insertLine(selLine)}><Icon name="insert" size={12} /> แทรก</button>
                      <button className="btn sm danger" disabled={cur.lines.length <= 1} onClick={() => rmLine(selLine)}><span className="jv-ico" dangerouslySetInnerHTML={{ __html: JV_TRASH }} /> ลบ</button>
                      <button className="btn sm" onClick={() => dupLine(selLine)}><Icon name="copy" size={12} /> คัดลอก</button>
                      <button className="btn sm icon" title="เพิ่มเติม"><Icon name="dots" size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="jv-lines-table">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th className="center" style={{ width: 44 }}>ลำดับ</th>
                        <th style={{ width: 150 }}>รหัสบัญชี</th>
                        <th style={{ minWidth: 150 }}>ชื่อบัญชี</th>
                        <th style={{ minWidth: 160 }}>รายละเอียด</th>
                        <th className="right" style={{ width: 118 }}>ยอด DR</th>
                        <th className="right" style={{ width: 118 }}>ยอด CR</th>
                        <th style={{ width: 62 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {cur.lines.map((ln, i) => {
                        const nm = acctName(ln.acct);
                        const badCode = ln.acct && !nm;
                        return (
                          <tr key={i} className={selLine === i ? 'is-sel' : ''} onClick={() => setSelLine(i)}>
                            <td className="center mono" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td>
                              <div className="jv-cell-icon">
                                <input className={"vch-cell-input mono" + (badCode ? ' has-error' : '')} list="jv-acct-list"
                                       value={ln.acct} disabled={locked} placeholder="รหัสบัญชี"
                                       onChange={e => setLine(i, 'acct', e.target.value.replace(/[^\d]/g, ''))} />
                                <Icon name="search" size={12} />
                              </div>
                            </td>
                            <td style={{ fontSize: 12.5 }}>
                              {nm ? nm : <span className="muted" style={{ fontStyle: 'italic' }}>{badCode ? 'ไม่พบรหัสบัญชีนี้' : '—'}</span>}
                            </td>
                            <td><input className="vch-cell-input" value={ln.desc} disabled={locked}
                                       onChange={e => setLine(i, 'desc', e.target.value)} /></td>
                            <td><input className="vch-cell-input num" value={ln.dr ? ln.dr : ''} disabled={locked} placeholder="0.00"
                                       onChange={e => setAmount(i, 'dr', e.target.value)} /></td>
                            <td><input className="vch-cell-input num" value={ln.cr ? ln.cr : ''} disabled={locked} placeholder="0.00"
                                       onChange={e => setAmount(i, 'cr', e.target.value)} /></td>
                            <td className="center">
                              {!locked && <button className="jv-row-del" title="ลบบรรทัด" disabled={cur.lines.length <= 1}
                                                  onClick={(e) => { e.stopPropagation(); rmLine(i); }} dangerouslySetInnerHTML={{ __html: JV_TRASH }} />}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {!locked && (
                  <button className="btn dashed block jv-addline" onClick={addLine}><Icon name="plus" size={13} /> เพิ่มรายการบัญชี</button>
                )}
                <datalist id="jv-acct-list">
                  {posting.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
                </datalist>

                {/* ── แถบสรุป: เงินสด + สมดุล DR/CR (คำนวณอัตโนมัติ) ── */}
                <div className="jv-summary">
                  <div className="jv-sum-cash">
                    <div className="row"><span className="lab">เงินสดยกมา</span><span className="val mono">{jvMoney(cash.opening)}</span></div>
                    <div className="row"><span className="lab">รับเงินสด</span><span className="val mono pos">{jvMoney(cash.received)}</span></div>
                    <div className="row"><span className="lab">จ่ายเงินสด</span><span className="val mono neg">{jvMoney(cash.paid)}</span></div>
                    <div className="row strong"><span className="lab">เงินสดยกไป</span><span className="val mono">{jvMoney(cash.closing)}</span></div>
                  </div>
                  <div className="jv-sum-bal">
                    <div className="row"><span className="lab">รวมยอด DR</span><span className="box mono">{jvMoney(totals.dr)}</span></div>
                    <div className="row"><span className="lab">รวมยอด CR</span><span className="box mono">{jvMoney(totals.cr)}</span></div>
                    <div className={"row diff" + (totals.balanced ? ' ok' : ' bad')}><span className="lab">ส่วนต่าง</span><span className="box mono">{jvMoney(Math.abs(totals.diff))}</span></div>
                  </div>
                  <div className={"jv-sum-status" + (totals.balanced ? ' ok' : ' bad')}>
                    {totals.balanced
                      ? <><div className="badge"><Icon name="check" size={16} /></div><div className="txt"><b>ยอดสมดุล</b><span className="mono">DR = CR</span></div></>
                      : <><div className="badge"><Icon name="info" size={16} /></div><div className="txt"><b>ยังไม่สมดุล</b><span className="mono">DR ≠ CR</span></div></>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── ปุ่มการกระทำ ── */}
            <div className="jv-actionbar jv-vmodal-foot">
              <button className="btn" onClick={() => onToast && onToast('เปิดหน้าต่างแนบเอกสารประกอบรายการ')}><Icon name="attach" /> แนบเอกสาร</button>
              <span className="spacer" />
              {locked ? (
                <>
                  <span className="jv-locked-note"><Icon name="lock" size={13} /> รายการนี้ผ่านบัญชีแล้ว — แก้ไขไม่ได้</span>
                  <button className="btn" onClick={() => onToast && onToast('กำลังเตรียมพิมพ์ Voucher ' + cur.id)}><Icon name="print" /> พิมพ์ Voucher</button>
                  <button className="btn" onClick={copyDoc}><Icon name="copy" /> คัดลอก Voucher</button>
                  <button className="btn primary" onClick={closeVModal}>ปิด</button>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => commit('draft')}><Icon name="check" /> บันทึกร่าง</button>
                  <button className="btn primary" disabled={!check.ok}
                          title={check.ok ? '' : (check.errors[0] || 'ตรวจสอบรายการให้ครบถ้วนและสมดุลก่อนส่ง')}
                          onClick={() => commit('pending')}><Icon name="send" /> บันทึกและส่งตรวจสอบ</button>
                  <button className="btn" onClick={() => onToast && onToast('กำลังเตรียมพิมพ์ Voucher ' + cur.id)}><Icon name="print" /> พิมพ์ Voucher</button>
                  <button className="btn accent" onClick={copyDoc}><Icon name="copy" /> คัดลอก Voucher</button>
                  <div className="jv-more">
                    <button className="btn" onClick={() => setMoreOpen(o => !o)}>อื่นๆ <Icon name="chevDown" size={12} /></button>
                    {moreOpen && (
                      <div className="jv-more-menu jv-more-up" onMouseLeave={() => setMoreOpen(false)}>
                        <button onClick={() => { setMoreOpen(false); onToast && onToast('ตรวจสอบความถูกต้องของรายการ'); }}><Icon name="check" size={13} /> ตรวจสอบรายการ</button>
                        <button onClick={() => { setMoreOpen(false); onToast && onToast('นำรายการไปลงบัญชีแยกประเภท'); }}><Icon name="lock" size={13} /> ผ่านรายการ (ลงบัญชีแยกประเภท)</button>
                        <button onClick={() => { setMoreOpen(false); onToast && onToast('ดูประวัติการแก้ไขเอกสาร'); }}><Icon name="history" size={13} /> ประวัติเอกสาร</button>
                      </div>
                    )}
                  </div>
                  <button className="btn danger" onClick={cancelDoc}><Icon name="close" /> ยกเลิก Voucher</button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {fetchPopups}
    </div>
  );
}

Object.assign(window, { DailyJournalWorkspace });
