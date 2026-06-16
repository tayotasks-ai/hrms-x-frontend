<template>
  <div class="space-y-6">
    <!-- Inner Tabs -->
    <div class="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
      <button 
        @click="activeInnerTab = 'organogram'"
        :class="['text-sm font-semibold px-4 py-2 transition border-b-2 -mb-[9px]', activeInnerTab === 'organogram' ? 'border-lime-500 text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']"
      >
        Organogram
      </button>
      <button 
        @click="activeInnerTab = 'kpis'"
        :class="['text-sm font-semibold px-4 py-2 transition border-b-2 -mb-[9px]', activeInnerTab === 'kpis' ? 'border-lime-500 text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']"
      >
        KPIs & Performance
      </button>
      <button 
        v-if="authUser?.role !== 'Employee'"
        @click="activeInnerTab = 'cycles'"
        :class="['text-sm font-semibold px-4 py-2 transition border-b-2 -mb-[9px]', activeInnerTab === 'cycles' ? 'border-lime-500 text-zinc-900 dark:text-zinc-50' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300']"
      >
        Review Cycles
      </button>
    </div>

    <!-- Organogram Tab -->
    <div v-if="activeInnerTab === 'organogram'" class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Organogram</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Corporate reporting lines and hierarchies.</p>
        </div>
        <Network class="w-4 h-4 text-zinc-500" />
      </div>

      <!-- Nested Hierarchy List -->
      <div 
        class="flex-1 space-y-6 overflow-y-auto max-h-[700px] pr-2 p-2"
        @dragover.prevent="authUser?.role !== 'Employee' ? onDragOverRoot($event) : null"
        @dragleave="authUser?.role !== 'Employee' ? onDragLeaveRoot($event) : null"
        @drop.prevent="authUser?.role !== 'Employee' ? onDropRoot($event) : null"
        :class="{'bg-lime-50 dark:bg-lime-900/10 border-2 border-dashed border-lime-500 rounded': isDragOverRoot}"
      >
        <div v-if="orgTree.length === 0" class="text-center py-12 text-zinc-500">
          <Users class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
          <p class="text-xs">No employees found to generate structure.</p>
        </div>
        <div v-if="orgTree.length > 0 && isDragOverRoot" class="text-center p-4 bg-zinc-100 dark:bg-zinc-900 mb-4 rounded text-xs font-mono text-zinc-500 border border-zinc-200 dark:border-zinc-800">
          Drop here to make Top Level (No Manager)
        </div>

        <!-- Render recursively using local tree nodes -->
        <OrgEmployeeNode 
          v-for="node in orgTree" 
          :key="node._id" 
          :employee="node"
          :allEmployees="employees"
          :authUser="authUser"
          @changeManager="handleManagerChange"
        />
      </div>
    </div>

    <!-- KPIs Tab -->
    <div v-if="activeInnerTab === 'kpis'" class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Key Performance Indicators</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Track employee performance goals and review cycles.</p>
        </div>
        <button 
          v-if="canAssignKpi"
          @click="showKpiModal = true"
          class="flex items-center gap-1 bg-lime-500 text-black font-semibold px-3 py-1.5 rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Assign Target</span>
        </button>
      </div>

      <div v-if="!openCycle && authUser?.role === 'Employee'" class="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p class="text-sm text-amber-800 dark:text-amber-400 font-medium">KPI assignment is currently locked.</p>
        <p class="text-xs text-amber-700 dark:text-amber-500 mt-1">Waiting for HR to open a Performance Review Cycle.</p>
      </div>

      <!-- KPI List Table -->
      <div class="flex-1 overflow-y-auto max-h-[700px] pr-2">
        <div v-if="kpis.length === 0" class="text-center py-12 text-zinc-500">
          <Target class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
          <p class="text-xs">No KPI targets assigned.</p>
        </div>

        <div class="space-y-4" v-else>
          <div 
            v-for="kpi in kpis" 
            :key="kpi._id"
            class="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-3 hover:border-zinc-200 dark:border-zinc-800 transition"
          >
            <div class="flex justify-between items-start gap-4">
              <div>
                <h4 class="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{{ kpi.title }}</h4>
                <p class="text-xs text-zinc-500 mt-0.5">{{ kpi.description }}</p>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                    {{ kpi.employeeId?.name || 'Deleted Employee' }} ({{ kpi.employeeId?.role }})
                  </span>
                  <span class="text-[10px] font-mono text-zinc-500 bg-zinc-50 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                    {{ kpi.cycleId?.name || 'Legacy KPI' }}
                  </span>
                </div>
              </div>
              <span :class="[
                kpi.status === 'Achieved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' :
                kpi.status === 'Missed' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900' :
                'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-900',
                'px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded'
              ]">
                {{ kpi.status }}
              </span>
            </div>

            <!-- Progress Bar calculation -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-mono">
                <span class="text-zinc-500">Target Progress</span>
                <span class="text-zinc-700 dark:text-zinc-300 font-bold">{{ kpi.currentValue }} / {{ kpi.targetValue }} ({{ calculatePercentage(kpi.currentValue, kpi.targetValue) }}%)</span>
              </div>
              <div class="w-full h-1.5 bg-zinc-50 dark:bg-zinc-900 rounded overflow-hidden">
                <div 
                  :class="[
                    kpi.status === 'Achieved' ? 'bg-emerald-500' :
                    kpi.status === 'Missed' ? 'bg-red-500' : 'bg-lime-500',
                    'h-full rounded transition-all duration-300'
                  ]"
                  :style="{ width: `${calculatePercentage(kpi.currentValue, kpi.targetValue)}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Review Cycles Tab -->
    <div v-if="activeInnerTab === 'cycles'" class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg p-6 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition">
      <div class="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Performance Review Cycles</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Create and open periods for managers to assign and review KPIs.</p>
        </div>
        <button 
          @click="showCycleModal = true"
          class="flex items-center gap-1 bg-lime-500 text-black font-semibold px-3 py-1.5 rounded text-xs hover:bg-lime-600 dark:bg-lime-400 transition cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>New Cycle</span>
        </button>
      </div>

      <!-- Cycles List -->
      <div class="flex-1 overflow-y-auto max-h-[700px] pr-2">
        <div v-if="performanceCycles.length === 0" class="text-center py-12 text-zinc-500">
          <Target class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
          <p class="text-xs">No Performance Cycles exist.</p>
        </div>

        <div class="space-y-4" v-else>
          <div 
            v-for="cycle in performanceCycles" 
            :key="cycle._id"
            class="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-900 rounded-lg flex items-center justify-between hover:border-zinc-200 dark:border-zinc-800 transition"
          >
            <div>
              <h4 class="font-semibold text-sm text-zinc-800 dark:text-zinc-200">{{ cycle.name }}</h4>
              <p class="text-xs text-zinc-500 mt-0.5">{{ formatDate(cycle.startDate) }} &mdash; {{ formatDate(cycle.endDate) }}</p>
            </div>
            <div class="flex items-center gap-4">
              <span :class="[
                cycle.status === 'Open' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' :
                cycle.status === 'Closed' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900' :
                'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
                'px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded'
              ]">
                {{ cycle.status }}
              </span>
              <button 
                @click="toggleCycleStatus(cycle)"
                class="text-xs font-semibold px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
              >
                Toggle Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assign KPI Modal -->
    <div 
      v-if="showKpiModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Target class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Assign Performance KPI</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <!-- Employee Select -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
            <select 
              v-model="form.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Staff Member</option>
              <option 
                v-for="emp in kpiTargetEmployees" 
                :key="emp._id" 
                :value="emp._id"
              >
                {{ emp.name }} ({{ emp.role }})
              </option>
            </select>
          </div>

          <!-- Title -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Objective Title</label>
            <input 
              v-model="form.title"
              type="text" 
              required
              placeholder="e.g. Optimize Site Speed"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Target Details</label>
            <textarea 
              v-model="form.description"
              rows="3"
              placeholder="Provide specific metrics and criteria..."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-lime-500 transition"
            ></textarea>
          </div>

          <!-- Target & Current Values -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Target Metric Value</label>
              <input 
                v-model="form.targetValue"
                type="number"
                required
                min="1"
                placeholder="100"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Starting Value</label>
              <input 
                v-model="form.currentValue"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>

          <!-- Cycle & Status -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Review Cycle</label>
              <select 
                v-model="form.cycleId"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
              >
                <option value="" disabled>Select Cycle</option>
                <option 
                  v-for="cycle in performanceCycles" 
                  :key="cycle._id" 
                  :value="cycle._id"
                  :disabled="cycle.status !== 'Open'"
                >
                  {{ cycle.name }} ({{ cycle.status }})
                </option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Goal Status</label>
              <select 
                v-model="form.status"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
              >
                <option value="Active">Active</option>
                <option value="Achieved">Achieved</option>
                <option value="Missed">Missed</option>
              </select>
            </div>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="handleSubmit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else>Assign KPI</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Cycle Modal -->
    <div 
      v-if="showCycleModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Target class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Create Review Cycle</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <form @submit.prevent="handleCycleSubmit" class="p-6 space-y-4">
          <div v-if="formError" class="p-3 bg-red-950/60 border border-red-900 text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Cycle Name</label>
            <input 
              v-model="cycleForm.name"
              type="text" 
              required
              placeholder="e.g. 2026 Annual Review"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Start Date</label>
              <input 
                v-model="cycleForm.startDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">End Date</label>
              <input 
                v-model="cycleForm.endDate"
                type="date"
                required
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Status</label>
            <select 
              v-model="cycleForm.status"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="Draft">Draft</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeModal" 
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:bg-zinc-850 transition"
            :disabled="submitting"
          >
            Cancel
          </button>
          <button 
            type="button"
            @click="handleCycleSubmit"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
            :disabled="submitting"
          >
            <span v-if="submitting">Processing...</span>
            <span v-else>Create Cycle</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useApi } from '../composables/useApi';
