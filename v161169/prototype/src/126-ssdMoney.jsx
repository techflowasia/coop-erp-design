// ═════════════════════════════════════════════════════════════════
//  Popup รายละเอียดทุนเรือนหุ้น (เรียกจากแท็บ "หุ้น" ในหน้าทะเบียนสมาชิก)
//  2 แท็บ: Statement · ประวัติการเปลี่ยนแปลงการส่ง
//  อ้างอิงหน้าจอเดิม — เรนเดอร์ใหม่ตามดีไซน์ระบบ (การ์ด/ตาราง/legend)
// ═════════════════════════════════════════════════════════════════

// ── helpers ─────────────────────────────────────────────────────────
const ssdMoney = (v, d = 2) => (v == null ? '0.00' : window.fmt.money(v, d));
// วันที่แบบ dd/mm/yy (พ.ศ. 2 หลัก) — ตรงกับหน้าจอเดิม
function ssdBE(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String((d.getFullYear() + 543) % 100).padStart(2, '0');
  return `${dd}/${mm}/${yy}`;
}
// เลขทะเบียนสมาชิกแบบตัวเลข (M-058241 → 058241)
const ssdReg = (code) => (code || '').replace(/[^0-9]/g, '') || '—';

// ── รหัสรายการ (ตรงตาม legend หน้าจอเดิม) ────────────────────────────
const SSD_CODE_LEGEND = [
  ['B/F', 'ยกยอดมาต้นปี'],
  ['SPX', 'ซื้อหุ้นพิเศษ'],
  ['RPX', 'ยกเลิกซื้อหุ้นพิเศษ'],
  ['SPM', 'ส่งหุ้นประจำเดือน'],
  ['RPM', 'ยกเลิกส่งหุ้นประจำเดือน'],
  ['STL', 'โอนหุ้นชำระหนี้'],
  ['RTL', 'ยกเลิกโอนหุ้นชำระหนี้'],
  ['SWD', 'ถอนหุ้น'],
  ['RWD', 'ยกเลิกถอนหุ้น'],
  ['SSR', 'เก็บเกินจ่ายคืน'],
  ['RSR', 'ยกเลิกเก็บเกินจ่ายคืน'],
  ['STR', 'รับโอนหุ้นสมัครใหม่'],
  ['RTR', 'รับโอนหุ้นสมัครใหม่'],
];
// map type/amount ของ entry → รหัสรายการ
function ssdCode(e) {
  if ((e.amount || 0) < 0) return 'SWD';
  if (e.type === 'special') return 'SPX';
  if (e.type === 'dividend') return 'SPX';
  return 'SPM';
}
// ผู้บันทึกตามช่องทาง
const SSD_RECORDER = {
  payroll: 'ระบบเรียกเก็บ',
  cash: 'เจ้าหน้าที่การเงิน',
  transfer: 'เจ้าหน้าที่การเงิน',
  internal: 'ระบบปันผล',
};

// ── ประกอบ statement (คำนวณยอดหุ้นคงเหลือต่อเนื่อง เรียงเก่า→ใหม่) ────
function ssdBuildStatement(st) {
  const par = (st && st.parValue) || 10;
  let bal = (st && st.openingBalance) || 0;
  let sh = (st && st.openingShares) || 0;
  return (st ? st.entries : []).map((e, i) => {
    bal += e.amount;
    sh += e.amount / par;
    return {
      ...e, seq: i + 1, code: ssdCode(e),
      shares: Math.abs(e.amount) / par,
      isIn: e.amount >= 0,
      running: bal, runningShares: sh,
      recorder: SSD_RECORDER[e.channel] || '—',
    };
  });
}

// ── ประวัติการเปลี่ยนแปลงการส่ง (จาก data.shareChanges) ──────────────
function ssdChangeNumber(s) {
  const m = String(s || '').match(/([\d,]+\.\d{2})/);
  return m ? m[1] : '—';
}

