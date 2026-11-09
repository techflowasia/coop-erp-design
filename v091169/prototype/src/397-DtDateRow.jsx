// ════════════════════════════════════════════════════════════════════
//  ค่าคงที่ประเภทบัญชีเงินฝาก — patch แท็บ (override ของไฟล์ 283)
//   • แท็บ 2 ข้อกำหนดและการปรับ : เพิ่มวันที่เริ่มต้น / วันที่สิ้นสุด
//     (วันที่สิ้นสุดเลือกก่อนวันที่เริ่มต้นไม่ได้)
//   • แท็บ 4 การคิด Int./Div.  : ส่งรายงวด → กรอกจำนวนงวดที่ต้องส่ง
//   • แท็บ 5 อัตรา Int./Div.   : ตัดคอลัมน์ "ฐานวัน" ออก
//   • แท็บ 6 ถอนก่อนกำหนด      : คิดภาษี → กรอกอัตราภาษีที่ต้องเสีย
// ════════════════════════════════════════════════════════════════════

// ── แถววันที่ในฟอร์ม (มี min/max กันช่วงวันที่ผิด) ──
function DtDateRow({ label, v, editing, min, max, onChange, hint }) {
  return (
    <DtRow label={label}>
      {editing
        ? <window.ThaiDateField value={v || ''} min={min || undefined} max={max || undefined} onChange={onChange} />
        : (v ? <span className="mono">{fmt.date(v)}</span> : <span className="muted">{hint || '—'}</span>)}
    </DtRow>
  );
}