import { Network, Users, Plus, Target, X } from 'lucide-vue-next';
import OrgEmployeeNode from './OrgEmployeeNode.vue';

const props = defineProps({
  employees: { type: Array, required: true },
  kpis: { type: Array, required: true },
  performanceCycles: { type: Array, required: true },
  departments: { type: Array, required: true },
  authUser: { type: Object, required: true },
  tenant: { type: Object, required: true }
});

const emit = defineEmits(['refresh']);

const { updateEmployeeManager, createKpi, createPerformanceCycle, updatePerformanceCycle } = useApi();

const activeInnerTab = ref('organogram');
const isDragOverRoot = ref(false);

const showKpiModal = ref(false);
const submitting = ref(false);
const formError = ref(null);

const initialForm = {
  employeeId: '',
  cycleId: '',
  title: '',
  description: '',
  targetValue: '',
  currentValue: 0,
  status: 'Active'
};
const form = ref({ ...initialForm });

const showCycleModal = ref(false);
const cycleForm = ref({
  name: '',
  startDate: '',
  endDate: '',
  status: 'Draft'
});

const openCycle = computed(() => {
  return props.performanceCycles.find(c => c.status === 'Open');
});

const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

const kpiTargetEmployees = computed(() => {
  if (props.authUser?.role !== 'Employee') return activeEmployeesOnly.value;

  return activeEmployeesOnly.value.filter(emp => {
    if (String(emp._id) === String(props.authUser._id)) return true;
    if (!emp.managerId) return false;
    const managerIdString = typeof emp.managerId === 'object' ? String(emp.managerId._id) : String(emp.managerId);
    return managerIdString === String(props.authUser._id);
  });
});

