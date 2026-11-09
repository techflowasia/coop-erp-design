// ════════════════════════════════════════════════════════════════════
//  ระบบประมวลผลและจัดเก็บ › ยกเลิก  (Level 2)
//  8 หน้าจอ — ทุกหน้าทำงานเป็น 4 ขั้น:
//    ① เรียกรหัสพนักงานผู้ทำรายการ (ต้องผ่านก่อนจึงค้นหาได้)
//    ② ค้นหารายการที่ทำไปแล้ว ตามเงื่อนไขของแต่ละประเภท
//    ③ ตรวจรายละเอียดรายการที่เลือก (สมาชิก · เอกสาร · รายการย่อย)
//    ④ ระบุเหตุผล แล้วยกเลิก — สรุปผลและเก็บประวัติการยกเลิก
//  ใช้คอมโพเนนต์ร่วมกับ 441-closing.js (ClHead / ClSec / ClFld / ClRO)
// ════════════════════════════════════════════════════════════════════

window.CX_STAFF = [{
  code: '00512',
  name: 'จีราพร ศรีสวัสดิ์',
  dept: 'ฝ่ายประมวลผลและจัดเก็บ',
  position: 'เจ้าหน้าที่ประมวลผล',
  level: 'อนุมัติยกเลิกได้ทุกประเภท'
}, {
  code: '00738',
  name: 'มนตรี ศรีสุข',
  dept: 'ฝ่ายการเงิน',
  position: 'หัวหน้าฝ่ายการเงิน',
  level: 'อนุมัติยกเลิกได้ทุกประเภท'
}, {
  code: '01104',
  name: 'สุพรรณี ธรรมรักษ์',
  dept: 'ฝ่ายสินเชื่อ',
  position: 'เจ้าหน้าที่สินเชื่อ',
  level: 'ยกเลิกเฉพาะงานสินเชื่อ'
}, {
  code: '01288',
  name: 'อนุรักษ์ พงษ์เจริญ',
  dept: 'ฝ่ายทะเบียนสมาชิก',
  position: 'เจ้าหน้าที่ทะเบียน',
  level: 'ยกเลิกเฉพาะงานทะเบียนและหุ้น'
}];
const CX_HIST_KEY = 'cx_cancel_history_v1';
const cxHistLoad = () => {
  try {
    return JSON.parse(localStorage.getItem(CX_HIST_KEY) || '[]');
  } catch (e) {
    return [];
  }
};
const cxHistSave = rows => {
  try {
    localStorage.setItem(CX_HIST_KEY, JSON.stringify(rows));
  } catch (e) {}
};
const cxMember = (code, name, unit, shares) => ({
  code,
  name,
  unit,
  shares
});
const CX_M1 = cxMember('059202', 'นายทองชัย ทั่วยะบัตร', '00555 พนักงานการปฏิบัติงาน', 184500);
const CX_M2 = cxMember('019518', 'นางบุญชวน หิรัญวัฒนะ', '00100 กองเกษียณ (ส่วนกลาง 1)', 96200);
const CX_M3 = cxMember('065980', 'นางสาวพิมพ์ใจ ธนวัฒน์', '00311 ฝ่ายการเงิน', 142000);
const CX_M4 = cxMember('019741', 'นายประสิทธิ์ สุวรรณมาลี', '00100 กองเกษียณ (ส่วนภูมิภาค)', 78400);

