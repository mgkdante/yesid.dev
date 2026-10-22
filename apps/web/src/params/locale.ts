import type { ParamMatcher } from '@sveltejs/kit';
import { isPrefixLocale } from '$lib/utils/locale-routing';

// SvelteKit matcher for the optional [[lang=locale]] segment. Accepts ONLY
// locales that are routable as prefixes (never 'en' — EN is unprefixed; a
// match here would shadow every single-segment page like /about).
// Runs on server and client; single source of truth is isPrefixLocale.
export const match: ParamMatcher = (value) => isPrefixLocale(value);
