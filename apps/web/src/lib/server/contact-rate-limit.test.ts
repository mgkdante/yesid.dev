import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeContactRateLimit } from './contact-rate-limit';

describe('probeContactRateLimit', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('uses honeypot submissions and observes a WAF 429 without sending mail', async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }))
			.mockResolvedValueOnce(new Response('{"success":true}', { status: 200 }))
			.mockResolvedValueOnce(new Response(null, { status: 429 }));

		const result = await probeContactRateLimit({
			baseUrl: 'https://preview.example',
			requestCount: 3,
			fetch: fetchMock,
		});

		expect(result).toEqual({ statuses: [200, 200, 429], rateLimited: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);
		for (const [url, init] of fetchMock.mock.calls) {
			expect(url).toBe('https://preview.example/api/contact');
			expect(init).toMatchObject({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'https://preview.example',
				},
			});
			expect(JSON.parse(String(init?.body))).toMatchObject({ website: 'waf-probe.invalid' });
			expect(init?.signal).toBeInstanceOf(AbortSignal);
		}
	});

	it('does not accept an immediate 429 as proof of the intended threshold', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 429 }));
		await expect(
			probeContactRateLimit({
				baseUrl: 'https://preview.example',
				requestCount: 3,
				fetch: fetchMock,
			}),
		).resolves.toEqual({ statuses: [429], rateLimited: false });
	});

	it('reports a missing rejection without inventing success', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 200 }));
		await expect(
			probeContactRateLimit({
				baseUrl: 'https://preview.example/',
				requestCount: 2,
				fetch: fetchMock,
			}),
		).resolves.toEqual({ statuses: [200, 200], rateLimited: false });
	});

	it('rejects unsafe or meaningless probe arguments', async () => {
		const fetchMock = vi.fn<typeof fetch>();
		await expect(
			probeContactRateLimit({ baseUrl: 'http://yesid.dev', requestCount: 2, fetch: fetchMock }),
		).rejects.toThrow(/HTTPS/);
		await expect(
			probeContactRateLimit({ baseUrl: 'https://yesid.dev', requestCount: 1, fetch: fetchMock }),
		).rejects.toThrow(/at least 2/);
		await expect(
			probeContactRateLimit({ baseUrl: 'https://yesid.dev', requestCount: 21, fetch: fetchMock }),
		).rejects.toThrow(/at most 20/);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('aborts a stalled probe request', async () => {
		vi.useFakeTimers();
		const fetchMock = vi.fn<typeof fetch>().mockImplementation((_url, init) =>
			new Promise((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
			}),
		);
		const pending = probeContactRateLimit({
			baseUrl: 'https://preview.example',
			requestCount: 2,
			timeoutMs: 25,
			fetch: fetchMock,
		});
		const rejection = expect(pending).rejects.toThrow(/aborted/i);
		await vi.advanceTimersByTimeAsync(25);
		await rejection;
	});
});
