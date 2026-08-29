import { ref } from 'vue';
import axios from 'axios';

// ── Singleton state ───────────────────────────────────────────────────────────
const tenants    = ref([]);
const activeTenant = ref(null);
const authUser   = ref(null);
const apiHealth  = ref({ status: 'unknown', message: '' });
const isLoading  = ref(false);
const error      = ref(null);

// Platform (root) admin session — entirely separate from the tenant authUser
// above. See backend/models/PlatformAdmin.js. Deliberately kept out of the
// regular `api` instance/interceptor below so a platform admin's token can
// never leak onto a tenant-scoped request (or vice versa) just because both
// happen to be populated in the same browser tab during an impersonation
// session.
const platformAdmin = ref(null);

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://hrms-x.onrender.com/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  if (activeTenant.value?._id) config.headers['X-Tenant-ID'] = activeTenant.value._id;
  if (authUser.value?.token)   config.headers['Authorization'] = `Bearer ${authUser.value.token}`;
  return config;
});

// Separate instance for /platform/* calls — carries the platform admin's own
// token, never a tenant token or X-Tenant-ID header.
const platformApi = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://hrms-x.onrender.com/api', headers: { 'Content-Type': 'application/json' } });
platformApi.interceptors.request.use(config => {
  if (platformAdmin.value?.token) config.headers['Authorization'] = `Bearer ${platformAdmin.value.token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hrms_auth_user');
      localStorage.removeItem('hrms_tenant_id');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ── Helper ────────────────────────────────────────────────────────────────────
const call = async (fn) => {
  error.value = null;
  try { return await fn(); }
  catch (err) {
    error.value = err.response?.data?.message || err.message || 'Request failed.';
    throw err;
  }
};

export function useApi() {

  // ── Auth & tenant ──────────────────────────────────────────────────────────
  const setActiveTenant = (tenant) => {
    activeTenant.value = tenant;
    if (tenant?._id) localStorage.setItem('hrms_tenant_id', tenant._id);
  };

  const setAuthUser = (user) => {
    authUser.value = user;
    if (user?.token) localStorage.setItem('hrms_auth_user', JSON.stringify(user));
    else             localStorage.removeItem('hrms_auth_user');
  };

  const restoreAuth = () => {
    const u = localStorage.getItem('hrms_auth_user');
    if (u) authUser.value = JSON.parse(u);
  };

  // ── Platform (root) admin ────────────────────────────────────────────────
  const setPlatformAdmin = (admin) => {
    platformAdmin.value = admin;
    if (admin?.token) localStorage.setItem('hrms_platform_admin', JSON.stringify(admin));
    else localStorage.removeItem('hrms_platform_admin');
  };

  const restorePlatformAdmin = () => {
    const p = localStorage.getItem('hrms_platform_admin');
    if (p) platformAdmin.value = JSON.parse(p);
  };

  const platformLogin = (credentials) => call(async () => {
    const r = await platformApi.post('/platform/login', credentials);
    setPlatformAdmin(r.data.data);
    return r.data.data;
  });

  const platformLogout = () => setPlatformAdmin(null);

  const getPlatformTenants = () => call(async () => (await platformApi.get('/platform/tenants')).data.data);
  const getPlatformTenantDetail = (id) => call(async () => (await platformApi.get(`/platform/tenants/${id}`)).data.data);

  // Impersonate: returns the same shape as a normal tenant login response
  // ({ _id, name, email, role, tenant, token }) so the caller can feed it
  // straight into setAuthUser/setActiveTenant, exactly like a real login.
  const impersonateTenant = (tenantId, reason) => call(async () => (await platformApi.post(`/platform/tenants/${tenantId}/impersonate`, { reason })).data.data);
  const setTenantTestAccount = (tenantId, isTestAccount) => call(async () => (await platformApi.patch(`/platform/tenants/${tenantId}/test-account`, { isTestAccount })).data.data);

  const checkHealth = async () => {
    try {
      const r = await api.get('/health');
      apiHealth.value = { status: r.data.status === 'ok' ? 'healthy' : 'degraded', message: r.data.message };
    } catch {
      apiHealth.value = { status: 'disconnected', message: 'Cannot reach API.' };
    }
  };

  const fetchTenants = async () => {
    isLoading.value = true;
    try {
      const r = await api.get('/tenants');
      tenants.value = r.data.data;
      const cachedId = localStorage.getItem('hrms_tenant_id');
      if (cachedId) {
        const found = tenants.value.find(t => t._id === cachedId);
        if (found) activeTenant.value = found;
      }
    } catch (e) { error.value = e.response?.data?.message || 'Failed to load tenants.'; }
    finally { isLoading.value = false; }
  };

  const registerTenant = async (data) => {
    isLoading.value = true;
    return call(async () => {
      const r = await api.post('/tenants', data);
      tenants.value.push(r.data.data.tenant);
      setActiveTenant(r.data.data.tenant);
      return r.data.data;
    }).finally(() => { isLoading.value = false; });
  };

  const loginUser = async (credentials) => {
    isLoading.value = true;
    return call(async () => {
      const r = await api.post('/auth/login', credentials);
      // If the account has email OTP 2FA enabled, the server returns
      // { requiresOtp, pendingToken, email } instead of a real session —
      // don't treat that as a logged-in session yet.
      if (r.data.data?.requiresOtp) return r.data.data;
      setAuthUser(r.data.data);
      setActiveTenant(r.data.data.tenant);
      return r.data.data;
    }).finally(() => { isLoading.value = false; });
  };

  const verifyLoginOtp = async (pendingToken, code) => {
    isLoading.value = true;
    return call(async () => {
      const r = await api.post('/auth/verify-otp', { pendingToken, code });
      setAuthUser(r.data.data);
      setActiveTenant(r.data.data.tenant);
      return r.data.data;
    }).finally(() => { isLoading.value = false; });
  };

  const changePassword = (d) => call(async () => (await api.put('/auth/change-password', d)).data);
  const forgotPassword = (email) => call(async () => (await api.post('/auth/forgot-password', { email })).data);
  const resetPasswordRequest = (d) => call(async () => (await api.post('/auth/reset-password', d)).data);
  const setTwoFactor = (enabled) => call(async () => (await api.put('/auth/2fa', { enabled })).data);

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const getDashboardStats = () => call(async () => (await api.get('/dashboard/stats')).data.data);

  // ── Shoutouts ──────────────────────────────────────────────────────────────
  const getShoutouts       = () => call(async () => (await api.get('/shoutouts')).data.data);
  const createShoutout     = (d) => call(async () => (await api.post('/shoutouts', d)).data.data);
  const reactToShoutout    = (id, emoji) => call(async () => (await api.put(`/shoutouts/${id}/react`, { emoji })).data.data);

  // ── Employees ──────────────────────────────────────────────────────────────
  const getEmployees        = () => call(async () => (await api.get('/employees')).data.data);
  const getDirectoryLite    = () => call(async () => (await api.get('/employees/directory-lite')).data.data);
  const getMe               = () => call(async () => (await api.get('/employees/me')).data.data);
  const getEmployee         = (id) => call(async () => (await api.get(`/employees/${id}`)).data.data);
  const createEmployee      = (d) => call(async () => (await api.post('/employees', d)).data.data);
  const bulkCreateEmployees = (rows) => call(async () => (await api.post('/employees/bulk', { employees: rows })).data.data);
  const updateEmployee      = (id, d) => call(async () => (await api.put(`/employees/${id}`, d)).data.data);
  const updateEmployeeManager = (id, managerId) => call(async () => (await api.put(`/employees/${id}/manager`, { managerId })).data.data);

  // ── Departments ────────────────────────────────────────────────────────────
  const getDepartments      = () => call(async () => (await api.get('/departments')).data.data);
  const createDepartment    = (d) => call(async () => (await api.post('/departments', d)).data.data);
  const updateDepartment    = (id, d) => call(async () => (await api.put(`/departments/${id}`, d)).data.data);
  const deleteDepartment    = (id) => call(async () => (await api.delete(`/departments/${id}`)).data);

  // ── Leaves ────────────────────────────────────────────────────────────────
  const getLeaves           = () => call(async () => (await api.get('/leaves')).data.data);
  const createLeave         = (d) => call(async () => (await api.post('/leaves', d)).data.data);
  const updateLeaveStatus   = (id, status) => call(async () => (await api.put(`/leaves/${id}`, { status })).data.data);
  const getLeavePolicy      = () => call(async () => (await api.get('/leave-policy')).data.data);
  const updateLeavePolicy   = (d) => call(async () => (await api.put('/leave-policy', d)).data.data);

  // ── Payslips ──────────────────────────────────────────────────────────────
  const getPayslips         = () => call(async () => (await api.get('/payslips')).data.data);
  const createPayslip       = (d) => call(async () => (await api.post('/payslips', d)).data.data);
  const bulkGeneratePayslips = (period) => call(async () => (await api.post('/payslips/bulk-generate', { period })).data);
  const downloadPayslipPdf  = (id) => call(async () => (await api.get(`/payslips/${id}/pdf`, { responseType: 'blob' })).data);
  const downloadRemittanceReport = (period, type) => call(async () => (await api.get('/payslips/remittance', { params: { period, type }, responseType: 'blob' })).data);
  const payPayslip          = (id) => call(async () => (await api.post(`/payslips/${id}/pay`)).data);
  const payPayslipBatch     = (payslipIds) => call(async () => (await api.post('/payslips/pay-batch', { payslipIds })).data);
  const finalizePayslipPayment = (id, otp) => call(async () => (await api.post(`/payslips/${id}/pay/finalize`, { otp })).data);
  const resetStuckPayment      = (id, force) => call(async () => (await api.post(`/payslips/${id}/reset-payment`, { force: !!force })).data);

  // ── Tenant Plan (freemium) ─────────────────────────────────────────────────
  const getTenantPlan    = () => call(async () => (await api.get('/tenant/plan')).data.data);
  const upgradeTenantPlan = () => call(async () => (await api.post('/tenant/plan/upgrade')).data);

  // ── Payroll Wallet ─────────────────────────────────────────────────────────
  const getWallet             = () => call(async () => (await api.get('/wallet')).data.data);
  const setupWallet           = (phone) => call(async () => (await api.post('/wallet/setup', { phone })).data);
  const setWalletDualApproval = (enabled) => call(async () => (await api.put('/wallet/dual-approval', { enabled })).data);
  const setPayrollSchedule    = (d) => call(async () => (await api.put('/wallet/schedule', d)).data.data);
  const getWalletTransactions = () => call(async () => (await api.get('/wallet/transactions')).data.data);

  // ── Payroll Approvals (maker-checker) ─────────────────────────────────────
  const getPayrollApprovals     = (status) => call(async () => (await api.get('/payroll-approvals', { params: status ? { status } : {} })).data.data);
  const approvePayrollApproval  = (id) => call(async () => (await api.post(`/payroll-approvals/${id}/approve`)).data);
  const rejectPayrollApproval   = (id, reason) => call(async () => (await api.post(`/payroll-approvals/${id}/reject`, { reason })).data);

  // ── Banks / bank account verification ─────────────────────────────────────
  // NOTE: These intentionally bypass the global call() wrapper so that a
  // Paystack-not-connected error does NOT set the global error banner in App.vue.
  // Each calling component (EmployeeProfile) handles errors locally.
  const getBanks          = async () => (await api.get('/banks')).data.data;
  const verifyBankAccount = async (employeeId, d) => (await api.post(`/employees/${employeeId}/verify-bank-account`, d)).data.data;

  // ── Performance Cycles ────────────────────────────────────────────────────
  const getPerformanceCycles  = () => call(async () => (await api.get('/performance-cycles')).data.data);
  const createPerformanceCycle = (d) => call(async () => (await api.post('/performance-cycles', d)).data.data);
  const updatePerformanceCycle = (id, d) => call(async () => (await api.put(`/performance-cycles/${id}`, d)).data.data);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const getKpis             = () => call(async () => (await api.get('/kpis')).data.data);
  const createKpi           = (d) => call(async () => (await api.post('/kpis', d)).data.data);
  const updateKpi           = (id, d) => call(async () => (await api.put(`/kpis/${id}`, d)).data.data);
  const submitKpiSelfReview    = (id, d) => call(async () => (await api.put(`/kpis/${id}/self-review`, d)).data.data);
  const submitKpiManagerReview = (id, d) => call(async () => (await api.put(`/kpis/${id}/manager-review`, d)).data.data);
  const getKpiSummary          = (cycleId) => call(async () => (await api.get('/kpis/summary', { params: { cycleId } })).data.data);

  // ── Compliance ────────────────────────────────────────────────────────────
  const getCompliances      = () => call(async () => (await api.get('/compliance')).data.data);
  const createCompliance    = (d) => call(async () => (await api.post('/compliance', d)).data.data);
  const seedComplianceDefaults = () => call(async () => (await api.post('/compliance/seed-defaults')).data);
  const updateCompliance    = (id, d) => call(async () => (await api.put(`/compliance/${id}`, d)).data.data);

  // ── Documents ─────────────────────────────────────────────────────────────
  const getDocuments        = () => call(async () => (await api.get('/documents')).data.data);
  const createDocument      = (d) => call(async () => (await api.post('/documents', d)).data.data);
  const updateDocument      = (id, d) => call(async () => (await api.put(`/documents/${id}`, d)).data.data);

  // ── Onboarding ────────────────────────────────────────────────────────────
  const getOnboardings      = () => call(async () => (await api.get('/onboarding')).data.data);
  const createOnboarding    = (d) => call(async () => (await api.post('/onboarding', d)).data.data);
  const updateOnboardingTask = (id, taskId, d) => call(async () => (await api.put(`/onboarding/${id}/task/${taskId}`, d)).data.data);
  const addOnboardingTask   = (id, d) => call(async () => (await api.post(`/onboarding/${id}/task`, d)).data.data);
  const updateOnboardingStage = (id, stage) => call(async () => (await api.put(`/onboarding/${id}/stage`, { stage })).data.data);
  const deleteOnboarding    = (id) => call(async () => (await api.delete(`/onboarding/${id}`)).data);

  // ── Probation ─────────────────────────────────────────────────────────────
  const getProbations       = () => call(async () => (await api.get('/probation')).data.data);
  const createProbation     = (d) => call(async () => (await api.post('/probation', d)).data.data);
  const recordProbationOutcome = (id, d) => call(async () => (await api.put(`/probation/${id}/outcome`, d)).data.data);

  // ── Employment History ────────────────────────────────────────────────────
  const getEmploymentHistories  = () => call(async () => (await api.get('/employment-history')).data.data);
  const createEmploymentHistory = (d) => call(async () => (await api.post('/employment-history', d)).data.data);

  // ── Requisitions ──────────────────────────────────────────────────────────
  const getRequisitions     = () => call(async () => (await api.get('/requisitions')).data.data);
  const createRequisition   = (d) => call(async () => (await api.post('/requisitions', d)).data.data);
  const updateRequisitionStatus = (id, status) => call(async () => (await api.put(`/requisitions/${id}`, { status })).data.data);
  const getRequisitionAttachmentImageBlob = (reqId, attachmentId) =>
    call(async () => (await api.get(`/requisitions/${reqId}/attachments/${attachmentId}/image`, { responseType: 'blob' })).data);

  // ── Redeployments ─────────────────────────────────────────────────────────
  const getRedeployments    = () => call(async () => (await api.get('/redeployments')).data.data);
  const createRedeployment  = (d) => call(async () => (await api.post('/redeployments', d)).data.data);
  const completeRedeployment = (id) => call(async () => (await api.put(`/redeployments/${id}/complete`)).data.data);

  // ── Exit Management ───────────────────────────────────────────────────────
  const getExits            = () => call(async () => (await api.get('/exits')).data.data);
  const initiateExit        = (d) => call(async () => (await api.post('/exits', d)).data.data);
  const updateClearanceTask = (recordId, taskId, d) => call(async () => (await api.put(`/exits/${recordId}/tasks/${taskId}`, d)).data.data);
  const completeExit        = (id) => call(async () => (await api.put(`/exits/${id}/complete`)).data.data);

  // ── Disciplinary ──────────────────────────────────────────────────────────
  const getCases            = () => call(async () => (await api.get('/disciplinary')).data.data);
  const createCase          = (d) => call(async () => (await api.post('/disciplinary', d)).data.data);
  const addCaseAction       = (id, d) => call(async () => (await api.post(`/disciplinary/${id}/action`, d)).data.data);

  // ── Benefits ──────────────────────────────────────────────────────────────
  const getBenefits         = () => call(async () => (await api.get('/benefits')).data.data);
  const initBenefitRecord   = (d) => call(async () => (await api.post('/benefits', d)).data.data);
  const updateBenefit       = (id, d) => call(async () => (await api.put(`/benefits/${id}`, d)).data.data);

  // ── Helpdesk ──────────────────────────────────────────────────────────────
  const getTickets          = () => call(async () => (await api.get('/tickets')).data.data);
  const createTicket        = (d) => call(async () => (await api.post('/tickets', d)).data.data);
  const updateTicket        = (id, d) => call(async () => (await api.put(`/tickets/${id}`, d)).data.data);
  const addTicketMessage    = (id, d) => call(async () => (await api.post(`/tickets/${id}/message`, d)).data.data);

  // ── Job Architecture ──────────────────────────────────────────────────────
  const getJobArchitecture  = () => call(async () => (await api.get('/job-architecture')).data.data);
  const createJobFamily     = (d) => call(async () => (await api.post('/job-architecture/family', d)).data.data);
  const createJobRole       = (d) => call(async () => (await api.post('/job-architecture/role', d)).data.data);

  // ── Positions ─────────────────────────────────────────────────────────────
  const getPositions        = () => call(async () => (await api.get('/positions')).data.data);
  const createPosition      = (d) => call(async () => (await api.post('/positions', d)).data.data);
  const updatePosition      = (id, d) => call(async () => (await api.put(`/positions/${id}`, d)).data.data);

  // ── Internal Jobs ─────────────────────────────────────────────────────────
  const getInternalJobs     = () => call(async () => (await api.get('/internal-jobs')).data.data);
  const createInternalJob   = (d) => call(async () => (await api.post('/internal-jobs', d)).data.data);
  const applyForJob         = (id, d) => call(async () => (await api.post(`/internal-jobs/${id}/apply`, d)).data.data);
  const referCandidate      = (id, d) => call(async () => (await api.post(`/internal-jobs/${id}/refer`, d)).data.data);

  // ── Training ──────────────────────────────────────────────────────────────
  const getTrainingCourses      = () => call(async () => (await api.get('/trainings')).data.data);
  const createTrainingCourse    = (d) => call(async () => (await api.post('/trainings', d)).data.data);
  const enrollEmployee          = (id, d) => call(async () => (await api.post(`/trainings/${id}/enroll`, d)).data.data);
  const updateEnrollmentStatus  = (cId, eId, d) => call(async () => (await api.put(`/trainings/${cId}/enrollments/${eId}`, d)).data.data);

  // ── Attendance ────────────────────────────────────────────────────────────
  const getMyAttendance     = () => call(async () => (await api.get('/attendance/me')).data.data);
  const clockIn             = (d) => call(async () => (await api.post('/attendance/clock-in', d)).data.data);
  const clockOut            = (d) => call(async () => (await api.post('/attendance/clock-out', d)).data.data);
  const getAttendanceToday  = () => call(async () => (await api.get('/attendance/today')).data.data);

  // ── Audit Log ─────────────────────────────────────────────────────────────
  const getAuditLog = () => call(async () => (await api.get('/audit-log')).data.data);

  // ── Activity (in-app active-time tracking) ────────────────────────────────
  // pingActivity intentionally bypasses the global call() wrapper — it's a
  // silent background heartbeat, so a transient failure shouldn't ever pop
  // the app's global error banner in front of the employee.
  const pingActivity     = async () => (await api.post('/activity/ping')).data.data;
  const getMyActivity    = (days) => call(async () => (await api.get('/activity/me', { params: days ? { days } : {} })).data.data);
  const getTeamActivity  = (date) => call(async () => (await api.get('/activity/team', { params: date ? { date } : {} })).data.data);

  // ── Monitoring (desktop agent — optional screenshot capture) ─────────────
  const getMonitoringSettings    = () => call(async () => (await api.get('/monitoring/settings')).data.data);
  const updateMonitoringSettings = (d) => call(async () => (await api.put('/monitoring/settings', d)).data);
  const getScreenshots           = (params) => call(async () => (await api.get('/monitoring/screenshots', { params })).data.data);
  const getScreenshotImageBlob   = (id) => call(async () => (await api.get(`/monitoring/screenshots/${id}/image`, { responseType: 'blob' })).data);
  const deleteScreenshot         = (id) => call(async () => (await api.delete(`/monitoring/screenshots/${id}`)).data);

  // ── Notifications ─────────────────────────────────────────────────────────
  const getNotifications        = () => call(async () => (await api.get('/notifications')).data.data);
  const markNotificationRead    = (id) => call(async () => (await api.put(`/notifications/${id}/read`)).data.data);
  const markAllNotificationsRead = () => call(async () => (await api.put('/notifications/read-all')).data);

  // ── Privacy consent (NDPA) ───────────────────────────────────────────────
  const setPrivacyConsent = (version) => call(async () => (await api.put('/auth/consent', { version })).data.data);

  // ── Data Subject Requests (NDPA access/correction/erasure) ─────────────────
  const exportMyData        = () => call(async () => (await api.get('/employees/me/data-export')).data.data);
  const createDsarRequest   = (d) => call(async () => (await api.post('/dsar-requests', d)).data.data);
  const getDsarRequests     = () => call(async () => (await api.get('/dsar-requests')).data.data);
  const updateDsarRequest   = (id, d) => call(async () => (await api.put(`/dsar-requests/${id}`, d)).data.data);

  // ── Data Retention ──────────────────────────────────────────────────────
  const getRetentionSettings    = () => call(async () => (await api.get('/retention-settings')).data.data);
  const updateRetentionSettings = (offboardedRetentionYears) => call(async () => (await api.put('/retention-settings', { offboardedRetentionYears })).data.data);
  const getRetentionCandidates  = () => call(async () => (await api.get('/retention/candidates')).data.data);
  const anonymizeEmployee       = (id) => call(async () => (await api.post(`/employees/${id}/anonymize`)).data);

  return {
    // State
    tenants, activeTenant, authUser, apiHealth, isLoading, error,
    // Auth & tenant
    setActiveTenant, setAuthUser, restoreAuth, checkHealth, fetchTenants,
    registerTenant, loginUser, verifyLoginOtp, changePassword, forgotPassword, resetPasswordRequest, setTwoFactor,
    // Platform (root) admin
    platformAdmin, restorePlatformAdmin, platformLogin, platformLogout,
    getPlatformTenants, getPlatformTenantDetail, impersonateTenant, setTenantTestAccount,
    // Modules
    getDashboardStats,
    getShoutouts, createShoutout, reactToShoutout,
    getEmployees, getDirectoryLite, getMe, getEmployee, createEmployee, bulkCreateEmployees, updateEmployee, updateEmployeeManager,
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getLeaves, createLeave, updateLeaveStatus, getLeavePolicy, updateLeavePolicy,
    getPayslips, createPayslip, bulkGeneratePayslips, downloadPayslipPdf, downloadRemittanceReport, payPayslip, payPayslipBatch, finalizePayslipPayment, resetStuckPayment,
    getTenantPlan, upgradeTenantPlan,
    getWallet, setupWallet, setWalletDualApproval, setPayrollSchedule, getWalletTransactions,
    getPayrollApprovals, approvePayrollApproval, rejectPayrollApproval,
    getBanks, verifyBankAccount,
    getPerformanceCycles, createPerformanceCycle, updatePerformanceCycle,
    getKpis, createKpi, updateKpi, submitKpiSelfReview, submitKpiManagerReview, getKpiSummary,
    getCompliances, createCompliance, seedComplianceDefaults, updateCompliance,
    getDocuments, createDocument, updateDocument,
    getOnboardings, createOnboarding, updateOnboardingTask, addOnboardingTask, updateOnboardingStage, deleteOnboarding,
    getProbations, createProbation, recordProbationOutcome,
    getEmploymentHistories, createEmploymentHistory,
    getRequisitions, createRequisition, updateRequisitionStatus, getRequisitionAttachmentImageBlob,
    getRedeployments, createRedeployment, completeRedeployment,
    getExits, initiateExit, updateClearanceTask, completeExit,
    getCases, createCase, addCaseAction,
    getBenefits, initBenefitRecord, updateBenefit,
    getTickets, createTicket, updateTicket, addTicketMessage,
    getJobArchitecture, createJobFamily, createJobRole,
    getPositions, createPosition, updatePosition,
    getInternalJobs, createInternalJob, applyForJob, referCandidate,
    getTrainingCourses, createTrainingCourse, enrollEmployee, updateEnrollmentStatus,
    getMyAttendance, clockIn, clockOut, getAttendanceToday,
    getAuditLog,
    pingActivity, getMyActivity, getTeamActivity,
    getMonitoringSettings, updateMonitoringSettings, getScreenshots, getScreenshotImageBlob, deleteScreenshot,
    getNotifications, markNotificationRead, markAllNotificationsRead,
    exportMyData, createDsarRequest, getDsarRequests, updateDsarRequest,
    setPrivacyConsent,
    getRetentionSettings, updateRetentionSettings, getRetentionCandidates, anonymizeEmployee,
  };
}
