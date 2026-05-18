// Auto-generated from live Directus /collections + /fields. Do not edit by hand.
// Regenerate via: cd apps/cms && bun scripts/generate-types.ts
// Source: https://cms.yesid.dev · generated 2026-05-18T06:36:33.099Z

/* eslint-disable @typescript-eslint/consistent-type-definitions */

export interface BlockAboutContentRow {
	client_count?: number;
	client_logos?: unknown;
	editor_label?: string;
	status?: string;
	tech_stack?: unknown;
	translations: readonly string[];
}

export interface BlockAboutContentTranslationsRow {
	cta?: unknown;
	identity?: unknown;
	interests?: unknown;
	labels?: unknown;
	meta?: unknown;
	methodology?: unknown;
	metrics?: unknown;
	stop_labels?: unknown;
	testimonials?: unknown;
	weather?: unknown;
}

export interface BlockAboutIntroRow {
	editor_label?: string;
	stack_items?: unknown;
	status?: string;
	translations: readonly string[];
}

export interface BlockAboutIntroTranslationsRow {
	bio?: string;
	interests?: string;
	interests_label?: string;
	location?: unknown;
	location_label?: string;
	more_link?: string;
	name?: string;
	stack_label?: string;
	title?: string;
}

export interface BlockBlogPageContentRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockBlogPageContentTranslationsRow {
	back_to_dispatches?: string;
	back_to_personal?: string;
	heading?: string;
	intro?: string;
}

export interface BlockCloserRow {
	attribution_url?: string;
	cta_href?: string;
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockCloserTranslationsRow {
	attribution?: unknown;
	cta?: unknown;
	heading?: string;
	heading_dot?: string;
	rows?: unknown;
	subheading?: string;
	terminal?: unknown;
}

export interface BlockContactContentRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
	web3forms_key?: string;
}

export interface BlockContactContentTranslationsRow {
	form_terminal?: unknown;
	info_terminal?: unknown;
	meta?: unknown;
	page_title?: string;
	send_error_message?: string;
	socials?: unknown;
	station_label?: string;
	success?: unknown;
	validation?: unknown;
}

export interface BlockCtaRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockCtaTranslationsRow {
	cta_contact?: string;
	cta_github?: string;
	heading?: string;
	subtitle?: string;
}

export interface BlockHeroRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockHeroTranslationsRow {
	cta_contact?: string;
	cta_work?: string;
	headline?: unknown;
	hero_anim?: unknown;
	refresh_button?: unknown;
	sql_panel?: unknown;
	subheadline?: string;
	subtitle?: string;
}

export interface BlockManifestoRow {
	editor_label?: string;
	status?: string;
	ticks?: unknown;
	translations: readonly string[];
}

export interface BlockManifestoTranslationsRow {
	edge_bottom?: unknown;
	edge_left?: unknown;
	edge_right?: unknown;
	hidden_transit_lines?: unknown;
	pills?: unknown;
	statement?: unknown;
	terminal?: unknown;
	transit?: unknown;
}

export interface BlockProjectsPageContentRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockProjectsPageContentTranslationsRow {
	intro?: string;
}

export interface BlockProofReelRow {
	editor_label?: string;
	images?: unknown;
	slugs?: unknown;
	status?: string;
	translations: readonly string[];
	view_all_href?: string;
}

export interface BlockProofReelTranslationsRow {
	heading?: string;
	heading_dot?: string;
	section_label?: string;
	subheading?: string;
	toggle_color_aria?: string;
	view_all_label?: string;
}

export interface BlockServicesGridRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockServicesGridTranslationsRow {
	heading?: string;
	heading_dot?: string;
	subheading?: string;
	view_all_link?: string;
	view_illustration_aria?: string;
}

export interface BlockTechStackPageContentRow {
	editor_label?: string;
	status?: string;
	translations: readonly string[];
}

export interface BlockTechStackPageContentTranslationsRow {
	actions?: unknown;
	cta?: unknown;
	hero?: unknown;
	meta?: unknown;
}

