// ═════════════════════════════════════════════════════════════════
//  ปรับหน้า “ประเภทใบเสร็จ” (ลูกหนี้ตัวแทน)
//  ─ ตารางรหัสใบเสร็จ: ตัวอักษร/กรอบเล็กลง · ไอคอนลบชัดขึ้น
//  ─ Popup เพิ่มประเภทใบเสร็จ: รหัสกรอกได้ทั้งตัวอักษรและตัวเลข
// ═════════════════════════════════════════════════════════════════
(function () {
  if (document.getElementById('agrt-tweak-style')) return;
  const st = document.createElement('style');
  st.id = 'agrt-tweak-style';
  st.textContent = `
.agrt-scope .tbl { font-size: 12.5px; }
.agrt-scope .tbl th { font-size: 12px; padding: 7px 10px; }
.agrt-scope .tbl td { padding: 6px 10px; line-height: 1.35; }
.agrt-scope .tbl .mono { font-size: 12px; }
.agrt-scope .pill { font-size: 10.5px; padding: 1px 8px; }
.as-sig-del { color: var(--text-body); transition: color .15s ease; }
.as-sig-del:hover, .as-sig-del:focus-visible { color: var(--danger, #ff4d4f); background: transparent; }
.adr-scroll { scrollbar-color: #d9d9d9 #f5f5f5; scrollbar-width: thin; }
.adr-scroll::-webkit-scrollbar { height: 12px; }
.adr-scroll::-webkit-scrollbar-track { background: #f5f5f5; border-radius: 999px; }
.adr-scroll::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 999px; border: 2px solid #f5f5f5; }
.adr-scroll::-webkit-scrollbar-thumb:hover { background: #c4c4c4; }
.pcx-aa-scope .ac-code-badge,
.agrt-scope .ac-code-badge, .agcr-scope .ac-code-badge, .agpt-scope .ac-code-badge {
  height: 22px !important; min-width: 40px !important; width: auto !important;
  padding: 0 8px !important; font-size: 12px !important; border-radius: 6px !important;
}
`;
  document.head.appendChild(st);
})();

(function () {
  const Orig = window.AgentReceiptTypeConfigPage;
  if (!Orig || Orig.__agrtTweaked) return;

  function AgentReceiptTypeConfigPageTweaked(props) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const node = ref.current;
      if (!node) return;
      agcrSwapTrash(node);
      const mo = new MutationObserver(() => agcrSwapTrash(node));
      mo.observe(node, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, []);

    let el = Orig(props);
    if (el && el.props && el.props.cfg && Array.isArray(el.props.cfg.fields)) {
      const cfg = el.props.cfg;
      const fields = cfg.fields.map(f =>
        f.key === 'code'
          ? Object.assign({}, f, { numeric: false, maxLength: 6 })
          : f
      );
      el = React.cloneElement(el, { cfg: Object.assign({}, cfg, { fields }) });
    }
    return <div className="agrt-scope" ref={ref}>{el}</div>;
  }
  AgentReceiptTypeConfigPageTweaked.__agrtTweaked = true;
  window.AgentReceiptTypeConfigPage = AgentReceiptTypeConfigPageTweaked;
})();

// ── สาเหตุการยกเลิก: แบดจ์รหัสเท่า tag · ไอคอนถังขยะแบบเส้น · รหัสรับตัวอักษร+ตัวเลข ──
const AGCR_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
  + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
  + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
  + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

function agcrSwapTrash(root) {
  if (!root) return;
  root.querySelectorAll('.bud-act.danger').forEach(b => {
    if (b.dataset.agcrTrash === '1') return;
    b.dataset.agcrTrash = '1';
    b.innerHTML = AGCR_TRASH;
  });
}

(function () {
  const Orig = window.AgentCancelReasonConfigPage;
  if (!Orig || Orig.__agcrTweaked) return;

  function AgentCancelReasonConfigPageTweaked(props) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const node = ref.current;
      if (!node) return;
      agcrSwapTrash(node);
      const mo = new MutationObserver(() => agcrSwapTrash(node));
      mo.observe(node, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, []);

    let el = Orig(props);
    if (el && el.props && el.props.cfg && Array.isArray(el.props.cfg.fields)) {
      const cfg = el.props.cfg;
      const fields = cfg.fields.map(f =>
        f.key === 'code'
          ? Object.assign({}, f, { numeric: false, maxLength: 6 })
          : f
      );
      el = React.cloneElement(el, { cfg: Object.assign({}, cfg, { fields }) });
    }
    return <div className="agcr-scope" ref={ref}>{el}</div>;
  }
  AgentCancelReasonConfigPageTweaked.__agcrTweaked = true;
  window.AgentCancelReasonConfigPage = AgentCancelReasonConfigPageTweaked;
})();

// ── ประเภทการชำระ: เหมือนสาเหตุการยกเลิก ──
(function () {
  const Orig = window.AgentPaymentTypeConfigPage;
  if (!Orig || Orig.__agptTweaked) return;

  function AgentPaymentTypeConfigPageTweaked(props) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const node = ref.current;
      if (!node) return;
      agcrSwapTrash(node);
      const mo = new MutationObserver(() => agcrSwapTrash(node));
      mo.observe(node, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, []);

    let el = Orig(props);
    if (el && el.props && el.props.cfg && Array.isArray(el.props.cfg.fields)) {
      const cfg = el.props.cfg;
      const fields = cfg.fields.map(f =>
        f.key === 'code'
          ? Object.assign({}, f, { numeric: false, maxLength: 6 })
          : f
      );
      el = React.cloneElement(el, { cfg: Object.assign({}, cfg, { fields }) });
    }
    return <div className="agpt-scope" ref={ref}>{el}</div>;
  }
  AgentPaymentTypeConfigPageTweaked.__agptTweaked = true;
  window.AgentPaymentTypeConfigPage = AgentPaymentTypeConfigPageTweaked;
})();
