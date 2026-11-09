// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › งานประจำวัน — ผ่านเช็ค / คืนเช็ค
//  ดึงเช็คที่นำส่งตามวันที่ → เลือกเช็ค → บันทึกผ่านเช็ค หรือ คืนเช็ค (พร้อมเหตุผล)
//  เลือกแถวเพื่อดูรายละเอียดบัญชี/ธนาคารด้านล่าง (ฟิลด์ว่างก่อนเลือก)
// ════════════════════════════════════════════════════════════════════

const chqToIso = (s) => { const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? (Number(m[3]) - 543) + '-' + m[2] + '-' + m[1] : ''; };
const chqToTh = (iso) => { const [y, m, d] = String(iso || '').split('-'); return y ? d + '/' + m + '/' + (Number(y) + 543) : ''; };
const DEP_CHQ_CFG = {
  clear: { title: 'ผ่านเช็ค', desc: 'นำเช็คที่เรียกเก็บได้ผ่านรายการเข้าระบบเงินฝาก', sumLabel: 'รวมผ่านเช็ค', action: 'บันทึกผ่านเช็ค', dateCol: 'วันที่ผ่าน', doneStatus: 'ผ่านเช็คแล้ว' },
  ret:   { title: 'คืนเช็ค', desc: 'บันทึกรายการขอคืนเช็คที่เรียกเก็บไม่ได้ พร้อมเหตุผลการคืน', sumLabel: 'รวมคืนเช็ค', action: 'บันทึกคืนเช็ค', dateCol: 'วันที่คืนเช็ค', doneStatus: 'คืนเช็คแล้ว' },
};

function DepChqField({ label, value, mono, span }) {
  return (
    <div className="dat-field" style={span === 2 ? { gridColumn: 'span 2' } : undefined}>
      <label>{label}</label>
      <input className={'cfg-input' + (mono ? ' mono' : '')} readOnly value={value || ''} placeholder="—" />
    </div>
  );
}

