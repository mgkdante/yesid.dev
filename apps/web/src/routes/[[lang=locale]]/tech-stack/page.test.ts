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
		const hero = screen.getByTestId('tech-stack-hero');
		const children = [...hero.children];
		const titleIdx = children.findIndex((el) => el.classList.contains('hero-title'));
		const explainerIdx = children.findIndex((el) =>
			el.classList.contains('stack-explainer'),
		);
		const terminalIdx = children.findIndex((el) => el.classList.contains('hero-terminal'));
		expect(titleIdx).toBeGreaterThanOrEqual(0);
		expect(explainerIdx).toBeGreaterThan(titleIdx);
		expect(terminalIdx).toBeGreaterThan(explainerIdx);
	});
});
