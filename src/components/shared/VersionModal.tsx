import { useEffect, useState } from 'react';
import {
  X,
  GitCommit,
  CheckCircle2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  fetchGitHubReleases,
  type AppRelease,
} from '../../services/githubReleases';

declare const __APP_VERSION__: string;

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CACHE_KEY = 'last-arc-release-notes-v1';
const CACHE_TTL = 60 * 60 * 1000;

interface ReleaseCache {
  timestamp: number;
  releases: AppRelease[];
}

const FALLBACK_RELEASES: AppRelease[] = [
  {
    version: 'v0.4.14',
    title: 'Atlas Content Expansion',
    date: 'November 2026',
    body: [
      '- Added 6 new Advanced Classes from the Atlas.',
      '- Added 5 regional sub-races.',
      '- Added 21 new Atlas Technicks.',
      '- Wired Dynamism into Will Defence calculations.',
    ].join('\n'),
  },
  {
    version: 'v0.3.2',
    title: 'Foundry VTT Integration',
    date: 'November 2026',
    body: [
      '- Added two-way Foundry VTT Actor JSON interoperability.',
      '- Added persistent Player Journal and Campaign Notes.',
      '- Improved Break Gauge state management.',
      '- Integrated Armor Check Penalty calculations.',
    ].join('\n'),
  },
];

function readCache(): ReleaseCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !('timestamp' in parsed) ||
      !('releases' in parsed)
    ) {
      return null;
    }

    const cache = parsed as ReleaseCache;

    if (
      typeof cache.timestamp !== 'number' ||
      !Array.isArray(cache.releases) ||
      !cache.releases.every(
        (release) =>
          release &&
          typeof release.version === 'string' &&
          typeof release.title === 'string' &&
          typeof release.date === 'string' &&
          typeof release.body === 'string'
      )
    ) {
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

export default function VersionModal({
  isOpen,
  onClose,
}: VersionModalProps) {
  const [releases, setReleases] = useState<AppRelease[]>(
    () => readCache()?.releases ?? FALLBACK_RELEASES
  );
  const [warning, setWarning] = useState<string | null>(null);

useEffect(() => {
  if (!isOpen) return;

  const cached = readCache();

  // Cached release notes are already loaded by useState.
  // Avoid unnecessary network requests while the cache is fresh.
  if (
    cached &&
    Date.now() - cached.timestamp < CACHE_TTL
  ) {
    return;
  }

  const controller = new AbortController();

  async function loadReleases() {
    try {
      const data = await fetchGitHubReleases(
        controller.signal
      );

      if (controller.signal.aborted) return;

      if (data.length === 0) {
        throw new Error('No published releases found');
      }

      setReleases(data);
      setWarning(null);

      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            releases: data,
          } satisfies ReleaseCache)
        );
      } catch {
        // Storage may be unavailable or full.
      }
    } catch {
      if (!controller.signal.aborted) {
        setWarning(
          'Live release notes unavailable. Showing saved notes.'
        );
      }
    }
  }

void loadReleases();

  return () => controller.abort();
}, [isOpen]);

// Do not render the modal when it is closed.
if (!isOpen) return null;

const currentVersion = `v${__APP_VERSION__.replace(/^v/, '')}`;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="bg-arc-card border border-arc-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs text-slate-200">

        <div className="p-3.5 border-b border-arc-border flex items-center justify-between bg-arc-bg/50">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wide">
            <GitCommit size={15} className="text-arc-accent" />
            <span>App Version &amp; Update Notes</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close version notes"
            className="text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">

          {warning && (
            <p role="status" className="text-amber-400 text-[11px]">
              {warning}
            </p>
          )}

          {releases.map((release) => {
            const isCurrent =
              release.version === currentVersion;

            return (
              <div
                key={release.version}
                className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-arc-accent text-sm">
                    {release.version}
                    {isCurrent ? ' (Current)' : ''}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {release.date}
                  </span>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed text-slate-300 [&_ul]:space-y-1.5 [&_ol]:space-y-1.5 [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-sm [&_h3]:font-bold [&_h4]:font-bold [&_strong]:text-slate-100 [&_a]:text-arc-accent [&_a]:underline [&_code]:break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      li: ({ children }) => (
                        <li className="flex items-start gap-1.5">
                          <CheckCircle2
                            size={12}
                            className="text-emerald-400 shrink-0 mt-0.5"
                          />
                          <span className="min-w-0">{children}</span>
                        </li>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-arc-accent underline"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {release.body}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-arc-border bg-arc-bg/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-arc-card border border-arc-border hover:bg-arc-cardHover text-slate-300 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}