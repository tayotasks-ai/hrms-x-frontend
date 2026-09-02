<template>
  <div class="max-w-2xl space-y-6">
    <div class="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Payroll Wallet</h3>
      <p class="text-xs text-zinc-500 mt-0.5">Fund this wallet by transferring into your dedicated account below — every salary payment is paid out of it. Each transfer is debited at net pay plus Paystack's own transfer fee plus a flat ₦500 platform fee.</p>
    </div>

    <!-- Proactive funding warning: payday is close and confirmed-available
         funds won't cover this period's outstanding payslips yet. -->
    <div v-if="!loading && fundingWarning" class="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-lg flex items-start gap-3">
      <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <p class="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{{ fundingWarning }}</p>
    </div>

    <!-- Balance -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 space-y-1">
      <p class="text-xs font-mono text-zinc-500 uppercase tracking-wider">Wallet Balance</p>
      <p class="text-3xl font-bold font-display text-zinc-900 dark:text-zinc-50">
        <span v-if="loading">&hellip;</span>
        <span v-else>&#8358;{{ (wallet?.balance || 0).toLocaleString() }}</span>
      </p>
      <div v-if="!loading && settlementNote" class="pt-1">
        <p :class="settlementNote.fullyAvailable ? 'text-lime-600 dark:text-lime-400' : 'text-amber-600 dark:text-amber-400'" class="text-xs font-mono">
          {{ settlementNote.text }}
        </p>
      </div>
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
      {{ errorMsg }}
    </div>
    <div v-if="successMsg" class="p-3 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
      {{ successMsg }}
    </div>

    <!-- Dedicated account / setup -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 space-y-4">
      <div class="flex items-center gap-3">
        <div :class="[
          wallet?.dedicatedAccount ? 'bg-lime-100 dark:bg-lime-950 text-lime-600 dark:text-lime-400' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500',
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0'
        ]">
          <Landmark class="w-5 h-5" />
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Fund by bank transfer</p>
          <p class="text-xs text-zinc-500">
            <span v-if="loading">Checking status&hellip;</span>
            <span v-else-if="wallet?.dedicatedAccount" class="text-lime-600 dark:text-lime-400 font-medium">Account ready</span>
            <span v-else>Not set up yet</span>
          </p>
        </div>
      </div>

      <div v-if="wallet?.dedicatedAccount" class="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        <div class="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 rounded p-3">
          <div>
            <p class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Account Number</p>
            <p class="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-50">{{ wallet.dedicatedAccount.accountNumber }}</p>
          </div>
          <button
            @click="copyAccountNumber"
            class="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline shrink-0"
          >
            <Copy class="w-3.5 h-3.5" />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <p class="text-xs text-zinc-600 dark:text-zinc-400"><span class="font-semibold">Bank:</span> {{ wallet.dedicatedAccount.bankName }}</p>
        <p class="text-xs text-zinc-600 dark:text-zinc-400"><span class="font-semibold">Account name:</span> {{ wallet.dedicatedAccount.accountName }}</p>
        <p class="text-[11px] text-zinc-500 mt-2">Any transfer into this account lands in your wallet automatically, usually within a minute or two.</p>
      </div>

      <div v-else class="space-y-2">
        <div class="space-y-1">
          <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Phone Number</label>
          <input
            v-model="setupPhone"
            type="tel"
            placeholder="e.g. 08012345678"
            class="w-full max-w-xs px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          />
          <p class="text-[11px] text-zinc-500">Paystack requires a phone number to issue the dedicated account.</p>
        </div>
        <button
          @click="handleSetup"
          :disabled="busy || !setupPhone.trim()"
          class="flex items-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50"
        >
          <LinkIcon class="w-4 h-4" />
          <span>{{ busy ? 'Setting up…' : 'Set Up Wallet' }}</span>
        </button>
      </div>
    </div>

    <!-- Payroll schedule -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 space-y-4">
      <div>
        <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Automatic payday</p>
        <p class="text-xs text-zinc-500 mt-1">Once a day the system checks whether today is payday — if so, every outstanding payslip for the current period is paid automatically until the wallet runs out. Anything left unpaid is skipped and you're notified.</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" v-model="schedule.useLastDayOfMonth" @change="saveSchedule" class="rounded" />
          Last day of the month
        </label>
        <label v-if="!schedule.useLastDayOfMonth" class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          Day of month
          <select v-model.number="schedule.dayOfMonth" @change="saveSchedule" class="px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs font-mono">
            <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
      </div>

      <div class="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Auto-run active</p>
          <p v-if="schedule.lastRunAt" class="text-[11px] text-zinc-500 mt-0.5">Last ran {{ formatDate(schedule.lastRunAt) }}</p>
          <p v-if="schedule.active && wallet?.nextPayday" class="text-[11px] text-zinc-500 mt-0.5">
            Next payday: {{ formatShortDate(wallet.nextPayday) }}{{ wallet.daysUntilPayday === 0 ? ' (today)' : wallet.daysUntilPayday === 1 ? ' (tomorrow)' : ` (in ${wallet.daysUntilPayday} days)` }}
            — fund a few business days ahead to allow for settlement.
          </p>
        </div>
        <button
          @click="toggleScheduleActive"
          :disabled="savingSchedule"
          :class="[schedule.active ? 'bg-lime-500' : 'bg-zinc-300 dark:bg-zinc-700', 'relative w-10 h-6 rounded-full transition shrink-0 disabled:opacity-50 cursor-pointer']"
        >
          <span :class="[schedule.active ? 'translate-x-4' : 'translate-x-0.5', 'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform']"></span>
        </button>
      </div>
    </div>

    <!-- Dual approval -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Require dual approval for manual payroll</p>
          <p class="text-xs text-zinc-500 mt-1">When on, Pay Now / Pay Selected files a request instead of paying immediately — a <em>different</em> HR admin must approve it from the Payroll Approvals queue before any transfer is sent. Needs at least two HR admin accounts. Doesn't apply to the automatic payday run above — enabling that schedule is itself the authorization.</p>
        </div>
        <button
          @click="toggleDualApproval"
          :disabled="savingDualApproval"
          :class="[wallet?.requireDualApproval ? 'bg-lime-500' : 'bg-zinc-300 dark:bg-zinc-700', 'relative w-10 h-6 rounded-full transition shrink-0 disabled:opacity-50 cursor-pointer']"
        >
          <span :class="[wallet?.requireDualApproval ? 'translate-x-4' : 'translate-x-0.5', 'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform']"></span>
        </button>
      </div>
    </div>

    <!-- Transaction history -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6">
      <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm mb-3">Recent Activity</h3>
      <div v-if="!transactions.length" class="text-xs text-zinc-400 text-center py-6">No wallet activity yet.</div>
      <div v-else class="space-y-2">
        <div
          v-for="t in transactions"
          :key="t._id"
          class="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-900 pb-2 last:border-0 last:pb-0"
        >
          <div>
            <p class="font-semibold text-zinc-800 dark:text-zinc-200">{{ t.type === 'Funding' ? 'Wallet funded' : t.type === 'Refund' ? 'Refund' : (t.relatedPayslip?.employeeId?.name || 'Payroll debit') }}</p>
            <p class="text-zinc-400 mt-0.5">{{ formatDate(t.createdAt) }}</p>
          </div>
          <span :class="t.type === 'Funding' || t.type === 'Refund' ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-700 dark:text-zinc-300'" class="font-mono font-semibold">
            {{ t.type === 'Funding' || t.type === 'Refund' ? '+' : '-' }}&#8358;{{ t.amount.toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { Landmark, Link as LinkIcon, Copy, AlertTriangle } from 'lucide-vue-next';

