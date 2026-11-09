// System / Configuration module
// ─── 1. ค่าคงที่ข้อมูลสหกรณ์ — cooperative master info
// ─── 2. ค่าคงที่ปฏิทินวันทำงาน — annual working-day calendar

// Persisted defaults (kept in module scope so reset works)
window.COOP_INFO_DEFAULTS = {
  name: "สหกรณ์ออมทรัพย์ข้าราชการกระทรวงมหาดไทย จำกัด",
  taxId: "0994000165788",
  address: "เลขที่ 168 ถนนพระรามที่ 6 แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพมหานคร 10400",
  phone: "0226256742",
  email: "contact@coop-moi.or.th",
  website: "https://www.coop-moi.or.th",
  registrationNo: "กพ.0123/2520",
  registrationDate: "1977-04-12",
  logoUrl: null,
};

// ╭─────────────────────────────────────────────────────────────────╮
// │   1. CooperativeConfigPage — master info form                  │
// ╰─────────────────────────────────────────────────────────────────╯
function CooperativeConfigPage() {
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('coop_info');
    return saved ? JSON.parse(saved) : { ...window.COOP_INFO_DEFAULTS };
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(form);
  const [errors, setErrors] = useState({});
  const [savedAt, setSavedAt] = useState(null);
  const fileRef = useRef(null);

  const startEdit = () => { setDraft(form); setErrors({}); setEditing(true); };
  const cancelEdit = () => { setDraft(form); setErrors({}); setEditing(false); };

  const validate = (d) => {
    const e = {};
    if (!d.name?.trim()) e.name = 'กรุณาระบุชื่อสหกรณ์';
    if (!/^\d{13}$/.test(d.taxId || '')) e.taxId = 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    if (!d.address?.trim()) e.address = 'กรุณาระบุที่อยู่';
    if (!/^\d{1,10}$/.test(d.phone || '')) e.phone = 'เบอร์ติดต่อต้องเป็นตัวเลขไม่เกิน 10 หลัก';
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    return e;
  };

  const handleSave = () => {
    const e = validate(draft);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setForm(draft);
    localStorage.setItem('coop_info', JSON.stringify(draft));
    setSavedAt(new Date());
    setEditing(false);
  };

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));

  // Restrict to digits-only inputs
  const digitsOnly = (v, max) => v.replace(/\D/g, '').slice(0, max);

  const handleLogoUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setField('logoUrl', e.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div data-screen-label="หน้าค่าคงที่ข้อมูลสหกรณ์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ข้อมูลสหกรณ์</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ข้อมูลพื้นฐานของสหกรณ์ — ใช้สำหรับเอกสาร, ใบเสร็จ, และระบบรายงานทั่วไป
          </div>
        </div>
        <span className="spacer" />
        {savedAt && !editing && (
          <span className="chip success">
            <Icon name="check" size={11} /> บันทึกล่าสุด {savedAt.toLocaleTimeString('th-TH')}
          </span>
        )}
        {!editing ? (
          <>
            <button className="btn sm"><Icon name="history" /> ประวัติการแก้ไข</button>
            <button className="btn primary sm" onClick={startEdit}>
              <Icon name="edit" /> แก้ไขข้อมูล
            </button>
          </>
        ) : (
          <>
            <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
            <button className="btn primary sm" onClick={handleSave}>
              <Icon name="check" /> บันทึกข้อมูล
            </button>
          </>
        )}
      </div>

      <div className="config-grid">
        {/* Main form card */}
        <div className="search-card" style={{ padding: 24 }}>
          <div className="section">
            <div className="section-head">
              <span className="head-bar" />
              <h3>ข้อมูลทั่วไปของสหกรณ์</h3>
            </div>

            <ConfigField label="ชื่อสหกรณ์" required value={editing ? draft.name : form.name}
                         editing={editing} error={errors.name}
                         onChange={(v) => setField('name', v)}
                         placeholder="ชื่อเต็มของสหกรณ์" maxLength={200} />

            <ConfigField label="เลขประจำตัวผู้เสียภาษี" required
                         value={editing ? draft.taxId : form.taxId}
                         editing={editing} error={errors.taxId} mono
                         onChange={(v) => setField('taxId', digitsOnly(v, 13))}
                         placeholder="ตัวเลข 13 หลัก" inputMode="numeric"
                         hint="ระบุเป็นตัวเลขเท่านั้น 13 หลัก" />

            <ConfigField label="ที่อยู่" required multiline rows={3}
                         value={editing ? draft.address : form.address}
                         editing={editing} error={errors.address}
                         onChange={(v) => setField('address', v)}
                         placeholder="บ้านเลขที่ ถนน แขวง เขต จังหวัด รหัสไปรษณีย์" />

            <ConfigField label="เบอร์ติดต่อ" required
                         value={editing ? draft.phone : form.phone}
                         editing={editing} error={errors.phone} mono
                         onChange={(v) => setField('phone', digitsOnly(v, 10))}
                         placeholder="ตัวเลข 0–10 หลัก" inputMode="tel"
                         hint="ระบุเป็นตัวเลขเท่านั้น ความยาวไม่เกิน 10 ตัวอักษร"
                         displayFmt={(v) => v ? v.replace(/(\d{2,3})(\d{3})(\d{4})/, '$1-$2-$3') : '—'} />

            <ConfigField label="อีเมล" value={editing ? draft.email : form.email}
                         editing={editing} error={errors.email}
                         onChange={(v) => setField('email', v)}
                         placeholder="example@coop.or.th" type="email" />

            <ConfigField label="เว็บไซต์" value={editing ? draft.website : form.website}
                         editing={editing}
                         onChange={(v) => setField('website', v)}
                         placeholder="https://www.coop.or.th" />
          </div>

          <div className="section" style={{ marginTop: 16 }}>
            <div className="section-head">
              <span className="head-bar" />
              <h3>ข้อมูลการจดทะเบียน</h3>
              <span className="muted" style={{ fontSize: 11 }}>ข้อมูลอ้างอิงจากกรมส่งเสริมสหกรณ์</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <ConfigField label="เลขทะเบียนสหกรณ์" mono
                           value={editing ? draft.registrationNo : form.registrationNo}
                           editing={editing}
                           onChange={(v) => setField('registrationNo', v)} />
              <ConfigField label="วันที่จดทะเบียน"
                           value={editing ? draft.registrationDate : fmt.date(form.registrationDate)}
                           editing={editing} type={editing ? 'date' : 'text'}
                           onChange={(v) => setField('registrationDate', v)} />
            </div>
          </div>
        </div>

        {/* Logo upload card */}
        <div className="search-card" style={{ padding: 20 }}>
          <div className="section-head" style={{ marginBottom: 10 }}>
            <span className="head-bar" />
            <h3>ตราสัญลักษณ์</h3>
          </div>

          <div className="logo-uploader">
            {(editing ? draft.logoUrl : form.logoUrl) ? (
              <img src={editing ? draft.logoUrl : form.logoUrl} alt="ตราสหกรณ์" />
            ) : (
              <div className="logo-placeholder">
                <svg width="56" height="56" viewBox="0 0 48 48" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="24" cy="24" r="20" />
                  <path d="M24 12v24M12 24h24M16 16l16 16M32 16 16 32" opacity=".4" />
                </svg>
                <span>ยังไม่ได้อัปโหลดโลโก้</span>
              </div>
            )}
          </div>

          <input type="file" ref={fileRef} accept="image/png,image/jpeg,image/svg+xml"
                 style={{ display: 'none' }}
                 onChange={(e) => handleLogoUpload(e.target.files?.[0])} />

          {editing ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              <button className="btn sm" style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => fileRef.current?.click()}>
                <Icon name="download" /> เลือกไฟล์ใหม่
              </button>
              {draft.logoUrl && (
                <button className="btn danger sm"
                        onClick={() => setField('logoUrl', null)}>
                  <Icon name="close" />
                </button>
              )}
            </div>
          ) : (
            <button className="btn sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                    onClick={startEdit}>
              <Icon name="edit" /> แก้ไขโลโก้
            </button>
          )}

          <div className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
            รองรับไฟล์ PNG, JPG, SVG<br />
            แนะนำขนาดอย่างน้อย 512×512 px<br />
            พื้นหลังโปร่งใส (PNG) จะให้ผลลัพธ์ที่ดีที่สุด
          </div>
        </div>
      </div>

      {/* Preview card — how it appears on docs */}
      <div className="detail-section-head">
        <div className="sh-icon"><Icon name="eye" /></div>
        <div>
          <div className="sh-title">ตัวอย่างการแสดงผลในเอกสาร</div>
          <div className="sh-sub">หัวกระดาษใบเสร็จ และเอกสารทางการ</div>
        </div>
      </div>
      <div className="doc-preview">
        <div className="doc-letterhead">
          {form.logoUrl ? (
            <img src={form.logoUrl} alt="logo" className="doc-logo" />
          ) : (
            <div className="doc-logo-placeholder">โลโก้</div>
          )}
          <div className="doc-name">{form.name}</div>
          <div className="doc-meta">{form.address}</div>
          <div className="doc-meta">
            โทร. {form.phone ? form.phone.replace(/(\d{2,3})(\d{3})(\d{4})/, '$1-$2-$3') : '—'}
            {' · '}
            อีเมล {form.email || '—'}
            {' · '}
            เลขประจำตัวผู้เสียภาษี {form.taxId || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable label/input row for the config form
function ConfigField({ label, value, editing, error, onChange, required, type, multiline, rows,
                      mono, hint, placeholder, maxLength, inputMode, displayFmt }) {
  return (
    <div className="cfg-field">
      <label className="cfg-label">
        {label}
        {required && <span className="cfg-required">*</span>}
      </label>
      <div className="cfg-input-wrap">
        {editing ? (
          multiline ? (
            <textarea className={"cfg-input" + (error ? ' has-error' : '')}
                      rows={rows || 3}
                      value={value || ''}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      onChange={(e) => onChange(e.target.value)} />
          ) : (
            <input className={"cfg-input" + (error ? ' has-error' : '') + (mono ? ' mono' : '')}
                   type={type || 'text'}
                   value={value || ''}
                   placeholder={placeholder}
                   maxLength={maxLength}
                   inputMode={inputMode}
                   onChange={(e) => onChange(e.target.value)} />
          )
        ) : (
          <div className={"cfg-display" + (mono ? ' mono' : '')}>
            {displayFmt ? displayFmt(value) : (value || <span className="muted">—</span>)}
          </div>
        )}
        {error && <div className="cfg-error"><Icon name="info" size={11} /> {error}</div>}
        {hint && !error && editing && <div className="cfg-hint">{hint}</div>}
      </div>
    </div>
  );
}

// ╭─────────────────────────────────────────────────────────────────╮
// │   2. WorkCalendarPage — annual calendar with event types       │
// ╰─────────────────────────────────────────────────────────────────╯
const EVENT_TYPES = {
  holiday:     { label: "วันหยุดประจำปี",    color: "#DC2626", bg: "#FEE2E2" },
  cutoff:      { label: "วันตัดยอด",         color: "#7C3AED", bg: "#EDE9FE" },
  payday:      { label: "วันจ่ายเงินเดือน",   color: "#15803D", bg: "#DCFCE7" },
  processing:  { label: "วันประมวลผล",       color: "#0369A1", bg: "#DBEAFE" },
  summary:     { label: "วันสรุปประมวลผล",   color: "#B45309", bg: "#FEF3C7" },
};

// Default sample events for 2025 (current Thai year shown as 2568)
function defaultCalendarEvents() {
  const e = {};
  const set = (date, type, note) => {
    if (!e[date]) e[date] = [];
    e[date].push({ type, note });
  };
  // 2025 thai holidays (selected)
  ['2025-01-01','2025-04-13','2025-04-14','2025-04-15','2025-05-01','2025-05-05','2025-07-28','2025-08-12','2025-10-23','2025-12-05','2025-12-10','2025-12-31'].forEach(d => set(d, 'holiday', ''));
  // Monthly events
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    set(`2025-${mm}-25`, 'payday',     'จ่ายเงินเดือนข้าราชการประจำเดือน');
    set(`2025-${mm}-28`, 'cutoff',     'ตัดยอดเรียกเก็บประจำงวด');
    set(`2025-${mm}-01`, 'processing', 'ประมวลผลรอบเดือน');
    set(`2025-${mm}-05`, 'summary',    'สรุปประมวลผลและออกรายงานประจำเดือน');
  }
  return e;
}

