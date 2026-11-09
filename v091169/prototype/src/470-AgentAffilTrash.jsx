// ── สังกัดตัวแทน: ไอคอนถังขยะแบบเส้น (ชุดเดียวกับสาเหตุการยกเลิก) ──
(function () {
  const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">'
    + '<path d="M3.5 6.5h17" /><path d="M9.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v1.5" />'
    + '<path d="M5.8 6.5l.8 12.1A2 2 0 0 0 8.6 20.5h6.8a2 2 0 0 0 2-1.9l.8-12.1" />'
    + '<path d="M10 10.5v6M14 10.5v6" /></svg>';

  const swap = (root) => {
    if (!root) return;
    root.querySelectorAll('.bud-act.danger').forEach(b => {
      if (b.dataset.aaTrash === '1') return;
      b.dataset.aaTrash = '1';
      b.innerHTML = TRASH;
    });
  };

  const Orig = window.AgentAffiliationConfigPage;
  if (!Orig || Orig.__aaTrash) return;

  function AgentAffiliationConfigPageTweaked(props) {
    const ref = React.useRef(null);
    React.useEffect(() => {
      const node = ref.current;
      if (!node) return;
      swap(node);
      const mo = new MutationObserver(() => swap(node));
      mo.observe(node, { childList: true, subtree: true });
      return () => mo.disconnect();
    }, []);
    return <div ref={ref}>{React.createElement(Orig, props)}</div>;
  }
  AgentAffiliationConfigPageTweaked.__aaTrash = true;
  window.AgentAffiliationConfigPage = AgentAffiliationConfigPageTweaked;
})();
