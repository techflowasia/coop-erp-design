// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › บัญชีและธุรกรรม — อายัดบัญชี
//  เลือกบัญชี → เลือกประเภทการอายัด (0–6) → เหตุผล/จำนวนเงินที่อายัด →
//  ส่งขออนุมัติ (สถานะเดิม / สถานะอนุมัติ / ผู้อนุมัติ)
// ════════════════════════════════════════════════════════════════════

const FRZ_USER = 'จันทร์เพ็ญ มาลี';
const FRZ_MACHINE = 'CNT-01';

// ประเภทรายการอายัด (ตามระบบเดิม 0–6)
const FREEZE_TYPES = [
  { code: '0', label: 'ยกเลิกอายัด',            pill: 'ok',   clear: true },
  { code: '1', label: 'อายัดจำนวนเงิน',          pill: 'bad',  amount: true },
  { code: '2', label: 'อายัดการเคลื่อนไหว',       pill: 'bad'  },
  { code: '3', label: 'อายัดรอปิดบัญชี',          pill: 'warn' },
  { code: '4', label: 'อายัดห้ามถอน/ปิดบัญชี',    pill: 'bad'  },
  { code: '5', label: 'อายัดห้ามฝากเงิน',         pill: 'warn' },
  { code: '6', label: 'อายัดเพื่อ ATM',           pill: 'info' },
];
const freezeType = (c) => FREEZE_TYPES.find(t => t.code === c);

// สถานะการอายัดของแต่ละบัญชี (localStorage: accNo → record)
function frzLoad() {
  try { const s = localStorage.getItem('dep_freezes'); if (s) return JSON.parse(s); } catch (e) {}
  return {};
}
function frzSave(map) { try { localStorage.setItem('dep_freezes', JSON.stringify(map)); } catch (e) {} }

function DepFreezePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [freezes, setFreezes] = useState(frzLoad);
  const [acc, setAcc] = useState(null);

  const [txnDate, setTxnDate] = useState(new Date().toISOString().slice(0, 10));
  const [ftype, setFtype] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [approver, setApprover] = useState('');
  const [slip, setSlip] = useState(null);

  const cur = acc ? accounts.find(a => a.accNo === acc.accNo) || acc : null;
  const branch = cur ? cur.accNo.split('-')[0] : '';
  const current = cur ? freezes[cur.accNo] : null;   // สถานะอายัดเดิม
  const tdef = freezeType(ftype);
  const amtNum = Number(amount) || 0;

  const reset = () => { setFtype(''); setReason(''); setAmount(''); setApprover(''); setSlip(null); };

  const canSubmit = cur && ftype && reason.trim() &&
    (!tdef?.amount || (amtNum > 0 && amtNum <= cur.balance)) &&
    (!tdef?.clear || !!current);

  const reqNo = useMemo(() => {
    const n = Object.keys(freezes).length + 1;
    return 'FRZ-2569-' + String(n).padStart(4, '0');
  }, [freezes]);

  const submit = () => {
    const next = { ...freezes };
    const prevLabel = current ? freezeType(current.type)?.label : 'ปกติ (ไม่มีอายัด)';
    if (tdef.clear) {
      delete next[cur.accNo];
    } else {
      next[cur.accNo] = { type: ftype, label: tdef.label, reason: reason.trim(),
        amount: tdef.amount ? amtNum : 0, date: txnDate, by: FRZ_USER,
        approveStatus: 'pending', approver: approver.trim(), reqNo };
    }
    setFreezes(next); frzSave(next);

    audit.log({ action: tdef.clear ? 'update' : 'create', module: 'เงินฝาก — อายัดบัญชี',
      target: `${cur.member} · ${cur.name}`,
      summary: `${tdef.label} บัญชี ${cur.accNo}${tdef.amount ? ` จำนวน ${fmt.money(amtNum, 2)} บาท` : ''} — เหตุผล: ${reason.trim()}`,
      changes: [{ field: 'สถานะอายัด', before: prevLabel, after: tdef.clear ? 'ปกติ (ไม่มีอายัด)' : tdef.label }] });

    setSlip({
      title: 'ใบคำขออายัดบัญชีเงินฝาก', sub: `เลขที่คำขอ ${reqNo} · ${fmt.date(txnDate)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: cur.accNo, mono: true },
        { k: 'ชื่อบัญชี / สมาชิก', v: `${cur.name} · ${cur.member}` },
        { k: 'ประเภทเงินฝาก', v: cur.type },
        { k: 'ยอดเงินคงเหลือ', v: fmt.money(cur.balance, 2), mono: true },
        { k: 'สถานะเดิม', v: prevLabel },
        { k: 'ประเภทรายการ', v: `${tdef.code}-${tdef.label}` },
        ...(tdef.amount ? [{ k: 'จำนวนเงินที่อายัด', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true }] : []),
        { k: 'เหตุผลการอายัด', v: reason.trim() },
        { k: 'สถานะอนุมัติ', v: 'รออนุมัติ' },
        { k: 'ผู้อนุมัติ', v: approver.trim() || '—' },
      ],
      foot: tdef.clear ? 'ยกเลิกการอายัดบัญชี — รอผู้มีอำนาจอนุมัติ' : 'ส่งคำขออายัดบัญชี — รอผู้มีอำนาจอนุมัติก่อนมีผลบังคับ',
    });
    onToast && onToast(`${tdef.label} บัญชี ${cur.accNo} — บันทึกคำขอเรียบร้อย (รออนุมัติ)`);
    setAcc(null); reset();
  };

  return (
    <div data-screen-label="หน้าอายัดบัญชีเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อายัดบัญชี</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ระงับการทำรายการบัญชีเงินฝากตามประเภทการอายัด — ระบบบันทึกผู้ทำรายการและส่งขออนุมัติก่อนมีผล</div>
        </div>
        <span className="spacer" />
        <div style={{ minWidth: 360 }}><DepAccountPicker accounts={accounts} value={acc} onlyActive={false} onSelect={(a) => { setAcc(a); reset(); }} /></div>
      </div>

      {!cur ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 6 }}><Icon name="lock" size={26} /></div>
          ค้นหาและเลือกบัญชีเงินฝากที่ต้องการอายัด / ยกเลิกอายัด
        </div>
      ) : (
        <div className="dep-form-cols">
          <div className="dep-form-main">
            <DepAccountCard acc={cur} extra={<>
              <div className="dep-acc-f"><span className="k">สาขา</span><span className="v mono">{branch}</span></div>
              <div className="dep-acc-f"><span className="k">เลขที่สมาชิก</span><span className="v mono">{cur.member}</span></div>
            </>} />

            {current ? (
              <div className="dat-warn" style={{ marginTop: 12, background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
                <Icon name="lock" size={14} />
                <span>บัญชีนี้<b>ถูกอายัดอยู่</b> — {current.label}{current.amount ? ` (${fmt.money(current.amount, 2)} บาท)` : ''} · เหตุผล: {current.reason} · เมื่อ {fmt.date(current.date)}</span>
              </div>
            ) : (
              <div className="dat-warn" style={{ marginTop: 12, background: 'var(--success-50)', borderColor: 'color-mix(in srgb, var(--success) 28%, transparent)', color: 'var(--success)' }}>
                <Icon name="check" size={14} />
                <span>บัญชีนี้อยู่ในสถานะ<b>ปกติ</b> — ไม่มีการอายัด</span>
              </div>
            )}

            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="user" n="1" title="รายละเอียดผู้ทำรายการ" />
              <div className="dat-grid">
                <DatFieldLite label="ผู้ทำรายการ"><input className="cfg-input" value={FRZ_USER} readOnly style={{ background: 'var(--surface-2, #f5f5f5)' }} /></DatFieldLite>
                <DatFieldLite label="วันทำรายการ"><ErpDate value={txnDate} onChange={(v) => ((e) => setTxnDate(e.target.value))({ target: { value: v } })} className="cfg-input mono" /></DatFieldLite>
                <DatFieldLite label="เครื่องที่ทำรายการ"><input className="cfg-input mono" value={FRZ_MACHINE} readOnly style={{ background: 'var(--surface-2, #f5f5f5)' }} /></DatFieldLite>
              </div>
            </div>

            <div className="search-card dat-section" style={{ marginTop: 12 }}>
              <DepSecHead icon="lock" n="2" title="รายละเอียดรายการ" />
              <div className="dat-grid">
                <DatFieldLite label="ประเภทรายการ" required>
                  <select className="cfg-input" value={ftype} onChange={(e) => { setFtype(e.target.value); setAmount(''); }}>
                    <option value="">— เลือกประเภทการอายัด —</option>
                    {FREEZE_TYPES.map(t => <option key={t.code} value={t.code}>{t.code}-{t.label}</option>)}
                  </select>
                </DatFieldLite>
                {tdef?.amount && (
                  <DatFieldLite label="จำนวนเงินที่อายัด" required>
                    <input className="cfg-input mono" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ textAlign: 'right' }} />
                  </DatFieldLite>
                )}
                <DatFieldLite label="เหตุผลการอายัด" required span={tdef?.amount ? 1 : 2}>
                  <input className="cfg-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="เช่น คำสั่งศาล / อายัดตามคำร้อง / รอปิดบัญชี" />
                </DatFieldLite>
              </div>
              {tdef?.amount && amtNum > cur.balance && (
                <div style={{ padding: '0 16px 14px', color: 'var(--danger)', fontSize: 12 }}><Icon name="info" size={12} /> จำนวนเงินที่อายัดต้องไม่เกินยอดคงเหลือ ({fmt.money(cur.balance, 2)} บาท)</div>
              )}
            </div>
          </div>

          {/* ── ขวา: เพิ่มเติม (สถานะ) + ปุ่ม ── */}
          <div className="dep-form-side">
            <div className="search-card dat-section">
              <DepSecHead icon="info" title="เพิ่มเติม" />
              <div style={{ padding: '4px 16px 16px', display: 'grid', gap: 12 }}>
                <div>
                  <div className="dat-label">เลขที่คำขอ</div>
                  <div className="mono" style={{ fontWeight: 600 }}>{reqNo} <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>(อัตโนมัติ)</span></div>
                </div>
                <div>
                  <div className="dat-label">สถานะเดิม</div>
                  {current ? <span className={"pill " + (freezeType(current.type)?.pill || 'bad')}>{current.label}</span> : <span className="pill ok">ปกติ</span>}
                </div>
                <div>
                  <div className="dat-label">สถานะอนุมัติ</div>
                  <span className="pill warn">รออนุมัติ</span>
                </div>
                <DatFieldLite label="ผู้อนุมัติ"><input className="cfg-input" value={approver} onChange={(e) => setApprover(e.target.value)} placeholder="ชื่อผู้มีอำนาจอนุมัติ" /></DatFieldLite>
              </div>
            </div>
            <div className="dep-submit-bar">
              <button className="btn block primary lg" disabled={!canSubmit} onClick={submit}>
                <Icon name={tdef?.clear ? 'unlock' : 'lock'} /> {tdef?.clear ? 'ยกเลิกอายัดและส่งอนุมัติ' : 'บันทึกคำขออายัด'}
              </button>
              {slip && <button className="btn block" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์ใบคำขอ</button>}
            </div>
            <p className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}><Icon name="info" size={11} /> คำขออายัด/ยกเลิกอายัดจะมีผลบังคับหลังผู้มีอำนาจอนุมัติ — ระบบบันทึกประวัติผู้ทำรายการทุกครั้ง</p>
          </div>
        </div>
      )}

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepFreezePage });
