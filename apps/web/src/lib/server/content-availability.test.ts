import { describe, expect, it } from 'vitest';
import { projects } from '#lib/content/projects.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { llmsTxt, llmsFullTxt } from './llms';
import { projectEntries, ogProjectSlugs } from './prerender-entries';
import { _buildSitemapEntries } from '../../routes/sitemap.xml/+server';

describe('project availability across crawler surfaces', () => {
	it('labels wip entries in both llms files, leaving public entries unmarked', () => {
		const rows = (['public', 'wip'] as const).map((status) => ({ ...projects[0]!, slug: `example-${status}`, status }));
		for (const render of [llmsTxt, llmsFullTxt]) {
			const body = render(sitePages, rows);
			const wip = body.split('\n').find((line) => line.includes('/projects/example-wip)'));
			const publicEntry = body.split('\n').find((line) => line.includes('/projects/example-public)'));
			expect(wip).toMatch(/ \(in progress\)$/);
			expect(publicEntry).not.toContain('(in progress)');
		}
	});
	it('includes public and wip projects, excludes private projects and archived sections everywhere', async () => {
		const rows = (['public', 'wip', 'private'] as const).map((status) => ({ ...projects[0]!, slug: `example-${status}`, status }));
		for (const pages of [sitePages, sitePages.filter((page) => page.path !== '/projects')]) {
			const sitemap = (await _buildSitemapEntries(pages, rows)).join('');
			for (const project of rows) {
				const expected = pages === sitePages && project.status !== 'private';
				const path = `/projects/${project.slug}`;
				expect(sitemap.includes(`https://yesid.dev${path}<`)).toBe(expected);
				expect(projectEntries(pages, rows).some((entry) => entry.slug === project.slug)).toBe(expected);
				expect(ogProjectSlugs(rows, pages).includes(project.slug)).toBe(expected);
				for (const render of [llmsTxt, llmsFullTxt]) {
					expect(render(pages, rows).includes(`https://yesid.dev${path})`)).toBe(expected);
				}
			}
		}
	});
});
