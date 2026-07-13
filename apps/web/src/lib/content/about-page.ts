// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// /about page content (identity, metrics, methodology, testimonials, etc.).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { AboutContent } from '$lib/types';

export const aboutPageContent: AboutContent = {
	cta: {
		buttonHref: '/contact',
		buttonLabel: {
			en: 'Send message →',
			es: 'Enviar mensaje →',
			fr: 'Envoyer un message →',
		},
		command: '$ yesid --contact',
		lines: [
			{ color: 'orange', text: '> Ready for new projects' },
			{ color: 'muted', text: '> AI-accelerated, human-owned' },
			{ color: 'muted', text: '> Email: contact@yesid.dev' },
			{
				color: 'muted',
				text: '> GitHub: https://github.com/mgkdante',
			},
			{
				color: 'muted',
				text: '> LinkedIn: https://www.linkedin.com/in/otaloray/',
			},
		],
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
	},
	education: [
		{
			icon: 'champlain',
			program: {
				en: 'DEC, Accounting & Management Technology',
				es: 'DEC, Técnicas de contabilidad y gestión',
				fr: 'DEC, Techniques de comptabilité et de gestion',
			},
			school: {
				en: 'Champlain Regional College, Lennoxville',
				es: 'Champlain Regional College, Lennoxville',
				fr: 'Champlain Regional College, Lennoxville',
			},
		},
		{
			icon: 'bishops',
			program: {
				en: 'B.Sc. Computer Science, minor in Business Administration',
				es: 'B.Sc. en Ciencias de la Computación, minor en Administración de Empresas',
				fr: 'B. Sc. informatique, mineure en administration des affaires',
			},
			school: {
				en: 'Bishop\'s University',
				es: 'Bishop\'s University',
				fr: 'Bishop\'s University',
			},
		},
	],
	identity: {
		headshot: '/images/about/headshot.webp',
		name: { en: 'Yesid', es: 'Yesid', fr: 'Yesid' },
		polaroids: [
			{
				alt: {
					en: 'Walking with my dog in Montreal',
					es: 'Paseando con mi perro en Montreal',
					fr: 'En promenade avec mon chien à Montréal',
				},
				caption: {
					en: 'Off-duty mode',
					es: 'Modo descanso',
					fr: 'Mode relâche',
				},
				rotate: -3,
				src: '/images/about/polaroid-1.webp',
			},
			{
				alt: {
					en: 'Dante, the family dog',
					es: 'Dante, el perro de la familia',
					fr: 'Dante, le chien de la famille',
				},
				caption: {
					en: 'Dante, the family\'s good boy',
					es: 'Dante, el consentido de la familia',
					fr: 'Dante, le bon chien de la famille',
				},
				rotate: 3,
				src: '/images/about/polaroid-dante.webp',
			},
			{
				alt: {
					en: 'Poupoune, my dog',
					es: 'Poupoune, mi perro',
					fr: 'Poupoune, mon chien',
				},
				caption: { en: 'Poupoune 🐾', es: 'Poupoune 🐾', fr: 'Poupoune 🐾' },
				rotate: -2,
				src: '/images/about/polaroid-poupoune.webp',
			},
			{
				alt: { en: 'Yesid', es: 'Yesid', fr: 'Yesid' },
				caption: { en: 'That\'s me', es: 'Ese soy yo', fr: 'C\'est moi' },
				rotate: 2,
				src: '/images/about/polaroid-yesid.webp',
			},
			{
				alt: {
					en: 'With my family',
					es: 'Con mi familia',
					fr: 'Avec ma famille',
				},
				caption: { en: 'Family', es: 'Familia', fr: 'La famille' },
				rotate: -4,
				src: '/images/about/polaroid-family.webp',
			},
			{
				alt: {
					en: 'With friends',
					es: 'Con amigos',
					fr: 'Avec les amis',
				},
				caption: { en: 'Friends', es: 'Parceros', fr: 'Les amis' },
				rotate: 3,
				src: '/images/about/polaroid-friends.webp',
			},
			{
				alt: {
					en: 'At the art museum in Ottawa',
					es: 'En el museo de arte de Ottawa',
					fr: 'Au musée d\'art à Ottawa',
				},
				caption: {
					en: 'Museum day, Ottawa',
					es: 'Día de museo, Ottawa',
					fr: 'Journée musée, Ottawa',
				},
				rotate: -3,
				src: '/images/about/polaroid-museum.webp',
			},
		],
		title: {
			en: 'Curious builder, lifelong tinkerer',
			es: 'Constructor curioso, cacharreador eterno',
			fr: 'Bâtisseur curieux, bricoleur depuis toujours',
		},
		valueProp: {
			en: 'I\'m Yesid, a Montreal builder who likes clear systems and plain explanations. My trade runs through databases, pipelines, dashboards, and websites. When clients work with me, I teach them what things mean so they stay behind the wheel.',
			es: 'Soy Yesid, una persona de Montreal a la que le gustan los sistemas claros y las explicaciones sencillas. Mi oficio pasa por bases de datos, pipelines, dashboards y sitios web. Cuando los clientes trabajan conmigo, les enseño qué significa cada cosa para que sigan al volante.',
			fr: 'Moi, c\'est Yesid : un gars de Montréal qui aime les systèmes clairs et les explications simples. Mon métier passe par les bases de données, les pipelines, les tableaux de bord et les sites web. Avec mes clients, j\'explique ce que les choses veulent dire pour qu\'ils gardent le volant.',
		},
	},
	interests: [
		{
			id: 'anime',
			image: '/images/about/interests/anime.webp',
			label: { en: 'Manga', es: 'Manga', fr: 'Manga' },
		},
		{
			id: 'transit',
			image: '/images/about/interests/transit.webp',
			label: {
				en: 'Transit',
				es: 'Transporte',
				fr: 'Transport collectif',
			},
		},
		{
			id: 'space',
			image: '/images/about/interests/space.webp',
			label: { en: 'Space', es: 'Espacio', fr: 'L\'espace' },
		},
		{
			id: 'food',
			image: '/images/about/interests/food.webp',
			label: { en: 'MTL Food', es: 'Comida MTL', fr: 'Bouffe MTL' },
		},
	],
	labels: {
		polaroidNextAria: {
			en: 'Next photo',
			es: 'Foto siguiente',
			fr: 'Photo suivante',
		},
		polaroidPrevAria: {
			en: 'Previous photo',
			es: 'Foto anterior',
			fr: 'Photo précédente',
		},
		showTestimonialAria: {
			en: 'Show testimonial {index}',
			es: 'Mostrar testimonio {index}',
			fr: 'Afficher le témoignage {index}',
		},
		testimonialSlideAria: {
			en: 'Testimonial {index} of {total}',
			es: 'Testimonio {index} de {total}',
			fr: 'Témoignage {index} sur {total}',
		},
		testimonialsCarouselAria: {
			en: 'Personal quote',
			es: 'Cita personal',
			fr: 'Citation personnelle',
		},
		testimonialsNextAria: {
			en: 'Next quote',
			es: 'Cita siguiente',
			fr: 'Citation suivante',
		},
		testimonialsPrevAria: {
			en: 'Previous quote',
			es: 'Cita anterior',
			fr: 'Citation précédente',
		},
		testimonialsTabNavAria: {
			en: 'Quote navigation',
			es: 'Navegación de citas',
			fr: 'Navigation de citation',
		},
	},
	languages: [
		{
			id: 'quebec',
			image: '5f512546-d577-4e24-8a4e-e5518db6374e',
			label: { en: 'French', es: 'Francés', fr: 'Français' },
		},
		{
			id: 'canada',
			image: 'f1d1046b-d08a-4eca-8347-4b7d21c68c15',
			label: { en: 'English', es: 'Inglés', fr: 'Anglais' },
		},
		{
			id: 'colombia',
			image: 'dd23a610-b9fc-4cd3-bfa4-4cc09af4ea84',
			label: { en: 'Spanish', es: 'Español', fr: 'Espagnol' },
		},
	],
	meta: {
		description: {
			en: 'Digital solutions developer in Montréal helping Québec SMEs connect websites, reports, and workflows through web, automation, analytics, databases, and SQL.',
			es: 'Desarrollador freelance de soluciones digitales en Montreal. Ayudo a pymes de Québec con web, automatización, analítica, bases de datos y SQL confiables.',
			fr: 'Développeur de solutions numériques à la pige à Montréal. J\'aide les PME du Québec avec le web, l\'automatisation, l\'analytique, les bases de données et SQL.',
		},
		title: {
			en: 'About · yesid.',
			es: 'Sobre mí · yesid.',
			fr: 'À propos · yesid.',
		},
	},
	methodology: [
		{
			description: {
				en: 'I take things apart to learn how they work, then build better ones.',
				es: 'Desarmo las cosas para entender cómo funcionan, y luego construyo unas mejores.',
				fr: 'Je démonte les choses pour comprendre comment elles marchent, puis j\'en construis de meilleures.',
			},
			id: 'curiosity',
			label: { en: 'CURIOSITY', es: 'CURIOSIDAD', fr: 'CURIOSITÉ' },
			station: 1,
		},
		{
			description: {
				en: 'If it works but it\'s ugly, it\'s only half done.',
				es: 'Si funciona pero es feo, solo está hecho a medias.',
				fr: 'Si ça fonctionne mais que c\'est laid, ce n\'est qu\'à moitié fait.',
			},
			id: 'aesthetics',
			label: { en: 'AESTHETICS', es: 'ESTÉTICA', fr: 'ESTHÉTIQUE' },
			station: 2,
		},
		{
			description: {
				en: 'Good tools lift the people around them, that’s the whole point.',
				es: 'Las buenas herramientas impulsan a quienes las rodean, de eso se trata todo.',
				fr: 'Les bons outils élèvent les gens autour d\'eux, c\'est tout l\'intérêt.',
			},
			id: 'community',
			label: { en: 'COMMUNITY', es: 'COMUNIDAD', fr: 'COMMUNAUTÉ' },
			station: 3,
		},
		{
			description: {
				en: 'I\'d rather build it right than build it twice.',
				es: 'Prefiero construirlo bien a construirlo dos veces.',
				fr: 'Je préfère bien le bâtir que le bâtir deux fois.',
			},
			id: 'quality',
			label: { en: 'QUALITY', es: 'CALIDAD', fr: 'QUALITÉ' },
			station: 4,
		},
	],
	metrics: [
		{
			label: {
				en: 'years building data systems',
				es: 'años construyendo sistemas de datos',
				fr: 'années à bâtir des systèmes de données',
			},
			value: '5+',
		},
		{
			label: {
				en: 'databases designed & optimized',
				es: 'bases de datos diseñadas y optimizadas',
				fr: 'bases de données conçues et optimisées',
			},
			value: '30+',
		},
		{
			label: {
				en: 'avg. query speed improvement',
				es: 'mejora promedio en las consultas',
				fr: 'amélioration moyenne des requêtes',
			},
			value: '3x',
		},
		{
			label: {
				en: 'pipeline uptime delivered',
				es: 'disponibilidad lograda en pipelines',
				fr: 'disponibilité livrée sur les pipelines',
			},
			value: '99.9%',
		},
	],
	stopLabels: {
		clients: { en: 'LANGUAGES', es: 'IDIOMAS', fr: 'LANGUES' },
		identity: { en: 'IDENTITY', es: 'IDENTIDAD', fr: 'IDENTITÉ' },
		interests: { en: 'INTERESTS', es: 'INTERESES', fr: 'INTÉRÊTS' },
		location: { en: 'LOCATION', es: 'UBICACIÓN', fr: 'LOCALISATION' },
		metrics: { en: 'METRICS', es: 'MÉTRICAS', fr: 'MESURES' },
		next: { en: 'NEXT', es: 'SIGUE', fr: 'SUITE' },
		process: {
			en: 'CORE BELIEFS',
			es: 'CONVICCIONES',
			fr: 'CONVICTIONS',
		},
		snapshots: { en: 'SNAPSHOTS', es: 'FOTOS', fr: 'PHOTOS' },
		stack: { en: 'EDUCATION', es: 'FORMACIÓN', fr: 'FORMATION' },
		testimonials: { en: 'QUOTE', es: 'CITA', fr: 'CITATION' },
	},
	testimonials: [
		{
			author: 'Guy Sensei',
			company: 'Personal lore',
			quote: {
				en: 'You have the gift of perseverance, and that\'s what makes you a genius too.',
				es: 'Tienes el don de la perseverancia, y eso es lo que también te hace un genio.',
				fr: 'Tu as le don de la persévérance, et c\'est ce qui fait de toi un génie.',
			},
			role: { en: 'Sensei', es: 'Sensei', fr: 'Gaï Sensei' },
		},
		{
			author: 'Gabriel Garcia Marquez',
			company: 'Literature',
			quote: {
				en: 'What matters in life is not what happens to you but what you remember and how you remember it.',
				es: 'La vida no es la que uno vivió, sino la que uno recuerda y cómo la recuerda para contarla.',
				fr: 'Ce qui compte dans la vie, ce n\'est pas ce qui t\'arrive, mais ce dont tu te souviens et la façon dont tu t\'en souviens.',
			},
			role: { en: 'Writer', es: 'Escritor', fr: 'Écrivain' },
		},
		{
			author: 'Marcus Aurelius',
			company: 'Meditations',
			quote: {
				en: 'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
				es: 'Todo lo que oímos es una opinión, no un hecho. Todo lo que vemos es una perspectiva, no la verdad.',
				fr: 'Tout ce que nous entendons est une opinion, pas un fait. Tout ce que nous voyons est une perspective, pas la vérité.',
			},
			role: {
				en: 'Stoic philosopher',
				es: 'Filósofo estoico',
				fr: 'Philosophe stoïcien',
			},
		},
	],
	weather: {
		city: { en: 'Montreal', es: 'Montreal', fr: 'Montréal' },
		enabled: true,
		hook: {
			en: 'Guess where I am?',
			es: '¿Adivina dónde estoy?',
			fr: 'Devine où je suis?',
		},
	},
};