const { getWallet, setupWallet, setWalletDualApproval, setPayrollSchedule, getWalletTransactions } = useApi();

const wallet = ref(null);
const transactions = ref([]);
const schedule = ref({ dayOfMonth: 25, useLastDayOfMonth: false, active: false, lastRunAt: null });
const loading = ref(true);
const busy = ref(false);
const copied = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);
const savingDualApproval = ref(false);
const savingSchedule = ref(false);
const setupPhone = ref('');

const load = async () => {
  loading.value = true;
  try {
    wallet.value = await getWallet();
    schedule.value = { ...wallet.value.payrollSchedule };
    transactions.value = await getWalletTransactions();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Could not load wallet.';
  } finally {
    loading.value = false;
  }
};

const handleSetup = async () => {
  busy.value = true;
  errorMsg.value = null;
  successMsg.value = null;
  try {
    await setupWallet(setupPhone.value.trim());
    successMsg.value = 'Wallet set up — fund it using the account details below.';
    await load();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to set up wallet.';
  } finally {
    busy.value = false;
  }
};

const copyAccountNumber = async () => {
  if (!wallet.value?.dedicatedAccount?.accountNumber) return;
  try {
    await navigator.clipboard.writeText(wallet.value.dedicatedAccount.accountNumber);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // Clipboard API unavailable — the number is already visible to copy manually.
  }
};

