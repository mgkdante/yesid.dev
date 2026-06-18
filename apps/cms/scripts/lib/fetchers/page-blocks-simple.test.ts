import { describe, expect, it } from 'bun:test';
import {
	toBlogPageContent,
	toProjectsPageContent,
} from './page-blocks-simple';
import { BlogPageContentSchema, ProjectsPageContentSchema } from '@repo/shared';

describe('blog-page transform', () => {
	const fixture = {
		id: 1,
		translations: [
			{
				languages_code: 'en',
				intro: 'Professional notes from the field.',
				heading: 'Blog',
				back_to_dispatches: 'back to Blog',
				back_to_personal: 'back to personal',
				personal_heading: 'Personal Corner',
				personal_intro: 'Off-work notes from the same builder.',
				to_personal_label: 'Personal Corner',
				to_personal_subtitle: 'Off the clock',
				to_professional_label: 'Back to Blog',
				to_professional_subtitle: 'Brand notes',
				entry_rail_work_title: 'Work With Me',
				entry_rail_work_prompt: 'Need a system that stays editable?',
				entry_rail_services_label: 'View Services',
				entry_rail_contact_label: 'Start a Project',
				entry_rail_routes_title: 'Pick A Route',
				entry_rail_route_case_studies_label: 'Case studies',
				entry_rail_route_services_label: 'Services',
				entry_rail_route_stack_label: 'Stack',
				entry_rail_route_about_label: 'About the author',
				entry_rail_route_contact_label: 'Contact',
			},
			{
				languages_code: 'fr',
				intro: 'Notes professionnelles du terrain.',
				personal_heading: 'Coin perso',
				personal_intro: 'Notes hors mandat du même bâtisseur.',
				to_personal_label: 'Coin perso',
				to_personal_subtitle: 'Hors mandat',
				to_professional_label: 'Retour au blogue',
				to_professional_subtitle: 'Notes de marque',
				entry_rail_work_title: 'Travailler ensemble',
				entry_rail_work_prompt: 'Besoin d’un système qui reste éditable?',
				entry_rail_services_label: 'Voir les services',
				entry_rail_contact_label: 'Démarrer un projet',
				entry_rail_routes_title: 'Choisir une route',
				entry_rail_route_case_studies_label: 'Études de cas',
				entry_rail_route_services_label: 'Services',
				entry_rail_route_stack_label: 'Stack',
				entry_rail_route_about_label: 'À propos de l\'auteur',
				entry_rail_route_contact_label: 'Contact',
			},
		],
		entry_rail_services_href: '/services',
		entry_rail_contact_href: '/contact',
		entry_rail_route_case_studies_href: '/projects',
		entry_rail_route_services_href: '/services',
		entry_rail_route_stack_href: '/tech-stack',
		entry_rail_route_about_href: '/about',
		entry_rail_route_contact_href: '/contact',
	};

	it('produces LocalizedString fields with fr/es merged where present', () => {
		const result = toBlogPageContent(fixture);
		expect(result.intro).toEqual({
			en: 'Professional notes from the field.',
			fr: 'Notes professionnelles du terrain.',
		});
		expect(result.heading).toEqual({ en: 'Blog' });
	});

	it('maps listing lane copy for professional and personal blog pages', () => {
		const result = toBlogPageContent(fixture);
		expect(result.personalHeading).toEqual({ en: 'Personal Corner', fr: 'Coin perso' });
		expect(result.personalIntro).toEqual({
			en: 'Off-work notes from the same builder.',
			fr: 'Notes hors mandat du même bâtisseur.',
		});
		expect(result.toPersonalLabel).toEqual({ en: 'Personal Corner', fr: 'Coin perso' });
		expect(result.toPersonalSubtitle).toEqual({ en: 'Off the clock', fr: 'Hors mandat' });
		expect(result.toProfessionalLabel).toEqual({
			en: 'Back to Blog',
			fr: 'Retour au blogue',
		});
		expect(result.toProfessionalSubtitle).toEqual({
			en: 'Brand notes',
			fr: 'Notes de marque',
		});
	});

	it('output parses through BlogPageContentSchema', () => {
		const result = toBlogPageContent(fixture);
		expect(() => BlogPageContentSchema.parse(result)).not.toThrow();
	});

	it('maps the CMS-backed blog entry rail CTA and guided routes', () => {
		const result = toBlogPageContent(fixture);
		expect(result.entryRail.workWithMe.prompt).toEqual({
			en: 'Need a system that stays editable?',
			fr: 'Besoin d’un système qui reste éditable?',
		});
		expect(result.entryRail.workWithMe.primary).toEqual({
			label: { en: 'View Services', fr: 'Voir les services' },
			href: '/services',
		});
		expect(result.entryRail.routes.links.map((link) => link.href)).toEqual([
			'/about',
			'/projects',
			'/services',
			'/tech-stack',
			'/contact',
		]);
		expect(result.entryRail.routes.links[0].label).toEqual({
			en: 'About the author',
			fr: 'À propos de l\'auteur',
		});
	});
});

describe('projects-page transform', () => {
	it('produces LocalizedString intro/heading/emptyState from translations', () => {
		const result = toProjectsPageContent({
			id: 1,
			translations: [
				{
					languages_code: 'en',
					intro: 'Selected work.',
					heading: 'Projects',
					empty_state: 'No projects match the selected filters.',
				},
			],
		});
		expect(result.intro).toEqual({ en: 'Selected work.' });
		expect(result.heading).toEqual({ en: 'Projects' });
		expect(result.emptyState).toEqual({ en: 'No projects match the selected filters.' });
		expect(() => ProjectsPageContentSchema.parse(result)).not.toThrow();
	});
});
