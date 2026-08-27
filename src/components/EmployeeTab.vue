<template>
  <div class="flex h-full overflow-hidden relative">
    <div class="w-full space-y-6 overflow-y-auto pr-2 pb-20">
    <!-- Freemium plan banner -->
    <div
      v-if="plan && plan.tier === 'Free'"
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-lg border"
      :class="plan.employeeCount >= plan.freeEmployeeLimit
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'"
    >
      <div class="flex items-center gap-2 text-sm">
        <Sparkles class="w-4 h-4 text-amber-500 shrink-0" />
        <span class="text-zinc-700 dark:text-zinc-300">
          <span class="font-semibold">Free plan:</span>
          {{ plan.employeeCount }}/{{ plan.freeEmployeeLimit }} employees used
          <template v-if="plan.employeeCount >= plan.freeEmployeeLimit"> — limit reached, upgrade to add more.</template>
          <span class="text-zinc-500 dark:text-zinc-400"> · ₦{{ (plan.pricePerEmployee || 1500).toLocaleString() }}/employee/month once upgraded (~₦{{ ((plan.pricePerEmployee || 1500) * plan.employeeCount).toLocaleString() }}/mo for your current headcount)</span>
        </span>
      </div>
      <button
        @click="handleUpgrade"
        :disabled="upgrading"
        class="shrink-0 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-4 py-2 rounded text-sm hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
      >
        {{ upgrading ? 'Upgrading…' : 'Upgrade' }}
      </button>
    </div>
    <p v-if="planError" class="text-xs text-red-500 font-mono -mt-4">{{ planError }}</p>

    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div class="relative w-full sm:w-72">
        <Search class="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search directory..." 
          class="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition font-sans"
        />
      </div>
      <div class="w-full sm:w-auto flex items-center gap-2">
        <button
          @click="exportHeadcountCsv"
          class="flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-2 rounded text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <Download class="w-4 h-4" />
          <span>Export CSV</span>
        </button>
        <button
          @click="openBulkModal"
          class="flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-2 rounded text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <Upload class="w-4 h-4" />
          <span>Bulk Import</span>
        </button>
        <button
          @click="showAddModal = true"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
        >
          <Plus class="w-4 h-4" />
          <span>Register Employee</span>
        </button>
      </div>
    </div>

    <!-- Employee Table Directory -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Name</th>
              <th class="py-3 px-6">Contact</th>
              <th class="py-3 px-6">Department</th>
              <th class="py-3 px-6">Role</th>
              <th class="py-3 px-6">Salary (Monthly)</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6">Joined</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="filteredEmployees.length === 0" class="text-center text-zinc-500">
              <td colspan="7" class="py-12">
                <Users class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No employees found matching the search criteria.</p>
              </td>
            </tr>

            <tr 
              v-for="employee in filteredEmployees" 
              :key="employee._id"
              @click="selectedEmployee = employee"
              class="hover:bg-zinc-100 dark:hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer"
              :class="{'bg-lime-50 dark:bg-lime-900/20': selectedEmployee?._id === employee._id}"
            >
              <td class="py-4 px-6 font-semibold text-zinc-800 dark:text-zinc-200">{{ employee.name }}</td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{{ employee.email }}</td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300">
                <span class="bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded text-xs border border-zinc-200 dark:border-zinc-800">
                  {{ employee.departmentId?.name || employee.department || 'Unassigned' }}
                </span>
              </td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400">{{ employee.role }}</td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono">{{ formatCurrency(employee.salary) }}</td>
              <td class="py-4 px-6">
                <span :class="[
                  employee.status === 'Active' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  employee.status === 'Onboarding' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                  'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
                  'px-2 py-0.5 text-xs font-medium rounded border uppercase tracking-wider text-[10px]'
                ]">
                  {{ employee.status }}
                </span>
              </td>
              <td class="py-4 px-6 text-zinc-500 font-mono text-xs">{{ formatDate(employee.joinDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Supabase-style Slide-over Modal Backdrop -->
    <div 
      v-if="showAddModal" 
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-end z-50 transition-opacity"
      @click.self="closeModal"
    >
      <!-- Modal Container -->
      <div class="w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-2xl">
        <!-- Modal Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UserPlus class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Register New Employee</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Modal Body (Scrollable Form) -->
        <form @submit.prevent="handleSubmit" class="flex-1 p-6 space-y-4 overflow-y-auto">
          <!-- Notification Error Banner -->
          <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs leading-relaxed font-mono">
            {{ formError }}
          </div>

          <!-- Name -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Full Name</label>
            <input 
              v-model="form.name"
              type="text" 
              required
              placeholder="e.g. John Doe"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-sans"
            />
          </div>

          <!-- Email -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Email Address</label>
            <input 
              v-model="form.email"
              type="email" 
              required
              placeholder="e.g. john@company.com"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
            />
          </div>

          <!-- Role -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Role / Job Title</label>
            <input 
              v-model="form.role"
              type="text" 
              required
              placeholder="e.g. Senior Software Engineer"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-sans"
            />
          </div>

          <!-- Department -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Department</label>
            <select
              v-if="!showNewDeptInput"
              v-model="form.departmentId"
              required
              @change="handleDepartmentSelect"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Department</option>
              <option v-for="dept in departmentOptions" :key="dept._id" :value="dept._id">
                {{ dept.name }}
              </option>
              <option value="__new__">+ Add New Department</option>
            </select>
            <div v-else class="flex gap-2">
              <input
                v-model="newDeptName"
                type="text"
                placeholder="New department name"
                class="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition"
              />
              <button
                type="button"
                @click="handleCreateDepartment"
                :disabled="creatingDept"
                class="px-3 py-2 bg-lime-500 text-black font-semibold rounded text-xs hover:bg-lime-600 transition cursor-pointer disabled:opacity-50"
              >
                {{ creatingDept ? 'Adding...' : 'Add' }}
              </button>
              <button
                type="button"
                @click="cancelNewDepartment"
                class="px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Salary -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Monthly Salary (₦)</label>
            <input 
              v-model="form.salary"
              type="number" 
              required
              min="0"
              placeholder="e.g. 7500"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
            />
          </div>

          <!-- Status -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Onboarding Status</label>
            <select 
              v-model="form.status"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="Active">Active</option>
              <option value="Onboarding">Onboarding</option>
              <option value="Offboarded">Offboarded</option>
            </select>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Join Date</label>
              <input 
                v-model="form.joinDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-semibold">Date of Birth</label>
              <input 
                v-model="form.birthDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>
        </form>

        <!-- Modal Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="handleSubmit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition flex items-center gap-1.5 cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Saving...</span>
            <span v-else>Register Profile</span>
          </button>
        </div>
      </div>
      </div>
    </div>
    
    <!-- Bulk Import Modal -->
    <div
      v-if="showBulkModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeBulkModal"
    >
      <div class="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <Upload class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Bulk Import Employees</h3>
          </div>
          <button @click="closeBulkModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded">
            <p class="text-xs text-zinc-600 dark:text-zinc-400">Upload a CSV with columns: <code class="font-mono text-[11px]">name, email, role, department, salary, status, joinDate, birthDate</code></p>
            <button @click="downloadTemplate" class="shrink-0 ml-3 flex items-center gap-1 text-xs font-semibold text-lime-600 dark:text-lime-400 hover:underline">
              <Download class="w-3.5 h-3.5" /> Template
            </button>
          </div>

          <div v-if="bulkError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
            {{ bulkError }}
          </div>

          <!-- File picker -->
          <label class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg py-8 cursor-pointer hover:border-lime-500 transition">
            <FileSpreadsheet class="w-6 h-6 text-zinc-400" />
            <span class="text-xs text-zinc-500">{{ csvFileName || 'Click to choose a .csv file' }}</span>
            <input type="file" accept=".csv,text/csv" class="hidden" @change="handleFileSelect" />
          </label>

          <!-- Preview -->
          <div v-if="csvRows.length > 0" class="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
            <div class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/40 text-[11px] font-mono text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
              {{ csvRows.length }} row(s) ready to import
            </div>
            <div class="max-h-48 overflow-y-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <th class="py-1.5 px-3">Name</th>
                    <th class="py-1.5 px-3">Email</th>
                    <th class="py-1.5 px-3">Role</th>
                    <th class="py-1.5 px-3">Department</th>
                    <th class="py-1.5 px-3">Salary</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-900">
                  <tr v-for="(row, idx) in csvRows.slice(0, 50)" :key="idx">
                    <td class="py-1.5 px-3 text-zinc-700 dark:text-zinc-300">{{ row.name }}</td>
                    <td class="py-1.5 px-3 text-zinc-500 font-mono">{{ row.email }}</td>
                    <td class="py-1.5 px-3 text-zinc-500">{{ row.role }}</td>
                    <td class="py-1.5 px-3 text-zinc-500">{{ row.department }}</td>
                    <td class="py-1.5 px-3 text-zinc-500 font-mono">{{ row.salary }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Results -->
          <div v-if="bulkResults" class="space-y-2">
            <div class="flex items-center gap-2 text-sm">
              <CheckCircle2 class="w-4 h-4 text-lime-600 dark:text-lime-400" />
              <span class="text-zinc-700 dark:text-zinc-300">{{ bulkResults.created.length }} created</span>
              <XCircle v-if="bulkResults.failed.length" class="w-4 h-4 text-rose-500 ml-3" />
              <span v-if="bulkResults.failed.length" class="text-zinc-700 dark:text-zinc-300">{{ bulkResults.failed.length }} failed</span>
            </div>
            <div v-if="bulkResults.failed.length" class="border border-red-200 dark:border-red-900 rounded overflow-hidden max-h-40 overflow-y-auto">
              <div v-for="f in bulkResults.failed" :key="f.row" class="px-3 py-1.5 text-xs border-b border-red-100 dark:border-red-950 last:border-0 flex justify-between gap-3">
                <span class="text-zinc-600 dark:text-zinc-400 shrink-0">Row {{ f.row + 1 }} ({{ f.email || f.name || '—' }})</span>
                <span class="text-rose-500 text-right">{{ f.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            @click="closeBulkModal"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:bg-zinc-850 transition"
          >
            {{ bulkResults ? 'Close' : 'Cancel' }}
          </button>
          <button
            v-if="!bulkResults"
            type="button"
            @click="handleBulkSubmit"
            :disabled="csvRows.length === 0 || bulkSubmitting"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            <span v-if="bulkSubmitting">Importing…</span>
            <span v-else>Import {{ csvRows.length }} Employee(s)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Profile Slide-over / Details View -->
    <div
      v-if="selectedEmployee"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-end z-50 transition-opacity"
      @click.self="selectedEmployee = null"
    >
      <div class="w-full sm:w-96 lg:w-[480px] xl:w-[560px] h-full">
        <EmployeeProfile
          :employee="selectedEmployee"
          :departments="departmentOptions"
          @close="selectedEmployee = null"
          @updated="handleProfileUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { Search, Plus, X, UserPlus, Users, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, Sparkles } from 'lucide-vue-next';
import { parseCsvText, toCsv, downloadCsv } from '../utils/csv';
import EmployeeProfile from './EmployeeProfile.vue';

const props = defineProps({
  employees: {
    type: Array,
    required: true
  },
  departments: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['refresh']);

const { createEmployee, createDepartment, bulkCreateEmployees, getTenantPlan, upgradeTenantPlan } = useApi();

const searchQuery = ref('');
const showAddModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const selectedEmployee = ref(null);

// ── Freemium plan banner ─────────────────────────────────────────────────────
const plan = ref(null);
const upgrading = ref(false);
const planError = ref(null);
const loadPlan = async () => {
  try { plan.value = await getTenantPlan(); }
  catch { /* non-fatal — the banner just won't show */ }
};
const handleUpgrade = async () => {
  const price = plan.value?.pricePerEmployee || 1500;
  const confirmed = window.confirm(
    `Upgrade to Paid? Billing is ₦${price.toLocaleString()}/employee/month (currently ~₦${(price * (plan.value?.employeeCount || 0)).toLocaleString()}/mo). Note: automatic billing isn't wired up yet — this just lifts the employee cap.`
  );
  if (!confirmed) return;
  upgrading.value = true;
  planError.value = null;
  try {
    await upgradeTenantPlan();
    await loadPlan();
  } catch (err) {
    planError.value = err.response?.data?.message || 'Failed to upgrade plan.';
  } finally {
    upgrading.value = false;
  }
};
onMounted(loadPlan);

// ── Bulk import ────────────────────────────────────────────────────────────
const showBulkModal  = ref(false);
const csvFileName    = ref('');
const csvRows        = ref([]);
const bulkError      = ref(null);
const bulkSubmitting = ref(false);
const bulkResults    = ref(null);

const CSV_TEMPLATE = 'name,email,role,department,salary,status,joinDate,birthDate\n' +
  'John Doe,john.doe@example.com,Software Engineer,Engineering,500000,Active,2026-01-15,1995-05-20\n';

const openBulkModal = () => { showBulkModal.value = true; };

const closeBulkModal = () => {
  showBulkModal.value = false;
  csvFileName.value = '';
  csvRows.value = [];
  bulkError.value = null;
  bulkResults.value = null;
};

const downloadTemplate = () => downloadCsv(CSV_TEMPLATE, 'employee-import-template.csv');

const handleFileSelect = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  bulkError.value = null;
  bulkResults.value = null;
  csvFileName.value = file.name;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = parseCsvText(String(reader.result));
      if (parsed.length < 2) throw new Error('CSV has no data rows.');
      const headers = parsed[0].map(h => h.trim().toLowerCase());
      const required = ['name', 'email', 'role', 'salary', 'birthdate'];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length) throw new Error(`CSV is missing required column(s): ${missing.join(', ')}`);

      csvRows.value = parsed.slice(1).map(cols => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = (cols[idx] || '').trim(); });
        return {
          name: obj.name, email: obj.email, role: obj.role,
          department: obj.department || '', salary: obj.salary,
          status: obj.status || 'Active',
          joinDate: obj.joindate || '', birthDate: obj.birthdate,
        };
      }).filter(r => r.name || r.email);
    } catch (err) {
      bulkError.value = err.message;
      csvRows.value = [];
    }
  };
  reader.readAsText(file);
};

