<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Position Management</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage budgeted headcount and view occupied vs vacant positions.</p>
      </div>
      <button 
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
      >
        <Briefcase class="w-4 h-4" />
        <span>Create Position</span>
      </button>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Positions</p>
          <p class="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">{{ positions.length }}</p>
        </div>
        <div class="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
          <Briefcase class="w-5 h-5" />
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Headcount Budget</p>
          <p class="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50">{{ totalBudgeted }}</p>
        </div>
        <div class="w-10 h-10 rounded bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-500">
          <Users class="w-5 h-5" />
        </div>
      </div>
      <div class="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <p class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Vacancies</p>
          <p class="text-2xl font-bold font-display text-orange-600 dark:text-orange-400">{{ totalVacancies }}</p>
        </div>
        <div class="w-10 h-10 rounded bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-500">
          <UserPlus class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Positions Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Position</th>
              <th class="py-3 px-6">Role / Dept</th>
              <th class="py-3 px-6">Occupancy</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="positions.length === 0" class="text-center text-zinc-500">
              <td colspan="5" class="py-12">
                <Briefcase class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No positions created yet.</p>
              </td>
            </tr>

            <template v-for="pos in positions" :key="pos._id">
              <tr class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer" @click="toggleRow(pos._id)">
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    {{ pos.title }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ pos.positionId }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ pos.jobRoleId?.title || 'No Job Role mapped' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ pos.department }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div class="h-full rounded-full" :class="occupancyColor(pos.currentHeadcount, pos.headcountBudgeted)" :style="{ width: `${Math.min(100, (pos.currentHeadcount / pos.headcountBudgeted) * 100)}%` }"></div>
                    </div>
                    <span class="text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 w-8 text-right">
                      {{ pos.currentHeadcount }} / {{ pos.headcountBudgeted }}
                    </span>
                  </div>
                  <div class="text-[9px] text-zinc-500 font-mono mt-1" v-if="pos.headcountBudgeted - pos.currentHeadcount > 0">
                    {{ pos.headcountBudgeted - pos.currentHeadcount }} Vacant
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span :class="[
                    pos.status === 'Active' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' : 
                    pos.status === 'Frozen' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900' :
                    'bg-zinc-100 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-900',
                    'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                  ]">
                    {{ pos.status }}
                  </span>
                </td>
                <td class="py-4 px-6 text-right">
                  <ChevronDown class="w-4 h-4 text-zinc-400 inline-block transition-transform duration-200" :class="expandedRow === pos._id ? 'rotate-180' : ''" />
                </td>
              </tr>
              
              <!-- Expandable Edit View -->
              <tr v-if="expandedRow === pos._id" class="bg-zinc-50/50 dark:bg-zinc-900/20 border-b border-zinc-200 dark:border-zinc-800">
                <td colspan="5" class="p-0">
                  <div class="p-6">
                    <form @submit.prevent="handleUpdate(pos._id)" class="flex gap-4 items-end max-w-2xl">
                      <div class="space-y-1 flex-1">
                        <label class="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Status</label>
                        <select v-model="editForms[pos._id].status" class="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 outline-none">
                          <option value="Active">Active</option>
                          <option value="Frozen">Frozen</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                      <div class="space-y-1 flex-1">
                        <label class="block text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Headcount Budget</label>
                        <input type="number" min="1" v-model="editForms[pos._id].headcountBudgeted" class="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 outline-none" />
                      </div>
                      <button type="submit" class="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded text-xs transition active:scale-95 h-[30px]">
                        Save Changes
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Position Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Briefcase class="w-4 h-4 text-indigo-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Create New Position</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Position Title</label>
            <input v-model="form.title" required placeholder="e.g. Senior Frontend Engineer" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Department</label>
            <input v-model="form.department" required placeholder="e.g. Engineering" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Map to Job Role</label>
            <select v-model="form.jobRoleId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
              <option value="">No Role Mapping</option>
              <option v-for="role in roles" :key="role._id" :value="role._id">{{ role.title }} (Band: {{ role.band }})</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Reports To</label>
              <select v-model="form.reportsToPositionId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
                <option value="">None</option>
                <option v-for="pos in positions" :key="pos._id" :value="pos._id">{{ pos.title }} ({{ pos.positionId }})</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Headcount Budget</label>
              <input type="number" min="1" v-model="form.headcountBudgeted" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
            </div>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button type="button" @click="closeModal" class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">Cancel</button>
          <button @click="handleSubmit" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded text-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer" :disabled="submitting">
            <span v-if="submitting">Creating...</span>
            <span v-else>Create Position</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useApi } from '../composables/useApi';
import { Briefcase, X, ChevronDown, Users, UserPlus } from 'lucide-vue-next';

const props = defineProps({
  positions: {
    type: Array,
    required: true
  },
  roles: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { createPosition, updatePosition } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const expandedRow = ref(null);

const initialForm = {
  title: '',
  department: '',
  jobRoleId: '',
  reportsToPositionId: '',
  headcountBudgeted: 1
};

const form = ref({ ...initialForm });
const editForms = ref({});

watch(() => props.positions, (newVals) => {
  newVals.forEach(p => {
    if (!editForms.value[p._id]) {
      editForms.value[p._id] = {
        status: p.status,
        headcountBudgeted: p.headcountBudgeted
      };
    }
  });
}, { immediate: true, deep: true });

const totalBudgeted = computed(() => {
  return props.positions.reduce((acc, curr) => acc + curr.headcountBudgeted, 0);
});

const totalVacancies = computed(() => {
  return props.positions.reduce((acc, curr) => {
    const diff = curr.headcountBudgeted - curr.currentHeadcount;
    return diff > 0 ? acc + diff : acc;
  }, 0);
});

const occupancyColor = (current, budgeted) => {
  const ratio = current / budgeted;
  if (ratio >= 1) return 'bg-lime-500';
  if (ratio >= 0.5) return 'bg-blue-500';
  return 'bg-orange-500';
};

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const closeModal = () => {
  showModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const handleSubmit = async () => {
  if (!form.value.title || !form.value.department) {
    formError.value = 'Title and Department are required.';
    return;
  }
  submitting.value = true;
  formError.value = null;

  try {
    const payload = { ...form.value };
    if (!payload.jobRoleId) delete payload.jobRoleId;
    if (!payload.reportsToPositionId) delete payload.reportsToPositionId;

    await createPosition(payload);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create position.';
  } finally {
    submitting.value = false;
  }
};

const handleUpdate = async (id) => {
  try {
    await updatePosition(id, editForms.value[id]);
    alert('Position updated successfully.');
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update position.');
  }
};
</script>
