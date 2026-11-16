// ════════════════════════════════════════════════════════════════════
//  ระบบงานการเงิน › รับ–จ่ายเงิน — บันทึกทำรายการธนาคาร
//  ฝาก / ถอน / โอน กับบัญชีธนาคารของสหกรณ์ (ทะเบียนจากหน้า "รายการธนาคาร")
// ════════════════════════════════════════════════════════════════════
const { useState: btUseState, useMemo: btUseMemo } = React;

const BT_KINDS = [
  { v: 'ฝากเงิน',       sign: +1 },
  { v: 'ถอนเงิน',       sign: -1 },
  { v: 'โอนเงินเข้า',   sign: +1 },
  { v: 'โอนเงินออก',    sign: -1 },
  { v: 'ดอกเบี้ยรับ',   sign: +1 },
  { v: 'ค่าธรรมเนียม',  sign: -1 },
];
const BT_BRANCH = ['สำนักงานใหญ่', 'สาขาหลักสี่', 'สาขาปากเกร็ด', 'สาขาบางรัก'];

const btAccts = () => {
  try { const s = JSON.parse(localStorage.getItem('coop.bankAccounts.v1')); if (s && s.length) return s; } catch (e) {}
  return (window.BA_SEED_PUBLIC || [
    { id: 'b1', bankName: 'ธ. กรุงไทย จำกัด (มหาชน)', branch: 'สาขา ไปรษณีย์ไทย (กสท)', acctNo: '093-6-01847-2',
      acctName: 'สหกรณ์ออมทรัพย์ กสท จำกัด', type: 'กระแสรายวัน', passbook: '—', coopBal: 8452310.55,
      lastTxn: 'โอนเงินกู้สามัญ 12 ราย', status: 'ใช้งาน' },
  ]);
};
const BT_BANKNAME = { '006': 'ธ. กรุงไทย จำกัด (มหาชน)', '004': 'ธ. กสิกรไทย จำกัด (มหาชน)', '002': 'ธ. กรุงเทพ จำกัด (มหาชน)',
  '014': 'ธ. ไทยพาณิชย์ จำกัด (มหาชน)', '011': 'ธ. ทหารไทยธนชาต จำกัด (มหาชน)', '030': 'ธ. ออมสิน', '034': 'ธ.ก.ส.' };
