// ═════════════════════════════════════════════════════════════════
//  ทะเบียนสมาชิก — หน้ารายละเอียด/แก้ไขสมาชิก (v2)
//   · ประเภทสมาชิก: สมาชิกสามัญ / สมาชิกสมทบ (ค่าเก่านอกชุด → ต้องเลือกใหม่)
//   · ทุกช่องวันที่ใช้ปฏิทินไทย พ.ศ. (ThaiDateInput จาก 423)
//   · ข้อมูลคู่สมรส: กรอกแก้ไขได้ใน edit mode (grid เดียวกับข้อมูลส่วนตัว)
//   · สถานะการทำงาน / สาเหตุการลาออก: dropdown ชุดใหม่
//   · ผู้รับผลประโยชน์: ความสัมพันธ์ "อื่น ๆ" → มีช่องระบุต่อในแถวเดียวกัน
//   · ประเภทการสมัครสมาชิก (แท็บสถานะภาพ): ชุดตัวเลือกใหม่
//   · แท็บหักประจำเดือน: คอลัมน์งวด = จำนวนงวดคงเหลือ (ตัวเลข)
// ═════════════════════════════════════════════════════════════════

var EditCtx = window.EditCtx || (window.EditCtx = React.createContext({ editing: false, setEditing: () => {} }));

window.MEMBER_TYPE_OPTIONS = ['สมาชิกสามัญ', 'สมาชิกสมทบ'];
// ค่าเก่า (สมาชิกถาวร / ชั่วคราว) → แสดงเป็นชุดใหม่
window.normalizeMemberType = (v) => {
  const s = String(v || '').trim();
  if (window.MEMBER_TYPE_OPTIONS.includes(s)) return s;
  if (/ถาวร/.test(s)) return 'สมาชิกสามัญ';
  if (/ชั่วคราว|สมทบ/.test(s)) return 'สมาชิกสมทบ';
  return s || 'สมาชิกสามัญ';
};
window.WORK_STATUS_OPTIONS = ['พนักงานปกติ', 'เกษียณ (ปกติ)', 'เกษียณ (ก่อนกำหนด)'];
window.MEMBER_RESIGN_REASON_OPTIONS = window.RESIGN_REASON_OPTIONS;
window.SPOUSE_TITLE_OPTIONS = window.TITLE_OPTIONS;

window.APPLICATION_TYPE_OPTIONS = [
  { value: 'none',        label: 'ไม่ระบุ' },
  { value: 'pnt',         label: 'ปณท.' },
  { value: 'cat',         label: 'กสท.' },
  { value: 'nbtc',        label: 'กสทช.' },
  { value: 'retire_head', label: 'เกษียณส่วนกลาง' },
  { value: 'retire_reg',  label: 'เกษียณส่วนภูมิภาค' },
  { value: 'chpt',        label: 'ฌปท.' },
  { value: 'socat',       label: 'สอ.กสท' },
  { value: 'shop',        label: 'สหกรณ์ร้านค้า' },
  { value: 'associate',   label: 'สมาชิกสมทบ' },
  { value: 'pntdb',       label: 'ปณทดบ' },
];

// ── คอลัมน์ "งวด" ในแท็บหักประจำเดือน = งวดคงเหลือ (ตัวเลข) ──
(function () {
  const remain = (t) => {
    const m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(t || '').trim());
    if (!m) return null;
    return Math.max(0, Number(m[2]) - Number(m[1]));
  };
  const patch = (list) => (list || []).forEach((r) => {
    const n = remain(r.term);
    if (n != null) r.term = n;
    else if (typeof r.term === 'string' && !/^\d+$/.test(r.term)) r.term = '—';
  });
  const run = () => {
    if (window.MEMBER_DATA) patch(window.MEMBER_DATA.deductions);
    if (window.MEMBER_DATA_POOL) Object.values(window.MEMBER_DATA_POOL).forEach((d) => d && patch(d.deductions));
  };
  run();
  window.mnPatchDeductionTerms = run;
})();

// ── หัวคอลัมน์: "คืนเงิน" → "คืนใบเสร็จ" (ตารางแท็บจัดเก็บ) ──
(function () {
  const fix = () => {
    document.querySelectorAll('th').forEach((th) => {
      if (th.textContent.trim() !== 'คืนเงิน') return;
      const node = [...th.childNodes].find((n) => n.textContent.trim() === 'คืนเงิน');
      if (node) node.textContent = 'คืนใบเสร็จ';
    });
  };
  const start = () => {
    fix();
    new MutationObserver(fix).observe(document.body, { childList: true, subtree: true });
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);
})();

// ── เติมข้อมูลคู่สมรสให้ครบทุกฟิลด์ (mock) ──
window.mnSpouseDefaults = function (sp, member) {
  const s = sp || {};
  const m = member || {};
  const mkId = () => {
    const base = String(m.citizenId || '3-1015-00821-45-2').replace(/\D/g, '');
    const shifted = (Number(base.slice(-4) || '1234') + 137) % 10000;
    return '3-1019-00' + String(shifted).padStart(4, '0') + '-21-8';
  };
  return {
    title: s.title ?? 'นาง',
    firstName: s.firstName ?? 'พิมพ์ใจ',
    lastName: s.lastName ?? (m.lastName || 'ทองสุข'),
    citizenId: s.citizenId ?? mkId(),
    birthDate: s.birthDate ?? '1979-06-14',
    gender: s.gender ?? (m.gender === 'ชาย' ? 'หญิง' : 'ชาย'),
    nationality: s.nationality ?? 'ไทย',
    employeeId: s.employeeId ?? 'EMP-058714',
    isMember: !!s.isMember,
    memberCode: s.memberCode || null,
  };
};

