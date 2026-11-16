// ═════════════════════════════════════════════════════════════════
//  หน้ารายละเอียดสมาชิก → แท็บข้อมูลการเงินและสัญญา → แท็บย่อย "เรียกเก็บ"
//  เพิ่มฟิลเตอร์เลือกปี พ.ศ. เหนือตาราง (ชิดขวา) แล้วกรองรายการตามปีที่เลือก
// ═════════════════════════════════════════════════════════════════

(function () {
  const Base = window.CollectionTab;
  if (!Base) return;

  const yearOf = (r) => {
    const m = /(\d{4})/.exec(String((r && r.term) || ''));
    return m ? m[1] : null;
  };

  function CollectionTabWithYear({ data }) {
    const recs = (data && data.collections) || [];
    const years = React.useMemo(
      () => Array.from(new Set(recs.map(yearOf).filter(Boolean))).sort((a, b) => Number(b) - Number(a)),
      [recs]
    );
    const [year, setYear] = React.useState('all');
    const shown = year === 'all' ? recs : recs.filter((r) => yearOf(r) === year);
    const scoped = Object.assign({}, data, { collections: shown });

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: 4 }}>
          <div className="select-wrap" style={{ width: 130, flex: '0 0 auto', marginLeft: 'auto' }}>
            <select className="filter-select" style={{ width: 130 }} value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="all">ทุกปี</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <Base data={scoped} />
      </div>
    );
  }

  window.CollectionTab = CollectionTabWithYear;
})();
