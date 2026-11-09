// ════════════════════════════════════════════════════════════════════
//  ระบบสินเชื่อ — นิติกรรม (Legal / Juristic Act)
//  หน้าเดียวสลับ 3 โหมด:
//    • list   — ทะเบียนนิติกรรม (ค้นหา/กรอง/ดูรายการที่เคยทำ)
//    • create — สร้างนิติกรรม (เลือกสมาชิก → หลักทรัพย์ + สัญญา → ทำนิติกรรม)
//    • detail — รายละเอียดนิติกรรม (อ่านอย่างเดียว) + พิมพ์เอกสาร
//  ทำนิติกรรมได้ 11 ประเภทตาม TOR · พิมพ์เอกสารได้ 4 แบบ (แก้ไขก่อนพิมพ์)
// ════════════════════════════════════════════════════════════════════

const { useState: laS, useMemo: laM, useContext: laC } = React;

const laInitial = (name) => String(name || '?').replace(/^(นาย|นาง|นางสาว)\s*/, '').slice(0, 1);
const laDateBE = (d) => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return d || '—'; const y = +m[1]; return m[3] + '/' + m[2] + '/' + (y > 2400 ? y : y + 543); };
const laAssetTypes = (a) => [...new Set(window.laAssetsOf(a.memberCode).filter(x => (a.assetIds || []).includes(x.id)).map(x => x.type))].join(', ') || '—';
const laMoney = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// หมายเหตุบังคับ — ปลอดจำนอง (ทุกชนิดย่อย) และ ไถ่ถอน/แบ่งไถ่ถอน ชนิดย่อย "แบ่งไถ่ถอน" (ค-03)
const laNoteRequired = (a) => a.typeCode === 'RL' || (a.typeCode === 'RD' && a.subtype === 'แบ่งไถ่ถอน');
// กลุ่มเอกสารสิทธิ์ (ค-11) — สิ่งปลูกสร้างไปกับกลุ่มของที่ดินที่ตั้ง
const LA_DOC_GROUP_LABEL = { condo: 'ห้องชุด', ns3: 'น.ส.3 / น.ส.3 ก', deed: 'โฉนดที่ดิน' };
const laDocGroupOf = (as, all) => {
  const t = String(as.type || '');
  if (/ห้องชุด|อาคารชุด/.test(t)) return 'condo';
  if (/น\.?\s?ส\.?\s?3/.test(t)) return 'ns3';
  if (/โฉนด|ตราจอง/.test(t)) return 'deed';
  if (/สิ่งปลูกสร้าง/.test(t)) {
    const refs = ((as.building && as.building.refTitleNos) || [as.titleNo]).map(String);
    const land = (all || []).find(x => x !== as && !/สิ่งปลูกสร้าง/.test(String(x.type)) && refs.includes(String(x.titleNo)));
    return land ? laDocGroupOf(land, all) : null;
  }
  return null;
};

// ── เงื่อนไขดึงหลักทรัพย์/สัญญาตามประเภทนิติกรรม ──
const LA_LAND_RE = /โฉนด|ตราจอง|น\.?\s?ส\.?\s?3/;
const LA_NS3_RE = /น\.?\s?ส\.?\s?3/;
const laEligReason = (st, as, mort, assets) => {
  const mg = mort[as.id]; const ty = String(as.type || ''); const t = window.laType(st.typeCode);
  if (st.typeCode === 'MG') {
    // ขึ้นเงิน / ผ่อนต้นเงิน / แก้ไขหนี้ — ทำกับหลักทรัพย์ที่จดจำนองไว้แล้วเท่านั้น
    if (/ขึ้นเงิน|ผ่อนต้น|แก้ไขหนี้/.test(st.subtype || '')) {
      if (!mg) return 'ยังไม่ได้จดจำนอง';
      return st.contractNo && mg.contractNo !== st.contractNo ? 'ติดจำนองกับสัญญา ' + mg.contractNo : '';
    }
    return mg && st.subtype !== 'จำนองลำดับที่สอง' ? 'ติดจำนองอยู่แล้ว (สัญญา ' + mg.contractNo + ') — ใช้ประเภทย่อย "จำนองลำดับที่สอง"' : '';
  }
  // ทุกประเภทนอกจากจดจำนอง → ทำได้หลังจดจำนองแล้วเท่านั้น
  if (!mg) return 'ยังไม่ได้จดจำนอง';
  if (st.contractNo && mg.contractNo !== st.contractNo) return 'ติดจำนองกับสัญญา ' + mg.contractNo;
  if (st.typeCode === 'IS') return LA_NS3_RE.test(ty) ? '' : 'ออกโฉนดได้เฉพาะ น.ส.3 / น.ส.3 ก';
  if (['CB', 'SP', 'SV'].includes(st.typeCode) && !LA_LAND_RE.test(ty)) return 'ใช้ได้เฉพาะที่ดิน';
  if (st.typeCode === 'CB') {
    const K = window.laTypeKey;
    if (st.cbType && K(ty) !== K(st.cbType)) return 'ไม่ใช่ประเภทหลักทรัพย์ ' + st.cbType;
    const anchor = (assets || []).find(x => x.id !== as.id && (st.assetIds || []).includes(x.id) && (!st.cbType || K(x.type) === K(st.cbType)));
    if (anchor && String(anchor.office || '') !== String(as.office || '')) return 'คนละสำนักงานที่ดินกับแปลงที่เลือก (' + (anchor.office || '—') + ')';
  }
  return '';
};
const laContractAssets = (assets, mort, contractNo) => assets.filter(as => mort[as.id] && mort[as.id].contractNo === contractNo);
const laNorm = (st, assets, mort) => {
  if (st.typeCode === 'RD' && st.subtype === 'ไถ่ถอนทั้งหมด' && st.contractNo) return { ...st, assetIds: laContractAssets(assets, mort, st.contractNo).map(x => x.id) };
  return { ...st, assetIds: (st.assetIds || []).filter(id => { const as = assets.find(x => x.id === id); return as && !laEligReason(st, as, mort, assets); }) };
};

// ── การ์ดข้อมูลสมาชิก (หัวหน้าสร้างนิติกรรม) ─────────────────────────
function LaMemberCard({ member, onSearch, onPick }) {
  const m = member || {};
  return (
    <div className="search-card la-member-card">
      <div className="lrq-grid c4">
        <LcField label="เลขสมาชิก">
          <div className="lrq-member-search">
            <ErpMemberPicker member={member} onPick={onPick} source={window.DN_MEMBERS}
                             title="ค้นหาสมาชิก — นิติกรรม" placeholder="เลขสมาชิก…" />
          </div>
        </LcField>
        <LcField label="ชื่อ-นามสกุลสมาชิก"><input className="cfg-input lrq-ro" value={m.name || ''} placeholder="—" readOnly /></LcField>
        <LcField label="เลขที่บัตรประชาชน"><input className="cfg-input lrq-ro mono" value={m.citizenId || ''} placeholder="—" readOnly /></LcField>
        <LcField label="สถานะสมาชิก">
          <select className="cfg-input" value={m.status || ''} disabled>
            {m.status ? <option value={m.status}>{m.status}</option> : <option value="">--- โปรดเลือก ---</option>}
          </select>
        </LcField>
      </div>
      <div className="lrq-grid c3" style={{ marginTop: 10 }}>
        <LcField label="หน่วย/สังกัด"><input className="cfg-input lrq-ro" value={m.dept ? (m.deptCode ? m.deptCode + ' · ' + m.dept : m.dept) : ''} placeholder="โปรดระบุข้อมูล" readOnly /></LcField>
        <LcField label="สถานภาพ">
          <select className="cfg-input" value={m.maritalStatus || 'โสด'} disabled>
            <option>{m.maritalStatus || 'โสด'}</option>
          </select>
        </LcField>
        <LcField label="ชื่อคู่สมรส"><input className="cfg-input lrq-ro" value={m.spouse || (m.maritalStatus === 'สมรส' ? '' : '-')} placeholder="—" readOnly /></LcField>
      </div>
    </div>
  );
}

