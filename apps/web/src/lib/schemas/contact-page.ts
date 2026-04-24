// Contact-page schemas — runtime mirror of ContactContent + all nested
// terminal / form / validation / success types from $lib/types.
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
} from '$lib/types';

export const ContactTerminalFieldSchema = z.object({
	label: z.string(),
	placeholder: LocalizedStringSchema,
});

export const ContactInfoTerminalSchema = z.object({
	title: z.string(),
	command: z.string(),
	location: LocalizedStringSchema,
	responseTime: LocalizedStringSchema,
	sectionLabels: z.object({
		location: LocalizedStringSchema,
		connect: LocalizedStringSchema,
	}),
});

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
});

export const ContactValidationSchema = z.object({
	required: LocalizedStringSchema,
	invalidEmail: LocalizedStringSchema,
	errorSummary: LocalizedStringSchema,
});

export const ContactSuccessSchema = z.object({
	validating: LocalizedStringSchema,
	sending: LocalizedStringSchema,
	sent: LocalizedStringSchema,
	responseTime: LocalizedStringSchema,
	meanwhile: LocalizedStringSchema,
	resetLabel: LocalizedStringSchema,
	fieldOk: LocalizedStringSchema,
});

// `socials` is `readonly { label, href, icon }[]` in TS — use .readonly() so
// z.infer produces the same readonly marker for bidirectional drift detection.
const ContactSocialLinkSchema = z.object({
	label: z.string(),
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
});

// Drift detectors.
type _ContactTerminalFieldCheck = z.infer<typeof ContactTerminalFieldSchema> extends ContactTerminalField
	? ContactTerminalField extends z.infer<typeof ContactTerminalFieldSchema>
		? true
		: false
	: false;
const _contactTerminalFieldCheck: _ContactTerminalFieldCheck = true;
void _contactTerminalFieldCheck;

type _ContactInfoTerminalCheck = z.infer<typeof ContactInfoTerminalSchema> extends ContactInfoTerminal
	? ContactInfoTerminal extends z.infer<typeof ContactInfoTerminalSchema>
		? true
		: false
	: false;
const _contactInfoTerminalCheck: _ContactInfoTerminalCheck = true;
void _contactInfoTerminalCheck;

type _ContactFormTerminalCheck = z.infer<typeof ContactFormTerminalSchema> extends ContactFormTerminal
	? ContactFormTerminal extends z.infer<typeof ContactFormTerminalSchema>
		? true
		: false
	: false;
const _contactFormTerminalCheck: _ContactFormTerminalCheck = true;
void _contactFormTerminalCheck;

type _ContactValidationCheck = z.infer<typeof ContactValidationSchema> extends ContactValidation
	? ContactValidation extends z.infer<typeof ContactValidationSchema>
		? true
		: false
	: false;
const _contactValidationCheck: _ContactValidationCheck = true;
void _contactValidationCheck;

type _ContactSuccessCheck = z.infer<typeof ContactSuccessSchema> extends ContactSuccess
	? ContactSuccess extends z.infer<typeof ContactSuccessSchema>
		? true
		: false
	: false;
const _contactSuccessCheck: _ContactSuccessCheck = true;
void _contactSuccessCheck;

type _ContactContentCheck = z.infer<typeof ContactContentSchema> extends ContactContent
	? ContactContent extends z.infer<typeof ContactContentSchema>
		? true
		: false
	: false;
const _contactContentCheck: _ContactContentCheck = true;
void _contactContentCheck;
