<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Attendance — Today</h3>
        <p class="text-xs text-zinc-500 mt-0.5">{{ presentCount }} of {{ activeEmployees.length }} clocked in today.</p>
        <p class="text-[11px] text-zinc-400 mt-1">
          "Active Time" reflects time spent actively using HRMS X today (mouse/keyboard activity while the tab is open and focused) — it does not track other apps, other tabs, or anything off-screen.
        </p>
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

    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Department</th>
              <th class="py-3 px-6">Clock In</th>
              <th class="py-3 px-6">Clock Out</th>
              <th class="py-3 px-6">Active Time</th>
              <th class="py-3 px-6">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="rows.length === 0" class="text-center text-zinc-500">
              <td colspan="6" class="py-12">
                <Timer class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No active employees to track.</p>
              </td>
            </tr>
            <tr v-for="r in rows" :key="r.employeeId" class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors">
              <td class="py-4 px-6 font-semibold text-zinc-800 dark:text-zinc-200">{{ r.name }}</td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400">{{ r.department }}</td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono">{{ r.clockIn ? formatTime(r.clockIn) : '—' }}</td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono">{{ r.clockOut ? formatTime(r.clockOut) : '—' }}</td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-mono">{{ formatActiveMinutes(r.activeMinutes) }}</td>
              <td class="py-4 px-6">
                <span :class="[statusStyle(r.status), 'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border']">
                  {{ r.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { RefreshCw, Timer } from 'lucide-vue-next';

const props = defineProps({
  employees: { type: Array, default: () => [] },
});

const { getAttendanceToday, getTeamActivity } = useApi();

const loading = ref(false);
const records = ref([]);
const activityRecords = ref([]);

const activeEmployees = computed(() => props.employees.filter(e => e.status !== 'Offboarded'));

const load = async () => {
  loading.value = true;
  try {
    const [attendance, activity] = await Promise.all([
      getAttendanceToday(),
      getTeamActivity().catch(() => ({ records: [] })), // don't let this block the attendance table
    ]);
    records.value = attendance;
    activityRecords.value = activity?.records || [];
  } catch {
    records.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);

const rows = computed(() => {
  const byEmployee = new Map(records.value.map(r => [r.employeeId?._id || r.employeeId, r]));
  const activityByEmployee = new Map(activityRecords.value.map(a => [a.employeeId?._id || a.employeeId, a]));
  return activeEmployees.value.map(emp => {
    const rec = byEmployee.get(emp._id);
    const clockIn = rec?.clockIn?.at || null;
    const clockOut = rec?.clockOut?.at || null;
    return {
      employeeId: emp._id,
      name: emp.name,
      department: emp.departmentId?.name || 'Unassigned',
      clockIn,
      clockOut,
      activeMinutes: activityByEmployee.get(emp._id)?.activeMinutes ?? null,
      status: clockOut ? 'Clocked Out' : clockIn ? 'Present' : 'Not Clocked In',
    };
  }).sort((a, b) => (a.status === b.status ? a.name.localeCompare(b.name) : a.status === 'Present' ? -1 : 1));
});

const presentCount = computed(() => rows.value.filter(r => r.clockIn).length);

const statusStyle = (status) => ({
  'Present': 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
  'Clocked Out': 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
  'Not Clocked In': 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
}[status] || 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800');

const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const formatActiveMinutes = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
</script>
