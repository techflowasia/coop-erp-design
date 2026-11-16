// ════════════════════════════════════════════════════════════════════
//  พิมพ์หนังสือนำเสนอพิจารณาเงินกู้ — ชุดเอกสารตามโครงการเงินกู้
//   1) บันทึกข้อความ   2) รายละเอียดประกอบการพิจารณาเงินกู้พิเศษ
//   (+ แบบพิจารณาเงินกู้พิเศษ กรณีเคหะสงเคราะห์ โฉนดมากกว่า 1 แปลง)
//   โครงการ: เคหะสงเคราะห์ (โฉนด 1 แปลง / มากกว่า 1 แปลง) · ประกอบอาชีพ · ยานพาหนะ
// ════════════════════════════════════════════════════════════════════

const SPC_KIND = {
  house: { label: 'พิเศษเคหะสงเคราะห์', title: 'เงินกู้พิเศษเพื่อการเคหะสงเคราะห์', ann: 'ประกาศโครงการให้เงินกู้พิเศษเพื่อการเคหะสงเคราะห์ พ.ศ.2566 ลว.11/01/2566' },
  job:   { label: 'พิเศษเพื่อประกอบอาชีพ', title: 'เงินกู้พิเศษเพื่อการลงทุนประกอบอาชีพ', ann: '' },
  car:   { label: 'พิเศษยานพาหนะ', title: 'เงินกู้พิเศษเพื่อยานพาหนะ', ann: '' },
};
const SPC_REG = 'ระเบียบสหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด ว่าด้วยการให้เงินกู้พิเศษ พ.ศ.2554 แก้ไขเพิ่มเติม (ฉบับที่ 3 พ.ศ.2559) ลว.19/09/2559';
const SPC_TH_MONTH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const SPC_TH_NUM = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const spcNum = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')) || 0;
const spcM = (n) => fmt.money(Number(n) || 0);
const spcDots = (w) => '.'.repeat(w || 24);
const spcYears = (from, to) => {
  if (!from) return '';
  const a = new Date(from), b = new Date(to || Date.now());
  let y = b.getFullYear() - a.getFullYear();
  if (b.getMonth() < a.getMonth() || (b.getMonth() === a.getMonth() && b.getDate() < a.getDate())) y--;
  return y;
};
const spcLongDate = (d) => { d = new Date(d); return `${d.getDate()} ${SPC_TH_MONTH[d.getMonth()]} ${d.getFullYear() + 543}`; };
const spcBaht = (n) => (window.bahtText ? window.bahtText(n) : '');

// ── รวบรวมข้อมูลจากใบคำขอกู้ ──────────────────────────────────────
function spcKindFromForm(f) {
  const pj = (window.lpjLoad ? window.lpjLoad() : []).find(p => p.id === f.lpjProjectId);
  const pl = window.lpLabel ? window.lpLabel('loanPurpose', f.purpose) : '';
  const n = [pj ? pj.name : '', pl || '', f.productName || ''].join(' ');
  if (/ยานพาหนะ/.test(n)) return 'car';
  if (/อาชีพ/.test(n)) return 'job';
  return 'house';
}

function spcBuild(f, calc) {
  const m = f.member || {};
  const today = window.DEPOSIT_WORKING_DATE ? new Date(window.DEPOSIT_WORKING_DATE) : new Date();
  const salary = spcNum(m.salary || (f.income || {}).salary);
  const amount = spcNum(f.amount);

  // สัญญาเดิม
  const dr = f.detailReport || {};
  const rows = (dr.loanContracts || []).map(c => ({ no: c.contract, amt: c.loanAmount, paid: `${c.termsPaid}/${c.totalTerms}`, remain: c.remaining, hint: c.tag || '' }));
  (f.offsetLoans || []).forEach(o => {
    if (!rows.some(r => r.no.split(' ')[0] === o.contract)) rows.push({ no: o.contract, amt: o.approved, paid: o.period, remain: o.remaining, hint: o.loanType || '' });
  });
  const cat = (r) => /^ฉฉ/.test(r.no) ? 'emerg' : /^สฉ/.test(r.no) ? 'atm' : (/^พ/.test(r.no) || /พิเศษ/.test(r.hint)) ? 'special' : /^ส\d/.test(r.no) ? 'common' : 'other';
  rows.forEach(r => { r.cat = cat(r); });
  const principal = rows.reduce((a, r) => a + spcNum(r.amt), 0);
  const debtRemain = rows.reduce((a, r) => a + spcNum(r.remain), 0);

  // หลักทรัพย์ (โฉนด + สิ่งปลูกสร้างบนโฉนด)
  const all = window.lcOf ? window.lcOf(m.code) : [];
  const TT = window.LC_TITLE_TYPES || ['โฉนด'];
  const linked = (f.collaterals || []).map(c => c.assetId).filter(Boolean);
  let lands = all.filter(a => TT.includes(a.type) && linked.includes(a.id));
  if (!lands.length) lands = all.filter(a => TT.includes(a.type) && a.titleNo && (spcNum(a.govPrice) || spcNum(a.summaryPrice)));
  const deeds = lands.map(a => {
    const blds = all.filter(b => b.type === 'สิ่งปลูกสร้าง' && ((b.building || {}).refTitleNo === a.titleNo || b.refTitleNo === a.titleNo)).map(b => {
      const x = b.building || {};
      const area = spcNum(x.usableArea);
      const appraisal = spcNum(x.buildAppraisal);
      const perSqm = spcNum(x.appraisalPerSqm) || (area ? appraisal / area : 0);
      const age = spcNum(x.ageYears);
      const depPct = spcNum(x.depreciation) || Math.min(age * 2, 70);
      const depAmt = appraisal * depPct / 100;
      const residual = spcNum(x.residualValue) || (appraisal - depAmt);
      return { x, area, appraisal, perSqm, age, depPct, depAmt, residual,
        desc: `${x.btype || 'บ้านพักอาศัย'}${x.floors ? ' ' + x.floors + ' ชั้น' : ''}${x.houseNo ? '/บ้านเลขที่ ' + x.houseNo : ''}` };
    });
    const landPrice = spcNum(a.govPrice) || spcNum(a.summaryPrice) || spcNum(a.coopPrice);
    const bldVal = blds.reduce((s, b) => s + b.residual, 0);
    const total = landPrice + bldVal;
    const pct = spcNum(a.maxGuarPct) || (blds.length ? 90 : 70);
    const prov = a.locProvince || '';
    return {
      a, blds, landPrice, total, pct, lend: total * pct / 100,
      perWa: spcNum(a.govPerWa),
      area: `${a.rai || 0}-${a.ngan || 0}-${a.wa || 0} ไร่`,
      owner: ((a.owners || [])[0] || {}).name || m.name,
      loc: `ตำบล${a.locTambon || spcDots(10)} อำเภอ${a.locAmphoe || spcDots(10)} ${prov === 'กรุงเทพมหานคร' ? prov : 'จังหวัด' + (prov || spcDots(10))}`,
    };
  });
  const collTotal = deeds.reduce((s, d) => s + d.total, 0);
  const lendTotal = deeds.reduce((s, d) => s + d.lend, 0);
  const lendPct = collTotal ? Math.round(lendTotal / collTotal * 100) : 90;

  // เงินฝากค้ำประกัน (ใช้กับประกอบอาชีพ/ยานพาหนะ)
  const dep = (f.collaterals || []).find(c => c.view && c.view.kind === 'deposit');
  const depRow = dep && dep.view.rows && dep.view.rows[0];

  const mcOff = (window.lrCalc ? window.lrCalc(f).mcOffset : null) || (() => false);
  const mc = (f.monthlyCollect || []).filter(r => !mcOff(r)); // แถวที่หักกลบแล้วไม่เรียกเก็บรายเดือนต่อ
  const shareMonthly = mc.filter(r => /หุ้น/.test(r.detail)).reduce((s, r) => s + spcNum(r.payPrincipal), 0);
  const loanMonthly = mc.filter(r => !/หุ้น/.test(r.detail)).reduce((s, r) => s + spcNum(r.payPrincipal) + spcNum(r.payInterest), 0);

  const inst = spcNum(calc && calc.inst);
  const periods = spcNum(f.periods || (calc && calc.sendable) || f.sendablePeriods);
  const approve = spcNum(calc && calc.amountApproved) || amount;
  const reqDate = f.reqDate ? new Date(f.reqDate) : today;
  const purposeLabel = String((window.lpLabel ? window.lpLabel('loanPurpose', f.purpose) : f.purpose) || '').replace(/^\S+\s*:\s*/, '');
  // สัญญาที่หักกลบในใบคำขอ → หมายเหตุความเห็นฝ่ายจัดการ
  const offs = (f.offsetLoans || []).filter(o => o.sel !== false && spcNum(o.remaining) > 0);
  const offTotal = offs.reduce((s, o) => s + spcNum(o.remaining), 0);
  const opinionNote = offs.length
    ? `(หลังหักชำระหนี้สัญญา ${offs.map(o => o.contract).join(', ')} จำนวนเงิน ${spcM(offTotal)} บาท เงินกู้คงเหลือ${purposeLabel ? 'เพื่อ' + purposeLabel : ''} จำนวนเงิน ${spcM(Math.max(approve - offTotal, 0))} บาท)`
    : '';
  // รายละเอียดหนี้ฝั่งซ้าย — ใส่ยอดอนุมัติตามวัตถุประสงค์ที่เลือกบนหน้าจอ
  const leftKey = /ไถ่ถอน/.test(purposeLabel) ? 'redeem' : /ต่อเติม|ปรับปรุง/.test(purposeLabel) ? 'renovate' : /ห้องชุด/.test(purposeLabel) ? 'condo'
    : /ที่ดินพร้อม/.test(purposeLabel) ? 'buyLandBldg' : /สร้าง/.test(purposeLabel) ? 'build' : /ซื้อที่ดิน/.test(purposeLabel) ? 'buyLand'
    : /อาชีพ/.test(purposeLabel) ? 'need' : 'buyLandBldg';
  const left = { [leftKey]: Math.max(approve - offTotal, 0), total: debtRemain + approve - offTotal };
  if (leftKey === 'need') left.job = purposeLabel;
  const rateTxt = calc && calc.netRate != null ? Number(calc.netRate).toFixed(2) : '';
  return {
    approve, left, opinionNote, purpose: purposeLabel || undefined, rate: rateTxt, collectDate: f.receiveDate || '',
    docNo: f.reqNo || '', docDate: spcLongDate(reqDate), offTotal,
    spouseOcc: f.spouseOcc || '', spouseIncome: spcNum(f.spouseIncome),
    today: reqDate, m, salary, amount, rows, principal, debtRemain, deeds, collTotal, lendTotal, lendPct,
    depRow, shareMonthly, loanMonthly, inst, periods,
    age: spcYears(m.birthDate, today), memYears: spcYears(m.joinDate, today),
    memNo: String(m.code || '').replace(/\D/g, '').padStart(6, '0').slice(-6),
    unit: String(m.unit || '').split('·').pop().trim(),
    newTotal: principal + approve - offTotal,
    remainIncome: spcNum(calc && calc.remain),
    payType: f.payType === 'principal' ? 'คงต้น' : 'คงยอด',
    share: spcNum(m.shareCapital),
  };
}

