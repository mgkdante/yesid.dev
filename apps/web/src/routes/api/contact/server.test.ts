import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	env: {} as { RESEND_API_KEY?: string },
	sendContactEmail: vi.fn(),
}));

vi.mock('$env/dynamic/private', () => ({ env: mocks.env }));
vi.mock('$lib/server/contact-delivery', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/contact-delivery')>();
	return { ...actual, sendContactEmail: mocks.sendContactEmail };
});

import { POST, prerender } from './+server';

const VALID_BODY = {
	name: 'Test User',
	email: 'test@example.com',
	message: 'Hello there',
	website: '',
};

function requestFor(
	body: string,
	options: { contentType?: string; origin?: string; contentLength?: string } = {},
) {
	const url = new URL('https://yesid.dev/api/contact');
	const headers = new Headers();
	if (options.contentType !== undefined) headers.set('content-type', options.contentType);
	if (options.origin !== undefined) headers.set('origin', options.origin);
	if (options.contentLength !== undefined) headers.set('content-length', options.contentLength);
	return {
		request: {
			headers,
			text: async () => body,
		} as Request,
		url,
	} as Parameters<typeof POST>[0];
}

async function call(
	body: unknown,
	options: { raw?: boolean; contentType?: string; origin?: string | null; contentLength?: string } = {},
) {
	const response = await POST(
		requestFor(options.raw ? String(body) : JSON.stringify(body), {
			contentType: options.contentType ?? 'application/json',
			origin: options.origin === undefined ? 'https://yesid.dev' : options.origin ?? undefined,
			contentLength: options.contentLength,
		}),
	);
	expect(response.headers.get('cache-control')).toBe('no-store');
	return { response, body: await response.json() };
}

describe('POST /api/contact', () => {
	beforeEach(() => {
		mocks.env.RESEND_API_KEY = 'resend-secret';
		mocks.sendContactEmail.mockReset().mockResolvedValue(true);
	});

	it('stays dynamic', () => {
		expect(prerender).toBe(false);
	});

	it('rejects non-JSON content', async () => {
		const { response, body } = await call('name=Test', {
			raw: true,
			contentType: 'application/x-www-form-urlencoded',
		});
		expect(response.status).toBe(415);
		expect(body).toEqual({ success: false });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('rejects bodies over 16 KiB', async () => {
		const oversized = JSON.stringify({ ...VALID_BODY, message: 'a'.repeat(17_000) });
		const { response, body } = await call(oversized, { raw: true });
		expect(response.status).toBe(413);
		expect(body).toEqual({ success: false });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('rejects an oversized Content-Length before delivery', async () => {
		const { response } = await call(VALID_BODY, { contentLength: '16385' });
		expect(response.status).toBe(413);
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('rejects malformed JSON', async () => {
		const { response, body } = await call('{not json', { raw: true });
		expect(response.status).toBe(400);
		expect(body).toEqual({ success: false });
	});

	it('rejects invalid or non-strict submissions', async () => {
		const { response, body } = await call({ ...VALID_BODY, unexpected: true });
		expect(response.status).toBe(400);
		expect(body).toEqual({ success: false });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('rejects a mismatched Origin when supplied', async () => {
		const { response, body } = await call(VALID_BODY, { origin: 'https://attacker.example' });
		expect(response.status).toBe(403);
		expect(body).toEqual({ success: false });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('rejects an absent Origin and allows a matching Origin', async () => {
		const absent = await call(VALID_BODY, { origin: null });
		expect(absent.response.status).toBe(403);
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();

		const matching = await call(VALID_BODY, { origin: 'https://yesid.dev' });
		expect(matching.response.status).toBe(200);
		expect(mocks.sendContactEmail).toHaveBeenCalledTimes(1);
	});

	it('silently absorbs a populated honeypot without sending', async () => {
		const { response, body } = await call({ ...VALID_BODY, website: 'https://spam.example' });
		expect(response.status).toBe(200);
		expect(body).toEqual({ success: true });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('returns a generic 503 when server configuration is missing', async () => {
		mocks.env.RESEND_API_KEY = undefined;
		const { response, body } = await call(VALID_BODY);
		expect(response.status).toBe(503);
		expect(body).toEqual({ success: false });
		expect(mocks.sendContactEmail).not.toHaveBeenCalled();
	});

	it('returns a generic 503 when delivery fails', async () => {
		mocks.sendContactEmail.mockResolvedValueOnce(false);
		const { response, body } = await call(VALID_BODY);
		expect(response.status).toBe(503);
		expect(body).toEqual({ success: false });
		expect(JSON.stringify(body)).not.toContain('provider');
	});

	it('delivers the trimmed submission and returns success', async () => {
		const { response, body } = await call({
			name: '  Test User  ',
			email: '  test@example.com  ',
			message: '  Hello there  ',
		});
		expect(response.status).toBe(200);
		expect(body).toEqual({ success: true });
		expect(mocks.sendContactEmail).toHaveBeenCalledWith(
			{
				name: VALID_BODY.name,
				email: VALID_BODY.email,
				message: VALID_BODY.message,
			},
			expect.objectContaining({
				apiKey: 'resend-secret',
				fetch: globalThis.fetch,
				timeoutMs: expect.any(Number),
			}),
		);
	});
});
