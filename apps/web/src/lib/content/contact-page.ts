// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
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
		bookingButtonLabel: { en: 'book --intro-call →', fr: 'book --intro-call →' },
		bookingPrompt: {
			en: 'Prefer to talk it through?',
			fr: 'Tu préfères en jaser de vive voix?',
		},
		command: '$ yesid --contact',
		commandOutput: {
			en: 'Opening contact form...',
			fr: 'Ouverture du formulaire de contact...',
		},
		fields: {
			email: {
				label: { en: 'email', fr: 'courriel' },
				placeholder: { en: 'you@company.com', fr: 'toi@compagnie.com' },
			},
			message: {
				label: { en: 'message', fr: 'message' },
				placeholder: {
					en: 'Tell me about your project...',
					fr: 'Parle-moi de ton projet...',
				},
			},
			name: {
				label: { en: 'name', fr: 'nom' },
				placeholder: { en: 'Your name', fr: 'Ton nom' },
			},
		},
		submitLabel: { en: 'send --message →', fr: 'send --message →' },
		title: 'yesid@mtl ~ /contact',
	},
	infoTerminal: {
		command: '$ yesid --info',
		languages: { en: 'EN · FR', fr: 'EN · FR' },
		location: { en: 'Montreal, QC, Canada', fr: 'Montréal, QC, Canada' },
		responseTime: { en: '~24h response time', fr: 'réponse en ~24h' },
		sectionLabels: {
			connect: { en: 'CONNECT', fr: 'CONNEXION' },
			languages: { en: 'LANGUAGES', fr: 'LANGUES' },
			location: { en: 'LOCATION', fr: 'EMPLACEMENT' },
		},
		title: 'yesid@mtl ~ /info',
	},
	meta: {
		description: {
			en: 'Get in touch for freelance digital infrastructure, databases, pipelines, dashboards, and websites. Montreal, ~24h response time.',
			fr: 'Écris-moi pour de l\'infrastructure numérique à la pige : bases de données, pipelines, tableaux de bord et sites web. Montréal, réponse en ~24h.',
		},
		title: { en: 'Contact · yesid.', fr: 'Contact · yesid.' },
	},
	pageTitle: { en: 'Contact', fr: 'Contact' },
	sendErrorMessage: {
		en: 'Failed to send message. Please try again.',
		fr: 'L\'envoi du message a échoué. Réessaie, s\'il te plaît.',
	},
	socials: [
		{
			href: 'https://cal.com/yesid-dev',
			icon: 'calendar',
			label: {
				en: 'Book a 20-min intro call',
				fr: 'Réserver un appel intro de 20 minutes',
			},
		},
		{
			href: 'mailto:contact@yesid.dev',
			icon: 'email',
			label: { en: 'Email', fr: 'Courriel' },
		},
		{
			href: 'https://github.com/mgkdante',
			icon: 'github',
			label: { en: 'GitHub', fr: 'GitHub' },
		},
		{
			href: 'https://www.linkedin.com/in/otaloray/',
			icon: 'linkedin',
			label: { en: 'LinkedIn', fr: 'LinkedIn' },
		},
	],
	stationLabel: { en: 'NEXT STOP: YOU', fr: 'PROCHAIN ARRÊT : TOI' },
	success: {
		blogLinkLabel: { en: 'blog', fr: 'blogue' },
		fieldOk: { en: 'OK', fr: 'OK' },
		meanwhile: {
			en: 'Meanwhile, check out my {work} or {blog}',
			fr: 'En attendant, jette un œil à mes {work} ou mon {blog}',
		},
		resetLabel: { en: 'reset --form', fr: 'reset --form' },
		responseTime: {
			en: 'I\'ll get back to you within 24h',
			fr: 'Je te reviens d\'ici 24h',
		},
		sending: { en: 'Sending message...', fr: 'Envoi du message...' },
		sent: {
			en: 'Message sent successfully!',
			fr: 'Message envoyé avec succès!',
		},
		validating: {
			en: 'Validating fields...',
			fr: 'Validation des champs...',
		},
		workLinkLabel: { en: 'work', fr: 'services' },
	},
	validation: {
		errorSummary: {
			en: '{count} errors, fix and retry',
			fr: '{count} erreurs, corrige et réessaie',
		},
		invalidEmail: {
			en: 'invalid, enter a valid email address',
			fr: 'invalide, entre une adresse courriel valide',
		},
		required: {
			en: 'required, {field} cannot be empty',
			fr: 'requis, {field} ne peut pas être vide',
		},
	},
	web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
};
