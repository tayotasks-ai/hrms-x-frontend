<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Job Architecture</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage job families, role mapping, bands, and competencies.</p>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button 
          @click="showFamilyModal = true"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-zinc-800 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <span>New Family</span>
        </button>
        <button 
          @click="showRoleModal = true"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
        >
          <Network class="w-4 h-4" />
          <span>New Role</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      <!-- Left Col: Job Families -->
      <div class="lg:col-span-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden h-fit">
        <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Job Families</h4>
        </div>
        <div class="p-2 space-y-1">
          <div v-if="families.length === 0" class="text-xs text-zinc-500 text-center py-4">No families defined</div>
          <button 
            v-for="fam in families" 
            :key="fam._id"
            @click="selectedFamily = fam._id"
            class="w-full text-left px-3 py-2 rounded text-xs font-semibold transition"
            :class="selectedFamily === fam._id ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'"
          >
            {{ fam.name }}
          </button>
        </div>
      </div>

      <!-- Right Col: Job Roles in Family -->
      <div class="lg:col-span-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
        <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Job Roles</h4>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-sm">
            <thead>
              <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                <th class="py-2 px-4">Role Title</th>
                <th class="py-2 px-4">Band</th>
                <th class="py-2 px-4">Pay Grade</th>
                <th class="py-2 px-4">Competencies</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr v-if="filteredRoles.length === 0" class="text-center text-zinc-500">
                <td colspan="4" class="py-8">
                  <p class="text-xs">No roles found for this family.</p>
                </td>
              </tr>
              <tr v-for="role in filteredRoles" :key="role._id" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                <td class="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200 text-xs">{{ role.title }}</td>
                <td class="py-3 px-4 text-xs font-mono">{{ role.band }}</td>
                <td class="py-3 px-4">
                  <div class="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded inline-block">
                    {{ role.payGrade?.currency }} {{ role.payGrade?.minSalary?.toLocaleString() }} - {{ role.payGrade?.maxSalary?.toLocaleString() }}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="comp in role.competencies" :key="comp._id" class="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-1.5 py-0.5 rounded uppercase font-semibold">
                      {{ comp.skill }} ({{ comp.proficiencyLevel }})
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modals (Family & Role) -->
    <!-- Family Modal -->
    <div v-if="showFamilyModal" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showFamilyModal = false">
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800"><h3 class="font-display font-bold text-sm">New Job Family</h3></div>
        <form @submit.prevent="submitFamily" class="p-4 space-y-4">
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Name</label>
            <input v-model="familyForm.name" required placeholder="e.g. Engineering" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border rounded text-sm focus:border-indigo-500 outline-none" />
          </div>
          <button type="submit" class="w-full px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded text-sm transition">Create Family</button>
        </form>
      </div>
    </div>

    <!-- Role Modal -->
    <div v-if="showRoleModal" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showRoleModal = false">
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800"><h3 class="font-display font-bold text-sm">New Job Role</h3></div>
        <form @submit.prevent="submitRole" class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Role Title</label>
              <input v-model="roleForm.title" required placeholder="e.g. Backend Dev" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Job Family</label>
              <select v-model="roleForm.familyId" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
                <option v-for="fam in families" :key="fam._id" :value="fam._id">{{ fam.name }}</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Band</label>
              <input v-model="roleForm.band" required placeholder="e.g. L3" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Min Salary</label>
              <input type="number" v-model="roleForm.payGrade.minSalary" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Max Salary</label>
              <input type="number" v-model="roleForm.payGrade.maxSalary" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
            </div>
          </div>

          <!-- Competencies -->
          <div class="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Competencies</label>
            <div v-for="(comp, index) in roleForm.competencies" :key="index" class="flex gap-2">
              <input v-model="comp.skill" placeholder="Skill" class="flex-1 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs focus:border-indigo-500 outline-none" />
              <select v-model="comp.proficiencyLevel" class="w-32 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs focus:border-indigo-500 outline-none">
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
              <button type="button" @click="roleForm.competencies.splice(index, 1)" class="text-red-500 px-2 text-xs">Remove</button>
            </div>
            <button type="button" @click="roleForm.competencies.push({skill: '', proficiencyLevel: 'Intermediate'})" class="text-xs text-indigo-500 font-semibold">+ Add Skill</button>
          </div>
          
          <button type="submit" class="w-full mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded text-sm transition">Create Job Role</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Network } from 'lucide-vue-next';

const props = defineProps({
  jobArchitecture: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['refresh']);

const { createJobFamily, createJobRole } = useApi();

const showFamilyModal = ref(false);
const showRoleModal = ref(false);
const selectedFamily = ref(null);

const families = computed(() => props.jobArchitecture?.families || []);
const roles = computed(() => props.jobArchitecture?.roles || []);

const filteredRoles = computed(() => {
  if (!selectedFamily.value) return roles.value;
  return roles.value.filter(r => r.familyId?._id === selectedFamily.value);
});

const familyForm = ref({ name: '' });
const roleForm = ref({
  title: '',
  familyId: '',
  band: '',
  payGrade: { minSalary: 0, maxSalary: 0, currency: 'NGN' },
  competencies: []
});

const submitFamily = async () => {
  try {
    await createJobFamily(familyForm.value);
    emit('refresh');
    showFamilyModal.value = false;
    familyForm.value.name = '';
  } catch (e) { alert(e.message); }
};

const submitRole = async () => {
  try {
    await createJobRole(roleForm.value);
    emit('refresh');
    showRoleModal.value = false;
    roleForm.value = { title: '', familyId: '', band: '', payGrade: { minSalary: 0, maxSalary: 0, currency: 'NGN' }, competencies: [] };
  } catch (e) { alert(e.message); }
};
</script>
