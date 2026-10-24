import { describe, it, expect } from 'vitest';
import { aboutPageContent } from './about-page.js';

describe('aboutPageContent', () => {
	describe('identity', () => {
		it('has name with en key', () => {
			expect(aboutPageContent.identity.name.en).toBe('Yesid');
		});

		it('keeps the identity value prop concise and removes the old mom-computer story', () => {
			expect(aboutPageContent.identity.valueProp.en.length).toBeLessThanOrEqual(260);
			expect(aboutPageContent.identity.valueProp.en.toLowerCase()).not.toContain('mom');
			expect(aboutPageContent.identity.valueProp.en).not.toContain('2005');
			expect(aboutPageContent.identity.valueProp.en).toContain(
				'so they stay behind the wheel.',
			);
			// Conversion batch (homework #20): the value prop now names the trade in
			// station order and keeps the wheel metaphor, trimmed to fit the cap.
			expect(aboutPageContent.identity.valueProp.en).toBe(
				"I'm Yesid, a Montreal builder who likes clear systems and plain explanations. My trade runs through databases, pipelines, dashboards, and websites. When clients work with me, I teach them what things mean so they stay behind the wheel.",
			);
			expect(aboutPageContent.identity.valueProp.en).not.toContain('take advantage');
			const valuePropFr = aboutPageContent.identity.valueProp.fr;
			expect(valuePropFr).toBeDefined();
			expect(valuePropFr?.length).toBeLessThanOrEqual(300);
			expect(valuePropFr?.toLowerCase()).not.toContain('mère');
			expect(valuePropFr).not.toContain('2005');
			expect(valuePropFr).not.toContain('Je suis Yesid');
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
	});

	describe('testimonials', () => {
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
		it('has exactly the three CMS-backed language panels in order', () => {
			expect(aboutPageContent.languages).toEqual([
				{
					id: 'quebec',
					label: { en: 'French', fr: 'Français', es: 'Francés' },
					image: expect.any(String),
				},
				{
					id: 'canada',
					label: { en: 'English', fr: 'Anglais', es: 'Inglés' },
					image: expect.any(String),
				},
				{
					id: 'colombia',
					label: { en: 'Spanish', fr: 'Espagnol', es: 'Español' },
					image: expect.any(String),
				},
			]);
			expect(JSON.stringify(aboutPageContent.languages)).not.toContain('"flag"');
			for (const language of aboutPageContent.languages) {
				expect(language.image.length).toBeGreaterThan(0);
			}
		});
	});

	describe('education', () => {
		it('has Champlain and Bishop education rows', () => {
			expect(aboutPageContent.education).toEqual([
				{
					school: {
						en: 'Champlain Regional College, Lennoxville',
						fr: 'Champlain Regional College, Lennoxville',
						es: 'Champlain Regional College, Lennoxville',
					},
					program: {
						en: 'DEC, Accounting & Management Technology',
						fr: 'DEC, Techniques de comptabilité et de gestion',
						es: 'DEC, Técnicas de contabilidad y gestión',
					},
					icon: 'champlain',
				},
				{
					school: {
						en: "Bishop's University",
						fr: "Bishop's University",
						es: "Bishop's University",
					},
					program: {
						en: 'B.Sc. Computer Science, minor in Business Administration',
						fr: 'B. Sc. informatique, mineure en administration des affaires',
						es: 'B.Sc. en Ciencias de la Computación, minor en Administración de Empresas',
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
			expect(aboutPageContent.interests[0]).toMatchObject({
				id: 'anime',
				image: '/images/about/interests/anime.webp',
				label: { en: 'Manga', fr: 'Manga' },
			});
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

		it('has at least 2 social links', () => {
			expect(aboutPageContent.cta.socials.length).toBeGreaterThanOrEqual(2);
			for (const s of aboutPageContent.cta.socials) {
				expect(s.label.length).toBeGreaterThan(0);
				expect(s.href.length).toBeGreaterThan(0);
			}
		});
	});
});
