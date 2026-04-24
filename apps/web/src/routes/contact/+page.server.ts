import { fetchMontrealWeather } from '$lib/utils/weather';

export async function load() {
	const weather = await fetchMontrealWeather();
	return { weather };
}
