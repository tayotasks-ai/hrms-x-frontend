<template>
  <!-- ── Platform (root) admin — reached only via #platform, no public link ── -->
  <PlatformView v-if="isPlatformRoute" @exit="handleExitPlatformRoute" @impersonated="handleImpersonated" />

  <!-- ── Landing / Auth ──────────────────────────────────────────────────── -->
  <template v-else-if="showLanding">
    <LandingPage
      :isDark="isDark"
      @toggle-theme="toggleTheme"
      @open-auth="showAuthModal = true"
    />

    <AuthModal
      v-if="showAuthModal"
      :initialView="authModalView"
      :presetToken="presetResetToken"
      :presetEmail="presetResetEmail"
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
            <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">WorkDesk</span>
            <span class="text-zinc-300 dark:text-zinc-700">/</span>
            <span class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ currentTabLabel }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs font-mono text-zinc-500">{{ activeTenant?.name }}</span>
          <NotificationBell @navigate="activeTab = $event" />
          <button
            @click="showChangePasswordModal = true"
            class="flex items-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-full pr-2 -mr-2 py-0.5 transition cursor-pointer"
            title="Change password"
          >
            <span class="relative">
              <span class="w-7 h-7 rounded-full bg-lime-500 flex items-center justify-center text-black font-bold text-xs">
                {{ authUser?.name?.charAt(0)?.toUpperCase() || '?' }}
              </span>
              <span v-if="authUser?.isDefaultPassword" class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-zinc-950"></span>
            </span>
            <span class="text-right">
              <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ authUser?.name }}</p>
              <p class="text-[10px] font-mono text-zinc-400">{{ authUser?.role }}</p>
            </span>
          </button>
        </div>
      </header>

      <!-- Platform-admin impersonation banner — see PlatformView.vue. Purely a
           client-side flag (not derived from the JWT); the actual access
           control lives server-side via the short-lived impersonation token
           and ImpersonationLog audit trail. -->
      <div v-if="impersonating" class="bg-amber-500 text-amber-950 px-6 py-2 text-xs font-mono flex items-center justify-between gap-3">
        <span>Viewing <strong>{{ impersonating.tenantName }}</strong> as platform support ({{ impersonating.platformAdminName }}) — session ends {{ new Date(impersonating.expiresAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) }}</span>
        <button @click="handleExitImpersonation" class="underline hover:no-underline shrink-0">Exit</button>
      </div>

      <ChangePasswordModal
        v-if="showChangePasswordModal"
        :isDefaultPassword="!!authUser?.isDefaultPassword"
        :initialTwoFactorEnabled="!!authUser?.twoFactorEnabled"
        @close="showChangePasswordModal = false"
        @changed="handlePasswordChanged"
        @twoFactorChanged="handleTwoFactorChanged"
      />

      <!-- Blocking until accepted — no close button. Only applies to Employee
           accounts; re-shows automatically if PRIVACY_NOTICE_VERSION is bumped. -->
      <PrivacyConsentModal
        v-if="needsPrivacyConsent"
        :version="PRIVACY_NOTICE_VERSION"
        @accepted="handlePrivacyConsentAccepted"
      />

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
            <EmployeeDashboard v-if="authUser?.role === 'Employee'" :authUser="authUser" :dashboardData="dashboardStats" :shoutouts="shoutouts" @navigate="activeTab = $event" @refresh="loadAllData(true)" />
            <StatsGrid v-else :stats="dashboardStats || {}" :shoutouts="shoutouts" :authUser="authUser" @navigate="activeTab = $event" @refresh="loadAllData(true)" />
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

          <!-- Attendance (HR only) -->
          <AttendanceTab
            v-else-if="activeTab === 'attendance'"
            :employees="employees"
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
            :departments="departments"
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
            :departments="departments"
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

          <!-- Audit Log -->
          <AuditLogTab v-else-if="activeTab === 'audit-log'" />

          <!-- Payroll Wallet (HR only) -->
          <WalletTab v-else-if="activeTab === 'wallet'" />
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useApi } from './composables/useApi';
import { useActivityTracker } from './composables/useActivityTracker';
import { AlertCircle, Sun, Moon } from 'lucide-vue-next';

// Components
import Sidebar from './components/Sidebar.vue';
import PlatformView from './components/PlatformView.vue';
import LandingPage from './components/LandingPage.vue';
import AuthModal from './components/AuthModal.vue';
import ChangePasswordModal from './components/ChangePasswordModal.vue';
import PrivacyConsentModal from './components/PrivacyConsentModal.vue';
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
import AttendanceTab from './components/AttendanceTab.vue';
import AuditLogTab from './components/AuditLogTab.vue';
import WalletTab from './components/WalletTab.vue';
import NotificationBell from './components/NotificationBell.vue';

