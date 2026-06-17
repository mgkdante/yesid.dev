// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services). Helpers live in projects.companion.ts.
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
							text: 'Case study for a bilingual SvelteKit portfolio powered by Directus CMS, generated TypeScript caches, and Vercel edge delivery with zero CMS calls per visit.',
						},
						id: 'p1',
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
							text: 'Étude de cas d\'un portfolio SvelteKit bilingue avec édition Directus CMS, contenu TypeScript généré et livraison edge Vercel sans appel CMS par visite.',
						},
						id: 'p1',
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
			label: { en: 'lines of code', fr: 'lignes de code' },
			value: '62K+',
		},
		impactMetrics: [
			{
				label: { en: 'lines of code', fr: 'lignes de code' },
				value: '62K+',
			},
			{
				label: { en: 'content from the CMS', fr: 'contenu venu du CMS' },
				value: '100%',
			},
			{
				label: {
					en: 'tests, every change',
					fr: 'tests, à chaque changement',
				},
				value: '1,776',
			},
			{
				label: {
					en: 'CMS calls per visit',
					fr: 'appels au CMS par visite',
				},
				value: '0',
			},
			{
				label: { en: 'languages, one source', fr: 'langues, une source' },
				value: '2',
			},
		],
		liveUrl: 'https://yesid.dev',
		oneLiner: {
			en: 'A bilingual CMS portfolio that edits in Directus and serves visitors from generated edge-ready content.',
			fr: 'Un portfolio CMS bilingue, édité dans Directus et servi aux visiteurs depuis du contenu généré prêt pour l’edge.',
		},
		relatedServices: ['web-development', 'database-engineering'],
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
									text: 'yesid.dev is built for the same outcome I would sell to a client: edit content in `Directus`, regenerate the `TypeScript` cache, and ship pages that do not call the CMS for every visitor.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The result is a bilingual site that stays easy to update without paying a runtime tax on every page view. Content has one source of truth, the site has fast edge delivery, and future projects can inherit the same brand system instead of starting from zero.',
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
									text: 'yesid.dev est bâti autour du même résultat que je vendrais à un client : éditer le contenu dans `Directus`, régénérer le cache `TypeScript`, puis servir des pages qui n\'appellent pas le CMS à chaque visite.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le résultat : un site bilingue facile à mettre à jour, sans taxe d\'exécution sur chaque page vue. Le contenu garde une seule source de vérité, le site reste rapide à l\'edge, et les prochains projets peuvent hériter du même système de marque au lieu de repartir à zéro.',
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
					en: 'Outcome: CMS control, static delivery',
					fr: 'Résultat : contrôle CMS, livraison statique',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Quality is part of the identity here. This is a proudly Quebec-built product, bilingual by default, with English and French treated as first-class surfaces instead of a translation pass at the end.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The Montreal voice matters, but so do the details: mobile-first layout, accessible controls, `light` and `dark` themes, and `prefers-reduced-motion` behavior. The point is not just that the site looks like me. It has to behave like I care.',
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
									text: 'La qualité fait partie de l\'identité ici. C\'est un produit fièrement québécois, bilingue par défaut, avec le français et l\'anglais traités comme deux surfaces de première classe au lieu d\'une traduction ajoutée à la fin.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La voix montréalaise compte, mais les détails aussi : une mise en page mobile-first, des contrôles accessibles, les thèmes `light` et `dark`, puis le comportement `prefers-reduced-motion`. Le but, ce n\'est pas seulement que le site me ressemble. Il faut qu\'il se comporte comme si je fais attention.',
								},
								id: 'p2',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: { en: 'Identity and quality', fr: 'Identité et qualité' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The content pipeline is intentionally boring: `Directus` stores copy and media on `Neon`, `export-fallbacks.ts` pulls that state into a `generated TypeScript cache`, and `SvelteKit` serves the result through `Vercel`. The important part is the boundary: editors get a real CMS, visitors get edge-ready files.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```mermaid\nflowchart LR\n  directus["Directus CMS"] --> export["export-fallbacks.ts"]\n  export --> cache["generated TypeScript cache"]\n  cache --> svelte["SvelteKit"]\n  svelte --> vercel["Vercel edge"]\n```',
								},
								id: 'architecture-mermaid-en',
								type: 'code',
							},
							{
								data: {
									items: [
										{
											content: '`Directus` is the source of truth for copy, media, project sections, and metrics.',
											items: [],
										},
										{
											content: 'The project row owns hero media, light variants, and the `featured` toggle for the home proof reel.',
											items: [],
										},
										{
											content: 'Generated files under `apps/web/src/lib/content` are a build cache, not hand-authored content.',
											items: [],
										},
										{
											content: 'Published visitors hit `SvelteKit` output and `Vercel` edge delivery with `0` CMS calls per visit.',
											items: [],
										},
										{
											content: 'Dev CMS and prod CMS stay separated so content work can be reviewed before promotion.',
											items: [],
										},
										{
											content: 'The integrity lock catches generated cache drift before a push can hide it.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'technical-guarantees-en',
								type: 'nestedlist',
							},
							{
								data: {},
								id: 'technical-divider-en',
								type: 'delimiter',
							},
							{
								data: {
									text: 'The hero media model is explicit because gallery order is not a contract. Image 1 is the desktop/default card image. Image 2 is optional and only means mobile or secondary when the CMS field is filled. Extra gallery images stay in the case study body.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\ntype ProjectHeroMedia = {\n  image: string;\n  imageLight?: string;\n  imageSecondary?: string;\n  imageSecondaryLight?: string;\n  featured: boolean;\n};\n\n// image 1 drives desktop/default cards.\n// image 2 is optional and drives mobile/secondary split cards.\n```',
								},
								id: 'project-hero-media-contract-en',
								type: 'code',
							},
							{
								data: {
									text: 'Assets and content move through the same repeatable path. Upload media to Directus, update the dev CMS row, then regenerate the fallback cache that the web app imports.',
								},
								id: 'p3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\nexport OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/migrate-assets.ts\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/content-projects-yesid.ts --apply\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects\n```',
								},
								id: 'dev-content-script-en',
								type: 'code',
							},
							{
								data: {
									text: 'The regen command can also run alone when the CMS already has the correct state and only the generated cache needs to be refreshed.',
								},
								id: 'p4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\nexport OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects\n```',
								},
								id: 'regen-script-en',
								type: 'code',
							},
							{
								data: {
									text: 'The generated module is the contract the web app consumes. The app imports typed content, not live CMS responses, so page rendering stays predictable and cheap.',
								},
								id: 'p5',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\ntype GeneratedContentCache = {\n  source: \'Directus CMS\';\n  file: \'apps/web/src/lib/content/projects.ts\';\n  contract: \'Project[]\';\n  runtimeCmsCallsPerVisit: 0;\n};\n\nexport const projects = [...] satisfies Project[];\n```',
								},
								id: 'cache-contract-en',
								type: 'code',
							},
							{
								data: {
									text: 'The quality gate is intentionally boring too. A content change still has to pass type checking, CMS script tests, web unit tests, and the integrity lock before it is ready for the operator push.',
								},
								id: 'p6',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\ncd apps/web && bunx svelte-check --tsconfig ./tsconfig.json\ncd apps/cms && bun test\ncd apps/web && bunx vitest run\n```',
								},
								id: 'quality-gates-en',
								type: 'code',
							},
							{
								data: {
									text: 'The README collapsible is kept last on purpose. Public repos can feed it automatically; private client repos can keep the technical proof inside the CMS without exposing source code.',
								},
								id: 'p7',
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
									text: 'Le pipeline de contenu est volontairement simple : `Directus` garde le texte et les médias sur `Neon`, `export-fallbacks.ts` transforme cet état en `cache TypeScript généré`, puis `SvelteKit` sert le résultat sur `Vercel`. Le point important, c\'est la frontière : les éditeurs ont un vrai CMS, les visiteurs reçoivent des fichiers prêts pour l\'edge.',
								},
								id: 'p1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```mermaid\nflowchart LR\n  directus["CMS Directus"] --> export["export-fallbacks.ts"]\n  export --> cache["cache TypeScript généré"]\n  cache --> svelte["SvelteKit"]\n  svelte --> vercel["edge Vercel"]\n```',
								},
								id: 'architecture-mermaid-fr',
								type: 'code',
							},
							{
								data: {
									items: [
										{
											content: '`Directus` est la source de vérité pour le texte, les médias, les sections de projet et les métriques.',
											items: [],
										},
										{
											content: 'La rangée projet possède les images héro, les variantes light et le toggle `featured` du proof reel.',
											items: [],
										},
										{
											content: 'Les fichiers générés dans `apps/web/src/lib/content` sont un cache de build, pas du contenu écrit à la main.',
											items: [],
										},
										{
											content: 'Les visiteurs publiés passent par la sortie `SvelteKit` et la livraison edge `Vercel`, avec `0` appel CMS par visite.',
											items: [],
										},
										{
											content: 'Le CMS dev et le CMS prod restent séparés pour relire le contenu avant la promotion.',
											items: [],
										},
										{
											content: 'Le verrou d\'intégrité attrape les dérives du cache généré avant qu\'une poussée puisse les cacher.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'technical-guarantees-fr',
								type: 'nestedlist',
							},
							{
								data: {},
								id: 'technical-divider-fr',
								type: 'delimiter',
							},
							{
								data: {
									text: 'Le modèle média héro est explicite parce que l\'ordre de la galerie n\'est pas un contrat. L\'image 1 est l\'image bureau par défaut. L\'image 2 est optionnelle et veut dire mobile ou secondaire seulement quand le champ CMS est rempli. Les autres images restent dans la galerie du cas d\'étude.',
								},
								id: 'p2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\ntype ProjectHeroMedia = {\n  image: string;\n  imageLight?: string;\n  imageSecondary?: string;\n  imageSecondaryLight?: string;\n  featured: boolean;\n};\n\n// image 1 drives desktop/default cards.\n// image 2 is optional and drives mobile/secondary split cards.\n```',
								},
								id: 'project-hero-media-contract-fr',
								type: 'code',
							},
							{
								data: {
									text: 'Les assets et le contenu passent par le même chemin répétable. On envoie les médias dans Directus, on met à jour la rangée du CMS dev, puis on régénère le cache fallback importé par le site web.',
								},
								id: 'p3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\nexport OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/migrate-assets.ts\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/content-projects-yesid.ts --apply\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects\n```',
								},
								id: 'dev-content-script-fr',
								type: 'code',
							},
							{
								data: {
									text: 'La commande de régénération peut aussi rouler seule quand le CMS contient déjà le bon état et que seul le cache généré doit être rafraîchi.',
								},
								id: 'p4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\nexport OP_SERVICE_ACCOUNT_TOKEN="$(grep ^OP_TOKEN= .env | cut -d= -f2-)"\nop run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev bun apps/cms/scripts/export-fallbacks.ts --module=projects\n```',
								},
								id: 'regen-script-fr',
								type: 'code',
							},
							{
								data: {
									text: 'Le module généré est le contrat consommé par l\'app web. L\'app importe du contenu typé, pas des réponses CMS en direct, donc le rendu reste prévisible et économique.',
								},
								id: 'p5',
								type: 'paragraph',
							},
							{
								data: {
									code: '```ts\ntype GeneratedContentCache = {\n  source: \'Directus CMS\';\n  file: \'apps/web/src/lib/content/projects.ts\';\n  contract: \'Project[]\';\n  runtimeCmsCallsPerVisit: 0;\n};\n\nexport const projects = [...] satisfies Project[];\n```',
								},
								id: 'cache-contract-fr',
								type: 'code',
							},
							{
								data: {
									text: 'La gate de qualité reste volontairement simple. Même un changement de contenu doit passer le type checking, les tests des scripts CMS, les tests web et le verrou d\'intégrité avant la poussée opérateur.',
								},
								id: 'p6',
								type: 'paragraph',
							},
							{
								data: {
									code: '```sh\ncd apps/web && bunx svelte-check --tsconfig ./tsconfig.json\ncd apps/cms && bun test\ncd apps/web && bunx vitest run\n```',
								},
								id: 'quality-gates-fr',
								type: 'code',
							},
							{
								data: {
									text: 'Le collapsible README reste dernier exprès. Les repos publics peuvent le remplir automatiquement; les repos privés de clients peuvent garder la preuve technique dans le CMS sans exposer le code source.',
								},
								id: 'p7',
								type: 'paragraph',
							},
						],
						time: 1750000000000,
						version: '2.31.2',
					},
				},
				title: { en: 'Technical proof', fr: 'Preuve technique' },
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
		readmeUrl: 'https://raw.githubusercontent.com/mgkdante/transit/main/README.md',
		relatedServices: [
			'data-pipeline',
			'database-engineering',
			'analytics-reporting',
			'web-development',
		],
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
		status: 'public',
		tags: ['e-commerce', 'migration', 'bilingual'],
		title: { en: 'Café Arona', es: 'Café Arona', fr: 'Café Arona' },
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'projects'.
export * from './projects.companion';
