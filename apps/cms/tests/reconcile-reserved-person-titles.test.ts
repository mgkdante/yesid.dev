import { describe, expect, test } from 'bun:test';
import {
	PROD_CONFIRMATION,
	TITLE_BY_LOCALE,
	applyVerifiedPlan,
	buildPlan,
	createReconcilerFetch,
	parseCli,
	requestData,
	type CmsSnapshot,
	type TitlePatch,
} from '../scripts/reconcile-reserved-person-titles';

function currentSnapshot(): CmsSnapshot {
	return {
		aboutIntro: [
			{ id: 1, languages_code: 'en', title: 'Freelance SQL and Digital Infrastructure Developer' },
			{ id: 2, languages_code: 'fr', title: 'Développeur SQL et en infrastructure numérique, à la pige' },
			{ id: 3, languages_code: 'es', title: 'Desarrollador freelance SQL y de infraestructura digital' },
		],
		aboutContent: [
			{
				id: 1,
				languages_code: 'en',
				meta_title: 'About · yesid.',
				meta_description:
					"Freelance SQL and Digital Infrastructure Developer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
			},
			{
				id: 2,
				languages_code: 'fr',
				meta_title: 'À propos · yesid.',
				meta_description:
					"Développeur SQL et en infrastructure numérique, à la pige, basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
			},
			{
				id: 3,
				languages_code: 'es',
				meta_title: 'Sobre mí · yesid.',
				meta_description:
					'Desarrollador freelance SQL y de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
			},
		],
		siteMeta: [
			{
				id: 7,
				languages_code: 'en',
				description:
					'Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
				default_description:
					'yesid., Freelance SQL and Digital Infrastructure Developer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
				owner_job_title: 'Freelance SQL and Digital Infrastructure Developer',
			},
			{
				id: 8,
				languages_code: 'fr',
				description:
					"Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
				default_description:
					"yesid., Développeur SQL et en infrastructure numérique, à la pige, à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
				owner_job_title: 'Développeur SQL et en infrastructure numérique, à la pige',
			},
			{
				id: 9,
				languages_code: 'es',
				description:
					'Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y sitios web que impulsan. PostgreSQL, dbt, Power BI, SvelteKit.',
				default_description:
					'yesid., Desarrollador freelance SQL y de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y los sitios web que impulsan. Entregado con números.',
				owner_job_title: 'Desarrollador freelance SQL y de infraestructura digital',
			},
		],
		homeRoute: {
			id: 1,
			path: '/',
			translations: [
				{
					id: 20,
					languages_code: 'en',
					title: 'yesid. | Digital Infrastructure that Moves.',
					description: 'Freelance SQL developer and digital infrastructure consultant in Montreal. PostgreSQL, dbt, Power BI, and Python. Real-time pipelines, analytics, dashboards.',
				},
				{
					id: 21,
					languages_code: 'fr',
					title: 'yesid. | Infrastructure numérique qui avance.',
					description: 'Développeur SQL pigiste et consultant en infrastructure numérique à Montréal. PostgreSQL, dbt, Power BI et Python pour pipelines, analyses et tableaux de bord.',
				},
				{
					id: 22,
					languages_code: 'es',
					title: 'yesid. | Infraestructura digital que se mueve.',
					description: 'Desarrollador SQL freelance y consultor de infraestructura digital en Montreal. PostgreSQL, dbt, Power BI, Python. Pipelines en tiempo real, análisis, tableros.',
				},
			],
		},
		aboutRoute: {
			id: 2,
			path: '/about',
			translations: [
				{
					id: 3,
					languages_code: 'en',
					title: 'Freelance SQL and Digital Infrastructure Developer',
					description:
						'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work.',
				},
				{
					id: 4,
					languages_code: 'fr',
					title: 'Développeur SQL et en infrastructure numérique, à la pige',
					description:
						'Consultant en infrastructure numérique basé à Montréal. Expérience en SQL, entrepôts de données et analyses temps réel, disponible pour mandats pigistes.',
				},
				{
					id: 18,
					languages_code: 'es',
					title: 'Desarrollador freelance SQL y de infraestructura digital',
					description:
						'Consultor de infraestructura digital en Montreal. Experiencia en SQL, almacenes de datos y analítica en tiempo real. Disponible para freelance y consultoría.',
				},
			],
		},
		servicesRoute: {
			id: 4,
			path: '/services',
			translations: [
				{
					id: 30,
					languages_code: 'en',
					title: 'Digital Infrastructure Services: Web, Data, Automation',
					description: 'Digital infrastructure services: SQL and PostgreSQL consulting, dbt pipelines, Power BI analytics, Python ETL, and real-time data platforms for growing teams.',
				},
				{
					id: 31,
					languages_code: 'fr',
					title: 'Infrastructure numérique: web, données, automatisation',
					description: "Services d'infrastructure numérique: conseil SQL et PostgreSQL, pipelines dbt, analyses Power BI, ETL Python et plateformes de données temps réel.",
				},
				{
					id: 32,
					languages_code: 'es',
					title: 'Infraestructura digital: web, datos, automatización',
					description: 'Servicios de infraestructura digital: consultoría SQL y PostgreSQL, pipelines dbt, analítica Power BI, ETL en Python y plataformas de datos en tiempo real.',
				},
			],
		},
	};
}

