import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import TagList from './TagList.svelte';

describe('TagList', () => {
	it('renders all tags', () => {
		render(TagList, { props: { tags: ['postgresql', 'python', 'etl'] } });
		expect(screen.getByText('postgresql')).toBeInTheDocument();
		expect(screen.getByText('python')).toBeInTheDocument();
		expect(screen.getByText('etl')).toBeInTheDocument();
	});

	it('renders nothing when tags is empty', () => {
		render(TagList, { props: { tags: [] } });
		expect(screen.queryByTestId('tag-list')).not.toBeInTheDocument();
	});

	it('renders nothing when tags prop is omitted', () => {
		render(TagList);
		expect(screen.queryByTestId('tag-list')).not.toBeInTheDocument();
	});

	it('renders a single tag correctly', () => {
		render(TagList, { props: { tags: ['sql'] } });
		expect(screen.getByText('sql')).toBeInTheDocument();
		// Should still be a list for screen readers
		expect(screen.getByRole('list')).toBeInTheDocument();
	});

	it('uses list semantics for accessibility', () => {
		render(TagList, { props: { tags: ['a', 'b'] } });
		const list = screen.getByRole('list');
		const items = screen.getAllByRole('listitem');
		expect(list).toBeInTheDocument();
		expect(items).toHaveLength(2);
	});
});
