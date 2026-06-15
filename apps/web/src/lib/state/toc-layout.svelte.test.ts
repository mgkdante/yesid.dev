import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { applyEntries, captureEntries } from './locale-handoff.svelte';
import TableOfContents from '$lib/components/shared/TableOfContents.svelte';

// slice-34.6 — TableOfContents persists its reading layout across a switch:
//   - `toc-open`      : the header collapse, but ONLY when this component owns it
//                       (skipped when the parent drives `syncOpen`);
//   - `toc-collapsed` : the set of collapsed section groups, serialized as a
//                       locale-free string[] (a Set is not a LocaleFree primitive);
//   - `mobileOpen`    : the transient mobile overlay — intentionally NOT persisted.
// A parent h1/h2 only renders its collapse chevron when an h3/h4 child follows it,
// so the fixture headings include a child to surface a toggle.
afterEach(() => cleanup());

const headings = [
	{ id: 'overview', text: 'Overview', level: 2 },
	{ id: 'details', text: 'Details', level: 3 },
	{ id: 'summary', text: 'Summary', level: 2 },
] as const;

describe('slice-34.6 — TableOfContents layout survives a switch', () => {
	it('registers toc-open and an empty toc-collapsed array when it owns the open state', () => {
		render(TableOfContents, { props: { headings, embedded: true } });
		flushSync();
		const entries = captureEntries();
		expect(entries['toc-open']).toBe(true); // startOpen default
		expect(entries['toc-collapsed']).toEqual([]); // serialized as an array, not a Set
	});

	it('does NOT persist toc-open when the parent drives syncOpen', () => {
		render(TableOfContents, { props: { headings, embedded: true, syncOpen: true } });
		flushSync();
		const entries = captureEntries();
		expect('toc-open' in entries).toBe(false);
		// collapsedSections is independent of the parent → still persisted.
		expect(entries['toc-collapsed']).toEqual([]);
	});

	it('collapsing a section group records its id in the persisted array', async () => {
		render(TableOfContents, { props: { headings, embedded: true } });
		flushSync();
		// The 'overview' parent has an h3 child, so it gets a collapse chevron.
		const chevron = screen.getAllByLabelText(/toggle/i)[0]!;
		await fireEvent.click(chevron);
		expect(captureEntries()['toc-collapsed']).toEqual(['overview']);
	});

	it('a restore re-applies the collapsed groups (array → live Set membership)', () => {
		render(TableOfContents, { props: { headings, embedded: true } });
		flushSync();
		// Before restore the child row renders.
		expect(screen.queryByText('Details')).not.toBeNull();
		// The switch carried 'overview' as collapsed → its h3 child hides.
		applyEntries({ 'toc-collapsed': ['overview'] });
		flushSync();
		expect(screen.queryByText('Details')).toBeNull();
	});

	it('does NOT persist the ephemeral mobile overlay state', () => {
		render(TableOfContents, { props: { headings, embedded: false } });
		flushSync();
		expect('mobileOpen' in captureEntries()).toBe(false);
		expect('toc-mobile' in captureEntries()).toBe(false);
	});
});
