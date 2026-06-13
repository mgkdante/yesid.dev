// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// /contact page content (terminals, validation, success states).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { ContactContent } from '$lib/types';

export const contactContent: ContactContent = {
	formTerminal: {
		command: '$ yesid --contact',
		commandOutput: { en: 'Opening contact form...' },
		fields: {
			email: {
				label: 'email',
				placeholder: { en: 'you@company.com' },
			},
			message: {
				label: 'message',
				placeholder: { en: 'Tell me about your project...' },
			},
			name: {
				label: 'name',
				placeholder: { en: 'Your name' },
			},
		},
		submitLabel: { en: 'send --message →' },
		title: 'yesid@mtl ~ /contact',
	},
	infoTerminal: {
		command: '$ yesid --info',
		location: { en: 'Montreal, QC, Canada' },
		responseTime: { en: '~24h response time' },
		sectionLabels: {
			connect: { en: 'CONNECT' },
			location: { en: 'LOCATION' },
		},
		title: 'yesid@mtl ~ /info',
	},
	meta: {
		description: {
			en: 'Get in touch for freelance digital infrastructure — databases, pipelines, dashboards, and websites. Montreal, ~24h response time.',
		},
		title: { en: 'Contact — yesid.' },
	},
	pageTitle: { en: 'Contact' },
	sendErrorMessage: { en: 'Failed to send message. Please try again.' },
	socials: [
		{
			href: 'mailto:contact@yesid.dev',
			icon: 'email',
			label: 'Email',
		},
		{
			href: 'https://github.com/mgkdante',
			icon: 'github',
			label: 'GitHub',
		},
		{
			href: 'https://www.linkedin.com/in/otaloray/',
			icon: 'linkedin',
			label: 'LinkedIn',
		},
	],
	stationLabel: { en: 'NEXT STOP: YOU' },
	success: {
		fieldOk: { en: 'OK' },
		meanwhile: { en: 'Meanwhile, check out my {work} or {blog}' },
		resetLabel: { en: 'reset --form' },
		responseTime: { en: 'I\'ll get back to you within 24h' },
		sending: { en: 'Sending message...' },
		sent: { en: 'Message sent successfully!' },
		validating: { en: 'Validating fields...' },
	},
	validation: {
		errorSummary: { en: '{count} errors — fix and retry' },
		invalidEmail: { en: 'invalid — enter a valid email address' },
		required: { en: 'required — {field} cannot be empty' },
	},
	web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'contact-page'.
export * from './contact-page.companion';
