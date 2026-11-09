// ════════════════════════════════════════════════════════════════════
//  ใบสำคัญจ่าย — ยกเลิกสถานะ "ร่าง"
//  บันทึกแล้ว = "รออนุมัติ" (pending_appr) ทันที · ไม่มีขั้นรอตรวจสอบ
//  โหลดหลัง 065 — remap สถานะเดิมที่เป็นร่าง/รอตรวจสอบ ให้เป็นรออนุมัติ
// ════════════════════════════════════════════════════════════════════
(function () {
  const TARGET = 'pending_appr';
  const LEGACY = ['draft', 'pending_check'];

  function apply() {
    if (!window.VCH_STATUS) return false;

    // ย่อป้ายสถานะให้สั้น
    if (window.VCH_STATUS[TARGET]) window.VCH_STATUS[TARGET] = { ...window.VCH_STATUS[TARGET], l: 'รออนุมัติ' };

    // สถานะเดิมยังคงอยู่เพื่อความปลอดภัย แต่แสดงผลเป็น "รออนุมัติ"
    LEGACY.forEach(k => {
      if (window.VCH_STATUS[k]) window.VCH_STATUS[k] = { ...window.VCH_STATUS[TARGET] };
    });

    // ตัดออกจากลำดับสถานะ (ใช้ทำแท็บกรอง)
    if (Array.isArray(window.VCH_STATUS_ORDER)) {
      window.VCH_STATUS_ORDER = window.VCH_STATUS_ORDER.filter(s => !LEGACY.includes(s));
    }

    // ผูกพัน/ตัดงบทันทีเมื่อบันทึก
    if (Array.isArray(window.VCH_COMMITTED) && !window.VCH_COMMITTED.includes(TARGET)) {
      window.VCH_COMMITTED.push(TARGET);
    }

    // แปลงเอกสารที่มีสถานะร่าง/รอตรวจสอบ ให้เป็นรออนุมัติ
    const norm = (v) => (v && LEGACY.includes(v.status) ? { ...v, status: TARGET } : v);
    const origLoad = window.vchLoadVouchers;
    if (typeof origLoad === 'function' && !origLoad.__noDraft) {
      const wrapped = function () { return (origLoad.apply(this, arguments) || []).map(norm); };
      wrapped.__noDraft = true;
      window.vchLoadVouchers = wrapped;
    }
    window.vchNoDraftStatus = TARGET;
    return true;
  }

  if (!apply()) {
    let tries = 0;
    const t = setInterval(() => { if (apply() || ++tries > 80) clearInterval(t); }, 50);
  }
})();
