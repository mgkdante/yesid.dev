import { describe, expect, it } from 'bun:test';
import consentDescriptionField from '../directus/snapshot/fields/site_labels_translations/ui_analytics_consent_description.json' with {
	type: 'json',
};
import {
	DESIRED_MAX_LENGTH,
	FIELD_PATH,
	LABELS_PATH,
	LEGAL_PATH,
	LEGAL_SLUGS,
	LOCALES,
	PROD_CONFIRMATION,
	TARGET_URLS,
	applyAndVerify,
	assertPlanCaps,
	buildPlan,
	createAnalyticsCms,
	desiredConsentDescription,
	desiredLegalDoc,
	formatPlan,
	parseCli,
	runReconciliation,
	type AnalyticsCms,
	type FieldDefinition,
	type LegalPatch,
	type LegalRow,
	type LiveSnapshot,
	type ReconciliationPatch,
	type RestRequest,
} from '../scripts/promote-lean-high-intent-analytics';

function clone<T>(value: T): T {
	return structuredClone(value);
}

function convergedSnapshot(): LiveSnapshot {
	let id = 1;
	return {
		field: clone(consentDescriptionField) as FieldDefinition,
		labels: LOCALES.map((locale) => ({
			id: id++,
			languages_code: locale,
			ui_analytics_consent_description: desiredConsentDescription(locale),
		})),
		legal: LEGAL_SLUGS.flatMap((slug) =>
			LOCALES.map((locale) => ({
				id: id++,
				languages_code: locale,
				legal_pages_id: slug,
				body: desiredLegalDoc(slug, locale),
			})),
		),
	};
}

function staleSnapshot(): LiveSnapshot {
	const snapshot = convergedSnapshot();
	snapshot.field.schema.max_length = 255;
	for (const row of snapshot.labels) {
		row.ui_analytics_consent_description = `stale-${row.languages_code}`;
	}
	const indexes = { privacy: [1, 15], cookies: [0, 6] } as const;
	for (const row of snapshot.legal) {
		const body = clone(row.body) as Exclude<LegalRow['body'], string>;
		for (const index of indexes[row.legal_pages_id]) {
			body.blocks[index]!.data.text =
				`stale-${row.legal_pages_id}-${row.languages_code}-${index}`;
		}
		row.body = body;
	}
	return snapshot;
}

describe('lean high-intent analytics snapshot and CLI', () => {
	it('pins only the consent description field capacity at varchar(500)', () => {
		expect(consentDescriptionField.type).toBe('string');
		expect(consentDescriptionField.schema.data_type).toBe('character varying');
		expect(consentDescriptionField.schema.max_length).toBe(500);
	});

	it('defaults to dry-run and pins both CMS URLs', () => {
		expect(parseCli(['--target=dev'])).toEqual({ target: 'dev', apply: false });
		expect(parseCli(['--target=prod', '--dry-run'])).toEqual({
			target: 'prod',
			apply: false,
		});
		expect(TARGET_URLS).toEqual({
			dev: 'https://cms.dev.yesid.dev',
			prod: 'https://cms.yesid.dev',
		});
	});

	it('requires the exact PROD apply confirmation and rejects irrelevant flags', () => {
		expect(() => parseCli(['--target=prod', '--apply'])).toThrow(
			new RegExp(PROD_CONFIRMATION),
		);
		expect(
			parseCli([
				'--target=prod',
				'--apply',
				`--confirm=${PROD_CONFIRMATION}`,
			]),
		).toEqual({ target: 'prod', apply: true });
		expect(parseCli(['--target=dev', '--apply'])).toEqual({
			target: 'dev',
			apply: true,
		});
		expect(() =>
			parseCli(['--target=dev', '--apply', '--dry-run']),
		).toThrow(/choose one/);
		expect(() =>
			parseCli(['--target=dev', `--confirm=${PROD_CONFIRMATION}`]),
		).toThrow(/PROD apply/);
		expect(() => parseCli(['--target=staging'])).toThrow(/dev\|prod/);
	});
});