// ─── นิยาม 8 ประเภทการยกเลิก ─────────────────────────────────────────
const CX_TYPES = {
  'monthly-receipt': {
    icon: 'receipt',
    title: 'ยกเลิกใบเสร็จรับเงินรายเดือน',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกใบเสร็จรับเงินที่ออกจากการเรียกเก็บประจำเดือน',
    unit: 'ใบเสร็จ',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'period',
      label: 'งวดเรียกเก็บ',
      w: 150,
      placeholder: 'ปปปป/ดด'
    }, {
      k: 'receiptNo',
      label: 'เลขที่ใบเสร็จ',
      w: 180
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบเสร็จ',
      w: 150,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่ใบเสร็จ',
      w: 130,
      mono: true
    }, {
      k: 'period',
      label: 'งวดเรียกเก็บ',
      w: 120,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'amount',
      label: 'ยอดรวม',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'channel',
      label: 'ช่องทางรับเงิน',
      w: 150
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดใบเสร็จ',
      fields: [{
        label: 'เลขที่ใบเสร็จ',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่ใบเสร็จ',
        k: 'date',
        mono: true
      }, {
        label: 'งวดเรียกเก็บ',
        k: 'period',
        mono: true
      }, {
        label: 'ช่องทางรับเงิน',
        k: 'channel'
      }, {
        label: 'ผู้ทำรายการเดิม',
        k: 'by'
      }, {
        label: 'ยอดรวมใบเสร็จ',
        k: 'amount',
        money: true
      }]
    }],
    sub: {
      title: 'รายการในใบเสร็จ',
      cols: [{
        k: 'code',
        label: 'รหัส',
        w: 90,
        mono: true
      }, {
        k: 'label',
        label: 'รายการ',
        w: 260
      }, {
        k: 'principal',
        label: 'เงินต้น',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ดอกเบี้ย',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'total',
        label: 'รวมชำระ',
        w: 130,
        num: true,
        money: true
      }]
    },
    reasons: ['ออกใบเสร็จผิดสมาชิก', 'ออกใบเสร็จผิดงวด', 'ยอดเรียกเก็บไม่ถูกต้อง', 'สมาชิกขอยกเลิกรายการ', 'ระบบบันทึกซ้ำ'],
    rows: [{
      id: 'r1',
      docNo: 'RCV69-114208',
      date: '2026-09-05',
      period: '2569/09',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      amount: 12450,
      channel: 'หักเงินเดือน',
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        code: 'SHR',
        label: 'ค่าหุ้นรายเดือน',
        principal: 2000,
        interest: 0,
        total: 2000
      }, {
        code: 'LON',
        label: 'เงินกู้สามัญ ฉ68020327',
        principal: 7800,
        interest: 2150,
        total: 9950
      }, {
        code: 'ETC',
        label: 'ค่าธรรมเนียมเรียกเก็บ',
        principal: 500,
        interest: 0,
        total: 500
      }]
    }, {
      id: 'r2',
      docNo: 'RCV69-114377',
      date: '2026-09-05',
      period: '2569/09',
      memberCode: CX_M2.code,
      memberName: CX_M2.name,
      member: CX_M2,
      amount: 7300,
      channel: 'หักเงินเดือน',
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        code: 'SHR',
        label: 'ค่าหุ้นรายเดือน',
        principal: 1500,
        interest: 0,
        total: 1500
      }, {
        code: 'LON',
        label: 'เงินกู้ฉุกเฉิน ฉ69010044',
        principal: 5200,
        interest: 600,
        total: 5800
      }]
    }]
  },
  'share-withdraw': {
    icon: 'shares',
    title: 'ยกเลิกถอนหุ้น',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกรายการถอนหุ้น/ถอนหุ้นบางส่วนที่บันทึกไปแล้ว',
    unit: 'รายการ',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'docNo',
      label: 'เลขที่ใบถอนหุ้น',
      w: 180
    }, {
      k: 'mode',
      label: 'ประเภทการถอน',
      w: 180,
      options: ['ทั้งหมด', 'ถอนหุ้นบางส่วน', 'ถอนหุ้นทั้งหมด']
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบถอนหุ้น',
      w: 160,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่ถอน',
      w: 130,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'mode',
      label: 'ประเภทการถอน',
      w: 150
    }, {
      k: 'shares',
      label: 'จำนวนหุ้น',
      w: 110,
      num: true
    }, {
      k: 'amount',
      label: 'ยอดถอน',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดการถอนหุ้น',
      fields: [{
        label: 'เลขที่ใบถอนหุ้น',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่ถอน',
        k: 'date',
        mono: true
      }, {
        label: 'ประเภทการถอน',
        k: 'mode'
      }, {
        label: 'จำนวนหุ้นที่ถอน',
        k: 'shares'
      }, {
        label: 'ยอดถอน',
        k: 'amount',
        money: true
      }, {
        label: 'โอนชำระหนี้',
        k: 'toDebt',
        money: true
      }, {
        label: 'จ่ายสุทธิ',
        k: 'net',
        money: true
      }, {
        label: 'ผู้ทำรายการเดิม',
        k: 'by'
      }]
    }],
    sub: {
      title: 'ผลกระทบเมื่อยกเลิก',
      cols: [{
        k: 'label',
        label: 'รายการ',
        w: 280
      }, {
        k: 'before',
        label: 'ก่อนยกเลิก',
        w: 150,
        num: true,
        money: true
      }, {
        k: 'after',
        label: 'หลังยกเลิก',
        w: 150,
        num: true,
        money: true
      }]
    },
    reasons: ['บันทึกถอนหุ้นผิดสมาชิก', 'จำนวนหุ้นที่ถอนไม่ถูกต้อง', 'สมาชิกขอยกเลิกคำขอถอนหุ้น', 'ยังไม่ได้รับอนุมัติจากคณะกรรมการ'],
    rows: [{
      id: 's1',
      docNo: 'SHW69-000418',
      date: '2026-09-08',
      memberCode: CX_M3.code,
      memberName: CX_M3.name,
      member: CX_M3,
      mode: 'ถอนหุ้นบางส่วน',
      shares: 1200,
      amount: 12000,
      toDebt: 4000,
      net: 8000,
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        label: 'ทุนเรือนหุ้นคงเหลือ',
        before: 130000,
        after: 142000
      }, {
        label: 'ยอดหนี้คงเหลือ',
        before: 226000,
        after: 230000
      }]
    }, {
      id: 's2',
      docNo: 'SHW69-000431',
      date: '2026-09-10',
      memberCode: CX_M4.code,
      memberName: CX_M4.name,
      member: CX_M4,
      mode: 'ถอนหุ้นทั้งหมด',
      shares: 7840,
      amount: 78400,
      toDebt: 0,
      net: 78400,
      by: 'somsak',
      status: 'ปกติ',
      items: [{
        label: 'ทุนเรือนหุ้นคงเหลือ',
        before: 0,
        after: 78400
      }, {
        label: 'ยอดจ่ายคืนสมาชิก',
        before: 78400,
        after: 0
      }]
    }]
  },
  'resign': {
    icon: 'user',
    title: 'ยกเลิกการลาออก',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกใบลาออกและคืนสถานะการเป็นสมาชิก',
    unit: 'ราย',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'docNo',
      label: 'เลขที่ใบลาออก',
      w: 180
    }, {
      k: 'state',
      label: 'สถานะใบลาออก',
      w: 180,
      options: ['ทั้งหมด', 'รออนุมัติ', 'อนุมัติแล้ว', 'ปิดบัญชีแล้ว']
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบลาออก',
      w: 160,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่ยื่น',
      w: 130,
      mono: true
    }, {
      k: 'outDate',
      label: 'วันที่มีผล',
      w: 130,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'reason',
      label: 'สาเหตุการลาออก',
      w: 180
    }, {
      k: 'state',
      label: 'สถานะใบลาออก',
      w: 150
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดใบลาออก',
      fields: [{
        label: 'เลขที่ใบลาออก',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่ยื่นใบลาออก',
        k: 'date',
        mono: true
      }, {
        label: 'วันที่มีผล',
        k: 'outDate',
        mono: true
      }, {
        label: 'สาเหตุการลาออก',
        k: 'reason'
      }, {
        label: 'สถานะใบลาออก',
        k: 'state'
      }, {
        label: 'ผู้อนุมัติ',
        k: 'approver'
      }, {
        label: 'ทุนเรือนหุ้นคืน',
        k: 'shareRefund',
        money: true
      }, {
        label: 'หนี้คงเหลือ',
        k: 'debtRemain',
        money: true
      }]
    }],
    sub: {
      title: 'สถานะที่จะถูกคืนเมื่อยกเลิกการลาออก',
      cols: [{
        k: 'label',
        label: 'รายการ',
        w: 280
      }, {
        k: 'beforeTxt',
        label: 'สถานะปัจจุบัน',
        w: 200
      }, {
        k: 'afterTxt',
        label: 'หลังยกเลิกการลาออก',
        w: 200
      }]
    },
    reasons: ['สมาชิกขอกลับเข้าเป็นสมาชิกต่อ', 'บันทึกใบลาออกผิดคน', 'ยังมีภาระหนี้/ค้ำประกันคงค้าง', 'คณะกรรมการไม่อนุมัติการลาออก'],
    rows: [{
      id: 'q1',
      docNo: 'RSG69-000284',
      date: '2026-08-28',
      outDate: '2026-09-30',
      memberCode: CX_M2.code,
      memberName: CX_M2.name,
      member: CX_M2,
      reason: 'ลาออกจากงาน',
      state: 'อนุมัติแล้ว',
      approver: 'มนตรี ศรีสุข',
      shareRefund: 96200,
      debtRemain: 0,
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        label: 'สถานะการเป็นสมาชิก',
        beforeTxt: 'ลาออก',
        afterTxt: 'ปกติ'
      }, {
        label: 'ทะเบียนหุ้น',
        beforeTxt: 'ปิดบัญชีหุ้น',
        afterTxt: 'เปิดใช้งาน'
      }, {
        label: 'การเรียกเก็บรายเดือน',
        beforeTxt: 'หยุดเรียกเก็บ',
        afterTxt: 'เรียกเก็บตามปกติ'
      }]
    }, {
      id: 'q2',
      docNo: 'RSG69-000291',
      date: '2026-09-02',
      outDate: '2026-10-31',
      memberCode: CX_M4.code,
      memberName: CX_M4.name,
      member: CX_M4,
      reason: 'เกษียณอายุ',
      state: 'รออนุมัติ',
      approver: '—',
      shareRefund: 78400,
      debtRemain: 154000,
      by: 'somsak',
      status: 'ปกติ',
      items: [{
        label: 'สถานะการเป็นสมาชิก',
        beforeTxt: 'รอลาออก',
        afterTxt: 'ปกติ'
      }, {
        label: 'การค้ำประกัน',
        beforeTxt: 'รอปลดภาระ',
        afterTxt: 'คงภาระค้ำประกันเดิม'
      }]
    }]
  },
  'loan-contract': {
    icon: 'loans',
    title: 'ยกเลิกสัญญาเงินกู้',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกสัญญาเงินกู้ที่ยังไม่มีการเคลื่อนไหวหรือบันทึกผิด',
    unit: 'สัญญา',
    search: [{
      k: 'contract',
      label: 'เลขที่สัญญา',
      w: 180
    }, {
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'loanType',
      label: 'ประเภทเงินกู้',
      w: 200,
      options: ['ทั้งหมด', 'สามัญ', 'ฉุกเฉิน', 'พิเศษ']
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่สัญญา',
      w: 150,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่เริ่มสัญญา',
      w: 140,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'loanType',
      label: 'ประเภทเงินกู้',
      w: 180
    }, {
      k: 'approved',
      label: 'ยอดอนุมัติ',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'remain',
      label: 'ยอดคงเหลือ',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'state',
      label: 'สถานะสัญญา',
      w: 140
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'ยอดเงินอนุมัติ',
      fields: [{
        label: 'ยอดอนุมัติ',
        k: 'approved',
        money: true
      }, {
        label: 'ยอดรอเบิก',
        k: 'pending',
        money: true
      }, {
        label: 'ยอดคงเหลือ',
        k: 'remain',
        money: true
      }, {
        label: 'สถานะสัญญา',
        k: 'state'
      }]
    }, {
      title: 'รายละเอียดการชำระ',
      fields: [{
        label: 'วันที่เริ่มสัญญา',
        k: 'date',
        mono: true
      }, {
        label: 'งวดทั้งหมด',
        k: 'terms'
      }, {
        label: 'ชำระ/งวด',
        k: 'perTerm',
        money: true
      }, {
        label: 'อัตราดอกเบี้ย',
        k: 'rate'
      }, {
        label: 'ประเภทเงินกู้',
        k: 'loanType'
      }, {
        label: 'หมายเหตุ',
        k: 'note'
      }]
    }],
    sub: {
      title: 'รายการเคลื่อนไหวของสัญญา',
      cols: [{
        k: 'date',
        label: 'วันที่',
        w: 120,
        mono: true
      }, {
        k: 'label',
        label: 'รายการ',
        w: 260
      }, {
        k: 'principal',
        label: 'เงินต้น',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ดอกเบี้ย',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'remain',
        label: 'คงเหลือ',
        w: 130,
        num: true,
        money: true
      }]
    },
    reasons: ['บันทึกสัญญาผิดสมาชิก', 'ประเภทเงินกู้ไม่ถูกต้อง', 'ยอดอนุมัติไม่ถูกต้อง', 'สมาชิกขอยกเลิกการกู้', 'สัญญาซ้ำในระบบ'],
    rows: [{
      id: 'c1',
      docNo: 'ฉ68020327',
      date: '2026-08-14',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      loanType: '20 สามัญ 33 เท่า',
      approved: 500000,
      pending: 0,
      remain: 486400,
      terms: 120,
      perTerm: 5400,
      rate: '5.25% ต่อปี',
      state: 'ปกติ — ยังไม่ชำระงวดแรก',
      note: '—',
      by: 'suphannee',
      status: 'ปกติ',
      items: [{
        date: '2026-08-14',
        label: 'ตั้งสัญญาเงินกู้',
        principal: 500000,
        interest: 0,
        remain: 500000
      }, {
        date: '2026-08-31',
        label: 'ชำระงวดที่ 1',
        principal: 13600,
        interest: 2100,
        remain: 486400
      }]
    }, {
      id: 'c2',
      docNo: 'ฉ69010044',
      date: '2026-09-01',
      memberCode: CX_M3.code,
      memberName: CX_M3.name,
      member: CX_M3,
      loanType: '10 ฉุกเฉินเงินสด',
      approved: 50000,
      pending: 50000,
      remain: 50000,
      terms: 12,
      perTerm: 4400,
      rate: '5.75% ต่อปี',
      state: 'รอจ่ายเงินกู้',
      note: 'ยังไม่มีการเคลื่อนไหว',
      by: 'suphannee',
      status: 'ปกติ',
      items: [{
        date: '2026-09-01',
        label: 'ตั้งสัญญาเงินกู้',
        principal: 50000,
        interest: 0,
        remain: 50000
      }]
    }]
  },
  'receipt-return': {
    icon: 'receipt',
    title: 'ยกเลิกคืนใบเสร็จ',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกใบปรับปรุง (คืนใบเสร็จ) ที่บันทึกไปแล้ว',
    unit: 'ใบปรับปรุง',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'docNo',
      label: 'เลขที่ใบปรับปรุง',
      w: 190
    }, {
      k: 'adjType',
      label: 'ประเภทปรับปรุง',
      w: 170,
      options: ['ทั้งหมด', 'MTH — รายเดือน', 'CSH — เงินสด', 'SPC — พิเศษ']
    }, {
      k: 'period',
      label: 'งวดเรียกเก็บ',
      w: 150,
      placeholder: 'ปปปป/ดด'
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบปรับปรุง',
      w: 170,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่ใบปรับปรุง',
      w: 150,
      mono: true
    }, {
      k: 'period',
      label: 'ประจำเดือน',
      w: 130,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'adjType',
      label: 'ประเภทปรับปรุง',
      w: 150
    }, {
      k: 'amount',
      label: 'ยอดปรับปรุง',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'reasonAdj',
      label: 'เหตุผลที่ปรับปรุง',
      w: 170
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดใบปรับปรุง',
      fields: [{
        label: 'เลขที่ใบปรับปรุง',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่ใบปรับปรุง',
        k: 'date',
        mono: true
      }, {
        label: 'วันที่รายการ',
        k: 'txnDate',
        mono: true
      }, {
        label: 'ประเภทปรับปรุง',
        k: 'adjType'
      }, {
        label: 'ประจำเดือน',
        k: 'period',
        mono: true
      }, {
        label: 'ยอดปรับปรุง',
        k: 'amount',
        money: true
      }, {
        label: 'เหตุผลที่ปรับปรุง',
        k: 'reasonAdj'
      }, {
        label: 'คืนทั้งใบ',
        k: 'fullReturn'
      }, {
        label: 'ผู้ทำรายการเดิม',
        k: 'by'
      }]
    }],
    sub: {
      title: 'รายการที่ปรับปรุง',
      cols: [{
        k: 'code',
        label: 'รหัส',
        w: 90,
        mono: true
      }, {
        k: 'label',
        label: 'รายการ',
        w: 260
      }, {
        k: 'principal',
        label: 'เงินต้น',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ดอกเบี้ย',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'total',
        label: 'รวมปรับปรุง',
        w: 130,
        num: true,
        money: true
      }]
    },
    reasons: ['คืนใบเสร็จผิดงวด', 'คืนใบเสร็จผิดสมาชิก', 'ยอดปรับปรุงไม่ถูกต้อง', 'บันทึกใบปรับปรุงซ้ำ'],
    rows: [{
      id: 'a1',
      docNo: 'ADJ69-000712',
      date: '2026-09-14',
      txnDate: '2026-09-14',
      period: '2569/08',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      adjType: 'MTH — รายเดือน',
      amount: 9950,
      reasonAdj: 'ไม่ชำระ',
      fullReturn: 'ไม่คืนทั้งใบ',
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        code: 'LON',
        label: 'เงินกู้สามัญ ฉ68020327',
        principal: 7800,
        interest: 2150,
        total: 9950
      }]
    }, {
      id: 'a2',
      docNo: 'ADJ69-000733',
      date: '2026-09-14',
      txnDate: '2026-09-14',
      period: '2569/09',
      memberCode: CX_M2.code,
      memberName: CX_M2.name,
      member: CX_M2,
      adjType: 'MTH — รายเดือน',
      amount: 7300,
      reasonAdj: 'ไม่ชำระ',
      fullReturn: 'คืนทั้งใบ',
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        code: 'SHR',
        label: 'ค่าหุ้นรายเดือน',
        principal: 1500,
        interest: 0,
        total: 1500
      }, {
        code: 'LON',
        label: 'เงินกู้ฉุกเฉิน ฉ69010044',
        principal: 5200,
        interest: 600,
        total: 5800
      }]
    }]
  },
  'loan-payout': {
    icon: 'money',
    title: 'ยกเลิกการจ่ายเงินกู้',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกใบสั่งจ่าย/การจ่ายเงินกู้ที่ทำรายการไปแล้ว',
    unit: 'รายการ',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'contract',
      label: 'เลขที่สัญญา',
      w: 170
    }, {
      k: 'payNo',
      label: 'เลขที่จ่าย',
      w: 170
    }, {
      k: 'from',
      label: 'ช่วงวันที่ต้องการยกเลิก (เริ่ม)',
      w: 210,
      type: 'date'
    }, {
      k: 'to',
      label: 'ถึงวันที่',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่จ่าย',
      w: 150,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่จ่าย',
      w: 130,
      mono: true
    }, {
      k: 'contractNo',
      label: 'เลขที่สัญญา',
      w: 140,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'payType',
      label: 'ประเภทเงิน',
      w: 150
    }, {
      k: 'amount',
      label: 'ยอดจ่าย',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'จ่ายเงินโดย',
      fields: [{
        label: 'ประเภทเงิน',
        k: 'payType'
      }, {
        label: 'ธนาคาร',
        k: 'bank'
      }, {
        label: 'สาขา',
        k: 'branch'
      }, {
        label: 'เลขที่บัญชี',
        k: 'acct',
        mono: true
      }, {
        label: 'เลขที่เอกสาร',
        k: 'docRef',
        mono: true
      }, {
        label: 'วันที่ทำรายการ',
        k: 'date',
        mono: true
      }, {
        label: 'เลขที่สลิป',
        k: 'slipNo',
        mono: true
      }, {
        label: 'ผู้ทำรายการเดิม',
        k: 'by'
      }]
    }, {
      title: 'รายละเอียดการจ่ายเงิน',
      fields: [{
        label: 'ถอนหุ้นบางส่วน',
        k: 'partialShare'
      }, {
        label: 'วันที่จ่ายเงิน',
        k: 'date',
        mono: true
      }, {
        label: 'ครั้งที่ถอน',
        k: 'withdrawRound'
      }, {
        label: 'ยอดหุ้น',
        k: 'shareAmount',
        money: true
      }, {
        label: 'ยอดหักชำระ',
        k: 'deduct',
        money: true
      }, {
        label: 'ยอดรับเงินสุทธิ',
        k: 'net',
        money: true
      }]
    }],
    sub: {
      title: 'รายการ Slip',
      cols: [{
        k: 'label',
        label: 'รายการ',
        w: 240
      }, {
        k: 'term',
        label: 'งวด',
        w: 80,
        num: true
      }, {
        k: 'principal',
        label: 'ชำระต้น',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ชำระ ด/บ',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'total',
        label: 'รวมชำระ',
        w: 130,
        num: true,
        money: true
      }, {
        k: 'remain',
        label: 'คงเหลือ',
        w: 130,
        num: true,
        money: true
      }]
    },
    reasons: ['โอนเงินเข้าบัญชีผิด', 'ยอดจ่ายไม่ถูกต้อง', 'สมาชิกขอยกเลิกการรับเงินกู้', 'ธนาคารตีกลับรายการโอน', 'บันทึกจ่ายซ้ำ'],
    rows: [{
      id: 'p1',
      docNo: 'LP69-003877',
      date: '2026-09-03',
      contractNo: 'ฉ68020327',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      payType: 'CBT — โอนธนาคาร',
      bank: 'ธ. กรุงไทย',
      branch: 'สาขา ไปรษณีย์ไทย (กสท)',
      acct: '093-6-01847-2',
      docRef: 'LPD69-003877',
      slipNo: 'SLP-778412',
      amount: 486000,
      partialShare: 'ไม่ถอนหุ้นบางส่วน',
      withdrawRound: '—',
      shareAmount: 0,
      deduct: 14000,
      net: 486000,
      by: 'suphannee',
      status: 'ปกติ',
      items: [{
        label: 'หักหนี้เดิม — เงินกู้ฉุกเฉิน',
        term: 1,
        principal: 12000,
        interest: 2000,
        total: 14000,
        remain: 0
      }]
    }, {
      id: 'p2',
      docNo: 'LP69-003901',
      date: '2026-09-09',
      contractNo: 'ฉ69010044',
      memberCode: CX_M3.code,
      memberName: CX_M3.name,
      member: CX_M3,
      payType: 'CSH — เงินสด',
      bank: '—',
      branch: '—',
      acct: '—',
      docRef: 'LPD69-003901',
      slipNo: 'SLP-778590',
      amount: 50000,
      partialShare: 'ถอนหุ้นบางส่วน',
      withdrawRound: '2',
      shareAmount: 12000,
      deduct: 0,
      net: 62000,
      by: 'suphannee',
      status: 'ปกติ',
      items: []
    }]
  },
  'special-order': {
    icon: 'receipt',
    title: 'ยกเลิกใบสั่งชำระพิเศษ',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกใบสั่งชำระพิเศษที่ออกให้สมาชิกแล้ว',
    unit: 'ใบสั่ง',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'orderNo',
      label: 'เลขที่ใบสั่ง',
      w: 180
    }, {
      k: 'state',
      label: 'สถานะใบสั่ง',
      w: 170,
      options: ['ทั้งหมด', 'ยังไม่ชำระ', 'ชำระบางส่วน', 'ชำระครบแล้ว']
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบสั่ง',
      w: 150,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่ใบสั่ง',
      w: 130,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'receiptNo',
      label: 'เลขที่ใบเสร็จ',
      w: 150,
      mono: true
    }, {
      k: 'payKind',
      label: 'ประเภท',
      w: 130
    }, {
      k: 'amount',
      label: 'ยอดรวม',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'state',
      label: 'สถานะใบสั่ง',
      w: 140
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดใบสั่งชำระ',
      fields: [{
        label: 'เลขที่ใบสั่ง',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่ใบสั่ง',
        k: 'date',
        mono: true
      }, {
        label: 'สถานะรายการ',
        k: 'status'
      }, {
        label: 'ทำรายการโดย',
        k: 'by'
      }, {
        label: 'ยอดรวมใบสั่ง',
        k: 'amount',
        money: true
      }, {
        label: 'สถานะใบสั่ง',
        k: 'state'
      }]
    }],
    sub: {
      title: 'รายการชำระตามใบสั่ง',
      cols: [{
        k: 'label',
        label: 'รายละเอียด',
        w: 260
      }, {
        k: 'term',
        label: 'งวด',
        w: 80,
        num: true
      }, {
        k: 'principal',
        label: 'ต้นเงิน',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ด/บ',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'total',
        label: 'รวมชำระ',
        w: 130,
        num: true,
        money: true
      }, {
        k: 'remain',
        label: 'ต้นคงเหลือ',
        w: 130,
        num: true,
        money: true
      }]
    },
    reasons: ['ออกใบสั่งผิดสมาชิก', 'ยอดในใบสั่งไม่ถูกต้อง', 'สมาชิกยกเลิกการชำระพิเศษ', 'ใบสั่งหมดอายุ', 'ออกใบสั่งซ้ำ'],
    rows: [{
      id: 'o1',
      docNo: 'SPO69-000155',
      date: '2026-09-11',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      receiptNo: 'RCV69-114560',
      payKind: 'ชำระหนี้บางส่วน',
      amount: 42000,
      state: 'ยังไม่ชำระ',
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        label: 'เงินกู้สามัญ ฉ68020327 — ชำระพิเศษ',
        term: 1,
        principal: 38000,
        interest: 4000,
        total: 42000,
        remain: 448400
      }]
    }, {
      id: 'o2',
      docNo: 'SPO69-000162',
      date: '2026-09-12',
      memberCode: CX_M4.code,
      memberName: CX_M4.name,
      member: CX_M4,
      receiptNo: '—',
      payKind: 'ปิดบัญชีเงินกู้',
      amount: 154000,
      state: 'ชำระบางส่วน',
      by: 'somsak',
      status: 'ปกติ',
      items: [{
        label: 'เงินกู้ฉุกเฉิน ฉ67110082 — ปิดบัญชี',
        term: 1,
        principal: 148000,
        interest: 6000,
        total: 154000,
        remain: 0
      }]
    }]
  },
  'special-pay': {
    icon: 'money',
    title: 'ยกเลิกชำระพิเศษ',
    subtitle: 'ประมวลผลและจัดเก็บ · ยกเลิก — ยกเลิกรายการรับชำระพิเศษที่รับเงินไปแล้ว',
    unit: 'รายการ',
    search: [{
      k: 'member',
      label: 'ทะเบียนสมาชิก',
      w: 160
    }, {
      k: 'receiptNo',
      label: 'เลขที่ใบเสร็จ',
      w: 180
    }, {
      k: 'orderNo',
      label: 'เลขที่ใบสั่ง',
      w: 170
    }, {
      k: 'channel',
      label: 'ช่องทางรับเงิน',
      w: 180,
      options: ['ทั้งหมด', 'เงินสด', 'โอนธนาคาร', 'เช็ค']
    }, {
      k: 'from',
      label: 'วันที่เริ่ม',
      w: 170,
      type: 'date'
    }, {
      k: 'to',
      label: 'วันที่สิ้นสุด',
      w: 170,
      type: 'date'
    }],
    cols: [{
      k: 'docNo',
      label: 'เลขที่ใบเสร็จ',
      w: 160,
      mono: true
    }, {
      k: 'date',
      label: 'วันที่รับชำระ',
      w: 140,
      mono: true
    }, {
      k: 'orderNo',
      label: 'เลขที่ใบสั่ง',
      w: 150,
      mono: true
    }, {
      k: 'memberCode',
      label: 'ทะเบียน',
      w: 110,
      mono: true
    }, {
      k: 'memberName',
      label: 'ชื่อ-ชื่อสกุล',
      w: 220
    }, {
      k: 'channel',
      label: 'ช่องทางรับเงิน',
      w: 150
    }, {
      k: 'amount',
      label: 'ยอดรับชำระ',
      w: 130,
      num: true,
      money: true
    }, {
      k: 'status',
      label: 'สถานะรายการ',
      w: 130,
      pill: true
    }],
    detail: [{
      title: 'รายละเอียดการรับชำระ',
      fields: [{
        label: 'เลขที่ใบเสร็จ',
        k: 'docNo',
        mono: true
      }, {
        label: 'วันที่รับชำระ',
        k: 'date',
        mono: true
      }, {
        label: 'เลขที่ใบสั่งอ้างอิง',
        k: 'orderNo',
        mono: true
      }, {
        label: 'ช่องทางรับเงิน',
        k: 'channel'
      }, {
        label: 'ธนาคาร / สาขา',
        k: 'bank'
      }, {
        label: 'เลขที่บัญชี',
        k: 'acct',
        mono: true
      }, {
        label: 'ยอดรับชำระ',
        k: 'amount',
        money: true
      }, {
        label: 'ผู้รับเงิน',
        k: 'by'
      }]
    }],
    sub: {
      title: 'รายการที่ตัดชำระ',
      cols: [{
        k: 'label',
        label: 'รายละเอียด',
        w: 260
      }, {
        k: 'term',
        label: 'งวด',
        w: 80,
        num: true
      }, {
        k: 'principal',
        label: 'ชำระต้น',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'interest',
        label: 'ชำระ ด/บ',
        w: 120,
        num: true,
        money: true
      }, {
        k: 'total',
        label: 'รวมชำระ',
        w: 130,
        num: true,
        money: true
      }, {
        k: 'remain',
        label: 'คงเหลือหลังชำระ',
        w: 150,
        num: true,
        money: true
      }]
    },
    reasons: ['รับชำระผิดสมาชิก', 'ยอดรับชำระไม่ถูกต้อง', 'เช็คคืน / โอนไม่สำเร็จ', 'บันทึกรับชำระซ้ำ', 'ยกเลิกตามคำขอสมาชิก'],
    rows: [{
      id: 'y1',
      docNo: 'RCV69-114601',
      date: '2026-09-12',
      orderNo: 'SPO69-000155',
      memberCode: CX_M1.code,
      memberName: CX_M1.name,
      member: CX_M1,
      channel: 'โอนธนาคาร',
      bank: 'ธ. กรุงไทย / สาขา ไปรษณีย์ไทย (กสท)',
      acct: '093-6-01847-2',
      amount: 42000,
      by: 'jeerana',
      status: 'ปกติ',
      items: [{
        label: 'เงินกู้สามัญ ฉ68020327 — ชำระพิเศษ',
        term: 1,
        principal: 38000,
        interest: 4000,
        total: 42000,
        remain: 448400
      }]
    }, {
      id: 'y2',
      docNo: 'RCV69-114622',
      date: '2026-09-13',
      orderNo: 'SPO69-000162',
      memberCode: CX_M4.code,
      memberName: CX_M4.name,
      member: CX_M4,
      channel: 'เงินสด',
      bank: '—',
      acct: '—',
      amount: 154000,
      by: 'somsak',
      status: 'ปกติ',
      items: [{
        label: 'เงินกู้ฉุกเฉิน ฉ67110082 — ปิดบัญชี',
        term: 1,
        principal: 148000,
        interest: 6000,
        total: 154000,
        remain: 0
      }]
    }]
  }
};
function cxCell(row, c) {
  const v = row[c.k];
  if (v === undefined || v === null || v === '') return /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\u2014");
  if (c.money) return clMoney(v);
  if (c.k === 'date' || c.k === 'txnDate' || c.k === 'outDate') return window.fmt.date(v);
  return v;
}

