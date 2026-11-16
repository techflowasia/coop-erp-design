// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่ายเงินรอจ่ายคืน — เอกสารสำหรับพิมพ์ / บันทึก PDF (VoucherRecvPrintSheet)
//  เรนเดอร์ผ่าน portal ไปที่ body · ใช้คลาสพิมพ์ชุดเดียวกับใบสำคัญจ่าย
// ════════════════════════════════════════════════════════════════════

// trigger พิมพ์ (กลไกเดียวกับใบสำคัญจ่าย)
window.printVoucherRecv = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

function VoucherRecvPrintSheet({ voucher }) {
  if (!voucher) return null;
  const v = voucher;
  const now = new Date();
  const payees = v.payees || [];
  const payeeTotal = window.vchPayeeTotal(payees);
  const entries = v.entries || [];
  const eTotals = window.pvrEntryTotals(entries);
  const refs = v.refs || [];
  const refTotal = refs.reduce((s, r) => s + Number(r.amount || 0), 0);
  const st = window.PVR_STATUS[v.status] || window.PVR_STATUS.draft;
  const coopBank = (window.VCH_COOP_BANKS.find(b => b.v === v.coopBank) || {}).l || '—';
  const M = ({ v: n, d = 2 }) => <span className="mono">{fmt.money(n, d)}</span>;

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">
        <CoopDocHead title="ใบสำคัญจ่ายเงินรอจ่ายคืน (Payment Voucher — Receivable)" meta={<>
          <span>เลขที่ {v.id}</span>
          <span>วันที่เอกสาร {fmt.date(v.docDate)}</span>
          <span>สถานะ {st.l}</span>
          <span className="mp-pageno">หน้า <span className="mp-pp" /></span>
        </>} />

        <table className="mp-id-table">
          <tbody>
            <tr>
              <th>เลขที่ใบสำคัญจ่ายเงินรอจ่ายคืน</th><td className="mono">{v.id}</td>
              <th>ผู้จัดทำ</th><td>{v.createdBy}</td>
            </tr>
            <tr>
              <th>จำนวนผู้รับเงิน</th><td>{payees.length} ราย</td>
              <th>หมายเหตุ</th><td>{v.note || '—'}</td>
            </tr>
          </tbody>
        </table>

        {refs.length > 0 && (<>
          <div className="mp-sec-title">รายการค้างรับที่อ้างอิง (ใบสำคัญรับ)</div>
          <table className="mp-table">
            <thead>
              <tr>
                <th className="center">ลำดับ</th>
                <th>เลขสมาชิก</th>
                <th>รายการค้างรับ</th>
                <th>อ้างอิงใบสำคัญรับ</th>
                <th>บัญชีค้างรับ</th>
                <th className="right">ยอดตั้งจ่าย</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r, i) => (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{r.memberNo}<div>{r.memberName}</div></td>
                  <td>{r.desc}</td>
                  <td className="mono">{r.rvNo}</td>
                  <td className="mono">{r.acct} · {window.pvrAcctName(r.acct)}</td>
                  <td className="right"><M v={Number(r.amount || 0)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td colSpan="5">รวมยอดค้างรับที่ตั้งจ่าย</td><td className="right"><M v={refTotal} /></td></tr>
            </tfoot>
          </table>
        </>)}

        <div className="mp-sec-title">รายชื่อผู้รับเงิน</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th className="center">ลำดับ</th>
              <th>ประเภท</th>
              <th>รหัส / ชื่อ-สกุล</th>
              <th>ธนาคาร / สาขา</th>
              <th>เลขที่บัญชี</th>
              <th>วิธีรับเงิน</th>
              <th className="right">ยอดเงิน</th>
            </tr>
          </thead>
          <tbody>
            {payees.map((p, i) => {
              const method = window.vchPayeeMethod(p, v);
              return (
                <tr key={i}>
                  <td className="center mono">{i + 1}</td>
                  <td>{(window.VCH_PAYEE_TYPES.find(t => t.v === p.type) || {}).l || '—'}</td>
                  <td>{p.code ? `${p.code} · ${p.name}` : p.name}</td>
                  <td>{p.bank ? `${p.bank} ${p.branch || ''}`.trim() : '—'}</td>
                  <td className="mono">{p.acctNo || '—'}</td>
                  <td>{window.vchPayMethodLabel(method)}{method === 'cheque' && p.chequeNo ? ` · ${p.chequeNo}` : ''}</td>
                  <td className="right"><M v={Number(p.amount || 0)} /></td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr><td colSpan="6">รวมยอดผู้รับเงินทั้งหมด</td><td className="right"><M v={payeeTotal} /></td></tr>
          </tfoot>
        </table>

        <div className="mp-sec-title">รายการบัญชี (เดบิต / เครดิต)</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th className="center">ลำดับ</th>
              <th>รหัสบัญชี</th>
              <th>คำอธิบายรายการ</th>
              <th>อ้างอิง</th>
              <th className="right">เดบิต</th>
              <th className="right">เครดิต</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((l, i) => (
              <tr key={i}>
                <td className="center mono">{i + 1}</td>
                <td className="mono">{l.acct} · {window.pvrAcctName(l.acct)}</td>
                <td>{l.desc || '—'}</td>
                <td className="mono">{l.ref || '—'}</td>
                <td className="right">{Number(l.dr) ? <M v={Number(l.dr)} /> : '—'}</td>
                <td className="right">{Number(l.cr) ? <M v={Number(l.cr)} /> : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4">รวมทั้งสิ้น</td>
              <td className="right"><M v={eTotals.dr} /></td>
              <td className="right"><M v={eTotals.cr} /></td>
            </tr>
          </tfoot>
        </table>

        <div className="mp-note-box">
          <span className="mp-note-label">จำนวนเงินสุทธิที่จ่าย (ตัวอักษร)</span>
          <div style={{ fontWeight: 600 }}>({window.bahtText(payeeTotal)})</div>
        </div>

        <div className="mp-kv">
          <div className="mp-kv-item"><div className="mp-kv-k">บัญชีธนาคารสหกรณ์ (ฝั่งจ่าย)</div><div className="mp-kv-v">{coopBank}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">หมายเหตุ</div><div className="mp-kv-v">{v.note || '—'}</div></div>
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
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { VoucherRecvPrintSheet });
