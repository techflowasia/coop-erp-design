// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — บันทึกหลักทรัพย์ (LoanCollateralPage)
//  เลือกสมาชิก → จัดการทะเบียนหลักทรัพย์ค้ำประกัน (เพิ่ม/แก้ไข/ลบ)
//  ฟอร์มปรับตามประเภท: โฉนด·นส3·นส3ก·โฉนดตราจอง / ห้องชุด / สิ่งปลูกสร้าง
// ════════════════════════════════════════════════════════════════════

// ── ฟิลด์ (label บน + control ล่าง) — ใช้ร่วมกับกริด .lrq-grid ──────
function LcField({ label, children, span, hint }) {
  return (
    <div className={"lrq-f" + (span ? " span-" + span : "")}>
      <label className="lrq-lbl">{label}</label>
      {children}
      {hint && <span className="lrq-hint">{hint}</span>}
    </div>
  );
}
function LcNum({ value, onChange, yellow, readOnly, placeholder = '0.00' }) {
  return <input className={"cfg-input lrq-num" + (yellow ? " lrq-y" : "") + (readOnly ? " lrq-ro" : "")}
                value={value || ''} readOnly={readOnly} placeholder={placeholder}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined} />;
}
function LcSec({ children, action }) {
  return <div className="lrq-subhead cs-sec">{children}{action}</div>;
}
// select ที่อยู่ (จังหวัด/อำเภอ/ตำบล) แบบผูกกัน
function LcProvince({ value, onChange }) {
  return (
    <select className="cfg-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">--- โปรดเลือก ---</option>
      {(window.LC_LAND_PROVINCES || []).map(p => <option key={p} value={p}>{p}</option>)}
    </select>
  );
}
function LcAmphoe({ province, value, onChange }) {
  const opts = (window.AMPHOES && window.AMPHOES[province]) || [];
  return (
    <select className="cfg-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">--- โปรดเลือก ---</option>
      {opts.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
}
function LcTambon({ amphoe, value, onChange }) {
  const opts = (window.TAMBONS && window.TAMBONS[amphoe]) || [];
  return (
    <select className="cfg-input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">--- โปรดเลือก ---</option>
      {opts.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}

// ── Modal เลือกโฉนดอ้างอิง (สำหรับห้องชุด/สิ่งปลูกสร้าง) ───────────────
function LcRefTitleModal({ list, onPick, onClose }) {
  const titles = (list || []).filter(r => (window.LC_TITLE_TYPES || []).includes(r.type));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="home" /></div>
          <h2>เลือกโฉนดอ้างอิง</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>อ้างอิงหลักทรัพย์ประเภทที่ดินของสมาชิกรายนี้เพื่อผูกกับหลักทรัพย์ปัจจุบัน</div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 320 }}>
            <table className="tbl">
              <thead><tr><th>ประเภท</th><th>เลขที่โฉนด</th><th>สำนักงานที่ดิน</th><th>ที่ตั้ง</th><th style={{ width: 40 }} /></tr></thead>
              <tbody>
                {titles.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ยังไม่มีหลักทรัพย์ประเภทที่ดินของสมาชิกรายนี้</td></tr>
                ) : titles.map(r => (
                  <tr key={r.id} className="clickable" onClick={() => onPick(r)}>
                    <td><span className="chip">{r.type}</span></td>
                    <td className="mono">{r.titleNo || '—'}</td>
                    <td>{r.landOfficeProvince || '—'}{r.landOfficeBranch ? ' · ' + r.landOfficeBranch : ''}</td>
                    <td>{r.locProvince || '—'}</td>
                    <td className="center"><button className="btn ghost sm" style={{ padding: '0 6px' }} onClick={(e) => { e.stopPropagation(); onPick(r); }}><Icon name="chevRight" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ── ป้ายชื่อหลักทรัพย์ (สำหรับการ์ด/รายการ) ────────────────────────
function lcAssetTitle(r) {
  if ((window.LC_TITLE_TYPES || []).includes(r.type)) return 'โฉนดเลขที่ ' + (r.titleNo || '—');
  if (r.type === 'ห้องชุด') return 'ห้องชุด ' + ((r.condo && r.condo.roomNo) || r.code || '—');
  if (r.type === 'สิ่งปลูกสร้าง') return 'สิ่งปลูกสร้าง ' + (r.code || '—');
  return r.code || '—';
}
function lcAssetArea(r) {
  if (r.rai || r.ngan || r.wa) return `${r.rai || 0} ไร่ ${r.ngan || 0} งาน ${r.wa || 0} วา`;
  if (r.condo && r.condo.areaSqm) return `${r.condo.areaSqm} ตร.ม.`;
  if (r.building && r.building.usableArea) return `${r.building.usableArea} ตร.ม.`;
  return '—';
}
function lcAssetLoc(r) {
  const t = r.locTambon || (r.condo && r.condo.tambon) || (r.building && r.building.tambon);
  const a = r.locAmphoe || (r.condo && r.condo.amphoe) || (r.building && r.building.amphoe);
  const p = r.locProvince || r.landOfficeProvince || (r.condo && r.condo.province) || (r.building && r.building.province);
  const parts = [t && 'ต.' + t, a && 'อ.' + a, p && 'จ.' + p].filter(Boolean);
  return parts.length ? parts.join(' ') : '—';
}

// ── Modal "หลักทรัพย์ที่เกี่ยวข้อง" — เลือกเชื่อมกับหลักทรัพย์อื่นที่บันทึกไว้ ──
//  เลือกได้หลายรายการ: สิ่งปลูกสร้าง ↔ โฉนด เป็นแบบหลายต่อหลาย
//  (สิ่งปลูกสร้างสร้างคร่อมได้หลายโฉนด / โฉนดหนึ่งมีสิ่งปลูกสร้างได้หลายรายการ)
function LcRelatedModal({ current, list, initial, onConfirm, onClose, onView }) {
  const TT = window.LC_TITLE_TYPES || [];
  const others = (list || []).filter(r => r.id !== current.id);
  const isBld = current.type === 'สิ่งปลูกสร้าง';
  const isLand = TT.includes(current.type);
  const isPrimary = (r) => isBld ? TT.includes(r.type) : isLand ? r.type === 'สิ่งปลูกสร้าง' : false;
  const primary = others.filter(isPrimary), rest = others.filter(r => !isPrimary(r));
  const [sel, setSel] = useState(() => new Set(initial || []));
  const disabled = (r) => (isBld && TT.includes(r.type) && !r.titleNo) || (isLand && r.type === 'สิ่งปลูกสร้าง' && !current.titleNo);
  const toggle = (r) => { if (disabled(r)) return; const n = new Set(sel); n.has(r.id) ? n.delete(r.id) : n.add(r.id); setSel(n); };
  const primaryCount = primary.filter(r => sel.has(r.id)).length;
  const Card = (r) => {
    const on = sel.has(r.id), dis = disabled(r);
    return (
      <div key={r.id} className={"cs-rel-card" + (on ? " on" : "")} style={dis ? { opacity: .5, cursor: 'not-allowed' } : null} onClick={() => toggle(r)}>
        <span className={"cs-rel-radio" + (on ? " on" : "")}>{on && <Icon name="check" size={12} />}</span>
        <div className="cs-rel-info">
          <div className="cs-rel-line1">{lcAssetTitle(r)}<span className="cs-rel-type">ประเภท : {r.type}</span></div>
          <div className="cs-rel-line2">เนื้อที่ : {lcAssetArea(r)}<span className="cs-rel-sep">ที่ตั้ง :</span>{lcAssetLoc(r)}</div>
          {r.type === 'สิ่งปลูกสร้าง' && (
            <div className="cs-rel-line2">ตั้งอยู่บนโฉนด : {window.lcBldTitleNos(r).join(', ') || 'ยังไม่ได้ผูกโฉนด'}</div>
          )}
          {dis && <div className="cs-rel-line2" style={{ color: '#cf1322' }}>{isBld ? 'ยังไม่ได้ระบุเลขที่โฉนด' : 'กรุณาระบุเลขที่โฉนดของที่ดินนี้ก่อน'}</div>}
        </div>
        <button className="cs-rel-eye act-view" title="ดูรายละเอียด" onClick={(e) => { e.stopPropagation(); onView && onView(r); }}><Icon name="eye" size={14} /></button>
      </div>
    );
  };
  const GroupHead = ({ children }) => <div className="cs-rel-title" style={{ marginTop: 4 }}>{children}</div>;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card cs-rel-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>หลักทรัพย์ที่เกี่ยวข้อง</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="cs-rel-panel">
            {others.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>สมาชิกรายนี้ยังไม่มีหลักทรัพย์อื่นให้เชื่อมโยง</div>
            ) : (
              <>
                {(isBld || isLand) && (
                  <>
                    <GroupHead>
                      {isBld ? 'โฉนดที่สิ่งปลูกสร้างนี้ตั้งอยู่' : 'สิ่งปลูกสร้างที่ตั้งอยู่บนที่ดินนี้'}
                      {isBld && <span style={{ color: '#ff4d4f' }}> *</span>}
                      <span className="muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                        {isBld ? 'เลือกได้มากกว่า 1 โฉนด กรณีสร้างคร่อมหลายแปลง' : 'เลือกได้มากกว่า 1 รายการ'} · เลือกแล้ว {primaryCount} รายการ
                      </span>
                    </GroupHead>
                    {primary.length === 0
                      ? <div className="muted" style={{ fontSize: 12, padding: '6px 0 10px' }}>{isBld ? 'ยังไม่มีหลักทรัพย์ประเภทที่ดินของสมาชิกรายนี้ — กรุณาบันทึกโฉนดก่อน' : 'ยังไม่มีสิ่งปลูกสร้างในทะเบียนของสมาชิกรายนี้'}</div>
                      : <div className="cs-rel-cards">{primary.map(Card)}</div>}
                  </>
                )}
                {rest.length > 0 && (
                  <>
                    <GroupHead>{(isBld || isLand) ? 'หลักทรัพย์อื่น' : 'รายการหลักทรัพย์'}</GroupHead>
                    <div className="cs-rel-cards">{rest.map(Card)}</div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="lrq-sal-foot">
          {isBld && primaryCount === 0 && <span style={{ fontSize: 12, color: '#cf1322', marginRight: 'auto' }}>สิ่งปลูกสร้างต้องเชื่อมโฉนดอย่างน้อย 1 แปลง</span>}
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={() => onConfirm([...sel])}><Icon name="check" /> ยืนยัน</button>
        </div>
      </div>
    </>
  );
}

// ── การ์ดอ้างอิงโฉนดแม่ (ห้องชุด/สิ่งปลูกสร้าง) ─────────────────────
//  สิ่งปลูกสร้าง: แสดงโฉนดทั้งหมดที่ตั้งอยู่ (ผูกผ่าน "หลักทรัพย์ที่เกี่ยวข้อง")
function LcRefCard({ rec, pool, onPick, error }) {
  const isBld = rec.type === 'สิ่งปลูกสร้าง';
  if (isBld) {
    const nos = window.lcBldTitleNos(rec);
    const lands = window.lcLandsOf(rec, pool);
    if (!nos.length) return (
      <div className="cs-refcard" style={{ borderColor: '#ffccc7', background: '#fff2f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: '#cf1322', display: 'inline-flex' }}><Icon name="info" size={15} /></span>
          <span style={{ flex: 1, minWidth: 200, fontSize: 13, color: 'rgba(0,0,0,.88)' }}>
            <b>โฉนดที่ตั้งสิ่งปลูกสร้าง <span style={{ color: '#ff4d4f' }}>*</span></b> — สิ่งปลูกสร้างต้องเชื่อมกับโฉนดของสมาชิกอย่างน้อย 1 แปลง (เลือกได้หลายแปลงกรณีสร้างคร่อมโฉนด)
          </span>
          {onPick && <button type="button" className="btn primary sm" onClick={onPick}><Icon name="home" /> เชื่อมโฉนด</button>}
        </div>
      </div>
    );
    return (
      <div className="cs-refcard" style={error ? { borderColor: '#ffccc7' } : null}>
        <div className="cs-refcard-title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Icon name="home" size={15} /> ตั้งอยู่บนโฉนด {nos.length} แปลง <span style={{ color: '#ff4d4f' }}>*</span>
          <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', marginLeft: 4 }}>
            {nos.map(no => <span key={no} className="chip mono">เลขที่ {no}</span>)}
          </span>
          <span style={{ flex: 1 }} />
          {onPick && <button type="button" className="btn sm" onClick={onPick}>จัดการโฉนดที่ตั้ง</button>}
        </div>
        {error && <div style={{ fontSize: 12, color: '#cf1322', marginBottom: 4 }}>{error}</div>}
        <div className="cs-refcard-meta">
          สำนักงานที่ดิน : {[...new Set(lands.map(l => [l.landOfficeProvince, l.landOfficeBranch].filter(Boolean).join(' · ')).filter(Boolean))].join(' / ') || '—'}
        </div>
      </div>
    );
  }
  return (
    <div className="cs-refcard">
      <div className="cs-refcard-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="home" size={15} /> โฉนดเลขที่ {rec.refTitleNo || '—'}
      </div>
      <div className="cs-refcard-meta">
        สำนักงานที่ดินจังหวัด : {rec.refLandOfficeProvince || '—'}
        <span className="cs-refcard-sep">·</span>สำนักงานที่ดินสาขา : {rec.refLandOfficeBranch || '—'}
        <span className="cs-refcard-sep">·</span>สำนักงานที่ดินจังหวัดสาขาส่วนแยก : {rec.refLandOfficeSubBranch || '-'}
      </div>
    </div>
  );
}

// ── ตารางรายชื่อเจ้าของหลักทรัพย์ ───────────────────────────────────
function LcOwnerTable({ owners, set }) {
  const upd = (i, k, v) => set(owners.map((o, j) => j === i ? { ...o, [k]: v } : o));
  const add = () => set([...owners, { name: '', citizenId: '', age: '', marital: '', spouse: '', father: '', mother: '' }]);
  const del = (i) => set(owners.filter((_, j) => j !== i));
  return (
    <div className="table-wrap"><table className="tbl cs-owner-tbl">
      <thead><tr>
        <th style={{ minWidth: 150 }}>ชื่อ-นามสกุล</th>
        <th style={{ width: 150 }}>เลขที่บัตรประชาชน</th>
        <th style={{ width: 60 }}>อายุ</th>
        <th style={{ width: 150 }}>สถานภาพ</th>
        <th style={{ minWidth: 130 }}>ชื่อ-นามสกุลคู่สมรส</th>
        <th style={{ minWidth: 120 }}>ชื่อ-นามสกุลบิดา</th>
        <th style={{ minWidth: 120 }}>ชื่อ-นามสกุลมารดา</th>
        <th style={{ width: 40 }} />
      </tr></thead>
      <tbody>
        {owners.map((o, i) => (
          <tr key={i}>
            <td><input className="cfg-input sm" value={o.name} placeholder="โปรดระบุข้อมูล" onChange={e => upd(i, 'name', e.target.value)} /></td>
            <td><input className="cfg-input sm mono" value={o.citizenId} placeholder="โปรดระบุข้อมูล" onChange={e => upd(i, 'citizenId', e.target.value)} /></td>
            <td><input className="cfg-input sm" value={o.age} placeholder="---" onChange={e => upd(i, 'age', e.target.value)} /></td>
            <td>
              <select className="cfg-input sm" value={o.marital || ''} onChange={e => upd(i, 'marital', e.target.value)}>
                <option value="">--- โปรดเลือก ---</option>
                {window.LC_MARITAL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </td>
            <td><input className="cfg-input sm" value={o.spouse} placeholder="โปรดระบุข้อมูล" onChange={e => upd(i, 'spouse', e.target.value)} /></td>
            <td><input className="cfg-input sm" value={o.father} placeholder="โปรดระบุข้อมูล" onChange={e => upd(i, 'father', e.target.value)} /></td>
            <td><input className="cfg-input sm" value={o.mother} placeholder="โปรดระบุข้อมูล" onChange={e => upd(i, 'mother', e.target.value)} /></td>
            <td className="center"><button className="btn sm act-del" title="ลบรายการ" onClick={() => del(i)}
                    style={{ background: '#fff', border: '1px solid #D9D9D9', color: 'var(--danger)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}><Icon name="trash" size={13} /></button></td>
          </tr>
        ))}
      </tbody>
    </table></div>
  );
}

// ── ส่วนราคาประเมิน (ร่วมทุกประเภท; แถวแตกต่างเล็กน้อย) ────────────────
// แปลงวันที่ที่เก็บเป็น พ.ศ. (2569-01-01) ให้เป็น ISO ค.ศ. สำหรับ ErpDate
function lcIsoCE(v) {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return v || '';
  const y = Number(m[1]);
  return (y >= 2400 ? y - 543 : y) + '-' + m[2] + '-' + m[3];
}

// ── % ค้ำประกันสูงสุด — ค่าคงที่ประเภทเงินกู้ › หลักประกัน › มูลค่าหลักประกันที่ใช้ค้ำได้ (กลุ่ม 04)
const LC_SEC_CODE = { 'โฉนด': '01', 'นส3': '02', 'นส3ก': '03', 'ห้องชุด': '05', 'สิ่งปลูกสร้าง': '06', 'โฉนดตราจอง': '08' };
window.lcGuarPctFor = (type) => {
  const code = LC_SEC_CODE[type];
  const prods = (window.lrProducts ? window.lrProducts() : []) || [];
  const rows = prods.flatMap(p => (p.collateralValues || []).filter(r => r.group === '04'));
  const hit = (code && rows.find(r => r.type === code)) || rows.find(r => r.type === 'ALL') || rows.find(r => !r.type || r.type === 'A');
  return hit ? Number(hit.percent) || 0 : null;
};
const lcN = (v) => Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')) || 0;
const lcF2 = (v) => v ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
// สรุปราคาประเมิน: โฉนด/นส3/นส3ก/โฉนดตราจอง = ราคาราชการ × % · ห้องชุด/สิ่งปลูกสร้าง = ราคาสหกรณ์ × %
window.lcCalcSummary = (r) => {
  const base = lcN(r.type === 'สิ่งปลูกสร้าง' || r.type === 'ห้องชุด' ? r.coopPrice : r.govPrice);
  return lcF2(Math.round(base * lcN(r.maxGuarPct)) / 100);
};

function LcAppraisal({ rec, set, patch, variant, onConfirm, hideConfirm }) {
  const isLand = variant === 'land';
  const up = (o) => {
    const next = { ...rec, ...o };
    if (!next.summaryManual) next.summaryPrice = window.lcCalcSummary(next);
    patch ? patch(next) : Object.keys(o).forEach(k => set(k, o[k]));
  };
  React.useEffect(() => {
    if (rec.maxGuarPctManual || !patch) return;
    const seen = window.__lcPctSeen || (window.__lcPctSeen = new Set());
    const key = (rec.id || rec.code || '') + '|' + rec.type;
    if (seen.has(key)) return;
    seen.add(key);
    const p = window.lcGuarPctFor(rec.type);
    if (p == null) return;
    const v = p.toFixed(2);
    const next = { ...rec, maxGuarPct: v };
    if (!rec.summaryManual) next.summaryPrice = window.lcCalcSummary(next);
    if (v !== rec.maxGuarPct || next.summaryPrice !== rec.summaryPrice) patch && patch(next);
  }, [rec.type]);
  const unitField = isLand ? 'govPerWa' : 'coopPerSqm';
  const unitLabel = isLand ? 'ราคาประเมินราชการ (บาท/ตารางวา)' : 'ราคาประเมินสหกรณ์ (บาท/ตารางเมตร)';
  return (
    <>
      <LcSec action={<button className="btn text sm cs-sec-btn" onClick={() => onConfirm('เปิดประวัติราคาประเมิน / ทบทวนราคา')}><Icon name="eye" size={13} /> ประวัติราคาประเมิน/ทบทวนราคา</button>}>ราคาประเมิน</LcSec>
      <div className="lrq-tblwrap"><table className="tbl lrq-tbl cs-appr-tbl">
        <thead><tr>
          <th style={{ width: 200, minWidth: 200 }}>ประเภทผู้ประเมิน</th>
          <th>ชื่อผู้ประเมิน</th>
          <th>เลขที่ใบอนุญาต</th>
          <th className="right">ราคาประเมิน (บาท)</th>
        </tr></thead>
        <tbody>
          {[
            { key: 'company', label: 'บริษัท', price: 'licensedPrice' },
            { key: 'gov', label: 'หน่วยงานราชการ', price: 'govPrice' },
            { key: 'coop', label: 'สหกรณ์', price: 'coopPrice' },
          ].map(t => (
            <tr key={t.key}>
              <td>{t.label}</td>
              <td><input className="cfg-input sm" value={rec[t.key + 'Appraiser'] || ''} placeholder="โปรดระบุข้อมูล" onChange={e => set(t.key + 'Appraiser', e.target.value)} /></td>
              <td><input className="cfg-input sm mono" value={rec[t.key + 'AppraiserLicense'] || ''} placeholder="โปรดระบุข้อมูล" onChange={e => set(t.key + 'AppraiserLicense', e.target.value)} /></td>
              <td><LcNum value={rec[t.price]} onChange={v => up({ [t.price]: v })} /></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <div className="lrq-grid c3" style={{ marginTop: 12 }}>
        <LcField label={unitLabel}><LcNum value={rec[unitField]} onChange={v => set(unitField, v)} /></LcField>
        <LcField label="ค้ำประกันสูงสุด"><LcNum value={rec.maxGuarPct} onChange={v => up({ maxGuarPct: v, maxGuarPctManual: true })} placeholder="0.00%" /></LcField>
        <LcField label="สรุปราคาประเมิน"><LcNum value={rec.summaryPrice} yellow onChange={v => patch ? patch({ ...rec, summaryPrice: v, summaryManual: true }) : set('summaryPrice', v)} /></LcField>
      </div>
      {/* ปุ่มยืนยันบันทึกราคาประเมิน — แสดงเฉพาะเมนูสำรวจหลักทรัพย์ (บันทึกหลักทรัพย์ส่ง hideConfirm) */}
      {!hideConfirm && (
        <div className="cs-appraisal-act">
          <button className="btn primary sm" onClick={() => onConfirm('confirm-appraisal')}>ยืนยันบันทึกราคาประเมิน</button>
        </div>
      )}
    </>
  );
}

function LcNote({ value, onChange }) {
  return (
    <>
      <LcSec>หมายเหตุ</LcSec>
      <textarea className="cfg-input" rows="3" value={value || ''} placeholder="โปรดระบุข้อมูล" onChange={e => onChange(e.target.value)} />
    </>
  );
}

// ── หัวฟอร์ม: ประเภทหลักทรัพย์ + รหัส + สำนักงานที่ดิน ────────────────
function LcTypeHeader({ rec, set, pool, onRelated, onPickRef, relatedCount, refError }) {
  const isLinked = rec.type === 'ห้องชุด' || rec.type === 'สิ่งปลูกสร้าง';
  return (
    <>
      <LcSec>รายละเอียดหลักทรัพย์</LcSec>
      <div className="lrq-grid c3">
        <LcField label="ประเภทหลักทรัพย์">
          <div className="cs-type-row">
            <select className="cfg-input" value={rec.type} onChange={e => set('type', e.target.value)}>
              {window.LC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </LcField>
        <LcField label="รหัสหลักทรัพย์"><input className="cfg-input mono" value={rec.code} placeholder="โปรดระบุข้อมูล" onChange={e => set('code', e.target.value)} /></LcField>
        {!isLinked && <LcField label="สำนักงานที่ดินจังหวัด"><LcProvince value={rec.landOfficeProvince} onChange={v => set('landOfficeProvince', v)} /></LcField>}
      </div>
      {!isLinked && (
        <div className="lrq-grid c2" style={{ marginTop: 10 }}>
          <LcField label="สำนักงานที่ดินสาขา"><LcAmphoe province={rec.landOfficeProvince} value={rec.landOfficeBranch} onChange={v => set('landOfficeBranch', v)} /></LcField>
          <LcField label="สำนักงานที่ดินจังหวัดสาขาส่วนแยก">
            <select className="cfg-input" value={rec.landOfficeSubBranch || ''} onChange={e => set('landOfficeSubBranch', e.target.value)}>
              <option value="">--- โปรดเลือก ---</option>
              <option value="ส่วนแยก 1">ส่วนแยก 1</option><option value="ส่วนแยก 2">ส่วนแยก 2</option>
            </select>
          </LcField>
        </div>
      )}
    </>
  );
}

// ── ฟอร์มประเภทที่ดิน (โฉนด/นส3/นส3ก/โฉนดตราจอง) ──────────────────
function LcLandBody({ rec, set }) {
  return (
    <>
      <LcSec>โฉนดที่ดิน</LcSec>
      <div className="lrq-grid c4">
        <LcField label="เลขที่โฉนด"><input className="cfg-input" value={rec.titleNo} placeholder="โปรดระบุข้อมูล" onChange={e => set('titleNo', e.target.value)} /></LcField>
        <LcField label="เล่ม"><input className="cfg-input" value={rec.volume} placeholder="โปรดระบุข้อมูล" onChange={e => set('volume', e.target.value)} /></LcField>
        <LcField label="หน้า"><input className="cfg-input" value={rec.page} placeholder="โปรดระบุข้อมูล" onChange={e => set('page', e.target.value)} /></LcField>
        <LcField label="หมู่"><input className="cfg-input" value={rec.moo} placeholder="โปรดระบุข้อมูล" onChange={e => set('moo', e.target.value)} /></LcField>
      </div>
      <LcSec>ตำแหน่งที่ดิน</LcSec>
      <div className="lrq-grid c3">
        <LcField label="ระวาง"><input className="cfg-input" value={rec.rawang} placeholder="โปรดระบุข้อมูล" onChange={e => set('rawang', e.target.value)} /></LcField>
        <LcField label="เลขที่ดิน"><input className="cfg-input" value={rec.landNo} placeholder="โปรดระบุข้อมูล" onChange={e => set('landNo', e.target.value)} /></LcField>
        <LcField label="หน้าสำรวจ"><input className="cfg-input" value={rec.surveyPage} placeholder="โปรดระบุข้อมูล" onChange={e => set('surveyPage', e.target.value)} /></LcField>
        <LcField label="จังหวัด"><LcProvince value={rec.locProvince} onChange={v => { set('locProvince', v); set('locAmphoe', ''); set('locTambon', ''); }} /></LcField>
        <LcField label="อำเภอ"><LcAmphoe province={rec.locProvince} value={rec.locAmphoe} onChange={v => { set('locAmphoe', v); set('locTambon', ''); }} /></LcField>
        <LcField label="ตำบล"><LcTambon amphoe={rec.locAmphoe} value={rec.locTambon} onChange={v => set('locTambon', v)} /></LcField>
      </div>
      <LcSec>ขนาดที่ดิน</LcSec>
      <div className="lrq-grid c3">
        <LcField label="ไร่"><input className="cfg-input" value={rec.rai} placeholder="โปรดระบุข้อมูล" onChange={e => set('rai', e.target.value)} /></LcField>
        <LcField label="งาน"><input className="cfg-input" value={rec.ngan} placeholder="โปรดระบุข้อมูล" onChange={e => set('ngan', e.target.value)} /></LcField>
        <LcField label="ตารางวา"><input className="cfg-input" value={rec.wa} placeholder="โปรดระบุข้อมูล" onChange={e => set('wa', e.target.value)} /></LcField>
      </div>
    </>
  );
}

// ── ฟอร์มห้องชุด ──────────────────────────────────────────────────
function LcCondoBody({ rec, set }) {
  const c = rec.condo || {};
  const sc = (k, v) => set('condo', { ...c, [k]: v });
  return (
    <>
      <LcSec>รายละเอียดห้องชุด</LcSec>
      <div className="lrq-grid c3">
        <LcField label="เลขที่ห้องชุด"><input className="cfg-input" value={c.roomNo} placeholder="โปรดระบุข้อมูล" onChange={e => sc('roomNo', e.target.value)} /></LcField>
        <LcField label="ชั้น"><input className="cfg-input" value={c.floor} placeholder="โปรดระบุข้อมูล" onChange={e => sc('floor', e.target.value)} /></LcField>
        <LcField label="เลขที่อาคาร"><input className="cfg-input" value={c.buildingNo} placeholder="โปรดระบุข้อมูล" onChange={e => sc('buildingNo', e.target.value)} /></LcField>
        <LcField label="ชื่อห้องชุด"><input className="cfg-input" value={c.roomName} placeholder="โปรดระบุข้อมูล" onChange={e => sc('roomName', e.target.value)} /></LcField>
        <LcField label="เลขทะเบียนอาคารชุด"><input className="cfg-input" value={c.regNo} placeholder="โปรดระบุข้อมูล" onChange={e => sc('regNo', e.target.value)} /></LcField>
        <LcField label="เนื้อที่ประมาณ (ตร.ม.)"><input className="cfg-input" value={c.areaSqm} placeholder="โปรดระบุข้อมูล" onChange={e => sc('areaSqm', e.target.value)} /></LcField>
      </div>
      <div className="lrq-grid c1" style={{ marginTop: 10 }}>
        <LcField label="เลขที่โฉนด (สามารถใส่ได้มากกว่า 1 เลขที่โฉนด โดยใส่เครื่องหมายจุลภาค (,) เช่น 12345, 67890)">
          <input className="cfg-input" value={c.titleNos} placeholder="โปรดระบุข้อมูล" onChange={e => sc('titleNos', e.target.value)} />
        </LcField>
      </div>
      <div className="lrq-grid c4" style={{ marginTop: 10 }}>
        <LcField label="จังหวัด"><LcProvince value={c.province} onChange={v => { sc('province', v); sc('amphoe', ''); sc('tambon', ''); }} /></LcField>
        <LcField label="อำเภอ"><LcAmphoe province={c.province} value={c.amphoe} onChange={v => { sc('amphoe', v); sc('tambon', ''); }} /></LcField>
        <LcField label="ตำบล"><LcTambon amphoe={c.amphoe} value={c.tambon} onChange={v => sc('tambon', v)} /></LcField>
      </div>
    </>
  );
}

// ── ฟอร์มสิ่งปลูกสร้าง ─────────────────────────────────────────────
function LcBuildingBody({ rec, set, pool }) {
  const b = rec.building || {};
  const sb = (k, v) => set('building', { ...b, [k]: v });
  return (
    <>
      <LcSec>รายละเอียดสิ่งปลูกสร้าง</LcSec>
      <div className="lrq-grid c3">
        <LcField label="ประเภทสิ่งปลูกสร้าง">
          <select className="cfg-input" value={b.btype || ''} onChange={e => sb('btype', e.target.value)}>
            <option value="">--- โปรดเลือก ---</option>
            {window.LC_BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </LcField>
        <LcField label="อื่นๆ (โปรดระบุ)"><input className="cfg-input" value={b.otherType} placeholder="โปรดระบุข้อมูล" onChange={e => sb('otherType', e.target.value)} /></LcField>
        <LcField label="ลักษณะการใช้ประโยชน์">
          <select className="cfg-input" value={b.usage || ''} onChange={e => sb('usage', e.target.value)}>
            <option value="">--- โปรดเลือก ---</option>
            {window.LC_USAGE.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </LcField>
      </div>
      <div className="lrq-grid c4" style={{ marginTop: 10 }}>
        <LcField label="เลขที่บ้าน/เลขที่ใบอนุญาต"><input className="cfg-input" value={b.houseNo} placeholder="โปรดระบุข้อมูล" onChange={e => sb('houseNo', e.target.value)} /></LcField>
        <LcField label="วันที่ออกใบอนุญาต"><ErpDate value={lcIsoCE(b.permitDate)} onChange={v => sb('permitDate', v)} /></LcField>
        <LcField label="หมู่"><input className="cfg-input" value={b.moo} placeholder="โปรดระบุข้อมูล" onChange={e => sb('moo', e.target.value)} /></LcField>
        <LcField label="ซอย"><input className="cfg-input" value={b.soi} placeholder="โปรดระบุข้อมูล" onChange={e => sb('soi', e.target.value)} /></LcField>
        <LcField label="ถนน"><input className="cfg-input" value={b.road} placeholder="โปรดระบุข้อมูล" onChange={e => sb('road', e.target.value)} /></LcField>
        <LcField label="จังหวัด"><LcProvince value={b.province} onChange={v => { sb('province', v); sb('amphoe', ''); sb('tambon', ''); }} /></LcField>
        <LcField label="อำเภอ"><LcAmphoe province={b.province} value={b.amphoe} onChange={v => { sb('amphoe', v); sb('tambon', ''); }} /></LcField>
        <LcField label="ตำบล"><LcTambon amphoe={b.amphoe} value={b.tambon} onChange={v => sb('tambon', v)} /></LcField>
        <LcField label="รหัสไปรษณีย์"><input className="cfg-input" value={b.postcode} placeholder="โปรดระบุข้อมูล" onChange={e => sb('postcode', e.target.value)} /></LcField>
        <LcField label="ละติจูด"><input className="cfg-input" value={b.lat} placeholder="โปรดระบุข้อมูล" onChange={e => sb('lat', e.target.value)} /></LcField>
        <LcField label="ลองจิจูด"><input className="cfg-input" value={b.lng} placeholder="โปรดระบุข้อมูล" onChange={e => sb('lng', e.target.value)} /></LcField>
      </div>

      <LcSec>ข้อมูลอ้างอิงที่ดิน</LcSec>
      {(() => {
        const nos = window.lcBldTitleNos(rec);
        const TT = window.LC_TITLE_TYPES || [];
        const rows = nos.map(no => ({ no, land: (pool || []).find(r => TT.includes(r.type) && r.titleNo === no) }));
        const n = (v) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
        const totWa = rows.reduce((s, x) => s + (x.land ? n(x.land.rai) * 400 + n(x.land.ngan) * 100 + n(x.land.wa) : 0), 0);
        const tr = Math.floor(totWa / 400), tn = Math.floor((totWa % 400) / 100), tw = +(totWa % 100).toFixed(2);
        if (!rows.length) return <div className="muted" style={{ fontSize: 12 }}>ยังไม่ได้เชื่อมโฉนด — ข้อมูลที่ดินจะแสดงเมื่อเชื่อมโฉนดในส่วนหลักทรัพย์ที่เกี่ยวข้อง</div>;
        return (
          <div className="lrq-tblwrap"><table className="tbl lrq-tbl">
            <thead><tr>
              <th style={{ width: 48 }} className="center">ลำดับ</th>
              <th>เลขที่โฉนด</th><th>ประเภท</th><th>เลขที่ดิน</th><th>หน้าสำรวจ</th>
              <th className="right">ไร่</th><th className="right">งาน</th><th className="right">ตารางวา</th>
              <th>สำนักงานที่ดิน</th>
            </tr></thead>
            <tbody>
              {rows.map((x, i) => x.land ? (
                <tr key={x.no}>
                  <td className="center">{i + 1}</td>
                  <td className="mono">{x.no}</td><td>{x.land.type}</td>
                  <td>{x.land.landNo || '—'}</td><td>{x.land.surveyPage || '—'}</td>
                  <td className="right">{x.land.rai || 0}</td><td className="right">{x.land.ngan || 0}</td><td className="right">{x.land.wa || 0}</td>
                  <td>{[x.land.landOfficeProvince, x.land.landOfficeBranch].filter(Boolean).join(' · ') || '—'}</td>
                </tr>
              ) : (
                <tr key={x.no}>
                  <td className="center">{i + 1}</td><td className="mono">{x.no}</td>
                  <td colSpan="7" style={{ color: '#cf1322' }}>ไม่พบโฉนดนี้ในทะเบียนหลักทรัพย์ของสมาชิก</td>
                </tr>
              ))}
              {rows.length > 1 && (
                <tr style={{ background: '#FAFAFA', fontWeight: 600 }}>
                  <td colSpan="5" className="right">รวมเนื้อที่ดิน {rows.length} แปลง</td>
                  <td className="right">{tr}</td><td className="right">{tn}</td><td className="right">{tw}</td><td />
                </tr>
              )}
            </tbody>
          </table></div>
        );
      })()}

      <LcSec>รายละเอียดโครงสร้างสิ่งปลูกสร้าง</LcSec>
      <div className="lrq-grid c4">
        <LcField label="ปีที่ก่อสร้าง (พ.ศ.)"><input className="cfg-input" value={b.yearBuilt} placeholder="โปรดระบุข้อมูล" onChange={e => sb('yearBuilt', e.target.value)} /></LcField>
        <LcField label="ปีที่แล้วเสร็จ (พ.ศ.)"><input className="cfg-input" value={b.yearDone} placeholder="โปรดระบุข้อมูล" onChange={e => sb('yearDone', e.target.value)} /></LcField>
        <LcField label="อายุอาคาร (จำนวนปี)"><input className="cfg-input" value={b.ageYears} placeholder="โปรดระบุข้อมูล" onChange={e => sb('ageYears', e.target.value)} /></LcField>
        <LcField label="จำนวนชั้น"><input className="cfg-input" value={b.floors} placeholder="โปรดระบุข้อมูล" onChange={e => sb('floors', e.target.value)} /></LcField>
        <LcField label="พื้นที่ใช้สอย (ตร.ม.)"><input className="cfg-input" value={b.usableArea} placeholder="โปรดระบุข้อมูล" onChange={e => sb('usableArea', e.target.value)} /></LcField>
        <LcField label="ขนาดอาคาร (กว้าง)"><input className="cfg-input" value={b.width} placeholder="โปรดระบุข้อมูล" onChange={e => sb('width', e.target.value)} /></LcField>
        <LcField label="ขนาดอาคาร (ยาว)"><input className="cfg-input" value={b.length} placeholder="โปรดระบุข้อมูล" onChange={e => sb('length', e.target.value)} /></LcField>
      </div>

      <LcSec>โครงสร้างหลัก</LcSec>
      <div className="lrq-grid c4">
        <LcField label="โครงสร้างอาคาร">
          <select className="cfg-input" value={b.structure || ''} onChange={e => sb('structure', e.target.value)}>
            <option value="">--- โปรดเลือก ---</option>
            {window.LC_STRUCTURE.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </LcField>
        <LcField label="วัสดุผนัง"><input className="cfg-input" value={b.wallMat} placeholder="โปรดระบุข้อมูล" onChange={e => sb('wallMat', e.target.value)} /></LcField>
        <LcField label="วัสดุหลังคา"><input className="cfg-input" value={b.roofMat} placeholder="โปรดระบุข้อมูล" onChange={e => sb('roofMat', e.target.value)} /></LcField>
        <LcField label="พื้น"><input className="cfg-input" value={b.floorMat} placeholder="โปรดระบุข้อมูล" onChange={e => sb('floorMat', e.target.value)} /></LcField>
        <LcField label="เพดาน"><input className="cfg-input" value={b.ceilingMat} placeholder="โปรดระบุข้อมูล" onChange={e => sb('ceilingMat', e.target.value)} /></LcField>
      </div>

      <LcSec>รายละเอียดภายใน (ถ้ามี)</LcSec>
      <div className="lrq-grid c4">
        <LcField label="จำนวนห้องนอน"><input className="cfg-input" value={b.bedrooms} placeholder="โปรดระบุข้อมูล" onChange={e => sb('bedrooms', e.target.value)} /></LcField>
        <LcField label="จำนวนห้องน้ำ"><input className="cfg-input" value={b.bathrooms} placeholder="โปรดระบุข้อมูล" onChange={e => sb('bathrooms', e.target.value)} /></LcField>
        <LcField label="จำนวนห้องครัว"><input className="cfg-input" value={b.kitchens} placeholder="โปรดระบุข้อมูล" onChange={e => sb('kitchens', e.target.value)} /></LcField>
        <LcField label="จำนวนที่จอดรถ"><input className="cfg-input" value={b.parking} placeholder="โปรดระบุข้อมูล" onChange={e => sb('parking', e.target.value)} /></LcField>
        <LcField label="สิ่งอำนวยความสะดวก"><input className="cfg-input" value={b.amenities} placeholder="โปรดระบุข้อมูล" onChange={e => sb('amenities', e.target.value)} /></LcField>
      </div>

      <LcSec>ข้อมูลด้านมูลค่า (ใช้กับภาษี/ประเมิน)</LcSec>
      <div className="lrq-grid c4">
        <LcField label="ราคาประเมินสิ่งปลูกสร้าง"><LcNum value={b.buildAppraisal} onChange={v => sb('buildAppraisal', v)} placeholder="00.00" /></LcField>
        <LcField label="ราคาประเมิน/ตร.ม."><LcNum value={b.appraisalPerSqm} onChange={v => sb('appraisalPerSqm', v)} placeholder="00.00" /></LcField>
        <LcField label="ค่าเสื่อมราคา (เปอร์เซ็นต์)"><LcNum value={b.depreciation} onChange={v => sb('depreciation', v)} placeholder="00.00" /></LcField>
        <LcField label="มูลค่าคงเหลือ"><LcNum value={b.residualValue} onChange={v => sb('residualValue', v)} placeholder="00.00" /></LcField>
        <LcField label="มูลค่ารวม (ที่ดิน + สิ่งปลูกสร้าง)"><LcNum value={b.totalValue} onChange={v => sb('totalValue', v)} placeholder="00.00" /></LcField>
      </div>

      <LcSec>สถานะหลักประกัน</LcSec>
      <div className="lrq-grid c4">
        <LcField label="สถานะการก่อสร้าง">
          <select className="cfg-input" value={b.buildStatus || ''} onChange={e => sb('buildStatus', e.target.value)}>
            <option value="">--- โปรดเลือก ---</option>
            {window.LC_BUILD_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </LcField>
        <LcField label="เลขที่ใบอนุญาตก่อสร้าง"><input className="cfg-input" value={b.permitNo} placeholder="โปรดระบุข้อมูล" onChange={e => sb('permitNo', e.target.value)} /></LcField>
        <LcField label="วันที่อนุญาตก่อสร้าง"><input className="cfg-input" value={b.permitApproveDate} placeholder="วว/ดด/ปปปป" onChange={e => sb('permitApproveDate', e.target.value)} /></LcField>
        <LcField label="ภาระผูกพัน">
          <select className="cfg-input" value={b.obligation || ''} onChange={e => sb('obligation', e.target.value)}>
            <option value="">--- โปรดเลือก ---</option>
            {window.LC_OBLIGATION.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </LcField>
      </div>
    </>
  );
}

// ── Modal "ดูรายละเอียดหลักทรัพย์" (อ่านอย่างเดียว) ──────────────────
function LcAssetDetailModal({ rec, onClose }) {
  const isLand = (window.LC_TITLE_TYPES || []).includes(rec.type);
  const c = rec.condo || {}, b = rec.building || {};
  const Row = ({ k, v }) => (v || v === 0) && v !== '' ? <div className="cs-dt-row"><span className="cs-dt-k">{k}</span><span className="cs-dt-v">{v}</span></div> : null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card cs-dt-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isLand ? 'bank' : 'home'} /></div>
          <h2>รายละเอียดหลักทรัพย์</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="cs-dt-head">
            <div className="cs-dt-title">{lcAssetTitle(rec)}<span className="chip" style={{ marginLeft: 8 }}>{rec.type}</span></div>
            {rec.code && <div className="cs-dt-code mono">รหัสหลักทรัพย์ : {rec.code}</div>}
          </div>

          <div className="cs-dt-sec">ข้อมูลหลัก</div>
          <div className="cs-dt-grid">
            {isLand && <><Row k="เลขที่โฉนด" v={rec.titleNo} /><Row k="เล่ม / หน้า" v={[rec.volume, rec.page].filter(Boolean).join(' / ')} /><Row k="หมู่" v={rec.moo} /><Row k="ระวาง" v={rec.rawang} /><Row k="เลขที่ดิน" v={rec.landNo} /><Row k="หน้าสำรวจ" v={rec.surveyPage} /></>}
            {rec.type === 'ห้องชุด' && <><Row k="เลขที่ห้องชุด" v={c.roomNo} /><Row k="ชั้น" v={c.floor} /><Row k="อาคาร" v={c.buildingNo} /><Row k="ชื่อห้องชุด" v={c.roomName} /><Row k="เลขทะเบียนอาคารชุด" v={c.regNo} /><Row k="เลขที่โฉนด" v={c.titleNos} /></>}
            {rec.type === 'สิ่งปลูกสร้าง' && <><Row k="ประเภทสิ่งปลูกสร้าง" v={b.btype} /><Row k="ลักษณะการใช้ประโยชน์" v={b.usage} /><Row k="เลขที่บ้าน" v={b.houseNo} /><Row k="จำนวนชั้น" v={b.floors} /><Row k="โครงสร้าง" v={b.structure} /><Row k="ตั้งอยู่บนโฉนด" v={window.lcBldTitleNos(rec).join(', ')} /></>}
            <Row k="เนื้อที่" v={lcAssetArea(rec)} />
            <Row k="ที่ตั้ง" v={lcAssetLoc(rec)} />
            <Row k="สำนักงานที่ดิน" v={[rec.landOfficeProvince, rec.landOfficeBranch].filter(Boolean).join(' · ')} />
            {rec.type === 'ห้องชุด' && rec.refTitleNo && <Row k="โฉนดอ้างอิง" v={'เลขที่ ' + rec.refTitleNo} />}
          </div>

          <div className="cs-dt-sec">ราคาประเมิน</div>
          <div className="cs-dt-grid">
            <Row k="ราคาประเมินราชการ" v={rec.govPrice ? '฿' + rec.govPrice : (rec.govPerWa ? '฿' + rec.govPerWa + '/ตร.ว.' : '')} />
            <Row k="ราคาประเมินสหกรณ์" v={rec.coopPrice ? '฿' + rec.coopPrice : ''} />
            <Row k="ราคาประเมินผู้ได้รับใบอนุญาต" v={rec.licensedPrice ? '฿' + rec.licensedPrice : ''} />
            <Row k="ค้ำประกันสูงสุด" v={rec.maxGuarPct ? rec.maxGuarPct + '%' : ''} />
            <Row k="สรุปราคาประเมิน" v={rec.summaryPrice ? '฿' + rec.summaryPrice : ''} />
            {rec.type === 'สิ่งปลูกสร้าง' && <Row k="มูลค่ารวม (ที่ดิน+สิ่งปลูกสร้าง)" v={b.totalValue ? '฿' + b.totalValue : ''} />}
          </div>

          {(rec.owners || []).length > 0 && (
            <>
              <div className="cs-dt-sec">รายชื่อเจ้าของหลักทรัพย์</div>
              <div className="cs-dt-owners">
                {rec.owners.filter(o => o.name).map((o, i) => (
                  <div key={i} className="cs-dt-owner">
                    <span className="cs-dt-owner-n">{o.name}</span>
                    <span className="cs-dt-owner-m">{[o.citizenId && ('บัตร ' + o.citizenId), o.age && ('อายุ ' + o.age), o.marital].filter(Boolean).join(' · ')}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {rec.note && <><div className="cs-dt-sec">หมายเหตุ</div><div className="cs-dt-note">{rec.note}</div></>}
        </div>
        <div className="lrq-sal-foot">
          <button className="btn primary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ── ส่วนแสดงหลักทรัพย์ที่เกี่ยวข้อง (หลังเลือกแล้ว) ───────────────────
//  สิ่งปลูกสร้าง → โฉนดที่ตั้งอยู่ · ที่ดิน → สิ่งปลูกสร้างบนที่ดิน (+ หลักทรัพย์อื่นที่เชื่อมเอง)
function lcRelatedOf(rec, list) {
  const TT = window.LC_TITLE_TYPES || [];
  const pool = (list || []).filter(r => r.id !== rec.id);
  let structural = [], label = '';
  if (rec.type === 'สิ่งปลูกสร้าง') { structural = window.lcLandsOf(rec, pool); label = 'ที่ดินที่ตั้ง'; }
  else if (TT.includes(rec.type)) { structural = window.lcBuildingsOn(rec, pool); label = 'สิ่งปลูกสร้างบนที่ดิน'; }
  const sIds = new Set(structural.map(r => r.id));
  const free = (rec.relatedIds || []).map(id => pool.find(r => r.id === id)).filter(r => r && !sIds.has(r.id));
  return { structural, free, label };
}
function LcRelatedSection({ rec, list, onManage, onRemove, onView, error }) {
  const TT = window.LC_TITLE_TYPES || [];
  const { structural, free, label } = lcRelatedOf(rec, list);
  const isBld = rec.type === 'สิ่งปลูกสร้าง', isLand = TT.includes(rec.type);
  const linked = [...structural.map(r => ({ r, tag: label })), ...free.map(r => ({ r, tag: '' }))];
  const hint = isBld ? 'สิ่งปลูกสร้างนี้ตั้งอยู่บนโฉนดใด (เลือกได้หลายแปลง)'
    : isLand ? 'ที่ดินแปลงนี้มีสิ่งปลูกสร้างใดตั้งอยู่ (เลือกได้หลายรายการ)' : '';
  return (
    <>
      <LcSec action={<button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={onManage}><Icon name="edit" size={13} /> เชื่อมหลักประกัน</button>}>
        หลักทรัพย์ที่เกี่ยวข้อง{isBld && <span style={{ color: '#ff4d4f' }}> *</span>}
        {hint && <span className="muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8, color: 'rgba(0,0,0,.45)' }}>{hint}</span>}
      </LcSec>
      {linked.length === 0 ? (
        <div className="cs-rel-empty" style={isBld ? { borderColor: '#ffccc7', background: '#fff2f0', color: '#cf1322' } : null}>
          <Icon name={isBld ? 'info' : 'home'} size={16} />
          <span>{isBld ? 'ยังไม่ได้เชื่อมโฉนดที่ตั้ง — กด “เชื่อมหลักประกัน” เพื่อเลือกโฉนดที่สิ่งปลูกสร้างนี้ตั้งอยู่'
            : isLand ? 'ยังไม่มีสิ่งปลูกสร้างบนที่ดินนี้ — กด “เชื่อมหลักประกัน” เพื่อเลือกสิ่งปลูกสร้างที่ตั้งอยู่บนโฉนดนี้'
            : 'ยังไม่ได้เลือกหลักทรัพย์ที่เกี่ยวข้อง — กด “เชื่อมหลักประกัน” เพื่อเชื่อมโยงหลักทรัพย์'}</span>
        </div>
      ) : (
        <>
        {error && <div className="dep-error" style={{ marginBottom: 8 }}><Icon name="info" size={13} /> {error}</div>}
        <div className="cs-rel-list">
          {linked.map(({ r, tag }) => (
            <div key={r.id} className="cs-rel-item">
              <span className="cs-rel-item-ico"><Icon name={TT.includes(r.type) ? 'bank' : 'home'} size={16} /></span>
              <div className="cs-rel-item-body">
                <div className="cs-rel-item-t">
                  {lcAssetTitle(r)}<span className="chip" style={{ marginLeft: 8 }}>{r.type}</span>
                  {tag && <span className="chip" style={{ marginLeft: 6, background: 'var(--brand-100, #EAFEF2)', color: 'var(--brand-700, #237450)', borderColor: 'transparent' }}>{tag}</span>}
                  {r.code ? <span className="cs-rel-item-code mono">{r.code}</span> : null}
                </div>
                <div className="cs-rel-item-meta">
                  <span><b>เนื้อที่:</b> {lcAssetArea(r)}</span>
                  <span><b>ที่ตั้ง:</b> {lcAssetLoc(r)}</span>
                  {r.type === 'สิ่งปลูกสร้าง' && window.lcBldTitleNos(r).length > 1 && <span><b>สร้างคร่อมโฉนด:</b> {window.lcBldTitleNos(r).join(', ')}</span>}
                  {TT.includes(r.type) && isBld && window.lcBuildingsOn(r, list).length > 1 && <span><b>สิ่งปลูกสร้างบนแปลงนี้:</b> {window.lcBuildingsOn(r, list).length} รายการ</span>}
                  {(() => { const p = r.summaryPrice || r.coopPrice || r.govPrice || (r.building && r.building.totalValue); return p ? <span><b>ราคาประเมิน:</b> ฿{p}</span> : null; })()}
                </div>
              </div>
              <div className="cs-rel-item-act">
                <button className="lrq-eyebtn lrq-eyebtn-g act-view" title="ดูรายละเอียด" onClick={() => onView(r)}
                        style={{ background: '#fff', border: '1px solid #D9D9D9', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={14} /></button>
                <button className="btn sm act-del" title="นำออกจากรายการที่เกี่ยวข้อง" onClick={() => onRemove(r.id)}
                        style={{ background: '#fff', border: '1px solid #D9D9D9', color: 'var(--danger)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}><Icon name="trash" size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </>
  );
}

// ── ฟอร์มหลักทรัพย์ (ประกอบตามประเภท) ───────────────────────────────
function LcForm({ rec, onChange, onUpdateItems, memberCollaterals, onToast, hideApprConfirm }) {
  const [relModal, setRelModal] = useState(false);
  const [viewRec, setViewRec] = useState(null);
  const set = (k, v) => onChange({ ...rec, [k]: v });
  const isLand = (window.LC_TITLE_TYPES || []).includes(rec.type);
  const variant = isLand ? 'land' : 'other';

  const confirmAppraisal = (mode) => {
    if (mode === 'confirm-appraisal') {
      const fmted = rec.summaryPrice || window.lcCalcSummary(rec);
      onChange({ ...rec, summaryPrice: fmted });
      onToast && onToast('บันทึกราคาประเมินเรียบร้อย — สรุปราคาประเมิน ฿' + (fmted || '0.00'));
    } else {
      onToast && onToast(mode);
    }
  };

  // ผูก/เลิกผูก สิ่งปลูกสร้าง ↔ โฉนด (หลายต่อหลาย) — เก็บที่ฝั่งสิ่งปลูกสร้าง (building.refTitleNos)
  const TT = window.LC_TITLE_TYPES || [];
  const withTitles = (b, nos, pool) => {
    const lands = nos.map(no => (pool || []).find(r => TT.includes(r.type) && r.titleNo === no)).filter(Boolean);
    const f = lands[0] || {};
    return {
      ...b, refTitleNo: nos[0] || '', refLandOfficeProvince: f.landOfficeProvince || '', refLandOfficeBranch: f.landOfficeBranch || '', refLandOfficeSubBranch: f.landOfficeSubBranch || '',
      building: { ...(b.building || {}), refTitleNos: nos, refTitleNo: nos[0] || '', refLandNo: f.landNo || '', refSurveyPage: f.surveyPage || '', rai: f.rai || '', ngan: f.ngan || '', wa: f.wa || '' },
    };
  };
  const pool = memberCollaterals || [];
  const applyLinks = (ids) => {
    const byId = (id) => pool.find(r => r.id === id);
    if (rec.type === 'สิ่งปลูกสร้าง') {
      const nos = ids.map(byId).filter(r => r && TT.includes(r.type) && r.titleNo).map(r => r.titleNo);
      const freeIds = ids.filter(id => { const r = byId(id); return r && !TT.includes(r.type); });
      onChange({ ...withTitles(rec, [...new Set(nos)], pool), relatedIds: freeIds });
      return nos.length;
    }
    if (TT.includes(rec.type)) {
      const bldIds = new Set(ids.filter(id => (byId(id) || {}).type === 'สิ่งปลูกสร้าง'));
      const freeIds = ids.filter(id => !bldIds.has(id));
      const upd = { [rec.id]: { ...rec, relatedIds: freeIds } };
      pool.filter(r => r.type === 'สิ่งปลูกสร้าง' && r.id !== rec.id).forEach(b => {
        const cur = window.lcBldTitleNos(b);
        const has = cur.includes(rec.titleNo), want = bldIds.has(b.id);
        if (has === want) return;
        const nos = want ? [...cur, rec.titleNo] : cur.filter(n => n !== rec.titleNo);
        upd[b.id] = withTitles(b, nos, pool);
      });
      if (onUpdateItems) onUpdateItems(upd);
      else { onChange(upd[rec.id]); if (Object.keys(upd).length > 1) onToast && onToast('การแก้ไขฝั่งสิ่งปลูกสร้างจะมีผลเมื่อบันทึกจากหน้าทะเบียนหลักทรัพย์'); }
      return bldIds.size;
    }
    onChange({ ...rec, relatedIds: ids });
    return ids.length;
  };
  const relInitial = (() => { const x = lcRelatedOf(rec, pool); return [...x.structural, ...x.free].map(r => r.id); })();
  const removeLink = (id) => applyLinks(relInitial.filter(x => x !== id));

  return (
    <div className="search-card lrq-sheet cs-form">
      <LcTypeHeader rec={rec} set={set} pool={pool} relatedCount={relInitial.length} onRelated={() => setRelModal(true)} onPickRef={() => setRelModal(true)}
                    refError={window.lcBldTitleNos(rec).length ? window.lcBuildingRefError(rec, pool) : ''} />
      {isLand && <LcLandBody rec={rec} set={set} />}
      {rec.type === 'ห้องชุด' && <LcCondoBody rec={rec} set={set} />}
      {rec.type === 'สิ่งปลูกสร้าง' && <LcBuildingBody rec={rec} set={set} pool={pool} />}
      <LcRelatedSection rec={rec} list={memberCollaterals} onManage={() => setRelModal(true)}
                        error={rec.type === 'สิ่งปลูกสร้าง' && window.lcBldTitleNos(rec).length ? window.lcBuildingRefError(rec, pool) : ''}
                        onRemove={removeLink}
                        onView={(r) => setViewRec(r)} />
      <LcAppraisal rec={rec} set={set} patch={onChange} variant={variant} onConfirm={confirmAppraisal} hideConfirm={hideApprConfirm} />
      <LcNote value={rec.note} onChange={v => set('note', v)} />
      <LcSec action={<button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={() => set('owners', [...(rec.owners || []), { name: '', citizenId: '', age: '', marital: '', spouse: '', father: '', mother: '' }])}><Icon name="plus" size={13} /> เพิ่มข้อมูล</button>}>รายชื่อเจ้าของหลักทรัพย์</LcSec>
      <LcOwnerTable owners={rec.owners || []} set={v => set('owners', v)} />
      {relModal && (
        <LcRelatedModal current={rec} list={memberCollaterals} initial={relInitial}
                        onView={(r) => setViewRec(r)}
                        onConfirm={(ids) => { applyLinks(ids); setRelModal(false); onToast && onToast('เชื่อมโยงหลักทรัพย์ที่เกี่ยวข้อง ' + ids.length + ' รายการ'); }}
                        onClose={() => setRelModal(false)} />
      )}
      {viewRec && <LcAssetDetailModal rec={viewRec} onClose={() => setViewRec(null)} />}
    </div>
  );
}

// ── รายการหลักทรัพย์ (ซ้าย) ─────────────────────────────────────────
function LcList({ items, activeId, onSelect, onDelete }) {
  return (
    <div className="table-wrap cs-list">
      <table className="tbl">
        <thead><tr><th>ประเภทหลักทรัพย์</th><th>ที่ตั้ง</th><th style={{ width: 72 }}>การปรับแต่ง</th></tr></thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id} className={"clickable" + (r.id === activeId ? " cs-active" : "")} onClick={() => onSelect(r.id)}>
              <td className={r.sub ? "cs-subrow" : ""}>{r.sub ? '• ' : ''}{r.type}</td>
              <td>{r.locProvince || r.landOfficeProvince || '—'}</td>
              <td className="center">
                <div className="lrq-rowact">
                  <button className="lrq-eyebtn act-edit act-sm" title="แก้ไข" onClick={(e) => { e.stopPropagation(); onSelect(r.id); }}><Icon name="edit" size={13} /></button>
                  {onDelete && <button className="lrq-delbtn act-del act-sm" title="ลบ" onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}><Icon name="trash" size={13} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  หน้าหลัก — บันทึกหลักทรัพย์
// ═════════════════════════════════════════════════════════════════
function LoanCollateralPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [member, setMember] = useState(null);
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);

  window.useBreadcrumb([{ label: 'บันทึกหลักทรัพย์', current: true }], []);

  const pickMember = (m) => {
    const full = (window.MEMBERS_LIST || []).find(x => x.code === m.code) || m;
    setMember(full);
    const list = window.lcOf(full.code);
    setItems(list);
    setActiveId(list.length ? list[0].id : null);
    // ถ้ายังไม่มีหลักทรัพย์ ให้เปิดฟอร์มเปล่าให้เพิ่มได้ทันที
    if (!list.length) { const blank = window.lcBlank('โฉนด'); setItems([blank]); setActiveId(blank.id); }
  };

  const active = items.find(r => r.id === activeId) || null;
  const updateActive = (rec) => setItems(items.map(r => r.id === activeId ? rec : r));

  const addCollateral = () => {
    const blank = window.lcBlank('โฉนด');
    setItems([...items, blank]);
    setActiveId(blank.id);
  };
  const deleteCollateral = (id) => {
    const next = items.filter(r => r.id !== id);
    setItems(next);
    if (activeId === id) setActiveId(next.length ? next[0].id : null);
    onToast && onToast('ลบหลักทรัพย์ออกจากรายการแล้ว');
  };

  const confirm = () => {
    if (audit && audit.log) {
      audit.log({ action: 'update', module: 'สินเชื่อ — บันทึกหลักทรัพย์',
        target: `${member.code} · ${member.name}`,
        summary: `บันทึกทะเบียนหลักทรัพย์ ${items.length} รายการ` });
    }
    onToast && onToast(`บันทึกหลักทรัพย์ของ ${member.name} เรียบร้อยแล้ว (${items.length} รายการ)`);
  };

  return (
    <div data-screen-label="บันทึกหลักทรัพย์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>บันทึกหลักทรัพย์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึก/แก้ไขทะเบียนหลักทรัพย์ค้ำประกันเงินกู้ของสมาชิก</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setSearchOpen(true)}><Icon name="search" /> ค้นหาหลักทรัพย์</button>
      </div>

      <div className="cs-layout">
        {/* ── ซ้าย: สมาชิก + รายการหลักทรัพย์ ── */}
        <div className="cs-left">
          <div className="search-card cs-member-card">
            <LcField label="เลขสมาชิก">
              <div className="cs-member-pick">
                <input className="cfg-input mono" value={member ? member.code : ''} placeholder="โปรดระบุข้อมูล" readOnly />
                <button className="btn primary cs-member-btn" title="ค้นหาสมาชิก" onClick={() => setSearchOpen(true)}><Icon name="userPlus" size={15} /></button>
              </div>
            </LcField>
            <LcField label="ชื่อ-นามสกุล"><input className="cfg-input lrq-ro" value={member ? member.name : ''} placeholder="โปรดระบุข้อมูล" readOnly /></LcField>
            <LcField label="หน่วย/สังกัด"><input className="cfg-input lrq-ro" value={member ? (member.deptCode ? member.deptCode + '-' + member.dept : member.dept || '') : ''} placeholder="โปรดระบุข้อมูล" readOnly /></LcField>
          </div>

          {member && (
            <>
              <button className="btn primary block cs-add-btn" onClick={addCollateral}><Icon name="plus" /> เพิ่มหลักทรัพย์</button>
              <LcList items={items} activeId={activeId} onSelect={setActiveId} onDelete={deleteCollateral} />
            </>
          )}
        </div>

        {/* ── ขวา: ฟอร์มหลักทรัพย์ ── */}
        <div className="cs-right">
          {active ? (
            <LcForm rec={active} onChange={updateActive} onUpdateItems={(u) => setItems(prev => prev.map(r => u[r.id] || r))} memberCollaterals={items} onToast={onToast} />
          ) : (
            <div className="search-card cs-empty">
              <div className="gc-ph-ico"><Icon name="search" size={26} /></div>
              <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
              <div className="gc-ph-sub">ค้นหาและเลือกสมาชิกเพื่อบันทึก/แก้ไขทะเบียนหลักทรัพย์ค้ำประกันเงินกู้</div>
              <button className="btn primary" onClick={() => setSearchOpen(true)}><Icon name="search" /> ค้นหาเลขสมาชิก</button>
            </div>
          )}
        </div>
      </div>

      {member && (
        <div className="cs-footer">
          <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="eye" /> ประวัติการใช้งาน</button>
          <span className="spacer" />
          <button className="btn" onClick={() => { setMember(null); setItems([]); setActiveId(null); }}>ยกเลิก</button>
          <button className="btn primary" onClick={confirm}><Icon name="check" /> ยืนยัน</button>
        </div>
      )}

      {searchOpen && (
        <MemberSearchModal onPick={(m) => { pickMember(m); setSearchOpen(false); }} onClose={() => setSearchOpen(false)}
                           title="ค้นหาสมาชิก — บันทึกหลักทรัพย์" source={window.MEMBERS_LIST} />
      )}
      {histOpen && member && (
        <TxHistoryDrawer memberCode={member.code} memberName={member.name}
                         modules={['สินเชื่อ — บันทึกหลักทรัพย์']} title="ประวัติการใช้งาน — บันทึกหลักทรัพย์"
                         onClose={() => setHistOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { LoanCollateralPage, LcAssetDetailModal, lcAssetTitle, lcAssetArea, lcAssetLoc, LcForm, LcSec, LcField, LcNum });