function DepChequeOpsPage({ variant = 'clear', onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const cfg = DEP_CHQ_CFG[variant];
  const isRet = variant === 'ret';

  const [date, setDate] = useState('25/02/2569');
  const [status, setStatus] = useState('รอเรียกเก็บ');
  const [rows, setRows] = useState(null);
  const [sel, setSel] = useState([]);
  const [cur, setCur] = useState(null);
  const [actDate, setActDate] = useState('25/02/2569');
  const [reason, setReason] = useState(window.DEP_CHQ_RETURN_REASONS[0]);

  const pull = () => {
    setRows(window.DEP_DAILY_CHEQUES.map((c, i) => ({ ...c, seq: i + 1, done: false, actDate: '', reason: '' })));
    setSel([]); setCur(null);
    onToast && onToast(`ดึงข้อมูลเช็คนำส่งวันที่ ${date} — ${window.DEP_DAILY_CHEQUES.length} รายการ`);
  };

  const list = rows || [];
  const toggle = (n) => setSel(s => s.includes(n) ? s.filter(x => x !== n) : [...s, n]);
  const picked = list.filter(r => sel.includes(r.seq) && !r.done);
  const total = list.reduce((s, r) => s + r.amount, 0);
  const doneTotal = list.filter(r => r.done).reduce((s, r) => s + r.amount, 0);

  const commit = () => {
    const ids = picked.map(r => r.seq);
    setRows(list.map(r => ids.includes(r.seq)
      ? { ...r, done: true, status: cfg.doneStatus, actDate, reason: isRet ? reason : '' } : r));
    setSel([]);
    audit.log({
      action: 'update', module: 'เงินฝาก — ' + cfg.title, target: date,
      summary: `${cfg.action} ${ids.length} ฉบับ รวม ${fmt.money(picked.reduce((s, r) => s + r.amount, 0), 2)} บาท${isRet ? ' · เหตุผล: ' + reason : ''}`,
      changes: picked.map(r => ({ field: 'เช็คเลขที่ ' + r.chqNo, before: 'รอเรียกเก็บ', after: cfg.doneStatus })),
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: cfg.action + ' ' + ids.length + ' ฉบับเรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label={cfg.title}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cfg.title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{cfg.desc}</div>
        </div>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <DepSecHead icon="filter" title="แสดงรายละเอียดข้อมูลวันที่" sub="ระบุวันที่นำส่งเช็คเพื่อดึงรายการ" />
        <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="dat-grid" style={{ padding: 0, flex: 1, minWidth: 300, gridTemplateColumns: isRet ? '200px 200px' : '200px', justifyContent: 'start' }}>
            <DatFieldLite label="วันที่">
              <window.ThaiDateField value={chqToIso(date)} onChange={(v) => { setDate(chqToTh(v)); setRows(null); }} />
            </DatFieldLite>
            {isRet && (
              <DatFieldLite label="สถานะ">
                <select className="cfg-input" value={status} onChange={(e) => { setStatus(e.target.value); setRows(null); }}>
                  <option>รอเรียกเก็บ</option><option>คืนเช็คแล้ว</option><option>ทั้งหมด</option>
                </select>
              </DatFieldLite>
            )}
          </div>
          <button className="btn" onClick={pull}><Icon name="download" /> ดึงข้อมูล</button>
        </div>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <DepSecHead bar icon="receipt" title="รายการเช็ค" sub="เช็คที่นำส่งตามวันที่ที่เลือก" meta={list.length ? list.length + ' ฉบับ' : null} />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl chq-ops-tbl" style={{ minWidth: isRet ? 1120 : 1000 }}>
            <thead><tr>
              <th className="center" style={{ width: 32 }} />
              <th className="center" style={{ width: 44 }}>ลำดับ</th>
              <th style={{ width: 84 }}>เลขที่เช็ค</th>
              <th style={{ minWidth: 180 }}>บัญชี</th>
              <th style={{ minWidth: 130 }}>ธนาคาร / สาขา</th>
              <th className="center" style={{ width: 96 }}>วันที่นำส่ง</th>
              <th className="center" style={{ width: 96 }}>วันที่หน้าเช็ค</th>
              <th className="right" style={{ width: 110 }}>จำนวนเงิน</th>
              <th className="center" style={{ width: 96 }}>{isRet ? 'สถานะคืน' : 'สถานะเช็ค'}</th>
              <th className="center" style={{ width: 96 }}>{cfg.dateCol}</th>
              {isRet && <th>เหตุผล</th>}
            </tr></thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={isRet ? 11 : 10} className="center muted" style={{ padding: '28px 12px' }}>
                  กด “ดึงข้อมูล” เพื่อแสดงรายการเช็คของวันที่ที่ระบุ
                </td></tr>
              ) : list.map(r => (
                <tr key={r.seq}>
                  <td className="center"><input type="checkbox" checked={sel.includes(r.seq)} disabled={r.done} onChange={() => toggle(r.seq)} /></td>
                  <td className="center mono">{r.seq}</td>
                  <td className="mono">{r.chqNo}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div><span className="mono">{r.accNo}</span> · {r.accName}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{[r.depType, r.depGroup].filter(Boolean).join(' · ')}</div>
                  </td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div>{r.bank || '—'}</div>
                    {r.branch && <div className="muted" style={{ fontSize: 11.5 }}>{r.branch}</div>}
                  </td>
                  <td className="center mono">{r.sendDate}</td>
                  <td className="center mono">{r.faceDate}</td>
                  <td className="right mono">{fmt.money(r.amount, 2)}</td>
                  <td className="center"><span className={'pill ' + (r.done ? (isRet ? 'bad' : 'ok') : 'warn')}>{r.status}</span></td>
                  <td className="center mono">{r.actDate || '—'}</td>
                  {isRet && <td>{r.reason || <span className="muted">—</span>}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td colSpan="7" className="right"><b>รวม</b></td>
              <td className="right mono"><b>{fmt.money(total, 2)}</b></td>
              <td className="right" colSpan={isRet ? 2 : 1}><b>{cfg.sumLabel}</b></td>
              <td className="right mono" style={{ color: isRet ? 'var(--danger-600, #cf1322)' : 'var(--primary-700)' }}><b>{fmt.money(doneTotal, 2)}</b></td>
            </tr></tfoot>
          </table>
        </div></div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: isRet ? '200px minmax(0,1fr) auto' : '200px max-content', justifyContent: isRet ? 'start' : 'space-between', gap: 12, alignItems: 'end', borderTop: '1px solid var(--border)' }}>
          <div className="dat-field" style={{ minWidth: 0 }}>
            <label className="dat-label">{cfg.dateCol}</label>
            <div style={list.length === 0 ? { opacity: .55, pointerEvents: 'none' } : undefined}>
              <window.ThaiDateField value={chqToIso(actDate)} onChange={(v) => setActDate(chqToTh(v))} />
            </div>
          </div>
          {isRet && (
            <div className="dat-field" style={{ minWidth: 0 }}>
              <label className="dat-label">เหตุผลการคืนเช็ค</label>
              <select className="cfg-input" value={reason} disabled={list.length === 0} onChange={(e) => setReason(e.target.value)}>
                {window.DEP_CHQ_RETURN_REASONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          )}
          <button className="btn primary" style={{ whiteSpace: 'nowrap' }} disabled={picked.length === 0} onClick={commit}>
            <Icon name="check" /> {cfg.action}{picked.length ? ` (${picked.length})` : ''}
          </button>
        </div>
      </div>

    </div>
  );
}

Object.assign(window, { DepChequeOpsPage });
