// Barrel export — downstream slices import from '$lib/data' rather than from
// individual files. This keeps import paths stable even if the internal file
// structure changes in a future refactor.

// Types
export type { Locale, LocalizedString, ServiceSection, ProjectSection, ProjectStatus, Project, Service, SiteLinks, SiteMeta, BlogPost, BlogCategory, BlogAnimation, JourneyPanel, JourneySkill, SkillIcon, HighlightEffect, AboutPolaroid, AboutIdentity, AboutMetric, AboutMethodStep, AboutTestimonial, AboutInterest, TechCategory, AboutTechItem, TechStackItem, InfraLayer, DomainCluster, Proficiency, StackScenario, AboutClientLogo, AboutWeatherConfig, AboutCta, AboutContent, ContactContent, ContactInfoTerminal, ContactFormTerminal, ContactValidation, ContactSuccess, ContactTerminalField } from './types.js';

// Locale utilities
export { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from './locale.js';

// Project data + helpers
export { projects, getProjectBySlug, getFeaturedProjects, getPublicProjects, getAllTags, getAllStackItems, getProjectsByService, getServiceIdsForProjects } from './projects.js';

// Services data
export { services, getServiceById, getVisibleServices, getAdjacentServices } from './services.js';

// Site metadata
export { siteMeta } from './meta.js';

// Blog data
export { blogPosts, getLatestPosts, getPostBySlug, getPostHtml, getPostsByCategory, getTagsForCategory, getPostsByTag, getLanguagesForCategory, getSvgContent, getSvgContentsForPosts, resolveAnimation, resolveSvgFallbackName } from './blog.js';

// Metro line (data-driven stop system)
export { metroStops, TOTAL_STOPS, formatStopLabel, formatServicesLabel, getStopByType } from './metro.js';
export type { MetroStop } from './metro.js';

// Service SVG loading
export { fetchServiceSvgContents, getServiceSvgUrl } from './serviceSvg.js';

// Centralized UI content (i18n)
export { heroAnimContent, heroContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta } from './content.js';

// About page content (full-page bento dashboard)
export { aboutPageContent } from './about-page.js';

// Contact page content
export { contactContent } from './contact-page.js';

// Tech stack page data (Slice 10 — "The Control Room")
export { getAllTechItems, getTechItemById, getTechItemsByLayer, getTechItemsByDomain, getConnections, getIncomingConnections, getTechItemContent, getAllScenarios, getScenarioForDomains, validateTechItems, validateScenarios } from './tech-stack.js';

// Nav data (Slice 11 — Navbar Redesign + 404 Page)
export { navLinks, menuItems, errorPageContent } from './nav.js';
export type { NavLink, MenuItem, ErrorPageContent } from './nav.js';
