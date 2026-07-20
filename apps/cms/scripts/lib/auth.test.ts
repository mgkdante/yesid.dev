import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getAdminToken } from './auth';

describe('scripts/lib/auth.ts', () => {
	let originalEnv: Record<string, string | undefined>;
	let originalFetch: typeof globalThis.fetch;

	beforeEach(() => {
		originalEnv = {
			DIRECTUS_BUILD_TOKEN: process.env.DIRECTUS_BUILD_TOKEN,
			DIRECTUS_DEV_BUILD_TOKEN: process.env.DIRECTUS_DEV_BUILD_TOKEN,
			DIRECTUS_ADMIN_TOKEN: process.env.DIRECTUS_ADMIN_TOKEN,
			DIRECTUS_ADMIN_EMAIL: process.env.DIRECTUS_ADMIN_EMAIL,
			DIRECTUS_ADMIN_PASSWORD: process.env.DIRECTUS_ADMIN_PASSWORD,
			VERCEL_ENV: process.env.VERCEL_ENV,
			VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF,
		};
		delete process.env.DIRECTUS_BUILD_TOKEN;
		delete process.env.DIRECTUS_DEV_BUILD_TOKEN;
		delete process.env.VERCEL_ENV;
		delete process.env.VERCEL_GIT_COMMIT_REF;
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

	it('uses only the dev build token on the develop preview', async () => {
		process.env.VERCEL_ENV = 'preview';
		process.env.VERCEL_GIT_COMMIT_REF = 'develop';
		process.env.DIRECTUS_BUILD_TOKEN = 'production-build-token';
		process.env.DIRECTUS_DEV_BUILD_TOKEN = 'development-build-token';
		process.env.DIRECTUS_ADMIN_TOKEN = 'admin-token';

		expect(await getAdminToken('https://cms.dev.yesid.dev')).toBe('development-build-token');
	});

	it('pins the develop preview token to the dev CMS', async () => {
		process.env.VERCEL_ENV = 'preview';
		process.env.VERCEL_GIT_COMMIT_REF = 'develop';
		process.env.DIRECTUS_DEV_BUILD_TOKEN = 'development-build-token';

		await expect(getAdminToken('https://cms.yesid.dev')).rejects.toThrow(/cms\.dev\.yesid\.dev/);
	});

	it('requires the canonical HTTPS origin for a trusted target', async () => {
		process.env.VERCEL_ENV = 'preview';
		process.env.VERCEL_GIT_COMMIT_REF = 'develop';
		process.env.DIRECTUS_DEV_BUILD_TOKEN = 'development-build-token';

		await expect(getAdminToken('http://cms.dev.yesid.dev')).rejects.toThrow(/https/u);
		await expect(getAdminToken('https://cms.dev.yesid.dev/proxy')).rejects.toThrow(
			/canonical/u,
		);
	});

	it('refuses all credentials on an arbitrary preview branch', async () => {
		process.env.VERCEL_ENV = 'preview';
		process.env.VERCEL_GIT_COMMIT_REF = 'feature/untrusted-preview';
		process.env.DIRECTUS_BUILD_TOKEN = 'production-build-token';
		process.env.DIRECTUS_DEV_BUILD_TOKEN = 'development-build-token';
		process.env.DIRECTUS_ADMIN_TOKEN = 'admin-token';

		await expect(getAdminToken('https://cms.dev.yesid.dev')).rejects.toThrow(
			/arbitrary Vercel preview/i,
		);
	});

	it('requires the production build token on a production build', async () => {
		process.env.VERCEL_ENV = 'production';
		process.env.DIRECTUS_DEV_BUILD_TOKEN = 'development-build-token';
		process.env.DIRECTUS_ADMIN_TOKEN = 'admin-token';

		await expect(getAdminToken('https://cms.yesid.dev')).rejects.toThrow(
			/DIRECTUS_BUILD_TOKEN/,
		);
	});

	it('pins the production build token to the production CMS', async () => {
		process.env.VERCEL_ENV = 'production';
		process.env.DIRECTUS_BUILD_TOKEN = 'production-build-token';

		await expect(getAdminToken('https://cms.dev.yesid.dev')).rejects.toThrow(/cms\.yesid\.dev/);
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
