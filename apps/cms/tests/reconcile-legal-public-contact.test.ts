import { expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function clone<T>(value: T): T {
	return structuredClone(value);
}

test('ships a dedicated legal public-contact reconciler', () => {
	expect(existsSync(join(import.meta.dir, '..', 'scripts', 'reconcile-legal-public-contact.ts'))).toBe(true);
});

test('defaults to dry-run and requires exact confirmation for PROD apply', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		unknown
	>;
	expect(typeof subject.parseCli).toBe('function');
	if (typeof subject.parseCli !== 'function') return;
	const parseCli = subject.parseCli as (argv: string[]) => unknown;

	expect(subject.TARGET_URLS).toEqual({
		dev: 'https://cms.dev.yesid.dev',
		prod: 'https://cms.yesid.dev',
	});
	expect(parseCli(['--target=dev'])).toEqual({ target: 'dev', apply: false });
	expect(parseCli(['--target=prod', '--dry-run'])).toEqual({
		target: 'prod',
		apply: false,
	});
	expect(() => parseCli(['--target=prod', '--apply'])).toThrow(
		/APPLY_PROD_LEGAL_PUBLIC_CONTACT/,
	);
	expect(
		parseCli([
			'--target=prod',
			'--apply',
			'--confirm=APPLY_PROD_LEGAL_PUBLIC_CONTACT',
		]),
	).toEqual({ target: 'prod', apply: true });
	expect(parseCli(['--target=dev', '--apply'])).toEqual({ target: 'dev', apply: true });
	expect(() => parseCli(['--target=dev', '--apply', '--dry-run'])).toThrow(/choose one/);
	expect(() =>
		parseCli(['--target=dev', '--confirm=APPLY_PROD_LEGAL_PUBLIC_CONTACT']),
	).toThrow(/PROD apply/);
	expect(() => parseCli(['--target=staging'])).toThrow(/dev\|prod/);
});

test('plans one body-only PATCH for every previously published legal translation', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	for (const exportName of [
		'buildPlan',
		'desiredContactDoc',
		'previousRevisionContactDoc',
		'formatPlan',
	]) {
		expect(typeof subject[exportName]).toBe('function');
	}
	if (
		typeof subject.buildPlan !== 'function' ||
		typeof subject.desiredContactDoc !== 'function' ||
		typeof subject.previousRevisionContactDoc !== 'function' ||
		typeof subject.formatPlan !== 'function'
	) {
		return;
	}

	expect(subject.LOCALES).toEqual(['en', 'fr', 'es']);
	expect(subject.LEGAL_SLUGS).toEqual([
		'privacy',
		'terms',
		'cookies',
		'accessibility',
		'notice',
	]);
	expect(subject.REVISION_DATES).toEqual({
		privacy: '2026-07-15',
		terms: '2026-07-12',
		cookies: '2026-07-15',
		accessibility: '2026-07-12',
		notice: '2026-07-13',
	});
	expect(subject.LEGAL_PATH).toBe(
		'/items/legal_pages_translations?fields=id,languages_code,legal_pages_id,body&filter[legal_pages_id][_in]=privacy,terms,cookies,accessibility,notice&filter[languages_code][_in]=en,fr,es&sort=legal_pages_id,languages_code&limit=-1',
	);

	let id = 1;
	const rows = subject.LEGAL_SLUGS.flatMap((slug: string) =>
		subject.LOCALES.map((locale: string) => ({
			id: id++,
			legal_pages_id: slug,
			languages_code: locale,
			body: subject.previousRevisionContactDoc(slug, locale),
		})),
	);
	const plan = subject.buildPlan({ rows });
	expect(plan).toHaveLength(15);
	expect(plan.map((step: Record<string, unknown>) => step.kind)).toEqual(
		Array(15).fill('legal'),
	);
	for (const step of plan) {
		expect(step.method).toBe('PATCH');
		expect(step.path).toBe(`/items/legal_pages_translations/${step.rowId}`);
		expect(Object.keys(step.body)).toEqual(['body']);
		expect(JSON.stringify(step.body.body)).toContain('contact@yesid.dev');
		expect(JSON.stringify(step.body.body)).not.toContain('admin@yesid.dev');
		expect(JSON.stringify(step.body.body)).toContain(subject.REVISION_DATES[step.slug]);
	}
	expect(subject.formatPlan(plan)).toContain('15 content PATCHes');

	const converged = {
		rows: rows.map((row: Record<string, any>) => ({
			...row,
			body: subject.desiredContactDoc(row.legal_pages_id, row.languages_code),
		})),
	};
	expect(subject.buildPlan(converged)).toEqual([]);
	expect(subject.formatPlan([])).toBe('NO CHANGES');
});