const {
  tenants, activeTenant, authUser, apiHealth, isLoading, error,
  setAuthUser, restoreAuth, checkHealth, fetchTenants,
  getDashboardStats, getEmployees, getMe, getLeaves, getPayslips, getKpis,
  getCompliances, getDocuments, getOnboardings, getProbations, getEmploymentHistories,
  getRequisitions, getRedeployments, getExits, getCases, getBenefits, getTickets,
  getJobArchitecture, getPositions, getInternalJobs, getTrainingCourses, getDepartments,
  getPerformanceCycles, getShoutouts, pingActivity
} = useApi();

const { start: startActivityTracker, stop: stopActivityTracker } = useActivityTracker(pingActivity);

// UI state
// Reached only by typing/bookmarking #platform directly — deliberately no
// visible link from the public landing page. See PlatformView.vue.
const isPlatformRoute = ref(window.location.hash === '#platform');

// Decide synchronously, before first paint, whether a stored session already
// exists — previously showLanding defaulted to true and only flipped to
// false at the very end of onMounted (after awaiting checkHealth() then
// fetchTenants()), so every hard refresh briefly rendered the Landing Page
// first, even mid-session on an arbitrary tab. Checking localStorage here
// is instant and needs no network round trip, so a returning user goes
// straight to the loading dashboard shell instead of flashing to Landing.
const hasStoredSession = () => {
  try {
    const token = JSON.parse(localStorage.getItem('hrms_auth_user') || 'null')?.token;
    return !!(token && localStorage.getItem('hrms_tenant_id'));
  } catch {
    return false;
  }
};
const showLanding   = ref(!hasStoredSession());
const showAuthModal = ref(false);
const activeTab     = ref('dashboard');
const isRefreshing  = ref(false);
const isDark        = ref(true);
const authModalView       = ref('login');
const presetResetToken    = ref('');
const presetResetEmail    = ref('');
const showChangePasswordModal = ref(false);

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
const shoutouts           = ref([]);

const isHR = computed(() => authUser.value?.role !== 'Employee');

const TAB_LABELS = {
  dashboard: 'Dashboard', profile: 'My Profile', employees: 'Employee Directory',
  onboarding: 'Onboarding', probation: 'Probation Tracker', leaves: 'Leave Management',
  attendance: 'Attendance', payroll: 'Payroll & Payslips', org: 'KPIs & Performance', requisitions: 'Requisitions',
  redeployments: 'Internal Transfers', exits: 'Exit & Offboarding', benefits: 'Benefits',
  trainings: 'Training', 'internal-jobs': 'Internal Jobs', disciplinary: 'Disciplinary',
  helpdesk: 'HR Helpdesk', documents: 'Documents', compliance: 'Compliance Calendar',
  'employment-history': 'Employment History', positions: 'Positions',
  'job-architecture': 'Job Architecture', departments: 'Departments & Hierarchy',
  'audit-log': 'Audit Log', 'wallet': 'Payroll Wallet'
};
const currentTabLabel = computed(() => TAB_LABELS[activeTab.value] || activeTab.value);

