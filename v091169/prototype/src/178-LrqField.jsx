// ตัดเลขนำหน้าออกจากข้อความตัวเลือก (เช่น "0 : คำนวณงวดปกติ" → "คำนวณงวดปกติ")
const lrqT = (l) => String(l == null ? '' : l).replace(/^\s*\d+\s*[:.\-–]\s*/, '');
// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — การทำงาน: ใบคำขอกู้เงิน (สร้างคำขอกู้)
//  Flow: คิวคำขอจากระบบ CRM ของสหกรณ์ → "ดึงรายการ" → สร้างใบคำขอกู้
//  ★ ฟิลด์ที่ผูกค่าคงที่ของระบบสินเชื่อ (LP_SEED / IR_SEED) มีป้าย “ค่าคงที่”
// ════════════════════════════════════════════════════════════════════

// ── ฟิลด์ฟอร์ม (label บน + control ล่าง) ──────────────────────────────
function LrqField({ label, children, span, bound, hint }) {
  return (
    <div className={"lrq-f" + (span ? " span-" + span : "")}>
      <label className="lrq-lbl">{label}</label>
      {children}
      {hint && <span className="lrq-hint">{hint}</span>}
    </div>
  );
}

// ── วันที่ DD/MM/YYYY (พ.ศ.) ──
const lrqDMY = (iso) => { if (!iso) return ''; const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${Number(y) + 543}`; };

// ── input เงิน (จัดชิดขวา) ──────────────────────────────────────────
function LrqMoney({ value, onChange, readOnly, yellow }) {
  return (
    <input
      className={"cfg-input lrq-num" + (yellow ? " lrq-y" : "") + (readOnly ? " lrq-ro" : "")}
      value={typeof value === 'number' ? fmt.money(value) : value}
      readOnly={readOnly}
      onChange={onChange ? (e) => onChange(Number(String(e.target.value).replace(/[^0-9.]/g, '')) || 0) : undefined}
    />
  );
}

// ── หัวข้อย่อยภายในการ์ด ─────────────────────────────────────────────
function LrqSub({ children }) { return <div className="lrq-subhead">{children}</div>; }

const lrqStatusPill = (s) => {
  if (s === 'รออนุมัติ') return <span className="pill warn">{s}</span>;
  if (s === 'อนุมัติแล้ว') return <span className="pill ok">{s}</span>;
  return <span className="pill neutral">{s}</span>;
};
const lrqEye = (onClick) => (
  <button className="lrq-eyebtn lrq-eyebtn-g act-view" onClick={onClick} title="ดูข้อมูล" style={{ background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)', width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="eye" size={14} /></button>
);
const lrqTrash = (onClick) => (
  <button className="btn sm act-del" onClick={onClick} title="ลบรายการ"
          style={{ background: '#fff', border: '1px solid var(--danger)', color: 'var(--danger)',
                   width: 28, height: 28, minWidth: 28, padding: 0, borderRadius: 4, justifyContent: 'center' }}>
    <Icon name="trash" size={13} />
  </button>
);
const lrqDel = (onClick) => lrqTrash(onClick);

// ── Popup "ดูรายการหลักประกัน" — เนื้อหาแยกตามประเภทหลักประกัน ──────
function CollateralDetailModal({ coll, onClose }) {
  const v = coll.view || {};
  const m = (n) => fmt.money(n || 0);

  // ตารางหัวเรื่อง (label/value) — แสดงประเภท + เลขที่อ้างอิง เหมือนทุกประเภท
  const headRows = (
    <>
      <tr>
        <td className="k">ประเภทหลักประกัน</td><td className="v mono">{coll.code || '—'}</td>
        <td className="k dash">-</td><td className="v" colSpan="3">{v.typeName || coll.type}</td>
      </tr>
      <tr>
        <td className="k">เลขที่อ้างอิง</td><td className="v mono">{coll.ref}</td>
        <td className="k dash">-</td><td className="v" colSpan="3">{coll.detail}</td>
      </tr>
    </>
  );

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card coll-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>หลักประกัน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <table className="coll-kv"><tbody>
            {headRows}

            {/* ── ระยะเวลา (เฉพาะคนค้ำประกัน) ── */}
            {v.kind === 'person' && v.dates && (
              <>
                <tr className="sec"><td colSpan="6">ระยะเวลา</td></tr>
                {v.dates.map((d, i) => (
                  <tr key={i}>
                    <td className="k">{d.label}</td><td className="v mono">{d.date}</td>
                    <td className="k">จำนวนปี</td><td className="v" colSpan="3">{d.years}</td>
                  </tr>
                ))}
              </>
            )}

            {/* ── วงเงินค้ำประกัน (คนค้ำประกัน + หุ้นค้ำประกัน) ── */}
            {v.limit && (
              <>
                <tr className="sec"><td colSpan="6">วงเงินค้ำประกัน</td></tr>
                <tr>
                  <td className="k">วงเงินค้ำประกัน</td><td className="v num">{m(v.limit.max)}</td>
                  <td className="k">วงเงินใช้ไป</td><td className="v num">{m(v.limit.used)}</td>
                  <td className="k">วงเงินที่ล็อคไว้</td><td className="v num">{m(v.limit.locked)}</td>
                </tr>
                <tr>
                  <td className="k">วงเงินค้ำคงเหลือ</td><td className="v num">{m(v.limit.remain)}</td>
                  <td className="k">ค้ำได้</td><td className="v num">{v.limit.pct}</td>
                  <td className="v num" colSpan="2">{m(v.limit.ok)}</td>
                </tr>
              </>
            )}
          </tbody></table>

          {/* ── การ์ดตารางรายการย่อย (แตกต่างตามประเภท) ── */}
          <div className="coll-subcard">
            <div className="table-wrap"><table className="tbl coll-subtbl">
              {(v.kind === 'person' || v.kind === 'share') && (
                <>
                  <thead><tr>
                    <th>สัญญา/ใบคำขอ</th><th>ชื่อ</th><th>นามสกุล</th>
                    <th className="num">คงเหลือ</th><th className="num">เปอร์เซ็นต์ค้ำ</th><th className="num">เงินค้ำประกัน</th>
                  </tr></thead>
                  <tbody>
                    {(v.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.contract}</td><td>{r.fname}</td><td>{r.lname}</td>
                        <td className="num">{m(r.remain)}</td><td className="num">{r.pct}</td><td className="num">{m(r.guarAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {v.kind === 'deposit' && (
                <>
                  <thead><tr>
                    <th>เลขที่บัญชี</th><th>ชื่อบัญชี</th><th>เลขสมาชิก</th><th>ชื่อ-นามสกุลสมาชิก</th><th>ประเภทเงินฝาก</th>
                  </tr></thead>
                  <tbody>
                    {(v.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.accNo}</td><td>{r.accName}</td><td className="mono">{r.memberNo}</td><td>{r.memberName}</td><td>{r.depType}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {v.kind === 'bond' && (
                <>
                  <thead><tr>
                    <th>เลขที่พันธบัตร</th><th>ชื่อเจ้าของพันธบัตร</th><th>เลขสมาชิก</th><th>ชื่อ-นามสกุลสมาชิก</th><th>ประเภทพันธบัตร</th>
                  </tr></thead>
                  <tbody>
                    {(v.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.bondNo}</td><td>{r.ownerName}</td><td className="mono">{r.memberNo}</td><td>{r.memberName}</td><td>{r.bondType}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {v.kind === 'asset' && (
                <>
                  <thead><tr>
                    <th>ทะเบียนหลักทรัพย์</th><th>เลขที่หลักทรัพย์</th><th>ประเภทหลักทรัพย์</th><th>เลขสมาชิก</th>
                    <th>ชื่อ-นามสกุลสมาชิก</th><th>ประเภทผู้กู้</th><th className="num">ราคาจำนอง</th>
                  </tr></thead>
                  <tbody>
                    {(v.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.reg}</td><td className="mono">{r.assetNo}</td><td>{r.assetType}</td><td className="mono">{r.memberNo}</td>
                        <td>{r.memberName}</td><td>{r.loanType}</td><td className="num">{m(r.mortgagePrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table></div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Popup แก้ไขข้อมูลเงินเดือน (มีผลข้ามไปยังทะเบียนสมาชิก) ──────
function SalaryEditModal({ member, salary, onConfirm, onClose }) {
  const [newSalary, setNewSalary] = useState('');
  const [date, setDate] = useState(window.DEPOSIT_WORKING_DATE);
  const [actor, setActor] = useState('');
  const history = window.lrSalaryHistory(member.code);
  const numNew = Number(String(newSalary).replace(/[^0-9.]/g, '')) || 0;
  const valid = numNew > 0 && actor.trim();
  const submit = () => { if (valid) onConfirm(numNew, { old: salary, date, actor: actor.trim() }); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-sal-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>แก้ไขข้อมูลเงินเดือน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-grid c4">
            <LrqField label="เลขสมาชิก"><input className="cfg-input mono lrq-ro" value={member.code} readOnly /></LrqField>
            <LrqField label="ชื่อ-นามสกุลสมาชิก"><input className="cfg-input lrq-ro" value={member.name} readOnly /></LrqField>
            <LrqField label="หน่วย"><input className="cfg-input lrq-ro" value={member.unit} readOnly /></LrqField>
            <LrqField label="เงินเดือน"><input className="cfg-input lrq-num lrq-ro" value={fmt.money(salary)} readOnly /></LrqField>
          </div>

          <div className="lrq-sal-subhead"><span className="lrq-dot" /> ประวัติเปลี่ยนแปลงเงินเดือน</div>
          <div className="lrq-grid c4">
            <LrqField label="เงินเดือนเก่า"><input className="cfg-input lrq-num lrq-ro" value={fmt.money(salary)} readOnly /></LrqField>
            <LrqField label="เงินเดือนใหม่">
              <input className="cfg-input lrq-num" value={newSalary} placeholder="โปรดระบุข้อมูล" autoFocus
                     onChange={e => setNewSalary(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            </LrqField>
            <LrqField label="วันที่เปลี่ยนแปลง">
              <ErpDate value={date} onChange={setDate} />
            </LrqField>
            <LrqField label="ผู้ทำรายการ">
              <input className="cfg-input" value={actor} placeholder="โปรดระบุข้อมูล"
                     onChange={e => setActor(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            </LrqField>
          </div>

          {history.length > 0 && (
            <div className="lrq-sal-hist">
              <div className="table-wrap"><table className="tbl lrq-tbl">
                <thead><tr><th>วันที่เปลี่ยนแปลง</th><th className="num">เงินเดือนเดิม</th><th className="num">เงินเดือนใหม่</th><th>ผู้ทำรายการ</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}><td className="mono">{fmt.date(h.date)}</td><td className="num">{fmt.money(h.old)}</td>
                      <td className="num">{fmt.money(h.new)}</td><td>{h.actor}</td></tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!valid} onClick={submit}><Icon name="check" /> ยืนยัน</button>
        </div>
      </div>
    </>
  );
}

// ── เอกสารประกอบที่ขอเพิ่มได้ (ค่าตั้งต้น) ──────────────────────────
const LRQ_DOC_OPTIONS = [
  'สำเนาบัตรประชาชน',
  'สำเนาทะเบียนบ้าน',
  'หนังสือรับรองเงินเดือน / สลิปเงินเดือน',
  'สำเนาบัญชีเงินฝากธนาคาร',
  'หนังสือยินยอมให้หักเงินเดือน',
];

// ── Popup "ส่งคืนคำขอกู้" — ส่งคืนคำขอในคิว CRM พร้อมระบุเอกสารที่ขาด ──
function ReturnReqModal({ req, onConfirm, onClose }) {
  const g = (window.GUAR_MEMBERS || []).find(m => m.code === req.memberCode);
  const prod = window.lrFindProduct(req.productId);
  const today = (() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear() + 543}/${p(d.getMonth() + 1)}/${p(d.getDate())}`; })();
  const docNo = 'RT-' + String(new Date().getFullYear() + 543).slice(-2) + '-' + req.crmNo.replace(/\D/g, '').slice(-4);
  const [sel, setSel] = useState({});
  const [note, setNote] = useState('');
  const [emsNo, setEmsNo] = useState('');
  const toggle = (d) => setSel(p => ({ ...p, [d]: !p[d] }));
  const chosen = LRQ_DOC_OPTIONS.filter(d => sel[d]);
  const valid = note.trim().length > 0;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-docs-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>ส่งคืนคำขอกู้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-docsum-lead" style={{ paddingBottom: 12, marginBottom: 12 }}>
            <span className="lrq-docsum-ico"><Icon name="refresh" size={18} /></span>
            <div>
              <div className="lrq-docsum-title">{g ? g.name : '—'} · <span className="mono">{req.memberCode}</span></div>
              <div className="muted" style={{ fontSize: 12 }}>
                เลขที่คำขอ (CRM) <span className="mono">{req.crmNo}</span> · {prod ? prod.name : '—'}<br />
                เลขที่เอกสารส่งคืน <span className="mono">{docNo}</span> · วันที่ส่งคืน <span className="mono">{today}</span>
              </div>
            </div>
          </div>
          <div className="lrq-lbl" style={{ marginBottom: 6 }}>เอกสารที่ขาด / ต้องส่งเพิ่ม <span className="muted">(ถ้ามี)</span></div>
          <div className="lrq-doc-list">
            {LRQ_DOC_OPTIONS.map(d => (
              <label key={d} className="lrq-check lrq-doc-check">
                <input type="checkbox" checked={!!sel[d]} onChange={() => toggle(d)} />
                {d}
              </label>
            ))}
          </div>
          <div className="lrq-f" style={{ marginTop: 4 }}>
            <label className="lrq-lbl">หมายเหตุ / เหตุผลในการส่งคืน <span className="muted">(จำเป็น)</span></label>
            <textarea className="cfg-input lrq-doc-note" rows="3" value={note}
                      placeholder="ระบุเหตุผลในการส่งคืนคำขอกู้ เช่น เอกสารประกอบไม่ครบถ้วน…"
                      onChange={e => setNote(e.target.value)} />
          </div>
          <div className="lrq-f" style={{ marginTop: 12 }}>
            <label className="lrq-lbl">เลขพัสดุ EMS <span className="muted">(ถ้ามี)</span></label>
            <input className="cfg-input mono" value={emsNo} placeholder="เช่น EG123456789TH"
                   onChange={e => setEmsNo(e.target.value)} />
          </div>
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!valid}
                  onClick={() => valid && onConfirm({ docNo, date: today, docs: chosen, note: note.trim(), emsNo: emsNo.trim() })}>
            <Icon name="refresh" /> บันทึกส่งคืน
          </button>
        </div>
      </div>
    </>
  );
}

// ── Popup "ขอเอกสารเพิ่มเติม" — เลือกเอกสารที่ต้องการให้สมาชิกส่งเพิ่ม ──
function RequestDocsModal({ onConfirm, onClose }) {
  const [sel, setSel] = useState(() => ({ 'สำเนาบัตรประชาชน': true }));
  const [note, setNote] = useState('');
  const toggle = (d) => setSel(p => ({ ...p, [d]: !p[d] }));
  const chosen = LRQ_DOC_OPTIONS.filter(d => sel[d]);
  const valid = chosen.length > 0;
  const submit = () => { if (valid) onConfirm({ docs: chosen, note: note.trim() }); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-docs-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>ขอเอกสารเพิ่มเติม</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-doc-list">
            {LRQ_DOC_OPTIONS.map(d => (
              <label key={d} className="lrq-check lrq-doc-check">
                <input type="checkbox" checked={!!sel[d]} onChange={() => toggle(d)} />
                {d}
              </label>
            ))}
          </div>
          <div className="lrq-f" style={{ marginTop: 4 }}>
            <label className="lrq-lbl">หมายเหตุ</label>
            <textarea className="cfg-input lrq-doc-note" rows="3" value={note} maxLength={500}
                      placeholder="โปรดระบุข้อมูล" onChange={e => setNote(e.target.value.slice(0, 500))} />
            <div className="muted" style={{ fontSize: 11, textAlign: 'right', marginTop: 2 }}>{note.length}/500</div>
          </div>
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!valid} onClick={submit}><Icon name="edit" /> บันทึกแบบร่าง</button>
        </div>
      </div>
    </>
  );
}

// ── Popup สรุป "ขอเอกสารเพิ่มเติม" — แจ้งรายการที่ขอไปหลังบันทึกแบบร่าง ──
function RequestDocsSummaryModal({ summary, reqNo, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-docsum-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>บันทึกแบบร่างเรียบร้อย</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-docsum-lead">
            <span className="lrq-docsum-ico"><Icon name="attach" size={18} /></span>
            <div>
              <div className="lrq-docsum-title">ระบบได้บันทึกคำขอเอกสารเพิ่มเติมแล้ว</div>
              <div className="muted" style={{ fontSize: 12 }}>
                เลขที่ใบขอกู้ <span className="mono">{reqNo}</span> — สถานะเปลี่ยนเป็น
                <span className="pill neutral" style={{ margin: '0 4px' }}>แบบร่าง</span>
                <span className="pill warn">ขอเอกสารเพิ่มเติม</span>
              </div>
            </div>
          </div>
          <div className="lrq-docsum-sec">รายการเอกสารที่ขอเพิ่มเติม ({summary.docs.length})</div>
          <ol className="lrq-docsum-list">
            {summary.docs.map((d, i) => (
              <li key={i}><Icon name="check" size={13} /> {d}</li>
            ))}
          </ol>
          {summary.note && (
            <div className="lrq-docsum-note">
              <div className="lrq-docsum-note-lbl">หมายเหตุ</div>
              <div>{summary.note}</div>
            </div>
          )}
          <div className="lrq-docsum-hint">
            <Icon name="info" size={13} /> เจ้าหน้าที่ต้องกลับมาทำรายการนี้ซ้ำอีกครั้งเมื่อได้รับเอกสารครบถ้วน
          </div>
        </div>
        <div className="lrq-sal-foot">
          <button className="btn primary" onClick={onClose}><Icon name="check" /> รับทราบ</button>
        </div>
      </div>
    </>
  );
}

