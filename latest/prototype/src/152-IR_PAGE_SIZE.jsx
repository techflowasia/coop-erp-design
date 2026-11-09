// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — จัดการประกันภัยสมาชิก (Insurance Renewal Management)
//  Dashboard ครบกำหนดต่อ · ต่อรายบุคคล · Import กลุ่ม · Export · Template
//  ใช้ดีไซน์ Ant Design (คลาสกลางจาก styles.css)
// ════════════════════════════════════════════════════════════════════
const { useState: useStateIR, useMemo: useMemoIR, useRef: useRefIR } = React;

const IR_PAGE_SIZE = 7;
const irMoney = (n) => (window.fmt ? window.fmt.money(Number(n) || 0, 0) : Number(n).toLocaleString('th-TH'));
const irDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
};
const irNorm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
const irAddYear = (startISO) => {
  const d = new Date((startISO || window.DEPOSIT_WORKING_DATE) + 'T00:00:00');
  d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

// ─── Field helper (โหมดกรอก) ─────────────────────────────────────────
function IRField({ label, required, hint, error, children, full }) {
  return (
    <div className={"sr-field" + (full ? " full" : "")} style={full ? { gridColumn: '1 / -1' } : null}>
      <label className="sr-label">
        {label}{required && <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>}
        {hint && <span className="sr-hint"> {hint}</span>}
      </label>
      {children}
      {error && <div className="mf-err"><Icon name="info" size={11} /> {error}</div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
function InsuranceRenewalPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [records, setRecords] = useStateIR(() => window.INSURANCE_RENEWAL_SEED.map(r => ({ ...r })));
  const [q, setQ] = useStateIR('');
  const [dueWin, setDueWin] = useStateIR('all');
  const [typeF, setTypeF] = useStateIR('all');
  const [statusF, setStatusF] = useStateIR('all');
  const [loanTypeF, setLoanTypeF] = useStateIR('all');
  const [mStatusF, setMStatusF] = useStateIR('all');
  const [per, setPer] = useStateIR(20);
  const irDraft0 = { q: '', loanTypeF: 'all', dueWin: 'all', typeF: 'all', statusF: 'all', mStatusF: 'all' };
  const [draft, setDraft] = useStateIR(irDraft0);
  const setD = (k) => (e) => { const v = e.target.value; setDraft(d => ({ ...d, [k]: v })); };
  const applyFilters = (d) => { setQ(d.q); setLoanTypeF(d.loanTypeF); setDueWin(d.dueWin); setTypeF(d.typeF); setStatusF(d.statusF); setMStatusF(d.mStatusF); setPage(1); };
  const doSearch = () => applyFilters(draft);
  const doReset = () => { setDraft(irDraft0); applyFilters(irDraft0); };
  const [sort, setSort] = useStateIR({ key: 'endDate', dir: 'asc' });
  const [page, setPage] = useStateIR(1);
  const [renewRec, setRenewRec] = useStateIR(null);
  const [cancelRec, setCancelRec] = useStateIR(null);
  const [okMsg, setOkMsg] = useStateIR(null);
  const [reportOpen, setReportOpen] = useStateIR(false);
  const [importOpen, setImportOpen] = useStateIR(false);
  const [newOpen, setNewOpen] = useStateIR(false);

  // ── สถิติ ──
  const stats = useMemoIR(() => {
    let due = 0, overdue = 0, near = 0, renewed = 0, review = 0;
    records.forEach(r => {
      const st = window.insRenewState(r, workDate);
      if (st.key === 'renewed') renewed++;
      else { due++; if (st.key === 'overdue') overdue++; else if (st.key === 'near') near++; if (r.status === 'review') review++; }
    });
    return { due, overdue, near, renewed, review, total: records.length };
  }, [records, workDate]);

  // ── กรอง + เรียง ──
  const filtered = useMemoIR(() => {
    let list = records;
    if (q.trim()) {
      const nq = irNorm(q);
      list = list.filter(r => irNorm(r.memberCode).includes(nq) || irNorm(r.memberName).includes(nq)
        || irNorm(r.citizenId).includes(nq) || irNorm(r.oldPolicyNo).includes(nq)
        || irNorm(r.loanContractNo).includes(nq));
    }
    if (typeF !== 'all') list = list.filter(r => r.insuranceType === typeF);
    if (loanTypeF !== 'all') list = list.filter(r => r.loanType === loanTypeF);
    if (statusF !== 'all') list = list.filter(r => r.status === statusF);
    if (mStatusF !== 'all') list = list.filter(r => window.irMemberStatus(r.memberCode) === mStatusF);
    if (dueWin !== 'all') {
      const days = +dueWin;
      list = list.filter(r => r.status !== 'renewed' && window.daysUntil(r.endDate, workDate) <= days);
    }
    const { key, dir } = sort; const mul = dir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      let av = a[key], bv = b[key];
      if (key === 'coverage' || key === 'premium') { av = +av; bv = +bv; }
      else if (key === 'status') { av = window.insRenewState(a, workDate).key; bv = window.insRenewState(b, workDate).key; }
      else { av = String(av); bv = String(bv); }
      return av < bv ? -1 * mul : av > bv ? 1 * mul : 0;
    });
    return list;
  }, [records, q, typeF, statusF, dueWin, sort, workDate, loanTypeF, mStatusF]);

  const pages = Math.max(1, Math.ceil(filtered.length / per));
  const curPage = Math.min(page, pages);
  const pageRows = filtered.slice((curPage - 1) * per, curPage * per);
  React.useEffect(() => { setPage(1); }, [q, typeF, statusF, dueWin, loanTypeF, mStatusF]);

  const setSortKey = (key) => setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  const sortInd = (key) => sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '';

  // ── บันทึกต่อรายบุคคล ──
  const handleRenew = (rec, form) => {
    setRecords(rs => rs.map(r => r.id === rec.id ? {
      ...r, ...form, status: 'renewed',
      coverage: Number(form.coverage), premium: Number(form.premium),
    } : r));
    audit.log({
      action: 'update', module: 'จัดการประกันภัยสมาชิก',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ต่อเบี้ยประกัน ${rec.insuranceType}`,
      changes: [
        { field: 'สถานะการต่อ', before: 'ยังไม่ต่ออายุ', after: 'ต่ออายุแล้ว' },
        { field: 'วันสิ้นสุดคุ้มครอง', before: irDate(rec.endDate), after: irDate(form.endDate) },
        ...(form.newPolicyNo ? [{ field: 'เลขที่กรมธรรม์ใหม่', before: rec.newPolicyNo || '—', after: form.newPolicyNo }] : []),
      ],
    });
    setRenewRec(null);
    setOkMsg({
      title: 'บันทึกการต่ออายุเรียบร้อยแล้ว',
      detail: `ต่อเบี้ยประกันของ ${rec.memberCode} · ${rec.memberName} (${form.insuranceType}) คุ้มครองถึง ${irDate(form.endDate)} เรียบร้อยแล้ว`,
    });
  };

  // ── ยกเลิกทำประกัน ──
  const handleCancelIns = (rec, reason) => {
    setRecords(rs => rs.map(r => r.id === rec.id
      ? { ...r, status: 'cancelled', cancelReason: reason, cancelDate: workDate } : r));
    audit && audit.log && audit.log({
      action: 'update', module: 'สินเชื่อ — จัดการประกันภัยสมาชิก',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `ยกเลิกทำประกัน ${rec.insuranceType} (กรมธรรม์ ${rec.policyNo || '—'})`,
      changes: [{ field: 'เหตุผลที่ยกเลิก', before: '—', after: reason }],
    });
    setCancelRec(null);
    setOkMsg({
      title: 'ยกเลิกทำประกันเรียบร้อยแล้ว',
      detail: `ยกเลิกทำประกันของ ${rec.memberCode} · ${rec.memberName} (${rec.insuranceType}) เรียบร้อยแล้ว`,
    });
  };

  // ── นำเข้ากลุ่ม (Bulk) ──
  const handleBulkApply = (validRows) => {
    setRecords(rs => {
      const next = rs.map(r => ({ ...r }));
      validRows.forEach(vr => {
        const target = next.find(r => r.memberCode === vr.memberCode && r.insuranceType === vr.insuranceType && r.status !== 'renewed')
          || next.find(r => r.memberCode === vr.memberCode && r.status !== 'renewed');
        if (target) {
          Object.assign(target, {
            insuranceType: vr.insuranceType, company: vr.company,
            newPolicyNo: vr.newPolicyNo || target.newPolicyNo,
            coverage: Number(vr.coverage), premium: Number(vr.premium),
            startDate: vr.startDate, endDate: vr.endDate,
            payMethod: vr.payMethod, beneficiary: vr.beneficiary || target.beneficiary,
            status: 'renewed',
          });
        }
      });
      return next;
    });
    audit.log({
      action: 'import', module: 'จัดการประกันภัยสมาชิก',
      target: `นำเข้าต่อเบี้ยประกัน ${validRows.length} รายการ`,
      summary: `ต่อเบี้ยประกันแบบกลุ่มผ่านไฟล์ (${validRows.length} ราย)`, changes: [],
    });
    setImportOpen(false);
    onToast && onToast(`นำเข้าต่อเบี้ยประกันสำเร็จ ${validRows.length} รายการ`);
  };

  // ── ทำประกันใหม่ (อ้างอิงสัญญาเงินกู้ที่ยังไม่มีประกัน) ──
  const handleCreateNew = (contract, form) => {
    const rec = {
      id: window.nextInsRenewId(),
      memberCode: contract.memberCode, memberName: contract.memberName, citizenId: contract.citizenId,
      dept: contract.dept, phone: contract.phone, address: contract.address,
      insuranceType: form.insuranceType, company: form.company,
      oldPolicyNo: '', newPolicyNo: form.newPolicyNo,
      coverage: Number(form.coverage), premium: Number(form.premium),
      startDate: form.startDate, endDate: form.endDate,
      payMethod: form.payMethod, beneficiary: form.beneficiary,
      status: 'renewed',
      loanContractNo: contract.contractNo, loanType: contract.loanType, contractNature: contract.contractNature,
    };
    setRecords(rs => [rec, ...rs]);
    audit.log({
      action: 'create', module: 'จัดการประกันภัยสมาชิก',
      target: `${contract.memberCode} · ${contract.memberName}`,
      summary: `ทำประกันใหม่ ${form.insuranceType} (อ้างอิงสัญญา ${contract.contractNo})`,
      changes: [
        { field: 'สัญญาเงินกู้อ้างอิง', before: '—', after: contract.contractNo },
        { field: 'ทุนประกัน', before: '—', after: irMoney(form.coverage) + ' บาท' },
      ],
    });
    setNewOpen(false);
    onToast && onToast(`ทำประกันใหม่ให้ ${contract.memberCode} (สัญญา ${contract.contractNo}) สำเร็จ`);
  };

  // ── Export (เฉพาะรายการที่กรองอยู่) ──
  const handleExport = () => {
    const cols = [
      { key: 'memberCode', label: 'รหัสสมาชิก' }, { key: 'memberName', label: 'ชื่อ-นามสกุล' },
      { key: 'citizenId', label: 'เลขบัตรประชาชน' }, { key: 'dept', label: 'หน่วยงานสังกัด' },
      { key: 'phone', label: 'เบอร์โทร' }, { key: 'address', label: 'ที่อยู่' },
      { key: 'loanContractNo', label: 'เลขที่สัญญาเงินกู้' }, { key: 'loanType', label: 'โครงการเงินกู้' },
      { key: 'contractNature', label: 'ลักษณะสัญญา' },
      { key: 'insuranceType', label: 'ประเภทประกันภัย' }, { key: 'company', label: 'บริษัทประกันภัย' },
      { key: 'oldPolicyNo', label: 'เลขกรมธรรม์เดิม' }, { key: 'coverage', label: 'ทุนประกัน' },
      { key: 'premium', label: 'เบี้ยประกันภัย' }, { key: 'startDate', label: 'เริ่มคุ้มครอง' },
      { key: 'endDate', label: 'สิ้นสุดคุ้มครอง' }, { key: 'payMethodLabel', label: 'ช่องทางชำระ' },
      { key: 'beneficiary', label: 'ผู้รับผลประโยชน์' }, { key: 'statusLabel', label: 'สถานะการต่อ' },
    ];
    const rows = filtered.map(r => ({ ...r, payMethodLabel: window.insPayLabel(r.payMethod), statusLabel: window.insRenewState(r, workDate).label }));
    window.downloadFile(`รายการต่อประกัน_${workDate}.csv`, window.buildCSV(cols, rows), 'text/csv');
    onToast && onToast(`ส่งออก ${rows.length} รายการเป็นไฟล์ CSV แล้ว`);
  };

  // ── ดาวน์โหลด Template ──
  const handleTemplate = () => {
    const cols = window.INSURANCE_RENEWAL_COLUMNS;
    const sample = {
      memberCode: 'M-058241', memberName: 'นายสมชาย ใจดี รักษ์ออม', citizenId: '3-1019-00821-45-3',
      insuranceType: 'ประกันชีวิตคุ้มครองสินเชื่อ', company: 'บมจ. ไทยสมุทรประกันชีวิต',
      newPolicyNo: '', coverage: '1500000', premium: '18500',
      startDate: '02/06/2026', endDate: '01/06/2027', payMethod: 'หักเรียกเก็บประจำเดือน',
      beneficiary: 'นางวิภา ใจดี (คู่สมรส)',
    };
    window.downloadFile('Template_ต่อเบี้ยประกัน.csv', window.buildCSV(cols, [sample]), 'text/csv');
    onToast && onToast('ดาวน์โหลดไฟล์ต้นแบบ (Template) แล้ว');
  };

  return (
    <div data-screen-label="จัดการประกันภัยสมาชิก">
      {/* แถบเครื่องมือบน */}
      <div className="page-actions">
        <div className="flex flex-col gap-0.5">
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>จัดการประกันภัยสมาชิก</h2>
          <div className="muted" style={{ fontSize: 'var(--font-sm)', marginTop: 2 }}>
            ติดตามและต่อเบี้ยประกันภัยที่ครบกำหนด · วันทำการ {irDate(workDate)}
          </div>
        </div>
        <span className="spacer" />
        <button className="btn" onClick={() => setReportOpen(true)}><Icon name="report" /> ออกรายงานต่อประกัน</button>
        <button className="btn" onClick={handleTemplate}><Icon name="download" /> ดาวน์โหลด Template</button>
        <button className="btn" onClick={handleExport}><Icon name="download" /> Export</button>
        <button className="btn" onClick={() => setImportOpen(true)}><Icon name="upload" /> Import ต่อเบี้ยประกัน</button>
        <button className="btn primary" onClick={() => setNewOpen(true)}><Icon name="plus" /> ทำประกันใหม่</button>
      </div>

      {/* การ์ดสถิติ */}
      <div className="dxc-stat-row">
        <div className="dxc-stat"><span className="k">ครบกำหนดต่ออายุ</span><span className="v mono">{stats.due}</span></div>
        <div className="dxc-stat"><span className="k">เลยกำหนด / หมดอายุ</span><span className="v mono" style={{ color: 'var(--danger)' }}>{stats.overdue}</span></div>
        <div className="dxc-stat"><span className="k">ใกล้ครบกำหนด (≤30 วัน)</span><span className="v mono" style={{ color: 'var(--warning)' }}>{stats.near}</span></div>
        <div className="dxc-stat"><span className="k">ต่ออายุแล้ว</span><span className="v mono" style={{ color: 'var(--primary)' }}>{stats.renewed}</span></div>
      </div>

      {/* การ์ดตาราง */}
      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* ตัวกรอง */}
        <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <div className="gcc-search-input" style={{ flex: 'none', width: 340, maxWidth: 'none' }}>
              <Icon name="search" size={14} />
              <input className="cfg-input" value={draft.q} onChange={setD('q')} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                     placeholder="รหัสสมาชิก / ชื่อ-สกุล / เลขบัตร / เลขที่สัญญา…" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>โครงการเงินกู้</span>
            <select className="cfg-input" style={{ width: 240 }} value={draft.loanTypeF} onChange={setD('loanTypeF')}>
              <option value="all">ทั้งหมด</option>
              {window.INSURANCE_LOAN_PROJECTS().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>ช่วงครบกำหนด</span>
            <select className="cfg-input" style={{ width: 150 }} value={draft.dueWin} onChange={setD('dueWin')}>
              <option value="all">ทั้งหมด</option>
              <option value="30">ภายใน 30 วัน</option>
              <option value="60">ภายใน 60 วัน</option>
              <option value="90">ภายใน 90 วัน</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>ประเภทประกัน</span>
            <select className="cfg-input" style={{ width: 200 }} value={draft.typeF} onChange={setD('typeF')}>
              <option value="all">ทั้งหมด</option>
              {window.INSURANCE_RENEWAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>สถานะ</span>
            <select className="cfg-input" style={{ width: 150 }} value={draft.statusF} onChange={setD('statusF')}>
              <option value="all">ทั้งหมด</option>
              <option value="pending">ยังไม่ต่ออายุ</option>
              <option value="review">รอตรวจสอบ</option>
              <option value="renewed">ต่ออายุแล้ว</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 12 }}>สถานะสมาชิก</span>
            <select className="cfg-input" style={{ width: 150 }} value={draft.mStatusF} onChange={setD('mStatusF')}>
              <option value="all">ทั้งหมด</option>
              {window.IR_MEMBER_STATUSES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <span className="spacer" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn primary" onClick={doSearch}>ค้นหา</button>
            <button type="button" className="btn" onClick={doReset}>รีเซ็ต</button>
          </div>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => setSortKey('memberCode')}>รหัสสมาชิก <span className="sort-ind">{sortInd('memberCode')}</span></th>
                  <th className="sortable" onClick={() => setSortKey('memberName')}>สมาชิก <span className="sort-ind">{sortInd('memberName')}</span></th>
                  <th>สัญญาเงินกู้</th>
                  <th>ประเภทประกัน / บริษัท</th>
                  <th className="num sortable" onClick={() => setSortKey('coverage')}>ทุนประกัน <span className="sort-ind">{sortInd('coverage')}</span></th>
                  <th className="num sortable" onClick={() => setSortKey('premium')}>เบี้ย/ปี <span className="sort-ind">{sortInd('premium')}</span></th>
                  <th className="sortable" onClick={() => setSortKey('endDate')}>สิ้นสุดคุ้มครอง <span className="sort-ind">{sortInd('endDate')}</span></th>
                  <th className="center sortable" onClick={() => setSortKey('status')}>สถานะ <span className="sort-ind">{sortInd('status')}</span></th>
                  <th className="center" style={{ width: 220 }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={9}><div className="empty-state">ไม่พบรายการที่ตรงกับเงื่อนไข</div></td></tr>
                )}
                {pageRows.map(r => {
                  const st = window.insRenewState(r, workDate);
                  const days = window.daysUntil(r.endDate, workDate);
                  return (
                    <tr key={r.id}>
                      <td className="mono">{r.memberCode}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{r.memberName}</div>
                        <div className="muted mono" style={{ fontSize: 'var(--font-xs)' }}>{r.citizenId}</div>
                      </td>
                      <td>
                        <div className="mono" style={{ fontWeight: 500 }}>{r.loanContractNo}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start', marginTop: 3 }}>
                          <span className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.loanType}</span>
                          <span className={"chip" + (r.contractNature === 'ปรับโครงสร้างหนี้' ? ' warning' : '')}
                                style={{ height: 18, fontSize: 10, padding: '0 6px' }}>{r.contractNature}</span>
                        </div>
                      </td>
                      <td>
                        <div>{r.insuranceType}</div>
                        <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.company}</div>
                      </td>
                      <td className="num">{irMoney(r.coverage)}</td>
                      <td className="num">{irMoney(r.premium)}</td>
                      <td>
                        <div style={{ color: st.tone === 'bad' ? 'var(--danger)' : st.tone === 'warn' ? 'var(--warning)' : 'var(--text)' }}>{irDate(r.endDate)}</div>
                        {r.status !== 'renewed' && (
                          <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>
                            {days < 0 ? `เลยมาแล้ว ${Math.abs(days)} วัน` : `อีก ${days} วัน`}
                          </div>
                        )}
                      </td>
                      <td className="center"><span className={"pill " + st.tone}>{st.label}</span></td>
                      <td className="center">
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn sm primary" disabled={r.status === 'renewed' || r.status === 'cancelled'}
                                  onClick={() => setRenewRec(r)}><Icon name="shield" size={12} /> ต่อประกัน</button>
                          <button className="btn sm danger" disabled={r.status === 'cancelled'}
                                  onClick={() => setCancelRec(r)}><Icon name="close" size={12} /> ยกเลิกทำประกัน</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        </div>

        {/* แบ่งหน้า */}
        {(() => {
          const total = filtered.length;
          const from = total ? (curPage - 1) * per + 1 : 0, to = Math.min(curPage * per, total);
          const pgStyle = (active, disabled) => ({
            minWidth: 28, height: 28, padding: '0 8px', borderRadius: 4, fontFamily: 'inherit', fontSize: 12,
            cursor: disabled ? 'default' : 'pointer',
            border: '1px solid ' + (active ? '#237450' : '#d9d9d9'),
            background: active ? '#237450' : '#fff',
            color: active ? '#fff' : (disabled ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.65)'),
          });
          let st = Math.max(1, curPage - 2); const en = Math.min(pages, st + 4); st = Math.max(1, en - 4);
          const nums = []; for (let i = st; i <= en; i++) nums.push(i);
          return (
            <div style={{ margin: '0 16px', padding: '12px 0', borderTop: '1px solid #f0f0f0', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,.45)' }}>{total === 0 ? '0 รายการ' : from + '-' + to + ' จาก ' + total + ' รายการ'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button style={pgStyle(false, curPage <= 1)} disabled={curPage <= 1} onClick={() => setPage(curPage - 1)} aria-label="ก่อนหน้า">‹</button>
                {nums.map(i => <button key={i} style={pgStyle(i === curPage, false)} onClick={() => setPage(i)}>{i}</button>)}
                <button style={pgStyle(false, curPage >= pages)} disabled={curPage >= pages} onClick={() => setPage(curPage + 1)} aria-label="ถัดไป">›</button>
                <select value={per} onChange={(e) => { setPer(Number(e.target.value)); setPage(1); }} aria-label="จำนวนต่อหน้า"
                        style={{ height: 28, border: '1px solid #d9d9d9', borderRadius: 4, fontFamily: 'inherit',
                                 fontSize: 12, color: 'rgba(0,0,0,.65)', background: '#fff', padding: '0 6px' }}>
                  {[20, 50, 100].map(n => <option key={n} value={n}>{n} / หน้า</option>)}
                </select>
              </div>
            </div>
          );
        })()}
      </div>

      {renewRec && <RenewModal rec={renewRec} workDate={workDate} onClose={() => setRenewRec(null)} onSave={handleRenew} />}
      {cancelRec && <CancelInsModal rec={cancelRec} workDate={workDate} onClose={() => setCancelRec(null)} onConfirm={handleCancelIns} />}
      {reportOpen && <RenewReportModal records={records} workDate={workDate} onClose={() => setReportOpen(false)} />}
      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
                            onClose={() => setOkMsg(null)} />
      )}
      {importOpen && <ImportModal records={records} onClose={() => setImportOpen(false)} onApply={handleBulkApply} onTemplate={handleTemplate} />}
      {newOpen && <NewInsuranceModal records={records} workDate={workDate} onClose={() => setNewOpen(false)} onCreate={handleCreateNew} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal: ต่อเบี้ยประกันรายบุคคล
// ════════════════════════════════════════════════════════════════════
function RenewModal({ rec, workDate, onClose, onSave }) {
  const [f, setF] = useStateIR(() => ({
    insuranceType: rec.insuranceType, company: rec.company, newPolicyNo: '',
    coverage: String(rec.coverage), premium: String(rec.premium),
    startDate: workDate, endDate: irAddYear(workDate),
    payMethod: rec.payMethod, beneficiary: rec.beneficiary === '—' ? '' : rec.beneficiary,
    endorseNo: rec.endorseNo || '',
  }));
  const [touched, setTouched] = useStateIR(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const errs = {};
  if (!f.insuranceType) errs.insuranceType = 'กรุณาเลือกประเภทประกัน';
  if (!f.company) errs.company = 'กรุณาเลือกบริษัทประกัน';
  if (!String(f.coverage).trim() || Number(f.coverage) <= 0) errs.coverage = 'กรุณาระบุทุนประกัน';
  if (!String(f.premium).trim() || Number(f.premium) <= 0) errs.premium = 'กรุณาระบุเบี้ยประกัน';
  if (!f.startDate) errs.startDate = 'กรุณาระบุวันเริ่มคุ้มครอง';
  if (!f.endDate) errs.endDate = 'กรุณาระบุวันสิ้นสุดคุ้มครอง';
  if (f.startDate && f.endDate && f.endDate <= f.startDate) errs.endDate = 'ต้องหลังวันเริ่มคุ้มครอง';
  if (!f.payMethod) errs.payMethod = 'กรุณาเลือกช่องทางชำระ';
  const valid = Object.keys(errs).length === 0;
  const err = (k) => touched ? errs[k] : null;

  const submit = () => { if (!valid) { setTouched(true); return; } onSave(rec, f); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 720 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="shield" /></span>
          <h2>ต่อเบี้ยประกันภัย</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {/* แถบสมาชิก (อ่านอย่างเดียว) */}
          <div className="ct-acct-strip" style={{ marginBottom: 16 }}>
            <div className="ct-acct-ico"><Icon name="user" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ct-acct-no" style={{ fontSize: 15 }}>{rec.memberName}</div>
              <div className="ct-acct-sub">
                <span className="mono">{rec.memberCode}</span>
                <span className="dot" style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--text-faint)' }} />
                <span>{rec.citizenId}</span>
                <span className="dot" style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--text-faint)' }} />
                <span>{rec.dept}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span className="chip primary"><Icon name="loans" size={11} /> สัญญา {rec.loanContractNo}</span>
                <span className="chip">{rec.loanType}</span>
                <span className={"chip" + (rec.contractNature === 'ปรับโครงสร้างหนี้' ? ' warning' : '')}>{rec.contractNature}</span>
              </div>
            </div>
            <span className="chip warn"><Icon name="history" size={11} /> เดิมสิ้นสุด {irDate(rec.endDate)}</span>
          </div>

          <div className="ct-warnbox" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)', color: 'var(--text)' }}>
            <Icon name="info" /> ระบบดึงข้อมูลกรมธรรม์เดิมมาเป็นค่าเริ่มต้น — ตรวจสอบและแก้ไขก่อนบันทึก เลขที่กรมธรรม์ใหม่เว้นว่างไว้ก่อนได้
          </div>

          <div className="sr-child-grid" style={{ marginTop: 14 }}>
            <IRField label="ประเภทประกันภัย" required error={err('insuranceType')}>
              <select className="cfg-input" value={f.insuranceType} onChange={e => set('insuranceType', e.target.value)}>
                {window.INSURANCE_RENEWAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </IRField>
            <IRField label="บริษัทประกันภัย" required error={err('company')}>
              <select className="cfg-input" value={f.company} onChange={e => set('company', e.target.value)}>
                {window.INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </IRField>
            <IRField label="ทุนประกัน (บาท)" required error={err('coverage')}>
              <input className="cfg-input mono" type="number" value={f.coverage} onChange={e => set('coverage', e.target.value)} />
            </IRField>
            <IRField label="เบี้ยประกันภัย (บาท/ปี)" required error={err('premium')}>
              <input className="cfg-input mono" type="number" value={f.premium} onChange={e => set('premium', e.target.value)} />
            </IRField>
            <IRField label="วันที่เริ่มคุ้มครอง" required error={err('startDate')}>
              <ErpDate value={f.startDate} onChange={(v) => (e => set('startDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </IRField>
            <IRField label="วันที่สิ้นสุดคุ้มครอง" required error={err('endDate')}>
              <ErpDate value={f.endDate} onChange={(v) => (e => set('endDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
            </IRField>
            <IRField label="ช่องทางชำระเบี้ยประกัน" required error={err('payMethod')}>
              <select className="cfg-input" value={f.payMethod} onChange={e => set('payMethod', e.target.value)}>
                {window.INSURANCE_PAY_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </IRField>
            <IRField label="เลขที่กรมธรรม์ใหม่" hint="(เว้นว่างได้ — อัปเดตภายหลัง)">
              <input className="cfg-input mono" value={f.newPolicyNo} placeholder="ยังไม่ออกเลข"
                     onChange={e => set('newPolicyNo', e.target.value)} />
            </IRField>
            <IRField label="หมายเหตุ" full>
              <input className="cfg-input" value={f.beneficiary} placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
                     onChange={e => set('beneficiary', e.target.value)} />
            </IRField>
            <IRField label="เลขสลักหลัง" full hint="(ไม่บังคับ)">
              <input className="cfg-input mono" value={f.endorseNo} placeholder="เช่น END-2569-00123"
                     onChange={e => set('endorseNo', e.target.value)} />
            </IRField>
          </div>

          <div className="ct-actionbar" style={{ marginTop: 16 }}>
            <Icon name="info" size={14} />
            <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>เมื่อบันทึก สถานะของสมาชิกรายนี้จะเปลี่ยนเป็น “ต่ออายุแล้ว”</span>
            <button className="btn" onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" onClick={submit}><Icon name="check" /> บันทึกการต่ออายุ</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal: ยกเลิกทำประกัน — รายละเอียดกรมธรรม์ (อ่านอย่างเดียว) + เหตุผล
// ════════════════════════════════════════════════════════════════════
function CancelInsModal({ rec, workDate, onClose, onConfirm }) {
  const [reason, setReason] = useStateIR('');
  const ro = (v) => <input className="cfg-input" value={v == null || v === '' ? '—' : String(v)} readOnly />;
  const roMono = (v) => <input className="cfg-input mono" value={v == null || v === '' ? '—' : String(v)} readOnly />;
  const valid = reason.trim().length > 0;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 720 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="close" /></span>
          <h2>ยกเลิกทำประกัน</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="ct-acct-strip" style={{ marginBottom: 16 }}>
            <div className="ct-acct-ico"><Icon name="user" /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="ct-acct-no" style={{ fontSize: 15 }}>{rec.memberName}</div>
              <div className="ct-acct-sub">
                <span className="mono">{rec.memberCode}</span>
                <span className="dot" style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--text-faint)' }} />
                <span>{rec.citizenId}</span>
                <span className="dot" style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--text-faint)' }} />
                <span>{rec.dept}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <span className="chip primary"><Icon name="loans" size={11} /> สัญญา {rec.loanContractNo}</span>
                <span className="chip">{rec.loanType}</span>
              </div>
            </div>
            <span className="chip warn"><Icon name="history" size={11} /> สิ้นสุด {irDate(rec.endDate)}</span>
          </div>

          <div className="ct-warnbox">
            <Icon name="info" /> ตรวจสอบรายละเอียดกรมธรรม์ให้ถูกต้อง — เมื่อยืนยัน สถานะของรายการนี้จะเปลี่ยนเป็น “ยกเลิกทำประกัน” และจะถูกบันทึกใน Audit Trail
          </div>

          <div className="sr-child-grid" style={{ marginTop: 14 }}>
            <IRField label="ประเภทประกันภัย">{ro(rec.insuranceType)}</IRField>
            <IRField label="บริษัทประกันภัย">{ro(rec.company)}</IRField>
            <IRField label="เลขที่กรมธรรม์">{roMono(rec.policyNo)}</IRField>
            <IRField label="ทุนประกัน (บาท)">{roMono(irMoney(rec.coverage))}</IRField>
            <IRField label="เบี้ยประกันภัย (บาท/ปี)">{roMono(irMoney(rec.premium))}</IRField>
            <IRField label="ช่องทางชำระเบี้ยประกัน">{ro(window.insPayLabel(rec.payMethod))}</IRField>
            <IRField label="วันที่เริ่มคุ้มครอง">{roMono(irDate(rec.startDate))}</IRField>
            <IRField label="วันที่สิ้นสุดคุ้มครอง">{roMono(irDate(rec.endDate))}</IRField>
            <IRField label="หมายเหตุ" full>{ro(rec.beneficiary)}</IRField>
            <IRField label="เลขสลักหลัง" full>{roMono(rec.endorseNo)}</IRField>
            <IRField label="เหตุผลการยกเลิกทำประกัน" required full
                     error={reason.length > 0 || valid ? null : null}>
              <textarea className="cfg-input" rows={3} value={reason} maxLength={300}
                        placeholder="ระบุเหตุผลการยกเลิกทำประกัน เช่น สมาชิกขอยกเลิก / ปิดสัญญาเงินกู้ก่อนกำหนด"
                        onChange={e => setReason(e.target.value)} />
            </IRField>
          </div>

          <div className="ct-actionbar" style={{ marginTop: 16 }}>
            <Icon name="info" size={14} />
            <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>ต้องระบุเหตุผลก่อนยืนยันการยกเลิก</span>
            <button className="btn" onClick={onClose}>ปิด</button>
            <button className="btn danger" disabled={!valid} onClick={() => onConfirm(rec, reason.trim())}>
              <Icon name="close" /> ยืนยันยกเลิกทำประกัน
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal: Import ต่อเบี้ยประกันแบบกลุ่ม (CSV)
// ════════════════════════════════════════════════════════════════════
const IR_TH_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พระษภาคม', 'มิถุนายน',
  'กรกดาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พระจิกายน', 'ธันวาคม'];

// Modal: รายงานสมาชิกที่ต้องต่อประกัน — เลือกเดือน/ปี พ.ศ.
function RenewReportModal({ records, workDate, onClose }) {
  const base = String(workDate || '').slice(0, 7) || new Date().toISOString().slice(0, 7);
  const [ym, setYm] = useStateIR(base);
  const [y, m] = ym.split('-');
  const years = useMemoIR(() => {
    const set = new Set();
    (records || []).forEach(r => { const s = String(r.endDate || '').slice(0, 4); if (s) set.add(s); });
    set.add(base.slice(0, 4));
    return [...set].sort();
  }, [records, base]);

  const rows = useMemoIR(() =>
    (records || []).filter(r => String(r.endDate || '').slice(0, 7) === ym)
      .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate))),
    [records, ym]);

  const sumCoverage = rows.reduce((s, r) => s + Number(r.coverage || 0), 0);
  const sumPremium = rows.reduce((s, r) => s + Number(r.premium || 0), 0);
  const periodLabel = `${IR_TH_MONTHS[Number(m) - 1] || ''} ${Number(y) + 543}`;

  const doExport = () => {
    const cols = [
      { key: 'memberCode', label: 'เลขสมาชิก' }, { key: 'memberName', label: 'ชื่อ-สกุล' },
      { key: 'dept', label: 'หน่วย/สังกัด' }, { key: 'loanContractNo', label: 'เลขที่สัญญาเงินกู้' },
      { key: 'insuranceType', label: 'ประเภทประกัน' }, { key: 'company', label: 'บริษัทประกัน' },
      { key: 'policyNo', label: 'เลขที่กรมธรรม์' }, { key: 'coverage', label: 'ทุนประกัน' },
      { key: 'premium', label: 'เบี้ยประกัน' }, { key: 'endDate', label: 'วันสิ้นสุดคุ้มครอง' },
      { key: 'payMethodLabel', label: 'ช่องทางชำระ' }, { key: 'statusLabel', label: 'สถานะ' },
    ];
    const data = rows.map(r => ({
      ...r,
      payMethodLabel: window.insPayLabel(r.payMethod),
      statusLabel: window.insRenewState(r, workDate).label,
    }));
    window.downloadFile(`รายงานต่อประกัน_${ym}.csv`, window.buildCSV(cols, data), 'text/csv');
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 1040, maxWidth: '96vw' }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="report" /></span>
          <div style={{ minWidth: 0 }}>
            <h2>รายงานสมาชิกที่ต้องต่อประกัน</h2>
            <div className="muted" style={{ fontSize: 11 }}>แสดงรายการตามเดือนที่ความคุ้มครองสิ้นสุด</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>เดือน</span>
              <select className="cfg-input" style={{ width: 170 }} value={m}
                      onChange={e => setYm(`${y}-${e.target.value}`)}>
                {IR_TH_MONTHS.map((label, i) => (
                  <option key={label} value={String(i + 1).padStart(2, '0')}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="muted" style={{ fontSize: 12 }}>ปี (พ.ศ.)</span>
              <select className="cfg-input mono" style={{ width: 130 }} value={y}
                      onChange={e => setYm(`${e.target.value}-${m}`)}>
                {years.map(yy => <option key={yy} value={yy}>{Number(yy) + 543}</option>)}
              </select>
            </div>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn" onClick={doExport}><Icon name="download" /> Export CSV</button>
            <button className="btn" onClick={() => window.print()}><Icon name="print" /> พิมพ์</button>
          </div>

          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: '52vh' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขสมาชิก</th>
                  <th>ชื่อ-สกุล</th>
                  <th>หน่วย/สังกัด</th>
                  <th>เลขที่สัญญาเงินกู้</th>
                  <th>ประเภทประกัน</th>
                  <th>บริษัทประกัน</th>
                  <th>เลขที่กรมธรรม์</th>
                  <th className="num">ทุนประกัน</th>
                  <th className="num">เบี้ยประกัน</th>
                  <th>วันสิ้นสุดคุ้มครอง</th>
                  <th>ช่องทางชำระ</th>
                  <th className="center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={12} className="empty-state">ไม่มีสมาชิกที่ความคุ้มครองสิ้นสุดใน{periodLabel}</td></tr>
                ) : rows.map(r => {
                  const st = window.insRenewState(r, workDate);
                  return (
                    <tr key={r.id}>
                      <td className="mono">{r.memberCode}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{r.memberName}</td>
                      <td>{r.dept}</td>
                      <td className="mono">{r.loanContractNo}</td>
                      <td>{r.insuranceType}</td>
                      <td>{r.company}</td>
                      <td className="mono">{r.policyNo || '—'}</td>
                      <td className="num">{irMoney(r.coverage)}</td>
                      <td className="num">{irMoney(r.premium)}</td>
                      <td className="mono">{irDate(r.endDate)}</td>
                      <td>{window.insPayLabel(r.payMethod)}</td>
                      <td className="center"><span className={'pill ' + st.tone}>{st.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={7} style={{ fontWeight: 600 }}>รวม {rows.length} ราย</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{irMoney(sumCoverage)}</td>
                    <td className="num mono" style={{ fontWeight: 600 }}>{irMoney(sumPremium)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div></div>

          <div className="ct-actionbar" style={{ marginTop: 16 }}>
            <Icon name="info" size={14} />
            <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>
              รายงานนี้นับจากวันสิ้นสุดคุ้มครองของกรมธรรม์ · งวด {periodLabel}
            </span>
            <button className="btn" onClick={onClose}>ปิด</button>
          </div>
        </div>
      </div>
    </>
  );
}

function ImportModal({ records, onClose, onApply, onTemplate }) {
  const [result, setResult] = useStateIR(null); // { fileName, valid:[], errors:[], total }
  const fileRef = useRefIR(null);

  const validate = (rows, fileName) => {
    const cols = window.INSURANCE_RENEWAL_COLUMNS;
    const header = rows[0] || [];
    const idx = {};
    cols.forEach(c => { idx[c.key] = header.findIndex(h => String(h).trim() === c.label); });
    const missingCols = cols.filter(c => idx[c.key] === -1).map(c => c.label);
    if (missingCols.length) {
      setResult({ fileName, valid: [], errors: [{ line: 1, reason: 'หัวตารางไม่ครบ ขาดคอลัมน์: ' + missingCols.join(', ') }], total: 0 });
      return;
    }
    const memberCodes = new Set(records.map(r => r.memberCode));
    const validRows = [], errors = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const get = (k) => String(row[idx[k]] === undefined ? '' : row[idx[k]]).trim();
      const rec = {};
      cols.forEach(c => { rec[c.key] = get(c.key); });
      const lineErr = [];
      cols.filter(c => c.required).forEach(c => { if (!rec[c.key]) lineErr.push(`ขาด“${c.label}”`); });
      if (rec.memberCode && !memberCodes.has(rec.memberCode)) lineErr.push('ไม่พบรหัสสมาชิกในระบบ');
      if (rec.coverage && isNaN(Number(rec.coverage))) lineErr.push('ทุนประกันต้องเป็นตัวเลข');
      if (rec.premium && isNaN(Number(rec.premium))) lineErr.push('เบี้ยประกันต้องเป็นตัวเลข');
      // แปลงวันที่ DD/MM/YYYY -> ISO
      ['startDate', 'endDate'].forEach(k => {
        const v = rec[k];
        if (v) {
          const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) { let y = +m[3]; if (y > 2500) y -= 543; rec[k] = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
          else if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) lineErr.push(`รูปแบบวันที่“${k === 'startDate' ? 'เริ่ม' : 'สิ้นสุด'}”ไม่ถูกต้อง`);
        }
      });
      // payMethod: รับเป็น label หรือ value
      const pmVal = window.insPayValueFromLabel(rec.payMethod) || ((window.INSURANCE_PAY_METHODS || []).some(p => p.value === rec.payMethod) ? rec.payMethod : '');
      if (rec.payMethod && !pmVal) lineErr.push('ช่องทางชำระไม่ถูกต้อง');
      rec.payMethod = pmVal;
      if (lineErr.length) errors.push({ line: i + 1, member: rec.memberCode || '—', reason: lineErr.join(' · ') });
      else validRows.push(rec);
    }
    setResult({ fileName, valid: validRows, errors, total: rows.length - 1 });
  };

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      setResult({ fileName: file.name, valid: [], errors: [{ line: 0, reason: 'รองรับเฉพาะไฟล์ .csv (บันทึกจาก Excel เป็น CSV UTF-8)' }], total: 0 });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => validate(window.parseCSV(ev.target.result), file.name);
    reader.readAsText(file, 'utf-8');
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 780 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="attach" /></span>
          <h2>นำเข้าต่อเบี้ยประกันแบบกลุ่ม</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {!result && (
            <>
              <div className="ct-warnbox" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)', color: 'var(--text)' }}>
                <Icon name="info" /> ดาวน์โหลดไฟล์ต้นแบบ กรอกข้อมูลให้ครบในคอลัมน์บังคับ แล้วบันทึกเป็น <b>.csv (UTF-8)</b> ก่อนอัปโหลด
              </div>
              <div className="ds-row tight" style={{ marginBottom: 14 }}>
                <button className="btn" onClick={onTemplate}><Icon name="download" /> ดาวน์โหลด Template</button>
              </div>
              <label className="logo-uploader" style={{ aspectRatio: 'auto', padding: '34px 20px', cursor: 'pointer', display: 'block', textAlign: 'center' }}>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={onFile} />
                <div className="logo-placeholder" style={{ alignItems: 'center' }}>
                  <Icon name="download" size={26} />
                  <div style={{ fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--text)' }}>คลิกเพื่อเลือกไฟล์ หรือวางไฟล์ที่นี่</div>
                  <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>รองรับ .csv (UTF-8) — คอลัมน์บังคับต้องครบทุกช่อง</div>
                </div>
              </label>
              <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 12, lineHeight: 1.6 }}>
                <b>คอลัมน์บังคับ:</b> {window.INSURANCE_RENEWAL_COLUMNS.filter(c => c.required).map(c => c.label).join(' · ')}
              </div>
            </>
          )}

          {result && (
            <>
              <div className="ds-row" style={{ marginBottom: 12 }}>
                <span className="chip"><Icon name="attach" size={11} /> {result.fileName}</span>
                <span className="chip success"><span className="dot-c" />สำเร็จ {result.valid.length}</span>
                {result.errors.length > 0 && <span className="chip danger"><span className="dot-c" />พบข้อผิดพลาด {result.errors.length}</span>}
                <span className="muted" style={{ fontSize: 'var(--font-xs)' }}>จากทั้งหมด {result.total} แถว</span>
              </div>

              {result.errors.length > 0 && (
                <div className="ds-block">
                  <div className="ds-caption" style={{ color: 'var(--danger)' }}>รายการที่พบข้อผิดพลาด (Error Log)</div>
                  <div className="table-wrap" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead><tr><th style={{ width: 70 }}>บรรทัด</th><th style={{ width: 120 }}>รหัสสมาชิก</th><th>สาเหตุ</th></tr></thead>
                      <tbody>
                        {result.errors.map((e, i) => (
                          <tr key={i}><td className="mono center">{e.line}</td><td className="mono">{e.member || '—'}</td>
                            <td style={{ color: 'var(--danger)', whiteSpace: 'normal' }}>{e.reason}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.valid.length > 0 && (
                <div className="ds-block">
                  <div className="ds-caption" style={{ color: 'var(--success)' }}>รายการที่พร้อมนำเข้า</div>
                  <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    <table className="tbl">
                      <thead><tr><th>รหัสสมาชิก</th><th>ชื่อ-สกุล</th><th>ประเภท</th><th className="num">ทุนประกัน</th><th className="num">เบี้ย</th><th>สิ้นสุด</th></tr></thead>
                      <tbody>
                        {result.valid.map((r, i) => (
                          <tr key={i}>
                            <td className="mono">{r.memberCode}</td><td>{r.memberName}</td>
                            <td>{r.insuranceType}</td><td className="num">{irMoney(r.coverage)}</td>
                            <td className="num">{irMoney(r.premium)}</td><td>{irDate(r.endDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="ct-actionbar" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => { setResult(null); if (fileRef.current) fileRef.current.value = ''; }}><Icon name="refresh" /> เลือกไฟล์ใหม่</button>
                <span className="spacer" style={{ flex: 1 }} />
                <button className="btn" onClick={onClose}>ยกเลิก</button>
                <button className="btn primary" disabled={result.valid.length === 0} onClick={() => onApply(result.valid)}>
                  <Icon name="check" /> ยืนยันนำเข้า {result.valid.length} รายการ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal: ทำประกันภัยใหม่ (อ้างอิงสัญญาเงินกู้ที่ยังไม่มีประกัน)
// ════════════════════════════════════════════════════════════════════
function NewInsuranceModal({ records, workDate, onClose, onCreate }) {
  const [contract, setContract] = useStateIR(null);
  const [q, setQ] = useStateIR('');
  const available = useMemoIR(() => window.availableLoanContracts(records), [records]);
  const list = useMemoIR(() => {
    if (!q.trim()) return available;
    const nq = irNorm(q);
    return available.filter(c => irNorm(c.contractNo).includes(nq) || irNorm(c.memberName).includes(nq)
      || irNorm(c.memberCode).includes(nq) || irNorm(c.citizenId).includes(nq) || irNorm(c.loanType).includes(nq));
  }, [available, q]);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: contract ? 720 : 820 }}>
        <div className="modal-head">
          <span className="gc-modal-ico"><Icon name="plus" /></span>
          <h2>{contract ? 'ทำประกันภัยใหม่' : 'เลือกสัญญาเงินกู้ที่ต้องการทำประกัน'}</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {!contract ? (
            <>
              <div className="ct-warnbox" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)', color: 'var(--text)' }}>
                <Icon name="info" /> แสดงเฉพาะ <b>สัญญาเงินกู้ในระบบที่ยังไม่เคยทำประกัน</b> — เลือกสัญญาเพื่อสร้างกรมธรรม์ใหม่
              </div>
              <div className="toolbar" style={{ margin: '12px 0' }}>
                <div className="search" style={{ flex: '1 1 auto' }}>
                  <Icon name="search" size={14} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเลขที่สัญญา, รหัส/ชื่อสมาชิก, เลขบัตรประชาชน, ประเภทสัญญา..." />
                </div>
                <span className="muted" style={{ fontSize: 'var(--font-sm)' }}>ว่าง <b>{available.length}</b> สัญญา</span>
              </div>
              <div className="table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="tbl">
                  <thead><tr>
                    <th>เลขที่สัญญา</th><th>สมาชิก</th><th>ประเภท / ลักษณะ</th>
                    <th className="num">เงินต้น</th><th className="center">เลือก</th>
                  </tr></thead>
                  <tbody>
                    {list.length === 0 && <tr><td colSpan={5}><div className="empty-state">ไม่พบสัญญาเงินกู้ที่ยังไม่ทำประกัน</div></td></tr>}
                    {list.map(c => (
                      <tr key={c.contractNo} className="clickable" onClick={() => setContract(c)}>
                        <td className="mono" style={{ fontWeight: 500 }}>{c.contractNo}</td>
                        <td><div>{c.memberName}</div><div className="muted mono" style={{ fontSize: 'var(--font-xs)' }}>{c.memberCode}</div><div className="muted mono" style={{ fontSize: 'var(--font-xs)' }}>{c.citizenId}</div></td>
                        <td>
                          <div>{c.loanType}</div>
                          <span className={"chip" + (c.contractNature === 'ปรับโครงสร้างหนี้' ? ' warning' : '')} style={{ height: 18, fontSize: 10, padding: '0 6px', marginTop: 2 }}>{c.contractNature}</span>
                        </td>
                        <td className="num">{irMoney(c.principal)}</td>
                        <td className="center"><button className="btn sm primary" onClick={(e) => { e.stopPropagation(); setContract(c); }}>เลือก</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <NewInsuranceForm contract={contract} workDate={workDate}
                              onBack={() => setContract(null)} onClose={onClose}
                              onCreate={(form) => onCreate(contract, form)} />
          )}
        </div>
      </div>
    </>
  );
}

function NewInsuranceForm({ contract, workDate, onBack, onClose, onCreate }) {
  const [f, setF] = useStateIR(() => ({
    insuranceType: window.INSURANCE_RENEWAL_TYPES[0], company: window.INSURANCE_COMPANIES[0], newPolicyNo: '',
    coverage: String(contract.principal), premium: '',
    startDate: workDate, endDate: irAddYear(workDate),
    payMethod: 'collect', beneficiary: '',
  }));
  const [touched, setTouched] = useStateIR(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const errs = {};
  if (!f.insuranceType) errs.insuranceType = 'กรุณาเลือกประเภทประกัน';
  if (!f.company) errs.company = 'กรุณาเลือกบริษัทประกัน';
  if (!String(f.coverage).trim() || Number(f.coverage) <= 0) errs.coverage = 'กรุณาระบุทุนประกัน';
  if (!String(f.premium).trim() || Number(f.premium) <= 0) errs.premium = 'กรุณาระบุเบี้ยประกัน';
  if (!f.startDate) errs.startDate = 'กรุณาระบุวันเริ่มคุ้มครอง';
  if (!f.endDate) errs.endDate = 'กรุณาระบุวันสิ้นสุดคุ้มครอง';
  if (f.startDate && f.endDate && f.endDate <= f.startDate) errs.endDate = 'ต้องหลังวันเริ่มคุ้มครอง';
  if (!f.payMethod) errs.payMethod = 'กรุณาเลือกช่องทางชำระ';
  const valid = Object.keys(errs).length === 0;
  const err = (k) => touched ? errs[k] : null;
  const submit = () => { if (!valid) { setTouched(true); return; } onCreate(f); };

  return (
    <>
      <div className="ct-acct-strip" style={{ marginBottom: 14 }}>
        <div className="ct-acct-ico"><Icon name="loans" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ct-acct-no" style={{ fontSize: 15 }}>{contract.memberName}</div>
          <div className="ct-acct-sub">
            <span className="mono">{contract.memberCode}</span>
            <span className="dot" style={{ width: 3, height: 3, borderRadius: 9, background: 'var(--text-faint)' }} />
            <span>{contract.dept}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            <span className="chip primary"><Icon name="loans" size={11} /> สัญญา {contract.contractNo}</span>
            <span className="chip">{contract.loanType}</span>
            <span className="chip">เงินต้น ฿ {irMoney(contract.principal)}</span>
          </div>
        </div>
        <button className="btn sm" onClick={onBack}><Icon name="chevLeft" /> เปลี่ยนสัญญา</button>
      </div>

      <div className="ct-warnbox" style={{ background: 'var(--primary-50)', borderColor: 'var(--primary-100)', color: 'var(--text)' }}>
        <Icon name="info" /> ทุนประกันถูกตั้งต้นเท่ากับเงินต้นของสัญญา — ปรับแก้ได้ตามจริงก่อนบันทึก
      </div>

      <div className="sr-child-grid" style={{ marginTop: 14 }}>
        <IRField label="ประเภทประกันภัย" required error={err('insuranceType')}>
          <select className="cfg-input" value={f.insuranceType} onChange={e => set('insuranceType', e.target.value)}>
            {window.INSURANCE_RENEWAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </IRField>
        <IRField label="บริษัทประกันภัย" required error={err('company')}>
          <select className="cfg-input" value={f.company} onChange={e => set('company', e.target.value)}>
            {window.INSURANCE_COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </IRField>
        <IRField label="ทุนประกัน (บาท)" required error={err('coverage')}>
          <input className="cfg-input mono" type="number" value={f.coverage} onChange={e => set('coverage', e.target.value)} />
        </IRField>
        <IRField label="เบี้ยประกันภัย (บาท/ปี)" required error={err('premium')}>
          <input className="cfg-input mono" type="number" value={f.premium} placeholder="0.00" onChange={e => set('premium', e.target.value)} />
        </IRField>
        <IRField label="วันที่เริ่มคุ้มครอง" required error={err('startDate')}>
          <ErpDate value={f.startDate} onChange={(v) => (e => set('startDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
        </IRField>
        <IRField label="วันที่สิ้นสุดคุ้มครอง" required error={err('endDate')}>
          <ErpDate value={f.endDate} onChange={(v) => (e => set('endDate', e.target.value))({ target: { value: v } })} className="cfg-input" />
        </IRField>
        <IRField label="ช่องทางชำระเบี้ยประกัน" required error={err('payMethod')}>
          <select className="cfg-input" value={f.payMethod} onChange={e => set('payMethod', e.target.value)}>
            {window.INSURANCE_PAY_METHODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </IRField>
        <IRField label="เลขที่กรมธรรม์" hint="(เว้นว่างได้ — อัปเดตภายหลัง)">
          <input className="cfg-input mono" value={f.newPolicyNo} placeholder="ยังไม่ออกเลข" onChange={e => set('newPolicyNo', e.target.value)} />
        </IRField>
        <IRField label="ผู้รับผลประโยชน์" full>
          <input className="cfg-input" value={f.beneficiary} placeholder="ชื่อ-สกุล (ความสัมพันธ์)" onChange={e => set('beneficiary', e.target.value)} />
        </IRField>
      </div>

      <div className="ct-actionbar" style={{ marginTop: 16 }}>
        <Icon name="info" size={14} />
        <span className="muted" style={{ fontSize: 'var(--font-xs)', flex: 1 }}>เมื่อบันทึก ระบบจะสร้างกรมธรรม์ใหม่ผูกกับสัญญา {contract.contractNo}</span>
        <button className="btn" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" onClick={submit}><Icon name="check" /> บันทึกทำประกันใหม่</button>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แท็บ "ประกันภัย" ในหน้าทะเบียนสมาชิก (ข้อมูลการเงินและสัญญา)
// ════════════════════════════════════════════════════════════════════
function InsuranceTab({ data }) {
  const workDate = window.DEPOSIT_WORKING_DATE;
  const recs = window.memberInsurancePolicies(data.member.code);
  if (!recs.length) {
    return <div className="empty-state">ยังไม่มีข้อมูลการทำประกันภัยของสมาชิกรายนี้</div>;
  }
  const totalCoverage = recs.reduce((s, r) => s + Number(r.coverage), 0);
  const totalPremium = recs.reduce((s, r) => s + Number(r.premium), 0);
  const activeCount = recs.filter(r => window.insRenewState(r, workDate).key !== 'overdue').length;

  return (
    <div>
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1180 }}>
            <thead>
              <tr>
                <th>ประเภท / บริษัท</th>
                <th>เลขกรมธรรม์</th>
                <th>สัญญาเงินกู้อ้างอิง</th>
                <th className="num">ทุนประกัน</th>
                <th className="num">เบี้ย / ปี</th>
                <th>ระยะคุ้มครอง</th>
                <th>ผู้รับผลประโยชน์</th>
                <th>ช่องทางชำระ</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {recs.map(r => {
                const st = window.insRenewState(r, workDate);
                return (
                  <tr key={r.id}>
                    <td><div style={{ fontWeight: 500 }}>{r.insuranceType}</div><div className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.company}</div></td>
                    <td className="mono">{r.newPolicyNo || r.oldPolicyNo || '—'}
                      {r.newPolicyNo && r.oldPolicyNo ? <div className="muted" style={{ fontSize: 'var(--font-xs)' }}>เดิม {r.oldPolicyNo}</div> : null}
                    </td>
                    <td><div className="mono">{r.loanContractNo}</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
                        <span className="muted" style={{ fontSize: 'var(--font-xs)' }}>{r.loanType}</span>
                        <span className={"chip" + (r.contractNature === 'ปรับโครงสร้างหนี้' ? ' warning' : '')} style={{ height: 17, fontSize: 9, padding: '0 5px' }}>{r.contractNature}</span>
                      </div>
                    </td>
                    <td className="num">{irMoney(r.coverage)}</td>
                    <td className="num">{irMoney(r.premium)}</td>
                    <td><div>{irDate(r.startDate)}</div><div className="muted" style={{ fontSize: 'var(--font-xs)' }}>ถึง {irDate(r.endDate)}</div></td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 200 }}>{r.beneficiary || '—'}</td>
                    <td>{window.insPayLabel(r.payMethod)}</td>
                    <td className="center"><span className={"pill " + st.tone}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="ie-foot-note" style={{ marginTop: 10 }}>
        <Icon name="info" size={13} />
        <span className="muted">ดูและจัดการการต่อ/ทำประกันได้ที่เมนู สินเชื่อ › การทำงาน › จัดการประกันภัยสมาชิก</span>
      </div>
    </div>
  );
}

Object.assign(window, { InsuranceRenewalPage, InsuranceTab });
