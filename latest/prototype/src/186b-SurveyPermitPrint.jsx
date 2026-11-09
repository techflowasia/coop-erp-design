// ════════════════════════════════════════════════════════════════════
//  นัดหมายออกสำรวจหลักทรัพย์ — พิมพ์เอกสารขออนุญาตออกสำรวจ
//  เลือกสมาชิก → เลือกนัดหมาย (หลักทรัพย์) → พรีวิว/พิมพ์ "บันทึกข้อความ"
//  รูปแบบ: โฉนดที่ดิน (+ สิ่งปลูกสร้างที่ผูกกับโฉนด) · ห้องชุด
//  ข้อมูลหลักทรัพย์ดึงจากเมนูบันทึกหลักทรัพย์ (lcOf)
// ════════════════════════════════════════════════════════════════════

const SPM_PURPOSES = ['ซื้อที่ดินพร้อมอาคาร', 'ซื้อห้องชุด', 'ซื้อที่ดิน', 'ปลูกสร้างอาคาร', 'ไถ่ถอนที่ดินและหรืออาคาร', 'ต่อเติมปรับปรุงอาคาร'];
const SPM_MONTH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const spmNum = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')) || 0;
// โครงการเงินกู้พิเศษ (จากเมนูโครงการเงินกู้ — ประเภท LP-30)
const spmProjects = () => (window.lpjProjectsUsingType ? window.lpjProjectsUsingType('LP-30') : []).filter(p => p.enabled);
const spmLoanName = (projName) => { const n = String(projName || '').trim(); return !n ? 'เงินพิเศษเพื่อการเคหะสงเคราะห์' : n.startsWith('เงินกู้') ? 'เงิน' + n.slice(7) : 'เงิน' + n; };
// เรื่อง: ขอออกสำรวจหลักประกันเงินกู้เพื่อ{ชื่อโครงการ} ({วัตถุประสงค์})
const spmSubject = (projName, purpose) => 'ขอออกสำรวจหลักประกัน' + (String(projName || '').trim() || 'เงินกู้พิเศษ') + ' (' + (purpose || '') + ')';
// ผู้จัดทำเอกสาร = ผู้ใช้ที่ Login
const spmUser = () => { const u = window.CURRENT_USER || {}; return { name: u.name || 'ผู้ใช้งานระบบ', pos: u.position || 'งพ.' }; };
const spmBaht0 = (n) => fmt.money(n, 0) + '.-';
const spmDots = (n) => '.'.repeat(n || 16);
const spmDate = (d) => { d = new Date(d); return d.getDate() + ' ' + SPM_MONTH[d.getMonth()] + ' ' + (d.getFullYear() + 543); };
const spmProv = (p) => !p ? 'จังหวัด' + spmDots(12) : p === 'กรุงเทพมหานคร' ? p : 'จังหวัด' + p;
const spmOffice = (prov, br) => 'สำนักงานที่ดิน' + (prov === 'กรุงเทพมหานคร' ? prov : 'จังหวัด' + (prov || spmDots(10))) + (br ? ' สาขา' + br : '');

// จับคู่นัดหมาย → หลักทรัพย์ (+ โฉนด/สิ่งปลูกสร้างที่เกี่ยวข้อง)
function spmResolve(appt) {
  const title = (r) => (window.lcAssetTitle ? window.lcAssetTitle(r) : '');
  let pool = window.lcOf ? window.lcOf(appt.memberCode) : [];
  let asset = pool.find(r => (appt.assetId && r.id === appt.assetId) || title(r) === appt.assetTitle);
  if (!asset) {
    Object.keys(window.LC_BY_MEMBER || {}).some(code => {
      const list = window.lcOf(code);
      const hit = list.find(r => title(r) === appt.assetTitle);
      if (hit) { pool = list; asset = hit; }
      return !!hit;
    });
  }
  if (!asset) return { kind: 'unknown', asset: null };
  if (asset.type === 'ห้องชุด') return { kind: 'condo', asset };
  const TT = window.LC_TITLE_TYPES || ['โฉนด'];
  let land = TT.includes(asset.type) ? asset : null;
  let bld = asset.type === 'สิ่งปลูกสร้าง' ? asset : null;
  if (bld && !land) land = pool.find(r => TT.includes(r.type) && r.titleNo && r.titleNo === ((bld.building || {}).refTitleNo || bld.refTitleNo)) || null;
  if (land && !bld) bld = pool.find(r => r.type === 'สิ่งปลูกสร้าง' && ((r.building || {}).refTitleNo || r.refTitleNo) === land.titleNo) || null;
  return { kind: 'land', asset, land, bld };
}

