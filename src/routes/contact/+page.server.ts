import { fetchMontrealWeather } from '$lib/data/weather.js';

export async function load() {
	const weather = await fetchMontrealWeather();
	return { weather };
}
