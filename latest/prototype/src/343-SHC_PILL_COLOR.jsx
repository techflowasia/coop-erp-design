// ════════════════════════════════════════════════════════════════════
//  ใบเปลี่ยนแปลงค่าหุ้น — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › การทำงาน
//  โครงสร้าง 5 ส่วน: ① ข้อมูลเอกสาร ② รายละเอียดหุ้น
//                    ③ รายละเอียดการเปลี่ยนแปลง (ก่อน/หลัง) ④ หมายเหตุ
//                    ⑤ ประวัติการเปลี่ยนแปลง
//  ใช้สมาชิก/DnMemberSearchModal จาก data/components-debt-notice
//  ใช้ icrToday / IcrTodayBadge (global จาก components-installment-change-list)
// ════════════════════════════════════════════════════════════════════

const SHC_PILL_COLOR = {
  ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)',
  info: 'var(--info)', neutral: 'var(--text-faint, #9aa3ab)', primary: 'var(--primary)',
};

// ─── หัวข้อ section พร้อมเลขลำดับ (วงกลมเขียว) ───────────────────────
function ShcSecHead({ no, title, children }) {
  return (
    <div className="icr-sec-head">
      <h3>{title}</h3>
      {children && <div className="icr-sec-actions">{children}</div>}
    </div>
  );
}

// ─── ฟิลด์ในแถบ (label เล็กด้านบน + control) ─────────────────────────
function ShcFld({ label, w, grow, required, children }) {
  const style = grow ? { flex: '1 1 0', minWidth: w || 120 } : { width: w || 130 };
  return (
    <div className="icr-fld" style={style}>
      <span className="icr-fld-l">{label}{required && <span className="cfg-required"> *</span>}</span>
      {children}
    </div>
  );
}

// ─── ค่าอ่านอย่างเดียว (กล่อง) ───────────────────────────────────────
function ShcRO({ value, mono, num, placeholder }) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={'icr-ro' + (mono ? ' mono' : '') + (num ? ' num' : '') + (empty ? ' empty' : '')}>
      {empty ? (placeholder || '—') : value}
    </div>
  );
}

// ─── ป้ายสถานะแบบกล่อง (ใช้แทน select เมื่ออ่านอย่างเดียว) ──────────
function ShcStatusBox({ pill, label }) {
  return (
    <div className="icr-statusbox">
      <span className="icr-dot" style={{ background: SHC_PILL_COLOR[pill] || SHC_PILL_COLOR.neutral }} />
      <span>{label}</span>
    </div>
  );
}

