// fetchServiceSvgContents — go2 integration regression lock.
//
// The deployed-preview bug: on Vercel, server-side fetch of /svg/services/*
// 401s behind deployment protection (the static dir isn't bundled into the
// function, so kit network-self-fetches). Repo-shipped SVGs must therefore
// resolve WITHOUT touching fetch at all (build-time import.meta.glob ?raw).
// These tests hand the function a fetch that always fails — exactly the
// deployed failure mode — and require real art back anyway.

import { describe, it, expect, vi } from 'vitest';
import { fetchServiceSvgContents, getServiceSvgUrl } from './service-svg';
import type { Service } from '$lib/types';

const failingFetch = vi.fn(async () => {
	throw new Error('network unavailable (simulates Vercel preview 401 wall)');
}) as unknown as typeof fetch;

function service(id: string, svg?: string): Service {
	return {
		id,
		title: { en: id },
		description: { en: id },
		station: 1,
		relatedProjects: [],
		...(svg ? { svg } : {}),
	} as Service;
}

describe('fetchServiceSvgContents', () => {
	it('resolves committed SVGs from the build-time glob — no fetch involved', async () => {
		const services = [
			service('database-engineering', 'service-database.svg'),
			service('data-pipeline', 'service-pipeline.svg'),
			service('analytics-reporting', 'service-reporting.svg'),
			service('web-development', 'service-web.svg'),
		];

		const contents = await fetchServiceSvgContents(failingFetch, services);

		for (const s of services) {
			expect(contents[s.id], `${s.id} svg content`).toContain('<svg');
		}
		expect(failingFetch).not.toHaveBeenCalled();
	});

	it('skips services without an svg ref', async () => {
		const contents = await fetchServiceSvgContents(failingFetch, [service('no-art')]);
		expect(contents).toEqual({});
	});

	it('falls back to fetch for unknown refs and degrades to empty on failure', async () => {
		const contents = await fetchServiceSvgContents(failingFetch, [
			service('mystery', 'not-in-the-repo.svg'),
		]);
		expect(contents['mystery']).toBe('');
		expect(failingFetch).toHaveBeenCalledTimes(1);
	});
});

describe('getServiceSvgUrl', () => {
	it('builds the public URL for browser-side consumers', () => {
		expect(getServiceSvgUrl(service('x', 'service-web.svg'))).toBe('/svg/services/service-web.svg');
		expect(getServiceSvgUrl(service('x'))).toBe('');
	});
});
