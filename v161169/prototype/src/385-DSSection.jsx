// คู่มือคอมโพเนนต์ — Ant Design v5 design language (green-primary, compact)
// ใช้คลาสกลางจาก styles.css ตัวเดียวกับทั้งระบบ จึงสะท้อนของจริงที่ใช้งาน
const { useState: useStateSC } = React;

// ─── small layout helpers ────────────────────────────────────────────
function DSSection({ icon, title, sub, children }) {
  return (
    <section className="search-card ds-section" data-screen-label={"DS · " + title}>
      <div className="section-head">
        <span className="head-bar" />
        <h3>{title}</h3>
        {sub && <span className="muted" style={{ fontSize: 'var(--font-xs)', marginLeft: 4 }}>{sub}</span>}
      </div>
      {children}
    </section>
  );
}
function DSBlock({ label, children }) {
  return (
    <div className="ds-block">
      {label && <div className="ds-caption">{label}</div>}
      {children}
    </div>
  );
}

// ─── 1a. Colour ───────────────────────────────────────────────────────
const BRAND_SCALE = [
  { nm: 'brand-100',  hx: '#eafef2', v: 'var(--brand-100)' },
  { nm: 'brand-200',  hx: '#abe6c5', v: 'var(--brand-200)' },
  { nm: 'brand-300',  hx: '#90ceab', v: 'var(--brand-300)' },
  { nm: 'brand-400',  hx: '#7dbc99', v: 'var(--brand-400)' },
  { nm: 'brand-500',  hx: '#60a380', v: 'var(--brand-500)' },
  { nm: 'brand-600',  hx: '#438b67', v: 'var(--brand-600)' },
  { nm: 'brand-700',  hx: '#237450', v: 'var(--brand-700)' },
  { nm: 'brand-800',  hx: '#155b3c', v: 'var(--brand-800)' },
  { nm: 'brand-900',  hx: '#1a432e', v: 'var(--brand-900)' },
  { nm: 'brand-1000', hx: '#162b20', v: 'var(--brand-1000)' },
];
const SEMANTIC = [
  { nm: 'Success', hx: '#389E0D', bg: 'var(--success)' },
  { nm: 'Warning', hx: '#D48806', bg: 'var(--warning)' },
  { nm: 'Danger',  hx: '#CF1322', bg: 'var(--danger)' },
  { nm: 'Info',    hx: '#0958D9', bg: 'var(--info)' },
];
const NEUTRAL = [
  { nm: 'Text 88%',    hx: 'rgba(0,0,0,.88)', bg: 'var(--text)',          fg: '#fff' },
  { nm: 'Text 65%',    hx: 'rgba(0,0,0,.65)', bg: 'var(--text-muted)',    fg: '#fff' },
  { nm: 'Text 45%',    hx: 'rgba(0,0,0,.45)', bg: 'var(--text-faint)',    fg: '#fff' },
  { nm: 'Border',      hx: '#D9D9D9',          bg: 'var(--border-strong)', fg: '#000' },
  { nm: 'Split',       hx: '#F0F0F0',          bg: 'var(--border)',        fg: '#000' },
  { nm: 'Fill subtle', hx: '#FAFAFA',          bg: 'var(--bg-subtle)',     fg: '#000' },
  { nm: 'Layout bg',   hx: '#F4F6F8',          bg: 'var(--bg-app)',        fg: '#000' },
];
function ColorSection() {
  return (
    <DSSection icon="cog" title="สี · Colour" sub="สีเขียวสหกรณ์เป็นแกนหลัก เสริมด้วยสีสื่อความหมายสำหรับสถานะและการแจ้งเตือน">
      <DSBlock label="Brand scale">
        <div className="ds-scale">
          {BRAND_SCALE.map(c => (
            <div className="ds-scale-cell" key={c.nm}>
              <div className="sw" style={{ background: c.v }} />
              <div className="nm">{c.nm}</div>
              <div className="hx">{c.hx}</div>
            </div>
          ))}
        </div>
      </DSBlock>
      <DSBlock label="Semantic">
        <div className="ds-swatches">
          {SEMANTIC.map(c => (
            <div className="ds-swatch" key={c.nm}>
              <div className="sw" style={{ background: c.bg }} />
              <div className="meta"><div className="nm">{c.nm}</div><div className="hx">{c.hx}</div></div>
            </div>
          ))}
        </div>
      </DSBlock>
      <DSBlock label="Neutral · ข้อความ · พื้นผิว">
        <div className="ds-swatches">
          {NEUTRAL.map(c => (
            <div className="ds-swatch" key={c.nm}>
              <div className="sw" style={{ background: c.bg }} />
              <div className="meta"><div className="nm">{c.nm}</div><div className="hx">{c.hx}</div></div>
            </div>
          ))}
        </div>
      </DSBlock>
    </DSSection>
  );
}