test('dry-runs without writes, re-reads before apply, and proves convergence', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	for (const exportName of ['applyAndVerify', 'runReconciliation']) {
		expect(typeof subject[exportName]).toBe('function');
	}
	if (
		typeof subject.applyAndVerify !== 'function' ||
		typeof subject.runReconciliation !== 'function'
	) {
		return;
	}

	let id = 1;
	const initial = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
	const state = clone(initial);
	const patches: Array<Record<string, any>> = [];
	const rowOperations: string[] = [];
	let reads = 0;
	const cms = {
		read: async () => {
			reads += 1;
			return clone(state);
		},
		readLegal: async (rowId: number) => {
			rowOperations.push(`GET:${rowId}`);
			return clone(state.rows.find((row) => row.id === rowId)!);
		},
		patch: async (step: Record<string, any>) => {
			rowOperations.push(`PATCH:${step.rowId}`);
			patches.push(clone(step));
			state.rows.find((row) => row.id === step.rowId)!.body = clone(step.body.body);
		},
	};

	const output: string[] = [];
	const dryRun = await subject.runReconciliation(cms, false, (line: string) =>
		output.push(line),
	);
	expect(dryRun).toHaveLength(15);
	expect(patches).toEqual([]);
	expect(output).toEqual([subject.formatPlan(dryRun)]);

	await expect(subject.applyAndVerify(cms, dryRun)).resolves.toEqual(dryRun);
	expect(reads).toBe(3);
	expect(patches).toHaveLength(15);
	expect(rowOperations).toEqual(
		dryRun.flatMap((step: Record<string, any>) => [
			`GET:${step.rowId}`,
			`PATCH:${step.rowId}`,
		]),
	);
	expect(subject.buildPlan(state)).toEqual([]);
});

test('aborts with zero writes when the displayed plan no longer matches the pre-apply re-read', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	expect(typeof subject.applyAndVerify).toBe('function');
	if (typeof subject.applyAndVerify !== 'function') return;

	let id = 1;
	const stale = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
	const displayedPlan = subject.buildPlan(stale);
	const changed = clone(stale);
	changed.rows[0]!.body = subject.desiredContactDoc('privacy', 'en');
	const patches: unknown[] = [];
	const cms = {
		read: async () => clone(changed),
		patch: async (step: unknown) => patches.push(step),
	};

	await expect(subject.applyAndVerify(cms, displayedPlan)).rejects.toThrow(
		/state changed before apply/,
	);
	expect(patches).toEqual([]);
});

test('does not overwrite a concurrent edit made after the global reread and before a later PATCH', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	let id = 1;
	const state = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
	const displayedPlan = subject.buildPlan(state);
	const target = displayedPlan[3]!;
	const patches: Array<Record<string, any>> = [];
	const cms = {
		read: async () => clone(state),
		readLegal: async (rowId: number) => {
			const row = clone(state.rows.find((candidate) => candidate.id === rowId)!);
			if (rowId === target.rowId) {
				row.body.blocks[2]!.data.text = 'concurrent operator edit';
				state.rows.find((candidate) => candidate.id === rowId)!.body = clone(row.body);
			}
			return row;
		},
		patch: async (step: Record<string, any>) => {
			patches.push(clone(step));
			state.rows.find((row) => row.id === step.rowId)!.body = clone(step.body.body);
		},
	};

	await expect(subject.applyAndVerify(cms, displayedPlan)).rejects.toThrow(
		/changed before PATCH/,
	);
	expect(patches.map((step) => step.rowId)).toEqual(
		displayedPlan.slice(0, 3).map((step: Record<string, any>) => step.rowId),
	);
	const preserved = state.rows.find((row) => row.id === target.rowId)!.body;
	expect(preserved.blocks[2]!.data.text).toBe('concurrent operator edit');
	expect(JSON.stringify(preserved)).not.toBe(JSON.stringify(target.body.body));
});

