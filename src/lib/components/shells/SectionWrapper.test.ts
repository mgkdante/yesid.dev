import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import SectionWrapper from './SectionWrapper.svelte';

describe('SectionWrapper', () => {
	it('renders a section element with data-slot', () => {
		const { container } = render(SectionWrapper);
		const el = container.querySelector('[data-slot="section-wrapper"]');
		expect(el).toBeTruthy();
		expect(el?.tagName).toBe('SECTION');
	});

	it('applies layout pattern as data attribute', () => {
		const { container } = render(SectionWrapper, { props: { layout: 'split' } });
		const el = container.querySelector('[data-slot="section-wrapper"]');
		expect(el?.getAttribute('data-layout')).toBe('split');
	});

	it('defaults to centered layout', () => {
		const { container } = render(SectionWrapper);
		const el = container.querySelector('[data-slot="section-wrapper"]');
		expect(el?.getAttribute('data-layout')).toBe('centered');
	});

	it('applies container as data attribute', () => {
		const { container } = render(SectionWrapper, { props: { container: 'wide' } });
		const content = container.querySelector('[data-container]');
		expect(content?.getAttribute('data-container')).toBe('wide');
	});

	it('defaults to none container (unconstrained)', () => {
		const { container } = render(SectionWrapper);
		const content = container.querySelector('[data-container]');
		expect(content?.getAttribute('data-container')).toBe('none');
	});

	it('applies fullHeight class when prop is true', () => {
		const { container } = render(SectionWrapper, { props: { fullHeight: true } });
		const el = container.querySelector('[data-slot="section-wrapper"]');
		expect(el?.classList.contains('full-height')).toBe(true);
	});

	it('accepts custom class', () => {
		const { container } = render(SectionWrapper, { props: { class: 'my-section' } });
		const el = container.querySelector('[data-slot="section-wrapper"]');
		expect(el?.classList.contains('my-section')).toBe(true);
	});

	it('renders content area', () => {
		const { container } = render(SectionWrapper);
		const content = container.querySelector('.section-content');
		expect(content).toBeTruthy();
	});
});
