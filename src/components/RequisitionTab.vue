<template>
  <div class="space-y-6">
    <!-- Header panel with submit toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Requisition Management</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage and track expense and service requisitions.</p>
      </div>
      <button 
        @click="showRequestModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <PlusCircle class="w-4 h-4" />
        <span>New Requisition</span>
      </button>
    </div>

    <!-- Requisitions List Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Type</th>
              <th class="py-3 px-6">Description</th>
              <th class="py-3 px-6">Amount / Details</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="requisitions.length === 0" class="text-center text-zinc-500">
              <td colspan="6" class="py-12">
                <FileText class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No requisitions found.</p>
              </td>
            </tr>

            <tr 
              v-for="req in requisitions" 
              :key="req._id"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ req.employeeId?.name || 'Deleted Employee' }}
                </div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  {{ req.employeeId?.role }}
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  req.type === 'Expense' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/60' : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/60',
                  'px-2 py-0.5 rounded border text-xs font-semibold'
                ]">
                  {{ req.type }}
                </span>
              </td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400 max-w-xs truncate" :title="req.description">
                {{ req.description }}
              </td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                <div v-if="req.type === 'Expense'" class="font-semibold">
                  {{ formatCurrency(req.amount) }}
                </div>
                <div v-if="req.type === 'Service'">
                  <span :class="[
                    req.urgency === 'Critical' ? 'text-red-500' :
                    req.urgency === 'High' ? 'text-orange-500' : 'text-zinc-500'
                  ]">{{ req.urgency }} Urgency</span>
                </div>
                <div class="text-[10px] text-zinc-500 mt-1">
                  {{ req.type === 'Expense' ? req.costCentre : req.serviceType }}
                </div>
              </td>
              <td class="py-4 px-6">
                <span :class="[
                  req.status === 'Approved' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  req.status === 'Rejected' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900' :
                  req.status === 'Processed' ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800' :
                  'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900',
                  'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                ]">
                  {{ req.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div v-if="req.status === 'Pending'" class="flex items-center justify-end gap-2">
                  <button 
                    @click="handleStatusUpdate(req._id, 'Approved')"
                    class="p-1.5 bg-lime-500/10 hover:bg-lime-500 text-lime-600 dark:text-lime-400 hover:text-black rounded border border-lime-900/40 transition active:scale-95 cursor-pointer"
                    title="Approve"
                  >
                    <Check class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="handleStatusUpdate(req._id, 'Rejected')"
                    class="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded border border-red-900/40 transition active:scale-95 cursor-pointer"
                    title="Reject"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
                <div v-else-if="req.status === 'Approved'" class="flex items-center justify-end">
                   <button 
                    @click="handleStatusUpdate(req._id, 'Processed')"
                    class="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-zinc-800 transition active:scale-95 cursor-pointer text-xs"
                  >
                    Mark Processed
                  </button>
                </div>
                <span v-else class="text-xs text-zinc-600 font-mono">Closed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Request Modal -->
    <div 
      v-if="showRequestModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <PlusCircle class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">New Requisition</h3>
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
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
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

          <!-- Type -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Requisition Type</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="Expense" class="text-lime-500 focus:ring-lime-500 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                <span class="text-sm text-zinc-800 dark:text-zinc-200">Expense</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="form.type" value="Service" class="text-lime-500 focus:ring-lime-500 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700">
                <span class="text-sm text-zinc-800 dark:text-zinc-200">Service</span>
              </label>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Description</label>
            <textarea 
              v-model="form.description"
              rows="2"
              required
              placeholder="What is this request for?"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
          </div>

          <!-- Expense Fields -->
          <template v-if="form.type === 'Expense'">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Amount (NGN)</label>
                <input 
                  v-model="form.amount"
                  type="number"
                  required
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Cost Centre</label>
                <input 
                  v-model="form.costCentre"
                  type="text"
                  placeholder="e.g. MKT-001"
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                />
              </div>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Justification</label>
              <textarea 
                v-model="form.justification"
                rows="2"
                placeholder="Business case for this expense"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
              ></textarea>
            </div>
          </template>

          <!-- Service Fields -->
          <template v-if="form.type === 'Service'">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Service Type</label>
                <input 
                  v-model="form.serviceType"
                  type="text"
                  placeholder="e.g. IT Repair, Software"
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                />
              </div>
              <div class="space-y-1">
                <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Urgency</label>
                <select 
                  v-model="form.urgency"
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Preferred Vendor (Optional)</label>
              <input 
                v-model="form.preferredVendor"
                type="text"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
              />
            </div>
          </template>

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
import { FileText, PlusCircle, Check, X } from 'lucide-vue-next';

const props = defineProps({
  requisitions: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { createRequisition, updateRequisitionStatus } = useApi();

const showRequestModal = ref(false);
const submitting = ref(false);
const formError = ref(null);

const initialForm = {
  employeeId: '',
  type: 'Expense',
  description: '',
  amount: '',
  costCentre: '',
  justification: '',
  serviceType: '',
  urgency: 'Medium',
  preferredVendor: ''
};

const form = ref({ ...initialForm });

// Only active or onboarding employees can submit requisitions
const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

const closeModal = () => {
  showRequestModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const formatCurrency = (val) => {
  if (val === undefined || val === null) return '₦0';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(val);
};

const handleStatusUpdate = async (id, decision) => {
  try {
    await updateRequisitionStatus(id, { status: decision });
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update requisition status.');
  }
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.description) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  if (form.value.type === 'Expense' && !form.value.amount) {
    formError.value = 'Amount is required for expense requisitions.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    const payload = {
      employeeId: form.value.employeeId,
      type: form.value.type,
      description: form.value.description,
      status: 'Pending'
    };

    if (form.value.type === 'Expense') {
      payload.amount = parseFloat(form.value.amount);
      payload.costCentre = form.value.costCentre;
      payload.justification = form.value.justification;
    } else {
      payload.serviceType = form.value.serviceType;
      payload.urgency = form.value.urgency;
      payload.preferredVendor = form.value.preferredVendor;
    }

    await createRequisition(payload);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to submit requisition.';
  } finally {
    submitting.value = false;
  }
};
</script>
