// ═════════════════════════════════════════════════════════════════
//  ระบบงานทะเบียนและติดตามหนี้ — ทดสอบการคำนวณปันผล / เฉลี่ยคืน
//  เครื่องมือทดสอบคำนวณปันผล (จากหุ้น) + เฉลี่ยคืน (จากดอกเบี้ยเงินกู้)
//  รายบุคคล ก่อนประมวลผลจริง — ดึงข้อมูลสมาชิก/หุ้น/ดอกเบี้ย แล้วคำนวณ
//  ใช้ data-dividend-calc.js · MemberSearchModal · ทศนิยม 2 ตำแหน่ง
// ═════════════════════════════════════════════════════════════════

const dcM  = (v) => window.fmt.money(v || 0, 2);
const dcNum = (v) => { const n = parseFloat(String(v).replace(/,/g, '')); return isNaN(n) ? 0 : n; };

// ─── ฟิลด์ label ซ้าย : control ขวา (จัดคอลอนตรงกัน) ─────────────────
function DcField({ label, lw, required, children }) {
  return (
    <div className="dct-field">
      <span className="dct-field-l" style={lw ? { flexBasis: lw } : null}>
        {label}{required && <span className="cfg-required"> *</span>} :
      </span>
      <div className="dct-field-c">{children}</div>
    </div>
  );
}

