import { describe, expect, it } from 'vitest';
import { scoreAnswers } from '../../src/modules/quiz/quiz.service';

describe('quiz scoring', () => {
  it('picks the stream with the highest total', () => {
    const result = scoreAnswers([
      { streamWeights: { SCIENCE: 3 } },
      { streamWeights: { SCIENCE: 3, COMMERCE: 1 } },
      { streamWeights: { COMMERCE: 2 } },
    ]);

    expect(result.recommendedStream).toBe('SCIENCE');
    expect(result.scores.SCIENCE).toBe(6);
    expect(result.scores.COMMERCE).toBe(3);
  });

  it('returns percentages that sum to roughly 100', () => {
    const result = scoreAnswers([
      { streamWeights: { SCIENCE: 3 } },
      { streamWeights: { COMMERCE: 3 } },
      { streamWeights: { ARTS: 2 } },
      { streamWeights: { VOCATIONAL: 2 } },
    ]);

    const total = Object.values(result.percentages).reduce((sum, value) => sum + value, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it('flags streams within ten points of the winner as close alternatives', () => {
    const result = scoreAnswers([
      { streamWeights: { SCIENCE: 5 } },
      { streamWeights: { COMMERCE: 5 } },
      { streamWeights: { ARTS: 1 } },
    ]);

    expect(result.closeAlternatives).toContain('COMMERCE');
    expect(result.closeAlternatives).not.toContain('ARTS');
  });

  // streamWeights is authored JSON, so malformed values must not poison totals.
  it('ignores unknown keys and non-numeric values', () => {
    const result = scoreAnswers([
      { streamWeights: { SCIENCE: 3, NOT_A_STREAM: 99 } },
      { streamWeights: { COMMERCE: 'high' } },
      { streamWeights: { ARTS: Number.NaN } },
      { streamWeights: { VOCATIONAL: Infinity } },
    ]);

    expect(result.scores.SCIENCE).toBe(3);
    expect(result.scores.COMMERCE).toBe(0);
    expect(result.scores.ARTS).toBe(0);
    expect(result.scores.VOCATIONAL).toBe(0);
    expect(Number.isFinite(result.percentages.SCIENCE)).toBe(true);
  });

  it('handles non-object weights without throwing', () => {
    expect(() =>
      scoreAnswers([{ streamWeights: null }, { streamWeights: 'x' }, { streamWeights: [1, 2] }]),
    ).not.toThrow();
  });

  it('does not divide by zero when nothing scores', () => {
    const result = scoreAnswers([]);

    expect(result.percentages.SCIENCE).toBe(0);
    expect(result.recommendedStream).toBe('SCIENCE');
  });

  it('resolves ties deterministically', () => {
    const answers = [{ streamWeights: { SCIENCE: 2, COMMERCE: 2 } }];

    expect(scoreAnswers(answers).recommendedStream).toBe(
      scoreAnswers(answers).recommendedStream,
    );
  });
});
