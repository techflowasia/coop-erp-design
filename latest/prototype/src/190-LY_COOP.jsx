// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — แบบพิมพ์ ล.ย.02 "หนังสือรับรองดอกเบี้ยเงินกู้ยืม"
//  ใช้กับหน้า ออกหนังสือรับรองดอกเบี้ย (LoanPurposePage)
// ════════════════════════════════════════════════════════════════════

const LY_COOP = {
  name: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด',
  taxId: '0994000167326',
  address: '99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210',
  tel: '02-1044344',
  manager: 'นายรุต  หมุดเพ็ชร',
  managerTitle: 'ผู้จัดการ',
};
const LY_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
function lyThaiLongDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '';
  return `${String(dt.getDate()).padStart(2, '0')} ${LY_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}

function LyLine({ label, value, flex, mono, center }) {
  return (
    <span className="ly-line" style={flex ? { flex } : undefined}>
      {label && <span className="ly-line-lbl">{label}</span>}
      <span className={'ly-line-val' + (mono ? ' mono' : '') + (center ? ' ly-center' : '')}>{value || '\u00A0'}</span>
    </span>
  );
}

// ── แผ่นเอกสาร ล.ย.02 (1 ฉบับ = 1 สัญญา) ─────────────────────────────
function LyCertSheet({ cert }) {
  const c = cert;
  const digits = String(LY_COOP.taxId).split('');
  return (
    <div className="lrqd-sheet ly-sheet">
      <div className="ly-formcode">ล.ย.02</div>
      <h1 className="ly-title">หนังสือรับรองดอกเบี้ยเงินกู้ยืม</h1>
      <div className="ly-sub">ตามประกาศอธิบดีกรมสรรพากร เกี่ยวกับภาษีเงินได้ (ฉบับที่ 165) (ฉบับที่ 166) และ (ฉบับที่ 167)</div>

      <div className="ly-item">
        <span className="ly-no">1.</span>
        <div className="ly-item-body">
          <div className="ly-row">
            <span className="ly-cb on">✓</span><span className="ly-cb-lbl">(1) ผู้ให้กู้ยืม</span>
            <LyLine value={LY_COOP.name} flex="1" />
          </div>
          <div className="ly-row">
            <span className="ly-cb" /><span className="ly-cb-lbl">(2) เจ้าหนี้ใหม่ (กรณีแปลงหนี้)</span>
            <LyLine value="" flex="1" />
          </div>
          <div className="ly-row">
            <span className="ly-cb" /><span className="ly-cb-lbl">(3) เจ้าหนี้ใหม่ (กรณีชำระหนี้เงินกู้ยืม)</span>
            <LyLine value="" flex="1" />
          </div>
          <div className="ly-row ly-taxid-row">
            <span className="ly-taxid-lbl">เลขประจำตัวผู้เสียภาษีอากร</span>
            <span className="ly-taxid-box">{digits.map((d, i) => <span key={i}>{d}</span>)}</span>
          </div>
          <div className="ly-row">
            <LyLine label="ที่อยู่" value={LY_COOP.address} flex="2.2" />
            <LyLine label="โทร" value={LY_COOP.tel} flex="1" />
          </div>
        </div>
      </div>

      <div className="ly-item">
        <span className="ly-no">2.</span>
        <div className="ly-item-body">
          <div className="ly-lead">ผู้กู้ยืม</div>
          <div className="ly-row ly-indent">
            <LyLine label="(1) ชื่อ - นามสกุล" value={c.memberName} flex="1.6" />
            <span className="ly-line ly-boxline"><span className="ly-line-lbl">เลขประจำตัวประชาชน</span><span className="ly-hardbox mono">{c.citizenId || ''}</span></span>
          </div>
          <div className="ly-row ly-indent ly-right-row">
            <span className="ly-line ly-boxline"><span className="ly-line-lbl">หรือ เลขประจำตัวผู้เสียภาษีอากร</span><span className="ly-hardbox mono">{c.memberTaxId || ''}</span></span>
          </div>
          <div className="ly-row ly-indent" style={{ marginTop: 6 }}>
            <LyLine label="ที่อยู่ผู้กู้ยืม" value={c.address} flex="1" />
          </div>
          <div className="ly-note-inline">(กรณีผู้กู้หลายคน ให้แนบบัญชีรายชื่อและที่อยู่ของผู้กู้ตามตัวอย่างใน 2.ทุกรายด้วย)</div>
        </div>
      </div>

      <div className="ly-item">
        <span className="ly-no">3.</span>
        <div className="ly-item-body">
          <div className="ly-row">
            <span className="ly-txt">ผู้กู้ยืมได้ยืมเงินจากผู้ให้กู้ยืม / เจ้าหนี้ใหม่ ตามสัญญากู้ยืมเงินเลขที่</span>
            <LyLine value={c.contract} flex="1" mono />
            <LyLine label="ลงวันที่" value={c.contractDate} flex=".9" />
          </div>
          <div className="ly-row">
            <LyLine label="เป็นจำนวนเงินทั้งสิ้น" value={c.principal} flex="1.4" center />
            <span className="ly-txt">บาท</span>
            <LyLine label="มีกำหนดเวลา" value={c.terms} flex=".8" center />
            <LyLine label="มีอัตราดอกเบี้ย" value={c.rate} flex=".5" center />
          </div>
          <div className="ly-row">
            <LyLine label="วัตถุประสงค์เพื่อการเคหะสงเคราะห์" value={c.purpose} flex="1" />
          </div>
        </div>
      </div>

      <div className="ly-item">
        <span className="ly-no">4.</span>
        <div className="ly-item-body">
          <div className="ly-lead">ผู้กู้ยืมได้จดทะเบียนจำนองอาคารหรือห้องชุดในอาคารชุดหรืออาคารพร้อมที่ดินตาม 3. เป็นประกันการกู้ยืมเงิน</div>
          <div className="ly-row">
            <LyLine label="โดยมีอายุตามสัญญาจำนอง" value={c.mortgageTerms} flex="1" />
          </div>
        </div>
      </div>

      <div className="ly-item">
        <span className="ly-no">5.</span>
        <div className="ly-item-body">
          <div className="ly-lead">ผู้กู้ยืมได้ชำระดอกเบี้ยเงินกู้</div>
          <div className="ly-row">
            <LyLine label={c.periodLabel || 'ประจำปี พ.ศ.'} value={c.periodValue} flex=".55" center />
            <LyLine label="รวมเป็นเงิน" value={c.interestText} flex="2.4" center />
            <span className="ly-txt">บาท</span>
          </div>
        </div>
      </div>

      <div className="ly-certify">ขอรับรองว่า รายการที่แสดงไว้เป็นความจริงทุกประการ</div>

      <div className="ly-sign-block">
        <div className="ly-sign-row">
          <span className="ly-txt">ลงชื่อ</span>
          <span className="ly-sign-line" />
          <span className="ly-txt">ผู้ให้กู้ยืม / เจ้าหนี้</span>
        </div>
        <div className="ly-sign-name">( {LY_COOP.manager} )</div>
        <div className="ly-sign-name">{LY_COOP.managerTitle}</div>
        <div className="ly-sign-date">{c.issuedText}</div>
        <div className="ly-sign-cap">วัน เดือน ปี ที่ออกหนังสือรับรอง</div>
      </div>

      <div className="ly-foot">
        <b>หมายเหตุ</b> <span>กรณีชำระหนี้เงินกู้ยืมเดิมให้รับรองเฉพาะดอกเบี้ยสำหรับกู้ยืมเพื่อชำระหนี้ในส่วนที่ไม่เกินวงเงินค้างชำระ</span>
      </div>
    </div>
  );
}

// ── Overlay พรีวิว + พิมพ์ (หลายฉบับต่อกัน) ──────────────────────────
function LoanCertPrintOverlay({ certs, onClose }) {
  const clearPrintClass = () => document.documentElement.classList.remove('lrq-printing');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clearPrintClass(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); clearPrintClass(); };
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
        <span className="lrq-printview-title">พรีวิว — หนังสือรับรองดอกเบี้ยเงินกู้ยืม (ล.ย.02) · {certs.length} ฉบับ</span>
        <span className="spacer" />
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal">
          {certs.map((c, i) => <LyCertSheet key={i} cert={c} />)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoanCertPrintOverlay, LyCertSheet, LY_COOP, lyThaiLongDate });
