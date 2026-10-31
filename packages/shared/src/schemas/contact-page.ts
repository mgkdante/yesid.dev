import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const ContactTerminalFieldSchema = z.object({
	label: LocalizedStringSchema,
	placeholder: LocalizedStringSchema,
});

export const ContactInfoTerminalSchema = z.object({
	title: z.string(),
	command: z.string(),
	location: LocalizedStringSchema,
	responseTime: LocalizedStringSchema,
	languages: LocalizedStringSchema,
	bestFit: z.array(LocalizedStringSchema).readonly().optional(),
	sectionLabels: z.object({
		location: LocalizedStringSchema,
		connect: LocalizedStringSchema,
		languages: LocalizedStringSchema,
		bestFit: LocalizedStringSchema.optional(),
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
	bookingPrompt: LocalizedStringSchema,
	bookingButtonLabel: LocalizedStringSchema,
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
	/** Used as the OK suffix in the field-status message. */
	fieldOk: LocalizedStringSchema,
	workLinkLabel: LocalizedStringSchema,
	blogLinkLabel: LocalizedStringSchema,
});

export const ContactSocialLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	icon: z.string(),
});

export const ContactContentSchema = z.object({
	pageTitle: LocalizedStringSchema,
	stationLabel: LocalizedStringSchema,
	sendErrorMessage: LocalizedStringSchema,
	infoTerminal: ContactInfoTerminalSchema,
	formTerminal: ContactFormTerminalSchema,
	validation: ContactValidationSchema,
	success: ContactSuccessSchema,
	socials: z.array(ContactSocialLinkSchema).readonly(),
	/** Public access key; safe to expose client-side. */
	web3formsKey: z.string(),
});

export type ContactTerminalField = z.infer<typeof ContactTerminalFieldSchema>;
export type ContactInfoTerminal = z.infer<typeof ContactInfoTerminalSchema>;
export type ContactFormTerminal = z.infer<typeof ContactFormTerminalSchema>;
export type ContactValidation = z.infer<typeof ContactValidationSchema>;
export type ContactSuccess = z.infer<typeof ContactSuccessSchema>;
export type ContactContent = z.infer<typeof ContactContentSchema>;
