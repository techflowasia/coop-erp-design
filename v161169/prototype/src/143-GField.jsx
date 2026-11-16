// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — ตรวจสอบสิทธิค้ำ
//  ค้นหาสิทธิการค้ำของสมาชิกจากเลขที่สมาชิก 4 ประเภท:
//  คนค้ำประกัน · หุ้นค้ำประกัน · เงินฝากค้ำประกัน · หลักทรัพย์ค้ำประกัน
// ════════════════════════════════════════════════════════════════════

// ─── Field grid helpers ──────────────────────────────────────────────
function GField({ label, children, mono }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      <span className={"value" + (mono ? " mono" : "")}>{children}</span>
    </div>
  );
}

const securityTypePill = (s) => {
  const map = {
    'โฉนด': 'info', 'นส.3': 'neutral', 'นส.3 ก': 'neutral',
    'โฉนดตราจอง': 'info', 'ห้องชุด': 'ok', 'สิ่งปลูกสร้าง': 'warn',
  };
  return <span className={"pill " + (map[s] || 'neutral')}>{s}</span>;
};

const loanTypePill = (s) => {
  if (s === 'กู้สามัญ')  return <span className="pill info">กู้สามัญ</span>;
  if (s === 'กู้ฉุกเฉิน') return <span className="pill warn">กู้ฉุกเฉิน</span>;
  if (s === 'กู้พิเศษ')  return <span className="pill ok">กู้พิเศษ</span>;
  return <span className="pill neutral">{s}</span>;
};

