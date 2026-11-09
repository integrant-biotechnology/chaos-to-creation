import { execFileSync } from 'node:child_process';

/**
 * A page's <lastmod> is the date of the last commit that touched any of its
 * source files — not the build date, which would claim every page changed on
 * every deploy and teach crawlers to ignore the field.
 *
 * Fails the build instead of guessing: a shallow clone would report the one
 * fetched commit's date for every file (CI must check out with
 * fetch-depth: 0), and a file with no history means a typo in pages.json.
 */
const git = (...args: string[]) =>
  execFileSync('git', args, { encoding: 'utf8' }).trim();

let checked = false;
function assertFullHistory() {
  if (checked) return;
  if (git('rev-parse', '--is-shallow-repository') === 'true') {
    throw new Error(
      'Shallow git clone: sitemap <lastmod> needs full history (actions/checkout fetch-depth: 0).',
    );
  }
  checked = true;
}

export function lastCommitDate(sources: string[]): string {
  assertFullHistory();
  const date = git('log', '-1', '--format=%cI', '--', ...sources);
  if (!date) {
    throw new Error(`No git history for ${sources.join(', ')} — check "sources" in src/data/pages.json.`);
  }
  return date;
}
