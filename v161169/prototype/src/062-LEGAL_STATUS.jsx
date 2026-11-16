// ════════════════════════════════════════════════════════════════════
//  ข้อมูล — เปลี่ยนแปลงสถานะทางกฎหมาย (Legal Status Change)
//  ระบบงานทะเบียนและติดตามหนี้
//  ใช้แหล่งข้อมูลสมาชิก/สัญญา ร่วมกับเมนูอื่น (window.DN_MEMBERS)
// ════════════════════════════════════════════════════════════════════

// ─── รายการสถานะทางกฎหมาย (ค่าคงที่ระบบ) ────────────────────────────
//  code = รหัสอ้างอิงในระบบ · pill = สีป้ายสถานะ
window.LEGAL_STATUS = [
  { code: '1', label: 'ปกติ',                    pill: 'ok'      },
  { code: '2', label: 'ตั้งลูกหนี้คดี',           pill: 'warn'    },
  { code: '3', label: 'ฟ้องร้อง',                 pill: 'warn'    },
  { code: '4', label: 'พิพากษาแล้ว',              pill: 'info'    },
  { code: '5', label: 'บังคับคดี',                pill: 'warn'    },
  { code: '6', label: 'ประนอมหนี้',              pill: 'info'    },
  { code: '7', label: 'จำหน่ายหนี้สูญ',          pill: 'bad'     },
  { code: '8', label: 'ปิดสัญญา',                 pill: 'neutral' },
  { code: '9', label: 'ยกเลิกสถานะทางกฎหมาย',    pill: 'neutral' },
];

window.lsStatusByCode = (code) =>
  window.LEGAL_STATUS.find(s => s.code === code) || window.LEGAL_STATUS[0];

// ─── สถานะทางกฎหมายเดิมของสัญญา — ดึงจากสถานะสัญญา ──────────────────
//  คืน { code, label, legacyCode, pill } เพื่อแสดงใน "ข้อมูลก่อนเปลี่ยนแปลง"
window.lsCurrentLegal = (debt) => {
  if (!debt) return null;
  const map = {
    'ดำเนินคดี':     { code: '3', legacyCode: 'ฟ3RT' },
    'บอกเลิกสัญญา':  { code: '2', legacyCode: 'ต2CN' },
    'ผิดนัดชำระ':    { code: '1', legacyCode: 'ป1DF' },
    'ค้างชำระ':      { code: '1', legacyCode: 'ป1AR' },
    'ปกติ':          { code: '1', legacyCode: 'ป3RT' },
  };
  const m = map[debt.status] || { code: '1', legacyCode: 'ป3RT' };
  const s = window.lsStatusByCode(m.code);
  return { code: s.code, label: s.label, pill: s.pill, legacyCode: m.legacyCode };
};

// ─── ผู้ค้ำประกัน / รายการที่เกี่ยวข้องกับสัญญา ─────────────────────
//  แปลง debt.guarantors[] → แถวตาราง (รับผิดร่วม = คงเหลือเต็มจำนวน)
window.lsRelatedRows = (debt) => {
  if (!debt || !debt.guarantors) return [];
  const remaining = Number(debt.principalRemaining) || 0;
  const legal = window.lsCurrentLegal(debt);
  return debt.guarantors.map((g, i) => ({
    no: i + 1,
    memberCode: g.memberCode,
    name: (g.prefix || '') + g.name,
    contractNo: debt.contractNo,
    transferRemaining: remaining,
    legalCode: legal.code,
    legalLabel: legal.label,
    legalPill: legal.pill,
  }));
};

// ─── รายชื่อผู้อนุมัติ (Master Data) ────────────────────────────────
window.LS_APPROVERS = [
  'จีราพร ศรีสวัสดิ์',
  'มนตรี ศรีสุข',
  'สุพรรณี ธรรมรักษ์',
  'อนุรักษ์ พงษ์เจริญ',
];

window.LS_USER = 'มนตรี ศรีสุข';
window.lsToday = () => new Date().toISOString().slice(0, 10);

// ─── เลขที่คำขอ (running) ────────────────────────────────────────────
window.lsNextReqNo = (beYear) => {
  const key = 'ls_seq_' + beYear;
  const n = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
  try { localStorage.setItem(key, String(n)); } catch (e) {}
  return `LGS-${beYear}-${String(n).padStart(4, '0')}`;
};

// ─── ประวัติการเปลี่ยนแปลงสถานะทางกฎหมาย (localStorage) ─────────────
const LS_HIST_KEY = 'ls_history_v1';
window.lsLoadHistory = () => {
  try { return JSON.parse(localStorage.getItem(LS_HIST_KEY) || '[]'); }
  catch (e) { return []; }
};
window.lsSaveHistory = (rows) => {
  try { localStorage.setItem(LS_HIST_KEY, JSON.stringify(rows)); } catch (e) {}
};
window.lsHistoryFor = (contractNo) =>
  window.lsLoadHistory().filter(h => h.contractNo === contractNo);
window.lsPushHistory = (rec) => {
  const rows = window.lsLoadHistory();
  rows.unshift(rec);
  window.lsSaveHistory(rows);
  return rows;
};