// ═════════════════════════════════════════════════════════════════
//  Popup
// ═════════════════════════════════════════════════════════════════
function ShareStatementDetailModal({ data, focusRef, onClose }) {
  const { useState, useEffect, useMemo, useRef } = React;
  const [tab, setTab] = useState('statement');
  const focusRowRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const member = data.member || {};
  const st = data.shareStatement;
  const shares = data.shares || [];
  const changes = data.shareChanges || [];

  const rows = useMemo(() => ssdBuildStatement(st), [st]);

  useEffect(() => {
    if (tab === 'statement' && focusRef && focusRowRef.current) {
      focusRowRef.current.scrollIntoView({ block: 'center' });
    }
  }, [tab, focusRef]);

  if (!st) return null;

  const par = st.parValue || 10;
  const closing = rows.length ? rows[rows.length - 1].running : (st.openingBalance || 0);
  // ยอดยกมาต้นปี = ยอดคงเหลือก่อนรายการแรกของปีล่าสุดที่มีรายการ
  const latestYear = rows.length ? rows[rows.length - 1].period.split('/')[0] : null;
  const firstOfYear = rows.find(r => r.period.startsWith(latestYear));
  const openingOfYear = firstOfYear ? firstOfYear.running - firstOfYear.amount : (st.openingBalance || 0);
  const perMonth = shares.reduce((a, x) => a + (x.status === 'ปกติ' ? (x.perMonth || 0) : 0), 0);
  const lastTerm = Math.max(0, ...shares.map(x => x.term || 0));
  const sendStatus = shares.length ? (shares.find(x => x.status === 'ปกติ') ? 'ปกติ' : shares[0].sendStatus) : 'ปกติ';
  const shareStatus = shares.some(x => x.status !== 'ปกติ') ? shares.find(x => x.status !== 'ปกติ').status : 'ปกติ';

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card lcd-modal ssd-modal" role="dialog" aria-modal="true">
        <div className="modal-head lcd-head">
          <h2>รายละเอียดทุนเรือนหุ้น</h2>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>

        {/* หัวการ์ด — ชื่อสมาชิก / ประเภทหุ้น */}
        <div className="lcd-contract-head ssd-idrow">
          <div className="lcd-ch-field wide">
            <span className="lcd-ch-k">ชื่อ-ชื่อสกุล</span>
            <span className="lcd-ch-v">{ssdReg(member.code)} - {member.name}</span>
          </div>
          <div className="lcd-ch-field">
            <span className="lcd-ch-k">ประเภทหุ้น</span>
            <span className="lcd-ch-v">01 - ทุนเรือนหุ้น</span>
          </div>
        </div>

        {/* กลุ่มข้อมูล — ทุนเรือนหุ้น / อื่น ๆ / ผ่อนผัน */}
        <div className="ssd-groups">
          <div className="ssd-grp">
            <div className="ssd-grp-title">ทุนเรือนหุ้น</div>
            <SsdKV k="ยกมาต้นปี" v={ssdMoney(openingOfYear, 2)} num />
            <SsdKV k="ค่าหุ้นสะสม" v={ssdMoney(closing, 2)} num />
            <SsdKV k="หุ้นต่อเดือน" v={ssdMoney(perMonth, 2)} num />
          </div>
          <div className="ssd-grp">
            <div className="ssd-grp-title">อื่น ๆ</div>
            <SsdKV k="งวดล่าสุด" v={String(lastTerm)} />
            <SsdKV k="การส่งหุ้น" v={<span className={'pill ' + mfStatusTone(sendStatus)}>{sendStatus}</span>} />
            <SsdKV k="สถานะหุ้น" v={<span className={'pill ' + mfStatusTone(shareStatus)}>{shareStatus}</span>} />
          </div>
          <div className="ssd-grp ssd-grp-wide">
            <div className="ssd-grp-title">ผ่อนผัน</div>
            <SsdKV k="การผ่อนผัน" v={<span className="muted">— ไม่มี —</span>} />
          </div>
        </div>

        {/* แท็บ */}
        <div className="tabs-bar lcd-tabs">
          <button className={"tab" + (tab === 'statement' ? ' active' : '')} onClick={() => setTab('statement')}>Statement</button>
          <button className={"tab" + (tab === 'changes' ? ' active' : '')} onClick={() => setTab('changes')}>ประวัติการเปลี่ยนแปลงการส่ง</button>
        </div>

        {/* เนื้อหา */}
        <div className="modal-body lcd-body">
          {tab === 'statement'
            ? <SsdStatementTab rows={rows} focusRef={focusRef} focusRowRef={focusRowRef} openingBalance={st.openingBalance || 0} par={par} />
            : <SsdChangesTab changes={changes} />}
        </div>
      </div>
    </>
  );
}

function SsdKV({ k, v, num }) {
  return (
    <div className="lcd-ch-field">
      <span className="lcd-ch-k">{k}</span>
      <span className={"lcd-ch-v" + (num ? ' mono ssd-num' : '')} style={num ? { justifyContent: 'flex-end' } : null}>{v}</span>
    </div>
  );
}

