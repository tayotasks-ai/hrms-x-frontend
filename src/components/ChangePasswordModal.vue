<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="$emit('close')">
    <div class="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div class="h-14 px-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Change Password</h3>
        <button @click="$emit('close')" class="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded text-zinc-500 transition">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="p-5 space-y-4">
        <p v-if="isDefaultPassword" class="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
          You're signed in with a temporary password. Set your own to keep your account secure.
        </p>

        <div v-if="error" class="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-lg text-xs">
          {{ error }}
        </div>
        <div v-if="success" class="p-2.5 bg-lime-50 dark:bg-lime-950/30 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded-lg text-xs">
          Password updated.
        </div>

        <div class="space-y-1">
          <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Current Password</label>
          <input v-model="form.currentPassword" type="password" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
        </div>
        <div class="space-y-1">
          <label class="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">New Password</label>
          <input v-model="form.newPassword" type="password" placeholder="At least 8 characters" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition" />
        </div>

        <button
          @click="submit"
          :disabled="submitting"
          class="w-full bg-lime-500 text-black font-bold py-2.5 rounded-lg text-sm hover:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50"
        >
          {{ submitting ? 'Saving…' : 'Update Password' }}
        </button>

        <div class="pt-4 mt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Email login code (2FA)</p>
              <p class="text-[10px] text-zinc-500 mt-0.5">Require a code sent to your email each time you sign in.</p>
            </div>
            <button
              @click="toggleTwoFactor"
              :disabled="savingTwoFactor"
              :class="[twoFactorEnabled ? 'bg-lime-500' : 'bg-zinc-300 dark:bg-zinc-700', 'relative w-10 h-6 rounded-full transition shrink-0 disabled:opacity-50 cursor-pointer']"
            >
              <span :class="[twoFactorEnabled ? 'translate-x-4' : 'translate-x-0.5', 'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform']"></span>
            </button>
          </div>
          <p v-if="twoFactorError" class="text-[10px] text-red-500">{{ twoFactorError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import { useApi } from '../composables/useApi';

const props = defineProps({
  isDefaultPassword: { type: Boolean, default: false },
  initialTwoFactorEnabled: { type: Boolean, default: false },
});
const emit = defineEmits(['close', 'changed', 'twoFactorChanged']);

const { changePassword, setTwoFactor } = useApi();

const form = ref({ currentPassword: '', newPassword: '' });
const submitting = ref(false);
const error = ref(null);
const success = ref(false);

const twoFactorEnabled = ref(props.initialTwoFactorEnabled);
const savingTwoFactor = ref(false);
const twoFactorError = ref(null);

const toggleTwoFactor = async () => {
  const next = !twoFactorEnabled.value;
  savingTwoFactor.value = true;
  twoFactorError.value = null;
  try {
    await setTwoFactor(next);
    twoFactorEnabled.value = next;
    emit('twoFactorChanged', next);
  } catch (err) {
    twoFactorError.value = err.response?.data?.message || 'Failed to update.';
  } finally {
    savingTwoFactor.value = false;
  }
};

const submit = async () => {
  error.value = null;
  success.value = false;
  if (!form.value.currentPassword || !form.value.newPassword) {
    error.value = 'Both fields are required.';
    return;
  }
  if (form.value.newPassword.length < 8) {
    error.value = 'New password must be at least 8 characters.';
    return;
  }
  submitting.value = true;
  try {
    await changePassword(form.value);
    success.value = true;
    emit('changed');
    setTimeout(() => emit('close'), 900);
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to update password.';
  } finally {
    submitting.value = false;
  }
};
</script>
