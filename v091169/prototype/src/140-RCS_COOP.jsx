// ════════════════════════════════════════════════════════════════════
//  ตัวอย่างเอกสาร — เมนู "พิมพ์ใบเสร็จ" (ระบบการเงิน)
//   • RcReceiptDoc   ใบเสร็จรับเงิน / สำเนาใบเสร็จ (พิมพ์ย้อนหลัง)
//   • RcWhtDoc       หนังสือรับรองการหักภาษี ณ ที่จ่าย (ม.50 ทวิ)
//   • RcStatusDoc    ใบสถานะการเงินประจำวัน
//   • RcSheetPreviewModal  โมดัลดูตัวอย่าง + สั่งพิมพ์ (portal เฉพาะตอนพิมพ์)
// ════════════════════════════════════════════════════════════════════
const { useState: rcsUseState } = React;

const RCS_COOP = {
  name: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)',
  addr: '99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 · โทร. 0 2104 4344',
  taxId: '0994000165242',
};
const rcsThai = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${Number(y) + 543}`; };
const rcsMoney = (n, d = 2) => (window.fmt ? window.fmt.money(n, d) : Number(n || 0).toFixed(d));
const rcsBaht = (n) => (window.bahtText ? window.bahtText(n) : '');
const rcsName = (m) => (window.msFullName ? window.msFullName(m) : (m && m.name) || '');
const rcsNow = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

function RcsLetterhead({ title, sub }) {
  return (
    <div className="rcs-lh">
      <div className="rcs-lh-org">{RCS_COOP.name}</div>
      <div className="rcs-lh-addr">{RCS_COOP.addr}</div>
      <div className="rcs-lh-addr">เลขประจำตัวผู้เสียภาษีอากร {RCS_COOP.taxId}</div>
      <div className="rcs-lh-title">{title}</div>
      {sub && <div className="rcs-lh-sub2">{sub}</div>}
    </div>
  );
}

function RcsKv({ items, cols = 4 }) {
  return (
    <div className="rcs-kv" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {items.map((it, i) => (
        <div className="rcs-kv-i" key={i}>
          <div className="rcs-kv-k">{it.k}</div>
          <div className={'rcs-kv-v' + (it.mono ? ' mono' : '')}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

function RcsSignRow({ boxes }) {
  return (
    <div className="rcs-sign-row">
      {boxes.map((b, i) => (
        <div className="rcs-sign-box" key={i}>
          <div className="rcs-sign-line" />
          <div>( {b.name} )</div>
          <div className="rcs-sign-role">{b.role}</div>
        </div>
      ))}
    </div>
  );
}

// ─── ใบเสร็จรับเงิน ───────────────────────────────────────────────────
function RcReceiptDoc({ rec, copy }) {
  const lines = rec.lines || [{ item: rec.item, amount: rec.amount }];
  const total = lines.reduce((a, l) => a + Number(l.amount || 0), 0);
  return (
    <div className="rcs-paper">
      {copy && <div className="rcs-stamp">สำเนา / พิมพ์ซ้ำ</div>}
      <RcsLetterhead title="ใบเสร็จรับเงิน" sub={copy ? 'สำเนาใบเสร็จรับเงิน (พิมพ์ย้อนหลัง)' : 'ต้นฉบับ — ออกให้ผู้ชำระเงินเก็บไว้เป็นหลักฐาน'} />
      <RcsKv cols={4} items={[
        { k: 'เลขที่ใบเสร็จ', v: rec.receipt, mono: true },
        { k: 'เลขที่ใบสำคัญรับ', v: rec.voucher || '—', mono: true },
        { k: 'วันที่ใบเสร็จ', v: rcsThai(rec.receiptDate || rec.date), mono: true },
        { k: 'วิธีรับเงิน', v: rec.moneyType || 'เงินสด' },
      ]} />
      <RcsKv cols={3} items={[
        { k: 'เลขทะเบียนสมาชิก', v: (rec.member && rec.member.code) || '—', mono: true },
        { k: 'ชื่อ – สกุล', v: rcsName(rec.member) },
        { k: 'สังกัด', v: (rec.member && (rec.member.dept || rec.member.deptCode)) || '—' },
      ]} />
      <table className="rcs-tbl">
        <thead>
          <tr>
            <th style={{ width: 44 }} className="center">ลำดับ</th>
            <th>รายการ</th>
            <th style={{ width: 130 }} className="right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              <td>{l.item}</td>
              <td className="right mono">{rcsMoney(l.amount)}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 4 - lines.length) }).map((_, i) => (
            <tr key={'e' + i}><td className="center">{lines.length + i + 1}</td><td>&nbsp;</td><td /></tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan="2" className="right">รวมเป็นเงินทั้งสิ้น</td><td className="right mono">{rcsMoney(total)}</td></tr>
          <tr className="rcs-baht"><td colSpan="3">จำนวนเงิน (ตัวอักษร) &nbsp;<b>( {rcsBaht(total)} )</b></td></tr>
        </tfoot>
      </table>
      <div className="rcs-note">
        ใบเสร็จนี้จะสมบูรณ์เมื่อสหกรณ์ได้รับเงินตามจำนวนที่ระบุไว้เรียบร้อยแล้ว · กรณีชำระด้วยเช็คจะสมบูรณ์เมื่อเรียกเก็บเงินตามเช็คได้
      </div>
      <RcsSignRow boxes={[
        { name: rec.by || 'เจ้าหน้าที่การเงิน', role: 'ผู้รับเงิน' },
        { name: 'หัวหน้าฝ่ายการเงิน', role: 'ผู้ตรวจสอบ' },
      ]} />
      <div className="rcs-foot">
        ระบบงานการเงิน · {copy ? 'พิมพ์ย้อนหลัง' : 'พิมพ์ครั้งแรก'} เมื่อ {rcsNow()} น.
      </div>
    </div>
  );
}

// ─── หนังสือรับรองการหักภาษี ณ ที่จ่าย ────────────────────────────────
const RCS_WHT_FORM_LABEL = {
  coop:  'ฉบับสำหรับสหกรณ์ (เก็บไว้เป็นหลักฐาน)',
  payee: 'ฉบับที่ 1 — สำหรับผู้ถูกหักภาษี ณ ที่จ่าย (ใช้แนบพร้อมแบบแสดงรายการภาษี)',
  payer: 'ฉบับสำหรับผู้หักภาษี ณ ที่จ่าย (นำส่งกรมสรรพากร)',
};

function RcsTaxBoxes({ value, count = 13 }) {
  const v = String(value || '').replace(/\D/g, '').padEnd(count, ' ').slice(0, count).split('');
  return <span className="rcs-taxboxes">{v.map((c, i) => <span className="rcs-taxbox mono" key={i}>{c.trim()}</span>)}</span>;
}

function RcWhtDoc({ rec, form = 'payee' }) {
  const amount = Number(rec.amount || 0);
  const tax = Number(rec.tax || 0);
  return (
    <div className="rcs-paper">
      <div className="rcs-formtag">{RCS_WHT_FORM_LABEL[form]}</div>
      <RcsLetterhead title="หนังสือรับรองการหักภาษี ณ ที่จ่าย" sub="ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร" />
      <div className="rcs-wht-ref">
        <span>เล่มที่ <b className="mono">01</b></span>
        <span>เลขที่ <b className="mono">{String(rec.txnNo || '').replace(/\D/g, '').slice(-6) || '000001'}</b></span>
        <span>ลำดับที่ในแบบยื่นรายการ <b className="mono">{rec.no || 1}</b></span>
      </div>

      <div className="rcs-party">
        <div className="rcs-party-role">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย</div>
        <div className="rcs-party-body">
          <div><b>ชื่อ</b> {RCS_COOP.name}</div>
          <div><b>ที่อยู่</b> {RCS_COOP.addr}</div>
        </div>
        <div className="rcs-party-tax">
          <div className="rcs-tax-lab">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</div>
          <RcsTaxBoxes value={RCS_COOP.taxId} />
        </div>
      </div>

      <div className="rcs-party">
        <div className="rcs-party-role">ผู้ถูกหักภาษี ณ ที่จ่าย</div>
        <div className="rcs-party-body">
          <div><b>ชื่อ</b> {rcsName(rec.member)}</div>
          <div><b>สังกัด / เลขทะเบียนสมาชิก</b> {(rec.member && rec.member.dept) || '—'} · <span className="mono">{rec.member && rec.member.code}</span></div>
        </div>
        <div className="rcs-party-tax">
          <div className="rcs-tax-lab">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)</div>
          <RcsTaxBoxes value={rec.taxId} />
        </div>
      </div>

      <table className="rcs-tbl">
        <thead>
          <tr>
            <th>ประเภทเงินได้พึงประเมินที่จ่าย</th>
            <th style={{ width: 90 }} className="center">วันที่จ่าย</th>
            <th style={{ width: 120 }} className="right">จำนวนเงินที่จ่าย</th>
            <th style={{ width: 120 }} className="right">ภาษีที่หักและนำส่งไว้</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>เงินปันผล / เงินเฉลี่ยคืน ตามมาตรา 40 (4) (ข)</td>
            <td className="center mono">{rcsThai(rec.date)}</td>
            <td className="right mono">{rcsMoney(amount)}</td>
            <td className="right mono">{rcsMoney(tax)}</td>
          </tr>
          <tr><td>ดอกเบี้ยเงินฝาก ตามมาตรา 40 (4) (ก)</td><td /><td /><td /></tr>
          <tr><td>อื่น ๆ (ระบุ) ...........................................................</td><td /><td /><td /></tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" className="right">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
            <td className="right mono">{rcsMoney(amount)}</td>
            <td className="right mono">{rcsMoney(tax)}</td>
          </tr>
          <tr className="rcs-baht"><td colSpan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) &nbsp;<b>( {rcsBaht(tax)} )</b></td></tr>
        </tfoot>
      </table>

      <div className="rcs-cond">
        <b>ผู้จ่ายเงิน</b>
        <span className="rcs-opt"><span className="rcs-chk on">✕</span> (1) หัก ณ ที่จ่าย</span>
        <span className="rcs-opt"><span className="rcs-chk" /> (2) ออกให้ตลอดไป</span>
        <span className="rcs-opt"><span className="rcs-chk" /> (3) ออกให้ครั้งเดียว</span>
        <span className="rcs-opt"><span className="rcs-chk" /> (4) อื่น ๆ</span>
      </div>

      <div className="rcs-note">
        ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ · อ้างอิงใบทำรายการเลขที่ <b className="mono">{rec.txnNo}</b>
      </div>
      <RcsSignRow boxes={[
        { name: 'ผู้จัดการสหกรณ์', role: 'ผู้จ่ายเงิน / ผู้มีอำนาจลงนาม' },
        { name: 'เจ้าหน้าที่การเงิน', role: 'ผู้จัดทำ' },
      ]} />
      <div className="rcs-foot">คำเตือน — ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ ต้องรับโทษทางอาญาตามมาตรา 35 แห่งประมวลรัษฎากร</div>
    </div>
  );
}

// ─── ใบสถานะการเงินประจำวัน ───────────────────────────────────────────
function RcStatusDoc({ branch, date, data }) {
  const fwdTotal = Number(data.coopFwd || 0) + Number(data.fundFwd || 0);
  return (
    <div className="rcs-paper">
      <RcsLetterhead title="ใบสถานะการเงิน" sub={`ประจำวันที่ ${rcsThai(date)} · ${branch}`} />
      <RcsKv cols={3} items={[
        { k: 'สาขา / หน่วยงาน', v: branch },
        { k: 'วันที่ทำรายการ', v: rcsThai(date), mono: true },
        { k: 'สถานะเอกสาร', v: 'รอผ่านรายการ' },
      ]} />
      <div className="rcs-sec">ยอดยกมา</div>
      <table className="rcs-tbl">
        <tbody>
          <tr><td>เงินสดยกมา</td><td className="right mono" style={{ width: 180 }}>{rcsMoney(data.cashCarry)}</td></tr>
          <tr><td>เงินฝากคงเหลือยกมา</td><td className="right mono">{rcsMoney(data.depCarry)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td className="right">รวมยอดยกมา</td><td className="right mono">{rcsMoney(Number(data.cashCarry || 0) + Number(data.depCarry || 0))}</td></tr>
        </tfoot>
      </table>
      <div className="rcs-sec">ยอดยกไป</div>
      <table className="rcs-tbl">
        <tbody>
          <tr><td>เงินฝากสหกรณ์คงเหลือยกไป</td><td className="right mono" style={{ width: 180 }}>{rcsMoney(data.coopFwd)}</td></tr>
          <tr><td>เงินฝากกองทุนฯ คงเหลือยกไป</td><td className="right mono">{rcsMoney(data.fundFwd)}</td></tr>
        </tbody>
        <tfoot>
          <tr><td className="right">รวมยอดยกไป</td><td className="right mono">{rcsMoney(fwdTotal)}</td></tr>
          <tr className="rcs-baht"><td colSpan="2">รวมยอดยกไป (ตัวอักษร) &nbsp;<b>( {rcsBaht(fwdTotal)} )</b></td></tr>
        </tfoot>
      </table>
      <RcsSignRow boxes={[
        { name: 'เจ้าหน้าที่การเงิน', role: 'ผู้จัดทำ' },
        { name: 'หัวหน้าฝ่ายการเงิน', role: 'ผู้ตรวจสอบ' },
        { name: 'ผู้จัดการสหกรณ์', role: 'ผู้อนุมัติ' },
      ]} />
      <div className="rcs-foot">ระบบงานการเงิน · พิมพ์เมื่อ {rcsNow()} น.</div>
    </div>
  );
}

// ─── โมดัลดูตัวอย่างเอกสาร + สั่งพิมพ์ ─────────────────────────────────
window.rcsPrintDocs = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

function RcSheetPreviewModal({ title, subtitle, docs, onClose, onPrint }) {
  const [zoom, setZoom] = rcsUseState(1);
  const list = docs || [];
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card rcs-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-warnico"><Icon name="print" size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{subtitle} · {list.length} ฉบับ</div>
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <div className="rcs-zoom">
            <button className="btn sm" onClick={() => setZoom(z => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}>−</button>
            <span className="mono" style={{ fontSize: 11, minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn sm" onClick={() => setZoom(z => Math.min(1.4, Math.round((z + 0.1) * 10) / 10))}>+</button>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body rcs-body">
          <div className="rcs-stack" style={{ '--rcs-zoom': zoom }}>{list}</div>
        </div>
        <div className="rcs-foot-bar">
          <span className="muted" style={{ fontSize: 12 }}>ตัวอย่างเอกสารตามแบบฟอร์มจริง — ขนาด A4 · พิมพ์ 1 ฉบับต่อ 1 หน้ากระดาษ</span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" onClick={onPrint}><Icon name="print" /> พิมพ์เอกสาร</button>
        </div>
      </div>
      {ReactDOM.createPortal(
        <div className="member-print-portal rcs-portal">{list}</div>,
        document.body
      )}
    </>
  );
}

Object.assign(window, {
  RcReceiptDoc, RcWhtDoc, RcStatusDoc, RcSheetPreviewModal,
  RcsLetterhead, RcsKv, RcsSignRow, RCS_WHT_FORM_LABEL,
});