// ─── แท็บ Statement ───────────────────────────────────────────────────
function SsdStatementTab({ rows, focusRef, focusRowRef, openingBalance, par }) {
  return (
    <div>
      <div className="table-wrap lcd-stmt-wrap">
        <table className="tbl lcd-stmt ssd-stmt">
          <thead>
            <tr>
              <th rowSpan="2" className="center" style={{ width: 44 }}>ลำดับ</th>
              <th rowSpan="2" style={{ width: 78 }}>วันทำรายการ</th>
              <th rowSpan="2" style={{ width: 78 }}>วันที่ใบเสร็จ</th>
              <th rowSpan="2" style={{ width: 128 }}>เลขที่ใบเสร็จ</th>
              <th rowSpan="2" className="center" style={{ width: 56 }}>รายการ</th>
              <th rowSpan="2" className="center" style={{ width: 66 }}>งวด</th>
              <th colSpan="2" className="center grp">ยอดทำรายการ</th>
              <th rowSpan="2" className="num" style={{ width: 104 }}>หุ้นคงเหลือ</th>
              <th rowSpan="2" style={{ width: 130 }}>ผู้บันทึก</th>
              <th rowSpan="2">หมายเหตุ</th>
            </tr>
            <tr>
              <th className="num sub" style={{ width: 104 }}>รับ</th>
              <th className="num sub" style={{ width: 104 }}>จ่าย / ยกเลิก</th>
            </tr>
          </thead>
          <tbody>
            {/* ยอดยกมา */}
            <tr className="ssd-bf">
              <td className="center mono">—</td>
              <td colSpan="4">ยอดยกมาต้นปี</td>
              <td className="center mono">B/F</td>
              <td className="num mono">—</td>
              <td className="num mono">—</td>
              <td className="num mono strong">{ssdMoney(openingBalance / par, 0)}</td>
              <td className="muted">ระบบยกยอด</td>
              <td className="muted">—</td>
            </tr>
            {rows.map((r) => {
              const focused = focusRef && r.ref === focusRef;
              return (
                <tr key={r.seq} ref={focused ? focusRowRef : null} className={focused ? 'ssd-focus' : ''}>
                  <td className="center mono">{r.seq}</td>
                  <td className="mono">{ssdBE(r.date)}</td>
                  <td className="mono">{ssdBE(r.date)}</td>
                  <td className="mono">{r.ref}</td>
                  <td className="center mono">{r.code}</td>
                  <td className="center mono">{r.period.split('/')[1]}</td>
                  <td className="num mono">{r.isIn ? ssdMoney(r.amount, 2) : '—'}</td>
                  <td className="num mono">{!r.isIn ? <span className="warn-text">{ssdMoney(-r.amount, 2)}</span> : '—'}</td>
                  <td className="num mono strong">{ssdMoney(r.runningShares, 0)}</td>
                  <td className="muted">{r.recorder}</td>
                  <td className="muted">{r.desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="lcd-legend">
        {SSD_CODE_LEGEND.map(([c, t]) => (
          <div className="lcd-legend-item" key={c}><b className="mono">{c}</b><span>{t}</span></div>
        ))}
      </div>
    </div>
  );
}

// ─── แท็บ ประวัติการเปลี่ยนแปลงการส่ง ─────────────────────────────────
function SsdChangesTab({ changes }) {
  if (!changes.length) {
    return <div className="empty-state">ไม่มีประวัติการเปลี่ยนแปลงการส่งหุ้นของสมาชิกรายนี้</div>;
  }
  return (
    <div className="table-wrap lcd-stmt-wrap">
      <table className="tbl lcd-stmt ssd-chg">
        <thead>
          <tr>
            <th rowSpan="2" style={{ width: 132 }}>เลขที่เอกสาร</th>
            <th rowSpan="2" style={{ width: 96 }}>วันที่เปลี่ยน</th>
            <th colSpan="2" className="center grp ssd-grp-before">ก่อนเปลี่ยนแปลง</th>
            <th colSpan="2" className="center grp ssd-grp-after">หลังเปลี่ยนแปลง</th>
            <th rowSpan="2" style={{ width: 150 }}>ผู้ทำรายการ</th>
            <th rowSpan="2">หมายเหตุ</th>
          </tr>
          <tr>
            <th className="num sub">หุ้น/เดือน</th>
            <th className="center sub">สถานะ</th>
            <th className="num sub ssd-after-cell">หุ้น/เดือน</th>
            <th className="center sub ssd-after-cell">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c, i) => (
            <tr key={i}>
              <td className="mono">SC-{(c.changeDate || '').slice(0, 4)}-{String(changes.length - i).padStart(4, '0')}</td>
              <td className="mono">{ssdBE(c.changeDate)}</td>
              <td className="num mono">{ssdChangeNumber(c.before)}</td>
              <td className="center"><span className="pill ok">ปกติ</span></td>
              <td className="num mono ssd-after-cell">{ssdChangeNumber(c.after)}</td>
              <td className="center ssd-after-cell"><span className="pill ok">ปกติ</span></td>
              <td className="muted">เจ้าหน้าที่ทะเบียนหุ้น</td>
              <td className="muted">ปรับเปลี่ยนค่าหุ้นรายเดือน (งวดที่ {c.term})</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

Object.assign(window, { ShareStatementDetailModal });