function spmBldDesc(b) {
  const s = b.structure || '';
  const mat = /ครึ่ง/.test(s) ? 'ครึ่งตึกครึ่งไม้' : (/ไม้/.test(s) && !/คอนกรีต/.test(s)) ? 'ไม้' : 'ตึก';
  const fl = b.floors === '1' ? 'ชั้นเดียว' : b.floors === '2' ? 'สองชั้น' : b.floors ? b.floors + ' ชั้น' : '';
  return 'บ้านพักอาศัย' + mat + fl + (b.houseNo ? '/บ้านเลขที่ ' + b.houseNo : '');
}

// ── ข้อความหลักประกัน (+ ตารางสิ่งปลูกสร้าง) ของนัดหมาย 1 รายการ ──────
function spmCollateral(appt) {
  const r = spmResolve(appt);
  let coll = null, bldTable = null;
  if (r.kind === 'condo') {
    const a = r.asset, c = a.condo || {};
    const area = spmNum(c.areaSqm), per = spmNum(a.coopPerSqm), total = spmNum(a.coopPrice) || area * per;
    coll = `หนังสือกรรมสิทธิ์ห้องชุดเลขที่ ${c.roomNo || spmDots(8)} ชั้นที่ ${c.floor || spmDots(3)} อาคารเลขที่ ${c.buildingNo || '-'} ชื่ออาคารชุด ${c.roomName || spmDots(16)} โฉนดที่ดินเลขที่ ${c.titleNos || a.refTitleNo || spmDots(8)} ตำบล${c.tambon || spmDots(10)} อำเภอ${c.amphoe || spmDots(10)} ${spmProv(c.province)} เนื้อที่ประมาณ ${c.areaSqm || spmDots(6)} ตารางเมตร โดยแนบหนังสือรับรองราคาประเมินที่ดินออกโดย${spmOffice(a.refLandOfficeProvince || c.province, a.refLandOfficeBranch)} ราคาประเมินราชการตารางเมตรละ ${per ? spmBaht0(per) : spmDots(8)} บาท รวมราคาประเมิน จำนวนเงิน ${total ? spmBaht0(total) : spmDots(10)} บาท`;
  } else if (r.kind === 'land' && r.land) {
    const a = r.land;
    const wa = String(a.wa || '0').split('.')[0].padStart(2, '0') + (String(a.wa || '').includes('.') ? '.' + String(a.wa).split('.')[1] : '');
    const perWa = spmNum(a.govPerWa), landTotal = spmNum(a.govPrice) || spmNum(a.summaryPrice);
    coll = `โฉนดที่ดินเลขที่ ${a.titleNo || spmDots(8)} เลขที่ดิน ${a.landNo || spmDots(6)} หน้าสำรวจ ${a.surveyPage || spmDots(6)} ตำบล${a.locTambon || spmDots(10)} อำเภอ${a.locAmphoe || spmDots(10)} ${spmProv(a.locProvince)} เนื้อที่รวม ${a.rai || 0}-${a.ngan || 0}-${wa} ไร่ โดยแนบหนังสือรับรองราคาประเมินที่ดินออกโดย${spmOffice(a.landOfficeProvince || a.locProvince, a.landOfficeBranch)} ราคาประเมินราชการตารางวาละ ${perWa ? spmBaht0(perWa) : spmDots(8)} บาท รวมจำนวนเงิน ${landTotal ? spmBaht0(landTotal) : spmDots(10)} บาท` + (r.bld ? ' พร้อม' + spmBldDesc(r.bld.building || {}) : '');
    if (r.bld) {
      const b = r.bld.building || {};
      const area = spmNum(b.usableArea) || spmNum(b.width) * spmNum(b.length);
      const appraisal = spmNum(b.buildAppraisal);
      const per = spmNum(b.appraisalPerSqm) || (area ? Math.round(appraisal / area) : 0);
      const tot = appraisal || per * area;
      const td = { padding: '0 10px 0 0', verticalAlign: 'baseline' };
      bldTable = (
        <table style={{ marginLeft: '8%', borderCollapse: 'collapse', marginTop: 4, marginBottom: 4, fontSize: 'inherit' }}>
          <tbody>
            <tr><td style={{ ...td, width: 110 }}>กว้าง</td><td style={{ ...td, width: 60, textAlign: 'center' }}>{b.width || '-'}</td><td style={td}>เมตร</td><td /><td /></tr>
            <tr><td style={td}>ยาว</td><td style={{ ...td, textAlign: 'center' }}>{b.length || '-'}</td><td style={td}>เมตร</td><td /><td /></tr>
            <tr><td style={td}>พื้นที่ใช้สอย</td><td style={{ ...td, textAlign: 'center' }}>{area || '-'}</td><td style={{ ...td, width: 110 }}>ตารางเมตร</td>
              <td style={{ ...td, width: 220 }}>ราคาประเมินตารางเมตรละ</td><td style={{ ...td, textAlign: 'right' }}>{per ? spmBaht0(per) : '-'} บาท</td></tr>
            <tr><td /><td /><td /><td style={td}>รวมราคาประเมิน</td><td style={{ ...td, textAlign: 'right' }}>{tot ? spmBaht0(tot) : '-'} บาท</td></tr>
          </tbody>
        </table>
      );
    }
  } else {
    coll = `${appt.assetTitle || ''} ${spmDots(90)}`;
  }
  const key = r.kind === 'land' && r.land ? 'L:' + r.land.id : r.asset ? 'A:' + r.asset.id : 'X:' + appt.id;
  return { key, coll, bldTable };
}
// รวมหลักประกันหลายรายการ (ตัดรายการซ้ำ เช่น เลือกทั้งโฉนดและสิ่งปลูกสร้างบนโฉนดเดียวกัน)
const spmCollaterals = (appts) => {
  const seen = {};
  return appts.map(spmCollateral).filter(c => (seen[c.key] ? false : (seen[c.key] = true)));
};

