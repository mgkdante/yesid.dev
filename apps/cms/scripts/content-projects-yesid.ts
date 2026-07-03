#!/usr/bin/env bun
/**
 * content-projects.1 - yesid.dev case study (the ARCHETYPE). EN + FR.
 *
 * - projects row: fresh hero image.
 * - projects_translations (en+fr): title "yesid.dev", one_liner (subtitle),
 *   description (block-editor overview).
 * - projects_sections: REPLACE the existing body with the image gallery and
 *   3 crafted sections (each en+fr, block-editor body), sort 1..4.
 * - projects_impact_metrics: REPLACE with the grounded metrics (en+fr labels).
 * README is intentionally left to readme_url (null until the repo is public),
 * so it renders LAST and only once GitHub is public.
 *
 * Idempotent (re-run replaces sections + metrics). DRY-RUN BY DEFAULT, dev-guard.
 *   bun apps/cms/scripts/content-projects-yesid.ts
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-projects-yesid.ts --apply
 */

import { createItem, deleteItems, readItems, updateItem } from '@directus/sdk';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';
import assetIdMap from '../fixtures/assets-id-map.json' with { type: 'json' };
import type { BlockEditorBlock, BlockEditorDoc, ImageBlock } from '@repo/shared';

const log = createLogger('content-projects-yesid');
const SLUG = 'yesid-dev';
const T = 1750000000000; // fixed Editor.js timestamp for deterministic regen
const VER = '2.31.2';

interface ScreenshotAsset {
	fileId: string;
	name: string;
	title: string;
	width: number;
	height: number;
}

function assetIdFor(legacyPath: string): string {
	const id = (assetIdMap as Record<string, string>)[legacyPath];
	if (!id) throw new Error(`missing asset id for ${legacyPath}`);
	return id;
}

const SCREENSHOTS = {
	home: {
		fileId: assetIdFor('images/work/yesid-dev-home.png'),
		name: 'yesid-dev-home.png',
		title: 'yesid.dev home screenshot',
		width: 1440,
		height: 920,
	},
	homeLight: {
		fileId: assetIdFor('images/work/yesid-dev-home-light.png'),
		name: 'yesid-dev-home-light.png',
		title: 'yesid.dev home screenshot light',
		width: 1440,
		height: 920,
	},
	mobile: {
		fileId: assetIdFor('images/work/yesid-dev-mobile.png'),
		name: 'yesid-dev-mobile.png',
		title: 'yesid.dev mobile screenshot',
		width: 390,
		height: 844,
	},
	mobileLight: {
		fileId: assetIdFor('images/work/yesid-dev-mobile-light.png'),
		name: 'yesid-dev-mobile-light.png',
		title: 'yesid.dev mobile screenshot light',
		width: 390,
		height: 844,
	},
} satisfies Record<string, ScreenshotAsset>;

function paragraph(id: string, text: string): BlockEditorBlock {
	return { id, type: 'paragraph', data: { text } };
}

function code(id: string, source: string): BlockEditorBlock {
	return { id, type: 'code', data: { code: source } };
}

function unorderedList(id: string, items: string[]): BlockEditorBlock {
	return {
		id,
		type: 'nestedlist',
		data: {
			style: 'unordered',
			items: items.map((content) => ({ content, items: [] })),
		},
	};
}

function delimiter(id: string): BlockEditorBlock {
	return { id, type: 'delimiter', data: {} };
}

function imageFile(asset: ScreenshotAsset): ImageBlock['data']['file'] {
	return {
		fileId: asset.fileId,
		fileURL: `/files/${asset.fileId}`,
		url: `/assets/${asset.fileId}`,
		width: asset.width,
		height: asset.height,
		name: asset.name,
		title: asset.title,
		extension: 'png',
	};
}

function image(
	id: string,
	asset: ScreenshotAsset,
	caption: string,
	lightAsset?: ScreenshotAsset,
): BlockEditorBlock {
	const data: ImageBlock['data'] = {
		file: imageFile(asset),
		caption,
		withBorder: true,
		withBackground: false,
		stretched: true,
	};
	if (lightAsset) data.variants = { light: imageFile(lightAsset) };
	return {
		id,
		type: 'image',
		data,
	};
}

