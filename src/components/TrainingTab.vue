<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Training & Development</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage training catalogs, employee enrollments, and compliance.</p>
      </div>
      <button 
        v-if="authUser?.role !== 'Employee'"
        @click="showCreateModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
      >
        <BookOpen class="w-4 h-4" />
        <span>Add Course</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="course in trainings" :key="course._id" class="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg transition group">
        <div class="p-5 flex-1 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex justify-between items-start mb-3">
            <span :class="[
              course.isMandatory ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400',
              'px-2 py-0.5 text-[10px] uppercase font-bold rounded tracking-wider'
            ]">{{ course.isMandatory ? 'Mandatory' : 'Optional' }}</span>
            <span class="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 rounded-full border border-zinc-200 dark:border-zinc-800 font-mono">{{ course.type }}</span>
          </div>

          <h4 class="text-lg font-bold font-display text-zinc-900 dark:text-zinc-50 leading-tight mb-2">{{ course.title }}</h4>
          
          <div class="flex flex-wrap gap-3 text-xs text-zinc-500 mb-4 font-mono">
            <span v-if="course.provider" class="flex items-center gap-1"><GraduationCap class="w-3.5 h-3.5" /> {{ course.provider }}</span>
            <span v-if="course.durationHours" class="flex items-center gap-1"><Clock class="w-3.5 h-3.5" /> {{ course.durationHours }}h</span>
            <span v-if="course.cost?.amount" class="flex items-center gap-1"><Wallet class="w-3.5 h-3.5" /> {{ course.cost.currency }} {{ course.cost.amount.toLocaleString() }}</span>
          </div>

          <p class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
            {{ course.description }}
          </p>
        </div>
        
        <div class="p-4 bg-zinc-50 dark:bg-zinc-900/40 space-y-3">
          <div class="flex justify-between items-center text-xs">
            <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ course.enrollments.length }} Enrolled</span>
            <button v-if="authUser?.role !== 'Employee'" @click="openEnrollModal(course)" class="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Manage &rarr;</button>
          </div>
          
          <!-- Quick progress preview -->
          <div class="flex gap-1" v-if="course.enrollments.length > 0">
            <div 
              v-for="e in course.enrollments.slice(0, 10)" 
              :key="e._id"
              class="w-2 h-2 rounded-full"
              :class="[
                e.status === 'Completed' ? 'bg-lime-500' :
                e.status === 'In Progress' ? 'bg-blue-500' :
                e.status === 'Failed' ? 'bg-red-500' :
                'bg-zinc-300 dark:bg-zinc-700'
              ]"
              :title="e.status"
            ></div>
            <span v-if="course.enrollments.length > 10" class="text-[9px] text-zinc-400 ml-1">+{{ course.enrollments.length - 10 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Course Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 class="font-display font-bold text-sm">Add Training Course</h3>
          <button @click="showCreateModal = false" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"><X class="w-4 h-4"/></button>
        </div>
        <form @submit.prevent="submitCourse" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Title</label>
            <input v-model="form.title" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Description</label>
            <textarea v-model="form.description" rows="2" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Type</label>
              <select v-model="form.type" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none">
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Provider</label>
              <input v-model="form.provider" placeholder="e.g. Coursera, Udemy" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Duration (Hours)</label>
              <input type="number" v-model="form.durationHours" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Cost (Amount)</label>
              <input type="number" v-model="form.cost.amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
          </div>

          <div class="flex items-center gap-2 mt-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <input type="checkbox" id="mandatory" v-model="form.isMandatory" class="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
            <label for="mandatory" class="text-sm font-semibold text-red-800 dark:text-red-400">This is a mandatory compliance course</label>
          </div>

          <button type="submit" class="w-full py-2 bg-indigo-600 text-white font-semibold rounded text-sm transition mt-4">Add Course</button>
        </form>
      </div>
    </div>

    <!-- Enrollments Management Modal -->
    <div v-if="enrollModalOpen" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="enrollModalOpen = false">
      <div class="w-full max-w-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden h-[80vh]">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900">
          <div>
            <h3 class="font-display font-bold text-sm">{{ selectedCourse?.title }}</h3>
            <p class="text-xs text-zinc-500 font-mono">Enrollment Management</p>
          </div>
          <button @click="enrollModalOpen = false" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"><X class="w-4 h-4"/></button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <!-- Add New Enrollment -->
          <div class="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 p-4 rounded-lg flex gap-4 items-end">
            <div class="flex-1 space-y-1">
              <label class="block text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">Enroll Employee</label>
              <select v-model="enrollEmployeeId" class="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-indigo-200 dark:border-indigo-800 rounded text-sm outline-none">
                <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.firstName }} {{ emp.lastName }} ({{ emp.department }})</option>
              </select>
            </div>
            <button @click="submitEnrollment" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded text-sm transition h-[38px]">
              Enroll
            </button>
          </div>

          <!-- Existing Enrollments -->
          <div>
            <h4 class="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Enrolled Employees ({{ selectedCourse?.enrollments?.length || 0 }})</h4>
            <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table class="w-full text-left text-sm">
                <thead class="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                  <tr class="text-[10px] font-mono text-zinc-500 uppercase">
                    <th class="py-2 px-4">Employee</th>
                    <th class="py-2 px-4">Status</th>
                    <th class="py-2 px-4">Progress</th>
                    <th class="py-2 px-4 text-right">Update</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
                  <tr v-for="enr in selectedCourse?.enrollments" :key="enr._id" class="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td class="py-3 px-4">
                      <div class="font-semibold text-zinc-800 dark:text-zinc-200">{{ enr.employeeId?.firstName }} {{ enr.employeeId?.lastName }}</div>
                      <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ enr.employeeId?.department }}</div>
                    </td>
                    <td class="py-3 px-4">
                      <select 
                        v-model="enr.status" 
                        @change="updateStatus(enr)"
                        class="px-2 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs outline-none"
                      >
                        <option value="Enrolled">Enrolled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                      </select>
                    </td>
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-2">
                        <input type="range" v-model.number="enr.progressPercentage" @change="updateStatus(enr)" min="0" max="100" class="w-24 accent-indigo-600" />
                        <span class="text-[10px] font-mono text-zinc-500">{{ enr.progressPercentage }}%</span>
                      </div>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <span v-if="enr.status === 'Completed'" class="text-[10px] text-lime-600 bg-lime-100 dark:bg-lime-900/30 dark:text-lime-400 px-2 py-1 rounded">
                        Done ({{ new Date(enr.completionDate).toLocaleDateString() }})
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!selectedCourse?.enrollments?.length">
                    <td colspan="4" class="text-center py-6 text-xs text-zinc-500">No enrollments yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi';