// ── สถานะการทำงานค่าเก่า → ชุดตัวเลือกใหม่ ──
window.WORK_STATUS_ALIAS = {
  'ปฏิบัติงาน': 'พนักงานปกติ',
  'ทำงานปกติ': 'พนักงานปกติ',
  'ปกติ': 'พนักงานปกติ',
  'เกษียณ': 'เกษียณ (ปกติ)',
  'เกษียณอายุ': 'เกษียณ (ปกติ)',
  'เกษียณก่อนกำหนด': 'เกษียณ (ก่อนกำหนด)',
};
window.mnWorkStatus = function (v) {
  const s = String(v || '');
  if (window.WORK_STATUS_OPTIONS.indexOf(s) >= 0) return s;
  return window.WORK_STATUS_ALIAS[s] || '';
};
(function () {
  const fix = (d) => { if (d && d.member) d.member.workStatus = window.mnWorkStatus(d.member.workStatus); };
  fix(window.MEMBER_DATA);
  if (window.MEMBER_DATA_POOL) Object.values(window.MEMBER_DATA_POOL).forEach(fix);
})();

// ─── ตรวจสอบตารางบุตร / ผู้รับผลประโยชน์ (กดบันทึกจึงแสดง) ───────────────
const cid13 = (v) => String(v || '').replace(/\D/g, '').length === 13;
window.validateKids = (kids) => {
  const bad = {};
  (kids || []).forEach(c => {
    const miss = [];
    if (!String(c.title || '').trim()) miss.push('title');
    if (!String(c.firstName || '').trim()) miss.push('firstName');
    if (!String(c.lastName || '').trim()) miss.push('lastName');
    if (!c.birthDate) miss.push('birthDate');
    if (!String(c.eduLevel || '').trim()) miss.push('eduLevel');
    if (!cid13(c.citizenId)) miss.push('citizenId');
    if (miss.length) bad[c.id] = miss;
  });
  return bad;
};
window.validateBens = (bens) => {
  const bad = {};
  (bens || []).forEach(b => {
    const miss = [];
    if (!String(b.title || '').trim()) miss.push('title');
    if (!String(b.firstName || '').trim()) miss.push('firstName');
    if (!String(b.lastName || '').trim()) miss.push('lastName');
    if (!String(b.relation || '').trim()) miss.push('relation');
    if (/^อื่น/.test(String(b.relation || '')) && !String(b.relationOther || '').trim()) miss.push('relationOther');
    if (!(Number(b.share) > 0)) miss.push('share');
    if (!cid13(b.citizenId)) miss.push('citizenId');
    if (miss.length) bad[b.id] = miss;
  });
  return bad;
};
window.benShareTotal = (bens) => (bens || []).reduce((a, b) => a + (Number(b.share) || 0), 0);

const errStyle = { borderColor: 'var(--danger)', boxShadow: '0 0 0 2px color-mix(in srgb, var(--danger) 18%, transparent)' };
const cls = (base, on) => on ? base + ' has-error' : base;

