<template>
  <div class="bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full shadow-2xl">
    <!-- Header -->
    <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 transition-colors">
      <div class="flex items-center gap-3">
        <button @click="$emit('close')" class="p-1 -ml-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-50 dark:bg-zinc-900 transition-colors text-zinc-500">
          <ArrowLeft class="w-4 h-4" />
        </button>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Employee Profile</h3>
      </div>
      <div class="flex items-center gap-2">
        <span :class="[
          employee.status === 'Active' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
          employee.status === 'Onboarding' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900' :
          'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
          'px-2.5 py-0.5 text-xs font-medium rounded border uppercase tracking-wider'
        ]">
          {{ employee.status }}
        </span>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-8">
      
      <!-- Basic Info Summary -->
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center text-lime-700 dark:text-lime-400 font-display font-bold text-2xl shrink-0">
          {{ employee.name.charAt(0) }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-50">{{ employee.name }}</h2>
          <p class="text-sm text-zinc-500 font-mono mt-1">{{ employee.email }}</p>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{{ employee.role }} &bull; {{ employee.departmentId?.name || employee.department || 'Unassigned' }}</p>
        </div>
      </div>

      <!-- Editable Sections -->
      <form @submit.prevent="saveChanges" class="space-y-8">
        <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
          {{ errorMsg }}
        </div>
        
        <div v-if="successMsg" class="p-3 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
          {{ successMsg }}
        </div>

        <div class="space-y-4">
          <h4 class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">Employment</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Email (Contact)</label>
              <input v-model="form.email" type="email" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Role / Job Title</label>
              <!-- HR only: editable -->
              <input v-if="!isEmployee" v-model="form.role" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
              <!-- Employee: read-only -->
              <p v-else class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-500 dark:text-zinc-400 font-mono cursor-not-allowed">{{ form.role || '—' }}</p>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Department</label>
              <!-- HR only: editable -->
              <select v-if="!isEmployee" v-model="form.departmentId" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition">
                <option value="" disabled>Select Department</option>
                <option v-for="dept in departments" :key="dept._id" :value="dept._id">{{ dept.name }}</option>
              </select>
              <!-- Employee: read-only -->
              <p v-else class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed">
                {{ employee.departmentId?.name || employee.department || '—' }}
              </p>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Monthly Salary (₦)</label>
              <!-- HR only: editable -->
              <input v-if="!isEmployee" v-model="form.salary" type="number" min="0" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
              <!-- Employee: read-only (shows their salary but can't change it) -->
              <p v-else class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-500 dark:text-zinc-400 font-mono cursor-not-allowed">
                {{ form.salary ? '₦' + Number(form.salary).toLocaleString() : '—' }}
              </p>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Status</label>
              <!-- HR only: editable -->
              <select v-if="!isEmployee" v-model="form.status" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition">
                <option value="Active">Active</option>
                <option value="Onboarding">Onboarding</option>
                <option value="Offboarded">Offboarded</option>
              </select>
              <!-- Employee: read-only -->
              <p v-else class="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed">{{ form.status || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- 1. Bio Data -->
        <div class="space-y-4">
          <h4 class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">Bio Data</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Gender</label>
              <select v-model="form.gender" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Marital Status</label>
              <select v-model="form.maritalStatus" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition">
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Phone</label>
              <input v-model="form.phone" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Nationality</label>
              <select v-model="form.nationality" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition">
                <option value="">Select Nationality</option>
                <option v-for="n in nationalityOptions" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. Address -->
        <div class="space-y-4">
          <h4 class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">Address</h4>
          <div class="space-y-3">
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Street</label>
              <input v-model="form.address.street" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-zinc-500">LGA</label>
                <input v-model="form.address.lga" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-zinc-500">State</label>
                <input v-model="form.address.state" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] uppercase tracking-wider text-zinc-500">Country</label>
                <input v-model="form.address.country" type="text" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition" />
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Regulatory IDs -->
        <div class="space-y-4">
          <h4 class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">Regulatory IDs</h4>
          <p class="text-[10px] text-zinc-500 -mt-1">Stored encrypted. Leave a field blank to keep the saved value — type a new one to replace it.</p>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">BVN</label>
              <input v-model="form.regulatory.bvn" type="text" :placeholder="employee.regulatory?.bvnMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">NIN</label>
              <input v-model="form.regulatory.nin" type="text" :placeholder="employee.regulatory?.ninMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">TIN</label>
              <input v-model="form.regulatory.tin" type="text" :placeholder="employee.regulatory?.tinMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">PFA Number</label>
              <input v-model="form.regulatory.pfa" type="text" :placeholder="employee.regulatory?.pfaMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">RSA/PIN (Pension)</label>
              <input v-model="form.regulatory.rsa" type="text" :placeholder="employee.regulatory?.rsaMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">NHF Number</label>
              <input v-model="form.regulatory.nhf" type="text" :placeholder="employee.regulatory?.nhfMasked || 'Not set'" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
          </div>
        </div>

      </form>

      <!-- 4. Bank Details / Payroll Disbursement -->
      <div class="space-y-4">
        <h4 class="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-800 pb-2">Bank Details</h4>

        <div v-if="employee.bankDetails?.verified" class="flex items-center gap-2 p-3 bg-lime-50 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-900 rounded text-xs">
          <BadgeCheck class="w-4 h-4 text-lime-600 dark:text-lime-400 shrink-0" />
          <div>
            <p class="text-lime-700 dark:text-lime-400 font-semibold">Verified for payroll payment</p>
            <p class="text-zinc-600 dark:text-zinc-400 mt-0.5">{{ employee.bankDetails.accountName }} &bull; {{ employee.bankDetails.bankName }} &bull; {{ employee.bankDetails.accountNumberMasked || '••••' }}</p>
          </div>
        </div>
        <div v-else class="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-600 dark:text-zinc-400">
          Not yet verified. Select a bank, enter the account number, and verify to enable payroll payouts to this account.
        </div>

        <!-- Paystack not connected — show a soft info note, not an error -->
        <div v-if="paystackNotConnected" class="p-2.5 bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded text-xs">
          Bank verification requires Paystack to be connected. An HR admin can enable this under <strong>Payment Settings</strong>.
        </div>

        <!-- Unexpected load error (network failure etc.) -->
        <div v-else-if="banksError" class="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded text-xs">
          {{ banksError }}
        </div>

        <!-- Bank entry form — only rendered when banks are available -->
        <template v-else>
          <div v-if="verifyError" class="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
            {{ verifyError }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Bank</label>
              <select
                v-model="bankForm.bankCode"
                :disabled="banksLoading || banks.length === 0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:border-lime-500 outline-none transition disabled:opacity-50"
              >
                <option value="" disabled>{{ banksLoading ? 'Loading banks…' : 'Select Bank' }}</option>
                <option v-for="bank in banks" :key="bank.code" :value="bank.code">{{ bank.name }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] uppercase tracking-wider text-zinc-500">Account Number</label>
              <input v-model="bankForm.accountNumber" type="text" maxlength="10" placeholder="0123456789" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:border-lime-500 outline-none transition" />
            </div>
          </div>

          <button
            type="button"
            @click="verifyAccount"
            :disabled="verifying || !bankForm.bankCode || !bankForm.accountNumber"
            class="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-4 py-2 rounded text-xs hover:opacity-90 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>{{ verifying ? 'Verifying…' : 'Verify Account' }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
      <button 
        type="button"
        @click="saveChanges"
        class="px-5 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition flex items-center gap-2"
        :disabled="isSaving"
      >
        <Save class="w-4 h-4" />
        <span v-if="isSaving">Saving...</span>
        <span v-else>Save Profile</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useApi } from '../composables/useApi';
import { ArrowLeft, Save, BadgeCheck, ShieldCheck } from 'lucide-vue-next';

const props = defineProps({
  employee: {
    type: Object,
    required: true
  },
  departments: {
    type: Array,
    default: () => []
  },
  authUser: {
    type: Object,
    default: null
  }
});

// Employees cannot edit HR-controlled fields (salary, role, department, status).
// The backend already enforces this, but we also lock the UI for clarity.
const isEmployee = computed(() => props.authUser?.role === 'Employee');

const emit = defineEmits(['close', 'updated']);
const { updateEmployee, getBanks, verifyBankAccount } = useApi();

const isSaving = ref(false);
const errorMsg = ref(null);
const successMsg = ref(null);

// ── Bank details / payroll payment verification ─────────────────────────────
const banks = ref([]);
const banksLoading = ref(false);
const banksError = ref(null);          // unexpected errors only
const paystackNotConnected = ref(false); // expected: Paystack not set up yet
const verifying = ref(false);
const verifyError = ref(null);
const bankForm = ref({ bankCode: '', accountNumber: '' });

// Known phrase from the backend when Paystack isn't configured for the tenant.
const PAYSTACK_NOT_CONNECTED_MSG = 'Paystack is not connected for this company yet';

const loadBanks = async () => {
  banksLoading.value = true;
  banksError.value = null;
  paystackNotConnected.value = false;
  try {
    banks.value = await getBanks();
  } catch (err) {
    const msg = err.response?.data?.message || err.message || '';
    if (msg.includes(PAYSTACK_NOT_CONNECTED_MSG)) {
      // Expected state — not an error, Paystack just hasn't been configured yet.
      paystackNotConnected.value = true;
    } else {
      // Genuine unexpected failure (network down, server error, etc.)
      banksError.value = msg || 'Could not load bank list. Please try again later.';
    }
  } finally {
    banksLoading.value = false;
  }
};

const verifyAccount = async () => {
  verifying.value = true;
  verifyError.value = null;
  try {
    const bankName = banks.value.find(b => b.code === bankForm.value.bankCode)?.name || '';
    const bankDetails = await verifyBankAccount(props.employee._id, {
      accountNumber: bankForm.value.accountNumber,
      bankCode: bankForm.value.bankCode,
      bankName,
    });
    emit('updated', { ...props.employee, bankDetails });
  } catch (err) {
    verifyError.value = err.response?.data?.message || err.message || 'Could not verify this account.';
  } finally {
    verifying.value = false;
  }
};

// Nigerian first since that's the overwhelming majority for this product's
// customer base, then other common nationalities for foreign hires. If a
// stored value doesn't match the list (older free-text data, or a less
// common nationality), it's appended below so editing never silently blanks
// it out.
const NATIONALITY_LIST = [
  'Nigerian', 'Ghanaian', 'Kenyan', 'South African', 'Beninese', 'Togolese',
  'Cameroonian', 'Senegalese', 'Ivorian', 'Egyptian', 'British', 'American',
  'Canadian', 'Indian', 'Chinese', 'Lebanese', 'Other',
];
const nationalityOptions = computed(() => {
  const current = form.value.nationality;
  if (current && !NATIONALITY_LIST.includes(current)) {
    return [current, ...NATIONALITY_LIST];
  }
  return NATIONALITY_LIST;
});

const form = ref({
  email: '',
  role: '',
  departmentId: '',
  salary: '',
  status: 'Active',
  gender: '',
  maritalStatus: '',
  phone: '',
  nationality: '',
  address: { street: '', lga: '', state: '', country: '' },
  regulatory: { bvn: '', nin: '', nhf: '', rsa: '', pfa: '', tin: '', lgaOfOrigin: '' }
});

const initForm = () => {
  const e = props.employee;
  form.value = {
    email: e.email || '',
    role: e.role || '',
    departmentId: e.departmentId?._id || e.departmentId || '',
    salary: e.salary ?? '',
    status: e.status || 'Active',
    gender: e.gender || '',
    maritalStatus: e.maritalStatus || '',
    phone: e.phone || '',
    nationality: e.nationality || '',
    address: {
      street: e.address?.street || '',
      lga: e.address?.lga || '',
      state: e.address?.state || '',
      country: e.address?.country || ''
    },
    // Regulatory IDs are encrypted at rest and never sent back to the
    // client in full — only a masked last-4 (employee.regulatory.*Masked),
    // shown as the input's placeholder below. These start blank: leaving
    // them blank on save means "keep what's already stored," typing a new
    // value means "replace it." Never pre-fill with the masked string —
    // submitting that back as-is would overwrite the real value with
    // literal bullet characters.
    regulatory: { bvn: '', nin: '', tin: '', pfa: '', rsa: '', nhf: '', lgaOfOrigin: e.regulatory?.lgaOfOrigin || '' }
  };
  // Removed errorMsg and successMsg clears so they don't disappear when props update

  // Same blank-means-unchanged treatment for the account number — the
  // verified banner above already shows the masked value.
  bankForm.value = {
    bankCode: e.bankDetails?.bankCode || '',
    accountNumber: '',
  };
};

watch(() => props.employee, initForm, { deep: true });
onMounted(() => { initForm(); loadBanks(); });

const saveChanges = async () => {
  isSaving.value = true;
  errorMsg.value = null;
  successMsg.value = null;
  
  try {
    const payload = JSON.parse(JSON.stringify(form.value));
    if (payload.gender === '') payload.gender = null;
    if (payload.maritalStatus === '') payload.maritalStatus = null;
    payload.salary = payload.salary === '' ? undefined : parseFloat(payload.salary);
    if (!payload.departmentId) delete payload.departmentId;

    const updated = await updateEmployee(props.employee._id, payload);
    successMsg.value = "Profile updated successfully!";
    emit('updated', updated);
    setTimeout(() => { successMsg.value = null; }, 3000);
  } catch (err) {
    errorMsg.value = err.response?.data?.message || err.message || 'Failed to update profile.';
  } finally {
    isSaving.value = false;
  }
};
</script>