test('rejects mismatched single-row identity or body before sending that PATCH', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	let id = 1;
	const stale = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
	const displayedPlan = subject.buildPlan(stale);
	const first = displayedPlan[0]!;

	for (const mutate of [
		(row: Record<string, any>) => {
			row.id += 100;
		},
		(row: Record<string, any>) => {
			row.legal_pages_id = 'terms';
		},
		(row: Record<string, any>) => {
			row.languages_code = 'fr';
		},
		(row: Record<string, any>) => {
			row.body.blocks[2]!.data.text = 'concurrent operator edit';
		},
	]) {
		const patches: unknown[] = [];
		const cms = {
			read: async () => clone(stale),
			readLegal: async () => {
				const row = clone(stale.rows[0]!);
				mutate(row);
				return row;
			},
			patch: async (step: unknown) => patches.push(step),
		};
		await expect(subject.applyAndVerify(cms, displayedPlan)).rejects.toThrow(
			new RegExp(`${first.slug}\\.${first.locale} changed before PATCH`),
		);
		expect(patches).toEqual([]);
	}
});

test('Directus adapter uses the exact fixed read path and body-only PATCH payload', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	expect(typeof subject.createLegalContactCms).toBe('function');
	if (typeof subject.createLegalContactCms !== 'function') return;

	let id = 1;
	const snapshot = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
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
			if (rowId !== undefined) {
				return {
					status: 200,
					json: { data: snapshot.rows.find((row) => String(row.id) === rowId) },
				};
			}
			return { status: 200, json: JSON.stringify({ data: JSON.stringify(snapshot.rows) }) };
		}
		return { status: 200, json: { data: {} } };
	};
	const cms = subject.createLegalContactCms(
		{ directusUrl: subject.TARGET_URLS.dev, token: 'test-only' },
		request,
	);
	const read = await cms.read();
	const step = subject.buildPlan(read)[0]!;
	expect(typeof cms.readLegal).toBe('function');
	if (typeof cms.readLegal !== 'function') return;
	await cms.readLegal(step.rowId);
	await cms.patch(step);

	expect(calls).toEqual([
		{ method: 'GET', path: subject.LEGAL_PATH, body: undefined },
		{
			method: 'GET',
			path: `/items/legal_pages_translations/${step.rowId}?fields=id,languages_code,legal_pages_id,body`,
			body: undefined,
		},
		{ method: 'PATCH', path: step.path, body: { body: step.body.body } },
	]);
});

test('Directus adapter fails closed on HTTP failures and malformed payloads', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	expect(typeof subject.createLegalContactCms).toBe('function');
	if (typeof subject.createLegalContactCms !== 'function') return;

	const failed = subject.createLegalContactCms(
		{ directusUrl: subject.TARGET_URLS.dev, token: 'test-only' },
		async () => ({ status: 503, json: { errors: [] } }),
	);
	await expect(failed.read()).rejects.toThrow(/legal translation read failed \(503\)/);

	const malformed = subject.createLegalContactCms(
		{ directusUrl: subject.TARGET_URLS.dev, token: 'test-only' },
		async () => ({ status: 200, json: '{' }),
	);
	await expect(malformed.read()).rejects.toThrow(/malformed JSON/);

	const malformedRow = subject.createLegalContactCms(
		{ directusUrl: subject.TARGET_URLS.dev, token: 'test-only' },
		async () => ({ status: 200, json: { data: [] } }),
	);
	expect(typeof malformedRow.readLegal).toBe('function');
	if (typeof malformedRow.readLegal !== 'function') return;
	await expect(malformedRow.readLegal(1)).rejects.toThrow(/malformed legal row 1/);
});