// ── Popup "ตารางอัตราดอกเบี้ย" — เงื่อนไขการคิดดอกเบี้ยตามช่วงเวลา (อ่านอย่างเดียว) ──
//  ดึง tier จริงของประเภทเงินกู้ที่เลือก (sync กับค่าคงที่ประเภทเงินกู้)
//  + ตารางตามเงินกู้ (ถ้ามี) · ไฮไลต์แถวที่ใช้กับคำขอนี้ · บรรทัดสรุปที่มาของอัตรา
function LrqRateTierModal({ product, amount, reqDate, rateAdd, rateReduce, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const s = (product && product.settings) || {};
  const rows = (product && product.interestTiers) || [];
  const aRows = (product && product.amountInterestTiers) || [];
  const derived = product && window.lrDeriveFromProduct ? window.lrDeriveFromProduct(product, amount, reqDate) : null;
  const parts = (derived && derived.rateParts) || null;
  const isHit = (r, key) => !!(parts && parts[key] === r);
  const hitStyle = { background: '#eafef2', fontWeight: 600 };
  const fixedRateOf = (r) => Number(r.rate != null && r.rate !== '' ? r.rate : r.fixedRate) || 0;
  const pct = (v, d) => (Number(v) || 0).toFixed(d == null ? 2 : d) + '%';
  const sgn = (v) => (v < 0 ? '− ' : '+ ') + Math.abs(v).toFixed(2);
  const amtLabel = (v, inf) => (inf && Number(v) >= 999999999 ? 'ไม่จำกัด' : fmt.money(Number(v) || 0, 2));
  // บรรทัดสรุป: อัตราพื้นฐาน ± ตามช่วงเวลา ± ตามเงินกู้ + เพิ่ม − ลด = อัตราที่ใช้
  const summary = (() => {
    if (!parts) return null;
    const baseSrc = parts.baseFrom === 'amount' ? 'คงที่ ตามเงินกู้'
      : parts.baseFrom === 'time' ? 'คงที่ ตามช่วงเวลา'
      : ('ตาราง ' + (derived.rateTable || '—'));
    const add = Number(rateAdd) || 0, red = Number(rateReduce) || 0;
    const seg = [parts.base.toFixed(2) + ' (' + baseSrc + ')'];
    if (parts.timeAdjust) seg.push(sgn(parts.timeAdjust) + ' (ช่วงเวลา)');
    if (parts.amountAdjust) seg.push(sgn(parts.amountAdjust) + ' (เงินกู้)');
    if (add) seg.push('+ ' + add.toFixed(2) + ' (เพิ่ม)');
    if (red) seg.push('− ' + red.toFixed(2) + ' (ลด)');
    const net = Math.max(0, parts.rate + add - red);
    return seg.join(' ') + ' = ' + net.toFixed(2) + '%';
  })();
  const FORM_LABELS = { fixed: '1: คงที่ (ระบุอัตรา)', float: '2: ตามตาราง ด/บ', tiered: '3: ขั้นบันได' };
  const formLabel = (v) => FORM_LABELS[v] || '—';
  const dueLabel = (v) => (v === 'month' ? 'ชนเดือน' : 'ชนวัน');
  const tableLabel = (v) => {
    const code = v || s.rateTable;
    if (!code) return '—';
    return window.irTableLabel ? window.irTableLabel(code) : code;
  };
  const durLabel = (r) => {
    const from = Number(r.monthFrom) || 0, to = Number(r.monthTo) || 0;
    if (to >= 9999) return 'จนจบสัญญา';
    return String(Math.max(0, to - from + 1));
  };
  const th = {
    fontWeight: 600, color: 'rgba(0,0,0,.65)', background: '#FAFAFA', verticalAlign: 'middle',
    borderRight: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8',
  };
  const thLast = { ...th, borderRight: 'none' };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 960, maxWidth: '96vw' }}>
        <div className="modal-head">
          <h2 style={{ color: 'rgba(0,0,0,.88)' }}>ตารางอัตราดอกเบี้ย</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,.88)', margin: '0 0 8px' }}>กำหนดการคิดดอกเบี้ยตามช่วงเวลา</div>
          <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="tbl" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ ...th, width: 48, textAlign: 'center' }}>No.</th>
                    <th rowSpan={2} style={{ ...th, width: 110 }}>การครบกำหนด</th>
                    <th colSpan={2} style={{ ...th, textAlign: 'center' }}>ช่วงเวลา (เดือน)</th>
                    <th rowSpan={2} style={{ ...th, width: 110 }}>ระยะเวลา (เดือน)</th>
                    <th colSpan={4} style={{ ...thLast, textAlign: 'center' }}>การคิดดอกเบี้ย</th>
                  </tr>
                  <tr>
                    <th style={{ ...th, width: 80, textAlign: 'center' }} />
                    <th style={{ ...th, width: 80, textAlign: 'center' }} />
                    <th style={{ ...th, width: 150 }}>รูปแบบ</th>
                    <th style={{ ...th, width: 100 }}>ด/บ คงที่</th>
                    <th style={{ ...th }}>รหัสตาราง ด/บ</th>
                    <th style={{ ...thLast, width: 110 }}>เพิ่ม/ลด</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr><td colSpan={9} className="center muted" style={{ padding: 28 }}>ไม่พบข้อมูล</td></tr>
                  )}
                  {rows.map((r, i) => {
                    const hit = isHit(r, 'timeRow');
                    return (
                    <tr key={i} style={hit ? hitStyle : undefined} title={hit ? 'แถวที่ใช้กับคำขอนี้ (งวดที่ 1)' : undefined}>
                      <td className="center">{i + 1}</td>
                      <td>{dueLabel(r.dueType)}</td>
                      <td className="center">{Number(r.monthFrom) || 0}</td>
                      <td className="center">{Number(r.monthTo) || 0}</td>
                      <td>{durLabel(r)}</td>
                      <td>{formLabel(r.form)}</td>
                      <td>{r.form === 'fixed' ? pct(fixedRateOf(r)) : '—'}</td>
                      <td>{r.form === 'fixed' ? '—' : tableLabel(r.rateTable)}</td>
                      <td>{pct(r.adjust, 4)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ตารางตามเงินกู้ — แสดงเสมอ (ไม่มีข้อมูล = ชื่อตาราง + หัวตาราง) */}
          {(
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,.88)', margin: '16px 0 8px' }}>กำหนดการคิดดอกเบี้ยตามเงินกู้</div>
              <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrap">
                  <table className="tbl" style={{ minWidth: 860 }}>
                    <thead>
                      <tr>
                        <th rowSpan={2} style={{ ...th, width: 48, textAlign: 'center' }}>No.</th>
                        <th rowSpan={2} style={{ ...th, width: 110 }}>การครบกำหนด</th>
                        <th colSpan={2} style={{ ...th, textAlign: 'center' }}>ช่วงมูลค่าเงินกู้ (บาท)</th>
                        <th colSpan={4} style={{ ...thLast, textAlign: 'center' }}>การคิดดอกเบี้ย</th>
                      </tr>
                      <tr>
                        <th style={{ ...th, width: 130, textAlign: 'center' }}>ตั้งแต่</th>
                        <th style={{ ...th, width: 130, textAlign: 'center' }}>ถึง</th>
                        <th style={{ ...th, width: 150 }}>รูปแบบ</th>
                        <th style={{ ...th, width: 100 }}>ด/บ คงที่</th>
                        <th style={{ ...th }}>รหัสตาราง ด/บ</th>
                        <th style={{ ...thLast, width: 110 }}>เพิ่ม/ลด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aRows.length === 0 && (
                        <tr><td colSpan={8} className="center muted" style={{ padding: 28 }}>ไม่พบข้อมูล</td></tr>
                      )}
                      {aRows.map((r, i) => {
                        const hit = isHit(r, 'amountRow');
                        return (
                        <tr key={i} style={hit ? hitStyle : undefined} title={hit ? 'แถวที่ใช้กับยอดขอกู้นี้' : undefined}>
                          <td className="center">{i + 1}</td>
                          <td>{dueLabel(r.dueType)}</td>
                          <td className="num">{amtLabel(r.amountFrom)}</td>
                          <td className="num">{amtLabel(r.amountTo, true)}</td>
                          <td>{formLabel(r.form)}</td>
                          <td>{r.form === 'fixed' ? pct(r.rate) : '—'}</td>
                          <td>{r.form === 'fixed' ? '—' : tableLabel('')}</td>
                          <td>{pct(r.adjust, 4)}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {summary && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#fafafa', border: '1px solid #f0f0f0',
                          borderRadius: 6, fontSize: 12.5, color: 'rgba(0,0,0,.75)', lineHeight: 1.6 }}>
              <b style={{ color: 'rgba(0,0,0,.88)' }}>อัตราที่ใช้กับคำขอนี้ (งวดที่ 1):</b>{' '}
              <span className="mono">{summary}</span>
              {(rows.length > 0 || aRows.length > 0) && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>แถวที่ไฮไลต์คือแถวที่ใช้กับยอดขอกู้และงวดแรกของคำขอนี้</div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Popup "ค้นหาบัญชีเงินฝาก" — บัญชีของผู้กู้ / สมาชิกอื่น (ไม่แสดงยอดเงิน) ──
function LrqDepositSearchModal({ borrower, onPick, onClose }) {
  const [q, setQ] = useState('');
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const all = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : []).filter(a => a.status === 'active');
  const k = q.trim().toLowerCase();
  const rows = all.filter(a => !k || [a.accNo, a.member, a.name, a.type].some(v => String(v || '').toLowerCase().indexOf(k) >= 0));
  const own = (a) => window.lrIsOwnAccount(a, borrower);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card coll-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>ค้นหาบัญชีเงินฝากค้ำประกัน</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="cfg-input" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="เลขที่บัญชี / เลขสมาชิก / ชื่อเจ้าของบัญชี" />
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className="tbl lrq-tbl">
              <thead><tr><th style={{ minWidth: 150 }}>เลขที่บัญชี</th><th style={{ minWidth: 150 }}>ประเภทเงินฝาก</th><th style={{ minWidth: 90 }}>เลขสมาชิก</th><th style={{ minWidth: 180 }}>ชื่อเจ้าของบัญชี</th><th style={{ width: 90 }} /></tr></thead>
              <tbody>
                {rows.length ? rows.map(a => (
                  <tr key={a.accNo} style={{ cursor: 'pointer' }} onClick={() => onPick(a)}>
                    <td className="mono">{a.accNo}</td><td>{a.type}</td><td className="mono">{a.member}</td>
                    <td>{a.name}{own(a) && <span style={{ marginLeft: 6, fontSize: 11, padding: '0 6px', borderRadius: 2, background: 'var(--brand-100, #EAFEF2)', color: 'var(--brand-700, #237450)' }}>ผู้กู้</span>}</td>
                    <td className="center"><button className="btn sm" onClick={e => { e.stopPropagation(); onPick(a); }}>เลือก</button></td>
                  </tr>
                )) : <tr><td colSpan="5" className="center" style={{ color: 'var(--text-tertiary, rgba(0,0,0,.45))' }}>ไม่พบบัญชีเงินฝาก</td></tr>}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ── Popup "รายละเอียดหักกลบ" — อ่านอย่างเดียว (รูปแบบตารางเดียวกับ popup หลักประกัน) ──
function LrqOffsetModal({ row, onClose }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const o = row || {};
  const m = (v) => fmt.money(Number(v) || 0);
  const p = (v) => (Number(v) || 0).toFixed(2) + '%';
  const d = (v) => {
    if (!v) return '—';
    const dt = new Date(v);
    if (isNaN(dt)) return String(v);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear() + 543}`;
  };
  const paidPeriods = o.paidPeriods != null ? o.paidPeriods : (String(o.period || '').split('/')[0] || '—');
  const lp = o.lastPaid, bl = o.bill;
  const billStatus = !bl ? '' : bl.status === 'cancel' ? 'ยกเลิกเรียกเก็บ — ชำระผ่านหักกลบแทน' : 'รอเรียกเก็บ (ยังไม่ได้รับชำระ)';
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card coll-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>รายละเอียดหักกลบ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <table className="coll-kv"><tbody>
            <tr>
              <td className="k">เลขสัญญา</td><td className="v mono">{o.contract || '—'}</td>
              <td className="k">ประเภทเงินกู้</td><td className="v" colSpan="3">{o.loanType || '—'}</td>
            </tr>

            <tr className="sec"><td colSpan="6">รายละเอียดสัญญา</td></tr>
            <tr>
              <td className="k">ยอดเงินอนุมัติ</td><td className="v num">{m(o.approved)}</td>
              <td className="k">ยอดรอเบิก</td><td className="v num">{m(o.pendingDraw)}</td>
              <td className="k">คงเหลือ</td><td className="v num">{m(o.remaining)}</td>
            </tr>
            <tr>
              <td className="k">อัตราดอกเบี้ย</td><td className="v num">{p(o.rate)}</td>
              <td className="k">งวด</td><td className="v num">{paidPeriods} / {o.totalPeriods || '—'}</td>
              <td className="k">ชำระต้นแล้ว</td><td className="v num">{m(o.paidAmount)}</td>
            </tr>

            <tr className="sec"><td colSpan="6">ดอกเบี้ย</td></tr>
            <tr>
              <td className="k">คิดดอกเบี้ยถึง</td><td className="v mono">{d(o.lastIntDate)}</td>
              <td className="k">ประมาณการ/เดือน</td><td className="v num">{p(o.estPct)} / {m(o.estInterest)}</td>
              <td className="k">ดอกเบี้ย ณ วันที่จ่าย</td><td className="v num">{m(o.intAtPayDate)}</td>
            </tr>
            <tr>
              <td className="k">วันที่จ่าย</td><td className="v mono">{d(o.payDate)} · {o.intDays || 0} วัน</td>
              <td className="k">ดอกเบี้ยค้างชำระ</td><td className="v num" colSpan="3">{m(o.intOverdue)}</td>
            </tr>

            <tr className="sec"><td colSpan="6">การชำระขั้นต่ำ</td></tr>
            <tr>
              <td className="k">งวดชำระขั้นต่ำ</td><td className="v num">{o.minPeriods != null ? o.minPeriods : '—'}</td>
              <td className="k">งวดชำระแล้ว</td><td className="v num">{paidPeriods}</td>
              <td className="k">ต้องชำระอีก</td><td className="v num">{o.needPeriods ? o.needPeriods + ' งวด' : '—'}</td>
            </tr>
            <tr>
              <td className="k">เปอร์เซ็นต์ชำระขั้นต่ำ</td><td className="v num">{p(o.minPct)} / {m(o.minAmount)}</td>
              <td className="k">เปอร์เซ็นต์ชำระแล้ว</td><td className="v num">{p(o.paidPct)} / {m(o.paidAmount)}</td>
              <td className="k">ต้องชำระอีก (บาท)</td><td className="v num">{m(o.needMore)}</td>
            </tr>

            <tr className="sec"><td colSpan="6">การเรียกเก็บ</td></tr>
            <tr>
              <td className="k">รับชำระล่าสุด</td><td className="v mono">{lp ? d(lp.date) : '—'}</td>
              <td className="k">ชำระต้น</td><td className="v num">{lp ? m(lp.principal) : '—'}</td>
              <td className="k">ชำระดอกเบี้ย</td><td className="v num">{lp ? m(lp.interest) : '—'}</td>
            </tr>
            <tr>
              <td className="k">ใบเรียกเก็บเดือนนี้</td><td className="v mono">{bl ? d(bl.date) : 'ยังไม่ออก'}</td>
              <td className="k">เรียกเก็บต้น</td><td className="v num">{bl ? m(bl.principal) : '—'}</td>
              <td className="k">เรียกเก็บดอกเบี้ย</td><td className="v num">{bl ? m(bl.interest) : '—'}</td>
            </tr>
            {bl && <tr><td className="k">สถานะใบเรียกเก็บ</td><td className="v" colSpan="5">{billStatus}</td></tr>}
            <tr>
              <td className="k">ดอกเบี้ยคืน</td><td className="v num">{m(o.interestReturn)}</td>
              <td className="k">ยอดปิดสัญญา</td><td className="v num" colSpan="3"><b>{m(o.payoff)}</b> <span style={{ color: 'var(--text-secondary, rgba(0,0,0,.65))' }}>(คงเหลือ + ดอกเบี้ย ณ วันที่จ่าย + ดอกเบี้ยค้าง − ดอกเบี้ยคืน)</span></td>
            </tr>
          </tbody></table>
        </div>
      </div>
    </>
  );
}

// ── Popup "เปอร์เซ็นต์คงเหลือ" — สรุปเงินเดือนคงเหลือสุทธิ + รายการภาระผ่อน ──
function SalaryRemainModal({ data, onClose }) {
  const m = (v) => fmt.money(v);
  const totalNet = data.rows.reduce((a, r) => a + (Number(r.net) || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-pct-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>เปอร์เซ็นต์คงเหลือ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-pct-grid">
            <div className="lrq-pct-cell"><span className="k">เงินเดือน</span><span className="v num">{m(data.salary)}</span></div>
            <div className="lrq-pct-cell"><span className="k">รายได้อื่นๆ</span><span className="v num pos">{m(data.otherIncome)}</span></div>
            <div className="lrq-pct-cell"><span className="k">รายได้เพิ่มเติม</span><span className="v num">{m(data.extraIncome)}</span></div>

            <div className="lrq-pct-cell"><span className="k">ยอดเงินหัก</span><span className="v num neg">{m(data.totalDeduct)}</span></div>
            <div className="lrq-pct-cell"><span className="k">เงินหักเพิ่มเติม</span><span className="v num">{m(data.extraDeduct)}</span></div>
            <div className="lrq-pct-cell"><span className="k">ฉ.โอน</span><span className="v num">{m(data.transfer)}</span></div>

            <div className="lrq-pct-cell"><span className="k">คงเหลือ {data.reducePct.toFixed(2)}%</span><span className="v num">{m(data.reduceAmount)}</span></div>
            <div className="lrq-pct-cell"><span className="k">แต่ไม่น้อยกว่า</span><span className="v num">{m(data.minRemain)}</span></div>
            <div className="lrq-pct-cell"><span className="k">เงินเดือนคงเหลือสุทธิ</span><span className="v num pos">{m(data.netRemain)}</span></div>
          </div>

          <div className="search-card lrq-pct-tblcard">
            <div className="table-wrap">
              <table className="tbl lrq-pct-tbl">
                <thead>
                  <tr>
                    <th>รหัส</th><th>รายละเอียด</th><th>การชำระ</th>
                    <th className="num">ชำระ/งวด</th><th className="num">ดอกเบี้ยประมาณการ</th><th className="num">ยอดชำระสุทธิ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i}>
                      <td className="mono">{r.code}</td><td>{r.detail}</td><td>{r.pay}</td>
                      <td className="num">{m(r.perPeriod)}</td><td className="num">{m(r.interest)}</td><td className="num">{m(r.net)}</td>
                    </tr>
                  ))}
                  <tr className="lrq-pct-total">
                    <td>รวม</td><td /><td /><td /><td /><td className="num">{m(totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Popup "ยอดติดลบ" — ยอดค้างลูกหนี้ตัวแทนของสมาชิก (จากปุ่มดินสอ หักตัวแทน) ──
function AgentArrearsModal({ rows, member, onClose }) {
  const total = (rows || []).reduce((a, r) => a + (Number(r.amount) || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-agent-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>ยอดติดลบ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap">
            <table className="tbl lrq-agent-tbl">
              <thead>
                <tr><th>ประจำงวดที่</th><th>ยอดค้างตัวแทน</th></tr>
              </thead>
              <tbody>
                {(rows || []).length === 0 && <tr><td colSpan="2" className="center">- ไม่มียอดค้างตัวแทน -</td></tr>}
                {(rows || []).map((r, i) => (
                  <tr key={i}><td className="mono">{r.period}</td><td className="num">{fmt.money(r.amount)}</td></tr>
                ))}
                <tr className="lrq-agent-total">
                  <td className="neg">รวม</td><td className="num neg">{fmt.money(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// ── ฟิลด์หลักประกันที่ "แก้ไขได้" แยกตามประเภทหลักประกัน ──────────────
//  คอลัมน์: maxRight=สิทธิสูงสุด · remainRight=สิทธิค้ำคงเหลือ · amount=ยอดค้ำ
//           pct=%ค้ำ · sharePeriod=งวดหุ้น · shareAcc=ค่าหุ้นสะสม · salary=เงินเดือน
const COLL_EDITABLE = {
  person:  ['maxRight', 'remainRight', 'amount', 'pct', 'salary'],
  share:   ['maxRight', 'remainRight', 'amount', 'pct', 'sharePeriod', 'shareAcc'],
  deposit: ['amount', 'pct'],
  asset:   ['maxRight', 'remainRight', 'amount', 'pct'],
  bond:    ['maxRight', 'remainRight', 'amount', 'pct'],
};
// ── เซลล์ตัวเลขหลักประกัน: เป็น input เมื่อแก้ไขได้, เป็นข้อความเมื่อไม่ ──
//  ช่องที่กรอกได้จริง — ที่เหลือคำนวณ/ดึงจากทะเบียน (ยอดค้ำ = สิทธิค้ำคงเหลือ × %ค้ำ)
const COLL_INPUT = {
  person:  ['amount', 'pct'],
  share:   ['amount', 'pct'],
  deposit: ['amount', 'pct'],
  asset:   ['amount', 'pct'],
  bond:    ['maxRight', 'amount', 'pct'],
};
const COLL_PCT_KINDS = ['person', 'share', 'deposit', 'asset', 'bond'];
const lrqR2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
//  kind: 'money' | 'pct' | 'int'
function CollCell({ c, ckey, kind, onChange }) {
  const [txt, setTxt] = useState(null);
  const kd = c.view && c.view.kind;
  const shown = (COLL_EDITABLE[kd] || []).includes(ckey);
  const editable = (COLL_INPUT[kd] || []).includes(ckey);
  const val = c[ckey];
  const disp = kind === 'pct' ? (Number(val) || 0).toFixed(2) + '%'
             : kind === 'int' ? String(val || 0)
             : fmt.money(Number(val) || 0, 2);
  const cls = 'num' + (kind === 'pct' ? ' lrq-pct' : '');
  // ช่องที่ไม่เกี่ยวกับหลักประกันประเภทนี้ → เว้นว่าง (ไม่แสดงตัวเลข/ข้อมูลใด ๆ)
  if (!shown || !c.type) return <td className={cls}></td>;
  if (!editable) return <td className={cls} style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{disp}</td>;
  const parse = (s) => {
    const n = Number(String(s).replace(/[^0-9.]/g, '')) || 0;
    return kind === 'int' ? Math.round(n) : kind === 'pct' ? Math.min(100, n) : n;
  };
  // แก้ไขแบบข้อความระหว่างพิมพ์ → จัดรูปแบบทศนิยม 2 ตำแหน่งเมื่อออกจากช่อง
  return (
    <td className={cls}>
      <input className="cfg-input lrq-celled" value={txt != null ? txt : disp} title="แก้ไขข้อมูลได้"
             style={{ minWidth: kind === 'pct' ? 100 : 150, width: '100%', fontVariantNumeric: 'tabular-nums' }}
             onFocus={() => setTxt(kind === 'int' ? String(val || 0) : String(Number(val) || 0))}
             onBlur={() => setTxt(null)}
             onChange={e => { setTxt(e.target.value); onChange(parse(e.target.value)); }} />
    </td>
  );
}

// ── หลักประกัน — ประเภทให้เลือกต่อแถว (เหมือนกับตารางประกัน) ─────────
window.LR_COLL_KINDS = [
  { v: 'person',  l: 'คนค้ำประกัน', code: '01' },
  { v: 'share',   l: 'หุ้นค้ำประกัน', code: '02' },
  { v: 'deposit', l: 'เงินฝากค้ำประกัน', code: '03' },
  { v: 'asset',   l: 'หลักทรัพย์ค้ำประกัน', code: '04' },
  { v: 'bond',    l: 'พันธบัตร', code: '05' },
];

// ── Popup "เพิ่มหลักทรัพย์ใหม่" — ฟอร์มเต็มเหมือนเมนู "บันทึกหลักทรัพย์" ──
//  ใช้ LcForm ตัวเดียวกับหน้าทะเบียนหลักทรัพย์ — บันทึกเข้าทะเบียนจริงและใช้ค้ำได้ทันที
function QuickAddAssetModal({ memberCode, onAdd, onClose, onToast }) {
  const [rec, setRec] = useState(() => window.lcBlank('โฉนด'));
  const memberCollaterals = React.useMemo(() => (window.lcOf ? window.lcOf(memberCode) : []), [memberCode]);
  const price = Number(String(rec.summaryPrice || rec.coopPrice || rec.govPrice || rec.licensedPrice || '').replace(/[^0-9.]/g, '')) || 0;
  const valid = !!(rec.code && rec.code.trim()) && price > 0;
  const submit = () => { if (valid) onAdd(window.lcSaveNew(memberCode, rec)); };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lrq-sal-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>เพิ่มหลักทรัพย์ใหม่</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <window.LcForm rec={rec} onChange={setRec} memberCollaterals={memberCollaterals} onToast={onToast} />
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!valid} onClick={submit} title={valid ? '' : 'กรอกรหัสหลักทรัพย์และราคาประเมินก่อน'}><Icon name="plus" /> บันทึกและใช้ค้ำประกัน</button>
        </div>
      </div>
    </>
  );
}

// ── Popup "ที่มาของสิทธิ์การขอกู้" — MIN ของเงื่อนไขทั้งหมด ──────────
function EntitlementBreakdownModal({ C, f, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card coll-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>ที่มาของสิทธิ์การขอกู้</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            สิทธิ์การขอกู้ = ค่าน้อยที่สุด (MIN) ของเงื่อนไขที่เกี่ยวข้องตามค่าคงที่ของผลิตภัณฑ์
          </div>
          <div className="table-wrap"><table className="tbl lrq-tbl">
            <thead><tr><th>เงื่อนไข</th><th className="num">วงเงิน</th><th className="center">สถานะ</th></tr></thead>
            <tbody>
              {C.limitBreakdown.map((b, i) => (
                <tr key={i} className={b.binding ? 'lrq-sel' : ''}>
                  <td>{b.label}</td>
                  <td className="num">{fmt.money(b.value)}</td>
                  <td className="center">{b.binding ? <span className="pill bad">ติดเพดาน</span> : <span className="pill neutral">—</span>}</td>
                </tr>
              ))}
              <tr className="lrq-foot-row">
                <td className="right">สิทธิ์การขอกู้ (MIN)</td>
                <td className="num"><b className="lrq-blue">{fmt.money(C.entitlement)}</b></td>
                <td />
              </tr>
              <tr>
                <td className="right">จำนวนเงินขอกู้</td>
                <td className="num">{fmt.money(f.amount)}</td>
                <td className="center">{C.amountOk ? <span className="pill ok">ไม่เกินสิทธิ์</span> : <span className="pill bad">เกินสิทธิ์</span>}</td>
              </tr>
            </tbody>
          </table></div>
        </div>
        <div className="lrq-sal-foot">
          <button className="btn primary" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  การจ่ายเงินกู้ (เงินกู้พิเศษ) — แบ่งจ่ายเป็นงวด ๆ
//  ต่างจากใบคำขอกู้ปกติ: เลือก "รูปแบบการจ่ายเงินกู้" (งวดเดียว/หลายงวด)
//  โหมด "จ่ายหลายงวด" จัดกลุ่มแถวการจ่ายเป็น งวดที่ 1, 2, … และ งวดที่เหลือ
// ════════════════════════════════════════════════════════════════════
function SpecialPayoutSection({ f, setF, onToast }) {
  const mode = f.payoutMode || 'จ่ายหลายงวด';
  const multi = mode === 'จ่ายหลายงวด';
  const setMode = (v) => {
    setF(p => {
      let ds = p.disburses.map(r => ({ ...r }));
      if (v === 'จ่ายงวดเดียว') ds = ds.map(r => ({ ...r, installment: 1 }));
      else ds.forEach(r => { if (r.installment == null) r.installment = 1; });
      return { ...p, payoutMode: v, disburses: ds };
    });
    onToast && onToast('รูปแบบการจ่ายเงินกู้: ' + v);
  };
  const setDisburse = (idx, k, v) => setF(p => ({ ...p, disburses: p.disburses.map((r, j) => j === idx ? { ...r, [k]: v } : r) }));
  const delRow = (idx) => setF(p => ({ ...p, disburses: p.disburses.filter((_, j) => j !== idx) }));
  const addRow = (inst) => { setF(p => ({ ...p, disburses: [...p.disburses, { ...window.lrNewDisburse(), installment: inst }] })); onToast && onToast('เพิ่มแถวการจ่ายเงิน — กรอกรายละเอียดได้'); };
  const addInstallment = () => {
    const nums = f.disburses.filter(r => r.installment !== 'rest' && r.installment != null).map(r => Number(r.installment));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    setF(p => ({ ...p, disburses: [...p.disburses, { ...window.lrNewDisburse(), installment: next }] }));
    onToast && onToast(`เพิ่มงวดที่ ${next}`);
  };

  // เก็บดัชนีจริงของแต่ละแถวไว้เพื่อแก้ไข/ลบ
  const indexed = f.disburses.map((r, i) => ({ r, i }));
  const numOrder = [...new Set(indexed.filter(x => x.r.installment !== 'rest').map(x => Number(x.r.installment) || 1))].sort((a, b) => a - b);
  const groups = multi
    ? [...numOrder.map(n => ({ key: n, label: 'งวดที่ ' + n, rows: indexed.filter(x => (Number(x.r.installment) || 1) === n && x.r.installment !== 'rest') })),
       { key: 'rest', label: 'งวดที่เหลือ', rows: indexed.filter(x => x.r.installment === 'rest') }]
    : [{ key: 'all', label: null, rows: indexed }];

  const NEED = {
    'โอนเงินฝากสหกรณ์': ['acct'],
    'โอนเงินฝากธนาคาร': ['bankAcc', 'bankFrom', 'branch'],
    'เงินสด': [],
    'ธนาณัติออนไลน์': ['bankAcc', 'postcode', 'payer'],
    'แคชเชียร์เช็ค': ['bankAcc', 'bankFrom', 'branch', 'branchTo', 'payer'],
    'เช็ค': ['bankAcc', 'bankFrom', 'branchTo', 'payer'],
    'ตั๋วแลกเงิน': ['bankAcc', 'bankFrom', 'branch', 'branchTo', 'payer'],
    'รอเจ้าหน้าที่เบิกจ่าย': [],
  };
  const REST_METHODS = ['โอนเงินฝากสหกรณ์', 'รอเจ้าหน้าที่เบิกจ่าย'];
  // ส่งแถว "งวดที่เหลือ" ไปให้เมนูเบิกเงินกู้ค้างจ่ายดึงไปใช้ต่อ
  React.useEffect(() => {
    if (window.lpoSaveSpecialRest) window.lpoSaveSpecialRest(f.reqNo, f.disburses.filter(r => r.installment === 'rest' && r.method));
  }, [f.reqNo, f.disburses]);
  const allAccts = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : []).filter(a => a.status === 'active');
  const mc = String(f.member.code || '').replace(/\D/g, '').slice(-5);
  const own = allAccts.filter(a => a.member === mc);
  const accts = own.length ? own : allAccts;

  const renderCells = (r, idx) => {
    const picked = !!r.method;
    const need = NEED[r.method] || [];
    const on = (fl) => picked && need.includes(fl);
    const dash = <span className="lrq-dash">-</span>;
    const txt = (fl, ph, mono) => on(fl)
      ? <input className={"cfg-input sm" + (mono ? " mono" : "")} value={r[fl] ?? ''} placeholder={ph} onChange={e => setDisburse(idx, fl, e.target.value)} />
      : dash;
    const money = (fl) => picked
      ? <input className="cfg-input sm lrq-num" style={{ width: '100%', minWidth: 0 }} inputMode="decimal" value={r[fl] ?? ''} placeholder="0.00" onChange={e => setDisburse(idx, fl, e.target.value)} />
      : dash;
    if (!picked) return <td colSpan={11} className="lrq-pick-hint"><Icon name="info" size={12} /> เลือกประเภทการจ่ายเงินกู้ก่อน ระบบจะเปิดช่องกรอกข้อมูลที่เกี่ยวข้อง</td>;
    return (
      <>
        <td className="mono">
          {on('acct') ? (
            <select className="cfg-input lrq-rowsel" value={r.accNo || ''} onChange={e => setDisburse(idx, 'accNo', e.target.value)}>
              <option value="">--- เลือกบัญชีเงินฝาก ---</option>
              {accts.map(a => <option key={a.accNo} value={a.accNo}>{a.accNo} · {a.type}{own.length ? '' : ' · ' + a.name}</option>)}
            </select>
          ) : on('bankAcc') ? txt('bankAcc', (r.method === 'เช็ค' || r.method === 'แคชเชียร์เช็ค') ? 'เลขที่เช็ค' : r.method === 'ตั๋วแลกเงิน' ? 'เลขที่ตั๋วแลกเงิน' : r.method === 'ธนาณัติออนไลน์' ? 'เลขที่ธนาณัติ' : 'เลขที่บัญชีธนาคาร', true) : dash}
        </td>
        <td>{txt('bankFrom', 'ธนาคารต้นทาง')}</td>
        <td>{txt('branch', 'สาขาธนาคาร')}</td>
        <td>{txt('branchTo', 'สาขาปลายทาง')}</td>
        <td className="mono">{txt('postcode', 'รหัสไปรษณีย์', true)}</td>
        <td>{txt('payer', 'ผู้สั่งจ่าย')}</td>
        <td className="num">{money('fee')}</td>
        <td className="num">{money('service')}</td>
        <td className="num">{money('tax')}</td>
        <td className="num mono">{fmt.money((Number(r.fee) || 0) + (Number(r.service) || 0) + (Number(r.tax) || 0))}</td>
        <td className="num">{money('net')}</td>
      </>
    );
  };

  const netTotal = f.disburses.reduce((a, r) => a + (Number(r.net) || 0), 0);

  return (
    <div className="search-card lrq-sheet">
      <div className="lrq-sec-title">การจ่ายเงินกู้
        <span className="lrq-sec-sub" style={{ marginLeft: 8 }}>· เงินกู้พิเศษจ่ายแบ่งเป็นงวด ๆ</span>
      </div>
      <div className="lrq-grid c3" style={{ marginBottom: 6 }}>
        <LrqField label="รูปแบบการจ่ายเงินกู้" bound>
          <select className="cfg-input" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="จ่ายงวดเดียว">จ่ายงวดเดียว</option>
            <option value="จ่ายหลายงวด">จ่ายหลายงวด</option>
          </select>
        </LrqField>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl lrq-tbl">
          <thead><tr>
            <th style={{ minWidth: 200 }}>จ่ายเงินกู้เป็น</th><th>เลขที่บัญชี,เช็ค,ตั๋วแลกเงิน</th><th>ธนาคารต้นทาง</th><th>สาขาธนาคาร</th>
            <th>สาขาปลายทาง</th><th>รหัสไปรษณีย์ปลายทาง</th><th>ชื่อนามสกุลผู้สั่งจ่าย</th>
            <th className="num" style={{ width: 90, minWidth: 90 }}>ค่าธรรมเนียม</th><th className="num" style={{ width: 90, minWidth: 90 }}>ค่าบริการ</th><th className="num" style={{ width: 90, minWidth: 90 }}>ภาษี</th>
            <th className="num">รวมค่าโอน</th><th className="num" style={{ width: 130, minWidth: 130 }}>จ่ายสุทธิ</th><th style={{ width: 40 }} />
          </tr></thead>
          <tbody>
            {groups.map(g => (
              <React.Fragment key={g.key}>
                {multi && <tr className="lrq-inst-band"><td colSpan={13}>{g.label}</td></tr>}
                {g.rows.map(({ r, i }) => (
                  <tr key={i}>
                    <td>
                      <select className="cfg-input lrq-rowsel" value={r.method || ''} onChange={e => setDisburse(i, 'method', e.target.value)}>
                        <option value="">--- โปรดเลือก ---</option>
                        {(g.key === 'rest' ? REST_METHODS : window.LR_DISBURSE_METHODS).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </td>
                    {renderCells(r, i)}
                    <td className="center">{lrqTrash(() => delRow(i))}</td>
                  </tr>
                ))}
                <tr className="lrq-inst-add"><td colSpan={13}>
                  <button className="btn text sm lrq-addbtn" onClick={() => addRow(g.key === 'all' ? 1 : g.key)}><Icon name="plus" /> เพิ่มข้อมูล</button>
                </td></tr>
              </React.Fragment>
            ))}
          </tbody>
          <tfoot><tr className="lrq-foot-row">
            <td className="right" colSpan={11}>รวมจ่ายสุทธิทุกงวด</td>
            <td className="num"><b className="lrq-blue">{fmt.money(netTotal)}</b></td><td />
          </tr></tfoot>
        </table>
      </div></div>
      {multi && <button className="btn dashed sm lrq-addbtn" onClick={addInstallment}><Icon name="plus" /> เพิ่มงวด</button>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ฟอร์มสร้างใบคำขอกู้เงิน
// ════════════════════════════════════════════════════════════════════
// ── Kebab menu (จุด 3 จุด แนวตั้ง) — รวมปุ่มตาราง/พิมพ์ของใบคำขอกู้ ──
function LrqKebabMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);
  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" className="btn sm" aria-haspopup="menu" aria-expanded={open}
              onClick={() => setOpen(v => !v)} title="เพิ่มเติม"
              style={{ background: '#fff', borderColor: '#d9d9d9', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2, lineHeight: 0 }}>
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'currentColor' }} />
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'currentColor' }} />
          <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'currentColor' }} />
        </span>
        เพิ่มเติม
      </button>
      {open && (
        <div role="menu" style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, background: '#fff',
          border: '1px solid rgba(0,0,0,.1)', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,.15)',
          padding: 4, minWidth: 'max-content', whiteSpace: 'nowrap',
        }}>
          {items.map(b => (
            <button key={b.label} type="button" role="menuitem"
                    onClick={() => { setOpen(false); b.fn && b.fn(); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'transparent',
                      padding: '7px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 13,
                      color: 'rgba(0,0,0,.88)', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafafa'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              {b.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}

// ── ประวัติของใบคำขอนี้ — สร้างไทม์ไลน์จากสถานะและข้อมูลคำขอ ──
window.lrqReqHistory = (req) => {
  if (!req) return [];
  const S = window.LR_CRM_STATUS || {};
  const st = req.status;
  const after = (s) => (S[s] || {}).label || s;
  const h = [];
  h.push({ action: 'create', ts: req.sentAt, user: 'ระบบ ' + (req.channel || 'CRM'),
    summary: 'รับคำขอกู้เข้าระบบ — ' + (req.crmNo || ''),
    changes: [{ field: 'สถานะคำขอ', before: '—', after: after('pending') }] });
  if (st !== 'pending') {
    h.push({ action: 'update', ts: req.sentAt, user: 'มนตรี ศรีสุข',
      summary: 'สร้างและบันทึกแบบร่างใบคำขอ ' + (req.reqNo || ''),
      changes: [{ field: 'สถานะคำขอ', before: after('pending'), after: after('draft') }] });
  }
  if (st === 'docreq') {
    h.push({ action: 'update', ts: req.sentAt, user: 'มนตรี ศรีสุข',
      summary: 'แจ้งขอเอกสารเพิ่มเติมจากสมาชิก',
      changes: [{ field: 'เอกสารที่ขอเพิ่ม', before: '—', after: (req.draftDocs || []).join(', ') || '—' }] });
  }
  if (['waitapprove', 'special', 'rejected', 'approved', 'paid'].includes(st)) {
    h.push({ action: 'update', ts: req.sentAt, user: 'มนตรี ศรีสุข',
      summary: 'ส่งคำขอเข้าสู่กระบวนการอนุมัติ',
      changes: [{ field: 'สถานะคำขอ', before: after('draft'), after: after('waitapprove') }] });
  }
  if (st === 'special') {
    h.push({ action: 'update', ts: req.specialAt || req.sentAt, user: req.specialBy || '—',
      summary: 'ส่งเข้าพิจารณาอนุมัติกรณีพิเศษ — ' + (req.specialReason || ''),
      changes: [{ field: 'สถานะคำขอ', before: after('waitapprove'), after: after('special') }] });
  }
  if (st === 'rejected') {
    h.push({ action: 'reject', ts: req.rejectAt || req.sentAt, user: req.rejectBy || '—',
      summary: 'ไม่อนุมัติคำขอ — ' + (req.rejectNote || ''),
      changes: [{ field: 'สถานะคำขอ', before: after('waitapprove'), after: after('rejected') }] });
  }
  if (st === 'approved' || st === 'paid') {
    h.push({ action: 'approve', ts: req.approveAt || req.sentAt, user: req.approveBy || '—',
      summary: 'อนุมัติคำขอกู้',
      changes: [{ field: 'สถานะคำขอ', before: after('waitapprove'), after: after('approved') }] });
  }
  if (st === 'paid') {
    h.push({ action: 'approve', ts: (req.payAt ? req.payAt + ' 00:00' : req.sentAt), user: req.payBy || 'ฝ่ายการเงิน',
      summary: 'อนุมัติจ่ายเงินคำขอกู้',
      changes: [{ field: 'สถานะคำขอ', before: after('approved'), after: after('paid') }] });
  }
  return h;
};

// ── Modal ประวัติของใบคำขอ (โครงเดียวกับประวัติประเภทเงินกู้) ──
function LrqReqHistoryModal({ hist, reqNo, memberName, onClose, title, subtitle }) {
  const rows = hist || [];
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const tsLabel = (ts) => {
    const s = String(ts || '').replace('T', ' ');
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})(?:\s(\d{2}):(\d{2}))?/);
    if (!m) return s;
    return Number(m[3]) + ' ' + (TH_MON[Number(m[2]) - 1] || '') + ' ' + (Number(m[1]) + 543)
      + (m[4] ? ' ' + m[4] + ':' + m[5] + ' น.' : '');
  };
  const meta = (a) => a === 'create' ? { label: 'สร้างข้อมูล', color: 'var(--success)', icon: 'plus' }
    : a === 'approve' ? { label: 'อนุมัติ', color: 'var(--success)', icon: 'check' }
    : a === 'reject' ? { label: 'ไม่อนุมัติ', color: 'var(--danger)', icon: 'close' }
    : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxWidth: '94vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title || 'ประวัติการทำรายการ — ใบคำขอกู้'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{subtitle || ([reqNo, memberName].filter(Boolean).join(' · ') + ' — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบ')}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {rows.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {rows.map((h, i) => {
              const m = meta(h.action);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < rows.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={m.icon} size={14} />
                    </div>
                    {i < rows.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{tsLabel(h.ts)}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                    {h.changes && h.changes.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {h.changes.map((c, ci) => (
                          <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                            <span className="muted" style={{ minWidth: 110 }}>{c.field}</span>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                            <Icon name="chevRight" size={11} />
                            <span style={{ fontWeight: 600 }}>{c.after}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ── ปุ่มประวัติการใช้งาน — เปิด modal ประวัติการทำรายการ ──
function LrqHistoryButton({ memberCode, memberName, reqNo }) {
  const [open, setOpen] = useState(false);
  const Drawer = window.TxHistoryDrawer;
  return (
    <>
      <button className="btn text sm" onClick={() => setOpen(true)}>
        <Icon name="history" /> ประวัติการใช้งาน
      </button>
      {open && Drawer && (
        <Drawer
          memberCode={memberCode}
          memberName={memberName}
          modules={['สินเชื่อ — อนุมัติสินเชื่อ', 'สินเชื่อ — ใบคำขอกู้']}
          title={'ประวัติการทำรายการ' + (reqNo ? ' · ' + reqNo : '')}
          onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function LoanRequestForm({ initial, onBack, onToast, reviewMode, statusBadge, decision, onApprove, onReject, approveLabel, rejectLabel, rejectIcon, special, onSpecial, viewOnly, reqMeta, pageMode }) {
  const audit = React.useContext(window.AuditContext);
  const [f, setF] = useState(() => initial || JSON.parse(JSON.stringify(window.LR_DEMO)));
  const [memberModal, setMemberModal] = useState(false);
  const [salaryModal, setSalaryModal] = useState(false);
  const [collModal, setCollModal] = useState(null);
  const [assetAddModal, setAssetAddModal] = useState(null);
  const [assetsBump, setAssetsBump] = useState(0);
  const [breakdownModal, setBreakdownModal] = useState(false);
  const [printType, setPrintType] = useState(null);
  const [docReqModal, setDocReqModal] = useState(false);
  const [footOpen, setFootOpen] = useState(true);   // ซ่อน/แสดงแถบปุ่มล่าง
  const [docReqSummary, setDocReqSummary] = useState(null); // {docs, note} — เปิด popup สรุป
  const [docReqDraft, setDocReqDraft] = useState(null);      // {docs, note} — สถานะร่าง/ขอเอกสาร ที่ค้างอยู่
  const [agentModal, setAgentModal] = useState(false);       // popup "ยอดติดลบ" (หักตัวแทน)
  const [pctModal, setPctModal] = useState(false);           // popup "เปอร์เซ็นต์คงเหลือ"
  const [rateTierModal, setRateTierModal] = useState(false); // popup "ตารางอัตราดอกเบี้ย"
  const [locked, setLocked] = useState(!!viewOnly);           // หน้าอ่าน (view mode / หลังกดยกเลิก)
  const [cancelled, setCancelled] = useState(false);          // ล็อกเพราะกดยกเลิกใน edit mode
  const [reqHist, setReqHist] = useState(false);              // modal ประวัติของใบคำขอ
  const [offsetModal, setOffsetModal] = useState(null);      // popup "รายละเอียดหักกลบ"
  const [depSearch, setDepSearch] = useState(null);          // popup ค้นหาบัญชีเงินฝาก (index แถวหลักประกัน)
  const [openModal, setOpenModal] = useState(false);         // popup "Open" — คำขอกู้รอจ่ายเงิน
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // ── ล้างหน้าจอ: ลบข้อมูลที่กรอกไว้ทุกฟิลด์ เพื่อเริ่มกรอกใหม่ ──────
  const lrBlank = (v) => {
    if (Array.isArray(v)) return v.map(lrBlank);
    if (v && typeof v === 'object') {
      const o = {};
      Object.keys(v).forEach(k => { o[k] = lrBlank(v[k]); });
      return o;
    }
    if (typeof v === 'number') return 0;
    if (typeof v === 'boolean') return false;
    return '';
  };
  const [clearConfirm, setClearConfirm] = React.useState(false);
  const clearScreen = () => setClearConfirm(true);
  const doClearScreen = () => {
    setClearConfirm(false);
    setF(lrBlank(JSON.parse(JSON.stringify(window.LR_DEMO))));
    setMemberModal(false); setSalaryModal(false); setCollModal(null);
    setAssetAddModal(null); setBreakdownModal(false); setPrintType(null);
    setDocReqModal(false); setDocReqSummary(null); setDocReqDraft(null);
    setAgentModal(false); setPctModal(false); setOpenModal(false); setRateTierModal(false); setOffsetModal(null);
    onToast && onToast('ล้างหน้าจอแล้ว — กรอกข้อมูลใหม่ได้ทันที');
  };
  const setInc = (k, v) => setF(p => ({ ...p, income: { ...p.income, [k]: v } }));
  const setColl = (i, k, v) => setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => {
    if (j !== i) return c;
    const n = { ...c, [k]: v };
    const isPctKind = COLL_PCT_KINDS.includes(c.view && c.view.kind);
    const kd = c.view && c.view.kind;
    // เงินฝากค้ำ: เจ้าหน้าที่ไม่เห็นยอดเงินในบัญชี → ไม่จำกัดด้วยสิทธิคงเหลือ (ระบบตรวจยอดเงินฝากเอง)
    const remain = () => kd === 'deposit' ? Infinity : (Number(n.remainRight) || 0);
    if (k === 'maxRight' && kd === 'bond') n.remainRight = v;
    if (k === 'ref' && kd === 'deposit') {
      const acc = window.lrDepositAccount ? window.lrDepositAccount(v) : null;
      n.detail = acc ? `${acc.type} · ${acc.name}` : '';
    }
    const loan = Number(p.amount) || 0;
    if (isPctKind && k === 'amount') {
      // แก้ยอดค้ำ → ไม่เกินสิทธิค้ำคงเหลือ และคำนวณ %ค้ำกลับ (เทียบจำนวนเงินขอกู้)
      n.amount = lrqR2(Math.min(remain(), Number(v) || 0));
      n.pct = loan > 0 ? lrqR2(n.amount / loan * 100) : 0;
      n.pctManual = true; n.amountManual = true;
    } else if (isPctKind && (k === 'pct' || k === 'maxRight')) {
      if (k === 'pct') { n.pctManual = true; n.amountManual = false; }
      n.amount = lrqR2(Math.min(remain(), loan * (Number(n.pct) || 0) / 100));
    }
    return n;
  }) }));
  const setDisburse = (i, k, v) => setF(p => ({ ...p, disburses: p.disburses.map((r, j) => j === i ? { ...r, [k]: v } : r) }));
  const setIns = (i, k, v) => setF(p => ({ ...p, insurances: p.insurances.map((r, j) => j === i ? { ...r, [k]: v, ...(k === 'amount' ? { amountEdited: true } : {}) } : r) }));
  // ── ประกันที่ประเภทเงินกู้บังคับ (ประกันชีวิต / ประกันหนีหนี้) → ระบบตั้งแถวให้ครบทุกกรณี ──
  useEffect(() => {
    const pr = window.lrFindProduct(f.productId);
    const req = window.lrRequiredInsurances(pr && pr.settings, f.amount);
    setF(p => {
      const loan = Number(p.amount) || 0;
      let changed = false;
      let rows = (p.insurances || []).map(r => {
        const need = req.some(t => t.type === r.type);
        if (!!r.required !== need) { changed = true; r = { ...r, required: need }; }
        if (need && !r.amountEdited && Number(r.amount) !== loan) { changed = true; r = { ...r, amount: loan }; }
        return r;
      });
      req.forEach(t => {
        if (rows.some(r => r.type === t.type)) return;
        const blank = rows.findIndex(r => !r.type && !r.company && !Number(r.amount));
        const row = { ...window.lrNewInsurance(), type: t.type, amount: loan, required: true };
        if (blank >= 0) rows = rows.map((r, j) => j === blank ? row : r); else rows = [...rows, row];
        changed = true;
      });
      return changed ? { ...p, insurances: rows } : p;
    });
  }, [f.productId, f.amount]);
  // dropdown ในเซลล์ตาราง — รองรับทั้ง array ของ string และ {v,l}
  const optSelect = (value, options, onChange, placeholder) => (
    <select className="cfg-input lrq-rowsel" value={value || ''} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.v;
        const l = typeof o === 'string' ? o : o.l;
        return <option key={v} value={v}>{lrqT(l)}</option>;
      })}
    </select>
  );

  const typeOptions = React.useMemo(() => window.lrLoanTypeOptions(), []);
  const product = window.lrFindProduct(f.productId);
  // โครงการเงินกู้ (ค่าคงที่ › โครงการเงินกู้) — ตามประเภทเงินกู้ที่เลือก + ช่วงเวลาขอกู้
  const projectOptionsAll = React.useMemo(
    () => (window.lpjOptionsForType ? window.lpjOptionsForType(f.productId, f.reqDate, f.member && f.member.code) : []),
    [f.productId, f.reqDate, f.member && f.member.code]);
  // โครงการเงินกู้หลัก (dropdown) — ดึงจากค่าคงที่ › โครงการเงินกู้
  const mainProjects = React.useMemo(() => (window.lpjLoad ? window.lpjLoad() : []).filter(p => p.enabled && (p.loanTypeIds || []).length
    && !!special === p.loanTypeIds.some(id => { const lp = window.lrFindProduct(id); return lp && lp.group === 'special'; })), [special]);
  const pickedMain = mainProjects.find(p => p.id === f.lpjProjectId)
    || (f.productId && !f.lpjProjectId ? mainProjects.find(p => (p.loanTypeIds || []).includes(f.productId)) : null) || null;
  const projectOptions = pickedMain ? projectOptionsAll.filter(o => o.projectId === pickedMain.id) : projectOptionsAll;
  // โครงการเป็น "อ่านอย่างเดียว" — ระบบดึงให้อัตโนมัติจากโครงการที่เปิดรับคำขอ ณ วันที่ขอกู้
  const eligibleProjects = projectOptions.filter(o => o.active);
  const autoProject = eligibleProjects.find(o => o.remain > 0) || eligibleProjects[0] || null;
  const projectPick = projectOptions.find(o => o.v === f.projectKey) || null;
  const autoKey = autoProject ? autoProject.v : '';
  useEffect(() => {
    setF(p => (projectOptions.some(o => o.v === p.projectKey) || p.projectKey === autoKey ? p : { ...p, projectKey: autoKey }));
  }, [autoKey, projectOptions]);
  const derived = window.lrDeriveFromProduct(product, f.amount, f.reqDate);

  // ── เครื่องคำนวณกลาง — ผูกค่าคงที่ของผลิตภัณฑ์ทั้งหมด (Flow 15 ขั้น) ──
  const C0 = window.lrCalc(f);
  const projectFull = !!(projectPick && projectPick.memberChecked && projectPick.remain <= 0);
  const projCheck = projectFull ? { id: 'project-quota', ok: false, label: 'โครงการเงินกู้',
    detail: `ผู้กู้ ${f.member.code} ใช้สิทธิ์โครงการนี้ครบแล้ว (${projectPick.memberUsed}/${projectPick.maxRights} ครั้ง) — ยื่นซ้ำไม่ได้` } : null;
  const C = projCheck ? { ...C0, checks: [projCheck, ...C0.checks], failed: [projCheck, ...C0.failed], canSubmit: false, instantApprove: false } : C0;
  const netRate = C.netRate;
  const maxPeriods = C.periodsCap;       // งวดสูงสุดตามสิทธิ์ (ตาราง ∩ เกษียณ)
  const sendable = C.sendable;
  const inst = C.inst;
  const entitlement = C.entitlement;
  const otherDeductTotal = C.otherDeductTotal;
  const oldDebtPay = C.oldDebtPay;
  const oldDebtDeduct = C.oldDebtDeduct;
  const offsetTotal = C.offsetTotal;
  const netReceive = C.netDisburse;       // จ่ายสุทธิ = อนุมัติ − หักกลบ − ค่าโอน − หักอื่น

  const ready = !!(f.member && f.member.code) && !!f.productId;
  // วันที่เริ่มเก็บ — คำนวณจากวันที่ทำรายการเทียบรอบประมวลผลเก็บเงิน
  const collectSch = window.lrCollectSchedule(f.reqDate || window.DEPOSIT_WORKING_DATE);
  // เลื่อนวันที่เริ่มเก็บออกไปได้ (collectSkip งวด) → ระบบหักต้น+ดอกเบี้ยล่วงหน้าตามจำนวนงวดที่เลื่อน
  const collectEnd = (skip) => {
    if (!collectSch) return '';
    const [y, m] = collectSch.billDate.split('-').map(Number);
    const d = new Date(y, m - 1 + skip + 1, 0);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const collectSkip = Number(f.collectSkip) || 0;
  const collectStart = collectEnd(collectSkip);
  React.useEffect(() => {
    if (collectSch && f.receiveDate !== collectStart) setF(p => ({ ...p, receiveDate: collectStart }));
  }, [collectStart]);
  const inc = f.income;
  const incomeTotal = C.incomeTotal;
  const remain = C.salaryRemain;          // เงินเดือนคงเหลือ (รวมงวดใหม่)
  const pctRemain = C.pctRemain;

  // รวมหลักประกัน — นับเฉพาะช่องที่ใช้กับหลักประกันประเภทนั้น (ที่แสดงผลจริง)
  const collApplies = (c, k) => (COLL_EDITABLE[c.view && c.view.kind] || []).includes(k);
  const colSum = f.collaterals.reduce((a, c) => ({
    maxRight: a.maxRight + (collApplies(c, 'maxRight') ? c.maxRight : 0),
    remainRight: a.remainRight + (collApplies(c, 'remainRight') ? c.remainRight : 0),
    amount: a.amount + (collApplies(c, 'amount') ? c.amount : 0),
    shareAcc: a.shareAcc + (collApplies(c, 'shareAcc') ? c.shareAcc : 0),
    salary: a.salary + (collApplies(c, 'salary') ? c.salary : 0),
    sharePeriod: a.sharePeriod + (collApplies(c, 'sharePeriod') ? (Number(c.sharePeriod) || 0) : 0),
    pctSum: a.pctSum + (collApplies(c, 'pct') ? (Number(c.pct) || 0) : 0),
  }), { maxRight: 0, remainRight: 0, amount: 0, shareAcc: 0, salary: 0, sharePeriod: 0, pctSum: 0 });

  // ── ยอดค้ำ = สิทธิค้ำคงเหลือ × %ค้ำ — ถ้ายังไม่ระบุ %ค้ำเอง ระบบตั้ง % ให้ครอบคลุมยอดกู้ (ไม่เกิน 100%) ──
  const collSig = f.collaterals.map(c => [c.remainRight || 0, c.pct || 0, c.pctManual ? 1 : 0, c.amountManual ? c.amount : ''].join(':')).join(',');
  useEffect(() => {
    setF(p => {
      let changed = false;
      const loan = Number(p.amount) || 0;
      const collaterals = p.collaterals.map(c => {
        if (!c.type || !COLL_PCT_KINDS.includes(c.view && c.view.kind)) return c;
        const isDep = c.view.kind === 'deposit';
        if (isDep && !c.amountManual && !c.pctManual) return c;   // เงินฝาก: เจ้าหน้าที่ระบุยอด/% เอง
        const remain = isDep ? Infinity : (Number(c.remainRight) || 0);
        let pct, amount;
        // %ค้ำ = ยอดค้ำ ÷ จำนวนเงินขอกู้ × 100
        if (c.amountManual) { amount = lrqR2(Math.min(remain, Number(c.amount) || 0)); pct = loan > 0 ? lrqR2(amount / loan * 100) : 0; }
        else if (c.pctManual) { pct = Math.min(100, Number(c.pct) || 0); amount = lrqR2(Math.min(remain, loan * pct / 100)); }
        else { amount = lrqR2(Math.min(remain, loan)); pct = loan > 0 ? lrqR2(amount / loan * 100) : 0; }
        if (pct === c.pct && amount === c.amount) return c;
        changed = true;
        return { ...c, pct, amount };
      });
      return changed ? { ...p, collaterals } : p;
    });
  }, [f.amount, collSig]);

  // ── เลือกประเภทเงินกู้ → ดึงค่าคงที่ของผลิตภัณฑ์มาตั้งต้นทั้งหมด ──
  const pickProduct = (id) => {
    const p = window.lrFindProduct(id);
    const ss = (p && p.settings) || {};
    setF(prev => ({
      ...prev, productId: id,
      projectKey: '',
      purpose: ss.defaultPurpose || prev.purpose,
      rateAdd: 0, rateReduce: 0,
    }));
    const d = window.lrDeriveFromProduct(p, f.amount, f.reqDate);
    onToast && onToast(
      `ดึงค่าคงที่ ${p ? p.code + ' — ' + p.name : ''} · ดอกเบี้ย ${d ? d.rate.toFixed(2) : 0}% · งวดสูงสุด ${d ? d.maxPeriods : 0} · ${ss.needCollateral ? 'ต้องมีหลักประกัน' : 'ไม่บังคับหลักประกัน'}`
    );
  };

  // ── เพิ่ม/แก้รายการในตาราง ──
  const addCollateral = () => { setF(p => ({ ...p, collaterals: [...p.collaterals, window.lrNewBlankCollateral()] })); onToast && onToast('เพิ่มแถวหลักประกัน — เลือกประเภทและกรอกรายละเอียดได้');
  };
  const setCollType = (i, kind) => {
    const k = window.LR_COLL_KINDS.find(x => x.v === kind);
    setF(p => {
      const extra = kind === 'share'
        ? { ref: p.member.code, detail: 'ทุนเรือนหุ้นของ ' + p.member.name + ' (ผู้กู้)', shareOwner: p.member.name,
            maxRight: p.member.shareCapital, remainRight: p.member.shareCapital,
            amount: p.member.shareCapital, shareAcc: p.member.shareCapital }
        : {};
      return { ...p, collaterals: p.collaterals.map((c, j) => j === i ? {
        ...c, type: k ? k.l : '', code: k ? k.code : '', ref: '', detail: '', assetId: '', surveyOk: false,
        maxRight: 0, remainRight: 0, amount: 0, pct: 0, pctManual: false, amountManual: false,
        view: { kind, typeName: k ? k.l : '', rows: [] },
        ...extra,
      } : c) };
    });
  };
  const pickCollGuarantor = (i, m) => {
    const g = (window.GUAR_MEMBERS || []).find(x => x.code === m.code);
    const salary = g ? g.salary : 0;
    const maxRight = salary * 60;   // สิทธิ์ค้ำสูงสุด = 60 เท่าเงินเดือน (เดืียวกับสิทธิ์การกู้โดยที่ว)
    setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => j === i ? {
      ...c, ref: m.code, detail: g ? g.name : m.name, salary,
      maxRight, remainRight: maxRight, pctManual: false, amountManual: false,
    } : c) }));
  };
  const regAssets = React.useMemo(() => (window.lcOf ? window.lcOf(f.member.code) : [])
    .map(a => ({ ...a, _sv: window.lrAssetSurveyInfo(a) })), [f.member.code, assetsBump]);
  const applyAssetToRow = (i, a) => {
    if (!a) { setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => j === i ? { ...c, assetId: '', ref: '', detail: '', surveyOk: false, maxRight: 0, remainRight: 0, amount: 0, pct: 0 } : c) })); return; }
    const sv = a._sv || window.lrAssetSurveyInfo(a);
    if (!sv.ok) { onToast && onToast(`ใช้ค้ำไม่ได้ — ${sv.reason} (ดำเนินการที่เมนูสำรวจหลักทรัพย์)`); return; }
    const loc = a.locProvince || a.landOfficeProvince || '';
    setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => j === i ? {
      ...c, assetId: a.id, ref: a.code || a.titleNo || a.id, surveyOk: true,
      detail: [a.type, a.titleNo ? 'เลขที่โฉนด ' + a.titleNo : '', loc].filter(Boolean).join(' · '),
      summaryPrice: sv.summary, maxGuarPct: sv.maxGuarPct, guarUsed: sv.used,
      maxRight: sv.maxRight, remainRight: sv.remainRight, pctManual: false, amountManual: false,
    } : c) }));
    onToast && onToast(`สิทธิสูงสุด (สรุปราคาประเมิน) ฿${fmt.money(sv.maxRight)} · สิทธิค้ำคงเหลือ ฿${fmt.money(sv.remainRight)}`);
  };
  // หุ้นค้ำประกัน — ค่าเริ่มต้นเป็นหุ้นของผู้กู้ เลือกหุ้นของสมาชิกอื่นได้
  const pickCollShare = (i, m) => setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => {
    if (j !== i) return c;
    if (!m) return { ...c, ref: '', detail: '', shareOwner: '', maxRight: 0, remainRight: 0, amount: 0, pct: 0, shareAcc: 0 };
    const own = !!p.member && m.code === p.member.code;
    const g = (window.GUAR_MEMBERS || []).find(x => x.code === m.code);
    const cap = own ? (Number(p.member.shareCapital) || (g && g.share ? g.share.capital : 0))
                    : (g && g.share ? Number(g.share.capital) || 0 : 0);
    const name = (g && g.name) || m.name || '';
    return { ...c, ref: m.code, shareOwner: name,
      detail: 'ทุนเรือนหุ้นของ ' + name + (own ? ' (ผู้กู้)' : ''),
      maxRight: cap, remainRight: cap, shareAcc: cap,
      sharePeriod: own ? (c.sharePeriod || 0) : 0,
      pctManual: false, amountManual: false };
  }) }));
  // เลือกบัญชีเงินฝากค้ำ — ของผู้กู้ หรือของสมาชิกอื่น (ยอดค้ำ/%ค้ำ เจ้าหน้าที่ระบุเอง)
  const pickDeposit = (i, acc) => setF(p => ({ ...p, collaterals: p.collaterals.map((c, j) => {
    if (j !== i) return c;
    if (!acc) return { ...c, ref: '', detail: '', view: { ...c.view, rows: [] } };
    const own = window.lrIsOwnAccount(acc, p.member);
    return { ...c, ref: acc.accNo,
      detail: `${acc.type} · ${acc.name}${own ? ' (ผู้กู้)' : ' (สมาชิก ' + acc.member + ')'}`,
      view: { ...c.view, rows: [{ accNo: acc.accNo, accName: acc.name, memberNo: acc.member, memberName: acc.name, depType: acc.type }] } };
  }) }));
  const addInsurance = () => { setF(p => ({ ...p, insurances: [...p.insurances, window.lrNewInsurance()] })); onToast && onToast('เพิ่มแถวประกัน — กรอกรายละเอียดได้'); };
  const addDisburse = () => { setF(p => ({ ...p, disburses: [...p.disburses, window.lrNewDisburse()] })); onToast && onToast('เพิ่มแถวการจ่ายเงิน — กรอกรายละเอียดได้'); };

  const pickMember = (m) => {
    setF(p => window.lrApplyMemberToForm(p, m));
    setMemberModal(false);
    onToast && onToast(`เลือกสมาชิก ${m.code} — ${m.name} — ดึงข้อมูลทะเบียนสมาชิกแล้ว`);
  };

  const doAction = (statusMsg) => {
    if (!f.reqNo) setF(p => ({ ...p, reqNo: window.lrNextReqNo() }));
    if (audit && audit.log) {
      audit.log({ action: 'create', module: 'สินเชื่อ — ใบคำขอกู้',
        target: `${f.reqNo} · ${f.member.name}`, summary: statusMsg,
        changes: [
          { field: 'ประเภทเงินกู้', before: '—', after: derived ? `${derived.productCode} — ${derived.productName}` : '—' },
          { field: 'โครงการเงินกู้', before: '—', after: projectPick ? projectPick.projectName + ' · ' + projectPick.roundName : 'ไม่อยู่ในโครงการ' },
          { field: 'จำนวนเงินขอกู้', before: '—', after: fmt.money(f.amount) },
        ] });
    }
    onToast && onToast(statusMsg);
  };

  // วัตถุประสงค์ที่เลือก (จากค่าคงที่วัตถุประสงค์การกู้) — ใช้ตรวจสิทธิออกหนังสือรับรองดอกเบี้ย
  const certPurpose = window.lpuFind ? window.lpuFind(f.purpose) : null;

  // ── ยืนยัน — ปิดกั้นเมื่อไม่ผ่านเกณฑ์ (Flow ขั้นที่ 15) ──
  const submit = () => {
    if (f.interestCert && !(certPurpose && certPurpose.taxCert)) {
      onToast && onToast('ยังทำรายการไม่ได้ — วัตถุประสงค์การกู้ที่เลือกไม่สามารถออกหนังสือรับรองดอกเบี้ยได้');
      return;
    }
    if (f.interestCert && !f.certPurposeDetail) {
      onToast && onToast('ยังทำรายการไม่ได้ — กรุณาระบุรายละเอียดวัตถุประสงค์สำหรับหนังสือรับรองดอกเบี้ย');
      return;
    }
    if (!C.canSubmit) {
      onToast && onToast('ยังทำรายการไม่ได้ — ' + C.failed.map(x => x.label).join(' · '));
      return;
    }
    doAction(C.instantApprove
      ? `อนุมัติคำขอกู้ทันที — ${derived ? derived.productName : ''} (ผลิตภัณฑ์ตั้งค่าอนุมัติทันที)`
      : 'ส่งคำขอกู้เข้าสู่กระบวนการอนุมัติเรียบร้อยแล้ว');
  };

  // ── บันทึกคำขอเอกสารเพิ่มเติม → สถานะ "ร่าง" + "ขอเอกสารเพิ่มเติม" ──
  const confirmDocRequest = ({ docs, note }) => {
    setDocReqDraft({ docs, note });
    setDocReqModal(false);
    setDocReqSummary({ docs, note });
    if (audit && audit.log) {
      audit.log({ action: 'update', module: 'สินเชื่อ — ใบคำขอกู้',
        target: `${f.reqNo} · ${f.member.name}`,
        summary: `บันทึกแบบร่าง — ขอเอกสารเพิ่มเติม ${docs.length} รายการ`,
        changes: [
          { field: 'สถานะคำขอ', before: 'แบบร่าง', after: 'ขอเอกสารเพิ่มเติม' },
          { field: 'เอกสารที่ขอเพิ่ม', before: '—', after: docs.join(', ') },
        ] });
    }
    onToast && onToast(`บันทึกแบบร่าง — ขอเอกสารเพิ่มเติม ${docs.length} รายการ`);
  };

  const confirmSalary = (newSalary, row) => {
    setF(p => ({ ...p, income: { ...p.income, salary: newSalary }, member: { ...p.member, salary: newSalary } }));
    window.lrUpdateMemberSalary(f.member.code, row.old, newSalary, row.date, row.actor);
    if (audit && audit.log) {
      audit.log({ action: 'update', module: 'ทะเบียนสมาชิก',
        target: `${f.member.code} · ${f.member.name}`, summary: 'แก้ไขอัตราเงินเดือน (จากหน้าใบคำขอกู้)',
        changes: [{ field: 'อัตราเงินเดือน', before: fmt.money(row.old), after: fmt.money(newSalary) }] });
    }
    setSalaryModal(false);
    onToast && onToast(`อัปเดตเงินเดือนเป็น ฿${fmt.money(newSalary)} — มีผลที่ทะเบียนสมาชิกด้วย`);
  };

  // เอกสารในปุ่มเพิ่มเติม — อิงโครงการเงินกู้ของรายการ (พิเศษ ≠ สามัญ/ฉุกเฉิน)
  const spLoan = !!special || (() => {
    const pj = (window.lpjLoad ? window.lpjLoad() : []).find(p => p.id === f.lpjProjectId);
    if (pj && window.lpjIsSpecialProject) return window.lpjIsSpecialProject(pj);
    const lp = window.lrFindProduct ? window.lrFindProduct(f.productId) : null;
    return !!(lp && lp.group === 'special');
  })();
  const kebabItems = [
    ...(spLoan ? [{ label: 'พิมพ์หนังสือนำเสนอพิจารณาเงินกู้', fn: () => setPrintType('special') }, { label: 'พิมพ์หนังสือสัญญาเงินกู้พิเศษ', fn: () => setPrintType('contract') }] : []),
    { label: 'ตารางผ่อนชำระ', fn: () => setPrintType('schedule') },
    { label: 'พิมพ์ใบขอกู้เงิน', fn: () => setPrintType('app') },
    { label: 'พิมพ์ใบแจ้งชำระหนี้', fn: () => setPrintType('notice') },
    { label: 'พิมพ์ใบประกอบคำขอกู้', fn: () => setPrintType('attach') },
    { label: 'พิมพ์ใบรายละเอียดสมาชิก', fn: () => setPrintType('member') },
    { label: 'พิมพ์รวม', fn: () => setPrintType(spLoan ? 'allsp' : 'all') },
  ];

  // ประวัติของใบคำขอ + badge บันทึกล่าสุด (เวลาจากรายการล่าสุด)
  const reqHistory = React.useMemo(() => (window.lrqReqHistory ? window.lrqReqHistory(reqMeta) : []), [reqMeta]);
  const savedBadge = (() => {
    const last = reqHistory[reqHistory.length - 1];
    if (!last || !last.ts) return null;
    const s = String(last.ts).replace('T', ' ');
    const m = s.match(/(\d{4})-(\d{2})-(\d{2})(?:\s(\d{2}):(\d{2}))?/);
    if (!m) return 'บันทึกล่าสุด: ' + s;
    const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return 'บันทึกล่าสุด: ' + Number(m[3]) + ' ' + (TH[Number(m[2]) - 1] || '') + ' ' + (Number(m[1]) + 543)
      + (m[4] ? ' ' + m[4] + ':' + m[5] + ' น.' : '');
  })();

  const topBtns = [
    ...(special ? [{ label: 'พิมพ์หนังสือนำเสนอพิจารณาเงินกู้', fn: () => setPrintType('special') }, { label: 'พิมพ์หนังสือสัญญาเงินกู้พิเศษ', fn: () => setPrintType('contract') }] : []),
    { label: 'ล้างหน้าจอ', fn: clearScreen },
    { label: 'Open', fn: () => setOpenModal(true) },
    { label: 'ตารางผ่อนชำระ', fn: () => setPrintType('schedule') },
    { label: 'เช็กยอดติดลบ', fn: () => setAgentModal(true) },
    { label: 'พิมพ์ใบขอกู้เงิน', fn: () => setPrintType('app') },
    { label: 'พิมพ์ใบแจ้งชำระหนี้', fn: () => setPrintType('notice') },
    { label: 'พิมพ์ใบประกอบคำขอกู้', fn: () => setPrintType('attach') },
    { label: 'พิมพ์ใบรายละเอียดสมาชิก', fn: () => setPrintType('member') },
    { label: 'พิมพ์รวม', fn: () => setPrintType(special ? 'allsp' : 'all') },
  ];

  // รวมค่าคำนวณสำหรับเอกสารพิมพ์
  const printCalc = { derived, netRate, sendable, inst, entitlement, netReceive,
    otherDeductTotal, offsetTotal, colSum, remain, pctRemain, oldDebtPay, amountApproved: C.amountApproved };

  // ── ข้อมูลสำหรับ popup "เปอร์เซ็นต์คงเหลือ" ──
  const reqInterest = Math.round((C.amountApproved || f.amount || 0) * (netRate || 0) / 1200 * 100) / 100;
  const pctData = {
    salary: C.salary,
    otherIncome: C.otherIncome,
    extraIncome: 0,
    totalDeduct: C.monthlyBurden,
    extraDeduct: C.otherDeductTotal,
    transfer: 0,
    reducePct: Number(inc.reduceRemainPct) || 0,
    reduceAmount: (C.incomeTotal || 0) * (Number(inc.reduceRemainPct) || 0) / 100,
    minRemain: C.salaryRemainMin,
    netRemain: C.salaryRemain,
    rows: [
      { code: 'REQ', detail: `คำขอกู้เงิน — ${derived ? derived.productName : ''}`,
        pay: derived ? (derived.repayMode || '—') : '—',
        perPeriod: C.paymentRounded, interest: reqInterest, net: C.paymentRounded },
      ...(f.monthlyCollect || []).filter(d => d.detail !== 'ค่าหุ้น').map(d => ({
        code: 'LON', detail: d.detail, pay: 'คงยอด',
        perPeriod: (d.payPrincipal || 0) + (d.payInterest || 0),
        interest: d.payInterest || 0,
        net: (d.payPrincipal || 0) + (d.payInterest || 0),
      })),
    ],
  };

  const blankSelect = (extra) => (
    <select className={"cfg-input lrq-rowsel" + (extra || '')} defaultValue=""><option value="">--- โปรดเลือก ---</option></select>
  );

  return (
    <div data-screen-label={(special ? "บันทึกจ่ายเงินกู้พิเศษ — " : "") + (reviewMode ? "อนุมัติสินเชื่อ — รายละเอียดใบคำขอกู้" : "ใบคำขอกู้เงิน — สร้างคำขอกู้")} className={"lrq-page" + (reviewMode || locked ? " lrq-review" : "")}>
      {/* ── หัวเรื่อง + ปุ่มแถวบน ── */}
      <div className="page-actions lrq-topbar">
        <button className="btn sm lrq-back" onClick={onBack} title="กลับไปยังรายการคำขอ"><Icon name="chevLeft" /></button>
        <div>
          <h1 className="lrq-title">
            {special
              ? (reviewMode || pageMode === 'view' ? 'รายละเอียดบันทึกจ่ายเงินกู้พิเศษ' : pageMode === 'edit' ? 'แก้ไขบันทึกจ่ายเงินกู้พิเศษ' : 'สร้างบันทึกจ่ายเงินกู้พิเศษ')
              : (reviewMode || pageMode === 'view' ? 'รายละเอียดใบคำขอกู้เงิน' : pageMode === 'edit' ? 'แก้ไขใบคำขอกู้เงิน' : 'สร้างใบคำขอกู้เงิน')}
            {reviewMode && statusBadge && <span className={"pill " + statusBadge.pill} style={{ marginLeft: 10, verticalAlign: 'middle' }}>{statusBadge.l}</span>}
            {!reviewMode && docReqDraft && (
              <span style={{ marginLeft: 10, verticalAlign: 'middle', display: 'inline-flex', gap: 6 }}>
                <span className="pill neutral">ร่าง</span>
                <span className="pill warn">ขอเอกสารเพิ่มเติม</span>
              </span>
            )}
          </h1>
          <div className="muted lrq-subline">
            <span>เลขที่ใบขอกู้ <span className="mono">{f.reqNo || '—'}</span></span>
            {f.crmRef && <span className="lrq-crm-chip"><Icon name="download" size={11} /> ดึงจาก CRM <span className="mono">{f.crmRef}</span></span>}
          </div>
        </div>
        <span className="spacer" />
        {reviewMode ? (
          <div className="lrq-topbtns" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn sm" onClick={() => setReqHist(true)}><Icon name="history" /> ประวัติ</button>
            {decision && (
              <span className={"pill " + (decision.pill || 'neutral')} style={{ alignSelf: 'center' }}>
                {decision.l}{decision.by ? ' · ' + decision.by : ''}
              </span>
            )}
            <button className={"btn danger sm" + (decision ? " is-disabled" : "")} disabled={!!decision}
                    onClick={() => !decision && onReject && onReject()}>
              <Icon name={rejectIcon || "close"} /> {rejectLabel || 'ไม่อนุมัติ'}
            </button>
            <button className={"btn primary sm" + (decision ? " is-disabled" : "")} disabled={!!decision}
                    onClick={() => !decision && onApprove && onApprove()}>
              <Icon name="check" /> {approveLabel || 'อนุมัติคำขอ'}
            </button>
            <LrqKebabMenu items={kebabItems} />
          </div>
        ) : locked && !cancelled ? (
          /* view mode — badge บันทึกล่าสุด · ประวัติ · เพิ่มเติม */
          <div className="lrq-topbtns">
            {savedBadge && <span className="saved-badge">{savedBadge}</span>}
            <button className="btn sm" onClick={() => setReqHist(true)}><Icon name="history" /> ประวัติ</button>
            <LrqKebabMenu items={kebabItems} />
          </div>
        ) : locked && cancelled ? (
          /* หลังกดยกเลิก — ฟิลด์ล็อก มีปุ่มแก้ไขข้อมูล */
          <div className="lrq-topbtns">
            <button className="btn sm" onClick={clearScreen}>ล้างหน้าจอ</button>
            <button className="btn sm" onClick={() => setOpenModal(true)}>Open</button>
            <button className="btn sm" onClick={() => setAgentModal(true)}>เช็กยอดติดลบ</button>
            <button className="btn sm" onClick={() => setDocReqModal(true)}><Icon name="attach" /> ขอเอกสารเพิ่มเติม</button>
            <button className="btn sm" onClick={() => { doAction('ส่งคำขอกู้เข้าสู่การพิจารณากรณีพิเศษ — สถานะ “รออนุมัติกรณีพิเศษ”'); onSpecial && onSpecial(); }}><Icon name="shield" /> ขออนุมัติกรณีพิเศษ</button>
            <button className="btn primary sm" onClick={() => { setLocked(false); setCancelled(false); }}><Icon name="edit" /> แก้ไขข้อมูล</button>
            <LrqKebabMenu items={kebabItems} />
          </div>
        ) : (
          /* edit mode */
          <div className="lrq-topbtns">
            <button className="btn sm" onClick={clearScreen}>ล้างหน้าจอ</button>
            <button className="btn sm" onClick={() => setOpenModal(true)}>Open</button>
            <button className="btn sm" onClick={() => setAgentModal(true)}>เช็กยอดติดลบ</button>
            <button className="btn sm" onClick={() => setDocReqModal(true)}><Icon name="attach" /> ขอเอกสารเพิ่มเติม</button>
            <button className="btn sm" onClick={() => { doAction('ส่งคำขอกู้เข้าสู่การพิจารณากรณีพิเศษ — สถานะ “รออนุมัติกรณีพิเศษ”'); onSpecial && onSpecial(); }}><Icon name="shield" /> ขออนุมัติกรณีพิเศษ</button>
            <button className="btn sm" onClick={() => { setLocked(true); setCancelled(true); onToast && onToast('ยกเลิกการแก้ไข — หน้าอยู่ในโหมดอ่าน'); }}>ยกเลิก</button>
            <button className="btn sm" onClick={() => doAction('บันทึกแบบร่างคำขอกู้เรียบร้อยแล้ว')}><Icon name="edit" /> บันทึกแบบร่าง</button>
            <button className={"btn primary sm" + (C.canSubmit ? "" : " is-disabled")} onClick={submit}
                    title={C.canSubmit ? '' : 'ติดเงื่อนไข: ' + C.failed.map(x => x.label).join(' · ')}>
              <Icon name={C.instantApprove ? "shield" : "check"} /> {C.instantApprove ? 'อนุมัติทันที' : 'ยืนยันส่งอนุมัติ'}
            </button>
            <LrqKebabMenu items={kebabItems} />
          </div>
        )}
      </div>

      {/* ══ การ์ดบน: คำขอ/ประกอบ (ซ้าย) | สิทธิ-อัตรา-ชำระ-รายรับ (ขวา) ══ */}
      <div className="search-card lrq-sheet">
        <div className="lrq-top-grid">
          {/* ── ซ้าย ── */}
          <div className="lrq-col-left">
            <div className="lrq-grid c3">
              <LrqField label="เลขที่ใบขอกู้">
                <input className="cfg-input mono lrq-ro" value={f.reqNo} placeholder="— ระบบจะกำหนดจาก CRM เมื่อสร้างคำขอ —" readOnly />
              </LrqField>
              <LrqField label="เลขสมาชิก">
                <div className="lrq-member-search">
                  <ErpMemberPicker codeOnly
                    member={f.member.code ? { code: f.member.code, name: f.member.name, dept: f.member.unit } : null}
                    onPick={pickMember} title="ค้นหาสมาชิกผู้กู้"
                    placeholder="เลขสมาชิก…" />
                </div>
              </LrqField>
              <LrqField label="วันที่ขอกู้">
                <ErpDate value={f.reqDate} onChange={(v) => set('reqDate', v)} />
              </LrqField>

              <LrqField label="โครงการเงินกู้" bound span={3}>
                <div style={{ display: 'grid', gap: 4 }}>
                  <select className="cfg-input" style={{ width: '100%', maxWidth: 'none' }} value={projectPick ? projectPick.v : ''}
                          onChange={(e) => {
                            const [pid] = e.target.value.split('|');
                            const pj = mainProjects.find(p => p.id === pid);
                            if (!pj) { setF(p => ({ ...p, lpjProjectId: '', projectKey: '' })); return; }
                            const key = e.target.value;
                            const tid = (pj.loanTypeIds || [])[0];
                            if (tid !== f.productId) pickProduct(tid);
                            setF(p => ({ ...p, lpjProjectId: pj.id, projectKey: key }));
                          }}>
                    <option value="">— โปรดเลือกโครงการเงินกู้ —</option>
                    {mainProjects.map(p => (p.rounds || []).length === 0
                      ? <option key={p.id} disabled value={'__none_' + p.id}>{p.code} — {p.name} › (ยังไม่มีโครงการย่อย)</option>
                      : p.rounds.map(r => (
                        <option key={r.id} value={p.id + '|' + r.id} disabled={!r.enabled}>
                          {p.code} — {p.name} › {r.name}{r.enabled ? '' : ' (ปิดใช้งาน)'}
                        </option>
                      )))}
                  </select>
                  {projectPick ? (
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {projectPick.projectName} › {projectPick.roundName} · เปิดรับคำขอ {(projectPick.periods || []).map(p => fmt.date(p.start) + '–' + (p.end ? fmt.date(p.end) : 'ไม่มีกำหนด')).join(' / ')}
                      {!projectPick.memberChecked && <> · กู้ได้ {projectPick.maxRights} ครั้ง ต่อผู้กู้ 1 ราย</>}
                    </span>
                  ) : pickedMain && !eligibleProjects.length ? (
                    <span className="muted" style={{ fontSize: 11.5 }}>ไม่มีโครงการย่อยที่เปิดรับคำขอ ณ วันที่ขอกู้</span>
                  ) : null}
                </div>
                {projectPick && projectPick.memberChecked ? (
                  projectPick.remain <= 0 ? null : (
                    <div className="muted" style={{ marginTop: 6, fontSize: 11.5 }}>
                      ผู้กู้ {f.member.code} ใช้สิทธิ์แล้ว {projectPick.memberUsed}/{projectPick.maxRights} ครั้ง — คงเหลือ {projectPick.remain} ครั้ง
                    </div>
                  )
                ) : null}
              </LrqField>

              <LrqField label="ประเภทเงินกู้" bound>
                <input className="cfg-input lrq-ro" readOnly placeholder="— ตามโครงการเงินกู้ที่เลือก —"
                       value={f.productId ? ((typeOptions.find(o => o.v === f.productId) || {}).l || f.productId) : ''} />
              </LrqField>
              <LrqField label="ชื่อ-นามสกุลผู้กู้">
                <input className="cfg-input lrq-ro" value={f.member.name} readOnly />
              </LrqField>
              <LrqField label="วันที่จ่าย">
                <ErpDate value={f.payDate} onChange={(v) => set('payDate', v)} />
              </LrqField>

              <LrqField label="หน่วย / สังกัด" span={2}>
                <input className="cfg-input lrq-ro" value={f.member.unit} readOnly />
              </LrqField>
              <LrqField label="วันที่เริ่มเก็บ" bound hint={collectSch ? `${collectSch.late ? 'เกินรอบแล้ว · ' : ''}ประมวลผล ${lrqDMY(collectSch.processDate)} · เรียกเก็บ ${lrqDMY(collectSch.billDate)}` : ''}>
                {collectSch ? (
                  <select className="cfg-input" value={collectSkip} onChange={e => set('collectSkip', Number(e.target.value) || 0)}>
                    {Array.from({ length: 13 }, (_, k) => <option key={k} value={k}>{lrqDMY(collectEnd(k)) + (k === 0 ? ' (ตามรอบ)' : ` (เลื่อน ${k} งวด)`)}</option>)}
                  </select>
                ) : <input className="cfg-input lrq-ro" readOnly value="" placeholder="— คำนวณจากวันที่ทำรายการ —" />}
              </LrqField>

              <LrqField label="วัตถุประสงค์การกู้" bound span={3}>
                <select className="cfg-input" value={f.purpose}
                        onChange={e => setF(p => ({ ...p, purpose: e.target.value, certPurposeDetail: '' }))}>
                  {(window.lpuOptions ? window.lpuOptions() : (window.LP_OPTS.loanPurpose || []))
                    .map(o => <option key={o.v} value={o.v}>{lrqT(o.l)}</option>)}
                </select>
              </LrqField>
            </div>

            <div className="lrq-grid c4" style={{ marginTop: 10 }}>
              <LrqField label="เบอร์โทรศัพท์">
                <input className="cfg-input" value={f.member.phone}
                       onChange={e => setF(p => ({ ...p, member: { ...p.member, phone: e.target.value } }))} />
              </LrqField>
              <LrqField label="สถานะสมาชิก">
                <select className="cfg-input" value={f.member.memberStatus}
                        onChange={e => setF(p => ({ ...p, member: { ...p.member, memberStatus: e.target.value } }))}>
                  {window.LR_MEMBER_STATUS.map(o => <option key={o.v} value={o.v}>{lrqT(o.l)}</option>)}
                </select>
              </LrqField>
              <LrqField label="สถานภาพ">
                <select className="cfg-input" value={f.member.maritalStatus}
                        onChange={e => setF(p => ({ ...p, member: { ...p.member, maritalStatus: e.target.value } }))}>
                  {window.LR_MARITAL.map(o => <option key={o.v} value={o.v}>{lrqT(o.l)}</option>)}
                </select>
              </LrqField>
              <LrqField label="ชื่อคู่สมรส (กรณีสมรส)">
                <input className="cfg-input" value={f.member.spouse} placeholder="โปรดระบุข้อมูล"
                       onChange={e => setF(p => ({ ...p, member: { ...p.member, spouse: e.target.value } }))} />
              </LrqField>
            </div>

            <div className="lrq-f" style={{ marginTop: 10 }}>
              <label className="lrq-lbl">ข้อความแจ้งเตือนจากระบบ <span className="lrq-hint">(ตรวจคุณสมบัติตามค่าคงที่ของผลิตภัณฑ์)</span></label>
              {ready ? (
              <div className={"lrq-checklist" + (C.canSubmit ? " ok" : "")}>
                {C.checks.map(ck => (
                  <div key={ck.id} className={"lrq-chk-item" + (ck.ok ? " ok" : " bad")}>
                    <Icon name={ck.ok ? "check" : "close"} size={12} />
                    <span className="lrq-chk-label">{ck.label}</span>
                    {ck.detail && <span className="lrq-chk-detail">{ck.detail}</span>}
                  </div>
                ))}
                <div className="lrq-chk-summary">
                  {C.canSubmit
                    ? <span className="pill ok">ผ่านเกณฑ์ — พร้อมทำรายการ</span>
                    : <span className="pill bad">ติดเงื่อนไข {C.failed.length} รายการ</span>}
                </div>
              </div>
              ) : (
                <div className="lrq-checklist-empty muted">เลือกสมาชิกและประเภทเงินกู้ก่อน ระบบจะตรวจคุณสมบัติให้อัตโนมัติ</div>
              )}
            </div>

            <LrqSub>ข้อมูลประกอบการขอกู้</LrqSub>
            <div className="lrq-grid c4">
              <LrqField label="วันเกิด"><input className="cfg-input lrq-ro" value={fmt.date(f.member.birthDate)} readOnly /></LrqField>
              <LrqField label="อายุเกิด"><input className="cfg-input lrq-ro" value={fmt.ageYM(f.member.birthDate)} readOnly /></LrqField>
              <LrqField label="วันเกษียณ"><input className="cfg-input lrq-ro" value={fmt.date(f.member.retireDate)} readOnly /></LrqField>
              <LrqField label="อายุงานคงเหลือ"><input className="cfg-input lrq-ro" value={fmt.retireCountdown(f.member.retireDate)} readOnly /></LrqField>
              <LrqField label="วันที่เป็นสมาชิก"><input className="cfg-input lrq-ro" value={fmt.date(f.member.joinDate)} readOnly /></LrqField>
              <LrqField label="อายุสมาชิก"><input className="cfg-input lrq-ro" value={fmt.ageYM(f.member.joinDate)} readOnly /></LrqField>
              <LrqField label="งวดชำระทุนเรือนหุ้น"><input className="cfg-input lrq-num lrq-y" value={f.member.sharePeriod || sendable} readOnly /></LrqField>
              <LrqField label="จำนวนทุนเรือนหุ้น"><LrqMoney value={f.member.shareCapital} yellow readOnly /></LrqField>
            </div>
          </div>

          {/* ── ขวา ── */}
          <div className="lrq-col-right">
            <div className="lrq-rr">

              {/* สิทธิการขอกู้ + อัตราดอกเบี้ย */}
              <div>
                <LrqSub>สิทธิการขอกู้</LrqSub>
                <div className="lrq-grid c2" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <LrqField label="สิทธิการขอกู้" bound hint={(C.limitBreakdown.find(b => b.binding) || {}).label ? 'ติดเพดาน: ' + (C.limitBreakdown.find(b => b.binding) || {}).label : (derived ? derived.limitGroupLabel : '')}>
                    <input className="cfg-input lrq-num lrq-ro" style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }} value={fmt.money(entitlement)} readOnly onDoubleClick={() => setBreakdownModal(true)} title="ดับเบิลคลิกเพื่อดูรายละเอียด" />
                  </LrqField>
                  <LrqField label="หนี้ภายนอก"><LrqMoney value={f.prevDebt} onChange={v => set('prevDebt', v)} /></LrqField>
                </div>
                <div className="lrq-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)', marginTop: 8 }}>
                  <LrqField label="จำนวนเงินขอกู้" hint={!C.amountOk ? '⚠ เกินสิทธิ์/เพดาน' : (C.amountApproved !== f.amount ? 'อนุมัติ (ปัด): ฿' + fmt.money(C.amountApproved) : '')}>
                    <LrqMoney value={f.amount} onChange={v => set('amount', v)} yellow />
                  </LrqField>
                </div>
                <LrqSub>อัตราดอกเบี้ย</LrqSub>
                <div className="lrq-grid c2">
                  <LrqField label="รูปแบบ" bound><input className="cfg-input lrq-ro" value={derived ? lrqT(derived.interestRateFormLabel) : '—'} readOnly /></LrqField>
                  <LrqField label="อัตราดอกเบี้ย" bound hint={derived ? `ตาราง ${derived.rateTable}` : ''}>
                    <input className="cfg-input lrq-num" value={netRate.toFixed(3) + '%'} readOnly />
                  </LrqField>
                  <LrqField label="เพิ่ม">
                    <input className="cfg-input lrq-num" value={(Number(f.rateAdd) || 0).toFixed(3) + '%'}
                           onChange={e => set('rateAdd', Number(String(e.target.value).replace(/[^0-9.]/g, '')) || 0)} />
                  </LrqField>
                  <LrqField label="ลด">
                    <input className="cfg-input lrq-num" value={(Number(f.rateReduce) || 0).toFixed(3) + '%'}
                           onChange={e => set('rateReduce', Number(String(e.target.value).replace(/[^0-9.]/g, '')) || 0)} />
                  </LrqField>
                </div>
                <div className="lrq-inline-row">
                  <span className="lrq-lbl">ตารางดอกเบี้ย</span>
                  {lrqEye(() => setRateTierModal(true))}
                  <label className="lrq-check" style={{ marginLeft: 14 }}>
                    <input type="checkbox" checked={f.interestCert}
                           onChange={e => setF(p => ({ ...p, interestCert: e.target.checked, certPurposeDetail: e.target.checked ? p.certPurposeDetail : '' }))} />
                    หนังสือรับรองดอกเบี้ย
                  </label>
                </div>
                {f.interestCert && (certPurpose && certPurpose.taxCert ? (
                  <div className="lrq-cert-box">
                    <div className="lrq-cert-ok">
                      <Icon name="check" size={12} /> วัตถุประสงค์ “{certPurpose.l}” ออกหนังสือรับรองดอกเบี้ยได้
                    </div>
                    <LrqField label="ระบุรายละเอียดวัตถุประสงค์" bound span={2}
                              hint={!f.certPurposeDetail ? '⚠ ต้องระบุก่อนทำรายการ' : ''}>
                      <select className="cfg-input" value={f.certPurposeDetail}
                              onChange={e => set('certPurposeDetail', e.target.value)}>
                        <option value="">— เลือกรายละเอียดวัตถุประสงค์ —</option>
                        {certPurpose.details.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                      </select>
                    </LrqField>
                  </div>
                ) : (
                  <div className="lrq-cert-warn">
                    <Icon name="info" size={13} /> วัตถุประสงค์ “{certPurpose ? certPurpose.l : '—'}” ไม่อยู่ในกลุ่มที่ออกหนังสือรับรองดอกเบี้ยได้ —
                    กรุณาเปลี่ยนวัตถุประสงค์การกู้ หรือยกเลิกการติ๊ก (ตั้งค่าได้ที่ ค่าคงที่ › วัตถุประสงค์การกู้)
                  </div>
                ))}
              </div>

              {/* การชำระ */}
              <div className="lrq-rr-pay">
                <LrqSub>การชำระ</LrqSub>
                <div className="lrq-grid c2">
                  <LrqField label="การชำระ">
                    <select className="cfg-input" value={f.payMethod} onChange={e => set('payMethod', e.target.value)}>
                      {window.LR_PAY_METHODS.map(o => <option key={o.v} value={o.v}>{lrqT(o.l)}</option>)}
                    </select>
                  </LrqField>
                  <LrqField label="ประเภทส่ง">
                    <select className="cfg-input" value={f.payType} onChange={e => set('payType', e.target.value)}>
                      {window.LR_PAY_TYPES.map(o => <option key={o.v} value={o.v}>{lrqT(o.l)}</option>)}
                    </select>
                  </LrqField>
                  <LrqField label="จำนวนงวดสูงสุดตามสิทธิ์" bound hint={C.notExceedRetire ? `ตาราง ${C.maxPeriodsTable} ∩ เกษียณ ${Math.max(0, C.maxPeriodsRetire)}` : ''}><input className="cfg-input lrq-num" value={maxPeriods} readOnly /></LrqField>
                  <LrqField label="จำนวนงวดที่สามารถส่งได้" hint={'งวดสุดท้าย ' + fmt.date(C.lastDueDate)}>
                    <input className="cfg-input lrq-num lrq-y" value={sendable}
                           onChange={e => set('sendablePeriods', Math.max(1, Number(String(e.target.value).replace(/[^0-9]/g, '')) || 1))} />
                  </LrqField>
                  <LrqField label="ยอดชำระ/งวด" hint={C.paymentRounded !== inst.payment ? 'ปัด ' + fmt.money(C.paymentRounded) : ''}><LrqMoney value={C.paymentRounded} readOnly /></LrqField>
                  <LrqField label="หักหนี้เก่า" hint={[offsetTotal ? 'หักกลบ ' + fmt.money(offsetTotal) : '', C.monthlyPayNow ? 'จัดเก็บ ' + fmt.money(C.monthlyPayNow) : ''].filter(Boolean).join(' + ')}><LrqMoney value={oldDebtDeduct} readOnly /></LrqField>
                  <LrqField label="หักอื่นๆ"><LrqMoney value={otherDeductTotal} readOnly /></LrqField>
                  <LrqField label="หักตัวแทน">
                      <input className="cfg-input lrq-num" placeholder="0.00" style={{ width: '100%' }}
                             title="ดับเบิลคลิกเพื่อดูยอดค้างตัวแทน (ยอดติดลบ)"
                             value={f.agentDeductStr != null ? f.agentDeductStr : fmt.money(f.agentDeduct || 0)}
                             onFocus={e => { const s = f.agentDeduct ? String(f.agentDeduct) : ''; setF(p => ({ ...p, agentDeductStr: s })); }}
                             onChange={e => { const s = e.target.value.replace(/[^0-9.]/g, ''); setF(p => ({ ...p, agentDeductStr: s, agentDeduct: Number(s) || 0 })); }}
                             onBlur={() => setF(p => ({ ...p, agentDeductStr: null }))}
                             onDoubleClick={() => {
                               const rows = (f.agentArrears && f.agentArrears.length) ? f.agentArrears : ((window.LR_DEMO && window.LR_DEMO.agentArrears) || []);
                               setF(p => ({ ...p, agentDeductStr: null, agentDeduct: rows.reduce((s, r) => s + (Number(r.amount) || 0), 0) }));
                               setAgentModal(true);
                             }} />
                  </LrqField>
                  <LrqField label="ต้นล่วงหน้า" hint={C.advPeriods > 0 ? `หักล่วงหน้า ${C.advPeriods} งวด` : ''}>
                    {C.advPeriods > 0 ? <LrqMoney value={C.advPrincipal} readOnly /> :
                    <input className="cfg-input lrq-num" placeholder="0.00"
                           value={f.advPrincipalStr != null ? f.advPrincipalStr : fmt.money(f.advPrincipal || 0)}
                           onFocus={() => setF(p => ({ ...p, advPrincipalStr: p.advPrincipal ? String(p.advPrincipal) : '' }))}
                           onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setF(p => ({ ...p, advPrincipalStr: v, advPrincipal: Number(v) || 0 })); }}
                           onBlur={() => setF(p => ({ ...p, advPrincipalStr: null }))} />}
                  </LrqField>
                  <LrqField label="ดอกเบี้ยล่วงหน้า" hint={C.advPeriods > 0 ? `${C.advPeriods} งวด · ${netRate.toFixed(2)}%` : ''}>
                    {C.advPeriods > 0 ? <LrqMoney value={C.advInterest} readOnly /> :
                    <input className="cfg-input lrq-num" placeholder="0.00"
                           value={f.advInterestStr != null ? f.advInterestStr : fmt.money(f.advInterest || 0)}
                           onFocus={() => setF(p => ({ ...p, advInterestStr: p.advInterest ? String(p.advInterest) : '' }))}
                           onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, ''); setF(p => ({ ...p, advInterestStr: v, advInterest: Number(v) || 0 })); }}
                           onBlur={() => setF(p => ({ ...p, advInterestStr: null }))} />}
                  </LrqField>
                  <LrqField label="รับสุทธิ" span={2}><LrqMoney value={netReceive} yellow readOnly /></LrqField>
                </div>
              </div>
            </div>

            <LrqSub>รายรับ-รายจ่าย</LrqSub>
            <div className="lrq-grid c4">
              <LrqField label="เงินเดือน">
                <div className="lrq-member">
                  <input className="cfg-input lrq-num lrq-y lrq-ro" value={fmt.money(inc.salary)} readOnly />
                  <button className="lrq-member-edit" onClick={() => setSalaryModal(true)} title="แก้ไขเงินเดือน"><Icon name="edit" size={13} /></button>
                </div>
              </LrqField>
              <LrqField label="เงินได้อื่นๆ"><LrqMoney value={inc.other} onChange={v => setInc('other', v)} /></LrqField>
              <LrqField label="ยอดเงินหัก"><LrqMoney value={inc.deduct} onChange={v => setInc('deduct', v)} /></LrqField>
              <LrqField label="เงินกองทุน"><LrqMoney value={inc.fund} onChange={v => setInc('fund', v)} /></LrqField>
              <LrqField label="เงินเดือนคงเหลือ" hint={C.s.checkSalaryRemain ? (C.salaryRemainOk ? '✓ ≥ ขั้นต่ำ ฿' + fmt.money(C.salaryRemainMin) : '⚠ ต่ำกว่าขั้นต่ำ ฿' + fmt.money(C.salaryRemainMin)) : ''}>
                <input className={"cfg-input lrq-num lrq-ro" + (C.s.checkSalaryRemain && !C.salaryRemainOk ? " lrq-bad" : "")} value={fmt.money(remain)} readOnly />
              </LrqField>
              <LrqField label="%คงเหลือ">
                <div className="lrq-member">
                  <input className="cfg-input lrq-num lrq-ro" value={pctRemain.toFixed(2) + '%'} readOnly />
                  {lrqEye(() => setPctModal(true))}
                </div>
              </LrqField>
              <div className="lrq-f lrq-reduce-cell">
                <label className="lrq-lbl" aria-hidden="true" style={{ visibility: 'hidden' }}>&nbsp;</label>
                <label className="lrq-check lrq-reduce-check">
                  <input type="checkbox" checked={inc.reduceRemainOn} onChange={e => setInc('reduceRemainOn', e.target.checked)} />
                  ลด%เงินเดือนคงเหลือ
                </label>
              </div>
              <LrqField label="ลด%เงินเดือนคงเหลือ"><LrqMoney value={inc.reduceRemainPct} onChange={v => setInc('reduceRemainPct', v)} /></LrqField>
            </div>
            {special && (
              <div className="lrq-grid c2" style={{ marginTop: 10, gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
                <LrqField label="พยาน 1">
                  <input className="cfg-input" value={f.witness1 || ''} placeholder="ระบุชื่อพยาน" onChange={e => set('witness1', e.target.value)} />
                </LrqField>
                <LrqField label="พยาน 2">
                  <input className="cfg-input" value={f.witness2 || ''} placeholder="ระบุชื่อพยาน" onChange={e => set('witness2', e.target.value)} />
                </LrqField>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ประกัน ══ */}
      <div className="search-card lrq-sheet">
        <div className="lrq-sec-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>ประกัน<button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={addInsurance}><Icon name="plus" /> เพิ่มข้อมูล</button></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lrq-tbl">
            <thead><tr>
              <th style={{ minWidth: 160 }}>ประเภทประกัน</th><th style={{ minWidth: 200 }}>ชื่อบริษัทประกัน</th><th className="num" style={{ width: 90 }}>จำนวนเงินประกัน</th>
              <th className="num" style={{ width: 80 }}>เพิ่มทุน</th><th className="num" style={{ width: 80 }}>ลดทุน</th><th style={{ width: 100 }}>ประเภทบ้าน</th>
              <th className="num" style={{ width: 90 }}>ทุนประกันต่อบ้าน</th><th>หมายเหตุ</th><th style={{ width: 40 }} />
            </tr></thead>
            <tbody>
              {f.insurances.map((r, i) => (
                <tr key={i}>
                  <td>
                    {r.required
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><input className="cfg-input lrq-ro" value={r.type} readOnly style={{ flex: 1, minWidth: 0 }} /><span title="ประเภทเงินกู้กำหนดให้ต้องทำ" style={{ fontSize: 11, padding: '0 6px', borderRadius: 2, background: 'var(--brand-100, #EAFEF2)', color: 'var(--brand-700, #237450)', whiteSpace: 'nowrap' }}>บังคับ</span></div>
                      : optSelect(r.type, window.LR_INSURANCE_TYPES, v => setIns(i, 'type', v))}
                  </td>
                  <td>
                    <select className="cfg-input lrq-rowsel" value={r.company || ''} disabled={!r.type}
                            onChange={e => setIns(i, 'company', e.target.value)}>
                      <option value="">{r.type ? '--- เลือกบริษัทประกัน ---' : '— เลือกประเภทก่อน —'}</option>
                      {(window.INSURANCE_COMPANIES || []).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="num"><input className="cfg-input sm lrq-num" inputMode="decimal" value={r.amount ?? ''} placeholder="0.00" onChange={e => setIns(i, 'amount', e.target.value)} /></td>
                  <td className="num"><input className="cfg-input sm lrq-num" inputMode="decimal" value={r.addCap ?? ''} placeholder="0.00" onChange={e => setIns(i, 'addCap', e.target.value)} /></td>
                  <td className="num"><input className="cfg-input sm lrq-num" inputMode="decimal" value={r.reduceCap ?? ''} placeholder="0.00" onChange={e => setIns(i, 'reduceCap', e.target.value)} /></td>
                  <td>{/อัคคีภัย/.test(r.type || '')
                    ? <input className="cfg-input sm" value={r.houseType && r.houseType !== '-' ? r.houseType : ''} placeholder="ประเภทบ้าน" onChange={e => setIns(i, 'houseType', e.target.value)} />
                    : <input className="cfg-input sm lrq-ro" value="-" readOnly disabled style={{ textAlign: 'left' }} title="ระบุได้เฉพาะประกันอัคคีภัย" />}</td>
                  <td className="num"><input className="cfg-input sm lrq-num" inputMode="decimal" value={r.capPerHouse ?? ''} placeholder="0.00" onChange={e => setIns(i, 'capPerHouse', e.target.value)} /></td>
                  <td><input className="cfg-input sm" value={r.detail ?? ''} placeholder="หมายเหตุ" onChange={e => setIns(i, 'detail', e.target.value)} /></td>
                  <td className="center">{r.required ? null : lrqTrash(() => setF(p => ({ ...p, insurances: p.insurances.filter((_, j) => j !== i) })))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {/* ══ การจ่ายเงินกู้ ══ */}
      {special ? <SpecialPayoutSection f={f} setF={setF} onToast={onToast} /> : (
      <div className="search-card lrq-sheet">
        <div className="lrq-sec-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>การจ่ายเงินกู้<button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={addDisburse}><Icon name="plus" /> เพิ่มข้อมูล</button></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lrq-tbl">
            <thead><tr>
              <th style={{ minWidth: 200 }}>จ่ายเงินกู้เป็น</th><th>เลขที่บัญชี,เช็ค,ตั๋วแลกเงิน</th><th>ธนาคารต้นทาง</th><th>สาขาธนาคาร</th>
              <th>สาขาปลายทาง</th><th>รหัสไปรษณีย์ปลายทาง</th><th>ชื่อนามสกุลผู้สั่งจ่าย</th>
              <th className="num" style={{ width: 90, minWidth: 90 }}>ค่าธรรมเนียม</th><th className="num" style={{ width: 90, minWidth: 90 }}>ค่าบริการ</th><th className="num" style={{ width: 90, minWidth: 90 }}>ภาษี</th>
              <th className="num">รวมค่าโอน</th><th className="num" style={{ width: 130, minWidth: 130 }}>จ่ายสุทธิ</th><th style={{ width: 40 }} />
            </tr></thead>
            <tbody>
              {f.disburses.map((r, i) => {
                const allAccts = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : []).filter(a => a.status === 'active');
                const mc = String(f.member.code || '').replace(/\D/g, '').slice(-5);
                const own = allAccts.filter(a => a.member === mc);
                const accts = own.length ? own : allAccts;
                const NEED = {
                  'โอนเงินฝากสหกรณ์': ['acct'],
                  'โอนเงินฝากธนาคาร': ['bankAcc', 'bankFrom', 'branch'],
                  'เงินสด': [],
                  'ธนาณัติออนไลน์': ['bankAcc', 'postcode', 'payer'],
                  'แคชเชียร์เช็ค': ['bankAcc', 'bankFrom', 'branch', 'branchTo', 'payer'],
                  'เช็ค': ['bankAcc', 'bankFrom', 'branchTo', 'payer'],
                  'ตั๋วแลกเงิน': ['bankAcc', 'bankFrom', 'branch', 'branchTo', 'payer'],
                };
                const picked = !!r.method;
                const need = NEED[r.method] || [];
                const on = (fl) => picked && need.includes(fl);
                const dash = <span className="lrq-dash">-</span>;
                const txt = (fl, ph, mono) => on(fl)
                  ? <input className={"cfg-input sm" + (mono ? " mono" : "")} value={r[fl] ?? ''} placeholder={ph} onChange={e => setDisburse(i, fl, e.target.value)} />
                  : dash;
                const money = (fl) => picked
                  ? <input className="cfg-input sm lrq-num" style={{ width: '100%', minWidth: 0 }} inputMode="decimal" value={r[fl] ?? ''} placeholder="0.00" onChange={e => setDisburse(i, fl, e.target.value)} />
                  : dash;
                return (
                <tr key={i}>
                  <td>{optSelect(r.method, window.LR_DISBURSE_METHODS, v => setDisburse(i, 'method', v), '--- โปรดเลือก ---')}</td>
                  {picked ? (
                    <>
                      <td className="mono">
                        {on('acct') ? (
                          <select className="cfg-input lrq-rowsel" value={r.accNo || ''}
                                  onChange={e => setDisburse(i, 'accNo', e.target.value)}>
                            <option value="">--- เลือกบัญชีเงินฝาก ---</option>
                            {accts.map(a => <option key={a.accNo} value={a.accNo}>{a.accNo} · {a.type}{own.length ? '' : ' · ' + a.name}</option>)}
                          </select>
                        ) : on('bankAcc') ? txt('bankAcc', (r.method === 'เช็ค' || r.method === 'แคชเชียร์เช็ค') ? 'เลขที่เช็ค' : r.method === 'ตั๋วแลกเงิน' ? 'เลขที่ตั๋วแลกเงิน' : r.method === 'ธนาณัติออนไลน์' ? 'เลขที่ธนาณัติ' : 'เลขที่บัญชีธนาคาร', true) : dash}
                      </td>
                      <td>{txt('bankFrom', 'ธนาคารต้นทาง')}</td>
                      <td>{txt('branch', 'สาขาธนาคาร')}</td>
                      <td>{txt('branchTo', 'สาขาปลายทาง')}</td>
                      <td className="mono">{txt('postcode', 'รหัสไปรษณีย์', true)}</td>
                      <td>{txt('payer', 'ผู้สั่งจ่าย')}</td>
                      <td className="num">{money('fee')}</td>
                      <td className="num">{money('service')}</td>
                      <td className="num">{money('tax')}</td>
                      <td className="num mono">{fmt.money((Number(r.fee) || 0) + (Number(r.service) || 0) + (Number(r.tax) || 0))}</td>
                      <td className="num">{money('net')}</td>
                    </>
                  ) : (
                    <td colSpan={11} className="lrq-pick-hint"><Icon name="info" size={12} /> เลือกประเภทการจ่ายเงินกู้ก่อน ระบบจะเปิดช่องกรอกข้อมูลที่เกี่ยวข้อง</td>
                  )}
                  <td className="center">{lrqTrash(() => setF(p => ({ ...p, disburses: p.disburses.filter((_, j) => j !== i) })))}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
      )}

      {/* ══ หลักประกัน ══ */}
      <div className="search-card lrq-sheet">
        <div className="lrq-sec-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>หลักประกัน <span className="lrq-sec-sub">{derived ? derived.guarLimitGroupLabel : ''}</span>
          {C.needCollateral && (
            <span className={"pill " + (C.collateralOk ? "ok" : "bad")} style={{ marginLeft: 8 }}>
              {C.collateralOk ? '✓ ค้ำครบ' : '⚠ ขาด ฿' + fmt.money(Math.max(0, f.amount - C.collateralTotal))} · ค้ำได้ ฿{fmt.money(C.collateralTotal)} / ขอ ฿{fmt.money(f.amount)}
            </span>
          )}
          {!C.needCollateral && product && <span className="lrq-sec-sub" style={{ marginLeft: 8 }}>· ผลิตภัณฑ์นี้ไม่บังคับหลักประกัน</span>}
          <button className="btn primary sm" style={{ marginLeft: 'auto' }} onClick={addCollateral}><Icon name="plus" /> เพิ่มข้อมูล</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lrq-tbl">
            <thead><tr>
              <th style={{ minWidth: 190 }}>ประเภทหลักประกัน</th><th style={{ minWidth: 330 }}>เลขที่อ้างอิง</th><th style={{ minWidth: 300 }}>รายละเอียด</th>
              <th className="num" style={{ minWidth: 160 }}>สิทธิสูงสุด</th><th className="num" style={{ minWidth: 160 }}>สิทธิค้ำคงเหลือ</th><th className="num" style={{ minWidth: 170 }}>ยอดค้ำ</th>
              <th className="num" style={{ minWidth: 120 }}>%ค้ำ</th><th className="num" style={{ minWidth: 80 }}>งวดหุ้น</th><th className="num" style={{ minWidth: 150 }}>ค่าหุ้นสะสม</th>
              <th className="num" style={{ minWidth: 140 }}>เงินเดือน</th><th style={{ width: 40 }} />
            </tr></thead>
            <tbody>
              {f.collaterals.map((c, i) => (
                <tr key={i}>
                  <td style={{ minWidth: 190 }}>
                    <select className="cfg-input lrq-rowsel" style={{ width: '100%' }} value={(window.LR_COLL_KINDS.find(k => k.l === c.type) || {}).v || ''} onChange={e => setCollType(i, e.target.value)}>
                      <option value="">--- เลือกประเภท ---</option>
                      {window.LR_COLL_KINDS.map(k => <option key={k.v} value={k.v}>{lrqT(k.l)}</option>)}
                    </select>
                  </td>
                  <td className="mono lrq-ref-cell">
                    <div className="lrq-refbox">
                    {!c.type ? <span className="lrq-dash">-</span> : c.view.kind === 'person' ? (
                      <div className="lrq-coll-member">
                        <ErpMemberPicker member={c.ref ? { code: c.ref, name: c.detail } : null}
                          onPick={(m) => pickCollGuarantor(i, m)} source={window.GUAR_MEMBERS} title="ค้นหาคนค้ำประกัน"
                          placeholder="เลขสมาชิกผู้ค้ำ…" />
                      </div>
                    ) : c.view.kind === 'asset' ? (
                      <select className="cfg-input lrq-rowsel" value={c.assetId || ''}
                              onChange={e => applyAssetToRow(i, regAssets.find(a => a.id === e.target.value))}>
                        <option value="">{regAssets.some(a => a._sv.ok) ? '--- เลือกหลักทรัพย์ที่สรุปผลสำรวจแล้ว ---' : '— ไม่มีหลักทรัพย์ที่สรุปผลสำรวจแล้ว —'}</option>
                        {regAssets.map(a => <option key={a.id} value={a.id} disabled={!a._sv.ok}>
                          {[a.type, a.code || a.titleNo].filter(Boolean).join(' · ') + (a._sv.ok ? ' · ค้ำสูงสุด ฿' + fmt.money(a._sv.maxRight) : ' (' + a._sv.reason + ')')}
                        </option>)}
                      </select>
                    ) : c.view.kind === 'share' ? (
                      <div className="lrq-coll-member">
                        <ErpMemberPicker member={c.ref ? { code: c.ref, name: c.shareOwner || '' } : null}
                          onPick={(m) => pickCollShare(i, m)} source={window.GUAR_MEMBERS} title="ค้นหาสมาชิกเจ้าของหุ้นค้ำประกัน"
                          placeholder="เลขสมาชิกเจ้าของหุ้น…" />
                      </div>
                    ) : c.view.kind === 'deposit' ? (() => {
                      const accs = (window.depTxnLoadAccounts ? window.depTxnLoadAccounts() : []).filter(a => a.status === 'active');
                      const mine = accs.filter(a => window.lrIsOwnAccount(a, f.member));
                      const picked = c.ref ? accs.find(a => a.accNo === c.ref) : null;
                      const other = picked && !mine.includes(picked) ? picked : null;
                      return (
                        <select className="cfg-input lrq-rowsel mono" style={{ width: '100%' }} value={c.ref || ''}
                                onChange={e => { const v = e.target.value; if (v === '__search') { setDepSearch(i); return; } pickDeposit(i, accs.find(a => a.accNo === v) || null); }}>
                          <option value="">{mine.length ? '--- เลือกบัญชีเงินฝาก ---' : '— ผู้กู้ไม่มีบัญชีเงินฝาก —'}</option>
                          {mine.length > 0 && <optgroup label="บัญชีของผู้กู้">{mine.map(a => <option key={a.accNo} value={a.accNo}>{a.accNo} · {a.type}</option>)}</optgroup>}
                          {other && <optgroup label="บัญชีสมาชิกอื่น"><option value={other.accNo}>{other.accNo} · {other.name}</option></optgroup>}
                          {c.ref && !picked && <option value={c.ref}>{c.ref}</option>}
                          <option value="__search">ค้นหาบัญชีของสมาชิกอื่น…</option>
                        </select>
                      );
                    })() : (
                      <input className="cfg-input sm mono" value={c.ref} placeholder="เลขที่อ้างอิง" onChange={e => setColl(i, 'ref', e.target.value)} />
                    )}
                    </div>
                    {c.ref && lrqEye(() => setCollModal(c))}
                  </td>
                  <td>
                    {c.detail || <span className="lrq-dash">-</span>}
                    {(() => { const w = (C.depositShort || []).find(x => x.c === c); return w ? <div style={{ color: 'var(--error, #ff4d4f)', fontSize: 12, marginTop: 2, display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="warning" size={12} />{w.msg}</div> : null; })()}
                  </td>
                  <CollCell c={c} ckey="maxRight" kind="money" onChange={v => setColl(i, 'maxRight', v)} />
                  <CollCell c={c} ckey="remainRight" kind="money" onChange={v => setColl(i, 'remainRight', v)} />
                  <CollCell c={c} ckey="amount" kind="money" onChange={v => setColl(i, 'amount', v)} />
                  <CollCell c={c} ckey="pct" kind="pct" onChange={v => setColl(i, 'pct', v)} />
                  <CollCell c={c} ckey="sharePeriod" kind="int" onChange={v => setColl(i, 'sharePeriod', v)} />
                  <CollCell c={c} ckey="shareAcc" kind="money" onChange={v => setColl(i, 'shareAcc', v)} />
                  <CollCell c={c} ckey="salary" kind="money" onChange={v => setColl(i, 'salary', v)} />
                  <td className="center">{lrqTrash(() => setF(p => ({ ...p, collaterals: p.collaterals.filter((_, j) => j !== i) })))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr>
              <td className="right" colSpan="3">รวม</td>
              <td className="num">{fmt.money(colSum.maxRight, 2)}</td><td className="num">{fmt.money(colSum.remainRight, 2)}</td>
              <td className="num lrq-zero">{fmt.money(colSum.amount, 2)}</td><td className="num lrq-pct">{colSum.pctSum > 0 ? colSum.pctSum.toFixed(2) + '%' : ''}</td><td className="num">{colSum.sharePeriod || ''}</td>
              <td className="num">{fmt.money(colSum.shareAcc, 2)}</td><td className="num">{fmt.money(colSum.salary, 2)}</td><td />
            </tr></tfoot>
          </table>
        </div></div>
      </div>

      {/* ══ จัดเก็บรายเดือน | รายการหักกลบ ══ */}
      <div className="lrq-two">
        <div className="search-card lrq-sheet">
          <div className="lrq-sec-title">จัดเก็บรายเดือน</div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl lrq-tbl">
              <thead><tr>
                <th style={{ width: 30 }} /><th>รายละเอียด</th><th className="num">ชำระต้น</th><th className="num">ชำระดอกเบี้ย</th><th className="num">รวมชำระ</th><th className="num">คงเหลือ</th>
              </tr></thead>
              <tbody>
                {f.monthlyCollect.map((d, i) => {
                  const off = C.mcOffset(d);
                  const st = off ? { color: 'var(--text-tertiary, rgba(0,0,0,.45))', textDecoration: 'line-through' } : null;
                  return (
                  <tr key={i} className={d.pay && !off ? 'lrq-sel' : ''} title={off ? 'ชำระผ่านรายการหักกลบแล้ว — ไม่เรียกเก็บรายเดือนซ้ำ' : 'เลือกเพื่อจ่ายยอดนี้จากเงินกู้ (แสดงที่หักหนี้เก่า)'}>
                    <td className="center"><input type="checkbox" className="ch-box" checked={!!d.pay && !off} disabled={off}
                      onChange={e => setF(p => ({ ...p, monthlyCollect: p.monthlyCollect.map((x, j) => j === i ? { ...x, pay: e.target.checked } : x) }))} /></td>
                    <td>{d.detail}{off && <span className="tag" style={{ marginLeft: 6, fontSize: 11, padding: '0 6px', borderRadius: 2, background: 'var(--brand-100, #EAFEF2)', color: 'var(--brand-700, #237450)' }}>หักกลบแล้ว</span>}</td>
                    <td className="num" style={st}>{fmt.money(d.payPrincipal)}</td><td className="num" style={st}>{fmt.money(d.payInterest)}</td>
                    <td className="num" style={st}>{fmt.money(d.payPrincipal + d.payInterest)}</td><td className="num" style={st}>{fmt.money(d.remaining)}</td>
                  </tr>
                  );
                })}
                <tr className="lrq-foot-row">
                  <td /><td className="right">ยอดเรียกเก็บสุทธิ</td>
                  <td className="num">{fmt.money(f.monthlyCollect.filter(d => !C.mcOffset(d)).reduce((a, d) => a + d.payPrincipal, 0))}</td>
                  <td className="num">{fmt.money(f.monthlyCollect.filter(d => !C.mcOffset(d)).reduce((a, d) => a + d.payInterest, 0))}</td>
                  <td className="num"><b className="neg">{fmt.money(oldDebtPay)}</b></td>
                  <td className="num">{fmt.money(f.monthlyCollect.filter(d => !C.mcOffset(d)).reduce((a, d) => a + d.remaining, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="search-card lrq-sheet">
          <div className="lrq-sec-title">รายการหักกลบ</div>
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl lrq-tbl">
              <thead><tr>
                <th style={{ width: 30 }} /><th>เลขที่สัญญา</th><th className="num">คงเหลือ</th>
                <th className="num">ดอกเบี้ยงวด</th><th className="num">ดอกเบี้ยค้าง</th><th className="center">งวด</th><th className="num">ดอกเบี้ยคืน</th><th style={{ width: 34 }} />
              </tr></thead>
              <tbody>
                {C.offsetRows.map((o, i) => (
                  <tr key={i} className={o.sel ? 'lrq-sel' : ''}>
                    <td className="center"><input type="checkbox" className="ch-box" checked={o.sel}
                      onChange={e => setF(p => ({ ...p, offsetLoans: p.offsetLoans.map((x, j) => j === i ? { ...x, sel: e.target.checked } : x) }))} /></td>
                    <td className="mono">{o.contract}</td><td className="num">{fmt.money(o.remaining)}</td>
                    <td className="num">{fmt.money(o.interestPeriod)}</td><td className="num">{fmt.money(o.interestAccrued)}</td>
                    <td className="center mono">{o.period}</td><td className="num">{fmt.money(o.interestReturn)}</td>
                    <td className="center">{lrqEye(() => setOffsetModal(o))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          <div className="lrq-mini-sum">
            <div><span>ต้นเงินทั้งหมด</span><b className="lrq-blue">{fmt.money(C.offsetPrincipal)}</b></div>
            <div><span>หักกลบต้น+ดอกเบี้ย</span><b className="neg">{fmt.money(offsetTotal)}</b></div>
          </div>
        </div>
      </div>

      {/* ══ รายการหักอื่นๆ | รายละเอียดอื่นๆ ══ */}
      <div className="lrq-two" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))' }}>
        <div className="search-card lrq-sheet" style={{ minWidth: 0 }}>
          <div className="lrq-sec-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>รายการหักอื่นๆ</span>
            <button className="btn primary sm" onClick={() => setF(p => ({ ...p, otherDeducts: [...p.otherDeducts, window.lrNewOtherDeduct(p.member && p.member.name)] }))}>
              <Icon name="plus" /> เพิ่มรายการหัก</button>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ overflowX: 'auto' }}>
            <table className="tbl lrq-tbl">
              <thead><tr>
                <th style={{ width: 30 }} /><th>รหัส</th><th>รายละเอียด</th><th className="num">ยอดหัก</th><th style={{ width: 40 }} />
              </tr></thead>
              <tbody>
                <tr><td colSpan={5} style={{ background: '#FAFAFA', fontSize: 12, color: 'var(--text-2, rgba(0,0,0,.65))', fontWeight: 600 }}>ค่าธรรมเนียม / ค่าบริการ จากการจ่ายเงินกู้ <span style={{ fontWeight: 400 }}>· ดึงอัตโนมัติ แก้ไขที่ตารางการจ่ายเงินกู้</span></td></tr>
                {window.lrFeeDeductRows(f).map(d => (
                  <tr key={d.code}>
                    <td className="center"><input type="checkbox" className="ch-box" checked readOnly disabled /></td>
                    <td><span className="mono" style={{ marginRight: 6 }}>{d.code}</span>{d.detail}</td>
                    <td className="muted">{d.payer}</td>
                    <td className="num">{fmt.money(d.amount)}</td>
                    <td />
                  </tr>
                ))}
                <tr><td colSpan={5} style={{ background: '#FAFAFA', fontSize: 12, color: 'var(--text-2, rgba(0,0,0,.65))', fontWeight: 600 }}>รายการหักที่เจ้าหน้าที่เพิ่ม</td></tr>
                {f.otherDeducts.length === 0 && (
                  <tr><td colSpan={5} className="center muted" style={{ padding: 12 }}>ยังไม่มีรายการหัก</td></tr>
                )}
                {f.otherDeducts.map((d, i) => {
                  const upd = (patch) => setF(p => ({ ...p, otherDeducts: p.otherDeducts.map((x, j) => j === i ? { ...x, ...patch } : x) }));
                  const opt = window.LRQ_DEDUCT_CODES.find(o => o.code === d.code);
                  return (
                  <tr key={i} className={d.sel ? 'lrq-sel' : ''}>
                    <td className="center"><input type="checkbox" className="ch-box" checked={d.sel} onChange={e => upd({ sel: e.target.checked })} /></td>
                    <td>{d.manual ? (
                      <select className="cfg-input sm" value={d.code} onChange={e => { const o = window.LRQ_DEDUCT_CODES.find(x => x.code === e.target.value); upd({ code: e.target.value, detail: o && o.code !== '099' ? o.detail : '' }); }}>
                        <option value="">--- เลือกรายการหัก ---</option>
                        {window.LRQ_DEDUCT_CODES.map(o => <option key={o.code} value={o.code}>{o.detail}</option>)}
                      </select>
                    ) : <><span className="mono" style={{ marginRight: 6 }}>{d.code}</span>{d.detail}</>}
                    {d.manual && d.code === '099' && <input className="cfg-input sm" style={{ marginTop: 4 }} value={d.detail} placeholder="ระบุรายการ" onChange={e => upd({ detail: e.target.value })} />}
                    </td>
                    <td>{d.manual
                      ? <input className="cfg-input sm" value={d.payer} placeholder="รายละเอียด" onChange={e => upd({ payer: e.target.value })} />
                      : d.payer}</td>
                    <td className="num">{d.manual
                      ? <input className="cfg-input sm lrq-num" inputMode="decimal" value={d.amount ?? ''} placeholder="0.00" onChange={e => upd({ amount: e.target.value })} />
                      : fmt.money(Number(d.amount) || 0)}</td>
                    <td className="center">{lrqTrash(() => setF(p => ({ ...p, otherDeducts: p.otherDeducts.filter((_, j) => j !== i) })))}</td>
                  </tr>
                  );
                })}
                <tr className="lrq-foot-row">
                  <td /><td className="right" colSpan="2">รวม</td><td className="num"><b className="neg">{fmt.money(otherDeductTotal + C.feeTotal)}</b></td><td />
                </tr>
              </tbody>
            </table>
          </div></div>
        </div>

        <div className="search-card lrq-sheet" style={{ minWidth: 0 }}>
          <div className="lrq-sec-title">รายละเอียดอื่นๆ</div>
          <div className="lrq-grid c3">
            <LrqField label="รหัสตามงาน(CMS)"><input className="cfg-input mono lrq-ro" value={f.cmsCode} readOnly /></LrqField>
            <LrqField label="ผู้บันทึกข้อมูล"><input className="cfg-input lrq-ro" value={f.recordedBy} readOnly /></LrqField>
            <LrqField label="วันที่บันทึกข้อมูล"><input className="cfg-input lrq-ro" value={fmt.date(f.recordDate)} readOnly /></LrqField>
          </div>
          <div className="lrq-f" style={{ marginTop: 10 }}>
            <label className="lrq-lbl">อัปโหลดเอกสาร</label>
            <div className="lrq-dropzone">
              <Icon name="upload" size={16} />
              <span>คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด</span>
            </div>
          </div>
          <div className="lrq-filelist">
            {f.files.map((fl, i) => (
              <div key={i} className="lrq-file">
                <span className="lrq-file-ico"><Icon name="attach" size={14} /></span>
                <span className="lrq-file-name">{fl.name}</span>
                <span className="lrq-file-size muted">{fl.size}</span>
                {lrqEye(() => onToast && onToast('เปิดไฟล์ ' + fl.name))}
                {lrqDel(() => setF(p => ({ ...p, files: p.files.filter((_, j) => j !== i) })))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {memberModal && <LmMemberSearchModal showDept title="ค้นหาสมาชิกผู้กู้"
        onPick={pickMember} onClose={() => setMemberModal(false)} />}
      {salaryModal && <SalaryEditModal member={f.member} salary={inc.salary}
        onConfirm={confirmSalary} onClose={() => setSalaryModal(false)} />}
      {collModal && <CollateralDetailModal coll={collModal} onClose={() => setCollModal(null)} />}
      {assetAddModal !== null && <QuickAddAssetModal memberCode={f.member.code} onToast={onToast}
        onAdd={(rec) => { applyAssetToRow(assetAddModal, rec); setAssetsBump(v => v + 1); setAssetAddModal(null); onToast && onToast(`เพิ่มหลักทรัพย์ ${rec.type} เรียบร้อย — ใช้ค้ำประกันแล้ว`); }}
        onClose={() => setAssetAddModal(null)} />}
      {breakdownModal && <EntitlementBreakdownModal C={C} f={f} onClose={() => setBreakdownModal(false)} />}
      {printType && <LoanReqPrintOverlay type={printType} f={f} calc={printCalc} onClose={() => setPrintType(null)} />}
      {docReqModal && <RequestDocsModal onConfirm={confirmDocRequest} onClose={() => setDocReqModal(false)} />}
      {docReqSummary && <RequestDocsSummaryModal summary={docReqSummary} reqNo={f.reqNo} onClose={() => setDocReqSummary(null)} />}
      {agentModal && <AgentArrearsModal rows={(f.agentArrears && f.agentArrears.length) ? f.agentArrears : ((window.LR_DEMO && window.LR_DEMO.agentArrears) || [])} member={f.member} onClose={() => setAgentModal(false)} />}
      {pctModal && <SalaryRemainModal data={pctData} onClose={() => setPctModal(false)} />}
      {rateTierModal && <LrqRateTierModal product={product} amount={f.amount} reqDate={f.reqDate} rateAdd={f.rateAdd} rateReduce={f.rateReduce} onClose={() => setRateTierModal(false)} />}
      {reqHist && <LrqReqHistoryModal hist={reqHistory} reqNo={(reqMeta && (reqMeta.reqNo || reqMeta.crmNo)) || f.reqNo} memberName={f.member && f.member.name} onClose={() => setReqHist(false)} />}
      {offsetModal && <LrqOffsetModal row={offsetModal} onClose={() => setOffsetModal(null)} />}
      {clearConfirm && (
        <>
          <div className="modal-backdrop" onClick={() => setClearConfirm(false)} />
          <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 420 }}>
            <button className="close-btn" onClick={() => setClearConfirm(false)} aria-label="ปิด" style={{ position: 'absolute', top: 14, right: 14, background: '#fff', border: 'none', boxShadow: 'none', color: 'var(--text-muted)' }}><Icon name="close" /></button>
            <div className="modal-body" style={{ textAlign: 'center', paddingTop: 34, paddingBottom: 26 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--warning-50)', color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon name="info" size={26} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>ล้างหน้าจอ?</h2>
              <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>ข้อมูลที่กรอกไว้ทั้งหมดในหน้านี้จะถูกล้าง และไม่ถูกบันทึก</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
                <button className="btn" style={{ minWidth: 120, justifyContent: 'center' }} onClick={() => setClearConfirm(false)}>ยกเลิก</button>
                <button className="btn primary" style={{ minWidth: 140, justifyContent: 'center' }} onClick={doClearScreen}>ล้างหน้าจอ</button>
              </div>
            </div>
          </div>
        </>
      )}
      {depSearch != null && <LrqDepositSearchModal borrower={f.member} onClose={() => setDepSearch(null)} onPick={(a) => { pickDeposit(depSearch, a); setDepSearch(null); }} />}
      {openModal && window.PendingLoanReqModal && (
        <window.PendingLoanReqModal
          currentTypeCode={(product && product.code) || (f.productId || '').replace('LP-', '')}
          onClose={() => setOpenModal(false)}
          onPick={(r) => {
            setF(p => ({ ...p, reqNo: r.reqNo, productId: r.productId || p.productId,
                         reqDate: r.reqDate || p.reqDate, amount: Number(r.amount) || p.amount,
                         recordedBy: r.by || p.recordedBy }));
            setOpenModal(false);
            onToast && onToast(`ดึงคำขอเลขที่ ${r.reqNo} มาแก้ไขแล้ว`);
          }} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  คิวคำขอกู้จากระบบ CRM — รายการที่ส่งเข้ามารอทำรายการ
// ════════════════════════════════════════════════════════════════════
// ── รายละเอียดสถานะคำขอ — โครงเดียวกันทุกสถานะ (key facts + บันทึก) ──
window.lrqStatusInfo = (r) => {
  const st = (window.LR_CRM_STATUS || {})[r.status] || { label: r.status };
  const rows = [];
  const noteBlocks = [];
  if (r.status === 'docreq') {
    rows.push(['เอกสารที่รอ', (r.draftDocs || []).length + ' รายการ']);
    if ((r.draftDocs || []).length) noteBlocks.push(['เอกสารที่ขอเพิ่มเติม', r.draftDocs]);
  } else if (r.status === 'rejected') {
    rows.push(['ผู้ไม่อนุมัติ', r.rejectBy], ['วันเวลาที่ไม่อนุมัติ', r.rejectAt]);
    if (r.rejectNote) noteBlocks.push(['เหตุผล / สิ่งที่ต้องปรับแก้ไข', [r.rejectNote]]);
  } else if (r.status === 'approved') {
    rows.push(['ผู้อนุมัติ', r.approveBy], ['วันเวลาที่อนุมัติ', r.approveAt]);
  } else if (r.status === 'paid') {
    rows.push(['ผู้อนุมัติจ่ายเงิน', r.payBy], ['วันที่จ่ายเงิน', r.payAt]);
  } else if (r.status === 'returned') {
    rows.push(['เลขที่หนังสือส่งคืน', r.returnDocNo], ['วันที่ส่งคืน', r.returnDate]);
    if ((r.returnDocs || []).length) noteBlocks.push(['เอกสารที่ขาด', r.returnDocs]);
    if (r.returnNote) noteBlocks.push(['เหตุผล', [r.returnNote]]);
  } else if (r.status === 'special') {
    rows.push(['ผู้ส่งขออนุมัติกรณีพิเศษ', r.specialBy], ['วันเวลาที่ส่ง', r.specialAt]);
    if (r.specialReason) noteBlocks.push(['เหตุผลที่ขออนุมัติกรณีพิเศษ', [r.specialReason]]);
  } else if (r.status === 'draft' || r.status === 'waitapprove') {
    if (!r.reqNo && !r.note) return null;
  } else return null;
  return { st, rows: rows.filter(x => x[1]), noteBlocks };
};

function LrqStatusInfoModal({ req, onClose, onEdit }) {
  const info = window.lrqStatusInfo(req) || { st: {}, rows: [], noteBlocks: [] };
  const editable = ['draft', 'docreq', 'rejected'].includes(req.status);
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520, maxWidth: '94vw' }}>
        <div className="modal-head">
          <h2>รายละเอียดสถานะคำขอ</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-info-st">
            <span className={"pill " + (info.st.pill || 'neutral')}>{info.st.label}</span>
            {info.st.desc && <span className="muted" style={{ fontSize: 11.5 }}>{info.st.desc}</span>}
          </div>
          <div className="lpc-tax-sum" style={{ marginTop: 12 }}>
            <div><span className="muted">เลขที่คำขอ (CRM)</span><b className="mono">{req.crmNo}</b></div>
            <div><span className="muted">เลขที่ใบคำขอกู้</span><b className="mono">{req.reqNo || '—'}</b></div>
            {info.rows.map(([k, v]) => (
              <div key={k}><span className="muted">{k}</span><b className={/วัน|เลขที่/.test(k) ? 'mono' : ''}>{v}</b></div>
            ))}
          </div>
          {info.noteBlocks.map(([title, items]) => (
            <div className="lrq-rej-note" key={title}>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>{title}</div>
              {items.length > 1
                ? <ul className="lrq-info-ul">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
                : items[0]}
            </div>
          ))}
          {req.note && <div className="muted" style={{ fontSize: 11.5, marginTop: 10 }}><Icon name="info" size={12} /> {req.note}</div>}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          {editable && <button className="btn primary" onClick={onEdit}><Icon name="edit" /> {req.status === 'rejected' ? 'ปรับแก้ไขคำขอ' : 'เปิดใบคำขอ'}</button>}
        </div>
      </div>
    </div>
  );
}

function LrqMemberCodeSearch({ member, onPick, source }) {
  const list = source || window.GUAR_MEMBERS || window.MEMBERS_LIST || [];
  return (
    <ErpMemberPicker member={member} onPick={onPick} source={list}
                     title="ค้นหาสมาชิก" placeholder="เลขสมาชิก"
                     style={{ width: 208 }} />
  );
}

function LoanRequestInbox({ queue, onPull, onManual, onReturn, onToast, special }) {
  const [kw, setKw] = useState('');
  const [status, setStatus] = useState('all');
  const [dFrom, setDFrom] = useState('');
  const [dTo, setDTo] = useState('');
  const [prodId, setProdId] = useState('');   // filter ประเภทเงินกู้
  const [sFrom, setSFrom] = useState('');     // filter ช่วงวันที่ส่ง
  const [sTo, setSTo] = useState('');
  const [retReq, setRetReq] = useState(null);
  const [infoReq, setInfoReq] = useState(null);   // popup รายละเอียดสถานะ (ทุกสถานะใช้รูปแบบเดียวกัน)
  // เงื่อนไขที่ "ค้นหา" แล้ว — ตารางกรองตามชุดนี้เท่านั้น (แท็บสถานะกรองทันที)
  const [q, setQ] = useState({ kw: '', prodId: '', sFrom: '', sTo: '', dFrom: '', dTo: '' });
  const doSearch = () => setQ({ kw: kw.trim(), prodId, sFrom, sTo, dFrom, dTo });
  const doReset = () => {
    setKw(''); setProdId(''); setSFrom(''); setSTo(''); setDFrom(''); setDTo(''); setStatus('all');
    setQ({ kw: '', prodId: '', sFrom: '', sTo: '', dFrom: '', dTo: '' });
  };
  const inMember = (r) => {
    if (!q.kw) return true;
    const s = q.kw.toLowerCase();
    const g = (window.GUAR_MEMBERS || []).find(m => m.code === r.memberCode);
    const prod = window.lrFindProduct(r.productId);
    return [r.reqNo, r.crmNo, r.memberCode, g && g.name, prod && prod.code, prod && prod.name]
      .some(v => v && String(v).toLowerCase().includes(s));
  };
  const projOf = (r) => (window.lpjListCell ? window.lpjListCell({ key: r.crmNo, productId: r.productId, projectId: r.lpjProjectId, roundId: r.lpjRoundId }).title : '') || '';
  const prodOptions = React.useMemo(() => [...new Set(queue.map(projOf).filter(Boolean))].map(t => ({ v: t, l: t })), [queue]);
  const inProd = (r) => !q.prodId || projOf(r) === q.prodId;
  const inSent = (r) => {
    if (!q.sFrom && !q.sTo) return true;
    const d = String(r.sentAt || '').slice(0, 10);
    if (!d) return false;
    if (q.sFrom && d < q.sFrom) return false;
    if (q.sTo && d > q.sTo) return false;
    return true;
  };

  const DATE_FIELD = { rejected: 'rejectAt', paid: 'payAt', returned: 'returnDate' };
  const dateField = DATE_FIELD[status];
  const rows = queue.filter(r => {
    if (!inMember(r)) return false;
    if (!inProd(r)) return false;
    if (!inSent(r)) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (dateField && (q.dFrom || q.dTo)) {
      const d = String(r[dateField] || '').slice(0, 10);
      if (!d) return false;
      if (q.dFrom && d < q.dFrom) return false;
      if (q.dTo && d > q.dTo) return false;
    }
    return true;
  });
  const scoped = queue.filter(r => inMember(r) && inProd(r) && inSent(r));
  const order = window.LR_STATUS_ORDER || Object.keys(window.LR_CRM_STATUS);
  const counts = { all: scoped.length };
  order.forEach(k => { counts[k] = scoped.filter(r => r.status === k).length; });
  useEffect(() => { setDFrom(''); setDTo(''); setQ(p => ({ ...p, dFrom: '', dTo: '' })); }, [status]);
  const tabs = [{ id: 'all', label: 'ทั้งหมด' },
    ...order.map(k => ({ id: k, label: window.LR_CRM_STATUS[k].label }))];

  return (
    <div data-screen-label={special ? "บันทึกจ่ายเงินกู้พิเศษ — คิวคำขอจาก CRM" : "ใบคำขอกู้เงิน — คิวคำขอจาก CRM"} className="lrq-page">
      <div className="page-actions lrq-topbar">
        <div>
          <h1 className="lrq-title">{special ? 'บันทึกจ่ายเงินกู้พิเศษ' : 'ใบคำขอกู้เงิน'}</h1>
          <div className="muted lrq-subline">
            <span>{special ? 'รายการจ่ายเงินกู้พิเศษ' : 'คำขอกู้'}ที่สมาชิกยื่นผ่าน <b>ระบบ CRM ของสหกรณ์</b> จะถูกส่งเข้ามาที่นี่ — เลือก “สร้างคำขอ” เพื่อทำรายการขอกู้</span>
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onManual}><Icon name="plus" /> สร้างคำขอด้วยตนเอง</button>
      </div>

      <div className="search-card">
        <div className="lrq-inbox-filters">
          <div className="lrq-inbox-msearch">
            <span className="muted" style={{ fontSize: 12 }}>ค้นหา</span>
            <div className="search" style={{ flex: 'none', width: 320, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={kw} onChange={(e) => setKw(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') doSearch(); }}
                     placeholder="เลขที่ใบคำขอ (CRM) / เลขสมาชิก" />
            </div>
          </div>
          <div className="lrq-inbox-msearch">
            <span className="muted" style={{ fontSize: 12 }}>โครงการเงินกู้</span>
            <select className="cfg-input" style={{ width: 260 }} value={prodId} onChange={e => setProdId(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {prodOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div className="lrq-daterange">
            <span className="muted" style={{ fontSize: 12 }}>วันที่ส่ง</span>
            <ErpDate value={sFrom} onChange={setSFrom} style={{ width: 186 }} />
            <span className="muted">—</span>
            <ErpDate value={sTo} onChange={setSTo} style={{ width: 186 }} />
          </div>
          {dateField && (
            <div className="lrq-daterange">
              <span className="muted" style={{ fontSize: 12 }}>
                {status === 'rejected' ? 'วันที่ไม่อนุมัติ' : status === 'paid' ? 'วันที่จ่ายเงิน' : 'วันที่ส่งคืน'}
              </span>
              <ErpDate value={dFrom} onChange={setDFrom} style={{ width: 186 }} />
              <span className="muted">—</span>
              <ErpDate value={dTo} onChange={setDTo} style={{ width: 186 }} />
            </div>
          )}
          <span className="spacer" />
          <div className="lrq-inbox-search-actions">
            <button type="button" className="btn primary" onClick={doSearch}>ค้นหา</button>
            <button type="button" className="btn" onClick={doReset}>รีเซ็ต</button>
          </div>
        </div>

        <div className="lrq-inbox-toolbar">
          <div className="lrq-inbox-tabs">
            {tabs.map(t => (
              <button key={t.id} className={"lrq-itab" + (status === t.id ? ' active' : '')} onClick={() => setStatus(t.id)}>
                {t.label}<span className="lrq-itab-c">{counts[t.id]}</span>
              </button>
            ))}
          </div>
        </div>


        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl lrq-tbl lrq-inbox-tbl">
            <thead><tr>
              <th>เลขที่คำขอ (CRM)</th><th>วันที่ส่ง</th>
              <th>เลขสมาชิก</th><th>ชื่อ-นามสกุล</th><th>โครงการเงินกู้</th>
              <th className="num">จำนวนเงินขอกู้</th><th className="center">สถานะ</th><th className="center" style={{ width: 190 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">— ไม่พบคำขอกู้ที่ตรงกับเงื่อนไข —</td></tr>
              ) : rows.map(r => {
                const g = (window.GUAR_MEMBERS || []).find(m => m.code === r.memberCode);
                const prod = window.lrFindProduct(r.productId);
                const st = window.LR_CRM_STATUS[r.status] || { label: r.status, pill: 'neutral' };
                return (
                  <tr key={r.crmNo} className={r.status === 'pending' ? 'lrq-inbox-new' : ''}>
                    <td className="mono">{r.crmNo}</td>
                    <td className="mono lrq-nowrap">{(() => {
                      const m = String(r.sentAt || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}))?/);
                      if (!m) return r.sentAt;
                      const MO = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                      return m[3] + '/' + MO[Number(m[2]) - 1] + '/' + (Number(m[1]) + 543) + (m[4] ? ' ' + m[4] + ' น.' : '');
                    })()}</td>
                    <td className="mono">{r.memberCode}</td>
                    <td className="lrq-nowrap">{g ? g.name : '—'}</td>
                    <td>
                      {(() => {
                        const c = window.lpjListCell({ key: r.crmNo, productId: r.productId, projectId: r.lpjProjectId, roundId: r.lpjRoundId });
                        return (
                          <>
                            <div style={{ fontWeight: 500 }}>{c.title}</div>
                            <div className="muted" style={{ fontSize: 11.5 }}>{c.sub}</div>
                          </>
                        );
                      })()}
                    </td>
                    <td className="num">{fmt.money(r.amount)}</td>
                    <td className="center">
                      <span className={"pill " + st.pill}>{st.label}</span>
                    </td>
                    <td className="center">
                      <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'center' }}>
                        {(r.status === 'waitapprove' || r.status === 'special' || r.status === 'approved' || r.status === 'paid') ? (
                          <button className="btn ghost sm" style={{ background: '#fff', border: '1px solid #d9d9d9' }} onClick={() => onPull(r)}><Icon name="eye" /> ดู</button>
                        ) : r.status === 'returned' ? (
                          <button className="btn ghost sm" style={{ background: '#fff', border: '1px solid #d9d9d9' }} onClick={() => setInfoReq(r)}><Icon name="eye" /> รายละเอียด</button>
                        ) : (
                          <>
                            <button className="btn primary sm" onClick={() => onPull(r)}>
                              <Icon name={r.status === 'pending' ? 'download' : 'edit'} />{' '}
                              {r.status === 'pending' ? 'ดึงข้อมูลจาก CRM' : 'แก้ไข'}
                            </button>
                            <button className="btn sm" onClick={() => setRetReq(r)}><Icon name="refresh" /> ส่งคืน</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>
      {infoReq && <LrqStatusInfoModal req={infoReq} onClose={() => setInfoReq(null)}
        onEdit={() => { const r = infoReq; setInfoReq(null); onPull(r); }} />}
      {retReq && <ReturnReqModal req={retReq}
        onConfirm={(payload) => { onReturn && onReturn(retReq, payload); setRetReq(null); }}
        onClose={() => setRetReq(null)} />}
    </div>
  );
}

// ── ตัวจัดการมุมมอง: คิว CRM ⇄ สร้างใบคำขอกู้ ──────────────────────
function LoanRequestPage({ onToast, special }) {
  // แยกคิวตามเมนู — บันทึกจ่ายเงินกู้พิเศษ = ประเภทเงินกู้กลุ่มพิเศษเท่านั้น · ใบคำขอกู้เงิน = สามัญ/ฉุกเฉิน
  const isSpecialReq = (r) => { const p = window.lrFindProduct(r.productId); return !!(p && p.group === 'special'); };
  const [queue, setQueue] = useState(() => JSON.parse(JSON.stringify(window.LR_CRM_QUEUE)).filter(r => isSpecialReq(r) === !!special));
  const [view, setView] = useState('inbox');
  const [form, setForm] = useState(null);
  const [srcReq, setSrcReq] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);
  const VIEW_STATUSES = ['waitapprove', 'special', 'approved', 'paid'];

  const mkForm = (base) => special ? window.lrApplySpecialPayout(base) : base;
  const pull = (req) => {
    const readOnly = VIEW_STATUSES.includes(req.status);
    if (!readOnly) setQueue(qs => qs.map(r => r.crmNo === req.crmNo && r.status === 'pending' ? { ...r, status: 'draft' } : r));
    setSrcReq(req);
    setViewOnly(readOnly);
    setForm(mkForm(window.lrFromCrm(req)));
    setView('create');
    onToast && onToast(readOnly
      ? `เปิดใบคำขอ ${req.reqNo || req.crmNo} — โหมดอ่านอย่างเดียว`
      : `สร้างคำขอกู้จาก ${req.crmNo} — สถานะ “แบบร่าง”`);
  };
  const manual = () => { setSrcReq(null); setViewOnly(false); setForm(mkForm(window.lrNewBlankForm())); setView('create'); };

  // ขออนุมัติกรณีพิเศษ — คำขอนอกเกณฑ์ปกติ → ส่งเข้าคิวอนุมัติสินเชื่อ
  const askSpecial = () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (srcReq) {
      setQueue(qs => qs.map(r => r.crmNo === srcReq.crmNo
        ? { ...r, status: 'special', specialBy: 'มนตรี ศรีสุข', specialAt: now,
            specialReason: r.specialReason || 'คำขอนอกเกณฑ์ปกติ — ขอใช้อำนาจผู้จัดการอนุมัติกรณีพิเศษ' }
        : r));
    }
    setView('inbox'); setForm(null); setSrcReq(null);
  };
  const returnReq = (req, p) => {
    setQueue(qs => qs.map(r => r.crmNo === req.crmNo
      ? { ...r, status: 'returned', returnDocNo: p.docNo, returnDate: p.date, returnDocs: p.docs, returnNote: p.note }
      : r));
    const audit = window.useAudit ? null : null;
    if (window.auditLog) window.auditLog({ action: 'update', module: 'สินเชื่อ — ใบคำขอกู้',
      target: `${req.crmNo} · ${req.memberCode}`,
      summary: p.docs.length ? `ส่งคืนคำขอกู้ (${p.docNo}) — เอกสารไม่ครบ ${p.docs.length} รายการ`
                              : `ส่งคืนคำขอกู้ (${p.docNo})`,
      changes: [{ field: 'สถานะคำขอ', before: 'รอสร้างคำขอ', after: 'ส่งคืนคำขอ' },
                { field: 'เอกสารที่ขาด', before: '—', after: p.docs.length ? p.docs.join(', ') : '— ไม่ระบุ' },
                { field: 'เหตุผล', before: '—', after: p.note }] });
    onToast && onToast(p.docs.length
      ? `ส่งคืนคำขอกู้ ${req.crmNo} เรียบร้อย (${p.docNo}) — แจ้งขอเอกสารเพิ่ม ${p.docs.length} รายการ`
      : `ส่งคืนคำขอกู้ ${req.crmNo} เรียบร้อย (${p.docNo})`);
  };
  const back = () => { setView('inbox'); setForm(null); };

  // Breadcrumb: หน้าหลัก › ใบคำขอกู้[พิเศษ] › [สร้าง…] — ตามหน้าย่อยภายใน
  const menuLabel = special ? 'บันทึกจ่ายเงินกู้พิเศษ' : 'ใบคำขอกู้เงิน';
  const pageMode = !srcReq ? 'create' : viewOnly ? 'view' : 'edit';
  const subLabel = pageMode === 'create' ? (special ? 'สร้างบันทึกจ่ายเงินกู้พิเศษ' : 'สร้างใบคำขอกู้เงิน')
    : pageMode === 'view' ? 'รายละเอียด' : 'แก้ไขข้อมูล';
  window.useBreadcrumb(
    (view === 'create' && form)
      ? [{ label: menuLabel, onClick: back }, { label: subLabel, current: true }]
      : [{ label: menuLabel, current: true }],
    [view, !!form, special, pageMode]
  );

  if (view === 'create' && form) return <LoanRequestForm initial={form} onBack={back} onToast={onToast} special={special} onSpecial={askSpecial} viewOnly={viewOnly} reqMeta={srcReq} pageMode={pageMode} />;
  return <LoanRequestInbox queue={queue} onPull={pull} onManual={manual} onReturn={returnReq} onToast={onToast} special={special} />;
}

Object.assign(window, { LoanRequestPage, LoanRequestForm, LoanRequestInbox });
window.COLL_EDITABLE_FIELDS = COLL_EDITABLE;
