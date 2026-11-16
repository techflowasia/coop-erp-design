// ═════════════════════════════════════════════════════════════════
//  ใบสั่งชำระเงิน — พิมพ์ใบแจ้งชำระ
//  เลือกจากใบแจ้งชำระที่ "ยังไม่ชำระ" ของงวดปัจจุบัน → พรีวิวฟอร์ม A4 → พิมพ์
//  แหล่งข้อมูล: ใบแจ้งเรียกเก็บประจำงวด (สร้างจากสัญญาคงค้าง) + ใบสั่งชำระที่บันทึกจากหน้านี้
// ═════════════════════════════════════════════════════════════════

const PON_KEY = 'po_notices';
const PON_ORG = 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด';
const PON_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const ponNum = (v) => Number(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')) || 0;
const ponDate = (iso) => { if (!iso) return ''; const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number); return `${d} ${PON_MON[m - 1]} ${y + 543}`; };
const ponPeriodOf = (iso) => String(iso || '').slice(0, 7);
const ponPeriodLabel = (p) => { if (!p) return ''; const [y, m] = p.split('-').map(Number); return `${PON_MON[m - 1]} ${y + 543}`; };
const ponEndOfMonth = (p) => { const [y, m] = p.split('-').map(Number); const d = new Date(y, m, 0).getDate(); return `${p}-${String(d).padStart(2, '0')}`; };
const ponHash = (s) => String(s || '').split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function ponLoadSaved() { try { return JSON.parse(localStorage.getItem(PON_KEY) || '[]'); } catch (e) { return []; } }
function ponSaveAll(list) { try { localStorage.setItem(PON_KEY, JSON.stringify(list)); } catch (e) {} }

// ใบแจ้งเรียกเก็บประจำงวด (เดโม) — ต้นเงินงวด + ดอกเบี้ยค้างของทุกสัญญาคงค้าง
function ponPeriodNotice(member, period) {
  const debts = (member.debts || []).filter(d => ponNum(d.principalRemaining) > 0);
  if (!debts.length) return null;
  const be = Number(period.slice(0, 4)) + 543;
  const lines = debts.map(d => {
    const remain = ponNum(d.principalRemaining);
    const inst = ponNum(d.installment || d.monthlyPay) || Math.max(500, Math.round(remain * 0.02 / 100) * 100);
    const paidTerm = ponNum(d.paidTerms || d.lastPaidTerm) || (ponHash(d.contractNo) % 40) + 1;
    return { detail: 'ชำระเงินกู้ ' + (d.type || ''), contractNo: d.contractNo, term: paidTerm + 1,
             principal: Math.min(remain, inst), interest: ponNum(d.interestDue) };
  });
  return {
    id: `PN-${member.code}-${period}`, docNo: `IV${be}${period.slice(5, 7)}-${String(ponHash(member.code) % 100000).padStart(5, '0')}`,
    kind: 'ใบแจ้งเรียกเก็บประจำงวด', memberCode: member.code, period,
    issueDate: `${period}-01`, dueDate: ponEndOfMonth(period), status: 'unpaid', lines,
  };
}

// รายการใบแจ้งชำระของสมาชิกที่ยังไม่ชำระ ในงวดที่กำหนด
window.poUnpaidNotices = (member, asOf) => {
  if (!member) return [];
  const period = ponPeriodOf(asOf);
  const saved = ponLoadSaved().filter(n => n.memberCode === member.code);
  const seed = ponPeriodNotice(member, period);
  const all = (seed && !saved.some(n => n.id === seed.id) ? [seed] : []).concat(saved);
  return all.filter(n => n.period === period && n.status === 'unpaid');
};
// บันทึกใบสั่งชำระจากหน้าจอ → เป็นใบแจ้งชำระรอชำระของงวดวันที่รายการ
window.poSaveNotice = (n) => { const list = ponLoadSaved().filter(x => x.id !== n.id); list.push(n); ponSaveAll(list); };
window.poNoticeTotal = (n) => (n.lines || []).reduce((a, l) => a + ponNum(l.principal) + ponNum(l.interest) + ponNum(l.amount), 0);