test('fails closed on malformed rows, partial migrations, and unrelated body drift', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	let id = 1;
	const stale = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};

	for (const invalidId of [undefined, null, '', Number.NaN, 0, -1, '1']) {
		const invalid = clone(stale);
		invalid.rows[0]!.id = invalidId as never;
		expect(() => subject.buildPlan(invalid)).toThrow(/invalid legal translation row id/);
	}

	const missing = clone(stale);
	missing.rows.pop();
	expect(() => subject.buildPlan(missing)).toThrow(/exactly 15 legal translations/);

	const duplicateId = clone(stale);
	duplicateId.rows[14]!.id = duplicateId.rows[0]!.id;
	expect(() => subject.buildPlan(duplicateId)).toThrow(
		/duplicate legal translation row id/,
	);

	const duplicateKey = clone(stale);
	duplicateKey.rows[14]!.legal_pages_id = duplicateKey.rows[0]!.legal_pages_id;
	duplicateKey.rows[14]!.languages_code = duplicateKey.rows[0]!.languages_code;
	expect(() => subject.buildPlan(duplicateKey)).toThrow(/duplicate legal translation/);

	const unexpected = clone(stale);
	unexpected.rows[14]!.languages_code = 'de' as never;
	expect(() => subject.buildPlan(unexpected)).toThrow(/unexpected legal translation/);

	const stringified = clone(stale);
	for (const row of stringified.rows) row.body = JSON.stringify(row.body);
	expect(subject.buildPlan(stringified)).toHaveLength(15);

	const malformed = clone(stale);
	malformed.rows[0]!.body = '{';
	expect(() => subject.buildPlan(malformed)).toThrow(/malformed JSON/);

	const unrelated = clone(stale);
	unrelated.rows[0]!.body.blocks[2]!.data.text = 'unrelated public copy edit';
	expect(() => subject.buildPlan(unrelated)).toThrow(/unrelated public legal drift/);

	const internalAddressRegression = clone(stale);
	const textBlock = internalAddressRegression.rows[0]!.body.blocks.find(
		(block: Record<string, any>) =>
			typeof block.data.text === 'string' && block.data.text.includes('contact@yesid.dev'),
	)!;
	textBlock.data.text = textBlock.data.text.replace('contact@yesid.dev', 'admin@yesid.dev');
	expect(() => subject.buildPlan(internalAddressRegression)).toThrow(
		/unrelated public legal drift/,
	);

	const plan = subject.buildPlan(stale);
	expect(() => subject.assertPlanCap([...plan, plan[0]])).toThrow(/patch cap exceeded/);
});

test('reports failed convergence when Directus accepts PATCHes without changing state', async () => {
	const subject = (await import('../scripts/reconcile-legal-public-contact')) as Record<
		string,
		any
	>;
	let id = 1;
	const stale = {
		rows: subject.LEGAL_SLUGS.flatMap((slug: string) =>
			subject.LOCALES.map((locale: string) => ({
				id: id++,
				legal_pages_id: slug,
				languages_code: locale,
				body: subject.previousRevisionContactDoc(slug, locale),
			}))),
	};
	const plan = subject.buildPlan(stale);
	const patches: unknown[] = [];
	const cms = {
		read: async () => clone(stale),
		readLegal: async (rowId: number) =>
			clone(stale.rows.find((row) => row.id === rowId)!),
		patch: async (step: unknown) => patches.push(step),
	};

	await expect(subject.applyAndVerify(cms, plan)).rejects.toThrow(
		/post-apply verification failed: 15 patches remain/,
	);
	expect(patches).toHaveLength(15);
});
