<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-bold text-zinc-900 dark:text-zinc-50">{{ isHR ? 'Onboarding Management' : 'My Onboarding' }}</h3>
        <p class="text-xs text-zinc-500 mt-0.5">{{ isHR ? 'Track all new hire onboarding progress.' : 'Your onboarding checklist and milestones.' }}</p>
      </div>
    </div>
    <div v-if="!onboardings.length" class="flex flex-col items-center justify-center py-16 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
      <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No onboarding records found.</p>
      <p class="text-xs text-zinc-400 mt-1">{{ isHR ? 'Create an onboarding plan for new hires.' : 'Your HR team will set this up for you.' }}</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="ob in onboardings" :key="ob._id" class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-white dark:bg-zinc-950">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{{ ob.employeeId?.name || 'Unknown Employee' }}</p>
            <p class="text-xs text-zinc-500 font-mono mt-0.5">Stage: {{ ob.stage }}</p>
          </div>
          <span :class="[
            ob.completionPercentage === 100 ? 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
            'text-xs font-semibold px-2 py-0.5 rounded border border-current/20'
          ]">{{ ob.completionPercentage }}% Complete</span>
        </div>
        <div class="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 mb-3">
          <div class="bg-lime-500 h-1.5 rounded-full transition-all" :style="`width: ${ob.completionPercentage}%`"></div>
        </div>
        <div class="space-y-1.5">
          <div v-for="task in ob.tasks" :key="task._id" class="flex items-center gap-2 text-xs">
            <span :class="task.status === 'Completed' ? 'text-lime-600' : 'text-zinc-400'">
              <Check v-if="task.status === 'Completed'" class="w-3.5 h-3.5" />
              <Circle v-else class="w-3.5 h-3.5" />
            </span>
            <span :class="task.status === 'Completed' ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'">{{ task.title }}</span>
            <span v-if="task.assignedTo" class="ml-auto text-zinc-400 font-mono">{{ task.assignedTo?.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { CheckSquare, Check, Circle } from 'lucide-vue-next';
const props = defineProps({
  onboardings: { type: Array, default: () => [] },
  employees:   { type: Array, default: () => [] },
  authUser:    { type: Object, default: null },
});
defineEmits(['refresh']);
const isHR = computed(() => props.authUser?.role !== 'Employee');
</script>
