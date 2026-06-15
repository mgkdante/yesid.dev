import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { applyEntries, captureEntries } from './locale-handoff.svelte';
import Fixture from './_collapsible-section-key-fixture.svelte';

// slice-34.6 (Reading layout) — CollapsibleSection gains an optional `sectionKey`.
// When set, the section's open/closed state is registered with the locale-handoff
// orchestrator (via persisted), seeded with the `open` prop as the per-slot
// default, so it survives the {#key pathname} remount on a language switch. When
// absent, the plain $bindable `open` is the source of truth and NOTHING registers
// (existing call sites are unchanged). These prove all three contracts.
afterEach(() => cleanup());

describe('slice-34.6 — CollapsibleSection sectionKey open-state handoff', () => {
	it('registers the keyed open state with the orchestrator, seeded from the default', () => {
		render(Fixture, { props: { sectionKey: 'fixture-proj-section', open: true } });
		flushSync(); // run the persisted() registration $effect

		// The per-slot default (open=true) is what the orchestrator would capture.
		expect(captureEntries()['fixture-proj-section']).toBe(true);
	});

	it('captures the toggled state so a switch carries the collapse', async () => {
		render(Fixture, { props: { sectionKey: 'fixture-proj-toggle', open: true } });
		flushSync();
		expect(captureEntries()['fixture-proj-toggle']).toBe(true);

		// Collapse via the header trigger (the whole-card click path routes here too).
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });
		await fireEvent.click(trigger);

		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(captureEntries()['fixture-proj-toggle']).toBe(false);
	});

	it('an orchestrator restore drives the open state back onto the remounted section', async () => {
		// Mounts with the default open=true...
		render(Fixture, { props: { sectionKey: 'fixture-proj-restore', open: true } });
		flushSync();
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		// ...then the afterNavigate restore pushes a carried `false` through the setter.
		applyEntries({ 'fixture-proj-restore': false });
		flushSync();
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('honours a closed (open=false) per-slot default — the mobile glance panel case', () => {
		render(Fixture, { props: { sectionKey: 'fixture-glance-mobile', open: false } });
		flushSync();
		expect(captureEntries()['fixture-glance-mobile']).toBe(false);
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('registers NOTHING when no sectionKey is supplied (existing call sites unchanged)', () => {
		render(Fixture, { props: { open: true } });
		flushSync();
		// No key was registered — the registry has no fixture entry, and the section
		// still renders open (the $bindable default).
		const entries = captureEntries();
		expect(Object.keys(entries).some((k) => k.startsWith('fixture-'))).toBe(false);
		const trigger = screen.getByRole('button', { name: /Fixture Section/i });
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
	});
});
