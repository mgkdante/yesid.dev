import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { applyEntries, captureEntries } from './locale-handoff.svelte';
import Fixture from './_filter-sheet-fixture.svelte';

// slice-34.6 — the mobile filter sheets (BlogFilterMobile / ProjectFilterMobile)
// move their `open` from a local $state into persisted('<page>-filter-sheet',
// false), bound into the bits-ui Collapsible via `bind:open={sheet.value}`. An
// open sheet must stay open across a language switch. These assert the exact key
// names and the open/restore round-trip through the orchestrator.
afterEach(() => cleanup());

describe('slice-34.6 — mobile filter sheet open state survives a switch', () => {
	for (const storageKey of ['blog-filter-sheet', 'projects-filter-sheet']) {
		it(`${storageKey}: defaults closed and registers with the orchestrator`, () => {
			render(Fixture, { props: { storageKey } });
			flushSync();
			expect(captureEntries()[storageKey]).toBe(false);
			expect(screen.getByTestId('sheet-trigger')).toHaveAttribute('aria-expanded', 'false');
		});

		it(`${storageKey}: opening the sheet is captured for the switch`, async () => {
			render(Fixture, { props: { storageKey } });
			flushSync();
			await fireEvent.click(screen.getByTestId('sheet-trigger'));
			expect(screen.getByTestId('sheet-trigger')).toHaveAttribute('aria-expanded', 'true');
			expect(captureEntries()[storageKey]).toBe(true);
		});

		it(`${storageKey}: a restore re-opens the sheet on the remounted page`, () => {
			render(Fixture, { props: { storageKey } });
			flushSync();
			applyEntries({ [storageKey]: true });
			flushSync();
			expect(screen.getByTestId('sheet-trigger')).toHaveAttribute('aria-expanded', 'true');
		});
	}
});
