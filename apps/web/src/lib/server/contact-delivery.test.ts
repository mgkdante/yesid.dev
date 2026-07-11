import { afterEach, describe, expect, it, vi } from 'vitest';
import { ContactSubmissionSchema, sendContactEmail } from './contact-delivery';

const VALID_SUBMISSION = {
	name: 'Test User',
	email: 'test@example.com',
	message: 'Hello there',
};

describe('ContactSubmissionSchema', () => {
	it('trims user fields and defaults the honeypot', () => {
		expect(
			ContactSubmissionSchema.parse({
				name: '  Test User  ',
				email: '  test@example.com  ',
				message: '  Hello there  ',
			}),
		).toEqual({ ...VALID_SUBMISSION, website: '' });
	});

	it.each([
		['blank name', { ...VALID_SUBMISSION, name: '   ' }],
		['name over 120 characters', { ...VALID_SUBMISSION, name: 'a'.repeat(121) }],
		['invalid email', { ...VALID_SUBMISSION, email: 'not-an-email' }],
		['email over 254 characters', { ...VALID_SUBMISSION, email: `${'a'.repeat(243)}@example.com` }],
		['blank message', { ...VALID_SUBMISSION, message: '   ' }],
		['message over 10,000 characters', { ...VALID_SUBMISSION, message: 'a'.repeat(10_001) }],
		['honeypot over 200 characters', { ...VALID_SUBMISSION, website: 'a'.repeat(201) }],
		['unknown key', { ...VALID_SUBMISSION, unexpected: true }],
	])('rejects %s', (_label, value) => {
		expect(ContactSubmissionSchema.safeParse(value).success).toBe(false);
	});
});

describe('sendContactEmail', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('sends the fixed text-only Resend envelope with server-owned headers', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));

		await expect(
			sendContactEmail(VALID_SUBMISSION, {
				apiKey: 'resend-secret',
				fetch: fetchMock,
				timeoutMs: 2_000,
			}),
		).resolves.toBe(true);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://api.resend.com/emails');
		expect(init).toMatchObject({
			method: 'POST',
			headers: {
				Authorization: 'Bearer resend-secret',
				'Content-Type': 'application/json',
				'User-Agent': 'yesid.dev-contact/1.0',
			},
		});
		expect(JSON.parse(String(init?.body))).toEqual({
			from: 'yesid.dev Contact <form@forms.yesid.dev>',
			to: ['contact@yesid.dev'],
			reply_to: 'test@example.com',
			subject: 'New contact via yesid.dev',
			text: 'Name: Test User\nEmail: test@example.com\n\nMessage:\nHello there',
		});
		expect(init?.signal).toBeInstanceOf(AbortSignal);
	});

	it('does not call Resend when the API key is missing', async () => {
		const fetchMock = vi.fn<typeof fetch>();

		await expect(
			sendContactEmail(VALID_SUBMISSION, {
				apiKey: undefined,
				fetch: fetchMock,
				timeoutMs: 2_000,
			}),
		).resolves.toBe(false);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('returns a generic failure for a non-success provider response without retrying', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(JSON.stringify({ message: 'provider detail' }), {
				status: 429,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		await expect(
			sendContactEmail(VALID_SUBMISSION, {
				apiKey: 'resend-secret',
				fetch: fetchMock,
				timeoutMs: 2_000,
			}),
		).resolves.toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('returns a generic failure for a rejected provider request without retrying', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('provider detail'));

		await expect(
			sendContactEmail(VALID_SUBMISSION, {
				apiKey: 'resend-secret',
				fetch: fetchMock,
				timeoutMs: 2_000,
			}),
		).resolves.toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('aborts a stalled provider request at the configured timeout without retrying', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
			return new Promise((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => {
					reject(new DOMException('aborted', 'AbortError'));
				});
			});
		});

		const pending = sendContactEmail(VALID_SUBMISSION, {
			apiKey: 'resend-secret',
			fetch: fetchMock,
			timeoutMs: 25,
		});
		await vi.advanceTimersByTimeAsync(25);

		await expect(pending).resolves.toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});