// ─── หน้ายกเลิกแบบใช้ร่วมกันทุกประเภท ─────────────────────────────────
function CancelPage({
  typeKey,
  onToast
}) {
  const {
    useState
  } = React;
  const cfg = CX_TYPES[typeKey];
  const audit = clAudit();
  const [staffCode, setStaffCode] = useState('');
  const [staff, setStaff] = useState(null);
  const [staffErr, setStaffErr] = useState('');
  const [query, setQuery] = useState({});
  const [rows, setRows] = useState(null);
  const [selId, setSelId] = useState('');
  const [reason, setReason] = useState(cfg.reasons[0]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(() => cxHistLoad().filter(h => h.type === typeKey));
  const sel = (rows || []).find(r => r.id === selId) || null;
  const callStaff = () => {
    const s = window.CX_STAFF.find(x => x.code === staffCode.trim() || x.name === staffCode.trim());
    if (!s) {
      setStaff(null);
      setStaffErr('ไม่พบรหัสพนักงานนี้ในระบบ — กรุณาตรวจสอบรหัสอีกครั้ง');
      return;
    }
    setStaff(s);
    setStaffErr('');
    onToast && onToast(`เรียกข้อมูลพนักงาน ${s.code} · ${s.name} เรียบร้อยแล้ว`);
  };
  const clearStaff = () => {
    setStaff(null);
    setStaffCode('');
    setRows(null);
    setSelId('');
    setResult(null);
  };
  const search = () => {
    if (!staff) return;
    const q = (query.member || '').trim();
    const rs = cfg.rows.filter(r => !q || (r.memberCode || '').includes(q) || (r.memberName || '').includes(q));
    setRows(rs);
    setSelId(rs.length ? rs[0].id : '');
    setResult(null);
    onToast && onToast(`พบรายการที่ทำไปแล้ว ${rs.length} ${cfg.unit}`);
  };
  const doCancel = () => {
    if (!staff || !sel) return;
    const no = `CX${clBE().toString().slice(-2)}${String(Math.floor(Math.random() * 90000) + 10000)}`;
    const rec = {
      no,
      type: typeKey,
      typeLabel: cfg.title,
      at: new Date().toISOString(),
      docNo: sel.docNo,
      memberCode: sel.memberCode,
      memberName: sel.memberName,
      amount: sel.amount || sel.approved || 0,
      reason,
      note,
      staff: `${staff.code} · ${staff.name}`,
      state: 'ยกเลิกสำเร็จ'
    };
    const all = [rec, ...cxHistLoad()];
    cxHistSave(all);
    setHistory(all.filter(h => h.type === typeKey));
    setRows(rs => rs.map(r => r.id === sel.id ? {
      ...r,
      status: 'ยกเลิกแล้ว'
    } : r));
    setResult(clRun({
      no,
      steps: [{
        label: 'ตรวจสอบสิทธิ์ผู้ทำรายการ',
        total: 1,
        failed: 0
      }, {
        label: `ยกเลิก${cfg.title.replace('ยกเลิก', '')} — ${sel.docNo}`,
        total: 1,
        failed: 0
      }, {
        label: 'ปรับปรุงยอดในทะเบียนที่เกี่ยวข้อง',
        total: (sel.items || []).length || 1,
        failed: 0
      }, {
        label: 'บันทึกบัญชีกลับรายการ',
        total: 1,
        failed: 0
      }]
    }));
    audit && audit.log && audit.log({
      action: 'delete',
      module: `ประมวลผลและจัดเก็บ — ${cfg.title}`,
      target: `${sel.docNo} · ${sel.memberCode} ${sel.memberName}`,
      summary: `${no} · ${cfg.title} · เหตุผล: ${reason}${note ? ' — ' + note : ''} · ผู้ทำรายการ ${staff.code} ${staff.name}`
    });
    onToast && onToast(`${cfg.title} ${sel.docNo} เรียบร้อยแล้ว (${no})`);
  };
  const m = sel ? sel.member : null;
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": cfg.title
  }, /*#__PURE__*/React.createElement(ClHead, {
    icon: cfg.icon,
    title: cfg.title,
    subtitle: cfg.subtitle,
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: search,
      disabled: !staff
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 13
    }), " \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("button", {
      className: "btn danger sm",
      onClick: doCancel,
      disabled: !staff || !sel || sel && sel.status === 'ยกเลิกแล้ว'
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "close",
      size: 13
    }), " \u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))
  }), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u2460 \u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2014 \u0E40\u0E23\u0E35\u0E22\u0E01\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
    hint: staff ? undefined : 'ต้องเรียกรหัสพนักงานให้ผ่านก่อน จึงจะค้นหารายการเพื่อยกเลิกได้'
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
    w: 190,
    required: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: staffCode,
    placeholder: "\u0E40\u0E0A\u0E48\u0E19 00512",
    onChange: e => {
      setStaffCode(e.target.value);
      setStaffErr('');
    },
    onKeyDown: e => {
      if (e.key === 'Enter') callStaff();
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: callStaff
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13
  }), " \u0E40\u0E23\u0E35\u0E22\u0E01"))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: staff ? staff.name : '',
    placeholder: "(\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E40\u0E23\u0E35\u0E22\u0E01\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19)"
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E15\u0E33\u0E41\u0E2B\u0E19\u0E48\u0E07",
    w: 190
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: staff ? staff.position : ''
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1D\u0E48\u0E32\u0E22/\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    w: 200
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: staff ? staff.dept : ''
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E34\u0E17\u0E18\u0E34\u0E4C\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
    w: 220
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: staff ? staff.level : ''
  })), staff && /*#__PURE__*/React.createElement(ClFld, {
    label: " ",
    w: 120
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: clearStaff
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "refresh",
    size: 13
  }), " \u0E40\u0E1B\u0E25\u0E35\u0E48\u0E22\u0E19\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"))), staffErr && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", staffErr)), /*#__PURE__*/React.createElement(ClSec, {
    title: "\u2461 \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E17\u0E33\u0E44\u0E1B\u0E41\u0E25\u0E49\u0E27",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, cfg.search.map(f => /*#__PURE__*/React.createElement(ClFld, {
    key: f.k,
    label: f.label,
    w: f.w
  }, f.options ? /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: query[f.k] || f.options[0],
    disabled: !staff,
    onChange: e => setQuery(q => ({
      ...q,
      [f.k]: e.target.value
    }))
  }, f.options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o))) : /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    type: f.type || 'text',
    value: query[f.k] || '',
    disabled: !staff,
    placeholder: f.placeholder || '',
    onChange: e => setQuery(q => ({
      ...q,
      [f.k]: e.target.value
    }))
  }))), /*#__PURE__*/React.createElement(ClFld, {
    label: " ",
    w: 130
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn primary sm",
    onClick: search,
    disabled: !staff
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 13
  }), " \u0E04\u0E49\u0E19\u0E2B\u0E32"))), rows && /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 12,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 44
    }
  }), cfg.cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.k,
    className: c.num ? 'num' : '',
    style: {
      minWidth: c.w
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: cfg.cols.length + 1,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: 18
    }
  }, "\u0E44\u0E21\u0E48\u0E1E\u0E1A\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25")), rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id,
    className: r.id === selId ? 'selected' : '',
    onClick: () => {
      setSelId(r.id);
      setResult(null);
    },
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    checked: r.id === selId,
    onChange: () => {
      setSelId(r.id);
      setResult(null);
    }
  })), cfg.cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.k,
    className: (c.num ? 'num ' : '') + (c.mono ? 'mono' : '')
  }, c.pill ? /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + (r[c.k] === 'ยกเลิกแล้ว' ? 'bad' : 'ok')
  }, r[c.k]) : cxCell(r, c))))))))), sel && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u2462 \u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E40\u0E25\u0E37\u0E2D\u0E01",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19",
    w: 140
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: m ? m.code : sel.memberCode,
    mono: true
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: m ? m.name : sel.memberName
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E17\u0E38\u0E19\u0E40\u0E23\u0E37\u0E2D\u0E19\u0E2B\u0E38\u0E49\u0E19",
    w: 160
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: m ? clMoney(m.shares) : '',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2B\u0E19\u0E48\u0E27\u0E22/\u0E2A\u0E31\u0E07\u0E01\u0E31\u0E14",
    grow: true,
    w: 220
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: m ? m.unit : ''
  }))), cfg.detail.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, g.title)), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, g.fields.map(f => /*#__PURE__*/React.createElement(ClFld, {
    key: f.label,
    label: f.label,
    w: f.w || 190
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: f.money ? clMoney(sel[f.k]) : f.mono && f.k.includes('ate') ? window.fmt.date(sel[f.k]) : sel[f.k],
    mono: f.mono,
    num: f.money
  })))))), cfg.sub && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "section-head",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "head-bar"
  }), /*#__PURE__*/React.createElement("h3", null, cfg.sub.title)), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 8,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cfg.sub.cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.k,
    className: c.num ? 'num' : '',
    style: {
      minWidth: c.w
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, (sel.items || []).length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: cfg.sub.cols.length,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: 16
    }
  }, "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E48\u0E2D\u0E22")), (sel.items || []).map((it, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, cfg.sub.cols.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.k,
    className: (c.num ? 'num ' : '') + (c.mono ? 'mono' : '')
  }, cxCell(it, c)))))))))), sel && /*#__PURE__*/React.createElement(ClSec, {
    title: "\u2463 \u0E40\u0E2B\u0E15\u0E38\u0E1C\u0E25\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
    style: {
      marginTop: 12
    },
    hint: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01\u0E08\u0E30\u0E16\u0E39\u0E01\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E43\u0E19 Audit Trail \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E23\u0E2B\u0E31\u0E2A\u0E1E\u0E19\u0E31\u0E01\u0E07\u0E32\u0E19\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
    w: 280,
    required: true
  }, /*#__PURE__*/React.createElement("select", {
    className: "l2-select",
    value: reason,
    onChange: e => setReason(e.target.value)
  }, cfg.reasons.map(o => /*#__PURE__*/React.createElement("option", {
    key: o
  }, o)))), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
    grow: true,
    w: 280
  }, /*#__PURE__*/React.createElement("input", {
    className: "l2-input",
    value: note,
    onChange: e => setNote(e.target.value),
    placeholder: "\u0E23\u0E30\u0E1A\u0E38\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14\u0E1B\u0E23\u0E30\u0E01\u0E2D\u0E1A\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01",
    w: 220
  }, /*#__PURE__*/React.createElement(ClRO, {
    value: staff ? `${staff.code} · ${staff.name}` : ''
  })), /*#__PURE__*/React.createElement(ClFld, {
    label: " ",
    w: 150
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn danger sm",
    onClick: doCancel,
    disabled: sel.status === 'ยกเลิกแล้ว'
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close",
    size: 13
  }), " \u0E22\u0E37\u0E19\u0E22\u0E31\u0E19\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01")))), /*#__PURE__*/React.createElement(ClResult, {
    result: result,
    unit: cfg.unit
  }), history.length > 0 && /*#__PURE__*/React.createElement(ClSec, {
    title: `รายการที่ยกเลิกไปแล้ว (${history.length} ${cfg.unit})`,
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10,
      overflowX: 'auto'
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 56
    }
  }, "\u0E25\u0E33\u0E14\u0E31\u0E1A"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 140
    }
  }, "\u0E40\u0E25\u0E02\u0E17\u0E35\u0E48\u0E01\u0E32\u0E23\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 150
    }
  }, "\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 110
    }
  }, "\u0E17\u0E30\u0E40\u0E1A\u0E35\u0E22\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "\u0E0A\u0E37\u0E48\u0E2D-\u0E0A\u0E37\u0E48\u0E2D\u0E2A\u0E01\u0E38\u0E25"), /*#__PURE__*/React.createElement("th", {
    className: "num",
    style: {
      minWidth: 130
    }
  }, "\u0E08\u0E33\u0E19\u0E27\u0E19\u0E40\u0E07\u0E34\u0E19"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 200
    }
  }, "\u0E2A\u0E32\u0E40\u0E2B\u0E15\u0E38\u0E17\u0E35\u0E48\u0E22\u0E01\u0E40\u0E25\u0E34\u0E01"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 190
    }
  }, "\u0E1C\u0E39\u0E49\u0E17\u0E33\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 120
    }
  }, "\u0E2A\u0E16\u0E32\u0E19\u0E30"))), /*#__PURE__*/React.createElement("tbody", null, history.map((h, i) => /*#__PURE__*/React.createElement("tr", {
    key: h.no
  }, /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, i + 1), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, h.no), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, h.docNo), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, h.memberCode), /*#__PURE__*/React.createElement("td", null, h.memberName), /*#__PURE__*/React.createElement("td", {
    className: "num mono"
  }, clMoney(h.amount)), /*#__PURE__*/React.createElement("td", null, h.reason, h.note ? ` — ${h.note}` : ''), /*#__PURE__*/React.createElement("td", null, h.staff), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pill ok"
  }, h.state)))))))));
}
function CancelMonthlyReceiptPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "monthly-receipt",
    onToast: onToast
  });
}
function CancelShareWithdrawPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "share-withdraw",
    onToast: onToast
  });
}
function CancelResignPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "resign",
    onToast: onToast
  });
}
function CancelLoanContractPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "loan-contract",
    onToast: onToast
  });
}
function CancelReceiptReturnPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "receipt-return",
    onToast: onToast
  });
}
function CancelLoanPayoutPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "loan-payout",
    onToast: onToast
  });
}
function CancelSpecialOrderPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "special-order",
    onToast: onToast
  });
}
function CancelSpecialPayPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(CancelPage, {
    typeKey: "special-pay",
    onToast: onToast
  });
}