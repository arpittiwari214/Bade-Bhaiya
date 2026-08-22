import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatCurrency, formatDeadline, formatDuration, formatRange } from './format';

describe('formatCurrency', () => {
  it('uses Indian lakh and crore units', () => {
    expect(formatCurrency(100_000)).toBe('₹1 L');
    expect(formatCurrency(1_250_000)).toBe('₹12.5 L');
    expect(formatCurrency(10_000_000)).toBe('₹1 Cr');
  });

  it('uses thousands below a lakh', () => {
    expect(formatCurrency(5_000)).toBe('₹5K');
    expect(formatCurrency(12_500)).toBe('₹12.5K');
  });

  it('shows small amounts in full', () => {
    expect(formatCurrency(750)).toBe('₹750');
  });

  // A government college course genuinely can be free, and "₹0" reads as an
  // error to a user scanning fees.
  it('renders zero as Free', () => {
    expect(formatCurrency(0)).toBe('Free');
  });

  it('handles missing values without throwing', () => {
    expect(formatCurrency(null)).toBe('Not listed');
    expect(formatCurrency(undefined)).toBe('Not listed');
  });
});

describe('formatRange', () => {
  it('renders a two-sided range', () => {
    expect(formatRange(100_000, 500_000)).toBe('₹1 L – ₹5 L');
  });

  it('collapses an equal range to one value', () => {
    expect(formatRange(100_000, 100_000)).toBe('₹1 L');
  });

  it('handles one-sided ranges', () => {
    expect(formatRange(100_000, null)).toBe('From ₹1 L');
    expect(formatRange(null, 500_000)).toBe('Up to ₹5 L');
    expect(formatRange(null, null)).toBe('Not listed');
  });
});

describe('formatDeadline', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function atFixedTime(run: () => void) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    run();
  }

  it('flags a passed deadline', () => {
    atFixedTime(() => {
      expect(formatDeadline('2026-06-01T10:00:00Z').urgency).toBe('past');
    });
  });

  it('flags deadlines within a week as urgent', () => {
    atFixedTime(() => {
      const result = formatDeadline('2026-06-19T10:00:00Z');
      expect(result.urgency).toBe('urgent');
      expect(result.label).toContain('4 days');
    });
  });

  it('names today and tomorrow rather than counting days', () => {
    atFixedTime(() => {
      expect(formatDeadline('2026-06-15T18:00:00Z').label).toBe('Closes today');
      expect(formatDeadline('2026-06-16T18:00:00Z').label).toBe('Closes tomorrow');
    });
  });

  it('treats a distant deadline as later', () => {
    atFixedTime(() => {
      expect(formatDeadline('2026-12-01T10:00:00Z').urgency).toBe('later');
    });
  });

  it('handles a missing or unparseable date', () => {
    expect(formatDeadline(null).label).toBe('No deadline listed');
    expect(formatDeadline('not-a-date').label).toBe('No deadline listed');
  });
});

describe('formatDuration', () => {
  it('singularises one year', () => {
    expect(formatDuration(1)).toBe('1 year');
    expect(formatDuration(3)).toBe('3 years');
  });

  it('keeps fractional durations', () => {
    expect(formatDuration(1.5)).toBe('1.5 years');
  });
});
