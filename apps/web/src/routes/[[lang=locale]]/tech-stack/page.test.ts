// /tech-stack route test (go2/w5 §1) — the "What is a stack?" explainer.
//
// Renders the page with the COMMITTED content module, which has no
// hero.stackExplainer until the orchestrator applies the CMS field and
// regenerates — so this proves the EN fallback path, i.e. exactly what an
// EXPORT_FALLBACKS_SKIP=1 build ships. Never blank.

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
	it('reading column holds title + explainer + terminal; readout column holds count + actions', () => {
		render(Page, { props: { data: stubData } });
		const main = screen.getByTestId('hero-col-main');
		const side = screen.getByTestId('hero-col-side');
		expect(main.querySelector('.hero-title')).toBeTruthy();
		expect(main.querySelector('.stack-explainer')).toBeTruthy();
		expect(main.querySelector('.hero-terminal')).toBeTruthy();
		expect(side.querySelector('.hero-stats')).toBeTruthy();
		expect(side.querySelector('.hero-actions')).toBeTruthy();
		// Source order = mobile stack: the reading column precedes the readout.
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
