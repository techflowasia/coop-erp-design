// ════════════════════════════════════════════════════════════════════
//  ระบบงานสวัสดิการสมาชิก — ค่าคงที่: ประเภทเงินสงเคราะห์
//  กำหนดค่าคงที่ของแต่ละประเภทย่อย (sub-type) ของเงินสงเคราะห์/สวัสดิการ
//    • ได้เงินเท่าไหร่        → amount  (จำนวนเงินที่ได้รับต่อครั้ง)
//    • ได้สิทธิสูงสุดเท่าไหร่ → maxAmount (ยอดเงินสิทธิสูงสุดต่อครั้ง)
//    • จำนวนสิทธิสูงสุด      → maxRights (จำนวนครั้งที่ขอได้ · 0 = ไม่จำกัด)
//  ปรับให้สอดคล้องกับเมนู "เงินสงเคราะห์สมาชิก" — ฟอร์มคำขออ่านค่าจากที่นี่
// ════════════════════════════════════════════════════════════════════

// รูปแบบการคิดสิทธิ (mode) ต่อประเภทย่อย
//   fixed  = ยอดคงที่ (แก้ไข amount ได้)
//   tier   = คิดตามอายุการเป็นสมาชิก (RELIEF_MEMBER_TIERS) — amount = ฐานเริ่มต้น
//   damage = คิดตามระดับความเสียหาย (RELIEF_DAMAGE_LEVELS)
//   manual = ผู้อนุมัติกำหนดยอดเอง (สวัสดิการทั่วไป)
window.RELIEF_TYPE_MODE_LABEL = {
  fixed: 'ยอดคงที่',
  tier: 'ตามอายุสมาชิก',
  damage: 'ตามระดับความเสียหาย',
  manual: 'ผู้อนุมัติกำหนด',
};

// ── สร้างค่าตั้งต้นจากนิยามประเภทย่อยใน data-relief.js ─────────────────
window.RELIEF_TYPE_CFG_SEED = (() => {
  const rows = [];
  const tiers = window.RELIEF_MEMBER_TIERS || [];
  const damage = window.RELIEF_DAMAGE_LEVELS || [];
  const topTier = tiers.length ? Math.max(...tiers.map(x => x.amount)) : 0;
  const topDamage = damage.length ? Math.max(...damage.map(x => x.amount)) : 0;
  for (const [wf, list] of Object.entries(window.RELIEF_TYPES_BY_WELFARE || {})) {
    (list || []).forEach(t => {
      const mode = t.manual ? 'manual' : t.byDamage ? 'damage' : t.member ? 'tier' : 'fixed';
      let amount = t.base || 0, maxAmount = t.base || 0, maxRights = 1;
      if (mode === 'tier')   { amount = tiers.length ? tiers[0].amount : 0; maxAmount = topTier;  maxRights = 1; }
      else if (mode === 'damage') { amount = t.base || 0; maxAmount = topDamage; maxRights = 2; }
      else if (mode === 'manual') { amount = 0; maxAmount = 0; maxRights = 0; }
      else { maxAmount = t.base || 0; maxRights = t.child ? 2 : (t.renew ? 3 : 1); }
      rows.push({ code: t.code, welfareCode: wf, label: t.label, mode, amount, maxAmount, maxRights });
    });
  }
  return rows;
})();

window.reliefTypeCfgLoad = () => {
  try {
    const s = localStorage.getItem('relief_type_config');
    if (s) {
      const saved = JSON.parse(s);
      // รวมกับ seed เพื่อรองรับประเภทที่เพิ่มใหม่ในโค้ด
      return window.RELIEF_TYPE_CFG_SEED.map(seed => {
        const hit = saved.find(x => x.code === seed.code);
        return hit ? { ...seed, ...hit } : { ...seed };
      });
    }
  } catch (e) {}
  return window.RELIEF_TYPE_CFG_SEED.map(r => ({ ...r }));
};
window.reliefTypeCfgSave = (list) => {
  try { localStorage.setItem('relief_type_config', JSON.stringify(list)); } catch (e) {}
};

// ค่าคงที่ของประเภทย่อยหนึ่งรายการ (merge seed + localStorage)
window.reliefTypeCfg = (code) => {
  const list = window.reliefTypeCfgLoad();
  return list.find(x => x.code === String(code)) || null;
};
window.reliefMaxRights = (code) => { const c = window.reliefTypeCfg(code); return c ? Number(c.maxRights) || 0 : 0; };
window.reliefMaxAmount = (code) => { const c = window.reliefTypeCfg(code); return c ? Number(c.maxAmount) || 0 : 0; };

// จำนวนครั้งที่สมาชิกใช้สิทธิประเภทนี้ไปแล้ว (นับจากทะเบียนคำขอ)
window.reliefRightsUsed = (list, memberCode, typeCode) =>
  (list || []).filter(r => r.memberCode === memberCode && String(r.typeCode) === String(typeCode)).length;
