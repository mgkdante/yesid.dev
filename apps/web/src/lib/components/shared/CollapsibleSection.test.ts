import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import CollapsibleSection from './CollapsibleSection.svelte';

// Body content with non-interactive prose + interactive children, for the
// whole-card toggling contract (GO2-W5 final batch 6d).
const bodyContent = createRawSnippet(() => ({
	render: () => `<div>
		<p data-testid="body-text">Plain prose body</p>
		<button type="button" data-testid="body-button">Child action</button>
		<span role="button" tabindex="0" data-testid="body-rolebutton">Faux button</span>
		<a href="/projects" data-testid="body-link">Child link</a>
	</div>`,
}));

describe('CollapsibleSection', () => {
	it('renders title and children when open', () => {
		const { getByText } = render(CollapsibleSection, {
			props: { title: 'Overview', open: true }
		});
		expect(getByText('Overview')).toBeTruthy();
	});

	it('renders numbered badge when index is provided', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Step', open: true, index: 0 }
		});
		const badge = container.querySelector('[aria-hidden="true"]');
		expect(badge?.textContent?.trim()).toBe('01');
	});

	it('toggles body visibility on button click when collapsible', async () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Test', open: true, collapsible: true }
		});
		const button = container.querySelector('button');
		expect(button).toBeTruthy();
		const body = container.querySelector('.section-body');
		expect(body?.getAttribute('data-state')).toBe('open');
		await fireEvent.click(button!);
		expect(body?.getAttribute('data-state')).toBe('closed');
	});

	it('renders as div (not button) when collapsible is false', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Static', open: true, collapsible: false }
		});
		const button = container.querySelector('button');
		expect(button).toBeNull();
		const chevron = container.querySelector('.section-chevron');
		expect(chevron).toBeNull();
	});

	it('uses custom accent color via CSS variable', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Yellow', open: true, accentColor: '#FFB627' }
		});
		const card = container.querySelector('.section-card') as HTMLElement;
		// Accent color is set as --accent CSS custom property for hover effects
		expect(card.style.getPropertyValue('--accent')).toBe('#FFB627');
	});
});

describe('CollapsibleSection — whole-card toggling (GO2-W5 final batch 6d)', () => {
	it('toggles from a click anywhere on the non-interactive card body', async () => {
		const { container, getByTestId } = render(CollapsibleSection, {
			props: { title: 'Card', open: true, children: bodyContent }
		});
		const body = container.querySelector('.section-body');
		expect(body?.getAttribute('data-state')).toBe('open');

		// Click on plain prose inside the body → collapses.
		await fireEvent.click(getByTestId('body-text'));
		expect(body?.getAttribute('data-state')).toBe('closed');

		// Click on the bare card surface → expands again.
		const card = container.querySelector('[data-slot="card"]') as HTMLElement;
		await fireEvent.click(card);
		expect(body?.getAttribute('data-state')).toBe('open');
	});

	it('clicks originating from interactive children never toggle', async () => {
		const { container, getByTestId } = render(CollapsibleSection, {
			props: { title: 'Card', open: true, children: bodyContent }
		});
		const body = container.querySelector('.section-body');
		expect(body?.getAttribute('data-state')).toBe('open');

		await fireEvent.click(getByTestId('body-button'));
		expect(body?.getAttribute('data-state')).toBe('open');

		await fireEvent.click(getByTestId('body-rolebutton'));
		expect(body?.getAttribute('data-state')).toBe('open');
	});

	it('header click toggles exactly ONCE (card handler must not re-toggle it)', async () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Card', open: true, children: bodyContent }
		});
		const header = container.querySelector('button.section-header') as HTMLElement;
		const body = container.querySelector('.section-body');

		await fireEvent.click(header);
		expect(body?.getAttribute('data-state')).toBe('closed');
		await fireEvent.click(header);
		expect(body?.getAttribute('data-state')).toBe('open');
	});

	it('keyboard semantics unchanged: header stays the real button carrying aria-expanded', async () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Card', open: true, children: bodyContent }
		});
		// The semantic toggle is still a native <button> (Enter/Space built in,
		// bits-ui aria wiring) — the card surface is a pointer convenience only.
		const header = container.querySelector('button.section-header') as HTMLElement;
		expect(header).toBeTruthy();
		expect(header.getAttribute('aria-expanded')).toBe('true');

		await fireEvent.click(header);
		expect(header.getAttribute('aria-expanded')).toBe('false');

		// The card div itself must NOT claim button semantics.
		const card = container.querySelector('[data-slot="card"]') as HTMLElement;
		expect(card.getAttribute('role')).toBeNull();
		expect(card.classList.contains('section-card--toggleable')).toBe(true);
	});

	it('non-collapsible cards opt out of the whole-card affordance', () => {
		const { container } = render(CollapsibleSection, {
			props: { title: 'Static', open: true, collapsible: false, children: bodyContent }
		});
		const card = container.querySelector('[data-slot="card"]') as HTMLElement;
		expect(card.classList.contains('section-card--toggleable')).toBe(false);
	});
});