// ── ชิ้นส่วนฟอร์ม ───────────────────────────────────────────────────
const spcPage = {
  width: '210mm', minHeight: '297mm', padding: '14mm 16mm', boxSizing: 'border-box', background: '#fff', color: '#111',
  boxShadow: '0 4px 20px rgba(0,0,0,.3)', margin: '0 auto 18px', fontFamily: 'Sarabun, sans-serif', fontSize: 14, lineHeight: 1.7,
  breakAfter: 'page', pageBreakAfter: 'always', position: 'relative',
};
function Fl({ w, children, left, bold }) {
  const empty = children == null || children === '';
  return (
    <span style={{ display: 'inline-block', minWidth: w || 80, borderBottom: '1px dotted #555', textAlign: left ? 'left' : 'center',
      padding: '0 4px', lineHeight: 1.35, fontWeight: bold ? 600 : 400, verticalAlign: 'baseline' }}>{empty ? '\u00a0' : children}</span>
  );
}
function Cb({ on }) {
  return <span style={{ display: 'inline-flex', width: 13, height: 13, border: '1px solid #222', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, lineHeight: 1, verticalAlign: '-2px', margin: '0 4px', fontWeight: 700 }}>{on ? '✓' : ''}</span>;
}
const P = ({ children, indent, style }) => <p style={{ margin: '0 0 2px', textIndent: indent === false ? 0 : '3em', textAlign: 'justify', textWrap: 'pretty', ...(style || {}) }}>{children}</p>;
const H = ({ children }) => <div style={{ margin: '4px 0 0 3em', fontWeight: 700, textDecoration: 'underline' }}>{children}</div>;

