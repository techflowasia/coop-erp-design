// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — ควบคุมเงินสด (Cash control)
//  บันทึกการนำเงินสดเข้า / เบิกเงินสดออก ระหว่างลิ้นชักผู้ทำการ (teller)
//  กับเงินสดกลางของสหกรณ์ — เลือกผู้ร้องขอ → เลือกประเภทรายการ → ใส่จำนวนเงิน
//  แสดงยอด "เงินสหกรณ์คงเหลือ" หลังทำรายการ และเก็บประวัติรายการล่าสุด
// ════════════════════════════════════════════════════════════════════
const { useState: cclUseState, useMemo: cclUseMemo } = React;

const CCL_KEY = 'coop_cash_control_v1';
const CCL_OPENING = 3803441.44; // เงินสดกลางสหกรณ์ยกมา

// ประเภทรายการ — sign = ผลต่อเงินสดกลางของสหกรณ์
const CCL_TYPES = [
  { v: 'in',  l: 'นำเงินสดเข้าสหกรณ์', sign: +1, teller: -1, hint: 'ผู้ทำการนำเงินสดจากลิ้นชักส่งเข้าเงินสดกลาง' },
  { v: 'out', l: 'เบิกเงินสดจากสหกรณ์', sign: -1, teller: +1, hint: 'จ่ายเงินสดกลางให้ผู้ทำการเพื่อเปิด/เติมลิ้นชัก' },
];

const cclTellers = () => (window.CASH_TELLERS || []);
const cclSum = (rows) => (window.ccSum ? window.ccSum(rows || []) : (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0));
const cclDrawer = (t) => (t && t.drawer === 'open') ? (cclSum(t.income) - cclSum(t.expense)) : 0;
const cclNum = (v) => Number(String(v || 0).replace(/,/g, '')) || 0;

const cclLoad = () => { try { return JSON.parse(localStorage.getItem(CCL_KEY)) || []; } catch (e) { return []; } };
const cclSave = (list) => { try { localStorage.setItem(CCL_KEY, JSON.stringify(list)); } catch (e) {} };

