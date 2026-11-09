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
// ยืนยันก่อนปิดใช้งาน (เปิดใช้งานกลับไม่ต้องยืนยัน) — รูปแบบเดียวกันทุกเมนูค่าคงที่
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
window.depConfirmOff = function (isOn, name, apply, effect, title) {
  if (!isOn) { apply(); return; }
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(<DepOffConfirm title={title} name={name} effect={effect} onOk={() => { close(); apply(); }} onClose={close} />);
};

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

  const codes = window.dpcCodesFor ? window.dpcCodesFor(type) : window.DPC_TXN_CODES[type];
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
  const minBal = accType?.cond?.minBalance || 0;
  const isFixed = cur && cur.typeCode.startsWith('F');
  const notMatured = cur && isFixed && cur.maturityDate && cur.maturityDate > date;
  const withdrawable = cur ? Math.max(0, cur.balance - minBal) : 0;
  const accrued = useMemo(() => {
    if (!cur) return 0;
    const d = new Date(date), y0 = new Date(d.getFullYear(), 0, 1);
    const days = Math.max(0, Math.round((d - y0) / 86400000));
    return Math.round(cur.balance * (cur.rate / 100) * days / 365 * 100) / 100;
  }, [cur, date]);
  const intAccum = cur ? Math.round((cur.accrued || 0) * 100) / 100 : 0;
  const intTotal = Math.round((intAccum + accrued) * 100) / 100;
  const wht = type === 'close' && isFixed ? Math.round(accrued * 0.15 * 100) / 100 : 0;
  const penalty = (type === 'withdraw' || type === 'close') && notMatured ? Math.round((type === 'close' ? cur.balance : amtNum) * 0.005 * 100) / 100 : 0;

  const net = !cur ? 0
    : type === 'deposit' ? amtNum - feeNum
    : type === 'close' ? cur.balance + accrued - wht - penalty - feeNum
    : -(amtNum + feeNum + penalty);
  const newBal = !cur ? 0 : type === 'close' ? 0 : cur.balance + (type === 'deposit' ? amtNum - feeNum : -(amtNum + feeNum + penalty));

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
  if ((type === 'withdraw' || type === 'transfer') && cur && amtNum + feeNum + penalty > cur.balance) errors.push('ยอดทำรายการเกินยอดคงเหลือ');
  if (type === 'withdraw' && cur && amtNum > 0 && newBal < minBal) errors.push(`ถอนแล้วคงเหลือต่ำกว่าขั้นต่ำ ${fmt.money(minBal, 0)} บาท`);
  if (type === 'transfer' && !curDst) errors.push('เลือกบัญชีปลายทาง');
  if (type === 'transfer' && curDst && cur && curDst.accNo === cur.accNo) errors.push('บัญชีต้นทางและปลายทางต้องไม่ใช่บัญชีเดียวกัน');
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
  const addChq = () => setChqRows(rs => [...rs, { id: Date.now() + Math.random(), no: '', bank: srcBank || '', branch: '', date: date, amount: '' }]);
  const setChq = (id, k, v) => setChqRows(rs => rs.map(r => r.id === id ? { ...r, [k]: v } : r));
  const delChq = (id) => setChqRows(rs => rs.filter(r => r.id !== id));
  React.useEffect(() => { if (!isCheque) setChqRows([]); }, [isCheque, code]);

  React.useEffect(() => {
    if (!slip) return;
    // บันทึกแล้วแจ้งผลด้วยแถบข้อความสั้น (ไม่ขึ้น popup ซ้ำ) — พิมพ์ส่งเครื่องที่เลือกโดยตรง
    onToast && onToast('บันทึก' + slip.title + ' เรียบร้อยแล้ว' + (printSlip ? ' · ส่งพิมพ์ที่ ' + String(printer).replace(/\s*\(.*$/, '') : ''));
  }, [slip]);

  const pickType = (t) => {
    setType(t); setCode(((window.dpcCodesFor ? window.dpcCodesFor(t) : window.DPC_TXN_CODES[t])[0] || {}).code);
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
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type: 'withdraw', channel: `${cd.code} ${cd.label}`, amount: net, fee: feeNum, balance: 0, ref: ref.trim() || 'CLOSE', by: DEPC_TELLER });
    } else if (type === 'transfer') {
      const srcNew = cur.balance - amtNum - feeNum, dstNew = curDst.balance + amtNum;
      nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: srcNew } : a.accNo === curDst.accNo ? { ...a, balance: dstNew } : a);
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type: 'transfer-out', channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: feeNum, balance: srcNew, ref: curDst.accNo, by: DEPC_TELLER });
      entries.push({ id: window.depTxnNextId(), date, accNo: curDst.accNo, member: curDst.member, type: 'transfer-in', channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: 0, balance: dstNew, ref: cur.accNo, by: DEPC_TELLER });
    } else {
      nextAcc = accounts.map(a => a.accNo === cur.accNo ? { ...a, balance: newBal, freeUsed: type === 'withdraw' ? (a.freeUsed || 0) + 1 : a.freeUsed } : a);
      entries.push({ id: txId, date, accNo: cur.accNo, member: cur.member, type, channel: `${cd.code} ${cd.label}`, amount: amtNum, fee: feeNum, penalty, balance: newBal, ref: ref.trim() || cd.code, srcBank, by: DEPC_TELLER });
    }
    setAccounts(nextAcc); window.depTxnSaveAccounts(nextAcc);
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
        ...(wht ? [{ k: 'ภาษีหัก ณ ที่จ่าย (15%)', v: '− ' + fmt.money(wht, 2), mono: true }] : []),
        ...(penalty ? [{ k: 'ค่าปรับก่อนครบกำหนด', v: '− ' + fmt.money(penalty, 2), mono: true }] : []),
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
              <select className="cfg-input" value={code} onChange={(e) => setCode(e.target.value)}>
                {codes.map(c => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
              </select>
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

            {notMatured && (
              <div className="dat-warn" style={{ marginTop: 12 }}>
                <Icon name="info" size={14} />
                <span>บัญชีฝากประจำ<b>ยังไม่ครบกำหนด</b> (ครบ {fmt.date(cur.maturityDate)}) — {type === 'close' ? 'ปิดก่อนกำหนดคิดค่าปรับ' : 'ถอนก่อนกำหนดคิดค่าปรับ'} 0.50% ของยอด</span>
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
                <DepSecHead bar icon="report" title="รายการเช็ค" sub="ระบุเช็คที่นำมาฝากแต่ละฉบับ" style={{ background: 'transparent' }}
                  meta={'รวม ' + fmt.money(chqTotal, 2) + ' บาท · ' + chqRows.length + ' ฉบับ'}
                  right={<button className="btn primary sm" disabled={locked} onClick={addChq}><Icon name="plus" size={13} /> เพิ่มเช็ค</button>} />
                <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
                  <table className="tbl" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th className="center" style={{ width: 48 }}>ลำดับ</th>
                        <th style={{ width: 150 }}>เลขที่เช็ค</th>
                        <th style={{ width: 190 }}>ธนาคาร</th>
                        <th style={{ width: 150 }}>สาขา</th>
                        <th className="center" style={{ width: 130 }}>วันที่บนเช็ค</th>
                        <th className="num" style={{ width: 130 }}>จำนวนเงิน</th>
                        <th className="center" style={{ width: 70 }}>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chqRows.length === 0
                        ? <tr><td colSpan="7" className="empty-state">ยังไม่มีรายการเช็ค — กด “เพิ่มเช็ค” เพื่อบันทึก</td></tr>
                        : chqRows.map((r, i) => (
                          <tr key={r.id}>
                            <td className="center muted">{i + 1}</td>
                            <td><input className="cfg-input mono" value={r.no} disabled={locked} placeholder="เลขที่เช็ค"
                                       onChange={(e) => setChq(r.id, 'no', e.target.value)} /></td>
                            <td><select className="cfg-input" value={r.bank} disabled={locked} onChange={(e) => setChq(r.id, 'bank', e.target.value)}>
                                  <option value="">— เลือกธนาคาร —</option>
                                  {window.DEP_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                                </select></td>
                            <td><input className="cfg-input" value={r.branch} disabled={locked} placeholder="สาขา"
                                       onChange={(e) => setChq(r.id, 'branch', e.target.value)} /></td>
                            <td><ThaiDateField value={r.date} onChange={(v) => setChq(r.id, 'date', v)} /></td>
                            <td><input className="cfg-input mono num" inputMode="decimal" value={r.amount} disabled={locked} placeholder="0.00"
                                       onChange={(e) => setChq(r.id, 'amount', e.target.value.replace(/[^0-9.]/g, ''))} /></td>
                            <td className="center">
                              <button className="btn sm tt-del-btn" disabled={locked} onClick={() => delChq(r.id)}>
                                <Icon name="trash" size={13} /> ลบ
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
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
              {wht > 0 && <div className="dep-sum-row"><span>ภาษีหัก ณ ที่จ่าย 15%</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(wht, 2)}</span></div>}
              {type !== 'close' && <div className="dep-sum-row"><span>ยอดทำรายการ</span><span className="mono" style={{ color: type === 'deposit' ? 'var(--success)' : 'var(--danger)' }}>{type === 'deposit' ? '+' : '−'} {fmt.money(amtNum, 2)}</span></div>}
              {penalty > 0 && <div className="dep-sum-row"><span>ค่าปรับก่อนครบกำหนด</span><span className="mono" style={{ color: 'var(--danger)' }}>− {fmt.money(penalty, 2)}</span></div>}
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
