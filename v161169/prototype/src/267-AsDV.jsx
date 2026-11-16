// ════════════════════════════════════════════════════════════════════
//  ทะเบียนครุภัณฑ์ — หน้าดูรายละเอียด (อ่านอย่างเดียว) แบบแท็บ
//  4 แท็บ: ข้อมูลทั่วไป · การได้มาและมูลค่า · สถานที่และผู้รับผิดชอบ
//          · ประกันและบำรุงรักษา
//  มีปุ่ม "พิมพ์สติกเกอร์บาร์โค้ด" และ "แก้ไข"
// ════════════════════════════════════════════════════════════════════

// แถวข้อมูล label / value (อ่านอย่างเดียว)
function AsDV({ label, children, full, mono }) {
  return (
    <div className={"ast-dv" + (full ? ' full' : '')}>
      <span className="ast-dv-k">{label}</span>
      <span className={"ast-dv-v" + (mono ? ' mono' : '')}>{children || '—'}</span>
    </div>
  );
}

function AssetDetail({ asset, onEdit, onSticker, onClose }) {
  const [tab, setTab] = React.useState('gen');
  const a = asset;
  const cat = window.astCat(a.category);
  const stt = window.AST_STATUS[a.status] || window.AST_STATUS.in_use;
  const dep = window.astDepreciation(a);
  const w = window.astWarranty(a);

  const loc = (window.AST_LOCATIONS.find(x => x.v === a.location) || {}).l;
  const dept = (window.AST_DEPARTMENTS.find(x => x.v === a.department) || {}).l;
  const cust = (window.AST_CUSTODIANS.find(x => x.v === a.custodian) || {});
  const vendor = (window.AST_VENDORS.find(x => x.v === a.vendor) || {}).l || a.vendor;
  const sp = (window.AST_VENDORS.find(x => x.v === a.serviceProvider) || {}).l;
  const budget = window.astBudgetLabel(a.budget);
  const pm = window.astPmCycleLabel(a.pmCycle);

  const TABS = [
    { id: 'gen',      label: 'ข้อมูลทั่วไป' },
    { id: 'acq',      label: 'การได้มาและมูลค่า' },
    { id: 'loc',      label: 'สถานที่และผู้รับผิดชอบ' },
    { id: 'warranty', label: 'ประกันและบำรุงรักษา' },
  ];

  const warrantyBadge = () => {
    if (w.state === 'none') return <span className="pill neutral">ไม่ระบุประกัน</span>;
    if (w.state === 'expired') return <span className="pill bad">หมดประกันแล้ว {Math.abs(w.days)} วัน</span>;
    if (w.state === 'soon') return <span className="pill warn">ใกล้หมดประกัน · เหลือ {w.days} วัน</span>;
    return <span className="pill ok">อยู่ในประกัน · เหลือ {w.days} วัน</span>;
  };

  return (
    <div data-screen-label="หน้าดูรายละเอียดครุภัณฑ์">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card as-detail-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
            <Icon name="eye" />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</h2>
            <div className="muted as-form-subhead">
              <span className="mono">{a.id}</span>
              <span className={"pill " + stt.pill}>{stt.l}</span>
              {cat && cat.noDep && <span className="chip info" style={{ fontSize: 10.5 }}>ไม่คิดค่าเสื่อม</span>}
            </div>
          </div>
          <div className="as-detail-head-act">
            <button className="btn sm" onClick={() => onSticker && onSticker(a)}><Icon name="print" /> พิมพ์สติกเกอร์</button>
            <button className="btn primary sm" onClick={() => onEdit && onEdit(a)}><Icon name="edit" /> แก้ไข</button>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        {/* แท็บ */}
        <div className="as-detail-tabs">
          {TABS.map(t => (
            <button key={t.id} className={"as-detail-tab" + (tab === t.id ? ' active' : '')}
                    onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        <div className="modal-body as-detail-body">
          {tab === 'gen' && (
            <div className="ast-dv-grid">
              <AsDV label="เลขทะเบียนครุภัณฑ์" mono>{a.id}</AsDV>
              <AsDV label="สถานะ"><span className={"pill " + stt.pill}>{stt.l}</span></AsDV>
              <AsDV label="หมวดหมู่">{cat ? cat.name : '—'}</AsDV>
              <AsDV label="ชื่อครุภัณฑ์" full>{a.name}</AsDV>
              <AsDV label="ประเภท / ชนิด">{a.type}</AsDV>
              <AsDV label="ยี่ห้อ (Brand)">{a.brand}</AsDV>
              <AsDV label="รุ่น (Model)">{a.model}</AsDV>
              <AsDV label="หมายเลขเครื่อง (Serial No.)" mono>{a.serial}</AsDV>
              <AsDV label="รายละเอียดเพิ่มเติม" full>{a.detail}</AsDV>
            </div>
          )}

          {tab === 'acq' && (
            <>
              <div className="ast-dv-grid">
                <AsDV label="วันที่รับเข้า (Acquired)" mono>{a.acquiredDate ? fmt.date(a.acquiredDate) : '—'}</AsDV>
                <AsDV label="เอกสารซื้อ (PO / Invoice)" mono>{a.poNo}</AsDV>
                <AsDV label="ผู้ขาย / ผู้จัดจำหน่าย">{vendor}</AsDV>
                <AsDV label="ราคาทุน (Asset Cost)" mono>฿ {fmt.money(a.cost, 2)}</AsDV>
                <AsDV label="ภาษีมูลค่าเพิ่ม (VAT)">{Number(a.vat) > 0 ? a.vat + '%' : 'ไม่มี VAT'}</AsDV>
                <AsDV label="แหล่งงบประมาณ">{budget}</AsDV>
              </div>
              <div className="ast-dv-mini">
                <div className="ast-dv-mini-box accent">
                  <span className="lbl">มูลค่าตามบัญชี (สุทธิ)</span>
                  <span className="val">฿ {fmt.money(dep.bookValue, 2)}</span>
                </div>
                <div className="ast-dv-mini-box">
                  <span className="lbl">ค่าเสื่อมสะสม</span>
                  <span className="val">฿ {fmt.money(dep.accumulated, 2)}</span>
                </div>
                <div className="ast-dv-mini-box">
                  <span className="lbl">คงเหลือในสต็อก</span>
                  <span className="val">{window.astOnHand(a)} <i>{a.unit}</i></span>
                </div>
              </div>
            </>
          )}

          {tab === 'loc' && (
            <div className="ast-dv-grid">
              <AsDV label="หน่วยงาน / แผนก">{dept}</AsDV>
              <AsDV label="สาขา / สถานที่ตั้ง">{loc}</AsDV>
              <AsDV label="อาคาร (Building)">{a.building}</AsDV>
              <AsDV label="ห้อง (Room)">{a.room}</AsDV>
              <AsDV label="ผู้ถือครอง / ผู้รับผิดชอบ" full>
                {cust.l ? <span><span className="mono">{cust.v}</span> · {cust.l}</span> : '—'}
              </AsDV>
            </div>
          )}

          {tab === 'warranty' && (
            <>
              <div className="ast-dv-warranty-head">{warrantyBadge()}</div>
              <div className="ast-dv-grid">
                <AsDV label="วันเริ่มรับประกัน" mono>{a.warrantyStart ? fmt.date(a.warrantyStart) : '—'}</AsDV>
                <AsDV label="วันสิ้นสุดรับประกัน" mono>{a.warrantyEnd ? fmt.date(a.warrantyEnd) : '—'}</AsDV>
                <AsDV label="รอบบำรุงรักษา (PM)">{pm}</AsDV>
                <AsDV label="ผู้ให้บริการ">{sp}</AsDV>
                <AsDV label="แจ้งเตือนล่วงหน้า">{a.alertDays ? a.alertDays + ' วัน' : '—'}</AsDV>
              </div>
            </>
          )}
        </div>

        <div className="as-form-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn" onClick={() => onSticker && onSticker(a)}><Icon name="print" /> พิมพ์สติกเกอร์บาร์โค้ด</button>
          <button className="btn primary" onClick={() => onEdit && onEdit(a)}><Icon name="edit" /> แก้ไขข้อมูล</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AssetDetail });
