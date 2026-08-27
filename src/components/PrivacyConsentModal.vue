<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div class="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[85vh]">
      <div class="h-14 px-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 shrink-0">
        <ShieldCheck class="w-4 h-4 text-lime-600 dark:text-lime-400" />
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Privacy Notice</h3>
      </div>

      <div class="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <p class="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
          This is a plain-language summary drafted as a starting point — it has not been reviewed by a lawyer. Your employer is responsible for the final version.
        </p>

        <div class="space-y-1.5">
          <h4 class="font-semibold text-zinc-800 dark:text-zinc-200">What we collect</h4>
          <p>Your employer uses this system to store your employment details (role, salary, leave, performance) and, where you provide them, regulatory identifiers (BVN, NIN, TIN, pension/NHF numbers) and bank account details needed to pay you and meet statutory obligations.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-semibold text-zinc-800 dark:text-zinc-200">Why</h4>
          <p>To administer your employment: payroll, leave, performance reviews, and statutory filings (PAYE, pension, NHF) with the relevant Nigerian authorities.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-semibold text-zinc-800 dark:text-zinc-200">Protection</h4>
          <p>Regulatory IDs and your bank account number are encrypted at rest. Day-to-day access is limited to HR administrators at your organisation. In rare cases, a small, fixed set of WorkDesk platform staff can access your organisation's account for support (e.g. helping with setup or fixing an issue) — this is logged, time-limited to 45 minutes, requires a stated reason, and your organisation's HR Admins are notified automatically whenever it happens.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-semibold text-zinc-800 dark:text-zinc-200">Activity tracking</h4>
          <p>While you have WorkDesk open, we record whether you're actively using it — based on mouse/keyboard activity and whether the tab is visible and focused — to show your active time for the day. This only covers time inside this application. We do not track other apps, other browser tabs, keystrokes, or screenshots. HR can see your daily active-time totals; you can see your own from your dashboard.</p>
        </div>

        <div class="space-y-1.5">
          <h4 class="font-semibold text-zinc-800 dark:text-zinc-200">Your rights</h4>
          <p>Under the Nigeria Data Protection Act 2023, you can request a copy of your data, ask for corrections, or request erasure at any time from the "My Data & Privacy" panel on your dashboard.</p>
        </div>
      </div>

      <div class="p-5 border-t border-zinc-200 dark:border-zinc-800 shrink-0 space-y-3">
        <p v-if="errorMsg" class="text-xs text-rose-500">{{ errorMsg }}</p>
        <button
          @click="accept"
          :disabled="accepting"
          class="w-full bg-lime-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50"
        >
          {{ accepting ? 'Saving…' : 'I acknowledge and accept' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ShieldCheck } from 'lucide-vue-next';
import { useApi } from '../composables/useApi';

const props = defineProps({
  version: { type: String, required: true },
});
const emit = defineEmits(['accepted']);

const { setPrivacyConsent } = useApi();

const accepting = ref(false);
const errorMsg = ref(null);

const accept = async () => {
  accepting.value = true;
  errorMsg.value = null;
  try {
    const data = await setPrivacyConsent(props.version);
    emit('accepted', data.privacyConsent);
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Could not save your acceptance. Please try again.';
  } finally {
    accepting.value = false;
  }
};
</script>
