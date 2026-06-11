// preview-configs + ProductPreview smoke tests (slice-29 Task 11) — written
// FIRST per TDD. Previews are CRAFTED per archetype (never generated); each
// slot is occupied at render by the archetype tech of its layer (first by
// sort) and carries the occupant's flip id so the blueprint box can morph
// into it.

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { STACK_LAYERS } from '@repo/shared/schemas';
import { PREVIEW_CONFIGS, FRAME_SIZES } from './preview-configs';
import ProductPreview from './ProductPreview.svelte';
import { stackArchetypes } from '$lib/content/stack-archetypes';

const dashboard = stackArchetypes.find((a) => a.slug === 'data-dashboard')!;
const website = stackArchetypes.find((a) => a.slug === 'fast-website')!;

describe('PREVIEW_CONFIGS', () => {
	it('ships a crafted config for each of the 3 launch slugs', () => {
		expect(Object.keys(PREVIEW_CONFIGS).sort()).toEqual([
			'data-dashboard',
			'data-pipeline',
			'fast-website',
		]);
		expect(PREVIEW_CONFIGS['data-dashboard'].frame).toBe('browser');
		expect(PREVIEW_CONFIGS['data-pipeline'].frame).toBe('browser');
		expect(PREVIEW_CONFIGS['fast-website'].frame).toBe('phone');
	});

	it('every slot uses a canonical layer and stays inside its frame', () => {
		for (const config of Object.values(PREVIEW_CONFIGS)) {
			const frame = FRAME_SIZES[config.frame];
			expect(config.slots.length).toBeGreaterThan(0);
			for (const slot of config.slots) {
				expect(STACK_LAYERS).toContain(slot.layer);
				expect(slot.x).toBeGreaterThanOrEqual(0);
				expect(slot.y).toBeGreaterThanOrEqual(0);
				expect(slot.x + slot.w).toBeLessThanOrEqual(frame.w);
				expect(slot.y + slot.h).toBeLessThanOrEqual(frame.h);
			}
		}
	});

	it('dashboard crafts interface, logic, data, and infra slots', () => {
		const layers = new Set(PREVIEW_CONFIGS['data-dashboard'].slots.map((s) => s.layer));
		expect([...layers].sort()).toEqual(['data', 'infra', 'interface', 'logic'].sort());
	});
});

describe('ProductPreview', () => {
	it('renders ≥4 occupied slots for the dashboard seed', () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const preview = screen.getByTestId('product-preview');
		const slots = preview.querySelectorAll('[data-testid^="slot-"]');
		expect(slots.length).toBeGreaterThanOrEqual(4);
		// Every layer's occupant is flip-paired exactly once.
		for (const id of ['sveltekit', 'rest-api', 'postgresql', 'docker']) {
			expect(preview.querySelectorAll(`[data-flip-id="${id}"]`)).toHaveLength(1);
		}
	});

	it('slot labels show the occupant tech name', () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const preview = screen.getByTestId('product-preview');
		expect(preview.textContent).toContain('SvelteKit');
		expect(preview.textContent).toContain('PostgreSQL');
		expect(preview.textContent).toContain('Docker');
	});

	it('tapping a slot toggles the enables caption (en) from the tech module', async () => {
		render(ProductPreview, { props: { archetype: dashboard, animate: false } });
		const slot = screen.getAllByTestId('slot-postgresql')[0];
		await fireEvent.click(slot);
		const caption = screen.getByTestId('enables-postgresql');
		expect(caption.textContent).toContain('stores and queries your data reliably');
		// Tap again — caption toggles away.
		await fireEvent.click(slot);
		expect(screen.queryByTestId('enables-postgresql')).toBeNull();
	});

	it('renders the phone frame for fast-website', () => {
		render(ProductPreview, { props: { archetype: website, animate: false } });
		const preview = screen.getByTestId('product-preview');
		expect(preview.querySelector('.frame-phone')).toBeTruthy();
		expect(preview.textContent).toContain('TypeScript');
	});
});
