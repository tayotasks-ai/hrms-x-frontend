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
          <div class="w-8 h-8 bg-lime-500 rounded flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(132,204,22,0.4)]">WD</div>
          <span class="font-bold text-zinc-900 dark:text-zinc-100 text-lg uppercase tracking-wider">WorkDesk</span>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs font-mono flex items-start gap-2">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" /><span>{{ error }}</span>
        </div>

        <div v-if="notice" class="mb-4 p-3 bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded-lg text-xs font-mono flex items-start gap-2">
          <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" /><span>{{ notice }}</span>
        </div>

        <!-- Login -->
        <div v-if="view === 'login'" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">Welcome back</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Sign in to your workspace.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input v-model="loginForm.email" type="email" required placeholder="admin@company.com" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Password</label>
                <button type="button" @click="switchView('forgot')" class="text-[10px] text-lime-600 dark:text-lime-400 font-semibold hover:underline">Forgot password?</button>
              </div>
              <input v-model="loginForm.password" type="password" required placeholder="••••••••" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleLogin" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Signing in...' : 'Sign In' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <p class="text-xs text-zinc-500">
              Don't have an account?
              <button @click="switchView('register')" class="text-lime-600 dark:text-lime-400 font-semibold hover:underline ml-1">Create workspace</button>
            </p>
          </div>
        </div>

        <!-- 2FA: Email OTP -->
        <div v-else-if="view === 'otp'" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">Enter your login code</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">We sent a 6-digit code to {{ otpEmail }}.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Code</label>
              <input v-model="otpForm.code" type="text" inputmode="numeric" maxlength="6" required placeholder="123456" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center text-lg tracking-[0.5em] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleVerifyOtp" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Verifying...' : 'Confirm' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <button @click="switchView('login')" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">&larr; Back to sign in</button>
          </div>
        </div>

        <!-- Forgot Password -->
        <div v-else-if="view === 'forgot'" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">Reset your password</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">We'll email you a link to choose a new one.</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input v-model="forgotForm.email" type="email" required placeholder="you@company.com" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleForgotPassword" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <button @click="switchView('login')" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">&larr; Back to sign in</button>
          </div>
        </div>

        <!-- Reset Password (arrived via emailed link) -->
        <div v-else-if="view === 'reset'" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">Choose a new password</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">For {{ resetForm.email }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">New Password</label>
              <input v-model="resetForm.newPassword" type="password" required placeholder="At least 8 characters" class="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleResetPassword" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Saving...' : 'Set New Password' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <button @click="switchView('login')" class="text-xs text-lime-600 dark:text-lime-400 font-semibold hover:underline">&larr; Back to sign in</button>
          </div>
        </div>

        <!-- Register -->
        <div v-else-if="view === 'register'" class="space-y-5">
          <div class="text-center space-y-1 mb-6">
            <h3 class="text-xl font-extrabold text-zinc-900 dark:text-white">New Workspace</h3>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Set up your organisation in seconds.</p>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Company Name</label>
                <input v-model="signupForm.name" type="text" required placeholder="Acme Corp" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Slug</label>
                <input v-model="signupForm.slug" type="text" required placeholder="acme" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition font-mono" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Name</label>
                <input v-model="signupForm.adminName" type="text" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
              <div>
                <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                <input v-model="signupForm.adminEmail" type="email" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Admin Password</label>
              <input v-model="signupForm.adminPassword" type="password" required placeholder="••••••••" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
            </div>

            <button @click="handleRegister" :disabled="isLoading" class="w-full bg-lime-500 text-black font-bold py-3 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 mt-2 shadow-[0_4px_14px_0_rgba(132,204,22,0.39)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.23)]">
              {{ isLoading ? 'Creating workspace...' : 'Register & Launch' }}
            </button>
          </div>

          <div class="text-center mt-6">
            <p class="text-xs text-zinc-500">
              Already have an account?
              <button @click="switchView('login')" class="text-lime-600 dark:text-lime-400 font-semibold hover:underline ml-1">Sign in</button>
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useApi } from '../composables/useApi';
import { AlertCircle, CheckCircle2, X } from 'lucide-vue-next';

const props = defineProps({
  initialView: { type: String, default: 'login' },
  presetToken: { type: String, default: '' },
  presetEmail: { type: String, default: '' },
});

const emit = defineEmits(['close', 'success']);

const { loginUser, verifyLoginOtp, registerTenant, forgotPassword, resetPasswordRequest, isLoading, error } = useApi();

const view = ref(props.initialView);
const notice = ref(null);

const switchView = (v) => {
  view.value = v;
  notice.value = null;
  error.value = null;
};

const loginForm = ref({ email: '', password: '' });
const signupForm = ref({ name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '' });
const forgotForm = ref({ email: '' });
const resetForm = ref({ token: props.presetToken, email: props.presetEmail, newPassword: '' });
const otpForm = ref({ pendingToken: '', code: '' });
const otpEmail = ref('');

watch(() => signupForm.value.name, (newName) => {
  if (newName) {
    signupForm.value.slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  } else {
    signupForm.value.slug = '';
  }
});

const handleLogin = async () => {
  try {
    const data = await loginUser(loginForm.value);
    if (data?.requiresOtp) {
      otpForm.value = { pendingToken: data.pendingToken, code: '' };
      otpEmail.value = data.email || loginForm.value.email;
      switchView('otp');
      return;
    }
    emit('success');
  } catch {}
};

const handleVerifyOtp = async () => {
  try {
    await verifyLoginOtp(otpForm.value.pendingToken, otpForm.value.code.trim());
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

const handleForgotPassword = async () => {
  try {
    const res = await forgotPassword(forgotForm.value.email);
    notice.value = res.message || "If that email is registered, we've sent a reset link.";
  } catch {}
};

const handleResetPassword = async () => {
  try {
    await resetPasswordRequest(resetForm.value);
    notice.value = 'Password reset. You can sign in now.';
    loginForm.value.email = resetForm.value.email;
    loginForm.value.password = '';
    setTimeout(() => switchView('login'), 1200);
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
