// ════════════════════════════════════════════════════════════════════
//  กำหนด Lot จ่ายเงินกู้ — ฟอร์มรายงาน (พรีวิว + พิมพ์)
//  · deposit : รายงานเงินฝากตาม Lot (แยกตามประเภทเงินกู้)
//  · cbt     : รายงาน CBT ตามสาขาธนาคาร (แยกธนาคาร › สาขา)
// ════════════════════════════════════════════════════════════════════

const lotrPad = (n) => String(n).padStart(2, '0');
const lotrNow = () => {
  const d = new Date();
  return {
    date: `${lotrPad(d.getDate())}/${lotrPad(d.getMonth() + 1)}/${d.getFullYear() + 543}`,
    time: `${lotrPad(d.getHours())}:${lotrPad(d.getMinutes())}:${lotrPad(d.getSeconds())}`,
  };
};
const lotrMoney = (n) => window.fmt.money(n || 0, 2);
const lotrMemberCode = (r) => r.memberCode || ('M-0' + (57770 + Number(String(r.reqNo).slice(-3)) || 0));
const lotrContract = (r) => r.contractNo || String(r.reqNo).replace(/^LN-/, 'L-');
const lotrFee = (r) => (r.bank === 'ธ.กรุงไทย' ? 0 : 25);

function lotrGroup(list, keyFn) {
  const m = new Map();
  list.forEach((r) => { const k = keyFn(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r); });
  return [...m.entries()];
}

const LOTR = {
  page: { width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '12mm 12mm 14mm', background: '#fff', color: '#111',
          fontFamily: 'Sarabun, sans-serif', fontSize: 13, lineHeight: 1.45, boxShadow: '0 4px 20px rgba(0,0,0,.3)', margin: '0 auto' },
  head: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start', marginBottom: 18 },
  th: { fontWeight: 400, padding: '6px 6px', textAlign: 'left', whiteSpace: 'nowrap' },
  td: { padding: '5px 6px', verticalAlign: 'top' },
};

function LotrHead({ now, user }) {
  return (
    <div style={LOTR.head}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span>วันที่พิมพ์ : {now.date}</span>
        <span>เวลาที่พิมพ์ : {now.time}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center' }}>สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
        <span>หน้าที่ 1 / 1</span>
        <span>ผู้พิมพ์ : {user}</span>
      </div>
    </div>
  );
}

