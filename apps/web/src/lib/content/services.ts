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
			en: 'Where your business keeps its data, built to stay fast and safe as you grow.',
			fr: 'L\'endroit où ta business garde ses données, bâti pour rester rapide et sécuritaire en grandissant.',
		},
		id: 'database-engineering',
		impactMetric: {
			label: {
				en: 'avg query improvement',
				fr: 'amélioration moyenne des requêtes',
			},
			value: { en: '3x faster', fr: '3x plus vite' },
		},
		relatedProjects: ['transit-data-pipeline', 'yesid-dev'],
		sections: [
			{
				content: {
					en: 'Signs this is you: queries that crawl, reports that time out, a migration you are scared to run, or a database that grew by accident and nobody really designed. Maybe it works today but you hold your breath every time it runs. If any of that sounds familiar, this is the right place to start.',
					fr: 'Des signes que c\'est toi: des requêtes qui traînent, des rapports qui tombent en timeout, une migration qui te fait peur à faire rouler, ou une base de données qui a grossi par accident et que personne a vraiment pensée. Peut-être que ça marche aujourd\'hui, mais tu retiens ton souffle chaque fois que ça roule. Si une de ces affaires-là te parle, t\'es à la bonne place pour commencer.',
				},
				title: { en: 'Is this you?', fr: 'Ça te ressemble?' },
			},
			{
				content: {
					en: 'Database work is never one-size-fits-all: a stubborn query, a database from scratch, a Snowflake build, faster indexes. I start from what you need and dig for the real fix, not a band-aid, but years in I never wing it: backups and a tested rollback before anything touches live data. I love this work, so I guard your data like my own.',
					fr: 'Le travail de base de données, c\'est jamais du mur-à-mur: une requête têtue, une base partie de zéro, un build Snowflake, des index plus rapides. Je pars de ce dont tu as besoin et je creuse pour trouver le vrai fix, pas un plaster, mais avec les années j\'improvise jamais: des sauvegardes et un rollback testé avant que quoi que ce soit touche à tes données en live. J\'aime cette job-là, fait que je protège tes données comme si c\'étaient les miennes.',
				},
				title: { en: 'My Approach', fr: 'Mon approche' },
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'PL/pgSQL', 'T-SQL', 'Alembic'],
		station: 1,
		svg: 'service-database.svg',
		title: { en: 'Databases & SQL', fr: 'Bases de données et SQL' },
		valueProposition: {
			en: 'First stop: your data lives here. A database is the filing cabinet behind your whole business, and everything else is built on top of it. I make yours store and update your data fast and safely, so it stays an asset instead of the thing that slows you down.',
			fr: 'Premier arrêt : tes données vivent ici. Une base de données, c\'est le classeur derrière toute ta business, et tout le reste est bâti par-dessus. Je fais en sorte que la tienne garde et mette à jour tes données vite et de façon sécuritaire, pour qu\'elle reste un atout au lieu de la chose qui te ralentit.',
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
			en: 'Your data travels from where it\'s created to where your team uses it, on its own, every day.',
			fr: 'Tes données voyagent d\'où elles sont créées jusqu\'où ton équipe les utilise, toutes seules, chaque jour.',
		},
		id: 'data-pipeline',
		impactMetric: {
			label: { en: 'migrated', fr: 'migrées' },
			value: { en: '1.5TB+', fr: '1,5 To+' },
		},
		relatedProjects: ['transit-data-pipeline'],
		sections: [
			{
				content: {
					en: 'Signs this is you: someone on your team copies numbers between systems every week, by hand. Your reports are always a day behind. Or your data lives in five different tools that never quite agree with each other. If any of that sounds familiar, this is the work I do.',
					fr: 'Des signes que c\'est toi: quelqu\'un dans ton équipe recopie des chiffres d\'un système à l\'autre chaque semaine, à la main. Tes rapports ont toujours une journée de retard. Ou tes données vivent dans cinq outils différents qui s\'entendent jamais vraiment entre eux. Si une de ces affaires-là te parle, c\'est exactement le genre de travail que je fais.',
				},
				title: { en: 'Is this you?', fr: 'Ça te ressemble?' },
			},
			{
				content: {
					en: 'Moving data can mean a nightly sync, a full warehouse build, or killing one painful copy-paste job. I learn how your data flows, then build a route that\'s boring and reliable on purpose: it retries on its own, alerts me when something\'s off, and recovers cleanly. I enjoy making a messy process quietly run itself, and after years of 3 AM pages, I build it so those calls don\'t come.',
					fr: 'Déplacer des données, ça peut être une synchro à chaque nuit, monter un entrepôt de données au complet, ou tuer une job de copier-coller qui te gosse. Je regarde comment tes données circulent, pis je bâtis un chemin plate et fiable, fait exprès de même: ça réessaye tout seul, ça m\'avertit quand quelque chose cloche, pis ça se replace proprement. J\'aime ça prendre un processus mêlant pis le faire rouler tout seul tranquillement, pis après des années de calls à 3 h du matin, je le bâtis pour que ces appels-là arrivent pas.',
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
			en: 'Next stop: your data moves. Right now someone on your team probably copies numbers between systems by hand every week. I set up a route that carries your data from where it\'s created to where your team uses it on its own, every morning, so the same fresh numbers show up the same way every day.',
			fr: 'Prochain arrêt : tes données bougent. En ce moment, quelqu\'un dans ton équipe recopie probablement des chiffres d\'un système à l\'autre à la main chaque semaine. Je mets en place un trajet qui transporte tes données d\'où elles sont créées jusqu\'où ton équipe les utilise tout seul, chaque matin, pour que les mêmes chiffres frais arrivent de la même façon chaque jour.',
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
			en: 'Your messy numbers turned into clear dashboards your team actually trusts.',
			fr: 'Tes chiffres mélangés transformés en tableaux de bord clairs en qui ton équipe a confiance.',
		},
		id: 'analytics-reporting',
		impactMetric: {
			label: {
				en: 'reporting turnaround',
				fr: 'délai de production des rapports',
			},
			value: { en: '2d → 15m', fr: '2 j → 15 min' },
		},
		relatedProjects: ['transit-data-pipeline', 'cafe-arona'],
		sections: [
			{
				content: {
					en: 'Signs this is you: every meeting turns into an argument about whose number is right. The same report takes someone days to pull together by hand, every time. Or you have dashboards sitting there that nobody opens, because everyone learned they do not match what is really happening.',
					fr: 'Des signes que c\'est toi: chaque réunion vire en chicane sur quel chiffre est le bon. Le même rapport prend des jours à monter à la main, chaque fois. Ou bien tu as des tableaux de bord que personne n\'ouvre, parce que le monde a fini par comprendre qu\'ils collent pas à la réalité.',
				},
				title: { en: 'Is this you?', fr: 'Ça te ressemble?' },
			},
			{
				content: {
					en: 'This ranges from one clean dashboard to a whole reporting setup your team lives in. I\'m curious by default and I love getting this right, so I start with how you actually decide, not the chart, and keep asking until the numbers make sense. Then I check every number against its source, because a dashboard people can\'t trust is worse than none.',
					fr: 'Ça peut aller d\'un seul tableau de bord propre jusqu\'à toute une structure de rapports dans laquelle ton équipe vit au quotidien. Je suis curieux de nature et j\'aime vraiment ça, fait que je commence par comprendre comment tu prends tes décisions, pas par le graphique, pis je continue de poser des questions jusqu\'à ce que les chiffres aient du sens. Ensuite je vérifie chaque chiffre par rapport à sa source, parce qu\'un tableau de bord auquel le monde peut pas se fier, c\'est pire que rien.',
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
			en: 'Third stop: your data starts talking. I take numbers scattered across your tools and turn them into one set of dashboards that all agree with each other. Your team stops arguing about whose number is right and just decides.',
			fr: 'Troisième arrêt : tes données se mettent à parler. Je prends des chiffres éparpillés dans tes outils et j\'en fais une seule série de tableaux de bord qui s\'accordent tous entre eux. Ton équipe arrête de se chicaner sur quel chiffre est le bon et prend ses décisions, point.',
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
			en: 'Fast websites, online stores, and dashboards that put your data in front of people.',
			fr: 'Des sites web, des boutiques en ligne et des tableaux de bord rapides qui mettent tes données devant le monde.',
		},
		id: 'web-development',
		impactMetric: {
			label: {
				en: 'Lighthouse performance',
				fr: 'performance Lighthouse',
			},
			value: { en: '95+', fr: '95+' },
		},
		relatedProjects: ['yesid-dev', 'cafe-arona', 'transit-data-pipeline'],
		sections: [
			{
				content: {
					en: 'Signs this is you: a site that loads slowly or feels clunky to use, a store that keeps losing people right at checkout, or tools and data your customers and team just cannot get to. If the thing standing between your work and the people who need it is the website itself, that is the gap I close.',
					fr: 'Des signes que c\'est toi: un site lent ou maladroit à utiliser, une boutique qui perd du monde juste au moment de payer, ou des outils et des données que tes clients et ton équipe arrivent pas à atteindre. Si ce qui bloque entre ton travail et les gens qui en ont besoin, c\'est le site lui-même, c\'est exactement ce trou-là que je vais combler.',
				},
				title: { en: 'Is this you?', fr: 'Ça te ressemble?' },
			},
			{
				content: {
					en: 'A web project might be a quick storefront, a custom app, or a dashboard wired into your systems. I love figuring out how a thing should work, so I start with who uses it and what they need, then build it fast and simple. And I ship it safely, tested and easy to roll back, so going live never means holding your breath.',
					fr: 'Un projet web, ça peut être une petite boutique, une app sur mesure, ou un tableau de bord branché sur tes systèmes. J\'adore comprendre comment une affaire devrait fonctionner, fait que je commence par qui s\'en sert et ce dont ces gens ont besoin, pis je construis vite et simple. Et je le mets en ligne en toute sécurité, testé et facile à revenir en arrière, pour que le lancement te demande jamais de retenir ton souffle.',
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
			en: 'Last stop on the line: your data reaches people. A fast website, online store, or dashboard takes everything sitting in your systems and shows it to customers and staff the way they\'ll actually use it. Pages load quick, the store takes orders, and your team sees what they need without digging.',
			fr: 'Dernier arrêt sur la ligne : tes données rejoignent le monde. Un site web rapide, une boutique en ligne ou un tableau de bord prend tout ce qui dort dans tes systèmes et le montre à tes clients pis à ton staff de la façon dont ils vont vraiment s\'en servir. Les pages chargent vite, la boutique prend les commandes, pis ton équipe voit ce qu\'il lui faut sans avoir à fouiller.',
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
