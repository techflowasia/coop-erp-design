// ════════════════════════════════════════════════════════════════════
//  นิติกรรม — ชุดเอกสารพิมพ์ จัดกลุ่มตามประเภทนิติกรรม
//   จัดกลุ่มตามหัวกระดาษ: บันทึกข้อความ (ภายใน) · เอกสารมอบอำนาจยื่นสำนักงานที่ดิน (หัวกระดาษสหกรณ์)
//              · แบบฟอร์มกรมที่ดิน ท.ด.21 / ท.อ.4 · สัญญาจำนอง ท.ด.15 / อ.ช.16 + สัญญาต่อท้าย
//              · แบบรายงานการทำนิติกรรม (ทำหลังสุด)
//  ข้อมูลดึงจากรายการนิติกรรม (สมาชิก · หลักทรัพย์ · สัญญา · วงเงิน · ผู้รับมอบอำนาจ)
// ════════════════════════════════════════════════════════════════════

// ค-07 — ชื่อผู้ลงนาม/พยาน มาจาก “ทะเบียนผู้ลงนามของเอกสารพิมพ์” (ไม่ฝังชื่อในแบบพิมพ์)
//  ตำแหน่งที่ยังไม่มีผู้ลงนาม → พิมพ์จุดไข่ปลาให้เซ็นมือ · ข้อมูลตั้งต้นเป็นชื่อสมมติ (ตัวอย่าง)
const LD_SIGNER_ROLES = [
  ['co',   'รองประธานกรรมการดำเนินการ', 'ผู้มอบอำนาจ'],
  ['mgr',  'ผู้จัดการ', 'ผู้มอบอำนาจ · ผู้ลงนามบันทึกข้อความ'],
  ['pw1',  'พยานหนังสือมอบอำนาจ คนที่ 1', 'หนังสือมอบอำนาจ'],
  ['pw2',  'พยานหนังสือมอบอำนาจ คนที่ 2', 'หนังสือมอบอำนาจ'],
  ['w1',   'พยานหนังสือหัวกระดาษสหกรณ์ คนที่ 1', 'หนังสือยินยอมถึงเจ้าพนักงานที่ดิน'],
  ['w2',   'พยานหนังสือหัวกระดาษสหกรณ์ คนที่ 2', 'หนังสือยินยอมถึงเจ้าพนักงานที่ดิน'],
  ['asst', 'ผู้ช่วยผู้จัดการ (ผช.ผจก.)', 'แบบรายงานการทำนิติกรรม'],
  ['head', 'หัวหน้างาน (หงพ.)', 'บันทึกข้อความ'],
];
const LD_SIGNER_SEED = {
  co: 'นายตัวอย่าง รองประธาน', mgr: 'นายตัวอย่าง ผู้จัดการ', pw1: 'นางสาวตัวอย่าง พยานหนึ่ง', pw2: 'นางตัวอย่าง พยานสอง',
  w1: 'นายตัวอย่าง พยานสาม', w2: 'นายตัวอย่าง พยานสี่', asst: 'นางตัวอย่าง ผู้ช่วยผู้จัดการ', head: 'นายตัวอย่าง หัวหน้างาน',
};
window.laSigners = () => {
  try { const v = localStorage.getItem('la_doc_signers'); if (v) return JSON.parse(v); } catch (e) {}
  return { ...LD_SIGNER_SEED };
};
window.laSignersSave = (o) => { try { localStorage.setItem('la_doc_signers', JSON.stringify(o)); } catch (e) {} };
const ldSig = (k) => String(window.laSigners()[k] || '').trim() || '..................................................';
const LD = { coop: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด' };
LD_SIGNER_ROLES.forEach(([k]) => Object.defineProperty(LD, k, { get: () => ldSig(k), enumerable: true }));

// หน้าตั้งค่าผู้ลงนามเอกสาร (ทะเบียนผู้ลงนาม)
function LaSignerModal({ onClose }) {
  const [v, setV] = React.useState(window.laSigners);
  const save = () => { window.laSignersSave(v); onClose(true); };
  return (
    <>
      <div className="modal-backdrop" style={{ zIndex: 960 }} onClick={() => onClose(false)} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 620, zIndex: 961 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="user" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>ตั้งค่าผู้ลงนามเอกสาร</h2>
            <div className="muted" style={{ fontSize: 11 }}>ทะเบียนผู้ลงนามของเอกสารพิมพ์นิติกรรม — ตำแหน่งที่เว้นว่างจะพิมพ์เป็นจุดไข่ปลาให้เซ็นมือ</div>
          </div>
          <button className="close-btn" onClick={() => onClose(false)} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 10, maxHeight: '62vh', overflow: 'auto' }}>
          {LD_SIGNER_ROLES.map(([k, l, use]) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '230px minmax(0,1fr)', gap: 10, alignItems: 'center' }}>
              <div><div style={{ fontSize: 13 }}>{l}</div><div className="muted" style={{ fontSize: 11 }}>{use}</div></div>
              <input className="cfg-input" value={v[k] || ''} placeholder="ยังไม่กำหนด — พิมพ์เป็นจุดไข่ปลา" onChange={e => setV(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="lrq-sal-foot">
          <span className="spacer" />
          <button className="btn" onClick={() => onClose(false)}>ยกเลิก</button>
          <button className="btn primary" onClick={save}><Icon name="check" /> บันทึก</button>
        </div>
      </div>
    </>
  );
}
const LD_MONTH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const ldDots = (n) => '.'.repeat(n || 14);
const ldNum = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')) || 0;

// ── บริบทข้อมูลจากรายการนิติกรรม ─────────────────────────────────────
function ldCtx(rec) {
  const m = (window.laMemberOf && window.laMemberOf(rec.memberCode)) || {};
  const all = window.laAssetsOf ? window.laAssetsOf(rec.memberCode) : [];
  let assets = all.filter(a => (rec.assetIds || []).includes(a.id));
  if (!assets.length) assets = all.slice(0, 1);
  const parse = (loc) => { const x = String(loc || '').match(/ต\.(\S+)\s+อ\.(\S+)\s+จ\.(\S+)/) || []; return { tambon: x[1] || '', amphoe: x[2] || '', province: x[3] || '' }; };
  const a0 = assets.find(a => a.type !== 'สิ่งปลูกสร้าง') || assets[0] || {};
  const L = parse(a0.loc);
  const [y, mo, d] = String(rec.regDate || '').split('-').map(Number);
  const be = y ? (y > 2400 ? y : y + 543) : new Date().getFullYear() + 543;
  const amount = ldNum(rec.amount);
  const o = {
    rec, m, assets, a0, L, be,
    dateTh: d ? `${d} ${LD_MONTH[(mo || 1) - 1]} ${be}` : '',
    monthTh: mo ? `${LD_MONTH[mo - 1]} ${be}` : '',
    name: m.name || rec.memberCode, citizenId: m.citizenId || '', dept: m.dept || '',
    memNo: String(rec.memberCode || '').replace(/\D/g, '').padStart(6, '0').slice(-6),
    titleNos: assets.filter(a => a.type !== 'สิ่งปลูกสร้าง').map(a => a.titleNo).join(', ') || ldDots(10),
    hasBuilding: assets.some(a => a.type === 'สิ่งปลูกสร้าง'),
    isCondo: assets.some(a => a.type === 'ห้องชุด'),
    isNs3: assets.some(a => /นส|น\.ส/.test(a.type)),
    amount, amountTxt: amount ? fmt.money(amount) : '', amountWords: amount && window.bahtText ? window.bahtText(amount) : '',
    office: rec.landOffice || ldDots(30), attorney: rec.attorney || ldDots(30), attorneyId: rec.attorneyId || '',
    contractNo: rec.contractNo || '', subtype: rec.subtype || '', debts: m.debts || [],
  };
  const lands = assets.filter(a => a.type !== 'สิ่งปลูกสร้าง' && a.type !== 'ห้องชุด');
  const isTrajong = assets.some(a => /ตราจอง/.test(a.type));
  const isNs3k = assets.some(a => /3\s*ก/.test(a.type));
  const akind = o.isCondo ? 'condo' : o.isNs3 ? (isNs3k ? 'ns3k' : 'ns3') : isTrajong ? 'trajong' : 'deed';
  const titleWord = { condo: 'ห้องชุด', ns3: 'น.ส.3', ns3k: 'น.ส.3 ก.', trajong: 'โฉนดตราจอง', deed: 'โฉนด' }[akind];
  const n = Math.max(1, lands.length);
  return Object.assign(o, {
    lands, akind, isTrajong, isNs3k, titleWord, nLands: n,
    titleLbl: o.isNs3 ? titleWord + ' เลขที่' : titleWord + 'ที่',
    multiTxt: n > 1 ? 'รวม' + LD_TH_N[n] + (o.isNs3 ? 'แปลง' : titleWord) : '',
    landNos: lands.map(a => a.landNo).filter(Boolean).join(', '),
    surveyPages: lands.map(a => a.surveyPage).filter(Boolean).join(', '),
    // หลายแปลง — ค่าที่ไม่ซ้ำกันคั่นด้วยคอมม่า (ตำบล/อำเภอ/จังหวัด · ระวาง · เล่ม/หน้า · หมู่)
    L: (() => { const src = (lands.length ? lands : assets).map(a => parse(a.loc)); const u = (k) => [...new Set(src.map(x => x[k]).filter(Boolean))].join(', '); return { tambon: u('tambon'), amphoe: u('amphoe'), province: u('province') }; })(),
    rawangs: ldUq(lands.map(a => a.rawang)), volumes: lands.map(a => a.volume).filter(Boolean).join(', '),
    pages: lands.map(a => a.page).filter(Boolean).join(', '), moos: ldUq(lands.map(a => a.moo)),
    rate: rec.rate || rec.intRate || '',
    area3: ldArea(o.a0.area),
  });
}
const ldUq = (arr) => [...new Set((arr || []).filter(Boolean))].join(', ');
const LD_TH_N = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า', 'สิบ'];
function ldArea(s) {
  const t = String(s || '');
  let m = t.match(/(\d+)\s*-\s*(\d+)\s*-\s*([\d.]+)/);
  if (m) return { rai: m[1], ngan: m[2], wa: m[3] };
  const g = (re) => (t.match(re) || [])[1] || '';
  return { rai: g(/(\d+)\s*ไร่/), ngan: g(/(\d+)\s*งาน/), wa: g(/([\d.]+)\s*(?:ตาราง)?วา/) };
}

// ── ชิ้นส่วนเอกสาร ─────────────────────────────────────────────────
const ldPage = {
  width: '210mm', minHeight: '297mm', padding: '14mm 16mm', boxSizing: 'border-box', background: '#fff', color: '#111',
  boxShadow: '0 4px 20px rgba(0,0,0,.3)', margin: '0 auto 18px', fontFamily: 'Sarabun, sans-serif', fontSize: 14, lineHeight: 1.7,
  breakAfter: 'page', pageBreakAfter: 'always', position: 'relative',
};
function LdF({ w, children, left }) {
  const e = children == null || children === '';
  return <span style={{ display: 'inline-block', minWidth: w || 70, borderBottom: '1px dotted #555', padding: '0 4px', lineHeight: 1.3, textAlign: left ? 'left' : 'center' }}>{e ? '\u00a0' : children}</span>;
}
const LdP = ({ children, indent, style }) => <p style={{ margin: '0 0 3px', textIndent: indent === false ? 0 : '3em', textAlign: 'justify', textWrap: 'pretty', ...(style || {}) }}>{children}</p>;
const LdH = ({ children }) => <div style={{ margin: '4px 0 0 3em', fontWeight: 700, textDecoration: 'underline' }}>{children}</div>;
const LdRow = ({ children, style }) => <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 6px', ...(style || {}) }}>{children}</div>;
const LdGaruda = ({ size }) => (
  <div style={{ width: size || 64, height: (size || 64) * 1.1, margin: '0 auto', border: '1px dashed #bbb', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>ตราครุฑ</div>
);
const ldLand = (c) => `โฉนดที่ดินเลขที่ ${c.titleNos} เลขที่ดิน ${c.landNos || ldDots(6)} หน้าสำรวจ ${c.surveyPages || ldDots(6)} ตำบล${c.L.tambon || ldDots(10)} อำเภอ${c.L.amphoe || ldDots(10)} จังหวัด${c.L.province || ldDots(10)}`;

// บันทึกข้อความภายใน (รูปแบบเดียวกับชุดหนังสือสัญญาเงินกู้พิเศษ)
function LdMemo({ c, subject, to, children, signName, signPos, closing }) {
  return (
    <div className="spc-page" style={ldPage}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px', alignItems: 'center' }}>
        <img src={window.__resources && window.__resources.logo} alt="" style={{ width: 62, height: 62, objectFit: 'contain' }} />
        <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700 }}>บันทึกข้อความ</div><div />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', marginTop: 6 }}>
        <div><b>หน่วยงาน</b> ฝ่ายสินเชื่อ</div><div>แผนกเงินกู้พิเศษ</div><div>โทรศัพท์ 1121-1122</div>
        <div><b>ที่</b> แผนก งพ.................../{c.be}</div><div style={{ gridColumn: 'span 2' }}><b>วันที่</b> {c.dateTh || ldDots(20)}</div>
      </div>
      <div style={{ borderBottom: '1px solid #111', padding: '2px 0', marginTop: 2 }}><b>เรื่อง</b> {subject}</div>
      <div style={{ margin: '4px 0' }}><b>เรียน</b> {to || 'ปคก. ผ่าน ลคก.'}</div>
      {children}
      <P2 style={{ marginTop: 12 }}>{closing || 'จึงเรียนมาเพื่อโปรดทราบ จะขอบคุณยิ่ง'}</P2>
      <div style={{ marginLeft: '55%', marginTop: 36, textAlign: 'center', breakInside: 'avoid' }}><div>({signName || LD.mgr})</div><div>{signPos || 'ผจก.สอ.กสท.'}</div></div>
    </div>
  );
}
const P2 = LdP;

// หนังสือยินยอมถึงเจ้าพนักงานที่ดิน (หัวกระดาษสหกรณ์ ไทย/อังกฤษ)
function LdLetter({ c, subject, children, attorney, witnesses }) {
  const wit = witnesses || [LD.w1, LD.w2];
  const office = String(c.office).replace(/^สำนักงานที่ดิน/, '');
  const Sig = ({ name, role }) => (
    <div style={{ marginTop: 18 }}>
      <div>ลงชื่อ ................................................ {role || ''}</div>
      <div style={{ paddingLeft: '3.2em', marginTop: 2 }}>( {name} )</div>
    </div>
  );
  return (
    <div className="spc-page" style={ldPage}>
      <div style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: 12, alignItems: 'center', borderBottom: '1.5px solid #111', paddingBottom: 6 }}>
        <img src={window.__resources && window.__resources.logo} alt="" style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div style={{ textAlign: 'right', lineHeight: 1.35 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{LD.coop} (สอ.กสท.)</div>
          <div style={{ fontSize: 13 }}>THE COMMUNICATIONS AUTHORITY OF THAILAND SAVING AND CREDIT COOPERATIVE, LIMITED</div>
          <div style={{ fontSize: 10 }}>99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร 10210 โทรศัพท์ 0-2104-4344 โทรสาร 0-2104-4344 ต่อ 1333</div>
          <div style={{ fontSize: 10 }}>99 CHAENG WATTANA ROAD, TUNGSONGHONG, LAK SI, BANGKOK 10210 TEL.0-2104-4344 FAX.0-2104-4344 EXT.1333</div>
        </div>
      </div>
      <div style={{ marginTop: 8 }}>ที่ &nbsp; สอ.กสท.(งพ.)......../{c.be}</div>
      <div style={{ textAlign: 'center', margin: '6px 0 10px', paddingLeft: '20%' }}>{c.monthTh || ldDots(20)}</div>
      <LdRow><b>เรื่อง</b> <LdF w={420} left>{subject}</LdF></LdRow>
      <LdRow style={{ margin: '6px 0 10px' }}><b>เรียน</b> <LdF w={420} left>เจ้าพนักงานที่ดิน{office}</LdF></LdRow>
      {children}
      <LdP>เพื่อการนี้ {LD.coop} ผู้รับจำนอง ขอมอบอำนาจให้ {attorney || c.attorney} ผู้มาดำเนินการแทนจนเสร็จการ</LdP>
      <LdP style={{ marginTop: 6 }}>จึงเรียนมาเพื่อโปรดดำเนินการต่อไปด้วย จะขอบคุณยิ่ง</LdP>
      <div style={{ breakInside: 'avoid', marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, alignItems: 'start' }}>
          <div style={{ paddingLeft: '10%' }}><Sig name={LD.co} /></div>
          <div>
            <Sig name={LD.mgr} role="ผู้รับจำนอง" />
            <Sig name={wit[0]} role="พยาน" />
            <Sig name={wit[1]} role="พยาน" />
          </div>
        </div>
      </div>
    </div>
  );
}

// หนังสือมอบอำนาจ ท.ด.21 (โฉนด/โฉนดตราจอง/ห้องชุด) · ท.อ.4 (น.ส.3 / น.ส.3 ก.)
function LdPoa({ c, subject, power, variant, head, tail }) {
  const v = variant || (c.isCondo ? 'condo' : c.isNs3 ? 'ns3' : 'deed');
  const isNs3 = v === 'ns3', isCondo = v === 'condo';
  const d = c.dateTh.split(' ');
  const C3 = ({ a, b, cc }) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', alignItems: 'end' }}><span>{a}</span><span>{b}</span><span>{cc}</span></div>;
  return (
    <div className="spc-page" style={{ ...ldPage, fontSize: 13.5, lineHeight: 1.8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start' }}>
        <div style={{ fontSize: 12.5 }}>{isCondo && <>
          <div>ห้องชุดเลขที่ <LdF w={110}>{c.a0.titleNo}</LdF></div>
          <div>ชั้นที่ <LdF w={140}>{c.a0.floor || ''}</LdF></div>
          <div>อาคารเลขที่ <LdF w={110}>{c.a0.bldNo || '-'}</LdF></div>
          <div>ชื่ออาคารชุด <LdF w={110}>{c.a0.condoName || ''}</LdF></div>
          <div>ทะเบียนอาคารชุดเลขที่ <LdF w={60}>{c.a0.condoReg || ''}</LdF></div>
        </>}</div>
        <LdGaruda />
        <div style={{ textAlign: 'right', fontSize: 12.5 }}>({isNs3 ? 'ท.อ.๔' : 'ท.ด.๒๑'})</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, textDecoration: 'underline', margin: '4px 0 6px' }}>หนังสือมอบอำนาจ</div>
      {isNs3 ? (<>
        <LdRow><b>เรื่อง</b> <LdF w={250} left>{head || ('มอบอำนาจ' + subject + 'ที่ดิน ' + c.titleWord)}</LdF> เลขที่ <LdF w={90}>{c.titleNos}</LdF> เล่ม <LdF w={50}>{c.volumes}</LdF> หน้า <LdF w={50}>{c.pages}</LdF></LdRow>
        <LdRow>เลขที่ดิน <LdF w={120}>{c.landNos}</LdF> ตำบล <LdF w={130}>{c.L.tambon}</LdF> อำเภอ <LdF w={130}>{c.L.amphoe}</LdF></LdRow>
        <LdRow>จังหวัด <LdF w={300} left>{c.L.province}</LdF></LdRow>
        <LdRow>ระวางรูปถ่ายทางอากาศชื่อ <LdF w={130}>{c.a0.airName || '-'}</LdF> หมายเลข <LdF w={90}>{c.a0.airNo || '-'}</LdF> แผ่นที่ <LdF w={70}>{c.a0.airSheet || '-'}</LdF></LdRow>
        <LdRow><LdF w={600} left>{tail || ''}</LdF></LdRow>
      </>) : (<>
        <b style={{ textDecoration: 'underline' }}>ที่ดิน</b>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <LdRow>ระวาง <LdF w={220}>{c.rawangs || (isCondo ? '-' : '')}</LdF></LdRow><LdRow>ตำบล <LdF w={180}>{c.L.tambon}</LdF></LdRow>
          {isCondo
            ? <LdRow>เลขที่ <LdF w={60}>{c.landNos || '-'}</LdF> หน้าสำรวจ <LdF w={70}>{c.surveyPages || '-'}</LdF></LdRow>
            : <LdRow>เลขที่ดิน <LdF w={200}>{c.landNos}</LdF></LdRow>}
          <LdRow>อำเภอ <LdF w={180}>{c.L.amphoe}</LdF></LdRow>
          {isCondo ? <span /> : <LdRow>หน้าสำรวจ <LdF w={190}>{c.surveyPages}</LdF></LdRow>}
          <LdRow>จังหวัด <LdF w={176}>{c.L.province}</LdF></LdRow>
          <LdRow>{(isCondo ? 'โฉนด' : c.titleWord) + 'หมายเลขที่'} <LdF w={150}>{isCondo ? (c.a0.parentTitle || '') : c.titleNos}</LdF></LdRow>
        </div>
        <div style={{ width: '30%', margin: '6px auto', borderTop: '1px solid #111' }} />
        <LdRow><b>เรื่อง</b> <LdF w={600} left>{subject}</LdF></LdRow>
      </>)}
      <div style={{ paddingLeft: '45%' }}>
        <LdRow>เขียนที่ <LdF w={260}>{LD.coop}</LdF></LdRow>
        <LdRow>วันที่ <LdF w={40}>{d[0]}</LdF> เดือน <LdF w={80}>{d[1]}</LdF> พุทธศักราช <LdF w={50}>{c.be}</LdF></LdRow>
      </div>
      <LdRow style={{ paddingLeft: '18%' }}>โดยหนังสือฉบับนี้ข้าพเจ้า <LdF w={330}>{LD.coop}</LdF></LdRow>
      <div style={{ textAlign: 'center' }}>( โดย {LD.co} รองประธานกรรมการดำเนินการ และ {LD.mgr} ผู้จัดการ )</div>
      <LdRow>อายุ <LdF w={40}>-</LdF> ปี เชื้อชาติ <LdF w={60}>-</LdF> สัญชาติ <LdF w={60}>-</LdF> บุตร <LdF w={240}>-</LdF></LdRow>
      <LdRow>อยู่บ้าน <LdF w={250}>-</LdF> เลขที่ <LdF w={90}>99</LdF> หมู่ที่ <LdF w={60}></LdF></LdRow>
      <LdRow>ตำบล/แขวง <LdF w={130}>ทุ่งสองห้อง</LdF> อำเภอ/เขต <LdF w={120}>หลักสี่</LdF> จังหวัด <LdF w={140}>กรุงเทพมหานคร</LdF></LdRow>
      <LdRow>ได้มอบให้ <LdF w={220}>{c.attorney}</LdF> อายุ <LdF w={40}></LdF> ปี เชื้อชาติ <LdF w={50}>ไทย</LdF> สัญชาติ <LdF w={50}>ไทย</LdF></LdRow>
      <LdRow>บุตร <LdF w={170}></LdF> อยู่บ้าน <LdF w={110}></LdF> เลขที่ <LdF w={60}></LdF> หมู่ที่ <LdF w={40}></LdF></LdRow>
      <LdRow>ตำบล <LdF w={140}></LdF> อำเภอ <LdF w={140}></LdF> จังหวัด <LdF w={140}></LdF></LdRow>
      <LdP indent={false} style={{ marginTop: 2 }}>เป็นผู้มีอำนาจจัดการ <span style={{ borderBottom: '1px dotted #555' }}>{power}</span></LdP>
      <div style={{ breakInside: 'avoid', marginTop: 10, fontSize: 13 }}>
        <C3 a="" b="ลงลายมือชื่อ" cc="" />
        <C3 a="เพื่อเป็นหลักฐานข้าพเจ้าได้" b="พิมพ์ลายนิ้วมือ" cc="ไว้เป็นสำคัญต่อหน้าพยานแล้ว" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginTop: 14 }}>
          <span /><span>........................................<div>( {LD.co} )</div></span><span>........................................ผู้มอบอำนาจ<div>( {LD.mgr} )</div></span>
        </div>
        <C3 a="" b="ลายมือชื่อ" cc="" />
        <C3 a="ข้าพเจ้าขอรับรองว่าเป็น" b="ลายพิมพ์นิ้วมือ" cc="อันแท้จริงของผู้มอบอำนาจและ" />
        <C3 a="ลงลายมือชื่อ" b="" cc="" />
        <C3 a="ผู้มอบอำนาจได้ พิมพ์ลายนิ้วมือ" b="ต่อหน้าข้าพเจ้า" cc="" />
        <div style={{ textAlign: 'right', marginTop: 12 }}>..................................................พยาน<div style={{ paddingRight: 50 }}>( {LD.pw1} )</div></div>
        <div style={{ textAlign: 'right', marginTop: 8 }}>..................................................พยาน<div style={{ paddingRight: 50 }}>( {LD.pw2} )</div></div>
      </div>
      <div style={{ fontSize: 12, marginTop: 8 }}><b><u>หมายเหตุ</u></b> การลงลายมือชื่อหรือพิมพ์ลายนิ้วมือ ถ้าใช้อย่างใด ให้ขีดฆ่าข้อความที่ไม่ใช้ออกในกรณีพิมพ์ลายนิ้วมือให้ใช้พิมพ์ลายนิ้วแม่มือซ้าย</div>
      <div style={{ textAlign: 'right', fontSize: 12.5, textDecoration: 'underline' }}>โปรดอ่านคำเตือนด้านหลัง</div>
    </div>
  );
}

