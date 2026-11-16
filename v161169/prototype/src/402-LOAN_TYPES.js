// ═════════════════════════════════════════════════════════════════
//  ทะเบียนและติดตามหนี้ › งานประจำวัน › ติดตามหนี้
//  ข้อมูลตั้งต้น — สร้างทะเบียนสัญญาทั้งหมดจากสมาชิกทุกคน (deterministic)
// ═════════════════════════════════════════════════════════════════
(function () {
  const LOAN_TYPES = [
    { code: '01', name: 'เงินกู้สามัญ', rate: 5.75 },
    { code: '02', name: 'เงินกู้พิเศษเพื่อที่อยู่อาศัย', rate: 5.25 },
    { code: '10', name: 'ฉฉ ฉุกเฉินเงินสด', rate: 5.50 },
    { code: '04', name: 'เงินกู้สามัญเพื่อการศึกษา', rate: 5.00 },
  ];

  window.DF_STATUSES = [
    { id: 'all', label: 'ทั้งหมด', pill: '' },
    { id: 'normal', label: 'ปกติ (ชำระสม่ำเสมอ)', pill: 'ok' },
    { id: 'warn1', label: 'เตือนครั้งที่ 1-3', pill: 'warn' },
    { id: 'letter', label: 'ออกหนังสือเตือน', pill: 'warn' },
    { id: 'negotiate', label: 'นัดเจรจา / ปรับโครงสร้าง', pill: 'info' },
  ];
  window.dfStatus = (id) => window.DF_STATUSES.find(s => s.id === id) || window.DF_STATUSES[0];

  const FOLLOW_KINDS = [
    ['call', 'โทรติดตาม'],
    ['letter', 'ออกหนังสือเตือน'],
    ['visit', 'พบตัว / เยี่ยมสังกัด'],
    ['negotiate', 'นัดเจรจาปรับโครงสร้าง'],
    ['payroll', 'ประสานหน่วยหักเงินเดือน'],
  ];
  window.DF_FOLLOW_KINDS = FOLLOW_KINDS;
  window.dfKind = (id) => (FOLLOW_KINDS.find(k => k[0] === id) || FOLLOW_KINDS[0])[1];

  // ── ตัวสร้างเลขสุ่มแบบคงที่ (ไม่เปลี่ยนทุกครั้งที่เปิดหน้า) ──
  const rnd = (seed) => {
    let x = 0;
    for (let i = 0; i < seed.length; i++) x = (x * 31 + seed.charCodeAt(i)) % 100000;
    return (n) => { x = (x * 1103515245 + 12345) % 2147483648; return x % n; };
  };
  const iso = (d) => d.toISOString().slice(0, 10);
  const daysAgo = (n) => { const d = new Date('2026-06-10T00:00:00'); d.setDate(d.getDate() - n); return iso(d); };
  const daysAhead = (n) => { const d = new Date('2026-06-10T00:00:00'); d.setDate(d.getDate() + n); return iso(d); };

  const buildPool = () => {
    const rows = [];
    let seq = 0;
    (window.MEMBERS_LIST || []).forEach((m, mi) => {
      const n = Math.max(m.loanCount || 0, 0);
      if (!n) return;
      const r = rnd(m.code);
      const totalLoan = m.loans || 0;
      for (let i = 0; i < n; i++) {
        const t = LOAN_TYPES[r(LOAN_TYPES.length)];
        const share = i === n - 1 ? 1 / n : (1 / n) * (0.8 + r(40) / 100);
        const remaining = Math.round((totalLoan * share) / 100) * 100;
        const overdueTerms = m.paymentStatus === 'ผิดนัดชำระ' ? 3 + r(4)
          : m.paymentStatus === 'ล่าช้า' ? 1 + r(2) : (r(10) === 0 ? 1 : 0);
        const overdueDays = overdueTerms ? overdueTerms * 30 + r(20) : 0;
        const interestArrears = overdueTerms ? Math.round(remaining * (t.rate / 100) * (overdueDays / 365)) : 0;
        const status = overdueTerms >= 4 ? 'negotiate'
          : overdueTerms === 3 ? 'letter'
            : overdueTerms >= 1 ? 'warn1' : 'normal';
        const year = 2019 + r(7);
        const contractNo = 'L-' + year + '-' + String(1000 + mi * 37 + i * 11).slice(1);
        const installment = Math.max(600, Math.round((m.monthly || 6000) / n / 10) * 10);
        const group = ['per', 'before', 'after'][r(3)];
        const judgmentAmount = Math.round((remaining * (1.05 + r(20) / 100)) / 1000) * 1000;
        const followLog = [];
        const logN = status === 'normal' ? (r(2) ? 1 : 0) : 1 + r(4);
        for (let k = 0; k < logN; k++) {
          const kind = FOLLOW_KINDS[r(FOLLOW_KINDS.length)][0];
          followLog.push({
            date: daysAgo(12 + k * 27 + r(8)),
            kind,
            by: ['ธนกร แสงทอง', 'สุนิสา ทองแท้', 'ประเสริฐ วัฒนชัย'][r(3)],
            result: kind === 'letter' ? 'ส่งไปยังต้นสังกัด รอผลตอบรับ'
              : kind === 'negotiate' ? 'ลูกหนี้ขอผ่อนผัน 3 งวด อยู่ระหว่างเสนอ'
                : kind === 'payroll' ? 'ขอให้หน่วยงานหักเงินเดือนเพิ่มเติม'
                  : 'ติดต่อได้ รับทราบยอดค้าง',
          });
        }
        followLog.sort((a, b) => (a.date < b.date ? 1 : -1));
        const payments = [];
        for (let k = 0; k < 6; k++) {
          const paid = !(overdueTerms && k < overdueTerms);
          payments.push({
            period: '2569/' + String(6 - k).padStart(2, '0'),
            due: daysAgo(k * 30 + 5),
            amount: installment,
            paid: paid ? installment : 0,
            date: paid ? daysAgo(k * 30 + 3) : null,
            channel: paid ? (r(3) ? 'หักเงินเดือน' : 'เงินสด/โอน') : '—',
          });
        }
        rows.push({
          id: contractNo,
          refNo: 'DF-2569-' + String(1001 + seq++).slice(1),
          contractNo,
          typeCode: t.code,
          typeName: t.name,
          group,
          judgmentAmount,
          rate: t.rate,
          memberCode: m.code,
          memberName: m.name,
          dept: m.dept,
          deptCode: m.deptCode,
          memberStatus: m.status,
          startDate: year + '-0' + (1 + r(8)) + '-15',
          principal: remaining + Math.round(remaining * 0.35 / 1000) * 1000,
          remaining,
          interestArrears,
          installment,
          overdueTerms,
          overdueDays,
          status,
          lastFollowDate: followLog.length ? followLog[0].date : null,
          nextAppointment: status === 'normal' ? null : daysAhead(3 + r(25)),
          owner: ['ธนกร แสงทอง', 'สุนิสา ทองแท้', 'ประเสริฐ วัฒนชัย'][r(3)],
          guarantors: (m.code === 'M-058241'
            ? ['นายอนุชา สุขสวัสดิ์ (M-058243)', 'นางสาวกานต์ ศิริวงศ์ (M-058242)']
            : ['นายสุรชัย วงศ์ประเสริฐ (M-058249)']),
          letters: status === 'normal' ? [] : [
            { no: 'นส-2569/' + String(400 + mi * 7 + i), date: daysAgo(30 + r(30)), kind: 'หนังสือเตือนให้ชำระหนี้ ครั้งที่ ' + Math.min(overdueTerms, 3), sent: true },
          ],
          followLog,
          payments,
          note: status === 'negotiate' ? 'ลูกหนี้แจ้งความประสงค์ขอปรับโครงสร้างหนี้ — รอเอกสารประกอบ' : '',
        });
      }
    });
    return rows;
  };

  const jcRows = () => {
    const list = (typeof window.jcLoad === 'function' ? window.jcLoad() : []) || [];
    return list.map((r, i) => {
      const remaining = window.jcRemaining ? window.jcRemaining(r) : Math.max(0, (r.judgmentAmount || 0) - (r.paidAmount || 0));
      const overdueTerms = window.jcOverdueTerms ? window.jcOverdueTerms(r) : 0;
      const status = overdueTerms >= 4 ? 'negotiate' : overdueTerms === 3 ? 'letter' : overdueTerms >= 1 ? 'warn1' : 'normal';
      const rr = rnd(r.no || ('jc' + i));
      const installment = r.installmentAmount || 0;
      const payments = [];
      for (let k = 0; k < 6; k++) {
        const paid = !(overdueTerms && k < Math.min(overdueTerms, 6));
        payments.push({
          period: '2569/' + String(6 - k).padStart(2, '0'),
          due: daysAgo(k * 30 + 5), amount: installment,
          paid: paid ? installment : 0, date: paid ? daysAgo(k * 30 + 3) : null,
          channel: paid ? 'หักเงินเดือน' : '—',
        });
      }
      return {
        id: r.id || r.no,
        refNo: r.no,
        contractNo: r.contractNo,
        typeCode: '01',
        typeName: 'เงินกู้ตามคำพิพากษา',
        rate: 5.75,
        group: r.group,
        judgmentAmount: r.judgmentAmount || 0,
        paidAmount: r.paidAmount || 0,
        memberCode: r.memberCode,
        memberName: r.memberName,
        dept: r.dept || '—',
        deptCode: '—',
        memberStatus: 'ปฏิบัติงาน',
        startDate: r.judgmentDate || '2024-01-01',
        principal: r.judgmentAmount || 0,
        remaining,
        interestArrears: 0,
        installment,
        overdueTerms,
        overdueDays: overdueTerms * 30,
        status,
        lastFollowDate: daysAgo(15 + rr(20)),
        nextAppointment: status === 'normal' ? null : daysAhead(3 + rr(25)),
        owner: ['ธนกร แสงทอง', 'สุนิสา ทองแท้', 'ประเสริฐ วัฒนชัย'][rr(3)],
        guarantors: (r.relatedParties || []).map(p => (p.name ? p.name + (p.code ? ' (' + p.code + ')' : '') : String(p))),
        letters: status === 'normal' ? [] : [{ no: 'นส-2569/' + (500 + i), date: daysAgo(30 + rr(20)), kind: 'หนังสือเตือนให้ชำระหนี้', sent: true }],
        followLog: [{ date: daysAgo(15 + rr(20)), kind: 'call', by: 'ธนกร แสงทอง', result: 'ติดตามการชำระตามคำพิพากษาตามยอม' }],
        payments,
        note: r.note || '',
      };
    });
  };

  const DF_LS_KEY = 'coop.debtFollow.v1';
  window.dfPool = () => {
    const base = jcRows().concat(buildPool());
    try {
      const raw = localStorage.getItem(DF_LS_KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw);
      return base.map(r => (saved[r.id] ? { ...r, ...saved[r.id] } : r));
    } catch (e) { return base; }
  };
  window.dfSave = (rows) => {
    const patch = {};
    rows.forEach(r => {
      patch[r.id] = {
        status: r.status, followLog: r.followLog, letters: r.letters,
        nextAppointment: r.nextAppointment, note: r.note, lastFollowDate: r.lastFollowDate,
      };
    });
    try { localStorage.setItem(DF_LS_KEY, JSON.stringify(patch)); } catch (e) { /* ignore */ }
  };
  window.dfToday = () => '2026-06-10';
})();
