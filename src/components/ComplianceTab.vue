<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-bold text-zinc-900 dark:text-zinc-50">Compliance Calendar</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Nigerian statutory obligations and filing deadlines.</p>
      </div>
    </div>
    <div v-if="!compliances.length" class="flex flex-col items-center justify-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
      <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
      <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No obligations loaded.</p>
      <p class="text-xs text-zinc-400 mt-1">Seed Nigerian defaults from the API.</p>
    </div>
    <div v-else class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <table class="w-full text-sm text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 text-[11px] font-mono uppercase tracking-wider">
          <tr>
            <th class="px-5 py-3">Obligation</th>
            <th class="px-5 py-3">Regulator</th>
            <th class="px-5 py-3">Frequency</th>
            <th class="px-5 py-3">Due Date</th>
            <th class="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-900">
          <tr v-for="c in compliances" :key="c._id" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition">
            <td class="px-5 py-3">
              <p class="font-semibold text-zinc-900 dark:text-zinc-50 text-xs">{{ c.title }}</p>
              <p class="text-[10px] text-zinc-400 font-mono">{{ c.category }}</p>
            </td>
            <td class="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">{{ c.regulator || '–' }}</td>
            <td class="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400">{{ c.frequency }}</td>
            <td class="px-5 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
              {{ c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-GB') : '–' }}
            </td>
            <td class="px-5 py-3">
              <span :class="[
                c.status === 'Completed' ? 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400' :
                c.status === 'Overdue'   ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400',
                'text-[10px] font-semibold font-mono px-2 py-0.5 rounded'
              ]">{{ c.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { CheckSquare } from 'lucide-vue-next';
defineProps({ compliances: { type: Array, default: () => [] } });
defineEmits(['refresh']);
</script>
