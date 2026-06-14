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
							text: 'A personal brand and portfolio site for a freelance digital infrastructure engineer. Built with SvelteKit 2, Svelte 5, Tailwind CSS v4, and deployed to Vercel. Designed to be multilingual (en/fr/es) from day one.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409366,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Un site de marque personnelle et de portfolio pour un ingénieur d\'infrastructure numérique pigiste. Bâti avec SvelteKit 2, Svelte 5, Tailwind CSS v4, et déployé sur Vercel. Conçu pour être multilingue (en/fr/es) dès le premier jour.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409366,
				version: '2.31.2',
			},
		},
		featured: true,
		image: '8b57ccd1-bed1-46ae-bb24-a887714a8bcc',
		liveUrl: 'https://yesid.dev',
		oneLiner: {
			en: 'The site you are looking at: a SvelteKit portfolio built slice by slice.',
			fr: 'Le site que tu regardes en ce moment : un portfolio SvelteKit bâti morceau par morceau.',
		},
		relatedServices: ['web-development'],
		repoUrl: 'https://github.com/mgkdante/yesid.dev',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'SvelteKit compiles away the framework at build time, producing lean HTML and minimal JavaScript. For a portfolio site where first impression and load speed matter, that trade-off is worth making.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409366,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'SvelteKit fait disparaître le cadriciel au moment de la compilation, ce qui produit du HTML léger et un minimum de JavaScript. Pour un site portfolio où la première impression et la vitesse de chargement comptent, ce compromis vaut la peine.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409366,
						version: '2.31.2',
					},
				},
				title: { en: 'Why SvelteKit?', fr: 'Pourquoi SvelteKit?' },
			},
		],
		slug: 'yesid-dev',
		stack: [
			'SvelteKit',
			'Svelte 5',
			'TypeScript',
			'Tailwind CSS',
			'Vercel',
		],
		status: 'public',
		tags: ['portfolio', 'web', 'svelte'],
		title: {
			en: 'yesid.dev · Portfolio Site',
			fr: 'yesid.dev · Site portfolio',
		},
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
		featured: false,
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
		relatedServices: ['data-pipeline', 'database-engineering'],
		repoUrl: 'https://github.com/mgkdante/transit',
		sections: [],
		slug: 'transit-data-pipeline',
		stack: [
			'PostgreSQL',
			'Python',
			'dbt',
			'Power BI',
			'Apache Airflow',
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
							text: 'A Power BI dashboard suite built for a logistics company. Pulls data from SQL Server, applies business logic in DAX, and delivers daily refreshes to executive stakeholders. Reduced reporting time from 2 days to 15 minutes.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409843,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Une suite de tableaux de bord Power BI bâtie pour une entreprise de logistique. Tire les données de SQL Server, applique la logique d\'affaires en DAX, et livre des rafraîchissements quotidiens aux décideurs. A fait passer le temps de production des rapports de 2 jours à 15 minutes.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242409843,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			before: '2 days',
			label: {
				en: 'Reporting across 12 depts',
				fr: 'Rapports répartis sur 12 services',
			},
			value: '15 min',
		},
		impactMetrics: [
			{
				before: '2 days',
				label: {
					en: 'Reporting across 12 depts',
					fr: 'Rapports répartis sur 12 services',
				},
				value: '15 min',
			},
			{
				label: {
					en: 'Query time reduction',
					fr: 'Réduction du temps de requête',
				},
				value: '73%',
			},
		],
		oneLiner: {
			en: 'Executive KPI dashboard tracking operational metrics across 12 departments.',
			fr: 'Tableau de bord des KPI pour la direction, qui suit les indicateurs opérationnels à travers 12 départements.',
		},
		readmeUrl: 'https://github.com/zen-browser/desktop/blob/dev/README.md',
		relatedServices: ['analytics-reporting'],
		repoUrl: 'https://github.com/zen-browser',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Operations managers were spending two days each month compiling reports from multiple spreadsheets. Data was stale by the time decisions were made.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les gestionnaires des opérations passaient deux jours chaque mois à monter des rapports à partir de plusieurs feuilles de calcul. Les données étaient déjà périmées au moment de prendre les décisions.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
				},
				title: { en: 'The Problem', fr: 'Le problème' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Connected directly to SQL Server with scheduled refreshes. Built a semantic layer in DAX so business users could slice data without writing queries.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Connecté directement à SQL Server avec des rafraîchissements planifiés. Construction d\'une couche sémantique en DAX pour que les utilisateurs d\'affaires puissent découper les données sans écrire de requêtes.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242409844,
						version: '2.31.2',
					},
				},
				title: { en: 'The Approach', fr: 'L\'approche' },
			},
		],
		slug: 'lorem-analytics-dashboard',
		stack: ['Power BI', 'SQL Server', 'Python', 'DAX'],
		status: 'private',
		tags: ['analytics', 'reporting', 'sql-server'],
		title: {
			en: 'Lorem Analytics Dashboard',
			fr: 'Tableau de bord analytique Lorem',
		},
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'Migrated a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads. Included schema redesign, data type mapping, and stored procedure conversion.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410164,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Migration d\'une base de données MySQL de 500 Go vers PostgreSQL sans aucune interruption, grâce à l\'écriture double et aux lectures fantômes. Comprenait une refonte du schéma, le mappage des types de données, et la conversion des procédures stockées.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410164,
				version: '2.31.2',
			},
		},
		featured: false,
		impactMetric: {
			label: {
				en: 'Zero-downtime migration',
				fr: 'Migration sans temps d\'arrêt',
			},
			value: '500 GB',
		},
		impactMetrics: [
			{
				label: {
					en: 'Zero-downtime migration',
					fr: 'Migration sans temps d\'arrêt',
				},
				value: '500 GB',
			},
		],
		oneLiner: {
			en: 'Zero-downtime migration from legacy MySQL to PostgreSQL for a SaaS platform.',
			fr: 'Migration sans interruption d\'un MySQL hérité vers PostgreSQL pour une plateforme SaaS.',
		},
		readmeUrl: 'https://github.com/oven-sh/bun/blob/main/README.md',
		relatedServices: ['database-engineering'],
		repoUrl: 'https://github.com/oven-sh/bun',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The legacy MySQL instance was hitting performance limits. PostgreSQL offered better JSON support, CTEs, and window functions needed for the analytics layer.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'L\'instance MySQL existante atteignait ses limites de performance. PostgreSQL offrait un meilleur support du JSON, les CTE et les fonctions de fenêtrage dont la couche analytique avait besoin.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
				},
				title: { en: 'Why Migrate?', fr: 'Pourquoi migrer?' },
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Used a dual-write pattern: new writes go to both databases, reads gradually shift to PostgreSQL. Shadow reads validated correctness before the cutover.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'On a utilisé un patron d\'écriture double : les nouvelles écritures vont dans les deux bases de données, et les lectures basculent peu à peu vers PostgreSQL. Des lectures fantômes ont validé la justesse des données avant la bascule.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410164,
						version: '2.31.2',
					},
				},
				title: { en: 'Migration Strategy', fr: 'Stratégie de migration' },
			},
		],
		slug: 'lorem-database-migration',
		stack: ['PostgreSQL', 'Python', 'Alembic', 'MySQL'],
		status: 'private',
		tags: ['postgresql', 'migration', 'schema'],
		title: {
			en: 'Lorem Database Migration',
			fr: 'Migration de base de données Lorem',
		},
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
		relatedServices: ['web-development'],
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
		stack: ['Shopify', 'Liquid', 'Figma', 'Bun', 'TypeScript'],
		status: 'public',
		tags: ['e-commerce', 'migration', 'bilingual'],
		title: { en: 'Café Arona', es: 'Café Arona', fr: 'Café Arona' },
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Python-based tool that connects to SQL Server, analyzes execution plans, identifies missing indexes, and generates optimization recommendations. Reduced average query time by 73% across 200+ stored procedures.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410452,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Un outil en Python qui se connecte à SQL Server, analyse les plans d\'exécution, repère les index manquants, et génère des recommandations d\'optimisation. A réduit le temps moyen des requêtes de 73 % à travers plus de 200 procédures stockées.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410452,
				version: '2.31.2',
			},
		},
		featured: false,
		oneLiner: {
			en: 'Automated SQL Server query analysis tool that identifies slow queries and suggests index improvements.',
			fr: 'Outil automatisé d\'analyse de requêtes SQL Server qui repère les requêtes lentes et suggère des améliorations d\'index.',
		},
		relatedServices: ['database-engineering'],
		repoUrl: 'https://github.com/mgkdante/lorem-query-optimizer',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Connects to the target SQL Server instance, captures execution plans for the heaviest queries, and analyzes them for common anti-patterns: table scans, implicit conversions, and parameter sniffing issues.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410452,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Se connecte à l\'instance SQL Server cible, capte les plans d\'exécution des requêtes les plus lourdes et les analyse pour repérer les anti-patrons courants : balayages de table, conversions implicites et problèmes de reniflage de paramètres.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410452,
						version: '2.31.2',
					},
				},
				title: { en: 'How It Works', fr: 'Comment ça marche' },
			},
		],
		slug: 'lorem-query-optimizer',
		stack: ['SQL Server', 'Python', 'SSMS', 'T-SQL'],
		status: 'private',
		tags: ['sql', 'performance', 'sql-server'],
		title: {
			en: 'Lorem Query Optimizer',
			fr: 'Optimiseur de requêtes Lorem',
		},
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Retool-based admin panel that replaced 6 spreadsheets with a unified interface. CRUD operations on PostgreSQL, role-based access control, and automated approval routing.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410643,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Un panneau d\'administration en Retool qui a remplacé 6 feuilles de calcul par une interface unifiée. Opérations CRUD sur PostgreSQL, contrôle d\'accès par rôle, et acheminement automatisé des approbations.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 1777242410643,
				version: '2.31.2',
			},
		},
		featured: false,
		oneLiner: {
			en: 'Internal operations dashboard for managing inventory and approval workflows.',
			fr: 'Tableau de bord des opérations internes pour gérer l\'inventaire et les flux d\'approbation.',
		},
		relatedServices: ['data-pipeline', 'analytics-reporting'],
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Operations ran on 6 Google Sheets with manual copy-paste between them. The Retool panel centralized everything into one interface with real-time PostgreSQL queries.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410643,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les opérations roulaient sur 6 Google Sheets avec du copier-coller manuel entre eux. Le panneau Retool a tout centralisé dans une seule interface, avec des requêtes PostgreSQL en temps réel.',
								},
								id: 'p1',
								type: 'paragraph',
							},
						],
						time: 1777242410643,
						version: '2.31.2',
					},
				},
				title: { en: 'Before & After', fr: 'Avant et après' },
			},
		],
		slug: 'lorem-retool-admin',
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		status: 'private',
		tags: ['retool', 'admin', 'postgresql'],
		title: {
			en: 'Lorem Retool Admin Panel',
			fr: 'Panneau d\'administration Retool Lorem',
		},
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'projects'.
export * from './projects.companion';
