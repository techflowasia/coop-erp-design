// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — หน้าเคาน์เตอร์รับ–จ่ายเงิน (Quick teller)
//  รับเงิน (FinanceReceivePage) · จ่ายเงิน (FinancePayPage)
//  ใช้ TellerWorkspace ร่วมกัน โดยสลับ mode = 'receive' | 'pay'
//  เชื่อมโยง (อ้างอิง) ไปยังใบสำคัญรับ/จ่ายในระบบบัญชี — แสดงลิงก์เท่านั้น
// ════════════════════════════════════════════════════════════════════
const { useState: fnUseState, useMemo: fnUseMemo, useRef: fnUseRef } = React;

const FIN_CFG = {
  receive: {
    title: 'รับเงิน', label: 'รับเงิน',
    desc: 'เคาน์เตอร์รับเงินจริง — บันทึกการรับชำระอย่างรวดเร็ว แล้วอ้างอิงไปยังใบสำคัญรับในระบบบัญชี',
    types: () => window.FIN_RCV_TYPES, typeOf: (v) => window.finRcvType(v),
    idPrefix: 'RCT', storeLoad: () => window.finRcvLoad(), storeSave: (l) => window.finRcvSave(l),
    payerLabel: 'ผู้ชำระเงิน', payerPlaceholder: 'พิมพ์ชื่อ / รหัสสมาชิก หรือเลือกจากรายการ',
    payers: () => window.finReceivePayers(),
    amountLabel: 'จำนวนเงินที่รับ', submitLabel: 'รับเงิน · ออกใบเสร็จ',
    refType: 'RV', refLabel: 'อ้างอิงใบสำคัญรับ (บัญชี)', refPlaceholder: 'เช่น RV-2569-000031',
    refRoute: { view: 'account', page: 'receipt' }, refTargetName: 'ใบสำคัญรับ',
    accent: 'var(--primary)', verb: 'รับเงิน',
  },
  pay: {
    title: 'จ่ายเงิน', label: 'จ่ายเงิน',
    desc: 'เคาน์เตอร์จ่ายเงินจริง — บันทึกการจ่ายอย่างรวดเร็ว แล้วอ้างอิงไปยังใบสำคัญจ่ายในระบบบัญชี',
    types: () => window.FIN_PAY_TYPES, typeOf: (v) => window.finPayType(v),
    idPrefix: 'PMT', storeLoad: () => window.finPayLoad(), storeSave: (l) => window.finPaySave(l),
    payerLabel: 'ผู้รับเงิน', payerPlaceholder: 'พิมพ์ชื่อผู้รับเงิน / คู่ค้า หรือเลือกจากรายการ',
    payers: () => window.finPayPayees(),
    amountLabel: 'จำนวนเงินที่จ่าย', submitLabel: 'จ่ายเงิน',
    refType: 'PV', refLabel: 'อ้างอิงใบสำคัญจ่าย (บัญชี)', refPlaceholder: 'เช่น PV-6906-0003',
    refRoute: { view: 'account', page: 'voucher' }, refTargetName: 'ใบสำคัญจ่าย',
    accent: 'var(--primary)', verb: 'จ่ายเงิน',
  },
};

