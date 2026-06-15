#!/usr/bin/env bun
/**
 * content-services slice — plain-language copy load + new sections + relatedProjects.
 *
 * For each of the 4 visible services, patches services_translations (en+fr):
 *   - description, value_proposition (the plain owner-to-owner rewrite)
 * Upserts services_sections (idempotent, matched by en title):
 *   - "My Approach" (sort 2): rewritten curious + safe + love paragraph (en+fr)
 *   - "Is this you?" (sort 1): owner-symptom self-qualification (en+fr) [all 4]
 *   - "When I'm not your guy" (sort 3): honest fit (en+fr) [03 + 04 only]
 * Reconciles projects_services: deletes lorem-* links, creates the real mapping.
 *
 * benefit_headline + impact_metric were handled by content-services-metrics.ts.
 *
 * DRY-RUN BY DEFAULT. Dev-only (guard). Run from repo root:
 *   bun apps/cms/scripts/content-services-copy.ts                                          # plan
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-services-copy.ts --apply   # dev
 */

import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('content-services-copy');

interface Loc { en: string; fr: string }
interface SectionSpec { sort: number; titleEn: string; titleFr: string; bodyEn: string; bodyFr: string }
interface ServiceCopy {
	id: string;
	description: Loc;
	valueProposition: Loc;
	myApproach: Loc;
	isThisYou: { bodyEn: string; bodyFr: string };
	whenNot?: { bodyEn: string; bodyFr: string };
}

