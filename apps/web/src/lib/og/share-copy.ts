// Generic UI invitations. Project copy comes from the content catalog.

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