export interface BlogPostsRow {
	animation?: string;
	body?: unknown;
	category?: string;
	cover_image?: string;
	date_published?: string;
	excerpt?: string;
	external?: boolean;
	id: string;
	lang?: string;
	status?: string;
	svg_illustration?: string;
	tags?: unknown;
	title?: string;
	url?: string;
}

export interface BuildQueueRow {
	cms_dirty?: boolean;
}

export interface ErrorPagesRow {
	status?: string;
	status_code?: number;
	translations: readonly string[];
}

export interface ErrorPagesTranslationsRow {
	description?: string;
	heading?: string;
	label?: string;
	suggestions?: unknown;
	terminal_line?: string;
}

export interface IconsRow {
	category?: unknown;
	iconify_id?: string;
	id: string;
	name?: string;
	notes?: string;
	status?: string;
	svg_override?: string;
}

export interface IllustrationsRow {
	category?: string;
	description?: string;
	file?: string;
	id: string;
	label?: string;
	tags?: unknown;
}

export interface LanguagesRow {
	code: string;
	direction?: string;
	name?: string;
}

export interface MorphShapesRow {
	description?: string;
	id: string;
	label?: string;
	path?: string;
	viewbox?: string;
}

export interface NavLinksRow {
	href?: string;
	icon?: string;
	placement?: string;
	priority?: number;
	status?: string;
	translations: readonly string[];
}

export interface NavLinksTranslationsRow {
	label?: string;
	subtitle?: string;
}

export interface PagesRow {
	blocks: readonly string[];
	slug?: string;
	status?: string;
	translations: readonly string[];
}

export interface PagesBlocksRow {
}

export interface PagesTranslationsRow {
	title?: string;
}

export interface ProjectsRow {
	date_published?: string;
	environment?: string;
	featured?: boolean;
	hero_image?: string;
	id: string;
	impact_metrics: readonly string[];
	live_url?: string;
	location?: string;
	readme_url?: string;
	repo_url?: string;
	sections: readonly string[];
	services: readonly string[];
	stack?: unknown;
	status?: string;
	svg_illustration?: string;
	tags?: unknown;
	tech_stack: readonly string[];
	translations: readonly string[];
	version?: string;
}

export interface ProjectsImpactMetricsRow {
	before?: string;
	sort?: number;
	translations: readonly string[];
	value?: string;
}

export interface ProjectsImpactMetricsTranslationsRow {
	label?: string;
}

export interface ProjectsSectionsRow {
	sort?: number;
	translations: readonly string[];
}

export interface ProjectsSectionsTranslationsRow {
	content?: unknown;
	title?: string;
}

export interface ProjectsServicesRow {
}

export interface ProjectsTranslationsRow {
	description?: unknown;
	one_liner?: string;
	title?: string;
}

export interface RouteSeoRow {
	og_image?: string;
	path?: string;
	status?: string;
	translations: readonly string[];
}

export interface RouteSeoTranslationsRow {
	description?: string;
	title?: string;
}

export interface ServicesRow {
	deliverables: readonly string[];
	id: string;
	projects: readonly string[];
	sections: readonly string[];
	stack?: unknown;
	station?: number;
	svg?: string;
	tech_stack: readonly string[];
	translations: readonly string[];
	visible?: boolean;
}

export interface ServicesDeliverablesRow {
	sort?: number;
	translations: readonly string[];
}

export interface ServicesDeliverablesTranslationsRow {
	label?: string;
}

export interface ServicesSectionsRow {
	sort?: number;
	translations: readonly string[];
}

export interface ServicesSectionsTranslationsRow {
	content?: string;
	title?: string;
}

export interface ServicesTranslationsRow {
	benefit_headline?: string;
	description?: string;
	impact_metric_label?: string;
	impact_metric_value?: string;
	long_description?: string;
	subtitle?: string;
	title?: string;
	value_proposition?: string;
}

export interface SiteBlocksRow {
}

export interface SiteCatalogRow {
}

export interface SiteConfigRow {
}

export interface SiteLayoutRow {
}

export interface SiteMetaRow {
	default_og_image?: string;
	email?: string;
	github_url?: string;
	linkedin_url?: string;
	name?: string;
	owner_country?: string;
	owner_knows_about?: unknown;
	owner_locality?: string;
	owner_name?: string;
	owner_region?: string;
	theme_color?: string;
	translations: readonly string[];
	upwork_url?: string;
}

