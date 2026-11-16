// ════════════════════════════════════════════════════════════════════
//  ประมวลผลและจัดเก็บ › สินเชื่อ (ชุดที่ 2)
//    · ใบคำขอหยุดเก็บหนี้          (process/collect-stop)
//    · ใบคำขอเปลี่ยนแปลงงวดชำระ    (process/inst-change-req)
//    · กำหนดสังกัดลูกหนี้ตัวแทน     (process/agent-affil)
//  ใช้ helper ร่วมจาก 374 (PcxHead / PcxSec / PcxFld / PcxRO / pcxMoney)
// ════════════════════════════════════════════════════════════════════

const pcxContractDate = d => d && d.startDate || '2022-03-14';

// ════════════════════════════════════════════════════════════════════
//  ① ใบคำขอหยุดเก็บหนี้
// ════════════════════════════════════════════════════════════════════
const PCX_SEND_STATUSES = ['ส่งปกติ', 'งดส่ง', 'งดต้น', 'หยุดเก็บ', 'เรียกเก็บเต็มจำนวน'];
function CollectStopRequestPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [rows, setRows] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [savedAt, setSavedAt] = useState(null);
  const [pcEditing, setPcEditing] = React.useState(false);
  const [error, setError] = useState('');
  const pickMember = m => {
    setMember(m);
    setSavedNo('');
    setSavedAt(null);
    setError('');
    setRows((m.debts || []).map(d => {
      const info = window.ccdContractInfo ? window.ccdContractInfo(d) : {};
      return {
        contractNo: d.contractNo,
        contractDate: info.startDate || pcxContractDate(info),
        outstanding: Number(d.principalRemaining) || 0,
        sendStatus: 'ส่งปกติ',
        changeNo: '',
        by: window.CCD_USER || 'jeerana',
        note: '',
        selected: false
      };
    }));
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const clear = () => {
    setMember(null);
    setRows([]);
    setSavedNo('');
    setSavedAt(null);
    setError('');
  };
  const picked = rows.filter(r => r.selected);
  const totalOutstanding = picked.reduce((s, r) => s + r.outstanding, 0);
  const doSave = () => {
    if (!member) {
      setError('กรุณาระบุเลขสมาชิกก่อนบันทึก');
      return false;
    }
    if (!picked.length) {
      setError('กรุณาเลือกสัญญาที่ต้องการหยุดเก็บหนี้อย่างน้อย 1 สัญญา');
      return false;
    }
    const noNote = picked.find(r => !r.note.trim());
    if (noNote) {
      setError('กรุณาระบุหมายเหตุ/เหตุผลการหยุดเก็บหนี้ของสัญญา ' + noNote.contractNo);
      return false;
    }
    setError('');
    const no = 'CS' + pcxBE().toString().slice(-2) + String(Math.floor(Math.random() * 90000) + 10000);
    setSavedNo(no);
    setSavedAt(window.savedBadgeTs ? window.savedBadgeTs() : new Date().toLocaleString('th-TH'));
    setRows(rs => rs.map(r => r.selected ? {
      ...r,
      sendStatus: 'หยุดเก็บ',
      changeNo: no
    } : r));
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — ใบคำขอหยุดเก็บหนี้',
      target: member.code + ' · ' + member.name,
      summary: no + ' · หยุดเก็บหนี้ ' + picked.length + ' สัญญา · ยอดคงเหลือรวม ' + pcxMoney(totalOutstanding) + ' บาท',
      changes: picked.map(r => ({
        field: r.contractNo,
        before: 'ส่งปกติ',
        after: 'หยุดเก็บ · ' + r.note
      }))
    });
    onToast && onToast('บันทึกใบคำขอหยุดเก็บหนี้ ' + no + ' เรียบร้อยแล้ว');
    return true;
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ใบคำขอหยุดเก็บหนี้",
    className: pcEditing ? undefined : 'pc-locked'
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "receipt",
    title: "ใบคำขอหยุดเก็บหนี้",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 เลือกสัญญาของสมาชิกที่ขอหยุดเรียกเก็บ พร้อมระบุเหตุผล",
    actions: /*#__PURE__*/React.createElement(window.PcEditActions, {
      recordKey: member ? 'cs.' + member.code : '',
      editing: pcEditing,
      setEditing: setPcEditing,
      onSave: doSave,
      onDiscard: () => pickMember(member),
      title: "ใบคำขอหยุดเก็บหนี้"
    })
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), /*#__PURE__*/React.createElement(PcxSec, {
    title: "รายละเอียดสมาชิก"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-grid7"
  }, /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขที่เอกสาร"
  }, pcxDocNo(savedNo)), /*#__PURE__*/React.createElement(PcxG, {
    label: "เลขสมาชิก",
    required: true
  }, window.ErpMemberPicker ? /*#__PURE__*/React.createElement(window.ErpMemberPicker, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    codeOnly: true,
    title: "ค้นหาสมาชิก \u2014 ใบคำขอหยุดเก็บหนี้",
    placeholder: "ค้นหาเลขสมาชิก…"
  }) : /*#__PURE__*/React.createElement(MemberSearchField, {
    member: member,
    onPick: pickMember,
    source: window.DN_MEMBERS,
    title: "ค้นหาสมาชิก \u2014 ใบคำขอหยุดเก็บหนี้"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ชื่อ-ชื่อสกุล",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "สังกัด",
    span: 2
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? [member.deptCode, member.dept].filter(Boolean).join(' \u2014 ') : ''
  })), /*#__PURE__*/React.createElement(PcxG, {
    label: "ทุนเรือนหุ้น"
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? pcxMoney(member.shares) : '',
    num: true,
    mono: true
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "สัญญาเงินกู้ของสมาชิก",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 1080,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 38
    }
  }), /*#__PURE__*/React.createElement("th", null, "เลขที่สัญญา"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120
    }
  }, "วันที่สัญญา"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 150,
      textAlign: 'right'
    }
  }, "ยอดคงเหลือ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "สถานะการส่ง"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140
    }
  }, "เลขที่ขอเปลี่ยน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130
    }
  }, "ผู้ทำรายการ"), /*#__PURE__*/React.createElement("th", {
    style: {
      minWidth: 260,
      width: '30%'
    }
  }, "หมายเหตุ"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.contractNo,
    className: r.selected ? 'selected' : ''
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: r.selected,
    disabled: r.sendStatus === 'หยุดเก็บ',
    onChange: e => updateRow(i, {
      selected: e.target.checked
    })
  })), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.contractNo), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, window.fmt.date(r.contractDate)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(r.outstanding)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input sm",
    value: r.sendStatus,
    onChange: e => updateRow(i, {
      sendStatus: e.target.value
    })
  }, PCX_SEND_STATUSES.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.changeNo || '—'), /*#__PURE__*/React.createElement("td", null, r.by), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    style: {
      width: '100%',
      maxWidth: 'none'
    },
    value: r.note,
    onChange: e => updateRow(i, {
      note: e.target.value
    }),
    placeholder: "เหตุผลการหยุดเก็บหนี้"
  })))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 8,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสมาชิกเพื่อแสดงสัญญาเงินกู้"))), !!picked.length && /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 3,
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, "เลือก ", picked.length, " สัญญา \xB7 ยอดคงเหลือรวม"), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right',
      fontWeight: 600
    }
  }, pcxMoney(totalOutstanding)), /*#__PURE__*/React.createElement("td", {
    colSpan: 4
  }))))))));
}

