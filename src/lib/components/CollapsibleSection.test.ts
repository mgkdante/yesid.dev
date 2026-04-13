import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import CollapsibleSection from './CollapsibleSection.svelte';

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
