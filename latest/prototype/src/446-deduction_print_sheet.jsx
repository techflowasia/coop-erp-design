// ════════════════════════════════════════════════════════════════════
//  ใบแจ้งยอดหักชำระประจำเดือน — DeductionPrintSheet
//  ใช้รูปแบบเดียวกับ "พิมพ์รายละเอียดสมาชิก" (CoopDocHead + .mp-sheet)
//  เรนเดอร์ผ่าน portal ไป body · แสดงเฉพาะตอนพิมพ์ (html.member-printing)
// ════════════════════════════════════════════════════════════════════

function DeductionSlipPaper({ data }) {
  const m = data.member;
  const rows = data.deductions || [];
  const now = new Date();
  const PRINT_USER = 'จันทร์เพ็ญ มาลี';
  const TERM = '2569/04';
  const TERM_LABEL = 'เมษายน 2569';

  const sumP = rows.reduce((a, r) => a + (r.principal || 0), 0);
  const sumI = rows.reduce((a, r) => a + (r.interest || 0), 0);
  const sumT = sumP + sumI;
  const bahtWords = window.bahtText ? window.bahtText(sumT) : '';
  const contractOf = (r) => {
    if (r.contractNo) return r.contractNo;
    const m2 = /#([A-Za-z0-9-]+)/.exec(String(r.detail || ''));
    return m2 ? m2[1] : '—';
  };
  const nameOf = (r) => String(r.detail || '').replace(/\s*#[A-Za-z0-9-]+\s*$/, '');

  return (
    <div className="mp-sheet">
        <CoopDocHead title="ใบแจ้งยอดหักชำระประจำเดือน" meta={<>
          <span>งวด {TERM} · {TERM_LABEL}</span>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
          <span>ผู้พิมพ์ : {PRINT_USER}</span>
          <span className="mp-pageno">หน้า <span className="mp-pp" /></span>
        </>} />

        {/* ── ข้อมูลสมาชิก ── */}
        <table className="mp-id-table">
          <tbody>
            <tr>
              <th>เลขทะเบียนสมาชิก</th><td className="mono">{m.code}</td>
              <th>เลขพนักงาน</th><td className="mono">{m.employeeId || '—'}</td>
            </tr>
            <tr>
              <th>ชื่อ - ชื่อสกุล</th><td colSpan="3">{m.name}</td>
            </tr>
            <tr>
              <th>หน่วยงาน / สังกัด</th><td>{m.departmentCode} · {m.department}</td>
              <th>ฐานเงินเดือน</th><td className="mono right">{fmt.money(m.salary, 2)}</td>
            </tr>
            <tr>
              <th>งวดที่หัก</th><td colSpan="3">{TERM_LABEL} (งวด {TERM})</td>
            </tr>
          </tbody>
        </table>

        {/* ── ตารางรายการหักประจำงวด ── */}
        <div className="mp-sec-title">รายการหักประจำงวด</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th style={{ width: 34 }}>ลำดับ</th>
              <th>รายการหัก</th>
              <th style={{ width: 110 }}>เลขที่สัญญา</th>
              <th style={{ width: 74 }}>งวดที่ชำระ<br />มาแล้ว</th>
              <th style={{ width: 88 }}>เงินต้น</th>
              <th style={{ width: 82 }}>ดอกเบี้ย</th>
              <th style={{ width: 92 }}>รวมหัก/งวด</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.no || i}>
                <td className="center">{r.no || i + 1}</td>
                <td>{nameOf(r)}</td>
                <td className="mono center">{contractOf(r)}</td>
                <td className="center mono">{r.term}</td>
                <td className="right mono">{fmt.money(r.principal, 2)}</td>
                <td className="right mono">{r.interest ? fmt.money(r.interest, 2) : '—'}</td>
                <td className="right mono"><b>{fmt.money((r.principal || 0) + (r.interest || 0), 2)}</b></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="right">รวมยอดหักประจำงวด</td>
              <td className="right mono">{fmt.money(sumP, 2)}</td>
              <td className="right mono">{fmt.money(sumI, 2)}</td>
              <td className="right mono"><b>{fmt.money(sumT, 2)}</b></td>
            </tr>
          </tfoot>
        </table>

        <div className="mp-note-box">
          <span className="mp-note-label">จำนวนเงินรวมเป็นตัวอักษร</span>
          <div style={{ fontWeight: 600 }}>({bahtWords})</div>
        </div>

        <div className="mp-note-box">
          <span className="mp-note-label">หมายเหตุ</span>
          <ul>
            <li>ยอดหักตามใบแจ้งนี้เป็นยอดที่สหกรณ์แจ้งให้หน่วยงานต้นสังกัดหักจากเงินได้รายเดือนของสมาชิก</li>
            <li>หากหน่วยงานหักได้ไม่ครบตามจำนวน สมาชิกมีหน้าที่นำเงินส่วนที่ขาดมาชำระต่อสหกรณ์ภายในงวดเดียวกัน</li>
            <li>เอกสารนี้พิมพ์จากระบบ ERP สหกรณ์ ใช้เพื่อการตรวจสอบยอดหักประจำงวดเท่านั้น</li>
          </ul>
        </div>

        <div className="mp-sign-row">
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>เจ้าหน้าที่การเงิน</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>หัวหน้าหน่วยงานต้นสังกัด</div></div>
        </div>
    </div>
  );
}