// ─── ข้อมูลบุตร (วันเกิดเป็นปฏิทินไทย พ.ศ.) ─────────────────
function ChildrenSection({ editing, kids, setKids, errors }) {
  const err = errors || {};
  const bad = (id, k) => (err[id] || []).includes(k);
  const eStyle = () => undefined; // ไม่ขึ้นขอบแดง — แสดงข้อความใต้ section แทน
  const eduOpts = (window.SCH_OPTS && window.SCH_OPTS.eduLevel) || [];
  const titleOpts = window.CHILD_TITLE_OPTS || [];
  const setKid = (id, k, v) => setKids(list => list.map(c => c.id === id ? { ...c, [k]: v } : c));
  const addKid = () => setKids(list => [...list, {
    id: window.childUid(), title: '', firstName: '', lastName: '',
    citizenId: '', birthDate: '', eduLevel: '', schoolYear: '2569', studying: true,
  }]);
  const delKid = (id) => setKids(list => list.filter(c => c.id !== id));

  return (
    <div className="section">
      <div className="section-head">
        <span className="head-bar" />
        <h3>ข้อมูลบุตร <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {kids.length} คน</span></h3>
        {editing && (
          <span className="head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn primary sm" onClick={addKid}><Icon name="plus" /> เพิ่มบุตร</button>
          </span>
        )}
      </div>

      {kids.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 12px' }}>
          ยังไม่มีข้อมูลบุตร{editing ? ' — กดปุ่ม “เพิ่มบุตร” เพื่อบันทึก' : ''}
        </div>
      ) : !editing ? (
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <th style={{ width: 34 }} className="center">#</th>
            <th>ชื่อ-สกุล</th>
            <th>เลขบัตรประชาชน</th>
            <th>วันเกิด / อายุ</th>
            <th>ระดับชั้น</th>
            <th className="center">ปีการศึกษา</th>
            <th className="center">กำลังศึกษา</th>
          </tr></thead>
          <tbody>
            {kids.map((c, i) => (
              <tr key={c.id}>
                <td className="center muted mono">{i + 1}</td>
                <td>{window.childFullName(c)}</td>
                <td className="mono">{c.citizenId || '—'}</td>
                <td>{c.birthDate ? `${window.isoToTh(c.birthDate)} (${fmt.ageYM(c.birthDate)})` : '—'}</td>
                <td>{window.schLabel('eduLevel', c.eduLevel)}</td>
                <td className="center mono">{c.schoolYear || '—'}</td>
                <td className="center">
                  {c.studying
                    ? <span className="pill ok">กำลังศึกษา</span>
                    : <span className="pill neutral">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      ) : (
        <div className="table-wrap"><table className="tbl ch-edit">
          <thead><tr>
            <th style={{ width: 86 }}>คำนำหน้า</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th style={{ width: 170 }}>เลขบัตรประชาชน</th>
            <th style={{ width: 170 }}>วันเกิด</th>
            <th style={{ width: 180 }}>ระดับชั้น</th>
            <th style={{ width: 110 }}>ปีการศึกษา</th>
            <th style={{ width: 78 }} className="center">กำลังศึกษา</th>
            <th style={{ width: 56 }} />
          </tr></thead>
          <tbody>
            {kids.map(c => (
              <tr key={c.id}>
                <td>
                  <select className="cfg-input" value={c.title} style={eStyle(c.id, 'title')} onChange={(e) => setKid(c.id, 'title', e.target.value)}>
                    <option value="">— เลือก —</option>
                    {titleOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input" value={c.firstName} style={eStyle(c.id, 'firstName')} onChange={(e) => setKid(c.id, 'firstName', e.target.value)} placeholder="ชื่อจริง" /></td>
                <td><input className="cfg-input" value={c.lastName} style={eStyle(c.id, 'lastName')} onChange={(e) => setKid(c.id, 'lastName', e.target.value)} placeholder="นามสกุล" /></td>
                <td><input className="cfg-input mono" value={c.citizenId} maxLength={17} style={eStyle(c.id, 'citizenId')} onChange={(e) => setKid(c.id, 'citizenId', window.maskCitizenId ? window.maskCitizenId(e.target.value) : e.target.value)} placeholder="1-2345-67890-12-3" /></td>
                <td>
                  <window.ThaiDateInput value={c.birthDate || ''} onChange={(v) => setKid(c.id, 'birthDate', v)} />
                </td>
                <td>
                  <select className="cfg-input" value={c.eduLevel} style={eStyle(c.id, 'eduLevel')} onChange={(e) => setKid(c.id, 'eduLevel', e.target.value)}>
                    <option value="">— เลือก —</option>
                    {eduOpts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input mono" type="number" inputMode="numeric" value={c.schoolYear || ''} onChange={(e) => setKid(c.id, 'schoolYear', e.target.value)} placeholder="2569" /></td>
                <td className="center">
                  <input type="checkbox" className="ch-box" checked={!!c.studying} onChange={(e) => setKid(c.id, 'studying', e.target.checked)} />
                </td>
                <td className="center">
                  <button className="btn danger sm icon-only" onClick={() => delKid(c.id)} title="ลบบุตร"><Icon name="trash" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {editing && Object.keys(err).length > 0 && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, fontWeight: 600 }}>
          <Icon name="warning" size={12} /> กรุณากรอกข้อมูลให้ครบทุกช่อง
        </p>
      )}
      {editing && (
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> ข้อมูลบุตรนี้จะถูกนำไปใช้ในการสร้างคำขอทุนสวัสดิการทุนการศึกษา
        </p>
      )}
    </div>
  );
}

// ─── ผู้รับผลประโยชน์ (มีช่องระบุความสัมพันธ์เมื่อเลือก "อื่น ๆ") ───────
function BeneficiariesSection({ editing, bens, setBens, errors, shareError }) {
  const err = errors || {};
  const bad = (id, k) => (err[id] || []).includes(k);
  const eStyle = () => undefined; // ไม่ขึ้นขอบแดง — แสดงข้อความใต้ section แทน
  const titleOpts = window.BENEFICIARY_TITLE_OPTS || [];
  const relOpts = window.BENEFICIARY_RELATION_OPTS || [];
  const isOther = (v) => /^อื่น/.test(String(v || ''));
  const setBen = (id, k, v) => setBens(list => list.map(b => b.id === id ? { ...b, [k]: v } : b));
  const addBen = () => setBens(list => [...list, {
    id: window.benUid(), title: '', firstName: '', lastName: '',
    relation: '', relationOther: '', citizenId: '', share: '',
  }]);
  const delBen = (id) => setBens(list => list.filter(b => b.id !== id));
  const totalShare = bens.reduce((a, b) => a + (Number(b.share) || 0), 0);
  const relText = (b) => isOther(b.relation)
    ? (b.relationOther ? `อื่น ๆ · ${b.relationOther}` : 'อื่น ๆ')
    : (b.relation || '—');

  return (
    <div className="section">
      <div className="section-head">
        <span className="head-bar" />
        <h3>ผู้รับผลประโยชน์ <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}>· {bens.length} ราย</span></h3>
        {editing && (
          <span className="head-actions" style={{ marginLeft: 'auto' }}>
            <button className="btn primary sm" onClick={addBen}><Icon name="plus" /> เพิ่มผู้รับผลประโยชน์</button>
          </span>
        )}
      </div>

      {bens.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px 12px' }}>
          ยังไม่มีข้อมูลผู้รับผลประโยชน์{editing ? ' — กดปุ่ม “เพิ่มผู้รับผลประโยชน์” เพื่อบันทึก' : ''}
        </div>
      ) : !editing ? (
        <div className="table-wrap"><table className="tbl">
          <thead><tr>
            <th style={{ width: 34 }} className="center">#</th>
            <th>ชื่อ-สกุล</th>
            <th style={{ width: 180 }}>ความสัมพันธ์</th>
            <th>เลขบัตรประชาชน</th>
            <th className="num" style={{ width: 120 }}>สัดส่วน</th>
          </tr></thead>
          <tbody>
            {bens.map((b, i) => (
              <tr key={b.id}>
                <td className="center muted mono">{i + 1}</td>
                <td>{window.benFullName(b)}</td>
                <td><span className="chip info">{relText(b)}</span></td>
                <td className="mono">{b.citizenId || '—'}</td>
                <td className="num">{b.share != null ? b.share + '%' : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr>
            <td colSpan="4" className="right">รวมสัดส่วนผลประโยชน์</td>
            <td className="num"><b style={{ color: totalShare === 100 ? 'var(--success)' : 'var(--warning)' }}>{totalShare}%</b></td>
          </tr></tfoot>
        </table></div>
      ) : (
        <div className="table-wrap"><table className="tbl ch-edit">
          <thead><tr>
            <th style={{ width: 92 }}>คำนำหน้า</th>
            <th>ชื่อ</th>
            <th>นามสกุล</th>
            <th style={{ width: 240 }}>ความสัมพันธ์</th>
            <th style={{ width: 170 }}>เลขบัตรประชาชน</th>
            <th style={{ width: 110 }}>สัดส่วน (%)</th>
            <th style={{ width: 56 }} />
          </tr></thead>
          <tbody>
            {bens.map(b => (
              <tr key={b.id}>
                <td>
                  <select className="cfg-input" value={b.title} style={eStyle(b.id, 'title')} onChange={(e) => setBen(b.id, 'title', e.target.value)}>
                    <option value="">— เลือก —</option>
                    {titleOpts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td><input className="cfg-input" value={b.firstName} style={eStyle(b.id, 'firstName')} onChange={(e) => setBen(b.id, 'firstName', e.target.value)} placeholder="ชื่อจริง" /></td>
                <td><input className="cfg-input" value={b.lastName} style={eStyle(b.id, 'lastName')} onChange={(e) => setBen(b.id, 'lastName', e.target.value)} placeholder="นามสกุล" /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <select className="cfg-input" style={{ flex: '0 0 108px', ...(eStyle(b.id, 'relation') || {}) }} value={b.relation}
                            onChange={(e) => setBen(b.id, 'relation', e.target.value)}>
                      <option value="">— เลือก —</option>
                      {relOpts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    {isOther(b.relation) && (
                      <input className="cfg-input" style={{ flex: 1, minWidth: 0, ...(eStyle(b.id, 'relationOther') || {}) }} value={b.relationOther || ''}
                             onChange={(e) => setBen(b.id, 'relationOther', e.target.value)}
                             placeholder="ระบุความสัมพันธ์" />
                    )}
                  </div>
                </td>
                <td><input className="cfg-input mono" value={b.citizenId} maxLength={17} style={eStyle(b.id, 'citizenId')} onChange={(e) => setBen(b.id, 'citizenId', window.maskCitizenId ? window.maskCitizenId(e.target.value) : e.target.value)} placeholder="1-2345-67890-12-3" /></td>
                <td><input className="cfg-input num" type="number" min="0" max="100" value={b.share} style={eStyle(b.id, 'share')} onChange={(e) => setBen(b.id, 'share', e.target.value === '' ? '' : Number(e.target.value))} /></td>
                <td className="center">
                  <button className="btn danger sm icon-only" onClick={() => delBen(b.id)} title="ลบผู้รับผลประโยชน์"><Icon name="trash" size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {editing && Object.keys(err).length > 0 && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 8, fontWeight: 600 }}>
          <Icon name="warning" size={12} /> กรุณากรอกข้อมูลให้ครบทุกช่อง
        </p>
      )}
      {editing && shareError && (
        <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
          <Icon name="warning" size={12} /> กรุณาระบุสัดส่วนให้รวมเป็น 100% (ขณะนี้ {totalShare}%)
        </p>
      )}
      {editing && (
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> สัดส่วนผลประโยชน์รวมทุกรายควรเท่ากับ 100%
        </p>
      )}
    </div>
  );
}

// ─── ช่องบังคับกรอก (อิงหน้าเพิ่มสมาชิก) ─────────────────────────────
window.validateMemberDetail = function (m, shares) {
  const e = {};
  const req = (k, msg) => { if (!String(m[k] ?? '').trim()) e[k] = msg; };
  req('title', 'กรุณาเลือกคำนำหน้า'); req('firstName', 'กรุณาระบุชื่อ'); req('lastName', 'กรุณาระบุนามสกุล');
  req('departmentCode', 'กรุณาเลือกสังกัดหัวหน้า');
  if (String(m.citizenId || '').replace(/\D/g, '').length !== 13) e.citizenId = 'เลขบัตรประชาชนต้องมี 13 หลัก';
  req('addrNo', 'กรุณาระบุบ้านเลขที่'); req('province', 'กรุณาเลือกจังหวัด'); req('amphoe', 'กรุณาเลือกอำเภอ / เขต');
  req('tambon', 'กรุณาเลือกตำบล / แขวง'); if (!/^\d{5}$/.test(String(m.zipcode || ''))) e.zipcode = 'รหัสไปรษณีย์ต้องมี 5 หลัก'; req('mobile', 'กรุณาระบุโทรศัพท์มือถือ');
  req('maritalStatus', 'กรุณาเลือกสถานภาพสมรส'); req('gender', 'กรุณาเลือกเพศ'); req('nationality', 'กรุณาระบุสัญชาติ');
  req('birthDate', 'กรุณาระบุวันเดือนปีเกิด'); req('memberType', 'กรุณาเลือกประเภทสมาชิก'); req('employeeId', 'กรุณาระบุเลขพนักงาน');
  if (!(Number(m.salary) > 0)) e.salary = 'กรุณาระบุเงินเดือน';
  req('joinDate', 'กรุณาระบุวันที่เป็นสมาชิก');
  const shRow = (shares || [])[0];
  const shareV = m.shareValue != null && m.shareValue !== '' ? m.shareValue : (shRow ? shRow.perMonth : '');
  if (!String(shareV ?? '').trim()) e.shareValue = 'กรุณาระบุมูลค่าหุ้นรายเดือน';
  if (m.maritalStatus === 'สมรส') {
    const sp = window.mnSpouseDefaults(m.spouseInfo, m);
    if (!(sp.isMember && sp.memberCode)) [['title', 'กรุณาเลือกคำนำหน้า'], ['firstName', 'กรุณาระบุชื่อคู่สมรส'], ['lastName', 'กรุณาระบุนามสกุลคู่สมรส'],
     ['citizenId', 'กรุณาระบุเลขบัตรประชาชนคู่สมรส'], ['birthDate', 'กรุณาระบุวันเกิดคู่สมรส'],
     ['gender', 'กรุณาเลือกเพศคู่สมรส'], ['nationality', 'กรุณาระบุสัญชาติคู่สมรส']]
      .forEach(([k, msg]) => { if (!String(sp[k] ?? '').trim()) e['sp.' + k] = msg; });
  }
  return e;
};

// ─── ช่องในแท็บรายละเอียด (ระดับโมดูล เพื่อไม่ให้ input หลุดโฟกัส) ───
const DetailCtx = React.createContext({ editing: false, err: {} });
function DtErr({ k }) {
  const { err } = React.useContext(DetailCtx);
  return err[k] ? <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 2 }}>{err[k]}</span> : null;
}
function DtLabel({ label, required }) {
  const { editing } = React.useContext(DetailCtx);
  return <span className="label">{label}{editing && required && <span className="cfg-required">*</span>}</span>;
}
const dtWrap = (span) => span > 1 ? { gridColumn: 'span ' + span } : null;
const dtErrStyle = (err, k) => err[k] ? { borderColor: 'var(--danger)' } : undefined;
function DtText({ label, value, onChange, required, k, span, mono, display, inputMode, maxLength, locked, placeholder }) {
  const { editing, err } = React.useContext(DetailCtx);
  return (
    <div className="field" style={dtWrap(span)}>
      <DtLabel label={label} required={required} />
      {editing && locked ? (
        <input className={"value" + (mono ? " mono" : "")} value={value ?? ''} readOnly tabIndex={-1} style={{ background: '#FAFAFA', cursor: 'default' }} />
      ) : editing ? (
        <input className={"value" + (mono ? " mono" : "")} value={value ?? ''} style={dtErrStyle(err, k)}
               inputMode={inputMode} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <span className={"value" + (mono ? " mono" : "")}>{display ?? (value || '—')}</span>
      )}
      <DtErr k={k} />
    </div>
  );
}
function DtDate({ label, value, onChange, span, suffix, required, k, locked }) {
  const { editing, err } = React.useContext(DetailCtx);
  return (
    <div className="field" style={dtWrap(span)}>
      <DtLabel label={label} required={required} />
      {editing && locked ? (
        <input className="value" value={value ? window.isoToTh(value) : ''} readOnly tabIndex={-1} style={{ background: '#FAFAFA', cursor: 'default' }} />
      ) : editing ? (
        <window.ThaiDateInput value={value || ''} onChange={onChange} error={err[k]} />
      ) : (
        <span className="value">{value ? window.isoToTh(value) + (suffix ? ' (' + suffix + ')' : '') : '—'}</span>
      )}
      <DtErr k={k} />
    </div>
  );
}
function DtSelect({ label, value, options, onChange, placeholder, span, required, k, disabled, locked }) {
  const { editing, err } = React.useContext(DetailCtx);
  return (
    <div className="field" style={dtWrap(span)}>
      <DtLabel label={label} required={required} />
      {editing && locked ? (
        <input className="value" value={value || ''} readOnly tabIndex={-1} style={{ background: '#FAFAFA', cursor: 'default' }} />
      ) : editing ? (
        <select className="value" value={value || ''} disabled={disabled} style={dtErrStyle(err, k)} onChange={(e) => onChange(e.target.value)}>
          {placeholder && <option value="">{placeholder}</option>}
          {(options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <span className="value">{value || '—'}</span>
      )}
      <DtErr k={k} />
    </div>
  );
}

// ─── แท็บรายละเอียดสมาชิก ──────────────────────────────────────────
function DetailsTab({ data, setData, editing, kids, setKids, bens, setBens, kidErrors, benErrors, shareError, detailErrors }) {
  const m = data.member;
  const ADDR_KEYS = ['addrNo', 'addrMoo', 'village', 'soi', 'road', 'province', 'amphoe', 'tambon', 'zipcode'];
  const update = (k) => (v) => setData(d => {
    const nm = { ...d.member, [k]: v };
    if (k === 'province') { nm.amphoe = ''; nm.tambon = ''; nm.zipcode = ''; }
    if (k === 'amphoe') { nm.tambon = ''; nm.zipcode = ''; }
    if (k === 'tambon') nm.zipcode = (window.ZIP_BY_TAMBON || {})[v] || '';
    if (ADDR_KEYS.indexOf(k) >= 0) nm.address = window.mnFormAddress(nm);
    return { ...d, member: nm };
  });
  const married = m.maritalStatus === 'สมรส';
  const sp = React.useMemo(() => window.mnSpouseDefaults(m.spouseInfo, m), [m.spouseInfo, m.citizenId]);
  const setSpAll = (patch) => setData(d => ({
    ...d, member: { ...d.member, spouseInfo: { ...window.mnSpouseDefaults(d.member.spouseInfo, d.member), ...patch } },
  }));
  const setSp = (k) => (v) => setSpAll({ [k]: v });
  const memberTypeVal = window.normalizeMemberType(m.memberType);
  const subsidiaryVal = m.subsidiaryType || ((String(m.memberType || '').match(/\((.+)\)/) || [])[1] || '');

  // แสดงข้อผิดพลาดหลังกดบันทึกครั้งแรก และอัปเดตตามค่าปัจจุบัน
  const err = editing && detailErrors && Object.keys(detailErrors).length ? window.validateMemberDetail(m, data.shares) : {};
  const errStyle = (k) => dtErrStyle(err, k);
  const ErrMsg = DtErr, Label = DtLabel, TextField = DtText, DateField = DtDate, SelectField = DtSelect;

  const phone = (v) => window.maskPhone ? window.maskPhone(v) : v;
  const money = (v) => (v === '' || v == null) ? '—' : '฿ ' + fmt.money(Number(v) || 0);
  const amphoeOpts = (window.AMPHOES || {})[m.province] || [];
  const tambonOpts = (window.TAMBONS || {})[m.amphoe] || [];
  const zipOpts = (() => { const zm = window.ZIP_BY_TAMBON || {}; const z = zm[m.tambon]; const all = z ? [z] : Array.from(new Set(Object.values(zm))).sort(); return m.zipcode && all.indexOf(m.zipcode) < 0 ? [m.zipcode, ...all] : all; })();
  const shareRow = (data.shares || [])[0];
  const shareValue = m.shareValue != null && m.shareValue !== '' ? m.shareValue : (shareRow ? shareRow.perMonth : '');

  const splitThaiName = (full) => {
    const t = (window.TITLE_OPTIONS || []).slice().sort((x, y) => y.length - x.length).find(x => String(full).startsWith(x)) || '';
    const rest = String(full).slice(t.length).trim().split(/\s+/);
    return { title: t, firstName: rest[0] || '', lastName: rest.slice(1).join(' ') };
  };
  const memberPool = (window.MEMBERS_LIST || []).filter(x => x.code !== m.code);
  const pickSpouse = (x) => {
    const n = splitThaiName(x.name);
    setSpAll({ isMember: true, memberCode: x.code, ...n, citizenId: x.citizenId || '',
      birthDate: x.birthDate || '', gender: n.title === 'นาย' ? 'ชาย' : (n.title ? 'หญิง' : ''),
      nationality: x.nationality || 'ไทย', employeeId: x.employeeId || '' });
    setData(d => ({ ...d, member: { ...d.member, spouse: x.name } }));
  };
  const spLocked = !!(sp.isMember && sp.memberCode);
  const [spModal, setSpModal] = React.useState(false);
  const clearSpouseMember = () => {
    setSpAll({ isMember: false, memberCode: '', title: '', firstName: '', lastName: '', citizenId: '',
      birthDate: '', gender: '', nationality: '', employeeId: '' });
    setData(d => ({ ...d, member: { ...d.member, spouse: '' } }));
  };
  const [deptModal, setDeptModal] = React.useState(false);
  const pickDept = (x) => setData(dd => ({ ...dd, member: { ...dd.member, departmentCode: x.code,
    department: x.name, workDepartment: x.unit || '' } }));
  const deptRec = window.affilByCode ? window.affilByCode(m.departmentCode) : null;
  const deptHead = deptRec ? deptRec.head : '';

  return (
    <DetailCtx.Provider value={{ editing, err }}>
    <EditCtx.Provider value={{ editing }}>
      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลการสมัคร</h3>
        </div>
        <div className="form-grid">
          <div className="field">
            <span className="label">เลขสมาชิก</span>
            <span className="value mono">{m.code || '—'}</span>
          </div>
          <DateField label="วันที่เป็นสมาชิก" value={m.joinDate} onChange={update('joinDate')} required k="joinDate" />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลส่วนตัว</h3>
        </div>
        <div className="form-grid">
          <TextField label="เลขบัตรประชาชน" value={m.citizenId} mono maxLength={17} required k="citizenId" placeholder="1-2345-67890-12-3" inputMode="numeric"
                     onChange={(v) => update('citizenId')(window.maskCitizenId ? window.maskCitizenId(v) : v)} />
          <div className="name-row">
            <SelectField label="คำนำหน้า" value={m.title} options={window.TITLE_OPTIONS} placeholder="ระบุคำนำหน้า"
                         onChange={update('title')} required k="title" />
            <TextField label="ชื่อ" value={m.firstName} onChange={update('firstName')} required k="firstName" placeholder="ระบุชื่อ" />
            <TextField label="นามสกุล" value={m.lastName} onChange={update('lastName')} required k="lastName" placeholder="ระบุนามสกุล" />
          </div>
          <SelectField label="เพศ" value={m.gender} options={window.GENDER_OPTIONS || ['ชาย', 'หญิง']}
                       placeholder="ระบุเพศ" onChange={update('gender')} required k="gender" />
          <TextField label="สัญชาติ" value={m.nationality} onChange={update('nationality')} required k="nationality" placeholder="เช่น ไทย" />
          <DateField label="วันเดือนปีเกิด" value={m.birthDate} onChange={update('birthDate')} required k="birthDate" />
          <div className="field">
            <span className="label">อายุ</span>
            <span className="value">{m.birthDate ? fmt.ageYM(m.birthDate) : '—'}</span>
          </div>
          <SelectField label="สถานภาพสมรส" value={m.maritalStatus} options={window.MARITAL_OPTIONS}
                       placeholder="ระบุสถานภาพสมรส" onChange={update('maritalStatus')} required k="maritalStatus" />
        </div>
      </div>

      {married && (
      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลคู่สมรส</h3>
          {sp.isMember && sp.memberCode && (
            <span className="chip primary" style={{ marginLeft: 8 }} title="คู่สมรสเป็นสมาชิกสหกรณ์">
              <span className="dot-c" /> สมาชิก {sp.memberCode}
            </span>
          )}
        </div>
            {editing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <div className={"mf-radio" + (sp.isMember ? " on" : "")}
                     style={{ display: 'inline-flex', height: 34, width: 'fit-content', flex: 'none', padding: '0 12px' }}
                     onClick={() => sp.isMember ? clearSpouseMember() : setSpAll({ isMember: true })}>
                  <span className="dot" /> คู่สมรสเป็นสมาชิก
                </div>
                {sp.isMember && (
                  <div style={{ flex: '0 1 240px', minWidth: 180 }}>
                    <div>
                      <SearchPickerField value={sp.memberCode} items={memberPool}
                                         onPick={pickSpouse}
                                         onOpenModal={() => setSpModal(true)}
                                         notFoundText="ไม่พบเลขทะเบียนนี้ในระบบ"
                                         placeholder="เลขทะเบียนสมาชิก…" />
                    </div>
                  </div>
                )}
                {sp.isMember && sp.memberCode && (
                  <span className="chip success" style={{ flex: 'none', whiteSpace: 'nowrap' }}>
                    <Icon name="check" size={11} /> ดึงข้อมูลคู่สมรสจาก {sp.memberCode} แล้ว
                  </span>
                )}
                {spModal && window.MemberSearchModal && React.createElement(window.MemberSearchModal, {
                  source: memberPool, title: 'ค้นหาสมาชิก',
                  onClose: () => setSpModal(false),
                  onPick: (x) => { setSpModal(false); pickSpouse(x); },
                })}
              </div>
            )}
        <div className="form-grid">
          <div className="name-row">
            <SelectField label="คำนำหน้า" value={sp.title} options={window.TITLE_OPTIONS} locked={spLocked}
                         placeholder="ระบุคำนำหน้า" onChange={setSp('title')} required k="sp.title" />
            <TextField label="ชื่อ" value={sp.firstName} onChange={setSp('firstName')} locked={spLocked} required k="sp.firstName" placeholder="ระบุชื่อคู่สมรส" />
            <TextField label="นามสกุล" value={sp.lastName} onChange={setSp('lastName')} locked={spLocked} required k="sp.lastName" placeholder="ระบุนามสกุลคู่สมรส" />
          </div>
          <TextField label="เลขบัตรประชาชน" value={sp.citizenId} mono maxLength={17} locked={spLocked} required k="sp.citizenId" placeholder="1-2345-67890-12-3" inputMode="numeric"
                     onChange={(v) => setSp('citizenId')(window.maskCitizenId ? window.maskCitizenId(v) : v)} />
          <DateField label="วันเกิด" value={sp.birthDate} onChange={setSp('birthDate')} locked={spLocked} required k="sp.birthDate" />
          <div className="field">
            <span className="label">อายุ</span>
            <span className="value">{sp.birthDate ? fmt.ageYM(sp.birthDate) : '—'}</span>
          </div>
          <SelectField label="เพศ" value={sp.gender} options={window.GENDER_OPTIONS || ['ชาย', 'หญิง']} locked={spLocked}
                       placeholder="ระบุเพศ" onChange={setSp('gender')} required k="sp.gender" />
          <TextField label="สัญชาติ" value={sp.nationality} onChange={setSp('nationality')} locked={spLocked} required k="sp.nationality" placeholder="เช่น ไทย" />
          <TextField label="รหัสพนักงาน" value={sp.employeeId} mono onChange={setSp('employeeId')} locked={spLocked} k="sp.employeeId" placeholder="เช่น EMP-042189" />
        </div>
      </div>
      )}

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลการทำงาน</h3>
        </div>
        <div className="form-grid">
          <SelectField label="ประเภทสมาชิก" value={memberTypeVal} options={window.MEMBER_TYPE_OPTIONS}
                       placeholder="ระบุประเภทสมาชิก" onChange={update('memberType')} required k="memberType" />
          {memberTypeVal === 'สมาชิกสมทบ' && (
            <SelectField label="ประเภทการสมทบ" value={subsidiaryVal} options={window.SUBSIDIARY_TYPE_OPTIONS || []}
                         placeholder="ระบุประเภทการสมทบ" onChange={update('subsidiaryType')} />
          )}
          <TextField label="รหัสพนักงาน" value={m.employeeId} mono onChange={update('employeeId')} required k="employeeId" placeholder="เช่น EMP-042189" />
          <div className="field">
            <Label label="สังกัดหัวหน้า" required />
            {editing ? (
              <SearchPickerField value={m.departmentCode || ''}
                                 items={window.DEPARTMENTS || []}
                                 labelOf={(x) => `${x.code} · ${x.name}`}
                                 onPick={pickDept}
                                 onOpenModal={() => setDeptModal(true)}
                                 notFoundText="ไม่พบเลขสังกัดนี้ในระบบ"
                                 placeholder="เลขสังกัด…" />
            ) : (
              <span className="value">{window.affilLabel ? window.affilLabel(m.departmentCode, m.department) : (m.department || '—')}</span>
            )}
            {deptModal && typeof DepartmentSearchModal !== 'undefined' && (
              <DepartmentSearchModal onPick={(x) => { pickDept(x); setDeptModal(false); }} onClose={() => setDeptModal(false)} />
            )}
            <ErrMsg k="departmentCode" />
          </div>
          <div className="field">
            <span className="label">หัวหน้าสังกัด</span>
            {editing ? (
              <input className="value" value={deptHead || ''} readOnly tabIndex={-1}
                     placeholder="แสดงอัตโนมัติเมื่อเลือกสังกัด" style={{ background: '#FAFAFA', cursor: 'default' }} />
            ) : (
              <span className="value">{deptHead || '—'}</span>
            )}
          </div>
          <TextField label="ชื่อหน่วยงาน" value={m.workDepartment} onChange={update('workDepartment')} locked />
          <TextField label="เงินเดือน" value={m.salary || ''} display={'฿ ' + fmt.money(m.salary) + ' / เดือน'} inputMode="decimal"
                     onChange={(v) => update('salary')(Number(String(v).replace(/[^\d.]/g, '')) || 0)} required k="salary" placeholder="0.00" />
          <DateField label="วันที่เกษียณอายุ" value={m.retireDate} onChange={update('retireDate')}
                     suffix={m.retireDate ? fmt.retireCountdown(m.retireDate) : ''} />
          <SelectField label="สถานะการทำงาน" value={window.mnWorkStatus(m.workStatus)} options={window.WORK_STATUS_OPTIONS}
                       placeholder="ระบุสถานะการทำงาน" onChange={update('workStatus')} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลที่อยู่</h3>
        </div>
        <div className="form-grid">
            <div className="field">
              <Label label="บ้านเลขที่ / หมู่" required />
              {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="value" style={{ flex: 2, minWidth: 0, ...(errStyle('addrNo') || {}) }} value={m.addrNo || ''}
                       placeholder="บ้านเลขที่" onChange={(e) => update('addrNo')(e.target.value)} />
                <input className="value" style={{ flex: 1, minWidth: 0 }} value={m.addrMoo || ''}
                       placeholder="หมู่" onChange={(e) => update('addrMoo')(e.target.value)} />
              </div>
              ) : (
                <span className="value">{m.addrNo ? m.addrNo + (m.addrMoo ? ' หมู่ ' + m.addrMoo : '') : '—'}</span>
              )}
              <ErrMsg k="addrNo" />
            </div>
            <TextField label="หมู่บ้าน / อาคาร" value={m.village} onChange={update('village')} placeholder="ระบุหมู่บ้าน" />
            <TextField label="ซอย" value={m.soi} onChange={update('soi')} placeholder="ระบุซอย" />
            <TextField label="ถนน" value={m.road} onChange={update('road')} placeholder="ระบุถนน" />
            <SelectField label="จังหวัด" value={m.province} options={window.PROVINCES || []} placeholder="— เลือกจังหวัด —"
                         onChange={update('province')} required k="province" />
            <SelectField label="อำเภอ / เขต" value={m.amphoe} options={amphoeOpts} disabled={!m.province}
                         placeholder={m.province ? '— เลือกอำเภอ/เขต —' : 'เลือกจังหวัดก่อน'} onChange={update('amphoe')} required k="amphoe" />
            <SelectField label="ตำบล / แขวง" value={m.tambon} options={tambonOpts} disabled={!m.amphoe}
                         placeholder={m.amphoe ? '— เลือกตำบล/แขวง —' : 'เลือกอำเภอก่อน'} onChange={update('tambon')} required k="tambon" />
            <SelectField label="รหัสไปรษณีย์" value={m.zipcode} options={zipOpts} disabled={!m.tambon}
                         placeholder={m.tambon ? '— เลือกรหัสไปรษณีย์ —' : 'เลือกตำบลก่อน'} onChange={update('zipcode')} required k="zipcode" />
          </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลการติดต่อ</h3>
        </div>
        <div className="form-grid">
          <TextField label="โทรศัพท์ที่บ้าน" value={m.phoneHome} mono inputMode="tel" maxLength={12} placeholder="xx-xxx-xxxx"
                     onChange={(v) => update('phoneHome')(phone(v))} />
          <div className="field">
            <Label label="โทรศัพท์ที่ทำงาน" />
            {editing ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="value mono" style={{ flex: 2, minWidth: 0 }} value={m.phoneWork || ''} inputMode="tel" maxLength={12} placeholder="xx-xxx-xxxx"
                       onChange={(e) => update('phoneWork')(phone(e.target.value))} />
                <input className="value mono" style={{ flex: 1, minWidth: 0 }} value={m.phoneWorkExt || ''} placeholder="ต่อ"
                       onChange={(e) => update('phoneWorkExt')(e.target.value.replace(/\D/g, ''))} />
              </div>
            ) : (
              <span className="value mono">{m.phoneWork ? m.phoneWork + (m.phoneWorkExt ? ' ต่อ ' + m.phoneWorkExt : '') : '—'}</span>
            )}
          </div>
          <TextField label="โทรศัพท์มือถือ" value={m.mobile} mono inputMode="tel" maxLength={12} required k="mobile" placeholder="xxx-xxx-xxxx"
                     onChange={(v) => update('mobile')(phone(v))} />
          <TextField label="อีเมล (e-mail)" value={m.email} onChange={update('email')} placeholder="name@example.com" />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>การส่งหุ้นและเงินฝาก</h3>
        </div>
        <div className="form-grid">
          <TextField label="เงินฝากแรกเข้า" value={m.entryDeposit} display={money(m.entryDeposit)} mono inputMode="decimal" placeholder="0.00"
                     onChange={(v) => update('entryDeposit')(String(v).replace(/[^\d.]/g, ''))} />
          <TextField label="มูลค่าหุ้น / เดือน" value={shareValue} display={money(shareValue)} mono inputMode="decimal" required k="shareValue" placeholder="0.00"
                     onChange={(v) => update('shareValue')(String(v).replace(/[^\d.]/g, ''))} />
          <TextField label="หุ้นตามฐานเงินเดือน" value={m.shareBaseSalary} mono placeholder="ระบุหุ้นตามฐานเงินเดือน"
                     onChange={update('shareBaseSalary')} />
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลการลาออก / สมาชิกเก่า</h3>
        </div>
        <div className="form-grid">
          <DateField label="วันที่ลาออก" value={m.resignDate} onChange={update('resignDate')} />
          <SelectField label="สาเหตุลาออก" value={m.resignReason} options={window.RESIGN_REASON_OPTIONS}
                       placeholder="ระบุสาเหตุลาออก" onChange={update('resignReason')} />
          <div className="field">
            <span className="label">เลขสมาชิกครั้งล่าสุด</span>
            <span className="value mono">{m.prevCode || '—'}</span>
          </div>
          <div className="field">
            <span className="label">จำนวนครั้งที่เคยสมัคร</span>
            <span className="value">{String(m.prevApplyCount || 0)}</span>
          </div>
          <DateField label="วันที่พ้นสภาพ" value={m.expireDate} onChange={update('expireDate')} />
        </div>
      </div>

      <BeneficiariesSection editing={editing} bens={bens} setBens={setBens}
                            errors={benErrors} shareError={shareError} />

      <ChildrenSection editing={editing} kids={kids} setKids={setKids} errors={kidErrors} />

      <div className="section">
        <div className="section-head">
          <span className="head-bar" />
          <h3>หมายเหตุ</h3>
        </div>
        <div className="form-grid">
          <TextField label="หมายเหตุ" value={m.note ?? m.resolution} onChange={update('note')} span={2} placeholder="ระบุหมายเหตุ" />
        </div>
      </div>

    </EditCtx.Provider>
    </DetailCtx.Provider>
  );
}

Object.assign(window, { DetailsTab, BeneficiariesSection, ChildrenSection });