// ─── 1b. Typography ───────────────────────────────────────────────────
const TYPE_SCALE = [
  { sz: 28, w: 700, label: 'หัวเรื่องหน้า H1' },
  { sz: 20, w: 600, label: 'หัวข้อส่วน H2' },
  { sz: 16, w: 600, label: 'หัวข้อย่อย H3' },
  { sz: 14, w: 400, label: 'เนื้อหาปกติ · body text' },
  { sz: 13, w: 400, label: 'ข้อความรอง · caption' },
  { sz: 12, w: 400, label: 'ข้อความช่วยเหลือ · helper' },
];
function TypographySection() {
  return (
    <DSSection icon="edit" title="ตัวอักษร · Typography" sub="Sarabun สำหรับเนื้อหาทั้งหมด · IBM Plex Mono สำหรับตัวเลข รหัส และค่าคงที่">
      <div className="ds-type-cards">
        <div className="ds-type-card">
          <div className="ds-type-tag">Sarabun · Sans</div>
          <div className="ds-type-spec" style={{ fontSize: 46, fontWeight: 600 }}>สหกรณ์ Aa</div>
          <div className="ds-type-weights">300 · 400 · 500 · 600 · 700</div>
        </div>
        <div className="ds-type-card">
          <div className="ds-type-tag">IBM Plex Mono</div>
          <div className="ds-type-spec mono" style={{ fontSize: 46, fontWeight: 500, letterSpacing: '-.02em' }}>1234.56</div>
          <div className="ds-type-weights mono">LP-20&nbsp;&nbsp;·&nbsp;&nbsp;฿2,481,000.00</div>
        </div>
      </div>
      <div className="ds-type-scale">
        {TYPE_SCALE.map((t, i) => (
          <div className="ds-type-row" key={i}>
            <div className="ds-type-meta mono">{t.sz}&nbsp;&nbsp;/&nbsp;&nbsp;{t.w}</div>
            <div className="ds-type-sample" style={{ fontSize: t.sz, fontWeight: t.w }}>{t.label}</div>
          </div>
        ))}
      </div>
    </DSSection>
  );
}

// ─── 1c. Spacing · Radius · Shadow ────────────────────────────────────
const SPACING = [4, 8, 12, 16, 24, 32];
const RADII = [
  { r: '2px',  cls: { borderRadius: 'var(--radius-xs)' }, cap: '2px' },
  { r: '4px',  cls: { borderRadius: 'var(--radius)' },    cap: '4px ·def' },
  { r: '8px',  cls: { borderRadius: 'var(--radius-md)' }, cap: '8px' },
  { r: 'full', cls: { borderRadius: '999px' },            cap: 'full' },
];
const SHADOWS = [
  { nm: 'card',     v: 'var(--shadow-sm)',       spec: '0 1px 2px rgba(0,0,0,.05)' },
  { nm: 'dropdown', v: 'var(--shadow-dropdown)', spec: '0 2px 8px rgba(0,0,0,.15)' },
  { nm: 'hover',    v: 'var(--shadow-hover)',    spec: '0 4px 12px rgba(35,116,80,.15)' },
  { nm: 'modal',    v: 'var(--shadow-modal)',    spec: '0 6px 16px rgba(0,0,0,.12)' },
];
function TokensSection() {
  return (
    <DSSection icon="column" title="ระยะ · มุม · เงา · Tokens" sub="โครงพื้นฐานของ layout — ยึด radius 4px และเงาแบบบางเป็นค่าเริ่มต้น">
      <div className="ds-row" style={{ alignItems: 'flex-start', gap: 40 }}>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <DSBlock label="Spacing (0.25rem base)">
            <div className="ds-space-list">
              {SPACING.map(s => (
                <div className="ds-space-row" key={s}>
                  <span className="ds-space-lbl mono">{s}px</span>
                  <span className="ds-space-bar" style={{ width: s * 2 }} />
                </div>
              ))}
            </div>
          </DSBlock>
          <DSBlock label="Radius">
            <div className="ds-row tight" style={{ gap: 14, alignItems: 'flex-end' }}>
              {RADII.map(r => (
                <div key={r.r} style={{ textAlign: 'center' }}>
                  <div className="ds-radius-demo" style={r.cls} />
                  <div className="vv mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: 6 }}>{r.cap}</div>
                </div>
              ))}
            </div>
          </DSBlock>
        </div>
        <div style={{ flex: '1 1 300px', minWidth: 260 }}>
          <DSBlock label="Shadow">
            <div className="ds-shadow-list">
              {SHADOWS.map(s => (
                <div className="ds-shadow-row" key={s.nm}>
                  <span className="ds-shadow-demo" style={{ boxShadow: s.v }} />
                  <div>
                    <div className="nm" style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{s.nm}</div>
                    <div className="mono" style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{s.spec}</div>
                  </div>
                </div>
              ))}
            </div>
          </DSBlock>
        </div>
      </div>
    </DSSection>
  );
}

// ─── 2. Buttons ──────────────────────────────────────────────────────
function ButtonsSection() {
  return (
    <DSSection icon="check" title="ปุ่ม · Button" sub="default / primary / dashed / text / link">
      <DSBlock label="ชนิดของปุ่ม (Button types)">
        <div className="ds-row tight">
          <button className="btn primary">Primary</button>
          <button className="btn">Default</button>
          <button className="btn dashed">Dashed</button>
          <button className="btn text">Text</button>
          <button className="btn link">Link</button>
          <button className="btn accent">Accent</button>
        </div>
      </DSBlock>
      <DSBlock label="อันตราย (Danger)">
        <div className="ds-row tight">
          <button className="btn primary danger">Primary</button>
          <button className="btn danger">Default</button>
          <button className="btn dashed danger">Dashed</button>
          <button className="btn text" style={{ color: 'var(--error)' }}>Text</button>
        </div>
      </DSBlock>
      <DSBlock label="ขนาด & สถานะ (Size / icon / disabled)">
        <div className="ds-row tight">
          <button className="btn primary lg">Large</button>
          <button className="btn primary">Default</button>
          <button className="btn primary sm">Small</button>
          <button className="btn"><Icon name="download" /> มีไอคอน</button>
          <button className="btn primary" disabled>ปิดใช้งาน</button>
          <button className="btn" disabled>ปิดใช้งาน</button>
        </div>
      </DSBlock>
      <DSBlock label="เต็มความกว้าง (Block)">
        <button className="btn primary block">บันทึกข้อมูล</button>
      </DSBlock>
    </DSSection>
  );
}

