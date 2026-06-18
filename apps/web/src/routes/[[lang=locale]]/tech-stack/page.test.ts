// /tech-stack route test (go2/w5 §1) — the "What is a stack?" explainer.
//
// Renders the page with the COMMITTED content module, which has no
// hero.stackExplainer until the orchestrator applies the CMS field and
// regenerates — so this proves the EN fallback path, i.e. exactly what an
// EXPORT_FALLBACKS_SKIP=1 build ships. Never blank.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { PageData } from './$types';
import { techStackItems, techStackPageContent } from '$lib/content/tech-stack';

// PageData merges layout fields the component never reads — cast through
// unknown (house pattern: home.test.ts stubData).
const stubData = {
	items: techStackItems,
	techStackPage: techStackPageContent,
} as unknown as PageData;

describe('/tech-stack stack explainer', () => {
	it('renders stack kicker and engine loading copy from CMS page chrome', () => {
		const cmsData = {
			...stubData,
			techStackPage: {
				...techStackPageContent,
				hero: {
					...techStackPageContent.hero,
					stackKicker: { en: 'CMS stack question' },
					engineLoading: { en: '~ CMS engine loading...' },
					stackExplainer: { en: 'CMS stack explainer.' },
				},
			},
		} as unknown as PageData;

		render(Page, { props: { data: cmsData } });

		expect(screen.getByTestId('stack-explainer').textContent).toContain('CMS stack question');
		expect(screen.getByTestId('stack-engine-loading').textContent).toContain('~ CMS engine loading...');
	});

	it('does not keep old hardcoded stack kicker or loading copy in the route component', () => {
		const source = readFileSync(join(process.cwd(), 'src/routes/[[lang=locale]]/tech-stack/+page.svelte'), 'utf-8');
		expect(source).not.toContain('what\\\'s a "stack"?');
		expect(source).not.toContain('rolling out the drawing board');
	});

	it('renders non-empty from the committed module (byte-identical EN fallback)', () => {
		render(Page, { props: { data: stubData } });
		const explainer = screen.getByTestId('stack-explainer');
		expect(explainer.textContent).toContain('what\'s a "stack"?');
		expect(explainer.textContent).toContain(
			'A "stack" is just the parts list of a piece of software',
		);
		expect(explainer.textContent).toContain('poke the blueprints below and see for yourself');
	});

	it('reads before the machine voice: explainer sits between title and terminal', () => {
		render(Page, { props: { data: stubData } });
		// go2/w5 micro-pass (4f): the trio lives inside the reading column now —
		// assert document order instead of walking a fixed child list.
		const hero = screen.getByTestId('tech-stack-hero');
		const title = hero.querySelector('.hero-title');
		const explainer = hero.querySelector('.stack-explainer');
		const terminal = hero.querySelector('.hero-terminal');
		expect(title).toBeTruthy();
		expect(explainer).toBeTruthy();
		expect(terminal).toBeTruthy();
		const follows = (a: Element, b: Element) =>
			Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
		expect(follows(title!, explainer!)).toBe(true);
		expect(follows(explainer!, terminal!)).toBe(true);
	});
});

// go2/w5 micro-pass (4f) — the two-column control room. Desktop column
// PROPORTIONS are CSS (locked in engine-fullbleed-css.test.ts; happy-dom
// can't compute grids); what the DOM must guarantee is the content SPLIT and
// the source order, because source order IS the mobile stack:
// title → explainer → terminal → count → actions.
describe('/tech-stack control-room hero columns', () => {
	it('reading column holds the teaching copy; readout column stacks terminal above count + actions', () => {
		render(Page, { props: { data: stubData } });
		const main = screen.getByTestId('hero-col-main');
		const side = screen.getByTestId('hero-col-side');
		expect(main.querySelector('.hero-title')).toBeTruthy();
		expect(main.querySelector('.stack-explainer')).toBeTruthy();
		expect(main.querySelector('.hero-terminal')).toBeNull();
		expect(side.querySelector('.hero-terminal')).toBeTruthy();
		expect(side.querySelector('.hero-stats')).toBeTruthy();
		expect(side.querySelector('.hero-actions')).toBeTruthy();
		const terminal = side.querySelector('.hero-terminal')!;
		const stats = side.querySelector('.hero-stats')!;
		expect(
			Boolean(terminal.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING),
		).toBe(true);
		// Source order = mobile stack: title + explainer precede terminal + count + actions.
		expect(
			Boolean(main.compareDocumentPosition(side) & Node.DOCUMENT_POSITION_FOLLOWING),
		).toBe(true);
	});

	it('yellow-conversion rule: get-in-touch wears the signage class; view-services stays standard orange', () => {
		render(Page, { props: { data: stubData } });
		const actions = screen
			.getByTestId('hero-col-side')
			.querySelector('.hero-actions')!;
		const links = [...actions.querySelectorAll('a')];
		expect(links).toHaveLength(2);
		// 'Get In Touch' → /contact, signage yellow via the local class.
		expect(links[0].getAttribute('href')).toContain('/contact');
		expect(links[0].className).toContain('hero-cta-talk');
		// 'View Services' → /services, untouched (orange grammar).
		expect(links[1].getAttribute('href')).toContain('/services');
		expect(links[1].className).not.toContain('hero-cta-talk');
	});
});