const SERVICES: ServiceCopy[] = [
	{
		id: 'database-engineering',
		description: {
			en: 'Where your business keeps its data, built to stay fast and safe as you grow.',
			fr: "L'endroit où ta business garde ses données, bâti pour rester rapide et sécuritaire en grandissant.",
		},
		valueProposition: {
			en: 'First stop: your data lives here. A database is the filing cabinet behind your whole business, and everything else is built on top of it. I make yours store and update your data fast and safely, so it stays an asset instead of the thing that slows you down.',
			fr: "Premier arrêt : tes données vivent ici. Une base de données, c'est le classeur derrière toute ta business, et tout le reste est bâti par-dessus. Je fais en sorte que la tienne garde et mette à jour tes données vite et de façon sécuritaire, pour qu'elle reste un atout au lieu de la chose qui te ralentit.",
		},
		myApproach: {
			en: "Database work is never one-size-fits-all: a stubborn query, a database from scratch, a Snowflake build, faster indexes. I start from what you need and dig for the real fix, not a band-aid, but years in I never wing it: backups and a tested rollback before anything touches live data. I love this work, so I guard your data like my own.",
			fr: "Le travail de base de données, c'est jamais du mur-à-mur: une requête têtue, une base partie de zéro, un build Snowflake, des index plus rapides. Je pars de ce dont tu as besoin et je creuse pour trouver le vrai fix, pas un plaster, mais avec les années j'improvise jamais: des sauvegardes et un rollback testé avant que quoi que ce soit touche à tes données en live. J'aime cette job-là, fait que je protège tes données comme si c'étaient les miennes.",
		},
		isThisYou: {
			bodyEn: 'Signs this is you: queries that crawl, reports that time out, a migration you are scared to run, or a database that grew by accident and nobody really designed. Maybe it works today but you hold your breath every time it runs. If any of that sounds familiar, this is the right place to start.',
			bodyFr: "Des signes que c'est toi: des requêtes qui traînent, des rapports qui tombent en timeout, une migration qui te fait peur à faire rouler, ou une base de données qui a grossi par accident et que personne a vraiment pensée. Peut-être que ça marche aujourd'hui, mais tu retiens ton souffle chaque fois que ça roule. Si une de ces affaires-là te parle, t'es à la bonne place pour commencer.",
		},
	},
	{
		id: 'data-pipeline',
		description: {
			en: "Your data travels from where it's created to where your team uses it, on its own, every day.",
			fr: "Tes données voyagent d'où elles sont créées jusqu'où ton équipe les utilise, toutes seules, chaque jour.",
		},
		valueProposition: {
			en: "Next stop: your data moves. Right now someone on your team probably copies numbers between systems by hand every week. I set up a route that carries your data from where it's created to where your team uses it on its own, every morning, so the same fresh numbers show up the same way every day.",
			fr: "Prochain arrêt : tes données bougent. En ce moment, quelqu'un dans ton équipe recopie probablement des chiffres d'un système à l'autre à la main chaque semaine. Je mets en place un trajet qui transporte tes données d'où elles sont créées jusqu'où ton équipe les utilise tout seul, chaque matin, pour que les mêmes chiffres frais arrivent de la même façon chaque jour.",
		},
		myApproach: {
			en: "Moving data can mean a nightly sync, a full warehouse build, or killing one painful copy-paste job. I learn how your data flows, then build a route that's boring and reliable on purpose: it retries on its own, alerts me when something's off, and recovers cleanly. I enjoy making a messy process quietly run itself, and after years of 3 AM pages, I build it so those calls don't come.",
			fr: "Déplacer des données, ça peut être une synchro à chaque nuit, monter un entrepôt de données au complet, ou tuer une job de copier-coller qui te gosse. Je regarde comment tes données circulent, pis je bâtis un chemin plate et fiable, fait exprès de même: ça réessaye tout seul, ça m'avertit quand quelque chose cloche, pis ça se replace proprement. J'aime ça prendre un processus mêlant pis le faire rouler tout seul tranquillement, pis après des années de calls à 3 h du matin, je le bâtis pour que ces appels-là arrivent pas.",
		},
		isThisYou: {
			bodyEn: 'Signs this is you: someone on your team copies numbers between systems every week, by hand. Your reports are always a day behind. Or your data lives in five different tools that never quite agree with each other. If any of that sounds familiar, this is the work I do.',
			bodyFr: "Des signes que c'est toi: quelqu'un dans ton équipe recopie des chiffres d'un système à l'autre chaque semaine, à la main. Tes rapports ont toujours une journée de retard. Ou tes données vivent dans cinq outils différents qui s'entendent jamais vraiment entre eux. Si une de ces affaires-là te parle, c'est exactement le genre de travail que je fais.",
		},
	},
	{
		id: 'analytics-reporting',
		description: {
			en: 'Your messy numbers turned into clear dashboards your team actually trusts.',
			fr: 'Tes chiffres mélangés transformés en tableaux de bord clairs en qui ton équipe a confiance.',
		},
		valueProposition: {
			en: 'Third stop: your data starts talking. I take numbers scattered across your tools and turn them into one set of dashboards that all agree with each other. Your team stops arguing about whose number is right and just decides.',
			fr: "Troisième arrêt : tes données se mettent à parler. Je prends des chiffres éparpillés dans tes outils et j'en fais une seule série de tableaux de bord qui s'accordent tous entre eux. Ton équipe arrête de se chicaner sur quel chiffre est le bon et prend ses décisions, point.",
		},
		myApproach: {
			en: "This ranges from one clean dashboard to a whole reporting setup your team lives in. I'm curious by default and I love getting this right, so I start with how you actually decide, not the chart, and keep asking until the numbers make sense. Then I check every number against its source, because a dashboard people can't trust is worse than none.",
			fr: "Ça peut aller d'un seul tableau de bord propre jusqu'à toute une structure de rapports dans laquelle ton équipe vit au quotidien. Je suis curieux de nature et j'aime vraiment ça, fait que je commence par comprendre comment tu prends tes décisions, pas par le graphique, pis je continue de poser des questions jusqu'à ce que les chiffres aient du sens. Ensuite je vérifie chaque chiffre par rapport à sa source, parce qu'un tableau de bord auquel le monde peut pas se fier, c'est pire que rien.",
		},
		isThisYou: {
			bodyEn: 'Signs this is you: every meeting turns into an argument about whose number is right. The same report takes someone days to pull together by hand, every time. Or you have dashboards sitting there that nobody opens, because everyone learned they do not match what is really happening.',
			bodyFr: "Des signes que c'est toi: chaque réunion vire en chicane sur quel chiffre est le bon. Le même rapport prend des jours à monter à la main, chaque fois. Ou bien tu as des tableaux de bord que personne n'ouvre, parce que le monde a fini par comprendre qu'ils collent pas à la réalité.",
		},
		whenNot: {
			bodyEn: 'If you just need a BI tool turned on or one quick chart pulled for a single meeting, that is lighter work than what I do. I build the trustworthy layer underneath so the numbers hold up over time, which is overkill when you only need a fast one-off.',
			bodyFr: "Si tu as juste besoin qu'on active un outil de BI ou qu'on sorte un graphique vite fait pour une seule réunion, c'est plus léger que ce que je fais. Moi, je bâtis la couche solide en dessous pour que les chiffres tiennent la route dans le temps, ce qui est exagéré quand tu veux juste un coup rapide une seule fois.",
		},
	},
	{
		id: 'web-development',
		description: {
			en: 'Fast websites, online stores, and dashboards that put your data in front of people.',
			fr: 'Des sites web, des boutiques en ligne et des tableaux de bord rapides qui mettent tes données devant le monde.',
		},
		valueProposition: {
			en: "Last stop on the line: your data reaches people. A fast website, online store, or dashboard takes everything sitting in your systems and shows it to customers and staff the way they'll actually use it. Pages load quick, the store takes orders, and your team sees what they need without digging.",
			fr: "Dernier arrêt sur la ligne : tes données rejoignent le monde. Un site web rapide, une boutique en ligne ou un tableau de bord prend tout ce qui dort dans tes systèmes et le montre à tes clients pis à ton staff de la façon dont ils vont vraiment s'en servir. Les pages chargent vite, la boutique prend les commandes, pis ton équipe voit ce qu'il lui faut sans avoir à fouiller.",
		},
		myApproach: {
			en: "A web project might be a quick storefront, a custom app, or a dashboard wired into your systems. I love figuring out how a thing should work, so I start with who uses it and what they need, then build it fast and simple. And I ship it safely, tested and easy to roll back, so going live never means holding your breath.",
			fr: "Un projet web, ça peut être une petite boutique, une app sur mesure, ou un tableau de bord branché sur tes systèmes. J'adore comprendre comment une affaire devrait fonctionner, fait que je commence par qui s'en sert et ce dont ces gens ont besoin, pis je construis vite et simple. Et je le mets en ligne en toute sécurité, testé et facile à revenir en arrière, pour que le lancement te demande jamais de retenir ton souffle.",
		},
		isThisYou: {
			bodyEn: 'Signs this is you: a site that loads slowly or feels clunky to use, a store that keeps losing people right at checkout, or tools and data your customers and team just cannot get to. If the thing standing between your work and the people who need it is the website itself, that is the gap I close.',
			bodyFr: "Des signes que c'est toi: un site lent ou maladroit à utiliser, une boutique qui perd du monde juste au moment de payer, ou des outils et des données que tes clients et ton équipe arrivent pas à atteindre. Si ce qui bloque entre ton travail et les gens qui en ont besoin, c'est le site lui-même, c'est exactement ce trou-là que je vais combler.",
		},
		whenNot: {
			bodyEn: 'If you want a pure brand or marketing campaign with no real data or systems behind it, an agency will serve you better than I will. My web work shines when it is wired straight into your data, so that is where I am worth your money.',
			bodyFr: "Si tu cherches une pure campagne de marque ou de marketing, sans vraies données ni systèmes derrière, une agence va mieux te servir que moi. Mon travail web brille quand il est branché direct sur tes données, c'est là que je vaux ton argent.",
		},
	},
];

