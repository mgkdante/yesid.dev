// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Services array (id, title, station, deliverables, sections, related projects). Chrome + helpers live in services.companion.ts.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { Service } from '$lib/types';

export const services: readonly Service[] = [
	{
		benefitHeadline: {
			en: 'Queries that run in seconds, not minutes',
			fr: 'Des requêtes qui roulent en secondes, pas en minutes',
		},
		deliverables: [
			{
				en: 'Query performance audit',
				fr: 'Audit de performance des requêtes',
			},
			{
				en: 'Optimized stored procedures',
				fr: 'Procédures stockées optimisées',
			},
			{
				en: 'Schema design and normalization review',
				fr: 'Révision de la conception et de la normalisation du schéma',
			},
			{
				en: 'Index optimization strategy',
				fr: 'Stratégie d\'optimisation des index',
			},
			{
				en: 'Migration scripts with rollback',
				fr: 'Scripts de migration avec retour en arrière',
			},
			{
				en: 'Backup and recovery plan',
				fr: 'Plan de sauvegarde et de récupération',
			},
			{
				en: 'Performance benchmarking',
				fr: 'Mesure de la performance',
			},
			{
				en: 'Documentation, runbooks, and ER diagrams',
				fr: 'Documentation, guides d\'exploitation et diagrammes entité-relation',
			},
		],
		description: {
			en: 'Schemas, queries, and migrations, a database that stays fast as your data grows.',
			fr: 'Schémas, requêtes et migrations : une base de données qui reste rapide à mesure que tes données grossissent.',
		},
		id: 'database-engineering',
		impactMetric: {
			label: {
				en: 'avg query improvement',
				fr: 'amélioration moyenne des requêtes',
			},
			value: { en: '3x faster', fr: '3x plus vite' },
		},
		relatedProjects: [
			'transit-data-pipeline',
			'lorem-database-migration',
			'lorem-query-optimizer',
		],
		sections: [
			{
				content: {
					en: 'I start with your slowest queries, execution plans and profiling find the root cause (missing indexes, implicit conversions, parameter sniffing), and fix them systematically. Database changes are infrastructure changes: every migration gets a rollback script, and every schema change is benchmarked against production-scale data before deployment.',
					fr: 'Je commence par tes requêtes les plus lentes : les plans d\'exécution et le profilage trouvent la cause profonde (index manquants, conversions implicites, parameter sniffing), et je la corrige méthodiquement. Un changement de base de données, c\'est un changement d\'infrastructure : chaque migration reçoit un script de retour en arrière, et chaque changement de schéma est mesuré sur des données à l\'échelle de la production avant le déploiement.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'PL/pgSQL', 'T-SQL', 'Alembic'],
		station: 1,
		svg: 'service-database.svg',
		title: { en: 'Databases & SQL', fr: 'Bases de données et SQL' },
		valueProposition: {
			en: 'Slow queries and risky migrations are the same problem: a database nobody engineered. I audit the SQL layer, rewrite the expensive queries, design schemas that scale, and run migrations with rollback plans, 500GB+ moved safely so far. Faster dashboards, lower database costs, a database that\'s an asset, not a liability.',
			fr: 'Des requêtes lentes et des migrations risquées, c\'est le même problème : une base de données que personne n\'a vraiment conçue. J\'examine la couche SQL, je réécris les requêtes qui coûtent cher, je conçois des schémas qui montent en charge, et je fais les migrations avec des plans de retour en arrière : plus de 500 Go déplacés en toute sécurité jusqu\'ici. Des tableaux de bord plus rapides, des coûts de base de données plus bas, une base de données qui est un atout, pas un fardeau.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Your data arrives clean, on time, every morning',
			fr: 'Tes données arrivent propres, à temps, chaque matin',
		},
		deliverables: [
			{
				en: 'Pipeline architecture design',
				fr: 'Conception de l\'architecture du pipeline',
			},
			{
				en: 'ELT/ETL implementation',
				fr: 'Implémentation ELT/ETL',
			},
			{
				en: 'Orchestration setup (Airflow/cron)',
				fr: 'Mise en place de l\'orchestration (Airflow/cron)',
			},
			{
				en: 'Schema design and validation',
				fr: 'Conception et validation du schéma',
			},
			{
				en: 'Error handling and alerting',
				fr: 'Gestion des erreurs et alertes',
			},
			{
				en: 'Runbook and monitoring dashboard',
				fr: 'Guide d\'exploitation et tableau de bord de surveillance',
			},
			{
				en: 'Workflow automation (approval flows, scheduled jobs)',
				fr: 'Automatisation des flux de travail (flux d\'approbation, tâches planifiées)',
			},
		],
		description: {
			en: 'Data moves from source to warehouse on schedule, and the manual copy-paste work goes away.',
			fr: 'Les données passent de la source à l\'entrepôt selon l\'horaire, et le copier-coller manuel disparaît.',
		},
		id: 'data-pipeline',
		impactMetric: {
			label: { en: 'missed mornings', fr: 'matin manqué' },
			value: { en: '0', fr: '0' },
		},
		relatedProjects: ['transit-data-pipeline', 'lorem-retool-admin'],
		sections: [
			{
				content: {
					en: 'I design pipelines that are boring in the best way, predictable, observable, and easy to debug at 3 AM. Every pipeline gets idempotent loads, schema contracts, and clear logging. I prefer dbt for transformation logic because it makes SQL testable and version-controlled.',
					fr: 'Je conçois des pipelines plats dans le bon sens du terme : prévisibles, observables et faciles à déboguer à 3 h du matin. Chaque pipeline reçoit des chargements idempotents, des contrats de schéma et une journalisation claire. Je préfère dbt pour la logique de transformation, parce que ça rend le SQL testable et versionné.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['Python', 'dbt', 'Apache Airflow', 'PostgreSQL'],
		station: 2,
		svg: 'service-pipeline.svg',
		title: {
			en: 'Pipelines & Automation',
			fr: 'Pipelines et automatisation',
		},
		valueProposition: {
			en: 'Data stuck in silos is data nobody can use, and an ops team copying between spreadsheets is the symptom. I build pipelines and workflow automation that move information from source systems to your warehouse reliably, with logging, retry logic, and schema validation. Your analysts get clean, fresh data every morning; your team stops doing data entry.',
			fr: 'Des données coincées dans des silos, c\'est des données que personne ne peut utiliser, et une équipe des opérations qui copie d\'un tableur à l\'autre, c\'est le symptôme. Je bâtis des pipelines et de l\'automatisation de flux de travail qui transportent l\'information des systèmes sources vers ton entrepôt de façon fiable, avec journalisation, logique de reprise et validation de schéma. Tes analystes ont des données propres et fraîches chaque matin; ton équipe arrête de faire de la saisie de données.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Decisions in 15 minutes, not 2 days',
			fr: 'Des décisions en 15 minutes, pas en 2 jours',
		},
		deliverables: [
			{
				en: 'Semantic layer / data model design',
				fr: 'Conception de la couche sémantique / du modèle de données',
			},
			{
				en: 'Power BI or Retool dashboards',
				fr: 'Tableaux de bord Power BI ou Retool',
			},
			{
				en: 'KPI definition and documentation',
				fr: 'Définition et documentation des KPI',
			},
			{
				en: 'Automated report delivery',
				fr: 'Livraison automatisée des rapports',
			},
			{
				en: 'User training and onboarding',
				fr: 'Formation et accompagnement des usagers',
			},
			{
				en: 'Performance tuning for large datasets',
				fr: 'Optimisation de la performance pour les grands jeux de données',
			},
		],
		description: {
			en: 'One semantic layer, numbers that match in every report, dashboards your team trusts.',
			fr: 'Une seule couche sémantique, des chiffres qui concordent dans tous les rapports, des tableaux de bord auxquels ton équipe fait confiance.',
		},
		id: 'analytics-reporting',
		impactMetric: {
			label: {
				en: 'reporting turnaround',
				fr: 'délai de production des rapports',
			},
			value: { en: '2d → 15m', fr: '2 j → 15 min' },
		},
		relatedProjects: ['lorem-analytics-dashboard', 'lorem-retool-admin'],
		sections: [
			{
				content: {
					en: 'I start by understanding how your team makes decisions, what questions they ask, how often, and what data they trust. Then I build a semantic layer that makes those questions easy to answer. The dashboard is the last step, not the first.',
					fr: 'Je commence par comprendre comment ton équipe prend ses décisions : quelles questions elle se pose, à quelle fréquence, et à quelles données elle fait confiance. Ensuite, je bâtis une couche sémantique qui rend les réponses à ces questions faciles à trouver. Le tableau de bord, c\'est la dernière étape, pas la première.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['Power BI', 'Retool', 'DAX', 'SQL'],
		station: 3,
		svg: 'service-reporting.svg',
		title: {
			en: 'Dashboards & Analytics',
			fr: 'Tableaux de bord et analytique',
		},
		valueProposition: {
			en: 'A dashboard nobody trusts is worse than no dashboard. I build reporting systems grounded in a clean semantic layer, so the numbers match across reports, filters work intuitively, and your team stops second-guessing the data. You get dashboards that drive decisions, not confusion.',
			fr: 'Un tableau de bord auquel personne ne fait confiance, c\'est pire que pas de tableau de bord pantoute. Je bâtis des systèmes de rapports ancrés dans une couche sémantique propre, pour que les chiffres concordent d\'un rapport à l\'autre, que les filtres marchent de façon intuitive, et que ton équipe arrête de douter des données. Tu obtiens des tableaux de bord qui guident les décisions, pas qui sèment la confusion.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'A storefront as fast as the systems behind it',
			fr: 'Une vitrine aussi rapide que les systèmes derrière',
		},
		deliverables: [
			{
				en: 'Full-stack SvelteKit application',
				fr: 'Application SvelteKit pleine pile',
			},
			{
				en: 'Responsive design implementation',
				fr: 'Mise en place d\'un design adaptatif',
			},
			{
				en: 'API integration and data layer',
				fr: 'Intégration API et couche de données',
			},
			{
				en: 'Authentication and authorization',
				fr: 'Authentification et autorisation',
			},
			{
				en: 'Deployment and CI/CD setup',
				fr: 'Déploiement et configuration CI/CD',
			},
			{
				en: 'Performance optimization',
				fr: 'Optimisation de la performance',
			},
		],
		description: {
			en: 'Fast sites and stores wired to your data, storefront to back office.',
			fr: 'Des sites et des boutiques rapides, branchés sur tes données, de la vitrine jusqu\'à l\'arrière-boutique.',
		},
		id: 'web-development',
		impactMetric: {
			label: {
				en: 'Lighthouse performance',
				fr: 'performance Lighthouse',
			},
			value: { en: '95+', fr: '95+' },
		},
		relatedProjects: ['yesid-dev', 'cafe-arona'],
		sections: [
			{
				content: {
					en: 'I build with SvelteKit because it compiles away the framework, you get fast pages with minimal JavaScript. Every component is typed, every page is server-rendered for SEO, and the data layer connects cleanly to your backend. I deploy to Vercel for zero-config CI/CD and edge caching.',
					fr: 'Je bâtis avec SvelteKit parce que ça compile et fait disparaître le cadriciel : tu obtiens des pages rapides avec un minimum de JavaScript. Chaque composant est typé, chaque page est rendue côté serveur pour le référencement, et la couche de données se connecte proprement à ton backend. Je déploie sur Vercel pour du CI/CD sans configuration et de la mise en cache en périphérie.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: [
			'SvelteKit',
			'TypeScript',
			'Tailwind CSS',
			'Shopify',
			'Vercel',
		],
		station: 4,
		svg: 'service-web.svg',
		title: {
			en: 'Websites & E-commerce',
			fr: 'Sites web et commerce en ligne',
		},
		valueProposition: {
			en: 'Your digital infrastructure deserves a frontend that matches. I build web applications that connect directly to your data layer, client portals, internal dashboards, public-facing tools, with the same attention to performance and reliability I bring to the backend.',
			fr: 'Ton infrastructure numérique mérite un frontend à sa hauteur. Je bâtis des applications web qui se branchent directement sur ta couche de données : portails clients, tableaux de bord internes, outils accessibles au public, avec le même souci de performance et de fiabilité que j\'apporte au backend.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Queries that run in seconds, not minutes',
			fr: 'Des requêtes qui roulent en secondes, pas en minutes',
		},
		deliverables: [
			{
				en: 'Query performance audit',
				fr: 'Audit de performance des requêtes',
			},
			{
				en: 'Optimized stored procedures',
				fr: 'Procédures stockées optimisées',
			},
			{
				en: 'Index optimization strategy',
				fr: 'Stratégie d\'optimisation des index',
			},
			{
				en: 'Schema refactoring plan',
				fr: 'Plan de refonte du schéma',
			},
			{
				en: 'Migration scripts with rollback',
				fr: 'Scripts de migration avec retour en arrière',
			},
			{
				en: 'Documentation and runbook',
				fr: 'Documentation et guide d\'exploitation',
			},
		],
		description: {
			en: 'Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.',
			fr: 'J\'écris, je refais et j\'ajuste les requêtes SQL sur PostgreSQL et SQL Server. Des requêtes de rapports complexes jusqu\'aux procédures stockées, bâties pour être justes et performantes.',
		},
		id: 'sql-development',
		impactMetric: {
			label: {
				en: 'avg query improvement',
				fr: 'amélioration moyenne des requêtes',
			},
			value: { en: '3x faster', fr: '3x plus vite' },
		},
		relatedProjects: [],
		sections: [
			{
				content: {
					en: 'I start with your slowest queries, the ones that block dashboards and frustrate users. Using execution plans and profiling tools, I identify the root cause (missing indexes, implicit conversions, parameter sniffing) and fix them systematically. Every change is tested against production-scale data before deployment.',
					fr: 'Je commence par tes requêtes les plus lentes, celles qui bloquent les tableaux de bord et qui font enrager les usagers. À l\'aide des plans d\'exécution et des outils de profilage, je trouve la cause profonde (index manquants, conversions implicites, parameter sniffing) et je la corrige méthodiquement. Chaque changement est testé sur des données à l\'échelle de la production avant le déploiement.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'T-SQL', 'PL/pgSQL'],
		station: 5,
		subtitle: { en: '& Optimization', fr: 'et optimisation' },
		svg: 'service-sql.svg',
		title: {
			en: 'SQL Development & Optimization',
			fr: 'Développement et optimisation SQL',
		},
		valueProposition: {
			en: 'Slow queries cost money, in compute, in delayed reports, in frustrated analysts waiting for data. I audit your SQL layer, identify the expensive queries, and rewrite them for speed and clarity. You get faster dashboards, lower database costs, and code your team can actually maintain.',
			fr: 'Les requêtes lentes coûtent cher : en temps de calcul, en rapports qui retardent, en analystes frustrés qui attendent leurs données. J\'examine ta couche SQL, je repère les requêtes qui coûtent cher et je les réécris pour la vitesse et la clarté. Tu obtiens des tableaux de bord plus rapides, des coûts de base de données plus bas, et du code que ton équipe peut vraiment entretenir.',
		},
		visible: false,
	},
	{
		benefitHeadline: {
			en: 'Your team stops copying between spreadsheets',
			fr: 'Ton équipe arrête de copier d\'un tableur à l\'autre',
		},
		deliverables: [
			{
				en: 'Requirements and workflow mapping',
				fr: 'Cartographie des besoins et des flux de travail',
			},
			{
				en: 'Retool or custom admin panel',
				fr: 'Panneau d\'administration Retool ou sur mesure',
			},
			{
				en: 'API integration layer',
				fr: 'Couche d\'intégration API',
			},
			{
				en: 'Role-based access control',
				fr: 'Contrôle d\'accès par rôle',
			},
			{
				en: 'User onboarding documentation',
				fr: 'Documentation d\'accueil des utilisateurs',
			},
			{
				en: 'Maintenance and extension guide',
				fr: 'Guide d\'entretien et d\'extension',
			},
		],
		description: {
			en: 'Build admin panels and workflow tools that replace spreadsheets. Retool, custom dashboards, and approval systems designed for operations teams.',
			fr: 'Je bâtis des panneaux d\'administration et des outils de flux de travail qui remplacent les tableurs. Retool, tableaux de bord sur mesure et systèmes d\'approbation conçus pour les équipes des opérations.',
		},
		id: 'internal-tooling',
		impactMetric: {
			label: {
				en: 'less manual data entry',
				fr: 'de saisie manuelle en moins',
			},
			value: { en: '80%', fr: '80 %' },
		},
		relatedProjects: [],
		sections: [
			{
				content: {
					en: 'I start by shadowing the workflow, watching how data moves through your team. Then I build the simplest tool that eliminates the bottleneck. Retool for rapid prototyping, custom code when Retool hits its limits. Every tool ships with docs so your team can extend it without me.',
					fr: 'Je commence par observer le flux de travail de près, en regardant comment les données circulent dans ton équipe. Ensuite, je bâtis l\'outil le plus simple qui élimine le goulot d\'étranglement. Retool pour le prototypage rapide, du code sur mesure quand Retool atteint ses limites. Chaque outil arrive avec sa documentation pour que ton équipe puisse l\'étendre sans moi.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		station: 6,
		svg: 'service-tooling.svg',
		title: { en: 'Internal Tooling', fr: 'Outils internes' },
		valueProposition: {
			en: 'Your ops team is copying data between spreadsheets and Slack threads. I build internal tools, admin panels, approval workflows, data entry forms, that centralize operations and eliminate manual work. You ship faster because your team spends time on decisions, not data entry.',
			fr: 'Ton équipe des opérations copie des données entre des tableurs et des fils Slack. Je bâtis des outils internes, des panneaux d\'administration, des flux d\'approbation, des formulaires de saisie, qui centralisent les opérations et éliminent le travail manuel. Tu livres plus vite parce que ton équipe passe son temps sur les décisions, pas sur la saisie de données.',
		},
		visible: false,
	},
];

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'services'.
export * from './services.companion';
