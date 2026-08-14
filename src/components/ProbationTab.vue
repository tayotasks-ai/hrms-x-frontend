<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Probation Tracker</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Monitor employees on probation, schedule appraisals, and process confirmations.</p>
      </div>
      <button
        v-if="authUser?.role !== 'Employee'"
        @click="showStartModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <ShieldCheck class="w-4 h-4" />
        <span>Start Probation</span>
      </button>
    </div>

    <!-- Probation List -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6">
      <div v-if="probations.length === 0" class="p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center flex flex-col items-center justify-center">
        <ShieldCheck class="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 class="font-bold text-zinc-700 dark:text-zinc-300">No employees currently on probation</h3>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="record in sortedProbations"
          :key="record._id"
          class="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3"
        >
          <div class="flex justify-between items-start gap-4">
            <div>
              <h4 class="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{{ record.employeeId?.name || 'Deleted Employee' }}</h4>
              <p class="text-xs text-zinc-500 mt-0.5">{{ record.employeeId?.role }} &bull; {{ record.employeeId?.departmentId?.name || 'No Department' }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {{ formatDate(record.startDate) }} &rarr; {{ formatDate(record.endDate) }}
                </span>
                <span v-if="record.status === 'Active'" class="text-[10px] font-mono text-zinc-500">
                  {{ record.daysRemaining }} day{{ record.daysRemaining === 1 ? '' : 's' }} remaining
                </span>
                <span v-if="record.extensionCount > 0" class="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                  Extended {{ record.extensionCount }}x
                </span>
              </div>
            </div>
            <span :class="[
              record.status === 'Confirmed' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
              record.status === 'Terminated' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
              record.status === 'Extended' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900' :
              'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
              'px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded border shrink-0'
            ]">
              {{ record.status }}
            </span>
          </div>

          <div v-if="record.status === 'Active' && authUser?.role !== 'Employee'" class="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              @click="openOutcomeModal(record, 'Confirm')"
              class="px-2 py-1 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-500/30 transition active:scale-95 cursor-pointer text-[10px] uppercase font-bold"
            >
              Confirm
            </button>
            <button
              @click="openOutcomeModal(record, 'Extend')"
              class="px-2 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-black rounded border border-amber-500/30 transition active:scale-95 cursor-pointer text-[10px] uppercase font-bold"
            >
              Extend
            </button>
            <button
              @click="openOutcomeModal(record, 'Terminate')"
              class="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-500/30 transition active:scale-95 cursor-pointer text-[10px] uppercase font-bold"
            >
              Terminate
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Start Probation Modal -->
    <div
      v-if="showStartModal"
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeStartModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Start Probation</h3>
          </div>
          <button @click="closeStartModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleStartSubmit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
            <select
              v-model="startForm.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Staff Member</option>
              <option v-for="emp in eligibleEmployees" :key="emp._id" :value="emp._id">
                {{ emp.name }} ({{ emp.role }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Start Date</label>
              <input
                v-model="startForm.startDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">End Date</label>
              <input
                v-model="startForm.endDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="closeStartModal"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleStartSubmit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else>Start Probation</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Record Outcome Modal -->
    <div
      v-if="showOutcomeModal"
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeOutcomeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">{{ outcomeForm.decision }} Probation &mdash; {{ outcomeTarget?.employeeId?.name }}</h3>
          </div>
          <button @click="closeOutcomeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleOutcomeSubmit" class="p-6 space-y-4">
          <div v-if="outcomeError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ outcomeError }}
          </div>

          <div v-if="outcomeForm.decision === 'Extend'" class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">New End Date</label>
            <input
              v-model="outcomeForm.newEndDate"
              type="date"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reason / Notes</label>
            <textarea
              v-model="outcomeForm.reason"
              rows="3"
              placeholder="e.g. Consistently meeting performance targets"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="closeOutcomeModal"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleOutcomeSubmit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else>{{ outcomeForm.decision }} Probation</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { ShieldCheck, X } from 'lucide-vue-next';

const props = defineProps({
  probations: { type: Array, default: () => [] },
  employees: { type: Array, default: () => [] },
  authUser: { type: Object, default: null }
});

const emit = defineEmits(['refresh']);
const { createProbation, recordProbationOutcome } = useApi();

const showStartModal = ref(false);
const showOutcomeModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const outcomeError = ref(null);
const outcomeTarget = ref(null);

const startForm = ref({ employeeId: '', startDate: '', endDate: '' });
const outcomeForm = ref({ decision: '', reason: '', newEndDate: '' });

const sortedProbations = computed(() => {
  return [...props.probations].sort((a, b) => {
    if (a.status === 'Active' && b.status !== 'Active') return -1;
    if (a.status !== 'Active' && b.status === 'Active') return 1;
    return new Date(a.endDate) - new Date(b.endDate);
  });
});

const eligibleEmployees = computed(() => {
  const activeProbationEmployeeIds = new Set(
    props.probations.filter(p => p.status === 'Active').map(p => p.employeeId?._id || p.employeeId)
  );
  return props.employees.filter(e => e.status !== 'Offboarded' && !activeProbationEmployeeIds.has(e._id));
});

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const closeStartModal = () => {
  showStartModal.value = false;
  startForm.value = { employeeId: '', startDate: '', endDate: '' };
  formError.value = null;
};

const handleStartSubmit = async () => {
  if (!startForm.value.employeeId || !startForm.value.startDate || !startForm.value.endDate) {
    formError.value = 'Please complete all required fields.';
    return;
  }
  submitting.value = true;
  formError.value = null;
  try {
    await createProbation({ ...startForm.value });
    emit('refresh');
    closeStartModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to start probation.';
  } finally {
    submitting.value = false;
  }
};

const openOutcomeModal = (record, decision) => {
  outcomeTarget.value = record;
  outcomeForm.value = { decision, reason: '', newEndDate: '' };
  outcomeError.value = null;
  showOutcomeModal.value = true;
};

const closeOutcomeModal = () => {
  showOutcomeModal.value = false;
  outcomeTarget.value = null;
  outcomeForm.value = { decision: '', reason: '', newEndDate: '' };
  outcomeError.value = null;
};

const handleOutcomeSubmit = async () => {
  if (outcomeForm.value.decision === 'Extend' && !outcomeForm.value.newEndDate) {
    outcomeError.value = 'New end date is required for an extension.';
    return;
  }
  submitting.value = true;
  outcomeError.value = null;
  try {
    await recordProbationOutcome(outcomeTarget.value._id, {
      decision: outcomeForm.value.decision,
      reason: outcomeForm.value.reason,
      newEndDate: outcomeForm.value.newEndDate || undefined
    });
    emit('refresh');
    closeOutcomeModal();
  } catch (err) {
    outcomeError.value = err.response?.data?.message || err.message || 'Failed to record outcome.';
  } finally {
    submitting.value = false;
  }
};
</script>
