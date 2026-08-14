<template>
  <div class="relative" ref="rootRef">
    <button
      @click="toggleOpen"
      class="relative p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-zinc-500"
      title="Notifications"
    >
      <Bell class="w-4 h-4" />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 max-h-96 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col z-50"
    >
      <div class="h-11 px-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Notifications</span>
        <button
          v-if="unreadCount > 0"
          @click="markAllRead"
          class="text-[10px] font-mono text-lime-600 dark:text-lime-400 hover:opacity-80 transition cursor-pointer"
        >
          Mark all read
        </button>
      </div>

      <div class="overflow-y-auto flex-1">
        <div v-if="notifications.length === 0" class="p-6 text-center text-xs text-zinc-400">
          No notifications yet.
        </div>
        <button
          v-for="n in notifications"
          :key="n._id"
          @click="handleClick(n)"
          class="w-full text-left px-3 py-2.5 border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition flex gap-2 items-start cursor-pointer"
        >
          <span :class="['w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.read ? 'bg-transparent' : 'bg-lime-500']"></span>
          <span class="min-w-0">
            <p :class="['text-xs', n.read ? 'text-zinc-500' : 'text-zinc-800 dark:text-zinc-200 font-semibold']">{{ n.title }}</p>
            <p class="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{{ n.message }}</p>
            <p class="text-[9px] text-zinc-400 font-mono mt-1">{{ timeAgo(n.createdAt) }}</p>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useApi } from '../composables/useApi';
import { Bell } from 'lucide-vue-next';

const emit = defineEmits(['navigate']);

const { getNotifications, markNotificationRead, markAllNotificationsRead } = useApi();

const open = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);
const rootRef = ref(null);
let pollHandle = null;

const load = async () => {
  try {
    const data = await getNotifications();
    notifications.value = data.notifications;
    unreadCount.value = data.unreadCount;
  } catch {
    // Silent — the bell just won't update this cycle.
  }
};

const toggleOpen = () => {
  open.value = !open.value;
  if (open.value) load();
};

const handleClick = async (n) => {
  if (!n.read) {
    try {
      await markNotificationRead(n._id);
      n.read = true;
      unreadCount.value = Math.max(unreadCount.value - 1, 0);
    } catch { /* non-fatal */ }
  }
  open.value = false;
  if (n.link) emit('navigate', n.link);
};

const markAllRead = async () => {
  try {
    await markAllNotificationsRead();
    notifications.value.forEach(n => { n.read = true; });
    unreadCount.value = 0;
  } catch { /* non-fatal */ }
};

const onClickOutside = (e) => {
  if (open.value && rootRef.value && !rootRef.value.contains(e.target)) open.value = false;
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

onMounted(() => {
  load();
  document.addEventListener('click', onClickOutside);
  // Light polling so the badge stays current without a full page reload.
  pollHandle = setInterval(load, 60000);
});
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
  if (pollHandle) clearInterval(pollHandle);
});
</script>
