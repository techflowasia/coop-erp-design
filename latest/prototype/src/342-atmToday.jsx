// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ATM Activities
//  ────────────────────────────────────────────────────────────────────
//  สอบถามรายการกดเงินกู้ผ่านตู้ ATM และรายการเดินบัญชีเงินกู้ของสมาชิก
//  • เลือกสัญญาด้วยรูปแบบกลาง ContractSearchField (เลขทะเบียน/เลขที่สัญญา)
//  • 2 แท็บ: รายการกด ATM · รายการเงินกู้ (+ ฝั่งสหกรณ์ + วิธีคำนวณยอดกด)
//  ข้อมูล: window.ATM_ACT (data-atm-activities.js)
// ════════════════════════════════════════════════════════════════════

const atmToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// ISO → DD/MM/พ.ศ.
const atmDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${Number(y) + 543}`;
};
// "YYYY-MM-DD HH:MM" → "DD/MM/พ.ศ. HH:MM"
const atmDateTime = (s) => {
  if (!s) return '';
  const [date, time] = String(s).split(' ');
  return `${atmDate(date)}${time ? ' ' + time : ''}`;
};
const atmM = (v) => window.fmt.money(Number(v) || 0, 2);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control ล่าง) ────────────────────
function AtmFld({ label, w, grow, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 150 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}</span>
      {children}
    </div>
  );
}

// ─── กล่องค่าในการ์ด "ฝั่งสหกรณ์" (label ซ้าย / ค่าขวา) ──────────────
function AtmKV({ label, value, mono, danger, ok }) {
  return (
    <div className="atm-kv">
      <span className="atm-kv-l">{label}</span>
      <span className={'atm-kv-v' + (mono ? ' mono' : '') + (danger ? ' danger' : '') + (ok ? ' ok' : '')}>{value}</span>
    </div>
  );
}

// ─── เซลล์ในแผงวิธีคำนวณ ─────────────────────────────────────────────
function AtmCalcCell({ label, value, strong }) {
  const n = Number(value) || 0;
  return (
    <div className={'atm-calc-cell' + (strong ? ' strong' : '')}>
      <span className="atm-calc-l">{label}</span>
      <span className={'atm-calc-v mono' + (n < 0 ? ' neg' : '')}>{atmM(n)}</span>
    </div>
  );
}
const AtmOp = ({ ch }) => <span className="atm-calc-op">{ch}</span>;

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function AtmActivitiesPage({ onToast }) {
  const { useState } = React;

  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [txnType, setTxnType] = useState('loan');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(atmToday());
  const [loaded, setLoaded] = useState(false);   // กด "ดึงข้อมูล" แล้วหรือยัง
  const [data, setData] = useState(null);        // window.ATM_ACT[contractNo] | null
  const [tab, setTab] = useState('press');       // press | loan

  const contracts = member ? (member.debts || []) : [];
  const contract = contracts.find(d => d.contractNo === contractNo) || null;

  // เลือกสัญญาจาก popup — ตั้งช่วงวันที่ให้ครอบคลุมรายการทั้งหมดของสัญญา
  const pickContract = (m, debt) => {
    setMember(m);
    setContractNo(debt.contractNo);
    setLoaded(false);
    setData(null);
    setTab('press');
    const a = window.atmActOf(debt.contractNo);
    if (a) {
      const dates = [
        ...a.press.map(p => p.date.slice(0, 10)),
        ...a.loan.map(l => l.txnDate),
      ].filter(Boolean).sort();
      setFromDate(dates[0] || a.coop.startDate);
    } else {
      setFromDate(debt && debt.contractNo ? '' : '');
    }
  };

  const fetchData = () => {
    if (!contract) { onToast && onToast('กรุณาเลือกเลขสมาชิก / เลขที่สัญญาก่อนค้นหา'); return; }
    setData(window.atmActOf(contractNo));
    setLoaded(true);
  };

  const clearScreen = () => {
    setMember(null); setContractNo(''); setLoaded(false); setData(null);
    setFromDate(''); setToDate(atmToday()); setTab('press');
  };

  // กรองตามช่วงวันที่
  const inRange = (iso) => {
    const d = String(iso).slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };
  const press = (loaded && data) ? data.press.filter(p => inRange(p.date)) : [];
  const loan  = (loaded && data) ? data.loan.filter(l => inRange(l.txnDate)) : [];
  const notFound = loaded && !data;

  return (
    <div data-screen-label="ATM Activities">
      {/* ── หัวเรื่อง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <div>
            <h1>ATM Activities</h1>
            <div className="icr-form-sub">ระบบสินเชื่อ · สอบถามรายการกดเงินกู้ผ่านตู้ ATM และรายการเดินบัญชีเงินกู้ของสมาชิก</div>
          </div>
        </div>
      </div>

      {/* ── แถบค้นหา / ดึงข้อมูล ── */}
      <div className="search-card icr-sec">
        <div className="icr-strip">
          <AtmFld label="เลขสมาชิก / เลขที่สัญญา" w={320}>
            <ContractSearchField contract={contractNo} member={member}
                                 onPick={({ member: m, debt }) => pickContract(m, debt)}
                                 source={window.DN_MEMBERS}
                                 title="ค้นหาสัญญาเงินกู้ — ATM Activities"
                                 placeholder="เลขสมาชิก หรือเลขที่สัญญา…" />
          </AtmFld>
          <AtmFld label="ประเภทรายการ" w={150}>
            <select className="cfg-input" value={txnType} onChange={(e) => setTxnType(e.target.value)}>
              {window.ATM_TXN_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
          </AtmFld>
          <AtmFld label="วันที่ทำรายการ (ตั้งแต่)" w={160}>
            <ErpDate value={fromDate} onChange={(v) => ((e) => setFromDate(e.target.value))({ target: { value: v } })} className="cfg-input mono" />
          </AtmFld>
          <AtmFld label="ถึงวันที่" w={160}>
            <ErpDate value={toDate} onChange={(v) => ((e) => setToDate(e.target.value))({ target: { value: v } })} className="cfg-input mono" />
          </AtmFld>
          <div className="icr-fld" style={{ justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn primary" onClick={fetchData}><Icon name="search" size={13} /> ค้นหา</button>
              <button className="btn" onClick={clearScreen}><Icon name="refresh" size={13} /> รีเซ็ต</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ข้อมูลสมาชิก ── */}
      {member && loaded && (
        <div className="search-card icr-sec">
          <div className="icr-strip">
            <AtmFld label="ชื่อสมาชิก" grow w={280}>
              <div className="icr-ro">{member.name}</div>
            </AtmFld>
            <AtmFld label="หน่วยสมาชิก" grow w={280}>
              <div className="icr-ro">{`${member.deptCode || ''} - ${member.dept || ''}`.trim()}</div>
            </AtmFld>
          </div>
          {notFound && (
            <div className="dn-status-alert" style={{ marginTop: 12, background: 'var(--danger-50)', borderColor: 'var(--danger-border)', color: 'var(--danger)' }}>
              <Icon name="close" size={15} /><span>ไม่พบสัญญาเงินกู้ ฉุกเฉิน ATM สำหรับสัญญาที่เลือก</span>
            </div>
          )}
          {loaded && data && data.coop.note && (
            <div className="atm-red-note">
              <Icon name="info" size={13} /> <span>ส่งหนังสือโอนสิทธิ {data.coop.atmContractNo} · เริ่มสัญญา {atmDate(data.coop.startDate)} — <b>{data.coop.note}</b></span>
            </div>
          )}
        </div>
      )}

      {/* ── แท็บ + เนื้อหา ── */}
      {loaded && data && (
        <>
          <div className="atm-tabs">
            <button className={'atm-tab' + (tab === 'press' ? ' active' : '')} onClick={() => setTab('press')}>รายการกด ATM</button>
            <button className={'atm-tab' + (tab === 'loan' ? ' active' : '')} onClick={() => setTab('loan')}>รายการเงินกู้</button>
          </div>

          {tab === 'press' ? (
            <div className="search-card icr-sec">
              <div className="section-head"><span className="head-bar" /><h3>ATM Transactions</h3>
                <div className="head-actions"><span className="muted" style={{ fontSize: 12 }}>{press.length} รายการ</span></div>
              </div>
              <div className="table-wrap"><div className="table-scroll">
                <table className="tbl atm-press-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }} className="center">#</th>
                      <th style={{ width: 150 }}>วันที่รายการ</th>
                      <th style={{ width: 130 }}>สัญญา / บัญชี</th>
                      <th style={{ width: 150 }}>รหัสอ้าง–เลขรายการ</th>
                      <th style={{ width: 150 }}>การทำรายการ</th>
                      <th style={{ width: 110 }} className="center">ผลลัพธ์</th>
                      <th className="num">ยอดกด</th>
                      <th className="num">วงเงินที่ใช้ได้</th>
                      <th className="num">คงเหลือ</th>
                      <th style={{ width: 130 }}>บัญชี KTB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {press.length === 0 ? (
                      <tr><td colSpan="10" className="empty-state">
                        <div style={{ marginBottom: 4 }}><Icon name="wallet" size={22} /></div>
                        ไม่พบรายการกด ATM ในช่วงวันที่ที่เลือก
                      </td></tr>
                    ) : press.map((p, i) => (
                      <tr key={i}>
                        <td className="center mono">{i + 1}</td>
                        <td className="mono" style={{ whiteSpace: 'nowrap' }}>{atmDateTime(p.date)}</td>
                        <td className="mono">{p.account}</td>
                        <td className="mono">{p.refNo}</td>
                        <td>{p.action}</td>
                        <td className="center">
                          <span className={'pill ' + (p.result === 'สำเร็จ' ? 'ok' : 'bad')}>{p.result}</span>
                        </td>
                        <td className="num mono">{p.amount ? atmM(p.amount) : '—'}</td>
                        <td className="num mono">{atmM(p.availCredit)}</td>
                        <td className="num mono">{atmM(p.balance)}</td>
                        <td className="mono">{p.ktb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div></div>
              {press.some(p => p.reason) && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                  หมายเหตุ: รายการที่ไม่สำเร็จ — {press.filter(p => p.reason).map(p => `${p.refNo} (${p.reason})`).join(', ')}
                </div>
              )}
            </div>
          ) : (
            <AtmLoanTab data={data} loan={loan} />
          )}
        </>
      )}

      {/* ── สถานะว่าง (ยังไม่ได้ดึงข้อมูล) ── */}
      {!loaded && (
        <div className="search-card cs-empty">
          <div className="gc-ph-ico"><Icon name="wallet" size={26} /></div>
          <div className="gc-ph-title">ยังไม่ได้ค้นหาข้อมูล</div>
          <div className="gc-ph-sub">เลือกเลขสมาชิก / เลขที่สัญญา กำหนดช่วงวันที่ แล้วกด “ค้นหา” เพื่อแสดงรายการ ATM</div>
        </div>
      )}
    </div>
  );
}

// ─── แท็บ "รายการเงินกู้" — ฝั่งสหกรณ์ + วิธีคำนวณ + ตารางเดินบัญชี ───
function AtmLoanTab({ data, loan }) {
  const c = data.coop, k = data.calc;
  return (
    <>
      <div className="atm-loan-top">
        {/* ข้อมูลฝั่งสหกรณ์ */}
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลฝั่งสหกรณ์</h3></div>
          <div className="atm-kv-grid">
            <AtmKV label="เลขสัญญา" value={c.atmContractNo} mono />
            <AtmKV label="ยอดอนุมัติวงเงิน" value={atmM(c.approvedAmount)} mono />
            <AtmKV label="เริ่มสัญญา" value={atmDate(c.startDate)} mono />
            <AtmKV label="ยอดหนี้ปัจจุบัน" value={atmM(c.currentDebt)} mono danger={c.currentDebt > 0} />
            <AtmKV label="เลขบัญชี" value={c.accountNo} mono />
            <AtmKV label="ยอดถอนได้" value={atmM(c.withdrawable)} mono ok={c.withdrawable > 0} />
          </div>
          <div className="atm-note-box">
            <span className="atm-note-l">หมายเหตุ</span>
            <span className={'atm-note-v' + (c.note ? ' danger' : '')}>{c.note || '—'}</span>
          </div>
        </div>

        {/* วิธีคำนวณยอดกดเงินกู้ ATM */}
        <div className="search-card icr-sec" style={{ marginBottom: 0 }}>
          <div className="section-head"><span className="head-bar" /><h3>วิธีคำนวณยอดกดเงินกู้ ATM</h3></div>
          <div className="atm-calc">
            <div className="atm-calc-row">
              <span className="atm-calc-paren">(</span>
              <AtmCalcCell label="วงเงินที่เหลือที่ใช้คำนวณ" value={k.remainingCredit} />
              <AtmOp ch="+" />
              <AtmCalcCell label="ชำระ (รอโพสต์)" value={k.paying} />
              <span className="atm-calc-paren">)</span>
            </div>
            <div className="atm-calc-row">
              <span className="atm-calc-paren">−(</span>
              <AtmCalcCell label="เบิกเงินกู้ (รอโพสต์)" value={k.drawPending} />
              <AtmOp ch="+" />
              <AtmCalcCell label="อายัดเรียกเก็บ" value={k.seizureCollect} />
              <AtmOp ch="+" />
              <AtmCalcCell label="อายัดยอด" value={k.seizureAmount} />
              <span className="atm-calc-paren">)</span>
            </div>
            <div className="atm-calc-result">
              <AtmCalcCell label="กดเงินกู้ไปแล้ว" value={k.drawnAlready} strong />
              <AtmOp ch="=" />
              <AtmCalcCell label="ยอดที่เบิกได้" value={k.withdrawable} strong />
            </div>
          </div>
        </div>
      </div>

      {/* ตารางเดินบัญชีเงินกู้ */}
      <div className="search-card icr-sec">
        <div className="section-head"><span className="head-bar" /><h3>รายการเดินบัญชีเงินกู้</h3>
          <div className="head-actions"><span className="muted" style={{ fontSize: 12 }}>{loan.length} รายการ</span></div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl atm-loan-tbl">
            <thead>
              <tr>
                <th rowSpan="2" style={{ width: 100 }}>วันที่ทำรายการ</th>
                <th rowSpan="2" style={{ width: 100 }}>วันที่ใบเสร็จ</th>
                <th rowSpan="2" style={{ width: 130 }}>เลขที่ใบเสร็จ</th>
                <th rowSpan="2" style={{ width: 56 }} className="center">รายการ</th>
                <th rowSpan="2" style={{ width: 44 }} className="center">งวด</th>
                <th colSpan="2" className="center atm-grp">รับ</th>
                <th colSpan="2" className="center atm-grp">จ่าย / ยกเลิก</th>
                <th rowSpan="2" className="num">คงเหลือ</th>
                <th rowSpan="2" style={{ width: 92 }}>ต/บ ตั้งแต่</th>
                <th rowSpan="2" style={{ width: 92 }}>ต/บ ถึง</th>
                <th rowSpan="2" className="num">ต/บ งวด</th>
                <th rowSpan="2" className="num">ต/บ ค้าง</th>
                <th rowSpan="2" className="num">ต/บ คืน</th>
                <th rowSpan="2" style={{ width: 64 }} className="center">ประเภทเงิน</th>
                <th rowSpan="2" style={{ width: 180 }}>ผู้บันทึก</th>
              </tr>
              <tr>
                <th className="num atm-sub">เงินต้น</th>
                <th className="num atm-sub">ดอกเบี้ย</th>
                <th className="num atm-sub">เงินต้น</th>
                <th className="num atm-sub">ดอกเบี้ย</th>
              </tr>
            </thead>
            <tbody>
              {loan.length === 0 ? (
                <tr><td colSpan="16" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>
                  ไม่พบรายการเดินบัญชีเงินกู้ในช่วงวันที่ที่เลือก
                </td></tr>
              ) : loan.map((r, i) => {
                const draw = r.item === 'LRC';   // แถวเบิก/กดเงินกู้ = เน้นสีแดง
                return (
                  <tr key={i} className={draw ? 'atm-draw-row' : ''}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{atmDate(r.txnDate)}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{atmDate(r.receiptDate)}</td>
                    <td className="mono">{r.receiptNo || '—'}</td>
                    <td className="center"><span className="chip">{r.item}</span></td>
                    <td className="center mono">{r.term}</td>
                    <td className="num mono">{r.recvP ? atmM(r.recvP) : '0.00'}</td>
                    <td className="num mono">{r.recvI ? atmM(r.recvI) : '0.00'}</td>
                    <td className="num mono">{r.payP ? atmM(r.payP) : '0.00'}</td>
                    <td className="num mono">{r.payI ? atmM(r.payI) : '0.00'}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{atmM(r.balance)}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{atmDate(r.intFrom)}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{atmDate(r.intTo) || '—'}</td>
                    <td className="num mono">{atmM(r.intTerm)}</td>
                    <td className="num mono">{atmM(r.intArrears)}</td>
                    <td className="num mono">{atmM(r.intRefund)}</td>
                    <td className="center"><span className="chip">{r.money}</span></td>
                    <td className="mono" style={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>{r.by || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
    </>
  );
}

Object.assign(window, { AtmActivitiesPage });
