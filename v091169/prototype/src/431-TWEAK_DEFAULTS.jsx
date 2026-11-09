// Main App — routes between search page and member detail

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "density": "compact",
  "headerVariant": "card",
  "primary": "#237450",
  "rowZebra": false,
  "sidebarCollapsed": false,
  "fontFamily": "Sarabun"
}/*EDITMODE-END*/;

// ─── Simple hash router: "" or "#search" = list; "#member/<code>" = detail
function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const fn = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return [route, (r) => { window.location.hash = serializeHash(r); }];
}
function parseHash(h) {
  if (!h || h === '#' || h === '#search') return { view: 'search' };
  if (h === '#member-new') return { view: 'member-new' };
  const m = h.match(/^#member\/(.+)$/);
  if (m) return { view: 'member', code: decodeURIComponent(m[1]) };
  const s = h.match(/^#system\/(.+)$/);
  if (s) return { view: 'system', page: s[1] };
  const d = h.match(/^#deposit\/(.+)$/);
  if (d) return { view: 'deposit', page: d[1] };
  const l = h.match(/^#loan\/(.+)$/);
  if (l) return { view: 'loan', page: l[1] };
  const cl = h.match(/^#claims\/(.+)$/);
  if (cl) return { view: 'claims', page: cl[1] };
  const p = h.match(/^#process\/(.+)$/);
  if (p) return { view: 'process', page: p[1] };
  const iv = h.match(/^#invest\/(.+)$/);
  if (iv) return { view: 'invest', page: iv[1] };
  const dt = h.match(/^#debt\/(.+)$/);
  if (dt) return { view: 'debt', page: dt[1] };
  const fn = h.match(/^#finance\/(.+)$/);
  if (fn) return { view: 'finance', page: fn[1] };
  const w = h.match(/^#welfare\/(.+)$/);
  if (w) return { view: 'welfare', page: w[1] };
  const a = h.match(/^#account\/(.+)$/);
  if (a) return { view: 'account', page: a[1] };
  const ag = h.match(/^#agent\/(.+)$/);
  if (ag) return { view: 'agent', page: ag[1] };
  return { view: 'search' };
}
function serializeHash(r) {
  if (r.view === 'member-new') return '#member-new';
  if (r.view === 'member') return '#member/' + encodeURIComponent(r.code);
  if (r.view === 'system') return '#system/' + r.page;
  if (r.view === 'deposit') return '#deposit/' + r.page;
  if (r.view === 'loan') return '#loan/' + r.page;
  if (r.view === 'claims') return '#claims/' + r.page;
  if (r.view === 'process') return '#process/' + r.page;
  if (r.view === 'invest') return '#invest/' + r.page;
  if (r.view === 'debt') return '#debt/' + r.page;
  if (r.view === 'finance') return '#finance/' + r.page;
  if (r.view === 'welfare') return '#welfare/' + r.page;
  if (r.view === 'account') return '#account/' + r.page;
  if (r.view === 'agent') return '#agent/' + r.page;
  return '#search';
}

// ─── Audit context: any component can log an event ──────────────────
const AuditContext = React.createContext({ log: () => {} });
window.AuditContext = AuditContext;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, goRoute] = useHashRoute();
  const [tab, setTab]   = useState("info");
  const [sub, setSub]   = useState("details");
  const [data, setData] = useState(window.MEMBER_DATA);
  const [members, setMembers] = useState(window.MEMBERS_LIST);
  const [audit, setAudit] = useState(window.AUDIT_SEED);
  const [toast, setToast] = useState(null);

  // ─── Breadcrumb trail (Design System) ──────────────────────────────
  //  หน้าที่มีหน้าย่อยภายใน (เช่น list → create) เรียก useBreadcrumb เพื่อตั้ง
  //  trail ของตน — ผูกกับ routeKey กันค้างข้ามหน้า (หน้าใหม่ที่ไม่ตั้ง = ใช้ค่าปริยาย)
  const [crumbState, setCrumbState] = useState(null);
  const curKey = serializeHash(route);
  const curKeyRef = React.useRef(curKey);
  curKeyRef.current = curKey;
  const bcValue = React.useMemo(() => ({
    setTrail: (trail) => setCrumbState({ key: curKeyRef.current, trail }),
  }), []);
  const crumbItems = (crumbState && crumbState.key === curKey)
    ? (crumbState.trail && crumbState.trail.noHome
        ? [...crumbState.trail]
        : [breadcrumbHome(goRoute), ...crumbState.trail])
    : buildBreadcrumb(route, goRoute);

  // เพิ่มรายการลง audit log (id ใหม่ + เวลาปัจจุบัน + ผู้ใช้ที่ล็อกอิน)
  const logAudit = React.useCallback((entry) => {
    setAudit(prev => {
      const nextNum = prev.reduce((mx, e) => Math.max(mx, parseInt(String(e.id).replace(/\D/g, ''), 10) || 0), 100000) + 1;
      const full = {
        id: 'A-' + nextNum,
        ts: new Date().toISOString().slice(0, 19),
        user: 'จันทร์เพ็ญ มาลี', role: 'เจ้าหน้าที่ทะเบียน', ip: '10.21.4.18',
        changes: [], ...entry,
      };
      return [full, ...prev];
    });
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3200); };

  // บันทึกสมาชิกใหม่: เพิ่มเข้า list + log + แจ้งเตือน + กลับหน้าค้นหา
  const handleSaveNewMember = (rec) => {
    const listRow = {
      code: rec.code, name: rec.name, dept: rec.workDepartment || '—', deptCode: '—',
      citizenId: rec.citizenId, type: rec.memberType || 'สมาชิกถาวร',
      status: rec.workStatus === 'พนักงานปกติ' ? 'ปฏิบัติงาน' : rec.workStatus,
      joinDate: rec.joinDate, shares: 0, loans: 0, loanCount: 0, monthly: 0, paymentStatus: 'ปกติ',
      _full: rec,
    };
    setMembers(prev => [listRow, ...prev]);
    logAudit({
      action: 'create', module: 'ทะเบียนสมาชิก',
      target: `${rec.code} · ${rec.name}`, summary: 'เพิ่มสมาชิกใหม่เข้าระบบ',
      changes: [
        { field: 'เลขทะเบียนสมาชิก', before: '—', after: rec.code },
        { field: 'ชื่อ-สกุล', before: '—', after: rec.name },
        { field: 'เลขบัตรประชาชน', before: '—', after: rec.citizenId },
        ...(rec.spouseDisplay ? [{ field: 'คู่สมรส', before: '—', after: rec.spouseDisplay + (rec.spouse?.memberCode ? ` (${rec.spouse.memberCode})` : '') }] : []),
      ].filter(Boolean),
    });
    showToast(`บันทึกสมาชิกใหม่ ${rec.code} เรียบร้อยแล้ว`);
    goRoute({ view: 'search' });
  };

  // เลือกสมาชิกจากช่องค้นหา → โหลดข้อมูลของสมาชิกคนนั้น (เก็บข้อมูลที่แก้ไว้รายคน)
  const memberCacheRef = React.useRef({});
  useEffect(() => {
    if (route.view !== 'member' || !route.code) return;
    if (data && data.member && data.member.code === route.code) return;
    if (data && data.member) memberCacheRef.current[data.member.code] = data;
    const next = memberCacheRef.current[route.code]
      || (window.mnDataForMember && window.mnDataForMember(route.code, members));
    if (next) { setData(next); setTab('info'); setSub('details'); }
  }, [route.view, route.code]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    document.documentElement.style.setProperty('--primary', t.primary);
    document.documentElement.style.setProperty('--font-stack',
      `"${t.fontFamily}", "IBM Plex Sans Thai", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`);
  }, [t.dark, t.primary, t.fontFamily]);

  useEffect(() => {
    let el = document.getElementById('__zebra-override');
    if (t.rowZebra) {
      if (!el) {
        el = document.createElement('style');
        el.id = '__zebra-override';
        document.head.appendChild(el);
      }
      el.textContent = '.tbl tbody tr:nth-child(even):not(.selected):not(:hover) { background: #FAFAFA; }';
    } else if (el) {
      el.remove();
    }
  }, [t.rowZebra]);

  return (
    <AuditContext.Provider value={{ log: logAudit, entries: audit }}>
    <BreadcrumbContext.Provider value={bcValue}>
    <div className={"app" + (t.sidebarCollapsed ? " collapsed" : "")}
         data-density={t.density}>
      <Sidebar collapsed={t.sidebarCollapsed}
               currentRoute={route}
               onNavigate={goRoute}
               onToggle={() => setTweak('sidebarCollapsed', !t.sidebarCollapsed)} />
      <Topbar
        onToggleSidebar={() => setTweak('sidebarCollapsed', !t.sidebarCollapsed)}
        onToggleTheme={() => setTweak('dark', !t.dark)}
        dark={t.dark}
      />
      <main className="main">
        <Breadcrumb items={crumbItems} />
        {route.view === 'loan' && route.page === 'request' ? (
          <LoanRequestPage key="lr-normal" onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'request-special' ? (
          <LoanRequestPage key="lr-special" special onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'approve' ? (
          <LoanApprovalPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'payment-order' ? (
          <PaymentOrderPage onToast={showToast} />
        ) : route.view === 'system' && route.page === 'showcase' ? (
          <AntShowcasePage onToast={showToast} />
        ) : route.view === 'member-new' ? (
          <MemberFormPage members={members}
                          onSave={handleSaveNewMember}
                          onCancel={() => goRoute({ view: 'search' })} />
        ) : route.view === 'system' && route.page === 'cooperative' ? (
          <CooperativeConfigPage />
        ) : route.view === 'system' && route.page === 'calendar' ? (
          <WorkCalendarPage />
        ) : route.view === 'system' && route.page === 'audit' ? (
          <AuditLogPage log={audit} />
        ) : route.view === 'system' && route.page === 'users' ? (
          <UserManagementPage onToast={showToast} />
        ) : route.view === 'system' && route.page === 'roles' ? (
          <RolePermissionPage onToast={showToast} />
        ) : route.view === 'system' && route.page === 'usergroups' ? (
          <UserGroupPage onToast={showToast} />
        ) : route.view === 'system' && route.page === 'backup' ? (
          <BackupRestorePage onToast={showToast} />
        ) : route.view === 'system' && route.page === 'constants' ? (
          <SystemConstantsHubPage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'loan' && route.page === 'guarantee-check' ? (
          <GuaranteeCheckPage />
        ) : route.view === 'loan' && route.page === 'collateral' ? (
          <LoanCollateralPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'legal-act' ? (
          <LegalActPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'contract-adjust' ? (
          <ContractAdjustPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'loan-control' ? (
          <LoanControlPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'atm-activities' ? (
          <AtmActivitiesPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'survey' ? (
          <SurveyAppointmentPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'appraisal' ? (
          <SurveyResultPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'ban' ? (
          <LoanBanPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'interest' ? (
          <InterestEstimatePage onToast={showToast} />
        ) : route.view === 'claims' && route.page === 'eligibility' ? (
          <ClaimEligibilityPage onToast={showToast} />
        ) : route.view === 'claims' && route.page === 'register' ? (
          <ClaimRegisterPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'insurance' ? (
          <InsurancePremiumPage onToast={showToast} />
        ) : route.view === 'claims' && route.page === 'cremation-members' ? (
          <CremationMembersPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'insurance-arrears' ? (
          <InsuranceArrearsPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-disbursement' ? (
          <CancelDailyDisbursePage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-resign' ? (
          <CancelResignPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-em-request' ? (
          <CancelEmRequestPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-special-pay' ? (
          <CancelSpecialPayPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-special-order' ? (
          <CancelSpecialOrderPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'cancel-contract' ? (
          <CancelLoanContractPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'insurance-renewal' ? (
          <InsuranceRenewalPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'schedule' ? (
          <PaymentSchedulePage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'lot' ? (
          <LoanPayLotPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'payout' ? (
          <LoanPayoutPage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'loan' && route.page === 'return' ? (
          <ReturnLoanReqPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'dividend' ? (
          <DividendTransferPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'int-cert' ? (
          <InterestCertIssuePage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'purpose-const-v2' ? (
          <LoanPurposeConstPageV2 onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'purpose-const' ? (
          <LoanPurposeConstPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'loan-terms' ? (
          <LoanTermsConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'insurer-config' ? (
          <InsuranceCompanyConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'loan-type' ? (
          <LoanTypeConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'loan-project' ? (
          <LoanProjectConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'loan-group' ? (
          <LoanGroupConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'guar-count' ? (
          <GuarantorCountConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'guar-limit' ? (
          <GuaranteeLimitConfigPage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'int-rate' ? (
          <InterestRateConfigPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'legal-status' ? (
          <LegalStatusChangePage onToast={showToast} />
        ) : route.view === 'loan' && route.page === 'salary-remain' ? (
          <SalaryRemainConfigPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'collect-stop' ? (
          <CollectStopRequestPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'inst-change-req' ? (
          <InstallmentChangeRequestPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'agent-affil' ? (
          <AgentAffiliationConfigPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'inst-approve' ? (
          <InstallmentChangeApprovePage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'accrued-interest-adjust' ? (
          <AccruedInterestAdjustPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-adjust' ? (
          <ShareAdjustPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'debt-adjust' ? (
          <DebtAdjustPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'resign-approve' ? (
          <MemberResignApprovePage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-change-approve' ? (
          <ShareChangeApprovePage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'member-close' ? (
          <MemberCloseAccountPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'resign-form' ? (
          <MemberResignFormPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'affil-transfer-form' ? (
          <AffilTransferFormPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-change-form' ? (
          <ShareChangeFormPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-partial-withdraw' ? (
          <SharePartialWithdrawPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-refund-pay' ? (
          <ShareRefundPayPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'tax-cert' ? (
          <TaxCertSubmitPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'share-terms' ? (
          <ShareTermsConfigPage onToast={showToast} />
        ) : route.view === 'process' && route.page === 'affil-detail' ? (
          <AffilDetailConfigPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'asset-type' ? (
          <InvestAssetTypeConfigPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'issuer' ? (
          <InvestIssuerConfigPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'limit' ? (
          <InvestLimitConfigPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'fund-tag' ? (
          <InvestFundTagConfigPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'portfolio' ? (
          <PortfolioRegisterPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'market-price' ? (
          <MarketPricePage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'new' ? (
          <NewInvestmentPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'import' ? (
          <ImportInvestmentPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'return' ? (
          <ReceiveReturnPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'maturity' ? (
          <MaturityProcessPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'sell' ? (
          <SellInvestmentPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'cashflow' ? (
          <CashflowPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'limit-check' ? (
          <InvestLimitCheckPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'agent-remit' ? (
          <AgentRemitPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'cheque-book' ? (
          <ChequeBookPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'cheque-pay' ? (
          <ChequePayPage onToast={showToast} />
        ) : route.view === 'invest' && route.page === 'bank-file' ? (
          <BankFilePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'notice' ? (
          <DebtNoticePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'follow' ? (
          <DebtFollowPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'org-request' ? (
          <DebtOrgRequestPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'notice-cancel' ? (
          <DebtNoticeCancelPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'dividend' ? (
          <DividendDetailPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'dividend-key' ? (
          <DividendKeyPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'dividend-calc' ? (
          <DividendCalcTestPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'dividend-adv' ? (
          <AdvanceDividendPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'guarantee-check' ? (
          <GuaranteeCheckPage />
        ) : route.view === 'debt' && route.page === 'guarantor-transfer' ? (
          <GuarantorTransferPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'guarantor-return' ? (
          <GuarantorReturnPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'guarantor-change' ? (
          <GuarantorChangePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'transfer-dept' ? (
          <MemberTransferPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'terminate' ? (
          <ContractTerminationPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'installment-change' ? (
          <InstallmentChangePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'contract-change' ? (
          <ContractChangePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'share-change' ? (
          <ShareChangePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'share-withdraw' ? (
          <ShareWithdrawPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'share-halfwithdraw' ? (
          <ShareHalfWithdrawPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'share-refund-2024' ? (
          <ShareRefund2024Page onToast={showToast} />
        ) : route.view === 'debt' && (route.page === 'share-refund' || route.page === 'share-refund-2024') ? (
          <ShareRefundPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'share-refund-cancel' ? (
          <ShareRefundCancelPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'resign' ? (
          <ResignPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'member-status' ? (
          <MemberStatusPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'suspension' ? (
          <DebtSuspensionPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'seizure' ? (
          <DebtSeizurePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'seizure-detail' ? (
          <DebtSeizureDetailPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'court-seizure' ? (
          <CourtSeizurePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'judgment-collection' ? (
          <JudgmentCollectionPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'retiree-seizure' ? (
          <RetireeSeizurePage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'suspension-project' ? (
          <DebtSuspensionProjectPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'div-affil' ? (
          <DividendAffiliationConfigPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'affiliation-config' ? (
          <AffiliationConfigPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'restruct-config' ? (
          <DebtRestructConfigPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'approve' ? (
          <DebtApprovalPage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'debt' && route.page === 'legal' ? (
          <LitigationRegistryPage onToast={showToast} />
        ) : route.view === 'debt' && route.page === 'legal-status' ? (
          <LegalStatusChangePage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'scholarship' ? (
          <ScholarshipQuotaPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'scholarship-req' ? (
          <ScholarshipRequestPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'relief' ? (
          <ReliefRequestPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'relief-type' ? (
          <ReliefTypeConfigPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'scholarship-select' ? (
          <ScholarshipSelectionPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'scholarship-approve' ? (
          <ScholarshipApprovalPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'approve' ? (
          <WelfareApprovalPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'seminar' ? (
          <SeminarProjectPage key="sem-registry" onToast={showToast} onNav={goRoute} />
        ) : route.view === 'welfare' && route.page === 'seminar-create' ? (
          <SeminarProjectPage key="sem-create" onToast={showToast} onNav={goRoute} startMode="form" />
        ) : route.view === 'welfare' && route.page === 'death-claim' ? (
          <DeceasedClaimPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'deceased' ? (
          <DeceasedMemberPage onToast={showToast} />
        ) : route.view === 'welfare' && route.page === 'grant' ? (
          <WelfareGrantPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'receive' ? (
          <FinanceReceivePage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'finance' && route.page === 'pay' ? (
          <FinancePayPage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'finance' && route.page === 'bytype' ? (
          <FinByTypePage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cross-system' ? (
          <FinCrossSystemPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cancel-txn' ? (
          <FinanceCancelTxnPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cancel-other-slip' ? (
          <FinanceCancelOtherSlipPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'scholarship-pay' ? (
          <ScholarshipPayApprovalPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'loan-disbursement' ? (
          <LoanDisbursementApprovalPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'share-refund' ? (
          <FinanceShareRefundPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'share-halfwithdraw' ? (
          <FinanceShareHalfWithdrawPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'share-debt' ? (
          <FinanceShareDebtPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cash-check' ? (
          <CashCheckPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cash-control' ? (
          <CashControlPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'carry-forward' ? (
          <CarryForwardPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'advance' ? (
          <PettyAdvancePage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'advance-return' ? (
          <PettyReturnPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'money-order' ? (
          <MoneyOrderPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'mo-receive' ? (
          <MoReceivePage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'receipt-fin' ? (
          <RcFinReceiptPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'receipt-wht' ? (
          <RcWhtCertPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'receipt-status' ? (
          <RcFinStatusPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'receipt-history' ? (
          <RcReceiptHistoryPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'terms' ? (
          <FinTermsConfigPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'bank-txn' ? (
          <BankTxnPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'external-party' ? (
          <ExternalPartyPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'bank-account' ? (
          <BankAccountPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'cheque-format' ? (
          <ChequeFormatPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'expense-category' ? (
          <ExpenseCategoryConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'settings' ? (
          <AccountingSettingsPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'period' ? (
          <AccountingPeriodPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'coa' ? (
          <ChartOfAccountsPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'account-category' ? (
          <AccountCategoryConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'system-code' ? (
          <SysCodeConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'account-type' ? (
          <AcctTypeConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'category-const' ? (
          <CatConstConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'journal-book' ? (
          <JBookConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'fiscal-year' ? (
          <FYearConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'opening-balance' ? (
          <OpeningBalanceEditPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'map-coa' ? (
          <MapCoaPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'fin-formula' ? (
          <FinStatementFormulaPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'cf-worksheet' ? (
          <CfWorksheetFormulaPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'budget' ? (
          <BudgetStructureConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'budget-plan' ? (
          <BudgetPlanConfigPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'journal-cancel' ? (
          <CancelJournalPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'journal' ? (
          <DailyJournalWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'voucher' ? (
          <VoucherWorkspace onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'voucher-approval' ? (
          <VoucherApprovalWorkspace onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'day-open' ? (
          <DayOpenWorkspace onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'day-close' ? (
          <DayCloseWorkspace onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'counter-vault' ? (
          <DepCounterVaultPage mode="finance" onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-unified' ? (
          <ChequeUnifiedPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-multi-slip-cbt' ? (
          <ChequeMultiSlipCbtPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-multi-slip' ? (
          <ChequeMultiSlipPage onToast={showToast} kind="deposit" title="ออกเช็ค 1 ใบ จากหลาย Slip" />
        ) : route.view === 'finance' && route.page === 'chq-many-from-slip' ? (
          <ChequeSplitPage onToast={showToast} variant="many-from-one" />
        ) : route.view === 'finance' && route.page === 'chq-loan' ? (
          <ChequeMultiSlipPage onToast={showToast} kind="loan" title="ออกเช็คเงินกู้" />
        ) : route.view === 'finance' && route.page === 'chq-deposit' ? (
          <ChequeMultiSlipPage onToast={showToast} kind="deposit" title="ออกเช็คเงินฝาก" />
        ) : route.view === 'finance' && route.page === 'chq-split' ? (
          <ChequeSplitPage onToast={showToast} variant="split" />
        ) : route.view === 'finance' && route.page === 'chq-print' ? (
          <ChequePrintPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-cancel-remit' ? (
          <ChequeCancelRemitPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-status' ? (
          <ChequeStatusPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'voucher-recv' ? (
          <PvrWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'receipt' ? (
          <ReceiptWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'petty' ? (
          <PettyCashWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'opening' ? (
          <OpeningBalancePage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'bank' ? (
          <BankPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'payable' ? (
          <PayablePage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'receivable' ? (
          <ReceivablePage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'approval' ? (
          <ApprovalPage onToast={showToast} onNav={goRoute} />
        ) : route.view === 'account' && route.page === 'posting' ? (
          <PostToLedgerPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'profit' ? (
          <ProfitAllocationPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'dividend' ? (
          <DividendPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'subsystem' ? (
          <SubsystemLinkPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'data' ? (
          <DataIOPage onToast={showToast} />
        ) : route.view === 'account' && route.page === 'wht' ? (
          <WhtRegisterWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'asset' ? (
          <AssetWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'asset-receive' ? (
          <AssetReceiveWorkspace onToast={showToast} />
        ) : route.view === 'account' && route.page === 'asset-issue' ? (
          <AssetIssueWorkspace onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'cancel' ? (
          <CancelTxnPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-dividend' ? (
          <DepMultiDepositPage source="dividend" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-salary' ? (
          <DepMultiDepositPage source="salary" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-scholarship' ? (
          <DepMultiDepositPage source="scholarship" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-welfare' ? (
          <DepMultiDepositPage source="welfare" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-meeting' ? (
          <DepMultiDepositPage source="meeting" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'md-loan' ? (
          <DepMultiDepositPage source="loan" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'basic-info' ? (
          <DepBasicInfoPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'open' ? (
          <DepOpenAccountPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'atm' ? (
          <DepAtmOpenPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'atm-close' ? (
          <DepAtmClosePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'atm-freeze' ? (
          <DepAtmFreezePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'atm-unfreeze' ? (
          <DepAtmUnfreezePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'external-person' ? (
          <DepExternalPersonPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'edit-account' ? (
          <DepEditAccountPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'approve' ? (
          <DepApprovePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'cheque-return' ? (
          <DepChequeOpsPage variant="ret" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'cheque-clear' ? (
          <DepChequeOpsPage variant="clear" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'multi-withdraw' ? (
          <DepMultiAmountPage mode="withdraw" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'multi-deposit' ? (
          <DepMultiAmountPage mode="deposit" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'counter' ? (
          <DepCounterPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'deposit' ? (
          <DepDepositPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'withdraw' ? (
          <DepWithdrawPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'transfer' ? (
          <DepTransferPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'monthly-change' ? (
          <DepMonthlyChangePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'default-process' ? (
          <DepDefaultProcessPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'cutoff' ? (
          <DepCutoffProcessPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'poontawee' ? (
          <DepPoontaweeProcessPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-calc' ? (
          <DepInterestCalcPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-pay' ? (
          <DepInterestPayPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-accrued' ? (
          <DepInterestAccruedPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-accrued-calc' ? (
          <DepInterestAccruedCalcPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-projection' ? (
          <DepInterestProjectionPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'passbook' ? (
          <DepPassbookWorkPage onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'bytype-both' ? (
          <FinBothPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'counter-vault' ? (
          <DepCounterVaultPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'counter-loan' ? (
          <DepCounterLoanPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'counter-open' ? (
          <DepCounterOpenPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'counter-close' ? (
          <DepCounterClosePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'proc-open' ? (
          <DepProcOpenPage onToast={showToast} />
        ) : route.view === 'deposit' && String(route.page || '').indexOf('const-') === 0 && window.DepTxnTypeConfigPage ? (
          <DepTxnTypeConfigPage key={route.page} cat={String(route.page).slice(6)} onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'dep-project' ? (
          <DepProjectConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'interest-advance' ? (
          <DepInterestProjectionPage key="advance" onToast={showToast} mode="advance" />
        ) : route.view === 'deposit' && route.page === 'pnd2' ? (
          <window.DepPnd2Page onToast={showToast} />
        ) : route.view === 'finance' && route.page === 'chq-cancel' ? (
          <ChequeCancelPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'int-table' && window.DepIntRateTablePage ? (
          <window.DepIntRateTablePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'book-register' ? (
          <BookRegisterPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'tax-cert' ? (
          <DepTaxCertPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'import' ? (
          <DepImportPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'bank-file' ? (
          <DepBankFilePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'freeze' ? (
          <DepFreezePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'rate-change' ? (
          <DepRateChangePage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'close' ? (
          <DepCloseAccountPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'sys-config' ? (
          <DepSystemConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'txn-type' ? (
          <DepTxnTypeConfigPage key="txn-type" onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'acc-type' ? (
          <DepAccTypeConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'rate' ? (
          <DepAccTypeConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'fee' ? (
          <DepAccTypeConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'funeral' ? (
          <DepFuneralConfigPage onToast={showToast} />
        ) : route.view === 'deposit' && route.page === 'passbook-cfg' ? (
          <DepPassbookConfigPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'registry' ? (
          <AgentDebtorListPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'registry-detail' ? (
          <AgentDebtorDetailPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'receive' ? (
          <AgentReceivePage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'batch-receive' ? (
          <AgentBatchReceivePage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'adjust' ? (
          <AgentAdjustPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'process' ? (
          <AgentProcessPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'return-money' ? (
          <AgentReturnMoneyPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'receipt-return' ? (
          <AgentReceiptReturnPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'poontawee' ? (
          <AgentPoontaweePage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'cancel-txn' ? (
          <AgentCancelTxnPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'day' ? (
          <AgentDayConfigPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'receipt-type' ? (
          <AgentReceiptTypeConfigPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'affiliation' ? (
          <AgentAffiliationConfigPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'cancel-reason' ? (
          <AgentCancelReasonConfigPage onToast={showToast} />
        ) : route.view === 'agent' && route.page === 'payment-type' ? (
          <AgentPaymentTypeConfigPage onToast={showToast} />
        ) : (
          <MemberDetailPage
            data={data} setData={setData}
            tab={tab} sub={sub} setTab={setTab} setSub={setSub}
            headerVariant={t.headerVariant}
            picked={route.view === 'member'}
            members={members}
            onSelectMember={(code) => goRoute({ view: 'member', code })}
            onAddNew={() => goRoute({ view: 'member-new' })}
            onToast={showToast}
          />
        )}
      </main>

      <TweaksPanel title="Tweaks · ปรับแต่งการแสดงผล">
        <TweakSection label="ธีม">
          <TweakColor label="สีหลัก" value={t.primary}
                      options={['#237450', '#155b3c', '#15803D', '#0F766E', '#1E40AF']}
                      onChange={(v) => setTweak('primary', v)} />
        </TweakSection>

        <TweakSection label="เลย์เอาต์">
          <TweakRadio label="ความหนาแน่นข้อมูล" value={t.density}
                      options={[{value:'dense',label:'แน่น'},{value:'compact',label:'ปกติ'},{value:'comfy',label:'โปร่ง'}]}
                      onChange={(v) => setTweak('density', v)} />
          <TweakRadio label="รูปแบบ Header สมาชิก" value={t.headerVariant}
                      options={[{value:'card',label:'การ์ดขาว'},{value:'banner',label:'แบนเนอร์'}]}
                      onChange={(v) => setTweak('headerVariant', v)} />
          <TweakToggle label="แถวสลับสีตาราง (zebra)" value={t.rowZebra}
                       onChange={(v) => setTweak('rowZebra', v)} />
          <TweakToggle label="ย่อแถบเมนูซ้าย" value={t.sidebarCollapsed}
                       onChange={(v) => setTweak('sidebarCollapsed', v)} />
        </TweakSection>

        <TweakSection label="ฟอนต์">
          <TweakSelect label="Font ภาษาไทย" value={t.fontFamily}
                       options={['Sarabun', 'IBM Plex Sans Thai', 'Noto Sans Thai', 'Prompt', 'Kanit']}
                       onChange={(v) => setTweak('fontFamily', v)} />
        </TweakSection>

        <TweakSection label="ลัด" />
        <div style={{ display: 'flex', gap: 6 }}>
          <TweakButton label="รีเซ็ตข้อมูล" secondary
                       onClick={() => setData(window.MEMBER_DATA)} />
          <TweakButton label="เปิดสมาชิกตัวอย่าง"
                       onClick={() => goRoute({ view: 'member', code: window.MEMBER_DATA.member.code })} />
        </div>
      </TweaksPanel>

      {toast && (
        <div className="toast-wrap">
          <div className="toast">
            <span className="t-ico"><Icon name="check" /></span>
            {toast}
          </div>
        </div>
      )}
    </div>
    </BreadcrumbContext.Provider>
    </AuditContext.Provider>
  );
}

// ─── Inline member search (รหัส / ชื่อ / เลขบัตร) on the detail page ──
// ─── ค้นหาสมาชิกแบบ popup (รูปแบบกลางเดียวกับหน้า "บันทึกเบี้ยประกัน") ──
// แยกคำนำหน้า / ชื่อ / นามสกุล จากชื่อเต็ม เพื่อให้ตารางผลลัพธ์ของ popup
// แสดงเป็นคอลัมน์ "ชื่อ" และ "นามสกุล" แยกกันเหมือนหน้าจอบันทึกเบี้ยประกัน
const TH_TITLE_RE = /^(นางสาว|นาง|นาย|ด\.ช\.|ด\.ญ\.|น\.ส\.|ว่าที่ ร\.ต\.)\s*/;
function splitThaiName(full) {
  const s = String(full || '').trim();
  const tm = s.match(TH_TITLE_RE);
  const title = tm ? tm[1] : '';
  const rest = s.replace(TH_TITLE_RE, '').trim();
  const sp = rest.indexOf(' ');
  return sp === -1
    ? { title, firstName: rest, lastName: '' }
    : { title, firstName: rest.slice(0, sp), lastName: rest.slice(sp + 1) };
}

function registryMemberList(members) {
  return (members || window.MEMBERS_LIST || []).map((m) => ({ ...m, ...splitThaiName(m.name) }));
}
// ค้นหาตาม 4 เงื่อนไข: รหัสสมาชิก · ชื่อ · นามสกุล · เลขที่บัตรประชาชน
function registrySearchFn(list) {
  return (c) => {
    const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s-]/g, '');
    const code = norm(c.code), cid = norm(c.citizenId);
    const fn = (c.firstName || '').trim().toLowerCase();
    const ln = (c.lastName || '').trim().toLowerCase();
    if (![code, cid, fn, ln].some(Boolean)) return list;   // ไม่กรอก = แสดงทั้งหมด
    return list.filter((m) => {
      if (code && !norm(m.code).includes(code)) return false;
      if (cid && !norm(m.citizenId || '').includes(cid)) return false;
      if (fn && !(m.firstName.toLowerCase().includes(fn) || m.name.toLowerCase().includes(fn))) return false;
      if (ln && !(m.lastName.toLowerCase().includes(ln) || m.name.toLowerCase().includes(ln))) return false;
      return true;
    });
  };
}

function RegistryMemberSearch({ members, currentCode, onSelect }) {
  // เติม title/firstName/lastName ให้สมาชิกในทะเบียน (MEMBERS_LIST มีแต่ชื่อเต็ม)
  const list = React.useMemo(() => registryMemberList(members), [members]);
  const current = React.useMemo(
    () => list.find((m) => m.code === currentCode) || null,
    [list, currentCode]
  );
  const searchFn = React.useMemo(() => registrySearchFn(list), [list]);
  const [text, setText] = useState(currentCode || '');
  const [open, setOpen] = useState(false);
  useEffect(() => { setText(currentCode || ''); }, [currentCode]);

  const submit = () => {
    const q = String(text || '').trim().toLowerCase().replace(/[\s-]/g, '');
    if (!q) { setOpen(true); return; }
    const norm = (s) => String(s || '').toLowerCase().replace(/[\s-]/g, '');
    let hits = list.filter((m) => norm(m.code) === q);
    if (!hits.length) hits = list.filter((m) => norm(m.code).endsWith(q) || norm(m.code).includes(q));
    if (!hits.length) hits = list.filter((m) => norm(m.name).includes(q));
    if (hits.length === 1) { onSelect && onSelect(hits[0].code); return; }
    setOpen(true);
  };

  const Modal = window.MemberSearchModal;
  const MSF = window.MemberSearchField;
  return (
    <div className="reg-member-search" style={{ flex: '0 0 300px', width: 300, minWidth: 220, maxWidth: '40vw' }}>
      {MSF ? (
        <MSF member={current} onPick={(m) => onSelect && onSelect(m.code)}
             source={list} searchFn={searchFn} title="ค้นหาสมาชิก" changeLabel="เปลี่ยน"
             placeholder="คลิกเพื่อค้นหาเลขสมาชิก…" />
      ) : (
        <React.Fragment>
          <input className="cfg-input" value={text}
                 onChange={(e) => setText(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                 placeholder="เลขสมาชิก"
                 style={{ width: '100%', height: 32 }} />
          {open && Modal && (
            <Modal source={list} searchFn={searchFn} title="ค้นหาสมาชิก"
                   onClose={() => setOpen(false)}
                   onPick={(m) => { setOpen(false); onSelect && onSelect(m.code); }} />
          )}
        </React.Fragment>
      )}
    </div>
  );
}

// ─── Member Detail Page ─────────────────────────────────────────────
function MemberDetailPage({ data, setData, tab, sub, setTab, setSub, headerVariant, picked = true, members, onSelectMember, onAddNew, onToast }) {
  // สถานะการเข้าถึงข้อมูลเงินฝาก (คงอยู่ระหว่างสลับแท็บ) — null = ล็อกอยู่
  const [depositAuth, setDepositAuth] = useState(null);
  // กลุ่มแท็บระดับบน: ข้อมูลสมาชิก / ข้อมูลการเงินและสัญญา
  const [group, setGroup] = useState('info');

  // ── แก้ไข / ประวัติ / พิมพ์ — ยกขึ้นมาที่ระดับหน้าจอทั้งหมด ──
  const audit = React.useContext(AuditContext);
  const [editing, setEditing] = useState(false);
  const [kids, setKids] = useState(() => window.loadMemberChildren(data.member.code));
  const [bens, setBens] = useState(() => (data.beneficiaries || []).map(b => ({ ...b })));
  const [histOpen, setHistOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [kidErrors, setKidErrors] = useState({});
  const [benErrors, setBenErrors] = useState({});
  const [shareError, setShareError] = useState(false);
  const [detailErrors, setDetailErrors] = useState({});
  const [validateModal, setValidateModal] = useState(null);
  const snapRef = useRef(null);
  const kidsSnapRef = useRef(null);
  const bensSnapRef = useRef(null);

  useEffect(() => {
    setEditing(false);
    setKids(window.loadMemberChildren(data.member.code));
    setBens((data.beneficiaries || []).map(b => ({ ...b })));
  }, [data.member.code]);

  const clearValidation = () => { setKidErrors({}); setBenErrors({}); setShareError(false); setDetailErrors({}); };
  const startEdit = () => {
    clearValidation();
    setGroup('info');
    setSub('details');
    snapRef.current = { ...data.member };
    kidsSnapRef.current = kids.map(k => ({ ...k }));
    bensSnapRef.current = bens.map(b => ({ ...b }));
    setEditing(true);
  };
  const cancelEdit = () => {
    const snap = snapRef.current;
    if (snap) setData(d => ({ ...d, member: snap }));
    if (kidsSnapRef.current) setKids(kidsSnapRef.current);
    if (bensSnapRef.current) setBens(bensSnapRef.current);
    clearValidation();
    setEditing(false);
  };
  const saveEdit = () => {
    const kErr = window.validateKids ? window.validateKids(kids) : {};
    const bErr = window.validateBens ? window.validateBens(bens) : {};
    const total = window.benShareTotal ? window.benShareTotal(bens) : 100;
    const shareBad = bens.length > 0 && total !== 100;
    const dErr = window.validateMemberDetail ? window.validateMemberDetail(data.member, data.shares) : {};
    setKidErrors(kErr); setBenErrors(bErr); setShareError(shareBad); setDetailErrors(dErr);
    if (Object.keys(dErr).length || Object.keys(kErr).length || Object.keys(bErr).length || shareBad) {
      const parts = [];
      if (Object.keys(dErr).length) parts.push('ข้อมูลสมาชิกที่บังคับกรอก (' + Object.keys(dErr).length + ' ช่อง)');
      if (Object.keys(bErr).length) parts.push('ตารางผู้รับผลประโยชน์');
      if (shareBad) parts.push('สัดส่วนผลประโยชน์รวมต้องเท่ากับ 100% (ขณะนี้ ' + total + '%)');
      if (Object.keys(kErr).length) parts.push('ตารางข้อมูลบุตร');
      setGroup('info'); setSub('details');
      setValidateModal(parts);
      return;
    }
    clearValidation();
    const before = snapRef.current || {};
    const changes = window.diffMemberFields(before, data.member);
    if (changes.length) {
      audit.log({ action: 'update', module: 'ทะเบียนสมาชิก',
        target: `${data.member.code} · ${data.member.name}`,
        summary: `แก้ไขรายละเอียดสมาชิก (${changes.length} รายการ)`, changes });
    }
    const kb = kidsSnapRef.current || [];
    if (JSON.stringify(kb) !== JSON.stringify(kids)) {
      window.saveMemberChildren(data.member.code, kids);
      audit.log({ action: 'update', module: 'ทะเบียนสมาชิก',
        target: `${data.member.code} · ${data.member.name}`,
        summary: `แก้ไขข้อมูลบุตร (${kids.length} คน)`,
        changes: [{ field: 'จำนวนบุตร', before: String(kb.length), after: String(kids.length) }] });
    }
    const bb = bensSnapRef.current || [];
    if (JSON.stringify(bb) !== JSON.stringify(bens)) {
      audit.log({ action: 'update', module: 'ทะเบียนสมาชิก',
        target: `${data.member.code} · ${data.member.name}`,
        summary: `แก้ไขผู้รับผลประโยชน์ (${bens.length} ราย)`,
        changes: [{ field: 'จำนวนผู้รับผลประโยชน์', before: String(bb.length), after: String(bens.length) }] });
    }
    setEditing(false);
    onToast && onToast('บันทึกข้อมูลสมาชิกเรียบร้อยแล้ว');
  };

  // พิมพ์รายละเอียดสมาชิกครบทุกแท็บ — รูปแบบเดียวกับใบรายละเอียดสมาชิก
  // ในเมนูสร้างใบคำขอกู้เงิน (พรีวิวก่อนพิมพ์)
  const printMember = () => setPrintOpen(true);

  // Render the active financial tab
  const renderFinancialTab = () => {
    if (tab === 'shares')    return <SharesTab data={data} />;
    if (tab === 'loans')     return <LoansTab data={data} />;
    if (tab === 'emergency') return <EmergencyTab data={data} />;
    if (tab === 'collect')   return <CollectionTab data={data} />;
    if (tab === 'deposits')  return <DepositsTab data={data} auth={depositAuth} onAuth={setDepositAuth} />;
    if (tab === 'guarGiven') return <GuarGivenTab data={data} />;
    if (tab === 'guarRecv')  return <GuarRecvTab data={data} />;
    if (tab === 'insurance') return <InsuranceTab data={data} />;
    if (tab === 'securities') return <SecuritiesTab data={data} />;
    if (tab === 'meetingfee') return <MeetingFeeTab data={data} />;
    if (tab === 'agentdebt') return <AgentDebtTab data={data} />;
    if (tab === 'restruct')  return <RestructTab data={data} />;
    if (tab === 'taxcert')   return <TaxCertTab data={data} onToast={onToast} />;
    // Default to shares when on the info-only sub-tab page
    return <SharesTab data={data} />;
  };

  // Render the active info sub-tab
  const renderInfoTab = () => {
    if (sub === 'details')    return <DetailsTab data={data} setData={setData} editing={editing} kids={kids} setKids={setKids} bens={bens} setBens={setBens}
                                                 kidErrors={kidErrors} benErrors={benErrors} shareError={shareError} detailErrors={detailErrors} />;
    if (sub === 'status')     return <StatusTab data={data} setData={setData} editing={editing} />;
    if (sub === 'deductions') return <DeductionsTab data={data} />;
    if (sub === 'signature')  return <SignatureTab data={data} editing={editing} />;
    return null;
  };

  return (
    <div data-screen-label="หน้ารายละเอียดสมาชิก">
      <div className="page-actions">
        <RegistryMemberSearch members={members} currentCode={picked ? data.member.code : null} onSelect={onSelectMember} />
        <button className="btn sm" onClick={onAddNew}><Icon name="plus" /> เพิ่มสมาชิกใหม่</button>
        <span className="spacer" />
        {!picked ? null : editing ? (
          <>
            <button className="btn sm" onClick={cancelEdit}>ยกเลิก</button>
            <button className="btn primary sm" onClick={saveEdit}><Icon name="check" /> บันทึกข้อมูลสมาชิก</button>
          </>
        ) : (
          <>
            <button className="btn sm" onClick={printMember}><Icon name="print" /> พิมพ์รายละเอียดสมาชิก</button>
            <button className="btn sm" onClick={() => setHistOpen(true)}><Icon name="history" /> ประวัติ</button>
            <button className="btn primary sm" onClick={startEdit}><Icon name="edit" /> แก้ไขข้อมูลสมาชิก</button>
          </>
        )}
      </div>

      {/* Member Header (always at top) */}
      <MemberHeader data={picked ? data : null} variant={headerVariant} />

      {/* ─── Merged card: top-level group tabs + sub-tabs ───────────── */}
      <div className="tabs-container">
        <div className="group-tabs">
          <button className={"group-tab" + (group === 'info' ? ' active' : '')}
                  onClick={() => setGroup('info')}>
            <span className="gt-icon"><Icon name="user" /></span>
            <span className="gt-text">
              <span className="gt-title">ข้อมูลสมาชิก</span>
              <span className="gt-sub">รายละเอียด · สถานะภาพ · หักประจำเดือน · ลายเซ็นต์</span>
            </span>
          </button>
          <button className={"group-tab" + (group === 'finance' ? ' active' : '')}
                  onClick={() => setGroup('finance')}>
            <span className="gt-icon"><Icon name="money" /></span>
            <span className="gt-text">
              <span className="gt-title">ข้อมูลการเงินและสัญญา</span>
              <span className="gt-sub">หุ้น · เงินกู้ · ปรับโครงสร้าง · เรียกเก็บ · ค้ำประกัน · หลักทรัพย์</span>
            </span>
          </button>
        </div>

        {!picked ? (
          <>
            {group === 'info' ? <InfoTabsBar sub={sub} onSubChange={setSub} /> : <FinanceTabsBar active={tab === 'info' ? 'shares' : tab} memberCode="" onChange={setTab} />}
            <div className="tab-panel">
              <div className="search-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <div className="muted" style={{ fontSize: 13 }}>ยังไม่ได้เลือกสมาชิก — ค้นหาและเลือกสมาชิกจากช่องด้านบนเพื่อแสดงข้อมูล</div>
              </div>
            </div>
          </>
        ) : group === 'info' ? (
          <>
            <InfoTabsBar sub={sub} onSubChange={setSub} />
            <div className="tab-panel">{renderInfoTab()}</div>
          </>
        ) : (
          <>
            <FinanceTabsBar active={tab === 'info' ? 'shares' : tab}
                            memberCode={data.member.code}
                            onChange={setTab} />
            <div className="tab-panel">{renderFinancialTab()}</div>
          </>
        )}
      </div>

      {picked && histOpen && (
        <TxHistoryModal memberCode={data.member.code} memberName={data.member.name}
                        modules={null} title="ประวัติการทำรายการ — ภาพรวมสมาชิก"
                        onClose={() => setHistOpen(false)} />
      )}
      {picked && printOpen && (
        <MemberFullPrintOverlay data={data} onClose={() => setPrintOpen(false)} />
      )}
      {validateModal && (
        <>
          <div className="modal-backdrop" onClick={() => setValidateModal(null)} />
          <div className="modal-card" style={{ width: 460, maxWidth: '94vw' }}>
            <div className="modal-head">
              <div className="gc-modal-ico" style={{ background: 'var(--danger-50)', color: 'var(--danger)' }}>
                <Icon name="warning" />
              </div>
              <h2>กรอกข้อมูลไม่ครบ</h2>
              <button className="close-btn" onClick={() => setValidateModal(null)} aria-label="ปิด"><Icon name="close" /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 10px' }}>
                กรุณากรอกข้อมูลให้ครบทุกช่องก่อนบันทึก — ช่องที่ยังไม่สมบูรณ์ถูกทำเครื่องหมายขอบสีแดงไว้ในตาราง
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--danger)' }}>
                {validateModal.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
            <div className="modal-foot">
              <span className="spacer" />
              <button className="btn primary" onClick={() => setValidateModal(null)}>รับทราบ</button>
            </div>
          </div>
        </>
      )}
      <MemberPrintSheet data={data} />
    </div>
  );
}

// ─── Split tab bars: info-only and finance-only ─────────────────────
function InfoTabsBar({ sub, onSubChange }) {
  const subs = [
    { id: "details",    label: "รายละเอียดสมาชิก" },
    { id: "status",     label: "สถานะภาพ" },
    { id: "deductions", label: "หักประจำเดือน" },
    { id: "signature",  label: "ลายเซ็นต์" },
  ];
  return (
    <div className="tabs-bar">
      {subs.map(s => (
        <button key={s.id} className={"tab" + (s.id === sub ? " active" : "")}
                onClick={() => onSubChange(s.id)}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

function FinanceTabsBar({ active, onChange, memberCode }) {
  const insCount = (window.memberInsurancePolicies ? window.memberInsurancePolicies(memberCode) : []).length;
  const tabs = [
    { id: "shares",    label: "หุ้น",            count: 3 },
    { id: "loans",     label: "เงินกู้",          count: 4 },
    { id: "restruct",  label: "ปรับโครงสร้างหนี้", count: (window.mrsForMember && window.MEMBER_DATA ? window.mrsForMember(window.MEMBER_DATA.loans) : []).length },
    { id: "deposits",  label: "เงินฝาก",         count: 4, locked: true },
    { id: "emergency", label: "ฉุกเฉินหักโอน",   count: 4 },
    { id: "collect",   label: "เรียกเก็บ",        count: 8 },
    { id: "guarGiven", label: "ค้ำใคร",           count: 4 },
    { id: "guarRecv",  label: "ใครค้ำ",           count: 4 },
    { id: "insurance", label: "ประกันภัย",         count: insCount },
    { id: "securities",label: "ข้อมูลหลักทรัพย์",  count: (window.MEMBER_DATA && window.MEMBER_DATA.securities || []).length },
    { id: "meetingfee",label: "จ่ายเบี้ยประชุม",   count: (window.vchMemberReceipts ? window.vchMemberReceipts(window.MEMBER_DATA && window.MEMBER_DATA.member) : []).length },
    { id: "agentdebt", label: "ลูกหนี้ตัวแทน",     count: (window.MEMBER_DATA && window.MEMBER_DATA.agentDebt && window.MEMBER_DATA.agentDebt.rows || []).length },
    { id: "taxcert",   label: "หนังสือรับรองดอกเบี้ย", count: (window.LOAN_CERT_HISTORY || []).filter(h => h.tax === 'sent').length },
  ];
  return (
    <div className="tabs-bar">
      {tabs.map(tb => (
        <button key={tb.id} className={"tab" + (tb.id === active ? " active" : "")}
                onClick={() => onChange(tb.id)}>
          {tb.locked && <span className="tab-lock"><Icon name="lock" size={12} /></span>}
          {tb.label}
          <span className="count">{memberCode ? tb.count : 0}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Error boundary — กันจอขาว: แสดงข้อความ + ปุ่มโหลดใหม่ แทนหน้าว่าง ──
class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App crashed:', error, info); }
  render() {
    if (this.state.error) {
      const msg = String(this.state.error && (this.state.error.stack || this.state.error.message) || this.state.error);
      return (
        <div style={{ maxWidth: 640, margin: '80px auto', padding: 24, fontFamily: 'var(--font-stack)' }}>
          <div className="search-card" style={{ padding: 24 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>เกิดข้อผิดพลาดในการแสดงผล</h2>
            <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              ระบบพบข้อผิดพลาดในหน้านี้ กรุณาโหลดหน้าใหม่ หากยังพบปัญหาโปรดแจ้งผู้ดูแลระบบ
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11.5, background: '#f6f6f6', padding: 12, borderRadius: 4, maxHeight: 220, overflow: 'auto', color: '#a00' }}>{msg}</pre>
            <button className="btn primary" style={{ marginTop: 14 }} onClick={() => { this.setState({ error: null }); location.hash = '#dashboard'; }}>กลับหน้าหลัก</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary><App /></AppErrorBoundary>
);
