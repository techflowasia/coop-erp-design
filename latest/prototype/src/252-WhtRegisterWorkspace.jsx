// ════════════════════════════════════════════════════════════════════
//  ระบบงานบัญชี › การทำงาน — ภาษีหัก ณ ที่จ่าย (ทะเบียนการออกหนังสือ 50 ทวิ)
//  ดึงข้อมูลจากใบสำคัญจ่าย (ผู้รับเงินที่ติ๊ก “หัก ณ ที่จ่าย”) มาแสดงตามผู้รับเงิน
// ════════════════════════════════════════════════════════════════════

if (!document.getElementById('wht-card-style')) {
  const st = document.createElement('style');
  st.id = 'wht-card-style';
  st.textContent = '.wht-stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 4px; }'
    + '.wht-stat { background: #fff; border: 1px solid var(--border); border-radius: 6px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; min-width: 0; box-shadow: none; }'
    + '.wht-stat-k { font-size: 12.5px; font-weight: 600; color: var(--text); }'
    + '.wht-stat-v { display: flex; align-items: baseline; gap: 5px; min-width: 0; font-size: 22px; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; font-family: inherit; font-variant-numeric: tabular-nums; }'
    + '.wht-stat-u { flex: 0 0 auto; white-space: nowrap; font-size: 12px; font-weight: 500; color: var(--text-muted); }'
    + '.wht-stat.accent { margin: 0; background: #EAFEF2; border-color: rgba(35,116,80,.35); }'
    + '.wht-stat.accent .wht-stat-k, .wht-stat.accent .wht-stat-v { color: #237450; }'
    + '.wht-filterbar { background: #FAFAFA; border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; }'
    + '.wht-fgrid { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 14px; }'
    + '.wht-fld-date { flex: 0 1 auto; }'
    + '.wht-fld-q { flex: 1 1 240px; }'
    + '.wht-fld-pnd { flex: 0 1 150px; }'
    + '.wht-daterange { flex-wrap: wrap; }'
    + '.wht-fld .cfg-input { height: 32px; width: 100%; min-width: 0; }'
    + '.wht-fld { display: flex; flex-direction: column; gap: 5px; min-width: 0; }'
    + '.wht-fld-lab { font-size: 12px; font-weight: 600; color: var(--text-muted); }'
    + '.wht-daterange { display: flex; align-items: center; gap: 6px; }'
    + '.wht-dr-dash { font-size: 12px; color: var(--text-muted); flex: 0 0 auto; }'
    + '.wht-filterbar .search { height: 32px; min-width: 0; }'
    + '.wht-filterbar .search input { height: 100%; min-width: 0; }'
    + '.wht-filterbar .filter-select { height: 32px; width: 100%; min-width: 0; }'
    + '.wht-factions { display: flex; align-items: center; gap: 8px; margin-top: 12px; }'
    + '.wht-factions .btn { height: 32px; min-width: 92px; padding: 0 14px; justify-content: center; flex: 0 0 auto; }'
    + '.wht-count { margin-left: auto; font-size: 12.5px; color: var(--text-muted); white-space: nowrap; }'
    + '.wht-count b { color: var(--text); }'
    + '@media (max-width: 900px) { .wht-fgrid { grid-template-columns: 1fr; } .wht-count { margin-left: 0; } }'
    + '@media (max-width: 640px) { .wht-stat-row { grid-template-columns: 1fr 1fr; } .wht-stat-v { font-size: 19px; } }';
  document.head.appendChild(st);
}

