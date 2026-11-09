// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › ตั้งค่าระบบบัญชี — กำหนดสูตรงบการเงิน (Financial Statement Formula)
//  Split view: (ซ้าย 60%) โครงสร้างงบแบบ Tree Table · (ขวา 40%) Formula Builder
//  เลือกประเภทงบ → โหลดโครงสร้าง → เลือกรายการ → กำหนดสูตร (No-Code) →
//  ตรวจสอบสูตร · แสดงตัวอย่างงบ · บันทึก
// ════════════════════════════════════════════════════════════════════
const FS_TRASH13 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true">' + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />' + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />' + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
const FS_TRASH12 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="12" height="12" aria-hidden="true">' + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />' + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />' + '<path d="M10 10.5v6M14 10.5v6" /></svg>';
const FS_BTN = { height: 32, padding: '0 12px' };
const FS_PER_PAGE = 20;

if (!document.getElementById('fs-formula-style')) {
  const st = document.createElement('style');
  st.id = 'fs-formula-style';
  st.textContent = '[data-screen-label="หน้ากำหนดสูตรงบการเงิน"] .bud-act.danger:hover { border-color: var(--border) !important; }'
    + '.main:has([data-screen-label="หน้ากำหนดสูตรงบการเงิน"]) { padding-bottom: 76px !important; }'
    + '.fs-actionbar.app-action-bar { justify-content: flex-end; flex-wrap: nowrap; }'
    + '.fs-actionbar.app-action-bar > .muted { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }'
    + '.fs-actionbar.app-action-bar > button { flex: 0 0 auto; }'
    + '.fs-tree-wrap { overflow-x: hidden !important; max-height: none !important; }'
    + '.fs-tree-tbl { width: 100% !important; min-width: 0 !important; table-layout: fixed; }'
    + '.fs-tree-tbl td, .fs-tree-tbl th { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; word-break: break-word; }'
    + '.fs-tree-tbl .fs-name { white-space: normal !important; }'
    + '.fs-tree-filters select.cfg-input.sm { padding: 0 30px 0 10px !important; min-width: 132px; text-overflow: ellipsis; }';
  document.head.appendChild(st);
}

const FS_STATEMENTS = [
  { v: 'bs', l: 'งบฐานะการเงิน' },
  { v: 'pl', l: 'งบกำไรขาดทุน' },
  { v: 'cf', l: 'งบกระแสเงินสด' },
];
const FS_TYPE = { TX: { l: 'ข้อความ', tone: 'neutral' }, SM: { l: 'ผลรวม', tone: 'info' }, FC: { l: 'สูตรคำนวณ', tone: 'primary' } };
const FS_STATUS = {
  ok:   { l: 'กำหนดสูตรแล้ว',      pill: 'ok' },
  warn: { l: 'สูตรไม่สมบูรณ์',     pill: 'warn' },
  none: { l: 'ยังไม่ได้กำหนดสูตร', pill: 'neutral' },
  bad:  { l: 'สูตรไม่ถูกต้อง',      pill: 'bad' },
};
const FS_SOURCES = [
  { v: 'gl',    l: 'บัญชีจากผังบัญชี (GL Account)' },
  { v: 'group', l: 'กลุ่มบัญชี (Account Group)' },
  { v: 'range', l: 'ช่วงรหัสบัญชี' },
  { v: 'fsitem',l: 'รายการจากงบการเงิน' },
  { v: 'sub',   l: 'ข้อมูลจากระบบงานย่อย' },
  { v: 'const', l: 'ค่าคงที่' },
  { v: 'custom',l: 'สูตรกำหนดเอง' },
];
const FS_SRC_LABEL = Object.fromEntries(FS_SOURCES.map(s => [s.v, s.l.replace(/\s*\(.*\)/, '')]));

const fsMoney = (n) => window.fmt.money(Number(n || 0), 2);
let _fsSeq = 0;
const fsUid = (p) => (p || 'n') + '-' + Date.now().toString(36) + '-' + (++_fsSeq);
const fsComp = (o) => ({ id: fsUid('c'), show: true, sign: '+', src: 'gl', code: '', name: '', cond: '', ...o });

