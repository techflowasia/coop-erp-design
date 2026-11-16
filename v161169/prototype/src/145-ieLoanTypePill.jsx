// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ประมาณการดอกเบี้ย
//  แสดงข้อมูลประมาณการดอกเบี้ยของสมาชิกสหกรณ์ (การรับชำระจากสมาชิก)
//  ค้นหาสมาชิก → เลือกรหัสรายการ → กำหนดดอกเบี้ยถึงวันที่ → ดาวน์โหลด PDF
// ════════════════════════════════════════════════════════════════════

const ieLoanTypePill = (s) => {
  if (s === 'กู้สามัญ')  return <span className="pill info">กู้สามัญ</span>;
  if (s === 'กู้ฉุกเฉิน') return <span className="pill warn">กู้ฉุกเฉิน</span>;
  if (s === 'กู้พิเศษ')  return <span className="pill ok">กู้พิเศษ</span>;
  return <span className="pill neutral">{s}</span>;
};

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// รหัสสมาชิก · ชื่อ · นามสกุล · เลขที่บัตรประชาชน
function IeMemberSearchModal({ onPick, onClose }) {
  const [c, setC] = useState({ code: '', firstName: '', lastName: '', citizenId: '' });
  const [results, setResults] = useState(() => window.GUAR_MEMBERS);
  const set = (k, v) => setC((p) => ({ ...p, [k]: v }));
  const run = () => setResults(window.searchGuarMembers(c));
  const reset = () => { setC({ code: '', firstName: '', lastName: '', citizenId: '' }); setResults(window.GUAR_MEMBERS); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal">
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="search" /></div>
          <h2>ค้นหาสมาชิก</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="gc-search-grid lb-search-grid">
            <label className="gc-sf">
              <span>1. รหัสสมาชิก</span>
              <input value={c.code} onChange={(e) => set('code', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เช่น M-058241" className="mono" autoFocus />
            </label>
            <label className="gc-sf">
              <span>2. ชื่อ</span>
              <input value={c.firstName} onChange={(e) => set('firstName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="ชื่อจริง" />
            </label>
            <label className="gc-sf">
              <span>3. นามสกุล</span>
              <input value={c.lastName} onChange={(e) => set('lastName', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="นามสกุล" />
            </label>
            <label className="gc-sf">
              <span>4. เลขที่บัตรประชาชน</span>
              <input value={c.citizenId} onChange={(e) => set('citizenId', e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="เลขบัตรประชาชน" className="mono" />
            </label>
            <div className="gc-sf-actions" style={{ gridColumn: 'span 4' }}>
              <button className="btn primary" onClick={run}><Icon name="search" /> ค้นหา</button>
              <button className="btn" onClick={reset}><Icon name="refresh" /> ล้าง</button>
            </div>
          </div>

          <div className="gc-sub-title" style={{ marginTop: 4 }}>
            รายชื่อสมาชิก <span className="muted" style={{ fontWeight: 400 }}>· พบ {results.length} รายการ</span>
          </div>
          <div className="table-wrap"><div className="table-scroll" style={{ maxHeight: 300 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>รหัสสมาชิก</th>
                  <th>ชื่อ</th>
                  <th>นามสกุล</th>
                  <th>เลขที่บัตรประชาชน</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">ไม่พบสมาชิกที่ตรงกับเงื่อนไข</td></tr>
                ) : results.map((m) => (
                  <tr key={m.code} className="clickable" onClick={() => onPick(m)}>
                    <td className="mono">{m.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{m.firstName.slice(0, 1)}</span>
                        <span>{m.title}{m.firstName}</span>
                      </div>
                    </td>
                    <td>{m.lastName}</td>
                    <td className="mono">{m.citizenId}</td>
                    <td className="center">
                      <button className="btn ghost sm" style={{ padding: '0 6px' }}
                              onClick={(e) => { e.stopPropagation(); onPick(m); }} title="เลือกสมาชิก">
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

// ─── หน้าหลัก: ประมาณการดอกเบี้ย ────────────────────────────────────
function InterestEstimatePage({ onToast }) {
  const workDate = window.DEPOSIT_WORKING_DATE;
  const [member, setMember] = useState(null);
  const [modalOpen, setModal] = useState(false);
  const [txCode, setTxCode] = useState('PX');
  const [toDate, setToDate] = useState('2026-06-30');

  const est = member ? window.INTEREST_ESTIMATE[member.code] : null;

  const pick = (m) => {
    setMember(m); setModal(false);
    const e = window.INTEREST_ESTIMATE[m.code];
    if (e) { setTxCode(e.txCode || 'PX'); setToDate(e.interestToDate || workDate); }
  };

  // คำนวณทุกบรรทัดตาม "ดอกเบี้ยถึงวันที่"
  const rows = (est?.debts || []).map((d) => window.calcInterestRow(d, toDate));
  const sum = rows.reduce((a, r) => ({
    principal: a.principal + r.principal,
    interestDue: a.interestDue + r.interestDue,
    payPrincipal: a.payPrincipal + r.payPrincipal,
    payInterest: a.payInterest + r.interestDue,
    totalPay: a.totalPay + r.totalPay,
    remaining: a.remaining + r.remainingPrincipal,
  }), { principal: 0, interestDue: 0, payPrincipal: 0, payInterest: 0, totalPay: 0, remaining: 0 });

  // ดาวน์โหลด PDF — เปิดกล่องพิมพ์ของเบราว์เซอร์ (Save as PDF)
  const downloadPdf = () => {
    document.documentElement.classList.add('ie-printing');
    const cleanup = () => {
      document.documentElement.classList.remove('ie-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => { window.print(); }, 60);
    onToast && onToast('กำลังเตรียมเอกสาร PDF — เลือก “บันทึกเป็น PDF” ในกล่องพิมพ์');
  };

  return (
    <div data-screen-label="หน้าประมาณการดอกเบี้ย" className="ie-page">
      <div className="page-actions ie-noprint">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ประมาณการดอกเบี้ย
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            แสดงข้อมูลประมาณการดอกเบี้ยของสมาชิก — คำนวณตามจำนวนวันจริงถึงวันที่ที่กำหนด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={downloadPdf} disabled={!member}>
          <Icon name="download" /> ดาวน์โหลดเป็น PDF
        </button>
      </div>

      {/* หัวเอกสารสำหรับพิมพ์เท่านั้น */}
      <div className="ie-print-head">
        <CoopLetterheadBlock />
        <div className="ie-ph-title">ใบประมาณการดอกเบี้ย · การรับชำระจากสมาชิก</div>
        <div className="ie-ph-meta">
          <span>สมาชิก: {member ? `${member.code} · ${member.name}` : '—'}</span>
          <span>ดอกเบี้ยถึงวันที่: {fmt.date(toDate)}</span>
          <span>รหัสรายการ: {txCode}</span>
        </div>
      </div>

      {/* ── การ์ด: การรับชำระจากสมาชิก + การ์ดยอดรวม ── */}
      <div className="po-top-grid" style={{ marginBottom: 0 }}>
      <div className="search-card icr-sec" style={{ margin: 0 }}>
        <div className="section-head" style={{ marginBottom: 14 }}>
          <span className="head-bar" />
          <h3>การรับชำระจากสมาชิก</h3>
        </div>

        {/* แถวข้อมูลสมาชิก — กริด 3 คอลัมน์ × 2 แถว (ข้อมูลสมาชิก → เงื่อนไขประมาณการ) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px 18px' }}>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">เลขสมาชิก</span>
            <div className="lrq-member-search ie-noprint">
              <ErpMemberPicker
                member={member ? { code: member.code, name: member.name, dept: member.unit } : null}
                onPick={pick} title="ค้นหาสมาชิก — ประมาณการดอกเบี้ย"
                placeholder="เลขสมาชิก…" />
            </div>
            <span className="ie-print-only mono">{member ? member.code : '—'}</span>
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">ชื่อ-นามสกุล</span>
            <div className={'icr-ro' + (member ? '' : ' empty')}>{member ? member.name : '—'}</div>
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">สังกัด</span>
            <div className={'icr-ro' + (member ? '' : ' empty')}>{member ? member.unit : '—'}</div>
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">ทุนเรือนหุ้น</span>
            <div className={'icr-ro mono num' + (member ? '' : ' empty')}>{member ? fmt.money(member.share.capital, 2) : '—'}</div>
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">รหัสรายการ</span>
            <select className="filter-select lb-select ie-select" style={{ height: 32, minHeight: 32 }} value={txCode}
                    disabled={!member}
                    onChange={(e) => setTxCode(e.target.value)}>
              {window.INTEREST_TX_CODES.map((t) => (
                <option key={t.code} value={t.code}>{t.label}</option>
              ))}
            </select>
            <span className="ie-print-only">{txCode}</span>
          </div>
          <div className="icr-fld" style={{ minWidth: 0 }}>
            <span className="icr-fld-l">ดอกเบี้ยถึงวันที่</span>
            <ErpDate value={toDate} onChange={(v) => ((e) => setToDate(e.target.value))({ target: { value: v } })} disabled={!member} className="cfg-input ie-date ie-noprint" />
            <span className="ie-print-only">{fmt.date(toDate)}</span>
          </div>
        </div>
      </div>

        <div className="po-total-card">
          <div className="po-total-head"><span>จำนวนรวมทั้งหมด</span></div>
          <div className="po-total-value">{fmt.money(sum.totalPay, 2)}</div>
          <div className="po-total-unit">บาท</div>
          <div className="po-total-break">
            <div><span>รวมชำระต้น</span><b>{fmt.money(sum.payPrincipal, 2)}</b></div>
            <div><span>รวมชำระดอกเบี้ย</span><b>{fmt.money(sum.payInterest, 2)}</b></div>
          </div>
        </div>
      </div>

      {/* ── การ์ด: รายการหนี้ ── */}
      {member ? (
        <div className="search-card" style={{ marginTop: 12 }}>
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" />
            <h3>รายการหนี้</h3>
            <span className="gc-count">{rows.length} สัญญา</span>
          </div>

          {rows.length === 0 ? (
            <div className="gc-empty">— ไม่พบรายการหนี้ของสมาชิกรายนี้ —</div>
          ) : (
            <div className="table-wrap"><div className="table-scroll">
              <table className="tbl ie-table">
                <thead>
                  <tr>
                    <th rowSpan="2">เลขสัญญา</th>
                    <th rowSpan="2" className="num">เงินต้น</th>
                    <th colSpan="2" className="center ie-grp">ดอกเบี้ย</th>
                    <th colSpan="3" className="center ie-grp">การชำระ</th>
                    <th rowSpan="2" className="num ie-grp">รวมชำระ</th>
                    <th rowSpan="2" className="num">เงินต้นคงเหลือ</th>
                  </tr>
                  <tr>
                    <th className="center ie-grp">ตั้งแต่</th>
                    <th className="num">ดอกเบี้ยที่ต้องชำระ</th>
                    <th className="center ie-grp">งวด</th>
                    <th className="num">เงินต้น</th>
                    <th className="num">ดอกเบี้ย</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.contractNo}>
                      <td>
                        <div className="mono">{r.contractNo}</div>
                        <div className="ie-noprint" style={{ marginTop: 3 }}>{ieLoanTypePill(r.loanType)}</div>
                      </td>
                      <td className="num">{fmt.money(r.principal, 0)}</td>
                      <td className="center mono ie-grp">{fmt.date(r.interestFrom)}</td>
                      <td className="num">{fmt.money(r.interestDue)}</td>
                      <td className="center mono ie-grp">{r.period}</td>
                      <td className="num">{fmt.money(r.payPrincipal, 0)}</td>
                      <td className="num">{fmt.money(r.interestDue)}</td>
                      <td className="num ie-grp"><b>{fmt.money(r.totalPay)}</b></td>
                      <td className="num">{fmt.money(r.remainingPrincipal, 0)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="right">รวมทั้งหมด</td>
                    <td className="num">{fmt.money(sum.principal, 0)}</td>
                    <td className="ie-grp" />
                    <td className="num">{fmt.money(sum.interestDue)}</td>
                    <td className="ie-grp" />
                    <td className="num">{fmt.money(sum.payPrincipal, 0)}</td>
                    <td className="num">{fmt.money(sum.payInterest)}</td>
                    <td className="num ie-grp"><b>{fmt.money(sum.totalPay)}</b></td>
                    <td className="num">{fmt.money(sum.remaining, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div></div>
          )}

          <div className="ie-foot-note muted ie-noprint">
            <Icon name="info" size={12} /> ดอกเบี้ยคำนวณจากเงินต้นคงเหลือ × อัตราดอกเบี้ยต่อปี ตามจำนวนวันจริงถึง “ดอกเบี้ยถึงวันที่”
          </div>
        </div>
      ) : (
        <div className="search-card gc-placeholder" style={{ marginTop: 12 }}>
          <div className="gc-ph-ico"><Icon name="money" size={26} /></div>
          <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
          <div className="gc-ph-sub">
            ค้นหาและเลือกสมาชิกด้วยเลขที่สมาชิก เพื่อแสดงประมาณการดอกเบี้ยและรายการหนี้
          </div>
        </div>
      )}

      {modalOpen && <IeMemberSearchModal onPick={pick} onClose={() => setModal(false)} />}
    </div>
  );
}

Object.assign(window, { InterestEstimatePage });