// เอกสารต่อท้ายหนังสือมอบอำนาจ (คำเตือน — ด้านหลัง)
function LdPoaWarn() {
  const items = ['ให้กรอกเครื่องหมายหนังสือสำคัญสำหรับที่ดินหรืออสังหาริมทรัพย์อย่างอื่นเช่น ตึก บ้านเรือน โรง ให้ชัดเจน',
    'ให้ระบุเรื่องและอำนาจจัดการให้ชัดเจนว่า มอบอำนาจให้ทำอะไร เช่น ซื้อ ขาย จำนอง ฯลฯ ถ้ามีเงื่อนไขพิเศษเพิ่มเติมก็ให้ระบุไว้ด้วย',
    'อย่ากรอกข้อความให้ต่างลายมือและใช้น้ำหมึกต่างสีกัน ถ้าใช้พิมพ์ดีดก็ต้องเป็นเครื่องเดียวกัน',
    'ถ้ามีรอยขูดลบ ตกเติม แก้ไข หรือขีดฆ่า ให้ระบุว่าขีดฆ่าตกเติมกี่คำ และผู้มอบอำนาจลงลายมือชื่อกำกับไว้ทุกแห่ง',
    'อย่าลงลายมือชื่อผู้มอบอำนาจก่อนกรอกข้อความโดยครบถ้วนและถูกต้องตามความประสงค์แล้ว',
    'ให้มีพยานอย่างน้อย ๑ คน ถ้าผู้มอบอำนาจพิมพ์ลายนิ้วมือต้องมีพยาน ๒ คน พยานต้องเซ็นชื่อ จะพิมพ์ลายนิ้วมือไม่ได้',
    'หนังสือมอบอำนาจทำในต่างประเทศ ควรให้สถานทูตหรือสถานกงสุล หรือโนตารีปับลิค ( Notary Public ) รับรองด้วย'];
  const th = ['๑', '๒', '๓', '๔', '๕', '๖', '๗'];
  return (
    <div className="spc-page" style={{ ...ldPage, fontSize: 15, lineHeight: 2 }}>
      <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, textDecoration: 'underline', marginTop: 40 }}>คำเตือน</div>
      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, textDecoration: 'underline', marginBottom: 24 }}>เพื่อรักษาประโยชน์ของเจ้าของที่ดินและผู้ที่เกี่ยวข้อง</div>
      {items.map((t, i) => <LdP key={i} style={{ textIndent: '6em' }}>( {th[i]} ) {t}</LdP>)}
    </div>
  );
}

// คำขอจดทะเบียนสิทธิและนิติกรรม (ท.ด.1 · ท.ด.1 ก · อ.ช.15)
const LdBox = ({ on }) => <span style={{ display: 'inline-block', width: 11, height: 11, border: '1px solid #111', margin: '0 4px 0 0', verticalAlign: '-1px', textAlign: 'center', lineHeight: '10px', fontSize: 10 }}>{on ? '✓' : ''}</span>;
const ldActName = (c) => c.rec.typeCode === 'MG' ? 'จำนองเป็นประกัน' + (c.multiTxt ? ' ' + c.multiTxt : '') : (window.laType(c.rec.typeCode).label || '');
function LdRegReq({ c }) {
  const condo = c.isCondo, ns3 = c.isNs3;
  const code = condo ? 'อ.ช.๑๕' : ns3 ? 'ท.ด.๑ ก' : 'ท.ด.๑';
  const two = { display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 };
  const coopSide = (<>
    <LdRow>๓. ข้าพเจ้า <LdF w={330} left>{LD.coop}</LdF> ผู้รับจำนอง</LdRow>
    <LdRow style={{ paddingLeft: '8%' }}>(โดย <LdF w={200}>{c.attorney}</LdF> แทน)</LdRow>
    <LdRow>อายุ <LdF w={30}>-</LdF> ปี สัญชาติ <LdF w={50}>ไทย</LdF> บิดา/มารดาชื่อ <LdF w={260}>-</LdF></LdRow>
    <LdRow><LdBox /> โสด <LdBox /> หม้าย <LdBox /> คู่สมรสชื่อ <LdF w={200}>-</LdF> สัญชาติ <LdF w={60}>-</LdF></LdRow>
    <LdRow>อยู่บ้าน/หมู่บ้าน <LdF w={70}>-</LdF> เลขที่ <LdF w={50}>99</LdF> ตรอก/ซอย <LdF w={90}>แจ้งวัฒนะ 7</LdF> ถนน <LdF w={90}>แจ้งวัฒนะ</LdF> หมู่ที่ <LdF w={30}>-</LdF></LdRow>
    <LdRow>ตำบล/แขวง <LdF w={100}>ทุ่งสองห้อง</LdF> อำเภอ/เขต <LdF w={80}>หลักสี่</LdF> จังหวัด <LdF w={110}>กรุงเทพมหานคร</LdF> โทร <LdF w={90}>0-2104-4344</LdF></LdRow>
  </>);
  return (
    <div className="spc-page" style={{ ...ldPage, fontSize: 13, lineHeight: 1.65 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'start' }}>
        <div /><LdGaruda size={56} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, fontSize: 12 }}>
          {!condo && <div style={{ lineHeight: 1.45 }}>{['ที่บ้าน', 'ที่สวน/ไร่', 'ที่นา', 'ที่..........', 'นอกเขต', 'ในเขต'].map(x => <div key={x}><LdBox />{x}</div>)}</div>}
          <div>({code})</div>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15 }}>{condo ? 'เรื่องราวขอจดทะเบียนสิทธิและนิติกรรม' : 'คำขอจดทะเบียนสิทธิและนิติกรรม'}</div>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>และการสอบสวนสิทธิใน{condo ? 'ห้องชุด' : 'ที่ดิน'} ประเภท <LdF w={240}>{ldActName(c)}</LdF></div>
      {condo ? (
        <div style={two}>
          <b style={{ textDecoration: 'underline' }}>ตำแหน่งที่ดิน</b><b style={{ textDecoration: 'underline' }}>ที่ตั้งห้องชุด</b>
          <LdRow>โฉนดที่ดินเลขที่ <LdF w={150}>{c.a0.parentTitle || ''}</LdF></LdRow><LdRow>ห้องชุดเลขที่ <LdF w={70}>{c.a0.titleNo}</LdF> ชั้นที่ <LdF w={30}>{c.a0.floor || ''}</LdF> อาคารเลขที่ <LdF w={30}>-</LdF></LdRow>
          <LdRow>ตำบล <LdF w={190}>{c.L.tambon}</LdF></LdRow><LdRow>ชื่ออาคารชุด <LdF w={170}>{c.a0.condoName || ''}</LdF></LdRow>
          <LdRow>อำเภอ <LdF w={190}>{c.L.amphoe}</LdF></LdRow><LdRow>ทะเบียนอาคารชุดเลขที่ <LdF w={110}>{c.a0.condoReg || ''}</LdF></LdRow>
          <LdRow>จังหวัด <LdF w={185}>{c.L.province}</LdF></LdRow><LdRow>เนื้อที่ประมาณ <LdF w={100}>{c.a0.area}</LdF></LdRow>
        </div>
      ) : ns3 ? (<>
        <LdRow>ก. ที่ดิน &nbsp; <LdBox on={!c.isNs3k} /> น.ส.๓ &nbsp;&nbsp; <LdBox on={c.isNs3k} /> น.ส.๓ ก. &nbsp;&nbsp; <LdBox /> อื่นๆ <LdF w={90}></LdF></LdRow>
        <div style={two}>
          <b style={{ textDecoration: 'underline' }}>ตำแหน่งที่ดิน</b><b style={{ textDecoration: 'underline' }}>ทะเบียน</b>
          <LdRow>หมู่ที่ <LdF w={180}>{c.moos}</LdF></LdRow><LdRow>เลขที่ <LdF w={190}>{c.titleNos}</LdF></LdRow>
          <LdRow>ตำบล <LdF w={180}>{c.L.tambon}</LdF></LdRow><LdRow>เล่ม <LdF w={80}>{c.volumes}</LdF> หน้า <LdF w={70}>{c.pages}</LdF></LdRow>
          <LdRow>อำเภอ <LdF w={175}>{c.L.amphoe}</LdF></LdRow><LdRow>เลขที่ดิน <LdF w={170}>{c.landNos}</LdF></LdRow>
          <LdRow>จังหวัด <LdF w={170}>{c.L.province}</LdF></LdRow><span />
        </div>
        <LdRow>ระวางรูปถ่ายทางอากาศชื่อ <LdF w={140}>{c.a0.airName || '-'}</LdF> หมายเลข <LdF w={90}>{c.a0.airNo || '-'}</LdF> แผ่นที่ <LdF w={80}>{c.a0.airSheet || '-'}</LdF></LdRow>
        <LdRow>จำนวนที่ดิน <LdF w={70}>{c.area3.rai}</LdF> ไร่ <LdF w={70}>{c.area3.ngan}</LdF> งาน <LdF w={70}>{c.area3.wa}</LdF> ตารางวา</LdRow>
        <div style={{ borderBottom: '1px dashed #555', paddingBottom: 2, marginBottom: 4 }}>ข. อสังหาริมทรัพย์อย่างอื่น</div>
      </>) : (<>
        <b style={{ textDecoration: 'underline' }}>ตำแหน่งที่ดิน</b>
        <div style={two}>
          <LdRow>ระวาง <LdF w={200}>{c.rawangs}</LdF></LdRow><LdRow>ตำบล <LdF w={180}>{c.L.tambon}</LdF></LdRow>
          <LdRow>เลขที่ดิน <LdF w={180}>{c.landNos}</LdF></LdRow><LdRow>อำเภอ <LdF w={180}>{c.L.amphoe}</LdF></LdRow>
          <LdRow>หน้าสำรวจ <LdF w={175}>{c.surveyPages}</LdF></LdRow><LdRow>จังหวัด <LdF w={176}>{c.L.province}</LdF></LdRow>
        </div>
        <b style={{ textDecoration: 'underline' }}>{c.titleWord}ที่ดิน</b>
        <LdRow>เลขที่ <LdF w={200}>{c.titleNos}</LdF> เล่ม <LdF w={110}>{c.volumes}</LdF> หน้า <LdF w={110}>{c.pages}</LdF></LdRow>
        <LdRow>จำนวนที่ดิน <LdF w={90}>{c.area3.rai}</LdF> ไร่ <LdF w={90}>{c.area3.ngan}</LdF> งาน <LdF w={90}>{c.area3.wa}</LdF> ตารางวา</LdRow>
      </>)}
      <LdP>๑. ข้าพเจ้าผู้มีนามต่อไปนี้ มีความประสงค์ขอจดทะเบียนสิทธิและนิติกรรมเกี่ยวกับ{condo ? 'ห้องชุด' : 'อสังหาริมทรัพย์'}ที่กล่าวข้างบนนี้และได้ปฏิญาณตนแล้ว ขอให้ถ้อยคำด้วยความสัตย์จริง ถ้าข้าพเจ้าให้ถ้อยคำไม่เป็นความจริงให้ใช้ถ้อยคำนี้ยันข้าพเจ้าในทางคดีอาญาได้</LdP>
      <LdRow>๒. ข้าพเจ้า <LdF w={340} left>{c.name} {c.citizenId}</LdF> ผู้จำนอง</LdRow>
      <LdRow>อายุ <LdF w={30}></LdF> ปี สัญชาติ <LdF w={50}>ไทย</LdF> บิดา/มารดาชื่อ <LdF w={260}></LdF></LdRow>
      <LdRow><LdBox /> โสด <LdBox /> หม้าย <LdBox /> คู่สมรสชื่อ <LdF w={260}></LdF></LdRow>
      <LdRow>อยู่บ้าน/หมู่บ้าน <LdF w={80}></LdF> เลขที่ <LdF w={50}></LdF> ตรอก/ซอย <LdF w={90}></LdF> ถนน <LdF w={90}></LdF> หมู่ที่ <LdF w={30}></LdF></LdRow>
      <LdRow>ตำบล/แขวง <LdF w={100}></LdF> อำเภอ/เขต <LdF w={100}></LdF> จังหวัด <LdF w={100}></LdF> โทร <LdF w={90}></LdF></LdRow>
      {coopSide}
      <LdRow style={{ marginTop: 2 }}>๔. ข้าพเจ้าขอแสดงราคา{condo ? 'ห้องชุด' : 'ทรัพย์'}ที่ขอทำนิติกรรมนี้เป็นเงิน <LdF w={160}>{c.amountTxt}</LdF> บาท</LdRow>
      <div style={{ textAlign: 'center' }}>( {c.amountWords || ldDots(30)} )</div>
      <div>๕. ข้าพเจ้าขอรับรองว่า</div>
      <div style={{ paddingLeft: '6%' }}>
        {condo ? <>
          <div>(๑) <LdBox /> ข้าพเจ้ามิได้รับโอนแทนบุคคลต่างด้าวหรือเพื่อประโยชน์แก่บุคคลต่างด้าวที่ไม่มีสิทธิถือกรรมสิทธิ์ห้องชุด</div>
          <div style={{ paddingLeft: '1.8em' }}><LdBox /> ข้าพเจ้าเป็นบุคคลต่างด้าว ขอรับโอนห้องชุดตามสิทธิใน พ.ร.บ. อาคารชุด พ.ศ. ๒๕๒๒ มาตรา ๑๙ ( )</div>
          <div>(๒) ราคาทรัพย์ที่แสดงไว้ใน ๔ เป็นราคาที่แท้จริง</div>
          <div>(๓) หนังสือรับรองรายการหนี้อันเกิดจากค่าใช้จ่ายตามมาตรา ๑๘ เป็นการถูกต้อง</div>
        </> : <>
          <div>(๑) ข้าพเจ้าไม่ได้รับโอนแทนหรือเพื่อประโยชน์แก่บุคคลต่างด้าว</div>
          <div>(๒) ราคาทรัพย์ที่แสดงไว้ใน ๔. เป็นราคาที่แท้จริง</div>
          <div>(๓) <u>สิ่งปลูกสร้างที่มีอยู่แล้วและหรือที่จะมีขึ้นในภายหน้ารวมจำนองด้วยทั้งสิ้น</u></div>
        </>}
        <LdRow>(๔) จำนองเพื่อเป็นหลักประกันเงินกู้ซึ่ง <LdF w={200}>{c.name}</LdF> ขอกู้ไปจากผู้รับจำนอง</LdRow>
        <div>(๕) ดอกเบี้ยร้อยละ {c.rate || ldDots(6)} ต่อปี กำหนดชำระเดือนละครั้งตลอดไป</div>
        <div>(๖) ให้ผู้รับจำนองเป็นผู้ถือ{condo ? 'หนังสือกรรมสิทธิ์ห้องชุด' : c.titleWord}</div>
        <div style={{ textAlign: 'justify' }}>(๗) เงื่อนไข วัตถุประสงค์ในการก่อหนี้ ลักษณะของมูลหนี้ ระยะเวลาในการก่อหนี้และข้อตกลงอื่นให้เป็นไปตามข้อตกลงต่อท้ายสัญญาจำนอง เป็นประกันที่แนบนี้และให้ถือเอาข้อตกลงต่อท้ายสัญญาจำนองเป็นประกันเป็นส่วนหนึ่งของสัญญาจำนองด้วย (จำนวน 1 แผ่น)</div>
      </div>
      <div style={{ breakInside: 'avoid' }}>
        <div style={{ textAlign: 'center', marginTop: 8 }}>วันที่..............เดือน..............................พ.ศ...................</div>
        <div style={{ paddingLeft: '30%', marginTop: 6 }}>
          <div>ลงชื่อ ..................................................ผู้ขอจำนอง</div>
          <div>ลงชื่อ ..................................................ผู้รับจำนอง <span style={{ fontSize: 12 }}>(แทนตามใบมอบลงวันที่ {c.dateTh || ldDots(14)})</span></div>
          <div>ลงชื่อ ..................................................ผู้สอบสวน</div>
          <div style={{ paddingLeft: '3em' }}>(..................................................)</div>
        </div>
      </div>
      <div style={{ breakInside: 'avoid', marginTop: 8 }}>
        <div style={{ textAlign: 'center', fontWeight: 700, textDecoration: 'underline' }}>สำหรับพนักงานเจ้าหน้าที่</div>
        <LdRow>(๑) {condo ? 'พนักงานเจ้าหน้าที่ประเมินราคาทุนทรัพย์' : 'ราคาประเมินทุนทรัพย์'} <LdF w={300}></LdF> บาท {!condo && <><LdF w={60}></LdF> สตางค์</>}</LdRow>
        {!condo && <>
          {ns3
            ? <LdRow>(๒) <LdBox /> น.ส.๓ <LdF w={80}></LdF> <LdBox /> น.ส.๓ ก. ใหม่เลขที่ <LdF w={80}></LdF> <LdBox /> อื่นๆ <LdF w={120}></LdF></LdRow>
            : <LdRow>(๒) โฉนดที่ดินใหม่ระวาง <LdF w={110}></LdF> เลขที่ดิน <LdF w={80}></LdF> หน้าสำรวจ <LdF w={80}></LdF></LdRow>}
          <LdRow style={{ paddingLeft: '2em' }}>{ns3 ? 'ทะเบียนเล่ม' : 'โฉนดที่ดินเลขที่'} <LdF w={160}></LdF> {ns3 ? '' : <>เล่ม <LdF w={80}></LdF></>} หน้า <LdF w={80}></LdF></LdRow>
          <LdRow style={{ paddingLeft: '2em' }}>จำนวนที่ดิน <LdF w={120}></LdF> ไร่ <LdF w={100}></LdF> งาน <LdF w={100}></LdF> ตารางวา</LdRow>
          <LdRow style={{ paddingLeft: '2em' }}>คงเหลือ <LdF w={135}></LdF> ไร่ <LdF w={100}></LdF> งาน <LdF w={100}></LdF> ตารางวา</LdRow>
        </>}
        <LdRow>({condo ? '๒' : '๓'}) ได้จดทะเบียนแล้วแต่วันที่ <LdF w={60}></LdF> เดือน <LdF w={120}></LdF> พ.ศ. <LdF w={60}></LdF></LdRow>
        <div style={{ textAlign: 'center', marginTop: 6 }}>ลงชื่อ ..................................................<div>(..................................................)</div><div>{condo ? 'พนักงานเจ้าหน้าที่' : 'เจ้าพนักงานที่ดิน'}</div></div>
        {!condo && <div style={{ fontSize: 12, borderTop: '1px solid #111', marginTop: 4, paddingTop: 2 }}><b><u>หมายเหตุ</u></b> ๑. ให้ทำเครื่องหมาย ✓ ใน <LdBox /> หน้าข้อความที่ต้องการ &nbsp; ๒. ให้ขีดฆ่าข้อความที่ไม่ต้องการออก</div>}
      </div>
    </div>
  );
}

