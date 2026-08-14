<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Audit Log</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Who changed salary, status, role, department, or manager — and when.</p>
      </div>
      <button
        @click="load"
        :disabled="loading"
        class="flex items-center justify-center gap-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-4 py-2 rounded text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
      >
        <RefreshCw :class="['w-4 h-4', loading && 'animate-spin']" />
        <span>Refresh</span>
      </button>
    </div>

    <div v-if="!loading && logs.length === 0" class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-12 text-center">
      <History class="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
      <p class="text-xs text-zinc-500">No sensitive changes recorded yet.</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="log in logs"
        :key="log._id"
        class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3 min-w-0">
            <div class="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center shrink-0 text-zinc-500">
              <UserCog class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm text-zinc-800 dark:text-zinc-200">
                <span class="font-semibold">{{ log.actor?.name || 'Someone' }}</span>
                edited
                <span class="font-semibold">{{ log.targetName }}</span>
              </p>
              <div class="mt-1.5 space-y-1">
                <div v-for="(c, idx) in log.changes" :key="idx" class="text-xs text-zinc-500 font-mono flex items-center gap-1.5 flex-wrap">
                  <span class="text-zinc-600 dark:text-zinc-400 font-semibold not-italic">{{ c.field }}:</span>
                  <span class="line-through opacity-70">{{ c.from ?? '—' }}</span>
                  <ArrowRight class="w-3 h-3 shrink-0" />
                  <span class="text-zinc-800 dark:text-zinc-200">{{ c.to ?? '—' }}</span>
                </div>
              </div>
            </div>
          </div>
          <span class="text-[10px] font-mono text-zinc-400 shrink-0 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { RefreshCw, History, UserCog, ArrowRight } from 'lucide-vue-next';

const { getAuditLog } = useApi();

const loading = ref(false);
const logs = ref([]);

const load = async () => {
  loading.value = true;
  try {
    logs.value = await getAuditLog();
  } catch {
    logs.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const formatDateTime = (d) => new Date(d).toLocaleString('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
</script>
