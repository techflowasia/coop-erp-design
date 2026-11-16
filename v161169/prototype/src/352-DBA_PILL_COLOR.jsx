// ════════════════════════════════════════════════════════════════════
//  อนุมัติใบคำขอ — ศูนย์รวมใบคำขอรออนุมัติของระบบทะเบียนและติดตามหนี้
//  ① เปลี่ยนแปลงยอดชำระหนี้ ② บอกเลิกสัญญา ③ พักชำระหนี้
//  ④ ปรับโครงสร้างหนี้       ⑤ ดำเนินคดี
// ════════════════════════════════════════════════════════════════════

const DBA_PILL_COLOR = {
  ok: 'var(--success)', warn: 'var(--warning)', bad: 'var(--danger)',
  info: 'var(--info)', neutral: 'var(--text-faint, #9aa3ab)', primary: 'var(--primary)',
};

// ─── แผงรายละเอียด + อนุมัติ (drawer) ───────────────────────────────
function DbaDetailDrawer({ rec, onClose, onDecide }) {
  const [remark, setRemark] = useState(rec.remark || '');
  const [err, setErr] = useState('');
  const t = window.dbaType(rec.type);
  const st = window.dbaStatus(rec.status);
  const pending = rec.status === 'pending';

  const decide = (status) => {
    if (status === 'rejected' && !remark.trim()) { setErr('กรุณาระบุเหตุผลการไม่อนุมัติ'); return; }
    onDecide(rec, status, remark.trim());
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer dba-drawer">
        <div className="drawer-head">
          <div className="dba-dico" style={{ background: 'color-mix(in srgb, ' + (DBA_PILL_COLOR[st.pill]) + ' 12%, transparent)' }}>
            <Icon name={t.icon} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0 }}>{t.l}</h2>
            <div className="muted mono" style={{ fontSize: 11 }}>{rec.id} · เอกสาร {rec.docNo}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="drawer-body">
          {/* การ์ดหัวเรื่อง */}
          <div className="dba-headcard">
            <div className="dba-hc-top">
              <span className="row-avatar lg">{rec.memberName.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="dba-hc-name">{rec.memberName}</div>
                <div className="muted mono" style={{ fontSize: 11.5 }}>{rec.memberCode} · {rec.dept}</div>
              </div>
              <span className={'pill ' + st.pill}>{st.l}</span>
            </div>
            <div className="dba-hc-facts">
              <div className="dba-fact"><span className="dba-fact-k">สัญญา</span><span className="dba-fact-v mono">{rec.contractNo}</span></div>
              <div className="dba-fact"><span className="dba-fact-k">ประเภทเงินกู้</span><span className="dba-fact-v">{rec.loanType}</span></div>
              <div className="dba-fact"><span className="dba-fact-k">มูลค่าที่เกี่ยวข้อง</span><span className="dba-fact-v mono">{window.fmt.money(rec.amount, 2)}</span></div>
            </div>
          </div>

          {rec.priority === 'urgent' && pending && (
            <div className="dn-status-alert bad" style={{ marginTop: 12 }}>
              <Icon name="info" size={15} /><span>คำขอเร่งด่วน — โปรดพิจารณาโดยเร็ว</span>
            </div>
          )}

          {/* คำขอ */}
          <div className="dba-sec">
            <div className="dba-sec-head">รายละเอียดคำขอ</div>
            <p className="dba-summary">{rec.summary}</p>
            <div className="dba-kv-list">
              {rec.fields.map((f, i) => (
                <div className="dba-kv" key={i}>
                  <span className="dba-kv-k">{f.k}</span>
                  <span className={'dba-kv-v' + (f.hl ? ' hl' : '') + (f.warn ? ' warn' : '')}>{f.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ข้อมูลการยื่น */}
          <div className="dba-sec">
            <div className="dba-sec-head">ข้อมูลการยื่นคำขอ</div>
            <div className="dba-kv-list">
              <div className="dba-kv"><span className="dba-kv-k">ผู้จัดทำ</span><span className="dba-kv-v">{rec.requestedBy}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">วันที่ยื่น</span><span className="dba-kv-v mono">{window.fmt.date(rec.requestDate)}</span></div>
              <div className="dba-kv"><span className="dba-kv-k">อ้างอิงมติที่ประชุม</span><span className="dba-kv-v">{rec.meetingRef || '—'}</span></div>
            </div>
          </div>

          {/* ผลการพิจารณา (ถ้าตัดสินแล้ว) */}
          {!pending && (
            <div className={'dba-decision ' + rec.status}>
              <div className="dba-decision-head">
                <Icon name={rec.status === 'approved' ? 'check' : 'close'} size={14} />
                <span>{st.l}</span>
                <span className="spacer" />
                <span className="muted" style={{ fontSize: 11 }}>{rec.decidedBy} · {window.fmt.date(rec.decidedDate)}</span>
              </div>
              {rec.remark && <div className="dba-decision-note">{rec.remark}</div>}
            </div>
          )}

          {/* แบบฟอร์มพิจารณา */}
          {pending && (
            <div className="dba-sec">
              <div className="dba-sec-head">ความเห็น / มติการพิจารณา</div>
              <textarea className="cfg-input" rows={3} value={remark}
                        onChange={(e) => { setRemark(e.target.value); setErr(''); }}
                        placeholder="ระบุความเห็น เงื่อนไข หรือเหตุผลการพิจารณา (จำเป็นกรณีไม่อนุมัติ)" />
              {err && <div className="sr-hint" style={{ color: 'var(--danger)', marginTop: 6 }}><Icon name="info" size={11} /> {err}</div>}
            </div>
          )}
        </div>

        {pending && (
          <div className="dba-drawer-foot">
            <button className="btn danger" onClick={() => decide('rejected')}><Icon name="close" size={13} /> ไม่อนุมัติ</button>
            <button className="btn primary" onClick={() => decide('approved')}><Icon name="check" size={13} /> อนุมัติคำขอ</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Popup ตรวจสอบรายการก่อนพิจารณา ───────────────────────────────
// ─── Popup ตรวจสอบ (เลิกใช้ — ย้ายไป components-dba-detail.jsx) ───
function DbaCheckModal_legacyUnused({ rec, onClose, onProceed }) {
  const st = window.dbaStatus(rec.status);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 540 }}>
        <div className="modal-head">
          <div className="dba-dico" style={{ width: 38, height: 38, borderRadius: '50%', background: 'color-mix(in srgb, ' + (DBA_PILL_COLOR[st.pill]) + ' 12%, transparent)', color: DBA_PILL_COLOR[st.pill] }}>
            <Icon name={t.icon} size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>ตรวจสอบรายการคำขอ</h2>
            <div className="muted mono" style={{ fontSize: 11, marginTop: 1 }}>{rec.id} · เอกสาร {rec.docNo}</div>
          </div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          {rec.priority === 'urgent' && (
            <div className="ct-warnbox" style={{ marginBottom: 12 }}>
              <Icon name="info" size={14} /><span>คำขอเร่งด่วน — โปรดตรวจสอบรายการให้ครบถ้วนก่อนพิจารณา</span>
            </div>
          )}

          <div className="dba-kv-list" style={{ marginBottom: 14 }}>
            <div className="dba-kv"><span className="dba-kv-k">สมาชิก</span><span className="dba-kv-v">{rec.memberName} · <span className="mono">{rec.memberCode}</span></span></div>
            <div className="dba-kv"><span className="dba-kv-k">ประเภทคำขอ</span><span className="dba-kv-v">{t.l}</span></div>
            <div className="dba-kv"><span className="dba-kv-k">สัญญา</span><span className="dba-kv-v mono">{rec.contractNo}</span></div>
            <div className="dba-kv"><span className="dba-kv-k">มูลค่าที่เกี่ยวข้อง</span><span className="dba-kv-v mono hl">{window.fmt.money(rec.amount, 2)}</span></div>
          </div>

          <div className="dba-sec-head" style={{ marginBottom: 8 }}>รายการที่ต้องตรวจสอบ</div>
          <div className="ct-confirm-list">
            {rec.fields.map((f, i) => (
              <div className="ct-confirm-row" key={i}>
                <span className="muted" style={{ fontSize: 12.5 }}>{f.k}</span>
                <span className={'mono' + (f.warn ? '' : '')} style={{ fontSize: 12.5, fontWeight: f.hl ? 600 : 400, color: f.warn ? 'var(--danger)' : 'var(--text)' }}>{f.v}</span>
              </div>
            ))}
            <div className="ct-confirm-total">
              <span>รายละเอียดคำขอ</span>
              <span style={{ fontWeight: 400, textAlign: 'right', maxWidth: 320 }}>{rec.summary}</span>
            </div>
          </div>
        </div>
        <div className="dba-drawer-foot" style={{ position: 'static' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" onClick={() => onProceed(rec)}><Icon name="check" size={13} /> ตรวจสอบเรียบร้อย · พิจารณา</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — ทะเบียนใบคำขอรออนุมัติ
// ════════════════════════════════════════════════════════════════════
function DebtApprovalPage({ onToast, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.dbaLoad);
  const [typeF, setTypeF] = useState('all');
  const [statusF, setStatusF] = useState('pending');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const [check, setCheck] = useState(null);

  const persist = (next) => { setList(next); window.dbaSaveLS(next); };

  const rows = useMemo(() => {
    let r = list;
    if (typeF !== 'all') r = r.filter(x => x.type === typeF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => x.memberCode.toLowerCase().includes(n) || x.memberName.toLowerCase().includes(n) ||
                        x.id.toLowerCase().includes(n) || x.docNo.toLowerCase().includes(n) ||
                        (x.contractNo || '').toLowerCase().includes(n));
    }
    const order = { urgent: 0, normal: 1 };
    return [...r].sort((a, b) =>
      (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1) ||
      (order[a.priority] || 1) - (order[b.priority] || 1) ||
      b.requestDate.localeCompare(a.requestDate));
  }, [list, typeF, statusF, q]);

  const pending = list.filter(x => x.status === 'pending');
  const urgentCnt = pending.filter(x => x.priority === 'urgent').length;
  const pendingAmt = pending.reduce((s, x) => s + Number(x.amount || 0), 0);
  const typeCnt = new Set(pending.map(x => x.type)).size;

  const decide = (rec, status, remark) => {
    const updated = { ...rec, status, remark, decidedBy: window.DBA_APPROVER, decidedDate: new Date().toISOString().slice(0, 10) };
    persist(list.map(r => r.id === rec.id ? updated : r));
    setOpen(null);
    const t = window.dbaType(rec.type);
    audit.log && audit.log({
      action: status === 'approved' ? 'approve' : 'reject',
      module: 'ทะเบียนและติดตามหนี้ — อนุมัติใบคำขอ',
      target: `${rec.memberCode} · ${rec.memberName}`,
      summary: `${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}${t.l} ${rec.id} · เอกสาร ${rec.docNo}`,
      changes: [
        { field: 'ผลการพิจารณา', before: 'รออนุมัติ', after: status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ' },
        ...(remark ? [{ field: 'ความเห็น', before: '—', after: remark }] : []),
      ],
    });
    onToast && onToast(`${status === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}คำขอ ${rec.id} แล้ว`);
  };

  const quickApprove = (e, rec) => { e.stopPropagation(); decide(rec, 'approved', ''); };

  const typeCounts = window.DBA_TYPES.map(t => ({ ...t, n: pending.filter(x => x.type === t.v).length }));

  return (
    <div data-screen-label="หน้าอนุมัติใบคำขอ (ทะเบียนและติดตามหนี้)">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อนุมัติใบคำขอ</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ศูนย์รวมใบคำขอรออนุมัติของระบบทะเบียนและติดตามหนี้ — เปลี่ยนแปลงยอดชำระ · บอกเลิกสัญญา · พักชำระหนี้ · ปรับโครงสร้างหนี้ · ลาออกจากสมาชิก · ดำเนินคดี
          </div>
        </div>
      </div>

      <div className="search-stats" style={{ marginBottom: 14, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card accent">
          <div className="stat-label">รออนุมัติทั้งหมด</div>
          <div className="stat-value">{window.fmt.int(pending.length)}</div>
          <div className="stat-sub">รายการ</div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">เร่งด่วน</div>
          <div className="stat-value">{window.fmt.int(urgentCnt)}</div>
          <div className="stat-sub" style={{ color: 'var(--danger)' }}>urgent</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ประเภทคำขอ</div>
          <div className="stat-value">{window.fmt.int(typeCnt)}</div>
          <div className="stat-sub">จาก {window.DBA_TYPES.length} ประเภท</div>
        </div>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่คำขอ / เอกสาร / สมาชิก / สัญญา</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา…" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทคำขอ</span>
            <select className="filter-select" value={typeF} onChange={(e) => setTypeF(e.target.value)} style={{ width: 220 }}>
              <option value="all">ทั้งหมด ({pending.length})</option>
              {typeCounts.map(t => (
                <option key={t.v} value={t.v}>{t.l}{t.n > 0 ? ` (${t.n})` : ''}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <select className="filter-select" value={statusF} onChange={(e) => setStatusF(e.target.value)} style={{ width: 150 }}>
              <option value="all">ทุกสถานะ</option>
              {window.DBA_STATUS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่คำขอ</th>
                <th>ประเภท</th>
                <th>สมาชิก / สัญญา</th>
                <th>รายละเอียดคำขอ</th>
                <th className="num">มูลค่า (บาท)</th>
                <th className="center">สถานะ</th>
                <th className="center" style={{ width: 168 }}>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">
                  <div style={{ marginBottom: 4 }}><Icon name="check" size={24} /></div>
                  ไม่มีใบคำขอที่ตรงกับเงื่อนไข
                </td></tr>
              ) : rows.map(r => {
                const t = window.dbaType(r.type);
                const st = window.dbaStatus(r.status);
                const isPending = r.status === 'pending';
                return (
                  <tr key={r.id} className="clickable" onClick={() => setOpen(r)}>
                    <td>
                      <div className="mono">{r.id}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.docNo} · {window.fmt.date(r.requestDate)}</div>
                    </td>
                    <td>
                      <span className={'chip ' + t.chip}>{t.short}</span>
                      {r.priority === 'urgent' && isPending && <div style={{ marginTop: 3 }}><span className="chip danger" style={{ fontSize: 10 }}>เร่งด่วน</span></div>}
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>{r.memberName}</div>
                      <div className="muted mono" style={{ fontSize: 10.5 }}>{r.memberCode} · {r.contractNo}</div>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div className="dba-cell-summary">{r.summary}</div>
                    </td>
                    <td className="num mono">{window.fmt.money(r.amount, 0)}</td>
                    <td className="center"><span className={'pill ' + st.pill}>{st.l}</span></td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button className="btn sm" onClick={() => setCheck(r)}><Icon name="eye" size={12} /> ตรวจสอบ</button>
                          <button className="btn primary sm" onClick={(e) => quickApprove(e, r)}><Icon name="check" size={12} /> อนุมัติ</button>
                        </div>
                      ) : (
                        <button className="btn text sm" onClick={() => setOpen(r)}>ดูผลพิจารณา</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดและพิจารณาอนุมัติ · การอนุมัติจะส่งผลให้เมนูต้นทางนำคำขอไปปรับปรุงสัญญา
        </p>
      </div>

      {check && window.DbaCheckModal && React.createElement(window.DbaCheckModal, { rec: check, onClose: () => setCheck(null), onProceed: (r) => { setCheck(null); setOpen(r); } })}
      {open && <DbaDetailDrawer rec={open} onClose={() => setOpen(null)} onDecide={decide} />}
    </div>
  );
}

Object.assign(window, { DebtApprovalPage, DbaDetailDrawer });