// ─── กล่องค่าอ่านอย่างเดียว (พื้นเทาอ่อน) ────────────────────────────
function DcRO({ value, mono, num, placeholder, locked }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '') + (locked ? ' sr-locked' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── แถวค่าในการ์ดผล (label : ช่องค่าใหญ่) ──────────────────────────
function DcValueRow({ label, value, tone, big, box }) {
  return (
    <div className="dct-vrow">
      <span className="dct-vrow-l">{label} :</span>
      <div className={'dct-vrow-v' + (box ? ' box' : '') + (big ? ' big' : '') + (tone ? ' ' + tone : '')}>
        {value}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function DividendCalcTestPage({ onToast }) {
  const [member, setMember]   = React.useState(null);
  const [year, setYear]       = React.useState('2568');
  const [source, setSource]   = React.useState('yearend');
  const [dateStart, setDateStart] = React.useState('01/01/2568');
  const [dateEnd, setDateEnd]     = React.useState('31/12/2568');
  const [divRate, setDivRate] = React.useState('4.00');
  const [avgRate, setAvgRate] = React.useState('10.00');
  const [ded, setDed]         = React.useState({ arrears: '0.00', seize: '0.00', tax: '0.00', other: '0.00' });
  const [result, setResult]   = React.useState(null);     // ผลการคำนวณล่าสุด
  const [tab, setTab]         = React.useState('monthly');
  const [modal, setModal]     = React.useState(false);
  const [errors, setErrors]   = React.useState([]);

  // ── ค้นหา/เลือกสมาชิก → ดึงข้อมูลหลัก + ตั้งค่าตั้งต้น ──
  const pickMember = (m) => {
    setMember(m);
    setModal(false);
    const yrs = window.dctYearsOf(m.code);
    const yr = yrs.includes(year) ? year : (yrs[0] || '2568');
    setYear(yr);
    setDateStart('01/01/' + yr);
    setDateEnd('31/12/' + yr);
    const base = window.dctBase(m.code, yr);
    if (base) { setDivRate(base.divRate.toFixed(2)); setAvgRate(base.avgRate.toFixed(2)); }
    setResult(null);
    setErrors([]);
    onToast && onToast('ดึงข้อมูลสมาชิก ' + m.name + ' เรียบร้อย');
  };

  const changeYear = (yr) => {
    setYear(yr);
    setDateStart('01/01/' + yr);
    setDateEnd('31/12/' + yr);
    setResult(null);
  };

  const setDedField = (k, v) => { setDed(d => ({ ...d, [k]: v })); };

  // ── Validation ก่อนคำนวณ ──
  const validate = () => {
    const errs = [];
    if (!member) errs.push('กรุณาระบุทะเบียนสมาชิก');
    if (!year) errs.push('กรุณาเลือกปีปันผล');
    if (!dateStart) errs.push('กรุณาระบุวันที่เริ่มต้น');
    if (!dateEnd) errs.push('กรุณาระบุวันที่สิ้นสุด');
    if (divRate === '' || isNaN(dcNum(divRate))) errs.push('กรุณาระบุอัตราปันผลเป็นตัวเลข');
    if (avgRate === '' || isNaN(dcNum(avgRate))) errs.push('กรุณาระบุอัตราเฉลี่ยคืนเป็นตัวเลข');
    if (dcNum(divRate) < 0) errs.push('อัตราปันผลต้องไม่ติดลบ');
    if (dcNum(avgRate) < 0) errs.push('อัตราเฉลี่ยคืนต้องไม่ติดลบ');
    if (member && !window.dctBase(member.code, year))
      errs.push('ไม่พบข้อมูลหุ้น/ดอกเบี้ยของสมาชิกในปีปันผลที่เลือก');
    return errs;
  };

  // ── ปุ่มคำนวณ ──
  const doCalc = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) { onToast && onToast('พบ ' + errs.length + ' ข้อที่ต้องแก้ไขก่อนคำนวณ'); setResult(null); return; }
    const r = window.dctCompute(member.code, year, {
      divRate: dcNum(divRate), avgRate: dcNum(avgRate), source,
      status: member.status,
      deductions: { arrears: dcNum(ded.arrears), seize: dcNum(ded.seize), tax: dcNum(ded.tax), other: dcNum(ded.other) },
    });
    setResult(r);
    if (member.status !== 'normal') {
      onToast && onToast('คำนวณเรียบร้อย — สมาชิกสถานะ “' + window.dctStatus(member.status).l + '” โปรดตรวจสอบสิทธิ์');
    } else {
      onToast && onToast('คำนวณปันผลและเฉลี่ยคืนเรียบร้อยแล้ว');
    }
  };

  const checkEligibility = () => {
    if (!member) { onToast && onToast('กรุณาเลือกสมาชิกก่อนตรวจสอบสิทธิ์'); return; }
    const st = window.dctStatus(member.status);
    onToast && onToast(st.eligible
      ? 'สมาชิก ' + member.name + ' อยู่ในสถานะ “' + st.l + '” — มีสิทธิ์รับปันผล/เฉลี่ยคืน'
      : 'สมาชิกอยู่ในสถานะ “' + st.l + '” — ต้องตรวจสอบเงื่อนไขสิทธิ์ก่อนคำนวณ');
  };

  const doReset = () => {
    setMember(null); setYear('2568'); setSource('yearend');
    setDateStart('01/01/2568'); setDateEnd('31/12/2568');
    setDivRate('4.00'); setAvgRate('10.00');
    setDed({ arrears: '0.00', seize: '0.00', tax: '0.00', other: '0.00' });
    setResult(null); setErrors([]); setTab('monthly');
    onToast && onToast('รีเซ็ตหน้าจอเรียบร้อย');
  };

  const doPrint = () => {
    if (!result) { onToast && onToast('กรุณาคำนวณก่อนพิมพ์/ส่งออก'); return; }
    onToast && onToast('กำลังเตรียมเอกสารผลการคำนวณ…');
    setTimeout(() => window.print(), 80);
  };

  const st = member ? window.dctStatus(member.status) : null;
  const dedTotalLive = dcNum(ded.arrears) + dcNum(ded.seize) + dcNum(ded.tax) + dcNum(ded.other);
  const sourceLabel = (window.DCT_CALC_SOURCES.find(s => s.v === source) || {}).l || '';

  return (
    <div data-screen-label="ทดสอบการคำนวณปันผล เฉลี่ยคืน" className="dct-page">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="money" size={20} /></span>
          <div>
            <h1>ทดสอบการคำนวณปันผล เฉลี่ยคืน</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · ตรวจสอบการคำนวณปันผล/เฉลี่ยคืนรายบุคคล ก่อนประมวลผลจริง</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={() => onToast && onToast('เปิดประวัติการคำนวณ (สาธิต)')}><Icon name="history" size={13} /> ประวัติการคำนวณ</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์ / ส่งออก</button>
          <button className="btn sm" onClick={doReset}><Icon name="refresh" size={13} /> รีเซ็ต</button>
        </div>
      </div>

      {/* ── ① ข้อมูลสมาชิก ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>ข้อมูลสมาชิก</h3>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="muted" style={{ fontSize: 11.5 }}>
            {member ? 'ปีปันผล ' + year : '— ค้นหาเลขทะเบียนสมาชิกเพื่อแสดงข้อมูล —'}
          </span>
        </div>

        <div className="dct-member-grid">
          <DcField label="ทะเบียนสมาชิก" lw="120px" required>
            <div className="icr-search-box" onClick={() => setModal(true)} style={{ maxWidth: 230 }}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button" aria-label="ค้นหาสมาชิก"><Icon name="search" size={14} /></button>
            </div>
          </DcField>
          <DcField label="ชื่อ - สกุล" lw="86px">
            <DcRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" locked />
          </DcField>

          <DcField label="สังกัด(ปัจจุบัน)" lw="120px">
            <DcRO value={member ? member.deptCurrent : ''} placeholder="(ดึงอัตโนมัติ)" locked />
          </DcField>
          <DcField label="สถานะสมาชิก" lw="86px">
            <div style={{ display: 'flex', alignItems: 'center', height: 32 }}>
              {member ? <span className={'chip ' + (st.pill === 'ok' ? 'success' : st.pill === 'warn' ? 'warning' : st.pill === 'bad' ? 'danger' : 'info')}>{st.l}</span>
                      : <span className="muted">—</span>}
            </div>
          </DcField>

          <DcField label="สังกัด(ปีปันผล)" lw="120px">
            <DcRO value={member ? member.deptYear : ''} placeholder="(ดึงอัตโนมัติ)" locked />
          </DcField>
          <div className="dct-member-spacer" />
        </div>

        {member && member.status !== 'normal' && (
          <div className="dct-warn">
            <Icon name="info" size={15} />
            <span>สมาชิกอยู่ในสถานะ <b>{st.l}</b>{member.resignDate ? ' (วันที่ ' + member.resignDate + ')' : ''} — ระบบจะตรวจสอบเงื่อนไขสิทธิ์เพิ่มเติม เช่น ลาออกก่อนสิ้นปี / ถอนหุ้นหมด ก่อนคำนวณ</span>
          </div>
        )}
      </div>

      {/* ── ② เงื่อนไขการคำนวณ ── */}
      <div className="search-card icr-sec">
        <div className="section-head">
          <span className="head-bar" /><h3>เงื่อนไขการคำนวณ</h3>
        </div>

        <div className="dct-cond">
          <div className="dct-cond-fields">
            <DcField label="ปีปันผล" lw="92px" required>
              <select className="cfg-input mono" value={year} onChange={(e) => changeYear(e.target.value)} disabled={!member} style={{ maxWidth: 180 }}>
                {(member && window.dctYearsOf(member.code).length ? window.dctYearsOf(member.code) : window.DCT_YEARS)
                  .map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </DcField>
            <DcField label="ข้อมูลคำนวณ" lw="96px" required>
              <select className="cfg-input" value={source} onChange={(e) => { setSource(e.target.value); setResult(null); }} style={{ maxWidth: 230 }}>
                {window.DCT_CALC_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </DcField>
            <DcField label="อัตราปันผล ( % )" lw="120px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={divRate}
                     onChange={(e) => { setDivRate(e.target.value); }} style={{ textAlign: 'right', maxWidth: 120 }} />
            </DcField>

            <DcField label="วันที่เริ่มต้น" lw="92px">
              <div className="dct-date">
                <span className="dct-date-ico"><Icon name="calendar" size={14} /></span>
                <input className="cfg-input mono" value={dateStart} onChange={(e) => setDateStart(e.target.value)} disabled={!member} style={{ maxWidth: 180 }} />
              </div>
            </DcField>
            <DcField label="วันที่สิ้นสุด" lw="96px">
              <div className="dct-date">
                <span className="dct-date-ico"><Icon name="calendar" size={14} /></span>
                <input className="cfg-input mono" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} disabled={!member} style={{ maxWidth: 180 }} />
              </div>
            </DcField>
            <DcField label="อัตราเฉลี่ยคืน ( % )" lw="120px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={avgRate}
                     onChange={(e) => { setAvgRate(e.target.value); }} style={{ textAlign: 'right', maxWidth: 120 }} />
            </DcField>
          </div>

          <div className="dct-cond-actions">
            <button className="btn primary lg dct-calc-btn" onClick={doCalc} disabled={!member}>
              <Icon name="money" size={16} /> คำนวณ
            </button>
            <button className="btn lg dct-elig-btn" onClick={checkEligibility} disabled={!member}>
              <Icon name="shield" size={15} /> ตรวจสอบสิทธิ์สมาชิก
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="dvk-errors" style={{ marginTop: 14 }}>
            <div className="dvk-err-head"><Icon name="info" size={14} /> ตรวจสอบข้อมูลก่อนคำนวณ ({errors.length})</div>
            <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}
      </div>

      {/* ── ③ ผลการคำนวณ — 3 การ์ด ── */}
      <div className="dct-result-grid">
        {/* a. ข้อมูลผลการคำนวณ */}
        <div className="search-card icr-sec dct-rc">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลผลการคำนวณปันผล / เฉลี่ยคืน</h3></div>
          <div className="dct-rc-body">
            <div className="dct-rc-col">
              <DcValueRow label="หุ้นสุทธิ (สิ้นปี)" box big tone="blue"
                          value={result ? dcM(result.netShare) : '—'} />
              <DcValueRow label="ดอกเบี้ยสะสม (เข้าเงื่อนไข)" box big tone="blue"
                          value={result ? dcM(result.eligibleInterest) : '—'} />
            </div>
            <div className="dct-rc-col">
              <DcValueRow label="สถานะปันผล"
                          value={result
                            ? <span className={'chip ' + (result.divEligible ? 'success' : 'danger')}>{result.divEligible ? 'มีสิทธิ์รับปันผล' : 'ไม่มีสิทธิ์รับปันผล'}</span>
                            : <span className="muted">—</span>} />
              <DcValueRow label="ปันผล" box tone="green"
                          value={result ? dcM(result.divPay) : '—'} />
              <DcValueRow label="สถานะเฉลี่ยคืน"
                          value={result
                            ? <span className={'chip ' + (result.avgEligible ? 'success' : 'danger')}>{result.avgEligible ? 'มีสิทธิ์รับเฉลี่ยคืน' : 'ไม่มีสิทธิ์รับเฉลี่ยคืน'}</span>
                            : <span className="muted">—</span>} />
              <DcValueRow label="เฉลี่ยคืน" box tone="green"
                          value={result ? dcM(result.avgPay) : '—'} />
            </div>
          </div>
          <div className="dct-rc-note">
            <Icon name="info" size={12} />
            <span>ยอดดอกเบี้ยสะสมเป็นดอกเบี้ยเงินกู้ที่เข้าเงื่อนไขสำหรับคำนวณเฉลี่ยคืนเท่านั้น</span>
          </div>
        </div>

        {/* b. ประมาณจ่าย (หลังหัก) */}
        <div className="search-card icr-sec dct-rc dct-rc-pay">
          <div className="section-head"><span className="head-bar" /><h3>ข้อมูลประมาณจ่ายปันผล / เฉลี่ยคืน (หลังหักรายการ)</h3></div>
          <div className="dct-pay-body">
            <DcValueRow label="ปันผลสุทธิ" box big value={result ? dcM(result.divPay) : '—'} />
            <DcValueRow label="เฉลี่ยคืนสุทธิ" box big value={result ? dcM(result.avgPay) : '—'} />
            <div className="dct-pay-total">
              <span className="dct-pay-total-l">ยอดสุทธิรวมที่คาดว่าจะได้รับ :</span>
              <span className="dct-pay-total-v">{result ? dcM(result.netTotal) : '—'}</span>
            </div>
          </div>
        </div>

        {/* c. รายการหัก / ปรับปรุง */}
        <div className="search-card icr-sec dct-rc">
          <div className="section-head"><span className="head-bar" /><h3>รายการหัก / ปรับปรุง</h3></div>
          <div className="dct-ded-body">
            <DcField label="หักหนี้ค้างชำระ" lw="118px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={ded.arrears}
                     onChange={(e) => setDedField('arrears', e.target.value)} disabled={!member} style={{ textAlign: 'right' }} />
            </DcField>
            <DcField label="หักอายัด / ภาระผูกพัน" lw="118px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={ded.seize}
                     onChange={(e) => setDedField('seize', e.target.value)} disabled={!member} style={{ textAlign: 'right' }} />
            </DcField>
            <DcField label="หักภาษี ณ ที่จ่าย" lw="118px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={ded.tax}
                     onChange={(e) => setDedField('tax', e.target.value)} disabled={!member} style={{ textAlign: 'right' }} />
            </DcField>
            <DcField label="อื่น ๆ" lw="118px">
              <input className="cfg-input mono num" type="text" inputMode="decimal" value={ded.other}
                     onChange={(e) => setDedField('other', e.target.value)} disabled={!member} style={{ textAlign: 'right' }} />
            </DcField>
            <div className="dct-ded-total">
              <span className="dct-ded-total-l">รวมรายการหักทั้งหมด :</span>
              <span className="dct-ded-total-v mono">{dcM(dedTotalLive)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ④ ตารางรายเดือน + สรุปฐาน ── */}
      <div className="dct-bottom-grid">
        {/* ซ้าย: tabs + table */}
        <div className="search-card icr-sec dct-table-card">
          <div className="tabs-bar dct-tabs">
            <button className={'tab' + (tab === 'monthly' ? ' active' : '')} onClick={() => setTab('monthly')}>รายละเอียดการคำนวณปันผลรายเดือน</button>
            <button className={'tab' + (tab === 'interest' ? ' active' : '')} onClick={() => setTab('interest')}>รายละเอียดดอกเบี้ยเงินกู้ (สำหรับเฉลี่ยคืน)</button>
          </div>

          {tab === 'monthly' ? (
            <div className="table-wrap">
              <div className="table-scroll">
                <table className="tbl dct-month-tbl" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th rowSpan="2" className="center" style={{ width: 54 }}>เดือน</th>
                      <th rowSpan="2" className="center" style={{ width: 56 }}>อายุหุ้น<br/>(เดือน)</th>
                      <th colSpan="3" className="center">รายการหุ้น</th>
                      <th rowSpan="2" className="num" style={{ width: 118 }}>ยอดหุ้นคงเหลือ<br/>สิ้นเดือน</th>
                      <th rowSpan="2" className="num" style={{ width: 120 }}>ยอดคำนวณ<br/>(ถ่วงอายุหุ้น)</th>
                      <th rowSpan="2" className="num" style={{ width: 66 }}>อัตราปันผล<br/>(%)</th>
                      <th rowSpan="2" className="num" style={{ width: 96 }}>ยอดปันผล<br/>รายเดือน</th>
                    </tr>
                    <tr>
                      <th className="num" style={{ width: 96 }}>หุ้นรายเดือน</th>
                      <th className="num" style={{ width: 90 }}>หุ้นพิเศษ</th>
                      <th className="num" style={{ width: 90 }}>ถอนหุ้น<br/>/ ลดหุ้น</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result ? result.monthly.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="center">{r.month}</td>
                        <td className="center mono">{r.age}</td>
                        <td className="num mono">{dcM(r.monthly)}</td>
                        <td className="num mono">{dcM(r.special)}</td>
                        <td className="num mono">{dcM(r.withdraw)}</td>
                        <td className="num mono">{dcM(r.balance)}</td>
                        <td className="num mono">{dcM(r.weighted)}</td>
                        <td className="num mono">{r.rate.toFixed(2)}</td>
                        <td className="num mono">{dcM(r.div)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="9"><div className="empty-state" style={{ padding: 30 }}>— กดปุ่ม “คำนวณ” เพื่อแสดงรายละเอียดการคำนวณปันผลรายเดือน —</div></td></tr>
                    )}
                  </tbody>
                  {result && (
                    <tfoot>
                      <tr className="dct-foot-row">
                        <td className="center" colSpan="2"><b>รวม</b></td>
                        <td className="num mono"><b>{dcM(result.monthly.sumMonthly)}</b></td>
                        <td className="num mono"><b>{dcM(result.monthly.sumSpecial)}</b></td>
                        <td className="num mono"><b>{dcM(result.monthly.sumWithdraw)}</b></td>
                        <td className="num mono"><b>{dcM(result.monthly.balanceEnd)}</b></td>
                        <td className="num mono"><b>{dcM(result.monthly.sumWeighted)}</b></td>
                        <td></td>
                        <td className="num mono"><b>{dcM(result.monthly.sumDiv)}</b></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div className="dct-tbl-note">
                <Icon name="info" size={12} />
                <span>การคำนวณอายุหุ้นนับเป็นรายเดือน · อายุหุ้น = จำนวนเดือนที่ถือหุ้น / 12 · ยอดปันผลรายเดือนเป็นฐานถ่วงอายุหุ้น (แสดงเพื่อการตรวจสอบ)</span>
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <div className="table-scroll">
                <table className="tbl" style={{ minWidth: 760 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 110 }}>เลขที่สัญญา</th>
                      <th style={{ width: 110 }}>ประเภทเงินกู้</th>
                      <th className="center" style={{ width: 96 }}>วันที่ชำระ</th>
                      <th className="center" style={{ width: 58 }}>งวด</th>
                      <th className="num" style={{ width: 90 }}>เงินต้น</th>
                      <th className="num" style={{ width: 90 }}>ดอกเบี้ย</th>
                      <th className="num" style={{ width: 78 }}>ค่าปรับ</th>
                      <th className="center" style={{ width: 96 }}>เข้าเงื่อนไข</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result ? (result.base.interest || []).map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.contract}</td>
                        <td>{r.kind}</td>
                        <td className="center mono">{r.payDate}</td>
                        <td className="center mono">{r.term}</td>
                        <td className="num mono">{dcM(r.principal)}</td>
                        <td className="num mono">{dcM(r.interest)}</td>
                        <td className="num mono">{dcM(r.penalty)}</td>
                        <td className="center">
                          <span className={'pill ' + (r.eligible ? 'ok' : 'bad')}>{r.eligible ? 'เข้าเงื่อนไข' : 'ไม่เข้า'}</span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8"><div className="empty-state" style={{ padding: 30 }}>— กดปุ่ม “คำนวณ” เพื่อแสดงรายละเอียดดอกเบี้ยเงินกู้ —</div></td></tr>
                    )}
                  </tbody>
                  {result && (
                    <tfoot>
                      <tr className="dct-foot-row">
                        <td colSpan="5" className="center"><b>รวมดอกเบี้ยที่ชำระจริง</b></td>
                        <td className="num mono"><b>{dcM(result.interestPaid)}</b></td>
                        <td className="num mono"><b>{dcM(result.interestPenalty)}</b></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              {result && (
                <div className="dct-int-summary">
                  <div className="dct-int-row"><span>ดอกเบี้ยที่ชำระจริงรวม</span><span className="mono">{dcM(result.interestPaid)}</span></div>
                  <div className="dct-int-row"><span>(−) ดอกเบี้ยที่ไม่เข้าเงื่อนไข (ผิดนัด ฯลฯ)</span><span className="mono">{dcM(result.interestExcl)}</span></div>
                  <div className="dct-int-row"><span>(−) ค่าปรับ (ไม่นำมาคิดเฉลี่ยคืน)</span><span className="mono">{dcM(result.interestPenalty)}</span></div>
                  <div className="dct-int-row total"><span>ดอกเบี้ยที่เข้าเงื่อนไขเฉลี่ยคืน</span><span className="mono">{dcM(result.eligibleInterest)}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ขวา: สรุปฐานการคำนวณปันผล */}
        <div className="dct-side">
          <div className="search-card icr-sec dct-summary">
            <div className="section-head"><span className="head-bar" /><h3>สรุปฐานการคำนวณปันผล</h3></div>
            <div className="dct-sum-rows">
              <div className="dct-sum-row"><span>หุ้นยกมาต้นปี</span><span className="mono">{result ? dcM(result.base.shareBegin) : '—'}</span></div>
              <div className="dct-sum-row"><span>หุ้นรายเดือนรวม</span><span className="mono">{result ? dcM(result.monthly.sumMonthly) : '—'}</span></div>
              <div className="dct-sum-row"><span>หุ้นพิเศษรวม</span><span className="mono">{result ? dcM(result.monthly.sumSpecial) : '—'}</span></div>
              <div className="dct-sum-row"><span>ถอนหุ้น / ลดหุ้นรวม</span><span className="mono">{result ? dcM(result.monthly.sumWithdraw) : '—'}</span></div>
              <div className="dct-sum-div" />
              <div className="dct-sum-row strong"><span>หุ้นสุทธิ (สิ้นปี)</span><span className="mono">{result ? dcM(result.monthly.balanceEnd) : '—'}</span></div>
              <div className="dct-sum-row"><span>หุ้นสิทธิ์ที่ใช้คำนวณ (ถ่วงอายุหุ้น)</span><span className="mono">{result ? dcM(result.monthly.sumWeighted) : '—'}</span></div>
              <div className="dct-sum-row"><span>อัตราปันผล</span><span className="mono">{result ? result.rate.toFixed(2) + ' %' : '—'}</span></div>
              <div className="dct-sum-total"><span>ยอดปันผลรวม</span><span className="mono">{result ? dcM(result.monthly.sumDiv) : '—'}</span></div>
            </div>
          </div>

          <div className="dct-side-note">
            <Icon name="info" size={14} />
            <div>
              <div>ยอดปันผลรวมจากตารางรายเดือน (แสดงเพื่อการตรวจสอบ)</div>
              <div className="dct-side-note-2">ยอดปันผลเต็มจำนวน (ไม่รวมรายการหัก) <b className="mono">{result ? dcM(result.dividend) : '—'}</b></div>
            </div>
          </div>
        </div>
      </div>

      {modal && <MemberSearchModal onPick={pickMember} onClose={() => setModal(false)}
                                   title="ค้นหาสมาชิก" source={window.DCT_MEMBERS} searchFn={window.dctSearchMembers} />}
    </div>
  );
}

Object.assign(window, { DividendCalcTestPage });
