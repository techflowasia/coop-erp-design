// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ข้อมูลบุคคลภายนอก (เพิ่ม/แก้ไขบุคคลภายนอก)
//  ทะเบียนบุคคลภายนอก/นิติบุคคลที่ไม่ใช่สมาชิก ใช้อ้างอิงตอนเปิดบัญชีเงินฝาก
//  รูปแบบ: หน้ารายการ (ค้นหา + ตาราง) → กล่องเพิ่ม/แก้ไข (modal)
//  สไตล์ตาม Design System (เขียวสหกรณ์ · Sarabun · การ์ดขาว)
// ════════════════════════════════════════════════════════════════════

let _epSeq = 0;
const epUid = () => 'EX-' + Date.now().toString(36) + '-' + (++_epSeq);
const epUser = () => (window.depOpsUser ? window.depOpsUser() : window.DEP_OPS_USER);
// ข้อมูลที่อยู่ทั้งประเทศ (จังหวัด › อำเภอ › ตำบล + รหัสไปรษณีย์) — โหลดเมื่อเปิดกล่องเพิ่ม/แก้ไข · ยังไม่โหลด/โหลดไม่ได้ใช้ชุดเดิม
let _epAddrWait = null;
const epLoadAddr = () => {
  if (window.TH_ADDR) return Promise.resolve(window.TH_ADDR);
  if (_epAddrWait) return _epAddrWait;
  _epAddrWait = new Promise((res) => {
    const s = document.createElement('script'); s.src = (document.querySelector('script[src*="src-dep/"]') ? 'src-dep/' : 'src/') + 'th-address.js';
    s.onload = () => res(window.TH_ADDR || null); s.onerror = () => { _epAddrWait = null; res(null); };
    document.head.appendChild(s);
  });
  return _epAddrWait;
};
const epThSort = (a) => a.slice().sort((x, y) => x.localeCompare(y, 'th'));
// สมาชิกที่เลขบัตรตรงกัน (ทะเบียนสมาชิก) — สมาชิกต้องเปิดบัญชีในฐานะสมาชิก ไม่ใช่บุคคลภายนอก
const epMemberByCid = (d) => {
  const dig = (s) => String(s || '').replace(/[-\s]/g, '');
  return (window.DEP_TXN_MEMBERS || []).find(m => m.citizenId && dig(m.citizenId) === d)
      || (window.MEMBERS_LIST || []).find(m => m.citizenId && dig(m.citizenId) === d) || null;
};
// บัญชีเงินฝากที่ผูกกับบุคคลนี้ (เจ้าของบัญชี / ผู้ฝากร่วม)
const epLinkedAccounts = (p) => (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : [])
  .filter(a => a.status !== 'closed' && (a.member === p.code || a.extId === p.code || (a.joints || []).some(j => j && (j.ref === p.code || j.code === p.code))));
const epActive = (p) => !p.status || p.status === 'ใช้งาน';
// เพิ่มบุคคลภายนอก — ใช้ร่วมกันทั้งเมนูนี้และหน้าเปิดบัญชี (ออกรหัส · สถานะ · ผู้สร้าง · ที่มา · Audit Log เหมือนกัน)
const EP_SOURCE = { menu: 'เมนูเพิ่มแก้ไขบุคคลภายนอก', open: 'หน้าเปิดบัญชีเงินฝาก' };
window.depExtPersonAdd = (vals, opts) => {
  const o = opts || {};
  const list = window.depExtPersonsLoad ? window.depExtPersonsLoad() : [];
  const code = window.depExtPersonNextCode(list, vals.kind);
  const src = o.source || 'menu';
  const rec = { id: epUid(), code, status: 'ใช้งาน', createdBy: epUser(), createdAt: new Date().toISOString(), source: src, ...vals };
  const next = [rec, ...list];
  window.depExtPersonsSave(next);
  const nm = window.depExtPersonName(vals);
  o.audit && o.audit.log && o.audit.log({ action: 'create', module: 'เงินฝาก — ข้อมูลบุคคลภายนอก', user: epUser(),
    target: `${code} · ${nm}`, summary: `เพิ่ม${vals.kind === 'juristic' ? 'นิติบุคคล' : 'บุคคล'}ภายนอก “${nm}” (จาก${EP_SOURCE[src] || src})`,
    changes: [{ field: 'รหัสทะเบียน', before: '—', after: code }] });
  return { rec, list: next };
};

