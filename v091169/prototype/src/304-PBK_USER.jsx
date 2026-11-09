// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ตั้งค่าการพิมพ์สมุดคู่ฝาก / Passbook
//  ฟอร์มตั้งค่า + พรีวิวทดสอบตำแหน่งพิมพ์ (ปรับ X/Y/ระยะบรรทัดเห็นผลทันที)
// ════════════════════════════════════════════════════════════════════

const PBK_USER = 'จันทร์เพ็ญ มาลี';
// ค่าที่ย้ายมาจากข้อกำหนดระบบเงินฝาก (การพิมพ์สมุดคู่ฝาก)
const PBK_EXTRA_DEFAULTS = { dataPos: 'คอลัมน์ 1–80', newPageAuto: true, printTxn: true, printBalance: true, cardPrintOn: false };
function pbkLoad() {
  let v = null;
  try { const s = localStorage.getItem('dep_passbook'); if (s) v = JSON.parse(s); } catch (e) {}
  const fresh = !v || v.dataPos == null;
  v = { ...PBK_EXTRA_DEFAULTS, ...window.DEP_PASSBOOK_SEED, ...(v || {}) };
  try {
    const sc = JSON.parse(localStorage.getItem('dep_sysconfig') || 'null');
    if (sc && fresh) {
      if (sc.pbDataPos != null) v.dataPos = sc.pbDataPos;
      if (sc.pbNewPageAuto != null) v.newPageAuto = sc.pbNewPageAuto;
      if (sc.pbPrintTxn != null) v.printTxn = sc.pbPrintTxn;
      if (sc.pbPrintBalance != null) v.printBalance = sc.pbPrintBalance;
      if (sc.cardPrintOn != null) v.cardPrintOn = sc.cardPrintOn;
    }
  } catch (e) {}
  return v;
}
function pbkSaveLS(cfg) { try { localStorage.setItem('dep_passbook', JSON.stringify(cfg)); } catch (e) {} }

function PbkToggle({ on, onChange }) {
  return (
    <button type="button" className={"lt-switch" + (on ? ' on' : '')} role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span className="lt-switch-knob" />
    </button>
  );
}
const PBK_DATE_FORMATS = [
  'วว/ดด/ปป (พ.ศ.)',
  'วว/ดด/ปปปป (พ.ศ.)',
  'วว ดด ปป (พ.ศ. · เว้นวรรค)',
  'วว/ดด/ปป (ค.ศ.)',
];

function PbkRow({ label, hint, children }) {
  return (
    <div className="pbk-row">
      <div className="pbk-row-l"><div className="pbk-row-label">{label}</div>{hint && <div className="pbk-row-hint">{hint}</div>}</div>
      <div className="pbk-row-c">{children}</div>
    </div>
  );
}

function DepPassbookConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [cfg, setCfg] = useState(pbkLoad);
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => { setCfg(c => ({ ...c, [k]: v })); setDirty(true); };
  const sample = window.DEP_PASSBOOK_SAMPLE;

  const [askSave, setAskSave] = useState(false);
  const [saved, setSaved] = useState(pbkLoad);
  const PBK_LABELS = {
    format: 'รูปแบบสมุดคู่ฝาก', template: 'Template การพิมพ์', txtFormat: 'รูปแบบข้อความรายการ', dateFormat: 'รูปแบบวันที่',
    moneyFormat: 'รูปแบบยอดเงิน', linesPerPage: 'จำนวนบรรทัดต่อหน้า', startLine: 'บรรทัดเริ่มพิมพ์',
    startOffsetX: 'ตำแหน่งเริ่มพิมพ์แนวนอน (X)', startOffsetY: 'ตำแหน่งเริ่มพิมพ์แนวตั้ง (Y)', lineSpacing: 'ระยะห่างบรรทัด',
    printer: 'เครื่องพิมพ์ที่ใช้', autoPassbook: 'รองรับ Auto Passbook', mobileNoBook: 'รายการผ่าน Mobile = No Book',
    dataPos: 'ตำแหน่งข้อมูล / รูปแบบบรรทัด', newPageAuto: 'ขึ้นหน้าใหม่อัตโนมัติเมื่อเต็มหน้า', printTxn: 'พิมพ์รายการฝาก/ถอน',
    printBalance: 'พิมพ์ยอดคงเหลือ', cardPrintOn: 'พิมพ์ Card / เอกสารประกอบบัญชี',
  };
  const PBK_UNIT = { linesPerPage: ' บรรทัด', startLine: '', startOffsetX: ' มม.', startOffsetY: ' มม.', lineSpacing: ' มม.' };
  const pbkChanges = () => Object.keys(PBK_LABELS).filter(k => String(saved[k]) !== String(cfg[k])).map(k => ({
    field: PBK_LABELS[k],
    after: typeof cfg[k] === 'boolean' ? (cfg[k] ? 'เปิด' : 'ปิด') : String(cfg[k]) + (PBK_UNIT[k] || ''),
  }));
  const save = () => {
    setAskSave(false);
    pbkSaveLS(cfg); setDirty(false); setSaved(cfg);
    audit.log({ action: 'update', module: 'เงินฝาก — ตั้งค่าพิมพ์สมุดคู่ฝาก', target: cfg.template,
      summary: `บันทึกการตั้งค่าพิมพ์สมุดคู่ฝาก (${cfg.format})` });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกการตั้งค่าพิมพ์สมุดคู่ฝากเรียบร้อยแล้ว — มีผลกับสมุดทุกเล่มที่พิมพ์หลังจากนี้' });
  };
  const testPrint = () => onToast && onToast('ส่งหน้าทดสอบไปยังเครื่องพิมพ์ — ตรวจตำแหน่งบนสมุดจริงแล้วปรับ X/Y ก่อนพิมพ์รายการ');

  // ระยะ offset → px ในพรีวิว (1 มม. ≈ 3.2 px)
  const mm = (v) => Number(v) * 3.2;

  return (
    <div data-screen-label="หน้าตั้งค่าพิมพ์สมุดคู่ฝาก">
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(r.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ตั้งค่าการพิมพ์สมุดคู่ฝาก / Passbook</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ตั้งรูปแบบและตำแหน่งพิมพ์สมุดคู่ฝาก รองรับ Auto Passbook — รายการผ่าน Mobile แสดงเป็น “No Book”</div>
        </div>
        <span className="spacer" />
        {dirty && <span className="chip warning" style={{ marginRight: 4 }}><Icon name="edit" size={11} /> ยังไม่บันทึก</span>}
        <button className="btn sm" data-keep-top="" onClick={testPrint}><Icon name="print" /> ทดสอบตำแหน่งพิมพ์</button>
        <button className="btn primary sm" data-keep-top="" onClick={() => setAskSave(true)} disabled={!dirty}><Icon name="check" /> บันทึกการตั้งค่า</button>
      </div>
      {askSave && (
        <window.DepChangeConfirm title="บันทึกการเปลี่ยนแปลง?"
          subtitle="มีผลกับสมุดคู่ฝากทุกเล่มที่พิมพ์หลังจากนี้"
          changes={pbkChanges()} okLabel="ยืนยันบันทึก" onOk={save} onClose={() => setAskSave(false)} />
      )}

      <div className="pbk-layout">
        {/* ── ฟอร์มตั้งค่า ── */}
        <div className="pbk-form">
          <div className="search-card dat-section">
            <div className="dat-section-head">
              <span className="dat-section-ico"><Icon name="print" size={15} /></span>
              <div><div className="dat-section-title">รูปแบบสมุดและเทมเพลต</div><div className="muted" style={{ fontSize: 11.5 }}>เลือกรูปแบบสมุดคู่ฝากและรูปแบบการแสดงผล</div></div>
            </div>
            <div style={{ padding: '4px 2px' }}>
              <PbkRow label="รูปแบบสมุดคู่ฝาก">
                <select className="cfg-input" value={cfg.format} onChange={(e) => set('format', e.target.value)}>
                  {window.DEP_PASSBOOK_FORMATS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </PbkRow>
              <PbkRow label="Template การพิมพ์">
                <input className="cfg-input mono" value={cfg.template} onChange={(e) => set('template', e.target.value)} />
              </PbkRow>
              <PbkRow label="รูปแบบข้อความรายการ">
                <input className="cfg-input" value={cfg.txtFormat} onChange={(e) => set('txtFormat', e.target.value)} />
              </PbkRow>
              <PbkRow label="รูปแบบวันที่">
                <select className="cfg-input mono" value={cfg.dateFormat} onChange={(e) => set('dateFormat', e.target.value)}>
                  {PBK_DATE_FORMATS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </PbkRow>
              <PbkRow label="รูปแบบยอดเงิน">
                <input className="cfg-input mono" value={cfg.moneyFormat} onChange={(e) => set('moneyFormat', e.target.value)} />
              </PbkRow>
            </div>
          </div>

          <div className="search-card dat-section">
            <div className="dat-section-head">
              <span className="dat-section-ico"><Icon name="column" size={15} /></span>
              <div><div className="dat-section-title">ตำแหน่งและระยะการพิมพ์</div><div className="muted" style={{ fontSize: 11.5 }}>ปรับตำแหน่งเริ่มพิมพ์และระยะบรรทัด — ดูผลในพรีวิวด้านขวา</div></div>
            </div>
            <div style={{ padding: '4px 2px' }}>
              <PbkRow label="จำนวนบรรทัดต่อหน้า">
                <div className="lt-num-wrap pbk-num"><input className="cfg-input mono" type="number" value={cfg.linesPerPage} onChange={(e) => set('linesPerPage', e.target.value)} /><span className="lt-suffix">บรรทัด</span></div>
              </PbkRow>
              <PbkRow label="บรรทัดเริ่มพิมพ์">
                <div className="lt-num-wrap pbk-num"><input className="cfg-input mono" type="number" value={cfg.startLine} onChange={(e) => set('startLine', e.target.value)} /><span className="lt-suffix">บรรทัดที่</span></div>
              </PbkRow>
              <PbkRow label="ตำแหน่งเริ่มพิมพ์แนวนอน (X)" hint="ระยะขอบซ้าย">
                <div className="lt-num-wrap pbk-num"><input className="cfg-input mono" type="number" step="0.5" value={cfg.startOffsetX} onChange={(e) => set('startOffsetX', e.target.value)} /><span className="lt-suffix">มม.</span></div>
              </PbkRow>
              <PbkRow label="ตำแหน่งเริ่มพิมพ์แนวตั้ง (Y)" hint="ระยะขอบบน">
                <div className="lt-num-wrap pbk-num"><input className="cfg-input mono" type="number" step="0.5" value={cfg.startOffsetY} onChange={(e) => set('startOffsetY', e.target.value)} /><span className="lt-suffix">มม.</span></div>
              </PbkRow>
              <PbkRow label="ระยะห่างบรรทัด">
                <div className="lt-num-wrap pbk-num"><input className="cfg-input mono" type="number" step="0.1" value={cfg.lineSpacing} onChange={(e) => set('lineSpacing', e.target.value)} /><span className="lt-suffix">มม.</span></div>
              </PbkRow>
              <PbkRow label="ตำแหน่งข้อมูล / รูปแบบบรรทัด">
                <input className="cfg-input" value={cfg.dataPos || ''} placeholder="เช่น คอลัมน์ 1–80" onChange={(e) => set('dataPos', e.target.value)} />
              </PbkRow>
              <PbkRow label="เครื่องพิมพ์ที่ใช้">
                <select className="cfg-input" value={cfg.printer} onChange={(e) => set('printer', e.target.value)}>
                  {window.DEP_PASSBOOK_PRINTERS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </PbkRow>
            </div>
          </div>

          <div className="search-card dat-section">
            <div className="dat-section-head">
              <span className="dat-section-ico"><Icon name="file" size={15} /></span>
              <div><div className="dat-section-title">ข้อมูลที่พิมพ์ลงสมุด</div><div className="muted" style={{ fontSize: 11.5 }}>เลือกข้อมูลที่พิมพ์ และการขึ้นหน้าใหม่</div></div>
            </div>
            <div style={{ padding: '4px 2px' }}>
              <PbkRow label="ขึ้นหน้าใหม่อัตโนมัติเมื่อเต็มหน้า"><PbkToggle on={!!cfg.newPageAuto} onChange={(v) => set('newPageAuto', v)} /></PbkRow>
              <PbkRow label="พิมพ์รายการฝาก/ถอน"><PbkToggle on={!!cfg.printTxn} onChange={(v) => set('printTxn', v)} /></PbkRow>
              <PbkRow label="พิมพ์ยอดคงเหลือ"><PbkToggle on={!!cfg.printBalance} onChange={(v) => set('printBalance', v)} /></PbkRow>
              <PbkRow label="พิมพ์ Card / เอกสารประกอบบัญชี"><PbkToggle on={!!cfg.cardPrintOn} onChange={(v) => set('cardPrintOn', v)} /></PbkRow>
            </div>
          </div>

          <div className="search-card dat-section">
            <div className="dat-section-head">
              <span className="dat-section-ico"><Icon name="wallet" size={15} /></span>
              <div><div className="dat-section-title">Auto Passbook & No Book</div><div className="muted" style={{ fontSize: 11.5 }}>การพิมพ์อัตโนมัติและรายการผ่านช่องทางดิจิทัล</div></div>
            </div>
            <div style={{ padding: '4px 2px' }}>
              <PbkRow label="รองรับ Auto Passbook" hint="ปรับบรรทัดเริ่มพิมพ์อัตโนมัติจากรายการล่าสุดที่พิมพ์แล้ว">
                <PbkToggle on={cfg.autoPassbook} onChange={(v) => set('autoPassbook', v)} />
              </PbkRow>
              <PbkRow label="รายการผ่าน Mobile = No Book" hint="รายการที่ทำผ่าน Mobile จะไม่พิมพ์ลงสมุด แสดงเป็น No Book">
                <PbkToggle on={cfg.mobileNoBook} onChange={(v) => set('mobileNoBook', v)} />
              </PbkRow>
            </div>
          </div>
        </div>

        {/* ── พรีวิวทดสอบตำแหน่งพิมพ์ ── */}
        <div className="pbk-preview-wrap">
          <div className="search-card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 12 }}>
            <div className="dat-section-head" style={{ borderBottom: '1px solid var(--divider)' }}>
              <span className="dat-section-ico"><Icon name="eye" size={15} /></span>
              <div><div className="dat-section-title">พรีวิวตำแหน่งพิมพ์</div><div className="muted" style={{ fontSize: 11.5 }}>เส้นประ = แนวบรรทัดของสมุด · ตัวอักษรสีเขียว = ตำแหน่งที่จะพิมพ์</div></div>
            </div>
            <div className="pbk-paper-area">
              <div className="pbk-paper">
                {/* แนวบรรทัดของสมุด */}
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="pbk-guideline" style={{ top: 18 + i * (mm(cfg.lineSpacing) + 13) }} />
                ))}
                {/* หัวคอลัมน์ */}
                <div className="pbk-head" style={{ left: mm(cfg.startOffsetX) + 8 }}>
                  <span style={{ width: 56 }}>วันที่</span><span style={{ width: 96 }}>รายการ</span>
                  <span style={{ width: 70, textAlign: 'right' }}>ถอน</span>
                  <span style={{ width: 70, textAlign: 'right' }}>ฝาก</span>
                  <span style={{ width: 78, textAlign: 'right' }}>คงเหลือ</span>
                </div>
                {/* บรรทัดรายการตามตำแหน่งที่ตั้งค่า */}
                {sample.map((s, i) => (
                  <div key={i} className="pbk-line"
                       style={{ left: mm(cfg.startOffsetX) + 8, top: mm(cfg.startOffsetY) + 18 + i * (mm(cfg.lineSpacing) + 13) }}>
                    <span style={{ width: 56 }}>{s.date}</span>
                    <span style={{ width: 96 }}>{s.desc}</span>
                    <span style={{ width: 70, textAlign: 'right' }}>{s.wd}</span>
                    <span style={{ width: 70, textAlign: 'right' }}>{s.dp}</span>
                    <span style={{ width: 78, textAlign: 'right' }}>{s.bal}</span>
                  </div>
                ))}
                <div className="pbk-paper-tag">สมุดคู่ฝาก · ตัวอย่าง</div>
              </div>
            </div>
            <div className="pbk-preview-foot">
              <div className="pbk-pf-item"><span className="muted">เครื่องพิมพ์</span><span className="mono">{cfg.printer.split(' (')[0]}</span></div>
              <div className="pbk-pf-item"><span className="muted">X / Y</span><span className="mono">{Number(cfg.startOffsetX).toFixed(1)} / {Number(cfg.startOffsetY).toFixed(1)} มม.</span></div>
              <div className="pbk-pf-item"><span className="muted">ระยะบรรทัด</span><span className="mono">{Number(cfg.lineSpacing).toFixed(1)} มม.</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ปรับตำแหน่ง X/Y และระยะบรรทัดให้ตรงช่องสมุดก่อนพิมพ์จริง — ระบบพิมพ์ย้อนหลังเฉพาะรายการที่ยังไม่ได้พิมพ์ และข้ามรายการ No Book จาก Mobile
      </div>
    </div>
  );
}

Object.assign(window, { DepPassbookConfigPage });
