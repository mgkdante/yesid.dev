import { aboutPageContent } from '$lib/content/about-page';
import { fetchMontrealWeather } from '$lib/utils/weather';

export async function load() {
	if (!aboutPageContent.weather.enabled) {
		return { weather: null };
	}

	const weather = await fetchMontrealWeather();
	return { weather };
}