export interface SiteMetaTranslationsRow {
	default_description?: string;
	description?: string;
	owner_job_title?: string;
	tagline?: string;
}

export interface TechStackRow {
	icon_id?: string;
	id: string;
	name?: string;
	projects: readonly string[];
	services: readonly string[];
	status?: string;
	translations: readonly string[];
}

export interface TechStackProjectsRow {
}

export interface TechStackServicesRow {
}

export interface TechStackTranslationsRow {
	what_i_use_it_for?: unknown;
	what_it_is?: unknown;
	why_i_use_it_instead?: unknown;
}

export interface DirectusSchema {
	block_about_content: BlockAboutContentRow[];
	block_about_content_translations: BlockAboutContentTranslationsRow[];
	block_about_intro: BlockAboutIntroRow[];
	block_about_intro_translations: BlockAboutIntroTranslationsRow[];
	block_blog_page_content: BlockBlogPageContentRow[];
	block_blog_page_content_translations: BlockBlogPageContentTranslationsRow[];
	block_closer: BlockCloserRow[];
	block_closer_translations: BlockCloserTranslationsRow[];
	block_contact_content: BlockContactContentRow[];
	block_contact_content_translations: BlockContactContentTranslationsRow[];
	block_cta: BlockCtaRow[];
	block_cta_translations: BlockCtaTranslationsRow[];
	block_hero: BlockHeroRow[];
	block_hero_translations: BlockHeroTranslationsRow[];
	block_manifesto: BlockManifestoRow[];
	block_manifesto_translations: BlockManifestoTranslationsRow[];
	block_projects_page_content: BlockProjectsPageContentRow[];
	block_projects_page_content_translations: BlockProjectsPageContentTranslationsRow[];
	block_proof_reel: BlockProofReelRow[];
	block_proof_reel_translations: BlockProofReelTranslationsRow[];
	block_services_grid: BlockServicesGridRow[];
	block_services_grid_translations: BlockServicesGridTranslationsRow[];
	block_tech_stack_page_content: BlockTechStackPageContentRow[];
	block_tech_stack_page_content_translations: BlockTechStackPageContentTranslationsRow[];
	blog_posts: BlogPostsRow[];
	build_queue: BuildQueueRow[];
	error_pages: ErrorPagesRow[];
	error_pages_translations: ErrorPagesTranslationsRow[];
	icons: IconsRow[];
	illustrations: IllustrationsRow[];
	languages: LanguagesRow[];
	morph_shapes: MorphShapesRow[];
	nav_links: NavLinksRow[];
	nav_links_translations: NavLinksTranslationsRow[];
	pages: PagesRow[];
	pages_blocks: PagesBlocksRow[];
	pages_translations: PagesTranslationsRow[];
	projects: ProjectsRow[];
	projects_impact_metrics: ProjectsImpactMetricsRow[];
	projects_impact_metrics_translations: ProjectsImpactMetricsTranslationsRow[];
	projects_sections: ProjectsSectionsRow[];
	projects_sections_translations: ProjectsSectionsTranslationsRow[];
	projects_services: ProjectsServicesRow[];
	projects_translations: ProjectsTranslationsRow[];
	route_seo: RouteSeoRow[];
	route_seo_translations: RouteSeoTranslationsRow[];
	services: ServicesRow[];
	services_deliverables: ServicesDeliverablesRow[];
	services_deliverables_translations: ServicesDeliverablesTranslationsRow[];
	services_sections: ServicesSectionsRow[];
	services_sections_translations: ServicesSectionsTranslationsRow[];
	services_translations: ServicesTranslationsRow[];
	site_blocks: SiteBlocksRow[];
	site_catalog: SiteCatalogRow[];
	site_config: SiteConfigRow[];
	site_layout: SiteLayoutRow[];
	site_meta: SiteMetaRow[];
	site_meta_translations: SiteMetaTranslationsRow[];
	tech_stack: TechStackRow[];
	tech_stack_projects: TechStackProjectsRow[];
	tech_stack_services: TechStackServicesRow[];
	tech_stack_translations: TechStackTranslationsRow[];
}
