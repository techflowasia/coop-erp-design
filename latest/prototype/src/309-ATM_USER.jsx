// ════════════════════════════════════════════════════════════════════
//  ระบบเงินฝาก › การทำงาน — ขอผูกบัญชีเงินฝาก KTB
//  เลือกบัญชีเงินฝากที่มีอยู่ → ผูกบัญชีกรุงไทยและเบอร์โทรเพื่อเปิดใช้ ATM
//  สไตล์ตาม Design System (เขียวสหกรณ์ · Sarabun · การ์ดขาว)
// ════════════════════════════════════════════════════════════════════

const ATM_USER = 'จันทร์เพ็ญ มาลี';
const ATM_SUBTYPES = ['ออมทรัพย์ทั่วไป', 'ออมทรัพย์พิเศษ', 'ออมทรัพย์เพื่อการเกษียณ'];

// วันที่เคลื่อนไหวล่าสุด / บัญชีไม่เคลื่อนไหวเกิน 2 ปี (ถ้าโหลด data-dep-counter.js)
const atmLastMove = (a) => (window.dpcLastMove ? window.dpcLastMove(a.accNo, window.depTxnLoadLedger && window.depTxnLoadLedger()) : null);
const atmDormant = (a) => (window.dpcLastMove ? window.dpcIdleDays(atmLastMove(a)) > window.DPC_DORMANT_DAYS : false);

// ─── Popup ค้นหาบัญชีเงินฝาก ─────────────────────────────────────────
function DepAccountSearchModal({ accounts, onPick, onClose, onlyActive = true }) {
  const base = onlyActive ? accounts.filter(a => a.status === 'active') : accounts;
  const memById = (code) => (window.DEP_TXN_MEMBERS || []).find(m => m.code === code);
  // เลขบัตร / เลขผู้เสียภาษี — สมาชิก → ทะเบียนสมาชิก · E/L → ทะเบียนบุคคล/นิติบุคคลภายนอก
  const idOf = (a) => {
    if (a.citizenId) return a.citizenId;
    const mm = memById(a.member); if (mm && mm.citizenId) return mm.citizenId;
    const ml = (window.MEMBERS_LIST || []).find(x => x.code === a.member || String(x.code).replace(/^M-/, '') === a.member);
    if (ml && ml.citizenId) return ml.citizenId;
    const ext = (window.depExtPersonsLoad ? window.depExtPersonsLoad() : (window.DEP_EXT_PERSON_SEED || [])).find(p => p.code === a.member);
    if (ext) return ext.kind === 'juristic' ? (ext.taxId || ext.regNo || '') : (ext.citizenId || '');
    return '';
  };
  const [c, setC] = useState({ accNo: '', code: '', name: '', cid: '' });
  const [rows, setRows] = useState(base);
  const [dirty, setDirty] = useState(false);
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
  const run = () => {
    const an = norm(c.accNo), cd = norm(c.code), nm = norm(c.name), ci = norm(c.cid);
    setRows(base.filter(a =>
      (!an || norm(a.accNo).includes(an)) &&
      (!cd || norm(a.member).includes(cd)) &&
      (!nm || norm(a.name).includes(nm)) &&
      (!ci || norm(idOf(a)).includes(ci))));
    setDirty(true);
  };
  const reset = () => { setC({ accNo: '', code: '', name: '', cid: '' }); setRows(base); setDirty(false); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 900 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาบัญชีเงินฝาก</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. เลขที่บัญชี</span>
              <input value={c.accNo} onChange={(e) => set('accNo', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น 001-01-58241-00" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. เลขทะเบียนสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น 58241" className="mono" />
            </label>
            <label className="gc-sf">
              <span>3. ชื่อบัญชี</span>
              <input value={c.name} onChange={(e) => set('name', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อ-นามสกุล / ชื่อบัญชี" />
            </label>
            <label className="gc-sf">
              <span>4. เลขบัตรประชาชน</span>
              <input value={c.cid} onChange={(e) => set('cid', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน 13 หลัก" className="mono" />
            </label>
            <div className="gc-sf-actions">
              <button className="btn primary" onClick={run}>ค้นหา</button>
              <button className="btn" onClick={reset}>รีเซ็ต</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายการบัญชีเงินฝาก <span className="muted" style={{ fontWeight: 400 }}>· พบ {rows.length} บัญชี</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 360 }}>
            <table className="tbl cs-tbl">
              <thead>
                <tr>
                  <th>เลขที่บัญชี</th>
                  <th>ประเภทเงินฝาก</th>
                  <th>สมาชิก</th>
                  <th>เลขบัตร / Tax ID</th>
                  <th>ชื่อบัญชี</th>
                  <th className="center">เคลื่อนไหวล่าสุด</th>
                  <th className="num">ยอดคงเหลือ</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state">
                    {dirty ? 'ไม่พบบัญชีที่ตรงกับเงื่อนไข' : 'ระบุเลขที่บัญชี หรือเลขทะเบียนสมาชิก แล้วกดค้นหา'}
                  </td></tr>
                ) : rows.map(a => (
                  <tr key={a.accNo} className="clickable cs-crow" onClick={() => onPick(a)}>
                    <td className="mono">{a.accNo}</td>
                    <td>{a.type}</td>
                    <td className="mono muted">{a.member}</td>
                    <td className="mono muted">{idOf(a) || '—'}</td>
                    <td>{a.name}</td>
                    <td className="center mono" style={atmDormant(a) ? { color: 'var(--danger)', fontWeight: 700 } : undefined}>{atmLastMove(a) ? fmt.date(atmLastMove(a)) : '—'}</td>
                    <td className="num mono">{fmt.money(a.balance, 2)}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(a); }} title="เลือกบัญชี">
                        <Icon name="chevRight" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </div>
      </div>
    </>
  );
}

// ─── Trigger field — ปุ่มเรียก popup ค้นหาบัญชี ──────────────────────
function DepAccountSearchField({ accounts, value, onPick, placeholder = 'คลิกเพื่อค้นหาเลขที่บัญชี…' }) {
  const [open, setOpen] = useState(false);
  const pick = (a) => { onPick(a); setOpen(false); };
  return (
    <>
      <button type="button" className="gc-member-trigger lb-trigger" onClick={() => setOpen(true)}>
        {value ? (
          <>
            <Icon name="wallet" size={14} />
            <span className="gc-mt-code mono">{value.accNo}</span>
            <span className="gc-mt-name" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.member} · {value.name}</span>
            <span className="lb-change"><Icon name="search" size={13} /> เปลี่ยน</span>
          </>
        ) : (
          <>
            <Icon name="search" size={14} />
            <span className="muted" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }} title={placeholder}>{placeholder}</span>
            <span className="gc-dots" style={{ marginLeft: 'auto', flex: '0 0 auto' }}>…</span>
          </>
        )}
      </button>
      {open && <DepAccountSearchModal accounts={accounts} onPick={pick} onClose={() => setOpen(false)} />}
    </>
  );
}