// ── 1) บันทึกข้อความ ────────────────────────────────────────────────
function SpcMemo({ d, kind, multi, purpose }) {
  const K = SPC_KIND[kind];
  const ap = d.approve != null ? d.approve : d.amount;
  const topic = `${K.title}${purpose ? ' (' + purpose + ')' : ''}`;
  const reg = SPC_REG + (K.ann ? ' และ' + K.ann : '');
  const deedText = (x, i) => (
    <P key={i}>{multi ? (i + 1) + '.' : ''}โฉนดที่ดินเลขที่ {x.a.titleNo || spcDots(8)} เลขที่ดิน {x.a.landNo || spcDots(6)} หน้าสำรวจ {x.a.surveyPage || spcDots(6)} {x.loc} เนื้อที่ {x.area} รวมราคาประเมิน{x.blds.length ? 'ที่ดินพร้อม' + x.blds.map(b => b.desc).join(' และ') : 'ที่ดินราชการ'} จำนวน {spcM(x.total)} บาท {x.owner} ผู้ถือกรรมสิทธิ์{x.note ? ' ' + x.note : ''}</P>
  );
  const noDeed = <P>{spcDots(140)}</P>;
  return (
    <div className="spc-page" style={spcPage}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px', alignItems: 'center' }}>
        <img src={window.__resources && window.__resources.logo} alt="" style={{ width: 62, height: 62, objectFit: 'contain' }} />
        <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700 }}>บันทึกข้อความ</div>
        <div style={{ textAlign: 'right', fontWeight: 700 }}>รายที่ ....</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', marginTop: 6 }}>
        <div><b>หน่วยงาน</b> ฝ่ายสินเชื่อ</div><div>แผนกเงินกู้พิเศษ</div><div>โทรศัพท์ 1121-1122</div>
        <div><b>ที่</b> แผนก งพ.................../{d.today.getFullYear() + 543}</div><div style={{ gridColumn: 'span 2' }}><b>วันที่</b> {spcLongDate(d.today)}</div>
      </div>
      <div style={{ borderBottom: '1px solid #111', padding: '2px 0', marginTop: 2 }}><b>เรื่อง</b> สมาชิกขอกู้{topic}</div>
      <div style={{ margin: '4px 0' }}><b>เรียน</b> ปคก.ผ่าน ลคก.</div>

      <H>เรื่องเดิม</H>
      <P>ตามที่ สอ.กสท.ได้ออก{reg} นั้น</P>

      <H>สาระสำคัญ/การดำเนินงานของฝ่ายจัดการ</H>
      <P>{d.m.name} สมาชิกเลขที่ {d.memNo} สังกัด {d.unit} มีภาระหนี้กับสหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด รวม {d.rows.length} สัญญา จำนวนเงินต้น {spcM(d.principal)} บาท ชำระแล้วคงเหลือ {spcM(d.debtRemain)} บาท/ไม่มีหนี้ในฐานะผู้ค้ำประกัน รายละเอียดดังนี้</P>
      <table style={{ width: '88%', margin: '6px auto 8px', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead><tr>{['ลำดับที่', 'เลขที่สัญญา', 'เงินกู้ /วงเงิน', 'ผ่อนชำระ', 'เงินกู้คงเหลือ'].map(h => <th key={h} style={{ border: '1px solid #222', padding: '1px 6px', fontWeight: 600 }}>{h}</th>)}</tr></thead>
        <tbody>
          {d.rows.map((r, i) => (
            <tr key={i}>
              <td style={{ border: '1px solid #222', textAlign: 'center' }}>{i + 1}.</td>
              <td style={{ border: '1px solid #222', textAlign: 'center' }}>{r.no}</td>
              <td style={{ border: '1px solid #222', textAlign: 'right', padding: '0 8px' }}>{spcM(r.amt)}</td>
              <td style={{ border: '1px solid #222', textAlign: 'center' }}>{r.paid}</td>
              <td style={{ border: '1px solid #222', textAlign: 'right', padding: '0 8px' }}>{spcM(r.remain)}</td>
            </tr>
          ))}
          <tr>
            <td style={{ border: '1px solid #222', paddingLeft: 6 }}>รวม</td><td style={{ border: '1px solid #222' }} />
            <td style={{ border: '1px solid #222', textAlign: 'right', padding: '0 8px', fontWeight: 600 }}>{spcM(d.principal)}</td><td style={{ border: '1px solid #222' }} />
            <td style={{ border: '1px solid #222', textAlign: 'right', padding: '0 8px', fontWeight: 600 }}>{spcM(d.debtRemain)}</td>
          </tr>
        </tbody>
      </table>

      <P>{d.m.name} ได้ยื่นขอกู้{topic} จำนวนเงินขอกู้ {spcM(d.amount)} บาท ({spcBaht(d.amount)}) โดยใช้หลักทรัพย์ค้ำประกันดังนี้</P>
      {d.deeds.length ? (multi ? d.deeds : d.deeds.slice(0, 1)).map(deedText) : noDeed}

      {kind === 'car' && (
        <P>รายละเอียดยานพาหนะที่ซื้อ ประเภท {(d.car && d.car.type) || spcDots(20)} ยี่ห้อ {(d.car && d.car.brand) || spcDots(20)} รุ่น {(d.car && d.car.model) || spcDots(20)} สภาพรถ{(d.car && d.car.cond) || spcDots(12)} ราคาที่ซื้อ {d.car && d.car.price ? spcM(d.car.price) : spcDots(20)} บาท{d.car && d.car.dealer ? ' ' + d.car.dealer : ''}</P>
      )}
      {kind === 'job' && (
        <P><u>{d.jobPlan || ('ได้มีแผนการลงทุนประกอบอาชีพ ' + spcDots(60) + ' จำนวนเงินทุน ' + spcDots(20) + ' บาท ปัจจุบันมีรายได้จาก ' + spcDots(90))}</u></P>
      )}

      <H>ความเห็นของฝ่ายจัดการ/ผู้เกี่ยวข้อง</H>
      <P>ฝ่ายจัดการพิจารณาแล้วเห็นควรให้กู้{topic} จำนวนเงิน {spcM(ap)} บาท ({spcBaht(ap)}) เนื่องจากหลักทรัพย์ที่จะนำมาใช้ค้ำประกันมีจำนวน {spcM(d.collTotal)} บาท คิดเป็นร้อยละ {d.collTotal ? (ap / d.collTotal * 100).toFixed(2) : '0.00'} ของราคาหลักทรัพย์ ฝ่ายจัดการได้พิจารณาความเสี่ยงเบื้องต้นแล้วอยู่ในระดับที่ยอมรับได้ เนื่องจากเป็นไปตามหลักเกณฑ์และประกาศการให้เงินกู้พิเศษ เมื่อรวมภาระหนี้เดิมและหนี้เงินกู้พิเศษฯ ที่ยื่นกู้ในครั้งนี้แล้วรวมเป็นเงินจำนวน {spcM(d.newTotal)} บาท{d.opinionNote ? ' ' + d.opinionNote : ''}</P>

      {kind === 'job' && (
        <>
          <H>แหล่งที่มาของรายได้หลัก/รายได้เสริม</H>
          {(d.incomeSrc || [spcDots(150), spcDots(150), spcDots(150)]).map((t, i) => <P key={i}>{i + 1}.{t}</P>)}
        </>
      )}

      <H>หลักเกณฑ์ที่ใช้พิจารณา (ถ้ามี)</H>
      <P>ตามเอกสารแนบรายละเอียด{K.title}และราคาประเมินหลักทรัพย์ตลอดจนเป็นไปตาม{SPC_REG.replace('ระเบียบสหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด ', 'ระเบียบ')}{K.ann ? ' และ' + K.ann : ''} นั้น <u>อำนาจในการพิจารณาโดย คก.และ คสอ.โดยใช้คะแนน เสียงเห็นชอบไม่น้อยกว่าสามในสี่ของจำนวนกรรมการผู้เข้าประชุมพิจารณาคำขอกู้รายนั้น</u></P>

      <H>ประเด็นที่นำเสนอ</H>
      <P>เสนอเพื่อพิจารณาอนุมัติจ่าย{topic} ให้{d.m.name} เป็นจำนวนเงิน {spcM(ap)} บาท ({spcBaht(ap)})/วงเงินจดทะเบียนจำนอง {spcM(d.newTotal)} บาท เพื่อประกันหนี้เงินกู้ทุกสัญญา (มติ คสอ.กสท.ครั้งที่ 7/2564 ลว.5 มีนาคม 2564)</P>

      <P style={{ marginTop: 14 }}>จึงเรียนมาเพื่อโปรดพิจารณาต่อไปด้วย จะขอบคุณยิ่ง</P>
      <div style={{ marginLeft: '55%', marginTop: 40, textAlign: 'center', breakInside: 'avoid' }}>
        <div>(นายมรุต หมุดเพ็ชร์)</div><div>ผจก.สอ.กสท.</div>
      </div>
    </div>
  );
}

// ── 2) รายละเอียดประกอบการพิจารณาเงินกู้พิเศษ ──────────────────────
//  กรณีโฉนดมากกว่า 1 แปลง: แสดงหลักทรัพย์ครบทุกแปลง — เอกสารต่อหลายหน้าได้
function SpcLandBlock({ x, n, total, year, line }) {
  const blds = x && x.blds.length ? x.blds : [null];
  const c = (x && x.contract) || {};
  const struct = (b) => b ? (b.x.structure || '') + ' ' + (b.desc || '') : '';
  return (
    <div style={{ breakInside: 'avoid', marginBottom: total > 1 ? 4 : 0, paddingTop: total > 1 && n > 0 ? 4 : 0, borderTop: total > 1 && n > 0 ? '1px dashed #999' : 'none' }}>
      {total > 1 && <div style={{ fontWeight: 700 }}>แปลงที่ {n + 1}</div>}
      <div style={line}>1. ที่ดิน โฉนดที่ดิน/น.ส.3 ก. เลขที่ <Fl w={110}>{x ? x.a.titleNo : ''}</Fl> เลขที่ดิน <Fl w={90}>{x ? x.a.landNo : ''}</Fl> หน้าสำรวจ <Fl w={90}>{x ? x.a.surveyPage : ''}</Fl></div>
      <div style={line}>ตำบล/แขวง <Fl w={130}>{x ? x.a.locTambon : ''}</Fl> อำเภอ/เขต <Fl w={130}>{x ? x.a.locAmphoe : ''}</Fl> จังหวัด <Fl w={130}>{x ? x.a.locProvince : ''}</Fl></div>
      <div style={line}>เนื้อที่ <Fl w={110}>{x ? x.area : ''}</Fl> เจ้าของที่ดิน <Fl w={170}>{x ? x.owner : ''}</Fl> เกี่ยวข้องเป็น <Fl w={110}>{x ? 'ผู้ถือกรรมสิทธิ์' : ''}</Fl></div>
      <div style={line}>ราคาประเมินเริ่มใช้ตั้งแต่ปี พ.ศ. <Fl w={44}>{x ? year : ''}</Fl> ราชการประเมินตารางวาละ <Fl w={80}>{x && x.perWa ? spcM(x.perWa) : ''}</Fl> บาท รวมราคา <Fl w={95}>{x ? spcM(x.landPrice) : ''}</Fl> บาท</div>
      {blds.map((b, j) => (
        <React.Fragment key={j}>
          <div style={line}>2. สิ่งปลูกสร้าง{blds.length > 1 ? ' (' + (j + 1) + ')' : ''} <Cb on={!!b && /ไม้/.test(struct(b)) && !/ครึ่ง/.test(struct(b))} />บ้านไม้ <Cb on={!!b && !/ครึ่ง|ไม้/.test(struct(b))} />ตึก <Fl w={70}>{b && b.x.floors ? (b.x.floors === '1' ? 'ชั้นเดียว' : b.x.floors === '2' ? 'สองชั้น' : b.x.floors + ' ชั้น') : ''}</Fl> <Cb on={!!b && /ครึ่ง/.test(struct(b))} />ครึ่งตึกครึ่งไม้ <Cb />ห้องชุด <Cb />อื่นๆ <Fl w={70}></Fl></div>
          <div style={line}>พื้นที่ <Fl w={60}>{b ? b.area : ''}</Fl> ตารางเมตร ๆ ละ <Fl w={90}>{b ? spcM(b.perSqm) : ''}</Fl> บาท ราคาประเมินราชการ <Fl w={110}>{b ? spcM(b.appraisal) : ''}</Fl> บาท</div>
          <div style={line}>ระยะเวลาการปลูก <Fl w={40}>{b && !b.planned ? b.age : ''}</Fl> ปี หักค่าเสื่อมร้อยละ <Fl w={40}>{b && !b.planned ? b.depPct : ''}</Fl> เป็นเงิน <Fl w={100}>{b && !b.planned ? spcM(b.depAmt) : ''}</Fl> บาท คงเหลือ <Fl w={100}>{b ? spcM(b.residual) : ''}</Fl> บาท</div>
        </React.Fragment>
      ))}
      <div style={line}><Cb on={!!c.sale} />สัญญาจะซื้อจะขาย <Cb on={!!c.hire} />สัญญาว่าจ้าง <Cb on={!!c.mortgage} />สัญญาจำนอง ลงวันที่ <Fl w={110}>{c.date || ''}</Fl> จำนวนเงิน <Fl w={110}>{c.amount ? spcM(c.amount) : ''}</Fl> บาท</div>
      <div style={line}>ชื่อโครงการ <Fl w={220}>{x ? (x.project || (x.blds[0] && x.blds[0].x.houseNo ? 'บ้านเลขที่ ' + x.blds[0].x.houseNo : '')) : ''}</Fl></div>
    </div>
  );
}

