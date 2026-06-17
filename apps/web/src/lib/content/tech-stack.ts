// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// /tech-stack page chrome + tech-stack items array, both CMS-derived.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { TechStackPageContent, TechStackItem } from '$lib/types';

export const techStackPageContent: TechStackPageContent = {
	actions: {
		getInTouch: { en: 'Get In Touch', fr: 'Écris-moi' },
		viewServices: { en: 'View Services', fr: 'Voir les services' },
	},
	cta: {
		headingLine1: { en: 'Found your stack', fr: 'T\'as trouvé ton stack' },
		headingLine2: { en: 'Let\'s build it', fr: 'On le bâtit ensemble' },
		sub: {
			en: 'A pipeline, a dashboard, a database, a store, the infrastructure is ready.',
			fr: 'Un pipeline, un tableau de bord, une base de données, une boutique, l\'infrastructure est prête.',
		},
	},
	hero: {
		overline: {
			en: 'Infrastructure Map',
			fr: 'Carte de l\'infrastructure',
		},
		stackExplainer: {
			en: 'A "stack" is just the parts list of a piece of software: the interface people touch, the logic that decides things, the data it remembers, and the infrastructure it runs on. That\'s the whole secret. Once you can read a stack, a quote can\'t hide much from you, poke the blueprints below and see for yourself.',
			fr: 'Un « stack », c\'est juste la liste des morceaux d\'un logiciel : l\'interface que le monde touche, la logique qui décide des choses, les données qu\'il garde en mémoire et l\'infrastructure sur laquelle il roule. C\'est tout le secret. Une fois que tu sais lire un stack, une soumission ne peut plus te cacher grand-chose, fouille dans les plans plus bas et vois par toi-même.',
		},
		stats: {
			technologies: { en: 'technologies', fr: 'technologies' },
		},
		terminal: {
			cataloged: {
				en: '→ {count} technologies cataloged',
				fr: '→ {count} technologies cataloguées',
			},
			cmd: {
				en: '~ yesid --stack --verbose',
				fr: '~ yesid --stack --verbose',
			},
			loading: {
				en: '→ loading {count} nodes...',
				fr: '→ chargement de {count} nœuds...',
			},
			status: {
				en: 'interactive map online.',
				fr: 'carte interactive en ligne.',
			},
			success: { en: '✓ successful', fr: '✓ réussi' },
		},
		terminalAria: {
			en: 'Infrastructure overview',
			fr: 'Survol de l\'infrastructure',
		},
		titleLine1: { en: 'The Control', fr: 'La salle de' },
		titleLine2: { en: 'Room', fr: 'contrôle' },
	},
	meta: {
		description: {
			en: '{itemCount}+ technologies, an interactive map of how digital infrastructure gets built.',
			fr: 'Plus de {itemCount} technologies, une carte interactive de la manière dont une infrastructure numérique se bâtit.',
		},
		title: {
			en: 'Tech Stack · yesid.',
			fr: 'Stack technologique · yesid.',
		},
	},
};

