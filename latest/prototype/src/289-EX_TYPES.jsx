// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › ตั้งค่า — บุคคลภายนอก (External Party Register)
//  ทะเบียนบุคคล/นิติบุคคลภายนอกที่สหกรณ์ทำรายการรับ–จ่ายเงินด้วย
// ════════════════════════════════════════════════════════════════════
const { useState: exUseState, useMemo: exUseMemo } = React;

const EX_TYPES = ['นิติบุคคล', 'บุคคลธรรมดา', 'หน่วยงานราชการ', 'สหกรณ์อื่น'];
const EX_TITLES = ['ไม่ระบุ', 'นาย', 'นาง', 'นางสาว', 'บริษัท', 'ห้างหุ้นส่วนจำกัด', 'ร้าน'];
const EX_PROV = ['กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'เชียงใหม่', 'ขอนแก่น', 'ชลบุรี', 'สงขลา'];
const EX_DIST = {
  'กรุงเทพมหานคร': ['หลักสี่', 'จตุจักร', 'บางเขน', 'ดินแดง', 'ปทุมวัน'],
  'นนทบุรี': ['ปากเกร็ด', 'เมืองนนทบุรี', 'บางบัวทอง', 'บางใหญ่'],
  'ปทุมธานี': ['เมืองปทุมธานี', 'คลองหลวง', 'ธัญบุรี'],
  'สมุทรปราการ': ['เมืองสมุทรปราการ', 'บางพลี', 'พระประแดง'],
  'เชียงใหม่': ['เมืองเชียงใหม่', 'สันทราย', 'หางดง'],
  'ขอนแก่น': ['เมืองขอนแก่น', 'บ้านไผ่'],
  'ชลบุรี': ['เมืองชลบุรี', 'ศรีราชา', 'บางละมุง'],
  'สงขลา': ['หาดใหญ่', 'เมืองสงขลา'],
};
const EX_SUB = {
  'ปากเกร็ด': ['บางตลาด', 'ปากเกร็ด', 'บางพูด', 'คลองเกลือ'],
  'หลักสี่': ['ทุ่งสองห้อง', 'ตลาดบางเขน'],
  'จตุจักร': ['ลาดยาว', 'จอมพล', 'จันทรเกษม'],
};

const EX_SEED = [
  { id: 'X0001', code: 'X0001', type: 'นิติบุคคล', title: 'บริษัท', fname: 'ไปรษณีย์ไทยดิสทริบิวชั่น', lname: 'จำกัด',
    addr: '111 หมู่ 3 อาคาร ปณท', soi: '-', road: 'แจ้งวัฒนะ', prov: 'นนทบุรี', dist: 'ปากเกร็ด', sub: 'บางตลาด', zip: '11120',
    taxId: '0105551078xxx', email: 'ar@thpd.co.th', tel: '02-831-3000', mobile: '081-234-5678', fax: '02-831-3001', status: 'ใช้งาน' },
  { id: 'X0002', code: 'X0002', type: 'นิติบุคคล', title: 'บริษัท', fname: 'ทิพยประกันภัย', lname: 'จำกัด (มหาชน)',
    addr: '1115 ถนนพระราม 3', soi: '-', road: 'พระราม 3', prov: 'กรุงเทพมหานคร', dist: 'ดินแดง', sub: '', zip: '10400',
    taxId: '0107536000323', email: 'group@dhipaya.co.th', tel: '02-239-2200', mobile: '', fax: '02-239-2049', status: 'ใช้งาน' },
  { id: 'X0003', code: 'X0003', type: 'บุคคลธรรมดา', title: 'นาย', fname: 'ประเสริฐ', lname: 'วัฒนกิจ',
    addr: '48/12 หมู่บ้านสวนทอง', soi: 'ติวานนท์ 18', road: 'ติวานนท์', prov: 'นนทบุรี', dist: 'เมืองนนทบุรี', sub: '', zip: '11000',
    taxId: '3100900xxxxx', email: 'prasert.w@gmail.com', tel: '', mobile: '089-455-7712', fax: '', status: 'ใช้งาน' },
  { id: 'X0004', code: 'X0004', type: 'สหกรณ์อื่น', title: 'ไม่ระบุ', fname: 'สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย', lname: 'จำกัด',
    addr: '99 ถนนแจ้งวัฒนะ', soi: '-', road: 'แจ้งวัฒนะ', prov: 'กรุงเทพมหานคร', dist: 'หลักสี่', sub: 'ทุ่งสองห้อง', zip: '10210',
    taxId: '0994000165xxx', email: 'contact@cattsc.com', tel: '02-104-3000', mobile: '', fax: '02-104-3099', status: 'ใช้งาน' },
  { id: 'X0005', code: 'X0005', type: 'หน่วยงานราชการ', title: 'ไม่ระบุ', fname: 'กรมส่งเสริมสหกรณ์', lname: '',
    addr: '12 ถนนกรุงเกษม', soi: '-', road: 'กรุงเกษม', prov: 'กรุงเทพมหานคร', dist: 'ปทุมวัน', sub: '', zip: '10200',
    taxId: '0994000159xxx', email: 'cpd@cpd.go.th', tel: '02-628-5512', mobile: '', fax: '', status: 'ใช้งาน' },
  { id: 'X0006', code: 'X0006', type: 'นิติบุคคล', title: 'ห้างหุ้นส่วนจำกัด', fname: 'เอ็น.ที.ครุภัณฑ์', lname: '',
    addr: '77/9 ซอยงามวงศ์วาน 27', soi: 'งามวงศ์วาน 27', road: 'งามวงศ์วาน', prov: 'นนทบุรี', dist: 'เมืองนนทบุรี', sub: '', zip: '11000',
    taxId: '0123545001xxx', email: 'sale@ntkrp.co.th', tel: '02-951-7788', mobile: '086-100-2244', fax: '', status: 'ยกเลิก' },
];

const EX_KEY = 'coop.externalParties.v1';
const exLoad = () => { try { const s = JSON.parse(localStorage.getItem(EX_KEY)); if (s && s.length) return s; } catch (e) {} return EX_SEED; };
const exSave = (d) => { try { localStorage.setItem(EX_KEY, JSON.stringify(d)); } catch (e) {} };
const exFull = (p) => [p.title !== 'ไม่ระบุ' ? p.title : '', p.fname, p.lname].filter(Boolean).join(' ');
const exBlank = () => ({ id: '', code: 'Auto', type: 'นิติบุคคล', title: 'ไม่ระบุ', fname: '', lname: '', addr: '', soi: '', road: '',
  prov: '', dist: '', sub: '', zip: '', taxId: '', email: '', tel: '', mobile: '', fax: '', status: 'ใช้งาน' });

// ─── ฟอร์มเพิ่ม / แก้ไขบุคคลภายนอก ───────────────────────────────────
function ExternalPartyModal({ init, onClose, onSave }) {
  const [f, setF] = exUseState(init);
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const setProv = (e) => setF(s => ({ ...s, prov: e.target.value, dist: '', sub: '' }));
  const setDist = (e) => setF(s => ({ ...s, dist: e.target.value, sub: '' }));
  const dists = EX_DIST[f.prov] || [];
  const subs = EX_SUB[f.dist] || [];
  const invalid = !f.fname.trim();

  const F = (label, node, span) => (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}</span>{node}
    </label>
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 880, maxWidth: '95vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="user" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{init.id ? 'แก้ไขบุคคลภายนอก' : 'เพิ่มบุคคลภายนอก'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>ข้อมูลผู้รับ–ผู้จ่ายเงินที่ไม่ใช่สมาชิกสหกรณ์</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ap-form-grid ex-grid">
            <div className="ap-field">
              <span className="ap-label">เลขที่บุคคล</span>
              <div className="cfg-display-box mono">{f.code || 'Auto'}</div>
            </div>
            {F('ประเภทบุคคล', <ExSelect className="cfg-input" value={f.type} onChange={set('type')}>{EX_TYPES.map(t => <option key={t}>{t}</option>)}</ExSelect>)}
            {F('คำนำหน้า', <ExSelect className="cfg-input" value={f.title} onChange={set('title')}>{EX_TITLES.map(t => <option key={t}>{t}</option>)}</ExSelect>)}

            {F('ชื่อ', <input className="cfg-input" value={f.fname} onChange={set('fname')} placeholder="ชื่อ / ชื่อนิติบุคคล" />, 2)}
            {F('นามสกุล', <input className="cfg-input" value={f.lname} onChange={set('lname')} placeholder="นามสกุล / คำต่อท้าย" />, 2)}

            {F('ที่อยู่', <input className="cfg-input" value={f.addr} onChange={set('addr')} placeholder="บ้านเลขที่ หมู่ อาคาร" />, 2)}
            {F('ซอย', <input className="cfg-input" value={f.soi} onChange={set('soi')} />)}
            {F('ถนน', <input className="cfg-input" value={f.road} onChange={set('road')} />)}

            {F('จังหวัด', <ExSelect className="cfg-input" value={f.prov} onChange={setProv}><option value="">— เลือกจังหวัด —</option>{EX_PROV.map(p => <option key={p}>{p}</option>)}</ExSelect>)}
            {F('อำเภอ/เขต', <ExSelect className="cfg-input" value={f.dist} onChange={setDist} disabled={!f.prov}><option value="">— เลือกอำเภอ/เขต —</option>{dists.map(d => <option key={d}>{d}</option>)}</ExSelect>)}
            {F('ตำบล/แขวง', <ExSelect className="cfg-input" value={f.sub} onChange={set('sub')} disabled={!f.dist}><option value="">— เลือกตำบล/แขวง —</option>{subs.map(s => <option key={s}>{s}</option>)}</ExSelect>)}
            {F('รหัสไปรษณีย์', <input className="cfg-input mono" value={f.zip} onChange={set('zip')} maxLength={5} />)}

            {F('เลขผู้เสียภาษี', <input className="cfg-input mono" value={f.taxId} onChange={set('taxId')} maxLength={13} />, 2)}
            {F('E-mail', <input className="cfg-input" type="email" value={f.email} onChange={set('email')} />, 2)}

            {F('โทรศัพท์พื้นฐาน', <input className="cfg-input mono" value={f.tel} onChange={set('tel')} />)}
            {F('โทรศัพท์เคลื่อนที่', <input className="cfg-input mono" value={f.mobile} onChange={set('mobile')} />)}
            {F('โทรสาร', <input className="cfg-input mono" value={f.fax} onChange={set('fax')} />)}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} disabled={invalid} onClick={() => onSave(f)}>
              <Icon name="check" /> บันทึกข้อมูล
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── หน้าจอหลัก ──────────────────────────────────────────────────────
function ExternalPartyPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'บุคคลภายนอก', current: true }], []);
  const [list, setList] = exUseState(exLoad);
  const [q, setQ] = exUseState('');
  const [qDraft, setQDraft] = exUseState('');
  const [typeDraft, setTypeDraft] = exUseState('ทั้งหมด');
  const [confirmDel, setConfirmDel] = exUseState(null);
  const [confirmOff, setConfirmOff] = exUseState(null);
  const [type, setType] = exUseState('ทั้งหมด');
  const [status, setStatus] = exUseState('ทั้งหมด');
  const [edit, setEdit] = exUseState(null);

  const rows = exUseMemo(() => list.filter(p =>
    (type === 'ทั้งหมด' || p.type === type) &&
    (status === 'ทั้งหมด' || p.status === status) &&
    (!q.trim() || (p.code + exFull(p) + p.taxId + p.mobile + p.tel).toLowerCase().includes(q.trim().toLowerCase()))
  ), [list, q, type, status]);

  const persist = (next) => { setList(next); exSave(next); };
  const save = (f) => {
    let next;
    if (f.id) {
      next = list.map(p => (p.id === f.id ? f : p));
      onToast && onToast(`แก้ไขข้อมูล ${exFull(f)} เรียบร้อย`);
    } else {
      const n = list.reduce((m, p) => Math.max(m, +p.code.replace(/\D/g, '') || 0), 0) + 1;
      const code = 'X' + String(n).padStart(4, '0');
      next = [...list, { ...f, id: code, code }];
      onToast && onToast(`เพิ่มบุคคลภายนอก ${code} — ${exFull(f)} เรียบร้อย`);
    }
    persist(next); setEdit(null);
  };
  const doDelete = (p) => {
    persist(list.filter(x => x.id !== p.id));
    onToast && onToast(`ลบ ${p.code} — ${exFull(p)} เรียบร้อย`);
    setConfirmDel(null);
  };
  const toggle = (p) => {
    persist(list.map(x => (x.id === p.id ? { ...x, status: x.status === 'ใช้งาน' ? 'ยกเลิก' : 'ใช้งาน' } : x)));
    onToast && onToast(`${p.status === 'ใช้งาน' ? 'ยกเลิก' : 'เปิด'}การใช้งาน ${p.code} แล้ว`);
  };

  const active = list.filter(p => p.status === 'ใช้งาน').length;

  return (
    <div data-screen-label="หน้าบุคคลภายนอก">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บุคคลภายนอก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            ทะเบียนบุคคลและนิติบุคคลภายนอกที่ใช้อ้างอิงในใบสำคัญรับ–จ่าย การออกเช็ค และการโอนเงิน
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setEdit(exBlank())}><Icon name="plus" /> เพิ่มบุคคลภายนอก</button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 280px', minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ค้นหา</span>
            <div className="search" style={{ flex: '1 1 auto', width: '100%', height: 32, boxSizing: 'border-box' }}>
              <Icon name="search" size={14} />
              <input value={qDraft} onChange={e => setQDraft(e.target.value)} style={{ height: 30, width: '100%', minWidth: 0 }}
                     onKeyDown={e => { if (e.key === 'Enter') { setQ(qDraft); setType(typeDraft); } }}
                     placeholder="เลขที่บุคคล / ชื่อ / เลขผู้เสียภาษี / เบอร์โทร" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภท</span>
            <ExSelect className="filter-select" value={typeDraft} onChange={e => setTypeDraft(e.target.value)} style={{ width: 190 }}>
              <option value="ทั้งหมด">ทุกประเภท</option>
              {EX_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </ExSelect>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <ExSelect className="filter-select" value={status} onChange={e => setStatus(e.target.value)} style={{ width: 160 }}>
              <option value="ทั้งหมด">ทุกสถานะ</option>
              <option value="ใช้งาน">ใช้งาน</option>
              <option value="ยกเลิก">ไม่ใช้งาน</option>
            </ExSelect>
          </div>
          <button className="btn primary" onClick={() => { setQ(qDraft); setType(typeDraft); }}>ค้นหา</button>
          <button className="btn" onClick={() => { setQDraft(''); setTypeDraft('ทั้งหมด'); setQ(''); setType('ทั้งหมด'); setStatus('ทั้งหมด'); }}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
        <table className="tbl ex-tbl" style={{ minWidth: 980 }}>
          <thead><tr>
            <th className="ex-c-code">เลขที่บุคคล</th>
            <th className="ex-c-type">ประเภท</th>
            <th>ชื่อ–สกุล / ชื่อนิติบุคคล</th>
            <th className="ex-c-tax">เลขผู้เสียภาษี</th>
            <th className="ex-c-tel">ติดต่อ</th>
            <th className="ex-c-st center">ใช้งาน</th>
            <th className="ex-c-act center">จัดการ</th>
          </tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} className={p.status === 'ใช้งาน' ? undefined : 'dat-off'}>
                <td className="mono">{p.code}</td>
                <td>{p.type}</td>
                <td>
                  <div className="ex-name">{exFull(p)}</div>
                  {p.email && <div className="muted ex-sub">{p.email}</div>}
                </td>
                <td className="mono">{p.taxId || '—'}</td>
                <td className="mono ex-sub">
                  {p.mobile || p.tel || '—'}
                  {p.mobile && p.tel && <div className="muted">{p.tel}</div>}
                </td>
                <td className="center">
                  <button className={'lt-switch' + (p.status === 'ใช้งาน' ? ' on' : '')} role="switch"
                          aria-checked={p.status === 'ใช้งาน'} aria-label={p.status === 'ใช้งาน' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                          onClick={() => { if (p.status === 'ใช้งาน') setConfirmOff(p); else toggle(p); }}>
                    <span className="lt-switch-knob" />
                  </button>
                </td>
                <td className="ex-act center">
                  <div className="ex-act-row">
                    <button className="btn sm ex-row-btn" onClick={() => setEdit(p)}>
                      <Icon name="edit" size={13} /> แก้ไข
                    </button>
                    <button className="btn sm ex-row-btn del" disabled={p.status !== 'ใช้งาน'} onClick={() => setConfirmDel(p)} title={p.status === 'ใช้งาน' ? 'ลบบุคคลภายนอก' : 'ปิดใช้งาน — ลบไม่ได้'}>
                      <Icon name="trash" size={13} /> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="empty-state" style={{ padding: 28 }}>ไม่พบบุคคลภายนอกตามเงื่อนไข</td></tr>}
          </tbody>
        </table>
        </div></div>

        <div className="ex-foot muted" style={{ borderTop: 0 }}>
          แสดง {rows.length} จาก {list.length} รายการ · ใช้งานอยู่ {active} รายการ
        </div>
      </div>

      {edit && <ExternalPartyModal init={edit} onClose={() => setEdit(null)} onSave={save} />}

      {confirmOff && window.DepStatusDialog && (
        <window.DepStatusDialog tone="danger" title="ปิดใช้งานรายการนี้?"
          desc={<>ต้องการปิดใช้งานบุคคลภายนอก <b className="mono">{confirmOff.code}</b> · {exFull(confirmOff)} ใช่หรือไม่? รายการนี้จะไม่แสดงเป็นตัวเลือกในเอกสารใหม่</>}
          okLabel="ยืนยันปิดใช้งาน" onOk={() => { toggle(confirmOff); setConfirmOff(null); }} onClose={() => setConfirmOff(null)} />
      )}

      {confirmDel && window.DepStatusDialog && (
        <window.DepStatusDialog tone="danger" title="ยืนยันการลบบุคคลภายนอก"
          desc={<>ต้องการลบบุคคลภายนอก <b className="mono">{confirmDel.code}</b> · {exFull(confirmDel)} ใช่หรือไม่?</>}
          okLabel="ลบ" onOk={() => doDelete(confirmDel)} onClose={() => setConfirmDel(null)} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  Dropdown ที่วางรายการตรงกับตำแหน่งช่อง (แบบเดียวกับเมนูรายการธนาคาร)
// ═════════════════════════════════════════════════════════════════
function ExSelect({ value, onChange, className, style, disabled, children }) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState(null);
  const wrap = React.useRef(null);
  const place = () => { if (wrap.current) setRect(wrap.current.getBoundingClientRect()); };
  React.useEffect(() => {
    if (!open) return;
    place();
    const h = () => place();
    const out = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', out);
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [open]);

  const items = [];
  const text = (n) => React.Children.toArray(n).map(x => (x && x.props ? text(x.props.children) : String(x == null ? '' : x))).join('');
  React.Children.forEach(children, (o) => {
    if (!o || !o.props) return;
    if (Array.isArray(o)) return;
    items.push({ value: o.props.value !== undefined ? o.props.value : text(o.props.children), label: text(o.props.children) });
  });
  const flat = [];
  React.Children.forEach(children, (c) => {
    if (!c) return;
    if (Array.isArray(c)) c.forEach(o => o && o.props && flat.push({ value: o.props.value !== undefined ? o.props.value : text(o.props.children), label: text(o.props.children) }));
    else if (c.props) flat.push({ value: c.props.value !== undefined ? c.props.value : text(c.props.children), label: text(c.props.children) });
  });
  const opts = flat.length ? flat : items;
  const same = (a) => String(a == null ? '' : a) === String(value == null ? '' : value);

  return (
    <div ref={wrap} style={Object.assign({ position: 'relative', width: '100%', minWidth: 0 }, style || {})}>
      <select className={className} value={value == null ? '' : value} disabled={disabled} onChange={onChange}
              onMouseDown={(e) => { if (!disabled) { e.preventDefault(); place(); setOpen(o => !o); } }}
              onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); place(); setOpen(o => !o); } }}
              style={{ width: '100%' }}>
        {children}
      </select>
      {open && rect && ReactDOM.createPortal((
        <div style={{ position: 'fixed', zIndex: 4000,
                      top: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? undefined : rect.bottom + 1,
                      bottom: (rect.bottom + 250 > window.innerHeight && rect.top > 270) ? (window.innerHeight - rect.top + 1) : undefined,
                      left: rect.left, width: rect.width, maxHeight: 250, overflowY: 'auto', boxSizing: 'border-box',
                      background: 'var(--surface-card, #fff)', border: '1px solid var(--border-strong)', borderRadius: 2,
                      boxShadow: '0 2px 6px rgba(0,0,0,.08)', padding: 0 }}>
          {opts.map((it, i) => (
            <div key={i} onClick={() => { setOpen(false); onChange && onChange({ target: { value: it.value } }); }}
                 style={{ padding: '5px 8px', fontSize: 13, lineHeight: 1.5, cursor: 'pointer', whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          background: same(it.value) ? '#1254CC' : 'transparent',
                          color: same(it.value) ? '#fff' : 'var(--text)' }}
                 onMouseEnter={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                 onMouseLeave={(e) => { if (!same(it.value)) e.currentTarget.style.background = 'transparent'; }}>
              {it.label || '—'}
            </div>
          ))}
        </div>
      ), document.body)}
    </div>
  );
}

Object.assign(window, { ExternalPartyPage });