// ─── select ที่มีจุดสีสถานะนำหน้า ───────────────────────────────────
function ShcDotSelect({ value, onChange, options, disabled }) {
  const cur = options.find(o => o.v === value) || options[0];
  return (
    <div className="icr-dotsel">
      <span className="icr-dot" style={{ background: SHC_PILL_COLOR[cur ? cur.pill : 'neutral'] || SHC_PILL_COLOR.neutral }} />
      <select className="cfg-input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

// ─── การ์ดสรุปหุ้น (รายละเอียดหุ้น) ─────────────────────────────────
function ShcStat({ label, value, unit, icon, accent }) {
  return (
    <div className="shc-stat">
      <div className="shc-stat-body">
        <span className="shc-stat-l">{label}</span>
        <div className="shc-stat-v">
          <b>{value}</b>{unit && <span className="shc-stat-u">{unit}</span>}
        </div>
      </div>
      <span className={'shc-stat-ico' + (accent ? ' ' + accent : '')}><Icon name={icon} size={18} /></span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าจอหลัก
// ════════════════════════════════════════════════════════════════════
function ShcFormScreen({ onToast, audit }) {
  const today = icrToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember] = useState(null);
  const [modal, setModal] = useState(false);

  const [changeDate, setChangeDate] = useState(today);

  // หลังเปลี่ยนแปลง
  const [newSend, setNewSend] = useState('normal');
  const [newPerMonth, setNewPerMonth] = useState('');
  const [note, setNote] = useState('');
  const [reqStatus, setReqStatus] = useState('draft');
  const [savedNo, setSavedNo] = useState('');

  const [error, setError] = useState('');
  const [warn, setWarn] = useState('');

  const info = member ? window.shcShareInfo(member) : null;
  const loaded = !!info;
  const beforeStatus = info ? window.shcSendStatus(info.sendStatus) : null;
  const rs = window.shcReqStatus(reqStatus);
  const history = member ? window.shcHistory(member.code) : [];
  const docNo = savedNo || window.shcNextDocNo(beYear);

  const loadMember = (m) => {
    const i = window.shcShareInfo(m);
    setMember(m);
    setNewSend(i.sendStatus);
    setNewPerMonth(String(i.perMonth));
    setNote('');
    setReqStatus('draft'); setSavedNo('');
    setChangeDate(today);
    setError(''); setWarn('');
  };
  const pickMember = (m) => { setModal(false); loadMember(m); };

  const clearScreen = () => {
    setMember(null); setNewSend('normal'); setNewPerMonth(''); setNote('');
    setReqStatus('draft'); setSavedNo(''); setChangeDate(today);
    setError(''); setWarn('');
  };

  const validate = () => {
    if (!member) return 'กรุณาเลือกสมาชิก (เลขทะเบียน) ก่อนบันทึก';
    const v = Number(newPerMonth);
    if (newSend === 'stop' || newSend === 'waive') {
      // หยุด/งดส่ง — ยอดต่อเดือนต้องเป็น 0
      if (v !== 0) return `สถานะ "${window.shcSendStatus(newSend).l}" ต้องกำหนดค่าหุ้น/เดือน = 0`;
      return '';
    }
    if (!(v > 0)) return 'กรุณาระบุค่าหุ้น/เดือน (มากกว่า 0)';
    if (v < window.SHC_MIN_PER_MONTH) return `ค่าหุ้น/เดือนต้องไม่ต่ำกว่าขั้นต่ำ ${window.fmt.money(window.SHC_MIN_PER_MONTH, 0)} บาท`;
    if (v > window.SHC_MAX_PER_MONTH) return `ค่าหุ้น/เดือนต้องไม่เกินขั้นสูง ${window.fmt.money(window.SHC_MAX_PER_MONTH, 0)} บาท`;
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    const no = window.shcNextDocNo(beYear);
    setSavedNo(no);
    setReqStatus('pending');
    // ── ส่งรายการไปยังเมนู “อนุมัติใบคำขอ” ──
    const reqId = window.dbaNextReqNo(beYear);
    window.dbaPush && window.dbaPush({
      id: reqId, type: 'share-change', docNo: no,
      memberCode: member.code, memberName: member.name, dept: member.dept,
      contractNo: '—', loanType: 'ค่าหุ้น', amount: info.accumulated,
      requestedBy: window.SHC_USER, requestDate: changeDate,
      meetingRef: '', priority: 'normal',
      summary: `เปลี่ยนค่าหุ้น: ${beforeStatus.l} → ${window.shcSendStatus(newSend).l} · หุ้น/เดือน ${window.fmt.money(info.perMonth, 0)} → ${window.fmt.money(Number(newPerMonth) || 0, 0)} บาท`,
      fields: [
        { k: 'สถานะการส่งเดิม', v: beforeStatus.l },
        { k: 'สถานะการส่งใหม่', v: window.shcSendStatus(newSend).l, hl: true },
        { k: 'หุ้น/เดือนเดิม', v: window.fmt.money(info.perMonth, 2) + ' บาท' },
        { k: 'หุ้น/เดือนใหม่', v: window.fmt.money(Number(newPerMonth) || 0, 2) + ' บาท', hl: true },
        { k: 'ทุนเรือนหุ้น', v: window.fmt.money(info.accumulated, 2) + ' บาท' },
        { k: 'หมายเหตุ', v: note || '—' },
      ],
      status: 'pending',
    });
    audit && audit.log && audit.log({
      action: 'create', module: 'ทะเบียนและติดตามหนี้ — ใบเปลี่ยนแปลงค่าหุ้น',
      target: `${member.code} · ${member.name}`,
      summary: `ส่งใบเปลี่ยนแปลงค่าหุ้น ${no} เข้าอนุมัติ · ${window.shcSendStatus(newSend).l} · หุ้น/เดือน ${window.fmt.money(Number(newPerMonth) || 0, 0)}`,
      changes: [
        { field: 'สถานะการส่ง', before: beforeStatus.l, after: window.shcSendStatus(newSend).l },
        { field: 'หุ้น/เดือน',  before: window.fmt.money(info.perMonth, 2), after: window.fmt.money(Number(newPerMonth) || 0, 2) },
      ],
    });
    onToast && onToast(`บันทึกใบเปลี่ยนแปลงค่าหุ้น ${no} · ${member.name} — ส่งไปที่เมนูอนุมัติใบคำขอแล้ว`);
  };

  const doPrint = () => {
    if (!loaded) { setError('กรุณาเลือกสมาชิกก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์ใบเปลี่ยนแปลงค่าหุ้น…');
    setTimeout(() => window.print(), 80);
  };

  const locked = reqStatus !== 'draft';

  return (
    <div data-screen-label="ใบเปลี่ยนแปลงค่าหุ้น">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="icr-form-head">
        <div className="icr-form-title">
          <span className="icr-form-ico"><Icon name="shares" size={20} /></span>
          <div>
            <h1>ใบเปลี่ยนแปลงค่าหุ้น</h1>
            <div className="icr-form-sub">ระบบงานทะเบียนและติดตามหนี้ · บันทึกการเปลี่ยนแปลงสถานะ/ยอดส่งค่าหุ้นรายเดือนของสมาชิก</div>
          </div>
        </div>
        <div className="icr-form-actions">
          <button className="btn sm" onClick={clearScreen}><Icon name="plus" size={13} /> เพิ่มใหม่</button>
          <button className="btn primary sm" onClick={doSave} disabled={locked}><Icon name="check" size={13} /> บันทึก</button>
          <button className="btn sm" onClick={doPrint}><Icon name="print" size={13} /> พิมพ์</button>
          <button className="btn sm" onClick={clearScreen}><Icon name="refresh" size={13} /> ล้างข้อมูล</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {warn && !error && (<div className="dn-status-alert warn" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>{warn}</span></div>)}

      {/* ── ① ข้อมูลเอกสาร ── */}
      <div className="search-card icr-sec">
        <ShcSecHead title="ข้อมูลเอกสาร">
          <span className={'pill ' + rs.pill}>{rs.l}</span>
        </ShcSecHead>
        <div className="icr-strip">
          <ShcFld label="เลขที่เอกสาร" w={186} required>
            {savedNo ? <ShcRO value={savedNo} mono /> : <div className="icr-ro icr-auto">Auto</div>}
          </ShcFld>
          <ShcFld label="วันที่เปลี่ยน" w={150} required>
            <ErpDate value={changeDate} onChange={(v) => ((e) => setChangeDate(e.target.value))({ target: { value: v } })} disabled={locked} className="cfg-input" />
          </ShcFld>
          <ShcFld label="ผู้ทำรายการ" w={160} required><ShcRO value={window.SHC_USER} /></ShcFld>
          <ShcFld label="ทะเบียน" w={170} required>
            <div className="icr-search-box" onClick={() => !locked && setModal(true)}>
              <input className="cfg-input mono sr-clickable" value={member ? member.code : ''} readOnly placeholder="ค้นหา…" />
              <button className="icr-search-btn" type="button"><Icon name="search" size={14} /></button>
            </div>
          </ShcFld>
          <ShcFld label="ชื่อ-ชื่อสกุล" grow w={220} required><ShcRO value={member ? member.name : ''} placeholder="(ดึงอัตโนมัติ)" /></ShcFld>
          <ShcFld label="วันที่เป็นสมาชิก" w={150}><ShcRO value={member ? window.fmt.date(member.joinDate) : ''} mono /></ShcFld>
          <ShcFld label="หน่วย" grow w={180}><ShcRO value={member ? member.dept : ''} /></ShcFld>
          <ShcFld label="เงินเดือน" w={170}>
            <div className="icr-suffix"><div className="icr-ro num mono" style={{ paddingRight: 46, justifyContent: 'flex-end' }}>{info ? window.fmt.money(info.salary, 2) : '—'}</div><span className="icr-suffix-u">บาท</span></div>
          </ShcFld>
        </div>
      </div>

      {/* ── ② รายละเอียดหุ้น ── */}
      <div className="search-card icr-sec">
        <ShcSecHead title="รายละเอียดหุ้น">
          <span className="muted" style={{ fontSize: 11.5 }}>{loaded ? 'ข้อมูลหุ้นปัจจุบันของสมาชิก' : '— เลือกสมาชิกเพื่อแสดงข้อมูลหุ้น —'}</span>
        </ShcSecHead>
        <div className="shc-stats">
          <ShcStat label="หุ้นยกมาต้นปี" value={loaded ? window.fmt.money(info.carryover, 2) : '—'} unit={loaded ? 'บาท' : ''} icon="wallet" accent="a-blue" />
          <ShcStat label="หุ้นสะสม" value={loaded ? window.fmt.money(info.accumulated, 2) : '—'} unit={loaded ? 'บาท' : ''} icon="shares" accent="a-green" />
          <ShcStat label="งวดหุ้น" value={loaded ? window.fmt.money(info.term, 0) : '—'} unit={loaded ? 'งวด' : ''} icon="calendar" accent="a-violet" />
          <ShcStat label="หุ้นฐาน ง/ด" value={loaded ? window.fmt.money(info.baseShare, 2) : '—'} unit={loaded ? 'บาท' : ''} icon="members" accent="a-amber" />
        </div>
      </div>

      {/* ── รายละเอียดการเปลี่ยนแปลง + หมายเหตุ ── */}
      <div className="search-card icr-sec">
        <ShcSecHead title="รายละเอียดการเปลี่ยนแปลง" />
        <div className="shc-ba">
          {/* ก่อนเปลี่ยนแปลง */}
          <div className="shc-ba-col before">
            <div className="shc-ba-head before"><Icon name="eye" size={14} /> ก่อนเปลี่ยนแปลง</div>
            <div className="shc-ba-rows">
              <div className="shc-ba-row">
                <label>สถานะการส่ง</label>
                <div>{loaded ? <ShcStatusBox pill={beforeStatus.pill} label={beforeStatus.l} /> : <ShcRO value="" />}</div>
              </div>
              <div className="shc-ba-row">
                <label>หุ้น/เดือน</label>
                <div className="icr-suffix"><div className="icr-ro num mono" style={{ paddingRight: 46, justifyContent: 'flex-end' }}>{loaded ? window.fmt.money(info.perMonth, 2) : '—'}</div><span className="icr-suffix-u">บาท</span></div>
              </div>
            </div>
          </div>
          {/* หลังเปลี่ยนแปลง */}
          <div className="shc-ba-col after">
            <div className="shc-ba-head after"><Icon name="edit" size={14} /> หลังเปลี่ยนแปลง</div>
            <div className="shc-ba-rows">
              <div className="shc-ba-row">
                <label>สถานะการส่ง <span className="cfg-required">*</span></label>
                <ShcDotSelect value={newSend} onChange={(v) => { setNewSend(v); if (v === 'stop' || v === 'waive') setNewPerMonth('0'); setError(''); }} options={window.SHC_SEND_STATUS} disabled={!loaded || locked} />
              </div>
              <div className="shc-ba-row">
                <label>หุ้น/เดือน <span className="cfg-required">*</span></label>
                <div className="icr-suffix"><input className="cfg-input mono" type="number" min="0" value={newPerMonth} onChange={(e) => setNewPerMonth(e.target.value)} disabled={!loaded || locked || newSend === 'stop' || newSend === 'waive'} placeholder="0.00" /><span className="icr-suffix-u">บาท</span></div>
              </div>
            </div>
          </div>
        </div>
        {loaded && (newSend !== info.sendStatus || Number(newPerMonth) !== info.perMonth) && (
          <div className="shc-delta"><Icon name="info" size={13} /><span>
            เปลี่ยน {beforeStatus.l} → <b>{window.shcSendStatus(newSend).l}</b> · ค่าหุ้น/เดือน {window.fmt.money(info.perMonth, 2)} → <b>{window.fmt.money(Number(newPerMonth) || 0, 2)}</b> บาท
          </span></div>
        )}

        {/* หมายเหตุ (ยุบรวมเข้ากับรายละเอียดการเปลี่ยนแปลง) */}
        <div className="shc-note-head">หมายเหตุ</div>
        <div className="shc-note-presets">
          {window.SHC_NOTE_PRESETS.map((p, i) => (
            <button key={i} type="button" className="chip shc-note-chip" disabled={!loaded || locked} onClick={() => setNote(p)}>{p}</button>
          ))}
        </div>
        <div className="icr-note-wrap" style={{ marginTop: 10 }}>
          <textarea className="cfg-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={!loaded || locked} maxLength={500}
                    placeholder="บันทึกเหตุผลหรือคำอธิบายประกอบการเปลี่ยนแปลง เช่น สมาชิกขอเพิ่ม/ลดค่าหุ้นรายเดือน หรือเลขมติที่ประชุม" />
          <span className="icr-note-count">{note.length}/500</span>
        </div>
      </div>

      {/* ── ประวัติการเปลี่ยนแปลง ── */}
      <div className="search-card icr-sec">
        <ShcSecHead title="ประวัติการเปลี่ยนแปลง">
          <span className="muted" style={{ fontSize: 11.5 }}>{loaded ? `ทะเบียน ${member.code}` : '— เลือกสมาชิกเพื่อแสดงประวัติ —'}</span>
        </ShcSecHead>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl icr-hist-tbl">
            <thead>
              <tr>
                <th>เลขที่เอกสาร</th>
                <th className="num">ทุนเรือนหุ้น (บาท)</th>
                <th className="num">งวดหุ้น (งวด)</th>
                <th className="num">หุ้น/เดือน (บาท)</th>
                <th className="center">สถานะ</th>
                <th>หมายเหตุ</th>
                <th className="center">วันที่บันทึก</th>
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>เลือกสมาชิกเพื่อแสดงประวัติการเปลี่ยนแปลงค่าหุ้น</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={22} /></div>ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับสมาชิกรายนี้</td></tr>
              ) : history.map(h => {
                const st = window.shcReqStatus(h.status);
                return (
                  <tr key={h.docNo}>
                    <td className="mono">{h.docNo}</td>
                    <td className="num mono">{window.fmt.money(h.shareCapital, 2)}</td>
                    <td className="num mono">{window.fmt.money(h.term, 0)}</td>
                    <td className="num mono">{window.fmt.money(h.perMonth, 2)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td>{h.note}</td>
                    <td className="center mono">{h.recordedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <div className="icr-hist-foot">
          <span className="muted">{loaded && history.length > 0 ? `แสดง 1 ถึง ${history.length} จาก ${history.length} รายการ` : ''}</span>
          <div className="icr-pager">
            <button className="icr-pg" disabled>‹</button>
            <button className="icr-pg active">1</button>
            <button className="icr-pg" disabled>›</button>
          </div>
        </div>
      </div>

      {modal && <DnMemberSearchModal onPick={pickMember} onClose={() => setModal(false)} />}
      <IcrTodayBadge />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Page wrapper
// ════════════════════════════════════════════════════════════════════
function ShareChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return <ShcFormScreen onToast={onToast} audit={audit} />;
}

Object.assign(window, { ShareChangePage, ShcFormScreen });
