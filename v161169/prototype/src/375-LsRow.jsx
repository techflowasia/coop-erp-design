// ════════════════════════════════════════════════════════════════════
//  เปลี่ยนแปลงสถานะทางกฎหมาย — หน้าจอบันทึก (single work screen)
//  ระบบงานทะเบียนและติดตามหนี้ › ติดตามและดำเนินคดี
//  โครงสร้าง: ① ข้อมูลคำขอ  ② ก่อน/หลังเปลี่ยนแปลง  ③ ผู้ค้ำ/ผู้เกี่ยวข้อง
// ════════════════════════════════════════════════════════════════════

// ─── แถวฟิลด์: label ซ้าย + control ขวา ──────────────────────────────
function LsRow({ label, required, span, children }) {
  const st = span ? { gridColumn: '1 / -1' } : null;
  return (
    <div className="ls-row" style={st}>
      <label className="ls-row-l">{label}{required && <span className="cfg-required"> *</span>}</label>
      <div className="ls-row-c">{children}</div>
    </div>
  );
}

// ─── ช่องค้นหา (input + ปุ่มแว่นขยาย) ────────────────────────────────
function LsSearchField({ value, placeholder, onOpen, mono = true }) {
  return (
    <div className="ls-lookup" onClick={onOpen}>
      <input className={'cfg-input sr-clickable' + (mono ? ' mono' : '')} value={value || ''}
             readOnly placeholder={placeholder} />
      <button type="button" className="ls-lookup-btn" onClick={onOpen} aria-label="ค้นหา">
        <Icon name="search" size={14} />
      </button>
    </div>
  );
}

