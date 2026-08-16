<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
          Welcome back, {{ authUser?.name?.split(' ')[0] || 'Employee' }}!
        </h2>
        <p class="text-sm text-zinc-500 mt-1">Here is a quick overview of your personal workspace today.</p>
      </div>
      
      <!-- Time and Date -->
      <div class="hidden md:flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <Clock class="w-4 h-4 text-lime-600 dark:text-lime-400" />
        <div>
          <p class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Time</p>
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ currentTime }}</p>
        </div>
      </div>
    </div>

    <!-- Clock In / Out -->
    <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div :class="[
          today?.clockOut?.at ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500' :
          today?.clockIn?.at ? 'bg-lime-50 dark:bg-lime-950/50 text-lime-600 dark:text-lime-400' :
          'bg-zinc-100 dark:bg-zinc-900 text-zinc-500',
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0'
        ]">
          <Timer class="w-5 h-5" />
        </div>
        <div>
          <p class="text-sm font-medium text-zinc-500">Today's Attendance</p>
          <p v-if="today?.clockOut?.at" class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Clocked in {{ formatTime(today.clockIn.at) }} &middot; out {{ formatTime(today.clockOut.at) }}
          </p>
          <p v-else-if="today?.clockIn?.at" class="text-sm font-semibold text-lime-600 dark:text-lime-400">
            Clocked in at {{ formatTime(today.clockIn.at) }}
          </p>
          <p v-else class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Not clocked in yet</p>
          <p v-if="attendanceError" class="text-xs text-rose-500 mt-0.5">{{ attendanceError }}</p>
          <p class="text-[11px] text-zinc-400 mt-1">Active time in HRMS X today: {{ formatActiveMinutes(myActiveMinutes) }}</p>
        </div>
      </div>
      <button
        v-if="!today?.clockIn?.at"
        @click="handleClockIn"
        :disabled="attendanceBusy"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
      >
        <Timer class="w-4 h-4" />
        <span>{{ attendanceBusy ? 'Clocking in…' : 'Clock In' }}</span>
      </button>
      <button
        v-else-if="!today?.clockOut?.at"
        @click="handleClockOut"
        :disabled="attendanceBusy"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-semibold px-4 py-2 rounded text-sm hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
      >
        <Timer class="w-4 h-4" />
        <span>{{ attendanceBusy ? 'Clocking out…' : 'Clock Out' }}</span>
      </button>
      <span v-else class="text-xs font-mono text-zinc-500 uppercase tracking-wider">Day complete</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Leave Balance Widget -->
      <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarOff class="w-5 h-5" />
          </div>
          <button @click="$emit('navigate', 'leaves')" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Apply</button>
        </div>
        <p class="text-sm font-medium text-zinc-500 mb-3">Leave Balance</p>
        <div v-if="leaveBalances.length" class="grid grid-cols-2 gap-x-4 gap-y-2.5">
          <div v-for="lb in leaveBalances" :key="lb.type">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-[11px] text-zinc-500 truncate">{{ lb.type }}</span>
              <span
                class="text-xs font-semibold shrink-0"
                :class="!lb.uncapped && lb.remaining === 0 ? 'text-red-500' : 'text-zinc-800 dark:text-zinc-200'"
              >{{ lb.uncapped ? 'No cap' : `${lb.remaining}/${lb.entitlement}` }}</span>
            </div>
            <div v-if="!lb.uncapped" class="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1 mt-1">
              <div class="bg-indigo-500 h-1 rounded-full" :style="{ width: leaveBarWidth(lb) + '%' }"></div>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-zinc-400 mt-1">Loading balances&hellip;</p>
      </div>

      <!-- Payslip Widget -->
      <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 rounded-lg bg-lime-50 dark:bg-lime-950/50 flex items-center justify-center text-lime-600 dark:text-lime-400">
            <CreditCard class="w-5 h-5" />
          </div>
          <button @click="$emit('navigate', 'payroll')" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">View All</button>
        </div>
        <p class="text-sm font-medium text-zinc-500">Latest Payslip</p>
        <div class="flex items-end gap-2 mt-1">
          <h3 class="text-xl font-bold font-display text-zinc-900 dark:text-zinc-50">Available</h3>
        </div>
        <p class="text-xs text-zinc-500 mt-4 flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5" />
          October 2026 Salary
        </p>
      </div>

      <!-- Training & Helpdesk Widget -->
      <div class="bg-zinc-900 dark:bg-zinc-50 rounded-xl p-5 shadow-sm text-white dark:text-black relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 dark:bg-black/5 rounded-full group-hover:scale-150 transition duration-500"></div>
        <div class="flex justify-between items-start mb-4 relative z-10">
          <div class="w-10 h-10 rounded-lg bg-white/20 dark:bg-black/10 flex items-center justify-center">
            <LifeBuoy class="w-5 h-5" />
          </div>
        </div>
        <p class="text-sm font-medium text-white/80 dark:text-black/70 relative z-10">Helpdesk Tickets</p>
        <div class="flex items-end gap-2 mt-1 relative z-10">
          <h3 class="text-3xl font-bold font-display">0</h3>
          <span class="text-sm font-medium text-white/80 dark:text-black/70 mb-1">Pending</span>
        </div>
        <button @click="$emit('navigate', 'helpdesk')" class="text-xs font-semibold hover:underline mt-4 relative z-10">Open a request &rarr;</button>
      </div>
      
    </div>

    <!-- Quick Links Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <button @click="$emit('navigate', 'internal-jobs')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <Briefcase class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Internal Jobs</span>
      </button>
      <button @click="$emit('navigate', 'trainings')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <BookOpen class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Trainings</span>
      </button>
      <button @click="$emit('navigate', 'org')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2 text-center">
        <Target class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">KPIs & 360 Review</span>
      </button>
      <button @click="$emit('navigate', 'benefits')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <HeartPulse class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">My Benefits</span>
      </button>
      <button @click="$emit('navigate', 'documents')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <FileText class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">My Documents</span>
      </button>
    </div>

    <!-- Recognition -->
    <ShoutoutsWidget :shoutouts="shoutouts" :authUser="authUser" @refresh="$emit('refresh')" />

    <!-- Announcements / Policies Box -->
    <div class="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <h3 class="font-display font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Recent Company Updates</h3>
      <div class="space-y-3">
        <div class="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex gap-3 items-center">
          <div class="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles class="w-4 h-4" />
          </div>
          <div>
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">New Work From Home Policy</p>
            <p class="text-xs text-zinc-500">Please review the updated remote work guidelines in your documents.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- My Data & Privacy -->
    <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-display font-bold text-sm text-zinc-800 dark:text-zinc-200">My Data &amp; Privacy</h3>
        <ShieldCheck class="w-4 h-4 text-zinc-400" />
      </div>
      <p class="text-xs text-zinc-500 mb-4">Download everything this system holds about you, or ask HR to correct or delete your data.</p>

      <p v-if="dsarMessage" class="text-xs text-lime-600 dark:text-lime-400 mb-3">{{ dsarMessage }}</p>
      <p v-if="dsarError" class="text-xs text-rose-500 mb-3">{{ dsarError }}</p>

      <div class="flex flex-wrap gap-2">
        <button
          @click="handleExportData"
          :disabled="exportingData"
          class="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-3 py-1.5 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ exportingData ? 'Preparing…' : 'Download My Data' }}</span>
        </button>
        <button
          @click="showDsarModal = true"
          class="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-3 py-1.5 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <FileEdit class="w-3.5 h-3.5" />
          <span>Request Correction or Deletion</span>
        </button>
      </div>
    </div>

    <!-- DSAR Request Modal -->
    <div
      v-if="showDsarModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeDsarModal"
    >
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div class="h-14 px-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Data Request</h3>
          <button @click="closeDsarModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-500 transition">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-5 space-y-3">
          <div v-if="dsarFormError" class="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs">
            {{ dsarFormError }}
          </div>
          <div class="space-y-1">
            <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Type</label>
            <select v-model="dsarForm.type" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition">
              <option value="Correction">Correct something in my record</option>
              <option value="Erasure">Delete my data</option>
              <option value="Access">Something else about my data</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Details</label>
            <textarea
              v-model="dsarForm.details"
              rows="3"
              placeholder="What would you like corrected, or why are you requesting this?"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition resize-none"
            ></textarea>
          </div>
        </div>
        <div class="h-16 px-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button @click="closeDsarModal" class="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition">Cancel</button>
          <button
            @click="submitDsarRequest"
            :disabled="submittingDsar"
            class="px-4 py-1.5 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 transition disabled:opacity-50"
          >
            {{ submittingDsar ? 'Submitting…' : 'Submit Request' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { CalendarOff, CreditCard, LifeBuoy, FileText, Briefcase, BookOpen, Target, Clock, Sparkles, Timer, ShieldCheck, Download, FileEdit, X } from 'lucide-vue-next';
import ShoutoutsWidget from './ShoutoutsWidget.vue';
import { useApi } from '../composables/useApi';

const props = defineProps({
  authUser: {
    type: Object,
    required: true
  },
  dashboardData: { type: Object, default: () => ({}) },
  shoutouts: { type: Array, default: () => [] }
});

// Leave Balance widget — one entry per leave type, computed server-side in
// getDashboardStats (mirrors LeavesTab.vue's entitlement-minus-used-days
// logic). A policy value of 0 means "no cap", shown distinctly rather than
// dividing by zero for the progress bar.
const leaveBalances = computed(() => props.dashboardData?.leaveBalances || []);
const leaveBarWidth = (lb) => {
  if (!lb || lb.uncapped || !lb.entitlement) return 0;
  return Math.min(100, Math.round((lb.remaining / lb.entitlement) * 100));
};

const emit = defineEmits(['navigate', 'refresh']);

const currentTime = ref('');
let timer;

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 60000);
  loadToday();
});

