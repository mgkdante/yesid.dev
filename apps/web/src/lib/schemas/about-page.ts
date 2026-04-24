// About-page schemas — runtime mirror of AboutContent + its 13 nested
// interfaces from $lib/types. Largest single schema module in this slice.
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
	AboutWeatherConfig,
	AboutClientLogo,
	AboutCta,
	AboutStopLabels,
	AboutLabels,
	TechCategory,
} from '$lib/types';

export const TechCategorySchema = z.enum(['databases', 'languages', 'tools', 'frameworks']);

export const AboutPolaroidSchema = z.object({
	src: z.string(),
	alt: LocalizedStringSchema,
	caption: LocalizedStringSchema,
	rotate: z.number(),
});

export const AboutIdentitySchema = z.object({
	name: LocalizedStringSchema,
	title: LocalizedStringSchema,
	valueProp: LocalizedStringSchema,
	headshot: z.string(),
	polaroids: z.array(AboutPolaroidSchema).readonly(),
});

export const AboutMetricSchema = z.object({
	value: z.string(),
	label: LocalizedStringSchema,
	icon: z.string().optional(),
});

export const AboutMethodStepSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	description: LocalizedStringSchema,
	station: z.number(),
});

export const AboutTestimonialSchema = z.object({
	quote: LocalizedStringSchema,
	author: z.string(),
	role: LocalizedStringSchema,
	company: z.string(),
	logo: z.string().optional(),
});

export const AboutTechItemSchema = z.object({
	name: z.string(),
	category: TechCategorySchema,
	relatedServices: z.array(z.string()).readonly(),
});

export const AboutInterestSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	image: z.string(),
});

export const AboutWeatherConfigSchema = z.object({
	city: LocalizedStringSchema,
	hook: LocalizedStringSchema,
	enabled: z.boolean(),
});

export const AboutClientLogoSchema = z.object({
	name: z.string(),
	src: z.string(),
	url: z.string().optional(),
});

// AboutCta.lines uses a narrow color union, mirrored as z.enum.
const AboutCtaLineSchema = z.object({
	text: z.string(),
	color: z.enum(['orange', 'muted', 'accent']),
});

// Shared social-link shape (AboutCta.socials + ContactContent.socials both
// use `{ label, href, icon }` with readonly wrapping).
const AboutSocialLinkSchema = z.object({
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
});

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
});

export const AboutLabelsSchema = z.object({
	clientsServed: LocalizedStringSchema,
	polaroidPrevAria: LocalizedStringSchema,
	polaroidNextAria: LocalizedStringSchema,
	testimonialsCarouselAria: LocalizedStringSchema,
	testimonialsTabNavAria: LocalizedStringSchema,
	testimonialSlideAria: LocalizedStringSchema,
	showTestimonialAria: LocalizedStringSchema,
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

// Drift detectors — one per exported schema + TechCategory enum.
type _TechCategoryCheck = z.infer<typeof TechCategorySchema> extends TechCategory
	? TechCategory extends z.infer<typeof TechCategorySchema>
		? true
		: false
	: false;
const _techCategoryCheck: _TechCategoryCheck = true;
void _techCategoryCheck;

type _AboutPolaroidCheck = z.infer<typeof AboutPolaroidSchema> extends AboutPolaroid
	? AboutPolaroid extends z.infer<typeof AboutPolaroidSchema>
		? true
		: false
	: false;
const _aboutPolaroidCheck: _AboutPolaroidCheck = true;
void _aboutPolaroidCheck;

type _AboutIdentityCheck = z.infer<typeof AboutIdentitySchema> extends AboutIdentity
	? AboutIdentity extends z.infer<typeof AboutIdentitySchema>
		? true
		: false
	: false;
const _aboutIdentityCheck: _AboutIdentityCheck = true;
void _aboutIdentityCheck;

type _AboutMetricCheck = z.infer<typeof AboutMetricSchema> extends AboutMetric
	? AboutMetric extends z.infer<typeof AboutMetricSchema>
		? true
		: false
	: false;
const _aboutMetricCheck: _AboutMetricCheck = true;
void _aboutMetricCheck;

type _AboutMethodStepCheck = z.infer<typeof AboutMethodStepSchema> extends AboutMethodStep
	? AboutMethodStep extends z.infer<typeof AboutMethodStepSchema>
		? true
		: false
	: false;
const _aboutMethodStepCheck: _AboutMethodStepCheck = true;
void _aboutMethodStepCheck;

type _AboutTestimonialCheck = z.infer<typeof AboutTestimonialSchema> extends AboutTestimonial
	? AboutTestimonial extends z.infer<typeof AboutTestimonialSchema>
		? true
		: false
	: false;
const _aboutTestimonialCheck: _AboutTestimonialCheck = true;
void _aboutTestimonialCheck;

type _AboutTechItemCheck = z.infer<typeof AboutTechItemSchema> extends AboutTechItem
	? AboutTechItem extends z.infer<typeof AboutTechItemSchema>
		? true
		: false
	: false;
const _aboutTechItemCheck: _AboutTechItemCheck = true;
void _aboutTechItemCheck;

type _AboutInterestCheck = z.infer<typeof AboutInterestSchema> extends AboutInterest
	? AboutInterest extends z.infer<typeof AboutInterestSchema>
		? true
		: false
	: false;
const _aboutInterestCheck: _AboutInterestCheck = true;
void _aboutInterestCheck;

type _AboutWeatherConfigCheck = z.infer<typeof AboutWeatherConfigSchema> extends AboutWeatherConfig
	? AboutWeatherConfig extends z.infer<typeof AboutWeatherConfigSchema>
		? true
		: false
	: false;
const _aboutWeatherConfigCheck: _AboutWeatherConfigCheck = true;
void _aboutWeatherConfigCheck;

type _AboutClientLogoCheck = z.infer<typeof AboutClientLogoSchema> extends AboutClientLogo
	? AboutClientLogo extends z.infer<typeof AboutClientLogoSchema>
		? true
		: false
	: false;
const _aboutClientLogoCheck: _AboutClientLogoCheck = true;
void _aboutClientLogoCheck;

type _AboutCtaCheck = z.infer<typeof AboutCtaSchema> extends AboutCta
	? AboutCta extends z.infer<typeof AboutCtaSchema>
		? true
		: false
	: false;
const _aboutCtaCheck: _AboutCtaCheck = true;
void _aboutCtaCheck;

type _AboutStopLabelsCheck = z.infer<typeof AboutStopLabelsSchema> extends AboutStopLabels
	? AboutStopLabels extends z.infer<typeof AboutStopLabelsSchema>
		? true
		: false
	: false;
const _aboutStopLabelsCheck: _AboutStopLabelsCheck = true;
void _aboutStopLabelsCheck;

type _AboutLabelsCheck = z.infer<typeof AboutLabelsSchema> extends AboutLabels
	? AboutLabels extends z.infer<typeof AboutLabelsSchema>
		? true
		: false
	: false;
const _aboutLabelsCheck: _AboutLabelsCheck = true;
void _aboutLabelsCheck;

type _AboutContentCheck = z.infer<typeof AboutContentSchema> extends AboutContent
	? AboutContent extends z.infer<typeof AboutContentSchema>
		? true
		: false
	: false;
const _aboutContentCheck: _AboutContentCheck = true;
void _aboutContentCheck;
