// Client-side mirror of backend/utils/payrollCalc.js, used only to show a
// live PAYE/pension/NHF preview in the Process Payroll form before submit.
// The server always recomputes on submit — this is a preview, not the
// source of truth. Keep the two in sync if the tax rules change.
//
// Basis: Nigeria Tax Act 2025 (effective 1 Jan 2026).
//   PAYE bands (annual): 0-800k @0%, next 2.2m @15%, next 9m @18%,
//   next 13m @21%, next 25m @23%, above 50m @25%.
//   Pension: 8% of (basic+allowances), approximating Basic+Housing+Transport.
//   NHF: 2.5% of basic only.

const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const calculateAnnualPAYE = (annualTaxableIncome) => {
  let tax = 0, prevCap = 0;
  const income = Math.max(0, annualTaxableIncome || 0);
  for (const band of PAYE_BANDS) {
    if (income <= prevCap) break;
    tax += (Math.min(income, band.upTo) - prevCap) * band.rate;
    prevCap = band.upTo;
  }
  return tax;
};

export const estimatePayroll = (basicSalary, allowances, otherDeductions) => {
  const basic = Number(basicSalary) || 0;
  const allow = Number(allowances) || 0;
  const other = Number(otherDeductions) || 0;

  const grossPay = basic + allow;
  const pension = round2(grossPay * 0.08);
  const nhf = round2(basic * 0.025);
  const annualTaxable = Math.max(0, (grossPay - pension - nhf) * 12);
  const paye = round2(calculateAnnualPAYE(annualTaxable) / 12);
  const total = round2(paye + pension + nhf + other);

  return {
    grossPay: round2(grossPay),
    deductions: { paye, pension, nhf, other: round2(other), total },
    netPay: round2(grossPay - total),
  };
};