function WorkCalendarPage() {
  const [year, setYear] = useState(2025);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('work_calendar');
    return saved ? JSON.parse(saved) : defaultCalendarEvents();
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [enabledTypes, setEnabledTypes] = useState(Object.keys(EVENT_TYPES));

  const saveEvents = (next) => {
    setEvents(next);
    localStorage.setItem('work_calendar', JSON.stringify(next));
  };

  const toggleType = (t) => setEnabledTypes(s =>
    s.includes(t) ? s.filter(x => x !== t) : [...s, t]
  );

  // Stats for the year
  const stats = useMemo(() => {
    const counts = {};
    Object.keys(EVENT_TYPES).forEach(t => counts[t] = 0);
    Object.entries(events).forEach(([d, evs]) => {
      if (d.startsWith(year + '-')) evs.forEach(e => counts[e.type] = (counts[e.type] || 0) + 1);
    });
    return counts;
  }, [events, year]);

  return (
    <div data-screen-label="หน้าค่าคงที่ปฏิทินวันทำงาน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ปฏิทินวันทำงาน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กำหนดวันหยุด วันตัดยอด วันประมวลผล และเหตุการณ์สำคัญในแต่ละปี
          </div>
        </div>
        <span className="spacer" />
        <div className="year-switcher">
          <button className="btn ghost sm" onClick={() => setYear(y => y - 1)} aria-label="ปีก่อนหน้า">
            <Icon name="chevLeft" />
          </button>
          <div className="yr-display">
            <div className="yr-be">พ.ศ. {year + 543}</div>
            <div className="yr-ad">ค.ศ. {year}</div>
          </div>
          <button className="btn ghost sm" onClick={() => setYear(y => y + 1)} aria-label="ปีถัดไป">
            <Icon name="chevRight" />
          </button>
        </div>
        <button className="btn sm"><Icon name="download" /> ส่งออก .ics</button>
        <button className="btn primary sm" onClick={() => setSelectedDate(new Date().toISOString().slice(0,10))}>
          <Icon name="plus" /> เพิ่มกิจกรรม
        </button>
      </div>

      {/* Legend */}
      <div className="cal-legend">
        {Object.entries(EVENT_TYPES).map(([key, t]) => {
          const on = enabledTypes.includes(key);
          return (
            <button key={key}
                    className={"legend-chip" + (on ? ' on' : '')}
                    onClick={() => toggleType(key)}
                    style={on ? { borderColor: t.color, background: t.bg, color: t.color } : {}}>
              <span className="legend-dot" style={{ background: t.color }} />
              {t.label}
              <span className="legend-count">{stats[key] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* Year grid: 12 month mini calendars */}
      <div className="year-grid">
        {Array.from({ length: 12 }).map((_, m) => (
          <MonthCalendar key={m}
                         year={year} month={m}
                         events={events}
                         enabledTypes={enabledTypes}
                         onDayClick={(d) => setSelectedDate(d)}
                         selectedDate={selectedDate} />
        ))}
      </div>

      {selectedDate && (
        <DateEventDrawer date={selectedDate}
                         events={events[selectedDate] || []}
                         allEvents={events}
                         onClose={() => setSelectedDate(null)}
                         onSave={(newEvents) => {
                           const next = { ...events, [selectedDate]: newEvents };
                           if (newEvents.length === 0) delete next[selectedDate];
                           saveEvents(next);
                         }} />
      )}
    </div>
  );
}

function MonthCalendar({ year, month, events, enabledTypes, onDayClick, selectedDate }) {
  const MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const fmtDate = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  return (
    <div className="month-card">
      <div className="month-head">
        <div className="month-name">{MONTHS_TH[month]}</div>
        <div className="month-yr">{year + 543}</div>
      </div>
      <div className="weekday-row">
        {['อา','จ','อ','พ','พฤ','ศ','ส'].map((d, i) => (
          <div key={i} className={"weekday" + (i === 0 ? ' sun' : '')}>{d}</div>
        ))}
      </div>
      <div className="day-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="day empty" />;
          const dateStr = fmtDate(d);
          const dayEvents = (events[dateStr] || []).filter(e => enabledTypes.includes(e.type));
          const isWeekend = ((startDay + d - 1) % 7) === 0; // Sunday only highlighted
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const primary = dayEvents[0];

          return (
            <button key={i}
                    className={"day" +
                               (isWeekend ? ' sun' : '') +
                               (isToday ? ' today' : '') +
                               (isSelected ? ' selected' : '') +
                               (primary ? ' has-event' : '')}
                    style={primary ? { background: EVENT_TYPES[primary.type].bg, color: EVENT_TYPES[primary.type].color } : {}}
                    onClick={() => onDayClick(dateStr)}>
              <span>{d}</span>
              {dayEvents.length > 1 && (
                <span className="day-multi-dot" style={{ background: EVENT_TYPES[primary.type].color }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DateEventDrawer({ date, events, allEvents, onClose, onSave }) {
  const [draft, setDraft] = useState(events);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState('holiday');
  const [newNote, setNewNote] = useState('');

  const dateObj = new Date(date);
  const dayName = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'][dateObj.getDay()];

  const addEvent = () => {
    if (!newType) return;
    setDraft(d => [...d, { type: newType, note: newNote }]);
    setNewType('holiday');
    setNewNote('');
    setAdding(false);
  };

  const removeEvent = (idx) => setDraft(d => d.filter((_, i) => i !== idx));
  const updateNote = (idx, note) => setDraft(d => d.map((e, i) => i === idx ? { ...e, note } : e));

  const handleSave = () => { onSave(draft); onClose(); };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--primary-50)',
                        color: 'var(--primary)', display: 'grid', placeItems: 'center', fontWeight: 600 }}>
            {dateObj.getDate()}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>วัน{dayName}ที่ {fmt.date(date)}</h2>
            <div className="muted" style={{ fontSize: 11 }}>กำหนดประเภทกิจกรรม + หมายเหตุประกอบ</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="drawer-body">
          {draft.length === 0 && !adding && (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              ยังไม่มีกิจกรรมในวันนี้
              <div style={{ marginTop: 12 }}>
                <button className="btn primary sm" onClick={() => setAdding(true)}>
                  <Icon name="plus" /> เพิ่มกิจกรรม
                </button>
              </div>
            </div>
          )}

          {draft.map((ev, i) => {
            const t = EVENT_TYPES[ev.type];
            return (
              <div key={i} className="event-row">
                <div className="event-type-tag" style={{ background: t.bg, color: t.color }}>
                  <span className="legend-dot" style={{ background: t.color }} />
                  {t.label}
                </div>
                <textarea className="cfg-input"
                          rows={2}
                          placeholder="หมายเหตุหรือข้อความเพิ่มเติม (เช่น วันหยุดสงกรานต์, ตัดยอดเรียกเก็บ ม.ค. 2568)"
                          value={ev.note}
                          onChange={(e) => updateNote(i, e.target.value)} />
                <button className="btn ghost sm" onClick={() => removeEvent(i)}
                        title="ลบกิจกรรม">
                  <Icon name="close" />
                </button>
              </div>
            );
          })}

          {adding && (
            <div className="event-add-row">
              <select className="filter-select" value={newType}
                      onChange={(e) => setNewType(e.target.value)}>
                {Object.entries(EVENT_TYPES).map(([k, t]) => (
                  <option key={k} value={k}>{t.label}</option>
                ))}
              </select>
              <textarea className="cfg-input" rows={2}
                        placeholder="หมายเหตุหรือข้อความเพิ่มเติม..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn sm" onClick={() => { setAdding(false); setNewNote(''); }}>ยกเลิก</button>
                <button className="btn primary sm" onClick={addEvent}>
                  <Icon name="check" /> เพิ่ม
                </button>
              </div>
            </div>
          )}

          {!adding && draft.length > 0 && (
            <button className="btn sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
                    onClick={() => setAdding(true)}>
              <Icon name="plus" /> เพิ่มกิจกรรมอื่น
            </button>
          )}

          <div className="col-gap" style={{ marginTop: 20, borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <span style={{ flex: 1 }} />
            <button className="btn primary" onClick={handleSave}>
              <Icon name="check" /> บันทึก ({draft.length} กิจกรรม)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { CooperativeConfigPage, WorkCalendarPage });
