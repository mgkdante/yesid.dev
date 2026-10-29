import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '#lib/types.ts';
import type { ReadmeSegment } from '#lib/utils/code-fences.ts';
import { projects } from '#lib/content/projects.ts';
import { projectFactory } from '../../../../tests/factories';

const routeMocks = vi.hoisted(() => ({
	adapter: {
		projects: { bySlug: vi.fn() },
		services: { byId: vi.fn() },
	},
	fetchServiceSvgContents: vi.fn(),
}));

vi.mock('#lib/adapters/index.ts', () => ({ adapter: routeMocks.adapter }));
vi.mock('#lib/utils/index.ts', () => ({ fetchServiceSvgContents: routeMocks.fetchServiceSvgContents }));
vi.mock('#lib/server/prerender-entries.ts', () => ({ projectEntries: () => [] }));
vi.mock('#lib/server/code-highlights.ts', () => ({ collectCodeHighlights: async () => ({}), highlightFence: async () => undefined }));

import { load } from './+page.server';

const readmeHtml = (readme?: ReadmeSegment[]) => readme?.map((part) => ('html' in part ? part.html : '')).join('');

const BLOB_README = 'https://github.com/mgkdante/yesid.dev/blob/main/README.md';
const RAW_README = 'https://raw.githubusercontent.com/mgkdante/yesid.dev/main/README.md';
const INVALID_DIAGNOSTIC = '[project-readme] invalid source; section omitted';
const REDIRECT_DIAGNOSTIC = '[project-readme] redirect refused; section omitted';
const UPSTREAM_DIAGNOSTIC = '[project-readme] upstream response unavailable; section omitted';
const FETCH_DIAGNOSTIC = '[project-readme] fetch failed; section omitted';

let warnSpy: ReturnType<typeof vi.spyOn>;

function project(readmeUrl?: string): Project {
	return projectFactory.build({
		slug: 'readme-project',
		relatedServices: [],
		sections: [],
		...(readmeUrl ? { readmeUrl } : {}),
	});
}

async function loadProject(selected: Project, fetcher: typeof globalThis.fetch) {
	routeMocks.adapter.projects.bySlug.mockResolvedValue(selected);
	return load({
		params: { slug: selected.slug },
		fetch: fetcher,
		url: new URL(`https://yesid.dev/projects/${selected.slug}`),
	});
}

function loggedWarnings(): string {
	return warnSpy.mock.calls.flat().map(String).join('\n');
}

