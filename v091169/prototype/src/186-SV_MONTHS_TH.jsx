// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — นัดหมายออกสำรวจหลักทรัพย์ (SurveyAppointmentPage)
//  ปฏิทินรายเดือน + popup "รายละเอียดการนัดหมาย" ที่ดึงหลักทรัพย์ของ
//  สมาชิก (จากเมนูบันทึกหลักทรัพย์) มาลงนัดออกสำรวจ
// ════════════════════════════════════════════════════════════════════

const SV_MONTHS_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const SV_MONTHS_ABBR = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const SV_DOW = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
const svKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const svFmtThai = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${SV_MONTHS_ABBR[m - 1]}${String(y + 543).slice(-2)}`; };

// ── ฟิลด์ในฟอร์ม (label บน + control ล่าง) ─────────────────────────
function SvField({ label, children, span }) {
  return (
    <div className={"lrq-f" + (span ? " span-" + span : "")}>
      <label className="lrq-lbl">{label}</label>
      {children}
    </div>
  );
}

// ── การ์ดหลักทรัพย์ในการนัดหมาย (พับ/ขยายเพื่อระบุวัน–เวลา) ──────────
function SvAssetRow({ asset, sched, presetDate, expanded, onToggle, onSave, onClear }) {
  const [draft, setDraft] = useState(() => sched || { date: presetDate || '', time: '', timeUnset: false, officer: '', officerUnset: false });
  const [err, setErr] = useState('');
  React.useEffect(() => { if (sched) setDraft(sched); }, [sched]);
  const set = (k, v) => { setErr(''); setDraft(p => ({ ...p, [k]: v })); };
  const saved = !!sched;
  const trySave = () => {
    if (!draft.date) return setErr('กรุณาระบุวันที่สำรวจ');
    if (!draft.timeUnset && !draft.time) return setErr('กรุณาเลือกเวลา หรือเลือก “ยังไม่ระบุเวลา”');
    if (!draft.officerUnset && !draft.officer) return setErr('กรุณาเลือกเจ้าหน้าที่ หรือเลือก “ยังไม่ระบุเจ้าหน้าที่”');
    setErr(''); onSave(draft);
  };

  return (
    <div className={"sv-asset" + (expanded ? " open" : "") + (saved ? " done" : "")}>
      <div className="sv-asset-head" onClick={onToggle}>
        <span className={"sv-asset-radio" + (saved ? " on" : "")}>{saved && <Icon name="check" size={11} />}</span>
        <div className="sv-asset-info">
          <div className="sv-asset-t">{window.lcAssetTitle(asset)}<span className="sv-asset-type">ประเภท : {asset.type}</span></div>
          <div className="sv-asset-sub">เนื้อที่ : {window.lcAssetArea(asset)}<span className="sv-asset-sep">ที่ตั้ง :</span>{window.lcAssetLoc(asset)}</div>
          {saved && (
            <div className="sv-asset-chips">
              <span className="sv-chip"><Icon name="calendar" size={11} /> {draft.date ? svFmtThai(draft.date) : 'ไม่ระบุวัน'}</span>
              <span className="sv-chip"><Icon name="history" size={11} /> {draft.timeUnset || !draft.time ? 'ไม่ระบุเวลา' : draft.time + ' น.'}</span>
              <span className="sv-chip"><Icon name="user" size={11} /> {draft.officerUnset || !draft.officer ? 'ยังไม่ระบุ' : draft.officer}</span>
            </div>
          )}
        </div>
        <button className="sv-asset-toggle">{saved ? 'แก้ไขข้อมูล' : 'ระบุวัน/เวลา'} <Icon name="chevDown" size={13} /></button>
      </div>
      {expanded && (
        <div className="sv-asset-body">
          <div className="lrq-grid c2">
            <SvField label="วันที่สำรวจ"><ErpDate value={draft.date} onChange={(v) => (e => set('date', e.target.value))({ target: { value: v } })} className="cfg-input" /></SvField>
            <SvField label="เวลา">
              <select className="cfg-input" value={draft.time} disabled={draft.timeUnset} onChange={e => set('time', e.target.value)}>
                <option value="">--- โปรดเลือก ---</option>
                {window.SV_TIMES.map(t => <option key={t} value={t}>{t} น.</option>)}
              </select>
            </SvField>
          </div>
          <label className="sv-check"><input type="checkbox" checked={draft.timeUnset} onChange={e => set('timeUnset', e.target.checked)} /> ยังไม่ระบุเวลา</label>
          <div className="lrq-grid c1" style={{ marginTop: 8 }}>
            <SvField label="เจ้าหน้าที่ผู้รับผิดชอบ">
              <select className="cfg-input" value={draft.officer} disabled={draft.officerUnset} onChange={e => set('officer', e.target.value)}>
                <option value="">--- โปรดเลือก ---</option>
                {window.SV_OFFICERS.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
            </SvField>
          </div>
          <label className="sv-check"><input type="checkbox" checked={draft.officerUnset} onChange={e => set('officerUnset', e.target.checked)} /> ยังไม่ระบุเจ้าหน้าที่</label>
          {err && <div className="sv-err"><Icon name="warning" size={13} /> {err}</div>}
          <div className="sv-asset-act">
            {saved && <button className="btn text sm danger" onClick={onClear}>ยกเลิกนัดหมาย</button>}
            <span className="spacer" />
            <button className="btn primary sm" onClick={trySave}><Icon name={saved ? 'check' : 'plus'} size={13} /> {saved ? 'บันทึกการแก้ไข' : 'เพิ่มนัดหมาย'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Popup "รายละเอียดการนัดหมาย" ───────────────────────────────────
function SvApptModal({ presetDate, onClose, onSave }) {
  const [member, setMember] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [note, setNote] = useState('');
  const [assets, setAssets] = useState([]);
  const [scheds, setScheds] = useState({});     // { [assetId]: {date,time,...} }
  const [expandedId, setExpandedId] = useState(null);

  const pickMember = (m) => {
    const full = (window.MEMBERS_LIST || []).find(x => x.code === m.code) || m;
    setMember(full);
    setPhone(full.phone || '080-0000-000');
    setAssets(window.lcOf ? window.lcOf(full.code) : []);
    setScheds({});
    setSearchOpen(false);
  };

  const saveSched = (id, draft) => { setFormErr(''); setScheds(p => ({ ...p, [id]: draft })); setExpandedId(null); };
  const clearSched = (id) => { setFormErr(''); setScheds(p => { const n = { ...p }; delete n[id]; return n; }); setExpandedId(null); };

  const scheduledCount = Object.keys(scheds).length;
  const [formErr, setFormErr] = useState('');
  const submit = () => {
    if (!member) return setFormErr('กรุณาเลือกสมาชิกก่อน');
    if (!scheduledCount) return setFormErr('กรุณาเลือกหลักทรัพย์อย่างน้อย 1 รายการ และระบุวัน-เวลานัดหมาย');
    const bad = Object.entries(scheds).find(([, s]) => !s.date || (!s.timeUnset && !s.time));
    if (bad) { const a = assets.find(x => x.id === bad[0]); return setFormErr('รายการ “' + (a ? window.lcAssetTitle(a) : '') + '” ยังระบุวัน-เวลาไม่ครบ'); }
    setFormErr('');
    const appts = Object.entries(scheds).map(([id, s]) => {
      const a = assets.find(x => x.id === id) || {};
      return { id: window.svNextId(), type: 'survey', date: s.date, time: s.timeUnset ? '' : s.time,
               memberCode: member.code, memberName: member.name, officer: s.officerUnset ? '' : s.officer,
               assetId: a.id, assetTitle: window.lcAssetTitle(a), note };
    }).filter(a => a.date);
    onSave(appts);
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card sv-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>รายละเอียดการนัดหมาย</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-grid c2">
            <SvField label="เลขสมาชิก">
              <ErpMemberPicker member={member} onPick={pickMember} source={window.MEMBERS_LIST}
                               title="ค้นหาสมาชิก — นัดหมายออกสำรวจหลักทรัพย์"
                               placeholder="เลขสมาชิก…" />
            </SvField>
            <SvField label="ชื่อ-นามสกุล"><input className="cfg-input lrq-ro" value={member ? member.name : ''} placeholder="โปรดระบุข้อมูล" readOnly /></SvField>
            <SvField label="เบอร์โทรศัพท์"><input className="cfg-input" value={phone} placeholder="โปรดระบุข้อมูล" onChange={e => setPhone(e.target.value)} /></SvField>
            <SvField label="เบอร์โทรศัพท์สำรอง"><input className="cfg-input" value={phone2} placeholder="080-0000-000" onChange={e => setPhone2(e.target.value)} /></SvField>
          </div>

          <div className="sv-sec">รายการหลักทรัพย์{scheduledCount ? <span className="sv-sec-count">{scheduledCount}</span> : null}</div>
          {!member ? (
            <div className="sv-empty">ยังไม่มีรายการ</div>
          ) : assets.length === 0 ? (
            <div className="sv-empty">สมาชิกรายนี้ยังไม่มีหลักทรัพย์ที่บันทึกในระบบ</div>
          ) : (
            <div className="sv-asset-list">
              {assets.map(a => (
                <SvAssetRow key={a.id} asset={a} sched={scheds[a.id]} presetDate={presetDate}
                            expanded={expandedId === a.id}
                            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                            onSave={(d) => saveSched(a.id, d)} onClear={() => clearSched(a.id)} />
              ))}
            </div>
          )}

          <div className="sv-sec" style={{ marginTop: 14 }}>หมายเหตุ</div>
          <textarea className="cfg-input" rows="2" value={note} placeholder="ข้อมูลเพิ่มเติม...." onChange={e => setNote(e.target.value)} />
        </div>
        <div className="lrq-sal-foot sv-foot">
          {formErr && <div className="sv-err sv-foot-err"><Icon name="warning" size={13} /> {formErr}</div>}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}><Icon name="check" /> บันทึกข้อมูล</button>
        </div>
      </div>
      {searchOpen && (
        <MemberSearchModal onPick={pickMember} onClose={() => setSearchOpen(false)}
                           title="ค้นหาสมาชิก — นัดหมายออกสำรวจ" source={window.MEMBERS_LIST} />
      )}
    </>
  );
}

// ── มุมมองเดือน ────────────────────────────────────────────────────
function SvMonthGrid({ year, month, byDate, today, onDayClick }) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="sv-cal">
      <div className="sv-cal-dow">{SV_DOW.map(d => <div key={d} className="sv-cal-dowc">{d}</div>)}</div>
      <div className="sv-cal-grid">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="sv-cal-cell empty" />;
          const key = svKey(year, month, d);
          const evs = byDate[key] || [];
          const holiday = window.SV_HOLIDAYS[key];
          const isToday = key === today;
          return (
            <div key={i} className="sv-cal-cell" onClick={() => onDayClick(key)}>
              <div className="sv-cal-daynum-row">
                <span className={"sv-cal-daynum" + (isToday ? " today" : "")}>{String(d).padStart(2, '0')}</span>
              </div>
              {holiday && <div className="sv-cal-holiday">{holiday}</div>}
              {evs.map(e => {
                const t = window.SV_TYPES[e.type];
                return (
                  <div key={e.id} className="sv-cal-ev" title={`${e.time || ''} ${e.memberName} · ${e.officer || ''}`}>
                    <span className="sv-cal-dot" style={{ background: t.color }} />
                    {e.time ? e.time + ' น. ' : ''}{window.svShortName(e.memberName)}{e.officer ? ' (' + window.svShortName(e.officer).split(' ')[0] + ')' : ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── มุมมองปี (12 เดือนย่อ) ──────────────────────────────────────────
function SvYearGrid({ year, byDate, onPickMonth }) {
  return (
    <div className="sv-year-grid">
      {SV_MONTHS_TH.map((mn, m) => {
        const count = Object.keys(byDate).filter(k => k.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`)).reduce((a, k) => a + byDate[k].length, 0);
        return (
          <button key={m} className="sv-year-cell" onClick={() => onPickMonth(m)}>
            <div className="sv-year-name">{mn}</div>
            <div className="sv-year-count">{count ? count + ' นัดหมาย' : '—'}</div>
          </button>
        );
      })}
    </div>
  );
}

