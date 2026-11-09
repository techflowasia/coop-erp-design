// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › ข้อมูลพื้นฐาน — ค่าคงที่ประเภทบัญชีเงินฝาก
//  รายการประเภทบัญชี ⇄ รายละเอียด 6 แท็บ (ข้อมูลหลัก · ข้อกำหนด/ปรับ ·
//  จ่าย Int./Div./รักษาบัญชี · การคิด Int./Div. · อัตรา Int./Div. · ถอนก่อนกำหนด)
//  แก้ไขย้อนหลังได้ + เก็บประวัติทุกครั้ง (สอดคล้องหน้าค่าคงที่ประเภทเงินกู้)
//  หมายเหตุ: กลุ่มค่าเดิม (cond/interest/withdraw/passbook/gl/control) คงไว้
//  เพื่อความเข้ากันได้กับหน้าจอฝาก-ถอน-ปิดบัญชี-ค่าธรรมเนียม
// ════════════════════════════════════════════════════════════════════

let _datUidSeq = 0;
const datUid = () => 'DAT-N' + (++_datUidSeq);
const datToday = () => new Date().toISOString().slice(0, 10);
const datNow = () => new Date().toISOString().slice(0, 19);
const DAT_USER = 'จันทร์เพ็ญ มาลี';

function datLoad() {
  try {
    const s = localStorage.getItem('dep_acctypes_v2');
    if (s) {
      // ย้ายค่าเดิม DEP-CONST-xx → รหัสคุมเลขที่บัญชี
      const MAP = { 'DEP-CONST-S01': 'DPACCDOCNO10', 'DEP-CONST-S02': 'DPACCDOCNO11', 'DEP-CONST-F12': 'DPACCDOCNO12' };
      return JSON.parse(s).map(r => {
        if (!r || !r.settings) return r;
        let st = r.settings;
        if (/^DEP-CONST-/.test(st.docNo || '')) st = { ...st, docNo: MAP[st.docNo] || '' };
        // ค่าตั้งต้นการรักษาบัญชี — เติมเฉพาะช่องที่ยังว่าง/เป็น 0
        if (!Number(st.maintFeeAmount)) st = { ...st, maintFeeAmount: 100 };
        if (!Number(st.maintInactiveDur)) st = { ...st, maintInactiveDur: 2, maintUnit: 'year' };
        if (!st.maintFeeOn && Number(st.maintFeeDay) === 1) st = { ...st, maintFeeDay: 'eom' };
        return st === r.settings ? r : { ...r, settings: st };
      });
    }
  } catch (e) {}
  return window.DEP_ACCTYPE_SEED.map(r => window.datBuildRecord(JSON.parse(JSON.stringify(r))));
}
window.datLoad = datLoad;
function datSaveLS(list) { try { localStorage.setItem('dep_acctypes_v2', JSON.stringify(list)); } catch (e) {} }

// อัตราที่ใช้อยู่ (วันที่มีผลล่าสุด) จากตารางอัตรา
function datCurrentRate(rec) {
  const rows = rec.rateTiers || [];
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => (b.effectiveDate || '').localeCompare(a.effectiveDate || '') || (Number(b.seq) - Number(a.seq)));
  return sorted[0];
}

// ─── ป้ายชื่อฟิลด์ + diff สำหรับประวัติการแก้ไข ──────────────────────
const DAT_FIELD_LABELS = {
  personType: 'ประเภทบุคคล', depGroup: 'กลุ่มเงินฝาก', docNo: 'รหัสคุมเลขที่บัญชี', abbr: 'ตัวย่อ',
  glCode: 'รหัสบัญชี GL', glPair: 'รหัสคู่บัญชี', accGroupACC: 'กลุ่มลง ACC', accountOpenRule: 'จำนวนบัญชีที่เปิดได้',
  minOnlineBalance: 'คงเหลือขั้นต่ำถอน Online', passbookProjectName: 'ชื่อโครงการพิมพ์สมุด', passbookHold: 'การถือสมุดคู่ฝาก',
  openCond: 'เงื่อนไขเปิดบัญชี', minOpen: 'เปิดบัญชีขั้นต่ำ', minDeposit: 'ฝากขั้นต่ำ', minWithdraw: 'ถอนขั้นต่ำ',
  minBalance: 'คงเหลือขั้นต่ำ', maxBalanceOn: 'จำกัดยอดสูงสุด', maxBalance: 'สูงสุดไม่เกิน', chkPB: 'ตรวจสอบสมุด (chkPB)',
  limitAccounts: 'จำกัดจำนวนบัญชี', maxAccounts: 'เปิดได้ (บัญชี)',
  wdCountLimit: 'จำกัดครั้งถอน', wdCountMax: 'ถอนไม่เกิน (ครั้ง)', closeAfterN: 'ถอน/ปิดบัญชีได้เมื่อเปิดบัญชีแล้ว (วัน)',
  lostBookPenaltyOn: 'ค่าปรับสมุดหาย', lostBookFee: 'ค่าปรับสมุดหาย (บาท)',
  overWdPenaltyOn: 'ค่าปรับถอนเกินครั้ง', overWdFee: 'ค่าปรับถอนเกิน (บาท)', overWdPercent: '% ค่าปรับถอนเกิน',
  hasTerm: 'มีอายุระยะเวลาฝาก', termMonths: 'ระยะเวลาฝาก (เดือน)', whtOn: 'ภาษี ณ ที่จ่าย', taxRateMode: 'อัตราภาษี',
  earlyCloseePenaltyOn: 'ค่าปรับถอนก่อนกำหนด', earlyClosePercent: '% ค่าปรับถอนก่อน',
  intGiveOn: 'ให้ Int./Div.', intGiveRef: 'ดู Int./Div. ที่', compoundWhen: 'การทบ Int./Div.', intCalcMethod: 'วิธีคิด Int./Div.',
  maintFeeOn: 'ค่ารักษาบัญชี', maintFeeAmount: 'ค่ารักษาบัญชี (บาท)',
  minIntGeneral: 'ขั้นต่ำคิด (ทั่วไป)', intReceiveMode: 'การรับ INT', earlyPayMode: 'จ่าย Int./Div. (ถอนก่อน)',
  intCalcFrom: 'คิด Int./Div. จาก', earlyIntCalc: 'การคิดดอกเบี้ยถอนก่อน', accrueOn: 'ตั้งดอกเบี้ยค้าง',
  exhaustAction: 'เมื่อหมดต้น', recallMode: 'การเรียกคืน ด/บ', periodicSend: 'ส่งแบบรายงวด', periodicAmtMode: 'จำนวนเงินส่ง', periodicMissMax: 'จำนวนงวดผิดนัด', periodicLateMax: 'จำนวนงวดส่งล่าช้า',
};
const DAT_TABLE_LABELS = { rateTiers: 'อัตรา Int./Div.', earlyWithdraw: 'ถอนก่อนกำหนด', dividendDates: 'วันที่จ่าย Int./Div.' };
function datFmtVal(k, v) {
  if (v === true) return 'เปิด'; if (v === false) return 'ปิด';
  if (v === '' || v == null) return '—';
  if (['depGroup', 'personType', 'accGroupACC', 'accountOpenRule', 'passbookHold', 'openCond',
       'taxRateMode', 'intGiveRef', 'compoundWhen', 'intCalcMethod', 'intReceiveMode', 'earlyPayMode',
       'intCalcFrom', 'earlyIntCalc', 'exhaustAction', 'recallMode', 'principalDateMode', 'accrueMethod', 'periodicAmtMode', 'backdateUnit'].includes(k))
    return window.datLabel(k, v);
  if (k === 'maintFeeDay') return v === 'eom' ? 'สิ้นเดือน' : 'วันที่ ' + v;
  if (k === 'intCalcBalanceBase') return window.datLabel('intCalcBase', v);
  if (k === 'periodicSend') return window.datLabel('periodicSendMode', v === true ? 'period' : v === false ? 'none' : v);
  return String(v);
}
function datDiff(before, after) {
  const changes = [];
  ['code', 'name', 'note'].forEach(k => {
    if (before[k] !== after[k]) changes.push({ field: k === 'code' ? 'รหัส' : k === 'name' ? 'ชื่อประเภทบัญชี' : 'หมายเหตุ', before: before[k] || '—', after: after[k] || '—' });
  });
  const bs = before.settings || {}, as = after.settings || {};
  Object.keys(as).forEach(k => {
    if (bs[k] !== as[k] && DAT_FIELD_LABELS[k]) changes.push({ field: DAT_FIELD_LABELS[k], before: datFmtVal(k, bs[k]), after: datFmtVal(k, as[k]) });
  });
  Object.keys(DAT_TABLE_LABELS).forEach(k => {
    const b = (before[k] || []).length, a = (after[k] || []).length;
    if (b !== a) changes.push({ field: 'ตาราง: ' + DAT_TABLE_LABELS[k], before: b + ' แถว', after: a + ' แถว' });
  });
  return changes;
}

