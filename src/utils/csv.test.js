import { describe, it, expect } from 'vitest';
import { parseCsvText, csvEscape, toCsv } from './csv.js';

describe('parseCsvText', () => {
  it('parses a simple header + data rows', () => {
    const rows = parseCsvText('name,email\nJohn Doe,john@acme.com\n');
    expect(rows).toEqual([
      ['name', 'email'],
      ['John Doe', 'john@acme.com'],
    ]);
  });

  it('handles quoted fields containing commas', () => {
    const rows = parseCsvText('name,note\n"Doe, John","Says ""hi"""\n');
    expect(rows).toEqual([
      ['name', 'note'],
      ['Doe, John', 'Says "hi"'],
    ]);
  });

  it('handles Windows-style CRLF line endings', () => {
    const rows = parseCsvText('a,b\r\n1,2\r\n');
    expect(rows).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('drops trailing blank lines rather than returning an empty row', () => {
    const rows = parseCsvText('a,b\n1,2\n\n');
    expect(rows).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('returns an empty array for empty input', () => {
    expect(parseCsvText('')).toEqual([]);
  });
});

describe('csvEscape', () => {
  it('leaves plain values untouched', () => {
    expect(csvEscape('Engineering')).toBe('Engineering');
    expect(csvEscape(500000)).toBe('500000');
  });

  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    expect(csvEscape('Doe, John')).toBe('"Doe, John"');
    expect(csvEscape('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('treats null/undefined as an empty string', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

describe('toCsv', () => {
  it('round-trips through parseCsvText for values needing escaping', () => {
    const csv = toCsv(['Name', 'Dept'], [['Doe, John', 'R&D'], ['Plain', 'Sales']]);
    expect(parseCsvText(csv)).toEqual([
      ['Name', 'Dept'],
      ['Doe, John', 'R&D'],
      ['Plain', 'Sales'],
    ]);
  });
});