function blockDoc(...blocks: BlockEditorBlock[]): BlockEditorDoc {
	return { time: T, version: VER, blocks };
}

/** Build an Editor.js block-editor doc from one or more paragraph strings. */
function doc(...paras: string[]) {
	return blockDoc(...paras.map((text, i) => paragraph(`p${i + 1}`, text)));
}

// Conversion batch rewrite (operator ask 2026-07-02: "make this holistic").
// All numbers measured on develop @ 2bdb611d + this batch; the update
// procedure is written into the "Numbers with receipts" section itself.

const ONE_LINER = {
	en: 'My own site, run like client work: the CMS is the source of truth, the edge serves generated content, and every claim is locked by a test.',
	fr: "Mon propre site, mené comme un mandat client : le CMS comme source de vérité, du contenu généré servi à l'edge, et chaque affirmation verrouillée par un test.",
};

const DESCRIPTION = {
	en: [
		'yesid.dev is the one project where I am both the client and the contractor. It is a bilingual SvelteKit site edited in `Directus`, regenerated into typed TypeScript modules at build time, and served prerendered from the `Vercel` edge with `0` CMS calls per visit.',
		'It is also the working proof for all four services. The content lives in a Postgres database I tune myself, a pipeline rebuilds the site on every publish, the numbers in this case study are measured rather than estimated, and the storefront is the site itself.',
	],
	fr: [
		"yesid.dev est le seul projet où je suis à la fois le client et l'entrepreneur. C'est un site SvelteKit bilingue, édité dans `Directus`, régénéré en modules TypeScript typés au moment du build, puis servi prérendu depuis l'edge `Vercel` avec `0` appel au CMS par visite.",
		"C'est aussi la preuve en marche des quatre services. Le contenu vit dans une base Postgres que j'ajuste moi-même, un pipeline reconstruit le site à chaque publication, les chiffres de cette étude de cas sont mesurés plutôt qu'estimés, et la vitrine, c'est le site lui-même.",
	],
};

const ARCHITECTURE_MERMAID = {
	en: [
		'```mermaid',
		'flowchart LR',
		'  directus["Directus CMS"] --> export["export-fallbacks.ts"]',
		'  export --> cache["21 typed content modules"]',
		'  cache --> manifest["SHA-256 manifest"]',
		'  cache --> svelte["SvelteKit prerender (EN + FR)"]',
		'  svelte --> vercel["Vercel edge"]',
		'```',
	].join('\n'),
	fr: [
		'```mermaid',
		'flowchart LR',
		'  directus["CMS Directus"] --> export["export-fallbacks.ts"]',
		'  export --> cache["21 modules de contenu typés"]',
		'  cache --> manifest["manifeste SHA-256"]',
		'  cache --> svelte["prérendu SvelteKit (FR + EN)"]',
		'  svelte --> vercel["edge Vercel"]',
		'```',
	].join('\n'),
};

const TEST_RECEIPTS = {
	en: [
		'```sh',
		'cd apps/web && bunx vitest run        # 1,871 tests, 170 files',
		'cd apps/cms && bun test               # 729 tests, 69 files',
		'bun run --cwd packages/shared test    # 84 tests',
		'bun run --cwd packages/tokens test    # 43 tests',
		'cd apps/web && bunx playwright test   # 424 e2e tests, 37 files',
		'```',
	].join('\n'),
	fr: [
		'```sh',
		'cd apps/web && bunx vitest run        # 1 871 tests, 170 fichiers',
		'cd apps/cms && bun test               # 729 tests, 69 fichiers',
		'bun run --cwd packages/shared test    # 84 tests',
		'bun run --cwd packages/tokens test    # 43 tests',
		'cd apps/web && bunx playwright test   # 424 tests e2e, 37 fichiers',
		'```',
	].join('\n'),
};

const LOCALE_LOCK = {
	en: [
		'```ts',
		'// apps/web/src/lib/content/integrity.test.ts',
		'const LOCKED = { TOTAL: 650, WITH_FR: 650, NO_FR: 0, ES_WITHOUT_FR: 0 };',
		'// 650 visitor-facing strings walked. 650 carry French. Zero debt.',
		'// Strip one translation and the suite goes red before the push.',
		'```',
	].join('\n'),
	fr: [
		'```ts',
		'// apps/web/src/lib/content/integrity.test.ts',
		'const LOCKED = { TOTAL: 650, WITH_FR: 650, NO_FR: 0, ES_WITHOUT_FR: 0 };',
		'// 650 chaînes visibles par les visiteurs. 650 avec leur français. Zéro dette.',
		'// Retire une traduction et la suite vire au rouge avant la poussée.',
		'```',
	].join('\n'),
};

