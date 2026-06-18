import { describe, expect, it } from 'bun:test';
import { BlogPageContentSchema } from './blog-page';

const ls = (en: string) => ({ en });

describe('BlogPageContentSchema', () => {
	it('parses the CMS-backed blog entry rail', () => {
		const value = {
			intro: ls('Notes from the field.'),
			heading: ls('Blog'),
			backToDispatches: ls('back to Blog'),
			backToPersonal: ls('back to personal'),
			personalHeading: ls('Personal Corner'),
			personalIntro: ls('Off-work notes.'),
			toPersonalLabel: ls('Personal Corner'),
			toPersonalSubtitle: ls('Off the clock'),
			toProfessionalLabel: ls('Back to Blog'),
			toProfessionalSubtitle: ls('Brand notes'),
			entryRail: {
				workWithMe: {
					title: ls('Work With Me'),
					prompt: ls('Need a system that stays editable?'),
					primary: { label: ls('View Services'), href: '/services' },
					secondary: { label: ls('Start a Project'), href: '/contact' },
				},
				routes: {
					title: ls('Pick A Route'),
					links: [
						{ label: ls('Case studies'), href: '/projects' },
						{ label: ls('Services'), href: '/services' },
					],
				},
			},
		};

		const parsed = BlogPageContentSchema.parse(value);
		expect(parsed.entryRail.workWithMe.primary.href).toBe('/services');
		expect(parsed.entryRail.routes.links.map((link) => link.href)).toEqual(['/projects', '/services']);
	});
});