onUnmounted(() => {
  clearInterval(timer);
});

// ── Clock In / Out ─────────────────────────────────────────────────────────
const { getMyAttendance, clockIn, clockOut, getMyActivity } = useApi();

const today = ref(null);
const attendanceBusy = ref(false);
const attendanceError = ref(null);
const myActiveMinutes = ref(0);

const todayStr = () => new Date().toISOString().split('T')[0];

const loadToday = async () => {
  try {
    const records = await getMyAttendance();
    today.value = records.find(r => r.date === todayStr()) || null;
  } catch {
    // Non-fatal — the widget just shows "Not clocked in yet"
  }
  try {
    const activity = await getMyActivity(1);
    myActiveMinutes.value = activity.find(a => a.date === todayStr())?.activeMinutes || 0;
  } catch {
    // Non-fatal — just shows 0m
  }
};

// Best-effort browser geolocation. Attendance still works fine without it —
// permission denial or an unsupported browser just means no location tag.
const tryGetLocation = () => new Promise((resolve) => {
  if (!navigator.geolocation) return resolve(null);
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    () => resolve(null),
    { timeout: 5000 }
  );
});

const handleClockIn = async () => {
  attendanceBusy.value = true;
  attendanceError.value = null;
  try {
    const location = await tryGetLocation();
    today.value = await clockIn({ location });
    emit('refresh');
  } catch (err) {
    attendanceError.value = err.response?.data?.message || err.message || 'Failed to clock in.';
  } finally {
    attendanceBusy.value = false;
  }
};

