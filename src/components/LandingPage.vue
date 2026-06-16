<template>
  <div class="landing-page min-h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-50 font-sans overflow-x-hidden relative transition-colors duration-500">
    
    <!-- Animated background mesh -->
    <div class="mesh-bg dark:opacity-30 opacity-60 pointer-events-none"></div>

    <!-- Header -->
    <header class="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(132,204,22,0.4)]">HX</div>
        <span class="font-bold text-xl uppercase tracking-widest text-zinc-900 dark:text-white">HRMS X</span>
      </div>
      <div class="flex items-center gap-6">
        <button @click="$emit('toggle-theme')" class="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-zinc-500 dark:text-zinc-400 focus:outline-none">
          <Sun v-if="isDark" class="w-5 h-5" />
          <Moon v-else class="w-5 h-5" />
        </button>
        <button @click="$emit('open-auth')" class="hidden sm:inline-flex px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95 bg-zinc-900 text-white dark:bg-white dark:text-black shadow-lg">
          Sign In
        </button>
      </div>
    </header>

    <!-- Hero Section -->
    <main class="max-w-7xl w-full mx-auto px-6 pt-20 pb-32 relative z-10 flex flex-col items-center text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs font-mono tracking-wider uppercase mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
        <span class="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></span>
        Enterprise HR · Multi-Tenant SaaS
      </div>

      <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8 max-w-4xl animate-fade-in-up" style="animation-delay: 0.2s;">
        Full-Spectrum HRMS <br class="hidden md:block"/>
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-600">Built for Africa.</span>
      </h1>

      <p class="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-12 animate-fade-in-up leading-relaxed" style="animation-delay: 0.3s;">
        22 integrated modules covering the entire employee lifecycle — from pre-boarding to exit. Designed with Nigerian regulatory compliance and enterprise-grade multi-tenancy.
      </p>

      <div class="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style="animation-delay: 0.4s;">
        <button @click="$emit('open-auth')" class="px-8 py-4 rounded-full font-bold text-base bg-lime-500 text-black shadow-[0_0_30px_rgba(132,204,22,0.3)] hover:shadow-[0_0_40px_rgba(132,204,22,0.5)] transition-all hover:-translate-y-1 active:translate-y-0 w-full sm:w-auto">
          Get Started Free
        </button>
        <button @click="$emit('open-auth')" class="px-8 py-4 rounded-full font-bold text-base bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white transition-all w-full sm:w-auto">
          View Demo Orgs
        </button>
      </div>
    </main>

    <!-- Features Section -->
    <section class="max-w-7xl w-full mx-auto px-6 py-20 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="glass-card p-8 rounded-3xl animate-fade-in-up" style="animation-delay: 0.5s;">
          <div class="w-12 h-12 rounded-2xl bg-lime-500/20 flex items-center justify-center mb-6">
            <Layers class="w-6 h-6 text-lime-600 dark:text-lime-400" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">22 HR Modules</h3>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Payroll, Leave, Performance, Disciplinary, Assets, Onboarding, Exits, and more. All seamlessly talking to each other.
          </p>
        </div>

        <div class="glass-card p-8 rounded-3xl animate-fade-in-up" style="animation-delay: 0.6s;">
          <div class="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6">
            <ShieldCheck class="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">NDPR Compliant</h3>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            Built from the ground up to respect African data protection regulations. Your employee data is encrypted and secure.
          </p>
        </div>

        <div class="glass-card p-8 rounded-3xl animate-fade-in-up" style="animation-delay: 0.7s;">
          <div class="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6">
            <Building2 class="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 class="text-2xl font-bold mb-3 text-zinc-900 dark:text-white">Tenant Isolation</h3>
          <p class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
            100% data isolation between organisations. Manage multiple companies from a single highly-available platform.
          </p>
        </div>

      </div>
    </section>

  </div>
</template>

<script setup>
import { Sun, Moon, Layers, ShieldCheck, Building2 } from 'lucide-vue-next';

defineProps({
  isDark: { type: Boolean, default: true }
});

defineEmits(['toggle-theme', 'open-auth']);
</script>

<style scoped>
/* ── Premium Aesthetics & Animations ── */

.landing-page {
  /* Subtle grain texture overlay */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

.mesh-bg {
  position: fixed;
  top: -20%;
  left: -10%;
  width: 120vw;
  height: 120vh;
  background-image: 
    radial-gradient(at 80% 0%, hsla(84, 100%, 45%, 0.15) 0px, transparent 50%),
    radial-gradient(at 0% 50%, hsla(160, 100%, 40%, 0.1) 0px, transparent 50%),
    radial-gradient(at 80% 100%, hsla(220, 100%, 50%, 0.1) 0px, transparent 50%);
  filter: blur(80px);
  z-index: 0;
  animation: breathe 15s ease-in-out infinite alternate;
}

@keyframes breathe {
  0% { transform: scale(1) translate(0, 0); }
  50% { transform: scale(1.05) translate(2%, 3%); }
  100% { transform: scale(1) translate(-2%, -1%); }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  opacity: 0;
  animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Glassmorphism Card styling */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
}

.dark .glass-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.glass-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(132, 204, 22, 0.3); /* lime hover glow */
  box-shadow: 0 20px 40px -10px rgba(132, 204, 22, 0.15);
}

.dark .glass-card:hover {
  background: rgba(255, 255, 255, 0.04);
}
</style>
