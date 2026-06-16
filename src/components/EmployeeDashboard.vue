<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50 tracking-tight">
          Welcome back, {{ authUser?.name?.split(' ')[0] || 'Employee' }}!
        </h2>
        <p class="text-sm text-zinc-500 mt-1">Here is a quick overview of your personal workspace today.</p>
      </div>
      
      <!-- Time and Date -->
      <div class="hidden md:flex items-center gap-3 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
        <Clock class="w-4 h-4 text-lime-600 dark:text-lime-400" />
        <div>
          <p class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Time</p>
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ currentTime }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Leave Balance Widget -->
      <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CalendarOff class="w-5 h-5" />
          </div>
          <button @click="$emit('navigate', 'leaves')" class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Apply</button>
        </div>
        <p class="text-sm font-medium text-zinc-500">Annual Leave Balance</p>
        <div class="flex items-end gap-2 mt-1">
          <h3 class="text-3xl font-bold font-display text-zinc-900 dark:text-zinc-50">15</h3>
          <span class="text-sm font-medium text-zinc-500 mb-1">Days left</span>
        </div>
        <!-- Progress bar mock -->
        <div class="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 mt-4">
          <div class="bg-indigo-500 h-1.5 rounded-full" style="width: 70%"></div>
        </div>
      </div>

      <!-- Payslip Widget -->
      <div class="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="w-10 h-10 rounded-lg bg-lime-50 dark:bg-lime-950/50 flex items-center justify-center text-lime-600 dark:text-lime-400">
            <CreditCard class="w-5 h-5" />
          </div>
          <button @click="$emit('navigate', 'payroll')" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">View All</button>
        </div>
        <p class="text-sm font-medium text-zinc-500">Latest Payslip</p>
        <div class="flex items-end gap-2 mt-1">
          <h3 class="text-xl font-bold font-display text-zinc-900 dark:text-zinc-50">Available</h3>
        </div>
        <p class="text-xs text-zinc-500 mt-4 flex items-center gap-1.5">
          <FileText class="w-3.5 h-3.5" />
          October 2026 Salary
        </p>
      </div>

      <!-- Training & Helpdesk Widget -->
      <div class="bg-zinc-900 dark:bg-zinc-50 rounded-xl p-5 shadow-sm text-white dark:text-black relative overflow-hidden group">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 dark:bg-black/5 rounded-full group-hover:scale-150 transition duration-500"></div>
        <div class="flex justify-between items-start mb-4 relative z-10">
          <div class="w-10 h-10 rounded-lg bg-white/20 dark:bg-black/10 flex items-center justify-center">
            <LifeBuoy class="w-5 h-5" />
          </div>
        </div>
        <p class="text-sm font-medium text-white/80 dark:text-black/70 relative z-10">Helpdesk Tickets</p>
        <div class="flex items-end gap-2 mt-1 relative z-10">
          <h3 class="text-3xl font-bold font-display">0</h3>
          <span class="text-sm font-medium text-white/80 dark:text-black/70 mb-1">Pending</span>
        </div>
        <button @click="$emit('navigate', 'helpdesk')" class="text-xs font-semibold hover:underline mt-4 relative z-10">Open a request &rarr;</button>
      </div>
      
    </div>

    <!-- Quick Links Grid -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <button @click="$emit('navigate', 'internal-jobs')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <Briefcase class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Internal Jobs</span>
      </button>
      <button @click="$emit('navigate', 'trainings')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <BookOpen class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Trainings</span>
      </button>
      <button @click="$emit('navigate', 'org')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2 text-center">
        <Target class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">KPIs & 360 Review</span>
      </button>
      <button @click="$emit('navigate', 'benefits')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <HeartPulse class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">My Benefits</span>
      </button>
      <button @click="$emit('navigate', 'documents')" class="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:shadow-md transition gap-2">
        <FileText class="w-5 h-5 text-zinc-400" />
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">My Documents</span>
      </button>
    </div>

    <!-- Announcements / Policies Box -->
    <div class="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
      <h3 class="font-display font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-3">Recent Company Updates</h3>
      <div class="space-y-3">
        <div class="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex gap-3 items-center">
          <div class="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Sparkles class="w-4 h-4" />
          </div>
          <div>
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">New Work From Home Policy</p>
            <p class="text-xs text-zinc-500">Please review the updated remote work guidelines in your documents.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CalendarOff, CreditCard, LifeBuoy, FileText, Briefcase, BookOpen, Target, Clock, Sparkles } from 'lucide-vue-next';

defineProps({
  authUser: {
    type: Object,
    required: true
  }
});

defineEmits(['navigate']);

const currentTime = ref('');
let timer;

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 60000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>
