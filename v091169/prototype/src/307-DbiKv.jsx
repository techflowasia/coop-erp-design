// ═════════════════════════════════════════════════════════════════
//  ข้อมูลพื้นฐาน (บัญชีเงินฝาก) — DepBasicInfoPage
//  ระบบเงินฝาก › เมนูเรียกดูข้อมูล (อ่านอย่างเดียว)
//  โครง: ทะเบียนบัญชี (ตารางค้นหา) → รายละเอียดบัญชี (DS record detail)
//  แท็บ: Statement · ต้นเงินฝากประจำ · ผู้ฝากร่วม · ตัวอย่างลายมือ
// ═════════════════════════════════════════════════════════════════

function DbiKv({ label, value, mono, tone }) {
  return (
    <div className="icr-kv">
      <span className="icr-kv-k">{label}</span>
      <span className={'icr-kv-v' + (mono ? ' mono' : '')} style={tone ? { color: tone } : null}>
        {value === '' || value == null ? <span className="muted">—</span> : value}
      </span>
    </div>
  );
}

const DBI_TABS = [
  { id: 'stm',   label: 'Statement' },
  { id: 'fixed', label: 'ต้นเงินฝากประจำ' },
  { id: 'codep', label: 'ผู้ฝากร่วม' },
  { id: 'sign',  label: 'ตัวอย่างลายมือ' },
];

