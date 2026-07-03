// Contact-page schemas — runtime mirror of ContactContent + all nested
// terminal / form / validation / success types from types/content.
// Relocated from apps/web/src/lib/schemas/ to @repo/shared/schemas
// in slice-18i Task 1.1 Phase B.
// `meta` uses the shared PageMetaSchema (same shape as about-page + tech-stack-page).

import { z } from 'zod';
import { LocalizedStringSchema, PageMetaSchema } from './shared';
import type {
	ContactContent,
	ContactTerminalField,
	ContactInfoTerminal,
	ContactFormTerminal,
	ContactValidation,
	ContactSuccess,
} from '../types/content';

export const ContactTerminalFieldSchema = z.object({
	label: LocalizedStringSchema,
	placeholder: LocalizedStringSchema,
}) satisfies z.ZodType<ContactTerminalField>;

export const ContactInfoTerminalSchema = z.object({
	title: z.string(),
	command: z.string(),
	location: LocalizedStringSchema,
	responseTime: LocalizedStringSchema,
	languages: LocalizedStringSchema,
	sectionLabels: z.object({
		location: LocalizedStringSchema,
		connect: LocalizedStringSchema,
		languages: LocalizedStringSchema,
	}),
}) satisfies z.ZodType<ContactInfoTerminal>;

export const ContactFormTerminalSchema = z.object({
	title: z.string(),
	command: z.string(),
	commandOutput: LocalizedStringSchema,
	fields: z.object({
		name: ContactTerminalFieldSchema,
		email: ContactTerminalFieldSchema,
		message: ContactTerminalFieldSchema,
	}),
	submitLabel: LocalizedStringSchema,
	bookingPrompt: LocalizedStringSchema,
	bookingButtonLabel: LocalizedStringSchema,
}) satisfies z.ZodType<ContactFormTerminal>;

export const ContactValidationSchema = z.object({
	required: LocalizedStringSchema,
	invalidEmail: LocalizedStringSchema,
	errorSummary: LocalizedStringSchema,
}) satisfies z.ZodType<ContactValidation>;

export const ContactSuccessSchema = z.object({
	validating: LocalizedStringSchema,
	sending: LocalizedStringSchema,
	sent: LocalizedStringSchema,
	responseTime: LocalizedStringSchema,
	meanwhile: LocalizedStringSchema,
	resetLabel: LocalizedStringSchema,
	fieldOk: LocalizedStringSchema,
	workLinkLabel: LocalizedStringSchema,
	blogLinkLabel: LocalizedStringSchema,
}) satisfies z.ZodType<ContactSuccess>;

// `socials` is `readonly { label, href, icon }[]` in TS — use .readonly() so
// z.infer produces the same readonly marker for bidirectional drift detection.
// Exported so consumers can import the primitive shape directly.
export const ContactSocialLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	icon: z.string(),
});

export const ContactContentSchema = z.object({
	pageTitle: LocalizedStringSchema,
	stationLabel: LocalizedStringSchema,
	sendErrorMessage: LocalizedStringSchema,
	meta: PageMetaSchema,
	infoTerminal: ContactInfoTerminalSchema,
	formTerminal: ContactFormTerminalSchema,
	validation: ContactValidationSchema,
	success: ContactSuccessSchema,
	socials: z.array(ContactSocialLinkSchema).readonly(),
	web3formsKey: z.string(),
}) satisfies z.ZodType<ContactContent>;