// หนังสือสัญญาจำนอง ท.อ.5 (น.ส.3 / น.ส.3 ก.)
function LdMortgageNs3({ c }) {
  const S = ({ role, note }) => <div style={{ marginTop: 10 }}>(ลงลายมือชื่อ{role}) ..................................................{note && <div style={{ fontSize: 12, paddingLeft: '8em' }}>{note}</div>}</div>;
  return (<>
    <div className="spc-page" style={{ ...ldPage, fontSize: 13.5, lineHeight: 1.85 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}><div /><LdGaruda size={70} /><div style={{ textAlign: 'right' }}>(ท.อ.๕)</div></div>
      <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700, margin: '4px 0 0' }}>หนังสือสัญญาจำนอง <LdF w={220}>ที่ดินเป็นประกัน{c.multiTxt}</LdF></div>
      <div style={{ width: '32%', margin: '2px auto 8px', borderTop: '1px solid #111' }} />
      <LdRow>{c.isNs3k ? 'นส.3ก' : 'นส.3'} เลขที่ <LdF w={130}>{c.titleNos}</LdF> เล่ม <LdF w={90}>{c.volumes}</LdF> หน้า <LdF w={80}>{c.pages}</LdF> เลขที่ดิน <LdF w={80}>{c.landNos}</LdF></LdRow>
      <LdRow>ตำบล <LdF w={150}>{c.L.tambon}</LdF> อำเภอ <LdF w={150}>{c.L.amphoe}</LdF> จังหวัด <LdF w={150}>{c.L.province}</LdF></LdRow>
      <LdRow>ระวางรูปถ่ายทางอากาศชื่อ <LdF w={140}>{c.a0.airName || '-'}</LdF> หมายเลข <LdF w={90}>{c.a0.airNo || '-'}</LdF> แผ่นที่ <LdF w={90}>{c.a0.airSheet || '-'}</LdF></LdRow>
      {[0, 1, 2].map(i => <LdRow key={i}><LdF w={640}></LdF></LdRow>)}
      <LdRow style={{ paddingLeft: '18%', marginTop: 4 }}>หนังสือสัญญานี้ได้ทำเมื่อวันที่ <LdF w={60}></LdF> เดือน <LdF w={110}></LdF> พุทธศักราช <LdF w={70}></LdF></LdRow>
      <LdRow>ณ ที่ว่าการ <LdF w={540} left>{c.office}</LdF></LdRow>
      <LdParty label="ระหว่าง" lines={[c.name + ' ' + c.citizenId, '', '']} ages={['', '', '']} role="ผู้จำนอง" />
      <LdRow>บุตร <LdF w={200}></LdF> อยู่บ้าน <LdF w={120}></LdF> เลขที่ <LdF w={60}></LdF> หมู่ที่ <LdF w={40}></LdF></LdRow>
      <LdRow>ตำบล <LdF w={150}></LdF> อำเภอ <LdF w={150}></LdF> จังหวัด <LdF w={150}></LdF></LdRow>
      <LdParty label="กับ" lines={[LD.coop, '(โดย ' + c.attorney + ' แทน)', '']} ages={['', '', '']} role="ผู้รับจำนอง" />
      <LdRow>บุตร <LdF w={200}>-</LdF> อยู่บ้าน <LdF w={120}>-</LdF> เลขที่ <LdF w={60}>99</LdF> หมู่ที่ <LdF w={40}>-</LdF></LdRow>
      <LdRow>ตำบล <LdF w={150}>ทุ่งสองห้อง</LdF> อำเภอ <LdF w={150}>หลักสี่</LdF> จังหวัด <LdF w={150}>กรุงเทพมหานคร</LdF></LdRow>
      <LdP style={{ marginTop: 6 }}>ทั้งสองฝ่ายได้ตกลงสัญญากันดังต่อไปนี้</LdP>
      <LdP>ข้อ ๑. ผู้จำนองตกลงจำนอง <LdF w={180}>ที่ดินแปลง</LdF> ซึ่งกล่าวข้างบนนี้แก่ผู้รับจำนอง เป็นเงิน <LdF w={300} left>{c.amountTxt} บาท ({c.amountWords})</LdF> มีกำหนด <LdF w={40}>-</LdF> ปี นับแต่วันทำสัญญานี้โดยให้คิดดอกเบี้ย <LdF w={80}>ร้อย</LdF> ละ <LdF w={80}>{c.rate}</LdF> ต่อปี และตกลงนำส่งดอกเบี้ย <LdF w={60}>เดือนละ</LdF> ครั้งเสมอไป</LdP>
      <LdP>ข้อ ๒. ผู้รับจำนองตกลงรับจำนอง <LdF w={80}>ที่ดิน</LdF> ตามข้อตกลงในข้อ ๑ ทุกประการ</LdP>
      <LdP>ข้อ ๓. ผู้จำนองได้รับเงินซึ่งได้จำนอง <LdF w={80}>ที่ดิน</LdF> จากผู้รับจำนองเป็นการเสร็จแล้ว</LdP>
      <LdP>ข้อ ๔. <u>เงื่อนไข วัตถุประสงค์ในการก่อหนี้ ลักษณะของมูลหนี้ ระยะเวลาในการก่อหนี้ และข้อตกลงอื่น ให้เป็นไปตามข้อตกลงต่อท้ายสัญญาจำนองเป็นประกันที่แนบนี้และให้ถือเอาข้อตกลงต่อท้ายสัญญาจำนองเป็นประกันเป็นส่วนหนึ่งของสัญญาจำนองด้วย (จำนวน 1 แผ่น)</u></LdP>
      <LdP>ข้อ ๕. <u>สิ่งปลูกสร้างที่มีอยู่แล้ว และหรือที่จะมีขึ้นในภายหน้ารวมจำนองด้วยทั้งสิ้น</u></LdP>
      <LdP>ข้อ ๖. จำนองเป็นประกันเงินกู้ของ <LdF w={240}>{c.name}</LdF> ซึ่งกู้ยืมเงินจากผู้รับจำนอง</LdP>
    </div>
    <div className="spc-page" style={{ ...ldPage, fontSize: 13.5, lineHeight: 1.85 }}>
      <LdP style={{ marginTop: 20 }}>หนังสือสัญญานี้ได้ทำเป็น <u>&nbsp;สาม&nbsp;</u> ฉบับมีข้อความตรงกัน สำหรับที่ว่าการอำเภอหรือกิ่งอำเภอหนึ่งฉบับ ผู้จำนองและผู้รับจำนองถือไว้ฝ่ายละหนึ่งฉบับ (ฉบับนี้สำหรับ ..................................................)</LdP>
      <LdP>ทั้งสองฝ่ายได้ทราบและเข้าใจข้อความในหนังสือสัญญานี้ตลอดแล้ว จึงลงลายมือชื่อหรือพิมพ์ลายนิ้วมือไว้เป็นสำคัญ</LdP>
      <div style={{ paddingLeft: '22%' }}>
        <S role="ผู้จำนอง" />
        <S role="ผู้รับจำนอง" note={'(แทนตามหนังสือมอบอำนาจ ลว ' + (c.dateTh || ldDots(14)) + ')'} />
        <S role="พยาน" />
        <S role="พยาน" />
      </div>
      <div style={{ paddingLeft: '18%', marginTop: 24 }}>ลงชื่อ...............................................พนักงานเจ้าหน้าที่จดทะเบียนสิทธิและนิติกรรม</div>
      <div style={{ paddingLeft: '24%' }}>ตำแหน่ง...............................................................</div>
      <div style={{ paddingLeft: '30%' }}>ประทับตราประจำตำแหน่งเป็นสำคัญ</div>
      <div style={{ textAlign: 'right', marginTop: 14 }}>..................................................ผู้เขียน</div>
      <div style={{ textAlign: 'right' }}>..................................................ผู้ตรวจ</div>
    </div>
  </>);
}

// ปีกกา (ตามแบบฟอร์มจริง) — ใช้กับคู่สัญญา ระหว่าง / กับ
function LdBraceMark({ right }) {
  return (
    <svg viewBox="0 0 10 100" preserveAspectRatio="none" style={{ width: 9, alignSelf: 'stretch', flex: 'none', transform: right ? 'scaleX(-1)' : 'none' }} aria-hidden="true">
      <path d="M9 1 C5 1 5 4 5 10 L5 42 C5 47 4 50 1 50 C4 50 5 53 5 58 L5 90 C5 96 5 99 9 99" fill="none" stroke="#111" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
function LdBraced({ lines, w }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'stretch', gap: 3, verticalAlign: 'middle' }}>
      <LdBraceMark />
      <span style={{ display: 'grid', gap: 0, padding: '1px 0' }}>{lines.map((t, i) => <LdF key={i} w={w} left>{t}</LdF>)}</span>
      <LdBraceMark right />
    </span>
  );
}
function LdParty({ label, lines, ages, role }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0', flexWrap: 'nowrap' }}>
      <span style={{ minWidth: 44 }}>{label}</span>
      <LdBraced lines={lines} w={290} />
      <span>อายุ</span>
      <LdBraced lines={ages} w={44} />
      <span style={{ whiteSpace: 'nowrap' }}>ปี {role} สัญชาติ <LdF w={46}>ไทย</LdF></span>
    </div>
  );
}

// สัญญาจำนองหน้าแรก (ท.ด.15 ที่ดิน / อ.ช.16 ห้องชุด)
function LdMortgage({ c, condo }) {
  const what = condo ? 'ห้องชุด' : 'ที่ดิน';
  return (<>
    <div className="spc-page" style={{ ...ldPage, fontSize: 13.5 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr' }}><div /><LdGaruda size={70} /><div style={{ textAlign: 'right' }}>({condo ? 'อ.ช.๑๖' : 'ท.ด.๑๕'})</div></div>
      <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700, textDecoration: 'underline', margin: '4px 0 8px' }}>หนังสือสัญญาจำนอง{what}{!condo && c.multiTxt}</div>
      {condo ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 18 }}>
          <b style={{ textDecoration: 'underline' }}>ตำแหน่งที่ดิน</b><b style={{ textDecoration: 'underline' }}>ที่ตั้งห้องชุด</b>
          <LdRow>โฉนดที่ดินเลขที่ <LdF w={140}>{c.titleNos}</LdF></LdRow><LdRow>ห้องชุดเลขที่ <LdF w={70}>{c.a0.titleNo}</LdF> ชั้นที่ <LdF w={30}></LdF></LdRow>
          <LdRow>ตำบล <LdF w={170}>{c.L.tambon}</LdF></LdRow><LdRow>ชื่ออาคารชุด <LdF w={150}></LdF></LdRow>
          <LdRow>อำเภอ <LdF w={170}>{c.L.amphoe}</LdF></LdRow><LdRow>ทะเบียนอาคารชุดเลขที่ <LdF w={90}></LdF></LdRow>
          <LdRow>จังหวัด <LdF w={165}>{c.L.province}</LdF></LdRow><LdRow>เนื้อที่ประมาณ <LdF w={90}>{c.a0.area}</LdF></LdRow>
        </div>
      ) : (<>
        <b style={{ textDecoration: 'underline' }}>ที่ดิน</b>
        <LdRow>{c.titleLbl} <LdF w={150}>{c.titleNos}</LdF> เลขที่ดิน <LdF w={110}>{c.landNos}</LdF> หน้าสำรวจ <LdF w={110}>{c.surveyPages}</LdF></LdRow>
        <LdRow>ตำบล <LdF w={150}>{c.L.tambon}</LdF> อำเภอ <LdF w={150}>{c.L.amphoe}</LdF> จังหวัด <LdF w={150}>{c.L.province}</LdF></LdRow>
      </>)}
      <LdRow style={{ paddingLeft: '10%', marginTop: 4 }}>หนังสือสัญญานี้ได้ทำเมื่อวันที่ <LdF w={60}>{c.dateTh.split(' ')[0]}</LdF> เดือน <LdF w={110}>{c.dateTh.split(' ')[1]}</LdF> พุทธศักราช <LdF w={60}>{c.be}</LdF></LdRow>
      <LdRow>ณ <LdF w={520} left>{c.office}</LdF></LdRow>
      <LdParty label="ระหว่าง" lines={[c.name + ' ' + c.citizenId, '', '']} ages={['', '', '']} role="ผู้จำนอง" />
      <LdRow>บุตร <LdF w={200}></LdF> บ้านเลขที่ <LdF w={70}></LdF> หมู่ที่ <LdF w={40}></LdF></LdRow>
      <LdRow>ตำบล <LdF w={150}></LdF> อำเภอ <LdF w={150}></LdF> จังหวัด <LdF w={150}></LdF></LdRow>
      <LdParty label="กับ" lines={[LD.coop, '(โดย ' + c.attorney + ' แทน)', '']} ages={['', '', '']} role="ผู้รับจำนอง" />
      <LdRow>บุตร <LdF w={100}>-</LdF> อยู่ที่บ้าน <LdF w={80}>-</LdF> เลขที่ <LdF w={60}>99</LdF> หมู่ที่ <LdF w={40}>-</LdF></LdRow>
      <LdRow>ตำบล <LdF w={150}>ทุ่งสองห้อง</LdF> อำเภอ <LdF w={150}>หลักสี่</LdF> จังหวัด <LdF w={150}>กรุงเทพมหานคร</LdF></LdRow>
      <LdP style={{ marginTop: 6 }}>ทั้งสองฝ่ายได้ตกลงทำสัญญากันดังต่อไปนี้ คือ</LdP>
      <LdP>ข้อ ๑. ผู้จำนองตกลงจำนอง{what}{condo ? 'ที่กล่าวข้างบนนี้' : 'แปลงที่กล่าวข้างบนนี้ทั้งแปลง'}แก่ผู้รับจำนอง เพื่อเป็นประกันหนี้สินของ <u>{c.name}</u> ทั้งที่มีอยู่แล้วในขณะนี้หรือที่จะมีขึ้นในภายหน้าต่อผู้รับจำนอง เป็นจำนวนเงิน <u>{c.amountTxt || ldDots(14)}</u> บาท ({c.amountWords || ldDots(24)}) โดยให้ดอกเบี้ยร้อยละ{ldDots(6)}ต่อปี และตกลงนำส่งดอกเบี้ยเดือนละครั้งเสมอไป</LdP>
      <LdP>ข้อ ๒. ผู้รับจำนองตกลงรับจำนอง{what}{condo ? '' : 'แปลงนี้'} ตามข้อตกลงในข้อ ๑ ทุกประการ</LdP>
      <LdP>ข้อ ๓. ผู้จำนองได้รับเงินเป็นการเสร็จแล้ว</LdP>
      {!condo && <LdP>ข้อ ๔. สิ่งปลูกสร้างที่มีอยู่แล้ว และหรือที่จะมีขึ้นในภายหน้ารวมจำนองด้วยทั้งสิ้น</LdP>}
      <LdP>ข้อ {condo ? '๔' : '๕'}. เงื่อนไข วัตถุประสงค์ในการก่อหนี้ ลักษณะของมูลหนี้ ระยะเวลาในการก่อหนี้ และข้อตกลงอื่น ให้เป็นไปตามข้อตกลงต่อท้ายสัญญาจำนองเป็นประกันที่แนบนี้ และให้ถือเป็นส่วนหนึ่งของสัญญาจำนองนี้ด้วย จำนวน ๑ แผ่น</LdP>
      {!condo && <>
        <LdP style={{ marginTop: 6 }}>ทั้งสองฝ่ายได้ตกลงกันยอมให้ <u>ผู้รับจำนอง</u> เป็นผู้ถือโฉนดที่ดินรายนี้ในระหว่างเวลาที่ใช้สัญญาจำนองนี้</LdP>
        <LdSigBlock c={c} />
      </>}
    </div>
    {condo && (
      <div className="spc-page" style={{ ...ldPage, fontSize: 13.5 }}>
        <div style={{ textAlign: 'center' }}>- ๒ -</div>
        <LdSigBlock c={c} />
      </div>
    )}
  </>);
}
function LdSigBlock({ c }) {
  const L = ({ role, name, note }) => <div style={{ marginTop: 10 }}>(ลงลายมือชื่อ{role}).............................................. {name ? '(' + name + ')' : ''}{note && <div style={{ fontSize: 11.5, paddingLeft: '4em' }}>{note}</div>}</div>;
  return (
    <div style={{ breakInside: 'avoid' }}>
      <LdP>หนังสือสัญญานี้ได้ทำเป็นสามฉบับมีข้อความตรงกัน สำหรับสำนักงานที่ดินหนึ่งฉบับ ผู้จำนองและผู้รับจำนองถือไว้ฝ่ายละหนึ่งฉบับ (ฉบับนี้สำหรับ <u>ผู้รับจำนอง</u>)</LdP>
      <LdP>ทั้งสองฝ่ายได้ตรวจดูหนังสือสัญญาจำนองและเข้าใจข้อความตลอดแล้ว จึงได้ลงลายมือชื่อหรือพิมพ์ลายนิ้วมือไว้เป็นสำคัญต่อหน้าพยานและเจ้าพนักงานที่ดิน</LdP>
      <div style={{ paddingLeft: '22%' }}>
        <L role="ผู้จำนอง" name={c.name} />
        <L role="ผู้รับจำนอง" name={c.attorney} note={'( แทนตามใบมอบ ลงวันที่ ' + (c.dateTh || ldDots(16)) + ' )'} />
        <L role="พยาน" />
        <L role="พยาน" />
      </div>
      <div style={{ marginLeft: '45%', marginTop: 18, textAlign: 'center' }}>
        <div>..............................................(เจ้าพนักงานที่ดิน)</div>
        <div>ประทับตราประจำตำแหน่งเป็นสำคัญ</div>
        <div style={{ marginTop: 10 }}>..............................................ผู้เขียน</div>
        <div style={{ marginTop: 6 }}>..............................................ผู้ตรวจ</div>
      </div>
    </div>
  );
}

