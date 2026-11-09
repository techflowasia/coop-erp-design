// ═════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน — รับ / จ่าย ตามประเภท (รวมระบบอื่น)
//  รวมงานสองเมนูไว้ในหน้าเดียว สลับด้วยแท็บ โดยแต่ละแท็บใช้ workspace
//  เดิมทั้งชุด จึงทำงานได้ครบเหมือนเมนูต้นทาง และบันทึกลงทะเบียนเดิม
//  + แท็บ "ใบสำคัญจ่ายจากแผนกอื่น" — ใบที่แผนกอื่นคีย์เข้ามา เปิดรายการ
//    เพื่อปรับแก้ข้อมูลการจ่ายและบันทึกการจ่ายเงินได้ในหน้าเดียว
// ═════════════════════════════════════════════════════════════════

const FB_OPEN_STATUS = ['draft', 'pending_check', 'pending_appr', 'approved'];

// ─── รายละเอียดใบสำคัญจ่ายจากแผนกอื่น — ปรับแก้ข้อมูลการจ่าย + จ่ายเงิน ───

// ─── รายละเอียดรายการจากระบบอื่น (ทุนการศึกษา / สินเชื่อ) — ดูอย่างเดียว + จ่ายเงิน ──
function FbExtDetail({ row, onClose, onPay }) {
  const r = row.rec || {};
  const sch = row.srcKey === 'scholar';
  const v = (x) => (x == null || x === '' ? '—' : x);
  const D = (x) => (x ? window.fmt.date(x) : '—');
  const M = (x) => window.fmt.money(Number(x) || 0, 2);
  const paid = row.pay === 'paid';
  const L = (g, x) => {
    if (x == null || x === '') return '';
    const o = ((window.SCH_OPTS || {})[g] || []).find(z => String(z.v) === String(x));
    if (o) return o.l;
    return window.schReqLabel ? window.schReqLabel(g, x) : x;
  };
  const Kv = ({ k, val, mono }) => (
    <div className="fbt-field"><label className="fbt-label">{k}</label>
      <div className={'cfg-input fbt-ro' + (mono ? ' mono' : '')} style={{ display: 'flex', alignItems: 'center' }}>{val}</div></div>
  );
  const sec = (title, kids) => (
    <div className="search-card dat-section" style={{ marginBottom: 12 }}>
      <div className="dat-section-head is-bar"><span className="head-bar" /><div><div className="dat-section-title">{title}</div></div></div>
      <div className="fbt-grid g3" style={{ padding: '12px 16px 16px' }}>{kids}</div>
    </div>
  );
  return (
    <div data-screen-label={'หน้ารับ/จ่าย ตามประเภท — ' + row.srcLabel}>
      <div className="page-actions dep-open-sticky" ref={(el) => {
        if (!el || el.__stk) return; el.__stk = true;
        const sc = el.closest('.main') || window;
        const bc = sc.querySelector ? sc.querySelector('.breadcrumb-bar') : null;
        const topPx = (bc ? bc.offsetHeight : 0) - 16;
        el.style.top = topPx + 'px';
        const on = () => {
          const a = el.getBoundingClientRect(), s = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 };
          el.classList.toggle('stuck', (sc.scrollTop || 0) > 4 && Math.abs(a.top - (s.top + topPx + 16)) < 2);
        };
        sc.addEventListener('scroll', on, { passive: true }); on();
      }}>
        <button className="btn ghost sm" data-keep-top="" onClick={onClose}><Icon name="chevLeft" /> กลับรายการจ่าย</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{row.srcLabel} <span className="mono">{row.id}</span></h1>
          <span className={'pill ' + (paid ? 'ok' : 'warn')}>{paid ? 'จ่ายเงินแล้ว' : 'รอจ่ายเงิน'}</span>
          <a href={row.goto} style={{ fontSize: 12 }}>ดูต้นทาง ›</a>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        {paid
          ? <span className="fb-ro-note"><Icon name="lock" size={12} /> จ่ายเงินแล้ว — ดูข้อมูลได้อย่างเดียว</span>
          : <button className="btn primary sm" data-keep-top="" onClick={() => onPay(row)}>จ่ายเงิน</button>}
      </div>
      {sch ? <>
        {sec('ข้อมูลผู้รับเงิน', <>
          <Kv k="เลขสมาชิก" val={v(r.memberCode || r.member)} mono />
          <Kv k="ชื่อ-สกุลสมาชิก" val={v(r.memberName || r.name)} />
          <Kv k="ผู้รับทุน" val={v([r.childTitle, r.childFirst, r.childLast && ' ' + r.childLast].filter(Boolean).join('') || r.childName)} />
          <Kv k="ระดับชั้น" val={v(L('eduLevel', r.eduLevel))} />
          <Kv k="ปีการศึกษา" val={v(r.schoolYear)} />
        </>)}
        {sec('ข้อมูลการจ่าย', <>
          <Kv k="ประเภททุน" val={v(L('scholarType', r.scholarType))} />
          <Kv k="ยอดทุน (บาท)" val={M(r.amount)} mono />
          <Kv k="หมวดงบประมาณ" val={v(r.budgetLabel)} />
          <Kv k="ผู้อนุมัติ" val={v(r.approvedBy)} />
          <Kv k="วันที่อนุมัติ" val={D(r.approvedDate)} />
          <Kv k="วิธีจ่าย / บัญชีรับเงิน" val={v([L('payBy', r.payBy), r.payAccount].filter(Boolean).join(' · '))} />
        </>)}
      </> : <>
        {sec('ข้อมูลผู้รับเงิน', <>
          <Kv k="เลขสมาชิก" val={v(r.memberCode)} mono />
          <Kv k="ชื่อ-สกุลสมาชิก" val={v(r.memberName)} />
          <Kv k="หน่วยงาน" val={v(r.dept)} />
          <Kv k="เลขที่สัญญา" val={v(r.contractNo || r.id)} mono />
          <Kv k="ประเภทเงินกู้" val={v([r.productCode, r.productName].filter(Boolean).join(' · '))} />
          <Kv k="วัตถุประสงค์" val={v(r.purposeLabel)} />
        </>)}
        {sec('ข้อมูลการจ่าย', <>
          <Kv k="ยอดกู้ (บาท)" val={M(r.amount)} mono />
          <Kv k="หัก ณ วันจ่าย (บาท)" val={M((Number(r.amount) || 0) - (Number(r.netReceive) || 0))} mono />
          <Kv k="ยอดจ่ายสุทธิ (บาท)" val={<b style={{ color: 'var(--brand, #237450)' }}>{M(r.netReceive || r.amount)}</b>} mono />
          <Kv k="วิธีจ่าย" val={window.ldPayMethod ? window.ldPayMethod(r.payMethod).l : v(r.payMethod)} />
          <Kv k="บัญชีรับเงิน" val={v([r.payBank, r.payAccount].filter(Boolean).join(' · '))} />
          <Kv k="ผู้อนุมัติ / วันที่" val={v([r.decidedBy, r.decidedDate && D(r.decidedDate)].filter(Boolean).join(' · '))} />
        </>)}
      </>}
    </div>
  );
}

