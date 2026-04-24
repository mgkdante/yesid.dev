import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackNode from './StackNode.svelte';
import type { TechStackItem } from '$lib/types';

const mockItem: TechStackItem = {
	id: 'postgresql',
	name: 'PostgreSQL',
	layer: 'data',
	domains: ['data-engineering', 'web-development'],
	connectsTo: ['python', 'sveltekit'],
	relatedServices: ['sql-development'],
	relatedProjects: ['yesid-dev'],
	icon: 'postgresql',
	proficiency: 'expert',
};

describe('StackNode', () => {
	it('renders item name', () => {
		const { getByText } = render(StackNode, { props: { item: mockItem } });
		expect(getByText('PostgreSQL')).toBeTruthy();
	});

	it('renders two-letter icon placeholder from name', () => {
		const { container } = render(StackNode, { props: { item: mockItem } });
		const icon = container.querySelector('.node-icon');
		expect(icon?.textContent?.trim()).toBe('PO');
	});

	it('sets data-testid with item id', () => {
		const { container } = render(StackNode, { props: { item: mockItem } });
		expect(container.querySelector('[data-testid="stack-node-postgresql"]')).toBeTruthy();
	});

	it('sets data-layer attribute', () => {
		const { container } = render(StackNode, { props: { item: mockItem } });
		const node = container.querySelector('[data-layer="data"]');
		expect(node).toBeTruthy();
	});

	it('sets data-proficiency attribute', () => {
		const { container } = render(StackNode, { props: { item: mockItem } });
		const node = container.querySelector('[data-proficiency="expert"]');
		expect(node).toBeTruthy();
	});

	it('applies selected class when selected prop is true', () => {
		const { container } = render(StackNode, {
			props: { item: mockItem, selected: true },
		});
		const button = container.querySelector('.stack-node');
		expect(button?.classList.contains('selected')).toBe(true);
	});

	it('applies dimmed class when dimmed prop is true', () => {
		const { container } = render(StackNode, {
			props: { item: mockItem, dimmed: true },
		});
		const button = container.querySelector('.stack-node');
		expect(button?.classList.contains('dimmed')).toBe(true);
	});

	it('calls onclick with item when clicked', async () => {
		const handler = vi.fn();
		const { container } = render(StackNode, {
			props: { item: mockItem, onclick: handler },
		});
		const button = container.querySelector('button')!;
		await fireEvent.click(button);
		expect(handler).toHaveBeenCalledWith(mockItem);
	});

	it('calls onclick on Enter keydown', async () => {
		const handler = vi.fn();
		const { container } = render(StackNode, {
			props: { item: mockItem, onclick: handler },
		});
		const button = container.querySelector('button')!;
		await fireEvent.keyDown(button, { key: 'Enter' });
		expect(handler).toHaveBeenCalledWith(mockItem);
	});

	it('includes proficiency in title attribute', () => {
		const { container } = render(StackNode, { props: { item: mockItem } });
		const button = container.querySelector('button');
		expect(button?.getAttribute('title')).toBe('PostgreSQL — Expert');
	});
});
