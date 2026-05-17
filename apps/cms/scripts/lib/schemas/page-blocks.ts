/**
 * Page-block content schemas.
 *
 * Mirrors `packages/shared/src/schemas/*.ts`. Defined locally (not imported
 * from @repo/shared) because @repo/shared is on Zod 4.x while apps/cms is
 * on Zod 3.x — sharing schema instances across majors fails at runtime.
 */

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

// ---------------------------------------------------------------------------
// Simple page chrome (covered in D1).
// ---------------------------------------------------------------------------

export const BlogPageContentSchema = z.object({
	intro: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	backToDispatches: LocalizedStringSchema,
	backToPersonal: LocalizedStringSchema,
});

export const ProjectsPageContentSchema = z.object({
	intro: LocalizedStringSchema,
});

// ---------------------------------------------------------------------------
// Page meta — reused across about, contact, tech-stack pages.
// ---------------------------------------------------------------------------

const PageMetaSchema = z.object({
	title: LocalizedStringSchema,
	description: LocalizedStringSchema,
});

// ---------------------------------------------------------------------------
// Tech-stack page (D2).
// ---------------------------------------------------------------------------

const TechStackHeroStatsSchema = z.object({
	technologies: LocalizedStringSchema,
});

export const TechStackPageContentSchema = z.object({
	meta: PageMetaSchema,
	hero: z.object({
		overline: LocalizedStringSchema,
		titleLine1: LocalizedStringSchema,
		titleLine2: LocalizedStringSchema,
		terminalAria: LocalizedStringSchema,
		stats: TechStackHeroStatsSchema,
	}),
	actions: z.object({
		getInTouch: LocalizedStringSchema,
		viewServices: LocalizedStringSchema,
	}),
	cta: z.object({
		headingLine1: LocalizedStringSchema,
		headingLine2: LocalizedStringSchema,
		sub: LocalizedStringSchema,
		availability: LocalizedStringSchema,
	}),
});

// ---------------------------------------------------------------------------
// Contact page (D2).
// ---------------------------------------------------------------------------

const ContactTerminalFieldSchema = z.object({
	label: z.string(),
	placeholder: LocalizedStringSchema,
});

export const ContactContentSchema = z.object({
	pageTitle: LocalizedStringSchema,
	stationLabel: LocalizedStringSchema,
	sendErrorMessage: LocalizedStringSchema,
	meta: PageMetaSchema,
	infoTerminal: z.object({
		title: z.string(),
		command: z.string(),
		location: LocalizedStringSchema,
		responseTime: LocalizedStringSchema,
		sectionLabels: z.object({
			location: LocalizedStringSchema,
			connect: LocalizedStringSchema,
		}),
	}),
	formTerminal: z.object({
		title: z.string(),
		command: z.string(),
		commandOutput: LocalizedStringSchema,
		fields: z.object({
			name: ContactTerminalFieldSchema,
			email: ContactTerminalFieldSchema,
			message: ContactTerminalFieldSchema,
		}),
		submitLabel: LocalizedStringSchema,
	}),
	validation: z.object({
		required: LocalizedStringSchema,
		invalidEmail: LocalizedStringSchema,
		errorSummary: LocalizedStringSchema,
	}),
	success: z.object({
		validating: LocalizedStringSchema,
		sending: LocalizedStringSchema,
		sent: LocalizedStringSchema,
		responseTime: LocalizedStringSchema,
		meanwhile: LocalizedStringSchema,
		resetLabel: LocalizedStringSchema,
		fieldOk: LocalizedStringSchema,
	}),
	socials: z
		.array(
			z.object({
				label: z.string(),
				href: z.string(),
				icon: z.string(),
			}),
		)
		.readonly(),
	web3formsKey: z.string(),
});

// ---------------------------------------------------------------------------
// Home page blocks (D3) — 7 blocks under pages('home').
// ---------------------------------------------------------------------------

export const HeroAnimContentSchema = z.object({
	scrollDown: LocalizedStringSchema,
});

