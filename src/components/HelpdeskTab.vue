<template>
  <div class="space-y-6">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">HR Helpdesk</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Manage employee inquiries, queries, and HR support requests.</p>
      </div>
      <button 
        @click="showModal = true"
        class="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-500 text-white font-semibold px-4 py-2 rounded text-sm hover:bg-indigo-600 active:scale-[0.98] transition cursor-pointer"
      >
        <LifeBuoy class="w-4 h-4" />
        <span>New Ticket</span>
      </button>
    </div>

    <!-- Tickets Table -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th class="py-3 px-6">Ticket</th>
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Category & Priority</th>
              <th class="py-3 px-6">Status / Assignee</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="tickets.length === 0" class="text-center text-zinc-500">
              <td colspan="5" class="py-12">
                <LifeBuoy class="w-8 h-8 text-zinc-800 mx-auto mb-2 opacity-50" />
                <p class="text-xs">No active tickets.</p>
              </td>
            </tr>

            <template v-for="t in tickets" :key="t._id">
              <tr class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors cursor-pointer" @click="toggleRow(t._id)">
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    {{ t.ticketId }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[200px]">
                    {{ t.subject }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t.employeeId?.name || 'Unknown Employee' }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {{ t.employeeId?.department }}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span class="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded inline-block mb-1">
                    {{ t.category }}
                  </span>
                  <div class="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
                    Priority: <span :class="priorityColor(t.priority)">{{ t.priority }}</span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-xs font-mono font-semibold flex items-center gap-1" :class="statusColor(t.status)">
                    {{ t.status }}
                  </div>
                  <div class="text-[10px] text-zinc-500 font-mono mt-1">
                    Assignee: {{ t.assignedTo?.name || 'Unassigned' }}
                  </div>
                </td>
                <td class="py-4 px-6 text-right">
                  <ChevronDown class="w-4 h-4 text-zinc-400 inline-block transition-transform duration-200" :class="expandedRow === t._id ? 'rotate-180' : ''" />
                </td>
              </tr>
              
              <!-- Expanded Ticket View -->
              <tr v-if="expandedRow === t._id" class="bg-zinc-50/50 dark:bg-zinc-900/20">
                <td colspan="5" class="p-0">
                  <div class="p-6 border-b border-zinc-200 dark:border-zinc-800/50 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Left Col: Description & Actions -->
                    <div class="lg:col-span-1 space-y-4">
                      <div>
                        <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Description</h4>
                        <p class="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{{ t.description }}</p>
                      </div>
                      
                      <div class="text-[9px] font-mono text-zinc-400">
                        <p>Created: {{ new Date(t.createdAt).toLocaleString() }}</p>
                        <p v-if="t.slaDeadline">SLA Deadline: {{ new Date(t.slaDeadline).toLocaleString() }}</p>
                      </div>

                      <div v-if="authUser?.role !== 'Employee'" class="space-y-3 bg-white dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                         <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-900 pb-1">Manage Ticket</h4>
                         <div class="space-y-2">
                           <div>
                             <label class="block text-[9px] font-mono text-zinc-500 uppercase">Status</label>
                             <select v-model="editForms[t._id].status" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 outline-none">
                               <option value="Open">Open</option>
                               <option value="In Progress">In Progress</option>
                               <option value="Waiting on Employee">Waiting on Employee</option>
                               <option value="Resolved">Resolved</option>
                               <option value="Closed">Closed</option>
                             </select>
                           </div>
                           <div>
                             <label class="block text-[9px] font-mono text-zinc-500 uppercase">Assign To</label>
                             <select v-model="editForms[t._id].assignedTo" class="w-full px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 outline-none">
                               <option value="">Unassigned</option>
                               <option v-for="emp in hrEmployees" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
                             </select>
                           </div>
                           <button @click="saveTicket(t._id)" class="w-full px-2 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">Update Ticket</button>
                         </div>
                      </div>
                    </div>

                    <!-- Right Col: Conversation -->
                    <div class="lg:col-span-2 flex flex-col h-[400px] bg-white dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                      <div class="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                        <h4 class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Conversation</h4>
                      </div>
                      
                      <!-- Messages Area -->
                      <div class="flex-1 overflow-y-auto p-4 space-y-4">
                        <div v-if="!t.messages || t.messages.length === 0" class="text-center text-xs text-zinc-400 mt-10">
                          No messages yet.
                        </div>
                        <div v-for="msg in t.messages" :key="msg._id" class="flex flex-col" :class="msg.sender?._id === activeUserId ? 'items-end' : 'items-start'">
                          <div class="max-w-[80%] rounded-lg px-3 py-2 text-xs" :class="msg.sender?._id === activeUserId ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'">
                            {{ msg.message }}
                          </div>
                          <span class="text-[9px] text-zinc-400 mt-1">{{ msg.sender?.name || 'User' }} • {{ new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                        </div>
                      </div>

                      <!-- Input Area -->
                      <div class="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 flex gap-2">
                        <input 
                          v-model="replyForms[t._id]" 
                          @keyup.enter="sendReply(t._id)"
                          placeholder="Type a reply..." 
                          class="flex-1 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 transition"
                        />
                        <button @click="sendReply(t._id)" class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition flex items-center justify-center">
                          <Send class="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- New Ticket Modal -->
    <div 
      v-if="showModal" 
      class="fixed inset-0 bg-white dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <LifeBuoy class="w-4 h-4 text-indigo-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Create Support Ticket</h3>
          </div>
          <button @click="closeModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div v-if="formError" class="p-3 bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded text-xs font-mono">
            {{ formError }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div v-if="authUser?.role !== 'Employee'" class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Employee</label>
              <select v-model="form.employeeId" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
                <option value="" disabled>Select Employee</option>
                <option v-for="emp in employees" :key="emp._id" :value="emp._id">{{ emp.name }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Category</label>
              <select v-model="form.category" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
                <option value="Payroll">Payroll</option>
                <option value="Benefits">Benefits</option>
                <option value="Recruitment">Recruitment</option>
                <option value="Policy">Policy</option>
                <option value="General HR">General HR</option>
                <option value="IT Support">IT Support</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
             <div class="space-y-1 col-span-2 md:col-span-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Priority</label>
              <select v-model="form.priority" required class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Subject</label>
            <input v-model="form.subject" required placeholder="Brief summary" class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none" />
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Description</label>
            <textarea v-model="form.description" rows="4" required placeholder="Provide details..." class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm focus:border-indigo-500 outline-none"></textarea>
          </div>
        </form>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button type="button" @click="closeModal" class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">Cancel</button>
          <button @click="handleSubmit" class="px-4 py-2 bg-indigo-500 text-white font-semibold rounded text-sm hover:bg-indigo-600 active:scale-[0.98] transition cursor-pointer" :disabled="submitting">
            <span v-if="submitting">Creating...</span>
            <span v-else>Create Ticket</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { LifeBuoy, X, ChevronDown, Send } from 'lucide-vue-next';

const props = defineProps({
  tickets: {
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

const { createTicket, updateTicket, addTicketMessage } = useApi();

const showModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const expandedRow = ref(null);

const initialForm = {
  employeeId: '',
  category: 'General HR',
  priority: 'Medium',
  subject: '',
  description: ''
};

const form = ref({ ...initialForm });
const editForms = ref({});
const replyForms = ref({});

// Ideally get the active user ID from auth context. Using a fallback for demo purposes.
const activeUserId = ref('current_user_id'); 

// Fetch current user from local storage
onMounted(() => {
  const userStr = localStorage.getItem('user');
  if(userStr) {
    try {
      const user = JSON.parse(userStr);
      activeUserId.value = user._id;
    } catch(e){}
  }
});

// All employees who can handle HR tickets (admins/HR)
const hrEmployees = computed(() => {
  return props.employees.filter(e => e.role === 'Admin' || e.department === 'HR');
});

watch(() => props.tickets, (newVals) => {
  newVals.forEach(t => {
    if (!editForms.value[t._id]) {
      editForms.value[t._id] = {
        status: t.status,
        assignedTo: t.assignedTo?._id || ''
      };
      replyForms.value[t._id] = '';
    }
  });
}, { immediate: true, deep: true });

const priorityColor = (priority) => {
  switch(priority) {
    case 'Urgent': return 'text-red-500 font-bold';
    case 'High': return 'text-orange-500 font-semibold';
    case 'Medium': return 'text-blue-500';
    case 'Low': return 'text-zinc-500';
    default: return 'text-zinc-500';
  }
};

const statusColor = (status) => {
  switch(status) {
    case 'Open': return 'text-green-500';
    case 'In Progress': return 'text-blue-500';
    case 'Waiting on Employee': return 'text-orange-500';
    case 'Resolved': return 'text-purple-500';
    case 'Closed': return 'text-zinc-500';
    default: return 'text-zinc-500';
  }
};

const toggleRow = (id) => {
  expandedRow.value = expandedRow.value === id ? null : id;
};

const closeModal = () => {
  showModal.value = false;
  form.value = { ...initialForm };
  if (props.authUser?.role === 'Employee') {
    form.value.employeeId = props.authUser._id;
  }
  formError.value = null;
};

const handleSubmit = async () => {
  if (props.authUser?.role === 'Employee') {
    form.value.employeeId = props.authUser._id;
  }

  if (!form.value.employeeId || !form.value.subject || !form.value.description) {
    formError.value = 'Please complete all required fields.';
    return;
  }
  submitting.value = true;
  formError.value = null;

  try {
    await createTicket(form.value);
    emit('refresh');
    closeModal();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Failed to create ticket.';
  } finally {
    submitting.value = false;
  }
};

const saveTicket = async (id) => {
  try {
    await updateTicket(id, editForms.value[id]);
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update ticket.');
  }
};

const sendReply = async (id) => {
  const msg = replyForms.value[id]?.trim();
  if (!msg) return;

  try {
    await addTicketMessage(id, { message: msg });
    replyForms.value[id] = '';
    emit('refresh');
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to send message.');
  }
};
</script>
