import { describe, expect, test } from 'bun:test';
import {
	PROD_CONFIRMATION,
	TITLE_BY_LOCALE,
	applyVerifiedPlan,
	buildPlan,
	parseCli,
	type CmsSnapshot,
	type TitlePatch,
} from '../scripts/reconcile-reserved-person-titles';

function currentSnapshot(): CmsSnapshot {
	return {
		aboutIntro: [
			{ id: 1, languages_code: 'en', title: 'Freelance Digital Infrastructure Engineer' },
			{ id: 2, languages_code: 'fr', title: 'Ingénieur en infrastructure numérique, à la pige' },
			{ id: 3, languages_code: 'es', title: 'Ingeniero freelance de infraestructura digital' },
		],
		aboutContent: [
			{
				id: 1,
				languages_code: 'en',
				meta_title: 'About · yesid.',
				meta_description:
					"Freelance digital infrastructure engineer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
			},
			{
				id: 2,
				languages_code: 'fr',
				meta_title: 'À propos · yesid.',
				meta_description:
					"Ingénieur pigiste en infrastructure numérique basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
			},
			{
				id: 3,
				languages_code: 'es',
				meta_title: 'Sobre mí · yesid.',
				meta_description:
					'Ingeniero freelance de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
			},
		],
		siteMeta: [
			{
				id: 7,
				languages_code: 'en',
				description:
					'Freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power, PostgreSQL, dbt, Power BI, SvelteKit.',
				default_description:
					'yesid., freelance digital infrastructure engineer in Montreal. Databases, pipelines, dashboards, and the websites they power. Shipped with numbers.',
				owner_job_title: 'Freelance Digital Infrastructure Engineer',
			},
			{
				id: 8,
				languages_code: 'fr',
				description:
					"Ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler, PostgreSQL, dbt, Power BI, SvelteKit.",
				default_description:
					"yesid., ingénieur d'infrastructure numérique pigiste à Montréal. Bases de données, pipelines, tableaux de bord et les sites web qu'ils font rouler. Livré avec des chiffres.",
				owner_job_title: 'Ingénieur pigiste en infrastructure numérique',
			},
			{
				id: 9,
				languages_code: 'es',
				description:
					'Ingeniero freelance de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y sitios web que impulsan. PostgreSQL, dbt, Power BI, SvelteKit.',
				default_description:
					'yesid., ingeniero freelance de infraestructura digital en Montreal. Bases de datos, pipelines, tableros y los sitios web que impulsan. Entregado con números.',
				owner_job_title: 'Ingeniero independiente en infraestructura digital',
			},
		],
		aboutRoute: {
			id: 2,
			path: '/about',
			translations: [
				{
					id: 3,
					languages_code: 'en',
					title: 'Yesid, Digital Infrastructure Engineer in Montreal',
					description:
						'Montreal-based digital infrastructure consultant. Background in SQL, data warehousing, and real-time analytics. Available for freelance and consulting work.',
				},
				{
					id: 4,
					languages_code: 'fr',
					title: 'Yesid, ingénieur en infrastructure numérique à Montréal',
					description:
						'Consultant en infrastructure numérique basé à Montréal. Expérience en SQL, entrepôts de données et analyses temps réel, disponible pour mandats pigistes.',
				},
				{
					id: 18,
					languages_code: 'es',
					title: 'Yesid, ingeniero de infraestructura digital en Montreal',
					description:
						'Consultor de infraestructura digital en Montreal. Experiencia en SQL, almacenes de datos y analítica en tiempo real. Disponible para freelance y consultoría.',
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
		Object.assign(snapshot.aboutRoute.translations.find((row) => row.id === rowId)!, step.body);
		return;
	}
	throw new Error(`unexpected collection ${collection}`);
}

describe('reserved person-title reconciler', () => {
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

	test('plans exactly twelve row-scoped patches for eighteen approved title leaves', () => {
		const plan = buildPlan(currentSnapshot());
		expect(plan).toHaveLength(12);
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
			'/items/route_seo_translations/3',
			'/items/route_seo_translations/4',
			'/items/route_seo_translations/18',
		]);
		expect(plan[0]?.body).toEqual({ title: TITLE_BY_LOCALE.en });
		expect(plan[1]?.body).toEqual({ title: TITLE_BY_LOCALE.fr });
		expect(plan[2]?.body).toEqual({ title: TITLE_BY_LOCALE.es });
		expect(plan[3]?.body).toEqual({
			meta_description:
				"Freelance SQL and Digital Infrastructure Developer based in Montréal. PostgreSQL, SQL Server, Python, Power BI, building reliable infrastructure for teams that can't afford downtime.",
		});
		expect(plan[4]?.body).toEqual({
			meta_description:
				"Développeur SQL et en infrastructure numérique, à la pige, basé à Montréal. PostgreSQL, SQL Server, Python, Power BI, je bâtis de l'infrastructure fiable pour les équipes qui n'ont pas les moyens d'avoir des pannes.",
		});
		expect(plan[5]?.body).toEqual({
			meta_description:
				'Desarrollador freelance SQL y de infraestructura digital en Montreal. PostgreSQL, SQL Server, Python, Power BI. Sistemas confiables para equipos que no toleran caídas.',
		});
		for (const step of plan.slice(6, 9)) {
			expect(Object.keys(step.body).sort()).toEqual([
				'default_description',
				'description',
				'owner_job_title',
			]);
		}
		for (const step of plan.slice(9)) {
			expect(Object.keys(step.body)).toEqual(['title']);
			expect(String(step.body.title).length).toBeLessThanOrEqual(70);
		}
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
		await applyVerifiedPlan(plan, {
			readSnapshot: async () => {
				reads += 1;
				return structuredClone(snapshot);
			},
			sendPatch: async (step) => {
				sent.push(step.path);
				applyPatch(snapshot, step);
			},
		});
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
		await applyVerifiedPlan(plan, {
			readSnapshot: async () => structuredClone(snapshot),
			sendPatch: async (step) => {
				sent.push(step.path);
				applyPatch(snapshot, step);
				if (step.path === plan[0]?.path) applyPatch(snapshot, plan[1]!);
			},
		});
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
