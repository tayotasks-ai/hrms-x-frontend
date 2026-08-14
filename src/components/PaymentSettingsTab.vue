<template>
  <div class="max-w-2xl space-y-6">
    <div class="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Payment Settings</h3>
      <p class="text-xs text-zinc-500 mt-0.5">Connect your Paystack business account so HR can pay employee salaries directly from the Payroll tab. HRMS X never holds your funds — every transfer is initiated through your own Paystack account.</p>
    </div>

    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 space-y-5">
      <div class="flex items-center gap-3">
        <div :class="[
          settings?.paystack?.connected ? 'bg-lime-100 dark:bg-lime-950 text-lime-600 dark:text-lime-400' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500',
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0'
        ]">
          <CreditCard class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Paystack</p>
          <p class="text-xs text-zinc-500">
            <span v-if="loading">Checking status…</span>
            <span v-else-if="settings?.paystack?.connected" class="text-lime-600 dark:text-lime-400 font-medium">Connected {{ formatDate(settings.paystack.connectedAt) }}</span>
            <span v-else>Not connected</span>
          </p>
        </div>
        <button
          v-if="settings?.paystack?.connected"
          @click="disconnect"
          :disabled="busy"
          class="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950 transition disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>

      <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
        {{ errorMsg }}
      </div>
      <div v-if="successMsg" class="p-3 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
        {{ successMsg }}
      </div>

      <form v-if="!settings?.paystack?.connected" @submit.prevent="connect" class="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Paystack Secret Key</label>
          <input
            v-model="secretKey"
            type="password"
            autocomplete="off"
            placeholder="sk_test_… or sk_live_…"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-lime-500 transition"
          />
          <p class="text-[10px] text-zinc-500">Found in your Paystack Dashboard under Settings &rarr; API Keys &amp; Webhooks. This is encrypted before it's stored and is never shown again.</p>
        </div>
        <button
          type="submit"
          :disabled="busy || !secretKey.trim()"
          class="flex items-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50"
        >
          <LinkIcon class="w-4 h-4" />
          <span>{{ busy ? 'Verifying with Paystack…' : 'Connect Paystack' }}</span>
        </button>
      </form>

      <div v-else class="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
        <p>HR Admins can now pay employees from the <strong>Payroll &amp; Payslips</strong> tab, provided each employee has a verified bank account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { CreditCard, Link as LinkIcon } from 'lucide-vue-next';

const { getPaymentSettings, connectPaystack, disconnectPaystack } = useApi();

const settings = ref(null);
const loading = ref(true);
const busy = ref(false);
const secretKey = ref('');
const errorMsg = ref(null);
const successMsg = ref(null);

const load = async () => {
  loading.value = true;
  try {
    settings.value = await getPaymentSettings();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Could not load payment settings.';
  } finally {
    loading.value = false;
  }
};

const connect = async () => {
  busy.value = true;
  errorMsg.value = null;
  successMsg.value = null;
  try {
    await connectPaystack(secretKey.value.trim());
    secretKey.value = '';
    successMsg.value = 'Paystack connected successfully.';
    await load();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to connect Paystack.';
  } finally {
    busy.value = false;
  }
};

const disconnect = async () => {
  if (!confirm('Disconnect Paystack? HR will not be able to pay salaries through the platform until it is reconnected.')) return;
  busy.value = true;
  errorMsg.value = null;
  successMsg.value = null;
  try {
    await disconnectPaystack();
    successMsg.value = 'Paystack disconnected.';
    await load();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to disconnect.';
  } finally {
    busy.value = false;
  }
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

onMounted(load);
</script>
