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
import { createClient, defaultDirectusUrl } from './lib/sdk';
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

const OVERVIEW = {
	en: 'Case study for a bilingual SvelteKit portfolio powered by Directus CMS, generated TypeScript caches, and Vercel edge delivery with zero CMS calls per visit.',
	fr: "Étude de cas d'un portfolio SvelteKit bilingue avec édition Directus CMS, contenu TypeScript généré et livraison edge Vercel sans appel CMS par visite.",
};

const ONE_LINER = {
	en: 'A bilingual CMS portfolio that edits in Directus and serves visitors from generated edge-ready content.',
	fr: 'Un portfolio CMS bilingue, édité dans Directus et servi aux visiteurs depuis du contenu généré prêt pour l’edge.',
};

const REGEN_SCRIPT = [
	'```sh',
	'export OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"',
	'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects',
	'```',
].join('\n');

const GENERATED_CACHE_CONTRACT = [
	'```ts',
	'type GeneratedContentCache = {',
	"  source: 'Directus CMS';",
	"  file: 'apps/web/src/lib/content/projects.ts';",
	"  contract: 'Project[]';",
	'  runtimeCmsCallsPerVisit: 0;',
	'};',
	'',
	'export const projects = [...] satisfies Project[];',
	'```',
].join('\n');

const PROJECT_HERO_MEDIA_CONTRACT = [
	'```ts',
	'type ProjectHeroMedia = {',
	'  image: string;',
	'  imageLight?: string;',
	'  imageSecondary?: string;',
	'  imageSecondaryLight?: string;',
	'  featured: boolean;',
	'};',
	'',
	'// image 1 drives desktop/default cards.',
	'// image 2 is optional and drives mobile/secondary split cards.',
	'```',
].join('\n');

const DEV_CONTENT_SCRIPT = [
	'```sh',
	'export OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"',
	'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/migrate-assets.ts',
	'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/content-projects-yesid.ts --apply',
	'op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects',
	'```',
].join('\n');

const QUALITY_GATES = [
	'```sh',
	'cd apps/web && bunx svelte-check --tsconfig ./tsconfig.json',
	'cd apps/cms && bun test',
	'cd apps/web && bunx vitest run',
	'```',
].join('\n');

