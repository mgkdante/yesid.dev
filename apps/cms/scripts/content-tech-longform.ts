/**
 * content-tech-longform.ts
 *
 * Adds EN and FR longform copy for normalized tech rows that were still blank.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to execute.
 */

import { createItem, readItems, updateItem } from '@directus/sdk';
import type { BlockEditorDoc } from '@repo/shared';
import { assertDevCms, createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

type Locale = 'en' | 'fr';

interface LongformCopy {
	enables: string;
	what_it_is: string;
	what_i_use_it_for: string;
	why_i_use_it_instead: string;
}

interface TechLongformTarget {
	id: string;
	en: LongformCopy;
	fr: LongformCopy;
}

export const TECH_LONGFORM_TARGETS: readonly TechLongformTarget[] = [
	{
		id: 'shopify',
		en: {
			enables: 'runs product catalogs, checkout, payments, and order operations in one hosted commerce system',
			what_it_is: `Shopify is a hosted commerce platform for running online stores. It gives a business the product catalog, checkout, payment processing, order management, customer accounts, discount rules, taxes, and admin workflows in one system. Developers extend it through themes, Liquid templates, apps, webhooks, and APIs instead of rebuilding commerce primitives from scratch.`,
			what_i_use_it_for: `On Cafe Arona, Shopify is the commerce backbone behind the public storefront. It owns product data, checkout, payment flow, order handling, and the operational admin that a small business actually needs day to day. The web layer can focus on brand, content, and conversion while Shopify handles the parts of commerce where reliability and trust matter most.`,
			why_i_use_it_instead: `I use Shopify when the client needs to sell reliably more than they need a custom commerce experiment. A custom checkout sounds flexible, but it creates payment, tax, fraud, inventory, and support risk fast. Shopify gives the business a proven operational base, then I can spend the project budget on the storefront, content model, analytics, and the parts that actually differentiate the brand.`,
		},
		fr: {
			enables: 'fait rouler le catalogue, le paiement, les commandes et les opérations dans une seule plateforme commerce',
			what_it_is: `Shopify est une plateforme commerce hébergée pour faire rouler une boutique en ligne. Elle donne le catalogue de produits, le paiement, la gestion des commandes, les comptes clients, les rabais, les taxes et les flux admin dans un seul système. Les développeurs l'étendent avec des thèmes, des gabarits Liquid, des apps, des webhooks et des APIs au lieu de rebâtir le commerce à partir de zéro.`,
			what_i_use_it_for: `Sur Cafe Arona, Shopify est la colonne vertébrale commerce derrière la vitrine publique. Il garde les produits, le paiement, les commandes et l'admin opérationnel dont une petite entreprise a besoin tous les jours. La couche web peut se concentrer sur la marque, le contenu et la conversion pendant que Shopify gère les morceaux où la fiabilité compte vraiment.`,
			why_i_use_it_instead: `J'utilise Shopify quand le client doit vendre de façon fiable plus qu'il a besoin d'une expérience commerce sur mesure. Un paiement custom a l'air flexible, mais ça amène vite des risques de paiement, taxes, fraude, inventaire et support. Shopify donne une base opérationnelle solide, puis le budget peut aller sur la vitrine, le modèle de contenu, l'analytique et ce qui distingue vraiment la marque.`,
		},
	},
	{
		id: 'dbt',
		en: {
			enables: 'turns warehouse SQL into tested, documented, reusable analytics models',
			what_it_is: `dbt is a transformation tool for analytics engineering. It lets you write SQL models, define dependencies between them, test assumptions, document columns, and build a clean semantic layer inside the warehouse. Instead of scattered reporting queries, dbt turns business logic into versioned code that can be reviewed, tested, and deployed.`,
			what_i_use_it_for: `On data projects, dbt is the layer I reach for when raw tables need to become trusted reporting models. It is useful for staging messy source data, building fact and dimension tables, documenting metric definitions, and making the Power BI or dashboard layer thinner. The value is not just cleaner SQL, it is a shared contract for how the business numbers are produced.`,
			why_i_use_it_instead: `I use dbt when transformations have become too important to hide in dashboards or one-off scripts. Power BI can shape data, and Python can transform data, but dbt makes SQL transformations reviewable and repeatable in the warehouse itself. That matters when several reports depend on the same definitions and a silent metric drift would cost trust.`,
		},
		fr: {
			enables: `transforme le SQL d'entrepôt en modèles analytiques testés, documentés et réutilisables`,
			what_it_is: `dbt est un outil de transformation pour l'analytique engineering. Il permet d'écrire des modèles SQL, de définir leurs dépendances, de tester les hypothèses, de documenter les colonnes et de bâtir une couche sémantique propre dans l'entrepôt. Au lieu d'avoir des requêtes de rapports éparpillées, dbt transforme la logique d'affaires en code versionné qui peut être relu, testé et déployé.`,
			what_i_use_it_for: `Sur les projets de données, dbt est la couche que j'utilise quand les tables brutes doivent devenir des modèles de reporting fiables. Il sert à préparer les sources sales, bâtir des faits et dimensions, documenter les définitions de métriques et alléger la couche Power BI ou dashboard. La valeur, ce n'est pas juste du SQL plus propre, c'est un contrat partagé sur la façon dont les chiffres sont produits.`,
			why_i_use_it_instead: `J'utilise dbt quand les transformations sont devenues trop importantes pour rester cachées dans des dashboards ou des scripts uniques. Power BI peut façonner des données, et Python peut transformer des données, mais dbt rend les transformations SQL relisables et répétables directement dans l'entrepôt. Ça compte quand plusieurs rapports dépendent des mêmes définitions et qu'une dérive silencieuse casserait la confiance.`,
		},
	},
	{
		id: 'directus',
		en: {
			enables: 'turns a SQL database into an editor-friendly CMS with APIs and permissions',
			what_it_is: `Directus is a headless CMS and data platform that sits on top of a SQL database. Instead of forcing content into a fixed blog model, it exposes tables as collections, gives editors a clean admin UI, and gives developers REST and GraphQL APIs for the same data. It works well when the content model is custom: projects, services, labels, page blocks, media, and operational settings all need structure.`,
			what_i_use_it_for: `On yesid.dev, Directus is the source of truth for portfolio content, navigation chrome, service copy, project case studies, tech stack entries, and CMS-managed media. The public site does not query it for every visitor. I export the CMS state into generated Svelte modules, commit the cache, and serve it from Vercel edge builds. That keeps authoring flexible while the site stays fast and predictable.`,
			why_i_use_it_instead: `I use Directus here because the data model matters more than a page builder. SvelteKit owns rendering, Directus owns structured content, and the export step gives me reviewable diffs. Compared with hardcoded content, it makes future edits safer. Compared with a generic website CMS, it lets me model real relationships between projects, services, tags, media, and technology.`,
		},
		fr: {
			enables: 'transforme une base SQL en CMS utilisable par les éditeurs, avec APIs et permissions',
			what_it_is: `Directus est un CMS headless et une plateforme de données par-dessus une base SQL. Au lieu de forcer le contenu dans un modèle de blogue fixe, il expose les tables comme des collections, donne une interface admin propre aux éditeurs et donne aux développeurs des APIs REST et GraphQL pour les mêmes données. Il marche bien quand le modèle de contenu est sur mesure : projets, services, labels, blocs de page, médias et réglages opérationnels ont tous besoin de structure.`,
			what_i_use_it_for: `Sur yesid.dev, Directus est la source de vérité pour le contenu du portfolio, le chrome de navigation, la copie des services, les études de cas, les entrées du stack technique et les médias gérés par le CMS. Le site public ne le requête pas pour chaque visiteur. J'exporte l'état du CMS en modules Svelte générés, je garde ce cache dans le repo et je le sers depuis les builds Vercel Edge. Ça garde l'édition flexible pendant que le site reste rapide et prévisible.`,
			why_i_use_it_instead: `J'utilise Directus ici parce que le modèle de données compte plus qu'un page builder. SvelteKit possède le rendu, Directus possède le contenu structuré et l'export donne des diffs relisables. Comparé au contenu codé en dur, les changements futurs sont plus sûrs. Comparé à un CMS générique, je peux modéliser les vraies relations entre projets, services, tags, médias et technologies.`,
		},
	},
	{
		id: 'neon',
		en: {
			enables: 'runs Postgres with branching, managed storage, and serverless-friendly connection patterns',
			what_it_is: `Neon is a managed Postgres platform built around serverless infrastructure and database branching. It separates compute from storage, lets environments branch from the same source database, and fits modern preview workflows where each branch may need realistic data without a long-lived database server.`,
			what_i_use_it_for: `On yesid.dev, Neon backs the Directus content database. The important part is operational: dev and production can be separated cleanly, content migrations can be tested against a branch, and the application still talks to real Postgres. For a portfolio and CMS system, that gives me production-grade SQL without spending project energy on database hosting chores.`,
			why_i_use_it_instead: `I use Neon when I want Postgres semantics with lighter operational overhead. A self-hosted Postgres VM gives maximum control, but it also adds backups, patching, sizing, and monitoring work. Neon is a better fit when the product needs branchable database workflows and the core value is the app and content system, not managing database infrastructure by hand.`,
		},
		fr: {
			enables: 'fait rouler Postgres avec branches, stockage géré et connexions adaptées au serverless',
			what_it_is: `Neon est une plateforme Postgres gérée bâtie autour d'une infrastructure serverless et du branching de base de données. Elle sépare le compute du stockage, permet aux environnements de brancher à partir de la même base source et fonctionne bien avec les workflows modernes de preview où chaque branche peut avoir besoin de données réalistes sans serveur de base de données permanent.`,
			what_i_use_it_for: `Sur yesid.dev, Neon supporte la base de données de contenu Directus. Le point important est opérationnel : dev et production peuvent être séparés proprement, les migrations de contenu peuvent être testées contre une branche et l'application parle quand même à du vrai Postgres. Pour un portfolio avec CMS, ça donne du SQL de calibre production sans brûler de l'énergie sur l'hébergement de base de données.`,
			why_i_use_it_instead: `J'utilise Neon quand je veux les garanties de Postgres avec moins de charge opérationnelle. Un VM Postgres autohébergé donne le contrôle maximal, mais il ajoute sauvegardes, mises à jour, sizing et surveillance. Neon est un meilleur choix quand le produit a besoin de workflows branchables et que la valeur est dans l'app et le système de contenu, pas dans la gestion manuelle de l'infra database.`,
		},
	},
	{
		id: 'turbo',
		en: {
			enables: 'coordinates monorepo tasks so builds, checks, and tests reuse work instead of repeating it',
			what_it_is: `Turborepo is a build system for JavaScript and TypeScript monorepos. It understands package dependencies, runs tasks in the right order, caches outputs, and avoids repeating work that has not changed. In a repo with a web app, shared packages, CMS scripts, generated content, and tests, that orchestration keeps local and CI workflows from turning into a slow pile of shell commands.`,
			what_i_use_it_for: `On yesid.dev, Turbo coordinates the monorepo that contains the SvelteKit web app, shared schemas, token packages, CMS scripts, and generated content. It makes the repo easier to operate because checks can stay package-aware instead of every command pretending the whole workspace is one flat app.`,
			why_i_use_it_instead: `I use Turbo because the repo has real package boundaries. A simple npm script works until every check rebuilds everything and nobody knows which package owns which output. Turbo gives structure without forcing a heavy framework choice. It is enough orchestration to keep the workspace fast, while Bun, SvelteKit, and the CMS scripts keep their own responsibilities.`,
		},
		fr: {
			enables: 'coordonne les tâches du monorepo pour réutiliser les builds, checks et tests au lieu de tout répéter',
			what_it_is: `Turborepo est un système de build pour les monorepos JavaScript et TypeScript. Il comprend les dépendances entre packages, roule les tâches dans le bon ordre, met les sorties en cache et évite de refaire le travail qui n'a pas changé. Dans un repo avec app web, packages partagés, scripts CMS, contenu généré et tests, cette orchestration évite que le workflow dev devienne juste une pile lente de commandes shell.`,
			what_i_use_it_for: `Sur yesid.dev, Turbo coordonne le monorepo qui contient l'app SvelteKit, les schémas partagés, les packages de tokens, les scripts CMS et le contenu généré. Le repo est plus facile à opérer parce que les checks restent conscients des packages au lieu de traiter tout le workspace comme une seule app plate.`,
			why_i_use_it_instead: `J'utilise Turbo parce que le repo a de vraies frontières entre packages. Un simple script npm suffit jusqu'au moment où chaque check rebâtit tout et où personne ne sait quel package possède quelle sortie. Turbo donne de la structure sans imposer un framework lourd. C'est assez d'orchestration pour garder le workspace rapide pendant que Bun, SvelteKit et les scripts CMS gardent leurs responsabilités.`,
		},
	},
	{
		id: 'figma',
		en: {
			enables: 'turns visual direction into inspectable layouts, components, and brand decisions',
			what_it_is: `Figma is a collaborative design tool for interface design, brand systems, prototypes, and review flows. Designers and developers can work from the same file, inspect spacing and colors, comment on decisions, and test layout direction before the implementation becomes expensive to change.`,
			what_i_use_it_for: `On client work and portfolio rebuilds, Figma is where I settle visual direction before writing too much UI code. For Cafe Arona, it helps translate brand tone, product photography, menu structure, and mobile storefront decisions into a layout system. For yesid.dev, it is useful for auditing density, hierarchy, and whether the site feels like infrastructure work instead of a generic portfolio template.`,
			why_i_use_it_instead: `I use Figma when the visual problem needs collaboration or comparison. Jumping straight into code is fine for small UI adjustments, but brand and layout decisions need a place where options can be reviewed quickly. Figma keeps those decisions visible, then the implementation can focus on building the approved system accurately.`,
		},
		fr: {
			enables: `transforme la direction visuelle en layouts, composants et décisions de marque qu'on peut inspecter`,
			what_it_is: `Figma est un outil de design collaboratif pour interfaces, systèmes de marque, prototypes et revues. Designers et développeurs peuvent travailler à partir du même fichier, inspecter les espacements et couleurs, commenter les décisions et tester une direction de layout avant que l'implémentation coûte cher à changer.`,
			what_i_use_it_for: `Sur les mandats clients et les reconstructions de portfolio, Figma est l'endroit où je règle la direction visuelle avant d'écrire trop de code UI. Pour Cafe Arona, il aide à traduire le ton de marque, les photos de produits, la structure du menu et les décisions mobile en système de layout. Pour yesid.dev, il sert à auditer la densité, la hiérarchie et le sentiment d'infrastructure au lieu d'un portfolio générique.`,
			why_i_use_it_instead: `J'utilise Figma quand le problème visuel demande collaboration ou comparaison. Aller directement en code est correct pour de petits ajustements UI, mais les décisions de marque et de layout ont besoin d'un endroit où les options se relisent vite. Figma garde ces décisions visibles, puis l'implémentation peut se concentrer sur bâtir le système approuvé correctement.`,
		},
	},
	{
		id: 'liquid',
		en: {
			enables: 'renders Shopify storefront templates with product, collection, and theme data',
			what_it_is: `Liquid is Shopify's template language. It mixes HTML with safe placeholders, loops, filters, and conditional logic so a theme can render products, collections, cart state, menus, and merchant-configured sections. It is not a full application language. It is the layer that turns Shopify data and theme settings into storefront pages.`,
			what_i_use_it_for: `On Shopify storefront work, Liquid is the bridge between the merchant's data and the customer's page. It controls product cards, collection pages, navigation, reusable sections, metafield output, and the small pieces of logic that make a storefront feel custom without breaking Shopify's hosted commerce model.`,
			why_i_use_it_instead: `I use Liquid when the project should stay inside Shopify's theme system. A headless build can make sense, but it adds hosting, API, cart, preview, and editorial complexity. Liquid keeps the storefront close to Shopify's admin and lets a small business maintain content without needing a custom deployment for every merchandising change.`,
		},
		fr: {
			enables: 'rend les gabarits Shopify avec les données de produits, collections et thèmes',
			what_it_is: `Liquid est le langage de gabarits de Shopify. Il mélange HTML avec des variables sûres, des boucles, des filtres et de la logique conditionnelle pour qu'un thème puisse rendre les produits, collections, paniers, menus et sections configurées par le marchand. Ce n'est pas un langage d'application complet. C'est la couche qui transforme les données Shopify et les réglages de thème en pages de vitrine.`,
			what_i_use_it_for: `Sur une vitrine Shopify, Liquid est le pont entre les données du marchand et la page du client. Il contrôle les cartes de produits, les pages de collection, la navigation, les sections réutilisables, la sortie des metafields et les petits morceaux de logique qui rendent une boutique custom sans casser le modèle commerce hébergé de Shopify.`,
			why_i_use_it_instead: `J'utilise Liquid quand le projet doit rester dans le système de thèmes Shopify. Un build headless peut être logique, mais il ajoute hébergement, API, panier, preview et complexité éditoriale. Liquid garde la vitrine proche de l'admin Shopify et permet à une petite entreprise de maintenir son contenu sans déploiement custom pour chaque changement marchandisage.`,
		},
	},
	{
		id: 'retool',
		en: {
			enables: 'builds internal tools quickly on top of databases, APIs, and approval workflows',
			what_it_is: `Retool is a low-code platform for internal tools. It connects to databases, APIs, and services, then gives teams a fast way to build admin panels, approval queues, support tools, and operational dashboards. The useful part is not avoiding code completely. The useful part is shipping boring internal workflows quickly while keeping the real business logic in SQL, APIs, or controlled scripts.`,
			what_i_use_it_for: `For internal tooling projects, Retool is useful when a team needs a secure operational interface faster than a custom app build. A database table, review queue, CSV import, or exception workflow can become a usable tool for staff without spending weeks on UI plumbing. I still treat permissions, auditability, and query safety as engineering work, not as afterthoughts.`,
			why_i_use_it_instead: `I use Retool when the user is internal and speed matters more than a bespoke interface. A custom SvelteKit app is better for public products or polished client-facing flows. Retool is better for back-office workflows where the win is replacing spreadsheets, direct database edits, or manual approvals with a controlled interface.`,
		},
		fr: {
			enables: `bâtit vite des outils internes par-dessus des bases, APIs et workflows d'approbation`,
			what_it_is: `Retool est une plateforme low-code pour outils internes. Elle se connecte aux bases de données, APIs et services, puis donne aux équipes une façon rapide de bâtir des panneaux admin, files d'approbation, outils de support et dashboards opérationnels. Le point utile, ce n'est pas d'éviter le code complètement. Le point utile, c'est de livrer vite des workflows internes plates à maintenir pendant que la vraie logique reste dans SQL, les APIs ou des scripts contrôlés.`,
			what_i_use_it_for: `Pour les projets d'outillage interne, Retool est utile quand une équipe a besoin d'une interface opérationnelle sécurisée plus vite qu'une app custom. Une table de base de données, une file de revue, un import CSV ou un workflow d'exception peut devenir un outil utilisable par le staff sans passer des semaines sur la plomberie UI. Je traite quand même les permissions, l'auditabilité et la sécurité des requêtes comme du vrai travail d'ingénierie.`,
			why_i_use_it_instead: `J'utilise Retool quand l'utilisateur est interne et que la vitesse compte plus qu'une interface sur mesure. Une app SvelteKit custom est meilleure pour les produits publics ou les flows clients polis. Retool est meilleur pour les workflows back-office où le gain est de remplacer les tableurs, les edits directs en base ou les approbations manuelles par une interface contrôlée.`,
		},
	},
	{
		id: 'sql',
		en: {
			enables: 'asks precise questions of structured data and turns operations into measurable answers',
			what_it_is: `SQL is the language for working with relational databases. It lets you define tables, join related records, filter rows, aggregate facts, enforce constraints, and answer business questions directly against structured data. It is both a querying language and a modeling language because good SQL depends on understanding the shape of the data underneath it.`,
			what_i_use_it_for: `SQL is the through-line in almost every serious data project I work on. I use it to inspect source systems, design reporting grains, tune slow queries, build extracts, verify migrations, power dashboards, and prove whether an operational claim is true. Even when the application is written in TypeScript or Python, the hard questions usually land back in SQL.`,
			why_i_use_it_instead: `I use SQL directly because it removes guesswork. ORMs, dashboards, and low-code tools are useful, but they can hide the actual query and the actual cost. When performance, correctness, or reporting trust matters, I want to read the joins, predicates, indexes, and grouping logic myself. That is where most data problems become obvious.`,
		},
		fr: {
			enables: 'pose des questions précises aux données structurées et transforme les opérations en réponses mesurables',
			what_it_is: `SQL est le langage pour travailler avec les bases de données relationnelles. Il permet de définir des tables, joindre des enregistrements liés, filtrer des lignes, agréger des faits, imposer des contraintes et répondre directement aux questions d'affaires sur des données structurées. C'est à la fois un langage de requête et un langage de modélisation, parce qu'un bon SQL dépend de la forme des données en dessous.`,
			what_i_use_it_for: `SQL est le fil conducteur dans presque chaque projet de données sérieux que je touche. Je l'utilise pour inspecter les systèmes sources, définir les grains de reporting, optimiser les requêtes lentes, bâtir des extractions, vérifier des migrations, alimenter des dashboards et prouver si une affirmation opérationnelle est vraie. Même quand l'application est écrite en TypeScript ou Python, les questions difficiles reviennent souvent à SQL.`,
			why_i_use_it_instead: `J'utilise SQL directement parce que ça enlève le flou. Les ORMs, dashboards et outils low-code sont utiles, mais ils peuvent cacher la vraie requête et le vrai coût. Quand la performance, la justesse ou la confiance dans les rapports compte, je veux lire moi-même les joins, prédicats, index et groupements. C'est là que la plupart des problèmes de données deviennent évidents.`,
		},
	},
	{
		id: 'pl-pgsql',
		en: {
			enables: 'puts procedural logic beside Postgres data for functions, triggers, and guarded workflows',
			what_it_is: `PL/pgSQL is PostgreSQL's procedural language. It lets you write functions, triggers, loops, conditionals, and exception handling inside the database while still using SQL as the core data access language. It is useful when logic needs to live close to the data, especially for validations, audit trails, backfills, and controlled data transformations.`,
			what_i_use_it_for: `In Postgres work, PL/pgSQL is useful for database-side automation that should not depend on an application server being awake. I use it for migration helpers, trigger-based audit records, derived fields, data cleanup routines, and guarded operations where the database should enforce the rule itself.`,
			why_i_use_it_instead: `I use PL/pgSQL carefully. Application code is easier to test and deploy for most business logic, but some rules belong at the database boundary because every client must obey them. When the invariant is data-critical, a database function or trigger can be the right place to enforce it. The goal is not to hide an app in the database, it is to protect the data model where it matters.`,
		},
		fr: {
			enables: 'place de la logique procédurale près des données Postgres pour fonctions, triggers et workflows gardés',
			what_it_is: `PL/pgSQL est le langage procédural de PostgreSQL. Il permet d'écrire des fonctions, triggers, boucles, conditions et gestion d'exceptions dans la base tout en gardant SQL comme langage principal d'accès aux données. Il est utile quand la logique doit rester proche des données, surtout pour validations, pistes d'audit, backfills et transformations contrôlées.`,
			what_i_use_it_for: `Dans le travail Postgres, PL/pgSQL est utile pour l'automatisation côté base qui ne doit pas dépendre d'un serveur applicatif éveillé. Je l'utilise pour des helpers de migration, des audits par trigger, des champs dérivés, des routines de nettoyage et des opérations gardées où la base doit faire respecter la règle elle-même.`,
			why_i_use_it_instead: `J'utilise PL/pgSQL avec prudence. Le code applicatif est plus facile à tester et déployer pour la plupart de la logique d'affaires, mais certaines règles appartiennent à la frontière de la base parce que tous les clients doivent les respecter. Quand l'invariant est critique pour les données, une fonction ou un trigger en base peut être le bon endroit pour l'imposer. Le but n'est pas de cacher une app dans la base, c'est de protéger le modèle de données où ça compte.`,
		},
	},
] as const;

interface TranslationRow {
	id: number;
	tech_stack_id: string | { id: string };
	languages_code: Locale;
}

function parentId(row: TranslationRow): string {
	return typeof row.tech_stack_id === 'string' ? row.tech_stack_id : row.tech_stack_id.id;
}

function blockDoc(text: string): BlockEditorDoc {
	return {
		time: 0,
		version: '2.31.2',
		blocks: [{ id: 'p1', type: 'paragraph', data: { text } }],
	};
}

function payloadFor(target: TechLongformTarget, locale: Locale): Record<string, unknown> {
	const copy = target[locale];
	return {
		tech_stack_id: target.id,
		languages_code: locale,
		enables: copy.enables,
		what_it_is: blockDoc(copy.what_it_is),
		what_i_use_it_for: blockDoc(copy.what_i_use_it_for),
		why_i_use_it_instead: blockDoc(copy.why_i_use_it_instead),
	};
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const ids = TECH_LONGFORM_TARGETS.map((target) => target.id);
	const existing = (await client.request(
		readItems('tech_stack_translations', {
			fields: ['id', 'tech_stack_id', 'languages_code'],
			filter: { tech_stack_id: { _in: ids }, languages_code: { _in: ['en', 'fr'] } },
			limit: -1,
		}),
	)) as TranslationRow[];

	const byKey = new Map(existing.map((row) => [`${parentId(row)}:${row.languages_code}`, row]));
	const log: string[] = [];
	for (const target of TECH_LONGFORM_TARGETS) {
		for (const locale of ['en', 'fr'] as const) {
			const payload = payloadFor(target, locale);
			const current = byKey.get(`${target.id}:${locale}`);
			if (current) {
				log.push(`update tech_stack_translations ${target.id}/${locale}`);
				if (!dryRun) await client.request(updateItem('tech_stack_translations', current.id, payload));
			} else {
				log.push(`create tech_stack_translations ${target.id}/${locale}`);
				if (!dryRun) await client.request(createItem('tech_stack_translations', payload));
			}
		}
	}
	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
