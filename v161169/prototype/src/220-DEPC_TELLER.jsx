// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ธุรกรรมเคาน์เตอร์ — ฝาก / ถอน / โอนระหว่างบัญชี / ปิดบัญชี
//  รวมทุกฟังก์ชันในหน้าจอเดียว · แสดงวันที่เคลื่อนไหวล่าสุด
//  บัญชีไม่เคลื่อนไหวเกินกำหนด (ตามประเภทเงินฝาก) → แจ้งเตือนสีแดง + ต้องปลดล็อกโดยผู้มีสิทธิ์
// ════════════════════════════════════════════════════════════════════

const DEPC_TELLER = 'จันทร์เพ็ญ มาลี';

// ─── popup สถานะกลาง (สไตล์ StatusModal) ───────────────────────────
//  tone: confirm (เขียว) · warn (เหลือง) · danger (แดง) · success (เขียว)
const DEP_DLG_ICON = { confirm: 'info', warn: 'info', danger: 'info', success: 'check' };
function DepStatusDialog(props) {
  return ReactDOM.createPortal(<DepStatusDialogInner {...props} />, document.body);
}
function DepStatusDialogInner({ tone = 'confirm', icon, title, desc, wide, children, cancelLabel, okLabel, onOk, onClose, onCancel, titleStyle, descStyle }) {
  if (tone === 'success') {
    return (
      <>
        <div className="modal-backdrop" />
        <div className="dep-dlg success" role="dialog" aria-modal="true" style={wide ? { width: 600 } : undefined}>
          <div className="dep-dlg-ico"><Icon name={icon || 'check'} size={34} /></div>
          <h2 className="dep-dlg-t">{title}</h2>
          {desc && <div className="dep-dlg-d">{desc}</div>}
          {children && <div className="dep-dlg-body">{children}</div>}
          <div className="dep-dlg-foot" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn primary" onClick={onOk || onClose}>{okLabel || 'เสร็จสิ้น'}</button>
          </div>
        </div>
      </>
    );
  }
  // popup ยืนยัน / เตือน — จัดกึ่งกลางแบบเดียวกับ popup บันทึกสำเร็จ (ไอคอนวงกลมกลาง · ปุ่มคู่ด้านล่าง)
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={'dep-dlg ' + tone} role="dialog" aria-modal="true" style={wide ? { width: 600 } : undefined}>
        <button className="dep-dlg-x" onClick={onClose} aria-label="ปิด"><Icon name="close" size={16} /></button>
        <div className="dep-dlg-ico"><Icon name={icon || DEP_DLG_ICON[tone] || 'info'} size={30} /></div>
        <h2 className="dep-dlg-t" style={titleStyle}>{title}</h2>
        {desc && <div className="dep-dlg-d" style={descStyle}>{desc}</div>}
        {children && <div className="dep-dlg-body">{children}</div>}
        <div className="dep-dlg-foot" style={cancelLabel === null ? { display: 'flex', justifyContent: 'center' } : undefined}>
          {cancelLabel !== null && <button className="btn" onClick={onCancel || onClose}>{cancelLabel || 'ยกเลิก'}</button>}
          <button className="btn primary" onClick={onOk || onClose}
                  style={tone === 'danger' ? { background: 'var(--danger, #cf1322)', borderColor: 'var(--danger, #cf1322)' } : (cancelLabel === null ? { minWidth: 140 } : undefined)}>
            {okLabel || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </>
  );
}
window.DepStatusDialog = DepStatusDialog;

