// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี — กระบวนการ & เครื่องมือ
//  อนุมัติรายการ · จัดสรรกำไร · เงินปันผล/เฉลี่ยคืน · เชื่อมโยงระบบย่อย ·
//  นำเข้า/ส่งออกข้อมูล
// ════════════════════════════════════════════════════════════════════
const { useState: apvUseState, useMemo: apvUseMemo } = React;

if (!document.getElementById('apv-card-style')) {
  const st = document.createElement('style');
  st.id = 'apv-card-style';
  st.textContent = '.apv-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 4px; }'
    + '.apv-stat { background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; min-width: 0; }'
    + '.apv-stat-lab { font-size: 12.5px; font-weight: 600; color: var(--text); }'
    + '.apv-stat-val { display: flex; align-items: baseline; gap: 5px; min-width: 0; }'
    + '.apv-stat-num { font-size: 22px; font-weight: 700; line-height: 1.15; min-width: 0; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }'
    + '.apv-stat-unit { flex: 0 0 auto; white-space: nowrap; }'
    + '.apv-stat-unit { font-size: 12px; font-weight: 500; color: var(--text-muted); }'
    + '.apv-tabs { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; border-bottom: 1px solid #F0F0F0; margin-bottom: 4px; }'
    + '.apv-tab { display: inline-flex; align-items: center; gap: 7px; background: none; border: 0; padding: 8px 0 10px; margin-bottom: -1px; font: inherit; font-size: 12.5px; font-weight: 400; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: color .15s ease, border-color .15s ease; }'
    + '.apv-tab:hover { color: #237450; }'
    + '.apv-tab.is-on { color: #237450; font-weight: 400; border-bottom-color: #237450; }'
    + '.apv-tab-ct { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 6px; border-radius: 999px; background: #F0F0F0; color: var(--text-muted); font-size: 11.5px; font-weight: 600; }'
    + '.apv-tab.is-on .apv-tab-ct { background: #EAFEF2; color: #237450; }'
    + '.apv-stat.is-accent { background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.apv-stat.is-accent .apv-stat-lab, .apv-stat.is-accent .apv-stat-num { color: #237450; }'
    + '@media (max-width: 640px) { .apv-stat-row { grid-template-columns: 1fr 1fr; } .apv-stat-num { font-size: 19px; } }';
  document.head.appendChild(st);
}

