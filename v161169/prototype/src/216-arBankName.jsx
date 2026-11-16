// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงินการลงทุน › รับ–จ่ายเงิน — บันทึกเงินจากตัวแทน
//  รับข้อมูลจากระบบการเงิน → ตรวจสอบยอดเงิน → Link บัญชีเงินฝากสมาชิก →
//  กระทบยอดกับธนาคาร → สร้างรายการฝากอัตโนมัติ → รายงานยอดจากตัวแทน
// ════════════════════════════════════════════════════════════════════

const arBankName = (id) => {
  const b = (window.COOP_BANK_ACCOUNTS || []).find(x => x.id === id);
  return b ? `${b.bank} · ${b.accountNo}` : id;
};
const arBankShort = (id) => {
  const b = (window.COOP_BANK_ACCOUNTS || []).find(x => x.id === id);
  return b ? b.bank : id;
};
const arStatusPill = (s) => {
  const st = window.AGENT_REMIT_STATUS[s] || window.AGENT_REMIT_STATUS.imported;
  return <span className={"pill " + st.pill}>{st.l}</span>;
};

// ─── กล่องกระทบยอด 3 ทาง ─────────────────────────────────────────────
function ArReconBox({ rec }) {
  const itemsTotal = window.arItemsTotal(rec.items);
  const declared = rec.declaredAmount || 0;
  const bank = rec.bankAmount;
  const dItems = itemsTotal - declared;
  const dBank = (bank == null) ? null : bank - declared;
  const row = (label, value, diff, note) => (
    <div className="iv-net-row">
      <span>{label}</span>
      <span className="mono" style={diff != null && diff !== 0 ? { color: 'var(--danger)' } : undefined}>
        {value}
        {diff != null && diff !== 0 && <span style={{ fontSize: 11, marginLeft: 6 }}>({diff > 0 ? '+' : ''}{fmt.money(diff, 2)})</span>}
        {note && <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>{note}</span>}
      </span>
    </div>
  );
  return (
    <div className="iv-net-box">
      <div className="iv-net-row strong"><span>ยอดที่ตัวแทนแจ้งโอน</span><span className="mono"><b>{fmt.money(declared, 2)}</b></span></div>
      {row('ผลรวมรายการสมาชิก', fmt.money(itemsTotal, 2), dItems, dItems === 0 ? 'ตรงกับยอดแจ้ง' : 'ไม่ตรง')}
      {row('ยอดเข้าบัญชีธนาคารจริง', bank == null ? '— รอข้อมูลธนาคาร —' : fmt.money(bank, 2), dBank, dBank === 0 ? 'กระทบยอดได้' : (bank == null ? null : 'ส่วนต่าง'))}
    </div>
  );
}

