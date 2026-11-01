import type { CmsClient } from '../../scripts/lib/fetchers/types';
import type { FetchFn } from '../../scripts/lib/queued-fetch';

/** A `globalThis.fetch` replacement that keeps Bun's `fetch.preconnect`. */
export function fetchDouble(impl: FetchFn): typeof fetch {
	return Object.assign(impl, { preconnect: fetch.preconnect });
}

/**
 * A CMS client whose every request resolves to `respond()`. The double ignores
 * the command, so it cannot know the requested output type; the caller's
 * canned rows stand in for it the way live JSON does.
 */
export function cmsClientDouble(respond: () => unknown): CmsClient {
	return { request: async <Output>() => respond() as Output };
}
