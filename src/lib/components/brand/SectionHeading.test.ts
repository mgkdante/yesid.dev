import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SectionHeading from './SectionHeading.svelte';

describe('SectionHeading', () => {
	it('renders heading text', () => {
		render(SectionHeading, { props: { heading: 'Proof in the data' } });
		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Proof in the data');
	});

	it('renders orange dot after heading', () => {
		const { container } = render(SectionHeading, { props: { heading: 'Proof in the data' } });
		const dot = container.querySelector('[data-slot="section-heading-dot"]');
		expect(dot).toBeTruthy();
		expect(dot?.textContent).toBe('.');
	});

	it('renders mono subheading when provided', () => {
		render(SectionHeading, {
			props: { heading: 'Test', subheading: '// measured impact' }
		});
		const sub = screen.getByText('// measured impact');
		expect(sub).toBeTruthy();
		expect(sub.getAttribute('data-slot')).toBe('section-heading-sub');
	});

	it('does not render subheading when omitted', () => {
		const { container } = render(SectionHeading, { props: { heading: 'Test' } });
		expect(container.querySelector('[data-slot="section-heading-sub"]')).toBeNull();
	});

	it('has data-slot on root', () => {
		const { container } = render(SectionHeading, { props: { heading: 'Test' } });
		expect(container.querySelector('[data-slot="section-heading"]')).toBeTruthy();
	});

	it('renders h2 by default', () => {
		render(SectionHeading, { props: { heading: 'Test' } });
		expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
	});

	it('renders h1 when level={1}', () => {
		render(SectionHeading, { props: { heading: 'Page Title', level: 1 } });
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Page Title');
	});

	it('renders h3 when level={3}', () => {
		render(SectionHeading, { props: { heading: 'Sub', level: 3 } });
		expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Sub');
	});
});
