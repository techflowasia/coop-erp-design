// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่าย — เอกสารสำหรับพิมพ์ / บันทึก PDF (VoucherPrintSheet)
//  เรนเดอร์ผ่าน portal ไปที่ body · ใช้คลาสพิมพ์ชุดเดียวกับใบสมาชิก
// ════════════════════════════════════════════════════════════════════
function vchFlatLeaves() {
  const st = window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || []);
  const map = {};
  const walk = (ns) => ns.forEach(n => {
    if (n.children && n.children.length) walk(n.children);
    else map[n.id] = n;
  });
  walk(st);
  return map;
}

// trigger พิมพ์ (เหมือนกลไกพิมพ์ใบสมาชิก)
window.printVoucher = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

function VoucherPrintSheet({ voucher }) {
  if (!voucher) return null;
  const v = voucher;
  const now = new Date();
  const leaves = vchFlatLeaves();
  const payees = v.payees || [];
  const payeeTotal = window.vchPayeeTotal(payees);
  // รวมบรรทัดที่หมวดงบ คำอธิบาย VAT และหัก ณ ที่จ่ายเหมือนกันเป็นบรรทัดเดียว (ใบที่บันทึกแยกรายคน)
  const printLines = (() => {
    const out = [], at = {};
    (v.lines || []).forEach(l => {
      const k = [l.mode || '', l.cat || '', l.acct || '', (l.desc || '').trim(), Number(l.vat || 0), String(l.wht || '0')].join('|');
      if (at[k] == null) { at[k] = out.length; out.push({ ...l, amount: Number(l.amount || 0) }); }
      else out[at[k]].amount += Number(l.amount || 0);
    });
    return out;
  })();
  const totals = window.vchTotals(printLines);
  const st = window.VCH_STATUS[v.status] || window.VCH_STATUS.draft;
  const M = ({ v: n, d = 2 }) => <span className="mono">{fmt.money(n, d)}</span>;

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">
        {/* หัวกระดาษซ้ำทุกหน้า — thead ของตารางครอบทั้งเอกสาร */}
        <table className="vch-page-tbl" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ display: 'table-header-group' }}>
            <tr><td style={{ padding: 0, border: 0 }}>
              <CoopDocHead title="ใบสำคัญจ่าย (Payment Voucher)" meta={<>
                <span>เลขที่ {v.id}</span>
                <span>วันที่เอกสาร {fmt.date(v.docDate)}</span>
                <span>สถานะ {st.l}</span>
              </>} />
            </td></tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: 0, border: 0 }}>

        <table className="mp-id-table">
          <tbody>
            <tr>
              <th>เลขที่ใบสำคัญจ่าย</th><td className="mono">{v.id}</td>
              <th>ผู้จัดทำ</th><td>{v.createdBy}</td>
            </tr>
            <tr>
              <th>จำนวนผู้รับเงิน</th><td>{payees.length} ราย</td>
              <th>ประเภทการเบิกจ่าย</th><td>{({ general: 'ทั่วไป', refund: 'เบิกเงินรอจ่ายคืน', committee: 'เบิกจ่ายการคณะทำงาน' })[v.payType || 'general'] || 'ทั่วไป'}{v.payType === 'committee' && v.committeeName ? ` · ${v.committeeName}` : ''}</td>
            </tr>
            <tr className="mp-note-row">
              <th>หมายเหตุ</th><td colSpan="3">{v.note || '—'}</td>
            </tr>
          </tbody>
        </table>

        <table className="mp-table mp-table-flow">
          <thead>
            <tr className="mp-sec-row"><th colSpan="7" className="mp-sec-th">รายการเบิกจ่ายและตัดงบประมาณ</th></tr>
            <tr>
              <th>ลำดับ</th>
              <th>หมวดงบประมาณ</th>
              <th>คำอธิบายรายการ</th>
              <th>จำนวนเงิน</th>
              <th>VAT</th>
              <th>หัก ณ ที่จ่าย</th>
              <th>สุทธิ</th>
            </tr>
          </thead>
          <tbody>
            {printLines.map((l, i) => {
              const leaf = leaves[l.cat];
              const c = window.vchLineCalc(l);
              return (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>{leaf ? `${leaf.code} · ${leaf.name}` : '—'}</td>
                  <td>{l.desc || '—'}</td>
                  <td className="right"><M v={c.base} /></td>
                  <td className="right">{c.vatAmt ? <M v={c.vatAmt} /> : '—'}</td>
                  <td className="right">{c.whtAmt ? <M v={c.whtAmt} /> : '—'}</td>
                  <td className="right"><M v={c.net} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3">รวมทั้งสิ้น</td>
              <td className="right"><M v={totals.base} /></td>
              <td className="right"><M v={totals.vat} /></td>
              <td className="right"><M v={totals.wht} /></td>
              <td className="right"><M v={totals.net} /></td>
            </tr>
          </tfoot>
        </table>

        <table className="mp-table mp-table-flow mp-compact">
          <thead>
            <tr className="mp-sec-row"><th colSpan="7" className="mp-sec-th">รายชื่อผู้รับเงิน</th></tr>
            <tr>
              <th>ลำดับ</th>
              <th>ประเภท</th>
              <th>รหัส / ชื่อ-สกุล</th>
              <th>ธนาคาร / สาขา</th>
              <th>เลขที่บัญชี</th>
              <th>วิธีรับเงิน</th>
              <th>ยอดเงิน</th>
            </tr>
          </thead>
            {payees.map((p, i) => {
              const method = window.vchPayeeMethod(p, v);
              const items = (p.items || []).filter(it => it && (it.label || Number(it.amount)));
              return (
                <tbody key={i} className="mp-payee">
                  <tr>
                    <td className="center mono">{i + 1}</td>
                    <td>{(window.VCH_PAYEE_TYPES.find(t => t.v === p.type) || {}).l || '—'}</td>
                    <td>{p.code ? `${p.code} · ${p.name}` : p.name}</td>
                    <td>{p.bank ? `${p.bank} ${p.branch || ''}`.trim() : '—'}</td>
                    <td className="mono">{p.acctNo || '—'}</td>
                    <td>{window.vchPayMethodLabel(method)}{method === 'cheque' && p.chequeNo ? ` · ${p.chequeNo}` : ''}</td>
                    <td className="right"><M v={Number(p.amount || 0)} /></td>
                  </tr>
                  {items.map((it, k) => (
                    <tr key={k} className="mp-item">
                      <td />
                      <td colSpan="5"><span className="mp-item-dot">–</span>{it.label || '—'}</td>
                      <td className="right"><M v={Number(it.amount || 0)} /></td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          <tfoot>
            <tr><td colSpan="6">รวมยอดผู้รับเงินทั้งหมด</td><td className="right"><M v={payeeTotal} /></td></tr>
          </tfoot>
        </table>
        {(() => {
          const mb = (window.vchMethodBreakdown ? window.vchMethodBreakdown(v) : []).filter(m => m.count > 0);
          if (!mb.length) return null;
          const tc = mb.reduce((a, m) => a + m.count, 0), ta = mb.reduce((a, m) => a + Number(m.amount || 0), 0);
          return (
            <table className="mp-table mp-method-tbl">
              <thead>
                <tr><th>วิธีรับเงิน</th>{mb.map(m => <th key={m.v}>{m.l}</th>)}<th>รวม</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>จำนวน / ยอดเงิน</td>
                  {mb.map(m => <td key={m.v} className="right">{m.count} ราย · <M v={Number(m.amount || 0)} /></td>)}
                  <td className="right"><b>{tc} ราย · <M v={ta} /></b></td>
                </tr>
              </tbody>
            </table>
          );
        })()}

        <div className="mp-net-line">
          <span className="mp-net-l">จำนวนเงินสุทธิที่จ่าย</span>
          <b className="mp-net-v mono"><M v={totals.net} /> บาท</b>
          <span className="mp-net-t">({window.bahtText(totals.net)})</span>
        </div>

        <div className="mp-sign-row vch-sign-row">
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้จัดทำ</div><div className="vch-sign-name">{v.createdBy}</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้ตรวจสอบ</div><div className="vch-sign-name">นางสาวิตรี อินทรโชติ</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้อนุมัติ</div><div className="vch-sign-name">นายประสิทธิ์ คงทอง</div></div>
          <div className="mp-sign-box"><div className="mp-sign-line" /><div>ผู้รับเงิน</div><div className="vch-sign-name">{payees.length > 1 ? '(ตามรายชื่อข้างต้น)' : (payees[0] ? payees[0].name : '')}</div></div>
        </div>

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
            </td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { VoucherPrintSheet });
