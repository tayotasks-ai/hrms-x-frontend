<template>
  <div class="space-y-6">
    <!-- Header panel with submit toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Leave Management</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage employee time-off requests and approvals.</p>
      </div>
      <div class="w-full sm:w-auto flex items-center gap-2">
        <button
          v-if="authUser?.role !== 'Employee'"
          @click="openPolicyPanel"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-2 rounded text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <Settings class="w-4 h-4" />
          <span>Leave Policy</span>
        </button>
        <button
          @click="showRequestModal = true"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
        >
          <CalendarPlus class="w-4 h-4" />
          <span>Request Leave</span>
        </button>
      </div>
    </div>

    <!-- Leave Policy Panel (HR only) -->
    <div v-if="showPolicyPanel" class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-5 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Annual Leave Policy</h4>
          <p class="text-xs text-zinc-500 mt-0.5">Days allowed per year, per leave type. Applies to every employee. Set a type to 0 for no cap.</p>
        </div>
      </div>

      <div v-if="policyError" class="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
        {{ policyError }}
      </div>
      <div v-if="policySuccess" class="p-2.5 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
        {{ policySuccess }}
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div v-for="type in LEAVE_TYPES" :key="type" class="space-y-1">
          <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{{ type }}</label>
          <input
            v-model.number="policyForm[type]"
            type="number"
            min="0"
            class="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-lime-500 transition"
          />
        </div>
      </div>

      <div class="flex items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <label class="flex items-start gap-2 cursor-pointer">
          <input
            v-model="policyForm.requireReliefOfficer"
            type="checkbox"
            class="mt-0.5 w-4 h-4 accent-lime-500 cursor-pointer"
          />
          <span class="text-xs text-zinc-600 dark:text-zinc-400">
            <span class="font-semibold text-zinc-800 dark:text-zinc-200">Require relief officer sign-off.</span>
            When on, a leave request that has a relief officer selected must get that person's approval before it reaches the manager step.
          </span>
        </label>
      </div>

      <div class="flex items-center gap-2 pt-1">
        <button
          @click="savePolicy"
          :disabled="savingPolicy"
          class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
        >
          {{ savingPolicy ? 'Saving…' : 'Save Policy' }}
        </button>
        <button @click="showPolicyPanel = false" class="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer">Close</button>
      </div>
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
              <th class="py-3 px-6 text-right">Actions</th>
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
              @click="openDetailModal(leave)"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer"
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
                <span :class="[statusBadgeClass(leave.status), 'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border']">
                  {{ leave.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right" @click.stop>
                <!-- Relief officer's sign-off (only in play when policy requires it and this request has one assigned) -->
                <div v-if="isReliefOfficerOf(leave) && leave.status === 'Pending'" class="flex items-center justify-end gap-2">
                  <button
                    @click="handleStatusUpdate(leave._id, 'Relief Officer Approved')"
                    class="p-1.5 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-900/40 transition active:scale-95 cursor-pointer"
                    title="Approve as Relief Officer"
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

                <!-- Manager's sign-off: straight from Pending (no relief step in play), or after relief officer approval -->
                <div v-else-if="isManagerOf(leave) && (leave.status === 'Relief Officer Approved' || (leave.status === 'Pending' && !reliefGates(leave)))" class="flex items-center justify-end gap-2">
                  <button
                    @click="handleStatusUpdate(leave._id, 'Manager Approved')"
                    class="p-1.5 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-900/40 transition active:scale-95 cursor-pointer"
                    title="Approve as Manager"
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

                <!-- HR's final sign-off: from Manager Approved, or straight from Pending/Relief Officer Approved if the employee has no manager -->
                <div
                  v-else-if="authUser?.role !== 'Employee' && (leave.status === 'Manager Approved' || ((leave.status === 'Pending' || leave.status === 'Relief Officer Approved') && !leave.employeeId?.managerId))"
                  class="flex items-center justify-end gap-2"
                >
                  <button
                    @click="handleStatusUpdate(leave._id, 'HR Approved')"
                    class="p-1.5 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-900/40 transition active:scale-95 cursor-pointer"
                    title="Give Final HR Approval"
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

                <!-- HR marks the approved leave as processed (payroll/records updated) -->
                <button
                  v-else-if="authUser?.role !== 'Employee' && leave.status === 'HR Approved'"
                  @click="handleStatusUpdate(leave._id, 'Processed')"
                  class="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-semibold transition active:scale-95 cursor-pointer"
                >
                  Mark Processed
                </button>

                <span v-else class="text-xs text-zinc-600 font-mono">&mdash;</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Request Leave Modal -->
    <div 
      v-if="showRequestModal" 
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
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
                {{ emp.name }} ({{ emp.departmentId?.name || 'No Department' }})
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
              <option value="Compassionate">Compassionate Leave</option>
              <option value="Study">Study Leave</option>
              <option value="Emergency">Emergency Leave</option>
              <option value="Unpaid">Unpaid Leave</option>
            </select>
            <p v-if="selectedBalance" class="text-[11px] font-mono pt-0.5" :class="selectedBalance.unlimited ? 'text-zinc-500' : selectedBalance.remaining === 0 ? 'text-red-500' : 'text-zinc-500'">
              <span v-if="selectedBalance.unlimited">No cap on {{ form.type }} leave.</span>
              <span v-else>{{ selectedBalance.remaining }} of {{ selectedBalance.entitlement }} day(s) remaining this year.</span>
            </p>
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

          <!-- Relief Officer -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Relief Officer<span v-if="policy.requireReliefOfficer" class="text-red-500"> *</span>
            </label>
            <select
              v-model="form.reliefOfficer"
              :required="!!policy.requireReliefOfficer"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="">{{ reliefOfficerOptions.length ? 'None' : 'No eligible colleagues in this department' }}</option>
              <option v-for="emp in reliefOfficerOptions" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
            </select>
            <p class="text-[11px] font-mono text-zinc-500 pt-0.5">
              Someone in your department who covers your duties while you're away. They'll be asked to sign off before it goes to your manager.
            </p>
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

    <!-- Leave Detail Modal -->
    <div
      v-if="detailLeave"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="detailLeave = null"
    >
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <CalendarRange class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Leave Request Details</h3>
          </div>
          <button @click="detailLeave = null" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4 overflow-y-auto text-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="font-semibold text-zinc-800 dark:text-zinc-200">{{ detailLeave.employeeId?.name || 'Deleted Employee' }}</div>
              <div class="text-[11px] text-zinc-500 font-mono">{{ detailLeave.employeeId?.role || '—' }} &middot; {{ detailLeave.employeeId?.departmentId?.name || 'No Department' }}</div>
            </div>
            <span :class="[statusBadgeClass(detailLeave.status), 'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border shrink-0']">
              {{ detailLeave.status }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Leave Type</div>
              <div class="text-zinc-800 dark:text-zinc-200 mt-0.5">{{ detailLeave.type }}</div>
            </div>
            <div>
              <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Duration</div>
              <div class="text-zinc-800 dark:text-zinc-200 mt-0.5">{{ detailLeave.workingDays || calculateDays(detailLeave.startDate, detailLeave.endDate) }} day(s)</div>
            </div>
            <div>
              <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Start Date</div>
              <div class="text-zinc-800 dark:text-zinc-200 mt-0.5 font-mono">{{ formatFullDate(detailLeave.startDate) }}</div>
            </div>
            <div>
              <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">End Date</div>
              <div class="text-zinc-800 dark:text-zinc-200 mt-0.5 font-mono">{{ formatFullDate(detailLeave.endDate) }}</div>
            </div>
          </div>

          <div>
            <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Reason</div>
            <div class="text-zinc-700 dark:text-zinc-300 mt-0.5">{{ detailLeave.reason || 'No reason provided' }}</div>
          </div>

          <div v-if="detailLeave.reliefOfficer">
            <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Relief Officer</div>
            <div class="text-zinc-700 dark:text-zinc-300 mt-0.5 flex items-center gap-2">
              <span>{{ detailLeave.reliefOfficer.name }}</span>
              <span :class="[
                detailLeave.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
                'px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
              ]">
                {{ detailLeave.status === 'Pending' ? 'Awaiting sign-off' : 'Signed off' }}
              </span>
            </div>
          </div>

          <div v-if="detailLeave.documentAttachment">
            <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Attachment</div>
            <a :href="detailLeave.documentAttachment" target="_blank" rel="noopener" class="text-lime-600 dark:text-lime-400 hover:underline text-xs mt-0.5 inline-block">View document</a>
          </div>

          <div>
            <div class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Requested On</div>
            <div class="text-zinc-700 dark:text-zinc-300 mt-0.5 font-mono text-xs">{{ formatFullDate(detailLeave.createdAt) }}</div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
          <button @click="detailLeave = null" class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-855 transition cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { CalendarRange, CalendarPlus, Check, X, Settings } from 'lucide-vue-next';

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

const { createLeave, updateLeaveStatus, getLeavePolicy, updateLeavePolicy } = useApi();

const showRequestModal = ref(false);
const submitting = ref(false);
const formError = ref(null);

const LEAVE_TYPES = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Compassionate', 'Study', 'Emergency', 'Unpaid'];

// ── Leave policy (company-wide day allocations per type) ─────────────────────
const policy = ref({});
const showPolicyPanel = ref(false);
const policyForm = ref({});
const savingPolicy = ref(false);
const policyError = ref(null);
const policySuccess = ref(null);

const loadPolicy = async () => {
  try {
    policy.value = await getLeavePolicy();
  } catch {
    // Non-fatal — balance hints just won't show if this fails.
  }
};

const openPolicyPanel = () => {
  policyForm.value = { ...policy.value };
  policyError.value = null;
  policySuccess.value = null;
  showPolicyPanel.value = true;
};

const savePolicy = async () => {
  savingPolicy.value = true;
  policyError.value = null;
  policySuccess.value = null;
  try {
    policy.value = await updateLeavePolicy(policyForm.value);
    policySuccess.value = 'Leave policy updated.';
    setTimeout(() => { policySuccess.value = null; }, 3000);
  } catch (err) {
    policyError.value = err.response?.data?.message || err.message || 'Failed to update leave policy.';
  } finally {
    savingPolicy.value = false;
  }
};

onMounted(loadPolicy);

// ── Balance (client-side hint only — the server enforces the actual cap) ────
const currentYear = new Date().getFullYear();

const usedDaysForEmployeeType = (employeeId, type) => {
  return props.leaves
    .filter(l => {
      const empId = l.employeeId?._id || l.employeeId;
      return empId === employeeId && l.type === type && l.status !== 'Rejected'
        && new Date(l.startDate).getFullYear() === currentYear;
    })
    .reduce((sum, l) => sum + (l.workingDays || 0), 0);
};

const selectedBalance = computed(() => {
  const empId = form.value.employeeId || (props.authUser?.role === 'Employee' ? props.authUser._id : null);
  if (!empId || !form.value.type) return null;
  const entitlement = policy.value?.[form.value.type];
  if (!entitlement) return { unlimited: true };
  const used = usedDaysForEmployeeType(empId, form.value.type);
  return { entitlement, used, remaining: Math.max(entitlement - used, 0) };
});

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const initialForm = {
  employeeId: '',
  type: 'Annual',
  startDate: getTodayStr(),
  endDate: getTodayStr(),
  reason: '',
  reliefOfficer: ''
};

const form = ref({ ...initialForm });

// Only active or onboarding employees can request leaves
const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

// The employee this request is being filed for — themself if a self-service
// Employee, or whoever HR picked in the Employee select above.
const requestingEmployee = computed(() => {
  const id = props.authUser?.role === 'Employee' ? props.authUser._id : form.value.employeeId;
  return props.employees.find(e => e._id === id) || null;
});

// Same-department, active colleagues who could stand in as relief officer —
// excludes the requester themself.
const reliefOfficerOptions = computed(() => {
  const deptId = requestingEmployee.value?.departmentId?._id || requestingEmployee.value?.departmentId;
  if (!deptId) return [];
  return activeEmployeesOnly.value.filter(emp => {
    const empDeptId = emp.departmentId?._id || emp.departmentId;
    return empDeptId === deptId && emp._id !== requestingEmployee.value?._id;
  });
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
    await updateLeaveStatus(leaveId, decision);
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update leave request status.');
  }
};

// True when the logged-in account is this leave request's employee's direct manager.
const isManagerOf = (leave) => {
  return props.authUser?.role === 'Employee'
    && leave.employeeId?.managerId
    && leave.employeeId.managerId === props.authUser._id;
};

// True when the logged-in account is this leave request's assigned relief officer.
const isReliefOfficerOf = (leave) => {
  if (props.authUser?.role !== 'Employee' || !leave.reliefOfficer) return false;
  const officerId = leave.reliefOfficer._id || leave.reliefOfficer;
  return officerId === props.authUser._id;
};

// Mirrors the backend's reliefGates check: the relief-officer step only
// actually gates the chain when the tenant policy requires it AND this
// specific request has one assigned.
const reliefGates = (leave) => !!policy.value?.requireReliefOfficer && !!leave.reliefOfficer;

const statusBadgeClass = (status) => ({
  'HR Approved': 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
  'Processed': 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
  'Manager Approved': 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  'Relief Officer Approved': 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900',
  'Rejected': 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900',
  'Pending': 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
}[status] || 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800');

// ── Leave detail modal ────────────────────────────────────────────────────
const detailLeave = ref(null);
const openDetailModal = (leave) => { detailLeave.value = leave; };

const formatFullDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
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

  if (policy.value?.requireReliefOfficer && !form.value.reliefOfficer) {
    formError.value = 'A relief officer is required for leave requests at this organisation.';
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
      reason: form.value.reason,
      reliefOfficer: form.value.reliefOfficer || undefined
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