interface SectionSpec {
	sort: number;
	en: { title: string; content: ReturnType<typeof blockDoc> };
	fr: { title: string; content: ReturnType<typeof blockDoc> };
}

const SECTIONS: SectionSpec[] = [
	{
		sort: 1,
		en: {
			title: 'Images',
			content: blockDoc(
				image('img-desktop-en', SCREENSHOTS.home, 'Desktop view of the yesid.dev home page, the same image used on the project list and proof reel.', SCREENSHOTS.homeLight),
				image('img-mobile-en', SCREENSHOTS.mobile, 'Mobile view of the yesid.dev home page, used as the optional secondary hero image.', SCREENSHOTS.mobileLight),
			),
		},
		fr: {
			title: 'Images',
			content: blockDoc(
				image('img-desktop-fr', SCREENSHOTS.home, "Vue bureau de la page d'accueil yesid.dev, la même image utilisée dans la liste des projets et le proof reel.", SCREENSHOTS.homeLight),
				image('img-mobile-fr', SCREENSHOTS.mobile, "Vue mobile de la page d'accueil yesid.dev, utilisée comme deuxième image héro optionnelle.", SCREENSHOTS.mobileLight),
			),
		},
	},
	{
		sort: 2,
		en: {
			title: 'The site is the case study',
			content: blockDoc(
				paragraph('p1', 'Most portfolios describe work. This one has to survive it: the site is edited, built, tested and shipped by the same pipeline I would set up for a client, so the case study and the deliverable are the same artifact.'),
				paragraph('p2', 'The shape is simple. Content lives in `Directus` on a `Neon` Postgres instance. At build time, `export-fallbacks.ts` regenerates `21` typed TypeScript modules from live CMS state and records each one in a SHA-256 manifest. `SvelteKit` prerenders every page in English and French, and `Vercel` serves the result. Visitors never wake the CMS: `0` calls per visit.'),
				code('architecture-mermaid-en', ARCHITECTURE_MERMAID.en),
				paragraph('p3', 'That boundary is enforced, not promised. On Vercel the export is live-or-die: if the CMS cannot be reached, the build fails instead of shipping stale content. Locally a fallback is allowed, but it prints a banner you cannot miss and the manifest records which modules came from cache. A pre-commit hook and a CI check both reject hand-edits to generated files. I edit the CMS, or nothing.'),
			),
		},
		fr: {
			title: "Le site est l'étude de cas",
			content: blockDoc(
				paragraph('p1', "La plupart des portfolios décrivent le travail. Celui-ci doit y survivre : le site est édité, construit, testé et livré par le même pipeline que je monterais pour un client. L'étude de cas et le livrable sont le même artefact."),
				paragraph('p2', "La forme est simple. Le contenu vit dans `Directus`, sur une instance Postgres `Neon`. Au moment du build, `export-fallbacks.ts` régénère `21` modules TypeScript typés à partir de l'état réel du CMS et note chacun dans un manifeste SHA-256. `SvelteKit` prérend chaque page en français et en anglais, puis `Vercel` sert le résultat. Les visiteurs ne réveillent jamais le CMS : `0` appel par visite."),
				code('architecture-mermaid-fr', ARCHITECTURE_MERMAID.fr),
				paragraph('p3', "Cette frontière est appliquée, pas promise. Sur Vercel, l'export est vivant ou mort : si le CMS ne répond pas, le build échoue au lieu de livrer du contenu périmé. En local, un fallback est permis, mais il affiche une bannière impossible à manquer et le manifeste note quels modules viennent du cache. Un hook pre-commit et une vérification CI rejettent tous les deux les modifications à la main des fichiers générés. J'édite le CMS, ou rien."),
			),
		},
	},
	{
		sort: 3,
		en: {
			title: 'All four stations on one line',
			content: blockDoc(
				paragraph('p1', 'The services page draws a metro line with four stations: Databases & SQL, Pipelines & Automation, Dashboards & Analytics, Websites & E-commerce. This build stops at every one of them, not as a demo but as load-bearing structure.'),
				unorderedList('stations-en', [
					'`Databases & SQL`: the content sits in a Neon Postgres instance behind Directus. The schema ships as versioned snapshots, tags and tech stack are real M2M relations instead of denormalized JSON, and autosuspend tuning keeps the database bill close to zero between visits.',
					'`Pipelines & Automation`: a publish in the CMS fires a deploy hook, the build pulls live content, regenerates every module and hashes it into a manifest. The scripts that can write to the CMS all refuse to touch prod by accident.',
					'`Dashboards & Analytics`: the metrics at the top of this page are not marketing copy. Test counts, locale coverage and byte budgets come out of commands that can be rerun, and the important ones are pinned as failing tests. That is the same discipline I want in any dashboard: numbers with receipts.',
					'`Websites & E-commerce`: the storefront is the site you are reading. Bilingual by default, prerendered in English and French, light and dark themes, and a `prefers-reduced-motion` contract checked end to end. The e-commerce half of this station gets proven on client work instead.',
				]),
				delimiter('stations-divider-en'),
				paragraph('p2', 'The metro is not a paint job either. The NEXT STOP chrome, the terminus board and the little delay dashboard in the hero all read their labels from the same CMS pipeline as the rest of the copy, so even the set dressing is bilingual and covered by the tests.'),
			),
		},
		fr: {
			title: 'Les quatre stations sur une même ligne',
			content: blockDoc(
				paragraph('p1', "La page services trace une ligne de métro à quatre stations : Bases de données et SQL, Pipelines et automatisation, Tableaux de bord et analytique, Sites web et commerce en ligne. Ce build s'arrête à chacune d'elles, pas comme démo, mais comme structure porteuse."),
				unorderedList('stations-fr', [
					"`Bases de données et SQL` : le contenu repose dans une instance Postgres Neon derrière Directus. Le schéma est versionné en snapshots, les tags et la pile technique sont de vraies relations M2M au lieu de JSON dénormalisé, et le réglage de l'autosuspend garde la facture de base de données proche de zéro entre les visites.",
					'`Pipelines et automatisation` : une publication dans le CMS déclenche un hook de déploiement, le build tire le contenu réel, régénère chaque module et le hache dans un manifeste. Les scripts capables d\'écrire dans le CMS refusent tous de toucher la prod par accident.',
					"`Tableaux de bord et analytique` : les métriques en haut de cette page ne sont pas du marketing. Les comptes de tests, la couverture de langue et les budgets d'octets sortent de commandes qu'on peut relancer, et les plus importants sont verrouillés par des tests qui échouent. C'est la même discipline que je veux dans n'importe quel tableau de bord : des chiffres avec des reçus.",
					"`Sites web et commerce en ligne` : la vitrine, c'est le site que tu es en train de lire. Bilingue par défaut, prérendu en français et en anglais, thèmes clair et sombre, et un contrat `prefers-reduced-motion` vérifié de bout en bout. Le volet commerce en ligne de cette station se prouve plutôt sur les mandats clients.",
				]),
				delimiter('stations-divider-fr'),
				paragraph('p2', "Le métro n'est pas non plus une couche de peinture. Le chrome PROCHAIN ARRÊT, le tableau du terminus et le petit tableau des retards dans le héro lisent leurs étiquettes du même pipeline CMS que le reste du texte. Même le décor est bilingue et couvert par les tests."),
			),
		},
	},
	{
		sort: 4,
		en: {
			title: 'Numbers with receipts',
			content: blockDoc(
				paragraph('p1', 'Metrics rot fast on portfolio sites, so here is where mine come from. Every suite below was green the day this page was written, and the counts are the test reporter\'s output, not a guess.'),
				code('test-receipts-en', TEST_RECEIPTS.en),
				paragraph('p2', 'That is `3,151` tests between a content edit and production. The Playwright end-to-end suite runs sharded three ways in CI against a hermetic local preview: no deployed URL, no edge quota spent, just the build under test.'),
				paragraph('p3', 'The bilingual promise is a failing test, not a policy. An integrity walker visits every visitor-facing string in the generated content and locks the counts:'),
				code('locale-lock-en', LOCALE_LOCK.en),
				paragraph('p4', 'The same reflex guards the rest of the build:'),
				unorderedList('guardrails-en', [
					'`svelte-check` warnings are locked at `0`. The gate went from 46 to zero without a single suppression, and CI fails if one grows back.',
					'Content schemas live once in `packages/shared` as `Zod` schemas, imported by both the web app and the CMS scripts, so the two ends of the pipeline cannot drift apart quietly.',
					'The interactive stack engine stays code-split behind a pinned 25 KB gzip budget, re-measured after every build.',
					'OG share cards are minted from the canonical wordmark SVG at 1200x630, with a hard 150 KB budget per card.',
					'CI is cost-aware on purpose: PR-only triggers, a shared turbo remote cache, cached browsers and a skip label for docs-only changes. I burned through the free GitHub Actions minutes once. Once.',
				]),
				paragraph('p5', 'None of this is exotic. It is ordinary digital infrastructure, pointed at my own site first. If you want to know what working with me looks like, this page is the answer: the pipeline that built it is the pitch.'),
			),
		},
		fr: {
			title: 'Des chiffres avec des reçus',
			content: blockDoc(
				paragraph('p1', "Les métriques pourrissent vite sur les sites portfolio, alors voici d'où viennent les miennes. Chaque suite ci-dessous était au vert le jour où cette page a été écrite, et les comptes sortent du rapporteur de tests, pas d'une estimation."),
				code('test-receipts-fr', TEST_RECEIPTS.fr),
				paragraph('p2', "Ça fait `3 151` tests entre une modification de contenu et la production. La suite Playwright de bout en bout roule en trois shards en CI contre un aperçu local hermétique : pas d'URL déployée, pas de quota edge dépensé, juste le build sous test."),
				paragraph('p3', "La promesse bilingue est un test qui échoue, pas une politique. Un marcheur d'intégrité visite chaque chaîne visible par les visiteurs dans le contenu généré et verrouille les comptes :"),
				code('locale-lock-fr', LOCALE_LOCK.fr),
				paragraph('p4', 'Le même réflexe garde le reste du build :'),
				unorderedList('guardrails-fr', [
					"Les avertissements `svelte-check` sont verrouillés à `0`. La gate est passée de 46 à zéro sans une seule suppression, et la CI échoue si un seul repousse.",
					"Les schémas de contenu vivent une seule fois dans `packages/shared`, en schémas `Zod` importés par l'app web et par les scripts CMS. Les deux bouts du pipeline ne peuvent pas dériver en silence.",
					'Le moteur de pile interactif reste séparé du bundle principal, derrière un budget gzip épinglé à 25 Ko et remesuré après chaque build.',
					'Les cartes de partage OG sont frappées à partir du wordmark SVG canonique, en 1200x630, avec un budget dur de 150 Ko par carte.',
					"La CI est frugale exprès : déclencheurs sur PR seulement, cache distant turbo partagé, navigateurs en cache et une étiquette pour sauter les changements de docs. J'ai déjà brûlé les minutes gratuites de GitHub Actions une fois. Une seule.",
				]),
				paragraph('p5', "Rien de tout ça n'est exotique. C'est de l'infrastructure numérique ordinaire, pointée d'abord vers mon propre site. Si tu veux savoir de quoi ça a l'air de travailler avec moi, cette page est la réponse : le pipeline qui l'a construite, c'est le pitch."),
			),
		},
	},
];

