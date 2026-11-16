// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่าย › หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)
//  · ออกตามรายบุคคล โดยอ้างอิงรายการในใบสำคัญจ่าย (ติ๊กเลือกรายผู้รับเงิน)
//  · WhtCertModal — เตรียม/แก้ไขข้อมูลผู้ถูกหักภาษีก่อนพิมพ์
//  · WhtCertSheet — แบบฟอร์มราชการ (มาตรา 50 ทวิ) สำหรับพิมพ์/บันทึก PDF
// ════════════════════════════════════════════════════════════════════

// trigger พิมพ์ (ใช้กลไกเดียวกับการพิมพ์เอกสารอื่นในระบบ)
window.printWhtCert = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมหนังสือรับรองหัก ณ ที่จ่าย — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

// ─── กล่องเลขประจำตัวผู้เสียภาษี (13 หลัก หรือ 10 ช่องว่างแบบเดิม) ─────
function WhtTaxBoxes({ value, count = 13 }) {
  const digits = String(value || '').replace(/\D/g, '').padEnd(count, ' ').slice(0, count).split('');
  const gaps = count === 13 ? new Set([1, 5, 10, 12]) : new Set();   // X-XXXX-XXXXX-XX-X
  return (
    <span className="wht-taxboxes">
      {digits.map((d, i) => (
        <span key={i} className={"wht-tb" + (gaps.has(i) ? ' gap' : '')}>{d.trim()}</span>
      ))}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal — เตรียมหนังสือรับรองตามรายบุคคล
// ════════════════════════════════════════════════════════════════════
function WhtCertModal({ voucher, onClose, onToast }) {
  const [certs, setCerts] = useState(() => window.vchCertsLoad(voucher));
  const coop = React.useMemo(() => window.vchCoopInfo(), []);

  const setCert = (i, patch) => setCerts(cs => cs.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const setRow = (ci, ri, k, v) => setCerts(cs => cs.map((c, idx) => idx === ci
    ? { ...c, rows: c.rows.map((r, j) => j === ri ? { ...r, [k]: v } : r) } : c));
  const recalc = (ci) => setCerts(cs => cs.map((c, idx) => {
    if (idx !== ci) return c;
    const totalAmount = c.rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalTax = c.rows.reduce((s, r) => s + Number(r.tax || 0), 0);
    return { ...c, totalAmount, totalTax };
  }));
  const addRow = (ci) => setCerts(cs => cs.map((c, idx) => idx === ci
    ? { ...c, rows: [...c.rows, { section: '6', detail: '', amount: 0, tax: 0 }] } : c));
  const rmRow = (ci, ri) => setCerts(cs => cs.map((c, idx) => idx === ci
    ? { ...c, rows: c.rows.filter((_, j) => j !== ri) } : c));

  const persist = () => { window.vchCertsSave(voucher.id, certs); };

  const [printSet, setPrintSet] = useState(null);
  const doPrint = (subset) => {
    persist();
    setPrintSet(subset);
    setTimeout(() => window.printWhtCert(onToast), 90);
  };

  const totalTaxAll = certs.reduce((s, c) => s + Number(c.totalTax || 0), 0);

  return (
    <>
      <div className="modal-backdrop" onClick={() => { persist(); onClose(); }} />
      <div className="modal-card wht-modal" style={{ width: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="receipt" /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2>หนังสือรับรองการหักภาษี ณ ที่จ่าย (50 ทวิ)</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              อ้างอิงใบสำคัญจ่าย <span className="mono">{voucher.id}</span> · ออกตามรายบุคคลตามแบบฟอร์มราชการ
            </div>
          </div>
          <button className="close-btn" onClick={() => { persist(); onClose(); }} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="wht-payer-card">
            <div className="wht-payer-ic"><Icon name="cog" size={14} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="wht-payer-lab">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย <span className="muted">(ดึงจากค่าคงที่ข้อมูลสหกรณ์)</span></div>
              <div className="wht-payer-name">{coop.name}</div>
              <div className="wht-payer-meta muted">
                เลขประจำตัวผู้เสียภาษี <span className="mono">{coop.taxId}</span> · {coop.address}
              </div>
            </div>
          </div>

          {certs.length === 0 ? (
            <div className="wht-empty">
              <Icon name="info" size={16} />
              <div>
                <b>ใบสำคัญจ่ายนี้ยังไม่มีผู้รับเงินที่เลือกหักภาษี ณ ที่จ่าย</b>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  กลับไปที่ฟอร์มใบสำคัญจ่าย แล้วติ๊ก “หัก ณ ที่จ่าย” ในช่องของผู้รับเงินที่ต้องออกหนังสือรับรอง
                </div>
              </div>
            </div>
          ) : (
            <>
              {certs.length > 1 && (
                <div className="wht-multi-note">
                  <Icon name="info" size={13} />
                  <span>ใบสำคัญจ่ายนี้มีผู้รับเงินที่ถูกหักภาษี <b>{certs.length} ราย</b> — ระบบจะออกหนังสือรับรอง
                    <b> แยกเป็นรายบุคคล คนละ 1 ฉบับ</b> (กดพิมพ์ทีละราย หรือ “พิมพ์ทั้งหมด” เพื่อพิมพ์ต่อเนื่องทุกราย)</span>
                </div>
              )}
              <div className="wht-recip-head">
                <span>ผู้ถูกหักภาษี ณ ที่จ่าย — {certs.length} ราย</span>
                <span className="spacer" style={{ flex: 1 }} />
                <span className="muted" style={{ fontSize: 12 }}>รวมภาษีที่หักนำส่ง</span>
                <b className="mono" style={{ fontSize: 13 }}>{fmt.money(totalTaxAll, 2)} บาท</b>
              </div>

              {certs.map((c, ci) => {
                const sec = (k) => (window.VCH_INCOME_SECTION(k) || {});
                return (
                  <div className="wht-recip-card" key={ci}>
                    <div className="wht-recip-top">
                      <span className="wht-recip-seq mono">#{ci + 1}</span>
                      <div className="wht-recip-name">{c.name}</div>
                      <span className="chip info">{(window.VCH_PAYEE_TYPES.find(t => t.v === c.type) || {}).l || '—'}</span>
                      <span className="spacer" style={{ flex: 1 }} />
                      <button className="btn primary sm" onClick={() => doPrint([c])}>
                        <Icon name="print" size={13} /> พิมพ์หนังสือรับรอง
                      </button>
                    </div>

                    <div className="wht-grid">
                      <div className="wht-field wht-f2">
                        <label>เลขประจำตัวผู้เสียภาษี / บัตรประชาชน</label>
                        <input className="cfg-input mono" value={c.taxId} maxLength={13}
                               onChange={(e) => setCert(ci, { taxId: e.target.value.replace(/\D/g, '') })} />
                      </div>
                      <div className="wht-field">
                        <label>แบบยื่นรายการ</label>
                        <select className="cfg-input" value={c.pndType} onChange={(e) => setCert(ci, { pndType: e.target.value })}>
                          {window.VCH_PND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="wht-field">
                        <label>ลำดับที่ในแบบ</label>
                        <input className="cfg-input mono" value={c.seqNo} onChange={(e) => setCert(ci, { seqNo: e.target.value })} />
                      </div>
                      <div className="wht-field wht-f4">
                        <label>ที่อยู่ผู้ถูกหักภาษี</label>
                        <input className="cfg-input" value={c.address} placeholder="ระบุที่อยู่ตามหลักฐาน"
                               onChange={(e) => setCert(ci, { address: e.target.value })} />
                      </div>
                    </div>

                    <table className="tbl wht-rows-tbl">
                      <thead>
                        <tr>
                          <th style={{ width: 160 }}>ประเภทเงินได้</th>
                          <th>รายละเอียด</th>
                          <th style={{ width: 120 }}>วันที่จ่าย</th>
                          <th className="right" style={{ width: 120 }}>จำนวนเงินที่จ่าย</th>
                          <th className="right" style={{ width: 110 }}>ภาษีที่หัก</th>
                          <th style={{ width: 32 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {c.rows.map((r, ri) => (
                          <tr key={ri}>
                            <td>
                              <select className="vch-cell-input" value={r.section} onChange={(e) => setRow(ci, ri, 'section', e.target.value)}>
                                {window.VCH_INCOME_SECTIONS.map(s => <option key={s.key} value={s.key}>{s.no} {sec(s.key).label.slice(0, 16)}…</option>)}
                              </select>
                            </td>
                            <td><input className="vch-cell-input" value={r.detail} placeholder="คำอธิบาย"
                                       onChange={(e) => setRow(ci, ri, 'detail', e.target.value)} /></td>
                            <td><ErpDate value={r.date || c.payDate} onChange={(v) => ((e) => setRow(ci, ri, 'date', e.target.value))({ target: { value: v } })} className="vch-cell-input" /></td>
                            <td><input className="vch-cell-input num" type="number" value={r.amount}
                                       onChange={(e) => setRow(ci, ri, 'amount', Number(e.target.value || 0))} onBlur={() => recalc(ci)} /></td>
                            <td><input className="vch-cell-input num" type="number" value={r.tax}
                                       onChange={(e) => setRow(ci, ri, 'tax', Number(e.target.value || 0))} onBlur={() => recalc(ci)} /></td>
                            <td className="center"><button className="bud-act danger" onClick={() => { rmRow(ci, ri); setTimeout(() => recalc(ci), 0); }}><Icon name="close" size={12} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="right">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
                          <td className="right mono">{fmt.money(c.totalAmount, 2)}</td>
                          <td className="right mono" style={{ fontWeight: 700 }}>{fmt.money(c.totalTax, 2)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>

                    <div className="wht-recip-foot">
                      <button className="btn ghost sm" onClick={() => addRow(ci)}><Icon name="plus" size={12} /> เพิ่มประเภทเงินได้</button>
                      <span className="spacer" style={{ flex: 1 }} />
                      <span className="wht-cond-lab muted">ผู้จ่ายเงิน:</span>
                      <select className="cfg-input sm" style={{ width: 190 }} value={c.payerCondition}
                              onChange={(e) => setCert(ci, { payerCondition: e.target.value })}>
                        {window.VCH_PAYER_CONDITIONS.map(o => <option key={o.v} value={o.v}>{`(${o.v}) ${o.l}`}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <div className="muted" style={{ fontSize: 11.5 }}>
            <Icon name="info" size={12} /> ข้อมูลที่แก้ไขจะถูกบันทึกไว้กับใบสำคัญจ่ายนี้
          </div>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={() => { persist(); onClose(); }}>ปิด</button>
          {certs.length > 0 && (
            <button className="btn primary" onClick={() => doPrint(certs)}>
              <Icon name="print" /> พิมพ์ทั้งหมด ({certs.length} ราย)
            </button>
          )}
        </div>
      </div>

      <WhtCertSheet voucher={voucher} certs={printSet} />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  แบบฟอร์มราชการ — หนังสือรับรองการหักภาษี ณ ที่จ่าย (มาตรา 50 ทวิ)
//  รับได้ทั้ง { voucher, certs:[] } (จาก modal) หรือ { pages:[{voucher,cert}] }
// ════════════════════════════════════════════════════════════════════
function WhtCertSheet({ voucher, certs, pages }) {
  const items = pages || (certs || []).map(c => ({ voucher, cert: c }));
  if (!items.length) return null;
  const coop = window.vchCoopInfo();
  const now = new Date();
  const THMONTH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

  const Party = ({ role, name, taxId, address }) => (
    <div className="wht-party">
      <div className="wht-party-l">
        <div className="wht-party-role">{role} : -</div>
        <div className="wht-party-name"><b>ชื่อ</b> {name}</div>
        <div className="wht-party-hint">(ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล)</div>
        <div className="wht-party-name"><b>ที่อยู่</b> {address || '...............................................................................................'}</div>
        <div className="wht-party-hint">(ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div>
      </div>
      <div className="wht-party-r">
        <div className="wht-taxrow">
          <span className="wht-taxlab">เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)*</span>
          <WhtTaxBoxes value={taxId} />
        </div>
        <div className="wht-taxrow">
          <span className="wht-taxlab">เลขประจำตัวผู้เสียภาษีอากร</span>
          <WhtTaxBoxes value="" count={10} />
        </div>
      </div>
    </div>
  );

  const Page = ({ voucher: v, cert, idx, last }) => {
    const bySection = {};
    cert.rows.forEach(r => {
      if (!bySection[r.section]) bySection[r.section] = { amount: 0, tax: 0, details: [], date: r.date || cert.payDate };
      bySection[r.section].amount += Number(r.amount || 0);
      bySection[r.section].tax += Number(r.tax || 0);
      if (r.detail) bySection[r.section].details.push(r.detail);
    });
    const sumAmount = cert.rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    const sumTax = cert.rows.reduce((s, r) => s + Number(r.tax || 0), 0);
    const cond = (window.VCH_PAYER_CONDITIONS.find(c => c.v === cert.payerCondition) || {}).v || '1';
    const beYY = String((now.getFullYear() + 543) % 100).padStart(2, '0');
    const runNo = String(v.id.replace(/\D/g, '').slice(-6)).padStart(6, '0');

    const Cells = ({ k }) => {
      const d = bySection[k];
      return (
        <>
          <td className="center wht-c-date">{d ? fmt.date(d.date) : ''}</td>
          <td className="right mono wht-c-amt">{d ? fmt.money(d.amount, 2) : ''}</td>
          <td className="right mono wht-c-tax">{d ? fmt.money(d.tax, 2) : ''}</td>
        </>
      );
    };
    const detailOf = (k) => (bySection[k] && bySection[k].details.length) ? bySection[k].details.join(', ') : '';

    return (
      <div className={"wht-sheet" + (last ? '' : ' wht-break')}>
        <div className="wht-pretop">
          <div className="wht-copy-lines">
            <div><b>ฉบับที่ 1</b> <span className="wht-copy-note">(สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)</span></div>
            <div><b>ฉบับที่ 2</b> <span className="wht-copy-note">(สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)</span></div>
          </div>
          <div className="wht-jobref mono">{v.id}</div>
        </div>

        <div className="wht-form-box">
          <div className="wht-hd">
            <div className="wht-hd-title">
              <div className="wht-title-main">หนังสือรับรองการหักภาษี ณ ที่จ่าย</div>
              <div className="wht-title-sub">ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร</div>
            </div>
            <div className="wht-hd-ref">
              <div>เล่มที่ <span className="wht-dotfill" /></div>
              <div>เลขที่ <b className="mono">{beYY}/{runNo}</b></div>
            </div>
          </div>

          <Party role="ผู้มีหน้าที่หักภาษี ณ ที่จ่าย" name={coop.name} taxId={coop.taxId} address={coop.address} />
          <Party role="ผู้ถูกหักภาษี ณ ที่จ่าย" name={cert.name} taxId={cert.taxId} address={cert.address} />

          <div className="wht-pnd">
            <div className="wht-pnd-l">
              <div className="wht-pnd-seq">ลำดับที่ <span className="wht-seqbox mono">{cert.seqNo}</span> ในแบบ</div>
              <div className="wht-pnd-hint">(ให้สามารถอ้างอิงหรือสอบยันกันได้ระหว่างลำดับที่ตามหนังสือรับรองฯ กับแบบยื่นรายการภาษีหัก ณ ที่จ่าย)</div>
            </div>
            <div className="wht-pnd-grid">
              {window.VCH_PND_TYPES.map((t, i) => (
                <span className="wht-pnd-opt" key={t}>
                  <span className={"wht-chk" + (cert.pndType === t ? ' on' : '')}>{cert.pndType === t ? '✕' : ''}</span>
                  ({i + 1}) {t}
                </span>
              ))}
            </div>
          </div>

        <table className="wht-table">
          <thead>
            <tr>
              <th>ประเภทเงินได้พึงประเมินที่จ่าย</th>
              <th style={{ width: 80 }}>วัน เดือน<br />หรือปีภาษี<br />ที่จ่าย</th>
              <th style={{ width: 110 }}>จำนวนเงิน<br />ที่จ่าย</th>
              <th style={{ width: 110 }}>ภาษีที่หัก<br />และนำส่งไว้</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="wht-sec"><span className="wht-sec-n">1.</span><span className="wht-sec-t">เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส ฯลฯ ตามมาตรา 40 (1)</span></td><Cells k="1" /></tr>
            <tr><td className="wht-sec"><span className="wht-sec-n">2.</span><span className="wht-sec-t">ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40 (2)</span></td><Cells k="2" /></tr>
            <tr><td className="wht-sec"><span className="wht-sec-n">3.</span><span className="wht-sec-t">ค่าแห่งลิขสิทธิ์ ฯลฯ ตามมาตรา 40 (3)</span></td><Cells k="3" /></tr>
            <tr><td className="wht-sec"><span className="wht-sec-n">4.</span><span className="wht-sec-t">(ก) ดอกเบี้ย ฯลฯ ตามมาตรา 40 (4) (ก)</span></td><Cells k="4a" /></tr>
            <tr>
              <td className="wht-sec wht-sec-4b">
                <span className="wht-sec-n" />
                <div className="wht-sec-t">
                  <div>(ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ ตามมาตรา 40 (4) (ข)</div>
                  <div className="wht-sub">
                    <div>(1) กรณีผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยจ่ายจากกำไรสุทธิของกิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราดังนี้</div>
                    <div className="wht-sub2 col">
                      <span><span className="wht-chk sm" /> (1.1) อัตราร้อยละ 30 ของกำไรสุทธิ</span>
                      <span><span className="wht-chk sm" /> (1.2) อัตราร้อยละ 25 ของกำไรสุทธิ</span>
                      <span><span className="wht-chk sm" /> (1.3) อัตราร้อยละ 20 ของกำไรสุทธิ</span>
                      <span><span className="wht-chk sm" /> (1.4) อัตราอื่น ๆ (ระบุ) ........ ของกำไรสุทธิ</span>
                    </div>
                    <div>(2) กรณีผู้ได้รับเงินปันผลไม่ได้รับเครดิตภาษี เนื่องจากจ่ายจาก</div>
                    <div className="wht-sub2 col">
                      <span>(2.1) กำไรสุทธิของกิจการที่ได้รับยกเว้นภาษีเงินได้นิติบุคคล</span>
                      <span>(2.2) เงินปันผลหรือเงินส่วนแบ่งของกำไรที่ได้รับยกเว้นไม่ต้องนำมารวมคำนวณเป็นรายได้เพื่อเสียภาษีเงินได้นิติบุคคล</span>
                      <span>(2.3) กำไรสุทธิส่วนที่ได้หักผลขาดทุนสุทธิยกมาไม่เกิน 5 ปี ก่อนรอบระยะเวลาบัญชีปีปัจจุบัน</span>
                      <span>(2.4) กำไรที่รับรู้ทางบัญชีโดยวิธีส่วนได้เสีย (equity method)</span>
                      <span>(2.5) อื่น ๆ (ระบุ)</span>
                    </div>
                  </div>
                </div>
              </td>
              <Cells k="4b" />
            </tr>
            <tr>
              <td className="wht-sec">
                <span className="wht-sec-n">5.</span>
                <span className="wht-sec-t">การจ่ายเงินได้ที่ต้องหักภาษี ณ ที่จ่าย ตามคำสั่งกรมสรรพากรที่ออกตามมาตรา 3 เตรส เช่น รางวัล ส่วนลดหรือประโยชน์ใด ๆ เนื่องจากการส่งเสริมการขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าแสดงของนักแสดงสาธารณะ ค่าจ้างทำของ ค่าโฆษณา ค่าเช่า ค่าขนส่ง ค่าบริการ ค่าเบี้ยประกันวินาศภัย ฯลฯ
                  {detailOf('5') && <div className="wht-sec-detail">— {detailOf('5')}</div>}
                </span>
              </td>
              <Cells k="5" />
            </tr>
            <tr>
              <td className="wht-sec"><span className="wht-sec-n">6.</span><span className="wht-sec-t">อื่น ๆ (ระบุ) {detailOf('6') ? <b>{detailOf('6')}</b> : <span className="wht-dots">......................................................</span>}</span></td>
              <Cells k="6" />
            </tr>
            <tr className="wht-total-row">
              <td className="right">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
              <td />
              <td className="right mono">{fmt.money(sumAmount, 2)}</td>
              <td className="right mono">{fmt.money(sumTax, 2)}</td>
            </tr>
            <tr className="wht-baht-row">
              <td colSpan="4">รวมเงินภาษีที่หักนำส่ง (ตัวอักษร) &nbsp;&nbsp;<b>( {window.bahtText(sumTax)} )</b></td>
            </tr>
          </tbody>
        </table>

        <div className="wht-fund">
          เงินที่จ่ายเข้า กบข./กสจ./กองทุนสงเคราะห์ครูโรงเรียนเอกชน <span className="wht-dots">.............</span> บาท
          กองทุนประกันสังคม <span className="wht-dots">.............</span> บาท
          กองทุนสำรองเลี้ยงชีพ <span className="wht-dots">.............</span> บาท
        </div>

        <div className="wht-cond">
          <span className="wht-cond-title">ผู้จ่ายเงิน</span>
          {window.VCH_PAYER_CONDITIONS.map(o => (
            <span className="wht-cond-opt" key={o.v}>
              <span className={"wht-chk" + (cond === o.v ? ' on' : '')}>{cond === o.v ? '✕' : ''}</span>
              ({o.v}) {o.l}{o.v === '4' ? ' .........................' : ''}
            </span>
          ))}
        </div>

        <div className="wht-bottom">
          <div className="wht-warn-cell">
            <b>คำเตือน</b> ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35 แห่งประมวลรัษฎากร
          </div>
          <div className="wht-cert-cell">
            <div className="wht-cert-text">ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ</div>
            <div className="wht-sign-row2">
              <div className="wht-sign-main">
                <div className="wht-sign-line">ลงชื่อ ......................................................... ผู้จ่ายเงิน</div>
                <div className="wht-sign-name">( {v.createdBy} )</div>
                <div className="wht-sign-date"><span className="wht-dotfill sm" />&nbsp;{now.getDate()} {THMONTH[now.getMonth()]} {now.getFullYear() + 543}&nbsp;<span className="wht-dotfill sm" /></div>
                <div className="wht-sign-sub">(วัน เดือน ปี ที่ออกหนังสือรับรองฯ)</div>
              </div>
              <div className="wht-seal">ประทับตรา<br />นิติบุคคล<br />(ถ้ามี)</div>
            </div>
          </div>
        </div>
        </div>

        <div className="wht-remark">
          <b>หมายเหตุ</b> เลขประจำตัวผู้เสียภาษีอากร (13 หลัก)* หมายถึง
          (1) กรณีบุคคลธรรมดาไทย ให้ใช้เลขประจำตัวประชาชนของกรมการปกครอง
          (2) กรณีนิติบุคคล ให้ใช้เลขทะเบียนนิติบุคคลของกรมพัฒนาธุรกิจการค้า
          (3) กรณีอื่น ๆ ให้ใช้เลขประจำตัวผู้เสียภาษีอากร (13 หลัก) ของกรมสรรพากร
        </div>
        <div className="wht-foot muted">อ้างอิงใบสำคัญจ่ายเลขที่ {v.id} · พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</div>
      </div>
    );
  };

  const sheet = (
    <div className="wht-cert-portal member-print-portal">
      {items.map((it, i) => <Page key={i} voucher={it.voucher} cert={it.cert} idx={i} last={i === items.length - 1} />)}
    </div>
  );
  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { WhtCertModal, WhtCertSheet });
