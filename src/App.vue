<template>
  <!-- ── Landing / Auth ──────────────────────────────────────────────────── -->
  <template v-if="showLanding">
    <LandingPage
      :isDark="isDark"
      @toggle-theme="toggleTheme"
      @open-auth="showAuthModal = true"
    />

    <AuthModal
      v-if="showAuthModal"
      @close="showAuthModal = false"
      @success="handleAuthSuccess"
    />
  </template>



  <!-- ── Main Dashboard ───────────────────────────────────────────────────── -->
  <div v-else class="flex min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200">
    <Sidebar
      v-model:activeTab="activeTab"
      :apiHealth="apiHealth"
      :userRole="authUser?.role"
      @logout="handleLogout"
    />

    <main class="flex-1 flex flex-col min-w-0">
      <!-- Top bar -->
      <header class="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <div class="flex items-center gap-3">
          <button @click="toggleTheme" class="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-500">
            <Sun v-if="isDark" class="w-4 h-4" /><Moon v-else class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-3">
            <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">HRMS X</span>
            <span class="text-zinc-300 dark:text-zinc-700">/</span>
            <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ currentTabLabel }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-zinc-500">{{ activeTenant?.name }}</span>
          <div class="w-7 h-7 rounded-full bg-lime-500 flex items-center justify-center text-black font-bold text-xs">
            {{ authUser?.name?.charAt(0)?.toUpperCase() || '?' }}
          </div>
          <div class="text-right">
            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ authUser?.name }}</p>
            <p class="text-[10px] font-mono text-zinc-400">{{ authUser?.role }}</p>
          </div>
        </div>
      </header>

      <!-- Content area -->
      <div class="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
        <!-- Error banner -->
        <div v-if="error" class="mb-5 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs font-mono flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" /><span>{{ error }}</span>
        </div>

        <!-- Loading -->
        <div v-if="isLoading && !isRefreshing" class="flex flex-col items-center justify-center py-24">
          <div class="w-7 h-7 border-2 border-zinc-200 dark:border-zinc-800 border-t-lime-500 rounded-full animate-spin"></div>
          <p class="text-xs text-zinc-500 mt-3 font-mono">Loading...</p>
        </div>

        <template v-else>
          <!-- Dashboard -->
          <div v-if="activeTab === 'dashboard'">
            <EmployeeDashboard v-if="authUser?.role === 'Employee'" :authUser="authUser" :dashboardData="dashboardStats" @navigate="activeTab = $event" />
            <StatsGrid v-else :stats="dashboardStats || {}" />
          </div>

          <!-- Profile (ESS) -->
          <EmployeeProfile
            v-else-if="activeTab === 'profile'"
            :employee="myProfile"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Employees (HR) -->
          <EmployeeTab
            v-else-if="activeTab === 'employees'"
            :employees="employees"
            :departments="departments"
            @refresh="loadAllData(true)"
          />

          <!-- Onboarding -->
          <OnboardingTab
            v-else-if="activeTab === 'onboarding'"
            :onboardings="onboardings"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Probation -->
          <ProbationTab
            v-else-if="activeTab === 'probation'"
            :probations="probations"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Leave -->
          <LeavesTab
            v-else-if="activeTab === 'leaves'"
            :leaves="leaves"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Payroll -->
          <PayrollTab
            v-else-if="activeTab === 'payroll'"
            :payslips="payslips"
            :employees="employees"
            :authUser="authUser"
            :tenantName="activeTenant?.name || ''"
            @refresh="loadAllData(true)"
          />

          <!-- KPIs / Performance -->
          <OrgTab
            v-else-if="activeTab === 'org'"
            :kpis="kpis"
            :performanceCycles="performanceCycles"
            :employees="employees"
            :departments="departments"
            :authUser="authUser"
            :tenant="activeTenant"
            @refresh="loadAllData(true)"
          />

          <!-- Departments -->
          <DepartmentsTab
            v-else-if="activeTab === 'departments'"
            :departments="departments"
            :employees="employees"
            @refresh="loadAllData(true)"
          />

          <!-- Requisitions -->
          <RequisitionTab
            v-else-if="activeTab === 'requisitions'"
            :requisitions="requisitions"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Transfers -->
          <RedeploymentTab
            v-else-if="activeTab === 'redeployments'"
            :redeployments="redeployments"
            :employees="employees"
            @refresh="loadAllData(true)"
          />

          <!-- Exit -->
          <ExitTab
            v-else-if="activeTab === 'exits'"
            :exits="exits"
            :employees="employees"
            @refresh="loadAllData(true)"
          />

          <!-- Benefits -->
          <BenefitsTab
            v-else-if="activeTab === 'benefits'"
            :benefits="benefits"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Training -->
          <TrainingTab
            v-else-if="activeTab === 'trainings'"
            :trainings="trainings"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Internal Jobs -->
          <InternalJobsTab
            v-else-if="activeTab === 'internal-jobs'"
            :internalJobs="internalJobs"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Disciplinary -->
          <DisciplinaryTab
            v-else-if="activeTab === 'disciplinary'"
            :cases="disciplinaryCases"
            :employees="employees"
            @refresh="loadAllData(true)"
          />

          <!-- Helpdesk -->
          <HelpdeskTab
            v-else-if="activeTab === 'helpdesk'"
            :tickets="tickets"
            :employees="employees"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Documents -->
          <DocumentsTab
            v-else-if="activeTab === 'documents'"
            :documents="documents"
            :authUser="authUser"
            @refresh="loadAllData(true)"
          />

          <!-- Compliance -->
          <ComplianceTab
            v-else-if="activeTab === 'compliance'"
            :compliances="compliances"
            @refresh="loadAllData(true)"
          />

          <!-- Employment History -->
          <div v-else-if="activeTab === 'employment-history'" class="space-y-4">
            <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-50">Employment History</h2>
            <p class="text-sm text-zinc-500">{{ employmentHistories.length }} records.</p>
          </div>

          <!-- Positions -->
          <PositionTab
            v-else-if="activeTab === 'positions'"
            :positions="positions"
            :roles="jobRoles"
            @refresh="loadAllData(true)"
          />

          <!-- Job Architecture -->
          <JobArchitectureTab
            v-else-if="activeTab === 'job-architecture'"
            :jobArchitecture="jobArchitecture"
            @refresh="loadAllData(true)"
          />
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useApi } from './composables/useApi';
import { AlertCircle, Sun, Moon } from 'lucide-vue-next';

