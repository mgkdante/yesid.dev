import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SkillsJourney from './SkillsJourney.svelte';

describe('SkillsJourney', () => {
	it('renders the journey container', () => {
		render(SkillsJourney);
		expect(screen.getByTestId('skills-journey')).toBeInTheDocument();
	});

	it('renders a panel for each data entry', () => {
		render(SkillsJourney);
		const panels = screen.getAllByTestId(/^journey-panel-/);
		expect(panels.length).toBeGreaterThanOrEqual(4);
	});

	it('renders the CTA prompt panel', () => {
		render(SkillsJourney);
		expect(screen.getByTestId('journey-cta-prompt')).toBeInTheDocument();
	});

	it('renders the CTA button linking to /contact', () => {
		render(SkillsJourney);
		const btn = screen.getByTestId('journey-cta-button');
		expect(btn).toBeInTheDocument();
		expect(btn.closest('a')).toHaveAttribute('href', '/contact');
	});

	it('renders skill icons in each panel', () => {
		render(SkillsJourney);
		const skills = screen.getAllByTestId(/^journey-skill-/);
		expect(skills.length).toBeGreaterThanOrEqual(4);
	});

	it('renders panel labels', () => {
		render(SkillsJourney);
		expect(screen.getByText('01 — FOUNDATION')).toBeInTheDocument();
		expect(screen.getByText('02 — ROUTES')).toBeInTheDocument();
	});
});