// Load all data for the active tenant
const loadAllData = async (refreshOnly = false) => {
  if (!activeTenant.value || !authUser.value) return;
  if (!refreshOnly) isLoading.value = true;
  else isRefreshing.value = true;

  try {
    // Always load
    const [stats, leavesData, payslipsData, kpisData, cyclesData, ticketsData, benefitsData, trainingsData, jobsData, emps, shoutoutsData] = await Promise.all([
      getDashboardStats(),
      getLeaves(),
      getPayslips(),
      getKpis(),
      getPerformanceCycles(),
      getTickets(),
      getBenefits(),
      getTrainingCourses(),
      getInternalJobs(),
      getEmployees(),
      getShoutouts()
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
    shoutouts.value         = shoutoutsData;

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
  if (authUser.value?.isDefaultPassword) {
    showChangePasswordModal.value = true;
  }
};

const handlePasswordChanged = () => {
  if (authUser.value) {
    setAuthUser({ ...authUser.value, isDefaultPassword: false });
  }
};

const handleTwoFactorChanged = (enabled) => {
  if (authUser.value) {
    setAuthUser({ ...authUser.value, twoFactorEnabled: enabled });
  }
};

// ── Privacy notice acceptance (NDPA) ────────────────────────────────────────
// Bump this to force every employee to re-accept (e.g. after the notice text
// changes materially) — anyone whose stored version doesn't match sees the
// modal again on their next load, even if they'd already accepted before.
const PRIVACY_NOTICE_VERSION = 'v3-2026-08'; // bumped: discloses platform-admin support access (see PlatformView.vue impersonation)

const needsPrivacyConsent = computed(() => {
  if (authUser.value?.role !== 'Employee') return false;
  const consent = authUser.value?.privacyConsent;
  return !consent?.accepted || consent.version !== PRIVACY_NOTICE_VERSION;
});

const handlePrivacyConsentAccepted = (privacyConsent) => {
  if (authUser.value) {
    setAuthUser({ ...authUser.value, privacyConsent });
  }
};

const handleLogout = () => {
  setAuthUser(null);
  activeTenant.value = null;
  localStorage.removeItem('hrms_tenant_id');
  localStorage.removeItem('hrms_impersonating');
  showLanding.value = true;
  activeTab.value = 'dashboard';
};

// ── Platform-admin impersonation ────────────────────────────────────────────
const impersonating = computed(() => {
  try { return JSON.parse(localStorage.getItem('hrms_impersonating') || 'null'); }
  catch { return null; }
});

// PlatformView.vue already called setAuthUser/setActiveTenant with the
// impersonated tenant's HR_Admin session before emitting this — just leave
// platform mode so the normal dashboard renders with that session.
const handleImpersonated = () => {
  isPlatformRoute.value = false;
  showLanding.value = false;
  activeTab.value = 'dashboard';
  window.location.hash = 'dashboard';
};

// Ends the impersonated session and drops back into the platform view,
// rather than the normal landing page — that's where a platform admin
// expects to land after "Exit".
const handleExitImpersonation = () => {
  handleLogout();
  isPlatformRoute.value = true;
};

const handleExitPlatformRoute = () => {
  isPlatformRoute.value = false;
  if (window.location.hash === '#platform') window.location.hash = '';
};

watch(activeTenant, () => {
  if (activeTenant.value && authUser.value) loadAllData();
});

// ── Activity tracking (in-app active-time, Employee accounts only) ─────────
// Starts once an Employee is actually inside the app (not on the landing/auth
// screen) and stops on logout or if an HR account is signed in instead.
watch([() => authUser.value?.role, showLanding], ([role, landing]) => {
  if (role === 'Employee' && !landing) startActivityTracker();
  else stopActivityTracker();
}, { immediate: true });

// ── Browser History integration (back/forward button support) ─────────────
// When the active tab changes, push a history entry so the browser back button
// steps back through tabs instead of leaving the app entirely.
watch(activeTab, (tab) => {
  // Only push history when we're in the app (not on the landing page)
  if (!showLanding.value) {
    window.history.pushState({ tab }, '', `#${tab}`);
  }
});

const handlePopState = (event) => {
  // Restore the tab from the history state, or derive it from the URL hash.
  const tab = event.state?.tab || window.location.hash.slice(1) || 'dashboard';
  if (tab && TAB_LABELS[tab]) {
    activeTab.value = tab;
  }
};

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
});

onMounted(async () => {
  const saved = localStorage.getItem('theme');
  isDark.value = saved !== 'light';
  document.documentElement.classList.toggle('dark', isDark.value);

  // Password-reset links land here as ?token=...&email=...
  const params = new URLSearchParams(window.location.search);
  const resetToken = params.get('token');
  const resetEmail = params.get('email');
  if (resetToken && resetEmail) {
    presetResetToken.value = resetToken;
    presetResetEmail.value = resetEmail;
    authModalView.value = 'reset';
    showLanding.value = true;
    showAuthModal.value = true;
    window.history.replaceState({}, '', window.location.pathname);
  }

  restoreAuth();
  // Independent requests — no reason to serialize them, and showLanding no
  // longer waits on either (see hasStoredSession() above).
  await Promise.all([checkHealth(), fetchTenants()]);

  // Restore active tab from URL hash on first load (supports refresh & deep links)
  const hashTab = window.location.hash.slice(1);
  if (hashTab && TAB_LABELS[hashTab]) {
    activeTab.value = hashTab;
  }

  // Listen for browser back/forward navigation
  window.addEventListener('popstate', handlePopState);

  const handlingResetLink = resetToken && resetEmail;
  if (!handlingResetLink) {
    if (localStorage.getItem('hrms_tenant_id') && activeTenant.value && authUser.value?.token) {
      showLanding.value = false;
    } else {
      // The optimistic hasStoredSession() check passed, but the cached
      // tenant ID didn't resolve to a real tenant (e.g. deleted, or stale
      // localStorage) — fall back to Landing instead of leaving a
      // half-loaded dashboard with no active tenant.
      showLanding.value = true;
    }
  }
});
</script>