function SpcDetail({ d, kind, multi }) {
  const K = SPC_KIND[kind];
  const ap = d.approve != null ? d.approve : d.amount;
  const sm = { fontSize: 11.5, lineHeight: 1.6 };
  const line = { display: 'flex', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' };
  const row2 = (l, v) => <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 28px', alignItems: 'baseline' }}><span>{l}</span><Fl w={110}>{v}</Fl><span>บาท</span></div>;
  const L = d.left || {};
  const lv = (k, def) => (L[k] != null ? (typeof L[k] === 'number' ? spcM(L[k]) : L[k]) : def);
  const leftRows = kind === 'house'
    ? [['หนี้ สอ.กสท.', spcM(d.debtRemain)], ['ซื้อที่ดิน', lv('buyLand', '')], ['ซื้อที่ดินพร้อมอาคาร', lv('buyLandBldg', multi ? '' : spcM(ap))], ['สร้างอาคาร', lv('build', multi ? spcM(ap) : '')], ['ไถ่ถอนที่ดินและหรืออาคาร', lv('redeem', '')], ['ต่อเติมปรับปรุงอาคาร', lv('renovate', '')], ['ซื้อห้องชุด', lv('condo', '')]]
    : kind === 'job'
      ? [['หนี้ สอ.กสท.', spcM(d.debtRemain)], ['ประกอบอาชีพ', lv('job', '')], ['จำนวนเงินที่ลงทุน', lv('invest', '')], ['สมาชิกออกทุนเอง ¼', lv('own', '')], ['คงเหลือจำนวนเงินที่ต้องกู้', lv('need', spcM(ap))]]
      : null;
  const leftTotal = L.total != null ? L.total : d.debtRemain + ap;
  const car = d.car || {};
  const year = d.today.getFullYear() + 543;
  const deedList = multi ? d.deeds : d.deeds.slice(0, 1);
  const prefix = (no) => no.split('-')[0].replace(/\.\d+$/, '');
  return (
    <div className="spc-page" style={{ ...spcPage, ...sm, padding: '8mm 10mm' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'center', gap: 12 }}>
        <div style={{ border: '1px solid #222', padding: '2px 8px', fontSize: 12 }}>
          <div>เลขลำดับที่ <Fl w={90}>{d.docNo || ''}</Fl></div><div>วันที่ <Fl w={110}>{d.docDate || spcLongDate(d.today)}</Fl></div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>รายละเอียดประกอบการพิจารณา{K.title}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={line}>ชื่อผู้กู้ <Fl w={170}>{d.m.name}</Fl> อายุ <Fl w={30}>{d.age}</Fl> ปี เลขสมาชิก <Fl w={60}>{d.memNo}</Fl> สังกัด <Fl w={150}>{d.unit}</Fl> เป็นสมาชิก <Fl w={30}>{d.memYears}</Fl> ปี</div>
        <div style={line}>เงินเดือน <Fl w={140}>{spcM(d.salary)}</Fl> บาท จำนวนร้อยละ <Fl w={60}>{d.noPct5 ? '' : 5}</Fl> ของเงินเดือน เป็นเงิน <Fl w={140}>{d.noPct5 ? '' : spcM(d.salary * 0.05)}</Fl> บาท</div>
        <div style={line}>จำนวนเงินที่ขอกู้ <Fl w={140}>{spcM(d.amount)}</Fl> บาท ผ่อนชำระ <Fl w={70}>{d.periods || ''}</Fl> งวด</div>
        {(() => {
          const rs = d.rows || [];
          const bd = '1px solid #222';
          const th = { border: bd, padding: '1px 6px', fontWeight: 700, textAlign: 'center' };
          const td = { border: bd, padding: '1px 8px' };
          const tA = rs.reduce((x, r) => x + spcNum(r.amt), 0), tR = rs.reduce((x, r) => x + spcNum(r.remain), 0);
          return (
            <table style={{ width: '88%', margin: '3px auto 4px', borderCollapse: 'collapse', fontSize: 11.5, lineHeight: 1.45 }}>
              <thead><tr>
                <th style={{ ...th, width: '12%' }}>ลำดับที่</th><th style={{ ...th, width: '28%' }}>เลขที่สัญญา</th>
                <th style={{ ...th, width: '20%' }}>เงินกู้ /วงเงิน</th><th style={{ ...th, width: '16%' }}>ผ่อนชำระ</th><th style={{ ...th, width: '24%' }}>เงินกู้คงเหลือ</th>
              </tr></thead>
              <tbody>
                {(rs.length ? rs : [null]).map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...td, textAlign: 'center' }}>{r ? i + 1 + '.' : '\u00a0'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{r ? r.no : ''}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{r ? spcM(r.amt) : ''}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{r ? r.paid : ''}</td>
                    <td style={{ ...td, textAlign: 'right' }}>{r ? spcM(r.remain) : ''}</td>
                  </tr>
                ))}
                <tr>
                  <td style={td}>รวม</td><td style={td} />
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{spcM(tA)}</td><td style={td} />
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{spcM(tR)}</td>
                </tr>
              </tbody>
            </table>
          );
        })()}
        <div style={line}>ชื่อคู่สมรส <Fl w={170}>{d.m.spouse && d.m.spouse !== '-' ? d.m.spouse : ''}</Fl> อาชีพ <Fl w={170}>{d.spouseOcc || ''}</Fl> รายได้ <Fl w={120}>{d.spouseIncome ? spcM(d.spouseIncome) : ''}</Fl> บาท</div>
      </div>

      <div style={{ fontWeight: 700, textDecoration: 'underline', marginTop: 4 }}>หลักทรัพย์ที่ใช้ค้ำประกัน{multi ? ' (' + d.deeds.length + ' แปลง)' : ''}</div>
      <div style={{ paddingLeft: 20 }}>
        {(deedList.length ? deedList : [null]).map((x, i) => <SpcLandBlock key={i} x={x} n={i} total={deedList.length} year={year} line={line} />)}
        {kind !== 'house' && (
          <>
            <div style={line}>3. บัญชีเงินฝาก สอ.กสท. ประเภท <Fl w={120}>{d.depRow ? d.depRow.depType : ''}</Fl> เลขบัญชี <Fl w={120}>{d.depRow ? d.depRow.accNo : ''}</Fl> ชื่อเจ้าของบัญชี <Fl w={130}>{d.depRow ? d.depRow.accName : ''}</Fl></div>
            <div style={line}>จำนวนเงินคงเหลือในบัญชี <Fl w={140}>{d.depRow && d.depRow.balance ? spcM(d.depRow.balance) : ''}</Fl> บาท</div>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1.5px solid #111', marginTop: 6, breakInside: 'avoid' }}>
        <div style={{ borderRight: '1.5px solid #111', padding: '4px 10px 0 0' }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline' }}>รายละเอียดหนี้และวงเงินอนุมัติให้กู้</div>
          {leftRows ? leftRows.map(([l, v]) => <React.Fragment key={l}>{row2(l, v)}</React.Fragment>) : (
            <>
              {row2('หนี้ สอ.กสท.', spcM(d.debtRemain))}
              <div>ยานพาหนะที่ซื้อ</div>
              <div style={{ paddingLeft: 20 }}><Cb on={car.type === 'เก๋ง'} />เก๋ง &nbsp;&nbsp;<Cb on={car.type === 'ปิคอัพ'} />ปิคอัพ &nbsp;&nbsp;<Cb on={car.type === 'ตู้'} />ตู้</div>
              <div style={line}>ยี่ห้อ <Fl w={90}>{car.brand || ''}</Fl> รุ่น <Fl w={110}>{car.model || ''}</Fl></div>
              <div>สภาพรถที่ซื้อ <Cb on={/ใหม่/.test(car.cond || '')} />ใหม่ &nbsp;&nbsp;<Cb on={/เก่า|มือสอง/.test(car.cond || '')} />เก่า</div>
              {row2('ราคาที่ซื้อ', car.price ? spcM(car.price) : '')}
            </>
          )}
          {row2('รวม', spcM(leftTotal))}
          <div style={{ textAlign: 'center', marginTop: 8, borderTop: '1px solid #111', paddingTop: 2 }}>
            <div style={{ width: '70%', margin: '12px auto 0', borderTop: '1px dotted #555' }} />
            เจ้าหน้าที่ผู้สำรวจหลักทรัพย์
          </div>
        </div>
        <div style={{ padding: '4px 0 0 10px' }}>
          <div style={{ fontWeight: 700, textDecoration: 'underline' }}>หลักทรัพย์และสิทธิการกู้</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 84px 22px', alignItems: 'baseline', columnGap: 2 }}>
            <span style={{ whiteSpace: 'nowrap' }}>ร้อยละ <Fl w={18}>100</Fl> ของราคาหลักทรัพย์<Cb on={false} />1<Cb on />1+2</span><Fl w={86}>{spcM(d.collTotal)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap' }}>ร้อยละ <Fl w={18}>{d.lendPct}</Fl> ของราคาหลักทรัพย์<Cb on={false} />1<Cb on />1+2</span><Fl w={86}>{spcM(d.lendTotal)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>ผู้กู้มีค่าหุ้น</span><Fl w={86}>{spcM(d.share)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>ผู้กู้มีสิทธิกู้ตามหลักทรัพย์</span><Fl w={86}>{spcM(d.lendTotal)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11, marginTop: 4 }}>เงินได้รายเดือนของผู้กู้</span><Fl w={86}>{spcM(d.salary)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>หนี้ ปณท/กสท/สมาชิกกองทุนสำรองเลี้ยงชีพ</span><Fl w={86}>{d.ptDebt || '-/-'}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>ส่งค่าหุ้นรายเดือน/เงินกู้สามัญ</span><Fl w={86}>{d.shareLoan || fmt.money(d.shareMonthly, 0) + '/' + fmt.money(d.loanMonthly, 0)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>ชำระเงินต้นพร้อมดอกเบี้ยเงินกู้พิเศษรายเดือน</span><Fl w={86}>{spcM(d.monthlyPay || d.inst)}</Fl><span>บาท</span>
            <span style={{ whiteSpace: 'nowrap', fontSize: 11 }}>เงินรายได้คงเหลือ</span><Fl w={86}>{spcM(d.remainIncome)}</Fl><span>บาท</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 0.75fr', borderTop: '1.5px solid #111', marginTop: 6, breakInside: 'avoid' }}>
        <div style={{ borderRight: '1.5px solid #111', padding: '4px 8px 0 0' }}>
          <div style={line}>เห็นควรอนุมัติ <Fl w={110}>{spcM(ap)}</Fl> บาท</div>
          <div style={{ ...line, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>ผ่อนชำระงวดละ <Fl w={80}>{spcM(d.inst)}</Fl> บาท ({d.payType})</div>
          <div style={line}>จำนวนงวดที่ผ่อนชำระ <Fl w={70}>{d.periods || ''}</Fl> งวด</div>
          {(d.rate || d.collectDate) && <div style={line}>ดอกเบี้ยร้อยละ <Fl w={44}>{d.rate}</Fl> ต่อปี เริ่มเก็บ <Fl w={80}>{d.collectDate ? (() => { const [y, m, dd] = d.collectDate.split('-'); return `${dd}/${m}/${Number(y) + 543}`; })() : ''}</Fl></div>}
          {['หงพ.', 'ผช.ผจก.(ส)', 'ผจก.สอ.กสท.'].map(t => <div key={t} style={{ display: 'flex', gap: 4, marginTop: 2 }}><Fl w={150}></Fl>{t}</div>)}
          <div style={{ marginTop: 8 }}>วันที่ <Fl w={140}></Fl></div>
        </div>
        <div style={{ borderRight: '1.5px solid #111', padding: '4px 8px 0' }}>
          <div>คณะอนุกรรมการเงินกู้ อนุมัติให้กู้</div>
          <div style={line}>จำนวนเงิน <Fl w={120}></Fl> บาท</div>
          {['ปคก.', 'คก.', 'คก.', 'คก.', 'คก.', 'คก.', 'ลคก.'].map((t, i) => <div key={i} style={{ display: 'flex', gap: 4, lineHeight: 1.45 }}><Fl w={150}></Fl>{t}</div>)}
          <div style={{ marginTop: 2 }}>วันที่ <Fl w={130}></Fl></div>
        </div>
        <div style={{ padding: '4px 0 0 8px' }}>
          <div style={{ textAlign: 'center' }}>มติคณะกรรมการดำเนินการ</div>
          <div style={{ paddingLeft: 30, marginTop: 2 }}><div><Cb />อนุมัติ</div><div><Cb />ไม่อนุมัติ</div></div>
          <div style={line}>เหตุผล <Fl w={100}></Fl></div>
          {[1, 2, 3].map(i => <div key={i}><Fl w={150}></Fl></div>)}
          <div style={{ marginTop: 10 }}>วันที่ <Fl w={100}></Fl></div>
        </div>
      </div>
    </div>
  );
}

// ── 3) แบบพิจารณาเงินกู้พิเศษ (แนบ — กรณีโฉนดมากกว่า 1 แปลง) ─────────
function SpcDeedAppendix({ d }) {
  const amt = (pct, v) => (
    <div style={{ display: 'grid', gridTemplateColumns: '60px 160px 140px', margin: '0 0 0 30%' }}>
      <span>{pct}%</span><span>ของราคาหลักทรัพย์</span><span style={{ textAlign: 'right' }}>{fmt.money(v, 0)}.- บาท</span>
    </div>
  );
  return (
    <div className="spc-page" style={spcPage}>
      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, textDecoration: 'underline' }}>แบบพิจารณาเงินกู้พิเศษ</div>
      <div>ชื่อผู้กู้{d.m.name} อายุ {d.age} ปี เลขสมาชิก {d.memNo} สังกัด {d.unit}</div>
      <div style={{ fontWeight: 700, textDecoration: 'underline', margin: '4px 0' }}>หลักทรัพย์และสิทธิการกู้</div>
      {d.deeds.length === 0 && <P>{spcDots(140)}</P>}
      {d.deeds.map((x, i) => (
        <div key={i} style={{ marginBottom: 10, breakInside: 'avoid' }}>
          <P>{i + 1}.โฉนดที่ดินเลขที่ {x.a.titleNo} เลขที่ดิน {x.a.landNo || spcDots(6)} หน้าสำรวจ {x.a.surveyPage || spcDots(6)} {x.loc} เนื้อที่ {x.area} ราคาประเมินราชการตารางวาละ {fmt.money(x.perWa, 0)}.- บาท รวมราคาประเมินที่ดิน {fmt.money(x.landPrice, 0)}.- บาท {x.owner} ผู้ถือกรรมสิทธิ์{x.note ? ' ' + x.note : ''}</P>
          {x.blds.map((b, j) => b.planned ? (
            <P key={j}>เพื่อปลูกสร้าง{b.desc} พื้นที่ใช้สอย {b.area} ตารางเมตร ราคาประเมินตารางเมตรละ {fmt.money(b.perSqm, 0)}.- บาท รวมราคาประเมิน {fmt.money(b.appraisal, 0)}.- บาท{b.note ? ' ' + b.note : ''}</P>
          ) : (
            <P key={j}>พร้อม{b.desc} พื้นที่ใช้สอย {b.area} ตารางเมตร ราคาประเมินตารางเมตรละ {fmt.money(b.perSqm, 0)}.- บาท รวมราคาประเมิน {fmt.money(b.appraisal, 0)}.- บาท ระยะเวลาปลูกสร้าง {b.age} ปี หักค่าเสื่อมราคาร้อยละ {b.depPct} เป็นเงิน {fmt.money(b.depAmt, 0)}.- บาท คงเหลือ {fmt.money(b.residual, 0)}.- บาท</P>
          ))}
          <div style={{ marginTop: 6 }}>{amt(100, x.total)}{amt(x.pct, x.lend)}</div>
        </div>
      ))}
      <div style={{ marginTop: 6, borderTop: '1px solid #111', paddingTop: 4 }}>
        {amt(100, d.collTotal)}{amt(d.lendPct, d.lendTotal)}
      </div>
      <div style={{ marginLeft: '58%', marginTop: 40, breakInside: 'avoid' }}>
        {['งพ.', 'หงพ.', 'ผช.ผจก.(ส)', 'ผจก.สอ.กสท.'].map(t => <div key={t} style={{ display: 'flex', gap: 4, marginTop: 8 }}><Fl w={170}></Fl>{t}</div>)}
        <div style={{ marginTop: 18 }}>วันที่ <Fl w={170}></Fl></div>
      </div>
    </div>
  );
}

// ── ข้อมูลตัวอย่างตามเอกสารจริง (mock) ───────────────────────────────
function spcMockDeed(o) {
  const blds = (o.blds || []).map(b => {
    const depAmt = b.planned ? 0 : b.appraisal * b.depPct / 100;
    return { x: {}, age: 0, depPct: 0, ...b, depAmt, residual: b.appraisal - depAmt };
  });
  const landPrice = o.landPrice;
  const total = landPrice + blds.reduce((s, b) => s + b.residual, 0);
  const pct = o.pct || (blds.length ? 90 : 70);
  const prov = o.prov;
  return {
    a: { titleNo: o.titleNo, landNo: o.landNo, surveyPage: o.surveyPage, locTambon: o.tambon, locAmphoe: o.amphoe, locProvince: prov },
    blds, landPrice, total, pct, lend: Math.round(total * pct / 100), perWa: o.perWa, area: o.area + ' ไร่', owner: o.owner,
    loc: 'ตำบล' + o.tambon + ' อำเภอ' + o.amphoe + ' ' + (prov === 'กรุงเทพมหานคร' ? prov : 'จังหวัด' + prov),
    note: o.note || '', contract: o.contract || null, project: o.project || '',
  };
}
function spcMock(o) {
  const principal = o.rows.reduce((s, r) => s + r.amt, 0);
  const debtRemain = o.rows.reduce((s, r) => s + r.remain, 0);
  const deeds = (o.deeds || []).map(spcMockDeed);
  const collTotal = deeds.reduce((s, x) => s + x.total, 0);
  const lendTotal = deeds.reduce((s, x) => s + x.lend, 0);
  return {
    shareMonthly: 0, loanMonthly: 0, depRow: null,
    lendPct: collTotal ? Math.round(lendTotal / collTotal * 100) : 90,
    newTotal: principal + (o.approve != null ? o.approve : o.amount),
    ...o, principal, debtRemain, deeds, collTotal, lendTotal, today: new Date(o.today),
  };
}
const SPC_MOCK = {
  houseSingle: () => spcMock({
    today: '2026-08-24', docNo: '31.2/69', docDate: '13 สิงหาคม 2569',
    m: { name: 'นายคณารักษ์ ตระกูลธรรม', spouse: 'นางขนภา ตระกูลธรรม' }, spouseOcc: 'แม่บ้าน',
    memNo: '041981', unit: 'ปณ.หนองจอก', age: 46, memYears: 20, salary: 34040,
    amount: 650000, periods: 340, inst: 3600, payType: 'คงยอด', share: 135460, remainIncome: 3295,
    ptDebt: '272/1,702', shareLoan: '700/24,471', purpose: 'ซื้อที่ดินพร้อมบ้านพักอาศัย',
    rows: [
      { no: 'สภ.69-000616', amt: 20000, paid: '1/36', remain: 19528.25, cat: 'special' },
      { no: 'สค.69-005867', amt: 300000, paid: '5/132', remain: 293885.25, cat: 'other' },
      { no: 'สฉ.67-000877', amt: 82119.75, paid: '20/60', remain: 45182.50, cat: 'atm' },
      { no: 'สข.69-002714 (S)', amt: 19000, paid: '0/0', remain: 19000, cat: 'other' },
      { no: 'สจ.68-002161', amt: 500000, paid: '17/144', remain: 468439.75, cat: 'other' },
      { no: 'สน.68-000132', amt: 67300, paid: '9/59', remain: 58263, cat: 'other' },
      { no: 'ส6.69-001203 (D)', amt: 1350000, paid: '6/172', remain: 1318973, cat: 'common' },
      { no: 'ฉฉ.69-000853', amt: 408000, paid: '7/12', remain: 402400, cat: 'emerg' },
    ],
    deeds: [{
      titleNo: '25963', landNo: '2435', surveyPage: '6275', tambon: 'โคกแฝด', amphoe: 'หนองจอก', prov: 'กรุงเทพมหานคร', area: '0-0-54',
      owner: 'นางณัฐชา รักษาพันธ์', perWa: 7800, landPrice: 421200, project: 'บ้านเลขที่ 40/98',
      note: '(หนังสือสัญญาจะซื้อจะขาย ลว.10 ส.ค. 2569 จำนวนเงิน 650,000.00 บาท)',
      contract: { sale: true, date: '10 สิงหาคม 2569', amount: 650000 },
      blds: [{ desc: 'บ้านพักอาศัยตึกชั้นเดียว/บ้านเลขที่ 40/98', area: 80, perSqm: 10400, appraisal: 832000, age: 30, depPct: 60, x: { floors: '1', houseNo: '40/98' } }],
    }],
  }),
  houseMulti: () => spcMock({
    today: '2026-08-03', docNo: '29/69', docDate: '24 ก.ค. 2569',
    m: { name: 'นายอนันต์ บุษบา', spouse: 'นางสาวอนุสรา นาลา' }, spouseOcc: 'ค้าขายผลผลิตทางการเกษตร', spouseIncome: 20000,
    memNo: '036506', unit: 'ส่วนขายและบริการลูกค้า มุกดาหาร/NT', age: 55, memYears: 32, salary: 101235,
    amount: 5000000, approve: 4330000, periods: 230, inst: 29400, payType: 'คงยอด', share: 177660, remainIncome: 6554,
    ptDebt: '9,376/2,025', shareLoan: '-/53,880', lendPct: 88, newTotal: 8324486.65,
    purpose: 'ซื้อที่ดินรวมสองโฉนดและปลูกสร้างบ้านพักอาศัย',
    opinionNote: '(หลังหักชำระหนี้สัญญา พค.65-000151 เงินกู้คงเหลือเพื่อซื้อที่ดินรวมสองโฉนด จำนวนเงิน 368,685.00 บาท และปลูกสร้างบ้านพักอาศัย จำนวนเงิน 2,000,000.00 บาท)',
    left: { buyLand: 368685, buyLandBldg: '', build: 2000000, total: 7974880.90 },
    rows: [
      { no: 'สค.69-002328', amt: 300000, paid: '5/67', remain: 284372.25, cat: 'other' },
      { no: 'สฉ.63-003663', amt: 194486.65, paid: '77/60', remain: 69700.90, cat: 'atm' },
      { no: 'สจ.69-000526 (I)', amt: 500000, paid: '4/66', remain: 478405, cat: 'other' },
      { no: 'ส6.69-000100 (I)', amt: 2000000, paid: '7/69', remain: 1820402.75, cat: 'common' },
      { no: 'พค.65-000151', amt: 3450000, paid: '43/288', remain: 1961315, cat: 'special' },
      { no: 'ฉฉ.68-022108', amt: 1000000, paid: '8/12', remain: 992000, cat: 'emerg' },
    ],
    deeds: [
      { titleNo: '64603', landNo: '330', surveyPage: '6436', tambon: 'คำอาฮวน', amphoe: 'เมืองมุกดาหาร', prov: 'มุกดาหาร', area: '1-0-0',
        owner: 'นายจรูญ ประคำมินทร์', perWa: 300, landPrice: 120000,
        note: '(หนังสือสัญญาจะซื้อจะขายที่ดินรวมสองโฉนด/โฉนดที่ดินเลขที่ 64603,81260 ลว.15 ก.ค. 2569 จำนวนเงิน 1,000,000.00 บาท/หนังสือสัญญาจ้าง ลว.2 ก.ค.2569 จำนวนเงิน 2,115,363.00 บาท)',
        contract: { sale: true, hire: true, date: '15 ก.ค. 2569 / 2 ก.ค. 2569', amount: 3115363 },
        blds: [{ planned: true, desc: 'บ้านพักอาศัยตึกชั้นเดียว', area: 144, perSqm: 12400, appraisal: 1785600, x: { floors: '1' },
          note: '(หนังสือสัญญาจ้าง ลว.2 ก.ค.2569 จำนวนเงิน 2,115,363.- บาท)' }] },
      { titleNo: '81260', landNo: '606', surveyPage: '8773', tambon: 'คำอาฮวน', amphoe: 'เมืองมุกดาหาร', prov: 'มุกดาหาร', area: '0-3-35.4',
        owner: 'นายจรูญ ประคำมินทร์', perWa: 130, landPrice: 43602,
        note: '(หนังสือสัญญาจะซื้อจะขายที่ดินรวมสองโฉนด/โฉนดที่ดินเลขที่ 64603,81260 ลว.15 ก.ค. 2569 จำนวนเงิน 1,000,000.00 บาท)',
        contract: { sale: true, date: '15 ก.ค. 2569', amount: 1000000 } },
      { titleNo: '1358', landNo: '300', surveyPage: '910', tambon: 'เชียงคาน', amphoe: 'เชียงคาน', prov: 'เลย', area: '0-0-97.8',
        owner: 'นายอนันต์ บุษบา', perWa: 7500, landPrice: 733500,
        note: '(ภาระหนี้จำนอง สอ.กสท.สัญญาเลขที่ พค.65-000151 ภาระหนี้จำนองคงเหลือ 1,961,315.00 บาท)',
        contract: { mortgage: true, amount: 1961315 },
        blds: [
          { desc: 'บ้านพักอาศัยครึ่งตึกครึ่งไม้สองชั้น (บ้านเลขที่ 54/1)', area: 192, perSqm: 8600, appraisal: 1651200, age: 34, depPct: 60, x: { floors: '2', structure: 'ครึ่งตึกครึ่งไม้' } },
          { desc: 'บ้านพักอาศัยตึกสองชั้น (บ้านเลขที่ 54/4)', area: 184, perSqm: 10000, appraisal: 1840000, age: 19, depPct: 30, x: { floors: '2' } },
        ] },
      { titleNo: '39822', landNo: '364', surveyPage: '7907', tambon: 'เชียงคาน', amphoe: 'เชียงคาน', prov: 'เลย', area: '0-1-55.4',
        owner: 'นายอนันต์ บุษบา', perWa: 400, landPrice: 62160,
        note: '(ภาระหนี้จำนอง สอ.กสท.สัญญาเลขที่ พค.65-000151 ภาระหนี้จำนองคงเหลือ 1,961,315.00 บาท)', contract: { mortgage: true, amount: 1961315 } },
      { titleNo: '39823', landNo: '365', surveyPage: '7908', tambon: 'เชียงคาน', amphoe: 'เชียงคาน', prov: 'เลย', area: '1-3-47.1',
        owner: 'นายอนันต์ บุษบา', perWa: 250, landPrice: 186775,
        note: '(ภาระหนี้จำนอง สอ.กสท.สัญญาเลขที่ พค.65-000151 ภาระหนี้จำนองคงเหลือ 1,961,315.00 บาท)', contract: { mortgage: true, amount: 1961315 } },
    ],
  }),
  job: () => spcMock({
    today: '2026-07-22', docNo: '25/2569', docDate: '14/07/2569', noPct5: true,
    m: { name: 'นายสมหมาย กาลจักร์', spouse: 'นางจันทร์เพ็ญ กาลจักร์' }, spouseOcc: 'ขายพืชผลทางการเกษตร',
    memNo: '027843', unit: 'เกษียณ', age: 61, memYears: 38, salary: 30000,
    amount: 350000, periods: 95, inst: 3700, monthlyPay: 5187, payType: 'คงต้น', share: 238550, remainIncome: 22813,
    ptDebt: '-/-', shareLoan: '-/2,000', newTotal: 564600, purpose: 'ปลูกพืชเศรษฐกิจหมุนเวียน',
    opinionNote: '(หลังหักชำระหนี้สัญญา พป.67-000024 เงินกู้คงเหลือเพื่อลงทุนประกอบอาชีพจำนวนเงิน 111,600.00 บาท)',
    left: { job: 'ขยายสวนเกษตรปลูกพืชเศรษฐกิจหมุนเวียน', invest: 112000, own: 'ดำเนินการต่อเนื่อง', need: 111600, total: 556161.25 },
    jobPlan: 'ได้มีแผนการลงทุนประกอบอาชีพปลูกพืชเศรษฐกิจหมุนเวียนแทนการทำนาปลูกข้าว จำนวนเงินทุน 112,000.00 บาท/ปัจจุบันนี้นายสมหมาย กาลจักร์ มีรายได้จากการปลูกพืช อาทิ กล้วย มะม่วง ผักต่างๆ และรับซื้อพืชผักและพืชผลการเกษตรจากชาวบ้านใกล้เคียงเพื่อมาขายต่อ รวมถึงแผนการลงทุนโครงการพืชเศรษฐกิจใหม่ ไผ่ตงหวานเพชรน้ำผึ้ง สะเดามัน กล้วยหอมทองปทุม กล้วยน้ำหว้ามะลิอ่อง และฝรั่งกิมจู ดำเนินการบนโฉนดที่ดินเลขที่ 26905 ตำบลหนองโพธิ์ อำเภอหนองหญ้าไซ จังหวัดสุพรรณบุรี เนื้อที่ 4-0-03 ไร่ ซึ่งเป็นกรรมสิทธิ์ของภรรยานายสมหมาย กาลจักร์',
    incomeSrc: [
      'ผู้กู้นายสมหมาย กาลจักร์ ทำบันทึกรายได้และ statement ธนาคารกสิกรไทย สาขาเซ็นทรัลนอร์ทวิลล์ ย้อนหลัง 12 เดือน มีเงินหมุนเวียนมากกว่า 30,000.00 บาท/เดือน เพื่อมาประกอบการพิจารณา',
      'ปัจจุบันนายสมหมาย กาลจักร์ และภรรยา ปลูกพืชผลทางการเกษตรและได้นำพืชผลการเกษตรจากสวนที่อำเภอหนองหญ้าไซ ได้แก่ มะม่วง กล้วย ฝรั่ง ผักพื้นบ้าน มะละกอ อื่นๆ มาขายวันเสาร์-อาทิตย์ ที่หน้าหมู่บ้านจิรกานต์ (ถนนบางกรวย-ไทรน้อย) มีรายได้เฉลี่ยเดือนละ 30,000.00 บาท',
      'นายสมหมาย กาลจักร์ มีบุตรชาย ช่วยผ่อนชำระภาระหนี้เงินกู้ ปัจจุบันบุตรชายทำงานที่บริษัท แอล เอน ดีไซน์ หกเก้า สตูดิโอ จำกัด มีเงินเดือน 35,000.00 บาท (รับสุทธิ 33,625.00 บาท) และมีร้านกาแฟสดเป็นของตนเอง มีรายได้เฉลี่ยเดือนละ 20,000.00 บาท',
    ],
    rows: [
      { no: 'พป.67-000024', amt: 300000, paid: '28/137', remain: 238400, cat: 'special' },
      { no: 'สห.68-006209', amt: 214600, paid: '12/128', remain: 206161.25, cat: 'common' },
    ],
    deeds: [{
      titleNo: '26741', landNo: '123', surveyPage: '17019', tambon: 'ไทรน้อย', amphoe: 'ไทรน้อย', prov: 'นนทบุรี', area: '0-0-56.8',
      owner: 'นายสมหมาย กาลจักร์', perWa: 20000, landPrice: 1136000,
      blds: [{ desc: 'บ้านพักอาศัยตึกสองชั้น/บ้านเลขที่ 90/180', area: 110, perSqm: 11500, appraisal: 1265000, age: 18, depPct: 36, x: { floors: '2', houseNo: '90/180' } }],
    }],
  }),
  car: () => spcMock({
    today: '2026-09-15', docNo: '33/69', docDate: '10 กันยายน 2569',
    m: { name: 'นายวีระพงษ์ แสงทอง', spouse: 'นางสุนิสา แสงทอง' }, spouseOcc: 'พนักงานบริษัท', spouseIncome: 18000,
    memNo: '052417', unit: 'ปณ.บางพลี', age: 41, memYears: 15, salary: 42500,
    amount: 600000, periods: 84, inst: 8700, payType: 'คงยอด', share: 215000, remainIncome: 9850,
    ptDebt: '-/-', shareLoan: '1,500/6,200', purpose: 'ซื้อรถยนต์ใหม่',
    car: { type: 'ปิคอัพ', brand: 'Toyota', model: 'Hilux Revo 2.4 Entry', cond: 'ใหม่', price: 789000, dealer: '(ใบเสนอราคา บจก.โตโยต้าสมุทรปราการ ลว.5 ก.ย. 2569)' },
    depRow: { depType: 'ออมทรัพย์พิเศษ', accNo: '001-2-52417-0', accName: 'นายวีระพงษ์ แสงทอง', balance: 85400 },
    rows: [
      { no: 'ส6.67-003318', amt: 450000, paid: '22/120', remain: 367500, cat: 'common' },
      { no: 'ฉฉ.69-001174', amt: 50000, paid: '6/12', remain: 25000, cat: 'emerg' },
    ],
    deeds: [{
      titleNo: '48812', landNo: '512', surveyPage: '9021', tambon: 'บางแก้ว', amphoe: 'บางพลี', prov: 'สมุทรปราการ', area: '0-0-25',
      owner: 'นายวีระพงษ์ แสงทอง', perWa: 22000, landPrice: 550000,
      blds: [{ desc: 'บ้านพักอาศัยตึกสองชั้น/บ้านเลขที่ 77/12', area: 120, perSqm: 9800, appraisal: 1176000, age: 10, depPct: 20, x: { floors: '2', houseNo: '77/12' } }],
    }],
  }),
};

// dropdown มาตรฐานของเบราว์เซอร์
function SpcSelect({ value, onChange, options, width }) {
  return (
    <select className="cfg-input" style={{ width }} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
function SpcSelectCustom({ value, onChange, options, width }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc, true); };
  }, [open]);
  const cur = options.find(o => o.v === value) || options[0] || { l: '' };
  return (
    <div ref={ref} style={{ position: 'relative', width }}>
      <button type="button" className="cfg-input" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, textAlign: 'left', cursor: 'pointer', background: '#fff' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cur.l}</span>
        <Icon name="chevDown" size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, minWidth: '100%', zIndex: 20, background: '#fff', borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,.15)', padding: '4px 0' }}>
          {options.map(o => (
            <div key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              style={{ padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap', background: o.v === value ? 'var(--brand-100, #EAFEF2)' : '#fff', fontWeight: o.v === value ? 600 : 400 }}
              onMouseEnter={e => { if (o.v !== value) e.currentTarget.style.background = '#fafafa'; }}
              onMouseLeave={e => { e.currentTarget.style.background = o.v === value ? 'var(--brand-100, #EAFEF2)' : '#fff'; }}>{o.l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ชุดเอกสาร + ตัวเลือก (ไม่พิมพ์แถบเลือก) ───────────────────────────
function SpecialContractPrintSet({ f, calc }) {
  const formD = React.useMemo(() => spcBuild(f, calc), [f, calc]);
  const [kind, setKind] = React.useState(() => spcKindFromForm(f));
  const [src, setSrc] = React.useState('form');
  const [deedMode, setDeedMode] = React.useState('auto');
  const mode = src === 'sample' && deedMode === 'auto' ? 'single' : deedMode;
  const multi = kind === 'house' && (mode === 'multi' || (mode === 'auto' && formD.deeds.length > 1));
  const d = React.useMemo(() => src === 'sample'
    ? SPC_MOCK[kind === 'house' ? (multi ? 'houseMulti' : 'houseSingle') : kind]()
    : formD, [src, kind, multi, formD]);
  const purpose = d.purpose != null ? d.purpose : kind === 'house'
    ? (multi ? 'ซื้อที่ดินรวม' + (SPC_TH_NUM[Math.min(d.deeds.length, 9)] || '') + 'โฉนดและปลูกสร้างบ้านพักอาศัย' : 'ซื้อที่ดินพร้อมบ้านพักอาศัย')
    : kind === 'car' ? 'ซื้อยานพาหนะ' : '';
  return (
    <>
      <div className="lrq-noprint" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid rgba(0,0,0,.1)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>โครงการเงินกู้
          <SpcSelect width={190} value={kind} onChange={setKind} options={Object.entries(SPC_KIND).map(([k, v]) => ({ v: k, l: v.label }))} />
        </div>
        {kind === 'house' && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>หลักทรัพย์
            <SpcSelect width={210} value={mode} onChange={setDeedMode} options={[
              ...(src === 'form' ? [{ v: 'auto', l: 'อัตโนมัติ (' + (formD.deeds.length > 1 ? 'โฉนดมากกว่า 1 แปลง' : 'โฉนด 1 แปลง') + ')' }] : []),
              { v: 'single', l: 'โฉนด 1 แปลง' }, { v: 'multi', l: 'โฉนดมากกว่า 1 แปลง' }]} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>ข้อมูล
          <SpcSelect width={200} value={src} onChange={setSrc} options={[{ v: 'form', l: 'จากหน้าจอใบคำขอกู้' }, { v: 'sample', l: 'ตัวอย่างตามเอกสารจริง' }]} />
        </div>
        <span style={{ color: 'rgba(0,0,0,.55)' }}>คลิกข้อความในเอกสารเพื่อแก้ไขก่อนพิมพ์</span>
      </div>
      <div key={kind + String(multi) + src} contentEditable suppressContentEditableWarning spellCheck={false} style={{ outline: 'none' }}>
        <SpcMemo d={d} kind={kind} multi={multi} purpose={purpose} />
        <SpcDetail d={d} kind={kind} multi={multi} />
        {multi && <SpcDeedAppendix d={d} />}
      </div>
    </>
  );
}

Object.assign(window, { SpecialContractPrintSet, SpcSelect, spcBuild, spcBaht, spcLongDate });