// ─── 3. Form controls ────────────────────────────────────────────────
function FormSection() {
  const [chk, setChk] = useStateSC({ a: true, b: false });
  const [radio, setRadio] = useStateSC('m');
  const [sw, setSw] = useStateSC(true);
  const [seg, setSeg] = useStateSC('day');
  return (
    <DSSection icon="edit" title="ฟอร์ม · Data Entry" sub="Input / Select / Checkbox / Radio / Switch">
      <div className="ds-row" style={{ alignItems: 'flex-start', gap: 32 }}>
        <div className="ds-col">
          <DSBlock label="Input">
            <input className="cfg-input" placeholder="กรอกข้อความ" defaultValue="สมชาย ใจดี" />
          </DSBlock>
          <DSBlock label="Input · เลขที่ (mono)">
            <input className="cfg-input mono" placeholder="0000-0000" defaultValue="2551-00482" />
          </DSBlock>
          <DSBlock label="Select">
            <select className="filter-select" style={{ width: '100%', height: 34 }}>
              <option>สมาชิกถาวร</option>
              <option>สมาชิกสมทบ</option>
              <option>สมาชิกกิตติมศักดิ์</option>
            </select>
          </DSBlock>
          <DSBlock label="Textarea">
            <textarea className="cfg-input" rows={3} placeholder="หมายเหตุ..." defaultValue="ปรับปรุงข้อมูลล่าสุด มิ.ย. 2569" />
          </DSBlock>
        </div>
        <div className="ds-col">
          <DSBlock label="Checkbox">
            <div className="status-grid cols-1">
              {[['a','รับข่าวสารทางอีเมล'],['b','ยินยอมให้หักบัญชีอัตโนมัติ']].map(([k,l]) => (
                <div key={k} className={"check-row" + (chk[k] ? " on" : "")} onClick={() => setChk(s => ({ ...s, [k]: !s[k] }))}>
                  <span className="box" />
                  <span className="ck-label">{l}</span>
                </div>
              ))}
            </div>
          </DSBlock>
          <DSBlock label="Radio">
            <div className="status-grid cols-1">
              {[['m','ชาย'],['f','หญิง']].map(([k,l]) => (
                <div key={k} className={"radio-row" + (radio === k ? " on" : "")} onClick={() => setRadio(k)}>
                  <span className="dot" />
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </DSBlock>
          <DSBlock label="Radio · แบบปุ่ม (segmented)">
            <div className="mf-radio-group">
              {[['m','ชาย'],['f','หญิง'],['x','ไม่ระบุ']].map(([k,l]) => (
                <div key={k} className={"mf-radio" + (radio === k ? " on" : "")} onClick={() => setRadio(k)}>
                  <span className="dot" />{l}
                </div>
              ))}
            </div>
          </DSBlock>
          <DSBlock label="Switch · Segmented">
            <div className="ds-row tight">
              <button className={"lt-switch" + (sw ? " on" : "")} onClick={() => setSw(v => !v)}>
                <span className="lt-switch-knob" />
              </button>
              <span className="muted" style={{ fontSize: 'var(--font-sm)' }}>{sw ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
              <span style={{ width: 16 }} />
              <div className="seg">
                {[['day','รายวัน'],['mon','รายเดือน'],['yr','รายปี']].map(([k,l]) => (
                  <button key={k} className={"seg-btn" + (seg === k ? " active" : "")} onClick={() => setSeg(k)}>{l}</button>
                ))}
              </div>
            </div>
          </DSBlock>
        </div>
      </div>
    </DSSection>
  );
}

// ─── 4. Tags & status ────────────────────────────────────────────────
function TagSection() {
  return (
    <DSSection icon="info" title="แท็ก & สถานะ · Tag / Badge" sub="ชิป, สถานะแบบจุด">
      <DSBlock label="Tag (chip)">
        <div className="ds-row tight">
          <span className="chip">Default</span>
          <span className="chip primary"><span className="dot-c" />Primary</span>
          <span className="chip success"><span className="dot-c" />สำเร็จ</span>
          <span className="chip warning"><span className="dot-c" />รอตรวจสอบ</span>
          <span className="chip danger"><span className="dot-c" />ยกเลิก</span>
          <span className="chip info"><span className="dot-c" />ข้อมูล</span>
        </div>
      </DSBlock>
      <DSBlock label="Status pill (ในตาราง)">
        <div className="ds-row tight">
          <span className="pill ok">ปฏิบัติงาน</span>
          <span className="pill warn">ค้างชำระ</span>
          <span className="pill bad">พ้นสภาพ</span>
          <span className="pill info">รออนุมัติ</span>
          <span className="pill neutral">ร่าง</span>
        </div>
      </DSBlock>
      <DSBlock label="Avatar">
        <div className="ds-row tight">
          <span className="member-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>จม</span>
          <div className="user-chip"><div className="avatar">อค</div><div><div className="name">อรอุมา ค.</div><div className="role">เจ้าหน้าที่</div></div></div>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          หมายเหตุ: <b>ไม่ใช้อวาตาร์ตัวย่อชื่อสมาชิก</b> (row-avatar) ในตาราง/ป๊อปอัปค้นหา/การ์ดรายละเอียด — แสดงชื่อและรหัสเป็นข้อความล้วน ส่วนอวาตาร์โปรไฟล์/ผู้ใช้ยังใช้ได้
        </div>
      </DSBlock>
      <DSBlock label="Badge บันทึกล่าสุด (last-saved)">
        <div className="ds-row tight" style={{ alignItems: 'center' }}>
          <span className="saved-badge">บันทึกล่าสุด: 27 ส.ค. 2569 15:00 น.</span>
          <button className="btn sm"><Icon name="history" /> ประวัติ</button>
          <button className="btn primary sm"><Icon name="edit" /> แก้ไข</button>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
          ป้ายบอกเวลาบันทึกล่าสุดของหน้ารายละเอียด — กรอบเขียว พื้นสีเขียวอ่อน กดไม่ได้
          วางเป็นตัวแรกของแถวปุ่มมุมบนขวา (หน้าปุ่ม “ประวัติ”) ·
          ใช้ค่าจากรายการล่าสุดของประวัติการแก้ไข · รูปแบบ <code>วันที่ เดือนย่อ ปีพ.ศ. HH:MM น.</code> ·
          ซ่อนเมื่อกำลังแก้ไข และเมื่อยังไม่เคยมีการบันทึก · คลาส <code>.saved-badge</code>
        </div>
      </DSBlock>
    </DSSection>
  );
}

// ─── 5. Table ────────────────────────────────────────────────────────
const ROWS = [
  { code: '2551-00482', name: 'สมชาย ใจดี', dept: 'สำนักงานใหญ่', shares: 789000, status: 'ปฏิบัติงาน', st: 'ok' },
  { code: '2548-00133', name: 'อรอุมา คงทอง', dept: 'ภาคเหนือ', shares: 452000, status: 'ค้างชำระ', st: 'warn' },
  { code: '2560-01099', name: 'ธีรพงษ์ มากมี', dept: 'ภาคใต้', shares: 128500, status: 'รออนุมัติ', st: 'info' },
  { code: '2543-00071', name: 'มาลี ศรีสุข', dept: 'ภาคกลาง', shares: 1340000, status: 'พ้นสภาพ', st: 'bad' },
];
function TableSection() {
  const [sel, setSel] = useStateSC('2551-00482');
  return (
    <DSSection icon="report" title="ตาราง · Table" sub="หัวตาราง #fafafa, hover, เลือกแถว">
      <div className="table-wrap">
        <div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>รหัสสมาชิก</th>
                <th>ชื่อ–สกุล</th>
                <th>หน่วยงาน</th>
                <th className="num">ทุนเรือนหุ้น</th>
                <th className="center">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.code} className={"clickable" + (sel === r.code ? " selected" : "")} onClick={() => setSel(r.code)}>
                  <td className="mono">{r.code}</td>
                  <td>{r.name}</td>
                  <td className="muted">{r.dept}</td>
                  <td className="num">{r.shares.toLocaleString('th-TH')}</td>
                  <td className="center"><span className={"pill " + r.st}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>รวมทั้งสิ้น {ROWS.length} ราย</td>
                <td className="num">{ROWS.reduce((s, r) => s + r.shares, 0).toLocaleString('th-TH')}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      <div className="pagination" style={{ justifyContent: 'flex-end' }}>
        <button className="btn sm" disabled><Icon name="chevLeft" /></button>
        <button className="btn sm primary">1</button>
        <button className="btn sm">2</button>
        <button className="btn sm">3</button>
        <button className="btn sm"><Icon name="chevRight" /></button>
      </div>
    </DSSection>
  );
}

// ─── 6. Tabs ─────────────────────────────────────────────────────────
function TabsSection() {
  const [tab, setTab] = useStateSC('shares');
  const [sub, setSub] = useStateSC('a');
  const [line, setLine] = useStateSC('detail');
  const tabs = [['shares','หุ้น',3],['loans','เงินกู้',4],['collect','เรียกเก็บ',8],['guar','ค้ำประกัน',2]];
  const lineTabs = [['detail','รายละเอียดสมาชิก'],['status','สถานะภาพ'],['deduct','หักประจำเดือน'],['sign','ลายเซ็นต์']];
  return (
    <DSSection icon="column" title="แท็บ · Tabs" sub="เส้นใต้ (line) + แบบ segmented">
      <DSBlock label="แท็บขีดใต้ (line tabs) — แบบมาตรฐานของทุกหน้า">
        <div className="tabs-container" style={{ marginTop: 0 }}>
          <div className="tabs-bar">
            {lineTabs.map(([k, l]) => (
              <button key={k} className={"tab" + (line === k ? " active" : "")} onClick={() => setLine(k)}>{l}</button>
            ))}
          </div>
          <div className="tab-panel">
            <span className="muted" style={{ fontSize: 'var(--font-sm)' }}>
              เนื้อหาแท็บ “{lineTabs.find((t) => t[0] === line)[1]}”
            </span>
          </div>
        </div>
        <div className="ds-note" style={{ marginTop: 10, fontSize: 'var(--font-sm)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          ใช้เป็นแท็บระดับหน้า (page-level) — สลับ “มุมมองของข้อมูลชุดเดียวกัน” เช่น หน้ารายละเอียดสมาชิก
          ไม่ใช้แทนการนำทางไปคนละหน้า และไม่ควรเกิน 6–7 แท็บต่อแถว (เกินกว่านั้นแถบจะเลื่อนแนวนอน)
          <br />
          โครงสร้าง: <code>.tabs-container</code> › <code>.tabs-bar</code> › <code>button.tab</code> ·
          แท็บที่เลือกใส่ <code>.tab.active</code> (ขีดใต้สีหลัก) · ตัวเลขนับใส่ <code>span.count</code> ข้างชื่อ ·
          เนื้อหาวางใน <code>.tab-panel</code> · แท็บย่อยใช้ <code>.tabs-bar.subtab</code> (แบบ segmented)
        </div>
      </DSBlock>
      <DSBlock label="แท็บพร้อมตัวเลขนับ + แท็บย่อย segmented">
      <div className="tabs-container" style={{ marginTop: 0 }}>
        <div className="tabs-bar">
          {tabs.map(([k,l,c]) => (
            <button key={k} className={"tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>
              {l}<span className="count">{c}</span>
            </button>
          ))}
        </div>
        <div className="tabs-bar subtab">
          {[['a','ทั้งหมด'],['b','ใช้งาน'],['c','ปิดแล้ว']].map(([k,l]) => (
            <button key={k} className={"tab" + (sub === k ? " active" : "")} onClick={() => setSub(k)}>{l}</button>
          ))}
        </div>
        <div className="tab-panel">
          <span className="muted" style={{ fontSize: 'var(--font-sm)' }}>เนื้อหาแท็บ “{tabs.find(t => t[0] === tab)[1]}” · มุมมอง {sub === 'a' ? 'ทั้งหมด' : sub === 'b' ? 'ใช้งาน' : 'ปิดแล้ว'}</span>
        </div>
      </div>
      </DSBlock>
    </DSSection>
  );
}

// ─── 7. Cards / Statistic ────────────────────────────────────────────
function CardSection() {
  return (
    <DSSection icon="money" title="การ์ด & สถิติ · Card / Statistic">
      <div className="search-stats" style={{ margin: 0 }}>
        <div className="stat-card accent">
          <span className="stat-label">สมาชิกทั้งหมด</span>
          <span className="stat-value">2,481</span>
          <span className="stat-sub">+18 เดือนนี้</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ทุนเรือนหุ้นรวม</span>
          <span className="stat-value">฿ 1.84 พันล.</span>
          <span className="stat-sub">ณ 30 มิ.ย. 2569</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">ลูกหนี้เงินกู้</span>
          <span className="stat-value">1,203</span>
          <span className="stat-sub">สัญญาใช้งาน</span>
        </div>
        <div className="stat-card warn">
          <span className="stat-label">ค้างชำระ</span>
          <span className="stat-value">37</span>
          <span className="stat-sub">ต้องติดตาม</span>
        </div>
      </div>
    </DSSection>
  );
}

// ─── 8. Feedback: alerts / modal / drawer / toast ────────────────────
function FeedbackSection({ onToast }) {
  const [modal, setModal] = useStateSC(false);
  const [drawer, setDrawer] = useStateSC(false);
  const [status, setStatus] = useStateSC(null);
  const [toggle, setToggle] = useStateSC(null);
  return (
    <DSSection icon="bell" title="แจ้งเตือน · Feedback" sub="Alert / Modal / Drawer / Message">
      <DSBlock label="Alert">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="dep-authbar"><span className="dep-authbar-ico"><Icon name="check" /></span>บันทึกข้อมูลเรียบร้อยแล้ว</div>
          <div className="ct-warnbox"><Icon name="info" />ตรวจสอบยอดเงินก่อนยืนยันการทำรายการ เนื่องจากไม่สามารถยกเลิกได้ภายหลัง</div>
          <div className="dep-error"><Icon name="close" />ไม่พบบัญชีที่ตรงกับเลขที่สมาชิกที่ระบุ</div>
        </div>
      </DSBlock>
      <DSBlock label="Status modal (แจ้งผลการทำรายการ) — เพิ่ม / แก้ไข / ลบ">
        <div className="ds-row tight">
          {[['success', 'Success'], ['error', 'Error'], ['warning', 'Warning'], ['info', 'Info'], ['confirm', 'Confirm']].map(([v, l]) => (
            <button key={v} className="btn sm" onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </DSBlock>
      <DSBlock label="Toggle confirm modal (ยืนยันเปิด/ปิดใช้งาน)">
        <div className="ds-row tight">
          <button className="btn sm" onClick={() => setToggle(true)}>เปิดใช้งาน</button>
          <button className="btn sm" onClick={() => setToggle(false)}>ปิดใช้งาน</button>
        </div>
      </DSBlock>
      <DSBlock label="Overlay (เปิดดูตัวอย่าง)">
        <div className="ds-row tight">
          <button className="btn" onClick={() => setModal(true)}><Icon name="info" /> เปิด Modal</button>
          <button className="btn" onClick={() => setDrawer(true)}><Icon name="attach" /> เปิด Drawer</button>
          <button className="btn" onClick={() => onToast && onToast('นี่คือข้อความแจ้งเตือน (Message)')}><Icon name="bell" /> แสดง Message</button>
        </div>
      </DSBlock>

      {toggle !== null && window.ToggleConfirmModal && (
        <window.ToggleConfirmModal
          next={toggle}
          title={(toggle ? 'เปิด' : 'ปิด') + 'การใช้งานผลิตภัณฑ์'}
          subtitle="01 · เงินกู้สามัญ"
          detail={toggle
            ? 'เปิดให้บริการผลิตภัณฑ์ “เงินกู้สามัญ” — สมาชิกจะสามารถยื่นขอกู้ประเภทนี้ได้'
            : 'ปิดการใช้งาน “เงินกู้สามัญ” — ระบบจะไม่เปิดรับคำขอกู้ใหม่ของผลิตภัณฑ์นี้ สัญญาที่มีอยู่เดิมยังคงดำเนินการตามปกติ'}
          onCancel={() => setToggle(null)}
          onConfirm={() => { setToggle(null); setStatus('success'); }} />
      )}
      {status && window.StatusModal && (
        <window.StatusModal
          variant={status}
          title={status === 'success' ? 'บันทึกข้อมูลเรียบร้อยแล้ว'
            : status === 'error' ? 'บันทึกข้อมูลไม่สำเร็จ'
            : status === 'warning' ? 'ตรวจสอบข้อมูลก่อนบันทึก'
            : status === 'info' ? 'ข้อมูลเพิ่มเติม'
            : 'ยืนยันการลบข้อมูล'}
          detail={status === 'confirm'
            ? 'ข้อมูลที่ลบจะไม่สามารถกู้คืนได้ — การดำเนินการนี้จะถูกบันทึกใน Audit Trail'
            : 'บันทึกการเปลี่ยนแปลงใน Audit Trail เรียบร้อย'}
          onConfirm={() => setStatus(null)}
          onClose={() => setStatus(null)} />
      )}
      {modal && (
        <>
          <div className="modal-backdrop" onClick={() => setModal(false)} />
          <div className="modal-card" style={{ width: 440 }}>
            <div className="modal-head">
              <span className="modal-warnico"><Icon name="info" /></span>
              <h2>ยืนยันการทำรายการ</h2>
              <button className="close-btn" onClick={() => setModal(false)}><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 16px', fontSize: 'var(--font-base)', lineHeight: 1.6 }}>
                คุณต้องการบันทึกการเปลี่ยนแปลงข้อมูลสมาชิกใช่หรือไม่? ระบบจะบันทึกประวัติการแก้ไขไว้
              </p>
              <div className="ds-row tight" style={{ justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setModal(false)}>ยกเลิก</button>
                <button className="btn primary" onClick={() => setModal(false)}>ยืนยัน</button>
              </div>
            </div>
          </div>
        </>
      )}
      {drawer && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawer(false)} />
          <div className="drawer" style={{ width: 420 }}>
            <div className="drawer-head">
              <h2>รายละเอียด</h2>
              <button className="close-btn" onClick={() => setDrawer(false)}><Icon name="close" /></button>
            </div>
            <div className="drawer-body">
              <div className="field"><span className="label">รหัสสมาชิก</span><span className="value mono">2551-00482</span></div>
              <div className="field"><span className="label">ชื่อ–สกุล</span><span className="value">สมชาย ใจดี</span></div>
              <div className="field"><span className="label">สถานะ</span><span className="value"><span className="pill ok">ปฏิบัติงาน</span></span></div>
            </div>
          </div>
        </>
      )}
    </DSSection>
  );
}

// ─── 8b. Member search (canonical pattern) ───────────────────────────
function MemberSearchSection() {
  const demo = (window.GUAR_MEMBERS && window.GUAR_MEMBERS[0]) || null;
  const [picked, setPicked] = useStateSC(null);
  return (
    <DSSection icon="search" title="ค้นหาสมาชิก · Member Search"
               sub="รูปแบบกลางสำหรับค้นหา/เลือกเลขสมาชิก — ใช้ซ้ำทุกเมนู ทุกระบบ">
      <DSBlock label="ฟิลด์เรียกค้นหา (MemberSearchField) — สถานะว่าง / เลือกแล้ว">
        <div className="lb-header-grid" style={{ maxWidth: 560 }}>
          <div className="field">
            <span className="label">เลขที่สมาชิก</span>
            <span className="value">
              <MemberSearchField member={picked} onPick={setPicked} />
            </span>
          </div>
          {demo && (
            <div className="field">
              <span className="label">ตัวอย่างสถานะเลือกแล้ว</span>
              <span className="value">
                <MemberSearchField member={demo} onPick={() => {}} />
              </span>
            </div>
          )}
        </div>
        <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 8 }}>
          {picked
            ? <>เลือกแล้ว: <b className="mono">{picked.code}</b> · {picked.title || ''}{picked.firstName || picked.name} {picked.lastName || ''}</>
            : 'คลิกฟิลด์ด้านบนเพื่อเปิด popup ค้นหา (ทะเบียน · ชื่อ · นามสกุล · เลขที่บัตรประชาชน)'}
        </div>
      </DSBlock>
      <DSBlock label="การใช้งาน (React)">
        <pre className="ds-code">{`const [member, setMember] = useState(null);

// แบบสั้นที่สุด — จัดการ popup ให้เองภายใน
<MemberSearchField member={member} onPick={setMember} />

// หรือเปิด popup เองจากปุ่มอื่น
{open && (
  <MemberSearchModal onPick={pick} onClose={() => setOpen(false)} />
)}`}</pre>
        <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 6 }}>
          ปรับแหล่งข้อมูลของแต่ละระบบได้ผ่าน <code>source</code> / <code>searchFn</code>
          (ดีฟอลต์ <code>window.GUAR_MEMBERS</code> / ตัวค้นหากลาง <code>msSearchMembers</code>) ·
          ที่มา: หน้าจอ “ตรวจสอบสิทธิค้ำ”
        </div>
      </DSBlock>

      <DSBlock label="สถานะว่างก่อนเลือกสมาชิก (MemberSearchEmptyState)">
        <MemberSearchEmptyState
          icon="member"
          title="ยังไม่ได้เลือกสมาชิก"
          description="ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อแสดงข้อมูล"
          buttonLabel="ค้นหาเลขสมาชิก"
          examples={(window.GUAR_MEMBERS || []).slice(0, 3)}
          onPick={setPicked} />
        <pre className="ds-code" style={{ marginTop: 12 }}>{`<MemberSearchEmptyState
  icon="member" title="ยังไม่ได้เลือกสมาชิก"
  description="ค้นหาและเลือกสมาชิก…"
  buttonLabel="ค้นหาเลขสมาชิก"
  examples={demoMembers}
  onPick={(m) => goRoute({ view: 'member', code: m.code })} />`}</pre>
      </DSBlock>
    </DSSection>
  );
}

// ─── 8b-2. Contract search (canonical pattern) ───────────────────────
function ContractSearchSection() {
  const [picked, setPicked] = useStateSC(null);
  const src = window.DN_MEMBERS || [];
  const demoMember = src[0] || null;
  const demoNo = demoMember && (demoMember.debts || [])[0] && demoMember.debts[0].contractNo;
  return (
    <DSSection icon="search" title="ค้นหาสัญญา · Contract Search"
               sub="ค้นหาสัญญาด้วยเลขที่สัญญา หรือเลขทะเบียนสมาชิก — ใช้ซ้ำทุกเมนูที่ต้องเลือกสัญญาเงินกู้">
      <DSBlock label="ฟิลด์เรียกค้นหา (ContractSearchField) — สถานะว่าง / เลือกแล้ว">
        <div className="lb-header-grid" style={{ maxWidth: 620 }}>
          <div className="field">
            <span className="label">เลขที่สัญญา / เลขสมาชิก</span>
            <span className="value">
              <ContractSearchField contract={picked ? picked.debt.contractNo : null}
                                   member={picked ? picked.member : null}
                                   onPick={setPicked} source={src} />
            </span>
          </div>
          {demoNo && (
            <div className="field">
              <span className="label">ตัวอย่างสถานะเลือกแล้ว</span>
              <span className="value">
                <ContractSearchField contract={demoNo} member={demoMember} onPick={() => {}} source={src} />
              </span>
            </div>
          )}
        </div>
        <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 8 }}>
          {picked
            ? <>เลือกแล้ว: สัญญา <b className="mono">{picked.debt.contractNo}</b> · {picked.member.code} {picked.member.name}</>
            : 'คลิกฟิลด์เพื่อเปิด popup — ระบุ “เลขที่สัญญา” เพื่อไปยังสัญญาโดยตรง หรือ “เลขทะเบียน/ชื่อสมาชิก” เพื่อแสดงสัญญาทั้งหมดของสมาชิกให้เลือก'}
        </div>
      </DSBlock>
      <DSBlock label="การใช้งาน (React)">
        <pre className="ds-code">{`// ค้นหาได้ทั้งเลขที่สัญญา และเลขทะเบียนสมาชิก
// เมื่อค้นด้วยเลขสมาชิก → แสดงสัญญาของสมาชิกจัดกลุ่มให้เลือก
<ContractSearchField
  contract={contractNo} member={member}
  onPick={({ member, debt }) => loadContract(member, debt)} />

// หรือเปิด popup เองจากปุ่มอื่น
{open && (
  <ContractSearchModal
    onPick={({ member, debt }) => { ... }}
    onClose={() => setOpen(false)} />
)}`}</pre>
        <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 6 }}>
          ปรับแหล่งข้อมูลได้ผ่าน <code>source</code> (ดีฟอลต์ <code>window.DN_MEMBERS</code>) และ
          <code>debtsOf(member)</code> (ดีฟอลต์ <code>member.debts</code> — ใช้รวมสัญญา R ฯลฯ) ·
          ใช้แล้วใน: เปลี่ยนแปลงยอดชำระหนี้ · พักชำระหนี้ · เปลี่ยนแปลงรายละเอียดสัญญา
        </div>
      </DSBlock>
    </DSSection>
  );
}