// ─── ช่องเลขที่บัญชี: พิมพ์ค้นหาอัตโนมัติ + ปุ่มเปลี่ยน (popup) ─────────
function DepAccountNoField({ accounts, value, onPick, tint, placeholder = 'คลิกเพื่อค้นหาเลขที่บัญชี…' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value ? value.accNo : '');
  useEffect(() => { setQ(value ? value.accNo : ''); }, [value && value.accNo]);
  const digits = (s) => String(s ?? '').replace(/[^0-9]/g, '');
  const onType = (txt) => {
    setQ(txt);
    const d = digits(txt);
    if (d.length < 4) { if (!txt.trim() && value) onPick(null); return; }
    const hits = accounts.filter(a => a.status === 'active' && digits(a.accNo).includes(d));
    if (hits.length === 1) { if (!value || value.accNo !== hits[0].accNo) onPick(hits[0]); }
  };
  return (
    <>
      {value ? (
        <button type="button" className="gc-member-trigger lb-trigger dpc-accno-picked" onClick={() => setOpen(true)}
                style={tint ? { color: tint, borderColor: `color-mix(in srgb, ${tint} 32%, #fff)` } : undefined}>
          <Icon name="wallet" size={14} />
          <span className="gc-mt-code mono dpc-accno-big">{value.accNo}</span>
          <span className="lb-change" style={{ marginLeft: 'auto' }}><Icon name="search" size={13} /> เปลี่ยน</span>
        </button>
      ) : (
      <div className="dpc-accno look">
        <span className="dpc-accno-ico"><Icon name="search" size={14} /></span>
        <input className="cfg-input" value={q} placeholder={placeholder}
               onChange={(e) => onType(e.target.value)}
               onKeyDown={(e) => { if (e.key === 'Enter') setOpen(true); }} />
        <button type="button" className="dpc-accno-dots" onClick={() => setOpen(true)} title="ค้นหาบัญชีจากรายการ" aria-label="ค้นหาบัญชีจากรายการ">…</button>
      </div>
      )}
      {open && <DepAccountSearchModal accounts={accounts} onPick={(a) => { onPick(a); setOpen(false); }} onClose={() => setOpen(false)} />}
    </>
  );
}

