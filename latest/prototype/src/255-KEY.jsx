// ════════════════════════════════════════════════════════════════════
//  DaySession — สถานะรอบทำการประจำวัน (source of truth)
//  ผูก "เปิดงานประจำวัน" ↔ "ปิดงานประจำวัน" ให้ล้อกันเป็น flow เดียว:
//   fresh ── เปิดงาน ──▶ open ── ปิดงาน ──▶ closed
//   • เปิดได้เมื่ออยู่สถานะ fresh เท่านั้น (วันก่อนหน้าต้องปิดแล้ว)
//   • ปิดได้เมื่อมีรอบที่เปิดค้างอยู่ (opened && !closed)
//   • ยอด "ยกไป" ตอนปิด → กลายเป็นยอด "ยกมา" ของรอบเปิดถัดไป
// ════════════════════════════════════════════════════════════════════
(function () {
  const KEY = 'day_session';
  const DEFAULT_CARRY = 4609870.86;

  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function nowTime() { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`; }
  function thDate(iso) { if (!iso) return '—'; const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()+543}`; }
  function load() { try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {} return null; }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }

  // สถานะปัจจุบันเทียบกับวันนี้
  //  phase: 'fresh' | 'open' | 'closed' | 'prevUnclosed'
  function status() {
    const t = todayISO();
    const s = load();
    if (!s || !s.opened) {
      return { phase: 'fresh', session: null, carry: DEFAULT_CARRY, chequeCarry: 0 };
    }
    if (s.date === t) {
      return {
        phase: s.closed ? 'closed' : 'open', session: s,
        carry: s.cashCarry, chequeCarry: s.chequeCarry,
      };
    }
    // รอบจากวันก่อนหน้า
    if (!s.closed) {
      // ยังเปิดค้าง — ต้องปิดรอบเดิมก่อนจึงจะเปิดวันใหม่ได้
      return { phase: 'prevUnclosed', session: s, carry: s.cashCarry, chequeCarry: s.chequeCarry };
    }
    // รอบก่อนปิดแล้ว → ยกยอดไปตั้งต้นวันใหม่
    return { phase: 'fresh', session: null, carry: s.carryForward, chequeCarry: s.chequePending || 0 };
  }

  // ยอดยกมาสำหรับรอบเปิดถัดไป (จากยอดยกไปของรอบที่ปิดล่าสุด)
  function nextCarry() {
    const s = load();
    if (s && s.closed) return { cash: s.carryForward, cheque: s.chequePending || 0 };
    return { cash: DEFAULT_CARRY, cheque: 0 };
  }

  function open(meta) {
    const st = status();
    if (st.phase !== 'fresh') return { ok: false, reason: st.phase };
    const c = nextCarry();
    const sess = {
      date: todayISO(), openTime: nowTime(), opened: true, closed: false,
      cashCarry: c.cash, chequeCarry: c.cheque,
      by: (meta && meta.by) || 'Chaiwat',
      branch: (meta && meta.branch) || 'สำนักงานใหญ่',
      host: (meta && meta.host) || '192.168.102.22',
    };
    save(sess);
    return { ok: true, session: sess };
  }

  function close(vals) {
    const s = load();
    if (!s || !s.opened || s.closed) return { ok: false };
    const cashIn = vals.cashIn, cashOut = vals.cashOut;
    const carryForward = s.cashCarry + cashIn - cashOut;
    const next = Object.assign({}, s, {
      closed: true, closeTime: nowTime(), closeDate: todayISO(),
      cashIn, cashOut, carryForward,
      chequePending: vals.chequePending || 0,
      closedBy: (vals.closedBy) || 'Chaiwat',
      closeBranch: (vals.branch) || '000',
      closeHost: (vals.host) || '192.168.100.82',
    });
    save(next);
    return { ok: true, session: next };
  }

  window.DaySession = { KEY, DEFAULT_CARRY, todayISO, nowTime, thDate, load, status, nextCarry, open, close };
})();
