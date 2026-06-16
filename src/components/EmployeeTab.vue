<template>
  <div class="flex h-full overflow-hidden relative">
    <div :class="[selectedEmployee ? 'w-full lg:w-1/2 xl:w-3/5' : 'w-full', 'space-y-6 transition-all duration-300 overflow-y-auto pr-2 pb-20']">
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
      <button 
        @click="showAddModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Register Employee</span>
      </button>
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
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-end z-50 transition-opacity"
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
              v-model="form.departmentId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Department</option>
              <option v-for="dept in departments" :key="dept._id" :value="dept._id">
                {{ dept.name }}
              </option>
            </select>
          </div>

          <!-- Salary -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Monthly Salary (USD)</label>
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
    
    <!-- Profile Slide-over / Details View -->
    <div 
      v-if="selectedEmployee" 
      class="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2 xl:w-2/5 z-10"
    >
      <EmployeeProfile 
        :employee="selectedEmployee" 
        @close="selectedEmployee = null" 
        @updated="handleProfileUpdate" 
      />
    </div>

    <!-- Mobile modal for profile -->
    <div 
      v-if="selectedEmployee" 
      class="lg:hidden fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-end z-50"
    >
      <div class="w-full sm:w-96 h-full">
        <EmployeeProfile 
          :employee="selectedEmployee" 
          @close="selectedEmployee = null" 
          @updated="handleProfileUpdate" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Search, Plus, X, UserPlus, Users } from 'lucide-vue-next';
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

const { createEmployee } = useApi();

const searchQuery = ref('');
const showAddModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const selectedEmployee = ref(null);

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
    (emp.departmentId?.name || '').toLowerCase().includes(q) ||
    (emp.department || '').toLowerCase().includes(q)
  );
});

const closeModal = () => {
  showAddModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
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
    currency: 'USD',
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
