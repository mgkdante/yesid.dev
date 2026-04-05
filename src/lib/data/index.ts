// Barrel export — downstream slices import from '$lib/data' rather than from
// individual files. This keeps import paths stable even if the internal file
// structure changes in a future refactor.

// Types
export type { Locale, LocalizedString, ProjectSection, ProjectStatus, Project, Service, SiteLinks, SiteMeta, BlogPost, BlogCategory, BlogAnimation, JourneyPanel, JourneySkill, SkillIcon, HighlightEffect } from './types.js';

// Locale utilities
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from './locale.js';

// Project data + helpers
export { projects, getProjectBySlug, getFeaturedProjects, getPublicProjects, getAllTags, getProjectsByService, getServiceIdsForProjects } from './projects.js';

// Services data
export { services, getServiceById, getVisibleServices } from './services.js';

// Site metadata
export { siteMeta } from './meta.js';

// Blog data
export { blogPosts, getLatestPosts, getPostBySlug, getPostHtml, getPostsByCategory, getTagsForCategory, getPostsByTag, getLanguagesForCategory, getSvgContent, getSvgContentsForPosts, resolveAnimation, resolveSvgFallbackName } from './blog.js';

// Metro line (data-driven stop system)
export { metroStops, TOTAL_STOPS, formatStopLabel, formatServicesLabel, getStopByType } from './metro.js';
export type { MetroStop } from './metro.js';

// Centralized UI content (i18n)
export { heroAnimContent, heroContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta } from './content.js';
