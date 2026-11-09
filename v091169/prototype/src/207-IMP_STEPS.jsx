// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › การทำงาน — นำเข้าการลงทุนจาก Excel
//  ขั้นตอน: อัปโหลด → จับคู่คอลัมน์ → ตรวจสอบ/Preview → ยืนยันนำเข้า
//  ตรวจสอบ: ข้อมูลซ้ำ · ประเภทสินทรัพย์ · วันครบกำหนด · วงเงินลงทุน
//  + เก็บประวัติการนำเข้า
// ════════════════════════════════════════════════════════════════════

const IMP_STEPS = ['อัปโหลดไฟล์', 'จับคู่คอลัมน์', 'ตรวจสอบ & Preview', 'ยืนยันนำเข้า'];

// คอลัมน์ที่ต้อง map
const IMP_FIELDS = [
  { key: 'assetType', label: 'ประเภทสินทรัพย์', col: 'ประเภท' },
  { key: 'securityName', label: 'ชื่อหลักทรัพย์', col: 'ชื่อหลักทรัพย์' },
  { key: 'securityCode', label: 'รหัสหลักทรัพย์', col: 'Symbol' },
  { key: 'issuer', label: 'ผู้ออกหลักทรัพย์', col: 'ผู้ออก' },
  { key: 'amount', label: 'จำนวนเงินลงทุน', col: 'เงินลงทุน' },
  { key: 'rate', label: 'อัตราดอกเบี้ย', col: 'ดอกเบี้ย%' },
  { key: 'maturity', label: 'วันครบกำหนด', col: 'ครบกำหนด' },
];
const IMP_FILE_COLS = ['ประเภท', 'ชื่อหลักทรัพย์', 'Symbol', 'ผู้ออก', 'เงินลงทุน', 'ดอกเบี้ย%', 'ครบกำหนด', 'หมายเหตุ'];

