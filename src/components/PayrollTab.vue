<template>
  <div class="space-y-6">
    <!-- Header panel with submit toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Payroll & Compensation</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Process salaries, log deductions/allowances, and generate employee payslips.</p>
      </div>
      <button 
        v-if="authUser?.role !== 'Employee'"
        @click="showGenerateModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <Receipt class="w-4 h-4" />
        <span>Process Payroll</span>
      </button>
    </div>

    <!-- Payslip Directory -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Period</th>
              <th class="py-3 px-6">Base Salary</th>
              <th class="py-3 px-6">Allowances</th>
              <th class="py-3 px-6">Deductions</th>
              <th class="py-3 px-6 text-lime-600 dark:text-lime-400">Net Pay</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Invoice</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="payslips.length === 0" class="text-center text-zinc-500">
              <td colspan="8" class="py-12">
                <Receipt class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No payroll cycles processed for this tenant.</p>
              </td>
            </tr>

            <tr 
              v-for="slip in payslips" 
              :key="slip._id"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors"
            >
              <td class="py-4 px-6">
                <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ slip.employeeId?.name || 'Deleted Employee' }}
                </div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  {{ slip.employeeId?.role }}
                </div>
              </td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium">{{ slip.period }}</td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono">{{ formatCurrency(slip.basicSalary) }}</td>
              <td class="py-4 px-6 text-emerald-400 font-mono">+{{ formatCurrency(slip.allowances) }}</td>
              <td class="py-4 px-6 text-rose-400 font-mono">-{{ formatCurrency(slip.deductions) }}</td>
              <td class="py-4 px-6 font-semibold text-lime-600 dark:text-lime-400 font-mono">{{ formatCurrency(slip.netPay) }}</td>
              <td class="py-4 px-6">
                <span :class="[
                  slip.status === 'Paid' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
                  'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                ]">
                  {{ slip.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <button 
                  @click="openInvoice(slip)"
                  class="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs transition active:scale-95 ml-auto cursor-pointer"
                >
                  <Eye class="w-3.5 h-3.5 text-zinc-500" />
                  <span>View Payslip</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Process Payroll (Generate Payslip) Modal -->
    <div 
      v-if="showGenerateModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeGenerateModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Receipt class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Generate Payslip</h3>
          </div>
          <button @click="closeGenerateModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <!-- Employee Select -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Select Staff Member</label>
            <select 
              v-model="form.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Staff</option>
              <option 
                v-for="emp in activeEmployeesOnly" 
                :key="emp._id" 
                :value="emp._id"
              >
                {{ emp.name }} - {{ emp.role }} (Base: {{ formatCurrency(emp.salary) }}/mo)
              </option>
            </select>
          </div>

          <!-- Period -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Payroll Period</label>
            <input 
              v-model="form.period"
              type="text"
              required
              placeholder="e.g. May 2026"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-lime-500 transition"
            />
          </div>

          <!-- Allowances & Deductions Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Allowances ($)</label>
              <input 
                v-model="form.allowances"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Deductions / Taxes ($)</label>
              <input 
                v-model="form.deductions"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>

          <!-- Status -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Payment Status</label>
            <select 
              v-model="form.status"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="Paid">Paid</option>
              <option value="Draft">Draft (Unpaid)</option>
            </select>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeGenerateModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:bg-zinc-850 transition"
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
            <span v-if="submitting">Processing...</span>
            <span v-else>Generate Slip</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Printable Payslip Invoice Modal -->
    <div 
      v-if="showInvoiceModal && selectedSlip" 
      class="fixed inset-0 bg-white dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeInvoice"
    >
      <div class="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden relative">
        
        <!-- Print Close Button Banner -->
        <div class="h-16 px-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 print:hidden">
          <span class="text-xs font-mono text-zinc-500">Document Preview</span>
          <div class="flex items-center gap-2">
            <button 
              @click="triggerPrint"
              class="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-600 dark:bg-lime-400 text-black font-semibold px-3 py-1.5 rounded text-xs transition cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button @click="closeInvoice" class="p-1.5 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Printable Area -->
        <div class="p-8 space-y-8 flex-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" id="print-area">
          <!-- Corporate Header -->
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-lime-500 rounded flex items-center justify-center font-display font-bold text-black text-xs">
                  AG
                </div>
                <h4 class="font-display font-bold text-zinc-900 dark:text-zinc-100 text-base uppercase tracking-wider">{{ tenantName }}</h4>
              </div>
              <p class="text-xs text-zinc-500">Antigravity Multi-Tenant SaaS HRMS</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-display font-bold text-zinc-900 dark:text-zinc-50 tracking-wide uppercase">Payslip Invoice</h2>
              <span :class="[
                selectedSlip.status === 'Paid' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-900' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800',
                'px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded mt-1.5 inline-block'
              ]">
                Payment Status: {{ selectedSlip.status }}
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-[1px] bg-zinc-50 dark:bg-zinc-900"></div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-6 text-xs">
            <!-- Employee Section -->
            <div class="space-y-2">
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Employee Details</span>
              <div class="space-y-1 font-sans">
                <p class="text-sm font-bold text-zinc-800 dark:text-zinc-200">{{ selectedSlip.employeeId?.name || 'Deleted Employee' }}</p>
                <p class="text-zinc-600 dark:text-zinc-400">{{ selectedSlip.employeeId?.role }}</p>
                <p class="text-zinc-500">{{ selectedSlip.employeeId?.department }} Department</p>
                <p class="text-zinc-500 font-mono">{{ selectedSlip.employeeId?.email }}</p>
              </div>
            </div>

            <!-- Cycle Section -->
            <div class="space-y-2 text-right">
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Payroll Cycle</span>
              <div class="space-y-1">
                <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{{ selectedSlip.period }}</p>
                <p class="text-zinc-500 font-mono text-[10px]">Reference: #SLIP-{{ selectedSlip._id?.slice(-8).toUpperCase() }}</p>
                <p class="text-zinc-500 font-mono text-[10px]">Generated: {{ formatDate(selectedSlip.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Financial Table -->
          <div class="border border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 rounded overflow-hidden mt-6">
            <div class="grid grid-cols-3 py-2.5 px-4 bg-zinc-50 dark:bg-zinc-900/40 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-900">
              <div>Description</div>
              <div class="text-right">Earnings</div>
              <div class="text-right">Deductions</div>
            </div>
            
            <div class="divide-y divide-zinc-900/60 text-xs font-mono">
              <!-- Basic Salary -->
              <div class="grid grid-cols-3 py-3 px-4">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Basic Salary</div>
                <div class="text-right text-zinc-700 dark:text-zinc-300">{{ formatCurrency(selectedSlip.basicSalary) }}</div>
                <div class="text-right text-zinc-600">-</div>
              </div>
              
              <!-- Allowances -->
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.allowances > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Allowances & Bonuses</div>
                <div class="text-right text-emerald-400">+{{ formatCurrency(selectedSlip.allowances) }}</div>
                <div class="text-right text-zinc-600">-</div>
              </div>
              
              <!-- Deductions -->
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.deductions > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Tax & Deductions</div>
                <div class="text-right text-zinc-600">-</div>
                <div class="text-right text-rose-400">-{{ formatCurrency(selectedSlip.deductions) }}</div>
              </div>
            </div>
          </div>

          <!-- Total Payroll Panel -->
          <div class="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-900 rounded p-4 flex justify-between items-center mt-6">
            <div>
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Net Disbursement</span>
              <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Amount credited to account</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-display font-bold text-lime-600 dark:text-lime-400 font-mono">{{ formatCurrency(selectedSlip.netPay) }}</span>
            </div>
          </div>

          <!-- Footer disclaimer -->
          <div class="text-center text-[10px] text-zinc-600 font-mono pt-12">
            This is a system-generated document and requires no physical signature. Scoped for {{ tenantName }}.
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Eye, Printer, X, Receipt } from 'lucide-vue-next';

const props = defineProps({
  payslips: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  },
  tenantName: {
    type: String,
    required: true
  },
  authUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['refresh']);

const { generatePayslip } = useApi();

const showGenerateModal = ref(false);
const showInvoiceModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const selectedSlip = ref(null);

const initialForm = {
  employeeId: '',
  period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  allowances: '',
  deductions: '',
  status: 'Paid'
};

const form = ref({ ...initialForm });

// Only active or onboarding employees can have payslips processed
const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

const closeGenerateModal = () => {
  showGenerateModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const openInvoice = (slip) => {
  selectedSlip.value = slip;
  showInvoiceModal.value = true;
};

const closeInvoice = () => {
  showInvoiceModal.value = false;
  selectedSlip.value = null;
};

const triggerPrint = () => {
  window.print();
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.period) {
    formError.value = 'Please select an employee and period.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await generatePayslip({
      employeeId: form.value.employeeId,
      period: form.value.period,
      allowances: form.value.allowances ? parseFloat(form.value.allowances) : 0,
      deductions: form.value.deductions ? parseFloat(form.value.deductions) : 0,
      status: form.value.status
    });
    
    emit('refresh');
    closeGenerateModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to generate payslip.';
  } finally {
    submitting.value = false;
  }
};

// Formatting Utilities
const formatCurrency = (val) => {
  if (val === undefined || val === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style>
/* Specific Print Stylesheet to hide dashboard chrome */
@media print {
  body * {
    visibility: hidden;
  }
  #print-area, #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background-color: white !important;
    color: black !important;
  }
  #print-area .text-zinc-900 dark:text-zinc-100,
  #print-area .text-zinc-800 dark:text-zinc-200,
  #print-area .text-zinc-700 dark:text-zinc-300,
  #print-area .text-zinc-600 dark:text-zinc-400,
  #print-area .text-zinc-900 dark:text-zinc-50 {
    color: black !important;
  }
  #print-area .text-zinc-500,
  #print-area .text-zinc-600 {
    color: #666 !important;
  }
  #print-area .bg-white dark:bg-zinc-950,
  #print-area .bg-zinc-50 dark:bg-zinc-900,
  #print-area .bg-zinc-50 dark:bg-zinc-900\/40,
  #print-area .bg-zinc-50 dark:bg-zinc-900\/10 {
    background-color: transparent !important;
    border-color: #ddd !important;
  }
  #print-area .border,
  #print-area .border-b,
  #print-area .border-t {
    border-color: #ddd !important;
  }
  #print-area .text-lime-600 dark:text-lime-400 {
    color: #2e7d32 !important; /* Dark Green for printable invoice */
  }
}
</style>