// ════════════════════════════════════════════════════════════════════
//  History modal
// ════════════════════════════════════════════════════════════════════
function DatHistoryModal({ record, onClose, title }) {
  const hist = record.history || [];
  const meta = (a) => a === 'create'
    ? { label: 'สร้างประเภทบัญชี', color: 'var(--success)', icon: 'plus' }
    : a === 'toggle' ? { label: 'เปิด/ปิดการใช้งาน', color: 'var(--warning)', icon: 'refresh' }
    : { label: 'แก้ไขข้อมูล', color: 'var(--primary)', icon: 'edit' };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 620, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>{title || 'ประวัติการเพิ่ม/แก้ไขประเภทบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{record.code} · {record.name} — บันทึกทุกการเปลี่ยนแปลงเพื่อการตรวจสอบย้อนหลัง</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflow: 'auto' }}>
          {hist.length === 0 && <div className="muted" style={{ padding: 20, textAlign: 'center' }}>ยังไม่มีประวัติ</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hist.map((h, i) => {
              const m = meta(h.action);
              return (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 2px', borderBottom: i < hist.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'color-mix(in srgb, ' + m.color + ' 14%, transparent)', color: m.color, display: 'grid', placeItems: 'center' }}>
                      <Icon name={m.icon} size={14} />
                    </div>
                    {i < hist.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--divider)', marginTop: 2 }} />}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.label}</span>
                      {h.effective && <span className="pill neutral" title="มีผลตั้งแต่">มีผล {fmt.date(h.effective)}</span>}
                      <span className="muted" style={{ fontSize: 11, marginLeft: 'auto' }}>{fmt.date(h.ts.slice(0, 10))} · {h.ts.slice(11, 16)} น.</span>
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
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Detail — header (master facts เสมอ) + 6 แท็บ
// ════════════════════════════════════════════════════════════════════
const DAT_TABS = [
  { id: 'master', label: 'ข้อมูลหลัก' },
  { id: 'cond',   label: 'ข้อกำหนดและการปรับ' },
  { id: 'payint', label: 'จ่าย Int./Div. / ค่ารักษาบัญชี' },
  { id: 'calc',   label: 'การคิด Int./Div.' },
  { id: 'rate',   label: 'อัตรา Int./Div.' },
  { id: 'early',  label: 'ถอนก่อนกำหนด' },
  { id: 'fees',   label: 'ค่าธรรมเนียมและค่าปรับ' },
];

// ─── แท็บค่าธรรมเนียมและค่าปรับ (ย้ายมาจากเมนูเดิม) ──────────────
//  กฎที่แสดง = กฎเสพาะของประเภทบัญชีนี้ + กฎกลาง (ทุกประเภท)
//  ค่าเริ่มต้นดึงจากการตั้งค่าประเภทบัญชี (แท็บข้อกำหนดและการปรับ)
function DatTabFees({ record, editing, onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [rules, setRules] = useState(() => (window.feeLoad ? window.feeLoad() : []));
  const [editRec, setEditRec] = useState(null);
  const s = record.settings || {};

  const persist = (next) => { setRules(next); if (window.feeSaveLS) window.feeSaveLS(next); };
  const mine    = rules.filter(r => r.acctType === record.name);
  const shared  = rules.filter(r => r.acctType === 'ทุกประเภท');
  const FT = window.DEP_FEE_TYPES || {};
  const feeText = (r) => r.feeType === 'rate_diff' ? 'ส่วนต่างดบ.'
    : r.feeType === 'percent' ? fmt.money(r.fee, 2) + '%' : fmt.money(r.fee, 2) + ' ฿';

  // ค่าเริ่มต้นของกฎใหม่ — สืบจากการตั้งค่าประเภทบัญชีนี้
  const blank = (txnType) => ({
    acctType: record.name, txnType: txnType || '',
    freeCount: Number(s.wdCountMax) || 0,
    fee: txnType === 'ถอนเกินจำนวนครั้ง' ? (Number(s.overWdFee) || 0)
       : txnType === 'ออกสมุดใหม่' ? (Number(s.lostBookFee) || 0) : 0,
    feeType: 'flat', exemptCond: '',
    showAs: 'แสดงเป็น Transaction แยกในสมุดคู่ฝาก',
    glCode: s.glCode || '', enabled: true,
  });

  const submit = (f) => {
    const rec = { ...f, acctType: record.name, fee: Number(f.fee) || 0, freeCount: Number(f.freeCount) || 0 };
    if (rec.id) {
      persist(rules.map(r => r.id === rec.id ? rec : r));
      audit.log({ action: 'update', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี › ค่าธรรมเนียม/ค่าปรับ',
        target: `${record.code} · ${record.name} · ${rec.txnType}`, summary: `แก้ไขกฎค่าธรรมเนียม “${rec.txnType}”` });
      onToast && onToast('บันทึกกฎค่าธรรมเนียมเรียบร้อยแล้ว');
    } else {
      rec.id = 'FEE-N' + Date.now();
      persist([rec, ...rules]);
      audit.log({ action: 'create', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี › ค่าธรรมเนียม/ค่าปรับ',
        target: `${record.code} · ${record.name} · ${rec.txnType}`, summary: `เพิ่มกฎค่าธรรมเนียม “${rec.txnType}”` });
      onToast && onToast('เพิ่มกฎค่าธรรมเนียมเรียบร้อยแล้ว');
    }
    setEditRec(null);
  };

  const toggle = (rec) => window.depConfirmOff(rec.enabled, rec.txnType + (rec.acctType ? ' · ' + rec.acctType : ''), () => {
    persist(rules.map(r => r.id === rec.id ? { ...r, enabled: !r.enabled } : r));
    onToast && onToast((rec.enabled ? 'ปิด' : 'เปิด') + 'ใช้งานกฎค่าธรรมเนียมแล้ว');
  }, 'กฎนี้จะไม่ถูกนำไปคิดค่าธรรมเนียม/ค่าปรับ', 'ปิดการใช้งานกฎค่าธรรมเนียม');

  // ความสอดคล้องกับการตั้งค่าประเภทบัญชี
  const overRule = mine.find(r => r.txnType === 'ถอนเกินจำนวนครั้ง' && r.enabled);
  const checks = [
    { on: !!s.wdCountLimit, label: 'จำกัดครั้งถอน / ถอนฟรีต่อเดือน',
      cfg: s.wdCountLimit ? (Number(s.wdCountMax) || 0) + ' ครั้ง' : 'ไม่จำกัด',
      rule: overRule ? overRule.freeCount + ' ครั้ง' : '— ยังไม่มีกฎ',
      ok: !s.wdCountLimit || (overRule && Number(overRule.freeCount) === Number(s.wdCountMax)) },
    { on: !!s.overWdPenaltyOn, label: 'ค่าปรับถอนเกินจำนวนครั้ง',
      cfg: s.overWdPenaltyOn ? fmt.money(Number(s.overWdFee) || 0, 2) + ' ฿' : 'ปิด',
      rule: overRule ? feeText(overRule) : '— ยังไม่มีกฎ',
      ok: !s.overWdPenaltyOn || (overRule && overRule.feeType === 'flat' && Number(overRule.fee) === Number(s.overWdFee)) },
    { on: !!s.lostBookPenaltyOn, label: 'ค่าปรับสมุดคู่ฝากหาย',
      cfg: s.lostBookPenaltyOn ? fmt.money(Number(s.lostBookFee) || 0, 2) + ' ฿' : 'ปิด',
      rule: (() => { const r = mine.find(x => x.txnType === 'ออกสมุดใหม่' && x.enabled); return r ? feeText(r) : '— ยังไม่มีกฎ'; })(),
      ok: (() => { if (!s.lostBookPenaltyOn) return true; const r = mine.find(x => x.txnType === 'ออกสมุดใหม่' && x.enabled); return !!r && Number(r.fee) === Number(s.lostBookFee); })() },
    { on: !!s.earlyCloseePenaltyOn, label: 'ค่าปรับถอน/ปิดบัญชีก่อนกำหนด',
      cfg: s.earlyCloseePenaltyOn ? fmt.money(Number(s.earlyClosePercent) || 0, 2) + '%' : 'ปิด',
      rule: (() => { const r = mine.find(x => x.txnType === 'ปิดบัญชีก่อนกำหนด' && x.enabled); return r ? feeText(r) : '— ยังไม่มีกฎ'; })(),
      ok: (() => { if (!s.earlyCloseePenaltyOn) return true; const r = mine.find(x => x.txnType === 'ปิดบัญชีก่อนกำหนด' && x.enabled); return !!r; })() },
  ];
  const issues = checks.filter(c => c.on && !c.ok);

  const syncFromSettings = () => {
    let next = [...rules];
    const upsert = (txnType, patch) => {
      const i = next.findIndex(r => r.acctType === record.name && r.txnType === txnType);
      if (i >= 0) next[i] = { ...next[i], ...patch, enabled: true };
      else next.unshift({ ...blank(txnType), ...patch, id: 'FEE-N' + Date.now() + '-' + txnType.length, enabled: true });
    };
    if (s.wdCountLimit || s.overWdPenaltyOn) {
      upsert('ถอนเกินจำนวนครั้ง', { freeCount: Number(s.wdCountMax) || 0, feeType: 'flat', fee: Number(s.overWdFee) || 0 });
    }
    if (s.lostBookPenaltyOn) upsert('ออกสมุดใหม่', { feeType: 'flat', fee: Number(s.lostBookFee) || 0, freeCount: 0 });
    if (s.earlyCloseePenaltyOn) upsert('ปิดบัญชีก่อนกำหนด', { feeType: 'percent', fee: Number(s.earlyClosePercent) || 0, freeCount: 0 });
    persist(next);
    audit.log({ action: 'update', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี › ค่าธรรมเนียม/ค่าปรับ',
      target: `${record.code} · ${record.name}`, summary: 'ปรับกฎค่าธรรมเนียมให้สอดคล้องกับการตั้งค่าประเภทบัญชี' });
    onToast && onToast('ปรับกฎค่าธรรมเนียมให้สอดคล้องกับการตั้งค่าแล้ว');
  };

  const ruleRow = (r, inherited) => (
    <tr key={r.id} className={inherited ? '' : 'clickable'} onClick={inherited ? undefined : () => setEditRec(r)}>
      <td><b>{r.txnType}</b><div className="muted" style={{ fontSize: 11 }}>{(FT[r.feeType] || {}).label}</div></td>
      <td className="center mono">{r.freeCount > 0 ? r.freeCount : '—'}</td>
      <td className="right mono"><b>{feeText(r)}</b></td>
      <td><div style={{ fontSize: 12.5 }}>{r.showAs}</div>{r.exemptCond && <div className="muted" style={{ fontSize: 11 }}>ยกเว้น: {r.exemptCond}</div>}</td>
      <td className="center mono">{r.glCode || '—'}</td>
      <td className="center">
        {inherited
          ? (r.enabled ? <span className="pill ok">ใช้งาน</span> : <span className="pill neutral">ปิด</span>)
          : <span onClick={(e) => e.stopPropagation()}>
              <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled} onClick={() => toggle(r)}><span className="lt-switch-knob" /></button>
            </span>}
      </td>
      <td className="center" onClick={(e) => e.stopPropagation()}>
        {inherited
          ? <span className="muted" style={{ fontSize: 11 }}>ทุกประเภท</span>
          : <button className="btn ghost sm" onClick={() => setEditRec(r)}><Icon name="edit" size={13} /></button>}
      </td>
    </tr>
  );

  return (
    <div className="cfg-section">
      <div className="page-actions" style={{ marginTop: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>ค่าธรรมเนียมและค่าปรับของประเภทบัญชีนี้</h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            กฎค่าธรรมเนียม/ค่าปรับตามประเภทรายการ — คิดอัตโนมัติและแสดงเป็น Transaction แยกในสมุดคู่ฝาก
          </div>
        </div>
        <span className="spacer" />
        <button className="btn sm" onClick={syncFromSettings} title="สร้าง/ปรับกฎให้ตรงกับแท็บข้อกำหนดและการปรับ">
          <Icon name="refresh" /> ปรับให้ตรงกับการตั้งค่า
        </button>
        <button className="btn primary sm" onClick={() => setEditRec(blank(''))}><Icon name="plus" /> เพิ่มค่าธรรมเนียม</button>
      </div>

      <div className="search-card" style={{ marginTop: 0, marginBottom: 0 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <h3>กฎค่าธรรมเนียม / ค่าปรับ</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
        <table className="tbl" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th style={{ minWidth: 190 }}>ประเภทรายการ</th>
              <th className="center" style={{ width: 96 }}>ถอนฟรี/ด.</th>
              <th className="right" style={{ width: 120 }}>ค่าธรรมเนียม</th>
              <th style={{ minWidth: 240 }}>วิธีแสดงในสมุดคู่ฝาก</th>
              <th className="center" style={{ width: 110 }}>GL</th>
              <th className="center" style={{ width: 96 }}>ใช้งาน</th>
              <th className="center" style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {mine.length === 0 && shared.length === 0 && (
              <tr><td colSpan="7" className="center muted" style={{ padding: 18 }}>ยังไม่มีกฎค่าธรรมเนียมของประเภทบัญชีนี้</td></tr>
            )}
            {mine.map(r => ruleRow(r, false))}
            {shared.length > 0 && (
              <tr><td colSpan="7" className="muted" style={{ background: 'var(--surface-2, #f7f8f7)', fontSize: 11.5, fontWeight: 600 }}>
                กฎกลาง (ใช้กับทุกประเภทบัญชี) — แก้ไขได้ที่กฎกลางเท่านั้น
              </td></tr>
            )}
            {shared.map(r => ruleRow(r, true))}
          </tbody>
        </table>
        </div></div>
      </div>

      <div className="search-card" style={{ marginBottom: 0 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <h3>ความสอดคล้องกับการตั้งค่าประเภทบัญชี</h3>
        </div>
        <div className="table-wrap"><div className="table-scroll">
        <table className="tbl">
          <thead><tr>
            <th style={{ minWidth: 240 }}>รายการตั้งค่า</th>
            <th style={{ width: 170 }}>ค่าในแท็บข้อกำหนด/ปรับ</th>
            <th style={{ width: 170 }}>ค่าในกฎค่าธรรมเนียม</th>
            <th className="center" style={{ width: 120 }}>สถานะ</th>
          </tr></thead>
          <tbody>
            {checks.map((c, i) => (
              <tr key={i}>
                <td>{c.label}{!c.on && <span className="muted" style={{ fontSize: 11 }}> · ไม่เปิดใช้</span>}</td>
                <td className="mono">{c.cfg}</td>
                <td className="mono">{c.rule}</td>
                <td className="center">{!c.on ? <span className="pill neutral">ไม่ใช้</span>
                  : c.ok ? <span className="pill ok">สอดคล้อง</span> : <span className="pill warn">ไม่ตรงกัน</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div></div>
      </div>

      {issues.length > 0 && (
        <div className="dep-error" style={{ marginTop: 10, background: 'var(--warning-50)', color: 'var(--warning)', borderColor: 'transparent' }}>
          <Icon name="info" size={13} /> มี {issues.length} รายการที่ค่าปรับ/ค่าธรรมเนียมไม่ตรงกับการตั้งค่าประเภทบัญชี — กด “ปรับให้ตรงกับการตั้งค่า” เพื่อให้ระบบสร้าง/ปรับกฎให้สอดคล้อง
        </div>
      )}
      {editRec && window.FeeEditModal && (
        <window.FeeEditModal rec={editRec} lockAcctType={record.name} onClose={() => setEditRec(null)} onSubmit={submit} />
      )}
    </div>
  );
}

function DatDetail({ record, onBack, onSave, onShowHistory, startEditing, onToast }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [tab, setTab] = useState('master');
  const [draft, setDraft] = useState(record);
  const [effectiveDate, setEffectiveDate] = useState(datToday());
  const [savedAt, setSavedAt] = useState(null);
  useEffect(() => { if (!editing) setDraft(record); }, [record, editing]);

  const cur = editing ? draft : record;
  const setHdr = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setSettings = (settings) => setDraft(d => ({ ...d, settings }));
  const setTable = (key, rows) => setDraft(d => ({ ...d, [key]: rows }));

  const startEdit = () => { setDraft(record); setEffectiveDate(datToday()); setEditing(true); };
  const [askSave, setAskSave] = useState(null);
  const [askCancel, setAskCancel] = useState(false);
  const isDirty   = JSON.stringify(draft) !== JSON.stringify(record);
  const cancel    = () => { setDraft(record); setEditing(false); setAskCancel(false); };
  const askToCancel = () => { if (isDirty) setAskCancel(true); else cancel(); };
  const requestSave = () => {
    if (window.__datRateMiss) { onToast && onToast('มีประเภทสมาชิกในแท็บอัตรา Int./Div. ที่ยังไม่ได้เลือกตารางอัตรา — แก้ไขก่อนบันทึก'); return; }
    setAskSave(datDiff(record, draft));
  };
  const save      = () => { setAskSave(null); onSave(draft, effectiveDate); setSavedAt(new Date()); setEditing(false); };
  // เปลี่ยนแท็บระหว่างแก้ไข — มีค่าที่ยังไม่บันทึก ให้ยืนยันก่อน
  const [askTab, setAskTab] = useState(null);
  const goTab = (id) => { if (id === tab) return; if (editing && isDirty) setAskTab(id); else setTab(id); };
  const saveTabAndGo = () => {
    const to = askTab; setAskTab(null);
    onSave(draft, effectiveDate, { quiet: true }); setSavedAt(new Date());
    setTab(to);
  };
  const stayOnTab = () => setAskTab(null);
  const discardTab = () => { setAskTab(null); setDraft(record); };
  const backdating = editing && effectiveDate < datToday();

  const rate = datCurrentRate(cur);
  const tabProps = { record: cur, editing, onSettings: setSettings, onTable: setTable };

  return (
    <div data-screen-label="หน้ารายละเอียดประเภทบัญชีเงินฝาก">
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
        <button className="btn ghost sm" onClick={onBack}><Icon name="chevLeft" /> กลับสู่รายการ</button>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          <Icon name="clock-circle" size={11} /> บันทึกล่าสุด: {savedAt ? savedAt.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'ยังไม่มีการบันทึก'}
        </span>
        <button className="btn sm" data-keep-top="" onClick={() => onShowHistory(record)}><Icon name="history" /> ประวัติ ({(record.history || []).length})</button>
        {!editing
          ? <button className="btn primary sm" data-keep-top="" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูล</button>
          : <>
              <button className="btn sm" data-keep-top="" onClick={askToCancel}>ยกเลิก</button>
              <button className="btn primary sm" data-keep-top="" onClick={requestSave}><Icon name="check" /> บันทึกข้อมูล</button>
            </>}
      </div>

      {/* หัวเรื่อง — ข้อมูลหลักแสดงเสมอทุกแท็บ */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="wallet" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className="cfg-input mono" style={{ width: 110 }} value={draft.code} placeholder="รหัส" disabled onChange={(e) => setHdr('code', e.target.value)} />
                <input className="cfg-input lt-name-input" style={{ flex: 1, minWidth: 240 }} value={draft.name} placeholder="ชื่อประเภทบัญชี" onChange={(e) => setHdr('name', e.target.value)} />
              </div>
            ) : (
              <h1 className="lt-head-title"><span className="mono" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{record.code}</span> · {record.name}</h1>
            )}
            <div className="lt-head-meta">
              <span className="mono">{record.id}</span><span className="dot" />
              <span>กลุ่ม: {window.datLabel('depGroup', cur.settings.depGroup)}</span><span className="dot" />
              <span>บุคคล: {window.datLabel('personType', cur.settings.personType)}</span>
            </div>
          </div>
          {record.enabled
            ? <span className="chip success" style={{ height: 24 }}><span className="dot-c" /> เปิดใช้งาน</span>
            : <span className="chip" style={{ height: 24 }}>ปิดใช้งาน</span>}
        </div>

        <div className="lt-head-dates">
          <div className="lt-date"><span className="lt-date-k">รหัสคุมเลขที่บัญชี</span><span className="lt-date-v mono">{cur.settings.docNo || '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">คู่บัญชี (GL)</span><span className="lt-date-v mono">{cur.settings.glCode || '—'} / {cur.settings.glPair || '—'}</span></div>
          <div className="lt-date"><span className="lt-date-k">อัตราที่ใช้อยู่</span><span className="lt-date-v mono">{rate ? fmt.money(Number(rate.rate), 4) + '%' : (cur.settings.intGiveOn ? '—' : 'ไม่จ่ายดอกเบี้ย')}</span></div>
          {editing ? (
            <div className="lt-date" style={{ minWidth: 190 }}>
              <span className="lt-date-k" style={{ color: backdating ? 'var(--warning)' : undefined }}>การแก้ไขมีผลตั้งแต่ (แก้ย้อนหลังได้)</span>
              <div style={{ maxWidth: 170 }}><window.ThaiDateField value={effectiveDate} onChange={setEffectiveDate} /></div>
            </div>
          ) : (
            <div className="lt-date" style={{ flex: 1 }}><span className="lt-date-k">หมายเหตุ</span><span className="lt-date-v" style={{ fontWeight: 400 }}>{record.note || <span className="muted">—</span>}</span></div>
          )}
        </div>

        {editing && (
          <>
            <div className="lt-head-dates" style={{ marginTop: 8, paddingTop: 8 }}>
              <div className="lt-date" style={{ flex: 1 }}>
                <span className="lt-date-k">หมายเหตุ</span>
                <input className="cfg-input" value={draft.note || ''} placeholder="หมายเหตุประกอบรายการ" onChange={(e) => setHdr('note', e.target.value)} />
              </div>
            </div>
            {backdating && (
              <div className="dep-error" style={{ marginTop: 10, background: 'var(--warning-50)', color: 'var(--warning)', borderColor: 'transparent' }}>
                <Icon name="info" size={13} /> กำลังแก้ไขย้อนหลัง — การเปลี่ยนแปลงจะถูกบันทึกว่ามีผลตั้งแต่ {fmt.date(effectiveDate)} และเก็บไว้ในประวัติ
              </div>
            )}
          </>
        )}
      </div>

      {cur.settings.openCond === 'deny' && (
        <div className="dat-warn" style={{ marginTop: 12 }}>
          <Icon name="info" size={14} />
          <span>ประเภทบัญชีนี้ตั้งค่า <b>ไม่อนุญาตให้เปิดบัญชีด้วยตนเอง</b> — ระบบจะสร้าง/ผูกบัญชีให้อัตโนมัติตามกระบวนการ (เช่น รับเงินกู้ / หักกองทุน / บัญชีพักภายใน)</span>
        </div>
      )}

      <div className="tabs-container dat-tabs" style={{ marginTop: 12 }}>
        <div className="tabs-bar">
          {DAT_TABS.map(t => (
            <button key={t.id} className={"tab" + (t.id === tab ? ' active' : '')} onClick={() => goTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <div className="dat-tabs-body">
          {tab === 'master' && <DatTabMaster {...tabProps} />}
          {tab === 'cond'   && <DatTabConditions {...tabProps} />}
          {tab === 'payint' && <DatTabPayInt {...tabProps} />}
          {tab === 'calc'   && <DatTabCalc {...tabProps} />}
          {tab === 'rate'   && <DatTabRate {...tabProps} />}
          {tab === 'early'  && <DatTabEarly {...tabProps} />}
          {tab === 'fees'   && <DatTabFees record={cur} editing={editing} onToast={onToast} />}
        </div>
      </div>

      {askSave && (
        <window.DepChangeConfirm title="บันทึกการเปลี่ยนแปลง?"
          subtitle={'มีผลกับทุกบัญชีประเภท “' + draft.name + '”'}
          changes={askSave} okLabel="ยืนยันบันทึก" onOk={save} onClose={() => setAskSave(null)} />
      )}
      {askCancel && <window.DepDiscardConfirm onKeep={() => setAskCancel(false)} onDiscard={cancel} />}
      {askTab && (
        <window.DepStatusDialog tone="confirm" title="บันทึกการแก้ไข?"
          desc="บันทึกการเปลี่ยนแปลงก่อน จึงจะเปลี่ยนไปแท็บอื่นได้"
          cancelLabel="ละทิ้ง" okLabel={<><Icon name="check" size={14} /> บันทึก</>}
          onCancel={discardTab} onOk={saveTabAndGo} onClose={stayOnTab} />
      )}

      {(window.DAT_TAB_FOOT || {})[tab] && (
        <div className="lt-list-foot muted" style={{ marginTop: 8, background: 'transparent', border: 0 }}>
          <Icon name="info" size={12} /> {window.DAT_TAB_FOOT[tab]}
        </div>
      )}

    </div>
  );
}

// ─── Add modal ───────────────────────────────────────────────────────
function DatAddModal({ list, onClose, onCreate }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState(() => (window.DAT_OPTS.depGroup[0] || {}).v || '');
  const [copyFrom, setCopyFrom] = useState('__default');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!code.trim()) return setError('กรุณาระบุรหัสประเภทบัญชี');
    if (!name.trim()) return setError('กรุณาระบุชื่อประเภทบัญชี');
    if (list.some(r => r.code === code.trim())) return setError('รหัสนี้ถูกใช้แล้ว');
    let settings, tables;
    if (copyFrom === '__default') {
      settings = { ...window.DAT_SETTINGS_DEFAULTS }; tables = window.DAT_TABLE_DEFAULTS();
    } else {
      const src = list.find(r => r.id === copyFrom);
      settings = src ? JSON.parse(JSON.stringify(src.settings)) : { ...window.DAT_SETTINGS_DEFAULTS };
      tables = src
        ? { rateTiers: JSON.parse(JSON.stringify(src.rateTiers || [])), earlyWithdraw: JSON.parse(JSON.stringify(src.earlyWithdraw || [])), dividendDates: JSON.parse(JSON.stringify(src.dividendDates || [])) }
        : window.DAT_TABLE_DEFAULTS();
    }
    settings.depGroup = group;
    settings.abbr = settings.abbr || code.trim();
    onCreate({
      id: datUid(), code: code.trim(), name: name.trim(), enabled: false,
      createdDate: datToday(), createdBy: DAT_USER, note: '',
      // กลุ่มค่าเดิม (ความเข้ากันได้กับหน้าจอทำรายการ) — สืบจาก settings
      cond: { minOpen: Number(settings.minOpen) || 0, minBalance: Number(settings.minBalance) || 0, limitPerMember: !!settings.limitAccounts, maxPerMember: Number(settings.maxAccounts) || 0 },
      interest: { method: settings.intCalcMethod === 'month' ? 'monthly' : 'daily', rate: 0, dayBase: 365, payCycle: 'ปีละ 2 ครั้ง (มิ.ย./ธ.ค.)' },
      withdraw: { freeCount: Number(settings.wdCountMax) || 0, feeOver: Number(settings.overWdFee) || 0, exemptCond: '' },
      passbook: { useBook: settings.passbookHold === 'book', noBook: settings.passbookHold !== 'book' },
      gl: { glCode: settings.glCode || '', pairCode: settings.glPair || '', bankType: 'ออมทรัพย์' },
      control: { needApprove: false, loanDisburse: false },
      settings, ...tables, history: [],
    });
  };
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 520 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="plus" /></div>
          <div style={{ minWidth: 0 }}>
            <h2>เพิ่มประเภทบัญชีเงินฝาก</h2>
            <div className="muted" style={{ fontSize: 11 }}>สร้างประเภทบัญชีใหม่ — ปิดใช้งานไว้จนกว่าจะตั้งค่าครบ</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <div>
              <label className="lt-modal-label">รหัส <span className="cfg-required">*</span></label>
              <input className="cfg-input mono" value={code} autoFocus placeholder="F48" onChange={(e) => { setCode(e.target.value); setError(''); }} />
            </div>
            <div>
              <label className="lt-modal-label">ชื่อประเภทบัญชี <span className="cfg-required">*</span></label>
              <input className="cfg-input" value={name} placeholder="เช่น เงินฝากประจำ 4 ปี" onChange={(e) => { setName(e.target.value); setError(''); }} />
            </div>
          </div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>กลุ่มเงินฝาก</label>
          <select className="filter-select" style={{ width: '100%' }} value={group} onChange={(e) => setGroup(e.target.value)}>
            {window.DAT_OPTS.depGroup.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <div className="bud-fld-hint">อ้างอิงจากเมนูประเภทกลุ่มเงินฝาก</div>

          <label className="lt-modal-label" style={{ marginTop: 12 }}>เริ่มจาก</label>
          <select className="filter-select" style={{ width: '100%' }} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
            <option value="__default">ค่าเริ่มต้นของระบบ</option>
            <optgroup label="คัดลอกจากประเภทบัญชีเดิม">
              {list.map(r => <option key={r.id} value={r.id}>{r.code} — {r.name}</option>)}
            </optgroup>
          </select>

          {error && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn primary" style={{ flex: 1, justifyContent: 'center' }}><Icon name="check" /> สร้างประเภทบัญชี</button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── Toggle confirm modal ────────────────────────────────────────────
function DatToggleModal({ target, turningOn, onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico" style={turningOn ? {} : { background: 'var(--warning-50)', color: 'var(--warning)' }}>
            <Icon name={turningOn ? 'check' : 'info'} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2>{turningOn ? 'เปิดการใช้งานประเภทบัญชี' : 'ปิดการใช้งานประเภทบัญชี'}</h2>
            <div className="muted" style={{ fontSize: 11 }}>{target.code} · {target.name}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <p className="lt-confirm-text">
            {turningOn
              ? <>เปิดให้ใช้งานประเภทบัญชี <b>“{target.name}”</b> — เจ้าหน้าที่จะเปิดบัญชีด้วยประเภทนี้ได้</>
              : <>ปิดการใช้งาน <b>“{target.name}”</b> — ระบบจะ<b>ไม่เปิดรับการเปิดบัญชีใหม่</b> บัญชีเดิมยังคงทำรายการได้ตามปกติ</>}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>ยกเลิก</button>
            <button className={"btn " + (turningOn ? 'primary' : 'danger')} style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}><Icon name="check" /> ยืนยัน</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  Main page — list ⇄ detail
// ════════════════════════════════════════════════════════════════════
function DepAccTypeConfigPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = useState(datLoad);
  const [openId, setOpenId] = useState(null);
  const [startEditing, setStartEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = React.useState('');
  const [query, setQuery] = React.useState('');
  const qn = query.trim().toLowerCase();
  const shown = qn ? list.filter(r => (String(r.code) + ' ' + r.name + ' ' + (r.abbr || '')).toLowerCase().includes(qn)) : list;
  const [toggleTarget, setToggleTarget] = useState(null);
  const [histRec, setHistRec] = useState(null);
  const persist = (next) => { setList(next); datSaveLS(next); };
  const openRec = list.find(r => r.id === openId);
  const activeCount = list.filter(r => r.enabled).length;

  const handleCreate = (rec) => {
    const withHist = { ...rec, history: [{
      ts: datNow(), user: DAT_USER, action: 'create', effective: rec.createdDate,
      summary: `สร้างประเภทบัญชีเงินฝาก “${rec.name}” (รหัส ${rec.code})`,
      changes: [{ field: 'รหัส', before: '—', after: rec.code }, { field: 'ชื่อประเภทบัญชี', before: '—', after: rec.name }],
    }] };
    persist([withHist, ...list]);
    audit.log({ action: 'create', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี',
      target: `${rec.code} · ${rec.name}`, summary: `เพิ่มประเภทบัญชีเงินฝาก “${rec.name}”`,
      changes: [{ field: 'รหัส', before: '—', after: rec.code }] });
    setAdding(false); onToast && onToast(`สร้างประเภทบัญชี “${rec.name}” เรียบร้อยแล้ว`);
    setStartEditing(true); setOpenId(withHist.id);
  };

  const handleSave = (draft, effectiveDate, opt) => {
    const before = list.find(r => r.id === draft.id);
    const changes = datDiff(before, draft);
    const entry = {
      ts: datNow(), user: DAT_USER, action: 'update', effective: effectiveDate,
      summary: changes.length ? `แก้ไขประเภทบัญชี “${draft.name}” (${changes.length} รายการ)` + (effectiveDate < datToday() ? ' — แก้ไขย้อนหลัง' : '') : `บันทึกประเภทบัญชี “${draft.name}” (ไม่มีการเปลี่ยนแปลง)`,
      changes,
    };
    // ซิงก์กลุ่มค่าเดิมจาก settings เพื่อความเข้ากันได้กับหน้าจอทำรายการ
    const s = draft.settings;
    const synced = {
      ...draft,
      cond: { ...draft.cond, minOpen: Number(s.minOpen) || 0, minBalance: Number(s.minBalance) || 0, limitPerMember: !!s.limitAccounts, maxPerMember: Number(s.maxAccounts) || 0 },
      withdraw: { ...draft.withdraw, freeCount: Number(s.wdCountMax) || 0, feeOver: Number(s.overWdFee) || 0 },
      passbook: { ...draft.passbook, useBook: s.passbookHold === 'book', noBook: s.passbookHold !== 'book' },
      gl: { ...draft.gl, glCode: s.glCode || '', pairCode: s.glPair || '' },
      history: [entry, ...(draft.history || [])],
    };
    persist(list.map(r => r.id === draft.id ? synced : r));
    audit.log({ action: 'update', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี',
      target: `${draft.code} · ${draft.name}`, summary: entry.summary, changes });
    if (opt && opt.quiet) { onToast && onToast('บันทึกการเปลี่ยนแปลงแล้ว'); return; }
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกประเภทบัญชี “' + draft.code + '-' + draft.name + '” เรียบร้อยแล้ว' });
  };

  const applyToggle = (tg) => {
    const { rec, turningOn } = tg || toggleTarget;
    const entry = { ts: datNow(), user: DAT_USER, action: 'toggle', effective: datToday(),
      summary: (turningOn ? 'เปิด' : 'ปิด') + `การใช้งานประเภทบัญชี “${rec.name}”`,
      changes: [{ field: 'การใช้งาน', before: turningOn ? 'ปิดใช้งาน' : 'เปิดใช้งาน', after: turningOn ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }] };
    persist(list.map(r => r.id === rec.id ? { ...r, enabled: turningOn, history: [entry, ...(r.history || [])] } : r));
    audit.log({ action: 'update', module: 'เงินฝาก — ค่าคงที่ประเภทบัญชี', target: `${rec.code} · ${rec.name}`, summary: entry.summary, changes: entry.changes });
    onToast && onToast((turningOn ? 'เปิด' : 'ปิด') + `ใช้งาน “${rec.name}” แล้ว`);
    setToggleTarget(null);
  };

  if (openRec) {
    return (
      <>
        <DatDetail record={openRec} startEditing={startEditing} onToast={onToast}
          onBack={() => { setOpenId(null); setStartEditing(false); }} onSave={handleSave} onShowHistory={setHistRec} />
        {histRec && <DatHistoryModal record={list.find(r => r.id === histRec.id) || histRec} onClose={() => setHistRec(null)} />}
      </>
    );
  }

  return (
    <div data-screen-label="หน้าค่าคงที่ประเภทบัญชีเงินฝาก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ค่าคงที่ประเภทบัญชีเงินฝาก</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>กำหนดข้อมูลหลัก เงื่อนไข/ค่าปรับ การจ่ายดอกเบี้ย/ปันผล การคิดดอกเบี้ย อัตรา และเงื่อนไขถอนก่อนกำหนด — แก้ย้อนหลังได้พร้อมเก็บประวัติ</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setAdding(true)}><Icon name="plus" /> เพิ่มประเภทบัญชี</button>
      </div>

      <div className="lt-active-banner">
        <div className="lt-ab-ico"><Icon name="wallet" /></div>
        <div>
          <div className="lt-ab-label">ประเภทบัญชีเงินฝากทั้งหมด</div>
          <div className="lt-ab-name">{list.length} ประเภท
            <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}> · เปิดใช้งาน {activeCount} · ปิดใช้งาน {list.length - activeCount}</span>
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, alignItems: 'center' }}>
          <div className="dep-input" style={{ flex: '1 1 280px', minWidth: 0, height: 32, marginTop: 0, boxSizing: 'border-box', background: '#fff' }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') setQuery(q); }}
                   placeholder="ค้นหารหัส หรือชื่อประเภทบัญชี" />
          </div>
          <button className="btn primary pa-tb-btn" onClick={() => setQuery(q)}>ค้นหา</button>
          <button className="btn pa-tb-btn" onClick={() => { setQ(''); setQuery(''); }}>รีเซ็ต</button>
        </div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th style={{ width: 80 }}>รหัส</th>
                <th style={{ minWidth: 230 }}>ชื่อประเภทบัญชี</th>
                <th style={{ width: 130 }}>กลุ่มเงินฝาก</th>
                <th className="right" style={{ width: 90 }}>อัตรา</th>
                <th className="right" style={{ width: 120 }}>เปิดขั้นต่ำ</th>
                <th style={{ width: 150 }}>โครงการที่ใช้</th>
                <th className="center" style={{ width: 70 }}>ประวัติ</th>
                <th className="center" style={{ width: 80 }}>ใช้งาน</th>
                <th className="center" style={{ width: 90 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={9} className="center muted" style={{ padding: '32px 12px' }}>ไม่พบข้อมูล</td></tr>}
              {shown.map(r => {
                const rate = datCurrentRate(r);
                return (
                  <tr key={r.id} className={r.enabled ? undefined : 'dat-off'}>
                    <td className="mono">{r.code}</td>
                    <td>
                      <div className="lt-row-name">{r.name}</div>
                      {r.note && <div className="lt-row-note muted">{r.note}</div>}
                    </td>
                    <td>{window.datLabel('depGroup', r.settings.depGroup)}</td>
                    <td className="right mono">{r.settings.intGiveOn ? <b>{fmt.money(Number(rate ? rate.rate : 0), 2)}%</b> : <span className="muted">—</span>}</td>
                    <td className="right mono">{fmt.money(Number(r.settings.minOpen), 0)}</td>
                    <td>{(() => {
                      const used = window.dpjProjectsUsing ? window.dpjProjectsUsing(r.code) : [];
                      if (!used.length) return <span className="muted">—</span>;
                      const openNow = used.filter(u => window.dpjRoundState(u.round).key === 'open').length;
                      return <span title={used.map(u => u.project.name + ' — ' + u.round.name).join('\n')}>
                        {used.length} รอบ{openNow ? <span className="pill ok" style={{ marginLeft: 4 }}>เปิดรับ {openNow}</span> : null}
                      </span>;
                    })()}</td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn ghost sm" title="ดูประวัติการแก้ไข" onClick={() => setHistRec(r)}><Icon name="history" size={13} /> {(r.history || []).length}</button>
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className={"lt-switch" + (r.enabled ? ' on' : '')} role="switch" aria-checked={r.enabled}
                              aria-label={r.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                              onClick={() => window.depConfirmOff(r.enabled, r.code + ' · ' + r.name, () => applyToggle({ rec: r, turningOn: !r.enabled }),
                                'ระบบจะไม่เปิดรับการเปิดบัญชีใหม่ บัญชีเดิมยังคงทำรายการได้ตามปกติ', 'ปิดการใช้งานประเภทบัญชี')}>
                        <span className="lt-switch-knob" />
                      </button>
                    </td>
                    <td className="center" onClick={(e) => e.stopPropagation()}>
                      <button className="btn sm dat-view-btn" title="ดูรายละเอียด"
                              onClick={() => { setStartEditing(false); setOpenId(r.id); }}><Icon name="eye" size={13} /> ดู</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ประเภทบัญชีเงินฝากไม่สามารถลบได้ — ปิดการใช้งานเพื่อหยุดรับการเปิดบัญชีใหม่ และเก็บประวัติทุกการแก้ไขเพื่อการตรวจสอบย้อนหลัง
      </div>

      {adding && <DatAddModal list={list} onClose={() => setAdding(false)} onCreate={handleCreate} />}
      {histRec && <DatHistoryModal record={list.find(r => r.id === histRec.id) || histRec} onClose={() => setHistRec(null)} />}
    </div>
  );
}

Object.assign(window, { DepAccTypeConfigPage });