const ARCHITECTURE_MERMAID = {
	en: [
		'```mermaid',
		'flowchart LR',
		'  directus["Directus CMS"] --> export["export-fallbacks.ts"]',
		'  export --> cache["generated TypeScript cache"]',
		'  cache --> svelte["SvelteKit"]',
		'  svelte --> vercel["Vercel edge"]',
		'```',
	].join('\n'),
	fr: [
		'```mermaid',
		'flowchart LR',
		'  directus["CMS Directus"] --> export["export-fallbacks.ts"]',
		'  export --> cache["cache TypeScript généré"]',
		'  cache --> svelte["SvelteKit"]',
		'  svelte --> vercel["edge Vercel"]',
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
			title: 'Outcome: CMS control, static delivery',
			content: doc(
				"yesid.dev is built for the same outcome I would sell to a client: edit content in `Directus`, regenerate the `TypeScript` cache, and ship pages that do not call the CMS for every visitor.",
				'The result is a bilingual site that stays easy to update without paying a runtime tax on every page view. Content has one source of truth, the site has fast edge delivery, and future projects can inherit the same brand system instead of starting from zero.',
			),
		},
		fr: {
			title: 'Résultat : contrôle CMS, livraison statique',
			content: doc(
				"yesid.dev est bâti autour du même résultat que je vendrais à un client : éditer le contenu dans `Directus`, régénérer le cache `TypeScript`, puis servir des pages qui n'appellent pas le CMS à chaque visite.",
				"Le résultat : un site bilingue facile à mettre à jour, sans taxe d'exécution sur chaque page vue. Le contenu garde une seule source de vérité, le site reste rapide à l'edge, et les prochains projets peuvent hériter du même système de marque au lieu de repartir à zéro.",
			),
		},
	},
	{
		sort: 3,
		en: {
			title: 'Identity and quality',
			content: doc(
				'Quality is part of the identity here. This is a proudly Quebec-built product, bilingual by default, with English and French treated as first-class surfaces instead of a translation pass at the end.',
				'The Montreal voice matters, but so do the details: mobile-first layout, accessible controls, `light` and `dark` themes, and `prefers-reduced-motion` behavior. The point is not just that the site looks like me. It has to behave like I care.',
			),
		},
		fr: {
			title: 'Identité et qualité',
			content: doc(
				"La qualité fait partie de l'identité ici. C'est un produit fièrement québécois, bilingue par défaut, avec le français et l'anglais traités comme deux surfaces de première classe au lieu d'une traduction ajoutée à la fin.",
				"La voix montréalaise compte, mais les détails aussi : une mise en page mobile-first, des contrôles accessibles, les thèmes `light` et `dark`, puis le comportement `prefers-reduced-motion`. Le but, ce n'est pas seulement que le site me ressemble. Il faut qu'il se comporte comme si je fais attention.",
			),
		},
	},
	{
		sort: 4,
		en: {
			title: 'Technical proof',
			content: blockDoc(
				paragraph('p1', 'The content pipeline is intentionally boring: `Directus` stores copy and media on `Neon`, `export-fallbacks.ts` pulls that state into a `generated TypeScript cache`, and `SvelteKit` serves the result through `Vercel`. The important part is the boundary: editors get a real CMS, visitors get edge-ready files.'),
				code('architecture-mermaid-en', ARCHITECTURE_MERMAID.en),
				unorderedList('technical-guarantees-en', [
					'`Directus` is the source of truth for copy, media, project sections, and metrics.',
					'The project row owns hero media, light variants, and the `featured` toggle for the home proof reel.',
					'Generated files under `apps/web/src/lib/content` are a build cache, not hand-authored content.',
					'Published visitors hit `SvelteKit` output and `Vercel` edge delivery with `0` CMS calls per visit.',
					'Dev CMS and prod CMS stay separated so content work can be reviewed before promotion.',
					'The integrity lock catches generated cache drift before a push can hide it.',
				]),
				delimiter('technical-divider-en'),
				paragraph('p2', 'The hero media model is explicit because gallery order is not a contract. Image 1 is the desktop/default card image. Image 2 is optional and only means mobile or secondary when the CMS field is filled. Extra gallery images stay in the case study body.'),
				code('project-hero-media-contract-en', PROJECT_HERO_MEDIA_CONTRACT),
				paragraph('p3', 'Assets and content move through the same repeatable path. Upload media to Directus, update the dev CMS row, then regenerate the fallback cache that the web app imports.'),
				code('dev-content-script-en', DEV_CONTENT_SCRIPT),
				paragraph('p4', 'The regen command can also run alone when the CMS already has the correct state and only the generated cache needs to be refreshed.'),
				code('regen-script-en', REGEN_SCRIPT),
				paragraph('p5', 'The generated module is the contract the web app consumes. The app imports typed content, not live CMS responses, so page rendering stays predictable and cheap.'),
				code('cache-contract-en', GENERATED_CACHE_CONTRACT),
				paragraph('p6', 'The quality gate is intentionally boring too. A content change still has to pass type checking, CMS script tests, web unit tests, and the integrity lock before it is ready for the operator push.'),
				code('quality-gates-en', QUALITY_GATES),
				paragraph('p7', 'The README collapsible is kept last on purpose. Public repos can feed it automatically; private client repos can keep the technical proof inside the CMS without exposing source code.'),
			),
		},
		fr: {
			title: 'Preuve technique',
			content: blockDoc(
				paragraph('p1', "Le pipeline de contenu est volontairement simple : `Directus` garde le texte et les médias sur `Neon`, `export-fallbacks.ts` transforme cet état en `cache TypeScript généré`, puis `SvelteKit` sert le résultat sur `Vercel`. Le point important, c'est la frontière : les éditeurs ont un vrai CMS, les visiteurs reçoivent des fichiers prêts pour l'edge."),
				code('architecture-mermaid-fr', ARCHITECTURE_MERMAID.fr),
				unorderedList('technical-guarantees-fr', [
					'`Directus` est la source de vérité pour le texte, les médias, les sections de projet et les métriques.',
					'La rangée projet possède les images héro, les variantes light et le toggle `featured` du proof reel.',
					'Les fichiers générés dans `apps/web/src/lib/content` sont un cache de build, pas du contenu écrit à la main.',
					'Les visiteurs publiés passent par la sortie `SvelteKit` et la livraison edge `Vercel`, avec `0` appel CMS par visite.',
					'Le CMS dev et le CMS prod restent séparés pour relire le contenu avant la promotion.',
					"Le verrou d'intégrité attrape les dérives du cache généré avant qu'une poussée puisse les cacher.",
				]),
				delimiter('technical-divider-fr'),
				paragraph('p2', "Le modèle média héro est explicite parce que l'ordre de la galerie n'est pas un contrat. L'image 1 est l'image bureau par défaut. L'image 2 est optionnelle et veut dire mobile ou secondaire seulement quand le champ CMS est rempli. Les autres images restent dans la galerie du cas d'étude."),
				code('project-hero-media-contract-fr', PROJECT_HERO_MEDIA_CONTRACT),
				paragraph('p3', 'Les assets et le contenu passent par le même chemin répétable. On envoie les médias dans Directus, on met à jour la rangée du CMS dev, puis on régénère le cache fallback importé par le site web.'),
				code('dev-content-script-fr', DEV_CONTENT_SCRIPT),
				paragraph('p4', "La commande de régénération peut aussi rouler seule quand le CMS contient déjà le bon état et que seul le cache généré doit être rafraîchi."),
				code('regen-script-fr', REGEN_SCRIPT),
				paragraph('p5', "Le module généré est le contrat consommé par l'app web. L'app importe du contenu typé, pas des réponses CMS en direct, donc le rendu reste prévisible et économique."),
				code('cache-contract-fr', GENERATED_CACHE_CONTRACT),
				paragraph('p6', "La gate de qualité reste volontairement simple. Même un changement de contenu doit passer le type checking, les tests des scripts CMS, les tests web et le verrou d'intégrité avant la poussée opérateur."),
				code('quality-gates-fr', QUALITY_GATES),
				paragraph('p7', 'Le collapsible README reste dernier exprès. Les repos publics peuvent le remplir automatiquement; les repos privés de clients peuvent garder la preuve technique dans le CMS sans exposer le code source.'),
			),
		},
	},
];

interface MetricSpec { sort: number; value: string; en: string; fr: string }
const METRICS: MetricSpec[] = [
	{ sort: 1, value: '62K+', en: 'lines of code', fr: 'lignes de code' },
	{ sort: 2, value: '100%', en: 'content from the CMS', fr: 'contenu venu du CMS' },
	{ sort: 3, value: '1,776', en: 'tests, every change', fr: 'tests, à chaque changement' },
	{ sort: 4, value: '0', en: 'CMS calls per visit', fr: 'appels au CMS par visite' },
	{ sort: 5, value: '2', en: 'languages, one source', fr: 'langues, une source' },
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
		await client.request(updateItem('projects_translations', id, { title: 'yesid.dev', one_liner: ONE_LINER[lang], description: doc(OVERVIEW[lang]) } as object));
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
	if (!url.includes('cms.dev.yesid.dev')) {
		throw new Error(`refusing --apply against non-dev URL '${url}'. Run via op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-projects-yesid.ts --apply`);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN (run via op run --env-file=apps/cms/.env)');
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