// ── เอกสาร "บันทึกข้อความ" ขออนุญาตออกสำรวจ (หลายหลักทรัพย์ในใบเดียว) ──
function SurveyPermitDoc({ appts, member, opts }) {
  const appt = appts[0];
  const user = spmUser();
  const isHead = user.pos === 'หงพ.';
  const loanName = spmLoanName(opts.projectName);
  const colls = spmCollaterals(appts);
  const today = window.DEPOSIT_WORKING_DATE ? new Date(window.DEPOSIT_WORKING_DATE) : new Date();
  const amt = spmNum(opts.amount);
  const memNo = String(appt.memberCode || '').replace(/\D/g, '').padStart(6, '0').slice(-6);
  const unit = String((member && (member.unit || member.dept)) || '').split('·').pop().trim() || spmDots(16);
  const debt = opts.hasDebt
    ? `มีภาระหนี้กับสหกรณ์จำนวน ${opts.debtCount || spmDots(4)} สัญญา จำนวนเงินต้น ${opts.debtPrincipal ? fmt.money(spmNum(opts.debtPrincipal)) : spmDots(10)} บาท เงินกู้คงเหลือ ${opts.debtRemain ? fmt.money(spmNum(opts.debtRemain)) : spmDots(10)} บาท`
    : 'ไม่มีภาระหนี้กับสหกรณ์';
  const sign = (name, pos, date) => (
    <div style={{ marginLeft: '42%', marginTop: 46, textAlign: 'center', breakInside: 'avoid' }}>
      <div>({name})</div><div>{pos}</div>{date && <div>{date}</div>}
    </div>
  );
  return (
    <div className="spc-page" style={{ width: '210mm', minHeight: '297mm', padding: '14mm 18mm', boxSizing: 'border-box', background: '#fff', color: '#111',
      boxShadow: '0 4px 20px rgba(0,0,0,.3)', margin: '0 auto 18px', fontFamily: 'Sarabun, sans-serif', fontSize: 14.5, lineHeight: 1.75 }}>
      <img src={window.__resources && window.__resources.logo} alt="" style={{ width: 64, height: 64, objectFit: 'contain', display: 'block' }} />
      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, marginTop: -8 }}>บันทึกข้อความ</div>
      <div>หน่วยงาน &nbsp;สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)</div>
      <div>แผนกเงินกู้พิเศษ โทร.0-2104-4344 ต่อ 1121,1122</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div>ที่ &nbsp;&nbsp;&nbsp;{spmDots(8)}/{today.getFullYear() + 543}</div><div>วันที่ &nbsp;{spmDate(today)}</div>
      </div>
      <div style={{ borderBottom: '1px solid #111', paddingBottom: 2 }}><b>เรื่อง</b> &nbsp;{spmSubject(opts.projectName, opts.purpose)}</div>
      <div style={{ marginTop: 4 }}>1.เรียน &nbsp;ผจก.สอ.กสท. ผ่าน ผช.ผจก.(ส.){isHead ? '' : ',หงพ.'}</div>
      <p style={{ margin: '12px 0 0', textIndent: '3em', textAlign: 'justify', textWrap: 'pretty' }}>
        ด้วย{appt.memberName} สมาชิกเลขที่ {memNo} สังกัด {unit} ได้ยื่นคำขอกู้{loanName} ({opts.purpose}) จำนวนเงินขอกู้ {amt ? spmBaht0(amt) : spmDots(10)} บาท ({amt && window.bahtText ? window.bahtText(amt) : spmDots(20)}) {debt} {colls.length > 1 ? `หลักประกันเงินกู้จำนวน ${colls.length} รายการ ดังนี้` : 'หลักประกันเงินกู้' + colls[0].coll}
      </p>
      {colls.length > 1 ? colls.map((c, i) => (
        <div key={c.key} style={{ breakInside: 'avoid' }}>
          <p style={{ margin: '4px 0 0', textIndent: '3em', textAlign: 'justify', textWrap: 'pretty' }}>{i + 1}. {c.coll}</p>
          {c.bldTable}
        </div>
      )) : colls[0].bldTable}
      <p style={{ margin: '4px 0 0', textIndent: '3em' }}>เพื่อเป็นหลักประกันเงินกู้</p>
      {sign(user.name, user.pos)}
      <div style={{ marginTop: 54 }}>2.เรียน &nbsp;ผช.ผจก.(ส.),หงพ.</div>
      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 15.5 }}>โปรดไปดำเนินการสำรวจหลักประกันเงินกู้แล้วรายงานให้ทราบด้วย</div>
      {sign('นายมรุต หมุดเพ็ชร์', 'ผจก.สอ.กสท.', spmDots(6) + ' ' + SPM_MONTH[today.getMonth()] + ' ' + (today.getFullYear() + 543))}
    </div>
  );
}

