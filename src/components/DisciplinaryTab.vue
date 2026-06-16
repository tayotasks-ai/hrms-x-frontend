<template>
  <div class="space-y-6">
    <!-- Header panel with action toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Disciplinary & Grievance</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage cases, queries, panels, and track resolutions.</p>
      </div>
      <button 
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-orange-600 active:scale-[0.98] transition cursor-pointer"
      >
        <AlertOctagon class="w-4 h-4" />
        <span>Log New Case</span>
      </button>
    </div>

    <!-- Cases Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Case Info</th>
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Type & Status</th>
              <th class="py-3 px-6">Outcome</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="cases.length === 0" class="text-center text-zinc-500">
              <td colspan="5" class="py-12">
                <AlertOctagon class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No disciplinary or grievance cases logged.</p>
              </td>
            </tr>

            <template v-for="c in cases" :key="c._id">
              <tr class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer" @click="toggleRow(c._id)">
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    {{ c.caseId }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[150px]">
                    {{ c.title }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ c.reportedEmployee?.name || 'Deleted Employee' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ c.reportedEmployee?.department }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span :class="[
                    c.caseType === 'Disciplinary' ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900' : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900',
                    'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border inline-block mb-1'
                  ]">
                    {{ c.caseType }}
                  </span>
                  <div class="text-xs font-mono text-zinc-500 mt-1 flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full" :class="statusColor(c.status)"></span>
                    {{ c.status }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span v-if="c.outcome" class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ c.outcome }}</span>
                  <span v-else class="text-[10px] text-zinc-500 font-mono">Pending</span>
                </td>
                <td class="py-4 px-6 text-right">
                  <ChevronDown class="w-4 h-4 text-zinc-400 inline-block transition-transform duration-200" :class="expandedRow === c._id ? 'rotate-180' : ''" />
                </td>
              </tr>
              
              <!-- Expanded Case Details -->
              <tr v-if="expandedRow === c._id" class="bg-zinc-50/50 dark:bg-zinc-900/20">
                <td colspan="5" class="p-0">
                  <div class="p-6 border-b border-zinc-200 dark:border-zinc-800/50 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- Details & Actions -->
                    <div class="space-y-4">
                      <div>
                        <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</h4>
                        <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">{{ c.description }}</p>
                      </div>

                      <div class="grid grid-cols-2 gap-4 bg-white dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                        <div>
                          <span class="block text-[10px] font-mono text-zinc-500">Reported By</span>
                          <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ c.reporter?.name || 'Anonymous' }}</span>
                        </div>
                        <div>
                          <span class="block text-[10px] font-mono text-zinc-500">Investigating Officer</span>
                          <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ c.investigatingOfficer?.name || 'Not assigned' }}</span>
                        </div>
                      </div>

                      <!-- Action Buttons based on status -->
                      <div class="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/50" v-if="c.status !== 'Closed'">
                        <button 
                          v-if="c.status === 'Open' || c.status === 'Under Investigation'"
                          @click="openActionModal(c, 'Query Issued')"
                          class="px-2 py-1 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 rounded border border-orange-200 dark:border-orange-900/50 transition cursor-pointer text-[10px] uppercase font-bold"
                        >
                          Issue Query
                        </button>
                        <button 
                          v-if="c.status === 'Awaiting Response'"
                          @click="openActionModal(c, 'Response Received')"
                          class="px-2 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-900/50 transition cursor-pointer text-[10px] uppercase font-bold"
                        >
                          Log Response
                        </button>
                        <button 
                          @click="openActionModal(c, 'Update Status')"
                          class="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 transition cursor-pointer text-[10px] uppercase font-bold"
                        >
                          Update Status/Panel
                        </button>
                        <button 
                          @click="openActionModal(c, 'Close Case')"
                          class="px-2 py-1 bg-lime-50 dark:bg-lime-950/20 text-lime-600 dark:text-lime-400 hover:bg-lime-100 dark:hover:bg-lime-900/40 rounded border border-lime-200 dark:border-lime-900/50 transition cursor-pointer text-[10px] uppercase font-bold"
                        >
                          Decide Outcome
                        </button>
                      </div>
                    </div>

                    <!-- History Timeline -->
                    <div class="bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800">
                      <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-100 dark:border-zinc-900 pb-2">Case History</h4>
                      <div class="space-y-4 max-h-48 overflow-y-auto pr-2">
                        <div v-for="h in c.history" :key="h._id" class="flex gap-3">
                          <div class="mt-1">
                            <div class="w-1.5 h-1.5 rounded-full bg-zinc-400"></div>
                          </div>
                          <div>
                            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ h.actionType }}</p>
                            <p class="text-[10px] text-zinc-500 mt-0.5">{{ h.notes }}</p>
                            <p class="text-[9px] text-zinc-400 font-mono mt-1">{{ formatDateObj(h.actionDate) }} by {{ h.performedBy?.name }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Initiation Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertOctagon class="w-4 h-4 text-orange-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Log New Case</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Case Type</label>
              <select 
                v-model="form.caseType"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
              >
                <option value="Disciplinary">Disciplinary Action</option>
                <option value="Grievance">Grievance</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reported Employee</label>
              <select 
                v-model="form.reportedEmployee"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
              >
                <option value="" disabled>Select Subject</option>
                <option v-for="emp in employees" :key="emp._id" :value="emp._id">
                  {{ emp.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Case Title</label>
            <input 
              v-model="form.title"
              type="text"
              required
              placeholder="Brief title of the incident"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Description</label>
            <textarea 
              v-model="form.description"
              rows="4"
              required
              placeholder="Detailed description of the grievance or disciplinary issue..."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
            ></textarea>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reported By</label>
            <select 
              v-model="form.reporter"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 transition"
            >
              <option value="">Anonymous / HR Initated</option>
              <option v-for="emp in employees" :key="emp._id" :value="emp._id">
                {{ emp.name }}
              </option>
            </select>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="handleSubmit"
            class="px-4 py-2 bg-orange-500 text-white font-semibold rounded text-sm hover:bg-orange-600 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Saving...</span>
            <span v-else>Log Case</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <div 
      v-if="actionModal.show" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeActionModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">{{ actionModal.actionType }}</h3>
          <button @click="closeActionModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="actionError" class="p-3 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ actionError }}
          </div>

          <template v-if="actionModal.actionType === 'Update Status'">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Status</label>
              <select v-model="actionForm.updateStatus" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition">
                <option value="Under Investigation">Under Investigation</option>
                <option value="Hearing">Hearing Scheduled</option>
                <option value="Awaiting Response">Awaiting Response</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Investigating Officer</label>
              <select v-model="actionForm.investigatingOfficer" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition">
                <option value="">None</option>
                <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
              </select>
            </div>
          </template>

          <template v-else-if="actionModal.actionType === 'Close Case'">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Outcome</label>
              <select v-model="actionForm.outcome" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition">
                <option value="No Action">No Action (Exonerated/Dismissed)</option>
                <option value="Verbal Warning">Verbal Warning</option>
                <option value="Written Warning">Written Warning</option>
                <option value="Suspension">Suspension</option>
                <option value="Dismissal">Dismissal</option>
              </select>
            </div>
          </template>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Notes / Summary</label>
            <textarea 
              v-model="actionForm.notes"
              rows="3"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none transition"
              :placeholder="actionModal.actionType === 'Query Issued' ? 'Content of the query letter...' : actionModal.actionType === 'Response Received' ? 'Employee\'s response text...' : 'Summary of action...'"
            ></textarea>
          </div>
        </div>

        <div class="h-16 px-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 bg-white dark:bg-zinc-950">
           <button @click="closeActionModal" class="px-4 py-2 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">Cancel</button>
           <button @click="submitAction" class="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded text-sm transition">Submit</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi';
import { AlertOctagon, X, ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  cases: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { createCase, addCaseAction } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const expandedRow = ref(null);

const initialForm = {
  caseType: 'Disciplinary',
  title: '',
  description: '',
  reportedEmployee: '',
  reporter: ''
};

const form = ref({ ...initialForm });

// Action modal state
const actionModal = ref({
  show: false,
  caseId: null,
  actionType: ''
});
const actionForm = ref({ notes: '', updateStatus: '', investigatingOfficer: '', outcome: '' });
const actionError = ref(null);

const openActionModal = (c, type) => {
  actionModal.value = { show: true, caseId: c._id, actionType: type };
  actionForm.value = { 
    notes: '', 
    updateStatus: c.status, 
    investigatingOfficer: c.investigatingOfficer?._id || '', 
    outcome: 'No Action' 
  };
  actionError.value = null;
};

const closeActionModal = () => {
  actionModal.value.show = false;
};

const closeModal = () => {
  showModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const formatDateObj = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const statusColor = (status) => {
  switch(status) {
    case 'Closed': return 'bg-zinc-400';
    case 'Open': return 'bg-blue-400';
    case 'Under Investigation': return 'bg-orange-400';
    case 'Query Issued':
    case 'Awaiting Response': return 'bg-yellow-400';
    case 'Hearing': return 'bg-red-400';
    default: return 'bg-zinc-400';
  }
};

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const submitAction = async () => {
  if (!actionForm.value.notes) {
    actionError.value = 'Notes are required.';
    return;
  }
  try {
    const payload = { actionType: actionModal.value.actionType, notes: actionForm.value.notes };
    if (actionModal.value.actionType === 'Update Status') {
      payload.updateStatus = actionForm.value.updateStatus;
      if (actionForm.value.investigatingOfficer) payload.investigatingOfficer = actionForm.value.investigatingOfficer;
    }
    if (actionModal.value.actionType === 'Close Case') {
      payload.outcome = actionForm.value.outcome;
    }

    await addCaseAction(actionModal.value.caseId, payload);
    emit('refresh');
    closeActionModal();
  } catch (err) {
    actionError.value = err.response?.data?.message || 'Failed to submit action.';
  }
};

const handleSubmit = async () => {
  if (!form.value.reportedEmployee || !form.value.title || !form.value.description) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    const payload = { ...form.value };
    if (!payload.reporter) delete payload.reporter; // Handle empty string for anonymous
    await createCase(payload);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to log case.';
  } finally {
    submitting.value = false;
  }
};
</script>
