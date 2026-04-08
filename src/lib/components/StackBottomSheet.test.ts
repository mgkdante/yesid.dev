import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StackBottomSheet from './StackBottomSheet.svelte';
import type { TechStackItem } from '$lib/data/types.js';

const mockItems: TechStackItem[] = [
	{
		id: 'postgresql',
		name: 'PostgreSQL',
		layer: 'data',
		domains: ['data-engineering'],
		connectsTo: ['python'],
		relatedServices: [],
		relatedProjects: ['yesid-dev'],
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
];

const mockContent = '## What it is\n\nA relational database.\n';

describe('StackBottomSheet', () => {
	it('renders the bottom sheet', () => {
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(container.querySelector('[data-testid="stack-bottomsheet"]')).toBeTruthy();
	});

	it('displays item name', () => {
		const { getByText } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(getByText('PostgreSQL')).toBeTruthy();
	});

	it('displays proficiency badge', () => {
		const { getByText } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(getByText('Expert')).toBeTruthy();
	});

	it('renders markdown content', () => {
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const body = container.querySelector('[data-testid="bottomsheet-content"]');
		expect(body?.querySelector('h2')).toBeTruthy();
	});

	it('calls onclose when close button clicked', async () => {
		const handler = vi.fn();
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: handler,
				onnavigate: vi.fn(),
			},
		});
		const closeBtn = container.querySelector('[data-testid="bottomsheet-close"]') as HTMLElement;
		await fireEvent.click(closeBtn);
		expect(handler).toHaveBeenCalledOnce();
	});

	it('calls onclose when backdrop clicked', async () => {
		const handler = vi.fn();
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: handler,
				onnavigate: vi.fn(),
			},
		});
		const backdrop = container.querySelector('[data-testid="bottomsheet-backdrop"]') as HTMLElement;
		await fireEvent.click(backdrop);
		expect(handler).toHaveBeenCalledOnce();
	});

	it('shows next item name in nav button', () => {
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const navBtns = container.querySelectorAll('.nav-btn');
		// First item — prev should be disabled, next should show "Python"
		expect((navBtns[0] as HTMLButtonElement).disabled).toBe(true);
		expect(navBtns[1]?.textContent).toContain('Python');
	});

	it('disables prev button for first item', () => {
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const prevBtn = container.querySelector('.nav-btn') as HTMLButtonElement;
		expect(prevBtn.disabled).toBe(true);
	});

	it('disables next button for last item', () => {
		const { container } = render(StackBottomSheet, {
			props: {
				item: mockItems[2],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		const navBtns = container.querySelectorAll('.nav-btn');
		expect((navBtns[1] as HTMLButtonElement).disabled).toBe(true);
	});

	it('shows project badges when available', () => {
		const { getByText } = render(StackBottomSheet, {
			props: {
				item: mockItems[0],

				items: mockItems,
				onclose: vi.fn(),
				onnavigate: vi.fn(),
			},
		});
		expect(getByText('yesid.dev')).toBeTruthy();
	});
});
