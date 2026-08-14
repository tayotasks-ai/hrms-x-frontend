<template>
  <div class="space-y-6">
    <!-- Sub-nav -->
    <div class="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-900 w-fit">
      <button
        @click="subView = 'calendar'"
        :class="[subView === 'calendar' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300', 'px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer']"
      >
        Compliance Calendar
      </button>
      <button
        @click="openDsarView"
        :class="[subView === 'dsar' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300', 'relative px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer']"
      >
        Data Requests
        <span v-if="pendingDsarCount > 0" class="ml-1 inline-flex items-center justify-center bg-amber-500 text-black text-[10px] font-bold rounded-full w-4 h-4">{{ pendingDsarCount }}</span>
      </button>
      <button
        @click="openRetentionView"
        :class="[subView === 'retention' ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300', 'relative px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer']"
      >
        Data Retention
        <span v-if="retentionCandidates.length > 0" class="ml-1 inline-flex items-center justify-center bg-amber-500 text-black text-[10px] font-bold rounded-full w-4 h-4">{{ retentionCandidates.length }}</span>
      </button>
    </div>

    <template v-if="subView === 'calendar'">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-zinc-900 dark:text-zinc-50">Compliance Calendar</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Nigerian statutory obligations and filing deadlines.</p>
        </div>
      </div>
      <div v-if="!compliances.length" class="flex flex-col items-center justify-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
        <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
        <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No obligations loaded.</p>
        <p class="text-xs text-zinc-400 mt-1">Seed Nigerian defaults from the API.</p>
      </div>
      <div v-else class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
            <tr>
              <th class="px-5 py-3">Obligation</th>
              <th class="px-5 py-3">Regulator</th>
              <th class="px-5 py-3">Frequency</th>
              <th class="px-5 py-3">Due Date</th>
              <th class="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-900">
            <tr v-for="c in compliances" :key="c._id" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
              <td class="px-5 py-3">
                <p class="font-semibold text-zinc-900 dark:text-zinc-50 text-xs">{{ c.title }}</p>
                <p class="text-[10px] text-zinc-400 font-mono">{{ c.category }}</p>
              </td>
              <td class="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">{{ c.regulator || '–' }}</td>
              <td class="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">{{ c.frequency }}</td>
              <td class="px-5 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                {{ c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-GB') : '–' }}
              </td>
              <td class="px-5 py-3">
                <span :class="[
                  c.status === 'Completed' ? 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400' :
                  c.status === 'Overdue'   ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
                  'text-[10px] font-semibold font-mono px-2 py-0.5 rounded'
                ]">{{ c.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Data Subject Requests (NDPA access/correction/erasure) -->
    <template v-else-if="subView === 'dsar'">
      <div>
        <h3 class="font-bold text-zinc-900 dark:text-zinc-50">Data Subject Requests</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Access, correction, and erasure requests employees have filed about their own data (NDPA Sections 35–39).</p>
      </div>

      <div v-if="dsarError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
        {{ dsarError }}
      </div>

      <div v-if="dsarLoading" class="py-10 text-center text-xs text-zinc-500">Loading…</div>

      <div v-else-if="dsarRequests.length === 0" class="flex flex-col items-center justify-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
        <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
        <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No data requests yet.</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="r in dsarRequests" :key="r._id" class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ r.type }} &bull; {{ r.employeeName }}</p>
              <p class="text-[11px] text-zinc-500 mt-0.5">{{ formatDate(r.requestedAt) }}</p>
            </div>
            <span :class="[dsarBadgeClass(r.status), 'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border shrink-0']">{{ r.status }}</span>
          </div>
          <p v-if="r.details" class="text-xs text-zinc-600 dark:text-zinc-400">{{ r.details }}</p>
          <p v-if="r.resolutionNote" class="text-[11px] text-zinc-500">Note: {{ r.resolutionNote }}</p>

          <div v-if="!['Completed', 'Rejected'].includes(r.status)" class="flex items-center gap-2 pt-1">
            <button
              v-if="r.status === 'Pending'"
              @click="setDsarStatus(r, 'In Progress')"
              :disabled="decidingDsarId === r._id"
              class="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            >
              Mark In Progress
            </button>
            <button
              @click="setDsarStatus(r, 'Completed')"
              :disabled="decidingDsarId === r._id"
              class="px-3 py-1.5 bg-lime-500 text-black font-semibold rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition disabled:opacity-50 cursor-pointer"
            >
              Mark Completed
            </button>
            <button
              @click="setDsarStatus(r, 'Rejected')"
              :disabled="decidingDsarId === r._id"
              class="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Data Retention -->
    <template v-else>
      <div>
        <h3 class="font-bold text-zinc-900 dark:text-zinc-50">Data Retention</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Offboarded employees whose data has exceeded the retention window and is ready to be anonymized.</p>
      </div>

      <div class="flex items-center gap-3 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-zinc-50 dark:bg-zinc-900/40">
        <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Keep offboarded employee data for</label>
        <input
          v-model.number="retentionYearsInput"
          type="number"
          min="1"
          class="w-16 px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-center text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
        />
        <span class="text-xs text-zinc-500">years</span>
        <button
          @click="saveRetentionYears"
          :disabled="savingRetentionYears || retentionYearsInput === retentionYears"
          class="ml-auto px-3 py-1.5 bg-lime-500 text-black font-semibold rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition disabled:opacity-50 cursor-pointer"
        >
          {{ savingRetentionYears ? 'Saving…' : 'Save' }}
        </button>
      </div>
      <p class="text-[11px] text-zinc-500">A starting point, not tax advice — confirm the right retention period for payroll/tax records with your accountant. 6 years is a common Nigerian statutory floor.</p>

      <div v-if="retentionError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
        {{ retentionError }}
      </div>

      <div v-if="retentionLoading" class="py-10 text-center text-xs text-zinc-500">Loading…</div>

      <div v-else-if="retentionCandidates.length === 0" class="flex flex-col items-center justify-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
        <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
        <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Nothing past the retention window right now.</p>
      </div>

      <div v-else class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table class="w-full text-sm text-left">
          <thead class="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
            <tr>
              <th class="px-5 py-3">Employee</th>
              <th class="px-5 py-3">Department</th>
              <th class="px-5 py-3">Offboarded</th>
              <th class="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-900">
            <tr v-for="c in retentionCandidates" :key="c._id" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
              <td class="px-5 py-3">
                <p class="font-semibold text-zinc-900 dark:text-zinc-50 text-xs">{{ c.name }}</p>
                <p class="text-[10px] text-zinc-400 font-mono">{{ c.email }}</p>
              </td>
              <td class="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">{{ c.departmentId?.name || '—' }}</td>
              <td class="px-5 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">{{ formatDate(c.offboardedAt) }}</td>
              <td class="px-5 py-3 text-right">
                <button
                  @click="handleAnonymize(c)"
                  :disabled="anonymizingId === c._id"
                  class="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950 transition disabled:opacity-50 cursor-pointer"
                >
                  {{ anonymizingId === c._id ? 'Anonymizing…' : 'Anonymize' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { CheckSquare } from 'lucide-vue-next';
import { useApi } from '../composables/useApi';

defineProps({ compliances: { type: Array, default: () => [] } });
const emit = defineEmits(['refresh']);

const { getDsarRequests, updateDsarRequest, getRetentionSettings, updateRetentionSettings, getRetentionCandidates, anonymizeEmployee } = useApi();

const subView = ref('calendar');
const dsarRequests = ref([]);
const dsarLoading = ref(false);
const dsarError = ref(null);
const decidingDsarId = ref(null);
const pendingDsarCount = ref(0);

const loadDsarRequests = async () => {
  dsarLoading.value = true;
  dsarError.value = null;
  try {
    dsarRequests.value = await getDsarRequests();
    pendingDsarCount.value = dsarRequests.value.filter(r => r.status === 'Pending').length;
  } catch (err) {
    dsarError.value = err.response?.data?.message || err.message || 'Failed to load data requests.';
  } finally {
    dsarLoading.value = false;
  }
};

const openDsarView = () => {
  subView.value = 'dsar';
  loadDsarRequests();
};

const setDsarStatus = async (request, status) => {
  let resolutionNote;
  if (status === 'Rejected') resolutionNote = window.prompt('Reason for rejecting (optional):') || '';
  decidingDsarId.value = request._id;
  dsarError.value = null;
  try {
    await updateDsarRequest(request._id, { status, resolutionNote });
    await loadDsarRequests();
  } catch (err) {
    dsarError.value = err.response?.data?.message || err.message || 'Failed to update request.';
  } finally {
    decidingDsarId.value = null;
  }
};

const dsarBadgeClass = (status) => ({
  Pending: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  'In Progress': 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  Completed: 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
  Rejected: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
}[status] || 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800');

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

// ── Data Retention ────────────────────────────────────────────────────────
const retentionCandidates = ref([]);
const retentionLoading = ref(false);
const retentionError = ref(null);
const anonymizingId = ref(null);
const retentionYears = ref(6);
const retentionYearsInput = ref(6);
const savingRetentionYears = ref(false);

const loadRetention = async () => {
  retentionLoading.value = true;
  retentionError.value = null;
  try {
    const [settings, result] = await Promise.all([getRetentionSettings(), getRetentionCandidates()]);
    retentionYears.value = settings.offboardedRetentionYears;
    retentionYearsInput.value = settings.offboardedRetentionYears;
    retentionCandidates.value = result.candidates;
  } catch (err) {
    retentionError.value = err.response?.data?.message || err.message || 'Failed to load retention data.';
  } finally {
    retentionLoading.value = false;
  }
};

const openRetentionView = () => {
  subView.value = 'retention';
  loadRetention();
};

const saveRetentionYears = async () => {
  savingRetentionYears.value = true;
  retentionError.value = null;
  try {
    await updateRetentionSettings(retentionYearsInput.value);
    await loadRetention();
  } catch (err) {
    retentionError.value = err.response?.data?.message || err.message || 'Failed to update retention policy.';
  } finally {
    savingRetentionYears.value = false;
  }
};

const handleAnonymize = async (candidate) => {
  if (!window.confirm(`Anonymize ${candidate.name}'s record? This scrubs their personal data (name, contact info, regulatory IDs, bank details) and cannot be undone. Their payslip and leave history stay intact for statutory records.`)) return;
  anonymizingId.value = candidate._id;
  retentionError.value = null;
  try {
    await anonymizeEmployee(candidate._id);
    await loadRetention();
    emit('refresh');
  } catch (err) {
    retentionError.value = err.response?.data?.message || err.message || 'Failed to anonymize this record.';
  } finally {
    anonymizingId.value = null;
  }
};

// Load pending counts in the background on mount so both badges show up
// without requiring HR to click into each sub-view first.
loadDsarRequests();
loadRetention();
</script>
