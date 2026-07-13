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
		copy: 'Plausible would count visits, pages viewed, referral sources, general device and region data, and clicks on contact or project proof links. No cookies, names, email addresses, form contents, destination URLs, or custom properties.',
	},
	fr: {
		fixture: 'site-labels.fr.json',
		copy: 'Plausible compterait les visites, les pages vues, les sources de référence, des données générales sur l’appareil et la région, ainsi que les clics sur des liens de contact, de site en ligne ou de dépôt public d’un projet. Aucun cookie, nom, courriel, contenu de formulaire, URL de destination ni propriété personnalisée.',
	},
	es: {
		fixture: 'site-labels.es.json',
		copy: 'Plausible contaría visitas, páginas vistas, fuentes de referencia, datos generales del dispositivo y la región, y clics en enlaces de contacto, del sitio publicado o del repositorio público de un proyecto. Sin cookies, nombres, correos, contenido de formularios, URL de destino ni propiedades personalizadas.',
	},
} as const satisfies Record<Locale, { fixture: string; copy: string }>;

const OLD_LEGAL_CLAUSES: Record<Locale, string> = {
	en: 'and two conversion events: a successful contact-form submission and a click to book a call. I do not attach contact-form fields or custom properties to those events.',
	fr: 'ainsi que deux événements de conversion : l’envoi réussi du formulaire de contact et le clic pour réserver un appel. Je ne joins à ces événements aucun champ du formulaire de contact ni aucune propriété personnalisée.',
	es: 'y dos eventos de conversión: el envío exitoso del formulario de contacto y el clic para reservar una llamada. No adjunto a esos eventos ningún campo del formulario de contacto ni propiedades personalizadas.',
};

const LEGAL_CLAUSES: Record<Locale, string> = {
	en: "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
	fr: 'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
	es: 'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
};

const BASELINE_ANALYTICS_PARAGRAPHS: Record<Locale, string> = {
	en: 'I use Plausible Analytics Cloud, operated by Plausible Insights OÜ in Estonia, to measure page paths, referral and campaign sources, browser, operating-system and device categories, approximate country, region and city, and two conversion events: a successful contact-form submission and a click to book a call. I do not attach contact-form fields or custom properties to those events. Plausible sets no cookies, uses no browser storage, does no cross-site tracking and creates no persistent identifier. Each request contains an IP address and User-Agent; Plausible combines them with a value that changes daily to count visitors for that day, then discards the raw values. Visitor data is processed and stored in the European Union. I see site-usage reports, not named people. Plausible is off until you allow it.',
	fr: "J'utilise Plausible Analytics Cloud, exploité par Plausible Insights OÜ en Estonie, pour mesurer les chemins de page, les sources de référence et de campagne, les catégories de navigateur, de système d'exploitation et d'appareil, le pays, la région et la ville approximatifs, ainsi que deux événements de conversion : l’envoi réussi du formulaire de contact et le clic pour réserver un appel. Je ne joins à ces événements aucun champ du formulaire de contact ni aucune propriété personnalisée. Plausible n'installe aucun témoin, n'utilise pas le stockage du navigateur, n'effectue aucun suivi entre les sites et ne crée aucun identifiant persistant. Chaque requête contient une adresse IP et un agent utilisateur; Plausible les combine à une valeur renouvelée chaque jour pour compter les visiteurs de cette journée, puis élimine les valeurs brutes. Les données de visite sont traitées et conservées dans l'Union européenne. Je vois des rapports d'utilisation du site, pas des personnes nommées. Plausible reste désactivé tant que vous ne l’autorisez pas.",
	es: 'Utilizo Plausible Analytics Cloud, operado por Plausible Insights OÜ en Estonia, para medir las rutas de las páginas, las fuentes de referencia y campaña, las categorías de navegador, sistema operativo y dispositivo, el país, la región y la ciudad aproximados, y dos eventos de conversión: el envío exitoso del formulario de contacto y el clic para reservar una llamada. No adjunto a esos eventos ningún campo del formulario de contacto ni propiedades personalizadas. Plausible no instala cookies, no usa el almacenamiento del navegador, no hace seguimiento entre sitios y no crea identificadores persistentes. Cada solicitud contiene una dirección IP y un agente de usuario; Plausible los combina con un valor que cambia cada día para contar visitantes durante ese día y luego descarta los valores brutos. Los datos de las visitas se procesan y almacenan en la Unión Europea. Yo veo informes sobre el uso del sitio, no personas identificadas por su nombre. Plausible permanece desactivado hasta que usted lo autorice.',
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
		'9eb8c80d09e10919f00f63bc8c0427e50e1dc152e0001ba84c799d382e6f5941',
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
	privacy: '2026-07-12',
	terms: '2026-07-12',
	cookies: '2026-07-12',
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
		expect(legalArtifact.generatedAt).toBe('2026-07-13');
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
			it(`${slug} uses the exact ${locale.toUpperCase()} four-event clause and preserves its surrounding paragraph`, () => {
				const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
				expect(page).toBeDefined();
				const analyticsParagraph = textBlocks(page!, locale).find((text) =>
					text.includes('Plausible Analytics Cloud'),
				);
				const expected = BASELINE_ANALYTICS_PARAGRAPHS[locale].replace(
					OLD_LEGAL_CLAUSES[locale],
					LEGAL_CLAUSES[locale],
				);
				expect(analyticsParagraph).toBe(expected);
			});
		}
	}

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