// ── Popup รายละเอียดการนัดหมาย (อ่านอย่างเดียว) ────────────────────
function SvApptDetailModal({ appt, onClose, onEdit, onDelete, onPrint }) {
  const t = window.SV_TYPES[appt.type] || {};
  const Row = ({ k, v }) => <div className="cs-dt-row"><span className="cs-dt-k">{k}</span><span className="cs-dt-v">{v || '—'}</span></div>;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card sv-dt-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>รายละเอียดการนัดหมาย</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="sv-dt-badge" style={{ background: t.bg, color: t.color }}><span className="sv-cal-dot" style={{ background: t.color }} /> {t.label}</div>
          <div className="cs-dt-grid" style={{ marginTop: 12 }}>
            <Row k="เลขสมาชิก" v={appt.memberCode} />
            <Row k="ชื่อ-นามสกุล" v={appt.memberName} />
            <Row k="หลักทรัพย์" v={appt.assetTitle} />
            <Row k="วันที่นัด" v={svFmtThai(appt.date)} />
            <Row k="เวลา" v={appt.time ? appt.time + ' น.' : 'ยังไม่ระบุเวลา'} />
            <Row k="เจ้าหน้าที่ผู้รับผิดชอบ" v={appt.officer || 'ยังไม่ระบุ'} />
          </div>
          {appt.note && <><div className="cs-dt-sec">หมายเหตุ</div><div className="cs-dt-note">{appt.note}</div></>}
        </div>
        <div className="lrq-sal-foot">
          <span className="spacer" />
          <button className="btn danger" style={{ justifyContent: 'center' }} onClick={() => onDelete(appt)}>ยกเลิกนัดหมาย</button>
          <button className="btn primary" onClick={() => onEdit(appt)}>แก้ไข</button>
        </div>
      </div>
    </>
  );
}