// สัญญาต่อท้ายหนังสือสัญญาจำนองเป็นประกัน (ที่ดิน / ห้องชุด)
function LdAnnex({ c, condo }) {
  const what = condo ? 'ห้องชุด' : 'ที่ดิน';
  const S = { fontSize: 11.5, lineHeight: 1.5 };
  const cl = [
    `ข้อ 2. ผู้จำนองยอมให้ผู้รับจำนองคิดเอาดอกเบี้ยในจำนวนต้นเงินทั้งสิ้น ซึ่งผู้จำนองและลูกหนี้เป็นหนี้ผู้รับจำนองและจะต้องนำส่งชำระแก่ผู้รับจำนองทุกๆ เดือนภายในวันสิ้นเดือนเสมอไป ในกรณีมีการผิดนัดค้างชำระดอกเบี้ยไม่น้อยกว่าปีหนึ่ง ผู้จำนองยอมให้ผู้รับจำนองคิดดอกเบี้ยที่ค้างนั้นทบเข้ากับเงินต้นแล้วให้คิดดอกเบี้ยในจำนวนเงินที่ทบเข้ากันนั้นก็ได้ แล้วคิดดอกเบี้ยต่อไป`,
    `ข้อ 3. ผู้จำนองสัญญาว่าในระหว่างสัญญาจำนองนี้ถ้าผู้รับจำนองเห็นว่าทรัพย์ที่จำนองนี้มีราคาตกต่ำลงไปกว่าราคาในเวลาที่ทำจำนองนี้และเรียกผู้จำนองให้เอาทรัพย์อื่นมาจำนองเพิ่มอีก ให้คุ้มพอกับจำนวนเงินที่ผู้จำนองเป็นหนี้ผู้รับจำนอง ผู้จำนองจะต้องจัดเอาทรัพย์อื่นมาทำจำนองเพิ่มอีกให้คุ้มพอกับจำนวนหนี้ที่ผู้จำนองเป็นหนี้อยู่ ถ้าผู้จำนองบิดพลิ้วไม่ยอมปฏิบัติหรือไม่สามารถปฏิบัติตามความที่กล่าวมานี้ ผู้รับจำนองมีสิทธิจะเรียกให้ผู้จำนองชำระหนี้และบังคับจำนองนั้น ผู้รับจำนองต้องมีหนังสือบอกกล่าวไปยังลูกหนี้ก่อนว่าให้ชำระหนี้ภายในเวลาอันสมควรซึ่งต้องไม่น้อยกว่าหกสิบวันนับแต่วันที่ลูกหนี้ได้รับคำบอกกล่าวนั้น ถ้าลูกหนี้ละเลยเสียไม่ปฏิบัติตามคำบอกกล่าว ผู้รับจำนองจะฟ้องคดีต่อศาลเพื่อให้พิพากษาสั่งให้ยึดทรัพย์สินซึ่งจำนองและให้ขายทอดตลาดก็ได้`,
    `ในกรณีตามวรรคหนึ่ง ถ้าเป็นกรณีผู้จำนองซึ่งจำนองทรัพย์สินของตนไว้เพื่อประกันหนี้อันบุคคลอื่นต้องชำระ ผู้รับจำนองต้องส่งหนังสือบอกกล่าวให้ผู้จำนองทราบภายในสิบห้าวันนับแต่วันที่ส่งหนังสือแจ้งให้ลูกหนี้ทราบ ถ้าผู้รับจำนองมิได้ดำเนินการภายในกำหนดเวลาสิบห้าวันนั้น ให้ผู้จำนองเช่นว่านั้นหลุดพ้นจากความรับผิดในดอกเบี้ยและค่าสินไหมทดแทนซึ่งลูกหนี้ค้างชำระ ตลอดจนค่าภาระติดพันอันเป็นอุปกรณ์แห่งหนี้รายนั้นบรรดาที่เกิดขึ้นนับแต่วันที่พ้นกำหนดเวลาสิบห้าวันดังกล่าว`,
    `ข้อ 4. ในกรณีที่ผู้จำนองตกลงจำนองเพื่อเป็นประกันหนี้ของตนเอง เมื่อถึงกาลบังคับจำนองเอาทรัพย์ที่จำนองออกขายทอดตลาดได้เงินสุทธิไม่พอชำระหนี้กับค่าอุปกรณ์ต่างๆ ดังได้กล่าวแล้วนั้นเงินยังขาดจำนวนเท่าใด หรือในกรณีผู้รับจำนองเอาทรัพย์ที่จำนองหลุดเป็นสิทธิและราคาทรัพย์ที่จำนองต่ำกว่าจำนวนหนี้กับค่าอุปกรณ์ต่างๆ ดังได้กล่าวแล้วนั้นเงินยังขาดจำนวนอยู่เท่าใด ผู้จำนองในฐานะลูกหนี้ชั้นต้นยอมชำระหนี้ที่ขาดจำนวนนั้นจากทรัพย์สินอื่นของผู้จำนองให้แก่ผู้รับจำนองจนครบ`,
    `กรณีผู้จำนองมีหนี้สินค้างชำระอยู่แก่ผู้รับจำนองหลายรายแม้ว่าผู้จำนองจะชำระหนี้จำนองรายหนึ่งรายใดครบถ้วนแล้วก็ดี ผู้รับจำนองมีสิทธิที่จะยึดหน่วงทรัพย์สินจำนองรวมทั้งเอกสารสำคัญแสดงกรรมสิทธิ์ในทรัพย์สินที่จำนองรายที่ชำระหนี้แล้วนั้นไว้ต่อไปและไม่ปลอดจำนองให้ก็ได้ และถึงแม้ว่าผู้รับจำนองจะปลอดจำนองทรัพย์สินรายใด ผู้จำนองตกลงยินยอมให้ทรัพย์สินที่ปลอดจำนองนั้นยังคงเป็นหลักประกันการชำระหนี้ที่เหลือโดยมอบให้ผู้รับจำนองยึดถือครอบครองเอกสารสำคัญแสดงกรรมสิทธิ์ไว้จนกว่าผู้จำนองจะชำระหนี้ครบถ้วนแล้ว`,
    `ข้อ 5. ในกรณีที่ผู้รับจำนองเอาทรัพย์ที่จำนองหลุดเป็นสิทธิ ถ้าปรากฏว่ามีเงินค่าภาษีอากรเกี่ยวกับทรัพย์ที่จำนองค้างชำระอยู่หรือพึงต้องชำระสำหรับระยะเวลาก่อนวันหลุดเป็นสิทธิ ผู้จำนองจะต้องเป็นผู้ชำระเงินค่าภาษีอากรนั้น ถ้าผู้รับจำนองได้ชำระไปก็ให้ถือว่าได้ชำระแทนผู้จำนอง และมีสิทธิเรียกให้ผู้จำนองชดใช้พร้อมด้วยค่าใช้จ่ายที่เสียไปในการชำระแทนนั้น`,
    `ข้อ 6. ผู้จำนองสัญญาว่า จะรักษาซ่อมแซม ตึก บ้านเรือน อาคาร โรงเรือน และสิ่งปลูกสร้างต่างๆ ตามที่มีอยู่บนที่ดินรายนี้แล้ว หรือที่จะได้ปลูกสร้างขึ้นต่อไปในภายหน้า ให้มั่นคงเรียบร้อยปกติดีอยู่เสมอ ตลอดเวลาที่จำนองไว้แก่ผู้รับจำนอง โดยผู้จำนองเสียค่ารักษาและซ่อมแซมเอง`,
    `ข้อ 7. ผู้จำนองจะต้องเอาประกันภัยสิ่งปลูกสร้างที่มีอยู่แล้วในขณะทำสัญญานี้ หรือสิ่งปลูกสร้างเพิ่มเติมในภายหน้าไว้กับบริษัทประกันภัยซึ่งผู้รับจำนองเห็นชอบ ตามจำนวนเงินเอาประกันที่ผู้รับจำนองเป็นผู้กำหนด แต่ไม่ตัดสิทธิของผู้จำนองเงินเอาประกันภัยมากกว่าจำนวนที่ผู้รับจำนองกำหนดนั้น ผู้จำนองจะต้องเสียเองทั้งสิ้น ผู้รับจำนองมีสิทธิเรียกให้ผู้จำนองระบุหรือสลักหลังกรมธรรม์ประกันภัยให้ผู้รับจำนองเป็นผู้รับประโยชน์ และผู้จำนองจะต้องมอบกรมธรรม์ประกันภัย ให้ผู้รับจำนองยึดถือไว้`,
    `ข้อ 8. ในระหว่างที่ทรัพย์สินรายนี้อยู่ในจำนองตามสัญญานี้ ผู้จำนองจะให้สิทธิประการใดๆ แก่ผู้อื่นในทรัพย์สินที่จำนองนี้ เช่นว่า เช่า ถือ อาศัย ปลูกสร้าง ทางเดิน ยืม เป็นต้น และอื่นๆ อันเป็นการเสื่อมสิทธิของผู้จำนองเองในทรัพย์สินที่จำนองนี้ ผู้จำนองต้องได้รับความยินยอมอนุญาตจากผู้รับจำนองก่อนเป็นลายลักษณ์อักษร แต่ถ้าผู้จำนองได้ให้สิทธิประการใดๆ ดังกล่าวไว้ข้างต้นนี้แก่ผู้อื่นไว้แล้วในเวลาที่ทำจำนองนี้ ผู้จำนองต้องแจ้งให้ผู้รับจำนองทราบโดยลายลักษณ์อักษรทันที และถ้าผู้จำนองจะต่ออายุสิทธิที่ได้ให้ไว้แล้วไปอีก ผู้จำนองจะต้องได้รับความยินยอมอนุญาตเป็นลายลักษณ์อักษรจากผู้รับจำนองก่อน การกระทำใดๆ ที่ผู้จำนองได้กระทำฝ่าฝืนขัดขืนต่อสัญญาข้อนี้ไม่ผูกพันผู้รับจำนอง และผู้รับจำนองมีสิทธิจะปฏิเสธการกระทำเช่นนั้นของผู้จำนองได้ ทั้งผู้รับจำนองมีสิทธิจะบอกบังคับจำนอง เพราะผู้จำนองกระทำผิดสัญญาข้อนี้ได้โดยทันที`,
    `ข้อ 9. ถ้าจะมีปัญหาเกิดขึ้นในเรื่องกรรมสิทธิ์ของผู้จำนองในทรัพย์ที่จำนองนี้เมื่อใด ผู้รับจำนองมีสิทธิจะเรียกให้ผู้จำนองชำระหนี้และบังคับจำนองนั้น ผู้รับจำนองต้องมีหนังสือบอกกล่าวไปยังลูกหนี้ก่อนว่าให้ชำระหนี้ภายในเวลาอันสมควรซึ่งต้องไม่น้อยกว่าหกสิบวันนับแต่วันที่ลูกหนี้ได้รับคำบอกกล่าวนั้น ถ้าลูกหนี้ละเลยเสียไม่ปฏิบัติตามคำบอกกล่าว ผู้รับจำนองจะฟ้องคดีต่อศาลเพื่อให้พิพากษาสั่งให้ยึดทรัพย์สินซึ่งจำนองและให้ขายทอดตลาดก็ได้ (ความในวรรคสองของข้อ 3 ให้นำมาใช้บังคับโดยอนุโลม)`,
    `ข้อ 10. ถ้าผู้จำนองประพฤติผิดหรือไม่ประพฤติตามสัญญาแม้แต่ข้อหนึ่งข้อใดหรือทั้งหมด ผู้รับจำนองมีสิทธิจะเรียกให้ผู้จำนองชำระหนี้และบังคับจำนองนั้น ผู้รับจำนองต้องมีหนังสือบอกกล่าวไปยังลูกหนี้ก่อนว่าให้ชำระหนี้ภายในเวลาอันสมควรซึ่งต้องไม่น้อยกว่าหกสิบวันนับแต่วันที่ลูกหนี้ได้รับคำบอกกล่าวนั้น ถ้าลูกหนี้ละเลยเสียไม่ปฏิบัติตามคำบอกกล่าว ผู้รับจำนองจะฟ้องคดีต่อศาลเพื่อให้พิพากษาสั่งให้ยึดทรัพย์สินซึ่งจำนองและให้ขายทอดตลาดก็ได้ (ความในวรรคสองของข้อ 3 ให้นำมาใช้บังคับโดยอนุโลม)`,
    `ข้อ 11. ค่าธรรมเนียมและค่าใช้จ่ายในการจำนองและไถ่ถอนจำนอง ผู้จำนองจะต้องเป็นผู้เสียเองทั้งสิ้น`,
    `ข้อ 12. ผู้จำนองขอรับรองว่า ผู้จำนองเป็นผู้มีภูมิลำเนาอยู่ตามที่อยู่ระบุไว้ข้างต้น ฉะนั้น คำบอกกล่าวใดๆ ไม่ว่าจะเป็นคำบอกกล่าวทวงถามหนี้ก็ดี คำบอกกล่าวเพื่อบังคับจำนองก็ดี คำบอกกล่าวอื่นใดก็ดี เมื่อผู้รับจำนองได้ส่งถึงที่อยู่ระบุไว้ข้างต้นนี้แล้ว ถึงแม้ผู้จำนองจะไม่ได้รับคำบอกกล่าวนั้นโดยตนเองก็ดี ย่อมถือว่าผู้จำนองได้รับทราบคำบอกกล่าวนั้นแล้ว ในขณะที่คำบอกกล่าวนั้นได้ส่งถึงที่อยู่ดังกล่าวข้างต้นนี้ หากผู้จำนองได้ย้ายภูมิลำเนาไปอยู่ที่อื่น เป็นหน้าที่ของผู้จำนองต้องแจ้งให้ผู้รับจำนองทราบเป็นลายลักษณ์อักษรในกรณีเช่นนี้ คำบอกกล่าวต่างๆ ที่มีถึงผู้จำนองจะได้จัดส่งไปยังภูมิลำเนาใหม่ และให้ใช้ความในวรรคก่อนนี้บังคับโดยอนุโลม`,
    `ข้อ 13. ในกรณีที่ผู้จำนองขอใช้สิทธิแจ้งเป็นหนังสือไปยังผู้รับจำนองเพื่อให้ผู้รับจำนองดำเนินการให้มีการขายทอดตลาดทรัพย์สินที่จำนองโดยไม่ต้องฟ้องเป็นคดีต่อศาล ตามประมวลกฎหมายแพ่งและพาณิชย์ มาตรา 729/1 ผู้จำนองตกลงว่าจะเป็นผู้รับผิดชอบค่าใช้จ่ายในการขายทอดตลาดทั้งสิ้น เมื่อผู้รับจำนองดำเนินการขายทอดตลาดได้แล้ว ผู้จำนองจะต้องไปดำเนินการโอนกรรมสิทธิ์ตามวันเวลาและสถานที่ที่ผู้รับจำนองมีหนังสือแจ้งไปถึงผู้จำนอง ผู้จำนองตกลงเป็นผู้รับผิดชอบค่าใช้จ่ายในการโอนกรรมสิทธิ์ทั้งสิ้น อาทิ ค่าภาษี ค่าธรรมเนียม ค่าอากร และภาษีธุรกิจเฉพาะ หากผู้จำนองไม่ไปดำเนินการดังกล่าว ผู้จำนองจะต้องรับผิดชอบต่อความเสียหายที่เกิดขึ้นทั้งสิ้นแก่ผู้รับจำนองและผู้ที่ซื้อทรัพย์จำนองได้`,
    `ข้อ 14. ถ้าข้อความใดในสัญญาฉบับนี้กลายเป็นโมฆะ ไม่ชอบด้วยกฎหมาย ไม่สมบูรณ์ หรือใช้บังคับมิได้ในประการใดๆ ตามกฎหมายให้ข้อความอื่นๆ ที่เหลืออยู่ในสัญญาฉบับนี้ยังคงชอบด้วยกฎหมาย สมบูรณ์ และใช้บังคับได้ตามกฎหมายและไม่เสื่อมเสียไปเพราะความเป็นโมฆะ ไม่ชอบด้วยกฎหมาย ไม่สมบูรณ์ หรือใช้บังคับมิได้ของข้อความหรือเอกสารดังกล่าวนั้น`,
  ];
  const half = 5;
  const Head = () => (<>
    <div style={{ textAlign: 'center' }}><img src={window.__resources && window.__resources.logo} alt="" style={{ width: 50, height: 50, objectFit: 'contain' }} /></div>
    <div style={{ textAlign: 'center', fontSize: 13 }}>สัญญาต่อท้าย</div>
    <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, borderBottom: '1px solid #111', width: '60%', margin: '0 auto 6px' }}>หนังสือสัญญาจำนอง{what}เป็นประกัน</div>
  </>);
  return (<>
    <div className="spc-page" style={{ ...ldPage, ...S, padding: '10mm 14mm' }}>
      <Head />
      {condo ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 16 }}>
          <b>ตำแหน่งที่ดิน</b><b>ที่ตั้งห้องชุด</b>
          <LdRow>โฉนดที่ดินเลขที่ <LdF w={120}>{c.titleNos}</LdF></LdRow><LdRow>ห้องชุดเลขที่ <LdF w={150}>{c.a0.titleNo}</LdF></LdRow>
          <LdRow>ตำบล <LdF w={150}>{c.L.tambon}</LdF></LdRow><LdRow>ชื่ออาคารชุด <LdF w={150}></LdF></LdRow>
          <LdRow>อำเภอ <LdF w={150}>{c.L.amphoe}</LdF></LdRow><LdRow>ทะเบียนอาคารชุดเลขที่ <LdF w={100}></LdF></LdRow>
          <LdRow>จังหวัด <LdF w={145}>{c.L.province}</LdF></LdRow><LdRow>เนื้อที่ประมาณ <LdF w={130}>{c.a0.area}</LdF></LdRow>
        </div>
      ) : (<>
        <b>ที่ดิน</b>
        <LdRow>{c.titleLbl} <LdF w={150}>{c.titleNos}</LdF> เลขที่ดิน <LdF w={110}>{c.landNos}</LdF> หน้าสำรวจ <LdF w={110}>{c.surveyPages}</LdF></LdRow>
        <LdRow>ตำบล/แขวง <LdF w={130}>{c.L.tambon}</LdF> อำเภอ/เขต <LdF w={130}>{c.L.amphoe}</LdF> จังหวัด <LdF w={130}>{c.L.province}</LdF></LdRow>
      </>)}
      <LdRow style={{ paddingLeft: '10%' }}>สัญญานี้ทำเมื่อวันที่ <LdF w={50}>{c.dateTh.split(' ')[0]}</LdF> เดือน <LdF w={90}>{c.dateTh.split(' ')[1]}</LdF> พุทธศักราช <LdF w={50}>{c.be}</LdF></LdRow>
      <LdRow>ณ สำนักงานที่ดิน <LdF w={420} left>{String(c.office).replace(/^สำนักงานที่ดิน/, '')}</LdF></LdRow>
      <LdRow>ระหว่าง <LdF w={260} left>{c.name} {c.citizenId}</LdF> อายุ <LdF w={30}></LdF> ปี สัญชาติ <LdF w={40}>ไทย</LdF> บุตร <LdF w={100}></LdF></LdRow>
      <LdRow>อยู่บ้านเลขที่ <LdF w={60}></LdF> ถนน <LdF w={110}></LdF> ตรอก/ซอย <LdF w={110}></LdF></LdRow>
      <LdRow>ตำบล/แขวง <LdF w={110}></LdF> อำเภอ/เขต <LdF w={110}></LdF> จังหวัด <LdF w={110}></LdF></LdRow>
      <LdP indent={false}>(โดย <LdF w={150}>-</LdF> เป็นผู้รับมอบอำนาจ) ซึ่งต่อไปนี้เรียกว่า “ผู้จำนอง” ฝ่ายหนึ่ง กับ {LD.coop} สัญชาติไทย สำนักงานใหญ่ตั้งอยู่บ้านเลขที่ 99 ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพมหานคร (โดย <u>{c.attorney}</u> เป็นผู้รับมอบอำนาจ) ซึ่งต่อไปนี้เรียกว่า “ผู้รับจำนอง” อีกฝ่ายหนึ่ง ทั้งสองฝ่ายได้ตกลงทำสัญญากันดังต่อไปนี้</LdP>
      <LdP>ข้อ 1. ผู้จำนองตกลงจำนองและผู้รับจำนองตกลงรับจำนอง{what}ของผู้จำนองตาม{condo ? 'หนังสือกรรมสิทธิ์ห้องชุด' : 'โฉนด'}ที่ระบุไว้ข้างต้นนี้{condo ? '' : 'พร้อมสิ่งปลูกสร้างที่มีอยู่แล้วในขณะทำสัญญานี้และที่จะมีขึ้นต่อไปภายหน้า'} ซึ่งต่อไปนี้รวมเรียกว่า <b>“ทรัพย์ที่จำนอง”</b> เพื่อเป็นประกันหนี้สินของ <u>{c.name} {c.citizenId}</u> ซึ่งต่อไปนี้จะเรียกว่า <b>“ลูกหนี้”</b> ที่ลูกหนี้เป็นหนี้ผู้รับจำนองอยู่แล้วในขณะทำสัญญานี้และจะเป็นหนี้ต่อไปภายหน้า <b>เป็นจำนวนเงินสูงสุดที่จำนอง</b> <u>{c.amountTxt || ldDots(14)}</u> บาท ({c.amountWords || ldDots(24)}) กับทั้งค่าอุปกรณ์ คือดอกเบี้ย ค่าสินไหมทดแทนในการไม่ชำระหนี้ ค่าฤชาธรรมเนียมในการบังคับจำนอง ซึ่งมี<b>วัตถุประสงค์ในการก่อหนี้</b>รายที่จำนอง <b>ลักษณะของมูลหนี้ และระยะเวลาในการก่อหนี้</b>ที่จำนองดังต่อไปนี้</LdP>
      <LdP>1.1 หนี้เงินกู้พิเศษตามระเบียบของสหกรณ์ผู้รับจำนอง ตามหนังสือสัญญากู้เงินพิเศษซึ่งลูกหนี้ได้ก่อหนี้กับผู้รับจำนองในวัตถุประสงค์เพื่อ <LdF w={200}>การเคหะสงเคราะห์</LdF> จำนวนเงิน <LdF w={110}>{c.amountTxt}</LdF> บาท (<LdF w={200}>{c.amountWords}</LdF>) มีระยะเวลาในการก่อหนี้และชำระหนี้ให้เสร็จสิ้นเป็นงวดรายเดือนนับแต่วันทำสัญญาจำนอง จำนวน <LdF w={50}></LdF> งวด</LdP>
      <LdP>1.2 หนี้เงินกู้สามัญตามระเบียบของสหกรณ์ผู้รับจำนอง ตามหนังสือสัญญาเงินกู้สามัญซึ่งลูกหนี้ได้ก่อหนี้กับผู้รับจำนองในวัตถุประสงค์เพื่อนำไปใช้ในการ อุปโภคบริโภค ในวงเงินสูงสุดไม่เกินจำนวนสามล้านบาทถ้วน มีระยะเวลาในการก่อหนี้ถึงวันที่ลูกหนี้มีอายุ 60 ปี บริบูรณ์ หรือในวันที่ลูกหนี้เกษียณอายุงาน ณ วันที่ทำสัญญานี้ลูกหนี้มีหนี้เงินกู้สามัญในวงเงินรวมทั้งสิ้น จำนวน <LdF w={110}></LdF> บาท</LdP>
      <LdP>1.3 หนี้เงินกู้เพื่อเหตุฉุกเฉินตามระเบียบของสหกรณ์ผู้รับจำนอง ตามคำขอและหนังสือสัญญากู้เงินเพื่อเหตุฉุกเฉินซึ่งลูกหนี้ได้ก่อหนี้กับผู้รับจำนองในวัตถุประสงค์เพื่อนำไปใช้ในการ อุปโภคบริโภค ในวงเงินกู้สูงสุดไม่เกินจำนวนสิบสองเท่าของเงินได้รายเดือนของลูกหนี้ มีระยะเวลาในการก่อหนี้ถึงวันที่ลูกหนี้มีอายุ 60 ปี บริบูรณ์ หรือในวันที่ลูกหนี้เกษียณอายุงาน ณ วันที่ทำสัญญานี้ลูกหนี้มีหนี้เงินกู้เพื่อเหตุฉุกเฉินในวงเงินรวมทั้งสิ้น จำนวน <LdF w={110}></LdF> บาท</LdP>
      {cl.slice(0, half).map((t, i) => <LdP key={i}>{t}</LdP>)}
    </div>
    <div className="spc-page" style={{ ...ldPage, ...S, padding: '10mm 14mm' }}>
      {cl.slice(half).map((t, i) => <LdP key={i}>{t}</LdP>)}
      <LdP>สัญญานี้ทำเป็น <u>&nbsp;สาม&nbsp;</u> ฉบับ มีข้อความตรงกัน สำหรับสำนักงานที่ดิน <u>&nbsp;หนึ่ง&nbsp;</u> ฉบับ ผู้จำนองและผู้รับจำนองรักษาไว้ฝ่ายละหนึ่งฉบับ (ฉบับนี้สำหรับ <u>ผู้รับจำนอง</u>)</LdP>
      <LdP>คู่สัญญาได้ตรวจสัญญานี้ต่อหน้าเจ้าพนักงานที่ดินและรับรองว่าถูกต้องตามความประสงค์แล้ว จึงพร้อมกันลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยานและเจ้าพนักงานที่ดิน</LdP>
      <div style={{ paddingLeft: '30%', marginTop: 8, breakInside: 'avoid', fontSize: 13 }}>
        {[['ผู้จำนอง', c.name, 'แทนตามมอบอำนาจ ลว ..................'], ['ผู้รับจำนอง', c.attorney, 'แทนตามมอบอำนาจ ลว ' + (c.dateTh || '..................')], ['พยาน', LD.head], ['พยาน', LD.w1]].map(([r, n, note], i) => (
          <div key={i} style={{ marginTop: 10 }}>ลงลายมือชื่อ..................................................{r}<div style={{ paddingLeft: '5em' }}>( {n} )</div>{note && <div style={{ paddingLeft: '3em', fontSize: 12 }}>{note}</div>}</div>
        ))}
      </div>
    </div>
  </>);
}

