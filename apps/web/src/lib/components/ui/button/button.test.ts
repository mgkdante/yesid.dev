import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ButtonTest from './ButtonTest.svelte';

describe('Button (ui/button)', () => {
	it('renders a button by default', () => {
		const { container } = render(ButtonTest, { props: { text: 'Click me' } });
		expect(container.querySelector('button')).toBeTruthy();
		expect(container.querySelector('a')).toBeNull();
	});

	it('renders an anchor when href is provided', () => {
		const { container } = render(ButtonTest, { props: { text: 'Go', href: '/contact' } });
		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link!.getAttribute('href')).toBe('/contact');
		expect(container.querySelector('button')).toBeNull();
	});

	it('renders text content', () => {
		render(ButtonTest, { props: { text: 'Send message' } });
		expect(screen.getByText('Send message')).toBeTruthy();
	});

	it('defaults to type="button"', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test' } });
		const btn = container.querySelector('button')!;
		expect(btn.getAttribute('type')).toBe('button');
	});

	it('applies cta-sm size classes', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', size: 'cta-sm' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('px-5');
		expect(btn.className).toContain('font-semibold');
	});

	it('applies cta size classes', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', size: 'cta' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('px-6');
		expect(btn.className).toContain('font-semibold');
	});

	it('applies cta-lg size classes', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', size: 'cta-lg' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('px-8');
		expect(btn.className).toContain('font-semibold');
	});

	it('applies outline variant classes', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', variant: 'outline' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('bg-transparent');
	});

	it('supports disabled state', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', disabled: true } });
		const btn = container.querySelector('button')!;
		expect(btn.disabled).toBe(true);
	});

	it('applies default variant with brand size compound classes', () => {
		const { container } = render(ButtonTest, { props: { text: 'Test', variant: 'default', size: 'cta' } });
		const btn = container.querySelector('button')!;
		// Compound variant adds hover effects for CTA buttons
		expect(btn.className).toContain('bg-primary');
	});

	// Round 5c YELLOW-CONVERSION doctrine: yellow buttons = "talk to Yesid"
	// conversion actions only. The variant must carry the theme-invariant
	// signage pair (accent ground / signage-bg ink) + accent-system hover.
	it('applies conversion variant signage classes (yellow ground, signage ink, accent hover)', () => {
		const { container } = render(ButtonTest, { props: { text: 'Talk', variant: 'conversion', size: 'cta' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('bg-accent');
		expect(btn.className).toContain('text-signage-bg');
		expect(btn.className).toContain('hover:bg-accent-hover');
		expect(btn.className).not.toContain('bg-primary');
	});

	it('conversion CTAs lift on hover like default CTAs (compound variant)', () => {
		const { container } = render(ButtonTest, { props: { text: 'Talk', variant: 'conversion', size: 'cta-lg' } });
		const btn = container.querySelector('button')!;
		expect(btn.className).toContain('hover:-translate-y-px');
	});
});