describe('lean high-intent analytics plan', () => {
	it('plans exactly one schema PATCH followed by nine content PATCHes', () => {
		const plan = buildPlan(staleSnapshot());
		expect(plan).toHaveLength(10);
		expect(plan.map((step) => step.kind)).toEqual([
			'schema',
			'label',
			'label',
			'label',
			'legal',
			'legal',
			'legal',
			'legal',
			'legal',
			'legal',
		]);
		expect(plan[0]).toEqual({
			kind: 'schema',
			method: 'PATCH',
			path: FIELD_PATH,
			body: { schema: { max_length: 500 } },
		});
		for (const step of plan.slice(1, 4)) {
			expect(step.kind).toBe('label');
			expect(Object.keys(step.body)).toEqual([
				'ui_analytics_consent_description',
			]);
		}
		for (const step of plan.slice(4)) {
			expect(step.kind).toBe('legal');
			expect(Object.keys(step.body)).toEqual(['body']);
		}
		expect(formatPlan(plan)).toContain('1 schema + 9 content PATCHes');
	});

	it('converges to NO CHANGES and accepts only the known live-only field keys', () => {
		const snapshot = convergedSnapshot();
		(snapshot.field.meta as Record<string, unknown>).id = 999;
		(snapshot.field.schema as Record<string, unknown>).comment = null;
		(snapshot.field.schema as Record<string, unknown>).foreign_key_schema = null;
		expect(buildPlan(snapshot)).toEqual([]);
		expect(formatPlan([])).toBe('NO CHANGES');
	});

	it('rejects an unknown max length and unrelated schema/interface drift', () => {
		const unknownWidth = convergedSnapshot();
		unknownWidth.field.schema.max_length = 499;
		expect(() => buildPlan(unknownWidth)).toThrow(/unexpected field max_length/);

		const drift = convergedSnapshot();
		drift.field.meta.interface = 'textarea';
		expect(() => buildPlan(drift)).toThrow(/unrelated schema or interface drift/);
	});

	it('rejects missing and duplicate label or legal rows', () => {
		const missingLabel = convergedSnapshot();
		missingLabel.labels.pop();
		expect(() => buildPlan(missingLabel)).toThrow(/exactly 3 consent-label/);

		const duplicateLabel = convergedSnapshot();
		duplicateLabel.labels[2] = {
			...duplicateLabel.labels[0]!,
			id: 999,
		};
		expect(() => buildPlan(duplicateLabel)).toThrow(/duplicate or unexpected consent locale/);

		const missingLegal = convergedSnapshot();
		missingLegal.legal.pop();
		expect(() => buildPlan(missingLegal)).toThrow(/exactly 6 legal/);

		const duplicateLegal = convergedSnapshot();
		duplicateLegal.legal[5] = { ...duplicateLegal.legal[0]!, id: 999 };
		expect(() => buildPlan(duplicateLegal)).toThrow(/duplicate legal row/);
	});

	it('rejects malformed label and legal row IDs before planning any write', () => {
		for (const invalidId of [undefined, null, '', Number.NaN, 0, -1]) {
			const invalidLabel = staleSnapshot();
			invalidLabel.labels[0]!.id = invalidId as never;
			expect(() => buildPlan(invalidLabel)).toThrow(/invalid consent-label row id/);

			const invalidLegal = staleSnapshot();
			invalidLegal.legal[0]!.id = invalidId as never;
			expect(() => buildPlan(invalidLegal)).toThrow(/invalid legal row id/);
		}
	});

	it('accepts stringified editor documents and rejects malformed or unrelated legal drift', () => {
		const stringified = convergedSnapshot();
		for (const row of stringified.legal) row.body = JSON.stringify(row.body);
		expect(buildPlan(stringified)).toEqual([]);

		const malformed = convergedSnapshot();
		malformed.legal[0]!.body = '{';
		expect(() => buildPlan(malformed)).toThrow(/malformed JSON/);

		const wrongCount = convergedSnapshot();
		(clone(wrongCount.legal[0]!.body) as Exclude<LegalRow['body'], string>).blocks.pop();
		const shortBody = clone(wrongCount.legal[0]!.body) as Exclude<
			LegalRow['body'],
			string
		>;
		shortBody.blocks.pop();
		wrongCount.legal[0]!.body = shortBody;
		expect(() => buildPlan(wrongCount)).toThrow(/must have 45 blocks/);

		const unrelated = convergedSnapshot();
		const body = clone(unrelated.legal[0]!.body) as Exclude<
			LegalRow['body'],
			string
		>;
		body.blocks[2]!.data.text = 'unrelated operator edit';
		unrelated.legal[0]!.body = body;
		expect(() => buildPlan(unrelated)).toThrow(/unrelated legal drift/);
	});

	it('enforces one schema and nine content PATCH caps', () => {
		const plan = buildPlan(staleSnapshot());
		const schema = plan[0]!;
		const label = plan[1]!;
		expect(() => assertPlanCaps([schema, schema])).toThrow(/patch cap exceeded/);
		expect(() => assertPlanCaps(Array(10).fill(label))).toThrow(
			/patch cap exceeded/,
		);
	});
});

