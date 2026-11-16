// ════════════════════════════════════════════════════════════════════
//  อนุมัติใบสำคัญจ่าย (Payment Voucher Approval)
//  - เรียกดูรายการที่สร้างจากเมนู "ใบสำคัญจ่าย"
//  - แก้ไขข้อมูลในเอกสารก่อนอนุมัติ (ใช้ VoucherForm ร่วมกัน)
//  - อนุมัติ หรือ Reject กลับไปให้ผู้จัดทำแก้ไข (พร้อมเหตุผล)
// ════════════════════════════════════════════════════════════════════
const { useState: vaUseState, useContext: vaUseContext } = React;

// สถานะที่รออนุมัติ (โผล่ในคิวของหน้านี้)
const VA_PENDING = ['pending_check', 'pending_appr'];

function vaSave(list) { try { localStorage.setItem('vouchers', JSON.stringify(list)); } catch (e) {} }
function vaGroupsLoad() { try { const s = localStorage.getItem('voucher_groups'); if (s) return JSON.parse(s); } catch (e) {} return (window.VCH_GROUP_SEED || []); }

// ─── โมดัลระบุเหตุผลตีกลับ ────────────────────────────────────────────
function VaRejectModal({ voucher, onConfirm, onClose }) {
  const [reason, setReason] = vaUseState('');
  const preset = ['เอกสารแนบไม่ครบถ้วน', 'จำนวนเงิน/ยอดภาษีไม่ถูกต้อง', 'หมวดงบประมาณ/ผังบัญชีไม่ถูกต้อง', 'ข้อมูลผู้รับเงินไม่ถูกต้อง'];
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div><div className="modal-title">ตีกลับใบสำคัญจ่าย</div><div className="modal-sub muted">{voucher.id} — ส่งกลับให้ผู้จัดทำแก้ไข</div></div>
          <button className="modal-x" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="cfg-field">
            <label>เหตุผลที่ตีกลับ <span className="req">*</span></label>
            <div className="va-reason-presets">
              {preset.map(p => <button key={p} type="button" className={"chip" + (reason === p ? ' primary' : '')} onClick={() => setReason(p)}>{p}</button>)}
            </div>
            <textarea className="cfg-input" rows="3" style={{ marginTop: 8, resize: 'vertical' }} value={reason}
                      placeholder="ระบุเหตุผล/สิ่งที่ต้องแก้ไข เพื่อแจ้งผู้จัดทำ" onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn danger" disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}><Icon name="close" /> ยืนยันตีกลับ</button>
        </div>
      </div>
    </div>
  );
}

