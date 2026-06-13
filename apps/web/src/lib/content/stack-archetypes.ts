// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Published stack_archetypes rows (slug, trilingual copy, proof project, service, layered tech links). Feeds the pure client-side Tech Stack Engine on /tech-stack — tech links arrive pre-sorted by (STACK_LAYERS render order, sort) so the blueprint derives its rows from data. NEW in slice-29.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { StackArchetype } from '@repo/shared/schemas';

export const stackArchetypes: StackArchetype[] = [
	{
		description: {
			en: 'That weekly copy-paste ritual becomes a scheduled job with logs, retries and an alert when something needs you.',
			es: 'Ese ritual semanal de copiar y pegar se vuelve una tarea programada con registros, reintentos y alertas.',
			fr: 'Le rituel hebdomadaire de copier-coller devient une tâche planifiée avec journaux, reprises et alertes.',
		},
		hook: {
			en: 'Stop doing it by hand.',
			es: 'Deja de hacerlo a mano.',
			fr: 'Arrêtez de le faire à la main.',
		},
		serviceId: 'data-pipeline',
		slug: 'automated-workflow',
		tech: [
			{ id: 'python', layer: 'logic', sort: 1 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'github-actions', layer: 'infra', sort: 2 },
		],
		title: {
			en: 'An automated workflow',
			es: 'Un flujo automatizado',
			fr: 'Un flux automatisé',
		},
	},
	{
		description: {
			en: 'Live metrics drawn straight from data you own.',
			es: 'Métricas en vivo extraídas de datos que te pertenecen.',
			fr: 'Des métriques en direct issues de données qui vous appartiennent.',
		},
		hook: {
			en: 'See your numbers move.',
			es: 'Mira tus números moverse.',
			fr: 'Voyez vos chiffres bouger.',
		},
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'analytics-reporting',
		slug: 'data-dashboard',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'rest-api', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'docker', layer: 'infra', sort: 4 },
		],
		title: {
			en: 'A data dashboard',
			es: 'Un panel de datos',
			fr: 'Un tableau de bord',
		},
	},
	{
		description: {
			en: 'Raw source feeds ingested, cleaned, and loaded into queryable tables on a schedule.',
			es: 'Flujos crudos ingeridos, limpiados y cargados en tablas consultables, según un calendario.',
			fr: 'Des flux bruts ingérés, nettoyés et chargés dans des tables interrogeables, selon un horaire.',
		},
		hook: {
			en: 'From raw feeds to clean tables.',
			es: 'De flujos crudos a tablas limpias.',
			fr: 'Des flux bruts aux tables propres.',
		},
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'data-pipeline',
		slug: 'data-pipeline',
		tech: [
			{ id: 'python', layer: 'logic', sort: 1 },
			{ id: 'postgresql', layer: 'data', sort: 2 },
			{ id: 'docker', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'A data pipeline',
			es: 'Un pipeline de datos',
			fr: 'Un pipeline de données',
		},
	},
	{
		description: {
			en: 'A data model designed for the business you are becoming, migrations, integrity and room to grow without rewrites.',
			es: 'Un modelo de datos para la empresa que estás construyendo, migraciones, integridad y espacio para crecer.',
			fr: 'Un modèle de données pensé pour l’entreprise que vous devenez, migrations, intégrité et marge de croissance.',
		},
		hook: {
			en: 'Schema today, growth tomorrow.',
			es: 'Esquema hoy, crecimiento mañana.',
			fr: 'Le schéma d’aujourd’hui, la croissance de demain.',
		},
		serviceId: 'database-engineering',
		slug: 'database-that-scales',
		tech: [
			{ id: 'postgresql', layer: 'data', sort: 1 },
			{ id: 'alembic', layer: 'data', sort: 2 },
			{ id: 'docker', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'A database that scales',
			es: 'Una base que escala',
			fr: 'Une base qui grandit',
		},
	},
	{
		description: {
			en: 'Pre-rendered pages served from the edge, with content that stays editable.',
			es: 'Páginas pre-renderizadas servidas desde el borde, con contenido que sigue siendo editable.',
			fr: 'Des pages pré-rendues servies depuis la périphérie, avec du contenu qui reste modifiable.',
		},
		hook: {
			en: 'Static speed, living content.',
			es: 'Velocidad estática, contenido vivo.',
			fr: 'Vitesse statique, contenu vivant.',
		},
		proofProjectSlug: 'yesid-dev',
		serviceId: 'web-development',
		slug: 'fast-website',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'typescript', layer: 'logic', sort: 2 },
			{ id: 'vercel', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'A fast website',
			es: 'Un sitio web rápido',
			fr: 'Un site web rapide',
		},
	},
	{
		description: {
			en: 'Database, pipelines, dashboards and the site that shows it, designed together so every layer feeds the next.',
			es: 'Base de datos, pipelines, paneles y el sitio que los muestra, diseñados juntos para que cada capa alimente la siguiente.',
			fr: 'Base de données, pipelines, tableaux de bord et le site qui les montre, conçus ensemble, chaque couche nourrit la suivante.',
		},
		hook: {
			en: 'Foundation to story, one system.',
			es: 'Del cimiento a la historia, un solo sistema.',
			fr: 'De la fondation au récit, un seul système.',
		},
		serviceId: 'database-engineering',
		slug: 'full-data-backbone',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'python', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'power-bi', layer: 'data', sort: 5 },
			{ id: 'docker', layer: 'infra', sort: 4 },
		],
		title: {
			en: 'The full data backbone',
			es: 'La columna vertebral de datos completa',
			fr: 'La colonne vertébrale data complète',
		},
	},
	{
		description: {
			en: 'When the shared spreadsheet starts breaking, it becomes a small fast app, forms, permissions and a real database.',
			es: 'Cuando la hoja compartida empieza a fallar, se convierte en una app pequeña y rápida, formularios, permisos y base de datos real.',
			fr: 'Quand le tableur partagé craque, il devient une petite app rapide, formulaires, permissions et vraie base de données.',
		},
		hook: {
			en: 'The app your spreadsheet wants to be.',
			es: 'La app que tu hoja de cálculo quiere ser.',
			fr: 'L’app que votre tableur rêve d’être.',
		},
		serviceId: 'web-development',
		slug: 'internal-tool',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'typescript', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
		],
		title: {
			en: 'An internal tool',
			es: 'Una herramienta interna',
			fr: 'Un outil interne',
		},
	},
	{
		description: {
			en: 'A storefront with a database heart, products, content and checkout in one system the owner can run alone.',
			es: 'Una tienda con una base de datos en el corazón, productos, contenido y pago en un solo sistema.',
			fr: 'Une boutique avec une base de données au cœur, produits, contenu et paiement dans un seul système.',
		},
		hook: {
			en: 'Open 24/7, fast everywhere.',
			es: 'Abierta 24/7, rápida en todas partes.',
			fr: 'Ouverte 24/7, rapide partout.',
		},
		proofProjectSlug: 'cafe-arona',
		serviceId: 'web-development',
		slug: 'online-store',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'typescript', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'vercel', layer: 'infra', sort: 4 },
		],
		title: {
			en: 'An online store',
			es: 'Una tienda en línea',
			fr: 'Une boutique en ligne',
		},
	},
	{
		description: {
			en: 'Data flows that monitor their own health, alerts before customers notice, dashboards instead of guesswork.',
			es: 'Flujos de datos que vigilan su propia salud, alertas antes de que los clientes lo noten, paneles en vez de intuición.',
			fr: 'Des flux de données qui surveillent leur propre santé, alertes avant que les clients remarquent, tableaux de bord plutôt qu’intuition.',
		},
		hook: {
			en: 'Pipelines that watch themselves.',
			es: 'Pipelines que se vigilan solos.',
			fr: 'Des pipelines qui se surveillent.',
		},
		serviceId: 'data-pipeline',
		slug: 'ops-autopilot',
		tech: [
			{ id: 'python', layer: 'logic', sort: 1 },
			{ id: 'power-bi', layer: 'data', sort: 4 },
			{ id: 'docker', layer: 'infra', sort: 2 },
			{ id: 'github-actions', layer: 'infra', sort: 3 },
		],
		title: {
			en: 'Ops on autopilot',
			es: 'Operaciones en piloto automático',
			fr: 'Des opérations en pilote automatique',
		},
	},
	{
		description: {
			en: 'The reports you already run, made fast, indexes, query plans and schema fixes on the database you already own.',
			es: 'Tus reportes actuales, pero rápidos, índices, planes de consulta y arreglos de esquema en tu base existente.',
			fr: 'Vos rapports actuels, rendus rapides, index, plans de requête et corrections de schéma sur votre base existante.',
		},
		hook: {
			en: 'Seconds, not minutes.',
			es: 'Segundos, no minutos.',
			fr: 'Des secondes, pas des minutes.',
		},
		proofProjectSlug: 'transit-data-pipeline',
		serviceId: 'database-engineering',
		slug: 'queries-that-fly',
		tech: [
			{ id: 'python', layer: 'logic', sort: 3 },
			{ id: 'postgresql', layer: 'data', sort: 1 },
			{ id: 'sql-server', layer: 'data', sort: 2 },
		],
		title: {
			en: 'Queries that fly',
			es: 'Consultas que vuelan',
			fr: 'Des requêtes qui volent',
		},
	},
	{
		description: {
			en: 'The numbers your team compiles by hand, delivered automatically, same format, zero mornings lost.',
			es: 'Los números que tu equipo compila a mano, entregados automáticamente, mismo formato, cero mañanas perdidas.',
			fr: 'Les chiffres que votre équipe compile à la main, livrés automatiquement, même format, zéro matinée perdue.',
		},
		hook: {
			en: 'Monday numbers, before Monday.',
			es: 'Los números del lunes, antes del lunes.',
			fr: 'Les chiffres du lundi, avant lundi.',
		},
		serviceId: 'analytics-reporting',
		slug: 'report-writes-itself',
		tech: [
			{ id: 'python', layer: 'logic', sort: 3 },
			{ id: 'power-bi', layer: 'data', sort: 1 },
			{ id: 'sql-server', layer: 'data', sort: 2 },
		],
		title: {
			en: 'A report that writes itself',
			es: 'Un reporte que se escribe solo',
			fr: 'Un rapport qui s’écrit seul',
		},
	},
	{
		description: {
			en: 'Your shop and your metrics in one loop, what sells, what stalls, and what to reorder, visible daily.',
			es: 'Tu tienda y tus métricas en un ciclo, qué se vende, qué se estanca y qué reordenar, visible a diario.',
			fr: 'Votre boutique et vos métriques en boucle, ce qui se vend, ce qui stagne, quoi recommander, visible chaque jour.',
		},
		hook: {
			en: 'Commerce with a dashboard heart.',
			es: 'Comercio con un panel en el corazón.',
			fr: 'Le commerce avec un tableau de bord au cœur.',
		},
		serviceId: 'analytics-reporting',
		slug: 'store-knows-numbers',
		tech: [
			{ id: 'sveltekit', layer: 'interface', sort: 1 },
			{ id: 'typescript', layer: 'logic', sort: 2 },
			{ id: 'postgresql', layer: 'data', sort: 3 },
			{ id: 'power-bi', layer: 'data', sort: 4 },
		],
		title: {
			en: 'A store that knows its numbers',
			es: 'Una tienda que conoce sus números',
			fr: 'Une boutique qui connaît ses chiffres',
		},
	},
];
