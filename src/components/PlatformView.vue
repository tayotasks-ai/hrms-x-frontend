<template>
  <div class="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
    <!-- ── Login ─────────────────────────────────────────────────────────── -->
    <div v-if="!platformAdmin" class="flex-1 flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="flex items-center gap-2 mb-6 justify-center text-zinc-400">
          <ShieldAlert class="w-5 h-5" />
          <span class="font-mono text-xs uppercase tracking-widest">Platform Root Access</span>
        </div>
        <form @submit.prevent="handleLogin" class="space-y-3 bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <div>
            <label class="text-xs text-zinc-500 font-mono">Email</label>
            <input v-model="email" type="email" required autocomplete="username"
              class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-600" />
          </div>
          <div>
            <label class="text-xs text-zinc-500 font-mono">Password</label>
            <input v-model="password" type="password" required autocomplete="current-password"
              class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-600" />
          </div>
          <p v-if="loginError" class="text-xs text-red-400 font-mono">{{ loginError }}</p>
          <button type="submit" :disabled="loggingIn"
            class="w-full bg-zinc-100 text-zinc-900 font-semibold py-2 rounded text-sm hover:opacity-90 disabled:opacity-50 transition">
            {{ loggingIn ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <button @click="$emit('exit')" class="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-4 font-mono">
          ← back to WorkDesk
        </button>
      </div>
    </div>

    <!-- ── Dashboard ─────────────────────────────────────────────────────── -->
    <template v-else>
      <div class="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div class="flex items-center gap-2 text-zinc-300">
          <ShieldAlert class="w-4 h-4 text-amber-500" />
          <span class="font-mono text-xs uppercase tracking-widest">Platform Root — {{ platformAdmin.name }}</span>
        </div>
        <div class="flex items-center gap-3">
          <button @click="loadTenants" :disabled="loading" class="text-zinc-400 hover:text-zinc-100 transition" title="Refresh">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
          </button>
          <button @click="handleSignOut" class="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 font-mono">
            <LogOut class="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <p v-if="loadError" class="text-sm text-red-400 font-mono mb-4">{{ loadError }}</p>

        <div v-if="loading && !tenantRows.length" class="text-zinc-500 text-sm font-mono py-10 text-center">Loading organisations…</div>

        <div v-else class="grid gap-3">
          <div v-for="t in tenantRows" :key="t._id"
            class="border border-zinc-800 rounded-lg p-4 bg-zinc-900 flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-zinc-100 truncate">{{ t.name }}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase"
                  :class="t.planTier === 'Paid' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'">
                  {{ t.planTier }}
                </span>
              </div>
              <div class="text-xs text-zinc-500 font-mono mt-1">
                {{ t.employeeCount }} employees · ₦{{ t.walletBalance.toLocaleString() }} wallet
                <span v-if="t.planTier === 'Paid'">· ₦{{ (t.pricePerEmployee * t.employeeCount).toLocaleString() }}/mo</span>
                · joined {{ new Date(t.createdAt).toLocaleDateString('en-NG') }}
              </div>
              <div class="flex items-center gap-3 mt-2 text-[11px] font-mono">
                <span :class="t.onboarding.steps.employees_added ? 'text-emerald-400' : 'text-zinc-600'">● Employees added</span>
                <span :class="t.onboarding.steps.wallet_funded ? 'text-emerald-400' : 'text-zinc-600'">● Wallet funded</span>
                <span :class="t.onboarding.steps.payroll_run ? 'text-emerald-400' : 'text-zinc-600'">● Payroll run</span>
                <span class="text-zinc-500">({{ t.onboarding.percent }}% onboarded)</span>
              </div>
            </div>
            <button @click="openConfirmModal(t)" :disabled="impersonatingId === t._id"
              class="shrink-0 flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-medium px-4 py-2 rounded text-xs font-mono disabled:opacity-50 transition">
              <LogIn class="w-3.5 h-3.5" />
              {{ impersonatingId === t._id ? 'Opening…' : 'Impersonate' }}
            </button>
          </div>

          <p v-if="!loading && !tenantRows.length" class="text-zinc-600 text-sm font-mono text-center py-10">No organisations yet.</p>
        </div>
      </div>
    </template>

    <!-- ── Impersonation confirm modal ──────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="confirmTenant" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="closeConfirmModal">
        <div class="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6">
          <div class="flex items-center gap-2.5 text-amber-500 mb-3">
            <ShieldAlert class="w-5 h-5" />
            <span class="text-sm font-semibold uppercase tracking-wide">Impersonation</span>
          </div>
          <p class="text-sm text-zinc-300 leading-relaxed">
            Log in as <strong class="text-zinc-100">{{ confirmTenant.name }}</strong>'s HR Admin?
          </p>
          <p class="text-xs text-zinc-500 font-mono mt-2 mb-3">
            Their HR Admins are notified automatically and this is written to the audit log. Session expires in 45 minutes.
          </p>
          <label class="text-xs text-zinc-500 font-mono">Reason (required)</label>
          <textarea v-model="impersonateReason" rows="2" placeholder="e.g. helping them troubleshoot wallet setup"
            class="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"></textarea>
          <div class="flex items-center gap-2 mt-4">
            <button @click="closeConfirmModal"
              class="flex-1 py-2 rounded text-sm font-medium text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">
              Cancel
            </button>
            <button @click="confirmImpersonate" :disabled="impersonatingId === confirmTenant._id || !impersonateReason.trim()"
              class="flex-1 py-2 rounded text-sm font-semibold bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition">
              {{ impersonatingId === confirmTenant._id ? 'Opening…' : 'Log in as HR Admin' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ShieldAlert, RefreshCw, LogOut, LogIn } from 'lucide-vue-next';
import { useApi } from '../composables/useApi';

const emit = defineEmits(['exit', 'impersonated']);

const {
  platformAdmin, restorePlatformAdmin, platformLogin, platformLogout,
  getPlatformTenants, impersonateTenant, setAuthUser, setActiveTenant,
} = useApi();

const email = ref('');
const password = ref('');
const loggingIn = ref(false);
const loginError = ref('');

const tenantRows = ref([]);
const loading = ref(false);
const loadError = ref('');
const impersonatingId = ref(null);
const confirmTenant = ref(null);
const impersonateReason = ref('');

const openConfirmModal = (tenant) => {
  confirmTenant.value = tenant;
  impersonateReason.value = '';
};
const closeConfirmModal = () => {
  confirmTenant.value = null;
  impersonateReason.value = '';
};

const handleLogin = async () => {
  loggingIn.value = true;
  loginError.value = '';
  try {
    await platformLogin({ email: email.value, password: password.value });
    await loadTenants();
  } catch (err) {
    loginError.value = err.response?.data?.message || 'Invalid email or password.';
  } finally {
    loggingIn.value = false;
  }
};

const loadTenants = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    tenantRows.value = await getPlatformTenants();
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Failed to load organisations.';
  } finally {
    loading.value = false;
  }
};

const confirmImpersonate = async () => {
  const tenant = confirmTenant.value;
  if (!tenant || !impersonateReason.value.trim()) return;
  impersonatingId.value = tenant._id;
  try {
    const result = await impersonateTenant(tenant._id, impersonateReason.value.trim());
    setAuthUser(result);
    setActiveTenant(result.tenant);
    localStorage.setItem('hrms_impersonating', JSON.stringify({
      tenantName: tenant.name,
      platformAdminName: result.impersonation.platformAdminName,
      expiresAt: result.impersonation.expiresAt,
    }));
    closeConfirmModal();
    emit('impersonated');
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Failed to impersonate this tenant.';
    closeConfirmModal();
  } finally {
    impersonatingId.value = null;
  }
};

const handleSignOut = () => {
  platformLogout();
  tenantRows.value = [];
};

onMounted(() => {
  restorePlatformAdmin();
  if (platformAdmin.value) loadTenants();
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
