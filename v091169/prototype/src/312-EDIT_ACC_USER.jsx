// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › บัญชีและธุรกรรม — แก้ไขรายละเอียดบัญชี
//  เลือกบัญชี → แก้หัวบัญชี (PB/Cert · No Book · ชื่อ TH/ENG · หักหุ้นพูนทวี ·
//  การรับ/จ่าย) + 4 แท็บ: ข้อมูลสมาชิก · ผู้ฝากร่วม · เงื่อนไข · การโอนเงิน
//  อ้างอิงหน้าจอ “แก้ไขรายละเอียดประเภทบัญชี” · สไตล์ Design System สหกรณ์
// ════════════════════════════════════════════════════════════════════

const EDIT_ACC_USER = 'จันทร์เพ็ญ มาลี';

const DEP_EDIT_SHAREPLUS = [
  { v: 'shareDebt', l: 'หักหุ้น + หนี้' },
  { v: 'share',     l: 'หักเฉพาะค่าหุ้น' },
  { v: 'none',      l: '-' },
];
const DEP_EDIT_RECVPAY = [
  { v: 'compound',  l: 'ทบต้น' },
  { v: 'toaccount', l: 'โอนเข้าบัญชี' },
  { v: 'tobank',    l: 'โอนเข้าบัญชีธนาคาร' },
];
const DEP_EDIT_INTCOND = [
  { v: 'announce', l: 'ตามประกาศ' },
  { v: 'special',  l: 'พิเศษคงที่' },
];
const depEditRecvOf = (m) => ({ savings: 'toaccount', transfer: 'tobank', cash: 'compound' }[m] || m || 'compound');
const depEditShareOf = (v) => (DEP_EDIT_SHAREPLUS.some(o => o.v === v) ? v : 'none');
const DEP_EDIT_HOLDER = [
  { v: '01', l: '01 บุคคล (เจ้าของคนเดียว)' },
  { v: '02', l: '02 บุคคล (บัญชีร่วม)' },
  { v: '03', l: '03 นิติบุคคล' },
  { v: '04', l: '04 ผู้เยาว์ (มีผู้ปกครอง)' },
];
// ประเภทบัญชี — ดึงจากค่าคงที่ "ประเภทเงินฝาก" (ใช้ตัวโหลดเดียวกับหน้าค่าคงที่)
const depEditTypes = () => {
  if (typeof window.datLoad === 'function') { try { const l = window.datLoad(); if (Array.isArray(l) && l.length) return l; } catch (e) {} }
  try { const s = localStorage.getItem('dep_acctypes_v2'); const l = s && JSON.parse(s); if (Array.isArray(l) && l.length) return l; } catch (e) {}
  return window.DEP_ACCTYPE_SEED || [];
};
const depEditTypeLabel = (code) => { const t = depEditTypes().find(x => x.code === code); return t ? t.code + ' · ' + t.name : (code || ''); };
const DEP_EDIT_TAX = [
  { v: 'announce', l: 'ตามประกาศ' },
  { v: 'exempt',   l: 'ยกเว้นภาษี' },
  { v: 'fixed',    l: 'อัตราคงที่ 15%' },
];
const DEP_EDIT_WITHDRAW = [
  { v: 'type',    l: 'ตามประเภทบัญชี' },
  { v: 'single',  l: 'ถอนคนเดียว' },
  { v: 'joint',   l: 'ถอนร่วม (ทุกคนลงนาม)' },
  { v: 'any',     l: 'ถอนคนใดคนหนึ่ง' },
  { v: 'approve', l: 'ต้องมีผู้อนุมัติ' },
];
const DEP_EDIT_TABS = [
  { id: 'member',    label: 'ข้อมูลสมาชิก',   icon: 'user' },
  { id: 'joint',     label: 'ผู้ฝากร่วม',      icon: 'members' },
  { id: 'cond',      label: 'เงื่อนไข',        icon: 'shield' },
  { id: 'transfer',  label: 'การโอนเงิน',      icon: 'wallet' },
];

