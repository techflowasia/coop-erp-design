// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — คีย์ข้อมูลหักปันผล / เฉลี่ยคืนรายคน
//  หน้าจอบันทึก (editable): ข้อมูลสมาชิก → สรุปยอด → รายการหัก → คงเหลือ
//  · เพิ่ม/แก้ไข/ลบ รายการหักได้หลายรายการ (LON / สอร / CBT)
//  · ยอดเงิน = หักเฉลี่ยคืน + หักปันผล · คงเหลือ = รวมรับ − หักรวม
//  · ใช้ DVK_MEMBERS / dvkRecord · MemberSearchField · ทศนิยม 2 ตำแหน่ง
// ═════════════════════════════════════════════════════════════════

const dvkM = (v) => window.fmt.money(v || 0, 2);
const dvkNum = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function DvkFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 140 } : { width: w || 130 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── การ์ดสรุปยอด (ไอคอนซ้าย + label + ค่าตัวเลขใหญ่) ────────────────
function DvkStat({ label, value, unit, icon, accent, tone }) {
  return (
    <div className="dvk-stat">
      <span className={'dvk-stat-ico' + (accent ? ' ' + accent : '')}><Icon name={icon} size={18} /></span>
      <div className="dvk-stat-body">
        <span className="dvk-stat-l">{label}</span>
        <div className="dvk-stat-v">
          <b className={tone ? 'dvk-v-' + tone : ''}>{value}</b>
          {unit && <span className="dvk-stat-u">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── ค่าในแถวรายละเอียดของการ์ดรายการ (label + value) ────────────────
function DvkDetail({ label, value, mono }) {
  return (
    <div className="dvk-d">
      <span className="dvk-d-l">{label}</span>
      <span className={'dvk-d-v' + (mono ? ' mono' : '')}>{value || '—'}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function DividendKeyPage({ onToast }) {
  const [member, setMember] = React.useState(null);
  const [year, setYear]     = React.useState('2568');
  const [rec, setRec]       = React.useState(null);          // record ที่กำลังแก้ไข (lines อยู่ในนี้)
  const [expanded, setExpanded] = React.useState({});         // แถวที่เปิดแก้ไข
  const [errors, setErrors] = React.useState([]);
  const [modal, setModal]   = React.useState(false);          // popup ค้นหาสมาชิก

  const loadMember = (m, yr) => {
    const useYear = yr || (window.dvkYearsOf(m.code)[0] || '2568');
    setMember(m);
    setYear(useYear);
    setRec(window.dvkRecord(m.code, useYear));
    setExpanded({});
    setErrors([]);
  };

  const pickMember = (m) => {
    loadMember(m);
    setModal(false);
    onToast && onToast('ดึงข้อมูลปันผล/เฉลี่ยคืนของ ' + m.name + ' เรียบร้อย');
  };

  // ล้างหน้าจอกลับสู่สถานะค้นหา (เหมือนเมนูรายละเอียดปันผล)
  const clearScreen = () => {
    setMember(null); setRec(null); setYear('2568'); setExpanded({}); setErrors([]);
  };

  const changeYear = (yr) => {
    setYear(yr);
    if (member) { setRec(window.dvkRecord(member.code, yr)); setExpanded({}); }
  };

  // ── แก้ไขฟิลด์ของแถว ──
  const setLine = (i, patch) => {
    setRec(r => {
      const lines = r.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l);
      return { ...r, lines };
    });
    setErrors([]);
  };
  const addLine = () => {
    setRec(r => ({ ...r, lines: [...r.lines, window.dvkBlankLine()] }));
    setExpanded(e => ({ ...e, [rec.lines.length]: true }));
  };
  const removeLine = (i) => {
    setRec(r => ({ ...r, lines: r.lines.filter((_, idx) => idx !== i) }));
  };
  const toggleRow = (i) => setExpanded(e => ({ ...e, [i]: !e[i] }));

  // ── ยอดคำนวณ ──
  const lines = rec ? rec.lines : [];
  const lineAmt = (l) => dvkNum(l.dedAvg) + dvkNum(l.dedDiv);
  const total       = rec ? rec.dividend + rec.avgReturn : 0;
  const sumDedAvg   = lines.reduce((a, l) => a + dvkNum(l.dedAvg), 0);
  const sumDedDiv   = lines.reduce((a, l) => a + dvkNum(l.dedDiv), 0);
  const totalDeduct = sumDedAvg + sumDedDiv;
  const divRemain   = rec ? rec.dividend - sumDedDiv : 0;
  const avgRemain   = rec ? rec.avgReturn - sumDedAvg : 0;
  const remainTotal = divRemain + avgRemain;
  const arrears     = rec ? rec.arrears : 0;
  const arrearsTotal= arrears + Math.max(remainTotal, 0);
  const remaining   = total - totalDeduct;             // ยอดคงเหลือ (footer)
  const st = window.dvkDebtStatus(rec ? rec.debtStatus : 'normal');

  const overDeduct = remaining < -0.005;

  // ── ตรวจสอบก่อนบันทึก ──
  const validate = () => {
    const errs = [];
    if (overDeduct) errs.push('ยอดหักรวมเกินยอดปันผล + เฉลี่ยคืน (เกิน ' + dvkM(Math.abs(remaining)) + ' บาท)');
    lines.forEach((l, i) => {
      const t = window.dvkType(l.type);
      const tag = 'รายการที่ ' + (i + 1) + ' (' + l.type + ')';
      if (lineAmt(l) < 0) errs.push(tag + ': ยอดเงินต้องไม่ติดลบ');
      if (t.need === 'bank' && (!l.bank || !l.branch || !l.bankAcct))
        errs.push(tag + ': โอนธนาคารต้องระบุ ธนาคาร / สาขา / เลขที่บัญชี');
      if (t.need === 'coop' && !l.coopAcct)
        errs.push(tag + ': ต้องระบุเลขบัญชีเงินฝากสหกรณ์');
      if (t.need === 'contract' && !l.contractNo)
        errs.push(tag + ': โอนชำระหนี้ต้องระบุเลขที่สัญญาเงินกู้');
    });
    if (rec && rec.debtStatus === 'default' && !lines.some(l => l.type === 'LON'))
      errs.push('สมาชิกมีสถานะผิดนัด — ต้องมีรายการหักชำระหนี้ (LON) อย่างน้อย 1 รายการ');
    return errs;
  };

  const doSave = () => {
    if (!rec) { onToast && onToast('กรุณาเลือกสมาชิกก่อนบันทึก'); return; }
    const errs = validate();
    setErrors(errs);
    if (errs.length) { onToast && onToast('พบ ' + errs.length + ' ข้อที่ต้องแก้ไขก่อนบันทึก'); return; }
    onToast && onToast('บันทึกรายการหักปันผล/เฉลี่ยคืนของ ' + member.name + ' เรียบร้อย');
  };
  const doConfirm = () => {
    if (!rec) return;
    const errs = validate();
    setErrors(errs);
    if (errs.length) { onToast && onToast('ไม่สามารถยืนยันได้ — ตรวจสอบข้อมูล ' + errs.length + ' ข้อ'); return; }
    onToast && onToast('ยืนยันรายการเรียบร้อย — ส่งเข้ารับ/จ่ายเงินแล้ว');
  };
  const clearLines = () => { if (rec) { setRec(r => ({ ...r, lines: [] })); setExpanded({}); setErrors([]); } };
  const reload = () => { if (member) { loadMember(member, year); onToast && onToast('โหลดข้อมูลตั้งต้นใหม่'); } };
  const doPrint = () => { if (!rec) { onToast && onToast('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; } setTimeout(() => window.print(), 80); };

  return (
    <div data-screen-label="คีย์ข้อมูลหักปันผล - เฉลี่ยคืนรายคน" className="dvk-page">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="wallet" size={20} /></span>
          <div>
            <h1>คีย์ข้อมูลหักปันผล - เฉลี่ยคืนรายคน</h1>
            <div className="icr-form-sub">บันทึกข้อมูลหักปันผลและเฉลี่ยคืนรายคน</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn primary sm" onClick={() => setModal(true)}><Icon name="search" size={13} /> ค้นหา</button>
          <button className="btn sm" onClick={doSave}><Icon name="download" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn sm" onClick={() => window.history.back()}><Icon name="chevLeft" size={13} /> กลับ</button>
        </div>
      </div>

      {/* ── ① ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="dvk-card-head">
          <span className="dvk-head-ico"><Icon name="user" size={16} /></span>
          <h3>ข้อมูลสมาชิก</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11.5 }}>
            {member ? 'ปีปันผล ' + year : '— ค้นหาเลขทะเบียนเพื่อแสดงข้อมูล —'}
          </span>
        </div>

        <div className="icr-strip">
          <DvkFld label="ปีปันผล" w={140} required>
            <select className="cfg-input mono" value={year} onChange={(e) => changeYear(e.target.value)} disabled={!member}>
              {(member && window.dvkYearsOf(member.code).length ? window.dvkYearsOf(member.code) : window.DVK_YEARS)
                .map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </DvkFld>
          <DvkFld label="ทะเบียน" w={190} required>
            <div className="icr-search-box" onClick={() => setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </DvkFld>
          <DvkFld label="ชื่อ - สกุล" grow w={260}>
            <div className={'icr-ro' + (member ? '' : ' empty')}>{member ? member.name : '(ดึงอัตโนมัติ)'}</div>
          </DvkFld>
        </div>

        <div className="icr-strip" style={{ marginTop: 12, alignItems: 'flex-end' }}>
          <DvkFld label="สังกัด" grow w={420}>
            <div className={'icr-ro' + (member ? '' : ' empty')} style={{ justifyContent: 'flex-start' }}>
              {member ? member.dept : '(ดึงอัตโนมัติ)'}
            </div>
          </DvkFld>
          <DvkFld label="สถานะผิดนัดชำระ" w={150}>
            <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
              {member ? <span className={'pill ' + st.pill}>{st.l}</span> : <span className="muted">—</span>}
            </div>
          </DvkFld>
        </div>

        {/* แผงตรวจสอบหนี้ก่อนจ่าย — แสดงเมื่อสถานะ "ผิดนัด" (เหมือนเมนูรายละเอียดปันผล) */}
        {rec && rec.debtStatus === 'default' && (() => {
          const debt = window.dvkDebtSummary(member.code, year);
          return (
            <div className="pd-debt-alert">
              <div className="pd-debt-head">
                <Icon name="info" size={15} />
                <span><b>สมาชิกมีสถานะผิดนัด</b> — ต้องนำปันผล/เฉลี่ยคืนไปหักชำระหนี้ก่อนตามเงื่อนไขของสหกรณ์ (ต้องมีรายการหักชำระหนี้ LON อย่างน้อย 1 รายการ)</span>
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
                      <span className="pd-debt-amt mono">{dvkM(d.arrears)}</span>
                    </div>
                  ))}
                  <div className="pd-debt-foot">
                    <span>รวมยอดค้างชำระที่ต้องตรวจสอบ</span>
                    <span className="pd-debt-amt mono">{dvkM(debt.totalArrears)} บาท</span>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 12, paddingLeft: 23 }}>— ไม่พบรายการหนี้ค้างชำระในระบบ กรุณาตรวจสอบเงื่อนไขเพิ่มเติม —</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── ② สรุปยอดปันผลและเฉลี่ยคืน ── */}
      <div className="search-card icr-sec">
        <div className="dvk-card-head">
          <span className="dvk-head-ico"><Icon name="report" size={16} /></span>
          <h3>สรุปยอดปันผลและเฉลี่ยคืน</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11.5 }}>หน่วย: บาท · ทศนิยม 2 ตำแหน่ง</span>
        </div>

        <div className="dvk-stats dvk-stats-6">
          <DvkStat label="อัตราปันผล"   value={rec ? rec.divRate.toFixed(2) + '%' : '—'} icon="money"  accent="a-green" tone="green" />
          <DvkStat label="อัตราเฉลี่ยคืน" value={rec ? rec.avgRate.toFixed(2) + '%' : '—'} icon="swap"   accent="a-green" tone="green" />
          <DvkStat label="ค/บ สะสม"     value={rec ? dvkM(rec.accumShare) : '—'} icon="shares" accent="a-blue"  tone="blue" />
          <DvkStat label="ปันผล"        value={rec ? dvkM(rec.dividend) : '—'}   icon="money"  accent="a-green" tone="green" />
          <DvkStat label="เฉลี่ยคืน"     value={rec ? dvkM(rec.avgReturn) : '—'}  icon="guarantee" accent="a-green" tone="green" />
          <DvkStat label="รวม"          value={rec ? dvkM(total) : '—'}          icon="report" accent="a-blue"  tone="blue" />
        </div>
        <div className="dvk-stats dvk-stats-5" style={{ marginTop: 14 }}>
          <DvkStat label="ปันผลคงเหลือ"    value={rec ? dvkM(divRemain) : '—'}   icon="money"  accent="a-violet" tone={divRemain > 0.005 ? '' : 'danger'} />
          <DvkStat label="เฉลี่ยคืนคงเหลือ" value={rec ? dvkM(avgRemain) : '—'}   icon="guarantee" accent="a-violet" tone={avgRemain > 0.005 ? '' : 'danger'} />
          <DvkStat label="คงเหลือรวม"      value={rec ? dvkM(remainTotal) : '—'} icon="report" accent="a-violet" tone={remainTotal > 0.005 ? '' : 'danger'} />
          <DvkStat label="ค้างจ่าย"        value={rec ? dvkM(arrears) : '—'}     icon="receipt" accent="a-amber" tone={arrears > 0.005 ? '' : 'danger'} />
          <DvkStat label="ค้างจ่ายรวม"     value={rec ? dvkM(arrearsTotal) : '—'} icon="wallet" accent="a-amber" tone={arrearsTotal > 0.005 ? '' : 'danger'} />
        </div>
      </div>

      {/* ── ③ รายละเอียดการทำรายการ ── */}
      <div className="search-card icr-sec">
        <div className="dvk-card-head">
          <span className="dvk-head-ico"><Icon name="receipt" size={16} /></span>
          <h3>รายละเอียดการทำรายการ</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" disabled={!rec}><Icon name="cog" size={13} /> Set default รับจ่าย</button>
          <button className="btn sm danger" onClick={clearLines} disabled={!rec || !lines.length}><Icon name="close" size={13} /> ลบรายการที่บันทึกไว้</button>
        </div>

        <div className="dvk-additem">
          <button className="btn dashed sm" onClick={addLine} disabled={!rec}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
        </div>

        {errors.length > 0 && (
          <div className="dvk-errors">
            <div className="dvk-err-head"><Icon name="info" size={14} /> ตรวจสอบข้อมูลก่อนบันทึก ({errors.length})</div>
            <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        {!rec ? (
          <div className="empty-state" style={{ padding: 28 }}>— กรุณาค้นหาสมาชิกเพื่อแสดงรายการหัก —</div>
        ) : lines.length === 0 ? (
          <div className="empty-state" style={{ padding: 28 }}>— ยังไม่มีรายการหัก — กดปุ่ม “เพิ่มรายการ” เพื่อเริ่มบันทึก —</div>
        ) : (
          <div className="dvk-items">
            {lines.map((l, i) => {
              const t = window.dvkType(l.type);
              const open = !!expanded[i];
              const amt = lineAmt(l);
              return (
                <div className={'dvk-item' + (open ? ' open' : '')} key={i}>
                  {/* แถวหัวรายการ */}
                  <div className="dvk-item-head">
                    <span className="dvk-item-no">{i + 1}</span>
                    <span className="dvk-item-chip">{t.label}</span>
                    <div className="dvk-amt"><span className="dvk-amt-l">หักเฉลี่ยคืน</span><span className="dvk-amt-v mono">{dvkM(l.dedAvg)}</span></div>
                    <div className="dvk-amt"><span className="dvk-amt-l">หักปันผล</span><span className="dvk-amt-v mono">{dvkM(l.dedDiv)}</span></div>
                    <div className="dvk-amt"><span className="dvk-amt-l">ยอดเงิน</span><span className="dvk-amt-v mono dvk-amt-total">{dvkM(amt)}</span></div>
                    <span className="dvk-item-sp" />
                    <span className="dvk-gen"><Icon name="history" size={12} /> {l.gen}{l.genAt ? ' - ' + l.genAt : ''}</span>
                    <button className="dvk-icon-btn" onClick={() => toggleRow(i)} aria-label="แก้ไข" title="แก้ไขรายการ">
                      <span className={'dvk-chev' + (open ? ' up' : '')}><Icon name="chevDown" size={14} /></span>
                    </button>
                    <button className="dvk-icon-btn danger" onClick={() => removeLine(i)} aria-label="ลบ" title="ลบรายการ"><Icon name="close" size={14} /></button>
                  </div>

                  {/* แถวรายละเอียด (อ่าน) */}
                  {!open && (
                    <div className="dvk-item-detail">
                      {t.need === 'bank' ? (
                        <>
                          <DvkDetail label="ธนาคาร" value={l.bank ? (window.DVK_BANKS.find(b => b.v === l.bank)?.l || l.bank) : ''} />
                          <DvkDetail label="สาขา" value={l.branch} />
                          <DvkDetail label="เลขที่บัญชี" value={l.bankAcct} mono />
                          <DvkDetail label="หมายเหตุ" value={l.note} />
                        </>
                      ) : (
                        <>
                          <DvkDetail label="ชื่อทายาท" value={l.heir} />
                          <DvkDetail label="เงินฝาก สอ." value={l.coopAcct} mono />
                          <DvkDetail label="เลขที่สัญญา" value={l.contractNo} mono />
                          <DvkDetail label="หมายเหตุ" value={l.note} />
                        </>
                      )}
                    </div>
                  )}

                  {/* แผงแก้ไข */}
                  {open && (
                    <div className="dvk-item-edit">
                      <div className="icr-strip">
                        <DvkFld label="ประเภทรายการ" w={200} required>
                          <select className="cfg-input" value={l.type} onChange={(e) => setLine(i, { type: e.target.value })}>
                            {window.DVK_TXN_TYPES.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
                          </select>
                        </DvkFld>
                        <DvkFld label="หักเฉลี่ยคืน" w={150}>
                          <input className="cfg-input mono num" type="number" step="0.01" value={l.dedAvg}
                                 onChange={(e) => setLine(i, { dedAvg: e.target.value })} style={{ textAlign: 'right' }} />
                        </DvkFld>
                        <DvkFld label="หักปันผล" w={150}>
                          <input className="cfg-input mono num" type="number" step="0.01" value={l.dedDiv}
                                 onChange={(e) => setLine(i, { dedDiv: e.target.value })} style={{ textAlign: 'right' }} />
                        </DvkFld>
                        <DvkFld label="ยอดเงิน (รวม)" w={150}>
                          <div className="icr-ro num mono" style={{ background: 'var(--surface-inset, #fafbfa)', fontWeight: 600 }}>{dvkM(amt)}</div>
                        </DvkFld>
                      </div>

                      {t.need === 'bank' ? (
                        <div className="icr-strip" style={{ marginTop: 12 }}>
                          <DvkFld label="ชื่อทายาท / ผู้รับเงิน" grow w={200}>
                            <input className="cfg-input" value={l.heir} onChange={(e) => setLine(i, { heir: e.target.value })} placeholder="ชื่อผู้รับเงิน" />
                          </DvkFld>
                          <DvkFld label="ธนาคาร" w={180} required>
                            <select className="cfg-input" value={l.bank} onChange={(e) => setLine(i, { bank: e.target.value })}>
                              <option value="">— เลือกธนาคาร —</option>
                              {window.DVK_BANKS.map(b => <option key={b.v} value={b.v}>{b.l}</option>)}
                            </select>
                          </DvkFld>
                          <DvkFld label="สาขา" grow w={170} required>
                            <input className="cfg-input" value={l.branch} onChange={(e) => setLine(i, { branch: e.target.value })} placeholder="รหัส / ชื่อสาขา" />
                          </DvkFld>
                          <DvkFld label="เลขที่บัญชีธนาคาร" w={170} required>
                            <input className="cfg-input mono" value={l.bankAcct} onChange={(e) => setLine(i, { bankAcct: e.target.value })} placeholder="xxx-x-xxxxx-x" />
                          </DvkFld>
                          <DvkFld label="หมายเหตุ" grow w={180}>
                            <input className="cfg-input" value={l.note} onChange={(e) => setLine(i, { note: e.target.value })} placeholder="หมายเหตุรายการ" />
                          </DvkFld>
                        </div>
                      ) : (
                        <div className="icr-strip" style={{ marginTop: 12 }}>
                          <DvkFld label="ชื่อทายาท / ผู้รับเงิน" grow w={190}>
                            <input className="cfg-input" value={l.heir} onChange={(e) => setLine(i, { heir: e.target.value })} placeholder="ชื่อผู้รับเงิน" />
                          </DvkFld>
                          <DvkFld label="บัญชีเงินฝากสหกรณ์" w={180} required={t.need === 'coop'}>
                            <input className="cfg-input mono" value={l.coopAcct} onChange={(e) => setLine(i, { coopAcct: e.target.value })} placeholder="xxx-x-xxxxx-x"
                                   disabled={t.need !== 'coop'} />
                          </DvkFld>
                          <DvkFld label="เลขที่สัญญาเงินกู้" w={170} required={t.need === 'contract'}>
                            <input className="cfg-input mono" value={l.contractNo} onChange={(e) => setLine(i, { contractNo: e.target.value })} placeholder="เลขที่สัญญา"
                                   disabled={t.need !== 'contract'} />
                          </DvkFld>
                          <DvkFld label="หมายเหตุ" grow w={200}>
                            <input className="cfg-input" value={l.note} onChange={(e) => setLine(i, { note: e.target.value })} placeholder="หมายเหตุรายการ" />
                          </DvkFld>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── แถบสรุปยอดคงเหลือ + ปุ่มยืนยัน (sticky) ── */}
      <div className="dvk-foot">
        <span className="dvk-foot-ico"><Icon name="wallet" size={22} /></span>
        <div className="dvk-foot-bal">
          <span className="dvk-foot-l">ยอดคงเหลือ</span>
          <div className="dvk-foot-v">
            <b className={overDeduct ? 'dvk-v-danger' : (remaining > 0.005 ? 'dvk-v-green' : '')}>{dvkM(remaining)}</b>
            <span className="dvk-foot-u">บาท</span>
          </div>
        </div>
        <span className="dvk-foot-divider" />
        <span className="dvk-foot-sp" />
        <button className="btn primary lg" onClick={doSave} disabled={!rec}><Icon name="download" size={15} /> บันทึกข้อมูล</button>
        <button className="btn lg dvk-confirm" onClick={doConfirm} disabled={!rec}><Icon name="check" size={15} /> ยืนยันรายการ</button>
        <button className="btn lg danger" onClick={reload} disabled={!rec}><Icon name="close" size={15} /> ยกเลิก</button>
      </div>

      {modal && <MemberSearchModal onPick={pickMember} onClose={() => setModal(false)}
                                   title="ค้นหาสมาชิก" source={window.DVK_MEMBERS} searchFn={window.dvkSearchMembers} />}
    </div>
  );
}

Object.assign(window, { DividendKeyPage });
