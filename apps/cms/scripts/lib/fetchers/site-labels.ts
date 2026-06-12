/**
 * site_labels fetcher (go2-t1c) — reads the site_labels singleton and
 * regroups the prefix-named flat columns (a11y_/ui_/pages_/email_) into the
 * nested SiteLabels shape consumed by apps/web components.
 */
import { readSingleton } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import { SiteLabelsSchema, type SiteLabels } from '@repo/shared/schemas';
import { asSingletonRow } from './singleton';
import type { FetcherContext } from './types';

interface SiteLabelsRow {
	id: string;
	translations?: ReadonlyArray<Record<string, unknown> & { languages_code: string }>;
}

export function toSiteLabels(raw: SiteLabelsRow): SiteLabels {
	const tr = raw.translations ?? [];
	const ls = (field: string) => toLocalizedString(tr, field);
	return {
		a11y: {
			navCapabilities: ls('a11y_nav_capabilities'),
			carouselPrev: ls('a11y_carousel_prev'),
			carouselNext: ls('a11y_carousel_next'),
			navTechStack: ls('a11y_nav_tech_stack'),
			toc: ls('a11y_toc'),
			closerGraffiti: ls('a11y_closer_graffiti'),
		},
		ui: {
			markerService: ls('ui_marker_service'),
			markerFeatured: ls('ui_marker_featured'),
			backToProjects: ls('ui_back_to_projects'),
			errorStatusNote: ls('ui_error_status_note'),
			blogEditionTemplate: ls('ui_blog_edition_template'),
			copyrightTemplate: ls('ui_copyright_template'),
			nounProject: ls('ui_noun_project'),
			categoryPersonal: ls('ui_category_personal'),
			categoryProfessional: ls('ui_category_professional'),
			watermarkPersonal: ls('ui_watermark_personal'),
			watermarkProfessional: ls('ui_watermark_professional'),
		},
		pages: {
			blogEdgeTitle: ls('pages_blog_edge_title'),
			projectsEdgeTitle: ls('pages_projects_edge_title'),
			homeSectionProjects: ls('pages_home_section_projects'),
			homeSectionServices: ls('pages_home_section_services'),
			homeSectionTerminus: ls('pages_home_section_terminus'),
		},
		email: {
			contactSubjectTemplate: ls('email_contact_subject_template'),
		},
	};
}

export async function fetchSiteLabels({ client }: FetcherContext): Promise<SiteLabels> {
	const result = await client.request(
		readSingleton('site_labels', {
			fields: ['id', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<SiteLabelsRow>(result, 'fetchSiteLabels/site_labels');
	return SiteLabelsSchema.parse(toSiteLabels(row));
}