// ── Popup เลือกใบแจ้งชำระ ───────────────────────────────────────────
function PoNoticePickModal({ member, asOf, onClose, onPrint }) {
  const list = React.useMemo(() => window.poUnpaidNotices(member, asOf), [member, asOf]);
  const [sel, setSel] = React.useState(() => list.map(n => n.id));
  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : s.concat(id));
  const all = list.length > 0 && sel.length === list.length;
  const th = { padding: '9px 10px', fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,.65)', background: '#fafafa', borderBottom: '1px solid #f0f0f0', textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '10px', fontSize: 13, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 760, maxWidth: 'calc(100vw - 32px)' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="print" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เลือกใบแจ้งชำระ</h2>
            <div className="muted" style={{ fontSize: 11 }}>{member.code} · {member.name} · ใบแจ้งที่ยังไม่ชำระ ประจำงวด {ponPeriodLabel(ponPeriodOf(asOf))}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead><tr>
                <th style={{ ...th, width: 40, textAlign: 'center' }}>
                  <input type="checkbox" className="ct-check" checked={all} disabled={!list.length}
                         onChange={(e) => setSel(e.target.checked ? list.map(n => n.id) : [])} />
                </th>
                <th style={th}>เลขที่ใบแจ้ง</th><th style={th}>ประเภท</th><th style={th}>ประจำงวด</th>
                <th style={th}>กำหนดชำระ</th><th style={{ ...th, textAlign: 'right' }}>ยอดเงิน (บาท)</th><th style={{ ...th, textAlign: 'center' }}>สถานะ</th>
              </tr></thead>
              <tbody>
                {list.map(n => (
                  <tr key={n.id} onClick={() => toggle(n.id)} style={{ cursor: 'pointer', background: sel.includes(n.id) ? 'var(--brand-soft, #EAFEF2)' : '#fff' }}>
                    <td style={{ ...td, textAlign: 'center' }}><input type="checkbox" className="ct-check" checked={sel.includes(n.id)} onChange={() => toggle(n.id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td style={{ ...td, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{n.docNo}</td>
                    <td style={td}>{n.kind}</td>
                    <td style={td}>{ponPeriodLabel(n.period)}</td>
                    <td style={td}>{ponDate(n.dueDate)}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmt.money(window.poNoticeTotal(n), 2)}</td>
                    <td style={{ ...td, textAlign: 'center' }}><span className="pill warn">ยังไม่ชำระ</span></td>
                  </tr>
                ))}
                {!list.length && <tr><td colSpan="7" style={{ ...td, textAlign: 'center', color: 'rgba(0,0,0,.45)', padding: '28px 10px' }}>ไม่พบใบแจ้งชำระที่ยังไม่ชำระในงวดนี้</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" disabled={!sel.length} onClick={() => onPrint(list.filter(n => sel.includes(n.id)))}>
              <Icon name="print" /> พิมพ์ใบแจ้งชำระ{sel.length ? ` (${sel.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── ฟอร์มใบแจ้งการชำระเงิน — ครึ่งบนของ A4 ตามแบบฟอร์มใบแจ้งการจ่ายเงินกู้-หักกลบ ──
function PoNoticeSheet({ n, member, printedBy }) {
  const total = window.poNoticeTotal(n);
  const sumP = n.lines.reduce((a, l) => a + ponNum(l.principal), 0);
  const sumI = n.lines.reduce((a, l) => a + ponNum(l.interest), 0);
  const sumO = n.lines.reduce((a, l) => a + ponNum(l.amount), 0);
  const now = new Date();
  const p2 = (x) => String(x).padStart(2, '0');
  const printed = `${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()} ${p2(now.getHours())}:${p2(now.getMinutes())}`;
  const B = '1px solid #000';
  const F = "'TH Sarabun New', 'Sarabun', serif";
  const td = { borderLeft: B, borderTop: B, padding: '0 8px', height: 26, fontSize: 13.5, verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  const num = { ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
  const ctr = { ...td, textAlign: 'center' };
  const ul = (v, w) => <span style={{ display: 'inline-block', minWidth: w || 0, borderBottom: B, lineHeight: 1.15, padding: '0 2px' }}>{v}</span>;
  const money = (v) => fmt.money(ponNum(v), 2);
  const loanRows = n.lines.map(l => ({
    label: [String(l.detail || '').replace(/^ชำระเงินกู้\s*/, ''), l.contractNo, l.term ? '(' + l.term + ')' : ''].filter(Boolean).join(' '),
    p: l.principal, i: l.interest, t: ponNum(l.principal) + ponNum(l.interest) + ponNum(l.amount),
  }));
  while (loanRows.length < 4) loanRows.push({});
  const rows = loanRows.concat([{ label: 'EMS' }, { label: 'Online' }, { label: 'ค่าธรรมเนียม - ค่าโอน' }, { label: 'VAT 7%' }]);
  const box = (label, val, strong) => (
    <div style={{ flex: 1, borderTop: B, padding: '3px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0 }}>
      <div>{label}</div>
      <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: strong ? 700 : 400 }}>{fmt.money(val, 2)}&nbsp; บาท</div>
    </div>
  );
  const sign = { borderBottom: B, height: 26, margin: '0 2px' };
  return (
    <div className="spc-page" style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', margin: '0 auto 16px', background: '#fff',
                                       boxShadow: '0 1px 4px rgba(0,0,0,.15)', fontFamily: F, color: '#000',
                                       breakAfter: 'page', pageBreakAfter: 'always', overflow: 'hidden' }}>
      <div style={{ height: '148.5mm', boxSizing: 'border-box', padding: '9mm 9mm 0 11mm', overflow: 'hidden', fontSize: 13.5 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 16, lineHeight: 1.5 }}>
          <div style={{ display: 'flex', gap: 36 }}><b>ใบแจ้งการชำระเงิน</b><span>เลขที่ : {ul(n.docNo)}</span></div>
          <div><b>กำหนดชำระวันที่ :</b> {ul(ponDate(n.dueDate))}</div>
          <div style={{ gridColumn: '1 / -1' }}><b>ประจำงวด :</b>&nbsp; {ponPeriodLabel(n.period)} - {n.kind}</div>
          <div><b>ออกใบแจ้งวันที่ :</b>&nbsp; {ponDate(n.issueDate)}</div>
          <div style={{ display: 'flex', gap: 48, justifyContent: 'space-between' }}><b>ยอดชำระ:</b><b style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt.money(total, 2)}</b></div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', borderRight: B, borderBottom: B, marginTop: 2 }}>
          <colgroup><col style={{ width: '32%' }} /><col style={{ width: '15%' }} /><col style={{ width: '16%' }} /><col style={{ width: '16%' }} /><col style={{ width: '21%' }} /></colgroup>
          <tbody>
            <tr>
              <td style={{ ...ctr, height: 50, lineHeight: 1.35, whiteSpace: 'normal' }}>ชื่อ - นามสกุล<div style={{ fontWeight: 700 }}>{member.name}</div></td>
              <td style={{ ...ctr, lineHeight: 1.35 }}>เลขสมาชิก<div style={{ fontWeight: 700 }}>{String(member.code).replace(/^M-/, '')}</div></td>
              <td colSpan="2" style={{ ...ctr, lineHeight: 1.35 }}>สังกัด<div style={{ fontWeight: 700 }}>{member.deptCode ? '( ' + member.deptCode + ' ) ' : ''}{member.dept || '-'}</div></td>
              <td style={{ ...td, padding: '3px 8px', verticalAlign: 'top' }}>
                <div>(1) เงินกู้อนุมัติ</div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt.money(total, 2)}&nbsp; บาท</div>
              </td>
            </tr>
            <tr>
              <td style={{ ...ctr, height: 30 }}>รายการ</td><td style={ctr}>ต้นเงิน</td><td style={ctr}>ดอกเบี้ย</td><td style={ctr}>จำนวนเงิน</td>
              <td rowSpan={rows.length + 2} style={{ ...td, padding: 0, position: 'relative', height: 'auto' }}>
                <div style={{ position: 'absolute', inset: '-1px 0 0 0', display: 'flex', flexDirection: 'column' }}>
                  {box('(2) หักเงินตัวแทน', 0)}
                  {box('(3) หักเงินประกันชีวิต', 0)}
                  {box('(4) หักเงินประกันหนี้', 0)}
                  {box('(5) ชำระเงินกู้ล่วงหน้า', 0)}
                  {box('(6) จ่ายสุทธิ', total, true)}
                </div>
              </td>
            </tr>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={td}>{r.label || ''}</td>
                <td style={num}>{r.p != null ? money(r.p) : ''}</td>
                <td style={num}>{r.i != null ? money(r.i) : ''}</td>
                <td style={num}>{r.t != null ? fmt.money(r.t, 2) : ''}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...td, textAlign: 'right', paddingRight: 14 }}>รวม</td>
              <td style={num}>{fmt.money(sumP, 2)}</td>
              <td style={num}>{fmt.money(sumI, 2)}</td>
              <td style={num}>{fmt.money(total, 2)}</td>
            </tr>
            <tr>
              <td style={{ ...ctr, height: 96, verticalAlign: 'top', paddingTop: 6, lineHeight: 1.7, whiteSpace: 'normal' }}>
                <div>ยอดชำระ</div><div>จำนวนเงิน</div>
                <div style={{ borderBottom: B, margin: '4px 10px 0', fontSize: 11.5, lineHeight: 1.3, minHeight: 20 }}>{window.bahtText ? window.bahtText(total) : ''}</div>
              </td>
              <td colSpan="3" style={{ ...td, verticalAlign: 'top', paddingTop: 10, lineHeight: 1.75 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 4, rowGap: 2, alignItems: 'end' }}>
                  <span style={{ textAlign: 'right' }}>ใบเสร็จเลขที่</span><span style={{ borderBottom: B, height: 20 }} />
                  <span style={{ textAlign: 'right' }}>วันที่</span><span style={{ borderBottom: B, height: 20, marginRight: '35%' }} />
                  <span style={{ textAlign: 'right' }}>เจ้าหน้าที่ออกใบเสร็จ</span><span style={{ borderBottom: B, height: 20 }} />
                </div>
              </td>
              <td style={{ ...ctr, verticalAlign: 'top', paddingTop: 6, lineHeight: 1.5 }}>
                หัวหน้าหน่วยผู้ตรวจสอบ
                <div style={sign} /><div style={sign} />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, borderBottom: B, padding: '8px 0 5px' }}>
          <span>เจ้าหน้าที่หน่วย&nbsp;&nbsp;&nbsp;<b>{printedBy || ''}</b></span>
          <span style={{ fontStyle: 'italic', fontSize: 12 }}>Printed date {printed}</span>
          <b style={{ fontSize: 15 }}>จำนวนสัญญา :&nbsp; {n.lines.length} &nbsp;สัญญา</b>
        </div>
      </div>
    </div>
  );
}

// ── Overlay พรีวิว + พิมพ์ (ใช้กลไกพิมพ์เดียวกับเอกสารใบคำขอกู้) ──────
function PoNoticePrintOverlay({ notices, member, printedBy, onClose }) {
  const clear = () => document.documentElement.classList.remove('lrq-printing');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clear(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); clear(); };
  }, []);
  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const cleanup = () => { clear(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch (e) {}
    setTimeout(clear, 1500);
  };
  const close = () => { clear(); onClose(); };
  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — ใบแจ้งการชำระเงิน ({notices.length} ฉบับ)</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          {notices.map(n => <PoNoticeSheet key={n.id} n={n} member={member} printedBy={printedBy} />)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PoNoticePickModal, PoNoticePrintOverlay, PoNoticeSheet });