// ─── popup ยืนยัน (เรียกจากที่ไหนก็ได้) ─────────────────────────────
//  window.depAskConfirm({ title, lines:[[k,v]], okLabel, tone, onOk })
window.depAskConfirm = function (opts) {
  const o = opts || {};
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(<window.DepConfirmModal title={o.title} lines={o.lines} okLabel={o.okLabel} tone={o.tone}
    onOk={() => { close(); o.onOk && o.onOk(); }} onClose={close} />);
};
// (เดิม) ยืนยันก่อนปิดใช้งาน — สำรองไว้กรณีไม่มี ToggleConfirmModal · รูปแบบเดียวกันทุกเมนูค่าคงที่
//  window.depConfirmOff(isOn, name, apply, effect, title)
function DepOffConfirm({ title, name, effect, onOk, onClose }) {
  const parts = String(name || '').split(' · ');
  const short = parts.length > 1 ? parts.slice(1).join(' · ') : name;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460, maxWidth: '94vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={{ background: 'var(--warning-50, #fffbe6)', color: 'var(--warning, #faad14)' }}><Icon name="info" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title || 'ปิดการใช้งาน'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">ปิดการใช้งาน <b>“{short}”</b> — {effect || 'จะไม่แสดงเป็นตัวเลือกในการทำรายการ'}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={onOk}><Icon name="check" /> ยืนยัน</button>
          </div>
        </div>
      </div>
    </>
  );
}
// หน้าต่างยืนยันเปิด/ปิดใช้งาน — หน้าตาเดียวกับค่าคงที่สินเชื่อ (ประเภทเงินกู้)
function DepConstConfirm({ next, blocked, title, subtitle, detail, onCancel, onConfirm }) {
  const G = '#237450';
  const tone = blocked ? { bg: '#fff1f0', fg: '#cf1322' } : next ? { bg: '#eafef2', fg: G } : { bg: '#fffbe6', fg: '#d48806' };
  const btn = (primary) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, height: 38,
    border: '1px solid ' + (primary ? G : '#d9d9d9'), background: primary ? G : '#fff', borderRadius: 4, fontFamily: 'inherit',
    fontSize: 13, fontWeight: 600, color: primary ? '#fff' : 'rgba(0,0,0,.65)', cursor: 'pointer', flex: 1 });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 940, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div role="dialog" aria-modal="true" style={{ width: 460, maxWidth: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 6px 24px rgba(0,0,0,.18)', overflow: 'hidden', fontFamily: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 20px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 9999, flexShrink: 0, background: tone.bg, color: tone.fg }}>
            {next && !blocked
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5.5 5.5L20 7" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" strokeWidth="1.8" /><path d="M12 7.5v5.5" /><path d="M12 16.3v.4" /></svg>}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,.88)', lineHeight: 1.4 }}>{title}</h2>
            {subtitle && <div style={{ fontSize: 12, color: 'rgba(0,0,0,.45)', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button type="button" aria-label="ปิด" onClick={onCancel}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(0,0,0,.35)', fontSize: 18, lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
        </div>
        <p style={{ margin: 0, padding: '20px 20px 0', fontSize: 13, color: 'rgba(0,0,0,.65)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{detail}</p>
        <div style={{ display: 'flex', gap: 10, padding: 20 }}>
          {blocked
            ? <button type="button" style={btn(false)} onClick={onCancel}>ปิด</button>
            : <>
                <button type="button" style={btn(false)} onClick={onCancel}>ยกเลิก</button>
                <button type="button" style={btn(true)} onClick={onConfirm}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12.5 5.5 5.5L20 7" /></svg> ยืนยัน
                </button>
              </>}
        </div>
      </div>
    </div>
  );
}
// ยืนยันเปิด/ปิดใช้งานค่าคงที่ — รูปแบบเดียวกับค่าคงที่สินเชื่อ (Design System ToggleConfirmModal)
//  ยืนยันทั้งตอนเปิดและปิด · opts.blocked = เหตุผลที่ปิดไม่ได้ (ถูกใช้อยู่) → หน้าต่าง "ปิดใช้งานไม่ได้"
//  window.depConfirmOff(isOn, name, apply, effectOff, title, { effectOn, blocked })
window.depConfirmOff = function (isOn, name, apply, effect, title, opts) {
  const o = opts || {};
  const turningOn = !isOn;
  const blocked = !turningOn && typeof o.blocked === 'function' ? o.blocked() : (!turningOn ? o.blocked : null);
  const base = String(title || 'ปิดการใช้งาน').replace(/^(เปิด|ปิด)/, '');
  const ttl = (turningOn ? 'เปิด' : 'ปิด') + (base || 'การใช้งาน');
  const parts = String(name || '').split(' · ');
  const short = parts.length > 1 ? parts.slice(1).join(' · ') : name;
  const detail = blocked ? 'ปิดใช้งานไม่ได้ — ' + blocked
    : turningOn ? 'เปิดการใช้งาน “' + short + '” — ' + (o.effectOn || 'จะกลับมาแสดงเป็นตัวเลือกในการทำรายการ')
    : 'ปิดการใช้งาน “' + short + '” — ' + (effect || 'จะไม่แสดงเป็นตัวเลือกในการทำรายการ ข้อมูลเดิมยังคงอยู่');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  const M = DepConstConfirm;
  if (!M) { if (blocked) { close(); window.alert(detail); return; } root.render(<DepOffConfirm title={ttl} name={name} effect={effect} onOk={() => { close(); apply(); }} onClose={close} />); return; }
  // ชั้นที่ 2 — แจ้งผลสำเร็จ (เหมือนค่าคงที่สินเชื่อ)
  const done = () => {
    const S = window.StatusModal; if (!S) { close(); return; }
    root.render(<S variant="success" title={(turningOn ? 'เปิด' : 'ปิด') + 'การใช้งานเรียบร้อยแล้ว'}
      detail={'“' + short + '” ถูก' + (turningOn ? 'เปิด' : 'ปิด') + 'ใช้งานเรียบร้อยแล้ว'} onClose={close} />);
  };
  root.render(<M next={turningOn} blocked={!!blocked} title={ttl} subtitle={name} detail={detail}
    onCancel={close} onConfirm={() => { if (blocked) { close(); return; } apply(); done(); }} />);
};
// สวิตช์เปิด/ปิดใช้งานในตารางค่าคงที่ — ขนาด/สีเดียวกับค่าคงที่สินเชื่อ (สีหลักเมื่อเปิด)
window.ConstSwitch = function ConstSwitch({ on, onClick, disabled, title }) {
  return (
    <button type="button" className={'lt-switch' + (on ? ' on' : '')} role="switch" aria-checked={!!on}
            aria-label={on ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} title={title} disabled={disabled}
            style={on ? { background: 'var(--primary)' } : undefined}
            onClick={(e) => { e.stopPropagation(); onClick && onClick(e); }}>
      <span className="lt-switch-knob" />
    </button>
  );
};
// ป้ายสถานะในตารางค่าคงที่ (เหมือนสินเชื่อ)
window.ConstStatusPill = ({ on }) => (on ? <span className="pill ok">เปิดใช้งาน</span> : <span className="pill neutral">ปิดใช้งาน</span>);

// ─── popup บันทึกสำเร็จ (เรียกจากที่ไหนก็ได้) ────────────────────────
//  window.depSuccess({ title, desc, lines:[[k,v]], onPrint, printLabel, next })
window.depSuccess = function (opts) {
  const o = opts || {};
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(
    <>
      <div className="modal-backdrop" />
      <div className="dep-dlg success" role="dialog" aria-modal="true" style={o.lines && o.lines.length ? { width: 500 } : undefined}>
        <div className="dep-dlg-ico"><Icon name="check" size={34} /></div>
        <h2 className="dep-dlg-t">{o.title || 'บันทึกข้อมูลเรียบร้อยแล้ว'}</h2>
        {o.desc && <div className="dep-dlg-d">{o.desc}</div>}
        {o.lines && o.lines.length > 0 && (
          <div className="dep-dlg-body"><div className="dep-dlg-kv">
            {o.lines.map(([k, v], i) => <div key={i}><span>{k}</span><b>{v}</b></div>)}
          </div></div>
        )}
        {o.next && <div className="dep-dlg-d" style={{ marginTop: 10 }}><Icon name="info" size={12} /> {o.next}</div>}
        <div className="dep-dlg-foot" style={o.onPrint ? undefined : { display: 'flex', justifyContent: 'center' }}>
          {o.onPrint && <button className="btn" onClick={() => { close(); o.onPrint(); }}><Icon name="print" size={14} /> {o.printLabel || 'พิมพ์ใบรายการ'}</button>}
          <button className="btn primary" onClick={close}>เสร็จสิ้น</button>
        </div>
      </div>
    </>
  );
};

// ─── popup แจ้งข้อผิดพลาด / เตือน (มาตรฐานกลาง) ─────────────────────
//  window.depAlert({ tone: 'danger'|'warn', title, desc, lines })
window.depAlert = function (opts) {
  const o = opts || {};
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(
    <DepStatusDialog tone={o.tone === 'warn' ? 'warn' : 'danger'} title={o.title || 'บันทึกข้อมูลไม่สำเร็จ'} desc={o.desc}
                     cancelLabel={null} okLabel="ตกลง" onOk={close} onClose={close}>
      {o.lines && o.lines.length > 0 && (
        <div className="dep-dlg-kv">{o.lines.map(([k, v], i) => <div key={i}><span>{k}</span><b>{v}</b></div>)}</div>
      )}
    </DepStatusDialog>
  );
};

function DepConfirmModal({ title, lines, okLabel, tint, tone, icon, onOk, onClose }) {
  const all = lines || [];
  // ยอดเงินหลักของรายการ — แยกเป็นบรรทัดท้าย ตัวใหญ่ ให้ตรวจก่อนยืนยัน
  const amtIdx = all.findIndex(([k, v]) => /บาท/.test(String(v)) && /เงิน|ยอด|จำนวน/.test(String(k)));
  const rest = all.filter((_, i) => i !== amtIdx);
  const amt = amtIdx >= 0 ? all[amtIdx] : null;
  return (
    <DepStatusDialog tone={tone || 'confirm'} icon={icon} title={title} desc="กรุณาตรวจสอบข้อมูลก่อนยืนยัน"
                     okLabel={okLabel || 'ยืนยัน'} onOk={onOk} onClose={onClose}>
      <div className="dep-dlg-kv">
        {rest.map(([k, v], i) => (
          <div key={i}><span>{k}</span><b>{v}</b></div>
        ))}
        {amt && (
          <div className={'dep-dlg-amt' + (tone === 'danger' ? ' danger' : '')}>
            <span>{amt[0]}</span><b className="mono">{amt[1]}</b>
          </div>
        )}
      </div>
      <div className="dep-dlg-note">การดำเนินการนี้จะถูกบันทึกใน Audit Trail</div>
    </DepStatusDialog>
  );
}
window.DepConfirmModal = DepConfirmModal;

function DepChangeConfirm({ title, subtitle, changes, okLabel, onOk, onClose, titleStyle, descStyle }) {
  const list = changes || [];
  const [all, setAll] = useState(false);
  const shown = all ? list : list.slice(0, 3);
  const rest = list.length - shown.length;
  const val = (v) => (v === '' || v == null ? '—' : String(v));
  return (
    <DepStatusDialog tone="confirm" title={title} desc={subtitle} titleStyle={titleStyle} descStyle={descStyle}
                     cancelLabel="กลับไปแก้ไข" okLabel={okLabel || 'ยืนยันบันทึก'} onOk={onOk} onClose={onClose}>
      {list.length === 0
        ? <div className="dep-dlg-none">ไม่มีค่าที่เปลี่ยนแปลง</div>
        : <ul className="dep-dlg-list">
            {shown.map((c, i) => (
              <li key={i}><span>{c.field}:</span> <b>{val(c.after)}</b></li>
            ))}
            {rest > 0 && (
              <li className="more"><button type="button" onClick={() => setAll(true)}>และอีก {rest} รายการ</button></li>
            )}
          </ul>}
    </DepStatusDialog>
  );
}
window.DepChangeConfirm = DepChangeConfirm;

function DepDiscardConfirm({ onKeep, onDiscard }) {
  return (
    <DepStatusDialog tone="warn" title="ทิ้งการแก้ไข?" desc="มีข้อมูลที่ยังไม่ได้บันทึก หากยกเลิก การเปลี่ยนแปลงล่าสุดจะไม่ถูกบันทึก"
                     cancelLabel="แก้ไขต่อ" okLabel="ละทิ้ง" onOk={onDiscard} onClose={onKeep} />
  );
}
window.DepDiscardConfirm = DepDiscardConfirm;

// เงื่อนไขล็อกบัญชีไม่เคลื่อนไหว — ตามค่าคงที่ประเภทเงินฝาก (แท็บข้อมูลหลัก)
window.depDormantRule = (typeCode) => {
  let rec = null;
  try { rec = (window.datLoad ? window.datLoad() : []).find(r => r.code === typeCode); } catch (e) {}
  const s = (rec && rec.settings) || {};
  const on = s.dormantLock !== false;
  const years = Number(s.dormantYears == null ? 2 : s.dormantYears) || 2;
  return { on, years, days: years * 365 };
};
// คำขออนุมัติถอนเงินเกินวงเงิน — หัวหน้าอนุมัติที่เมนู "อนุมัติทำรายการ"
window.DEP_WD_APV_LIMIT = 2000000;
window.dpcWdReqLoad = () => { try { return JSON.parse(localStorage.getItem('dep_wd_requests') || '[]'); } catch (e) { return []; } };
window.dpcWdReqSave = (l) => { try { localStorage.setItem('dep_wd_requests', JSON.stringify(l)); } catch (e) {} };
// คำขอปลดล็อกบัญชี — หัวหน้าอนุมัติที่เมนู "อนุมัติทำรายการ"
// ตัวอย่างคำขอปลดล็อกที่รออนุมัติ (เติมครั้งเดียว)
const DPC_UNLOCK_SEED = [
  { id: 'UL-2569-06-0031', accNo: '001-2-41027-5', name: 'ประภาพร ศรีสุข', member: '41027', lastMove: '2023-11-14', idleDays: 948,
    reason: 'สมาชิกยืนยันตัวตนพร้อมบัตรประชาชนที่เคาน์เตอร์ ต้องการถอนเงิน', reqBy: 'จันทร์เพ็ญ มาลี', reqTerm: 'POS-01 (เคาน์เตอร์ 1)',
    reqDate: '14/06/2569 09:48', date: 'seed', status: 'pending' },
  { id: 'UL-2569-06-0032', accNo: '002-5-36618-2', name: 'วิชัย เรืองศรี', member: '36618', lastMove: '2022-08-02', idleDays: 1416,
    reason: 'ทายาทยื่นเอกสารขอปิดบัญชี', reqBy: 'ปิยะพร ทองแท้', reqTerm: 'POS-02 (เคาน์เตอร์ 2)',
    reqDate: '14/06/2569 10:22', date: 'seed', status: 'pending' },
];
window.dpcUnlockReqLoad = () => {
  try {
    const s = localStorage.getItem('dep_unlock_requests');
    if (s) return JSON.parse(s);
    const seeded = DPC_UNLOCK_SEED.map(r => ({ ...r }));
    localStorage.setItem('dep_unlock_requests', JSON.stringify(seeded));
    return seeded;
  } catch (e) { return DPC_UNLOCK_SEED.map(r => ({ ...r })); }
};
window.dpcUnlockReqSave = (l) => { try { localStorage.setItem('dep_unlock_requests', JSON.stringify(l)); } catch (e) {} };

function DpcUnlockModal({ acc, lastMove, idleDays, onClose, onUnlock }) {
  const [reason, setReason] = useState('');
  const ok = reason.trim();
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 560, maxWidth: '94vw', padding: 0 }}>
        <div className="modal-head">
          <span className="modal-warnico"><Icon name="unlock" size={17} /></span>
          <div>
            <h2>ขอปลดล็อกบัญชีไม่เคลื่อนไหว</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ส่งคำขอให้หัวหน้าอนุมัติ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" size={14} /></button>
        </div>
        <div className="modal-body">
          <div className="dpc-unlock-acc">
            <div><span className="k">เลขที่บัญชี</span><span className="v mono">{acc.accNo}</span></div>
            <div><span className="k">ชื่อสมาชิก</span><span className="v">{acc.member} · {acc.name}</span></div>
            <div><span className="k">เคลื่อนไหวล่าสุด</span><span className="v mono" style={{ color: 'var(--danger)' }}>{fmt.date(lastMove)}</span></div>
            <div><span className="k">ไม่เคลื่อนไหว</span><span className="v mono" style={{ color: 'var(--danger)' }}>{Math.floor(idleDays / 365)} ปี {Math.floor((idleDays % 365) / 30)} เดือน</span></div>
          </div>
          <div className="dat-grid" style={{ padding: 0, marginTop: 14 }}>
            <DatFieldLite label="เหตุผลการปลดล็อก" span={2} required>
              <input className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น สมาชิกยืนยันตัวตนพร้อมบัตรประชาชนที่เคาน์เตอร์" />
            </DatFieldLite>
          </div>
          <div className="dat-warn" style={{ marginTop: 12 }}>
            <Icon name="info" size={14} />
            <span>คำขอจะส่งให้หัวหน้าอนุมัติที่เมนู <b>อนุมัติทำรายการ</b> — เมื่ออนุมัติแล้วจึงทำรายการได้ <b>ภายในวันทำการนี้</b> และบันทึกลง Audit Trail</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!ok} onClick={() => onUnlock({ reason: reason.trim() })}>
            <Icon name="unlock" /> ส่งคำขอปลดล็อก
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  กฎคำนวณจากค่าคงที่ประเภทเงินฝาก (ข้อ 1–6)
//  1 คงเหลือขั้นต่ำ · 2 เงินฝากมีระยะเวลา · 3 ค่าปรับก่อนกำหนด ·
//  4 ดอกเบี้ยถึงวันปิด · 5 ภาษี ณ ที่จ่าย · 6 ค่าปรับถอนเกินครั้ง / ค่าธรรมเนียมปิดบัญชี
//  ถ้าหาประเภทบัญชีในค่าคงที่ไม่เจอ → ใช้วิธีเดิม (กันหน้าพัง)
// ════════════════════════════════════════════════════════════════════
const DPC_TAX_DEF = { all: { m: 'fixed', r: 15 }, regular: { m: 'exempt', r: 0 }, associate: { m: 'exempt', r: 0 },
                      'ext-person': { m: 'fixed', r: 15 }, 'ext-juristic': { m: 'fixed', r: 1 } };
const DPC_REF_GROUP = { saving: 'saving', special: 'special', fixed: 'fixed' };
const dpcR2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const dpcDaysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const dpcUnitDays = (n, u) => { n = Number(n) || 0; return u === 'year' ? n * 365 : u === 'month' ? n * 30.4375 : n; };
const dpcAddMonths = (iso, n) => { const d = new Date(iso); d.setMonth(d.getMonth() + (Number(n) || 0)); return d.toISOString().slice(0, 10); };
const dpcMtNorm = (v) => (/^associate/.test(v || '') ? 'associate' : (DPC_TAX_DEF[v] ? v : 'all'));
function dpcTypeList() { try { return window.datLoad ? window.datLoad() : []; } catch (e) { return []; } }
function dpcIntTables() { try { return window.depIntTables ? window.depIntTables() : []; } catch (e) { return []; } }
// ประเภทสมาชิกของบัญชี (ใช้เลือกแถวอัตรา/ภาษีในแท็บอัตรา Int./Div.)
function dpcMemberType(cur) {
  if (cur.memberType) return dpcMtNorm(cur.memberType);
  const juristic = cur.ownerKind === 'juristic' || cur.openerType === 'juristic' || /^L\d/i.test(String(cur.member || ''));
  return juristic ? 'ext-juristic' : 'regular';
}
// ตารางอัตราที่ชื่อตรงกับประเภทเงินฝาก (เหมือนค่าตั้งต้นในแท็บอัตรา Int./Div.)
function dpcNameTable(rec, tables) {
  const live = tables.filter(x => x.enabled && (x.rows || []).length);
  const bare = (t) => t.name.replace(new RegExp('^' + t.code + '-'), '').trim();
  const recName = String(rec.name || '').replace(/^เงินฝาก/, '').trim();
  return live.find(t => bare(t) === recName)
    || live.filter(t => recName.includes(bare(t))).sort((x, y) => bare(y).length - bare(x).length)[0]
    || live.find(t => bare(t).includes(recName)) || live[0] || null;
}
// อัตราขั้นบันไดตามยอดเงิน ณ วันที่
function dpcTierRate(tb, bal, date, mt) {
  const rows = (tb.rows || []).filter(r => (!r.effectiveDate || r.effectiveDate <= date) && (!r.endDate || r.endDate >= date)
    && (!r.memberType || r.memberType === 'all' || dpcMtNorm(r.memberType) === mt));
  const hit = rows.filter(r => bal >= Number(r.balFrom || 0) && (r.balTo == null || r.balTo === '' || bal <= Number(r.balTo)))
    .sort((a, b) => Number(b.balFrom || 0) - Number(a.balFrom || 0))[0];
  return hit ? Number(hit.rate) : null;
}
// อัตราดอกเบี้ย + ฐานวัน + ภาษี ของประเภทบัญชี
function dpcRateOf(rec, cur, date, mt, tables) {
  const s = rec.settings || {};
  const rows = rec.rateTiers || [];
  const isNew = rows.some(r => r.rateTable);
  const row = isNew ? (rows.find(r => dpcMtNorm(r.memberType) === mt) || rows.find(r => dpcMtNorm(r.memberType) === 'all') || rows[0]) : null;
  // ตารางอัตราที่ปิดใช้งาน → ไม่ใช้ (ใช้อัตราของประเภทเงินฝากแทน — เหมือนหน้าเปิดบัญชี)
  const tb = isNew ? (tables.find(t => t.code === row.rateTable && t.enabled !== false) || null) : dpcNameTable(rec, tables);
  let rate = tb ? dpcTierRate(tb, cur.balance, date, mt) : null;
  let src = tb ? 'ตาราง ' + tb.code : '';
  if (rate == null && row && row.rate !== '' && row.rate != null) { rate = Number(row.rate); src = 'ประเภทเงินฝาก'; }
  if (rate == null && !isNew && rows.length) {
    const eff = rows.filter(r => !r.effectiveDate || r.effectiveDate <= date);
    const last = eff.reduce((m, r) => (r.effectiveDate || '') > m ? r.effectiveDate : m, '');
    const hit = eff.filter(r => (r.effectiveDate || '') === last && cur.balance >= Number(r.balFrom || 0))
      .sort((a, b) => Number(b.balFrom || 0) - Number(a.balFrom || 0))[0];
    if (hit) { rate = Number(hit.rate); src = 'ประเภทเงินฝาก'; }
  }
  if (rate == null) { rate = Number(cur.rate) || 0; src = 'บัญชี'; }
  if (s.intGiveOn === false) { rate = 0; src = 'ประเภทนี้ไม่ให้ดอกเบี้ย'; }
  const def = DPC_TAX_DEF[mt] || DPC_TAX_DEF.all;
  const tMode = row && row.taxMode ? (row.taxMode === 'wht' ? 'fixed' : row.taxMode) : def.m;
  const tRate = row && row.taxRate != null && row.taxRate !== '' ? Number(row.taxRate) : def.r;
  return { rate, src, dayBase: Number(row && row.dayBase) || 365, taxRate: tMode === 'exempt' ? 0 : tRate };
}
// ── อายัดบัญชี (จากหน้าอายัดบัญชี) — คำขอที่ยังรออนุมัติยังไม่มีผล (ใช้สถานะก่อนหน้า)
window.dpcFreezeInfo = function (accNo) {
  let m = {};
  try { m = JSON.parse(localStorage.getItem('dep_freezes') || '{}'); } catch (e) {}
  const e = m[accNo];
  if (!e) return { eff: null, pending: null, releasePending: false };
  const isPend = e.approveStatus === 'pending';
  return { eff: isPend ? (e.prev || null) : e, pending: isPend ? e : null, releasePending: !!e.releasePending };
};
window.dpcFreezeOf = (accNo) => window.dpcFreezeInfo(accNo).eff;
// ข้อจำกัดตามประเภทรายการอายัด — in: ห้ามรับเงินเข้า · out: ห้ามถอน/โอนออก · close: ห้ามปิดบัญชี · amt: วงเงินที่กันไว้
//  1 อายัดจำนวนเงิน · 2 อายัดการเคลื่อนไหว · 3 อายัดรอปิดบัญชี · 4 ห้ามถอน/ปิดบัญชี · 5 ห้ามฝากเงิน
window.dpcFreezeRule = function (frz, balance) {
  if (!frz) return { in: false, out: false, close: false, amt: 0 };
  const t = String(frz.type);
  return { in: ['2', '5'].includes(t), out: ['2', '3', '4'].includes(t), close: ['1', '2', '4'].includes(t),
           amt: t === '1' ? (Number(frz.amount) || Number(balance) || 0) : 0 };
};
window.dpcFreezeText = function (frz, balance) {
  const r = window.dpcFreezeRule(frz, balance);
  return [r.in && 'ห้ามฝาก', r.out && 'ห้ามถอน/โอนออก', r.close && 'ห้ามปิดบัญชี'].filter(Boolean).join(' / ');
};
// รหัสรายการของหน้าเคาน์เตอร์ — โอนระหว่างบัญชีไม่รวม "โอนชำระหนี้เงินกู้" และ "โอนซื้อหุ้น"
const dpcCounterCodes = (t) => {
  const l = (window.dpcCodesFor ? window.dpcCodesFor(t) : (window.DPC_TXN_CODES || {})[t]) || [];
  return t === 'transfer' ? l.filter(c => !/^(TRL|TRS)$/i.test(c.code || '') && !/ชำระหนี้|ซื้อหุ้น/.test(c.label || '')) : l;
};
// ธนาคาร / ประเภทเช็ค (+วันรอเรียกเก็บ) จากค่าคงที่ — ตารางเช็คแบบเดียวกับหน้าเปิดบัญชีเงินฝาก
const dpcConst = (k) => { try { return window.depConstList ? window.depConstList(k) : []; } catch (e) { return []; } };
const dpcChqBanks = () => {
  let l = dpcConst('bank').map(b => b.name).filter(Boolean);
  if (!l.length && window.depBankLoad) l = window.depBankLoad().filter(b => b.enabled !== false).map(b => b.name);
  return l.length ? l : (window.DEP_BANKS || []);
};
// จำนวนวันผ่านเช็ค (วันรอเรียกเก็บ) — ค่ากลางจาก ข้อกำหนดระบบเงินฝาก › เช็คและการรับฝาก–ถอน
window.depChqClearDays = () => { try { const c = window.depSysCfg ? window.depSysCfg() : {}; const n = Number(c.checkClearDays); return isFinite(n) && n >= 0 ? n : 1; } catch (e) { return 1; } };
// รวมกฎทั้งหมดของบัญชี ณ วันทำรายการ
window.dpcRules = function (cur, ctx) {
  const { type, date, amt, moves } = ctx;
  const list = dpcTypeList();
  const rec = list.find(r => r.code === cur.typeCode);
  if (!rec) return null;
  const s = rec.settings || {};
  const tables = dpcIntTables();
  const mt = dpcMemberType(cur);
  // 1) คงเหลือขั้นต่ำหลังถอน
  const minBal = Number(s.minBalance) || 0;
  // 2) เงินฝากมีระยะเวลา + วันครบกำหนด
  const isTerm = !!s.hasTerm;
  const startDate = (s.depAgeRef === 'open' ? cur.openDate : (cur.principalDate || cur.openDate)) || date;
  const maturity = cur.maturityDate || (isTerm && Number(s.termMonths) ? dpcAddMonths(startDate, s.termMonths) : null);
  const notMatured = isTerm && !!maturity && maturity > date;
  // แถวเงื่อนไขถอนก่อนกำหนด ตามอายุเงินฝากจริง
  const ageDays = Math.max(0, dpcDaysBetween(startDate, date));
  const ew = notMatured ? ((rec.earlyWithdraw || []).map(r => ({ ...r, _d: dpcUnitDays(r.ageLessThan, r.unit) }))
    .filter(r => r._d > 0 && ageDays < r._d).sort((a, b) => a._d - b._d)[0] || null) : null;
  // 4) อัตราดอกเบี้ย (+ อัตราอ้างอิงเมื่อถอนก่อนกำหนด)
  let ri = dpcRateOf(rec, cur, date, mt, tables);
  let intOn = true, intNote = '';
  if (notMatured && ew) {
    if (ew.intCond === 'none') { intOn = false; intNote = 'ถอนก่อนกำหนด อายุฝากน้อยกว่า ' + ew.ageLessThan + ' ' + (ew.unit === 'year' ? 'ปี' : ew.unit === 'day' ? 'วัน' : 'เดือน') + ' — ไม่ได้ดอกเบี้ย'; }
    else if (ew.rateType && ew.rateType !== '-') {
      const ref = list.find(r => r.settings && r.settings.depGroup === DPC_REF_GROUP[ew.rateType]);
      if (ref) { const rr = dpcRateOf(ref, cur, date, mt, tables); ri = { ...ri, rate: rr.rate, src: 'อัตรา' + ref.name + ' (ถอนก่อนกำหนด)' }; }
    }
  } else if (notMatured && s.earlyWithdrawIntOn === false) { intOn = false; intNote = 'ถอนก่อนกำหนด — ไม่ได้ดอกเบี้ย'; }
  // อัตราพิเศษตามโครงการประเภทเงินฝาก — บวกเพิ่มเมื่อบัญชีเปิดในโครงการที่มีอัตราพิเศษ (ยกเว้นถอนก่อนกำหนด)
  const bonus = cur.projectCode && Number(cur.rateBonus) > 0 && s.intGiveOn !== false && !(notMatured && ew) ? Number(cur.rateBonus) : 0;
  if (bonus) ri = { ...ri, rate: ri.rate + bonus, src: ri.src + ' + โครงการ ' + (cur.projectName || cur.projectCode) };
  // 5) ภาษี ณ ที่จ่าย
  let taxRate = notMatured && ew ? (ew.tax ? Number(ew.taxRate == null || ew.taxRate === '' ? 15 : ew.taxRate) : 0) : ri.taxRate;
  if (cur.taxMode === 'exempt') taxRate = 0;            // ยกเว้นภาษีเฉพาะบัญชี
  else if (cur.taxMode === 'fixed') taxRate = 15;       // ค่าเดิม — อัตราคงที่ 15%
  // 3) ค่าปรับถอน/ปิดก่อนกำหนด
  const penaltyOn = notMatured && (ew ? !!ew.penalty : !!s.earlyCloseePenaltyOn);
  const penPct = Number(s.earlyPenaltyRate) || Number(s.earlyClosePercent) || 0;
  const penAmt = Number(s.earlyPenaltyAmount) || 0;
  const penBase = type === 'close' ? cur.balance : amt;
  const penalty = penaltyOn && (type === 'withdraw' || type === 'close') ? dpcR2(penPct > 0 ? penBase * penPct / 100 : penAmt) : 0;
  const penText = penaltyOn ? (penPct > 0 ? fmt.money(penPct, 2) + '% ของยอด' : fmt.money(penAmt, 2) + ' บาท') : '';
  // 6) ค่าปรับถอนเกินจำนวนครั้ง
  let overFee = 0, wdUsed = null, wdMax = 0;
  if (type === 'withdraw' && s.wdCountLimit && Number(s.wdCountMax) > 0) {
    wdMax = Number(s.wdCountMax);
    const within = Number(s.wdCountWithin) || 1, unit = s.wdCountWithinUnit || 'month';
    const skip = new Set(s.nonCountTxns || []);
    const codeOf = (m) => (String(m.label || '').match(/^([A-Z]{2,4})\s/) || [])[1] || m.code;
    const inWin = (d) => {
      if (!d || d > date) return false;
      if (within === 1 && unit === 'month') return d.slice(0, 7) === date.slice(0, 7);
      if (within === 1 && unit === 'year') return d.slice(0, 4) === date.slice(0, 4);
      return dpcDaysBetween(d, date) < dpcUnitDays(within, unit);
    };
    wdUsed = (moves || []).filter(m => m.dc === '−' && inWin(m.date)).map(codeOf)
      .filter(c => !skip.has(c) && !/^(TR|CL)/.test(String(c))).length;
    if (s.overWdPenaltyOn && amt > 0 && wdUsed >= wdMax) {
      const base = s.overWdBase === 'balance' ? cur.balance : amt;
      const cond = Number(s.overWdRangeCond) || 0;
      if (!(cond > 0 && base > cond)) overFee = dpcR2(Math.max(base * (Number(s.overWdPercent) || 0) / 100, Number(s.overWdMinFee) || 0));
    }
  }
  // 6) ค่าธรรมเนียมปิดบัญชี
  const closeFee = type === 'close' && s.closeFeeOn ? dpcR2(s.closeFee) : 0;
  return { rec, bonus, minBal, isTerm, maturity, notMatured, ew, rate: ri.rate, rateSrc: ri.src, dayBase: ri.dayBase,
    intOn, intNote, taxRate, penalty, penaltyOn, penText, overFee, wdUsed, wdMax, closeFee };
};

function DepCounterPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts, setAccounts] = useState(window.depTxnLoadAccounts);
  const [ledger, setLedger] = useState(window.depTxnLoadLedger);
  const [unlocks, setUnlocks] = useState(window.dpcUnlocksLoad);

  const [type, setType] = useState('deposit');
  const [code, setCode] = useState('DCA');
  const [date, setDate] = useState(window.dpcToday());
  const [acc, setAcc] = useState(null);
  const [dst, setDst] = useState(null);
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [channel, setChannel] = useState('book');
  const [bookBal, setBookBal] = useState('');
  const [ref, setRef] = useState('');
  const [srcBank, setSrcBank] = useState('');
  const [bankAcc, setBankAcc] = useState('');
  const [reason, setReason] = useState('');
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [slip, setSlip] = useState(null);
  const [printSlip, setPrintSlip] = useState(true);
  const dpcPrinters = window.DEP_PRINTERS_LIST || [];
  const [printer, setPrinter] = useState(() => { try { return localStorage.getItem('dep_counter_printer') || dpcPrinters[0] || ''; } catch (e) { return dpcPrinters[0] || ''; } });
  const pickPrinter = (v) => { setPrinter(v); try { localStorage.setItem('dep_counter_printer', v); } catch (e) {} };
  const [aml, setAml] = useState(false);
  const [condText, setCondText] = useState('');
  const [wdPicked, setWdPicked] = useState([]);    // ชื่อที่ติ๊กจากเงื่อนไข
  const [wdManual, setWdManual] = useState([]);    // [{ id, name, cid }] เพิ่มเอง
  const [wdOk, setWdOk] = useState(false);          // ยืนยันเงื่อนไข + ผู้มาถอนถูกต้อง → ล็อก
  const [wdEditCond, setWdEditCond] = useState(false); // เปิดแก้ข้อความเงื่อนไข (เฉพาะรายการนี้)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chqRows, setChqRows] = useState([]);

  const codes = dpcCounterCodes(type);
  const cd = codes.find(c => c.code === code) || codes[0];
  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const curDst = dst ? accounts.find(a => a.accNo === dst.accNo) || dst : null;
  const accType = cur ? (window.DEP_ACCTYPE_SEED || []).find(t => t.code === cur.typeCode) : null;
  const condOriginal = React.useMemo(() => {
    if (!cur) return '';
    // เงื่อนไขการถอนที่บันทึกตอนเปิดบัญชี + ผู้ฝากร่วม
    const saved = cur.withdrawCond || cur.withdrawCondText;
    const jn = (cur.joints || []).filter(j => j && (j.name || j.ref)).map(j => (j.ref ? j.ref + ' ' : '') + (j.name || ''));
    if (saved) return jn.length && !jn.every(n => saved.includes(n.trim())) ? saved + '\nผู้ฝากร่วม: ' + jn.join(', ') : saved;
    if (jn.length) return [cur.name, 'ผู้ฝากร่วม: ' + jn.join(', ')].join('\n');
    const m = (window.MEMBERS_LIST || []).find(x => x.code === cur.member);
    const ph = cur.contactPhone || (m && (m.mobile || m.phone)) || '';
    return [cur.name, ph ? 'โทร ' + ph : ''].filter(Boolean).join(' · ');
  }, [cur && cur.accNo]);
  React.useEffect(() => { setCondText(condOriginal); }, [condOriginal]);
  const amtNum = Number(amount) || 0;
  const feeNum = Number(fee) || 0;
  // ฝาก/ถอนตั้งแต่ 2,000,000 บาท — ต้องรายงาน ปปง. (ติ๊กให้อัตโนมัติ และเอาออกไม่ได้)
  const AML_LIMIT = 2000000;
  const amlForced = (type === 'deposit' || type === 'withdraw') && amtNum >= AML_LIMIT;
  React.useEffect(() => { if (amlForced) setAml(true); }, [amlForced]);

  const moves = cur ? window.dpcMoves(cur.accNo, ledger) : [];
  const lastMove = cur ? window.dpcLastMove(cur.accNo, ledger) : null;
  const idleDays = cur ? window.dpcIdleDays(lastMove) : 0;
  const dRule = cur ? window.depDormantRule(cur.typeCode) : { on: false, years: 2, days: 730 };
  const dormant = cur && dRule.on && idleDays > dRule.days;
  const unlock = cur ? unlocks[cur.accNo] : null;
  const unlockedToday = unlock && unlock.date === window.dpcToday();
  const locked = dormant && !unlockedToday;

  // ── คำนวณตามประเภทรายการ ──
  // กฎจากค่าคงที่ประเภทเงินฝาก (ไม่พบประเภท → ใช้วิธีเดิม)
  const rule = cur ? window.dpcRules(cur, { type, date, amt: amtNum, moves }) : null;
  const minBal = rule ? rule.minBal : (accType?.cond?.minBalance || 0);
  const isFixed = rule ? rule.isTerm : !!(cur && window.depIsFixedType(cur.typeCode));
  const maturityDate = rule ? rule.maturity : (cur && cur.maturityDate);
  const notMatured = rule ? rule.notMatured : !!(cur && isFixed && cur.maturityDate && cur.maturityDate > date);
  const frzInfo = cur ? window.dpcFreezeInfo(cur.accNo) : { eff: null, pending: null, releasePending: false };
  const frz = frzInfo.eff;
  const frzR = window.dpcFreezeRule(frz, cur ? cur.balance : 0);
  const withdrawable = cur ? (frzR.out ? 0 : Math.max(0, cur.balance - minBal - frzR.amt)) : 0;
  const intRate = rule ? rule.rate : (cur ? Number(cur.rate) || 0 : 0);
  const dayBase = rule ? rule.dayBase : 365;
  const accrued = useMemo(() => {
    if (!cur || (rule && !rule.intOn)) return 0;
    const d = new Date(date), y0 = new Date(d.getFullYear(), 0, 1);
    const days = Math.max(0, Math.round((d - y0) / 86400000));
    return Math.round(cur.balance * (intRate / 100) * days / dayBase * 100) / 100;
  }, [cur, date, intRate, dayBase, rule && rule.intOn]);
  const intAccum = cur ? Math.round((cur.accrued || 0) * 100) / 100 : 0;
  const intTotal = Math.round((intAccum + accrued) * 100) / 100;
  const taxRate = rule ? rule.taxRate : (isFixed ? 15 : 0);
  const wht = type === 'close' && taxRate > 0 ? Math.round(accrued * taxRate / 100 * 100) / 100 : 0;
  const penalty = rule ? rule.penalty : ((type === 'withdraw' || type === 'close') && notMatured ? Math.round((type === 'close' ? cur.balance : amtNum) * 0.005 * 100) / 100 : 0);
  const penText = rule ? rule.penText : '0.50% ของยอด';
  // ค่าปรับถอนเกินครั้ง + ค่าธรรมเนียมปิดบัญชี (คิดอัตโนมัติจากค่าคงที่ — แยกจากช่องค่าธรรมเนียมที่กรอกเอง)
  const overFee = rule ? rule.overFee : 0;
  const closeFee = rule ? rule.closeFee : 0;
  const sysFee = overFee + closeFee;

  const net = !cur ? 0
    : type === 'deposit' ? amtNum - feeNum
    : type === 'close' ? cur.balance + accrued - wht - penalty - feeNum - sysFee
    : -(amtNum + feeNum + penalty + sysFee);
  const newBal = !cur ? 0 : type === 'close' ? 0 : cur.balance + (type === 'deposit' ? amtNum - feeNum : -(amtNum + feeNum + penalty + sysFee));

  // ── ผู้มาถอน (บัญชีนิติบุคคล) ──
  const isJuristic = !!cur && (cur.ownerKind === 'juristic' || cur.openerType === 'juristic' || /^L\d/i.test(String(cur.member || '')));
  const isOutflow = type !== 'deposit';
  const needWd = isJuristic && isOutflow;
  // ดึงรายชื่อจากเงื่อนไขการถอน — รองรับทั้ง 1 ชื่อต่อบรรทัด, คั่นด้วย , / และ, มีหรือไม่มีคำนำหน้า
  const WD_RULE = /(ใน|คน|ลงนาม|ลายมือ|ถอน|ต้อง|เงื่อนไข|ร่วมกัน|อย่างน้อย|ทุกคน|ผู้มีอำนาจ|บริษัท|ห้าง|จำกัด|มูลนิธิ|สมาคม)/;
  const wdCandidates = React.useMemo(() => {
    const seen = new Set();
    const txt = String(condText || '');
    // 1) ชื่อที่มีคำนำหน้า — หาได้ทุกตำแหน่งในข้อความ แม้ไม่มีตัวคั่น หรืออยู่กลางประโยค
    const TITLE = '(?:นางสาว|นาง|นาย|น\\.ส\\.|ดร\\.|คุณ|ว่าที่\\s*ร\\.ต\\.|Mr\\.?|Mrs\\.?|Ms\\.?)';
    const re = new RegExp(TITLE + '\\s*[ก-๙A-Za-z.]+(?:\\s+(?!' + TITLE + ')[ก-๙A-Za-z.]+)?', 'g');
    const titled = (txt.match(re) || []).map(s => s.replace(/\s+/g, ' ').trim());
    // 2) ชื่อไม่มีคำนำหน้า — แยกตามบรรทัด / ตัวคั่น
    const plain = txt
      .split(/\n+|,|，|;|:|：|\/|\||、|\s+และ\s*|\s+หรือ\s+/)
      .map(s => s.trim()
        .replace(/^((คนที่|ลำดับที่)\s*[0-9๐-๙]+\s*[.)]?|[0-9๐-๙]+[.)]|[-•*·])\s*/, '')
        .replace(/\s*(·|\(|โทร|เบอร์|ตำแหน่ง|[0-9๐-๙]{3,}).*$/, '')
        .replace(/[\s:：-]+$/, '').trim())
      .filter(s => {
        if (!s) return false;
        if (/^(นาย|นาง|นางสาว|น\.ส\.|ดร\.|Mr\.?|Mrs\.?|Ms\.?)\s*\S/.test(s)) return true;
        // ไม่มีคำนำหน้า: ต้องเป็นชื่อ–นามสกุล 2–3 คำ และไม่ใช่ประโยคกฎ
        const words = s.split(/\s+/);
        return words.length >= 2 && words.length <= 3 && !WD_RULE.test(s) && /[ก-๙A-Za-z]/.test(s);
      })
      ;
    return [...titled, ...plain]
      .filter(s => !titled.some(t => t !== s && (t.includes(s) || s.includes(t))) || titled.includes(s))
      .filter(s => (seen.has(s) ? false : (seen.add(s), true)));
  }, [condText]);
  const wdRuleLines = React.useMemo(() => String(condText || '').split(/\n+/).map(s => s.trim()).filter(Boolean)
    .filter(s => WD_RULE.test(s) && !wdCandidates.some(n => s.replace(/^([0-9๐-๙]+[.)]|[-•*·])\s*/, '').startsWith(n))), [condText, wdCandidates]);
  const wdMin = React.useMemo(() => {
    const m = String(condText || '').match(/([0-9๐-๙]+)\s*(?:คน)?\s*ใน\s*([0-9๐-๙]+)/);
    const th = (x) => Number(String(x).replace(/[๐-๙]/g, d => '๐๑๒๓๔๕๖๗๘๙'.indexOf(d)));
    return m ? th(m[1]) : 1;
  }, [condText]);
  const wdCount = wdPicked.filter(n => wdCandidates.includes(n)).length + wdManual.filter(m => m.name.trim()).length;
  React.useEffect(() => { setWdPicked([]); setWdManual([]); setWdOk(false); setWdEditCond(false); }, [cur && cur.accNo]);
  const wdLock = locked || wdOk;
  const wdNames = [condText.trim()];

  const errors = [];
  if (needWd && !condText.trim()) errors.push('บัญชีนิติบุคคล — ระบุผู้มาถอน');
  if (needWd && condText.trim() && !wdOk) errors.push('บัญชีนิติบุคคล — กรุณาตรวจสอบรายชื่อและกด “ยืนยันผู้มาถอน” ก่อนบันทึก');
  if (cur && locked) errors.push('บัญชีถูกล็อกจากการไม่เคลื่อนไหวเกิน ' + dRule.years + ' ปี — ต้องปลดล็อกก่อนทำรายการ');
  if (cur && cur.status !== 'active') errors.push('บัญชีนี้ปิดแล้ว ไม่สามารถทำรายการได้');
  if (type !== 'close' && cur && amtNum <= 0) errors.push('ระบุยอดทำรายการ');
  if ((type === 'withdraw' || type === 'transfer') && cur && amtNum + feeNum + penalty + sysFee > cur.balance) errors.push('ยอดทำรายการเกินยอดคงเหลือ');
  if (type === 'withdraw' && cur && amtNum > 0 && newBal < minBal) errors.push(`ถอนแล้วคงเหลือต่ำกว่าขั้นต่ำ ${fmt.money(minBal, 0)} บาท`);
  if (type === 'transfer' && !curDst) errors.push('เลือกบัญชีปลายทาง');
  if (type === 'transfer' && curDst && cur && curDst.accNo === cur.accNo) errors.push('บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน');
  if (cur && frz) {
    const fl = 'บัญชีถูกอายัด — ' + frz.label + (frz.reason ? ' (' + frz.reason + ')' : '');
    if (type === 'deposit' && frzR.in) errors.push(fl + ' · ห้ามรับฝาก');
    if ((type === 'withdraw' || type === 'transfer') && frzR.out) errors.push(fl + ' · ห้ามถอน/โอนออก');
    if (type === 'close' && frzR.close) errors.push(fl + ' · ห้ามปิดบัญชี');
    if ((type === 'withdraw' || type === 'transfer') && !frzR.out && frzR.amt > 0 && amtNum + feeNum + penalty + sysFee > cur.balance - frzR.amt)
      errors.push('ยอดทำรายการเกินยอดที่ไม่ถูกอายัด (อายัดไว้ ' + fmt.money(frzR.amt, 2) + ' บาท)');
  }
  if (type === 'transfer' && curDst) {
    const f2 = window.dpcFreezeOf(curDst.accNo);
    if (f2 && window.dpcFreezeRule(f2).in) errors.push('บัญชีปลายทางถูกอายัด — ' + f2.label + ' · ห้ามรับเงินเข้า');
  }
  if (type === 'close' && !reason.trim()) errors.push('ระบุเหตุผลการปิดบัญชี');
  if (cd.needRef && !ref.trim()) errors.push('ระบุเลขที่อ้างอิงรายการ');
  const canSubmit = cur && errors.length === 0;
  // ถอนตั้งแต่ 2,000,000 บาทขึ้นไป (ทุกบัญชี) — ต้องให้หัวหน้าอนุมัติก่อนบันทึก
  const needWdApv = type === 'withdraw' && amtNum >= window.DEP_WD_APV_LIMIT;
  const [, setWdTick] = useState(0);
  const wdReq = (cur && needWdApv) ? window.dpcWdReqLoad().filter(r => r.accNo === cur.accNo && r.date === window.dpcToday() && Number(r.amount) === amtNum && r.code === code).slice(-1)[0] : null;
  const wdPending = wdReq && wdReq.status === 'pending';
  const wdApproved = wdReq && wdReq.status === 'approved';
  const wdRejected = wdReq && wdReq.status === 'rejected';
  React.useEffect(() => {
    if (!wdPending) return;
    const t = setInterval(() => setWdTick(x => x + 1), 2000);
    return () => clearInterval(t);
  }, [wdPending]);
  const sendWdApv = () => {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const req = { id: 'WA-' + Date.now(), accNo: cur.accNo, name: cur.name, amount: amtNum, code, codeLabel: cd.label, money: cd.money,
      reqBy: DEPC_TELLER, reqTerm: window.DEP_DAILY_TERMINAL || 'POS-01',
      reqDate: p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()),
      date: window.dpcToday(), status: 'pending' };
    window.dpcWdReqSave([...window.dpcWdReqLoad(), req]);
    setWdTick(x => x + 1);
    audit.log({ action: 'create', module: 'เงินฝาก — ขออนุมัติถอนเงินเกินวงเงิน', target: cur.accNo + ' · ' + cur.name,
      summary: 'ส่งคำขออนุมัติถอน ' + fmt.money(amtNum, 2) + ' บาท (ตั้งแต่ ' + fmt.money(window.DEP_WD_APV_LIMIT, 0) + ' บาทขึ้นไป)' });
    window.depSuccess ? window.depSuccess({ title: 'ส่งคำขออนุมัติแล้ว', desc: 'รอหัวหน้าอนุมัติที่เมนู “อนุมัติทำรายการ”',
      lines: [['เลขที่บัญชี', cur.accNo], ['ยอดถอน', fmt.money(amtNum, 2) + ' บาท'], ['เลขที่คำขอ', req.id]] })
      : (onToast && onToast('ส่งคำขออนุมัติถอนแล้ว'));
  };
  const crossMember = type === 'transfer' && cur && curDst && cur.member !== curDst.member;

  const isCheque = cd.money === 'CHQ' || !!cd.clearing;
  const chqTotal = chqRows.reduce((a, r) => a + (parseFloat(r.amount) || 0), 0);
  const addChq = () => {
    setChqRows(rs => [...rs, { id: Date.now() + Math.random(), no: '', bank: srcBank || '', branch: '', date: date, type: '', float: window.depChqClearDays(), amount: '', late: false }]); };
  const setChq = (id, k, v) => setChqRows(rs => rs.map(r => r.id === id ? { ...r, [k]: v } : r));
  const delChq = (id) => setChqRows(rs => rs.filter(r => r.id !== id));
  React.useEffect(() => { if (!isCheque) setChqRows([]); }, [isCheque, code]);

  React.useEffect(() => {
    if (!slip) return;
    // บันทึกแล้วแจ้งผลด้วยแถบข้อความสั้น (ไม่ขึ้น popup ซ้ำ) — พิมพ์ส่งเครื่องที่เลือกโดยตรง
    onToast && onToast('บันทึก' + slip.title + ' เรียบร้อยแล้ว' + (printSlip ? ' · ส่งพิมพ์ที่ ' + String(printer).replace(/\s*\(.*$/, '') : ''));
  }, [slip]);

  const pickType = (t) => {
    // ค่าเริ่มต้น = รายการเงินสดของประเภทนั้น (ไม่มี → รายการแรก)
    const cl = dpcCounterCodes(t);
    setType(t); setCode((cl.find(c => c.money === 'CSH') || cl[0] || {}).code);
    setAmount(''); setFee(''); setRef(''); setSrcBank(''); setBankAcc(''); setReason(''); setDst(null); setSlip(null);
  };
  const reset = () => { setAmount(''); setFee(''); setRef(''); setSrcBank(''); setBankAcc(''); setReason(''); setBookBal(''); setDst(null);
    setWdPicked([]); setWdManual([]); setWdOk(false); setWdEditCond(false); setCondText(condOriginal); };

  const [, setReqTick] = useState(0);
  const unlockReq = cur ? window.dpcUnlockReqLoad().filter(r => r.accNo === cur.accNo && r.date === window.dpcToday()).slice(-1)[0] : null;
  const reqPending = unlockReq && unlockReq.status === 'pending';
  const reqRejected = unlockReq && unlockReq.status === 'rejected';
  React.useEffect(() => {
    // ตรวจผลอนุมัติจากหัวหน้าเป็นระยะ (หน้าอนุมัติอยู่คนละหน้า)
    if (!reqPending) return;
    const t = setInterval(() => { setUnlocks(window.dpcUnlocksLoad ? window.dpcUnlocksLoad() : unlocks); setReqTick(x => x + 1); }, 2000);
    return () => clearInterval(t);
  }, [reqPending]);
  const doUnlock = (info) => {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const req = { id: 'UL-' + Date.now(), accNo: cur.accNo, name: cur.name, member: cur.member, lastMove,
      idleDays, reason: info.reason, reqBy: DEPC_TELLER, reqTerm: window.DEP_DAILY_TERMINAL || 'POS-01',
      reqDate: p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()),
      date: window.dpcToday(), status: 'pending' };
    window.dpcUnlockReqSave([...window.dpcUnlockReqLoad(), req]);
    setUnlockOpen(false); setReqTick(x => x + 1);
    audit.log({ action: 'create', module: 'เงินฝาก — ขอปลดล็อกบัญชีไม่เคลื่อนไหว', target: `${cur.accNo} · ${cur.name}`,
      summary: `ส่งคำขอปลดล็อกบัญชีไม่เคลื่อนไหว ${Math.floor(idleDays / 365)} ปี`,
      changes: [{ field: 'เหตุผล', before: '—', after: info.reason }] });
    window.depSuccess ? window.depSuccess({ title: 'ส่งคำขอปลดล็อกแล้ว', desc: 'รอหัวหน้าอนุมัติที่เมนู “อนุมัติทำรายการ”', lines: [['เลขที่บัญชี', cur.accNo], ['เลขที่คำขอ', req.id]] })
      : (onToast && onToast('ส่งคำขอปลดล็อกบัญชี ' + cur.accNo + ' แล้ว'));
  };

  const submit = () => {
    if (wdApproved) window.dpcWdReqSave(window.dpcWdReqLoad().map(r => r.id === wdReq.id ? { ...r, status: 'posted' } : r));
    let nextAcc, entries = [];
    const txId = window.depTxnNextId();
    if (type === 'close') {
      nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, status: 'closed', balance: 0 } : a);
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type: 'withdraw', channel: `${cd.code} ${cd.label}`, amount: net, fee: feeNum, sysFee, penalty, interest: accrued, wht, balance: 0, ref: ref.trim() || 'CLOSE', by: DEPC_TELLER });
    } else if (type === 'transfer') {
      const srcNew = cur.balance - amtNum - feeNum, dstNew = curDst.balance + amtNum;
      nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: srcNew } : a.accNo === curDst.accNo ? { ...a, balance: dstNew } : a);
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type: 'transfer-out', channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: feeNum, balance: srcNew, ref: curDst.accNo, by: DEPC_TELLER });
      entries.push({ id: window.depTxnNextId(), date, accNo: curDst.accNo, member: curDst.member, type: 'transfer-in', channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: 0, balance: dstNew, ref: cur.accNo, by: DEPC_TELLER });
    } else {
      nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: newBal, freeUsed: type === 'withdraw' ? (a.freeUsed || 0) + 1 : a.freeUsed } : a);
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type, channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: feeNum, sysFee, penalty, balance: newBal, ref: ref.trim() || cd.code, srcBank, by: DEPC_TELLER });
    }
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
    if (type === 'deposit' && isCheque && window.depChqRegAdd) {
      window.depChqRegAdd(chqRows.filter(r => (parseFloat(r.amount) || 0) > 0).map(r => ({ chqNo: r.no, bank: r.bank, branch: r.branch,
        type: r.type || '', floatDays: Number(r.float) || 0, late: !!r.late, faceDate: r.date || date, sendDate: date,
        amount: parseFloat(r.amount) || 0, accNo: cur.accNo, accName: cur.name, src: 'ฝาก / ถอน / โอน / ปิดบัญชี', by: DEPC_TELLER })));
    }
    const nextL = [...entries, ...ledger];
    setLedger(nextL); window.depTxnSaveLedger(nextL);

    const tLabel = window.DPC_TXN_TYPES.find(t => t.id === type).label;
    audit.log({ action: type === 'close' ? 'update' : 'create', module: 'เงินฝาก — ธุรกรรมเคาน์เตอร์', target: `${cur.accNo} · ${cur.name}`,
      summary: `${tLabel} ${cd.code} ${cd.label} ${fmt.money(type === 'close' ? net : amtNum, 2)} บาท` + (unlockedToday ? ` · บัญชีปลดล็อกโดย ${unlock.by}` : ''),
      changes: [{ field: 'ยอดคงเหลือ', before: fmt.money(cur.balance, 2), after: fmt.money(type === 'close' ? 0 : newBal, 2) },
                ...(needWd ? [{ field: 'ผู้มาถอน', before: condOriginal || '—', after: condText.trim() }] : [])] });

    setSlip({
      title: type === 'deposit' ? 'ใบรับฝากเงิน' : type === 'withdraw' ? 'ใบถอนเงิน' : type === 'transfer' ? 'ใบโอนเงินระหว่างบัญชี' : 'ใบปิดบัญชีเงินฝาก',
      sub: `เลขที่รายการ ${txId} · ${fmt.date(date)} · รหัส ${cd.code}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อสมาชิก', v: `${cur.member} · ${cur.name}` },
        { k: 'ประเภทบัญชี', v: cur.type },
        { k: 'ประเภทรายการ', v: `${tLabel} — ${cd.code} ${cd.label}` },
        ...(needWd ? [{ k: 'ผู้มาถอน', v: condText.trim() }] : []),
        ...(type === 'transfer' ? [{ k: 'บัญชีปลายทาง', v: `${curDst.accNo} · ${curDst.name}`, mono: true }] : []),
        ...(ref.trim() ? [{ k: 'อ้างอิงรายการ', v: ref.trim(), mono: true }] : []),
        ...(srcBank ? [{ k: 'ธนาคาร', v: srcBank }] : []),
        ...(type === 'close' ? [{ k: 'ยอดคงเหลือ', v: fmt.money(cur.balance, 2), mono: true }, { k: 'ดอกเบี้ยถึงวันปิด', v: fmt.money(accrued, 2), mono: true }] : []),
        ...(wht ? [{ k: 'ภาษีหัก ณ ที่จ่าย (' + fmt.money(taxRate, 2).replace(/\.00$/, '') + '%)', v: '− ' + fmt.money(wht, 2), mono: true }] : []),
        ...(penalty ? [{ k: 'ค่าปรับก่อนครบกำหนด', v: '− ' + fmt.money(penalty, 2), mono: true }] : []),
        ...(overFee ? [{ k: 'ค่าปรับถอนเกินจำนวนครั้ง', v: '− ' + fmt.money(overFee, 2), mono: true }] : []),
        ...(closeFee ? [{ k: 'ค่าธรรมเนียมปิดบัญชี', v: '− ' + fmt.money(closeFee, 2), mono: true }] : []),
        ...(feeNum ? [{ k: 'ค่าธรรมเนียม', v: '− ' + fmt.money(feeNum, 2), mono: true }] : []),
        { k: type === 'close' ? 'ยอดจ่ายสุทธิ' : 'ยอดทำรายการ', v: fmt.money(Math.abs(type === 'close' ? net : amtNum), 2) + ' บาท', mono: true, strong: true },
        { k: 'ยอดคงเหลือใหม่', v: fmt.money(type === 'close' ? 0 : newBal, 2) + ' บาท', mono: true, strong: true },
        ...(unlockedToday ? [{ k: 'ปลดล็อกบัญชีโดย', v: `${unlock.by} (${unlock.role})` }] : []),
        { k: 'ผู้ทำรายการ', v: DEPC_TELLER },
      ],
      foot: 'ส่งข้อมูลเข้าระบบบัญชีอัตโนมัติ · รหัสคู่บัญชี ' + cd.pair,
    });
    onToast && onToast(`${tLabel} ${fmt.money(Math.abs(type === 'close' ? net : amtNum), 2)} บาท บัญชี ${cur.accNo} เรียบร้อยแล้ว`);
    if (type === 'close') setAcc(null); else reset();
  };

  const TYPE_TINTS = { deposit: 'var(--brand, #237450)', withdraw: '#c0392b', transfer: '#1677ff', close: '#8c6d1f' };
  const typeTint = TYPE_TINTS[type] || '#237450';
  const typeTintBright = { deposit: '#3ddc84', withdraw: '#ff7875', transfer: '#69b1ff', close: '#ffd666' }[type] || '#3ddc84';
  const typeLabel = (window.DPC_TXN_TYPES.find(t => t.id === type) || {}).label || '';
  const tintBg = `color-mix(in srgb, ${typeTint} 8%, #fff)`;
  const tintBd = `color-mix(in srgb, ${typeTint} 32%, #fff)`;
  const lblTint = { background: tintBg, color: typeTint, borderColor: tintBd, fontWeight: 600 };
  const thaiDate = (iso) => { if (!iso) return '—'; const [y, m, d] = String(iso).split('-'); return `${d}/${m}/${Number(y) + 543}`; };

  const confirmEl = confirmOpen && cur && (
    <DepConfirmModal title={'ยืนยันการ' + typeLabel.replace(/\s*\(.*\)$/, '')} tint={typeTint}
      tone={type === 'withdraw' || type === 'close' ? 'danger' : undefined}
      okLabel={'ยืนยัน' + typeLabel.replace(/\s*\(.*\)$/, '')}
      lines={[
        ['เลขที่บัญชี', cur.accNo],
        ['ชื่อบัญชี', cur.name],
        ['รหัสรายการ', cd.code + ' · ' + cd.label],
        ['ยอดสุทธิ', fmt.money(type === 'close' ? net : Math.abs(net), 2) + ' บาท'],
      ]}
      onClose={() => setConfirmOpen(false)}
      onOk={() => { setConfirmOpen(false); submit(); }} />
  );

  // ต้องตรวจรับเงินเข้าเคาน์เตอร์ก่อน จึงจะทำรายการได้
  const readyCounters = (window.depCtReadyCounters ? window.depCtReadyCounters() : []);
  if (readyCounters.length === 0) {
    const openCt = window.DEP_COUNTERS ? window.DEP_COUNTERS.length : 0;
    return (
      <div data-screen-label="ธุรกรรมเคาน์เตอร์เงินฝาก">
        <div className="page-actions">
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ฝาก / ถอน / โอนระหว่างบัญชี / ปิดบัญชี</h1>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ทำรายการได้เมื่อเคาน์เตอร์ของคุณรับเงินจากหัวหน้าเรียบร้อยแล้ว</div>
          </div>
        </div>
        <div className="search-card">
          <div style={{ padding: '40px 24px', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
            <div className="gc-modal-ico" style={{ margin: '0 auto 14px' }}><Icon name="wallet" size={20} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>ยังไม่ได้รับเงินเข้าเคาน์เตอร์</div>
            <div className="muted" style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>
              ก่อนเริ่มรับ–จ่ายเงินสด ต้องกด “ขอเบิกเงิน” ที่เมนู <b>เปิดเคาน์เตอร์</b> ให้หัวหน้าอนุมัติ แล้วนับเงินและกด “ยืนยันรับเงิน”
              เมื่อยืนยันรับเงินแล้ว เครื่องจะเปลี่ยนเป็น “พร้อมทำรายการ” และหน้านี้จะเปิดให้ใช้งานทันที
            </div>
            <button className="btn primary" onClick={() => { window.location.hash = '#deposit/counter-open'; }}>
              <Icon name="chevRight" size={14} /> ไปหน้าเปิดเคาน์เตอร์
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-screen-label="ธุรกรรมเคาน์เตอร์เงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ฝาก / ถอน / โอนระหว่างบัญชี / ปิดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ทำรายการทุกประเภทในหน้าจอเดียว — แสดงวันที่เคลื่อนไหวล่าสุดของบัญชี และล็อกบัญชีที่ไม่เคลื่อนไหวเกิน {dRule.years} ปี</div>
        </div>
        <span className="spacer" />
        <div className="dpc-printer-mini" style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <label className="dpc-check" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={printSlip} onChange={(e) => setPrintSlip(e.target.checked)} /> เครื่องพิมพ์
          </label>
          <select className="cfg-input" value={printer} disabled={!printSlip} onChange={(e) => pickPrinter(e.target.value)}
                  title={printer} style={{ width: 210, height: 28, minHeight: 28, fontSize: 12, padding: '0 24px 0 8px' }}>
            {dpcPrinters.map(p => <option key={p} value={p}>{p.replace(/\s*\(.*$/, '')}</option>)}
          </select>
        </div>
        {cur && <span className={"chip " + (cur.memberStatus === 'ปฏิบัติงาน' ? 'success' : 'danger')}><span className="dot-c" />{cur.memberStatus}</span>}
      </div>

      <div className="search-card dpc-card">
        <div className="dpc-rows">
          <div className="dpc-row top">
            <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ประเภทรายการ</span>
              <select className="cfg-input dpc-type-sel" value={type} onChange={(e) => pickType(e.target.value)}
                style={{ color: typeTint, borderColor: tintBd, fontWeight: 600, backgroundColor: tintBg }}>
                {window.DPC_TXN_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>รหัสรายการ</span>
              {window.SearchSelect
                ? <window.SearchSelect value={cd ? cd.code : code} onChange={(v) => v && setCode(v)}
                    options={codes.map(c => ({ value: c.code, label: c.code + ' — ' + c.label }))}
                    searchPlaceholder="พิมพ์รหัสหรือชื่อรายการ…" />
                : <select className="cfg-input" value={code} onChange={(e) => setCode(e.target.value)}>
                    {codes.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
                  </select>}
            </div>
            <div className="dpc-srow date"><span className="dpc-lbl" style={lblTint}>วันที่</span>
              <span className="dpc-ro mono" title="วันทำการปัจจุบัน — แก้ไขไม่ได้">{thaiDate(date)}</span>
            </div>
          </div>
          <div className="dpc-row acc">
            <div className="dpc-srow acc-no"><span className="dpc-lbl" style={lblTint}>เลขที่บัญชี</span>
              <DepAccountNoField accounts={accounts} value={cur}
                                 onPick={(a) => { setAcc(a); reset(); setSlip(null); }} />
            </div>
            <div className="dpc-srow acc-mem"><span className="dpc-lbl" style={lblTint}>รหัสสมาชิก / ชื่อ-สกุล</span>
              <span className="dpc-ro name dpc-ro-big">{cur ? <><b className="mono">{cur.member}</b> · {cur.name}</> : '—'}</span>
            </div>
          </div>
          <div className="dpc-row cond" style={{ alignItems: 'stretch' }}>
            <span className="dpc-lbl" style={lblTint}>{needWd ? <>เงื่อนไขการถอน <span className="cfg-required">*</span></> : 'เงื่อนไขการถอน'}</span>
            <div className="dpc-cond">
              {cur && needWd ? (
                <div className={'dpc-wd' + (wdOk ? ' ok' : '')}>
                  <textarea className="dpc-wd-text" value={condText} disabled={wdLock}
                            onChange={(e) => setCondText(e.target.value)}
                            placeholder="ระบุรายชื่อผู้มาถอนเงินตามเงื่อนไขการถอนของบัญชี" />
                  <div className="dpc-wd-foot">
                    <label className={'dpc-wd-ok' + (wdOk ? ' on' : '')} title={wdOk ? 'ยกเลิกการยืนยันเพื่อแก้ไขรายชื่อ' : 'ตรวจสอบรายชื่อผู้มาถอนแล้วกดยืนยัน'}>
                      <input type="checkbox" checked={wdOk} disabled={locked || (!wdOk && !condText.trim())}
                             onChange={(e) => setWdOk(e.target.checked)} />
                      <span>{wdOk ? <><Icon name="lock" size={12} /> ยืนยันผู้มาถอนแล้ว</> : 'ยืนยันผู้มาถอน'}</span>
                    </label>
                    <span className="dpc-wd-hint">{wdOk
                      ? 'รายชื่อผู้มาถอนได้รับการยืนยันแล้ว หากต้องการแก้ไขให้ยกเลิกการยืนยัน'
                      : 'กรุณาตรวจสอบและคงไว้เฉพาะรายชื่อผู้ที่มาทำรายการถอนในครั้งนี้ ก่อนกดยืนยัน'}</span>
                    {!wdLock && condText !== condOriginal && (
                      <button type="button" className="dpc-wd-reset" onClick={() => setCondText(condOriginal)}>
                        <Icon name="refresh" size={12} /> คืนค่าเดิม
                      </button>
                    )}
                  </div>
                </div>
              ) : cur ? <>
                <textarea className="cfg-input dpc-cond-text" rows={3} value={condText} disabled={locked}
                          onChange={(e) => { setCondText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 2 + 'px'; }}
                          ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 2 + 'px'; } }}
                          placeholder="ระบุเงื่อนไขการถอน" />
              </> : <span className="muted">เลือกบัญชีเพื่อแสดงเงื่อนไขการถอน</span>}
            </div>
            <div className="dpc-side">
              <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>คงเหลือ</span><span className="dpc-ro num mono">{cur ? fmt.money(cur.balance, 2) : '0.00'}</span></div>
              <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ถอนได้</span><span className="dpc-ro num mono neg">{cur ? fmt.money(withdrawable, 2) : '0.00'}</span></div>
              <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>เช็คเรียกเก็บ</span><span className="dpc-ro num mono">{cur ? fmt.money(cur.pendingCheque || 0, 2) : '0.00'}</span></div>
            </div>
          </div>
        </div>
      </div>

      {!cur ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 6 }}><Icon name="wallet" size={26} /></div>
          ค้นหาและเลือกบัญชีเงินฝากเพื่อเริ่มทำรายการ
        </div>
      ) : (
        <div className="dep-form-cols" style={{ marginTop: 12 }}>
          <div className="dep-form-main">
            {dormant && (
              <div className={"dpc-dormant" + (unlockedToday ? ' unlocked' : '')}>
                <span className="dpc-dm-ico"><Icon name={unlockedToday ? 'unlock' : 'lock'} size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="dpc-dm-title">
                    {unlockedToday ? 'บัญชีปลดล็อกแล้ว — ทำรายการได้ภายในวันทำการนี้'
                      : reqPending ? 'ส่งคำขอปลดล็อกแล้ว — รอหัวหน้าอนุมัติ'
                      : 'บัญชีไม่เคลื่อนไหวเกิน ' + dRule.years + ' ปี — ถูกล็อกไม่ให้ทำรายการ'}
                  </div>
                  <div className="dpc-dm-sub">
                    เคลื่อนไหวล่าสุด <b className="mono">{fmt.date(lastMove)}</b> · ไม่เคลื่อนไหว <b className="mono">{Math.floor(idleDays / 365)} ปี {Math.floor((idleDays % 365) / 30)} เดือน</b>
                    {unlockedToday && <> · อนุมัติโดย <b>{unlock.by}</b> ({unlock.role}) — {unlock.reason}</>}
                    {reqPending && <> · คำขอ <b className="mono">{unlockReq.id}</b> เมื่อ {unlockReq.reqDate} น.</>}
                    {reqRejected && <> · <b style={{ color: 'var(--danger)' }}>คำขอล่าสุดไม่ได้รับอนุมัติ</b>{unlockReq.rejectReason ? ' — ' + unlockReq.rejectReason : ''}</>}
                  </div>
                </div>
                {!unlockedToday && (reqPending
                  ? <span className="pill warn">รออนุมัติปลดล็อก</span>
                  : <button className="btn danger" onClick={() => setUnlockOpen(true)}><Icon name="unlock" /> ขอปลดล็อกบัญชี</button>)}
              </div>
            )}

            {(frz || frzInfo.pending) && (
              <div className="dat-warn" style={{ marginTop: 12, ...{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' } }}>
                <Icon name="lock" size={14} />
                <span>{frz
                  ? <>บัญชีถูกอายัด — <b>{frz.label}</b>{frzR.amt ? ` (วงเงิน ${fmt.money(frzR.amt, 2)} บาท)` : ''}{frz.reason ? ' · เหตุผล: ' + frz.reason : ''} · {window.dpcFreezeText(frz, cur.balance)}{frzInfo.releasePending ? ' · มีคำขอยกเลิกอายัดรออนุมัติ' : ''}</>
                  : <>มีคำขออายัด <b>{frzInfo.pending.label}</b> รออนุมัติ — ยังไม่มีผลจนกว่าจะอนุมัติ</>}</span>
              </div>
            )}
            {notMatured && (
              <div className="dat-warn" style={{ marginTop: 12 }}>
                <Icon name="info" size={14} />
                <span>บัญชีเงินฝากมีระยะเวลา <b>ยังไม่ครบกำหนด</b>{maturityDate ? <> (ครบ {fmt.date(maturityDate)})</> : null} — {penText ? <>{type === 'close' ? 'ปิดก่อนกำหนด' : 'ถอนก่อนกำหนด'}คิดค่าปรับ {penText}</> : 'ไม่คิดค่าปรับตามเงื่อนไขประเภทเงินฝาก'}{rule && rule.intNote ? <> · {rule.intNote}</> : null}</span>
              </div>
            )}

            <div className="search-card dat-section dpc-detail-card">
              <DepSecHead icon="money" title="รายละเอียดการทำธุรกรรม" sub={`${cd.code} ${cd.label} · ประเภทเงิน ${cd.money} · รหัสคู่บัญชี ${cd.pair}`}
                style={{ background: 'transparent' }}
                right={<label className="dpc-aml sm">
                  <input type="checkbox" checked={aml || amlForced} disabled={locked || amlForced} onChange={(e) => setAml(e.target.checked)}
                         title={amlForced ? 'ยอดตั้งแต่ 2,000,000 บาท ต้องรายงานสำนักงาน ปปง.' : undefined} />
                  <span>จัดทำข้อมูลการทำธุรกรรมส่งสำนักงาน ปปง.</span>
                </label>} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 1, margin: '12px 16px 0', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                {[
                  ['ค.บ.สะสม', intAccum, 'var(--text-body, #262626)'],
                  ['ค.บ.ปัจจุบัน', accrued, 'var(--text-body, #262626)'],
                  ['รวม ค.บ.', intTotal, 'var(--brand, #237450)'],
                  ['ภาษีหัก ณ ที่จ่าย', wht, 'var(--text-body, #262626)'],
                  ['เรียกคืน ค.บ.', penalty, '#c0392b'],
                  ['รับสุทธิ', Math.max(0, intTotal - wht - penalty), typeTint],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: '#fff', padding: '7px 10px', textAlign: 'right' }}>
                    <div className="muted" style={{ fontSize: 11, lineHeight: 1.3 }}>{l}</div>
                    <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: c }}>{fmt.money(v, 2)}</div>
                  </div>
                ))}
              </div>
              {cur && (
                <div className="muted" style={{ fontSize: 11.5, margin: '6px 16px 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Icon name="info" size={11} />
                  {rule
                    ? <>ดอกเบี้ย {fmt.money(intRate, 2)}% ({rule.rateSrc}) · ฐาน {dayBase} วัน · ภาษี ณ ที่จ่าย {taxRate > 0 ? fmt.money(taxRate, 2) + '%' : 'ยกเว้น'}
                        {rule.wdUsed != null && <> · ถอนแล้ว {rule.wdUsed}/{rule.wdMax} ครั้ง</>} · ตามค่าคงที่ประเภทเงินฝาก</>
                    : <>ไม่พบประเภทบัญชี {cur.typeCode} ในค่าคงที่ — ใช้อัตราของบัญชี</>}
                </div>
              )}
              <div className="dpc-rows two">
                <div className="dpc-col">
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ประเภทเงิน</span><span className="dpc-ro yl mono">{cd.money}</span></div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>รหัสคู่บัญชี</span><span className="dpc-ro yl mono">{cd.pair}</span></div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ธนาคาร</span>
                    {cd.needBank
                      ? <select className="cfg-input" value={srcBank} disabled={locked} onChange={(e) => setSrcBank(e.target.value)}><option value="">— เลือกธนาคาร —</option>{window.DEP_BANKS.map(b => <option key={b} value={b}>{b}</option>)}</select>
                      : <span className="dpc-ro">ไม่ต้องระบุ</span>}
                  </div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>เลขบัญชี</span>
                    {cd.needBank
                      ? <input className="cfg-input mono" value={bankAcc} disabled={locked} onChange={(e) => setBankAcc(e.target.value)} placeholder="เลขบัญชีธนาคาร" />
                      : <span className="dpc-ro">—</span>}
                  </div>
                  {type === 'transfer' && (
                    <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>บัญชีปลายทาง</span>
                      <DepAccountSearchField accounts={accounts} value={curDst} onPick={(a) => { setDst(a); setSlip(null); }} placeholder="คลิกเพื่อค้นหาบัญชีปลายทาง…" />
                    </div>
                  )}
                  {type === 'close' && (
                    <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>เหตุผลปิดบัญชี</span>
                      <input className="cfg-input" value={reason} disabled={locked} onChange={(e) => setReason(e.target.value)} placeholder="เช่น สมาชิกขอปิดบัญชี / ลาออกจากสหกรณ์" />
                    </div>
                  )}
                </div>
                <div className="dpc-col">
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ทำรายการโดย</span>
                    <select className="cfg-input" value={channel} onChange={(e) => setChannel(e.target.value)}>{window.DPC_CHANNELS.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}</select>
                  </div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>อ้างอิงรายการ</span>
                    <input className="cfg-input mono" value={ref} disabled={locked} onChange={(e) => setRef(e.target.value)} placeholder={cd.needRef ? 'ระบุเลขที่อ้างอิง / เลขที่เช็ค' : 'ไม่บังคับ'} />
                  </div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ยอดในสมุด</span>
                    <input className="cfg-input mono num" type="number" value={bookBal} disabled={locked || channel !== 'book'} onChange={(e) => setBookBal(e.target.value)} placeholder={fmt.money(cur.balance, 2)} />
                  </div>
                  <div className="dpc-srow"><span className="dpc-lbl" style={lblTint}>ค่าธรรมเนียม</span>
                    <input className="cfg-input mono num" type="number" value={fee} disabled={locked} onChange={(e) => setFee(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="dpc-srow big"><span className="dpc-lbl" style={lblTint}>ยอดทำรายการ</span>
                    {type === 'close'
                      ? <span className="dpc-ro num mono grn">{fmt.money(cur.balance, 2)}</span>
                      : <input className="cfg-input mono num amt" type="number" value={amount} disabled={locked} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />}
                  </div>
                  <div className="dpc-srow big"><span className="dpc-lbl" style={lblTint}>ยอดสุทธิ</span>
                    <span className="dpc-net mono" style={{ color: typeTintBright }}>{fmt.money(type === 'close' ? net : Math.abs(net), 2)}</span>
                  </div>
                </div>
              </div>
              {bookBal && Number(bookBal) !== cur.balance && (
                <div className="dep-error" style={{ margin: '0 16px 14px' }}><Icon name="info" size={13} /> ยอดในสมุดไม่ตรงกับยอดในระบบ ({fmt.money(cur.balance, 2)}) — ตรวจสอบสมุดคู่ฝากก่อนทำรายการ</div>
              )}
              {crossMember && (
                <div className="dat-warn" style={{ margin: '0 16px 14px' }}><Icon name="info" size={14} /> <span>เป็นการโอน<b>ข้ามสมาชิก</b> ({cur.name} → {curDst.name}) — โปรดตรวจสอบก่อนยืนยัน</span></div>
              )}
            </div>

            {isCheque && (
              <div className="search-card dat-section">
                <DepSecHead bar icon="report" title="รายการเช็ค" sub="ระบุเช็คที่นำมาฝากแต่ละฉบับ"
                  right={<button className="btn primary sm" disabled={locked} onClick={addChq}><Icon name="plus" /> เพิ่มรายการเช็ค</button>} />
                <div className="table-wrap" style={{ margin: '16px' }}><div className="table-scroll">
                  <table className="tbl" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 130 }}>เลขที่เช็ค</th>
                        <th style={{ width: 140 }}>วันที่หน้าเช็ค</th>
                        <th style={{ minWidth: 150 }}>ธนาคาร</th>
                        <th style={{ minWidth: 120 }}>สาขา</th>
                        <th className="center" style={{ width: 96 }}>วันรอเรียกเก็บ</th>
                        <th className="right" style={{ width: 120 }}>จำนวนเงิน</th>
                        <th className="center" style={{ width: 56 }}>Late</th>
                        <th style={{ width: 40 }} />
                      </tr>
                    </thead>
                    <tbody>
                      {chqRows.length === 0 ? (
                        <tr><td colSpan="8" className="center muted" style={{ padding: '18px 12px' }}>ไม่มีรายการเช็ค — กด “เพิ่มรายการเช็ค” เพื่อบันทึกเช็คที่นำมาฝาก</td></tr>
                      ) : chqRows.map((r) => (
                        <tr key={r.id}>
                          <td><input className="vch-cell-input mono" value={r.no} disabled={locked} onChange={(e) => setChq(r.id, 'no', e.target.value)} placeholder="เลขที่เช็ค" /></td>
                          <td><input className="vch-cell-input mono" type="date" value={r.date} disabled={locked} onChange={(e) => setChq(r.id, 'date', e.target.value)} /></td>
                          <td>
                            <select className="vch-cell-input" value={r.bank} disabled={locked} onChange={(e) => setChq(r.id, 'bank', e.target.value)}>
                              <option value="">— เลือกธนาคาร —</option>
                              {dpcChqBanks().map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </td>
                          <td><input className="vch-cell-input" value={r.branch} disabled={locked} onChange={(e) => setChq(r.id, 'branch', e.target.value)} placeholder="สาขา" /></td>
                          <td><input className="vch-cell-input num" type="number" min="0" value={r.float} disabled={locked} title="จำนวนวันรอเรียกเก็บ" onChange={(e) => setChq(r.id, 'float', e.target.value)} /></td>
                          <td><input className="vch-cell-input num" type="number" value={r.amount} disabled={locked} onChange={(e) => setChq(r.id, 'amount', e.target.value)} placeholder="0.00" /></td>
                          <td className="center"><input type="checkbox" checked={!!r.late} disabled={locked} onChange={(e) => setChq(r.id, 'late', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} /></td>
                          <td className="center"><button className="btn sm ex-row-btn del" title="ลบแถว" disabled={locked} onClick={() => delChq(r.id)}><Icon name="trash" size={13} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                    {chqRows.length > 0 && (
                      <tfoot>
                        <tr className="vch-foot">
                          <td colSpan="5" className="right">รวมเช็ค {chqRows.length} ใบ</td>
                          <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(chqTotal, 2)}</td>
                          <td colSpan="2" />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div></div>
              </div>
            )}

            <div className="search-card dat-section">
              <DepSecHead title="รายการเคลื่อนไหวล่าสุดของบัญชี" sub="รายการฝาก ถอน และโอนล่าสุดของบัญชีที่เลือก"
                meta={lastMove ? `เคลื่อนไหวล่าสุด ${thaiDate(lastMove)} · ไม่เคลื่อนไหว ${idleDays.toLocaleString()} วัน` : 'ยังไม่มีรายการเคลื่อนไหว'} />
              <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
                <table className="tbl dpc-moves">
                  <thead>
                    <tr>
                      <th className="center" style={{ width: 48 }}>ลำดับ</th>
                      <th className="center" style={{ width: 110 }}>วันที่</th>
                      <th style={{ width: 90 }}>รหัส</th>
                      <th>รายการ</th>
                      <th className="num">จำนวนเงิน</th>
                      <th className="num">ยอดคงเหลือ</th>
                      <th>ผู้ทำรายการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moves.length === 0 ? <tr><td colSpan="7" className="empty-state">ไม่มีรายการเคลื่อนไหว</td></tr> :
                      moves.slice(0, 8).map((m, i) => (
                        <tr key={i} className={i === 0 && dormant ? 'dpc-row-old' : ''}>
                          <td className="center muted">{i + 1}</td>
                          <td className="center mono">{thaiDate(m.date)}</td>
                          <td className="mono">{m.code}</td>
                          <td>{m.label}</td>
                          <td className="num mono" style={{ color: m.dc === '+' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{m.dc} {fmt.money(m.amount, 2)}</td>
                          <td className="num mono"><b>{fmt.money(m.balance, 2)}</b></td>
                          <td>{m.by}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div></div>
            </div>
          </div>

          <div className="dep-form-side">
            <div className="dep-summary-card">
              <div className="dep-sum-row"><span>ยอดคงเหลือ</span><span className="mono">{fmt.money(cur.balance, 2)}</span></div>
              <div className="dep-sum-row"><span>ถอนได้</span><span className="mono">{fmt.money(withdrawable, 2)}</span></div>
              {type === 'close' && <div className="dep-sum-row"><span>ดอกเบี้ยถึงวันปิด</span><span className="mono" style={{ color: 'var(--success)' }}>+ {fmt.money(accrued, 2)}</span></div>}
              {wht > 0 && <div className="dep-sum-row"><span>ภาษีหัก ณ ที่จ่าย {fmt.money(taxRate, 2).replace(/\.00$/, '')}%</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(wht, 2)}</span></div>}
              {type !== 'close' && <div className="dep-sum-row"><span>ยอดทำรายการ</span><span className="mono" style={{ color: type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>{type === 'deposit' ? '+' : '−'} {fmt.money(amtNum, 2)}</span></div>}
              {penalty > 0 && <div className="dep-sum-row"><span>ค่าปรับก่อนครบกำหนด</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(penalty, 2)}</span></div>}
              {overFee > 0 && <div className="dep-sum-row"><span>ค่าปรับถอนเกินจำนวนครั้ง</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(overFee, 2)}</span></div>}
              {closeFee > 0 && <div className="dep-sum-row"><span>ค่าธรรมเนียมปิดบัญชี</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(closeFee, 2)}</span></div>}
              {feeNum > 0 && <div className="dep-sum-row"><span>ค่าธรรมเนียม</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(feeNum, 2)}</span></div>}
              <div className="dep-sum-row total"><span>{type === 'close' ? 'ยอดจ่ายสุทธิ' : 'ยอดคงเหลือใหม่'}</span><span className="mono">{fmt.money(type === 'close' ? net : newBal, 2)}</span></div>
              {type === 'transfer' && <div className="dep-sum-row" style={{ marginTop: 6 }}><span>ปลายทางคงเหลือใหม่</span><span className="mono" style={{ color: 'var(--success)' }}>{curDst ? fmt.money(curDst.balance + amtNum, 2) : '—'}</span></div>}
            </div>

            {errors.length > 0 && (
              <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
                <Icon name="info" size={14} /><div>{errors.map((e, i) => <div key={i}>{e}</div>)}</div>
              </div>
            )}

            <div className="dep-submit-bar">
              {locked
                ? <button className="btn block danger lg" disabled={reqPending} onClick={() => setUnlockOpen(true)}><Icon name="unlock" /> {reqPending ? 'รอหัวหน้าอนุมัติปลดล็อก' : 'ขอปลดล็อกบัญชีก่อนทำรายการ'}</button>
                : (needWdApv && !wdApproved)
                  ? <>
                      <button className="btn block primary lg" disabled={!canSubmit || wdPending} onClick={sendWdApv}
                        style={canSubmit && !wdPending ? { background: typeTint, borderColor: typeTint } : undefined}>
                        <Icon name="send" /> {wdPending ? 'รอหัวหน้าอนุมัติ' : 'ส่งขออนุมัติถอนเงิน'}
                      </button>
                      <div className={wdRejected ? 'sr-error' : 'sr-warn'} style={{ fontSize: 12, margin: 0 }}>
                        <Icon name="info" size={13} /> {wdRejected
                          ? 'คำขอล่าสุดไม่ได้รับอนุมัติ' + (wdReq.rejectReason ? ' — ' + wdReq.rejectReason : '')
                          : wdPending ? 'ส่งคำขอ ' + wdReq.id + ' แล้ว — เมื่อหัวหน้าอนุมัติ ปุ่มบันทึกจะกดได้'
                          : 'ถอนตั้งแต่ ' + fmt.money(window.DEP_WD_APV_LIMIT, 0) + ' บาทขึ้นไป ต้องให้หัวหน้าอนุมัติก่อนบันทึก'}
                      </div>
                    </>
                  : <button className="btn block primary lg" disabled={!canSubmit} onClick={() => setConfirmOpen(true)}
                      style={canSubmit ? { background: typeTint, borderColor: typeTint } : undefined}><Icon name="check" /> บันทึก{typeLabel.replace(/\s*\(.*\)$/, '')}{wdApproved ? ' (อนุมัติแล้ว)' : ''}</button>}
              {slip && <>
                <button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบรายการ</button>
                <button className="btn block" onClick={() => onToast && onToast('พิมพ์สมุดคู่ฝาก — เฉพาะรายการที่ยังไม่ได้พิมพ์')}><Icon name="print" /> พิมพ์สมุดคู่ฝาก</button>
              </>}
            </div>

            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              <Icon name="info" size={11} /> บัญชีที่ไม่เคลื่อนไหวเกิน {dRule.years} ปี ต้องปลดล็อกโดยหัวหน้าฝ่ายหรือผู้มีสิทธิ์ทุกครั้ง และบันทึก Audit Trail พร้อมเหตุผล
            </p>
          </div>
        </div>

      )}

      {confirmEl}
      {unlockOpen && cur && <DpcUnlockModal acc={cur} lastMove={lastMove} idleDays={idleDays} onClose={() => setUnlockOpen(false)} onUnlock={doUnlock} />}
      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepCounterPage, DpcUnlockModal });