const SECTION_TITLES = {
	myApproach: { en: 'My Approach', fr: 'Mon approche' },
	isThisYou: { en: 'Is this you?', fr: 'Ça te ressemble?' },
	whenNot: { en: "When I'm not your guy", fr: 'Quand je suis pas la bonne personne' },
};

/** Desired relatedProjects per service, in display order (creation order). */
const DESIRED_PROJECTS: Record<string, string[]> = {
	'database-engineering': ['transit-data-pipeline', 'yesid-dev'],
	'data-pipeline': ['transit-data-pipeline'],
	'analytics-reporting': ['transit-data-pipeline', 'cafe-arona'],
	'web-development': ['yesid-dev', 'cafe-arona', 'transit-data-pipeline'],
};

interface Schema {
	services_translations: Array<{ id: number; services_id: string; languages_code: string }>;
	services_sections: Array<{
		id: number;
		services_id: string;
		sort: number | null;
		translations?: Array<{ id: number; languages_code: string; title: string | null }>;
	}>;
	projects_services: Array<{ id: number; service_id: string; project_id: string }>;
}
type Client = ReturnType<typeof createClient<Schema>>;

async function trRowId(client: Client, serviceId: string, lang: string): Promise<number> {
	const rows = (await client.request(
		readItems('services_translations', {
			filter: { services_id: { _eq: serviceId }, languages_code: { _eq: lang } },
			fields: ['id'],
			limit: 1,
		}),
	)) as Array<{ id: number }>;
	if (!rows[0]) throw new Error(`no ${lang} translation for '${serviceId}'`);
	return rows[0].id;
}

async function readSections(client: Client, serviceId: string) {
	return (await client.request(
		readItems('services_sections', {
			filter: { services_id: { _eq: serviceId } },
			fields: ['id', 'sort', { translations: ['id', 'languages_code', 'title'] } as unknown as string],
			limit: -1,
		}),
	)) as unknown as Schema['services_sections'];
}

