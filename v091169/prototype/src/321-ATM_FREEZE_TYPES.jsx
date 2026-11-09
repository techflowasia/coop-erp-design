// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › บัญชีและธุรกรรม — อายัดบัญชีเงินฝาก ATM + ยกเลิกอายัด
//  โครงหน้าจอเดียวกับขอเปิด/ปิดบัญชี ATM · ทำงานสอดคล้องกันสองเมนู
//  (อายัด → บันทึกสถานะ / ยกเลิกอายัด → ล้างสถานะ) ผ่าน store เดียวกัน
// ════════════════════════════════════════════════════════════════════

// ประเภทการอายัด ATM (ตามระบบเดิม 00–06)
const ATM_FREEZE_TYPES = [
  { code: '00', label: 'อายัดยอดเงิน',        pill: 'bad'  },
  { code: '01', label: 'อายัดอื่นๆ',           pill: 'warn' },
  { code: '02', label: 'บัตรหาย',              pill: 'warn' },
  { code: '03', label: 'ธนาคารอายัด',          pill: 'bad'  },
  { code: '04', label: 'อายัดยอดติดลบ',        pill: 'bad'  },
  { code: '05', label: 'ศาลสั่งอายัด',          pill: 'bad'  },
  { code: '06', label: 'กรมบังคับคดีอายัด',     pill: 'bad'  },
];
const atmFreezeType = (c) => ATM_FREEZE_TYPES.find(t => t.code === c);

// สถานะอายัด ATM ของแต่ละบัญชี (localStorage: accNo → record)
function atmFrzLoad() {
  try { const s = localStorage.getItem('dep_atm_freezes'); if (s) return JSON.parse(s); } catch (e) {}
  return {};
}
function atmFrzSave(map) { try { localStorage.setItem('dep_atm_freezes', JSON.stringify(map)); } catch (e) {} }

const ATM_FRZ_USER = 'จันทร์เพ็ญ มาลี';

// ── การ์ดข้อมูลบัญชี ATM (section 1) ──
function AtmFrzAccountCard({ acc, member, children }) {
  const certNo = acc?.certNo || (acc ? '—' : '');
  const citizenId = member?.citizenId || '—';
  const atmCard = acc ? (acc.atmCard || '5061-XX' + String(acc.accNo).replace(/\D/g, '').slice(-4)) : '';
  return (
    <div className="search-card dat-section">
      <DepSecHead icon="wallet" n="1" title="ข้อมูลบัญชีเงินฝาก ATM" sub="ค้นหาและเลือกบัญชี ATM (ผูกบัญชีกรุงไทย)" />
      <div className="dat-grid g3">
        {children /* ช่องค้นหาเลขที่บัญชี */}
        <DatFieldLite label="PB / Cert."><div className="cfg-display-box mono">{certNo || '—'}</div></DatFieldLite>
        <DatFieldLite label="ชื่อบัญชี" span={2}><div className="cfg-display-box">{acc ? acc.name : '—'}</div></DatFieldLite>
        <DatFieldLite label="ประเภทเงินฝาก"><div className="cfg-display-box">{acc ? acc.type : '—'}</div></DatFieldLite>
        <DatFieldLite label="เลขบัตร / Tax ID"><div className="cfg-display-box mono">{acc ? citizenId : '—'}</div></DatFieldLite>
        <DatFieldLite label="ฝากประเภท"><div className="cfg-display-box">{acc ? acc.type : '—'}</div></DatFieldLite>
        <DatFieldLite label="เลขบัตร ATM"><div className="cfg-display-box mono">{acc ? atmCard : '—'}</div></DatFieldLite>
      </div>
    </div>
  );
}

