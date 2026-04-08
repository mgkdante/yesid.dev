import { describe, it, expect } from 'vitest';
import { contactContent } from './contact-page.js';

describe('contactContent', () => {
	describe('stationLabel', () => {
		it('has en key', () => {
			expect(contactContent.stationLabel.en.length).toBeGreaterThan(0);
		});
	});
});
