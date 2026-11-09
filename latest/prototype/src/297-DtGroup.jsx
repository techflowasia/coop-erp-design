// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ประเภทบัญชีเงินฝาก — 6 แท็บ + form/table primitives
//  ข้อมูลหลัก · ข้อกำหนด/ปรับ · จ่าย Int./Div./รักษาบัญชี · การคิด Int./Div.
//  · อัตรา Int./Div. · ถอนก่อนกำหนด
//  ใช้คลาสร่วม l2-* / sh-grid (ชุดเดียวกับหน้าค่าคงที่ประเภทเงินกู้)
// ════════════════════════════════════════════════════════════════════

// ─── Dense two-column form primitives (view/edit aware) ──────────────
function DtGroup({ title, sub, children }) {
  return (
    <div className="l2-group">
      <div className="l2-gh"><span className="l2-gh-t">{title}</span></div>
      {sub && <div className="muted" style={{ fontSize: 11, padding: '0 0 6px', lineHeight: 1.4 }}>{sub}</div>}
      {children}
    </div>
  );
}
function DtRow({ label, indent, stack, children }) {
  return (
    <div className={"l2-row" + (indent ? ' indent' : '') + (stack ? ' stack' : '')}>
      <div className="l2-label">{label}</div>
      <div className="l2-ctrl">{children}</div>
    </div>
  );
}
// เลือกหลายรายการ — ป้ายในช่อง + dropdown ติ๊กเลือก/ค้นหา
function DtMulti({ v, editing, onChange, opts, placeholder }) {
  const list = Array.isArray(v) ? v : [];
  const all = opts || [];
  const lab = (c) => { const o = all.find(x => x.v === c); return (o ? o.l : c).replace(/\s*\(ไม่นับครั้งถอน\)\s*$/, ''); };
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const ref = React.useRef(null);
  const [up, setUp] = React.useState(false);
  const openMenu = () => {
    if (!open && ref.current) { const r = ref.current.getBoundingClientRect(); setUp(window.innerHeight - r.bottom < 300 && r.top > window.innerHeight - r.bottom); }
    setOpen(o => !o);
  };
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const chip = (c, rm) => (
    <span key={c} className="dtm-chip" title={c + ' ' + lab(c)}><span className="mono">{c}</span><span className="dtm-chip-t">{lab(c)}</span>
      {rm && <button type="button" className="dtm-x" aria-label={'เอาออก ' + c} onClick={(e) => { e.stopPropagation(); onChange(list.filter(x => x !== c)); }}><Icon name="close" size={10} /></button>}
    </span>
  );
  if (!editing) return <div className="dtm-view">{list.length ? list.map(c => chip(c, false)) : <span className="muted">—</span>}</div>;
  const n = q.trim().toLowerCase();
  const shown = n ? all.filter(o => (o.v + ' ' + o.l).toLowerCase().includes(n)) : all;
  const toggle = (c) => onChange(list.includes(c) ? list.filter(x => x !== c) : [...list, c]);
  return (
    <div className="dtm" ref={ref}>
      <div className={'dtm-box' + (open ? ' open' : '')} onClick={openMenu}>
        {list.length ? list.map(c => chip(c, true)) : <span className="dtm-ph">{placeholder || 'เลือกรายการ'}</span>}
        <span className="dtm-caret"><Icon name="down" size={11} /></span>
      </div>
      {open && (
        <div className={'dtm-menu' + (up ? ' up' : '')}>
          <div className="dtm-search"><Icon name="search" size={12} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัส / ชื่อรายการ" /></div>
          <div className="dtm-list">
            {shown.length === 0 && <div className="dtm-empty">ไม่พบข้อมูล</div>}
            {shown.map(o => (
              <label key={o.v} className={'dtm-opt' + (list.includes(o.v) ? ' on' : '')}>
                <input type="checkbox" checked={list.includes(o.v)} onChange={() => toggle(o.v)} />
                <span className="mono dtm-code">{o.v}</span><span className="dtm-name">{o.l.replace(/\s*\(ไม่นับครั้งถอน\)\s*$/, '')}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
function DtNum({ v, editing, onChange, decimals, suffix, disabled, max, fill }) {
  if (!editing || disabled) {
    return (
      <div className={"l2-val num" + (disabled ? ' dis-val' : '')}>
        {v === '' || v == null ? '—' : (decimals != null ? fmt.money(Number(v || 0), decimals) : v)}
        {suffix ? <span className="l2-suf"> {suffix}</span> : null}
      </div>
    );
  }
  return (
    <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
      <input className="l2-input num" type="number" inputMode="decimal" style={fill ? { flex: 1, maxWidth: 'none' } : { maxWidth: max || 150 }}
             step={decimals ? '0.0001' : '1'} value={v}
             onChange={(e) => onChange(e.target.value)} />
      {suffix && <span className="l2-suf">{suffix}</span>}
    </div>
  );
}
function DtSel({ group, v, editing, onChange, disabled, width }) {
  if (!editing) return <div className="l2-val">{window.datLabel(group, v)}</div>;
  return (
    <select className="l2-select" value={group === 'depGroup' && window.depKindNorm ? window.depKindNorm(v) : group === 'accGroupACC' && window.depAccNorm ? window.depAccNorm(v) : v} disabled={disabled} style={width ? { maxWidth: width } : undefined}
            onChange={(e) => onChange(e.target.value)}>
      {window.DAT_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}
// รหัสบัญชีจากผังบัญชี (ระบบบัญชี) — แสดง รหัส · ชื่อบัญชี
function DtGl({ v, editing, onChange }) {
  const list = React.useMemo(() => { try { return (window.coaFlatAccounts ? window.coaFlatAccounts() : []).filter(a => a.kind === 'posting' && a.enabled !== false); } catch (e) { return []; } }, [editing]);
  const hit = list.find(a => a.code === String(v || ''));
  if (!editing) return <div className="l2-val">{v ? <><span className="mono">{v}</span>{hit ? ' · ' + hit.name : (window.coaAccountName ? (n => n && n !== String(v) ? ' · ' + n : '')(window.coaAccountName(v)) : '')}</> : '—'}</div>;
  return (
    <select className="l2-select" value={v || ''} onChange={(e) => onChange(e.target.value)} title="อ้างอิงจากผังบัญชี">
      <option value="">— เลือกรหัสบัญชี —</option>
      {v && !hit && <option value={v}>{v} (ไม่พบในผังบัญชี)</option>}
      {list.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
    </select>
  );
}
function DtTxt({ v, editing, onChange, mono, center, right, editLeft, placeholder }) {
  const al = right ? ' right' : center ? ' center' : '';
  if (!editing) return <div className={"l2-val" + (mono ? ' mono' : '') + al}>{v || '—'}</div>;
  return (
    <input className={"l2-input" + (mono ? ' mono' : '') + (editLeft ? '' : al)} value={v || ''}
           placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}
// checkbox row (full-width clickable label)
function DtCheck({ label, checked, editing, onChange }) {
  return (
    <label className={"l2-check lp-check-item" + (editing ? '' : ' ro')}>
      <input type="checkbox" className="ct-check" checked={!!checked} disabled={!editing}
             onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// ─── Table primitives ────────────────────────────────────────────────
function DtTableShell({ title, sub, count, editing, onAdd, addLabel, children, minWidth }) {
  return (
    <div className="search-card" style={{ marginTop: 12 }}>
      <div className="section-head" style={{ marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h3>{title}</h3>
          {sub && <div className="muted" style={{ fontSize: 11.5, marginTop: 2, fontWeight: 400 }}>{sub}</div>}
        </div>
        <div className="section-head-actions" style={{ marginLeft: 'auto' }}>
          {editing && onAdd && <button className="btn primary sm" onClick={onAdd}><Icon name="plus" /> {addLabel || 'เพิ่มแถว'}</button>}
        </div>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl sh-grid" style={{ minWidth: minWidth || 760 }}>{children}</table>
      </div></div>
    </div>
  );
}
function DtTxtCell({ editing, v, onChange, align }) {
  return editing
    ? <input className="sh-grid-input" style={{ textAlign: align || 'left', maxWidth: 'none' }} value={v || ''} onChange={(e) => onChange(e.target.value)} />
    : <span style={{ display: 'block', textAlign: align || 'left' }}>{v || <span className="muted">—</span>}</span>;
}
function DtNumCell({ editing, v, onChange, decimals }) {
  return editing
    ? <input className="sh-grid-input" type="number" step={decimals ? '0.0001' : '1'} value={v} onChange={(e) => onChange(e.target.value)} />
    : <span className="sh-grid-num">{decimals != null ? fmt.money(Number(v || 0), decimals) : (v ?? '—')}</span>;
}
function DtDateCell({ editing, v, onChange }) {
  return editing
    ? <window.ThaiDateField value={v || ''} onChange={onChange} />
    : <span className="mono" style={{ display: 'block' }}>{v ? fmt.date(v) : <span className="muted">—</span>}</span>;
}
function DtSelCell({ editing, group, v, onChange }) {
  return editing
    ? <select className="l2-select" style={{ height: 28, minWidth: 110 }} value={v} onChange={(e) => onChange(e.target.value)}>
        {window.DAT_OPTS[group].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    : <span>{window.datLabel(group, v)}</span>;
}
function DtCheckCell({ editing, v, onChange }) {
  return <input type="checkbox" className="ct-check" checked={!!v} disabled={!editing} onChange={(e) => onChange(e.target.checked)} />;
}
function DtDelCell({ editing, onDel }) {
  if (!editing) return null;
  return <td className="center"><button className="btn sm tt-del-btn" onClick={onDel} title="ลบแถว"><Icon name="trash" size={13} /></button></td>;
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 1 — ข้อมูลหลัก
// ════════════════════════════════════════════════════════════════════
function DatTabMaster({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <DtGroup title="ข้อมูลประเภทบัญชี" sub="ข้อมูลกลางที่แสดงเหมือนกันทุกแท็บ — ใช้กำหนดข้อมูลพื้นฐานของประเภทเงินฝาก">
            <DtRow label="ประเภทบุคคลที่ใช้ได้"><DtSel group="personType" v={s.personType} editing={editing} onChange={(v) => set('personType', v)} /></DtRow>
            <DtRow label="กลุ่มเงินฝาก"><DtSel group="depGroup" v={s.depGroup} editing={editing} onChange={(v) => set('depGroup', v)} /></DtRow>
            <DtRow label="รหัสคุมเลขที่บัญชี">{(() => {
              const code = (s.docNo || '').trim().toUpperCase();
              const ctr = code ? (window.DEP_ACC_COUNTERS || {})[code] : null;
              return <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                <DtTxt v={s.docNo} editing={editing} mono placeholder="DPACCDOCNO10" onChange={(v) => set('docNo', v.toUpperCase())} />
                {ctr && <div className="muted" style={{ fontSize: 12 }}>เลขที่บัญชีล่าสุด <b className="mono" style={{ color: 'var(--text-1, inherit)' }}>{String(ctr.last).padStart(ctr.digits || 7, '0')}</b> · ปรับปรุง {fmt.date(ctr.updated.slice(0, 10))} {ctr.updated.slice(11, 16)} น.</div>}
                {code && !ctr && <div style={{ fontSize: 12, color: 'var(--danger)' }}>ไม่พบรหัสคุม “{code}” ในฐานข้อมูล — เปิดบัญชีประเภทนี้ไม่ได้ ติดต่อฝ่าย IT</div>}
              </div>;
            })()}</DtRow>
            <DtRow label="จำนวนบัญชีที่สามารถเปิดได้">
              {editing
                ? <select className="l2-select" value={s.limitAccounts ? 'limit' : 'none'} onChange={(e) => set('limitAccounts', e.target.value === 'limit')}>
                    <option value="none">ไม่จำกัด</option><option value="limit">จำกัด</option>
                  </select>
                : <div className="l2-val">{s.limitAccounts ? 'จำกัด' : 'ไม่จำกัด'}</div>}
            </DtRow>
            {s.limitAccounts && <DtRow label="จำนวนบัญชีต่อสมาชิก" indent><DtNum v={s.maxAccounts} editing={editing} suffix="บัญชี" max={110} onChange={(v) => set('maxAccounts', v)} /></DtRow>}
            <DtRow label="คงเหลือขั้นต่ำถอน Online"><DtNum v={s.minOnlineBalance} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minOnlineBalance', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="การเชื่อมโยงบัญชี (GL / ACC)" sub="ผูกรหัสบัญชีแยกประเภทและกลุ่มบัญชี เพื่อสร้างรายการบัญชีอัตโนมัติเมื่อฝาก/ถอน/จ่ายดอกเบี้ย/หักภาษี/เก็บค่าธรรมเนียม">
            <DtRow label="รหัสบัญชี GL"><DtGl v={s.glCode} editing={editing} onChange={(v) => set('glCode', v)} /></DtRow>
            <DtRow label="รหัสคู่บัญชี"><DtGl v={s.glPair} editing={editing} onChange={(v) => set('glPair', v)} /></DtRow>
            <DtRow label="กลุ่มลง ACC"><DtSel group="accGroupACC" v={s.accGroupACC} editing={editing} onChange={(v) => set('accGroupACC', v)} /></DtRow>
          </DtGroup>
        </div>

        <div className="l2-col">
          <DtGroup title="การพิมพ์สมุดบัญชี" sub="ชื่อโครงการและหมายเหตุ ใช้พิมพ์ในสมุดเงินฝากหรือเอกสารที่เกี่ยวข้อง">
            <DtRow label="ชื่อโครงการที่พิมพ์ในสมุด"><DtTxt v={s.passbookProjectName} editing={editing} onChange={(v) => set('passbookProjectName', v)} /></DtRow>
            <DtRow label="หมายเหตุพิมพ์สมุด 1"><DtTxt v={s.bookNote1} editing={editing} placeholder="ข้อความหมายเหตุ" onChange={(v) => set('bookNote1', v)} /></DtRow>
            <DtRow label="หมายเหตุพิมพ์สมุด 2"><DtTxt v={s.bookNote2} editing={editing} placeholder="ข้อความหมายเหตุเพิ่มเติม" onChange={(v) => set('bookNote2', v)} /></DtRow>
          </DtGroup>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 2 — ข้อกำหนดและการปรับ
// ════════════════════════════════════════════════════════════════════
function DatTabConditions({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <DtGroup title="ฝาก — ถอน" sub="ตรวจสอบยอดขั้นต่ำเมื่อเปิด/ฝาก/ถอน และยอดคงเหลือหลังถอน">
            <DtRow label="เปิดบัญชีขั้นต่ำ"><DtNum v={s.minOpen} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minOpen', v)} /></DtRow>
            <DtRow label="เงื่อนไขเปิดบัญชี"><DtSel group="openCond" v={s.openCond} editing={editing} onChange={(v) => set('openCond', v)} /></DtRow>
            <DtRow label="ฝากขั้นต่ำ/รายการ"><DtNum v={s.minDeposit} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minDeposit', v)} /></DtRow>
            <DtRow label="ถอนขั้นต่ำ/รายการ"><DtNum v={s.minWithdraw} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minWithdraw', v)} /></DtRow>
            <DtRow label="คงเหลือขั้นต่ำหลังถอน"><DtNum v={s.minBalance} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minBalance', v)} /></DtRow>
            <DtCheck label="จำกัดยอดคงเหลือสูงสุด" checked={s.maxBalanceOn} editing={editing} onChange={(v) => set('maxBalanceOn', v)} />
            {s.maxBalanceOn && <>
              <DtRow label="สูงสุดไม่เกิน" indent><DtNum v={s.maxBalance} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('maxBalance', v)} /></DtRow>
              <DtRow label="เปรียบเทียบจาก" indent><DtSel group="compareBase" v={s.compareBase} editing={editing} onChange={(v) => set('compareBase', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="ข้อกำหนดครั้งการถอน">
            <DtCheck label="จำกัดจำนวนครั้งการถอน" checked={s.wdCountLimit} editing={editing} onChange={(v) => set('wdCountLimit', v)} />
            {s.wdCountLimit && <>
              <DtRow label="ถอนได้ไม่เกิน" indent><DtNum v={s.wdCountMax} editing={editing} suffix="ครั้ง" max={110} onChange={(v) => set('wdCountMax', v)} /></DtRow>
              <DtRow label="ภายใน" indent>
                <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                  <DtNum v={s.wdCountWithin} editing={editing} max={90} onChange={(v) => set('wdCountWithin', v)} />
                  <DtSel group="timeUnit" v={s.wdCountWithinUnit} editing={editing} width={90} onChange={(v) => set('wdCountWithinUnit', v)} />
                </div>
              </DtRow>
            </>}
            <DtRow label="ถอน/ปิดบัญชีได้เมื่อเปิดบัญชีแล้ว">
              <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <DtNum v={s.closeAfterN} editing={editing} max={90} onChange={(v) => set('closeAfterN', v)} />
                <DtSel group="timeUnit" v={s.closeAfterUnit} editing={editing} width={90} onChange={(v) => set('closeAfterUnit', v)} />
              </div>
            </DtRow>
          </DtGroup>

          <DtGroup title="การถือสมุดคู่ฝาก">
            <DtRow label="การถือสมุดคู่ฝาก"><DtSel group="passbookHold" v={s.passbookHold} editing={editing} onChange={(v) => set('passbookHold', v)} /></DtRow>
            <DtRow label="รายการที่ไม่นับครั้งการถอน"><DtTxt v={s.nonCountTxns} editing={editing} onChange={(v) => set('nonCountTxns', v)} /></DtRow>
          </DtGroup>
        </div>

        <div className="l2-col">
          <DtGroup title="กรณีสมุดหาย / ชำรุด">
            <DtCheck label="คิดค่าปรับกรณีสมุดหาย/ชำรุด" checked={s.lostBookPenaltyOn} editing={editing} onChange={(v) => set('lostBookPenaltyOn', v)} />
            {s.lostBookPenaltyOn && <>
              <DtRow label="ค่าปรับกรณีสมุดหาย" indent><DtNum v={s.lostBookFee} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('lostBookFee', v)} /></DtRow>
              <DtRow label="คู่บัญชี (บันทึกรายได้ค่าปรับ)" indent><DtGl v={s.lostBookGl} editing={editing} onChange={(v) => set('lostBookGl', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="กรณีถอนเกินจำนวนครั้งที่กำหนด">
            <DtCheck label="คิดค่าปรับเมื่อถอนเกินครั้ง" checked={s.overWdPenaltyOn} editing={editing} onChange={(v) => set('overWdPenaltyOn', v)} />
            {s.overWdPenaltyOn && <>
              <DtRow label="คิดค่าปรับจาก" indent><DtSel group="penaltyBase" v={s.overWdBase} editing={editing} onChange={(v) => set('overWdBase', v)} /></DtRow>
              {s.overWdBase !== 'flat'
                ? <DtRow label="% ค่าปรับ" indent><DtNum v={s.overWdPercent} editing={editing} decimals={2} suffix="%" onChange={(v) => set('overWdPercent', v)} /></DtRow>
                : <DtRow label="จำนวนเงินค่าปรับ" indent><DtNum v={s.overWdFee} editing={editing} decimals={2} suffix="บาท/ครั้ง" onChange={(v) => set('overWdFee', v)} /></DtRow>}
              <DtRow label="เงื่อนไขช่วงยอด (เช่น ≤ X <)" indent><DtTxt v={s.overWdRangeCond} editing={editing} placeholder="≤ X <" onChange={(v) => set('overWdRangeCond', v)} /></DtRow>
              <DtRow label="คู่บัญชี (บันทึกค่าปรับ)" indent><DtGl v={s.overWdGl} editing={editing} onChange={(v) => set('overWdGl', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="การทำรายการด้านฝาก">
            <DtCheck label="จำกัดการฝาก" checked={s.depTxnLimitOn} editing={editing} onChange={(v) => set('depTxnLimitOn', v)} />
            {s.depTxnLimitOn && <>
              <DtRow label="ต่อ 1" indent><DtTxt v={s.depTxnPer} editing={editing} center onChange={(v) => set('depTxnPer', v)} /></DtRow>
              <DtRow label="ภายใน" indent><DtSel group="timeUnit" v={s.depTxnWithin} editing={editing} onChange={(v) => set('depTxnWithin', v)} /></DtRow>
              <DtRow label="ฝากได้สูงสุด" indent><DtNum v={s.depTxnMaxAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('depTxnMaxAmount', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="การทำรายการด้านถอน">
            <DtCheck label="จำกัดการถอน" checked={s.wdTxnLimitOn} editing={editing} onChange={(v) => set('wdTxnLimitOn', v)} />
            {s.wdTxnLimitOn && <>
              <DtRow label="ต่อ 1" indent><DtTxt v={s.wdTxnPer} editing={editing} center onChange={(v) => set('wdTxnPer', v)} /></DtRow>
              <DtRow label="ภายใน" indent><DtSel group="timeUnit" v={s.wdTxnWithin} editing={editing} onChange={(v) => set('wdTxnWithin', v)} /></DtRow>
              <DtRow label="ถอนได้สูงสุด" indent><DtNum v={s.wdTxnMaxAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('wdTxnMaxAmount', v)} /></DtRow>
            </>}
          </DtGroup>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 3 — เงื่อนไขจ่าย Int./Div. / ค่ารักษาบัญชี
// ════════════════════════════════════════════════════════════════════
const DT_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const DT_MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function DatTabPayInt({ record, editing, onSettings, onTable }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const rows = record.dividendDates || [];
  const setRow = (i, k, v) => onTable('dividendDates', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('dividendDates', [...rows, { balFrom: 0, balTo: 999999999, payDay: 'eom', payMonth: 6, calcToDay: 'eom' }]);
  const delRow = (i) => onTable('dividendDates', rows.filter((_, idx) => idx !== i));
  return (
    <>
      <div className="search-card l2-card">
        <div className="l2-cols">
          <div className="l2-col">
            <DtGroup title="เงื่อนไขเงินฝาก" sub="รองรับเงินฝากแบบมีระยะเวลา และการนับอายุเงินฝาก">
              <DtCheck label="เงินฝากมีอายุระยะเวลาฝาก" checked={s.hasTerm} editing={editing} onChange={(v) => set('hasTerm', v)} />
              {s.hasTerm && <>
                <DtRow label="ดูระยะเวลาฝากจาก" indent><DtSel group="depAgeRef" v={s.depAgeRef} editing={editing} onChange={(v) => set('depAgeRef', v)} /></DtRow>
                <DtCheck label="กำหนดเวลาฝากคงที่" checked={s.fixedTerm} editing={editing} onChange={(v) => set('fixedTerm', v)} />
                <DtRow label="ระยะเวลาฝาก" indent><DtNum v={s.termMonths} editing={editing} suffix="เดือน" fill onChange={(v) => set('termMonths', v)} /></DtRow>
              </>}
            </DtGroup>

            <DtGroup title="การถอนปิดบัญชีก่อนถึงระยะเวลา">
              <DtCheck label="คิดค่าปรับเมื่อถอนก่อนกำหนด" checked={s.earlyCloseePenaltyOn} editing={editing} onChange={(v) => set('earlyCloseePenaltyOn', v)} />
              {s.earlyCloseePenaltyOn && <>
                <DtRow label="% ค่าปรับ" indent><DtNum v={s.earlyClosePercent} editing={editing} decimals={2} suffix="%" onChange={(v) => set('earlyClosePercent', v)} /></DtRow>
                <DtRow label="คู่บัญชี" indent><DtGl v={s.earlyCloseGl} editing={editing} onChange={(v) => set('earlyCloseGl', v)} /></DtRow>
              </>}
            </DtGroup>

            <DtGroup title="การให้ / การทบ Int./Div.">
              <DtCheck label="มีการให้ดอกเบี้ย/เงินปันผล" checked={s.intGiveOn} editing={editing} onChange={(v) => set('intGiveOn', v)} />
              {s.intGiveOn && <>
                <DtRow label="ดูที่" indent><DtSel group="intGiveRef" v={s.intGiveRef} editing={editing} onChange={(v) => set('intGiveRef', v)} /></DtRow>
                <DtRow label="ทบ Int./Div. เป็นต้น"><DtSel group="compoundWhen" v={s.compoundWhen} editing={editing} onChange={(v) => set('compoundWhen', v)} /></DtRow>
                <DtRow label="วิธีคิด Int./Div."><DtSel group="intCalcMethod" v={s.intCalcMethod} editing={editing} onChange={(v) => set('intCalcMethod', v)} /></DtRow>
              </>}
            </DtGroup>
          </div>

          <div className="l2-col">
            <DtGroup title="การรักษาบัญชี" sub="คิดค่าธรรมเนียมตามยอดคงเหลือและระยะเวลาไม่มีความเคลื่อนไหว">
              <DtCheck label="มีค่ารักษาบัญชี (ค่าธรรมเนียม)" checked={s.maintFeeOn} editing={editing} onChange={(v) => set('maintFeeOn', v)} />
              {s.maintFeeOn && <>
                <DtRow label="คิดครั้งละ" indent><DtNum v={s.maintFeeAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('maintFeeAmount', v)} /></DtRow>
                <DtRow label="คิดทุกวันที่" indent>
                  {(() => {
                    const dv = s.maintFeeDay === 'eom' || Number(s.maintFeeDay) > 31 ? 'eom' : String(s.maintFeeDay || 1);
                    const lbl = dv === 'eom' ? 'สิ้นเดือน' : 'วันที่ ' + dv + ' ของเดือน';
                    return editing
                      ? <select className="cfg-input" style={{ width: 180, height: 32 }} value={dv}
                                onChange={(e) => set('maintFeeDay', e.target.value === 'eom' ? 'eom' : Number(e.target.value))}>
                          {Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={String(i + 1)}>วันที่ {i + 1}</option>)}
                          <option value="eom">สิ้นเดือน</option>
                        </select>
                      : <span>{lbl}</span>;
                  })()}
                </DtRow>
                <DtRow label="คงเหลือในบัญชีต่ำกว่า" indent><DtNum v={s.maintBalanceUnder} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('maintBalanceUnder', v)} /></DtRow>
                <DtRow label="ไม่มีการเคลื่อนไหวติดต่อกัน" indent>
                  <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                    <DtNum v={s.maintInactiveDur} editing={editing} max={90} onChange={(v) => set('maintInactiveDur', v)} />
                    <DtSel group="feeUnit" v={s.maintUnit} editing={editing} width={80} onChange={(v) => set('maintUnit', v)} />
                  </div>
                </DtRow>
                <DtCheck label="คิดทุกเดือน" checked={s.maintEveryMonth} editing={editing} onChange={(v) => set('maintEveryMonth', v)} />
                <DtRow label="คู่บัญชี" indent><DtGl v={s.maintGl} editing={editing} onChange={(v) => set('maintGl', v)} /></DtRow>
              </>}
            </DtGroup>
          </div>
        </div>
      </div>

      {editing && rows.some(r => { const m = Math.min(12, Math.max(1, Number(r.payMonth) || 12)); const last = new Date(2024, m, 0).getDate();
        return [r.payDay, r.calcToDay].some(d => d !== 'eom' && Number(d) <= 31 && Number(d) > last); }) && (
        <div className="dat-warn" style={{ marginTop: 12 }}><Icon name="info" size={14} /><span>มีวันที่ที่ไม่มีในเดือนที่เลือก (ช่องสีแดง) — แนะนำให้เลือก “สิ้นเดือน” แทน</span></div>
      )}
      <DtTableShell title="วันที่จ่าย Int./Div. (ตามยอดคงเหลือ)" count={rows.length} editing={editing} onAdd={addRow} minWidth={760}
        sub="รองรับการกำหนดวันจ่ายดอกเบี้ย/เงินปันผลหลายช่วงตามยอดคงเหลือ">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 56 }}>ลำดับ</th>
            <th colSpan={2} className="center group-col">ยอดคงเหลือ</th>
            <th rowSpan={2} className="center group-col" style={{ width: 120 }}>วันที่จ่าย</th>
            <th rowSpan={2} className="center group-col" style={{ width: 120 }}>เดือนที่จ่าย</th>
            <th rowSpan={2} className="center group-col" style={{ width: 140 }}>คิดดอกเบี้ยถึงวันที่</th>
            {editing && <th rowSpan={2} className="center group-col" style={{ width: 62 }}>จัดการ</th>}
          </tr>
          <tr>
            <th className="center sub-col">ตั้งแต่ &ge;</th><th className="center sub-col">ถึง &lt;</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 7 : 6} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              <td className="num-cell"><DtNumCell editing={editing} v={r.balFrom} decimals={0} onChange={(v) => setRow(i, 'balFrom', v)} /></td>
              <td className="num-cell"><DtNumCell editing={editing} v={r.balTo} decimals={0} onChange={(v) => setRow(i, 'balTo', v)} /></td>
              {(() => {
                const m = Math.min(12, Math.max(1, Number(r.payMonth) || 12));
                const last = new Date(2024, m, 0).getDate();
                const dv = (x) => (x === 'eom' || Number(x) > 31) ? 'eom' : String(Number(x) || 1);
                const pd = dv(r.payDay), cd = dv(r.calcToDay);
                const bad = (d) => d !== 'eom' && Number(d) > last;
                const dl = (d) => d === 'eom' ? 'สิ้นเดือน' : d;
                const daySel = (v, k) => (
                  <select className={'cfg-input' + (bad(v) ? ' error' : '')} style={{ height: 32 }} value={v}
                          title={bad(v) ? DT_MONTHS[m - 1] + ' มี ' + last + ' วัน — ใช้ “สิ้นเดือน” แทน' : undefined}
                          onChange={(e) => setRow(i, k, e.target.value === 'eom' ? 'eom' : Number(e.target.value))}>
                    {Array.from({ length: 31 }, (_, x) => <option key={x + 1} value={String(x + 1)}>{x + 1}</option>)}
                    <option value="eom">สิ้นเดือน</option>
                  </select>);
                return <>
                  <td className="center">{editing ? daySel(pd, 'payDay') : <span className="mono">{dl(pd)} {DT_MONTHS_S[m - 1]}</span>}</td>
                  <td className="center">{editing
                    ? <select className="cfg-input" style={{ height: 32 }} value={String(m)} onChange={(e) => setRow(i, 'payMonth', Number(e.target.value))}>
                        {DT_MONTHS.map((n, x) => <option key={x} value={String(x + 1)}>{n}</option>)}
                      </select>
                    : DT_MONTHS[m - 1]}</td>
                  <td className="center">{editing ? daySel(cd, 'calcToDay') : <span className="mono">คิดถึง {dl(cd)} {DT_MONTHS_S[m - 1]}</span>}</td>
                </>;
              })()}
              <DtDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </DtTableShell>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 4 — การคิด Int./Div.
// ════════════════════════════════════════════════════════════════════
function DatTabCalc({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <DtGroup title="ขั้นต่ำคิด Int./Div." sub="กำหนดยอดขั้นต่ำที่นำมาคำนวณดอกเบี้ย">
            <DtRow label="ทั่วไป"><DtNum v={s.minIntGeneral} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minIntGeneral', v)} /></DtRow>
            <DtRow label="รายเดือน"><DtNum v={s.minIntMonthly} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minIntMonthly', v)} /></DtRow>
            <DtCheck label="ได้รับดอกเบี้ยรายเดือน" checked={s.monthlyIntOn} editing={editing} onChange={(v) => set('monthlyIntOn', v)} />
            <DtRow label="การรับ INT"><DtSel group="intReceiveMode" v={s.intReceiveMode} editing={editing} onChange={(v) => set('intReceiveMode', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="ถอนก่อนกำหนด">
            <DtRow label="การจ่าย Int./Div."><DtSel group="earlyPayMode" v={s.earlyPayMode} editing={editing} onChange={(v) => set('earlyPayMode', v)} /></DtRow>
            <DtRow label="วันที่ต้นเงิน"><DtSel group="principalDateMode" v={s.principalDateMode} editing={editing} onChange={(v) => set('principalDateMode', v)} /></DtRow>
            <DtCheck label="ถอน Int./Div. ได้" checked={s.earlyWithdrawIntOn} editing={editing} onChange={(v) => set('earlyWithdrawIntOn', v)} />
            <DtRow label="คิด Int./Div. จาก"><DtSel group="intCalcFrom" v={s.intCalcFrom} editing={editing} onChange={(v) => set('intCalcFrom', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="ยอดเงินคิด / ตั้ง Int./Div. ค้าง">
            <DtRow label="การคิด Int./Div. (ฐานยอด)"><DtSel group="intCalcFrom" v={s.intCalcBalanceBase} editing={editing} onChange={(v) => set('intCalcBalanceBase', v)} /></DtRow>
            <DtCheck label="ตั้งดอกเบี้ยค้าง" checked={s.accrueOn} editing={editing} onChange={(v) => set('accrueOn', v)} />
            {s.accrueOn && <DtRow label="วิธีคิด" indent><DtSel group="accrueMethod" v={s.accrueMethod} editing={editing} onChange={(v) => set('accrueMethod', v)} /></DtRow>}
          </DtGroup>
        </div>

        <div className="l2-col">
          <DtGroup title="ค่าปรับ / การคิดดอกเบี้ยถอนก่อน">
            <DtRow label="การคิดดอกเบี้ย"><DtSel group="earlyIntCalc" v={s.earlyIntCalc} editing={editing} onChange={(v) => set('earlyIntCalc', v)} /></DtRow>
            <DtRow label="อัตราค่าปรับ"><DtNum v={s.earlyPenaltyRate} editing={editing} decimals={2} suffix="%" onChange={(v) => set('earlyPenaltyRate', v)} /></DtRow>
            <DtRow label="จำนวนเงินค่าปรับ"><DtNum v={s.earlyPenaltyAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('earlyPenaltyAmount', v)} /></DtRow>
            <DtRow label="คู่บัญชี (ค่าปรับ)"><DtGl v={s.earlyPenaltyGl} editing={editing} onChange={(v) => set('earlyPenaltyGl', v)} /></DtRow>
            <DtRow label="ดอกเบี้ยในใบสั่ง"><DtTxt v={s.intInSlip} editing={editing} onChange={(v) => set('intInSlip', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="เมื่อ Int./Div. หมดต้นแล้ว">
            <DtRow label="คิด Int./Div. (ดำเนินการ)"><DtSel group="exhaustAction" v={s.exhaustAction} editing={editing} onChange={(v) => set('exhaustAction', v)} /></DtRow>
            {s.exhaustAction === 'transfer' && <>
              <DtRow label="ประเภทเงินฝากปลายทาง" indent><DtTxt v={s.transferTargetType} editing={editing} placeholder="รหัส/ชื่อประเภทบัญชี" onChange={(v) => set('transferTargetType', v)} /></DtRow>
              <DtRow label="อัตรา Int./Div. ปลายทาง" indent><DtNum v={s.transferRate} editing={editing} decimals={4} suffix="%" onChange={(v) => set('transferRate', v)} /></DtRow>
            </>}
            <DtCheck label="มีการฝากรายเดือน" checked={s.monthlyDeposit} editing={editing} onChange={(v) => set('monthlyDeposit', v)} />
            <DtRow label="การเรียกคืน ด/ป"><DtSel group="recallMode" v={s.recallMode} editing={editing} onChange={(v) => set('recallMode', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="การส่งแบบรายงวด">
            <DtCheck label="เป็นเงินฝากแบบส่งรายงวด" checked={s.periodicSend} editing={editing} onChange={(v) => set('periodicSend', v)} />
          </DtGroup>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 5 — กำหนดอัตรา Int./Div.
// ════════════════════════════════════════════════════════════════════
function DatTabRate({ record, editing, onTable }) {
  const rows = record.rateTiers || [];
  const AP = window.DEP_RATE_APPROVE, IM = window.DEP_INT_METHODS;
  const today = new Date().toISOString().slice(0, 10);
  const setRow = (i, k, v) => onTable('rateTiers', rows.map((r, idx) => idx === i ? { ...r, [k]: v, user: 'จันทร์เพ็ญ มาลี', date: today } : r));
  const addRow = () => {
    const last = rows[0] || {};
    onTable('rateTiers', [{
      effectiveDate: today, endDate: '', balFrom: last.balTo ? Number(last.balTo) + 1 : 1, balTo: 999999999,
      rate: last.rate || 1.5, method: last.method || 'daily', dayBase: 365, approve: 'draft', user: 'จันทร์เพ็ญ มาลี', date: today,
    }, ...rows]);
  };
  const delRow = (i) => onTable('rateTiers', rows.filter((_, idx) => idx !== i));

  // ช่วงวันที่ทับซ้อนกันในช่วงยอดเดียวกัน
  const overlap = useMemo(() => {
    const bad = new Set();
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      if (Number(a.balFrom) !== Number(b.balFrom) || Number(a.balTo) !== Number(b.balTo)) continue;
      const ae = a.endDate || '9999-12-31', be = b.endDate || '9999-12-31';
      if ((a.effectiveDate || '') <= be && (b.effectiveDate || '') <= ae) { bad.add(i); bad.add(j); }
    }
    return bad;
  }, [rows]);

  return (
    <>
      {editing && overlap.size > 0 && (
        <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)', marginBottom: 12 }}>
          <Icon name="info" size={14} />
          <span>พบช่วงวันที่มีผลซ้ำกันในช่วงยอดเงินเดียวกัน (แถวไฮไลต์สีแดง) — ปรับวันที่เริ่ม/สิ้นสุดก่อนบันทึก</span>
        </div>
      )}
      <DtTableShell title="อัตราดอกเบี้ย / เงินปันผล — ตามช่วงยอดเงินและวันที่มีผล" count={rows.length} editing={editing} onAdd={addRow} minWidth={1080}
        sub="ค่าคงที่อัตราดอกเบี้ยเงินฝากของประเภทบัญชีนี้ — ระบบใช้แถวที่วันที่เริ่มใช้ล่าสุดและตรงช่วงยอดเงิน · ฐานคำนวณ 365 วัน · เก็บประวัติเพื่อคำนวณย้อนหลัง">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 116 }}>วันที่เริ่มใช้</th>
            <th rowSpan={2} className="center" style={{ width: 116 }}>วันที่สิ้นสุด</th>
            <th colSpan={2} className="center group-col">ช่วงยอดเงิน (บาท)</th>
            <th rowSpan={2} className="center group-col" style={{ width: 110 }}>อัตรา/ปี (%)</th>
            <th rowSpan={2} className="center" style={{ width: 110 }}>วิธีคำนวณ</th>
            <th rowSpan={2} className="center" style={{ width: 70 }}>ฐานวัน</th>
            <th rowSpan={2} className="center group-col" style={{ width: 110 }}>สถานะ</th>
            <th rowSpan={2} className="group-col" style={{ width: 150 }}>ผู้บันทึก</th>
            {editing && <th rowSpan={2} className="center" style={{ width: 46 }} />}
          </tr>
          <tr><th className="center sub-col">ตั้งแต่</th><th className="center sub-col">ถึง</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 10 : 9} className="center muted" style={{ padding: '24px' }}>ยังไม่มีอัตรา — กด “เพิ่มแถว”</td></tr>}
          {rows.map((t, i) => {
            const ap = AP[t.approve] || AP.draft;
            return (
              <tr key={i} style={overlap.has(i) ? { background: 'var(--danger-50)' } : null}>
                <td className="num-cell"><DtDateCell editing={editing} v={t.effectiveDate} onChange={(v) => setRow(i, 'effectiveDate', v)} /></td>
                <td className="num-cell">{editing
                  ? <DtDateCell editing v={t.endDate} onChange={(v) => setRow(i, 'endDate', v)} />
                  : (t.endDate ? <span className="mono">{fmt.date(t.endDate)}</span> : <span className="muted">ปัจจุบัน</span>)}</td>
                <td className="num-cell"><DtNumCell editing={editing} v={t.balFrom} decimals={0} onChange={(v) => setRow(i, 'balFrom', v)} /></td>
                <td className="num-cell">{editing
                  ? <DtNumCell editing v={t.balTo} decimals={0} onChange={(v) => setRow(i, 'balTo', v)} />
                  : <span className="sh-grid-num">{Number(t.balTo) >= 999999999 ? 'ขึ้นไป' : fmt.money(Number(t.balTo || 0), 0)}</span>}</td>
                <td className="num-cell">{editing
                  ? <input className="sh-grid-input" type="number" step="0.0001" value={t.rate} onChange={(e) => setRow(i, 'rate', e.target.value)} />
                  : <span className="sh-grid-num"><b>{fmt.money(Number(t.rate || 0), 4)}</b></span>}</td>
                <td className="center">{editing
                  ? <select className="cfg-input sm" style={{ minWidth: 96 }} value={t.method || 'daily'} onChange={(e) => setRow(i, 'method', e.target.value)}>{Object.entries(IM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  : <span className={"pill " + (IM[t.method || 'daily']?.pill || 'neutral')}>{IM[t.method || 'daily']?.label}</span>}</td>
                <td className="center mono">{t.dayBase || 365}</td>
                <td className="center">{editing
                  ? <select className="cfg-input sm" style={{ minWidth: 96 }} value={t.approve || 'draft'} onChange={(e) => setRow(i, 'approve', e.target.value)}>{Object.entries(AP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  : <span className={"pill " + ap.pill}>{ap.label}</span>}</td>
                <td style={{ borderLeft: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: 12.5 }}>{t.user || '—'}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{t.date ? fmt.date(t.date) : ''}</div>
                </td>
                <DtDelCell editing={editing} onDel={() => delRow(i)} />
              </tr>
            );
          })}
        </tbody>
      </DtTableShell>
      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ค่าคงที่อัตราดอกเบี้ยเงินฝากถูกยุบรวมมาตั้งค่าที่แท็บนี้ — ตั้งค่าที่เดียวพร้อมข้อกำหนดอื่นของประเภทบัญชี · ประวัติอัตราเดิมจะไม่ถูกลบ
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ 6 — ถอนก่อนกำหนด
// ════════════════════════════════════════════════════════════════════
function DatTabEarly({ record, editing, onTable }) {
  const rows = record.earlyWithdraw || [];
  const setRow = (i, k, v) => onTable('earlyWithdraw', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('earlyWithdraw', [...rows, { ageLessThan: 0, unit: 'month', intCond: 'none', rateMode: 'bytype', rateType: '-', rateTable: '-', penalty: false, tax: true }]);
  const delRow = (i) => onTable('earlyWithdraw', rows.filter((_, idx) => idx !== i));
  return (
    <>
      <DtTableShell title="เงื่อนไขถอนก่อนกำหนด (หลายช่วงระยะเวลาฝาก)" count={rows.length} editing={editing} onAdd={addRow} minWidth={1000}
        sub="ตรวจอายุเงินฝากจริง ณ วันถอน แล้วเลือกเงื่อนไขที่ตรงกับช่วงระยะเวลาฝาก — กำหนดว่าได้ดอกเบี้ยหรือไม่ คิดค่าปรับ/ภาษีหรือไม่">
        <thead>
          <tr>
            <th className="center" style={{ width: 56 }}>ลำดับ</th>
            <th colSpan={2} className="center group-col">ระยะฝากน้อยกว่า</th>
            <th className="center" style={{ width: 130 }}>Int./Div.</th>
            <th className="center" style={{ width: 140 }}>อัตรา Int./Div.</th>
            <th className="center" style={{ width: 150 }}>ประเภทอ้างอิง</th>
            <th className="center" style={{ width: 130 }}>ตาราง Int./Div.</th>
            <th className="center" style={{ width: 70 }}>ค่าปรับ</th>
            <th className="center" style={{ width: 70 }}>คิดภาษี</th>
            {editing && <th className="center" style={{ width: 46 }} />}
          </tr>
          <tr>
            <th className="sub-col" />
            <th className="center sub-col">จำนวน</th><th className="center sub-col">หน่วย</th>
            <th className="sub-col" /><th className="sub-col" /><th className="sub-col" /><th className="sub-col" /><th className="sub-col" /><th className="sub-col" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 10 : 9} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              <td className="num-cell"><DtNumCell editing={editing} v={r.ageLessThan} onChange={(v) => setRow(i, 'ageLessThan', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="timeUnit" v={r.unit} onChange={(v) => setRow(i, 'unit', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyIntCond" v={r.intCond} onChange={(v) => setRow(i, 'intCond', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyRateMode" v={r.rateMode} onChange={(v) => setRow(i, 'rateMode', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyRateType" v={r.rateType} onChange={(v) => setRow(i, 'rateType', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="rateTable" v={r.rateTable} onChange={(v) => setRow(i, 'rateTable', v)} /></td>
              <td className="center" style={{ borderLeft: '1px solid var(--divider)' }}><DtCheckCell editing={editing} v={r.penalty} onChange={(v) => setRow(i, 'penalty', v)} /></td>
              <td className="center"><DtCheckCell editing={editing} v={r.tax} onChange={(v) => setRow(i, 'tax', v)} /></td>
              <DtDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </DtTableShell>
      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> กรณีฝากไม่ถึงขั้นต่ำอาจไม่ได้รับดอกเบี้ย — ฝากเกินช่วงขั้นต่ำแต่ยังไม่ครบกำหนด อาจได้รับดอกเบี้ยตามอัตราอ้างอิง เช่น อัตราเงินฝากออมทรัพย์
      </div>
    </>
  );
}

Object.assign(window, {
  DatTabMaster, DatTabConditions, DatTabPayInt, DatTabCalc, DatTabRate, DatTabEarly,
});
