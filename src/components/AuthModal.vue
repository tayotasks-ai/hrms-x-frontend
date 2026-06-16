<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
    <div class="bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col transform transition-all animate-slide-up relative">
      <!-- Close button -->
      <button @click="$emit('close')" class="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition">
        <X class="w-5 h-5" />
      </button>

      <div class="p-8 flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-center mb-6 gap-2">
          <div class="w-8 h-8 bg-lime-500 rounded flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(132,204,22,0.4)]">HX</div>
          <span class="font-bold text-zinc-900 dark:text-zinc-100 text-lg uppercase tracking-wider">HRMS X</span>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs font-mono flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" /><span>{{ error }}</span>
        </div>

        <!-- Login -->
        <div v-if="isLogin" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">Welcome back</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Sign in to your workspace.</p>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input v-model="loginForm.email" type="email" required placeholder="admin@company.com" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
              <input v-model="loginForm.password" type="password" required placeholder="••••••••" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>
            
            <button @click="handleLogin" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <p class="text-xs text-zinc-500">
              Don't have an account? 
              <button @click="isLogin = false" class="text-lime-600 dark:text-lime-400 font-semibold hover:underline ml-1">Create workspace</button>
            </p>
          </div>
        </div>

        <!-- Register -->
        <div v-else class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">New Workspace</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Set up your organisation in seconds.</p>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input v-model="signupForm.name" type="text" required placeholder="Acme Corp" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Slug</label>
                <input v-model="signupForm.slug" type="text" required placeholder="acme" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition font-mono" />
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Name</label>
                <input v-model="signupForm.adminName" type="text" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                <input v-model="signupForm.adminEmail" type="email" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
            </div>
            
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Password</label>
              <input v-model="signupForm.adminPassword" type="password" required placeholder="••••••••" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleRegister" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Creating workspace...' : 'Register & Launch' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <p class="text-xs text-zinc-500">
              Already have an account? 
              <button @click="isLogin = true" class="text-lime-600 dark:text-lime-400 font-semibold hover:underline ml-1">Sign in</button>
            </p>
          </div>
        </div>

        <div v-if="tenants.length && isLogin" class="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-widest text-center mb-3">Demo Quick Access</p>
          <div class="flex flex-wrap justify-center gap-2">
            <button v-for="t in tenants" :key="t._id"
              @click="loginForm.email = 'hradmin@' + t.slug + '.com'; loginForm.password = 'password123'; handleLogin()"
              class="px-3 py-1.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-lime-500 transition text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:text-lime-600 dark:hover:text-lime-400">
              {{ t.name }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi';
import { AlertCircle, X } from 'lucide-vue-next';

const emit = defineEmits(['close', 'success']);

const { loginUser, registerTenant, tenants, isLoading, error } = useApi();

const isLogin = ref(true);

const loginForm = ref({ email: '', password: '' });
const signupForm = ref({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });

const handleLogin = async () => {
  try {
    await loginUser(loginForm.value);
    emit('success');
  } catch {}
};

const handleRegister = async () => {
  try {
    await registerTenant(signupForm.value);
    await loginUser({ email: signupForm.value.adminEmail, password: signupForm.value.adminPassword });
    signupForm.value = { name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' };
    emit('success');
  } catch {}
};
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.25s ease-out forwards;
}
.animate-slide-up {
  animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
