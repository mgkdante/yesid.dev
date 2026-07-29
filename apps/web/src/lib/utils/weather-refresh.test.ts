import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE } from '$lib/utils/locale';
import { fetchFreshWeather } from '$lib/utils/weather-refresh';

function installFetchMock() {
	const fetchMock = vi.fn<typeof fetch>();
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('fetchFreshWeather', () => {
	it('uses the query-free weather URL for the default locale', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

		await fetchFreshWeather(DEFAULT_LOCALE);

		expect(fetchMock).toHaveBeenCalledWith('/api/weather');
	});

	it('includes the locale in the weather URL for French', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

		await fetchFreshWeather('fr');

		expect(fetchMock).toHaveBeenCalledWith('/api/weather?lang=fr');
	});

	it('returns a valid weather payload', async () => {
		const fetchMock = installFetchMock();
		const data = { temp: 7, condition: 'clear sky', icon: '01d' };
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify(data), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		await expect(fetchFreshWeather(DEFAULT_LOCALE)).resolves.toEqual(data);
	});

	it('returns null for a payload with a non-numeric temperature', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ temp: '7', condition: 'clear sky', icon: '01d' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		await expect(fetchFreshWeather(DEFAULT_LOCALE)).resolves.toBeNull();
	});

	it('returns null for an unsuccessful response', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockResolvedValue(
			new Response(JSON.stringify({ temp: 7, condition: 'clear sky', icon: '01d' }), {
				status: 503,
			}),
		);

		await expect(fetchFreshWeather(DEFAULT_LOCALE)).resolves.toBeNull();
	});

	it('returns null when fetch rejects', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockRejectedValue(new Error('offline'));

		await expect(fetchFreshWeather(DEFAULT_LOCALE)).resolves.toBeNull();
	});

	it('returns null when response JSON is malformed', async () => {
		const fetchMock = installFetchMock();
		fetchMock.mockResolvedValue(
			new Response('{', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		await expect(fetchFreshWeather(DEFAULT_LOCALE)).resolves.toBeNull();
	});
});
