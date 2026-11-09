// ════════════════════════════════════════════════════════════════════
//  สำรองและกู้คืนข้อมูล — BackupRestorePage
//  ระบบงานผู้ดูแลระบบ › การทำงาน
//  ตั้งค่ากำหนดการสำรองอัตโนมัติ · ประวัติการสำรอง/กู้คืน · สั่งสำรอง/กู้คืน
// ════════════════════════════════════════════════════════════════════

const BK_USER = 'มนตรี ศรีสุข';

function bkLoadHist() {
  try { const s = localStorage.getItem('admin_backups'); if (s) return JSON.parse(s); } catch (e) {}
  return window.ADM_BACKUP_SEED.map(b => ({ ...b }));
}
function bkSaveHist(list) { try { localStorage.setItem('admin_backups', JSON.stringify(list)); } catch (e) {} }
const BK_SCHED_DEFAULT = { enabled: true, freq: 'daily', time: '02:00', keepDays: 30, scope: 'all', target: 'NAS-สำนักงานใหญ่ + Cloud สำรอง' };
function bkLoadSched() {
  try { const s = localStorage.getItem('admin_backup_sched'); if (s) return { ...BK_SCHED_DEFAULT, ...JSON.parse(s) }; } catch (e) {}
  return { ...BK_SCHED_DEFAULT };
}

function bkSizeLabel(mb) { return mb >= 1024 ? (mb / 1024).toFixed(2) + ' GB' : mb + ' MB'; }
function bkDuration(sec) { const m = Math.floor(sec / 60), s = sec % 60; return m ? `${m} นาที ${s} วิ` : `${s} วิ`; }