function VoucherApprovalWorkspace({ onToast }) {
  const audit = vaUseContext(window.AuditContext || React.createContext({ log: () => {} }));
  const WhtCertModal = window.WhtCertModal;
  const VoucherForm = window.VoucherForm;
  const [vouchers, setVouchers] = vaUseState(() => window.vchLoadVouchers());
  const [structure] = vaUseState(() => (window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])));
  const [groups] = vaUseState(vaGroupsLoad);
  const [mode, setMode] = vaUseState('list');   // list | edit
  const [editDoc, setEditDoc] = vaUseState(null);
  const [q, setQ] = vaUseState('');
  const [statusFilter, setStatusFilter] = vaUseState('pending');
  const [rejectFor, setRejectFor] = vaUseState(null);
  const [certVoucher, setCertVoucher] = vaUseState(null);

  const persist = (next) => { setVouchers(next); vaSave(next); };
  const patch = (id, changes, extra) => {
    const next = vouchers.map(v => v.id === id ? { ...v, ...changes } : v);
    persist(next);
    return next;
  };

  (window.useBreadcrumb || (() => {}))(
    mode === 'edit'
      ? [{ label: 'อนุมัติใบสำคัญจ่าย', onClick: () => { setMode('list'); setEditDoc(null); } }, { label: (editDoc && editDoc.id) || 'ตรวจสอบเอกสาร', current: true }]
      : [{ label: 'อนุมัติใบสำคัญจ่าย', current: true }],
    [mode, editDoc && editDoc.id]
  );

  const openDoc = (v) => { setEditDoc(JSON.parse(JSON.stringify(v))); setMode('edit'); };

  const handleSave = (doc) => {
    const clean = { ...doc }; delete clean._new;
    persist(vouchers.map(v => v.id === clean.id ? clean : v));
    onToast && onToast('บันทึกการแก้ไขเอกสารแล้ว — ยังไม่อนุมัติ');
    audit.log && audit.log({ action: 'update', module: 'การเงิน — อนุมัติใบสำคัญจ่าย', target: clean.id, summary: `แก้ไขใบสำคัญจ่าย ${clean.id} ก่อนอนุมัติ` });
    setMode('list'); setEditDoc(null);
  };

  const approve = (v) => {
    patch(v.id, { status: 'approved', approvedBy: 'นายประสิทธิ์ คงทอง', approvedAt: new Date().toISOString().slice(0, 10), rejectReason: '' });
    onToast && onToast(`อนุมัติใบสำคัญจ่าย ${v.id} แล้ว`);
    audit.log && audit.log({ action: 'approve', module: 'การเงิน — อนุมัติใบสำคัญจ่าย', target: v.id, summary: `อนุมัติใบสำคัญจ่าย ${v.id}` });
    if (mode === 'edit') { setMode('list'); setEditDoc(null); }
  };

  const doReject = (reason) => {
    const v = rejectFor;
    patch(v.id, { status: 'draft', rejectReason: reason, rejectedBy: 'นายประสิทธิ์ คงทอง', rejectedAt: new Date().toISOString().slice(0, 10) });
    onToast && onToast(`ตีกลับใบสำคัญจ่าย ${v.id} ให้ผู้จัดทำแก้ไข`);
    audit.log && audit.log({ action: 'reject', module: 'การเงิน — อนุมัติใบสำคัญจ่าย', target: v.id, summary: `ตีกลับใบสำคัญจ่าย ${v.id}: ${reason}` });
    setRejectFor(null);
    if (mode === 'edit') { setMode('list'); setEditDoc(null); }
  };

  // ─── โหมดแก้ไข/ตรวจสอบ ───────────────────────────────────────────
  if (mode === 'edit' && editDoc) {
    return (
      <>
        <VoucherForm voucher={editDoc} structure={structure} vouchers={vouchers} groups={groups}
                     onSave={handleSave} onCancel={() => { setMode('list'); setEditDoc(null); }}
                     onCerts={(d) => setCertVoucher(d)} onToast={onToast}
                     approvalActions={
                       <>
                         <button className="btn danger sm" onClick={() => setRejectFor(editDoc)}><Icon name="close" /> ตีกลับ</button>
                         <button className="btn primary sm" onClick={() => approve(editDoc)}><Icon name="check" /> อนุมัติ</button>
                       </>
                     } />
        {rejectFor && <VaRejectModal voucher={rejectFor} onConfirm={doReject} onClose={() => setRejectFor(null)} />}
        {certVoucher && <WhtCertModal voucher={certVoucher} onClose={() => setCertVoucher(null)} onToast={onToast} />}
      </>
    );
  }

  // ─── รายการรออนุมัติ ─────────────────────────────────────────────
  const filtered = vouchers.filter(v => {
    if (statusFilter === 'pending') { if (!VA_PENDING.includes(v.status)) return false; }
    else if (statusFilter !== 'all') { if (v.status !== statusFilter) return false; }
    if (q.trim()) {
      const n = q.toLowerCase();
      const inPayee = (v.payees || []).some(p => (p.name || '').toLowerCase().includes(n) || (p.code || '').toLowerCase().includes(n));
      return v.id.toLowerCase().includes(n) || inPayee;
    }
    return true;
  });
  const pendingCount = vouchers.filter(v => VA_PENDING.includes(v.status)).length;

  return (
    <div data-screen-label="หน้าอนุมัติใบสำคัญจ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติใบสำคัญจ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ตรวจสอบใบสำคัญจ่ายที่สร้างเข้ามา — แก้ไขก่อนอนุมัติ หรือตีกลับให้ผู้จัดทำเมื่อเอกสารผิดพลาด
          </div>
        </div>
        <span className="spacer" />
        {pendingCount > 0 && <span className="pill warn">รออนุมัติ {pendingCount} ใบ</span>}
      </div>

      <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="toolbar" style={{ flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 300px' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขที่, ผู้รับเงิน…" />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending">เฉพาะที่รออนุมัติ</option>
            <option value="all">ทุกสถานะ</option>
            {window.VCH_STATUS_ORDER.map(k => <option key={k} value={k}>{window.VCH_STATUS[k].l}</option>)}
          </select>
        </div>

        <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>เลขที่</th>
                <th style={{ width: 105 }}>วันที่เอกสาร</th>
                <th style={{ minWidth: 200 }}>ผู้รับเงิน</th>
                <th style={{ minWidth: 150 }}>ผู้จัดทำ</th>
                <th className="right" style={{ width: 120 }}>ยอดสุทธิ (บาท)</th>
                <th className="center" style={{ width: 150 }}>สถานะ</th>
                <th className="center" style={{ width: 210 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="center muted" style={{ padding: '32px 12px' }}>ไม่พบใบสำคัญจ่ายที่ตรงกับเงื่อนไข</td></tr>
              )}
              {filtered.map(v => {
                const st = window.VCH_STATUS[v.status] || window.VCH_STATUS.draft;
                const net = window.vchTotals(v.lines).net;
                const plist = v.payees || [];
                const first = plist[0] ? plist[0].name : '—';
                const canAct = VA_PENDING.includes(v.status);
                return (
                  <tr key={v.id} className="clickable" onClick={() => openDoc(v)}>
                    <td className="mono">{v.id}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{fmt.date(v.docDate)}</td>
                    <td>
                      <div className="lt-row-name">{first}{plist.length > 1 ? <span className="muted"> +{plist.length - 1} ราย</span> : ''}</div>
                      {v.rejectReason && v.status === 'draft' && <div className="lt-row-note" style={{ color: 'var(--danger)' }}>ตีกลับ: {v.rejectReason}</div>}
                    </td>
                    <td><div className="lt-row-note">{v.createdBy || '—'}</div></td>
                    <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(net, 2)}</td>
                    <td className="center"><span className={"pill " + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button className="btn sm" onClick={() => openDoc(v)}><Icon name="edit" size={12} /> ตรวจ/แก้ไข</button>
                        <button className="btn sm danger" disabled={!canAct} onClick={() => setRejectFor(v)} title={canAct ? 'ตีกลับให้ผู้จัดทำ' : 'ทำได้เฉพาะเอกสารที่รออนุมัติ'}><Icon name="close" size={12} /></button>
                        <button className="btn sm primary" disabled={!canAct} onClick={() => approve(v)} title={canAct ? 'อนุมัติ' : 'ทำได้เฉพาะเอกสารที่รออนุมัติ'}><Icon name="check" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> รายการที่แสดงดึงมาจากเมนู “ใบสำคัญจ่าย” — คลิกที่แถวเพื่อเปิดตรวจสอบและแก้ไขก่อนอนุมัติ · เอกสารที่ตีกลับจะกลับไปเป็นสถานะ “ร่าง” พร้อมเหตุผลให้ผู้จัดทำแก้ไข
      </div>

      {rejectFor && <VaRejectModal voucher={rejectFor} onConfirm={doReject} onClose={() => setRejectFor(null)} />}
      {certVoucher && <WhtCertModal voucher={certVoucher} onClose={() => setCertVoucher(null)} onToast={onToast} />}
    </div>
  );
}

Object.assign(window, { VoucherApprovalWorkspace });
