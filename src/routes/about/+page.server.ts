import { getAboutPageContent } from '$lib/repositories';
import { fetchMontrealWeather } from '$lib/utils/weather';

export async function load() {
	const about = await getAboutPageContent();
	if (!about.weather.enabled) {
		return { weather: null };
	}

	const weather = await fetchMontrealWeather();
	return { weather };
}