// ── รายงานเงินฝากตาม Lot ───────────────────────────────────────────
function LotrDeposit({ rows }) {
  const typeName = (c) => ((window.LOT_LOAN_TYPES || []).find((t) => t.code === c) || {}).name || c;
  const groups = lotrGroup(rows, (r) => r.typeCode);
  const grand = rows.reduce((s, r) => s + r.amount, 0);
  const num = { ...LOTR.td, textAlign: 'right', whiteSpace: 'nowrap' };
  let seq = 0;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
          <th style={LOTR.th}>ลำดับ</th><th style={LOTR.th}>เลขสมาชิก</th><th style={LOTR.th}>ชื่อ - สกุล</th>
          <th style={LOTR.th}>เลขที่สัญญา</th><th style={LOTR.th}>เลขที่บัญชี</th><th style={{ ...LOTR.th, textAlign: 'right' }}>รับสุทธิ</th>
        </tr>
      </thead>
      {groups.map(([code, list]) => {
        const sub = list.reduce((s, r) => s + r.amount, 0);
        return (
          <tbody key={code}>
            <tr><td colSpan={6} style={{ height: 10 }}></td></tr>
            {list.map((r, i) => { seq += 1; return (
              <tr key={r.reqNo}>
                <td style={LOTR.td}>{seq} ({i + 1})</td>
                <td style={{ ...LOTR.td, whiteSpace: 'nowrap' }}>{lotrMemberCode(r)}</td>
                <td style={LOTR.td}>{r.name}</td>
                <td style={{ ...LOTR.td, whiteSpace: 'nowrap' }}>{lotrContract(r)}</td>
                <td style={{ ...LOTR.td, whiteSpace: 'nowrap' }}>{r.account}</td>
                <td style={num}>{lotrMoney(r.amount)}</td>
              </tr>
            ); })}
            <tr style={{ fontWeight: 700 }}>
              <td colSpan={4}></td><td style={LOTR.td}>{list.length}&nbsp;&nbsp;&nbsp;ราย</td><td style={num}>{lotrMoney(sub)}</td>
            </tr>
            <tr style={{ fontWeight: 700, borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
              <td></td><td colSpan={3} style={{ ...LOTR.td, padding: '9px 6px' }}>รวมประเภทเงินกู้ {typeName(code)}</td>
              <td style={{ ...LOTR.td, padding: '9px 6px' }}>{list.length}&nbsp;&nbsp;&nbsp;ราย</td><td style={{ ...num, padding: '9px 6px' }}>{lotrMoney(sub)}</td>
            </tr>
          </tbody>
        );
      })}
      <tbody>
        <tr style={{ fontWeight: 700, borderBottom: '3px double #111' }}>
          <td></td><td colSpan={3} style={{ ...LOTR.td, padding: '9px 6px' }}>รวมทั้งสิ้น</td>
          <td style={{ ...LOTR.td, padding: '9px 6px' }}>{rows.length}&nbsp;&nbsp;&nbsp;ราย</td><td style={{ ...num, padding: '9px 6px' }}>{lotrMoney(grand)}</td>
        </tr>
      </tbody>
    </table>
  );
}

// ── รายงาน CBT ตามสาขาธนาคาร ───────────────────────────────────────
function LotrCbt({ rows }) {
  const v = '1px solid #111';
  const cell = { ...LOTR.td, borderRight: v };
  const num = { ...cell, textAlign: 'right', whiteSpace: 'nowrap' };
  const numLast = { ...LOTR.td, textAlign: 'right', whiteSpace: 'nowrap' };
  const sums = (list) => list.reduce((a, r) => { const f = lotrFee(r); return { amt: a.amt + r.amount, fee: a.fee + f, net: a.net + r.amount - f }; }, { amt: 0, fee: 0, net: 0 });
  const banks = lotrGroup(rows, (r) => r.bank);
  const g = sums(rows);
  let seq = 0;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderTop: v, borderBottom: v }}>
          <th style={{ ...LOTR.th, borderRight: v }}>ลำดับ</th><th style={{ ...LOTR.th, borderRight: v }}>ชื่อ - สกุล</th>
          <th style={{ ...LOTR.th, borderRight: v }}>สาขา</th><th style={{ ...LOTR.th, borderRight: v, textAlign: 'right' }}>เลขที่บัญชี</th>
          <th style={{ ...LOTR.th, borderRight: v, textAlign: 'right' }}>ยอดรับ</th><th style={{ ...LOTR.th, borderRight: v, textAlign: 'right' }}>ค่า ธน.</th>
          <th style={{ ...LOTR.th, textAlign: 'right' }}>รับสุทธิ</th>
        </tr>
      </thead>
      {banks.map(([bank, bList]) => {
        const bs = sums(bList);
        return (
          <tbody key={bank}>
            {lotrGroup(bList, (r) => r.branch).map(([branch, list]) => {
              const s = sums(list);
              return (
                <React.Fragment key={branch}>
                  {list.map((r, i) => { seq += 1; const f = lotrFee(r); return (
                    <tr key={r.reqNo}>
                      <td style={cell}>{seq} ({i + 1})</td><td style={cell}>{r.name}</td>
                      <td style={cell}>{r.bank} {r.branch}</td><td style={{ ...cell, textAlign: 'right', whiteSpace: 'nowrap' }}>{r.account}</td>
                      <td style={num}>{lotrMoney(r.amount)}</td><td style={num}>{lotrMoney(f)}</td><td style={numLast}>{lotrMoney(r.amount - f)}</td>
                    </tr>
                  ); })}
                  <tr style={{ borderTop: v, borderBottom: '3px double #111' }}>
                    <td colSpan={2} style={LOTR.td}>รวม {branch}</td><td colSpan={2} style={{ ...LOTR.td, borderRight: v }}>{list.length} ราย</td>
                    <td style={num}>{lotrMoney(s.amt)}</td><td style={num}>{lotrMoney(s.fee)}</td><td style={numLast}>{lotrMoney(s.net)}</td>
                  </tr>
                </React.Fragment>
              );
            })}
            <tr style={{ borderBottom: v }}>
              <td colSpan={2} style={LOTR.td}>{bank}</td><td colSpan={2} style={{ ...LOTR.td, borderRight: v }}>{bList.length} ราย</td>
              <td style={num}>{lotrMoney(bs.amt)}</td><td style={num}>{lotrMoney(bs.fee)}</td><td style={numLast}>{lotrMoney(bs.net)}</td>
            </tr>
          </tbody>
        );
      })}
      <tbody>
        <tr style={{ borderBottom: '3px double #111' }}>
          <td style={{ ...LOTR.td, padding: '8px 6px' }}>รวมทั้งสิ้น</td><td style={{ ...LOTR.td, padding: '8px 6px' }}>{rows.length} ราย</td>
          <td colSpan={2} style={{ ...LOTR.td, padding: '8px 6px', borderRight: v }}>{rows.length} สัญญา</td>
          <td style={{ ...num, padding: '8px 6px' }}>{lotrMoney(g.amt)}</td><td style={{ ...num, padding: '8px 6px' }}>{lotrMoney(g.fee)}</td><td style={{ ...numLast, padding: '8px 6px' }}>{lotrMoney(g.net)}</td>
        </tr>
      </tbody>
    </table>
  );
}

function LotReportModal({ kind, rows, onClose }) {
  const [now] = React.useState(lotrNow);
  const user = (window.CURRENT_USER && window.CURRENT_USER.name) || 'Chaiwat';
  const title = kind === 'cbt' ? 'รายงาน CBT ตามสาขาธนาคาร' : 'รายงานเงินฝากตาม Lot';
  const clear = () => document.documentElement.classList.remove('lrq-printing');
  const close = () => { clear(); onClose(); };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); clear(); };
  }, []);
  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const done = () => { clear(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) {}
    setTimeout(clear, 1500);
  };
  return ReactDOM.createPortal(
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — {title} · {rows.length} รายการ</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          <div className="lotr-sheet" style={LOTR.page}>
            <LotrHead now={now} user={user} />
            {kind === 'cbt' ? <LotrCbt rows={rows} /> : <LotrDeposit rows={rows} />}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

Object.assign(window, { LotReportModal });