function statefulCms(initial: LiveSnapshot): {
	cms: AnalyticsCms;
	patches: ReconciliationPatch[];
	state: LiveSnapshot;
} {
	const state = clone(initial);
	const patches: ReconciliationPatch[] = [];
	return {
		state,
		patches,
		cms: {
			read: async () => clone(state),
			readLegal: async (rowId) =>
				clone(state.legal.find((row) => String(row.id) === String(rowId))!),
			patch: async (step) => {
				patches.push(clone(step));
				if (step.kind === 'schema') {
					state.field.schema.max_length = DESIRED_MAX_LENGTH;
				} else if (step.kind === 'label') {
					state.labels.find((row) => row.id === step.rowId)!.ui_analytics_consent_description =
						step.body.ui_analytics_consent_description;
				} else {
					state.legal.find((row) => row.id === step.rowId)!.body = clone(
						step.body.body,
					);
				}
			},
		},
	};
}

describe('lean high-intent analytics apply verification', () => {
	it('runs a stale dry-run and a converged dry-run with zero PATCHes', async () => {
		for (const initial of [staleSnapshot(), convergedSnapshot()]) {
			const { cms, patches } = statefulCms(initial);
			const output: string[] = [];
			const plan = await runReconciliation(cms, false, (line) => output.push(line));
			expect(patches).toEqual([]);
			expect(output).toEqual([formatPlan(plan)]);
		}
	});

	it('re-reads, applies schema first, and proves convergence', async () => {
		const before = staleSnapshot();
		const plan = buildPlan(before);
		const { cms, patches, state } = statefulCms(before);
		await expect(applyAndVerify(cms, plan)).resolves.toEqual(plan);
		expect(patches).toHaveLength(10);
		expect(patches[0]!.kind).toBe('schema');
		expect(buildPlan(state)).toEqual([]);
	});

	it('aborts with zero writes if state changes before apply', async () => {
		const displayed = buildPlan(staleSnapshot());
		const changed = staleSnapshot();
		changed.labels[0]!.ui_analytics_consent_description =
			desiredConsentDescription(changed.labels[0]!.languages_code);
		const { cms, patches } = statefulCms(changed);
		await expect(applyAndVerify(cms, displayed)).rejects.toThrow(
			/state changed before apply/,
		);
		expect(patches).toEqual([]);
	});

	it('checks each whole legal document immediately before PATCH', async () => {
		const before = staleSnapshot();
		const displayed = buildPlan(before);
		const { cms, patches } = statefulCms(before);
		const originalReadLegal = cms.readLegal;
		let changed = false;
		cms.readLegal = async (rowId) => {
			const row = await originalReadLegal(rowId);
			if (!changed) {
				changed = true;
				const body = clone(row.body) as Exclude<LegalRow['body'], string>;
				body.blocks[2]!.data.text = 'concurrent edit';
				row.body = body;
			}
			return row;
		};
		await expect(applyAndVerify(cms, displayed)).rejects.toThrow(
			/changed before PATCH/,
		);
		expect(patches.filter((step) => step.kind === 'legal')).toEqual([]);
	});

	it('fails if writes do not converge', async () => {
		const before = staleSnapshot();
		const plan = buildPlan(before);
		const patches: ReconciliationPatch[] = [];
		const cms: AnalyticsCms = {
			read: async () => clone(before),
			readLegal: async (rowId) =>
				clone(before.legal.find((row) => row.id === rowId)!),
			patch: async (step) => {
				patches.push(clone(step));
			},
		};
		await expect(applyAndVerify(cms, plan)).rejects.toThrow(
			/post-apply verification failed/,
		);
		expect(patches).toHaveLength(10);
	});
});

describe('lean high-intent analytics Directus adapter', () => {
	it('uses the exact GET paths and exact PATCH bodies', async () => {
		const snapshot = staleSnapshot();
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const request: RestRequest = async (_ctx, method, path, body) => {
			calls.push({ method, path, body });
			if (method === 'PATCH') return { status: 200, json: { data: {} } };
			if (path === FIELD_PATH) {
				return { status: 200, json: JSON.stringify({ data: snapshot.field }) };
			}
			if (path === LABELS_PATH) {
				return {
					status: 200,
					json: { data: JSON.stringify(snapshot.labels) },
				};
			}
			if (path === LEGAL_PATH) {
				return { status: 200, json: { data: snapshot.legal } };
			}
			const id = path.match(/legal_pages_translations\/(\d+)\?/)?.[1];
			return {
				status: 200,
				json: { data: snapshot.legal.find((row) => String(row.id) === id) },
			};
		};
		const cms = createAnalyticsCms(
			{ directusUrl: TARGET_URLS.dev, token: 'test-only' },
			request,
		);
		const read = await cms.read();
		const plan = buildPlan(read);
		const schema = plan.find((step) => step.kind === 'schema')!;
		const label = plan.find((step) => step.kind === 'label')!;
		const legal = plan.find((step) => step.kind === 'legal') as LegalPatch;
		await cms.patch(schema);
		await cms.patch(label);
		await cms.readLegal(legal.rowId);
		await cms.patch(legal);

		expect(calls.slice(0, 3).map(({ method, path }) => ({ method, path }))).toEqual([
			{ method: 'GET', path: FIELD_PATH },
			{ method: 'GET', path: LABELS_PATH },
			{ method: 'GET', path: LEGAL_PATH },
		]);
		expect(calls[3]).toEqual({
			method: 'PATCH',
			path: FIELD_PATH,
			body: { schema: { max_length: 500 } },
		});
		expect(calls[4]!.body).toEqual({
			ui_analytics_consent_description: desiredConsentDescription('en'),
		});
		expect(calls[5]!.path).toBe(
			`/items/legal_pages_translations/${legal.rowId}?fields=id,languages_code,legal_pages_id,body`,
		);
		expect(calls[6]).toEqual({
			method: 'PATCH',
			path: legal.path,
			body: { body: desiredLegalDoc(legal.slug, legal.locale) },
		});
	});

	it('fails closed on HTTP failures and malformed/string JSON', async () => {
		const failed = createAnalyticsCms(
			{ directusUrl: TARGET_URLS.dev, token: 'test-only' },
			async () => ({ status: 503, json: { errors: [] } }),
		);
		await expect(failed.read()).rejects.toThrow(/field read failed \(503\)/);

		const malformed = createAnalyticsCms(
			{ directusUrl: TARGET_URLS.dev, token: 'test-only' },
			async () => ({ status: 200, json: '{' }),
		);
		await expect(malformed.read()).rejects.toThrow(/malformed JSON/);
	});
});
