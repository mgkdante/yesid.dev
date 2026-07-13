import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function clone<T>(value: T): T {
	return structuredClone(value);
}

test('ships a dedicated legal service-area reconciler', () => {
	expect(
		existsSync(
			join(import.meta.dir, '..', 'scripts', 'reconcile-legal-service-area.ts'),
		),
	).toBe(true);
});

test('defaults to dry-run and requires exact confirmation for PROD apply', async () => {
	const subject = await import('../scripts/reconcile-legal-service-area');

	expect(subject.TARGET_URLS).toEqual({
		dev: 'https://cms.dev.yesid.dev',
		prod: 'https://cms.yesid.dev',
	});
	expect(subject.PRE_REMEDIATION_SHA256).toEqual({
		en: 'f316a74023325543f4d732f29bf1091f24b3056d07c6e9efb38e9deee0e3b90a',
		fr: '5c504c1e19cc800bf7328e9c0acddbeeaccc7de6723c49be4f6ab2e67a7165d5',
		es: '3e981259dc65df30e3017f5e70c6d8ad32ac2ee1eb614827f59eebc0a832db79',
	});
	expect(subject.parseCli(['--target=dev'])).toEqual({
		target: 'dev',
		apply: false,
	});
	expect(subject.parseCli(['--target=prod', '--dry-run'])).toEqual({
		target: 'prod',
		apply: false,
	});
	expect(() => subject.parseCli(['--target=prod', '--apply'])).toThrow(
		/APPLY_PROD_LEGAL_SERVICE_AREA/,
	);
	expect(
		subject.parseCli([
			'--target=prod',
			'--apply',
			'--confirm=APPLY_PROD_LEGAL_SERVICE_AREA',
		]),
	).toEqual({ target: 'prod', apply: true });
	expect(subject.parseCli(['--target=dev', '--apply'])).toEqual({
		target: 'dev',
		apply: true,
	});
	expect(() =>
		subject.parseCli(['--target=dev', '--apply', '--dry-run']),
	).toThrow(/choose one/);
});

test('plans three guarded, body-only notice PATCHes and converges', async () => {
	const subject = await import('../scripts/reconcile-legal-service-area');
	const before = Object.fromEntries(
		subject.LOCALES.map((locale) => [
			locale,
			{
				time: 1,
				version: 'test',
				blocks: [
					{
						id: `before-${locale}`,
						type: 'paragraph',
						data: { text: `safe-before-${locale}` },
					},
				],
			},
		]),
	) as Record<(typeof subject.LOCALES)[number], subject.EditorDoc>;
	const accepted = Object.fromEntries(
		subject.LOCALES.map((locale) => [locale, subject.hashEditorDoc(before[locale])]),
	) as Record<(typeof subject.LOCALES)[number], string>;
	const rows = subject.LOCALES.map((locale, index) => ({
		id: index + 1,
		legal_pages_id: 'notice' as const,
		languages_code: locale,
		body: before[locale],
	}));

	const plan = subject.buildPlan({ rows }, accepted);
	expect(plan).toHaveLength(3);
	for (const step of plan) {
		expect(step.method).toBe('PATCH');
		expect(step.path).toBe(`/items/legal_pages_translations/${step.rowId}`);
		expect(Object.keys(step.body)).toEqual(['body']);
		expect(step.body.body).toEqual(subject.desiredServiceAreaDoc(step.locale));
	}
	expect(subject.formatPlan(plan)).toContain('3 content PATCHes');
	expect(subject.formatPlan(plan)).not.toContain('safe-before');

	const converged = {
		rows: rows.map((row) => ({
			...row,
			body: subject.desiredServiceAreaDoc(row.languages_code),
		})),
	};
	expect(subject.buildPlan(converged, accepted)).toEqual([]);
	expect(subject.formatPlan([])).toBe('NO CHANGES');
});

test('rejects unrecognized or malformed live bodies without writes', async () => {
	const subject = await import('../scripts/reconcile-legal-service-area');
	const desiredRows = subject.LOCALES.map((locale, index) => ({
		id: index + 1,
		legal_pages_id: 'notice' as const,
		languages_code: locale,
		body: subject.desiredServiceAreaDoc(locale),
	}));
	const drifted = clone(desiredRows);
	drifted[0]!.body.blocks[0]!.data.text = 'unrelated safe drift';
	expect(() => subject.buildPlan({ rows: drifted })).toThrow(
		/unrecognized pre-remediation body hash for notice.en/,
	);

	const missing = clone(desiredRows);
	missing.pop();
	expect(() => subject.buildPlan({ rows: missing })).toThrow(
		/exactly 3 notice translations/,
	);

	const malformed = clone(desiredRows);
	malformed[0]!.body = '{' as never;
	expect(() => subject.buildPlan({ rows: malformed })).toThrow(/malformed JSON/);
});

