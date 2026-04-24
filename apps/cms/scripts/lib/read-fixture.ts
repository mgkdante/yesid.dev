/**
 * Runtime fixture loader with Zod validation.
 *
 * Added in 18c Task 30 (F7). Alternative to static `import ... with { type:
 * 'json' }` when the caller needs to pick a fixture by path at runtime (e.g.,
 * seed-<collection>.ts CLIs that accept --fixture flags in 18e+).
 *
 * Path is resolved via Bun.file() so relative paths are taken relative to
 * process.cwd() at call time — callers should pass absolute paths for
 * determinism (e.g., new URL('../fixtures/...', import.meta.url).pathname).
 */

import { ZodType } from 'zod';

export async function readFixture<T>(path: string, schema: ZodType<T>): Promise<T> {
	const file = Bun.file(path);
	if (!(await file.exists())) {
		throw new Error(`[read-fixture] file not found: ${path}`);
	}
	let raw: unknown;
	try {
		raw = await file.json();
	} catch (e) {
		throw new Error(
			`[read-fixture] invalid JSON at ${path}: ${(e as Error).message}`,
		);
	}
	const parsed = schema.safeParse(raw);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((i) => `${i.path.join('.')}: ${i.message}`)
			.join('; ');
		throw new Error(`[read-fixture] schema validation failed for ${path}: ${issues}`);
	}
	return parsed.data;
}
