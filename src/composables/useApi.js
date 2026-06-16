import { ref } from 'vue';
import axios from 'axios';

// ── Singleton state ───────────────────────────────────────────────────────────
const tenants    = ref([]);
const activeTenant = ref(null);
const authUser   = ref(null);
const apiHealth  = ref({ status: 'unknown', message: '' });
const isLoading  = ref(false);
const error      = ref(null);

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'https://hrms-x.onrender.com/api', headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(config => {
  if (activeTenant.value?._id) config.headers['X-Tenant-ID'] = activeTenant.value._id;
  if (authUser.value?.token)   config.headers['Authorization'] = `Bearer ${authUser.value.token}`;
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

  const checkHealth = async () => {
    try {
      const r = await axios.get('/api/health');
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
      setAuthUser(r.data.data);
      setActiveTenant(r.data.data.tenant);
      return r.data.data;
    }).finally(() => { isLoading.value = false; });
  };

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const getDashboardStats = () => call(async () => (await api.get('/dashboard/stats')).data.data);

  // ── Employees ──────────────────────────────────────────────────────────────
  const getEmployees        = () => call(async () => (await api.get('/employees')).data.data);
  const getMe               = () => call(async () => (await api.get('/employees/me')).data.data);
  const getEmployee         = (id) => call(async () => (await api.get(`/employees/${id}`)).data.data);
  const createEmployee      = (d) => call(async () => (await api.post('/employees', d)).data.data);
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

  // ── Payslips ──────────────────────────────────────────────────────────────
  const getPayslips         = () => call(async () => (await api.get('/payslips')).data.data);
  const createPayslip       = (d) => call(async () => (await api.post('/payslips', d)).data.data);

  // ── Performance Cycles ────────────────────────────────────────────────────
  const getPerformanceCycles  = () => call(async () => (await api.get('/performance-cycles')).data.data);
  const createPerformanceCycle = (d) => call(async () => (await api.post('/performance-cycles', d)).data.data);
  const updatePerformanceCycle = (id, d) => call(async () => (await api.put(`/performance-cycles/${id}`, d)).data.data);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const getKpis             = () => call(async () => (await api.get('/kpis')).data.data);
  const createKpi           = (d) => call(async () => (await api.post('/kpis', d)).data.data);
  const updateKpi           = (id, d) => call(async () => (await api.put(`/kpis/${id}`, d)).data.data);

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
  const updateOnboardingStage = (id, stage) => call(async () => (await api.put(`/onboarding/${id}/stage`, { stage })).data.data);

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

  return {
    // State
    tenants, activeTenant, authUser, apiHealth, isLoading, error,
    // Auth & tenant
    setActiveTenant, setAuthUser, restoreAuth, checkHealth, fetchTenants,
    registerTenant, loginUser,
    // Modules
    getDashboardStats,
    getEmployees, getMe, getEmployee, createEmployee, updateEmployee, updateEmployeeManager,
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getLeaves, createLeave, updateLeaveStatus,
    getPayslips, createPayslip,
    getPerformanceCycles, createPerformanceCycle, updatePerformanceCycle,
    getKpis, createKpi, updateKpi,
    getCompliances, createCompliance, seedComplianceDefaults, updateCompliance,
    getDocuments, createDocument, updateDocument,
    getOnboardings, createOnboarding, updateOnboardingTask, updateOnboardingStage,
    getProbations, createProbation, recordProbationOutcome,
    getEmploymentHistories, createEmploymentHistory,
    getRequisitions, createRequisition, updateRequisitionStatus,
    getRedeployments, createRedeployment, completeRedeployment,
    getExits, initiateExit, updateClearanceTask, completeExit,
    getCases, createCase, addCaseAction,
    getBenefits, initBenefitRecord, updateBenefit,
    getTickets, createTicket, updateTicket, addTicketMessage,
    getJobArchitecture, createJobFamily, createJobRole,
    getPositions, createPosition, updatePosition,
    getInternalJobs, createInternalJob, applyForJob, referCandidate,
    getTrainingCourses, createTrainingCourse, enrollEmployee, updateEnrollmentStatus,
  };
}
