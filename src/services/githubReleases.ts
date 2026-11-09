export interface AppRelease {
  version: string;
  title: string;
  date: string;
  body: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string | null;
  draft: boolean;
  prerelease: boolean;
}

const RELEASES_URL =
  'https://api.github.com/repos/61ZM07H36R3ML1N/last-arc-sheet/releases?per_page=20';

export async function fetchGitHubReleases(
  signal?: AbortSignal
): Promise<AppRelease[]> {
  const response = await fetch(RELEASES_URL, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub releases request failed: ${response.status}`);
  }

  const releases: GitHubRelease[] = await response.json();

  if (!Array.isArray(releases)) {
    throw new Error('Invalid GitHub releases response');
  }

  return releases
    .filter(
      (release) =>
        !release.draft &&
        !release.prerelease &&
        /^v?\d+\.\d+\.\d+$/.test(release.tag_name)
    )
    .map((release) => ({
      version: release.tag_name.startsWith('v')
        ? release.tag_name
        : `v${release.tag_name}`,
      title: release.name || release.tag_name,
      date: release.published_at
        ? new Date(release.published_at).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })
        : 'Release date unavailable',
      body: release.body || 'No release notes provided.',
    }));
}