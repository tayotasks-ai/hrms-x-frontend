<template>
  <div class="space-y-6">
    <!-- Header panel with submit toggle -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg">
      <div>
        <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Payroll & Compensation</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Process salaries, log deductions/allowances, and generate employee payslips.</p>
        <p v-if="authUser?.role !== 'Employee' && walletBalance !== null" class="text-xs font-mono text-zinc-600 dark:text-zinc-400 mt-1.5">
          Payroll wallet: <span class="font-semibold text-zinc-800 dark:text-zinc-200">&#8358;{{ walletBalance.toLocaleString() }}</span>
          <span v-if="isTestAccount" class="ml-1.5 text-sky-600 dark:text-sky-400">(test account — no payroll fees)</span>
          <span v-if="pendingSettlement > 0" class="ml-1.5 text-amber-600 dark:text-amber-400">(&#8358;{{ pendingSettlement.toLocaleString() }} still settling — see Wallet tab)</span>
          <span v-if="fundingShortfall > 0" class="ml-1.5 text-amber-600 dark:text-amber-400">(payday {{ daysUntilPayday === 0 ? 'today' : daysUntilPayday === 1 ? 'tomorrow' : `in ${daysUntilPayday} days` }} — short &#8358;{{ fundingShortfall.toLocaleString() }}, fund now)</span>
        </p>
      </div>
      <div v-if="authUser?.role !== 'Employee'" class="w-full sm:w-auto flex items-center gap-2">
        <button
          v-if="selectedIds.length > 0"
          @click="payBatchNow"
          :disabled="batchPaying"
          class="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold px-4 py-2 rounded text-sm hover:opacity-90 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
        >
          <Banknote class="w-4 h-4" />
          <span>{{ batchPaying ? 'Paying…' : `Pay Selected (${selectedIds.length})` }}</span>
        </button>
        <button
          @click="exportPayrollCsv"
          title="Export CSV"
          aria-label="Export CSV"
          class="flex items-center justify-center w-9 h-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <Download class="w-4 h-4" />
        </button>
        <button
          @click="openApprovalsModal"
          title="Payroll Approvals"
          aria-label="Payroll Approvals"
          class="relative flex items-center justify-center w-9 h-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <ShieldCheck class="w-4 h-4" />
          <span v-if="pendingApprovalCount > 0" class="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{{ pendingApprovalCount }}</span>
        </button>
        <button
          @click="showRemittanceModal = true"
          title="Remittance Reports"
          aria-label="Remittance Reports"
          class="flex items-center justify-center w-9 h-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <FileSpreadsheet class="w-4 h-4" />
        </button>
        <button
          @click="openBulkGenerateModal"
          title="Generate for Period"
          aria-label="Generate for Period"
          class="flex items-center justify-center w-9 h-9 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition cursor-pointer"
        >
          <Users class="w-4 h-4" />
        </button>
        <button
          @click="showGenerateModal = true"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-lime-500 text-black font-semibold px-4 py-2 rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer"
        >
          <Receipt class="w-4 h-4" />
          <span>Process Payroll</span>
        </button>
      </div>
    </div>

    <!-- Bulk Generate Payslips Modal -->
    <div
      v-if="showBulkGenerateModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeBulkGenerateModal"
    >
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Generate Payslips for Period</h3>
          <p class="text-xs text-zinc-500 mt-1">Creates a Draft payslip for every active employee who doesn't already have one for this period, using their current salary. Review and adjust individual slips (allowances, deductions) before paying.</p>
        </div>

        <div v-if="bulkGenerateError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
          {{ bulkGenerateError }}
        </div>
        <div v-if="bulkGenerateResult" class="p-3 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
          {{ bulkGenerateResult }}
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Period</label>
          <input
            v-model="bulkGeneratePeriod"
            type="text"
            placeholder="e.g. May 2026"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button @click="closeBulkGenerateModal" class="flex-1 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 transition">
            Close
          </button>
          <button
            @click="runBulkGenerate"
            :disabled="bulkGenerating || !bulkGeneratePeriod.trim()"
            class="flex-1 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 active:scale-[0.98] transition disabled:opacity-50"
          >
            {{ bulkGenerating ? 'Generating…' : 'Generate' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="paymentError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
      {{ paymentError }}
    </div>
    <div v-if="paymentInfo" class="p-3 bg-lime-50 dark:bg-lime-950/60 border border-lime-200 dark:border-lime-900 text-lime-700 dark:text-lime-400 rounded text-xs font-mono">
      {{ paymentInfo }}
    </div>

    <!-- Payslip Directory -->
    <div class="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-lg overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              <th v-if="authUser?.role !== 'Employee'" class="py-3 pl-6 pr-2 w-8">
                <input type="checkbox" :checked="allPayableSelected" @change="toggleSelectAll" class="accent-lime-500 cursor-pointer" />
              </th>
              <th class="py-3 px-6">Employee</th>
              <th class="py-3 px-6">Period</th>
              <th class="py-3 px-6">Base Salary</th>
              <th class="py-3 px-6">Allowances</th>
              <th class="py-3 px-6">Deductions</th>
              <th class="py-3 px-6 text-lime-600 dark:text-lime-400">Net Pay</th>
              <th class="py-3 px-6">Status</th>
              <th class="py-3 px-6">Payment</th>
              <th class="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-900">
            <tr v-if="payslips.length === 0" class="text-center text-zinc-500">
              <td :colspan="authUser?.role !== 'Employee' ? 10 : 8" class="py-12">
                <Receipt class="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                <p class="text-xs">No payroll cycles processed for this tenant.</p>
              </td>
            </tr>

            <tr
              v-for="slip in payslips"
              :key="slip._id"
              class="hover:bg-zinc-50 dark:bg-zinc-900/30 transition-colors"
            >
              <td v-if="authUser?.role !== 'Employee'" class="py-4 pl-6 pr-2">
                <input
                  v-if="isPayable(slip)"
                  type="checkbox"
                  :checked="selectedIds.includes(slip._id)"
                  @change="toggleSelect(slip._id)"
                  class="accent-lime-500 cursor-pointer"
                />
              </td>
              <td class="py-4 px-6">
                <div class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ slip.employeeId?.name || 'Deleted Employee' }}
                </div>
                <div class="text-[10px] text-zinc-500 font-mono">
                  {{ slip.employeeId?.role }}
                </div>
              </td>
              <td class="py-4 px-6 text-zinc-700 dark:text-zinc-300 font-medium">{{ slip.period }}</td>
              <td class="py-4 px-6 text-zinc-600 dark:text-zinc-400 font-mono">{{ formatCurrency(slip.basicSalary) }}</td>
              <td class="py-4 px-6 text-emerald-400 font-mono">+{{ formatCurrency(slip.allowances) }}</td>
              <td class="py-4 px-6 text-rose-400 font-mono">-{{ formatCurrency(deductionsTotal(slip)) }}</td>
              <td class="py-4 px-6 font-semibold text-lime-600 dark:text-lime-400 font-mono">{{ formatCurrency(slip.netPay) }}</td>
              <td class="py-4 px-6">
                <span :class="[
                  slip.status === 'Paid' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                  'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
                  'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border'
                ]">
                  {{ slip.status }}
                </span>
              </td>
              <td class="py-4 px-6">
                <span :class="[paymentBadgeClass(paymentStatus(slip)), 'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border']">
                  {{ paymentStatusLabel(paymentStatus(slip)) }}
                </span>
              </td>
              <td class="py-4 px-6 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    v-if="authUser?.role !== 'Employee' && paymentStatus(slip) === 'Pending_OTP'"
                    @click="openOtpModal(slip._id)"
                    class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded border border-amber-200 dark:border-amber-900 text-xs transition active:scale-95 cursor-pointer"
                  >
                    <ShieldCheck class="w-3.5 h-3.5" />
                    <span>Enter OTP</span>
                  </button>
                  <button
                    v-if="authUser?.role !== 'Employee' && paymentStatus(slip) === 'Pending_OTP'"
                    @click="resetPayment(slip)"
                    :disabled="resettingIds.includes(slip._id)"
                    title="Ask Paystack whether this transfer is really still pending, and free it up to pay again if it isn't"
                    class="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw class="w-3.5 h-3.5" />
                    <span>{{ resettingIds.includes(slip._id) ? 'Checking…' : 'Reset' }}</span>
                  </button>
                  <button
                    v-if="authUser?.role !== 'Employee' && paymentStatus(slip) === 'Pending_OTP'"
                    @click="forceResetPayment(slip)"
                    :disabled="resettingIds.includes(slip._id)"
                    title="Skip the Paystack check and reset anyway — risk of double payment if the transfer later completes"
                    class="text-[10px] text-red-500 hover:text-red-600 dark:text-red-400 underline decoration-dotted underline-offset-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    Force
                  </button>
                  <button
                    v-else-if="authUser?.role !== 'Employee' && isPayable(slip)"
                    @click="payNow(slip)"
                    :disabled="payingIds.includes(slip._id)"
                    class="flex items-center gap-1 bg-zinc-900 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-900 px-2.5 py-1.5 rounded text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Banknote class="w-3.5 h-3.5" />
                    <span>{{ payingIds.includes(slip._id) ? 'Paying…' : 'Pay Now' }}</span>
                  </button>
                  <button
                    @click="openInvoice(slip)"
                    class="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs transition active:scale-95 cursor-pointer"
                  >
                    <Eye class="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                  <button
                    @click="downloadPdf(slip)"
                    :disabled="downloadingPdf"
                    class="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 p-1.5 rounded border border-zinc-200 dark:border-zinc-800 text-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Download PDF"
                  >
                    <Download class="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- OTP Finalize Modal -->
    <div
      v-if="otpModalPayslipId"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeOtpModal"
    >
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div class="h-14 px-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-amber-500" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Confirm Transfer OTP</h3>
          </div>
          <button @click="closeOtpModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-500 transition">
            <X class="w-4 h-4" />
          </button>
        </div>
        <div class="p-5 space-y-3">
          <p class="text-xs text-zinc-500">Paystack sent an OTP to your business account's registered phone/email to authorize this transfer. Enter it below to complete the payment.</p>
          <div v-if="otpError" class="p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
            {{ otpError }}
          </div>
          <input
            v-model="otpValue"
            type="text"
            placeholder="Enter OTP"
            class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-lime-500 transition"
          />
        </div>
        <div class="h-16 px-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button @click="closeOtpModal" class="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition">Cancel</button>
          <button
            @click="submitOtp"
            :disabled="otpSubmitting || !otpValue.trim()"
            class="px-4 py-1.5 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 transition disabled:opacity-50"
          >
            {{ otpSubmitting ? 'Confirming…' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Payroll Approvals (maker-checker) Modal -->
    <div
      v-if="showApprovalsModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeApprovalsModal"
    >
      <div class="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2">
            <ShieldCheck class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Payroll Approvals</h3>
          </div>
          <button @click="closeApprovalsModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-3">
          <p class="text-xs text-zinc-500">Payroll runs submitted while dual approval is on. A different HR admin than the one who requested it must approve before Paystack is called.</p>

          <div v-if="approvalsError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
            {{ approvalsError }}
          </div>

          <div v-if="approvalsLoading" class="py-10 text-center text-xs text-zinc-500">Loading…</div>

          <div v-else-if="approvals.length === 0" class="flex flex-col items-center justify-center py-10 text-center">
            <ShieldCheck class="w-8 h-8 text-zinc-300 dark:text-zinc-800 mb-2" />
            <p class="text-xs text-zinc-500">No payroll approval requests yet.</p>
          </div>

          <div v-for="a in approvals" :key="a._id" class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-2">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ formatCurrency(a.totalAmount) }} &bull; {{ a.payslipIds.length }} payslip{{ a.payslipIds.length === 1 ? '' : 's' }}{{ a.period ? ' — ' + a.period : '' }}</p>
                <p class="text-[11px] text-zinc-500 mt-0.5">Requested by {{ a.requestedBy.name }} &bull; {{ formatDate(a.requestedAt) }}</p>
              </div>
              <span :class="[
                a.status === 'Approved' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900' :
                a.status === 'Rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900' :
                'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
                'px-2 py-0.5 text-[10px] font-mono uppercase font-semibold rounded border shrink-0'
              ]">{{ a.status }}</span>
            </div>

            <p class="text-[11px] text-zinc-500">{{ a.payslipIds.map(p => p.employeeId?.name || 'Deleted Employee').join(', ') }}</p>

            <p v-if="a.status === 'Rejected' && a.rejectionReason" class="text-[11px] text-rose-500">Reason: {{ a.rejectionReason }}</p>
            <p v-if="a.status === 'Approved'" class="text-[11px] text-zinc-500">{{ (a.results || []).filter(r => r.ok).length }} of {{ (a.results || []).length }} payment(s) succeeded &bull; decided by {{ a.decidedBy?.name }}</p>

            <div v-if="a.status === 'Pending'" class="flex items-center gap-2 pt-1">
              <button
                v-if="String(a.requestedBy.id) === String(authUser?._id)"
                disabled
                title="You initiated this run — a different HR admin must approve it."
                class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 px-3 py-1.5 rounded text-xs cursor-not-allowed"
              >
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>Awaiting another admin</span>
              </button>
              <button
                v-else
                @click="approveRequest(a._id)"
                :disabled="decidingId === a._id"
                class="flex items-center gap-1.5 bg-lime-500 text-black font-semibold px-3 py-1.5 rounded text-xs hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck class="w-3.5 h-3.5" />
                <span>{{ decidingId === a._id ? 'Approving…' : 'Approve & Pay' }}</span>
              </button>
              <button
                @click="rejectRequest(a._id)"
                :disabled="decidingId === a._id"
                class="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
              >
                {{ String(a.requestedBy.id) === String(authUser?._id) ? 'Cancel' : 'Reject' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Process Payroll (Generate Payslip) Modal -->
    <div 
      v-if="showGenerateModal" 
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeGenerateModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Receipt class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Generate Payslip</h3>
          </div>
          <button @click="closeGenerateModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
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
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Select Staff Member</label>
            <select 
              v-model="form.employeeId"
              required
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Staff</option>
              <option 
                v-for="emp in activeEmployeesOnly" 
                :key="emp._id" 
                :value="emp._id"
              >
                {{ emp.name }} - {{ emp.role }} (Base: {{ formatCurrency(emp.salary) }}/mo)
              </option>
            </select>
          </div>

          <!-- Period -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Payroll Period</label>
            <input 
              v-model="form.period"
              type="text"
              required
              placeholder="e.g. May 2026"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-lime-500 transition"
            />
          </div>

          <!-- Allowances & Other Deductions Grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Allowances (₦)</label>
              <input
                v-model="form.allowances"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
              />
            </div>
            <div class="space-y-1">
              <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Other Deductions (₦)</label>
              <input
                v-model="form.otherDeductions"
                type="number"
                min="0"
                placeholder="0"
                class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-lime-500 transition font-mono"
              />
              <p class="text-[10px] text-zinc-500">Loan repayments, union dues, etc. PAYE/Pension/NHF are calculated automatically.</p>
            </div>
          </div>

          <!-- Live Statutory Preview -->
          <div v-if="preview" class="border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900/40 p-3 space-y-1.5">
            <p class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Estimated Breakdown</p>
            <div class="flex justify-between text-xs"><span class="text-zinc-500">Gross Pay</span><span class="font-mono text-zinc-700 dark:text-zinc-300">{{ formatCurrency(preview.grossPay) }}</span></div>
            <div class="flex justify-between text-xs"><span class="text-zinc-500">PAYE</span><span class="font-mono text-rose-400">-{{ formatCurrency(preview.deductions.paye) }}</span></div>
            <div class="flex justify-between text-xs"><span class="text-zinc-500">Pension (8%)</span><span class="font-mono text-rose-400">-{{ formatCurrency(preview.deductions.pension) }}</span></div>
            <div class="flex justify-between text-xs"><span class="text-zinc-500">NHF (2.5%)</span><span class="font-mono text-rose-400">-{{ formatCurrency(preview.deductions.nhf) }}</span></div>
            <div class="flex justify-between text-xs" v-if="preview.deductions.other > 0"><span class="text-zinc-500">Other</span><span class="font-mono text-rose-400">-{{ formatCurrency(preview.deductions.other) }}</span></div>
            <div class="flex justify-between text-xs pt-1.5 border-t border-zinc-200 dark:border-zinc-800"><span class="font-semibold text-zinc-700 dark:text-zinc-300">Net Pay</span><span class="font-mono font-bold text-lime-600 dark:text-lime-400">{{ formatCurrency(preview.netPay) }}</span></div>
          </div>

          <!-- Status -->
          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Payment Status</label>
            <select 
              v-model="form.status"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-805 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="Paid">Paid</option>
              <option value="Draft">Draft (Unpaid)</option>
            </select>
          </div>
        </form>

        <!-- Footer -->
        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button 
            type="button" 
            @click="closeGenerateModal" 
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
            <span v-else>Generate Slip</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Statutory Remittance Reports Modal -->
    <div
      v-if="showRemittanceModal"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeRemittanceModal"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileSpreadsheet class="w-4 h-4 text-lime-600 dark:text-lime-400" />
            <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">Statutory Remittance Report</h3>
          </div>
          <button @click="closeRemittanceModal" class="p-1 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-6 space-y-4">
          <p class="text-xs text-zinc-500">A starting point for your monthly filings — not a certified template from FIRS, PenCom, or the NHF. Review before submitting.</p>

          <div v-if="remittanceError" class="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded text-xs font-mono">
            {{ remittanceError }}
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Payroll Period</label>
            <select
              v-model="remittanceForm.period"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="" disabled>Select Period</option>
              <option v-for="p in availablePeriods" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Report Type</label>
            <select
              v-model="remittanceForm.type"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-lime-500 transition"
            >
              <option value="paye">PAYE (FIRS)</option>
              <option value="pension">Pension (PenCom)</option>
              <option value="nhf">NHF</option>
            </select>
          </div>
        </div>

        <div class="h-20 px-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-end gap-3">
          <button
            type="button"
            @click="closeRemittanceModal"
            class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-100 dark:hover:bg-zinc-850 transition"
            :disabled="downloadingRemittance"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="downloadRemittance"
            :disabled="downloadingRemittance || !remittanceForm.period"
            class="px-4 py-2 bg-lime-500 text-black font-semibold rounded text-sm hover:bg-lime-600 dark:bg-lime-400 active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
          >
            {{ downloadingRemittance ? 'Preparing…' : 'Download CSV' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Printable Payslip Invoice Modal -->
    <div 
      v-if="showInvoiceModal && selectedSlip" 
      class="fixed inset-0 bg-black/40 dark:bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="closeInvoice"
    >
      <div class="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg flex flex-col justify-between shadow-2xl overflow-hidden relative">
        
        <!-- Print Close Button Banner -->
        <div class="h-16 px-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30">
          <span class="text-xs font-mono text-zinc-500">Document Preview</span>
          <div class="flex items-center gap-2">
            <button
              @click="downloadPdf(selectedSlip)"
              :disabled="downloadingPdf"
              class="flex items-center gap-1.5 bg-lime-500 hover:bg-lime-600 dark:bg-lime-400 text-black font-semibold px-3 py-1.5 rounded text-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ downloadingPdf ? 'Preparing…' : 'Download PDF' }}</span>
            </button>
            <button @click="closeInvoice" class="p-1.5 hover:bg-zinc-50 dark:bg-zinc-900 rounded text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Printable Area -->
        <div class="p-8 space-y-8 flex-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100" id="print-area">
          <!-- Corporate Header -->
          <div class="flex justify-between items-start">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-lime-500 rounded flex items-center justify-center font-display font-bold text-black text-xs">
                  AG
                </div>
                <h4 class="font-display font-bold text-zinc-900 dark:text-zinc-100 text-base uppercase tracking-wider">{{ tenantName }}</h4>
              </div>
              <p class="text-xs text-zinc-500">Multi-Tenant SaaS HRMS</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-display font-bold text-zinc-900 dark:text-zinc-50 tracking-wide uppercase">Payslip Invoice</h2>
              <span :class="[
                selectedSlip.status === 'Paid' ? 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border border-lime-200 dark:border-lime-900' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800',
                'px-2 py-0.5 text-[9px] font-mono uppercase font-semibold rounded mt-1.5 inline-block'
              ]">
                Payment Status: {{ selectedSlip.status }}
              </span>
            </div>
          </div>

          <!-- Divider -->
          <div class="h-[1px] bg-zinc-50 dark:bg-zinc-900"></div>

          <!-- Info Grid -->
          <div class="grid grid-cols-2 gap-6 text-xs">
            <!-- Employee Section -->
            <div class="space-y-2">
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Employee Details</span>
              <div class="space-y-1 font-sans">
                <p class="text-sm font-bold text-zinc-800 dark:text-zinc-200">{{ selectedSlip.employeeId?.name || 'Deleted Employee' }}</p>
                <p class="text-zinc-600 dark:text-zinc-400">{{ selectedSlip.employeeId?.role }}</p>
                <p class="text-zinc-500">{{ selectedSlip.employeeId?.departmentId?.name }} Department</p>
                <p class="text-zinc-500 font-mono">{{ selectedSlip.employeeId?.email }}</p>
              </div>
            </div>

            <!-- Cycle Section -->
            <div class="space-y-2 text-right">
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Payroll Cycle</span>
              <div class="space-y-1">
                <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{{ selectedSlip.period }}</p>
                <p class="text-zinc-500 font-mono text-[10px]">Reference: #SLIP-{{ selectedSlip._id?.slice(-8).toUpperCase() }}</p>
                <p class="text-zinc-500 font-mono text-[10px]">Generated: {{ formatDate(selectedSlip.createdAt) }}</p>
              </div>
            </div>
          </div>

          <!-- Financial Table -->
          <div class="border border-zinc-900 bg-zinc-50 dark:bg-zinc-900/10 rounded overflow-hidden mt-6">
            <div class="grid grid-cols-3 py-2.5 px-4 bg-zinc-50 dark:bg-zinc-900/40 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-900">
              <div>Description</div>
              <div class="text-right">Earnings</div>
              <div class="text-right">Deductions</div>
            </div>
            
            <div class="divide-y divide-zinc-900/60 text-xs font-mono">
              <!-- Basic Salary -->
              <div class="grid grid-cols-3 py-3 px-4">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Basic Salary</div>
                <div class="text-right text-zinc-700 dark:text-zinc-300">{{ formatCurrency(selectedSlip.basicSalary) }}</div>
                <div class="text-right text-zinc-600">-</div>
              </div>
              
              <!-- Allowances -->
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.allowances > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Allowances & Bonuses</div>
                <div class="text-right text-emerald-400">+{{ formatCurrency(selectedSlip.allowances) }}</div>
                <div class="text-right text-zinc-600">-</div>
              </div>
              
              <!-- Deductions -->
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.deductions?.paye > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">PAYE Tax</div>
                <div class="text-right text-zinc-600">-</div>
                <div class="text-right text-rose-400">-{{ formatCurrency(selectedSlip.deductions.paye) }}</div>
              </div>
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.deductions?.pension > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Pension (8%)</div>
                <div class="text-right text-zinc-600">-</div>
                <div class="text-right text-rose-400">-{{ formatCurrency(selectedSlip.deductions.pension) }}</div>
              </div>
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.deductions?.nhf > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">NHF (2.5%)</div>
                <div class="text-right text-zinc-600">-</div>
                <div class="text-right text-rose-400">-{{ formatCurrency(selectedSlip.deductions.nhf) }}</div>
              </div>
              <div class="grid grid-cols-3 py-3 px-4" v-if="selectedSlip.deductions?.other > 0">
                <div class="text-zinc-700 dark:text-zinc-300 font-sans">Other Deductions</div>
                <div class="text-right text-zinc-600">-</div>
                <div class="text-right text-rose-400">-{{ formatCurrency(selectedSlip.deductions.other) }}</div>
              </div>
            </div>
          </div>

          <!-- Total Payroll Panel -->
          <div class="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-900 rounded p-4 flex justify-between items-center mt-6">
            <div>
              <span class="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Net Disbursement</span>
              <p class="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">Amount credited to account</p>
            </div>
            <div class="text-right">
              <span class="text-2xl font-display font-bold text-lime-600 dark:text-lime-400 font-mono">{{ formatCurrency(selectedSlip.netPay) }}</span>
            </div>
          </div>

          <!-- Footer disclaimer -->
          <div class="text-center text-[10px] text-zinc-600 font-mono pt-12">
            This is a system-generated document and requires no physical signature. Scoped for {{ tenantName }}.
          </div>
        </div>

      </div>
    </div>

    <!-- Confirm Payment Modal (replaces window.confirm) -->
    <div
      v-if="confirmState"
      class="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      @click.self="closeConfirm"
    >
      <div class="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl overflow-hidden">
        <div class="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <AlertTriangle v-if="confirmState.danger" class="w-4 h-4 text-red-500" />
          <Banknote v-else class="w-4 h-4 text-lime-600 dark:text-lime-400" />
          <h3 class="font-display font-bold text-zinc-900 dark:text-zinc-50 text-sm">{{ confirmState.title }}</h3>
        </div>
        <div class="p-6 space-y-2 text-sm">
          <p v-for="(line, i) in confirmState.lines" :key="i" :class="i === 0 ? 'text-zinc-800 dark:text-zinc-200 font-semibold' : 'text-zinc-600 dark:text-zinc-400 font-mono text-xs'">
            {{ line }}
          </p>
        </div>
        <div class="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
          <button @click="closeConfirm" class="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm hover:bg-zinc-855 transition cursor-pointer">
            Cancel
          </button>
          <button
            @click="confirmProceed"
            :class="confirmState.danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-lime-500 hover:bg-lime-600 dark:bg-lime-400 text-black'"
            class="px-4 py-2 font-semibold rounded text-sm active:scale-[0.98] transition cursor-pointer"
          >
            {{ confirmState.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useApi } from '../composables/useApi';
import { Eye, X, Receipt, Download, Banknote, ShieldCheck, FileSpreadsheet, Users, RotateCcw, AlertTriangle } from 'lucide-vue-next';
import { estimatePayroll } from '../utils/payrollEstimate';
import { toCsv, downloadCsv } from '../utils/csv';

const props = defineProps({
  payslips: {
    type: Array,
    required: true
  },
  employees: {
    type: Array,
    required: true
  },
  tenantName: {
    type: String,
    required: true
  },
  authUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['refresh']);

const {
  createPayslip, bulkGeneratePayslips, downloadPayslipPdf, downloadRemittanceReport, payPayslip, payPayslipBatch, finalizePayslipPayment, resetStuckPayment,
  getPayrollApprovals, approvePayrollApproval, rejectPayrollApproval, getWallet,
} = useApi();

// Mirrors utils/paystack.js computeTransferFee on the backend — used only
// to preview the fee breakdown in a confirm dialog before paying, since the
// backend is the source of truth for what's actually charged. Estimated
// as if stamp duty applies (the conservative default); the real charge may
// be ₦50 less per transfer if the platform has stamp-duty exemption.
const estimateFee = (netPay) => {
  const paystackFee = netPay <= 5000 ? 10 : netPay <= 50000 ? 25 : 50;
  const stampDuty = netPay >= 10000 ? 50 : 0;
  const markup = 500;
  return { paystackFee, stampDuty, markup, total: paystackFee + stampDuty + markup };
};

const walletBalance = ref(null);
// Test accounts (Tenant.isTestAccount, set from the platform dashboard) pay
// no Paystack/stamp/platform fees on payroll transfers — see
// payslipPaymentController.js payOnePayslip. Only net pay is debited.
const isTestAccount = ref(false);
// How much of walletBalance is still mid-settlement with Paystack and
// can't actually be paid out yet — see walletController.js getWallet.
// null when the live check couldn't run; a positive number is what's not
// yet spendable (walletBalance minus confirmedAvailable).
const pendingSettlement = ref(0);
// Mirrors WalletTab.vue's fundingWarning — a heads-up that payday is close
// (within a week) and confirmed-available funds won't cover this period's
// still-unpaid payslips yet. See walletController.js getWallet.
const daysUntilPayday = ref(null);
const fundingShortfall = ref(0);
const loadWalletBalance = async () => {
  try {
    const wallet = await getWallet();
    walletBalance.value = wallet.balance;
    isTestAccount.value = !!wallet.isTestAccount;
    pendingSettlement.value = (wallet.confirmedAvailable === null || wallet.confirmedAvailable === undefined)
      ? 0
      : Math.max(0, (wallet.balance || 0) - wallet.confirmedAvailable);
    daysUntilPayday.value = wallet.daysUntilPayday ?? null;
    fundingShortfall.value = (daysUntilPayday.value !== null && daysUntilPayday.value >= 0 && daysUntilPayday.value <= 7)
      ? (wallet.fundingShortfall || 0)
      : 0;
  } catch { /* non-fatal — the balance chip just won't show */ }
};

const showGenerateModal = ref(false);
const showBulkGenerateModal = ref(false);
const bulkGeneratePeriod = ref('');
const bulkGenerating = ref(false);
const bulkGenerateError = ref(null);
const bulkGenerateResult = ref(null);
const showInvoiceModal = ref(false);
const submitting = ref(false);
const formError = ref(null);
const selectedSlip = ref(null);
const downloadingPdf = ref(false);

// ── Confirm modal (replaces window.confirm for Pay Now / Pay Selected) ──────
const confirmState = ref(null); // { lines: string[], onConfirm: () => void, danger, title, confirmLabel }
const openConfirm = (lines, onConfirm, options = {}) => {
  confirmState.value = {
    lines,
    onConfirm,
    danger: !!options.danger,
    title: options.title || 'Confirm Payment',
    confirmLabel: options.confirmLabel || 'Confirm',
  };
};
const closeConfirm = () => { confirmState.value = null; };
const confirmProceed = () => {
  const cb = confirmState.value?.onConfirm;
  closeConfirm();
  if (cb) cb();
};

// ── Payroll disbursement (Paystack) ──────────────────────────────────────────
const selectedIds = ref([]);
const payingIds = ref([]);
const resettingIds = ref([]);
const batchPaying = ref(false);
const paymentError = ref(null);
const otpModalPayslipId = ref(null);
const otpValue = ref('');
const otpError = ref(null);
const otpSubmitting = ref(false);
const otpQueue = ref([]); // payslip ids still awaiting OTP entry, processed one at a time
const paymentInfo = ref(null);

// ── Payroll Approvals (maker-checker) ────────────────────────────────────────
const showApprovalsModal = ref(false);
const approvals = ref([]);
const approvalsLoading = ref(false);
const approvalsError = ref(null);
const decidingId = ref(null);
const pendingApprovalCount = ref(0);

const loadApprovals = async () => {
  approvalsLoading.value = true;
  approvalsError.value = null;
  try {
    approvals.value = await getPayrollApprovals();
    pendingApprovalCount.value = approvals.value.filter(a => a.status === 'Pending').length;
  } catch (err) {
    approvalsError.value = err.response?.data?.message || err.message || 'Failed to load approvals.';
  } finally {
    approvalsLoading.value = false;
  }
};

const openApprovalsModal = () => {
  showApprovalsModal.value = true;
  loadApprovals();
};

const closeApprovalsModal = () => { showApprovalsModal.value = false; };

const approveRequest = async (id) => {
  decidingId.value = id;
  approvalsError.value = null;
  try {
    await approvePayrollApproval(id);
    await loadApprovals();
    emit('refresh');
  } catch (err) {
    approvalsError.value = err.response?.data?.message || err.message || 'Failed to approve.';
  } finally {
    decidingId.value = null;
  }
};

const rejectRequest = async (id) => {
  const reason = window.prompt('Reason for rejecting this payroll run (optional):') || '';
  decidingId.value = id;
  approvalsError.value = null;
  try {
    await rejectPayrollApproval(id, reason);
    await loadApprovals();
  } catch (err) {
    approvalsError.value = err.response?.data?.message || err.message || 'Failed to reject.';
  } finally {
    decidingId.value = null;
  }
};

onMounted(() => {
  if (props.authUser?.role !== 'Employee') {
    loadApprovals();
    loadWalletBalance();
  }
});

const paymentStatus = (slip) => slip.payment?.status || 'Unpaid';
const isPayable = (slip) => ['Unpaid', 'Failed'].includes(paymentStatus(slip));

const payableSlipIds = computed(() => props.payslips.filter(isPayable).map(s => s._id));
const allPayableSelected = computed(() =>
  payableSlipIds.value.length > 0 && payableSlipIds.value.every(id => selectedIds.value.includes(id))
);

const toggleSelect = (id) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter(x => x !== id)
    : [...selectedIds.value, id];
};

const toggleSelectAll = () => {
  selectedIds.value = allPayableSelected.value ? [] : [...payableSlipIds.value];
};

const paymentStatusLabel = (status) => ({
  Unpaid: 'Unpaid', Processing: 'Processing', Pending_OTP: 'Awaiting OTP', Paid: 'Paid', Failed: 'Failed',
}[status] || status);

const paymentBadgeClass = (status) => ({
  Paid: 'bg-lime-100 dark:bg-lime-950 text-lime-700 dark:text-lime-400 border-lime-200 dark:border-lime-900',
  Processing: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  Pending_OTP: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  Failed: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
  Unpaid: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800',
}[status] || 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-500 border-zinc-200 dark:border-zinc-800');

const queueOtpIfNeeded = (requiresOtp, payslipId) => {
  if (!requiresOtp) return;
  if (!otpQueue.value.includes(payslipId)) otpQueue.value.push(payslipId);
  if (!otpModalPayslipId.value) openOtpModal(otpQueue.value.shift());
};

const payNow = (slip) => {
  const fee = isTestAccount.value ? { paystackFee: 0, stampDuty: 0, markup: 0, total: 0 } : estimateFee(slip.netPay);
  const lines = [
    `Pay ${slip.employeeId?.name || 'this employee'} ₦${slip.netPay.toLocaleString()} net pay?`,
  ];
  if (isTestAccount.value) {
    lines.push('Test account — no Paystack, stamp duty, or platform fees apply.');
  } else {
    lines.push(`+ ₦${fee.paystackFee} Paystack fee`);
    if (fee.stampDuty) lines.push(`+ ₦${fee.stampDuty} stamp duty`);
    lines.push(`+ ₦${fee.markup} platform fee`);
  }
  lines.push(`= ₦${(slip.netPay + fee.total).toLocaleString()} debited from the payroll wallet${isTestAccount.value ? '' : ' (estimate)'}.`);

  openConfirm(lines, () => doPayNow(slip));
};

const doPayNow = async (slip) => {
  paymentError.value = null;
  paymentInfo.value = null;
  payingIds.value = [...payingIds.value, slip._id];
  try {
    const res = await payPayslip(slip._id);
    if (res.data?.requiresApproval) {
      paymentInfo.value = res.message;
      loadApprovals();
      return;
    }
    queueOtpIfNeeded(res.data?.requiresOtp, slip._id);
    emit('refresh');
    loadWalletBalance();
  } catch (err) {
    paymentError.value = err.response?.data?.message || err.message || 'Payment failed.';
  } finally {
    payingIds.value = payingIds.value.filter(id => id !== slip._id);
  }
};

// Unsticks a payslip stuck on "Awaiting OTP" — see backend
// payslipPaymentController.js resetStuckPayment for why this can happen
// (the OTP goes to the platform's own Paystack account, not the tenant)
// and why it's safe: the backend checks Paystack's real transfer status
// before touching anything, so this either frees the payslip up to pay
// again, syncs it to Paid if it actually went through, or tells you it's
// still genuinely live and can't be reset yet.
const doResetPayment = async (slip, force) => {
  paymentError.value = null;
  paymentInfo.value = null;
  resettingIds.value = [...resettingIds.value, slip._id];
  try {
    const res = await resetStuckPayment(slip._id, force);
    paymentInfo.value = res.message;
    emit('refresh');
    loadWalletBalance();
  } catch (err) {
    paymentError.value = err.response?.data?.message || err.message || 'Could not reset this payment.';
  } finally {
    resettingIds.value = resettingIds.value.filter(id => id !== slip._id);
  }
};

const resetPayment = (slip) => doResetPayment(slip, false);

// Force path: skips the "is Paystack still live" check server-side too.
// Gated behind the shared confirm modal with an explicit risk warning —
// this can genuinely result in the employee being paid AND the wallet
// refunded as if they weren't, which is why it isn't the default action.
const forceResetPayment = (slip) => {
  openConfirm(
    [
      `Force reset ${slip.employeeId?.name || 'this'}'s payment?`,
      `Paystack still reports this transfer as live — if it completes anyway, the employee could be paid while the wallet is refunded as if they weren't. Paying this payslip again afterward could pay them twice.`,
      'Only do this if you are sure the transfer will never go through (e.g. the OTP genuinely cannot be entered by anyone).',
    ],
    () => doResetPayment(slip, true),
    { danger: true, title: 'Force Reset — Risk of Double Payment', confirmLabel: 'Force Reset Anyway' }
  );
};

const payBatchNow = () => {
  if (selectedIds.value.length === 0) return;

  const selectedSlips = props.payslips.filter(s => selectedIds.value.includes(s._id));
  const netTotal = selectedSlips.reduce((sum, s) => sum + s.netPay, 0);
  const feeTotal = isTestAccount.value ? 0 : selectedSlips.reduce((sum, s) => sum + estimateFee(s.netPay).total, 0);

  const lines = [`Pay ${selectedSlips.length} selected payslip(s)?`];
  if (isTestAccount.value) {
    lines.push(`₦${netTotal.toLocaleString()} net pay — test account, no Paystack/stamp/platform fees apply.`);
    lines.push(`= ₦${netTotal.toLocaleString()} debited from the payroll wallet, paid in order.`);
  } else {
    lines.push(`₦${netTotal.toLocaleString()} net pay + ₦${feeTotal.toLocaleString()} in Paystack/stamp/platform fees`);
    lines.push(`= ₦${(netTotal + feeTotal).toLocaleString()} debited from the payroll wallet (estimate, paid in order — if the wallet runs short partway through, the rest are skipped and you'll be notified).`);
  }

  openConfirm(lines, doPayBatchNow);
};

const doPayBatchNow = async () => {
  paymentError.value = null;
  paymentInfo.value = null;
  batchPaying.value = true;
  try {
    const res = await payPayslipBatch(selectedIds.value);
    if (res.data?.requiresApproval) {
      paymentInfo.value = res.message;
      selectedIds.value = [];
      loadApprovals();
      return;
    }
    for (const r of res.data || []) {
      if (r.requiresOtp) queueOtpIfNeeded(true, r.payslipId);
    }
    const failed = (res.data || []).filter(r => !r.ok);
    if (failed.length > 0) {
      paymentError.value = `${failed.length} payment(s) could not be started: ${failed.map(f => f.message).join('; ')}`;
    }
    selectedIds.value = [];
    emit('refresh');
    loadWalletBalance();
  } catch (err) {
    paymentError.value = err.response?.data?.message || err.message || 'Batch payment failed.';
  } finally {
    batchPaying.value = false;
  }
};

const openOtpModal = (payslipId) => {
  otpModalPayslipId.value = payslipId;
  otpValue.value = '';
  otpError.value = null;
};

const closeOtpModal = () => {
  otpModalPayslipId.value = null;
  otpValue.value = '';
  otpError.value = null;
};

const submitOtp = async () => {
  if (!otpModalPayslipId.value || !otpValue.value.trim()) return;
  otpSubmitting.value = true;
  otpError.value = null;
  try {
    await finalizePayslipPayment(otpModalPayslipId.value, otpValue.value.trim());
    emit('refresh');
    closeOtpModal();
    // Move on to the next payslip awaiting OTP, if any.
    if (otpQueue.value.length > 0) openOtpModal(otpQueue.value.shift());
  } catch (err) {
    otpError.value = err.response?.data?.message || err.message || 'Could not confirm OTP.';
  } finally {
    otpSubmitting.value = false;
  }
};

const initialForm = {
  employeeId: '',
  period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
  allowances: '',
  otherDeductions: '',
  status: 'Paid'
};

const form = ref({ ...initialForm });

// Only active or onboarding employees can have payslips processed
const activeEmployeesOnly = computed(() => {
  return props.employees.filter(emp => emp.status !== 'Offboarded');
});

// Live PAYE/pension/NHF preview as HR fills out the form
const preview = computed(() => {
  const emp = props.employees.find(e => e._id === form.value.employeeId);
  if (!emp) return null;
  return estimatePayroll(emp.salary, form.value.allowances, form.value.otherDeductions);
});

const deductionsTotal = (slip) => {
  if (typeof slip.deductions === 'number') return slip.deductions; // legacy payslips
  return slip.deductions?.total ?? 0;
};

const closeGenerateModal = () => {
  showGenerateModal.value = false;
  form.value = { ...initialForm };
  formError.value = null;
};

const openBulkGenerateModal = () => {
  showBulkGenerateModal.value = true;
  bulkGeneratePeriod.value = '';
  bulkGenerateError.value = null;
  bulkGenerateResult.value = null;
};

const closeBulkGenerateModal = () => {
  showBulkGenerateModal.value = false;
};

const runBulkGenerate = async () => {
  if (!bulkGeneratePeriod.value.trim()) return;
  bulkGenerating.value = true;
  bulkGenerateError.value = null;
  bulkGenerateResult.value = null;
  try {
    const result = await bulkGeneratePayslips(bulkGeneratePeriod.value.trim());
    bulkGenerateResult.value = result.message;
    emit('refresh');
  } catch (err) {
    bulkGenerateError.value = err.response?.data?.message || err.message || 'Failed to generate payslips.';
  } finally {
    bulkGenerating.value = false;
  }
};

const openInvoice = (slip) => {
  selectedSlip.value = slip;
  showInvoiceModal.value = true;
};

const closeInvoice = () => {
  showInvoiceModal.value = false;
  selectedSlip.value = null;
};

const handleSubmit = async () => {
  if (!form.value.employeeId || !form.value.period) {
    formError.value = 'Please select an employee and period.';
    return;
  }

  submitting.value = true;
  formError.value = null;

  try {
    await createPayslip({
      employeeId: form.value.employeeId,
      period: form.value.period,
      allowances: form.value.allowances ? parseFloat(form.value.allowances) : 0,
      otherDeductions: form.value.otherDeductions ? parseFloat(form.value.otherDeductions) : 0,
      status: form.value.status
    });

    emit('refresh');
    closeGenerateModal();
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to generate payslip.';
  } finally {
    submitting.value = false;
  }
};

const downloadPdf = async (slip) => {
  downloadingPdf.value = true;
  try {
    const blob = await downloadPayslipPdf(slip._id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payslip-${(slip.employeeId?.name || 'Employee').replace(/\s+/g, '-')}-${slip.period.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    formError.value = err.response?.data?.message || err.message || 'Failed to download PDF.';
  } finally {
    downloadingPdf.value = false;
  }
};

// ── CSV export of the payroll register ──────────────────────────────────────
const exportPayrollCsv = () => {
  const headers = ['Employee', 'Period', 'Basic Salary', 'Allowances', 'PAYE', 'Pension', 'NHF', 'Other Deductions', 'Net Pay', 'Status'];
  const rows = props.payslips.map((slip) => {
    const d = typeof slip.deductions === 'object' ? slip.deductions : {};
    return [
      slip.employeeId?.name || 'Deleted Employee', slip.period,
      slip.basicSalary, slip.allowances,
      d.paye || 0, d.pension || 0, d.nhf || 0, d.other || 0,
      slip.netPay, slip.status,
    ];
  });
  downloadCsv(toCsv(headers, rows), `payroll-register-${new Date().toISOString().split('T')[0]}.csv`);
};

// ── Statutory remittance reports ─────────────────────────────────────────────
const showRemittanceModal = ref(false);
const remittanceForm = ref({ period: '', type: 'paye' });
const remittanceError = ref(null);
const downloadingRemittance = ref(false);

const availablePeriods = computed(() => {
  return [...new Set(props.payslips.map(s => s.period))];
});

const closeRemittanceModal = () => {
  showRemittanceModal.value = false;
  remittanceForm.value = { period: '', type: 'paye' };
  remittanceError.value = null;
};

const downloadRemittance = async () => {
  if (!remittanceForm.value.period) return;
  downloadingRemittance.value = true;
  remittanceError.value = null;
  try {
    const blob = await downloadRemittanceReport(remittanceForm.value.period, remittanceForm.value.type);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${remittanceForm.value.type}-remittance-${remittanceForm.value.period.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    closeRemittanceModal();
  } catch (err) {
    remittanceError.value = err.response?.data?.message || err.message || 'Failed to generate report.';
  } finally {
    downloadingRemittance.value = false;
  }
};

// Formatting Utilities
const formatCurrency = (val) => {
  if (val === undefined || val === null) return '₦0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(val);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>
