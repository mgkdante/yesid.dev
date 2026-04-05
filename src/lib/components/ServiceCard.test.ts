import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ServiceCard from './ServiceCard.svelte';

describe('ServiceCard', () => {
	it('renders title and description', () => {
		render(ServiceCard, {
			props: { title: 'SQL Development', description: 'Write and optimize SQL queries.' }
		});
		expect(screen.getByText('SQL Development')).toBeInTheDocument();
		expect(screen.getByText('Write and optimize SQL queries.')).toBeInTheDocument();
	});

	it('renders the icon placeholder when icon is provided', () => {
		render(ServiceCard, {
			props: { title: 'Pipelines', description: 'Build data pipelines.', icon: 'pipeline' }
		});
		expect(screen.getByTestId('service-icon')).toBeInTheDocument();
		expect(screen.getByTestId('service-icon')).toHaveTextContent('pipeline');
	});

	it('does not render icon container when icon is omitted', () => {
		render(ServiceCard, { props: { title: 'Analytics', description: 'Dashboards and reports.' } });
		expect(screen.queryByTestId('service-icon')).not.toBeInTheDocument();
	});

	it('uses article element for semantic markup', () => {
		render(ServiceCard, { props: { title: 'Tuning', description: 'Optimize queries.' } });
		expect(screen.getByTestId('service-card').tagName).toBe('ARTICLE');
	});

	it('uses h3 for the title', () => {
		render(ServiceCard, { props: { title: 'Reporting', description: 'Build reports.' } });
		expect(screen.getByRole('heading', { level: 3, name: 'Reporting' })).toBeInTheDocument();
	});
});
