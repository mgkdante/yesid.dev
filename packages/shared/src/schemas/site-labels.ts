// SiteLabelsSchema — global UI microcopy singleton (go2-t1c).
// CMS columns are prefix-grouped (a11y_/ui_/pages_/email_); this schema
// regroups them into nested objects for ergonomic component reads.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const SiteLabelsSchema = z.object({
	a11y: z.object({
		navCapabilities: LocalizedStringSchema,
		carouselPrev: LocalizedStringSchema,
		carouselNext: LocalizedStringSchema,
		navTechStack: LocalizedStringSchema,
		toc: LocalizedStringSchema,
		closerGraffiti: LocalizedStringSchema,
		/** "Replay intro" — hero dot replay button aria-label (go2/w5). */
		replayIntro: LocalizedStringSchema,
	}),
	ui: z.object({
		markerService: LocalizedStringSchema,
		markerFeatured: LocalizedStringSchema,
		/** "← All Projects" back-to-listing link on /projects/[slug] (go2/w4). */
		backToProjects: LocalizedStringSchema,
		errorStatusNote: LocalizedStringSchema,
		blogEditionTemplate: LocalizedStringSchema,
		copyrightTemplate: LocalizedStringSchema,
		nounProject: LocalizedStringSchema,
		categoryPersonal: LocalizedStringSchema,
		categoryProfessional: LocalizedStringSchema,
		watermarkPersonal: LocalizedStringSchema,
		watermarkProfessional: LocalizedStringSchema,
		/** Hero metro-art caption — ONE line naming the art: "STM métro + REM"
		 *  (go2/w5 taste-2; replaces the two-row in-frame legend). */
		metroCaption: LocalizedStringSchema,
		/** Featured-projects caption for 3+ station projects ({count} placeholder). */
		stationsOneSystem: LocalizedStringSchema,
		/** Listing result-count, per-locale singular/plural ({count} placeholder). */
		resultCount: z.object({
			singular: LocalizedStringSchema,
			plural: LocalizedStringSchema,
		}),
		/** Display names for each published language (localized endonym/exonym). */
		languageNames: z.object({
			en: LocalizedStringSchema,
			fr: LocalizedStringSchema,
			es: LocalizedStringSchema,
		}),
	}),
	pages: z.object({
		blogEdgeTitle: LocalizedStringSchema,
		projectsEdgeTitle: LocalizedStringSchema,
		homeSectionProjects: LocalizedStringSchema,
		homeSectionServices: LocalizedStringSchema,
		homeSectionTerminus: LocalizedStringSchema,
	}),
	email: z.object({
		contactSubjectTemplate: LocalizedStringSchema,
	}),
	// --- slice-30 t1: code-owned chrome groups -------------------------------
	// Mirror the companion-module shapes 1:1 so a future export:fallbacks regen
	// recomposes the flat CMS columns straight back into the constants the
	// components already import (projects/blog/services/nav/site-content
	// companions + hero-data dashboard labels). Leaves stay LocalizedString.
	projectsChrome: z.object({
		// projects.companion.ts → projectsPageMeta
		pageMeta: z.object({
			title: LocalizedStringSchema,
			description: LocalizedStringSchema,
		}),
		// projects.companion.ts → projectsListingContent
		listing: z.object({
			heading: LocalizedStringSchema,
			searchPlaceholder: LocalizedStringSchema,
			seeAllLink: LocalizedStringSchema,
			filters: z.object({
				filtersLabel: LocalizedStringSchema,
				services: LocalizedStringSchema,
				tags: LocalizedStringSchema,
				techStack: LocalizedStringSchema,
				allLabel: LocalizedStringSchema,
				showingPrefix: LocalizedStringSchema,
			}),
			card: z.object({
				stackOverflowSuffix: LocalizedStringSchema,
			}),
		}),
		// projects.companion.ts → projectsDetailContent
		detail: z.object({
			backToListingLabel: LocalizedStringSchema,
			tocSectionTitle: LocalizedStringSchema,
			readmeSectionTitle: LocalizedStringSchema,
			glance: z.object({
				overview: LocalizedStringSchema,
				impact: LocalizedStringSchema,
				stack: LocalizedStringSchema,
				services: LocalizedStringSchema,
				links: LocalizedStringSchema,
				projectInfo: LocalizedStringSchema,
				liveSiteLabel: LocalizedStringSchema,
				liveSiteLabelMobile: LocalizedStringSchema,
				githubLabel: LocalizedStringSchema,
			}),
			tocPill: z.object({
				openAria: LocalizedStringSchema,
				closeAria: LocalizedStringSchema,
			}),
		}),
	}),
	blogChrome: z.object({
		// blog.companion.ts → blogListingContent
		listing: z.object({
			mobileHeading: LocalizedStringSchema,
			searchPlaceholder: LocalizedStringSchema,
			resultNoun: LocalizedStringSchema,
			noPostsMessage: LocalizedStringSchema,
			filters: z.object({
				filtersLabel: LocalizedStringSchema,
				allLabel: LocalizedStringSchema,
				language: LocalizedStringSchema,
				dateRange: LocalizedStringSchema,
				from: LocalizedStringSchema,
				to: LocalizedStringSchema,
				tags: LocalizedStringSchema,
				showingPrefix: LocalizedStringSchema,
			}),
			routeMap: z.object({
				title: LocalizedStringSchema,
				terminus: LocalizedStringSchema,
			}),
		}),
		// blog.companion.ts → blogDetailContent
		detail: z.object({
			code: z.object({
				copyAria: LocalizedStringSchema,
				copyLabel: LocalizedStringSchema,
				errorLabel: LocalizedStringSchema,
			}),
			backNav: z.object({
				toPersonal: LocalizedStringSchema,
				toDispatches: LocalizedStringSchema,
			}),
			header: z.object({
				postTagsAria: LocalizedStringSchema,
				readingTimeLabel: LocalizedStringSchema,
			}),
			page: z.object({
				readingMode: LocalizedStringSchema,
				tocSectionTitle: LocalizedStringSchema,
				metaCategory: LocalizedStringSchema,
				metaWords: LocalizedStringSchema,
				metaReadTime: LocalizedStringSchema,
				metaLanguage: LocalizedStringSchema,
				metaTags: LocalizedStringSchema,
			}),
			tocPill: z.object({
				openAria: LocalizedStringSchema,
				closeAria: LocalizedStringSchema,
			}),
		}),
	}),
	servicesChrome: z.object({
		// services.companion.ts → servicesListingContent
		listing: z.object({
			heading: LocalizedStringSchema,
			stationLabelTemplate: LocalizedStringSchema,
			deepDiveLabel: LocalizedStringSchema,
			/** Compact station-tab labels keyed by service id — short forms for the
			 *  horizontal tab rail (the full titles are too long). */
			stationShortLabels: z.object({
				'database-engineering': LocalizedStringSchema,
				'data-pipeline': LocalizedStringSchema,
				'analytics-reporting': LocalizedStringSchema,
				'web-development': LocalizedStringSchema,
			}),
			projectsStrip: z.object({
				builtWithService: LocalizedStringSchema,
				builtWithFallback: LocalizedStringSchema,
				projectSingular: LocalizedStringSchema,
				projectPlural: LocalizedStringSchema,
			}),
		}),
		// services.companion.ts → servicesPageMeta
		pageMeta: z.object({
			title: LocalizedStringSchema,
			description: LocalizedStringSchema,
		}),
		// services.companion.ts → servicesDetailContent
		detail: z.object({
			backToServicesLabel: LocalizedStringSchema,
			valuePropositionHeading: LocalizedStringSchema,
			deliverablesHeading: LocalizedStringSchema,
			relatedProjectsHeading: LocalizedStringSchema,
			relatedProjectsNavAria: LocalizedStringSchema,
			serviceNavAria: LocalizedStringSchema,
		}),
	}),
	navChrome: z.object({
		// nav.companion.ts → navDirections
		directions: z.object({
			previous: LocalizedStringSchema,
			next: LocalizedStringSchema,
		}),
		// nav.companion.ts → sharedChromeContent
		shared: z.object({
			openMenuAria: LocalizedStringSchema,
			closeMenuAria: LocalizedStringSchema,
			themeToggleAria: LocalizedStringSchema,
			footerNavAria: LocalizedStringSchema,
			menuOverlayAria: LocalizedStringSchema,
			menuOverlayFooterLabel: LocalizedStringSchema,
			localeSwitcherAria: LocalizedStringSchema,
			searchPlaceholder: LocalizedStringSchema,
			clearFiltersLabel: LocalizedStringSchema,
			tocToggleSectionAria: LocalizedStringSchema,
			tocHeading: LocalizedStringSchema,
			tocMobileButton: LocalizedStringSchema,
		}),
	}),
	footerChrome: z.object({
		// site-content.companion.ts → relatedProjectsStripContent
		relatedProjectsStrip: z.object({
			builtWithLabel: LocalizedStringSchema,
			projectCountSingular: LocalizedStringSchema,
			projectCountPlural: LocalizedStringSchema,
		}),
		// site-content.companion.ts → footerContent
		footer: z.object({
			tagline: LocalizedStringSchema,
			location: LocalizedStringSchema,
			statusPrefix: LocalizedStringSchema,
		}),
	}),
	heroDashboard: z.object({
		// hero-data.ts → metric labelI18n / subI18n (verbatim seeds)
		vehiclesLabel: LocalizedStringSchema,
		vehiclesSub: LocalizedStringSchema,
		delayLabel: LocalizedStringSchema,
		// subs carry runtime numbers; seeded as templates ({coverage} / {total})
		// so the localizable WORDS are CMS-owned while the figures stay runtime.
		delaySub: LocalizedStringSchema,
		routesLabel: LocalizedStringSchema,
		routesSub: LocalizedStringSchema,
	}),
});
export type SiteLabels = z.infer<typeof SiteLabelsSchema>;
