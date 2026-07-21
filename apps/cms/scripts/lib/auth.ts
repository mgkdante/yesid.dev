/**
 * Directus admin-token resolution with fallback flow.
 *
 * Extracted from seed-services.ts in 18c Task 26 (F7). Supports three auth paths:
 *   1. Vercel build tokens — DIRECTUS_BUILD_TOKEN on production and the distinct
 *      DIRECTUS_DEV_BUILD_TOKEN on the develop preview. Arbitrary preview branches
 *      are never allowed to resolve a build credential.
 *   2. DIRECTUS_ADMIN_TOKEN — fallback for local dev / seed scripts (admin-level
 *      static token, skips network call).
 *   3. DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD — last resort via
 *      POST /auth/login.
 *
 * CLI scripts typically retrieve the static token via 1Password:
 *   DIRECTUS_ADMIN_TOKEN=$(op read op://yesid-dev/5maqocwjgg5uxeckueadwkmzuy/admin_token) \
 *     bun run seed:services
 */

export interface AdminTokenOptions {
	/** Set false for mutating system scripts that must never authenticate as Build Bot. */
	allowBuildToken?: boolean;
}

export async function getAdminToken(
	directusUrl: string,
	options: AdminTokenOptions = {},
): Promise<string> {
	if (options.allowBuildToken !== false) {
		if (process.env.VERCEL_ENV === 'production') {
			assertCmsOrigin(directusUrl, 'cms.yesid.dev', 'production');
			if (!process.env.DIRECTUS_BUILD_TOKEN) {
				throw new Error('Production Vercel builds require DIRECTUS_BUILD_TOKEN.');
			}
			return process.env.DIRECTUS_BUILD_TOKEN;
		}

		if (process.env.VERCEL_ENV === 'preview') {
			if (process.env.VERCEL_GIT_COMMIT_REF !== 'develop') {
				throw new Error('Build credentials are disabled on an arbitrary Vercel preview.');
			}
			assertCmsOrigin(directusUrl, 'cms.dev.yesid.dev', 'develop preview');
			if (!process.env.DIRECTUS_DEV_BUILD_TOKEN) {
				throw new Error('The develop Vercel preview requires DIRECTUS_DEV_BUILD_TOKEN.');
			}
			return process.env.DIRECTUS_DEV_BUILD_TOKEN;
		}

		if (process.env.DIRECTUS_BUILD_TOKEN) {
			return process.env.DIRECTUS_BUILD_TOKEN;
		}
	}
	if (process.env.DIRECTUS_ADMIN_TOKEN) {
		return process.env.DIRECTUS_ADMIN_TOKEN;
	}
	const email = process.env.DIRECTUS_ADMIN_EMAIL;
	const password = process.env.DIRECTUS_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error(
			'Need DIRECTUS_ADMIN_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD. ' +
				'Typical run: DIRECTUS_ADMIN_TOKEN=$(op read ...) bun run seed:services',
		);
	}
	const res = await fetch(`${directusUrl}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		throw new Error(
			`[auth] ${res.status} ${res.statusText} — check admin creds + ${directusUrl} reachability`,
		);
	}
	const body = (await res.json()) as { data: { access_token: string } };
	return body.data.access_token;
}

function assertCmsOrigin(directusUrl: string, expectedHostname: string, target: string): void {
	let url: URL;
	try {
		url = new URL(directusUrl);
	} catch {
		throw new Error(
			`Refusing an invalid CMS URL for the ${target}. Expected https://${expectedHostname}.`,
		);
	}
	const expectedOrigin = `https://${expectedHostname}`;
	if (url.origin !== expectedOrigin) {
		throw new Error(`Refusing the CMS origin for the ${target}. Expected ${expectedOrigin}.`);
	}
	if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
		throw new Error(`Refusing a non-canonical CMS URL for the ${target}. Expected ${expectedOrigin}.`);
	}
}
