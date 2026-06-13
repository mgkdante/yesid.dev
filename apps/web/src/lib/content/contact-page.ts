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
		commandOutput: {
			en: 'Opening contact form...',
			fr: 'Ouverture du formulaire de contact...',
		},
		fields: {
			email: {
				label: 'email',
				placeholder: { en: 'you@company.com', fr: 'vous@compagnie.com' },
			},
			message: {
				label: 'message',
				placeholder: {
					en: 'Tell me about your project...',
					fr: 'Parlez-moi de votre projet...',
				},
			},
			name: {
				label: 'name',
				placeholder: { en: 'Your name', fr: 'Votre nom' },
			},
		},
		submitLabel: { en: 'send --message →', fr: 'send --message →' },
		title: 'yesid@mtl ~ /contact',
	},
	infoTerminal: {
		command: '$ yesid --info',
		location: { en: 'Montreal, QC, Canada', fr: 'Montréal, QC, Canada' },
		responseTime: { en: '~24h response time', fr: 'réponse en ~24h' },
		sectionLabels: {
			connect: { en: 'CONNECT', fr: 'CONNEXION' },
			location: { en: 'LOCATION', fr: 'EMPLACEMENT' },
		},
		title: 'yesid@mtl ~ /info',
	},
	meta: {
		description: {
			en: 'Get in touch for freelance digital infrastructure, databases, pipelines, dashboards, and websites. Montreal, ~24h response time.',
			fr: 'Écrivez-moi pour de l\'infrastructure numérique en freelance : bases de données, pipelines, tableaux de bord et sites web. Montréal, réponse en ~24h.',
		},
		title: { en: 'Contact · yesid.', fr: 'Contact · yesid.' },
	},
	pageTitle: { en: 'Contact', fr: 'Contact' },
	sendErrorMessage: {
		en: 'Failed to send message. Please try again.',
		fr: 'L\'envoi du message a échoué. Réessayez, s\'il vous plaît.',
	},
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
	stationLabel: { en: 'NEXT STOP: YOU', fr: 'PROCHAIN ARRÊT : VOUS' },
	success: {
		fieldOk: { en: 'OK', fr: 'OK' },
		meanwhile: {
			en: 'Meanwhile, check out my {work} or {blog}',
			fr: 'En attendant, jetez un œil à mes {work} ou mon {blog}',
		},
		resetLabel: { en: 'reset --form', fr: 'reset --form' },
		responseTime: {
			en: 'I\'ll get back to you within 24h',
			fr: 'Je vous reviens d\'ici 24h',
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
	},
	validation: {
		errorSummary: {
			en: '{count} errors, fix and retry',
			fr: '{count} erreurs, corrigez et réessayez',
		},
		invalidEmail: {
			en: 'invalid, enter a valid email address',
			fr: 'invalide, entrez une adresse courriel valide',
		},
		required: {
			en: 'required, {field} cannot be empty',
			fr: 'requis, {field} ne peut pas être vide',
		},
	},
	web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
};

// Re-export hand-written companion module so consumers can keep importing
// chrome / helpers / type defs from the original path 'contact-page'.
export * from './contact-page.companion';
