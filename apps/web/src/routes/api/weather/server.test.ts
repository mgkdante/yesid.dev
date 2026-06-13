import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMontrealWeatherMock = vi.fn();

vi.mock('$lib/utils/weather', () => ({
	fetchMontrealWeather: (...args: unknown[]) => fetchMontrealWeatherMock(...args),
}));

import { GET } from './+server';

describe('GET /api/weather', () => {
	beforeEach(() => {
		fetchMontrealWeatherMock.mockReset();
	});

	async function call(lang?: string) {
		const url = new URL(`http://localhost/api/weather${lang ? `?lang=${lang}` : ''}`);
		const response = await GET({ url } as Parameters<typeof GET>[0]);
		return {
			status: response.status,
			body: await response.json(),
			contentType: response.headers.get('content-type'),
			cacheControl: response.headers.get('cache-control'),
		};
	}

	it('returns the WeatherData shape as JSON on success', async () => {
		fetchMontrealWeatherMock.mockResolvedValueOnce({
			temp: -3,
			condition: 'light snow',
			icon: '13d',
		});
		const { status, body, contentType } = await call();
		expect(status).toBe(200);
		expect(contentType).toMatch(/application\/json/);
		expect(body).toEqual({ temp: -3, condition: 'light snow', icon: '13d' });
	});

	it('sets the 30-minute edge cache-control header', async () => {
		fetchMontrealWeatherMock.mockResolvedValueOnce({ temp: 20, condition: 'clear sky', icon: '01d' });
		const { cacheControl } = await call();
		expect(cacheControl).toBe('public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
	});

	it('returns JSON null (200, still cacheable) when the util has no data', async () => {
		fetchMontrealWeatherMock.mockResolvedValueOnce(null);
		const { status, body, cacheControl } = await call();
		expect(status).toBe(200);
		expect(body).toBeNull();
		expect(cacheControl).toBe('public, max-age=0, s-maxage=1800, stale-while-revalidate=3600');
	});

	it('never exposes anything beyond the public weather fields', async () => {
		fetchMontrealWeatherMock.mockResolvedValueOnce({
			temp: 7,
			condition: 'mist',
			icon: '50n',
		});
		const { body } = await call();
		expect(Object.keys(body).sort()).toEqual(['condition', 'icon', 'temp']);
	});

	it('threads a supported ?lang= through to fetchMontrealWeather', async () => {
		fetchMontrealWeatherMock.mockResolvedValueOnce({ temp: 1, condition: 'neige', icon: '13d' });
		await call('fr');
		expect(fetchMontrealWeatherMock).toHaveBeenCalledWith('fr');
	});

	it('defaults to en when ?lang= is missing or unsupported', async () => {
		fetchMontrealWeatherMock.mockResolvedValue({ temp: 1, condition: 'clear sky', icon: '01d' });
		await call();
		expect(fetchMontrealWeatherMock).toHaveBeenLastCalledWith('en');
		await call('de');
		expect(fetchMontrealWeatherMock).toHaveBeenLastCalledWith('en');
	});
});