// ════════════════════════════════════════════════════════════════════
//  Main page
// ════════════════════════════════════════════════════════════════════
function BackupRestorePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [hist, setHist] = useState(bkLoadHist);
  const [sched, setSched] = useState(bkLoadSched);
  const [editSched, setEditSched] = useState(false);
  const [draft, setDraft] = useState(sched);
  const [running, setRunning] = useState(null);   // 'backup' | 'restore' | null
  const [progress, setProgress] = useState(0);
  const [confirm, setConfirm] = useState(null);    // record to restore
  const [scope, setScope] = useState('all');

  const persistHist = (next) => { setHist(next); bkSaveHist(next); };

  const last = hist.find(h => h.kind !== 'restore' && h.result === 'ok');
  const stats = useMemo(() => ({
    total: hist.length,
    okRate: hist.length ? Math.round(hist.filter(h => h.result === 'ok').length / hist.length * 100) : 0,
    lastSize: last ? bkSizeLabel(last.sizeMB) : '—',
    fails: hist.filter(h => h.result === 'fail').length,
  }), [hist, last]);

  const scopeLabel = (v) => v === 'all' ? 'ทุกระบบ' : (window.ADM_SYSTEMS.find(s => s.key === v)?.label || v);

  // จำลองการทำงานสำรอง/กู้คืน (Progress bar)
  const runJob = (kind, jobScope, restoreOf) => {
    setRunning(kind); setProgress(0);
    const total = kind === 'restore' ? (restoreOf?.sizeMB || 600) : (jobScope === 'all' ? 4220 : 900);
    let p = 0;
    const tick = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        p = 100; clearInterval(tick);
        setProgress(100);
        setTimeout(() => {
          const ts = new Date().toISOString().slice(0, 19);
          const stamp = ts.replace(/[-:T]/g, '').slice(0, 13);
          const rec = kind === 'restore' ? {
            id: 'RS-' + stamp.slice(0, 8) + '-' + stamp.slice(8, 12), ts, kind: 'restore',
            scope: scopeLabel(restoreOf ? (restoreOf.scope) : jobScope), sizeMB: restoreOf?.sizeMB || total,
            durationSec: Math.round(total / 8), result: 'ok', by: BK_USER,
            note: restoreOf ? `กู้คืนจากชุดสำรอง ${restoreOf.id}` : 'กู้คืนข้อมูล',
          } : {
            id: 'BK-' + stamp.slice(0, 8) + '-' + stamp.slice(8, 12), ts, kind: 'manual',
            scope: scopeLabel(jobScope), sizeMB: Math.round(total + Math.random() * 40),
            durationSec: Math.round(total / 10), result: 'ok', by: BK_USER, note: 'สำรองข้อมูลโดยผู้ดูแลระบบ',
          };
          persistHist([rec, ...hist]);
          audit.log({
            action: kind === 'restore' ? 'status' : 'create', module: 'ผู้ดูแลระบบ — สำรองและกู้คืนข้อมูล',
            target: rec.id, summary: kind === 'restore' ? `กู้คืนข้อมูล ${rec.scope} จากชุดสำรอง ${restoreOf?.id}` : `สำรองข้อมูล ${rec.scope} (${bkSizeLabel(rec.sizeMB)})`,
            changes: [{ field: 'ขอบเขต', before: '—', after: rec.scope }, { field: 'ขนาด', before: '—', after: bkSizeLabel(rec.sizeMB) }],
          });
          setRunning(null); setProgress(0); setConfirm(null);
          onToast && onToast(kind === 'restore' ? `กู้คืนข้อมูล ${rec.scope} เรียบร้อยแล้ว` : `สำรองข้อมูล ${rec.scope} เรียบร้อย (${bkSizeLabel(rec.sizeMB)})`);
        }, 350);
      } else setProgress(p);
    }, 220);
  };

  const saveSched = () => {
    setSched(draft); setEditSched(false);
    try { localStorage.setItem('admin_backup_sched', JSON.stringify(draft)); } catch (e) {}
    audit.log({ action: 'update', module: 'ผู้ดูแลระบบ — สำรองและกู้คืนข้อมูล', target: 'กำหนดการสำรองอัตโนมัติ',
      summary: `แก้ไขกำหนดการสำรองอัตโนมัติ (${draft.enabled ? 'เปิด' : 'ปิด'} · ${draft.freq === 'daily' ? 'รายวัน' : draft.freq === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'} ${draft.time})`,
      changes: [{ field: 'สถานะ', before: sched.enabled ? 'เปิด' : 'ปิด', after: draft.enabled ? 'เปิด' : 'ปิด' }, { field: 'เก็บย้อนหลัง', before: sched.keepDays + ' วัน', after: draft.keepDays + ' วัน' }] });
    onToast && onToast('บันทึกกำหนดการสำรองอัตโนมัติเรียบร้อยแล้ว');
  };

  return (
    <div data-screen-label="หน้าสำรองและกู้คืนข้อมูล">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>สำรองและกู้คืนข้อมูล</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ตั้งกำหนดการสำรองอัตโนมัติ ตรวจสอบประวัติ และสั่งสำรอง/กู้คืนข้อมูลทุกระบบ
          </div>
        </div>
        <span className="spacer" />
        <select className="filter-select" value={scope} onChange={(e) => setScope(e.target.value)} disabled={!!running} style={{ width: 180 }}>
          <option value="all">ทุกระบบ</option>
          {window.ADM_SYSTEMS.filter(s => s.key !== 'admin').map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button className="btn primary sm" onClick={() => runJob('backup', scope)} disabled={!!running}>
          <Icon name="download" /> สำรองข้อมูลเดี๋ยวนี้
        </button>
      </div>

      <div className="search-stats" style={{ marginBottom: 14 }}>
        <div className="stat-card"><div className="stat-label">สำรองล่าสุด</div><div className="stat-value" style={{ fontSize: 18 }}>{last ? fmt.date(last.ts) : '—'}</div><div className="stat-sub">{last ? fmt.time(last.ts).slice(0, 5) + ' น. · ' + stats.lastSize : 'ยังไม่มี'}</div></div>
        <div className="stat-card"><div className="stat-label">อัตราสำเร็จ</div><div className="stat-value">{stats.okRate}%</div><div className="stat-sub" style={{ color: 'var(--success)' }}>{stats.total} ครั้งที่บันทึก</div></div>
        <div className="stat-card warn"><div className="stat-label">ล้มเหลว</div><div className="stat-value">{fmt.int(stats.fails)}</div><div className="stat-sub" style={{ color: 'var(--warning)' }}>ครั้ง</div></div>
        <div className="stat-card accent"><div className="stat-label">เก็บย้อนหลัง</div><div className="stat-value">{sched.keepDays}</div><div className="stat-sub">วัน</div></div>
      </div>

      {/* Progress ขณะทำงาน */}
      {running && (
        <div className="search-card bk-progress">
          <div className="bk-prog-head">
            <span className="bk-prog-spin"><Icon name="refresh" size={16} /></span>
            <b>{running === 'restore' ? 'กำลังกู้คืนข้อมูล…' : 'กำลังสำรองข้อมูล…'}</b>
            <span className="spacer" />
            <span className="mono">{Math.round(progress)}%</span>
          </div>
          <div className="bk-prog-track"><div className="bk-prog-bar" style={{ width: progress + '%' }} /></div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>ห้ามปิดหน้าต่างระหว่างประมวลผล — ระบบจะบันทึกผลลงประวัติเมื่อเสร็จสิ้น</div>
        </div>
      )}

      <div className="rp-layout" style={{ gridTemplateColumns: '340px 1fr' }}>
        {/* กำหนดการสำรองอัตโนมัติ */}
        <div className="search-card" style={{ alignSelf: 'start' }}>
          <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>กำหนดการสำรองอัตโนมัติ</h3>
            <span className="spacer" />{!editSched && <button className="btn ghost sm" onClick={() => { setDraft(sched); setEditSched(true); }}><Icon name="edit" size={12} /></button>}</div>

          {!editSched ? (
            <div className="bk-sched-view">
              <div className="bk-sched-status">
                <span className={"pill " + (sched.enabled ? 'ok' : 'neutral')}>{sched.enabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
              </div>
              <div className="field"><span className="label">ความถี่</span><span className="value">{sched.freq === 'daily' ? 'รายวัน' : sched.freq === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'} · {sched.time} น.</span></div>
              <div className="field"><span className="label">ขอบเขต</span><span className="value">{scopeLabel(sched.scope)}</span></div>
              <div className="field"><span className="label">เก็บย้อนหลัง</span><span className="value">{sched.keepDays} วัน</span></div>
              <div className="field"><span className="label">ปลายทางจัดเก็บ</span><span className="value" style={{ textAlign: 'right' }}>{sched.target}</span></div>
            </div>
          ) : (
            <div className="bk-sched-edit">
              <label className="ru-check" style={{ marginBottom: 10 }}>
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft(d => ({ ...d, enabled: e.target.checked }))} />
                <span>เปิดการสำรองอัตโนมัติ</span>
              </label>
              <div className="cfg-field"><label className="cfg-label">ความถี่</label>
                <select className="cfg-input" value={draft.freq} onChange={(e) => setDraft(d => ({ ...d, freq: e.target.value }))}>
                  <option value="daily">รายวัน</option><option value="weekly">รายสัปดาห์</option><option value="monthly">รายเดือน</option>
                </select></div>
              <div className="cfg-field"><label className="cfg-label">เวลาเริ่มทำงาน</label>
                <input className="cfg-input mono" type="time" value={draft.time} onChange={(e) => setDraft(d => ({ ...d, time: e.target.value }))} /></div>
              <div className="cfg-field"><label className="cfg-label">ขอบเขต</label>
                <select className="cfg-input" value={draft.scope} onChange={(e) => setDraft(d => ({ ...d, scope: e.target.value }))}>
                  <option value="all">ทุกระบบ</option>
                  {window.ADM_SYSTEMS.filter(s => s.key !== 'admin').map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select></div>
              <div className="cfg-field"><label className="cfg-label">เก็บย้อนหลัง (วัน)</label>
                <input className="cfg-input mono" type="number" min="1" value={draft.keepDays} onChange={(e) => setDraft(d => ({ ...d, keepDays: Number(e.target.value) || 0 }))} /></div>
              <div className="col-gap" style={{ marginTop: 12 }}>
                <button className="btn sm" onClick={() => setEditSched(false)}>ยกเลิก</button>
                <span style={{ flex: 1 }} />
                <button className="btn primary sm" onClick={saveSched}><Icon name="check" /> บันทึก</button>
              </div>
            </div>
          )}
        </div>

        {/* ประวัติการสำรอง/กู้คืน */}
        <div className="search-card" style={{ padding: 0, overflow: 'hidden', minWidth: 0 }}>
          <div className="sh-grid-head"><div>
            <div className="sh-grid-title">ประวัติการสำรองและกู้คืน <span className="muted" style={{ fontWeight: 400 }}>· {hist.length} รายการ</span></div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>กู้คืนข้อมูลจากชุดสำรองที่สำเร็จได้จากปุ่มในคอลัมน์จัดการ</div>
          </div></div>
          <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}><div className="table-scroll">
            <table className="tbl">
              <thead><tr><th>รหัสชุด</th><th className="center">วันเวลา</th><th className="center">ประเภท</th><th>ขอบเขต</th><th className="num">ขนาด</th><th className="center">ใช้เวลา</th><th>โดย</th><th className="center">ผล</th><th className="center" style={{ width: 80 }}>จัดการ</th></tr></thead>
              <tbody>
                {hist.map(b => {
                  const k = window.ADM_BACKUP_KIND[b.kind] || {};
                  const r = window.ADM_BACKUP_RESULT[b.result] || {};
                  const canRestore = b.result === 'ok' && b.kind !== 'restore';
                  return (
                    <tr key={b.id}>
                      <td className="mono" style={{ fontSize: 11 }}>{b.id}</td>
                      <td className="center mono" style={{ fontSize: 11 }}>{fmt.datetime(b.ts)}</td>
                      <td className="center"><span className={"chip " + (k.pill === 'ok' ? 'success' : k.pill === 'warn' ? 'warning' : k.pill === 'info' ? 'info' : '')}><Icon name={k.icon} size={11} /> {k.l}</span></td>
                      <td>{b.scope}</td>
                      <td className="num mono">{bkSizeLabel(b.sizeMB)}</td>
                      <td className="center mono muted" style={{ fontSize: 11 }}>{bkDuration(b.durationSec)}</td>
                      <td className="muted" style={{ fontSize: 12 }}>{b.by}</td>
                      <td className="center"><span className={"pill " + r.pill}>{r.l}</span></td>
                      <td className="center">
                        {canRestore && <button className="bud-act" title="กู้คืนจากชุดนี้" onClick={() => setConfirm(b)} disabled={!!running}><Icon name="upload" size={13} /></button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>

      {/* ยืนยันการกู้คืน */}
      {confirm && (
        <>
          <div className="modal-backdrop" onClick={() => !running && setConfirm(null)} />
          <div className="modal-card" style={{ width: 460 }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ background: 'var(--warning-50)', color: 'var(--warning)' }}><Icon name="upload" /></div>
              <h2>ยืนยันการกู้คืนข้อมูล</h2>
              <button className="close-btn" onClick={() => !running && setConfirm(null)}><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <div className="bk-warn">
                <Icon name="info" size={16} />
                <span>การกู้คืนจะ<b>เขียนทับข้อมูลปัจจุบัน</b>ของขอบเขต “{confirm.scope}” ด้วยข้อมูล ณ เวลาที่สำรอง — ควรสำรองข้อมูลล่าสุดก่อนดำเนินการ</span>
              </div>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field"><span className="label">ชุดสำรอง</span><span className="value mono">{confirm.id}</span></div>
                <div className="field"><span className="label">วันเวลาที่สำรอง</span><span className="value">{fmt.datetime(confirm.ts)} น.</span></div>
                <div className="field"><span className="label">ขอบเขต</span><span className="value">{confirm.scope}</span></div>
                <div className="field"><span className="label">ขนาด</span><span className="value mono">{bkSizeLabel(confirm.sizeMB)}</span></div>
              </div>
              <div className="col-gap" style={{ marginTop: 18 }}>
                <button className="btn" onClick={() => setConfirm(null)} disabled={!!running}>ยกเลิก</button>
                <span style={{ flex: 1 }} />
                <button className="btn danger" onClick={() => runJob('restore', null, confirm)} disabled={!!running}>
                  <Icon name="upload" /> ยืนยันกู้คืนข้อมูล
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { BackupRestorePage });
