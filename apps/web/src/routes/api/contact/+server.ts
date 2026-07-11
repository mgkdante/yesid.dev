import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { ContactSubmissionSchema, sendContactEmail } from '$lib/server/contact-delivery';
import type { RequestHandler } from './$types';

const MAX_BODY_BYTES = 16 * 1024;
const PROVIDER_TIMEOUT_MS = 8_000;
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' };

export const prerender = false;

function result(success: boolean, status: number): Response {
	return json(
		{ success },
		{
			status,
			headers: NO_STORE_HEADERS,
		},
	);
}

function hasJsonContentType(request: Request): boolean {
	return request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() === 'application/json';
}

function hasInvalidOrigin(request: Request, url: URL): boolean {
	const origin = request.headers.get('origin');
	if (!origin) return true;
	try {
		return new URL(origin).origin !== url.origin;
	} catch {
		return true;
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	if (!hasJsonContentType(request)) return result(false, 415);
	if (hasInvalidOrigin(request, url)) return result(false, 403);

	const contentLength = Number(request.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
		return result(false, 413);
	}

	const rawBody = await request.text();
	if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
		return result(false, 413);
	}

	let body: unknown;
	try {
		body = JSON.parse(rawBody);
	} catch {
		return result(false, 400);
	}

	const parsed = ContactSubmissionSchema.safeParse(body);
	if (!parsed.success) return result(false, 400);
	if (parsed.data.website) return result(true, 200);
	if (!env.RESEND_API_KEY) return result(false, 503);

	const delivered = await sendContactEmail(
		{
			name: parsed.data.name,
			email: parsed.data.email,
			message: parsed.data.message,
		},
		{
			apiKey: env.RESEND_API_KEY,
			fetch: globalThis.fetch,
			timeoutMs: PROVIDER_TIMEOUT_MS,
		},
	);

	return result(delivered, delivered ? 200 : 503);
};
