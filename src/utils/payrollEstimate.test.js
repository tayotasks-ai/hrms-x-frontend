import { describe, it, expect } from 'vitest';
import { estimatePayroll } from './payrollEstimate.js';
import { calculateNigerianPayroll } from '../../../backend/utils/payrollCalc.js';

describe('estimatePayroll (frontend preview)', () => {
  it('matches the backend calculation exactly for a range of salaries', () => {
    // The whole point of this preview is that it shouldn't drift from the
    // server's real calculation. Cross-check against the backend module
    // directly rather than re-asserting the tax math a second time.
    const cases = [
      { basicSalary: 0, allowances: 0 },
      { basicSalary: 80_000, allowances: 0 },
      { basicSalary: 500_000, allowances: 100_000 },
      { basicSalary: 5_000_000, allowances: 500_000, otherDeductions: 20_000 },
    ];
    for (const c of cases) {
      const client = estimatePayroll(c.basicSalary, c.allowances, c.otherDeductions);
      const server = calculateNigerianPayroll(c);
      expect(client.grossPay).toBeCloseTo(server.grossPay, 2);
      expect(client.deductions.paye).toBeCloseTo(server.deductions.paye, 2);
      expect(client.deductions.pension).toBeCloseTo(server.deductions.pension, 2);
      expect(client.deductions.nhf).toBeCloseTo(server.deductions.nhf, 2);
      expect(client.netPay).toBeCloseTo(server.netPay, 2);
    }
  });

  it('never returns NaN for empty/missing inputs', () => {
    const result = estimatePayroll(undefined, undefined, undefined);
    expect(Number.isNaN(result.netPay)).toBe(false);
    expect(result.grossPay).toBe(0);
  });
});