// ── รายการหลักทรัพย์ ───────────────────────────────────────────────
function LaAssetList({ assets, onView }) {
  return (
    <div className="search-card la-section">
      <div className="section-head"><span className="head-bar" /><h3>รายการหลักทรัพย์</h3><span className="spacer" /><span className="muted" style={{ fontSize: 12 }}>{assets.length} รายการ</span></div>
      <div className="la-asset-list">
        {assets.map(a => (
          <div key={a.id} className="la-asset-row">
            <div className="la-asset-body">
              <div className="la-asset-t">{window.laAssetLabel(a)}<span className="la-asset-type">ประเภท : {a.type}</span></div>
              <div className="la-asset-m">เนื้อที่ : {a.area}<span className="la-asset-sep">ที่ตั้ง :</span>{a.loc}</div>
            </div>
            <button className="la-eye act-view" title="ดูรายละเอียดหลักทรัพย์" onClick={() => onView(a)}><Icon name="eye" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── รายการนิติกรรม (รายการจำนอง) ────────────────────────────────────
function LaActTable({ acts, onCreate, onAddMore, onView, onPrint, onEdit, onDelete }) {
  return (
    <div className="search-card la-section">
      <div className="section-head"><span className="head-bar" /><h3>รายการนิติกรรม</h3><span className="spacer" style={{ flex: 1 }} />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> ทำนิติกรรม</button>
      </div>
      <div className="table-wrap"><div className="table-scroll">
        <table className="tbl la-act-tbl">
          <thead><tr>
            <th style={{ whiteSpace: 'nowrap' }}>เลขที่นิติกรรม</th><th style={{ whiteSpace: 'nowrap' }}>วันที่ทำนิติกรรม</th><th>ประเภทนิติกรรม</th><th>ประเภทหลักทรัพย์</th>
            <th>รายละเอียด</th><th className="center">รวม</th><th style={{ width: 190 }} />
          </tr></thead>
          <tbody>
            {acts.length === 0 ? (
              <tr><td colSpan="7" className="empty-state">ยังไม่มีรายการนิติกรรม — กด “ทำนิติกรรม” เพื่อเพิ่มรายการ</td></tr>
            ) : acts.map(a => {
              const t = window.laType(a.typeCode);
              const sel = window.laAssetsOf(a.memberCode).filter(x => (a.assetIds || []).includes(x.id));
              return (
                <tr key={a.id}>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{a.actNo || '—'}</td>
                  <td className="mono" style={{ whiteSpace: 'nowrap' }}>{laDateBE(a.regDate)}</td>
                  <td>{t.label}<div className="muted" style={{ fontSize: 11 }}>{a.subtype}</div></td>
                  <td>{laAssetTypes(a)}</td>
                  <td style={{ fontSize: 12 }}>
                    {sel.length ? <div style={{ display: 'grid', gap: 2 }}>{sel.map(x => (
                      <div key={x.id}><span>{x.type === 'ห้องชุด' ? 'ห้องชุดเลขที่ ' : 'เลขที่โฉนด '}{x.titleNo}</span>{x.loc && <span className="muted"> · {x.loc}</span>}</div>
                    ))}</div> : '—'}
                  </td>
                  <td className="center">{(a.assetIds || []).length}</td>
                  <td>
                    <div className="la-rowact">
                      <button className="btn sm" onClick={() => onAddMore(a)}>ทำนิติกรรมเพิ่มเติม</button>
                      <button className="la-eye act-edit" title={a.status === 'registered' ? 'ปิดนิติกรรมแล้ว — แก้ไขไม่ได้' : 'แก้ไข'} disabled={a.status === 'registered'} onClick={() => onEdit(a)}
                              style={a.status === 'registered' ? { opacity: .35, cursor: 'not-allowed' } : undefined}><Icon name="edit" size={14} /></button>
                      <button className="la-eye act-print" title="พิมพ์เอกสาร" onClick={() => onPrint(a)}><Icon name="print" size={14} /></button>
                      <button className="la-eye danger act-del" title={a.status === 'registered' ? 'ปิดนิติกรรมแล้ว — ลบไม่ได้' : 'ลบรายการ'} disabled={a.status === 'registered'} onClick={() => onDelete(a)}
                              style={a.status === 'registered' ? { opacity: .35, cursor: 'not-allowed' } : undefined}><Icon name="trash" size={13} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}

// ── Modal ดูรายละเอียดหลักทรัพย์ ────────────────────────────────────
function LaAssetModal({ asset, member, onClose }) {
  return <window.LcAssetDetailModal rec={window.laToLcRec(asset, member)} onClose={onClose} />;
}

// ── Modal ทำนิติกรรม (เพิ่ม/แก้ไขรายการ) ────────────────────────────
function LaActModal({ member, assets, allActs, initial, onConfirm, onClose }) {
  const [a, setA] = laS(() => initial || window.laBlankAct(member));
  const [detail, setDetail] = laS(null);
  const [dragOver, setDragOver] = laS(false);
  const fileRef = React.useRef(null);
  const set = (k, v) => setA(p => ({ ...p, [k]: v }));
  const setFee = (k, v) => setA(p => ({ ...p, fees: { ...p.fees, [k]: v } }));
  const t = window.laType(a.typeCode);
  const contracts = window.laContractsOf(member);
  const specialReqs = laM(() => window.laSpecialReqsOf(member), [member]);
  const debts = laM(() => window.laDebtsOf(member), [member]);
  const debtTotal = debts.reduce((x, d) => x + d.remaining, 0);
  const [showDebts, setShowDebts] = laS(false);
  const landTypes = window.LA_CB_TYPES;
  const mort = laM(() => window.laMortgageMap(allActs, a.id), [allActs, a.id]);
  const mortContracts = laM(() => {
    const seen = {}; Object.values(mort).forEach(v => { if (!seen[v.contractNo]) seen[v.contractNo] = v; });
    return Object.values(seen).map(v => { const c = contracts.find(x => x.contractNo === v.contractNo) || {}; return { contractNo: v.contractNo, reqNo: v.reqNo || c.reqNo || v.contractNo, type: c.type || 'จดจำนองแล้ว' }; });
  }, [mort]);
  const isPost = t.phase === 'post';
  const contractOpts0 = isPost ? specialReqs.filter(c => mortContracts.some(m => m.contractNo === c.contractNo)) : specialReqs;
  const contractOpts = a.reqNo && !contractOpts0.some(c => c.reqNo === a.reqNo) ? [...contractOpts0, { reqNo: a.reqNo, contractNo: a.contractNo, type: 'รายการเดิม' }] : contractOpts0;
  const staffOpts = a.attorney && !window.laStaff(a.attorney) ? [...window.LA_STAFF, { name: a.attorney, position: 'รายการเดิม', citizenId: a.attorneyId }] : window.LA_STAFF;
  const officeOpts = [...new Set([...window.LA_LAND_OFFICES, ...assets.map(x => x.office).filter(Boolean), a.landOffice].filter(Boolean))];
  const [tried, setTried] = laS(false);
  const upd = (fn) => { setSaveErr(''); setA(p => laNorm(fn(p), assets, mort)); };

  const changeType = (code) => {
    const nt = window.laType(code);
    upd(p => {
      let n = { ...p, typeCode: code, subtype: nt.subtypes[0] || '', fees: window.laDefaultFees(code, p.amount) };
      const pool = nt.phase === 'post' ? specialReqs.filter(c => mortContracts.some(m => m.contractNo === c.contractNo)) : specialReqs;
      if (!pool.some(c => c.reqNo === n.reqNo)) {
        const c = pool[0] || {}; n = { ...n, contractNo: c.contractNo || '', reqNo: c.reqNo || '' };
      }
      if (code === 'CB' && !n.cbType) n.cbType = landTypes[0] || '';
      return n;
    });
  };
  const changeAmount = (v) => setA(p => ({ ...p, amount: v, fees: window.laDefaultFees(p.typeCode, v) }));
  const toggleAsset = (id) => { setSaveErr(''); setA(p => {
    const as = assets.find(x => x.id === id);
    if (!(p.assetIds || []).includes(id) && as && laEligReason(p, as, mort, assets)) return p;
    const s = new Set(p.assetIds || []); s.has(id) ? s.delete(id) : s.add(id);
    const ids = [...s]; const first = assets.find(x => x.id === ids[0]);
    return { ...p, assetIds: ids, landOffice: first && first.office ? first.office : p.landOffice };
  }); };
  const addFiles = (fileList) => {
    const arr = Array.from(fileList || []).map(f => ({ name: f.name, url: URL.createObjectURL(f), size: f.size >= 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : (f.size / 1024).toFixed(1) + ' KB' }));
    setA(p => ({ ...p, attachments: [...(p.attachments || []), ...arr] }));
  };
  const rmFile = (i) => setA(p => ({ ...p, attachments: p.attachments.filter((_, j) => j !== i) }));

  const noteReq = laNoteRequired(a);
  const noteMissing = noteReq && !String(a.note || '').trim();
  const [saveErr, setSaveErr] = laS('');
  const sel = assets.filter(x => (a.assetIds || []).includes(x.id));
  const selMort = sel.filter(x => mort[x.id]);
  const lbl = (x) => window.laAssetLabel(x);
  const errs = []; const warns = [];
  sel.forEach(x => { const r = laEligReason(a, x, mort, assets); if (r) errs.push(lbl(x) + ' — ' + r); });
  if (isPost && !a.contractNo) errs.push('กรุณาเลือกสัญญาที่จดจำนองหลักทรัพย์ไว้');
  const cAll = a.contractNo ? laContractAssets(assets, mort, a.contractNo) : [];
  if (a.typeCode === 'RL' && cAll.length && sel.length >= cAll.length) errs.push('ปลอดจำนองต้องเหลือหลักทรัพย์ติดจำนองอย่างน้อย 1 แปลง — หากปลดทั้งหมดให้ทำ "ไถ่ถอน / แบ่งไถ่ถอน"');
  if (a.typeCode === 'RD' && a.subtype === 'ไถ่ถอนบางแปลง' && cAll.length && sel.length >= cAll.length) errs.push('เลือกครบทุกแปลงของสัญญา — ให้ใช้ประเภทย่อย "ไถ่ถอนทั้งหมด"');
  if (a.typeCode === 'CB') {
    if (sel.length < 2) errs.push('รวมโฉนดต้องเลือกที่ดินอย่างน้อย 2 แปลง');
    if (selMort.length && (selMort.length !== sel.length || new Set(selMort.map(x => mort[x.id].contractNo)).size > 1)) errs.push('รวมโฉนดระหว่างจำนอง ทุกแปลงต้องติดจำนองกับเจ้าหนี้รายเดียวกัน (สัญญาเดียวกัน)');
  }
  const needConsent = ['CB', 'SP', 'SV'].includes(a.typeCode) && selMort.length > 0;
  if (needConsent && a.typeCode !== 'SV' && !a.consent) errs.push('ทำระหว่างจำนอง ต้องได้รับความยินยอมจากผู้รับจำนอง');
  if (t.transfer && !String(a.transferee || '').trim()) errs.push('กรุณาระบุชื่อผู้รับโอน');
  if (a.typeCode === 'IS' && selMort.length) warns.push('ออกโฉนดระหว่างจำนอง ภาระจำนองจะถูกยกไปลงในโฉนดใหม่');
  if (a.typeCode === 'SP' && selMort.length) warns.push('แบ่งระหว่างจำนอง ภาระจำนองจะติดไปทุกแปลงที่แบ่งออก เว้นแต่จะทำปลอดจำนองบางแปลงควบคู่ไปด้วย');
  if (a.typeCode === 'SV' && selMort.length && !a.consent) warns.push('จดภาระจำยอมภายหลังโดยผู้รับจำนองไม่ยินยอม สิทธิจำนองจะอยู่เหนือภาระจำยอม (ป.พ.พ. ม.722)');
  const canSave = (a.assetIds || []).length > 0 && !noteMissing;
  const trySave = () => {
    setTried(true);
    if (noteMissing) return setSaveErr('');
    if (errs.length) return setSaveErr('');
    if (a.typeCode === 'MG') {
      const gs = [...new Set(assets.filter(x => (a.assetIds || []).includes(x.id)).map(x => laDocGroupOf(x, assets)).filter(Boolean))];
      if (gs.length > 1) return setSaveErr('หลักทรัพย์ที่เลือกมีทั้ง' + gs.map(g => LA_DOC_GROUP_LABEL[g]).join('และ') + ' กรุณาแยกเป็นนิติกรรมคนละรายการ');
    }
    setSaveErr('');
    const extras = [];
    if (a.typeCode === 'SP' && selMort.length && a.withRelease) {
      const r = window.laBlankAct(member, 'RL');
      Object.assign(r, { contractNo: mort[selMort[0].id].contractNo, reqNo: mort[selMort[0].id].reqNo || a.reqNo, assetIds: selMort.map(x => x.id), note: 'ปลอดจำนองแปลงที่แบ่งแยก — ทำควบคู่กับนิติกรรม ' + a.actNo });
      extras.push(r);
    }
    onConfirm(a, extras);
  };
  const lockPick = a.typeCode === 'RD' && a.subtype === 'ไถ่ถอนทั้งหมด';
  const phase = (window.LA_PHASES || {})[t.phase] || { l: '' };
  const viewFile = (fl) => { if (fl.url) window.open(fl.url, '_blank'); };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal la-act-modal" role="dialog" aria-modal="true" style={{ width: 860 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="lock" /></div>
          <h2>{initial ? 'แก้ไขนิติกรรม' : 'ทำนิติกรรม'}</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="lrq-grid c2">
            <LcField label="ประเภทนิติกรรม">
              <select className="cfg-input" value={a.typeCode} onChange={e => changeType(e.target.value)}>
                {window.LA_TYPES.map(x => <option key={x.code} value={x.code}>{x.label}</option>)}
              </select>
            </LcField>
            <LcField label="ประเภทย่อย">
              <select className="cfg-input" value={a.subtype} onChange={e => { const v = e.target.value; upd(p => ({ ...p, subtype: v })); }}>
                {t.subtypes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </LcField>
          </div>
          {t.desc && (
            <div style={{ marginTop: 10, padding: '10px 12px', background: '#FAFAFA', border: '1px solid #F0F0F0', borderRadius: 8, fontSize: 12.5, lineHeight: 1.65, display: 'grid', gap: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--primary-700, #237450)' }}>{phase.l}</span>
              <span style={{ color: 'rgba(0,0,0,.65)', textWrap: 'pretty' }}>{t.desc}</span>
            </div>
          )}

          <div className="lrq-grid c3" style={{ marginTop: 10 }}>
            <LcField label="เลขนิติกรรม"><input className="cfg-input mono lrq-ro" value={a.actNo || ''} readOnly /></LcField>
            <LcField label="เลขที่ใบคำขอกู้">
              <select className="cfg-input mono" value={a.reqNo || ''}
                      onChange={e => { const c = contractOpts.find(x => x.reqNo === e.target.value) || {}; upd(p => ({ ...p, reqNo: c.reqNo || '', contractNo: c.contractNo || '' })); }}>
                <option value="">--- โปรดเลือก ---</option>
                {contractOpts.map(c => <option key={c.reqNo} value={c.reqNo}>{c.reqNo} · {c.type}{c.contractNo ? ' · ' + c.contractNo : ''}</option>)}
              </select>
              {!contractOpts0.length && <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{isPost ? 'ไม่พบใบคำขอกู้โครงการเงินกู้พิเศษที่จดจำนองหลักทรัพย์แล้ว' : 'ไม่พบใบคำขอกู้โครงการเงินกู้พิเศษที่อนุมัติแล้ว'}</div>}
            </LcField>
            <LcField label="สัญญาเงินกู้ที่เกี่ยวข้อง">
              <button type="button" className="cfg-input lrq-ro" onClick={() => setShowDebts(true)} disabled={!debts.length} title="ดูรายการสัญญาเงินกู้"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left', cursor: debts.length ? 'pointer' : 'default' }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{debts.length ? debts.length + ' สัญญา · หนี้คงเหลือรวม ฿' + laMoney(debtTotal) : 'ไม่มีหนี้กับสหกรณ์'}</span>
                {debts.length > 0 && <span style={{ color: 'var(--primary-700, #237450)', display: 'inline-flex' }}><Icon name="eye" size={14} /></span>}
              </button>
            </LcField>
          </div>

          <div className="la-msec">หลักทรัพย์ที่ทำนิติกรรม <span className="muted">({(a.assetIds || []).length} รายการ{lockPick ? ' · เลือกครบทุกแปลงของสัญญาอัตโนมัติ' : ''})</span></div>
          {a.typeCode === 'CB' && (
            <div className="lrq-grid c3" style={{ marginBottom: 10 }}>
              <LcField label="ประเภทหลักทรัพย์">
                <select className="cfg-input" value={a.cbType || ''} onChange={e => { const v = e.target.value; upd(p => ({ ...p, cbType: v })); }}>
                  {landTypes.map(x => <option key={x} value={x}>{x}</option>)}
                </select>
              </LcField>
              <div style={{ gridColumn: 'span 2', alignSelf: 'end', fontSize: 11.5, color: 'rgba(0,0,0,.45)', paddingBottom: 8 }}>รวมโฉนดได้เฉพาะแปลงที่เป็นประเภทหลักทรัพย์และสำนักงานที่ดินเดียวกัน</div>
            </div>
          )}
          <div className="la-asset-pick" style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
            {assets.map(as => {
              const on = (a.assetIds || []).includes(as.id);
              const why = laEligReason(a, as, mort, assets); const mg = mort[as.id];
              const dis = lockPick || (!!why && !on);
              return (
                <div key={as.id} className={"la-pick" + (on ? " on" : "")} onClick={() => !dis && toggleAsset(as.id)}
                     style={dis ? { cursor: 'not-allowed', opacity: on ? 1 : .55 } : undefined}>
                  <span className={"la-check" + (on ? " on" : "")}>{on && <Icon name="check" size={12} />}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="la-pick-t">{window.laAssetLabel(as)} <span className="chip" style={{ marginLeft: 4 }}>{as.type}</span>
                      {mg && <span className="chip" style={{ marginLeft: 4, background: 'var(--brand-100, #EAFEF2)', color: 'var(--primary-700, #237450)' }}>ติดจำนอง · {mg.contractNo}</span>}</div>
                    <div className="la-pick-m">{as.area} · {as.loc}</div>
                    {as.office && <div className="la-pick-m">สำนักงานที่ดิน : {as.office}</div>}
                    {why && <div style={{ fontSize: 11.5, marginTop: 2, color: on ? 'var(--danger, #ff4d4f)' : 'rgba(0,0,0,.45)' }}>{why}</div>}
                  </div>
                  <button className="la-eye act-view" title="ดูรายละเอียดหลักทรัพย์" onClick={e => { e.stopPropagation(); setDetail(as); }}><Icon name="eye" size={14} /></button>
                </div>
              );
            })}
          </div>

          <div className="lrq-grid c3" style={{ marginTop: 12 }}>
            {t.needsAmount && <LcField label="วงเงินจดทะเบียนจำนอง (บาท)"><input className="cfg-input lrq-num" value={a.amount} placeholder="0.00" onChange={e => changeAmount(e.target.value)} /></LcField>}
            <LcField label="สำนักงานที่ดินที่จดทะเบียน">
              <select className="cfg-input" value={a.landOffice} onChange={e => set('landOffice', e.target.value)}>
                {officeOpts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </LcField>
            <LcField label="วันที่ทำนิติกรรม/หนังสือมอบอำนาจ"><ErpDate value={a.regDate} onChange={(v) => (e => set('regDate', e.target.value))({ target: { value: v } })} className="cfg-input" /></LcField>
          </div>

          {(needConsent || (a.typeCode === 'SP' && selMort.length > 0)) && (
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12 }}>
              {needConsent && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" className="ct-check" checked={!!a.consent} onChange={e => set('consent', e.target.checked)} />
                  ผู้รับจำนองให้ความยินยอม{a.typeCode !== 'SV' && <span className="cfg-required">*</span>}
                </label>
              )}
              {a.typeCode === 'SP' && selMort.length > 0 && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" className="ct-check" checked={!!a.withRelease} onChange={e => set('withRelease', e.target.checked)} />
                  ทำปลอดจำนองบางแปลงควบคู่ (สร้างรายการปลอดจำนองเพิ่ม)
                </label>
              )}
            </div>
          )}
          {t.transfer && (
            <div className="lrq-grid c2" style={{ marginTop: 10 }}>
              <LcField label={<>ผู้รับโอน{a.typeCode === 'IH' ? ' (ทายาท)' : ' (ผู้รับให้)'} <span className="cfg-required">*</span></>}>
                <input className="cfg-input" value={a.transferee || ''} placeholder="โปรดระบุข้อมูล" onChange={e => set('transferee', e.target.value)}
                       style={tried && !String(a.transferee || '').trim() ? { borderColor: 'var(--danger, #ff4d4f)' } : undefined} />
              </LcField>
            </div>
          )}
          {warns.length > 0 && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, display: 'grid', gap: 4, fontSize: 12.5, color: 'rgba(0,0,0,.75)' }}>
              {warns.map((w, i) => <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}><span style={{ color: '#faad14', flex: 'none', marginTop: 2 }}><Icon name="info" size={13} /></span><span>{w}</span></div>)}
            </div>
          )}

          <div className="lrq-grid c2" style={{ marginTop: 10 }}>
            <LcField label="ผู้รับมอบอำนาจ (หนังสือมอบอำนาจ)">
              <select className="cfg-input" value={a.attorney || ''} onChange={e => { const st = staffOpts.find(x => x.name === e.target.value) || {}; setA(p => ({ ...p, attorney: st.name || '', attorneyId: st.citizenId || '' })); }}>
                <option value="">--- โปรดเลือก ---</option>
                {staffOpts.map(x => <option key={x.name} value={x.name}>{x.name}</option>)}
              </select>
            </LcField>
            <LcField label="เลขบัตรผู้รับมอบอำนาจ"><input className="cfg-input mono lrq-ro" value={a.attorneyId || ''} placeholder="—" readOnly /></LcField>
          </div>

          <div className="la-msec">แนบไฟล์เอกสาร <span className="muted">({(a.attachments || []).length} ไฟล์)</span></div>
          <div className="lrq-dropzone" style={{ cursor: 'pointer', ...(dragOver ? { borderColor: 'var(--primary)', background: 'var(--brand-100, #EAFEF2)' } : null) }}
               onClick={() => fileRef.current && fileRef.current.click()}
               onDragOver={ev => { ev.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
               onDrop={ev => { ev.preventDefault(); setDragOver(false); if (ev.dataTransfer.files.length) addFiles(ev.dataTransfer.files); }}>
            <Icon name="upload" size={16} /><span>คลิก หรือ ลากไฟล์มาที่นี่ เพื่ออัปโหลด</span>
            <input ref={fileRef} type="file" multiple hidden onChange={ev => { if (ev.target.files.length) addFiles(ev.target.files); ev.target.value = ''; }} />
          </div>
          {(a.attachments || []).length > 0 && (
            <div className="lrq-filelist">
              {a.attachments.map((fl, i) => (
                <div key={i} className="lrq-file">
                  <span className="lrq-file-ico"><Icon name="attach" size={14} /></span>
                  <span className="lrq-file-name">{fl.name}</span><span className="lrq-file-size muted">{fl.size}</span>
                  <button className="la-eye act-view" title="ดูไฟล์" onClick={() => viewFile(fl)} disabled={!fl.url} style={fl.url ? undefined : { opacity: .4, cursor: 'not-allowed' }}><Icon name="eye" size={14} /></button>
                  <button className="la-eye danger act-del" title="ลบไฟล์" onClick={() => rmFile(i)}><Icon name="trash" size={13} /></button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <LcField label={noteReq ? <>หมายเหตุ <span className="cfg-required">*</span></> : 'หมายเหตุ'}>
              <textarea className="cfg-input" rows="2" value={a.note} placeholder="โปรดระบุข้อมูล" onChange={e => set('note', e.target.value)}
                        style={noteMissing ? { borderColor: 'var(--danger, #ff4d4f)' } : undefined} />
            </LcField>
            {noteMissing && <div style={{ color: 'var(--danger, #ff4d4f)', fontSize: 12, marginTop: 4 }}>กรุณาระบุหมายเหตุ เมื่อทำนิติกรรม{a.typeCode === 'RL' ? 'ปลอดจำนอง' : 'แบ่งไถ่ถอน'}</div>}
          </div>
          {tried && errs.map((er, i) => <div key={i} className="dep-error" style={{ marginTop: 8 }}><Icon name="info" size={13} /> {er}</div>)}
          {saveErr && <div className="dep-error" style={{ marginTop: 10 }}><Icon name="info" size={13} /> {saveErr}</div>}
        </div>
        <div className="lrq-sal-foot">
          <button className="btn" onClick={onClose}>ยกเลิก</button>
          <button className="btn primary" disabled={!canSave} onClick={trySave}><Icon name="check" /> {initial ? 'บันทึกการแก้ไข' : 'เพิ่มรายการนิติกรรม'}</button>
        </div>
      </div>
      {detail && <LaAssetModal asset={detail} member={member} onClose={() => setDetail(null)} />}
      {showDebts && <LaDebtModal debts={debts} mort={mort} onClose={() => setShowDebts(false)} />}
    </>
  );
}

// ── Popup สัญญาเงินกู้ทั้งหมดของสมาชิก (หนี้กับสหกรณ์) ─────────────────
function LaDebtModal({ debts, mort, onClose }) {
  const mCount = (no) => Object.values(mort || {}).filter(v => v.contractNo === no).length;
  const sum = (k) => debts.reduce((x, d) => x + (d[k] || 0), 0);
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 760, zIndex: 1201 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="report" /></div>
          <h2>สัญญาเงินกู้ที่เกี่ยวข้อง ({debts.length} สัญญา)</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="table-wrap"><div className="table-scroll">
            <table className="tbl">
              <thead><tr>
                <th>เลขที่สัญญา</th><th>โครงการเงินกู้</th><th className="num">ยอดกู้ตามสัญญา</th><th className="num">หนี้คงเหลือ</th><th className="center">งวดคงเหลือ</th><th>สถานะติดจำนอง</th>
              </tr></thead>
              <tbody>
                {debts.map(d => { const n = mCount(d.contractNo); return (
                  <tr key={d.contractNo}>
                    <td className="mono">{d.contractNo}</td>
                    <td>{d.project}</td>
                    <td className="num mono">{laMoney(d.loanAmount)}</td>
                    <td className="num mono">{laMoney(d.remaining)}</td>
                    <td className="center">{d.termsLeft != null ? d.termsLeft + ' / ' + d.totalTerms : '—'}</td>
                    <td>{n ? <span className="chip" style={{ background: 'var(--brand-100, #EAFEF2)', color: 'var(--primary-700, #237450)' }}>ติดจำนอง · {n} แปลง</span> : <span className="muted">ไม่ติดจำนอง</span>}</td>
                  </tr>
                ); })}
              </tbody>
              <tfoot><tr style={{ fontWeight: 600, background: '#FAFAFA' }}>
                <td colSpan="2">รวม {debts.length} สัญญา</td>
                <td className="num mono">{laMoney(sum('loanAmount'))}</td>
                <td className="num mono">{laMoney(sum('remaining'))}</td>
                <td colSpan="2" />
              </tr></tfoot>
            </table>
          </div></div>
        </div>
        <div className="lrq-sal-foot"><button className="btn" onClick={onClose}>ปิด</button></div>
      </div>
    </>
  );
}

// ── Modal เลือกเอกสารที่จะพิมพ์ ─────────────────────────────────────
function LaDocChooser({ onPick, onClose }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 460 }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="print" /></div>
          <h2>เลือกเอกสารที่จะพิมพ์</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body">
          <div className="la-doc-choose">
            {window.LA_DOC_TYPES.map(d => (
              <button key={d.v} className="la-doc-btn" onClick={() => onPick(d.v)}>
                <Icon name="report" size={16} /><span>{d.label}</span><Icon name="chevRight" size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── หน้าสร้างนิติกรรม ───────────────────────────────────────────────
function LaCreateScreen({ member, assets, acts, editMode, fromDetail, onSearch, onPick, onCreate, onAddMore, onEdit, onDelete, onViewAsset, onPrint, onHistory, onCancel, onSave }) {
  const heading = fromDetail ? 'แก้ไขหนังสือนิติกรรม' : 'สร้างนิติกรรม';
  window.useBreadcrumb([{ label: 'นิติกรรม', onClick: onCancel }, { label: fromDetail ? 'แก้ไขข้อมูล' : 'สร้างนิติกรรม', current: true }], [member && member.code, editMode, fromDetail]);
  return (
    <div data-screen-label={heading}>
      <div className="page-actions">
        <button className="btn sm lrq-back" onClick={onCancel} title="ย้อนกลับ"><Icon name="chevLeft" /></button>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{heading}</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>บันทึกการทำนิติกรรมเกี่ยวกับหลักทรัพย์ค้ำประกันของสมาชิก</div>
        </div>
        <span className="spacer" />
        <div className="lc-topbtns">
          <button className="btn sm" onClick={onCancel}>ยกเลิก</button>
          <button className="btn primary sm" disabled={!acts.length} onClick={onSave}><Icon name="check" /> บันทึกหนังสือนิติกรรม</button>
        </div>
      </div>

      <LaMemberCard member={member} onSearch={onSearch} onPick={onPick} />

      {!member ? (
        <div className="search-card cs-empty" style={{ marginTop: 12 }}>
          <div className="gc-ph-ico"><Icon name="search" size={26} /></div>
          <div className="gc-ph-title">ยังไม่ได้เลือกสมาชิก</div>
          <div className="gc-ph-sub">ค้นหาและเลือกสมาชิกเพื่อดึงหลักทรัพย์และสัญญา แล้วจึงทำนิติกรรม</div>
        </div>
      ) : (
        <>
          <LaAssetList assets={assets} onView={onViewAsset} />
          <LaActTable acts={acts} onCreate={onCreate} onAddMore={onAddMore} onEdit={onEdit}
                      onDelete={onDelete} onView={onEdit} onPrint={onPrint} />

        </>
      )}
    </div>
  );
}

// ── ทะเบียนนิติกรรม (list) ──────────────────────────────────────────
function LaListView({ list, onCreate, onOpen, onPrint }) {
  const [q, setQ] = laS('');
  const [typeF, setTypeF] = laS('all');
  const [statusF, setStatusF] = laS('all');

  const rows = laM(() => {
    let r = list.slice();
    if (q.trim()) {
      const n = q.toLowerCase();
      r = r.filter(x => {
        const m = window.laMemberOf(x.memberCode) || {};
        return (x.actNo || '').toLowerCase().includes(n) || (x.contractNo || '').toLowerCase().includes(n) ||
               (x.memberCode || '').toLowerCase().includes(n) || (m.name || '').toLowerCase().includes(n);
      });
    }
    if (typeF !== 'all') r = r.filter(x => x.typeCode === typeF);
    if (statusF !== 'all') r = r.filter(x => x.status === statusF);
    return r.sort((a, b) => String(b.regDate).localeCompare(String(a.regDate)) || b.id.localeCompare(a.id));
  }, [list, q, typeF, statusF]);

  const pending = list.filter(x => x.status === 'pending' || x.status === 'draft').length;
  const registered = list.filter(x => x.status === 'registered').length;

  return (
    <div data-screen-label="หน้าทะเบียนนิติกรรม">
      <div className="page-actions">
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>นิติกรรม</h1>
          <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>ทะเบียนนิติกรรมเกี่ยวกับหลักทรัพย์ค้ำประกัน — จดจำนอง ไถ่ถอน อายัด สินไหม ภาระจำยอม รวม/แยก/ออก/สอบโฉนด</div>
        </div>
        <span className="spacer" />
        <button className="btn primary sm" onClick={onCreate}><Icon name="plus" /> สร้างนิติกรรม</button>
      </div>

      <div className="search-card">
        <div className="toolbar" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>เลขที่นิติกรรม / สัญญา / สมาชิก</span>
            <div className="search" style={{ flex: 'none', width: 300, height: 32 }}>
              <Icon name="search" size={14} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="เช่น จ69-04821, L-2022-0455, สมชาย" style={{ height: 30 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="muted" style={{ fontSize: 11 }}>ประเภทนิติกรรม</span>
            <select className="filter-select" value={typeF} onChange={e => setTypeF(e.target.value)} style={{ width: 220 }}>
              <option value="all">ทุกประเภท</option>
              {window.LA_TYPES.map(t => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </div>
          <span className="spacer" />
          <span className="muted" style={{ fontSize: 12 }}>พบ <b style={{ color: 'var(--text)' }}>{rows.length}</b> รายการ</span>
        </div>

        <div className="table-wrap"><div className="table-scroll">
          <table className="tbl">
            <thead><tr>
              <th>เลขที่นิติกรรม</th><th style={{ whiteSpace: 'nowrap' }}>วันที่ทำนิติกรรม</th><th>สมาชิก</th><th>ประเภทนิติกรรม</th><th>ประเภทหลักทรัพย์</th>
              <th>เลขที่สัญญา</th><th className="center">หลักทรัพย์</th><th className="center" style={{ width: 190 }}>จัดการ</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan="8" className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="search" size={24} /></div>ไม่พบนิติกรรมที่ตรงกับเงื่อนไข</td></tr>
              ) : rows.map(r => {
                const m = window.laMemberOf(r.memberCode) || {}; const t = window.laType(r.typeCode);
                return (
                  <tr key={r.id} className="clickable" onClick={() => onOpen(r)}>
                    <td className="mono">{r.actNo}</td>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{laDateBE(r.regDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="row-avatar">{laInitial(m.name)}</span>
                        <div style={{ minWidth: 0 }}><div style={{ whiteSpace: 'nowrap' }}>{m.name || r.memberCode}</div>
                          <div className="muted mono" style={{ fontSize: 10 }}>{r.memberCode}</div></div>
                      </div>
                    </td>
                    <td>{t.label}<div className="muted" style={{ fontSize: 11 }}>{r.subtype}</div></td>
                    <td>{laAssetTypes(r)}</td>
                    <td className="mono">{r.contractNo || '—'}</td>
                    <td className="center">{(r.assetIds || []).length}</td>
                    <td className="center" onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button className="btn sm" onClick={() => onOpen(r)}><Icon name="eye" size={13} /> ดู</button>
                        <button className="btn sm" onClick={() => onPrint(r)}><Icon name="print" size={13} /> พิมพ์เอกสาร</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div></div>
        <p className="muted" style={{ fontSize: 11, marginTop: 6 }}><Icon name="info" size={11} /> คลิกที่แถวเพื่อดูรายละเอียดนิติกรรมและพิมพ์เอกสาร</p>
      </div>
    </div>
  );
}

// ── รายละเอียดนิติกรรม (อ่านอย่างเดียว) ─────────────────────────────
function LaDetailRow({ label, value, mono }) {
  return <div className="field" style={{ gridTemplateColumns: '210px 1fr' }}><span className="label" style={{ whiteSpace: 'nowrap' }}>{label}</span><span className={'value' + (mono ? ' mono' : '')}>{value ?? '—'}</span></div>;
}
function LaActHistoryModal({ title, onClose }) {
  const ctx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const rows = ((ctx && ctx.entries) || window.AUDIT_SEED || [])
    .filter(e => e.module === 'สินเชื่อ — นิติกรรม')
    .sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: 640, width: '92vw' }}>
        <div className="modal-head">
          <div style={{ minWidth: 0 }}>
            <h2>ประวัติการแก้ไข</h2>
            <div className="muted" style={{ fontSize: 11 }}>{title}</div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="ปิด"><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: '20px 2px', textAlign: 'center', fontSize: 13 }}>ยังไม่มีประวัติการแก้ไข</div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top">
                        <span className={'pill ' + a.pill}>{a.label}</span>
                        <span className="spacer" />
                        <span className="tx-time mono">{fmt.datetime(e.ts)}</span>
                      </div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta"><span>โดย {e.user}</span><span className="sep">·</span><span className="mono muted">{e.id}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="modal-foot"><button className="btn sm" onClick={onClose}>ปิด</button></div>
      </div>
    </>
  );
}

function LaDetailView({ rec, onBack, onPrint, onHistory, onEditBook }) {
  const auditCtx = React.useContext(window.AuditContext || React.createContext({ entries: [] }));
  const [histOpen, setHistOpen] = laS(false);
  window.useBreadcrumb([{ label: 'นิติกรรม', onClick: onBack }, { label: 'รายละเอียด', current: true }], [rec.id]);
  const savedBadge = (() => {
    const entries = (auditCtx && auditCtx.entries) || window.AUDIT_SEED || [];
    const ts = window.savedBadgeTs ? window.savedBadgeTs(entries, ['สินเชื่อ — นิติกรรม'], 'la.' + rec.id) : null;
    return (window.savedBadgeLabel && window.savedBadgeLabel(ts)) || null;
  })();
  const m = window.laMemberOf(rec.memberCode) || {};
  const t = window.laType(rec.typeCode); const st = window.laStatus(rec.status);
  const assets = window.laAssetsOf(rec.memberCode).filter(a => (rec.assetIds || []).includes(a.id));
  return (
    <div data-screen-label="หน้ารายละเอียดนิติกรรม">
      <div className="page-actions">
        <button className="btn sm lrq-back" onClick={onBack} title="ย้อนกลับ"><Icon name="chevLeft" /></button>
        <span className="spacer" />
        <div className="lc-topbtns">
          {savedBadge && <span className="saved-badge">{savedBadge}</span>}
          <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ</button>
          <button className="btn sm" onClick={() => onPrint(rec)}><Icon name="print" /> พิมพ์เอกสาร</button>
          <button className="btn primary sm" onClick={() => onEditBook(rec)}><Icon name="edit" /> แก้ไขหนังสือนิติกรรม</button>
        </div>
      </div>

      {histOpen && <LaActHistoryModal title={rec.actNo + ' · ' + (window.laType(rec.typeCode) || {}).label} onClose={() => setHistOpen(false)} />}

      <div className="search-card lt-head-card">
        <div className="lt-head-main">
          <div className="lt-head-ico"><Icon name="bank" size={20} /></div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="lt-head-title" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>{t.label}{rec.subtype ? ' — ' + rec.subtype : ''}</h1>
            <div className="lt-head-meta">
              <span>{m.name || rec.memberCode} <span className="mono">({rec.memberCode})</span></span><span className="dot" />
              <span className="mono">{rec.actNo}</span><span className="dot" />
              <span>สัญญา {rec.contractNo || '—'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            {rec.printCount > 0 && <span className="chip info"><Icon name="print" size={11} /> พิมพ์แล้ว {rec.printCount} ครั้ง</span>}
          </div>
        </div>
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 14 }}><span className="head-bar" /><h3>ข้อมูลนิติกรรม</h3></div>
        <div className="form-grid">
          <LaDetailRow label="ชื่อสมาชิก" value={(m.name || '—') + ' (' + rec.memberCode + ')'} />
          <LaDetailRow label="เลขที่นิติกรรม" value={rec.actNo} mono />
          <LaDetailRow label="ประเภทนิติกรรม" value={t.label} />
          <LaDetailRow label="ประเภทย่อย" value={rec.subtype} />
          <LaDetailRow label="เลขที่ใบขอกู้" value={rec.reqNo} mono />
          <LaDetailRow label="เลขที่สัญญา" value={rec.contractNo} mono />
          <LaDetailRow label="วันที่ทำนิติกรรม/หนังสือมอบอำนาจ" value={String(rec.regDate)} />
          <LaDetailRow label="สำนักงานที่ดิน" value={rec.landOffice} />
          {t.needsAmount && <LaDetailRow label="วงเงินจดทะเบียนจำนอง" value={'฿ ' + laMoney(rec.amount)} />}
          <LaDetailRow label="ผู้รับมอบอำนาจ" value={rec.attorney || '—'} />
          {t.transfer && <LaDetailRow label="ผู้รับโอน" value={rec.transferee || '—'} />}
          {['CB', 'SP', 'SV'].includes(rec.typeCode) && rec.consent && <LaDetailRow label="ความยินยอมผู้รับจำนอง" value="ได้รับความยินยอม" />}
        </div>
        {rec.note && <div className="form-grid" style={{ marginTop: 12 }}><div style={{ gridColumn: '1 / -1' }}><LaDetailRow label="หมายเหตุ" value={rec.note} /></div></div>}
      </div>

      <div className="search-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ marginBottom: 12 }}><span className="head-bar" /><h3>หลักทรัพย์และเอกสารแนบ</h3></div>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>ประเภท</th><th>เลขที่โฉนด</th><th>เนื้อที่</th><th>ที่ตั้ง</th><th>สำนักงานที่ดิน</th></tr></thead>
          <tbody>
            {assets.length === 0 ? <tr><td colSpan="5" className="empty-state">ไม่มีหลักทรัพย์</td></tr>
              : assets.map(a => <tr key={a.id}><td><span className="chip">{a.type}</span></td><td className="mono">{a.titleNo}</td><td>{a.area}</td><td>{a.loc}</td><td>{a.office}</td></tr>)}
          </tbody>
        </table></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft, #F0F0F0)' }}>
          <span className="muted" style={{ fontSize: 12, marginRight: 4 }}>เอกสารแนบ ({(rec.attachments || []).length})</span>
          {(rec.attachments || []).length === 0 ? <span className="muted" style={{ fontSize: 12 }}>—</span>
            : rec.attachments.map((fl, i) => (
              <button key={i} type="button" className="chip" title="ดูไฟล์" onClick={() => fl.url && window.open(fl.url, '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', height: 26 }}>
                <Icon name="attach" size={12} /><span>{fl.name}</span>{fl.size && <span className="muted" style={{ fontSize: 11 }}>{fl.size}</span>}<Icon name="eye" size={12} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

// ── ประวัติการใช้งาน (drawer) ───────────────────────────────────────
function LaHistoryDrawer({ rec, onClose }) {
  const ctx = laC(window.AuditContext || React.createContext({ entries: [] }));
  const all = ctx.entries || window.AUDIT_SEED || [];
  let rows = all.filter(e => (e.module || '').includes('นิติกรรม'));
  if (rec) rows = rows.filter(e => (e.summary || '').includes(rec.actNo) || (e.target || '').includes(rec.memberCode));
  rows = rows.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
  const m = rec ? (window.laMemberOf(rec.memberCode) || {}) : null;
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card gc-modal" role="dialog" aria-modal="true" style={{ width: 640, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-head">
          <div className="gc-modal-ico"><Icon name="history" /></div>
          <h2>ประวัติการใช้งาน{rec ? ' — ' + rec.actNo : ' — นิติกรรม'}</h2>
          <button className="close-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto' }}>
          {rows.length === 0 ? (
            <div className="empty-state"><div style={{ marginBottom: 4 }}><Icon name="history" size={24} /></div>ยังไม่มีประวัติการทำรายการ</div>
          ) : (
            <div className="tx-timeline">
              {rows.map(e => {
                const a = (window.AUDIT_ACTIONS || {})[e.action] || { label: e.action, pill: 'neutral' };
                return (
                  <div className="tx-item" key={e.id}>
                    <div className={'tx-dot ' + a.pill} />
                    <div className="tx-body">
                      <div className="tx-top"><span className={'pill ' + a.pill}>{a.label}</span><span className="tx-mod">{e.module}</span><span className="spacer" /><span className="tx-time mono">{fmt.datetime(e.ts)}</span></div>
                      <div className="tx-summary">{e.summary}</div>
                      <div className="tx-meta"><span>โดย {e.user}</span><span className="sep">·</span><span>{e.role}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="lrq-sal-foot"><button className="btn primary" onClick={onClose}>ปิด</button></div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
//  หน้าหลัก — จัดการโหมด list / create / detail + พิมพ์ + audit
// ════════════════════════════════════════════════════════════════════
function LegalActPage({ onToast }) {
  const audit = laC(window.AuditContext || React.createContext({ log: () => {} }));
  const [list, setList] = laS(window.laLoad);
  const [mode, setMode] = laS('list');       // list | create | detail
  const [member, setMember] = laS(null);
  const [acts, setActs] = laS([]);            // working set (create)
  const [assets, setAssets] = laS([]);
  const [current, setCurrent] = laS(null);    // detail
  const [searchOpen, setSearchOpen] = laS(false);
  const [viewAsset, setViewAsset] = laS(null);
  const [actModal, setActModal] = laS(null);  // { initial } | true
  const [docChooser, setDocChooser] = laS(null); // rec awaiting doc pick
  const [printOverlay, setPrintOverlay] = laS(null); // { docType, rec }
  const [histOpen, setHistOpen] = laS(null);   // rec | 'all' | null
  const [editBook, setEditBook] = laS(false);  // แก้ไขหนังสือนิติกรรม (ใช้หน้าสร้าง)
  const [fromDetail, setFromDetail] = laS(false); // เข้าจากหน้ารายละเอียด → หัวเรื่อง "แก้ไขหนังสือนิติกรรม"
  const [okMsg, setOkMsg] = laS(null);         // success modal

  const persist = (next) => { setList(next); window.laSaveLS(next); };

  const MOD = 'สินเชื่อ — นิติกรรม';

  const pickMember = (m) => {
    const full = (window.DN_MEMBERS || []).find(x => x.code === m.code) || m;
    setMember(full);
    setAssets(window.laAssetsOf(full.code));
    setActs(list.filter(a => a.memberCode === full.code).map(a => JSON.parse(JSON.stringify(a))));
    setSearchOpen(false);
  };

  const startCreate = () => { setEditBook(true); setFromDetail(false); setMode('create'); };

  // แก้ไขหนังสือนิติกรรมของสมาชิกรายนั้น — ใช้โครงหน้าสร้าง
  const startEditBook = (rec) => {
    const full = (window.DN_MEMBERS || []).find(x => x.code === rec.memberCode) || window.laMemberOf(rec.memberCode) || { code: rec.memberCode };
    setMember(full);
    setAssets(window.laAssetsOf(full.code));
    setActs(list.filter(a => a.memberCode === full.code).map(a => JSON.parse(JSON.stringify(a))));
    setEditBook(true);
    setFromDetail(true);
    setMode('create');
  };

  // บันทึกจากโหมดแก้ไข — อยู่หน้าเดิม
  const saveBookEdit = () => {
    const others = list.filter(a => a.memberCode !== member.code);
    persist([...acts, ...others]);
    audit.log({ action: 'update', module: MOD, target: `${member.code} · ${member.name}`,
      summary: `${fromDetail ? 'แก้ไข' : 'บันทึก'}หนังสือนิติกรรม ${acts.length} รายการ` });
    setOkMsg({ title: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      detail: (fromDetail ? 'แก้ไข' : 'บันทึก') + 'หนังสือนิติกรรมของ ' + (member.name || member.code) + ' เรียบร้อยแล้ว',
      back: true });
  };

  // ── modal ทำนิติกรรม ──
  const openNew = () => setActModal({ initial: null });
  const openEdit = (a) => setActModal({ initial: a });
  const openAddMore = (a) => {
    const clone = window.laBlankAct(member, a.typeCode);
    clone.contractNo = a.contractNo; clone.reqNo = a.reqNo; clone.subtype = a.subtype;
    setActModal({ initial: clone, isNew: true });
  };
  const confirmAct = (a, extras) => {
    setActs(prev => [...(prev.some(x => x.id === a.id) && !actModal.isNew ? prev.map(x => x.id === a.id ? a : x) : [...prev, a]), ...(extras || [])]);
    setActModal(null);
    onToast && onToast('เพิ่มรายการนิติกรรม ' + window.laType(a.typeCode).label + ' แล้ว');
  };
  const deleteAct = (a) => { setActs(prev => prev.filter(x => x.id !== a.id)); onToast && onToast('ลบรายการนิติกรรมแล้ว'); };

  // ── บันทึกหนังสือนิติกรรม (commit working set → registry) ──
  const saveBook = () => {
    const others = list.filter(a => a.memberCode !== member.code);
    const next = [...acts, ...others];
    persist(next);
    audit.log({ action: 'create', module: MOD, target: `${member.code} · ${member.name}`,
      summary: `บันทึกหนังสือนิติกรรม ${acts.length} รายการ — ${acts.map(a => window.laType(a.typeCode).label).join(', ')}` });
    onToast && onToast(`บันทึกหนังสือนิติกรรมของ ${member.name} เรียบร้อย (${acts.length} รายการ)`);
    setMode('list');
    setMember(null); setActs([]);
  };

  // ── ปิดนิติกรรม (ยืนยันจากการเลือกพิมพ์แบบรายงานการทำนิติกรรม) ──
  const closeAct = (rec) => {
    const patch = { status: 'registered', closedAt: window.laToday(), closedBy: window.laUser };
    if (list.some(x => x.id === rec.id)) persist(list.map(x => x.id === rec.id ? { ...x, ...patch } : x));
    setActs(prev => prev.map(x => x.id === rec.id ? { ...x, ...patch } : x));
    if (current && current.id === rec.id) setCurrent(c => ({ ...c, ...patch }));
    setDocChooser(d => d && d.id === rec.id ? { ...d, ...patch } : d);
    const m = window.laMemberOf(rec.memberCode) || {};
    audit.log({ action: 'update', module: MOD, target: `${rec.memberCode} · ${m.name || ''}`, summary: `ปิดนิติกรรม ${rec.actNo}` });
    onToast && onToast('ปิดนิติกรรม ' + rec.actNo + ' แล้ว');
  };
  // ── พิมพ์ ──
  const openPrint = (rec) => setDocChooser(rec);
  const logPrint = (rec, labels) => {
    if (!list.some(x => x.id === rec.id)) return;
    const updated = { ...rec, printCount: (rec.printCount || 0) + 1 };
    persist(list.map(x => x.id === rec.id ? updated : x));
    if (current && current.id === rec.id) setCurrent(updated);
    const m = window.laMemberOf(rec.memberCode) || {};
    audit.log({ action: 'print', module: MOD, target: `${rec.memberCode} · ${m.name || ''}`,
      summary: `พิมพ์เอกสารนิติกรรม ${rec.actNo} — ${labels.join(', ')}` });
  };
  const pickDoc = (docType) => {
    const rec = docChooser; setDocChooser(null);
    setPrintOverlay({ docType, rec });
    // นับจำนวนครั้งพิมพ์ + audit (เฉพาะรายการที่อยู่ในทะเบียนแล้ว)
    if (list.some(x => x.id === rec.id)) {
      const updated = { ...rec, printCount: (rec.printCount || 0) + 1 };
      persist(list.map(x => x.id === rec.id ? updated : x));
      if (current && current.id === rec.id) setCurrent(updated);
      const m = window.laMemberOf(rec.memberCode) || {};
      audit.log({ action: 'print', module: MOD, target: `${rec.memberCode} · ${m.name || ''}`,
        summary: `พิมพ์${(window.LA_DOC_TYPES.find(d => d.v === docType) || {}).label} ของนิติกรรม ${rec.actNo}` });
    }
  };
  const saveDocEdits = (docType, html) => {
    setPrintOverlay(po => po ? { ...po, rec: { ...po.rec, docEdits: { ...po.rec.docEdits, [docType]: html } } } : po);
    const rec = printOverlay && printOverlay.rec;
    if (rec && list.some(x => x.id === rec.id)) {
      persist(list.map(x => x.id === rec.id ? { ...x, docEdits: { ...x.docEdits, [docType]: html } } : x));
    }
    // อัปเดตใน working set ด้วย (กรณีสร้าง)
    setActs(prev => prev.map(x => x.id === (rec && rec.id) ? { ...x, docEdits: { ...x.docEdits, [docType]: html } } : x));
  };

  const openDetail = (rec) => { setCurrent(rec); setMode('detail'); };


  const printMember = printOverlay ? (window.laMemberOf(printOverlay.rec.memberCode) || member || {}) : {};
  const printAssets = printOverlay ? window.laAssetsOf(printOverlay.rec.memberCode) : [];

  return (
    <>
      {mode === 'list' && (
        <LaListView list={list} onCreate={startCreate} onOpen={openDetail} onPrint={openPrint} />
      )}
      {mode === 'create' && (
        <LaCreateScreen member={member} assets={assets} acts={acts} editMode={editBook} fromDetail={fromDetail}
          onSearch={() => setSearchOpen(true)} onPick={pickMember} onCreate={openNew} onAddMore={openAddMore}
          onEdit={openEdit} onDelete={deleteAct} onViewAsset={setViewAsset} onPrint={openPrint}
          onHistory={() => setHistOpen('all')}
          onCancel={() => {
            if (fromDetail) { setEditBook(false); setFromDetail(false); setMode('detail'); setActs([]); return; }
            setMode('list'); setMember(null); setActs([]);
          }}
          onSave={editBook ? saveBookEdit : saveBook} />
      )}
      {mode === 'detail' && current && (
        <LaDetailView rec={current} onBack={() => setMode('list')} onPrint={openPrint}
                      onHistory={(r) => setHistOpen(r)} onEditBook={startEditBook} />
      )}

      {searchOpen && (
        <MemberSearchModal onPick={pickMember} onClose={() => setSearchOpen(false)}
          title="ค้นหาสมาชิก — นิติกรรม" source={window.DN_MEMBERS}
          searchFn={(c) => window.msSearchMembers(window.DN_MEMBERS, c)} />
      )}
      {viewAsset && <LaAssetModal asset={viewAsset} member={member} onClose={() => setViewAsset(null)} />}
      {actModal && member && (
        <LaActModal member={member} assets={assets} allActs={acts} initial={actModal.initial}
          onConfirm={confirmAct} onClose={() => setActModal(null)} />
      )}
      {docChooser && <window.LaDocSetModal rec={docChooser} onClose={() => setDocChooser(null)} onPrinted={(labels) => logPrint(docChooser, labels)} onCloseAct={closeAct} />}
      {printOverlay && (
        <LegalActPrintOverlay docType={printOverlay.docType} rec={printOverlay.rec}
          member={printMember} assets={printAssets}
          onSaveEdits={saveDocEdits} onClose={() => setPrintOverlay(null)} />
      )}
      {okMsg && window.StatusModal && (
        <window.StatusModal variant="success" title={okMsg.title} detail={okMsg.detail}
          onClose={() => {
            const back = okMsg.back;
            setOkMsg(null);
            if (back) { setEditBook(false); setMode('list'); setMember(null); setActs([]); }
          }} />
      )}
      {histOpen && <LaHistoryDrawer rec={histOpen === 'all' ? null : histOpen} onClose={() => setHistOpen(null)} />}
    </>
  );
}

Object.assign(window, { LegalActPage });