// ╭─────────────────────────────────────────────────────────────────╮
// │   TellerWorkspace — โครงร่วมรับ/จ่าย                              │
// ╰─────────────────────────────────────────────────────────────────╯
function TellerWorkspace({ mode, onToast, onNav }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const cfg = FIN_CFG[mode];
  const types = cfg.types();
  const [list, setList] = fnUseState(cfg.storeLoad);
  const [type, setType] = fnUseState(types[0].v);
  const [payer, setPayer] = fnUseState('');
  const [amount, setAmount] = fnUseState('');
  const [method, setMethod] = fnUseState('cash');
  const [refNo, setRefNo] = fnUseState('');
  const [note, setNote] = fnUseState('');
  const [editRef, setEditRef] = fnUseState(null);   // { id, val }
  const amtRef = fnUseRef(null);

  const persist = (next) => { setList(next); cfg.storeSave(next); };
  const todayKey = window.finDateKey(new Date().toISOString());

  const sorted = fnUseMemo(() => [...list].sort((a, b) => (a.ts < b.ts ? 1 : -1)), [list]);
  const today = fnUseMemo(() => {
    const t = sorted.filter(x => window.finDateKey(x.ts) === todayKey && x.status !== 'cancelled');
    return { count: t.length, sum: t.reduce((s, x) => s + Number(x.amount || 0), 0) };
  }, [sorted]);

  const resetForm = () => { setPayer(''); setAmount(''); setRefNo(''); setNote(''); };

  const submit = () => {
    const amt = Number(String(amount).replace(/,/g, ''));
    if (!payer.trim()) { onToast && onToast(`กรุณาระบุ${cfg.payerLabel}`); return; }
    if (!(amt > 0)) { onToast && onToast('กรุณาระบุจำนวนเงินให้ถูกต้อง'); return; }
    const id = window.finNextNo(list, cfg.idPrefix, new Date().toISOString());
    const rec = {
      id, ts: new Date().toISOString(), type, payer: payer.trim(), payerCode: '',
      amount: amt, method, refType: cfg.refType, refNo: refNo.trim(),
      note: note.trim(), by: 'นางจันทร์เพ็ญ มาลี', status: 'done',
    };
    persist([rec, ...list]);
    audit.log && audit.log({
      action: 'create', module: `การเงิน — ${cfg.title}`, target: id,
      summary: `${cfg.verb} ${cfg.typeOf(type).short} “${rec.payer}” ${window.fmt.money(amt)} บาท`,
    });
    onToast && onToast(`${cfg.verb} ${window.fmt.money(amt)} บาท เรียบร้อย — เลขที่ ${id}`);
    resetForm();
    if (amtRef.current) amtRef.current.focus();
  };

  const cancelTxn = (rec) => {
    persist(list.map(x => x.id === rec.id ? { ...x, status: 'cancelled' } : x));
    audit.log && audit.log({ action: 'update', module: `การเงิน — ${cfg.title}`, target: rec.id, summary: `ยกเลิกรายการ ${rec.id}` });
    onToast && onToast(`ยกเลิกรายการ ${rec.id} แล้ว`);
  };

  const saveRef = (rec) => {
    const val = (editRef.val || '').trim();
    persist(list.map(x => x.id === rec.id ? { ...x, refNo: val } : x));
    setEditRef(null);
    if (val) onToast && onToast(`เชื่อมโยง ${rec.id} → ${val} แล้ว`);
  };

  const gotoRef = (refNo) => { if (refNo && onNav) onNav(cfg.refRoute); };
  const onAmountKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div data-screen-label={`หน้า${cfg.title} (การเงิน)`}>
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{cfg.title}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>{cfg.desc}</div>
        </div>
        <span className="spacer" />
        <div className="fin-kpi">
          <div className="fin-kpi-lab">รายการวันนี้</div>
          <div className="fin-kpi-val">{today.count} <span className="fin-kpi-unit">รายการ</span></div>
        </div>
        <div className="fin-kpi accent">
          <div className="fin-kpi-lab">ยอดรวมวันนี้</div>
          <div className="fin-kpi-val">{window.fmt.money(today.sum)} <span className="fin-kpi-unit">บาท</span></div>
        </div>
      </div>

      <div className="fin-layout">
        {/* ── ฟอร์มเคาน์เตอร์ ── */}
        <div className="fin-form-col">
          <div className="search-card fin-form-card">
            <div className="fin-form-title"><Icon name={mode === 'receive' ? 'download' : 'upload'} size={15} /> บันทึก{cfg.title}</div>

            <div className="fin-fld">
              <label className="fin-lab">ประเภท{cfg.title}</label>
              <div className="seg fin-typeseg">
                {types.map(t => (
                  <button key={t.v} className={"seg-btn" + (type === t.v ? ' active' : '')} onClick={() => setType(t.v)}>{t.short}</button>
                ))}
              </div>
              <div className="fin-hint"><Icon name="info" size={11} /> {cfg.typeOf(type).hint}</div>
            </div>

            <div className="fin-fld">
              <label className="fin-lab">{cfg.payerLabel}<span className="cfg-required">*</span></label>
              <input className="cfg-input" list={`fin-payers-${mode}`} value={payer}
                     onChange={e => setPayer(e.target.value)} placeholder={cfg.payerPlaceholder} />
              <datalist id={`fin-payers-${mode}`}>
                {cfg.payers().slice(0, 60).map((p, i) => <option key={i} value={p.name}>{p.code}</option>)}
              </datalist>
            </div>

            <div className="fin-fld">
              <label className="fin-lab">{cfg.amountLabel}<span className="cfg-required">*</span></label>
              <div className="fin-amount-wrap">
                <span className="fin-amount-cur">฿</span>
                <input ref={amtRef} className="cfg-input mono fin-amount" inputMode="decimal" value={amount}
                       onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                       onKeyDown={onAmountKey} placeholder="0.00" />
              </div>
            </div>

            <div className="fin-fld">
              <label className="fin-lab">วิธี{cfg.title}</label>
              <div className="seg">
                {window.FIN_METHODS.map(m => (
                  <button key={m.v} className={"seg-btn" + (method === m.v ? ' active' : '')} onClick={() => setMethod(m.v)}>{m.l}</button>
                ))}
              </div>
            </div>

            <div className="fin-fld">
              <label className="fin-lab">{cfg.refLabel} <span className="muted" style={{ fontWeight: 400 }}>(ถ้ามี)</span></label>
              <input className="cfg-input mono" value={refNo} onChange={e => setRefNo(e.target.value)} placeholder={cfg.refPlaceholder} />
              <div className="fin-hint"><Icon name="info" size={11} /> ใส่เลขที่{cfg.refTargetName}เพื่อเชื่อมโยงไปยังระบบบัญชี</div>
            </div>

            <div className="fin-fld">
              <label className="fin-lab">หมายเหตุ</label>
              <input className="cfg-input" value={note} onChange={e => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
            </div>

            <button className="btn primary lg block fin-submit" onClick={submit}>
              <Icon name="check" /> {cfg.submitLabel}
            </button>
            <div className="fin-hint" style={{ textAlign: 'center', marginTop: 6 }}>กด Enter ที่ช่องจำนวนเงินเพื่อบันทึกได้ทันที</div>
          </div>
        </div>

        {/* ── ตารางรายการ ── */}
        <div className="fin-list-col">
          <div className="search-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="bud-toolbar">
              <div style={{ fontWeight: 600, fontSize: 13 }}>รายการ{cfg.title}ล่าสุด</div>
              <span className="spacer" />
              <div className="muted" style={{ fontSize: 11.5 }}>
                <Icon name="info" size={12} /> คลิกเลขที่{cfg.refTargetName}เพื่อเปิดดูในระบบบัญชี
              </div>
            </div>
            <div className="table-wrap" style={{ border: 0, borderRadius: 0 }}>
              <table className="tbl fin-tbl" style={{ minWidth: 920 }}>
                <thead>
                  <tr>
                    <th style={{ width: 92 }}>เวลา</th>
                    <th style={{ width: 124 }}>เลขที่</th>
                    <th style={{ minWidth: 200 }}>{cfg.payerLabel}</th>
                    <th style={{ width: 108 }}>ประเภท</th>
                    <th style={{ width: 78 }}>วิธี</th>
                    <th className="right" style={{ width: 116 }}>จำนวนเงิน</th>
                    <th style={{ width: 150 }}>อ้างอิงบัญชี</th>
                    <th className="center" style={{ width: 64 }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 && (
                    <tr><td colSpan={8} className="center muted" style={{ padding: '28px 12px' }}>ยังไม่มีรายการ — เริ่มบันทึกจากฟอร์มด้านซ้าย</td></tr>
                  )}
                  {sorted.map(rec => {
                    const t = cfg.typeOf(rec.type);
                    const cancelled = rec.status === 'cancelled';
                    return (
                      <tr key={rec.id} className={cancelled ? 'fin-row-cancel' : ''}>
                        <td>
                          <div className="fin-time mono">{window.finTime(rec.ts)}</div>
                          <div className="fin-date muted">{window.fmt.date(window.finDateKey(rec.ts))}</div>
                        </td>
                        <td className="mono" style={{ fontSize: 11.5 }}>{rec.id}</td>
                        <td>
                          <div className="fin-payer">{rec.payer}</div>
                          {rec.note && <div className="fin-note muted">{rec.note}</div>}
                        </td>
                        <td><span className={"chip " + t.tone}>{t.short}</span></td>
                        <td className="muted" style={{ fontSize: 12 }}>{window.finMethodLabel(rec.method)}</td>
                        <td className="right mono fin-amt">{window.fmt.money(rec.amount)}</td>
                        <td>
                          {editRef && editRef.id === rec.id ? (
                            <div className="fin-ref-edit">
                              <input className="cfg-input mono" autoFocus value={editRef.val}
                                     onChange={e => setEditRef({ id: rec.id, val: e.target.value })}
                                     onKeyDown={e => { if (e.key === 'Enter') saveRef(rec); if (e.key === 'Escape') setEditRef(null); }}
                                     placeholder={cfg.refPlaceholder} />
                              <button className="btn primary sm" onClick={() => saveRef(rec)}><Icon name="check" size={12} /></button>
                            </div>
                          ) : rec.refNo ? (
                            <button className="fin-ref-chip" onClick={() => gotoRef(rec.refNo)} title={`เปิด${cfg.refTargetName} ${rec.refNo}`}>
                              <Icon name="receipt" size={12} /> {rec.refNo} <Icon name="chevRight" size={11} />
                            </button>
                          ) : (
                            <button className="fin-ref-link" onClick={() => setEditRef({ id: rec.id, val: '' })}>
                              <Icon name="plus" size={11} /> เชื่อมโยง
                            </button>
                          )}
                        </td>
                        <td className="center">
                          {cancelled ? <span className="pill bad">ยกเลิก</span>
                            : <button className="bud-act" title="ยกเลิกรายการ" onClick={() => cancelTxn(rec)}><Icon name="close" size={13} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="lt-list-foot muted" style={{ marginTop: 10 }}>
            <Icon name="info" size={12} /> รายการ{cfg.title}นี้เป็นการบันทึกเงินจริงที่เคาน์เตอร์ — เชื่อมโยงกับ{cfg.refTargetName}ในระบบบัญชีด้วยเลขอ้างอิง (ไม่สร้างเอกสารอัตโนมัติ)
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceReceivePage({ onToast, onNav }) { return <TellerWorkspace mode="receive" onToast={onToast} onNav={onNav} />; }
function FinancePayPage({ onToast, onNav }) { return <TellerWorkspace mode="pay" onToast={onToast} onNav={onNav} />; }

Object.assign(window, { FinanceReceivePage, FinancePayPage });
