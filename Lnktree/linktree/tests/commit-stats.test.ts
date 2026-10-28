import { describe, it, expect } from 'vitest';
import { computeStats, type RepoCommit } from '../src/typescript/modules/commits';

// Commits are bucketed relative to the NEWEST commit, not to "now" — the
// GitHub response is already sorted newest-first and a repo that has been
// quiet for a month should still render its history, not twelve empty bars.
function commit(date: string, author = 'Diego'): RepoCommit {
  return { sha: date.slice(8, 10), message: 'x', author, date, url: '#' };
}

describe('computeStats', () => {
  it('counts commits, authors and the busiest day', () => {
    const stats = computeStats([
      commit('2026-08-10T10:00:00Z'),
      commit('2026-08-10T14:00:00Z'),
      commit('2026-08-09T10:00:00Z', 'Someone Else'),
    ]);

    expect(stats.total).toBe(3);
    expect(stats.authors).toEqual([
      { name: 'Diego', count: 2 },
      { name: 'Someone Else', count: 1 },
    ]);
    expect(stats.busiestDay).toEqual({ day: '2026-08-10', count: 2 });
  });

  it('buckets weekly activity oldest-first, with the newest commit in the last bucket', () => {
    const stats = computeStats([
      commit('2026-08-10T10:00:00Z'), // newest → "now"
      commit('2026-08-01T10:00:00Z'), // 9 days earlier → one bucket back
    ]);

    const last = stats.activity[stats.activity.length - 1]!;
    expect(last.label).toBe('now');
    expect(last.count).toBe(1);
    expect(stats.activity.reduce((sum, a) => sum + a.count, 0)).toBe(2);
  });

  it('never divides by zero when every commit lands on the same day', () => {
    const stats = computeStats([
      commit('2026-08-10T10:00:00Z'),
      commit('2026-08-10T11:00:00Z'),
    ]);

    expect(stats.spanDays).toBe(1);
    expect(Number.isFinite(Number(stats.perWeek))).toBe(true);
  });
});
