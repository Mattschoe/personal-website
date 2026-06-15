import {
  getGithubActivity,
  flattenDays,
  levelThresholds,
  cellLevel,
  type GithubActivity,
} from '../data/github-activity';
import styles from './WhatImUpTo.module.css';

// Homepage "What I'm up to" section: this month's commit timeline + the
// last-year contribution heatmap, restyled into the site palette. Data is the
// build-time snapshot (src/data/github-activity.json); the component takes it as
// an optional prop so tests can pass a fixture without mocking the import.

const GITHUB_PROFILE = 'https://github.com/Mattschoe';

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function weekday(isoDate: string): number {
  // UTC so the weekday row matches the date GitHub bucketed it under.
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Month abbreviation to show above a week column, or '' when unchanged. */
function monthLabels(weeks: GithubActivity['calendar']['weeks']): string[] {
  let prev = -1;
  return weeks.map((w) => {
    const first = w.days[0];
    if (!first) return '';
    const month = new Date(`${first.date}T00:00:00Z`).getUTCMonth();
    if (month === prev) return '';
    prev = month;
    return MONTH_ABBR[month] ?? '';
  });
}

export function WhatImUpTo({ data = getGithubActivity() }: { data?: GithubActivity }) {
  const { calendar, month } = data;
  const days = flattenDays(calendar);
  const thresholds = levelThresholds(days);
  const labels = monthLabels(calendar.weeks);

  const repoCount = month.repositories.length;
  const maxCommits = Math.max(1, ...month.repositories.map((r) => r.commits));

  return (
    <section className="section container" aria-labelledby="up-to-heading">
      <div className="section-head">
        <div>
          <h2 id="up-to-heading">What I&apos;m up to</h2>
        </div>
        <a className="arrow-link" href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
          GitHub <span className="ar">&#8599;</span>
        </a>
      </div>

      <div className={styles.layout}>
        {/* ---- This month's commit timeline ---- */}
        <div className={styles.timeline}>
          <span className="kicker">{month.label}</span>
          {repoCount === 0 ? (
            <p className={styles.summary}>No commits yet this month.</p>
          ) : (
            <>
              <p className={styles.summary}>
                Created <strong>{month.totalCommits}</strong>{' '}
                {plural(month.totalCommits, 'commit', 'commits')} in <strong>{repoCount}</strong>{' '}
                {plural(repoCount, 'repository', 'repositories')}
              </p>
              <ul className={styles.repos}>
                {month.repositories.map((repo) => (
                  <li className={styles.repo} key={repo.name}>
                    <div className={styles.repoText}>
                      <a
                        className={styles.repoLink}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {repo.name}
                      </a>
                      <span className={styles.repoCount}>
                        {repo.commits} {plural(repo.commits, 'commit', 'commits')}
                      </span>
                    </div>
                    <div className={styles.bar} aria-hidden="true">
                      <div
                        className={styles.barFill}
                        style={{ width: `${(repo.commits / maxCommits) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ---- Last-year contribution heatmap ---- */}
        <div className={styles.heatmapBlock}>
          <p className={styles.heatmapTotal}>
            <strong>{calendar.totalContributions.toLocaleString('en-US')}</strong> contributions in
            the last year
          </p>
          <div
            className={styles.heatmapScroll}
            role="img"
            aria-label={`Contribution heatmap: ${calendar.totalContributions.toLocaleString('en-US')} contributions in the last year`}
          >
            <div className={styles.months} aria-hidden="true">
              {labels.map((label, i) => (
                <span key={i} className={styles.month}>
                  {label}
                </span>
              ))}
            </div>
            <div className={styles.grid}>
              {calendar.weeks.map((week, wi) => (
                <div className={styles.week} key={wi}>
                  {week.days.map((day) => (
                    <div
                      key={day.date}
                      className={styles.cell}
                      data-level={cellLevel(day.count, thresholds)}
                      style={{ gridRow: weekday(day.date) + 1 }}
                      title={`${day.count} ${plural(day.count, 'contribution', 'contributions')} on ${day.date}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