const btBank = (a) => a.bankName || BT_BANKNAME[a.bankCode] || '—';
const btMoney = (n) => (Number(n) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const BT_TODAY = '23/07/2569';

const BT_LOG_KEY = 'coop.bankTxnLog.v1';
const btLogLoad = () => { try { return JSON.parse(localStorage.getItem(BT_LOG_KEY)) || []; } catch (e) { return []; } };
const btLogSave = (d) => { try { localStorage.setItem(BT_LOG_KEY, JSON.stringify(d.slice(0, 30))); } catch (e) {} };

function BankTxnPage({ onToast }) {
  window.useBreadcrumb && window.useBreadcrumb([{ label: 'บันทึกทำรายการธนาคาร', current: true }], []);
  const accts = btUseMemo(() => btAccts().filter(a => a.status === 'ใช้งาน'), []);
  const [acctId, setAcctId] = btUseState(accts[0] ? accts[0].id : '');
  const [kind, setKind] = btUseState('ฝากเงิน');
  const [docNo, setDocNo] = btUseState('');
  const [amount, setAmount] = btUseState('');
  const [note, setNote] = btUseState('');
  const [branch, setBranch] = btUseState('สำนักงานใหญ่');
  const [log, setLog] = btUseState(btLogLoad);

  const acct = accts.find(a => a.id === acctId) || accts[0] || {};
  const sign = (BT_KINDS.find(k => k.v === kind) || {}).sign || 1;
  const amt = Number(String(amount).replace(/,/g, '')) || 0;
  const bal = Number(acct.coopBal) || 0;
  const withdrawable = Math.max(0, bal - (acct.type === 'ออมทรัพย์' ? 0 : 500));
  const after = bal + sign * amt;
  const over = sign < 0 && amt > withdrawable;
  const ready = !!acct.id && amt > 0 && !over;

  const submit = () => {
    const entry = {
      no: docNo || 'BT' + String(log.length + 1).padStart(5, '0'),
      date: BT_TODAY, kind, acctNo: acct.acctNo, bank: btBank(acct),
      amt: sign * amt, after, note: note || kind, by: 'Chaiwat',
    };
    const next = [entry, ...log];
    setLog(next); btLogSave(next);
    setAmount(''); setNote(''); setDocNo('');
    onToast && onToast(`บันทึก${kind} ${btMoney(amt)} บาท บัญชี ${acct.acctNo} เรียบร้อย`);
  };

  const D = (label, value, tone) => (
    <div className="ap-field">
      <span className="ap-label">{label}</span>
      <div className={'cfg-display-box' + (tone ? ' ' + tone : '')}>{value || '—'}</div>
    </div>
  );
  const F = (label, node, span) => (
    <label className="ap-field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      <span className="ap-label">{label}</span>{node}
    </label>
  );

  return (
    <div data-screen-label="หน้าบันทึกทำรายการธนาคาร">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>บันทึกทำรายการธนาคาร</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2, maxWidth: 760 }}>
            บันทึกการฝาก ถอน และโอนเงินระหว่างสหกรณ์กับบัญชีธนาคาร โดยอ้างอิงทะเบียนบัญชีจากเมนูรายการธนาคาร
          </div>
        </div>
      </div>

      <div className="bt-layout">
        <div className="search-card">
          <div className="section-head" style={{ marginBottom: 12 }}>
            <span className="head-bar" /><h3>บันทึกรายการธนาคาร</h3>
          </div>

          <div className="ap-form-grid bt-grid">
            {F('เลขที่ใบรายการ', <input className="cfg-input mono" value={docNo} onChange={e => setDocNo(e.target.value)} placeholder="Auto" />)}
            {F('รหัสรายการ', <select className="cfg-input" value={kind} onChange={e => setKind(e.target.value)}>{BT_KINDS.map(k => <option key={k.v}>{k.v}</option>)}</select>)}
            {D('เลขที่สมุด', acct.passbook)}
            {D('วันทำการ', BT_TODAY, 'strong mono')}
            {D('ประเภทบัญชี', acct.type)}
          </div>

          <div className="bt-rule" />

          <div className="ap-form-grid bt-grid">
            {F('บัญชีธนาคาร', (
              <select className="cfg-input" value={acctId} onChange={e => setAcctId(e.target.value)}>
                {accts.map(a => <option key={a.id} value={a.id}>{btBank(a)} — {a.acctNo}</option>)}
              </select>), 3)}
            {D('สาขา', acct.branch)}
            {D('เลขที่บัญชี', acct.acctNo, 'mono')}
            {D('ชื่อบัญชี', acct.acctName)}
            {D('รายการล่าสุด', acct.lastTxn)}
          </div>

          <div className="bt-rule" />

          <div className="bt-amount">
            <div className="bt-bal">
              <div><span className="ap-label">ยอดคงเหลือ</span><b className="mono">{btMoney(bal)}</b></div>
              <div><span className="ap-label">ยอดถอนได้</span><b className="mono">{btMoney(withdrawable)}</b></div>
            </div>
            <div className={'bt-amt-box' + (over ? ' bad' : '')}>
              <span className="ap-label">จำนวนเงิน</span>
              <input className="bt-amt-input mono" inputMode="decimal" value={amount}
                     onChange={e => setAmount(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0.00" />
              <span className={'bt-amt-sign ' + (sign > 0 ? 'in' : 'out')}>{sign > 0 ? 'รับเข้า' : 'จ่ายออก'}</span>
            </div>
            <div className="bt-after">
              <span className="ap-label">คงเหลือหลังทำรายการ</span>
              <b className="mono">{btMoney(after)}</b>
              {over && <span className="bt-warn"><Icon name="info" size={12} /> เกินยอดถอนได้</span>}
            </div>
          </div>

          <div className="ap-form-grid bt-grid" style={{ marginTop: 12 }}>
            {F('หมายเหตุ / คำอธิบายรายการ', <input className="cfg-input" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น โอนชำระค่าสาธารณูปโภคประจำเดือน" />, 4)}
          </div>

          <div className="bt-rule" />

          <div className="ap-form-grid bt-grid">
            {F('สาขาที่ทำรายการ', <select className="cfg-input" value={branch} onChange={e => setBranch(e.target.value)}>{BT_BRANCH.map(b => <option key={b}>{b}</option>)}</select>)}
            {D('วันที่ทำรายการ', BT_TODAY, 'mono')}
            {D('รหัสเครื่อง', '192.168.102.22', 'mono')}
            {D('ผู้ทำรายการ', 'Chaiwat')}
          </div>

          <div className="ct-actionbar">
            <Icon name="info" size={13} />
            <span className="muted" style={{ fontSize: 12 }}>
              {over ? 'จำนวนเงินเกินยอดถอนได้ของบัญชีนี้' : ready ? `พร้อมบันทึก${kind} ${btMoney(amt)} บาท` : 'กรอกจำนวนเงินเพื่อบันทึกรายการ'}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn" onClick={() => { setAmount(''); setNote(''); setDocNo(''); }}>ล้างข้อมูล</button>
            <button className="btn primary" disabled={!ready} onClick={submit}><Icon name="check" /> บันทึกรายการ</button>
          </div>
        </div>

        <div className="search-card bt-log-card">
          <div className="section-head"><span className="head-bar" /><h3>รายการที่บันทึกวันนี้</h3>
            <span className="muted" style={{ fontSize: 11 }}>{log.length} รายการ</span></div>
          <div className="bt-log">
            {log.map((e, i) => (
              <div className="bt-log-item" key={i}>
                <div className="bt-log-top">
                  <span className="mono">{e.no}</span>
                  <span className={'mono ' + (e.amt >= 0 ? 'bt-in' : 'bt-out')}>{(e.amt >= 0 ? '+' : '−') + btMoney(Math.abs(e.amt))}</span>
                </div>
                <div className="bt-log-mid">{e.kind} · <span className="mono">{e.acctNo}</span></div>
                <div className="muted bt-log-sub">{e.note} · คงเหลือ <span className="mono">{btMoney(e.after)}</span></div>
              </div>
            ))}
            {log.length === 0 && <div className="empty-state" style={{ padding: 24 }}>ยังไม่มีรายการที่บันทึกวันนี้</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BankTxnPage });