// ─── 8c. Breadcrumb navigation (canonical pattern) ───────────────────
function NavigationSection() {
  const sample = [
    { label: 'หน้าหลัก', icon: 'dashboard', onClick: () => {} },
    { label: 'ใบคำขอกู้', onClick: () => {} },
    { label: 'สร้างใบคำขอกู้เงิน', current: true },
  ];
  return (
    <DSSection icon="chevRight" title="เส้นทางนำทาง · Breadcrumb"
               sub="รูปแบบมาตรฐาน 2–3 ระดับ: หน้าหลัก › เมนู › หน้าปัจจุบัน — แสดงอัตโนมัติทุกหน้าจอ">
      <DSBlock label="ตัวอย่าง (หน้าหลัก / เมนู คลิกได้ · หน้าปัจจุบันเน้น)">
        <Breadcrumb items={sample} />
      </DSBlock>
      <DSBlock label="การใช้งาน (React)">
        <pre className="ds-code">{`// แสดงอัตโนมัติจากเมนูที่เลือก — แบนราบ: หน้าหลัก › เมนู (current)
// (ไม่แสดงระดับ "ระบบ"/"กลุ่ม" แล้ว) วางครั้งเดียวบนสุดของ <main>
<Breadcrumb items={buildBreadcrumb(route, goRoute)} />

// หน้าใดมีหน้าย่อยภายใน (list → create/edit/view) เรียก useBreadcrumb
// เพื่อระบุ trail เอง — ระบบเติม "หน้าหลัก" ให้ ตัวสุดท้าย = current
useBreadcrumb(
  view === 'create'
    ? [{ label: 'ใบคำขอกู้', onClick: back },      // คลิกกลับหน้ารายการ
       { label: 'สร้างใบคำขอกู้เงิน', current: true }]
    : [{ label: 'ใบคำขอกู้', current: true }],
  [view]                                            // deps — ตั้งใหม่เมื่อสลับหน้าย่อย
);`}</pre>
        <div className="muted" style={{ fontSize: 'var(--font-xs)', marginTop: 6 }}>
          ค่าปริยาย: <code>หน้าหลัก › เมนู</code> (แบนราบทั้งระบบ) · หน้าที่มีหน้าย่อยใช้ <code>useBreadcrumb(trail, deps)</code>
          ตั้ง trail เอง — เมนูกลายเป็นลิงก์คลิกได้ และหน้าย่อยเป็น <code>current</code>
        </div>
      </DSBlock>
    </DSSection>
  );
}