// ── Overlay พรีวิว + พิมพ์ ───────────────────────────────────────────
function SurveyPermitPrintOverlay({ appts, member, opts, onClose }) {
  const clear = () => document.documentElement.classList.remove('lrq-printing');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { clear(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); clear(); };
  }, []);
  const doPrint = () => {
    document.documentElement.classList.add('lrq-printing');
    const done = () => { clear(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) {}
    setTimeout(clear, 1500);
  };
  const close = () => { clear(); onClose(); };
  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">พรีวิว — เอกสารขออนุญาตออกสำรวจ · {appts[0].memberName} · {appts.length > 1 ? appts.length + ' หลักทรัพย์' : appts[0].assetTitle}</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>คลิกข้อความเพื่อแก้ไขก่อนพิมพ์</span>
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal" contentEditable suppressContentEditableWarning spellCheck={false} style={{ outline: 'none' }}>
          <SurveyPermitDoc appts={appts} member={member} opts={opts} />
        </div>
      </div>
    </div>
  );
}

// ── ดึงค่าตั้งต้นของเอกสาร: วัตถุประสงค์ · จำนวนเงินขอกู้ · ภาระหนี้ ─────
//  จำนวนเงิน: ใบบันทึกจ่ายเงินกู้พิเศษ (มีเลขที่ใบคำขอ) → คำขอกู้ CRM → กรอกเอง
//  ภาระหนี้: ทะเบียนสัญญาเงินกู้ของสมาชิก (สัญญาที่ยังมียอดคงเหลือ)
function spmMemberDebts(code) {
  const demo = window.LR_DEMO;
  if (demo && demo.member && demo.member.code === code) {
    const rows = ((demo.detailReport || {}).loanContracts || []).map(c => ({ no: c.contract, principal: c.loanAmount, remain: c.remaining }));
    (demo.offsetLoans || []).forEach(o => { if (!rows.some(r => r.no.split(' ')[0] === o.contract)) rows.push({ no: o.contract, principal: o.approved, remain: o.remaining }); });
    return { rows: rows.filter(r => spmNum(r.remain) > 0), src: 'ทะเบียนสัญญาเงินกู้ของสมาชิก' };
  }
  const rows = (window.lmMemberContracts ? window.lmMemberContracts(code) : []).map(c => ({ no: c.no, principal: null, remain: c.balance })).filter(r => r.remain > 0);
  return { rows, src: 'ทะเบียนสัญญาเงินกู้ของสมาชิก' };
}
function spmPurpose(appts) {
  const rs = appts.map(spmResolve);
  const allCondo = rs.every(r => r.kind === 'condo');
  const allBare = rs.every(r => r.kind === 'land' && !r.bld);
  const purpose = allCondo ? 'ซื้อห้องชุด' : allBare ? 'ซื้อที่ดิน' : 'ซื้อที่ดินพร้อมอาคาร';
  const lbl = (r) => r.kind === 'condo' ? 'ห้องชุด' : r.kind === 'land' ? (r.bld ? 'โฉนด + สิ่งปลูกสร้าง' : 'โฉนดที่ดินเปล่า') : '';
  const kinds = [...new Set(rs.map(lbl).filter(Boolean))];
  return { purpose, src: 'ค่าเริ่มต้นตามประเภทหลักทรัพย์' + (kinds.length ? ' (' + kinds.join(', ') + ')' : '') };
}
function spmDefaults(appt) {
  const r = spmResolve(appt);
  const purpose = spmPurpose([appt]).purpose;
  const SPECIAL = ['LP-30'];
  const q = (window.LR_CRM_QUEUE || []).filter(x => x.memberCode === appt.memberCode && SPECIAL.includes(x.productId) && x.status !== 'rejected')
    .sort((a, b) => (b.reqNo ? 1 : 0) - (a.reqNo ? 1 : 0) || String(b.sentAt).localeCompare(String(a.sentAt)));
  const hit = q[0];
  const d = spmMemberDebts(appt.memberCode);
  const principal = d.rows.every(x => x.principal != null) ? d.rows.reduce((s, x) => s + spmNum(x.principal), 0) : null;
  const remain = d.rows.reduce((s, x) => s + spmNum(x.remain), 0);
  const projs = spmProjects();
  const proj = projs.find(p => hit && p.id === hit.projectId) || projs.find(p => p.id === 'PJ-SPWELF') || projs[0];
  return {
    opts: {
      projectId: proj ? proj.id : '', projectName: proj ? proj.name : '',
      purpose,
      amount: hit ? String(hit.amount) : '',
      hasDebt: d.rows.length > 0,
      debtCount: d.rows.length ? String(d.rows.length) : '',
      debtPrincipal: principal != null && d.rows.length ? String(principal) : '',
      debtRemain: d.rows.length ? String(remain) : '',
    },
    src: {
      project: hit && proj && hit.projectId === proj.id ? 'จากคำขอกู้ ' + (hit.reqNo || hit.crmNo) : 'ค่าเริ่มต้น — เลือกโครงการตามคำขอกู้',
      purpose: 'ค่าเริ่มต้นตามประเภทหลักทรัพย์' + (r.kind === 'condo' ? ' (ห้องชุด)' : r.kind === 'land' ? (r.bld ? ' (โฉนด + สิ่งปลูกสร้าง)' : ' (โฉนดที่ดินเปล่า)') : ''),
      amount: hit ? (hit.reqNo ? 'จากใบบันทึกจ่ายเงินกู้พิเศษ ' + hit.reqNo : 'จากคำขอกู้ ' + hit.crmNo) : 'ไม่พบใบบันทึกจ่าย/คำขอกู้ — กรอกเอง',
      debt: d.rows.length ? 'จาก' + d.src + ' · ' + d.rows.map(x => x.no).join(', ') : 'จาก' + d.src + ' · ไม่มีสัญญาค้าง',
      principal: d.rows.length && principal == null ? 'ไม่มีข้อมูลเงินต้นในทะเบียน — กรอกเอง' : '',
    },
  };
}

