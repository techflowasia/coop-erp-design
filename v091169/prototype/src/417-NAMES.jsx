// ═════════════════════════════════════════════════════════════════
//  ค่าคงที่ (สินเชื่อ) — เปลี่ยน toast ของการเพิ่ม/แก้ไข/ลบ เป็น StatusModal
//  งานเล็ก ๆ (ค้นหา, คัดลอก, ขยายแถว ฯลฯ) ยังใช้ toast เดิม
// ═════════════════════════════════════════════════════════════════

(function () {
  const NAMES = [
    'LoanTypeConfigPage', 'LoanGroupConfigPage', 'GuarantorCountConfigPage',
    'GuaranteeLimitConfigPage', 'LoanTermsConfigPage', 'InterestRateConfigPage',
    'InsuranceCompanyConfigPage', 'SalaryRemainConfigPage',
  ];
  // ข้อความที่ถือว่าเป็นการเพิ่ม/แก้ไข/ลบ
  // เปิด/ปิดใช้งาน จัดการโดย 398 (ToggleConfirmModal) แล้ว — ไม่ต้องขึ้นซ้ำที่นี่
  const BIG = /(เพิ่ม|บันทึก|แก้ไข|ลบ|นำออก|สร้าง)/;
  const TITLES = [
    [/^เพิ่ม|ถูกเพิ่ม/, 'เพิ่มข้อมูลเรียบร้อยแล้ว'],
    [/ลบ|นำออก/, 'ลบข้อมูลเรียบร้อยแล้ว'],
    [/แก้ไข/, 'บันทึกการแก้ไขเรียบร้อยแล้ว'],
  ];
  const titleOf = (msg) => {
    for (const [re, t] of TITLES) if (re.test(msg)) return t;
    return 'บันทึกข้อมูลเรียบร้อยแล้ว';
  };

  const wrap = (name) => {
    const Orig = window[name];
    if (!Orig || Orig.__stModalPatched) return;

    function Patched(props) {
      const [done, setDone] = React.useState(null);
      const onToast = React.useCallback((msg, ...rest) => {
        const text = String(msg || '');
        if (BIG.test(text)) {
          setDone({ title: titleOf(text), detail: text });
          return;
        }
        if (props.onToast) props.onToast(msg, ...rest);
      }, [props.onToast]);

      return (
        <>
          {React.createElement(Orig, { ...props, onToast })}
          {done && window.StatusModal && (
            <window.StatusModal variant="success" title={done.title} detail={done.detail}
                                onClose={() => setDone(null)} />
          )}
        </>
      );
    }
    Patched.__stModalPatched = true;
    window[name] = Patched;
  };

  NAMES.forEach(wrap);
})();
