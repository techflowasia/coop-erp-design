// ════════════════════════════════════════════════════════════════════
//  งานสมาชิกถึงแก่กรรม / ขอสินไหม / ฌาปนกิจ — DeceasedMemberPage (TOR 8.3 ขยาย)
//  ระบบงานสวัสดิการสมาชิก › การทำงาน
//  list = ทะเบียนเคส · form = แจ้งถึงแก่กรรม · detail = สิทธิ/ทายาท/หักหนี้/ใบสำคัญจ่าย
// ════════════════════════════════════════════════════════════════════

const DCS_USER = 'จันทร์เพ็ญ มาลี';

function dcsLoad() {
  try { const s = localStorage.getItem('deceased_cases'); if (s) return JSON.parse(s); } catch (e) {}
  return window.DCS_SEED.map(r => ({ ...r, heirs: (r.heirs || []).map(h => ({ ...h })) }));
}
function dcsSaveLS(list) { try { localStorage.setItem('deceased_cases', JSON.stringify(list)); } catch (e) {} }

function DcsField({ label, required, hint, children, full }) {
  return (
    <div className="sr-field" style={full ? { gridColumn: '1 / -1' } : null}>
      <label className="sr-label">{label}{required && <span className="cfg-required"> *</span>}{hint && <span className="sr-hint"> {hint}</span>}</label>
      {children}
    </div>
  );
}
function DcsRow({ label, value, mono }) {
  return <div className="field"><span className="label">{label}</span><span className={"value" + (mono ? ' mono' : '')}>{value ?? '—'}</span></div>;
}

