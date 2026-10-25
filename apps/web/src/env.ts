import { defineEnvVars } from '@sveltejs/kit/env';

// An absent weather key keeps weather disabled, matching the fetcher's missing-key guard.
export const variables = defineEnvVars({
	OPENWEATHER_API_KEY: { schema: (input) => input ?? '' },
	// Media fallback URLs are build-time public values; an absent URL stays empty.
	PUBLIC_DIRECTUS_URL: { public: true, static: true, schema: (input) => input ?? '' },
});
