import { describe, expect, it } from 'bun:test';
import { refreshDevDatabase, type RefreshDevDatabaseOptions } from './refresh-dev-database';

const options = (): RefreshDevDatabaseOptions => ({
	neonApiKey: 'neon-secret',
	neonProjectId: 'project-id',
	neonBranchId: 'branch-id',
	directusAdminToken: 'admin-secret',
	directusDevBuildToken: 'dev-build-secret',
	sleep: async () => {},
	maxPollAttempts: 3,
});

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

describe('refreshDevDatabase', () => {
	it('waits for the Neon reset, patches exactly one Build Bot, then verifies its token', async () => {
		const calls: Array<{ url: string; init?: RequestInit }> = [];
		const responses = [
			json({ operations: [{ id: 'reset-operation', status: 'running' }] }),
			json({ operation: { id: 'reset-operation', status: 'running' } }),
			json({ operation: { id: 'reset-operation', status: 'finished' } }),
			json({ data: [{ id: 'build-bot-role', name: 'Build Bot' }] }),
			json({ data: [{ id: 'build-bot-user', status: 'active' }] }),
			json({ data: { id: 'build-bot-user' } }),
			json({ data: { id: 'build-bot-user' } }),
		];

		await refreshDevDatabase({
			...options(),
			fetch: (async (
				input: Parameters<typeof fetch>[0],
				init?: Parameters<typeof fetch>[1],
			) => {
				calls.push({ url: String(input), init });
				const response = responses.shift();
				if (!response) throw new Error('unexpected request');
				return response;
			}) as unknown as typeof fetch,
		});

		expect(calls.map(({ init }) => init?.method ?? 'GET')).toEqual([
			'POST',
			'GET',
			'GET',
			'GET',
			'GET',
			'PATCH',
			'GET',
		]);
		expect(calls[0]?.url).toBe(
			'https://console.neon.tech/api/v2/projects/project-id/branches/branch-id/reset_to_parent',
		);
		const roleLookup = new URL(String(calls[3]?.url));
		expect(roleLookup.origin + roleLookup.pathname).toBe('https://cms.dev.yesid.dev/roles');
		expect(roleLookup.searchParams.get('filter[name][_eq]')).toBe('Build Bot');
		const userLookup = new URL(String(calls[4]?.url));
		expect(userLookup.origin + userLookup.pathname).toBe('https://cms.dev.yesid.dev/users');
		expect(userLookup.searchParams.get('filter[role][_eq]')).toBe('build-bot-role');
		expect(userLookup.searchParams.get('filter[status][_eq]')).toBeNull();
		expect(calls[5]?.url).toBe('https://cms.dev.yesid.dev/users/build-bot-user');
		expect(JSON.parse(String(calls[5]?.init?.body))).toEqual({ token: 'dev-build-secret' });
		expect(new Headers(calls[3]?.init?.headers).get('authorization')).toBe('Bearer admin-secret');
		expect(new Headers(calls[6]?.init?.headers).get('authorization')).toBe(
			'Bearer dev-build-secret',
		);
		expect(calls[6]?.url).toBe('https://cms.dev.yesid.dev/users/me?fields=id');
	});

	it('continues polling when Neon retries a failed operation', async () => {
		let requestCount = 0;
		const responses = [
			json({ operations: [{ id: 'reset-operation', status: 'failed' }] }),
			json({ operation: { id: 'reset-operation', status: 'running' } }),
			json({ operation: { id: 'reset-operation', status: 'finished' } }),
			json({ data: [{ id: 'build-bot-role', name: 'Build Bot' }] }),
			json({ data: [{ id: 'build-bot-user', status: 'active' }] }),
			json({ data: { id: 'build-bot-user' } }),
			json({ data: { id: 'build-bot-user' } }),
		];

		await refreshDevDatabase({
			...options(),
			fetch: (async () => {
				requestCount += 1;
				const response = responses.shift();
				if (!response) throw new Error('unexpected request');
				return response;
			}) as unknown as typeof fetch,
		});

		expect(requestCount).toBe(7);
	});

	it('fails closed unless exactly one Build Bot role exists', async () => {
		for (const roles of [
			[],
			[
				{ id: 'one', name: 'Build Bot' },
				{ id: 'two', name: 'Build Bot' },
			],
		]) {
			let requestCount = 0;
			const run = refreshDevDatabase({
				...options(),
				fetch: (async () => {
					requestCount += 1;
					if (requestCount === 1) {
						return json({ operations: [{ id: 'reset-operation', status: 'finished' }] });
					}
					return json({ data: roles });
				}) as unknown as typeof fetch,
			});

			await expect(run).rejects.toThrow(/exactly one Build Bot role/i);
			expect(requestCount).toBe(2);
		}
	});

	it('fails closed unless exactly one Build Bot user exists', async () => {
		for (const users of [
			[],
			[
				{ id: 'active-user', status: 'active' },
				{ id: 'suspended-user', status: 'suspended' },
			],
		]) {
			let requestCount = 0;
			const run = refreshDevDatabase({
				...options(),
				fetch: (async () => {
					requestCount += 1;
					if (requestCount === 1) {
						return json({ operations: [{ id: 'reset-operation', status: 'finished' }] });
					}
					if (requestCount === 2) {
						return json({ data: [{ id: 'build-bot-role', name: 'Build Bot' }] });
					}
					return json({ data: users });
				}) as unknown as typeof fetch,
			});

			await expect(run).rejects.toThrow(/exactly one Build Bot/i);
			expect(requestCount).toBe(3);
		}
	});

	it('stops before Directus when the Neon operation does not finish', async () => {
		const urls: string[] = [];
		await expect(
			refreshDevDatabase({
				...options(),
				maxPollAttempts: 2,
				fetch: (async (input: Parameters<typeof fetch>[0]) => {
					urls.push(String(input));
					if (urls.length === 1) {
						return json({ operations: [{ id: 'reset-operation', status: 'running' }] });
					}
					return json({ operation: { id: 'reset-operation', status: 'running' } });
				}) as unknown as typeof fetch,
			}),
		).rejects.toThrow(/did not finish/i);

		expect(urls).toHaveLength(3);
		expect(urls.every((url) => url.startsWith('https://console.neon.tech/'))).toBe(true);
	});

	it('treats a skipped Neon reset as failure and never reaches Directus', async () => {
		let requestCount = 0;
		await expect(
			refreshDevDatabase({
				...options(),
				fetch: (async () => {
					requestCount += 1;
					if (requestCount === 1) {
						return json({ operations: [{ id: 'reset-operation', status: 'skipped' }] });
					}
					throw new Error('Directus must not be reached');
				}) as unknown as typeof fetch,
			}),
		).rejects.toThrow(/skipped/u);

		expect(requestCount).toBe(1);
	});

	it('stops before token verification when the Build Bot patch fails', async () => {
		let requestCount = 0;
		await expect(
			refreshDevDatabase({
				...options(),
				fetch: (async () => {
					requestCount += 1;
					if (requestCount === 1) {
						return json({ operations: [{ id: 'reset-operation', status: 'finished' }] });
					}
					if (requestCount === 2) {
						return json({ data: [{ id: 'build-bot-role', name: 'Build Bot' }] });
					}
					if (requestCount === 3) {
						return json({ data: [{ id: 'build-bot-user', status: 'active' }] });
					}
					return json({ errors: [] }, 500);
				}) as unknown as typeof fetch,
			}),
		).rejects.toThrow(/patch/i);

		expect(requestCount).toBe(4);
	});

	it('rejects reused or missing credentials before any request', async () => {
		let requestCount = 0;
		const fetcher = (async () => {
			requestCount += 1;
			return json({});
		}) as unknown as typeof fetch;

		await expect(
			refreshDevDatabase({
				...options(),
				directusDevBuildToken: 'admin-secret',
				fetch: fetcher,
			}),
		).rejects.toThrow(/distinct/i);
		await expect(
			refreshDevDatabase({
				...options(),
				directusDevBuildToken: '',
				fetch: fetcher,
			}),
		).rejects.toThrow(/DIRECTUS_DEV_BUILD_TOKEN/);
		expect(requestCount).toBe(0);
	});
});