describe('project README server boundary', () => {
	beforeEach(() => {
		routeMocks.adapter.projects.bySlug.mockReset();
		routeMocks.adapter.services.byId.mockReset();
		routeMocks.fetchServiceSvgContents.mockReset().mockResolvedValue({});
		warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('makes zero README fetches for the committed null exports', async () => {
		const exportedProject = projects.find((candidate) => candidate.slug === 'yesid-dev');
		expect(exportedProject).toBeDefined();
		expect(exportedProject).not.toHaveProperty('readmeUrl');
		const fetcher = vi.fn<typeof globalThis.fetch>();

		const result = await loadProject(exportedProject!, fetcher);

		expect(fetcher).not.toHaveBeenCalled();
		expect(result.readme).toBeUndefined();
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('normalizes an allowlisted GitHub blob URL and preserves safe README behavior', async () => {
		const markdown = [
			'# Safe heading',
			'[HTTPS link](https://example.com/docs)',
			'[Email](mailto:contact@example.com)',
			'![Safe image](https://images.example.com/readme.png)',
			'<script>globalThis.compromised = true</script>',
			'<img src="data:text/html,unsafe" onerror="globalThis.compromised = true">',
			'<a href="javascript:globalThis.compromised = true" onclick="globalThis.compromised = true">unsafe</a>',
			'',
			'```bash',
			'bun test',
			'```',
			'```mermaid',
			'flowchart LR',
			'  a --> b',
			'```',
		].join('\n');
		const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			new Response(markdown, { status: 200 }),
		);

		const result = await loadProject(project(BLOB_README), fetcher);

		expect(fetcher).toHaveBeenCalledOnce();
		expect(fetcher).toHaveBeenCalledWith(RAW_README, {
			credentials: 'omit',
			redirect: 'manual',
		});
		const doc = new DOMParser().parseFromString(readmeHtml(result.readme)!, 'text/html');
		expect(doc.querySelector('h1')?.textContent).toBe('Safe heading');
		expect(doc.querySelector('a[href="https://example.com/docs"]')).not.toBeNull();
		expect(doc.querySelector('a[href="mailto:contact@example.com"]')).not.toBeNull();
		expect(doc.querySelector('img[src="https://images.example.com/readme.png"]')).not.toBeNull();
		expect(result.readme?.filter((part) => 'fence' in part)).toEqual([{ fence: '```bash\nbun test\n```' }, { fence: '```mermaid\nflowchart LR\n  a --> b\n```' }]);
		expect(doc.querySelector('script')).toBeNull();
		expect([...doc.querySelectorAll('*')].some((element) => [...element.attributes].some(({ name }) => name.startsWith('on')))).toBe(false);
		expect(doc.querySelector('[href^="javascript:" i], [src^="javascript:" i], [href^="data:text/html" i], [src^="data:text/html" i]')).toBeNull();
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it('accepts the equivalent credential-free raw GitHub README URL', async () => {
		const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			new Response('# Raw README', { status: 200 }),
		);

		const result = await loadProject(project(RAW_README), fetcher);

		expect(fetcher).toHaveBeenCalledWith(RAW_README, {
			credentials: 'omit',
			redirect: 'manual',
		});
		const doc = new DOMParser().parseFromString(readmeHtml(result.readme)!, 'text/html');
		expect(doc.querySelector('h1')?.textContent).toBe('Raw README');
		expect(warnSpy).not.toHaveBeenCalled();
	});

	it.each([
		'http://github.com/mgkdante/yesid.dev/blob/main/README.md',
		'https://github.com:443/mgkdante/yesid.dev/blob/main/README.md',
		'https://raw.githubusercontent.com:443/mgkdante/yesid.dev/main/README.md',
		'https://user:secret@github.com/mgkdante/yesid.dev/blob/main/README.md',
		'https://github.example/mgkdante/yesid.dev/blob/main/README.md',
		'https://github.com/mgkdante/yesid.dev/tree/main/README.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/not-a-readme.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/README.md?token=private',
		'https://github.com/mgkdante/yesid.dev/blob/main/./README.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/docs/../README.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/%2e/README.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/%2e%2e/README.md',
		'https://github.com/mgkdante/yesid.dev/blob/main/%2E%2e/README.md',
		'https://raw.githubusercontent.com/mgkdante/yesid.dev/main/%2e/README.md',
		'https://raw.githubusercontent.com/mgkdante/yesid.dev/main/%2E%2e/README.md',
	])('rejects invalid or credential-bearing source without fetching: %s', async (readmeUrl) => {
		const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			new Response('# Must not be fetched', { status: 200 }),
		);

		const result = await loadProject(project(readmeUrl), fetcher);

		expect(fetcher).not.toHaveBeenCalled();
		expect(result.readme).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy).toHaveBeenCalledWith(INVALID_DIAGNOSTIC);
		expect(loggedWarnings()).not.toContain(readmeUrl);
	});

	it('rejects redirects without following or logging the source or location', async () => {
		const redirectLocation = 'https://attacker.example/README.md';
		const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			new Response(null, { status: 302, headers: { location: redirectLocation } }),
		);

		const result = await loadProject(project(BLOB_README), fetcher);

		expect(fetcher).toHaveBeenCalledWith(RAW_README, {
			credentials: 'omit',
			redirect: 'manual',
		});
		expect(result.readme).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(REDIRECT_DIAGNOSTIC);
		expect(loggedWarnings()).not.toContain(BLOB_README);
		expect(loggedWarnings()).not.toContain(RAW_README);
		expect(loggedWarnings()).not.toContain(redirectLocation);
	});

	it('fails soft on a non-OK response with a value-free diagnostic', async () => {
		const fetcher = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
			new Response('private upstream body', { status: 503 }),
		);

		const result = await loadProject(project(BLOB_README), fetcher);

		expect(result.readme).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(UPSTREAM_DIAGNOSTIC);
		expect(loggedWarnings()).not.toContain('503');
		expect(loggedWarnings()).not.toContain('private upstream body');
		expect(loggedWarnings()).not.toContain(BLOB_README);
	});

	it('fails soft on transport errors without logging the URL or error value', async () => {
		const transportValue = 'sensitive transport detail';
		const fetcher = vi
			.fn<typeof globalThis.fetch>()
			.mockRejectedValue(new Error(transportValue));

		const result = await loadProject(project(BLOB_README), fetcher);

		expect(result.readme).toBeUndefined();
		expect(warnSpy).toHaveBeenCalledWith(FETCH_DIAGNOSTIC);
		expect(loggedWarnings()).not.toContain(BLOB_README);
		expect(loggedWarnings()).not.toContain(RAW_README);
		expect(loggedWarnings()).not.toContain(transportValue);
	});
});