// แบบรายงานการทำนิติกรรม (ทำหลังสุด — รายงานผลนิติกรรมที่ดำเนินการ)
function LdCover({ c }) {
  const t = window.laType(c.rec.typeCode);
  return (
    <div className="spc-page" style={{ ...ldPage, fontSize: 15, lineHeight: 2.1 }}>
      <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700, marginTop: 10 }}>แบบรายงานการทำนิติกรรม</div>
      <div style={{ textAlign: 'right', paddingRight: '10%' }}>แผนกเงินกู้พิเศษ</div>
      <LdRow style={{ justifyContent: 'flex-end' }}>วันที่ <LdF w={40}>{c.dateTh.split(' ')[0]}</LdF> เดือน <LdF w={100}>{c.dateTh.split(' ')[1]}</LdF> พ.ศ. <LdF w={50}>{c.be}</LdF></LdRow>
      <div style={{ paddingLeft: '5%', marginTop: 8 }}>1.เรื่อง &nbsp;การทำนิติกรรม{t.label}</div>
      <div style={{ paddingLeft: '5%' }}>เรียน &nbsp;ผช.ผจก.(ส.) ผ่าน หงพ.</div>
      <LdRow style={{ paddingLeft: '12%' }}>ตามมติคณะกรรมการดำเนินการ ครั้งที่ <LdF w={70}>......../{c.be}</LdF> อนุมัติให้เงินกู้พิเศษเพื่อ <LdF w={150}>การเคหะสงเคราะห์</LdF></LdRow>
      <LdRow><LdF w={200}>({c.subtype})</LdF> ของ <LdF w={190}>{c.name}</LdF> สมาชิกเลขที่ <LdF w={70}>{c.memNo}</LdF></LdRow>
      <LdRow>สังกัด <LdF w={230}>{c.dept}</LdF> จำนวนเงิน <LdF w={170}>{c.amountTxt}</LdF> บาท</LdRow>
      <LdRow>( <LdF w={290}>{c.amountWords}</LdF> ) วงเงินจดทะเบียนจำนอง <LdF w={120}>{c.amountTxt}</LdF> บาท</LdRow>
      <LdRow style={{ paddingLeft: '12%' }}>แผนกเงินกู้พิเศษโดย <LdF w={160}>{c.attorney}</LdF> ได้ไปทำนิติกรรม{t.label} ณ สำนักงานที่ดิน</LdRow>
      <LdRow><LdF w={240}>{String(c.office).replace(/^สำนักงานที่ดิน/, '')}</LdF> เสร็จเรียบร้อยแล้ว เมื่อวันที่ <LdF w={40}>{c.dateTh.split(' ')[0]}</LdF> เดือน <LdF w={80}>{c.dateTh.split(' ')[1]}</LdF> พ.ศ. <LdF w={44}>{c.be}</LdF></LdRow>
      <div style={{ paddingLeft: '12%' }}>จึงเรียนมาเพื่อโปรดทราบ</div>
      <div style={{ marginLeft: '50%', textAlign: 'center', marginTop: 30, lineHeight: 1.6 }}><div>( {c.attorney} )</div><div>ผู้รับมอบอำนาจทำนิติกรรม{t.label}</div></div>
      <div style={{ paddingLeft: '5%', marginTop: 40 }}>2. เรียน หงพ.</div>
      <div style={{ paddingLeft: '18%' }}>ทราบแล้ว</div>
      <div style={{ width: '42%', textAlign: 'center', marginTop: 50, lineHeight: 1.6 }}><div>......................................................</div><div>({LD.asst})</div><div>ผช.ผจก.(ส)</div></div>
    </div>
  );
}

// ── ข้อความตามประเภทเอกสาร ───────────────────────────────────────────
const LD_BLD = '(หากมีสิ่งปลูกสร้างให้ระบุด้วยว่า พร้อมบ้าน/ตึก/ตึกแถว ......ชั้น ......หลัง/คูหา เลขที่ ......)';
const LD_TAIL = ' ตลอดจนให้ถ้อยคำต่างๆ ต่อพนักงานเจ้าหน้าที่';
const ldPoa = (subject, power, variant) => ({ kind: 'poa', render: (c) => <LdPoa c={c} subject={typeof subject === 'function' ? subject(c) : subject} power={typeof power === 'function' ? power(c) : power} variant={variant} /> });

