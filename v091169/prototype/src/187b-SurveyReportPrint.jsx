// ════════════════════════════════════════════════════════════════════
//  สำรวจหลักทรัพย์ — พิมพ์เอกสารรายละเอียดพิจารณา (ชุดรายงานสำรวจ)
//   1) รายงานการสำรวจและประเมินราคาที่ดิน
//   2) รายงานการสำรวจและประเมินราคาสิ่งปลูกสร้าง (เมื่อมีสิ่งปลูกสร้างผูกกับโฉนด)
//   3) แผนที่สังเขปแสดงที่ตั้งหลักทรัพย์ + บันทึกรับรองของเจ้าของหลักทรัพย์
//   4) บันทึกข้อความ — ค่าใช้จ่ายในการขอกู้เงินพิเศษ
//  ใช้ข้อมูลผลสำรวจที่ "สรุปราคาประเมินแล้ว" เท่านั้น (ไม่รวมแบบร่าง)
// ════════════════════════════════════════════════════════════════════

const SR_INK = '#1a1a1a', SR_LINE = '#333', SR_SOFT = '#EEF5F1', SR_HEAD = '#111';
const srNum = (s) => Number(String(s == null ? '' : s).replace(/[^0-9.\-]/g, '')) || 0;
const srM = (n) => (n ? fmt.money(n) : '');
const srDate = (iso) => { if (!iso) return ''; const [y, m, d] = String(iso).split('-').map(Number); return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`; };
const srPage = {
  width: '210mm', minHeight: '297mm', padding: '10mm 11mm', boxSizing: 'border-box', background: '#fff', color: SR_INK,
  boxShadow: '0 4px 20px rgba(0,0,0,.3)', margin: '0 auto 18px', fontFamily: 'Sarabun, sans-serif', fontSize: 11, lineHeight: 1.55,
  breakAfter: 'page', pageBreakAfter: 'always',
};

function SrFl({ w, children, left }) {
  const empty = children == null || children === '';
  return <span style={{ display: 'inline-block', minWidth: w || 70, borderBottom: '1px dotted #666', padding: '0 4px', lineHeight: 1.3,
    textAlign: left ? 'left' : 'center', fontWeight: empty ? 400 : 500, color: SR_INK }}>{empty ? '\u00a0' : children}</span>;
}
function SrCb({ on, children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
      <span style={{ width: 11, height: 11, border: '1px solid ' + SR_LINE, borderRadius: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9.5, fontWeight: 700, lineHeight: 1, background: on ? SR_SOFT : '#fff', color: SR_HEAD }}>{on ? '✓' : ''}</span>{children}
    </span>
  );
}
const SrTag = ({ children, style }) => (
  <div style={{ border: '1px solid ' + SR_LINE, background: SR_SOFT, color: SR_HEAD, fontWeight: 700, textAlign: 'center', padding: '1px 6px', borderRadius: 3, ...(style || {}) }}>{children}</div>
);
const srTh = { border: '1px solid ' + SR_LINE, background: SR_SOFT, color: SR_HEAD, fontWeight: 600, padding: '2px 4px', textAlign: 'center' };
const srTd = { border: '1px solid ' + SR_LINE, padding: '2px 5px', height: 18 };
const SrRow = ({ children, style }) => <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 6px', ...(style || {}) }}>{children}</div>;
const SrTitle = ({ children, sub }) => (
  <div style={{ textAlign: 'center', marginBottom: 6 }}>
    <div style={{ fontSize: 15, fontWeight: 700, color: SR_HEAD, letterSpacing: .2 }}>{children}</div>
    {sub && <div style={{ fontSize: 10, color: '#555' }}>{sub}</div>}
  </div>
);
const SrSign = ({ role, name, date }) => (
  <div style={{ textAlign: 'center', padding: '20px 6px 6px' }}>
    <div style={{ borderBottom: '1px solid ' + SR_LINE, width: '80%', margin: '0 auto' }} />
    <div style={{ marginTop: 3 }}>( {name || '\u00a0'.repeat(24)} )</div>
    <div style={{ color: '#555' }}>{date || '....../....../......'}</div>
    <div style={{ fontWeight: 700, color: SR_HEAD, marginTop: 2 }}>{role}</div>
  </div>
);

// ── รวบรวมข้อมูลรายการที่สรุปผลแล้ว ─────────────────────────────────
function srBuild(target, member) {
  const rec = target.result || (target.asset ? JSON.parse(JSON.stringify(target.asset)) : window.lcBlank('โฉนด'));
  const pool = window.lcOf ? window.lcOf(target.appt.memberCode) : [];
  const TT = window.LC_TITLE_TYPES || ['โฉนด'];
  const isLand = TT.includes(rec.type);
  const isCondo = rec.type === 'ห้องชุด';
  let bldRec = rec.type === 'สิ่งปลูกสร้าง' ? rec : null;
  let land = isLand ? rec : null;
  if (bldRec && !land && target.mockLand) land = target.mockLand;
  if (bldRec && !land) land = pool.find(r => TT.includes(r.type) && r.titleNo === ((bldRec.building || {}).refTitleNo || bldRec.refTitleNo)) || null;
  if (land && !bldRec && !target.mock) bldRec = pool.find(r => r.type === 'สิ่งปลูกสร้าง' && ((r.building || {}).refTitleNo || r.refTitleNo) === land.titleNo) || null;
  const b = (bldRec && bldRec.building) || null;
  const L = land || {};
  const wa = srNum(L.rai) * 400 + srNum(L.ngan) * 100 + srNum(L.wa);
  const landCoop = srNum(L.coopPrice) || srNum(L.summaryPrice);
  const area = b ? (srNum(b.usableArea) || srNum(b.width) * srNum(b.length)) : 0;
  const appraisal = b ? srNum(b.buildAppraisal) : 0;
  const perSqm = b ? (srNum(b.appraisalPerSqm) || (area ? Math.round(appraisal / area) : 0)) : 0;
  const age = b ? srNum(b.ageYears) : 0;
  const depPct = b ? (srNum(b.depreciation) || Math.min(age * 2, 70)) : 0;
  const depAmt = appraisal * depPct / 100;
  const residual = b ? (srNum(b.residualValue) || appraisal - depAmt) : 0;
  const owner = ((rec.owners || L.owners || [])[0] || {}).name || '';
  return {
    rec, land, bldRec, b, isLand, isCondo, wa, landCoop, area, appraisal, perSqm, age, depPct, depAmt, residual, owner,
    appt: target.appt, member: member || {},
    summary: target.demoPrice || rec.summaryPrice || '',
    sameOwner: owner && member && owner.replace(/\s+/g, '') === String(member.name || '').replace(/\s+/g, ''),
    usage: (b && b.usage) || '',
  };
}

// ── แบบประเมินราคาที่ดิน (ตอบก่อนออกรายงาน) ─────────────────────────
const SR_CHECKS = ['ชนิดของหลักเขต', 'สภาพหลักเขต', 'ระยะของหลักเขต', 'สภาพดินรอบหลักเขต', 'รูปร่างที่ดิน', 'ขนาดที่ดิน', 'ทิศทาง', 'สภาพแวดล้อม'];
const SR_OPT = {
  cond: ['ที่ว่างเปล่า', 'ถมดินแล้วทั้งแปลง', 'ถมดินบางส่วน', 'ยังไม่ถมดิน', 'มีเขื่อน ค.ส.ล.', 'มีสิ่งปลูกสร้าง'],
  use: ['ที่พักอาศัย', 'พาณิชยกรรม', 'สำนักงาน', 'เกษตรกรรม', 'อุตสาหกรรม', 'รกร้างว่างเปล่า'],
  utils: ['ไฟฟ้า', 'น้ำประปา', 'น้ำบาดาล', 'รถ/เรือโดยสาร'],
  growth: ['น้อย', 'ปานกลาง', 'มาก'],
  zone: ['พักอาศัย', 'อุตสาหกรรม', 'พาณิชยกรรม', 'เกษตรกรรม'],
  cons: ['ที่ดินตาบอด', 'เขตทางน้ำ', 'เขตเวนคืน', 'มีสายไฟแรงสูงผ่าน'],
};
const SR_ASSESS_KEY = 'sv_land_assess_v1';
const srAssessLoad = () => { try { return JSON.parse(localStorage.getItem(SR_ASSESS_KEY) || '{}') || {}; } catch (e) { return {}; } };
const srAssessSave = (all) => { try { localStorage.setItem(SR_ASSESS_KEY, JSON.stringify(all)); } catch (e) {} };
function srAssessDefault(d) {
  const u = d.usage || '', bt = (d.b || {}).btype || '';
  const pick = (pairs) => pairs.filter(([on]) => on).map(([, v]) => v);
  return {
    checks: {}, marker: '', markerNo: '', pointOut: '', pointReason: '',
    cond: pick([[!d.b, 'ที่ว่างเปล่า'], [!!d.b, 'มีสิ่งปลูกสร้าง']]), bldCount: d.b ? '1' : '',
    use: pick([[/อยู่อาศัย/.test(u), 'ที่พักอาศัย'], [/พาณิช/.test(u), 'พาณิชยกรรม'], [/สำนักงาน/.test(bt), 'สำนักงาน'], [/เกษตร/.test(u), 'เกษตรกรรม'], [/อุตสาห/.test(u), 'อุตสาหกรรม']]),
    frontW: '', frontL: '', level: '',
    utils: d.b ? ['ไฟฟ้า', 'น้ำประปา'] : [], growth: '',
    zone: pick([[/อยู่อาศัย/.test(u), 'พักอาศัย'], [/อุตสาห/.test(u), 'อุตสาหกรรม'], [/พาณิช/.test(u), 'พาณิชยกรรม'], [/เกษตร/.test(u), 'เกษตรกรรม']]),
    cons: d.rec.svBlindLand ? ['ที่ดินตาบอด'] : [],
  };
}
// ข้อบังคับ: รายการสำรวจ 8 ข้อ · หลักเขต · นำชี้ที่ตั้ง · ความเจริญ
function srAssessMissing(a) {
  const m = SR_CHECKS.filter(k => !a.checks[k]);
  if (!a.marker) m.push('หลักเขต'); else if (a.marker === 'found' && !String(a.markerNo).trim()) m.push('หมายเลขหลักเขต');
  if (!a.pointOut) m.push('นำชี้ที่ตั้ง'); else if (a.pointOut === 'no' && !String(a.pointReason).trim()) m.push('เหตุผลที่ไม่ใช่ที่ตั้งจริง');
  if (!a.growth) m.push('ความเจริญ');
  return m;
}
const SR_REQ_TOTAL = SR_CHECKS.length + 3;

function SrSeg({ value, options, onChange, bad }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid ' + (bad ? '#ff4d4f' : '#D9D9D9'), borderRadius: 4, overflow: 'hidden', flex: '0 0 auto' }}>
      {options.map(([v, l], i) => {
        const on = value === v;
        return (
          <button key={v} type="button" onClick={() => onChange(on ? '' : v)}
            style={{ border: 0, borderLeft: i ? '1px solid ' + (bad ? '#ff4d4f' : '#D9D9D9') : 0, padding: '0 12px', height: 30, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
              background: on ? 'var(--brand-700, #237450)' : '#fff', color: on ? '#fff' : 'rgba(0,0,0,.88)', fontWeight: on ? 600 : 400, transition: 'background .15s, color .15s' }}>{l}</button>
        );
      })}
    </div>
  );
}
function SrChips({ value, options, onChange, single }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const on = single ? value === o : (value || []).includes(o);
        return (
          <button key={o} type="button" onClick={() => onChange(single ? (on ? '' : o) : (on ? value.filter(x => x !== o) : [...(value || []), o]))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 999, fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
              border: '1px solid ' + (on ? 'var(--brand-700, #237450)' : '#D9D9D9'), background: on ? '#EAFEF2' : '#fff', color: on ? 'var(--brand-700, #237450)' : 'rgba(0,0,0,.88)', fontWeight: on ? 600 : 400, transition: 'all .15s' }}>
            {on && <Icon name="check" size={12} />}{o}
          </button>
        );
      })}
    </div>
  );
}
const SrQ = ({ no, title, req, children, hint }) => (
  <div style={{ padding: '14px 0', borderTop: '1px solid #F0F0F0' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-700, #237450)' }}>{no}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,.88)' }}>{title}</span>
      {req && <span style={{ color: '#ff4d4f' }}>*</span>}
      {hint && <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{hint}</span>}
    </div>
    {children}
  </div>
);
function SrAssessForm({ d, a, onChange, showErr, parcels }) {
  const set = (k, v) => onChange({ ...a, [k]: v });
  const setCheck = (k, v) => onChange({ ...a, checks: { ...a.checks, [k]: v } });
  const L = d.land || d.rec;
  const lbl = { fontSize: 12.5, color: 'rgba(0,0,0,.65)' };
  const num = (k, w) => <input className="cfg-input" inputMode="decimal" value={a[k]} onChange={e => set(k, e.target.value)} style={{ width: w || 90, height: 30, textAlign: 'right' }} />;
  const missing = srAssessMissing(a);
  const bad = (cond) => showErr && cond;
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '18px 24px 8px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-700, #237450)' }}>โฉนดเลขที่ {(parcels && parcels.length ? parcels.map(x => x.land.titleNo || '—').join(', ') : (L.titleNo || '—'))}</span>
        {parcels && parcels.length > 1 && <span style={{ fontSize: 12, padding: '1px 8px', borderRadius: 999, background: '#EAFEF2', color: 'var(--brand-700, #237450)' }}>รวม {parcels.length} แปลง</span>}
        <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,.65)' }}>{[L.locTambon && 'ต.' + L.locTambon, L.locAmphoe && 'อ.' + L.locAmphoe, L.locProvince && 'จ.' + L.locProvince].filter(Boolean).join(' ')} · {L.rai || 0}-{L.ngan || 0}-{L.wa || 0} ไร่{d.b ? ' · มีสิ่งปลูกสร้าง' : ''}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: missing.length ? '#FFF7E6' : '#EAFEF2', color: missing.length ? '#ad6800' : 'var(--brand-700, #237450)' }}>
          {missing.length ? `ตอบแล้ว ${SR_REQ_TOTAL - missing.length}/${SR_REQ_TOTAL} ข้อบังคับ` : 'ตอบครบแล้ว'}
        </span>
      </div>

      <SrQ no="1" title="รายการสำรวจเทียบกับโฉนด" req>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '8px 24px' }}>
          {SR_CHECKS.map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, color: bad(!a.checks[k]) ? '#ff4d4f' : 'rgba(0,0,0,.88)' }}>{k}</span>
              <SrSeg value={a.checks[k] || ''} options={[['match', 'ตรงตามโฉนด'], ['mismatch', 'ไม่ตรง']]} onChange={v => setCheck(k, v)} bad={bad(!a.checks[k])} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn sm" onClick={() => onChange({ ...a, checks: Object.fromEntries(SR_CHECKS.map(k => [k, 'match'])) })}>ตรงตามโฉนดทุกข้อ</button>
        </div>
      </SrQ>

      <SrQ no="2" title="หลักเขต" req>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <SrSeg value={a.marker} options={[['none', 'ไม่พบ'], ['found', 'พบหมายเลข']]} onChange={v => set('marker', v)} bad={bad(!a.marker)} />
          {a.marker === 'found' && <input className="cfg-input" value={a.markerNo} placeholder="ระบุหมายเลขหลักเขต" onChange={e => set('markerNo', e.target.value)}
            style={{ width: 220, height: 30, borderColor: bad(!String(a.markerNo).trim()) ? '#ff4d4f' : undefined }} />}
        </div>
      </SrQ>

      <SrQ no="3" title="นำชี้ว่าเป็นที่ตั้งของที่ดินจริงหรือไม่" req>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <SrSeg value={a.pointOut} options={[['yes', 'ใช่'], ['no', 'ไม่ใช่']]} onChange={v => set('pointOut', v)} bad={bad(!a.pointOut)} />
          <input className="cfg-input" value={a.pointReason} placeholder={a.pointOut === 'no' ? 'ระบุเหตุผล (บังคับ)' : 'เพราะเหตุใด'} onChange={e => set('pointReason', e.target.value)}
            style={{ flex: '1 1 260px', minWidth: 0, height: 30, borderColor: bad(a.pointOut === 'no' && !String(a.pointReason).trim()) ? '#ff4d4f' : undefined }} />
        </div>
      </SrQ>

      <SrQ no="4" title="สภาพที่ดินและการใช้ประโยชน์" hint="เลือกได้หลายข้อ">
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
            <span style={{ ...lbl, paddingTop: 6 }}>สภาพที่ดิน</span>
            <div style={{ display: 'grid', gap: 8 }}>
              <SrChips value={a.cond} options={SR_OPT.cond} onChange={v => set('cond', v)} />
              {a.cond.includes('มีสิ่งปลูกสร้าง') && <span style={{ ...lbl, display: 'flex', alignItems: 'center', gap: 6 }}>จำนวนสิ่งปลูกสร้าง {num('bldCount', 60)} รายการ</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '110px minmax(0,1fr)', gap: 10, alignItems: 'start' }}>
            <span style={{ ...lbl, paddingTop: 6 }}>การใช้ประโยชน์</span>
            <SrChips value={a.use} options={SR_OPT.use} onChange={v => set('use', v)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 18px', ...lbl }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>หน้าที่ดินติดถนนกว้าง {num('frontW')} ม.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>ยาว {num('frontL')} ม.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>ระดับดินเทียบกับถนน (ส่วนที่ปรับปรุงแล้ว) {num('level')} ม.</span>
          </div>
        </div>
      </SrQ>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', columnGap: 32 }}>
        <SrQ no="5" title="สาธารณูปโภค" hint="เลือกได้หลายข้อ"><SrChips value={a.utils} options={SR_OPT.utils} onChange={v => set('utils', v)} /></SrQ>
        <SrQ no="6" title="ความเจริญ" req>
          <div style={{ outline: bad(!a.growth) ? '1px solid #ff4d4f' : 'none', borderRadius: 999, display: 'inline-block', outlineOffset: 3 }}>
            <SrChips single value={a.growth} options={SR_OPT.growth} onChange={v => set('growth', v)} />
          </div>
        </SrQ>
        <SrQ no="7" title="ทำเลที่ตั้ง" hint="เลือกได้หลายข้อ"><SrChips value={a.zone} options={SR_OPT.zone} onChange={v => set('zone', v)} /></SrQ>
        <SrQ no="8" title="ข้อเสีย" hint="เลือกได้หลายข้อ · ไม่มีให้เว้นว่าง"><SrChips value={a.cons} options={SR_OPT.cons} onChange={v => set('cons', v)} /></SrQ>
      </div>
    </div>
  );
}

// ── แบบสอบถามสิ่งปลูกสร้าง / ห้องชุด (schema) ───────────────────────
const SR_GRADES = ['ต่ำ', 'ปานกลาง', 'ดี', 'ดีมาก'];
const SR_B_SCHEMA = [
  { sec: 'ข้อมูลอาคาร' },
  { k: 'units', label: 'จำนวนหลัง', type: 'num', req: true, w: 70 }, { k: 'floors', label: 'จำนวนชั้น', type: 'num', req: true, w: 70, inline: true },
  { k: 'occupy', label: 'การครอบครอง', type: 'one', opts: ['เป็นเจ้าของ', 'เป็นผู้เช่า'], req: true },
  { k: 'btype', label: 'ประเภทสิ่งปลูกสร้าง', type: 'one', opts: ['บ้านเดี่ยว', 'บ้านแฝด/ทาวน์เฮาส์', 'ตึกแถว/อาคารพาณิชย์', 'อื่น ๆ'], req: true },
  { k: 'usage', label: 'สถานที่ใช้เป็น', type: 'one', opts: ['ที่อยู่อาศัย', 'ร้านค้า', 'สำนักงาน', 'โรงงาน/โกดัง'], req: true },
  { sec: 'โครงสร้างและวัสดุ' },
  { k: 'structure', label: 'โครงสร้าง', type: 'one', opts: ['ค.ส.ล.', 'เหล็ก', 'ไม้เนื้อแข็ง', 'ครึ่งตึกครึ่งไม้'], req: true },
  { k: 'wallOut', label: 'ฝาผนังด้านนอก', type: 'one', opts: ['ก่ออิฐฉาบปูน', 'ครึ่งตึกครึ่งไม้', 'ไม้', 'อื่น ๆ'], req: true },
  { k: 'wallIn', label: 'ผนังภายใน', type: 'one', opts: ['ก่ออิฐฉาบปูน', 'วอลเปเปอร์', 'ทาสี', 'อื่น ๆ'] },
  { k: 'floorUp', label: 'พื้นชั้นบน', type: 'one', opts: ['คอนกรีต', 'คอนกรีต/ไม้', 'ไม้', 'อื่น ๆ'] },
  { k: 'roofFrame', label: 'โครงหลังคา', type: 'one', opts: ['คอนกรีต', 'ไม้', 'เหล็ก', 'อื่น ๆ'], req: true },
  { k: 'roof', label: 'หลังคา', type: 'one', opts: ['คอนกรีต', 'กระเบื้อง', 'สังกะสี/เมทัลชีท', 'อื่น ๆ'], req: true },
  { k: 'ceiling', label: 'ฝ้าเพดาน', type: 'one', opts: ['ยิปซั่มบอร์ด', 'กระเบื้องแผ่นเรียบ', 'ฉาบปูนเรียบ', 'อื่น ๆ'] },
  { k: 'door', label: 'ประตู', type: 'one', opts: ['ลูกฟักกระจก', 'ลูกฟักไม้', 'บานเกล็ดไม้', 'อื่น ๆ'] },
  { k: 'window', label: 'หน้าต่าง', type: 'one', opts: ['ลูกฟักกระจก', 'ลูกฟักไม้', 'บานเกล็ด', 'อื่น ๆ'] },
  { k: 'frame', label: 'วงกบ', type: 'one', opts: ['ไม้', 'อะลูมิเนียม', 'บานเปิด', 'อื่น ๆ'] },
  { sec: 'ระยะจากสิ่งปลูกสร้างอื่น' },
  { k: 'sides', label: 'ระยะ', type: 'sides' },
  { sec: 'สภาพและมาตรฐานการก่อสร้าง' },
  { k: 'ageCls', label: 'สภาพอายุอาคาร', type: 'one', opts: ['เก่า', 'กลาง', 'ใหม่'], req: true },
  { k: 'std', label: 'มาตรฐานการก่อสร้าง', type: 'grade', rows: ['วัสดุ', 'รูปแบบ', 'ฝีมือ'], req: true },
  { k: 'extension', label: 'ส่วนต่อเติม', type: 'text', ph: 'ไม่มีให้เว้นว่าง' },
  { k: 'fire', label: 'อุปกรณ์ดับเพลิง', type: 'one', opts: ['ไม่มี', 'มี'], req: true, detail: { when: 'มี', k: 'fireType', ph: 'ระบุประเภทอุปกรณ์' } },
];
const SR_C_SCHEMA = [
  { sec: 'ลักษณะห้องชุด' },
  { k: 'ctype', label: 'ลักษณะห้องชุด', type: 'one', opts: ['ห้องพักอาศัย', 'ห้องสำนักงาน', 'ร้านค้า', 'อื่น ๆ'], req: true },
  { k: 'occupy', label: 'การครอบครอง', type: 'one', opts: ['เจ้าของอยู่เอง', 'ให้เช่า', 'ว่าง', 'อื่น ๆ'], req: true },
  { k: 'facing', label: 'ทิศทางห้อง', type: 'one', opts: ['เหนือ', 'ใต้', 'ตะวันออก', 'ตะวันตก'], req: true },
  { k: 'view', label: 'วิวทิวทัศน์', type: 'many', opts: ['วิวเมือง', 'สวน/สระว่ายน้ำ', 'อาคารข้างเคียง', 'อื่น ๆ'] },
  { k: 'facilities', label: 'ส่วนกลางและสิ่งอำนวยความสะดวก', type: 'many', opts: ['ลิฟต์', 'ที่จอดรถ', 'รปภ./กล้องวงจรปิด', 'สระว่ายน้ำ', 'ฟิตเนส', 'ระบบดับเพลิง', 'นิติบุคคลอาคารชุด', 'อื่น ๆ'] },
  { sec: 'วัสดุภายในห้อง' },
  { k: 'wallIn', label: 'ผนังภายใน', type: 'one', opts: ['ก่ออิฐฉาบปูน', 'วอลเปเปอร์', 'ทาสี', 'อื่น ๆ'] },
  { k: 'floor', label: 'พื้น', type: 'one', opts: ['กระเบื้อง', 'ลามิเนต/ไม้', 'หินอ่อน/แกรนิต', 'อื่น ๆ'] },
  { k: 'ceiling', label: 'ฝ้าเพดาน', type: 'one', opts: ['ยิปซั่มบอร์ด', 'ฉาบปูนเรียบ', 'กระเบื้องแผ่นเรียบ', 'อื่น ๆ'] },
  { k: 'doorWin', label: 'ประตู/หน้าต่าง', type: 'one', opts: ['ไม้', 'อะลูมิเนียม', 'กระจกบานเลื่อน', 'อื่น ๆ'] },
  { k: 'rooms', label: 'จำนวนห้อง', type: 'num', w: 70 }, { k: 'bedrooms', label: 'ห้องนอน', type: 'num', w: 70, inline: true }, { k: 'bathrooms', label: 'ห้องน้ำ', type: 'num', w: 70, inline: true },
  { sec: 'ค่าส่วนกลางและสภาพห้อง' },
  { k: 'fee', label: 'ค่าส่วนกลาง (บาท/เดือน)', type: 'num', w: 110 },
  { k: 'arrears', label: 'ค่าส่วนกลางค้างชำระ', type: 'one', opts: ['ไม่มี', 'มี'], req: true },
  { k: 'cond', label: 'สภาพห้องชุด', type: 'one', opts: ['เก่า', 'กลาง', 'ใหม่'], req: true },
  { k: 'age', label: 'อายุอาคาร (ปี)', type: 'num', w: 70 }, { k: 'dep', label: 'หักค่าเสื่อมราคา (%)', type: 'num', w: 70, inline: true },
  { k: 'std', label: 'มาตรฐานอาคารชุด', type: 'grade', rows: ['วัสดุ', 'การดูแล', 'ทำเล'], req: true },
];
const SR_SIDES = [['front', 'ด้านหน้า'], ['back', 'ด้านหลัง'], ['left', 'ด้านซ้าย'], ['right', 'ด้านขวา']];
function srSchemaMissing(schema, a) {
  const m = [];
  schema.forEach(it => {
    if (!it.k || !it.req) return;
    if (it.type === 'grade') { if (it.rows.some(r => !(a[it.k] || {})[r])) m.push(it.label); return; }
    if (it.type === 'many') { if (!(a[it.k] || []).length) m.push(it.label); return; }
    if (!String(a[it.k] == null ? '' : a[it.k]).trim()) { m.push(it.label); return; }
    if (a[it.k] === 'อื่น ๆ' && !String(a[it.k + 'Other'] || '').trim()) m.push(it.label + ' (ระบุ)');
    if (it.detail && a[it.k] === it.detail.when && !String(a[it.detail.k] || '').trim()) m.push(it.label + ' (ระบุ)');
  });
  return m;
}
const srReqCount = (schema) => schema.filter(it => it.k && it.req).length;
function srBldDefault(d) {
  const b = d.b || {}, has = (s, re) => re.test(String(s || ''));
  const st = b.structure, wall = b.wallMat, roof = b.roofMat, flr = b.floorMat, ceil = b.ceilingMat, bt = b.btype || '';
  const other = (v, known) => (v && !known ? { v: 'อื่น ๆ', o: v } : { v: known || '', o: '' });
  const btype = /บ้านเดี่ยว/.test(bt) ? 'บ้านเดี่ยว' : /แฝด|ทาวน์/.test(bt) ? 'บ้านแฝด/ทาวน์เฮาส์' : /ตึกแถว|พาณิชย์/.test(bt) ? 'ตึกแถว/อาคารพาณิชย์' : bt ? 'อื่น ๆ' : '';
  const wo = other(wall, has(wall, /อิฐ|ปูน/) ? 'ก่ออิฐฉาบปูน' : has(wall, /ครึ่ง/) ? 'ครึ่งตึกครึ่งไม้' : has(wall, /^ไม้/) ? 'ไม้' : '');
  const fu = other(flr, has(flr, /คอนกรีต/) ? (has(flr, /ไม้/) ? 'คอนกรีต/ไม้' : 'คอนกรีต') : has(flr, /^ไม้|ปาร์เก้/) ? 'ไม้' : '');
  const rf = other(roof, has(roof, /คอนกรีต/) && !has(roof, /กระเบื้อง/) ? 'คอนกรีต' : has(roof, /กระเบื้อง/) ? 'กระเบื้อง' : has(roof, /สังกะสี|เมทัล/) ? 'สังกะสี/เมทัลชีท' : '');
  const ce = other(ceil, has(ceil, /ยิปซั่ม/) ? 'ยิปซั่มบอร์ด' : has(ceil, /กระเบื้อง|สมาร์ท/) ? 'กระเบื้องแผ่นเรียบ' : has(ceil, /ฉาบ/) ? 'ฉาบปูนเรียบ' : '');
  return {
    units: '1', floors: b.floors || '', occupy: '', btype, btypeOther: btype === 'อื่น ๆ' ? bt : '',
    usage: /อยู่อาศัย/.test(d.usage) ? 'ที่อยู่อาศัย' : /พาณิช/.test(d.usage) ? 'ร้านค้า' : /สำนักงาน/.test(bt) ? 'สำนักงาน' : /อุตสาห|โรงงาน|โกดัง/.test(d.usage + bt) ? 'โรงงาน/โกดัง' : '',
    structure: has(st, /ครึ่ง/) ? 'ครึ่งตึกครึ่งไม้' : has(st, /คอนกรีต/) ? 'ค.ส.ล.' : has(st, /เหล็ก/) ? 'เหล็ก' : has(st, /^ไม้/) ? 'ไม้เนื้อแข็ง' : '',
    wallOut: wo.v, wallOutOther: wo.o, wallIn: has(wall, /อิฐ|ปูน/) ? 'ก่ออิฐฉาบปูน' : '', floorUp: fu.v, floorUpOther: fu.o,
    roofFrame: has(st, /คอนกรีต/) ? 'คอนกรีต' : has(st, /เหล็ก/) ? 'เหล็ก' : has(st, /^ไม้/) ? 'ไม้' : '', roof: rf.v, roofOther: rf.o, ceiling: ce.v, ceilingOther: ce.o,
    door: '', window: '', frame: '', ageCls: '', std: {}, extension: '', fire: '', fireType: '',
  };
}
function srCondoDefault(d) {
  return { ctype: '', occupy: '', facing: '', view: [], facilities: [], wallIn: '', floor: '', ceiling: '', doorWin: '', rooms: '', bedrooms: '', bathrooms: '', fee: '', arrears: '', cond: '', age: '', dep: '', std: {} };
}
// แสดงตัวเลือกในเอกสาร: "อื่น ๆ" → ข้อความที่ระบุ
const srOptLabel = (a, k, o) => (o === 'อื่น ๆ' && a[k] === 'อื่น ๆ' && a[k + 'Other']) ? a[k + 'Other'] : o;

function SrSchemaForm({ schema, a, onChange, showErr }) {
  const set = (k, v) => onChange({ ...a, [k]: v });
  const lbl = { fontSize: 13, color: 'rgba(0,0,0,.88)', paddingTop: 6 };
  const missing = showErr ? srSchemaMissing(schema, a) : [];
  const isBad = (it) => showErr && missing.some(m => m.indexOf(it.label) === 0);
  const rows = []; let i = 0;
  while (i < schema.length) {
    const it = schema[i];
    if (it.sec) { rows.push(<div key={'s' + i} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--brand-700, #237450)', padding: '14px 0 6px', borderTop: i ? '1px solid #F0F0F0' : 0, marginTop: i ? 6 : 0 }}>{it.sec}</div>); i++; continue; }
    if (it.type === 'num' || it.type === 'text') {
      const grp = [it]; while (schema[i + grp.length] && schema[i + grp.length].inline) grp.push(schema[i + grp.length]);
      rows.push(
        <div key={'n' + i} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 20px', padding: '6px 0' }}>
          {grp.map(g => (
            <label key={g.k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: isBad(g) ? '#ff4d4f' : 'rgba(0,0,0,.88)', flex: g.type === 'text' ? '1 1 320px' : '0 0 auto' }}>
              <span style={{ minWidth: g.inline ? 0 : 150 }}>{g.label}{g.req && <span style={{ color: '#ff4d4f' }}> *</span>}</span>
              <input className="cfg-input" inputMode={g.type === 'num' ? 'decimal' : undefined} value={a[g.k] || ''} placeholder={g.ph || ''} onChange={e => set(g.k, e.target.value)}
                style={{ height: 30, width: g.type === 'num' ? (g.w || 90) : undefined, flex: g.type === 'text' ? 1 : undefined, minWidth: 0, textAlign: g.type === 'num' ? 'right' : 'left', borderColor: isBad(g) ? '#ff4d4f' : undefined }} />
            </label>
          ))}
        </div>
      );
      i += grp.length; continue;
    }
    let ctl = null;
    if (it.type === 'one' || it.type === 'many') {
      ctl = (
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ outline: isBad(it) ? '1px solid #ff4d4f' : 'none', outlineOffset: 3, borderRadius: 6 }}>
            <SrChips single={it.type === 'one'} value={a[it.k] || (it.type === 'many' ? [] : '')} options={it.opts} onChange={v => set(it.k, v)} />
          </div>
          {((it.type === 'one' && a[it.k] === 'อื่น ๆ') || (it.type === 'many' && (a[it.k] || []).includes('อื่น ๆ'))) &&
            <input className="cfg-input" value={a[it.k + 'Other'] || ''} placeholder="ระบุ" onChange={e => set(it.k + 'Other', e.target.value)} style={{ height: 30, maxWidth: 320 }} />}
          {it.detail && a[it.k] === it.detail.when &&
            <input className="cfg-input" value={a[it.detail.k] || ''} placeholder={it.detail.ph} onChange={e => set(it.detail.k, e.target.value)} style={{ height: 30, maxWidth: 320 }} />}
        </div>
      );
    } else if (it.type === 'grade') {
      const g = a[it.k] || {};
      ctl = (
        <div style={{ display: 'grid', gap: 6 }}>
          {it.rows.map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ width: 60, fontSize: 13, color: showErr && !g[r] ? '#ff4d4f' : 'rgba(0,0,0,.65)' }}>{r}</span>
              <SrSeg value={g[r] || ''} options={SR_GRADES.map(x => [x, x])} onChange={v => set(it.k, { ...g, [r]: v })} bad={showErr && !g[r]} />
            </div>
          ))}
        </div>
      );
    } else if (it.type === 'sides') {
      ctl = (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '6px 20px' }}>
          {SR_SIDES.map(([k, l]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <span style={{ width: 62 }}>{l}</span>
              <input className="cfg-input" inputMode="decimal" value={a[k + 'M'] || ''} onChange={e => set(k + 'M', e.target.value)} style={{ width: 64, height: 30, textAlign: 'right' }} />
              <span>ม. ติด</span>
              <input className="cfg-input" value={a[k + 'Adj'] || ''} placeholder="เช่น ถนน / บ้านข้างเคียง" onChange={e => set(k + 'Adj', e.target.value)} style={{ flex: 1, minWidth: 0, height: 30 }} />
            </div>
          ))}
        </div>
      );
    }
    rows.push(
      <div key={'r' + i} style={{ display: 'grid', gridTemplateColumns: it.type === 'sides' ? '1fr' : '150px minmax(0,1fr)', gap: 10, alignItems: 'start', padding: '6px 0' }}>
        {it.type !== 'sides' && <span style={{ ...lbl, color: isBad(it) ? '#ff4d4f' : lbl.color }}>{it.label}{it.req && <span style={{ color: '#ff4d4f' }}> *</span>}</span>}
        {ctl}
      </div>
    );
    i++;
  }
  return <div>{rows}</div>;
}
const SrFormCard = ({ title, meta, missing, total, children }) => (
  <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,.04)', padding: '18px 24px 14px', marginBottom: 16 }}>
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, paddingBottom: 8 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-700, #237450)' }}>{title}</span>
      <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,.65)' }}>{meta}</span>
      <span style={{ flex: 1 }} />
      <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999, background: missing ? '#FFF7E6' : '#EAFEF2', color: missing ? '#ad6800' : 'var(--brand-700, #237450)' }}>
        {missing ? `ตอบแล้ว ${total - missing}/${total} ข้อบังคับ` : 'ตอบครบแล้ว'}
      </span>
    </div>
    {children}
  </div>
);

// ── 1) รายงานการสำรวจและประเมินราคาที่ดิน ───────────────────────────
const srWaOf = (L) => srNum(L.rai) * 400 + srNum(L.ngan) * 100 + srNum(L.wa);
const srRNW = (w) => `${Math.floor(w / 400)}-${Math.floor((w % 400) / 100)}-${String(Math.round((w % 100) * 100) / 100).padStart(2, '0')}`;
function SrLandPage({ d, a: ans, parcels }) {
  const a = ans || srAssessDefault(d);
  const ps = parcels && parcels.length ? parcels : [{ land: d.land || d.rec, owner: d.owner, b: d.b }];
  const waT = ps.reduce((n, x) => n + srWaOf(x.land), 0);
  const coopT = ps.reduce((n, x) => n + (srNum(x.land.coopPrice) || srNum(x.land.summaryPrice)), 0);
  const has = (k, v) => (a[k] || []).includes(v);
  const L = d.land || d.rec, c = d.rec.condo || {};
  const loc = d.isCondo
    ? `${c.roomName || ''} ห้อง ${c.roomNo || ''} ต.${c.tambon || ''} อ.${c.amphoe || ''} จ.${c.province || ''}`
    : `${L.moo ? 'หมู่ ' + L.moo + ' ' : ''}ต.${L.locTambon || ''} อ.${L.locAmphoe || ''} จ.${L.locProvince || ''}`;
  const checks = SR_CHECKS;
  const perWaCoop = waT ? Math.round(coopT / waT) : 0;
  const notes = [d.rec.note, d.rec.svNote].filter(Boolean).join(' · ');
  return (
    <div className="spc-page" style={srPage}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 190px', gap: 10, alignItems: 'start' }}>
        <div>
          <SrTitle sub={'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)'}>รายงานการสำรวจและประเมินราคาที่ดิน</SrTitle>
          <SrRow>ของ <SrFl w={170}>{d.member.name || d.appt.memberName}</SrFl> เลขสมาชิก <SrFl w={70}>{String(d.appt.memberCode || '').replace(/\D/g, '')}</SrFl> สังกัด <SrFl w={130}>{d.member.dept || ''}</SrFl></SrRow>
          <SrRow>ที่ตั้ง <SrFl w={430} left>{loc}</SrFl></SrRow>
          <SrRow style={{ marginTop: 2 }}>ผู้ถือกรรมสิทธิ์ที่ดินและสิ่งปลูกสร้าง <SrCb on={d.sameOwner}>คนเดียวกัน</SrCb> <SrCb on={!d.sameOwner && !!d.owner}>คนละคน</SrCb> <SrCb on={(d.rec.svDocs || []).length > 0}>มีสำเนาแนบ {(d.rec.svDocs || []).length ? '(' + d.rec.svDocs.length + ' ฉบับ)' : ''}</SrCb> <SrCb>ถูกคัดยืนยัน (ไม่มีเอกสารแนบ)</SrCb></SrRow>
        </div>
        <div style={{ border: '1px solid ' + SR_LINE, borderRadius: 4, padding: '4px 8px', fontSize: 10.5 }}>
          <SrRow>วันที่รับ <SrFl w={70}></SrFl> ครั้งที่ <SrFl w={22}>1</SrFl></SrRow>
          <SrRow>วันสำรวจ <SrFl w={110}>{srDate(d.rec.svSurveyDate || d.appt.date)}</SrFl></SrRow>
          <SrRow>หน่วยงาน <SrFl w={106}>แผนกเงินกู้พิเศษ</SrFl></SrRow>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead><tr>{[d.isCondo ? 'หนังสือกรรมสิทธิ์ห้องชุด' : 'หมายเลขโฉนด', 'ระวาง', 'เลขที่ดิน', d.isCondo ? 'เนื้อที่ (ตร.ม.)' : 'ไร่-งาน-วา²', 'ผู้ถือกรรมสิทธิ์', 'ภาระผูกพัน/ระยะเวลาที่เหลือ'].map(h => <th key={h} style={srTh}>{h}</th>)}</tr></thead>
        <tbody>
          {ps.map((x, i) => {
            const P = x.land;
            return (
              <tr key={i}>
                <td style={{ ...srTd, textAlign: 'center' }}>{d.isCondo ? (c.roomNo || '') : (P.titleNo || '')}</td>
                <td style={{ ...srTd, textAlign: 'center' }}>{P.rawang || ''}</td>
                <td style={{ ...srTd, textAlign: 'center' }}>{P.landNo || ''}</td>
                <td style={{ ...srTd, textAlign: 'center' }}>{d.isCondo ? (c.areaSqm || '') : `${P.rai || 0}-${P.ngan || 0}-${P.wa || 0}`}</td>
                <td style={srTd}>{((P.owners || [])[0] || {}).name || x.owner || d.owner}</td>
                <td style={srTd}>{(x.b && x.b.obligation) || ''}</td>
              </tr>
            );
          })}
          {ps.length === 1 && <tr>{[0, 1, 2, 3, 4, 5].map(i => <td key={i} style={srTd} />)}</tr>}
        </tbody>
      </table>
      <SrRow style={{ justifyContent: 'center', marginTop: 3 }}>เนื้อที่{ps.length > 1 ? 'ติดต่อกันรวม ' + ps.length + ' แปลง' : 'ติดต่อกันรวม'} <SrFl w={90}>{d.isCondo ? '' : srRNW(waT) + ' ไร่'}</SrFl> ( <SrFl w={60}>{waT || ''}</SrFl> ตารางวา )</SrRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1.5fr 0.8fr 0.8fr', gap: 8, marginTop: 8 }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 44px', gap: 4, marginBottom: 3 }}><SrTag>รายการสำรวจ</SrTag><SrTag>ตรงตามโฉนด</SrTag><SrTag>ไม่ตรง</SrTag></div>
          {checks.map(k => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 44px', alignItems: 'center' }}>
              <span>{k}</span><span style={{ textAlign: 'center' }}><SrCb on={a.checks[k] === 'match'} /></span><span style={{ textAlign: 'center' }}><SrCb on={a.checks[k] === 'mismatch'} /></span>
            </div>
          ))}
          <SrRow>หลักเขต <SrCb on={a.marker === 'none'}>ไม่พบ</SrCb> <SrCb on={a.marker === 'found'}>พบหมายเลข</SrCb> <SrFl w={50}>{a.marker === 'found' ? a.markerNo : ''}</SrFl></SrRow>
        </div>
        <div>
          <SrTag style={{ marginBottom: 3 }}>สภาพที่ดินและการใช้ประโยชน์</SrTag>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 1 }}>
            {SR_OPT.cond.map((c, i) => (
              <React.Fragment key={c}>
                <SrCb on={has('cond', c)}>{c === 'มีสิ่งปลูกสร้าง' ? `มีสิ่งปลูกสร้าง ${has('cond', c) && a.bldCount ? a.bldCount : '__'} รายการ` : c}</SrCb>
                <SrCb on={has('use', SR_OPT.use[i])}>{SR_OPT.use[i]}</SrCb>
              </React.Fragment>
            ))}
          </div>
          <SrRow>หน้าที่ดินติดถนนกว้าง <SrFl w={30}>{a.frontW}</SrFl> ม. ยาว <SrFl w={30}>{a.frontL}</SrFl> ม.</SrRow>
          <SrRow>ระดับดินเทียบกับถนน ส่วนที่ปรับปรุงแล้ว <SrFl w={26}>{a.level}</SrFl> ม.</SrRow>
        </div>
        <div>
          <SrTag style={{ marginBottom: 3 }}>สาธารณูปโภค</SrTag>
          <div style={{ display: 'grid', rowGap: 1 }}>{SR_OPT.utils.map(o => <SrCb key={o} on={has('utils', o)}>{o}</SrCb>)}</div>
          <SrTag style={{ margin: '6px 0 3px' }}>ความเจริญ</SrTag>
          <div style={{ display: 'grid', rowGap: 1 }}>{SR_OPT.growth.map(o => <SrCb key={o} on={a.growth === o}>{o}</SrCb>)}</div>
        </div>
        <div>
          <SrTag style={{ marginBottom: 3 }}>ทำเลที่ตั้ง</SrTag>
          <div style={{ display: 'grid', rowGap: 1 }}>{SR_OPT.zone.map(o => <SrCb key={o} on={has('zone', o)}>{o}</SrCb>)}</div>
          <SrTag style={{ margin: '6px 0 3px' }}>ข้อเสีย</SrTag>
          <div style={{ display: 'grid', rowGap: 1 }}>{SR_OPT.cons.map(o => <SrCb key={o} on={has('cons', o)}>{o}</SrCb>)}</div>
        </div>
      </div>
      <SrRow style={{ marginTop: 4 }}>นำชี้ว่าเป็นที่ตั้งของที่ดินจริงหรือไม่ (เพราะเหตุใด) <SrFl w={330} left>{[a.pointOut === 'yes' ? 'ใช่' : a.pointOut === 'no' ? 'ไม่ใช่' : '', a.pointReason].filter(Boolean).join(' — ')}</SrFl></SrRow>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 10 }}>
        <thead><tr>{['ชื่อเส้นทางคมนาคม', 'สาธารณะ', 'ส่วนบุคคล', 'ภาระจำยอม', 'ชนิดผิวจราจร', 'ผิวจราจรกว้าง', 'ทางเท้า', 'ไหล่ทาง', 'ท่อระบายน้ำ', 'ไฟทาง', 'สภาพเส้นทาง'].map(h => <th key={h} style={{ ...srTh, fontSize: 9.5 }}>{h}</th>)}</tr></thead>
        <tbody>{[0, 1].map(i => <tr key={i}>{Array.from({ length: 11 }).map((_, j) => <td key={j} style={srTd} />)}</tr>)}</tbody>
      </table>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 10, marginTop: 6 }}>
        <div style={{ display: 'grid', rowGap: 3 }}>
          <SrRow>ความเห็นเรื่องเส้นทางคมนาคม <SrFl w={240} left></SrFl></SrRow>
          <SrRow>ราคาตลาดที่สอบถามได้และความเห็นผู้สำรวจ <SrFl w={180} left></SrFl></SrRow>
          <SrRow>ความเห็นผู้ตรวจ <SrFl w={300} left></SrFl></SrRow>
        </div>
        <div style={{ border: '1px solid ' + SR_LINE, borderRadius: 4, overflow: 'hidden' }}>
          <SrTag style={{ border: 'none', borderBottom: '1px solid ' + SR_LINE, borderRadius: 0 }}>ราคาประเมิน</SrTag>
          <div style={{ padding: '3px 8px', display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 2 }}>
            <span>สำนักงานที่ดิน ตารางวาละ</span><span><SrFl w={70}>{srM(srNum(L.govPerWa))}</SrFl> บาท</span>
            <span>ราคาซื้อขายปัจจุบัน ตารางวาละ</span><span><SrFl w={70}></SrFl> บาท</span>
            <span>ราคาที่ควรประเมิน ตารางวาละ</span><span><SrFl w={70}>{srM(perWaCoop)}</SrFl> บาท</span>
          </div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
        <thead><tr><th style={{ ...srTh, textAlign: 'left' }}>รายการประเมินราคา</th><th style={{ ...srTh, width: 80 }}>เนื้อที่ (ตร.ว.)</th><th style={{ ...srTh, width: 90 }}>ตารางวาละ</th><th style={{ ...srTh, width: 110 }}>ราคาประเมิน (บาท)</th></tr></thead>
        <tbody>
          {ps.map((x, i) => {
            const w = srWaOf(x.land), v = srNum(x.land.coopPrice) || srNum(x.land.summaryPrice);
            return <tr key={i}><td style={srTd}>ราคาประเมินที่ดิน{ps.length > 1 ? ' โฉนดเลขที่ ' + (x.land.titleNo || '') : 'ทั้งหมด'}</td><td style={{ ...srTd, textAlign: 'right' }}>{w ? fmt.money(w, 0) : ''}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(w ? Math.round(v / w) : 0)}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(v)}</td></tr>;
          })}
          <tr><td style={srTd}><b style={{ color: SR_HEAD }}>บวก</b> &nbsp;ค่าปรับปรุงถมที่</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>
          <tr><td style={srTd}><b style={{ color: SR_INK }}>หัก</b> &nbsp;บริเวณที่ถูกตัดลึก ...... เมตร</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>
          <tr><td style={srTd}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;มูลค่าภาระผูกพัน (เหลืออายุสัญญา ...... ปี)</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>
          <tr><td style={srTd}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ส่วนที่ไม่ประเมินให้เพราะ ......................</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>
          <tr><td colSpan={3} style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT, color: SR_HEAD }}>รวมราคาประเมินที่ดิน</td><td style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT }}>{srM(coopT)}</td></tr>
        </tbody>
      </table>
      <SrRow style={{ marginTop: 4 }}>หมายเหตุ <SrFl w={560} left>{notes}</SrFl></SrRow>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid ' + SR_LINE, borderRadius: 4, marginTop: 8, breakInside: 'avoid' }}>
        {[['ผู้สำรวจ', d.rec.svOfficer || d.appt.officer], ['ผู้ประเมิน', ''], ['ผู้ตรวจ', ''], ['ผู้อนุมัติ', '']].map(([r, n], i) => (
          <div key={r} style={{ borderLeft: i ? '1px solid ' + SR_LINE : 'none' }}><SrSign role={r} name={n} /></div>
        ))}
      </div>
    </div>
  );
}

// ── 2) รายงานการสำรวจและประเมินราคาสิ่งปลูกสร้าง ───────────────────────
function SrBuildingPage({ d, a: ans }) {
  const b = d.b || {}, L = d.land || {};
  const a = ans || srBldDefault(d);
  const row = (k) => (SR_B_SCHEMA.find(x => x.k === k) || {}).opts.map(o => <SrCb on={a[k] === o}>{srOptLabel(a, k, o)}</SrCb>);
  const std = a.std || {};
  const Line = ({ label, items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, 1fr)', alignItems: 'center', rowGap: 1 }}>
      <span>{label}</span>{items.map((it, i) => <span key={i}>{it}</span>)}
    </div>
  );
  return (
    <div className="spc-page" style={srPage}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, fontSize: 10 }}>
        <span>รายงานประเมินเลขที่ <SrFl w={70}>{d.bldRec ? d.bldRec.code : ''}</SrFl></span><span>หน้า <SrFl w={24}>2</SrFl></span>
      </div>
      <SrTitle>รายงานการสำรวจและประเมินราคาสิ่งปลูกสร้าง</SrTitle>
      <SrRow>ชื่อผู้กู้ <SrFl w={160}>{d.member.name || d.appt.memberName}</SrFl> ทะเบียนเลขที่ <SrFl w={90}>{d.bldRec ? d.bldRec.code : ''}</SrFl> เอกสารประกอบ <SrFl w={110}>{b.permitNo ? 'ใบอนุญาต ' + b.permitNo : ''}</SrFl></SrRow>
      <SrRow>ผู้ถือกรรมสิทธิ์อาคาร <SrFl w={170}>{d.owner}</SrFl> ผู้ถือกรรมสิทธิ์ที่ดิน <SrFl w={170}>{((L.owners || [])[0] || {}).name || d.owner}</SrFl></SrRow>
      <SrRow>ปลูกสร้างบนที่ดินโฉนด/น.ส.3/น.ส.3ก. เลขที่ <SrFl w={80}>{L.titleNo || b.refTitleNo || ''}</SrFl> ระวาง <SrFl w={90}>{L.rawang || ''}</SrFl> เนื้อที่ <SrFl w={70}>{`${L.rai || b.rai || 0}-${L.ngan || b.ngan || 0}-${L.wa || b.wa || 0}`}</SrFl> ไร่ · บ้านเลขที่ <SrFl w={60}>{b.houseNo || ''}</SrFl></SrRow>

      <div style={{ border: '1px solid ' + SR_LINE, borderRadius: 4, padding: '6px 10px', marginTop: 6, display: 'grid', rowGap: 2 }}>
        <Line label="จำนวนหลัง / ชั้น" items={[<span>หลัง <SrFl w={30}>{a.units}</SrFl></span>, <span>ชั้น <SrFl w={30}>{a.floors}</SrFl></span>, <SrCb on={a.occupy === 'เป็นเจ้าของ'}>เป็นเจ้าของ</SrCb>, <SrCb on={a.occupy === 'เป็นผู้เช่า'}>เป็นผู้เช่า</SrCb>]} />
        <Line label="ฝาผนังด้านนอก" items={row('wallOut')} />
        <Line label="พื้นชั้นบน" items={row('floorUp')} />
        <Line label="โครงหลังคา" items={row('roofFrame')} />
        <Line label="หลังคา" items={row('roof')} />
        <Line label="สถานที่ใช้เป็น" items={row('usage')} />
        <div style={{ textAlign: 'center', fontWeight: 600, color: SR_HEAD, marginTop: 2 }}>ระยะจากสิ่งปลูกสร้างอื่น ๆ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 2 }}>
          {SR_SIDES.map(([k, s]) => <SrRow key={k}>{s} <SrFl w={40}>{a[k + 'M']}</SrFl> เมตร ติด <SrFl w={110}>{a[k + 'Adj']}</SrFl></SrRow>)}
        </div>
      </div>

      <div style={{ display: 'grid', rowGap: 2, marginTop: 8 }}>
        <Line label="ประเภทสิ่งปลูกสร้าง" items={row('btype')} />
        <Line label="โครงสร้าง" items={row('structure')} />
        <Line label="ผนังภายใน" items={row('wallIn')} />
        <Line label="ฝ้าเพดาน" items={row('ceiling')} />
        <Line label="ประตู" items={row('door')} />
        <Line label="หน้าต่าง" items={row('window')} />
        <Line label="วงกบ" items={row('frame')} />
        <SrRow>พื้นแต่ละชั้น <SrFl w={420} left>{b.floorMat || ''}</SrFl></SrRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginTop: 8 }}>
        <div>
          <SrTag style={{ marginBottom: 3 }}>สภาพอายุอาคาร</SrTag>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 3 }}>{['เก่า', 'กลาง', 'ใหม่'].map(x => <SrCb key={x} on={a.ageCls === x}>{x}</SrCb>)}</div>
          <SrRow>อายุอาคาร <SrFl w={40}>{d.age || ''}</SrFl> ปี &nbsp; หักค่าเสื่อมราคา <SrFl w={36}>{d.depPct || ''}</SrFl> %</SrRow>
        </div>
        <div>
          <SrTag style={{ marginBottom: 3 }}>มาตรฐานการก่อสร้าง</SrTag>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(4, 1fr)', rowGap: 1, textAlign: 'center' }}>
            <span /><span>ต่ำ</span><span>ปานกลาง</span><span>ดี</span><span>ดีมาก</span>
            {['วัสดุ', 'รูปแบบ', 'ฝีมือ'].map(k => <React.Fragment key={k}><span style={{ textAlign: 'left' }}>{k}</span>{SR_GRADES.map(g => <span key={g}><SrCb on={std[k] === g} /></span>)}</React.Fragment>)}
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', rowGap: 2, marginTop: 6 }}>
        <SrRow>ห้องนอน/ห้องน้ำ <SrFl w={440} left>{[b.bedrooms ? b.bedrooms + ' ห้องนอน' : '', b.bathrooms ? b.bathrooms + ' ห้องน้ำ' : '', b.kitchens ? b.kitchens + ' ห้องครัว' : '', b.parking ? 'ที่จอดรถ ' + b.parking + ' คัน' : ''].filter(Boolean).join(' · ')}</SrFl></SrRow>
        <SrRow>ส่วนประกอบอาคาร เช่น โรงรถ/ลานซักล้าง/ระเบียง <SrFl w={300} left>{b.amenities || ''}</SrFl></SrRow>
        <SrRow>ส่วนต่อเติม <SrFl w={480} left>{a.extension}</SrFl></SrRow>
        <SrRow>หมายเหตุ <SrFl w={500} left>{[b.buildStatus, b.obligation].filter(Boolean).join(' · ')}</SrFl></SrRow>
        <SrRow>อุปกรณ์ดับเพลิง <SrCb on={a.fire === 'ไม่มี'}>ไม่มี</SrCb> <SrCb on={a.fire === 'มี'}>มี (โปรดระบุประเภท)</SrCb> <SrFl w={220}>{a.fire === 'มี' ? a.fireType : ''}</SrFl></SrRow>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead><tr><th style={{ ...srTh, textAlign: 'left' }}>รายการประเมินราคา</th><th style={{ ...srTh, width: 90 }}>เนื้อที่ (ตร.ม.)</th><th style={{ ...srTh, width: 90 }}>ตร.ม. ละ</th><th style={{ ...srTh, width: 120 }}>ราคาประเมิน (บาท)</th></tr></thead>
        <tbody>
          <tr><td style={srTd}>พื้นที่ใช้สอยทั่วไป</td><td style={{ ...srTd, textAlign: 'right' }}>{d.area || ''}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(d.perSqm)}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(d.appraisal)}</td></tr>
          {['พื้นที่ส่วนประกอบอาคาร', 'ห้องน้ำ/ส้วม', 'ระเบียง', 'เฉลียง'].map(k => <tr key={k}><td style={srTd}>{k}</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>)}
          <tr><td style={srTd}><b style={{ color: SR_INK }}>หัก</b> ค่าเสื่อมราคา {d.age || '...'} ปี {d.depPct || '...'} %</td><td style={srTd} /><td style={srTd} /><td style={{ ...srTd, textAlign: 'right' }}>{d.depAmt ? '(' + fmt.money(d.depAmt) + ')' : ''}</td></tr>
          <tr><td style={srTd}>ราคาประเมินอัคคีภัย</td><td style={srTd} /><td style={srTd} /><td style={{ ...srTd, textAlign: 'right' }}>{srM(d.appraisal)}</td></tr>
          <tr><td colSpan={3} style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT, color: SR_HEAD }}>รวมราคาประเมินสิ่งปลูกสร้าง</td><td style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT }}>{srM(d.residual)}</td></tr>
        </tbody>
      </table>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid ' + SR_LINE, borderRadius: 4, marginTop: 8, breakInside: 'avoid' }}>
        <SrSign role="ผู้สำรวจ" name={d.rec.svOfficer || d.appt.officer} />
        <div style={{ borderLeft: '1px solid ' + SR_LINE }}><SrSign role="ผู้ตรวจ" /></div>
      </div>
    </div>
  );
}

// ── 3) แผนที่สังเขป + บันทึกรับรองของเจ้าของหลักทรัพย์ ──────────────────
function SrMapPage({ d, parcels }) {
  const L = d.land || d.rec, c = d.rec.condo || {};
  const nos = parcels && parcels.length > 1 ? parcels.map(x => x.land.titleNo).join(', ') : null;
  return (
    <div className="spc-page" style={{ ...srPage, fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: SR_HEAD, fontSize: 13 }}>3.10 แผนที่สังเขปแสดงที่ตั้งหลักทรัพย์</div>
      <SrRow>ราย <SrFl w={190}>{d.member.name || d.appt.memberName}</SrFl> เอกสารสิทธิประเภท <SrFl w={90}>{d.rec.type}</SrFl></SrRow>
      <SrRow>เลขที่ <SrFl w={80}>{d.isCondo ? c.roomNo : (nos || L.titleNo)}</SrFl> ระวาง <SrFl w={100}>{L.rawang || ''}</SrFl> เลขที่ดิน <SrFl w={60}>{L.landNo || ''}</SrFl> หมู่ที่ <SrFl w={30}>{L.moo || ''}</SrFl> ตำบล <SrFl w={90}>{d.isCondo ? c.tambon : L.locTambon}</SrFl></SrRow>
      <SrRow>อำเภอ <SrFl w={110}>{d.isCondo ? c.amphoe : L.locAmphoe}</SrFl> จังหวัด <SrFl w={110}>{d.isCondo ? c.province : L.locProvince}</SrFl>{d.b && (d.b.lat || d.b.lng) ? <> พิกัด <SrFl w={150}>{d.b.lat}, {d.b.lng}</SrFl></> : null}</SrRow>
      <div style={{ position: 'relative', border: '1.5px solid ' + SR_LINE, height: '150mm', marginTop: 10, borderRadius: 2,
        backgroundImage: 'linear-gradient(#eef1ef 1px, transparent 1px), linear-gradient(90deg, #eef1ef 1px, transparent 1px)', backgroundSize: '10mm 10mm' }}>
        <div style={{ position: 'absolute', top: 8, right: 10, textAlign: 'center', fontWeight: 700, color: SR_HEAD, lineHeight: 1 }}>▲<br />N</div>
        {(d.rec.svImages || []).length > 0 && (
          <div style={{ position: 'absolute', left: 8, bottom: 6, fontSize: 10, color: '#555' }}>ภาพประกอบการสำรวจ: {d.rec.svImages.map(x => x.cap || x.name).join(', ')}</div>
        )}
      </div>
      <div style={{ textAlign: 'center', fontWeight: 600, marginTop: 8 }}>ข้าพเจ้าขอรับรองว่าได้ทำการสำรวจและทำแผนที่แสดงที่ตั้งหลักทรัพย์ถูกต้องตามความเป็นจริงทุกประการ</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 4 }}>
        <SrSign role="ผู้สำรวจและประเมินราคา" name={d.rec.svOfficer || d.appt.officer} />
        <SrSign role="ผู้สำรวจและประเมินราคา" />
      </div>
      <div style={{ fontWeight: 700, color: SR_HEAD, fontSize: 13, marginTop: 10 }}>3.11 <u>บันทึกรับรองของเจ้าของหลักทรัพย์</u></div>
      <p style={{ margin: '4px 0 0', textIndent: '3em', textAlign: 'justify' }}>
        ข้าพเจ้า <SrFl w={200}>{d.owner}</SrFl> เจ้าของที่ดินแปลงเครื่องหมายที่ดินตามข้อ 3.10 ขอรับรองว่า ที่ดินของข้าพเจ้าตั้งอยู่ถูกต้องตรงตามรูปแผนที่ข้างบนนี้ทุกประการ จึงขอรับรองไว้เป็นหลักฐาน
      </p>
      <div style={{ width: '45%', marginLeft: 'auto' }}><SrSign role="ผู้รับรอง" name={d.owner} /></div>
    </div>
  );
}

// ── 4) บันทึกข้อความ — ค่าใช้จ่ายในการขอกู้เงินพิเศษ ─────────────────────
function SrExpensePage({ d }) {
  const today = window.DEPOSIT_WORKING_DATE ? new Date(window.DEPOSIT_WORKING_DATE) : new Date();
  const TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const items = ['1.1 ค่าเบี้ยเลี้ยงวันละ 600.- บาท จำนวน ...... วัน', '1.2 ค่าพาหนะ รถรับจ้างจากบ้านพัก–สถานีขนส่ง ไป–กลับ', '1.3 ค่าพาหนะ รถยนต์โดยสาร/รถไฟ ไป–กลับ',
    '1.4 ค่าที่พัก', '1.5 ค่าพาหนะ จากสถานีขนส่ง–ที่ดินสำรวจ จดจำนอง ไป–กลับ', '1.6 ค่าธรรมเนียมแคชเชียร์เช็ค/และหรือตั๋วแลกเงิน'];
  const amt = <span><SrFl w={90}></SrFl> บาท</span>;
  return (
    <div className="spc-page" style={{ ...srPage, fontSize: 14, lineHeight: 1.7, padding: '14mm 16mm' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 70px', alignItems: 'center' }}>
        <img src={window.__resources && window.__resources.logo} alt="" style={{ width: 62, height: 62, objectFit: 'contain' }} />
        <div style={{ textAlign: 'center', fontSize: 19, fontWeight: 700 }}>บันทึกข้อความ</div>
        <div />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.5fr', marginTop: 6 }}>
        <div><b>หน่วยงาน</b> ฝ่ายสินเชื่อ</div><div>แผนกเงินกู้พิเศษ</div><div>โทร. 02-104-4344 ต่อ 115 โทรสาร 02-104-4227</div>
        <div><b>ที่</b> แผนก งพ.................../{today.getFullYear() + 543}</div><div style={{ gridColumn: 'span 2' }}><b>วันที่</b> {today.getDate()} {TH[today.getMonth()]} {today.getFullYear() + 543}</div>
      </div>
      <div style={{ borderBottom: '1px solid #111', padding: '2px 0', marginTop: 2 }}><b>เรื่อง</b> ค่าใช้จ่ายในการขอกู้เงินพิเศษ</div>
      <div style={{ margin: '4px 0' }}><b>(1) เรียน</b> {d.member.name || d.appt.memberName}</div>
      <p style={{ margin: '4px 0', textIndent: '3em', textAlign: 'justify' }}>สหกรณ์ได้รับคำขอกู้เงินพิเศษของท่านไว้เรียบร้อยแล้ว จึงขอแจ้งค่าใช้จ่ายในการเดินทางของเจ้าหน้าที่สำรวจหลักทรัพย์และทำนิติกรรมจำนอง ดังนี้</p>
      <div style={{ paddingLeft: '3em', fontWeight: 600 }}>1. ค่าใช้จ่ายเกี่ยวกับการสำรวจหลักทรัพย์</div>
      <div style={{ paddingLeft: '5em', display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 10 }}>
        {items.map(t => <React.Fragment key={t}><span>{t}</span><span>เป็นเงิน {amt}</span></React.Fragment>)}
        <span style={{ textAlign: 'right', fontWeight: 600 }}>รวมเป็นเงินทั้งสิ้น</span><span>{'\u00a0'.repeat(12)}{amt}</span>
      </div>
      <p style={{ margin: '6px 0', textIndent: '3em', textAlign: 'justify' }}>2. ค่าใช้จ่ายเกี่ยวกับการทำนิติกรรมจำนอง ให้มีค่าใช้จ่ายเช่นเดียวกับการสำรวจหลักทรัพย์ ยกเว้น ข้อ 1.6 และในบางรายการอาจมีค่าใช้จ่ายเพิ่มหรือลดลงได้ แล้วแต่กรณี แต่ทั้งนี้ต้องเป็นไปตามข้อเท็จจริง</p>
      <div style={{ paddingLeft: '3em' }}>จึงเรียนมาเพื่อโปรดทราบ</div>
      <div style={{ width: '50%', marginLeft: 'auto', textAlign: 'center', marginTop: 30 }}>
        <div>(นางสมรัก สัมพันธ์เวชกุล)</div><div>ผช.ผจก.(ส)</div><div>ทำการแทน ผจก.สอ.กสท.</div>
      </div>
      <div style={{ marginTop: 10 }}><b>(2) เรียน</b> ผจก.สอ.กสท.</div>
      <div style={{ paddingLeft: '3em', display: 'grid', gridTemplateColumns: '1fr auto', columnGap: 10 }}>
        <span>ทราบแล้วและได้จ่ายเงินค่าสำรวจหลักทรัพย์</span><span>เป็นเงิน {amt}</span>
        <span style={{ paddingLeft: '8.6em' }}>ค่าทำนิติกรรมจำนอง</span><span>เป็นเงิน {amt}</span>
        <span style={{ paddingLeft: '8.6em', fontWeight: 600 }}>รวมเป็นเงินทั้งสิ้น</span><span>{'\u00a0'.repeat(12)}{amt}</span>
      </div>
      <div style={{ width: '50%', marginLeft: 'auto' }}><SrSign role="ผู้จ่ายเงิน" name={d.member.name || d.appt.memberName} /></div>
      <div style={{ borderTop: '1px dashed ' + SR_LINE, margin: '6px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <SrSign role="ผู้รับเงิน (สำรวจหลักทรัพย์)" name={d.rec.svOfficer || d.appt.officer} />
        <SrSign role="ผู้รับเงิน (ทำนิติกรรมจำนอง)" />
      </div>
    </div>
  );
}

// ── 2b) รายงานการสำรวจและประเมินราคาห้องชุด (รูปแบบเดียวกับสิ่งปลูกสร้าง) ──
function SrCondoPage({ d, a: ans }) {
  const q = ans || srCondoDefault(d);
  const qrow = (k) => (SR_C_SCHEMA.find(x => x.k === k) || {}).opts.map(o => <SrCb on={Array.isArray(q[k]) ? q[k].includes(o) : q[k] === o}>{srOptLabel(q, k, o)}</SrCb>);
  const qstd = q.std || {};
  const a = d.rec, c = a.condo || {};
  const area = srNum(c.areaSqm), per = srNum(a.coopPerSqm), total = srNum(a.coopPrice) || srNum(a.summaryPrice) || area * per;
  const gov = srNum(a.govPrice);
  const Line = ({ label, items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(4, 1fr)', alignItems: 'center', rowGap: 1 }}>
      <span>{label}</span>{items.map((it, i) => <span key={i}>{it}</span>)}
    </div>
  );
  return (
    <div className="spc-page" style={srPage}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, fontSize: 10 }}>
        <span>รายงานประเมินเลขที่ <SrFl w={70}>{a.code || ''}</SrFl></span><span>หน้า <SrFl w={24}>1</SrFl></span>
      </div>
      <SrTitle sub="สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด (สอ.กสท.)">รายงานการสำรวจและประเมินราคาห้องชุด</SrTitle>
      <SrRow>ชื่อผู้กู้ <SrFl w={160}>{d.member.name || d.appt.memberName}</SrFl> ทะเบียนเลขที่ <SrFl w={90}>{a.code || ''}</SrFl> วันสำรวจ <SrFl w={90}>{srDate(a.svSurveyDate || d.appt.date)}</SrFl></SrRow>
      <SrRow>ผู้ถือกรรมสิทธิ์ห้องชุด <SrFl w={180}>{d.owner}</SrFl> <SrCb on={d.sameOwner}>คนเดียวกับผู้กู้</SrCb> <SrCb on={!d.sameOwner && !!d.owner}>คนละคน</SrCb></SrRow>
      <SrRow>หนังสือกรรมสิทธิ์ห้องชุดเลขที่ <SrFl w={80}>{c.roomNo || ''}</SrFl> ชั้นที่ <SrFl w={30}>{c.floor || ''}</SrFl> อาคารเลขที่ <SrFl w={40}>{c.buildingNo || '-'}</SrFl> ชื่ออาคารชุด <SrFl w={150}>{c.roomName || ''}</SrFl></SrRow>
      <SrRow>ทะเบียนอาคารชุด <SrFl w={100}>{c.regNo || ''}</SrFl> ตั้งอยู่บนโฉนดที่ดินเลขที่ <SrFl w={90}>{c.titleNos || a.refTitleNo || ''}</SrFl> สำนักงานที่ดิน <SrFl w={150}>{[a.refLandOfficeProvince, a.refLandOfficeBranch].filter(Boolean).join(' สาขา')}</SrFl></SrRow>
      <SrRow>ที่ตั้ง ต. <SrFl w={110}>{c.tambon || ''}</SrFl> อ. <SrFl w={110}>{c.amphoe || ''}</SrFl> จ. <SrFl w={120}>{c.province || ''}</SrFl> เนื้อที่ห้องชุด <SrFl w={50}>{c.areaSqm || ''}</SrFl> ตร.ม.</SrRow>

      <div style={{ border: '1px solid ' + SR_LINE, borderRadius: 4, padding: '6px 10px', marginTop: 6, display: 'grid', rowGap: 2 }}>
        <Line label="ลักษณะห้องชุด" items={qrow('ctype')} />
        <Line label="การครอบครอง" items={qrow('occupy')} />
        <Line label="ทิศทางห้อง" items={qrow('facing')} />
        <Line label="วิวทิวทัศน์" items={qrow('view')} />
        <div style={{ textAlign: 'center', fontWeight: 600, color: SR_HEAD, marginTop: 2 }}>ส่วนกลางและสิ่งอำนวยความสะดวก</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 1 }}>{qrow('facilities')}</div>
      </div>

      <div style={{ display: 'grid', rowGap: 2, marginTop: 8 }}>
        <Line label="ผนังภายใน" items={qrow('wallIn')} />
        <Line label="พื้น" items={qrow('floor')} />
        <Line label="ฝ้าเพดาน" items={qrow('ceiling')} />
        <Line label="ประตู/หน้าต่าง" items={qrow('doorWin')} />
        <SrRow>จำนวนห้อง <SrFl w={40}>{q.rooms}</SrFl> ห้องนอน <SrFl w={40}>{q.bedrooms}</SrFl> ห้องน้ำ <SrFl w={40}>{q.bathrooms}</SrFl> &nbsp; ค่าส่วนกลาง <SrFl w={70}>{q.fee}</SrFl> บาท/เดือน &nbsp; ค้างชำระ <SrCb on={q.arrears === 'ไม่มี'}>ไม่มี</SrCb> <SrCb on={q.arrears === 'มี'}>มี</SrCb></SrRow>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14, marginTop: 8 }}>
        <div>
          <SrTag style={{ marginBottom: 3 }}>สภาพห้องชุด</SrTag>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 3 }}>{['เก่า', 'กลาง', 'ใหม่'].map(x => <SrCb key={x} on={q.cond === x}>{x}</SrCb>)}</div>
          <SrRow>อายุอาคาร <SrFl w={40}>{q.age}</SrFl> ปี &nbsp; หักค่าเสื่อมราคา <SrFl w={36}>{q.dep}</SrFl> %</SrRow>
        </div>
        <div>
          <SrTag style={{ marginBottom: 3 }}>มาตรฐานอาคารชุด</SrTag>
          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(4, 1fr)', rowGap: 1, textAlign: 'center' }}>
            <span /><span>ต่ำ</span><span>ปานกลาง</span><span>ดี</span><span>ดีมาก</span>
            {['วัสดุ', 'การดูแล', 'ทำเล'].map(k => <React.Fragment key={k}><span style={{ textAlign: 'left' }}>{k}</span>{SR_GRADES.map(g => <span key={g}><SrCb on={qstd[k] === g} /></span>)}</React.Fragment>)}
          </div>
        </div>
      </div>
      <SrRow style={{ marginTop: 6 }}>หมายเหตุ <SrFl w={500} left>{[a.note, a.svNote].filter(Boolean).join(' · ')}</SrFl></SrRow>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead><tr><th style={{ ...srTh, textAlign: 'left' }}>รายการประเมินราคา</th><th style={{ ...srTh, width: 90 }}>เนื้อที่ (ตร.ม.)</th><th style={{ ...srTh, width: 90 }}>ตร.ม. ละ</th><th style={{ ...srTh, width: 120 }}>ราคาประเมิน (บาท)</th></tr></thead>
        <tbody>
          <tr><td style={srTd}>ราคาประเมินราชการ (สำนักงานที่ดิน)</td><td style={{ ...srTd, textAlign: 'right' }}>{area || ''}</td><td style={{ ...srTd, textAlign: 'right' }}>{gov && area ? srM(Math.round(gov / area)) : ''}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(gov)}</td></tr>
          <tr><td style={srTd}>พื้นที่ห้องชุด (ราคาที่ควรประเมิน)</td><td style={{ ...srTd, textAlign: 'right' }}>{area || ''}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(per)}</td><td style={{ ...srTd, textAlign: 'right' }}>{srM(total)}</td></tr>
          {['พื้นที่ระเบียง/ส่วนควบ', 'ที่จอดรถ (ถ้ามีกรรมสิทธิ์)'].map(k => <tr key={k}><td style={srTd}>{k}</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>)}
          <tr><td style={srTd}><b style={{ color: SR_INK }}>หัก</b> ค่าเสื่อมราคา / ค่าส่วนกลางค้างชำระ</td><td style={srTd} /><td style={srTd} /><td style={srTd} /></tr>
          <tr><td colSpan={3} style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT, color: SR_HEAD }}>รวมราคาประเมินห้องชุด</td><td style={{ ...srTd, textAlign: 'right', fontWeight: 700, background: SR_SOFT }}>{srM(srNum(a.summaryPrice) || total)}</td></tr>
        </tbody>
      </table>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid ' + SR_LINE, borderRadius: 4, marginTop: 8, breakInside: 'avoid' }}>
        {[['ผู้สำรวจ', a.svOfficer || d.appt.officer], ['ผู้ประเมิน', ''], ['ผู้ตรวจ', ''], ['ผู้อนุมัติ', '']].map(([r, n], i) => (
          <div key={r} style={{ borderLeft: i ? '1px solid ' + SR_LINE : 'none' }}><SrSign role={r} name={n} /></div>
        ))}
      </div>
    </div>
  );
}

// ── ตัวอย่างหลักทรัพย์ที่สรุปราคาประเมินแล้ว (สาธิตชุดเอกสารแต่ละประเภท) ──
window.svrMockTargets = function (member) {
  const blank = (t) => window.lcBlank(t);
  const owner = [{ name: member.name, citizenId: member.citizenId || '', age: '', marital: '', spouse: member.spouse || '-', father: '-', mother: '-' }];
  const land = Object.assign(blank('โฉนด'), {
    id: 'MOCK-LAND', code: 'TL-2569-00314', titleNo: '31794', volume: '318', page: '94', moo: '4', rawang: '4945 II 6230', landNo: '80', surveyPage: '6130',
    locProvince: 'ลำปาง', locAmphoe: 'เกาะคา', locTambon: 'ศาลา', landOfficeProvince: 'ลำปาง', landOfficeBranch: 'เกาะคา',
    rai: '0', ngan: '1', wa: '01', govPerWa: '4,000.00', govPrice: '404,000.00', coopPrice: '404,000.00', maxGuarPct: '70.00', summaryPrice: '404,000.00',
    note: 'ที่ดินเปล่า ติดทางสาธารณประโยชน์ ถมแล้ว', owners: owner, svSurveyDate: '2026-04-08', svOfficer: 'ประเสริฐ วงศ์ดี',
  });
  const bLand = Object.assign(blank('โฉนด'), {
    id: 'MOCK-BLAND', code: 'TL-2569-00296', titleNo: '25963', rawang: '5237 IV 6626', landNo: '2435', surveyPage: '6275',
    locProvince: 'กรุงเทพมหานคร', locAmphoe: 'หนองจอก', locTambon: 'โคกแฝด', landOfficeProvince: 'กรุงเทพมหานคร', landOfficeBranch: 'หนองจอก',
    rai: '0', ngan: '0', wa: '54', govPerWa: '7,800.00', govPrice: '421,200.00', coopPrice: '421,200.00', maxGuarPct: '90.00', summaryPrice: '421,200.00', owners: owner,
  });
  const bld = Object.assign(blank('สิ่งปลูกสร้าง'), {
    id: 'MOCK-BLD', code: 'BD-2569-00118', refTitleNo: '25963', refLandOfficeProvince: 'กรุงเทพมหานคร', refLandOfficeBranch: 'หนองจอก', owners: owner,
    summaryPrice: '754,000.00', coopPrice: '754,000.00', svSurveyDate: '2026-04-09', svOfficer: 'มาลี สุขใจ', note: 'บ้านเดี่ยวชั้นเดียว สภาพดี มีรั้วรอบ',
    building: Object.assign(blank('สิ่งปลูกสร้าง').building, {
      btype: 'บ้านเดี่ยว', usage: 'ที่อยู่อาศัย', houseNo: '40/98', moo: '7', province: 'กรุงเทพมหานคร', amphoe: 'หนองจอก', tambon: 'โคกแฝด', postcode: '10530',
      refTitleNo: '25963', rai: '0', ngan: '0', wa: '54', yearBuilt: '2539', ageYears: '30', floors: '1', usableArea: '80', width: '8', length: '10',
      structure: 'คอนกรีตเสริมเหล็ก', wallMat: 'ก่ออิฐฉาบปูน', roofMat: 'กระเบื้องลอนคู่', floorMat: 'คอนกรีตปูกระเบื้อง', ceilingMat: 'ยิปซั่มบอร์ด',
      bedrooms: '2', bathrooms: '1', kitchens: '1', parking: '1', amenities: 'โรงจอดรถ, ลานซักล้าง',
      buildAppraisal: '832,000.00', appraisalPerSqm: '10,400.00', depreciation: '60', residualValue: '332,800.00', totalValue: '754,000.00',
      buildStatus: 'ก่อสร้างแล้วเสร็จ', obligation: 'ไม่มีภาระผูกพัน',
    }),
  });
  const condo = Object.assign(blank('ห้องชุด'), {
    id: 'MOCK-CONDO', code: 'CD-2569-00027', refTitleNo: '55383', refLandOfficeProvince: 'กรุงเทพมหานคร', refLandOfficeBranch: 'ดอนเมือง',
    condo: { roomNo: '183/100', floor: '4', buildingNo: '-', roomName: 'สายลมคอนโดเทล', regNo: 'อช.27/2538', titleNos: '55383', areaSqm: '26.26', province: 'กรุงเทพมหานคร', amphoe: 'ดอนเมือง', tambon: 'ทุ่งสองห้อง' },
    coopPerSqm: '17,600.00', coopPrice: '462,176.00', govPrice: '462,176.00', summaryPrice: '462,176.00', owners: owner,
    svSurveyDate: '2026-04-10', svOfficer: 'วินัย ตรงเวลา', note: 'ห้องมุม ชั้น 4 สภาพพร้อมอยู่',
  });
  const mk = (key, asset, date, time, officer, extra) => ({
    key, asset, result: null, mock: true, demoBadge: 'price', demoPrice: asset.summaryPrice, ...(extra || {}),
    appt: { id: 'SV-' + key, type: 'survey', date, time, memberCode: member.code, memberName: member.name, officer,
            assetTitle: window.lcAssetTitle(asset) + ' (ตัวอย่าง)', assetType: asset.type },
  });
  return [
    mk('mock-land', land, '2026-04-08', '09:30', 'ประเสริฐ วงศ์ดี'),
    mk('mock-bld', bld, '2026-04-09', '10:00', 'มาลี สุขใจ', { mockLand: bLand }),
    mk('mock-condo', condo, '2026-04-10', '13:30', 'วินัย ตรงเวลา'),
  ];
};

// ── Overlay: จัดชุดรายงาน → แบบสอบถาม → พรีวิว/พิมพ์ (ชุดเดียว) ─────────
//  • โฉนด: รวมแปลงกับโฉนดอื่นได้ → รายงานที่ดิน 1 ฉบับ ตารางแสดงทุกเลขโฉนด
//  • สิ่งปลูกสร้าง: ผูกกับโฉนดเสมอ — ถ้าไม่ได้เลือกโฉนด จะดึงโฉนดที่ผูกไว้เข้ามาในชุดให้อัตโนมัติ
//  • ห้องชุด: รายงานห้องชุด 1 ฉบับต่อห้อง · บันทึกค่าใช้จ่าย 1 ฉบับต่อชุด
function SurveyReportPrintOverlay({ targets, member, onClose }) {
  const sets = React.useMemo(() => targets.map(t => srBuild(t, member)), [targets, member]);
  const TT = window.LC_TITLE_TYPES || ['โฉนด'];
  const plan = React.useMemo(() => {
    const parcels = [], bld = [], condos = [];
    const addParcel = (land, d, implicit) => {
      if (!land || parcels.some(x => x.land.id === land.id || (land.titleNo && x.land.titleNo === land.titleNo))) return;
      parcels.push({ key: land.id, land, d, owner: d.owner, implicit });
    };
    sets.forEach(d => {
      if (d.isCondo) condos.push(d);
      else if (d.rec.type === 'สิ่งปลูกสร้าง') bld.push(d);
      else if (TT.includes(d.rec.type)) addParcel(d.land || d.rec, d, false);
    });
    bld.forEach(d => addParcel(d.land, d, true));
    return { parcels, bld, condos };
  }, [sets]);

  const saved0 = React.useMemo(() => srAssessLoad(), []);
  const [mergeTo, setMergeTo] = React.useState(() => saved0.__merge || {});
  const rootOf = (k) => { let r = k, n = 0; while (mergeTo[r] && n++ < 20) r = mergeTo[r]; return r; };
  const groups = React.useMemo(() => {
    const g = {};
    plan.parcels.forEach(x => { const r = rootOf(x.key); (g[r] = g[r] || []).push(x); });
    return plan.parcels.filter(x => rootOf(x.key) === x.key).map(x => {
      const ps = g[x.key];
      const ids = ps.map(y => y.land.id);
      const bds = plan.bld.filter(d => d.land && ids.includes(d.land.id));
      const primary = ps.find(y => !y.implicit) || ps[0];
      const gd = { ...primary.d, land: primary.land, rec: primary.d.rec.type === 'สิ่งปลูกสร้าง' ? primary.land : primary.d.rec, b: bds[0] ? bds[0].b : null, usage: bds[0] ? bds[0].usage : '', isCondo: false };
      return { key: 'L:' + ids.slice().sort().join('+'), parcels: ps.map(y => ({ ...y, b: (plan.bld.find(d => d.land && d.land.id === y.land.id) || {}).b || null })), bds, gd };
    });
  }, [plan, mergeTo]);
  const keyB = (d) => 'B:' + d.bldRec.id, keyC = (d) => 'C:' + d.rec.id;

  const [ans, setAns] = React.useState(() => ({ ...saved0 }));
  const getA = (k, def) => ({ ...def, ...(ans[k] || {}) });
  const setOne = (k, v) => setAns(p => { const n = { ...p, [k]: v }; srAssessSave({ ...srAssessLoad(), [k]: v }); return n; });
  const setMerge = (k, to) => {
    const next = { ...mergeTo }; if (to) next[k] = to; else delete next[k];
    Object.keys(next).forEach(x => { if (next[x] === k && to) next[x] = to; });
    setMergeTo(next); srAssessSave({ ...srAssessLoad(), __merge: next });
  };

  const items = [
    ...groups.map(g => ({ kind: 'land', key: g.key, a: getA(g.key, srAssessDefault(g.gd)), g })),
    ...plan.bld.map(d => ({ kind: 'bld', key: keyB(d), a: getA(keyB(d), srBldDefault(d)), d })),
    ...plan.condos.map(d => ({ kind: 'condo', key: keyC(d), a: getA(keyC(d), srCondoDefault(d)), d })),
  ];
  const missOf = (it) => it.kind === 'land' ? srAssessMissing(it.a).length : srSchemaMissing(it.kind === 'bld' ? SR_B_SCHEMA : SR_C_SCHEMA, it.a).length;
  const missTotal = items.reduce((n, it) => n + missOf(it), 0);
  const [step, setStep] = React.useState(items.length ? 'form' : 'preview');
  const [showErr, setShowErr] = React.useState(false);
  const goPreview = () => { if (missTotal) { setShowErr(true); return; } setStep('preview'); };

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
  const docCount = groups.length * 2 + plan.bld.length + plan.condos.length * 2 + (sets.length ? 1 : 0);
  const bldMeta = (d) => [d.b && d.b.houseNo ? 'บ้านเลขที่ ' + d.b.houseNo : '', d.b && d.b.btype, d.land ? 'บนโฉนด ' + d.land.titleNo : ''].filter(Boolean).join(' · ');
  const condoMeta = (d) => { const c = d.rec.condo || {}; return [c.roomName, c.floor ? 'ชั้น ' + c.floor : '', c.areaSqm ? c.areaSqm + ' ตร.ม.' : ''].filter(Boolean).join(' · '); };

  if (step === 'form') return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={close}><Icon name="chevLeft" /> กลับ</button>
        <span className="lrq-printview-title">แบบสอบถามก่อนออกรายงาน · {member.name}</span>
        <span className="spacer" />
        <span style={{ fontSize: 12.5, color: missTotal ? (showErr ? '#ff4d4f' : 'rgba(0,0,0,.65)') : 'var(--brand-700, #237450)' }}>
          {missTotal ? `ยังไม่ได้ตอบ ${missTotal} ข้อบังคับ` : 'ตอบครบทุกข้อบังคับแล้ว'}
        </span>
        <button className="btn primary sm" onClick={goPreview}>ออกรายงานชุดนี้ <Icon name="chevRight" /></button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '4px 0 24px' }}>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', borderRadius: 12, padding: '16px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(0,0,0,.88)' }}>ชุดรายงาน</span>
              <span style={{ fontSize: 12.5, color: 'rgba(0,0,0,.65)' }}>ออกเป็นเอกสารชุดเดียว {docCount} ฉบับ · ข้อที่มี <span style={{ color: '#ff4d4f' }}>*</span> ต้องตอบ · ระบบจำคำตอบไว้ใช้ครั้งถัดไป</span>
            </div>
            <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
              {groups.map((g, gi) => (
                <div key={g.key} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 10, alignItems: 'start', padding: '8px 12px', borderRadius: 8, background: '#FAFAFA' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--brand-700, #237450)', color: '#fff', fontSize: 11.5, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{gi + 1}</span>
                  <div style={{ fontSize: 13 }}>
                    <b>รายงานที่ดิน</b> — โฉนดเลขที่ {g.parcels.map(x => x.land.titleNo).join(', ')}{g.parcels.length > 1 ? ` (รวม ${g.parcels.length} แปลง)` : ''}
                    {g.bds.length > 0 && <span style={{ color: 'rgba(0,0,0,.65)' }}> · พร้อมรายงานสิ่งปลูกสร้าง {g.bds.length} หลัง</span>}
                    {g.parcels.some(x => x.implicit) && <div style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>ดึงโฉนด {g.parcels.filter(x => x.implicit).map(x => x.land.titleNo).join(', ')} เข้าชุดอัตโนมัติ เพราะเป็นโฉนดที่ตั้งสิ่งปลูกสร้าง</div>}
                  </div>
                </div>
              ))}
              {plan.condos.map((d, ci) => (
                <div key={keyC(d)} style={{ display: 'grid', gridTemplateColumns: '28px minmax(0,1fr)', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: '#FAFAFA' }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--brand-700, #237450)', color: '#fff', fontSize: 11.5, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{groups.length + ci + 1}</span>
                  <div style={{ fontSize: 13 }}><b>รายงานห้องชุด</b> — ห้องชุดเลขที่ {(d.rec.condo || {}).roomNo}</div>
                </div>
              ))}
            </div>
            {plan.parcels.length > 1 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F0F0F0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>รวมแปลงโฉนด <span style={{ fontWeight: 400, fontSize: 12, color: 'rgba(0,0,0,.45)' }}>แปลงที่รวมกันจะออกเป็นรายงานที่ดินฉบับเดียว และแสดงทุกเลขโฉนดในตาราง</span></div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {plan.parcels.map(x => {
                    const hasChildren = Object.values(mergeTo).includes(x.key);
                    const targetsOk = plan.parcels.filter(y => y.key !== x.key && !mergeTo[y.key]);
                    return (
                      <div key={x.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13 }}>
                        <span style={{ minWidth: 150 }}><b>โฉนดเลขที่ {x.land.titleNo}</b> <span style={{ color: 'rgba(0,0,0,.45)' }}>{srRNW(srWaOf(x.land))} ไร่</span></span>
                        <select className="cfg-input" value={mergeTo[x.key] || ''} disabled={hasChildren} onChange={e => setMerge(x.key, e.target.value)} style={{ height: 30, width: 280, maxWidth: '100%' }}>
                          <option value="">{hasChildren ? 'เป็นแปลงหลักของกลุ่ม' : 'ออกรายงานแยก'}</option>
                          {targetsOk.map(y => <option key={y.key} value={y.key}>รวมแปลงกับโฉนดเลขที่ {y.land.titleNo}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {items.map(it => it.kind === 'land' ? (
            <SrAssessForm key={it.key} d={it.g.gd} parcels={it.g.parcels} a={it.a} onChange={v => setOne(it.key, v)} showErr={showErr} />
          ) : it.kind === 'bld' ? (
            <SrFormCard key={it.key} title={'แบบสอบถามสิ่งปลูกสร้าง ' + (it.d.bldRec.code || '')} meta={bldMeta(it.d) + (it.d.age ? ' · อายุอาคาร ' + it.d.age + ' ปี' : '')} missing={missOf(it)} total={srReqCount(SR_B_SCHEMA)}>
              <SrSchemaForm schema={SR_B_SCHEMA} a={it.a} onChange={v => setOne(it.key, v)} showErr={showErr} />
            </SrFormCard>
          ) : (
            <SrFormCard key={it.key} title={'แบบสอบถามห้องชุด ' + ((it.d.rec.condo || {}).roomNo || '')} meta={condoMeta(it.d)} missing={missOf(it)} total={srReqCount(SR_C_SCHEMA)}>
              <SrSchemaForm schema={SR_C_SCHEMA} a={it.a} onChange={v => setOne(it.key, v)} showErr={showErr} />
            </SrFormCard>
          ))}
        </div>
      </div>
    </div>
  );
  const first = sets[0];
  return (
    <div className="lrq-printview">
      <div className="lrq-printview-bar lrq-noprint">
        <button className="btn sm" onClick={() => items.length ? setStep('form') : close()}><Icon name="chevLeft" /> {items.length ? 'แก้แบบสอบถาม' : 'กลับ'}</button>
        <span className="lrq-printview-title">พรีวิว — เอกสารรายละเอียดพิจารณา · {member.name} · ชุดเดียว {docCount} ฉบับ</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12 }}>คลิกข้อความเพื่อแก้ไขก่อนพิมพ์</span>
        <button className="btn primary sm" onClick={doPrint}><Icon name="print" /> พิมพ์ข้อมูล</button>
        <button className="btn sm" onClick={close} title="ปิด (Esc)"><Icon name="close" /></button>
      </div>
      <div className="lrq-printview-scroll">
        <div className="lrq-print-portal" contentEditable suppressContentEditableWarning spellCheck={false} style={{ outline: 'none' }}>
          {groups.map(g => (
            <React.Fragment key={g.key}>
              <SrLandPage d={g.gd} parcels={g.parcels} a={getA(g.key, srAssessDefault(g.gd))} />
              {g.bds.map(d => <SrBuildingPage key={keyB(d)} d={d} a={getA(keyB(d), srBldDefault(d))} />)}
              <SrMapPage d={g.gd} parcels={g.parcels} />
            </React.Fragment>
          ))}
          {plan.condos.map(d => (
            <React.Fragment key={keyC(d)}>
              <SrCondoPage d={d} a={getA(keyC(d), srCondoDefault(d))} />
              <SrMapPage d={d} />
            </React.Fragment>
          ))}
          {first && <SrExpensePage d={first} />}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SurveyReportPrintOverlay });
