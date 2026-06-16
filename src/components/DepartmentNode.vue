<template>
  <div class="space-y-3">
    <div class="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition">
      <div>
        <h4 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          {{ department.name }}
          <span v-if="department.budgetCode" class="text-[9px] font-mono text-zinc-500 bg-white dark:bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            {{ department.budgetCode }}
          </span>
        </h4>
        <p class="text-xs text-zinc-500 mt-1">{{ department.description || 'No description' }}</p>
        
        <div v-if="department.headOfDepartmentId" class="mt-2 flex items-center gap-1.5">
          <div class="w-4 h-4 rounded bg-lime-500/20 text-lime-700 dark:text-lime-400 flex items-center justify-center text-[8px] font-bold">
            {{ department.headOfDepartmentId.name?.charAt(0) }}
          </div>
          <span class="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">Head: {{ department.headOfDepartmentId.name }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <button @click="$emit('edit', department)" class="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition">
          <Edit2 class="w-4 h-4" />
        </button>
        <button @click="$emit('delete', department)" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Children -->
    <div v-if="children.length > 0" class="pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-3 ml-4 relative">
      <DepartmentNode 
        v-for="child in children" 
        :key="child._id"
        :department="child"
        :allDepartments="allDepartments"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Edit2, Trash2 } from 'lucide-vue-next';

const props = defineProps({
  department: { type: Object, required: true },
  allDepartments: { type: Array, required: true }
});

defineEmits(['edit', 'delete']);

const children = computed(() => {
  return props.allDepartments.filter(d => 
    d.parentDepartmentId && 
    (typeof d.parentDepartmentId === 'object' ? d.parentDepartmentId._id : d.parentDepartmentId) === props.department._id
  );
});
</script>