const saveSchedule = async () => {
  savingSchedule.value = true;
  errorMsg.value = null;
  try {
    const updated = await setPayrollSchedule({ dayOfMonth: schedule.value.dayOfMonth, useLastDayOfMonth: schedule.value.useLastDayOfMonth });
    schedule.value = { ...schedule.value, ...updated.payrollSchedule };
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to update payroll schedule.';
  } finally {
    savingSchedule.value = false;
  }
};

const toggleScheduleActive = async () => {
  const next = !schedule.value.active;
  savingSchedule.value = true;
  errorMsg.value = null;
  try {
    const updated = await setPayrollSchedule({ active: next });
    schedule.value = { ...schedule.value, ...updated.payrollSchedule };
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to update payroll schedule.';
  } finally {
    savingSchedule.value = false;
  }
};

const toggleDualApproval = async () => {
  const next = !wallet.value?.requireDualApproval;
  savingDualApproval.value = true;
  errorMsg.value = null;
  try {
    await setWalletDualApproval(next);
    wallet.value.requireDualApproval = next;
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to update dual approval setting.';
  } finally {
    savingDualApproval.value = false;
  }
};

const formatDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const formatShortDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

// Wallet Balance above is our own ledger — money that's landed in the
// dedicated account and been recorded, but not necessarily payable out yet.
// confirmedAvailable (from GET /wallet, capped at this tenant's own ledger
// balance — see walletController.js) is what's actually spendable on
// Paystack right now. When the two differ, some of the balance is still
// mid-settlement; nextSettlementDate is a rough "check back around then"
// hint, not a guarantee. Both fields come back null if the live check
// couldn't run (e.g. Paystack unreachable) — in that case we say nothing
// rather than guess.
const settlementNote = computed(() => {
  const w = wallet.value;
  if (!w || w.confirmedAvailable === null || w.confirmedAvailable === undefined) return null;
  if (w.confirmedAvailable >= (w.balance || 0)) {
    return { fullyAvailable: true, text: 'Fully available for payroll.' };
  }
  const pending = (w.balance || 0) - w.confirmedAvailable;
  const dateText = w.nextSettlementDate ? ` — expected available ${formatShortDate(w.nextSettlementDate)}` : '';
  return {
    fullyAvailable: false,
    text: `₦${pending.toLocaleString()} is still settling with Paystack and can't be paid out yet${dateText}.`,
  };
});

// Proactive heads-up, not just a reactive settlement note: fires when payday
// is close (within a week — enough buffer to clear a weekend/holiday) and
// what's confirmed-available won't cover this period's still-unpaid
// payslips. Backed by wallet.fundingShortfall from walletController.js
// getWallet, which only sums Unpaid/Failed payslips for the upcoming
// period — so this stays silent until real payslips exist to fall short on.
const fundingWarning = computed(() => {
  const w = wallet.value;
  if (!w || w.daysUntilPayday === null || w.daysUntilPayday === undefined) return null;
  if (w.daysUntilPayday < 0 || w.daysUntilPayday > 7) return null;
  if (!w.fundingShortfall || w.fundingShortfall <= 0) return null;

  const when = w.daysUntilPayday === 0 ? 'today' : w.daysUntilPayday === 1 ? 'tomorrow' : `in ${w.daysUntilPayday} days`;
  return `Payday is ${when} (${formatShortDate(w.nextPayday)}). This period needs about ₦${w.expectedPayrollTotal.toLocaleString()} but only ₦${((w.expectedPayrollTotal || 0) - w.fundingShortfall).toLocaleString()} is confirmed available — fund the shortfall of ₦${w.fundingShortfall.toLocaleString()} now, since deposits can take until the next business day (longer over a weekend or holiday).`;
});

onMounted(load);
</script>
