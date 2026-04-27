import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import IconRenderer from './IconRenderer.svelte';
import type { IconRecord } from '@repo/shared';

// Stub the Directus asset helper — PUBLIC_DIRECTUS_URL is unset in the test env.
// Returns a deterministic URL so assertions can use toContain.
vi.mock('$lib/directus/assets', () => ({
	asset: (id: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
}));

// @iconify/svelte is NOT mocked here. In happy-dom the real Icon component
// renders an SVG element (or nothing if the icon hasn't loaded from the API).
// IconRenderer tests verify the *branching logic* of the renderer component
// (which DOM element class / tag appears) rather than Iconify internals:
//   - svg_override present  → <img> tag
//   - iconify_id only       → neither <img> nor .icon-placeholder (Iconify branch taken)
//   - both null / icon null → .icon-placeholder span
// The aria tests for the Iconify branch are covered separately via
// verifying the props flow (ariaLabel → Icon's aria-label and aria-hidden).

function makeIcon(overrides: Partial<IconRecord> = {}): IconRecord {
	return {
		id: 'postgresql',
		name: 'PostgreSQL',
		iconify_id: 'logos:postgresql',
		svg_override: null,
		...overrides,
	};
}

describe('IconRenderer.svelte', () => {
	it('takes Iconify branch (no <img> or placeholder) when iconify_id is set and svg_override is null', () => {
		const { container } = render(IconRenderer, { icon: makeIcon() });
		// Iconify branch was taken — neither the svg fallback nor the placeholder renders
		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('.icon-placeholder')).toBeNull();
		// Note: in happy-dom the Iconify component may render nothing (icon not loaded
		// from API) — what matters is the correct branch was selected, confirmed by the
		// absence of the other two branches' DOM markers above.
	});

	it('renders <img> when svg_override is set (takes precedence over iconify_id)', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ svg_override: 'uuid-dax-svg-0001', iconify_id: 'logos:whatever' }),
		});
		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.getAttribute('src')).toContain('uuid-dax-svg-0001');
	});

	it('svg_override takes precedence even when iconify_id is also set', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ svg_override: 'uuid-override', iconify_id: 'logos:should-not-render' }),
		});
		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		// No [data-icon] element — Iconify branch was not taken
		expect(container.querySelector('[data-icon]')).toBeNull();
	});

	it('renders placeholder span when icon is null', () => {
		const { container } = render(IconRenderer, { icon: null });
		const placeholder = container.querySelector('.icon-placeholder');
		expect(placeholder).toBeTruthy();
		expect(container.querySelector('img')).toBeNull();
		expect(container.querySelector('[data-icon]')).toBeNull();
	});

	it('renders placeholder span when both iconify_id and svg_override are null (deferred icon)', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ iconify_id: null, svg_override: null }),
		});
		const placeholder = container.querySelector('.icon-placeholder');
		expect(placeholder).toBeTruthy();
	});

	it('placeholder has correct size styles', () => {
		const { container } = render(IconRenderer, {
			icon: null,
			size: 32,
		});
		const placeholder = container.querySelector('.icon-placeholder') as HTMLElement | null;
		expect(placeholder?.style.width).toBe('32px');
		expect(placeholder?.style.height).toBe('32px');
	});

	it('ariaLabel propagates to <img> alt when svg_override is used', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ svg_override: 'uuid-abc' }),
			ariaLabel: 'PostgreSQL logo',
		});
		const img = container.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('PostgreSQL logo');
	});

	it('falls back to icon.name for <img> alt when ariaLabel is not provided', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ name: 'PostgreSQL', svg_override: 'uuid-abc' }),
		});
		const img = container.querySelector('img');
		expect(img?.getAttribute('alt')).toBe('PostgreSQL');
	});

	it('img lazy loading is set', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ svg_override: 'uuid-lazy' }),
		});
		const img = container.querySelector('img');
		expect(img?.getAttribute('loading')).toBe('lazy');
	});

	it('default size is 24', () => {
		const { container } = render(IconRenderer, { icon: null });
		const placeholder = container.querySelector('.icon-placeholder') as HTMLElement | null;
		expect(placeholder?.style.width).toBe('24px');
		expect(placeholder?.style.height).toBe('24px');
	});

	it('Iconify branch not taken when icon is null (placeholder wins)', () => {
		// Regression guard: null icon must never fall into the Iconify branch
		const { container } = render(IconRenderer, { icon: null });
		expect(container.querySelector('.icon-placeholder')).toBeTruthy();
	});

	it('Iconify branch not taken when both iconify_id and svg_override null (deferred 5 icons case)', () => {
		const { container } = render(IconRenderer, {
			icon: makeIcon({ iconify_id: null, svg_override: null }),
		});
		// Must render placeholder, not attempt Iconify render
		expect(container.querySelector('.icon-placeholder')).toBeTruthy();
		expect(container.querySelector('img')).toBeNull();
	});
});
