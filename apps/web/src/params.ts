// @migration-task 'src/params' contains entries that are not parameter matchers (ogType.test.ts) and was left in place - migrate them and delete the directory manually
import { defineParams } from '@sveltejs/kit/params';
import { isPrefixLocale } from '#lib/utils/locale-routing.js';

// SvelteKit matcher for the optional [[lang=locale]] segment. Accepts ONLY
// locales that are routable as prefixes (never 'en' — EN is unprefixed; a
// match here would shadow every single-segment page like /about).
// Runs on server and client; single source of truth is isPrefixLocale.
const matchLocale = (value: string) => isPrefixLocale(value);

// SvelteKit param matcher for the OG endpoint's `type` segment.
// Restricts /og/[type]/... to known content types.
const matchOgType = (value: string) => value === 'blog' || value === 'project';

export const params = defineParams({
	locale: (param) => (matchLocale(param) ? param : undefined),
	ogType: (param) => (matchOgType(param) ? param : undefined)
});
