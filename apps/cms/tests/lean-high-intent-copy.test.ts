import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CMS_ROOT = join(import.meta.dir, '..');
const LEGAL_ARTIFACT_PATH = join(
	CMS_ROOT,
	'ops',
	'legal',
	'legal-pages-2026-07-09.json',
);

type Locale = 'en' | 'fr' | 'es';
type LegalBlock = { kind: string; text?: string; items?: string[] };
type LegalTranslation = { title: string; blocks: LegalBlock[] };
type LegalPage = { slug: string } & Record<Locale, LegalTranslation>;
type LegalArtifact = { generatedAt: string; pages: LegalPage[] };

const CONSENT_DESCRIPTIONS: Record<Locale, { fixture: string; copy: string }> = {
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
};

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

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function textBlocks(page: LegalPage, locale: Locale): string[] {
	return page[locale].blocks.flatMap((block) => (block.text === undefined ? [] : [block.text]));
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

describe('lean high-intent analytics legal source', () => {
	it('records the source artifact revision date', () => {
		expect(legalArtifact.generatedAt).toBe('2026-07-11');
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

	for (const slug of ['privacy', 'cookies'] as const) {
		for (const locale of ['en', 'fr', 'es'] as const) {
			it(`${slug} records only the new ${locale.toUpperCase()} revision date`, () => {
				const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
				expect(page).toBeDefined();
				const revisionText = textBlocks(page!, locale).find((text) =>
					text.includes(REVISION_LABELS[locale]),
				);
				expect(revisionText).toContain('2026-07-11');
				expect(revisionText).not.toContain('2026-07-09');
			});
		}
	}

	for (const slug of ['terms', 'accessibility', 'notice'] as const) {
		for (const locale of ['en', 'fr', 'es'] as const) {
			it(`${slug} keeps its ${locale.toUpperCase()} revision date unchanged`, () => {
				const page = legalArtifact.pages.find((candidate) => candidate.slug === slug);
				expect(page).toBeDefined();
				const revisionText = textBlocks(page!, locale).find((text) =>
					text.includes(REVISION_LABELS[locale]),
				);
				expect(revisionText).toContain('2026-07-09');
				expect(revisionText).not.toContain('2026-07-11');
			});
		}
	}
});
