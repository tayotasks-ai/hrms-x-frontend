<template>
  <!-- Mobile backdrop — only meaningful below md, where the sidebar becomes
       an off-canvas drawer. md:hidden keeps it out of the way entirely on
       desktop, where the sidebar is always in-flow and this never renders
       visibly regardless of mobileOpen. -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 bg-black/50 z-40 md:hidden"
    @click="$emit('close')"
  ></div>

  <aside
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      'fixed inset-y-0 left-0 z-50 w-64 md:static md:translate-x-0 md:z-auto',
      'border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col h-screen md:sticky md:top-0 transition-transform md:transition-colors duration-200 ease-in-out'
    ]"
  >
    <!-- Brand -->
    <div class="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 gap-2">
      <div class="w-9 h-9 shrink-0">
        <LogoMark />
      </div>
      <div>
        <h1 class="font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-wide uppercase">WorkDesk</h1>
        <p class="text-[10px] text-zinc-500 tracking-wider uppercase">{{ userRole === 'Employee' ? 'Employee Portal' : 'HR Admin' }}</p>
      </div>
      <button @click="$emit('close')" class="ml-auto md:hidden p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <template v-for="item in navItems" :key="item.id">
        <!-- Section header -->
        <p v-if="item.section" class="px-3 pt-4 pb-1 text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{{ item.section }}</p>
        <!-- Nav button -->
        <button
          v-else
          @click="$emit('update:activeTab', item.id); $emit('close')"
          :class="[
            activeTab === item.id
              ? 'bg-lime-50 dark:bg-lime-950/30 text-zinc-900 dark:text-zinc-50 border-l-2 border-lime-500'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 border-l-2 border-transparent',
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-r text-sm font-medium text-left transition-all'
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" :class="activeTab === item.id ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-400'" />
          <span class="truncate">{{ item.label }}</span>
        </button>
      </template>
    </nav>

    <!-- Desktop agent download -->
    <div class="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800 relative">
      <button @click="showDownload = !showDownload" class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded transition text-left">
        <Download class="w-4 h-4" />
        <span>Get Desktop App</span>
      </button>
      <Transition name="fade">
        <div v-if="showDownload" class="absolute bottom-full left-3 right-3 mb-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-2 z-20">
          <p class="text-[9px] font-mono text-zinc-400 uppercase tracking-widest px-2 pt-1 pb-2">WorkDesk Agent v1.0.0</p>
          <a v-for="opt in downloadOptions" :key="opt.label" :href="opt.url"
            class="flex items-center gap-2.5 px-2 py-2 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition">
            <component :is="opt.icon" class="w-3.5 h-3.5 shrink-0 text-lime-600 dark:text-lime-400" />
            <span>{{ opt.label }}</span>
          </a>
        </div>
      </Transition>
    </div>

    <!-- Logout -->
    <div class="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
      <button @click="$emit('logout')" class="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition text-left">
        <LogOut class="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>

    <!-- API status -->
    <div class="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
      <div class="flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>API</span>
        <div class="flex items-center gap-1.5">
          <span :class="[
            apiHealth.status === 'healthy' ? 'bg-lime-500 shadow-[0_0_6px_#84cc16]' :
            apiHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500',
            'w-1.5 h-1.5 rounded-full'
          ]"></span>
          <span class="capitalize">{{ apiHealth.status }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import {
  LayoutDashboard, Users, CalendarOff, CreditCard, Building2, FileText,
  CheckSquare, ShieldCheck, LogOut, ClipboardList, ArrowRightLeft,
  UserMinus, AlertOctagon, HeartPulse, LifeBuoy, Briefcase, Network,
  BookOpen, UserCircle, GanttChartSquare, ScrollText, Timer, History, Landmark,
  Download, Apple, MonitorSmartphone, Terminal, X
} from 'lucide-vue-next';
import LogoMark from './LogoMark.vue';

const showDownload = ref(false);
const AGENT_RELEASE_BASE = 'https://github.com/tayotasks-ai/hrmx-desktop-app/releases/latest/download';
const downloadOptions = [
  { label: 'macOS (.dmg)', icon: Apple, url: `${AGENT_RELEASE_BASE}/WorkDesk-Agent-1.0.0-arm64.dmg` },
  { label: 'Windows (.exe)', icon: MonitorSmartphone, url: `${AGENT_RELEASE_BASE}/WorkDesk-Agent-Setup-1.0.0.exe` },
  { label: 'Linux (.AppImage)', icon: Terminal, url: `${AGENT_RELEASE_BASE}/WorkDesk-Agent-1.0.0.AppImage` },
];

const props = defineProps({
  activeTab: { type: String, required: true },
  apiHealth: { type: Object, required: true },
  userRole:  { type: String, default: 'Employee' },
  mobileOpen: { type: Boolean, default: false },
});

defineEmits(['update:activeTab', 'logout', 'close']);

// HR Admin sees everything; Employee sees only ESS-relevant tabs
const hrItems = [
  { section: 'Overview' },
  { id: 'dashboard',        label: 'Dashboard',           icon: LayoutDashboard },
  { section: 'Workforce' },
  { id: 'employees',        label: 'Employee Directory',  icon: Users },
  { id: 'onboarding',       label: 'Onboarding',          icon: CheckSquare },
  { id: 'probation',        label: 'Probation Tracker',   icon: ShieldCheck },
  { id: 'redeployments',    label: 'Transfers',           icon: ArrowRightLeft },
  { id: 'exits',            label: 'Exit & Offboarding',  icon: UserMinus },
  { section: 'Operations' },
  { id: 'leaves',           label: 'Leave Management',    icon: CalendarOff },
  { id: 'attendance',       label: 'Attendance',          icon: Timer },
  { id: 'payroll',          label: 'Payroll & Payslips',  icon: CreditCard },
  { id: 'requisitions',     label: 'Requisitions',        icon: ClipboardList },
  { id: 'benefits',         label: 'Benefits Admin',      icon: HeartPulse },
  { id: 'trainings',        label: 'Training',            icon: BookOpen },
  { section: 'Performance' },
  { id: 'org',              label: 'KPIs & Performance',  icon: GanttChartSquare },
  { id: 'internal-jobs',    label: 'Internal Jobs',       icon: Briefcase },
  { section: 'Structure' },
  { id: 'departments',      label: 'Departments',         icon: Building2 },
  { id: 'positions',        label: 'Position Management', icon: Building2 },
  { id: 'job-architecture', label: 'Job Architecture',    icon: Network },
  { section: 'HR Tools' },
  { id: 'disciplinary',     label: 'Disciplinary',        icon: AlertOctagon },
  { id: 'helpdesk',         label: 'HR Helpdesk',         icon: LifeBuoy },
  { id: 'documents',        label: 'Documents',           icon: FileText },
  { id: 'compliance',       label: 'Compliance Calendar', icon: CheckSquare },
  { id: 'employment-history', label: 'Employment History', icon: ScrollText },
  { id: 'audit-log',        label: 'Audit Log',           icon: History },
  { id: 'wallet',           label: 'Payroll Wallet',      icon: Landmark },
];

const essItems = [
  { section: 'My Workspace' },
  { id: 'dashboard',     label: 'My Dashboard',      icon: LayoutDashboard },
  { id: 'profile',       label: 'My Profile',         icon: UserCircle },
  { section: 'Leave & Pay' },
  { id: 'leaves',        label: 'My Leave',           icon: CalendarOff },
  { id: 'payroll',       label: 'My Payslips',        icon: CreditCard },
  { section: 'Growth' },
  { id: 'org',           label: 'My KPIs',            icon: GanttChartSquare },
  { id: 'trainings',     label: 'Training',           icon: BookOpen },
  { id: 'internal-jobs', label: 'Internal Jobs',      icon: Briefcase },
  { section: 'My HR' },
  { id: 'onboarding',    label: 'My Onboarding',      icon: CheckSquare },
  { id: 'probation',     label: 'My Probation',       icon: ShieldCheck },
  { id: 'benefits',      label: 'My Benefits',        icon: HeartPulse },
  { id: 'helpdesk',      label: 'HR Helpdesk',        icon: LifeBuoy },
  { id: 'documents',     label: 'Company Docs',       icon: FileText },
  { id: 'requisitions',  label: 'My Requisitions',    icon: ClipboardList },
];

const navItems = computed(() =>
  props.userRole === 'Employee' ? essItems : hrItems
);
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.12s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