import { BookOpen, Clock, GraduationCap, Wallet, X } from 'lucide-vue-next';

const props = defineProps({
  trainings: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  },
  authUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['refresh']);
const { createTrainingCourse, enrollEmployee, updateEnrollmentStatus } = useApi();

const showCreateModal = ref(false);
const enrollModalOpen = ref(false);
const selectedCourse = ref(null);

const form = ref({
  title: '',
  description: '',
  type: 'Internal',
  isMandatory: false,
  provider: '',
  durationHours: 1,
  cost: { amount: 0, currency: 'NGN' }
});

const enrollEmployeeId = ref('');

const submitCourse = async () => {
  try {
    await createTrainingCourse(form.value);
    emit('refresh');
    showCreateModal.value = false;
    form.value = { title: '', description: '', type: 'Internal', isMandatory: false, provider: '', durationHours: 1, cost: { amount: 0, currency: 'NGN' } };
  } catch (e) { alert(e.message); }
};

const openEnrollModal = (course) => {
  selectedCourse.value = course;
  enrollEmployeeId.value = props.employees[0]?._id || '';
  enrollModalOpen.value = true;
};

const submitEnrollment = async () => {
  if (!enrollEmployeeId.value) return;
  try {
    await enrollEmployee(selectedCourse.value._id, { employeeId: enrollEmployeeId.value, status: 'Enrolled' });
    emit('refresh');
    
    // Optimistically update local state for fast UI (or wait for refresh to propagate)
    const newEnrollment = {
      _id: Math.random().toString(),
      employeeId: props.employees.find(e => e._id === enrollEmployeeId.value),
      status: 'Enrolled',
      progressPercentage: 0
    };
    selectedCourse.value.enrollments.push(newEnrollment);
    
  } catch (e) { alert(e.response?.data?.message || e.message); }
};

const updateStatus = async (enr) => {
  try {
    if (enr.progressPercentage === 100 && enr.status !== 'Completed') enr.status = 'Completed';
    await updateEnrollmentStatus(selectedCourse.value._id, enr._id, {
      status: enr.status,
      progressPercentage: enr.progressPercentage
    });
    // emit('refresh') can be called if we want full sync, but local binding works for sliders
  } catch (e) { alert(e.message); }
};
</script>