// ════════════════════════════════════════════════════════════════════
//  ② ใบคำขอเปลี่ยนแปลงงวดชำระ
// ════════════════════════════════════════════════════════════════════
const PCX_DEBT_STATUS = ['ปกติ', 'ค้างชำระ', 'ผิดนัดชำระ', 'ประนอมหนี้', 'ดำเนินคดี'];
const PCX_PAY_MODES = ['ต้นเท่ากัน', 'คงยอด', 'คงต้น', 'ตามงวด'];
const PCX_RESTRUCT = ['—', 'ปรับโครงสร้างครั้งที่ 1', 'ปรับโครงสร้างครั้งที่ 2', 'ประนอมหนี้'];
const PCX_REQ_STATUS = ['รออนุมัติ', 'อนุมัติ', 'ไม่อนุมัติ'];
function InstallmentChangeRequestPage({
  onToast
}) {
  const {
    useState
  } = React;
  const audit = pcxAudit();
  const today = pcxToday();
  const [member, setMember] = useState(null);
  const [contractNo, setContractNo] = useState('');
  const [reqDate, setReqDate] = useState(today);
  const [updDate, setUpdDate] = useState(today);
  const [debtStatus, setDebtStatus] = useState('ปกติ');
  const [restruct, setRestruct] = useState('—');
  const [payMode, setPayMode] = useState('ต้นเท่ากัน');
  const [addPrincipalYear, setAddPrincipalYear] = useState('');
  const [fromMonth, setFromMonth] = useState('');
  const [rate, setRate] = useState('');
  const [terms, setTerms] = useState('');
  const [arrearsPerTerm, setArrearsPerTerm] = useState('');
  const [committeeNo, setCommitteeNo] = useState('');
  const [perTerm, setPerTerm] = useState('');
  const [status, setStatus] = useState('รออนุมัติ');
  const [meetingDate, setMeetingDate] = useState('');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [savedNo, setSavedNo] = useState('');
  const [error, setError] = useState('');
  const [editDoc, setEditDoc] = useState('');
  const [returnInfo, setReturnInfo] = useState(null);
  const loadReturned = () => (window.pcxIcLoad ? window.pcxIcLoad() : []).filter(r => r.returned);
  const [returnedList, setReturnedList] = useState(loadReturned);
  const contract = member ? (member.debts || []).find(d => d.contractNo === contractNo) : null;
  const info = contract && window.ccdContractInfo ? window.ccdContractInfo(contract) : null;
  const loaded = !!contract;
  const load = (m, debt) => {
    const i = window.ccdContractInfo ? window.ccdContractInfo(debt) : {};
    setMember(m);
    setContractNo(debt.contractNo);
    setSavedNo('');
    setError('');
    setNote('');
    setEditDoc('');
    setReturnInfo(null);
    setDebtStatus(debt.status === 'ปกติ' ? 'ปกติ' : debt.status || 'ปกติ');
    setRestruct('—');
    setPayMode('ต้นเท่ากัน');
    setTerms(String((i.totalTerms || 0) - (i.paidTerms || 0)));
    setPerTerm(String(debt.installment || ''));
    setArrearsPerTerm('');
    setAddPrincipalYear('');
    setFromMonth('');
    setRate('');
    setCommitteeNo('');
    setMeetingDate('');
    setStatus('รออนุมัติ');
    setHistory([{
      doc: 'CL' + pcxBE() + '000112',
      mode: 'คงยอด',
      perTerm: debt.installment || 0,
      status: 'อนุมัติ',
      arrears: 0,
      addPay: 0,
      addYear: 0,
      note: 'รายการก่อนหน้า'
    }]);
  };
  // เปิดใบคำขอที่ถูกส่งกลับมาแก้ไข (ข้อมูลจากที่เก็บเดียวกับหน้าอนุมัติ)
  const openReturned = r => {
    const m = (window.DN_MEMBERS || []).find(x => x.code === r.reg);
    const debt = m && (m.debts || []).find(d => d.contractNo === r.contract);
    if (!debt) {
      setError('ไม่พบทะเบียน ' + r.reg + ' / สัญญา ' + r.contract + ' ในข้อมูลสมาชิก จึงเปิดแก้ไขไม่ได้');
      return;
    }
    load(m, debt);
    const fm = r.form || {};
    setPayMode(fm.payMode || r.nm || 'ต้นเท่ากัน');
    setPerTerm(String(fm.perTerm != null ? fm.perTerm : r.np || ''));
    if (fm.terms != null) setTerms(String(fm.terms));
    if (fm.debtStatus) setDebtStatus(fm.debtStatus);
    if (fm.restruct) setRestruct(fm.restruct);
    setAddPrincipalYear(fm.addPrincipalYear || '');
    setFromMonth(fm.fromMonth || '');
    setRate(fm.rate || '');
    setArrearsPerTerm(fm.arrearsPerTerm || '');
    setCommitteeNo(fm.committeeNo || '');
    setMeetingDate(fm.meetingDate || '');
    setNote(fm.note || '');
    if (r.date) setReqDate(r.date);
    setStatus('รออนุมัติ');
    setEditDoc(r.doc);
    setSavedNo(r.doc);
    setReturnInfo(r);
  };
  const clear = () => {
    setEditDoc('');
    setReturnInfo(null);
    setMember(null);
    setContractNo('');
    setSavedNo('');
    setError('');
    setHistory([]);
    setNote('');
    setPerTerm('');
    setTerms('');
    setStatus('รออนุมัติ');
  };
  const doSave = () => {
    if (!loaded) {
      setError('กรุณาเลือกเลขทะเบียน / เลขที่สัญญาก่อนบันทึก');
      return;
    }
    if (!perTerm || Number(perTerm) <= 0) {
      setError('กรุณาระบุยอดชำระ/งวด');
      return;
    }
    if (!terms || Number(terms) <= 0) {
      setError('กรุณาระบุจำนวนงวดชำระ');
      return;
    }
    setError('');
    const no = editDoc || 'IC' + pcxBE().toString().slice(-2) + String(Math.floor(Math.random() * 90000) + 10000);
    setSavedNo(no);
    if (window.pcxIcLoad && window.pcxIcSave) {
      const rec = {
        doc: no,
        contract: contractNo,
        reg: member.code,
        date: reqDate,
        om: '—',
        op: Number(contract.installment) || 0,
        os: '—',
        nm: payMode,
        np: Number(perTerm) || 0,
        ns: '—',
        by: window.CCD_USER || 'jeerana',
        status,
        decision: status === 'อนุมัติ' ? 'yes' : status === 'ไม่อนุมัติ' ? 'no' : 'wait',
        disposition: '',
        reason: '',
        decidedBy: '',
        decidedAt: '',
        returned: false,
        returnReason: '',
        form: {
          debtStatus,
          restruct,
          payMode,
          addPrincipalYear,
          fromMonth,
          rate,
          terms,
          arrearsPerTerm,
          committeeNo,
          perTerm,
          meetingDate,
          note,
          updDate
        }
      };
      const list = window.pcxIcLoad();
      const idx = list.findIndex(x => x.doc === no);
      window.pcxIcSave(idx >= 0 ? list.map((x, i) => i === idx ? {
        ...x,
        ...rec
      } : x) : [rec, ...list]);
      setReturnedList(loadReturned());
    }
    setEditDoc('');
    setReturnInfo(null);
    setHistory(h => [{
      doc: no,
      mode: payMode,
      perTerm: Number(perTerm) || 0,
      status,
      arrears: Number(arrearsPerTerm) || 0,
      addPay: 0,
      addYear: Number(addPrincipalYear) || 0,
      note
    }, ...h]);
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — ใบคำขอเปลี่ยนแปลงงวดชำระ',
      target: member.code + ' · ' + member.name + ' · ' + contractNo,
      summary: no + ' · ' + payMode + ' ' + pcxMoney(perTerm) + ' บาท/งวด · ' + terms + ' งวด · ' + status,
      changes: [{
        field: 'รูปแบบการชำระ',
        before: '—',
        after: payMode
      }, {
        field: 'ชำระ/งวด',
        before: pcxMoney(contract.installment),
        after: pcxMoney(perTerm)
      }, {
        field: 'งวดชำระ',
        before: String((info.totalTerms || 0) - (info.paidTerms || 0)),
        after: terms
      }, {
        field: 'สถานะหนี้',
        before: contract.status || '—',
        after: debtStatus
      }, ...(restruct !== '—' ? [{
        field: 'ปรับโครงสร้าง',
        before: '—',
        after: restruct
      }] : []), ...(note ? [{
        field: 'หมายเหตุ',
        before: '—',
        after: note
      }] : [])]
    });
    onToast && onToast('บันทึกใบคำขอเปลี่ยนแปลงงวดชำระ ' + no + ' เรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement("div", {
    "data-screen-label": "ใบคำขอเปลี่ยนแปลงงวดชำระ"
  }, /*#__PURE__*/React.createElement(PcxHead, {
    icon: "edit",
    title: "ใบคำขอเปลี่ยนแปลงงวดชำระ",
    subtitle: "ประมวลผลและจัดเก็บ \xB7 สินเชื่อ \u2014 บันทึกคำขอเปลี่ยนแปลงรูปแบบ/ยอด/จำนวนงวดชำระของสัญญาเงินกู้",
    actions: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "btn primary sm",
      onClick: doSave
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 13
    }), " บันทึก"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: clear
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "refresh",
      size: 13
    }), " ล้างข้อมูล"), /*#__PURE__*/React.createElement("button", {
      className: "btn sm",
      onClick: () => {
        onToast && onToast('กำลังเตรียมพิมพ์ใบคำขอเปลี่ยนแปลงงวดชำระ…');
        setTimeout(() => window.print(), 80);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "print",
      size: 13
    }), " พิมพ์เอกสาร"))
  }), error && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", error), returnInfo && /*#__PURE__*/React.createElement("div", {
    className: "dn-status-alert warn",
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, "กำลังแก้ไขใบคำขอ ", /*#__PURE__*/React.createElement("b", {
    className: "mono"
  }, returnInfo.doc), " ที่ถูกส่งกลับ \xB7 เหตุผลที่ส่งกลับ: ", returnInfo.returnReason || '—', returnInfo.decidedBy ? ' (' + returnInfo.decidedBy + ' · ' + returnInfo.decidedAt + ')' : '')), !returnInfo && returnedList.length > 0 && /*#__PURE__*/React.createElement(PcxSec, {
    title: 'ใบคำขอที่ถูกส่งกลับให้แก้ไข (' + returnedList.length + ')',
    style: {
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 820,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", null, "สัญญา"), /*#__PURE__*/React.createElement("th", null, "ทะเบียน"), /*#__PURE__*/React.createElement("th", null, "เหตุผลที่ส่งกลับ"), /*#__PURE__*/React.createElement("th", null, "ผู้พิจารณา"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, returnedList.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.doc
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.doc), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.contract), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.reg), /*#__PURE__*/React.createElement("td", null, r.returnReason || '—'), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, r.decidedBy, r.decidedAt ? ' · ' + r.decidedAt : ''), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: () => openReturned(r)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "edit",
    size: 12
  }), " เปิดแก้ไข"))))))))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "ข้อมูลคำขอ"
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(PcxFld, {
    label: "เลขที่เปลี่ยนแปลง",
    w: 150
  }, (savedNo ? /*#__PURE__*/React.createElement(PcxRO, {
    value: savedNo,
    mono: true
  }) : /*#__PURE__*/React.createElement("div", {
    className: "icr-ro icr-auto"
  }, "AUTO"))), /*#__PURE__*/React.createElement(PcxFld, {
    label: "วันที่ขอเปลี่ยนแปลง",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: reqDate,
    onChange: e => setReqDate(e.target.value)
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ผู้ป้อน",
    w: 160
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: window.CCD_USER || 'jeerana'
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "เลขทะเบียน / เลขที่สัญญา",
    grow: true,
    w: 280,
    required: true
  }, /*#__PURE__*/React.createElement(ContractSearchField, {
    contract: contractNo,
    member: member,
    source: window.DN_MEMBERS,
    onPick: ({
      member: m,
      debt
    }) => load(m, debt),
    title: "ค้นหาสัญญาเงินกู้ \u2014 ใบคำขอเปลี่ยนแปลงงวดชำระ",
    placeholder: "ค้นหาด้วยเลขที่สัญญา หรือเลขทะเบียน\u2026"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "วันที่ปรับปรุง",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    value: updDate,
    onChange: e => setUpdDate(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(PcxFld, {
    label: "ชื่อ-ชื่อสกุล",
    grow: true,
    w: 200
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: member ? member.name : '',
    placeholder: "(เลือกสมาชิก)"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ประเภทเงินกู้",
    w: 160
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: contract ? contract.type : ''
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "งวดชำระล่าสุด",
    w: 130
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: info ? info.lastPaidTerm : '',
    mono: true
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ยอดอนุมัติ",
    w: 150
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: info ? pcxMoney(info.approvedAmount) : '',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ยอดรอเบิก",
    w: 140
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: info ? pcxMoney(info.pendingDisburse) : '',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ยอดคงเหลือ",
    w: 150
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: info ? pcxMoney(info.outstanding) : '',
    num: true,
    mono: true
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ดอกเบี้ยค้าง",
    w: 140
  }, /*#__PURE__*/React.createElement(PcxRO, {
    value: info ? pcxMoney(info.interestArrears) : '',
    num: true,
    mono: true,
    danger: !!info && info.interestArrears > 0
  })))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "รายละเอียดสัญญา",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "icr-strip"
  }, /*#__PURE__*/React.createElement(PcxFld, {
    label: "สถานะหนี้",
    w: 170
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: debtStatus,
    disabled: !loaded,
    onChange: e => setDebtStatus(e.target.value)
  }, PCX_DEBT_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ปรับโครงสร้าง",
    w: 210
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: restruct,
    disabled: !loaded,
    onChange: e => setRestruct(e.target.value)
  }, PCX_RESTRUCT.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ชำระแบบ",
    w: 160
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: payMode,
    disabled: !loaded,
    onChange: e => setPayMode(e.target.value)
  }, PCX_PAY_MODES.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement(PcxFld, {
    label: "เพิ่มต้นปีละ",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    disabled: !loaded,
    value: addPrincipalYear,
    onChange: e => setAddPrincipalYear(e.target.value),
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ตั้งแต่เดือน",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "month",
    disabled: !loaded,
    value: fromMonth,
    onChange: e => setFromMonth(e.target.value)
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ดอกเบี้ย (%)",
    w: 130
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    disabled: !loaded,
    value: rate,
    onChange: e => setRate(e.target.value),
    placeholder: "0.00"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-strip",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(PcxFld, {
    label: "งวดชำระ",
    w: 130,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    style: {
      textAlign: 'right'
    },
    disabled: !loaded,
    value: terms,
    onChange: e => {
      setTerms(e.target.value);
      setError('');
    },
    placeholder: "0"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ด/บ ค้าง/งวด",
    w: 150
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    disabled: !loaded,
    value: arrearsPerTerm,
    onChange: e => setArrearsPerTerm(e.target.value),
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "อช. ครั้งที่",
    w: 130
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    disabled: !loaded,
    value: committeeNo,
    onChange: e => setCommitteeNo(e.target.value),
    placeholder: "เช่น 3/2569"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "ชำระ/งวด",
    w: 150,
    required: true
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "number",
    step: "0.01",
    style: {
      textAlign: 'right'
    },
    disabled: !loaded,
    value: perTerm,
    onChange: e => {
      setPerTerm(e.target.value);
      setError('');
    },
    placeholder: "0.00"
  })), /*#__PURE__*/React.createElement(PcxFld, {
    label: "สถานะ",
    w: 150
  }, /*#__PURE__*/React.createElement("select", {
    className: "cfg-input",
    value: status,
    disabled: !loaded,
    onChange: e => setStatus(e.target.value)
  }, PCX_REQ_STATUS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, s)))), /*#__PURE__*/React.createElement(PcxFld, {
    label: "วันที่ประชุม",
    w: 160
  }, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input",
    type: "date",
    disabled: !loaded,
    value: meetingDate,
    onChange: e => setMeetingDate(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "icr-note-wrap",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "cfg-input",
    rows: 3,
    value: note,
    maxLength: 500,
    disabled: !loaded,
    onChange: e => setNote(e.target.value),
    placeholder: "หมายเหตุ \u2014 เหตุผลการขอเปลี่ยนแปลงงวดชำระ"
  }), /*#__PURE__*/React.createElement("span", {
    className: "icr-note-count"
  }, note.length, "/500"))), /*#__PURE__*/React.createElement(PcxSec, {
    title: "รายละเอียดประวัติ",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 940,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "เลขที่เอกสาร"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "รูปแบบ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130,
      textAlign: 'right'
    }
  }, "ชำระ/งวด"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 110
    }
  }, "สถานะ"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 130,
      textAlign: 'right'
    }
  }, "ด/บ ค้าง/งวด"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 140,
      textAlign: 'right'
    }
  }, "เพิ่มต้นเงินปีละ"), /*#__PURE__*/React.createElement("th", null, "หมายเหตุ"))), /*#__PURE__*/React.createElement("tbody", null, history.map((h, i) => /*#__PURE__*/React.createElement("tr", {
    key: h.doc + i
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, h.doc), /*#__PURE__*/React.createElement("td", null, h.mode), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(h.perTerm)), /*#__PURE__*/React.createElement("td", null, h.status), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(h.arrears)), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: 'right'
    }
  }, pcxMoney(h.addYear)), /*#__PURE__*/React.createElement("td", {
    className: "muted"
  }, h.note || '—'))), !history.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 7,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '26px 0'
    }
  }, "เลือกสัญญาเพื่อแสดงประวัติการเปลี่ยนแปลงงวดชำระ"))))))));
}

