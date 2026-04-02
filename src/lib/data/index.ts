// Barrel export — downstream slices import from '$lib/data' rather than from
// individual files. This keeps import paths stable even if the internal file
// structure changes in a future refactor.

// Types
export type { Locale, LocalizedString, ProjectSection, ProjectStatus, Project, Service, SiteLinks, SiteMeta } from './types.js';

// Locale utilities
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from './locale.js';

// Project data + helpers
export { projects, getProjectBySlug, getFeaturedProjects, getPublicProjects, getAllTags } from './projects.js';

// Services data
export { services } from './services.js';

// Site metadata
export { siteMeta } from './meta.js';
