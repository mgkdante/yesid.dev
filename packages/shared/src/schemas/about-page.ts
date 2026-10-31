import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const AboutPolaroidSchema = z.object({
	src: z.string(),
	alt: LocalizedStringSchema,
	caption: LocalizedStringSchema,
	/** Degrees of tilt for the stacked polaroid layout. */
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
	/** Display string allowing formats such as 12+, 3x, or 99%. */
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

export const AboutLanguageSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	image: z.string(),
});

export const AboutInterestSchema = z.object({
	id: z.string(),
	label: LocalizedStringSchema,
	image: z.string(),
});

export const AboutEducationItemSchema = z.object({
	school: LocalizedStringSchema,
	program: LocalizedStringSchema,
	icon: z.enum(['champlain', 'bishops']),
});

export const AboutWeatherConfigSchema = z.object({
	city: LocalizedStringSchema,
	enabled: z.boolean(),
});

const AboutCtaLineSchema = z.object({
	text: z.string(),
	color: z.enum(['orange', 'muted', 'accent']),
});

export const AboutCtaSchema = z.object({
	command: z.string(),
	lines: z.array(AboutCtaLineSchema).readonly(),
	buttonLabel: LocalizedStringSchema,
	buttonHref: z.string(),
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
	polaroidPrevAria: LocalizedStringSchema,
	polaroidNextAria: LocalizedStringSchema,
	testimonialsCarouselAria: LocalizedStringSchema,
	testimonialsTabNavAria: LocalizedStringSchema,
	testimonialsPrevAria: LocalizedStringSchema,
	testimonialsNextAria: LocalizedStringSchema,
	/** Template placeholders: {index} and {total}. */
	testimonialSlideAria: LocalizedStringSchema,
	/** Template placeholder: {index}. */
	showTestimonialAria: LocalizedStringSchema,
});

export const AboutContentSchema = z.object({
	identity: AboutIdentitySchema,
	metrics: z.array(AboutMetricSchema).readonly(),
	methodology: z.array(AboutMethodStepSchema).readonly(),
	testimonials: z.array(AboutTestimonialSchema).readonly(),
	languages: z.array(AboutLanguageSchema).readonly(),
	education: z.array(AboutEducationItemSchema).readonly(),
	interests: z.array(AboutInterestSchema).readonly(),
	weather: AboutWeatherConfigSchema,
	cta: AboutCtaSchema,
	stopLabels: AboutStopLabelsSchema,
	labels: AboutLabelsSchema,
});

export type AboutPolaroid = z.infer<typeof AboutPolaroidSchema>;
export type AboutIdentity = z.infer<typeof AboutIdentitySchema>;
export type AboutMetric = z.infer<typeof AboutMetricSchema>;
export type AboutMethodStep = z.infer<typeof AboutMethodStepSchema>;
export type AboutTestimonial = z.infer<typeof AboutTestimonialSchema>;
export type AboutLanguage = z.infer<typeof AboutLanguageSchema>;
export type AboutInterest = z.infer<typeof AboutInterestSchema>;
export type AboutEducationItem = z.infer<typeof AboutEducationItemSchema>;
export type AboutWeatherConfig = z.infer<typeof AboutWeatherConfigSchema>;
export type AboutCta = z.infer<typeof AboutCtaSchema>;
export type AboutStopLabels = z.infer<typeof AboutStopLabelsSchema>;
export type AboutLabels = z.infer<typeof AboutLabelsSchema>;
export type AboutContent = z.infer<typeof AboutContentSchema>;