// ── ฟิลด์ label + control ──
function EpField({ label, required, span, children }) {
  return (
    <div className="bud-fld" style={span === 2 ? { gridColumn: 'span 2' } : undefined}>
      <label className="lt-modal-label">{label}{required && <span className="cfg-required"> *</span>}</label>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Add / edit modal
// ════════════════════════════════════════════════════════════════════
function ExtPersonModal({ mode, draft0, existing, onClose, onSubmit, lockKind = false }) {
  const isEdit = mode === 'edit';
  const d0 = draft0 || {};
  const [kind, setKind]         = useState(d0.kind || 'person');
  const [title, setTitle]       = useState(d0.title || 'นาย');
  const [firstName, setFirst]   = useState(d0.firstName || '');
  const [lastName, setLast]     = useState(d0.lastName || '');
  const [orgName, setOrgName]   = useState(d0.orgName || '');
  const [citizenId, setCid]     = useState(d0.citizenId || '');
  const [taxId, setTaxId]       = useState(d0.taxId || '');
  const [addr, setAddr]         = useState(d0.addr || '');
  const [moo, setMoo]           = useState(d0.moo || '');
  const [village, setVillage]   = useState(d0.village || '');
  const [soi, setSoi]           = useState(d0.soi || '');
  const [road, setRoad]         = useState(d0.road || '');
  const [province, setProvince] = useState(d0.province || '');
  const [amphoe, setAmphoe]     = useState(d0.amphoe || '');
  const [tambon, setTambon]     = useState(d0.tambon || '');
  const [zipcode, setZip]       = useState(d0.zipcode || '');
  const [phone, setPhone]       = useState(d0.phone || '');
  const [mobile, setMobile]     = useState(d0.mobile || '');
  const [email, setEmail]       = useState(d0.email || '');
  const [note, setNote]         = useState(d0.note || '');
  const [error, setError]       = useState('');
  const [signatureUrl, setSig]  = useState(d0.signatureUrl || '');
  const digits = (s) => String(s || '').replace(/[-\s]/g, '');
  const idErr = (raw, label) => {
    if (!raw.trim()) return '';
    const d = digits(raw);
    if (/\D/.test(d)) return label + 'ต้องเป็นตัวเลขเท่านั้น';
    if (d.length !== 13) return label + 'ต้องมี 13 หลัก (กรอกแล้ว ' + d.length + ' หลัก)';
    const dup = (existing || []).find(p => p.id !== d0.id && p.code !== d0.code
      && [p.citizenId, p.taxId].some(x => x && digits(x) === d));
    if (dup) return label + 'ซ้ำกับ ' + dup.code + ' · ' + (window.depExtPersonName ? window.depExtPersonName(dup) : (dup.orgName || dup.firstName || ''));
    const mem = epMemberByCid(d);
    if (mem) return label + 'ตรงกับสมาชิก ' + String(mem.code).replace(/^M-0*/, '') + ' · ' + mem.name + ' — ให้เปิดบัญชีในฐานะสมาชิก';
    return '';
  };
  const cidLabel = kind === 'juristic' ? 'เลขทะเบียนนิติบุคคล' : 'เลขที่บัตรประชาชน';
  const cidErr = idErr(citizenId, cidLabel);
  const taxErr = idErr(taxId, 'เลขที่ผู้เสียภาษี');
  const pickSig = (f) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { setError('ไฟล์ลายเซ็นต้องเป็นรูปภาพ (PNG / JPG)'); return; }
    const r = new FileReader(); r.onload = () => setSig(String(r.result)); r.readAsDataURL(f);
  };

  const [addr0, setAddr0] = useState(window.TH_ADDR || null);
  React.useEffect(() => { let on = true; epLoadAddr().then(d => { if (on && d) setAddr0(d); }); return () => { on = false; }; }, []);
  const withCur = (list, v) => (v && !list.includes(v) ? [v, ...list] : list);
  const provinces = withCur(addr0 ? epThSort(Object.keys(addr0)) : (window.PROVINCES || []), province);
  const amphoes = withCur(addr0 ? epThSort(Object.keys(addr0[province] || {})) : (window.AMPHOES[province] || []), amphoe);
  const tbRows = addr0 && addr0[province] && addr0[province][amphoe] ? addr0[province][amphoe] : [];
  const tambons = withCur(addr0 ? epThSort([...new Set(tbRows.map(r => r[0]))]) : (window.TAMBONS[amphoe] || []), tambon);
  const titles = withCur(window.TITLE_OPTIONS || window.DEP_EXT_PERSON_TITLES || [], title);

  const onProvince = (v) => { setProvince(v); setAmphoe(''); setTambon(''); };
  const onAmphoe = (v) => { setAmphoe(v); setTambon(''); };
  // เลือกตำบล → เติมรหัสไปรษณีย์ (ตำบลที่มีหลายรหัส เติมรหัสแรก แก้เองได้)
  const onTambon = (v) => { setTambon(v); const hit = tbRows.find(r => r[0] === v); if (hit) setZip(hit[1]); };

  const submit = (e) => {
    e.preventDefault();
    if (kind === 'person') {
      if (!firstName.trim()) { setError('กรุณาระบุชื่อ'); return; }
      if (!lastName.trim())  { setError('กรุณาระบุนามสกุล'); return; }
    } else {
      if (!orgName.trim())   { setError('กรุณาระบุชื่อนิติบุคคล'); return; }
    }
    // ข้อมูลยืนยันตัวตน (KYC) — บุคคล: เลขบัตรประชาชน · นิติบุคคล: เลขทะเบียนหรือเลขผู้เสียภาษี (อย่างน้อย 1)
    if (kind === 'person' && !citizenId.trim()) { setError('กรุณาระบุเลขที่บัตรประชาชน'); return; }
    if (kind === 'juristic' && !citizenId.trim() && !taxId.trim()) { setError('กรุณาระบุเลขทะเบียนนิติบุคคล หรือเลขที่ผู้เสียภาษี'); return; }
    if (cidErr) { setError(cidErr); return; }
    if (taxErr) { setError(taxErr); return; }
    if (!addr.trim()) { setError('กรุณาระบุที่อยู่ (เลขที่)'); return; }
    if (!province || !amphoe || !tambon) { setError('กรุณาเลือกจังหวัด อำเภอ/เขต และตำบล/แขวง'); return; }
    if (!/^\d{5}$/.test(zipcode.trim())) { setError('กรุณาระบุรหัสไปรษณีย์ 5 หลัก'); return; }
    if (!phone.trim() && !mobile.trim()) { setError('กรุณาระบุเบอร์ติดต่ออย่างน้อย 1 ช่องทาง (โทรศัพท์ หรือ มือถือ)'); return; }
    onSubmit({
      kind, title: kind === 'person' ? title : '',
      firstName: kind === 'person' ? firstName.trim() : '',
      lastName: kind === 'person' ? lastName.trim() : '',
      orgName: kind === 'juristic' ? orgName.trim() : '',
      citizenId: citizenId.trim(), taxId: taxId.trim(),
      addr: addr.trim(), moo: moo.trim(), village: village.trim(), soi: soi.trim(), road: road.trim(),
      province, amphoe, tambon, zipcode: zipcode.trim(),
      phone: phone.trim(), mobile: mobile.trim(), email: email.trim(), note: note.trim(),
      signatureUrl: kind === 'juristic' ? signatureUrl : '',
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true"
           style={{ width: 780, maxWidth: '94vw', top: 'calc(50% + 32px)', maxHeight: 'calc(100vh - 112px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name={isEdit ? 'edit' : 'plus'} /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{isEdit ? 'แก้ไขบุคคลภายนอก' : lockKind ? (kind === 'juristic' ? 'เพิ่มนิติบุคคลภายนอก' : 'เพิ่มบุคคลภายนอก') : 'เพิ่มบุคคลภายนอก'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              ข้อมูลบุคคล/นิติบุคคลที่ไม่ใช่สมาชิก สำหรับใช้อ้างอิงเมื่อเปิดบัญชีเงินฝาก
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <form className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }} onSubmit={submit}>
          {/* ประเภทบุคคล */}
          {!lockKind && <div className="dep-opener-seg" style={{ padding: 0, marginBottom: 14 }}>
            <span className="dep-opener-lab">ประเภท</span>
            <span className="seg dep-opener-tabs">
              <button type="button" className={"seg-btn " + (kind === 'person' ? 'active' : '')} onClick={() => setKind('person')}>
                <Icon name="user" size={14} /> บุคคลธรรมดา
              </button>
              <button type="button" className={"seg-btn " + (kind === 'juristic' ? 'active' : '')} onClick={() => setKind('juristic')}>
                <Icon name="report" size={14} /> นิติบุคคล
              </button>
            </span>
          </div>}

          <div className="ep-sub">{kind === 'juristic' ? 'ข้อมูลนิติบุคคล' : 'ข้อมูลบุคคล'}</div>
          <div className="bud-form-grid">
            {kind === 'person' ? (
              <>
                <EpField label="คำนำหน้า">
                  <select className="cfg-input" value={title} onChange={(e) => setTitle(e.target.value)}>
                    {titles.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </EpField>
                <div className="bud-fld" />
                <EpField label="ชื่อ" required>
                  <input className="cfg-input" value={firstName} autoFocus placeholder="ชื่อ"
                         onChange={(e) => { setFirst(e.target.value); setError(''); }} />
                </EpField>
                <EpField label="นามสกุล" required>
                  <input className="cfg-input" value={lastName} placeholder="นามสกุล"
                         onChange={(e) => { setLast(e.target.value); setError(''); }} />
                </EpField>
                <EpField label="เลขที่บัตรประชาชน" required>
                  <input className={'cfg-input mono' + (cidErr ? ' error' : '')} value={citizenId} placeholder="เลขบัตรประชาชน 13 หลัก" inputMode="numeric" maxLength={17}
                         onChange={(e) => { setCid(e.target.value); setError(''); }} />
                  {cidErr && <div className="cfg-error">{cidErr}</div>}
                </EpField>
                <EpField label="เลขที่ผู้เสียภาษี">
                  <input className={'cfg-input mono' + (taxErr ? ' error' : '')} value={taxId} placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก" inputMode="numeric" maxLength={17}
                         onChange={(e) => { setTaxId(e.target.value); setError(''); }} />
                  {taxErr && <div className="cfg-error">{taxErr}</div>}
                </EpField>
              </>
            ) : (
              <>
                <EpField label="ชื่อนิติบุคคล" required span={2}>
                  <input className="cfg-input" value={orgName} autoFocus placeholder="เช่น บริษัท ... จำกัด / ห้างหุ้นส่วน ..."
                         onChange={(e) => { setOrgName(e.target.value); setError(''); }} />
                </EpField>
                <EpField label="เลขทะเบียนนิติบุคคล">
                  <input className={'cfg-input mono' + (cidErr ? ' error' : '')} value={citizenId} placeholder="เลขทะเบียน 13 หลัก" inputMode="numeric" maxLength={17}
                         onChange={(e) => { setCid(e.target.value); setError(''); }} />
                  {cidErr && <div className="cfg-error">{cidErr}</div>}
                  {!cidErr && <div className="cfg-hint">ระบุเลขทะเบียนนิติบุคคล หรือเลขที่ผู้เสียภาษี อย่างน้อย 1 ช่อง</div>}
                </EpField>
                <EpField label="เลขที่ผู้เสียภาษี">
                  <input className={'cfg-input mono' + (taxErr ? ' error' : '')} value={taxId} placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก" inputMode="numeric" maxLength={17}
                         onChange={(e) => { setTaxId(e.target.value); setError(''); }} />
                  {taxErr && <div className="cfg-error">{taxErr}</div>}
                </EpField>
                <EpField label="ลายเซ็นผู้มีอำนาจลงนาม" span={2}>
                  <div className="ep-sig">
                    {signatureUrl
                      ? <img src={signatureUrl} alt="ลายเซ็น" />
                      : <span className="muted" style={{ fontSize: 12 }}>ยังไม่ได้แนบลายเซ็น</span>}
                    <span style={{ flex: 1 }} />
                    <label className="btn sm" style={{ cursor: 'pointer' }}>
                      <Icon name="upload" size={13} /> {signatureUrl ? 'เปลี่ยนไฟล์' : 'แนบลายเซ็น'}
                      <input type="file" accept="image/*" hidden onChange={(e) => pickSig(e.target.files && e.target.files[0])} />
                    </label>
                    {signatureUrl && <button type="button" className="btn sm tt-del-btn" onClick={() => setSig('')}><Icon name="trash" size={13} /></button>}
                  </div>
                  <div className="cfg-hint">รองรับ PNG / JPG — ใช้เทียบลายเซ็นตอนถอนเงิน</div>
                </EpField>
              </>
            )}
          </div>

          <div className="ep-sub" style={{ marginTop: 16 }}>ที่อยู่</div>
          <div className="bud-form-grid">
            <EpField label="ที่อยู่ (เลขที่)" required><input className="cfg-input" value={addr} placeholder="บ้านเลขที่" onChange={(e) => setAddr(e.target.value)} /></EpField>
            <EpField label="หมู่ที่"><input className="cfg-input" value={moo} placeholder="หมู่ที่" onChange={(e) => setMoo(e.target.value)} /></EpField>
            <EpField label="หมู่บ้าน / อาคาร"><input className="cfg-input" value={village} placeholder="ชื่อหมู่บ้าน/อาคาร" onChange={(e) => setVillage(e.target.value)} /></EpField>
            <EpField label="ตรอก / ซอย"><input className="cfg-input" value={soi} placeholder="ตรอก/ซอย" onChange={(e) => setSoi(e.target.value)} /></EpField>
            <EpField label="ถนน"><input className="cfg-input" value={road} placeholder="ถนน" onChange={(e) => setRoad(e.target.value)} /></EpField>
            <EpField label="จังหวัด" required>
              <select className="cfg-input" value={province} onChange={(e) => onProvince(e.target.value)}>
                <option value="">— เลือกจังหวัด —</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </EpField>
            <EpField label="อำเภอ / เขต" required>
              <select className="cfg-input" value={amphoe} disabled={!province} onChange={(e) => onAmphoe(e.target.value)}>
                <option value="">{province ? '— เลือกอำเภอ/เขต —' : 'เลือกจังหวัดก่อน'}</option>
                {amphoes.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </EpField>
            <EpField label="ตำบล / แขวง" required>
              <select className="cfg-input" value={tambon} disabled={!amphoe} onChange={(e) => onTambon(e.target.value)}>
                <option value="">{amphoe ? '— เลือกตำบล/แขวง —' : 'เลือกอำเภอ/เขตก่อน'}</option>
                {tambons.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </EpField>
            <EpField label="รหัสไปรษณีย์" required><input className="cfg-input mono" value={zipcode} maxLength={5} placeholder="รหัสไปรษณีย์" onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))} /></EpField>
          </div>

          <div className="ep-sub" style={{ marginTop: 16 }}>ช่องทางติดต่อ <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>(ระบุโทรศัพท์หรือมือถืออย่างน้อย 1 ช่องทาง)</span></div>
          <div className="bud-form-grid">
            <EpField label="โทรศัพท์"><input className="cfg-input mono" value={phone} placeholder="เบอร์โทรศัพท์บ้าน/สำนักงาน" onChange={(e) => setPhone(e.target.value)} /></EpField>
            <EpField label="มือถือ"><input className="cfg-input mono" value={mobile} placeholder="เบอร์มือถือ" onChange={(e) => setMobile(e.target.value)} /></EpField>
            <EpField label="E-mail" span={2}><input className="cfg-input" type="email" value={email} placeholder="อีเมล" onChange={(e) => setEmail(e.target.value)} /></EpField>
            <EpField label="หมายเหตุ" span={2}><input className="cfg-input" value={note} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" onChange={(e) => setNote(e.target.value)} /></EpField>
          </div>

          {error && <div className="dep-error" style={{ marginTop: 12 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกบุคคลภายนอก'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function DepExternalPersonPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.depExtPersonsLoad);
  const [modal, setModal] = useState(null);
  const [qDraft, setQDraft] = useState('');
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState('all');
  const [confirmDel, setConfirmDel] = useState(null);

  const persist = (next) => { setList(next); window.depExtPersonsSave(next); };

  const filtered = React.useMemo(() => {
    const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
    const nq = norm(q);
    return list.filter(p => {
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false;
      if (!nq) return true;
      const hay = norm(p.code) + norm(window.depExtPersonName(p)) + norm(p.citizenId) + norm(p.taxId) + norm(p.mobile) + norm(p.phone);
      return hay.includes(nq);
    });
  }, [list, q, kindFilter]);

  const submit = (vals) => {
    const { mode, rec } = modal;
    if (mode === 'edit') {
      persist(list.map(x => x.id === rec.id ? { ...x, ...vals, updatedBy: epUser(), updatedAt: new Date().toISOString() } : x));
      audit.log({ action: 'update', module: 'เงินฝาก — ข้อมูลบุคคลภายนอก', user: epUser(),
        target: `${rec.code} · ${window.depExtPersonName(vals)}`, summary: `แก้ไขข้อมูลบุคคลภายนอก “${window.depExtPersonName(vals)}”` });
      onToast && onToast(`บันทึกการแก้ไข “${window.depExtPersonName(vals)}” เรียบร้อยแล้ว`);
    } else {
      const { rec: added, list: next } = window.depExtPersonAdd(vals, { source: 'menu', audit });
      setList(next);
      const code = added.code;
      onToast && onToast(`เพิ่มบุคคลภายนอก “${window.depExtPersonName(vals)}” (${code}) เรียบร้อยแล้ว`);
    }
    setModal(null);
  };

  // เปิด/ปิดใช้งาน — ปิดใช้งานแล้วเลือกเป็นเจ้าของบัญชี/ผู้ฝากร่วมตอนเปิดบัญชีไม่ได้ (บัญชีเดิมไม่กระทบ)
  const setActive = (p, on) => {
    persist(list.map(x => x.id === p.id ? { ...x, status: on ? 'ใช้งาน' : 'ปิดใช้งาน', updatedBy: epUser(), updatedAt: new Date().toISOString() } : x));
    audit.log({ action: 'update', module: 'เงินฝาก — ข้อมูลบุคคลภายนอก', user: epUser(),
      target: `${p.code} · ${window.depExtPersonName(p)}`, summary: (on ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + `บุคคลภายนอก “${window.depExtPersonName(p)}”`,
      changes: [{ field: 'สถานะ', before: epActive(p) ? 'ใช้งาน' : 'ปิดใช้งาน', after: on ? 'ใช้งาน' : 'ปิดใช้งาน' }] });
    onToast && onToast((on ? 'เปิดใช้งาน' : 'ปิดใช้งาน') + ` “${window.depExtPersonName(p)}” เรียบร้อยแล้ว`);
    setConfirmDel(null);
  };
  const doDelete = (p) => {
    if (epLinkedAccounts(p).length) return;
    persist(list.filter(x => x.id !== p.id));
    audit.log({ action: 'delete', module: 'เงินฝาก — ข้อมูลบุคคลภายนอก', user: epUser(),
      target: `${p.code} · ${window.depExtPersonName(p)}`, summary: `ลบบุคคลภายนอก “${window.depExtPersonName(p)}”` });
    onToast && onToast(`ลบ “${window.depExtPersonName(p)}” เรียบร้อยแล้ว`);
    setConfirmDel(null);
  };

  const addrLine = (p) => [
    [p.addr, p.moo && p.moo !== '-' ? 'หมู่ ' + p.moo : '', p.village, p.soi ? 'ซ.' + p.soi : '', p.road ? 'ถ.' + p.road : ''].filter(Boolean).join(' '),
    [p.tambon, p.amphoe, p.province, p.zipcode].filter(Boolean).join(' '),
  ].filter(Boolean).join(' ');

  const cnt = { all: list.length, person: list.filter(p => p.kind === 'person').length, juristic: list.filter(p => p.kind === 'juristic').length };

  return (
    <div data-screen-label="หน้าข้อมูลบุคคลภายนอก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ข้อมูลบุคคลภายนอก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 820 }}>
            เพิ่ม/แก้ไขทะเบียนบุคคลภายนอกและนิติบุคคลที่ไม่ใช่สมาชิก สำหรับใช้อ้างอิงเป็นเจ้าของบัญชี/ผู้ฝากร่วมเมื่อเปิดบัญชีเงินฝาก
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setModal({ mode: 'add', rec: null })}>
          <Icon name="plus" /> เพิ่มบุคคลภายนอก
        </button>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8, alignItems: 'center' }}>
          <label className="gc-member-trigger lb-trigger" style={{ width: '100%', minWidth: 0, cursor: 'text', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={qDraft} onChange={(ev) => setQDraft(ev.target.value)}
                   onKeyDown={(ev) => { if (ev.key === 'Enter') setQ(qDraft); }}
                   style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', font: 'inherit', color: 'inherit', padding: 0 }}
                   placeholder="พิมพ์รหัสทะเบียน / ชื่อ / เลขบัตร / เบอร์โทร…" />
          </label>
          <button className="btn primary" style={{ height: 32 }} onClick={() => setQ(qDraft)}>ค้นหา</button>
          <button className="btn" style={{ height: 32 }} onClick={() => { setQDraft(''); setQ(''); setKindFilter('all'); }}>รีเซ็ต</button>
        </div>
      </div>

      <div className="tabs-container" style={{ marginTop: 0, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div className="tabs-bar">
          {[['all', 'ทั้งหมด'], ['person', 'บุคคลธรรมดา'], ['juristic', 'นิติบุคคล']].map(([v, l]) => (
            <button key={v} type="button" className={"tab" + (kindFilter === v ? ' active' : '')} onClick={() => setKindFilter(v)}>
              {l} <span className="tab-count">{cnt[v]}</span>
            </button>
          ))}
        </div>

        <div className="table-wrap" style={{ margin: 16 }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1020 }}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>รหัสทะเบียน</th>
                <th style={{ minWidth: 220 }}>ชื่อ / นิติบุคคล</th>
                <th className="center" style={{ width: 110 }}>ประเภท</th>
                <th style={{ width: 160 }}>เลขบัตร / ผู้เสียภาษี</th>
                <th style={{ minWidth: 300 }}>ที่อยู่ / ติดต่อ</th>
                <th className="center" style={{ width: 160 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="center muted" style={{ padding: '34px 12px' }}>
                  {list.length === 0 ? 'ยังไม่มีบุคคลภายนอก — กดปุ่ม “เพิ่มบุคคลภายนอก” เพื่อเริ่มบันทึกข้อมูล' : 'ไม่พบรายการที่ตรงกับเงื่อนไขค้นหา'}
                </td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className={p.status && p.status !== 'ใช้งาน' ? 'dat-off' : undefined}>
                  <td className="mono">{p.code}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{window.depExtPersonName(p) || <span className="muted">—</span>}</div>
                    {p.email && <div className="muted" style={{ fontSize: 11 }}>{p.email}</div>}
                    {p.note && <div className="muted" style={{ fontSize: 11, fontStyle: 'italic' }}>{p.note}</div>}
                    {p.source === 'open' && <div className="muted" style={{ fontSize: 11 }}>เพิ่มจากหน้าเปิดบัญชี{p.createdBy ? ' · ' + p.createdBy : ''}</div>}
                    {!epActive(p) && <div><span className="pill neutral" style={{ fontSize: 11 }}>ปิดใช้งาน</span></div>}
                  </td>
                  <td className="center">
                    <span className={"chip " + (p.kind === 'juristic' ? 'info' : 'primary')}>
                      {p.kind === 'juristic' ? 'นิติบุคคล' : 'บุคคลธรรมดา'}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {p.citizenId ? <div>{p.citizenId}</div> : null}
                    {p.taxId ? <div className="muted">ภาษี {p.taxId}</div> : null}
                    {!p.citizenId && !p.taxId && <span className="muted">—</span>}
                  </td>
                  <td>
                    <div style={{ fontSize: 12 }}>{addrLine(p) || <span className="muted">—</span>}</div>
                    {(p.mobile || p.phone) && (
                      <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
                        <Icon name="bell" size={10} /> {[p.mobile, p.phone].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </td>
                  <td className="center">
                    <div className="col-gap" style={{ justifyContent: 'center', gap: 6 }}>
                      <button className="btn sm ex-row-btn" onClick={() => setModal({ mode: 'edit', rec: p })}>
                        <Icon name="edit" size={13} /> แก้ไข
                      </button>
                      {epActive(p)
                        ? <button className="btn sm ex-row-btn del" onClick={() => setConfirmDel(p)}>
                            <Icon name="trash" size={13} /> ลบ
                          </button>
                        : <button className="btn sm ex-row-btn" onClick={() => setActive(p, true)}>
                            <Icon name="check" size={13} /> เปิดใช้งาน
                          </button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> รายการนี้ใช้อ้างอิงในเมนู “เปิดบัญชีเงินฝาก” เมื่อเจ้าของบัญชีเป็นบุคคลภายนอกหรือนิติบุคคลที่ไม่ใช่สมาชิก
      </div>

      {modal && (
        <ExtPersonModal mode={modal.mode}
                        draft0={modal.mode === 'edit' ? modal.rec : null}
                        existing={list}
                        onClose={() => setModal(null)} onSubmit={submit} />
      )}

      {confirmDel && (
        <>
          <div className="modal-backdrop" onClick={() => setConfirmDel(null)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ background: 'var(--danger-soft, #fde8e8)', color: 'var(--danger, #c0392b)' }}><Icon name="trash" /></div>
              <div style={{ minWidth: 0 }}>
                <h2>{epLinkedAccounts(confirmDel).length ? 'ลบบุคคลภายนอกไม่ได้' : 'ลบบุคคลภายนอก'}</h2>
                <div className="muted" style={{ fontSize: 11 }}>{epLinkedAccounts(confirmDel).length ? 'มีบัญชีเงินฝากผูกอยู่ — ปิดใช้งานแทนได้' : 'การลบไม่สามารถย้อนกลับได้'}</div>
              </div>
              <button className="close-btn" onClick={() => setConfirmDel(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body" style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto' }}>
              {(() => { const linked = epLinkedAccounts(confirmDel); return linked.length ? (<>
                <div style={{ fontSize: 13 }}>
                  <b>{window.depExtPersonName(confirmDel)}</b> <span className="muted mono">({confirmDel.code})</span> ผูกกับบัญชีเงินฝาก {linked.length} บัญชี จึงลบออกจากทะเบียนไม่ได้
                  <div className="muted mono" style={{ fontSize: 12, marginTop: 6, whiteSpace: 'pre-line' }}>{linked.slice(0, 5).map(a => a.accNo + ' · ' + (a.type || '')).join('\n')}{linked.length > 5 ? '\n…' : ''}</div>
                  <div style={{ marginTop: 8 }}>ปิดใช้งานแทนได้ — จะเลือกเป็นเจ้าของบัญชี/ผู้ฝากร่วมตอนเปิดบัญชีใหม่ไม่ได้ ส่วนบัญชีเดิมใช้งานได้ตามปกติ</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>ยกเลิก</button>
                  <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setActive(confirmDel, false)}>
                    <Icon name="lock" /> ปิดใช้งาน
                  </button>
                </div>
              </>) : (<>
                <div style={{ fontSize: 13 }}>
                  ต้องการลบ <b>{window.depExtPersonName(confirmDel)}</b> <span className="muted mono">({confirmDel.code})</span> ออกจากทะเบียนใช่หรือไม่?
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                  <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmDel(null)}>ยกเลิก</button>
                  <button className="btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => doDelete(confirmDel)}>
                    <Icon name="trash" /> ลบรายการ
                  </button>
                </div>
              </>); })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { DepExternalPersonPage, ExtPersonModal });
