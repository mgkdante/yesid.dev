import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { ctaContent, siteMeta } from '#lib/content/index.ts';
import CtaBand from './CtaBand.svelte';

describe('CtaBand', () => {
	it('preserves the localized semantic CTA and link behavior', () => {
		render(CtaBand, { props: { testidPrefix: 'proof-cta' } });

		const heading = screen.getByRole('heading', { level: 2 });
		const lines = heading.querySelectorAll('.band-line');
		const headingLines = ctaContent.heading.en.split('\n');
		expect(lines).toHaveLength(headingLines.length);
		headingLines.forEach((line, i) => {
			expect(lines[i].textContent).toBe(line + (i === headingLines.length - 1 ? '.' : ''));
		});
		expect(screen.getByText(ctaContent.subtitle.en)).toBeInTheDocument();

		expect(screen.getByRole('link', { name: ctaContent.ctaContact.en })).toHaveAttribute('href', '/contact');
		const github = screen.getByRole('link', { name: ctaContent.ctaGithub.en });
		expect(github).toHaveAttribute('href', siteMeta.links.github);
		expect(github).toHaveAttribute('target', '_blank');
		expect(github).toHaveAttribute('rel', 'noopener');
	});

	it('uses a full-width decorative shell around a transparent capped foreground', () => {
		const { container } = render(CtaBand, {
			props: { testidPrefix: 'proof-cta' },
		});

		const shell = screen.getByTestId('proof-cta');
		expect(shell).toHaveClass('cta-band-shell');
		expect(shell.querySelector(':scope > .cta-band')).toBeInTheDocument();

		const background = screen.getByTestId('cta-blueprint-background');
		expect(background).toHaveAttribute('aria-hidden', 'true');
		expect(background.querySelector('a, button, input, select, textarea, [tabindex]')).toBeNull();
		expect(container.querySelectorAll('[data-testid="cta-blueprint-background"]')).toHaveLength(1);
	});

});
