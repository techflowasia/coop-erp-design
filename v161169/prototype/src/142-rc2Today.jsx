// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › พิมพ์ใบเสร็จ (ต่อ)
//   • ใบสถานะการเงิน          (RcFinStatusPage)
//   • ปริ้นใบเสร็จย้อนหลัง     (RcReceiptHistoryPage)
// ════════════════════════════════════════════════════════════════════
const { useState: rc2UseState } = React;

const rc2Today = () => window.DEPOSIT_WORKING_DATE || '2026-06-02';
const rc2Thai = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${Number(y) + 543}`; };
const rc2Money = (n, d = 2) => (window.fmt ? window.fmt.money(n, d) : Number(n).toFixed(d));
const rc2Name = (m) => (window.msFullName ? window.msFullName(m) : (m && m.name) || '');
function rc2Rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
const rc2Seed = (str) => String(str).split('').reduce((a, c) => a + c.charCodeAt(0) * 17, 29);
const RC2_BRANCHES = () => window.JV_BRANCHES || ['สำนักงานใหญ่'];

// ── แถวสรุปยอด (label + ตัวเลข อ่านอย่างเดียว/กรอกได้) ────────────────
function RcAmountRow({ label, value, mono = true, strong, hint }) {
  return (
    <div className="ap-field">
      <span className="ap-label">{label}</span>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly tabIndex={-1}
             value={value}
             style={{ background: 'var(--surface-muted)', textAlign: 'right', fontWeight: strong ? 600 : 400 }} />
      {hint && <span className="muted" style={{ fontSize: 11, marginTop: 3 }}>{hint}</span>}
    </div>
  );
}

function RcFinStatusPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'พิมพ์ใบสถานะการเงิน', current: true }], []);
  const [branch, setBranch] = rc2UseState(RC2_BRANCHES()[0]);
  const [date, setDate] = rc2UseState(rc2Today());
  const [data, setData] = rc2UseState(null);
  const [posted, setPosted] = rc2UseState(false);
  const [preview, setPreview] = rc2UseState(false);

  const load = () => {
    const rnd = rc2Rng(rc2Seed(branch + date) || 53);
    const cashCarry = Math.round((3800000 + rnd() * 1900000) * 100) / 100;
    const depCarry = Math.round((rnd() * 240000) * 100) / 100;
    const coopFwd = Math.round((1200000 + rnd() * 2600000) * 100) / 100;
    const fundFwd = Math.round((320000 + rnd() * 900000) * 100) / 100;
    setData({ cashCarry, depCarry, coopFwd, fundFwd });
    setPosted(false);
    onToast && onToast(`ดึงข้อมูลสถานะการเงิน ${branch} · ${rc2Thai(date)} เรียบร้อย`);
  };

  return (
    <div data-screen-label="หน้าพิมพ์ใบสถานะการเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>พิมพ์ใบสถานะการเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            สรุปยอดเงินสดและเงินฝากคงเหลือยกมา–ยกไปของสาขา ณ วันทำรายการ เพื่อพิมพ์ใบสถานะการเงินและผ่านรายการ
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{rc2Thai(rc2Today())}</span>
        </div>
      </div>

      <div className="search-card">
        <div className="ap-form-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
          <label className="ap-field">
            <span className="ap-label">สาขา</span>
            <select className="cfg-input" value={branch} onChange={e => { setBranch(e.target.value); setData(null); }}>
              {RC2_BRANCHES().map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="ap-field">
            <span className="ap-label">วันที่ทำรายการ</span>
            <ErpDate value={date} onChange={(v) => (e => { setDate(e.target.value); setData(null); })({ target: { value: v } })} className="cfg-input" />
          </label>
          <div className="ap-field" style={{ alignSelf: 'end' }}>
            <button className="btn primary block" onClick={load}><Icon name="download" /> ดึงข้อมูล</button>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="money" size={26} /></div>
            เลือกสาขาและวันที่ทำรายการ แล้วกด “ดึงข้อมูล” เพื่อแสดงยอดยกมา–ยกไป
          </div>
        </div>
      ) : (
        <>
          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head">
              <span className="head-bar" /><h3>ยอดยกมา</h3>
              <span className="muted" style={{ fontSize: 11 }}>{branch} · {rc2Thai(date)}</span>
            </div>
            <div className="ap-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <RcAmountRow label="เงินสดยกมา" value={rc2Money(data.cashCarry)} strong />
              <RcAmountRow label="เงินฝากคงเหลือยกมา" value={rc2Money(data.depCarry)} />
            </div>
          </div>

          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head">
              <span className="head-bar" /><h3>ยอดยกไป</h3>
            </div>
            <div className="ap-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <RcAmountRow label="เงินฝากสหกรณ์คงเหลือยกไป" value={rc2Money(data.coopFwd)} strong />
              <RcAmountRow label="เงินฝากกองทุนฯ คงเหลือยกไป" value={rc2Money(data.fundFwd)} strong />
            </div>
            <div className="ct-actionbar">
              <Icon name="info" size={13} />
              <span className="muted" style={{ fontSize: 12 }}>
                {posted
                  ? <>ผ่านรายการแล้ว · รวมยอดยกไป <b className="mono" style={{ color: 'var(--text)' }}>฿ {rc2Money(data.coopFwd + data.fundFwd)}</b></>
                  : <>รวมยอดยกไป <b className="mono" style={{ color: 'var(--text)' }}>฿ {rc2Money(data.coopFwd + data.fundFwd)}</b> — ตรวจสอบก่อนผ่านรายการ</>}
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn" onClick={() => setPreview(true)}>
                <Icon name="print" /> พิมพ์รายการ
              </button>
              <button className="btn" onClick={() => onToast && onToast('ส่งออกไฟล์ Text SMS เรียบร้อย')}>
                <Icon name="download" /> Export Text SMS
              </button>
              <button className="btn primary" disabled={posted}
                      onClick={() => { setPosted(true); onToast && onToast(`ผ่านรายการสถานะการเงิน ${branch} · ${rc2Thai(date)} เรียบร้อย`); }}>
                <Icon name="check" /> {posted ? 'ผ่านรายการแล้ว' : 'ผ่านรายการ'}
              </button>
            </div>
          </div>
        </>
      )}

      {preview && data && (
        <RcSheetPreviewModal
          title="ตัวอย่างใบสถานะการเงิน" subtitle={`${branch} · ${rc2Thai(date)}`}
          docs={[<RcStatusDoc key="st" branch={branch} date={date} data={data} />]}
          onClose={() => setPreview(false)}
          onPrint={() => { window.rcsPrintDocs && window.rcsPrintDocs(onToast); setPreview(false); }} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ปริ้นใบเสร็จย้อนหลัง
// ════════════════════════════════════════════════════════════════════
const RC2_RCPT_TYPES = [
  { v: 'normal',  l: 'ใบเสร็จปกติ' },
  { v: 'replace', l: 'ใบเสร็จแทนฉบับเดิม' },
  { v: 'cancel',  l: 'ใบเสร็จที่ยกเลิก' },
  { v: 'all',     l: 'ทุกประเภท' },
];
const RC2_MONEY_TYPES = ['เงินสด', 'เช็ค', 'เงินโอน', 'หักเงินเดือน'];
const RC2_OPERATORS = ['สุนิสา ทองแท้', 'วิสุทธิ์ เจริญพร', 'นารี กมล', 'ประยุทธ มานะ'];
const RC2_PER_PAGE = 8;

function rc2History({ rcptType, from, to }) {
  const rnd = rc2Rng(rc2Seed(rcptType + from + to) || 71);
  const be = String(Number(from.slice(0, 4)) + 543).slice(2);
  const pool = window.DN_MEMBERS || [];
  let seq = 3100 + Math.floor(rnd() * 600);
  const n = Math.min(pool.length, 12 + Math.floor(rnd() * 8));
  const rows = [];
  for (let i = 0; i < n; i++) {
    const m = pool[i % pool.length];
    seq += 1 + Math.floor(rnd() * 6);
    const mm = String(1 + Math.floor(rnd() * 6)).padStart(2, '0');
    const dd = String(1 + Math.floor(rnd() * 27)).padStart(2, '0');
    const iso = `${from.slice(0, 4)}-${mm}-${dd}`;
    const type = rcptType === 'all' ? RC2_RCPT_TYPES[Math.floor(rnd() * 3)].v : rcptType;
    rows.push({
      key: `h-${i}`,
      member: m,
      type,
      receipt: `RC${be}${mm}-${String(seq).padStart(5, '0')}`,
      receiptDate: iso,
      txnDate: iso,
      moneyType: RC2_MONEY_TYPES[Math.floor(rnd() * RC2_MONEY_TYPES.length)],
      amount: Math.round((800 + rnd() * 42000) * 100) / 100,
      by: RC2_OPERATORS[Math.floor(rnd() * RC2_OPERATORS.length)],
    });
  }
  return rows;
}
const rc2TypeLabel = (v) => (RC2_RCPT_TYPES.find(t => t.v === v) || {}).l || v;

function RcReceiptHistoryPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'ปริ้นใบเสร็จย้อนหลัง', current: true }], []);
  const [memberNo, setMemberNo] = rc2UseState('');
  const [rcptFrom, setRcptFrom] = rc2UseState('');
  const [rcptTo, setRcptTo] = rc2UseState('');
  const [rcptType, setRcptType] = rc2UseState('normal');
  const [dateFrom, setDateFrom] = rc2UseState('2026-01-01');
  const [dateTo, setDateTo] = rc2UseState(rc2Today());
  const [rows, setRows] = rc2UseState(null);
  const [sel, setSel] = rc2UseState({});
  const [page, setPage] = rc2UseState(1);
  const [preview, setPreview] = rc2UseState(null);

  const search = () => {
    let r = rc2History({ rcptType, from: dateFrom, to: dateTo });
    if (memberNo.trim()) r = r.filter(x => String(x.member.code).includes(memberNo.trim()));
    if (rcptFrom.trim()) r = r.filter(x => x.receipt >= rcptFrom.trim());
    if (rcptTo.trim()) r = r.filter(x => x.receipt <= rcptTo.trim());
    r.sort((a, b) => (a.receiptDate < b.receiptDate ? 1 : -1));
    setRows(r); setSel({}); setPage(1);
  };

  const list = rows || [];
  const pages = Math.max(1, Math.ceil(list.length / RC2_PER_PAGE));
  const pageRows = list.slice((page - 1) * RC2_PER_PAGE, page * RC2_PER_PAGE);
  const selKeys = Object.keys(sel).filter(k => sel[k]);
  const allSel = list.length > 0 && list.every(r => sel[r.key]);
  const total = list.filter(r => sel[r.key]).reduce((a, r) => a + r.amount, 0);

  const openPreview = () => setPreview(list.filter(r => sel[r.key]));
  const doPrint = () => {
    window.rcsPrintDocs && window.rcsPrintDocs(onToast);
    setPreview(null); setSel({});
  };

  return (
    <div data-screen-label="หน้าปริ้นใบเสร็จย้อนหลัง">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ปริ้นใบเสร็จย้อนหลัง</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ค้นหาใบเสร็จที่ออกไว้ในอดีตตามเลขสมาชิก ช่วงเลขที่ใบเสร็จ หรือช่วงวันที่ เพื่อสั่งพิมพ์ซ้ำ
          </div>
        </div>
        <span className="spacer" />
        <div className="ct-workdate">
          <span className="ct-workdate-label">วันทำการ</span>
          <span className="ct-workdate-value mono">{rc2Thai(rc2Today())}</span>
        </div>
      </div>

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>เงื่อนไขการค้นหา</h3>
        </div>
        <div className="ap-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <label className="ap-field">
            <span className="ap-label">เลขสมาชิก</span>
            <input className="cfg-input mono" value={memberNo} placeholder="050000"
                   onChange={e => setMemberNo(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          </label>
          <div className="ap-field" style={{ gridColumn: 'span 2' }}>
            <span className="ap-label">เลขที่ใบเสร็จ (ตั้งแต่ – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input className="cfg-input mono" value={rcptFrom} placeholder="RC6901-03100" onChange={e => setRcptFrom(e.target.value)} />
              <span className="muted">–</span>
              <input className="cfg-input mono" value={rcptTo} placeholder="RC6906-03900" onChange={e => setRcptTo(e.target.value)} />
            </div>
          </div>
          <label className="ap-field">
            <span className="ap-label">ประเภทใบเสร็จ</span>
            <select className="cfg-input" value={rcptType} onChange={e => { setRcptType(e.target.value); setRows(null); }}>
              {RC2_RCPT_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </label>
          <div className="ap-field" style={{ gridColumn: 'span 2' }}>
            <span className="ap-label">วันที่ใบเสร็จ (ตั้งแต่ – ถึง)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ErpDate value={dateFrom} onChange={(v) => (e => setDateFrom(e.target.value))({ target: { value: v } })} className="cfg-input" />
              <span className="muted">–</span>
              <ErpDate value={dateTo} onChange={(v) => (e => setDateTo(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </div>
          </div>
          <div className="ap-field" style={{ gridColumn: 'span 2', alignSelf: 'end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={search}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={() => { setRows(null); setSel({}); setMemberNo(''); setRcptFrom(''); setRcptTo(''); }}>
                <Icon name="close" /> ล้างเงื่อนไข
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head">
          <span className="head-bar" /><h3>รายการใบเสร็จย้อนหลัง</h3>
          <span className="muted" style={{ fontSize: 11 }}>
            {rows ? `พบ ${list.length} รายการ · ${rc2TypeLabel(rcptType)}` : 'ยังไม่ได้ค้นหา'}
          </span>
          {rows && list.length > 0 && (
            <>
              <span className="spacer" style={{ flex: 1 }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input type="checkbox" className="ct-check" checked={allSel}
                       onChange={() => setSel(allSel ? {} : Object.fromEntries(list.map(r => [r.key, true])))} />
                เลือกทั้งหมด
              </label>
            </>
          )}
        </div>

        {!rows ? (
          <div className="empty-state">
            <div style={{ marginBottom: 6 }}><Icon name="history" size={26} /></div>
            ระบุเงื่อนไขด้านบนแล้วกด “ค้นหา” เพื่อแสดงใบเสร็จย้อนหลัง
          </div>
        ) : (
          <>
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ct-tbl" style={{ minWidth: 1180 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 40 }}></th>
                    <th style={{ width: 100 }}>เลขสมาชิก</th>
                    <th style={{ minWidth: 190 }}>ชื่อ – ชื่อสกุล</th>
                    <th style={{ width: 140 }}>ประเภทใบเสร็จ</th>
                    <th style={{ width: 140 }}>เลขที่ใบเสร็จ</th>
                    <th className="center" style={{ width: 110 }}>วันที่ใบเสร็จ</th>
                    <th className="center" style={{ width: 110 }}>วันที่รายการ</th>
                    <th style={{ width: 110 }}>ประเภทเงิน</th>
                    <th className="right" style={{ width: 120 }}>ยอดชำระ</th>
                    <th style={{ minWidth: 140 }}>ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(r => (
                    <tr key={r.key} className={sel[r.key] ? 'sel' : ''}>
                      <td className="center">
                        <input type="checkbox" className="ct-check" checked={!!sel[r.key]}
                               onChange={() => setSel(p => ({ ...p, [r.key]: !p[r.key] }))} aria-label={`เลือก ${r.receipt}`} />
                      </td>
                      <td className="mono">{r.member.code}</td>
                      <td>{rc2Name(r.member)}</td>
                      <td>
                        {r.type === 'cancel'
                          ? <span className="chip danger">{rc2TypeLabel(r.type)}</span>
                          : r.type === 'replace'
                            ? <span className="chip warning">{rc2TypeLabel(r.type)}</span>
                            : <span className="chip">{rc2TypeLabel(r.type)}</span>}
                      </td>
                      <td className="mono">{r.receipt}</td>
                      <td className="center mono">{rc2Thai(r.receiptDate)}</td>
                      <td className="center mono">{rc2Thai(r.txnDate)}</td>
                      <td>{r.moneyType}</td>
                      <td className="right mono">{rc2Money(r.amount)}</td>
                      <td>{r.by}</td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan="10" className="center muted" style={{ padding: 28 }}>ไม่พบใบเสร็จตามเงื่อนไขที่ระบุ</td></tr>
                  )}
                </tbody>
              </table>
            </div></div>

            {list.length > 0 && (
              <div className="pagination">
                <span className="muted" style={{ fontSize: 12 }}>
                  แสดง {(page - 1) * RC2_PER_PAGE + 1}–{Math.min(page * RC2_PER_PAGE, list.length)} จาก {list.length} รายการ
                </span>
                <span className="spacer" style={{ flex: 1 }} />
                <button className="btn sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>ก่อนหน้า</button>
                <span className="mono" style={{ fontSize: 12, padding: '0 6px' }}>{page} / {pages}</span>
                <button className="btn sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>ถัดไป</button>
              </div>
            )}

            <div className="ct-actionbar">
              <Icon name="info" size={13} />
              <span className="muted" style={{ fontSize: 12 }}>
                {selKeys.length > 0
                  ? <>เลือก <b style={{ color: 'var(--text)' }}>{selKeys.length}</b> ฉบับ · รวม <b className="mono" style={{ color: 'var(--text)' }}>฿ {rc2Money(total)}</b></>
                  : 'เลือกใบเสร็จที่ต้องการสั่งพิมพ์ซ้ำ'}
              </span>
              <span className="spacer" style={{ flex: 1 }} />
              <button className="btn" onClick={search}><Icon name="download" /> ดึงข้อมูล</button>
              <button className="btn primary" disabled={selKeys.length === 0} onClick={openPreview}>
                <Icon name="print" /> ดูตัวอย่าง / สั่งพิมพ์{selKeys.length > 0 ? ` (${selKeys.length})` : ''}
              </button>
            </div>
          </>
        )}
      </div>

      {preview && (
        <RcSheetPreviewModal
          title="ตัวอย่างสำเนาใบเสร็จรับเงิน (พิมพ์ย้อนหลัง)" subtitle="ระบบการเงิน · ปริ้นใบเสร็จย้อนหลัง"
          docs={preview.map(r => <RcReceiptDoc key={r.key} rec={r} copy />)}
          onClose={() => setPreview(null)} onPrint={doPrint} />
      )}
    </div>
  );
}

Object.assign(window, { RcFinStatusPage, RcReceiptHistoryPage, RcAmountRow });