function CclField({ label, hint, required, children, style }) {
  return (
    <div className="fbt-field" style={style}>
      <label className="fbt-lab">
        {label}{required && <span className="cfg-required"> *</span>}
        {hint && <span className="fbt-lab-hint"> {hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ── โมดัลเลือกผู้ร้องขอ (ผู้ทำการ) ──────────────────────────────────
function CclRequesterModal({ onPick, onClose }) {
  const [q, setQ] = cclUseState('');
  const rows = cclTellers().filter(t =>
    !q || t.user.toLowerCase().includes(q.toLowerCase()) || (t.name || '').includes(q));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 560 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="user" /></div>
          <h2>เลือกผู้ร้องขอ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="cfg-input-wrap" style={{ marginBottom: 12 }}>
            <input className="cfg-input" placeholder="ค้นหาชื่อผู้ใช้ / ชื่อ–สกุล" value={q}
                   onChange={e => setQ(e.target.value)} autoFocus />
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 130 }}>ชื่อผู้ใช้</th>
                  <th>ชื่อ – สกุล</th>
                  <th className="center" style={{ width: 96 }}>ลิ้นชัก</th>
                  <th className="right" style={{ width: 130 }}>เงินสดคงเหลือ</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</td></tr>
                )}
                {rows.map(t => (
                  <tr key={t.user}>
                    <td className="mono">{t.user}</td>
                    <td>{t.name}</td>
                    <td className="center">
                      <span className={"pill " + (t.drawer === 'open' ? 'ok' : 'neutral')}>
                        {t.drawer === 'open' ? 'เปิด' : 'ปิด'}
                      </span>
                    </td>
                    <td className="right mono">{window.fmt.money(cclDrawer(t), 2)}</td>
                    <td className="center">
                      <button className="btn text sm" onClick={() => onPick(t)}>เลือก</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

function CashControlPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const today = new Date().toISOString().slice(0, 10);
  const branch = (window.FCX_CURRENT_USER && window.FCX_CURRENT_USER.branch) || 'สำนักงานใหญ่';

  const [list, setList] = cclUseState(cclLoad);
  const [requester, setRequester] = cclUseState(null);
  const [txnType, setTxnType] = cclUseState('in');
  const [amount, setAmount] = cclUseState('');
  const [pickOpen, setPickOpen] = cclUseState(false);

  const persist = (next) => { setList(next); cclSave(next); };

  // เงินสหกรณ์คงเหลือปัจจุบัน = ยกมา + ผลรวมของรายการที่บันทึกไว้
  const coopBalance = cclUseMemo(
    () => list.reduce((s, r) => s + r.sign * r.amount, CCL_OPENING),
    [list]
  );

  const type = CCL_TYPES.find(t => t.v === txnType);
  const amt = cclNum(amount);
  const drawer = cclDrawer(requester);
  const coopAfter = coopBalance + type.sign * amt;
  const drawerAfter = drawer + type.teller * amt;

  const reset = () => { setRequester(null); setTxnType('in'); setAmount(''); };

  const save = () => {
    if (!requester) { onToast && onToast('กรุณาเลือกผู้ร้องขอก่อนบันทึกรายการ'); return; }
    if (requester.drawer !== 'open') { onToast && onToast('ผู้ร้องขอยังไม่เปิดลิ้นชัก'); return; }
    if (amt <= 0) { onToast && onToast('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return; }
    if (type.v === 'in' && amt > drawer) { onToast && onToast('จำนวนเงินเกินยอดเงินสดคงเหลือในลิ้นชัก'); return; }
    if (type.v === 'out' && amt > coopBalance) { onToast && onToast('จำนวนเงินเกินเงินสหกรณ์คงเหลือ'); return; }
    const seq = String(list.length + 1).padStart(4, '0');
    const id = 'CC-' + today.replace(/-/g, '').slice(2) + '-' + seq;
    const rec = {
      id, ts: new Date().toISOString(), txnDate: today, branch,
      type: type.v, typeLabel: type.l, sign: type.sign,
      user: requester.user, name: requester.name, amount: amt,
    };
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — ควบคุมเงินสด', target: `${id} · ${rec.name}`,
      summary: `${type.l} “${rec.name}” ${window.fmt.money(amt, 2)} บาท`,
    });
    onToast && onToast(`บันทึกรายการ ${id} เรียบร้อย — ${type.l} ${window.fmt.money(amt, 2)} บาท`);
    reset();
  };

  const sorted = cclUseMemo(() => [...list].sort((a, b) => (a.ts < b.ts ? 1 : -1)), [list]);
  const open = requester && requester.drawer === 'open';

  return (
    <div data-screen-label="หน้าควบคุมเงินสด (การเงิน)">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ควบคุมเงินสด</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            บันทึกการนำเงินสดเข้า–เบิกเงินสดออก ระหว่างลิ้นชักผู้ทำการกับเงินสดกลางของสหกรณ์
          </div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn sm" data-keep-top="" onClick={reset}>ล้างข้อมูล</button>
        <button className="btn primary sm" data-keep-top="" onClick={save}>บันทึกรายการ</button>
      </div>

      <div className="search-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 20px', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>เงินสหกรณ์คงเหลือ</span>
        <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand, #237450)' }}>
          {window.fmt.money(coopBalance, 2)} <small style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,.55)' }}>บาท</small>
        </span>
      </div>

      {/* ── ฟอร์มควบคุมเงินสด ── */}
      <div className="search-card fbt-card">
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" /><h3>การเงิน (ควบคุมเงินสด)</h3>
        </div>
        <div className="fbt-grid">
          <CclField label="วันที่ทำรายการ" hint="(วันที่ระบบ)">
            <input className="cfg-input fbt-ro" value={window.fmt.date(today)} readOnly />
          </CclField>
          <CclField label="สาขา" style={{ gridColumn: 'span 2' }}>
            <input className="cfg-input fbt-ro" value={branch} readOnly />
          </CclField>

          <CclField label="ผู้ร้องขอ" required style={{ gridColumn: 'span 2' }}>
            <MemberSearchField
              member={requester ? { code: requester.user, name: requester.name } : null}
              source={cclTellers().map(t => ({ code: t.user, name: t.name, citizenId: t.citizenId || '—', unit: 'ฝ่ายการเงิน' }))}
              title="ค้นหาเจ้าหน้าที่ฝ่ายการเงิน" placeholder="คลิกเพื่อค้นหาเจ้าหน้าที่การเงิน…"
              onPick={(m) => setRequester(cclTellers().find(t => t.user === m.code) || null)} />
          </CclField>
          <CclField label="สถานะ">
            <input className="cfg-input fbt-ro" value={requester ? (open ? 'เปิดลิ้นชัก' : 'ปิดลิ้นชัก') : ''}
                   readOnly placeholder="—" />
          </CclField>

          <CclField label="เงินสดคงเหลือ" hint="(ในลิ้นชักผู้ร้องขอ)" style={{ gridColumn: 'span 2' }}>
            <input className="cfg-input fbt-ro mono" style={{ textAlign: 'right' }}
                   value={requester && open ? window.fmt.money(drawer, 2) : ''} readOnly placeholder="—" />
          </CclField>
        </div>

        <div className="section-head" style={{ margin: '18px 0 14px' }}>
          <span className="head-bar" /><h3>รายละเอียดรายการ</h3>
        </div>
        <div className="fbt-grid">
          <CclField label="ประเภทรายการ" required style={{ gridColumn: 'span 2' }}>
            <select className="cfg-input" value={txnType} onChange={e => setTxnType(e.target.value)}>
              {CCL_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </CclField>
          <CclField label=" " style={{ gridColumn: 'span 1', alignSelf: 'end' }}>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, paddingBottom: 6 }}>
              <Icon name="info" size={12} /> {type.hint}
            </div>
          </CclField>

          <CclField label="จำนวนเงินในครั้งนี้" required style={{ gridColumn: 'span 3' }}>
            <input className="cfg-input mono ccl-amount" type="number" inputMode="decimal" min="0" step="0.01"
                   value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                   style={{ textAlign: 'right', fontSize: 20, fontWeight: 700, height: 48 }} />
          </CclField>
        </div>

        {/* สรุปหลังทำรายการ */}
        <div className="ccl-preview">
          <div className="ccl-prev-cell">
            <div className="ccl-prev-lab">เงินสดในลิ้นชักหลังทำรายการ</div>
            <div className="ccl-prev-val mono">{requester && open ? window.fmt.money(drawerAfter, 2) : '—'}</div>
          </div>
          <div className="ccl-prev-arrow"><Icon name={type.v === 'in' ? 'chevRight' : 'chevLeft'} size={18} /></div>
          <div className="ccl-prev-cell accent">
            <div className="ccl-prev-lab">เงินสหกรณ์คงเหลือหลังทำรายการ</div>
            <div className="ccl-prev-val mono">{window.fmt.money(amt ? coopAfter : coopBalance, 2)}</div>
          </div>
        </div>
      </div>

      {/* ── ประวัติรายการล่าสุด ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>รายการควบคุมเงินสด</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>เงินสดกลางยกมา {window.fmt.money(CCL_OPENING, 2)} บาท · {sorted.length} รายการ</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th className="center" style={{ width: 60 }}>ลำดับ</th>
                <th style={{ width: 140 }}>เลขที่</th>
                <th className="center" style={{ width: 110 }}>วันที่</th>
                <th style={{ minWidth: 180 }}>ประเภทรายการ</th>
                <th style={{ width: 130 }}>ผู้ร้องขอ</th>
                <th style={{ minWidth: 160 }}>ชื่อ – สกุล</th>
                <th className="right" style={{ width: 150 }}>จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={7} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>
              )}
              {sorted.map((rec, i) => (
                <tr key={rec.id}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{rec.id}</td>
                  <td className="center mono">{window.fmt.date(rec.txnDate)}</td>
                  <td>
                    <span className={"chip " + (rec.sign > 0 ? 'success' : 'warn')} style={{ marginRight: 6 }}>
                      {rec.sign > 0 ? 'นำเข้า' : 'เบิกออก'}
                    </span>{rec.typeLabel}
                  </td>
                  <td className="mono">{rec.user}</td>
                  <td>{rec.name}</td>
                  <td className="right mono" style={{ fontWeight: 600, color: rec.sign > 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {rec.sign > 0 ? '+' : '−'}{window.fmt.money(rec.amount, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {pickOpen && (
        <CclRequesterModal
          onPick={(t) => { setRequester(t); setPickOpen(false); }}
          onClose={() => setPickOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { CashControlPage });