// ─── แถว key–value ในการ์ดก่อน/หลัง (อ่านอย่างเดียว) ────────────────
function LsKv({ label, children, suffix }) {
  return (
    <div className="ls-kv">
      <span className="ls-kv-l">{label}</span>
      <span className="ls-kv-v">{children}</span>
      {suffix && <span className="ls-kv-u">{suffix}</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
function LegalStatusChangePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const today = window.lsToday();
  const beYear = new Date(today).getFullYear() + 543;

  const [member, setMember]         = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [modal, setModal]           = useState(false);   // 'contract' | 'add-related' | false
  const [effDate, setEffDate]       = useState(today);   // วันที่ตั้งลูกหนี้ / มีผล
  const [newCode, setNewCode]       = useState('');      // รหัสสถานะใหม่
  const [approver, setApprover]     = useState('');
  const [note, setNote]             = useState('');
  const [savedNo, setSavedNo]       = useState('');      // เลขที่คำขอหลังบันทึก
  const [relatedExtra, setExtra]    = useState([]);      // แถวผู้เกี่ยวข้องที่เพิ่มเอง
  const [error, setError]           = useState('');
  const [warn, setWarn]             = useState('');

  const contracts = member ? (member.debts || []) : [];
  const debt      = contracts.find(d => d.contractNo === contractNo) || null;
  const before    = debt ? window.lsCurrentLegal(debt) : null;
  const loaded    = !!debt;
  const newStatus = newCode ? window.lsStatusByCode(newCode) : null;
  const closed    = debt && (debt.status === 'ปิดสัญญา' || debt.status === 'ชำระเสร็จสิ้น');

  const relatedRows = React.useMemo(
    () => (debt ? [...window.lsRelatedRows(debt), ...relatedExtra] : []),
    [debt, relatedExtra]
  );

  // ── ยอดหลังเปลี่ยนแปลง (ไม่กระทบยอดหนี้ → คงค่าเดิม) ──
  const remaining   = debt ? (Number(debt.principalRemaining) || 0) : 0;
  const interestDue = debt ? (Number(debt.interestDue) || 0) : 0;

  const loadContract = (m, d) => {
    setMember(m); setContractNo(d.contractNo);
    setNewCode(''); setApprover(''); setNote(''); setSavedNo(''); setExtra([]);
    setEffDate(today); setError('');
    setWarn(Number(d.interestDue) > 0
      ? `สัญญานี้มีดอกเบี้ยค้างชำระ ${window.fmt.money(d.interestDue, 2)} บาท — ระบบจะล็อกยอด ณ วันที่มีผลเมื่อเปลี่ยนเป็นกลุ่มดำเนินคดี`
      : '');
  };
  const pickFromModal = ({ member: m, debt: d }) => { setModal(false); loadContract(m, d); };
  const pickContract = (no) => { const d = contracts.find(x => x.contractNo === no); if (d) loadContract(member, d); };
  const addRelated = ({ member: m, debt: d }) => {
    setModal(false);
    setExtra(prev => [...prev, {
      no: 0, memberCode: m.code, name: m.name, contractNo: (d && d.contractNo) || contractNo,
      transferRemaining: 0, legalCode: '1', legalLabel: 'ปกติ', legalPill: 'ok', manual: true,
    }]);
  };
  const removeRelated = (idx) => setExtra(prev => prev.filter((_, i) => i !== idx));

  const clearScreen = () => {
    setMember(null); setContractNo(''); setNewCode(''); setApprover(''); setNote('');
    setSavedNo(''); setExtra([]); setEffDate(today); setError(''); setWarn('');
  };

  const validate = () => {
    if (!member)   return 'กรุณาเลือกสมาชิก (เลขที่สมาชิก) ก่อนบันทึก';
    if (!debt)     return 'กรุณาเลือกสัญญาเงินกู้ที่ต้องการเปลี่ยนสถานะทางกฎหมาย';
    if (!effDate)  return 'กรุณาระบุวันที่ตั้งลูกหนี้';
    if (!newCode)  return 'กรุณาเลือกสถานะทางกฎหมายใหม่';
    if (closed)    return 'สัญญาปิดแล้ว ไม่สามารถเปลี่ยนสถานะทางกฎหมายได้ (ยกเว้นผู้มีสิทธิ์พิเศษ)';
    if (remaining < 0)   return 'ยอดเงินกู้คงเหลือต้องไม่ติดลบ';
    if (interestDue < 0) return 'ดอกเบี้ยค้างชำระต้องไม่ติดลบ';
    return '';
  };

  const doSave = () => {
    const err = validate();
    if (err) { setError(err); return; }
    // เตือนกรณีสถานะใหม่ = เดิม
    if (before && newCode === before.code && !window.confirm(
      'สถานะทางกฎหมายใหม่เหมือนกับสถานะเดิม — ต้องการบันทึกรายการหรือไม่?')) return;
    setError('');
    const no = savedNo || window.lsNextReqNo(beYear);
    setSavedNo(no);
    const rec = {
      reqNo: no, effDate, contractNo,
      memberCode: member.code, memberName: member.name,
      beforeCode: before.code, beforeLabel: before.label,
      afterCode: newStatus.code, afterLabel: newStatus.label,
      remainingBefore: remaining, interestBefore: interestDue,
      remainingAfter: remaining, interestAfter: interestDue,
      approver: approver || '—', note,
      by: window.LS_USER, at: new Date().toISOString().slice(0, 19),
      approveStatus: 'รออนุมัติ',
    };
    window.lsPushHistory(rec);
    audit && audit.log && audit.log({
      action: 'update', module: 'ทะเบียนและติดตามหนี้ — เปลี่ยนแปลงสถานะทางกฎหมาย',
      target: `${member.code} · ${member.name} · ${contractNo}`,
      summary: `${no} · เปลี่ยนสถานะทางกฎหมาย ${before.label} → ${newStatus.label} (มีผล ${window.fmt.date(effDate)})`,
      changes: [
        { field: 'สถานะทางกฎหมาย', before: before.label, after: newStatus.label },
        { field: 'วันที่มีผล', before: '—', after: window.fmt.date(effDate) },
      ],
    });
    onToast && onToast(`บันทึกคำขอ ${no} · เปลี่ยนสถานะเป็น “${newStatus.label}” — รออนุมัติ`);
  };

  const doPrint = () => {
    if (!loaded) { setError('กรุณาเลือกสัญญาก่อนพิมพ์'); return; }
    onToast && onToast('กำลังเตรียมพิมพ์เอกสารเปลี่ยนแปลงสถานะทางกฎหมาย…');
    setTimeout(() => window.print(), 80);
  };

  return (
    <div data-screen-label="เปลี่ยนแปลงสถานะทางกฎหมาย">
      {/* ── หัวเรื่อง + ปุ่มคำสั่ง ── */}
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>เปลี่ยนแปลงสถานะทางกฎหมาย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            เมนูสำหรับเปลี่ยนแปลงสถานะทางกฎหมายของสัญญาเงินกู้สมาชิก · เปรียบเทียบก่อน/หลังก่อนบันทึก
          </div>
        </div>
        <span className="spacer" />
        <div className="ls-head-actions">
          <button className="btn primary" onClick={doSave}><Icon name="check" size={14} /> บันทึก</button>
          <button className="btn" onClick={clearScreen}><Icon name="refresh" size={14} /> ล้างข้อมูล</button>
          <button className="btn" onClick={doPrint}><Icon name="print" size={14} /> พิมพ์</button>
        </div>
      </div>

      {error && (<div className="sr-error" style={{ marginBottom: 12 }}><Icon name="info" size={14} /> {error}</div>)}
      {warn && !error && (<div className="dn-status-alert warn" style={{ marginBottom: 12 }}><Icon name="info" size={15} /><span>{warn}</span></div>)}

      {/* ── ① ข้อมูลคำขอ ── */}
      <div className="search-card">
        <div className="section-head" style={{ marginBottom: 16 }}>
          <span className="head-bar" /><h3>ข้อมูลคำขอ</h3>
          <div className="head-actions">
            <span className="ls-status-lbl">สถานะ</span>
            <span className={'pill ' + (savedNo ? 'warn' : 'info')}>{savedNo ? 'รออนุมัติ' : 'ร่างรายการ'}</span>
          </div>
        </div>
        <div className="ls-form-grid">
          <LsRow label="เลขที่คำขอ">
            {savedNo ? <div className="ls-ro mono">{savedNo}</div> : <div className="ls-ro ls-auto">AUTO</div>}
          </LsRow>
          <LsRow label="วันที่ตั้งลูกหนี้" required>
            <ErpDate value={effDate} onChange={(v) => ((e) => setEffDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
          </LsRow>
          <LsRow label="เลขที่สมาชิก" required>
            <LsSearchField value={member ? member.code : ''} placeholder="คลิกเพื่อค้นหาสมาชิก / สัญญา…" onOpen={() => setModal('contract')} />
          </LsRow>
          <LsRow label="ชื่อ-ชื่อสกุล">
            <div className="ls-ro">{member ? member.name : <span className="ls-ph">(ดึงอัตโนมัติ)</span>}</div>
          </LsRow>
          <LsRow label="เลขที่สัญญา" required>
            {loaded && contracts.length > 1 ? (
              <select className="cfg-input mono" value={contractNo} onChange={(e) => pickContract(e.target.value)}>
                {contracts.map(d => <option key={d.contractNo} value={d.contractNo}>{d.contractNo} · {d.type}</option>)}
              </select>
            ) : (
              <LsSearchField value={contractNo} placeholder="คลิกเพื่อค้นหาเลขที่สัญญา…" onOpen={() => setModal('contract')} />
            )}
          </LsRow>
          <LsRow label="สังกัด">
            <div className="ls-ro">{member ? <><span className="mono">{member.deptCode}</span> {member.dept}</> : <span className="ls-ph">(ดึงอัตโนมัติ)</span>}</div>
          </LsRow>
          <LsRow label="หมายเหตุ" span>
            <textarea className="cfg-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder="ระบุหมายเหตุประกอบการเปลี่ยนแปลง (ถ้ามี)" />
          </LsRow>
        </div>
      </div>

      {/* ── ② ก่อน / หลังเปลี่ยนแปลง ── */}
      <div className="ls-two-col">
        {/* ก่อน */}
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ข้อมูลก่อนเปลี่ยนแปลง</h3>
          </div>
          {loaded ? (
            <div className="ls-kv-list">
              <LsKv label="สถานะทางกฎหมายเดิม">
                <span className={'pill ' + before.pill}>{before.label}</span>
                <span className="ls-kv-code muted mono">รหัส {before.legacyCode}</span>
              </LsKv>
              <LsKv label="วันที่คิดดอกเบี้ยล่าสุด"><span className="mono">{window.fmt.date(debt.lastPayDate)}</span></LsKv>
              <LsKv label="เงินกู้คงเหลือ" suffix="บาท"><span className="mono num">{window.fmt.money(remaining, 2)}</span></LsKv>
              <LsKv label="ดอกเบี้ยค้างชำระ" suffix="บาท"><span className={'mono num' + (interestDue > 0 ? ' ls-danger' : '')}>{window.fmt.money(interestDue, 2)}</span></LsKv>
            </div>
          ) : <div className="ls-empty"><Icon name="search" size={20} /><span>เลือกสัญญาเพื่อแสดงสถานะเดิม</span></div>}
        </div>

        {/* หลัง */}
        <div className="search-card ls-after-card">
          <div className="section-head" style={{ marginBottom: 14 }}>
            <span className="head-bar" /><h3>ข้อมูลหลังเปลี่ยนแปลง</h3>
          </div>
          {loaded ? (
            <div className="ls-form-grid ls-after-grid">
              <LsRow label="สถานะทางกฎหมายใหม่" required span>
                <select className="cfg-input" value={newCode} onChange={(e) => setNewCode(e.target.value)}>
                  <option value="">— เลือกสถานะทางกฎหมาย —</option>
                  {window.LEGAL_STATUS.map(s => <option key={s.code} value={s.code}>{s.code}-{s.label}</option>)}
                </select>
              </LsRow>
              <LsRow label="วันที่มีผล">
                <ErpDate value={effDate} onChange={(v) => ((e) => setEffDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
              </LsRow>
              <LsRow label="เงินกู้คงเหลือ">
                <div className="ls-suffix"><div className="ls-ro mono num">{window.fmt.money(remaining, 2)}</div><span className="ls-suffix-u">บาท</span></div>
              </LsRow>
              <LsRow label="ดอกเบี้ยค้างชำระ" span>
                <div className="ls-suffix"><div className="ls-ro mono num">{window.fmt.money(interestDue, 2)}</div><span className="ls-suffix-u">บาท</span></div>
              </LsRow>
              <LsRow label="ผู้อนุมัติ">
                <select className="cfg-input" value={approver} onChange={(e) => setApprover(e.target.value)}>
                  <option value="">— เลือกผู้อนุมัติ —</option>
                  {window.LS_APPROVERS.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </LsRow>
              <LsRow label="สถานะอนุมัติ">
                <span className={'pill ' + (savedNo ? 'warn' : 'neutral')}>{savedNo ? 'รออนุมัติ' : 'ยังไม่บันทึก'}</span>
              </LsRow>
            </div>
          ) : <div className="ls-empty"><Icon name="edit" size={20} /><span>เลือกสัญญาเพื่อเลือกสถานะใหม่</span></div>}
        </div>
      </div>

      {/* ── ③ ผู้ค้ำประกัน / รายการที่เกี่ยวข้อง ── */}
      <div className="search-card" style={{ marginTop: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <span className="head-bar" /><h3>ผู้ค้ำประกัน / รายการที่เกี่ยวข้อง</h3>
          <div className="head-actions">
            <button className="btn dashed sm" disabled={!loaded} onClick={() => setModal('add-related')}>
              <Icon name="plus" size={13} /> เพิ่มผู้ค้ำประกัน
            </button>
          </div>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl ls-related-tbl">
            <thead>
              <tr>
                <th className="center" style={{ width: 60 }}>ลำดับ</th>
                <th style={{ width: 130 }}>เลขที่คนค้ำ</th>
                <th>ชื่อ-ชื่อสกุล</th>
                <th style={{ width: 160 }}>สัญญา</th>
                <th className="num" style={{ width: 150 }}>รับโอนคงเหลือ</th>
                <th className="center" style={{ width: 150 }}>สถานะกฎหมาย</th>
                <th style={{ width: 44 }} />
              </tr>
            </thead>
            <tbody>
              {!loaded ? (
                <tr><td colSpan="7" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="members" size={22} /></div>
                  เลือกสัญญาเพื่อแสดงรายการผู้ค้ำประกันที่เกี่ยวข้อง
                </td></tr>
              ) : relatedRows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="members" size={22} /></div>
                  สัญญานี้ไม่มีผู้ค้ำประกัน
                </td></tr>
              ) : relatedRows.map((r, i) => (
                <tr key={r.memberCode + '/' + i}>
                  <td className="center mono">{i + 1}</td>
                  <td className="mono">{r.memberCode}</td>
                  <td>{r.name}</td>
                  <td className="mono">{r.contractNo}</td>
                  <td className="num mono">{window.fmt.money(r.transferRemaining, 2)}</td>
                  <td className="center"><span className={'pill ' + r.legalPill}>{r.legalCode}-{r.legalLabel}</span></td>
                  <td className="center">
                    {r.manual
                      ? <button className="btn text sm" title="ลบรายการ" onClick={() => removeRelated(relatedExtra.indexOf(r))}><Icon name="trash" size={13} /></button>
                      : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
        <div className="ls-pager">
          <span className="muted">รวม {relatedRows.length} รายการ</span>
          <div className="ls-pager-right">
            <span className="muted">แสดง</span>
            <select className="cfg-input sm" defaultValue="10" style={{ width: 64 }}>
              <option value="10">10</option><option value="20">20</option><option value="50">50</option>
            </select>
            <span className="muted">รายการต่อหน้า</span>
            <div className="ls-pages">
              <button className="ls-page-btn" disabled><Icon name="chevLeft" size={13} /></button>
              <button className="ls-page-btn active">1</button>
              <button className="ls-page-btn" disabled><Icon name="chevRight" size={13} /></button>
            </div>
          </div>
        </div>
      </div>

      {modal === 'contract' && (
        <ContractSearchModal title="ค้นหาสมาชิก / สัญญาเงินกู้"
          onPick={pickFromModal} onClose={() => setModal(false)} />
      )}
      {modal === 'add-related' && (
        <ContractSearchModal title="เพิ่มผู้ค้ำประกัน / ผู้เกี่ยวข้อง"
          onPick={addRelated} onClose={() => setModal(false)} />
      )}
    </div>
  );
}

Object.assign(window, { LegalStatusChangePage });
