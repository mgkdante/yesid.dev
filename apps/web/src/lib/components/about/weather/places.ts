// The landmark drawings. The skyline ships with the page (it is the server-rendered
// default); every other place loads on demand, about 3 to 4 KB gzipped each, so the
// card never carries all ten up front. Repository-owned SVG only, never CMS or API text.
import skyline from './places/skyline.svg?raw';
import type { WeatherPlaceId } from '../weather-scene';

const LOADERS = import.meta.glob<string>('./places/*.svg', { query: '?raw', import: 'default' });
const cache = new Map<WeatherPlaceId, string>([['skyline', skyline]]);

/** The drawing if it is already here. */
export function placeSvg(id: WeatherPlaceId): string | undefined {
	return cache.get(id);
}

/** Load a drawing once; later calls resolve from the cache. */
export async function loadPlace(id: WeatherPlaceId): Promise<string> {
	const hit = cache.get(id);
	if (hit !== undefined) return hit;
	const load = LOADERS[`./places/${id}.svg`];
	const svg = load ? await load() : '';
	cache.set(id, svg);
	return svg;
}
