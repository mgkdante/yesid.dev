/**
 * site_labels fetcher (go2-t1c) — reads the site_labels singleton and
 * regroups the prefix-named flat columns (a11y_/ui_/pages_/email_) into the
 * nested SiteLabels shape consumed by apps/web components.
 */
import { toLocalizedFields } from '../locale';
import { SiteLabelsSchema, type SiteLabels } from '@repo/shared/schemas';
import { fetchBlockSingleton } from './singleton';
import type { FetcherContext } from './types';

interface SiteLabelsRow {
	id: string;
	analytics_enabled?: unknown;
	analytics_consent_show_banner?: unknown;
	translations?: ReadonlyArray<Record<string, unknown> & { languages_code: string }>;
}

export function toSiteLabels(raw: SiteLabelsRow): SiteLabels {
	const tr = raw.translations ?? [];
	const enabledIsBoolean = typeof raw.analytics_enabled === 'boolean';
	const showBannerIsBoolean = typeof raw.analytics_consent_show_banner === 'boolean';
	const analyticsControls = {
		enabled: enabledIsBoolean ? raw.analytics_enabled : true,
		showBanner:
			enabledIsBoolean && showBannerIsBoolean
				? raw.analytics_consent_show_banner
				: true,
	};
	return {
		a11y: toLocalizedFields(tr, [
			['navCapabilities', 'a11y_nav_capabilities'], ['carouselPrev', 'a11y_carousel_prev'],
			['carouselNext', 'a11y_carousel_next'], ['navTechStack', 'a11y_nav_tech_stack'],
			['toc', 'a11y_toc'], ['closerGraffiti', 'a11y_closer_graffiti'],
			['replayIntro', 'a11y_replay_intro'], ['projectImageOpen', 'a11y_project_image_open'],
			['projectImageClose', 'a11y_project_image_close'], ['moreMetrics', 'a11y_more_metrics'],
			['architectureDiagram', 'a11y_architecture_diagram'],
			['technologyStackTemplate', 'a11y_technology_stack_template'],
			['quietModeLabel', 'a11y_quiet_mode_label'],
			['quietModeLabelCollapsed', 'a11y_quiet_mode_label_collapsed'],
			['quietModeEnable', 'a11y_quiet_mode_enable'], ['quietModeDisable', 'a11y_quiet_mode_disable'],
			['quietModeRemember', 'a11y_quiet_mode_remember'], ['quietModeForget', 'a11y_quiet_mode_forget'],
		]),
		ui: {
			...toLocalizedFields(tr, [
				['markerService', 'ui_marker_service'], ['markerFeatured', 'ui_marker_featured'],
				['backToProjects', 'ui_back_to_projects'], ['errorStatusNote', 'ui_error_status_note'],
				['blogEditionTemplate', 'ui_blog_edition_template'],
				['copyrightTemplate', 'ui_copyright_template'], ['nounProject', 'ui_noun_project'],
				['categoryPersonal', 'ui_category_personal'],
				['categoryProfessional', 'ui_category_professional'],
				['watermarkPersonal', 'ui_watermark_personal'],
				['watermarkProfessional', 'ui_watermark_professional'], ['metroCaption', 'ui_metro_caption'],
				['stationsOneSystem', 'ui_stations_one_system'], ['terminalTitle', 'ui_terminal_title'],
			]),
			resultCount: toLocalizedFields(tr, [
				['singular', 'ui_result_count_singular'], ['plural', 'ui_result_count_plural'],
			]),
			languageNames: toLocalizedFields(tr, [
				['en', 'ui_language_name_en'], ['fr', 'ui_language_name_fr'], ['es', 'ui_language_name_es'],
			]),
			analyticsConsent: {
				...analyticsControls,
				...toLocalizedFields(tr, [
					['title', 'ui_analytics_consent_title'], ['description', 'ui_analytics_consent_description'],
					['acceptLabel', 'ui_analytics_consent_accept_label'],
					['declineLabel', 'ui_analytics_consent_decline_label'],
					['settingsLabel', 'ui_analytics_consent_settings_label'],
					['privacyLabel', 'ui_analytics_consent_privacy_label'],
				]),
			},
		},
		pages: toLocalizedFields(tr, [
			['blogEdgeTitle', 'pages_blog_edge_title'], ['projectsEdgeTitle', 'pages_projects_edge_title'],
			['homeSectionProjects', 'pages_home_section_projects'],
			['homeSectionServices', 'pages_home_section_services'],
			['homeSectionAbout', 'pages_home_section_about'],
			['homeSectionTerminus', 'pages_home_section_terminus'],
		]),
		email: toLocalizedFields(tr, [['contactSubjectTemplate', 'email_contact_subject_template']]),
		// --- slice-30 t1: code-owned chrome groups ----------------------------
		// Recompose the flat projects_/blog_/services_/nav_/footer_/hero_ columns
		// back into the companion-module shapes so a future regen sources them
		// straight from Directus into the constants the components already import.
		projectsChrome: {
			pageMeta: toLocalizedFields(tr, [
				['title', 'projects_chrome_meta_title'], ['description', 'projects_chrome_meta_description'],
			]),
			listing: {
				...toLocalizedFields(tr, [
					['heading', 'projects_chrome_listing_heading'],
					['searchPlaceholder', 'projects_chrome_listing_search_placeholder'],
					['seeAllLink', 'projects_chrome_listing_see_all_link'],
				]),
				filters: toLocalizedFields(tr, [
					['filtersLabel', 'projects_chrome_listing_filters_label'], ['services', 'projects_chrome_listing_filters_services'],
					['tags', 'projects_chrome_listing_filters_tags'], ['techStack', 'projects_chrome_listing_filters_tech_stack'],
					['allLabel', 'projects_chrome_listing_filters_all_label'],
					['showingPrefix', 'projects_chrome_listing_filters_showing_prefix'],
				]),
				card: toLocalizedFields(tr, [
					['stackOverflowSuffix', 'projects_chrome_listing_card_stack_overflow_suffix'],
				]),
			},
			detail: {
				...toLocalizedFields(tr, [
					['backToListingLabel', 'projects_chrome_detail_back_to_listing_label'],
					['tocSectionTitle', 'projects_chrome_detail_toc_section_title'],
					['readmeSectionTitle', 'projects_chrome_detail_readme_section_title'],
				]),
				glance: toLocalizedFields(tr, [
					['overview', 'projects_chrome_detail_glance_overview'], ['impact', 'projects_chrome_detail_glance_impact'],
					['stack', 'projects_chrome_detail_glance_stack'], ['services', 'projects_chrome_detail_glance_services'],
					['links', 'projects_chrome_detail_glance_links'], ['projectInfo', 'projects_chrome_detail_glance_project_info'],
					['liveSiteLabel', 'projects_chrome_detail_glance_live_site_label'],
					['liveSiteLabelMobile', 'projects_chrome_detail_glance_live_site_label_mobile'],
					['githubLabel', 'projects_chrome_detail_glance_github_label'],
					['repoPrivateLabel', 'projects_chrome_detail_glance_repo_private_label'],
				]),
				tocPill: toLocalizedFields(tr, [
					['openAria', 'projects_chrome_detail_toc_pill_open_aria'],
					['closeAria', 'projects_chrome_detail_toc_pill_close_aria'],
				]),
			},
		},
		blogChrome: {
			listing: {
				...toLocalizedFields(tr, [
					['mobileHeading', 'blog_chrome_listing_mobile_heading'],
					['searchPlaceholder', 'blog_chrome_listing_search_placeholder'],
					['resultNoun', 'blog_chrome_listing_result_noun'],
					['noPostsMessage', 'blog_chrome_listing_no_posts_message'],
					['noPostsEmptyMessage', 'blog_chrome_listing_no_posts_empty_message'],
				]),
				filters: toLocalizedFields(tr, [
					['filtersLabel', 'blog_chrome_listing_filters_label'], ['allLabel', 'blog_chrome_listing_filters_all_label'],
					['language', 'blog_chrome_listing_filters_language'], ['dateRange', 'blog_chrome_listing_filters_date_range'],
					['from', 'blog_chrome_listing_filters_from'], ['to', 'blog_chrome_listing_filters_to'],
					['tags', 'blog_chrome_listing_filters_tags'],
					['showingPrefix', 'blog_chrome_listing_filters_showing_prefix'],
				]),
				routeMap: toLocalizedFields(tr, [
					['title', 'blog_chrome_listing_route_map_title'],
					['terminus', 'blog_chrome_listing_route_map_terminus'],
				]),
			},
			detail: {
				code: toLocalizedFields(tr, [
					['title', 'blog_chrome_detail_code_title'], ['copyAria', 'blog_chrome_detail_code_copy_aria'],
					['copyLabel', 'blog_chrome_detail_code_copy_label'],
					['errorLabel', 'blog_chrome_detail_code_error_label'],
				]),
				backNav: toLocalizedFields(tr, [
					['toPersonal', 'blog_chrome_detail_back_nav_to_personal'],
					['toDispatches', 'blog_chrome_detail_back_nav_to_dispatches'],
				]),
				header: toLocalizedFields(tr, [
					['postTagsAria', 'blog_chrome_detail_header_post_tags_aria'],
					['readingTimeLabel', 'blog_chrome_detail_header_reading_time_label'],
				]),
				page: toLocalizedFields(tr, [
					['readingMode', 'blog_chrome_detail_page_reading_mode'],
					['tocSectionTitle', 'blog_chrome_detail_page_toc_section_title'],
					['metaCategory', 'blog_chrome_detail_page_meta_category'], ['metaWords', 'blog_chrome_detail_page_meta_words'],
					['metaReadTime', 'blog_chrome_detail_page_meta_read_time'],
					['metaLanguage', 'blog_chrome_detail_page_meta_language'],
					['metaTags', 'blog_chrome_detail_page_meta_tags'],
				]),
				tocPill: toLocalizedFields(tr, [
					['openAria', 'blog_chrome_detail_toc_pill_open_aria'],
					['closeAria', 'blog_chrome_detail_toc_pill_close_aria'],
				]),
			},
		},
		servicesChrome: {
			listing: {
				...toLocalizedFields(tr, [
					['heading', 'services_chrome_listing_heading'],
					['stationLabelTemplate', 'services_chrome_listing_station_label_template'],
					['deepDiveLabel', 'services_chrome_listing_deep_dive_label'],
				]),
				stationShortLabels: toLocalizedFields(tr, [
					['database-engineering', 'services_chrome_listing_station_short_database_engineering'],
					['data-pipeline', 'services_chrome_listing_station_short_data_pipeline'],
					['analytics-reporting', 'services_chrome_listing_station_short_analytics_reporting'],
					['web-development', 'services_chrome_listing_station_short_web_development'],
				]),
				projectsStrip: toLocalizedFields(tr, [
					['builtWithService', 'services_chrome_listing_projects_strip_built_with_service'],
					['builtWithFallback', 'services_chrome_listing_projects_strip_built_with_fallback'],
					['projectSingular', 'services_chrome_listing_projects_strip_project_singular'],
					['projectPlural', 'services_chrome_listing_projects_strip_project_plural'],
				]),
			},
			pageMeta: toLocalizedFields(tr, [
				['title', 'services_chrome_meta_title'], ['description', 'services_chrome_meta_description'],
			]),
			detail: toLocalizedFields(tr, [
				['backToServicesLabel', 'services_chrome_detail_back_to_services_label'],
				['valuePropositionHeading', 'services_chrome_detail_value_proposition_heading'],
				['deliverablesHeading', 'services_chrome_detail_deliverables_heading'],
				['relatedProjectsHeading', 'services_chrome_detail_related_projects_heading'],
				['relatedProjectsNavAria', 'services_chrome_detail_related_projects_nav_aria'],
				['serviceNavAria', 'services_chrome_detail_service_nav_aria'], ['stackHeading', 'services_chrome_detail_stack_heading'],
				['seeStackLabel', 'services_chrome_detail_see_stack_label'],
			]),
		},
		navChrome: {
			directions: toLocalizedFields(tr, [
				['previous', 'nav_chrome_directions_previous'], ['next', 'nav_chrome_directions_next'],
			]),
			shared: toLocalizedFields(tr, [
				['openMenuAria', 'nav_chrome_shared_open_menu_aria'], ['closeMenuAria', 'nav_chrome_shared_close_menu_aria'],
				['themeToggleAria', 'nav_chrome_shared_theme_toggle_aria'], ['footerNavAria', 'nav_chrome_shared_footer_nav_aria'],
				['menuOverlayAria', 'nav_chrome_shared_menu_overlay_aria'],
				['menuOverlayFooterLabel', 'nav_chrome_shared_menu_overlay_footer_label'],
				['localeSwitcherAria', 'nav_chrome_shared_locale_switcher_aria'],
				['searchPlaceholder', 'nav_chrome_shared_search_placeholder'], ['clearFiltersLabel', 'nav_chrome_shared_clear_filters_label'],
				['tocToggleSectionAria', 'nav_chrome_shared_toc_toggle_section_aria'],
				['tocHeading', 'nav_chrome_shared_toc_heading'], ['tocMobileButton', 'nav_chrome_shared_toc_mobile_button'],
				['tocCloseAria', 'nav_chrome_shared_toc_close_aria'],
				['tocCounterPrefix', 'nav_chrome_shared_toc_counter_prefix'],
			]),
		},
		footerChrome: {
			relatedProjectsStrip: toLocalizedFields(tr, [
				['builtWithLabel', 'footer_chrome_related_projects_strip_built_with_label'],
				['projectCountSingular', 'footer_chrome_related_projects_strip_project_count_singular'],
				['projectCountPlural', 'footer_chrome_related_projects_strip_project_count_plural'],
			]),
			footer: toLocalizedFields(tr, [
				['tagline', 'footer_chrome_footer_tagline'], ['location', 'footer_chrome_footer_location'],
				['statusPrefix', 'footer_chrome_footer_status_prefix'],
				['exploreLabel', 'footer_chrome_footer_explore_label'],
				['legalLabel', 'footer_chrome_footer_legal_label'],
				['connectLabel', 'footer_chrome_footer_connect_label'],
			]),
		},
		heroDashboard: toLocalizedFields(tr, [
			['vehiclesLabel', 'hero_dashboard_vehicles_label'], ['vehiclesSub', 'hero_dashboard_vehicles_sub'],
			['vehiclesSubLive', 'hero_dashboard_vehicles_sub_live'], ['delayLabel', 'hero_dashboard_delay_label'],
			['delaySub', 'hero_dashboard_delay_sub'], ['routesLabel', 'hero_dashboard_routes_label'],
			['routesSub', 'hero_dashboard_routes_sub'],
		]),
	};
}

export async function fetchSiteLabels({ client }: FetcherContext): Promise<SiteLabels> {
	const row = await fetchBlockSingleton<SiteLabelsRow>(
		client,
		'site_labels',
		'fetchSiteLabels/site_labels',
		[
			'id',
			'analytics_enabled',
			'analytics_consent_show_banner',
			{ translations: ['*'] },
		],
	);
	return SiteLabelsSchema.parse(toSiteLabels(row));
}
