// Build-time fetcher for the homepage "What I'm up to" section.
//
// Queries GitHub's GraphQL API for one user's contribution calendar (last 365
// days → heatmap) and this month's commit activity per repository (→ timeline),
// normalises the response, and writes src/data/github-activity.json.
//
// The site is static (no runtime server), so this runs in CI before the image
// build and bakes the data into the prerendered HTML. It is robust by design:
// on ANY failure — no token, network error, rate limit, or an empty/zero
// response — it logs a warning, leaves the committed snapshot untouched, and
// exits 0. The build never breaks and never ships an empty graph.
//
// Auth: process.env.GITHUB_ACTIVITY_TOKEN (CI passes secrets.GITHUB_TOKEN).
// Counts reflect PUBLIC contributions only with that token.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOGIN = 'Mattschoe';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'github-activity.json');

const QUERY = `
query($login:String!, $yearFrom:DateTime!, $monthFrom:DateTime!, $to:DateTime!){
  user(login:$login){
    year: contributionsCollection(from:$yearFrom, to:$to){
      contributionCalendar{
        totalContributions
        weeks{ contributionDays{ date contributionCount } }
      }
    }
    month: contributionsCollection(from:$monthFrom, to:$to){
      totalCommitContributions
      commitContributionsByRepository(maxRepositories:10){
        repository{ nameWithOwner url }
        contributions{ totalCount }
      }
    }
  }
}`;

/** Fail soft: warn and exit 0 so the build keeps the committed snapshot. */
function bail(message) {
  console.warn(`[github-activity] ${message} — keeping existing snapshot.`);
  process.exit(0);
}

const token = process.env.GITHUB_ACTIVITY_TOKEN;
if (!token) bail('no GITHUB_ACTIVITY_TOKEN in env');

const to = new Date();
const yearFrom = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);
const monthFrom = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));

let payload;
try {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': `${LOGIN}-personal-website`,
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        login: LOGIN,
        yearFrom: yearFrom.toISOString(),
        monthFrom: monthFrom.toISOString(),
        to: to.toISOString(),
      },
    }),
  });
  if (!res.ok) bail(`HTTP ${res.status} from GitHub`);
  payload = await res.json();
} catch (err) {
  bail(`request failed: ${err.message}`);
}

if (payload.errors?.length) bail(`GraphQL errors: ${payload.errors.map((e) => e.message).join('; ')}`);

const user = payload.data?.user;
const calendar = user?.year?.contributionCalendar;
if (!calendar?.weeks?.length || !calendar.totalContributions) {
  bail('empty or zero contribution calendar');
}

const month = user.month;
const repositories = (month.commitContributionsByRepository ?? [])
  .map((r) => ({
    name: r.repository.nameWithOwner,
    url: r.repository.url,
    commits: r.contributions.totalCount,
  }))
  .sort((a, b) => b.commits - a.commits);

const monthLabel = monthFrom.toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const out = {
  generatedAt: to.toISOString(),
  login: LOGIN,
  calendar: {
    totalContributions: calendar.totalContributions,
    weeks: calendar.weeks.map((w) => ({
      days: w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })),
    })),
  },
  month: {
    label: monthLabel,
    totalCommits: month.totalCommitContributions ?? 0,
    repositories,
  },
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `[github-activity] wrote ${OUT}: ${out.calendar.totalContributions} contributions, ` +
    `${out.month.totalCommits} commits in ${repositories.length} repos this month.`,
);
