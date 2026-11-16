// Member search page — table of members; click row → detail
// Renders inside <main class="main"> like the detail page.

function SearchPage({ onSelect, onAddNew, members }) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'code', dir: 'asc' });
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const all = members || window.MEMBERS_LIST;

  const filtered = useMemo(() => {
    let r = all;
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter((m) =>
      m.code.toLowerCase().includes(n) ||
      m.name.toLowerCase().includes(n) ||
      m.citizenId.includes(n) ||
      m.dept.toLowerCase().includes(n)
      );
    }
    if (statusFilter !== 'all') r = r.filter((m) => m.status === statusFilter);
    if (typeFilter !== 'all') r = r.filter((m) => window.normalizeMemberType(m.type) === typeFilter);
    if (paymentFilter !== 'all') r = r.filter((m) => m.paymentStatus === paymentFilter);
    if (sort.key) {
      r = [...r].sort((a, b) => {
        const x = a[sort.key],y = b[sort.key];
        if (typeof x === 'number' && typeof y === 'number') return sort.dir === 'asc' ? x - y : y - x;
        return sort.dir === 'asc' ? String(x).localeCompare(String(y), 'th') : String(y).localeCompare(String(x), 'th');
      });
    }
    return r;
  }, [all, q, statusFilter, typeFilter, paymentFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageRows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {setPage(1);}, [q, statusFilter, typeFilter, paymentFilter]);

  const toggleSort = (k) => setSort((s) => s.key === k ?
  { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } :
  { key: k, dir: 'asc' });

  const Head = ({ k, cls, children }) =>
  <th className={(cls ? cls + ' ' : '') + 'sortable' + (sort.key === k ? ' sorted' : '')}
  onClick={() => toggleSort(k)}>
      {children}
      <span className="sort-ind">{sort.key === k ? sort.dir === 'asc' ? '▲' : '▼' : '↕'}</span>
    </th>;


  // Stats for top KPI strip
  const stats = useMemo(() => ({
    total: all.length,
    active: all.filter((m) => m.status === 'ปฏิบัติงาน').length,
    overdue: all.filter((m) => m.paymentStatus !== 'ปกติ').length,
    totalLoans: all.reduce((a, m) => a + m.loans, 0)
  }), [all]);

  return (
    <div data-screen-label="หน้าค้นหาสมาชิก">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ทะเบียนสมาชิก
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ค้นหาและเลือกสมาชิกเพื่อดูรายละเอียด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onAddNew}><Icon name="plus" /> เพิ่มสมาชิกใหม่</button>
      </div>

      {/* KPI summary cards */}
      <div className="search-stats">
        <div className="stat-card">
          <div className="stat-label">สมาชิกทั้งหมด</div>
          <div className="stat-value">{fmt.int(stats.total)}</div>
          <div className="stat-sub">บัญชี</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">สมาชิกปกติ
