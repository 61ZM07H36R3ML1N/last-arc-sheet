/** Sourcebook identifiers used by the ability registries. */
export const SOURCEBOOK_IDS = {
  CORE: 'core-v04',
  ATLAS_DTR: 'atlas-dtr-v03',
} as const;

export type SourcebookId = (typeof SOURCEBOOK_IDS)[keyof typeof SOURCEBOOK_IDS];

export interface SourcebookDefinition {
  id: SourcebookId;
  name: string;
  version: string;
  enabledByDefault: boolean;
}

export const SOURCEBOOKS: readonly SourcebookDefinition[] = [
  { id: SOURCEBOOK_IDS.CORE, name: 'Last Arc Corebook', version: 'v0.4', enabledByDefault: true },
  { id: SOURCEBOOK_IDS.ATLAS_DTR, name: 'Last Arc Atlas DTR', version: 'v0.3', enabledByDefault: false },
];

export const DEFAULT_ENABLED_SOURCEBOOKS: ReadonlySet<string> = new Set(
  SOURCEBOOKS.filter((book) => book.enabledByDefault).map((book) => book.id),
);

export function getEnabledSourcebooks(atlasEnabled = false): ReadonlySet<string> {
  const enabled = new Set(DEFAULT_ENABLED_SOURCEBOOKS);
  if (atlasEnabled) enabled.add(SOURCEBOOK_IDS.ATLAS_DTR);
  return enabled;
}
