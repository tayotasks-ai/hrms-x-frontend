<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-bold text-zinc-900 dark:text-zinc-50">Company Documents</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Policies, handbooks and forms.</p>
      </div>
    </div>
    <div v-if="!documents.length" class="flex flex-col items-center justify-center py-16 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-center">
      <FileText class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
      <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No documents published yet.</p>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="doc in documents" :key="doc._id" class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 transition">
        <div class="flex items-start gap-3">
          <div class="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
            <FileText class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{{ doc.title }}</p>
            <p class="text-xs text-zinc-500 mt-0.5 font-mono">v{{ doc.version }} · {{ doc.category }}</p>
          </div>
        </div>
        <div class="mt-3 flex items-center justify-between">
          <span class="text-[10px] font-mono text-zinc-400">{{ new Date(doc.createdAt).toLocaleDateString('en-GB') }}</span>
          <a v-if="doc.fileUrl" :href="doc.fileUrl" target="_blank" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">Download</a>
          <span v-else class="text-xs text-zinc-400">No file</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { FileText } from 'lucide-vue-next';
defineProps({ documents: { type: Array, default: () => [] }, authUser: { type: Object, default: null } });
defineEmits(['refresh']);
</script>
