// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — ลงรับธนาณัติ (Record incoming money order)
//  บันทึกรับธนาณัติ / ตั๋วแลกเงินไปรษณีย์ที่สมาชิกส่งมาชำระ — เลือกสมาชิก,
//  ระบุประเภท · ค่าธรรมเนียม · จำนวนเงิน แล้วบันทึกลงทะเบียนรับธนาณัติ
// ════════════════════════════════════════════════════════════════════
const { useState: morUseState, useMemo: morUseMemo } = React;

const MOR_KEY = 'mo_receive_v1';
const morToday = () => new Date().toISOString().slice(0, 10);
const morNum = (v) => Number(String(v || 0).replace(/,/g, '')) || 0;
const morUser = () => (window.FCX_CURRENT_USER && window.FCX_CURRENT_USER.name) || 'จันทร์เพ็ญ มาลี';
const morPayTypes = () => window.MO_PAY_TYPES || ['ธนาณัติ', 'ตั๋วแลกเงินไปรษณีย์'];
const morStatuses = () => window.MO_CASH_STATUS || { pending: { l: 'รอขึ้นเงิน', pill: 'warn' }, cashed: { l: 'ขึ้นเงินแล้ว', pill: 'ok' } };

const morLoad = () => { try { return JSON.parse(localStorage.getItem(MOR_KEY)) || []; } catch (e) { return []; } };
const morSave = (l) => { try { localStorage.setItem(MOR_KEY, JSON.stringify(l)); } catch (e) {} };
const morNextNo = (list) => {
  const be = new Date().getFullYear() + 543;
  const prefix = `MOR-${be}-`;
  const max = list.reduce((m, r) => {
    const n = String(r.id || '').startsWith(prefix) ? parseInt(r.id.slice(prefix.length), 10) : 0;
    return Math.max(m, isNaN(n) ? 0 : n);
  }, 0);
  return prefix + String(max + 1).padStart(4, '0');
};

function MorFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}
function MorRO({ value, mono, placeholder, auto }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (auto ? ' icr-auto' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

function MoReceiveForm({ nextNo, onSave, onToast }) {
  const fmt = window.fmt;
  const today = morToday();

  const [member, setMember]       = morUseState(null);
  const [transferDate, setTDate]  = morUseState(today);
  const [recordDate, setRDate]    = morUseState(today);
  const [payType, setPayType]     = morUseState(morPayTypes()[0]);
  const [fee, setFee]             = morUseState(0);
  const [status, setStatus]       = morUseState('pending');
  const [amount, setAmount]       = morUseState(0);
  const [error, setError]         = morUseState('');

  const deptLabel = member ? window.affilLabel(member.deptCode, member.dept) : '';
  const net = morNum(amount) - morNum(fee);
  const statuses = morStatuses();

  const submit = () => {
    if (!member) { setError('กรุณาค้นหาและเลือกสมาชิกก่อนบันทึก'); return; }
    if (morNum(amount) <= 0) { setError('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return; }
    if (morNum(fee) > morNum(amount)) { setError('ค่าธรรมเนียมต้องไม่เกินจำนวนเงินธนาณัติ'); return; }
    setError('');
    const rec = {
      id: nextNo, transferDate, recordDate, sysDate: today,
      memberCode: member.code, memberName: member.name,
      deptCode: member.deptCode, dept: member.dept,
      payType, fee: morNum(fee), status, amount: morNum(amount),
      by: morUser(), createdAt: new Date().toISOString(),
    };
    onSave(rec);
  };

  const demoMembers = (window.DN_MEMBERS || []).slice(0, 3);

  return (
    <div data-screen-label="ลงรับธนาณัติ">
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="mail" size={20} /></span>
          <div>
            <h1>ลงรับธนาณัติ</h1>
            <div className="icr-form-sub">ระบบงานการเงิน · บันทึกรับธนาณัติ / ตั๋วแลกเงินไปรษณีย์ที่สมาชิกส่งมาชำระ</div>
          </div>
        </div>
        <span className="spacer" />
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}

      <div className="po-top-grid">
        <div className="search-card icr-sec">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลการลงรับ</h3></div>
          <div className="icr-strip">
            <MorFld label="เลขที่เอกสาร" w={160}><MorRO value={nextNo} mono auto /></MorFld>
            <MorFld label="วันที่โอน" w={150} required>
              <ErpDate value={transferDate} onChange={(v) => ((e) => setTDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </MorFld>
            <MorFld label="วันที่บันทึก" w={150} required>
              <ErpDate value={recordDate} onChange={(v) => ((e) => setRDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </MorFld>

            <MorFld label="ทะเบียน" grow w={260} required>
              <MemberSearchField member={member} onPick={setMember}
                source={window.DN_MEMBERS} searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)}
                title="ค้นหาสมาชิก — ลงรับธนาณัติ" changeLabel="เปลี่ยน"
                placeholder="ค้นหาเลขทะเบียน / ชื่อ…" />
            </MorFld>
            <MorFld label="ชื่อ-สกุล" grow w={220}><MorRO value={member ? member.name : ''} placeholder="—" /></MorFld>

            <MorFld label="สังกัด" grow w={260}><MorRO value={deptLabel} placeholder="—" /></MorFld>
            <MorFld label="วันที่ปัจจุบัน" w={150}><MorRO value={fmt.date(today)} /></MorFld>
            <MorFld label="ผู้ทำรายการ" grow w={180}><MorRO value={morUser()} /></MorFld>

            <MorFld label="ประเภท" w={200} required>
              <select className="cfg-input" value={payType} onChange={(e) => setPayType(e.target.value)}>
                {morPayTypes().map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </MorFld>
            <MorFld label="ค่าธรรมเนียม" w={160}>
              <input className="cfg-input mono" style={{ textAlign: 'right' }} inputMode="decimal"
                     value={fmt.money(morNum(fee), 2)} onFocus={(e) => e.target.select()}
                     onChange={(e) => setFee(morNum(e.target.value.replace(/[^\d.]/g, '')))} />
            </MorFld>
            <MorFld label="สถานะ" w={180} required>
              <select className="cfg-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.keys(statuses).map(k => <option key={k} value={k}>{statuses[k].l}</option>)}
              </select>
            </MorFld>
          </div>
        </div>

        <div className="po-total-card">
          <div className="po-total-head"><span>จำนวนเงิน</span><Icon name="mail" size={14} /></div>
          <input className="mor-amt-input mono" inputMode="decimal"
                 value={fmt.money(morNum(amount), 2)} onFocus={(e) => e.target.select()}
                 onChange={(e) => setAmount(morNum(e.target.value.replace(/[^\d.]/g, '')))} />
          <div className="po-total-unit">บาท</div>
          <div className="po-total-break">
            <div><span>ค่าธรรมเนียม</span><b>{fmt.money(morNum(fee), 2)}</b></div>
            <div><span>ยอดสุทธิที่ขึ้นเงิน</span><b>{fmt.money(net, 2)}</b></div>
            <div><span>สถานะ</span><b>{(statuses[status] || {}).l || '—'}</b></div>
          </div>
        </div>
      </div>

      <div className="po-actionbar">
        <button className="btn primary" onClick={submit}><Icon name="check" size={14} /> บันทึกลงรับ</button>
        {demoMembers.length > 0 && (
          <span className="po-demo muted">
            ตัวอย่าง:&nbsp;
            {demoMembers.map((m, i) => (
              <React.Fragment key={m.code}>
                {i > 0 && ' · '}
                <button className="ct-example mono" onClick={() => setMember(m)}>{m.code}</button>
              </React.Fragment>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function MoReceivePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const fmt = window.fmt;
  const [list, setList] = morUseState(morLoad);
  const [formKey, setFormKey] = morUseState(0);
  const statuses = morStatuses();

  const persist = (next) => { setList(next); morSave(next); };

  const saveNew = (rec) => {
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: 'การเงิน — ลงรับธนาณัติ', target: rec.id,
      summary: `ลงรับธนาณัติ ${rec.id} · ${rec.memberName} · ${fmt.money(rec.amount, 2)} บาท`,
    });
    onToast && onToast(`ลงรับธนาณัติ ${rec.id} เรียบร้อยแล้ว`);
    setFormKey(k => k + 1);
  };

  const sorted = morUseMemo(() => [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)), [list]);

  return (
    <div>
      <MoReceiveForm key={formKey} nextNo={morNextNo(list)} onSave={saveNew} onToast={onToast} />

      <div className="search-card" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
        <div className="bud-toolbar">
          <div style={{ fontWeight: 600, fontSize: 13 }}>ทะเบียนรับธนาณัติ ล่าสุด</div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ width: 150 }}>เลขที่เอกสาร</th>
                <th style={{ width: 100 }}>วันที่โอน</th>
                <th style={{ width: 100 }}>วันที่บันทึก</th>
                <th style={{ minWidth: 180 }}>สมาชิก</th>
                <th style={{ width: 150 }}>ประเภท</th>
                <th className="right" style={{ width: 120 }}>ค่าธรรมเนียม</th>
                <th className="right" style={{ width: 130 }}>จำนวนเงิน</th>
                <th className="center" style={{ width: 110 }}>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr><td colSpan={8} className="center muted" style={{ padding: '26px 12px' }}>ยังไม่มีรายการ</td></tr>
              )}
              {sorted.map(rec => {
                const st = statuses[rec.status] || { l: rec.status, pill: 'neutral' };
                return (
                  <tr key={rec.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{rec.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(rec.transferDate)}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(rec.recordDate)}</td>
                    <td>{rec.memberName}<span className="muted mono" style={{ fontSize: 11 }}> · {rec.memberCode}</span></td>
                    <td>{rec.payType}</td>
                    <td className="right mono">{fmt.money(rec.fee, 2)}</td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(rec.amount, 2)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MoReceivePage });