function applyPatch(snapshot: CmsSnapshot, step: TitlePatch): void {
	const collection = step.path.split('/')[2];
	const rowId = Number(step.path.split('/')[3]);
	if (collection === 'block_about_intro_translations') {
		Object.assign(snapshot.aboutIntro.find((row) => row.id === rowId)!, step.body);
		return;
	}
	if (collection === 'block_about_content_translations') {
		Object.assign(snapshot.aboutContent.find((row) => row.id === rowId)!, step.body);
		return;
	}
	if (collection === 'site_meta_translations') {
		Object.assign(snapshot.siteMeta.find((row) => row.id === rowId)!, step.body);
		return;
	}
	if (collection === 'route_seo_translations') {
		const rows = [
			...snapshot.homeRoute.translations,
			...snapshot.aboutRoute.translations,
			...snapshot.servicesRoute.translations,
		];
		Object.assign(rows.find((row) => row.id === rowId)!, step.body);
		return;
	}
	throw new Error(`unexpected collection ${collection}`);
}

describe('outcome-first positioning reconciler', () => {
	test('retries a transient Directus 429 before returning snapshot data', async () => {
		let calls = 0;
		const fetcher = createReconcilerFetch(
			(async () => {
				calls += 1;
				return calls === 1
					? new Response('', { status: 429, headers: { 'retry-after': '0' } })
					: Response.json({ data: [{ id: 1 }] });
			}) as typeof fetch,
			async () => {},
		);
		await expect(requestData('https://cms.example', 'token', '/items/example', fetcher)).resolves.toEqual([
			{ id: 1 },
		]);
		expect(calls).toBe(2);
	});

	test('defaults to dry-run and gates PROD apply with exact confirmation', () => {
		expect(parseCli(['--target=dev'])).toEqual({ target: 'dev', apply: false });
		expect(parseCli(['--target=prod', '--dry-run'])).toEqual({ target: 'prod', apply: false });
		expect(() => parseCli(['--target=prod', '--apply'])).toThrow(PROD_CONFIRMATION);
		expect(
			parseCli(['--target=prod', '--apply', `--confirm=${PROD_CONFIRMATION}`]),
		).toEqual({ target: 'prod', apply: true });
		expect(() =>
			parseCli(['--target=dev', `--confirm=${PROD_CONFIRMATION}`]),
		).toThrow('accepted only for PROD apply');
	});

	test('plans exactly eighteen row-scoped patches across titles and umbrella descriptions', () => {
		const plan = buildPlan(currentSnapshot());
		expect(plan).toHaveLength(18);
		expect(plan.map((step) => step.path)).toEqual([
			'/items/block_about_intro_translations/1',
			'/items/block_about_intro_translations/2',
			'/items/block_about_intro_translations/3',
			'/items/block_about_content_translations/1',
			'/items/block_about_content_translations/2',
			'/items/block_about_content_translations/3',
			'/items/site_meta_translations/7',
			'/items/site_meta_translations/8',
			'/items/site_meta_translations/9',
			'/items/route_seo_translations/20',
			'/items/route_seo_translations/21',
			'/items/route_seo_translations/22',
			'/items/route_seo_translations/3',
			'/items/route_seo_translations/4',
			'/items/route_seo_translations/18',
			'/items/route_seo_translations/30',
			'/items/route_seo_translations/31',
			'/items/route_seo_translations/32',
		]);
		expect(plan[0]?.body).toEqual({ title: TITLE_BY_LOCALE.en });
		expect(plan[1]?.body).toEqual({ title: TITLE_BY_LOCALE.fr });
		expect(plan[2]?.body).toEqual({ title: TITLE_BY_LOCALE.es });
		expect(plan[3]?.body).toEqual({
			meta_description:
				'Digital solutions developer in Montréal helping Québec SMEs connect websites, reports, and workflows through web, automation, analytics, databases, and SQL.',
		});
		expect(plan[4]?.body).toEqual({
			meta_description:
				"Développeur de solutions numériques à la pige à Montréal. J'aide les PME du Québec avec le web, l'automatisation, l'analytique, les bases de données et SQL.",
		});
		expect(plan[5]?.body).toEqual({
			meta_description:
				'Desarrollador freelance de soluciones digitales en Montreal. Ayudo a pymes de Québec con web, automatización, analítica, bases de datos y SQL confiables.',
		});
		for (const step of plan.slice(6, 9)) {
			expect(Object.keys(step.body).sort()).toEqual([
				'default_description',
				'description',
				'owner_job_title',
			]);
		}
		for (const step of plan.slice(9, 12)) expect(Object.keys(step.body)).toEqual(['description']);
		for (const step of plan.slice(12, 15)) {
			expect(Object.keys(step.body).sort()).toEqual(['description', 'title']);
			expect(String(step.body.title).length).toBeLessThanOrEqual(70);
		}
		for (const step of plan.slice(15)) expect(Object.keys(step.body)).toEqual(['description']);
	});

	test('converges to NO CHANGES and refuses unrelated drift', () => {
		const snapshot = currentSnapshot();
		for (const step of buildPlan(snapshot)) applyPatch(snapshot, step);
		expect(buildPlan(snapshot)).toEqual([]);

		const drifted = currentSnapshot();
		drifted.siteMeta[0]!.description = 'Unexpected operator copy';
		expect(() => buildPlan(drifted)).toThrow('unrelated title drift');
	});

	test('re-reads the complete snapshot before every PATCH and proves convergence', async () => {
		const snapshot = currentSnapshot();
		const plan = buildPlan(snapshot);
		let reads = 0;
		const sent: string[] = [];
		const sentCount = await applyVerifiedPlan(plan, {
			readSnapshot: async () => {
				reads += 1;
				return structuredClone(snapshot);
			},
			sendPatch: async (step) => {
				sent.push(step.path);
				applyPatch(snapshot, step);
			},
		});
		expect(sentCount).toBe(plan.length);
		expect(sent).toEqual(plan.map((step) => step.path));
		expect(reads).toBe(plan.length * 2 + 1);
		expect(buildPlan(snapshot)).toEqual([]);
	});

	test('stops immediately when Directus accepts a PATCH without changing state', async () => {
		const snapshot = currentSnapshot();
		const plan = buildPlan(snapshot);
		let writes = 0;
		await expect(
			applyVerifiedPlan(plan, {
				readSnapshot: async () => structuredClone(snapshot),
				sendPatch: async () => {
					writes += 1;
				},
			}),
		).rejects.toThrow('post-PATCH verification failed');
		expect(writes).toBe(1);
	});

	test('treats a later row that concurrently reaches the approved value as a verified no-op', async () => {
		const snapshot = currentSnapshot();
		const plan = buildPlan(snapshot);
		const sent: string[] = [];
		const sentCount = await applyVerifiedPlan(plan, {
			readSnapshot: async () => structuredClone(snapshot),
			sendPatch: async (step) => {
				sent.push(step.path);
				applyPatch(snapshot, step);
				if (step.path === plan[0]?.path) applyPatch(snapshot, plan[1]!);
			},
		});
		expect(sentCount).toBe(plan.length - 1);
		expect(sent).toEqual(plan.filter((step) => step.path !== plan[1]?.path).map((step) => step.path));
		expect(buildPlan(snapshot)).toEqual([]);
	});

	test('aborts before a PATCH when the row changed after planning', async () => {
		const snapshot = currentSnapshot();
		const plan = buildPlan(snapshot);
		snapshot.aboutIntro[0]!.title = 'Changed after planning';
		let writes = 0;
		await expect(
			applyVerifiedPlan(plan, {
				readSnapshot: async () => structuredClone(snapshot),
				sendPatch: async () => {
					writes += 1;
				},
			}),
		).rejects.toThrow('state changed before PATCH');
		expect(writes).toBe(0);
	});
});