const canAssignKpi = computed(() => {
  if (!openCycle.value) return false; // Must have an open cycle
  if (!props.authUser || (props.authUser.role && props.authUser.role !== 'Employee')) return true;
  return kpiTargetEmployees.value.length > 1; 
});

const orgTree = computed(() => {
  return props.employees.filter(emp => {
    if (emp.status === 'Offboarded') return false;
    if (!emp.managerId) return true; // Truly no manager
    const managerIdString = typeof emp.managerId === 'object' ? String(emp.managerId._id) : String(emp.managerId);
    const managerExists = props.employees.some(e => String(e._id) === managerIdString);
    return !managerExists;
  });
});

const onDragOverRoot = (e) => {
  isDragOverRoot.value = true;
  e.dataTransfer.dropEffect = 'move';
};

const onDragLeaveRoot = () => {
  isDragOverRoot.value = false;
};

const onDropRoot = (e) => {
  isDragOverRoot.value = false;
  const draggedEmployeeId = e.dataTransfer.getData('text/plain');
  if (draggedEmployeeId) {
    handleManagerChange({ employeeId: draggedEmployeeId, newManagerId: null });
  }
};

const handleManagerChange = async ({ employeeId, newManagerId }) => {
  try {
    await updateEmployeeManager(employeeId, newManagerId);
    emit('refresh'); // Refresh the employee list
  } catch (err) {
    alert(err.response?.data?.message || err.message || 'Failed to update manager.');
  }
};

const closeModal = () => {
  showKpiModal.value = false;
  showCycleModal.value = false;
  form.value = { ...initialForm };
  cycleForm.value = { name: '', startDate: '', endDate: '', status: 'Draft' };
  formError.value = null;
};

const calculatePercentage = (current, target) => {
  if (!target) return 0;
  const pct = Math.round((current / target) * 100);
  return Math.min(100, Math.max(0, pct)); // clamp between 0 and 100
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.title || !form.value.targetValue || !form.value.cycleId) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await createKpi({
      employeeId: form.value.employeeId,
      cycleId: form.value.cycleId,
      title: form.value.title,
      description: form.value.description,
      targetValue: parseFloat(form.value.targetValue),
      currentValue: form.value.currentValue ? parseFloat(form.value.currentValue) : 0,
      status: form.value.status
    });
    
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to assign KPI.';
  } finally {
    submitting.value = false;
  }
};

const handleCycleSubmit = async () => {
  if (!cycleForm.value.name || !cycleForm.value.startDate || !cycleForm.value.endDate) {
    formError.value = 'Please complete all required fields.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await createPerformanceCycle({
      name: cycleForm.value.name,
      startDate: cycleForm.value.startDate,
      endDate: cycleForm.value.endDate,
      status: cycleForm.value.status
    });
    
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to create Performance Cycle.';
  } finally {
    submitting.value = false;
  }
};

const toggleCycleStatus = async (cycle) => {
  try {
    const newStatus = cycle.status === 'Open' ? 'Closed' : 'Open';
    await updatePerformanceCycle(cycle._id, { status: newStatus });
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || err.message || 'Failed to update cycle status.');
  }
};
</script>
