import { expect, it } from 'vitest';
import { topicLabel } from './blog-topics';

it('translates display labels without changing topic keys', () => {
	const slug = 'systems-thinking';
	expect(topicLabel(slug, 'fr')).toBe('Pensée systémique');
	expect(topicLabel(slug, 'es')).toBe('Pensamiento sistémico');
});
