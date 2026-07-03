/**
 * site_labels fetcher (go2-t1c) — reads the site_labels singleton and
 * regroups the prefix-named flat columns (a11y_/ui_/pages_/email_) into the
 * nested SiteLabels shape consumed by apps/web components.
 */
import { toLocalizedString } from '../locale';
import { SiteLabelsSchema, type SiteLabels } from '@repo/shared/schemas';
import { fetchBlockSingleton } from './singleton';
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
			replayIntro: ls('a11y_replay_intro'),
			projectImageOpen: ls('a11y_project_image_open'),
			projectImageClose: ls('a11y_project_image_close'),
			moreMetrics: ls('a11y_more_metrics'),
			architectureDiagram: ls('a11y_architecture_diagram'),
			technologyStackTemplate: ls('a11y_technology_stack_template'),
			quietModeLabel: ls('a11y_quiet_mode_label'),
			quietModeLabelCollapsed: ls('a11y_quiet_mode_label_collapsed'),
			quietModeEnable: ls('a11y_quiet_mode_enable'),
			quietModeDisable: ls('a11y_quiet_mode_disable'),
			quietModeRemember: ls('a11y_quiet_mode_remember'),
			quietModeForget: ls('a11y_quiet_mode_forget'),
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
			metroCaption: ls('ui_metro_caption'),
			stationsOneSystem: ls('ui_stations_one_system'),
			terminalTitle: ls('ui_terminal_title'),
			resultCount: {
				singular: ls('ui_result_count_singular'),
				plural: ls('ui_result_count_plural'),
			},
			languageNames: {
				en: ls('ui_language_name_en'),
				fr: ls('ui_language_name_fr'),
				es: ls('ui_language_name_es'),
			},
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
		// --- slice-30 t1: code-owned chrome groups ----------------------------
		// Recompose the flat projects_/blog_/services_/nav_/footer_/hero_ columns
		// back into the companion-module shapes so a future regen sources them
		// straight from Directus into the constants the components already import.
		projectsChrome: {
			pageMeta: {
				title: ls('projects_chrome_meta_title'),
				description: ls('projects_chrome_meta_description'),
			},
			listing: {
				heading: ls('projects_chrome_listing_heading'),
				searchPlaceholder: ls('projects_chrome_listing_search_placeholder'),
				seeAllLink: ls('projects_chrome_listing_see_all_link'),
				filters: {
					filtersLabel: ls('projects_chrome_listing_filters_label'),
					services: ls('projects_chrome_listing_filters_services'),
					tags: ls('projects_chrome_listing_filters_tags'),
					techStack: ls('projects_chrome_listing_filters_tech_stack'),
					allLabel: ls('projects_chrome_listing_filters_all_label'),
					showingPrefix: ls('projects_chrome_listing_filters_showing_prefix'),
				},
				card: {
					stackOverflowSuffix: ls('projects_chrome_listing_card_stack_overflow_suffix'),
				},
			},
			detail: {
				backToListingLabel: ls('projects_chrome_detail_back_to_listing_label'),
				tocSectionTitle: ls('projects_chrome_detail_toc_section_title'),
				readmeSectionTitle: ls('projects_chrome_detail_readme_section_title'),
				glance: {
					overview: ls('projects_chrome_detail_glance_overview'),
					impact: ls('projects_chrome_detail_glance_impact'),
					stack: ls('projects_chrome_detail_glance_stack'),
					services: ls('projects_chrome_detail_glance_services'),
					links: ls('projects_chrome_detail_glance_links'),
					projectInfo: ls('projects_chrome_detail_glance_project_info'),
					liveSiteLabel: ls('projects_chrome_detail_glance_live_site_label'),
					liveSiteLabelMobile: ls('projects_chrome_detail_glance_live_site_label_mobile'),
					githubLabel: ls('projects_chrome_detail_glance_github_label'),
					repoPrivateLabel: ls('projects_chrome_detail_glance_repo_private_label'),
				},
				tocPill: {
					openAria: ls('projects_chrome_detail_toc_pill_open_aria'),
					closeAria: ls('projects_chrome_detail_toc_pill_close_aria'),
				},
				cta: {
					overline: ls('projects_chrome_detail_cta_overline'),
					heading: ls('projects_chrome_detail_cta_heading'),
					body: ls('projects_chrome_detail_cta_body'),
					primaryLabel: ls('projects_chrome_detail_cta_primary_label'),
					secondaryLabel: ls('projects_chrome_detail_cta_secondary_label'),
				},
			},
		},
		blogChrome: {
			listing: {
				mobileHeading: ls('blog_chrome_listing_mobile_heading'),
				searchPlaceholder: ls('blog_chrome_listing_search_placeholder'),
				resultNoun: ls('blog_chrome_listing_result_noun'),
				noPostsMessage: ls('blog_chrome_listing_no_posts_message'),
				noPostsEmptyMessage: ls('blog_chrome_listing_no_posts_empty_message'),
				filters: {
					filtersLabel: ls('blog_chrome_listing_filters_label'),
					allLabel: ls('blog_chrome_listing_filters_all_label'),
					language: ls('blog_chrome_listing_filters_language'),
					dateRange: ls('blog_chrome_listing_filters_date_range'),
					from: ls('blog_chrome_listing_filters_from'),
					to: ls('blog_chrome_listing_filters_to'),
					tags: ls('blog_chrome_listing_filters_tags'),
					showingPrefix: ls('blog_chrome_listing_filters_showing_prefix'),
				},
				routeMap: {
					title: ls('blog_chrome_listing_route_map_title'),
					terminus: ls('blog_chrome_listing_route_map_terminus'),
				},
			},
			detail: {
				code: {
					title: ls('blog_chrome_detail_code_title'),
					copyAria: ls('blog_chrome_detail_code_copy_aria'),
					copyLabel: ls('blog_chrome_detail_code_copy_label'),
					errorLabel: ls('blog_chrome_detail_code_error_label'),
				},
				backNav: {
					toPersonal: ls('blog_chrome_detail_back_nav_to_personal'),
					toDispatches: ls('blog_chrome_detail_back_nav_to_dispatches'),
				},
				header: {
					postTagsAria: ls('blog_chrome_detail_header_post_tags_aria'),
					readingTimeLabel: ls('blog_chrome_detail_header_reading_time_label'),
				},
				page: {
					readingMode: ls('blog_chrome_detail_page_reading_mode'),
					tocSectionTitle: ls('blog_chrome_detail_page_toc_section_title'),
					metaCategory: ls('blog_chrome_detail_page_meta_category'),
					metaWords: ls('blog_chrome_detail_page_meta_words'),
					metaReadTime: ls('blog_chrome_detail_page_meta_read_time'),
					metaLanguage: ls('blog_chrome_detail_page_meta_language'),
					metaTags: ls('blog_chrome_detail_page_meta_tags'),
				},
				tocPill: {
					openAria: ls('blog_chrome_detail_toc_pill_open_aria'),
					closeAria: ls('blog_chrome_detail_toc_pill_close_aria'),
				},
			},
		},
		servicesChrome: {
			listing: {
				heading: ls('services_chrome_listing_heading'),
				stationLabelTemplate: ls('services_chrome_listing_station_label_template'),
				deepDiveLabel: ls('services_chrome_listing_deep_dive_label'),
				stationShortLabels: {
					'database-engineering': ls('services_chrome_listing_station_short_database_engineering'),
					'data-pipeline': ls('services_chrome_listing_station_short_data_pipeline'),
					'analytics-reporting': ls('services_chrome_listing_station_short_analytics_reporting'),
					'web-development': ls('services_chrome_listing_station_short_web_development'),
				},
				projectsStrip: {
					builtWithService: ls('services_chrome_listing_projects_strip_built_with_service'),
					builtWithFallback: ls('services_chrome_listing_projects_strip_built_with_fallback'),
					projectSingular: ls('services_chrome_listing_projects_strip_project_singular'),
					projectPlural: ls('services_chrome_listing_projects_strip_project_plural'),
				},
			},
			pageMeta: {
				title: ls('services_chrome_meta_title'),
				description: ls('services_chrome_meta_description'),
			},
			detail: {
				backToServicesLabel: ls('services_chrome_detail_back_to_services_label'),
				valuePropositionHeading: ls('services_chrome_detail_value_proposition_heading'),
				deliverablesHeading: ls('services_chrome_detail_deliverables_heading'),
				relatedProjectsHeading: ls('services_chrome_detail_related_projects_heading'),
				relatedProjectsNavAria: ls('services_chrome_detail_related_projects_nav_aria'),
				serviceNavAria: ls('services_chrome_detail_service_nav_aria'),
				stackHeading: ls('services_chrome_detail_stack_heading'),
				seeStackLabel: ls('services_chrome_detail_see_stack_label'),
				cta: {
					overline: ls('services_chrome_detail_cta_overline'),
					heading: ls('services_chrome_detail_cta_heading'),
					body: ls('services_chrome_detail_cta_body'),
					primaryLabel: ls('services_chrome_detail_cta_primary_label'),
					secondaryLabel: ls('services_chrome_detail_cta_secondary_label'),
				},
			},
		},
		navChrome: {
			directions: {
				previous: ls('nav_chrome_directions_previous'),
				next: ls('nav_chrome_directions_next'),
			},
			shared: {
				openMenuAria: ls('nav_chrome_shared_open_menu_aria'),
				closeMenuAria: ls('nav_chrome_shared_close_menu_aria'),
				themeToggleAria: ls('nav_chrome_shared_theme_toggle_aria'),
				footerNavAria: ls('nav_chrome_shared_footer_nav_aria'),
				menuOverlayAria: ls('nav_chrome_shared_menu_overlay_aria'),
				menuOverlayFooterLabel: ls('nav_chrome_shared_menu_overlay_footer_label'),
				localeSwitcherAria: ls('nav_chrome_shared_locale_switcher_aria'),
				searchPlaceholder: ls('nav_chrome_shared_search_placeholder'),
				clearFiltersLabel: ls('nav_chrome_shared_clear_filters_label'),
				tocToggleSectionAria: ls('nav_chrome_shared_toc_toggle_section_aria'),
				tocHeading: ls('nav_chrome_shared_toc_heading'),
				tocMobileButton: ls('nav_chrome_shared_toc_mobile_button'),
				tocCloseAria: ls('nav_chrome_shared_toc_close_aria'),
				tocCounterPrefix: ls('nav_chrome_shared_toc_counter_prefix'),
			},
		},
		footerChrome: {
			relatedProjectsStrip: {
				builtWithLabel: ls('footer_chrome_related_projects_strip_built_with_label'),
				projectCountSingular: ls('footer_chrome_related_projects_strip_project_count_singular'),
				projectCountPlural: ls('footer_chrome_related_projects_strip_project_count_plural'),
			},
			footer: {
				tagline: ls('footer_chrome_footer_tagline'),
				location: ls('footer_chrome_footer_location'),
				statusPrefix: ls('footer_chrome_footer_status_prefix'),
			},
		},
		heroDashboard: {
			vehiclesLabel: ls('hero_dashboard_vehicles_label'),
			vehiclesSub: ls('hero_dashboard_vehicles_sub'),
			vehiclesSubLive: ls('hero_dashboard_vehicles_sub_live'),
			delayLabel: ls('hero_dashboard_delay_label'),
			delaySub: ls('hero_dashboard_delay_sub'),
			routesLabel: ls('hero_dashboard_routes_label'),
			routesSub: ls('hero_dashboard_routes_sub'),
		},
	};
}

export async function fetchSiteLabels({ client }: FetcherContext): Promise<SiteLabels> {
	const row = await fetchBlockSingleton<SiteLabelsRow>(
		client,
		'site_labels',
		'fetchSiteLabels/site_labels',
		['id', { translations: ['*'] }],
	);
	return SiteLabelsSchema.parse(toSiteLabels(row));
}
