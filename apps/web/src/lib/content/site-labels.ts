// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
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
		architectureDiagram: {
			en: 'Architecture diagram',
			es: 'Diagrama de arquitectura',
			fr: 'Diagramme d\'architecture',
		},
		carouselNext: {
			en: 'Next projects',
			es: 'Próximos proyectos',
			fr: 'Projets suivants',
		},
		carouselPrev: {
			en: 'Previous projects',
			es: 'Proyectos anteriores',
			fr: 'Projets précédents',
		},
		closerGraffiti: {
			en: 'THE END graffiti',
			es: 'grafiti THE END',
			fr: 'graffiti THE END',
		},
		moreMetrics: {
			en: 'More metrics',
			es: 'Más métricas',
			fr: 'Plus de métriques',
		},
		navCapabilities: { en: 'Capabilities', es: 'Capacidades', fr: 'Capacités' },
		navTechStack: {
			en: 'Tech stack',
			es: 'Stack técnico',
			fr: 'Stack technique',
		},
		projectImageClose: {
			en: 'Close image',
			es: 'Cerrar imagen',
			fr: 'Fermer l\'image',
		},
		projectImageOpen: {
			en: 'Open {caption}',
			es: 'Abrir {caption}',
			fr: 'Ouvrir {caption}',
		},
		quietModeDisable: {
			en: 'Expand all sections on this page',
			es: 'Expandir todas las secciones de esta página',
			fr: 'Déplier toutes les sections de la page',
		},
		quietModeEnable: {
			en: 'Collapse all sections on this page',
			es: 'Contraer todas las secciones de esta página',
			fr: 'Replier toutes les sections de la page',
		},
		quietModeForget: {
			en: 'Don\'t start collapsed',
			es: 'No empezar contraído',
			fr: 'Ne plus replier',
		},
		quietModeLabel: {
			en: 'Collapse all',
			es: 'Contraer todo',
			fr: 'Tout replier',
		},
		quietModeLabelCollapsed: {
			en: 'Expand all',
			es: 'Expandir todo',
			fr: 'Tout déplier',
		},
		quietModeRemember: {
			en: 'Always start collapsed',
			es: 'Empezar siempre contraído',
			fr: 'Toujours replier',
		},
		replayIntro: {
			en: 'Replay intro',
			es: 'Repetir la intro',
			fr: 'Rejouer l\'intro',
		},
		technologyStackTemplate: {
			en: 'Technology stack: {stack}',
			es: 'Stack tecnológico: {stack}',
			fr: 'Stack technique : {stack}',
		},
		toc: {
			en: 'Table of contents',
			es: 'Tabla de contenido',
			fr: 'Table des matières',
		},
	},
	blogChrome: {
		detail: {
			backNav: {
				toDispatches: {
					en: '← back to Blog',
					es: '← volver al blog',
					fr: '← retour au blogue',
				},
				toPersonal: {
					en: '← back to personal corner',
					es: '← volver al rincón personal',
					fr: '← retour au coin personnel',
				},
			},
			code: {
				copyAria: {
					en: 'Copy code to clipboard',
					es: 'Copiar código al portapapeles',
					fr: 'Copier le code dans le presse-papiers',
				},
				copyLabel: { en: 'Copy', es: 'Copiar', fr: 'Copier' },
				errorLabel: { en: 'Error', es: 'Error', fr: 'Erreur' },
				title: { en: 'code', es: 'código', fr: 'code' },
			},
			header: {
				postTagsAria: {
					en: 'Post tags',
					es: 'Etiquetas del artículo',
					fr: 'Étiquettes de l\'article',
				},
				readingTimeLabel: {
					en: '{minutes} min read',
					es: '{minutes} min de lectura',
					fr: '{minutes} min de lecture',
				},
			},
			page: {
				metaCategory: { en: 'Category', es: 'Categoría', fr: 'Catégorie' },
				metaLanguage: { en: 'Language', es: 'Idioma', fr: 'Langue' },
				metaReadTime: {
					en: 'Read time',
					es: 'Tiempo de lectura',
					fr: 'Temps de lecture',
				},
				metaTags: { en: 'Tags', es: 'Etiquetas', fr: 'Étiquettes' },
				metaWords: { en: 'Words', es: 'Palabras', fr: 'Mots' },
				readingMode: {
					en: 'Reading mode',
					es: 'Modo lectura',
					fr: 'Mode lecture',
				},
				tocSectionTitle: {
					en: 'On this page',
					es: 'En esta página',
					fr: 'Sur cette page',
				},
			},
			tocPill: {
				closeAria: {
					en: 'Close table of contents',
					es: 'Cerrar tabla de contenido',
					fr: 'Fermer la table des matières',
				},
				openAria: {
					en: 'Table of contents',
					es: 'Tabla de contenido',
					fr: 'Table des matières',
				},
			},
		},
		listing: {
			filters: {
				allLabel: { en: 'All', es: 'Todos', fr: 'Tous' },
				dateRange: { en: 'Date Range', es: 'Rango de fechas', fr: 'Période' },
				filtersLabel: { en: 'Filters', es: 'Filtros', fr: 'Filtres' },
				from: { en: 'From', es: 'Desde', fr: 'De' },
				language: { en: 'Language', es: 'Idioma', fr: 'Langue' },
				showingPrefix: { en: 'Showing', es: 'Mostrando', fr: 'Affichage' },
				tags: { en: 'Tags', es: 'Etiquetas', fr: 'Étiquettes' },
				to: { en: 'To', es: 'Hasta', fr: 'À' },
			},
			mobileHeading: { en: 'Blog', es: 'Blog', fr: 'Blogue' },
			noPostsEmptyMessage: {
				en: 'Nothing here yet. New posts are in transit.',
				es: 'Nada por aquí todavía. Los nuevos artículos están en tránsito.',
				fr: 'Rien ici pour le moment. Les prochains articles sont en transit.',
			},
			noPostsMessage: {
				en: 'No posts found. Try adjusting your filters.',
				es: 'No se encontraron artículos. Intenta ajustar tus filtros.',
				fr: 'Aucun article trouvé. Essaie d\'ajuster tes filtres.',
			},
			resultNoun: { en: 'result', es: 'resultado', fr: 'résultat' },
			routeMap: {
				terminus: { en: 'Terminus', es: 'Terminal', fr: 'Terminus' },
				title: {
					en: 'Route Map',
					es: 'Mapa de ruta',
					fr: 'Carte du trajet',
				},
			},
			searchPlaceholder: {
				en: 'Search posts...',
				es: 'Buscar artículos...',
				fr: 'Chercher des articles...',
			},
		},
	},
	email: {
		contactSubjectTemplate: {
			en: 'New contact from {name} via yesid.dev',
			es: 'Nuevo mensaje de {name} vía yesid.dev',
			fr: 'Nouveau message de {name} via yesid.dev',
		},
	},
	footerChrome: {
		footer: {
			connectLabel: { en: 'CONNECT', es: 'CONECTA', fr: 'CONNEXION' },
			exploreLabel: { en: 'EXPLORE', es: 'EXPLORA', fr: 'EXPLORER' },
			legalLabel: { en: 'LEGAL', es: 'LEGAL', fr: 'LÉGAL' },
			location: {
				en: 'Montreal, QC · Remote',
				es: 'Montreal, QC · Remoto',
				fr: 'Montréal, QC · À distance',
			},
			statusPrefix: {
				en: 'system online ·',
				es: 'sistema en línea ·',
				fr: 'système en ligne ·',
			},
			tagline: {
				en: '// digital infrastructure',
				es: '// infraestructura digital',
				fr: '// infrastructure numérique',
			},
		},
		relatedProjectsStrip: {
			builtWithLabel: {
				en: 'Built with this',
				es: 'Construido con esto',
				fr: 'Bâti avec ça',
			},
			projectCountPlural: { en: 'projects', es: 'proyectos', fr: 'projets' },
			projectCountSingular: { en: 'project', es: 'proyecto', fr: 'projet' },
		},
	},
	heroDashboard: {
		delayLabel: { en: 'AVG DELAY', es: 'DEMORA MEDIA', fr: 'RETARD MOYEN' },
		delaySub: {
			en: '{coverage}% COVERAGE',
			es: '{coverage}% DE COBERTURA',
			fr: '{coverage}% DE COUVERTURE',
		},
		routesLabel: {
			en: 'ROUTES LIVE',
			es: 'RUTAS EN VIVO',
			fr: 'LIGNES EN DIRECT',
		},
		routesSub: {
			en: 'OF {total} TOTAL',
			es: 'DE {total} EN TOTAL',
			fr: 'SUR {total} AU TOTAL',
		},
		vehiclesLabel: {
			en: 'VEHICLES TRACKED',
			es: 'VEHÍCULOS RASTREADOS',
			fr: 'VÉHICULES SUIVIS',
		},
		vehiclesSub: {
			en: 'DEMO · STM-STYLE',
			es: 'DEMO · ESTILO STM',
			fr: 'DÉMO · STYLE STM',
		},
		vehiclesSubLive: {
			en: 'STM · LIVE',
			es: 'STM · EN VIVO',
			fr: 'STM · EN DIRECT',
		},
	},
	navChrome: {
		directions: {
			next: { en: 'Next', es: 'Siguiente', fr: 'Suivant' },
			previous: { en: 'Previous', es: 'Anterior', fr: 'Précédent' },
		},
		shared: {
			clearFiltersLabel: {
				en: 'clear filters',
				es: 'limpiar filtros',
				fr: 'effacer les filtres',
			},
			closeMenuAria: {
				en: 'Close menu',
				es: 'Cerrar menú',
				fr: 'Fermer le menu',
			},
			footerNavAria: {
				en: 'Footer navigation',
				es: 'Navegación del pie de página',
				fr: 'Navigation du pied de page',
			},
			localeSwitcherAria: { en: 'Language', es: 'Idioma', fr: 'Langue' },
			menuOverlayAria: {
				en: 'Navigation menu',
				es: 'Menú de navegación',
				fr: 'Menu de navigation',
			},
			menuOverlayFooterLabel: {
				en: 'NAVIGATION · ALL ROUTES',
				es: 'NAVEGACIÓN · TODAS LAS RUTAS',
				fr: 'NAVIGATION · TOUTES LES ROUTES',
			},
			openMenuAria: { en: 'Open menu', es: 'Abrir menú', fr: 'Ouvrir le menu' },
			searchPlaceholder: { en: 'Search...', es: 'Buscar...', fr: 'Rechercher...' },
			themeToggleAria: { en: 'Dark theme', es: 'Tema oscuro', fr: 'Thème sombre' },
			tocCloseAria: {
				en: 'Close table of contents',
				es: 'Cerrar tabla de contenido',
				fr: 'Fermer la table des matières',
			},
			tocCounterPrefix: { en: 'SEC', es: 'SEC', fr: 'SEC' },
			tocHeading: {
				en: 'On this page',
				es: 'En esta página',
				fr: 'Sur cette page',
			},
			tocMobileButton: {
				en: 'Table of Contents',
				es: 'Tabla de contenido',
				fr: 'Table des matières',
			},
			tocToggleSectionAria: {
				en: 'Toggle section',
				es: 'Alternar sección',
				fr: 'Basculer la section',
			},
		},
	},
	pages: {
		blogEdgeTitle: { en: 'Blog', es: 'Blog', fr: 'Blog' },
		homeSectionAbout: { en: 'About', es: 'Sobre mí', fr: 'À propos' },
		homeSectionProjects: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
		homeSectionServices: { en: 'Services', es: 'Servicios', fr: 'Services' },
		homeSectionTerminus: { en: 'Terminus', es: 'Terminal', fr: 'Terminus' },
		projectsEdgeTitle: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
	},
	projectsChrome: {
		detail: {
			backToListingLabel: {
				en: '← All Projects',
				es: '← Todos los proyectos',
				fr: '← Tous les projets',
			},
			glance: {
				githubLabel: { en: 'GitHub', es: 'GitHub', fr: 'GitHub' },
				impact: { en: 'Impact', es: 'Impacto', fr: 'Impact' },
				links: { en: 'Links', es: 'Enlaces', fr: 'Liens' },
				liveSiteLabel: {
					en: 'Live Site',
					es: 'Sitio en vivo',
					fr: 'Site en ligne',
				},
				liveSiteLabelMobile: {
					en: '↗ Live Site',
					es: '↗ Sitio en vivo',
					fr: '↗ Site en ligne',
				},
				overview: { en: 'Overview', es: 'Resumen', fr: 'Aperçu' },
				projectInfo: {
					en: 'Project Info',
					es: 'Info del proyecto',
					fr: 'Infos du projet',
				},
				repoPrivateLabel: {
					en: 'Private repo (for now)',
					es: 'Repo privado (por ahora)',
					fr: 'Dépôt privé (pour le moment)',
				},
				services: { en: 'Services', es: 'Servicios', fr: 'Services' },
				stack: { en: 'Stack', es: 'Stack', fr: 'Stack' },
			},
			readmeSectionTitle: { en: 'README', es: 'README', fr: 'README' },
			tocPill: {
				closeAria: {
					en: 'Close table of contents',
					es: 'Cerrar tabla de contenido',
					fr: 'Fermer la table des matières',
				},
				openAria: {
					en: 'Table of contents',
					es: 'Tabla de contenido',
					fr: 'Table des matières',
				},
			},
			tocSectionTitle: {
				en: 'On this page',
				es: 'En esta página',
				fr: 'Sur cette page',
			},
		},
		listing: {
			card: {
				stackOverflowSuffix: {
					en: '+{count} more',
					es: '+{count} más',
					fr: '+{count} de plus',
				},
			},
			filters: {
				allLabel: { en: 'All', es: 'Todos', fr: 'Tous' },
				filtersLabel: { en: 'Filters', es: 'Filtros', fr: 'Filtres' },
				services: { en: 'Services', es: 'Servicios', fr: 'Services' },
				showingPrefix: { en: 'Showing', es: 'Mostrando', fr: 'Affichage' },
				tags: { en: 'Tags', es: 'Etiquetas', fr: 'Étiquettes' },
				techStack: {
					en: 'Tech Stack',
					es: 'Stack técnico',
					fr: 'Stack technique',
				},
			},
			heading: { en: 'Projects', es: 'Proyectos', fr: 'Projets' },
			searchPlaceholder: {
				en: 'Search projects...',
				es: 'Buscar proyectos...',
				fr: 'Rechercher des projets…',
			},
			seeAllLink: {
				en: 'See all projects →',
				es: 'Ver todos los proyectos →',
				fr: 'Voir tous les projets →',
			},
		},
		pageMeta: {
			description: {
				en: 'Projects, pipelines, and systems built by yesid., freelance digital infrastructure in Montreal.',
				es: 'Proyectos, pipelines y sistemas construidos por yesid., infraestructura digital freelance en Montreal. Cada uno con su historia y sus números.',
				fr: 'Des projets, des pipelines pis des systèmes bâtis par yesid., infrastructure numérique à la pige à Montréal.',
			},
			title: {
				en: 'Projects | yesid.',
				es: 'Proyectos | yesid.',
				fr: 'Projets | yesid.',
			},
		},
	},
	servicesChrome: {
		detail: {
			backToServicesLabel: {
				en: '← All Services',
				es: '← Todos los servicios',
				fr: '← Tous les services',
			},
			deliverablesHeading: {
				en: 'Typical Deliverables',
				es: 'Entregables típicos',
				fr: 'Livrables typiques',
			},
			relatedProjectsHeading: {
				en: 'Related Projects',
				es: 'Proyectos relacionados',
				fr: 'Projets liés',
			},
			relatedProjectsNavAria: {
				en: 'Related projects',
				es: 'Proyectos relacionados',
				fr: 'Projets liés',
			},
			seeStackLabel: {
				en: 'See the full stack →',
				es: 'Ver el stack completo →',
				fr: 'Voir la stack complète →',
			},
			serviceNavAria: {
				en: 'Service navigation',
				es: 'Navegación de servicios',
				fr: 'Navigation des services',
			},
			stackHeading: { en: 'Stack', es: 'Stack', fr: 'Stack' },
			valuePropositionHeading: {
				en: 'How This Helps You',
				es: 'Cómo te ayuda esto',
				fr: 'Comment ça t\'aide',
			},
		},
		listing: {
			deepDiveLabel: {
				en: 'Deep dive →',
				es: 'Ver a fondo →',
				fr: 'Voir en détail →',
			},
			heading: { en: 'Services', es: 'Servicios', fr: 'Services' },
			projectsStrip: {
				builtWithFallback: {
					en: 'Built with this',
					es: 'Construido con esto',
					fr: 'Bâti avec ça',
				},
				builtWithService: {
					en: 'Built with {serviceTitle}',
					es: 'Construido con {serviceTitle}',
					fr: 'Bâti avec {serviceTitle}',
				},
				projectPlural: { en: 'PROJECTS', es: 'PROYECTOS', fr: 'PROJETS' },
				projectSingular: { en: 'PROJECT', es: 'PROYECTO', fr: 'PROJET' },
			},
			stationLabelTemplate: {
				en: 'Service {stationNum} / {totalStr}',
				es: 'Servicio {stationNum} / {totalStr}',
				fr: 'Service {stationNum} / {totalStr}',
			},
			stationShortLabels: {
				'analytics-reporting': { en: 'Dashboards', es: 'Tableros', fr: 'Tableaux de bord' },
				'data-pipeline': { en: 'Pipelines', es: 'Pipelines', fr: 'Pipelines' },
				'database-engineering': {
					en: 'Databases',
					es: 'Bases de datos',
					fr: 'Bases de données',
				},
				'web-development': { en: 'Websites', es: 'Sitios web', fr: 'Sites web' },
			},
		},
		pageMeta: {
			description: {
				en: 'Four stations: Databases & SQL, Pipelines & Automation, Dashboards & Analytics, Websites & E-commerce. Built in Montreal, shipped with numbers.',
				es: 'Cuatro estaciones: Bases de datos y SQL, Pipelines y Automatización, Tableros y Analítica, Sitios web y E-commerce. Hecho en Montreal, entregado con números.',
				fr: 'Quatre stations : Bases de données & SQL, Pipelines & Automatisation, Tableaux de bord & Analytique, Sites web & Commerce en ligne. Bâti à Montréal, livré avec des chiffres.',
			},
			title: {
				en: 'Services · yesid.',
				es: 'Servicios · yesid.',
				fr: 'Services · yesid.',
			},
		},
	},
	ui: {
		analyticsConsent: {
			acceptLabel: {
				en: 'Allow analytics',
				es: 'Permitir analítica',
				fr: 'Autoriser l’analytique',
			},
			declineLabel: { en: 'No thanks', es: 'No, gracias', fr: 'Non merci' },
			description: {
				en: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
				es: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
				fr: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
			},
			enabled: true,
			privacyLabel: {
				en: 'Privacy details',
				es: 'Detalles de privacidad',
				fr: 'Détails sur la vie privée',
			},
			settingsLabel: {
				en: 'Analytics preferences',
				es: 'Preferencias de analítica',
				fr: 'Préférences d’analytique',
			},
			showBanner: true,
			title: {
				en: 'Can I count this visit?',
				es: '¿Puedo contar esta visita?',
				fr: 'Je peux compter cette visite?',
			},
		},
		backToProjects: {
			en: '← All Projects',
			es: '← Todos los proyectos',
			fr: '← Tous les projets',
		},
		blogEditionTemplate: {
			en: 'VOL. 01 // ISS. {issue}',
			es: 'VOL. 01 // NÚM. {issue}',
			fr: 'VOL. 01 // NO {issue}',
		},
		categoryPersonal: { en: 'Personal', es: 'Personal', fr: 'Perso' },
		categoryProfessional: {
			en: 'Professional',
			es: 'Profesional',
			fr: 'Professionnel',
		},
		copyrightTemplate: {
			en: '© {year} yesid',
			es: '© {year} yesid',
			fr: '© {year} yesid',
		},
		errorStatusNote: {
			en: '// requested path not in service',
			es: '// ruta solicitada fuera de servicio',
			fr: '// chemin demandé hors service',
		},
		languageNames: {
			en: { en: 'English', es: 'Inglés', fr: 'Anglais' },
			es: { en: 'Spanish', es: 'Español', fr: 'Espagnol' },
			fr: { en: 'French', es: 'Francés', fr: 'Français' },
		},
		markerFeatured: {
			en: '{num} / FEATURED',
			es: '{num} / DESTACADO',
			fr: '{num} / EN VEDETTE',
		},
		markerService: {
			en: '{num} / SERVICE',
			es: '{num} / SERVICIO',
			fr: '{num} / SERVICE',
		},
		metroCaption: {
			en: 'STM métro + REM',
			es: 'metro STM + REM',
			fr: 'métro STM + REM',
		},
		nounProject: { en: 'project', es: 'proyecto', fr: 'projet' },
		resultCount: {
			plural: {
				en: '{count} results',
				es: '{count} resultados',
				fr: '{count} résultats',
			},
			singular: {
				en: '{count} result',
				es: '{count} resultado',
				fr: '{count} résultat',
			},
		},
		stationsOneSystem: {
			en: '{count} stations · one system',
			es: '{count} estaciones · un solo sistema',
			fr: '{count} stations · un seul système',
		},
		terminalTitle: { en: 'terminal', es: 'terminal', fr: 'terminal' },
		watermarkPersonal: { en: 'Personal', es: 'Personal', fr: 'Perso' },
		watermarkProfessional: { en: 'Blog', es: 'Blog', fr: 'Blogue' },
	},
};
