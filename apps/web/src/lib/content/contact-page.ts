import type { ContactContent } from '$lib/types';
import { siteMeta } from './meta.js';

export const contactContent: ContactContent = {
	pageTitle: { en: 'Contact' },
	stationLabel: { en: 'NEXT STOP: YOU' },
	sendErrorMessage: { en: 'Failed to send message. Please try again.' },

	// HTML <title> + <meta description> for /contact. Extracted in 17b-7k.
	meta: {
		title: { en: 'Contact — yesid.' },
		description: {
			en: 'Get in touch for freelance data engineering, database development, and digital infrastructure consulting.',
		},
	},

	infoTerminal: {
		title: 'yesid@mtl ~ /info',
		command: '$ yesid --info',
		location: { en: 'Montreal, QC, Canada' },
		responseTime: { en: '~24h response time' },
		sectionLabels: {
			location: { en: 'LOCATION' },
			connect: { en: 'CONNECT' },
		},
	},

	formTerminal: {
		title: 'yesid@mtl ~ /contact',
		command: '$ yesid --contact',
		commandOutput: { en: 'Opening contact form...' },
		fields: {
			name: { label: 'name', placeholder: { en: 'Your name' } },
			email: { label: 'email', placeholder: { en: 'you@company.com' } },
			message: { label: 'message', placeholder: { en: 'Tell me about your project...' } },
		},
		submitLabel: { en: 'send --message →' },
	},

	validation: {
		required: { en: 'required — {field} cannot be empty' },
		invalidEmail: { en: 'invalid — enter a valid email address' },
		errorSummary: { en: '{count} errors — fix and retry' },
	},

	success: {
		validating: { en: 'Validating fields...' },
		sending: { en: 'Sending message...' },
		sent: { en: 'Message sent successfully!' },
		responseTime: { en: "I'll get back to you within 24h" },
		meanwhile: { en: 'Meanwhile, check out my {work} or {blog}' },
		resetLabel: { en: 'reset --form' },
		fieldOk: { en: 'OK' },
	},

	socials: [
		{ label: 'Email', href: `mailto:${siteMeta.links.email}`, icon: 'email' },
		{ label: 'GitHub', href: siteMeta.links.github, icon: 'github' },
		{ label: 'LinkedIn', href: siteMeta.links.linkedin ?? '', icon: 'linkedin' },
	],

	web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
};