async function upsertSection(client: Client, serviceId: string, existing: Schema['services_sections'], spec: SectionSpec) {
	const match = existing.find((s) => s.translations?.find((t) => t.languages_code === 'en')?.title === spec.titleEn);
	if (match) {
		await client.request(updateItem('services_sections', match.id, { sort: spec.sort }));
		const en = match.translations?.find((t) => t.languages_code === 'en');
		const fr = match.translations?.find((t) => t.languages_code === 'fr');
		if (en) await client.request(updateItem('services_sections_translations' as never, en.id as never, { title: spec.titleEn, content: spec.bodyEn } as never));
		if (fr) await client.request(updateItem('services_sections_translations' as never, fr.id as never, { title: spec.titleFr, content: spec.bodyFr } as never));
		log.info(`    ~ section "${spec.titleEn}" (#${match.id}) updated, sort ${spec.sort}`);
	} else {
		await client.request(
			createItem('services_sections', {
				services_id: serviceId,
				sort: spec.sort,
				translations: [
					{ languages_code: 'en', title: spec.titleEn, content: spec.bodyEn },
					{ languages_code: 'fr', title: spec.titleFr, content: spec.bodyFr },
				],
			} as object),
		);
		log.info(`    + section "${spec.titleEn}" created, sort ${spec.sort}`);
	}
}

export async function apply(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	// 1. translation patches (description + value_proposition, en + fr) + 2. sections
	for (const svc of SERVICES) {
		log.info(`${svc.id}:`);
		const enId = await trRowId(client, svc.id, 'en');
		const frId = await trRowId(client, svc.id, 'fr');
		await client.request(updateItem('services_translations', enId, { description: svc.description.en, value_proposition: svc.valueProposition.en }));
		await client.request(updateItem('services_translations', frId, { description: svc.description.fr, value_proposition: svc.valueProposition.fr }));
		log.info(`    ~ translations patched (description + value_proposition)`);

		const existing = await readSections(client, svc.id);
		await upsertSection(client, svc.id, existing, { sort: 1, titleEn: SECTION_TITLES.isThisYou.en, titleFr: SECTION_TITLES.isThisYou.fr, bodyEn: svc.isThisYou.bodyEn, bodyFr: svc.isThisYou.bodyFr });
		await upsertSection(client, svc.id, existing, { sort: 2, titleEn: SECTION_TITLES.myApproach.en, titleFr: SECTION_TITLES.myApproach.fr, bodyEn: svc.myApproach.en, bodyFr: svc.myApproach.fr });
		if (svc.whenNot) {
			await upsertSection(client, svc.id, existing, { sort: 3, titleEn: SECTION_TITLES.whenNot.en, titleFr: SECTION_TITLES.whenNot.fr, bodyEn: svc.whenNot.bodyEn, bodyFr: svc.whenNot.bodyFr });
		}
	}

	// 3. relatedProjects reconcile via projects_services.
	const junction = (await client.request(
		readItems('projects_services', { fields: ['id', 'service_id', 'project_id'], limit: -1 }),
	)) as Schema['projects_services'];
	for (const row of junction) {
		if (row.project_id.startsWith('lorem-')) {
			await client.request(deleteItem('projects_services', row.id));
			log.info(`  - junction #${row.id} ${row.service_id} <- ${row.project_id} (lorem, deleted)`);
		}
	}
	const have = new Set(junction.filter((r) => !r.project_id.startsWith('lorem-')).map((r) => `${r.service_id}::${r.project_id}`));
	for (const [service, projects] of Object.entries(DESIRED_PROJECTS)) {
		for (const project of projects) {
			if (!have.has(`${service}::${project}`)) {
				await client.request(createItem('projects_services', { service_id: service, project_id: project } as object));
				log.info(`  + junction ${service} <- ${project}`);
			}
		}
	}
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);

	if (!apply_) {
		for (const svc of SERVICES) {
			log.info(`  ~ ${svc.id}: description + value_proposition (en+fr); sections Is this you? + My Approach${svc.whenNot ? ' + When not' : ''}`);
		}
		log.info('  ~ projects_services: delete lorem-* links; create the real mapping');
		log.info('dry-run complete. Pass --apply to execute.');
		return;
	}

	if (!url.includes('cms.dev.yesid.dev')) {
		throw new Error(`refusing --apply against non-dev URL '${url}'. Run via op run --env-file=apps/cms/.env -- ... --apply`);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN (run via op run --env-file=apps/cms/.env)');
	try {
		await apply({ directusUrl: url, token });
		log.info('done.');
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `copy load failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[content-services-copy] FAILED:', err);
		process.exit(1);
	});
}
