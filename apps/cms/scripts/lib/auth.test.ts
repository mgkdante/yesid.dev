import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getAdminToken } from './auth';

describe('scripts/lib/auth.ts', () => {
	let originalEnv: Record<string, string | undefined>;
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalEnv = {
			DIRECTUS_BUILD_TOKEN: process.env.DIRECTUS_BUILD_TOKEN,
			DIRECTUS_ADMIN_TOKEN: process.env.DIRECTUS_ADMIN_TOKEN,
			DIRECTUS_ADMIN_EMAIL: process.env.DIRECTUS_ADMIN_EMAIL,
			DIRECTUS_ADMIN_PASSWORD: process.env.DIRECTUS_ADMIN_PASSWORD,
		};
		delete process.env.DIRECTUS_BUILD_TOKEN;
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		for (const [k, v] of Object.entries(originalEnv)) {
			if (v === undefined) delete process.env[k];
			else process.env[k] = v;
		}
		globalThis.fetch = originalFetch;
	});

	it('returns DIRECTUS_ADMIN_TOKEN directly without network', async () => {
		process.env.DIRECTUS_ADMIN_TOKEN = 'static-token-abc';
		let fetchCalled = false;
		globalThis.fetch = (async () => {
			fetchCalled = true;
			throw new Error('unreachable');
		}) as unknown as typeof globalThis.fetch;
		const token = await getAdminToken('http://localhost:8055');
		expect(token).toBe('static-token-abc');
		expect(fetchCalled).toBe(false);
	});

	it('can require admin auth when a Build Bot token is also present', async () => {
		process.env.DIRECTUS_BUILD_TOKEN = 'read-only-build-token';
		process.env.DIRECTUS_ADMIN_TOKEN = 'admin-token';
		let fetchCalled = false;
		globalThis.fetch = (async () => {
			fetchCalled = true;
			throw new Error('unreachable');
		}) as unknown as typeof globalThis.fetch;

		const token = await getAdminToken('http://localhost:8055', {
			allowBuildToken: false,
		});

		expect(token).toBe('admin-token');
		expect(fetchCalled).toBe(false);
	});

	it('throws with actionable message when no auth env present', async () => {
		delete process.env.DIRECTUS_ADMIN_TOKEN;
		delete process.env.DIRECTUS_ADMIN_EMAIL;
		delete process.env.DIRECTUS_ADMIN_PASSWORD;
		await expect(getAdminToken('http://localhost:8055')).rejects.toThrow(
			/DIRECTUS_ADMIN_TOKEN/,
		);
	});

	it('falls back to /auth/login with email+password', async () => {
		delete process.env.DIRECTUS_ADMIN_TOKEN;
		process.env.DIRECTUS_ADMIN_EMAIL = 'admin@test.local';
		process.env.DIRECTUS_ADMIN_PASSWORD = 'pw';
		let capturedBody: unknown = null;
		globalThis.fetch = (async (
			_url: Parameters<typeof globalThis.fetch>[0],
			init?: Parameters<typeof globalThis.fetch>[1],
		) => {
			capturedBody = init?.body ? JSON.parse(init.body as string) : null;
			return new Response(
				JSON.stringify({ data: { access_token: 'login-token-xyz' } }),
				{ status: 200 },
			);
		}) as unknown as typeof globalThis.fetch;
		const token = await getAdminToken('http://localhost:8055');
		expect(token).toBe('login-token-xyz');
		expect(capturedBody).toEqual({ email: 'admin@test.local', password: 'pw' });
	});

	it('throws with HTTP status when login fails', async () => {
		delete process.env.DIRECTUS_ADMIN_TOKEN;
		process.env.DIRECTUS_ADMIN_EMAIL = 'admin@test.local';
		process.env.DIRECTUS_ADMIN_PASSWORD = 'wrong';
		globalThis.fetch = (async () =>
			new Response('{"errors":[{"message":"bad creds"}]}', {
				status: 401,
				statusText: 'Unauthorized',
			})) as unknown as typeof globalThis.fetch;
		await expect(getAdminToken('http://localhost:8055')).rejects.toThrow(
			/\[auth\] 401/,
		);
	});
});
