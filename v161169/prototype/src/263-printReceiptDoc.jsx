// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ใบสำคัญรับ — แบบฟอร์มพิมพ์
//   mode = 'rv'      → ใบสำคัญรับ (Receipt Voucher)
//   mode = 'receipt' → ใบเสร็จรับเงิน
//  เรนเดอร์ผ่าน portal ไปที่ body และแสดงเฉพาะตอนพิมพ์ (member-print-portal)
// ════════════════════════════════════════════════════════════════════

window.printReceiptDoc = (onToast, label) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast(`กำลังเตรียม${label || 'เอกสาร'} — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์`);
};

const RCVP_COOP = {
  name: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)',
  addr: '99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 · โทร. 0 2104 4344',
  taxId: '0994000165242',
};
const rcvpDate = (iso) => (window.fmt && window.fmt.date ? window.fmt.date(iso) : iso || '');
const rcvpMoney = (n) => (window.fmt ? window.fmt.money(Number(n || 0), 2) : Number(n || 0).toFixed(2));

function ReceiptPrintSheet({ doc, mode }) {
  if (!doc) return null;
  const isReceipt = mode === 'receipt';
  const rcp = doc.receipt || {};
  const rec = doc.receive || {};
  const payer = doc.payer || {};
  const lines = (doc.lines || []).filter(l => Number(l.amount) > 0);
  const gross = window.rcvSumReceived ? window.rcvSumReceived(lines) : lines.reduce((s, l) => s + Number(l.amount || 0), 0);
  const fee = Number(rec.bankFee || 0);
  const net = gross - fee;
  const status = (window.RCV_STATUS || {})[doc.status] || { l: doc.status };
  const now = new Date();

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet">
        <div className="mp-doc-head">
          <div className="mp-doc-org">{RCVP_COOP.name}</div>
          <div style={{ fontSize: 10.5, color: '#444', marginTop: 2 }}>{RCVP_COOP.addr}</div>
          <div style={{ fontSize: 10.5, color: '#444' }}>เลขประจำตัวผู้เสียภาษีอากร {RCVP_COOP.taxId}</div>
          <div className="mp-doc-title">{isReceipt ? 'ใบเสร็จรับเงิน' : 'ใบสำคัญรับ (Receipt Voucher)'}</div>
          <div className="mp-doc-meta">
            {isReceipt
              ? <><span>เลขที่ใบเสร็จ {rcp.no || '—'}</span><span>วันที่ {rcvpDate(rcp.date || doc.docDate)}</span><span>อ้างอิงใบสำคัญรับ {doc.id}</span></>
              : <><span>เลขที่ {doc.id}</span><span>วันที่เอกสาร {rcvpDate(doc.docDate)}</span><span>งวดบัญชี {doc.period || '—'}</span></>}
          </div>
        </div>

        <div className="mp-kv">
          <div className="mp-kv-item"><div className="mp-kv-k">ผู้ชำระเงิน</div><div className="mp-kv-v">{rcp.name || payer.name || '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">ประเภทผู้ชำระ</div><div className="mp-kv-v">{window.rcvPayerTypeLabel ? window.rcvPayerTypeLabel(payer.type) : '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">เลขทะเบียน / รหัส</div><div className="mp-kv-v">{payer.memberNo || payer.code || '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">สังกัด</div><div className="mp-kv-v">{payer.dept || '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">วิธีรับเงิน</div><div className="mp-kv-v">{window.rcvMethodLabel ? window.rcvMethodLabel(rec.method) : '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">วันที่รับเงิน</div><div className="mp-kv-v">{rcvpDate(rec.receiveDate || doc.docDate)}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">อ้างอิงการรับเงิน</div><div className="mp-kv-v">{rec.transferRef || rec.chequeNo || '—'}</div></div>
          <div className="mp-kv-item"><div className="mp-kv-k">สถานะเอกสาร</div><div className="mp-kv-v">{status.l}</div></div>
        </div>

        {doc.headerNote && (
          <div className="mp-note-box">
            <span className="mp-note-label">คำอธิบายรายการ</span>
            {doc.headerNote}
          </div>
        )}

        <div className="mp-sec-title">รายการรับเงิน</div>
        <table className="mp-table">
          <thead>
            <tr>
              <th className="center" style={{ width: 34 }}>ลำดับ</th>
              <th>รายการ</th>
              <th style={{ width: 120 }}>สัญญา / อ้างอิง</th>
              <th className="right" style={{ width: 110 }}>จำนวนเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="center">{i + 1}</td>
                <td>
                  {l.desc || ((window.rcvLineType && window.rcvLineType(l.recvType).l) || '')}
                  <div className="mp-sub">
                    {(window.rcvLineType ? window.rcvLineType(l.recvType).l : '')}
                    {l.srcSystem && window.rcvSourceLabel ? ' · ' + window.rcvSourceLabel(l.srcSystem) : ''}
                  </div>
                </td>
                <td className="mono">{l.contractNo || '—'}</td>
                <td className="right mono">{rcvpMoney(l.amount)}</td>
              </tr>
            ))}
            {lines.length === 0 && <tr><td colSpan="4" className="center">— ไม่มีรายการ —</td></tr>}
          </tbody>
          <tfoot>
            <tr><td colSpan="3" className="right">รวมเงินที่รับ</td><td className="right mono">{rcvpMoney(gross)}</td></tr>
            {fee > 0 && (
              <tr><td colSpan="3" className="right">หัก {window.RCV_FEE_NAME || 'ค่าธรรมเนียมธนาคาร'}</td><td className="right mono">{rcvpMoney(fee)}</td></tr>
            )}
            <tr><td colSpan="3" className="right">รวมเป็นเงินสุทธิ</td><td className="right mono">{rcvpMoney(net)}</td></tr>
          </tfoot>
        </table>
        <div style={{ textAlign: 'center', fontSize: 11.5, margin: '4px 0 10px' }}>
          จำนวนเงิน (ตัวอักษร) &nbsp;<b>( {window.bahtText ? window.bahtText(net) : ''} )</b>
        </div>

        {isReceipt ? (
          <div className="mp-note-box">
            ใบเสร็จนี้จะสมบูรณ์เมื่อสหกรณ์ได้รับเงินตามจำนวนที่ระบุไว้เรียบร้อยแล้ว ·
            กรณีชำระด้วยเช็คจะสมบูรณ์เมื่อเรียกเก็บเงินตามเช็คได้
          </div>
        ) : (
          <div className="mp-note-box">
            <span className="mp-note-label">การบันทึกบัญชี</span>
            เดบิต {(window.rcvCoopAccount && window.rcvCoopAccount(rec.coopAccount) ? window.rcvCoopAccount(rec.coopAccount).l : 'บัญชีรับเงิน')} ·
            เครดิตตามประเภทรายการรับข้างต้น (ผ่านรายการเมื่อเอกสารอยู่ในสถานะ “ผ่านรายการแล้ว”)
          </div>
        )}

        <div className="mp-sign-row">
          <div className="mp-sign-box">
            <div className="mp-sign-line" />
            <div>( {doc.createdBy || 'เจ้าหน้าที่การเงิน'} )</div>
            <div>ผู้รับเงิน / ผู้จัดทำ</div>
          </div>
          <div className="mp-sign-box">
            <div className="mp-sign-line" />
            <div>( หัวหน้าฝ่ายการเงิน )</div>
            <div>ผู้ตรวจสอบ</div>
          </div>
          {!isReceipt && (
            <div className="mp-sign-box">
              <div className="mp-sign-line" />
              <div>( ผู้จัดการสหกรณ์ )</div>
              <div>ผู้อนุมัติ</div>
            </div>
          )}
        </div>

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span>{isReceipt ? `ใบเสร็จเลขที่ ${rcp.no || '—'}` : `ใบสำคัญรับเลขที่ ${doc.id}`} · หน่วยงาน {doc.dept || '—'}</span>
          <span>พิมพ์เมื่อ {window.fmt && window.fmt.datetime ? window.fmt.datetime(now.toISOString()) : now.toISOString().slice(0, 16)} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { ReceiptPrintSheet });
