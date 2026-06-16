<template>
  <div class="space-y-6">
    <!-- Header panel with submit toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Leave Management</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage employee time-off requests and approvals.</p>
      </div>
      <button 
        @click="showRequestModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <CalendarPlus class="w-4 h-4" />
        <span>Request Leave</span>
      </button>
    </div>

    <!-- Leaves List Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Leave Type</th>
              <th class="py-3 px-6">Duration</th>
              <th class="py-3 px-6">Reason</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right" v-if="authUser?.role !== 'Employee'">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="leaves.length === 0" class="text-center text-zinc-500">
              <td colspan="6" class="py-12">
                <CalendarRange class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No leave requests found for this tenant.</p>
              </td>
            </tr>

            <tr 
              v-for="leave in leaves" 
              :key="leave._id"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ leave.employeeId?.name || 'Deleted Employee' }}
                </div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  {{ leave.employeeId?.role }}
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  leave.type === 'Sick' ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60' :
                  leave.type === 'Annual' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/60' :
                  'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60',
                  'px-2 py-0.5 rounded border text-xs font-semibold'
                ]">
                  {{ leave.type }}
                </span>
              </td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                <div class="font-semibold">{{ calculateDays(leave.startDate, leave.endDate) }} days</div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  {{ formatDateRange(leave.startDate, leave.endDate) }}
                </div>
              </td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400 max-w-xs truncate" :title="leave.reason">
                {{ leave.reason || 'No reason provided' }}
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  leave.status === 'Approved' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  leave.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
                  'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
                  'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                ]">
                  {{ leave.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right" v-if="authUser?.role !== 'Employee'">
                <div v-if="leave.status === 'Pending'" class="flex items-center justify-end gap-2">
                  <button 
                    @click="handleStatusUpdate(leave._id, 'Approved')"
                    class="p-1.5 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-900/40 transition active:scale-95 cursor-pointer"
                    title="Approve Leave"
                  >
                    <Check class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="handleStatusUpdate(leave._id, 'Rejected')"
                    class="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-900/40 transition active:scale-95 cursor-pointer"
                    title="Reject Leave"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <span v-else class="text-xs text-zinc-600 font-mono">Processed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Request Leave Modal -->
    <div 
      v-if="showRequestModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CalendarPlus class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Submit Leave Request</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <!-- Employee Select -->
          <div v-if="authUser?.role !== 'Employee'" class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
            <select 
              v-model="form.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
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

          <!-- Leave Type -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Type of Leave</label>
            <select 
              v-model="form.type"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="Annual">Annual Leave (Vacation)</option>
              <option value="Sick">Sick Leave</option>
              <option value="Maternity">Maternity Leave</option>
              <option value="Paternity">Paternity Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
          </div>

          <!-- Dates Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Start Date</label>
              <input 
                v-model="form.startDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">End Date</label>
              <input 
                v-model="form.endDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>

          <!-- Reason -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reason / Description</label>
            <textarea 
              v-model="form.reason"
              rows="3"
              placeholder="Provide a brief description..."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-855 transition"
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
            <span v-if="submitting">Submitting...</span>
            <span v-else>Submit Request</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { CalendarRange, CalendarPlus, Check, X } from 'lucide-vue-next';

const props = defineProps({
  leaves: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  },
  authUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['refresh']);

const { createLeave, approveLeave, rejectLeave } = useApi();

const showRequestModal = ref(false);
const submitting = ref(false);
const formError = ref(null);

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const initialForm = {
  employeeId: '',
  type: 'Annual',
  startDate: getTodayStr(),
  endDate: getTodayStr(),
  reason: ''
};

const form = ref({ ...initialForm });

// Only active or onboarding employees can request leaves
const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

const closeModal = () => {
  showRequestModal.value = false;
  form.value = { ...initialForm };
  if (props.authUser?.role === 'Employee') {
    form.value.employeeId = props.authUser._id;
  }
  formError.value = null;
};

const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const diffTime = Math.abs(new Date(end) - new Date(start));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const formatDateRange = (start, end) => {
  if (!start || !end) return '';
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} - ${e}`;
};

const handleStatusUpdate = async (leaveId, decision) => {
  try {
    if (decision === 'Approved') {
      await approveLeave(leaveId);
    } else {
      await rejectLeave(leaveId);
    }
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update leave request status.');
  }
};

const handleSubmit = async () => {
  if (props.authUser?.role === 'Employee') {
    form.value.employeeId = props.authUser._id;
  }

  if (!form.value.employeeId || !form.value.type || !form.value.startDate || !form.value.endDate) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  if (new Date(form.value.endDate) < new Date(form.value.startDate)) {
    formError.value = 'End date cannot be earlier than start date.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await createLeave({
      employeeId: form.value.employeeId,
      type: form.value.type,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      reason: form.value.reason
    });
    
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to request leave.';
  } finally {
    submitting.value = false;
  }
};
</script>
