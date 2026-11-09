// ════════════════════════════════════════════════════════════════════
//  หนังสือแจ้งเปลี่ยนผู้ค้ำประกัน — GcnPrintSheet
//  เอกสารราชการสำหรับพิมพ์ / บันทึก PDF — เรนเดอร์ผ่าน portal ไปที่ body
//  ใช้คลาสพิมพ์ชุดเดียวกับเอกสารอื่น (mp-* / dn-letter-*) เพื่อความสม่ำเสมอ
// ════════════════════════════════════════════════════════════════════

window.printGuarantorChange = (onToast) => {
  document.documentElement.classList.add('member-printing');
  const cleanup = () => {
    document.documentElement.classList.remove('member-printing');
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  setTimeout(() => window.print(), 60);
  onToast && onToast('กำลังเตรียมเอกสาร — เลือก “บันทึกเป็น PDF” หรือเครื่องพิมพ์ในกล่องพิมพ์');
};

// รายการช่องกาสาเหตุในหนังสือ (ตามระเบียบ)
const GCN_LETTER_CAUSES = [
  { code: 'G01', label: 'ผู้ค้ำประกันเสียชีวิต' },
  { code: 'G02', label: 'ผู้ค้ำประกันพ้นสภาพสมาชิก' },
  { code: 'G03', label: 'ผู้ค้ำประกันลาออกจากการเป็นสมาชิก' },
  { code: 'G04', label: 'ผู้ค้ำประกันมีภาระค้ำประกันเกินหลักเกณฑ์' },
  { code: 'G05', label: 'ผู้ค้ำประกันขาดคุณสมบัติตามระเบียบสหกรณ์' },
  { code: 'G99', label: 'อื่น ๆ' },
];

function GcnCheck({ on }) {
  return <span className={'gcn-check' + (on ? ' on' : '')}>{on ? '☑' : '☐'}</span>;
}

function GcnPrintSheet({ rec }) {
  if (!rec) return null;
  const now = new Date();
  const cause = window.gcnCause(rec.causeCode) || {};
  const deptLabel = window.gcnDeptLabel(rec.deptCode);
  const st = window.gcnStatus(rec.status);
  const first = (rec.contracts || [])[0] || {};
  const otherCauseTxt = rec.causeCode === 'G99'
    ? (rec.causeDetail || '')
    : (GCN_LETTER_CAUSES.some(c => c.code === rec.causeCode) ? '' : (cause.label || ''));

  const statusFlags = [
    { v: 'draft',    l: 'บันทึกแล้ว' },
    { v: 'printed',  l: 'พิมพ์หนังสือแล้ว' },
    { v: 'notified', l: 'แจ้งสมาชิกแล้ว' },
    { v: 'waiting',  l: 'รอดำเนินการเปลี่ยนผู้ค้ำ' },
    { v: 'done',     l: 'ดำเนินการแล้ว' },
    { v: 'cancelled',l: 'ยกเลิก' },
  ];
  const reached = (v) => {
    const order = ['draft', 'printed', 'notified', 'waiting', 'done'];
    if (rec.status === 'cancelled') return v === 'cancelled' || v === 'draft';
    return order.indexOf(v) >= 0 && order.indexOf(v) <= order.indexOf(rec.status);
  };

  const sheet = (
    <div className="member-print-portal">
      <div className="mp-sheet dn-letter gcn-letter">

        {/* ═══ หัวเอกสาร ═══ */}
        <div className="gcn-lh">
          <div className="gcn-lh-org">สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด</div>
          <div className="gcn-lh-no">
            <span>เลขที่ {rec.refNo || `${(rec.id || '').replace(/^GT-/, '')}`}</span>
          </div>
          <div className="gcn-lh-date">วันที่ {fmt.date(rec.regDate)}</div>
        </div>

        <div className="dn-letter-title">หนังสือแจ้งเปลี่ยนผู้ค้ำประกัน</div>

        <div className="dn-letter-meta">
          <div><span className="dn-lm-k">เรื่อง</span> แจ้งให้ดำเนินการเปลี่ยนผู้ค้ำประกันเงินกู้</div>
          <div><span className="dn-lm-k">เรียน</span> {rec.memberName}</div>
          <div><span className="dn-lm-k">สมาชิกเลขทะเบียน</span> {rec.memberCode} &nbsp;·&nbsp; สังกัด {deptLabel}</div>
        </div>

        {/* ═══ เนื้อความ ═══ */}
        <div className="dn-letter-body">
          <p>
            ตามที่ท่านได้ทำสัญญากู้เงินไว้กับสหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด{' '}
            โดยมีรายละเอียดสัญญาเงินกู้ที่เกี่ยวข้อง ดังนี้
          </p>

          <table className="mp-table gcn-ct">
            <thead>
              <tr>
                <th style={{ width: 28 }} className="center">ที่</th>
                <th>เลขที่สัญญา / ประเภท</th>
                <th className="right">จำนวนเงินกู้</th>
                <th className="right">ยอดหนี้คงเหลือ</th>
                <th>ผู้ค้ำประกันเดิม</th>
              </tr>
            </thead>
            <tbody>
              {(rec.contracts || []).map((c, i) => (
                <tr key={i}>
                  <td className="center">{i + 1}</td>
                  <td><span className="mono">{c.contractNo}</span> · {c.loanType}</td>
                  <td className="right mono">{fmt.money(c.amount, 2)}</td>
                  <td className="right mono">{fmt.money(c.remaining, 2)}</td>
                  <td>{c.guarName} <span className="muted">({c.guarType})</span></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2">รวม {(rec.contracts || []).length} สัญญา</td>
                <td className="right mono">{fmt.money(rec.totalAmount, 2)}</td>
                <td className="right mono"><b>{fmt.money(rec.totalRemaining, 2)}</b></td>
                <td />
              </tr>
            </tfoot>
          </table>

          <p style={{ marginTop: 10 }}>
            เนื่องจากสหกรณ์ตรวจสอบพบว่า ผู้ค้ำประกันเดิมของท่านไม่สามารถเป็นผู้ค้ำประกันได้ตามเงื่อนไขของสหกรณ์ ด้วยสาเหตุ
          </p>
          <div className="gcn-causes">
            {GCN_LETTER_CAUSES.map(c => (
              <div className="gcn-cause-item" key={c.code}>
                <GcnCheck on={rec.causeCode === c.code} />
                <span>{c.label}
                  {c.code === 'G99' && <span className="gcn-fill"> {otherCauseTxt}</span>}
                </span>
              </div>
            ))}
          </div>

          <p style={{ marginTop: 10 }}>
            สหกรณ์จึงขอแจ้งให้ท่านดำเนินการ <b>จัดหาผู้ค้ำประกันรายใหม่</b> แทนผู้ค้ำประกันเดิม{' '}
            และนำเอกสารที่เกี่ยวข้องมายื่นต่อสหกรณ์ <b>ภายในวันที่ {fmt.date(rec.dueDate)}</b>{' '}
            โดยผู้ค้ำประกันรายใหม่จะต้องมีคุณสมบัติเป็นไปตามระเบียบ หลักเกณฑ์ และเงื่อนไขที่สหกรณ์กำหนด
          </p>
          <p style={{ marginTop: 8 }}>
            หากท่านไม่ดำเนินการภายในระยะเวลาที่กำหนด สหกรณ์อาจพิจารณาดำเนินการตามระเบียบ ข้อบังคับ{' '}
            หรือเงื่อนไขแห่งสัญญากู้เงินที่เกี่ยวข้องต่อไป
          </p>
          {rec.note && <p style={{ marginTop: 8 }}>{rec.note}</p>}
          <p style={{ marginTop: 8 }}>จึงเรียนมาเพื่อโปรดดำเนินการ</p>
        </div>

        {/* ═══ ลงนาม ═══ */}
        <div className="dn-sign-wrap">
          <div className="dn-sign-box">
            <div>ขอแสดงความนับถือ</div>
            <div className="dn-sign-line" />
            <div>( {rec.signer} )</div>
            <div>ตำแหน่ง {rec.signerPosition}</div>
            <div className="muted" style={{ fontSize: '.92em' }}>สหกรณ์ออมทรัพย์การสื่อสารแห่งประเทศไทย จำกัด</div>
          </div>
        </div>

        {/* ═══ เอกสารประกอบ ═══ */}
        <div className="gcn-attach-req">
          <div className="gcn-sec-title">เอกสารประกอบการเปลี่ยนผู้ค้ำประกัน</div>
          <ul>
            <li>สำเนาบัตรประจำตัวประชาชนของผู้ค้ำประกันรายใหม่</li>
            <li>สำเนาทะเบียนบ้านของผู้ค้ำประกันรายใหม่</li>
            <li>เอกสารแสดงสถานะการเป็นสมาชิก</li>
            <li>หนังสือยินยอมเป็นผู้ค้ำประกัน</li>
            <li>เอกสารอื่น ๆ ตามที่สหกรณ์กำหนด</li>
          </ul>
        </div>

        {/* ═══ หมายเหตุสำหรับเจ้าหน้าที่ ═══ */}
        <div className="gcn-staff-note">
          <div className="gcn-sec-title">หมายเหตุสำหรับเจ้าหน้าที่</div>
          <div className="gcn-staff-grid">
            <div><span className="k">ทะเบียนติดตามเลขที่</span><span className="v mono">{rec.id}</span></div>
            <div><span className="k">วันที่ลงทะเบียน</span><span className="v">{fmt.date(rec.regDate)}</span></div>
            <div><span className="k">วันที่ครบกำหนด</span><span className="v">{fmt.date(rec.dueDate)}</span></div>
            <div><span className="k">สังกัดสมาชิก</span><span className="v">{deptLabel}</span></div>
            <div><span className="k">เจ้าหน้าที่ผู้บันทึก</span><span className="v">{rec.enteredBy}</span></div>
            <div><span className="k">แจ้งผู้ค้ำล่วงหน้า</span><span className="v">{rec.notifyAhead ? 'ใช่' : 'ไม่'}</span></div>
          </div>
          <div className="gcn-staff-status">
            <span className="k">สถานะรายการ</span>
            <div className="gcn-status-flags">
              {statusFlags.map(s => (
                <span className="gcn-cause-item" key={s.v}>
                  <GcnCheck on={rec.status === 'cancelled' ? s.v === 'cancelled' : reached(s.v)} />
                  <span>{s.l}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mp-doc-meta" style={{ marginTop: 14, justifyContent: 'space-between' }}>
          <span>ทะเบียนติดตาม {rec.id}{rec.refNo ? ` · ${rec.refNo}` : ''}</span>
          <span>พิมพ์เมื่อ {fmt.datetime(now.toISOString())} น.</span>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(sheet, document.body);
}

Object.assign(window, { GcnPrintSheet });
