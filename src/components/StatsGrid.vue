<template>
  <div class="space-y-6">
    <!-- Top Row: Core Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Metric 1: Employee Count -->
      <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-lg flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">Total Staff</span>
          <Users class="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-display font-bold text-zinc-900 dark:text-zinc-50">{{ stats.totalEmployees }}</div>
          <p class="text-[11px] text-zinc-500 mt-1">Active corporate profiles</p>
        </div>
      </div>

      <!-- Metric 2: Monthly Payroll -->
      <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-lg flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">Est. Monthly Payroll</span>
          <CreditCard class="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-display font-bold text-lime-600 dark:text-lime-400">
            {{ formatCurrency(stats.monthlyPayroll) }}
          </div>
          <p class="text-[11px] text-zinc-500 mt-1">Sum of active employee wages</p>
        </div>
      </div>

      <!-- Metric 3: Active Leaves -->
      <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-lg flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150">
        <div class="flex items-center justify-between">
          <span class="text-xs font-mono font-medium text-zinc-500 uppercase tracking-wider">Out of Office</span>
          <CalendarRange class="w-4 h-4 text-zinc-500" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-display font-bold text-zinc-900 dark:text-zinc-50">{{ stats.activeLeaves }}</div>
          <p class="text-[11px] text-zinc-500 mt-1">Employees on approved leave today</p>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Bento Box Timeline and Progress -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Milestones Panel (Upcoming Birthdays & Anniversaries) - 2 Columns wide -->
      <div class="md:col-span-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150">
        <div class="flex items-center justify-between pb-4 border-b border-zinc-900">
          <div>
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Upcoming Milestones</h3>
            <p class="text-xs text-zinc-500 mt-0.5">Birthdays and Work Anniversaries in {{ stats.currentMonth }}</p>
          </div>
          <div class="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded text-[11px] font-mono">
            <Gift class="w-3.5 h-3.5 text-zinc-500" />
            <span>Celebrate</span>
          </div>
        </div>

        <div class="mt-4 flex-1 overflow-y-auto max-h-[250px] pr-2 space-y-3">
          <div v-if="!stats.milestones || stats.milestones.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
            <Sparkles class="w-8 h-8 text-zinc-700 mb-2" />
            <p class="text-xs text-zinc-500">No birthdays or anniversaries this month.</p>
          </div>

          <div 
            v-for="(milestone, idx) in stats.milestones" 
            :key="idx" 
            class="flex items-center justify-between p-3 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-900 hover:border-zinc-200 dark:border-zinc-800/80 transition"
          >
            <div class="flex items-center gap-3">
              <!-- Milestone Icon Indicator -->
              <div :class="[
                milestone.type === 'Birthday' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/60' : 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-900/60',
                'w-9 h-9 rounded flex items-center justify-center'
              ]">
                <Cake v-if="milestone.type === 'Birthday'" class="w-4 h-4" />
                <Award v-else class="w-4 h-4" />
              </div>
              <div>
                <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ milestone.name }}</h4>
                <p class="text-xs text-zinc-500">{{ milestone.role }}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 block">Day {{ milestone.date }}</span>
              <span class="text-[10px] text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800/60 mt-1 inline-block">
                {{ milestone.detail }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Department Distribution Panel - 1 Column wide -->
      <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-150">
        <div>
          <div class="flex items-center justify-between pb-4 border-b border-zinc-900">
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Department Staffing</h3>
            <Layers class="w-4 h-4 text-zinc-500" />
          </div>

          <!-- Progress List of Departments -->
          <div class="mt-5 space-y-4">
            <div v-if="Object.keys(stats.departmentBreakdown || {}).length === 0" class="text-center py-10 text-xs text-zinc-500">
              No department data available.
            </div>

            <div v-for="(count, dept) in stats.departmentBreakdown" :key="dept" class="space-y-1.5">
              <div class="flex justify-between text-xs">
                <span class="font-medium text-zinc-700 dark:text-zinc-300">{{ dept }}</span>
                <span class="font-mono text-zinc-500">{{ count }} {{ count > 1 ? 'staff' : 'staff' }}</span>
              </div>
              <div class="w-full h-1.5 bg-zinc-50 dark:bg-zinc-900 rounded overflow-hidden">
                <div 
                  class="bg-lime-500 h-full rounded transition-all duration-500"
                  :style="{ width: `${(count / stats.totalEmployees) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono text-right">
          Utilization Scoped
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { 
  Users, 
  CreditCard, 
  CalendarRange, 
  Gift, 
  Cake, 
  Award, 
  Layers, 
  Sparkles 
} from 'lucide-vue-next';

defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      totalEmployees: 0,
      monthlyPayroll: 0,
      activeLeaves: 0,
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      milestones: [],
      departmentBreakdown: {},
    })
  }
});

// Utility to format currency nicely
const formatCurrency = (value) => {
  if (value === undefined || value === null) return '₦0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(value);
};
</script>
