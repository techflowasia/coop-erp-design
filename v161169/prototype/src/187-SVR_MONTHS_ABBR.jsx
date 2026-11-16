// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — สำรวจหลักทรัพย์ (สรุปผลออกสำรวจ / SurveyResultPage)
//  ดึงหลักทรัพย์ที่บันทึก → นัดหมายออกสำรวจ → ออกสำรวจ + สรุปราคาประเมิน
//  ใช้ฟอร์มหลักทรัพย์ร่วมกับเมนูบันทึกหลักทรัพย์ (window.LcForm)
// ════════════════════════════════════════════════════════════════════

const SVR_MONTHS_ABBR = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const svrDate = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return `${d} ${SVR_MONTHS_ABBR[m - 1]}${String(y + 543).slice(-2)}`; };

// ── ส่วน "สรุปข้อมูลออกสำรวจ" (เอกสาร/ภาพ/บันทึก) ต่อท้ายฟอร์มหลักทรัพย์ ──
function SvrSurveySection({ rec, set, index }) {
  const docs = rec.svDocs || [];
  const images = rec.svImages || [];
  const fileRef = React.useRef(null);
  const imgRef = React.useRef(null);
  const addDocs = (files) => set('svDocs', [...docs, ...Array.from(files).map(f => f.name)]);
  const addImages = (files) => set('svImages', [...images, ...Array.from(files).map(f => ({ name: f.name, cap: '' }))]);
  const setCap = (i, v) => set('svImages', images.map((im, j) => j === i ? { ...im, cap: v } : im));
  const delImage = (i) => set('svImages', images.filter((_, j) => j !== i));
  const delDoc = (i) => set('svDocs', docs.filter((_, j) => j !== i));

  return (
    <div className="search-card lrq-sheet svr-survey">
      <div className="lrq-subhead cs-sec svr-survey-head">
        สรุปข้อมูลออกสำรวจ
        <label className="svr-blind"><input type="checkbox" checked={!!rec.svBlindLand} onChange={e => set('svBlindLand', e.target.checked)} /> ที่ดินตาบอด</label>
      </div>

      <div className="lrq-subhead cs-sec">เอกสารหลักฐาน</div>
      <label className="lrq-lbl">อัปโหลดเอกสาร</label>
      <div className="svr-drop" onClick={() => fileRef.current && fileRef.current.click()}>
        <Icon name="upload" size={18} /> คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด
        <input ref={fileRef} type="file" multiple hidden onChange={e => e.target.files.length && addDocs(e.target.files)} />
      </div>
      {docs.length > 0 && (
        <div className="svr-doclist">
          {docs.map((d, i) => (
            <div key={i} className="svr-docrow">
              <span className="svr-docname"><Icon name="attach" size={13} /> {d}</span>
              <span className="spacer" />
              <button className="lrq-eyebtn act-view" title="ดูเอกสาร"><Icon name="eye" size={14} /></button>
              <button className="lrq-delbtn act-del" title="ลบเอกสาร" onClick={() => delDoc(i)}><Icon name="trash" size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="lrq-subhead cs-sec" style={{ marginTop: 14 }}>อัปโหลดภาพ</div>
      <div className="svr-imggrid">
        {images.map((im, i) => (
          <div key={i} className="svr-imgcell">
            <div className="svr-imgthumb">
              <span className="svr-imgph"><Icon name="home" size={22} /></span>
              <div className="svr-imgover"><button className="svr-imgbtn act-view" title="ดูภาพ"><Icon name="eye" size={14} /></button><button className="svr-imgbtn act-del" title="ลบภาพ" onClick={() => delImage(i)}><Icon name="trash" size={14} /></button></div>
            </div>
            <input className="cfg-input sm" value={im.cap} placeholder="บรรยายรูปภาพ" onChange={e => setCap(i, e.target.value)} />
          </div>
        ))}
        <button className="svr-imgadd" onClick={() => imgRef.current && imgRef.current.click()}>
          <Icon name="plus" size={18} /><span>อัปโหลด</span>
          <input ref={imgRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files.length && addImages(e.target.files)} />
        </button>
      </div>

      <div className="lrq-subhead cs-sec" style={{ marginTop: 14 }}>บันทึกเพิ่มเติม</div>
      <textarea className="cfg-input" rows="2" value={rec.svNote || ''} placeholder="โปรดระบุข้อมูล..." onChange={e => set('svNote', e.target.value)} />
    </div>
  );
}

// ── การ์ดข้อมูลสมาชิก (ส่วนหัว สรุปผลออกสำรวจ) ─────────────────────
function SvrMemberCard({ member, onSearch, onPick }) {
  const Field = ({ label, value, mono }) => (
    <div className="lrq-f"><label className="lrq-lbl">{label}</label>
      <input className={"cfg-input lrq-ro" + (mono ? " mono" : "")} value={value || ''} placeholder="โปรดระบุข้อมูล" readOnly /></div>
  );
  return (
    <div className="search-card svr-member">
      <div className="lrq-grid c4">
        <div className="lrq-f"><label className="lrq-lbl">เลขสมาชิก</label>
          <ErpMemberPicker member={member} onPick={onPick} source={window.MEMBERS_LIST}
                           title="ค้นหาสมาชิก — สำรวจหลักทรัพย์" placeholder="เลขสมาชิก…" />
        </div>
        <Field label="ชื่อ-นามสกุลสมาชิก" value={member && member.name} />
        <Field label="เลขที่บัตรประชาชน" value={member && member.citizenId} mono />
        <Field label="สถานะสมาชิก" value={member && member.type} />
        <Field label="หน่วย/สังกัด" value={member && (member.deptCode ? member.deptCode + '-' + member.dept : member.dept)} />
        <Field label="สถานภาพ" value={member && member.status} />
        <Field label="ชื่อคู่สมรส" value={member && member.spouse} />
      </div>
    </div>
  );
}

// ── แถวหลักทรัพย์ในรายการสรุปผลออกสำรวจ ─────────────────────────────
function SvrAssetRow({ target, onEdit, checked, onToggle }) {
  const printable = target.demoBadge === 'price';
  const { appt, asset, result } = target;
  const rec = result || asset;
  const title = asset ? window.lcAssetTitle(asset) : appt.assetTitle;
  const type = asset ? asset.type : (appt.assetType || '—');
  const summary = target.demoBadge === 'price' ? target.demoPrice
    : target.demoBadge === 'draft' ? null
    : target.demoBadge === null ? null
    : (result && result.summaryPrice);
  const isDraft = target.demoBadge ? target.demoBadge === 'draft' : !!(rec && rec.svDraft);
  return (
    <div className={"svr-row" + (checked ? " sel" : "")}>
      <span className={"svr-row-radio" + (checked ? " on" : "")} role="checkbox" aria-checked={!!checked} aria-disabled={!printable}
            title={printable ? 'เลือกรายการเพื่อพิมพ์เอกสารรายละเอียดพิจารณา' : 'ยังไม่ได้บันทึกสรุปราคาประเมิน หรือเป็นแบบร่าง — พิมพ์ไม่ได้'}
            style={printable ? null : { opacity: .35, cursor: 'not-allowed', background: '#f5f5f5' }}
            onClick={printable ? onToggle : undefined}>{checked && <Icon name="check" size={11} />}</span>
      <div className="svr-row-info">
        <div className="svr-row-t">{title}<span className="svr-row-type">ประเภท : <b>{type}</b></span></div>
        <div className="svr-row-sub">
          {asset && window.lcAssetArea(asset) !== '—' ? <>เนื้อที่ : {window.lcAssetArea(asset)}<span className="svr-row-gap" /></> : null}
          ที่ตั้ง : {asset ? window.lcAssetLoc(asset) : '—'}
        </div>
        {(() => {
          // ความสัมพันธ์โฉนด ↔ สิ่งปลูกสร้าง (จากทะเบียนหลักทรัพย์ของสมาชิก)
          if (!asset) return null;
          const pool = window.lcOf ? window.lcOf(appt.memberCode) : [];
          const isTitle = (window.LC_TITLE_TYPES || []).includes(asset.type);
          let label = '', items = [], warn = false;
          if (isTitle) {
            label = 'สิ่งปลูกสร้างบนโฉนดนี้';
            items = window.lcBuildingsOn(asset, pool)
              .map(r => { const b = r.building || {}; return [b.btype, b.houseNo ? 'เลขที่ ' + b.houseNo : '', b.floors ? b.floors + ' ชั้น' : '', '(' + (r.code || '') + ')'].filter(Boolean).join(' '); });
            if (!items.length) items = ['ไม่มี (ที่ดินเปล่า)'];
          } else if (asset.type === 'สิ่งปลูกสร้าง') {
            label = 'ตั้งอยู่บนโฉนด';
            const nos = window.lcBldTitleNos(asset);
            items = nos.map(no => {
              const land = pool.find(r => (window.LC_TITLE_TYPES || []).includes(r.type) && r.titleNo === no);
              if (!land) { warn = true; return 'เลขที่ ' + no + ' (ไม่พบในทะเบียน)'; }
              return 'เลขที่ ' + land.titleNo + (land.rai || land.ngan || land.wa ? ' · ' + (land.rai || 0) + '-' + (land.ngan || 0) + '-' + (land.wa || 0) + ' ไร่' : '');
            });
            if (!items.length) { items = ['ยังไม่ได้ผูกโฉนด']; warn = true; }
          } else if (asset.type === 'ห้องชุด' && asset.refTitleNo) {
            label = 'อาคารชุดตั้งอยู่บนโฉนด';
            items = ['เลขที่ ' + asset.refTitleNo + ' (ที่ดินนิติบุคคลอาคารชุด)'];
          } else return null;
          return (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4, fontSize: 12.5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: warn ? '#cf1322' : 'rgba(0,0,0,.65)' }}><Icon name="home" size={12} /> {label} :</span>
              {items.map((t, i) => (
                <span key={i} style={{ padding: '1px 8px', borderRadius: 4, border: '1px solid ' + (warn ? '#ffccc7' : 'rgba(35,116,80,.25)'), background: warn ? '#fff2f0' : '#fff', color: warn ? '#cf1322' : 'var(--brand-700, #237450)', fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          );
        })()}
        <div className="svr-row-chips">
          <span className="svr-chip"><Icon name="calendar" size={11} /> {svrDate(appt.date)}</span>
          <span className="svr-chip"><Icon name="history" size={11} /> {appt.time ? appt.time + ' น.' : 'ไม่ระบุเวลา'}</span>
          <span className="svr-chip"><Icon name="user" size={11} /> {appt.officer || 'ยังไม่ระบุ'}</span>
        </div>
      </div>
      {isDraft
        ? <span className="svr-row-draft">บันทึกแบบร่าง</span>
        : summary && <span className="svr-row-price">สรุปราคาประเมิน {summary}</span>}
      <button className="lrq-eyebtn act-edit" title="กรอกผลสำรวจ" onClick={onEdit}><Icon name="edit" size={14} /></button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  หน้าหลัก — สำรวจหลักทรัพย์ (สรุปผลออกสำรวจ)
// ═════════════════════════════════════════════════════════════════
function SurveyResultPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [member, setMember] = useState(null);
  const [targets, setTargets] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [editing, setEditing] = useState(null);   // { key, rec, index }
  const [okMsg, setOkMsg] = useState(null);       // success modal หลังบันทึกผลสำรวจ
  const [selected, setSelected] = useState([]);   // คีย์รายการที่เลือกไว้สำหรับสั่งพิมพ์
  const [printOpen, setPrintOpen] = useState(false);
  const toggleSel = (key) => setSelected(s => s.indexOf(key) >= 0 ? s.filter(k => k !== key) : s.concat([key]));
  const allSel = targets.length > 0 && selected.length === targets.length;

  const useBreadcrumb = window.useBreadcrumb;
  useBreadcrumb(
    editing ? [{ label: 'สำรวจหลักทรัพย์', onClick: () => setEditing(null) }, { label: 'สรุปผลออกสำรวจ', current: true }]
            : [{ label: 'สำรวจหลักทรัพย์', current: true }],
    [editing]);

  const savedBadge = React.useMemo(() => {
    const entries = (audit && audit.entries) || window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs
      ? window.savedBadgeTs(entries, ['สินเชื่อ — สำรวจหลักทรัพย์'], 'svr.summary')
      : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  }, [audit]);

  const svrHistory = React.useMemo(() => {
    const entries = (audit && audit.entries) || window.AUDIT_SEED || [];
    const logged = entries
      .filter(e => e.module === 'สินเชื่อ — สำรวจหลักทรัพย์' && (!member || String(e.target || '').indexOf(member.code) >= 0));
    // ไทม์ไลน์จากนัดหมาย/ผลสำรวจของสมาชิก (เมื่อยังไม่มีรายการใน Audit Trail)
    const derived = (member ? targets : []).map((t) => {
      const ap = t.appt || {};
      const res = t.result || {};
      const done = !!(res.svSurveyDate || res.svOfficer || t.result);
      return {
        action: done ? 'update' : 'create',
        ts: (res.svSurveyDate || ap.date || '') + 'T' + (res.svTime || ap.time || '09:00'),
        user: res.svOfficer || ap.officer || 'เจ้าหน้าที่สินเชื่อ',
        summary: (done ? 'บันทึกผลออกสำรวจ — ' : 'นัดหมายออกสำรวจ — ') + (ap.assetTitle || ''),
        changes: done && res.summaryPrice
          ? [{ field: 'สรุปราคาประเมิน (บาท)', before: '—', after: res.summaryPrice }]
          : null,
      };
    });
    return (logged.length ? logged : derived)
      .slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  }, [audit, member, targets]);

  // สาธิต: ให้มี 3 รายการ และสถานะต่างกัน (1 ยังไม่บันทึก, 2 แบบร่าง, 3 สรุปราคาประเมินแล้ว)
  const svrDemo = (list, full) => {
    // หลักทรัพย์ที่มีราคาสรุปในทะเบียนแล้ว ถือว่าสรุปราคาประเมินแล้ว (ข้อมูลจริงของสมาชิก)
    const real = list.map(t => {
      if (t.result) {
        const price = t.result.summaryPrice || t.result.coopPrice || t.result.govPrice || '';
        return { ...t, demoBadge: t.result.svDraft ? 'draft' : (price ? 'price' : null), demoPrice: price };
      }
      const price = (t.asset && t.asset.summaryPrice) || '';
      return { ...t, demoBadge: price ? 'price' : null, demoPrice: price };
    });
    if (real.some(t => t.demoBadge === 'price')) return real;
    const out = list.slice();
    const base = out[0];
    const mocks = [
      { title: 'ห้องชุดเลขที่ 18/305', type: 'ห้องชุด', date: '2026-04-17', time: '10:30', officer: 'มาลี สุขใจ' },
      { title: 'นส3ก เลขที่ 1180', type: 'นส3ก', date: '2026-04-24', time: '13:30', officer: 'ประเสริฐ วงศ์ดี' },
    ];
    while (out.length < 3 && base) {
      const mk = mocks[out.length - 1] || mocks[0];
      out.push({
        key: 'demo-' + out.length, asset: null, result: null,
        appt: { id: 'SV-DEMO-' + out.length, type: 'survey', date: mk.date, time: mk.time,
                memberCode: full.code, memberName: full.name, officer: mk.officer,
                assetTitle: mk.title, assetType: mk.type },
      });
    }
    const mapped = out.slice(0, 3).map((t, i) => {
      // ผลสำรวจที่บันทึกจริง (ราคาสรุป หรือราคาประเมินสหกรณ์/ราชการ)
      if (t.result) {
        const price = t.result.summaryPrice || t.result.coopPrice || t.result.govPrice || '';
        return { ...t, demoBadge: t.result.svDraft ? 'draft' : (price ? 'price' : null), demoPrice: price };
      }
      return { ...t, demoBadge: i === 1 ? 'draft' : null };
    });
    // ตัวอย่างที่สรุปราคาประเมินแล้ว 3 ประเภท: ที่ดิน (โฉนด) · สิ่งปลูกสร้าง · ห้องชุด
    return base ? mapped.concat(window.svrMockTargets(full)) : mapped;
  };

  const pickMember = (m) => {    const full = (window.MEMBERS_LIST || []).find(x => x.code === m.code) || m;
    setMember(full);
    setTargets(svrDemo(window.svSurveyTargets(full.code), full));
    setSelected([]);
    setEditing(null);
    setSearchOpen(false);
  };

  const openEdit = (t, index) => {
    const base = t.result || (t.asset ? JSON.parse(JSON.stringify(t.asset)) : window.lcBlank('โฉนด'));
    setEditing({ key: t.key, rec: base, index });
  };
  const updateRec = (rec) => setEditing(e => ({ ...e, rec }));

  const saveResult = (draft) => {
    const refErr = !draft && window.lcBuildingRefError(editing.rec, window.lcOf(member.code));
    if (refErr) { onToast && onToast(refErr); return; }
    const map = window.svResultLoad();
    map[editing.key] = { ...editing.rec, svDraft: !!draft };
    window.svResultSave(map);
    setTargets(svrDemo(window.svSurveyTargets(member.code), member));
    setSelected([]);
    audit && audit.log && audit.log({ action: 'update', module: 'สินเชื่อ — สำรวจหลักทรัพย์',
      target: member.code + ' · ' + member.name,
      summary: `บันทึกผลสำรวจหลักทรัพย์ (${window.lcAssetTitle(editing.rec)})${draft ? ' [แบบร่าง]' : ''}` });
    setOkMsg({
      title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: (draft ? 'บันทึกแบบร่างผลสำรวจ ' : 'บันทึกผลสำรวจหลักทรัพย์ ') +
        '“' + window.lcAssetTitle(editing.rec) + '” เรียบร้อยแล้ว',
    });
  };

  return (
    <div data-screen-label="สำรวจหลักทรัพย์">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--primary)' }}>สรุปผลออกสำรวจ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ออกสำรวจหลักทรัพย์ตามนัดหมาย และสรุปราคาประเมิน</div>
        </div>
        <span className="spacer" />
        {member && (
          <div className="lc-topbtns">
            {!editing && savedBadge && <span className="saved-badge">{savedBadge}</span>}
            {!editing && <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ</button>}
            {editing ? (
              <>
                <button className="btn sm" onClick={() => setEditing(null)}>ยกเลิก</button>
                <button className="btn sm" onClick={() => saveResult(true)}>บันทึกแบบร่าง</button>
                <button className="btn primary sm" onClick={() => saveResult(false)}><Icon name="check" /> บันทึก</button>
              </>
            ) : (
              <>
                <button className="btn sm" disabled={selected.length === 0}
                        title={selected.length === 0 ? 'เลือกรายการหลักทรัพย์ที่ต้องการพิมพ์ก่อน' : 'พิมพ์เอกสารรายละเอียดพิจารณาของรายการที่เลือก'}
                        onClick={() => setPrintOpen(true)}><Icon name="print" /> พิมพ์เอกสารรายละเอียดพิจารณา{selected.length > 0 ? ' (' + selected.length + ')' : ''}</button>
              </>
            )}
          </div>
        )}
      </div>

      <SvrMemberCard member={member} onSearch={() => setSearchOpen(true)} onPick={pickMember} />

      {!member ? (
        <div className="search-card cs-empty">
          <div className="gc-ph-ico"><Icon name="search" size={26} /></div>
          <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
          <div className="gc-ph-sub">ค้นหาสมาชิกเพื่อดึงรายการหลักทรัพย์ที่นัดหมายออกสำรวจไว้</div>
        </div>
      ) : editing ? (
        <>
          <LcForm rec={editing.rec} onChange={updateRec} memberCollaterals={window.lcOf(member.code)} onToast={onToast} />
          <SvrSurveySection rec={editing.rec} set={(k, v) => updateRec({ ...editing.rec, [k]: v })} index={editing.index} />
        </>
      ) : (
        <>
          <div className="search-card svr-list-card">
            <div className="lrq-subhead cs-sec">รายการหลักทรัพย์</div>
            {targets.length === 0 ? (
              <div className="cs-rel-empty"><Icon name="calendar" size={16} /><span>สมาชิกรายนี้ยังไม่มีนัดหมายออกสำรวจหลักทรัพย์ — สร้างนัดหมายที่เมนู “นัดหมายออกสำรวจหลักทรัพย์”</span></div>
            ) : (
              <div className="svr-rows">
                {targets.map((t, i) => <SvrAssetRow key={t.key + '-' + i} target={t} onEdit={() => openEdit(t, i + 1)}
                                                    checked={selected.indexOf(t.key + '-' + i) >= 0} onToggle={() => toggleSel(t.key + '-' + i)} />)}
              </div>
            )}
          </div>
        </>
      )}

      {printOpen && member && (
        <window.SurveyReportPrintOverlay member={member} onClose={() => setPrintOpen(false)}
          targets={targets.filter((t, i) => selected.indexOf(t.key + '-' + i) >= 0 && t.demoBadge === 'price')} />
      )}
      {searchOpen && (
        <MemberSearchModal onPick={pickMember} onClose={() => setSearchOpen(false)}
                           title="ค้นหาสมาชิก — สำรวจหลักทรัพย์" source={window.MEMBERS_LIST} />
      )}
      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => { setOkMsg(null); setEditing(null); }} />
      )}
      {histOpen && member && (
        <LrqReqHistoryModal hist={svrHistory} reqNo={member.code} memberName={member.name}
                            title="ประวัติการทำรายการ — สำรวจหลักทรัพย์"
                            onClose={() => setHistOpen(false)} />
      )}
    </div>
  );
}

Object.assign(window, { SurveyResultPage });
