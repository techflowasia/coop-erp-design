// ════════════════════════════════════════════════════════════════════
//  ปรับหน้ารายละเอียดประเภทเงินกู้ (ระบบสินเชื่อ)
//   • ปุ่มประวัติ — ไม่แสดงจำนวน
//   • แถวปุ่มมุมบนขวา: ประวัติ › บันทึกเป็นแม่แบบ › แก้ไข/บันทึกผลิตภัณฑ์
//   • แท็บทั่วไป — ช่องหลักการปัดเศษ กรอกตัวเลขเองได้
//   • แท็บวงเงินกู้ — ย้ายตารางสิทธิ 2 ตาราง เข้าการ์ด “วิธีกำหนดสิทธิ”
//   • แท็บดอกเบี้ย — ซ่อนข้อกำหนดดอกเบี้ยรายเดือน (ยังไม่นำมาใช้)
//   • แท็บหลักประกัน — เอาเงื่อนไขตรวจ Lock หุ้นออก
//  ทำงานโดยครอบคอมโพเนนต์เดิม (ไม่แก้ไฟล์ต้นทาง)
// ════════════════════════════════════════════════════════════════════
(function () {
  const R = window.React;
  if (!R || !window.LpDetail) return;

  const _o = {
    detail: window.LpDetail,
    general: window.LpTabGeneral,
    limit: window.LpTabLimit,
    interest: window.LpTabInterest,
    collateral: window.LpTabCollateral,
  };

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

  const textOf = (el) => {
    let s = '';
    const rec = (n) => {
      if (n == null || n === false || n === true) return;
      if (Array.isArray(n)) return n.forEach(rec);
      if (typeof n === 'string' || typeof n === 'number') { s += n; return; }
      if (R.isValidElement(n)) rec(n.props.children);
    };
    rec(el);
    return s.trim();
  };

  const flatten = (kids) => {
    const out = [];
    R.Children.toArray(kids).forEach((k) => {
      if (R.isValidElement(k) && k.type === R.Fragment) out.push(...flatten(k.props.children));
      else out.push(k);
    });
    return out;
  };

  // ── แท็บทั่วไป — ช่องหลักการปัดเศษเป็นการกรอกตัวเลข ──
  window.LpTabGeneral = function LpTabGeneralPatched(props) {
    const out = _o.general(props);
    return mapTree(out, (el) => {
      if (el.type === window.LpGroup && /จำกัดจำนวนครั้งกู้ระดับกลุ่มเงินกู้/.test(el.props.title || '')) return null;
      if (el.type !== window.LpSel || el.props.group !== 'roundPlace') return undefined;
      const { v, editing, onChange } = el.props;
      if (!editing) return <div className="l2-val" style={{ minWidth: 90, textAlign: 'right' }}>{(v === '' || v == null) ? '—' : v}</div>;
      return (
        <input className="cfg-input" type="number" min="0" step="1" style={{ width: 110, textAlign: 'right' }}
               value={v == null ? '' : v} placeholder="เช่น 100"
               onChange={(e) => onChange(e.target.value)} />
      );
    });
  };

  // ── ช่องจำนวนเงิน — แสดงลูกน้ำและทศนิยม 2 ตำแหน่ง (50,000.00) ──
  const _LpNum = window.LpNum;
  if (_LpNum && !_LpNum.__moneyPatched) {
    const asNum = (x) => {
      const s = String(x == null ? '' : x).replace(/,/g, '').trim();
      if (s === '') return null;
      const n = Number(s);
      return isFinite(n) ? n : null;
    };
    const show = (x) => {
      const n = asNum(x);
      return n == null ? '' : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    function MoneyInput({ v, onChange, suffix, disabled }) {
      const [raw, setRaw] = R.useState(null);   // null = ไม่ได้โฟกัส (แสดงแบบจัดรูป)
      return (
        <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
          <input className="l2-input num" type="text" inputMode="decimal" disabled={disabled}
                 value={raw == null ? show(v) : raw}
                 onFocus={() => setRaw(v == null ? '' : String(v).replace(/,/g, ''))}
                 onChange={(e) => {
                   let t = e.target.value.replace(/[^\d.]/g, '');
                   const i = t.indexOf('.');
                   if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
                   setRaw(t);
                   onChange(t);
                 }}
                 onBlur={() => {
                   const n = asNum(raw);
                   setRaw(null);
                   if (n != null) onChange(n.toFixed(2));
                   else if (raw !== null && raw !== '') onChange(v);   // ค่าที่อ่านไม่ออก — คงค่าเดิม
                   else onChange('');
                 }} />
          {suffix && <span className="l2-suf">{suffix}</span>}
        </div>
      );
    }

    const LpNumPatched = function (props) {
      const money = props.suffix === 'บาท';
      if (!money) return _LpNum(props);
      if (!props.editing || props.disabled) {
        const n = asNum(props.v);
        return (
          <div className={'l2-val num' + (props.disabled ? ' dis-val' : '')}>
            {n == null ? '—' : show(props.v)}
            <span className="l2-suf"> {props.suffix}</span>
          </div>
        );
      }
      return <MoneyInput {...props} />;
    };
    LpNumPatched.__moneyPatched = true;
    window.LpNum = LpNumPatched;

    // ช่องจำนวนเงินในตาราง (LpNumCell, decimals = 2) — จัดรูปแบบเดียวกัน
    const _NumCell = window.LpNumCell;
    if (_NumCell && !_NumCell.__moneyPatched) {
      const MoneyCellInput = function ({ v, onChange }) {
        const [raw, setRaw] = R.useState(null);
        return (
          <input className="sh-grid-input" type="text" inputMode="decimal" style={{ textAlign: 'right', width: '100%', maxWidth: 'none' }}
                 value={raw == null ? show(v) : raw}
                 onFocus={() => setRaw(v == null ? '' : String(v).replace(/,/g, ''))}
                 onChange={(e) => {
                   let t = e.target.value.replace(/[^\d.]/g, '');
                   const i = t.indexOf('.');
                   if (i >= 0) t = t.slice(0, i + 1) + t.slice(i + 1).replace(/\./g, '');
                   setRaw(t);
                   onChange(t);
                 }}
                 onBlur={() => {
                   const n = asNum(raw);
                   setRaw(null);
                   if (n != null) onChange(n.toFixed(2));
                   else if (raw !== null && raw !== '') onChange(v);
                   else onChange('');
                 }} />
        );
      };
      const NumCellPatched = function (props) {
        if (props.decimals !== 2 || !props.editing) return _NumCell(props);
        return <MoneyCellInput v={props.v} onChange={props.onChange} />;
      };
      NumCellPatched.__moneyPatched = true;
      Object.defineProperty(NumCellPatched, 'name', { value: 'LpNumCell' });
      window.LpNumCell = NumCellPatched;
    }
  }

  // ── ตารางที่มีคอลัมน์ "ประเภทเงินกู้" — ให้เลือกจาก dropdown รายการผลิตภัณฑ์ ──
  const _Shell = window.LpTableShell;
  if (_Shell && !_Shell.__ltSelectPatched) {
    const products = () => {
      try {
        const s = localStorage.getItem('loan_types');
        if (s) return JSON.parse(s);
      } catch (e) { /* ignore */ }
      return window.LP_SEED ? JSON.parse(JSON.stringify(window.LP_SEED)) : [];
    };

    const headIdx = (kids) => {
      const head = kids.find((c) => R.isValidElement(c) && c.type === 'thead');
      if (!head) return -1;
      const rows = R.Children.toArray(head.props.children).filter((r) => r.type === 'tr');
      for (const row of rows) {
        const i = R.Children.toArray(row.props.children)
          .findIndex((th) => /^(ประเภทเงินกู้|เงินกู้ที่ต้องหักกลบ|เงินกู้ที่ห้ามกู้|เงินกู้เดิม)/.test(textOf(th)));
        if (i >= 0) return i;
      }
      return -1;
    };

    function LoanTypeSelect({ v, editing, onChange, align }) {
      const seen = new Set();
      const list = products().filter((p) => {
        const k = p.name;
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      if (!editing) {
        return (
          <span style={{ display: 'block', textAlign: align || 'left' }}>
            {v || <span className="muted">—</span>}
          </span>
        );
      }
      return (
        <select className="sh-grid-input" style={{ maxWidth: 'none', textAlign: 'left' }}
                value={v || ''} onChange={(e) => onChange(e.target.value)}>
          <option value="">— เลือกประเภทเงินกู้ —</option>
          {list.map((p, i) => (
            <option key={(p.code || '') + '|' + p.name + '|' + i} value={p.name}>{p.name}</option>
          ))}
          {v && !seen.has(v) ? <option value={v}>{v}</option> : null}
        </select>
      );
    }

    const ShellPatched = function (props) {
      const kids = R.Children.toArray(props.children);
      const idx = headIdx(kids);
      if (idx < 0) return _Shell(props);
      const next = kids.map((c) => {
        if (!R.isValidElement(c) || c.type !== 'tbody') return c;
        const rows = R.Children.toArray(c.props.children).map((row) => {
          if (!R.isValidElement(row) || row.type !== 'tr') return row;
          const cells = R.Children.toArray(row.props.children);
          const cell = cells[idx];
          if (!R.isValidElement(cell)) return row;
          const inner = R.Children.toArray(cell.props.children)[0];
          if (!R.isValidElement(inner) || inner.type !== window.LpTxtCell) return row;
          const swapped = R.cloneElement(cell, undefined,
            <LoanTypeSelect v={inner.props.v} editing={inner.props.editing}
                            align={inner.props.align} onChange={inner.props.onChange} />);
          return R.cloneElement(row, undefined, ...cells.map((x, i) => (i === idx ? swapped : x)));
        });
        return R.cloneElement(c, undefined, ...rows);
      });
      return _Shell({ ...props, children: next });
    };
    ShellPatched.__ltSelectPatched = true;
    Object.defineProperty(ShellPatched, 'name', { value: 'LpTableShell' });
    window.LpTableShell = ShellPatched;
  }

  // ── mock ตัวเลขตาราง "สิทธิจากหลักประกัน" — ต่างกันตามแท็บวิธีกำหนดสิทธิ ──
  const COLLATERAL_MOCK = {
    salary: [
      { useShare: true, useDeposit: true, useAsset: false, shareValue: 80, deposit: 50, asset: 0, maxAmount: 438120 },
    ],
    shares: [
      { useShare: true, useDeposit: false, useAsset: true, shareValue: 90, deposit: 0, asset: 70, maxAmount: 497250 },
    ],
    'both-min': [
      { useShare: true, useDeposit: true, useAsset: false, shareValue: 75, deposit: 50, asset: 0, maxAmount: 345240 },
      { useShare: true, useDeposit: true, useAsset: true, shareValue: 85, deposit: 60, asset: 70, maxAmount: 628920 },
    ],
    'both-max': [
      { useShare: true, useDeposit: false, useAsset: false, shareValue: 80, deposit: 0, asset: 0, maxAmount: 495360 },
      { useShare: true, useDeposit: true, useAsset: true, shareValue: 95, deposit: 60, asset: 80, maxAmount: 808470 },
    ],
    matrix: [
      { useShare: true, useDeposit: true, useAsset: false, shareValue: 70, deposit: 50, asset: 0, maxAmount: 390150 },
      { useShare: true, useDeposit: true, useAsset: true, shareValue: 90, deposit: 65, asset: 75, maxAmount: 877770 },
    ],
  };

  const withCollateralMock = (props) => {
    const rec = props.record;
    if (!rec || (rec.limitCollateral && rec.limitCollateral.length)) return props;
    const mode = (rec.settings && rec.settings.rightMode) || 'salary';
    const rows = COLLATERAL_MOCK[mode] || COLLATERAL_MOCK.salary;
    return { ...props, record: { ...rec, limitCollateral: rows.map((r) => ({ ...r })) } };
  };

  // ── แท็บวงเงินกู้ — รวมตารางสิทธิเข้าการ์ดวิธีกำหนดสิทธิ ──
  const isCard = (el) =>
    R.isValidElement(el) && typeof el.props.className === 'string' && /search-card/.test(el.props.className);

  const isShell = (el) =>
    R.isValidElement(el) && typeof el.type === 'function' && el.type.name === 'LpTableShell';

  // การ์ดที่ย้ายเข้าไปซ้อน — ตัดกรอบ/เงา/ระยะขอบออกให้ดูเป็นเนื้อเดียวกัน
  if (!document.getElementById('lp-merged-card-style')) {
    const st = document.createElement('style');
    st.id = 'lp-merged-card-style';
    st.textContent =
      '.l2-cols > .l2-col:only-child{border-left:0!important;padding-left:0!important;}' +
      '.search-card .search-card{border:0!important;box-shadow:none!important;' +
      'padding:0!important;margin:16px 0 0!important;background:transparent!important;border-radius:0!important;}' +
      '.seg.seg-tabs{display:flex;gap:0;padding:0;background:transparent;border:0;border-radius:0;' +
      'border-bottom:1px solid var(--border);width:100%;overflow-x:auto;}' +
      '.seg.seg-tabs .seg-btn{height:38px;padding:0 16px;border-radius:0;background:transparent;' +
      'font-weight:500;color:var(--text-muted);border-bottom:2px solid transparent;margin-bottom:-1px;box-shadow:none;}' +
      '.seg.seg-tabs .seg-btn:hover{color:var(--primary-hover);}' +
      '.seg.seg-tabs .seg-btn.active{background:transparent;color:var(--primary);font-weight:600;' +
      'border-bottom-color:var(--primary);box-shadow:none;}' +
      /* แท็บดอกเบี้ย — 2 คอลัมน์มีเส้นคั่นกลาง คงไว้ทุกขนาดจอ */
      '.l2-cols.lp-int-cols{display:grid!important;grid-template-columns:1fr 1px 1fr;gap:0 28px;align-items:start;}' +
      '.l2-cols.lp-int-cols>.l2-col:first-child{grid-column:1;}' +
      '.l2-cols.lp-int-cols>.l2-col:last-child{grid-column:3;}' +
      '.l2-cols.lp-int-cols::before{content:"";grid-column:2;align-self:stretch;background:var(--divider);}' +
      /* ตารางจำนวนคนค้ำ — เส้นคั่นคอลัมน์แถวเนื้อหา */
      '.gcc-tbl tbody td + td{border-left:1px solid var(--divider,#F0F0F0);}' +
      /* badge บันทึกล่าสุด */
      '.saved-badge{display:inline-flex;align-items:center;height:26px;padding:0 10px;' +
      'border:1px solid var(--primary);background:var(--primary-50);color:var(--primary-700);' +
      'border-radius:var(--radius-sm,4px);font-size:12px;font-weight:500;white-space:nowrap;' +
      'margin-right:4px;}';
    document.head.appendChild(st);
  }

  // ค้นหาข้อความในซับทรี โดยจำกัดความลึก (กันการลบทั้งแท็บ)
  function nearText(node, re, depth) {
    if (depth < 0) return false;
    if (Array.isArray(node)) return node.some((n) => nearText(n, re, depth));
    if (typeof node === 'string') return re.test(node);
    if (!R.isValidElement(node)) return false;
    return nearText(node.props && node.props.children, re, depth - 1);
  }

  window.LpTabLimit = function LpTabLimitPatched(props) {
    const out0 = _o.limit(withCollateralMock(props));
    // ตาราง "สิทธิจากหลักประกัน" — ทุกช่องจำนวนเงินแสดงลูกน้ำ + ทศนิยม 2 ตำแหน่ง
    const out = mapTree(out0, (el) => {
      if (!isShell(el) || !/สิทธิจากหลักประกัน/.test((el.props && el.props.title) || '')) return undefined;
      return mapTree(el, (inner) => {
        if (inner.type !== window.LpNumCell || inner.props.decimals === 2) return undefined;
        return R.cloneElement(inner, { decimals: 2 });
      });
    });
    const MOVE = [/สิทธิจากหลักประกัน/, /สิทธิแบบกำหนดเอง/];
    const PREVIEW = /ตัวอย่างการคำนวณสิทธิ/;
    const PREVIEW2 = /เงินเดือนตัวอย่าง|ค่าหุ้นสะสมตัวอย่าง|เพดานวงเงินผลิตภัณฑ์|สิทธิการกู้สูงสุด|ค่านี้จะถูกใช้คำนวณจริงเมื่อ/;
    const TARGET = /วิธีกำหนดสิทธิ/;

    // เก็บการ์ดที่จะย้าย (เอาเฉพาะเนื้อในการ์ด ไม่เอากรอบการ์ดซ้อน)
    const moved = [];
    const matchIdx = (el) => {
      const title = (el.props && el.props.title) || '';
      if (isShell(el)) return MOVE.findIndex((re) => re.test(title));
      if (isCard(el)) {
        const t = textOf(el);
        if (TARGET.test(t)) return -1;
        return MOVE.findIndex((re) => re.test(t));
      }
      return -1;
    };
    const scan = (node) => {
      if (Array.isArray(node)) return node.forEach(scan);
      if (!R.isValidElement(node)) return;
      const i = matchIdx(node);
      if (i >= 0) { moved[i] = node; return; }
      scan(node.props && node.props.children);
    };
    scan(out);

    const segTabs = (node) => mapTree(mapTree(node, (el) => {
      // แถว l2-cols เป็นตัวคุมเลย์เอาต์ — ห้ามลบทั้งแถว (ลบเฉพาะคอลัมน์ตัวอย่างการคำนวณ)
      const cn0 = el.props && el.props.className;
      if (typeof cn0 === 'string' && /(^|\s)l2-cols(\s|$)/.test(cn0)) return undefined;
      return (nearText(el, PREVIEW, 3) || nearText(el, PREVIEW2, 4)) ? null : undefined;
    }), (el) => {
      const cn = el.props && el.props.className;
      if (typeof cn === 'string' && /(^|\s)seg(\s|$)/.test(cn) && !/seg-tabs/.test(cn)) {
        return R.cloneElement(el, { className: cn + ' seg-tabs' });
      }
      return undefined;
    });

    // แบ่ง l2-cols ของวิธีกำหนดสิทธิเป็น 2 คอลัมน์: เกณฑ์สิทธิ | อ้างอิงระเบียบ/ประกาศ
    const REF = /อ้างอิงระเบียบ\/ประกาศ/;
    const criteriaCols = (node) => {
      let split = false;
      return mapTree(node, (el) => {
        if (split) return undefined;
        const cn = el.props && el.props.className;
        if (typeof cn !== 'string' || !/(^|\s)l2-cols(\s|$)/.test(cn)) return undefined;
        const groups = [];
        const collect = (n) => {
          if (Array.isArray(n)) return n.forEach(collect);
          if (!R.isValidElement(n)) return;
          if (n.type === window.LpGroup) { groups.push(n); return; }
          collect(n.props && n.props.children);
        };
        collect(el.props.children);
        const refs = groups.filter((g) => REF.test(g.props.title || ''));
        const rest = groups.filter((g) => !REF.test(g.props.title || ''));
        if (!refs.length || !rest.length) return undefined;
        split = true;
        return R.cloneElement(el, { className: cn, style: Object.assign({}, el.props.style, { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }) },
          <div className="l2-col" key="cA">{rest.map((g, i) => R.cloneElement(g, { key: 'a' + i }))}</div>,
          <div className="l2-col" key="cB" style={{ borderLeft: '1px solid var(--line, #e5e7eb)', paddingLeft: 20 }}>{refs.map((g, i) => R.cloneElement(g, { key: 'b' + i }))}</div>
        );
      });
    };

    if (!moved.filter(Boolean).length) return criteriaCols(segTabs(out));

    // ถ้าไม่มีการ์ด “วิธีกำหนดสิทธิ” ให้ปล่อยตารางไว้ตำแหน่งเดิม (ไม่ต้องย้าย)
    const hasTarget = (() => {
      let found = false;
      const walk = (node) => {
        if (found) return;
        if (Array.isArray(node)) return node.forEach(walk);
        if (!R.isValidElement(node)) return;
        if (isCard(node) && TARGET.test(textOf(node))) { found = true; return; }
        walk(node.props && node.props.children);
      };
      walk(out);
      return found;
    })();
    if (!hasTarget) return criteriaCols(segTabs(out));

    let done = false;
    const merged = mapTree(out, (el) => {
      if (matchIdx(el) >= 0) return null;
      if (!isCard(el)) return undefined;
      const t = textOf(el);
      if (!done && TARGET.test(t)) {
        done = true;
        const inner = moved.filter(Boolean).map((card, i) => R.cloneElement(card, { key: 'mv' + i }));
        const kids = flatten(el.props.children).map((c, i) =>
          R.isValidElement(c) ? R.cloneElement(c, { key: 'own' + i }) : c);
        return R.cloneElement(el, undefined, ...kids, ...inner);
      }
      return undefined;
    });
    return criteriaCols(segTabs(merged));
  };

  // ── แท็บดอกเบี้ย — ซ่อนข้อกำหนดดอกเบี้ยรายเดือน + จัดกลุ่มที่เหลือครึ่ง–ครึ่ง ──
  window.LpTabInterest = function LpTabInterestPatched(props) {
    const out = _o.interest(props);
    const trimmed = mapTree(out, (el) => {
      if (el.type === window.LpGroup && /ข้อกำหนดดอกเบี้ยรายเดือน/.test(el.props.title || '')) return null;
      return undefined;
    });

    let split = false;
    return mapTree(trimmed, (el) => {
      if (split) return undefined;
      const cn = el.props && el.props.className;
      if (typeof cn !== 'string' || !/(^|\s)l2-cols(\s|$)/.test(cn)) return undefined;
      const groups = [];
      const collect = (node) => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (!R.isValidElement(node)) return;
        if (node.type === window.LpGroup) { groups.push(node); return; }
        collect(node.props && node.props.children);
      };
      collect(el.props.children);
      if (groups.length < 2) return undefined;
      split = true;
      const half = Math.ceil(groups.length / 2);
      const col = (list, i) => (
        <div className="l2-col" key={'c' + i}>
          {list.map((g, j) => R.cloneElement(g, { key: 'g' + i + '-' + j }))}
        </div>
      );
      return R.cloneElement(el, { className: cn + ' lp-int-cols' },
        col(groups.slice(0, half), 0), col(groups.slice(half), 1));
    });
  };

  // ── แท็บหลักประกัน — เอาเงื่อนไขตรวจ Lock หุ้นออก ──
  window.LpTabCollateral = function LpTabCollateralPatched(props) {
    const out = _o.collateral(props);
    return mapTree(out, (el) => {
      if (el.type === window.LpCheckItem && /ใช้หุ้นค้ำต้องตรวจว่าหุ้นมีการ\s*Lock/.test(el.props.label || '')) return null;
      return undefined;
    });
  };

  // ── badge “บันทึกล่าสุด” ──
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function savedLabel(rec) {
    const h = (rec && rec.history) || [];
    if (!h.length) return null;
    const ts = h[0].ts || h[0].date || '';
    const m = String(ts).match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return null;
    const y = Number(m[1]) + 543;
    const d = Number(m[3]);
    const mon = TH_MON[Number(m[2]) - 1] || '';
    const time = m[4] ? ' ' + m[4] + ':' + m[5] + ' น.' : '';
    return 'บันทึกล่าสุด: ' + d + ' ' + mon + ' ' + y + time;
  }

  // ── แถวปุ่มมุมบนขวา ──
  window.LpDetail = function LpDetailPatched(props) {
    const out = _o.detail(props);
    return mapTree(out, (el) => {
      if (!el.props || el.props.className !== 'page-actions') return undefined;
      const kids = flatten(el.props.children);
      const lead = [], tail = [];
      let history = null, template = null, cancel = null, primary = null;
      kids.forEach((k, i) => {
        const t = textOf(k);
        if (/^ประวัติ/.test(t)) {
          history = R.cloneElement(k, { key: 'hist' }, <Icon name="history" />, ' ประวัติ');
        } else if (/^บันทึกเป็นแม่แบบ/.test(t)) {
          template = R.cloneElement(k, { key: 'tpl' });
        } else if (/^(ยกเลิก|ละทิ้ง)/.test(t)) {
          cancel = R.cloneElement(k, { key: 'cancel' });
        } else if (/^(แก้ไขผลิตภัณฑ์|บันทึกผลิตภัณฑ์)/.test(t)) {
          primary = R.cloneElement(k, { key: 'primary' });
        } else if (!history) {
          lead.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'lead' + i }) : k);
        } else {
          tail.push(R.isValidElement(k) ? R.cloneElement(k, { key: 'tail' + i }) : k);
        }
      });
      if (!template && props.onSaveTemplate) {
        template = (
          <button key="tpl" className="btn sm" onClick={() => props.onSaveTemplate(props.record)}>
            <Icon name="column" /> บันทึกเป็นแม่แบบ
          </button>
        );
      }
      const label = cancel ? null : savedLabel(props.record);
      const badge = label ? <span key="saved" className="saved-badge">{label}</span> : null;
      // โหมดแก้ไข: ไม่แสดง badge บันทึกล่าสุด และปุ่มประวัติ
      const next = cancel
        ? [...lead, cancel, template, primary, ...tail].filter(Boolean)
        : [...lead, badge, history, primary, ...tail].filter(Boolean);
      return R.cloneElement(el, undefined, ...next);
    });
  };
})();


// ═════════════════════════════════════════════════════════════════
//  เมนูค่าคงที่ระบบสินเชื่อ — ปุ่ม "ละทิ้ง" (data-discard="1") ถาม "ทิ้งการแก้ไข?" ก่อน
// ═════════════════════════════════════════════════════════════════
(function () {
  if (window.__discardGuard) return;
  window.__discardGuard = true;
  let host = null, root = null;
  const close = () => { if (root) root.render(null); };
  document.addEventListener('click', (e) => {
    const b = e.target && e.target.closest && e.target.closest('button[data-discard="1"]');
    if (!b || b.dataset.discardOk === '1') return;
    e.preventDefault(); e.stopPropagation();
    if (!host) { host = document.createElement('div'); document.body.appendChild(host); root = ReactDOM.createRoot(host); }
    const Modal = window.LpDiscardModal;
    if (!Modal) return;
    root.render(<Modal onKeep={close} onDiscard={() => { close(); b.dataset.discardOk = '1'; b.click(); delete b.dataset.discardOk; }} />);
  }, true);
})();