// ─── 9. Pagination ───────────────────────────────────────────────────
function PaginationSection() {
  const [pg, setPg] = useStateSC(1);
  return (
    <DSSection icon="report" title="แบ่งหน้า · Pagination" sub="ข้อความสรุปช่วง · ปุ่มก่อนหน้า/ถัดไป · เลือกจำนวนต่อหน้า">
      <div className="pagination">
        <span className="muted" style={{ fontSize: 'var(--font-sm)', marginRight: 'auto' }}>1–8 จาก 8 รายการ</span>
        <button className="btn sm" disabled={pg === 1} onClick={() => setPg(p => Math.max(1, p - 1))}><Icon name="chevLeft" /></button>
        {[1, 2, 3].map(n => (
          <button key={n} className={"btn sm" + (pg === n ? " primary" : "")} onClick={() => setPg(n)}>{n}</button>
        ))}
        <button className="btn sm" onClick={() => setPg(p => Math.min(3, p + 1))}><Icon name="chevRight" /></button>
        <select className="filter-select" style={{ height: 30, marginLeft: 4 }} defaultValue="20">
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>
    </DSSection>
  );
}

// ─── Page ────────────────────────────────────────────────────────────
function AntShowcasePage({ onToast }) {
  return (
    <div className="ds-page" data-screen-label="คู่มือคอมโพเนนต์ Ant Design">
      <div className="ds-hero">
        <div className="ds-hero-ico"><Icon name="column" size={22} /></div>
        <div>
          <h1>คู่มือคอมโพเนนต์ · Design System</h1>
          <p>
            สะท้อนคู่มือ <b>ระบบ ERP สหกรณ์ออมทรัพย์ · Design System (v1.0)</b> ที่จัดเก็บไว้ใน
            <code>design-system/guide/</code> — สี · ตัวอักษร · ระยะ·มุม·เงา และคอมโพเนนต์มาตรฐาน
            บนสแตก <b>Ant Design v6.2.2</b> · <b>Tailwind v4.2.0</b> โดยคงสีหลักเขียวสหกรณ์และความหนาแน่นแบบกระชับไว้
            ทุกคอมโพเนนต์ใช้คลาสกลางชุดเดียวกับทั้งระบบ งานใหม่ในอนาคตจึงได้หน้าตาเดียวกันอัตโนมัติ
          </p>
          <span className="chip success"><span className="dot-c" />ตรงกับ Design System v1.0</span>
        </div>
      </div>

      <ColorSection />
      <TypographySection />
      <TokensSection />
      <ButtonsSection />
      <FormSection />
      <TagSection />
      <FeedbackSection onToast={onToast} />
      <CardSection />
      <TableSection />
      <TabsSection />
      <NavigationSection />
      <PaginationSection />
      <MemberSearchSection />
      <ContractSearchSection />
    </div>
  );
}

Object.assign(window, { AntShowcasePage });