// Components
import Sidebar from './components/Sidebar.vue';
import LandingPage from './components/LandingPage.vue';
import AuthModal from './components/AuthModal.vue';
import StatsGrid from './components/StatsGrid.vue';
import EmployeeDashboard from './components/EmployeeDashboard.vue';
import EmployeeProfile from './components/EmployeeProfile.vue';
import EmployeeTab from './components/EmployeeTab.vue';
import LeavesTab from './components/LeavesTab.vue';
import PayrollTab from './components/PayrollTab.vue';
import OnboardingTab from './components/OnboardingTab.vue';
import ProbationTab from './components/ProbationTab.vue';
import RequisitionTab from './components/RequisitionTab.vue';
import RedeploymentTab from './components/RedeploymentTab.vue';
import ExitTab from './components/ExitTab.vue';
import DisciplinaryTab from './components/DisciplinaryTab.vue';
import BenefitsTab from './components/BenefitsTab.vue';
import HelpdeskTab from './components/HelpdeskTab.vue';
import DocumentsTab from './components/DocumentsTab.vue';
import ComplianceTab from './components/ComplianceTab.vue';
import PositionTab from './components/PositionTab.vue';
import JobArchitectureTab from './components/JobArchitectureTab.vue';
import InternalJobsTab from './components/InternalJobsTab.vue';
import TrainingTab from './components/TrainingTab.vue';
import OrgTab from './components/OrgTab.vue';
import DepartmentsTab from './components/DepartmentsTab.vue';

const {
  tenants, activeTenant, authUser, apiHealth, isLoading, error,
  setAuthUser, restoreAuth, checkHealth, fetchTenants,
  getDashboardStats, getEmployees, getMe, getLeaves, getPayslips, getKpis,
  getCompliances, getDocuments, getOnboardings, getProbations, getEmploymentHistories,
  getRequisitions, getRedeployments, getExits, getCases, getBenefits, getTickets,
  getJobArchitecture, getPositions, getInternalJobs, getTrainingCourses, getDepartments
} = useApi();

// UI state
const showLanding   = ref(true);
const showAuthModal = ref(false);
const activeTab     = ref('dashboard');
const isRefreshing  = ref(false);
const isDark        = ref(true);

// Data stores
const dashboardStats      = ref(null);
const myProfile           = ref(null);
const employees           = ref([]);
const leaves              = ref([]);
const payslips            = ref([]);
const kpis                = ref([]);
const performanceCycles   = ref([]);
const compliances         = ref([]);
const documents           = ref([]);
const onboardings         = ref([]);
const probations          = ref([]);
const employmentHistories = ref([]);
const requisitions        = ref([]);
const redeployments       = ref([]);
const exits               = ref([]);
const disciplinaryCases   = ref([]);
const benefits            = ref([]);
const tickets             = ref([]);
const jobArchitecture     = ref({ families: [], roles: [] });
const jobRoles            = ref([]);
const positions           = ref([]);
const internalJobs        = ref([]);
const trainings           = ref([]);
const departments         = ref([]);

