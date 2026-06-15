// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// Global UI microcopy (aria labels, card markers, edge titles, email templates) from the site_labels singleton. slice-30 t1: also carries the code-owned chrome groups (projectsChrome/blogChrome/servicesChrome/navChrome/footerChrome/heroDashboard) recomposed from the companion-shaped flat columns, so a future regen sources the companion/hero-data labels straight from Directus.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { SiteLabels } from '$lib/types';

export const siteLabels: SiteLabels = {
	a11y: {
		carouselNext: { en: 'Next projects', fr: 'Projets suivants' },
		carouselPrev: { en: 'Previous projects', fr: 'Projets précédents' },
		closerGraffiti: { en: 'THE END graffiti', fr: 'graffiti THE END' },
		navCapabilities: { en: 'Capabilities', fr: 'Capacités' },
		navTechStack: { en: 'Tech stack', fr: 'Stack technique' },
		replayIntro: { en: 'Replay intro', fr: 'Rejouer l\'intro' },
		toc: { en: 'Table of contents', fr: 'Table des matières' },
	},
	blogChrome: {
		detail: {
			backNav: {
				toDispatches: { en: '← back to dispatches', fr: '← retour aux dépêches' },
				toPersonal: {
					en: '← back to personal corner',
					fr: '← retour au coin personnel',
				},
			},
			code: {
				copyAria: {
					en: 'Copy code to clipboard',
					fr: 'Copier le code dans le presse-papiers',
				},
				copyLabel: { en: 'Copy', fr: 'Copier' },
				errorLabel: { en: 'Error', fr: 'Erreur' },
			},
			header: {
				postTagsAria: { en: 'Post tags', fr: 'Étiquettes de l\'article' },
				readingTimeLabel: { en: '{minutes} min read', fr: '{minutes} min de lecture' },
			},
			page: {
				metaCategory: { en: 'Category', fr: 'Catégorie' },
				metaLanguage: { en: 'Language', fr: 'Langue' },
				metaReadTime: { en: 'Read time', fr: 'Temps de lecture' },
				metaTags: { en: 'Tags', fr: 'Étiquettes' },
				metaWords: { en: 'Words', fr: 'Mots' },
				readingMode: { en: 'Reading mode', fr: 'Mode lecture' },
				tocSectionTitle: { en: 'On this page', fr: 'Sur cette page' },
			},
			tocPill: {
				closeAria: {
					en: 'Close table of contents',
					fr: 'Fermer la table des matières',
				},
				openAria: { en: 'Table of contents', fr: 'Table des matières' },
			},
		},
		listing: {
			filters: {
				allLabel: { en: 'All', fr: 'Tous' },
				dateRange: { en: 'Date Range', fr: 'Période' },
				filtersLabel: { en: 'Filters', fr: 'Filtres' },
				from: { en: 'From', fr: 'De' },
				language: { en: 'Language', fr: 'Langue' },
				showingPrefix: { en: 'Showing', fr: 'Affichage' },
				tags: { en: 'Tags', fr: 'Étiquettes' },
				to: { en: 'To', fr: 'À' },
			},
			mobileHeading: { en: 'Blog', fr: 'Blogue' },
			noPostsMessage: {
				en: 'No posts found. Try adjusting your filters.',
				fr: 'Aucun article trouvé. Essaie d\'ajuster tes filtres.',
			},
			resultNoun: { en: 'result', fr: 'résultat' },
			routeMap: {
				terminus: { en: 'Terminus', fr: 'Terminus' },
				title: { en: 'Route Map', fr: 'Carte du trajet' },
			},
			searchPlaceholder: { en: 'Search posts...', fr: 'Chercher des articles...' },
		},
	},
	email: {
		contactSubjectTemplate: {
			en: 'New contact from {name} via yesid.dev',
			fr: 'Nouveau message de {name} via yesid.dev',
		},
	},
	footerChrome: {
		footer: {
			location: {
				en: 'Montreal, QC · Remote',
				fr: 'Montréal, QC · À distance',
			},
			statusPrefix: { en: 'system online ·', fr: 'système en ligne ·' },
			tagline: {
				en: '// digital infrastructure',
				fr: '// infrastructure numérique',
			},
		},
		relatedProjectsStrip: {
			builtWithLabel: { en: 'Built with this', fr: 'Bâti avec ça' },
			projectCountPlural: { en: 'projects', fr: 'projets' },
			projectCountSingular: { en: 'project', fr: 'projet' },
		},
	},
	heroDashboard: {
		delayLabel: { en: 'AVG DELAY', fr: 'RETARD MOYEN' },
		delaySub: {
			en: '{coverage}% COVERAGE',
			fr: '{coverage}% DE COUVERTURE',
		},
		routesLabel: { en: 'ROUTES LIVE', fr: 'LIGNES EN DIRECT' },
		routesSub: { en: 'OF {total} TOTAL', fr: 'SUR {total} AU TOTAL' },
		vehiclesLabel: { en: 'VEHICLES TRACKED', fr: 'VÉHICULES SUIVIS' },
		vehiclesSub: { en: 'STM · LIVE', fr: 'STM · EN DIRECT' },
	},
	navChrome: {
		directions: {
			next: { en: 'Next', fr: 'Suivant' },
			previous: { en: 'Previous', fr: 'Précédent' },
		},
		shared: {
			clearFiltersLabel: { en: 'clear filters', fr: 'effacer les filtres' },
			closeMenuAria: { en: 'Close menu', fr: 'Fermer le menu' },
			footerNavAria: {
				en: 'Footer navigation',
				fr: 'Navigation du pied de page',
			},
			localeSwitcherAria: { en: 'Language', fr: 'Langue' },
			menuOverlayAria: { en: 'Navigation menu', fr: 'Menu de navigation' },
			menuOverlayFooterLabel: {
				en: 'NAVIGATION · ALL ROUTES',
				fr: 'NAVIGATION · TOUTES LES ROUTES',
			},
			openMenuAria: { en: 'Open menu', fr: 'Ouvrir le menu' },
			searchPlaceholder: { en: 'Search...', fr: 'Rechercher...' },
			themeToggleAria: { en: 'Dark theme', fr: 'Thème sombre' },
			tocHeading: { en: 'On this page', fr: 'Sur cette page' },
			tocMobileButton: { en: 'Table of Contents', fr: 'Table des matières' },
			tocToggleSectionAria: { en: 'Toggle section', fr: 'Basculer la section' },
		},
	},
	pages: {
		blogEdgeTitle: { en: 'Blog', fr: 'Blog' },
		homeSectionProjects: { en: 'Projects', fr: 'Projets' },
		homeSectionServices: { en: 'Services', fr: 'Services' },
		homeSectionTerminus: { en: 'Terminus', fr: 'Terminus' },
		projectsEdgeTitle: { en: 'Projects', fr: 'Projets' },
	},
	projectsChrome: {
		detail: {
			backToListingLabel: { en: '← All Projects', fr: '← Tous les projets' },
			glance: {
				githubLabel: { en: 'GitHub', fr: 'GitHub' },
				impact: { en: 'Impact', fr: 'Impact' },
				links: { en: 'Links', fr: 'Liens' },
				liveSiteLabel: { en: 'Live Site', fr: 'Site en ligne' },
				liveSiteLabelMobile: { en: '↗ Live Site', fr: '↗ Site en ligne' },
				overview: { en: 'Overview', fr: 'Aperçu' },
				projectInfo: { en: 'Project Info', fr: 'Infos du projet' },
				services: { en: 'Services', fr: 'Services' },
				stack: { en: 'Stack', fr: 'Stack' },
			},
			readmeSectionTitle: { en: 'README', fr: 'README' },
			tocPill: {
				closeAria: {
					en: 'Close table of contents',
					fr: 'Fermer la table des matières',
				},
				openAria: { en: 'Table of contents', fr: 'Table des matières' },
			},
			tocSectionTitle: { en: 'On this page', fr: 'Sur cette page' },
		},
		listing: {
			card: {
				stackOverflowSuffix: { en: '+{count} more', fr: '+{count} de plus' },
			},
			filters: {
				allLabel: { en: 'All', fr: 'Tous' },
				filtersLabel: { en: 'Filters', fr: 'Filtres' },
				services: { en: 'Services', fr: 'Services' },
				showingPrefix: { en: 'Showing', fr: 'Affichage' },
				tags: { en: 'Tags', fr: 'Étiquettes' },
				techStack: { en: 'Tech Stack', fr: 'Stack technique' },
			},
			heading: { en: 'Projects', fr: 'Projets' },
			searchPlaceholder: { en: 'Search projects...', fr: 'Rechercher des projets…' },
			seeAllLink: { en: 'See all projects →', fr: 'Voir tous les projets →' },
		},
		pageMeta: {
			description: {
				en: 'Projects, pipelines, and systems built by yesid., freelance digital infrastructure in Montreal.',
				fr: 'Des projets, des pipelines pis des systèmes bâtis par yesid., infrastructure numérique à la pige à Montréal.',
			},
			title: { en: 'Projects | yesid.', fr: 'Projets | yesid.' },
		},
	},
	servicesChrome: {
		detail: {
			backToServicesLabel: { en: '← All Services', fr: '← Tous les services' },
			deliverablesHeading: { en: 'Typical Deliverables', fr: 'Livrables typiques' },
			relatedProjectsHeading: { en: 'Related Projects', fr: 'Projets liés' },
			relatedProjectsNavAria: { en: 'Related projects', fr: 'Projets liés' },
			seeStackLabel: {
				en: 'See the full stack →',
				fr: 'Voir la stack complète →',
			},
			serviceNavAria: { en: 'Service navigation', fr: 'Navigation des services' },
			stackHeading: { en: 'Stack', fr: 'Stack' },
			valuePropositionHeading: { en: 'How This Helps You', fr: 'Comment ça t\'aide' },
		},
		listing: {
			deepDiveLabel: { en: 'Deep dive →', fr: 'Voir en détail →' },
			heading: { en: 'Services', fr: 'Services' },
			projectsStrip: {
				builtWithFallback: { en: 'Built with this', fr: 'Bâti avec ça' },
				builtWithService: {
					en: 'Built with {serviceTitle}',
					fr: 'Bâti avec {serviceTitle}',
				},
				projectPlural: { en: 'PROJECTS', fr: 'PROJETS' },
				projectSingular: { en: 'PROJECT', fr: 'PROJET' },
			},
			stationLabelTemplate: {
				en: 'Service {stationNum} / {totalStr}',
				fr: 'Service {stationNum} / {totalStr}',
			},
			stationShortLabels: {
				'analytics-reporting': { en: 'Dashboards', fr: 'Tableaux de bord' },
				'data-pipeline': { en: 'Pipelines', fr: 'Pipelines' },
				'database-engineering': { en: 'Databases', fr: 'Bases de données' },
				'web-development': { en: 'Websites', fr: 'Sites web' },
			},
		},
		pageMeta: {
			description: {
				en: 'Four stations: Databases & SQL, Pipelines & Automation, Dashboards & Analytics, Websites & E-commerce. Built in Montreal, shipped with numbers.',
				fr: 'Quatre stations : Bases de données & SQL, Pipelines & Automatisation, Tableaux de bord & Analytique, Sites web & Commerce en ligne. Bâti à Montréal, livré avec des chiffres.',
			},
			title: { en: 'Services · yesid.', fr: 'Services · yesid.' },
		},
	},
	ui: {
		backToProjects: { en: '← All Projects', fr: '← Tous les projets' },
		blogEditionTemplate: {
			en: 'VOL. 01 // ISS. {issue}',
			fr: 'VOL. 01 // NO {issue}',
		},
		categoryPersonal: { en: 'Personal', fr: 'Perso' },
		categoryProfessional: { en: 'Professional', fr: 'Professionnel' },
		copyrightTemplate: { en: '© {year} yesid', fr: '© {year} yesid' },
		errorStatusNote: {
			en: '// requested path not in service',
			fr: '// chemin demandé hors service',
		},
		languageNames: {
			en: { en: 'English', fr: 'Anglais' },
			es: { en: 'Spanish', fr: 'Espagnol' },
			fr: { en: 'French', fr: 'Français' },
		},
		markerFeatured: { en: '{num} / FEATURED', fr: '{num} / EN VEDETTE' },
		markerService: { en: '{num} / SERVICE', fr: '{num} / SERVICE' },
		metroCaption: { en: 'STM métro + REM', fr: 'métro STM + REM' },
		nounProject: { en: 'project', fr: 'projet' },
		resultCount: {
			plural: { en: '{count} results', fr: '{count} résultats' },
			singular: { en: '{count} result', fr: '{count} résultat' },
		},
		stationsOneSystem: {
			en: '{count} stations · one system',
			fr: '{count} stations · un seul système',
		},
		watermarkPersonal: { en: 'Personal', fr: 'Perso' },
		watermarkProfessional: { en: 'Dispatch', fr: 'Dépêche' },
	},
};