test('dry-runs without writes, rereads before every PATCH, and verifies convergence', async () => {
	const subject = await import('../scripts/reconcile-legal-service-area');
	const before = Object.fromEntries(
		subject.LOCALES.map((locale) => [
			locale,
			{
				time: 1,
				version: 'test',
				blocks: [
					{
						id: `before-${locale}`,
						type: 'paragraph',
						data: { text: `safe-before-${locale}` },
					},
				],
			},
		]),
	) as Record<(typeof subject.LOCALES)[number], subject.EditorDoc>;
	const accepted = Object.fromEntries(
		subject.LOCALES.map((locale) => [locale, subject.hashEditorDoc(before[locale])]),
	) as Record<(typeof subject.LOCALES)[number], string>;
	const state = {
		rows: subject.LOCALES.map((locale, index) => ({
			id: index + 1,
			legal_pages_id: 'notice' as const,
			languages_code: locale,
			body: before[locale],
		})),
	};
	const operations: string[] = [];
	let reads = 0;
	const cms = {
		read: async () => {
			reads += 1;
			return clone(state);
		},
		readLegal: async (rowId: number) => {
			operations.push(`GET:${rowId}`);
			return clone(state.rows.find((row) => row.id === rowId)!);
		},
		patch: async (step: subject.ServiceAreaPatch) => {
			operations.push(`PATCH:${step.rowId}`);
			state.rows.find((row) => row.id === step.rowId)!.body = clone(
				step.body.body,
			);
		},
	};

	const output: string[] = [];
	const dryRun = await subject.runReconciliation(
		cms,
		false,
		(line) => output.push(line),
		accepted,
	);
	expect(dryRun).toHaveLength(3);
	expect(operations).toEqual([]);
	expect(output).toEqual([subject.formatPlan(dryRun)]);

	await expect(
		subject.applyAndVerify(cms, dryRun, accepted),
	).resolves.toEqual(dryRun);
	expect(reads).toBe(3);
	expect(operations).toEqual(
		dryRun.flatMap((step) => [`GET:${step.rowId}`, `PATCH:${step.rowId}`]),
	);
	expect(subject.buildPlan(state, accepted)).toEqual([]);
});

test('aborts on concurrent changes and uses exact Directus paths', async () => {
	const subject = await import('../scripts/reconcile-legal-service-area');
	const desiredRows = subject.LOCALES.map((locale, index) => ({
		id: index + 1,
		legal_pages_id: 'notice' as const,
		languages_code: locale,
		body: subject.desiredServiceAreaDoc(locale),
	}));
	const calls: Array<{ method: string; path: string; body?: unknown }> = [];
	const request = async (
		_ctx: unknown,
		method: string,
		path: string,
		body?: unknown,
	) => {
		calls.push({ method, path, body });
		if (method === 'GET') {
			const rowId = path.match(/legal_pages_translations\/(\d+)\?/)?.[1];
			return {
				status: 200,
				json: {
					data:
						rowId === undefined
							? desiredRows
							: desiredRows.find((row) => String(row.id) === rowId),
				},
			};
		}
		return { status: 200, json: { data: {} } };
	};
	const cms = subject.createLegalServiceAreaCms(
		{ directusUrl: subject.TARGET_URLS.dev, token: 'test-only' },
		request,
	);
	await cms.read();
	await cms.readLegal(1);
	await cms.patch({
		kind: 'legal-service-area',
		method: 'PATCH',
		locale: 'en',
		rowId: 1,
		path: '/items/legal_pages_translations/1',
		before: desiredRows[0]!.body,
		body: { body: desiredRows[0]!.body },
	});
	expect(calls).toEqual([
		{ method: 'GET', path: subject.LEGAL_PATH, body: undefined },
		{
			method: 'GET',
			path: '/items/legal_pages_translations/1?fields=id,languages_code,legal_pages_id,body',
			body: undefined,
		},
		{
			method: 'PATCH',
			path: '/items/legal_pages_translations/1',
			body: { body: desiredRows[0]!.body },
		},
	]);
});
