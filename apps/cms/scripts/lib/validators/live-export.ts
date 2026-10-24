/** Live editorial contracts ported verbatim from the served legal-truth tests. */
import type { ExportData } from '../../export-data';
import { PageSeoSchema } from '../../../../web/src/lib/schemas/seo';

type Locale = 'en' | 'fr' | 'es';

const CONSENT_DESCRIPTIONS: Record<Locale, string> = {
	en: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
	fr: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
	es: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
};

const LEGAL_CLAUSES: Record<Locale, string> = {
	en: "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
	fr: 'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
	es: 'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
};

const ANALYTICS_MODE_TRUTH: Record<Locale, readonly string[]> = {
	en: [
		'When Plausible is disabled, the site makes no analytics requests and sends no pageviews or conversion events. The Analytics preferences control is absent from the footer, and any analytics choice already stored in your browser remains there but is dormant.',
		'With the default consent banner, no Plausible request runs until you choose Allow analytics.',
		'If I enable analytics without the banner, cookieless Plausible starts for visitors without a saved decline; a saved decline remains untracked.',
		'The Analytics preferences control is available in the footer whenever analytics is enabled. Opening it pauses future measurement and shows the choice. Allow analytics resumes measurement; No thanks records a decline.',
		'Withdrawing consent stops future analytics requests and events. Aggregate data already sent cannot be tied back to you or selectively removed.',
		"Plausible itself sets no cookies, uses no browser storage, and creates no persistent cross-site identifier. yesid.dev stores your analytics choice in your browser's localStorage.",
		'Explicit consent is the documented default. I use the no-banner mode only after deciding to do so and obtaining legal-advisor review.',
	],
	fr: [
		"Lorsque Plausible est désactivé, le site ne fait aucune requête d'analytique et n'envoie aucune page vue ni aucun événement de conversion. Le contrôle Préférences d'analytique est absent du pied de page, et tout choix d'analytique déjà conservé dans votre navigateur y reste, mais demeure inactif.",
		"Avec la bannière de consentement offerte par défaut, aucune requête n'est envoyée à Plausible avant que vous choisissiez Autoriser l'analytique.",
		"Si j'active l'analytique sans la bannière, Plausible sans témoins démarre pour les personnes qui n'ont pas enregistré de refus; un refus enregistré continue d'empêcher toute mesure.",
		"Le contrôle Préférences d'analytique est disponible dans le pied de page lorsque l'analytique est activée. L'ouvrir suspend toute mesure future et affiche le choix. Autoriser l'analytique reprend la mesure; Non merci enregistre un refus.",
		"Retirer votre consentement arrête les futures requêtes et les futurs événements d'analytique. Les données agrégées déjà envoyées ne peuvent pas être rattachées à vous ni retirées sélectivement.",
		"Plausible lui-même n'installe aucun témoin, n'utilise pas le stockage du navigateur et ne crée aucun identifiant persistant entre les sites. yesid.dev conserve votre choix d'analytique dans le localStorage de votre navigateur.",
		"Le consentement explicite demeure le mode documenté par défaut. Je n'utilise le mode sans bannière qu'après avoir décidé de le faire et obtenu l'avis d'un conseiller juridique.",
	],
	es: [
		'Cuando Plausible está desactivado, el sitio no hace solicitudes de analítica ni envía páginas vistas o eventos de conversión. El control Preferencias de analítica no aparece en el pie de página, y cualquier elección de analítica ya guardada en su navegador permanece allí, pero queda inactiva.',
		'Con el banner de consentimiento predeterminado, no se envía ninguna solicitud a Plausible hasta que usted elige Permitir analítica.',
		'Si activo la analítica sin el banner, Plausible sin cookies comienza para quienes no tengan un rechazo guardado; un rechazo guardado sigue impidiendo toda medición.',
		'El control Preferencias de analítica está disponible en el pie de página siempre que la analítica esté activada. Al abrirlo, se pausa toda medición futura y se muestra la elección. Permitir analítica reanuda la medición; No, gracias registra un rechazo.',
		'Retirar el consentimiento detiene las futuras solicitudes y los futuros eventos de analítica. Los datos agregados ya enviados no pueden volver a vincularse con usted ni eliminarse de forma selectiva.',
		'Plausible no instala cookies, no usa el almacenamiento del navegador y no crea identificadores persistentes entre sitios. yesid.dev guarda su elección de analítica en el localStorage de su navegador.',
		'El consentimiento explícito sigue siendo el modo documentado predeterminado. Solo uso el modo sin banner después de decidirlo y obtener la revisión de un asesor jurídico.',
	],
};

const PRIVACY_PROFILE_TRUTH: Record<Locale, string> = {
	en: 'No advertising profile and no automated decision-making.',
	fr: 'Aucun profil publicitaire et aucune décision automatisée.',
	es: 'Ningún perfil publicitario ni decisión automatizada.',
};