function WhtRegisterWorkspace({ onToast }) {
  const [vouchers] = useState(() => (window.vchLoadVouchers ? window.vchLoadVouchers() : []));
  const [q, setQ] = useState('');
  const [pndFilter, setPndFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [printPages, setPrintPages] = useState(null);

  const register = React.useMemo(() => window.vchWhtRegister((vouchers || []).filter(v => v.status === 'approved' || v.status === 'paid')), [vouchers]);

  // กรอง
  const filtered = register.filter(e => {
    if (pndFilter !== 'all' && e.cert.pndType !== pndFilter) return false;
    const dd = e.voucher.docDate || '';
    if (dateFrom && dd < dateFrom) return false;
    if (dateTo && dd > dateTo) return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return e.cert.name.toLowerCase().includes(n)
        || (e.cert.taxId || '').includes(n.replace(/\D/g, ''))
        || e.voucher.id.toLowerCase().includes(n);
    }
    return true;
  });

  // จัดกลุ่มตามผู้รับเงิน (ชื่อ + เลขผู้เสียภาษี)
  const groups = React.useMemo(() => {
    const by = {}; const order = [];
    filtered.forEach(e => {
      const k = e.cert.name + '|' + e.cert.taxId;
      if (!by[k]) { by[k] = { name: e.cert.name, taxId: e.cert.taxId, type: e.cert.type, entries: [] }; order.push(k); }
      by[k].entries.push(e);
    });
    return order.map(k => {
      const g = by[k];
      g.totalAmount = g.entries.reduce((s, e) => s + Number(e.cert.totalAmount || 0), 0);
      g.totalTax = g.entries.reduce((s, e) => s + Number(e.cert.totalTax || 0), 0);
      return g;
    });
  }, [filtered]);

  const grandTax = filtered.reduce((s, e) => s + Number(e.cert.totalTax || 0), 0);
  const grandAmount = filtered.reduce((s, e) => s + Number(e.cert.totalAmount || 0), 0);

  const doPrint = (pages) => {
    setPrintPages(pages);
    setTimeout(() => window.printWhtCert(onToast), 90);
  };

  const sectionOf = (cert) => {
    const keys = [...new Set((cert.rows || []).map(r => r.section))];
    return keys.map(k => window.VCH_SECTION_TAG[k] || k).join(' · ');
  };

  return (
    <div data-screen-label="หน้าทะเบียนภาษีหัก ณ ที่จ่าย">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ภาษีหัก ณ ที่จ่าย</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ทะเบียนการออกหนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ) — รวบรวมจากใบสำคัญจ่าย แสดงตามผู้รับเงินเป็นหลัก
          </div>
        </div>
      </div>

      {/* การ์ดสรุป */}
      <div className="wht-stat-row">
        <div className="wht-stat">
          <div className="wht-stat-k">ผู้ถูกหักภาษี</div>
          <div className="wht-stat-v">{groups.length}<span className="wht-stat-u">ราย</span></div>
        </div>
        <div className="wht-stat">
          <div className="wht-stat-k">หนังสือรับรอง (50 ทวิ)</div>
          <div className="wht-stat-v">{filtered.length}<span className="wht-stat-u">ฉบับ</span></div>
        </div>
        <div className="wht-stat">
          <div className="wht-stat-k">รวมเงินที่จ่าย</div>
          <div className="wht-stat-v mono">{fmt.money(grandAmount, 2)}<span className="wht-stat-u">บาท</span></div>
        </div>
        <div className="wht-stat accent">
          <div className="wht-stat-k">รวมภาษีที่หักนำส่ง</div>
          <div className="wht-stat-v mono">{fmt.money(grandTax, 2)}<span className="wht-stat-u">บาท</span></div>
        </div>
      </div>

      <div className="search-card fbt-card" style={{ marginTop: 12 }}>
        <div className="wht-filterbar">
          <div className="wht-fgrid">
            <div className="wht-fld wht-fld-date">
              <label className="wht-fld-lab">วันที่จ่าย</label>
              <div className="wht-daterange">
                <window.ThaiDateField value={dateFrom} onChange={setDateFrom} />
                <span className="wht-dr-dash">ถึง</span>
                <window.ThaiDateField value={dateTo} onChange={setDateTo} />
              </div>
            </div>
            <div className="wht-fld wht-fld-q">
              <input className="cfg-input" value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="ค้นหาชื่อผู้รับเงิน / เลขประจำตัวผู้เสียภาษี / เลขที่ใบสำคัญจ่าย…" />
            </div>
            <div className="wht-fld wht-fld-pnd">
              <select className="filter-select" value={pndFilter} onChange={(e) => setPndFilter(e.target.value)}>
                <option value="all">ทุกแบบยื่น</option>
                {window.VCH_PND_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="wht-factions">
            <button className="btn primary">ค้นหา</button>
            <button className="btn" onClick={() => { setQ(''); setPndFilter('all'); setDateFrom(''); setDateTo(''); }}>รีเซ็ต</button>
            <span className="wht-count">พบ <b>{filtered.length}</b> ฉบับ</span>
          </div>
        </div>

        <div style={{ padding: groups.length ? '10px 12px 14px' : 0 }}>
          {groups.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 12px' }}>
              ยังไม่มีรายการหักภาษี ณ ที่จ่าย — ติ๊กเลือก “หัก ณ ที่จ่าย” ที่ผู้รับเงินในเมนูใบสำคัญจ่าย
            </div>
          ) : groups.map((g, gi) => (
            <div className="wht-reg-group" key={gi}>
              <div className="wht-reg-ghead">
                <span className="row-avatar">{g.name.replace(/^(นาย|นาง|นางสาว|บจก\.|หจก\.|ผศ\.|รศ\.|ดร\.)\s*/, '').slice(0, 1)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="wht-reg-gname">{g.name}
                    <span className="chip info" style={{ marginLeft: 6 }}>{(window.VCH_PAYEE_TYPES.find(t => t.v === g.type) || {}).l || '—'}</span>
                  </div>
                  <div className="wht-reg-gmeta muted">เลขผู้เสียภาษี <span className="mono">{g.taxId}</span> · {g.entries.length} ฉบับ</div>
                </div>
                <div className="wht-reg-gtax">
                  <div className="wht-reg-gtax-k">รวมภาษีหัก</div>
                  <div className="wht-reg-gtax-v mono">{fmt.money(g.totalTax, 2)}</div>
                </div>
                <button className="btn sm" title="พิมพ์หนังสือรับรองทุกฉบับของผู้รับเงินรายนี้"
                        onClick={() => doPrint(g.entries.map(e => ({ voucher: e.voucher, cert: e.cert })))}>
                  <Icon name="print" size={13} /> พิมพ์ทั้งหมด
                </button>
              </div>

              <div className="table-wrap" style={{ border: 0, overflowX: 'auto' }}>
                <table className="tbl wht-reg-tbl" style={{ minWidth: 880 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 130 }}>เลขที่ใบสำคัญจ่าย</th>
                      <th style={{ width: 100 }}>วันที่จ่าย</th>
                      <th>ประเภทเงินได้</th>
                      <th className="right" style={{ width: 120 }}>จำนวนเงินที่จ่าย</th>
                      <th className="right" style={{ width: 110 }}>ภาษีที่หัก</th>
                      <th className="center" style={{ width: 80 }}>แบบยื่น</th>
                      <th className="center" style={{ width: 64 }}>50 ทวิ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e, ei) => (
                      <tr key={ei}>
                        <td className="mono">{e.voucher.id}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{fmt.date(e.voucher.docDate)}</td>
                        <td>{sectionOf(e.cert)}
                          {e.cert.rows && e.cert.rows[0] && e.cert.rows[0].detail
                            ? <div className="muted" style={{ fontSize: 11 }}>{e.cert.rows[0].detail}</div> : null}
                        </td>
                        <td className="right mono">{fmt.money(e.cert.totalAmount, 2)}</td>
                        <td className="right mono" style={{ fontWeight: 600 }}>{fmt.money(e.cert.totalTax, 2)}</td>
                        <td className="center"><span className="chip">{e.cert.pndType}</span></td>
                        <td className="center">
                          <button className="bud-act" title="พิมพ์หนังสือรับรองหัก ณ ที่จ่าย (50 ทวิ)"
                                  onClick={() => doPrint([{ voucher: e.voucher, cert: e.cert }])}><Icon name="print" size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lt-list-foot muted">
        <Icon name="info" size={12} /> ผู้รับเงินที่มีมากกว่า 1 รายในใบสำคัญจ่ายเดียวกัน จะถูกออกหนังสือรับรอง <b>แยกเป็นรายบุคคล</b> — แต่ละฉบับแสดงเฉพาะยอดและภาษีของผู้รับเงินรายนั้น
      </div>

      <WhtCertSheet pages={printPages} />
    </div>
  );
}

Object.assign(window, { WhtRegisterWorkspace });
