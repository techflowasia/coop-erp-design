// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — รายละเอียดปันผล (Dividend detail)
//  หน้าจอตรวจสอบข้อมูลปันผล/เฉลี่ยคืนรายสมาชิก (read-only inquiry)
//  · ค้นหาด้วยเลขทะเบียน → ดึงข้อมูลสมาชิก/อัตรา/ยอดเงินอัตโนมัติ
//  · แสดงสถานะปันผล (ปกติ/ผิดนัด) — ผิดนัดจะแสดงแผงตรวจสอบหนี้ก่อนจ่าย
//  · ตารางรายการเคลื่อนไหวของยอดปันผล
//  ใช้ DnMemberSearchModal / DN_MEMBERS · ยอดทศนิยม 2 ตำแหน่ง
// ═════════════════════════════════════════════════════════════════

const PD_USER = 'เจ้าหน้าที่ฝ่ายสินเชื่อและติดตามหนี้';
const pdM = (v) => window.fmt.money(v || 0, 2);

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function PdFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 140 } : { width: w || 130 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function PdRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── ฟิลด์ที่มีหน่วยต่อท้าย (%) ──────────────────────────────────────
function PdSuffixRO({ value, unit }) {
  return (
    <div className="icr-suffix">
      <div className="icr-ro num mono" style={{ paddingRight: 38, justifyContent: 'flex-end' }}>{value}</div>
      <span className="icr-suffix-u">{unit}</span>
    </div>
  );
}

// ─── การ์ดสรุปยอด (tile) ─────────────────────────────────────────────
function PdStat({ label, value, icon, accent, danger, primary }) {
  return (
    <div className={'shc-stat pd-stat' + (primary ? ' pd-stat-accent' : '')}>
      <div className="shc-stat-body">
        <span className="shc-stat-l">{label}</span>
        <div className="shc-stat-v">
          <b className={danger ? 'pd-val-danger' : (primary ? 'pd-val-accent' : '')}>{value}</b>
          <span className="shc-stat-u">บาท</span>
        </div>
      </div>
      <span className={'shc-stat-ico' + (accent ? ' ' + accent : '')}><Icon name={icon} size={18} /></span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function DividendDetailPage({ onToast }) {
  const [member, setMember] = React.useState(null);
  const [year, setYear]     = React.useState('2567');
  const [modal, setModal]   = React.useState(false);
  // สถานะปันผลที่กำลังดู (เริ่มจากค่าในข้อมูล — ปรับเพื่อตรวจสอบก่อนจ่ายได้)
  const [statusView, setStatusView] = React.useState('normal');

  const rec = member ? window.pdRecord(member.code, year) : null;
  const memberYears = member ? window.pdYearsOf(member.code) : [];

  // sync สถานะเมื่อเปลี่ยนสมาชิก/ปี
  React.useEffect(() => { if (rec) setStatusView(rec.status); }, [member, rec && rec.year]);

  const st = window.pdStatus(statusView);
  const isDefault = statusView === 'default';

  // ── ยอดคำนวณ ──
  const total       = rec ? rec.dividend + rec.avgReturn : 0;
  const remainTotal = rec ? rec.divRemain + rec.avgRemain : 0;
  const arrearsTotal= rec ? rec.divArrears + rec.avgArrears : 0;
  const debt = (member && isDefault) ? window.pdDebtSummary(member.code) : { rows: [], totalArrears: 0 };

  const loadMember = (m) => {
    setMember(m);
    setModal(false);
    const yrs = window.pdYearsOf(m.code);
    const r = window.pdRecord(m.code, year);
    if (r) { setYear(r.year); setStatusView(r.status); }
    else if (yrs.length) setYear(yrs[0]);
    onToast && onToast(`ดึงข้อมูลปันผลของ ${m.name} เรียบร้อย`);
  };

  const clearScreen = () => {
    setMember(null); setStatusView('normal'); setYear('2567');
  };

  const doPrint = () => {
    if (!rec) { onToast && onToast('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์รายละเอียดปันผล…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="รายละเอียดปันผล">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="money" size={20} /></span>
          <div>
            <h1>รายละเอียดปันผล</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · ตรวจสอบยอดปันผล/เฉลี่ยคืนรายสมาชิก ก่อนจ่ายหรือประกอบการติดตามหนี้</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn primary sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
        </div>
      </div>

      {/* ── ① รายละเอียดสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="icr-sec-head">
          <h3>รายละเอียดสมาชิก</h3>
          <span className="muted" style={{ fontSize: 11.5 }}>
            {member ? 'ข้อมูลปันผลรายบุคคล · ปีปันผล ' + year : '— ค้นหาเลขทะเบียนเพื่อแสดงข้อมูล —'}
          </span>
        </div>

        {/* แถบฟิลด์ที่ 1 */}
        <div className="icr-strip">
          <PdFld label="ปีปันผล" w={130} required>
            <select className="cfg-input mono" value={year} onChange={(e) => setYear(e.target.value)} disabled={!member}>
              {(memberYears.length ? memberYears : window.PD_YEARS).map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </PdFld>
          <PdFld label="ทะเบียน" w={172} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </PdFld>
          <PdFld label="ชื่อ - สกุล" grow w={220} required>
            <PdRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" />
          </PdFld>
          <PdFld label="สังกัด" grow w={220}>
            <PdRO value={member ? member.dept : ''} placeholder="(ดึงอัตโนมัติ)" />
          </PdFld>
        </div>

        {/* แถบฟิลด์ที่ 2 */}
        <div className="icr-strip" style={{ marginTop: 12 }}>
          <PdFld label="อัตราปันผล (%)" w={140}>
            <PdSuffixRO value={rec ? rec.rate.toFixed(2) : '—'} unit="%" />
          </PdFld>
          <PdFld label="อัตราเฉลี่ยคืน (%)" w={150}>
            <PdSuffixRO value={rec ? rec.avgRate.toFixed(2) : '—'} unit="%" />
          </PdFld>
          <PdFld label="รอบบัญชี / ประเภทสะสม" grow w={200}>
            <PdRO value={rec ? window.pdAccum(rec.accumType).l : ''} placeholder="—" />
          </PdFld>
          <PdFld label="สถานะปันผล" w={170} required>
            <div className="icr-dotsel">
              <span className="icr-dot" style={{ background: st.pill === 'ok' ? 'var(--success)' : 'var(--danger)' }} />
              <select className="cfg-input" value={statusView} onChange={(e) => setStatusView(e.target.value)} disabled={!member}>
                {window.PD_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
          </PdFld>
          <PdFld label="ผล" w={96}>
            <div style={{ display: 'flex', alignItems: 'center', height: 34 }}>
              {member ? <span className={'pill ' + st.pill}>{st.l}</span> : <span className="muted">—</span>}
            </div>
          </PdFld>
        </div>

        {/* แผงตรวจสอบหนี้ก่อนจ่าย — แสดงเมื่อสถานะ "ผิดนัด" */}
        {member && isDefault && (
          <div className="pd-debt-alert">
            <div className="pd-debt-head">
              <Icon name="info" size={15} />
              <span><b>สมาชิกมีสถานะผิดนัด</b> — ตรวจสอบยอดหนี้ค้างก่อนดำเนินการจ่ายเงิน ระบบจะนำปันผล/เฉลี่ยคืนไปหักชำระหนี้หรือกันยอดไว้ก่อนตามเงื่อนไขของสหกรณ์</span>
            </div>
            {debt.rows.length > 0 ? (
              <div className="pd-debt-rows">
                {debt.rows.map((d, i) => (
                  <div className="pd-debt-row" key={i}>
                    <span className="pd-debt-type">{d.type}</span>
                    <span className="mono muted">{d.contractNo}</span>
                    <span className={'pill ' + (/ดำเนินคดี|บอกเลิก/.test(d.status) ? 'info' : 'bad')}>{d.status}</span>
                    <span className="pd-debt-sp" />
                    {d.overdue > 0 && <span className="muted" style={{ fontSize: 12 }}>ค้าง {d.overdue} งวด</span>}
                    <span className="pd-debt-amt mono">{pdM(d.arrears)}</span>
                  </div>
                ))}
                <div className="pd-debt-foot">
                  <span>รวมยอดค้างชำระที่ต้องตรวจสอบ</span>
                  <span className="pd-debt-amt mono">{pdM(debt.totalArrears)} บาท</span>
                </div>
              </div>
            ) : (
              <div className="muted" style={{ fontSize: 12, paddingLeft: 23 }}>— ไม่พบรายการหนี้ค้างชำระในระบบ กรุณาตรวจสอบเงื่อนไขเพิ่มเติม —</div>
            )}
          </div>
        )}
      </div>

      {/* ── ② ยอดปันผลและเฉลี่ยคืน ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>ยอดปันผลและเฉลี่ยคืน</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11.5 }}>หน่วย: บาท · ทศนิยม 2 ตำแหน่ง</span>
        </div>

        <div className="pd-stat-group">
          <div className="pd-stat-grouplabel">ปันผล · เฉลี่ยคืน</div>
          <div className="pd-stats c3">
            <PdStat label="ปันผล"     value={rec ? pdM(rec.dividend) : '—'}  icon="money"  accent="a-green" />
            <PdStat label="เฉลี่ยคืน"  value={rec ? pdM(rec.avgReturn) : '—'} icon="swap"   accent="a-green" />
            <PdStat label="รวม"        value={rec ? pdM(total) : '—'}         icon="report" primary />
          </div>
        </div>

        <div className="pd-stat-group">
          <div className="pd-stat-grouplabel">ยอดคงเหลือ · ค้างจ่าย</div>
          <div className="pd-stats c4">
            <PdStat label="คงเหลือ"     value={rec ? pdM(rec.divRemain) : '—'}  icon="wallet" accent="a-violet" />
            <PdStat label="คงเหลือรวม"  value={rec ? pdM(remainTotal) : '—'}    icon="wallet" accent="a-violet" />
            <PdStat label="ค้างจ่าย"    value={rec ? pdM(rec.divArrears) : '—'} icon="history" accent="a-amber" danger={!!(rec && rec.divArrears > 0)} />
            <PdStat label="ค้างจ่ายรวม" value={rec ? pdM(arrearsTotal) : '—'}   icon="history" accent="a-amber" danger={!!(rec && arrearsTotal > 0)} />
          </div>
        </div>
      </div>

      {/* ── ③ รายการเคลื่อนไหว ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>รายการเคลื่อนไหว</h3>
        </div>

        <div className="table-wrap" style={{ marginTop: 4 }}>
          <div className="table-scroll">
            <table className="tbl" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th className="center" style={{ width: 70 }}>ลำดับ</th>
                  <th className="center" style={{ width: 140 }}>วันที่ทำรายการ</th>
                  <th className="num" style={{ width: 150 }}>ยอดทำรายการ</th>
                  <th className="num" style={{ width: 150 }}>คงเหลือ</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {rec && rec.moves.length ? rec.moves.map((mv, i) => {
                  const neg = mv.amount < 0;
                  return (
                    <tr key={i}>
                      <td className="center mono">{i + 1}</td>
                      <td className="center mono">{window.fmt.date(mv.date)}</td>
                      <td className="num mono" style={neg ? { color: 'var(--danger)' } : null}>
                        {mv.amount === 0 ? pdM(0) : (neg ? pdM(mv.amount) : pdM(mv.amount))}
                      </td>
                      <td className="num mono" style={{ fontWeight: 500 }}>{pdM(mv.balance)}</td>
                      <td>{mv.note || '—'}</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="5"><div className="empty-state" style={{ padding: 24 }}>{member ? '— ไม่มีรายการเคลื่อนไหว —' : '— กรุณาค้นหาสมาชิกเพื่อแสดงรายการเคลื่อนไหว —'}</div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pagination">
          <span className="muted" style={{ fontSize: 12, marginRight: 'auto' }}>
            แสดง {rec && rec.moves.length ? 1 : 0} - {rec ? rec.moves.length : 0} จาก {rec ? rec.moves.length : 0} รายการ
          </span>
          <button className="btn sm" disabled><Icon name="chevLeft" /></button>
          <button className="btn sm primary">1</button>
          <button className="btn sm" disabled><Icon name="chevRight" /></button>
        </div>
      </div>

      <div className="ie-foot-note" style={{ marginTop: 4 }}>
        <Icon name="info" size={13} />
        <span className="muted">หน้าจอนี้ใช้สำหรับตรวจสอบข้อมูลเท่านั้น — ไม่สามารถแก้ไขยอดปันผลโดยตรง การปรับปรุงยอดต้องทำผ่านเมนูปรับปรุงรายการหรือเมนูอนุมัติแยกต่างหาก</span>
      </div>

      {modal && <DnMemberSearchModal onPick={loadMember} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { DividendDetailPage });
