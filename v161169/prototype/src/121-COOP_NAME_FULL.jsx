// ════════════════════════════════════════════════════════════════════
//  หัวกระดาษเอกสารพิมพ์ (Letterhead) — ใช้ร่วมกันทุกระบบ
//  สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)
//  โลโก้ + ชื่อไทย/อังกฤษ + ที่อยู่ — วางไว้บนสุดของทุก print form
// ════════════════════════════════════════════════════════════════════

window.COOP_NAME_FULL = 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)';
window.COOP_NAME_EN   = 'THE COMMUNICATIONS AUTHORITY OF THAILAND SAVINGS CO-OPERATIVE LTD.';
window.COOP_ADDR_TH   = '99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 โทร. 0 2104 4344 โทรสาร 0 2104 4344 ต่อ 1333';
window.COOP_ADDR_EN   = '99 CHAENG WATTANA ROAD, THUNGSONGHONG, LAKSI, BANGKOK 10210 TEL. 0 2104 4344 FAX: 0 2104 4344 EXT.1333';

// บล็อกโลโก้ + ชื่อ + ที่อยู่ (ใช้ซ้ำภายในหัวกระดาษหลายรูปแบบ)
function CoopLetterheadBlock() {
  return (
    <div className="coop-lh-top">
      <img className="coop-lh-logo" src={window.__resources.logo} alt="" />
      <div className="coop-lh-names">
        <div className="coop-lh-th">{window.COOP_NAME_FULL}</div>
        <div className="coop-lh-en">{window.COOP_NAME_EN}</div>
        <div className="coop-lh-addr">{window.COOP_ADDR_TH}</div>
        <div className="coop-lh-addr en">{window.COOP_ADDR_EN}</div>
      </div>
    </div>
  );
}

// หัวเอกสารมาตรฐาน (.mp-doc-head) — letterhead + ชื่อเอกสาร + meta
function CoopDocHead({ title, subtitle, meta }) {
  return (
    <div className="mp-doc-head coop-letterhead">
      <CoopLetterheadBlock />
      {title && <div className="mp-doc-title">{title}</div>}
      {subtitle && <div className="coop-lh-sub">{subtitle}</div>}
      {meta && <div className="mp-doc-meta">{meta}</div>}
    </div>
  );
}

Object.assign(window, { CoopLetterheadBlock, CoopDocHead });
