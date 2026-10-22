export type OgType = 'blog' | 'project';
export type OgLocale = 'en' | 'fr' | 'es';

export interface ParsedOgSlugParam {
	baseSlug: string;
	locale: OgLocale;
}

export const OG_BASE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const OG_PROJECT_PARAM_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)(?:\.(fr|es))?$/;
export const OG_BLOG_PARAM_RE = /^([a-z0-9]+(?:-[a-z0-9]+)*)$/;

const OG_PREFIX = '/og/';
const PNG_EXTENSION = '.png';

export function ogSlugParam(type: OgType, baseSlug: string, locale: OgLocale): string {
	if (!OG_BASE_SLUG_RE.test(baseSlug)) {
		throw new Error(
			`[og] unencodable slug for ${type}: "${baseSlug}" — must match /^[a-z0-9]+(?:-[a-z0-9]+)*$/`,
		);
	}
	if (type === 'blog' || locale === 'en') return baseSlug;
	return `${baseSlug}.${locale}`;
}

export function ogImagePath(type: OgType, baseSlug: string, locale: OgLocale): string {
	return OG_PREFIX + type + '/' + ogSlugParam(type, baseSlug, locale) + PNG_EXTENSION;
}

export function parseOgSlugParam(
	type: OgType,
	param: string,
): ParsedOgSlugParam | null {
	if (type === 'blog') {
		const match = param.match(OG_BLOG_PARAM_RE);
		if (!match) return null;
		// Blog locale is carried by the localized slug itself, not a suffix.
		return { baseSlug: match[1]!, locale: 'en' };
	}

	const match = param.match(OG_PROJECT_PARAM_RE);
	if (!match) return null;
	return {
		baseSlug: match[1]!,
		locale: (match[2] ?? 'en') as OgLocale,
	};
}
