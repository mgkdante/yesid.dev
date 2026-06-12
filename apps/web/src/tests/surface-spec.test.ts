// GO-W2.2 T3: the Constitution Section 13 card spec was hand-copied into 3
// files. This spec pins all three to the shared tokens so they can't drift.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), 'utf-8');

const CARD_FILES = [
	'src/lib/components/ui/card/card.svelte',
	'src/lib/components/home/HomeServices.svelte',
	'src/lib/components/home/FeaturedProjects.svelte',
];

describe('surface spec — one card spec, defined once', () => {
	// GO2-W5: surface-1 now aliases var(--card) in tokens.json (the
	// "panel lifts off the board" flip); ui/card consumes the canonical
	// surface-2 alias, the home card families keep surface-1 — both resolve
	// to the same solid card token, so the single-spec guarantee holds.
	// Round 3: the shared card spec draws the brand grid at 2px.
	for (const f of CARD_FILES) {
		it(`${f} consumes a card surface alias + border-brand tokens`, () => {
			const src = read(f);
			expect(src).toMatch(/background: var\(--surface-[12]\);/);
			expect(src).toContain('border: 2px solid var(--border-brand);');
			expect(src).toContain('border-color: var(--border-brand-active);');
		});
	}

	it('surface-1 and surface-2 both alias the solid card token (tokens.css)', () => {
		const tokensCss = read('src/lib/styles/tokens.css');
		expect(tokensCss).toContain('--surface-1: var(--card);');
		expect(tokensCss).toContain('--surface-2: var(--card);');
	});

	it('HomeServices icon zone gradient is tokenized (no #1f1f1f/#161616)', () => {
		const src = read('src/lib/components/home/HomeServices.svelte');
		expect(src).not.toMatch(/#1f1f1f|#161616/);
	});

	it('TocPill sheets use the shadow-sheet token', () => {
		expect(read('src/lib/components/projects/ProjectTocPill.svelte')).toContain('var(--shadow-sheet)');
		expect(read('src/lib/components/blog/BlogTocPill.svelte')).toContain('var(--shadow-sheet)');
	});

	it('ServiceBadge hover does not use a border token as background', () => {
		expect(read('src/lib/components/projects/ServiceBadge.svelte')).not.toContain('background-color: var(--border-strong)');
	});

	it('BlogRow tag chip uses valid color-mix (no {accentColor}NN hex-alpha-on-var)', () => {
		expect(read('src/lib/components/blog/BlogRow.svelte')).not.toMatch(/\{accentColor\}\d{2}/);
	});
});
