// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { Project } from '$lib/types';

export const projects: readonly Project[] = [
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev is the one project where I am both the client and the contractor. It is a bilingual SvelteKit site edited in `Directus`, regenerated into typed TypeScript modules at build time, and served prerendered from the `Vercel` edge with `0` CMS calls per visit.',
						},
						id: 'p1',
						type: 'paragraph',
					},
					{
						data: {
							text: 'It is also the working proof for all four services. The content lives in a Postgres database I tune myself, a pipeline rebuilds the site on every publish, the numbers in this case study are measured rather than estimated, and the storefront is the site itself.',
						},
						id: 'p2',
						type: 'paragraph',
					},
				],
				time: 1750000000000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'yesid.dev est le seul projet où je suis à la fois le client et l\'entrepreneur. C\'est un site SvelteKit bilingue, édité dans `Directus`, régénéré en modules TypeScript typés au moment du build, puis servi prérendu depuis l\'edge `Vercel` avec `0` appel au CMS par visite.',
						},
						id: 'p1',
						type: 'paragraph',
					},
					{
						data: {
							text: 'C\'est aussi la preuve en marche des quatre services. Le contenu vit dans une base Postgres que j\'ajuste moi-même, un pipeline reconstruit le site à chaque publication, les chiffres de cette étude de cas sont mesurés plutôt qu\'estimés, et la vitrine, c\'est le site lui-même.',
						},
						id: 'p2',
						type: 'paragraph',
					},
				],
				time: 1750000000000,
				version: '2.31.2',
			},
		},
		featured: true,
		image: '6048a712-de42-4cca-ab51-6f92d64685c2',
		imageLight: 'c2bb6564-62ab-46c4-962b-ab2c756fde9e',
		imageSecondary: 'c2fad757-ecba-457c-aff7-47d3cc504081',
		imageSecondaryLight: '9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
		impactMetric: {
			label: {
				en: 'tests guarding the build',
				fr: 'tests qui gardent le build',
			},
			value: '3,151',
		},
		impactMetrics: [
			{
				label: {
					en: 'tests guarding the build',
					fr: 'tests qui gardent le build',
				},
				value: '3,151',
			},
			{
				label: {
					en: 'CMS calls per visit',
					fr: 'appels au CMS par visite',
				},
				value: '0',
			},
			{
				label: {
					en: 'bilingual strings, locked by a test',
					fr: 'chaînes bilingues, verrouillées par un test',
				},
				value: '650',
			},
			{
				label: { en: 'content from the CMS', fr: 'contenu venu du CMS' },
				value: '100%',
			},
			{
				label: {
					en: 'warnings tolerated in CI',
					fr: 'avertissements tolérés en CI',
				},
				value: '0',
			},
		],
		liveUrl: 'https://yesid.dev',
		oneLiner: {
			en: 'My own site, run like client work: the CMS is the source of truth, the edge serves generated content, and every claim is locked by a test.',
			fr: 'Mon propre site, mené comme un mandat client : le CMS comme source de vérité, du contenu généré servi à l\'edge, et chaque affirmation verrouillée par un test.',
		},
		relatedServices: ['web-development', 'database-engineering'],
		repoPrivate: true,
		repoUrl: 'https://github.com/mgkdante/yesid.dev',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									caption: 'Desktop view of the yesid.dev home page, the same image used on the project list and proof reel.',
									file: {
										extension: 'png',
										fileId: '6048a712-de42-4cca-ab51-6f92d64685c2',
										fileURL: '/files/6048a712-de42-4cca-ab51-6f92d64685c2',
										height: 920,
										name: 'yesid-dev-home.png',
										title: 'yesid.dev home screenshot',
										url: '/assets/6048a712-de42-4cca-ab51-6f92d64685c2',
										width: 1440,
									},
									stretched: true,
									variants: {
										light: {
											extension: 'png',
											fileId: 'c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											fileURL: '/files/c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											height: 920,
											name: 'yesid-dev-home-light.png',
											title: 'yesid.dev home screenshot light',
											url: '/assets/c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											width: 1440,
										},
									},
									withBackground: false,
									withBorder: true,
								},
								id: 'img-desktop-en',
								type: 'image',
							},
							{
								data: {
									caption: 'Mobile view of the yesid.dev home page, used as the optional secondary hero image.',
									file: {
										extension: 'png',
										fileId: 'c2fad757-ecba-457c-aff7-47d3cc504081',
										fileURL: '/files/c2fad757-ecba-457c-aff7-47d3cc504081',
										height: 844,
										name: 'yesid-dev-mobile.png',
										title: 'yesid.dev mobile screenshot',
										url: '/assets/c2fad757-ecba-457c-aff7-47d3cc504081',
										width: 390,
									},
									stretched: true,
									variants: {
										light: {
											extension: 'png',
											fileId: '9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											fileURL: '/files/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											height: 844,
											name: 'yesid-dev-mobile-light.png',
											title: 'yesid.dev mobile screenshot light',
											url: '/assets/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											width: 390,
										},
									},
									withBackground: false,
									withBorder: true,
								},
								id: 'img-mobile-en',
								type: 'image',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									caption: 'Vue bureau de la page d\'accueil yesid.dev, la même image utilisée dans la liste des projets et le proof reel.',
									file: {
										extension: 'png',
										fileId: '6048a712-de42-4cca-ab51-6f92d64685c2',
										fileURL: '/files/6048a712-de42-4cca-ab51-6f92d64685c2',
										height: 920,
										name: 'yesid-dev-home.png',
										title: 'yesid.dev home screenshot',
										url: '/assets/6048a712-de42-4cca-ab51-6f92d64685c2',
										width: 1440,
									},
									stretched: true,
									variants: {
										light: {
											extension: 'png',
											fileId: 'c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											fileURL: '/files/c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											height: 920,
											name: 'yesid-dev-home-light.png',
											title: 'yesid.dev home screenshot light',
											url: '/assets/c2bb6564-62ab-46c4-962b-ab2c756fde9e',
											width: 1440,
										},
									},
									withBackground: false,
									withBorder: true,
								},
								id: 'img-desktop-fr',
								type: 'image',
							},
							{
								data: {
									caption: 'Vue mobile de la page d\'accueil yesid.dev, utilisée comme deuxième image héro optionnelle.',
									file: {
										extension: 'png',
										fileId: 'c2fad757-ecba-457c-aff7-47d3cc504081',
										fileURL: '/files/c2fad757-ecba-457c-aff7-47d3cc504081',
										height: 844,
										name: 'yesid-dev-mobile.png',
										title: 'yesid.dev mobile screenshot',
										url: '/assets/c2fad757-ecba-457c-aff7-47d3cc504081',
										width: 390,
									},
									stretched: true,
									variants: {
										light: {
											extension: 'png',
											fileId: '9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											fileURL: '/files/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											height: 844,
											name: 'yesid-dev-mobile-light.png',
											title: 'yesid.dev mobile screenshot light',
											url: '/assets/9af53f0b-aeb9-4d3f-94a6-1ba3476a4f12',
											width: 390,
										},
									},
									withBackground: false,
									withBorder: true,
								},
								id: 'img-mobile-fr',
								type: 'image',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: { en: 'Images', fr: 'Images' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Most portfolios describe work. This one has to survive it: the site is edited, built, tested and shipped by the same pipeline I would set up for a client, so the case study and the deliverable are the same artifact.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The shape is simple. Content lives in `Directus` on a `Neon` Postgres instance. At build time, `export-fallbacks.ts` regenerates `21` typed TypeScript modules from live CMS state and records each one in a SHA-256 manifest. `SvelteKit` prerenders every page in English and French, and `Vercel` serves the result. Visitors never wake the CMS: `0` calls per visit.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```mermaid\nflowchart LR\n  directus["Directus CMS"] --> export["export-fallbacks.ts"]\n  export --> cache["21 typed content modules"]\n  cache --> manifest["SHA-256 manifest"]\n  cache --> svelte["SvelteKit prerender (EN + FR)"]\n  svelte --> vercel["Vercel edge"]\n```',
								},
								id: 'architecture-mermaid-en',
								type: 'code',
							},
							{
								data: {
									text: 'That boundary is enforced, not promised. On Vercel the export is live-or-die: if the CMS cannot be reached, the build fails instead of shipping stale content. Locally a fallback is allowed, but it prints a banner you cannot miss and the manifest records which modules came from cache. A pre-commit hook and a CI check both reject hand-edits to generated files. I edit the CMS, or nothing.',
								},
								id: 'p3',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La plupart des portfolios décrivent le travail. Celui-ci doit y survivre : le site est édité, construit, testé et livré par le même pipeline que je monterais pour un client. L\'étude de cas et le livrable sont le même artefact.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La forme est simple. Le contenu vit dans `Directus`, sur une instance Postgres `Neon`. Au moment du build, `export-fallbacks.ts` régénère `21` modules TypeScript typés à partir de l\'état réel du CMS et note chacun dans un manifeste SHA-256. `SvelteKit` prérend chaque page en français et en anglais, puis `Vercel` sert le résultat. Les visiteurs ne réveillent jamais le CMS : `0` appel par visite.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```mermaid\nflowchart LR\n  directus["CMS Directus"] --> export["export-fallbacks.ts"]\n  export --> cache["21 modules de contenu typés"]\n  cache --> manifest["manifeste SHA-256"]\n  cache --> svelte["prérendu SvelteKit (FR + EN)"]\n  svelte --> vercel["edge Vercel"]\n```',
								},
								id: 'architecture-mermaid-fr',
								type: 'code',
							},
							{
								data: {
									text: 'Cette frontière est appliquée, pas promise. Sur Vercel, l\'export est vivant ou mort : si le CMS ne répond pas, le build échoue au lieu de livrer du contenu périmé. En local, un fallback est permis, mais il affiche une bannière impossible à manquer et le manifeste note quels modules viennent du cache. Un hook pre-commit et une vérification CI rejettent tous les deux les modifications à la main des fichiers générés. J\'édite le CMS, ou rien.',
								},
								id: 'p3',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'The site is the case study',
					fr: 'Le site est l\'étude de cas',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The services page draws a metro line with four stations: Databases & SQL, Pipelines & Automation, Dashboards & Analytics, Websites & E-commerce. This build stops at every one of them, not as a demo but as load-bearing structure.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '`Databases & SQL`: the content sits in a Neon Postgres instance behind Directus. The schema ships as versioned snapshots, tags and tech stack are real M2M relations instead of denormalized JSON, and autosuspend tuning keeps the database bill close to zero between visits.',
											items: [],
										},
										{
											content: '`Pipelines & Automation`: a publish in the CMS fires a deploy hook, the build pulls live content, regenerates every module and hashes it into a manifest. The scripts that can write to the CMS all refuse to touch prod by accident.',
											items: [],
										},
										{
											content: '`Dashboards & Analytics`: the metrics at the top of this page are not marketing copy. Test counts, locale coverage and byte budgets come out of commands that can be rerun, and the important ones are pinned as failing tests. That is the same discipline I want in any dashboard: numbers with receipts.',
											items: [],
										},
										{
											content: '`Websites & E-commerce`: the storefront is the site you are reading. Bilingual by default, prerendered in English and French, light and dark themes, and a `prefers-reduced-motion` contract checked end to end. The e-commerce half of this station gets proven on client work instead.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'stations-en',
								type: 'nestedlist',
							},
							{
								data: {},
								id: 'stations-divider-en',
								type: 'delimiter',
							},
							{
								data: {
									text: 'The metro is not a paint job either. The NEXT STOP chrome, the terminus board and the little delay dashboard in the hero all read their labels from the same CMS pipeline as the rest of the copy, so even the set dressing is bilingual and covered by the tests.',
								},
								id: 'p2',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La page services trace une ligne de métro à quatre stations : Bases de données et SQL, Pipelines et automatisation, Tableaux de bord et analytique, Sites web et commerce en ligne. Ce build s\'arrête à chacune d\'elles, pas comme démo, mais comme structure porteuse.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '`Bases de données et SQL` : le contenu repose dans une instance Postgres Neon derrière Directus. Le schéma est versionné en snapshots, les tags et la pile technique sont de vraies relations M2M au lieu de JSON dénormalisé, et le réglage de l\'autosuspend garde la facture de base de données proche de zéro entre les visites.',
											items: [],
										},
										{
											content: '`Pipelines et automatisation` : une publication dans le CMS déclenche un hook de déploiement, le build tire le contenu réel, régénère chaque module et le hache dans un manifeste. Les scripts capables d\'écrire dans le CMS refusent tous de toucher la prod par accident.',
											items: [],
										},
										{
											content: '`Tableaux de bord et analytique` : les métriques en haut de cette page ne sont pas du marketing. Les comptes de tests, la couverture de langue et les budgets d\'octets sortent de commandes qu\'on peut relancer, et les plus importants sont verrouillés par des tests qui échouent. C\'est la même discipline que je veux dans n\'importe quel tableau de bord : des chiffres avec des reçus.',
											items: [],
										},
										{
											content: '`Sites web et commerce en ligne` : la vitrine, c\'est le site que tu es en train de lire. Bilingue par défaut, prérendu en français et en anglais, thèmes clair et sombre, et un contrat `prefers-reduced-motion` vérifié de bout en bout. Le volet commerce en ligne de cette station se prouve plutôt sur les mandats clients.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'stations-fr',
								type: 'nestedlist',
							},
							{
								data: {},
								id: 'stations-divider-fr',
								type: 'delimiter',
							},
							{
								data: {
									text: 'Le métro n\'est pas non plus une couche de peinture. Le chrome PROCHAIN ARRÊT, le tableau du terminus et le petit tableau des retards dans le héro lisent leurs étiquettes du même pipeline CMS que le reste du texte. Même le décor est bilingue et couvert par les tests.',
								},
								id: 'p2',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'All four stations on one line',
					fr: 'Les quatre stations sur une même ligne',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Metrics rot fast on portfolio sites, so here is where mine come from. Every suite below was green the day this page was written, and the counts are the test reporter\'s output, not a guess.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\ncd apps/web && bunx vitest run        # 1,871 tests, 170 files\ncd apps/cms && bun test               # 729 tests, 69 files\nbun run --cwd packages/shared test    # 84 tests\nbun run --cwd packages/tokens test    # 43 tests\ncd apps/web && bunx playwright test   # 424 e2e tests, 37 files\n```',
								},
								id: 'test-receipts-en',
								type: 'code',
							},
							{
								data: {
									text: 'That is `3,151` tests between a content edit and production. The Playwright end-to-end suite runs sharded three ways in CI against a hermetic local preview: no deployed URL, no edge quota spent, just the build under test.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The bilingual promise is a failing test, not a policy. An integrity walker visits every visitor-facing string in the generated content and locks the counts:',
								},
								id: 'p3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\n// apps/web/src/lib/content/integrity.test.ts\nconst LOCKED = { TOTAL: 650, WITH_FR: 650, NO_FR: 0, ES_WITHOUT_FR: 0 };\n// 650 visitor-facing strings walked. 650 carry French. Zero debt.\n// Strip one translation and the suite goes red before the push.\n```',
								},
								id: 'locale-lock-en',
								type: 'code',
							},
							{
								data: { text: 'The same reflex guards the rest of the build:' },
								id: 'p4',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '`svelte-check` warnings are locked at `0`. The gate went from 46 to zero without a single suppression, and CI fails if one grows back.',
											items: [],
										},
										{
											content: 'Content schemas live once in `packages/shared` as `Zod` schemas, imported by both the web app and the CMS scripts, so the two ends of the pipeline cannot drift apart quietly.',
											items: [],
										},
										{
											content: 'The interactive stack engine stays code-split behind a pinned 25 KB gzip budget, re-measured after every build.',
											items: [],
										},
										{
											content: 'OG share cards are minted from the canonical wordmark SVG at 1200x630, with a hard 150 KB budget per card.',
											items: [],
										},
										{
											content: 'CI is cost-aware on purpose: PR-only triggers, a shared turbo remote cache, cached browsers and a skip label for docs-only changes. I burned through the free GitHub Actions minutes once. Once.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'guardrails-en',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'None of this is exotic. It is ordinary digital infrastructure, pointed at my own site first. If you want to know what working with me looks like, this page is the answer: the pipeline that built it is the pitch.',
								},
								id: 'p5',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les métriques pourrissent vite sur les sites portfolio, alors voici d\'où viennent les miennes. Chaque suite ci-dessous était au vert le jour où cette page a été écrite, et les comptes sortent du rapporteur de tests, pas d\'une estimation.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\ncd apps/web && bunx vitest run        # 1 871 tests, 170 fichiers\ncd apps/cms && bun test               # 729 tests, 69 fichiers\nbun run --cwd packages/shared test    # 84 tests\nbun run --cwd packages/tokens test    # 43 tests\ncd apps/web && bunx playwright test   # 424 tests e2e, 37 fichiers\n```',
								},
								id: 'test-receipts-fr',
								type: 'code',
							},
							{
								data: {
									text: 'Ça fait `3 151` tests entre une modification de contenu et la production. La suite Playwright de bout en bout roule en trois shards en CI contre un aperçu local hermétique : pas d\'URL déployée, pas de quota edge dépensé, juste le build sous test.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La promesse bilingue est un test qui échoue, pas une politique. Un marcheur d\'intégrité visite chaque chaîne visible par les visiteurs dans le contenu généré et verrouille les comptes :',
								},
								id: 'p3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\n// apps/web/src/lib/content/integrity.test.ts\nconst LOCKED = { TOTAL: 650, WITH_FR: 650, NO_FR: 0, ES_WITHOUT_FR: 0 };\n// 650 chaînes visibles par les visiteurs. 650 avec leur français. Zéro dette.\n// Retire une traduction et la suite vire au rouge avant la poussée.\n```',
								},
								id: 'locale-lock-fr',
								type: 'code',
							},
							{
								data: { text: 'Le même réflexe garde le reste du build :' },
								id: 'p4',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: 'Les avertissements `svelte-check` sont verrouillés à `0`. La gate est passée de 46 à zéro sans une seule suppression, et la CI échoue si un seul repousse.',
											items: [],
										},
										{
											content: 'Les schémas de contenu vivent une seule fois dans `packages/shared`, en schémas `Zod` importés par l\'app web et par les scripts CMS. Les deux bouts du pipeline ne peuvent pas dériver en silence.',
											items: [],
										},
										{
											content: 'Le moteur de pile interactif reste séparé du bundle principal, derrière un budget gzip épinglé à 25 Ko et remesuré après chaque build.',
											items: [],
										},
										{
											content: 'Les cartes de partage OG sont frappées à partir du wordmark SVG canonique, en 1200x630, avec un budget dur de 150 Ko par carte.',
											items: [],
										},
										{
											content: 'La CI est frugale exprès : déclencheurs sur PR seulement, cache distant turbo partagé, navigateurs en cache et une étiquette pour sauter les changements de docs. J\'ai déjà brûlé les minutes gratuites de GitHub Actions une fois. Une seule.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'guardrails-fr',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Rien de tout ça n\'est exotique. C\'est de l\'infrastructure numérique ordinaire, pointée d\'abord vers mon propre site. Si tu veux savoir de quoi ça a l\'air de travailler avec moi, cette page est la réponse : le pipeline qui l\'a construite, c\'est le pitch.',
								},
								id: 'p5',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Numbers with receipts',
					fr: 'Des chiffres avec des reçus',
				},
			},
		],
		slug: 'yesid-dev',
		stack: [
			'SvelteKit',
			'Svelte 5',
			'TypeScript',
			'Tailwind CSS',
			'GSAP',
			'Directus',
			'Neon',
			'Bun',
			'Turbo',
			'Vercel',
			'GitHub Actions',
			'Playwright',
			'Vitest',
		],
		status: 'public',
		tags: ['portfolio', 'web', 'svelte', 'cms', 'bilingual'],
		title: { en: 'yesid.dev', fr: 'yesid.dev' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A production data pipeline ingesting GTFS-RT feeds, transforming them with dbt, and surfacing KPIs in a Power BI dashboard. Built for a transit authority in Quebec.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409586,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Un pipeline de données en production qui ingère des flux GTFS-RT, les transforme avec dbt, et fait ressortir les KPI dans un tableau de bord Power BI. Bâti pour une société de transport au Québec.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409586,
				version: '2.31.2',
			},
		},
		environment: 'production',
		featured: true,
		impactMetric: {
			label: {
				en: 'Real-time refresh cycles',
				fr: 'Cycles de rafraîchissement en temps réel',
			},
			value: '30s',
		},
		impactMetrics: [
			{
				label: {
					en: 'Real-time refresh cycles',
					fr: 'Cycles de rafraîchissement en temps réel',
				},
				value: '30s',
			},
			{
				label: { en: 'Pipeline uptime', fr: 'Disponibilité du pipeline' },
				value: '99.9%',
			},
		],
		location: 'sherbrooke',
		oneLiner: {
			en: 'An end-to-end ELT pipeline processing real-time transit data for a regional operator.',
			fr: 'Un pipeline ELT de bout en bout qui traite les données de transport en temps réel pour un opérateur régional.',
		},
		relatedServices: [
			'data-pipeline',
			'database-engineering',
			'analytics-reporting',
			'web-development',
		],
		repoPrivate: true,
		repoUrl: 'https://github.com/mgkdante/transit',
		sections: [],
		slug: 'transit-data-pipeline',
		stack: [
			'PostgreSQL',
			'Python',
			'dbt',
			'Power BI',
			'Apache Airflow',
			'Docker',
			'GitHub Actions',
			'Playwright',
			'Vitest',
		],
		status: 'public',
		tags: ['etl', 'transit', 'postgresql', 'dbt'],
		title: {
			en: 'Transit Operations Data Pipeline',
			fr: 'Pipeline de données des opérations de transport',
		},
		version: '2.4.1',
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'Café Arona imports Cameroonian coffee into Québec, and ran its content in Webflow while selling through Webflow Ecommerce. Two surfaces, one small team. The goal: a single Shopify admin where they edit pages and run commerce in one place.',
						},
						id: 'p1',
						type: 'paragraph',
					},
					{
						data: {
							text: 'The build is a Shopify Online Store 2.0 Liquid theme, built up from the Skeleton Theme baseline to match the brand’s Figma identity, not a template re-skin. Content moved over programmatically: Bun and TypeScript importer scripts migrated the Webflow content into Shopify, repeatable and verifiable instead of copy-paste weekends.',
						},
						id: 'p2',
						type: 'paragraph',
					},
					{
						data: {
							text: 'French-primary and English-ready via Shopify Markets, with typography engineered from the Figma tokens and performance, accessibility and structured-data budgets wired into the tooling. Currently in final delivery with the client reviewing live rounds, full case study lands after cutover.',
						},
						id: 'p3',
						type: 'paragraph',
					},
				],
				time: 1781150000000,
				version: '2.31.2',
			},
			es: {
				blocks: [
					{
						data: {
							text: 'Migración completa de Webflow a Shopify: un solo admin para contenido y comercio, tema Liquid fiel a la identidad Figma, contenido migrado con scripts en Bun/TypeScript. Estudio de caso completo después del lanzamiento.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1781150000000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Café Arona importe du café camerounais au Québec, avec son contenu dans Webflow et sa boutique dans Webflow Ecommerce. Deux surfaces, une petite équipe. L’objectif : un seul admin Shopify pour gérer les pages et le commerce au même endroit.',
						},
						id: 'p1',
						type: 'paragraph',
					},
					{
						data: {
							text: 'Le projet : un thème Liquid Shopify Online Store 2.0, construit à partir du Skeleton Theme pour respecter l’identité Figma de la marque, pas un simple re-skin. Le contenu a été migré par programmation : des scripts Bun/TypeScript ont importé le contenu Webflow vers Shopify, de façon répétable et vérifiable.',
						},
						id: 'p2',
						type: 'paragraph',
					},
					{
						data: {
							text: 'Français d’abord, anglais via Shopify Markets, typographie calibrée depuis les tokens Figma, budgets de performance et d’accessibilité intégrés à l’outillage. Livraison finale en cours avec le client, l’étude de cas complète arrive après la mise en ligne.',
						},
						id: 'p3',
						type: 'paragraph',
					},
				],
				time: 1781150000000,
				version: '2.31.2',
			},
		},
		featured: false,
		location: 'Québec, CA',
		oneLiner: {
			en: 'Webflow → Shopify migration for a Québec importer of Cameroonian coffee.',
			es: 'Migración de Webflow a Shopify para un importador quebequense de café camerunés.',
			fr: 'Migration Webflow → Shopify pour un importateur québécois de café camerounais.',
		},
		relatedServices: ['web-development', 'analytics-reporting'],
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The Webflow → Shopify move is an ETL job wearing an e-commerce costume: extract the Webflow CMS collections, transform them into Shopify’s shape, load them through the Admin API. Scripted in Bun/TypeScript, it runs again in minutes if anything changes before cutover.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El paso de Webflow a Shopify es un trabajo de ETL disfrazado de e-commerce: extraer las colecciones de Webflow, transformarlas al formato de Shopify y cargarlas por la API Admin. Con scripts en Bun/TypeScript, se repite en minutos si algo cambia antes del corte.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le passage Webflow → Shopify est un travail d’ETL déguisé en e-commerce : extraire les collections Webflow, les transformer au format Shopify, les charger via l’API Admin. Scripté en Bun/TypeScript, il se relance en quelques minutes si quelque chose change avant la bascule.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Migration as a pipeline',
					es: 'La migración como pipeline',
					fr: 'La migration comme pipeline',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The client edits pages and products in a single Shopify admin. French leads, English follows through Shopify Markets, with an on-brand FR｜EN switcher on the storefront.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El cliente gestiona páginas y productos en un solo admin de Shopify. El francés lidera y el inglés sigue vía Shopify Markets, con un selector FR｜EN fiel a la marca.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le client gère pages et produits dans un seul admin Shopify. Le français mène, l’anglais suit via Shopify Markets, avec un sélecteur FR｜EN fidèle à la marque.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1781150000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'One admin, two languages',
					es: 'Un solo admin, dos idiomas',
					fr: 'Un seul admin, deux langues',
				},
			},
		],
		slug: 'cafe-arona',
		stack: [
			'Shopify',
			'Liquid',
			'Figma',
			'Bun',
			'TypeScript',
			'Playwright',
		],
		status: 'private',
		tags: ['e-commerce', 'migration', 'bilingual'],
		title: { en: 'Café Arona', es: 'Café Arona', fr: 'Café Arona' },
	},
];