const handleBulkSubmit = async () => {
  bulkSubmitting.value = true;
  bulkError.value = null;
  try {
    const result = await bulkCreateEmployees(csvRows.value);
    bulkResults.value = result;
    if (result.created.length > 0) { emit('refresh'); loadPlan(); }
  } catch (err) {
    bulkError.value = err.response?.data?.message || err.message || 'Bulk import failed.';
  } finally {
    bulkSubmitting.value = false;
  }
};

// ── CSV export of the current directory (headcount report) ─────────────────
const exportHeadcountCsv = () => {
  const headers = ['Name', 'Email', 'Department', 'Role', 'Monthly Salary', 'Status', 'Join Date'];
  const rows = filteredEmployees.value.map((emp) => [
    emp.name, emp.email,
    emp.departmentId?.name || emp.department || 'Unassigned',
    emp.role, emp.salary,
    emp.status, emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '',
  ]);
  downloadCsv(toCsv(headers, rows), `headcount-${new Date().toISOString().split('T')[0]}.csv`);
};

const showNewDeptInput = ref(false);
const newDeptName = ref('');
const creatingDept = ref(false);
const localNewDepartments = ref([]);

const departmentOptions = computed(() => {
  const known = new Set(props.departments.map(d => d._id));
  return [...props.departments, ...localNewDepartments.value.filter(d => !known.has(d._id))];
});

