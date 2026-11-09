// ════════════════════════════════════════════════════════════════════
//  ระบบงานประมวลผลและจัดเก็บ › สินเชื่อ
//  4 หน้าจอใหม่:
//    · อนุมัติเปลี่ยนแปลงงวดชำระ  (process/inst-approve)
//    · ปรับยอดดอกเบี้ยสะสม        (process/accrued-interest-adjust)
//    · ปรับเพิ่ม-ลด หุ้น           (process/share-adjust)
//    · ปรับเพิ่ม-ลดหนี้            (process/debt-adjust)
//  ใช้สมาชิก/สัญญาจาก window.DN_MEMBERS · MemberSearchField / ContractSearchField
// ════════════════════════════════════════════════════════════════════

const pcxToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const pcxBE = () => new Date().getFullYear() + 543;
const pcxAudit = () => React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
const pcxMoney = (v, d) => window.fmt.money(Number(v) || 0, d === undefined ? 2 : d);

function PcxFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function PcxRO({ value, mono, num, danger, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (danger ? ' danger' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}
function PcxHead({ icon, title, subtitle, actions }) {
  return (
    <div className="icr-form-head">
      <div className="icr-form-title">
        <span className="icr-form-ico"><Icon name={icon || 'edit'} size={20} /></span>
        <div>
          <h1>{title}</h1>
          <div className="icr-form-sub">{subtitle}</div>
        </div>
      </div>
      <div className="icr-form-actions">{actions}</div>
    </div>
  );
}
function PcxSec({ title, children, style }) {
  return (
    <div className="search-card icr-sec" style={style}>
      <div className="section-head"><span className="head-bar" /><h3>{title}</h3></div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ② ปรับยอดดอกเบี้ยสะสม
// ════════════════════════════════════════════════════════════════════
function AccruedInterestAdjustPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [adjust, setAdjust] = useState('');
  const [note, setNote] = useState('');
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const contracts = member ? (member.debts || []) : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;
  const before = contract ? Number(contract.interestDue) || 0 : 0;
  const after = before + (Number(adjust) || 0);

  const load = (m, debt) => {
    setMember(m); setContractNo(debt.contractNo);
    setAdjust(''); setNote(''); setSavedNo(''); setError('');
  };
  const clear = () => { setMember(null); setContractNo(''); setAdjust(''); setNote(''); setSavedNo(''); setError(''); };

  const doSave = () => {
    if (!member || !contract) { setError('กรุณาเลือกทะเบียนสมาชิกและสัญญาก่อนบันทึก'); return; }
    if (!adjust || Number(adjust) === 0) { setError('กรุณาระบุยอดปรับ (บวกเพื่อเพิ่ม / ลบเพื่อลดยอดดอกเบี้ยสะสม)'); return; }
    if (after < 0) { setError('ยอดใหม่ต้องไม่น้อยกว่า 0'); return; }
    if (!note.trim()) { setError('กรุณาระบุหมายเหตุ / เหตุผลการปรับยอด'); return; }
    setError('');
    const no = `AI${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'update', module: 'ประมวลผลและจัดเก็บ — ปรับยอดดอกเบี้ยสะสม',
      target: `${member.code} · ${member.name} · ${contractNo}`,
      summary: `${no} · ปรับยอดดอกเบี้ยสะสม ${pcxMoney(before)} → ${pcxMoney(after)} บาท`,
      changes: [
        { field: 'ยอดดอกเบี้ยสะสม', before: pcxMoney(before), after: pcxMoney(after) },
        { field: 'ยอดปรับ', before: '—', after: pcxMoney(adjust) },
        { field: 'หมายเหตุ', before: '—', after: note },
      ],
    });
    onToast && onToast(`ปรับยอดดอกเบี้ยสะสมสัญญา ${contractNo} เรียบร้อยแล้ว (${no})`);
  };

  return (
    <div data-screen-label="ปรับยอดดอกเบี้ยสะสม">
      <PcxHead icon="money" title="ปรับยอดดอกเบี้ยสะสม"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — ปรับยอดดอกเบี้ยสะสมของสัญญาเงินกู้ พร้อมบันทึกเหตุผล"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบปรับยอดดอกเบี้ยสะสม…'); setTimeout(() => window.print(), 80); }}><Icon name="print" size={13} /> พิมพ์</button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลสมาชิกและสัญญา">
        <div className="icr-strip">
          <PcxFld label="ทะเบียน / เลขที่สัญญา" w={300} required>
            <ContractSearchField contract={contractNo} member={member} source={window.DN_MEMBERS}
                                 onPick={({ member: m, debt }) => load(m, debt)}
                                 title="ค้นหาสัญญาเงินกู้ — ปรับยอดดอกเบี้ยสะสม"
                                 placeholder="ค้นหาด้วยเลขที่สัญญา หรือเลขทะเบียน…" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="ประเภทเงินกู้" w={150}><PcxRO value={contract ? contract.type : ''} /></PcxFld>
          <PcxFld label="วันที่เปลี่ยน" w={140}>
            <PcxRO value={window.fmt.date(today)} mono />
          </PcxFld>
          <PcxFld label="ผู้ทำรายการ" w={150}><PcxRO value={window.CCD_USER || 'jeerana'} /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="ยอดดอกเบี้ยสะสม" style={{ marginTop: 12 }}>
        <div className="icr-strip">
          <PcxFld label="ก่อนเปลี่ยนแปลง — ยอดเดิม" w={200}><PcxRO value={contract ? pcxMoney(before) : ''} num mono /></PcxFld>
          <PcxFld label="ยอดปรับ (+ เพิ่ม / − ลด)" w={180} required>
            <input className="cfg-input" type="number" step="0.01" value={adjust} disabled={!contract}
                   style={{ textAlign: 'right' }}
                   onChange={(e) => { setAdjust(e.target.value); setError(''); }} placeholder="0.00" />
          </PcxFld>
          <PcxFld label="หลังเปลี่ยนแปลง — ยอดใหม่" w={200}>
            <PcxRO value={contract ? pcxMoney(after) : ''} num mono danger={after < 0} />
          </PcxFld>
          <PcxFld label="เลขที่เอกสาร" grow w={160}><PcxRO value={savedNo} mono placeholder="(Auto)" /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="หมายเหตุ" style={{ marginTop: 12 }}>
        <div className="icr-note-wrap">
          <textarea className="cfg-input" rows={4} value={note} maxLength={500} disabled={!contract}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="ระบุเหตุผลการปรับยอดดอกเบี้ยสะสม เช่น ปรับตามการคำนวณดอกเบี้ยใหม่ตามมติที่ประชุม" />
          <span className="icr-note-count">{note.length}/500</span>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ③ ปรับเพิ่ม-ลด หุ้น
// ════════════════════════════════════════════════════════════════════
function ShareAdjustPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [docDate, setDocDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [mode, setMode] = useState('add');       // add | sub
  const [reason, setReason] = useState('');
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const sign = mode === 'add' ? 1 : -1;
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const pickMember = (m) => {
    setMember(m); setSavedNo(''); setError(''); setReason('');
    setRows([
      { code: 'SH-01', label: 'หุ้นสามัญ', amount: '', base: Number(m.shares) || 0 },
    ]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addRow = () => {
    if (!member) { setError('กรุณาเลือกทะเบียนสมาชิกก่อนเพิ่มรายการ'); return; }
    setRows(rs => [...rs, { code: '', label: '', amount: '', base: 0 }]);
  };
  const removeRow = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));
  const clear = () => { setMember(null); setRows([]); setReason(''); setSavedNo(''); setMode('add'); setError(''); setDocDate(today); setTxnDate(today); };

  const doSave = () => {
    if (!member) { setError('กรุณาระบุทะเบียนสมาชิกก่อนบันทึก'); return; }
    if (!reason.trim()) { setError('กรุณาระบุเหตุผลที่ปรับปรุง'); return; }
    if (!rows.length || total === 0) { setError('กรุณาระบุรายการและยอดปรับปรุงอย่างน้อย 1 รายการ'); return; }
    const bad = rows.find(r => sign < 0 && (Number(r.amount) || 0) > (Number(r.base) || 0));
    if (bad) { setError(`ยอดปรับลดของรายการ "${bad.label || bad.code || '(รายการใหม่)'}" เกินยอดคงเหลือ`); return; }
    setError('');
    const no = `SA${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    audit && audit.log && audit.log({
      action: 'update', module: 'ประมวลผลและจัดเก็บ — ปรับเพิ่ม-ลด หุ้น',
      target: `${member.code} · ${member.name}`,
      summary: `${no} · ${mode === 'add' ? 'ปรับปรุงเพิ่ม' : 'ปรับปรุงลด'}หุ้นรวม ${pcxMoney(total)} บาท — ${reason}`,
      changes: rows.map(r => ({
        field: `${r.code || '—'} · ${r.label || '—'}`,
        before: pcxMoney(r.base),
        after: pcxMoney((Number(r.base) || 0) + sign * (Number(r.amount) || 0)),
      })),
    });
    onToast && onToast(`บันทึกใบปรับปรุงหุ้น ${no} เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="ปรับเพิ่ม-ลด หุ้น">
      <PcxHead icon="shares" title="ปรับเพิ่ม-ลด หุ้น"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — ใบปรับปรุงยอดหุ้นของสมาชิก (เพิ่ม / ลด)"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบปรับปรุงหุ้น…'); setTimeout(() => window.print(), 80); }}><Icon name="print" size={13} /> พิมพ์</button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลใบปรับปรุง">
        <div className="icr-strip">
          <PcxFld label="เลขที่ใบปรับปรุง" w={150}><PcxRO value={savedNo} mono placeholder="Auto" /></PcxFld>
          <PcxFld label="วันที่ใบปรับปรุง" w={150}>
            <ErpDate value={docDate} onChange={(v) => ((e) => setDocDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="วันที่รายการ" w={150}>
            <ErpDate value={txnDate} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="ประเภทปรับปรุง" w={170}>
            <select className="cfg-input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="add">ปรับปรุงเพิ่ม</option>
              <option value="sub">ปรับปรุงลด</option>
            </select>
          </PcxFld>
          <PcxFld label="ทะเบียนสมาชิก" w={260} required>
            <MemberSearchField member={member} onPick={pickMember} source={window.DN_MEMBERS}
                               title="ค้นหาสมาชิก — ปรับเพิ่ม-ลด หุ้น" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={180}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="เหตุผลที่ปรับปรุง" grow w={280} required>
            <input className="cfg-input" value={reason} disabled={!member}
                   onChange={(e) => { setReason(e.target.value); setError(''); }}
                   placeholder="เช่น ปรับปรุงยอดหุ้นตามมติที่ประชุมคณะกรรมการ" />
          </PcxFld>
          <PcxFld label="ยอดปรับปรุงรวม" w={180}><PcxRO value={pcxMoney(total)} num mono /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="รายการปรับปรุง" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <table className="tbl" style={{ fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}></th>
                <th style={{ width: 110 }}>รหัส</th>
                <th>รายการ</th>
                <th style={{ width: 170, textAlign: 'right' }}>ยอดปรับปรุง</th>
                <th style={{ width: 170, textAlign: 'right' }}>คงเหลือ</th>
                <th style={{ width: 70 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="muted mono">{i + 1}</td>
                  <td><input className="cfg-input sm" value={r.code} onChange={(e) => updateRow(i, { code: e.target.value })} placeholder="SH-xx" /></td>
                  <td><input className="cfg-input sm" value={r.label} onChange={(e) => updateRow(i, { label: e.target.value })} placeholder="ชื่อรายการหุ้น" /></td>
                  <td><input className="cfg-input sm" type="number" step="0.01" style={{ textAlign: 'right' }}
                             value={r.amount} onChange={(e) => updateRow(i, { amount: e.target.value })} placeholder="0.00" /></td>
                  <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney((Number(r.base) || 0) + sign * (Number(r.amount) || 0))}</td>
                  <td><button className="btn sm danger" onClick={() => removeRow(i)}><Icon name="close" size={12} /> ลบ</button></td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>เลือกสมาชิกเพื่อเริ่มบันทึกรายการปรับปรุง</td></tr>
              )}
            </tbody>
            {!!rows.length && (
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>รวม</td>
                  <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{pcxMoney(total)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ④ ปรับเพิ่ม-ลดหนี้
// ════════════════════════════════════════════════════════════════════
const PCX_DEBT_TYPES = [
  { v: 'INS', l: 'INS-ปรับเบี้ยประกัน' },
  { v: 'PRN', l: 'PRN-ปรับเงินต้น' },
  { v: 'INT', l: 'INT-ปรับดอกเบี้ย' },
  { v: 'FEE', l: 'FEE-ปรับค่าธรรมเนียม' },
];
const PCX_APPROVE_MODES = [
  { v: 'none', l: 'ไม่ปรับยอดอนุมัติ' },
  { v: 'adjust', l: 'ปรับปรุงยอดอนุมัติ' },
];

function DebtAdjustPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [docDate, setDocDate] = useState(today);
  const [txnDate, setTxnDate] = useState(today);
  const [type, setType] = useState('INS');
  const [approveMode, setApproveMode] = useState('none');
  const [dataset, setDataset] = useState('');
  const [reason, setReason] = useState('');
  const [fireIns, setFireIns] = useState(false);
  const [projIns, setProjIns] = useState(false);
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const total = rows.reduce((s, r) => s + (Number(r.principal) || 0) + (Number(r.interest) || 0), 0);

  const load = (m, debt) => {
    setMember(m); setContractNo(debt.contractNo); setSavedNo(''); setError(''); setReason('');
    setRows([{
      code: 'PRN', label: `เงินต้นคงเหลือ · ${debt.type}`, dueTo: debt.dueDate || today,
      principal: '', interest: '', base: Number(debt.principalRemaining) || 0,
    }, {
      code: 'INT', label: 'ดอกเบี้ยค้างชำระ', dueTo: debt.dueDate || today,
      principal: '', interest: '', base: Number(debt.interestDue) || 0,
    }]);
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addRow = () => {
    if (!contractNo) { setError('กรุณาเลือกสัญญาก่อนเพิ่มรายการ'); return; }
    setRows(rs => [...rs, { code: '', label: '', dueTo: today, principal: '', interest: '', base: 0 }]);
  };
  const removeRow = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));
  const clear = () => {
    setMember(null); setContractNo(''); setRows([]); setReason(''); setSavedNo('');
    setType('INS'); setApproveMode('none'); setDataset(''); setFireIns(false); setProjIns(false);
    setDocDate(today); setTxnDate(today); setError('');
  };

  const doSave = () => {
    if (!member || !contractNo) { setError('กรุณาเลือกทะเบียนสมาชิกและสัญญาก่อนบันทึก'); return; }
    if (!reason.trim()) { setError('กรุณาระบุเหตุผลที่ปรับปรุง'); return; }
    if (total === 0) { setError('กรุณาระบุยอดปรับปรุง (เงินต้น หรือ ดอกเบี้ย) อย่างน้อย 1 รายการ'); return; }
    setError('');
    const no = `DA${pcxBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    setSavedNo(no);
    const t = PCX_DEBT_TYPES.find(o => o.v === type);
    audit && audit.log && audit.log({
      action: 'update', module: 'ประมวลผลและจัดเก็บ — ปรับเพิ่ม-ลดหนี้',
      target: `${member.code} · ${member.name} · ${contractNo}`,
      summary: `${no} · ${t ? t.l : type} · ยอดปรับปรุงรวม ${pcxMoney(total)} บาท — ${reason}`,
      changes: [
        ...rows.filter(r => (Number(r.principal) || 0) || (Number(r.interest) || 0)).map(r => ({
          field: `${r.code || '—'} · ${r.label || '—'}`,
          before: pcxMoney(r.base),
          after: pcxMoney((Number(r.base) || 0) + (Number(r.principal) || 0) + (Number(r.interest) || 0)),
        })),
        { field: 'ยอดอนุมัติ', before: '—', after: approveMode === 'none' ? 'ไม่ปรับยอดอนุมัติ' : 'ปรับปรุงยอดอนุมัติ' },
        ...(fireIns ? [{ field: 'โอนเบี้ยประกันอัคคีภัย', before: '—', after: 'โอน' }] : []),
        ...(projIns ? [{ field: 'โอนเบี้ยประกันโครงการประกัน', before: '—', after: 'โอน' }] : []),
      ],
    });
    onToast && onToast(`บันทึกใบปรับปรุงหนี้ ${no} (สัญญา ${contractNo}) เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="ปรับเพิ่ม-ลดหนี้">
      <PcxHead icon="money" title="ปรับเพิ่ม-ลดหนี้"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — ใบปรับปรุงยอดหนี้ เงินต้น ดอกเบี้ย และเบี้ยประกันของสัญญา"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบปรับปรุงหนี้…'); setTimeout(() => window.print(), 80); }}><Icon name="print" size={13} /> พิมพ์</button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลใบปรับปรุง">
        <div className="icr-strip">
          <PcxFld label="เลขที่ใบปรับปรุง" w={150}><PcxRO value={savedNo} mono placeholder="Auto" /></PcxFld>
          <PcxFld label="วันที่ใบปรับปรุง" w={150}>
            <ErpDate value={docDate} onChange={(v) => ((e) => setDocDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="วันที่รายการ" w={150}>
            <ErpDate value={txnDate} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="ประเภทปรับปรุง" w={200}>
            <select className="cfg-input" value={type} onChange={(e) => setType(e.target.value)}>
              {PCX_DEBT_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="ทะเบียน / เลขที่สัญญา" grow w={280} required>
            <ContractSearchField contract={contractNo} member={member} source={window.DN_MEMBERS}
                                 onPick={({ member: m, debt }) => load(m, debt)}
                                 title="ค้นหาสัญญาเงินกู้ — ปรับเพิ่ม-ลดหนี้"
                                 placeholder="ค้นหาด้วยเลขที่สัญญา หรือเลขทะเบียน…" />
          </PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="ยอดอนุมัติ" w={190}>
            <select className="cfg-input" value={approveMode} onChange={(e) => setApproveMode(e.target.value)} disabled={!contractNo}>
              {PCX_APPROVE_MODES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="ชุดข้อมูลที่" w={150}>
            <select className="cfg-input" value={dataset} onChange={(e) => setDataset(e.target.value)} disabled={!contractNo}>
              <option value="">—</option>
              <option value="1">ชุดที่ 1</option>
              <option value="2">ชุดที่ 2</option>
            </select>
          </PcxFld>
          <PcxFld label="ยอดปรับปรุงรวม" w={180}>
            <PcxRO value={pcxMoney(total)} num mono danger={total < 0} />
          </PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="เหตุผลที่ปรับปรุง" grow w={300} required>
            <input className="cfg-input" value={reason} disabled={!contractNo}
                   onChange={(e) => { setReason(e.target.value); setError(''); }}
                   placeholder="เช่น ปรับปรุงเบี้ยประกันตามใบแจ้งของบริษัทประกัน" />
          </PcxFld>
          <div className="icr-fld" style={{ flex: '1 1 0', minWidth: 260 }}>
            <span className="icr-fld-l">การโอนเบี้ยประกัน</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', height: 32 }}>
              <label className="lrq-check"><input type="checkbox" checked={fireIns} disabled={!contractNo}
                     onChange={(e) => setFireIns(e.target.checked)} /> โอนเบี้ยประกันอัคคีภัย</label>
              <label className="lrq-check"><input type="checkbox" checked={projIns} disabled={!contractNo}
                     onChange={(e) => setProjIns(e.target.checked)} /> โอนเบี้ยประกันโครงการประกัน</label>
            </div>
          </div>
        </div>
      </PcxSec>

      <PcxSec title="รายการปรับปรุง" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 980, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th style={{ width: 90 }}>รหัส</th>
                  <th>รายการ</th>
                  <th style={{ width: 140 }}>ตั้ง ต.บ ถึงวันที่</th>
                  <th style={{ width: 140, textAlign: 'right' }}>เงินต้น</th>
                  <th style={{ width: 140, textAlign: 'right' }}>ดอกเบี้ย</th>
                  <th style={{ width: 130, textAlign: 'right' }}>รวมปรับปรุง</th>
                  <th style={{ width: 140, textAlign: 'right' }}>คงเหลือ</th>
                  <th style={{ width: 66 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const sum = (Number(r.principal) || 0) + (Number(r.interest) || 0);
                  return (
                    <tr key={i}>
                      <td className="muted mono">{i + 1}</td>
                      <td><input className="cfg-input sm" value={r.code} onChange={(e) => updateRow(i, { code: e.target.value })} placeholder="รหัส" /></td>
                      <td><input className="cfg-input sm" value={r.label} onChange={(e) => updateRow(i, { label: e.target.value })} placeholder="ชื่อรายการ" /></td>
                      <td><ErpDate value={r.dueTo} onChange={(v) => ((e) => updateRow(i, { dueTo: e.target.value }))({ target: { value: v } })} className="cfg-input sm" /></td>
                      <td><input className="cfg-input sm" type="number" step="0.01" style={{ textAlign: 'right' }}
                                 value={r.principal} onChange={(e) => updateRow(i, { principal: e.target.value })} placeholder="0.00" /></td>
                      <td><input className="cfg-input sm" type="number" step="0.01" style={{ textAlign: 'right' }}
                                 value={r.interest} onChange={(e) => updateRow(i, { interest: e.target.value })} placeholder="0.00" /></td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(sum)}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney((Number(r.base) || 0) + sum)}</td>
                      <td><button className="btn sm danger" onClick={() => removeRow(i)}><Icon name="close" size={12} /> ลบ</button></td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={9} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>เลือกสัญญาเพื่อเริ่มบันทึกรายการปรับปรุง</td></tr>
                )}
              </tbody>
              {!!rows.length && (
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 600 }}>รวมปรับปรุงทั้งสิ้น</td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{pcxMoney(total)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

Object.assign(window, {
  AccruedInterestAdjustPage, ShareAdjustPage, DebtAdjustPage,
});
