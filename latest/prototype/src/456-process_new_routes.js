// ════════════════════════════════════════════════════════════════════
//  Overlay: เส้นทาง (route) ของหน้าจอใหม่ในเมนู "ประมวลผลและจัดเก็บ"
//  ซิงก์มาจากโปรเจ็ค สอ.กสท ระบบประมวลผล — App หลัก (src/431) ยังไม่รู้จัก
//  หน้าจอชุดนี้ จึงดักที่ <main className="main"> แล้วเรนเดอร์ให้แทน
//  (เทคนิคเดียวกับ src/430-SCOPE.js)
// ════════════════════════════════════════════════════════════════════
(function () {
  if (typeof React === 'undefined') return;

  var PAGES = {
    'member-payout': 'MemberPayoutPage',
    'monthly-collect': 'MonthlyCollectPage',
    'monthly-cutoff': 'MonthlyCutoffPage',
    'collect-disk': 'CollectDiskPage',
    'collect-other': 'CollectOtherPage',
    'collect-cutoff-disk': 'CollectCutoffDiskPage',
    'const-keep': 'ConstKeepPage',
    'const-keepitem': 'ConstKeepItemPage',
    'const-prefix': 'ConstPrefixPage',
    'const-member-affil': 'ConstMemberAffilPage',
    'const-position': 'ConstPositionPage',
    'const-apply-type': 'ConstApplyTypePage',
    'const-relation': 'ConstRelationPage',
    'const-resign-reason': 'ConstResignReasonPage',
    'const-member-type': 'ConstMemberTypePage',
    'const-shritem': 'ConstShrItemPage',
    'const-member-status': 'ConstMemberStatusPage',
    'const-status-note': 'ConstStatusNotePage',
    'system-status': 'SystemStatusConfigPage',
    'approval-level': 'ApprovalLevelConfigPage',
    'dividend-estimate': 'DividendEstimatePage',
    'dividend-process': 'DividendProcessRunPage',
    'dividend-key-setup': 'DividendKeySetupPage',
    'cancel-monthly-receipt': 'CancelMonthlyReceiptPage',
    'cancel-share-withdraw': 'CancelShareWithdrawPage',
    'cancel-loan-contract': 'CancelLoanContractPage',
    'cancel-receipt-return': 'CancelReceiptReturnPage',
    'cancel-loan-payout': 'CancelLoanPayoutPage',
    'day-close-run': 'DayCloseRunPage',
    'month-close-run': 'MonthCloseRunPage',
    'year-close-run': 'YearCloseRunPage',
    'balance-confirm': 'BalanceConfirmPage',
    'debt-term': 'DebtTermPage',
    'rate-adjust': 'RateAdjustPage',
    'gift-share': 'GiftSharePage',
    'gift-share-cut': 'GiftShareCutPage',
    'year-close-debt': 'YearCloseDebtPage',
    'year-close-share': 'YearCloseSharePage',
    'meeting-fee': 'MeetingFeePage',
  };

  function currentProcessPage() {
    var m = String(window.location.hash || '').match(/^#process\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function toast(msg, kind) {
    if (typeof window.__erpToast === 'function') window.__erpToast(msg, kind);
  }

  var orig = React.createElement;
  React.createElement = function (type, props) {
    if (type === 'main' && props && props.className === 'main') {
      var page = currentProcessPage();
      var name = page && PAGES[page];
      var Comp = name && window[name];
      if (typeof Comp === 'function') {
        return orig(type, props, arguments[2],
          orig(Comp, { key: 'proc-' + page, onToast: toast }));
      }
    }
    return orig.apply(null, arguments);
  };
})();
