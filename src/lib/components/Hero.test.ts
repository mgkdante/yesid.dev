import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Hero from './Hero.svelte';

const baseProps = {
	heading: 'Digital infrastructure that moves.',
	subheading: 'SQL development and data engineering for teams that need results.'
};

describe('Hero', () => {
	it('renders the heading as an h1', () => {
		render(Hero, { props: baseProps });
		expect(
			screen.getByRole('heading', { level: 1, name: baseProps.heading })
		).toBeInTheDocument();
	});

	it('renders the subheading text', () => {
		render(Hero, { props: baseProps });
		expect(screen.getByText(baseProps.subheading)).toBeInTheDocument();
	});

	it('renders no CTA section when both CTAs are undefined', () => {
		render(Hero, { props: baseProps });
		expect(screen.queryByTestId('hero-ctas')).not.toBeInTheDocument();
	});

	it('renders primary CTA with correct href and label', () => {
		render(Hero, {
			props: { ...baseProps, primaryCta: { label: 'See my work', href: '/work' } }
		});
		const link = screen.getByTestId('hero-primary-cta');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/work');
		expect(link).toHaveTextContent('See my work');
	});

	it('renders secondary CTA with correct href and label', () => {
		render(Hero, {
			props: { ...baseProps, secondaryCta: { label: 'Get in touch', href: '/contact' } }
		});
		const link = screen.getByTestId('hero-secondary-cta');
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/contact');
		expect(link).toHaveTextContent('Get in touch');
	});

	it('renders only primary CTA when secondary is omitted', () => {
		render(Hero, {
			props: { ...baseProps, primaryCta: { label: 'See my work', href: '/work' } }
		});
		expect(screen.getByTestId('hero-primary-cta')).toBeInTheDocument();
		expect(screen.queryByTestId('hero-secondary-cta')).not.toBeInTheDocument();
	});

	it('renders only secondary CTA when primary is omitted', () => {
		render(Hero, {
			props: { ...baseProps, secondaryCta: { label: 'Get in touch', href: '/contact' } }
		});
		expect(screen.getByTestId('hero-secondary-cta')).toBeInTheDocument();
		expect(screen.queryByTestId('hero-primary-cta')).not.toBeInTheDocument();
	});

	it('renders both CTAs when both are provided', () => {
		render(Hero, {
			props: {
				...baseProps,
				primaryCta: { label: 'See my work', href: '/work' },
				secondaryCta: { label: 'Get in touch', href: '/contact' }
			}
		});
		expect(screen.getByTestId('hero-primary-cta')).toBeInTheDocument();
		expect(screen.getByTestId('hero-secondary-cta')).toBeInTheDocument();
	});
});
