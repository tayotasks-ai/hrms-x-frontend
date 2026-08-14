<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">{{ isHR ? 'Onboarding Management' : 'My Onboarding' }}</h3>
        <p class="text-xs text-zinc-500 mt-0.5">{{ isHR ? 'Build onboarding checklists for new hires and track their progress.' : 'Your onboarding checklist and milestones.' }}</p>
      </div>
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
      {{ errorMsg }}
    </div>

    <!-- Section A: Needs a Plan (HR only) -->
    <div v-if="isHR && employeesNeedingPlan.length > 0" class="border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 space-y-3">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p class="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {{ employeesNeedingPlan.length }} employee{{ employeesNeedingPlan.length === 1 ? '' : 's' }} in Onboarding status {{ employeesNeedingPlan.length === 1 ? 'has' : 'have' }} no plan yet
        </p>
      </div>
      <div class="space-y-2">
        <div
          v-for="emp in employeesNeedingPlan"
          :key="emp._id"
          class="flex items-center justify-between gap-3 bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/60 rounded p-3"
        >
          <div>
            <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ emp.name }}</p>
            <p class="text-xs text-zinc-500">{{ emp.role }} &bull; {{ emp.departmentId?.name || 'No Department' }}</p>
          </div>
          <button
            @click="openCreateModal(emp)"
            class="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-600 dark:bg-lime-400 text-black font-semibold px-3 py-1.5 rounded text-xs transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Section B: Active onboarding records -->
    <div v-if="onboardings.length === 0" class="flex flex-col items-center justify-center py-16 text-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900">
      <CheckSquare class="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
      <p class="text-sm font-semibold text-zinc-600 dark:text-zinc-400">No onboarding records found.</p>
      <p class="text-xs text-zinc-400 mt-1">{{ isHR ? 'Create an onboarding plan for new hires.' : 'Your HR team will set this up for you.' }}</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="ob in sortedOnboardings"
        :key="ob._id"
        class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 bg-white dark:bg-zinc-950 space-y-4"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">{{ ob.employeeId?.name || 'Deleted Employee' }}</p>
            <p class="text-xs text-zinc-500 mt-0.5">{{ ob.employeeId?.role }} &bull; {{ ob.employeeId?.departmentId?.name || 'No Department' }}</p>
            <p class="text-[10px] text-zinc-400 font-mono mt-0.5">Joined {{ formatDate(ob.employeeId?.joinDate) }}</p>
          </div>
          <div class="text-right shrink-0 space-y-1.5">
            <span :class="[
              ob.completionPercentage === 100 ? 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-400 border-lime-200 dark:border-lime-900' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-900',
              'text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded border inline-block'
            ]">{{ ob.completionPercentage }}% Complete</span>

            <div>
              <select
                v-if="isHR"
                :value="ob.stage"
                @change="changeStage(ob, $event.target.value)"
                :disabled="stageUpdatingId === ob._id"
                class="text-xs px-2 py-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-lime-500 transition disabled:opacity-50"
              >
                <option v-for="stage in STAGES" :key="stage" :value="stage">{{ stage }}</option>
              </select>
              <span v-else class="text-xs font-mono text-zinc-500">Stage: {{ ob.stage }}</span>
            </div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5">
          <div class="bg-lime-500 h-1.5 rounded-full transition-all" :style="`width: ${ob.completionPercentage}%`"></div>
        </div>

        <!-- Task list -->
        <div v-if="ob.tasks.length === 0" class="text-xs text-zinc-400 italic">No tasks yet.</div>
        <div v-else class="space-y-1.5">
          <div
            v-for="task in ob.tasks"
            :key="task._id"
            class="flex items-center gap-2 text-xs py-1"
          >
            <button
              v-if="isHR && task.status !== 'Completed'"
              @click="markTaskComplete(ob, task)"
              :disabled="taskUpdatingId === task._id"
              class="shrink-0 text-zinc-400 hover:text-lime-600 dark:hover:text-lime-400 transition disabled:opacity-50 cursor-pointer"
              title="Mark complete"
            >
              <Circle class="w-3.5 h-3.5" />
            </button>
            <span v-else :class="task.status === 'Completed' ? 'text-lime-600 dark:text-lime-400' : 'text-zinc-400'" class="shrink-0">
              <Check v-if="task.status === 'Completed'" class="w-3.5 h-3.5" />
              <Circle v-else class="w-3.5 h-3.5" />
            </span>
            <span :class="task.status === 'Completed' ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300'">{{ task.title }}</span>
            <span v-if="task.dueDate" class="ml-auto text-zinc-400 font-mono text-[10px] shrink-0">{{ formatDate(task.dueDate) }}</span>
            <span v-if="task.assignedTo" class="text-zinc-400 font-mono text-[10px] shrink-0">{{ task.assignedTo?.name }}</span>
          </div>
        </div>

        <!-- Add task (HR only) -->
        <div v-if="isHR" class="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <button
            v-if="addTaskForId !== ob._id"
            @click="openAddTask(ob._id)"
            class="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-lime-600 dark:hover:text-lime-400 transition cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>

          <div v-else class="space-y-2">
            <div v-if="addTaskError" class="p-2 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
              {{ addTaskError }}
            </div>
            <input
              v-model="newTask.title"
              type="text"
              placeholder="Task title"
              class="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            />
            <div class="grid grid-cols-2 gap-2">
              <select
                v-model="newTask.assignedTo"
                class="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
              >
                <option value="">Assignee (optional)</option>
                <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
              </select>
              <input
                v-model="newTask.dueDate"
                type="date"
                class="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-lime-500 transition"
              />
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="submitAddTask(ob)"
                :disabled="addingTask"
                class="px-3 py-1.5 bg-lime-500 text-black font-semibold rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition disabled:opacity-50 cursor-pointer"
              >
                {{ addingTask ? 'Adding…' : 'Add' }}
              </button>
              <button @click="closeAddTask" class="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Delete plan (HR only) -->
        <div v-if="isHR" class="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            @click="deletePlan(ob)"
            :disabled="deletingId === ob._id"
            class="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 transition disabled:opacity-50 cursor-pointer"
          >
            <Trash2 class="w-3.5 h-3.5" />
            <span>{{ deletingId === ob._id ? 'Deleting…' : 'Delete Plan' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Plan Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeCreateModal"
    >
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <CheckSquare class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Create Onboarding Plan</h3>
          </div>
          <button @click="closeCreateModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4 overflow-y-auto">
          <div v-if="createError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
            {{ createError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
            <div class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-700 dark:text-zinc-300">
              {{ createTargetEmployee?.name }} &bull; {{ createTargetEmployee?.role }}
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Tasks</label>
              <button @click="addCreateTaskRow" class="flex items-center gap-1 text-xs text-lime-600 dark:text-lime-400 hover:opacity-80 transition cursor-pointer">
                <Plus class="w-3.5 h-3.5" />
                <span>Add another task</span>
              </button>
            </div>

            <div v-for="(task, idx) in createForm.tasks" :key="idx" class="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded space-y-2">
              <div class="flex items-center gap-2">
                <input
                  v-model="task.title"
                  type="text"
                  placeholder="Task title (e.g. Set up laptop)"
                  class="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                />
                <button
                  v-if="createForm.tasks.length > 1"
                  @click="removeCreateTaskRow(idx)"
                  class="shrink-0 p-1.5 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                v-model="task.description"
                rows="1"
                placeholder="Description (optional)"
                class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-lime-500 transition"
              ></textarea>
              <div class="grid grid-cols-2 gap-2">
                <select
                  v-model="task.assignedTo"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
                >
                  <option value="">Assignee (optional)</option>
                  <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
                </select>
                <input
                  v-model="task.dueDate"
                  type="date"
                  class="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-lime-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            @click="closeCreateModal"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            :disabled="creating"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="submitCreate"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="creating"
          >
            <span v-if="creating">Creating...</span>
            <span v-else>Create Plan</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { CheckSquare, Check, Circle, Plus, Trash2, X, AlertTriangle } from 'lucide-vue-next';

const props = defineProps({
  onboardings: { type: Array, default: () => [] },
  employees:   { type: Array, default: () => [] },
  authUser:    { type: Object, default: null },
});

const emit = defineEmits(['refresh']);
const { createOnboarding, updateOnboardingTask, addOnboardingTask, updateOnboardingStage, deleteOnboarding } = useApi();

const isHR = computed(() => props.authUser?.role !== 'Employee');

const STAGES = ['Pre-boarding', 'Day 1', '30 Days', '60 Days', '90 Days', 'Completed'];

const errorMsg = ref(null);

// ── "Needs a plan" ────────────────────────────────────────────────────────────
const employeesNeedingPlan = computed(() => {
  const withPlan = new Set(props.onboardings.map(o => o.employeeId?._id || o.employeeId));
  return props.employees.filter(e => e.status === 'Onboarding' && !withPlan.has(e._id));
});

const sortedOnboardings = computed(() =>
  [...props.onboardings].sort((a, b) => (a.completionPercentage ?? 0) - (b.completionPercentage ?? 0))
);

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ── Create Plan modal ─────────────────────────────────────────────────────────
const showCreateModal = ref(false);
const createTargetEmployee = ref(null);
const createForm = ref({ tasks: [{ title: '', description: '', assignedTo: '', dueDate: '' }] });
const creating = ref(false);
const createError = ref(null);

const openCreateModal = (emp) => {
  createTargetEmployee.value = emp;
  createForm.value = { tasks: [{ title: '', description: '', assignedTo: '', dueDate: '' }] };
  createError.value = null;
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  createTargetEmployee.value = null;
};

const addCreateTaskRow = () => {
  createForm.value.tasks.push({ title: '', description: '', assignedTo: '', dueDate: '' });
};

const removeCreateTaskRow = (idx) => {
  createForm.value.tasks.splice(idx, 1);
};

const submitCreate = async () => {
  createError.value = null;
  const tasks = createForm.value.tasks
    .filter(t => t.title.trim())
    .map(t => ({
      title: t.title.trim(),
      description: t.description?.trim() || '',
      assignedTo: t.assignedTo || undefined,
      dueDate: t.dueDate || undefined,
    }));

  creating.value = true;
  try {
    await createOnboarding({ employeeId: createTargetEmployee.value._id, tasks });
    emit('refresh');
    closeCreateModal();
  } catch (err) {
    createError.value = err.response?.data?.message || err.message || 'Failed to create onboarding plan.';
  } finally {
    creating.value = false;
  }
};

// ── Stage changes ─────────────────────────────────────────────────────────────
const stageUpdatingId = ref(null);

const changeStage = async (ob, stage) => {
  errorMsg.value = null;
  stageUpdatingId.value = ob._id;
  try {
    await updateOnboardingStage(ob._id, stage);
    emit('refresh');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to update stage.';
  } finally {
    stageUpdatingId.value = null;
  }
};

// ── Mark task complete ────────────────────────────────────────────────────────
const taskUpdatingId = ref(null);

const markTaskComplete = async (ob, task) => {
  errorMsg.value = null;
  taskUpdatingId.value = task._id;
  try {
    await updateOnboardingTask(ob._id, task._id, { status: 'Completed' });
    emit('refresh');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to update task.';
  } finally {
    taskUpdatingId.value = null;
  }
};

// ── Add task inline ───────────────────────────────────────────────────────────
const addTaskForId = ref(null);
const newTask = ref({ title: '', assignedTo: '', dueDate: '' });
const addingTask = ref(false);
const addTaskError = ref(null);

const openAddTask = (obId) => {
  addTaskForId.value = obId;
  newTask.value = { title: '', assignedTo: '', dueDate: '' };
  addTaskError.value = null;
};

const closeAddTask = () => {
  addTaskForId.value = null;
  addTaskError.value = null;
};

const submitAddTask = async (ob) => {
  if (!newTask.value.title.trim()) {
    addTaskError.value = 'Task title is required.';
    return;
  }
  addingTask.value = true;
  addTaskError.value = null;
  try {
    await addOnboardingTask(ob._id, {
      title: newTask.value.title.trim(),
      assignedTo: newTask.value.assignedTo || undefined,
      dueDate: newTask.value.dueDate || undefined,
    });
    emit('refresh');
    closeAddTask();
  } catch (err) {
    addTaskError.value = err.response?.data?.message || err.message || 'Failed to add task.';
  } finally {
    addingTask.value = false;
  }
};

// ── Delete plan ────────────────────────────────────────────────────────────────
const deletingId = ref(null);

const deletePlan = async (ob) => {
  if (!confirm(`Delete the onboarding plan for ${ob.employeeId?.name || 'this employee'}? This cannot be undone.`)) return;
  errorMsg.value = null;
  deletingId.value = ob._id;
  try {
    await deleteOnboarding(ob._id);
    emit('refresh');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to delete onboarding plan.';
  } finally {
    deletingId.value = null;
  }
};
</script>
