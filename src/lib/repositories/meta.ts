// Site-meta repository. `getPersonSchema()` composes adapter data with the
// pure JSON-LD builder — the one permitted bit of "work" a repository does.
// Zod will later slot in before `buildPersonSchema` if SiteMeta needs runtime
// validation (Slice 17c).

import { adapter } from '$lib/adapters';
import { buildPersonSchema } from '$lib/utils/json-ld';
import type { SiteMeta } from '$lib/types';

export async function getSiteMeta(): Promise<SiteMeta> {
	return adapter.meta.site();
}

export async function getPersonSchema(): Promise<string> {
	const meta = await adapter.meta.site();
	return buildPersonSchema(meta);
}
