import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { defaultDirectusUrl, requireEnv, createClient } from './sdk';

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
