<template>
  <div class="space-y-6">
    <!-- Header panel with action toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Benefits Administration</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage HMO, insurance, pension, and allowances for staff.</p>
      </div>
      <button 
        v-if="authUser?.role !== 'Employee'"
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-500 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-pink-600 active:scale-[0.98] transition cursor-pointer"
      >
        <HeartPulse class="w-4 h-4" />
        <span>Init Benefit Record</span>
      </button>
    </div>

    <!-- Benefits Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">HMO Status</th>
              <th class="py-3 px-6">Pension/Life</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right" v-if="authUser?.role !== 'Employee'">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="benefits.length === 0" class="text-center text-zinc-500">
              <td colspan="5" class="py-12">
                <HeartPulse class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No benefit records created.</p>
              </td>
            </tr>

            <template v-for="b in benefits" :key="b._id">
              <tr class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors" :class="{'cursor-pointer': authUser?.role !== 'Employee'}" @click="authUser?.role !== 'Employee' && toggleRow(b._id)">
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ b.employeeId?.name || 'Deleted Employee' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ b.employeeId?.role }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {{ b.hmoPlan?.provider || 'None' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Tier: {{ b.hmoPlan?.planTier || 'None' }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {{ b.pension?.pfaName || 'No PFA' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    GLI: {{ b.groupLifeInsurance?.provider ? 'Active' : 'None' }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span :class="[
                    b.enrollmentStatus === 'Active' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' : 
                    b.enrollmentStatus === 'Pending Enrollment' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
                    'bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900',
                    'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                  ]">
                    {{ b.enrollmentStatus }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right" v-if="authUser?.role !== 'Employee'">
                  <ChevronDown class="w-4 h-4 text-zinc-400 inline-block transition-transform duration-200" :class="expandedRow === b._id ? 'rotate-180' : ''" />
                </td>
              </tr>
              
              <!-- Expandable Edit View -->
              <tr v-if="expandedRow === b._id" class="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800">
                <td colspan="5" class="p-0">
                  <div class="p-6">
                    <form @submit.prevent="handleUpdate(b)" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <!-- HMO Section -->
                      <div class="space-y-3 bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800">
                        <h4 class="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 border-b border-zinc-100 dark:border-zinc-900 pb-1">HMO Details</h4>
                        <div class="space-y-2">
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">Provider</label>
                            <input v-model="editForms[b._id].hmoPlan.provider" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-pink-500 outline-none" />
                          </div>
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">Plan Tier</label>
                            <select v-model="editForms[b._id].hmoPlan.planTier" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-pink-500 outline-none">
                              <option value="None">None</option>
                              <option value="Standard">Standard</option>
                              <option value="Premium">Premium</option>
                              <option value="Executive">Executive</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">HMO ID Number</label>
                            <input v-model="editForms[b._id].hmoPlan.hmoIdNumber" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-pink-500 outline-none" />
                          </div>
                        </div>
                      </div>

                      <!-- Pension & GLI Section -->
                      <div class="space-y-3 bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800">
                        <h4 class="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 border-b border-zinc-100 dark:border-zinc-900 pb-1">Pension & Life</h4>
                        <div class="space-y-2">
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">PFA Name</label>
                            <input v-model="editForms[b._id].pension.pfaName" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-none" />
                          </div>
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">RSA PIN</label>
                            <input v-model="editForms[b._id].pension.rsaPin" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-none" />
                          </div>
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">GLI Provider</label>
                            <input v-model="editForms[b._id].groupLifeInsurance.provider" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-none" />
                          </div>
                        </div>
                      </div>

                      <!-- Status & Save -->
                      <div class="space-y-3 bg-white dark:bg-zinc-950 p-4 rounded border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                        <div class="space-y-2">
                          <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 border-b border-zinc-100 dark:border-zinc-900 pb-1">Record Status</h4>
                          <div>
                            <label class="block text-[9px] font-mono text-zinc-500 uppercase">Status</label>
                            <select v-model="editForms[b._id].enrollmentStatus" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-500 outline-none">
                              <option value="Pending Enrollment">Pending Enrollment</option>
                              <option value="Active">Active</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          </div>
                          <p class="text-[9px] text-zinc-400 font-mono mt-2">Last updated: {{ new Date(b.lastUpdated).toLocaleDateString() }}</p>
                        </div>
                        
                        <div class="pt-2">
                          <button type="submit" class="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded text-xs transition active:scale-95">
                            Save Changes
                          </button>
                        </div>
                      </div>

                    </form>
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
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <HeartPulse class="w-4 h-4 text-pink-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Init Record</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleInit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Select Employee</label>
            <select 
              v-model="employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-pink-500 transition"
            >
              <option value="" disabled>Select Staff Member</option>
              <option v-for="emp in employeesWithoutBenefits" :key="emp._id" :value="emp._id">
                {{ emp.name }}
              </option>
            </select>
            <p v-if="employeesWithoutBenefits.length === 0" class="text-[10px] text-zinc-500 mt-1">All employees have benefit records initialized.</p>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button type="button" @click="closeModal" class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">Cancel</button>
          <button @click="handleInit" class="px-4 py-2 bg-pink-500 text-white font-semibold rounded text-sm hover:bg-pink-600 active:scale-[0.98] transition cursor-pointer" :disabled="!employeeId || submitting">Initialize</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useApi } from '../composables/useApi';
import { HeartPulse, X, ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  benefits: {
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

const { initBenefitRecord, updateBenefit } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const expandedRow = ref(null);
const employeeId = ref('');
const editForms = ref({});

// Setup edit forms when props change
watch(() => props.benefits, (newVals) => {
  newVals.forEach(b => {
    if (!editForms.value[b._id]) {
      editForms.value[b._id] = {
        enrollmentStatus: b.enrollmentStatus || 'Pending Enrollment',
        hmoPlan: {
          provider: b.hmoPlan?.provider || '',
          planTier: b.hmoPlan?.planTier || 'None',
          hmoIdNumber: b.hmoPlan?.hmoIdNumber || ''
        },
        groupLifeInsurance: {
          provider: b.groupLifeInsurance?.provider || ''
        },
        pension: {
          pfaName: b.pension?.pfaName || '',
          rsaPin: b.pension?.rsaPin || ''
        }
      };
    }
  });
}, { immediate: true, deep: true });

const employeesWithoutBenefits = computed(() => {
  const withBenefits = props.benefits.map(b => b.employeeId?._id);
  return props.employees.filter(emp => !withBenefits.includes(emp._id) && emp.status !== 'Offboarded');
});

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const closeModal = () => {
  showModal.value = false;
  employeeId.value = '';
  formError.value = null;
};

const handleInit = async () => {
  if (!employeeId.value) return;
  submitting.value = true;
  formError.value = null;

  try {
    await initBenefitRecord({ employeeId: employeeId.value });
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to initialize.';
  } finally {
    submitting.value = false;
  }
};

const handleUpdate = async (benefit) => {
  try {
    await updateBenefit(benefit._id, editForms.value[benefit._id]);
    alert('Changes saved successfully.');
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update record.');
  }
};
</script>
