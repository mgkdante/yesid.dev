import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import FilterGroup from './FilterGroup.svelte';

describe('FilterGroup', () => {
	const items = [
		{ key: 'sql', label: 'SQL' },
		{ key: 'python', label: 'Python' },
		{ key: 'svelte', label: 'Svelte' }
	];

	it('renders label and all items plus "All" button', () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, onSelect }
		});
		expect(getByText('Tags')).toBeTruthy();
		expect(getByText('All')).toBeTruthy();
		expect(getByText('SQL')).toBeTruthy();
		expect(getByText('Python')).toBeTruthy();
		expect(getByText('Svelte')).toBeTruthy();
	});

	it('highlights active item', () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'python', onSelect }
		});
		const btn = getByText('Python');
		expect(btn.classList.contains('tag-active')).toBe(true);
	});

	it('calls onSelect with key on click', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, onSelect }
		});
		await fireEvent.click(getByText('SQL'));
		expect(onSelect).toHaveBeenCalledWith('sql');
	});

	it('calls onSelect with null when "All" clicked', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'sql', onSelect }
		});
		await fireEvent.click(getByText('All'));
		expect(onSelect).toHaveBeenCalledWith(null);
	});

	it('deselects active item when allowDeselect is true', async () => {
		const onSelect = vi.fn();
		const { getByText } = render(FilterGroup, {
			props: { label: 'Tags', items, activeKey: 'sql', allowDeselect: true, onSelect }
		});
		await fireEvent.click(getByText('SQL'));
		expect(onSelect).toHaveBeenCalledWith(null);
	});
});