const handleDepartmentSelect = () => {
  if (form.value.departmentId === '__new__') {
    form.value.departmentId = '';
    showNewDeptInput.value = true;
  }
};

const cancelNewDepartment = () => {
  showNewDeptInput.value = false;
  newDeptName.value = '';
};

const handleCreateDepartment = async () => {
  if (!newDeptName.value.trim()) return;
  creatingDept.value = true;
  try {
    const newDept = await createDepartment({ name: newDeptName.value.trim() });
    localNewDepartments.value.push(newDept);
    form.value.departmentId = newDept._id;
    showNewDeptInput.value = false;
    newDeptName.value = '';
    emit('refresh');
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to create department.';
  } finally {
    creatingDept.value = false;
  }
};

const handleProfileUpdate = (updatedEmployee) => {
  // Option 1: Emit refresh to trigger a full refetch from parent
  // emit('refresh');
  // Option 2: Mutate local list (parent must react properly)
  selectedEmployee.value = updatedEmployee;
  emit('refresh');
};

// Get current date string for default date inputs
const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const initialForm = {
  name: '',
  email: '',
  role: '',
  departmentId: '',
  salary: '',
  status: 'Active',
  joinDate: getTodayStr(),
  birthDate: '1995-01-01'
};

const form = ref({ ...initialForm });

// Filter employees based on search query
const filteredEmployees = computed(() => {
  if (!searchQuery.value.trim()) return props.employees;
  const q = searchQuery.value.toLowerCase();
  return props.employees.filter(emp => 
    emp.name.toLowerCase().includes(q) || 
    emp.email.toLowerCase().includes(q) || 
    emp.role.toLowerCase().includes(q) || 
    (emp.departmentId?.name || '').toLowerCase().includes(q)
  );
});

const closeModal = () => {
  showAddModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
  showNewDeptInput.value = false;
  newDeptName.value = '';
};

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.role || !form.value.departmentId || !form.value.salary || !form.value.birthDate) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await createEmployee({
      name: form.value.name,
      email: form.value.email,
      role: form.value.role,
      departmentId: form.value.departmentId,
      salary: parseFloat(form.value.salary),
      status: form.value.status,
      joinDate: form.value.joinDate,
      birthDate: form.value.birthDate
    });

    emit('refresh');
    loadPlan();
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to register employee.';
  } finally {
    submitting.value = false;
  }
};

// Utilities for styling
const formatCurrency = (val) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
</script>
