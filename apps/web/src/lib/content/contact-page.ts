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
		bookingButtonLabel: {
			en: 'book --intro-call →',
			es: 'book --intro-call →',
			fr: 'book --intro-call →',
		},
		bookingPrompt: {
			en: 'Prefer to talk it through?',
			es: '¿Prefieres hablarlo de viva voz?',
			fr: 'Tu préfères en jaser de vive voix?',
		},
		command: '$ yesid --contact',
		commandOutput: {
			en: 'Opening contact form...',
			es: 'Abriendo formulario de contacto...',
			fr: 'Ouverture du formulaire de contact...',
		},
		fields: {
			email: {
				label: { en: 'email', es: 'correo', fr: 'courriel' },
				placeholder: {
					en: 'you@company.com',
					es: 'tu@empresa.com',
					fr: 'toi@compagnie.com',
				},
			},
			message: {
				label: { en: 'message', es: 'mensaje', fr: 'message' },
				placeholder: {
					en: 'Tell me about your project...',
					es: 'Cuéntame de tu proyecto...',
					fr: 'Parle-moi de ton projet...',
				},
			},
			name: {
				label: { en: 'name', es: 'nombre', fr: 'nom' },
				placeholder: { en: 'Your name', es: 'Tu nombre', fr: 'Ton nom' },
			},
		},
		submitLabel: {
			en: 'send --message →',
			es: 'send --message →',
			fr: 'send --message →',
		},
		title: 'yesid@mtl ~ /contact',
	},
	infoTerminal: {
		bestFit: [
			{
				en: 'Slow reports that need to be fast',
				es: 'Reportes lentos que deben ser rápidos',
				fr: 'Des rapports lents qui doivent aller vite',
			},
			{
				en: 'Manual data work that should run itself',
				es: 'Trabajo manual con datos que debería correr solo',
				fr: 'Du travail de données manuel qui devrait rouler tout seul',
			},
			{
				en: 'Sites and stores wired to live data',
				es: 'Sitios y tiendas conectados a datos en vivo',
				fr: 'Des sites et boutiques branchés sur des données en direct',
			},
		],
		command: '$ yesid --info',
		languages: {
			en: 'EN · FR · ES',
			es: 'EN · FR · ES',
			fr: 'EN · FR · ES',
		},
		location: {
			en: 'Montreal, QC, Canada',
			es: 'Montreal, QC, Canadá',
			fr: 'Montréal, QC, Canada',
		},
		responseTime: {
			en: '~24h response time',
			es: 'respuesta en ~24h',
			fr: 'réponse en ~24h',
		},
		sectionLabels: {
			bestFit: {
				en: 'BEST FIT',
				es: 'PROYECTOS IDEALES',
				fr: 'PROJETS IDÉAUX',
			},
			connect: { en: 'CONNECT', es: 'CONECTA', fr: 'CONNEXION' },
			languages: { en: 'LANGUAGES', es: 'IDIOMAS', fr: 'LANGUES' },
			location: { en: 'LOCATION', es: 'UBICACIÓN', fr: 'EMPLACEMENT' },
		},
		title: 'yesid@mtl ~ /info',
	},
	meta: {
		description: {
			en: 'Get in touch for freelance digital infrastructure, databases, pipelines, dashboards, and websites. Montreal, ~24h response time.',
			es: 'Escríbeme para infraestructura digital freelance: bases de datos, pipelines, tableros y sitios web. Montreal, respuesta en ~24h.',
			fr: 'Écris-moi pour de l\'infrastructure numérique à la pige : bases de données, pipelines, tableaux de bord et sites web. Montréal, réponse en ~24h.',
		},
		title: {
			en: 'Contact · yesid.',
			es: 'Contacto · yesid.',
			fr: 'Contact · yesid.',
		},
	},
	pageTitle: { en: 'Contact', es: 'Contacto', fr: 'Contact' },
	sendErrorMessage: {
		en: 'Failed to send message. Please try again.',
		es: 'No se pudo enviar el mensaje. Inténtalo de nuevo, por favor.',
		fr: 'L\'envoi du message a échoué. Réessaie, s\'il te plaît.',
	},
	socials: [
		{
			href: 'https://cal.com/yesid-dev',
			icon: 'calendar',
			label: {
				en: 'Book a 20-min intro call',
				es: 'Agenda una llamada intro de 20 min',
				fr: 'Réserver un appel intro de 20 minutes',
			},
		},
		{
			href: 'mailto:contact@yesid.dev',
			icon: 'email',
			label: { en: 'Email', es: 'Correo', fr: 'Courriel' },
		},
		{
			href: 'https://github.com/mgkdante',
			icon: 'github',
			label: { en: 'GitHub', es: 'GitHub', fr: 'GitHub' },
		},
		{
			href: 'https://www.linkedin.com/in/otaloray/',
			icon: 'linkedin',
			label: { en: 'LinkedIn', es: 'LinkedIn', fr: 'LinkedIn' },
		},
	],
	stationLabel: {
		en: 'NEXT STOP: YOU',
		es: 'PRÓXIMA PARADA: TÚ',
		fr: 'PROCHAIN ARRÊT : TOI',
	},
	success: {
		blogLinkLabel: { en: 'blog', es: 'blog', fr: 'blogue' },
		fieldOk: { en: 'OK', es: 'OK', fr: 'OK' },
		meanwhile: {
			en: 'Meanwhile, check out my {work} or {blog}',
			es: 'Mientras tanto, échale un ojo a mis {work} o a mi {blog}',
			fr: 'En attendant, jette un œil à mes {work} ou mon {blog}',
		},
		resetLabel: {
			en: 'reset --form',
			es: 'reset --form',
			fr: 'reset --form',
		},
		responseTime: {
			en: 'I\'ll get back to you within 24h',
			es: 'Te respondo en menos de 24h',
			fr: 'Je te reviens d\'ici 24h',
		},
		sending: {
			en: 'Sending message...',
			es: 'Enviando mensaje...',
			fr: 'Envoi du message...',
		},
		sent: {
			en: 'Message sent successfully!',
			es: '¡Mensaje enviado con éxito!',
			fr: 'Message envoyé avec succès!',
		},
		validating: {
			en: 'Validating fields...',
			es: 'Validando campos...',
			fr: 'Validation des champs...',
		},
		workLinkLabel: { en: 'work', es: 'servicios', fr: 'services' },
	},
	validation: {
		errorSummary: {
			en: '{count} errors, fix and retry',
			es: '{count} errores, corrige y reintenta',
			fr: '{count} erreurs, corrige et réessaie',
		},
		invalidEmail: {
			en: 'invalid, enter a valid email address',
			es: 'inválido, ingresa un correo válido',
			fr: 'invalide, entre une adresse courriel valide',
		},
		required: {
			en: 'required, {field} cannot be empty',
			es: 'requerido, {field} no puede estar vacío',
			fr: 'requis, {field} ne peut pas être vide',
		},
	},
	web3formsKey: '6887fd90-3348-4d31-ba03-bc0e285697b6',
};
