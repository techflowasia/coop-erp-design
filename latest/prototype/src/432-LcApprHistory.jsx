// ═════════════════════════════════════════════════════════════════
//  บันทึกหลักทรัพย์ — Popup "ประวัติราคาประเมิน/ทบทวนราคา"
//  แทนที่ toast เดิมของปุ่มในหัวข้อ "ราคาประเมิน" (ทุกประเภทหลักทรัพย์)
//    • ที่ดิน (โฉนด/นส3/นส3ก/โฉนดตราจอง) — คอลัมน์ราคาประเมินราชการ/ตารางวา
//    • ห้องชุด / สิ่งปลูกสร้าง — คอลัมน์ราคาประเมินสหกรณ์/ตารางเมตร
//  ตารางที่ 2: ประวัติการทำนิติกรรม (จดจำนอง)
// ═════════════════════════════════════════════════════════════════
(function () {
  const Orig = window.LcAppraisal;
  if (!Orig) return;

  const n = (v) => {
    const x = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return isFinite(x) ? x : 0;
  };
  const money = (v) => n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const thDate = (d) => {
    const p = (x) => String(x).padStart(2, '0');
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + (d.getFullYear() + 543);
  };
  const pct = (v) => (n(v) ? n(v).toLocaleString('en-US', { maximumFractionDigits: 2 }) + '%' : '—');

  function apprRows(rec, isLand) {
    if (Array.isArray(rec.apprHistory) && rec.apprHistory.length) return rec.apprHistory;
    const now = new Date();
    const prev = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const cur = {
      date: thDate(now),
      unit: isLand ? rec.govPerWa : rec.coopPerSqm,
      gov: rec.govPrice, coop: rec.coopPrice, licensed: rec.licensedPrice,
      maxPct: rec.maxGuarPct, summary: rec.summaryPrice || rec.coopPrice,
    };
    const scale = (v) => (n(v) ? money(n(v) * 0.92) : '');
    const old = {
      date: thDate(prev),
      unit: scale(cur.unit), gov: scale(cur.gov), coop: scale(cur.coop),
      licensed: scale(cur.licensed), maxPct: cur.maxPct, summary: scale(cur.summary),
    };
    return n(old.summary) || n(old.coop) ? [cur, old] : [cur];
  }

  function legalRows(rec) {
    if (Array.isArray(rec.legalActs) && rec.legalActs.length) return rec.legalActs;
    const base = rec.summaryPrice || rec.coopPrice;
    if (!n(base)) return [];
    return [{ date: thDate(new Date()), type: 'จดจำนอง', mortgage: base, coop: rec.coopPrice || base }];
  }

  const SecTitle = ({ children }) => (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', margin: '0 0 8px' }}>{children}</div>
  );

  function LcApprHistoryModal({ rec, isLand, onClose }) {
    const rows = apprRows(rec, isLand);
    const legal = legalRows(rec);
    const unitHead = isLand ? 'ราคาประเมินราชการ/ตารางวา' : 'ราคาประเมินสหกรณ์/ตารางเมตร';
    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-card" role="dialog" aria-modal="true"
             style={{ width: 'min(960px, 94vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-head">
            <div style={{ minWidth: 0 }}>
              <h2>ประวัติราคาประเมิน/ทบทวนราคา</h2>
            </div>
            <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
          </div>

          <div className="modal-body" style={{ overflow: 'auto' }}>
            <SecTitle>ประวัติราคาประเมิน/ทบทวนราคา</SecTitle>
            <div className="lrq-tblwrap" style={{ marginBottom: 20 }}>
              <table className="tbl lrq-tbl">
                <thead><tr>
                  <th style={{ width: 110 }}>วันที่</th>
                  <th className="right">{unitHead}</th>
                  <th className="right">{isLand ? 'ราคาประเมินราชการ' : 'ราคาประเมินราชการ'}</th>
                  <th className="right">ราคาประเมินสหกรณ์</th>
                  <th className="right">ราคาประเมินจากผู้ได้รับใบอนุญาต</th>
                  <th className="right" style={{ width: 120 }}>ค้ำประกันสูงสุด (%)</th>
                  <th className="right">สรุปราคาประเมิน</th>
                </tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan="7" className="center muted" style={{ padding: 18 }}>ไม่พบข้อมูล</td></tr>}
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td className="right mono">{money(isLand ? r.unit : r.gov)}</td>
                      <td className="right mono">{money(isLand ? r.gov : r.unit)}</td>
                      <td className="right mono">{money(r.coop)}</td>
                      <td className="right mono">{money(r.licensed)}</td>
                      <td className="right mono">{pct(r.maxPct)}</td>
                      <td className="right mono">{money(r.summary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <SecTitle>ประวัติการทำนิติกรรม</SecTitle>
            <div className="lrq-tblwrap">
              <table className="tbl lrq-tbl">
                <thead><tr>
                  <th style={{ width: 240 }}>วันที่ทำนิติกรรม/หนังสือมอบอำนาจ</th>
                  <th style={{ width: 200 }}>ประเภทนิติกรรม</th>
                  <th className="right">ราคาจำนอง</th>
                </tr></thead>
                <tbody>
                  {legal.length === 0 && <tr><td colSpan="3" className="center muted" style={{ padding: 18 }}>ไม่พบข้อมูล</td></tr>}
                  {legal.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date}</td>
                      <td>{r.type || 'จดจำนอง'}</td>
                      <td className="right mono">{money(r.mortgage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </>
    );
  }

  function LcApprConfirmModal({ rec, isLand, onConfirm, onClose }) {
    const summary = n(rec.summaryPrice || (window.lcCalcSummary ? window.lcCalcSummary(rec) : 0));
    const rows = isLand
      ? [['ราคาประเมินราชการ/ตารางวา', money(rec.govPerWa)], ['ราคาประเมินราชการ', money(rec.govPrice)]]
      : [['ราคาประเมินราชการ', money(rec.govPrice)], ['ราคาประเมินสหกรณ์/ตารางเมตร', money(rec.coopPerSqm)]];
    rows.push(['ราคาประเมินสหกรณ์', money(rec.coopPrice)]);
    rows.push(['ราคาประเมินจากผู้ได้รับใบอนุญาต', money(rec.licensedPrice)]);
    rows.push(['ค้ำประกันสูงสุด', pct(rec.maxGuarPct)]);
    rows.push(['สรุปราคาประเมิน', money(summary)]);
    return (
      <>
        <div className="modal-backdrop" onClick={onClose} />
        <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 'min(420px, 92vw)' }}>
          <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#49c11a', color: '#fff',
                          display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
              <Icon name="check" size={30} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 22 }}>ยืนยันบันทึกราคาประเมิน</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 14, columnGap: 16,
                          textAlign: 'left', fontSize: 12.5, marginBottom: 26 }}>
              {rows.map(([k, v], i) => (
                <React.Fragment key={i}>
                  <div>{k}</div>
                  <div className="mono">: {v}</div>
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" style={{ minWidth: 90 }} onClick={onClose}>ยกเลิก</button>
              <button className="btn primary" style={{ minWidth: 90 }} onClick={onConfirm}>ยืนยัน</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  function LcAppraisalWithHistory(props) {
    const [open, setOpen] = React.useState(false);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const isLand = props.variant === 'land';
    const onConfirm = (mode) => {
      if (typeof mode === 'string' && mode.indexOf('ประวัติราคาประเมิน') >= 0) { setOpen(true); return; }
      if (mode === 'confirm-appraisal') { setConfirmOpen(true); return; }
      props.onConfirm && props.onConfirm(mode);
    };
    return (
      <>
        <Orig {...props} onConfirm={onConfirm} />
        {open && <LcApprHistoryModal rec={props.rec} isLand={isLand} onClose={() => setOpen(false)} />}
        {confirmOpen && (
          <LcApprConfirmModal rec={props.rec} isLand={isLand} onClose={() => setConfirmOpen(false)}
                              onConfirm={() => { setConfirmOpen(false); props.onConfirm && props.onConfirm('confirm-appraisal'); }} />
        )}
      </>
    );
  }

  window.LcAppraisal = LcAppraisalWithHistory;
  window.LcApprHistoryModal = LcApprHistoryModal;
  window.LcApprConfirmModal = LcApprConfirmModal;
})();