</div>
          <div className="stat-value">{fmt.int(stats.active)}</div>
          <div className="stat-sub" style={{ color: 'var(--success)' }}>
            {Math.round(stats.active / stats.total * 100)}% ของทั้งหมด
          </div>
        </div>
        <div className="stat-card warn">
          <div className="stat-label">มีปัญหาการชำระ</div>
          <div className="stat-value">{fmt.int(stats.overdue)}</div>
          <div className="stat-sub" style={{ color: 'var(--warning)' }}>ล่าช้า + ผิดนัด</div>
        </div>
      </div>

      <div className="search-card">
        {/* Toolbar */}
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
          <div className="search" style={{ flex: '1 1 320px', maxWidth: 440 }}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหารหัสสมาชิก, ชื่อ-สกุล, เลขบัตรประชาชน, หน่วยงาน..."
            style={{ height: 32, fontSize: 13 }} />
          </div>

          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">ทุกประเภทสมาชิก</option>
            <option value="สมาชิกสามัญ">สมาชิกสามัญ</option>
            <option value="สมาชิกสมทบ">สมาชิกสมทบ</option>
          </select>

          <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">ทุกสถานะการทำงาน</option>
            <option value="ปฏิบัติงาน">ปฏิบัติงาน</option>
            <option value="เกษียณ">เกษียณ</option>
            <option value="ลาออก">ลาออก</option>
          </select>

          <select className="filter-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="all">ทุกสถานะการชำระ</option>
            <option value="ปกติ">ปกติ</option>
            <option value="ล่าช้า">ล่าช้า</option>
            <option value="ผิดนัดชำระ">ผิดนัดชำระ</option>
          </select>

          {(q || statusFilter !== 'all' || typeFilter !== 'all' || paymentFilter !== 'all') &&
          <button className="btn ghost sm"
          onClick={() => {setQ('');setStatusFilter('all');setTypeFilter('all');setPaymentFilter('all');}}>
              <Icon name="close" size={12} /> ล้างตัวกรอง
            </button>
          }

          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>
            พบ <b style={{ color: 'var(--text)' }}>{fmt.int(filtered.length)}</b> รายการ
          </span>
        </div>

        {/* Table */}
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <Head k="code" cls="">รหัสสมาชิก</Head>
                <Head k="name">ชื่อ-สกุล</Head>
                <Head k="citizenId">เลขประจำตัวประชาชน</Head>
                <Head k="dept">หน่วยงานสังกัด</Head>
                <Head k="type" cls="center">ประเภท</Head>
                <Head k="joinDate" cls="center">เป็นสมาชิกตั้งแต่</Head>
                <Head k="shares" cls="num">ทุนเรือนหุ้น</Head>
                <Head k="loans" cls="num">หนี้คงเหลือ</Head>
                <Head k="loanCount" cls="center">สัญญา</Head>
                <Head k="monthly" cls="num">หักรายเดือน</Head>
                <Head k="status" cls="center">สถานะ</Head>
                <Head k="paymentStatus" cls="center">การชำระ</Head>
                <th style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ?
                <tr>
                  <td colSpan="13" className="empty-state">
                    <div style={{ marginBottom: 4 }}>
                      <Icon name="search" size={24} />
                    </div>
                    ไม่พบสมาชิกที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr> :
                pageRows.map((m) =>
                <tr key={m.code} className="clickable" onClick={() => onSelect(m.code)}>
                  <td className="mono">{m.code}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="row-avatar">
                        {m.name.replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1)}
                      </span>
                      <span>{m.name}</span>
                    </div>
                  </td>
                  <td className="mono">{m.citizenId}</td>
                  <td>{m.dept} <span className="muted mono" style={{ fontSize: 10 }}>· {m.deptCode}</span></td>
                  <td className="center">
                    <span className={"pill " + (window.normalizeMemberType(m.type) === 'สมาชิกสามัญ' ? 'info' : 'neutral')}>
                      {window.normalizeMemberType(m.type) === 'สมาชิกสามัญ' ? 'สามัญ' : 'สมทบ'}
                    </span>
                  </td>
                  <td className="center mono">{fmt.date(m.joinDate)}</td>
                  <td className="num">{m.shares ? fmt.money(m.shares, 0) : <span className="muted">—</span>}</td>
                  <td className="num">{m.loans ? fmt.money(m.loans, 0) : <span className="muted">—</span>}</td>
                  <td className="center mono">{m.loanCount || <span className="muted">—</span>}</td>
                  <td className="num">{m.monthly ? fmt.money(m.monthly, 0) : <span className="muted">—</span>}</td>
                  <td className="center">
                    {m.status === 'ปฏิบัติงาน' ? <span className="pill ok">ปกติ</span> :
                    m.status === 'เกษียณ' ? <span className="pill info">เกษียณ</span> :
                    <span className="pill neutral">{m.status}</span>}
                  </td>
                  <td className="center">
                    {m.paymentStatus === 'ปกติ' ? <span className="pill ok">ปกติ</span> :
                    m.paymentStatus === 'ล่าช้า' ? <span className="pill warn">ล่าช้า</span> :
                    <span className="pill bad">ผิดนัด</span>}
                  </td>
                  <td className="center">
                    <button className="btn ghost sm" style={{ padding: '0 6px' }}
                    onClick={(e) => {e.stopPropagation();onSelect(m.code);}}
                    title="ดูรายละเอียด">
                      <Icon name="chevRight" />
                    </button>
                  </td>
                </tr>
                )}
            </tbody>
          </table>
        </div></div>

        {/* Pagination */}
        <div className="pagination">
          <span className="muted" style={{ fontSize: 12 }}>
            หน้า {page} / {totalPages} · แสดง {pageRows.length} จาก {filtered.length} รายการ
          </span>
          <span className="spacer" style={{ flex: 1 }} />
          <button className="btn sm" disabled={page === 1} onClick={() => setPage(1)}>
            <Icon name="chevLeft" /><Icon name="chevLeft" />
          </button>
          <button className="btn sm" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <Icon name="chevLeft" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) =>
          <button key={i}
          className={"btn sm" + (page === i + 1 ? ' primary' : '')}
          style={{ minWidth: 30, padding: '0 8px' }}
          onClick={() => setPage(i + 1)}>
              {i + 1}
            </button>
          )}
          <button className="btn sm" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <Icon name="chevRight" />
          </button>
          <button className="btn sm" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
            <Icon name="chevRight" /><Icon name="chevRight" />
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { SearchPage });