function ldDebtTable(c, withInt) {
  const rows = c.debts;
  if (!rows.length) return null;
  const td = { border: '1px solid #222', padding: '0 6px' };
  const amt = (d) => d.loanAmount || d.amount || d.creditLimit || 0;
  const sum = (f) => rows.reduce((s, d) => s + (f(d) || 0), 0);
  const money = (v) => v ? fmt.money(v) : '';
  return (
    <table style={{ width: '88%', margin: '6px auto', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr>{['ลำดับที่', 'เลขที่สัญญา', 'เงินกู้ /วงเงิน', 'ผ่อนชำระ', 'เงินกู้คงเหลือ'].concat(withInt ? ['ดอกเบี้ยค้างชำระ'] : []).map(h => <th key={h} style={{ ...td, fontWeight: 600 }}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((d, i) => <tr key={i}><td style={{ ...td, textAlign: 'center' }}>{i + 1}.</td><td style={{ ...td, textAlign: 'center' }}>{d.contractNo}</td><td style={{ ...td, textAlign: 'right' }}>{money(amt(d))}</td><td style={{ ...td, textAlign: 'center' }}>{d.paidTerms != null ? d.paidTerms + '/' + d.totalTerms : ''}</td><td style={{ ...td, textAlign: 'right' }}>{fmt.money(d.principalRemaining || 0)}</td>{withInt && <td style={{ ...td, textAlign: 'right' }}>{money(d.interestDue)}</td>}</tr>)}
        <tr><td style={td} colSpan={2}>รวม</td><td style={{ ...td, textAlign: 'right' }}>{money(sum(amt))}</td><td style={td} /><td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{fmt.money(sum(d => d.principalRemaining))}</td>{withInt && <td style={{ ...td, textAlign: 'center', fontSize: 12 }}>ณ วันที่ {c.dateTh || ldDots(10)}</td>}</tr>
      </tbody>
    </table>
  );
}
// ตารางหลักประกัน (ก่อน/หลังปลอด-ไถ่ถอน) — ราคาประเมินกรอกต่อในพรีวิวได้
function ldCollTable(c, exclude) {
  const rows = c.assets.filter(a => a.type !== 'สิ่งปลูกสร้าง' && !(exclude && a.id === c.a0.id));
  const td = { border: '1px solid #222', padding: '1px 6px' };
  const bld = c.hasBuilding ? 'ที่ดินพร้อมสิ่งปลูกสร้าง' : 'ที่ดินไม่มีสิ่งปลูกสร้าง';
  return (
    <table style={{ width: '100%', margin: '6px 0 8px', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead><tr>{['ลำดับที่', 'โฉนดที่ดินเลขที่', 'เนื้อที่ (ไร่)', 'ราคาประเมิน 100 %', 'สอ.ประเมิน', 'หมายเหตุ'].map(h => <th key={h} style={{ ...td, fontWeight: 600 }}>{h}</th>)}</tr></thead>
      <tbody>
        {rows.map((a, i) => <tr key={a.id}><td style={{ ...td, textAlign: 'center' }}>{i + 1}.</td><td style={{ ...td, textAlign: 'center' }}>{a.titleNo}</td><td style={{ ...td, textAlign: 'center' }}>{a.area}</td><td style={{ ...td, textAlign: 'right' }}>{a.appraisal ? fmt.money(a.appraisal) : ''}</td><td style={{ ...td, textAlign: 'right' }}>{a.coopValue ? fmt.money(a.coopValue) : ''}</td><td style={td}>{a.note || bld}</td></tr>)}
        <tr><td style={td} colSpan={3}>รวม</td><td style={td} /><td style={td} /><td style={td} /></tr>
      </tbody>
    </table>
  );
}
const ldDebtLine = (c) => c.debts.length
  ? `มีภาระหนี้กับ${LD.coop} รวม ${c.debts.length} สัญญา ผ่อนชำระแล้วคงเหลือรวม ${fmt.money(c.debts.reduce((s, d) => s + (d.principalRemaining || 0), 0))} บาท/ไม่มีหนี้ในฐานะผู้ค้ำประกัน ดังนี้`
  : `ไม่มีภาระหนี้กับ${LD.coop}`;

const LD_DOCS = [
  { id: 'cover', label: 'แบบรายงานการทำนิติกรรม', kind: 'cover', types: ['MG', 'RD', 'RL', 'SV', 'CB', 'IS', 'SP', 'CK', 'IH', 'GF', 'SZ', 'IN'], def: () => false, render: (c) => <LdCover c={c} /> },
  // ── จดจำนอง ──
  { id: 'mg-td15', label: 'หนังสือสัญญาจำนองที่ดิน (ท.ด.15)', kind: 'legacy', types: ['MG'], def: (c) => !c.isCondo, render: (c) => <LdMortgage c={c} /> },
  { id: 'mg-annex-land', label: 'สัญญาต่อท้ายหนังสือสัญญาจำนองที่ดินเป็นประกัน', kind: 'legacy', types: ['MG'], def: (c) => !c.isCondo, render: (c) => <LdAnnex c={c} /> },
  { id: 'mg-ach16', label: 'หนังสือสัญญาจำนองห้องชุด (อ.ช.16)', kind: 'legacy', types: ['MG'], def: (c) => c.isCondo, render: (c) => <LdMortgage c={c} condo /> },
  { id: 'mg-annex-condo', label: 'สัญญาต่อท้ายหนังสือสัญญาจำนองห้องชุดเป็นประกัน', kind: 'legacy', types: ['MG'], def: (c) => c.isCondo, render: (c) => <LdAnnex c={c} condo /> },
  { id: 'poa-mg', label: 'หนังสือมอบอำนาจ — รับจำนองที่ดิน', types: ['MG'], def: (c) => !c.isCondo && !c.isNs3 && !/ลำดับ/.test(c.subtype),
    ...ldPoa(c => 'รับจำนองที่ดิน' + (c.hasBuilding ? 'พร้อมสิ่งปลูกสร้าง' : ''), c => `รับจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ ${LD_BLD} ในวงเงิน ${c.amountTxt || ldDots(10)} บาท (${c.amountWords || ldDots(16)}) อัตราดอกเบี้ยร้อยละ ${ldDots(6)} บาทต่อเดือน/ปี เป็นการประกันหนี้เงินกู้ ${c.name} และทำสัญญากู้ยืมเงิน โดยให้ถือสัญญาจำนองเป็นหลักฐานการกู้ยืมเงินด้วย` + LD_TAIL) },
  { id: 'poa-mg2', label: 'หนังสือมอบอำนาจ — จำนองลำดับที่สอง', types: ['MG'], def: (c) => /ลำดับ/.test(c.subtype),
    ...ldPoa('จำนองที่ดินลำดับที่ ...... ' + LD_BLD, c => `จำนองที่ดินลำดับที่ ...... แปลงเครื่องหมายข้างบนนี้ ${LD_BLD} กับ${LD.coop} ในวงเงิน ${c.amountTxt || ldDots(10)} บาท (${c.amountWords || ldDots(16)}) อัตราดอกเบี้ยร้อยละ ${ldDots(6)} บาทต่อเดือน/ปี เพื่อประกันหนี้เงินกู้ ${c.name} และทำสัญญากู้ยืมเงิน โดยให้ถือสัญญาจำนองเป็นหลักฐานการกู้ยืมเงินด้วย` + LD_TAIL) },
  { id: 'poa-mg-add', label: 'หนังสือมอบอำนาจ — จำนองเพิ่มหลักทรัพย์', types: ['MG'], def: (c) => /เพิ่มหลักทรัพย์/.test(c.subtype),
    ...ldPoa('จำนองเพิ่มหลักทรัพย์', c => `จำนองเพิ่มหลักทรัพย์ที่ดินแปลงเครื่องหมายข้างบนนี้ พร้อมสิ่งปลูกสร้างที่มีอยู่แล้วและหรือที่จะมีขึ้นในภายหน้าโดยไม่เพิ่มวงเงินจำนองเพื่อเป็นประกันหนี้ ซึ่งได้จดทะเบียนจำนองที่ดินโฉนดเลขที่ ${ldDots(8)} อำเภอ ${ldDots(10)} จังหวัด ${ldDots(10)} เป็นประกันไว้แล้วตามสัญญาจำนอง (ลำดับที่ ......) ฉบับลงวันที่ ${ldDots(12)} ส่วนเงื่อนไขข้อตกลงต่างๆ ให้เป็นไปตามสัญญาจำนองเดิมทุกประการ` + LD_TAIL) },
  { id: 'poa-mg-up', label: 'หนังสือมอบอำนาจ — ขึ้นเงินจากจำนอง', types: ['MG'], def: (c) => /ขึ้นเงิน/.test(c.subtype),
    ...ldPoa('ขึ้นเงินจากจำนองครั้งที่ ......', c => `ขึ้นเงินจากจำนองครั้งที่ ...... ที่ดินแปลงเครื่องหมายข้างบนนี้ ตามสัญญาจำนองฉบับลงวันที่ ${ldDots(12)} อีกจำนวน ${c.amountTxt || ldDots(10)} บาท (${c.amountWords || ldDots(16)}) รวมเป็นเงินจำนองทั้งสิ้น ${ldDots(12)} บาท (ตัวอักษร ${ldDots(16)}) เงื่อนไขข้อตกลงต่างๆ เป็นไปตามสัญญาจำนองเดิมทุกประการ` + LD_TAIL) },
  { id: 'poa-mg-pay', label: 'หนังสือมอบอำนาจ — ผ่อนต้นเงินจากจำนอง', types: ['MG'], def: (c) => /ผ่อนต้น/.test(c.subtype),
    ...ldPoa('ผ่อนต้นเงินจากจำนอง (ครั้งที่ ......)', () => `ผ่อนต้นเงินจากจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ ตามสัญญาจำนองลงวันที่ ${ldDots(12)} เป็นจำนวนเงิน ${ldDots(10)} บาท (ตัวอักษร ${ldDots(16)}) คงเหลือจำนวนเงินที่จำนอง ${ldDots(10)} บาท (ตัวอักษร ${ldDots(16)})` + LD_TAIL) },
  { id: 'poa-mg-fix', label: 'หนังสือมอบอำนาจ — แก้ไขหนี้อันจำนองเป็นประกัน', types: ['MG'], def: (c) => /แก้ไขหนี้/.test(c.subtype),
    ...ldPoa('แก้ไขหนี้อันจำนองเป็นประกัน', () => `จดทะเบียนแก้ไขหนี้อันจำนองเป็นประกันในสัญญาจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ฉบับลงวันที่ ${ldDots(12)} โดยแก้ไขอัตราดอกเบี้ยซึ่งเดิมกำหนดไว้ร้อยละ ${ldDots(6)} ต่อเดือน/ปี เป็นร้อยละ ${ldDots(6)} ต่อเดือน/ปี` + LD_TAIL) },
  { id: 'poa-condo', label: 'หนังสือมอบอำนาจ — กรรมสิทธิ์ห้องชุด', types: ['MG', 'RD'], def: (c) => c.isCondo && c.rec.typeCode === 'MG',
    ...ldPoa(c => (c.rec.typeCode === 'RD' ? 'ไถ่ถอนจากจำนอง' : 'จำนอง') + 'กรรมสิทธิ์ห้องชุด', c => (c.rec.typeCode === 'RD' ? 'ไถ่ถอนจากจำนอง' : 'จำนอง') + 'กรรมสิทธิ์ห้องชุดเครื่องหมายข้างบนนี้' + (c.rec.typeCode === 'MG' ? ` ในวงเงิน ${c.amountTxt || ldDots(10)} บาท (${c.amountWords || ldDots(16)}) เพื่อประกันหนี้เงินกู้ ${c.name}` : '') + LD_TAIL, 'condo') },
  { id: 'poa-ns3', label: 'หนังสือมอบอำนาจ — ที่ดิน น.ส.3/น.ส.3 ก. (ท.อ.4)', types: ['MG', 'RD', 'IS'], def: (c) => c.isNs3 && c.rec.typeCode === 'MG',
    ...ldPoa(c => ({ MG: 'จำนอง', RD: 'ไถ่ถอนจากจำนอง', IS: 'ยินยอมให้ออกโฉนด' })[c.rec.typeCode] || 'จำนอง', c => `${({ MG: 'จำนอง', RD: 'ไถ่ถอนจากจำนอง', IS: 'ยินยอมให้นำไปรังวัดออกโฉนด' })[c.rec.typeCode] || 'จำนอง'}ที่ดินแปลงเครื่องหมายข้างบนนี้ ${LD_BLD} ตลอดจนให้ถ้อยคำต่างๆ เกี่ยวกับเรื่องนี้ต่อพนักงานเจ้าหน้าที่`, 'ns3') },
  // ── ไถ่ถอน ──
  { id: 'poa-rd', label: 'หนังสือมอบอำนาจ — ไถ่ถอนจากจำนอง', types: ['RD'], def: (c) => !/แบ่ง|บางแปลง/.test(c.subtype) && !c.isCondo,
    ...ldPoa('ไถ่ถอนจากจำนอง', () => `ไถ่ถอนจากจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ ตามสัญญาจำนองฉบับลงวันที่ ${ldDots(12)}` + LD_TAIL) },
  { id: 'poa-rd-part', label: 'หนังสือมอบอำนาจ — แบ่งไถ่ถอนจากจำนอง', types: ['RD'], def: (c) => /แบ่ง|บางแปลง/.test(c.subtype),
    ...ldPoa('แบ่งไถ่ถอนจากจำนอง', () => `แบ่งไถ่ถอนจากจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ ตามสัญญาจำนองฉบับลงวันที่ ${ldDots(12)} เป็นเงินจำนวน ${ldDots(10)} บาท (ตัวอักษร ${ldDots(14)}) ส่วนโฉนดที่ดินเลขที่ ${ldDots(8)} อำเภอ ${ldDots(10)} ยังคงเป็นประกันหนี้ที่เหลืออยู่จำนวน ${ldDots(10)} บาท (ตัวอักษร ${ldDots(14)})` + LD_TAIL) },
  { id: 'poa-rd-free', label: 'หนังสือมอบอำนาจ — ปลอดจำนอง', types: ['RL'], def: () => true,
    ...ldPoa('ปลอดจำนอง', () => `จดทะเบียนปลอดจำนองที่ดินแปลงเครื่องหมายข้างบนนี้ ตามหนังสือสัญญาจำนองฉบับลงวันที่ ${ldDots(12)}` + LD_TAIL) },
  // ── ภาระจำยอม ──
  { id: 'poa-sv', label: 'หนังสือมอบอำนาจ — ภาระจำยอม (ตกเป็นภารยทรัพย์)', types: ['SV'], def: () => true,
    ...ldPoa('ภาระจำยอม', () => `จดทะเบียนให้โฉนดที่ดินแปลงเครื่องหมายข้างบนนี้ ตกเป็นภารยทรัพย์เรื่อง ${ldDots(12)} แก่โฉนดที่ดินเลขที่ ${ldDots(8)} ตำบลและอำเภอเดียวกัน โดยมี/ไม่มีค่าตอบแทน เป็นเงินจำนวน ${ldDots(10)} บาท (ตัวอักษร ${ldDots(14)})` + LD_TAIL) },
  { id: 'poa-sv-court', label: 'หนังสือมอบอำนาจ — ภาระจำยอม (ตามคำสั่งศาล)', types: ['SV'],
    ...ldPoa('ภาระจำยอม', () => `จดทะเบียนให้ที่ดินแปลงเครื่องหมายข้างบนนี้ เป็นสามยทรัพย์เรื่อง ${ldDots(10)} ของโฉนดที่ดินเลขที่ ${ldDots(8)} ตำบลและอำเภอเดียวกัน ตามคำสั่งศาล/คำพิพากษาศาล ${ldDots(10)} คดีหมายเลขดำที่ ${ldDots(8)} คดีหมายเลขแดงที่ ${ldDots(8)} ลงวันที่ ${ldDots(10)}` + LD_TAIL) },
  { id: 'poa-sv-part', label: 'หนังสือมอบอำนาจ — ภาระจำยอมบางส่วน', types: ['SV'],
    ...ldPoa('ภาระจำยอมบางส่วน', () => `จดทะเบียนให้ที่ดินแปลงเครื่องหมายข้างบนนี้เป็นสามยทรัพย์เรื่อง ${ldDots(10)} บางส่วนของโฉนดที่ดินเลขที่ ${ldDots(8)} ตำบลอำเภอเดียวกัน (ทางเดินกว้าง ${ldDots(6)} เมตรจากทิศ ${ldDots(6)} ไปทางทิศ ${ldDots(6)} ยาวตลอดเนื้อที่ของแปลงภารยทรัพย์/ตามรูปแผนที่สังเขปแนบท้าย) โดยมี/ไม่มีค่าตอบแทนเป็นเงินจำนวน ${ldDots(10)} บาท (ตัวอักษร ${ldDots(14)})` + LD_TAIL) },
  { id: 'poa-sv-end', label: 'หนังสือมอบอำนาจ — เลิกภาระจำยอม', types: ['SV'],
    ...ldPoa('เลิกภาระจำยอม', () => `จดทะเบียนเลิกภาระจำยอมที่ดินแปลงเครื่องหมายข้างบนนี้ ที่ได้จดทะเบียนไว้ตามบันทึกข้อตกลง ลงวันที่ ${ldDots(12)}` + LD_TAIL) },
  { id: 'poa-sv-public', label: 'หนังสือมอบอำนาจ — แบ่งหักเป็นที่สาธารณประโยชน์', types: ['SV'],
    ...ldPoa('แบ่งหักเป็นที่สาธารณประโยชน์', () => `ขอรังวัดแบ่งที่ดินแปลงเครื่องหมายดังกล่าวข้างบนนี้เป็นที่สาธารณประโยชน์ (ถนน/ซอย คลอง ${ldDots(8)}) นำช่างทำการรังวัดปักหลักเขตและรับรองแนวเขตที่ดิน ถ้ารังวัดได้รูปแผนที่หรือเนื้อที่ต่างจากเดิม ให้มีอำนาจยินยอมให้แก้รูปแผนที่ เนื้อที่ให้ถูกต้องตามความเป็นจริง แก้คำขอ (ถ้ามี) จดทะเบียนแบ่งหักเป็นที่สาธารณประโยชน์ วางและรับเงินมัดจำรังวัดที่เหลือคืน รับโฉนดที่ดิน` + LD_TAIL) },
  { id: 'lt-sv-public', label: 'หนังสือรับทราบผลการรังวัด และปลอดจำนองแปลงแบ่งหักเป็นที่สาธารณประโยชน์', kind: 'letter', types: ['SV'],
    render: (c) => <LdLetter c={c} subject="รับทราบผลการรังวัด และปลอดจำนองแปลงแบ่งหักเป็นที่สาธารณประโยชน์ (ทางสาธารณประโยชน์)" attorney={c.attorney} witnesses={[LD.head, LD.w1]}>
      <LdP>ด้วย{LD.coop} ได้รับหนังสือแจ้งจาก{c.office} ที่ {ldDots(14)} ลว.{ldDots(14)} เรื่องแจ้งผลการรังวัดและแบ่งหักเป็นที่สาธารณประโยชน์ (ทางสาธารณประโยชน์) ตามที่{c.name} ได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} นั้น เพื่อให้ผู้รับจำนองได้รับทราบผลการรังวัดและดำเนินการยินยอมให้แก้ไขเนื้อที่ โดยให้ที่ดินแปลงที่แบ่งหักเป็นที่สาธารณประโยชน์ (ทางสาธารณประโยชน์) ปลอดภาระการจำนอง ส่วนที่ดินแปลงคงเหลือยังคงติดภาระการจำนองต่อไปตามเดิม พร้อมทั้งนำโฉนดที่ดินมาแก้ไขเนื้อที่ โดยให้ที่ดินแปลงที่แบ่งหักเป็นที่สาธารณประโยชน์ (ทางสาธารณประโยชน์) ปลอดภาระการจำนอง</LdP>
      <LdP>สหกรณ์ฯ ในฐานะผู้รับจำนองได้รับทราบและยินยอมให้ผู้จำนองดำเนินการดังกล่าวได้ตามความประสงค์ แก้ไขเนื้อที่ โดยให้ที่ดินแปลงที่แบ่งหักเป็นที่สาธารณประโยชน์ (ทางสาธารณประโยชน์) ปลอดภาระการจำนอง ส่วนที่ดินแปลงคงเหลือยังคงติดภาระการจำนองต่อไปตามเดิม</LdP>
    </LdLetter> },
  // ── รวมโฉนด ──
  { id: 'poa-cb', label: 'หนังสือมอบอำนาจ — รวมโฉนดที่ดิน', types: ['CB'], def: () => true,
    ...ldPoa('รวมโฉนดที่ดิน', () => `ขอรังวัดรวมโฉนดที่ดินแปลงเครื่องหมายข้างบนนี้ นำช่างรังวัดปักหลักเขตที่ดินและรับรองแนวเขตที่ดิน ถ้าทำการรังวัดได้รูปแผนที่หรือเนื้อที่ต่างจากเดิมให้มีอำนาจยินยอมให้แก้รูปแผนที่เนื้อที่ให้ถูกต้องตามความเป็นจริง แก้คำขอ (ถ้ามี) วางและรับเงินมัดจำที่เหลือคืน รับโฉนดที่ดิน` + LD_TAIL) },
  // ── ออกโฉนด ──
  { id: 'lt-is', label: 'หนังสือยินยอมให้นำ น.ส.3 ก ไปรังวัดออกโฉนดระหว่างจำนอง', kind: 'letter', types: ['IS'], def: () => true,
    render: (c) => <LdLetter c={c} subject="ยินยอมให้นำ น.ส.3 ก ไปรังวัดออกโฉนดระหว่างจำนอง">
      <LdP>ตามที่{c.name} ได้จำนองที่ดิน น.ส.3 ก เลขที่ {c.titleNos} เลขที่ดิน {c.landNos || ldDots(6)} ตำบล{c.L.tambon} อำเภอ{c.L.amphoe} จังหวัด{c.L.province} ไว้กับ{LD.coop} บัดนี้ผู้จำนองมีความประสงค์จะขอยืม น.ส.3 ก แปลงดังกล่าวข้างต้นไปรังวัดออกโฉนดระหว่างจำนอง</LdP>
      <LdP>สหกรณ์ฯ ในฐานะผู้รับจำนองได้ทราบและยินยอมให้ผู้จำนองดำเนินการดังกล่าวได้ตามความประสงค์ ถ้าทำการรังวัดแล้วได้แผนที่หรือเนื้อที่ลดลงจากเดิม กรุณาแจ้งสหกรณ์ฯ ก่อน หากเนื้อที่ไม่ลดลงจากเดิม สหกรณ์ฯ ยินยอมให้แก้ไขรูปแผนที่เพื่อให้ถูกต้องได้ ทั้งนี้โดยให้ที่ดินแปลงดังกล่าวที่จะออกโฉนดยังคงครอบภาระจำนองอยู่กับ{LD.coop} ผู้รับจำนองตามเดิม หากทางสำนักงานที่ดินได้ดำเนินการรังวัดออกโฉนดเรียบร้อยแล้วขอได้โปรดแจ้งเป็นหนังสือให้สหกรณ์ฯ ทราบด้วย</LdP>
    </LdLetter> },
  // ── แบ่งแยกโฉนด ──
  { id: 'memo-sp', label: 'บันทึกข้อความ — จดทะเบียนแบ่งแยกกรรมสิทธิ์รวมระหว่างจำนอง', kind: 'memo', types: ['SP'], def: () => true,
    render: (c) => <LdMemo c={c} subject="จดทะเบียนแบ่งแยกกรรมสิทธิ์รวมระหว่างจำนอง">
      <LdH>เรื่องเดิม</LdH>
      <LdP>ด้วย{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} {ldDebtLine(c)}</LdP>
      {ldDebtTable(c)}
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>{c.name} ได้รับอนุมัติเงินกู้พิเศษเพื่อการเคหะสงเคราะห์ จำนวนเงินขอกู้ {c.amountTxt || ldDots(10)} บาท ({c.amountWords || ldDots(14)}) ในการประชุม คสอ.ครั้งที่ ......../........ โดยใช้หลักทรัพย์ค้ำประกัน {ldLand(c)} เนื้อที่ {c.a0.area || ldDots(8)} ผู้ถือกรรมสิทธิ์</LdP>
      <LdP>ตามมติ คสอ.กสท.ครั้งที่ ......../........ ยินยอมให้{c.name} ยื่นขอรังวัดแบ่งกรรมสิทธิ์ระหว่างจำนอง นั้น บัดนี้ฝ่ายจัดการได้รับหนังสือแจ้งจาก{c.office} หนังสือแจ้งที่ {ldDots(14)} เรื่องให้ไปดำเนินการจดทะเบียนแบ่งกรรมสิทธิ์รวมระหว่างจำนอง <b><u>ซึ่งผลการรังวัดแบ่งกรรมสิทธิ์ระหว่างจำนองได้เนื้อที่ {ldDots(10)} และได้จดทะเบียนเรียบร้อยแล้ว</u></b></LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>เพื่อโปรดทราบผลการจดทะเบียนแบ่งแยกกรรมสิทธิ์รวมระหว่างจำนอง {ldLand(c)} ซึ่งที่ดินแปลงดังกล่าวยังคงครอบภาระจำนองอยู่กับสหกรณ์ฯ ตามเดิม</LdP>
    </LdMemo> },
  { id: 'lt-sp-name', label: 'หนังสือยินยอมให้จดทะเบียนแบ่งแยกในนามเดิม', kind: 'letter', types: ['SP'], def: (c) => /นามเดิม/.test(c.subtype),
    render: (c) => <LdLetter c={c} subject="ยินยอมให้จดทะเบียนแบ่งแยกในนามเดิม">
      <LdP>ตามที่{c.name} ได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} บัดนี้{LD.coop} ในฐานะผู้รับจำนองได้รับหนังสือแจ้งจาก{c.office} ให้ไปดำเนินการจดทะเบียนแบ่งแยกในนามเดิมระหว่างจำนอง สหกรณ์ฯ ยินยอมให้ดำเนินการจดทะเบียนแบ่งแยกในนามเดิมได้ตามความประสงค์ ทั้งนี้โดยให้ที่ดินแปลงดังกล่าวยังคงครอบภาระจำนองอยู่กับ{LD.coop}</LdP>
    </LdLetter> },
  { id: 'lt-sp-co', label: 'หนังสือยินยอมให้จดทะเบียนแบ่งกรรมสิทธิ์รวม (ครอบจำนอง)', kind: 'letter', types: ['SP'],
    render: (c) => <LdLetter c={c} subject="ยินยอมให้จดทะเบียนแบ่งกรรมสิทธิ์รวม (ครอบจำนอง)">
      <LdP>ตามที่{c.name} ได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} บัดนี้{LD.coop} ในฐานะผู้รับจำนองได้รับหนังสือแจ้งให้ไปดำเนินการจดทะเบียนแบ่งกรรมสิทธิ์รวม (ครอบจำนอง) สหกรณ์ฯ ยินยอมให้ดำเนินการจดทะเบียนแบ่งกรรมสิทธิ์รวมได้ตามความประสงค์ ทั้งนี้โดยให้ที่ดินแปลงดังกล่าวยังคงครอบภาระจำนองอยู่กับ{LD.coop}</LdP>
    </LdLetter> },
  { id: 'lt-sp-notify', label: 'หนังสือจดทะเบียนแบ่งแยกในนามเดิมระหว่างจำนอง (ได้รับแจ้งจากสำนักงานที่ดิน)', kind: 'letter', types: ['SP'],
    render: (c) => <LdLetter c={c} subject="จดทะเบียนแบ่งแยกในนามเดิมระหว่างจำนอง">
      <LdP>ด้วย{LD.coop} ได้รับหนังสือแจ้งจาก{c.office} ที่ {ldDots(12)} ลงวันที่ {ldDots(12)} เรื่องขอให้ไปดำเนินการเรื่องจดทะเบียนแบ่งแยกในนามเดิม (ระหว่างจำนอง) {c.name} ผู้จำนอง ซึ่งได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} นั้น เพื่อให้ผู้รับจำนองได้รับทราบผลการรังวัดและดำเนินการยินยอมให้จดทะเบียนการรังวัดแบ่งแยกในนามเดิมระหว่างจำนองแปลงดังกล่าว พร้อมทั้งนำโฉนดที่ดินมาจดทะเบียนแบ่งแยกในนามเดิมระหว่างจำนอง</LdP>
      <LdP>สหกรณ์ฯ ในฐานะผู้รับจำนองรับทราบและยินยอมให้ผู้จำนองดำเนินการดังกล่าวได้ตามความประสงค์ จดทะเบียนแบ่งแยกในนามเดิมระหว่างจำนองต่อไป</LdP>
    </LdLetter> },
  { id: 'poa-sp', label: 'หนังสือมอบอำนาจ — แบ่งกรรมสิทธิ์รวม', types: ['SP'],
    ...ldPoa('แบ่งกรรมสิทธิ์รวม', () => `ขอรังวัดแบ่งกรรมสิทธิ์รวมที่ดินแปลงเครื่องหมายข้างบนนี้ นำช่างทำการรังวัดปักหลักเขตและรับรองแนวเขตที่ดิน ถ้าทำการรังวัดได้รูปแผนที่หรือเนื้อที่ต่างจากเดิมให้มีอำนาจยินยอมให้แก้รูปแผนที่เนื้อที่ให้ถูกต้องตามความเป็นจริง แก้คำขอ (ถ้ามี) จดทะเบียนแบ่งกรรมสิทธิ์รวม วางและรับเงินมัดจำรังวัดที่เหลือคืน รับโฉนดที่ดิน` + LD_TAIL) },
  // ── สอบโฉนด / รังวัดสอบเขต ──
  { id: 'memo-ck-req', label: 'บันทึกข้อความ — ขออนุญาตรังวัดสอบเขตที่ดินระหว่างจำนอง', kind: 'memo', types: ['CK'], def: () => true,
    render: (c) => <LdMemo c={c} subject="ขออนุญาตรังวัดสอบเขตที่ดินระหว่างจำนอง">
      <LdH>เรื่องเดิม</LdH>
      <LdP>ด้วย{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} {ldDebtLine(c)}</LdP>
      {ldDebtTable(c)}
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>{c.name} ได้รับอนุมัติเงินกู้พิเศษเพื่อการเคหะสงเคราะห์ จำนวนเงินให้กู้ {c.amountTxt || ldDots(10)} บาท ({c.amountWords || ldDots(14)}) ในการประชุม คสอ.กสท.ครั้งที่ ......../........ โดยใช้หลักทรัพย์ค้ำประกัน {ldLand(c)} เนื้อที่ {c.a0.area || ldDots(8)}</LdP>
      <LdP>บัดนี้{c.name} มีความประสงค์ขออนุญาตผู้รับจำนองเพื่อสอบเขตที่ดินระหว่างจำนอง{ldLand(c)} โดยมีวัตถุประสงค์เพื่อต้องการทราบแนวเขตที่ดินที่แท้จริงและล้อมรั้วที่ดินต่อไป</LdP>
      <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
      <LdP>ฝ่ายจัดการพิจารณาแล้วเห็นควรให้ผู้กู้ดำเนินการได้ตามความประสงค์เนื่องจากจะได้ทราบแนวเขตที่ดินและมีความชัดเจนในการล้อมรั้วรอบแนวเขตที่ดิน เพื่อจะได้ไม่รุกล้ำที่ดินแปลงข้างเคียง ไม่ทำให้ผู้รับจำนองเสียหายแต่ประการใด กรณีสอบเขตที่ดินระหว่างจำนองได้เนื้อที่ลดลงจากเดิมผู้กู้ยินยอมปฏิบัติตามเงื่อนไขของผู้รับจำนองและยินยอมรับผิดชอบค่าใช้จ่ายต่างๆ เองทั้งสิ้น</LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>1.เสนอเพื่อพิจารณาอนุญาตให้{c.name} ยื่นขอรังวัดสอบเขตที่ดินระหว่างจำนองได้</LdP>
      <LdP>2.เสนอเพื่อยินยอมรับทราบผลการรังวัดฯ และจดทะเบียนรับทราบผลการรังวัดสอบเขตกรณีทราบผลการรังวัดได้เนื้อที่เท่าเดิม และรายงาน คก.และ คสอ.เพื่อทราบต่อไป</LdP>
      <LdP>3.กรณีผลการรังวัดสอบเขตที่ดินระหว่างจำนอง ได้เนื้อที่น้อยกว่าเดิมจะนำมาเสนอ คก.และ คสอ.เพื่อพิจารณาต่อไป</LdP>
    </LdMemo> },
  ...[['memo-ck-res', 'ปคก. ผ่าน ลคก.', LD.mgr, 'ผจก.สอ.กสท.', ' (เสนอ ปคก.)'], ['memo-ck-res2', 'ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส)', LD.head, 'หงพ.', ' (เสนอ ผจก.)']].map(([id, to, sn, sp, tag]) => ({
    id, label: 'บันทึกข้อความ — รับทราบผลการรังวัดสอบเขตที่ดินระหว่างจำนอง' + tag, kind: 'memo', types: ['CK'],
    render: (c) => <LdMemo c={c} subject="รับทราบผลการรังวัดสอบเขตที่ดินระหว่างจำนอง" to={to} signName={sn} signPos={sp}>
      <LdH>เรื่องเดิม</LdH>
      <LdP>ตามที่{c.name} สมาชิกเลขที่ {c.memNo} ได้ยื่นขอรังวัดสอบเขตที่ดินระหว่างจำนอง{ldLand(c)} เนื้อที่ {c.a0.area || ldDots(8)} ซึ่ง คสอ.กสท.ได้พิจารณาอนุญาตแล้วในการประชุมครั้งที่ ......../........ เมื่อวันที่ {ldDots(14)} นั้น</LdP>
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>{c.name} ได้รับอนุมัติเงินกู้พิเศษเพื่อการเคหะสงเคราะห์ จำนวนเงินให้กู้ {c.amountTxt || ldDots(10)} บาท ({c.amountWords || ldDots(14)}) โดยใช้หลักทรัพย์ค้ำประกัน {ldLand(c)}</LdP>
      <LdP>ตามมติ คสอ.กสท.ครั้งที่ ......../........ ยินยอมให้{c.name} ยื่นขอรังวัดสอบเขตที่ดินระหว่างจำนอง นั้น บัดนี้แผนกเงินกู้พิเศษได้รับหนังสือแจ้งจาก{c.office} หนังสือแจ้งที่ {ldDots(14)} เรื่องขอให้ไปดำเนินการเรื่องรังวัดสอบเขต (ระหว่างจำนอง) <b><u>ซึ่งผลการรังวัดสอบเขตได้เนื้อที่ {ldDots(14)} และได้ดำเนินการจดทะเบียนรับทราบผลการรังวัดและแก้ไขเนื้อที่ถูกต้องแล้วตามผลการรังวัด</u></b></LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>เพื่อโปรดทราบผลการรังวัดสอบเขตที่ดินระหว่างจำนองดังกล่าว ซึ่งที่ดินแปลงดังกล่าวยังคงครอบภาระจำนองอยู่กับสหกรณ์ฯ ตามเดิม</LdP>
    </LdMemo>,
  })),
  { id: 'lt-ck', label: 'หนังสือยินยอมให้รังวัดสอบเขตที่ดินระหว่างจำนอง', kind: 'letter', types: ['CK'], def: () => true,
    render: (c) => <LdLetter c={c} subject="ยินยอมให้รังวัดสอบเขตที่ดินระหว่างจำนอง">
      <LdP>ด้วย{c.name} ได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} บัดนี้ผู้จำนองมีความประสงค์ขอรังวัดสอบเขตที่ดินในระหว่างจำนอง</LdP>
      <LdP>สหกรณ์ฯ ในฐานะผู้รับจำนองได้รับทราบและยินยอมให้ผู้จำนองดำเนินการดังกล่าวได้ตามความประสงค์ ถ้าทำการรังวัดสอบเขตที่ดินแล้วได้รูปแผนที่หรือเนื้อที่ลดลงจากเดิม กรุณาแจ้งสหกรณ์ฯ ก่อน หากเนื้อที่ไม่ลดลงจากเดิม สหกรณ์ฯ ยินยอมให้แก้ไขรูปแผนที่เพื่อให้ถูกต้องโดยให้ที่ดินแปลงดังกล่าวยังคงครอบภาระจำนองอยู่กับ{LD.coop} ผู้รับจำนองตามเดิม หากทางสำนักงานที่ดินได้ดำเนินการรังวัดสอบเขตที่ดินเรียบร้อยแล้วได้โปรดแจ้งเป็นหนังสือให้สหกรณ์ฯ ทราบด้วย</LdP>
    </LdLetter> },
  { id: 'lt-ck-res', label: 'หนังสือรับทราบผลการรังวัดสอบเขตที่ดินระหว่างจำนอง', kind: 'letter', types: ['CK'],
    render: (c) => <LdLetter c={c} subject="รับทราบผลการรังวัดสอบเขตที่ดินระหว่างจำนอง">
      <LdP>ด้วย{LD.coop} ได้รับแจ้งจาก{c.name} ผู้จำนอง ซึ่งได้จำนอง{ldLand(c)} ไว้กับ{LD.coop} ว่าให้ผู้รับจำนองรับทราบผลการรังวัดสอบเขตที่ดินแปลงดังกล่าวพร้อมทั้งนำโฉนดที่ดินมาจดทะเบียนแก้ไขเนื้อที่, ข้างเคียง, หมายเลขหลักเขต, เครื่องหมายที่ดินให้เป็นระบบยู.ที.เอ็ม., เขตการปกครอง, เลขหน้าสำรวจ, หมายเลขโฉนดที่ดิน</LdP>
      <LdP>สหกรณ์ฯ ในฐานะผู้รับจำนองรับทราบและยินยอมให้ผู้จำนองดำเนินการดังกล่าวได้ตามความประสงค์ แก้ไขเนื้อที่ ข้างเคียง หมายเลขหลักเขต เครื่องหมายที่ดินให้เป็นระบบยู.ที.เอ็ม. เขตการปกครอง เลขหน้าสำรวจและหมายเลขโฉนดที่ดินให้ถูกต้องต่อไป</LdP>
    </LdLetter> },
  { id: 'poa-ck', label: 'หนังสือมอบอำนาจ — สอบเขตที่ดิน', types: ['CK'],
    ...ldPoa('สอบเขตที่ดิน', () => `ขอรังวัดสอบเขตที่ดินแปลงเครื่องหมายข้างบนนี้ นำช่างทำการรังวัดปักหลักเขตที่ดินและรับรองแนวเขตที่ดิน ถ้าทำการรังวัดแล้วได้รูปแผนที่หรือเนื้อที่ต่างจากเดิม ให้มีอำนาจยินยอมให้แก้รูปแผนที่เนื้อที่หมายเลขหลักเขตในโฉนดที่ดินให้ถูกต้องตรงตามความเป็นจริง แก้คำขอ (ถ้ามี) วางและรับเงินมัดจำรังวัดที่เหลือคืน รับโฉนดที่ดิน` + LD_TAIL) },
  // ── รับมรดกระหว่างจำนอง ──
  { id: 'lt-ih', label: 'หนังสือยินยอมให้จดทะเบียนผู้จัดการมรดกเฉพาะส่วน รับมรดกเฉพาะส่วนระหว่างจำนอง', kind: 'letter', types: ['IH'], def: () => true,
    render: (c) => <LdLetter c={c} subject="ยินยอมให้จดทะเบียนผู้จัดการมรดกเฉพาะส่วน รับมรดกเฉพาะส่วนและให้ที่ดินเฉพาะส่วนระหว่างจำนอง">
      <LdP>ตามที่{c.name} ได้จำนอง{ldLand(c)} เพื่อเป็นหลักประกันเงินกู้ซึ่ง{c.name} ได้กู้เงินจาก{LD.coop} นั้น</LdP>
      <LdP>บัดนี้ {ldDots(24)} (ผู้จัดการมรดกเฉพาะส่วนของ {ldDots(20)}) มีความประสงค์ขอเป็นผู้จัดการมรดกเฉพาะส่วนระหว่างจำนอง</LdP>
      <LdP>{LD.coop} ในฐานะผู้รับจำนองได้ทราบและยินยอมให้ {ldDots(20)} (ผู้จัดการมรดกเฉพาะส่วน) ดำเนินการจดทะเบียนผู้จัดการมรดกเฉพาะส่วนและโอนมรดกเฉพาะส่วนให้แก่ {ldDots(20)} ระหว่างจำนองโดยรับภาระหนี้จำนองส่วนภาระหนี้ยังคงเดิม <b>โดยมอบหมายให้{LD.head} เป็นผู้ถือโฉนดที่ดินไปดำเนินการ</b></LdP>
    </LdLetter> },
  { id: 'poa-ih', label: 'หนังสือมอบอำนาจ — รับโอนมรดกที่ดิน', types: ['IH'],
    ...ldPoa('รับโอนมรดกที่ดิน ' + LD_BLD, () => `รับโอนมรดกที่ดินแปลงเครื่องหมายข้างบนนี้ ${LD_BLD}` + LD_TAIL) },
  { id: 'poa-ih-mgr', label: 'หนังสือมอบอำนาจ — รับโอนมรดกที่ดิน (จากผู้จัดการมรดก)', types: ['IH'],
    ...ldPoa('รับโอนมรดกที่ดิน ' + LD_BLD, () => `รับโอนมรดกที่ดินแปลงเครื่องหมายข้างบนนี้ ${LD_BLD} จากนาย/นาง/นางสาว ${ldDots(16)} ผู้จัดการมรดก นาย/นาง/นางสาว ${ldDots(16)} ตามพินัยกรรม/คำสั่งศาล ${ldDots(10)} คดีหมายเลขแดงที่ ${ldDots(8)} ลงวันที่ ${ldDots(10)}` + LD_TAIL) },
  { id: 'poa-ih-reg', label: 'หนังสือมอบอำนาจ — ผู้จัดการมรดก', types: ['IH'],
    ...ldPoa('ผู้จัดการมรดก', () => `จดทะเบียนลงชื่อผู้จัดการมรดกในโฉนดที่ดินแปลงเครื่องหมายข้างบนนี้ โดยพินัยกรรม/คำสั่งศาล ${ldDots(10)} คดีหมายเลขแดงที่ ${ldDots(8)} ลงวันที่ ${ldDots(10)}` + LD_TAIL) },
  // ── รับให้ระหว่างจำนอง ──
  { id: 'poa-gf', label: 'หนังสือมอบอำนาจ — รับให้ที่ดิน', types: ['GF'], def: () => true,
    ...ldPoa('รับให้ที่ดิน ' + LD_BLD, () => `รับให้ที่ดินแปลงเครื่องหมายข้างบนนี้ ${LD_BLD} จากนาย/นาง/นางสาว ${ldDots(16)} โดยเสน่หาไม่มีค่าตอบแทน` + LD_TAIL) },
  { id: 'poa-gf-part', label: 'หนังสือมอบอำนาจ — รับให้ที่ดินเฉพาะส่วน', types: ['GF'],
    ...ldPoa('รับให้ที่ดินเฉพาะส่วน ' + LD_BLD, () => `รับให้ที่ดินเฉพาะส่วนแปลงเครื่องหมายข้างบนนี้ ${LD_BLD} จากนาย/นาง/นางสาว ${ldDots(16)} โดยเสน่หาไม่มีค่าตอบแทน` + LD_TAIL) },
  // ── อายัด / สินไหม (บันทึกข้อความพื้นฐาน) ──
  { id: 'memo-sz', label: 'บันทึกข้อความ — อายัดที่ดินตามคำสั่งเจ้าพนักงานบังคับคดี', kind: 'memo', types: ['SZ'], def: () => true,
    render: (c) => <LdMemo c={c} subject={/ถอน/.test(c.subtype) ? 'ถอนอายัดที่ดินระหว่างจำนอง' : 'อายัดที่ดินระหว่างจำนองตามคำสั่งเจ้าพนักงานบังคับคดี'}>
      <LdH>เรื่องเดิม</LdH>
      <LdP>ด้วย{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} ได้จำนอง{ldLand(c)} ไว้เป็นหลักประกันเงินกู้ สัญญาเลขที่ {c.contractNo || ldDots(10)} กับ{LD.coop} {ldDebtLine(c)}</LdP>
      {ldDebtTable(c)}
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>ฝ่ายจัดการได้รับหนังสือแจ้งจากสำนักงานบังคับคดี{ldDots(16)} ที่ {ldDots(12)} ลงวันที่ {ldDots(12)} เรื่อง{c.subtype || 'อายัดตามคำสั่ง'} ที่ดินแปลงดังกล่าว คดีหมายเลขดำที่ {ldDots(8)} คดีหมายเลขแดงที่ {ldDots(8)}</LdP>
      <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
      <LdP>ฝ่ายจัดการพิจารณาแล้วเห็นควรดำเนินการยื่นคำร้องขอรับชำระหนี้ในฐานะเจ้าหนี้บุริมสิทธิผู้รับจำนอง เพื่อรักษาสิทธิของสหกรณ์ฯ ต่อไป</LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>เสนอเพื่อโปรดทราบและพิจารณาอนุมัติให้ดำเนินการตามความเห็นของฝ่ายจัดการ</LdP>
    </LdMemo> },
  { id: 'memo-in', label: 'บันทึกข้อความ — รับเงินสินไหมทดแทนหลักทรัพย์ระหว่างจำนอง', kind: 'memo', types: ['IN'], def: () => true,
    render: (c) => <LdMemo c={c} subject={/ชดใช้/.test(c.subtype) ? 'ชดใช้ค่าเสียหายหลักทรัพย์ระหว่างจำนอง' : 'รับเงินสินไหมทดแทนหลักทรัพย์ระหว่างจำนอง'}>
      <LdH>เรื่องเดิม</LdH>
      <LdP>ด้วย{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} ได้จำนอง{ldLand(c)} ไว้เป็นหลักประกันเงินกู้กับ{LD.coop} โดยสิ่งปลูกสร้างบนที่ดินแปลงดังกล่าวได้ทำประกันอัคคีภัยไว้ โดยระบุให้สหกรณ์ฯ เป็นผู้รับประโยชน์</LdP>
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>บริษัทประกันภัย{ldDots(16)} ได้แจ้งพิจารณาจ่ายเงินสินไหมทดแทน กรมธรรม์เลขที่ {ldDots(12)} จำนวนเงิน {c.amountTxt || ldDots(12)} บาท ({c.amountWords || ldDots(16)}) เนื่องจากเหตุ {ldDots(24)}</LdP>
      <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
      <LdP>ฝ่ายจัดการพิจารณาแล้วเห็นควรรับเงินสินไหมทดแทนดังกล่าวเพื่อนำไปชำระหนี้ หรือให้ผู้กู้นำไปซ่อมแซมสิ่งปลูกสร้างให้คืนสภาพเดิม ตามระเบียบของสหกรณ์ฯ</LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>เสนอเพื่อโปรดพิจารณาอนุมัติตามความเห็นของฝ่ายจัดการ</LdP>
    </LdMemo> },
  // ── บันทึกข้อความเพิ่มเติม (ตามตัวอย่างแผนกเงินกู้พิเศษ) ──
  { id: 'memo-ck-req2', label: 'บันทึกข้อความ — ขออนุญาตรังวัดสอบเขตที่ดินระหว่างจำนอง (เสนอ ผจก.)', kind: 'memo', types: ['CK'],
    render: (c) => <LdMemo c={c} subject="ขออนุญาตรังวัดสอบเขตที่ดินระหว่างจำนอง" to="ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส)" signName={LD.head} signPos="หงพ." closing="จึงเรียนมาเพื่อโปรดพิจารณาต่อไปด้วย จะขอบคุณยิ่ง">
      <LdH>เรื่องเดิม</LdH>
      <LdP>ด้วย{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} {ldDebtLine(c)}</LdP>
      {ldDebtTable(c)}
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>{c.name} ได้รับอนุมัติเงินกู้พิเศษเพื่อการเคหะสงเคราะห์ ({c.subtype || ldDots(10)}) จำนวนเงินให้กู้ {c.amountTxt || ldDots(10)} บาท ({c.amountWords || ldDots(14)}) ในการประชุม คสอ.กสท.ครั้งที่ ......../........ เมื่อวันที่ {ldDots(14)} โดยใช้หลักทรัพย์ค้ำประกัน</LdP>
      {c.assets.filter(a => a.type !== 'สิ่งปลูกสร้าง').map((a, i) => <LdP key={a.id}>{i + 1}.โฉนดที่ดินเลขที่ {a.titleNo} เลขที่ดิน {a.landNo || ldDots(6)} หน้าสำรวจ {a.surveyPage || ldDots(6)} {a.loc} เนื้อที่ {a.area} {a.owner || c.name} ผู้ถือกรรมสิทธิ์</LdP>)}
      <LdP>บัดนี้{c.name} มีความประสงค์ขออนุญาตผู้รับจำนองเพื่อสอบเขตที่ดินระหว่างจำนอง{ldLand(c)} เนื้อที่ {c.a0.area || ldDots(8)} โดยมีวัตถุประสงค์เพื่อต้องการทราบแนวเขตที่ดินที่แท้จริงและล้อมรั้วที่ดินต่อไป</LdP>
      <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
      <LdP>แผนกเงินกู้พิเศษพิจารณาแล้วเห็นควรให้ผู้กู้ดำเนินการตามความประสงค์ เนื่องจากจะได้ทราบแนวเขตที่ดิน และมีความชัดเจนในการล้อมรั้วรอบแนวเขตที่ดิน เพื่อจะได้ไม่รุกล้ำที่ดินแปลงข้างเคียง ไม่ทำให้ผู้รับจำนองเสียหายแต่ประการใด กรณีสอบเขตที่ดินระหว่างจำนองได้เนื้อที่ลดลงจากเดิมผู้กู้ยินยอมปฏิบัติตามเงื่อนไขของผู้รับจำนองและยินยอมรับผิดชอบค่าใช้จ่ายต่างๆ เองทั้งสิ้น</LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>1.เสนอเพื่อพิจารณาอนุญาตให้{c.name} ยื่นขอรังวัดสอบเขตที่ดินระหว่างจำนองได้</LdP>
      <LdP>2.เสนอเพื่อยินยอมรับทราบผลการรังวัดฯ และจดทะเบียนรับทราบผลการรังวัดสอบเขตกรณีทราบผลการรังวัดได้เนื้อที่เท่าเดิม และรายงาน คก.และ คสอ.เพื่อทราบต่อไป</LdP>
      <LdP>3.กรณีผลการรังวัดสอบเขตที่ดินระหว่างจำนอง ได้เนื้อที่น้อยกว่าเดิมจะนำมาเสนอ คก.และ คสอ.เพื่อพิจารณาต่อไป</LdP>
    </LdMemo> },
  ...[['memo-in-pay', ' (เสนอ ปคก. — เพื่อทราบ)', 'ปคก. ผ่าน ลคก.', LD.mgr, 'ผจก.สอ.กสท.', false], ['memo-in-pay2', ' (เสนอ ผจก. — เพื่อพิจารณา)', 'ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส)', LD.head, 'หงพ.', true]].map(([id, tag, to, sn, sp, ask]) => ({
    id, label: 'บันทึกข้อความ — จ่ายสินไหมทดแทนให้แก่สมาชิก' + tag, kind: 'memo', types: ['IN'],
    render: (c) => <LdMemo c={c} subject="จ่ายสินไหมทดแทนให้แก่สมาชิก" to={to} signName={sn} signPos={sp} closing={ask ? 'จึงเรียนมาเพื่อโปรดพิจารณาต่อไปด้วย จะขอบคุณยิ่ง' : 'จึงเรียนมาเพื่อโปรดทราบต่อไปด้วย จะขอบคุณยิ่ง'}>
      <LdH>เรื่องเดิม</LdH>
      <LdP>{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} ได้รับเงินกู้พิเศษเพื่อการเคหะฯ ({c.subtype || ldDots(12)}) จำนวนเงินให้กู้ {c.amountTxt || ldDots(10)} บาท ตามมติ คสอ.ครั้งที่ ......../........ เมื่อวันที่ {ldDots(14)} ผ่อนชำระมาแล้ว {ldDots(8)} งวด คงเหลือหนี้สัญญาเงินกู้พิเศษ {ldDots(12)} บาท</LdP>
      <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
      <LdP>สอ.กสท.ได้รับแจ้งจาก{c.name} ว่าบ้านพักอาศัยที่มาจำนองค้ำประกันหนี้เงินกู้พิเศษซึ่งได้ทำประกันภัยไว้กับบริษัท{ldDots(20)} {ldLand(c)} ได้เกิดความเสียหายเนื่องจาก{ldDots(20)} เหตุการณ์เกิดขึ้นระหว่างวันที่ {ldDots(14)} ผู้กู้ติดต่อประสานงานกับบริษัทประกันภัยแล้วและ<u>ได้แนบรูปถ่ายเหตุการณ์ขณะเกิดความเสียหายมาประกอบการพิจารณา (รูปถ่ายแนบ)</u></LdP>
      <LdP>บริษัท{ldDots(20)} ได้จ่ายสินไหมทดแทนแล้วจำนวน {ldDots(12)} บาท ({ldDots(16)}) ได้สั่งจ่ายเช็คในนามผู้รับผลประโยชน์ (สอ.กสท.) เลขที่เช็ค {ldDots(10)} ลว.{ldDots(10)} ธนาคาร{ldDots(14)} (แผนกเงินกู้พิเศษได้รับเช็คฯ และส่งมอบให้แผนกการเงินเรียบร้อยแล้วเมื่อวันที่ {ldDots(14)})</LdP>
      <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
      <LdP>{ask ? 'แผนกเงินกู้พิเศษ' : 'ฝ่ายจัดการ'}พิจารณาแล้วเห็นควรจ่ายเงินให้ผู้กู้ เพื่อได้ดำเนินการซ่อมแซมบ้านพักอาศัยส่วนที่เกิดความเสียหายกับทรัพย์ที่นำมาจำนองค้ำประกันเงินกู้ไว้ เพื่อให้ทรัพย์ดังกล่าวอยู่ในสภาพที่ดีต่อไปพร้อมทั้งแจ้งให้ผู้กู้ได้รับทราบ หากดำเนินการซ่อมแซมแล้วเสร็จให้แจ้งผู้รับจำนองได้ทราบด้วยพร้อมทั้งแนบรูปถ่ายด้วย</LdP>
      <LdP><b><u>หมายเหตุ</u></b> ส่วนที่เกิดความเสียหาย {ldDots(30)}</LdP>
      <LdH>ประเด็นที่นำเสนอ</LdH>
      <LdP>1.<b><u>มติ คสอ.กสท.ครั้งที่ 17/2568 เมื่อวันที่ 7 ตุลาคม 2568 เห็นชอบและอนุมัติหลักการ กรณีจ่ายเงินสินไหมทดแทนให้แก่สมาชิก</u></b>จำนวนเงินตั้งแต่ 50,000.00 บาท ขึ้นไปให้เป็นอำนาจของ คก.และ คสอ.กสท.เป็นผู้พิจารณา <b><u>หากจำนวนเงินน้อยกว่า 50,000.00 บาท ให้เป็นอำนาจของ งพ. และ ผจก.เป็นผู้พิจารณาอนุมัติและให้เสนอ คก. และ คสอ.กสท.เพื่อทราบต่อไป</u></b> (ได้แนบมติ คสอ.กสท.ครั้งที่ 17/2568 เมื่อวันที่ 7 ตุลาคม 2568)</LdP>
      <LdP>{ask
        ? <>2.เสนอเพื่อพิจารณา แผนกเงินกู้พิเศษขออนุมัติจ่ายเงินค่าสินไหมทดแทนให้แก่{c.name} เป็นจำนวนเงิน {ldDots(12)} บาท ({ldDots(16)}) เป็นค่าซ่อมแซมบ้านพักอาศัยฯ ต่อไปและกำหนดจ่ายเงินค่าสินไหมวันที่ {ldDots(14)}</>
        : <>2.เสนอเพื่อทราบ ฝ่ายจัดการได้อนุมัติจ่ายเงินค่าสินไหมทดแทนให้แก่{c.name} เป็นจำนวนเงิน {ldDots(12)} บาท ({ldDots(16)}) เป็นค่าซ่อมแซมบ้านพักอาศัยฯ ต่อไปและได้จ่ายเงินค่าสินไหมเรียบร้อยแล้วเมื่อวันที่ {ldDots(14)}</>}</LdP>
    </LdMemo>,
  })),
  ...[['memo-rd-sale', 'ไถ่ถอนจำนอง', 'ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส)', LD.head, 'หงพ.', false], ['memo-rd-free', 'ปลอดจำนอง', 'ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส)', LD.head, 'หงพ.', false], ['memo-rd-free2', 'ปลอดจำนอง', 'ปคก. ผ่าน ลคก.', LD.mgr, 'ผจก.สอ.กสท.', true]].map(([id, act, to, sn, sp, big]) => ({
    id, label: 'บันทึกข้อความ — ขอ' + act + 'เพื่อขายโฉนดที่ดิน' + (big ? ' (เสนอ ปคก.)' : ' (เสนอ ผจก.)'), kind: 'memo', types: [act === 'ปลอดจำนอง' ? 'RL' : 'RD'], ...(act === 'ปลอดจำนอง' && !big ? { def: () => true } : {}),
    render: (c) => {
      const land = `โฉนดที่ดินเลขที่ ${c.titleNos} เลขที่ดิน ${c.landNos || ldDots(6)} หน้าสำรวจ ${c.surveyPages || ldDots(6)} ตำบล${c.L.tambon || ldDots(10)} อำเภอ${c.L.amphoe || ldDots(10)} จังหวัด${c.L.province || ldDots(10)}`;
      const cn = (c.debts[0] && c.debts[0].contractNo) || c.contractNo || ldDots(12);
      return <LdMemo c={c} subject={'ขอ' + act + 'เพื่อขายโฉนดที่ดินเลขที่ ' + (c.a0.titleNo || ldDots(8))} to={to} signName={sn} signPos={sp} closing="จึงเรียนมาเพื่อโปรดพิจารณาต่อไปด้วย จะขอบคุณยิ่ง">
        <LdH>เรื่องเดิม</LdH>
        <LdP>{big ? 'ด้วย' : 'ตามที่'}{c.name} สมาชิกเลขที่ {c.memNo} สังกัด {c.dept} {ldDebtLine(c).replace('/ไม่มีหนี้ในฐานะผู้ค้ำประกัน', '/ไม่มีหนี้ในฐานะผู้ค้ำ/ไม่ติดภาระค้ำประกัน')}</LdP>
        {ldDebtTable(c, big)}
        <LdH>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</LdH>
        <LdP>{c.name} มีความประสงค์ขอ{act}{land} เนื้อที่ {c.a0.area || ldDots(8)} เพื่อขายให้กับบุคคลภายนอกตามหนังสือแจ้ง ลว.{ldDots(12)} โดยกำหนดโอนภายในเดือน{ldDots(12)} และจะชำระหนี้ให้ สอ.กสท.เป็นจำนวนเงิน {ldDots(12)} บาท ({ldDots(16)}) ส่วนภาระหนี้คงเหลือผ่อนชำระต่อไป/ดังรูปตารางแสดงหลักประกันเงินกู้พิเศษสัญญา {cn}</LdP>
        {ldCollTable(c)}
        <LdH>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</LdH>
        <LdP>{big ? 'ฝ่ายจัดการ' : 'แผนกเงินกู้พิเศษ'}พิจารณาแล้วเห็นควรให้ผู้กู้ดำเนินการตามความประสงค์โดยให้{act}{land} เพื่อนำไปขายและนำเงินมาตัดชำระหนี้ สัญญา {cn} จำนวนเงิน {ldDots(12)} บาท ({ldDots(16)}) ซึ่งทำให้ภาระหนี้คงเหลือ {ldDots(12)} บาท ({ldDots(20)}) คิดเป็นร้อยละ {ldDots(6)} ของหลักประกันคงเหลือและได้พิจารณาความเสี่ยงเบื้องต้นแล้วอยู่ในระดับที่ยอมรับได้เนื่องจากเป็นไปตามหลักเกณฑ์และประกาศการให้เงินกู้พิเศษ ดังรูปตารางแสดงหลักประกันคงเหลือสัญญา {cn}</LdP>
        {ldCollTable(c, true)}
        {big && <>
          <LdH>หมายเหตุ</LdH>
          <LdP>1.{ldDots(60)}</LdP>
          <LdP>2.{ldDots(60)}</LdP>
          <LdP>3.{ldDots(60)}</LdP>
        </>}
        <LdH>หลักเกณฑ์ที่ใช้พิจารณา (ถ้ามี)</LdH>
      <LdP>ตามเอกสารแนบรายละเอียดเงินกู้พิเศษเพื่อการเคหะสงเคราะห์และราคาประเมินหลักทรัพย์ตลอดจนเป็นไปตามระเบียบเงินกู้พิเศษ พ.ศ 2554 แก้ไขเพิ่มเติม (ฉบับที่ 3 พ.ศ. 2559) ลว.19/09/2559 และประกาศหลักเกณฑ์การให้เงินกู้พิเศษ ลว.19/09/2559 <b><u>อำนาจในการพิจารณาโดย คก.และ คสอ.โดยใช้คะแนนเสียงเห็นชอบไม่น้อยกว่าสามในสี่ของจำนวนกรรมการผู้เข้าประชุมพิจารณาคำขอกู้รายนั้น</u></b></LdP>
        <LdH>ประเด็นที่นำเสนอ</LdH>
        <LdP>เสนอเพื่อพิจารณาอนุมัติให้{c.name} {act}{land} เพื่อขายให้กับบุคคลภายนอกและนำเงินมาตัดชำระหนี้สัญญา {cn} จำนวน {ldDots(12)} บาท ({ldDots(16)}) ซึ่งทำให้ภาระหนี้คงเหลือ {ldDots(12)} บาท คิดเป็นร้อยละ {ldDots(6)} ของหลักประกันและคุ้มมูลหนี้</LdP>
      </LdMemo>;
    },
  })),
];
LD_DOCS.forEach(d => { if (!d.kind) d.kind = 'poa'; });
// ── ชุดเอกสารจดจำนอง: มอบอำนาจ → คำเตือน → คำขอ → สัญญาจำนอง → สัญญาต่อท้าย ──
{
  const old = ['poa-mg', 'mg-td15', 'mg-annex-land', 'mg-ach16', 'mg-annex-condo'];
  for (let i = LD_DOCS.length - 1; i >= 0; i--) if (old.includes(LD_DOCS[i].id)) LD_DOCS.splice(i, 1);
  LD_DOCS.forEach(d => { if (d.id === 'poa-condo' || d.id === 'poa-ns3') d.types = d.types.filter(x => x !== 'MG'); });
  const bld = (c) => c.hasBuilding ? 'พร้อมสิ่งปลูกสร้างที่มีอยู่แล้วและหรือที่จะมีขึ้นในภายหน้า' : '';
  const mgPower = (c) => (c.isCondo ? 'ขอรับจำนองกรรมสิทธิ์ห้องชุดเครื่องหมายข้างบนนี้ จาก' : 'ขอรับจำนองที่ดินแปลงเครื่องหมายดังกล่าวข้างต้น' + bld(c) + 'จาก ')
    + c.name + ' เพื่อเป็นหลักประกันหนี้สินของ ' + c.name + ' ที่มีต่อ' + LD.coop + ' จำนวนเงิน ' + (c.amountTxt || ldDots(12)) + ' บาท (' + (c.amountWords || ldDots(20)) + ') อัตราดอกเบี้ยร้อยละ ' + (c.rate || ldDots(6))
    + ' ต่อปี และตกลงนำส่งดอกเบี้ยเดือนละครั้งเสมอไป โดยมีเงื่อนไข วัตถุประสงค์ในการก่อหนี้ ลักษณะของมูลหนี้ ระยะเวลาในการก่อหนี้และข้อตกลงเป็นไปตามสัญญาจำนองเป็นประกันและสัญญาต่อท้ายสัญญาจำนองเป็นประกัน(จำนวน 1 แผ่น) โดยให้ถือเอาข้อตกลงต่อท้ายสัญญาจำนองเป็นประกันเป็นส่วนหนึ่งของสัญญาจำนองด้วย ตลอดจนให้ถ้อยคำต่อเจ้าพนักงานที่ดินแทนข้าพเจ้าเสร็จการ'
    + (c.isNs3 ? '' : ' และยินยอมให้ผู้รับมอบอำนาจเข้าทำการในนามตนเองและ/หรือเป็นตัวแทนของอีกฝ่ายหนึ่งด้วย');
  const mgSubject = (c) => c.isCondo ? 'มอบอำนาจรับจำนองกรรมสิทธิ์ห้องชุด' : 'รับจำนองที่ดินเป็นประกัน' + (c.multiTxt ? ' ' + c.multiTxt : '') + (c.hasBuilding ? 'พร้อมสิ่งปลูกสร้างที่มีอยู่แล้ว และหรือจะมีขึ้นในภายหน้า' : '');
  const formOf = (c) => c.isCondo ? 'อ.ช.' : c.isNs3 ? 'ท.อ.' : 'ท.ด.';
  LD_DOCS.unshift(
    ...[['mg-poa', 'จำนองแปลงเดียว', (st) => /แปลงเดียว/.test(st) || !/รวมหลายแปลง|เฉพาะส่วน|ลำดับ|เพิ่มหลักทรัพย์|ขึ้นเงิน|ผ่อนต้น|แก้ไขหนี้/.test(st)],
        ['mg-poa-multi', 'จำนองรวมหลายแปลง', (st) => /รวมหลายแปลง/.test(st)],
        ['mg-poa-part', 'จำนองเฉพาะส่วน', (st) => /เฉพาะส่วน/.test(st)]].map(([id, lb, f]) => (
      { id, label: 'หนังสือมอบอำนาจ — ' + lb, kind: 'poa', types: ['MG'], def: (c) => f(c.subtype || ''),
        render: (c) => <LdPoa c={c} subject={mgSubject(c)} power={mgPower(c)} head={'มอบอำนาจรับจำนองที่ดิน ' + c.titleWord} tail={(c.multiTxt ? c.multiTxt : '') + (c.hasBuilding ? 'พร้อมสิ่งปลูกสร้างที่มีอยู่แล้ว และหรือจะมีขึ้นในภายหน้า' : '')} /> })),
    { id: 'mg-warn', label: 'เอกสารต่อท้ายหนังสือมอบอำนาจ (คำเตือน)', kind: 'warn', types: ['MG'], def: () => true, render: () => <LdPoaWarn /> },
    { id: 'mg-req', label: 'คำขอจดทะเบียนสิทธิและนิติกรรม (ท.ด.1 / ท.ด.1 ก / อ.ช.15)', kind: 'req', types: ['MG'], def: () => true, render: (c) => <LdRegReq c={c} /> },
    { id: 'mg-contract', label: 'หนังสือสัญญาจำนอง (ท.ด.15 / ท.อ.5 / อ.ช.16)', kind: 'contract', types: ['MG'], def: () => true,
      render: (c) => c.isCondo ? <LdMortgage c={c} condo /> : c.isNs3 ? <LdMortgageNs3 c={c} /> : <LdMortgage c={c} /> },
    { id: 'mg-annex', label: 'สัญญาต่อท้ายหนังสือสัญญาจำนองเป็นประกัน', kind: 'annex', types: ['MG'], def: () => true,
      render: (c) => <LdAnnex c={c} condo={c.isCondo} /> },
  );
}
const LD_KIND = { poa: 'หนังสือมอบอำนาจ', warn: 'เอกสารต่อท้ายหนังสือมอบอำนาจ (คำเตือน)', req: 'คำขอจดทะเบียนสิทธิและนิติกรรม', contract: 'หนังสือสัญญาจำนอง', annex: 'สัญญาต่อท้ายหนังสือสัญญาจำนองเป็นประกัน', memo: 'บันทึกข้อความ (ยื่นเรื่องภายในสหกรณ์)', letter: 'เอกสารมอบอำนาจยื่นต่อสำนักงานที่ดิน', cover: 'แบบรายงานการทำนิติกรรม' };

