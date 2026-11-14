import { siteLabels } from '#lib/content/index.ts';
import type { Locale, LocalizedString } from '#lib/types.ts';

// Display copy only. CMS tag IDs remain the filter and content identities.
const topics: Record<string, LocalizedString> = siteLabels.ui.topics;

export function topicLabel(slug: string, locale: Locale): string {
	return topics[slug]?.[locale] ?? slug.replaceAll('-', ' ');
}
