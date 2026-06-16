<template>
  <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
    
    <!-- Left: Department Form -->
    <div class="lg:col-span-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col h-fit sticky top-24">
      <div class="flex items-center gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <Building2 class="w-4 h-4 text-lime-600 dark:text-lime-400" />
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">
            {{ isEditing ? 'Edit Department' : 'New Department' }}
          </h3>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
          {{ formError }}
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Department Name *</label>
          <input 
            v-model="form.name"
            type="text" 
            required
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          />
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Description</label>
          <textarea 
            v-model="form.description"
            rows="2"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          ></textarea>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Department Head</label>
          <select 
            v-model="form.headOfDepartmentId"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          >
            <option value="">None</option>
            <option v-for="emp in activeEmployees" :key="emp._id" :value="emp._id">
              {{ emp.name }} ({{ emp.role }})
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Parent Department</label>
          <select 
            v-model="form.parentDepartmentId"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          >
            <option value="">None (Top Level)</option>
            <option v-for="dept in validParentDepartments" :key="dept._id" :value="dept._id">
              {{ dept.name }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Budget Code</label>
          <input 
            v-model="form.budgetCode"
            type="text" 
            placeholder="e.g. ENG-2026"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          />
        </div>

        <div class="pt-4 flex gap-3">
          <button 
            v-if="isEditing"
            type="button" 
            @click="cancelEdit"
            class="flex-1 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 transition"
          >
            Cancel
          </button>
          <button 
            type="submit"
            class="flex-1 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            {{ submitting ? 'Saving...' : (isEditing ? 'Update' : 'Create') }}
          </button>
        </div>
      </form>
    </div>

    <!-- Right: Departments List -->
    <div class="lg:col-span-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Department Hierarchy</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Manage the organisation's structure.</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono text-zinc-500">{{ departments.length }} Total</span>
        </div>
      </div>

      <div v-if="departments.length === 0" class="text-center py-12 text-zinc-500">
        <Building2 class="w-8 h-8 text-zinc-300 dark:text-zinc-800 mx-auto mb-2" />
        <p class="text-xs">No departments configured yet.</p>
      </div>

      <div v-else class="space-y-4">
        <!-- Recursively render root departments -->
        <DepartmentNode 
          v-for="dept in rootDepartments" 
          :key="dept._id"
          :department="dept"
          :allDepartments="departments"
          @edit="editDepartment"
          @delete="confirmDelete"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Building2, Edit2, Trash2 } from 'lucide-vue-next';
import DepartmentNode from './DepartmentNode.vue';

const props = defineProps({
  departments: { type: Array, required: true },
  employees: { type: Array, required: true }
});

const emit = defineEmits(['refresh']);
const { createDepartment, updateDepartment, deleteDepartment } = useApi();

const isEditing = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formError = ref(null);

const initialForm = {
  name: '',
  description: '',
  headOfDepartmentId: '',
  parentDepartmentId: '',
  budgetCode: '',
  status: 'Active'
};

const form = ref({ ...initialForm });

const activeEmployees = computed(() => props.employees.filter(e => e.status !== 'Offboarded'));

// Root departments have no parent
const rootDepartments = computed(() => {
  return props.departments.filter(d => !d.parentDepartmentId);
});

// A department cannot be its own parent, nor can its children be its parent. For simplicity, just exclude self.
const validParentDepartments = computed(() => {
  if (!isEditing.value) return props.departments;
  return props.departments.filter(d => d._id !== editingId.value);
});

const editDepartment = (dept) => {
  isEditing.value = true;
  editingId.value = dept._id;
  form.value = {
    name: dept.name,
    description: dept.description || '',
    headOfDepartmentId: dept.headOfDepartmentId?._id || '',
    parentDepartmentId: dept.parentDepartmentId?._id || '',
    budgetCode: dept.budgetCode || '',
    status: dept.status
  };
};

const cancelEdit = () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = { ...initialForm };
  formError.value = null;
};

const handleSubmit = async () => {
  submitting.value = true;
  formError.value = null;
  
  // Clean empty strings to null for references
  const payload = { ...form.value };
  if (!payload.headOfDepartmentId) payload.headOfDepartmentId = null;
  if (!payload.parentDepartmentId) payload.parentDepartmentId = null;

  try {
    if (isEditing.value) {
      await updateDepartment(editingId.value, payload);
    } else {
      await createDepartment(payload);
    }
    emit('refresh');
    cancelEdit();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to save department.';
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = async (dept) => {
  if (confirm(`Are you sure you want to delete ${dept.name}? This cannot be undone.`)) {
    try {
      await deleteDepartment(dept._id);
      emit('refresh');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department.');
    }
  }
};
</script>