const isHR = computed(() => authUser.value?.role !== 'Employee');

const TAB_LABELS = {
  dashboard: 'Dashboard', profile: 'My Profile', employees: 'Employee Directory',
  onboarding: 'Onboarding', probation: 'Probation Tracker', leaves: 'Leave Management',
  payroll: 'Payroll & Payslips', org: 'KPIs & Performance', requisitions: 'Requisitions',
  redeployments: 'Internal Transfers', exits: 'Exit & Offboarding', benefits: 'Benefits',
  trainings: 'Training', 'internal-jobs': 'Internal Jobs', disciplinary: 'Disciplinary',
  helpdesk: 'HR Helpdesk', documents: 'Documents', compliance: 'Compliance Calendar',
  'employment-history': 'Employment History', positions: 'Positions',
  'job-architecture': 'Job Architecture', departments: 'Departments & Hierarchy'
};
const currentTabLabel = computed(() => TAB_LABELS[activeTab.value] || activeTab.value);

// Load all data for the active tenant
const loadAllData = async (refreshOnly = false) => {
  if (!activeTenant.value || !authUser.value) return;
  if (!refreshOnly) isLoading.value = true;
  else isRefreshing.value = true;

  try {
    // Always load
    const [stats, leavesData, payslipsData, kpisData, cyclesData, ticketsData, benefitsData, trainingsData, jobsData, emps] = await Promise.all([
      getDashboardStats(),
      getLeaves(),
      getPayslips(),
      getKpis(),
      getPerformanceCycles(),
      getTickets(),
      getBenefits(),
      getTrainingCourses(),
      getInternalJobs(),
      getEmployees()
    ]);

    dashboardStats.value    = stats;
    leaves.value            = leavesData;
    payslips.value          = payslipsData;
    kpis.value              = kpisData;
    performanceCycles.value = cyclesData;
    tickets.value           = ticketsData;
    benefits.value          = benefitsData;
    trainings.value         = trainingsData;
    internalJobs.value      = jobsData;
    employees.value         = emps;

    // Load ESS profile
    if (authUser.value?.role === 'Employee') {
      myProfile.value = await getMe();
      onboardings.value = await getOnboardings();
      probations.value  = await getProbations();
      documents.value   = await getDocuments();
      requisitions.value = await getRequisitions();
    }

    // HR-only data
    if (isHR.value) {
      const [onbs, probs, reqs, redeps, exs, cases, comps, docs,
             hist, ja, pos, depts] = await Promise.all([
        getOnboardings(), getProbations(), getRequisitions(),
        getRedeployments(), getExits(), getCases(), getCompliances(), getDocuments(),
        getEmploymentHistories(), getJobArchitecture(), getPositions(), getDepartments()
      ]);
      onboardings.value         = onbs;
      probations.value          = probs;
      requisitions.value        = reqs;
      redeployments.value       = redeps;
      exits.value               = exs;
      disciplinaryCases.value   = cases;
      compliances.value         = comps;
      documents.value           = docs;
      employmentHistories.value = hist;
      jobArchitecture.value     = ja || { families: [], roles: [] };
      jobRoles.value            = ja?.roles || [];
      positions.value           = pos;
      departments.value         = depts;
    }

    error.value = null;
  } catch (e) {
    console.error('loadAllData error:', e);
  } finally {
    isLoading.value  = false;
    isRefreshing.value = false;
  }
};

const toggleTheme = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const handleAuthSuccess = () => {
  showAuthModal.value = false;
  showLanding.value = false;
};

const handleLogout = () => {
  setAuthUser(null);
  activeTenant.value = null;
  localStorage.removeItem('hrms_tenant_id');
  showLanding.value = true;
  activeTab.value = 'dashboard';
};

watch(activeTenant, () => {
  if (activeTenant.value && authUser.value) loadAllData();
});

onMounted(async () => {
  const saved = localStorage.getItem('theme');
  isDark.value = saved !== 'light';
  document.documentElement.classList.toggle('dark', isDark.value);

  restoreAuth();
  await checkHealth();
  await fetchTenants();

  if (localStorage.getItem('hrms_tenant_id') && activeTenant.value && authUser.value?.token) {
    showLanding.value = false;
  }
});
</script>
