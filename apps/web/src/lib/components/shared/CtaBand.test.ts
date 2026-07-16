import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CtaBand from './CtaBand.svelte';

const cta = {
	heading: { en: 'Build the system\nthat moves', es: 'ES line one\nES line two', fr: 'FR line one\nFR line two' },
	subtitle: { en: 'One shared semantic subtitle.', es: 'ES subtitle', fr: 'FR subtitle' },
	ctaContact: { en: 'Start a project', es: 'ES contact', fr: 'FR contact' },
	ctaGithub: { en: 'Inspect GitHub', es: 'ES GitHub', fr: 'FR GitHub' },
};

const siteMeta = {
	links: { github: 'https://github.com/mgkdante' },
};

describe('CtaBand', () => {
	it('preserves the localized semantic CTA and link behavior', () => {
		render(CtaBand, { props: { cta, siteMeta, testidPrefix: 'proof-cta' } as never });

		const heading = screen.getByRole('heading', { level: 2 });
		const lines = heading.querySelectorAll('.band-line');
		expect(lines).toHaveLength(2);
		expect(lines[0]).toHaveTextContent('Build the system');
		expect(lines[0]).not.toHaveTextContent('.');
		expect(lines[1]).toHaveTextContent('that moves.');
		expect(screen.getByText('One shared semantic subtitle.')).toBeInTheDocument();

		expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact');
		const github = screen.getByRole('link', { name: 'Inspect GitHub' });
		expect(github).toHaveAttribute('href', 'https://github.com/mgkdante');
		expect(github).toHaveAttribute('target', '_blank');
		expect(github).toHaveAttribute('rel', 'noopener');
	});

	it('uses a full-width decorative shell around a transparent capped foreground', () => {
		const { container } = render(CtaBand, {
			props: { cta, siteMeta, testidPrefix: 'proof-cta' } as never,
		});

		const shell = screen.getByTestId('proof-cta');
		expect(shell).toHaveClass('cta-band-shell');
		expect(shell.querySelector(':scope > .cta-band')).toBeInTheDocument();

		const background = screen.getByTestId('cta-blueprint-background');
		expect(background).toHaveAttribute('aria-hidden', 'true');
		expect(background.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
		expect(container.querySelectorAll('[data-testid="cta-blueprint-background"]')).toHaveLength(1);
	});

	it('uses the page background instead of a separate grey band surface', () => {
		const source = readFileSync(resolve(process.cwd(), 'src/lib/components/shared/CtaBand.svelte'), 'utf8');

		expect(source).toContain('background-color: var(--background)');
		expect(source).not.toContain('background-color: var(--muted)');
	});
});
