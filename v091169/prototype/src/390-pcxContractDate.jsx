// ════════════════════════════════════════════════════════════════════
//  ประมวลผลและจัดเก็บ › สินเชื่อ (ชุดที่ 2)
//    · ใบคำขอหยุดเก็บหนี้          (process/collect-stop)
//    · ใบคำขอเปลี่ยนแปลงงวดชำระ    (process/inst-change-req)
//    · กำหนดสังกัดลูกหนี้ตัวแทน     (process/agent-affil)
//  ใช้ helper ร่วมจาก 374 (PcxHead / PcxSec / PcxFld / PcxRO / pcxMoney)
// ════════════════════════════════════════════════════════════════════

const pcxContractDate = (d) => (d && d.startDate) || '2022-03-14';

// ════════════════════════════════════════════════════════════════════
//  ① ใบคำขอหยุดเก็บหนี้
// ════════════════════════════════════════════════════════════════════
const PCX_SEND_STATUSES = ['ส่งปกติ', 'งดส่ง', 'งดต้น', 'หยุดเก็บ'];

function CollectStopRequestPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const pickMember = (m) => {
    setMember(m); setSavedNo(''); setError('');
    setRows((m.debts || []).map(d => {
      const info = window.ccdContractInfo ? window.ccdContractInfo(d) : {};
      return {
        contractNo: d.contractNo,
        contractDate: info.startDate || pcxContractDate(info),
        outstanding: Number(d.principalRemaining) || 0,
        sendStatus: 'ส่งปกติ',
        changeNo: '',
        by: window.CCD_USER || 'jeerana',
        note: '',
        selected: false,
      };
    }));
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const clear = () => { setMember(null); setRows([]); setSavedNo(''); setError(''); };

  const picked = rows.filter(r => r.selected);
  const totalOutstanding = picked.reduce((s, r) => s + r.outstanding, 0);

  const doSave = () => {
    if (!member) { setError('กรุณาระบุทะเบียนสมาชิกก่อนบันทึก'); return; }
    if (!picked.length) { setError('กรุณาเลือกสัญญาที่ต้องการหยุดเก็บหนี้อย่างน้อย 1 สัญญา'); return; }
    const noNote = picked.find(r => !r.note.trim());
    if (noNote) { setError('กรุณาระบุหมายเหตุ/เหตุผลการหยุดเก็บหนี้ของสัญญา ' + noNote.contractNo); return; }
    setError('');
    const no = 'CS' + pcxBE().toString().slice(-2) + String(Math.floor(Math.random() * 90000) + 10000);
    setSavedNo(no);
    setRows(rs => rs.map(r => r.selected ? { ...r, sendStatus: 'หยุดเก็บ', changeNo: no } : r));
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ใบคำขอหยุดเก็บหนี้',
      target: member.code + ' · ' + member.name,
      summary: no + ' · หยุดเก็บหนี้ ' + picked.length + ' สัญญา · ยอดคงเหลือรวม ' + pcxMoney(totalOutstanding) + ' บาท',
      changes: picked.map(r => ({ field: r.contractNo, before: 'ส่งปกติ', after: 'หยุดเก็บ · ' + r.note })),
    });
    onToast && onToast('บันทึกใบคำขอหยุดเก็บหนี้ ' + no + ' เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ใบคำขอหยุดเก็บหนี้">
      <PcxHead icon="receipt" title="ใบคำขอหยุดเก็บหนี้"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — เลือกสัญญาของสมาชิกที่ขอหยุดเรียกเก็บ พร้อมระบุเหตุผล"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอหยุดเก็บหนี้…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="รายละเอียดสมาชิก">
        <div className="icr-strip">
          <PcxFld label="ทะเบียน" w={260} required>
            <MemberSearchField member={member} onPick={pickMember} source={window.DN_MEMBERS}
                               title="ค้นหาสมาชิก — ใบคำขอหยุดเก็บหนี้" />
          </PcxFld>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="ทุนเรือนหุ้น" w={170}><PcxRO value={member ? pcxMoney(member.shares) : ''} num mono /></PcxFld>
          <PcxFld label="หน่วย" w={180}><PcxRO value={member ? (member.dept || '') : ''} /></PcxFld>
          <PcxFld label="เลขที่เอกสาร" w={150}><PcxRO value={savedNo} mono placeholder="(Auto)" /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="สัญญาเงินกู้ของสมาชิก" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1080, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th style={{ width: 38 }} />
                  <th>เลขที่สัญญา</th>
                  <th style={{ width: 120 }}>วันที่สัญญา</th>
                  <th style={{ width: 150, textAlign: 'right' }}>ยอดคงเหลือ</th>
                  <th style={{ width: 130 }}>สถานะการส่ง</th>
                  <th style={{ width: 140 }}>เลขที่ขอเปลี่ยน</th>
                  <th style={{ width: 130 }}>ผู้ทำรายการ</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.contractNo} className={r.selected ? 'selected' : ''}>
                    <td>
                      <input type="checkbox" checked={r.selected} disabled={r.sendStatus === 'หยุดเก็บ'}
                             onChange={(e) => updateRow(i, { selected: e.target.checked })} />
                    </td>
                    <td className="mono">{r.contractNo}</td>
                    <td className="mono">{window.fmt.date(r.contractDate)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(r.outstanding)}</td>
                    <td>
                      <select className="cfg-input sm" value={r.sendStatus}
                              onChange={(e) => updateRow(i, { sendStatus: e.target.value })}>
                        {PCX_SEND_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="mono">{r.changeNo || '—'}</td>
                    <td>{r.by}</td>
                    <td>
                      <input className="cfg-input sm" value={r.note} onChange={(e) => updateRow(i, { note: e.target.value })}
                             placeholder="เหตุผลการหยุดเก็บหนี้" />
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={8} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>
                    เลือกสมาชิกเพื่อแสดงสัญญาเงินกู้
                  </td></tr>
                )}
              </tbody>
              {!!picked.length && (
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>เลือก {picked.length} สัญญา · ยอดคงเหลือรวม</td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>{pcxMoney(totalOutstanding)}</td>
                    <td colSpan={4} />
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

// ════════════════════════════════════════════════════════════════════
//  ② ใบคำขอเปลี่ยนแปลงงวดชำระ
// ════════════════════════════════════════════════════════════════════
const PCX_DEBT_STATUS = ['ปกติ', 'ค้างชำระ', 'ผิดนัดชำระ', 'ประนอมหนี้', 'ดำเนินคดี'];
const PCX_PAY_MODES = ['ต้นเท่ากัน', 'คงยอด', 'คงต้น', 'ตามงวด'];
const PCX_RESTRUCT = ['—', 'ปรับโครงสร้างครั้งที่ 1', 'ปรับโครงสร้างครั้งที่ 2', 'ประนอมหนี้'];
const PCX_REQ_STATUS = ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'];

function InstallmentChangeRequestPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [reqDate, setReqDate] = useState(today);
  const [updDate, setUpdDate] = useState(today);
  const [debtStatus, setDebtStatus] = useState('ปกติ');
  const [restruct, setRestruct] = useState('—');
  const [payMode, setPayMode] = useState('ต้นเท่ากัน');
  const [addPrincipalYear, setAddPrincipalYear] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [rate, setRate] = useState('');
  const [terms, setTerms] = useState('');
  const [arrearsPerTerm, setArrearsPerTerm] = useState('');
  const [committeeNo, setCommitteeNo] = useState('');
  const [perTerm, setPerTerm] = useState('');
  const [status, setStatus] = useState('รออนุมัติ');
  const [meetingDate, setMeetingDate] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');

  const contract = member ? (member.debts || []).find(d => d.contractNo === contractNo) : null;
  const info = contract && window.ccdContractInfo ? window.ccdContractInfo(contract) : null;
  const loaded = !!contract;

  const load = (m, debt) => {
    const i = window.ccdContractInfo ? window.ccdContractInfo(debt) : {};
    setMember(m); setContractNo(debt.contractNo);
    setSavedNo(''); setError(''); setNote('');
    setDebtStatus(debt.status === 'ปกติ' ? 'ปกติ' : debt.status || 'ปกติ');
    setRestruct('—'); setPayMode('ต้นเท่ากัน');
    setTerms(String((i.totalTerms || 0) - (i.paidTerms || 0)));
    setPerTerm(String(debt.installment || ''));
    setArrearsPerTerm('');
    setAddPrincipalYear(''); setFromMonth(''); setRate(''); setCommitteeNo(''); setMeetingDate('');
    setStatus('รออนุมัติ');
    setHistory([
      { doc: 'CL' + pcxBE() + '000112', mode: 'คงยอด', perTerm: debt.installment || 0, status: 'อนุมัติ', arrears: 0, addPay: 0, addYear: 0, note: 'รายการก่อนหน้า' },
    ]);
  };
  const clear = () => {
    setMember(null); setContractNo(''); setSavedNo(''); setError(''); setHistory([]);
    setNote(''); setPerTerm(''); setTerms(''); setStatus('รออนุมัติ');
  };

  const doSave = () => {
    if (!loaded) { setError('กรุณาเลือกเลขทะเบียน / เลขที่สัญญาก่อนบันทึก'); return; }
    if (!perTerm || Number(perTerm) <= 0) { setError('กรุณาระบุยอดชำระ/งวด'); return; }
    if (!terms || Number(terms) <= 0) { setError('กรุณาระบุจำนวนงวดชำระ'); return; }
    setError('');
    const no = 'IC' + pcxBE().toString().slice(-2) + String(Math.floor(Math.random() * 90000) + 10000);
    setSavedNo(no);
    setHistory(h => [{
      doc: no, mode: payMode, perTerm: Number(perTerm) || 0, status,
      arrears: Number(arrearsPerTerm) || 0, addPay: 0, addYear: Number(addPrincipalYear) || 0, note,
    }, ...h]);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — ใบคำขอเปลี่ยนแปลงงวดชำระ',
      target: member.code + ' · ' + member.name + ' · ' + contractNo,
      summary: no + ' · ' + payMode + ' ' + pcxMoney(perTerm) + ' บาท/งวด · ' + terms + ' งวด · ' + status,
      changes: [
        { field: 'รูปแบบการชำระ', before: '—', after: payMode },
        { field: 'ชำระ/งวด', before: pcxMoney(contract.installment), after: pcxMoney(perTerm) },
        { field: 'งวดชำระ', before: String((info.totalTerms || 0) - (info.paidTerms || 0)), after: terms },
        { field: 'สถานะหนี้', before: contract.status || '—', after: debtStatus },
        ...(restruct !== '—' ? [{ field: 'ปรับโครงสร้าง', before: '—', after: restruct }] : []),
        ...(note ? [{ field: 'หมายเหตุ', before: '—', after: note }] : []),
      ],
    });
    onToast && onToast('บันทึกใบคำขอเปลี่ยนแปลงงวดชำระ ' + no + ' เรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="ใบคำขอเปลี่ยนแปลงงวดชำระ">
      <PcxHead icon="edit" title="ใบคำขอเปลี่ยนแปลงงวดชำระ"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — บันทึกคำขอเปลี่ยนแปลงรูปแบบ/ยอด/จำนวนงวดชำระของสัญญาเงินกู้"
        actions={<>
          <button className="btn primary sm" onClick={doSave}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clear}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={() => { onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอเปลี่ยนแปลงงวดชำระ…'); setTimeout(() => window.print(), 80); }}>
            <Icon name="print" size={13} /> พิมพ์
          </button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="ข้อมูลคำขอ">
        <div className="icr-strip">
          <PcxFld label="เลขที่เปลี่ยนแปลง" w={150}><PcxRO value={savedNo} mono placeholder="Auto" /></PcxFld>
          <PcxFld label="วันที่ขอเปลี่ยนแปลง" w={160}>
            <ErpDate value={reqDate} onChange={(v) => ((e) => setReqDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
          <PcxFld label="ผู้ป้อน" w={160}><PcxRO value={window.CCD_USER || 'jeerana'} /></PcxFld>
          <PcxFld label="เลขทะเบียน / เลขที่สัญญา" grow w={280} required>
            <ContractSearchField contract={contractNo} member={member} source={window.DN_MEMBERS}
                                 onPick={({ member: m, debt }) => load(m, debt)}
                                 title="ค้นหาสัญญาเงินกู้ — ใบคำขอเปลี่ยนแปลงงวดชำระ"
                                 placeholder="ค้นหาด้วยเลขที่สัญญา หรือเลขทะเบียน…" />
          </PcxFld>
          <PcxFld label="วันที่ปรับปรุง" w={150}>
            <ErpDate value={updDate} onChange={(v) => ((e) => setUpdDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="ชื่อ-ชื่อสกุล" grow w={200}><PcxRO value={member ? member.name : ''} placeholder="(เลือกสมาชิก)" /></PcxFld>
          <PcxFld label="ประเภทเงินกู้" w={160}><PcxRO value={contract ? contract.type : ''} /></PcxFld>
          <PcxFld label="งวดชำระล่าสุด" w={130}><PcxRO value={info ? info.lastPaidTerm : ''} mono /></PcxFld>
          <PcxFld label="ยอดอนุมัติ" w={150}><PcxRO value={info ? pcxMoney(info.approvedAmount) : ''} num mono /></PcxFld>
          <PcxFld label="ยอดรอเบิก" w={140}><PcxRO value={info ? pcxMoney(info.pendingDisburse) : ''} num mono /></PcxFld>
          <PcxFld label="ยอดคงเหลือ" w={150}><PcxRO value={info ? pcxMoney(info.outstanding) : ''} num mono /></PcxFld>
          <PcxFld label="ดอกเบี้ยค้าง" w={140}><PcxRO value={info ? pcxMoney(info.interestArrears) : ''} num mono danger={!!info && info.interestArrears > 0} /></PcxFld>
        </div>
      </PcxSec>

      <PcxSec title="รายละเอียดสัญญา" style={{ marginTop: 12 }}>
        <div className="icr-strip">
          <PcxFld label="สถานะหนี้" w={170}>
            <select className="cfg-input" value={debtStatus} disabled={!loaded} onChange={(e) => setDebtStatus(e.target.value)}>
              {PCX_DEBT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="ปรับโครงสร้าง" w={210}>
            <select className="cfg-input" value={restruct} disabled={!loaded} onChange={(e) => setRestruct(e.target.value)}>
              {PCX_RESTRUCT.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="ชำระแบบ" w={160}>
            <select className="cfg-input" value={payMode} disabled={!loaded} onChange={(e) => setPayMode(e.target.value)}>
              {PCX_PAY_MODES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="เพิ่มต้นปีละ" w={150}>
            <input className="cfg-input" type="number" step="0.01" style={{ textAlign: 'right' }} disabled={!loaded}
                   value={addPrincipalYear} onChange={(e) => setAddPrincipalYear(e.target.value)} placeholder="0.00" />
          </PcxFld>
          <PcxFld label="ตั้งแต่เดือน" w={150}>
            <input className="cfg-input" type="month" disabled={!loaded}
                   value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} />
          </PcxFld>
          <PcxFld label="ดอกเบี้ย (%)" w={130}>
            <input className="cfg-input" type="number" step="0.01" style={{ textAlign: 'right' }} disabled={!loaded}
                   value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0.00" />
          </PcxFld>
        </div>
        <div className="icr-strip" style={{ marginTop: 10 }}>
          <PcxFld label="งวดชำระ" w={130} required>
            <input className="cfg-input" type="number" style={{ textAlign: 'right' }} disabled={!loaded}
                   value={terms} onChange={(e) => { setTerms(e.target.value); setError(''); }} placeholder="0" />
          </PcxFld>
          <PcxFld label="ด/บ ค้าง/งวด" w={150}>
            <input className="cfg-input" type="number" step="0.01" style={{ textAlign: 'right' }} disabled={!loaded}
                   value={arrearsPerTerm} onChange={(e) => setArrearsPerTerm(e.target.value)} placeholder="0.00" />
          </PcxFld>
          <PcxFld label="อช. ครั้งที่" w={130}>
            <input className="cfg-input" disabled={!loaded} value={committeeNo}
                   onChange={(e) => setCommitteeNo(e.target.value)} placeholder="เช่น 3/2569" />
          </PcxFld>
          <PcxFld label="ชำระ/งวด" w={150} required>
            <input className="cfg-input" type="number" step="0.01" style={{ textAlign: 'right' }} disabled={!loaded}
                   value={perTerm} onChange={(e) => { setPerTerm(e.target.value); setError(''); }} placeholder="0.00" />
          </PcxFld>
          <PcxFld label="สถานะ" w={150}>
            <select className="cfg-input" value={status} disabled={!loaded} onChange={(e) => setStatus(e.target.value)}>
              {PCX_REQ_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </PcxFld>
          <PcxFld label="วันที่ประชุม" w={160}>
            <ErpDate value={meetingDate} onChange={(v) => ((e) => setMeetingDate(e.target.value))({ target: { value: v } })} disabled={!loaded} className="cfg-input" />
          </PcxFld>
        </div>
        <div className="icr-note-wrap" style={{ marginTop: 12 }}>
          <textarea className="cfg-input" rows={3} value={note} maxLength={500} disabled={!loaded}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="หมายเหตุ — เหตุผลการขอเปลี่ยนแปลงงวดชำระ" />
          <span className="icr-note-count">{note.length}/500</span>
        </div>
      </PcxSec>

      <PcxSec title="รายละเอียดประวัติ" style={{ marginTop: 12 }}>
        <div className="table-wrap" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 940, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th>เลขที่เอกสาร</th>
                  <th style={{ width: 110 }}>รูปแบบ</th>
                  <th style={{ width: 130, textAlign: 'right' }}>ชำระ/งวด</th>
                  <th style={{ width: 110 }}>สถานะ</th>
                  <th style={{ width: 130, textAlign: 'right' }}>ด/บ ค้าง/งวด</th>
                  <th style={{ width: 140, textAlign: 'right' }}>เพิ่มต้นเงินปีละ</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.doc + i}>
                    <td className="mono">{h.doc}</td>
                    <td>{h.mode}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(h.perTerm)}</td>
                    <td>{h.status}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(h.arrears)}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pcxMoney(h.addYear)}</td>
                    <td className="muted">{h.note || '—'}</td>
                  </tr>
                ))}
                {!history.length && (
                  <tr><td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>
                    เลือกสัญญาเพื่อแสดงประวัติการเปลี่ยนแปลงงวดชำระ
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ③ กำหนดสังกัดลูกหนี้ตัวแทน
// ════════════════════════════════════════════════════════════════════
const PCX_AA_KEY = 'process_agent_affiliation';
const PCX_AA_SEED = [
  { code: '10160', name: 'กสท. สำนักงานใหญ่', contact: 'วรรณา ศรีสุข', address: '99 ถ.แจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210' },
  { code: '10240', name: 'กสท. เขตภาคกลาง', contact: 'ประสิทธิ์ ทองใบ', address: '210 ถ.พหลโยธิน อ.เมือง จ.พระนครศรีอยุธยา 13000' },
  { code: '20110', name: 'กสท. เขตภาคเหนือ', contact: 'สุนีย์ วงศ์คำ', address: '45 ถ.ห้วยแก้ว อ.เมือง จ.เชียงใหม่ 50200' },
  { code: '30140', name: 'กสท. เขตภาคอีสาน', contact: 'ธนากร แสงทอง', address: '77 ถ.มิตรภาพ อ.เมือง จ.ขอนแก่น 40000' },
  { code: '40130', name: 'กสท. เขตภาคใต้', contact: 'อารีย์ บุญมาก', address: '12 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา 90110' },
];
const pcxAaLoad = () => {
  try { const s = localStorage.getItem(PCX_AA_KEY); if (s) return JSON.parse(s); } catch (e) {}
  return PCX_AA_SEED.map(r => ({ ...r }));
};
const pcxAaSave = (list) => { try { localStorage.setItem(PCX_AA_KEY, JSON.stringify(list)); } catch (e) {} };

function PcxAaImportModal({ onClose, onConfirm }) {
  const { useState } = React;
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  const readFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).filter(l => l.trim());
      const parsed = lines.map(l => {
        const p = l.split(/[\t|,]/).map(x => x.trim());
        return { code: p[0] || '', name: p[1] || '', contact: p[2] || '', address: p[3] || '' };
      }).filter(r => r.code || r.name);
      setRows(parsed);
      setErr(parsed.length ? '' : 'ไม่พบข้อมูลในไฟล์ — รูปแบบ: รหัสหน่วยงาน|ชื่อหน่วยงาน|ชื่อผู้ติดต่อ|ที่อยู่');
    };
    reader.readAsText(file, 'utf-8');
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRow = (i) => setRows(rs => rs.filter((_, idx) => idx !== i));
  const addRow = () => setRows(rs => [...rs, { code: '', name: '', contact: '', address: '' }]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 860, maxWidth: '96vw' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>นำเข้าข้อมูลสังกัดลูกหนี้ตัวแทน</h2>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>ไฟล์ .txt — รหัสหน่วยงาน | ชื่อหน่วยงาน | ชื่อผู้ติดต่อ | ที่อยู่</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" accept=".txt,.csv" onChange={(e) => readFile(e.target.files && e.target.files[0])} />
            <span className="muted" style={{ fontSize: 11.5 }}>{fileName || 'ไม่มีไฟล์ที่ถูกเลือก'}</span>
            <span className="spacer" />
            <button className="btn sm" onClick={addRow}><Icon name="plus" size={12} /> เพิ่มแถว</button>
          </div>
          {err && (<div className="sr-error" style={{ marginTop: 10 }}><Icon name="info" size={14} /> {err}</div>)}
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <div className="table-scroll" style={{ maxHeight: 320 }}>
              <table className="tbl" style={{ minWidth: 720, fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>รหัสหน่วยงาน</th>
                    <th style={{ width: 190 }}>ชื่อหน่วยงาน</th>
                    <th style={{ width: 170 }}>ชื่อผู้ติดต่อ</th>
                    <th>ที่อยู่</th>
                    <th style={{ width: 46 }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td><input className="cfg-input sm mono" value={r.code} onChange={(e) => updateRow(i, { code: e.target.value })} /></td>
                      <td><input className="cfg-input sm" value={r.name} onChange={(e) => updateRow(i, { name: e.target.value })} /></td>
                      <td><input className="cfg-input sm" value={r.contact} onChange={(e) => updateRow(i, { contact: e.target.value })} /></td>
                      <td><input className="cfg-input sm" value={r.address} onChange={(e) => updateRow(i, { address: e.target.value })} /></td>
                      <td><button className="btn text sm danger" onClick={() => removeRow(i)}>-</button></td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: '22px 0' }}>เลือกไฟล์ .txt แล้วกด แสดงข้อมูล</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" disabled={!rows.length} onClick={() => onConfirm(rows.filter(r => r.code && r.name))}>
            <Icon name="check" size={13} /> บันทึก {rows.length} รายการ
          </button>
        </div>
      </div>
    </>
  );
}

function AgentAffiliationConfigPage({ onToast }) {
  const { useState } = React;
  const audit = pcxAudit();
  const [list, setList] = useState(pcxAaLoad);
  const [crit, setCrit] = useState({ code: '', name: '', contact: '', address: '' });
  const [applied, setApplied] = useState({ code: '', name: '', contact: '', address: '' });
  const [importOpen, setImportOpen] = useState(false);
  const [draft, setDraft] = useState(null);   // { index|null, rec }
  const [error, setError] = useState('');

  const persist = (next) => { setList(next); pcxAaSave(next); };
  const set = (k, v) => setCrit(p => ({ ...p, [k]: v }));
  const match = (r) => ['code', 'name', 'contact', 'address'].every(k =>
    !applied[k].trim() || String(r[k] || '').toLowerCase().includes(applied[k].trim().toLowerCase()));
  const rows = list.filter(match);

  const doSearch = () => { setApplied({ ...crit }); setError(''); };
  const doReset = () => { setCrit({ code: '', name: '', contact: '', address: '' }); setApplied({ code: '', name: '', contact: '', address: '' }); };
  const doClearAll = () => {
    if (!list.length) { setError('ไม่มีข้อมูลให้ลบ'); return; }
    persist([]);
    audit && audit.log && audit.log({
      action: 'delete', module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
      target: 'ทั้งหมด', summary: 'ลบข้อมูลสังกัดลูกหนี้ตัวแทนทั้งหมด (' + list.length + ' รายการ)',
    });
    onToast && onToast('ลบข้อมูลสังกัดลูกหนี้ตัวแทนทั้งหมดแล้ว');
  };
  const doExport = () => {
    const text = list.map(r => [r.code, r.name, r.contact, r.address].join('|')).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'agent_affiliation.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    onToast && onToast('ส่งออกข้อมูล ' + list.length + ' รายการเรียบร้อยแล้ว');
  };
  const doImport = (recs) => {
    const map = new Map(list.map(r => [r.code, r]));
    recs.forEach(r => map.set(r.code, r));
    const next = [...map.values()];
    persist(next);
    setImportOpen(false);
    audit && audit.log && audit.log({
      action: 'create', module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
      target: recs.length + ' รายการ', summary: 'นำเข้าข้อมูลสังกัดลูกหนี้ตัวแทน ' + recs.length + ' รายการ',
    });
    onToast && onToast('นำเข้าข้อมูล ' + recs.length + ' รายการเรียบร้อยแล้ว');
  };
  const saveDraft = () => {
    const rec = draft.rec;
    if (!rec.code.trim() || !rec.name.trim()) { setError('กรุณาระบุรหัสหน่วยงานและชื่อหน่วยงาน'); return; }
    setError('');
    const next = draft.index == null
      ? [...list, rec]
      : list.map((r, i) => i === draft.index ? rec : r);
    persist(next);
    audit && audit.log && audit.log({
      action: draft.index == null ? 'create' : 'update',
      module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
      target: rec.code + ' · ' + rec.name,
      summary: (draft.index == null ? 'เพิ่ม' : 'แก้ไข') + 'สังกัดลูกหนี้ตัวแทน ' + rec.code + ' — ' + rec.name,
    });
    onToast && onToast('บันทึกสังกัดลูกหนี้ตัวแทน ' + rec.code + ' เรียบร้อยแล้ว');
    setDraft(null);
  };
  const removeRow = (i) => {
    const rec = list[i];
    persist(list.filter((_, idx) => idx !== i));
    audit && audit.log && audit.log({
      action: 'delete', module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
      target: rec.code + ' · ' + rec.name, summary: 'ลบสังกัดลูกหนี้ตัวแทน ' + rec.code,
    });
    onToast && onToast('ลบสังกัด ' + rec.code + ' แล้ว');
  };

  return (
    <div data-screen-label="กำหนดสังกัดลูกหนี้ตัวแทน">
      <PcxHead icon="receipt" title="กำหนดสังกัดลูกหนี้ตัวแทน"
        subtitle="ประมวลผลและจัดเก็บ · สินเชื่อ — ค่าคงที่หน่วยงาน/สังกัดของลูกหนี้ตัวแทน พร้อมนำเข้า–ส่งออกไฟล์"
        actions={<>
          <button className="btn primary sm" onClick={() => { setDraft({ index: null, rec: { code: '', name: '', contact: '', address: '' } }); setError(''); }}>
            <Icon name="plus" size={13} /> เพิ่มหน่วยงาน
          </button>
          <button className="btn sm" onClick={() => setImportOpen(true)}><Icon name="plus" size={13} /> Import</button>
          <button className="btn sm" onClick={doExport}><Icon name="print" size={13} /> Export</button>
          <button className="btn danger sm" onClick={doClearAll}><Icon name="close" size={13} /> ลบทั้งหมด</button>
        </>} />

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <PcxSec title="เงื่อนไขการค้นหา">
        <div className="icr-strip">
          <PcxFld label="รหัสหน่วยงาน" w={160}>
            <input className="cfg-input mono" value={crit.code} onChange={(e) => set('code', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && doSearch()} placeholder="เช่น 10160" />
          </PcxFld>
          <PcxFld label="ชื่อหน่วยงาน" grow w={200}>
            <input className="cfg-input" value={crit.name} onChange={(e) => set('name', e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
          </PcxFld>
          <div className="icr-fld" style={{ width: 190 }}>
            <span className="icr-fld-l">&nbsp;</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={doSearch}>ค้นหา</button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={doReset}>ล้าง</button>
            </div>
          </div>
        </div>
      </PcxSec>

      <PcxSec title={'รายการสังกัดลูกหนี้ตัวแทน (' + rows.length + ' รายการ)'} style={{ marginTop: 12 }}>
        <div className="table-wrap pcx-aa-scope" style={{ marginTop: 10 }}>
          <div className="table-scroll">
            <table className="tbl ac-tbl" style={{ minWidth: 620, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 130 }}>รหัสหน่วยงาน</th>
                  <th>ชื่อหน่วยงาน</th>
                  <th className="center" style={{ width: 96 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const i = list.indexOf(r);
                  return (
                    <tr key={r.code + i} className="ac-row">
                      <td className="center"><span className="ac-code-badge mono">{r.code}</span></td>
                      <td>{r.name}</td>
                      <td className="bud-act-cell">
                        <div className="bud-acts" style={{ justifyContent: 'center', opacity: 1 }}>
                          <button className="bud-act" title="แก้ไข"
                            onClick={() => { setDraft({ index: i, rec: { ...r } }); setError(''); }}>
                            <Icon name="edit" size={13} />
                          </button>
                          <button className="bud-act danger" title="ลบ" onClick={() => removeRow(i)}>
                            <Icon name="trash" size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={3} className="muted" style={{ textAlign: 'center', padding: '26px 0' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PcxSec>

      {draft && (
        <>
          <div className="modal-backdrop" onClick={() => setDraft(null)} />
          <div className="modal-card" style={{ width: 560, maxWidth: '95vw' }}>
            <div className="modal-head">
              <div className="gc-modal-ico"><Icon name="edit" /></div>
              <div style={{ minWidth: 0 }}>
                <h2>{draft.index == null ? 'เพิ่มสังกัดลูกหนี้ตัวแทน' : 'แก้ไขสังกัดลูกหนี้ตัวแทน'}</h2>
              </div>
              <button className="close-btn" onClick={() => setDraft(null)}><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <label className="lt-modal-label">รหัสหน่วยงาน <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={draft.rec.code}
                     onChange={(e) => setDraft(d => ({ ...d, rec: { ...d.rec, code: e.target.value } }))} />
              <label className="lt-modal-label" style={{ marginTop: 12 }}>ชื่อหน่วยงาน <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={draft.rec.name}
                     onChange={(e) => setDraft(d => ({ ...d, rec: { ...d.rec, name: e.target.value } }))} />
              {error && (<div className="sr-error" style={{ marginTop: 10 }}><Icon name="info" size={14} /> {error}</div>)}
            </div>
            <div className="dba-drawer-foot" style={{ position: 'static' }}>
              <button className="btn" onClick={() => setDraft(null)}>ยกเลิก</button>
              <button className="btn primary" onClick={saveDraft}><Icon name="check" size={13} /> บันทึก</button>
            </div>
          </div>
        </>
      )}

      {importOpen && <PcxAaImportModal onClose={() => setImportOpen(false)} onConfirm={doImport} />}
    </div>
  );
}

Object.assign(window, {
  CollectStopRequestPage, InstallmentChangeRequestPage, AgentAffiliationConfigPage,
});
