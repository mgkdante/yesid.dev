import { describe, expect, it } from 'vitest';
import { projects } from '#lib/content/projects.ts';
import { sitePages } from '#lib/content/site-pages.ts';
import { llmsTxt, llmsFullTxt } from './llms';

describe('project availability across crawler surfaces', () => {
	it('labels wip entries in both llms files, leaving public entries unmarked', () => {
		const rows = (['public', 'wip'] as const).map((status) => ({ ...projects[0]!, slug: `example-${status}`, status }));
		for (const render of [llmsTxt, llmsFullTxt]) {
			const body = render({ pages: sitePages, projects: rows });
			const wip = body.split('\n').find((line) => line.includes('/projects/example-wip)'));
			const publicEntry = body.split('\n').find((line) => line.includes('/projects/example-public)'));
			expect(wip).toMatch(/ \(in progress\)$/);
			expect(publicEntry).not.toContain('(in progress)');
		}
	});
});
