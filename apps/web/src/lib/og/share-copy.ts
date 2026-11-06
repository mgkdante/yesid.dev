// Code-owned share copy: what each card invites people to do, and the short
// project lines. Every call to action names where the link actually lands.

import type { OgCtaTone } from './card';

export type ShareLocale = 'en' | 'fr' | 'es';
export type LocalizedShareCopy = Record<ShareLocale, string>;

export interface ShareCta {
	label: LocalizedShareCopy;
	tone: OgCtaTone;
}

export const SHARE_CTA = {
	home: { tone: 'conversion', label: { en: 'Book a call', fr: 'Réserver un appel', es: 'Agenda una llamada' } },
	contact: { tone: 'conversion', label: { en: 'Get in touch', fr: 'Écris-moi', es: 'Escríbeme' } },
	about: { tone: 'action', label: { en: 'Meet Yesid', fr: 'Rencontre Yesid', es: 'Conoce a Yesid' } },
	services: { tone: 'action', label: { en: 'See the services', fr: 'Voir les services', es: 'Ver los servicios' } },
	service: { tone: 'action', label: { en: 'See what’s included', fr: 'Voir ce qui est inclus', es: 'Ver qué incluye' } },
	projects: { tone: 'action', label: { en: 'See how I build', fr: 'Vois comment je bâtis', es: 'Mira cómo construyo' } },
	project: { tone: 'action', label: { en: 'See the case study', fr: 'Voir l’étude de cas', es: 'Ver el caso de estudio' } },
	blog: { tone: 'action', label: { en: 'Read the article', fr: 'Lire l’article', es: 'Leer el artículo' } },
} as const satisfies Record<string, ShareCta>;

/** One line per public project, short enough to read on a card in a feed. */
const PROJECT_TAGLINES: Readonly<Record<string, LocalizedShareCopy>> = {
	'transit-data-pipeline': {
		en: 'Live bus positions and reliability history for Montréal and Ottawa.',
		fr: 'Position des autobus en direct et historique de fiabilité à Montréal et Ottawa.',
		es: 'Posiciones de autobuses en vivo e historial de fiabilidad en Montreal y Ottawa.',
	},
	'cafe-arona': {
		en: 'A bilingual website the family manages from Shopify.',
		fr: 'Un site bilingue que la famille gère depuis Shopify.',
		es: 'Un sitio bilingüe que la familia administra desde Shopify.',
	},
	'yesid-dev-design': {
		en: 'One visual foundation, room for different products.',
		fr: 'Une base visuelle commune, une place pour chaque produit.',
		es: 'Una base visual común, espacio para cada producto.',
	},
	'yesid-dev': {
		en: 'My professional site in English, French and Spanish.',
		fr: 'Mon site professionnel en français, en anglais et en espagnol.',
		es: 'Mi sitio profesional en español, inglés y francés.',
	},
};

export function projectTagline(slug: string, locale: ShareLocale): string | undefined {
	return PROJECT_TAGLINES[slug]?.[locale];
}

/** The project page's description: its line plus the invitation on its card. */
export function projectShareDescription(slug: string): LocalizedShareCopy | undefined {
	const tagline = PROJECT_TAGLINES[slug];
	if (!tagline) return undefined;
	const describe = (locale: ShareLocale) => `${tagline[locale]} ${SHARE_CTA.project.label[locale]}.`;
	return { en: describe('en'), fr: describe('fr'), es: describe('es') };
}

const DESCRIPTION_MAX_LENGTH = 200;
const straightApostrophes = (text: string) => text.replaceAll('’', "'");

/**
 * Closes CMS copy with the invitation, so authors only write the hook. Keeps copy that
 * already ends with it, and copy with no room left: sentences are never cut to fit.
 */
export function withShareCta(text: string, label: string): string {
	const trimmed = text.trim();
	const invitation = `${label}.`;
	if (straightApostrophes(trimmed).endsWith(straightApostrophes(invitation))) return trimmed;
	const sentence = /[.!?…]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
	const invited = `${sentence} ${invitation}`;
	return invited.length <= DESCRIPTION_MAX_LENGTH ? invited : trimmed;
}

/** {@link withShareCta} for each language the copy has. */
export function inviteLocalized<Copy extends { en: string; fr?: string; es?: string }>(
	copy: Copy,
	label: LocalizedShareCopy,
): Copy {
	return {
		...copy,
		en: withShareCta(copy.en, label.en),
		...(copy.fr !== undefined && { fr: withShareCta(copy.fr, label.fr) }),
		...(copy.es !== undefined && { es: withShareCta(copy.es, label.es) }),
	};
}
