import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StackScenarioCard from './StackScenarioCard.svelte';
import type { StackScenario } from '$lib/data/types.js';

const mockScenario: StackScenario = {
	id: 'test-scenario',
	domains: ['data-engineering'],
	recommended: ['postgresql', 'python', 'airflow', 'docker'],
	summary: { en: 'End-to-end data pipeline: ingest, transform, orchestrate, containerize.' },
	relatedProjects: ['transit-data-pipeline'],
};

describe('StackScenarioCard', () => {
	it('renders scenario summary text', () => {
		const { container } = render(StackScenarioCard, { props: { scenario: mockScenario } });
		expect(container.textContent).toContain('End-to-end data pipeline');
	});

	it('renders mini flow with recommended tech names', () => {
		const { getByTestId } = render(StackScenarioCard, { props: { scenario: mockScenario } });
		const flow = getByTestId('scenario-flow');
		expect(flow.textContent).toContain('PostgreSQL');
		expect(flow.textContent).toContain('Python');
	});

	it('renders project badges', () => {
		const { container } = render(StackScenarioCard, { props: { scenario: mockScenario } });
		expect(container.textContent).toContain('Transit Data Pipeline');
	});

	it('renders CTA link to contact', () => {
		const { getByTestId } = render(StackScenarioCard, { props: { scenario: mockScenario } });
		const cta = getByTestId('scenario-cta');
		expect(cta.getAttribute('href')).toBe('/contact');
		expect(cta.textContent).toContain("Let's build this");
	});

	it('renders yesid.dev with special formatting', () => {
		const scenario: StackScenario = {
			...mockScenario,
			relatedProjects: ['yesid-dev'],
		};
		const { container } = render(StackScenarioCard, { props: { scenario } });
		expect(container.textContent).toContain('yesid.dev');
	});

	it('hides project section when no related projects', () => {
		const scenario: StackScenario = {
			...mockScenario,
			relatedProjects: [],
		};
		const { container } = render(StackScenarioCard, { props: { scenario } });
		expect(container.textContent).not.toContain('Proven in');
	});
});