// ─── Overlay พรีวิว + พิมพ์ (รูปแบบเดียวกับพรีวิวใบรายละเอียดสมาชิก) ──
function DeductionSlipOverlay({ data, onClose }) {
  const clearPrintClass = () => document.documentElement.classList.remove('lrq-printing');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearPrintClass(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const mq = window.matchMedia && window.matchMedia('print');
    const onMq = (x) => { if (!x.matches) clearPrintClass(); };
    if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
      clearPrintClass();
    };
  }, []);

  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const cleanup = () => { clearPrintClass(); window.removeEventListener('afterprint', cleanup); };
    window.addEventListener('afterprint', cleanup);
    try { window.print(); } catch (e) { /* ignore */ }
    setTimeout(clearPrintClass, 1500);
  };

  const close = () => { clearPrintClass(); onClose(); };

  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — ใบแจ้งยอดหักชำระประจำเดือน</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          <DeductionSlipPaper data={data} />
        </div>
      </div>
    </div>
  );
}

// สั่งพิมพ์แบบเดิม (เผื่อเรียกจากที่อื่น)
window.runDeductionPrint = (done) => {
  const html = document.documentElement;
  html.classList.add('lrq-printing');
  const cleanup = () => {
    html.classList.remove('lrq-printing');
    window.removeEventListener('afterprint', cleanup);
    done && done();
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(cleanup, 900); }, 60);
};

Object.assign(window, { DeductionSlipPaper, DeductionSlipOverlay });

// ─── ต่อปุ่ม "พิมพ์ใบหัก" ในแท็บหักประจำเดือน เข้ากับพรีวิวใบแจ้งยอด ──────
//  แท็บฐานอยู่ที่ src/113 และไม่รู้จัก overlay นี้ — จึงห่อคอมโพเนนต์แล้ว
//  ดักปุ่มที่มีข้อความ "พิมพ์ใบหัก" ใส่ onClick ให้ (แบบเดียวกับ src/445)
(function () {
  const Base = window.DeductionsTab;
  if (typeof Base !== 'function') return;

  const elText = (n) => {
    if (n == null || n === false) return '';
    if (typeof n === 'string' || typeof n === 'number') return String(n);
    if (Array.isArray(n)) return n.map(elText).join('');
    if (React.isValidElement(n)) return elText(n.props && n.props.children);
    return '';
  };

  const wire = (node, onPrint) => {
    if (!React.isValidElement(node)) return node;
    const kids = React.Children.toArray(node.props.children);
    const isPrintBtn = node.type === 'button' && !node.props.onClick &&
      elText(node).indexOf('พิมพ์ใบหัก') >= 0;
    if (isPrintBtn) return React.cloneElement(node, { onClick: onPrint });
    if (!node.props.children) return node;
    return React.cloneElement(node, undefined, kids.map((k, i) =>
      React.isValidElement(k) ? React.cloneElement(wire(k, onPrint), { key: k.key != null ? k.key : i }) : k));
  };

  function DeductionsTabWithSlip(props) {
    const [slipOpen, setSlipOpen] = React.useState(false);
    const tree = wire(Base(props), () => setSlipOpen(true));
    return (
      <>
        {tree}
        {slipOpen && <DeductionSlipOverlay data={props.data} onClose={() => setSlipOpen(false)} />}
      </>
    );
  }

  window.DeductionsTab = DeductionsTabWithSlip;
})();