// ── เส้นทางสถานะ (stepper) ────────────────────────────────────────────
function DcsStepper({ status }) {
  const order = ['notified', 'waiting', 'review', 'approved', 'paid'];
  const cur = window.dcsStatus(status).step;
  return (
    <div className="dcs-steps">
      {order.map((k, i) => {
        const s = window.DCS_STATUS[k];
        const done = s.step < cur, active = s.step === cur;
        return (
          <div key={k} className={"dcs-step" + (done ? ' done' : '') + (active ? ' active' : '')}>
            <span className="dcs-step-dot">{done ? <Icon name="check" size={11} /> : s.step}</span>
            <span className="dcs-step-label">{s.l}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มแจ้งสมาชิกถึงแก่กรรม
// ════════════════════════════════════════════════════════════════════
function DcsForm({ list, onSubmit, onCancel, onToast }) {
  const [member, setMember] = useState(null);
  const [f, setF] = useState({
    kind: 'member', deceasedName: '', citizenId: '', deathDate: '', cause: 'ชราภาพ', age: '',
    notifyDate: new Date().toISOString().slice(0, 10), houseNo: '', funeral: 600000, welfare: 50000, insurance: 0,
  });
  const [err, setErr] = useState('');
  const set = (k, v) => { setF(s => ({ ...s, [k]: v })); setErr(''); };

  const pick = (m) => {
    const full = window.MEMBERS_LIST.find(x => x.code === m.code) || m;
    setMember(full); setErr('');
    set('houseNo', full.address || '');
  };

  // เส้นตาย 120 วันนับจากวันเสียชีวิต
  const deadline = f.deathDate ? new Date(new Date(f.deathDate).getTime() + 120 * 86400000).toISOString().slice(0, 10) : '';

  const submit = () => {
    if (f.kind === 'member' && !member) return setErr('กรุณาเลือกสมาชิกผู้ถึงแก่กรรม');
    if (f.kind !== 'member' && !member) return setErr('กรุณาเลือกสมาชิกเจ้าของสิทธิ');
    if (f.kind !== 'member' && !f.deceasedName.trim()) return setErr('กรุณาระบุชื่อผู้เสียชีวิต');
    if (!f.deathDate) return setErr('กรุณาระบุวันที่เสียชีวิต');
    const rec = {
      id: window.dcsNextNo(list, 2569), kind: f.kind,
      memberCode: member.code, memberName: member.name, dept: member.dept || member.department || '—', deptCode: member.deptCode || '',
      citizenId: f.citizenId.trim() || member.citizenId || '—',
      deceasedName: f.kind === 'member' ? '' : f.deceasedName.trim(),
      deathDate: f.deathDate, cause: f.cause, age: Number(f.age) || 0,
      notifyDate: f.notifyDate, docDeadline: deadline, status: 'notified',
      shares: f.kind === 'member' ? (member.shares || 0) : 0, debts: f.kind === 'member' ? (member.loans || 0) : 0,
      funeral: Number(f.funeral) || 0, welfare: Number(f.welfare) || 0, insurance: Number(f.insurance) || 0,
      houseNo: f.houseNo.trim(), heirs: [],
    };
    onSubmit(rec);
  };

  return (
    <div data-screen-label="หน้าแจ้งสมาชิกถึงแก่กรรม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>แจ้งสมาชิกถึงแก่กรรม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึกการแจ้งถึงแก่กรรม อัปเดตสถานะสมาชิก และเปิดเคสขอรับสวัสดิการ/สินไหม</div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={onCancel}><Icon name="chevLeft" /> กลับทะเบียนเคส</button>
        <button className="btn primary sm" onClick={submit}><Icon name="check" /> บันทึกการแจ้ง</button>
      </div>

      {err && <div className="sr-error"><Icon name="info" size={14} /> {err}</div>}

      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลการแจ้งถึงแก่กรรม</h3></div>
        <div className="sem-form-grid">
          <DcsField label="ประเภท" required>
            <select className="cfg-input" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
              {window.DCS_KIND.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
            </select>
          </DcsField>
          <DcsField label="วันที่แจ้ง">
            <ErpDate value={f.notifyDate} onChange={(v) => ((e) => set('notifyDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DcsField>
          <DcsField label={f.kind === 'member' ? 'สมาชิกผู้ถึงแก่กรรม' : 'สมาชิกเจ้าของสิทธิ'} required hint="(คลิกเพื่อค้นหา)" full>
            <MemberSearchField member={member} onPick={pick} source={window.MEMBERS_LIST} title="ค้นหาสมาชิก" />
          </DcsField>
          {f.kind !== 'member' && (
            <DcsField label="ชื่อผู้เสียชีวิต" required full>
              <input className="cfg-input" value={f.deceasedName} onChange={(e) => set('deceasedName', e.target.value)} placeholder="ชื่อ-สกุลผู้เสียชีวิต + ความสัมพันธ์" />
            </DcsField>
          )}
          <DcsField label="วันที่เสียชีวิต" required>
            <ErpDate value={f.deathDate} onChange={(v) => ((e) => set('deathDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
          </DcsField>
          <DcsField label="อายุ (ปี)">
            <input className="cfg-input mono" type="number" min="0" value={f.age} onChange={(e) => set('age', e.target.value)} />
          </DcsField>
          <DcsField label="สาเหตุการเสียชีวิต">
            <select className="cfg-input" value={f.cause} onChange={(e) => set('cause', e.target.value)}>
              {window.DCS_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </DcsField>
          <DcsField label="เลขบัตรประชาชน">
            <input className="cfg-input mono" value={f.citizenId} onChange={(e) => set('citizenId', e.target.value)} placeholder="x-xxxx-xxxxx-xx-x" />
          </DcsField>
          <DcsField label="บ้านเลขที่ (ใช้ตรวจซ้ำกรณีภัยพิบัติ)" full>
            <input className="cfg-input" value={f.houseNo} onChange={(e) => set('houseNo', e.target.value)} placeholder="ที่อยู่ตามทะเบียนบ้าน" />
          </DcsField>
        </div>
        {f.deathDate && (
          <div className="dcs-deadline">
            <Icon name="calendar" size={14} />
            <span>กำหนดยื่นเอกสารภายใน <b>120 วัน</b> — ครบกำหนด <b>{fmt.date(deadline)}</b></span>
          </div>
        )}
      </div>

      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สิทธิสวัสดิการและสินไหมที่ขอรับ</h3></div>
        <div className="sem-form-grid">
          <DcsField label="ฌาปนกิจสงเคราะห์ (ฌปท.)"><input className="cfg-input mono" type="number" min="0" value={f.funeral} onChange={(e) => set('funeral', e.target.value)} /></DcsField>
          <DcsField label="เงินสงเคราะห์เสียชีวิต"><input className="cfg-input mono" type="number" min="0" value={f.welfare} onChange={(e) => set('welfare', e.target.value)} /></DcsField>
          <DcsField label="สินไหมประกันสัญญาเงินกู้"><input className="cfg-input mono" type="number" min="0" value={f.insurance} onChange={(e) => set('insurance', e.target.value)} /></DcsField>
        </div>
        {member && f.kind === 'member' && (
          <p className="muted" style={{ fontSize: 11.5, marginTop: 10 }}>
            <Icon name="info" size={11} /> ระบบจะดึงทุนเรือนหุ้นคงเหลือและยอดหนี้คงค้างของสมาชิกมาคำนวณยอดสุทธิในขั้นตอนตรวจสอบสิทธิ
          </p>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  รายละเอียดเคส + ทายาท + หักหนี้ + ใบสำคัญจ่าย
// ════════════════════════════════════════════════════════════════════
function DcsDetail({ rec, onBack, onUpdate, onToast }) {
  if (!rec) return null;
  const st = window.dcsStatus(rec.status);
  const gross = window.dcsGross(rec);
  const net = window.dcsNet(rec);
  const advance = (rec.status === 'notified') ? 'waiting' : (rec.status === 'waiting') ? 'review' : (rec.status === 'review') ? 'approved' : (rec.status === 'approved') ? 'paid' : null;
  const advanceLabel = { waiting: 'เริ่มนับ 120 วัน', review: 'เริ่มตรวจสอบสิทธิ', approved: 'อนุมัติจ่าย', paid: 'บันทึกจ่ายเงิน' };

  const doAdvance = () => {
    if (!advance) return;
    const next = { ...rec, status: advance };
    if (advance === 'paid') next.payDate = new Date().toISOString().slice(0, 10);
    onUpdate(next, advanceLabel[advance]);
  };

  return (
    <div data-screen-label="หน้ารายละเอียดเคสสมาชิกถึงแก่กรรม">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับทะเบียนเคส</button>
        <span className="spacer" />
        <button className="btn sm"><Icon name="print" /> พิมพ์ใบสำคัญจ่าย</button>
        {advance && <button className="btn primary sm" onClick={doAdvance}><Icon name="check" /> {advanceLabel[advance]}</button>}
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="shield" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">{rec.kind === 'member' ? rec.memberName : (rec.deceasedName || rec.memberName)}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.id}</span><span className="dot" />
              <span>{window.dcsKindLabel(rec.kind)}</span><span className="dot" />
              <span>เสียชีวิต {fmt.date(rec.deathDate)}</span><span className="dot" />
              <span>{rec.cause}{rec.age ? ` · อายุ ${rec.age} ปี` : ''}</span>
            </div>
          </div>
          <span className={"pill " + st.pill} style={{ height: 24 }}>{st.l}</span>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">สมาชิกเจ้าของสิทธิ</span><span className="lt-date-v">{rec.memberName} <span className="muted mono" style={{ fontWeight: 400 }}>({rec.memberCode})</span></span></div>
          <div className="lt-date"><span className="lt-date-k">ครบกำหนดยื่นเอกสาร</span><span className="lt-date-v">{fmt.date(rec.docDeadline)}</span></div>
          <div className="lt-date"><span className="lt-date-k">ยอดสวัสดิการสุทธิ</span><span className="lt-date-v" style={{ color: 'var(--primary)', fontWeight: 700 }}>฿ {fmt.money(net, 0)}</span></div>
          <div className="lt-date"><span className="lt-date-k">วันที่จ่าย</span><span className="lt-date-v">{rec.payDate ? fmt.date(rec.payDate) : '—'}</span></div>
        </div>
      </div>

      <div className="search-card" style={{ marginTop: 12, marginBottom: 12 }}>
        <DcsStepper status={rec.status} />
      </div>

      {/* ยอดสวัสดิการ + หักหนี้ */}
      <div className="sr-two-col" style={{ marginBottom: 12 }}>
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>สิทธิ ตัดชำระหนี้ และยอดจ่ายสุทธิ</h3></div>
          <div className="sem-cost-list">
            <div className="sem-cost-row"><span>ฌาปนกิจสงเคราะห์ (ฌปท.)</span><b className="mono">{fmt.money(rec.funeral, 0)}</b></div>
            <div className="sem-cost-row"><span>เงินสงเคราะห์เสียชีวิต</span><b className="mono">{fmt.money(rec.welfare, 0)}</b></div>
            <div className="sem-cost-row"><span>สินไหมประกันสัญญาเงินกู้</span><b className="mono">{fmt.money(rec.insurance, 0)}</b></div>
            <div className="sem-cost-row"><span>ทุนเรือนหุ้นคงเหลือ</span><b className="mono">{fmt.money(rec.shares, 0)}</b></div>
            <div className="sem-cost-row total"><span>รวมสิทธิทั้งหมด</span><b className="mono">฿ {fmt.money(gross, 0)}</b></div>
            <div className="sem-cost-row" style={{ color: 'var(--danger)' }}><span>หัก หนี้คงค้างตามสัดส่วน</span><b className="mono">− {fmt.money(rec.debts, 0)}</b></div>
            <div className="sem-cost-row total"><span>ยอดจ่ายสุทธิแก่ทายาท</span><b className="mono" style={{ color: 'var(--primary)' }}>฿ {fmt.money(net, 0)}</b></div>
          </div>
        </div>

        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลผู้เสียชีวิต</h3></div>
          <div className="form-grid">
            <DcsRow label="ประเภท" value={window.dcsKindLabel(rec.kind)} />
            <DcsRow label="ชื่อผู้เสียชีวิต" value={rec.kind === 'member' ? rec.memberName : rec.deceasedName} />
            <DcsRow label="เลขบัตรประชาชน" value={rec.citizenId} mono />
            <DcsRow label="สังกัด" value={window.affilLabel(rec.deptCode, rec.dept)} />
            <DcsRow label="วันที่เสียชีวิต" value={fmt.date(rec.deathDate)} />
            <DcsRow label="สาเหตุ / อายุ" value={`${rec.cause}${rec.age ? ' · ' + rec.age + ' ปี' : ''}`} />
            <DcsRow label="วันที่แจ้ง" value={fmt.date(rec.notifyDate)} />
            <DcsRow label="บ้านเลขที่" value={rec.houseNo} />
          </div>
        </div>
      </div>

      {/* ทายาทผู้รับเงิน */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sh-grid-head">
          <div><div className="sh-grid-title">การแจกแจงสัดส่วนทายาทผู้รับเงิน</div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>ยอดจ่ายสุทธิ ฿{fmt.money(net, 0)} แบ่งตามสัดส่วนทายาท</div></div>
        </div>
        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl">
            <thead><tr><th style={{ width: 40 }} className="center">#</th><th>ชื่อทายาท</th><th>ความสัมพันธ์</th><th className="center">สัดส่วน</th><th className="num">จำนวนเงินที่ได้รับ</th></tr></thead>
            <tbody>
              {(!rec.heirs || rec.heirs.length === 0) ? (
                <tr><td colSpan="5" className="empty-state" style={{ padding: '24px 12px' }}>ยังไม่ได้บันทึกทายาท — เพิ่มได้ในขั้นตอนตรวจสอบสิทธิ</td></tr>
              ) : rec.heirs.map((h, i) => (
                <tr key={i}>
                  <td className="center mono muted">{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{h.name}</td>
                  <td>{h.relation}</td>
                  <td className="center mono">{h.pct}%</td>
                  <td className="num mono"><b>{fmt.money(net * h.pct / 100, 0)}</b></td>
                </tr>
              ))}
            </tbody>
            {rec.heirs && rec.heirs.length > 0 && (
              <tfoot><tr className="sh-grid-total"><td colSpan={3} className="right"><b>รวม</b></td>
                <td className="center mono"><b>{rec.heirs.reduce((s, h) => s + h.pct, 0)}%</b></td>
                <td className="num mono"><b>{fmt.money(net, 0)}</b></td></tr></tfoot>
            )}
          </table>
        </div>
        <div className="sh-grid-foot muted">
          <Icon name="info" size={12} /> เมื่ออนุมัติจ่าย ระบบจะลิงก์ไปฝ่ายการเงินเพื่อตัดจ่ายตามสัดส่วน และบันทึกสาเหตุการตาย/ช่วงอายุลงรายงานสถิติ
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ทะเบียนเคส (list)
// ════════════════════════════════════════════════════════════════════
function DcsList({ list, onCreate, onOpen }) {
  const [q, setQ] = useState('');
  const [kindF, setKindF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const rows = useMemo(() => {
    let r = list;
    if (q.trim()) { const n = q.toLowerCase(); r = r.filter(x => x.memberName.toLowerCase().includes(n) || x.memberCode.toLowerCase().includes(n) || x.id.toLowerCase().includes(n) || (x.deceasedName || '').toLowerCase().includes(n)); }
    if (kindF !== 'all') r = r.filter(x => x.kind === kindF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return [...r].sort((a, b) => (b.deathDate || '').localeCompare(a.deathDate || ''));
  }, [list, q, kindF, statusF]);
  const waiting = list.filter(r => r.status === 'waiting' || r.status === 'notified').length;
  const totalNet = list.filter(r => r.status !== 'paid').reduce((s, r) => s + window.dcsNet(r), 0);

  return (
    <div data-screen-label="หน้าทะเบียนเคสสมาชิกถึงแก่กรรม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>งานสมาชิกถึงแก่กรรม / ฌาปนกิจ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>แจ้งถึงแก่กรรม ตรวจสอบสิทธิ แจกแจงทายาท ตัดชำระหนี้ และออกใบสำคัญจ่าย</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> แจ้งถึงแก่กรรม</button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 260px', maxWidth: 360 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา: ชื่อ, เลขสมาชิก, เลขเคส…" style={{ height: 32, fontSize: 13 }} />
          </div>
          <select className="filter-select" value={kindF} onChange={(e) => setKindF(e.target.value)}>
            <option value="all">ทุกประเภท</option>{window.DCS_KIND.map(k => <option key={k.v} value={k.v}>{k.l}</option>)}
          </select>
          <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)}>
            <option value="all">ทุกสถานะ</option>{Object.entries(window.DCS_STATUS).map(([k, s]) => <option key={k} value={k}>{s.l}</option>)}
          </select>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> เคส</span>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr><th>เลขเคส</th><th>ผู้เสียชีวิต / สมาชิก</th><th>ประเภท</th><th className="center">วันเสียชีวิต</th><th className="center">ครบกำหนด 120 วัน</th><th className="num">ยอดสุทธิ</th><th className="center">สถานะ</th></tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบเคสที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const st = window.dcsStatus(r.status);
                const overdue = r.status !== 'paid' && r.docDeadline && r.docDeadline < new Date().toISOString().slice(0, 10);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono" style={{ fontSize: 11 }}>{r.id}</td>
                    <td><div style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{r.kind === 'member' ? r.memberName : r.deceasedName}</div>
                      <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode} · {r.memberName}</div></td>
                    <td>{window.dcsKindLabel(r.kind)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.deathDate)}</td>
                    <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.docDeadline)} {overdue && <span className="chip danger" style={{ marginLeft: 4 }}>เลยกำหนด</span>}</td>
                    <td className="num mono"><b>{fmt.money(window.dcsNet(r), 0)}</b></td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}><Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดเคส ตรวจสอบสิทธิ แจกแจงทายาท และดำเนินการจ่าย</p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main
// ════════════════════════════════════════════════════════════════════
function DeceasedMemberPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(dcsLoad);
  const [mode, setMode] = useState('list');
  const [current, setCurrent] = useState(null);
  const persist = (next) => { setList(next); dcsSaveLS(next); };

  const submit = (rec) => {
    persist([rec, ...list]);
    audit.log({ action: 'create', module: 'สวัสดิการ — สมาชิกถึงแก่กรรม', target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `แจ้งถึงแก่กรรม ${rec.id} · ${window.dcsKindLabel(rec.kind)} · ครบกำหนดยื่นเอกสาร ${fmt.date(rec.docDeadline)}`,
      changes: [{ field: 'เลขเคส', before: '—', after: rec.id }, { field: 'วันเสียชีวิต', before: '—', after: fmt.date(rec.deathDate) }] });
    onToast && onToast(`บันทึกการแจ้งถึงแก่กรรม ${rec.id} เรียบร้อยแล้ว`);
    setCurrent(rec); setMode('detail');
  };
  const update = (rec, actionLabel) => {
    persist(list.map(r => r.id === rec.id ? rec : r)); setCurrent(rec);
    if (actionLabel) {
      audit.log({ action: 'status', module: 'สวัสดิการ — สมาชิกถึงแก่กรรม', target: `${rec.id} · ${rec.memberName}`,
        summary: `${actionLabel} — เคส ${rec.id}`, changes: [{ field: 'สถานะ', before: '—', after: window.dcsStatus(rec.status).l }] });
      onToast && onToast(`${actionLabel} เรียบร้อยแล้ว`);
    }
  };

  return (
    <>
      {mode === 'list' && <DcsList list={list} onCreate={() => setMode('form')} onOpen={(r) => { setCurrent(r); setMode('detail'); }} />}
      {mode === 'form' && <DcsForm list={list} onSubmit={submit} onCancel={() => setMode('list')} onToast={onToast} />}
      {mode === 'detail' && <DcsDetail rec={current} onBack={() => setMode('list')} onUpdate={update} onToast={onToast} />}
    </>
  );
}

Object.assign(window, { DeceasedMemberPage });
