/**
 * Directus admin-token resolution with fallback flow.
 *
 * Extracted from seed-services.ts in 18c Task 26 (F7). Supports three auth paths:
 *   1. DIRECTUS_BUILD_TOKEN — preferred for CI/Vercel builds (read-only "Build Bot"
 *      static token; skips network call). Set this in Vercel env vars (encrypted,
 *      Production scope). Operator step: create a "Build Bot" policy in Directus
 *      (read-only on all required collections + site_meta), generate a static token,
 *      and set DIRECTUS_BUILD_TOKEN=<token> in Vercel environment variables.
 *   2. DIRECTUS_ADMIN_TOKEN — fallback for local dev / seed scripts (admin-level
 *      static token, skips network call).
 *   3. DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD — last resort via
 *      POST /auth/login.
 *
 * CLI scripts typically retrieve the static token via 1Password:
 *   DIRECTUS_ADMIN_TOKEN=$(op read op://yesid-dev/cms-admin/token) \
 *     bun run seed:services
 */

export async function getAdminToken(directusUrl: string): Promise<string> {
	// DIRECTUS_BUILD_TOKEN: preferred for Vercel builds — read-only "Build Bot" token.
	if (process.env.DIRECTUS_BUILD_TOKEN) {
		return process.env.DIRECTUS_BUILD_TOKEN;
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