function DepAtmOpenPage({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [accounts] = useState(window.depTxnLoadAccounts);

  const [acc, setAcc] = useState(null);
  const [ktbAcc, setKtbAcc] = useState('');
  const [subType, setSubType] = useState(ATM_SUBTYPES[0]);
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [slip, setSlip] = useState(null);

  const member = useMemo(
    () => acc ? (window.DEP_TXN_MEMBERS || []).find(m => m.code === acc.member) || null : null,
    [acc]);

  // เมื่อเลือกบัญชี → รีเซ็ตค่าที่กรอก
  useEffect(() => { setKtbAcc(''); setNote(''); setPhone(''); setSubType(ATM_SUBTYPES[0]); setSlip(null); }, [acc && acc.accNo]);

  const balance = acc?.balance || 0;
  const withdrawable = balance;              // ยอดถอนได้ = ยอดคงเหลือ (สมมติไม่มีอายัด)
  const bookBalance = balance;               // ยอดในสมุด
  const certNo = acc?.certNo || (acc ? '—' : '');
  const citizenId = member?.citizenId || '—';

  const phoneOk = /^\d{9,10}$/.test(phone.replace(/\D/g, ''));
  const ktbOk = ktbAcc.replace(/\D/g, '').length >= 10;
  const canSubmit = !!acc && phoneOk && ktbOk;

  const reset = () => { setAcc(null); setKtbAcc(''); setNote(''); setPhone(''); setSubType(ATM_SUBTYPES[0]); setSlip(null); };

  const validate = () => {
    if (!acc) { onToast && onToast('กรุณาเลือกบัญชีเงินฝากก่อน'); return; }
    if (!ktbOk) { onToast && onToast('กรุณาระบุเลขบัญชีกรุงไทยให้ครบถ้วน'); return; }
    if (!phoneOk) { onToast && onToast('กรุณาระบุเบอร์โทรที่ใช้ผูกบัญชี ATM (บังคับ)'); return; }
    onToast && onToast('ตรวจสอบข้อมูลครบถ้วน — พร้อมบันทึกคำขอเปิดบัญชี ATM');
  };

  const submit = () => {
    if (!canSubmit) { validate(); return; }
    const reqId = 'ATM' + String(Date.now()).slice(-6);
    audit.log({
      action: 'create', module: 'เงินฝาก — ขอเปิดบัญชี ATM',
      target: `${acc.accNo} · ${acc.name}`,
      summary: `ขอเปิดบัญชี ATM ผูกบัญชีกรุงไทย ${ktbAcc} เบอร์ ${phone}`,
      changes: [
        { field: 'บัญชีกรุงไทย', before: '—', after: ktbAcc },
        { field: 'เบอร์โทร', before: '—', after: phone },
      ],
    });
    setSlip({
      title: 'คำขอผูกบัญชีเงินฝาก KTB',
      sub: `เลขที่คำขอ ${reqId} · วันที่ ${fmt.date(new Date().toISOString().slice(0, 10))}`,
      rows: [
        { k: 'เลขที่บัญชี', v: acc.accNo, mono: true },
        { k: 'ชื่อบัญชี', v: acc.name },
        { k: 'ประเภทเงินฝาก', v: acc.type },
        { k: 'ฝากประเภท', v: subType },
        { k: 'บัญชีกรุงไทย (ATM)', v: ktbAcc, mono: true },
        { k: 'สมาชิก', v: `${acc.member} · ${member?.name || acc.name}` },
        { k: 'เบอร์โทร', v: phone, mono: true },
        { k: 'ยอดคงเหลือ', v: fmt.money(balance, 2) + ' บาท', mono: true },
        { k: 'สถานะ', v: 'ส่งคำขอเปิดใช้ ATM แล้ว', strong: true },
      ],
      foot: 'คำขอนี้จะส่งให้ธนาคารกรุงไทยผูกบัญชีเพื่อเปิดใช้บริการ ATM',
    });
    window.depSuccess({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว', desc: 'บันทึกคำขอผูกบัญชีเงินฝาก KTB “' + acc.accNo + '” เรียบร้อยแล้ว' });
  };

  return (
    <div data-screen-label="หน้าขอผูกบัญชีเงินฝาก KTB" className="dep-open">
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
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ขอผูกบัญชีเงินฝาก KTB</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>เลือกบัญชีเงินฝากที่มีอยู่ แล้วผูกบัญชีกรุงไทยและเบอร์โทรเพื่อเปิดใช้บริการ ATM</div>
        </div>
        <span className="spacer" />
        <div className="dep-open-toolbar">
          <button className="btn sm" data-keep-top="" style={{ justifyContent: 'center' }} onClick={reset}>ล้างหน้าจอ</button>
          {slip && <button className="btn sm" data-keep-top="" onClick={() => depPrintSlip(onToast)}><Icon name="print" /> พิมพ์เอกสาร</button>}
          <button className="btn primary sm" data-keep-top="" disabled={!canSubmit} onClick={submit}><Icon name="check" /> บันทึกคำขอ ATM</button>
        </div>
      </div>

      {/* 1 · ข้อมูลบัญชีเงินฝาก */}
      <div className="search-card dat-section">
        <DepSecHead icon="wallet" title="ข้อมูลบัญชีเงินฝาก" sub="ค้นหาและเลือกบัญชีเงินฝากที่ต้องการเปิดใช้ ATM" />
        <div className="dat-grid g2">
          <DatFieldLite label="เลขที่บัญชี" required>
            <DepAccountSearchField accounts={accounts} value={acc}
                              onPick={setAcc} placeholder="คลิกเพื่อค้นหาเลขที่บัญชี / รหัสสมาชิก / ชื่อบัญชี…" />
          </DatFieldLite>
          <DatFieldLite label="ชื่อบัญชี">
            <div className="cfg-display-box">{acc ? acc.name : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="PB / Cert.">
            <div className="cfg-display-box mono">{certNo || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ประเภทเงินฝาก">
            <div className="cfg-display-box">{acc ? acc.type : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="เลขบัตร / Tax ID">
            <div className="cfg-display-box mono">{acc ? citizenId : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ฝากประเภท">
            <select className="cfg-input" value={subType} disabled={!acc} onChange={(e) => setSubType(e.target.value)}>
              {ATM_SUBTYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </DatFieldLite>
          <DatFieldLite label="บัญชีกรุงไทย (ผูก ATM)" required>
            <input className="cfg-input mono" value={ktbAcc} disabled={!acc}
                   onChange={(e) => setKtbAcc(e.target.value)} placeholder="เลขบัญชีกรุงไทย 10 หลัก" />
          </DatFieldLite>
          <DatFieldLite label="หมายเหตุ">
            <input className="cfg-input" value={note} disabled={!acc}
                   onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุประกอบคำขอ (ถ้ามี)" />
          </DatFieldLite>
        </div>
      </div>

      {/* 2 · ข้อมูลสมาชิก */}
      <div className="search-card dat-section">
        <DepSecHead icon="members" title="ข้อมูลสมาชิก" sub="ข้อมูลเจ้าของบัญชีและยอดเงิน (ดึงจากบัญชีที่เลือก)" />
        <div className="dat-grid g2">
          <DatFieldLite label="ทะเบียนสมาชิก">
            <div className="cfg-display-box mono">{acc ? acc.member : '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="ชื่อ - นามสกุล">
            <div className="cfg-display-box">{member?.name || acc?.name || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="สังกัด">
            <div className="cfg-display-box">{member?.dept || acc?.dept || '—'}</div>
          </DatFieldLite>
          <DatFieldLite label="เบอร์โทร">
            <input className={"cfg-input mono" + (acc && !phoneOk && phone ? ' cfg-input-error' : '')}
                   value={phone} disabled={!acc}
                   onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทร (บังคับ) **"
                   style={{ ...(acc ? {} : {}) }} />
            {acc && <div className="dep-atm-req">** จำเป็นต้องระบุเพื่อผูกบัญชี ATM</div>}
          </DatFieldLite>
          <DatFieldLite label="ยอดคงเหลือ">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(balance, 2) : '.00'}</div>
          </DatFieldLite>
          <DatFieldLite label="ยอดถอนได้">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(withdrawable, 2) : '.00'}</div>
          </DatFieldLite>
          <DatFieldLite label="ยอดในสมุด">
            <div className="cfg-display-box mono" style={{ textAlign: 'right' }}>{acc ? fmt.money(bookBalance, 2) : '—'}</div>
          </DatFieldLite>
        </div>
      </div>


      {slip && (
        <div className="dep-slip-host">
          <DepSlip {...slip} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DepAtmOpenPage, DepAccountSearchField, DepAccountNoField, DepAccountSearchModal });