// ── Popup แก้ไขการนัดหมาย (รายการเดียว) ────────────────────────────
function SvEditModal({ appt, onClose, onSave }) {
  const [date, setDate] = useState(appt.date);
  const [time, setTime] = useState(appt.time || '');
  const [timeUnset, setTimeUnset] = useState(!appt.time);
  const [officer, setOfficer] = useState(appt.officer || '');
  const [officerUnset, setOfficerUnset] = useState(!appt.officer);
  const [note, setNote] = useState(appt.note || '');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!date) return setErr('กรุณาระบุวันที่นัด');
    if (!timeUnset && !time) return setErr('กรุณาเลือกเวลา หรือเลือก “ยังไม่ระบุเวลา”');
    if (!officerUnset && !officer) return setErr('กรุณาเลือกเจ้าหน้าที่ หรือเลือก “ยังไม่ระบุเจ้าหน้าที่”');
    onSave({ ...appt, date, time: timeUnset ? '' : time, officer: officerUnset ? '' : officer, note });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card sv-dt-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>แก้ไขการนัดหมาย</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="sv-edit-meta">{appt.memberCode} · {appt.memberName}<span className="sv-asset-sep" />{appt.assetTitle}</div>
          <div className="lrq-grid c2">
            <SvField label="วันที่นัด"><ErpDate value={date} onChange={(v) => (e => { setErr(''); setDate(e.target.value); })({ target: { value: v } })} className="cfg-input" /></SvField>
            <SvField label="เวลา">
              <select className="cfg-input" value={time} disabled={timeUnset} onChange={e => { setErr(''); setTime(e.target.value); }}>
                <option value="">--- โปรดเลือก ---</option>
                {window.SV_TIMES.map(x => <option key={x} value={x}>{x} น.</option>)}
              </select>
            </SvField>
          </div>
          <label className="sv-check"><input type="checkbox" checked={timeUnset} onChange={e => { setErr(''); setTimeUnset(e.target.checked); }} /> ยังไม่ระบุเวลา</label>
          <div className="lrq-grid c1" style={{ marginTop: 8 }}>
            <SvField label="เจ้าหน้าที่ผู้รับผิดชอบ">
              <select className="cfg-input" value={officer} disabled={officerUnset} onChange={e => { setErr(''); setOfficer(e.target.value); }}>
                <option value="">--- โปรดเลือก ---</option>
                {window.SV_OFFICERS.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
              </select>
            </SvField>
          </div>
          <label className="sv-check"><input type="checkbox" checked={officerUnset} onChange={e => { setErr(''); setOfficerUnset(e.target.checked); }} /> ยังไม่ระบุเจ้าหน้าที่</label>
          <div className="sv-sec" style={{ marginTop: 14 }}>หมายเหตุ</div>
          <textarea className="cfg-input" rows="2" value={note} placeholder="ข้อมูลเพิ่มเติม...." onChange={e => setNote(e.target.value)} />
          {err && <div className="sv-err"><Icon name="warning" size={13} /> {err}</div>}
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" onClick={submit}><Icon name="check" /> บันทึกการแก้ไข</button>
        </div>
      </div>
    </>
  );
}

