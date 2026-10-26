// WS10-041: a page shipped TWO <main> landmarks in production — the
// route wrapped its own <main> inside the one +layout.svelte already renders.
// A `main` may not descend from another `main`, and two main landmarks break
// landmark navigation for assistive tech (axe landmark-no-duplicate-main +
// landmark-main-is-top-level). The layout owns the page landmark for EVERY
// route, so no .svelte file other than +layout.svelte may open a <main>.
//
// This is a source pin rather than a DOM assertion so it covers all route
// files at once and fails on the file that reintroduces the tag, not on
// whichever e2e spec happens to walk the page next. (src/error.html is a
// standalone static document with its own single landmark — out of scope,
// which is why the walk is .svelte-only.)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'src');
const LAYOUT = 'routes/+layout.svelte';

function svelteFiles(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir).sort()) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) svelteFiles(path, out);
		else if (path.endsWith('.svelte')) out.push(path);
	}
	return out;
}


describe('page landmark — exactly one <main>, owned by the root layout', () => {
	it('opens a <main> in +layout.svelte and nowhere else', () => {
		const openers = svelteFiles(SRC)
			.map((path) => ({
				path: relative(SRC, path).replaceAll('\\', '/'),
				count: (readFileSync(path, 'utf-8').match(/<main[\s>]/g) ?? []).length,
			}))
			.filter(({ count }) => count > 0);

		expect(
			openers.map(({ path, count }) => `${path} × ${count}`),
			'only routes/+layout.svelte may open a <main> landmark',
		).toEqual([`${LAYOUT} × 1`]);
	});
});
