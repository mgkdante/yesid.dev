import type { Locale, LocalizedString } from '#lib/types.ts';

// Display copy only. CMS tag IDs remain the filter and content identities.
const topics: Record<string, LocalizedString> = {
	ai: { en: 'AI', fr: 'IA', es: 'IA' },
	'ai-assisted-development': { en: 'AI-assisted development', fr: "Développement assisté par l’IA", es: 'Desarrollo asistido por IA' },
	cms: { en: 'Content management', fr: 'Gestion de contenu', es: 'Gestión de contenido' },
	directus: { en: 'Directus', fr: 'Directus', es: 'Directus' },
	'e-commerce': { en: 'E-commerce', fr: 'Commerce en ligne', es: 'Comercio electrónico' },
	learning: { en: 'Learning', fr: 'Apprentissage', es: 'Aprendizaje' },
	'personal-story': { en: 'Personal story', fr: 'Récit personnel', es: 'Historia personal' },
	'software-architecture': { en: 'Software architecture', fr: 'Architecture logicielle', es: 'Arquitectura de software' },
	sveltekit: { en: 'SvelteKit', fr: 'SvelteKit', es: 'SvelteKit' },
	'systems-thinking': { en: 'Systems thinking', fr: 'Pensée systémique', es: 'Pensamiento sistémico' },
	'transit-data': { en: 'Transit data', fr: 'Données de transport collectif', es: 'Datos de transporte público' },
	'web-development': { en: 'Web development', fr: 'Développement Web', es: 'Desarrollo web' },
};

export function topicLabel(slug: string, locale: Locale): string {
	return topics[slug]?.[locale] ?? slug.replaceAll('-', ' ');
}
