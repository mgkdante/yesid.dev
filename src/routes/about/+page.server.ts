import { aboutPageContent } from '$lib/data/about-page.js';
import { fetchMontrealWeather } from '$lib/data/weather.js';

export async function load() {
	if (!aboutPageContent.weather.enabled) {
		return { weather: null };
	}

	const weather = await fetchMontrealWeather();
	return { weather };
}