// ── Popup รายการนัดหมายของวัน (เลือกดู/แก้ไข/ยกเลิก/เพิ่ม) ───────────
function SvDayModal({ date, appts, onAdd, onView, onEdit, onDelete, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card sv-day-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>นัดหมายวันที่ {svFmtThai(date)}</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {window.SV_HOLIDAYS[date] && <div className="sv-day-holiday"><Icon name="info" size={13} /> {window.SV_HOLIDAYS[date]}</div>}
          <div className="sv-day-list">
            {appts.map(a => {
              const t = window.SV_TYPES[a.type] || {};
              return (
                <div key={a.id} className="sv-day-item">
                  <span className="sv-day-time">{a.time ? a.time : '--:--'}</span>
                  <span className="sv-cal-dot" style={{ background: t.color, alignSelf: 'center' }} />
                  <div className="sv-day-info">
                    <div className="sv-day-name">{a.memberName}<span className="sv-day-code">{a.memberCode}</span></div>
                    <div className="sv-day-sub">{a.assetTitle}{a.officer ? ' · ' + a.officer : ''}</div>
                  </div>
                  <div className="sv-day-act">
                    <button className="lrq-eyebtn lrq-eyebtn-g act-view" title="ดูรายละเอียด" onClick={() => onView(a)}
                            style={{ background: '#fff', border: '1px solid #D9D9D9', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="lrq-sal-foot">
          <span className="spacer" />
          <button className="btn primary" onClick={() => onAdd(date)}><Icon name="plus" /> เพิ่มนัดหมาย</button>
        </div>
      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// ── Popup ยกเลิกนัดหมาย ───────────────────────────────────────────
function SvCancelModal({ appt, onConfirm, onClose }) {
  const [note, setNote] = useState('');
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 'min(440px, 92vw)' }}>
        <div style={{ padding: '28px 28px 26px' }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#f5222d', color: '#fff',
                        display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="close" size={30} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>ยกเลิกการนัดหมาย</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12.5, marginBottom: 18 }}>
            <div>เลขที่ออกสำรวจ : <b>{appt.surveyNo || appt.id}</b></div>
            <div>ชื่อผู้กู้ : <b>{appt.memberName}</b></div>
          </div>
          <div style={{ fontSize: 12.5, marginBottom: 6 }}>หมายเหตุ</div>
          <textarea className="cfg-input" rows="3" value={note} placeholder="โปรดระบุข้อมูล"
                    onChange={e => setNote(e.target.value)} style={{ marginBottom: 24 }} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn" style={{ minWidth: 90, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn danger primary" style={{ minWidth: 90, justifyContent: 'center' }}
                    onClick={() => onConfirm(note)}>ยืนยัน</button>
          </div>
        </div>
      </div>
    </>
  );
}

function SurveyAppointmentPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const today = window.SV_TODAY;
  const [ty, tm] = [Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1];
  const [year, setYear] = useState(ty);
  const [month, setMonth] = useState(tm);
  const [view, setView] = useState('month');
  const [appts, setAppts] = useState(window.svLoad);
  const [modalOpen, setModalOpen] = useState(false);
  const [presetDate, setPresetDate] = useState('');
  const [dayDate, setDayDate] = useState(null);
  const [detailAppt, setDetailAppt] = useState(null);
  const [editAppt, setEditAppt] = useState(null);
  const [cancelAppt, setCancelAppt] = useState(null);
  const [permitOpen, setPermitOpen] = useState(false);

  window.useBreadcrumb([{ label: 'นัดหมายออกสำรวจหลักทรัพย์', current: true }], []);

  const byDate = React.useMemo(() => {
    const m = {};
    appts.forEach(a => { (m[a.date] = m[a.date] || []).push(a); });
    Object.values(m).forEach(list => list.sort((x, y) => (x.time || '').localeCompare(y.time || '')));
    return m;
  }, [appts]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const saveAppts = (newOnes) => {
    if (!newOnes.length) { setModalOpen(false); onToast && onToast('ยังไม่ได้ระบุวันนัดสำรวจ'); return; }
    const next = [...appts, ...newOnes];
    setAppts(next); window.svSave(next); setModalOpen(false);
    // เด้งไปเดือนของนัดแรก
    const first = newOnes[0].date; setYear(Number(first.slice(0, 4))); setMonth(Number(first.slice(5, 7)) - 1); setView('month');
    audit && audit.log && audit.log({ action: 'create', module: 'สินเชื่อ — นัดหมายออกสำรวจ',
      target: newOnes[0].memberCode + ' · ' + newOnes[0].memberName, summary: `ลงนัดออกสำรวจหลักทรัพย์ ${newOnes.length} รายการ` });
    onToast && onToast(`บันทึกนัดหมายออกสำรวจ ${newOnes.length} รายการเรียบร้อยแล้ว`);
  };

  const openAdd = (date) => { setPresetDate(date || ''); setDayDate(null); setModalOpen(true); };
  const onDayClick = (date) => { if ((byDate[date] || []).length) setDayDate(date); else openAdd(date); };

  const updateAppt = (upd) => {
    const next = appts.map(a => a.id === upd.id ? upd : a);
    setAppts(next); window.svSave(next); setEditAppt(null); setDetailAppt(null);
    audit && audit.log && audit.log({ action: 'update', module: 'สินเชื่อ — นัดหมายออกสำรวจ',
      target: upd.memberCode + ' · ' + upd.memberName, summary: `แก้ไขนัดหมายออกสำรวจ (${upd.assetTitle})` });
    onToast && onToast('บันทึกการแก้ไขนัดหมายเรียบร้อยแล้ว');
  };
  const deleteAppt = (appt) => setCancelAppt(appt);
  const doCancelAppt = (appt, note) => {
    const next = appts.filter(a => a.id !== appt.id);
    setAppts(next); window.svSave(next); setDetailAppt(null); setEditAppt(null); setCancelAppt(null);
    const remain = next.filter(a => a.date === appt.date);
    if (!remain.length) setDayDate(null);
    audit && audit.log && audit.log({ action: 'delete', module: 'สินเชื่อ — นัดหมายออกสำรวจ',
      target: appt.memberCode + ' · ' + appt.memberName,
      summary: `ยกเลิกนัดหมายออกสำรวจ (${appt.assetTitle})` + (note ? ' — ' + note : '') });
    onToast && onToast('ยกเลิกนัดหมายเรียบร้อยแล้ว');
  };

  const todayLabel = `วันนี้ ${Number(today.slice(8))}, ${SV_MONTHS_TH[Number(today.slice(5, 7)) - 1]} ${ty + 543}`;

  return (
    <div data-screen-label="นัดหมายออกสำรวจหลักทรัพย์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>ตารางปฏิทิน — นัดหมายออกสำรวจ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ลงนัดออกสำรวจหลักทรัพย์ที่บันทึกในระบบ และติดตามบนปฏิทิน</div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={() => setPermitOpen(true)}><Icon name="print" /> พรีวิว/พิมพ์</button>
        <button className="btn primary sm" onClick={() => openAdd('')}><Icon name="plus" /> เพิ่มการนัดหมาย</button>
      </div>

      <div className="search-card sv-toolbar">
        <div className="sv-today">{todayLabel}</div>
        <div className="sv-legend">
          {Object.entries(window.SV_TYPES).map(([k, t]) => (
            <span key={k} className="sv-legend-item"><span className="sv-cal-dot" style={{ background: t.color }} /> {t.label}</span>
          ))}
        </div>
        <div className="sv-nav">
          <button className="btn ghost sm" onClick={prev} aria-label="ก่อนหน้า"><Icon name="chevLeft" /></button>
          <div className="sv-nav-label">{view === 'month' ? SV_MONTHS_TH[month] + ' ' : ''}{year + 543}</div>
          <button className="btn ghost sm" onClick={next} aria-label="ถัดไป"><Icon name="chevRight" /></button>
          <div className="sv-viewtabs">
            <button className={"sv-vtab" + (view === 'month' ? ' on' : '')} onClick={() => setView('month')}>เดือน</button>
            <button className={"sv-vtab" + (view === 'year' ? ' on' : '')} onClick={() => setView('year')}>ปี</button>
          </div>
        </div>
      </div>

      {view === 'month' ? (
        <div className="search-card sv-cal-card">
          <SvMonthGrid year={year} month={month} byDate={byDate} today={today}
                       onDayClick={onDayClick} />
        </div>
      ) : (
        <div className="search-card sv-cal-card">
          <SvYearGrid year={year} byDate={byDate} onPickMonth={(m) => { setMonth(m); setView('month'); }} />
        </div>
      )}

      {modalOpen && <SvApptModal presetDate={presetDate} onClose={() => setModalOpen(false)} onSave={saveAppts} />}
      {dayDate && <SvDayModal date={dayDate} appts={byDate[dayDate] || []}
                              onAdd={openAdd} onView={setDetailAppt} onEdit={setEditAppt}
                              onDelete={deleteAppt} onClose={() => setDayDate(null)} />}
      {detailAppt && <SvApptDetailModal appt={detailAppt} onClose={() => setDetailAppt(null)}
                                        onEdit={(a) => { setDetailAppt(null); setEditAppt(a); }} onDelete={deleteAppt} />}
      {editAppt && <SvEditModal appt={editAppt} onClose={() => setEditAppt(null)} onSave={updateAppt} />}
      {permitOpen && <window.SurveyPermitPrintModal appts={appts} onClose={() => setPermitOpen(false)} />}
      {cancelAppt && <SvCancelModal appt={cancelAppt} onClose={() => setCancelAppt(null)}
                                    onConfirm={(note) => doCancelAppt(cancelAppt, note)} />}
    </div>
  );
}

Object.assign(window, { SurveyAppointmentPage });
