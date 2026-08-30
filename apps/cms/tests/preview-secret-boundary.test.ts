import { describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
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
		for (const path of ['.env.example', 'apps/cms/.env.example', 'apps/web/.env.example']) {
			expect(text(path)).not.toMatch(/^DIRECTUS_READ_TOKEN=/mu);
		}
	});

	it('ignores local secret-manager templates while keeping public examples visible', () => {
		for (const path of [
			'local.env.1password',
			'apps/cms/local.env.1password',
			'apps/web/local.env.1password',
		]) {
			const ignored = spawnSync('git', ['check-ignore', '--quiet', '--no-index', path], {
				cwd: repoRoot,
			});
			expect(ignored.status).toBe(0);
		}

		for (const path of ['.env.example', 'apps/cms/.env.example', 'apps/web/.env.example']) {
			const ignored = spawnSync('git', ['check-ignore', '--quiet', '--no-index', path], {
				cwd: repoRoot,
			});
			expect(ignored.status).toBe(1);
		}
	});

	it('keeps public env examples free of private secret and account locators', () => {
		const examples = ['.env.example', 'apps/cms/.env.example', 'apps/web/.env.example'].map(text);
		const privateLocatorScheme = ['op', '://'].join('');
		for (const contents of examples) {
			expect(contents).not.toContain(privateLocatorScheme);
			expect(contents).not.toMatch(/\.up\.railway\.app|\.r2\.cloudflarestorage\.com/iu);
		}

		expect(examples[0]).toMatch(/^OPENWEATHER_API_KEY=$/mu);
		expect(examples[0]).toMatch(/^DIRECTUS_ADMIN_EMAIL=$/mu);
		expect(examples[0]).toMatch(/^DIRECTUS_ADMIN_PASSWORD=$/mu);
		expect(examples[1]).toContain('DIRECTUS_ADMIN_TOKEN=');
		expect(examples[1]).toContain('DIRECTUS_DEV_BUILD_TOKEN=');
		expect(examples[1]).toContain('NEON_API_KEY=');
		expect(examples[1]).toContain('STORAGE_S3_KEY=');
		expect(examples[1]).toContain('STORAGE_S3_SECRET=');
		expect(examples[2]).toMatch(/^OPENWEATHER_API_KEY=$/mu);
		expect(examples[2]).toMatch(/^DIRECTUS_ADMIN_EMAIL=$/mu);
		expect(examples[2]).toMatch(/^DIRECTUS_ADMIN_PASSWORD=$/mu);
	});

	it('does not advertise the retired Directus integration switch in the web env template', () => {
		expect(text('apps/web/.env.example')).not.toContain('RUN_DIRECTUS_INTEGRATION');
	});

	it('does not advertise dead Web3Forms env aliases in tracked env templates', () => {
		for (const path of ['.env.example', 'apps/cms/.env.example', 'apps/web/.env.example']) {
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
