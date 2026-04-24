/**
 * Directus admin-token resolution with fallback flow.
 *
 * Extracted from seed-services.ts in 18c Task 26 (F7). Supports two auth paths:
 *   1. DIRECTUS_ADMIN_TOKEN — preferred (static token, skips network call).
 *   2. DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD — fallback via
 *      POST /auth/login.
 *
 * CLI scripts typically retrieve the static token via 1Password:
 *   DIRECTUS_ADMIN_TOKEN=$(op read op://yesid-dev/cms-admin/token) \
 *     bun run seed:services
 */

export async function getAdminToken(directusUrl: string): Promise<string> {
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