interface MetricSpec { sort: number; value: string; en: string; fr: string }
// Replaces the '62K+ lines of code' vanity metric and the stale '1,776' test
// count. '3,151' = 1,871 web vitest + 729 cms bun test + 84 shared + 43 tokens
// + 424 Playwright e2e; '650' is the integrity-lock LOCKED.TOTAL. Update both
// alongside the "Numbers with receipts" section when the suites move.
const METRICS: MetricSpec[] = [
	{ sort: 1, value: '3,151', en: 'tests guarding the build', fr: 'tests qui gardent le build' },
	{ sort: 2, value: '0', en: 'CMS calls per visit', fr: 'appels au CMS par visite' },
	{ sort: 3, value: '650', en: 'bilingual strings, locked by a test', fr: 'chaînes bilingues, verrouillées par un test' },
	{ sort: 4, value: '100%', en: 'content from the CMS', fr: 'contenu venu du CMS' },
	{ sort: 5, value: '0', en: 'warnings tolerated in CI', fr: 'avertissements tolérés en CI' },
];

interface Schema {
	projects: Array<{ id: string }>;
	projects_translations: Array<{ id: number; projects_id: string; languages_code: string }>;
	projects_sections: Array<{ id: number; projects_id: string; translations?: Array<{ id: number }> }>;
	projects_impact_metrics: Array<{ id: number; projects_id: string; translations?: Array<{ id: number }> }>;
}
type Client = ReturnType<typeof createClient<Schema>>;