export const HeroContentSchema = z.object({
	headline: z.object({
		line1: LocalizedStringSchema,
		line2: LocalizedStringSchema,
		ariaSuffix: LocalizedStringSchema,
	}),
	subheadline: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	ctaWork: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	sqlPanel: z.object({
		prompt: LocalizedStringSchema,
		liveLabel: LocalizedStringSchema,
		columns: z.object({
			route: LocalizedStringSchema,
			avgDelayS: LocalizedStringSchema,
			vehicles: LocalizedStringSchema,
		}),
		metaTemplate: LocalizedStringSchema,
	}),
	refreshButton: z.object({
		label: LocalizedStringSchema,
		helper: LocalizedStringSchema,
	}),
	heroAnim: HeroAnimContentSchema,
});

export const ManifestoContentSchema = z.object({
	statement: z.object({
		line1: LocalizedStringSchema,
		lineHuge: LocalizedStringSchema,
		line3Part1: LocalizedStringSchema,
		line3Highlight: LocalizedStringSchema,
		line3Part2: LocalizedStringSchema,
	}),
	terminal: z.object({
		user: LocalizedStringSchema,
		command: LocalizedStringSchema,
	}),
	pills: z
		.array(
			z.object({
				label: LocalizedStringSchema,
				serviceId: z.string(),
			}),
		)
		.readonly(),
	edgeLeft: z.object({
		sectionNumber: LocalizedStringSchema,
		sectionName: LocalizedStringSchema,
		location: LocalizedStringSchema,
	}),
	edgeRight: z.object({
		lat: LocalizedStringSchema,
		lng: LocalizedStringSchema,
		src: LocalizedStringSchema,
		via: LocalizedStringSchema,
		dst: LocalizedStringSchema,
		node: LocalizedStringSchema,
		status: LocalizedStringSchema,
	}),
	edgeBottom: z.object({
		connected: LocalizedStringSchema,
		line: LocalizedStringSchema,
		url: LocalizedStringSchema,
		version: LocalizedStringSchema,
		scrollHint: LocalizedStringSchema,
	}),
	transit: z.object({
		arrivalLabel: LocalizedStringSchema,
		platformBadge: LocalizedStringSchema,
		directionBadge: LocalizedStringSchema,
	}),
	ticks: z.array(z.string()).readonly(),
	hiddenTransitLines: z
		.array(
			z.object({
				name: LocalizedStringSchema,
				color: z.string(),
			}),
		)
		.readonly(),
});

export const ProofReelContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	sectionLabel: LocalizedStringSchema,
	viewAllLabel: LocalizedStringSchema,
	viewAllHref: z.string(),
	toggleColorAria: LocalizedStringSchema,
	slugs: z.array(z.string()).readonly(),
	images: z.record(z.string(), z.string()),
});

export const ServicesGridContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	viewIllustrationAria: LocalizedStringSchema,
	viewAllLink: LocalizedStringSchema,
});

export const AboutIntroContentSchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	bio: LocalizedStringSchema,
	moreLink: LocalizedStringSchema,
	stackLabel: LocalizedStringSchema,
	stackItems: z.array(z.string()).readonly(),
	locationLabel: LocalizedStringSchema,
	location: z.object({
		city: LocalizedStringSchema,
		region: LocalizedStringSchema,
	}),
	interestsLabel: LocalizedStringSchema,
	interests: LocalizedStringSchema,
});

export const CtaContentSchema = z.object({
	heading: LocalizedStringSchema,
	subtitle: LocalizedStringSchema,
	ctaContact: LocalizedStringSchema,
	ctaGithub: LocalizedStringSchema,
});

export const CloserContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
	cta: z.object({
		label: LocalizedStringSchema,
		href: z.string(),
	}),
	rows: z.object({
		contact: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		connect: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		read: z.object({
			label: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		about: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
	}),
	attribution: z.object({
		text: LocalizedStringSchema,
		url: z.string(),
	}),
	terminal: z.object({
		title: LocalizedStringSchema,
		city: LocalizedStringSchema,
		encoding: LocalizedStringSchema,
		destinationsLabel: LocalizedStringSchema,
		prompt: LocalizedStringSchema,
	}),
});

// ---------------------------------------------------------------------------
// About page (D4).
// ---------------------------------------------------------------------------

const TechCategorySchema = z.enum(['databases', 'languages', 'tools', 'frameworks']);

const AboutPolaroidSchema = z.object({
	src: z.string(),
	alt: LocalizedStringSchema,
	caption: LocalizedStringSchema,
	rotate: z.number(),
});

const AboutMetricSchema = z.object({
	value: z.string(),
	label: LocalizedStringSchema,
	icon: z.string().optional(),
});

const AboutMethodStepSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	description: LocalizedStringSchema,
	station: z.number(),
});

const AboutTestimonialSchema = z.object({
	quote: LocalizedStringSchema,
	author: z.string(),
	role: LocalizedStringSchema,
	company: z.string(),
	logo: z.string().optional(),
});

const AboutTechItemSchema = z.object({
	name: z.string(),
	category: TechCategorySchema,
	relatedServices: z.array(z.string()).readonly(),
});

const AboutInterestSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	image: z.string(),
});

const AboutWeatherConfigSchema = z.object({
	city: LocalizedStringSchema,
	hook: LocalizedStringSchema,
	enabled: z.boolean(),
});

const AboutClientLogoSchema = z.object({
	name: z.string(),
	src: z.string(),
	url: z.string().optional(),
});

const AboutCtaLineSchema = z.object({
	text: z.string(),
	color: z.enum(['orange', 'muted', 'accent']),
});

const AboutSocialLinkSchema = z.object({
	label: z.string(),
	href: z.string(),
	icon: z.string(),
});

const AboutCtaSchema = z.object({
	command: z.string(),
	lines: z.array(AboutCtaLineSchema).readonly(),
	buttonLabel: LocalizedStringSchema,
	buttonHref: z.string(),
	availability: LocalizedStringSchema,
	socials: z.array(AboutSocialLinkSchema).readonly(),
});

const AboutStopLabelsSchema = z.object({
	identity: LocalizedStringSchema,
	metrics: LocalizedStringSchema,
	testimonials: LocalizedStringSchema,
	process: LocalizedStringSchema,
	stack: LocalizedStringSchema,
	clients: LocalizedStringSchema,
	interests: LocalizedStringSchema,
	snapshots: LocalizedStringSchema,
	location: LocalizedStringSchema,
	next: LocalizedStringSchema,
});

const AboutLabelsSchema = z.object({
	clientsServed: LocalizedStringSchema,
	polaroidPrevAria: LocalizedStringSchema,
	polaroidNextAria: LocalizedStringSchema,
	testimonialsCarouselAria: LocalizedStringSchema,
	testimonialsTabNavAria: LocalizedStringSchema,
	testimonialSlideAria: LocalizedStringSchema,
	showTestimonialAria: LocalizedStringSchema,
});

const AboutIdentitySchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	valueProp: LocalizedStringSchema,
	headshot: z.string(),
	polaroids: z.array(AboutPolaroidSchema).readonly(),
});

export const AboutContentSchema = z.object({
	identity: AboutIdentitySchema,
	metrics: z.array(AboutMetricSchema).readonly(),
	methodology: z.array(AboutMethodStepSchema).readonly(),
	testimonials: z.array(AboutTestimonialSchema).readonly(),
	techStack: z.array(AboutTechItemSchema).readonly(),
	interests: z.array(AboutInterestSchema).readonly(),
	weather: AboutWeatherConfigSchema,
	clientLogos: z.array(AboutClientLogoSchema).readonly(),
	clientCount: z.number(),
	cta: AboutCtaSchema,
	stopLabels: AboutStopLabelsSchema,
	labels: AboutLabelsSchema,
	meta: PageMetaSchema,
});

// ---------------------------------------------------------------------------
// Type exports.
// ---------------------------------------------------------------------------

export type BlogPageContent = z.infer<typeof BlogPageContentSchema>;
export type ProjectsPageContent = z.infer<typeof ProjectsPageContentSchema>;
export type TechStackPageContent = z.infer<typeof TechStackPageContentSchema>;
export type ContactContent = z.infer<typeof ContactContentSchema>;
export type HeroAnimContent = z.infer<typeof HeroAnimContentSchema>;
export type HeroContent = z.infer<typeof HeroContentSchema>;
export type ManifestoContent = z.infer<typeof ManifestoContentSchema>;
export type ProofReelContent = z.infer<typeof ProofReelContentSchema>;
export type ServicesGridContent = z.infer<typeof ServicesGridContentSchema>;
export type AboutIntroContent = z.infer<typeof AboutIntroContentSchema>;
export type CtaContent = z.infer<typeof CtaContentSchema>;
export type CloserContent = z.infer<typeof CloserContentSchema>;
export type AboutContent = z.infer<typeof AboutContentSchema>;