// ─── รายละเอียดชุดโอนจากตัวแทน ───────────────────────────────────────
function AgentRemitDetail({ rec, onBack, onUpdate, onToast }) {
  const itemsTotal = window.arItemsTotal(rec.items);
  const declared = rec.declaredAmount || 0;
  const unlinked = rec.items.filter(it => it.status === 'unlinked').length;
  const itemsMatch = itemsTotal === declared;
  const bankMatch = rec.bankAmount === declared;
  const ITEM_ST = window.AGENT_REMIT_ITEM_STATUS;

  // ── การกระทำตามสถานะ ──
  const verify = () => {
    if (!itemsMatch) { onToast && onToast(`ตรวจสอบยอด: ผลรวมรายการสมาชิกไม่ตรงกับยอดแจ้ง (ส่วนต่าง ${fmt.money(itemsTotal - declared, 2)} บาท)`); return; }
    if (unlinked > 0) { onToast && onToast(`ตรวจสอบยอด: ยังมี ${unlinked} รายการที่ยังไม่ผูกบัญชีเงินฝาก`); return; }
    onUpdate({ ...rec, status: 'pending' });
    onToast && onToast('ตรวจสอบยอดเงินผ่าน — พร้อมกระทบยอดกับธนาคาร');
  };
  const reconcile = () => {
    if (rec.bankAmount == null) { onToast && onToast('ยังไม่มียอดจากธนาคารให้กระทบ'); return; }
    const next = bankMatch ? 'matched' : 'variance';
    onUpdate({ ...rec, status: next });
    onToast && onToast(bankMatch ? 'กระทบยอดกับธนาคารสำเร็จ — ยอดตรงกัน' : `กระทบยอดไม่ผ่าน: ส่วนต่าง ${fmt.money(rec.bankAmount - declared, 2)} บาท`);
  };
  const linkAll = () => {
    const items = rec.items.map(it => it.status === 'unlinked'
      ? { ...it, status: 'linked', acctNo: it.acctNo || ('101-2-' + String(Math.floor(10000 + Math.random() * 89999)) + '-0') }
      : it);
    onUpdate({ ...rec, items });
    onToast && onToast('ผูกบัญชีเงินฝากสมาชิกอัตโนมัติเรียบร้อยแล้ว');
  };
  const postDeposits = () => {
    const items = rec.items.map(it => ({ ...it, status: 'posted' }));
    onUpdate({ ...rec, items, status: 'posted' });
    onToast && onToast(`สร้างรายการฝากอัตโนมัติ ${items.length} รายการ เข้าบัญชีเงินฝากสมาชิกเรียบร้อย`);
  };

  return (
    <div data-screen-label="หน้ารายละเอียดเงินจากตัวแทน">
      <div className="page-actions">
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการเงินจากตัวแทน</button>
        <span className="spacer" />
        <button className="btn sm" onClick={() => onToast && onToast('กำลังพิมพ์รายงานยอดจากตัวแทน ' + rec.id)}><Icon name="print" /> รายงานยอดจากตัวแทน</button>
        <button className="btn sm" onClick={() => onToast && onToast('Export รายการสมาชิก (.xlsx) แล้ว')}><Icon name="download" /> Export</button>
      </div>

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="download" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title">เงินจากตัวแทน <span className="mono">{rec.id}</span> {arStatusPill(rec.status)}</h1>
            <div className="lt-head-meta">
              <span className="mono">{rec.agentCode}</span><span className="dot" />
              <span>{rec.agentName}</span><span className="dot" />
              <span>วันที่โอน {fmt.date(rec.transferDate)}</span><span className="dot" />
              <span>งวด {rec.period}</span>
            </div>
          </div>
          <span className={"chip " + (rec.source === 'finance-system' ? 'info' : 'neutral')}>
            <span className="dot-c" />{rec.source === 'finance-system' ? 'รับจากระบบการเงิน' : 'บันทึกด้วยมือ'}
          </span>
        </div>
      </div>

      {/* ── ขั้นตอนการทำงาน (stepper) ── */}
      <ArStepper status={rec.status} />

      <div className="summary-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <IvStat label="ยอดที่ตัวแทนแจ้งโอน" value={'฿ ' + fmt.money(declared, 2)} sub={rec.items.length + ' รายการสมาชิก'} accent />
        <IvStat label="ธนาคารที่โอนเข้า" value={arBankShort(rec.bankId)} sub={'อ้างอิง ' + rec.ref} />
        <IvStat label="บัญชีเงินฝากปลายทาง" value={rec.destDepType} sub={unlinked > 0 ? unlinked + ' รายการยังไม่ผูกบัญชี' : 'ผูกบัญชีครบทุกรายการ'}
                tone={unlinked > 0 ? 'warning' : 'success'} />
        <IvStat label="สถานะการกระทบยอด" value={window.AGENT_REMIT_STATUS[rec.status].l}
                tone={rec.status === 'variance' ? 'danger' : (rec.status === 'matched' || rec.status === 'posted') ? 'success' : 'warning'} />
      </div>

      <div className="ar-detail-grid">
        {/* รายการสมาชิกที่เกี่ยวข้อง */}
        <IvSection icon="members" title="รายการสมาชิกที่เกี่ยวข้อง" count={rec.items.length + ' ราย'}
          right={unlinked > 0 && rec.status !== 'posted'
            ? <button className="btn accent sm" onClick={linkAll}><Icon name="attach" size={13} /> Link บัญชีอัตโนมัติ ({unlinked})</button>
            : null}>
          <div className="table-wrap" style={{ marginTop: 4 }}>
            <table className="tbl" style={{ minWidth: 620 }}>
              <thead><tr>
                <th>สมาชิก</th><th>ประเภทบัญชี</th><th className="mono">บัญชีเงินฝากปลายทาง</th>
                <th className="right">จำนวนเงิน</th><th className="center">สถานะ</th>
              </tr></thead>
              <tbody>
                {rec.items.map((it, i) => {
                  const ist = ITEM_ST[it.status] || ITEM_ST.linked;
                  return (
                    <tr key={i}>
                      <td><div className="lt-row-name">{it.name}</div><div className="lt-row-note muted mono">{it.memberCode}</div></td>
                      <td style={{ fontSize: 12 }}>{it.depType}</td>
                      <td className="mono">{it.acctNo
                        ? it.acctNo
                        : <span style={{ color: 'var(--danger)' }}>— ยังไม่ผูกบัญชี —</span>}</td>
                      <td className="right mono">{fmt.money(it.amount, 2)}</td>
                      <td className="center"><span className={"pill " + ist.pill}>{ist.l}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr>
                <td colSpan="3" className="right">รวมรายการสมาชิก</td>
                <td className="right mono"><b>{fmt.money(itemsTotal, 2)}</b></td><td />
              </tr></tfoot>
            </table>
          </div>
        </IvSection>

        {/* การกระทบยอดและการดำเนินการ */}
        <div className="ar-side">
          <IvSection icon="shield" title="ตรวจสอบยอด & กระทบยอดธนาคาร">
            <ArReconBox rec={rec} />
            <div className="ar-check-list">
              <ArCheck ok={itemsMatch} label="ผลรวมรายการสมาชิกตรงกับยอดที่แจ้ง" />
              <ArCheck ok={unlinked === 0} label="ผูกบัญชีเงินฝากสมาชิกครบทุกราย" />
              <ArCheck ok={rec.bankAmount != null && bankMatch} label="ยอดตรงกับรายการเดินบัญชีธนาคาร"
                       warn={rec.bankAmount != null && !bankMatch} />
            </div>
          </IvSection>

          <div className="search-card" style={{ marginTop: 12 }}>
            <div className="section-head" style={{ marginBottom: 10 }}><span className="head-bar" /><h3>ดำเนินการ</h3></div>
            <div className="ar-action-col">
              <button className="btn" disabled={rec.status !== 'imported'} onClick={verify}>
                <Icon name="check" /> ตรวจสอบยอดเงิน
              </button>
              <button className="btn" disabled={!(rec.status === 'pending' || rec.status === 'variance')} onClick={reconcile}>
                <Icon name="refresh" /> กระทบยอดกับธนาคาร
              </button>
              <button className="btn primary" disabled={rec.status !== 'matched'} onClick={postDeposits}>
                <Icon name="wallet" /> สร้างรายการฝากอัตโนมัติ
              </button>
            </div>
            {rec.status === 'variance' && (
              <div className="ar-note bad">
                <Icon name="info" size={13} /> ยอดเข้าบัญชีธนาคารไม่ตรงกับยอดที่ตัวแทนแจ้ง
                ส่วนต่าง <b className="mono">{fmt.money(rec.bankAmount - declared, 2)}</b> บาท — ตรวจสอบกับตัวแทนก่อนสร้างรายการฝาก
              </div>
            )}
            {rec.status === 'posted' && (
              <div className="ar-note ok">
                <Icon name="check" size={13} /> สร้างรายการฝากเข้าบัญชีเงินฝากสมาชิกครบ {rec.items.length} รายการแล้ว
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ป้าย check / cross ──────────────────────────────────────────────
function ArCheck({ ok, warn, label }) {
  const cls = ok ? 'ok' : warn ? 'warn' : 'pending';
  return (
    <div className={"ar-check " + cls}>
      <span className="ar-check-ico"><Icon name={ok ? 'check' : warn ? 'close' : 'history'} size={12} /></span>
      <span>{label}</span>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────
function ArStepper({ status }) {
  const cur = (window.AGENT_REMIT_STATUS[status] || {}).step || 1;
  const steps = ['รับข้อมูล', 'ตรวจ/กระทบยอด', 'กระทบยอดแล้ว', 'สร้างรายการฝาก'];
  const isVar = status === 'variance';
  return (
    <div className="ar-stepper">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < cur, active = n === cur;
        return (
          <React.Fragment key={i}>
            <div className={"ar-step" + (done ? ' done' : '') + (active ? ' active' : '') + (active && isVar ? ' var' : '')}>
              <span className="ar-step-dot">{done ? <Icon name="check" size={12} /> : n}</span>
              <span className="ar-step-label">{s}</span>
            </div>
            {i < steps.length - 1 && <span className={"ar-step-line" + (n < cur ? ' done' : '')} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── โมดัล: รับข้อมูลจากระบบการเงิน ──────────────────────────────────
function ArImportInboxModal({ onClose, onImport }) {
  const inbox = window.AGENT_REMIT_INBOX_SEED || [];
  const [picked, setPicked] = useState(() => new Set(inbox.map(x => x.ref)));
  const toggle = (ref) => setPicked(s => { const n = new Set(s); n.has(ref) ? n.delete(ref) : n.add(ref); return n; });
  const sel = inbox.filter(x => picked.has(x.ref));
  const total = sel.reduce((a, x) => a + x.amount, 0);

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 760, maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="refresh" /></div>
          <div style={{ minWidth: 0 }}><h2>รับข้อมูลจากระบบการเงิน</h2>
            <div className="muted" style={{ fontSize: 11 }}>รายการโอนจากตัวแทนที่ระบบการเงินส่งเข้าคิว — เลือกเพื่อบันทึกเข้าระบบ</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {inbox.length === 0 && <div className="center muted" style={{ padding: 32 }}>— ไม่มีรายการรอรับจากระบบการเงิน —</div>}
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 680 }}>
              <thead><tr>
                <th style={{ width: 36 }} /><th>ตัวแทน</th><th>วันที่โอน</th><th>ธนาคาร</th>
                <th className="mono">เลขอ้างอิง</th><th className="center">รายการ</th><th className="right">จำนวนเงิน</th>
              </tr></thead>
              <tbody>
                {inbox.map(x => (
                  <tr key={x.ref} className={picked.has(x.ref) ? 'selected' : ''} style={{ cursor: 'pointer' }} onClick={() => toggle(x.ref)}>
                    <td className="center"><input type="checkbox" className="ct-check" checked={picked.has(x.ref)} readOnly /></td>
                    <td><div className="lt-row-name">{x.agentName}</div><div className="lt-row-note muted mono">{x.agentCode}</div></td>
                    <td className="mono" style={{ fontSize: 11 }}>{fmt.date(x.transferDate)}</td>
                    <td style={{ fontSize: 12 }}>{arBankShort(x.bankId)}</td>
                    <td className="mono" style={{ fontSize: 11 }}>{x.ref}</td>
                    <td className="center mono">{x.count}</td>
                    <td className="right mono">{fmt.money(x.amount, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="iv-net-box" style={{ marginTop: 12 }}>
            <div className="iv-net-row"><span>เลือกรับเข้าระบบ</span><span className="mono">{sel.length} ชุดโอน</span></div>
            <div className="iv-net-row strong" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6 }}><span>ยอดรวม</span><span className="mono"><b>{fmt.money(total, 2)}</b></span></div>
          </div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={sel.length === 0} onClick={() => onImport(sel)}>
            <Icon name="download" /> รับเข้าระบบ {sel.length} ชุด
          </button>
        </div>
      </div>
    </>
  );
}

// ─── โมดัล: บันทึกเงินจากตัวแทน (ด้วยมือ) ────────────────────────────
function ArCreateModal({ onClose, onCreate }) {
  const AGENTS = window.AGENT_REMIT_AGENTS;
  const [agentCode, setAgentCode] = useState(AGENTS[0].code);
  const [transferDate, setTransferDate] = useState(ivToday());
  const [bankId, setBankId] = useState(window.COOP_BANK_ACCOUNTS[0].id);
  const [ref, setRef] = useState('');
  const [destDepType, setDestDepType] = useState(window.AGENT_REMIT_DEP_TYPES[0]);
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [items, setItems] = useState([
    { memberCode: '', name: '', acctNo: '', amount: '' },
  ]);
  const agent = AGENTS.find(a => a.code === agentCode);

  const setItem = (i, patch) => setItems(arr => arr.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const addRow = () => setItems(arr => [...arr, { memberCode: '', name: '', acctNo: '', amount: '' }]);
  const delRow = (i) => setItems(arr => arr.filter((_, idx) => idx !== i));
  const itemsTotal = items.reduce((a, it) => a + (parseFloat(it.amount) || 0), 0);
  const declared = parseFloat(declaredAmount) || 0;
  const filled = items.filter(it => it.name.trim() && (parseFloat(it.amount) || 0) > 0);
  const match = declared > 0 && Math.abs(itemsTotal - declared) < 0.005;
  const canSave = agentCode && ref.trim() && declared > 0 && filled.length > 0;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" style={{ width: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}><h2>บันทึกเงินจากตัวแทน</h2>
            <div className="muted" style={{ fontSize: 11 }}>บันทึกยอดที่ตัวแทนรวบรวมจากสมาชิกและโอนเข้าสหกรณ์</div></div>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          <div className="iv-form-grid c3">
            <IvField label="รหัส / ชื่อตัวแทน" required>
              <select className="cfg-input" value={agentCode} onChange={(e) => setAgentCode(e.target.value)}>
                {AGENTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </IvField>
            <IvField label="วันที่โอน" required>
              <ErpDate value={transferDate} onChange={(v) => ((e) => setTransferDate(e.target.value))({ target: { value: v } })} className="cfg-input" />
            </IvField>
            <IvField label="เลขอ้างอิงการโอน" required hint="เลขอ้างอิงจากสลิป/รายการเดินบัญชีธนาคาร">
              <input className="cfg-input mono" value={ref} placeholder="เช่น KTB-IPAY-0614-xxxxx" onChange={(e) => setRef(e.target.value)} />
            </IvField>
            <IvField label="ธนาคารที่โอนเข้า" required>
              <select className="cfg-input" value={bankId} onChange={(e) => setBankId(e.target.value)}>
                {window.COOP_BANK_ACCOUNTS.map(b => <option key={b.id} value={b.id}>{b.bank} · {b.accountNo}</option>)}
              </select>
            </IvField>
            <IvField label="บัญชีเงินฝากปลายทาง" required>
              <select className="cfg-input" value={destDepType} onChange={(e) => setDestDepType(e.target.value)}>
                {window.AGENT_REMIT_DEP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </IvField>
            <IvField label="จำนวนเงินที่ตัวแทนแจ้งโอน" required>
              <IvMoneyInput value={declaredAmount} onChange={setDeclaredAmount} />
            </IvField>
          </div>

          <div className="toolbar" style={{ margin: '14px 0 6px' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>รายการสมาชิกที่เกี่ยวข้อง</span>
            <span className="gc-count">{filled.length} ราย</span>
            <span className="spacer" />
            <button className="btn ghost sm" onClick={addRow}><Icon name="plus" size={13} /> เพิ่มรายการ</button>
          </div>
          <div className="table-wrap">
            <table className="tbl" style={{ minWidth: 700 }}>
              <thead><tr>
                <th style={{ width: 130 }}>รหัสสมาชิก</th><th>ชื่อสมาชิก</th>
                <th style={{ width: 160 }}>บัญชีเงินฝากปลายทาง</th><th className="right" style={{ width: 130 }}>จำนวนเงิน</th><th style={{ width: 36 }} />
              </tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td><input className="cfg-input mono" style={{ height: 28 }} value={it.memberCode} placeholder="M-xxxxxx" onChange={(e) => setItem(i, { memberCode: e.target.value })} /></td>
                    <td><input className="cfg-input" style={{ height: 28 }} value={it.name} placeholder="ชื่อ–สกุล" onChange={(e) => setItem(i, { name: e.target.value })} /></td>
                    <td><input className="cfg-input mono" style={{ height: 28 }} value={it.acctNo} placeholder="เลขบัญชี (เว้นว่าง = ผูกภายหลัง)" onChange={(e) => setItem(i, { acctNo: e.target.value })} /></td>
                    <td><input className="cfg-input mono" style={{ height: 28, textAlign: 'right' }} type="number" value={it.amount} placeholder="0.00" onChange={(e) => setItem(i, { amount: e.target.value })} /></td>
                    <td className="center">{items.length > 1 && <button className="iv-doc-x" onClick={() => delRow(i)} title="ลบ"><Icon name="close" size={12} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="iv-net-box" style={{ marginTop: 12 }}>
            <div className="iv-net-row"><span>ผลรวมรายการสมาชิก</span><span className="mono">{fmt.money(itemsTotal, 2)}</span></div>
            <div className="iv-net-row"><span>ยอดที่ตัวแทนแจ้งโอน</span><span className="mono">{fmt.money(declared, 2)}</span></div>
            <div className="iv-net-row strong" style={{ borderTop: '1px solid var(--divider)', paddingTop: 6 }}>
              <span>ผลตรวจสอบยอด</span>
              <span className="mono" style={{ color: match ? 'var(--success)' : 'var(--danger)' }}>
                {declared <= 0 ? '—' : match ? 'ยอดตรงกัน' : `ส่วนต่าง ${fmt.money(itemsTotal - declared, 2)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="bp-save-bar" style={{ borderTop: '1px solid var(--divider)' }}>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!canSave} onClick={() => onCreate({
            agentCode, agentName: agent.name, transferDate, bankId, ref: ref.trim(), destDepType,
            declaredAmount: declared, bankAmount: null, period: '2569/06', source: 'manual',
            items: filled.map(it => ({
              memberCode: it.memberCode.trim() || '—', name: it.name.trim(),
              acctNo: it.acctNo.trim(), depType: destDepType, amount: parseFloat(it.amount) || 0,
              status: it.acctNo.trim() ? 'linked' : 'unlinked',
            })),
          })}>
            <Icon name="check" /> บันทึกเงินจากตัวแทน
          </button>
        </div>
      </div>
    </>
  );
}

// ─── หน้าหลัก: รายการเงินจากตัวแทน ───────────────────────────────────
function AgentRemitPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(window.agentRemitLoad);
  const [openId, setOpenId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fAgent, setFAgent] = useState('');
  const [fStatus, setFStatus] = useState('');

  const persist = (next) => { setList(next); window.agentRemitSave(next); };
  const openRec = list.find(r => r.id === openId);

  const nextId = () => {
    const max = list.reduce((m, r) => Math.max(m, parseInt(String(r.id).slice(-4), 10) || 0), 42);
    return 'AR-2569-' + String(max + 1).padStart(4, '0');
  };

  const updateRec = (rec) => {
    persist(list.map(r => r.id === rec.id ? rec : r));
    audit.log({ action: 'update', module: 'การเงินการลงทุน — เงินจากตัวแทน',
      target: rec.id, summary: `อัปเดตสถานะเป็น "${window.AGENT_REMIT_STATUS[rec.status].l}"` });
  };

  const [askDel, setAskDel] = React.useState(null);
  const canDelete = (r) => ['imported', 'pending', 'variance'].includes(r.status) && r.source !== 'finance-system';
  const doDelete = (r) => {
    setAskDel(null);
    persist(list.filter(x => x.id !== r.id));
    audit.log({ action: 'delete', module: 'การเงินการลงทุน — เงินจากตัวแทน', target: r.id,
      summary: 'ลบชุดโอนจากตัวแทน ' + r.agentName + ' ยอด ' + fmt.money(r.declaredAmount, 2) + ' บาท' });
    if (window.depSuccess) window.depSuccess({ title: 'ลบรายการเรียบร้อยแล้ว', desc: 'เลขที่ ' + r.id, lines: [['ตัวแทน', r.agentName], ['ยอดที่แจ้งโอน', fmt.money(r.declaredAmount, 2) + ' บาท']] });
    else onToast && onToast('ลบรายการ ' + r.id + ' เรียบร้อยแล้ว');
  };

  const handleImport = (rows) => {
    let n = list.reduce((m, r) => Math.max(m, parseInt(String(r.id).slice(-4), 10) || 0), 42);
    const recs = rows.map(x => {
      n += 1;
      return {
        id: 'AR-2569-' + String(n).padStart(4, '0'),
        agentCode: x.agentCode, agentName: x.agentName, transferDate: x.transferDate,
        period: x.period, source: 'finance-system', declaredAmount: x.amount, bankAmount: x.amount,
        bankId: x.bankId, ref: x.ref, destDepType: 'ออมทรัพย์', status: 'imported',
        createdBy: 'ระบบการเงิน (อัตโนมัติ)', items: x.items.map(it => ({ ...it })),
      };
    });
    persist([...recs, ...list]);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — เงินจากตัวแทน',
      target: recs.map(r => r.id).join(', '), summary: `รับข้อมูลจากระบบการเงิน ${recs.length} ชุดโอน` });
    setImporting(false);
    onToast && onToast(`รับข้อมูลจากระบบการเงิน ${recs.length} ชุดโอนเรียบร้อย`);
  };

  const handleCreate = (data) => {
    const rec = { id: nextId(), ...data, createdBy: IV_USER, status: 'imported' };
    persist([rec, ...list]);
    audit.log({ action: 'create', module: 'การเงินการลงทุน — เงินจากตัวแทน',
      target: rec.id, summary: `บันทึกเงินจากตัวแทน ${rec.agentName} ยอด ${fmt.money(rec.declaredAmount, 0)} บาท`,
      changes: [{ field: 'ยอดที่แจ้งโอน', before: '—', after: fmt.money(rec.declaredAmount, 0) }] });
    setCreating(false); setOpenId(rec.id);
    onToast && onToast(`บันทึกเงินจากตัวแทน ${rec.id} เรียบร้อย`);
  };

  if (openRec) return <AgentRemitDetail rec={openRec} onBack={() => setOpenId(null)} onUpdate={updateRec} onToast={onToast} />;

  const filtered = list.filter(r =>
    (!fAgent || r.agentCode === fAgent) && (!fStatus || r.status === fStatus));
  const grandTotal = list.reduce((a, r) => a + (r.declaredAmount || 0), 0);
  const pendingCount = list.filter(r => r.status === 'imported' || r.status === 'pending').length;
  const varianceCount = list.filter(r => r.status === 'variance').length;
  const postedCount = list.filter(r => r.status === 'posted').length;

  return (
    <div data-screen-label="หน้าบันทึกเงินจากตัวแทน">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกเงินจากตัวแทน</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            รับยอดที่ตัวแทนรวบรวมจากสมาชิก ตรวจสอบยอด กระทบยอดกับธนาคาร และสร้างรายการฝากเข้าบัญชีเงินฝากสมาชิกอัตโนมัติ
          </div>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn sm" data-keep-top="" onClick={() => setImporting(true)}><Icon name="refresh" /> รับข้อมูลจากระบบการเงิน</button>
        <button className="btn primary sm" data-keep-top="" onClick={() => setCreating(true)}><Icon name="plus" /> บันทึกเงินจากตัวแทน</button>
      </div>

      <div className="search-card dat-section" style={{ marginTop: 0 }}>
        <div className="dmd-filter" style={{ paddingTop: 16 }}>
          <div className="dmd-fields">
            <DatFieldLite label="ตัวแทน">
              <select className="cfg-input" value={fAgent} onChange={(e) => setFAgent(e.target.value)}>
                <option value="">ตัวแทนทั้งหมด</option>
                {window.AGENT_REMIT_AGENTS.map(a => <option key={a.code} value={a.code}>{a.code} · {a.name}</option>)}
              </select>
            </DatFieldLite>
            <DatFieldLite label="สถานะกระทบยอด">
              <select className="cfg-input" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
                <option value="">ทุกสถานะ</option>
                {Object.keys(window.AGENT_REMIT_STATUS).map(k => <option key={k} value={k}>{window.AGENT_REMIT_STATUS[k].l}</option>)}
              </select>
            </DatFieldLite>
          </div>
        </div>
      </div>

      <div className="summary-row dmd-kpis" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
        <IvStat label="ยอดรับจากตัวแทนทั้งหมด" value={fmt.money(grandTotal, 2)} sub={list.length + ' ชุดโอน · บาท'} accent />
        <IvStat label="รอตรวจ / กระทบยอด" value={pendingCount + ' ชุด'} tone="warning" />
        <IvStat label="ยอดไม่ตรง" value={varianceCount + ' ชุด'} tone={varianceCount ? 'danger' : undefined} />
        <IvStat label="สร้างรายการฝากแล้ว" value={postedCount + ' ชุด'} tone="success" />
      </div>

      <div className="search-card dat-section" style={{ marginTop: 12 }}>
        <DepSecHead bar title="รายการเงินจากตัวแทน" />
        <div className="table-wrap" style={{ margin: '12px 16px 16px' }}><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead><tr>
              <th style={{ width: 120 }}>เลขที่</th>
              <th style={{ minWidth: 200 }}>ตัวแทน</th>
              <th className="center" style={{ width: 95 }}>วันที่โอน</th>
              <th style={{ width: 110 }}>ธนาคาร</th>
              <th className="mono" style={{ width: 150 }}>เลขอ้างอิง</th>
              <th className="center" style={{ width: 70 }}>สมาชิก</th>
              <th className="right" style={{ width: 130 }}>ยอดที่แจ้งโอน</th>
              <th className="center" style={{ width: 130 }}>สถานะกระทบยอด</th>
              <th className="center" style={{ width: 150 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan="9" className="center muted" style={{ padding: 28 }}>ไม่พบข้อมูล</td></tr>}
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td><div className="lt-row-name">{r.agentName}</div><div className="lt-row-note muted mono">{r.agentCode}</div></td>
                  <td className="center mono" style={{ fontSize: 11 }}>{fmt.date(r.transferDate)}</td>
                  <td style={{ fontSize: 12 }}>{arBankShort(r.bankId)}</td>
                  <td className="mono" style={{ fontSize: 11 }}>{r.ref}</td>
                  <td className="center mono">{r.items.length}</td>
                  <td className="right mono"><b>{fmt.money(r.declaredAmount, 2)}</b></td>
                  <td className="center">{arStatusPill(r.status)}</td>
                  <td className="center">
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn sm" onClick={() => setOpenId(r.id)}><Icon name="eye" size={12} /> ดู</button>
                      <button className="btn sm tt-del-btn" disabled={!canDelete(r)}
                              title={canDelete(r) ? 'ลบรายการ' : (r.source === 'finance-system' ? 'รายการจากระบบการเงิน — ลบไม่ได้' : 'กระทบยอดแล้ว — ลบไม่ได้')}
                              onClick={() => setAskDel(r)}><Icon name="trash" size={12} /> ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      </div>

      {askDel && window.DepConfirmModal && (
        <window.DepConfirmModal tone="danger" title="ยืนยันการลบรายการเงินจากตัวแทน"
          lines={[['เลขที่', askDel.id], ['ตัวแทน', askDel.agentName], ['สมาชิก', askDel.items.length + ' ราย'], ['ยอดที่แจ้งโอน', fmt.money(askDel.declaredAmount, 2) + ' บาท']]}
          okLabel="ลบรายการ" onOk={() => doDelete(askDel)} onClose={() => setAskDel(null)} />
      )}

      {importing && <ArImportInboxModal onClose={() => setImporting(false)} onImport={handleImport} />}
      {creating && <ArCreateModal onClose={() => setCreating(false)} onCreate={handleCreate} />}
    </div>
  );
}

Object.assign(window, { AgentRemitPage });