// ─── ส่วนที่ใช้ร่วมกันทุกประเภท ─────────────────────────────────────
// ค้ำให้สมาชิกอื่น
function GuaranteeOthersTable({ rows }) {
  const total = rows.reduce((a, r) => a + r.loanRemaining, 0);
  return (
    <div className="gc-block">
      <div className="section-head">
        <span className="head-bar" />
        <h3>ค้ำให้สมาชิกอื่น</h3>
        <span className="gc-count">{rows.length} รายการ</span>
      </div>
      {rows.length === 0 ? (
        <div className="gc-empty">— ไม่พบรายการที่สมาชิกค้ำให้ผู้อื่น —</div>
      ) : (
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขสัญญา</th>
                <th>ชื่อ-นามสกุล</th>
                <th className="num">เงินกู้คงเหลือ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.contractNo + r.name}>
                  <td className="mono">{r.contractNo}</td>
                  <td>{r.name}</td>
                  <td className="num">{fmt.money(r.loanRemaining, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2">รวมเงินกู้คงเหลือที่ค้ำ</td>
                <td className="num"><b>{fmt.money(total, 0)}</b></td>
              </tr>
            </tfoot>
          </table>
        </div></div>
      )}
    </div>
  );
}

// ค้ำให้สมาชิกอื่นยังไม่อนุมัติ
function GuaranteePendingTable({ rows }) {
  const total = rows.reduce((a, r) => a + r.amount, 0);
  return (
    <div className="gc-block">
      <div className="section-head">
        <span className="head-bar" style={{ background: 'var(--warning)' }} />
        <h3>ค้ำให้สมาชิกอื่น (ยังไม่อนุมัติ)</h3>
        <span className="gc-count">{rows.length} รายการ</span>
      </div>
      {rows.length === 0 ? (
        <div className="gc-empty">— ไม่มีคำขอค้ำที่รออนุมัติ —</div>
      ) : (
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>เลขที่ใบคำขอ</th>
                <th className="center">ประเภทการขอกู้</th>
                <th>ชื่อ-นามสกุล</th>
                <th className="num">จำนวนเงินกู้</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.reqNo}>
                  <td className="mono">{r.reqNo}</td>
                  <td className="center">{loanTypePill(r.loanType)}</td>
                  <td>{r.name}</td>
                  <td className="num">{fmt.money(r.amount, 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">รวมจำนวนเงินกู้ที่รออนุมัติ</td>
                <td className="num"><b>{fmt.money(total, 0)}</b></td>
              </tr>
            </tfoot>
          </table>
        </div></div>
      )}
    </div>
  );
}

// สิทธิการค้ำคงเหลือ แยกตามประเภทเงินกู้ (อ้างอิงค่าคงที่ประเภทเงินกู้)
function PersonRightsTable({ m }) {
  const rows = (window.guarPersonRights ? window.guarPersonRights(m) : []);
  return (
    <div className="gc-block">
      <div className="section-head">
        <span className="head-bar" />
        <h3>สิทธิการค้ำคงเหลือ — แยกตามประเภทเงินกู้</h3>
        <span className="gc-count">{rows.length} ประเภท</span>
      </div>
      <div className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
        จำนวนสัญญาที่สมาชิกรายนี้ยังค้ำประกันได้อีกในแต่ละประเภทเงินกู้ — อ้างอิงค่าคงที่ประเภทเงินกู้ (สิทธิค้ำต่อคน · ประเภทสมาชิกที่ค้ำได้)
      </div>
      {rows.length === 0 ? (
        <div className="gc-empty">— ไม่มีผลิตภัณฑ์เงินกู้ที่อนุญาตให้บุคคลค้ำประกัน —</div>
      ) : (
        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 70 }}>รหัส</th>
                <th>ประเภทเงินกู้</th>
                <th className="center" style={{ width: 110 }}>สิทธิสูงสุด/คน</th>
                <th className="center" style={{ width: 90 }}>ค้ำแล้ว</th>
                <th className="center" style={{ width: 100 }}>รออนุมัติ</th>
                <th className="center" style={{ width: 130 }}>ค้ำได้อีก</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td className="mono">{r.code}</td>
                  <td>{r.name}{!r.eligible && <span className="chip neutral" style={{ marginLeft: 6 }}>ไม่เข้าเงื่อนไขประเภทสมาชิก</span>}</td>
                  <td className="center mono">{r.eligible ? r.max : '—'}</td>
                  <td className="center mono">{r.used}</td>
                  <td className="center mono">{r.pending || 0}</td>
                  <td className="center">
                    {!r.eligible
                      ? <span className="pill neutral">ค้ำไม่ได้</span>
                      : r.remaining > 0
                        ? <span className="pill ok">ค้ำได้อีก {r.remaining} สัญญา</span>
                        : <span className="pill bad">เต็มสิทธิ</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}

// ─── ประเภท 01: คนค้ำประกัน ─────────────────────────────────────────
function PersonGuaranteeView({ m }) {
  const today = window.DEPOSIT_WORKING_DATE || new Date().toISOString().slice(0, 10);
  const months = window.totalMonths(m.joinDate, today);
  const og = m.othersGuaranteeMe;
  return (
    <div>
      <div className="gc-two-col">
        {/* รายละเอียดสมาชิก */}
        <div className="gc-block">
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสมาชิก</h3></div>
          <div className="form-grid cols-1">
            <GField label="ประเภทสมาชิก">{m.memberType}</GField>
            <GField label="ชื่อสมาชิก">{m.name}</GField>
            <GField label="หน่วยงาน">{m.department}</GField>
            <GField label="วันเกิด" mono>
              {fmt.date(m.birthDate)} <span className="gc-calc">อายุ {fmt.ageYM(m.birthDate)}</span>
            </GField>
            <GField label="วันเกษียณ" mono>
              {fmt.date(m.retireDate)} <span className="gc-calc">เหลือ {fmt.retireCountdown(m.retireDate)}</span>
            </GField>
            <GField label="วันที่เป็นสมาชิก" mono>
              {fmt.date(m.joinDate)} <span className="gc-calc">เป็นสมาชิกมาแล้ว {months} เดือน</span>
            </GField>
            <GField label="วันที่เข้าทำงาน" mono>{fmt.date(m.workStartDate)}</GField>
            <GField label="เงินเดือน">฿ {fmt.money(m.salary, 0)}</GField>
          </div>
        </div>

        {/* รายละเอียดหุ้น */}
        <div className="gc-block">
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดหุ้น</h3></div>
          <div className="gc-stat-row">
            <div className="gc-stat">
              <div className="gc-stat-lbl">ทุนเรือนหุ้น</div>
              <div className="gc-stat-val">฿ {fmt.money(m.share.capital, 0)}</div>
            </div>
            <div className="gc-stat">
              <div className="gc-stat-lbl">หุ้น / เดือน</div>
              <div className="gc-stat-val">{m.share.perMonthShares} หุ้น</div>
              <div className="gc-stat-sub">฿ {fmt.money(m.share.perMonthValue, 0)} / เดือน</div>
            </div>
            <div className="gc-stat">
              <div className="gc-stat-lbl">การส่งหุ้น</div>
              <div className="gc-stat-val gc-sm"><span className="pill ok">{m.share.sendType}</span></div>
            </div>
          </div>

          <div className="gc-sub-title">รายการกลุ่มค้ำประกัน</div>
          <div className="table-wrap"><table className="tbl">
            <thead>
              <tr><th>กลุ่มค้ำประกัน</th><th>สิทธิการค้ำ</th></tr>
            </thead>
            <tbody>
              {m.share.groups.map((g, i) => (
                <tr key={i}><td>{g.group}</td><td>{g.right}</td></tr>
              ))}
            </tbody>
          </table></div>
        </div>
      </div>

      <PersonRightsTable m={m} />

      {/* สมาชิกอื่นค้ำให้ */}
      <div className="gc-block">
        <div className="section-head">
          <span className="head-bar" />
          <h3>สมาชิกอื่นค้ำให้</h3>
          <span className="gc-count">{og.length} รายการ</span>
        </div>
        {og.length === 0 ? (
          <div className="gc-empty">— ไม่มีผู้ค้ำให้สมาชิกรายนี้ —</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>เลขที่สัญญาค้ำ</th>
                  <th>เลขที่ค้ำ</th>
                  <th>รายละเอียดหลักประกัน</th>
                  <th className="num">คงเหลือ</th>
                  <th className="num">% การค้ำ</th>
                  <th className="num">เงินที่ค้ำประกัน</th>
                </tr>
              </thead>
              <tbody>
                {og.map((r) => (
                  <tr key={r.guarNo}>
                    <td className="mono">{r.contractNo}</td>
                    <td className="mono">{r.guarNo}</td>
                    <td>{r.collateralDetail}</td>
                    <td className="num">{fmt.money(r.remaining, 0)}</td>
                    <td className="num">{r.percent}%</td>
                    <td className="num"><b>{fmt.money(r.amount, 0)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="5">รวมเงินที่ค้ำประกัน</td>
                  <td className="num"><b>{fmt.money(og.reduce((a, r) => a + r.amount, 0), 0)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div></div>
        )}
      </div>

      <GuaranteeOthersTable rows={m.guaranteeOthers} />
      <GuaranteePendingTable rows={m.guaranteeOthersPending} />
    </div>
  );
}

// ─── ประเภท 02: หุ้นค้ำประกัน ───────────────────────────────────────
function ShareGuaranteeView({ m }) {
  return (
    <div>
      <div className="gc-block">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสมาชิก</h3></div>
        <div className="form-grid cols-2">
          <GField label="ประเภทสมาชิก">{m.memberType}</GField>
          <GField label="ชื่อสมาชิก">{m.name}</GField>
          <GField label="ชื่อหุ้นของสมาชิก">{m.share.shareName}</GField>
          <GField label="ยกมาต้นปี">฿ {fmt.money(m.share.broughtForward, 0)}</GField>
          <GField label="ทุนเรือนหุ้น">฿ {fmt.money(m.share.capital, 0)}</GField>
          <GField label="หุ้น / เดือน">
            {m.share.perMonthShares} หุ้น <span className="gc-calc">฿ {fmt.money(m.share.perMonthValue, 0)} / เดือน</span>
          </GField>
          <GField label="การส่งหุ้น"><span className="pill ok">{m.share.sendType}</span></GField>
          <GField label="สถานะหุ้น">
            {m.share.status === 'ปกติ' ? <span className="pill ok">ปกติ</span> : <span className="pill bad">{m.share.status}</span>}
          </GField>
        </div>
      </div>

      <GuaranteeOthersTable rows={m.guaranteeOthers} />
      <GuaranteePendingTable rows={m.guaranteeOthersPending} />
    </div>
  );
}

// ─── ประเภท 03: เงินฝากค้ำประกัน ────────────────────────────────────
function DepositGuaranteeView({ m }) {
  const d = m.deposit;
  return (
    <div>
      <div className="gc-two-col">
        <div className="gc-block">
          <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสมาชิก</h3></div>
          <div className="form-grid cols-1">
            <GField label="ประเภทสมาชิก">{m.memberType}</GField>
            <GField label="ชื่อสมาชิก">{m.name}</GField>
            <GField label="เลขที่บัญชี" mono>{d.accNo}</GField>
            <GField label="ประเภทบัญชี">{d.accType}</GField>
            <GField label="อ้างอิงทะเบียน" mono>{d.registryRef}</GField>
            <GField label="วันเปิดบัญชี" mono>{fmt.date(d.openDate)}</GField>
          </div>
        </div>

        <div className="gc-block">
          <div className="section-head"><span className="head-bar" /><h3>ยอดเงิน</h3></div>
          <div className="summary-row" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 0 }}>
            <div className="summary-card">
              <div className="label">ยกมาต้นปี</div>
              <div className="value">฿ {fmt.money(d.broughtForward, 2)}</div>
            </div>
            <div className="summary-card accent">
              <div className="label">ยอดคงเหลือ</div>
              <div className="value">฿ {fmt.money(d.balance, 2)}</div>
            </div>
            <div className="summary-card">
              <div className="label">ยอดถอนได้</div>
              <div className="value">฿ {fmt.money(d.withdrawable, 2)}</div>
            </div>
            <div className="summary-card">
              <div className="label">ยอดอายัด</div>
              <div className="value" style={{ color: d.frozen > 0 ? 'var(--danger)' : undefined }}>
                ฿ {fmt.money(d.frozen, 2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <GuaranteeOthersTable rows={m.guaranteeOthers} />
      <GuaranteePendingTable rows={m.guaranteeOthersPending} />
    </div>
  );
}

// ─── ประเภท 04: หลักทรัพย์ค้ำประกัน ─────────────────────────────────
//  แสดงรายการหลักทรัพย์แบบเดียวกับแท็บ "ข้อมูลหลักทรัพย์" ของรายละเอียดสมาชิก
//  — หลายรายการ · แต่ละรายการค้ำได้หลายสัญญา · มูลค่าคงเหลือนำไปค้ำสัญญาอื่นได้อีก
function SecurityGuaranteeView({ m }) {
  const recs = (m.securities || []).map((x) => {
    const pct = Number(x.guarPercent || 0);
    const limit = Math.round((Number(x.appraisal) || 0) * pct / 100);
    const used = (x.contracts || []).reduce((a, c) => a + (Number(c.amount) || 0), 0);
    const remain = Math.max(0, limit - used);
    return { ...x, pct, limit, used, remain };
  });
  const totAppraisal = recs.reduce((a, x) => a + (x.appraisal || 0), 0);
  const totLimit = recs.reduce((a, x) => a + x.limit, 0);
  const totUsed = recs.reduce((a, x) => a + x.used, 0);
  const totRemain = recs.reduce((a, x) => a + x.remain, 0);

  return (
    <div>
      <div className="gc-block">
        <div className="section-head"><span className="head-bar" /><h3>รายละเอียดสมาชิก</h3></div>
        <div className="form-grid cols-2">
          <GField label="ประเภทสมาชิก">{m.memberType}</GField>
          <GField label="ชื่อสมาชิก">{m.name}</GField>
          <GField label="หน่วยงาน">{m.department}</GField>
          <GField label="จำนวนหลักทรัพย์">{recs.length} รายการ</GField>
        </div>
      </div>

      <div className="gc-block">
        <div className="section-head">
          <span className="head-bar" />
          <h3>ข้อมูลหลักทรัพย์</h3>
          <span className="gc-count">{recs.length} รายการ</span>
        </div>
        <div className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>
          แต่ละหลักทรัพย์ค้ำประกันได้หลายสัญญา — “มูลค่าคงเหลือหลังค้ำประกัน” คือวงเงินที่ยังนำไปค้ำสัญญาอื่นได้อีก
          (ราคาประเมิน × % ที่ใช้ค้ำได้ − ยอดที่ค้ำไปแล้ว)
        </div>
        {recs.length === 0 ? (
          <div className="gc-empty">— ไม่มีรายการขึ้นทะเบียนหลักทรัพย์ของสมาชิกรายนี้ —</div>
        ) : (
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl" style={{ minWidth: 1080 }}>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อหลักทรัพย์</th>
                  <th className="center">ประเภท</th>
                  <th>ที่อยู่</th>
                  <th className="num">ราคาประเมิน</th>
                  <th className="num">ค้ำไปแล้ว</th>
                  <th className="num">มูลค่าคงเหลือหลังค้ำประกัน</th>
                </tr>
              </thead>
              <tbody>
                {recs.map((x) => (
                  <tr key={x.code}>
                    <td className="mono" style={{ fontWeight: 500 }}>
                      {x.code}
                      {(x.contracts || []).length > 0
                        ? <div className="muted" style={{ fontSize: 'var(--font-xs)', fontWeight: 400 }}>ค้ำสัญญา {x.contracts.map(c => c.contractNo).join(', ')}</div>
                        : <div className="muted" style={{ fontSize: 'var(--font-xs)', fontWeight: 400 }}>ยังไม่ได้ใช้ค้ำ</div>}
                    </td>
                    <td style={{ whiteSpace: 'normal' }}>{x.name}</td>
                    <td className="center">{securityTypePill(x.type)}</td>
                    <td style={{ whiteSpace: 'normal', minWidth: 240 }} className="muted">{x.address}</td>
                    <td className="num">{fmt.money(x.appraisal, 2)}</td>
                    <td className="num" style={{ color: x.used > 0 ? 'var(--danger)' : undefined }}>{fmt.money(x.used, 2)}</td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {fmt.money(x.remain, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4">รวมทั้งหมด</td>
                  <td className="num"><b>{fmt.money(totAppraisal, 2)}</b></td>
                  <td className="num"><b>{fmt.money(totUsed, 2)}</b></td>
                  <td className="num"><b>{fmt.money(totRemain, 2)}</b></td>
                </tr>
              </tfoot>
            </table>
          </div></div>
        )}
      </div>

      <GuaranteeOthersTable rows={m.guaranteeOthers} />
      <GuaranteePendingTable rows={m.guaranteeOthersPending} />
    </div>
  );
}

// ─── Popup ค้นหาสมาชิก ──────────────────────────────────────────────
// ใช้คอมโพเนนต์กลางของ Design System (components-member-search.jsx)
// — ป้อน source/searchFn ของระบบค้ำประกัน (มีเงื่อนไข "หน่วย/สังกัด")
function GcMemberSearchModal({ onPick, onClose }) {
  return (
    <MemberSearchModal onPick={onPick} onClose={onClose}
                       source={window.GUAR_MEMBERS} searchFn={window.searchGuarMembers} />
  );
}

// ─── หน้าหลัก: ตรวจสอบสิทธิค้ำ ──────────────────────────────────────
function GuaranteeCheckPage() {
  const TYPES = window.GUAR_SEARCH_TYPES;
  const [typeId, setTypeId] = useState('person');
  const [member, setMember] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const type = TYPES.find((t) => t.id === typeId);

  const pick = (m) => { setMember(m); setModalOpen(false); setTypeId('person'); };

  const renderView = () => {
    if (!member) return null;
    if (typeId === 'person')   return <PersonGuaranteeView m={member} />;
    if (typeId === 'share')    return <ShareGuaranteeView m={member} />;
    if (typeId === 'deposit')  return <DepositGuaranteeView m={member} />;
    if (typeId === 'security') return <SecurityGuaranteeView m={member} />;
    return null;
  };

  return (
    <div data-screen-label="หน้าตรวจสอบสิทธิค้ำ">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>
            ตรวจสอบสิทธิค้ำ
          </h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
            ตรวจสอบสิทธิการค้ำของสมาชิกจากเลขที่สมาชิก — เลือกประเภทการค้ำที่ต้องการตรวจสอบ
          </div>
        </div>
        <span className="spacer" />
      </div>

      {/* ค้นหาสมาชิก */}
      <div className="search-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '14px 18px' }}>
          <div className="icr-fld" style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <span className="icr-fld-l">เลขสมาชิก</span>
            <div className="lrq-member-search">
              <ErpMemberPicker member={member} onPick={pick} source={window.GUAR_MEMBERS}
                               title="ค้นหาสมาชิก — ตรวจสอบสิทธิค้ำ" placeholder="เลขสมาชิก…" />
            </div>
          </div>
        </div>
      </div>

      {/* แท็บประเภทการค้ำ + เนื้อหา */}
      <div className="tabs-container">
        <div className="tabs-bar">
          {TYPES.map((t) => (
            <button key={t.id} className={"tab" + (typeId === t.id ? ' active' : '')}
                    onClick={() => setTypeId(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {member ? (
            <div className="gc-result">{renderView()}</div>
          ) : (
            <div className="search-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div className="muted" style={{ fontSize: 13 }}>ยังไม่ได้เลือกสมาชิก — ค้นหาและเลือกสมาชิกจากช่องด้านบนเพื่อแสดงข้อมูล</div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && <GcMemberSearchModal onPick={pick} onClose={() => setModalOpen(false)} />}
    </div>
  );
}

Object.assign(window, { GuaranteeCheckPage });
