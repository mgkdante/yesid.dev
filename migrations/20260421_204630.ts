import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tech_stack_domains" AS ENUM('data-engineering', 'web-development', 'mobile-development', 'analytics-bi', 'systems-programming', 'devops-infra', 'internal-tooling');
  CREATE TYPE "public"."enum_tech_stack_layer" AS ENUM('data', 'backend', 'api', 'frontend', 'mobile', 'analytics', 'devops', 'testing', 'systems');
  CREATE TYPE "public"."enum_tech_stack_proficiency" AS ENUM('expert', 'proficient', 'familiar');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('public', 'private', 'wip');
  CREATE TYPE "public"."enum_blog_posts_lang" AS ENUM('en', 'fr', 'es');
  CREATE TYPE "public"."enum_blog_posts_category" AS ENUM('professional', 'personal');
  CREATE TYPE "public"."enum_blog_posts_animation" AS ENUM('draw', 'morph', 'draw-fill');
  CREATE TYPE "public"."enum_stack_scenarios_domains" AS ENUM('data-engineering', 'web-development', 'mobile-development', 'analytics-bi', 'systems-programming', 'devops-infra', 'internal-tooling');
  CREATE TYPE "public"."enum_home_content_journey_skills_icon" AS ENUM('sql', 'typescript', 'python', 'sveltekit', 'gsap', 'powerbi', 'docker');
  CREATE TYPE "public"."enum_home_content_journey_highlight_effect" AS ENUM('scale', 'gradient', 'wave', 'charReveal');
  CREATE TYPE "public"."enum_about_content_tech_stack_category" AS ENUM('databases', 'languages', 'frameworks', 'tools');
  CREATE TYPE "public"."enum_about_content_cta_lines_color" AS ENUM('orange', 'muted');
  CREATE TYPE "public"."enum_nav_links_nav_links_priority" AS ENUM('1', '2');
  CREATE TABLE "tech_stack_domains" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_tech_stack_domains",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tech_stack" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"layer" "enum_tech_stack_layer" NOT NULL,
  	"icon" varchar,
  	"proficiency" "enum_tech_stack_proficiency",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "services_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "services_sections_locales" (
  	"title" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"station" numeric NOT NULL,
  	"icon" varchar,
  	"svg" varchar,
  	"lottie_reverse" boolean DEFAULT false,
  	"visible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"description" varchar NOT NULL,
  	"long_description" varchar,
  	"value_proposition" varchar,
  	"benefit_headline" varchar,
  	"impact_metric_value" varchar,
  	"impact_metric_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"tech_stack_id" varchar
  );
  
  CREATE TABLE "projects_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "projects_sections_locales" (
  	"title" varchar NOT NULL,
  	"content" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects_impact_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"before" varchar
  );
  
  CREATE TABLE "projects_impact_metrics_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_projects_status" NOT NULL,
  	"featured" boolean DEFAULT false,
  	"repo_url" varchar,
  	"live_url" varchar,
  	"readme_url" varchar,
  	"image_id" integer,
  	"impact_metric_value" varchar,
  	"impact_metric_before" varchar,
  	"location" varchar,
  	"environment" varchar,
  	"version" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar NOT NULL,
  	"one_liner" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"impact_metric_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" varchar,
  	"tech_stack_id" varchar
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"date" timestamp(3) with time zone NOT NULL,
  	"lang" "enum_blog_posts_lang" DEFAULT 'en' NOT NULL,
  	"category" "enum_blog_posts_category" NOT NULL,
  	"animation" "enum_blog_posts_animation" DEFAULT 'draw',
  	"svg" varchar,
  	"url" varchar,
  	"external" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts_locales" (
  	"title" varchar NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog_posts_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "stack_scenarios_domains" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_stack_scenarios_domains",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "stack_scenarios" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "stack_scenarios_locales" (
  	"summary" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "stack_scenarios_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"tech_stack_id" varchar,
  	"projects_id" integer
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_content_manifesto_pills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"service_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_manifesto_pills_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_manifesto_hidden_transit_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_manifesto_hidden_transit_lines_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_content_journey_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"subtitle" varchar,
  	"icon" "enum_home_content_journey_skills_icon" NOT NULL
  );
  
  CREATE TABLE "home_content_journey" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"highlight_effect" "enum_home_content_journey_highlight_effect" NOT NULL
  );
  
  CREATE TABLE "home_content_journey_locales" (
  	"label" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"proof_reel_view_all_href" varchar NOT NULL,
  	"closer_cta_href" varchar NOT NULL,
  	"closer_attribution_url" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_content_locales" (
  	"hero_anim_scroll_down" varchar NOT NULL,
  	"hero_headline_line1" varchar NOT NULL,
  	"hero_headline_line2" varchar NOT NULL,
  	"hero_headline_aria_suffix" varchar NOT NULL,
  	"hero_subheadline" varchar NOT NULL,
  	"hero_subtitle" varchar NOT NULL,
  	"hero_cta_work" varchar NOT NULL,
  	"hero_cta_contact" varchar NOT NULL,
  	"hero_sql_panel_prompt" varchar NOT NULL,
  	"hero_sql_panel_live_label" varchar NOT NULL,
  	"hero_sql_panel_columns_route" varchar NOT NULL,
  	"hero_sql_panel_columns_avg_delay_s" varchar NOT NULL,
  	"hero_sql_panel_columns_vehicles" varchar NOT NULL,
  	"hero_sql_panel_meta_template" varchar NOT NULL,
  	"hero_refresh_button_label" varchar NOT NULL,
  	"hero_refresh_button_helper" varchar NOT NULL,
  	"manifesto_statement_line1" varchar NOT NULL,
  	"manifesto_statement_line_huge" varchar NOT NULL,
  	"manifesto_statement_line3_part1" varchar NOT NULL,
  	"manifesto_statement_line3_highlight" varchar NOT NULL,
  	"manifesto_statement_line3_part2" varchar NOT NULL,
  	"manifesto_terminal_user" varchar NOT NULL,
  	"manifesto_terminal_command" varchar NOT NULL,
  	"manifesto_edge_left_section_number" varchar NOT NULL,
  	"manifesto_edge_left_section_name" varchar NOT NULL,
  	"manifesto_edge_left_location" varchar NOT NULL,
  	"manifesto_edge_right_lat" varchar NOT NULL,
  	"manifesto_edge_right_lng" varchar NOT NULL,
  	"manifesto_edge_right_src" varchar NOT NULL,
  	"manifesto_edge_right_via" varchar NOT NULL,
  	"manifesto_edge_right_dst" varchar NOT NULL,
  	"manifesto_edge_right_node" varchar NOT NULL,
  	"manifesto_edge_right_status" varchar NOT NULL,
  	"manifesto_edge_bottom_connected" varchar NOT NULL,
  	"manifesto_edge_bottom_line" varchar NOT NULL,
  	"manifesto_edge_bottom_url" varchar NOT NULL,
  	"manifesto_edge_bottom_version" varchar NOT NULL,
  	"manifesto_edge_bottom_scroll_hint" varchar NOT NULL,
  	"manifesto_transit_arrival_label" varchar NOT NULL,
  	"manifesto_transit_platform_badge" varchar NOT NULL,
  	"manifesto_transit_direction_badge" varchar NOT NULL,
  	"journey_cta_prompt" varchar NOT NULL,
  	"journey_cta_button" varchar NOT NULL,
  	"proof_reel_heading" varchar NOT NULL,
  	"proof_reel_heading_dot" varchar NOT NULL,
  	"proof_reel_subheading" varchar NOT NULL,
  	"proof_reel_section_label" varchar NOT NULL,
  	"proof_reel_view_all_label" varchar NOT NULL,
  	"proof_reel_toggle_color_aria" varchar NOT NULL,
  	"services_grid_heading" varchar NOT NULL,
  	"services_grid_heading_dot" varchar NOT NULL,
  	"services_grid_subheading" varchar NOT NULL,
  	"services_grid_view_illustration_aria" varchar NOT NULL,
  	"services_grid_view_all_link" varchar NOT NULL,
  	"closer_heading" varchar NOT NULL,
  	"closer_heading_dot" varchar NOT NULL,
  	"closer_subheading" varchar NOT NULL,
  	"closer_cta_label" varchar NOT NULL,
  	"closer_rows_contact_label" varchar NOT NULL,
  	"closer_rows_contact_description" varchar NOT NULL,
  	"closer_rows_contact_action" varchar NOT NULL,
  	"closer_rows_connect_label" varchar NOT NULL,
  	"closer_rows_connect_description" varchar NOT NULL,
  	"closer_rows_connect_action" varchar NOT NULL,
  	"closer_rows_read_label" varchar NOT NULL,
  	"closer_rows_read_action" varchar NOT NULL,
  	"closer_rows_about_label" varchar NOT NULL,
  	"closer_rows_about_description" varchar NOT NULL,
  	"closer_rows_about_action" varchar NOT NULL,
  	"closer_attribution_text" varchar NOT NULL,
  	"closer_terminal_title" varchar NOT NULL,
  	"closer_terminal_city" varchar NOT NULL,
  	"closer_terminal_encoding" varchar NOT NULL,
  	"closer_terminal_destinations_label" varchar NOT NULL,
  	"closer_terminal_prompt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_content_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "services_page_locales" (
  	"meta_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"listing_heading" varchar NOT NULL,
  	"listing_station_label_template" varchar NOT NULL,
  	"listing_deep_dive_label" varchar NOT NULL,
  	"listing_projects_strip_built_with_service" varchar NOT NULL,
  	"listing_projects_strip_built_with_fallback" varchar NOT NULL,
  	"listing_projects_strip_project_singular" varchar NOT NULL,
  	"listing_projects_strip_project_plural" varchar NOT NULL,
  	"detail_back_to_services_label" varchar NOT NULL,
  	"detail_value_proposition_heading" varchar NOT NULL,
  	"detail_deliverables_heading" varchar NOT NULL,
  	"detail_related_projects_heading" varchar NOT NULL,
  	"detail_related_projects_nav_aria" varchar NOT NULL,
  	"detail_service_nav_aria" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "projects_page_locales" (
  	"meta_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"listing_heading" varchar NOT NULL,
  	"listing_search_placeholder" varchar NOT NULL,
  	"listing_see_all_link" varchar NOT NULL,
  	"listing_filters_filters_label" varchar NOT NULL,
  	"listing_filters_services" varchar NOT NULL,
  	"listing_filters_tags" varchar NOT NULL,
  	"listing_filters_tech_stack" varchar NOT NULL,
  	"listing_filters_all_label" varchar NOT NULL,
  	"listing_filters_showing_prefix" varchar NOT NULL,
  	"listing_card_stack_overflow_suffix" varchar NOT NULL,
  	"detail_back_to_listing_label" varchar NOT NULL,
  	"detail_toc_section_title" varchar NOT NULL,
  	"detail_readme_section_title" varchar NOT NULL,
  	"detail_glance_overview" varchar NOT NULL,
  	"detail_glance_impact" varchar NOT NULL,
  	"detail_glance_stack" varchar NOT NULL,
  	"detail_glance_services" varchar NOT NULL,
  	"detail_glance_links" varchar NOT NULL,
  	"detail_glance_project_info" varchar NOT NULL,
  	"detail_glance_live_site_label" varchar NOT NULL,
  	"detail_glance_live_site_label_mobile" varchar NOT NULL,
  	"detail_glance_github_label" varchar NOT NULL,
  	"detail_toc_pill_open_aria" varchar NOT NULL,
  	"detail_toc_pill_close_aria" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "blog_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "blog_page_locales" (
  	"listing_mobile_heading" varchar NOT NULL,
  	"listing_search_placeholder" varchar NOT NULL,
  	"listing_result_noun" varchar NOT NULL,
  	"listing_no_posts_message" varchar NOT NULL,
  	"listing_filters_filters_label" varchar NOT NULL,
  	"listing_filters_all_label" varchar NOT NULL,
  	"listing_filters_language" varchar NOT NULL,
  	"listing_filters_date_range" varchar NOT NULL,
  	"listing_filters_from" varchar NOT NULL,
  	"listing_filters_to" varchar NOT NULL,
  	"listing_filters_tags" varchar NOT NULL,
  	"listing_filters_showing_prefix" varchar NOT NULL,
  	"listing_route_map_title" varchar NOT NULL,
  	"listing_route_map_terminus" varchar NOT NULL,
  	"detail_code_copy_aria" varchar NOT NULL,
  	"detail_code_copy_label" varchar NOT NULL,
  	"detail_code_error_label" varchar NOT NULL,
  	"detail_back_nav_to_personal" varchar NOT NULL,
  	"detail_back_nav_to_dispatches" varchar NOT NULL,
  	"detail_header_post_tags_aria" varchar NOT NULL,
  	"detail_header_reading_time_label" varchar NOT NULL,
  	"detail_page_reading_mode" varchar NOT NULL,
  	"detail_page_toc_section_title" varchar NOT NULL,
  	"detail_page_meta_category" varchar NOT NULL,
  	"detail_page_meta_words" varchar NOT NULL,
  	"detail_page_meta_read_time" varchar NOT NULL,
  	"detail_page_meta_language" varchar NOT NULL,
  	"detail_page_meta_tags" varchar NOT NULL,
  	"detail_toc_pill_open_aria" varchar NOT NULL,
  	"detail_toc_pill_close_aria" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "tech_stack_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "tech_stack_page_locales" (
  	"meta_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"hero_overline" varchar NOT NULL,
  	"hero_title_line1" varchar NOT NULL,
  	"hero_title_line2" varchar NOT NULL,
  	"hero_terminal_aria" varchar NOT NULL,
  	"hero_stats_technologies" varchar NOT NULL,
  	"hero_stats_layers" varchar NOT NULL,
  	"hero_stats_domains" varchar NOT NULL,
  	"hero_stats_projects" varchar NOT NULL,
  	"actions_get_in_touch" varchar NOT NULL,
  	"actions_view_services" varchar NOT NULL,
  	"cta_heading_line1" varchar NOT NULL,
  	"cta_heading_line2" varchar NOT NULL,
  	"cta_sub" varchar NOT NULL,
  	"cta_availability" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "about_content_identity_polaroids" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src" varchar NOT NULL,
  	"rotate" numeric NOT NULL
  );
  
  CREATE TABLE "about_content_identity_polaroids_locales" (
  	"alt" varchar NOT NULL,
  	"caption" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_metrics_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_methodology" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"station" numeric NOT NULL
  );
  
  CREATE TABLE "about_content_methodology_locales" (
  	"label" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"company" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_testimonials_locales" (
  	"quote" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_tech_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category" "enum_about_content_tech_stack_category" NOT NULL
  );
  
  CREATE TABLE "about_content_interests" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_interests_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_client_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"src" varchar NOT NULL
  );
  
  CREATE TABLE "about_content_cta_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"color" "enum_about_content_cta_lines_color"
  );
  
  CREATE TABLE "about_content_cta_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"icon" varchar NOT NULL
  );
  
  CREATE TABLE "about_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"identity_headshot" varchar,
  	"weather_enabled" boolean DEFAULT true,
  	"client_count" numeric NOT NULL,
  	"cta_command" varchar NOT NULL,
  	"cta_button_href" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_content_locales" (
  	"identity_name" varchar NOT NULL,
  	"identity_title" varchar NOT NULL,
  	"identity_value_prop" varchar NOT NULL,
  	"weather_city" varchar NOT NULL,
  	"weather_hook" varchar NOT NULL,
  	"cta_button_label" varchar NOT NULL,
  	"cta_availability" varchar NOT NULL,
  	"stop_labels_identity" varchar NOT NULL,
  	"stop_labels_metrics" varchar NOT NULL,
  	"stop_labels_testimonials" varchar NOT NULL,
  	"stop_labels_process" varchar NOT NULL,
  	"stop_labels_stack" varchar NOT NULL,
  	"stop_labels_clients" varchar NOT NULL,
  	"stop_labels_interests" varchar NOT NULL,
  	"stop_labels_snapshots" varchar NOT NULL,
  	"stop_labels_location" varchar NOT NULL,
  	"stop_labels_next" varchar NOT NULL,
  	"labels_clients_served" varchar NOT NULL,
  	"labels_polaroid_prev_aria" varchar NOT NULL,
  	"labels_polaroid_next_aria" varchar NOT NULL,
  	"labels_testimonials_carousel_aria" varchar NOT NULL,
  	"labels_testimonials_tab_nav_aria" varchar NOT NULL,
  	"labels_testimonial_slide_aria" varchar NOT NULL,
  	"labels_show_testimonial_aria" varchar NOT NULL,
  	"meta_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "about_content_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "contact_content_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL,
  	"icon" varchar NOT NULL
  );
  
  CREATE TABLE "contact_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"info_terminal_title" varchar NOT NULL,
  	"info_terminal_command" varchar NOT NULL,
  	"form_terminal_title" varchar NOT NULL,
  	"form_terminal_command" varchar NOT NULL,
  	"form_terminal_fields_name_label" varchar NOT NULL,
  	"form_terminal_fields_email_label" varchar NOT NULL,
  	"form_terminal_fields_message_label" varchar NOT NULL,
  	"web3forms_key" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_content_locales" (
  	"page_title" varchar NOT NULL,
  	"station_label" varchar NOT NULL,
  	"send_error_message" varchar NOT NULL,
  	"meta_title" varchar NOT NULL,
  	"meta_description" varchar NOT NULL,
  	"info_terminal_location" varchar NOT NULL,
  	"info_terminal_response_time" varchar NOT NULL,
  	"info_terminal_section_labels_location" varchar NOT NULL,
  	"info_terminal_section_labels_connect" varchar NOT NULL,
  	"form_terminal_command_output" varchar NOT NULL,
  	"form_terminal_fields_name_placeholder" varchar NOT NULL,
  	"form_terminal_fields_email_placeholder" varchar NOT NULL,
  	"form_terminal_fields_message_placeholder" varchar NOT NULL,
  	"form_terminal_submit_label" varchar NOT NULL,
  	"validation_required" varchar NOT NULL,
  	"validation_invalid_email" varchar NOT NULL,
  	"validation_error_summary" varchar NOT NULL,
  	"success_validating" varchar NOT NULL,
  	"success_sending" varchar NOT NULL,
  	"success_sent" varchar NOT NULL,
  	"success_response_time" varchar NOT NULL,
  	"success_meanwhile" varchar NOT NULL,
  	"success_reset_label" varchar NOT NULL,
  	"success_field_ok" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "nav_links_nav_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL,
  	"priority" "enum_nav_links_nav_links_priority" DEFAULT '1' NOT NULL
  );
  
  CREATE TABLE "nav_links_nav_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "nav_links_menu_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "nav_links_menu_items_locales" (
  	"label" varchar NOT NULL,
  	"subtitle" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "nav_links" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "nav_links_locales" (
  	"metro_bookends_departure" varchar NOT NULL,
  	"metro_bookends_featured" varchar NOT NULL,
  	"metro_bookends_about" varchar NOT NULL,
  	"metro_bookends_blog" varchar NOT NULL,
  	"metro_bookends_terminal" varchar NOT NULL,
  	"nav_directions_previous" varchar NOT NULL,
  	"nav_directions_next" varchar NOT NULL,
  	"shared_chrome_open_menu_aria" varchar NOT NULL,
  	"shared_chrome_close_menu_aria" varchar NOT NULL,
  	"shared_chrome_footer_nav_aria" varchar NOT NULL,
  	"shared_chrome_menu_overlay_aria" varchar NOT NULL,
  	"shared_chrome_menu_overlay_footer_label" varchar NOT NULL,
  	"shared_chrome_search_placeholder" varchar NOT NULL,
  	"shared_chrome_clear_filters_label" varchar NOT NULL,
  	"shared_chrome_toc_toggle_section_aria" varchar NOT NULL,
  	"shared_chrome_toc_heading" varchar NOT NULL,
  	"shared_chrome_toc_mobile_button" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "error_pages_not_found_suggestions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "error_pages_not_found_suggestions_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "error_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"not_found_terminal_line" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "error_pages_locales" (
  	"not_found_label" varchar NOT NULL,
  	"not_found_heading" varchar NOT NULL,
  	"not_found_description" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "site_meta_locales" (
  	"tagline" varchar,
  	"description" varchar,
  	"footer_tagline" varchar NOT NULL,
  	"footer_location" varchar NOT NULL,
  	"footer_status_prefix" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "site_meta" ALTER COLUMN "site_name" SET DEFAULT 'yesid.';
  ALTER TABLE "media" ADD COLUMN "credit" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_thumbnail_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_hero_filename" varchar;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "tech_stack_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "tech_stack_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "services_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "services_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "projects_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "projects_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_posts_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_posts_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "stack_scenarios_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "stack_scenarios_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "home_content_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "home_content_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "services_page_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "services_page_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "projects_page_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "projects_page_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_page_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "blog_page_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "tech_stack_page_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "tech_stack_page_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "about_content_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "about_content_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "contact_content_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "contact_content_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "nav_links_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "nav_links_update" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "error_pages_find" boolean DEFAULT false;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "error_pages_update" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tech_stack_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "blog_posts_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stack_scenarios_id" varchar;
  ALTER TABLE "site_meta" ADD COLUMN "links_email" varchar;
  ALTER TABLE "site_meta" ADD COLUMN "links_github" varchar;
  ALTER TABLE "site_meta" ADD COLUMN "links_linkedin" varchar;
  ALTER TABLE "site_meta" ADD COLUMN "links_upwork" varchar;
  ALTER TABLE "tech_stack_domains" ADD CONSTRAINT "tech_stack_domains_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_deliverables" ADD CONSTRAINT "services_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_sections" ADD CONSTRAINT "services_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_sections_locales" ADD CONSTRAINT "services_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_tech_stack_fk" FOREIGN KEY ("tech_stack_id") REFERENCES "public"."tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sections" ADD CONSTRAINT "projects_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_sections_locales" ADD CONSTRAINT "projects_sections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_impact_metrics" ADD CONSTRAINT "projects_impact_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_impact_metrics_locales" ADD CONSTRAINT "projects_impact_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_impact_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_texts" ADD CONSTRAINT "projects_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_tech_stack_fk" FOREIGN KEY ("tech_stack_id") REFERENCES "public"."tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_locales" ADD CONSTRAINT "blog_posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_texts" ADD CONSTRAINT "blog_posts_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stack_scenarios_domains" ADD CONSTRAINT "stack_scenarios_domains_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stack_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stack_scenarios_locales" ADD CONSTRAINT "stack_scenarios_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stack_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stack_scenarios_rels" ADD CONSTRAINT "stack_scenarios_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stack_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stack_scenarios_rels" ADD CONSTRAINT "stack_scenarios_rels_tech_stack_fk" FOREIGN KEY ("tech_stack_id") REFERENCES "public"."tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stack_scenarios_rels" ADD CONSTRAINT "stack_scenarios_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_manifesto_pills" ADD CONSTRAINT "home_content_manifesto_pills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_manifesto_pills_locales" ADD CONSTRAINT "home_content_manifesto_pills_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content_manifesto_pills"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_manifesto_hidden_transit_lines" ADD CONSTRAINT "home_content_manifesto_hidden_transit_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_manifesto_hidden_transit_lines_locales" ADD CONSTRAINT "home_content_manifesto_hidden_transit_lines_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content_manifesto_hidden_transit_lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_journey_skills" ADD CONSTRAINT "home_content_journey_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_journey" ADD CONSTRAINT "home_content_journey_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_journey_locales" ADD CONSTRAINT "home_content_journey_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content_journey"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_locales" ADD CONSTRAINT "home_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_content_texts" ADD CONSTRAINT "home_content_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_locales" ADD CONSTRAINT "services_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page_locales" ADD CONSTRAINT "projects_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_page_locales" ADD CONSTRAINT "blog_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tech_stack_page_locales" ADD CONSTRAINT "tech_stack_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tech_stack_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_identity_polaroids" ADD CONSTRAINT "about_content_identity_polaroids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_identity_polaroids_locales" ADD CONSTRAINT "about_content_identity_polaroids_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content_identity_polaroids"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_metrics" ADD CONSTRAINT "about_content_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_metrics_locales" ADD CONSTRAINT "about_content_metrics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content_metrics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_methodology" ADD CONSTRAINT "about_content_methodology_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_methodology_locales" ADD CONSTRAINT "about_content_methodology_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content_methodology"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_testimonials" ADD CONSTRAINT "about_content_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_testimonials_locales" ADD CONSTRAINT "about_content_testimonials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_tech_stack" ADD CONSTRAINT "about_content_tech_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_interests" ADD CONSTRAINT "about_content_interests_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_interests_locales" ADD CONSTRAINT "about_content_interests_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content_interests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_client_logos" ADD CONSTRAINT "about_content_client_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_cta_lines" ADD CONSTRAINT "about_content_cta_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_cta_socials" ADD CONSTRAINT "about_content_cta_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_locales" ADD CONSTRAINT "about_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_content_texts" ADD CONSTRAINT "about_content_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."about_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_content_socials" ADD CONSTRAINT "contact_content_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_content_locales" ADD CONSTRAINT "contact_content_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_links_nav_links" ADD CONSTRAINT "nav_links_nav_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_links_nav_links_locales" ADD CONSTRAINT "nav_links_nav_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_links_nav_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_links_menu_items" ADD CONSTRAINT "nav_links_menu_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_links_menu_items_locales" ADD CONSTRAINT "nav_links_menu_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_links_menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_links_locales" ADD CONSTRAINT "nav_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "error_pages_not_found_suggestions" ADD CONSTRAINT "error_pages_not_found_suggestions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."error_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "error_pages_not_found_suggestions_locales" ADD CONSTRAINT "error_pages_not_found_suggestions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."error_pages_not_found_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "error_pages_locales" ADD CONSTRAINT "error_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."error_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_meta_locales" ADD CONSTRAINT "site_meta_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_meta"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tech_stack_domains_order_idx" ON "tech_stack_domains" USING btree ("order");
  CREATE INDEX "tech_stack_domains_parent_idx" ON "tech_stack_domains" USING btree ("parent_id");
  CREATE INDEX "tech_stack_updated_at_idx" ON "tech_stack" USING btree ("updated_at");
  CREATE INDEX "tech_stack_created_at_idx" ON "tech_stack" USING btree ("created_at");
  CREATE INDEX "services_deliverables_order_idx" ON "services_deliverables" USING btree ("_order");
  CREATE INDEX "services_deliverables_parent_id_idx" ON "services_deliverables" USING btree ("_parent_id");
  CREATE INDEX "services_deliverables_locale_idx" ON "services_deliverables" USING btree ("_locale");
  CREATE INDEX "services_sections_order_idx" ON "services_sections" USING btree ("_order");
  CREATE INDEX "services_sections_parent_id_idx" ON "services_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "services_sections_locales_locale_parent_id_unique" ON "services_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_tech_stack_id_idx" ON "services_rels" USING btree ("tech_stack_id");
  CREATE INDEX "projects_sections_order_idx" ON "projects_sections" USING btree ("_order");
  CREATE INDEX "projects_sections_parent_id_idx" ON "projects_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_sections_locales_locale_parent_id_unique" ON "projects_sections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_impact_metrics_order_idx" ON "projects_impact_metrics" USING btree ("_order");
  CREATE INDEX "projects_impact_metrics_parent_id_idx" ON "projects_impact_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "projects_impact_metrics_locales_locale_parent_id_unique" ON "projects_impact_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_image_idx" ON "projects" USING btree ("image_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_texts_order_parent" ON "projects_texts" USING btree ("order","parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_services_id_idx" ON "projects_rels" USING btree ("services_id");
  CREATE INDEX "projects_rels_tech_stack_id_idx" ON "projects_rels" USING btree ("tech_stack_id");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_posts_locales_locale_parent_id_unique" ON "blog_posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "blog_posts_texts_order_parent" ON "blog_posts_texts" USING btree ("order","parent_id");
  CREATE INDEX "stack_scenarios_domains_order_idx" ON "stack_scenarios_domains" USING btree ("order");
  CREATE INDEX "stack_scenarios_domains_parent_idx" ON "stack_scenarios_domains" USING btree ("parent_id");
  CREATE INDEX "stack_scenarios_updated_at_idx" ON "stack_scenarios" USING btree ("updated_at");
  CREATE INDEX "stack_scenarios_created_at_idx" ON "stack_scenarios" USING btree ("created_at");
  CREATE UNIQUE INDEX "stack_scenarios_locales_locale_parent_id_unique" ON "stack_scenarios_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "stack_scenarios_rels_order_idx" ON "stack_scenarios_rels" USING btree ("order");
  CREATE INDEX "stack_scenarios_rels_parent_idx" ON "stack_scenarios_rels" USING btree ("parent_id");
  CREATE INDEX "stack_scenarios_rels_path_idx" ON "stack_scenarios_rels" USING btree ("path");
  CREATE INDEX "stack_scenarios_rels_tech_stack_id_idx" ON "stack_scenarios_rels" USING btree ("tech_stack_id");
  CREATE INDEX "stack_scenarios_rels_projects_id_idx" ON "stack_scenarios_rels" USING btree ("projects_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_content_manifesto_pills_order_idx" ON "home_content_manifesto_pills" USING btree ("_order");
  CREATE INDEX "home_content_manifesto_pills_parent_id_idx" ON "home_content_manifesto_pills" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_content_manifesto_pills_locales_locale_parent_id_unique" ON "home_content_manifesto_pills_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_content_manifesto_hidden_transit_lines_order_idx" ON "home_content_manifesto_hidden_transit_lines" USING btree ("_order");
  CREATE INDEX "home_content_manifesto_hidden_transit_lines_parent_id_idx" ON "home_content_manifesto_hidden_transit_lines" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_content_manifesto_hidden_transit_lines_locales_locale_p" ON "home_content_manifesto_hidden_transit_lines_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_content_journey_skills_order_idx" ON "home_content_journey_skills" USING btree ("_order");
  CREATE INDEX "home_content_journey_skills_parent_id_idx" ON "home_content_journey_skills" USING btree ("_parent_id");
  CREATE INDEX "home_content_journey_order_idx" ON "home_content_journey" USING btree ("_order");
  CREATE INDEX "home_content_journey_parent_id_idx" ON "home_content_journey" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_content_journey_locales_locale_parent_id_unique" ON "home_content_journey_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "home_content_locales_locale_parent_id_unique" ON "home_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_content_texts_order_parent" ON "home_content_texts" USING btree ("order","parent_id");
  CREATE UNIQUE INDEX "services_page_locales_locale_parent_id_unique" ON "services_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "projects_page_locales_locale_parent_id_unique" ON "projects_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "blog_page_locales_locale_parent_id_unique" ON "blog_page_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "tech_stack_page_locales_locale_parent_id_unique" ON "tech_stack_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_identity_polaroids_order_idx" ON "about_content_identity_polaroids" USING btree ("_order");
  CREATE INDEX "about_content_identity_polaroids_parent_id_idx" ON "about_content_identity_polaroids" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_identity_polaroids_locales_locale_parent_id_un" ON "about_content_identity_polaroids_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_metrics_order_idx" ON "about_content_metrics" USING btree ("_order");
  CREATE INDEX "about_content_metrics_parent_id_idx" ON "about_content_metrics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_metrics_locales_locale_parent_id_unique" ON "about_content_metrics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_methodology_order_idx" ON "about_content_methodology" USING btree ("_order");
  CREATE INDEX "about_content_methodology_parent_id_idx" ON "about_content_methodology" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_methodology_locales_locale_parent_id_unique" ON "about_content_methodology_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_testimonials_order_idx" ON "about_content_testimonials" USING btree ("_order");
  CREATE INDEX "about_content_testimonials_parent_id_idx" ON "about_content_testimonials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_testimonials_locales_locale_parent_id_unique" ON "about_content_testimonials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_tech_stack_order_idx" ON "about_content_tech_stack" USING btree ("_order");
  CREATE INDEX "about_content_tech_stack_parent_id_idx" ON "about_content_tech_stack" USING btree ("_parent_id");
  CREATE INDEX "about_content_interests_order_idx" ON "about_content_interests" USING btree ("_order");
  CREATE INDEX "about_content_interests_parent_id_idx" ON "about_content_interests" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_interests_locales_locale_parent_id_unique" ON "about_content_interests_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_client_logos_order_idx" ON "about_content_client_logos" USING btree ("_order");
  CREATE INDEX "about_content_client_logos_parent_id_idx" ON "about_content_client_logos" USING btree ("_parent_id");
  CREATE INDEX "about_content_cta_lines_order_idx" ON "about_content_cta_lines" USING btree ("_order");
  CREATE INDEX "about_content_cta_lines_parent_id_idx" ON "about_content_cta_lines" USING btree ("_parent_id");
  CREATE INDEX "about_content_cta_socials_order_idx" ON "about_content_cta_socials" USING btree ("_order");
  CREATE INDEX "about_content_cta_socials_parent_id_idx" ON "about_content_cta_socials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "about_content_locales_locale_parent_id_unique" ON "about_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_content_texts_order_parent" ON "about_content_texts" USING btree ("order","parent_id");
  CREATE INDEX "contact_content_socials_order_idx" ON "contact_content_socials" USING btree ("_order");
  CREATE INDEX "contact_content_socials_parent_id_idx" ON "contact_content_socials" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contact_content_locales_locale_parent_id_unique" ON "contact_content_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_links_nav_links_order_idx" ON "nav_links_nav_links" USING btree ("_order");
  CREATE INDEX "nav_links_nav_links_parent_id_idx" ON "nav_links_nav_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nav_links_nav_links_locales_locale_parent_id_unique" ON "nav_links_nav_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_links_menu_items_order_idx" ON "nav_links_menu_items" USING btree ("_order");
  CREATE INDEX "nav_links_menu_items_parent_id_idx" ON "nav_links_menu_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nav_links_menu_items_locales_locale_parent_id_unique" ON "nav_links_menu_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "nav_links_locales_locale_parent_id_unique" ON "nav_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "error_pages_not_found_suggestions_order_idx" ON "error_pages_not_found_suggestions" USING btree ("_order");
  CREATE INDEX "error_pages_not_found_suggestions_parent_id_idx" ON "error_pages_not_found_suggestions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "error_pages_not_found_suggestions_locales_locale_parent_id_u" ON "error_pages_not_found_suggestions_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "error_pages_locales_locale_parent_id_unique" ON "error_pages_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "site_meta_locales_locale_parent_id_unique" ON "site_meta_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tech_stack_fk" FOREIGN KEY ("tech_stack_id") REFERENCES "public"."tech_stack"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stack_scenarios_fk" FOREIGN KEY ("stack_scenarios_id") REFERENCES "public"."stack_scenarios"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX "payload_locked_documents_rels_tech_stack_id_idx" ON "payload_locked_documents_rels" USING btree ("tech_stack_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_stack_scenarios_id_idx" ON "payload_locked_documents_rels" USING btree ("stack_scenarios_id");
  ALTER TABLE "media" DROP COLUMN "alt";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tech_stack_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tech_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_deliverables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_sections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_impact_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_impact_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_posts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_posts_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stack_scenarios_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stack_scenarios" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stack_scenarios_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "stack_scenarios_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_manifesto_pills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_manifesto_pills_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_manifesto_hidden_transit_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_manifesto_hidden_transit_lines_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_journey_skills" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_journey" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_journey_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_content_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tech_stack_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tech_stack_page_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_identity_polaroids" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_identity_polaroids_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_metrics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_methodology" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_methodology_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_testimonials_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_tech_stack" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_interests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_interests_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_client_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_cta_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_cta_socials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "about_content_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_content_socials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "contact_content_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links_nav_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links_nav_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links_menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links_menu_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "nav_links_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "error_pages_not_found_suggestions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "error_pages_not_found_suggestions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "error_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "error_pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_meta_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tech_stack_domains" CASCADE;
  DROP TABLE "tech_stack" CASCADE;
  DROP TABLE "services_deliverables" CASCADE;
  DROP TABLE "services_sections" CASCADE;
  DROP TABLE "services_sections_locales" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "projects_sections" CASCADE;
  DROP TABLE "projects_sections_locales" CASCADE;
  DROP TABLE "projects_impact_metrics" CASCADE;
  DROP TABLE "projects_impact_metrics_locales" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_texts" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "blog_posts_locales" CASCADE;
  DROP TABLE "blog_posts_texts" CASCADE;
  DROP TABLE "stack_scenarios_domains" CASCADE;
  DROP TABLE "stack_scenarios" CASCADE;
  DROP TABLE "stack_scenarios_locales" CASCADE;
  DROP TABLE "stack_scenarios_rels" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "home_content_manifesto_pills" CASCADE;
  DROP TABLE "home_content_manifesto_pills_locales" CASCADE;
  DROP TABLE "home_content_manifesto_hidden_transit_lines" CASCADE;
  DROP TABLE "home_content_manifesto_hidden_transit_lines_locales" CASCADE;
  DROP TABLE "home_content_journey_skills" CASCADE;
  DROP TABLE "home_content_journey" CASCADE;
  DROP TABLE "home_content_journey_locales" CASCADE;
  DROP TABLE "home_content" CASCADE;
  DROP TABLE "home_content_locales" CASCADE;
  DROP TABLE "home_content_texts" CASCADE;
  DROP TABLE "services_page" CASCADE;
  DROP TABLE "services_page_locales" CASCADE;
  DROP TABLE "projects_page" CASCADE;
  DROP TABLE "projects_page_locales" CASCADE;
  DROP TABLE "blog_page" CASCADE;
  DROP TABLE "blog_page_locales" CASCADE;
  DROP TABLE "tech_stack_page" CASCADE;
  DROP TABLE "tech_stack_page_locales" CASCADE;
  DROP TABLE "about_content_identity_polaroids" CASCADE;
  DROP TABLE "about_content_identity_polaroids_locales" CASCADE;
  DROP TABLE "about_content_metrics" CASCADE;
  DROP TABLE "about_content_metrics_locales" CASCADE;
  DROP TABLE "about_content_methodology" CASCADE;
  DROP TABLE "about_content_methodology_locales" CASCADE;
  DROP TABLE "about_content_testimonials" CASCADE;
  DROP TABLE "about_content_testimonials_locales" CASCADE;
  DROP TABLE "about_content_tech_stack" CASCADE;
  DROP TABLE "about_content_interests" CASCADE;
  DROP TABLE "about_content_interests_locales" CASCADE;
  DROP TABLE "about_content_client_logos" CASCADE;
  DROP TABLE "about_content_cta_lines" CASCADE;
  DROP TABLE "about_content_cta_socials" CASCADE;
  DROP TABLE "about_content" CASCADE;
  DROP TABLE "about_content_locales" CASCADE;
  DROP TABLE "about_content_texts" CASCADE;
  DROP TABLE "contact_content_socials" CASCADE;
  DROP TABLE "contact_content" CASCADE;
  DROP TABLE "contact_content_locales" CASCADE;
  DROP TABLE "nav_links_nav_links" CASCADE;
  DROP TABLE "nav_links_nav_links_locales" CASCADE;
  DROP TABLE "nav_links_menu_items" CASCADE;
  DROP TABLE "nav_links_menu_items_locales" CASCADE;
  DROP TABLE "nav_links" CASCADE;
  DROP TABLE "nav_links_locales" CASCADE;
  DROP TABLE "error_pages_not_found_suggestions" CASCADE;
  DROP TABLE "error_pages_not_found_suggestions_locales" CASCADE;
  DROP TABLE "error_pages" CASCADE;
  DROP TABLE "error_pages_locales" CASCADE;
  DROP TABLE "site_meta_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tech_stack_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blog_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stack_scenarios_fk";
  
  DROP INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx";
  DROP INDEX "media_sizes_card_sizes_card_filename_idx";
  DROP INDEX "media_sizes_hero_sizes_hero_filename_idx";
  DROP INDEX "payload_locked_documents_rels_tech_stack_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  DROP INDEX "payload_locked_documents_rels_blog_posts_id_idx";
  DROP INDEX "payload_locked_documents_rels_stack_scenarios_id_idx";
  ALTER TABLE "site_meta" ALTER COLUMN "site_name" SET DEFAULT 'yesid.dev';
  ALTER TABLE "media" ADD COLUMN "alt" varchar NOT NULL;
  ALTER TABLE "media" DROP COLUMN "credit";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_url";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_width";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_height";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_card_url";
  ALTER TABLE "media" DROP COLUMN "sizes_card_width";
  ALTER TABLE "media" DROP COLUMN "sizes_card_height";
  ALTER TABLE "media" DROP COLUMN "sizes_card_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_url";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_width";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_height";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_hero_filename";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "tech_stack_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "tech_stack_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "services_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "services_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "projects_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "projects_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_posts_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_posts_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "stack_scenarios_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "stack_scenarios_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "home_content_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "home_content_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "services_page_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "services_page_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "projects_page_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "projects_page_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_page_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "blog_page_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "tech_stack_page_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "tech_stack_page_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "about_content_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "about_content_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "contact_content_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "contact_content_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "nav_links_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "nav_links_update";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "error_pages_find";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "error_pages_update";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tech_stack_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "blog_posts_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stack_scenarios_id";
  ALTER TABLE "site_meta" DROP COLUMN "links_email";
  ALTER TABLE "site_meta" DROP COLUMN "links_github";
  ALTER TABLE "site_meta" DROP COLUMN "links_linkedin";
  ALTER TABLE "site_meta" DROP COLUMN "links_upwork";
  DROP TYPE "public"."enum_tech_stack_domains";
  DROP TYPE "public"."enum_tech_stack_layer";
  DROP TYPE "public"."enum_tech_stack_proficiency";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum_blog_posts_lang";
  DROP TYPE "public"."enum_blog_posts_category";
  DROP TYPE "public"."enum_blog_posts_animation";
  DROP TYPE "public"."enum_stack_scenarios_domains";
  DROP TYPE "public"."enum_home_content_journey_skills_icon";
  DROP TYPE "public"."enum_home_content_journey_highlight_effect";
  DROP TYPE "public"."enum_about_content_tech_stack_category";
  DROP TYPE "public"."enum_about_content_cta_lines_color";
  DROP TYPE "public"."enum_nav_links_nav_links_priority";`)
}
