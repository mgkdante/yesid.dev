// GO-day W2 Track 2 (T1): broken utility classes silently render
// transparent/currentColor. This spec greps the source so they can never
// come back. bg-bg-* / border-bg-* / text-text-* map to no @theme token;
// var(--text-light) is defined nowhere.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.svelte')) out.push(p);
	}
	return out;
}

const files = walk(SRC);

const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
	{ pattern: /\bbg-bg-/, reason: 'bg-bg-* is not a token utility (use bg-background / bg-card)' },
	{ pattern: /\bborder-bg-/, reason: 'border-bg-* is not a token utility (use border-border-subtle)' },
	{ pattern: /\btext-text-/, reason: 'text-text-* is not a token utility (use text-secondary-foreground)' },
	{ pattern: /var\(--text-light\)/, reason: '--text-light is undefined (use var(--secondary-foreground))' },
	{ pattern: /var\(--dim-foreground\)|var\(--light-foreground\)/, reason: 'aliases to undefined vars (archived in app.css)' },
];

describe('style regressions — broken utilities & undefined vars', () => {
	for (const { pattern, reason } of FORBIDDEN) {
		it(`no source file matches ${pattern} (${reason})`, () => {
			const hits = files
				.filter((f) => pattern.test(readFileSync(f, 'utf-8')))
				.map((f) => f.replace(SRC, 'src'));
			expect(hits, hits.join('\n')).toEqual([]);
		});
	}
});