async function trRowId(client: Client, lang: string): Promise<number> {
	const rows = (await client.request(
		readItems('projects_translations', { filter: { projects_id: { _eq: SLUG }, languages_code: { _eq: lang } }, fields: ['id'], limit: 1 }),
	)) as Array<{ id: number }>;
	if (!rows[0]) throw new Error(`no ${lang} projects_translations row for ${SLUG}`);
	return rows[0].id;
}

async function clearChildren(client: Client, collection: 'projects_sections' | 'projects_impact_metrics'): Promise<void> {
	const rows = (await client.request(
		readItems(collection, { filter: { projects_id: { _eq: SLUG } }, fields: ['id', { translations: ['id'] }] as unknown as string[], limit: -1 }),
	)) as Array<{ id: number; translations?: Array<{ id: number }> }>;
	const trIds = rows.flatMap((r) => (r.translations ?? []).map((t) => t.id));
	const ids = rows.map((r) => r.id);
	if (trIds.length) await client.request(deleteItems(`${collection}_translations` as never, trIds as never));
	if (ids.length) await client.request(deleteItems(collection as never, ids as never));
}

export async function apply(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	await client.request(updateItem('projects', SLUG, {
		hero_image: SCREENSHOTS.home.fileId,
		hero_image_light: SCREENSHOTS.homeLight.fileId,
		hero_image_secondary: SCREENSHOTS.mobile.fileId,
		hero_image_secondary_light: SCREENSHOTS.mobileLight.fileId,
		featured: true,
	} as object));
	log.info(`  ~ ${SLUG}: hero media + featured toggle`);

	for (const lang of ['en', 'fr'] as const) {
		const id = await trRowId(client, lang);
		await client.request(updateItem('projects_translations', id, { title: 'yesid.dev', one_liner: ONE_LINER[lang], description: doc(...DESCRIPTION[lang]) } as object));
		log.info(`  ~ translations (${lang}, #${id}): title + one_liner + description`);
	}

	await clearChildren(client, 'projects_sections');
	for (const s of SECTIONS) {
		await client.request(createItem('projects_sections', {
			projects_id: SLUG,
			sort: s.sort,
			translations: [
				{ languages_code: 'en', title: s.en.title, content: s.en.content },
				{ languages_code: 'fr', title: s.fr.title, content: s.fr.content },
			],
		} as object));
		log.info(`    + section ${s.sort}: ${s.en.title}`);
	}

	await clearChildren(client, 'projects_impact_metrics');
	for (const m of METRICS) {
		await client.request(createItem('projects_impact_metrics', {
			projects_id: SLUG,
			sort: m.sort,
			value: m.value,
			before: null,
			translations: [
				{ languages_code: 'en', label: m.en },
				{ languages_code: 'fr', label: m.fr },
			],
		} as object));
		log.info(`    + metric ${m.sort}: ${m.value} ${m.en}`);
	}
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);
	if (!apply_) {
		log.info(`  ~ would set ${SLUG}: hero media, featured toggle, en+fr title/one_liner/description, ${SECTIONS.length} sections, ${METRICS.length} metrics`);
		log.info('dry-run complete. Pass --apply to execute.');
		return;
	}
	assertDevCms(url);
	const token = await getAdminToken(url);
	try {
		await apply({ directusUrl: url, token });
		log.info('done.');
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `yesid case-study load failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[content-projects-yesid] FAILED:', err);
		process.exit(1);
	});
}
