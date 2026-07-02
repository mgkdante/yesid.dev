// NavLink / MenuItem / ErrorPageContent moved to @repo/shared types
// (site-hardening-a-plus) so the cms nav fetcher and the shared nav schema
// share one contract. Re-exported here for existing $lib/navigation/types
// importers.
export type { NavLink, MenuItem, ErrorPageContent } from '@repo/shared';