function FbPayDetail({ voucher, onClose, onSave, onPay }) {
  const [d, setD] = React.useState(() => JSON.parse(JSON.stringify(voucher)));
  const set = (k, v) => setD(p => ({ ...p, [k]: v }));
  const totals = window.vchTotals(d.lines);
  const st = window.VCH_STATUS[d.status] || window.VCH_STATUS.draft;
  const canPay = d.status !== 'paid' && d.status !== 'cancelled';
  const [editing, setEditing] = React.useState(false);
  const cancelEdit = () => { setD(JSON.parse(JSON.stringify(voucher))); setEditing(false); };
  const saveEdit = () => { onSave(d); setEditing(false); };
  const Sel = window.RcvSelect || 'select';
  const TDate = window.RcvThaiDate;

  return (
    <div data-screen-label="หน้ารับ/จ่าย ตามประเภท — จ่ายใบสำคัญจ่าย">
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
        <button className="btn ghost sm" data-keep-top="" onClick={onClose}><Icon name="chevLeft" /> กลับรายการจ่าย</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>ใบสำคัญจ่าย <span className="mono">{d.id}</span></h1>
          <span className={'pill ' + st.pill}>{st.l}</span>
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        {!canPay && <span className="fb-ro-note"><Icon name="lock" size={12} /> จ่ายเงินแล้ว{d.paidAt ? ' ' + window.fmt.date(d.paidAt) : ''} — ดูข้อมูลได้อย่างเดียว</span>}
        {canPay && !editing && <>
          <button className="btn sm" data-keep-top="" onClick={() => setEditing(true)}>แก้ไข</button>
          <button className="btn primary sm" data-keep-top="" onClick={() => onPay(d)}>จ่ายเงิน</button>
        </>}
        {canPay && editing && <>
          <button className="btn sm" data-keep-top="" onClick={cancelEdit}>ยกเลิก</button>
          <button className="btn primary sm" data-keep-top="" onClick={saveEdit}>บันทึก</button>
        </>}
      </div>

      <div className="search-card dat-section" style={{ marginBottom: 12 }}>
        <div className="dat-section-head is-bar"><span className="head-bar" />
          <div><div className="dat-section-title">ข้อมูลการจ่ายเงิน</div>
            <div className="muted" style={{ fontSize: 11.5 }}>การเงินตรวจและแก้ไขวิธีการจ่ายก่อนยืนยันจ่ายเงิน</div></div>
        </div>
        <div style={{ padding: '12px 16px 16px' }} className={canPay && editing ? undefined : 'fb-readonly'} inert={canPay && editing ? undefined : ''}>
          <div className="fbt-grid g3">
            <FbtField label="วันที่เอกสาร">
              <input className="cfg-input fbt-ro" value={window.fmt.date(d.docDate)} readOnly />
            </FbtField>
            <FbtField label="ผู้จัดทำ (แผนกต้นทาง)">
              <input className="cfg-input fbt-ro" value={d.createdBy || '—'} readOnly />
            </FbtField>
            <FbtField label="วันครบกำหนดจ่าย">
              {TDate ? <TDate value={d.dueDate || ''} onChange={(v) => set('dueDate', v)} />
                : <input className="cfg-input" type="date" value={d.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} />}
            </FbtField>

            <FbtField label="วิธีการจ่าย" required>
              <Sel className="cfg-input" value={d.payMethod} onChange={(e) => set('payMethod', e.target.value)}>
                {window.VCH_PAYMENT.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </Sel>
            </FbtField>
            <FbtField label="บัญชีจ่ายของสหกรณ์">
              <Sel className="cfg-input" value={d.coopBank} onChange={(e) => set('coopBank', e.target.value)}>
                {window.VCH_COOP_BANKS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </Sel>
            </FbtField>
            <FbtField label="เลขที่เช็ค" hint={d.payMethod === 'cheque' ? '' : '(เฉพาะจ่ายเช็ค)'}>
              <input className="cfg-input mono" value={d.chequeNo || ''} disabled={d.payMethod !== 'cheque'}
                     onChange={(e) => set('chequeNo', e.target.value)} placeholder="เลขที่เช็ค" />
            </FbtField>
          </div>

          <div className="fbt-grid g1" style={{ marginTop: 10 }}>
            <FbtField label="หมายเหตุ">
              <input className="cfg-input" value={d.note || ''} onChange={(e) => set('note', e.target.value)}
                     placeholder="หมายเหตุการจ่ายเงิน" />
            </FbtField>
          </div>

        </div>
      </div>

      {window.VoucherForm && (
        <div className="fb-vch-embed fb-readonly" inert="">
          <window.VoucherForm voucher={voucher} vouchers={[voucher]}
            structure={window.budLoadStructure ? window.budLoadStructure() : (window.BUDGET_SEED || [])}
            groups={(() => { try { return JSON.parse(localStorage.getItem('voucher_groups') || 'null') || window.VCH_GROUP_SEED || []; } catch (e) { return window.VCH_GROUP_SEED || []; } })()}
            onSave={() => {}} onCancel={onClose} onToast={() => {}} />
        </div>
      )}
    </div>
  );
}

function FinBothWorkspace({ onToast }) {
  const [view, setView] = React.useState({ kind: 'list' });
  const [fbtList, setFbtList] = React.useState(() => (window.fbtLoad ? window.fbtLoad() : []));
  const [fcxList, setFcxList] = React.useState(() => (window.fcxLoad ? window.fcxLoad() : []));
  const [vchList, setVchList] = React.useState(() => (window.vchLoadVouchers ? window.vchLoadVouchers() : []));
  const audit = React.useContext(window.AuditContext || React.createContext({ log: () => {} }));
  const [qDraft, setQDraft] = React.useState('');
  const [srcDraft, setSrcDraft] = React.useState('all');
  const [stDraft, setStDraft] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [srcFilter, setSrcFilter] = React.useState('all');
  const [extTick, setExtTick] = React.useState(0);
  const [stFilter, setStFilter] = React.useState('all');
  const [openVch, setOpenVch] = React.useState(null);
  const Sel = window.RcvSelect || 'select';

  const backToList = () => {
    setFbtList(window.fbtLoad ? window.fbtLoad() : []);
    setFcxList(window.fcxLoad ? window.fcxLoad() : []);
    setVchList(window.vchLoadVouchers ? window.vchLoadVouchers() : []);
    setView({ kind: 'list' });
  };

  const rows = React.useMemo(() => {
    const key = q.trim().toLowerCase();
    const a = (fbtList || []).map(r => ({
      src: 'bytype', srcLabel: 'การเงินบันทึกเอง', srcTone: 'primary', rec: r,
      id: r.id, date: r.receiptDate || r.txnDate, name: r.partyName, note: r.detail,
      verb: (window.fbtTxnType(r.type) || {}).verb || '',
      net: window.fbtTotals(r.lines).net, ts: r.ts || '', pay: (r.paid || (window.fbtTxnType(r.type) || {}).verb === 'รับ') ? 'paid' : 'pending',
    }));
    const b = (fcxList || []).map(r => ({
      src: 'cross', rec: r,
      ...((sys) => sys === 'loan' ? { srcLabel: 'สินเชื่อ', srcTone: 'info', srcKey: 'loan' }
        : sys === 'scholar' ? { srcLabel: 'ทุนการศึกษา', srcTone: 'warning', srcKey: 'scholar' }
        : { srcLabel: 'ระบบอื่น', srcTone: '', srcKey: 'other' })(r.sourceSys || (/ทุน/.test(r.note || r.detail || '') ? 'scholar' : /กู้|สินเชื่อ/.test(r.note || r.detail || '') ? 'loan' : '')),
      id: r.id, date: r.txnDate, name: r.memberName || r.partyName || '—', note: r.note || r.detail,
      verb: r.txnType === 'receive' ? 'รับ' : 'จ่าย',
      net: Number(r.amount != null ? r.amount : (r.net || 0)), ts: r.ts || '', pay: (r.paid || r.txnType === 'receive') ? 'paid' : 'pending',
    }));
    const c = (vchList || []).filter(v => v.status === 'approved' || v.status === 'paid').map(v => ({
      src: 'voucher', kind: 'voucher', srcLabel: 'ใบสำคัญจ่าย', srcTone: 'purple', srcKey: 'voucher', rec: v,
      id: v.id, date: v.docDate, name: (v.payees || [])[0] ? (v.payees[0].name + ((v.payees.length > 1) ? ' +' + (v.payees.length - 1) + ' ราย' : '')) : '—',
      note: v.note, verb: 'จ่าย', net: window.vchTotals(v.lines).net, ts: v.docDate || '',
      status: v.status, pay: v.status === 'paid' ? 'paid' : 'pending',
    }));
    // รายการที่ระบบอื่นอนุมัติแล้ว ส่งมาให้การเงินจ่าย
    const extPaid = (() => { try { return JSON.parse(localStorage.getItem('fin_ext_paid') || '{}'); } catch (e) { return {}; } })();
    const sch = (() => { try { return (window.schReqLoadStore ? window.schReqLoadStore() : JSON.parse(localStorage.getItem('scholarship_requests') || 'null') || window.SCHREQ_SEED || []); } catch (e) { return []; } })();
    const d = sch.filter(r => r.status === 'approved' || r.status === 'paid').map(r => ({
      src: 'ext', srcKey: 'scholar', srcLabel: 'ทุนการศึกษา', srcTone: 'warning', rec: r, goto: '#finance/scholarship-pay',
      id: r.id, date: r.approvedDate || r.reqDate || r.date, name: r.memberName || r.name || '—',
      note: r.budgetLabel || r.scholarship || 'จ่ายทุนการศึกษา', verb: 'จ่าย', net: Number(r.amount) || 0,
      ts: r.approvedDate || '', pay: (extPaid[r.id] || r.status === 'paid') ? 'paid' : 'pending',
    }));
    const lds = (() => { try { return window.ldLoad ? window.ldLoad() : []; } catch (e) { return []; } })();
    const e = lds.filter(r => r.status === 'approved' && r.payMethod !== 'transfer').map(r => ({
      src: 'ext', srcKey: 'loan', srcLabel: 'สินเชื่อ', srcTone: 'info', rec: r, goto: '#finance/loan-disbursement',
      id: r.id, date: r.decidedDate || r.reqDate, name: r.memberName || '—',
      note: 'จ่ายเงินกู้ · ' + window.ldPayMethod(r.payMethod).l, verb: 'จ่าย', net: Number(r.netReceive || r.amount) || 0,
      ts: r.decidedDate || '', pay: extPaid[r.id] ? 'paid' : 'pending',
    }));
    const all = [...a, ...b, ...c, ...d, ...e].sort((x, y) => (x.ts < y.ts ? 1 : -1));
    return all
      .filter(x => srcFilter === 'all' || (x.srcKey || x.src) === srcFilter)
      .filter(x => stFilter === 'all' || x.pay === stFilter)
      .filter(x => !key || ((x.id || '') + ' ' + (x.name || '') + ' ' + (x.note || '')).toLowerCase().includes(key));
  }, [fbtList, fcxList, vchList, q, srcFilter, stFilter, extTick]);

  if (view.kind === 'ext') {
    const live = rows.find(x => x.id === view.row.id) || view.row;
    return <FbExtDetail row={live} onClose={backToList} onPay={payRow} />;
  }
  if (view.kind === 'bytype') {
    const W = window.FinByTypeWorkspace;
    return (
      <div data-screen-label="หน้ารับ/จ่าย ตามประเภท — ฟอร์มตามประเภท">
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
          <button className="btn ghost sm" data-keep-top="" onClick={backToList}><Icon name="chevLeft" /> กลับรายการจ่าย</button>
          <span className="spacer" style={{ flex: 1 }} />
          {view.ro && view.paid && (
            <span className="fb-ro-note"><Icon name="lock" size={12} /> รายการนี้จ่ายเงินแล้ว — ดูข้อมูลได้อย่างเดียว</span>
          )}
          {view.rec && !view.paid && view.ro && <>
            <button className="btn sm" data-keep-top="" onClick={() => setView(v => ({ ...v, ro: false }))}>แก้ไข</button>
            <button className="btn primary sm" data-keep-top="" onClick={() => payRow(rows.find(x => x.rec && x.rec.id === view.rec.id) || { src: 'bytype', rec: view.rec, id: view.rec.id, srcLabel: '', name: '', net: 0 })}>จ่ายเงิน</button>
          </>}
          {(!view.rec || !view.ro) && <>
            <button className="btn sm" data-keep-top="" onClick={() => view.rec ? setView(v => ({ ...v, ro: true, nonce: (v.nonce || 0) + 1 })) : backToList()}>ยกเลิก</button>
            <button className="btn primary sm" data-keep-top="" onClick={(e) => {
              const box = e.currentTarget.closest('[data-screen-label]').querySelector('.fb-embed');
              const b = box && [...box.querySelectorAll('.page-actions button')].find(x => /บันทึก/.test(x.textContent));
              if (b) b.click();
            }}>บันทึก</button>
          </>}
        </div>
        <div className={'fb-embed' + (view.ro ? ' fb-readonly' : '')} inert={view.ro ? '' : undefined}>
          {W ? <W key={view.nonce || 0} onToast={onToast} initialRecord={view.rec} /> : null}
        </div>
      </div>
    );
  }
  if (view.kind === 'cross') {
    const W = window.FinCrossSystemWorkspace;
    return (
      <div data-screen-label="หน้ารับ/จ่าย ตามประเภท — ฟอร์มระบบอื่น">
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
          <button className="btn ghost sm" data-keep-top="" onClick={backToList}><Icon name="chevLeft" /> กลับรายการจ่าย</button>
          <span className="spacer" style={{ flex: 1 }} />
          {view.ro && view.paid && (
            <span className="fb-ro-note"><Icon name="lock" size={12} /> รายการนี้จ่ายเงินแล้ว — ดูข้อมูลได้อย่างเดียว</span>
          )}
          {view.rec && !view.paid && view.ro && <>
            <button className="btn sm" data-keep-top="" onClick={() => setView(v => ({ ...v, ro: false }))}>แก้ไข</button>
            <button className="btn primary sm" data-keep-top="" onClick={() => payRow(rows.find(x => x.rec && x.rec.id === view.rec.id) || { src: 'cross', rec: view.rec, id: view.rec.id, srcLabel: '', name: '', net: 0 })}>จ่ายเงิน</button>
          </>}
          {(!view.rec || !view.ro) && <>
            <button className="btn sm" data-keep-top="" onClick={() => view.rec ? setView(v => ({ ...v, ro: true, nonce: (v.nonce || 0) + 1 })) : backToList()}>ยกเลิก</button>
            <button className="btn primary sm" data-keep-top="" onClick={(e) => {
              const box = e.currentTarget.closest('[data-screen-label]').querySelector('.fb-embed');
              const b = box && [...box.querySelectorAll('.page-actions button')].find(x => /บันทึก/.test(x.textContent));
              if (b) b.click();
            }}>บันทึก</button>
          </>}
        </div>
        <div className={'fb-embed' + (view.ro ? ' fb-readonly' : '')} inert={view.ro ? '' : undefined}>
          {W ? <W key={view.nonce || 0} onToast={onToast} initialRecord={view.rec} /> : null}
        </div>
      </div>
    );
  }

  const total = rows.reduce((s2, r) => s2 + (r.net || 0), 0);
  const applyFilters = () => { setQ(qDraft); setSrcFilter(srcDraft); setStFilter(stDraft); };
  const resetFilters = () => {
    setQDraft(''); setSrcDraft('all'); setStDraft('all');
    setQ(''); setSrcFilter('all'); setStFilter('all');
  };
  // ใบสำคัญจ่ายเก็บข้อมูลคนละรูปแบบ — แปลงให้ครบก่อนเปิดดู
  const vchBudGl = (cat) => {
    const walk = (ns) => { for (const n of ns || []) { if (n.id === cat) return n.gl || ''; const r = walk(n.children); if (r) return r; } return ''; };
    return walk(window.BUDGET_SEED);
  };
  const vchPayeeRef = (p) => {
    if (!p) return null;
    const ref = p.payeeId && window.vchPayee ? window.vchPayee(p.payeeId)
              : (window.VCH_PAYEES || []).find(x => x.name === p.name);
    const mem = (window.MEMBERS_LIST || []).find(m => m.name === p.name || (p.code && m.code === p.code));
    return { ref, mem };
  };
  const voucherAsCross = (v) => ((p0, lk) => ({
    id: v.id, txnDate: v.docDate, txnType: 'pay',
    method: v.payMethod === 'cheque' ? 'cheque' : (v.payMethod === 'cash' ? 'cash' : 'transfer'),
    cashAcct: v.cashAcct || v.bankAcct || '',
    memberCode: (p0 && (p0.memberNo || p0.code)) || (lk && lk.mem && lk.mem.code) || (lk && lk.ref && lk.ref.code) || '',
    memberName: p0 ? p0.name : '',
    deptCode: v.deptCode || (lk && lk.mem && (lk.mem.deptCode || lk.mem.unitCode)) || '',
    dept: v.dept || v.department || (lk && lk.mem && lk.mem.dept) || (lk && lk.ref && lk.ref.dept) || '',
    by: v.createdBy || '', branch: v.branch || '',
    note: v.note,
    lines: (v.lines || []).map(l => ({ acct: l.acct || l.glCode || l.account || vchBudGl(l.cat) || '', desc: l.desc || l.description || '', amount: l.amount })),
  }))((v.payees || [])[0], vchPayeeRef((v.payees || [])[0]));
  const openRow = (r) => {
    const paid = r.pay === 'paid';
    if (r.kind === 'voucher') { setOpenVch(r.rec); return; }
    if (r.src === 'ext') { setView({ kind: 'ext', row: r }); return; }
    setView({ kind: r.src === 'bytype' ? 'bytype' : 'cross', rec: r.rec, ro: true, paid });
  };

  const askPay = (doc) => {
    const net = window.vchTotals(doc.lines).net;
    const p0 = (doc.payees || [])[0];
    const who = p0 ? p0.name + ((doc.payees.length > 1) ? ' และอีก ' + (doc.payees.length - 1) + ' ราย' : '') : '—';
    const pm = (window.VCH_PAYMENT || []).find(o => o.v === doc.payMethod);
    window.depAskConfirm({ title: 'ยืนยันจ่ายเงินตามใบสำคัญจ่าย', okLabel: 'ยืนยันจ่ายเงิน',
      lines: [['เลขที่ใบสำคัญจ่าย', doc.id], ['ผู้รับเงิน', who], ['วิธีการจ่าย', pm ? pm.l : '—'], ['ยอดจ่ายสุทธิ', window.fmt.money(net, 2) + ' บาท']],
      onOk: () => saveVoucher(doc, true) });
  };
  const payRec = (r) => {
    const today = new Date().toISOString().slice(0, 10);
    const mark = (list) => list.map(x => x.id === r.rec.id ? { ...x, paid: true, paidAt: today } : x);
    if (r.src === 'ext') {
      const m = (() => { try { return JSON.parse(localStorage.getItem('fin_ext_paid') || '{}'); } catch (e) { return {}; } })();
      m[r.id] = today; try { localStorage.setItem('fin_ext_paid', JSON.stringify(m)); } catch (e) {}
      setExtTick(t => t + 1);
    } else if (r.src === 'bytype') { const n = mark(window.fbtLoad ? window.fbtLoad() : fbtList); window.fbtSave && window.fbtSave(n); setFbtList(n); }
    else { const n = mark(window.fcxLoad ? window.fcxLoad() : fcxList); if (window.fcxSave) window.fcxSave(n); else { try { localStorage.setItem('fin_cross', JSON.stringify(n)); } catch (e) {} } setFcxList(n); }
    setView({ kind: 'list' });
    audit.log && audit.log({ action: 'update', module: 'การเงิน — รับ/จ่าย ตามประเภท', target: r.id, summary: 'จ่ายเงินรายการ ' + r.id });
    window.depSuccess ? window.depSuccess({ title: 'จ่ายเงินเรียบร้อยแล้ว', desc: 'รายการ ' + r.id + ' เปลี่ยนสถานะเป็น “จ่ายเงินแล้ว”', lines: [['ยอดสุทธิ', window.fmt.money(r.net, 2) + ' บาท']] })
      : (onToast && onToast('จ่ายเงินรายการ ' + r.id + ' แล้ว'));
  };
  const payRow = (r) => {
    if (r.kind === 'voucher') { askPay(r.rec); return; }
    window.depAskConfirm({ title: 'ยืนยันจ่ายเงิน', okLabel: 'ยืนยันจ่ายเงิน',
      lines: [['เลขที่รายการ', r.id], ['ประเภท', r.srcLabel], ['ผู้รับเงิน', r.name || '—'], ['ยอดสุทธิ', window.fmt.money(r.net, 2) + ' บาท']],
      onOk: () => payRec(r) });
  };
  const saveVoucher = (doc, paid) => {
    const today = new Date().toISOString().slice(0, 10);
    const next = (window.vchLoadVouchers ? window.vchLoadVouchers() : vchList)
      .map(v => v.id === doc.id ? { ...doc, status: paid ? 'paid' : doc.status, ...(paid ? { paidAt: today, paidBy: (window.LC_USER || 'เจ้าหน้าที่การเงิน') } : {}) } : v);
    try { localStorage.setItem('vouchers', JSON.stringify(next)); } catch (e) {}
    setVchList(next);
    if (paid) setOpenVch(null); else setOpenVch(doc);
    audit.log && audit.log({
      action: 'update', module: 'การเงิน — รับ/จ่าย ตามประเภท',
      target: doc.id, summary: (paid ? 'จ่ายเงินตามใบสำคัญจ่าย ' : 'แก้ไขข้อมูลการจ่ายใบสำคัญจ่าย ') + doc.id,
    });
    if (paid && window.depSuccess) {
      window.depSuccess({ title: 'จ่ายเงินเรียบร้อยแล้ว', desc: 'ใบสำคัญจ่าย ' + doc.id + ' เปลี่ยนสถานะเป็น “จ่ายเงินแล้ว”',
        lines: [['ยอดจ่ายสุทธิ', window.fmt.money(window.vchTotals(doc.lines).net, 2) + ' บาท']] });
    } else onToast && onToast(paid ? 'จ่ายเงินตามใบสำคัญจ่าย ' + doc.id + ' เรียบร้อย' : 'บันทึกการแก้ไข ' + doc.id + ' แล้ว');
  };



  if (openVch) {
    return <FbPayDetail key={openVch.id} voucher={openVch} onClose={() => setOpenVch(null)}
                        onSave={(doc) => saveVoucher(doc, false)} onPay={(doc) => askPay(doc)} />;
  }
  return (
    <div data-screen-label="หน้ารับ/จ่าย ตามประเภท">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>รับ/จ่าย ตามประเภท</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            บันทึกรายการรับ–จ่ายเงินตามประเภท และติดตามรายการที่รอจ่าย — คลิกรายการเพื่อเปิดดูรายละเอียด
          </div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={() => setView({ kind: 'bytype', rec: null })}>
          <Icon name="plus" /> สร้างรายการรับ/จ่าย
        </button>
      </div>

      <div className="search-card fbt-card">
        <div className="rcv-list-toolbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ค้นหา</span>
            <div className="dep-input" style={{ width: '100%', minWidth: 0, height: 32, boxSizing: 'border-box', background: '#fff' }}>
              <Icon name="search" size={14} />
              <input value={qDraft} onChange={(e) => setQDraft(e.target.value)}
                     onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }}
                     placeholder="เลขที่ / ชื่อผู้รับ–ผู้จ่ายเงิน / รายละเอียด" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภท</span>
            <Sel className="filter-select" style={{ width: '100%' }} value={srcDraft} onChange={(e) => setSrcDraft(e.target.value)}>
              <option value="all">ทุกประเภท</option>
              <option value="bytype">การเงินบันทึกเอง</option>
                <option value="voucher">ใบสำคัญจ่าย</option>
                <option value="scholar">ทุนการศึกษา</option>
                <option value="loan">สินเชื่อ</option>
                <option value="other">ระบบอื่น</option>
            </Sel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span className="muted" style={{ fontSize: 11 }}>สถานะ</span>
            <Sel className="filter-select" style={{ width: '100%' }} value={stDraft} onChange={(e) => setStDraft(e.target.value)}>
              <option value="all">ทุกสถานะ</option>
              <option value="pending">รอจ่ายเงิน</option>
              <option value="paid">จ่ายเงินแล้ว</option>
            </Sel>
          </div>
          <button className="btn primary rcv-tb-btn" onClick={applyFilters}>ค้นหา</button>
          <button className="btn rcv-tb-btn" onClick={resetFilters}>รีเซ็ต</button>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 140 }}>เลขที่</th>
                <th style={{ width: 110 }}>วันที่</th>
                <th style={{ width: 210 }}>ประเภท</th>
                <th style={{ minWidth: 200 }}>ผู้รับ / ผู้จ่ายเงิน</th>
                <th className="center" style={{ width: 120 }}>สถานะ</th>
                <th className="num" style={{ width: 140 }}>สุทธิ (บาท)</th>
                <th className="center" style={{ width: 170 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">ยังไม่มีรายการ</td></tr>
              ) : rows.map((r, i2) => (
                <tr key={r.src + r.id + i2} className="clickable"
                    onClick={() => openRow(r)}>
                  <td className="mono" style={{ fontSize: 12 }}>{r.id}</td>
                  <td className="mono" style={{ fontSize: 12 }}>{window.fmt.date(r.date)}</td>
                  <td><span className={'chip ' + (r.srcTone || '')} style={r.srcTone === 'purple' ? { background: '#f9f0ff', borderColor: '#d3adf7', color: '#531dab' } : undefined}>{r.srcLabel}</span></td>
                  <td>
                    <div className="lt-row-name">{r.name}</div>
                    {r.note && <div className="lt-row-note muted">{r.note}</div>}
                  </td>
                  <td className="center">
                    <span className={'pill ' + (r.pay === 'paid' ? 'ok' : 'warn')}>
                      {r.pay === 'paid' ? (r.verb === 'รับ' ? 'รับเงินแล้ว' : 'จ่ายเงินแล้ว') : 'รอจ่ายเงิน'}
                    </span>
                  </td>
                  <td className="num mono" style={{ fontWeight: 600 }}>{window.fmt.money(r.net, 2)}</td>
                  <td className="center" onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button className="btn sm ex-row-btn fb-act-btn" onClick={() => openRow(r)}>
                        <Icon name="eye" size={13} /> ดู
                      </button>
                      {r.pay !== 'paid' && (
                        <button className="btn primary sm" onClick={() => payRow(r)}>จ่ายเงิน</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="fb-total-row">
                  <td colSpan="5" className="right" style={{ fontWeight: 600 }}>รวมสุทธิ</td>
                  <td className="num mono" style={{ fontWeight: 700 }}>{window.fmt.money(total, 2)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}>
          <Icon name="info" size={11} /> คลิกรายการหรือปุ่ม “ดู” เพื่อเปิดรายละเอียด แล้วกด “แก้ไข” เมื่อต้องการปรับข้อมูล (เฉพาะรายการที่ยังรอจ่าย)
        </p>
      </div>


    </div>
  );
}

function FinBothPage({ onToast }) { return <FinBothWorkspace onToast={onToast} />; }
Object.assign(window, { FinBothPage, FinBothWorkspace });