// ─── โครงสร้างงบตั้งต้น (งบฐานะการเงิน) ──────────────────────────────
function fsSeedTree() {
  const node = (o) => ({ id: fsUid('r'), type: 'TX', nature: '', note: '', status: 'none', comps: [], children: [], ...o });
  return [
    node({ type: 'TX', name: 'สินทรัพย์', note: '1', nature: 'DR', status: 'ok', children: [
      node({ type: 'TX', name: 'สินทรัพย์หมุนเวียน', note: '1.1', nature: 'DR', status: 'ok', children: [
        node({ type: 'SM', name: 'เงินสดและเงินฝากธนาคาร', note: '1.1.1', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'gl', code: '110101', name: 'เงินสด' }),
          fsComp({ sign: '+', src: 'group', code: '1102', name: 'เงินฝากกระแสรายวัน' }),
          fsComp({ sign: '+', src: 'group', code: '1103', name: 'เงินฝากออมทรัพย์' }),
          fsComp({ sign: '+', src: 'group', code: '1104', name: 'เงินฝากประจำ' }),
        ] }),
        node({ type: 'SM', name: 'เงินฝากสหกรณ์อื่น', note: '1.1.2', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '1105', name: 'เงินฝากสหกรณ์อื่น' }),
        ] }),
        node({ type: 'TX', name: 'เงินส่งชำระหนี้ระหว่างทาง', note: '1.1.3', nature: 'DR', status: 'warn', comps: [] }),
        node({ type: 'SM', name: 'เงินลงทุนระยะสั้น', note: '1.1.4', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '1120', name: 'เงินลงทุนระยะสั้น' }),
        ] }),
        node({ type: 'FC', name: 'เงินให้กู้ยืมระยะสั้น - สุทธิ', note: '1.1.5', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '1130', name: 'เงินให้กู้ยืมระยะสั้น' }),
          fsComp({ sign: '-', src: 'group', code: '1139', name: 'ค่าเผื่อผลขาดทุนด้านเครดิต', show: false }),
        ] }),
        node({ type: 'FC', name: 'ลูกหนี้ระยะสั้น - สุทธิ', note: '1.1.6', nature: 'DR', status: 'warn', comps: [
          fsComp({ sign: '+', src: 'group', code: '1140', name: 'ลูกหนี้ระยะสั้น' }),
        ] }),
        node({ type: 'FC', name: 'ดอกเบี้ยเงินให้กู้ค้างรับ - สุทธิ', note: '1.1.7', nature: 'DR', status: 'none', comps: [] }),
        node({ type: 'SM', name: 'สินทรัพย์หมุนเวียนอื่น', note: '1.1.8', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'range', code: '1190-1199', name: 'สินทรัพย์หมุนเวียนอื่น' }),
        ] }),
        node({ type: 'SM', name: 'รวมสินทรัพย์หมุนเวียน', note: '1.1.9', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.1', name: 'เงินสดและเงินฝากธนาคาร' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.2', name: 'เงินฝากสหกรณ์อื่น' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.4', name: 'เงินลงทุนระยะสั้น' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.5', name: 'เงินให้กู้ยืมระยะสั้น - สุทธิ' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.6', name: 'ลูกหนี้ระยะสั้น - สุทธิ' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.1.8', name: 'สินทรัพย์หมุนเวียนอื่น' }),
        ] }),
      ] }),
      node({ type: 'TX', name: 'สินทรัพย์ไม่หมุนเวียน', note: '1.2', nature: 'DR', status: 'ok', children: [
        node({ type: 'SM', name: 'เงินลงทุนระยะยาว', note: '1.2.1', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '1210', name: 'เงินลงทุนระยะยาว' }),
        ] }),
        node({ type: 'FC', name: 'ที่ดิน อาคารและอุปกรณ์ - สุทธิ', note: '1.2.2', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '1220', name: 'ที่ดิน อาคารและอุปกรณ์' }),
          fsComp({ sign: '-', src: 'group', code: '1229', name: 'ค่าเสื่อมราคาสะสม', show: false }),
        ] }),
        node({ type: 'SM', name: 'รวมสินทรัพย์ไม่หมุนเวียน', note: '1.2.9', nature: 'DR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'fsitem', code: '1.2.1', name: 'เงินลงทุนระยะยาว' }),
          fsComp({ sign: '+', src: 'fsitem', code: '1.2.2', name: 'ที่ดิน อาคารและอุปกรณ์ - สุทธิ' }),
        ] }),
      ] }),
      node({ type: 'SM', name: 'รวมสินทรัพย์', note: '1.9', nature: 'DR', status: 'ok', comps: [
        fsComp({ sign: '+', src: 'fsitem', code: '1.1.9', name: 'รวมสินทรัพย์หมุนเวียน' }),
        fsComp({ sign: '+', src: 'fsitem', code: '1.2.9', name: 'รวมสินทรัพย์ไม่หมุนเวียน' }),
      ] }),
    ] }),
    node({ type: 'TX', name: 'หนี้สินและทุนของสหกรณ์', note: '2', nature: 'CR', status: 'ok', children: [
      node({ type: 'TX', name: 'หนี้สินหมุนเวียน', note: '2.1', nature: 'CR', status: 'warn', children: [
        node({ type: 'SM', name: 'เงินเบิกเกินบัญชีและเงินกู้ยืมระยะสั้น', note: '2.1.1', nature: 'CR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '2101', name: 'เงินกู้ยืมระยะสั้น' }),
        ] }),
        node({ type: 'SM', name: 'เงินรับฝาก', note: '2.1.2', nature: 'CR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'range', code: '2110-2119', name: 'เงินรับฝากทุกประเภท' }),
        ] }),
        node({ type: 'SM', name: 'รวมหนี้สินหมุนเวียน', note: '2.1.9', nature: 'CR', status: 'warn', comps: [
          fsComp({ sign: '+', src: 'fsitem', code: '2.1.1', name: 'เงินกู้ยืมระยะสั้น' }),
          fsComp({ sign: '+', src: 'fsitem', code: '2.1.2', name: 'เงินรับฝาก' }),
        ] }),
      ] }),
      node({ type: 'TX', name: 'ทุนของสหกรณ์', note: '2.3', nature: 'CR', status: 'ok', children: [
        node({ type: 'SM', name: 'ทุนเรือนหุ้น', note: '2.3.1', nature: 'CR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '2301', name: 'ทุนเรือนหุ้นที่ชำระแล้ว' }),
        ] }),
        node({ type: 'SM', name: 'ทุนสำรอง', note: '2.3.2', nature: 'CR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'group', code: '2310', name: 'ทุนสำรอง' }),
        ] }),
        node({ type: 'SM', name: 'รวมทุนของสหกรณ์', note: '2.3.9', nature: 'CR', status: 'ok', comps: [
          fsComp({ sign: '+', src: 'fsitem', code: '2.3.1', name: 'ทุนเรือนหุ้น' }),
          fsComp({ sign: '+', src: 'fsitem', code: '2.3.2', name: 'ทุนสำรอง' }),
        ] }),
      ] }),
      node({ type: 'SM', name: 'รวมหนี้สินและทุนของสหกรณ์', note: '2.9', nature: 'CR', status: 'ok', comps: [
        fsComp({ sign: '+', src: 'fsitem', code: '2.1.9', name: 'รวมหนี้สินหมุนเวียน' }),
        fsComp({ sign: '+', src: 'fsitem', code: '2.3.9', name: 'รวมทุนของสหกรณ์' }),
      ] }),
    ] }),
  ];
}

// มูลค่าตัวอย่างสำหรับ preview งบ (hash เลขหมายเหตุ → จำนวน)
function fsPreviewAmount(note) {
  let h = 0; const s = String(note);
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return Math.round(((h % 90000) + 5000) / 5) * 5 * 100;
}

