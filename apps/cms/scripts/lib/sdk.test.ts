import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
	DEV_CMS_HOSTNAME,
	assertDevCms,
	createClient,
	defaultDirectusUrl,
	requireEnv,
} from './sdk';

describe('scripts/lib/sdk.ts', () => {
	let originalEnv: Record<string, string | undefined>;

	beforeEach(() => {
		originalEnv = {
			PUBLIC_DIRECTUS_URL: process.env.PUBLIC_DIRECTUS_URL,
			FOO_TEST: process.env.FOO_TEST,
		};
	});

	afterEach(() => {
		for (const [k, v] of Object.entries(originalEnv)) {
			if (v === undefined) delete process.env[k];
			else process.env[k] = v;
		}
	});

	describe('defaultDirectusUrl', () => {
		it('returns cms.dev.yesid.dev fallback when PUBLIC_DIRECTUS_URL unset (slice-18m P6 flip)', () => {
			delete process.env.PUBLIC_DIRECTUS_URL;
			expect(defaultDirectusUrl()).toBe('https://cms.dev.yesid.dev');
		});

		it('returns PUBLIC_DIRECTUS_URL when set', () => {
			process.env.PUBLIC_DIRECTUS_URL = 'http://localhost:8055';
			expect(defaultDirectusUrl()).toBe('http://localhost:8055');
		});
	});

	describe('requireEnv', () => {
		it('returns the value when env var is set', () => {
			process.env.FOO_TEST = 'bar';
			expect(requireEnv('FOO_TEST')).toBe('bar');
		});

		it('throws with name in message when unset', () => {
			delete process.env.FOO_TEST;
			expect(() => requireEnv('FOO_TEST')).toThrow(/FOO_TEST/);
		});

		it('includes hint in error when provided', () => {
			delete process.env.FOO_TEST;
			expect(() => requireEnv('FOO_TEST', 'get from 1Password')).toThrow(
				/get from 1Password/,
			);
		});
	});

	describe('assertDevCms', () => {
		it('accepts the dev CMS URL in all common spellings', () => {
			expect(() => assertDevCms('https://cms.dev.yesid.dev')).not.toThrow();
			expect(() => assertDevCms('https://cms.dev.yesid.dev/')).not.toThrow();
			expect(() => assertDevCms('https://cms.dev.yesid.dev/items/projects')).not.toThrow();
		});

		it('accepts the default fallback URL every guarded script resolves', () => {
			delete process.env.PUBLIC_DIRECTUS_URL;
			expect(() => assertDevCms(defaultDirectusUrl())).not.toThrow();
			expect(new URL(defaultDirectusUrl()).hostname).toBe(DEV_CMS_HOSTNAME);
		});

		it('refuses the prod CMS', () => {
			expect(() => assertDevCms('https://cms.yesid.dev')).toThrow(/DEV-ONLY/);
		});

		it('refuses crafted URLs that merely CONTAIN the dev hostname (pre-sweep substring hole)', () => {
			expect(() => assertDevCms('https://cms.dev.yesid.dev.attacker.com')).toThrow(/DEV-ONLY/);
			expect(() => assertDevCms('https://evil.example/cms.dev.yesid.dev')).toThrow(/DEV-ONLY/);
			expect(() => assertDevCms('https://evil.example/?next=cms.dev.yesid.dev')).toThrow(/DEV-ONLY/);
		});

		it('refuses localhost and unparseable values', () => {
			expect(() => assertDevCms('http://localhost:8055')).toThrow(/DEV-ONLY/);
			expect(() => assertDevCms('not a url')).toThrow(/unparseable/);
			expect(() => assertDevCms('')).toThrow(/unparseable/);
		});
	});

	describe('createClient', () => {
		it('returns a configured client with request method', () => {
			const client = createClient('http://localhost:8055', 'test-token');
			expect(typeof client.request).toBe('function');
		});

		it('is generic over schema type', () => {
			interface TestSchema {
				services: Array<{ id: string }>;
			}
			const client = createClient<TestSchema>('http://localhost:8055', 'tok');
			expect(typeof client.request).toBe('function');
		});
	});
});
