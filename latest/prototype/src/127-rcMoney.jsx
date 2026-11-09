// ═════════════════════════════════════════════════════════════════
//  Popup รายละเอียดใบเสร็จเรียกเก็บ (เรียกจากแท็บ "เรียกเก็บ" ในหน้าทะเบียนสมาชิก)
//  แสดงรายการหักชำระของงวดนั้น — ค่าหุ้น · สัญญาเงินกู้ · ค่าธรรมเนียม
//  พร้อมคอลัมน์ชำระต้น/ดอกเบี้ย/คงเหลือ และคืนต้น/คืนดอกเบี้ย
//  อ้างอิงหน้าจอเดิม — เรนเดอร์ใหม่ตามดีไซน์ระบบ (การ์ด/ตาราง)
// ═════════════════════════════════════════════════════════════════

const rcMoney = (v, d = 2) => (v == null ? '' : window.fmt.money(v, d));
const rcRound = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

const RC_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

// term "2569/06" → { be: 2569, month: 6, label: "เดือนมิถุนายน 2569" }
function rcTerm(term) {
  const [be, m] = String(term || '').split('/');
  const month = parseInt(m, 10) || 0;
  return { be, month, label: `เดือน${RC_MONTHS[month] || ''} ${be || ''}`.trim() };
}

// เลขทะเบียนสมาชิกแบบตัวเลข (M-058241 → 058241)
const rcReg = (code) => (code || '').replace(/[^0-9]/g, '') || '—';

// ── ถอยหลัง n งวด เพื่อหายอดของงวดในอดีต (คงยอดผ่อนคงที่) ──
//  monthsBack 0 = งวดล่าสุด (ใช้ยอดคงเหลือปัจจุบันของสัญญา)
function rcStepLoan(loan, monthsBack) {
  const r = (loan.rate || 0) / 1200;
  let after = loan.remaining || 0;      // ยอดคงเหลือหลังชำระงวดนี้
  let term = loan.lastTerm || 0;
  let before = after, interest = 0, principal = loan.installment || 0;
  for (let k = 0; k <= monthsBack; k++) {
    before = r ? (after + (loan.installment || 0)) / (1 + r) : after;
    interest = rcRound(before * r);
    principal = rcRound((loan.installment || 0) - interest);
    if (k < monthsBack) { after = before; term -= 1; }
  }
  return { term, principal, interest, total: rcRound(principal + interest), remaining: rcRound(after) };
}

// ── ประกอบรายการใบเสร็จของงวดหนึ่ง ──
//  index = ลำดับในอาเรย์ collections (0 = งวดล่าสุด)
function rcBuildLines(coll, index, data) {
  const shares = data.shares || [];
  const loans = data.loans || [];
  const monthsBack = index;

  const lines = [];

  // 1) ค่าหุ้น — ยอดรวมส่ง/ยอดสะสมคงเหลือ (ไม่มีการแยกต้น/ดอกเบี้ย)
  const perMonth = shares.filter(s => s.sendStatus === 'ปกติ').reduce((a, s) => a + (s.perMonth || 0), 0);
  const shareTotal = shares.reduce((a, s) => a + (s.shareValue || 0), 0);
  const shareTerm = (shares[0] && shares[0].term ? shares[0].term : 0);
  lines.push({
    kind: 'share', detail: 'ค่าหุ้น', term: shareTerm - monthsBack,
    principal: null, interest: null, total: perMonth,
    remaining: rcRound(shareTotal - monthsBack * perMonth),
  });

  // 2) สัญญาเงินกู้สวัสดิการที่ใช้งานอยู่ (2 สัญญาแรก)
  const active = loans.slice(0, 2);
  active.forEach((ln) => {
    const s = rcStepLoan(ln, monthsBack);
    lines.push({
      kind: 'loan', detail: ln.contract, term: s.term,
      principal: s.principal, interest: s.interest, total: s.total, remaining: s.remaining,
    });
  });

  // 3) ค่าฌาปนกิจสงเคราะห์ (ยอดคงที่ทุกงวด)
  const welfare = 280;
  lines.push({ kind: 'fee', detail: 'ค่าฌาปนกิจสงเคราะห์', term: null, principal: null, interest: null, total: welfare, remaining: null });

  // 4) ค่าธรรมเนียมเรียกเก็บ — เป็นตัวปรับให้ยอดรวมตรงกับใบเรียกเก็บ (ตัดออกหากเป็น 0)
  const sumSoFar = lines.reduce((a, l) => a + (l.total || 0), 0);
  const feeAdj = rcRound((coll.amount || 0) - sumSoFar);
  if (feeAdj > 0) {
    lines.push({ kind: 'fee', detail: 'ค่าธรรมเนียมเรียกเก็บ', term: null, principal: null, interest: null, total: feeAdj, remaining: null });
  }

  // ── การคืนเงิน (เก็บเกิน) — ผูกกับสัญญาเงินกู้สัญญาที่สอง หากงวดนี้มีคืน ──
  if (coll.refund) {
    const loanLine = lines.find(l => l.kind === 'loan' && l.detail === (active[1] && active[1].contract)) || lines.find(l => l.kind === 'loan');
    if (loanLine) { loanLine.refundPrincipal = coll.refund; loanLine.refundInterest = 0; }
  }

  return lines;
}

