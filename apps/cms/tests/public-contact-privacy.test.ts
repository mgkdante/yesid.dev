import { describe, expect, test, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../../..');
const e164NanpPhone = /(?<![A-Za-z0-9])[+]?1\d{10}(?![A-Za-z0-9])/g;
const reservedFictionalPhone = /^[+]?1\d{3}55501\d{2}$/;

describe('public repository contact privacy', () => {
	test('contains no non-fictional NANP phone values', () => {
		const grep = spawnSync(
			'git',
			[
				'grep',
				'-Il',
				'-E',
				'(^|[^[:alnum:]])[+]?1[0-9]{10}([^[:alnum:]]|$)',
				'--',
				'.',
			],
			{
				cwd: repoRoot,
				encoding: 'utf8',
			},
		);
		expect([0, 1]).toContain(grep.status);
		const trackedFiles = grep.stdout.trim().split('\n').filter(Boolean);
		const violatingFiles = new Set<string>();

		for (const path of trackedFiles) {
			const matches = readFileSync(resolve(repoRoot, path), 'utf8').match(e164NanpPhone) ?? [];
			if (matches.some((phone) => !reservedFictionalPhone.test(phone))) {
				violatingFiles.add(path);
			}
		}

		expect([...violatingFiles].sort()).toEqual([]);
	});
});

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

const LEGAL_CLAUSES: Record<Locale, string> = {
	en: "and four conversion events: a successful contact-form submission, a click to book a call, a click on a direct contact channel, and a click to inspect a project's live site or public source repository. I do not attach contact-form fields, destination URLs, link labels, or custom properties to those events.",
	fr: 'ainsi que quatre événements de conversion : l’envoi réussi du formulaire de contact, le clic pour réserver un appel, le clic sur un moyen de contact direct et le clic pour consulter le site en ligne ou le dépôt public de code source d’un projet. Je ne joins à ces événements aucun champ du formulaire de contact, aucune URL de destination, aucune étiquette de lien ni aucune propriété personnalisée.',
	es: 'y cuatro eventos de conversión: el envío exitoso del formulario de contacto, el clic para reservar una llamada, el clic en un canal de contacto directo y el clic para consultar el sitio publicado o el repositorio público de código fuente de un proyecto. No adjunto a esos eventos ningún campo del formulario de contacto, URL de destino, etiqueta de enlace ni propiedad personalizada.',
};

const REVISION_LABELS: Record<Locale, string> = {
	en: 'Last updated:',
	fr: 'Dernière mise à jour :',
	es: 'Última actualización:',
};

const SOURCE_PRESERVATION_SHA256 = {
	'legal-pages-2026-07-09.json':
		'9df41ca4b66e409cd0cd658a636efb50ee155fc7cc4dca759e47b826e23ba99e',
} as const;

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

function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(raw: string): string {
	return `${JSON.stringify(JSON.parse(raw), null, '\t')}\n`;
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

describe('legal source semantic preservation', () => {
	it('legal source matches the approved generatedAt, dates, clauses, contact, and service-area privacy revision', () => {
		const raw = readFileSync(LEGAL_ARTIFACT_PATH, 'utf8');
		expect(raw).toBe(canonicalJson(raw));
		expect(sha256(normalizeLegalSemanticLeaves(raw))).toBe(
			SOURCE_PRESERVATION_SHA256['legal-pages-2026-07-09.json'],
		);
	});
});

describe('legal recovery source privacy and truth', () => {
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
