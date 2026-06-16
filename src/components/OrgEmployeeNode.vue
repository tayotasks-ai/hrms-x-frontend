<template>
  <div class="space-y-3">
    <div 
      class="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-between hover:border-lime-500/30 transition relative"
      :class="{
        'border-lime-500 border-2 bg-lime-50 dark:bg-lime-900/20': isDragOver,
        'opacity-50': isDragging
      }"
      :draggable="authUser?.role !== 'Employee'"
      @dragstart.stop="authUser?.role !== 'Employee' ? onDragStart($event) : null"
      @dragend.stop="authUser?.role !== 'Employee' ? onDragEnd($event) : null"
      @dragover.stop.prevent="authUser?.role !== 'Employee' ? onDragOver($event) : null"
      @dragleave.stop="authUser?.role !== 'Employee' ? onDragLeave($event) : null"
      @drop.stop.prevent="authUser?.role !== 'Employee' ? onDrop($event) : null"
    >
      <!-- Optional: Drag handle icon -->
      <div v-if="authUser?.role !== 'Employee'" class="absolute -left-3 top-1/2 -translate-y-1/2 text-zinc-400 cursor-grab active:cursor-grabbing hover:text-zinc-600 transition p-1">
        <GripVertical class="w-4 h-4" />
      </div>

      <div class="pl-2" :class="{ 'pl-4': authUser?.role === 'Employee' }">
        <p class="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{{ employee.name }}</p>
        <p class="text-xs text-zinc-600 dark:text-zinc-400">{{ employee.role }}</p>
      </div>
      <span class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 px-2 py-0.5 rounded font-mono">
        {{ employee.departmentId?.name || employee.department || 'No Dept' }}
      </span>
    </div>

    <!-- Children -->
    <div v-if="children.length > 0" class="pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-3 ml-4 relative">
      <div class="absolute -left-px top-6 w-4 h-[1px] bg-zinc-200 dark:bg-zinc-800"></div>
      <OrgEmployeeNode 
        v-for="child in children" 
        :key="child._id"
        :employee="child"
        :allEmployees="allEmployees"
        :authUser="authUser"
        @changeManager="$emit('changeManager', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { GripVertical } from 'lucide-vue-next';

const props = defineProps({
  employee: { type: Object, required: true },
  allEmployees: { type: Array, required: true },
  authUser: { type: Object, default: null }
});

const emit = defineEmits(['changeManager']);

const isDragging = ref(false);
const isDragOver = ref(false);

const children = computed(() => {
  return props.allEmployees.filter(e => {
    if (!e.managerId) return false;
    const mgrId = typeof e.managerId === 'object' ? e.managerId._id : e.managerId;
    return mgrId === props.employee._id;
  });
});

const onDragStart = (e) => {
  isDragging.value = true;
  e.dataTransfer.setData('text/plain', props.employee._id);
  e.dataTransfer.effectAllowed = 'move';
};

const onDragEnd = () => {
  isDragging.value = false;
};

const onDragOver = (e) => {
  isDragOver.value = true;
  e.dataTransfer.dropEffect = 'move';
};

const onDragLeave = () => {
  isDragOver.value = false;
};

const onDrop = (e) => {
  isDragOver.value = false;
  const draggedEmployeeId = e.dataTransfer.getData('text/plain');
  
  if (draggedEmployeeId && draggedEmployeeId !== props.employee._id) {
    emit('changeManager', {
      employeeId: draggedEmployeeId,
      newManagerId: props.employee._id
    });
  }
};
</script>