// ─── flatten tree → แถวเรียงพร้อม level/parent (เคารพ collapse) ──────
function fsFlatten(tree, collapsed) {
  const out = [];
  const walk = (nodes, level, parentId) => {
    nodes.forEach(n => {
      out.push({ node: n, level, parentId, hasKids: (n.children || []).length > 0 });
      if (n.children && n.children.length && !collapsed[n.id]) walk(n.children, level + 1, n.id);
    });
  };
  walk(tree, 0, null);
  return out;
}
function fsFindById(tree, id) {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children) { const f = fsFindById(n.children, id); if (f) return f; }
  }
  return null;
}

// ════════════════════════════════════════════════════════════════════
//  Modal: เพิ่มองค์ประกอบสูตร
// ════════════════════════════════════════════════════════════════════
function FsAddCompModal({ onClose, onAdd }) {
  const [src, setSrc]   = useState('gl');
  const [sign, setSign] = useState('+');
  const [q, setQ]       = useState('');
  const [rangeA, setRangeA] = useState('');
  const [rangeB, setRangeB] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(true);

  const accounts = React.useMemo(() => (window.coaFlatAccounts ? window.coaFlatAccounts() : []).filter(a => a.enabled !== false), []);
  const found = React.useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return accounts.slice(0, 30);
    return accounts.filter(a => String(a.code).includes(n) || (a.name || '').toLowerCase().includes(n)).slice(0, 40);
  }, [q, accounts]);

  const pickAcct = (a) => { setCode(String(a.code)); setName(a.name); };

  const submit = () => {
    let c = code, nm = name;
    if (src === 'range') { c = `${rangeA}-${rangeB}`; nm = nm || `ช่วงบัญชี ${rangeA} ถึง ${rangeB}`; }
    if (!c && src !== 'custom' && src !== 'const') return;
    onAdd(fsComp({ src, sign, code: c, name: nm || c, show }));
  };

  const needAcct = src === 'gl' || src === 'group';
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card fs-add-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มองค์ประกอบสูตร</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกแหล่งข้อมูลและเครื่องหมายที่จะนำมาคำนวณในสูตร</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="fs-add-grid">
            <div className="bud-fld">
              <label className="lt-modal-label">ประเภทแหล่งข้อมูล</label>
              <select className="cfg-input" value={src} onChange={e => { setSrc(e.target.value); setCode(''); setName(''); }}>
                {FS_SOURCES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
            <div className="bud-fld">
              <label className="lt-modal-label">เครื่องหมาย</label>
              <div className="fs-sign-pick">
                {['+', '-'].map(s => (
                  <button key={s} type="button" className={"fs-sign-opt" + (sign === s ? ' on' : '')} onClick={() => setSign(s)}>{s}</button>
                ))}
                <span className="fs-sign-future muted">× ÷ % (รองรับในอนาคต)</span>
              </div>
            </div>
          </div>

          {needAcct && (
            <div className="fs-acct-pick">
              <div className="search" style={{ marginBottom: 8 }}>
                <Icon name="search" size={14} />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาด้วยรหัสบัญชี หรือ ชื่อบัญชี" autoFocus />
              </div>
              <div className="fs-acct-list">
                {found.length === 0 && <div className="muted center" style={{ padding: 16, fontSize: 12.5 }}>ไม่พบบัญชี</div>}
                {found.map(a => (
                  <button key={a.code} className={"fs-acct-row" + (code === String(a.code) ? ' on' : '')} onClick={() => pickAcct(a)}>
                    <span className="mono fs-acct-code">{a.code}</span>
                    <span className="fs-acct-name">{a.name}</span>
                    {code === String(a.code) && <Icon name="check" size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {src === 'range' && (
            <div className="fs-add-grid">
              <div className="bud-fld"><label className="lt-modal-label">รหัสบัญชีเริ่มต้น</label>
                <input className="cfg-input mono" value={rangeA} onChange={e => setRangeA(e.target.value)} placeholder="เช่น 1190" /></div>
              <div className="bud-fld"><label className="lt-modal-label">รหัสบัญชีสิ้นสุด</label>
                <input className="cfg-input mono" value={rangeB} onChange={e => setRangeB(e.target.value)} placeholder="เช่น 1199" /></div>
              <div className="bud-fld span2"><label className="lt-modal-label">ชื่อที่แสดง</label>
                <input className="cfg-input" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อองค์ประกอบ" /></div>
            </div>
          )}

          {(src === 'fsitem' || src === 'sub' || src === 'const' || src === 'custom') && (
            <div className="fs-add-grid">
              <div className="bud-fld"><label className="lt-modal-label">รหัส / อ้างอิง</label>
                <input className="cfg-input mono" value={code} onChange={e => setCode(e.target.value)}
                       placeholder={src === 'fsitem' ? 'เลขหมายเหตุรายการ เช่น 1.1.1' : src === 'const' ? 'รหัสค่าคงที่' : 'อ้างอิง'} /></div>
              <div className="bud-fld"><label className="lt-modal-label">ชื่อที่แสดง</label>
                <input className="cfg-input" value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อองค์ประกอบ" /></div>
            </div>
          )}

          <label className="fs-show-check">
            <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} />
            <span>แสดงในรายงานงบการเงิน <span className="muted">(ไม่เลือก = ใช้คำนวณเท่านั้น)</span></span>
          </label>

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={submit}><Icon name="plus" size={13} /> เพิ่มองค์ประกอบ</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Modal: แสดงตัวอย่างงบการเงิน
// ════════════════════════════════════════════════════════════════════
function FsPreviewModal({ tree, stmtLabel, onClose }) {
  const [year, setYear]   = useState('2569');
  const [period, setPeriod] = useState('12');
  const [asOf, setAsOf]   = useState('2026-09-30');
  const rowsFlat = React.useMemo(() => fsFlatten(tree, {}), [tree]);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card fs-preview-modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <div style={{ minWidth: 0 }}><h2>ตัวอย่างงบการเงิน</h2>
            <div className="muted" style={{ fontSize: 11 }}>{stmtLabel} — ทดลองประมวลผลสูตรจากข้อมูลตัวอย่าง</div></div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="fs-prev-params">
            <div className="bud-fld"><label className="lt-modal-label">ปีบัญชี</label>
              <select className="cfg-input" value={year} onChange={e => setYear(e.target.value)}>
                {['2569', '2568', '2567'].map(y => <option key={y}>{y}</option>)}
              </select></div>
            <div className="bud-fld"><label className="lt-modal-label">งวดบัญชี</label>
              <select className="cfg-input" value={period} onChange={e => setPeriod(e.target.value)}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>งวดที่ {m}</option>)}
              </select></div>
            <div className="bud-fld"><label className="lt-modal-label">วันที่ข้อมูล</label>
              <ErpDate value={asOf} onChange={(v) => (e => setAsOf(e.target.value))({ target: { value: v } })} className="cfg-input mono" /></div>
          </div>

          <div className="fs-statement">
            <div className="fs-stmt-head">
              <h3>{stmtLabel}</h3>
              <div className="muted">ณ วันที่ {window.fmt.date(asOf)} · ปีบัญชี {year} งวดที่ {period}</div>
            </div>
            <table className="fs-stmt-tbl">
              <thead><tr><th>รายการ</th><th className="right">จำนวนเงิน (บาท)</th></tr></thead>
              <tbody>
                {rowsFlat.map(({ node: n, level }) => {
                  const isTotal = /^รวม/.test(n.name);
                  const amt = n.type === 'TX' && n.children && n.children.length ? null : fsPreviewAmount(n.note);
                  return (
                    <tr key={n.id} className={(isTotal ? 'fs-stmt-total' : '') + (n.type === 'TX' && n.children && n.children.length ? ' fs-stmt-head-row' : '')}>
                      <td style={{ paddingLeft: 14 + level * 20 }}>{n.name}</td>
                      <td className="right mono">{amt == null ? '' : fsMoney(amt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="cfw-foot" style={{ marginTop: 10 }}>
            <div className="cfw-pager">
              {Array.from({ length: fsPageCount }, (_, i) => i + 1).map(p => (
                <button key={p} className={"cfw-page-btn" + (p === fsCurPage ? ' active' : '')} onClick={() => setFsPage(p)}>[{p}]</button>
              ))}
            </div>
            <span className="spacer" />
            <span className="muted" style={{ fontSize: 11.5 }}>แสดง {shown.length ? fsStart + 1 : 0}–{Math.min(fsStart + FS_PER_PAGE, shown.length)} จาก {shown.length} รายการ</span>
          </div>
        </div>
        <div className="fs-prev-foot">
          <button className="btn" onClick={onClose}>ปิด</button>
          <button className="btn primary" onClick={onClose}><Icon name="print" size={13} /> พิมพ์ตัวอย่าง</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก
// ════════════════════════════════════════════════════════════════════
// ─── แทรกรายการ + ไล่เลขใหม่ ───────────────────────────────────────
function fsFlatAll(list, level = 1, out = []) {
  (list || []).forEach(n => {
    out.push({ node: n, level });
    if (n.children && n.children.length) fsFlatAll(n.children, level + 1, out);
  });
  return out;
}
function fsRenumber(sibs, prefix) {
  return (sibs || []).map((n, i) => {
    const note = prefix ? prefix + '.' + (i + 1) : String(i + 1);
    return { ...n, note, children: fsRenumber(n.children, note) };
  });
}
function fsInsert(list, targetId, mode, newNode, prefix = '') {
  if (mode === 'end') return fsRenumber([...(list || []), newNode], prefix);
  const idx = (list || []).findIndex(n => n.id === targetId);
  if (idx >= 0) {
    if (mode === 'child') {
      const next = [...list];
      next[idx] = { ...list[idx], children: [...(list[idx].children || []), newNode] };
      return fsRenumber(next, prefix);
    }
    const next = [...list];
    next.splice(idx + 1, 0, newNode);
    return fsRenumber(next, prefix);
  }
  return (list || []).map(n => ({ ...n, children: fsInsert(n.children, targetId, mode, newNode, n.note || '') }));
}

// ═════════════════════════════════════════════════════════════════
//  Modal: เพิ่ม / แทรกรายการโครงสร้างงบ
// ═════════════════════════════════════════════════════════════════
function FsAddItemModal({ tree, targetId, onClose, onAdd }) {
  const rows = React.useMemo(() => fsFlatAll(tree), [tree]);
  const [name, setName]     = useState('');
  const [type, setType]     = useState('TX');
  const [nature, setNat]    = useState('DR');
  const [mode, setMode]     = useState(targetId ? 'after' : 'end');
  const [anchor, setAnchor] = useState(targetId || (rows[0] ? rows[0].node.id : ''));
  const [error, setError]   = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('กรุณาระบุชื่อรายการ'); return; }
    if (mode !== 'end' && !anchor) { setError('กรุณาเลือกรายการอ้างอิง'); return; }
    onAdd({ name: name.trim(), type, nature, mode, anchor: mode === 'end' ? null : anchor });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}
            onClick={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มรายการโครงสร้างงบ</h2>
            <div className="muted" style={{ fontSize: 11 }}>เลือกตำแหน่งที่จะแทรก — ระบบจะไล่เลขรายการถัดไปให้อัตโนมัติ</div>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        <div className="modal-body">
          <div className="bud-fld">
            <label className="lt-modal-label">ชื่อรายการ</label>
            <input className="cfg-input" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                   placeholder="เช่น เงินฝากสหกรณ์อื่น" autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <div className="bud-fld">
              <label className="lt-modal-label">ประเภท</label>
              <select className="cfg-input" value={type} onChange={e => setType(e.target.value)}>
                <option value="TX">ข้อความ (TX)</option>
                <option value="SM">ผลรวม (SM)</option>
                <option value="FC">สูตรคำนวณ (FC)</option>
              </select>
            </div>
            <div className="bud-fld">
              <label className="lt-modal-label">ประเภทยอด</label>
              <select className="cfg-input" value={nature} onChange={e => setNat(e.target.value)}>
                <option value="DR">เดบิต (DR)</option>
                <option value="CR">เครดิต (CR)</option>
                <option value="">ไม่ระบุ</option>
              </select>
            </div>
          </div>

          <div className="bud-fld" style={{ marginTop: 12 }}>
            <label className="lt-modal-label">ตำแหน่งที่จะแทรก</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['after', 'แทรกต่อจากรายการที่เลือก (ระดับเดียวกัน)'],
                ['child', 'เพิ่มเป็นรายการย่อยของรายการที่เลือก'],
                ['end', 'ต่อท้ายรายการทั้งหมด']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, cursor: 'pointer' }}>
                  <input type="radio" name="fs-ins-mode" value={v} checked={mode === v}
                         onChange={() => { setMode(v); setError(''); }} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {mode !== 'end' && (
            <div className="bud-fld" style={{ marginTop: 10 }}>
              <label className="lt-modal-label">เลือกรายการอ้างอิง</label>
              <select className="cfg-input" value={anchor} onChange={e => { setAnchor(e.target.value); setError(''); }}>
                {rows.map(({ node: n, level }) => (
                  <option key={n.id} value={n.id}>
                    {'\u00A0'.repeat((level - 1) * 4)}{n.note ? n.note + ' · ' : ''}{n.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
              <Icon name="check" /> เพิ่มรายการ
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FinStatementFormulaPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [stmt, setStmt]   = useState('bs');
  const [fStatus, setFStatus] = useState('active');
  const [tree, setTree]   = useState(fsSeedTree);
  const [collapsed, setCollapsed] = useState({});
  const [selId, setSelId] = useState(null);
  const [q, setQ]         = useState('');
  const [fType, setFType] = useState('all');
  const [fFml, setFFml]   = useState('all');
  const [addOpen, setAddOpen]   = useState(false);
  const [preview, setPreview]   = useState(false);
  const [validation, setValidation] = useState(null);
  const [fsPage, setFsPage] = useState(1);
  const [insAt, setInsAt] = useState(null);

  const stmtLabel = FS_STATEMENTS.find(s => s.v === stmt)?.l || '';
  const flat = React.useMemo(() => fsFlatten(tree, collapsed), [tree, collapsed]);
  const sel = React.useMemo(() => (selId ? fsFindById(tree, selId) : null), [tree, selId]);

  const shown = React.useMemo(() => flat.filter(({ node: n }) => {
    if (fType !== 'all' && n.type !== fType) return false;
    if (fFml !== 'all' && n.status !== fFml) return false;
    if (q.trim() && !n.name.includes(q.trim())) return false;
    return true;
  }), [flat, fType, fFml, q]);

  const fsPageCount = Math.max(1, Math.ceil(shown.length / FS_PER_PAGE));
  const fsCurPage = Math.min(fsPage, fsPageCount);
  const fsStart = (fsCurPage - 1) * FS_PER_PAGE;
  const fsRows = shown.slice(fsStart, fsStart + FS_PER_PAGE);

  // ── mutation helpers (immutably ผ่าน tree) ──────────────────────
  const mutate = (id, fn) => {
    const rec = (nodes) => nodes.map(n => {
      if (n.id === id) return fn({ ...n });
      if (n.children) return { ...n, children: rec(n.children) };
      return n;
    });
    setTree(t => rec(t));
  };
  const recomputeStatus = (n) => {
    if (n.type === 'TX') return n.children && n.children.length ? 'ok' : (n.status === 'none' ? 'ok' : n.status);
    if (!n.comps.length) return 'none';
    if (n.comps.some(c => !c.code)) return 'warn';
    return 'ok';
  };

  const toggleCollapse = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  const addComp = (comp) => {
    if (!sel) return;
    mutate(sel.id, n => { const nn = { ...n, comps: [...n.comps, comp] }; nn.status = recomputeStatus(nn); return nn; });
    setAddOpen(false);
    onToast && onToast(`เพิ่มองค์ประกอบ “${comp.name}” ในสูตรแล้ว`);
  };
  const removeComp = (cid) => mutate(sel.id, n => { const nn = { ...n, comps: n.comps.filter(c => c.id !== cid) }; nn.status = recomputeStatus(nn); return nn; });
  const setComp = (cid, patch) => mutate(sel.id, n => ({ ...n, comps: n.comps.map(c => c.id === cid ? { ...c, ...patch } : c) }));
  const moveComp = (cid, dir) => mutate(sel.id, n => {
    const l = [...n.comps]; const i = l.findIndex(c => c.id === cid); const j = i + dir;
    if (i < 0 || j < 0 || j >= l.length) return n;
    [l[i], l[j]] = [l[j], l[i]]; return { ...n, comps: l };
  });

  const doAddItem = ({ name, type, nature, mode, anchor }) => {
    const nn = { id: fsUid('r'), type, nature, note: '', name, status: 'none', comps: [], children: [] };
    setTree(t => fsInsert(t, anchor, mode, nn, ''));
    setSelId(nn.id);
    setInsAt(null);
    onToast && onToast(`เพิ่มรายการ “${name}” แล้ว — ไล่เลขรายการถัดไปให้อัตโนมัติ`);
  };

  const validate = () => {
    let ok = 0, warn = 0, bad = 0; const issues = [];
    const walk = (nodes) => nodes.forEach(n => {
      const selfRef = n.comps.some(c => c.src === 'fsitem' && c.code === n.note);
      if (selfRef) { bad++; issues.push({ tone: 'bad', text: `“${n.name}” อ้างอิงตัวเอง` }); }
      else if (n.type !== 'TX' && !n.comps.length) { warn++; issues.push({ tone: 'warn', text: `“${n.name}” ยังไม่มีองค์ประกอบสูตร` }); }
      else if (n.comps.some(c => !c.code)) { warn++; issues.push({ tone: 'warn', text: `“${n.name}” มีองค์ประกอบที่ไม่มีแหล่งข้อมูล` }); }
      else if (n.type !== 'TX') ok++;
      if (n.children) walk(n.children);
    });
    walk(tree);
    setValidation({ ok, warn, bad, issues: issues.slice(0, 8) });
    onToast && onToast('ตรวจสอบสูตรเรียบร้อยแล้ว');
  };

  const saveAll = (status) => {
    audit.log && audit.log({ action: 'update', module: 'บัญชี — กำหนดสูตรงบการเงิน',
      target: stmtLabel, summary: `บันทึกสูตร${stmtLabel} (${status})` });
    onToast && onToast(status === 'ใช้งาน' ? `บันทึกและใช้งานสูตร${stmtLabel}แล้ว` : `บันทึกแบบร่างสูตร${stmtLabel}แล้ว`);
  };

  // ── formula preview text ────────────────────────────────────────
  const previewText = sel && sel.comps.length
    ? sel.comps.map((c, i) => (i === 0 && c.sign === '+' ? '' : c.sign + ' ') + c.name).join('\n')
    : '';

  return (
    <div className="fs-page" data-screen-label="หน้ากำหนดสูตรงบการเงิน">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>กำหนดสูตรงบการเงิน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดโครงสร้าง รายการ และสูตรสำหรับการประมวลผลงบการเงิน</div>
        </div>
      </div>

      {/* ── เลือกงบการเงิน ── */}
      <div className="search-card fs-select-card">
        <div className="fs-select-row">
          <div className="bud-fld"><label className="lt-modal-label">ประเภทงบการเงิน</label>
            <select className="cfg-input" value={stmt} onChange={e => { setStmt(e.target.value); setSelId(null); setValidation(null); }}>
              {FS_STATEMENTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select></div>
          <div className="bud-fld"><label className="lt-modal-label">สถานะสูตร</label>
            <select className="cfg-input" value={fStatus} onChange={e => setFStatus(e.target.value)}>
              <option value="active">ใช้งาน</option>
              <option value="draft">แบบร่าง</option>
              <option value="inactive">ไม่ใช้งาน</option>
            </select></div>
          <span className="spacer" />
          <div className="fs-select-actions">
            <button className="btn primary" style={FS_BTN} onClick={() => { setTree(fsSeedTree()); setSelId(null); onToast && onToast('สร้างสูตรใหม่จากโครงสร้างตั้งต้น'); }}><Icon name="plus" size={13} /> สร้างสูตรใหม่</button>
            <button className="btn" style={FS_BTN} onClick={() => onToast && onToast('คัดลอกสูตรจากงบที่เลือก')}><Icon name="copy" size={13} /> คัดลอกสูตร</button>
            <button className="btn danger" style={FS_BTN} onClick={() => onToast && onToast('ลบสูตรของงบที่เลือก')}><span style={{ display: 'inline-flex' }} dangerouslySetInnerHTML={{ __html: FS_TRASH13 }} /> ลบสูตร</button>
          </div>
        </div>
      </div>

      {/* ── โครงสร้างงบ (Tree Table) เต็มความกว้าง ── */}
      <div className="fs-single">
        <div className="search-card fs-tree-card">
          <div className="section-head">
            <span className="head-bar" /><h3>โครงสร้างงบการเงิน</h3>
            <span className="spacer" />
            <div className="fs-tree-tools">
              <button className="btn sm" onClick={() => setCollapsed({})}><Icon name="chevDown" size={12} /> ขยายทั้งหมด</button>
              <button className="btn sm" onClick={() => { const c = {}; const walk = ns => ns.forEach(n => { if (n.children && n.children.length) { c[n.id] = true; walk(n.children); } }); walk(tree); setCollapsed(c); }}><Icon name="chevRight" size={12} /> ย่อทั้งหมด</button>
              <button className="btn primary sm" onClick={() => setInsAt({ targetId: selId || null })}><Icon name="plus" size={12} /> เพิ่มรายการ</button>
            </div>
          </div>

          <div className="fs-tree-filters">
            <div className="search" style={{ flex: 1, minWidth: 160 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อรายการ" />
            </div>
            <select className="cfg-input sm" value={fType} onChange={e => setFType(e.target.value)}>
              <option value="all">ทุกประเภท</option>
              <option value="TX">ข้อความ (TX)</option>
              <option value="SM">ผลรวม (SM)</option>
              <option value="FC">สูตรคำนวณ (FC)</option>
            </select>
            <select className="cfg-input sm" value={fFml} onChange={e => setFFml(e.target.value)}>
              <option value="all">ทุกสถานะสูตร</option>
              <option value="ok">กำหนดสูตรแล้ว</option>
              <option value="warn">สูตรไม่สมบูรณ์</option>
              <option value="none">ยังไม่ได้กำหนด</option>
              <option value="bad">สูตรไม่ถูกต้อง</option>
            </select>
          </div>

          <div className="fs-tree-wrap">
            <table className="tbl fs-tree-tbl">
              <thead>
                <tr>
                  <th style={{ width: 74 }} className="center">ประเภท</th>
                  <th style={{ width: 68 }}>หมายเหตุ</th>
                  <th>ชื่อรายการ</th>
                  <th style={{ width: 96 }} className="center">ประเภทยอด</th>
                  <th style={{ width: 118 }} className="center">สถานะสูตร</th>
                  <th style={{ width: 100 }} className="center">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {fsRows.length === 0 && <tr><td colSpan={6} className="center muted" style={{ padding: 24 }}>ไม่พบรายการตามเงื่อนไข</td></tr>}
                {fsRows.map(({ node: n, level, hasKids }, i) => (
                  <tr key={n.id} className={"fs-tree-row" + (selId === n.id ? ' is-sel' : '') + (n.type === 'TX' && hasKids ? ' is-head' : '')}
                      onClick={() => setSelId(n.id)}>
                    <td className="center"><span className={"fs-type-badge " + FS_TYPE[n.type].tone}>{n.type}</span></td>
                    <td className="mono muted" style={{ fontSize: 11.5 }}>{n.note || '—'}</td>
                    <td>
                      <div className="fs-name-cell" style={{ paddingLeft: level * 18 }}>
                        {hasKids
                          ? <button className="fs-caret" onClick={(e) => { e.stopPropagation(); toggleCollapse(n.id); }}><Icon name={collapsed[n.id] ? 'chevRight' : 'chevDown'} size={13} /></button>
                          : <span className="fs-caret-spacer" />}
                        <span className={"fs-name" + (n.type === 'TX' && hasKids ? ' strong' : '')}>{n.name}</span>
                      </div>
                    </td>
                    <td className="center">{n.nature ? <span className={"chip " + (n.nature === 'DR' ? 'info' : 'warning')}>{n.nature}</span> : <span className="muted">—</span>}</td>
                    <td className="center"><span className={"pill " + FS_STATUS[n.status].pill} style={{ fontSize: 10.5 }}>{FS_STATUS[n.status].l}</span></td>
                    <td className="center">
                      <div className="fs-row-acts">
                        <button className="bud-act" title="เพิ่ม / แทรกรายการ" onClick={(e) => { e.stopPropagation(); setInsAt({ targetId: n.id }); }}><Icon name="plus" size={13} /></button>
                        <button className="bud-act" title="กำหนดสูตร" onClick={(e) => { e.stopPropagation(); setSelId(n.id); }}><Icon name="edit" size={13} /></button>
                        <button className="bud-act danger" title="ลบ" onClick={(e) => { e.stopPropagation(); if (selId === n.id) setSelId(null); setTree(t => { const rec = ns => ns.filter(x => x.id !== n.id).map(x => x.children ? { ...x, children: rec(x.children) } : x); return rec(t); }); onToast && onToast(`ลบรายการ “${n.name}” แล้ว`); }} dangerouslySetInnerHTML={{ __html: FS_TRASH13 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cfw-foot" style={{ marginTop: 10 }}>
            <div className="cfw-pager">
              {Array.from({ length: fsPageCount }, (_, i) => i + 1).map(p => (
                <button key={p} className={"cfw-page-btn" + (p === fsCurPage ? ' active' : '')} onClick={() => setFsPage(p)}>[{p}]</button>
              ))}
            </div>
            <span className="spacer" />
            <span className="muted" style={{ fontSize: 11.5 }}>แสดง {shown.length ? fsStart + 1 : 0}–{Math.min(fsStart + FS_PER_PAGE, shown.length)} จาก {shown.length} รายการ</span>
          </div>
        </div>

      </div>

      {/* ── Popup: Formula Builder (เปิดเมื่อเลือกรายการ) ── */}
      {sel && (
        <>
          <div className="modal-backdrop" onClick={() => setSelId(null)} />
          <div className="modal-card fs-builder-modal" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div className="gc-modal-ico"><Icon name="report" /></div>
              <div style={{ minWidth: 0 }}>
                <h2>กำหนดสูตร</h2>
                <div className="muted" style={{ fontSize: 11 }}>{stmtLabel} · {sel.name}</div>
              </div>
              <span className="spacer" />
              <span className={"pill " + FS_STATUS[sel.status].pill}>{FS_STATUS[sel.status].l}</span>
              <button className="close-btn" onClick={() => setSelId(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body fs-builder-body">

              <div className="fs-sel-head">
                <div className="fs-sel-row">
                  <div className="fs-sel-fld"><span className="fs-sel-k">ลำดับ (หมายเหตุ)</span><span className="fs-sel-v mono">{sel.note || '—'}</span></div>
                  <div className="fs-sel-fld"><span className="fs-sel-k">ประเภท</span>
                    <span className="fs-sel-v"><span className={"fs-type-badge " + FS_TYPE[sel.type].tone}>{sel.type}</span> {FS_TYPE[sel.type].l}</span></div>
                  <div className="fs-sel-fld"><span className="fs-sel-k">ประเภทยอด</span>
                    <span className="fs-sel-v">
                      <select className="cfg-input sm" value={sel.nature} onChange={e => mutate(sel.id, n => ({ ...n, nature: e.target.value }))} style={{ width: 72 }}>
                        <option value="DR">DR</option><option value="CR">CR</option>
                      </select></span></div>
                </div>
                <div className="fs-sel-namebar">
                  <span className="fs-sel-k">ชื่อรายการ</span>
                  <input className="cfg-input" value={sel.name} onChange={e => mutate(sel.id, n => ({ ...n, name: e.target.value }))} />
                  <select className="cfg-input sm" value={sel.type} onChange={e => mutate(sel.id, n => { const nn = { ...n, type: e.target.value }; nn.status = recomputeStatus(nn); return nn; })} style={{ width: 132 }}>
                    <option value="TX">ข้อความ (TX)</option>
                    <option value="SM">ผลรวม (SM)</option>
                    <option value="FC">สูตรคำนวณ (FC)</option>
                  </select>
                </div>
              </div>

              {sel.type === 'TX' && (!sel.children || !sel.children.length) ? (
                <div className="fs-tx-note muted"><Icon name="info" size={13} /> รายการประเภท “ข้อความ (TX)” เป็นหัวข้อ/ข้อความ ไม่จำเป็นต้องกำหนดสูตร</div>
              ) : sel.type === 'TX' ? (
                <div className="fs-tx-note muted"><Icon name="info" size={13} /> รายการหัวข้อนี้มีรายการย่อย — ผลรวมจะคำนวณจากรายการย่อยที่แสดงในรายงาน</div>
              ) : (
                <>
                  <div className="fs-comp-head">
                    <h4>องค์ประกอบสูตร</h4>
                    <span className="spacer" />
                    <button className="btn accent sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={12} /> เพิ่มองค์ประกอบ</button>
                  </div>
                  <div className="fs-comp-wrap">
                    <table className="tbl fs-comp-tbl">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>ลำดับ</th>
                          <th style={{ width: 64 }} className="center">แสดง</th>
                          <th style={{ width: 52 }} className="center">+/-</th>
                          <th style={{ width: 104 }}>แหล่งข้อมูล</th>
                          <th style={{ width: 84 }}>รหัส</th>
                          <th style={{ minWidth: 120 }}>ชื่อรายการ</th>
                          <th style={{ width: 70 }}>เงื่อนไข</th>
                          <th style={{ width: 74 }} className="center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sel.comps.length === 0 && <tr><td colSpan={8} className="center muted" style={{ padding: 18 }}>ยังไม่มีองค์ประกอบสูตร — กด “เพิ่มองค์ประกอบ”</td></tr>}
                        {sel.comps.map((c, i) => (
                          <tr key={c.id}>
                            <td className="mono muted">{i + 1}</td>
                            <td className="center"><input type="checkbox" checked={c.show} onChange={e => setComp(c.id, { show: e.target.checked })} /></td>
                            <td className="center">
                              <button className={"fs-sign-cell" + (c.sign === '-' ? ' minus' : '')} onClick={() => setComp(c.id, { sign: c.sign === '+' ? '-' : '+' })}>{c.sign}</button>
                            </td>
                            <td><span className="fs-src-tag">{FS_SRC_LABEL[c.src]}</span></td>
                            <td className="mono" style={{ fontSize: 11.5 }}>{c.code || '—'}</td>
                            <td style={{ fontSize: 12.5 }}>{c.name}</td>
                            <td><input className="cfg-input sm fs-cond" value={c.cond} placeholder="—" onChange={e => setComp(c.id, { cond: e.target.value })} /></td>
                            <td className="center">
                              <div className="fs-row-acts">
                                <button className="bud-act fs-up" title="เลื่อนขึ้น" onClick={() => moveComp(c.id, -1)}><Icon name="chevDown" size={12} /></button>
                                <button className="bud-act" title="เลื่อนลง" onClick={() => moveComp(c.id, 1)}><Icon name="chevDown" size={12} /></button>
                                <button className="bud-act danger" title="ลบ" onClick={() => removeComp(c.id)} dangerouslySetInnerHTML={{ __html: FS_TRASH12 }} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Formula preview */}
                  <div className="fs-formula-preview">
                    <div className="fs-fp-head"><Icon name="report" size={13} /> ตัวอย่างสูตร</div>
                    <div className="fs-fp-body">
                      <div className="fs-fp-name">{sel.name} =</div>
                      {sel.comps.length
                        ? <pre className="fs-fp-text">{previewText}</pre>
                        : <div className="muted" style={{ fontSize: 12.5 }}>ยังไม่มีองค์ประกอบสูตร</div>}
                    </div>
                  </div>
                </>
              )}

              {validation && (
                <div className="fs-validation">
                  <div className="fs-val-summary">
                    <span className="fs-val-chip ok"><Icon name="check" size={13} /> สูตรถูกต้อง {validation.ok} รายการ</span>
                    <span className="fs-val-chip warn"><Icon name="info" size={13} /> ต้องตรวจสอบ {validation.warn} รายการ</span>
                    <span className="fs-val-chip bad"><Icon name="close" size={13} /> ไม่ถูกต้อง {validation.bad} รายการ</span>
                  </div>
                  {validation.issues.length > 0 && (
                    <ul className="fs-val-list">
                      {validation.issues.map((it, i) => <li key={i} className={"fs-val-item " + it.tone}><Icon name={it.tone === 'bad' ? 'close' : 'info'} size={12} /> {it.text}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="jv-actionbar fs-builder-foot">
              <button className="btn" onClick={() => setSelId(null)}>ยกเลิก</button>
              <span className="spacer" />
              <button className="btn" onClick={validate}><Icon name="check" /> ตรวจสอบสูตร</button>
              <button className="btn primary" onClick={() => { mutate(sel.id, n => ({ ...n, status: recomputeStatus(n) })); onToast && onToast(`บันทึกสูตร “${sel.name}” เรียบร้อยแล้ว`); setSelId(null); }}><Icon name="check" /> บันทึกสูตร</button>
            </div>
          </div>
        </>
      )}

      {/* ── Sticky action bar ── */}
      <div className="app-action-bar show fs-actionbar" role="toolbar">
        <span className="muted" style={{ fontSize: 12 }}>{stmtLabel} · สถานะ: {fStatus === 'active' ? 'ใช้งาน' : fStatus === 'draft' ? 'แบบร่าง' : 'ไม่ใช้งาน'}</span>
        <span className="spacer" />
        <button className="btn" onClick={() => onToast && onToast('ยกเลิกการแก้ไข')}>ยกเลิก</button>
        <button className="btn" onClick={() => saveAll('แบบร่าง')}><Icon name="check" /> บันทึกแบบร่าง</button>
        <button className="btn accent" onClick={() => setPreview(true)}><Icon name="report" /> แสดงตัวอย่างงบ</button>
        <button className="btn primary" onClick={() => saveAll('ใช้งาน')}><Icon name="lock" /> บันทึกและใช้งาน</button>
      </div>

      {insAt && <FsAddItemModal tree={tree} targetId={insAt.targetId} onClose={() => setInsAt(null)} onAdd={doAddItem} />}
      {addOpen && <FsAddCompModal onClose={() => setAddOpen(false)} onAdd={addComp} />}
      {preview && <FsPreviewModal tree={tree} stmtLabel={stmtLabel} onClose={() => setPreview(false)} />}
    </div>
  );
}

Object.assign(window, { FinStatementFormulaPage });
