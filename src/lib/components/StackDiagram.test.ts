import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackDiagram from './StackDiagram.svelte';
import type { TechStackItem } from '$lib/data/types.js';

// Minimal items spanning multiple layers for layout testing
const mockItems: TechStackItem[] = [
	{
		id: 'postgresql',
		name: 'PostgreSQL',
		layer: 'data',
		domains: ['data-engineering'],
		connectsTo: ['python'],
		relatedServices: [],
		relatedProjects: [],
		icon: 'postgresql',
		proficiency: 'expert',
	},
	{
		id: 'python',
		name: 'Python',
		layer: 'backend',
		domains: ['data-engineering'],
		connectsTo: [],
		relatedServices: [],
		relatedProjects: [],
		icon: 'python',
		proficiency: 'expert',
	},
	{
		id: 'sveltekit',
		name: 'SvelteKit',
		layer: 'frontend',
		domains: ['web-development'],
		connectsTo: [],
		relatedServices: [],
		relatedProjects: [],
		icon: 'sveltekit',
		proficiency: 'proficient',
	},
	{
		id: 'docker',
		name: 'Docker',
		layer: 'devops',
		domains: ['devops-infra'],
		connectsTo: [],
		relatedServices: [],
		relatedProjects: [],
		icon: 'docker',
		proficiency: 'proficient',
	},
];

describe('StackDiagram', () => {
	it('renders the diagram container', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		expect(container.querySelector('[data-testid="stack-diagram"]')).toBeTruthy();
	});

	it('renders all items as StackNode components', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		for (const item of mockItems) {
			expect(container.querySelector(`[data-testid="stack-node-${item.id}"]`)).toBeTruthy();
		}
	});

	it('renders desktop tier rows for each occupied layer', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const desktop = container.querySelector('[data-testid="diagram-desktop"]');
		// 4 items in 4 different layers = 4 tier rows
		const tiers = desktop?.querySelectorAll('.tier-row');
		expect(tiers?.length).toBe(4);
	});

	it('renders tier labels matching layer names', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const desktop = container.querySelector('[data-testid="diagram-desktop"]');
		const labels = desktop?.querySelectorAll('.tier-label');
		const labelTexts = Array.from(labels ?? []).map((el) => el.textContent?.trim());
		// Order: devops, frontend, backend, data (display order, only occupied layers)
		expect(labelTexts).toContain('DEVOPS');
		expect(labelTexts).toContain('FRONTEND');
		expect(labelTexts).toContain('BACKEND');
		expect(labelTexts).toContain('DATA');
	});

	it('places nodes in correct tier rows', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const dataTier = container.querySelector('[data-testid="tier-data"]');
		expect(dataTier?.querySelector('[data-testid="stack-node-postgresql"]')).toBeTruthy();

		const frontendTier = container.querySelector('[data-testid="tier-frontend"]');
		expect(frontendTier?.querySelector('[data-testid="stack-node-sveltekit"]')).toBeTruthy();
	});

	it('skips layers with no items', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const desktop = container.querySelector('[data-testid="diagram-desktop"]');
		// 'mobile', 'api', 'analytics', 'testing', 'systems' have no items
		expect(desktop?.querySelector('[data-testid="tier-mobile"]')).toBeNull();
		expect(desktop?.querySelector('[data-testid="tier-api"]')).toBeNull();
		expect(desktop?.querySelector('[data-testid="tier-systems"]')).toBeNull();
	});

	it('renders mobile accordion sections', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const mobile = container.querySelector('[data-testid="diagram-mobile"]');
		// Each occupied layer gets a CollapsibleSection
		const sections = mobile?.querySelectorAll('.section-card');
		expect(sections?.length).toBe(4);
	});

	it('mobile accordion sections start collapsed', () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const mobile = container.querySelector('[data-testid="diagram-mobile"]');
		const bodies = mobile?.querySelectorAll('.section-body');
		// All should start collapsed (no .expanded class)
		for (const body of Array.from(bodies ?? [])) {
			expect(body.classList.contains('expanded')).toBe(false);
		}
	});

	it('mobile accordion expands on click', async () => {
		const { container } = render(StackDiagram, { props: { items: mockItems } });
		const mobile = container.querySelector('[data-testid="diagram-mobile"]');
		const buttons = mobile?.querySelectorAll('button');
		// Click the first accordion header
		if (buttons?.[0]) {
			await fireEvent.click(buttons[0]);
		}
		const firstBody = mobile?.querySelector('.section-body');
		expect(firstBody?.classList.contains('expanded')).toBe(true);
	});

	it('renders with empty items array without crashing', () => {
		const { container } = render(StackDiagram, { props: { items: [] } });
		expect(container.querySelector('[data-testid="stack-diagram"]')).toBeTruthy();
		// No tier rows when no items
		const desktop = container.querySelector('[data-testid="diagram-desktop"]');
		expect(desktop?.querySelectorAll('.tier-row').length).toBe(0);
	});

	it('calls onselect when a node is clicked', async () => {
		const handler = vi.fn();
		const { container } = render(StackDiagram, {
			props: { items: mockItems, onselect: handler },
		});
		const node = container.querySelector('[data-testid="stack-node-postgresql"]') as HTMLElement;
		await fireEvent.click(node);
		expect(handler).toHaveBeenCalledWith(mockItems[0]);
	});

	it('calls onselect(null) when selected node clicked again', async () => {
		const handler = vi.fn();
		const { container } = render(StackDiagram, {
			props: { items: mockItems, selectedId: 'postgresql', onselect: handler },
		});
		const node = container.querySelector('[data-testid="stack-node-postgresql"]') as HTMLElement;
		await fireEvent.click(node);
		expect(handler).toHaveBeenCalledWith(null);
	});

	it('dims non-connected nodes when selectedId is set', () => {
		const { container } = render(StackDiagram, {
			props: { items: mockItems, selectedId: 'postgresql' },
		});

		// PostgreSQL connects to Python — both should NOT be dimmed
		const pgNode = container.querySelector('[data-testid="stack-node-postgresql"]');
		expect(pgNode?.classList.contains('dimmed')).toBe(false);
		const pyNode = container.querySelector('[data-testid="stack-node-python"]');
		expect(pyNode?.classList.contains('dimmed')).toBe(false);

		// SvelteKit and Docker are not connected — should be dimmed
		const svNode = container.querySelector('[data-testid="stack-node-sveltekit"]');
		expect(svNode?.classList.contains('dimmed')).toBe(true);
		const dkNode = container.querySelector('[data-testid="stack-node-docker"]');
		expect(dkNode?.classList.contains('dimmed')).toBe(true);
	});

	it('marks selected node via selectedId prop', () => {
		const { container } = render(StackDiagram, {
			props: { items: mockItems, selectedId: 'postgresql' },
		});
		const pgNode = container.querySelector('[data-testid="stack-node-postgresql"]');
		expect(pgNode?.classList.contains('selected')).toBe(true);
	});
});
