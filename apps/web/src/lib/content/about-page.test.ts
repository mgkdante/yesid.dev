import { describe, it, expect } from 'vitest';
import { aboutPageContent } from './about-page.js';

describe('aboutPageContent', () => {
	describe('identity', () => {
		it('has name with en key', () => {
			expect(aboutPageContent.identity.name.en).toBe('Yesid');
		});

		it('has non-empty title and value prop', () => {
			expect(aboutPageContent.identity.title.en.length).toBeGreaterThan(0);
			expect(aboutPageContent.identity.valueProp.en.length).toBeGreaterThan(0);
		});

		it('headshot points to webp file', () => {
			expect(aboutPageContent.identity.headshot).toMatch(/\.webp$/);
		});

		it('has exactly 7 polaroids', () => {
			expect(aboutPageContent.identity.polaroids.length).toBe(7);
		});

		it('polaroids have rotate between -5 and 5', () => {
			for (const p of aboutPageContent.identity.polaroids) {
				expect(p.rotate).toBeGreaterThanOrEqual(-5);
				expect(p.rotate).toBeLessThanOrEqual(5);
				expect(p.alt.en.length).toBeGreaterThan(0);
				expect(p.caption.en.length).toBeGreaterThan(0);
				expect(p.src.length).toBeGreaterThan(0);
			}
		});
	});

	describe('metrics', () => {
		it('has at least 3 metrics', () => {
			expect(aboutPageContent.metrics.length).toBeGreaterThanOrEqual(3);
		});

		it('every metric has a value and label', () => {
			for (const m of aboutPageContent.metrics) {
				expect(m.value.length).toBeGreaterThan(0);
				expect(m.label.en.length).toBeGreaterThan(0);
			}
		});
	});

	describe('methodology', () => {
		it('has at least 3 steps', () => {
			expect(aboutPageContent.methodology.length).toBeGreaterThanOrEqual(3);
		});

		it('stations are sequential starting at 1', () => {
			const stations = aboutPageContent.methodology.map((s) => s.station);
			for (let i = 0; i < stations.length; i++) {
				expect(stations[i]).toBe(i + 1);
			}
		});

		it('every step has a unique id', () => {
			const ids = aboutPageContent.methodology.map((s) => s.id);
			expect(new Set(ids).size).toBe(ids.length);
		});

		it('every step has label and description', () => {
			for (const step of aboutPageContent.methodology) {
				expect(step.label.en.length).toBeGreaterThan(0);
				expect(step.description.en.length).toBeGreaterThan(0);
			}
		});
	});

	describe('testimonials', () => {
		it('has exactly one playful quote', () => {
			expect(aboutPageContent.testimonials).toHaveLength(1);
			expect(aboutPageContent.testimonials[0]?.quote.en).toBe(
				"You have the gift of perseverance, and that's what makes you a genius too.",
			);
			expect(aboutPageContent.testimonials[0]?.quote.fr).toBe(
				"Tu as le don de la persévérance, et c'est ce qui fait de toi un génie.",
			);
			expect(aboutPageContent.testimonials[0]?.author).toBe('Guy Sensei');
		});

		it('every testimonial has required fields', () => {
			for (const t of aboutPageContent.testimonials) {
				expect(t.quote.en.length).toBeGreaterThan(0);
				expect(t.author.length).toBeGreaterThan(0);
				expect(t.role.en.length).toBeGreaterThan(0);
				expect(t.company.length).toBeGreaterThan(0);
			}
		});
	});

	describe('languages', () => {
		it('has exactly the three native language names', () => {
			expect(aboutPageContent.languages).toEqual(['Español', 'English', 'Français']);
		});
	});

	describe('education', () => {
		it('has Champlain and Bishop education rows', () => {
			expect(aboutPageContent.education).toEqual([
				{
					school: { en: 'Champlain Regional College, Lennoxville', fr: 'Champlain Regional College, Lennoxville' },
					program: {
						en: 'DEC, Accounting & Management Technology',
						fr: 'DEC, Techniques de comptabilité et de gestion',
					},
					icon: 'champlain',
				},
				{
					school: { en: "Bishop's University", fr: "Bishop's University" },
					program: {
						en: 'B.Sc. Computer Science, minor in Business Administration',
						fr: 'B. Sc. informatique, mineure en administration des affaires',
					},
					icon: 'bishops',
				},
			]);
		});
	});

	describe('interests', () => {
		it('has at least 3 interests', () => {
			expect(aboutPageContent.interests.length).toBeGreaterThanOrEqual(3);
		});

		it('every interest has id, label, and image', () => {
			for (const interest of aboutPageContent.interests) {
				expect(interest.id.length).toBeGreaterThan(0);
				expect(interest.label.en.length).toBeGreaterThan(0);
				expect(interest.image.length).toBeGreaterThan(0);
			}
		});

		it('every interest has unique id', () => {
			const ids = aboutPageContent.interests.map((i) => i.id);
			expect(new Set(ids).size).toBe(ids.length);
		});

		it('uses the real-person transit and space rows', () => {
			const ids = aboutPageContent.interests.map((i) => i.id);
			expect(ids).toEqual(['anime', 'transit', 'space', 'food']);
			expect(aboutPageContent.interests[1]).toMatchObject({
				id: 'transit',
				image: '/images/about/interests/transit.webp',
				label: { en: 'Transit', fr: 'Transport collectif' },
			});
			expect(aboutPageContent.interests[2]).toMatchObject({
				id: 'space',
				image: '/images/about/interests/space.webp',
				label: { en: 'Space', fr: "L'espace" },
			});
		});
	});

	describe('weather', () => {
		it('has city name', () => {
			expect(aboutPageContent.weather.city.en).toBe('Montreal');
		});

		it('has hook text for location wordplay', () => {
			expect(aboutPageContent.weather.hook.en.length).toBeGreaterThan(0);
		});

		it('enabled is a boolean', () => {
			expect(typeof aboutPageContent.weather.enabled).toBe('boolean');
		});
	});

	describe('cta', () => {
		it('has terminal command', () => {
			expect(aboutPageContent.cta.command).toContain('yesid');
		});

		it('has at least 2 terminal lines', () => {
			expect(aboutPageContent.cta.lines.length).toBeGreaterThanOrEqual(2);
		});

		it('button links to /contact', () => {
			expect(aboutPageContent.cta.buttonHref).toBe('/contact');
		});

		it('has a button label', () => {
			expect(aboutPageContent.cta.buttonLabel.en.length).toBeGreaterThan(0);
		});

		it('has at least 2 social links', () => {
			expect(aboutPageContent.cta.socials.length).toBeGreaterThanOrEqual(2);
			for (const s of aboutPageContent.cta.socials) {
				expect(s.label.length).toBeGreaterThan(0);
				expect(s.href.length).toBeGreaterThan(0);
			}
		});
	});
});
