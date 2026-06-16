<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Internal Job Board</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Explore open roles, apply internally, or refer external candidates.</p>
      </div>
      <button 
        v-if="authUser?.role !== 'Employee'"
        @click="showCreateModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-indigo-700 active:scale-[0.98] transition cursor-pointer"
      >
        <Plus class="w-4 h-4" />
        <span>Post Internal Job</span>
      </button>
    </div>

    <!-- Job Cards Grid -->
    <div v-if="internalJobs.length === 0" class="text-center py-12 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20">
      <Briefcase class="w-8 h-8 text-zinc-400 mx-auto mb-3" />
      <h4 class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No open positions</h4>
      <p class="text-xs text-zinc-500 mt-1">There are currently no internal jobs posted.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="job in internalJobs" :key="job._id" class="flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg transition group">
        <div class="p-5 flex-1">
          <div class="flex justify-between items-start mb-3">
            <span :class="[
              job.status === 'Open' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400' :
              job.status === 'Closed' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' :
              'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400',
              'px-2 py-0.5 text-[10px] uppercase font-bold rounded tracking-wider'
            ]">{{ job.status }}</span>
            <span class="text-[10px] text-zinc-400 font-mono">{{ formatDate(job.createdAt) }}</span>
          </div>

          <h4 class="text-lg font-bold font-display text-zinc-900 dark:text-zinc-50 leading-tight mb-1">{{ job.title }}</h4>
          <div class="flex items-center gap-3 text-xs text-zinc-500 mb-4 font-mono">
            <span class="flex items-center gap-1"><Building class="w-3.5 h-3.5" /> {{ job.department }}</span>
            <span class="flex items-center gap-1"><MapPin class="w-3.5 h-3.5" /> {{ job.location || 'Remote' }}</span>
          </div>

          <p class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
            {{ job.description }}
          </p>

          <div v-if="job.referralBonus?.amount" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 rounded-md text-[11px] font-semibold">
            <Gift class="w-3.5 h-3.5" />
            <span>Referral Bonus: {{ job.referralBonus.currency }} {{ job.referralBonus.amount.toLocaleString() }}</span>
          </div>
        </div>
        
        <div class="p-4 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
           <button @click="openApplyModal(job)" :disabled="job.status !== 'Open'" class="flex-1 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed">
            Apply Now
          </button>
          <button @click="openReferModal(job)" :disabled="job.status !== 'Open'" class="flex-1 py-2 bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed">
            Refer Someone
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->

    <!-- Create Post Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h3 class="font-display font-bold text-sm">Post Internal Job</h3>
          <button @click="showCreateModal = false" class="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"><X class="w-4 h-4"/></button>
        </div>
        <form @submit.prevent="submitJob" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Title</label>
            <input v-model="form.title" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Department</label>
              <input v-model="form.department" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Location</label>
              <input v-model="form.location" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Description</label>
            <textarea v-model="form.description" rows="3" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Referral Bonus (Amount)</label>
              <input type="number" v-model="form.referralBonus.amount" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Closing Date</label>
              <input type="date" v-model="form.closingDate" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
            </div>
          </div>
          <button type="submit" class="w-full py-2 bg-indigo-600 text-white font-semibold rounded text-sm transition">Post Job</button>
        </form>
      </div>
    </div>

    <!-- Apply Modal -->
    <div v-if="applyModalOpen" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="applyModalOpen = false">
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 class="font-display font-bold text-lg mb-2">Apply Internally</h3>
        <p class="text-sm text-zinc-500 mb-6">Are you sure you want to apply for <strong>{{ selectedJob?.title }}</strong>? Your profile will be shared with HR.</p>
        
        <div v-if="authUser?.role !== 'Employee'" class="space-y-1 mb-6">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Select Your Profile (Demo Only)</label>
          <select v-model="applyEmployeeId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none">
            <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.firstName }} {{ emp.lastName }}</option>
          </select>
        </div>

        <div class="flex gap-3">
          <button @click="applyModalOpen = false" class="flex-1 py-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded font-semibold text-sm">Cancel</button>
          <button @click="submitApplication" class="flex-1 py-2 bg-indigo-600 text-white rounded font-semibold text-sm">Submit Application</button>
        </div>
      </div>
    </div>

    <!-- Refer Modal -->
    <div v-if="referModalOpen" class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" @click.self="referModalOpen = false">
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <h3 class="font-display font-bold text-lg mb-2">Refer a Candidate</h3>
        <p class="text-sm text-zinc-500 mb-6">Refer someone for <strong>{{ selectedJob?.title }}</strong> to earn a bonus of {{ selectedJob?.referralBonus?.currency }} {{ selectedJob?.referralBonus?.amount }}.</p>
        
        <form @submit.prevent="submitReferral" class="space-y-4">
          <div v-if="authUser?.role !== 'Employee'" class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Your Profile (Referrer)</label>
            <select v-model="referForm.referrerId" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none">
              <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.firstName }} {{ emp.lastName }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Candidate Name</label>
            <input v-model="referForm.candidateName" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase">Candidate Email</label>
            <input type="email" v-model="referForm.candidateEmail" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm outline-none" />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="referModalOpen = false" class="flex-1 py-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded font-semibold text-sm">Cancel</button>
            <button type="submit" class="flex-1 py-2 bg-indigo-600 text-white rounded font-semibold text-sm">Submit Referral</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useApi } from '../composables/useApi';
import { Briefcase, Building, MapPin, Gift, Plus, X } from 'lucide-vue-next';

const props = defineProps({
  internalJobs: {
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

const { createInternalJob, applyForJob, referCandidate } = useApi();

const showCreateModal = ref(false);
const applyModalOpen = ref(false);
const referModalOpen = ref(false);
const selectedJob = ref(null);

const form = ref({
  title: '',
  department: '',
  location: '',
  description: '',
  closingDate: '',
  referralBonus: { amount: 0, currency: 'NGN' }
});

const applyEmployeeId = ref('');
const referForm = ref({
  referrerId: '',
  candidateName: '',
  candidateEmail: ''
});

const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const submitJob = async () => {
  try {
    await createInternalJob(form.value);
    emit('refresh');
    showCreateModal.value = false;
    form.value = { title: '', department: '', location: '', description: '', closingDate: '', referralBonus: { amount: 0, currency: 'NGN' } };
  } catch (e) { alert(e.message); }
};

const openApplyModal = (job) => {
  selectedJob.value = job;
  applyEmployeeId.value = props.authUser?.role === 'Employee' ? props.authUser._id : (props.employees[0]?._id || '');
  applyModalOpen.value = true;
};

const submitApplication = async () => {
  if (!applyEmployeeId.value) return alert('Select an employee');
  try {
    await applyForJob(selectedJob.value._id, { employeeId: applyEmployeeId.value });
    alert('Applied successfully!');
    emit('refresh');
    applyModalOpen.value = false;
  } catch (e) { alert(e.response?.data?.message || e.message); }
};

const openReferModal = (job) => {
  selectedJob.value = job;
  referForm.value = { referrerId: props.authUser?.role === 'Employee' ? props.authUser._id : (props.employees[0]?._id || ''), candidateName: '', candidateEmail: '' };
  referModalOpen.value = true;
};

const submitReferral = async () => {
  try {
    await referCandidate(selectedJob.value._id, referForm.value);
    alert('Referral submitted successfully!');
    emit('refresh');
    referModalOpen.value = false;
  } catch (e) { alert(e.response?.data?.message || e.message); }
};
</script>
