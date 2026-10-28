'use strict';
(async function updateCommitDate() {
  const label = document.getElementById('last-updated');
  if (!label) return;
  const repo = 'https://github.com/dhruv-slog/my-site';
  const cacheKey = 'slog:my-site:latest-commit:v1';
  const ttl = 10 * 60 * 1000;
  const valid = data => data && /^[a-f0-9]{40}$/i.test(data.sha) &&
    typeof data.date === 'string' && Number.isFinite(Date.parse(data.date));
  function render(data, cached = false) {
    const link = document.createElement('a');
    const time = document.createElement('time');
    time.dateTime = data.date;
    time.textContent = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(new Date(data.date));
    link.href = `${repo}/commit/${data.sha}`;
    link.title = 'Latest commit on the repository’s default branch';
    link.append(time);
    label.replaceChildren('last updated on: ', link);
    if (cached) label.append(' (last checked)');
  }
  let cached;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch {}
  if (valid(cached)) {
    render(cached, true);
    const age = Date.now() - cached.checkedAt;
    if (Number.isFinite(age) && age >= 0 && age < ttl) { render(cached); return; }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch('https://api.github.com/repos/dhruv-slog/my-site/commits?per_page=1', {
      signal: controller.signal,
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error('GitHub unavailable');
    const commits = await response.json();
    const data = { sha: commits[0]?.sha, date: commits[0]?.commit?.committer?.date, checkedAt: Date.now() };
    if (!valid(data)) throw new Error('No valid commit date');
    render(data);
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
  } catch {
    // Keep the last known commit, or the original link when no date is available.
  } finally { clearTimeout(timeout); }
})();
