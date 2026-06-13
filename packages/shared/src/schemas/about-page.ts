// About-page schemas — runtime mirror of AboutContent + its 13 nested
// interfaces from types/content. Relocated from apps/web/src/lib/schemas/
// to @repo/shared/schemas in slice-18i Task 1.1 Phase B.
// `meta` uses shared PageMetaSchema; `socials` shape matches contact-page.

import { z } from 'zod';
import { LocalizedStringSchema, PageMetaSchema } from './shared';
import type {
	AboutContent,
	AboutPolaroid,
	AboutIdentity,
	AboutMetric,
	AboutMethodStep,
	AboutTestimonial,
	AboutTechItem,
	AboutInterest,
	AboutEducationItem,
	AboutWeatherConfig,
	AboutClientLogo,
	AboutCta,
	AboutStopLabels,
	AboutLabels,
	TechCategory,
} from '../types/content';

export const TechCategorySchema = z.enum(['databases', 'languages', 'tools', 'frameworks']);

export const AboutPolaroidSchema = z.object({
	src: z.string(),
	alt: LocalizedStringSchema,
	caption: LocalizedStringSchema,
	rotate: z.number(),
}) satisfies z.ZodType<AboutPolaroid>;

export const AboutIdentitySchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	valueProp: LocalizedStringSchema,
	headshot: z.string(),
	polaroids: z.array(AboutPolaroidSchema).readonly(),
}) satisfies z.ZodType<AboutIdentity>;

export const AboutMetricSchema = z.object({
	value: z.string(),
	label: LocalizedStringSchema,
	icon: z.string().optional(),
}) satisfies z.ZodType<AboutMetric>;

export const AboutMethodStepSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	description: LocalizedStringSchema,
	station: z.number(),
}) satisfies z.ZodType<AboutMethodStep>;

export const AboutTestimonialSchema = z.object({
	quote: LocalizedStringSchema,
	author: z.string(),
	role: LocalizedStringSchema,
	company: z.string(),
	logo: z.string().optional(),
}) satisfies z.ZodType<AboutTestimonial>;

export const AboutTechItemSchema = z.object({
	name: z.string(),
	category: TechCategorySchema,
	relatedServices: z.array(z.string()).readonly(),
}) satisfies z.ZodType<AboutTechItem>;

export const AboutInterestSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	image: z.string(),
}) satisfies z.ZodType<AboutInterest>;

export const AboutEducationItemSchema = z.object({
	school: LocalizedStringSchema,
	program: LocalizedStringSchema,
	icon: z.enum(['champlain', 'bishops']),
}) satisfies z.ZodType<AboutEducationItem>;

export const AboutWeatherConfigSchema = z.object({
	city: LocalizedStringSchema,
	hook: LocalizedStringSchema,
	enabled: z.boolean(),
}) satisfies z.ZodType<AboutWeatherConfig>;

export const AboutClientLogoSchema = z.object({
	name: z.string(),
	src: z.string(),
	url: z.string().optional(),
}) satisfies z.ZodType<AboutClientLogo>;

// AboutCta.lines uses a narrow color union, mirrored as z.enum.
const AboutCtaLineSchema = z.object({
	text: z.string(),
	color: z.enum(['orange', 'muted', 'accent']),
});

// Shared social-link shape (AboutCta.socials + ContactContent.socials both
// use `{ label, href, icon }` with readonly wrapping). Exported so consumers
// can import the primitive shape directly without re-deriving it.
export const AboutSocialLinkSchema = z.object({
	label: z.string(),
	href: z.string(),
	icon: z.string(),
});

export const AboutCtaSchema = z.object({
	command: z.string(),
	lines: z.array(AboutCtaLineSchema).readonly(),
	buttonLabel: LocalizedStringSchema,
	buttonHref: z.string(),
	availability: LocalizedStringSchema,
	socials: z.array(AboutSocialLinkSchema).readonly(),
}) satisfies z.ZodType<AboutCta>;

export const AboutStopLabelsSchema = z.object({
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
}) satisfies z.ZodType<AboutStopLabels>;

export const AboutLabelsSchema = z.object({
	clientsServed: LocalizedStringSchema,
	polaroidPrevAria: LocalizedStringSchema,
	polaroidNextAria: LocalizedStringSchema,
	testimonialsCarouselAria: LocalizedStringSchema,
	testimonialsTabNavAria: LocalizedStringSchema,
	testimonialSlideAria: LocalizedStringSchema,
	showTestimonialAria: LocalizedStringSchema,
}) satisfies z.ZodType<AboutLabels>;

export const AboutContentSchema = z.object({
	identity: AboutIdentitySchema,
	metrics: z.array(AboutMetricSchema).readonly(),
	methodology: z.array(AboutMethodStepSchema).readonly(),
	testimonials: z.array(AboutTestimonialSchema).readonly(),
	languages: z.array(z.string()).readonly(),
	education: z.array(AboutEducationItemSchema).readonly(),
	techStack: z.array(AboutTechItemSchema).readonly(),
	interests: z.array(AboutInterestSchema).readonly(),
	weather: AboutWeatherConfigSchema,
	clientLogos: z.array(AboutClientLogoSchema).readonly(),
	clientCount: z.number(),
	cta: AboutCtaSchema,
	stopLabels: AboutStopLabelsSchema,
	labels: AboutLabelsSchema,
	meta: PageMetaSchema,
}) satisfies z.ZodType<AboutContent>;

// Drift detector for TechCategory enum.
type _TechCategoryCheck = z.infer<typeof TechCategorySchema> extends TechCategory
	? TechCategory extends z.infer<typeof TechCategorySchema>
		? true
		: false
	: false;
const _techCategoryCheck: _TechCategoryCheck = true;
void _techCategoryCheck;
