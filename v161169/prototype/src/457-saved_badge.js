// ════════════════════════════════════════════════════════════════════
//  badge "บันทึกล่าสุด" — ตัวช่วยหาเวลาบันทึกล่าสุด (ใช้ร่วมทุกหน้ารายละเอียด)
//   1) เวลาล่าสุดจาก Audit Trail ของโมดูลที่ระบุ
//   2) ถ้ายังไม่มี — ใช้ค่าที่จำไว้ต่อหน้า (คงที่ข้ามการรีโหลด)
// ════════════════════════════════════════════════════════════════════
(function () {
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const KEY = 'savedBadgeSeed.v1';

  const readSeed = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  };

  function seedTs(key) {
    const all = readSeed();
    if (!all[key]) {
      const d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      all[key] = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
        ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
      try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
    }
    return all[key];
  }

  // หาเวลาล่าสุดจาก Audit Trail; ไม่มีก็ใช้ค่าที่จำไว้
  window.savedBadgeTs = function (entries, modules, key) {
    const latest = (entries || [])
      .filter((e) => modules.indexOf(e.module) >= 0)
      .reduce((mx, e) => (!mx || String(e.ts) > mx ? String(e.ts) : mx), '');
    return latest || seedTs(key);
  };

  window.savedBadgeLabel = function (ts) {
    const m = String(ts || '').match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return null;
    const y = Number(m[1]);
    return 'บันทึกล่าสุด: ' + Number(m[3]) + ' ' + (TH_MON[Number(m[2]) - 1] || '') + ' ' +
      (y < 2400 ? y + 543 : y) + (m[4] ? ' ' + m[4] + ':' + m[5] + ' น.' : '');
  };
})();
