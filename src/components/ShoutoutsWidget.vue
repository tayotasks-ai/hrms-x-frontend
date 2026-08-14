<template>
  <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6">
    <div class="flex items-center justify-between pb-4 border-b border-zinc-900">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Recent Shoutouts</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Public recognition, company-wide.</p>
      </div>
      <button
        @click="openComposer"
        class="flex items-center gap-1.5 bg-lime-500 text-black font-semibold px-3 py-1.5 rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition cursor-pointer shrink-0"
      >
        <Megaphone class="w-3.5 h-3.5" />
        <span>Shoutout</span>
      </button>
    </div>

    <div v-if="!shoutouts || shoutouts.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
      <Megaphone class="w-8 h-8 text-zinc-700 mb-2" />
      <p class="text-xs text-zinc-500">No shoutouts yet. Be the first to recognize someone.</p>
    </div>

    <div v-else class="mt-4 space-y-3 h-[320px] overflow-y-auto pr-1">
      <div
        v-for="s in sortedShoutouts"
        :key="s._id"
        class="p-3 rounded bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-900"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm text-zinc-800 dark:text-zinc-200">
            <span class="font-semibold">{{ s.from?.name }}</span>
            <span class="text-zinc-500"> &rarr; </span>
            <span class="font-semibold">{{ recipientNames(s) }}</span>
          </p>
          <span
            v-if="s.tag"
            class="text-[9px] font-mono uppercase font-semibold rounded px-2 py-0.5 shrink-0 bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-900"
          >
            {{ s.tag }}
          </span>
        </div>
        <p class="text-sm text-zinc-700 dark:text-zinc-300 mt-1.5">{{ s.message }}</p>
        <div class="flex items-center gap-3 mt-2">
          <button
            v-for="emoji in ['👍', '🎉', '❤️']"
            :key="emoji"
            @click="react(s, emoji)"
            :class="[
              reactionCount(s, emoji) > 0 ? 'bg-lime-100 dark:bg-lime-950 border-lime-300 dark:border-lime-800' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800',
              'text-xs px-2 py-0.5 rounded border transition hover:border-lime-400 cursor-pointer'
            ]"
          >
            {{ emoji }} <span v-if="reactionCount(s, emoji) > 0" class="font-mono">{{ reactionCount(s, emoji) }}</span>
          </button>
          <span class="text-[10px] text-zinc-500 font-mono ml-auto">{{ timeAgo(s.createdAt) }}</span>
        </div>
      </div>
    </div>

    <!-- Composer Modal -->
    <div
      v-if="showComposer"
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeComposer"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Megaphone class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Give a Shoutout</h3>
          </div>
          <button @click="closeComposer" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="submit" class="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Recognize</label>
            <div class="border border-zinc-200 dark:border-zinc-800 rounded max-h-36 overflow-y-auto">
              <label
                v-for="emp in directory"
                :key="emp._id"
                class="flex items-center gap-2 px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer border-b border-zinc-100 dark:border-zinc-900 last:border-0"
              >
                <input type="checkbox" :value="emp._id" v-model="form.toEmployeeIds" class="accent-lime-500" />
                {{ emp.name }} <span class="text-zinc-500 text-xs">({{ emp.role }} &bull; {{ emp.departmentId?.name || 'No Department' }})</span>
              </label>
              <p v-if="!directory || directory.length === 0" class="px-3 py-2 text-xs text-zinc-500">No colleagues available.</p>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Tag (optional)</label>
            <select
              v-model="form.tag"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="">No tag</option>
              <option value="Great Work">Great Work</option>
              <option value="Team Player">Team Player</option>
              <option value="Went Above &amp; Beyond">Went Above &amp; Beyond</option>
              <option value="Lived Our Values">Lived Our Values</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Message</label>
            <textarea
              v-model="form.message"
              rows="3"
              maxlength="240"
              placeholder="What did they do that deserves a shoutout?"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
            <p class="text-[10px] text-zinc-500 font-mono text-right">{{ form.message.length }}/240</p>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="closeComposer"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Posting...</span>
            <span v-else>Post Shoutout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Megaphone, X } from 'lucide-vue-next';

const props = defineProps({
  shoutouts: { type: Array, default: () => [] },
  authUser: { type: Object, default: null }
});

const sortedShoutouts = computed(() => {
  return [...props.shoutouts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const emit = defineEmits(['refresh']);
const { createShoutout, reactToShoutout, getDirectoryLite } = useApi();

const showComposer = ref(false);
const submitting = ref(false);
const formError = ref(null);
const directory = ref([]);

const initialForm = { toEmployeeIds: [], tag: '', message: '' };
const form = ref({ ...initialForm });

const openComposer = async () => {
  showComposer.value = true;
  if (directory.value.length === 0) {
    directory.value = await getDirectoryLite().catch(() => []);
  }
};
const closeComposer = () => {
  showComposer.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const recipientNames = (s) => (s.toEmployeeIds || []).map(e => e?.name || 'Someone').join(', ');

const reactionCount = (s, emoji) => (s.reactions || []).filter(r => r.emoji === emoji).length;

const react = async (shoutout, emoji) => {
  try {
    await reactToShoutout(shoutout._id, emoji);
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to react.');
  }
};

const timeAgo = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const submit = async () => {
  if (form.value.toEmployeeIds.length === 0 || !form.value.message.trim()) {
    formError.value = 'Select at least one recipient and write a message.';
    return;
  }
  submitting.value = true;
  formError.value = null;
  try {
    await createShoutout({
      toEmployeeIds: form.value.toEmployeeIds,
      message: form.value.message.trim(),
      tag: form.value.tag || null
    });
    emit('refresh');
    closeComposer();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to post shoutout.';
  } finally {
    submitting.value = false;
  }
};
</script>