// ── Modal เลือกชุดเอกสาร → พรีวิว/พิมพ์ ───────────────────────────────
function LaDocSetModal({ rec, onClose, onPrinted, onCloseAct }) {
  const [closed, setClosed] = React.useState(rec.status === 'registered');
  const [askClose, setAskClose] = React.useState(false);
  const c = React.useMemo(() => ldCtx(rec), [rec]);
  const t = window.laType(rec.typeCode);
  const docs = LD_DOCS;
  const kinds = Object.keys(LD_KIND);
  const [tab, setTab] = React.useState(Object.keys(LD_KIND)[0]);
  const [sel, setSel] = React.useState(() => LD_DOCS.filter(d => d.types.includes(rec.typeCode) && d.def && d.def(c)).map(d => d.id));
  const [open, setOpen] = React.useState(() => Object.keys(LD_KIND).map(k => k + ':' + rec.typeCode));
  const toggleOpen = (key) => setOpen(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key]);
  const [preview, setPreview] = React.useState(false);
  const [signerOpen, setSignerOpen] = React.useState(false);
  const [, bump] = React.useState(0);
  const noAttorney = !String(rec.attorney || '').trim();
  const toggle = (id) => {
    if (id === 'cover' && !closed && !sel.includes(id)) { setAskClose(true); return; }
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };
  const confirmClose = () => {
    setClosed(true); setAskClose(false); setSel(s => [...new Set([...s, 'cover'])]);
    onCloseAct && onCloseAct(rec);
  };
  const chosen = kinds.flatMap(k => docs.filter(d => d.kind === k && sel.includes(d.id)));
  const clear = () => document.documentElement.classList.remove('lrq-printing');
  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const done = () => { clear(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) {}
    setTimeout(clear, 1500);
    onPrinted && onPrinted(chosen.map(d => d.label));
  };
  React.useEffect(() => () => clear(), []);
  const bodyRef = React.useRef(null);
  const secRefs = React.useRef({});

  if (preview) return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={() => setPreview(false)}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — เอกสารนิติกรรม{t.label} · {c.name} · {chosen.length} รายการ</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>คลิกข้อความเพื่อแก้ไขก่อนพิมพ์</span>
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={onClose} title="ปิด"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal" contentEditable suppressContentEditableWarning spellCheck={false} style={{ outline: 'none' }}>
          {chosen.map(d => <React.Fragment key={d.id}>{d.render(c)}</React.Fragment>)}
        </div>
      </div>
    </div>
  );

  const actOrder = ['MG', 'RD', 'RL', 'SV', 'CB', 'IS', 'SP', 'CK', 'IH', 'GF', 'SZ', 'IN'];
  const setMany = (ids, on) => setSel(s => on ? [...new Set([...s, ...ids])] : s.filter(x => !ids.includes(x)));
  const mine = (d) => d.types.includes(rec.typeCode);
  // ส่วนเอกสาร: บันทึกข้อความ → มอบอำนาจ (หัวกระดาษสหกรณ์) → แบบฟอร์มกรมที่ดิน → สัญญา → แบบรายงานการทำนิติกรรม (ทำหลังสุด)
  const groupOf = (d) => mine(d) ? rec.typeCode : d.types[0];
  const FLAT = ['warn', 'req', 'contract', 'annex', 'cover'];
  const secs = kinds.map((k, i) => {
    const all = docs.filter(d => d.kind === k);
    const own = all.filter(mine);
    const groups = [rec.typeCode, ...actOrder.filter(x => x !== rec.typeCode)]
      .map(code => ({ code, items: all.filter(d => groupOf(d) === code) })).filter(g => g.items.length);
    return { k, no: i + 1, own: FLAT.includes(k) ? all : own, flat: FLAT.includes(k), all, groups, n: own.filter(d => sel.includes(d.id)).length, nOther: FLAT.includes(k) ? 0 : all.filter(d => !mine(d) && sel.includes(d.id)).length };
  });
  const jump = (k) => { setTab(k); const el = secRefs.current[k], box = bodyRef.current; if (el && box) box.scrollTo({ top: el.offsetTop - box.offsetTop - 8, behavior: 'smooth' }); };
  const onScroll = () => {
    const box = bodyRef.current; if (!box) return;
    let cur = kinds[0];
    kinds.forEach(k => { const el = secRefs.current[k]; if (el && el.offsetTop - box.offsetTop - 24 <= box.scrollTop) cur = k; });
    if (cur !== tab) setTab(cur);
  };
  const assetLbl = c.isCondo ? 'ห้องชุด' : c.isNs3 ? 'น.ส.3 / น.ส.3 ก.' : 'โฉนดที่ดิน' + (c.hasBuilding ? ' + สิ่งปลูกสร้าง' : '');
  const cb = { width: 15, height: 15, accentColor: 'var(--brand-700, #237450)', cursor: 'pointer', flex: '0 0 auto', margin: 0 };
  const docRow = (d, indent) => {
    const on = sel.includes(d.id);
    return (
      <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', paddingLeft: 12 + (Number(indent) || 0), cursor: 'pointer', borderRadius: 6,
        background: on ? '#EAFEF2' : 'transparent', transition: 'background .15s' }}>
        <input type="checkbox" checked={on} onChange={() => toggle(d.id)} style={cb} />
        <span style={{ fontSize: 13, color: 'rgba(0,0,0,.88)', textWrap: 'pretty' }}>{d.label.replace(/^(หนังสือมอบอำนาจ|บันทึกข้อความ) — /, '')}</span>
        {d.id === 'cover' && (closed
          ? <span style={{ fontSize: 11.5, padding: '0 8px', borderRadius: 999, background: '#EAFEF2', color: 'var(--brand-700, #237450)', lineHeight: '20px', whiteSpace: 'nowrap' }}>ปิดนิติกรรมแล้ว{rec.closedAt ? ' · ' + window.laThaiDate(rec.closedAt) : ''}{rec.closedBy ? ' · ' + rec.closedBy : ''}</span>
          : <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>ต้องยืนยันการปิดนิติกรรมก่อนพิมพ์</span>)}
      </label>
    );
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 'min(920px, 95vw)' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="print" /></div>
          <h2>พิมพ์เอกสารนิติกรรม</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div style={{ padding: '0 24px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 16, alignItems: 'center', padding: '14px 18px', borderRadius: 8, background: '#EAFEF2', border: '1px solid rgba(35,116,80,.18)' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,.65)' }}>นิติกรรมที่จะทำ</div>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-700, #237450)', lineHeight: 1.3 }}>{t.label}</span>
                {rec.subtype && <span style={{ fontSize: 12.5, padding: '2px 10px', borderRadius: 999, background: '#fff', color: 'var(--brand-700, #237450)', border: '1px solid rgba(35,116,80,.3)' }}>{rec.subtype}</span>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 14px', fontSize: 12.5 }}>
              <span style={{ color: 'rgba(0,0,0,.65)' }}>เลขที่นิติกรรม</span><span className="mono" style={{ color: 'rgba(0,0,0,.88)' }}>{rec.actNo}</span>
              <span style={{ color: 'rgba(0,0,0,.65)' }}>ผู้กู้</span><span style={{ color: 'rgba(0,0,0,.88)' }}>{c.name}</span>
              <span style={{ color: 'rgba(0,0,0,.65)' }}>เลขสมาชิก</span><span className="mono" style={{ color: 'rgba(0,0,0,.88)' }}>{c.memNo || rec.memberCode}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', borderTop: '1px solid #F0F0F0', height: '52vh' }}>
          <nav style={{ borderRight: '1px solid #F0F0F0', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflow: 'auto', background: '#FAFAFA' }}>
            <div style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)', padding: '0 8px 6px' }}>ชุดเอกสาร</div>
            {secs.map(sc => {
              const on = tab === sc.k;
              return (
                <button key={sc.k} onClick={() => jump(sc.k)}
                  style={{ display: 'grid', gridTemplateColumns: '22px minmax(0,1fr) auto', alignItems: 'center', gap: 8, padding: '8px', border: 0, borderRadius: 6, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    background: on ? '#fff' : 'transparent', boxShadow: on ? '0 1px 2px rgba(0,0,0,.08)' : 'none', opacity: sc.own.length ? 1 : .55 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center', fontSize: 11.5, fontWeight: 600,
                    background: sc.n + sc.nOther > 0 ? 'var(--brand-700, #237450)' : '#fff', color: sc.n + sc.nOther > 0 ? '#fff' : 'rgba(0,0,0,.45)', border: sc.n + sc.nOther > 0 ? 0 : '1px solid #D9D9D9' }}>{sc.no}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.35, color: on ? 'var(--brand-700, #237450)' : 'rgba(0,0,0,.88)', fontWeight: on ? 600 : 400 }}>{LD_KIND[sc.k]}</span>
                  <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,.45)' }}>{sc.own.length ? (sc.n + sc.nOther) + '/' + sc.own.length : '—'}</span>
                </button>
              );
            })}
          </nav>

          <div ref={bodyRef} onScroll={onScroll} style={{ overflow: 'auto', padding: '12px 20px 20px', position: 'relative' }}>
            {secs.map(sc => {
              const allOn = sc.own.length > 0 && sc.n === sc.own.length;
              return (
                <section key={sc.k} ref={(el) => { secRefs.current[sc.k] = el; }} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 8px', borderBottom: '2px solid #EAFEF2', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700, #237450)' }}>ส่วนที่ {sc.no}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>{LD_KIND[sc.k]}</span>
                    <span style={{ flex: 1 }} />
                    {sc.own.length > 1 && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'rgba(0,0,0,.65)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={allOn} ref={(el) => { if (el) el.indeterminate = sc.n > 0 && !allOn; }}
                          onChange={(e) => setMany(sc.own.map(d => d.id), e.target.checked)} style={cb} />
                        เลือกทั้งหมด
                      </label>
                    )}
                  </div>
                  {sc.flat && sc.all.map(d => docRow(d, 0))}
                  {!sc.flat && sc.groups.map(g => {
                    const key = sc.k + ':' + g.code, isOpen = open.includes(key), cur = g.code === rec.typeCode;
                    const nSel = g.items.filter(d => sel.includes(d.id)).length;
                    return (
                      <div key={g.code}>
                        <button onClick={() => toggleOpen(key)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', border: 0, background: 'none', padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', borderRadius: 6 }}>
                          <span style={{ display: 'inline-flex', color: 'rgba(0,0,0,.45)', transform: isOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .15s' }}><Icon name="chevDown" size={12} /></span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: cur ? 'var(--brand-700, #237450)' : 'rgba(0,0,0,.88)' }}>{window.laType(g.code).label}</span>
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>({g.items.length})</span>
                          {cur && <span style={{ fontSize: 11, padding: '0 8px', borderRadius: 999, background: '#EAFEF2', color: 'var(--brand-700, #237450)', lineHeight: '18px' }}>นิติกรรมนี้</span>}
                          <span style={{ flex: 1 }} />
                          {nSel > 0 && <span style={{ fontSize: 12, color: 'var(--brand-700, #237450)' }}>เลือกแล้ว {nSel}</span>}
                        </button>
                        {isOpen && g.items.map(d => docRow(d, 24))}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </div>
        </div>

        <div className="lrq-sal-foot">
          <span className="muted" style={{ fontSize: 12.5 }}>เลือกทั้งหมด {chosen.length} เอกสาร</span>
          {sel.length > 0 && <button className="btn sm" onClick={() => setSel([])}>ล้างทั้งหมด</button>}
          <span className="spacer" />
          <button className="btn" onClick={() => setSignerOpen(true)}><Icon name="user" /> ตั้งค่าผู้ลงนาม</button>
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!chosen.length || noAttorney} title={noAttorney ? 'กรุณาระบุผู้รับมอบอำนาจที่รายการนิติกรรม ก่อนพรีวิวเอกสาร' : undefined}
                  onClick={() => setPreview(true)}><Icon name="print" /> พรีวิว / พิมพ์ ({chosen.length})</button>
        </div>
        {noAttorney && <div className="dep-error" style={{ margin: '0 20px 16px' }}><Icon name="info" size={13} /> กรุณาระบุผู้รับมอบอำนาจที่รายการนิติกรรม ก่อนพรีวิวเอกสาร</div>}
      </div>
      {signerOpen && <LaSignerModal onClose={(saved) => { setSignerOpen(false); if (saved) bump(x => x + 1); }} />}
      {askClose && (
        <>
          <div className="modal-backdrop" onClick={() => setAskClose(false)} style={{ zIndex: 1200 }} />
          <div className="modal-card gc-modal" role="alertdialog" aria-modal="true" style={{ width: 460, zIndex: 1201 }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ background: '#fffbe6', color: '#faad14' }}><Icon name="info" /></div>
              <h2>ยืนยันการปิดนิติกรรม</h2>
              <button className="close-btn" onClick={() => setAskClose(false)}><Icon name="close" /></button>
            </div>
            <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '4px 14px', fontSize: 13, padding: '10px 14px', background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 8 }}>
                <span style={{ color: 'rgba(0,0,0,.65)' }}>เลขที่นิติกรรม</span><span className="mono">{rec.actNo}</span>
                <span style={{ color: 'rgba(0,0,0,.65)' }}>ประเภท</span><span>{t.label}{rec.subtype ? ' · ' + rec.subtype : ''}</span>
                <span style={{ color: 'rgba(0,0,0,.65)' }}>ผู้กู้</span><span>{c.name}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(0,0,0,.88)', textWrap: 'pretty' }}>
                คุณต้องการปิดนิติกรรมรายการนี้ใช่หรือไม่? เมื่อปิดแล้ว สถานะจะเปลี่ยนเป็น “ปิดนิติกรรมแล้ว” และ<b>ไม่สามารถแก้ไขหรือลบรายการได้</b> หากต้องดำเนินการต่อให้ใช้ “ทำนิติกรรมเพิ่มเติม”
              </div>
            </div>
            <div className="lrq-sal-foot">
              <button className="btn" onClick={() => setAskClose(false)}>ยกเลิก</button>
              <button className="btn primary" onClick={confirmClose}><Icon name="check" /> ยืนยันปิดนิติกรรม</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

Object.assign(window, { LaDocSetModal, LD_DOCS });