function DatTabConditions({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  const setStart = (v) => {
    const next = { ...s, condStartDate: v };
    if (v && s.condEndDate && s.condEndDate < v) next.condEndDate = v;
    onSettings(next);
  };
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <DtGroup title="ฝาก — ถอน" sub="ตรวจสอบยอดขั้นต่ำเมื่อเปิด/ฝาก/ถอน และยอดคงเหลือหลังถอน">
            <DtRow label="เปิดบัญชีขั้นต่ำ"><DtNum v={s.minOpen} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minOpen', v)} /></DtRow>
            <DtRow label="เงื่อนไขเปิดบัญชี"><DtSel group="openCond" v={s.openCond} editing={editing} onChange={(v) => set('openCond', v)} /></DtRow>
            <DtRow label="ฝากขั้นต่ำ/รายการ"><DtNum v={s.minDeposit} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minDeposit', v)} /></DtRow>
            <DtRow label="ถอนขั้นต่ำ/รายการ"><DtNum v={s.minWithdraw} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minWithdraw', v)} /></DtRow>
            <DtRow label="คงเหลือขั้นต่ำหลังถอน"><DtNum v={s.minBalance} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minBalance', v)} /></DtRow>
            <DtCheck label="จำกัดยอดคงเหลือสูงสุด" checked={s.maxBalanceOn} editing={editing} onChange={(v) => set('maxBalanceOn', v)} />
            {s.maxBalanceOn && <>
              <DtRow label="สูงสุดไม่เกิน" indent><DtNum v={s.maxBalance} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('maxBalance', v)} /></DtRow>
              <DtRow label="เปรียบเทียบจาก" indent><DtSel group="compareBase" v={s.compareBase} editing={editing} onChange={(v) => set('compareBase', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="ข้อกำหนดครั้งการถอน">
            <DtCheck label="จำกัดจำนวนครั้งการถอน" checked={s.wdCountLimit} editing={editing} onChange={(v) => set('wdCountLimit', v)} />
            {s.wdCountLimit && <>
              <DtRow label="ถอนได้ไม่เกิน" indent><DtNum v={s.wdCountMax} editing={editing} suffix="ครั้ง" max={110} onChange={(v) => set('wdCountMax', v)} /></DtRow>
              <DtRow label="ภายใน" indent>
                <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                  <DtNum v={s.wdCountWithin} editing={editing} max={90} onChange={(v) => set('wdCountWithin', v)} />
                  <DtSel group="timeUnit" v={s.wdCountWithinUnit} editing={editing} width={90} onChange={(v) => set('wdCountWithinUnit', v)} />
                </div>
              </DtRow>
            </>}
            <DtRow label="ถอน/ปิดบัญชีได้เมื่อเปิดบัญชีแล้ว">
              <div className="l2-inwrap" style={{ justifyContent: 'flex-end' }}>
                <DtNum v={s.closeAfterN} editing={editing} max={90} onChange={(v) => set('closeAfterN', v)} />
                <DtSel group="timeUnit" v={s.closeAfterUnit} editing={editing} width={90} onChange={(v) => set('closeAfterUnit', v)} />
              </div>
            </DtRow>
          </DtGroup>

          <DtGroup title="การถือสมุดคู่ฝาก">
            <DtRow label="การถือสมุดคู่ฝาก"><DtSel group="passbookHold" v={s.passbookHold} editing={editing} onChange={(v) => set('passbookHold', v)} /></DtRow>
            <DtRow label="รายการที่ไม่นับครั้งการถอน" stack><DtMulti v={Array.isArray(s.nonCountTxns) ? s.nonCountTxns : ['WCN', 'WDC', 'WDE']} editing={editing} opts={window.depWithdrawTxnOpts ? window.depWithdrawTxnOpts() : []} placeholder="เลือกรายการถอนที่ไม่นับครั้ง" onChange={(v) => set('nonCountTxns', v)} /></DtRow>
          </DtGroup>
        </div>

        <div className="l2-col">
          <DtGroup title="กรณีสมุดหาย / ชำรุด">
            <DtCheck label="คิดค่าปรับกรณีสมุดหาย/ชำรุด" checked={s.lostBookPenaltyOn} editing={editing} onChange={(v) => set('lostBookPenaltyOn', v)} />
            {s.lostBookPenaltyOn && <>
              <DtRow label="ค่าปรับกรณีสมุดหาย" indent><DtNum v={s.lostBookFee} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('lostBookFee', v)} /></DtRow>
              <DtRow label="คู่บัญชี (บันทึกรายได้ค่าปรับ)" indent><DtGl v={s.lostBookGl} editing={editing} onChange={(v) => set('lostBookGl', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="กรณีถอนเกินจำนวนครั้งที่กำหนด">
            <DtCheck label="คิดค่าปรับเมื่อถอนเกินครั้ง" checked={s.overWdPenaltyOn} editing={editing} onChange={(v) => set('overWdPenaltyOn', v)} />
            {s.overWdPenaltyOn && <>
              <DtRow label="คิดค่าปรับจาก" indent><DtSel group="overWdBaseOpts" v={s.overWdBase === 'balance' ? 'balance' : 'withdrawn'} editing={editing} onChange={(v) => set('overWdBase', v)} /></DtRow>
              <DtRow label="% ค่าปรับ" indent><DtNum v={(s.overWdBase === 'flat' || s.overWdPercent == null) ? 1 : s.overWdPercent} editing={editing} decimals={2} suffix="%" max={100} onChange={(v) => set('overWdPercent', v)} /></DtRow>
              <DtRow label="จำนวนเงินค่าปรับขั้นต่ำ" indent><DtNum v={s.overWdMinFee ?? 200} editing={editing} decimals={2} suffix="บาท" max={9999999} onChange={(v) => set('overWdMinFee', v)} /></DtRow>
              <DtRow label="เงื่อนไขช่วงยอด (ไม่เกิน)" indent><DtNum v={Number(s.overWdRangeCond) > 0 ? Number(s.overWdRangeCond) : 9999999} editing={editing} decimals={2} suffix="บาท" max={999999999} onChange={(v) => set('overWdRangeCond', v)} /></DtRow>
              <DtRow label="คู่บัญชี (บันทึกค่าปรับ)" indent><DtGl v={s.overWdGl} editing={editing} onChange={(v) => set('overWdGl', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="การทำรายการด้านฝาก">
            <DtCheck label="จำกัดการฝาก" checked={s.depTxnLimitOn} editing={editing} onChange={(v) => set('depTxnLimitOn', v)} />
            {s.depTxnLimitOn && <>
              <DtRow label="ต่อ 1" indent><DtTxt v={s.depTxnPer} editing={editing} center onChange={(v) => set('depTxnPer', v)} /></DtRow>
              <DtRow label="ภายใน" indent><DtSel group="timeUnit" v={s.depTxnWithin} editing={editing} onChange={(v) => set('depTxnWithin', v)} /></DtRow>
              <DtRow label="ฝากได้สูงสุด" indent><DtNum v={s.depTxnMaxAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('depTxnMaxAmount', v)} /></DtRow>
            </>}
          </DtGroup>

          <DtGroup title="การรับฝากย้อนหลัง" sub="กำหนดว่าประเภทเงินฝากนี้บันทึกรายการฝากย้อนหลังได้หรือไม่ และย้อนได้ไม่เกินกี่วัน">
            <DtCheck label="อนุญาตให้บันทึกรายการฝากย้อนหลัง" checked={!!s.backdateOn} editing={editing} onChange={(v) => set('backdateOn', v)} />
            {s.backdateOn && <>
              <DtRow label="ฝากช้าได้ไม่เกิน" indent>
                <DtNum v={s.backdateDays != null ? s.backdateDays : 7} editing={editing} suffix="วัน" max={90} onChange={(v) => set('backdateDays', v)} />
              </DtRow>
              <DtRow label="หน่วยการนับวัน" indent>
                <DtSel group="backdateUnit" v={s.backdateUnit || 'calendar'} editing={editing} onChange={(v) => set('backdateUnit', v)} />
              </DtRow>
            </>}
          </DtGroup>

          <DtGroup title="การทำรายการด้านถอน">
            <DtCheck label="จำกัดการถอน" checked={s.wdTxnLimitOn} editing={editing} onChange={(v) => set('wdTxnLimitOn', v)} />
            {s.wdTxnLimitOn && <>
              <DtRow label="ต่อ 1" indent><DtTxt v={s.wdTxnPer} editing={editing} center onChange={(v) => set('wdTxnPer', v)} /></DtRow>
              <DtRow label="ภายใน" indent><DtSel group="timeUnit" v={s.wdTxnWithin} editing={editing} onChange={(v) => set('wdTxnWithin', v)} /></DtRow>
              <DtRow label="ถอนได้สูงสุด" indent><DtNum v={s.wdTxnMaxAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('wdTxnMaxAmount', v)} /></DtRow>
            </>}
          </DtGroup>
        </div>
      </div>
    </div>
  );
}

function DatTabCalc({ record, editing, onSettings }) {
  const s = record.settings;
  const set = (k, v) => onSettings({ ...s, [k]: v });
  return (
    <div className="search-card l2-card">
      <div className="l2-cols">
        <div className="l2-col">
          <DtGroup title="ขั้นต่ำคิด Int./Div." sub="กำหนดยอดขั้นต่ำที่นำมาคำนวณดอกเบี้ย">
            <DtRow label="ทั่วไป"><DtNum v={s.minIntGeneral} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minIntGeneral', v)} /></DtRow>
            <DtRow label="รายเดือน"><DtNum v={s.minIntMonthly} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('minIntMonthly', v)} /></DtRow>
            <DtCheck label="ได้รับดอกเบี้ยรายเดือน" checked={s.monthlyIntOn} editing={editing} onChange={(v) => set('monthlyIntOn', v)} />
            <DtRow label="การรับ INT"><DtSel group="intReceiveMode" v={s.intReceiveMode} editing={editing} onChange={(v) => set('intReceiveMode', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="ถอนก่อนกำหนด">
            <DtRow label="การจ่าย Int./Div."><DtSel group="earlyPayMode" v={s.earlyPayMode} editing={editing} onChange={(v) => set('earlyPayMode', v)} /></DtRow>
            <DtRow label="วันที่ต้นเงิน"><DtSel group="principalDateMode" v={s.principalDateMode} editing={editing} onChange={(v) => set('principalDateMode', v)} /></DtRow>
            <DtCheck label="ถอน Int./Div. ได้" checked={s.earlyWithdrawIntOn} editing={editing} onChange={(v) => set('earlyWithdrawIntOn', v)} />
            <DtRow label="คิด Int./Div. จาก"><DtSel group="intCalcFrom" v={s.intCalcFrom} editing={editing} onChange={(v) => set('intCalcFrom', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="ยอดเงินคิด / ตั้ง Int./Div. ค้าง">
            <DtRow label="การคิด Int./Div. (ฐานยอด)"><DtSel group="intCalcBase" v={s.intCalcBalanceBase} editing={editing} onChange={(v) => set('intCalcBalanceBase', v)} /></DtRow>
            <DtCheck label="ตั้งดอกเบี้ยค้าง" checked={s.accrueOn} editing={editing} onChange={(v) => set('accrueOn', v)} />
            {s.accrueOn && <DtRow label="วิธีคิด" indent><DtSel group="accrueMethod" v={s.accrueMethod} editing={editing} onChange={(v) => set('accrueMethod', v)} /></DtRow>}
          </DtGroup>
        </div>

        <div className="l2-col">
          <DtGroup title="ค่าปรับ / การคิดดอกเบี้ยถอนก่อน">
            <DtRow label="การคิดดอกเบี้ย"><DtSel group="earlyIntCalc" v={s.earlyIntCalc} editing={editing} onChange={(v) => set('earlyIntCalc', v)} /></DtRow>
            <DtRow label="อัตราค่าปรับ"><DtNum v={s.earlyPenaltyRate} editing={editing} decimals={2} suffix="%" onChange={(v) => set('earlyPenaltyRate', v)} /></DtRow>
            <DtRow label="จำนวนเงินค่าปรับ"><DtNum v={s.earlyPenaltyAmount} editing={editing} decimals={2} suffix="บาท" onChange={(v) => set('earlyPenaltyAmount', v)} /></DtRow>
            <DtRow label="คู่บัญชี (ค่าปรับ)"><DtGl v={s.earlyPenaltyGl} editing={editing} onChange={(v) => set('earlyPenaltyGl', v)} /></DtRow>
            <DtRow label="ดอกเบี้ยในใบสั่ง"><DtTxt v={s.intInSlip} editing={editing} onChange={(v) => set('intInSlip', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="เมื่อ Int./Div. ทบต้นแล้ว">
            <DtRow label="คิด Int./Div. (ดำเนินการ)"><DtSel group="exhaustAction" v={s.exhaustAction} editing={editing} onChange={(v) => set('exhaustAction', v)} /></DtRow>
            {s.exhaustAction === 'transfer' && <>
              <DtRow label="ประเภทเงินฝากปลายทาง" indent><DtTxt v={s.transferTargetType} editing={editing} placeholder="รหัส/ชื่อประเภทบัญชี" onChange={(v) => set('transferTargetType', v)} /></DtRow>
              <DtRow label="อัตรา Int./Div. ปลายทาง" indent><DtNum v={s.transferRate} editing={editing} decimals={4} suffix="%" onChange={(v) => set('transferRate', v)} /></DtRow>
            </>}
            <DtCheck label="มีการฝากรายเดือน" checked={s.monthlyDeposit} editing={editing} onChange={(v) => set('monthlyDeposit', v)} />
            <DtRow label="การเรียกคืน ด/บ"><DtSel group="recallMode" v={s.recallMode} editing={editing} onChange={(v) => set('recallMode', v)} /></DtRow>
          </DtGroup>

          <DtGroup title="การส่งแบบรายงวด">
            {(() => { const pm = (s.periodicSend === true || s.periodicSend === 'period') ? 'period' : 'none'; return (<>
            <DtRow label="ส่งแบบรายงวด"><DtSel group="periodicSendMode" v={pm} editing={editing} onChange={(v) => set('periodicSend', v)} /></DtRow>
            {pm === 'period' && <>
              <DtRow label="จำนวนเงินส่ง" indent><DtSel group="periodicAmtMode" v={s.periodicAmtMode || 'equal'} editing={editing} onChange={(v) => set('periodicAmtMode', v)} /></DtRow>
              <DtRow label="จำนวนงวดที่ต้องส่ง" indent>
                <DtNum v={s.periodicCount} editing={editing} suffix="งวด" max={480} onChange={(v) => set('periodicCount', v)} />
              </DtRow>
              <DtRow label="จำนวนงวดผิดนัด" indent>
                <DtNum v={s.periodicMissMax || 0} editing={editing} suffix="งวด" max={480} onChange={(v) => set('periodicMissMax', v)} />
              </DtRow>
              <DtRow label="จำนวนงวดส่งล่าช้า" indent>
                <DtNum v={s.periodicLateMax || 0} editing={editing} suffix="งวด" max={480} onChange={(v) => set('periodicLateMax', v)} />
              </DtRow>
            </>}
            </>); })()}
          </DtGroup>
        </div>
      </div>
    </div>
  );
}

function DatTabRate({ record, editing, onTable }) {
  // แท็บอัตรา Int./Div. — 1 แถวต่อประเภทสมาชิก: เลือกตารางอัตรา (ขั้นบันไดอยู่ในเมนูอัตราดอกเบี้ยเงินฝาก) + ภาษี
  const intTables = (window.depIntTables ? window.depIntTables() : []);
  const tblName = (t) => t.code + ' · ' + t.name.replace(new RegExp('^' + t.code + '-'), '');
  const tblOf = (code) => intTables.find(x => x.code === code) || null;
  const IM = window.DEP_INT_METHODS;
  const MT = [{ v: 'all', l: 'ทุกประเภท' }, { v: 'regular', l: 'สมาชิกปกติ' }, { v: 'associate', l: 'สมาชิกสมทบ' },
    { v: 'ext-person', l: 'บุคคลภายนอก' }, { v: 'ext-juristic', l: 'นิติบุคคลภายนอก' }];
  const mtNorm = (v) => (/^associate/.test(v || '') ? 'associate' : (MT.some(o => o.v === v) ? v : 'all'));
  const mtLabel = (v) => (MT.find(o => o.v === mtNorm(v)) || MT[0]).l;
  const today = new Date().toISOString().slice(0, 10);
  const TAX_DEF = { all: { taxMode: 'fixed', taxRate: 15 }, regular: { taxMode: 'exempt', taxRate: 0 }, associate: { taxMode: 'exempt', taxRate: 0 },
                    'ext-person': { taxMode: 'fixed', taxRate: 15 }, 'ext-juristic': { taxMode: 'fixed', taxRate: 1 } };
  const TC = (window.DAT_OPTS && window.DAT_OPTS.taxCalcMethod) || [{ v: 'full', l: 'คิดช่วงเต็ม' }, { v: 'actual', l: 'คิดตามจริง' }];
  const taxOf = (t) => ({ taxMode: (t.taxMode === 'wht' ? 'fixed' : t.taxMode) || (TAX_DEF[mtNorm(t.memberType)] || TAX_DEF.all).taxMode,
                          taxRate: t.taxRate != null ? t.taxRate : (TAX_DEF[mtNorm(t.memberType)] || TAX_DEF.all).taxRate,
                          taxCalc: t.taxCalc || 'full' });
  // ตารางที่ชื่อตรงกับประเภทเงินฝากนี้ — ใช้เป็นค่าตั้งต้น
  const live = intTables.filter(x => x.enabled && (x.rows || []).length);
  const bare = (t) => t.name.replace(new RegExp('^' + t.code + '-'), '').trim();
  const recName = String(record.name || '').replace(/^เงินฝาก/, '').trim();
  const nameTbl = live.find(t => bare(t) === recName)
    || live.filter(t => recName.includes(bare(t))).sort((x, y) => bare(y).length - bare(x).length)[0]
    || live.find(t => bare(t).includes(recName)) || live[0] || null;
  // อัตราดอกเบี้ย — เลือก 1 อัตราจากขั้นที่มีผลอยู่ของตาราง (แถวที่สิ้นสุดแล้วไม่แสดง เว้นแต่เป็นค่าที่เลือกไว้)
  const allOpts = (tb) => (tb.rows || []).map((r, k) => ({ id: r.id || (tb.code + '-' + (k + 1)), r }));
  const isCur = (r) => !r.endDate || r.endDate >= today;
  const rowOpts = (tb, keep) => { const all = allOpts(tb); const cur = all.filter(o => isCur(o.r) || o.id === keep);
    return (cur.length ? cur : all).sort((x, y) => Number(x.r.balFrom || 0) - Number(y.r.balFrom || 0)); };
  const balShort = (r) => (Number(r.balTo) >= 99999999 ? fmt.money(Number(r.balFrom || 0), 0) + ' ขึ้นไป' : fmt.money(Number(r.balFrom || 0), 0) + '–' + fmt.money(Number(r.balTo || 0), 0));
  const firstOpt = (code) => { const tb = tblOf(code); const o = tb ? rowOpts(tb)[0] : null; return o ? { rateRow: o.id, rate: o.r.rate } : { rateRow: '', rate: '' }; };
  const mkRow = (mt, base) => { const x = TAX_DEF[mt] || TAX_DEF.all; const tcode = (base && base.rateTable) || (nameTbl ? nameTbl.code : ''); return {
    ...firstOpt(tcode),
    memberType: mt, rateTable: tcode, method: (base && base.method) || 'daily', dayBase: 365,
    taxMode: base && base.taxMode != null && mtNorm(base.memberType) === mt ? base.taxMode : x.taxMode,
    taxRate: base && base.taxRate != null && mtNorm(base.memberType) === mt ? base.taxRate : x.taxRate,
    taxCalc: (base && base.taxCalc) || 'full', approve: (base && base.approve) || 'draft',
    user: (base && base.user) || 'จันทร์เพ็ญ มาลี', date: (base && base.date) || today }; };
  // รวมข้อมูลเดิม (แยกตามขั้น) → 1 แถวต่อประเภทสมาชิก · ยังไม่มีข้อมูล → ตัวอย่าง สมาชิกปกติ / บุคคลภายนอก
  const collapse = (list) => {
    const hasTbl = list.some(t => t.rateTable);
    if (!list.length || !hasTbl) {
      const b = list[0] || {};
      return [mkRow('regular', { ...b, memberType: 'regular' }), mkRow('ext-person', { ...b, memberType: 'ext-person' })];
    }
    const seen = new Set(), out = [];
    list.forEach(t => { const mt = mtNorm(t.memberType); if (seen.has(mt) && !t.__dup) return; seen.add(mt);
      const tc = t.rateTable || (nameTbl ? nameTbl.code : '');
      const tb = tblOf(tc), ok = tb && allOpts(tb).some(o => o.id === t.rateRow);
      out.push({ ...t, memberType: mt, rateTable: tc, ...(ok ? {} : firstOpt(tc)) }); });
    return out;
  };
  const rows = collapse(record.rateTiers || []);
  const save = (list) => onTable('rateTiers', list);
  const setRow = (i, k, v) => save(rows.map((r, idx) => {
    if (idx !== i) return r;
    const n = { ...r, [k]: v, user: 'จันทร์เพ็ญ มาลี', date: today };
    if (k === 'memberType') { const x = TAX_DEF[mtNorm(v)] || TAX_DEF.all; n.taxMode = x.taxMode; n.taxRate = x.taxRate; }
    if (k === 'rateTable') { n.rateRow = ''; n.rate = ''; }
    if (k === 'rateRow') { const tb = tblOf(n.rateTable); const o = tb ? allOpts(tb).find(x => x.id === v) : null; n.rate = o ? o.r.rate : ''; }
    return n;
  }));
  const used = new Set(rows.map(t => mtNorm(t.memberType)));
  const freeMt = MT.find(o => !used.has(o.v));
  const addRow = () => { if (!freeMt) return; save([...rows, mkRow(freeMt.v, { rateTable: rows[0] && rows[0].rateTable, method: rows[0] && rows[0].method })]); };
  const delRow = (i) => save(rows.filter((_, idx) => idx !== i));
  const missTbl = (t) => !t.rateTable || !tblOf(t.rateTable);
  const missRate = (t) => { const tb = tblOf(t.rateTable); return !!tb && !allOpts(tb).some(o => o.id === t.rateRow); };
  window.__datRateMiss = rows.some(t => missTbl(t) || missRate(t));
  const tierText = (tb) => {
    const nowIso = today;
    const cur = (tb.rows || []).filter(r => (!r.effectiveDate || r.effectiveDate <= nowIso) && (!r.endDate || r.endDate >= nowIso));
    return (cur.length ? cur : (tb.rows || [])).slice().sort((x, y) => Number(x.balFrom) - Number(y.balFrom));
  };
  const [openTier, setOpenTier] = useState(null);
  const balTxt = (r) => fmt.money(Number(r.balFrom || 0), 2) + (Number(r.balTo) >= 99999999 ? ' ขึ้นไป' : ' – ' + fmt.money(Number(r.balTo || 0), 2));

  return (
    <>
      {editing && rows.some(t => missTbl(t) || missRate(t)) && (
        <div className="dat-warn" style={{ background: 'var(--danger-50)', borderColor: 'color-mix(in srgb, var(--danger) 28%, transparent)', color: 'var(--danger)', marginBottom: 12 }}>
          <Icon name="info" size={14} />
          <span>มีประเภทสมาชิกที่ยังไม่ได้เลือกตารางอัตราดอกเบี้ยหรืออัตราดอกเบี้ย (กรอบแดง) — เลือกให้ครบก่อนบันทึก</span>
        </div>
      )}
      <DtTableShell title="อัตราดอกเบี้ย / เงินปันผล — ตามประเภทสมาชิก" count={rows.length} editing={editing && !!freeMt} onAdd={addRow} minWidth={1180}
        sub="แต่ละประเภทสมาชิกเลือกตารางอัตราจากเมนูอัตราดอกเบี้ยเงินฝาก (ขั้นบันไดตามยอดเงินกำหนดในตารางนั้น) และตั้งภาษี ณ ที่จ่ายของตัวเอง">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 170 }}>ประเภทสมาชิก</th>
            <th rowSpan={2} className="center group-col" style={{ width: 240 }}>ตารางอัตราดอกเบี้ย</th>
            <th rowSpan={2} className="center group-col" style={{ width: 230 }}>อัตราดอกเบี้ย (%)</th>
            <th rowSpan={2} className="center group-col" style={{ width: 110 }}>วิธีคำนวณ</th>
            <th colSpan={3} className="center group-col">ภาษี ณ ที่จ่าย</th>
            <th rowSpan={2} className="center group-col" style={{ width: 150 }}>ผู้บันทึก</th>
            {editing && <th rowSpan={2} className="center group-col" style={{ width: 62 }}>จัดการ</th>}
          </tr>
          <tr><th className="center sub-col" style={{ width: 124 }}>อัตราภาษี</th><th className="center sub-col" style={{ width: 86 }}>% ภาษี</th><th className="center sub-col" style={{ width: 118 }}>วิธีคิดภาษี</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 9 : 8} className="center muted" style={{ padding: '24px' }}>ไม่พบข้อมูล — กด “เพิ่มแถว”</td></tr>}
          {rows.map((t, i) => {
            const tb = tblOf(t.rateTable), mt = mtNorm(t.memberType);
            const tx = taxOf(t), ex = tx.taxMode === 'exempt';
            return (
              <React.Fragment key={mt + i}>
              <tr>
                <td>{editing
                  ? <select className="cfg-input sm" style={{ width: '100%' }} value={mt} onChange={(e) => setRow(i, 'memberType', e.target.value)}>
                      {MT.filter(o => o.v === mt || !used.has(o.v)).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  : <span>{mtLabel(mt)}</span>}</td>
                <td>{editing
                  ? <select className={'cfg-input sm' + (missTbl(t) ? ' error' : '')} style={{ width: '100%' }} value={tb ? t.rateTable : ''} onChange={(e) => setRow(i, 'rateTable', e.target.value)}>
                      <option value="">— เลือกตารางอัตราดอกเบี้ย —</option>
                      {intTables.filter(x => x.enabled || x.code === t.rateTable).map(x => <option key={x.code} value={x.code}>{tblName(x)}{x.enabled ? '' : ' (ปิดใช้งาน)'}</option>)}
                    </select>
                  : (tb ? <span>{tblName(tb)}</span> : <span style={{ color: 'var(--danger)' }}>ยังไม่ได้เลือก</span>)}</td>
                <td className="center">{!tb ? <span className="muted">—</span> : (() => {
                  const opts = rowOpts(tb, t.rateRow), cur = opts.find(o => o.id === t.rateRow);
                  return editing
                    ? <select className={'cfg-input sm' + (cur ? '' : ' error')} style={{ width: '100%' }} value={cur ? cur.id : ''} onChange={(e) => setRow(i, 'rateRow', e.target.value)}>
                        <option value="">— เลือกอัตรา —</option>
                        {opts.map(o => <option key={o.id} value={o.id}>{fmt.money(Number(o.r.rate || 0), 2)}% ({balShort(o.r)}{isCur(o.r) ? '' : ' · สิ้นสุดแล้ว'})</option>)}
                      </select>
                    : (cur ? <span><span className="mono" style={{ fontWeight: 600 }}>{fmt.money(Number(cur.r.rate || 0), 2)}%</span> <span className="muted" style={{ fontSize: 12 }}>({balShort(cur.r)})</span></span> : <span style={{ color: 'var(--danger)' }}>ยังไม่ได้เลือก</span>);
                })()}</td>
                <td className="center">{editing
                  ? <select className="cfg-input sm" style={{ minWidth: 96 }} value={t.method || 'daily'} onChange={(e) => setRow(i, 'method', e.target.value)}>{Object.entries(IM).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                  : <span>{IM[t.method || 'daily']?.label}</span>}</td>
                <td className="center">{editing
                  ? <select className="cfg-input sm" style={{ width: '100%' }} value={tx.taxMode} onChange={(e) => setRow(i, 'taxMode', e.target.value)}>
                      <option value="fixed">อัตราคงที่</option><option value="exempt">ยกเว้นภาษี</option>
                    </select>
                  : <span className={ex ? 'muted' : ''}>{ex ? 'ยกเว้นภาษี' : 'อัตราคงที่'}</span>}</td>
                <td className="num-cell">{ex ? <span className="muted">—</span> : editing
                  ? <input className="sh-grid-input" inputMode="decimal" value={tx.taxRate} onChange={(e) => setRow(i, 'taxRate', e.target.value.replace(/[^0-9.]/g, ''))} />
                  : <span className="sh-grid-num">{fmt.money(Number(tx.taxRate || 0), 2)}</span>}</td>
                <td className="center">{ex ? <span className="muted">—</span> : editing
                  ? <select className="cfg-input sm" style={{ width: '100%' }} value={tx.taxCalc} onChange={(e) => setRow(i, 'taxCalc', e.target.value)}>{TC.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                  : <span>{(TC.find(o => o.v === tx.taxCalc) || TC[0]).l}</span>}</td>
                <td style={{ borderLeft: '1px solid var(--divider)' }}>
                  <div style={{ fontSize: 12.5 }}>{t.user || '—'}</div>
                  <div className="muted mono" style={{ fontSize: 11 }}>{t.date ? fmt.date(t.date) : ''}</div>
                </td>
                <DtDelCell editing={editing} onDel={() => delRow(i)} />
              </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </DtTableShell>
    </>
  );
}

function DatTabEarly({ record, editing, onTable }) {
  const rows = record.earlyWithdraw || [];
  const setRow = (i, k, v) => onTable('earlyWithdraw', rows.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const addRow = () => onTable('earlyWithdraw', [...rows, { ageLessThan: 0, unit: 'month', intCond: 'none', rateMode: 'bytype', rateType: '-', rateTable: '-', penalty: false, tax: true, taxRate: 15 }]);
  const delRow = (i) => onTable('earlyWithdraw', rows.filter((_, idx) => idx !== i));
  return (
    <>
      <DtTableShell title="เงื่อนไขถอนก่อนกำหนด (หลายช่วงระยะเวลาฝาก)" count={rows.length} editing={editing} onAdd={addRow} minWidth={1080}
        sub="ตรวจอายุเงินฝากจริง ณ วันถอน แล้วเลือกเงื่อนไขที่ตรงกับช่วงระยะเวลาฝาก — กำหนดว่าได้ดอกเบี้ยหรือไม่ คิดค่าปรับ/ภาษีหรือไม่ และอัตราภาษีที่ต้องเสีย">
        <thead>
          <tr>
            <th rowSpan={2} className="center" style={{ width: 56 }}>ลำดับ</th>
            <th colSpan={2} className="center group-col">ระยะฝากน้อยกว่า</th>
            <th rowSpan={2} className="center group-col" style={{ width: 130 }}>Int./Div.</th>
            <th rowSpan={2} className="center group-col" style={{ width: 140 }}>อัตรา Int./Div.</th>
            <th rowSpan={2} className="center group-col" style={{ width: 150 }}>ประเภทอ้างอิง</th>
            <th rowSpan={2} className="center group-col" style={{ width: 130 }}>ตาราง Int./Div.</th>
            <th rowSpan={2} className="center group-col" style={{ width: 70 }}>ค่าปรับ</th>
            <th rowSpan={2} className="center group-col" style={{ width: 70 }}>คิดภาษี</th>
            <th rowSpan={2} className="center group-col" style={{ width: 110 }}>อัตราภาษี (%)</th>
            {editing && <th rowSpan={2} className="center group-col" style={{ width: 62 }}>จัดการ</th>}
          </tr>
          <tr>
            <th className="center sub-col">จำนวน</th><th className="center sub-col">หน่วย</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={editing ? 11 : 10} className="center muted" style={{ padding: '24px' }}>ยังไม่มีเงื่อนไข — กด “เพิ่มแถว”</td></tr>}
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="center">{i + 1}</td>
              <td className="num-cell"><DtNumCell editing={editing} v={r.ageLessThan} onChange={(v) => setRow(i, 'ageLessThan', v)} /></td>
              <td className="num-cell" style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="timeUnit" v={r.unit} onChange={(v) => setRow(i, 'unit', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyIntCond" v={r.intCond} onChange={(v) => setRow(i, 'intCond', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyRateMode" v={r.rateMode} onChange={(v) => setRow(i, 'rateMode', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="earlyRateType" v={r.rateType} onChange={(v) => setRow(i, 'rateType', v)} /></td>
              <td style={{ textAlign: 'center' }}><DtSelCell editing={editing} group="rateTable" v={r.rateTable} onChange={(v) => setRow(i, 'rateTable', v)} /></td>
              <td className="center" style={{ borderLeft: '1px solid var(--divider)' }}><DtCheckCell editing={editing} v={r.penalty} onChange={(v) => setRow(i, 'penalty', v)} /></td>
              <td className="center"><DtCheckCell editing={editing} v={r.tax} onChange={(v) => setRow(i, 'tax', v)} /></td>
              <td className="num-cell">{!r.tax
                ? <span className="muted">—</span>
                : (editing
                  ? <input className="sh-grid-input" type="number" step="0.01" min="0" max="100" value={r.taxRate ?? ''} placeholder="0.00"
                           onChange={(e) => setRow(i, 'taxRate', e.target.value)} />
                  : <span className="sh-grid-num"><b>{fmt.money(Number(r.taxRate || 0), 2)}</b></span>)}</td>
              <DtDelCell editing={editing} onDel={() => delRow(i)} />
            </tr>
          ))}
        </tbody>
      </DtTableShell>
    </>
  );
}

window.DAT_TAB_FOOT = {
  rate: 'ค่าคงที่อัตราดอกเบี้ยเงินฝากถูกยุบรวมมาตั้งค่าที่แท็บนี้ — ตั้งค่าที่เดียวพร้อมข้อกำหนดอื่นของประเภทบัญชี · ประวัติอัตราเดิมจะไม่ถูกลบ',
  early: 'กรณีฝากไม่ถึงขั้นต่ำอาจไม่ได้รับดอกเบี้ย — ฝากเกินช่วงขั้นต่ำแต่ยังไม่ครบกำหนด อาจได้รับดอกเบี้ยตามอัตราอ้างอิง เช่น อัตราเงินฝากออมทรัพย์ · ช่องอัตราภาษีกรอกได้เมื่อเลือก “คิดภาษี”',
  fees: 'กฎค่าธรรมเนียมบันทึกทันทีเมื่อกดบันทึกในกล่องแก้ไข (แยกจากการบันทึกข้อมูลประเภทบัญชี)',
};
Object.assign(window, { DatTabConditions, DatTabCalc, DatTabRate, DatTabEarly, DtDateRow });
