// Typed loader + pure derivations for the homepage "What I'm up to" section.
//
// The JSON is produced at build time by scripts/fetch-github-activity.mjs and
// committed as a fallback so dev/test/offline builds always have data. This
// module only reads it — no Node/filesystem access — so it's safe in the client
// graph and prerenders to static HTML.

import raw from './github-activity.json';

export interface CalendarDay {
  date: string;
  count: number;
}

export interface MonthRepo {
  name: string;
  url: string;
  commits: number;
}

export interface GithubActivity {
  generatedAt: string;
  login: string;
  calendar: {
    totalContributions: number;
    weeks: { days: CalendarDay[] }[];
  };
  month: {
    label: string;
    totalCommits: number;
    repositories: MonthRepo[];
  };
}

/** The build-time snapshot, typed. */
export function getGithubActivity(): GithubActivity {
  return raw as GithubActivity;
}

/** All days in calendar order (column by column, as GitHub renders them). */
export function flattenDays(calendar: GithubActivity['calendar']): CalendarDay[] {
  return calendar.weeks.flatMap((w) => w.days);
}

/**
 * Quartile boundaries [t1, t2, t3] over the *nonzero* day counts. Using the
 * distribution (not a linear split of the max) keeps a single huge day from
 * collapsing every other day to the lowest level — matching GitHub's spread.
 * Returns [1, 1, 1] when there's no activity so cellLevel still behaves.
 */
export function levelThresholds(days: CalendarDay[]): [number, number, number] {
  const nonzero = days
    .map((d) => d.count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b);
  if (nonzero.length === 0) return [1, 1, 1];
  const at = (p: number) => nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))] ?? 1;
  return [at(0.25), at(0.5), at(0.75)];
}

/**
 * Intensity level 0–4 for one day. 0 = no contributions; 1–4 step up through
 * the quartile thresholds. The component maps each level to an accent tint.
 */
export function cellLevel(count: number, [t1, t2, t3]: [number, number, number]): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= t1) return 1;
  if (count <= t2) return 2;
  if (count <= t3) return 3;
  return 4;
}
