// ═════════════════════════════════════════════════════════════════
//  ใบสั่งคืนค่าหุ้น2024
//  = หน้าใบสั่งคืนค่าหุ้น (SrfFormScreen) + ตาราง "รายการหนี้ในฐานะผู้ค้ำ"
//    คอลัมน์ + พฤติกรรมเหมือนตารางโอนหนี้ให้ผู้กู้ร่วมทุกอย่าง
//    (หัวตาราง 2 ชั้น · ช่องกรอกแก้ไขได้ · แถวรวม · empty-state ตามการเลือกสมาชิก)
// ═════════════════════════════════════════════════════════════════
const { useState: srf24UseState, useEffect: srf24UseEffect, useRef: srf24UseRef } = React;

// ตรวจว่าหน้าเลือกสมาชิกคนไหนอยู่ — อ่านจากรหัสสมาชิกที่หน้าแสดงผลอยู่
function srf24DetectMember() {
  const list = window.SRF_MEMBERS || [];
  if (!list.length) return null;
  let txt = document.body.textContent || '';
  document.querySelectorAll('input, select').forEach(el => { if (el.value) txt += ' ' + el.value; });
  return list.find(m => {
    if (m.code && txt.includes(m.code)) return true;
    if (m.name && txt.includes(m.name)) return true;
    return (m.guarantors || []).concat(m.coBorrowers || [])
      .some(g => g.contractNo && txt.includes(g.contractNo));
  }) || null;
}

function SrfGuaranteeDebtTable() {
  const fmt = window.fmt;
  const Icon = window.Icon;
  const [member, setMember] = srf24UseState(null);
  const [rows, setRows] = srf24UseState([]);
  const codeRef = srf24UseRef(null);

  // ผูกกับสมาชิกที่เลือกในหน้า — โหลด/ล้างรายการตามการเลือก
  srf24UseEffect(() => {
    const sync = () => {
      const m = srf24DetectMember();
      const code = m ? m.code : null;
      if (code === codeRef.current) return;
      codeRef.current = code;
      setMember(m);
      setRows(m ? (m.guarantors || []).map(r => ({ ...r })) : []);
    };
    sync();
    const t = setInterval(sync, 600);
    return () => clearInterval(t);
  }, []);

  const loaded = !!member;
  const onEdit = (i, k, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v === '' ? '' : Number(v) } : r));
  const totals = rows.reduce((a, g) => ({
    tp: a.tp + (Number(g.transferPrincipal) || 0), ti: a.ti + (Number(g.transferInterestArrears) || 0),
    pp: a.pp + (Number(g.payPrincipal) || 0), pi: a.pi + (Number(g.payInterestArrears) || 0),
  }), { tp: 0, ti: 0, pp: 0, pi: 0 });

  return (
    <div className="search-card icr-sec">
      <div className="icr-sec-head">
        <span className="sw-sec-ico"><Icon name="members" size={15} /></span>
        <h3>รายการหนี้ในฐานะผู้ค้ำ</h3>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl sw-debt-tbl">
          <thead>
            <tr>
              <th rowSpan="2">เลขที่สัญญา</th>
              <th rowSpan="2">ผู้รับโอน</th>
              <th rowSpan="2" className="center">เริ่มชำระ</th>
              <th colSpan="2" className="center sw-grp">ยอดรับโอน</th>
              <th colSpan="2" className="center sw-grp">ผ่อนชำระ</th>
            </tr>
            <tr>
              <th className="num">ต้นเงิน</th>
              <th className="num">ด/บ ค้างชำระ</th>
              <th className="num">เงินต้น</th>
              <th className="num">ด/บ ค้าง</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">{loaded ? 'ไม่มีสัญญาที่ต้องรับภาระหนี้ในฐานะผู้ค้ำ' : 'เลือกสมาชิกเพื่อแสดงรายการโอนหนี้'}</td></tr>
            ) : rows.map((g, i) => (
              <tr key={i}>
                <td className="mono">{g.contractNo}</td>
                <td>{g.transferee}</td>
                <td className="center mono" style={{ fontSize: 11.5 }}>{fmt.date(g.startDate)}</td>
                <td className="num">
                  <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.transferPrincipal}
                         onChange={(e) => onEdit(i, 'transferPrincipal', e.target.value)} disabled={!loaded} placeholder="0.00" />
                </td>
                <td className="num">
                  <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.transferInterestArrears}
                         onChange={(e) => onEdit(i, 'transferInterestArrears', e.target.value)} disabled={!loaded} placeholder="0.00" />
                </td>
                <td className="num">
                  <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.payPrincipal}
                         onChange={(e) => onEdit(i, 'payPrincipal', e.target.value)} disabled={!loaded} placeholder="0.00" />
                </td>
                <td className="num">
                  <input className="cfg-input mono sm sw-cell-in" type="number" min="0" value={g.payInterestArrears}
                         onChange={(e) => onEdit(i, 'payInterestArrears', e.target.value)} disabled={!loaded} placeholder="0.00" />
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
          <tfoot>
            <tr className="sw-foot">
              <td colSpan="3" className="center"><b>รวมทั้งสิ้น</b></td>
              <td className="num mono"><b>{fmt.money(totals.tp, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.ti, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.pp, 2)}</b></td>
              <td className="num mono"><b>{fmt.money(totals.pi, 2)}</b></td>
            </tr>
          </tfoot>
          )}
        </table>
      </div></div>
    </div>
  );
}

function ShareRefund2024Page({ onToast }) {
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  return (
    <>
      <window.SrfFormScreen onToast={onToast} audit={audit} />
      <SrfGuaranteeDebtTable />
    </>
  );
}

Object.assign(window, { ShareRefund2024Page, SrfGuaranteeDebtTable });