function ApvKpis({ items }) {
  return (
    <div className="apv-stat-row">
      {items.map((k, i) => (
        <div key={i} className={"apv-stat" + (k.accent ? ' is-accent' : '')}>
          <div className="apv-stat-lab">{k.lab}</div>
          <div className="apv-stat-val">
            <span className="apv-stat-num">{k.val}</span>
            {k.unit && <span className="apv-stat-unit">{k.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   1. อนุมัติรายการ (Approval queue — รวมจากหลายระบบ)             │
// ╰─────────────────────────────────────────────────────────────────╯
function buildApprovalQueue() {
  const q = [];
  try {
    (window.vchLoadVouchers() || []).forEach(v => {
      if (['pending_check', 'pending_appr'].includes(v.status))
        q.push({ id: v.id, doc: 'ใบสำคัญจ่าย', tone: 'info', requester: v.createdBy || '—', amount: window.vchPayeeTotal(v.payees), date: v.docDate, note: v.note || '', route: { view: 'account', page: 'voucher' } });
    });
  } catch (e) {}
  try {
    (window.rcvLoad() || []).forEach(v => {
      if (['pending_check', 'pending_appr'].includes(v.status))
        q.push({ id: v.id, doc: 'ใบสำคัญรับ', tone: 'primary', requester: v.createdBy || '—', amount: window.rcvSumReceived(v.lines), date: v.docDate, note: v.headerNote || '', route: { view: 'account', page: 'receipt' } });
    });
  } catch (e) {}
  try {
    (window.pcLoad() || []).forEach(t => {
      if (t.status === 'pending_clear')
        q.push({ id: t.id, doc: 'เคลียร์เงินสดย่อย', tone: 'warning', requester: t.by || '—', amount: t.amount, date: t.date, note: t.desc || '', route: { view: 'account', page: 'petty' } });
    });
  } catch (e) {}
  q.push({ id: 'JV-6906-0021', doc: 'สมุดรายวันทั่วไป', tone: 'neutral', requester: 'นายเกรียงไกร พูนผล', amount: 145000, date: '2026-06-12', note: 'ปรับปรุงค่าเสื่อมราคาประจำเดือน', route: { view: 'account', page: 'opening' } });
  return q.sort((a, b) => (a.date < b.date ? 1 : -1));
}
function ApprovalPage({ onToast, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [done, setDone] = apvUseState(() => new Set());
  const [filter, setFilter] = apvUseState('all');
  const all = apvUseMemo(buildApprovalQueue, []);
  const pool = all.filter(x => !done.has(x.id));
  const queue = pool.filter(x => filter === 'all' || x.doc === filter);
  const docTypes = apvUseMemo(() => Array.from(new Set(all.map(x => x.doc))), [all]);

  const act = (item, ok) => {
    setDone(s => new Set(s).add(item.id));
    audit.log && audit.log({ action: ok ? 'approve' : 'reject', module: 'บัญชี — อนุมัติรายการ', target: item.id, summary: `${ok ? 'อนุมัติ' : 'ตีกลับ'} ${item.doc} ${item.id}` });
    onToast && onToast(`${ok ? 'อนุมัติ' : 'ตีกลับ'} ${item.id} แล้ว`);
  };
  const pendingAmt = queue.reduce((s, x) => s + Number(x.amount || 0), 0);

  return (
    <div data-screen-label="หน้าอนุมัติรายการ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติรายการ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ศูนย์รวมเอกสารทางบัญชีที่รออนุมัติจากทุกระบบงาน — ใบสำคัญรับ/จ่าย เคลียร์เงินสดย่อย และสมุดรายวัน</div>
        </div>
      </div>

      <div className="apv-stat-row">
        {[
          { lab: 'รออนุมัติทั้งหมด', val: queue.length, unit: 'รายการ', accent: true },
          { lab: 'มูลค่ารวมที่รออนุมัติ', val: window.fmt.money(pendingAmt), unit: 'บาท' },
          { lab: 'ประเภทเอกสาร', val: docTypes.length, unit: 'ประเภท' },
        ].map((k, i) => (
          <div key={i} className={"apv-stat" + (k.accent ? ' is-accent' : '')}>
            <span className="apv-stat-lab">{k.lab}</span>
            <span className="apv-stat-val"><b className="apv-stat-num">{k.val}</b>{k.unit && <span className="apv-stat-unit">{k.unit}</span>}</span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="apv-tabs">
          <button className={"apv-tab" + (filter === 'all' ? ' is-on' : '')} onClick={() => setFilter('all')}>
            ทั้งหมด <span className="apv-tab-ct">{pool.length}</span>
          </button>
          {docTypes.map(d => (
            <button key={d} className={"apv-tab" + (filter === d ? ' is-on' : '')} onClick={() => setFilter(d)}>
              {d} <span className="apv-tab-ct">{pool.filter(x => x.doc === d).length}</span>
            </button>
          ))}
        </div>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 940 }}>
            <thead><tr><th style={{ width: 130 }}>เลขที่</th><th style={{ width: 150 }}>ประเภทเอกสาร</th><th style={{ minWidth: 260 }}>รายละเอียด</th><th style={{ width: 150 }}>ผู้จัดทำ</th><th className="right" style={{ width: 120 }}>จำนวนเงิน</th><th className="center" style={{ width: 170 }}>ดำเนินการ</th></tr></thead>
            <tbody>
              {queue.length === 0 && <tr><td colSpan={6} className="center muted" style={{ padding: 28 }}>ไม่มีรายการรออนุมัติ</td></tr>}
              {queue.map(x => (
                <tr key={x.id}>
                  <td><button className="btn link sm" style={{ padding: 0 }} onClick={() => onNav && onNav(x.route)}>{x.id}</button><div className="muted mono" style={{ fontSize: 10.5 }}>{window.fmt.date(x.date)}</div></td>
                  <td><span className={"chip " + x.tone}>{x.doc}</span></td>
                  <td>{x.note || <span className="muted">—</span>}</td>
                  <td style={{ fontSize: 12 }}>{x.requester}</td>
                  <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(x.amount)}</td>
                  <td className="center">
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button className="btn danger sm" onClick={() => act(x, false)}>ตีกลับ</button>
                      <button className="btn primary sm" onClick={() => act(x, true)}><Icon name="check" size={12} /> อนุมัติ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   2. จัดสรรกำไร (Profit Allocation)                              │
// ╰─────────────────────────────────────────────────────────────────╯
const PROFIT_SEED = [
  { k: 'reserve',  l: 'ทุนสำรอง (ไม่น้อยกว่า 10%)', pct: 10, note: 'ตาม พ.ร.บ.สหกรณ์ มาตรา 26' },
  { k: 'league',   l: 'ค่าบำรุงสันนิบาตสหกรณ์ฯ (ไม่เกิน 1%)', pct: 1, note: 'สูงสุด 30,000 บาท' },
  { k: 'dividend', l: 'เงินปันผลตามหุ้น', pct: 45, note: 'จ่ายตามทุนเรือนหุ้น' },
  { k: 'rebate',   l: 'เงินเฉลี่ยคืน', pct: 24, note: 'ตามดอกเบี้ยเงินกู้ที่ส่งให้สหกรณ์' },
  { k: 'bonus',    l: 'โบนัสกรรมการและเจ้าหน้าที่', pct: 7, note: '' },
  { k: 'public',   l: 'ทุนสาธารณประโยชน์', pct: 4, note: '' },
  { k: 'welfare',  l: 'ทุนสวัสดิการสมาชิก', pct: 6, note: '' },
  { k: 'stabil',   l: 'ทุนรักษาระดับอัตราเงินปันผล', pct: 3, note: '' },
];
function ProfitAllocationPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [net, setNet] = apvUseState('49645000');
  const [rows, setRows] = apvUseState(() => PROFIT_SEED.map(r => ({ ...r })));
  const netN = Number(String(net).replace(/[^\d.]/g, '')) || 0;
  const totPct = rows.reduce((s, r) => s + Number(r.pct || 0), 0);
  const setPct = (k, v) => setRows(rows.map(r => r.k === k ? { ...r, pct: Number(String(v).replace(/[^\d.]/g, '')) || 0 } : r));
  const ok = Math.abs(totPct - 100) < 0.01;
  return (
    <div data-screen-label="หน้าจัดสรรกำไร">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>จัดสรรกำไร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>จัดสรรกำไรสุทธิประจำปีตามข้อบังคับสหกรณ์ — สัดส่วนรวมต้องเท่ากับ 100%</div>
        </div>
        <span className="spacer" />
        <div className="as-money-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontSize: 12 }}>กำไรสุทธิประจำปี</span>
          <input className="cfg-input mono" style={{ width: 150, textAlign: 'right' }} value={net} onChange={e => setNet(e.target.value.replace(/[^\d.,]/g, ''))} />
        </div>
        <button className="btn primary sm" disabled={!ok} onClick={() => { onToast && onToast('บันทึกการจัดสรรกำไรเรียบร้อย'); audit.log && audit.log({ action: 'create', module: 'บัญชี — จัดสรรกำไร', target: 'กำไรสุทธิ ' + window.fmt.money(netN), summary: 'บันทึกการจัดสรรกำไรประจำปี' }); }}><Icon name="check" /> บันทึกการจัดสรร</button>
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead><tr><th style={{ minWidth: 300 }}>รายการจัดสรร</th><th className="center" style={{ width: 110 }}>สัดส่วน (%)</th><th className="right" style={{ width: 150 }}>จำนวนเงิน (บาท)</th><th style={{ width: 180 }}>สัดส่วน</th></tr></thead>
            <tbody>
              {rows.map(r => {
                const amt = netN * Number(r.pct || 0) / 100;
                return (
                  <tr key={r.k}>
                    <td><div style={{ fontWeight: 600 }}>{r.l}</div>{r.note && <div className="muted" style={{ fontSize: 11 }}>{r.note}</div>}</td>
                    <td className="center"><input className="cfg-input mono" style={{ width: 76, textAlign: 'center' }} value={r.pct} onChange={e => setPct(r.k, e.target.value)} /></td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{window.fmt.money(amt)}</td>
                    <td><div className="pc-bar-wrap"><div className="pc-bar" style={{ width: Math.min(100, r.pct) + '%' }} /><span className="pc-bar-pct">{r.pct}%</span></div></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot><tr className="pc-rep-tot"><td className="right">รวมการจัดสรร</td><td className="center mono">{totPct}%</td><td className="right mono">{window.fmt.money(netN * totPct / 100)}</td><td>{ok ? <span className="pill ok">ครบ 100%</span> : <span className="pill bad">ต่าง {(100 - totPct).toFixed(2)}%</span>}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   3. เงินปันผล / เงินเฉลี่ยคืน (Dividend / Patronage Refund)     │
// ╰─────────────────────────────────────────────────────────────────╯
const DIV_MEMBERS = [
  { code: 'M-058241', name: 'นายสมชาย ใจดี รักษ์ออม', share: 485000, interest: 38400 },
  { code: 'M-058243', name: 'นายอนุชา สุขสวัสดิ์', share: 312000, interest: 24800 },
  { code: 'M-058244', name: 'นางวิภา จันทร์เพ็ญ', share: 690000, interest: 12600 },
  { code: 'M-058246', name: 'นางสาวกานต์ ศิริวงศ์', share: 158000, interest: 45200 },
  { code: 'M-058249', name: 'นางสมหญิง รักดี', share: 942000, interest: 8900 },
  { code: 'M-058252', name: 'นางสาวจุฬาลักษณ์ ทองดี', share: 226000, interest: 31500 },
];
function DividendPage({ onToast }) {
  const [divRate, setDivRate] = apvUseState('5.50');
  const [rebRate, setRebRate] = apvUseState('12.00');
  const dr = Number(divRate) || 0, rr = Number(rebRate) || 0;
  const rows = DIV_MEMBERS.map(m => { const div = m.share * dr / 100; const reb = m.interest * rr / 100; return { ...m, div, reb, total: div + reb }; });
  const tot = rows.reduce((t, r) => { t.share += r.share; t.interest += r.interest; t.div += r.div; t.reb += r.reb; t.total += r.total; return t; }, { share: 0, interest: 0, div: 0, reb: 0, total: 0 });
  return (
    <div data-screen-label="หน้าเงินปันผลและเฉลี่ยคืน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เงินปันผล / เงินเฉลี่ยคืน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>คำนวณเงินปันผลตามทุนเรือนหุ้น และเงินเฉลี่ยคืนตามดอกเบี้ยเงินกู้ที่สมาชิกส่งให้สหกรณ์</div>
        </div>
        <span className="spacer" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="muted" style={{ fontSize: 12 }}>ปันผล</span><input className="cfg-input mono" style={{ width: 64, textAlign: 'right' }} value={divRate} onChange={e => setDivRate(e.target.value.replace(/[^\d.]/g, ''))} /><span className="muted" style={{ fontSize: 12 }}>%</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className="muted" style={{ fontSize: 12 }}>เฉลี่ยคืน</span><input className="cfg-input mono" style={{ width: 64, textAlign: 'right' }} value={rebRate} onChange={e => setRebRate(e.target.value.replace(/[^\d.]/g, ''))} /><span className="muted" style={{ fontSize: 12 }}>%</span></div>
        <button className="btn primary sm" onClick={() => onToast && onToast('ประมวลผลปันผล/เฉลี่ยคืนเรียบร้อย')}><Icon name="check" /> ประมวลผล</button>
      </div>

      <ApvKpis items={[
        { lab: 'ทุนเรือนหุ้นรวม', val: window.fmt.money(tot.share), unit: 'บาท' },
        { lab: 'เงินปันผลรวม', val: window.fmt.money(tot.div), unit: 'บาท', accent: true },
        { lab: 'เงินเฉลี่ยคืนรวม', val: window.fmt.money(tot.reb), unit: 'บาท', accent: true },
        { lab: 'รวมจ่ายสมาชิก', val: window.fmt.money(tot.total), unit: 'บาท' },
      ]} />

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead><tr><th style={{ width: 110 }}>รหัสสมาชิก</th><th style={{ minWidth: 200 }}>ชื่อ–สกุล</th><th className="right" style={{ width: 130 }}>ทุนเรือนหุ้น</th><th className="right" style={{ width: 120 }}>ปันผล {dr}%</th><th className="right" style={{ width: 130 }}>ดอกเบี้ยจ่าย</th><th className="right" style={{ width: 120 }}>เฉลี่ยคืน {rr}%</th><th className="right" style={{ width: 120 }}>รวมรับ</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.code}>
                  <td className="mono" style={{ fontSize: 11.5 }}>{r.code}</td>
                  <td>{r.name}</td>
                  <td className="right mono">{window.fmt.money(r.share)}</td>
                  <td className="right mono">{window.fmt.money(r.div)}</td>
                  <td className="right mono">{window.fmt.money(r.interest)}</td>
                  <td className="right mono">{window.fmt.money(r.reb)}</td>
                  <td className="right mono" style={{ fontWeight: 700 }}>{window.fmt.money(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="pc-rep-tot"><td colSpan={2} className="right">รวมทั้งสิ้น</td><td className="right mono">{window.fmt.money(tot.share)}</td><td className="right mono">{window.fmt.money(tot.div)}</td><td className="right mono">{window.fmt.money(tot.interest)}</td><td className="right mono">{window.fmt.money(tot.reb)}</td><td className="right mono">{window.fmt.money(tot.total)}</td></tr></tfoot>
          </table>
        </div>
        <div className="lt-list-foot muted"><Icon name="info" size={12} /> แสดงสมาชิกตัวอย่าง {rows.length} ราย — ระบบจริงจะประมวลผลสมาชิกทั้งหมดและออกเอกสารโอนปันผลเข้าบัญชี/หักชำระหนี้</div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   4. เชื่อมโยงระบบย่อย (Subsystem → GL posting)                  │
// ╰─────────────────────────────────────────────────────────────────╯
const SUBSYS_SEED = [
  { sys: 'ระบบเงินฝาก', event: 'รับฝาก / ถอนเงิน', dr: '110111', cr: '210100', enabled: true, pending: 42, last: '2026-06-13' },
  { sys: 'ระบบเงินฝาก', event: 'ดอกเบี้ยจ่ายเงินฝาก', dr: '510200', cr: '210100', enabled: true, pending: 0, last: '2026-06-10' },
  { sys: 'ระบบสินเชื่อ', event: 'จ่ายเงินกู้', dr: '110202', cr: '110111', enabled: true, pending: 8, last: '2026-06-13' },
  { sys: 'ระบบสินเชื่อ', event: 'รับชำระเงินกู้', dr: '110111', cr: '110202', enabled: true, pending: 15, last: '2026-06-13' },
  { sys: 'ระบบหุ้น', event: 'รับค่าหุ้นรายเดือน', dr: '110111', cr: '310100', enabled: true, pending: 31, last: '2026-06-12' },
  { sys: 'ระบบการเงิน', event: 'รับ–จ่ายเงินเคาน์เตอร์', dr: '110101', cr: '420000', enabled: true, pending: 5, last: '2026-06-14' },
  { sys: 'ระบบสวัสดิการ', event: 'จ่ายเงินสงเคราะห์', dr: '530700', cr: '110111', enabled: false, pending: 0, last: '2026-05-30' },
];
function SubsystemLinkPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [rows, setRows] = apvUseState(() => SUBSYS_SEED.map(r => ({ ...r })));
  const totPending = rows.reduce((s, r) => s + (r.enabled ? r.pending : 0), 0);
  const toggle = (i) => setRows(rows.map((r, j) => j === i ? { ...r, enabled: !r.enabled } : r));
  const postAll = () => { setRows(rows.map(r => r.enabled ? { ...r, pending: 0, last: new Date().toISOString().slice(0, 10) } : r)); onToast && onToast(`ส่งรายการเข้าบัญชีแล้ว ${totPending} รายการ`); audit.log && audit.log({ action: 'create', module: 'บัญชี — เชื่อมโยงระบบย่อย', target: `${totPending} รายการ`, summary: 'ประมวลผลส่งรายการระบบย่อยเข้าบัญชี' }); };
  return (
    <div data-screen-label="หน้าเชื่อมโยงระบบย่อย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>เชื่อมโยงระบบย่อย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดการลงบัญชีอัตโนมัติจากระบบงานย่อย (เงินฝาก/สินเชื่อ/หุ้น/การเงิน) เข้าสู่สมุดรายวันบัญชี</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" disabled={!totPending} onClick={postAll}><Icon name="upload" /> ประมวลผลส่งเข้าบัญชี{totPending ? ` (${totPending})` : ''}</button>
      </div>

      <div className="as-stat-row" style={{ marginTop: 4 }}>
        {[
          { lab: 'จุดเชื่อมโยง', val: rows.length, unit: 'รายการ' },
          { lab: 'เปิดใช้งาน', val: rows.filter(r => r.enabled).length, unit: 'รายการ', accent: true },
          { lab: 'รอส่งเข้าบัญชี', val: totPending, unit: 'รายการ' },
        ].map((k, i) => (
          <div key={i} className={"as-stat as-stat-card" + (k.accent ? ' is-active' : '')} style={{ flex: 1 }}>
            <span className="as-stat-lab">{k.lab}</span>
            <span className="as-stat-val"><b className="as-stat-num">{k.val}</b><span className="as-stat-unit">{k.unit}</span></span>
          </div>
        ))}
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap' }}>
          <span className="head-bar" /><h3>จุดเชื่อมโยงการลงบัญชี</h3>
          <div className="head-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="muted" style={{ fontSize: 11.5 }}>ทั้งหมด {rows.length} รายการ</span>
          </div>
        </div>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead><tr><th style={{ width: 140 }}>ระบบย่อย</th><th style={{ minWidth: 200 }}>เหตุการณ์</th><th className="center" style={{ width: 130 }}>บัญชีเดบิต</th><th className="center" style={{ width: 130 }}>บัญชีเครดิต</th><th className="center" style={{ width: 100 }}>รอส่ง</th><th className="mono" style={{ width: 100 }}>ส่งล่าสุด</th><th className="center" style={{ width: 150 }}>สถานะ</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={r.enabled ? null : { opacity: .55, background: '#FAFAFA' }}>
                  <td style={{ fontWeight: 600 }}>{r.sys}</td>
                  <td>{r.event}</td>
                  <td className="center mono" title={window.pcAcctName ? window.pcAcctName(r.dr) : ''}>{r.dr}</td>
                  <td className="center mono" title={window.pcAcctName ? window.pcAcctName(r.cr) : ''}>{r.cr}</td>
                  <td className="center">{r.enabled && r.pending ? <span className="chip warning">{r.pending}</span> : <span className="muted">—</span>}</td>
                  <td className="mono" style={{ fontSize: 11.5 }}>{window.fmt.date(r.last)}</td>
                  <td className="center">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <button className={"ac-switch" + (r.enabled ? ' on' : '')} onClick={() => toggle(i)} aria-pressed={r.enabled}>
                        <span className="ac-switch-track"><span className="ac-switch-knob" /></span>
                      </button>
                      <span style={{ fontSize: 12 }}>{r.enabled ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   5. นำเข้า / ส่งออกข้อมูล                                       │
// ╰─────────────────────────────────────────────────────────────────╯
if (!document.getElementById('io-page-style')) {
  const st = document.createElement('style');
  st.id = 'io-page-style';
  st.textContent = '.io-grid > .search-card { display: flex; flex-direction: column; }'
    + '.io-grid .io-list { flex: 1 1 auto; display: flex; flex-direction: column; gap: 8px; }'
    + '.io-grid .io-row { align-items: center; flex-wrap: wrap; min-height: 56px; }'
    + '.io-grid .io-name { white-space: normal; }';
  document.head.appendChild(st);
}

const IMPORT_TEMPLATES = [
  { l: 'ผังบัญชี (Chart of Accounts)', fmt: '.xlsx', note: 'รหัสบัญชี · ชื่อ · หมวด · ระดับ' },
  { l: 'ยอดยกมาต้นงวด', fmt: '.xlsx', note: 'รหัสบัญชี · เดบิต · เครดิต' },
  { l: 'รายการบัญชีทั่วไป (Journal)', fmt: '.csv', note: 'วันที่ · เดบิต/เครดิต · คำอธิบาย' },
  { l: 'ทะเบียนสินทรัพย์ถาวร', fmt: '.xlsx', note: 'รหัส · ราคาทุน · ค่าเสื่อม' },
];
const EXPORT_REPORTS = [
  { l: 'งบทดลอง (Trial Balance)' },
  { l: 'สมุดรายวันทั่วไป' },
  { l: 'บัญชีแยกประเภท (Ledger)' },
  { l: 'ผังบัญชี' },
  { l: 'งบแสดงฐานะการเงิน' },
];
const IO_HISTORY = [
  { ts: '2026-06-13 16:20', job: 'ส่งออก งบทดลอง', fmt: 'PDF', by: 'นางจันทร์เพ็ญ มาลี', status: 'ok', rows: 142 },
  { ts: '2026-06-12 10:05', job: 'นำเข้า รายการบัญชีทั่วไป', fmt: 'CSV', by: 'นายเกรียงไกร พูนผล', status: 'ok', rows: 320 },
  { ts: '2026-06-10 09:32', job: 'นำเข้า ยอดยกมาต้นงวด', fmt: 'XLSX', by: 'นางจันทร์เพ็ญ มาลี', status: 'warn', rows: 11 },
  { ts: '2026-06-08 14:48', job: 'ส่งออก บัญชีแยกประเภท', fmt: 'XLSX', by: 'สุนิสา ทองแท้', status: 'ok', rows: 1860 },
];
function DataIOPage({ onToast }) {
  const [histOpen, setHistOpen] = React.useState(false);
  return (
    <div data-screen-label="หน้านำเข้าส่งออกข้อมูล">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>นำเข้า / ส่งออกข้อมูล</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>นำเข้าข้อมูลตั้งต้นและรายการบัญชี และส่งออกรายงานทางบัญชีในรูปแบบ Excel / CSV / PDF</div>
        </div>
      </div>

      <div className="as-grid2 io-grid" style={{ marginTop: 8, alignItems: 'stretch' }}>
        <div className="search-card" style={{ padding: 18 }}>
          <div className="section-head"><span className="head-bar" /><h3>นำเข้าข้อมูล</h3></div>
          <div className="io-list">
            {IMPORT_TEMPLATES.map((t, i) => (
              <div key={i} className="io-row">
                <div className="io-ic"><Icon name="upload" size={15} /></div>
                <div style={{ minWidth: 0, flex: 1 }}><div className="io-name">{t.l}</div><div className="muted" style={{ fontSize: 11 }}>{t.note}</div></div>
                <div style={{ display: 'flex', gap: 4, flex: '0 1 auto' }}>
                  <button className="btn text sm" onClick={() => onToast && onToast(`ดาวน์โหลดเทมเพลต ${t.l}`)}><Icon name="download" size={13} /> เทมเพลต {t.fmt}</button>
                  <button className="btn sm" onClick={() => onToast && onToast(`เลือกไฟล์เพื่อนำเข้า ${t.l}`)}>นำเข้า</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="search-card" style={{ padding: 18 }}>
          <div className="section-head"><span className="head-bar" /><h3>ส่งออกข้อมูล</h3></div>
          <div className="io-list">
            {EXPORT_REPORTS.map((r, i) => (
              <div key={i} className="io-row">
                <div className="io-ic"><Icon name="report" size={15} /></div>
                <div style={{ minWidth: 0, flex: 1 }}><div className="io-name">{r.l}</div></div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Excel', 'CSV', 'PDF'].map(f => <button key={f} className="btn sm" onClick={() => onToast && onToast(`ส่งออก ${r.l} เป็น ${f}`)}>{f}</button>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 16 }}>
        <div className="detail-section-head" role="button" tabIndex={0} aria-expanded={histOpen}
             onClick={() => setHistOpen(o => !o)} style={{ margin: 0, cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }}>
          <div className="sh-icon"><Icon name="history" /></div>
          <div style={{ flex: 1, minWidth: 0 }}><div className="sh-title">ประวัติการนำเข้า / ส่งออก</div></div>
          <span style={{ display: 'inline-flex', color: 'var(--text-muted)', transform: histOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s ease' }}><Icon name="chevDown" size={14} /></span>
        </div>
        <div className="table-wrap" style={{ border: 0, overflowX: 'auto', marginTop: 12, display: histOpen ? '' : 'none' }}>
        <table className="tbl" style={{ minWidth: 680 }}>
          <thead><tr><th style={{ width: 150 }}>เวลา</th><th style={{ minWidth: 220 }}>งาน</th><th className="center" style={{ width: 80 }}>รูปแบบ</th><th className="center" style={{ width: 90 }}>จำนวนแถว</th><th style={{ width: 150 }}>ผู้ดำเนินการ</th><th className="center" style={{ width: 100 }}>สถานะ</th></tr></thead>
          <tbody>
            {IO_HISTORY.map((h, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 11.5 }}>{h.ts}</td>
                <td>{h.job}</td>
                <td className="center"><span className="chip">{h.fmt}</span></td>
                <td className="center mono">{h.rows}</td>
                <td style={{ fontSize: 12 }}>{h.by}</td>
                <td className="center">{h.status === 'ok' ? <span className="pill ok">สำเร็จ</span> : <span className="pill warn">มีคำเตือน</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ApprovalPage, ProfitAllocationPage, DividendPage, SubsystemLinkPage, DataIOPage });