export const techStackItems: readonly TechStackItem[] = [
	{
		enables: {
			en: 'schedules and babysits your data pipelines, end to end',
			fr: 'planifie et surveille tes pipelines de données, du début à la fin',
		},
		icon: {
			iconify_id: 'logos:airflow',
			id: 'airflow',
			name: 'Apache Airflow',
			svg_override: null,
		},
		id: 'airflow',
		layer: 'logic',
		name: 'Apache Airflow',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Transit Operations Data Pipeline runs on Airflow, orchestrating the daily cycle of GTFS-RT feed ingestion, Python transformations, PostgreSQL loads, and Power BI dataset refreshes. Each task has retry logic, SLA alerts, and dependency chains that ensure data quality gates pass before downstream consumers see new data. Airflow\'s web UI gives the operations team visibility into pipeline health without needing to SSH into servers or read log files.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Le pipeline de données des opérations de transport roule sur Airflow, qui orchestre le cycle quotidien : ingestion des flux GTFS-RT, transformations Python, chargements dans PostgreSQL et rafraîchissements des jeux de données Power BI. Chaque tâche a sa logique de réessai, ses alertes de SLA et ses chaînes de dépendances qui s\'assurent que les contrôles de qualité des données passent avant que les consommateurs en aval voient de nouvelles données. L\'interface web d\'Airflow donne à l\'équipe des opérations une vue sur la santé du pipeline sans avoir à se connecter en SSH aux serveurs ni à lire les fichiers journaux.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Apache Airflow is a workflow orchestration platform that lets you define, schedule, and monitor data pipelines as Python code. Instead of cron jobs or manual scripts, you write DAGs (Directed Acyclic Graphs) that declare tasks and their dependencies, "extract data, then transform it, then load it, and if any step fails, retry three times and alert me." Airflow provides a web UI for monitoring, a scheduler for timing, and integrations with virtually every data tool.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977601,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Apache Airflow est une plateforme d\'orchestration de flux de travail qui te permet de définir, planifier et surveiller tes pipelines de données sous forme de code Python. Au lieu de tâches cron ou de scripts manuels, tu écris des DAG (graphes orientés acycliques) qui déclarent les tâches et leurs dépendances : "extraire les données, ensuite les transformer, ensuite les charger, et si une étape échoue, réessaie trois fois et avertis-moi." Airflow fournit une interface web pour la surveillance, un planificateur pour le minutage, et des intégrations avec pratiquement tous les outils de données.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977601,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Airflow turns "a bunch of scripts that run in order" into a proper orchestration system with retries, logging, alerting, and dependency management. I use it when pipelines have multiple steps that need to run in a specific order, when failures need automatic retry logic, and when stakeholders need visibility into pipeline health. I write DAGs as Python code (not YAML configuration), which means the full power of Python is available for dynamic task generation and conditional logic.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Airflow transforme "un paquet de scripts qui roulent l\'un après l\'autre" en un vrai système d\'orchestration, avec réessais, journalisation, alertes et gestion des dépendances. Je l\'utilise quand les pipelines ont plusieurs étapes qui doivent rouler dans un ordre précis, quand les échecs ont besoin d\'une logique de réessai automatique, et quand les parties prenantes ont besoin de voir la santé du pipeline. J\'écris mes DAG en code Python (pas en configuration YAML), ce qui veut dire que toute la puissance de Python est disponible pour la génération dynamique de tâches et la logique conditionnelle.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'versions every database schema change, with rollbacks',
			fr: 'versionne chaque changement de schéma de base de données, avec annulations',
		},
		icon: {
			iconify_id: null,
			id: 'alembic',
			name: 'Alembic',
			svg_override: null,
		},
		id: 'alembic',
		layer: 'data',
		name: 'Alembic',
		relatedProjects: [],
		relatedServices: ['database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, Alembic manages the PostgreSQL schema as the data model evolves, adding new feed types, modifying KPI calculation tables, and adjusting indexes based on query performance analysis. For the Lorem Database Migration, Alembic tracked every schema change during the MySQL-to-PostgreSQL transition, giving the team a clear audit trail and the ability to roll back any step of the migration independently.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur le pipeline de données des opérations de transport, Alembic gère le schéma PostgreSQL à mesure que le modèle de données évolue : ajout de nouveaux types de flux, modification des tables de calcul des KPI, ajustement des index selon l\'analyse de performance des requêtes. Pour la migration de la base de données Lorem, Alembic a suivi chaque changement de schéma pendant la transition de MySQL vers PostgreSQL, donnant à l\'équipe une piste de vérification claire et la possibilité d\'annuler n\'importe quelle étape de la migration de façon indépendante.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Alembic is a database migration tool for Python, built on top of SQLAlchemy. It version-controls your database schema the same way Git version-controls your code, each change (add a column, create a table, modify a constraint) is a numbered migration file that can be applied forward or rolled back. This means your database structure is reproducible, auditable, and deployable across environments.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Alembic est un outil de migration de base de données pour Python, bâti par-dessus SQLAlchemy. Il gère les versions du schéma de ta base de données de la même façon que Git gère les versions de ton code : chaque changement (ajouter une colonne, créer une table, modifier une contrainte) est un fichier de migration numéroté qu\'on peut appliquer vers l\'avant ou annuler. Ça veut dire que la structure de ta base de données est reproductible, vérifiable et déployable d\'un environnement à l\'autre.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Database changes without migration tooling are a recipe for "it works on my machine" disasters. Alembic gives me version-controlled, reversible schema changes that I can test in staging before touching production. I write every migration with a corresponding downgrade path, and I test both directions against realistic data volumes. The autogenerate feature speeds up development, but I always review the generated SQL, auto-migration tools miss nuances like data backfills and index strategies.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Les changements de base de données sans outil de migration, c\'est la recette parfaite pour les catastrophes du genre "ça marche sur ma machine". Alembic me donne des changements de schéma versionnés et réversibles que je peux tester en préproduction avant de toucher à la production. J\'écris chaque migration avec son chemin d\'annulation correspondant, et je teste les deux directions sur des volumes de données réalistes. La fonction de génération automatique accélère le développement, mais je révise toujours le SQL généré : les outils de migration automatique manquent des nuances comme les remplissages de données et les stratégies d\'index.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:bun',
			id: 'bun',
			name: 'Bun',
			svg_override: null,
		},
		id: 'bun',
		layer: 'infra',
		name: 'Bun',
		relatedProjects: ['yesid-dev', 'cafe-arona'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev runs entirely on Bun, <code>bun install</code> for dependencies, <code>bun run dev</code> for the dev server, <code>bun run test</code> for Vitest, <code>bun run check</code> for TypeScript and Svelte checks. The lockfile is <code>bun.lockb</code> (binary format, faster than JSON), and the entire development workflow uses Bun commands exclusively. The speed difference is most noticeable in CI: Bun\'s fast install and test execution keep the feedback loop tight on every push.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'yesid.dev roule entièrement sur Bun : <code>bun install</code> pour les dépendances, <code>bun run dev</code> pour le serveur de développement, <code>bun run test</code> pour Vitest, <code>bun run check</code> pour les vérifications TypeScript et Svelte. Le fichier de verrouillage est <code>bun.lockb</code> (format binaire, plus rapide que le JSON), et tout le flux de développement utilise exclusivement les commandes Bun. La différence de vitesse est la plus marquée en CI : l\'installation et l\'exécution de tests rapides de Bun gardent la boucle de rétroaction serrée à chaque poussée.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Bun is an all-in-one JavaScript runtime, bundler, and package manager built from scratch in Zig. It\'s designed as a drop-in replacement for Node.js, running the same JavaScript and TypeScript code, but significantly faster. Bun handles package installation (replacing npm/yarn), runs TypeScript natively without a separate compile step, includes a built-in test runner, and starts up faster than Node.js. It\'s npm-compatible, so existing packages work without changes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Bun est un environnement d\'exécution JavaScript tout-en-un, à la fois bundler et gestionnaire de paquets, bâti à partir de zéro en Zig. Il est conçu comme un remplacement direct de Node.js : il exécute le même code JavaScript et TypeScript, mais nettement plus vite. Bun s\'occupe de l\'installation des paquets (en remplacement de npm/yarn), exécute TypeScript nativement sans étape de compilation séparée, inclut un lanceur de tests intégré et démarre plus vite que Node.js. Il est compatible avec npm, donc les paquets existants fonctionnent sans changement.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Bun is my runtime for all new JavaScript/TypeScript projects. Package installation that takes 30 seconds with npm takes 2 seconds with Bun. The test runner is built in and fast. TypeScript runs without a compile step. Every day I save minutes on dependency installation, test runs, and dev server startups, and those minutes add up across hundreds of development iterations. Bun is also a learning opportunity: I chose it deliberately to stay current with the JavaScript runtime ecosystem.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977606,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Bun est mon environnement d\'exécution pour tous mes nouveaux projets JavaScript/TypeScript. Une installation de paquets qui prend 30 secondes avec npm prend 2 secondes avec Bun. Le lanceur de tests est intégré et rapide. TypeScript roule sans étape de compilation. Chaque jour, je sauve des minutes sur l\'installation des dépendances, les exécutions de tests et les démarrages du serveur de développement, et ces minutes-là s\'additionnent à travers des centaines d\'itérations de développement. Bun est aussi une occasion d\'apprentissage : je l\'ai choisi délibérément pour rester à jour avec l\'écosystème des environnements d\'exécution JavaScript.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977606,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'turns Power BI models into sharp, reusable measures',
			fr: 'transforme tes modèles Power BI en mesures nettes et réutilisables',
		},
		icon: {
			iconify_id: null,
			id: 'dax',
			name: 'DAX',
			svg_override: null,
		},
		id: 'dax',
		layer: 'data',
		name: 'DAX',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Lorem Analytics Dashboard, DAX powers every KPI calculation, from department-level revenue metrics to cross-department comparisons with dynamic date ranges. The semantic layer I built uses DAX measures exclusively (no calculated columns where measures suffice) to keep the model lean and the refreshes fast. Understanding DAX at a deep level means I can diagnose "the numbers don\'t match" issues that typically take teams days to resolve.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur le tableau de bord analytique Lorem, DAX alimente chaque calcul de KPI, des mesures de revenus au niveau des services aux comparaisons inter-services avec des plages de dates dynamiques. La couche sémantique que j\'ai bâtie utilise exclusivement des mesures DAX (pas de colonnes calculées quand des mesures suffisent) pour garder le modèle léger et les rafraîchissements rapides. Comprendre DAX en profondeur veut dire que je peux diagnostiquer les problèmes de "les chiffres ne concordent pas" qui prennent habituellement des jours à régler aux équipes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'DAX (Data Analysis Expressions) is a formula language used in Power BI, Analysis Services, and Power Pivot. Think of it as a specialized language for writing business calculations, revenue growth, running totals, year-over-year comparisons, weighted averages, that work across filtered and sliced data. DAX operates on a columnar data model and uses concepts like filter context and row context to evaluate expressions dynamically as users interact with dashboards.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'DAX (Data Analysis Expressions) est un langage de formules utilisé dans Power BI, Analysis Services et Power Pivot. Vois-le comme un langage spécialisé pour écrire des calculs d\'affaires : croissance des revenus, totaux cumulatifs, comparaisons d\'une année à l\'autre, moyennes pondérées, qui fonctionnent sur des données filtrées et découpées. DAX opère sur un modèle de données en colonnes et utilise des concepts comme le contexte de filtre et le contexte de ligne pour évaluer les expressions dynamiquement à mesure que les utilisateurs interagissent avec les tableaux de bord.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'DAX is where business logic meets data modeling, and getting it right is the difference between dashboards that perform and dashboards that lie. I write DAX measures that handle complex time intelligence (YTD, prior year comparison, rolling averages), dynamic segmentation, and what-if analysis. I understand the evaluation context deeply, filter context propagation, CALCULATE overrides, and the iterator vs. aggregator distinction that trips up most Power BI developers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'DAX, c\'est là où la logique d\'affaires rencontre la modélisation de données, et bien le faire, c\'est la différence entre des tableaux de bord qui performent et des tableaux de bord qui mentent. J\'écris des mesures DAX qui gèrent l\'intelligence temporelle complexe (cumul annuel, comparaison avec l\'année précédente, moyennes mobiles), la segmentation dynamique et l\'analyse de scénarios. Je comprends le contexte d\'évaluation en profondeur : la propagation du contexte de filtre, les substitutions de CALCULATE, et la distinction entre itérateur et agrégateur qui fait trébucher la plupart des développeurs Power BI.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'packages every service to run the same anywhere',
			fr: 'empaquette chaque service pour qu\'il roule pareil partout',
		},
		icon: {
			iconify_id: 'logos:docker',
			id: 'docker',
			name: 'Docker',
			svg_override: null,
		},
		id: 'docker',
		layer: 'infra',
		name: 'Docker',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Transit Operations Data Pipeline is fully containerized with Docker, Python services, PostgreSQL, and Airflow all run as Docker containers orchestrated with Docker Compose. This means the entire pipeline can be reproduced in any environment: development laptops, CI runners, and production servers. Docker Compose defines the service dependencies, health checks, and volume mounts, so starting the full pipeline is one command.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Le pipeline de données des opérations de transport est entièrement conteneurisé avec Docker : les services Python, PostgreSQL et Airflow roulent tous comme des conteneurs Docker orchestrés avec Docker Compose. Ça veut dire que tout le pipeline peut être reproduit dans n\'importe quel environnement : les portables de développement, les exécuteurs de CI et les serveurs de production. Docker Compose définit les dépendances des services, les vérifications de santé et les montages de volumes, alors démarrer le pipeline au complet, c\'est une seule commande.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Docker packages applications and their dependencies into containers, lightweight, portable environments that run consistently everywhere. Instead of "it works on my machine" problems, a Docker container bundles your code, runtime, libraries, and configuration into a single image. That image runs identically on your laptop, in CI/CD, and in production. Docker Compose lets you define multi-container setups (app + database + cache) in one file.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Docker empaquette les applications et leurs dépendances dans des conteneurs : des environnements légers et portables qui roulent de façon cohérente partout. Au lieu des problèmes du genre "ça marche sur ma machine", un conteneur Docker regroupe ton code, ton environnement d\'exécution, tes bibliothèques et ta configuration dans une seule image. Cette image roule de façon identique sur ton portable, en CI/CD et en production. Docker Compose te permet de définir des montages multiconteneurs (application + base de données + cache) dans un seul fichier.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Docker eliminates environment drift, the silent killer of data pipelines and deployments. When I hand off a pipeline to a client\'s ops team, they run <code>docker compose up</code> and get the exact same environment I developed in. No missing Python packages, no wrong PostgreSQL version, no library conflicts. I use Docker for data pipeline development, integration testing (spinning up real databases for tests), and packaging applications for deployment.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977610,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Docker élimine la dérive d\'environnement, le tueur silencieux des pipelines de données et des déploiements. Quand je remets un pipeline à l\'équipe des opérations d\'un client, ils lancent <code>docker compose up</code> et obtiennent exactement le même environnement dans lequel j\'ai développé. Aucun paquet Python manquant, aucune mauvaise version de PostgreSQL, aucun conflit de bibliothèques. J\'utilise Docker pour le développement de pipelines de données, les tests d\'intégration (en démarrant de vraies bases de données pour les tests) et l\'empaquetage des applications pour le déploiement.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977610,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'runs the checks and ships every change automatically',
			fr: 'roule les vérifications et déploie chaque changement automatiquement',
		},
		icon: {
			iconify_id: 'logos:github-actions',
			id: 'github-actions',
			name: 'GitHub Actions',
			svg_override: null,
		},
		id: 'github-actions',
		layer: 'infra',
		name: 'GitHub Actions',
		relatedProjects: ['transit-data-pipeline', 'yesid-dev'],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, GitHub Actions runs the test suite (<code>bun run test</code>), type checks (<code>bun run check</code>), and triggers Vercel deployments on every push. Pull request workflows run the full test matrix and block merging if tests fail. The pipeline also handles scheduled tasks and can be extended with Playwright E2E tests as the project grows. Having CI run on every commit means I catch broken builds immediately, not after deploying to production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, GitHub Actions roule la suite de tests (<code>bun run test</code>), les vérifications de types (<code>bun run check</code>) et déclenche les déploiements Vercel à chaque push. Les workflows de pull request roulent toute la matrice de tests et bloquent la fusion si les tests échouent. Le pipeline gère aussi les tâches planifiées et peut être étendu avec des tests E2E Playwright à mesure que le projet grandit. Avoir la CI qui roule à chaque commit, ça veut dire que j\'attrape les builds brisés tout de suite, pas après le déploiement en production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions is a CI/CD platform built into GitHub. You define workflows in YAML files that run automatically on events, push, pull request, schedule, or manual trigger. Each workflow runs on a virtual machine (Ubuntu, Windows, or macOS) and can execute shell commands, run tests, build code, deploy applications, or interact with any API. The marketplace offers thousands of pre-built actions for common tasks.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977611,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions est une plateforme CI/CD intégrée directement dans GitHub. Tu définis des workflows dans des fichiers YAML qui s\'exécutent automatiquement sur des événements : push, pull request, planification ou déclenchement manuel. Chaque workflow roule sur une machine virtuelle (Ubuntu, Windows ou macOS) et peut exécuter des commandes shell, lancer des tests, compiler du code, déployer des applications ou interagir avec n\'importe quelle API. Le marketplace offre des milliers d\'actions toutes prêtes pour les tâches courantes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977611,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions integrates directly with where my code lives, no separate CI service to configure, no webhooks to maintain, no additional accounts to manage. I define my test and deploy pipeline in <code>.github/workflows/</code>, and it runs on every push. The tight integration means PR checks show test results inline, deployment status appears on the commit, and I can trigger workflows from GitHub\'s UI when needed. For solo and small-team projects, it\'s the simplest path to professional CI/CD.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions s\'intègre directement là où mon code vit : pas de service CI séparé à configurer, pas de webhooks à maintenir, pas de comptes additionnels à gérer. Je définis mon pipeline de test et de déploiement dans <code>.github/workflows/</code>, et ça roule à chaque push. L\'intégration serrée fait que les vérifications de PR affichent les résultats de tests directement dans la page, l\'état du déploiement apparaît sur le commit, et je peux déclencher des workflows depuis l\'interface de GitHub au besoin. Pour les projets solos et en petite équipe, c\'est le chemin le plus simple vers une CI/CD professionnelle.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'simple-icons:gsap',
			id: 'gsap',
			name: 'GSAP',
			svg_override: null,
		},
		id: 'gsap',
		layer: 'interface',
		name: 'GSAP',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, GSAP powers every motion element. The tech stack diagram uses DrawSVGPlugin to animate connection lines being drawn between nodes, MotionPathPlugin for data packet dots traveling along those lines, and ScrollTrigger for the entrance sequence where layers boot up bottom-to-top. The services page uses GSAP timelines for station reveal animations, and the home page hero sequence choreographs text, shapes, and SVG elements through a scroll-linked timeline.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, GSAP fait rouler chaque élément en mouvement. Le diagramme de la pile technique utilise DrawSVGPlugin pour animer le tracé des lignes de connexion entre les nœuds, MotionPathPlugin pour les points de paquets de données qui voyagent le long de ces lignes, et ScrollTrigger pour la séquence d\'entrée où les couches démarrent du bas vers le haut. La page des services utilise des timelines GSAP pour les animations de révélation des stations, et la séquence du hero de la page d\'accueil chorégraphie le texte, les formes et les éléments SVG dans une timeline liée au défilement.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'GSAP (GreenSock Animation Platform) is a professional-grade JavaScript animation library. It animates any numeric property, CSS transforms, SVG attributes, canvas elements, even custom object values, with frame-accurate timing and buttery-smooth 60fps performance. Its plugin ecosystem includes ScrollTrigger for scroll-linked animations, DrawSVGPlugin for animating SVG path drawing, and MotionPathPlugin for moving elements along curves. GSAP is now fully free and open-source with all plugins included.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'GSAP (GreenSock Animation Platform) est une bibliothèque d\'animation JavaScript de calibre professionnel. Elle anime n\'importe quelle propriété numérique : transformations CSS, attributs SVG, éléments canvas, même des valeurs d\'objets personnalisés, avec un timing précis à l\'image près et une performance fluide à 60 ips. Son écosystème de plugins inclut ScrollTrigger pour les animations liées au défilement, DrawSVGPlugin pour animer le tracé des chemins SVG, et MotionPathPlugin pour faire bouger des éléments le long de courbes. GSAP est maintenant entièrement gratuit et open-source, avec tous les plugins inclus.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'CSS animations are fine for hover states and simple transitions, but they fall apart when you need choreographed sequences, scroll-linked timelines, or SVG path animations. GSAP gives me frame-level control with a clean API. I can build a staggered entrance animation, link it to scroll position, reverse it on exit, and respect <code>prefers-reduced-motion</code>, all in a few lines of code. The timeline API makes complex multi-element choreography composable and debuggable.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Les animations CSS font la job pour les états de survol et les transitions simples, mais elles s\'écroulent quand t\'as besoin de séquences chorégraphiées, de timelines liées au défilement ou d\'animations de chemins SVG. GSAP me donne un contrôle à l\'image près avec une API propre. Je peux bâtir une animation d\'entrée échelonnée, la lier à la position de défilement, l\'inverser à la sortie et respecter <code>prefers-reduced-motion</code>, le tout en quelques lignes de code. L\'API de timeline rend la chorégraphie complexe à plusieurs éléments composable et facile à déboguer.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'the other workhorse relational database, same care as Postgres',
			fr: 'l\'autre base de données relationnelle de fond, le même soin que Postgres',
		},
		icon: {
			iconify_id: 'logos:mysql',
			id: 'mysql',
			name: 'MySQL',
			svg_override: null,
		},
		id: 'mysql',
		layer: 'data',
		name: 'MySQL',
		relatedProjects: [],
		relatedServices: ['database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL has been the source database in several migration projects I\'ve handled. The Lorem Database Migration started as a MySQL instance that had outgrown its schema design, I mapped every data type, converted stored procedures, and built the dual-write migration path to PostgreSQL. Understanding MySQL\'s storage engines and locking behavior was critical to planning the zero-downtime cutover.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'MySQL a été la base de données source dans plusieurs projets de migration que j\'ai menés. La migration de base de données Lorem est partie d\'une instance MySQL qui avait dépassé la conception de son schéma : j\'ai cartographié chaque type de données, converti les procédures stockées et bâti le chemin de migration en double écriture vers PostgreSQL. Comprendre les moteurs de stockage de MySQL et son comportement de verrouillage était essentiel pour planifier la bascule sans temps d\'arrêt.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL is one of the most widely deployed relational databases in the world, especially in web applications. It stores data in tables with defined schemas, supports transactions, and is the "M" in the classic LAMP stack (Linux, Apache, MySQL, PHP). It\'s fast for read-heavy workloads and has a massive community with extensive documentation and tooling.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'MySQL est une des bases de données relationnelles les plus déployées au monde, surtout dans les applications web. Elle stocke les données dans des tables avec des schémas définis, supporte les transactions, et c\'est le « M » de la pile classique LAMP (Linux, Apache, MySQL, PHP). Elle est rapide pour les charges de travail axées sur la lecture et possède une communauté immense avec une documentation et un outillage étendus.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL shows up in legacy systems more than in my new projects. I\'m proficient at working with it, optimizing queries, designing schemas, managing replication, but I typically recommend PostgreSQL for new work because of its richer feature set. That said, when a client\'s infrastructure is already MySQL-based, I work within that ecosystem rather than pushing an unnecessary migration. Knowing both MySQL and PostgreSQL well means I can make honest recommendations about when a migration is worth the effort.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'MySQL apparaît plus souvent dans les systèmes existants que dans mes nouveaux projets. Je suis à l\'aise pour travailler avec : optimiser les requêtes, concevoir les schémas, gérer la réplication, mais je recommande habituellement PostgreSQL pour le nouveau travail à cause de son ensemble de fonctionnalités plus riche. Cela dit, quand l\'infrastructure d\'un client est déjà basée sur MySQL, je travaille dans cet écosystème plutôt que de pousser une migration inutile. Bien connaître MySQL et PostgreSQL, ça veut dire que je peux faire des recommandations honnêtes sur les moments où une migration vaut l\'effort.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:nodejs-icon',
			id: 'node-js',
			name: 'Node.js',
			svg_override: null,
		},
		id: 'node-js',
		layer: 'logic',
		name: 'Node.js',
		relatedProjects: [],
		relatedServices: ['internal-tooling'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Lorem Retool Admin Panel uses Node.js as its API layer, handling CRUD operations against PostgreSQL with role-based access control and automated approval routing. Node.js is also the foundation for SvelteKit\'s server-side rendering on yesid.dev, where it handles the build pipeline, server routes, and static asset generation that Vercel deploys to the edge.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Le panneau d\'administration Retool Lorem utilise Node.js comme couche d\'API, en gérant les opérations CRUD contre PostgreSQL avec un contrôle d\'accès basé sur les rôles et un routage d\'approbation automatisé. Node.js est aussi la fondation du rendu côté serveur de SvelteKit sur yesid.dev, où il gère le pipeline de build, les routes serveur et la génération des actifs statiques que Vercel déploie en périphérie.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine that lets you run JavaScript outside the browser, on servers, command-line tools, and backend services. It uses an event-driven, non-blocking I/O model, which makes it efficient for handling many simultaneous connections. npm, its package manager, hosts the largest ecosystem of open-source libraries in any language.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Node.js est un runtime JavaScript bâti sur le moteur V8 de Chrome qui te laisse rouler du JavaScript en dehors du navigateur : sur des serveurs, des outils en ligne de commande et des services backend. Il utilise un modèle d\'E/S non bloquant et piloté par événements, ce qui le rend efficace pour gérer plusieurs connexions simultanées. npm, son gestionnaire de paquets, héberge le plus gros écosystème de bibliothèques open-source de tous les langages.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Node.js is the runtime behind my internal tooling and API layers. For projects where the frontend is already JavaScript/TypeScript, using Node on the backend means the entire stack shares one language, one type system, and one set of libraries. I pair it with Express or SvelteKit\'s server routes depending on the project. For new projects I often reach for Bun instead, but Node.js remains the standard for production deployments where ecosystem compatibility matters most.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Node.js est le runtime derrière mon outillage interne et mes couches d\'API. Pour les projets où le frontend est déjà en JavaScript/TypeScript, utiliser Node au backend fait que toute la pile partage un seul langage, un seul système de typage et un seul ensemble de bibliothèques. Je le jumelle avec Express ou les routes serveur de SvelteKit selon le projet. Pour les nouveaux projets, je me tourne souvent vers Bun à la place, mais Node.js reste la norme pour les déploiements en production où la compatibilité de l\'écosystème compte le plus.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'proves the whole product works in a real browser, on every change',
			fr: 'prouve que tout le produit fonctionne dans un vrai navigateur, à chaque changement',
		},
		icon: {
			iconify_id: 'logos:playwright',
			id: 'playwright',
			name: 'Playwright',
			svg_override: null,
		},
		id: 'playwright',
		layer: 'infra',
		name: 'Playwright',
		relatedProjects: ['transit-data-pipeline', 'yesid-dev', 'cafe-arona'],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright is planned for yesid.dev\'s E2E testing layer, verifying critical user flows like navigating the tech stack diagram, opening detail panels, using filters, and the Build Your Stack configurator across Chrome, Firefox, and Safari. It integrates with GitHub Actions to run browser tests on every push, and its screenshot comparison can catch visual regressions that unit tests would never detect.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Playwright est prévu pour la couche de tests E2E de yesid.dev, en vérifiant les parcours utilisateurs critiques comme naviguer dans le diagramme de la pile technique, ouvrir les panneaux de détails, utiliser les filtres et le configurateur Build Your Stack à travers Chrome, Firefox et Safari. Il s\'intègre avec GitHub Actions pour rouler les tests de navigateur à chaque push, et sa comparaison de captures d\'écran peut attraper les régressions visuelles que les tests unitaires ne détecteraient jamais.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright is a browser automation framework by Microsoft for end-to-end testing. It controls real browsers (Chromium, Firefox, WebKit) programmatically, navigating pages, clicking buttons, filling forms, and asserting on page content. Unlike unit tests that test components in isolation, E2E tests verify that the entire application works as a user would experience it: real HTTP requests, real rendering, real interactions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Playwright est un cadriciel d\'automatisation de navigateur de Microsoft pour les tests de bout en bout. Il contrôle de vrais navigateurs (Chromium, Firefox, WebKit) par programmation : naviguer dans les pages, cliquer sur des boutons, remplir des formulaires et valider le contenu des pages. Contrairement aux tests unitaires qui testent les composants en isolation, les tests E2E vérifient que l\'application au complet fonctionne comme un utilisateur la vivrait : de vraies requêtes HTTP, un vrai rendu, de vraies interactions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright catches the bugs that unit tests miss, the ones that only appear when components interact in a real browser with real data. I\'m building my E2E testing practice around it because it\'s the most capable browser testing tool available: auto-waiting (no flaky <code>sleep()</code> calls), multi-browser support, network interception, and built-in trace viewer for debugging failures. For visual-heavy sites like yesid.dev, Playwright can verify animations, responsive layouts, and interaction flows.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Playwright attrape les bugs que les tests unitaires manquent, ceux qui apparaissent seulement quand les composants interagissent dans un vrai navigateur avec de vraies données. Je bâtis ma pratique de tests E2E autour de lui parce que c\'est l\'outil de test de navigateur le plus capable qui existe : attente automatique (pas d\'appels <code>sleep()</code> instables), support multi-navigateurs, interception réseau et visualiseur de traces intégré pour déboguer les échecs. Pour les sites très visuels comme yesid.dev, Playwright peut vérifier les animations, les mises en page adaptatives et les parcours d\'interaction.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'stores and queries your data reliably',
			fr: 'stocke et interroge tes données de façon fiable',
		},
		icon: {
			iconify_id: 'logos:postgresql',
			id: 'postgresql',
			name: 'PostgreSQL',
			svg_override: null,
		},
		id: 'postgresql',
		layer: 'data',
		name: 'PostgreSQL',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: [
			'database-engineering',
			'data-pipeline',
			'sql-development',
			'internal-tooling',
		],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, PostgreSQL serves as the central warehouse, ingesting GTFS-RT feeds, storing transformed schedule data, and powering the KPI queries that feed Power BI dashboards. On yesid.dev, it backs the content layer and will serve as the Keystatic CMS storage when that slice ships. For the Lorem Database Migration, I moved a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur le pipeline de données des opérations de transport, PostgreSQL sert d\'entrepôt central : il ingère les flux GTFS-RT, stocke les données d\'horaire transformées et fait rouler les requêtes de KPI qui alimentent les tableaux de bord Power BI. Sur yesid.dev, il soutient la couche de contenu et servira de stockage pour le CMS Keystatic quand cette tranche sortira. Pour la migration de base de données Lorem, j\'ai déplacé une base MySQL de 500 Go vers PostgreSQL sans temps d\'arrêt en utilisant la double écriture et les lectures fantômes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL is an open-source relational database that stores structured data in tables with rows and columns. Think of it as a highly organized filing system where every piece of data has a defined type, relationships are enforced by the system itself, and you can ask complex questions across millions of records in milliseconds. It supports JSON, full-text search, window functions, and extensions, making it one of the most versatile databases available.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL est une base de données relationnelle open-source qui stocke des données structurées dans des tables avec des rangées et des colonnes. Vois ça comme un système de classement très organisé où chaque donnée a un type défini, où les relations sont imposées par le système lui-même, et où tu peux poser des questions complexes à travers des millions d\'enregistrements en quelques millisecondes. Elle supporte le JSON, la recherche en texte intégral, les fonctions de fenêtrage et les extensions, ce qui en fait une des bases de données les plus polyvalentes qui existent.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL is my default database for anything that touches production. Its query planner is excellent, CTEs and window functions make complex analytics queries readable, and the extension ecosystem (PostGIS, pg_cron, pgvector) means I rarely need a second database. I\'ve migrated clients off MySQL and SQL Server onto PostgreSQL specifically because it handles the "we also need X" requests without bolting on another tool.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL est ma base de données par défaut pour tout ce qui touche la production. Son planificateur de requêtes est excellent, les CTE et les fonctions de fenêtrage rendent les requêtes analytiques complexes lisibles, et l\'écosystème d\'extensions (PostGIS, pg_cron, pgvector) fait que j\'ai rarement besoin d\'une deuxième base de données. J\'ai migré des clients de MySQL et de SQL Server vers PostgreSQL précisément parce qu\'il gère les demandes « on a aussi besoin de X » sans avoir à greffer un autre outil.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'turns warehouse tables into boardroom-ready dashboards',
			fr: 'transforme les tables de l\'entrepôt en tableaux de bord prêts pour la haute direction',
		},
		icon: {
			iconify_id: 'logos:microsoft-power-bi',
			id: 'power-bi',
			name: 'Power BI',
			svg_override: null,
		},
		id: 'power-bi',
		layer: 'data',
		name: 'Power BI',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Lorem Analytics Dashboard is a Power BI suite that tracks operational metrics across 12 departments. I built the semantic layer in DAX on top of SQL Server, designed the star schema for query performance, and configured scheduled refreshes so executives see fresh data every morning. The result: reporting time dropped from 2 days to 15 minutes. On the Transit Data Pipeline, Power BI consumes the transformed PostgreSQL data to surface KPIs for transit operations managers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Le tableau de bord analytique Lorem est une suite Power BI qui suit les indicateurs opérationnels de 12 départements. J\'ai bâti la couche sémantique en DAX par-dessus SQL Server, conçu le schéma en étoile pour la performance des requêtes, et configuré les rafraîchissements planifiés pour que les dirigeants voient des données fraîches chaque matin. Résultat : le temps de production des rapports est passé de 2 jours à 15 minutes. Sur le pipeline de données de transport, Power BI consomme les données PostgreSQL transformées pour faire ressortir les KPI aux gestionnaires des opérations de transport.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Power BI is Microsoft\'s business intelligence platform for turning raw data into interactive dashboards and reports. It connects to virtually any data source (SQL Server, PostgreSQL, Excel, APIs), lets you build a semantic data model with relationships and calculations, and publishes dashboards that business users can filter, drill into, and share. It\'s the most widely adopted BI tool in enterprise environments.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Power BI, c\'est la plateforme d\'intelligence d\'affaires de Microsoft pour transformer des données brutes en tableaux de bord et rapports interactifs. Elle se connecte à pratiquement n\'importe quelle source de données (SQL Server, PostgreSQL, Excel, API), te laisse bâtir un modèle de données sémantique avec des relations et des calculs, et publie des tableaux de bord que les gens d\'affaires peuvent filtrer, explorer et partager. C\'est l\'outil d\'intelligence d\'affaires le plus répandu dans les milieux d\'entreprise.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Power BI is where my data engineering work becomes visible to stakeholders. I don\'t treat it as a drag-and-drop chart builder, I design proper semantic layers with DAX measures, star schemas, and row-level security so the dashboards are fast, accurate, and trustworthy. The difference between a mediocre Power BI dashboard and a great one is the data model underneath it, and that\'s where my SQL and data engineering background makes the biggest impact.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Power BI, c\'est là où mon travail d\'ingénierie de données devient visible pour les parties prenantes. Je ne le traite pas comme un simple bâtisseur de graphiques par glisser-déposer, je conçois de vraies couches sémantiques avec des mesures DAX, des schémas en étoile et de la sécurité au niveau des lignes, pour que les tableaux de bord soient rapides, exacts et fiables. La différence entre un tableau de bord Power BI ordinaire et un excellent, c\'est le modèle de données en dessous, et c\'est là que mon expérience en SQL et en ingénierie de données fait la plus grande différence.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'automates the data work: ingest, clean, transform',
			fr: 'automatise le travail de données : ingestion, nettoyage, transformation',
		},
		icon: {
			iconify_id: 'logos:python',
			id: 'python',
			name: 'Python',
			svg_override: null,
		},
		id: 'python',
		layer: 'logic',
		name: 'Python',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, Python handles the entire ELT flow: ingesting GTFS-RT feeds, transforming schedule data with pandas, loading into PostgreSQL, and orchestrating the whole pipeline with Airflow. For the Lorem Query Optimizer, Python connects to SQL Server instances and analyzes execution plans programmatically. It\'s also the glue language in my analytics projects, pulling data from APIs, cleaning it, and loading it into Power BI-ready tables.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur le pipeline de données des opérations de transport, Python gère tout le flux ELT : l\'ingestion des flux GTFS-RT, la transformation des données d\'horaire avec pandas, le chargement dans PostgreSQL, et l\'orchestration de tout le pipeline avec Airflow. Pour l\'optimiseur de requêtes Lorem, Python se connecte aux instances SQL Server et analyse les plans d\'exécution par programmation. C\'est aussi le langage de liaison dans mes projets analytiques : il va chercher les données dans les API, les nettoie, et les charge dans des tables prêtes pour Power BI.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Python is a general-purpose programming language known for its readable syntax and massive ecosystem. It\'s the dominant language in data engineering, machine learning, and scripting, if you need to move data, analyze it, or automate a workflow, Python probably has a library for it. Its "batteries included" standard library and pip package manager make it fast to prototype and deploy.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Python, c\'est un langage de programmation polyvalent reconnu pour sa syntaxe lisible et son immense écosystème. C\'est le langage dominant en ingénierie de données, en apprentissage automatique et en scriptage : si t\'as besoin de déplacer des données, de les analyser ou d\'automatiser un flux de travail, Python a probablement une bibliothèque pour ça. Sa bibliothèque standard « batteries incluses » et son gestionnaire de paquets pip rendent le prototypage et le déploiement rapides.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Python is my primary language for anything data. pandas for transformation, SQLAlchemy for database access, Airflow for orchestration, pytest for testing, the ecosystem is unmatched for data work. I write Python that\'s production-grade: typed with mypy, tested, and structured with clear module boundaries. I don\'t write "notebook Python" for production, I write maintainable code that ops teams can debug at 3 AM.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Python, c\'est mon langage principal pour tout ce qui touche aux données. pandas pour la transformation, SQLAlchemy pour l\'accès aux bases de données, Airflow pour l\'orchestration, pytest pour les tests : l\'écosystème est inégalé pour le travail de données. J\'écris du Python de qualité production : typé avec mypy, testé, et structuré avec des frontières de modules claires. J\'écris pas du « Python de carnet » pour la production, j\'écris du code maintenable que les équipes d\'opérations peuvent déboguer à 3 h du matin.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:react',
			id: 'react',
			name: 'React',
			svg_override: null,
		},
		id: 'react',
		layer: 'interface',
		name: 'React',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'React shows up in client projects and collaborative work where the team is React-native. My component design principles transfer directly between React and Svelte, typed props, data-driven rendering, composition over inheritance. The mental model difference (React\'s "re-render everything, diff the virtual DOM" vs. Svelte\'s "compile to surgical DOM updates") gives me a unique perspective on performance tradeoffs when advising clients on architecture choices.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'React apparaît dans les projets clients et le travail collaboratif où l\'équipe baigne dans React. Mes principes de conception de composants se transfèrent directement entre React et Svelte : props typées, rendu piloté par les données, composition plutôt qu\'héritage. La différence de modèle mental (le « re-rends tout, compare le DOM virtuel » de React versus le « compile en mises à jour chirurgicales du DOM » de Svelte) me donne une perspective unique sur les compromis de performance quand je conseille des clients sur leurs choix d\'architecture.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'React is a JavaScript library for building user interfaces, created by Meta. It introduced the concept of components, reusable, self-contained pieces of UI that manage their own state. React uses a virtual DOM to efficiently update only the parts of the page that changed, and JSX syntax that lets you write HTML-like code inside JavaScript. It\'s the most widely adopted frontend library in the world, powering everything from Facebook to Airbnb to Notion.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'React, c\'est une bibliothèque JavaScript pour bâtir des interfaces utilisateur, créée par Meta. Elle a introduit le concept de composants : des morceaux d\'interface réutilisables et autonomes qui gèrent leur propre état. React utilise un DOM virtuel pour mettre à jour efficacement juste les parties de la page qui ont changé, et la syntaxe JSX qui te laisse écrire du code à la HTML à l\'intérieur du JavaScript. C\'est la bibliothèque frontend la plus répandue au monde, qui propulse autant Facebook qu\'Airbnb que Notion.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'React is the industry standard, and knowing it well makes me effective in most web teams. I understand hooks, context, suspense, and the rendering lifecycle. I use React through Next.js rather than standalone because the framework handles the hard parts, routing, SSR, code splitting, that you\'d otherwise wire up manually. My primary framework is Svelte, but React proficiency means I can step into any React codebase and contribute immediately.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'React, c\'est le standard de l\'industrie, et bien le connaître me rend efficace dans la plupart des équipes web. Je comprends les hooks, le contexte, le suspense et le cycle de vie du rendu. J\'utilise React à travers Next.js plutôt que tout seul, parce que le cadriciel s\'occupe des parties difficiles, le routage, le SSR, le découpage du code, que t\'aurais autrement à câbler à la main. Mon cadriciel principal, c\'est Svelte, mais ma maîtrise de React fait que je peux embarquer dans n\'importe quelle base de code React et contribuer tout de suite.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'lets your interface and services talk over clean endpoints',
			fr: 'laisse ton interface et tes services se parler par des points de terminaison propres',
		},
		icon: {
			iconify_id: null,
			id: 'rest-api',
			name: 'REST API',
			svg_override: null,
		},
		id: 'rest-api',
		layer: 'logic',
		name: 'REST API',
		relatedProjects: [],
		relatedServices: ['internal-tooling'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, REST endpoints power the contact form (Web3Forms integration) and will handle the Keystatic CMS API. The Lorem Retool Admin Panel exposes a REST API layer that Retool consumes, CRUD operations with role-based access control, input validation, and consistent error responses. Every API I build follows the same envelope pattern: <code>{ success, data, error, meta }</code> so clients always know what to expect.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, les points de terminaison REST propulsent le formulaire de contact (intégration Web3Forms) et vont gérer l\'API du CMS Keystatic. Le panneau d\'administration Retool Lorem expose une couche d\'API REST que Retool consomme : opérations CRUD avec contrôle d\'accès basé sur les rôles, validation des entrées, et réponses d\'erreur cohérentes. Chaque API que je bâtis suit le même patron d\'enveloppe : <code>{ success, data, error, meta }</code> pour que les clients sachent toujours à quoi s\'attendre.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'REST (Representational State Transfer) is an architectural style for building web APIs. Instead of inventing custom protocols, REST uses standard HTTP methods, GET to read, POST to create, PUT to update, DELETE to remove. Resources are identified by URLs, and data flows as JSON. It\'s the most common way for frontend applications, mobile apps, and services to communicate with backend systems.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'REST (Representational State Transfer), c\'est un style d\'architecture pour bâtir des API web. Au lieu d\'inventer des protocoles maison, REST utilise les méthodes HTTP standards : GET pour lire, POST pour créer, PUT pour mettre à jour, DELETE pour supprimer. Les ressources sont identifiées par des URL, et les données circulent en JSON. C\'est la façon la plus courante pour les applications frontend, les applications mobiles et les services de communiquer avec les systèmes backend.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'REST is my default for API design because it\'s universally understood. Every frontend framework, every mobile platform, and every integration tool speaks HTTP. I design RESTful APIs with consistent patterns: predictable URL structures, proper status codes, pagination metadata, and error envelopes. I prefer REST over GraphQL for most projects because the tooling is simpler, caching works naturally with HTTP, and the debugging experience with standard browser DevTools is better.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'REST, c\'est mon choix par défaut pour la conception d\'API parce que c\'est compris universellement. Tous les cadriciels frontend, toutes les plateformes mobiles, et tous les outils d\'intégration parlent HTTP. Je conçois des API RESTful avec des patrons cohérents : des structures d\'URL prévisibles, des bons codes de statut, des métadonnées de pagination, et des enveloppes d\'erreur. Je préfère REST à GraphQL pour la plupart des projets parce que l\'outillage est plus simple, la mise en cache fonctionne naturellement avec HTTP, et l\'expérience de débogage avec les outils de développement standards du navigateur est meilleure.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'runs enterprise reporting workloads and the T-SQL estate',
			fr: 'fait rouler les charges de production de rapports d\'entreprise et le parc T-SQL',
		},
		icon: {
			iconify_id: 'devicon:microsoftsqlserver',
			id: 'sql-server',
			name: 'SQL Server',
			svg_override: null,
		},
		id: 'sql-server',
		layer: 'data',
		name: 'SQL Server',
		relatedProjects: [],
		relatedServices: ['database-engineering', 'sql-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'For the Lorem Analytics Dashboard, SQL Server is the primary data source, I built semantic layers in DAX on top of its tables to power executive KPI dashboards. On the Lorem Query Optimizer project, I wrote a Python tool that connects to SQL Server instances, captures execution plans for the heaviest queries, and generates optimization recommendations that reduced average query time by 73% across 200+ stored procedures.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Pour le tableau de bord analytique Lorem, SQL Server est la source de données principale : j\'ai bâti des couches sémantiques en DAX par-dessus ses tables pour propulser les tableaux de bord de KPI de la direction. Sur le projet d\'optimiseur de requêtes Lorem, j\'ai écrit un outil Python qui se connecte aux instances SQL Server, capture les plans d\'exécution des requêtes les plus lourdes, et génère des recommandations d\'optimisation qui ont réduit le temps moyen des requêtes de 73 % sur plus de 200 procédures stockées.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SQL Server is Microsoft\'s enterprise relational database, widely used in corporate environments for transactional systems, reporting, and business intelligence. It comes with a rich ecosystem: SSMS for management, SSIS for data integration, SSRS for reporting, and tight integration with Power BI and the .NET stack. If your company runs Windows servers and Microsoft tools, SQL Server is likely already in the picture.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SQL Server, c\'est la base de données relationnelle d\'entreprise de Microsoft, largement utilisée dans les milieux corporatifs pour les systèmes transactionnels, la production de rapports et l\'intelligence d\'affaires. Elle vient avec un riche écosystème : SSMS pour la gestion, SSIS pour l\'intégration de données, SSRS pour les rapports, et une intégration serrée avec Power BI et la pile .NET. Si ta compagnie roule des serveurs Windows et des outils Microsoft, SQL Server est probablement déjà dans le portrait.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Most of my enterprise clients already run SQL Server, it\'s the backbone of their ERP, CRM, and financial systems. I know its query optimizer inside out, including its quirks: parameter sniffing, implicit conversions, and the execution plan cache. When I\'m tuning performance, I read the actual execution plans, not just the estimated ones. SQL Server\'s temporal tables and columnstore indexes are underused features that I regularly leverage for audit trails and analytics workloads.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'La plupart de mes clients d\'entreprise roulent déjà SQL Server, c\'est l\'épine dorsale de leurs systèmes ERP, CRM et financiers. Je connais son optimiseur de requêtes sur le bout des doigts, y compris ses bizarreries : le reniflage de paramètres, les conversions implicites, et le cache des plans d\'exécution. Quand je règle la performance, je lis les vrais plans d\'exécution, pas juste ceux estimés. Les tables temporelles et les index columnstore de SQL Server sont des fonctionnalités sous-utilisées que j\'exploite régulièrement pour les pistes d\'audit et les charges de travail analytiques.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'ssis',
			name: 'SSIS',
			svg_override: null,
		},
		id: 'ssis',
		layer: 'logic',
		name: 'SSIS',
		relatedProjects: [],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In enterprise environments, SSIS often runs the data pipelines that feed the dashboards and reports I build. When I\'m designing a new analytics solution on SQL Server, I evaluate whether SSIS, Python, or Airflow is the right orchestration tool based on the team\'s skills and the pipeline\'s complexity. For simple SQL-to-SQL workflows, SSIS is effective. For anything involving APIs, complex logic, or cross-platform sources, I recommend Python with Airflow.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Dans les milieux d\'entreprise, SSIS fait souvent rouler les pipelines de données qui alimentent les tableaux de bord et les rapports que je bâtis. Quand je conçois une nouvelle solution analytique sur SQL Server, j\'évalue si SSIS, Python ou Airflow est le bon outil d\'orchestration selon les compétences de l\'équipe et la complexité du pipeline. Pour les flux simples de SQL à SQL, SSIS est efficace. Pour tout ce qui implique des API, de la logique complexe, ou des sources multiplateformes, je recommande Python avec Airflow.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSIS (SQL Server Integration Services) is Microsoft\'s ETL platform for moving and transforming data between systems. It uses a visual workflow designer where you build packages, sequences of data flow tasks that extract from sources (databases, files, APIs), apply transformations (lookups, data type conversions, aggregations), and load into destinations. SSIS packages can be scheduled, parameterized, and monitored through SQL Server Agent.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SSIS (SQL Server Integration Services), c\'est la plateforme ETL de Microsoft pour déplacer et transformer des données entre les systèmes. Elle utilise un concepteur de flux de travail visuel où tu bâtis des paquets, des séquences de tâches de flux de données qui extraient des sources (bases de données, fichiers, API), appliquent des transformations (recherches, conversions de types de données, agrégations), et chargent dans des destinations. Les paquets SSIS peuvent être planifiés, paramétrés et surveillés à travers SQL Server Agent.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSIS is the ETL tool I encounter most in Microsoft-stack enterprises. Many clients have years of SSIS packages running nightly, some well-designed, many not. I\'m proficient at building new packages, but my more common role is auditing and optimizing existing ones: identifying bottlenecks in data flows, replacing slow row-by-row transformations with set-based operations, and converting legacy packages to Python or Airflow when SSIS becomes a limitation.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SSIS, c\'est l\'outil ETL que je croise le plus dans les entreprises de la pile Microsoft. Beaucoup de clients ont des années de paquets SSIS qui roulent à chaque nuit, certains bien conçus, beaucoup pas. Je suis capable de bâtir des nouveaux paquets, mais mon rôle le plus courant, c\'est d\'auditer et d\'optimiser ceux qui existent : repérer les goulots d\'étranglement dans les flux de données, remplacer les transformations lentes ligne par ligne par des opérations ensemblistes, et convertir les vieux paquets en Python ou Airflow quand SSIS devient une limite.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'ssrs',
			name: 'SSRS',
			svg_override: null,
		},
		id: 'ssrs',
		layer: 'data',
		name: 'SSRS',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In SQL Server environments, SSRS typically handles the compliance and operational reporting that sits alongside Power BI\'s executive dashboards. I\'ve built SSRS reports that auto-generate monthly department summaries, format them as branded PDFs, and distribute them via email subscriptions, freeing analysts from the manual report compilation that used to consume days each month.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Dans les milieux SQL Server, SSRS gère typiquement la production de rapports de conformité et opérationnels qui accompagne les tableaux de bord de direction de Power BI. J\'ai bâti des rapports SSRS qui génèrent automatiquement les sommaires mensuels par département, les mettent en forme en PDF aux couleurs de l\'entreprise, et les distribuent par abonnements courriel, libérant les analystes de la compilation manuelle de rapports qui prenait des jours chaque mois.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSRS (SQL Server Reporting Services) is Microsoft\'s server-based report generation platform. It produces paginated reports, the kind you print, email as PDFs, or embed in applications, with precise layout control, parameters, subreports, and drill-through links. Think of it as the "print-ready" counterpart to Power BI\'s interactive dashboards. Reports are defined in RDL (Report Definition Language) and hosted on a report server.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SSRS (SQL Server Reporting Services), c\'est la plateforme de génération de rapports basée sur serveur de Microsoft. Elle produit des rapports paginés, le genre que t\'imprimes, envoies en PDF par courriel, ou intègres dans des applications, avec un contrôle de mise en page précis, des paramètres, des sous-rapports et des liens d\'exploration. Pense à ça comme le pendant « prêt à imprimer » des tableaux de bord interactifs de Power BI. Les rapports sont définis en RDL (Report Definition Language) et hébergés sur un serveur de rapports.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSRS fills a specific niche that Power BI doesn\'t: pixel-perfect, paginated documents. Invoices, regulatory filings, audit reports, and anything that needs to be printed or archived as a PDF, that\'s SSRS territory. I build SSRS reports when the output needs exact formatting control, and I know when to recommend Power BI instead (interactive exploration) vs. SSRS (formal document generation). Many organizations need both, and I design solutions that use each tool for its strength.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SSRS comble un créneau précis que Power BI ne couvre pas : les documents paginés au pixel près. Les factures, les déclarations réglementaires, les rapports d\'audit, et tout ce qui doit être imprimé ou archivé en PDF, c\'est le terrain de SSRS. Je bâtis des rapports SSRS quand la sortie a besoin d\'un contrôle de mise en forme exact, et je sais quand recommander Power BI à la place (exploration interactive) versus SSRS (génération de documents formels). Bien des organisations ont besoin des deux, et je conçois des solutions qui utilisent chaque outil pour sa force.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:svelte',
			id: 'svelte',
			name: 'Svelte',
			svg_override: null,
		},
		id: 'svelte-5',
		layer: 'interface',
		name: 'Svelte 5',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Every component on yesid.dev is a Svelte 5 component using runes. The tech stack diagram uses <code>$state</code> for the selected node, <code>$derived</code> for filtered connections, and <code>$effect</code> for GSAP animation lifecycle. The CollapsibleSection component uses <code>$state</code> for open/closed state with CSS transitions. Svelte 5\'s compile-time approach means the site ships minimal JavaScript despite having complex animations, interactive diagrams, and responsive layouts.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Chaque composant sur yesid.dev est un composant Svelte 5 qui utilise les runes. Le diagramme de la pile technologique utilise <code>$state</code> pour le nœud sélectionné, <code>$derived</code> pour les connexions filtrées, et <code>$effect</code> pour le cycle de vie des animations GSAP. Le composant CollapsibleSection utilise <code>$state</code> pour l\'état ouvert/fermé avec des transitions CSS. L\'approche à la compilation de Svelte 5 fait que le site envoie un minimum de JavaScript malgré ses animations complexes, ses diagrammes interactifs, et ses mises en page adaptatives.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Svelte is a UI framework that takes a fundamentally different approach from React or Vue. Instead of shipping a runtime library to the browser that interprets your components, Svelte compiles your components into efficient vanilla JavaScript at build time. Svelte 5 introduced runes, a new reactivity system using <code>$state</code>, <code>$derived</code>, and <code>$effect</code>, that makes reactive data explicit and fine-grained. The result is smaller bundles, faster updates, and code that reads almost like plain HTML with superpowers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Svelte, c\'est un cadriciel d\'interface qui prend une approche fondamentalement différente de React ou Vue. Au lieu d\'envoyer une bibliothèque d\'exécution au navigateur qui interprète tes composants, Svelte compile tes composants en JavaScript pur et efficace au moment de la construction. Svelte 5 a introduit les runes, un nouveau système de réactivité avec <code>$state</code>, <code>$derived</code> et <code>$effect</code>, qui rend les données réactives explicites et granulaires. Le résultat, c\'est des paquets plus petits, des mises à jour plus rapides, et du code qui se lit presque comme du HTML ordinaire avec des superpouvoirs.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Svelte 5\'s runes system is the cleanest reactivity model I\'ve worked with. <code>$state</code> for reactive variables, <code>$derived</code> for computed values, <code>$effect</code> for side effects, there\'s no hook rules to memorize, no dependency arrays to get wrong, no <code>useCallback</code> wrapping. Coming from a data background where I think in terms of data flow and transformations, Svelte\'s model maps naturally to how I reason about UI: data in, DOM out, no hidden re-renders.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Le système de runes de Svelte 5, c\'est le modèle de réactivité le plus propre avec lequel j\'ai travaillé. <code>$state</code> pour les variables réactives, <code>$derived</code> pour les valeurs calculées, <code>$effect</code> pour les effets de bord : pas de règles de hooks à mémoriser, pas de tableaux de dépendances à manquer, pas de <code>useCallback</code> à envelopper. Venant d\'un parcours en données où je pense en termes de flux et de transformations de données, le modèle de Svelte correspond naturellement à comment je raisonne sur l\'interface : données en entrée, DOM en sortie, pas de re-rendus cachés.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'renders fast, app-like pages from one codebase',
			fr: 'produit des pages rapides à la sensation d\'application à partir d\'une seule base de code',
		},
		icon: {
			iconify_id: 'logos:svelte-kit',
			id: 'sveltekit',
			name: 'SvelteKit',
			svg_override: null,
		},
		id: 'sveltekit',
		layer: 'interface',
		name: 'SvelteKit',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev is built entirely on SvelteKit 2. Every route, the portfolio, services, blog, tech stack, and contact page, is a SvelteKit page with typed load functions that pull from the data layer. The site uses SvelteKit\'s adapter-vercel for deployment, its server routes for API endpoints, and its prerendering for static pages. The Control Room diagram you\'re looking at right now is a SvelteKit page that loads 34 tech items from markdown files at build time.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'yesid.dev est bâti entièrement sur SvelteKit 2. Chaque route, le portfolio, les services, le blogue, la pile technologique et la page de contact, est une page SvelteKit avec des fonctions de chargement typées qui tirent de la couche de données. Le site utilise l\'adapter-vercel de SvelteKit pour le déploiement, ses routes serveur pour les points de terminaison d\'API, et son prérendu pour les pages statiques. Le diagramme de la salle de contrôle que t\'es en train de regarder, c\'est une page SvelteKit qui charge 34 éléments technologiques à partir de fichiers markdown au moment de la construction.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SvelteKit is a full-stack web framework built on Svelte. It handles routing, server-side rendering, data loading, and deployment, everything you need to build a complete web application. Unlike frameworks that ship a heavy JavaScript runtime to the browser, SvelteKit compiles your components into minimal, optimized JavaScript at build time. The result is fast pages with less code shipped to the user.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SvelteKit, c\'est un cadriciel web pleine pile bâti sur Svelte. Il gère le routage, le rendu côté serveur, le chargement des données et le déploiement, tout ce qu\'il te faut pour bâtir une application web complète. Contrairement aux cadriciels qui envoient une lourde bibliothèque d\'exécution JavaScript au navigateur, SvelteKit compile tes composants en JavaScript minimal et optimisé au moment de la construction. Le résultat, c\'est des pages rapides avec moins de code envoyé à l\'utilisateur.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SvelteKit is my primary web framework and the foundation of every new web project I build. The developer experience is the best I\'ve used: file-based routing that maps directly to URLs, load functions that keep data fetching explicit and testable, and a build step that eliminates the framework overhead. Coming from data engineering where I value predictability and observability, SvelteKit\'s "no hidden magic" philosophy resonates, I can trace exactly what runs on the server, what runs on the client, and where the data flows.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SvelteKit, c\'est mon cadriciel web principal et la fondation de chaque nouveau projet web que je bâtis. L\'expérience de développement est la meilleure que j\'ai utilisée : routage basé sur les fichiers qui correspond directement aux URL, fonctions de chargement qui gardent la récupération de données explicite et testable, et une étape de construction qui élimine la surcharge du cadriciel. Venant de l\'ingénierie de données où je valorise la prévisibilité et l\'observabilité, la philosophie « pas de magie cachée » de SvelteKit me parle : je peux retracer exactement ce qui roule sur le serveur, ce qui roule sur le client, et où les données circulent.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'devicon:microsoftsqlserver',
			id: 't-sql',
			name: 'T-SQL',
			svg_override: null,
		},
		id: 't-sql',
		layer: 'data',
		name: 'T-SQL',
		relatedProjects: [],
		relatedServices: ['database-engineering', 'sql-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Lorem Analytics Dashboard, T-SQL stored procedures handle the ETL logic that feeds Power BI, aggregating transaction data, calculating derived metrics, and maintaining materialized summary tables. The Lorem Query Optimizer project uses T-SQL\'s DMVs (Dynamic Management Views) to identify slow queries, missing indexes, and execution plan anomalies programmatically. T-SQL is also the foundation of every SQL Server performance audit I conduct.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur le tableau de bord analytique Lorem, des procédures stockées T-SQL gèrent la logique ETL qui alimente Power BI, agrégeant les données de transactions, calculant des indicateurs dérivés, et maintenant des tables de sommaire matérialisées. Le projet d\'optimiseur de requêtes Lorem utilise les DMV (Dynamic Management Views) de T-SQL pour repérer les requêtes lentes, les index manquants, et les anomalies de plan d\'exécution par programmation. T-SQL est aussi la fondation de chaque audit de performance SQL Server que je mène.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'T-SQL (Transact-SQL) is Microsoft\'s extension of standard SQL, used exclusively with SQL Server. It adds procedural programming features, variables, control flow (IF/WHILE), error handling (TRY/CATCH), and stored procedures, on top of standard SQL queries. If SQL is the language for asking questions of your data, T-SQL is the language for building complete data processing programs inside the database itself.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'T-SQL (Transact-SQL), c\'est l\'extension de Microsoft au SQL standard, utilisée exclusivement avec SQL Server. Elle ajoute des fonctionnalités de programmation procédurale, des variables, du contrôle de flux (IF/WHILE), de la gestion d\'erreurs (TRY/CATCH), et des procédures stockées, par-dessus les requêtes SQL standards. Si SQL est le langage pour poser des questions à tes données, T-SQL est le langage pour bâtir des programmes complets de traitement de données à l\'intérieur même de la base de données.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'T-SQL is my most battle-tested skill. I\'ve written everything from simple SELECT queries to 1000-line stored procedures that process millions of rows nightly. I know the optimizer well enough to predict when it will choose a scan over a seek, when parameter sniffing will cause plan regression, and when a CTE is better than a temp table. Performance tuning T-SQL is where I\'ve delivered the most measurable value to clients, turning 30-minute reports into 30-second queries.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'T-SQL, c\'est ma compétence la plus éprouvée au combat. J\'ai écrit de tout, des simples requêtes SELECT jusqu\'aux procédures stockées de 1000 lignes qui traitent des millions de lignes à chaque nuit. Je connais l\'optimiseur assez bien pour prédire quand il va choisir un balayage plutôt qu\'une recherche, quand le reniflage de paramètres va causer une régression de plan, et quand une CTE vaut mieux qu\'une table temporaire. C\'est dans le réglage de performance du T-SQL que j\'ai livré la valeur la plus mesurable à mes clients, en transformant des rapports de 30 minutes en requêtes de 30 secondes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:tailwindcss',
			id: 'tailwind',
			name: 'Tailwind CSS',
			svg_override: null,
		},
		id: 'tailwind',
		layer: 'interface',
		name: 'Tailwind CSS',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Tailwind CSS v4 handles all compositional styling. The <code>@theme</code> block in <code>app.css</code> defines brand values (orange <code>#E07800</code>, yellow <code>#FFB627</code>, Inter and JetBrains Mono fonts), while <code>tokens.css</code> provides semantic tokens like <code>--bg-primary</code> and <code>--text-muted</code> that components reference. Every component uses Tailwind utilities for layout and spacing, with scoped <code>&lt;style&gt;</code> blocks reserved for complex grid layouts or animations that would need more than three utilities on one element.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, Tailwind CSS v4 gère tout le stylage de composition. Le bloc <code>@theme</code> dans <code>app.css</code> définit les valeurs de la marque (orange <code>#E07800</code>, jaune <code>#FFB627</code>, les polices Inter et JetBrains Mono), tandis que <code>tokens.css</code> fournit des jetons sémantiques comme <code>--bg-primary</code> et <code>--text-muted</code> que les composants vont chercher. Chaque composant utilise les utilitaires Tailwind pour la mise en page et l\'espacement, avec des blocs <code>&lt;style&gt;</code> scopés réservés aux grilles complexes ou aux animations qui auraient besoin de plus de trois utilitaires sur un même élément.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS classes like <code>.card-header</code>, you compose small utility classes directly in your HTML: <code>flex items-center gap-4 text-sm font-medium</code>. Tailwind scans your files at build time and generates only the CSS you actually use, resulting in tiny production stylesheets. Version 4 introduced a CSS-native engine with <code>@theme</code> for design tokens.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Tailwind CSS, c\'est un cadriciel CSS basé sur les classes utilitaires. Au lieu d\'écrire des classes CSS personnalisées comme <code>.card-header</code>, on assemble des petites classes utilitaires directement dans le HTML : <code>flex items-center gap-4 text-sm font-medium</code>. Tailwind analyse tes fichiers au moment du build et génère seulement le CSS que tu utilises vraiment, ce qui donne des feuilles de style de production minuscules. La version 4 a amené un moteur natif en CSS avec <code>@theme</code> pour les jetons de design.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Tailwind eliminates the naming problem that plagues CSS at scale. I don\'t need to invent class names, maintain a separate stylesheet, or worry about specificity conflicts. For a component-based architecture like Svelte, co-locating styles with markup makes components truly self-contained. I pair Tailwind with semantic CSS custom properties for theming, Tailwind handles composition (spacing, flex, typography), while <code>tokens.css</code> handles meaning (what "primary background" means in light vs. dark mode).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Tailwind règle le problème de nommage qui empoisonne le CSS à grande échelle. J\'ai pas besoin d\'inventer des noms de classes, de maintenir une feuille de style séparée, ni de me casser la tête avec les conflits de spécificité. Pour une architecture par composants comme Svelte, garder les styles à côté du markup rend les composants vraiment autonomes. Je jumelle Tailwind avec des propriétés CSS personnalisées sémantiques pour le thème : Tailwind gère la composition (espacement, flex, typographie), tandis que <code>tokens.css</code> gère le sens (ce que veut dire « arrière-plan primaire » en mode clair par rapport au mode sombre).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:threejs',
			id: 'threejs',
			name: 'Three.js',
			svg_override: null,
		},
		id: 'threejs-threlte',
		layer: 'interface',
		name: 'Three.js / Threlte',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Three.js / Threlte powered an experimental 3D hero scene during the early build, meshes, lights, and post-processing (bloom, vignette) composed as Svelte components, with mouse- and scroll-linked interactivity on top. The scene was killed after a performance and accessibility review: WebGL init cost on low-end devices, a11y gaps on the 3D canvas, and a <code>prefers-reduced-motion</code> fallback that effectively duplicated a simpler SVG path. The brief didn\'t need it, and the SVG + GSAP stack delivered the same feel at a fraction of the cost. Killed, not parked. See <code>brand/decisions/what-i-killed.md</code> for the full rationale (ships in Slice 17h).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
					{
						data: {
							alignment: 'left',
							caption: '',
							text: 'Scene components previously lived at <code>src/lib/motion/three/</code>; removed in the Slice 17 motion re-engineering.',
						},
						id: 'm00000002',
						type: 'quote',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, Three.js / Threlte a fait rouler une scène hero 3D expérimentale durant les débuts du build : des meshes, des lumières et du post-traitement (bloom, vignette) assemblés en composants Svelte, avec de l\'interactivité liée à la souris et au défilement par-dessus. La scène a été tuée après une revue de performance et d\'accessibilité : le coût d\'initialisation de WebGL sur les appareils bas de gamme, des trous d\'a11y sur le canvas 3D, et un repli <code>prefers-reduced-motion</code> qui dans les faits dédoublait un parcours SVG plus simple. Le mandat en avait pas besoin, et la pile SVG + GSAP livrait le même feeling pour une fraction du coût. Tué, pas mis de côté. Voir <code>brand/decisions/what-i-killed.md</code> pour le raisonnement complet (livré dans la Slice 17h).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
					{
						data: {
							alignment: 'left',
							caption: '',
							text: 'Les composants de la scène vivaient avant dans <code>src/lib/motion/three/</code> ; retirés lors de la réingénierie du mouvement de la Slice 17.',
						},
						id: 'm00000002',
						type: 'quote',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Three.js is a JavaScript library that makes WebGL accessible, it provides a scene graph, camera system, lighting, materials, and geometry primitives so you can create 3D graphics in the browser without writing raw shader code. Threlte is Svelte\'s wrapper around Three.js, letting you build 3D scenes with Svelte components instead of imperative JavaScript. A <code>&lt;T.Mesh&gt;</code> component in Threlte compiles to a Three.js mesh with reactive props and automatic cleanup.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Three.js, c\'est une librairie JavaScript qui rend WebGL accessible : elle fournit un graphe de scène, un système de caméra, l\'éclairage, les matériaux et des primitives de géométrie pour que tu puisses créer du graphisme 3D dans le navigateur sans écrire de code de shader brut. Threlte, c\'est l\'enrobage Svelte autour de Three.js, qui te laisse bâtir des scènes 3D avec des composants Svelte au lieu de JavaScript impératif. Un composant <code>&lt;T.Mesh&gt;</code> dans Threlte se compile vers un mesh Three.js avec des props réactives et un nettoyage automatique.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: '3D on the web is a differentiator, most portfolio sites are flat. Three.js gave me the ability to create immersive scenes that make a site memorable without requiring WebGL expertise from future maintainers. Threlte specifically fit a Svelte stack: 3D objects are components with props, they participate in Svelte\'s reactivity system, and they clean up automatically when unmounted. I paired Threlte with GSAP for animation timing and scroll-linked 3D transitions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'La 3D sur le web, c\'est un facteur de différenciation : la plupart des sites portfolio sont plats. Three.js m\'a donné la capacité de créer des scènes immersives qui rendent un site mémorable sans exiger une expertise WebGL des futurs mainteneurs. Threlte cadrait particulièrement bien avec une pile Svelte : les objets 3D sont des composants avec des props, ils participent au système de réactivité de Svelte, et ils se nettoient tout seuls quand ils sont démontés. J\'ai jumelé Threlte avec GSAP pour le timing des animations et les transitions 3D liées au défilement.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'keeps the codebase typed, refactorable, and honest',
			fr: 'garde la base de code typée, refactorable et honnête',
		},
		icon: {
			iconify_id: 'logos:typescript',
			id: 'typescript',
			name: 'TypeScript',
			svg_override: null,
		},
		id: 'typescript',
		layer: 'logic',
		name: 'TypeScript',
		relatedProjects: ['yesid-dev', 'cafe-arona'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Every file on yesid.dev is TypeScript. The data layer (projects, services, tech stack) is fully typed with interfaces like <code>TechStackItem</code>, <code>Project</code>, and <code>LocalizedString</code>. Components receive typed props, and the test suite validates data integrity at build time. When I added 34 tech stack items to the Control Room diagram, TypeScript caught every typo in connection references and domain names before I even opened a browser.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Chaque fichier sur yesid.dev est en TypeScript. La couche de données (projets, services, pile technique) est entièrement typée avec des interfaces comme <code>TechStackItem</code>, <code>Project</code> et <code>LocalizedString</code>. Les composants reçoivent des props typées, et la suite de tests valide l\'intégrité des données au moment du build. Quand j\'ai ajouté 34 items de pile technique au diagramme du Control Room, TypeScript a attrapé chaque coquille dans les références de connexion et les noms de domaine avant même que j\'ouvre un navigateur.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'TypeScript is JavaScript with a type system. It adds static types to the language, meaning you declare what shape your data has, and the compiler catches mistakes before your code ever runs in a browser. Every valid JavaScript file is also valid TypeScript, so adoption is gradual. TypeScript compiles down to plain JavaScript, so browsers and Node.js run it without any runtime overhead.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'TypeScript, c\'est du JavaScript avec un système de types. Il ajoute des types statiques au langage : tu déclares la forme qu\'a ta donnée, et le compilateur attrape les erreurs avant même que ton code roule dans un navigateur. Chaque fichier JavaScript valide est aussi un fichier TypeScript valide, donc l\'adoption se fait graduellement. TypeScript se compile vers du JavaScript ordinaire, alors les navigateurs et Node.js le font rouler sans aucun coût à l\'exécution.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I don\'t write JavaScript anymore, only TypeScript. The type system catches entire categories of bugs at compile time that would otherwise surface as runtime errors in production. For data-driven sites like this one, where components render from typed data interfaces, TypeScript ensures that adding a project or service never breaks the UI silently. The developer experience with VS Code\'s IntelliSense is also dramatically better, autocomplete, refactoring, and go-to-definition all work because the types are there.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'écris plus de JavaScript, juste du TypeScript. Le système de types attrape des catégories entières de bogues à la compilation qui sortiraient autrement en erreurs à l\'exécution en production. Pour des sites pilotés par les données comme celui-ci, où les composants s\'affichent à partir d\'interfaces de données typées, TypeScript garantit qu\'ajouter un projet ou un service ne brise jamais l\'interface en silence. L\'expérience développeur avec IntelliSense de VS Code est aussi nettement meilleure : l\'autocomplétion, le refactoring et le aller-à-la-définition fonctionnent tous parce que les types sont là.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'serves the site from the edge, close to every visitor',
			fr: 'sert le site depuis la périphérie, proche de chaque visiteur',
		},
		icon: {
			iconify_id: 'logos:vercel',
			id: 'vercel',
			name: 'Vercel',
			svg_override: null,
		},
		id: 'vercel',
		layer: 'infra',
		name: 'Vercel',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev deploys to Vercel on every push to main. Each feature branch gets a preview deployment with a unique URL, useful for client reviews and visual QA. Vercel\'s build pipeline runs <code>bun run build</code>, handles the SvelteKit adapter configuration, and serves the static and server-rendered pages from edge locations. The integration with GitHub Actions means tests run in CI before Vercel promotes a deployment to production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'yesid.dev se déploie sur Vercel à chaque push sur main. Chaque branche de fonctionnalité reçoit un déploiement d\'aperçu avec une URL unique, ben utile pour les revues clients et le QA visuel. Le pipeline de build de Vercel roule <code>bun run build</code>, gère la configuration de l\'adaptateur SvelteKit, et sert les pages statiques et rendues côté serveur à partir d\'emplacements de périphérie. L\'intégration avec GitHub Actions fait que les tests roulent en CI avant que Vercel promeuve un déploiement en production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vercel is a cloud platform for deploying web applications. Push your code to Git, and Vercel builds and deploys it automatically, with preview URLs for every pull request and production deployments on merge. It provides a global edge network (CDN), serverless functions, and framework-specific optimizations for Next.js, SvelteKit, Nuxt, and others. Vercel handles SSL, caching, and scaling without manual infrastructure management.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Vercel, c\'est une plateforme infonuagique pour déployer des applications web. Tu pousses ton code sur Git, et Vercel le build et le déploie automatiquement, avec des URL d\'aperçu pour chaque pull request et des déploiements en production au moment du merge. Ça fournit un réseau de périphérie mondial (CDN), des fonctions sans serveur, et des optimisations propres à chaque cadriciel pour Next.js, SvelteKit, Nuxt et d\'autres. Vercel gère le SSL, la mise en cache et la mise à l\'échelle sans gestion manuelle de l\'infrastructure.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vercel is my deployment platform because it removes every piece of infrastructure friction. I push to GitHub, and the site is live in under a minute, with preview URLs for every branch so I can share work-in-progress with clients. The SvelteKit adapter works out of the box, automatic HTTPS is configured, and the CDN ensures fast load times globally. For a freelance developer, Vercel\'s zero-config deployment means I spend time building features instead of managing servers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Vercel, c\'est ma plateforme de déploiement parce qu\'elle enlève chaque friction d\'infrastructure. Je pousse sur GitHub, et le site est en ligne en moins d\'une minute, avec des URL d\'aperçu pour chaque branche pour que je puisse partager du travail en cours avec les clients. L\'adaptateur SvelteKit marche d\'emblée, le HTTPS automatique est configuré, et le CDN assure des temps de chargement rapides partout dans le monde. Pour un développeur pigiste, le déploiement sans configuration de Vercel veut dire que je passe mon temps à bâtir des fonctionnalités au lieu de gérer des serveurs.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'runs thousands of unit checks in seconds, on every change',
			fr: 'roule des milliers de vérifications unitaires en quelques secondes, à chaque changement',
		},
		icon: {
			iconify_id: 'logos:vitest',
			id: 'vitest',
			name: 'Vitest',
			svg_override: null,
		},
		id: 'vitest',
		layer: 'infra',
		name: 'Vitest',
		relatedProjects: ['transit-data-pipeline', 'yesid-dev'],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev uses Vitest with a dual-project configuration: one project for component tests (using happy-dom for DOM simulation) and another for data-layer unit tests (pure TypeScript, no DOM needed). The test suite validates data integrity (all 34 tech items have valid connections, no dangling references), component behavior (filters, collapsible sections, stack panels), and type safety. Tests run on every commit via <code>bun run test</code> and in CI via GitHub Actions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'yesid.dev utilise Vitest avec une configuration à deux projets : un projet pour les tests de composants (avec happy-dom pour simuler le DOM) et un autre pour les tests unitaires de la couche de données (du TypeScript pur, pas besoin de DOM). La suite de tests valide l\'intégrité des données (les 34 items techniques ont tous des connexions valides, aucune référence pendante), le comportement des composants (filtres, sections repliables, panneaux de pile), et la sûreté des types. Les tests roulent à chaque commit via <code>bun run test</code> et en CI via GitHub Actions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vitest is a fast unit testing framework built on Vite\'s transformation pipeline. It runs TypeScript and JSX natively (no separate compile step), supports ESM imports, and provides a Jest-compatible API, so if you know Jest, you already know Vitest. It includes snapshot testing, code coverage, watch mode, and a browser UI for exploring test results. For Vite-based projects (SvelteKit, React with Vite), Vitest shares the same config and plugin ecosystem.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Vitest, c\'est un cadriciel de tests unitaires rapide bâti sur le pipeline de transformation de Vite. Il roule TypeScript et JSX nativement (pas d\'étape de compilation séparée), supporte les imports ESM, et fournit une API compatible avec Jest : si tu connais Jest, tu connais déjà Vitest. Ça inclut les tests par instantané, la couverture de code, le mode surveillance, et une interface navigateur pour explorer les résultats de tests. Pour les projets basés sur Vite (SvelteKit, React avec Vite), Vitest partage la même configuration et le même écosystème de plugiciels.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vitest is fast, and speed matters when you\'re running tests after every code change. It uses Vite\'s on-demand module transformation, so only the files that changed get re-processed. Combined with Bun as the runtime, test suites that took minutes with Jest now run in seconds. I pair it with <code>@testing-library/svelte</code> for component tests and use the multi-project configuration to run different test types (unit vs. component) with optimized settings for each.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Vitest est rapide, et la vitesse compte quand tu roules tes tests après chaque changement de code. Il utilise la transformation de modules à la demande de Vite, alors juste les fichiers qui ont changé se font retraiter. Combiné avec Bun comme environnement d\'exécution, des suites de tests qui prenaient des minutes avec Jest roulent maintenant en quelques secondes. Je le jumelle avec <code>@testing-library/svelte</code> pour les tests de composants et j\'utilise la configuration multi-projets pour rouler différents types de tests (unitaires par rapport à composants) avec des réglages optimisés pour chacun.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'runs product catalogs, checkout, payments, and order operations in one hosted commerce system',
			fr: 'fait rouler le catalogue, le paiement, les commandes et les opérations dans une seule plateforme commerce',
		},
		icon: {
			iconify_id: 'logos:shopify',
			id: 'shopify',
			name: 'Shopify',
			svg_override: null,
		},
		id: 'shopify',
		layer: 'logic',
		name: 'Shopify',
		relatedProjects: ['cafe-arona'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On Cafe Arona, Shopify is the commerce backbone behind the public storefront. It owns product data, checkout, payment flow, order handling, and the operational admin that a small business actually needs day to day. The web layer can focus on brand, content, and conversion while Shopify handles the parts of commerce where reliability and trust matter most.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur Cafe Arona, Shopify est la colonne vertébrale commerce derrière la vitrine publique. Il garde les produits, le paiement, les commandes et l\'admin opérationnel dont une petite entreprise a besoin tous les jours. La couche web peut se concentrer sur la marque, le contenu et la conversion pendant que Shopify gère les morceaux où la fiabilité compte vraiment.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Shopify is a hosted commerce platform for running online stores. It gives a business the product catalog, checkout, payment processing, order management, customer accounts, discount rules, taxes, and admin workflows in one system. Developers extend it through themes, Liquid templates, apps, webhooks, and APIs instead of rebuilding commerce primitives from scratch.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Shopify est une plateforme commerce hébergée pour faire rouler une boutique en ligne. Elle donne le catalogue de produits, le paiement, la gestion des commandes, les comptes clients, les rabais, les taxes et les flux admin dans un seul système. Les développeurs l\'étendent avec des thèmes, des gabarits Liquid, des apps, des webhooks et des APIs au lieu de rebâtir le commerce à partir de zéro.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Shopify when the client needs to sell reliably more than they need a custom commerce experiment. A custom checkout sounds flexible, but it creates payment, tax, fraud, inventory, and support risk fast. Shopify gives the business a proven operational base, then I can spend the project budget on the storefront, content model, analytics, and the parts that actually differentiate the brand.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Shopify quand le client doit vendre de façon fiable plus qu\'il a besoin d\'une expérience commerce sur mesure. Un paiement custom a l\'air flexible, mais ça amène vite des risques de paiement, taxes, fraude, inventaire et support. Shopify donne une base opérationnelle solide, puis le budget peut aller sur la vitrine, le modèle de contenu, l\'analytique et ce qui distingue vraiment la marque.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'turns warehouse SQL into tested, documented, reusable analytics models',
			fr: 'transforme le SQL d\'entrepôt en modèles analytiques testés, documentés et réutilisables',
		},
		icon: {
			iconify_id: 'simple-icons:dbt',
			id: 'dbt',
			name: 'dbt',
			svg_override: null,
		},
		id: 'dbt',
		layer: 'logic',
		name: 'dbt',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On data projects, dbt is the layer I reach for when raw tables need to become trusted reporting models. It is useful for staging messy source data, building fact and dimension tables, documenting metric definitions, and making the Power BI or dashboard layer thinner. The value is not just cleaner SQL, it is a shared contract for how the business numbers are produced.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur les projets de données, dbt est la couche que j\'utilise quand les tables brutes doivent devenir des modèles de reporting fiables. Il sert à préparer les sources sales, bâtir des faits et dimensions, documenter les définitions de métriques et alléger la couche Power BI ou dashboard. La valeur, ce n\'est pas juste du SQL plus propre, c\'est un contrat partagé sur la façon dont les chiffres sont produits.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'dbt is a transformation tool for analytics engineering. It lets you write SQL models, define dependencies between them, test assumptions, document columns, and build a clean semantic layer inside the warehouse. Instead of scattered reporting queries, dbt turns business logic into versioned code that can be reviewed, tested, and deployed.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'dbt est un outil de transformation pour l\'analytique engineering. Il permet d\'écrire des modèles SQL, de définir leurs dépendances, de tester les hypothèses, de documenter les colonnes et de bâtir une couche sémantique propre dans l\'entrepôt. Au lieu d\'avoir des requêtes de rapports éparpillées, dbt transforme la logique d\'affaires en code versionné qui peut être relu, testé et déployé.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use dbt when transformations have become too important to hide in dashboards or one-off scripts. Power BI can shape data, and Python can transform data, but dbt makes SQL transformations reviewable and repeatable in the warehouse itself. That matters when several reports depend on the same definitions and a silent metric drift would cost trust.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise dbt quand les transformations sont devenues trop importantes pour rester cachées dans des dashboards ou des scripts uniques. Power BI peut façonner des données, et Python peut transformer des données, mais dbt rend les transformations SQL relisables et répétables directement dans l\'entrepôt. Ça compte quand plusieurs rapports dépendent des mêmes définitions et qu\'une dérive silencieuse casserait la confiance.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'turns a SQL database into an editor-friendly CMS with APIs and permissions',
			fr: 'transforme une base SQL en CMS utilisable par les éditeurs, avec APIs et permissions',
		},
		icon: {
			iconify_id: 'simple-icons:directus',
			id: 'directus',
			name: 'Directus',
			svg_override: null,
		},
		id: 'directus',
		layer: 'logic',
		name: 'Directus',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Directus is the source of truth for portfolio content, navigation chrome, service copy, project case studies, tech stack entries, and CMS-managed media. The public site does not query it for every visitor. I export the CMS state into generated Svelte modules, commit the cache, and serve it from Vercel edge builds. That keeps authoring flexible while the site stays fast and predictable.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, Directus est la source de vérité pour le contenu du portfolio, le chrome de navigation, la copie des services, les études de cas, les entrées du stack technique et les médias gérés par le CMS. Le site public ne le requête pas pour chaque visiteur. J\'exporte l\'état du CMS en modules Svelte générés, je garde ce cache dans le repo et je le sers depuis les builds Vercel Edge. Ça garde l\'édition flexible pendant que le site reste rapide et prévisible.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Directus is a headless CMS and data platform that sits on top of a SQL database. Instead of forcing content into a fixed blog model, it exposes tables as collections, gives editors a clean admin UI, and gives developers REST and GraphQL APIs for the same data. It works well when the content model is custom: projects, services, labels, page blocks, media, and operational settings all need structure.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Directus est un CMS headless et une plateforme de données par-dessus une base SQL. Au lieu de forcer le contenu dans un modèle de blogue fixe, il expose les tables comme des collections, donne une interface admin propre aux éditeurs et donne aux développeurs des APIs REST et GraphQL pour les mêmes données. Il marche bien quand le modèle de contenu est sur mesure : projets, services, labels, blocs de page, médias et réglages opérationnels ont tous besoin de structure.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Directus here because the data model matters more than a page builder. SvelteKit owns rendering, Directus owns structured content, and the export step gives me reviewable diffs. Compared with hardcoded content, it makes future edits safer. Compared with a generic website CMS, it lets me model real relationships between projects, services, tags, media, and technology.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Directus ici parce que le modèle de données compte plus qu\'un page builder. SvelteKit possède le rendu, Directus possède le contenu structuré et l\'export donne des diffs relisables. Comparé au contenu codé en dur, les changements futurs sont plus sûrs. Comparé à un CMS générique, je peux modéliser les vraies relations entre projets, services, tags, médias et technologies.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'runs Postgres with branching, managed storage, and serverless-friendly connection patterns',
			fr: 'fait rouler Postgres avec branches, stockage géré et connexions adaptées au serverless',
		},
		icon: {
			iconify_id: 'simple-icons:neon',
			id: 'neon',
			name: 'Neon',
			svg_override: null,
		},
		id: 'neon',
		layer: 'data',
		name: 'Neon',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Neon backs the Directus content database. The important part is operational: dev and production can be separated cleanly, content migrations can be tested against a branch, and the application still talks to real Postgres. For a portfolio and CMS system, that gives me production-grade SQL without spending project energy on database hosting chores.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, Neon supporte la base de données de contenu Directus. Le point important est opérationnel : dev et production peuvent être séparés proprement, les migrations de contenu peuvent être testées contre une branche et l\'application parle quand même à du vrai Postgres. Pour un portfolio avec CMS, ça donne du SQL de calibre production sans brûler de l\'énergie sur l\'hébergement de base de données.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Neon is a managed Postgres platform built around serverless infrastructure and database branching. It separates compute from storage, lets environments branch from the same source database, and fits modern preview workflows where each branch may need realistic data without a long-lived database server.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Neon est une plateforme Postgres gérée bâtie autour d\'une infrastructure serverless et du branching de base de données. Elle sépare le compute du stockage, permet aux environnements de brancher à partir de la même base source et fonctionne bien avec les workflows modernes de preview où chaque branche peut avoir besoin de données réalistes sans serveur de base de données permanent.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Neon when I want Postgres semantics with lighter operational overhead. A self-hosted Postgres VM gives maximum control, but it also adds backups, patching, sizing, and monitoring work. Neon is a better fit when the product needs branchable database workflows and the core value is the app and content system, not managing database infrastructure by hand.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Neon quand je veux les garanties de Postgres avec moins de charge opérationnelle. Un VM Postgres autohébergé donne le contrôle maximal, mais il ajoute sauvegardes, mises à jour, sizing et surveillance. Neon est un meilleur choix quand le produit a besoin de workflows branchables et que la valeur est dans l\'app et le système de contenu, pas dans la gestion manuelle de l\'infra database.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'coordinates monorepo tasks so builds, checks, and tests reuse work instead of repeating it',
			fr: 'coordonne les tâches du monorepo pour réutiliser les builds, checks et tests au lieu de tout répéter',
		},
		icon: {
			iconify_id: 'simple-icons:turborepo',
			id: 'turbo',
			name: 'Turbo',
			svg_override: null,
		},
		id: 'turbo',
		layer: 'infra',
		name: 'Turbo',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Turbo coordinates the monorepo that contains the SvelteKit web app, shared schemas, token packages, CMS scripts, and generated content. It makes the repo easier to operate because checks can stay package-aware instead of every command pretending the whole workspace is one flat app.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur yesid.dev, Turbo coordonne le monorepo qui contient l\'app SvelteKit, les schémas partagés, les packages de tokens, les scripts CMS et le contenu généré. Le repo est plus facile à opérer parce que les checks restent conscients des packages au lieu de traiter tout le workspace comme une seule app plate.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Turborepo is a build system for JavaScript and TypeScript monorepos. It understands package dependencies, runs tasks in the right order, caches outputs, and avoids repeating work that has not changed. In a repo with a web app, shared packages, CMS scripts, generated content, and tests, that orchestration keeps local and CI workflows from turning into a slow pile of shell commands.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Turborepo est un système de build pour les monorepos JavaScript et TypeScript. Il comprend les dépendances entre packages, roule les tâches dans le bon ordre, met les sorties en cache et évite de refaire le travail qui n\'a pas changé. Dans un repo avec app web, packages partagés, scripts CMS, contenu généré et tests, cette orchestration évite que le workflow dev devienne juste une pile lente de commandes shell.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Turbo because the repo has real package boundaries. A simple npm script works until every check rebuilds everything and nobody knows which package owns which output. Turbo gives structure without forcing a heavy framework choice. It is enough orchestration to keep the workspace fast, while Bun, SvelteKit, and the CMS scripts keep their own responsibilities.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Turbo parce que le repo a de vraies frontières entre packages. Un simple script npm suffit jusqu\'au moment où chaque check rebâtit tout et où personne ne sait quel package possède quelle sortie. Turbo donne de la structure sans imposer un framework lourd. C\'est assez d\'orchestration pour garder le workspace rapide pendant que Bun, SvelteKit et les scripts CMS gardent leurs responsabilités.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'turns visual direction into inspectable layouts, components, and brand decisions',
			fr: 'transforme la direction visuelle en layouts, composants et décisions de marque qu\'on peut inspecter',
		},
		icon: {
			iconify_id: 'logos:figma',
			id: 'figma',
			name: 'Figma',
			svg_override: null,
		},
		id: 'figma',
		layer: 'interface',
		name: 'Figma',
		relatedProjects: ['cafe-arona'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On client work and portfolio rebuilds, Figma is where I settle visual direction before writing too much UI code. For Cafe Arona, it helps translate brand tone, product photography, menu structure, and mobile storefront decisions into a layout system. For yesid.dev, it is useful for auditing density, hierarchy, and whether the site feels like infrastructure work instead of a generic portfolio template.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur les mandats clients et les reconstructions de portfolio, Figma est l\'endroit où je règle la direction visuelle avant d\'écrire trop de code UI. Pour Cafe Arona, il aide à traduire le ton de marque, les photos de produits, la structure du menu et les décisions mobile en système de layout. Pour yesid.dev, il sert à auditer la densité, la hiérarchie et le sentiment d\'infrastructure au lieu d\'un portfolio générique.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Figma is a collaborative design tool for interface design, brand systems, prototypes, and review flows. Designers and developers can work from the same file, inspect spacing and colors, comment on decisions, and test layout direction before the implementation becomes expensive to change.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Figma est un outil de design collaboratif pour interfaces, systèmes de marque, prototypes et revues. Designers et développeurs peuvent travailler à partir du même fichier, inspecter les espacements et couleurs, commenter les décisions et tester une direction de layout avant que l\'implémentation coûte cher à changer.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Figma when the visual problem needs collaboration or comparison. Jumping straight into code is fine for small UI adjustments, but brand and layout decisions need a place where options can be reviewed quickly. Figma keeps those decisions visible, then the implementation can focus on building the approved system accurately.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Figma quand le problème visuel demande collaboration ou comparaison. Aller directement en code est correct pour de petits ajustements UI, mais les décisions de marque et de layout ont besoin d\'un endroit où les options se relisent vite. Figma garde ces décisions visibles, puis l\'implémentation peut se concentrer sur bâtir le système approuvé correctement.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'renders Shopify storefront templates with product, collection, and theme data',
			fr: 'rend les gabarits Shopify avec les données de produits, collections et thèmes',
		},
		icon: {
			iconify_id: 'vscode-icons:file-type-liquid',
			id: 'liquid',
			name: 'Liquid',
			svg_override: null,
		},
		id: 'liquid',
		layer: 'interface',
		name: 'Liquid',
		relatedProjects: ['cafe-arona'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On Shopify storefront work, Liquid is the bridge between the merchant\'s data and the customer\'s page. It controls product cards, collection pages, navigation, reusable sections, metafield output, and the small pieces of logic that make a storefront feel custom without breaking Shopify\'s hosted commerce model.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Sur une vitrine Shopify, Liquid est le pont entre les données du marchand et la page du client. Il contrôle les cartes de produits, les pages de collection, la navigation, les sections réutilisables, la sortie des metafields et les petits morceaux de logique qui rendent une boutique custom sans casser le modèle commerce hébergé de Shopify.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Liquid is Shopify\'s template language. It mixes HTML with safe placeholders, loops, filters, and conditional logic so a theme can render products, collections, cart state, menus, and merchant-configured sections. It is not a full application language. It is the layer that turns Shopify data and theme settings into storefront pages.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Liquid est le langage de gabarits de Shopify. Il mélange HTML avec des variables sûres, des boucles, des filtres et de la logique conditionnelle pour qu\'un thème puisse rendre les produits, collections, paniers, menus et sections configurées par le marchand. Ce n\'est pas un langage d\'application complet. C\'est la couche qui transforme les données Shopify et les réglages de thème en pages de vitrine.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Liquid when the project should stay inside Shopify\'s theme system. A headless build can make sense, but it adds hosting, API, cart, preview, and editorial complexity. Liquid keeps the storefront close to Shopify\'s admin and lets a small business maintain content without needing a custom deployment for every merchandising change.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Liquid quand le projet doit rester dans le système de thèmes Shopify. Un build headless peut être logique, mais il ajoute hébergement, API, panier, preview et complexité éditoriale. Liquid garde la vitrine proche de l\'admin Shopify et permet à une petite entreprise de maintenir son contenu sans déploiement custom pour chaque changement marchandisage.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'builds internal tools quickly on top of databases, APIs, and approval workflows',
			fr: 'bâtit vite des outils internes par-dessus des bases, APIs et workflows d\'approbation',
		},
		icon: {
			iconify_id: 'simple-icons:retool',
			id: 'retool',
			name: 'Retool',
			svg_override: null,
		},
		id: 'retool',
		layer: 'interface',
		name: 'Retool',
		relatedProjects: [],
		relatedServices: ['analytics-reporting', 'internal-tooling'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'For internal tooling projects, Retool is useful when a team needs a secure operational interface faster than a custom app build. A database table, review queue, CSV import, or exception workflow can become a usable tool for staff without spending weeks on UI plumbing. I still treat permissions, auditability, and query safety as engineering work, not as afterthoughts.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Pour les projets d\'outillage interne, Retool est utile quand une équipe a besoin d\'une interface opérationnelle sécurisée plus vite qu\'une app custom. Une table de base de données, une file de revue, un import CSV ou un workflow d\'exception peut devenir un outil utilisable par le staff sans passer des semaines sur la plomberie UI. Je traite quand même les permissions, l\'auditabilité et la sécurité des requêtes comme du vrai travail d\'ingénierie.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Retool is a low-code platform for internal tools. It connects to databases, APIs, and services, then gives teams a fast way to build admin panels, approval queues, support tools, and operational dashboards. The useful part is not avoiding code completely. The useful part is shipping boring internal workflows quickly while keeping the real business logic in SQL, APIs, or controlled scripts.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Retool est une plateforme low-code pour outils internes. Elle se connecte aux bases de données, APIs et services, puis donne aux équipes une façon rapide de bâtir des panneaux admin, files d\'approbation, outils de support et dashboards opérationnels. Le point utile, ce n\'est pas d\'éviter le code complètement. Le point utile, c\'est de livrer vite des workflows internes plates à maintenir pendant que la vraie logique reste dans SQL, les APIs ou des scripts contrôlés.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use Retool when the user is internal and speed matters more than a bespoke interface. A custom SvelteKit app is better for public products or polished client-facing flows. Retool is better for back-office workflows where the win is replacing spreadsheets, direct database edits, or manual approvals with a controlled interface.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise Retool quand l\'utilisateur est interne et que la vitesse compte plus qu\'une interface sur mesure. Une app SvelteKit custom est meilleure pour les produits publics ou les flows clients polis. Retool est meilleur pour les workflows back-office où le gain est de remplacer les tableurs, les edits directs en base ou les approbations manuelles par une interface contrôlée.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'asks precise questions of structured data and turns operations into measurable answers',
			fr: 'pose des questions précises aux données structurées et transforme les opérations en réponses mesurables',
		},
		icon: {
			iconify_id: 'mdi:database-search',
			id: 'sql',
			name: 'SQL',
			svg_override: null,
		},
		id: 'sql',
		layer: 'data',
		name: 'SQL',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'SQL is the through-line in almost every serious data project I work on. I use it to inspect source systems, design reporting grains, tune slow queries, build extracts, verify migrations, power dashboards, and prove whether an operational claim is true. Even when the application is written in TypeScript or Python, the hard questions usually land back in SQL.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SQL est le fil conducteur dans presque chaque projet de données sérieux que je touche. Je l\'utilise pour inspecter les systèmes sources, définir les grains de reporting, optimiser les requêtes lentes, bâtir des extractions, vérifier des migrations, alimenter des dashboards et prouver si une affirmation opérationnelle est vraie. Même quand l\'application est écrite en TypeScript ou Python, les questions difficiles reviennent souvent à SQL.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SQL is the language for working with relational databases. It lets you define tables, join related records, filter rows, aggregate facts, enforce constraints, and answer business questions directly against structured data. It is both a querying language and a modeling language because good SQL depends on understanding the shape of the data underneath it.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'SQL est le langage pour travailler avec les bases de données relationnelles. Il permet de définir des tables, joindre des enregistrements liés, filtrer des lignes, agréger des faits, imposer des contraintes et répondre directement aux questions d\'affaires sur des données structurées. C\'est à la fois un langage de requête et un langage de modélisation, parce qu\'un bon SQL dépend de la forme des données en dessous.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use SQL directly because it removes guesswork. ORMs, dashboards, and low-code tools are useful, but they can hide the actual query and the actual cost. When performance, correctness, or reporting trust matters, I want to read the joins, predicates, indexes, and grouping logic myself. That is where most data problems become obvious.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise SQL directement parce que ça enlève le flou. Les ORMs, dashboards et outils low-code sont utiles, mais ils peuvent cacher la vraie requête et le vrai coût. Quand la performance, la justesse ou la confiance dans les rapports compte, je veux lire moi-même les joins, prédicats, index et groupements. C\'est là que la plupart des problèmes de données deviennent évidents.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'puts procedural logic beside Postgres data for functions, triggers, and guarded workflows',
			fr: 'place de la logique procédurale près des données Postgres pour fonctions, triggers et workflows gardés',
		},
		icon: {
			iconify_id: 'logos:postgresql',
			id: 'pl-pgsql',
			name: 'PL/pgSQL',
			svg_override: null,
		},
		id: 'pl-pgsql',
		layer: 'data',
		name: 'PL/pgSQL',
		relatedProjects: [],
		relatedServices: ['database-engineering', 'sql-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In Postgres work, PL/pgSQL is useful for database-side automation that should not depend on an application server being awake. I use it for migration helpers, trigger-based audit records, derived fields, data cleanup routines, and guarded operations where the database should enforce the rule itself.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Dans le travail Postgres, PL/pgSQL est utile pour l\'automatisation côté base qui ne doit pas dépendre d\'un serveur applicatif éveillé. Je l\'utilise pour des helpers de migration, des audits par trigger, des champs dérivés, des routines de nettoyage et des opérations gardées où la base doit faire respecter la règle elle-même.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'PL/pgSQL is PostgreSQL\'s procedural language. It lets you write functions, triggers, loops, conditionals, and exception handling inside the database while still using SQL as the core data access language. It is useful when logic needs to live close to the data, especially for validations, audit trails, backfills, and controlled data transformations.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'PL/pgSQL est le langage procédural de PostgreSQL. Il permet d\'écrire des fonctions, triggers, boucles, conditions et gestion d\'exceptions dans la base tout en gardant SQL comme langage principal d\'accès aux données. Il est utile quand la logique doit rester proche des données, surtout pour validations, pistes d\'audit, backfills et transformations contrôlées.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I use PL/pgSQL carefully. Application code is easier to test and deploy for most business logic, but some rules belong at the database boundary because every client must obey them. When the invariant is data-critical, a database function or trigger can be the right place to enforce it. The goal is not to hide an app in the database, it is to protect the data model where it matters.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'J\'utilise PL/pgSQL avec prudence. Le code applicatif est plus facile à tester et déployer pour la plupart de la logique d\'affaires, mais certaines règles appartiennent à la frontière de la base parce que tous les clients doivent les respecter. Quand l\'invariant est critique pour les données, une fonction ou un trigger en base peut être le bon endroit pour l\'imposer. Le but n\'est pas de cacher une app dans la base, c\'est de protéger le modèle de données où ça compte.',
						},
						id: 'p1',
						type: 'paragraph',
					},
				],
				time: 0,
				version: '2.31.2',
			},
		},
	},
];