// ═════════════════════════════════════════════════════════════════
function ReceiptDetailModal({ coll, index, data, onClose }) {
  const { useEffect, useMemo } = React;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const member = data.member || {};
  const t = rcTerm(coll.term);
  const lines = useMemo(() => rcBuildLines(coll, index, data), [coll, index, data]);

  // ── ยอดรวมท้ายตาราง ──
  const sumP = lines.reduce((a, l) => a + (l.principal || 0), 0);
  const sumI = lines.reduce((a, l) => a + (l.interest || 0), 0);
  const sumT = lines.reduce((a, l) => a + (l.total || 0), 0);
  const sumRP = lines.reduce((a, l) => a + (l.refundPrincipal || 0), 0);
  const sumRI = lines.reduce((a, l) => a + (l.refundInterest || 0), 0);
  const sumRT = sumRP + sumRI;
  const emergencyTransfer = 0;                 // ฉุกเฉินหักโอน (งวดนี้ไม่มี)
  const net = rcRound(sumT - sumRT - emergencyTransfer);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lcd-modal rcd-modal" role="dialog" aria-modal="true">
        <div className="modal-head lcd-head">
          <h2>รายละเอียดใบเสร็จเรียกเก็บ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        {/* หัวการ์ด — สมาชิก / งวด·เลขที่ใบเสร็จ / ดอกเบี้ยสะสม */}
        <div className="lcd-contract-head rcd-idrow">
          <div className="lcd-ch-field wide">
            <span className="lcd-ch-k">สมาชิก</span>
            <span className="lcd-ch-v">{rcReg(member.code)} : {member.name}</span>
          </div>
          <div className="lcd-ch-field">
            <span className="lcd-ch-k">{t.label} · ใบเสร็จ</span>
            <span className="lcd-ch-v mono">{coll.receipt}</span>
          </div>
          <div className="lcd-ch-field">
            <span className="lcd-ch-k">ดอกเบี้ยสะสม</span>
            <span className="lcd-ch-v mono" style={{ justifyContent: 'flex-end' }}>{rcMoney(member.accumulatedInterest, 2)}</span>
          </div>
        </div>

        {/* ตารางรายการหักชำระ */}
        <div className="lcd-body">
          <div className="table-wrap rcd-wrap">
            <table className="tbl rcd-tbl">
              <thead>
                <tr>
                  <th rowSpan="2" className="center" style={{ width: 40 }}>#</th>
                  <th rowSpan="2">รายละเอียด</th>
                  <th rowSpan="2" className="center" style={{ width: 56 }}>งวด</th>
                  <th colSpan="4" className="center grp">การชำระ</th>
                  <th colSpan="3" className="center grp rcd-grp-refund">การคืนเงิน (เก็บเกิน)</th>
                </tr>
                <tr>
                  <th className="num sub" style={{ width: 104 }}>ชำระต้น</th>
                  <th className="num sub" style={{ width: 96 }}>ชำระ ด/บ</th>
                  <th className="num sub" style={{ width: 110 }}>รวมชำระ</th>
                  <th className="num sub" style={{ width: 118 }}>คงเหลือ</th>
                  <th className="num sub rcd-refund-cell" style={{ width: 96 }}>คืนต้น</th>
                  <th className="num sub rcd-refund-cell" style={{ width: 90 }}>คืน ด/บ</th>
                  <th className="num sub rcd-refund-cell" style={{ width: 100 }}>รวมคืน</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const refundTot = (l.refundPrincipal || 0) + (l.refundInterest || 0);
                  return (
                    <tr key={i}>
                      <td className="center mono">{i + 1}</td>
                      <td className={l.kind === 'loan' ? 'mono' : ''}>{l.detail}</td>
                      <td className="center mono">{l.term != null ? l.term : '—'}</td>
                      <td className="num mono">{l.principal != null ? rcMoney(l.principal, 2) : '—'}</td>
                      <td className="num mono">{l.interest != null ? rcMoney(l.interest, 2) : '—'}</td>
                      <td className="num mono strong">{rcMoney(l.total, 2)}</td>
                      <td className="num mono">{l.remaining != null ? rcMoney(l.remaining, 2) : '—'}</td>
                      <td className="num mono rcd-refund-cell">{l.refundPrincipal ? rcMoney(l.refundPrincipal, 2) : '—'}</td>
                      <td className="num mono rcd-refund-cell">{l.refundInterest ? rcMoney(l.refundInterest, 2) : '—'}</td>
                      <td className="num mono rcd-refund-cell strong">{refundTot ? rcMoney(refundTot, 2) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="rcd-foot">
                  <td colSpan="3">รวมหักชำระ</td>
                  <td className="num mono strong">{rcMoney(sumP, 2)}</td>
                  <td className="num mono strong">{rcMoney(sumI, 2)}</td>
                  <td className="num mono strong">{rcMoney(sumT, 2)}</td>
                  <td />
                  <td className="num mono strong rcd-refund-cell">{rcMoney(sumRP, 2)}</td>
                  <td className="num mono strong rcd-refund-cell">{rcMoney(sumRI, 2)}</td>
                  <td className="num mono strong rcd-refund-cell">{rcMoney(sumRT, 2)}</td>
                </tr>
                <tr className="rcd-foot-sub">
                  <td colSpan="3">ฉุกเฉินหักโอน</td>
                  <td colSpan="2" />
                  <td className="num mono">{rcMoney(emergencyTransfer, 2)}</td>
                  <td colSpan="4" />
                </tr>
                <tr className="rcd-foot-net">
                  <td colSpan="3">ยอดเรียกเก็บสุทธิ</td>
                  <td colSpan="2" />
                  <td className="num mono strong">{rcMoney(net, 2)}</td>
                  <td colSpan="4" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { ReceiptDetailModal });