// ── การ์ดข้อมูลสมาชิก (section 3) ──
function AtmFrzMemberCard({ acc, member, frozenAmount = 0 }) {
  const balance = acc?.balance || 0;
  const withdrawable = Math.max(0, balance - (frozenAmount || 0));
  const partial = (frozenAmount || 0) > 0;
  return (
    <div className="search-card dat-section">
      <DepSecHead icon="members" n="3" title="ข้อมูลสมาชิก" sub="ข้อมูลเจ้าของบัญชีและยอดเงิน (ดึงจากบัญชีที่เลือก)" />
      <div className="dat-grid g3">
        <DatFieldLite label="ทะเบียนสมาชิก"><div className="cfg-display-box mono">{acc ? acc.member : '—'}</div></DatFieldLite>
        <DatFieldLite label="ชื่อ - นามสกุล" span={2}><div className="cfg-display-box">{member?.name || acc?.name || '—'}</div></DatFieldLite>
        <DatFieldLite label="สังกัด" span={3}><div className="cfg-display-box">{member?.dept || acc?.dept || '—'}</div></DatFieldLite>
        <DatFieldLite label="ยอดคงเหลือ"><div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(balance, 2) : '.00'}</div></DatFieldLite>
        <DatFieldLite label="ยอดที่อายัด"><div className="cfg-display-box mono" style={{ textAlign: 'right', color: partial ? 'var(--danger)' : undefined }}>{acc ? fmt.money(frozenAmount || 0, 2) : '.00'}</div></DatFieldLite>
        <DatFieldLite label="ยอดถอนได้"><div className="cfg-display-box mono" style={{ textAlign: 'right', color: partial ? 'var(--primary)' : undefined }}>{acc ? fmt.money(withdrawable, 2) : '.00'}</div></DatFieldLite>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  อายัดบัญชีเงินฝาก ATM
// ════════════════════════════════════════════════════════════════════
function DepAtmFreezePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);
  const [freezes, setFreezes] = useState(atmFrzLoad);
  const [acc, setAcc] = useState(null);
  const [ftype, setFtype] = useState('00');
  const [mode, setMode] = useState('full');   // full = ทั้งบัญชี · partial = บางส่วน
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [slip, setSlip] = useState(null);

  const member = useMemo(() => acc ? (window.DEP_TXN_MEMBERS || []).find(m => m.code === acc.member) || null : null, [acc]);
  const already = acc ? freezes[acc.accNo] : null;
  const tdef = atmFreezeType(ftype);
  const balance = acc?.balance || 0;
  const amtNum = mode === 'partial' ? (parseFloat(String(amount).replace(/,/g, '')) || 0) : 0;
  const amtValid = mode === 'full' || (amtNum > 0 && amtNum <= balance);

  useEffect(() => { setFtype('00'); setMode('full'); setAmount(''); setReason(''); setSlip(null); }, [acc && acc.accNo]);

  const canSubmit = !!acc && !already && !!ftype && reason.trim() && amtValid;
  const reset = () => { setAcc(null); setFtype('00'); setMode('full'); setAmount(''); setReason(''); setSlip(null); };

  const submit = () => {
    if (!canSubmit) { onToast && onToast(already ? 'บัญชีนี้ถูกอายัดอยู่แล้ว' : (!amtValid ? 'จำนวนเงินที่อายัดต้องมากกว่า 0 และไม่เกินยอดคงเหลือ' : 'กรุณาเลือกบัญชี ประเภทการอายัด และระบุสาเหตุ')); return; }
    const reqId = 'ATF' + String(Date.now()).slice(-6);
    const date = new Date().toISOString().slice(0, 10);
    const scope = mode === 'partial' ? `บางส่วน ${fmt.money(amtNum, 2)} บาท` : 'ทั้งบัญชี';
    const next = { ...freezes, [acc.accNo]: { type: ftype, label: tdef.label, mode, amount: amtNum, reason: reason.trim(), date, by: ATM_FRZ_USER, reqId } };
    setFreezes(next); atmFrzSave(next);
    audit.log({ action: 'update', module: 'เงินฝาก — อายัดบัญชี ATM',
      target: `${acc.accNo} · ${acc.name}`,
      summary: `${tdef.code} ${tdef.label} (${scope}) บัญชี ATM ${acc.accNo} — สาเหตุ: ${reason.trim()}`,
      changes: [{ field: 'สถานะอายัด ATM', before: 'ปกติ', after: `${tdef.code} ${tdef.label} · ${scope}` }] });
    setSlip({
      title: 'ใบอายัดบัญชีเงินฝาก ATM', sub: `เลขที่คำขอ ${reqId} · วันที่ ${fmt.date(date)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: acc.accNo, mono: true },
        { k: 'ชื่อบัญชี', v: acc.name },
        { k: 'ประเภทเงินฝาก', v: acc.type },
        { k: 'สมาชิก', v: `${acc.member} · ${member?.name || acc.name}` },
        { k: 'ประเภทการอายัด', v: `${tdef.code} ${tdef.label}`, strong: true },
        { k: 'รูปแบบการอายัด', v: mode === 'partial' ? 'อายัดบางส่วน' : 'อายัดทั้งบัญชี', strong: true },
        ...(mode === 'partial' ? [{ k: 'จำนวนเงินที่อายัด', v: fmt.money(amtNum, 2) + ' บาท', mono: true, strong: true }] : []),
        { k: 'สาเหตุ', v: reason.trim() },
        { k: 'ยอดคงเหลือ', v: fmt.money(balance, 2) + ' บาท', mono: true },
        ...(mode === 'partial' ? [{ k: 'ยอดถอนได้คงเหลือ', v: fmt.money(Math.max(0, balance - amtNum), 2) + ' บาท', mono: true }] : []),
        { k: 'สถานะ', v: mode === 'partial' ? 'อายัดบางส่วนแล้ว' : 'อายัดบัญชี ATM แล้ว', strong: true },
      ],
      foot: mode === 'partial' ? 'ระบบระงับการถอนเฉพาะส่วนที่อายัด — ส่วนที่เหลือยังถอนผ่านบัตร ATM ได้' : 'ระบบระงับการทำรายการผ่านบัตร ATM สำหรับบัญชีนี้ทันที',
    });
    onToast && onToast(`อายัดบัญชี ATM ${acc.accNo} (${tdef.label} · ${scope}) เรียบร้อยแล้ว`);
  };

  return (
    <div data-screen-label="หน้าอายัดบัญชีเงินฝาก ATM" className="dep-open">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>อายัดบัญชีเงินฝาก ATM</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ระงับการทำรายการผ่านบัตร ATM ตามประเภทการอายัด — ยกเลิกอายัดได้ที่เมนู “ยกเลิกอายัดบัญชี ATM”</div>
        </div>
        <span className="spacer" />
        <div className="dep-open-toolbar">
          <button className="btn sm" onClick={reset}><Icon name="plus" /> สร้างใหม่</button>
          {slip && <button className="btn sm" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์เอกสาร</button>}
          <button className="btn danger sm" disabled={!canSubmit} onClick={submit}><Icon name="lock" /> บันทึกการอายัด</button>
        </div>
      </div>

      {already && (
        <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
          <Icon name="lock" size={14} />
          <span>บัญชีนี้<b>ถูกอายัดอยู่แล้ว</b> — {already.label}{already.mode === 'partial' ? ` · บางส่วน ${fmt.money(already.amount || 0, 2)} บาท` : ' · ทั้งบัญชี'} · สาเหตุ: {already.reason} · เมื่อ {fmt.date(already.date)} — หากต้องการปลดล็อกให้ไปที่เมนู “ยกเลิกอายัดบัญชี ATM”</span>
        </div>
      )}

      <AtmFrzAccountCard acc={acc} member={member}>
        <DatFieldLite label="เลขที่บัญชี" required>
          <DepAccountSearchField accounts={accounts} value={acc} onPick={setAcc} placeholder="คลิกเพื่อค้นหาเลขที่บัญชี / รหัสสมาชิก / ชื่อบัญชี…" />
        </DatFieldLite>
      </AtmFrzAccountCard>

      <div className="search-card dat-section">
        <DepSecHead icon="lock" n="2" title="รายละเอียดการอายัด" sub="เลือกประเภทและรูปแบบการอายัด แล้วระบุสาเหตุ" />
        <div className="dat-grid g3">
          <DatFieldLite label="ประเภทการอายัด" required>
            <select className="cfg-input" value={ftype} disabled={!acc || !!already} onChange={(e) => setFtype(e.target.value)}>
              {ATM_FREEZE_TYPES.map(t => <option key={t.code} value={t.code}>{t.code} {t.label}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="รูปแบบการอายัด" required>
            <select className="cfg-input" value={mode} disabled={!acc || !!already} onChange={(e) => setMode(e.target.value)}>
              <option value="full">อายัดทั้งบัญชี</option>
              <option value="partial">อายัดบางส่วน (ระบุจำนวนเงิน)</option>
            </select>
          </DatFieldLite>
          {mode === 'partial' ? (
            <DatFieldLite label="จำนวนเงินที่อายัด (บาท)" required>
              <input className="cfg-input mono" style={{ textAlign: 'right', ...(!amtValid && String(amount).trim() ? { borderColor: 'var(--danger)' } : {}) }}
                     value={amount} disabled={!acc || !!already} inputMode="decimal"
                     onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" />
            </DatFieldLite>
          ) : (
            <DatFieldLite label="จำนวนเงินที่อายัด">
              <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(balance, 2) + ' (ทั้งบัญชี)' : '—'}</div>
            </DatFieldLite>
          )}
          <DatFieldLite label="สาเหตุ" span={3} required>
            <input className="cfg-input" value={reason} disabled={!acc || !!already} onChange={(e) => setReason(e.target.value)} placeholder="ระบุสาเหตุการอายัด เช่น บัตรสูญหาย / คำสั่งศาล" />
          </DatFieldLite>
          {mode === 'partial' && acc && (
            <DatFieldLite label="ยอดคงเหลือหลังอายัด" span={3}>
              <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>
                {amtValid ? fmt.money(Math.max(0, balance - amtNum), 2) + ' บาท จากยอดคงเหลือ ' + fmt.money(balance, 2) : 'กรุณาระบุจำนวนที่ถูกต้อง (ไม่เกิน ' + fmt.money(balance, 2) + ' บาท)'}
              </div>
            </DatFieldLite>
          )}
        </div>
      </div>

      <AtmFrzMemberCard acc={acc} member={member} frozenAmount={mode === 'partial' ? (amtValid ? amtNum : 0) : (acc ? balance : 0)} />

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ยกเลิกอายัดบัญชีเงินฝาก ATM
// ════════════════════════════════════════════════════════════════════
function DepAtmUnfreezePage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [allAccounts] = useState(window.depTxnLoadAccounts);
  const [freezes, setFreezes] = useState(atmFrzLoad);
  const [acc, setAcc] = useState(null);
  const [note, setNote] = useState('');
  const [slip, setSlip] = useState(null);

  // เลือกได้เฉพาะบัญชีที่ถูกอายัดอยู่
  const frozenAccounts = useMemo(() => allAccounts.filter(a => freezes[a.accNo]), [allAccounts, freezes]);
  const member = useMemo(() => acc ? (window.DEP_TXN_MEMBERS || []).find(m => m.code === acc.member) || null : null, [acc]);
  const rec = acc ? freezes[acc.accNo] : null;
  const tdef = rec ? atmFreezeType(rec.type) : null;

  useEffect(() => { setNote(''); setSlip(null); }, [acc && acc.accNo]);

  const canSubmit = !!acc && !!rec;
  const reset = () => { setAcc(null); setNote(''); setSlip(null); };

  const submit = () => {
    if (!canSubmit) { onToast && onToast('กรุณาเลือกบัญชี ATM ที่ถูกอายัดอยู่'); return; }
    const reqId = 'ATU' + String(Date.now()).slice(-6);
    const date = new Date().toISOString().slice(0, 10);
    const next = { ...freezes }; delete next[acc.accNo];
    setFreezes(next); atmFrzSave(next);
    audit.log({ action: 'update', module: 'เงินฝาก — ยกเลิกอายัดบัญชี ATM',
      target: `${acc.accNo} · ${acc.name}`,
      summary: `ยกเลิกอายัด ATM ${acc.accNo} (เดิม: ${tdef?.code} ${tdef?.label})${note.trim() ? ' — ' + note.trim() : ''}`,
      changes: [{ field: 'สถานะอายัด ATM', before: `${tdef?.code} ${tdef?.label}`, after: 'ปกติ (ยกเลิกอายัด)' }] });
    setSlip({
      title: 'ใบยกเลิกอายัดบัญชีเงินฝาก ATM', sub: `เลขที่คำขอ ${reqId} · วันที่ ${fmt.date(date)}`,
      rows: [
        { k: 'เลขที่บัญชี', v: acc.accNo, mono: true },
        { k: 'ชื่อบัญชี', v: acc.name },
        { k: 'สมาชิก', v: `${acc.member} · ${member?.name || acc.name}` },
        { k: 'ประเภทการอายัดเดิม', v: `${tdef?.code} ${tdef?.label}` },
        ...(rec.mode === 'partial' ? [{ k: 'จำนวนเงินที่อายัดเดิม', v: fmt.money(rec.amount || 0, 2) + ' บาท (บางส่วน)', mono: true }] : [{ k: 'รูปแบบการอายัดเดิม', v: 'อายัดทั้งบัญชี' }]),
        { k: 'สาเหตุการอายัดเดิม', v: rec.reason },
        { k: 'อายัดเมื่อ', v: fmt.date(rec.date) },
        ...(note.trim() ? [{ k: 'หมายเหตุการยกเลิก', v: note.trim() }] : []),
        { k: 'สถานะ', v: 'ยกเลิกอายัด — บัญชีกลับสู่สถานะปกติ', strong: true },
      ],
      foot: 'ระบบเปิดให้ทำรายการผ่านบัตร ATM สำหรับบัญชีนี้ได้ตามปกติ',
    });
    onToast && onToast(`ยกเลิกอายัดบัญชี ATM ${acc.accNo} เรียบร้อยแล้ว`);
    setAcc(null);
  };

  return (
    <div data-screen-label="หน้ายกเลิกอายัดบัญชีเงินฝาก ATM" className="dep-open">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ยกเลิกอายัดบัญชีเงินฝาก ATM</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ปลดล็อกบัญชี ATM ที่ถูกอายัด เพื่อให้ทำรายการผ่านบัตรได้ตามปกติ</div>
        </div>
        <span className="spacer" />
        <div className="dep-open-toolbar">
          <button className="btn sm" onClick={reset}><Icon name="plus" /> เริ่มใหม่</button>
          {slip && <button className="btn sm" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์เอกสาร</button>}
          <button className="btn primary sm" disabled={!canSubmit} onClick={submit}><Icon name="unlock" /> ยกเลิกอายัด</button>
        </div>
      </div>

      {frozenAccounts.length === 0 && !acc ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ marginBottom: 6 }}><Icon name="unlock" size={26} /></div>
          ไม่มีบัญชี ATM ที่ถูกอายัดอยู่ในขณะนี้
        </div>
      ) : (
        <>
          {rec && (
            <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)' }}>
              <Icon name="lock" size={14} />
              <span>บัญชีนี้<b>ถูกอายัดอยู่</b> — {tdef?.code} {tdef?.label}{rec.mode === 'partial' ? ` · บางส่วน ${fmt.money(rec.amount || 0, 2)} บาท` : ' · ทั้งบัญชี'} · สาเหตุ: {rec.reason} · อายัดโดย {rec.by} เมื่อ {fmt.date(rec.date)}</span>
            </div>
          )}

          <AtmFrzAccountCard acc={acc} member={member}>
            <DatFieldLite label="เลขที่บัญชี (เฉพาะที่ถูกอายัด)" required>
              <DepAccountSearchField accounts={frozenAccounts} value={acc} onPick={setAcc} placeholder="คลิกเพื่อค้นหาบัญชี ATM ที่ถูกอายัด…" />
            </DatFieldLite>
          </AtmFrzAccountCard>

          <div className="search-card dat-section">
            <DepSecHead icon="unlock" n="2" title="รายละเอียดการยกเลิกอายัด" sub="ตรวจสอบการอายัดเดิมและระบุหมายเหตุ (ถ้ามี)" />
            <div className="dat-grid g3">
              <DatFieldLite label="ประเภทการอายัดเดิม"><div className="cfg-display-box">{rec ? `${tdef?.code} ${tdef?.label}` : '—'}</div></DatFieldLite>
              <DatFieldLite label="รูปแบบ / จำนวนที่อายัด"><div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{rec ? (rec.mode === 'partial' ? 'บางส่วน · ' + fmt.money(rec.amount || 0, 2) + ' บาท' : 'ทั้งบัญชี') : '—'}</div></DatFieldLite>
              <DatFieldLite label="สาเหตุการอายัดเดิม"><div className="cfg-display-box">{rec ? rec.reason : '—'}</div></DatFieldLite>
              <DatFieldLite label="หมายเหตุการยกเลิก" span={3}>
                <input className="cfg-input" value={note} disabled={!acc} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุประกอบการยกเลิกอายัด (ถ้ามี)" />
              </DatFieldLite>
            </div>
          </div>

          <AtmFrzMemberCard acc={acc} member={member} frozenAmount={rec ? (rec.mode === 'partial' ? (rec.amount || 0) : (acc?.balance || 0)) : 0} />
        </>
      )}

      {slip && <div className="dep-slip-host"><DepSlip {...slip} /></div>}
    </div>
  );
}

Object.assign(window, { DepAtmFreezePage, DepAtmUnfreezePage });
