<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-50">Probation Tracker</h2>
      <p class="text-zinc-500 mt-2">Monitor employees on probation, schedule appraisals, and process confirmations.</p>
      
      <div class="mt-6 p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center flex flex-col items-center justify-center">
        <ShieldCheck class="w-12 h-12 text-zinc-700 dark:text-zinc-300 dark:text-zinc-700 mb-4" />
        <h3 class="font-bold text-zinc-700 dark:text-zinc-300">No employees currently on probation</h3>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck } from 'lucide-vue-next';
</script>
