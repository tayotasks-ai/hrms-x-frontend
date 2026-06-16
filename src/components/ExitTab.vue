<template>
  <div class="space-y-6">
    <!-- Header panel with action toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Exit Management</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage offboarding, clearance checklists, and exit records.</p>
      </div>
      <button 
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-red-600 dark:bg-red-600 active:scale-[0.98] transition cursor-pointer"
      >
        <LogOut class="w-4 h-4" />
        <span>Initiate Exit</span>
      </button>
    </div>

    <!-- Exit Records Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Exit Type</th>
              <th class="py-3 px-6">Last Working Day</th>
              <th class="py-3 px-6">Clearance Progress</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="exits.length === 0" class="text-center text-zinc-500">
              <td colspan="6" class="py-12">
                <LogOut class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No active exits found.</p>
              </td>
            </tr>

            <template v-for="record in exits" :key="record._id">
              <tr class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer" @click="toggleRow(record._id)">
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ record.employeeId?.name || 'Deleted Employee' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ record.employeeId?.role }}
                  </div>
                </td>
                <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                  {{ record.exitType }}
                </td>
                <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                  {{ formatDate(record.lastWorkingDay) }}
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden w-24">
                      <div 
                        class="h-full bg-blue-500 rounded-full" 
                        :style="{ width: calculateProgress(record) + '%' }"
                      ></div>
                    </div>
                    <span class="text-[10px] text-zinc-500 font-mono">{{ calculateProgress(record) }}%</span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span :class="[
                    record.status === 'Completed' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800' :
                    record.status === 'Cleared' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                    'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
                    'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                  ]">
                    {{ record.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <div v-if="record.status === 'Cleared'" class="flex justify-end">
                     <button 
                      @click.stop="handleComplete(record._id)"
                      class="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white rounded border border-red-500/30 transition active:scale-95 cursor-pointer text-[10px] uppercase font-bold"
                    >
                      Archive & Offboard
                    </button>
                  </div>
                  <span v-else-if="record.status === 'Completed'" class="text-[10px] text-zinc-600 font-mono uppercase">Archived</span>
                  <ChevronDown v-else class="w-4 h-4 text-zinc-400 inline-block transition-transform duration-200" :class="expandedRow === record._id ? 'rotate-180' : ''" />
                </td>
              </tr>
              
              <!-- Expandable Clearance Checklist -->
              <tr v-if="expandedRow === record._id && record.status !== 'Completed'" class="bg-zinc-50/50 dark:bg-zinc-900/20">
                <td colspan="6" class="p-0">
                  <div class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/50">
                    <h4 class="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ListChecks class="w-4 h-4 text-lime-500" />
                      Clearance Checklist
                    </h4>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div 
                        v-for="task in record.clearanceChecklist" 
                        :key="task._id"
                        class="flex items-start justify-between p-3 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
                      >
                        <div class="flex items-start gap-3">
                          <button 
                            @click.stop="toggleTaskStatus(record._id, task)"
                            :class="[
                              task.status === 'Cleared' ? 'bg-lime-500 border-lime-600 text-white' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-transparent',
                              'w-5 h-5 rounded border mt-0.5 flex items-center justify-center transition cursor-pointer shrink-0'
                            ]"
                          >
                            <Check class="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ task.taskName }}</p>
                            <p class="text-[10px] text-zinc-500 font-mono mt-1">{{ task.department }}</p>
                          </div>
                        </div>
                        <div class="text-right">
                          <span :class="[
                            task.status === 'Cleared' ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-500',
                            'text-[10px] font-mono uppercase font-bold'
                          ]">
                            {{ task.status }}
                          </span>
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
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <LogOut class="w-4 h-4 text-red-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Initiate Offboarding</h3>
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
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
            <select 
              v-model="form.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 transition"
            >
              <option value="" disabled>Select Staff Member</option>
              <option 
                v-for="emp in activeEmployeesOnly" 
                :key="emp._id" 
                :value="emp._id"
              >
                {{ emp.name }} ({{ emp.department }})
              </option>
            </select>
          </div>

          <!-- Exit Type -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Exit Type</label>
            <select 
              v-model="form.exitType"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 transition"
            >
              <option value="Resignation">Resignation</option>
              <option value="Retirement">Retirement</option>
              <option value="Redundancy">Redundancy</option>
              <option value="Termination">Termination</option>
              <option value="Contract End">Contract End</option>
            </select>
          </div>

          <!-- Last Working Day -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Last Working Day</label>
            <input 
              v-model="form.lastWorkingDay"
              type="date"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-red-500 transition font-mono"
            />
          </div>

          <!-- Reason -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reason Details</label>
            <textarea 
              v-model="form.reason"
              rows="3"
              required
              placeholder="Provide background context..."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition"
            ></textarea>
          </div>

          <div class="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded flex items-start gap-2">
            <AlertTriangle class="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <p class="text-[10px] text-red-700 dark:text-red-400">
              Initiating this exit will automatically generate a clearance checklist and change the employee's status to 'Offboarding'.
            </p>
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
            class="px-4 py-2 bg-red-500 text-white font-semibold rounded text-sm hover:bg-red-600 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else>Confirm Offboarding</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { LogOut, X, ChevronDown, ListChecks, Check, AlertTriangle } from 'lucide-vue-next';

const props = defineProps({
  exits: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { initiateExit, updateClearanceTask, completeExit } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const expandedRow = ref(null);

const initialForm = {
  employeeId: '',
  exitType: 'Resignation',
  lastWorkingDay: '',
  reason: ''
};

const form = ref({ ...initialForm });

const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

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

const calculateProgress = (record) => {
  if (!record.clearanceChecklist || record.clearanceChecklist.length === 0) return 0;
  const cleared = record.clearanceChecklist.filter(t => t.status === 'Cleared').length;
  return Math.round((cleared / record.clearanceChecklist.length) * 100);
};

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const toggleTaskStatus = async (recordId, task) => {
  const newStatus = task.status === 'Cleared' ? 'Pending' : 'Cleared';
  try {
    await updateClearanceTask(recordId, task._id, { status: newStatus });
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update task.');
  }
};

const handleComplete = async (id) => {
  if (!confirm('Are you sure you want to finalize this exit? The employee profile will be archived.')) return;
  try {
    await completeExit(id);
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to complete exit.');
  }
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.lastWorkingDay || !form.value.reason) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await initiateExit(form.value);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to initiate exit.';
  } finally {
    submitting.value = false;
  }
};
</script>