function ImpStepper({ step }) {
  return (
    <div className="iv-stepper">
      {IMP_STEPS.map((s, i) => (
        <React.Fragment key={i}>
          <div className={"iv-step" + (i === step ? ' active' : i < step ? ' done' : '')}>
            <span className="iv-step-no">{i < step ? <Icon name="check" size={13} /> : i + 1}</span>
            <span className="iv-step-label">{s}</span>
          </div>
          {i < IMP_STEPS.length - 1 && <div className={"iv-step-line" + (i < step ? ' done' : '')} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function ImportWizard({ onClose, onDone, onToast }) {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [mapping, setMapping] = useState(() => {
    const m = {}; IMP_FIELDS.forEach(f => { m[f.key] = f.col; }); return m;
  });
  const rows = window.IV_IMPORT_PREVIEW || [];
  const errRows = rows.filter(r => r.errors.length > 0);
  const okRows = rows.filter(r => r.errors.length === 0);

  const pickDemo = () => { setFileName('investment_jun2026.xlsx'); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ width: 920, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="upload" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>นำเข้าการลงทุนจาก Excel</h2>
            <div className="muted" style={{ fontSize: 11 }}>นำเข้าข้อมูลพอร์ตลงทุนจากไฟล์ Excel พร้อมตรวจสอบความถูกต้อง</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ overflow: 'auto' }}>
          <ImpStepper step={step} />

          {/* STEP 1 — Upload */}
          {step === 0 && (
            <div className="iv-upload-zone">
              {!fileName ? (
                <>
                  <div className="iv-upload-ico"><Icon name="upload" size={26} /></div>
                  <div className="iv-upload-title">ลากไฟล์ Excel มาวาง หรือเลือกไฟล์</div>
                  <div className="muted" style={{ fontSize: 12 }}>รองรับ .xlsx, .xls — โครงสร้างคอลัมน์ตามแม่แบบมาตรฐาน</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn primary" onClick={pickDemo}><Icon name="upload" /> เลือกไฟล์</button>
                    <button className="btn" onClick={() => onToast && onToast('ดาวน์โหลดแม่แบบไฟล์นำเข้า (template.xlsx)')}><Icon name="download" /> ดาวน์โหลดแม่แบบ</button>
                  </div>
                </>
              ) : (
                <div className="iv-file-card">
                  <div className="iv-file-ico"><Icon name="receipt" size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{fileName}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{rows.length} แถวข้อมูล · {IMP_FILE_COLS.length} คอลัมน์ · อ่านไฟล์สำเร็จ</div>
                  </div>
                  <button className="iv-doc-x" onClick={() => setFileName('')}><Icon name="close" size={13} /></button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Mapping */}
          {step === 1 && (
            <div className="iv-map-grid">
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>จับคู่ฟิลด์ในระบบกับคอลัมน์ในไฟล์ Excel</div>
              {IMP_FIELDS.map(f => (
                <div key={f.key} className="iv-map-row">
                  <span className="iv-map-field">{f.label}</span>
                  <Icon name="chevRight" size={13} />
                  <select className="cfg-input" value={mapping[f.key]} onChange={(e) => setMapping(m => ({ ...m, [f.key]: e.target.value }))}>
                    {IMP_FILE_COLS.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="">— ไม่นำเข้า —</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — Preview & validate */}
          {step === 2 && (
            <>
              <div className="iv-validate-row">
                <div className="iv-vchip ok"><Icon name="check" size={13} /> ผ่าน {okRows.length} แถว</div>
                <div className="iv-vchip bad"><Icon name="info" size={13} /> มีปัญหา {errRows.length} แถว</div>
                <span className="spacer" style={{ flex: 1 }} />
                <span className="muted" style={{ fontSize: 11 }}>ตรวจสอบ: ข้อมูลซ้ำ · ประเภทสินทรัพย์ · วันครบกำหนด · วงเงินลงทุน</span>
              </div>
              <div className="table-wrap">
                <table className="tbl" style={{ minWidth: 820 }}>
                  <thead><tr>
                    <th style={{ width: 44 }}>แถว</th><th>ประเภท</th><th>หลักทรัพย์</th>
                    <th className="right">เงินลงทุน</th><th className="center">ครบกำหนด</th><th>ผลตรวจสอบ</th>
                  </tr></thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.row} style={r.errors.length ? { background: 'var(--danger-50)' } : undefined}>
                        <td className="mono center">{r.row}</td>
                        <td style={{ fontSize: 12 }}>{r.assetType}</td>
                        <td><div className="lt-row-name">{r.securityName}</div><div className="lt-row-note muted mono">{r.securityCode}</div></td>
                        <td className="right mono">{fmt.money(r.amount, 0)}</td>
                        <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.maturity)}</td>
                        <td>
                          {r.errors.length === 0
                            ? <span className="pill ok">ผ่าน</span>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {r.errors.map((e, i) => <span key={i} className="iv-err-line"><Icon name="close" size={11} /> {e}</span>)}
                              </div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errRows.length > 0 && (
                <div className="dat-warn" style={{ marginTop: 10 }}>
                  <Icon name="info" size={14} /><span>ระบบจะนำเข้าเฉพาะ <b>{okRows.length} แถวที่ผ่านการตรวจสอบ</b> — แถวที่มีปัญหาจะถูกข้ามและแสดงในรายการ Error</span>
                </div>
              )}
            </>
          )}

          {/* STEP 4 — Confirm result */}
          {step === 3 && (
            <div className="iv-result-final">
              <div className="iv-result-ico"><Icon name="check" size={30} /></div>
              <div className="iv-result-title">นำเข้าข้อมูลสำเร็จ</div>
              <div className="muted" style={{ fontSize: 13 }}>นำเข้ารายการลงทุน {okRows.length} รายการเข้าสู่ทะเบียนพอร์ตเรียบร้อยแล้ว</div>
              <div className="iv-result-stats">
                <div className="iv-rs"><span className="iv-rs-v" style={{ color: 'var(--success)' }}>{okRows.length}</span><span className="iv-rs-l">นำเข้าสำเร็จ</span></div>
                <div className="iv-rs"><span className="iv-rs-v" style={{ color: 'var(--danger)' }}>{errRows.length}</span><span className="iv-rs-l">ข้าม (มีปัญหา)</span></div>
                <div className="iv-rs"><span className="iv-rs-v">{rows.length}</span><span className="iv-rs-l">ทั้งหมด</span></div>
              </div>
            </div>
          )}
        </div>

        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          {step > 0 && step < 3 && <button className="btn" onClick={() => setStep(step - 1)}><Icon name="chevLeft" /> ย้อนกลับ</button>}
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>{step === 3 ? 'ปิด' : 'ยกเลิก'}</button>
          {step === 0 && <button className="btn primary" disabled={!fileName} onClick={() => setStep(1)}>ถัดไป <Icon name="chevRight" /></button>}
          {step === 1 && <button className="btn primary" onClick={() => setStep(2)}>ตรวจสอบข้อมูล <Icon name="chevRight" /></button>}
          {step === 2 && <button className="btn primary" disabled={okRows.length === 0} onClick={() => setStep(3)}><Icon name="check" /> ยืนยันนำเข้า {okRows.length} รายการ</button>}
          {step === 3 && <button className="btn primary" onClick={() => { onDone(fileName, okRows.length, errRows.length); }}><Icon name="check" /> เสร็จสิ้น</button>}
        </div>
      </div>
    </>
  );
}

function ImportInvestmentPage({ onToast }) {
  const [history, setHistory] = useState(() => JSON.parse(JSON.stringify(window.IV_IMPORT_SEED)));
  const [wizard, setWizard] = useState(false);

  const handleDone = (fileName, ok, err) => {
    const rec = {
      id: 'IMP-2569-' + String(9 + (history.length - window.IV_IMPORT_SEED.length)).padStart(3, '0'),
      fileName, importDate: ivNow(), by: IV_USER, total: ok + err, success: ok, error: err, status: 'completed',
    };
    setHistory([rec, ...history]);
    setWizard(false);
    onToast && onToast(`นำเข้าไฟล์ ${fileName} สำเร็จ — เพิ่ม ${ok} รายการเข้าทะเบียนพอร์ต`);
  };

  return (
    <div data-screen-label="หน้านำเข้าการลงทุนจาก Excel">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>นำเข้าการลงทุนจาก Excel</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            นำเข้าข้อมูลพอร์ตลงทุนจากไฟล์ Excel พร้อมจับคู่คอลัมน์ ตรวจสอบความถูกต้อง และเก็บประวัติการนำเข้า
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setWizard(true)}><Icon name="upload" /> นำเข้าไฟล์ใหม่</button>
      </div>

      <IvSection icon="history" title="ประวัติการนำเข้า" count={history.length}>
        <div className="table-wrap" style={{ marginTop: 4 }}>
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead><tr>
              <th>เลขที่</th><th>ไฟล์</th><th className="center">วันที่นำเข้า</th><th>ผู้นำเข้า</th>
              <th className="center">ทั้งหมด</th><th className="center">สำเร็จ</th><th className="center">ผิดพลาด</th><th className="center">สถานะ</th>
            </tr></thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id}>
                  <td className="mono">{h.id}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="receipt" size={13} /> {h.fileName}</span></td>
                  <td className="center mono" style={{ fontSize: 11 }}>{h.importDate}</td>
                  <td>{h.by}</td>
                  <td className="center mono">{h.total}</td>
                  <td className="center mono" style={{ color: 'var(--success)' }}>{h.success}</td>
                  <td className="center mono" style={{ color: h.error ? 'var(--danger)' : 'var(--text-faint)' }}>{h.error || '—'}</td>
                  <td className="center"><span className="pill ok">เสร็จสิ้น</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </IvSection>

      {wizard && <ImportWizard onClose={() => setWizard(false)} onDone={handleDone} onToast={onToast} />}
    </div>
  );
}

Object.assign(window, { ImportInvestmentPage });
