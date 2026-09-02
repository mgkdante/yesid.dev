import { beforeEach, describe, expect, it, vi } from 'vitest';

const routeMocks = vi.hoisted(() => ({
	adapter: {
		techStack: { all: vi.fn() },
		content: { techStackPage: vi.fn() },
	},
}));

vi.mock('$lib/adapters', () => ({ adapter: routeMocks.adapter }));
vi.mock('$lib/server/prerender-entries', () => ({ localeEntries: [] }));

import { load } from './+page.server';

describe('tech-stack loader payload boundary', () => {
	beforeEach(() => {
		routeMocks.adapter.techStack.all.mockReset();
		routeMocks.adapter.content.techStackPage.mockReset();
	});

	it('returns only the catalog count with the page chrome', async () => {
		const items = [{ slug: 'typescript' }, { slug: 'svelte' }, { slug: 'directus' }];
		const techStackPage = { hero: { titleLine1: { en: 'Tools' } } };
		const pageCache = new Map();
		routeMocks.adapter.techStack.all.mockResolvedValue(items);
		routeMocks.adapter.content.techStackPage.mockResolvedValue(techStackPage);

		const result = await load({
			locals: { pageCache } as unknown as App.Locals,
		});

		expect(routeMocks.adapter.techStack.all).toHaveBeenCalledOnce();
		expect(routeMocks.adapter.content.techStackPage).toHaveBeenCalledOnce();
		expect(routeMocks.adapter.content.techStackPage).toHaveBeenCalledWith({ pageCache });
		expect(result).toEqual({ itemCount: items.length, techStackPage });
		expect(result).not.toHaveProperty('items');
	});
});