// ประเภทเจ้าของบัญชี — กำหนดตั้งแต่เปิดบัญชี ดูจากรหัส (E = บุคคลภายนอก · L = นิติบุคคลภายนอก)
// เลขบัตรประชาชน / เลขทะเบียน — ดึงจากทะเบียนเจ้าของบัญชี (สมาชิก หรือบุคคล/นิติบุคคลภายนอก)
const depOwnerIdOf = (a) => {
  if (!a) return '';
  if (a.citizenId) return a.citizenId;
  const code = String(a.member || a.ownerCode || '').trim();
  const mem = (window.DEP_TXN_MEMBERS || []).find(m => m.code === code)
           || (window.MEMBERS_LIST || []).find(m => m.code === code || String(m.code).replace(/^M-/, '') === code);
  if (mem && mem.citizenId) return mem.citizenId;
  const ext = (window.depExtPersonsLoad ? window.depExtPersonsLoad() : []).find(p => p.code === code);
  if (ext) return ext.kind === 'juristic' ? (ext.taxId || ext.regNo || '') : (ext.citizenId || '');
  return '';
};
const DEP_OWNER_KIND_LABEL = { member: 'สมาชิกสหกรณ์', person: 'บุคคลภายนอก', legal: 'นิติบุคคลภายนอก' };
const depOwnerKind = (a) => {
  const c = String((a && (a.member || a.ownerCode)) || '').trim().toUpperCase();
  if (a && a.ownerType) return a.ownerType === 'external' ? 'person' : a.ownerType;
  return c.startsWith('L') ? 'legal' : c.startsWith('E') ? 'person' : 'member';
};

function DepEditAccountPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [picked, setPicked] = useState(null);
  const [tab, setTab] = useState('member');
  const [form, setForm] = useState(null);
  const [slip, setSlip] = useState(null);

  const cur = picked ? accounts.find(a => a.accNo === picked.accNo) || picked : null;
  const ownerKind = depOwnerKind(cur);
  const accType = cur ? (window.DEP_ACCTYPE_SEED || []).find(t => t.code === cur.typeCode) : null;

  // โหลดฟอร์มจากบัญชีที่เลือก
  const loadForm = (a) => {
    if (!a) { setForm(null); return; }
    setForm({
      typeCode: a.typeCode || '',
      certNo: a.certNo || '',
      noBook: !!a.noBook,
      nameTh: a.name || '',
      nameEng: a.nameEng || '',
      sharePlus: depEditShareOf(a.sharePlus),
      recvPay: depEditRecvOf(a.intMethod),
      intCond: a.intCond || 'announce',
      cif: a.cif || (a.member != null ? 'CIF' + String(a.member).padStart(6, '0') : ''),
      holderType: a.holderType || '01',
      citizenId: depOwnerIdOf(a),
      phone: a.phone || '',
      address: a.address || '',
      joints: (a.joints || []).map(j => ({ ...j })),
      withdrawCond: a.withdrawCondText || (a.withdrawCond && !DEP_EDIT_WITHDRAW.some(o => o.v === a.withdrawCond) ? a.withdrawCond : '')
                    || ((a.name || '') ? a.name + ' แต่เพียงผู้เดียว' : ''),
      wdNote: a.withdrawNote || '',
      taxMode: a.taxMode || 'announce',
      frozen: !!a.frozen,
      useLoan: !!a.useLoan,
      useFuneral: !!a.useFuneral,
      freeQuota: a.freeQuota ?? 0,
      dormant: !!a.dormant,
      xferBank: a.bank || '',
      xferAcc: a.bankAcc || '',
      xferName: a.bankAccName || a.name || '',
      xferBranch: a.bankBranch || '',
      intToAcc: a.intToAcc || '',
    });
  };

  const onSelect = (a) => { setPicked(a); setTab('member'); setSlip(null); loadForm(a); };
  React.useEffect(() => { if (!form) loadForm({ joints: [] }); }, []);
  const set = (patch) => setForm(f => ({ ...f, ...patch }));

  // ผู้ฝากร่วม
  const addJoint = () => set({ joints: [...form.joints, { ref: '', name: '' }] });
  const setJoint = (i, patch) => set({ joints: form.joints.map((x, idx) => idx === i ? { ...x, ...patch } : x) });
  const delJoint = (i) => set({ joints: form.joints.filter((_, idx) => idx !== i) });

  const labelOf = (arr, v) => (arr.find(o => o.v === v) || {}).l || v;

  // สรุปรายการที่เปลี่ยนแปลง (สำหรับ audit + สลิป)
  const diffs = useMemo(() => {
    if (!cur || !form) return [];
    const d = [];
    const push = (field, before, after) => { if (String(before ?? '') !== String(after ?? '')) d.push({ field, before: before || '—', after: after || '—' }); };
    push('ประเภทบัญชี', depEditTypeLabel(cur.typeCode), depEditTypeLabel(form.typeCode));
    push('เลขที่สมุด / Cert.', cur.certNo, form.certNo);
    push('No Book', cur.noBook ? 'ใช่' : 'ไม่', form.noBook ? 'ใช่' : 'ไม่');
    push('ชื่อบัญชี (TH)', cur.name, form.nameTh);
    push('ชื่อบัญชี (ENG)', cur.nameEng, form.nameEng);
    push('หักหุ้นพูนทวี', labelOf(DEP_EDIT_SHAREPLUS, cur.sharePlus || 'none'), labelOf(DEP_EDIT_SHAREPLUS, form.sharePlus));
    push('รับ Int./Div. โดย', labelOf(DEP_EDIT_RECVPAY, cur.intMethod || 'compound'), labelOf(DEP_EDIT_RECVPAY, form.recvPay));
    push('ผู้ถือบัญชี', labelOf(DEP_EDIT_HOLDER, cur.holderType || '01'), labelOf(DEP_EDIT_HOLDER, form.holderType));
    push('เงื่อนไขการถอน', cur.withdrawCondText || labelOf(DEP_EDIT_WITHDRAW, cur.withdrawCond || 'type'), form.withdrawCond);
    push('หมายเหตุเงื่อนไขการถอน', cur.withdrawNote || '', form.wdNote);
    push('อัตราภาษี', labelOf(DEP_EDIT_TAX, cur.taxMode || 'announce'), labelOf(DEP_EDIT_TAX, form.taxMode));
    push('เงื่อนไข Int./Div.', labelOf(DEP_EDIT_INTCOND, cur.intCond || 'announce'), labelOf(DEP_EDIT_INTCOND, form.intCond));
    push('อายัดบัญชี', cur.frozen ? 'ใช่' : 'ไม่', form.frozen ? 'ใช่' : 'ไม่');
    push('บัญชีรับโอนดอกเบี้ย', cur.bankAcc, form.xferAcc);
    if ((cur.joints || []).length !== form.joints.length) push('จำนวนผู้ฝากร่วม', (cur.joints || []).length, form.joints.length);
    return d;
  }, [cur, form]);

  const dirty = diffs.length > 0;

  const submit = () => {
    if (!cur || !form || !dirty) return;
    const next = accounts.map(a => a.accNo === cur.accNo ? {
      ...a,
      typeCode: form.typeCode || a.typeCode,
      type: (depEditTypes().find(t => t.code === form.typeCode) || {}).name || a.type,
      certNo: form.certNo, noBook: form.noBook, name: form.nameTh, nameEng: form.nameEng,
      sharePlus: form.sharePlus, intMethod: form.recvPay,
      cif: form.cif, holderType: form.holderType, citizenId: form.citizenId, phone: form.phone, address: form.address,
      joints: form.joints, withdrawCondText: form.withdrawCond, withdrawNote: form.wdNote, taxMode: form.taxMode, intCond: form.intCond, frozen: form.frozen,
      useLoan: form.useLoan, useFuneral: form.useFuneral, freeQuota: Number(form.freeQuota) || 0, dormant: form.dormant,
      bank: form.xferBank, bankAcc: form.xferAcc, bankAccName: form.xferName, intToAcc: form.recvPay === 'toaccount' ? form.intToAcc : '', bankBranch: form.xferBranch,
    } : a);
    setAccounts(next); window.depTxnSaveAccounts(next);

    audit.log({ action: 'update', module: 'เงินฝาก — แก้ไขรายละเอียดบัญชี', target: `${cur.accNo} · ${form.nameTh}`,
      summary: `แก้ไขรายละเอียดบัญชี ${cur.accNo} (${diffs.length} รายการ)`, changes: diffs });

    setSlip({
      title: 'หลักฐานการแก้ไขรายละเอียดบัญชีเงินฝาก',
      sub: `เลขที่บัญชี ${cur.accNo} · แก้ไข ${fmt.date(new Date().toISOString().slice(0, 10))}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ประเภทบัญชี', v: cur.type },
        { k: 'ชื่อบัญชี', v: form.nameTh },
        ...diffs.map(x => ({ k: x.field, v: `${x.before} → ${x.after}` })),
        { k: 'ผู้แก้ไข', v: EDIT_ACC_USER },
      ],
      foot: `บันทึกการแก้ไข ${diffs.length} รายการเรียบร้อย และลงบันทึกการตรวจสอบแล้ว`,
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกการแก้ไขบัญชี “' + cur.accNo + '” เรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label="หน้าแก้ไขรายละเอียดบัญชีเงินฝาก" className="dep-open">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>แก้ไขรายละเอียดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปรับปรุงข้อมูลหัวบัญชี ชื่อบัญชี เงื่อนไขการถอน ผู้ฝากร่วม และบัญชีรับโอนดอกเบี้ย</div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        {form && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {dirty && <span className="chip warning"><span className="dot-c" />มีการแก้ไข {diffs.length} รายการ</span>}
          <button className="btn sm" data-keep-top="" style={{ justifyContent: 'center', minWidth: 72 }} onClick={() => loadForm(cur)} disabled={!dirty}>ยกเลิก</button>
          {slip && <button className="btn sm" data-keep-top="" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์หลักฐาน</button>}
          <button className="btn primary sm" data-keep-top="" disabled={!dirty} onClick={submit}><Icon name="check" /> บันทึกการแก้ไข</button>
        </div>}
      </div>

      {!form ? null : (
        <div className="dep-editacc-body">
          {/* ── รายละเอียดบัญชี + หัวบัญชี — การ์ดเดียว ── */}
          <div className="search-card dat-section">
            <DepSecHead icon="edit" title="รายละเอียดบัญชี"
                        sub={cur ? 'เลขที่บัญชี ' + cur.accNo + ' · ' + cur.type : 'ค้นหาเลขที่บัญชีที่ต้องการแก้ไข'} />
            <div className="dat-grid g2">
              <DatFieldLite label="เลขที่บัญชี" required>
                <window.DepAccountNoField accounts={accounts} value={cur} onPick={(a) => a ? onSelect(a) : (setPicked(null), loadForm({ joints: [] }))} />
              </DatFieldLite>
              <DatFieldLite label="ประเภทบัญชี">
                <select className="cfg-input" disabled={!cur} value={form ? form.typeCode : ''}
                        onChange={(e) => setForm(s => ({ ...s, typeCode: e.target.value }))}>
                  {!cur && <option value="">—</option>}
                  {cur && !depEditTypes().some(t => t.code === cur.typeCode) && (
                    <option value={cur.typeCode}>{cur.typeCode} · {cur.type}</option>
                  )}
                  {depEditTypes().filter(t => t.enabled !== false || (cur && t.code === cur.typeCode)).map(t => (
                    <option key={t.code} value={t.code}>{t.code} · {t.name}</option>
                  ))}
                </select>
              </DatFieldLite>
            </div>
            <div className="dat-grid g2 dep-editacc-fields" style={{ paddingTop: 0 }}>
              <DatFieldLite label="เลขที่สมุด / Cert. (PB/Cert.)">
                <input className="cfg-input mono" value={form.certNo} disabled={form.noBook}
                       onChange={(e) => set({ certNo: e.target.value })} placeholder={form.noBook ? 'ไม่มีสมุด (No Book)' : 'เช่น 0000032187'} />
              </DatFieldLite>
              <DatFieldLite label="เปิดบัญชีแบบไม่มีสมุด">
                <label className="dep-check" style={{ height: 32 }}>
                  <input type="checkbox" checked={form.noBook} onChange={(e) => set({ noBook: e.target.checked, certNo: e.target.checked ? '' : form.certNo })} />
                  <span>เปิดบัญชีแบบไม่มีสมุด ( No Book )</span>
                </label>
              </DatFieldLite>
              <DatFieldLite label="ชื่อบัญชี (TH)">
                <input className="cfg-input" value={form.nameTh} onChange={(e) => set({ nameTh: e.target.value })} placeholder="ชื่อ-นามสกุล / ชื่อบัญชี ภาษาไทย" />
              </DatFieldLite>
              <DatFieldLite label="ชื่อบัญชี (ENG)">
                <input className="cfg-input" value={form.nameEng} onChange={(e) => set({ nameEng: e.target.value.toUpperCase() })} placeholder="ACCOUNT NAME (ENGLISH)" />
              </DatFieldLite>
              <DatFieldLite label="หักหุ้นพูนทวี">
                <select className="cfg-input" value={form.sharePlus} onChange={(e) => set({ sharePlus: e.target.value })}>
                  {DEP_EDIT_SHAREPLUS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </DatFieldLite>
            </div>
          </div>

          {/* ── แท็บ ── */}
          <div className="tabs-container" style={{ marginTop: 12 }}>
            <div className="tabs-bar dep-editacc-tabs">
              {DEP_EDIT_TABS.map(t => (
                <button key={t.id} className={"tab" + (tab === t.id ? ' active' : '')} onClick={() => setTab(t.id)}>
                  <Icon name={t.icon} size={14} /> {t.label}
                  {t.id === 'joint' && form.joints.length > 0 && <span className="count">{form.joints.length}</span>}
                </button>
              ))}
            </div>

            {/* ข้อมูลสมาชิก */}
            {tab === 'member' && (
              <div className="tab-panel">
                {ownerKind === 'member' && (
                  <div className="dep-member-strip" style={{ marginBottom: 12 }}>
                    <div className="member-avatar" style={{ width: 34, height: 34 }}>{((cur && cur.name) || '').slice(0, 2)}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{cur ? cur.name : '—'} <span className="muted mono" style={{ fontWeight: 400 }}>· {cur ? cur.member : '—'}</span></div>
                      <div className="muted" style={{ fontSize: 12 }}>{cur ? cur.dept : '—'}</div>
                    </div>
                    <span className={"chip " + ((cur && cur.memberStatus) === 'ปฏิบัติงาน' ? 'success' : 'danger')}><span className="dot-c" />{(cur && cur.memberStatus)}</span>
                  </div>
                )}
                <div className="dat-grid g3" style={{ padding: 0 }}>
                  <DatFieldLite label="ประเภทเจ้าของบัญชี">
                    <div className="cfg-display-box">{cur ? DEP_OWNER_KIND_LABEL[ownerKind] : '—'}</div>
                  </DatFieldLite>
                  <DatFieldLite label={ownerKind === 'member' ? 'เลขสมาชิก' : 'รหัสอ้างอิง'}>
                    <div className="cfg-display-box mono">{cur ? cur.member : '—'}</div>
                  </DatFieldLite>
                  <DatFieldLite label={ownerKind === 'legal' ? 'ชื่อนิติบุคคล' : 'ชื่อ-สกุล เจ้าของบัญชี'}>
                    <div className="cfg-display-box">{cur ? cur.name : '—'}</div>
                  </DatFieldLite>
                  <DatFieldLite label="CIF">
                    <input className="cfg-input mono" value={form.cif} onChange={(e) => set({ cif: e.target.value })} placeholder="รหัสลูกค้ากลาง" />
                  </DatFieldLite>
                  <DatFieldLite label="ผู้ถือบัญชี">
                    <select className="cfg-input" value={form.holderType} onChange={(e) => set({ holderType: e.target.value })}>
                      {DEP_EDIT_HOLDER.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </DatFieldLite>
                  <DatFieldLite label={ownerKind === 'legal' ? 'เลขทะเบียนนิติบุคคล' : 'เลขบัตรประชาชน'}>
                    <div className="cfg-display-box mono">{form.citizenId || '—'}</div>
                  </DatFieldLite>
                  <DatFieldLite label="โทรศัพท์">
                    <input className="cfg-input mono" value={form.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="เบอร์ติดต่อ" />
                  </DatFieldLite>
                  <DatFieldLite label="ที่อยู่ติดต่อ">
                    <input className="cfg-input" value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="ที่อยู่สำหรับติดต่อ/ส่งเอกสาร" />
                  </DatFieldLite>
                </div>
              </div>
            )}

            {/* ผู้ฝากร่วม */}
            {tab === 'joint' && (
              <div className="tab-panel">
                <div className="dat-section-head is-bar" style={{ padding: '0 0 10px' }}>
                  <span className="head-bar" />
                  <div><div className="dat-section-title">ผู้ฝากร่วม</div><div className="muted" style={{ fontSize: 11.5 }}>กรณีบัญชีมีเจ้าของร่วมมากกว่าหนึ่งคน</div></div>
                  <div className="dep-sec-right"><button className="btn primary sm" onClick={addJoint}><Icon name="plus" /> เพิ่มผู้ฝากร่วม</button></div>
                </div>
                <div className="table-wrap" style={{ border: 0 }}>
                  <table className="tbl vch-grid-tbl">
                    <thead>
                      <tr>
                        <th className="center" style={{ width: 48 }}>ลำดับ</th>
                        <th style={{ width: 160 }}>เลขอ้างอิง</th>
                        <th>ชื่อ - นามสกุล</th>
                        <th style={{ width: 40 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {form.joints.length === 0 ? (
                        <tr><td colSpan="4" className="center muted" style={{ padding: '18px 12px' }}>ไม่มีผู้ฝากร่วม — กด “เพิ่มผู้ฝากร่วม” เมื่อบัญชีมีเจ้าของร่วม</td></tr>
                      ) : form.joints.map((j, i) => (
                        <tr key={i}>
                          <td className="center mono">{i + 1}</td>
                          <td><input className="vch-cell-input mono" value={j.ref} onChange={(e) => setJoint(i, { ref: e.target.value })} placeholder="เลขสมาชิก/รหัส" /></td>
                          <td><input className="vch-cell-input" value={j.name} onChange={(e) => setJoint(i, { name: e.target.value })} placeholder="ชื่อ-นามสกุล ผู้ฝากร่วม" /></td>
                          <td className="center"><button className="bud-act danger" title="ลบแถว" onClick={() => delJoint(i)}><Icon name="close" size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* เงื่อนไข */}
            {tab === 'cond' && (() => {
              const rate = cur ? Number(cur.rate || 0) : 0;
              const taxRate = form.taxMode === 'exempt' ? 0 : form.taxMode === 'fixed' ? 15 : Number((accType && accType.taxRate) || 0);
              const ledger = window.depTxnLoadLedger ? window.depTxnLoadLedger() : [];
              const mv = cur && window.dpcMoves ? window.dpcMoves(cur.accNo, ledger) : [];
              const wdN = mv.filter(m => Number(m.amount || m.dr || 0) < 0 || m.side === 'W' || /ถอน/.test(m.label || '')).length;
              const toBank = form.recvPay === 'tobank' || form.recvPay === 'toaccount';
              return (
              <div className="tab-panel ec-cond">
                <div className="ec-cond-kpis">
                  <div className="ec-cond-kpi"><span>ต้นเงิน</span><b className="mono">{cur ? fmt.money(cur.balance || 0, 2) : '0.00'}</b></div>
                  <div className="ec-cond-kpi"><span>อัตรา Int./Div.</span><b className="mono">{rate.toFixed(3)}%</b></div>
                  <div className="ec-cond-kpi"><span>รายการเคลื่อนไหว</span><b className="mono">{mv.length.toLocaleString()}</b></div>
                  <div className="ec-cond-kpi"><span>จำนวนครั้งการถอน</span><b className="mono">{wdN.toLocaleString()}</b></div>
                </div>

                <section className="ec-cond-sec">
                  <h4 className="ec-cond-h">เงื่อนไขการถอน</h4>
                  <div className="ec-cond-row">
                    <DatFieldLite label="เงื่อนไข">
                      <textarea className="cfg-input" rows={3} value={form.withdrawCond} style={{ resize: 'vertical', minHeight: 72 }}
                                onChange={(e) => set({ withdrawCond: e.target.value })} placeholder="ระบุเงื่อนไขการถอน" />
                    </DatFieldLite>
                    <DatFieldLite label="หมายเหตุ">
                      <textarea className="cfg-input" rows={3} value={form.wdNote} style={{ resize: 'vertical', minHeight: 72 }}
                                onChange={(e) => set({ wdNote: e.target.value })} placeholder="หมายเหตุเพิ่มเติม" />
                    </DatFieldLite>
                  </div>
                </section>

                <section className="ec-cond-sec">
                  <h4 className="ec-cond-h">ดอกเบี้ย / ปันผล (Int./Div.)</h4>
                  <div className="ec-cond-g3">
                    <DatFieldLite label="เงื่อนไข Int./Div.">
                      <select className="cfg-input" value={form.intCond} onChange={(e) => set({ intCond: e.target.value })}>
                        {DEP_EDIT_INTCOND.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </DatFieldLite>
                    <DatFieldLite label="รับ Int./Div. โดย">
                      <select className="cfg-input" value={form.recvPay} onChange={(e) => set({ recvPay: e.target.value })}>
                        {DEP_EDIT_RECVPAY.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </DatFieldLite>
                    <DatFieldLite label="อัตราภาษี Int./Div.">
                      <div className="ec-cond-pair">
                        <select className="cfg-input" value={form.taxMode} onChange={(e) => set({ taxMode: e.target.value })}>
                          {DEP_EDIT_TAX.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                        </select>
                        <div className="cfg-display-box mono num">{taxRate.toFixed(3)}%</div>
                      </div>
                    </DatFieldLite>
                  </div>
                  {form.recvPay === 'compound' && (
                    <div className="ec-cond-bank">
                      <div className="ec-cond-bank-h">ทบต้น <span className="muted">· Int./Div. จะเพิ่มเข้ายอดเงินฝากของบัญชีนี้โดยอัตโนมัติ ไม่ต้องระบุบัญชีปลายทาง</span></div>
                    </div>
                  )}
                  {toBank && (
                    <div className="ec-cond-bank">
                      <div className="ec-cond-bank-h">{form.recvPay === 'toaccount' ? 'บัญชีเงินฝากสหกรณ์ที่รับ Int./Div.' : 'บัญชีธนาคารที่รับ Int./Div.'} <span className="muted">· แก้ไขได้ที่แท็บการโอนเงิน</span></div>
                      {form.recvPay === 'toaccount' ? (() => {
                        const ta = accounts.find(x => x.accNo === form.intToAcc);
                        return (
                          <div className="ec-cond-g4">
                            <DatFieldLite label="เลขที่บัญชี"><div className="cfg-display-box mono">{form.intToAcc || '—'}</div></DatFieldLite>
                            <DatFieldLite label="ชื่อบัญชี"><div className="cfg-display-box">{ta ? ta.name : '—'}</div></DatFieldLite>
                            <DatFieldLite label="ประเภทบัญชี"><div className="cfg-display-box">{ta ? ta.typeCode + ' ' + ta.type : '—'}</div></DatFieldLite>
                          </div>
                        );
                      })() : (
                      <div className="ec-cond-g4">
                        <DatFieldLite label="เลขที่บัญชี"><div className="cfg-display-box mono">{form.xferAcc || '—'}</div></DatFieldLite>
                        <DatFieldLite label="ชื่อบัญชี"><div className="cfg-display-box">{form.xferName || '—'}</div></DatFieldLite>
                        <DatFieldLite label="ธนาคาร"><div className="cfg-display-box">{form.xferBank || '—'}</div></DatFieldLite>
                        <DatFieldLite label="สาขา"><div className="cfg-display-box">{form.xferBranch || '—'}</div></DatFieldLite>
                      </div>
                      )}
                    </div>
                  )}
                </section>

                <section className="ec-cond-sec">
                  <h4 className="ec-cond-h">ประเภทผู้ถือบัญชี</h4>
                  <div className="ec-cond-g3">
                    <DatFieldLite label="ประเภทผู้ถือ">
                      <select className="cfg-input" value={form.holderType} onChange={(e) => set({ holderType: e.target.value })}>
                        {DEP_EDIT_HOLDER.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </DatFieldLite>
                  </div>
                </section>
              </div>
              );
            })()}

            {/* การโอนเงิน */}
            {tab === 'transfer' && (
              <div className="tab-panel">
                {form.recvPay === 'toaccount' ? (() => {
                  const ta = accounts.find(x => x.accNo === form.intToAcc) || null;
                  const own = accounts.filter(x => x.accNo !== (cur && cur.accNo) && x.status === 'active');
                  return (
                    <>
                      <div className="dat-warn info" style={{ marginTop: 0, marginBottom: 12 }}>
                        <Icon name="info" size={14} />
                        <div>บัญชีเงินฝากสหกรณ์ที่รับโอน Int./Div. — ใช้เมื่อรับ Int./Div. โดย “โอนเข้าบัญชี”</div>
                      </div>
                      <div className="dat-grid g2" style={{ padding: 0 }}>
                        <DatFieldLite label="บัญชีเงินฝากปลายทาง">
                          <DepAccountSearchField accounts={own} value={ta} onPick={(a) => set({ intToAcc: a ? a.accNo : '' })}
                                                 placeholder="คลิกเพื่อค้นหาบัญชีเงินฝากสหกรณ์…" />
                        </DatFieldLite>
                        <DatFieldLite label="ชื่อบัญชี"><div className="cfg-display-box">{ta ? ta.name : '—'}</div></DatFieldLite>
                      </div>
                    </>
                  );
                })() : form.recvPay === 'compound' ? (
                  <div className="dat-warn info" style={{ marginTop: 0 }}>
                    <Icon name="info" size={14} />
                    <div>บัญชีนี้รับ Int./Div. แบบ “ทบต้น” — ไม่ต้องระบุบัญชีปลายทาง หากต้องการโอนออก ให้เปลี่ยน “รับ Int./Div. โดย” ที่แท็บเงื่อนไข</div>
                  </div>
                ) : (<>
                <div className="dat-warn info" style={{ marginTop: 0, marginBottom: 12 }}>
                  <Icon name="info" size={14} />
                  <div>บัญชีธนาคารปลายทางสำหรับรับโอน Int./Div. — ใช้เมื่อรับ Int./Div. โดย “โอนเข้าบัญชีธนาคาร”</div>
                </div>
                <div className="dat-grid g2" style={{ padding: 0 }}>
                  <DatFieldLite label="ธนาคาร">
                    <select className="cfg-input" value={form.xferBank} onChange={(e) => set({ xferBank: e.target.value })}>
                      <option value="">— เลือกธนาคาร —</option>
                      {window.DEP_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </DatFieldLite>
                  <DatFieldLite label="เลขที่บัญชีธนาคาร">
                    <input className="cfg-input mono" value={form.xferAcc} onChange={(e) => set({ xferAcc: e.target.value })} placeholder="เลขบัญชีปลายทาง" />
                  </DatFieldLite>
                  <DatFieldLite label="ชื่อบัญชีธนาคาร">
                    <input className="cfg-input" value={form.xferName} onChange={(e) => set({ xferName: e.target.value })} placeholder="ชื่อบัญชีปลายทาง" />
                  </DatFieldLite>
                  <DatFieldLite label="สาขา">
                    <input className="cfg-input" value={form.xferBranch} disabled={!form.xferBank} onChange={(e) => set({ xferBranch: e.target.value })} placeholder={form.xferBank ? 'ชื่อสาขา' : 'เลือกธนาคารก่อน'} />
                  </DatFieldLite>
                </div>
                </>)}
              </div>
            )}
          </div>


          {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DepEditAccountPage });
