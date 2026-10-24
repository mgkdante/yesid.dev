// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Services array (id, title, station, deliverables, sections, related projects).
//
// Source: shared fixture or live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated before web consumers.
// Ephemeral output; commit fixture or CMS source changes instead.
// ----------------------------------------------------------------------

import type { Service } from '$lib/types';

export const services: readonly Service[] = [
	{
		benefitHeadline: {
			en: 'Queries that run in seconds, not minutes',
			es: 'Consultas que corren en segundos, no en minutos',
			fr: 'Des requêtes qui roulent en secondes, pas en minutes',
		},
		deliverables: [
			{
				en: 'Query performance audit',
				es: 'Auditoría de consultas lentas',
				fr: 'Audit de performance des requêtes',
			},
			{
				en: 'Optimized stored procedures',
				es: 'Procedimientos almacenados optimizados',
				fr: 'Procédures stockées optimisées',
			},
			{
				en: 'Schema design and normalization review',
				es: 'Revisión del diseño y la normalización del esquema',
				fr: 'Révision de la conception et de la normalisation du schéma',
			},
			{
				en: 'Index optimization strategy',
				es: 'Estrategia de optimización de índices',
				fr: 'Stratégie d\'optimisation des index',
			},
			{
				en: 'Migration scripts with rollback',
				es: 'Scripts de migración con rollback',
				fr: 'Scripts de migration avec retour en arrière',
			},
			{
				en: 'Backup and recovery plan',
				es: 'Plan de respaldo y recuperación',
				fr: 'Plan de sauvegarde et de récupération',
			},
			{
				en: 'Performance benchmarking',
				es: 'Medición de rendimiento',
				fr: 'Mesure de la performance',
			},
			{
				en: 'Documentation, runbooks, and ER diagrams',
				es: 'Documentación, guías de operación y diagramas ER',
				fr: 'Documentation, guides d\'exploitation et diagrammes entité-relation',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'database-engineering',
		impactMetric: {
			label: {
				en: 'database hosting cost',
				es: 'costo de hosting de la base',
				fr: 'coût d\'hébergement',
			},
			value: {
				en: '$60/mo → $0',
				es: '$60/mes → $0',
				fr: '60 $/mois → 0 $',
			},
		},
		relatedProjects: ['transit-data-pipeline', 'yesid-dev'],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		seoDescription: {
			en: 'Freelance PostgreSQL and SQL Server consulting in Montreal: schema design, query tuning, migrations with rollback. Fast and safe as your business grows.',
			es: 'Consultoría freelance PostgreSQL y SQL Server en Montreal: diseño de esquemas, consultas afinadas, migraciones con rollback. Tu base sigue rápida y segura.',
			fr: 'Pigiste PostgreSQL et SQL Server à Montréal : conception de schéma, requêtes optimisées, migrations avec rollback. Ta base reste rapide et sécuritaire.',
		},
		stack: [
			'PostgreSQL',
			'SQL Server',
			'PL/pgSQL',
			'T-SQL',
			'Alembic',
			'Neon',
			'MySQL',
		],
		station: 1,
		svg: 'service-database.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'First stop: your data lives here. A database is the filing cabinet behind your whole business, and everything else is built on top of it. I make yours store and update your data fast and safely, so it stays an asset instead of the thing that slows you down.',
			es: 'Primera parada: tus datos viven aquí. Una base de datos es el archivador detrás de todo tu negocio, y todo lo demás se construye encima. Hago que la tuya guarde y actualice tus datos rápido y de forma segura, para que siga siendo un activo y no la cosa que te frena.',
			fr: 'Premier arrêt : tes données vivent ici. Une base de données, c\'est le classeur derrière toute ta business, et tout le reste est bâti par-dessus. Je fais en sorte que la tienne garde et mette à jour tes données vite et de façon sécuritaire, pour qu\'elle reste un atout au lieu de la chose qui te ralentit.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Your data arrives clean, on time, every morning',
			es: 'Tus datos llegan limpios, a tiempo, cada mañana',
			fr: 'Tes données arrivent propres, à temps, chaque matin',
		},
		deliverables: [
			{
				en: 'Pipeline architecture design',
				es: 'Diseño de arquitectura del pipeline',
				fr: 'Conception de l\'architecture du pipeline',
			},
			{
				en: 'ELT/ETL implementation',
				es: 'Implementación ELT/ETL',
				fr: 'Implémentation ELT/ETL',
			},
			{
				en: 'Orchestration setup (Airflow/cron)',
				es: 'Configuración de orquestación (Airflow/cron)',
				fr: 'Mise en place de l\'orchestration (Airflow/cron)',
			},
			{
				en: 'Schema design and validation',
				es: 'Diseño y validación del esquema',
				fr: 'Conception et validation du schéma',
			},
			{
				en: 'Error handling and alerting',
				es: 'Manejo de errores y alertas',
				fr: 'Gestion des erreurs et alertes',
			},
			{
				en: 'Runbook and monitoring dashboard',
				es: 'Guía de operación y tablero de monitoreo',
				fr: 'Guide d\'exploitation et tableau de bord de surveillance',
			},
			{
				en: 'Workflow automation (approval flows, scheduled jobs)',
				es: 'Automatización de flujos de trabajo (aprobaciones, tareas programadas)',
				fr: 'Automatisation des flux de travail (flux d\'approbation, tâches planifiées)',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'data-pipeline',
		impactMetric: {
			label: { en: 'migrated', es: 'migrados', fr: 'migrées' },
			value: { en: '1.5TB+', es: '1,5 TB+', fr: '1,5 To+' },
		},
		relatedProjects: ['transit-data-pipeline'],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		seoDescription: {
			en: 'Freelance data pipelines and automation in Montreal: Python, Airflow, dbt. Data that travels on its own and lands clean, on time, every morning.',
			es: 'Pipelines de datos y automatización freelance en Montreal: Python, Airflow, dbt. Datos que viajan solos y llegan limpios, a tiempo, cada mañana.',
			fr: 'Pigiste pipelines de données à Montréal : Python, Airflow, dbt. Tes données voyagent toutes seules et arrivent propres, à temps, chaque matin.',
		},
		stack: ['Python', 'dbt', 'Apache Airflow', 'PostgreSQL', 'SSIS'],
		station: 2,
		svg: 'service-pipeline.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'Next stop: your data moves. Right now someone on your team probably copies numbers between systems by hand every week. I set up a route that carries your data from where it\'s created to where your team uses it on its own, every morning, so the same fresh numbers show up the same way every day.',
			es: 'Próxima parada: tus datos se mueven. Ahora mismo alguien en tu equipo seguramente copia números de un sistema a otro a mano cada semana. Yo monto una ruta que lleva tus datos de donde se crean hasta donde tu equipo los usa, sola, cada mañana, para que los mismos números frescos lleguen de la misma forma todos los días.',
			fr: 'Prochain arrêt : tes données bougent. En ce moment, quelqu\'un dans ton équipe recopie probablement des chiffres d\'un système à l\'autre à la main chaque semaine. Je mets en place un trajet qui transporte tes données d\'où elles sont créées jusqu\'où ton équipe les utilise tout seul, chaque matin, pour que les mêmes chiffres frais arrivent de la même façon chaque jour.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Decisions in 15 minutes, not 2 days',
			es: 'Decisiones en 15 minutos, no en 2 días',
			fr: 'Des décisions en 15 minutes, pas en 2 jours',
		},
		deliverables: [
			{
				en: 'Semantic layer / data model design',
				es: 'Diseño de capa semántica / modelo de datos',
				fr: 'Conception de la couche sémantique / du modèle de données',
			},
			{
				en: 'Power BI or Retool dashboards',
				es: 'Tableros de Power BI o Retool',
				fr: 'Tableaux de bord Power BI ou Retool',
			},
			{
				en: 'KPI definition and documentation',
				es: 'Definición y documentación de KPI',
				fr: 'Définition et documentation des KPI',
			},
			{
				en: 'Automated report delivery',
				es: 'Envío automático de reportes',
				fr: 'Livraison automatisée des rapports',
			},
			{
				en: 'User training and onboarding',
				es: 'Capacitación y onboarding de usuarios',
				fr: 'Formation et accompagnement des usagers',
			},
			{
				en: 'Performance tuning for large datasets',
				es: 'Optimización de rendimiento para datos masivos',
				fr: 'Optimisation de la performance pour les grands jeux de données',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'analytics-reporting',
		impactMetric: {
			label: {
				en: 'live data refresh',
				es: 'refresh en vivo',
				fr: 'rafraîchissement en direct',
			},
			value: { en: '30s', es: '30 s', fr: '30 s' },
		},
		relatedProjects: ['transit-data-pipeline', 'cafe-arona'],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		seoDescription: {
			en: 'Freelance Power BI dashboards and analytics in Montreal: KPIs, semantic layers, reports your team trusts. Decisions in 15 minutes, not 2 days.',
			es: 'Tableros Power BI y analítica freelance en Montreal: KPIs, capas semánticas, reportes en los que tu equipo confía. Decisiones en 15 minutos, no en 2 días.',
			fr: 'Pigiste Power BI et analytique à Montréal : KPI, couche sémantique, tableaux de bord fiables. Ton équipe décide en 15 minutes, pas en 2 jours.',
		},
		stack: ['Power BI', 'Retool', 'DAX', 'SQL', 'SSRS'],
		station: 3,
		svg: 'service-reporting.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'Third stop: your data starts talking. I take numbers scattered across your tools and turn them into one set of dashboards that all agree with each other. Your team stops arguing about whose number is right and just decides.',
			es: 'Tercera parada: tus datos empiezan a hablar. Tomo los números regados por todas tus herramientas y los convierto en un solo juego de tableros que cuadran entre sí. Tu equipo deja de pelear por cuál número es el bueno y simplemente decide.',
			fr: 'Troisième arrêt : tes données se mettent à parler. Je prends des chiffres éparpillés dans tes outils et j\'en fais une seule série de tableaux de bord qui s\'accordent tous entre eux. Ton équipe arrête de se chicaner sur quel chiffre est le bon et prend ses décisions, point.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'A storefront as fast as the systems behind it',
			es: 'Una vitrina tan rápida como los sistemas detrás',
			fr: 'Une vitrine aussi rapide que les systèmes derrière',
		},
		deliverables: [
			{
				en: 'Full-stack SvelteKit application',
				es: 'Aplicación SvelteKit full-stack',
				fr: 'Application SvelteKit pleine pile',
			},
			{
				en: 'Responsive design implementation',
				es: 'Implementación de diseño responsive',
				fr: 'Mise en place d\'un design adaptatif',
			},
			{
				en: 'API integration and data layer',
				es: 'Integración de API y capa de datos',
				fr: 'Intégration API et couche de données',
			},
			{
				en: 'Authentication and authorization',
				es: 'Autenticación y autorización',
				fr: 'Authentification et autorisation',
			},
			{
				en: 'Deployment and CI/CD setup',
				es: 'Despliegue y configuración CI/CD',
				fr: 'Déploiement et configuration CI/CD',
			},
			{
				en: 'Performance optimization',
				es: 'Optimización de rendimiento',
				fr: 'Optimisation de la performance',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'web-development',
		impactMetric: {
			label: {
				en: 'Lighthouse performance',
				es: 'rendimiento Lighthouse',
				fr: 'performance Lighthouse',
			},
			value: { en: '95+', es: '95+', fr: '95+' },
		},
		relatedProjects: [
			'yesid-dev',
			'cafe-arona',
			'transit-data-pipeline',
			'yesid-dev-design',
		],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		seoDescription: {
			en: 'Freelance web development in Montreal: SvelteKit sites, Shopify stores, live dashboards. Fast pages that put your data in front of people.',
			es: 'Desarrollo web freelance en Montreal: sitios SvelteKit, tiendas Shopify, tableros en vivo. Páginas rápidas que ponen tus datos frente a la gente.',
			fr: 'Pigiste web à Montréal : sites SvelteKit, boutiques Shopify, tableaux de bord rapides. Tes données et tes produits rejoignent le monde.',
		},
		stack: [
			'SvelteKit',
			'TypeScript',
			'Tailwind CSS',
			'Shopify',
			'Vercel',
			'Svelte 5',
			'GSAP',
			'Directus',
			'Bun',
			'Turbo',
			'Figma',
			'Liquid',
			'React',
			'Three.js / Threlte',
		],
		station: 4,
		svg: 'service-web.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'Last stop on the line: your data reaches people. A fast website, online store, or dashboard takes everything sitting in your systems and shows it to customers and staff the way they\'ll actually use it. Pages load quick, the store takes orders, and your team sees what they need without digging.',
			es: 'Última parada de la línea: tus datos llegan a la gente. Un sitio web rápido, una tienda en línea o un tablero toma todo lo que duerme en tus sistemas y se lo muestra a tus clientes y a tu equipo tal como lo van a usar de verdad. Las páginas cargan rápido, la tienda recibe pedidos y tu equipo ve lo que necesita sin ponerse a escarbar.',
			fr: 'Dernier arrêt sur la ligne : tes données rejoignent le monde. Un site web rapide, une boutique en ligne ou un tableau de bord prend tout ce qui dort dans tes systèmes et le montre à tes clients pis à ton staff de la façon dont ils vont vraiment s\'en servir. Les pages chargent vite, la boutique prend les commandes, pis ton équipe voit ce qu\'il lui faut sans avoir à fouiller.',
		},
		visible: true,
	},
	{
		benefitHeadline: {
			en: 'Queries that run in seconds, not minutes',
			es: 'Consultas que corren en segundos, no en minutos',
			fr: 'Des requêtes qui roulent en secondes, pas en minutes',
		},
		deliverables: [
			{
				en: 'Query performance audit',
				es: 'Auditoría de consultas lentas',
				fr: 'Audit de performance des requêtes',
			},
			{
				en: 'Optimized stored procedures',
				es: 'Procedimientos almacenados optimizados',
				fr: 'Procédures stockées optimisées',
			},
			{
				en: 'Index optimization strategy',
				es: 'Estrategia de optimización de índices',
				fr: 'Stratégie d\'optimisation des index',
			},
			{
				en: 'Schema refactoring plan',
				es: 'Plan de rediseño del esquema',
				fr: 'Plan de refonte du schéma',
			},
			{
				en: 'Migration scripts with rollback',
				es: 'Scripts de migración con rollback',
				fr: 'Scripts de migration avec retour en arrière',
			},
			{
				en: 'Documentation and runbook',
				es: 'Documentación y guía de operación',
				fr: 'Documentation et guide d\'exploitation',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'sql-development',
		impactMetric: {
			label: {
				en: 'avg query improvement',
				es: 'mejora promedio por consulta',
				fr: 'amélioration moyenne des requêtes',
			},
			value: { en: '3x faster', es: '3x más veloz', fr: '3x plus vite' },
		},
		relatedProjects: [],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		stack: ['PostgreSQL', 'SQL Server', 'T-SQL', 'PL/pgSQL'],
		station: 5,
		subtitle: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		svg: 'service-sql.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'Slow queries cost money, in compute, in delayed reports, in frustrated analysts waiting for data. I audit your SQL layer, identify the expensive queries, and rewrite them for speed and clarity. You get faster dashboards, lower database costs, and code your team can actually maintain.',
			es: 'Las consultas lentas cuestan plata: en cómputo, en reportes que se atrasan, en analistas frustrados esperando sus datos. Reviso tu capa SQL, encuentro las consultas costosas y las reescribo para que queden rápidas y claras. Obtienes tableros más rápidos, costos de base de datos más bajos y código que tu equipo de verdad puede mantener.',
			fr: 'Les requêtes lentes coûtent cher : en temps de calcul, en rapports qui retardent, en analystes frustrés qui attendent leurs données. J\'examine ta couche SQL, je repère les requêtes qui coûtent cher et je les réécris pour la vitesse et la clarté. Tu obtiens des tableaux de bord plus rapides, des coûts de base de données plus bas, et du code que ton équipe peut vraiment entretenir.',
		},
		visible: false,
	},
	{
		benefitHeadline: {
			en: 'Your team stops copying between spreadsheets',
			es: 'Tu equipo deja de copiar entre hojas de cálculo',
			fr: 'Ton équipe arrête de copier d\'un tableur à l\'autre',
		},
		deliverables: [
			{
				en: 'Requirements and workflow mapping',
				es: 'Mapeo de necesidades y flujos de trabajo',
				fr: 'Cartographie des besoins et des flux de travail',
			},
			{
				en: 'Retool or custom admin panel',
				es: 'Panel de admin en Retool o a la medida',
				fr: 'Panneau d\'administration Retool ou sur mesure',
			},
			{
				en: 'API integration layer',
				es: 'Capa de integración de API',
				fr: 'Couche d\'intégration API',
			},
			{
				en: 'Role-based access control',
				es: 'Control de acceso por roles',
				fr: 'Contrôle d\'accès par rôle',
			},
			{
				en: 'User onboarding documentation',
				es: 'Documentación de onboarding de usuarios',
				fr: 'Documentation d\'accueil des utilisateurs',
			},
			{
				en: 'Maintenance and extension guide',
				es: 'Guía de mantenimiento y extensión',
				fr: 'Guide d\'entretien et d\'extension',
			},
		],
		description: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		id: 'internal-tooling',
		impactMetric: {
			label: {
				en: 'less manual data entry',
				es: 'menos digitación manual',
				fr: 'de saisie manuelle en moins',
			},
			value: { en: '80%', es: '80%', fr: '80 %' },
		},
		relatedProjects: [],
		sections: [
			{
				content: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
				title: {
					en: 'Fixture copy.',
					es: 'Fixture copy.',
					fr: 'Fixture copy.',
				},
			},
		],
		stack: ['Retool', 'PostgreSQL', 'REST API', 'Node.js'],
		station: 6,
		svg: 'service-tooling.svg',
		title: {
			en: 'Fixture copy.',
			es: 'Fixture copy.',
			fr: 'Fixture copy.',
		},
		valueProposition: {
			en: 'Your ops team is copying data between spreadsheets and Slack threads. I build internal tools, admin panels, approval workflows, data entry forms, that centralize operations and eliminate manual work. You ship faster because your team spends time on decisions, not data entry.',
			es: 'Tu equipo de operaciones anda copiando datos entre hojas de cálculo e hilos de Slack. Construyo herramientas internas, paneles de administración, flujos de aprobación, formularios de captura, que centralizan las operaciones y eliminan el trabajo manual. Entregas más rápido porque tu equipo dedica su tiempo a decidir, no a digitar datos.',
			fr: 'Ton équipe des opérations copie des données entre des tableurs et des fils Slack. Je bâtis des outils internes, des panneaux d\'administration, des flux d\'approbation, des formulaires de saisie, qui centralisent les opérations et éliminent le travail manuel. Tu livres plus vite parce que ton équipe passe son temps sur les décisions, pas sur la saisie de données.',
		},
		visible: false,
	},
];