// ─── รายละเอียดบัญชี ────────────────────────────────────────────────
//  acc === null → แสดงโครงหน้าทั้งหมดพร้อมค่าว่าง (เหมือนเมนูทะเบียนสมาชิก)
function DbiDetail({ acc, accounts, onPickAcc, onToast }) {
  const [tab, setTab] = useState('stm');
  const a = acc || {};
  const st = acc ? ((window.DEP_BASIC_STATUS || {})[acc.status] || { l: acc.status, pill: 'neutral' }) : { l: '—', pill: 'neutral' };
  const stm = useMemo(() => acc ? window.depBasicStatement(acc) : [], [acc]);
  const fixed = a.fixed || [];
  const coDep = a.coDep || [];
  const sign = a.sign || [];
  const mv = (v) => acc ? fmt.money(v, 2) : '—';

  return (
    <div data-screen-label="รายละเอียดบัญชีเงินฝาก">
      <div className="page-actions">
        <div style={{ flex: '1 1 360px', maxWidth: 520, minWidth: 0 }}>
          {window.DepAccountSearchField && (
            <window.DepAccountSearchField accounts={accounts} value={acc} onPick={onPickAcc}
                                          placeholder="คลิกเพื่อค้นหาเลขที่บัญชี…" />
          )}
        </div>
        <span className="spacer" />
        {acc && (
          <button className="btn sm" onClick={() => onToast && onToast('กำลังพิมพ์ข้อมูลพื้นฐานบัญชี ' + acc.accNo)}>
            <Icon name="print" /> พิมพ์ข้อมูลบัญชี
          </button>
        )}
      </div>

      {/* การ์ดหัวเรื่อง */}
      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="wallet" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className={'lt-head-title' + (acc ? '' : ' muted')}>{acc ? a.acctName : 'ยังไม่ได้เลือกบัญชีเงินฝาก'}</h1>
            <div className="lt-head-meta">
              <span className="mono">{acc ? a.accNo : '—'}</span><span className="dot" />
              <span>{acc ? a.type : '—'}</span><span className="dot" />
              <span>ทะเบียนสมาชิก <span className="mono">{acc ? a.member : '—'}</span></span><span className="dot" />
              <span>{acc ? a.dept : '—'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <span className={'pill ' + st.pill} style={{ height: 24 }}>{st.l}</span>
            <span className="chip info">อัตรา {acc ? fmt.money(a.rate, 2) : '0.00'}% ต่อปี</span>
          </div>
        </div>
        <div className="lt-head-dates">
          <div className="lt-date">
            <span className="lt-date-k">ยอดคงเหลือ</span>
            <span className="lt-date-v mono">{mv(a.balance)}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">วันเปิดบัญชี</span>
            <span className="lt-date-v">{acc ? fmt.date(a.openDate) : '—'}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">เคลื่อนไหวล่าสุด</span>
            <span className="lt-date-v">{acc ? fmt.date(a.lastMovement) : '—'}</span>
          </div>
          <div className="lt-date">
            <span className="lt-date-k">สมุด PB / Cert.</span>
            <span className="lt-date-v mono">{acc ? a.pb : '—'}</span>
          </div>
        </div>
      </div>

      {/* 1) ข้อมูลพื้นฐาน */}
      <div className="search-card" style={{ marginTop: 12, marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ข้อมูลพื้นฐาน</h3></div>
        <div className="lt-grid">
          <div>
            <DbiKv label="เลขที่บัญชี" value={a.accNo} mono />
            <DbiKv label="PB / Cert." value={a.pb} mono />
            <DbiKv label="เลขบัตร / Tax ID" value={a.citizenId} mono />
            <DbiKv label="ทะเบียนสมาชิก" value={a.member} mono />
            <DbiKv label="สังกัด" value={acc ? (a.dept + (a.deptCode ? ' · ' + a.deptCode : '')) : ''} />
          </div>
          <div>
            <DbiKv label="ชื่อบัญชี" value={a.acctName} />
            <DbiKv label="ชื่อโครงการ" value={acc ? <span><span className="mono muted">{a.projectCode}</span> {a.projectName}</span> : ''} />
            <DbiKv label="ประเภทบัญชี" value={acc ? <span><span className="mono muted">{a.typeCode}</span> {a.type}</span> : ''} />
            <DbiKv label="ชื่อ นามสกุล" value={a.name} />
          </div>
        </div>
      </div>

      {/* 2) รายละเอียดบัญชี + การรับดอกเบี้ย */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>รายละเอียดบัญชี</h3></div>
        <div className="lt-grid">
          <div>
            <DbiKv label="วันเปิดบัญชี" value={acc ? fmt.date(a.openDate) : ''} mono />
            <DbiKv label="ปิดบัญชีเมื่อ" value={a.closeDate ? fmt.date(a.closeDate) : ''} mono />
            <DbiKv label="ฝากรายเดือน" value={a.monthlyDeposit ? fmt.money(a.monthlyDeposit, 2) : ''} mono />
            <DbiKv label="Map KTB" value={a.mapKTB} mono />
            {acc && a.mapKTB && a.mapKTBDate && <DbiKv label="วันที่ผูกบัญชี" value={fmt.date(a.mapKTBDate)} mono />}
            <DbiKv label="บรรทัด STM." value={acc ? fmt.int(a.stmLine) : ''} mono />
            <DbiKv label="ต้นเงินล่าสุด" value={acc ? fmt.money(a.lastPrincipal, 2) : ''} mono />
            <DbiKv label="จำนวนครั้งถอน" value={acc ? fmt.int(a.withdrawCount) + ' ครั้ง' : ''} mono />
          </div>
          <div>
            <div className="dbi-sub">การรับดอกเบี้ย</div>
            <DbiKv label="อัตราดอกเบี้ย" value={acc ? fmt.money(a.rate, 2) + '% ต่อปี' : ''} mono />
            <DbiKv label="ภาษีหัก ณ ที่จ่าย"
                   value={acc ? (window.depTaxRate(a.typeCode) ? (window.depTaxRate(a.typeCode) * 100).toFixed(0) + '%' : 'ไม่หักภาษี') : ''} mono />
            <div className="dbi-note">
              <span className="dbi-note-k">การรับ Int. / Div.</span>
              <p>{acc ? a.intReceive : <span className="muted">—</span>}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3) เงื่อนไขการถอน + สถานะบัญชี */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>เงื่อนไขการถอนและสถานะบัญชี</h3></div>
        <div className="lt-grid">
          <div className="dbi-note">
            <span className="dbi-note-k">เงื่อนไขการถอน</span>
            <p>{acc ? a.withdrawCond : <span className="muted">—</span>}</p>
          </div>
          <div className="dbi-note">
            <span className="dbi-note-k">สถานะบัญชี</span>
            <p>{acc ? a.statusNote : <span className="muted">—</span>}</p>
          </div>
        </div>
      </div>

      {/* 4) ยอดเงิน */}
      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>ยอดเงิน</h3></div>
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th className="num">ยอดยกมา</th>
                <th className="num">ยอดคงเหลือ</th>
                <th className="num">ยอดถอนได้</th>
                <th className="num">ยอดในสมุด</th>
                <th className="num">เช็คเรียกเก็บ</th>
                <th className="num">Int. / Div. สะสม</th>
                <th className="center">เคลื่อนไหวล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="num mono">{mv(a.carryForward)}</td>
                <td className="num mono"><b>{mv(a.balance)}</b></td>
                <td className="num mono">{mv(a.withdrawable)}</td>
                <td className="num mono">{mv(a.bookBalance)}</td>
                <td className="num mono">{mv(a.chequeCollect)}</td>
                <td className="num mono">{mv(a.intDivAccum)}</td>
                <td className="center mono">{acc ? fmt.date(a.lastMovement) : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div></div>
      </div>

      {/* 5) แท็บรายการประกอบ */}
      <div className="tabs-container">
        <div className="tabs-bar" style={{ flexWrap: 'wrap' }}>
          {DBI_TABS.map(t => {
            const n = t.id === 'stm' ? stm.length : t.id === 'fixed' ? fixed.length : t.id === 'codep' ? coDep.length : sign.length;
            return (
              <button key={t.id} className={'tab' + (t.id === tab ? ' active' : '')} onClick={() => setTab(t.id)}>
                {t.label}<span className="count">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="tab-panel">
          {!acc ? (
            <div className="search-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div className="muted" style={{ fontSize: 13 }}>ยังไม่ได้เลือกบัญชีเงินฝาก — ค้นหาและเลือกบัญชีจากช่องด้านบนเพื่อแสดงข้อมูล</div>
            </div>
          ) : tab === 'stm' && (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 56 }}>ลำดับ</th>
                    <th className="center" style={{ width: 100 }}>วันที่ระบบ</th>
                    <th>รายการ</th>
                    <th>อ้างอิง</th>
                    <th className="num">ถอน</th>
                    <th className="num">ฝาก</th>
                    <th className="num">ยอดคงเหลือ</th>
                    <th className="num">Div สะสม</th>
                    <th>ผู้บันทึก</th>
                  </tr>
                </thead>
                <tbody>
                  {stm.length === 0 ? (
                    <tr><td colSpan="9" className="empty-state">— ไม่มีรายการเคลื่อนไหว —</td></tr>
                  ) : stm.map(r => (
                    <tr key={r.seq}>
                      <td className="center mono">{r.seq}</td>
                      <td className="center mono">{fmt.date(r.date)}</td>
                      <td>{r.desc}</td>
                      <td className="mono">{r.ref}</td>
                      <td className="num mono">{r.wd ? fmt.money(r.wd, 2) : <span className="muted">—</span>}</td>
                      <td className="num mono">{r.dp ? fmt.money(r.dp, 2) : <span className="muted">—</span>}</td>
                      <td className="num mono">{fmt.money(r.bal, 2)}</td>
                      <td className="num mono">{r.div ? fmt.money(r.div, 2) : <span className="muted">—</span>}</td>
                      <td>{r.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          )}

          {acc && tab === 'fixed' && (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl" style={{ minWidth: 940 }}>
                <thead>
                  <tr>
                    <th className="center" style={{ width: 68 }}>ต้นเงิน</th>
                    <th className="num">จำนวนต้นเงิน</th>
                    <th className="num">คงเหลือ</th>
                    <th className="center">วันที่ต้นเงิน</th>
                    <th className="center">วันครบกำหนด</th>
                    <th className="center">ทำรายการล่าสุด</th>
                    <th className="num">Int. ค้าง</th>
                    <th className="num">ยอดจ่าย Int.</th>
                    <th className="num">ยอดภาษี</th>
                  </tr>
                </thead>
                <tbody>
                  {fixed.length === 0 ? (
                    <tr><td colSpan="9" className="empty-state">— บัญชีนี้ไม่มีต้นเงินฝากประจำ —</td></tr>
                  ) : (
                    <>
                      {fixed.map(f => (
                        <tr key={f.no}>
                          <td className="center mono">{f.no}</td>
                          <td className="num mono">{fmt.money(f.amount, 2)}</td>
                          <td className="num mono">{fmt.money(f.balance, 2)}</td>
                          <td className="center mono">{fmt.date(f.startDate)}</td>
                          <td className="center mono">{fmt.date(f.dueDate)}</td>
                          <td className="center mono">{fmt.date(f.lastTxn)}</td>
                          <td className="num mono">{fmt.money(f.intAccrued, 2)}</td>
                          <td className="num mono">{f.intPaid ? fmt.money(f.intPaid, 2) : <span className="muted">—</span>}</td>
                          <td className="num mono">{fmt.money(f.tax, 2)}</td>
                        </tr>
                      ))}
                      <tr className="strong">
                        <td className="center">รวม</td>
                        <td className="num mono">{fmt.money(fixed.reduce((s, f) => s + f.amount, 0), 2)}</td>
                        <td className="num mono">{fmt.money(fixed.reduce((s, f) => s + f.balance, 0), 2)}</td>
                        <td colSpan="3" />
                        <td className="num mono">{fmt.money(fixed.reduce((s, f) => s + f.intAccrued, 0), 2)}</td>
                        <td className="num mono">{fmt.money(fixed.reduce((s, f) => s + (f.intPaid || 0), 0), 2)}</td>
                        <td className="num mono">{fmt.money(fixed.reduce((s, f) => s + f.tax, 0), 2)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div></div>
          )}

          {acc && tab === 'codep' && (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th className="center" style={{ width: 56 }}>ลำดับ</th>
                    <th style={{ width: 220 }}>เลขที่อ้างอิง</th>
                    <th>ชื่อ - นามสกุล</th>
                    <th style={{ width: 220 }}>ความเกี่ยวข้อง</th>
                  </tr>
                </thead>
                <tbody>
                  {coDep.length === 0 ? (
                    <tr><td colSpan="4" className="empty-state">— ไม่มีผู้ฝากร่วม —</td></tr>
                  ) : coDep.map((c, i) => (
                    <tr key={i}>
                      <td className="center mono">{i + 1}</td>
                      <td className="mono">{c.ref}</td>
                      <td>{c.name}</td>
                      <td>{c.rel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div>
          )}

          {acc && tab === 'sign' && (
            sign.length === 0 ? (
              <div className="empty-state">— ไม่มีตัวอย่างลายมือชื่อในระบบ —</div>
            ) : (
              <div className="dbi-sign-grid">
                {sign.map((s, i) => (
                  <div className="dbi-sign-card" key={i}>
                    <div className="dbi-sign-head">
                      <span className="dbi-sign-no">ลำดับที่ {i + 1}</span>
                      <span className="chip">{s.role}</span>
                    </div>
                    <div className="dbi-sign-slot">ภาพตัวอย่างลายมือชื่อ (สแกนจากใบคำขอเปิดบัญชี)</div>
                    <DbiKv label="ชื่อผู้มีอำนาจลงนาม" value={s.name} />
                    <DbiKv label="วันที่ให้ตัวอย่าง" value={fmt.date(s.date)} mono />
                    <DbiKv label="เงื่อนไขการลงนาม" value={s.cond} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── หน้าเมนู — ต้องค้นหาเลขที่บัญชีก่อนจึงแสดงข้อมูล ────────────────
function DepBasicInfoPage({ onToast }) {
  const [sel, setSel] = useState(null);
  const all = useMemo(() => window.depBasicAccounts(), []);
  const acc = sel ? all.find(a => a.accNo === sel) || null : null;

  window.useBreadcrumb(
    acc ? [{ label: 'ข้อมูลพื้นฐาน', onClick: () => setSel(null) }, { label: 'รายละเอียดบัญชีเงินฝาก', current: true }]
        : [{ label: 'ข้อมูลพื้นฐาน', current: true }],
    [sel]);

  const examples = all.slice(0, 3);
  return (
    <>
      <DbiDetail acc={acc} accounts={all} onToast={onToast}
                 onPickAcc={(a) => setSel(a.accNo)} />
      {!acc && examples.length > 0 && (
        <div className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 12 }}>
          ตัวอย่างสำหรับสาธิต — เลือกได้จาก{' '}
          {examples.map((a, k) => (
            <React.Fragment key={a.accNo}>
              {k > 0 && ', '}
              <button className="ct-example mono" onClick={() => setSel(a.accNo)}>{a.accNo}</button>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
}

Object.assign(window, { DepBasicInfoPage });
