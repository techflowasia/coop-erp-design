// ════════════════════════════════════════════════════════════════════
//  หน้าเพิ่ม/แก้ไขโครงการอบรม — ทำให้แท็บของหน้าทำงานจริง
//  กดแท็บ → แสดงเฉพาะส่วนของแท็บนั้น ซ่อนส่วนอื่น (จับคู่จากหัวข้อในฟอร์ม)
//  ปุ่มบันทึก / เปิดรับสมัคร ท้ายฟอร์มคงอยู่ทุกแท็บ
// ════════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  if (!R) return;

  const VOID_TAGS = { input: 1, img: 1, br: 1, hr: 1, col: 1, area: 1, base: 1, embed: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  function mapTree(node, fn) {
    if (Array.isArray(node)) return node.map((n) => mapTree(n, fn));
    if (!R.isValidElement(node)) return node;
    const res = fn(node);
    if (res === null) return null;
    if (res !== undefined) return res;
    if (typeof node.type === 'string' && VOID_TAGS[node.type]) return node;
    const kids = node.props && node.props.children;
    if (kids == null || kids === false) return node;
    const arr = Array.isArray(kids) ? kids : [kids];
    return R.cloneElement(node, undefined, ...arr.map((k) => mapTree(k, fn)));
  }

  const textOf = (n) => {
    if (n == null || n === false) return '';
    if (typeof n === 'string' || typeof n === 'number') return String(n);
    if (Array.isArray(n)) return n.map(textOf).join('');
    if (R.isValidElement(n)) return textOf((n.props || {}).children);
    return '';
  };

  // หัวข้อของ section — อ่านจาก SecHead เท่านั้น (ไม่เอาเนื้อในฟอร์ม)
  function secTitle(section) {
    let t = '';
    mapTree(section, (el) => {
      if (!t && el.props && typeof el.props.title === 'string' && el.props.n !== undefined) t = el.props.title;
      return undefined;
    });
    return t;
  }

  // คำสำคัญของแต่ละแท็บ — เรียงลำดับ ตัวแรกที่ตรงชนะ
  const KEYS = [
    { re: /ค่าใช้จ่าย|งบประมาณ/,        tab: /ค่าใช้จ่าย|งบ/ },
    { re: /ห้องพัก|ที่พัก/,             tab: /ห้องพัก|ที่พัก/ },
    { re: /เอกสาร|ประกาศ|หนังสือเชิญ/,  tab: /เอกสาร|เชิญ|ประกาศ/ },
    { re: /ประวัติ/,                   tab: /ประวัติ/ },
    { re: /รับสมัคร|สิทธิ์เข้าร่วม/,      tab: /เงื่อนไข|สิทธิ|ผู้เข้าร่วม/ },
    { re: /รายชื่อผู้สมัคร|ผู้ลงทะเบียน/, tab: /ผู้สมัคร|รายชื่อ|ลงทะเบียน/ },
  ];

  // เก็บสถานะแท็บนอก component — กันค่าหายเมื่อฟอร์มถูก remount
  const store = { tab: 0, hist: false };
  const subs = new Set();
  const notify = () => subs.forEach(fn => fn());
  const setStore = (patch) => { Object.assign(store, patch); notify(); };

  function TabbedForm({ orig, props }) {
    const [, bump] = R.useState(0);
    R.useEffect(() => {
      const fn = () => bump(n => n + 1);
      subs.add(fn);
      return () => subs.delete(fn);
    }, []);
    const tab = store.tab;
    const hist = store.hist;
    const setTab = (i) => setStore({ tab: i });
    const setHist = (v) => setStore({ hist: v });
    const Icon = window.Icon || (() => null);
    const out = orig(props);

    // เก็บป้ายแท็บจากของเดิม
    let labels = [];
    mapTree(out, (el) => {
      if (typeof el.type === 'string' && /sem-form-tabs/.test(String(el.props.className || ''))) {
        labels = R.Children.toArray(el.props.children)
          .flatMap(c => (R.isValidElement(c) && c.type === 'button') ? [textOf(c)] : [])
          .map(s => s.replace(/^\s*\d+\s*·\s*/, '').trim())
          .filter(Boolean)
          .filter(l => !/ประวัติ/.test(l));
      }
      return undefined;
    });
    if (!labels.length) return out;

    const tabIndexFor = (title) => {
      for (const k of KEYS) {
        if (!k.re.test(title)) continue;
        const i = labels.findIndex(l => k.tab.test(l));
        if (i >= 0) return i;
      }
      return 0;
    };

    let hasVisible = false;
    let histSec = null;
    const patched = mapTree(out, (el) => {
      if (typeof el.type !== 'string') return undefined;
      const cls = String(el.props.className || '');

      // ปุ่มประวัติ มุมบนขวา
      if (/page-actions/.test(cls)) {
        const kids = R.Children.toArray(el.props.children);
        return R.cloneElement(el, undefined, ...kids.concat(
          <div key="sem-hist-btn" style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <button type="button" className="btn sm" onClick={() => setHist(true)}>
              <Icon name="history" /> ประวัติ
            </button>
          </div>
        ));
      }

      if (/sem-form-tabs/.test(cls)) {
        return (
          <div className="search-card" style={{ padding: '0 8px', marginBottom: 12 }}>
            <div className={cls} style={{ margin: 0, border: 0 }}>
              {labels.map((l, i) => (
                <button key={l} type="button" className={'tab' + (i === tab ? ' active' : '')}
                        onClick={() => setTab(i)}>{l}</button>
              ))}
            </div>
          </div>
        );
      }

      if (el.type === 'section' && /sem-sec/.test(cls)) {
        const title = secTitle(el);
        if (/ประวัติ/.test(title)) { histSec = el; return null; }
        if (tabIndexFor(title) !== tab) return null;
        hasVisible = true;
        return el;
      }
      return undefined;
    });

    // ── ประวัติ — layout เดียวกับ modal ประวัติหน้ารายละเอียดประเภทเงินกู้ ──
    const rec = props.editInit || props.initial || props.record || props.data || props.value || {};
    const fmt = window.fmt || { date: (d) => d || '' };
    const meta = (a) => a === 'create'
      ? { label: 'สร้างโครงการ', color: 'var(--success)', icon: 'plus' }
      : a === 'toggle' ? { label: 'เปิด/ปิดการใช้งาน', color: 'var(--warning)', icon: 'refresh' }
      : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };

    let histList = Array.isArray(rec.history) ? rec.history : [];
    if (!histList.length) {
      const at = rec.updatedAt || rec.createdAt || '';
      if (at) {
        histList = [{
          action: rec.updatedAt && rec.createdAt && rec.updatedAt !== rec.createdAt ? 'update' : 'create',
          ts: String(at).length >= 16 ? String(at) : String(at) + ' 00:00',
          summary: (rec.title ? 'โครงการ “' + rec.title + '”' : 'บันทึกข้อมูลโครงการ'),
          user: rec.updatedBy || rec.createdBy || 'เจ้าหน้าที่',
        }];
      }
    }

    const histTimeline = (
      <React.Fragment>
        {histList.length === 0 && (
          <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {histList.map((h, i) => {
            const m = meta(h.action);
            const ts = String(h.ts || '');
            return (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px',
                                    borderBottom: i < histList.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'grid', placeItems: 'center',
                                background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color }}>
                    <Icon name={m.icon} size={14} />
                  </div>
                  {i < histList.length - 1 && (
                    <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                    <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>
                      {fmt.date(ts.slice(0, 10))} · {ts.slice(11, 16)} น.
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', marginTop: 3 }}>{h.summary}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>โดย {h.user}</div>
                  {h.changes && h.changes.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {h.changes.map((c, ci) => (
                        <div key={ci} style={{ fontSize: 11.5, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
                          <span className="muted" style={{ minWidth: 130 }}>{c.field}</span>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-faint)' }}>{c.before}</span>
                          <Icon name="chevRight" size={11} />
                          <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{c.after}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </React.Fragment>
    );

    const histModal = hist && (
      <React.Fragment>
        <div className="modal-backdrop" onClick={() => setHist(false)} />
        <div className="modal-card" role="dialog" aria-modal="true"
             style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-head">
            <div className="gc-modal-ico"><Icon name="history" /></div>
            <div style={{ minWidth: 0 }}>
              <h2>ประวัติการเพิ่ม/แก้ไขโครงการ</h2>
              <div className="muted" style={{ fontSize: 11 }}>
                บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบย้อนหลัง
              </div>
            </div>
            <button className="close-btn" onClick={() => setHist(false)} aria-label="ปิด"><Icon name="close" /></button>
          </div>
          <div className="modal-body" style={{ overflow: 'auto' }}>
            {histList.length
              ? histTimeline
              : (histSec
                  ? mapTree(histSec, (el) => (
                      (el.props && el.props.n !== undefined && typeof el.props.title === 'string') ? null : undefined
                    ))
                  : histTimeline)}
          </div>
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={() => setHist(false)}>ปิด</button>
          </div>
        </div>
      </React.Fragment>
    );

    const wrap = (node) => <React.Fragment>{node}{histModal}</React.Fragment>;

    if (hasVisible) return wrap(patched);
    return wrap(mapTree(patched, (el) => {
      if (typeof el.type !== 'string') return undefined;
      if (!/sem-sheet/.test(String(el.props.className || ''))) return undefined;
      return R.cloneElement(el, undefined,
        <div style={{ padding: '48px 8px', textAlign: 'center', color: 'rgba(0,0,0,.45)', fontSize: 13 }}>
          ส่วน “{labels[tab]}” จะเปิดใช้งานหลังบันทึกโครงการ
        </div>
      );
    }));
  }

  const install = () => {
    const orig = window.SeminarProjectForm;
    if (!orig) return false;
    if (orig.__formTabs) return true;
    const Patched = function (props) { return <TabbedForm orig={orig} props={props} />; };
    Patched.__formTabs = true;
    Patched.__eligMulti = orig.__eligMulti;
    window.SeminarProjectForm = Patched;
    return true;
  };

  if (!install()) {
    let n = 0;
    const t = setInterval(() => { if (install() || ++n > 100) clearInterval(t); }, 100);
  }
})();
