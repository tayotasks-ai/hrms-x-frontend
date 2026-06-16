<template>
  <div class="space-y-6">
    <!-- Header panel with action toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Redeployment & Internal Transfers</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage employee role, department, and location transfers.</p>
      </div>
      <button 
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <ArrowRightLeft class="w-4 h-4" />
        <span>Initiate Transfer</span>
      </button>
    </div>

    <!-- Redeployment History Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">From</th>
              <th class="py-3 px-6">To</th>
              <th class="py-3 px-6">Effective Date</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="redeployments.length === 0" class="text-center text-zinc-500">
              <td colspan="6" class="py-12">
                <ArrowRightLeft class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No transfer history found.</p>
              </td>
            </tr>

            <tr 
              v-for="transfer in redeployments" 
              :key="transfer._id"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ transfer.employeeId?.name || 'Deleted Employee' }}
                </div>
                <div class="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[120px]" :title="transfer.reason">
                  {{ transfer.reason }}
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ transfer.fromDepartment }}</div>
                <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ transfer.fromRole }}</div>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <ArrowRight class="w-3 h-3 text-lime-500 shrink-0" />
                  <div>
                    <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ transfer.toDepartment }}</div>
                    <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ transfer.toRole }}</div>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                {{ formatDate(transfer.effectiveDate) }}
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  transfer.status === 'Completed' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  transfer.status === 'Cancelled' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
                  'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
                  'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                ]">
                  {{ transfer.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div v-if="transfer.status === 'Scheduled'" class="flex justify-end">
                   <button 
                    @click="handleComplete(transfer._id)"
                    class="px-2 py-1 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-500/30 transition active:scale-95 cursor-pointer text-[10px] uppercase font-bold"
                  >
                    Mark Complete
                  </button>
                </div>
                <span v-else class="text-[10px] text-zinc-600 font-mono uppercase">Closed</span>
              </td>
            </tr>
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
            <ArrowRightLeft class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Initiate Transfer</h3>
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

          <!-- Employee Select -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee to Transfer</label>
            <select 
              v-model="form.employeeId"
              @change="populateCurrentState"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Staff Member</option>
              <option 
                v-for="emp in activeEmployeesOnly" 
                :key="emp._id" 
                :value="emp._id"
              >
                {{ emp.name }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-6 mt-4">
            <!-- Current State (Read-only view) -->
            <div class="space-y-3 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded border border-zinc-200 dark:border-zinc-800">
              <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">Current State</h4>
              
              <div>
                <span class="block text-[9px] text-zinc-500 font-mono uppercase">Department</span>
                <div class="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{{ form.fromDepartment || '-' }}</div>
              </div>
              <div>
                <span class="block text-[9px] text-zinc-500 font-mono uppercase">Role</span>
                <div class="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{{ form.fromRole || '-' }}</div>
              </div>
            </div>

            <!-- New State (Inputs) -->
            <div class="space-y-3 p-4 rounded border border-lime-500/30 bg-lime-50 dark:bg-lime-950/10">
              <h4 class="text-[10px] font-bold text-lime-600 dark:text-lime-500 uppercase tracking-wider mb-2 border-b border-lime-500/20 pb-1">New State</h4>
              
              <div class="space-y-1">
                <label class="block text-[9px] font-mono text-zinc-600 dark:text-zinc-400 uppercase">New Department</label>
                <input 
                  v-model="form.toDepartment"
                  type="text"
                  required
                  class="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-[9px] font-mono text-zinc-600 dark:text-zinc-400 uppercase">New Role</label>
                <input 
                  v-model="form.toRole"
                  type="text"
                  required
                  class="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                />
              </div>
               <div class="space-y-1">
                <label class="block text-[9px] font-mono text-zinc-600 dark:text-zinc-400 uppercase">New Manager</label>
                <select 
                  v-model="form.toManager"
                  class="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                >
                  <option value="">No change / None</option>
                  <option 
                    v-for="mgr in managerCandidates" 
                    :key="mgr._id" 
                    :value="mgr._id"
                  >
                    {{ mgr.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Effective Date</label>
              <input 
                v-model="form.effectiveDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reason for Transfer</label>
            <textarea 
              v-model="form.reason"
              rows="2"
              required
              placeholder="e.g. Promotion, Restructuring"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
          </div>
          
          <div class="flex items-center gap-2 mt-4">
            <input type="checkbox" v-model="form.autoComplete" id="autoComplete" class="text-lime-500 bg-zinc-900 border-zinc-700 rounded" />
            <label for="autoComplete" class="text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
              Apply changes to Employee Directory immediately
            </label>
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
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Saving...</span>
            <span v-else>Initiate Transfer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { ArrowRightLeft, ArrowRight, X } from 'lucide-vue-next';

const props = defineProps({
  redeployments: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { createRedeployment, completeRedeployment } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);

const initialForm = {
  employeeId: '',
  effectiveDate: '',
  fromDepartment: '',
  fromRole: '',
  fromManager: null,
  toDepartment: '',
  toRole: '',
  toManager: '',
  reason: '',
  autoComplete: false
};

const form = ref({ ...initialForm });

const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

const managerCandidates = computed(() => {
  // Prevent selecting self as manager
  return activeEmployeesOnly.value.filter(emp => emp._id !== form.value.employeeId);
});

const populateCurrentState = () => {
  const selectedEmp = props.employees.find(e => e._id === form.value.employeeId);
  if (selectedEmp) {
    form.value.fromDepartment = selectedEmp.department;
    form.value.fromRole = selectedEmp.role;
    form.value.fromManager = selectedEmp.managerId?._id || null;
    
    // Set defaults to current
    form.value.toDepartment = selectedEmp.department;
    form.value.toRole = selectedEmp.role;
  }
};

const closeModal = () => {
  showModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const handleComplete = async (id) => {
  try {
    await completeRedeployment(id);
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to complete redeployment.');
  }
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.toDepartment || !form.value.toRole || !form.value.effectiveDate || !form.value.reason) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    const payload = {
      employeeId: form.value.employeeId,
      effectiveDate: form.value.effectiveDate,
      fromDepartment: form.value.fromDepartment,
      fromRole: form.value.fromRole,
      fromManager: form.value.fromManager,
      toDepartment: form.value.toDepartment,
      toRole: form.value.toRole,
      reason: form.value.reason,
      status: form.value.autoComplete ? 'Completed' : 'Scheduled'
    };
    
    if (form.value.toManager) {
      payload.toManager = form.value.toManager;
    }

    await createRedeployment(payload);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to submit transfer.';
  } finally {
    submitting.value = false;
  }
};
</script>