// ── Modal: เลือกสมาชิก → เลือกนัดหมาย → พิมพ์ ─────────────────────────
function SurveyPermitPrintModal({ appts, onClose }) {
  const survey = appts.filter(a => a.type === 'survey');
  const source = React.useMemo(() => {
    const seen = {};
    survey.forEach(a => {
      if (seen[a.memberCode]) return;
      const full = (window.MEMBERS_LIST || []).find(x => x.code === a.memberCode) || {};
      seen[a.memberCode] = { ...full, code: a.memberCode, name: a.memberName };
    });
    return Object.values(seen);
  }, [appts]);
  const [member, setMember] = useState(null);
  const [selIds, setSelIds] = useState([]);
  const [opts, setOpts] = useState({ projectId: '', projectName: '', purpose: 'ซื้อที่ดินพร้อมอาคาร', amount: '', hasDebt: false, debtCount: '', debtPrincipal: '', debtRemain: '' });
  const [preview, setPreview] = useState(false);
  const [src, setSrc] = useState({});
  const list = member ? survey.filter(a => a.memberCode === member.code).sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time)) : [];
  const sels = list.filter(a => selIds.includes(a.id));
  const setO = (k, v) => setOpts(p => ({ ...p, [k]: v }));
  const toggleAppt = (a) => {
    const next = selIds.includes(a.id) ? selIds.filter(x => x !== a.id) : [...selIds, a.id];
    setSelIds(next);
    const picked = list.filter(x => next.includes(x.id));
    if (!picked.length) return;
    const pu = spmPurpose(picked);
    if (selIds.length === 0) { const d = spmDefaults(picked[0]); setOpts({ ...d.opts, purpose: pu.purpose }); setSrc({ ...d.src, purpose: pu.src }); }
    else { setOpts(p => ({ ...p, purpose: pu.purpose })); setSrc(p => ({ ...p, purpose: pu.src })); }
  };
  const allOn = list.length > 0 && sels.length === list.length;
  const toggleAll = () => {
    if (allOn) { setSelIds([]); return; }
    const pu = spmPurpose(list);
    if (!selIds.length) { const d = spmDefaults(list[0]); setOpts({ ...d.opts, purpose: pu.purpose }); setSrc({ ...d.src, purpose: pu.src }); }
    else { setOpts(p => ({ ...p, purpose: pu.purpose })); setSrc(p => ({ ...p, purpose: pu.src })); }
    setSelIds(list.map(a => a.id));
  };

  if (preview && sels.length) return <SurveyPermitPrintOverlay appts={sels} member={member} opts={opts} onClose={() => setPreview(false)} />;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card sv-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>พิมพ์เอกสารขออนุญาตออกสำรวจ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-grid c2">
            <SvField label="เลขสมาชิก">
              <ErpMemberPicker member={member} onPick={(m) => { setMember(m); setSelIds([]); }} source={source}
                               title="ค้นหาสมาชิก — ที่มีนัดหมายออกสำรวจ" placeholder="เลขสมาชิก…" />
            </SvField>
            <SvField label="ชื่อ-นามสกุล"><input className="cfg-input lrq-ro" value={member ? member.name : ''} placeholder="โปรดเลือกสมาชิก" readOnly /></SvField>
          </div>

          <div className="sv-sec" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>รายการนัดหมายออกสำรวจ</span>{member ? <span className="sv-sec-count">{list.length}</span> : null}
            <span style={{ flex: 1 }} />
            {member && list.length > 1 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, fontWeight: 400, color: 'var(--text-2, rgba(0,0,0,.65))' }}>
                <span>เลือกแล้ว {sels.length}/{list.length}</span>
                <button className="btn sm" onClick={toggleAll}>{allOn ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</button>
              </span>
            )}
          </div>
          {!member ? (
            <div className="sv-empty">เลือกสมาชิกเพื่อดูรายการนัดหมาย</div>
          ) : list.length === 0 ? (
            <div className="sv-empty">สมาชิกรายนี้ยังไม่มีนัดหมายออกสำรวจ</div>
          ) : (
            <div className="sv-asset-list">
              {list.map(a => {
                const on = selIds.includes(a.id);
                const r = spmResolve(a);
                return (
                  <div key={a.id} className={"sv-asset" + (on ? " done" : "")}>
                    <div className="sv-asset-head" role="checkbox" aria-checked={on} onClick={() => toggleAppt(a)}>
                      <span className={"sv-asset-radio" + (on ? " on" : "")} style={{ borderRadius: 4 }}>{on && <Icon name="check" size={11} />}</span>
                      <div className="sv-asset-info">
                        <div className="sv-asset-t">{a.assetTitle}<span className="sv-asset-type">ประเภท : {r.asset ? r.asset.type : '—'}{r.kind === 'land' && r.bld ? ' + สิ่งปลูกสร้าง' : ''}</span></div>
                        <div className="sv-asset-chips">
                          <span className="sv-chip"><Icon name="calendar" size={11} /> {svFmtThai(a.date)}</span>
                          <span className="sv-chip"><Icon name="history" size={11} /> {a.time ? a.time + ' น.' : 'ไม่ระบุเวลา'}</span>
                          <span className="sv-chip"><Icon name="user" size={11} /> {a.officer || 'ยังไม่ระบุ'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sels.length > 0 && (
            <>
              <div className="sv-sec" style={{ marginTop: 14 }}>ข้อมูลในเอกสาร</div>
              <div className="lrq-grid c2">
                <SvField label="โครงการเงินกู้">
                  <select className="cfg-input" value={opts.projectId} onChange={e => { const pj = spmProjects().find(x => x.id === e.target.value); setOpts(p => ({ ...p, projectId: e.target.value, projectName: pj ? pj.name : '' })); }}>
                    <option value="">--- เลือกโครงการ ---</option>
                    {spmProjects().map(pj => <option key={pj.id} value={pj.id}>{pj.code} : {pj.name}</option>)}
                  </select>
                  {src.project && <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>{src.project}</div>}
                </SvField>
                <SvField label="ผู้จัดทำเอกสาร">
                  <input className="cfg-input lrq-ro" readOnly value={spmUser().name + ' · ' + spmUser().pos} />
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>จากผู้ใช้ที่ Login{spmUser().pos === 'หงพ.' ? ' · หัวหน้าเงินกู้พิเศษ ไม่ต้องเรียนผ่าน หงพ.' : ' · เรียนผ่าน หงพ.'}</div>
                </SvField>
                <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: 'rgba(0,0,0,.65)', padding: '2px 0 4px' }}>
                  เรื่อง : <b style={{ color: 'rgba(0,0,0,.88)', fontWeight: 600 }}>{spmSubject(opts.projectName, opts.purpose)}</b>
                </div>
                <SvField label="วัตถุประสงค์">
                  <select className="cfg-input" value={opts.purpose} onChange={e => setO('purpose', e.target.value)}>
                    {SPM_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {src.purpose && <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>{src.purpose}</div>}
                </SvField>
                <SvField label="จำนวนเงินขอกู้ (บาท)"><input className="cfg-input" inputMode="decimal" value={opts.amount} placeholder="0.00" onChange={e => setO('amount', e.target.value)} />{src.amount && <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>{src.amount}</div>}</SvField>
                <SvField label="ภาระหนี้กับสหกรณ์">
                  <select className="cfg-input" value={opts.hasDebt ? '1' : '0'} onChange={e => setO('hasDebt', e.target.value === '1')}>
                    <option value="0">ไม่มีภาระหนี้</option><option value="1">มีภาระหนี้</option>
                  </select>
                  {src.debt && <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>{src.debt}</div>}
                </SvField>
                {opts.hasDebt && <SvField label="จำนวนสัญญา"><input className="cfg-input" inputMode="numeric" value={opts.debtCount} onChange={e => setO('debtCount', e.target.value)} /></SvField>}
                {opts.hasDebt && <SvField label="จำนวนเงินต้น (บาท)"><input className="cfg-input" inputMode="decimal" value={opts.debtPrincipal} placeholder="0.00" onChange={e => setO('debtPrincipal', e.target.value)} />{src.principal && <div style={{ fontSize: 11.5, color: 'var(--text-muted, rgba(0,0,0,.5))', marginTop: 3 }}>{src.principal}</div>}</SvField>}
                {opts.hasDebt && <SvField label="เงินกู้คงเหลือ (บาท)"><input className="cfg-input" inputMode="decimal" value={opts.debtRemain} placeholder="0.00" onChange={e => setO('debtRemain', e.target.value)} /></SvField>}
              </div>
            </>
          )}
        </div>
        <div className="lrq-sal-foot sv-foot">
          <span className="spacer" />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!sels.length} onClick={() => setPreview(true)}><Icon name="print" /> พรีวิว/พิมพ์{sels.length > 1 ? ` (${sels.length} รายการ)` : ''}</button>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { SurveyPermitPrintModal });
