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
		projectImageOpen: LocalizedStringSchema,
		projectImageClose: LocalizedStringSchema,
		moreMetrics: LocalizedStringSchema,
		architectureDiagram: LocalizedStringSchema,
		technologyStackTemplate: LocalizedStringSchema,
		/** Collapse/expand-all reading control (detail headers). Verb labels flip
		 *  with state (label = open state, labelCollapsed = collapsed state);
		 *  enable/disable are the state tooltips; remember/forget the persist
		 *  control (homework #19b: verbs instead of a mode name). */
		quietModeLabel: LocalizedStringSchema,
		quietModeLabelCollapsed: LocalizedStringSchema,
		quietModeEnable: LocalizedStringSchema,
		quietModeDisable: LocalizedStringSchema,
		quietModeRemember: LocalizedStringSchema,
		quietModeForget: LocalizedStringSchema,
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
		terminalTitle: LocalizedStringSchema,
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
		homeSectionAbout: LocalizedStringSchema,
		homeSectionTerminus: LocalizedStringSchema,
	}),
	email: z.object({
		contactSubjectTemplate: LocalizedStringSchema,
	}),
	// --- slice-30 t1: CMS chrome groups --------------------------------------
	// Recompose flat CMS columns into stable chrome groups consumed from
	// siteLabels.*. Leaves stay LocalizedString.
	projectsChrome: z.object({
		// Former projectsPageMeta shape.
		pageMeta: z.object({
			title: LocalizedStringSchema,
			description: LocalizedStringSchema,
		}),
		// Former projectsListingContent shape.
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
		// Former projectsDetailContent shape.
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
				repoPrivateLabel: LocalizedStringSchema,
			}),
			tocPill: z.object({
				openAria: LocalizedStringSchema,
				closeAria: LocalizedStringSchema,
			}),
		}),
	}),
	blogChrome: z.object({
		// Former blogListingContent shape.
		listing: z.object({
			mobileHeading: LocalizedStringSchema,
			searchPlaceholder: LocalizedStringSchema,
			resultNoun: LocalizedStringSchema,
			noPostsMessage: LocalizedStringSchema,
			/** Unfiltered empty state: the section has no posts at all and no
			 *  filters are active. The filtered variant stays in noPostsMessage. */
			noPostsEmptyMessage: LocalizedStringSchema,
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
		// Former blogDetailContent shape.
		detail: z.object({
			code: z.object({
				title: LocalizedStringSchema,
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
		// Former servicesListingContent shape.
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
		// Former servicesPageMeta shape.
		pageMeta: z.object({
			title: LocalizedStringSchema,
			description: LocalizedStringSchema,
		}),
		// Former servicesDetailContent shape.
		detail: z.object({
			backToServicesLabel: LocalizedStringSchema,
			valuePropositionHeading: LocalizedStringSchema,
			deliverablesHeading: LocalizedStringSchema,
			relatedProjectsHeading: LocalizedStringSchema,
			relatedProjectsNavAria: LocalizedStringSchema,
			serviceNavAria: LocalizedStringSchema,
			stackHeading: LocalizedStringSchema,
			seeStackLabel: LocalizedStringSchema,
		}),
	}),
	navChrome: z.object({
		// Former navDirections shape.
		directions: z.object({
			previous: LocalizedStringSchema,
			next: LocalizedStringSchema,
		}),
		// Former sharedChromeContent shape.
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
			tocCloseAria: LocalizedStringSchema,
			tocCounterPrefix: LocalizedStringSchema,
		}),
	}),
	footerChrome: z.object({
		// Former relatedProjectsStripContent shape.
		relatedProjectsStrip: z.object({
			builtWithLabel: LocalizedStringSchema,
			projectCountSingular: LocalizedStringSchema,
			projectCountPlural: LocalizedStringSchema,
		}),
		// Former footerContent shape.
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
		/** Vehicles sub-label when REAL KPIs are on screen (vehiclesSub = DEMO state). */
		vehiclesSubLive: LocalizedStringSchema,
		delayLabel: LocalizedStringSchema,
		// subs carry runtime numbers; seeded as templates ({coverage} / {total})
		// so the localizable WORDS are CMS-owned while the figures stay runtime.
		delaySub: LocalizedStringSchema,
		routesLabel: LocalizedStringSchema,
		routesSub: LocalizedStringSchema,
	}),
});
export type SiteLabels = z.infer<typeof SiteLabelsSchema>;
