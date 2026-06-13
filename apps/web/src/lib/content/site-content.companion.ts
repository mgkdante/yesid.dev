// Hand-written companion to the CMS-derived `site-content.ts` (slice-18m).
// Holds en-only decorative chrome that doesn't fit any CMS port today.
//
// To CMS-manage these later, add `block_footer_chrome` + `block_related_projects_strip`
// collections and pipe through the export-fallbacks generator. Until then, edit here.

import type { LocalizedString } from '$lib/types';

/** Labels for the "built with this" strip that appears under FeaturedProjects
 *  on the home page (also reused by the RelatedProjects component). */
export const relatedProjectsStripContent = {
	builtWithLabel: { en: 'Built with this', fr: 'Bâti avec ça' } satisfies LocalizedString,
	projectCount: {
		singular: { en: 'project', fr: 'projet' } satisfies LocalizedString,
		plural: { en: 'projects', fr: 'projets' } satisfies LocalizedString,
	},
} as const;

/** Site footer chrome copy. Extracted from Footer.svelte in Task 17b-7j.
 *  Kept en-only; the tagline is decorative brand chrome ("// digital
 *  infrastructure") and the status prefix is mono terminal styling. */
export const footerContent = {
	/** Brand tagline under the wordmark — mono decorative line. */
	tagline: {
		en: '// digital infrastructure',
		fr: '// infrastructure numérique',
	} satisfies LocalizedString,
	/** Middle column address line. Uses middot (·) separator — template left
	 *  as a single string because the separator is a typographic concern. */
	location: { en: 'Montreal, QC · Remote', fr: 'Montréal, QC · À distance' } satisfies LocalizedString,
	/** Status bar prefix before the system date — template `· {date}` is
	 *  assembled at the call site. */
	statusPrefix: { en: 'system online ·', fr: 'système en ligne ·' } satisfies LocalizedString,
} as const;