const COOKIE_PROFILE_TRUTH: Record<Locale, string> = {
	en: 'There is no advertising technology, advertising profile, or automated decision-making.',
	fr: "Il n'y a aucune technologie publicitaire, aucun profil publicitaire ni aucune décision automatisée.",
	es: 'No hay tecnología publicitaria, perfiles publicitarios ni decisiones automatizadas.',
};

const FORBIDDEN_ANALYTICS_OVERCLAIMS: Record<Locale, readonly string[]> = {
	en: [
		'there is no advertising technology, no cross-site tracking, and no profiling.',
		'fully anonymous',
		'creates no persistent identifier.',
		'does no cross-site tracking',
		'no ip processing',
		'no profiling and',
	],
	fr: [
		"il n'y a ni technologie publicitaire, ni suivi entre les sites, ni profilage.",
		'entièrement anonyme',
		'ne crée aucun identifiant persistant.',
		"n'effectue aucun suivi entre les sites",
		"aucun traitement de l'adresse ip",
		'aucun profilage,',
	],
	es: [
		'no hay tecnología publicitaria, ni rastreo entre sitios, ni elaboración de perfiles.',
		'completamente anónimo',
		'no crea identificadores persistentes.',
		'no hace seguimiento entre sitios',
		'sin tratamiento de la dirección ip',
		'sin perfilado y',
	],
};

const REVISION_LABELS: Record<Locale, string> = {
	en: 'Last updated:',
	fr: 'Dernière mise à jour :',
	es: 'Última actualización:',
};


/** Wording sources shared with synthetic validator tests. */
export const legalTruth = {
	consent: CONSENT_DESCRIPTIONS, clause: LEGAL_CLAUSES, modes: ANALYTICS_MODE_TRUTH,
	privacyProfile: PRIVACY_PROFILE_TRUTH, cookieProfile: COOKIE_PROFILE_TRUTH,
	forbidden: FORBIDDEN_ANALYTICS_OVERCLAIMS, revision: REVISION_LABELS,
};

function requireTruth(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error('Live content validation failed: ' + message);
}

export function validateLegalTruth(data: ExportData): void {
	const pages = data.legalPages;
	requireTruth(pages, 'missing legal pages');
	requireTruth(JSON.stringify(pages.map(page => page.slug)) === JSON.stringify([
		'privacy', 'terms', 'cookies', 'accessibility', 'notice',
	]), 'legal page registry');
	for (const locale of ['en', 'fr', 'es'] as const) {
		requireTruth(data.siteLabels?.ui.analyticsConsent.description[locale] === CONSENT_DESCRIPTIONS[locale], locale + ' consent description');
		for (const page of pages) {
			const content = JSON.stringify({ title: page.title[locale], body: page.body[locale] });
			const body = JSON.stringify(page.body[locale]);
			requireTruth(!/\bGatineau\b/i.test(content) && !/\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i.test(content), locale + ' private location');
			requireTruth(body?.includes('contact@yesid.dev') && !body.includes('admin@yesid.dev') && !/umami/i.test(body), locale + ' legal contact: ' + page.slug);
			if (page.slug !== 'privacy' && page.slug !== 'cookies') continue;
			const paragraphs = page.body[locale]!.blocks.flatMap(block =>
				'text' in block.data && typeof block.data.text === 'string' ? [block.data.text] : [],
			);
			requireTruth(paragraphs.find(text => text.includes('Plausible Analytics Cloud'))?.includes(LEGAL_CLAUSES[locale]), locale + ' four-event clause: ' + page.slug);
			requireTruth(paragraphs.find(text => text.includes(REVISION_LABELS[locale]))?.includes('2026-07-15'), locale + ' revision date: ' + page.slug);
			for (const truth of ANALYTICS_MODE_TRUTH[locale]) requireTruth(body.includes(truth), locale + ' analytics mode: ' + page.slug);
			requireTruth(body.includes(page.slug === 'privacy' ? PRIVACY_PROFILE_TRUTH[locale] : COOKIE_PROFILE_TRUTH[locale]), locale + ' profiling claim: ' + page.slug);
			for (const overclaim of FORBIDDEN_ANALYTICS_OVERCLAIMS[locale]) requireTruth(!body.toLowerCase().includes(overclaim), locale + ' processing overclaim: ' + page.slug);
		}
	}
}

/** Validate explicit SEO description fields using the route boundary's schema. */
export function validateSeoDescriptions(data: ExportData): void {
	const schema = PageSeoSchema.shape.description;
	const check = (label: string, value: unknown): void => {
		requireTruth(schema.safeParse(value).success, label + ' SEO description');
	};
	check('site defaults', data.siteSeoDefaults?.defaultDescription);
	for (const row of data.routeSeo ?? []) if (row.description !== null) check(row.path, row.description);
	for (const service of data.services ?? []) if (service.seoDescription !== undefined) check(service.id, service.seoDescription);
	for (const post of data.blogPosts ?? []) if (post.seoDescription !== undefined) check(post.slug, { en: post.seoDescription });
}

export function validateLiveExport(data: ExportData): void {
	validateLegalTruth(data);
	validateSeoDescriptions(data);
}