const handleClockOut = async () => {
  attendanceBusy.value = true;
  attendanceError.value = null;
  try {
    const location = await tryGetLocation();
    today.value = await clockOut({ location });
    emit('refresh');
  } catch (err) {
    attendanceError.value = err.response?.data?.message || err.message || 'Failed to clock out.';
  } finally {
    attendanceBusy.value = false;
  }
};

const formatActiveMinutes = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

// ── My Data & Privacy (NDPA data subject requests) ──────────────────────────
const { exportMyData, createDsarRequest } = useApi();

const exportingData = ref(false);
const dsarMessage = ref(null);
const dsarError = ref(null);

const handleExportData = async () => {
  exportingData.value = true;
  dsarMessage.value = null;
  dsarError.value = null;
  try {
    const data = await exportMyData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    dsarError.value = err.response?.data?.message || err.message || 'Could not export your data.';
  } finally {
    exportingData.value = false;
  }
};

const showDsarModal = ref(false);
const dsarForm = ref({ type: 'Correction', details: '' });
const dsarFormError = ref(null);
const submittingDsar = ref(false);

const closeDsarModal = () => {
  showDsarModal.value = false;
  dsarForm.value = { type: 'Correction', details: '' };
  dsarFormError.value = null;
};

const submitDsarRequest = async () => {
  if (!dsarForm.value.details.trim()) {
    dsarFormError.value = 'Please add a few details so HR knows what you need.';
    return;
  }
  submittingDsar.value = true;
  dsarFormError.value = null;
  try {
    await createDsarRequest({ type: dsarForm.value.type, details: dsarForm.value.details.trim() });
    dsarMessage.value = 'Request submitted — HR will follow up.';
    closeDsarModal();
  } catch (err) {
    dsarFormError.value = err.response?.data?.message || err.message || 'Failed to submit request.';
  } finally {
    submittingDsar.value = false;
  }
};
</script>