// ════════════════════════════════════════════════════════════════════
//  ③ กำหนดสังกัดลูกหนี้ตัวแทน
// ════════════════════════════════════════════════════════════════════
const PCX_AA_KEY = 'process_agent_affiliation';
const PCX_AA_SEED = [{
  code: '10160',
  name: 'กสท. สำนักงานใหญ่',
  contact: 'วรรณา ศรีสุข',
  address: '99 ถ.แจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210'
}, {
  code: '10240',
  name: 'กสท. เขตภาคกลาง',
  contact: 'ประสิทธิ์ ทองใบ',
  address: '210 ถ.พหลโยธิน อ.เมือง จ.พระนครศรีอยุธยา 13000'
}, {
  code: '20110',
  name: 'กสท. เขตภาคเหนือ',
  contact: 'สุนีย์ วงศ์คำ',
  address: '45 ถ.ห้วยแก้ว อ.เมือง จ.เชียงใหม่ 50200'
}, {
  code: '30140',
  name: 'กสท. เขตภาคอีสาน',
  contact: 'ธนากร แสงทอง',
  address: '77 ถ.มิตรภาพ อ.เมือง จ.ขอนแก่น 40000'
}, {
  code: '40130',
  name: 'กสท. เขตภาคใต้',
  contact: 'อารีย์ บุญมาก',
  address: '12 ถ.กาญจนวนิช อ.หาดใหญ่ จ.สงขลา 90110'
}];
const pcxAaLoad = () => {
  try {
    const s2 = localStorage.getItem(PCX_AA_KEY + '_v2');
    if (s2) return JSON.parse(s2);
    const s = localStorage.getItem(PCX_AA_KEY);
    if (s) return JSON.parse(s);
  } catch (e) {}
  return PCX_AA_SEED.map(r => ({
    ...r
  }));
};
const pcxAaSave = list => {
  try {
    localStorage.setItem(PCX_AA_KEY, JSON.stringify(list));
  } catch (e) {}
};
function PcxAaImportModal({
  onClose,
  onConfirm
}) {
  const {
    useState
  } = React;
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const readFile = file => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result || '').split(/\r?\n/).filter(l => l.trim());
      const parsed = lines.map(l => {
        const p = l.split(/[\t|,]/).map(x => x.trim());
        return {
          code: p[0] || '',
          name: p[1] || '',
          contact: p[2] || '',
          address: p[3] || ''
        };
      }).filter(r => r.code || r.name);
      setRows(parsed);
      setErr(parsed.length ? '' : 'ไม่พบข้อมูลในไฟล์ — รูปแบบ: รหัสหน่วยงาน|ชื่อหน่วยงาน|ชื่อผู้ติดต่อ|ที่อยู่');
    };
    reader.readAsText(file, 'utf-8');
  };
  const updateRow = (i, patch) => setRows(rs => rs.map((r, idx) => idx === i ? {
    ...r,
    ...patch
  } : r));
  const removeRow = i => setRows(rs => rs.filter((_, idx) => idx !== i));
  const addRow = () => setRows(rs => [...rs, {
    code: '',
    name: '',
    contact: '',
    address: ''
  }]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("div", {
    className: "modal-card",
    style: {
      width: 860,
      maxWidth: '96vw'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gc-modal-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("h2", null, "นำเข้าข้อมูลสังกัดลูกหนี้ตัวแทน"), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 1
    }
  }, "ไฟล์ .txt \u2014 รหัสหน่วยงาน | ชื่อหน่วยงาน | ชื่อผู้ติดต่อ | ที่อยู่")), /*#__PURE__*/React.createElement("button", {
    className: "close-btn",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "close"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "file",
    accept: ".txt,.csv",
    onChange: e => readFile(e.target.files && e.target.files[0])
  }), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, fileName || 'ไม่มีไฟล์ที่ถูกเลือก'), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: addRow
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 12
  }), " เพิ่มแถว")), err && /*#__PURE__*/React.createElement("div", {
    className: "sr-error",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14
  }), " ", err), /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-scroll",
    style: {
      maxHeight: 320
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl",
    style: {
      minWidth: 720,
      fontSize: 12.5
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 120
    }
  }, "รหัสหน่วยงาน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 190
    }
  }, "ชื่อหน่วยงาน"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 170
    }
  }, "ชื่อผู้ติดต่อ"), /*#__PURE__*/React.createElement("th", null, "ที่อยู่"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: 46
    }
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm mono",
    value: r.code,
    onChange: e => updateRow(i, {
      code: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.name,
    onChange: e => updateRow(i, {
      name: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.contact,
    onChange: e => updateRow(i, {
      contact: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    className: "cfg-input sm",
    value: r.address,
    onChange: e => updateRow(i, {
      address: e.target.value
    })
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "act-del",
    title: "ลบ",
    "aria-label": "ลบ",
    onClick: () => removeRow(i)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "trash",
    size: 13
  }))))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5,
    className: "muted",
    style: {
      textAlign: 'center',
      padding: '22px 0'
    }
  }, "เลือกไฟล์ .txt แล้วกด แสดงข้อมูล"))))))), /*#__PURE__*/React.createElement("div", {
    className: "dba-drawer-foot",
    style: {
      position: 'static'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "ปิด"), /*#__PURE__*/React.createElement("button", {
    className: "btn primary",
    disabled: !rows.length,
    onClick: () => onConfirm(rows.filter(r => r.code && r.name))
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13
  }), " บันทึก ", rows.length, " รายการ"))));
}
// ─── กำหนดสังกัดลูกหนี้ตัวแทน — รูปแบบเดียวกับเมนูค่าคงที่อื่น ────────
function PcxAaHeadExtra({
  list,
  persist,
  onToast
}) {
  const [open, setOpen] = React.useState(false);
  const audit = pcxAudit();
  const doExport = () => {
    const text = list.map(r => [r.code, r.name, r.contact || '', r.address || ''].join('|')).join('\n');
    const blob = new Blob([text], {
      type: 'text/plain;charset=utf-8'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'agent_affiliation.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    onToast && onToast('ส่งออกข้อมูล ' + list.length + ' รายการเรียบร้อยแล้ว');
  };
  const doImport = recs => {
    const map = new Map(list.map(r => [r.code, r]));
    recs.forEach(r => map.set(r.code, {
      ...(map.get(r.code) || {
        id: 'AA-' + r.code + '-' + Date.now(),
        enabled: true
      }),
      ...r
    }));
    persist([...map.values()]);
    setOpen(false);
    audit && audit.log && audit.log({
      action: 'create',
      module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
      target: recs.length + ' รายการ',
      summary: 'นำเข้าข้อมูลสังกัดลูกหนี้ตัวแทน ' + recs.length + ' รายการ'
    });
    onToast && onToast('นำเข้าข้อมูล ' + recs.length + ' รายการเรียบร้อยแล้ว');
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: () => setOpen(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload",
    size: 13
  }), " นำเข้า"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn",
    onClick: doExport
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 13
  }), " ส่งออก"), open && /*#__PURE__*/React.createElement(PcxAaImportModal, {
    onClose: () => setOpen(false),
    onConfirm: doImport
  }));
}
const PCX_AA_CFG = {
  key: PCX_AA_KEY + '_v2',
  idPrefix: 'AA-',
  module: 'ประมวลผลและจัดเก็บ — กำหนดสังกัดลูกหนี้ตัวแทน',
  screen: 'กำหนดสังกัดลูกหนี้ตัวแทน',
  title: 'กำหนดสังกัดลูกหนี้ตัวแทน',
  entity: 'สังกัดลูกหนี้ตัวแทน',
  subtitle: 'กำหนดรหัสและชื่อหน่วยงานของลูกหนี้ตัวแทน ใช้เป็นตัวเลือกลูกหนี้ตัวแทนในข้อกำหนดรายละเอียดสังกัด',
  codeLabel: 'รหัสหน่วยงาน',
  nameLabel: 'ชื่อหน่วยงาน',
  codePh: 'เช่น 10160',
  namePh: 'เช่น กสท. สำนักงานใหญ่',
  codeMax: 10,
  formHint: 'ลูกหนี้ตัวแทนสำหรับการเรียกเก็บผ่านหน่วยงาน',
  searchPh: 'ค้นหารหัสหน่วยงาน, ชื่อหน่วยงาน...',
  searchKeys: ['code', 'name'],
  noNote: true,
  footnote: 'เฉพาะสังกัดลูกหนี้ตัวแทนที่ “เปิดใช้งาน” จะแสดงเป็นตัวเลือกในข้อกำหนดรายละเอียดสังกัด · ปิดใช้งานแล้วข้อมูลเดิมยังคงอยู่',
  usageLabel: 'รายการในข้อกำหนดรายละเอียดสังกัด',
  usage: rec => window.pcAffilRefs ? window.pcAffilRefs(r => r.agent === rec.code).map(r => r.code + ' — ' + r.name) : [],
  HeadExtra: PcxAaHeadExtra,
  seed: () => pcxAaLoad().map((r, i) => ({
    ...r,
    id: r.id || 'AA-' + (r.code || i),
    enabled: r.enabled !== false,
    updatedBy: r.updatedBy || 'มนตรี ศรีสุข',
    updatedAt: r.updatedAt || '2026-06-01 09:00'
  }))
};
function AgentAffiliationConfigPage({
  onToast
}) {
  return /*#__PURE__*/React.createElement(window.PcCodeNameConstPage, {
    cfg: PCX_AA_CFG,
    onToast: onToast
  });
}
Object.assign(window, {
  CollectStopRequestPage,
  InstallmentChangeRequestPage,
  AgentAffiliationConfigPage
});