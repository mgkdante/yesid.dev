import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '../../..');

function text(path: string): string {
	return readFileSync(join(repoRoot, path), 'utf8');
}

function json(path: string): Record<string, unknown> {
	return JSON.parse(text(path)) as Record<string, unknown>;
}

function buildEnv(path: string): string[] {
	const config = json(path) as { tasks?: { build?: { env?: unknown } } };
	if (!Array.isArray(config.tasks?.build?.env)) throw new Error(`${path} has no build env array`);
	return config.tasks.build.env as string[];
}

describe('preview credential repository boundary', () => {
	it('keys Turbo builds by target, branch, and the distinct build credentials', () => {
		for (const path of ['turbo.json', '.github/shared-tooling/turbo.overlay.json']) {
			const env = buildEnv(path);
			expect(env).toContain('VERCEL_ENV');
			expect(env).toContain('VERCEL_GIT_COMMIT_REF');
			expect(env).toContain('DIRECTUS_BUILD_TOKEN');
			expect(env).toContain('DIRECTUS_DEV_BUILD_TOKEN');
			expect(env).not.toContain('DIRECTUS_READ_TOKEN');
			expect(env).not.toContain('WEB3FORMS_ACCESS_KEY');
			expect(env).not.toContain('VITE_WEB3FORMS_ACCESS_KEY');
		}
	});

	it('does not advertise the dead Directus read credential in tracked env templates', () => {
		for (const path of [
			'.env.example',
			'.env.1password',
			'apps/web/.env.1password',
			'apps/web/.env.example',
		]) {
			expect(text(path)).not.toMatch(/^DIRECTUS_READ_TOKEN=/mu);
		}
	});

	it('does not advertise the retired Directus integration switch in the web env template', () => {
		expect(text('apps/web/.env.example')).not.toContain('RUN_DIRECTUS_INTEGRATION');
	});

	it('does not advertise dead Web3Forms env aliases in tracked env templates', () => {
		for (const path of ['.env.example', '.env.1password', 'apps/web/.env.1password']) {
			expect(text(path)).not.toMatch(/^(?:VITE_)?WEB3FORMS_ACCESS_KEY=/mu);
		}
	});

	it('preserves the CMS-backed public contact key', () => {
		const contactPage = text('apps/web/src/lib/components/contact/ContactPage.svelte');
		expect(contactPage).toContain('access_key: contactPage.web3formsKey');
		expect(contactPage).not.toMatch(/(?:VITE_)?WEB3FORMS_ACCESS_KEY/u);
	});

	it('documents the current OpenWeather credential without inventing a second key', () => {
		for (const path of ['apps/cms/README.md', 'apps/web/.env.example']) {
			const contents = text(path);
			expect(contents).not.toMatch(/(?:separate|distinct) dev key/iu);
		}
		expect(text('apps/cms/README.md')).toContain(
			'existing key, independently scoped to `develop`',
		);
	});
});
