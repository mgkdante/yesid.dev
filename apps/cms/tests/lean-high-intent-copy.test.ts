import { describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CMS_ROOT = join(import.meta.dir, '..');
const LEGAL_ARTIFACT_PATH = join(
	CMS_ROOT,
	'ops',
	'legal',
	'legal-pages-2026-07-09.json',
);
const ES_WORKLIST_PATH = join(
	CMS_ROOT,
	'ops',
	'i18n',
	'es-worklist-2026-07-09.json',
);

type Locale = 'en' | 'fr' | 'es';
type LegalBlock = { kind: string; text?: string; items?: string[] };
type LegalTranslation = { title: string; blocks: LegalBlock[] };
type LegalPage = { slug: string; advisorNotes: string } & Record<Locale, LegalTranslation>;
type LegalArtifact = { generatedAt: string; pages: LegalPage[] };

const CONSENT_DESCRIPTIONS = {
	en: {
		fixture: 'site-labels.json',
		copy: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
	},
	fr: {
		fixture: 'site-labels.fr.json',
		copy: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
	},
	es: {
		fixture: 'site-labels.es.json',
		copy: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
	},
} as const satisfies Record<Locale, { fixture: string; copy: string }>;

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

const REMOVED_BROAD_COOKIE_CLAIMS: Record<Locale, string> = {
	en: 'There is no advertising technology, no cross-site tracking, and no profiling.',
	fr: "Il n'y a ni technologie publicitaire, ni suivi entre les sites, ni profilage.",
	es: 'No hay tecnología publicitaria, ni rastreo entre sitios, ni elaboración de perfiles.',
};

const REVISION_LABELS: Record<Locale, string> = {
	en: 'Last updated:',
	fr: 'Dernière mise à jour :',
	es: 'Última actualización:',
};

const SOURCE_PRESERVATION_SHA256 = {
	'site-labels.json': '04f75b348f0287dd637a5f8e87b1f45caa43a1d475f22307c80b3644abbd2217',
	'site-labels.fr.json': '9cb55b693bbc431ee259291627dcaac8e3308565f44013ec7dc690c6d050d3dd',
	'site-labels.es.json': '52ebd03c73a03b53f9f61eaf798124fae9c8a38bac3a1ede01e5dceaf4eca6ec',
	'legal-pages-2026-07-09.json':
		'9df41ca4b66e409cd0cd658a636efb50ee155fc7cc4dca759e47b826e23ba99e',
} as const;

const CONSENT_DESCRIPTION_SENTINEL = '<task-6-consent-description>';
const GENERATED_AT_SENTINEL = '<task-6-generated-at>';
const REVISION_DATE_SENTINEL = '<task-6-revision-date>';
const LEGAL_CLAUSE_SENTINEL = '<task-6-legal-clause>';
const PUBLIC_CONTACT_EMAIL = 'contact@yesid.dev';
const INTERNAL_CONTACT_EMAIL = 'admin@yesid.dev';

const PUBLIC_SERVICE_AREA_IDENTIFICATION: Record<Locale, string> = {
	en: 'Service area: Montréal, Québec, Canada.',
	fr: 'Zone de service : Montréal, Québec, Canada.',
	es: 'Área de servicio: Montréal, Québec, Canadá.',
};

const CANADIAN_POSTAL_CODE = /\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b/i;

const NORMALIZED_REVISION_DATES = {
	privacy: REVISION_DATE_SENTINEL,
	terms: '2026-07-09',
	cookies: REVISION_DATE_SENTINEL,
	accessibility: '2026-07-09',
	notice: REVISION_DATE_SENTINEL,
} as const;

const CURRENT_REVISION_DATES = {
	privacy: '2026-07-15',
	terms: '2026-07-12',
	cookies: '2026-07-15',
	accessibility: '2026-07-12',
	notice: '2026-07-13',
} as const;

const PUBLIC_CONTACT_COUNTS = {
	privacy: 5,
	terms: 1,
	cookies: 1,
	accessibility: 2,
	notice: 1,
} as const;

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function textBlocks(page: LegalPage, locale: Locale): string[] {
	return page[locale].blocks.flatMap((block) => (block.text === undefined ? [] : [block.text]));
}

function allBlockCopy(page: LegalPage, locale: Locale): string {
	return page[locale].blocks
		.flatMap((block) => [block.text ?? '', ...(block.items ?? [])])
		.join('\n');
}

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(raw: string): string {
	return `${JSON.stringify(JSON.parse(raw), null, '\t')}\n`;
}

function normalizeConsentDescriptionBytes(raw: string): string {
	const labels = JSON.parse(raw) as Record<string, string>;
	const keyPrefix = '"ui_analytics_consent_description": ';
	const keyAt = raw.indexOf(keyPrefix);
	if (keyAt < 0 || raw.indexOf(keyPrefix, keyAt + keyPrefix.length) >= 0) {
		throw new Error('expected exactly one analytics consent description key');
	}
	const valueAt = keyAt + keyPrefix.length;
	const valueLiteral = JSON.stringify(labels.ui_analytics_consent_description);
	if (!raw.startsWith(valueLiteral, valueAt)) {
		throw new Error('analytics consent description is not at the expected JSON key');
	}
	return `${raw.slice(0, valueAt)}${JSON.stringify(CONSENT_DESCRIPTION_SENTINEL)}${raw.slice(valueAt + valueLiteral.length)}`;
}

function replaceExactlyOnce(value: string, segment: string, replacement: string): string {
	const segmentAt = value.indexOf(segment);
	if (segmentAt < 0 || value.indexOf(segment, segmentAt + segment.length) >= 0) {
		throw new Error(`expected exactly one authorized segment: ${segment.slice(0, 40)}`);
	}
	return `${value.slice(0, segmentAt)}${replacement}${value.slice(segmentAt + segment.length)}`;
}

function normalizeLegalSemanticLeaves(raw: string): string {
	const artifact = JSON.parse(raw) as LegalArtifact;
	artifact.generatedAt = GENERATED_AT_SENTINEL;

	for (const page of artifact.pages) {
		const expectedCount = PUBLIC_CONTACT_COUNTS[page.slug as keyof typeof PUBLIC_CONTACT_COUNTS];
		if (expectedCount === undefined) throw new Error(`unexpected legal page: ${page.slug}`);
		for (const locale of ['en', 'fr', 'es'] as const) {
			let replacementCount = 0;
			for (const block of page[locale].blocks) {
				if (block.text === undefined) continue;
				replacementCount += block.text.split(PUBLIC_CONTACT_EMAIL).length - 1;
				block.text = block.text.replaceAll(PUBLIC_CONTACT_EMAIL, INTERNAL_CONTACT_EMAIL);
			}
			if (replacementCount !== expectedCount) {
				throw new Error(
					`expected ${expectedCount} authorized public contact replacements in ${page.slug}/${locale}, received ${replacementCount}`,
				);
			}

			const revisionBlocks = page[locale].blocks.filter(
				(block) =>
					typeof block.text === 'string' && block.text.includes(REVISION_LABELS[locale]),
			);
			if (revisionBlocks.length !== 1) {
				throw new Error(`expected one ${page.slug}/${locale} revision block`);
			}
			revisionBlocks[0]!.text = replaceExactlyOnce(
				revisionBlocks[0]!.text!,
				CURRENT_REVISION_DATES[
					page.slug as keyof typeof CURRENT_REVISION_DATES
				],
				NORMALIZED_REVISION_DATES[
					page.slug as keyof typeof NORMALIZED_REVISION_DATES
				],
			);
		}
	}

	for (const slug of ['privacy', 'cookies'] as const) {
		const page = artifact.pages.find((candidate) => candidate.slug === slug);
		if (page === undefined) throw new Error(`missing legal page: ${slug}`);

		for (const locale of ['en', 'fr', 'es'] as const) {
			const analyticsBlocks = page[locale].blocks.filter(
				(block) =>
					typeof block.text === 'string' && block.text.includes('Plausible Analytics Cloud'),
			);
			if (analyticsBlocks.length !== 1) {
				throw new Error(`expected one ${slug}/${locale} Plausible block`);
			}
			analyticsBlocks[0]!.text = replaceExactlyOnce(
				analyticsBlocks[0]!.text!,
				LEGAL_CLAUSES[locale],
				LEGAL_CLAUSE_SENTINEL,
			);
		}
	}

	return `${JSON.stringify(artifact, null, '\t')}\n`;
}

const legalArtifact = readJson<LegalArtifact>(LEGAL_ARTIFACT_PATH);

describe('lean high-intent analytics source copy', () => {
	for (const locale of ['en', 'fr', 'es'] as const) {
		it(`uses the approved ${locale.toUpperCase()} consent description`, () => {
			const { fixture, copy } = CONSENT_DESCRIPTIONS[locale];
			const labels = readJson<Record<string, string>>(
				join(CMS_ROOT, 'fixtures', 'content', fixture),
			);
			expect(labels.ui_analytics_consent_description).toBe(copy);
		});
	}
});

describe('source preservation allows only the approved analytics and legal privacy leaves', () => {
	for (const { fixture } of Object.values(CONSENT_DESCRIPTIONS)) {
		it(`${fixture} differs only at the authorized consent description`, () => {
			const raw = readFileSync(join(CMS_ROOT, 'fixtures', 'content', fixture), 'utf8');
			expect(raw).toBe(canonicalJson(raw));
			expect(sha256(normalizeConsentDescriptionBytes(raw))).toBe(
				SOURCE_PRESERVATION_SHA256[fixture],
			);
		});
	}

	it('legal source matches the approved generatedAt, dates, clauses, contact, and service-area privacy revision', () => {
		const raw = readFileSync(LEGAL_ARTIFACT_PATH, 'utf8');
		expect(raw).toBe(canonicalJson(raw));
		expect(sha256(normalizeLegalSemanticLeaves(raw))).toBe(
			SOURCE_PRESERVATION_SHA256['legal-pages-2026-07-09.json'],
		);
	});
});

describe('lean high-intent analytics legal source', () => {
	it('publishes service-area identification without the private home location', () => {
		const notice = legalArtifact.pages.find((candidate) => candidate.slug === 'notice');
		expect(notice).toBeDefined();

		for (const locale of ['en', 'fr', 'es'] as const) {
			const body = textBlocks(notice!, locale).join('\n');
			expect(body.includes(PUBLIC_SERVICE_AREA_IDENTIFICATION[locale])).toBe(true);
			expect(/\bGatineau\b/i.test(body)).toBe(false);
			expect(CANADIAN_POSTAL_CODE.test(body)).toBe(false);
		}
	});

	it('does not retain a private postal address in review notes', () => {
		for (const page of legalArtifact.pages) {
			expect(CANADIAN_POSTAL_CODE.test(page.advisorNotes)).toBe(false);
		}
	});

	it('keeps the translation worklist free of the superseded private location', () => {
		const worklist = readJson<
			Array<{
				collection: string;
				id: string;
				fields: {
					body: Record<
						'en' | 'fr',
						{ blocks: Array<{ data: { text?: string } }> }
					>;
				};
			}>
		>(ES_WORKLIST_PATH);
		const notice = worklist.find(
			(row) => row.collection === 'legal_pages' && row.id === 'notice',
		);
		expect(notice).toBeDefined();
		for (const locale of ['en', 'fr'] as const) {
			const body = notice!.fields.body[locale].blocks
				.map((block) => block.data.text ?? '')
				.join('\n');
			expect(body.includes(PUBLIC_SERVICE_AREA_IDENTIFICATION[locale])).toBe(true);
			expect(/\bGatineau\b/i.test(body)).toBe(false);
			expect(CANADIAN_POSTAL_CODE.test(body)).toBe(false);
		}
	});

	it('uses the approved public contact address in every legal translation', () => {
		let publicContactCount = 0;
		for (const page of legalArtifact.pages) {
			const expectedCount = PUBLIC_CONTACT_COUNTS[page.slug as keyof typeof PUBLIC_CONTACT_COUNTS];
			expect(expectedCount).toBeDefined();
			for (const locale of ['en', 'fr', 'es'] as const) {
				const body = textBlocks(page, locale).join('\n');
				expect(body).not.toContain(INTERNAL_CONTACT_EMAIL);
				const count = body.split(PUBLIC_CONTACT_EMAIL).length - 1;
				expect(count).toBe(expectedCount!);
				publicContactCount += count;
			}
		}
		expect(publicContactCount).toBe(30);
	});

	it('records the source artifact revision date', () => {
		expect(legalArtifact.generatedAt).toBe('2026-07-15');
	});

	it('keeps the legal page order, titles, and block counts stable', () => {
		expect(
			legalArtifact.pages.map(({ slug, en, fr, es }) => ({
				slug,
				titles: [en.title, fr.title, es.title],
				blockCounts: [en.blocks.length, fr.blocks.length, es.blocks.length],
			})),
		).toEqual([
			{
				slug: 'privacy',
				titles: ['Privacy Policy', 'Politique de confidentialité', 'Política de privacidad'],
				blockCounts: [45, 45, 45],
			},
			{
				slug: 'terms',
				titles: ['Terms of Use', "Conditions d'utilisation", 'Condiciones de uso'],
				blockCounts: [24, 24, 24],
			},
			{
				slug: 'cookies',
				titles: [
					'Cookie and Tracking Policy',
					'Politique sur les témoins (cookies)',
					'Política de cookies y rastreo',
				],
				blockCounts: [14, 14, 14],
			},
			{
				slug: 'accessibility',
				titles: [
					'Accessibility Statement',
					"Déclaration d'accessibilité",
					'Declaración de accesibilidad',
				],
				blockCounts: [13, 13, 13],
			},
			{
				slug: 'notice',
				titles: ['Legal Notice', 'Avis juridique', 'Aviso legal'],
				blockCounts: [13, 13, 13],
			},
		]);
	});

	for (const slug of ['privacy', 'cookies'] as const) {
		for (const locale of ['en', 'fr', 'es'] as const) {
			it(`${slug} pins the ${locale.toUpperCase()} four-event inventory and configurable analytics matrix`, () => {
				const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
				expect(page).toBeDefined();
				const analyticsParagraph = textBlocks(page!, locale).find((text) =>
					text.includes('Plausible Analytics Cloud'),
				);
				expect(analyticsParagraph).toContain(LEGAL_CLAUSES[locale]);
				const body = allBlockCopy(page!, locale);
				for (const truthBoundary of ANALYTICS_MODE_TRUTH[locale]) {
					expect(body).toContain(truthBoundary);
				}
			});
		}
	}

	for (const locale of ['en', 'fr', 'es'] as const) {
		it(`privacy narrows the ${locale.toUpperCase()} profiling claim to advertising`, () => {
			const page = legalArtifact.pages.find((candidate) => candidate.slug === 'privacy');
			expect(page).toBeDefined();
			expect(allBlockCopy(page!, locale)).toContain(PRIVACY_PROFILE_TRUTH[locale]);
		});

		it(`cookies narrows the ${locale.toUpperCase()} profiling claim to advertising`, () => {
			const page = legalArtifact.pages.find((candidate) => candidate.slug === 'cookies');
			expect(page).toBeDefined();
			expect(allBlockCopy(page!, locale)).toContain(COOKIE_PROFILE_TRUTH[locale]);
		});
	}

	it('keeps the public copy precise about processing and avoids analytics overclaims', () => {
		for (const locale of ['en', 'fr', 'es'] as const) {
			const removedClaim = REMOVED_BROAD_COOKIE_CLAIMS[locale].toLowerCase();
			expect(
				FORBIDDEN_ANALYTICS_OVERCLAIMS[locale].some((overclaim) =>
					removedClaim.includes(overclaim),
				),
			).toBe(true);
		}
		for (const slug of ['privacy', 'cookies'] as const) {
			const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
			expect(page).toBeDefined();
			for (const locale of ['en', 'fr', 'es'] as const) {
				const body = allBlockCopy(page!, locale).toLowerCase();
				for (const overclaim of FORBIDDEN_ANALYTICS_OVERCLAIMS[locale]) {
					expect(body).not.toContain(overclaim);
				}
			}
		}
	});

	it('keeps the configurable no-banner mode operator and advisor gated in review notes', () => {
		for (const slug of ['privacy', 'cookies'] as const) {
			const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
			expect(page).toBeDefined();
			expect(page!.advisorNotes).toContain(
				'Explicit consent remains the documented default.',
			);
			expect(page!.advisorNotes).toContain(
				'Full or emergency disable remains available to the operator at any time.',
			);
			expect(page!.advisorNotes).toContain(
				'Only the no-banner mode requires legal-advisor review before the operator enables it.',
			);
			expect(page!.advisorNotes).toContain(
				'Plausible derives a daily visitor identifier/hash from IP address and User-Agent, uses it to count visitors for that day, and discards the raw values.',
			);
			expect(page!.advisorNotes).toContain(
				'This source does not claim that any analytics configuration is legally sufficient.',
			);
		}
	});

	for (const slug of ['privacy', 'terms', 'cookies', 'accessibility', 'notice'] as const) {
		for (const locale of ['en', 'fr', 'es'] as const) {
			it(`${slug} records the current ${locale.toUpperCase()} revision date`, () => {
				const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
				expect(page).toBeDefined();
				const revisionText = textBlocks(page!, locale).find((text) =>
					text.includes(REVISION_LABELS[locale]),
				);
				expect(revisionText?.includes(CURRENT_REVISION_DATES[slug])).toBe(true);
			});
		}
	}
});
