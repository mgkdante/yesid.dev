// FeaturedProjects: the focused card is stored with persisted('featured-card'),
// so it survives a remount. Embla's scroll restore runs in onEmblaInit, which
// can't fire in happy-dom (no layout engine); the Playwright spec covers it. These
// tests cover the counter reflecting the stored value.
//
// Render shape mirrors FeaturedProjects.test.ts (CMS-decoupling precedent).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { flushSync } from 'svelte';
import { render, screen, cleanup } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
import { proofReelContent } from '#lib/content/site-content.ts';
import { getFeaturedProjects } from '#lib/projects/static-helpers.ts';
import { getVisibleServices } from '#lib/services/static-helpers.ts';
import type { Project } from '#lib/types.ts';
import { persisted } from '@yesid/ui/state';

vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
	assetImage: (id: string, preset?: string) => ({
		src: `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	}),
}));

const resolvedProjects: readonly Project[] = getFeaturedProjects();
const services = getVisibleServices();
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects, services };

function currentCounter(): HTMLElement {
	const el = screen.getByTestId('proof-count').querySelector<HTMLElement>('.proof-count-current');
	expect(el, 'position counter must render').not.toBeNull();
	return el!;
}

afterEach(() => cleanup());

describe('FeaturedProjects (remount)', () => {
	it('starts on the first card on a cold mount', () => {
		render(FeaturedProjects, { props: renderProps });
		flushSync();
		expect(currentCounter().textContent).toBe('01');
	});

	it('keeps the focused card across a remount', () => {
		const restoredIndex = Math.max(0, resolvedProjects.length - 1);
		persisted<number>('featured-card', 0).value = restoredIndex;

		render(FeaturedProjects, { props: renderProps });
		flushSync();
		expect(currentCounter().textContent).toBe(String(restoredIndex + 1).padStart(2, '0'));
	});
});
