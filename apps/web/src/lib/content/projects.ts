// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Projects array (slugs, titles, oneLiners, descriptions, sections, impact metrics, stack, tags, related services).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { Project } from '$lib/types';

export const projects: readonly Project[] = [
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A provider-neutral transit data project, with Montréal and Ottawa as current examples. Explore its interface, shared contracts, calculations and limits.',
						},
						id: '8273b4918a5938a5-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			es: {
				blocks: [
					{
						data: {
							text: 'Un proyecto de datos de transporte para distintas redes, con Montreal y Ottawa como ejemplos. Interfaz, contratos compartidos, cálculos y límites.',
						},
						id: 'f5f138d8f253af8d-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Un projet de données de transport conçu pour plusieurs réseaux, avec Montréal et Ottawa comme exemples. Interface, contrats communs, calculs et limites.',
						},
						id: '66989eb2df0ca5da-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
		},
		environment: 'production',
		featured: true,
		image: '2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
		impactMetric: {
			label: {
				en: 'Transit networks: Montréal and Ottawa',
				es: 'Redes de transporte: Montreal y Ottawa',
				fr: 'Réseaux de transport : Montréal et Ottawa',
			},
			value: '2',
		},
		impactMetrics: [
			{
				label: {
					en: 'Transit networks: Montréal and Ottawa',
					es: 'Redes de transporte: Montreal y Ottawa',
					fr: 'Réseaux de transport : Montréal et Ottawa',
				},
				value: '2',
			},
			{
				label: {
					en: 'Interface languages',
					es: 'Idiomas de la interfaz',
					fr: 'Langues de l’interface',
				},
				value: 'FR / EN',
			},
		],
		liveUrl: 'https://transit.yesid.dev/',
		location: 'Montréal / Ottawa',
		oneLiner: {
			en: 'Public transit, with the data and its limitations in view.',
			es: 'Transporte público con datos, contexto y límites claros.',
			fr: 'Le transport public, avec ses données et ses limites.',
		},
		relatedServices: [
			'data-pipeline',
			'database-engineering',
			'analytics-reporting',
			'web-development',
		],
		repoPrivate: true,
		repoUrl: 'https://github.com/mgkdante/transit',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: '<em>A personal civic data project designed for different transit networks, currently using data from Montréal and Ottawa.</em>',
								},
								id: '36e579fed3814524-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A delay shown on a map looks straightforward. Understanding it takes a few more questions. Where did the information come from? When was it received? Does it describe a reported position, a predicted arrival or an observation saved for a daily summary? The answer changes what the number can tell us.',
								},
								id: '4a4dc31826b4c439-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I’m developing Transit to make those questions easier to explore. The site brings public transit data into a French and English interface. Visitors can look at network conditions, open a route or stop, explore a map and read the explanations behind the measures. The architecture is designed to accommodate different transit data providers. Montréal’s STM and Ottawa’s OC Transpo are the two networks currently configured and presented on the site, with the information available from each.',
								},
								id: '4afdca0c810b0782-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Transit is an independent project. Its purpose is to make transit operations easier to inspect and understand. The transit agencies’ own services remain the reference for planning a journey or checking an urgent service notice.',
								},
								id: '51e99d7cd24f24fb-3',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Starting with a question' },
								id: '3bad88aa79a70193-4',
								type: 'header',
							},
							{
								data: {
									text: 'The site starts with everyday questions: how is the network running, which route deserves a closer look, and what has been observed over time? That gives people a way in without requiring them to know the name of a metric or how the database is organized.',
								},
								id: '4bdbdd1e224dfc5a-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The map places reported positions in context and opens up their details. Route and stop pages bring together schedules, available predictions and reliability observations. Network views and daily summaries offer a broader perspective. A methodology page explains what the numbers measure, while data health shows source freshness and known gaps.',
								},
								id: '7cbd62463156e3e0-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'These different views complement each other. Someone can start with a place they recognize, look at a pattern and then open the explanation behind a number. The detail is available without making everyone work through it first.',
								},
								id: 'f880323e8efc1dd3-7',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Two networks, different contexts' },
								id: 'a8a2c5d6ebb3b957-8',
								type: 'header',
							},
							{
								data: {
									text: 'Working with Montréal and Ottawa makes the differences between sources tangible. Both networks provide schedules and updates, but their information is not interchangeable. Switching cities also needs to change the map context, routes, stops and links to the relevant agency.',
								},
								id: 'fda478f4b3b81349-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ottawa offers a useful example. Transit has no connected OC Transpo service-alert feed. The interface says so and links to the official alerts. Displaying zero alerts would suggest that there were no disruptions, which the available data cannot establish.',
								},
								id: '5370c3327dbab936-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The wording on the screen is part of the product’s code. This short excerpt from the English version connects the agency name, the explanation and the next available step:',
								},
								id: '0419e98e7ccac650-11',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\ntitle: \'Service alerts unavailable\',\nbody: (operator: string) =>\n\t`No ${operator} alert feed is connected here. This does not mean there are no disruptions.`,\nlink: \'Check official service alerts\',\n```',
								},
								id: '64395887d6e23e9c-12',
								type: 'code',
							},
							{
								data: {
									text: '<code>operator</code> is replaced with the agency’s name. The message distinguishes missing information from an absence of disruptions, then points to the official source. Even at this small scale, writing an interface means considering what a reader can reasonably conclude.',
								},
								id: '82a7bde69bb56090-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Another example involves arrival predictions. A prediction can exist for a trip even when the map has no vehicle associated with that trip. Work on the Ottawa pages preserved that information where it belongs. A vehicle marker and an arrival prediction answer different questions.',
								},
								id: 'f27140c4f93a19cc-14',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Continuing the work' },
								id: '3e21976045d57e0e-15',
								type: 'header',
							},
							{
								data: {
									text: 'The interface uses an identified release of my shared design foundation, yesid.dev-design. Colours, shared components and interface behaviours have a common source. Transit still has its own reading needs: a dense map, tables, filters, unknown states and explanations that need to work on a small screen.',
								},
								id: '6045fc28309ac44e-16',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The project is deployed and continues to develop. The public site includes pages for Montréal and Ottawa, but that does not guarantee that every source is always available or that its history is complete. Repair and consolidation work is ongoing. Existing checks retain their specific scope; they do not stand in for every real-device or assistive-technology test.',
								},
								id: '8d5a5cb34677f11f-17',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I’m developing Transit with the support of AI tools, while also working to understand the system more deeply. I’m taking time to follow the code, understand where each behaviour belongs and explain the project’s decisions more clearly. That learning is still in progress. I want to connect what the site shows to the code and data that produce it, then make changes with a stronger understanding of their consequences.',
								},
								id: 'df14baa2b565a033-18',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The project brings together several parts of my work as a Freelance Digital Solutions Developer: starting with a useful question, organizing imperfect sources, building a readable interface and making limitations visible. The next steps concern the reliability and simplicity of the system as much as the clarity of what people can learn from it.',
								},
								id: '545ca571f6e52071-19',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="https://transit.yesid.dev/">Explore Transit</a>',
								},
								id: 'ac5195fbf9c9b144-20',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'From the screen to the underlying system',
								},
								id: 'e8a235b769764dd6-21',
								type: 'header',
							},
							{
								data: {
									text: 'The map is Transit’s most visible part. The following sections explain the work connecting a prediction, a measure and a published version. Each can be read independently, with the calculations and examples needed to understand that part of the system.',
								},
								id: 'f549b9e54e241a2f-22',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: '<em>Un proyecto personal de análisis ciudadano pensado para distintas redes de transporte, actualmente con datos de Montreal y Ottawa.</em>',
								},
								id: '8c7f2d9843b4fff4-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un retraso que aparece en un mapa parece fácil de interpretar. Pero antes conviene entender de dónde viene ese dato, cuándo se recibió y qué representa. Puede ser una posición reportada, una hora estimada de llegada o una observación guardada para un balance diario. Cada caso permite sacar conclusiones diferentes.',
								},
								id: 'a7880c0048424471-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Estoy desarrollando Transit para facilitar esa exploración. El sitio reúne datos públicos de transporte en una interfaz en francés e inglés. Permite consultar el estado de una red, revisar una ruta o una parada, explorar un mapa y leer cómo se calculan los indicadores. La arquitectura está pensada para incorporar distintos proveedores de datos de transporte. La STM de Montreal y OC Transpo de Ottawa son las dos redes actualmente configuradas y presentadas en el sitio, según la información disponible para cada una.',
								},
								id: 'd04aafa5de627c9f-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Transit es un proyecto independiente. Busca hacer más comprensible el funcionamiento del transporte y permitir que las personas examinen las observaciones. Para planear un viaje o confirmar un aviso urgente, la referencia sigue siendo el servicio oficial de cada empresa de transporte.',
								},
								id: 'c7f80aa73221039d-3',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Empezar por una pregunta' },
								id: '96af0d019f50c812-4',
								type: 'header',
							},
							{
								data: {
									text: 'El sitio empieza por preguntas cotidianas: cómo está funcionando la red, qué ruta vale la pena revisar con más detalle y qué se ha observado a lo largo de los días. Así se puede entrar por un tema de interés sin conocer de antemano el nombre de un indicador ni la organización de la base de datos.',
								},
								id: '03e8cd16dc3ee633-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El mapa muestra las posiciones reportadas y permite consultar sus detalles. Las páginas de rutas y paradas reúnen horarios, estimaciones disponibles y observaciones de confiabilidad. Las vistas de la red y los balances diarios ayudan a mirar el conjunto. Una página de metodología explica qué mide cada cifra, y la sección de estado de los datos muestra qué tan recientes son las fuentes y qué vacíos se conocen.',
								},
								id: '5d7b87e569a3bec2-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Estas formas de consultar los datos se complementan. Una persona puede empezar por un lugar que conoce, revisar una tendencia y luego consultar la explicación de una cifra. El detalle queda disponible sin convertirse en un requisito para todo el mundo.',
								},
								id: '9a5b4d460bc5ba3a-7',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Dos redes, dos contextos' },
								id: 'd4e50c0fc6a540b0-8',
								type: 'header',
							},
							{
								data: {
									text: 'Trabajar con Montreal y Ottawa hace evidentes las diferencias entre las fuentes. Las dos redes publican horarios y actualizaciones, pero sus datos no son intercambiables. Cambiar de ciudad también debe cambiar el contexto del mapa, las rutas, las paradas y los enlaces a la entidad correspondiente.',
								},
								id: 'bd35b57144aa2e4c-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ottawa ofrece un ejemplo concreto. Transit no tiene conectado un flujo de avisos de servicio de OC Transpo. La interfaz lo explica y ofrece un enlace a los avisos oficiales. Mostrar cero avisos daría a entender que no hay interrupciones, algo que los datos disponibles no permiten asegurar.',
								},
								id: '558a42e528de6641-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El texto que aparece en pantalla también forma parte del código. Este fragmento de la versión inglesa relaciona el nombre de la empresa de transporte con el mensaje y el siguiente paso disponible:',
								},
								id: 'cb4b0810e931fe41-11',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\ntitle: \'Service alerts unavailable\',\nbody: (operator: string) =>\n\t`No ${operator} alert feed is connected here. This does not mean there are no disruptions.`,\nlink: \'Check official service alerts\',\n```',
								},
								id: '64395887d6e23e9c-12',
								type: 'code',
							},
							{
								data: {
									text: '<code>operator</code> se reemplaza por el nombre de la empresa. El mensaje distingue la falta de información de la ausencia de interrupciones y orienta hacia la fuente oficial. Incluso en un detalle pequeño, escribir una interfaz implica pensar en lo que la persona puede concluir al leerla.',
								},
								id: '6422951adb18c0f8-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Otro caso tiene que ver con las horas estimadas de llegada. Puede existir una estimación para un recorrido aunque el mapa no muestre un vehículo asociado. El trabajo en las páginas de Ottawa permitió conservar esa información donde corresponde. Un marcador de vehículo y una estimación de llegada responden a preguntas distintas.',
								},
								id: 'c9f3c55a4226301a-14',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Un proyecto que sigue en construcción' },
								id: '55104299fef18627-15',
								type: 'header',
							},
							{
								data: {
									text: 'La interfaz utiliza una versión identificada de mi base de diseño compartida, yesid.dev-design. Los colores, los componentes comunes y los comportamientos de la interfaz tienen un mismo origen. Transit conserva sus propias necesidades de lectura: un mapa con mucha información, tablas, filtros, estados desconocidos y explicaciones que deben seguir siendo claras en una pantalla pequeña.',
								},
								id: '56b05fcfb85d1bbc-16',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El proyecto está desplegado y sigue evolucionando. El sitio público permite consultar ambas redes, pero eso no garantiza la disponibilidad permanente de todas las fuentes ni un historial completo. Continúan los trabajos de reparación y consolidación. Las verificaciones realizadas tienen un alcance específico; no sustituyen todas las pruebas en dispositivos reales o con tecnologías de asistencia.',
								},
								id: 'e5932c9fb3c18397-17',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Estoy desarrollando Transit con el apoyo de herramientas de IA, y también estoy trabajando para comprender mejor el sistema en su conjunto. Dedico tiempo a seguir el código, entender dónde se define cada comportamiento y explicar mejor las decisiones del proyecto. Ese aprendizaje está en curso. Quiero relacionar lo que muestra el sitio con los datos y el código que lo producen, y hacer cambios con una comprensión más sólida de sus consecuencias.',
								},
								id: '3c58de0dc2d5e56d-18',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El proyecto reúne varias partes de mi trabajo como desarrollador freelance de soluciones digitales: partir de una pregunta útil, organizar fuentes imperfectas, construir una interfaz comprensible y mantener visibles sus límites. Los siguientes pasos tienen que ver tanto con la confiabilidad y la sencillez del sistema como con la claridad de lo que las personas pueden entender a través de él.',
								},
								id: '1c4a3122d2efd449-19',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="https://transit.yesid.dev/">Explorar Transit, disponible en francés e inglés</a>',
								},
								id: '20a9a149eec3fb17-20',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'De la pantalla al funcionamiento del sistema',
								},
								id: '1b09fb2b3920f4b7-21',
								type: 'header',
							},
							{
								data: {
									text: 'El mapa es la parte más visible de Transit. Las siguientes secciones explican el trabajo que conecta una predicción, una medida y una versión publicada. Cada una se puede leer por separado y desarrolla un aspecto del sistema, con los cálculos y ejemplos necesarios para entenderlo.',
								},
								id: 'ccc12c7b232f2f1b-22',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: '<em>Un projet personnel d’analyse citoyenne conçu pour plusieurs réseaux de transport, actuellement avec les données de Montréal et d’Ottawa.</em>',
								},
								id: '99509c7b4a54b4a6-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un retard affiché sur une carte semble simple. Pourtant, il faut savoir d’où vient l’information, quand elle a été reçue et ce qu’elle décrit exactement. Est-ce une position signalée? Une prévision de passage? Une observation conservée pour faire un bilan? Ces distinctions changent ce qu’on peut conclure.',
								},
								id: '72207278f045c812-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Je développe Transit pour rendre ces questions plus faciles à explorer. Le site rassemble des données publiques de transport dans une interface en français et en anglais. On peut regarder la situation d’un réseau, consulter une ligne ou un arrêt, explorer une carte et lire les explications derrière les indicateurs. L’architecture est conçue pour accueillir différents fournisseurs de données de transport. La STM à Montréal et OC Transpo à Ottawa sont les deux réseaux actuellement configurés et présentés dans le site, selon les données disponibles pour chacun.',
								},
								id: '3050c2724eddbcb4-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Transit est un projet indépendant. Son rôle est de rendre le fonctionnement du transport plus lisible et de permettre d’examiner les observations. Pour préparer un déplacement ou vérifier un avis urgent, les services officiels des sociétés de transport restent les références.',
								},
								id: 'bff2808d2b611266-3',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Partir d’une question' },
								id: '195c6c8ade021c26-4',
								type: 'header',
							},
							{
								data: {
									text: 'L’entrée dans le site part de questions ordinaires : comment va le réseau, quelle ligne regarder de plus près, qu’est-ce qui a été observé au fil des jours? Cette organisation permet de commencer par ce qui nous intéresse, sans avoir à connaître le nom d’un indicateur ni la structure de la base de données.',
								},
								id: '91bf95eb97847f81-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La carte situe les positions reçues et donne accès aux détails. Les pages de lignes et d’arrêts rapprochent les horaires, les prévisions disponibles et les observations de fiabilité. Les vues de réseau et les bilans quotidiens permettent de prendre du recul. Une page consacrée à la méthode explique ce que les chiffres mesurent, tandis que la santé des données renseigne sur la fraîcheur des sources et les lacunes connues.',
								},
								id: 'e02946ce15ba5536-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ces différents niveaux de lecture se complètent. Une personne peut commencer par un endroit qu’elle connaît, puis regarder une tendance et revenir à la définition du chiffre. Le détail reste accessible sans devenir un passage obligatoire pour tout le monde.',
								},
								id: '091fdffac6b5d990-7',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Deux réseaux, deux contextes' },
								id: '46322e440f07413a-8',
								type: 'header',
							},
							{
								data: {
									text: 'Montréal et Ottawa rendent particulièrement concret le travail sur les sources. Les deux réseaux publient des horaires et des mises à jour, mais leurs données ne sont pas interchangeables. Changer de ville doit aussi changer le contexte de la carte, les lignes, les arrêts et les liens vers l’organisme concerné.',
								},
								id: '87d016c028da8b0a-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ottawa donne un bon exemple de cette exigence. Aucun flux d’avis d’OC Transpo n’est connecté dans Transit. L’interface le dit et propose un lien vers les avis officiels. Afficher zéro avis aurait laissé entendre que le réseau n’avait aucune perturbation, ce que les données ne permettent pas d’affirmer.',
								},
								id: 'c6ca082a75fa911b-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le texte affiché fait partie du code du produit. Dans la version anglaise, ce petit extrait associe le nom du réseau au message et au prochain geste proposé :',
								},
								id: '347a8341d9352c4f-11',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\ntitle: \'Service alerts unavailable\',\nbody: (operator: string) =>\n\t`No ${operator} alert feed is connected here. This does not mean there are no disruptions.`,\nlink: \'Check official service alerts\',\n```',
								},
								id: '64395887d6e23e9c-12',
								type: 'code',
							},
							{
								data: {
									text: '<code>operator</code> est remplacé par le nom de l’exploitant. Le message distingue un manque d’information d’une absence de perturbations, puis oriente vers la source officielle. Même à cette échelle, écrire l’interface consiste à préciser ce qu’une personne peut raisonnablement comprendre.',
								},
								id: '1e13fed113d1779d-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un autre cas concerne les prévisions de passage. Une prévision peut être disponible pour un trajet même si aucun véhicule associé à ce trajet n’apparaît sur la carte. Le travail sur Ottawa a conduit à préserver cette information dans les pages concernées. La présence d’un marqueur et la présence d’une prévision répondent à deux questions différentes.',
								},
								id: '0e82ffabfcdf74b9-14',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Un projet qui continue de se construire',
								},
								id: 'ecab8c897f9c5472-15',
								type: 'header',
							},
							{
								data: {
									text: 'L’interface s’appuie sur une version identifiée de mon socle de design, yesid.dev-design. Les couleurs, les composants partagés et les comportements d’interface ont ainsi une origine commune. Transit garde toutefois ses propres besoins de lecture : une carte dense, des tableaux, des filtres, des états inconnus et des explications qui doivent rester compréhensibles sur un petit écran.',
								},
								id: '1873bf90fee4d38c-16',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le projet est déployé et continue d’évoluer. Le site public propose des pages pour Montréal et Ottawa, mais cela ne garantit ni la disponibilité permanente de toutes les sources ni l’exhaustivité de leur historique. Des travaux de réparation et de consolidation sont encore en cours. Les vérifications déjà faites conservent leur portée; elles ne remplacent pas tous les essais sur appareils réels ou avec des technologies d’assistance.',
								},
								id: 'e07b96e60acbb1ad-17',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Je développe Transit avec l’appui d’outils d’IA, et je travaille aussi à mieux comprendre le système dans son ensemble. Je prends le temps de suivre le code, de comprendre où chaque comportement est défini et de mieux expliquer les choix du projet. Ce travail d’apprentissage est en cours. Je veux pouvoir relier ce que le site montre à ce qui le produit, puis intervenir avec une compréhension plus solide des conséquences.',
								},
								id: '3c27cfd1bd6264b7-18',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce projet rassemble plusieurs aspects de mon travail de développeur de solutions numériques à la pige : partir d’une question utile, organiser des sources imparfaites, construire une interface lisible et garder les limites visibles. La suite porte autant sur la fiabilité et la simplicité du système que sur la qualité de ce qu’une personne peut en comprendre.',
								},
								id: 'fd4edc2584b9bc94-19',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="https://transit.yesid.dev/fr">Explorer Transit</a>',
								},
								id: '6f12107658fea2e7-20',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'De l’écran aux mécanismes' },
								id: 'dab0494cb57842fd-21',
								type: 'header',
							},
							{
								data: {
									text: 'La carte est la partie la plus visible de Transit. La suite explique le travail qui permet de relier une prévision, un indicateur et une version publiée. Chaque section se lit séparément et développe un aspect du système, avec les calculs et exemples nécessaires pour le comprendre.',
								},
								id: 'b6ceff813eac3ce6-22',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Transit: understanding transit data, network by network',
					es: 'Transit: entender los datos de transporte, red por red',
					fr: 'Transit : comprendre les données du transport, réseau par réseau',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The repository contains three applications with different responsibilities. Their boundaries help trace a problem to the place where it can be explained and corrected.',
								},
								id: 'c8b1dd9cfcc95d66-0',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '<code>apps/db</code> receives data, organizes it in PostgreSQL and prepares the public files. Python handles ingestion, processing, checks and publication.',
											items: [],
										},
										{
											content: '<code>apps/data-proxy</code> is a Cloudflare Worker that serves those files from object storage. It handles HTTP transport: reads, metadata, caching and partial responses.',
											items: [],
										},
										{
											content: '<code>apps/web</code> is the SvelteKit application. It reads published files, validates their structure and presents maps, tables and explanations. It does not need direct access to the processing database.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: '91ae04fbfe673e66-1',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Consider a fictional update to follow the full journey. A feed predicts a stop arrival at 2:07 p.m., while the matching timetable gives 2:03 p.m. This is an illustrative example, not an observed trip in Montréal or Ottawa.',
								},
								id: 'e53a297e33e0b33e-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The first step is to retain the received response. The layer called Bronze keeps the source and its identity. A hash can identify its contents, but content and observation are different: receiving identical bytes at two different times can represent two captures. Deduplicating files without keeping that distinction would remove part of the timeline.',
								},
								id: '72fa05089345324d-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Silver then turns the response into relational records. The loading step receives the exact capture and the bytes just collected. It does not simply ask for “the latest” capture, which might change between those steps. The code checks that the receipt matches the expected provider, endpoint and capture identifier.',
								},
								id: '29d73d9b865b99e5-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Gold brings the records together and prepares measures. In this example, it needs to match the network, the relevant timetable edition, the trip and the stop sequence. If that match succeeds and both times use the same time reference, the predicted delay is 240 seconds. If the timetable cannot be linked to the prediction, the predicted arrival can remain available while its delay remains unknown.',
								},
								id: '8ea0fdaed8d3ebc0-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Published files make the information available to readers. A page can then show the arrival prediction, its context and, when it can be calculated, the associated delay. The presence of a prediction does not require a corresponding vehicle to appear on the map.',
								},
								id: '00bec91800bc4337-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Each stage keeps its own execution evidence. Capture can succeed while loading fails; loading can succeed while publication fails. Those differences matter when deciding where to resume work. A single green light for the entire pipeline would hide the last stage that was actually completed.',
								},
								id: '75182d960579662a-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El repositorio está organizado en tres aplicaciones con responsabilidades distintas. Esa separación ayuda a seguir un problema hasta el lugar donde se puede explicar y corregir.',
								},
								id: 'f1114944b34d0116-0',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '<code>apps/db</code> recibe los datos, los organiza en PostgreSQL y prepara los archivos públicos. Python se encarga de la ingesta, el procesamiento, las verificaciones y la publicación.',
											items: [],
										},
										{
											content: '<code>apps/data-proxy</code> es un Worker de Cloudflare que entrega esos archivos desde el almacenamiento de objetos. Se ocupa del transporte HTTP: lecturas, metadatos, caché y respuestas parciales.',
											items: [],
										},
										{
											content: '<code>apps/web</code> es la aplicación de SvelteKit. Consulta los archivos publicados, valida su estructura y presenta los mapas, las tablas y las explicaciones. No necesita consultar directamente la base donde se procesan los datos.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: '56a453a6857eb0fe-1',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Pensemos en una actualización ficticia para seguir el recorrido completo. Un flujo estima que un vehículo pasará por una parada a las 2:07 p. m., mientras que el horario correspondiente indica las 2:03 p. m. Es un ejemplo ilustrativo, no un recorrido observado en Montreal u Ottawa.',
								},
								id: 'a888b01b882afc60-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El primer paso consiste en conservar la respuesta recibida. La capa llamada Bronze guarda la fuente y su identidad. Una huella digital permite reconocer el contenido, pero el contenido y la observación son cosas distintas: recibir los mismos bytes en dos momentos puede representar dos capturas. Eliminar archivos repetidos sin conservar esa diferencia borraría una parte de la secuencia temporal.',
								},
								id: '60ce4f22e9ca4b72-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La capa Silver convierte la respuesta en registros relacionales. El proceso de carga recibe la captura exacta y los bytes que se acaban de recoger. No vuelve a pedir simplemente «la más reciente», porque podría haber cambiado entre ambos pasos. El código verifica que el comprobante corresponda al proveedor, al punto de entrada y al identificador de captura esperados.',
								},
								id: 'a7f2d5f201f4f0f4-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En Gold se relacionan los registros y se preparan las medidas. Para este ejemplo, hay que encontrar la misma red, la edición pertinente del horario, el recorrido y la secuencia de la parada. Si esa relación es válida y las horas usan la misma referencia temporal, el retraso previsto es de 240 segundos. Si no se puede relacionar el horario con la predicción, la hora estimada puede seguir disponible mientras el retraso permanece desconocido.',
								},
								id: '3cb47418147e0095-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los archivos publicados hacen que esa información se pueda consultar. Una página puede mostrar la estimación de llegada, su contexto y, cuando se puede calcular, el retraso asociado. No hace falta que aparezca un vehículo correspondiente en el mapa para que exista una predicción.',
								},
								id: '8db9e861e7819895-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cada etapa conserva su propia evidencia de ejecución. La captura puede funcionar aunque falle la carga; la carga puede funcionar aunque falle la publicación. Esas diferencias importan para retomar el trabajo en el lugar correcto. Un único indicador verde para toda la cadena ocultaría cuál fue la última etapa realmente completada.',
								},
								id: '556c16c019dc5467-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le dépôt est organisé autour de trois applications qui ont des responsabilités différentes. Cette séparation aide à suivre un problème jusqu’à l’endroit où il peut être expliqué et corrigé.',
								},
								id: 'e1449e2af0fee352-0',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: '<code>apps/db</code> reçoit les données, les organise dans PostgreSQL et prépare les fichiers publics. Python porte l’ingestion, les traitements, les contrôles et la publication.',
											items: [],
										},
										{
											content: '<code>apps/data-proxy</code> est un Worker Cloudflare qui sert ces fichiers à partir du stockage d’objets. Il s’occupe du transport HTTP : lecture, métadonnées, cache et réponses partielles.',
											items: [],
										},
										{
											content: '<code>apps/web</code> est l’application SvelteKit. Elle consulte les fichiers publiés, valide leur structure et présente les cartes, les tableaux et les explications. Elle n’a pas besoin d’interroger directement la base de traitement.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: '64f3c9b3098f8868-1',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Prenons une mise à jour fictive pour suivre le parcours complet. Un flux annonce un passage à 14 h 07 à un arrêt, alors que l’horaire correspondant prévoit 14 h 03. Cet exemple est illustratif; il ne décrit pas un trajet observé à Montréal ou à Ottawa.',
								},
								id: '093ee4d35d9fee18-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La première étape consiste à conserver la réponse reçue. La couche appelée Bronze garde la source et son identité. Un condensat permet de reconnaître son contenu, mais le contenu et l’observation ne sont pas la même chose : recevoir deux fois les mêmes octets à deux moments différents peut représenter deux captures. Dédupliquer les fichiers sans conserver cette distinction ferait disparaître une partie de la chronologie.',
								},
								id: '5e545c81b71bc3f8-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La couche Silver transforme ensuite la réponse en données relationnelles. Le chargement reçoit la capture exacte et les octets qui viennent d’être recueillis. Il ne redemande pas simplement « la plus récente », qui pourrait avoir changé entre les deux étapes. Le code vérifie que le reçu correspond au fournisseur, au point d’entrée et à l’identifiant de capture attendus.',
								},
								id: '8d11f525f0c7e613-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Dans Gold, les données sont rapprochées et les mesures sont préparées. Pour notre exemple, il faut retrouver le même réseau, la bonne édition de l’horaire, le trajet et la séquence de l’arrêt. Si le rapprochement réussit et que les heures sont exprimées dans le même référentiel, le retard prévu est de 240 secondes. Si l’horaire ne peut pas être relié à la prévision, l’heure de passage peut rester disponible tandis que le retard demeure inconnu.',
								},
								id: '592a50350e8ba012-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les fichiers publiés rendent cette information consultable. Une page peut alors montrer la prévision de passage, son contexte et, lorsqu’il est calculable, le retard associé. L’existence d’une prévision n’exige pas qu’un véhicule correspondant soit visible sur la carte.',
								},
								id: 'af06771094e92176-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Chaque étape garde sa propre trace d’exécution. Une capture peut réussir alors que son chargement échoue; un chargement peut réussir alors que la publication échoue. Ces différences comptent pour reprendre le travail au bon endroit. Un simple voyant vert pour toute la chaîne masquerait le dernier état réellement atteint.',
								},
								id: '42f21e05a6ad0d92-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Three applications, from a received feed to a page someone can read',
					es: 'Tres aplicaciones: del flujo recibido a la página que se consulta',
					fr: 'Trois applications, du flux reçu à la page consultée',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A trip identifier only makes sense in context. Two providers can use the same value. One provider can publish a new timetable edition. A capture contains multiple entities, and a trip update contains multiple stop updates. Joins therefore need the provider, relevant edition, capture, entity and stop sequence at the appropriate level.',
								},
								id: 'a99819b0fcd6ef7c-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The same precision applies to the public catalogue. A network can be active for ingestion without being ready to appear in the interface. The catalogue builder checks the published identity, time zone, geographic boundaries and required map objects. This excerpt compares three manifest values with the configuration:',
								},
								id: 'dc2d63da87909a28-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\nif (manifest.provider, manifest.tz, manifest.bbox) != (\n    provider_id,\n    identity.timezone,\n    identity.bounds.bbox(),\n):\n    raise ValueError("Published identity/geography differs from configuration")\n```',
								},
								id: 'fa953c878c4bcd5a-2',
								type: 'code',
							},
							{
								data: {
									text: 'A mismatch stops the catalogue build with an error. The check does not try to guess which source is right. It prevents an incompatible identity and geography from being presented together.',
								},
								id: '70e50557e7150e66-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This structure is intended to make Transit independent of any particular provider. The registry loads YAML files from the configuration directory and distinguishes active networks from those ready to appear publicly. Each manifest describes an identity, time zone, geographic bounds, sources, formats, refresh intervals and access methods. A GTFS timetable is required; positions, predictions and alerts are optional inputs. Declaring a network therefore does not make every feature available.',
								},
								id: '0a024ddf6eb0128f-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Shared collection and normalization processes receive that identity; the database and published files retain the network to which the data belongs. Publication contracts, the catalogue and the interface allow the same reading journey to be reused. Some sources still need specific handling. The STM geographic package and its i3 alerts have their own formats, while OC Transpo includes route shapes in its GTFS timetable and uses a different authentication header for realtime data. Those differences belong in the components that handle them.',
								},
								id: 'ba6d540258dcff96-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Adding a city requires checking the actual sources, their reuse conditions and attribution, then configuring access without publishing secrets. Trip and stop identifiers also need to match correctly between the timetable and updates. An unsupported format or authentication method may require additional code. Operation needs a prepared database, storage, access permissions and scheduled collection. Configuration alone does not provide those resources.',
								},
								id: '82c24adbe16819af-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Public presentation follows: a consistent published identity, an available basemap, suitable framing, French and English labels, official links and a valid catalogue. Repository tests include a synthetic provider distinct from the two current networks and publication rejection when its map or identity is inconsistent. They make that extension testable; their presence does not establish that another city has been integrated or that these tests have just been run.',
								},
								id: '862e270ce7f21d31-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Storage is still configured for the deployment, with separate paths for each provider. The catalogue does not let each contributor connect their own storage and credentials to the same hosted interface. That federation would require additional design. Other limitations remain: some shared time-display functions still use <code>America/Toronto</code>, and the default operating configuration retains STM-specific settings and a pruning service. The STM endpoint discussed later is another current dependency.',
								},
								id: 'a22d3de027393cb6-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Eventually, I want other people to be able to help add cities, sources and the resources needed to operate them. That work could involve an API, storage, adaptations or verification. It is a direction for the project’s development, not an automatic signup service.',
								},
								id: 'c18a4afaa4acecdf-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Geography also serves several purposes. A position locates a reported vehicle. Timetable shapes describe route geometry. A basemap supplies visual context. Bounds and framing determine the area to display. Ottawa has shapes within its timetable without requiring a separate geographic feed for each of these purposes. Treating the basemap as the source of the vehicle positions would erase that distinction.',
								},
								id: '4495c3b1847ea938-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Five time references are useful: the trip’s service date, the feed timestamp, the measurement time of a position, Transit’s capture time and the file’s publication time. A response captured at noon can contain a position measured at 11:56 a.m. Collection has just happened, but the position is already four minutes old. Reloading the page does not change its age.',
								},
								id: '3a6dbca3b51d7d8f-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Service timetables introduce another complication. A value such as 25:10:00 refers to a time beyond the first 24 hours of a service day. Reducing it to 01:10:00 without retaining the service date can move the trip to the wrong day. Processing keeps these times as elapsed offsets and uses the provider’s time zone. For derived delays, the code builds its time origin from local noon minus twelve hours to handle daylight-saving transition days under that convention.',
								},
								id: 'bfdb0916ea9f50b1-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The appropriate date also depends on the question. Some summaries group observations by local capture date. Other joins require the service day. Those calendars can differ after midnight. Naming the period being displayed is therefore part of defining the measure.',
								},
								id: '214f8741bfb907ab-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Un identificador de recorrido solo tiene sentido dentro de su contexto. Dos proveedores pueden usar el mismo valor. Un proveedor puede publicar una nueva edición de su horario. Una captura contiene varias entidades, y una actualización de recorrido contiene varias actualizaciones de paradas. Por eso, las relaciones deben incluir el proveedor, la edición correspondiente, la captura, la entidad y la secuencia de parada, según el nivel que se esté procesando.',
								},
								id: '839fe5e55576c341-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esa precisión también se aplica al catálogo público. Una red puede estar activa para la ingesta sin estar lista para aparecer en la interfaz. El constructor del catálogo revisa, entre otras cosas, la identidad publicada, la zona horaria, los límites geográficos y la presencia de los objetos cartográficos necesarios. Este fragmento compara tres valores del manifiesto con la configuración:',
								},
								id: 'ea897f83d10e52f0-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\nif (manifest.provider, manifest.tz, manifest.bbox) != (\n    provider_id,\n    identity.timezone,\n    identity.bounds.bbox(),\n):\n    raise ValueError("Published identity/geography differs from configuration")\n```',
								},
								id: 'fa953c878c4bcd5a-2',
								type: 'code',
							},
							{
								data: {
									text: 'Si hay una diferencia, la construcción del catálogo se detiene con un error. La verificación no intenta adivinar cuál fuente es correcta. Evita presentar juntas una identidad y una geografía incompatibles.',
								},
								id: '6932842e9e685483-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esta organización busca que Transit sea independiente de un proveedor particular. El registro carga los archivos YAML del directorio de configuración y distingue las redes activas de las que están listas para mostrarse. Cada manifiesto describe una identidad, una zona horaria, límites geográficos, fuentes, formatos, frecuencias y formas de acceso. Se exige un horario GTFS; las posiciones, las estimaciones y los avisos son entradas opcionales. Declarar una red no significa que todas las funciones estén disponibles.',
								},
								id: 'e7f2195a5c2ae4ae-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los procesos compartidos de recolección y normalización reciben esa identidad; la base y los archivos publicados conservan la red a la que pertenecen los datos. Los contratos de publicación, el catálogo y la interfaz permiten reutilizar el mismo recorrido de consulta. Algunas fuentes sí requieren una adaptación específica. El paquete geográfico de la STM y sus avisos i3 tienen formatos propios, mientras que OC Transpo incluye los trazados en su horario GTFS y usa otro encabezado de autenticación para los datos en tiempo real. Esas particularidades deben permanecer en los componentes que las procesan.',
								},
								id: '5ecfa706c239e39a-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Agregar una ciudad exige verificar las fuentes reales, sus condiciones de reutilización y la atribución, y configurar los accesos sin publicar los secretos. También hay que comprobar que los identificadores de recorridos y paradas se relacionen correctamente entre el horario y las actualizaciones. Un formato o una autenticación que no se admite puede requerir código adicional. La operación necesita una base preparada, almacenamiento, permisos de acceso y recolección programada. La configuración por sí sola no proporciona esos recursos.',
								},
								id: '2d1689d8e51ba52f-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La presentación pública viene después: una identidad publicada coherente, un mapa base disponible, un encuadre apropiado, textos en francés e inglés, enlaces oficiales y un catálogo válido. Las pruebas del repositorio incluyen un proveedor sintético distinto de las dos redes actuales y rechazos de publicación cuando su mapa o su identidad no corresponden. Permiten comprobar esa capacidad de extensión; su existencia no demuestra que ya se haya integrado otra ciudad ni que las pruebas se acaben de ejecutar.',
								},
								id: 'edfd3dce46a7da4b-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El almacenamiento sigue configurado para el despliegue, con rutas separadas por proveedor. El catálogo no permite que cada persona conecte su propio almacenamiento y sus propios accesos a la misma interfaz alojada. Esa federación necesitaría un diseño adicional. Persisten otros límites: algunas funciones compartidas para mostrar fechas y horas todavía usan <code>America/Toronto</code>, y la configuración operativa predeterminada conserva parámetros y un servicio de limpieza específicos de la STM. El punto de acceso de la STM que se explica más adelante es otra dependencia actual.',
								},
								id: '654ace8bef4012f7-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A futuro, quiero que otras personas puedan contribuir a agregar ciudades, fuentes y los recursos necesarios para operarlas. Ese trabajo puede incluir una API, almacenamiento, adaptaciones o verificaciones. Es una posibilidad de evolución del proyecto, no un servicio de registro automático.',
								},
								id: '6982878ecad8bd23-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La información geográfica cumple varias funciones. Una posición ubica un vehículo reportado. Las formas del horario describen los trazados. Un mapa base aporta el contexto visual. Los límites y el encuadre determinan qué zona se muestra. Ottawa incluye formas dentro de su horario, sin necesitar un flujo geográfico separado para cada una de esas funciones. Confundir el mapa base con la procedencia de las posiciones borraría esa diferencia.',
								},
								id: 'd1d665b50953f37a-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En cuanto al tiempo, conviene distinguir cinco referencias: la fecha de servicio del recorrido, la hora indicada por el flujo, el momento en que se midió una posición, la hora en que Transit la capturó y la hora de publicación del archivo. Una respuesta recogida al mediodía puede contener una posición medida a las 11:56 a. m. La recolección acaba de ocurrir, pero la posición ya tiene cuatro minutos. Recargar la página no cambia su antigüedad.',
								},
								id: '800d362e3dcb8d90-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los horarios de servicio agregan otra dificultad. Un valor como 25:10:00 representa un momento posterior a las primeras 24 horas del día de servicio. Reducirlo a 01:10:00 sin conservar la fecha de servicio puede ubicar el recorrido en el día equivocado. El procesamiento conserva esas horas como desplazamientos de tiempo transcurrido y utiliza la zona horaria del proveedor. Para calcular retrasos derivados, el código construye su origen temporal a partir del mediodía local menos doce horas, de modo que los días de cambio de hora se traten según esa convención.',
								},
								id: '882982bf4b6897ed-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La fecha apropiada también depende de la pregunta. Algunos balances agrupan las observaciones por fecha local de captura. Otras relaciones necesitan el día de servicio. Esos dos calendarios pueden diferir después de medianoche. Indicar el periodo que se está mostrando forma parte de la definición de un indicador.',
								},
								id: 'f119774118bffc55-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Un identifiant de trajet n’a de sens qu’avec son contexte. Deux fournisseurs peuvent employer la même valeur. Un même fournisseur peut publier une nouvelle édition de son horaire. Une capture contient plusieurs entités, et une mise à jour de trajet contient plusieurs mises à jour d’arrêts. Les clés de rapprochement doivent donc inclure le fournisseur, l’édition concernée, la capture, l’entité et la séquence d’arrêt selon le niveau traité.',
								},
								id: 'a988e882838fdf80-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette précision se retrouve dans le catalogue public. Un réseau peut être actif pour l’ingestion sans être prêt à être offert dans l’interface. Le constructeur du catalogue vérifie notamment l’identité publiée, le fuseau horaire, les limites géographiques et la présence des objets cartographiques attendus. Cet extrait compare trois valeurs du manifeste avec la configuration :',
								},
								id: '9f884205fc3864fc-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\nif (manifest.provider, manifest.tz, manifest.bbox) != (\n    provider_id,\n    identity.timezone,\n    identity.bounds.bbox(),\n):\n    raise ValueError("Published identity/geography differs from configuration")\n```',
								},
								id: 'fa953c878c4bcd5a-2',
								type: 'code',
							},
							{
								data: {
									text: 'Un désaccord arrête la construction du catalogue avec une erreur. Le contrôle ne cherche pas à deviner quelle source serait la bonne. Il empêche de présenter ensemble une identité et une géographie incompatibles.',
								},
								id: 'f8acb52eb1981bcb-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette organisation vise à rendre Transit indépendant d’un fournisseur particulier. Le registre charge les fichiers YAML du dossier de configuration et distingue les réseaux actifs de ceux prêts à être affichés. Chaque manifeste décrit une identité, un fuseau horaire, des limites géographiques, des sources, leur format, leur fréquence et leur mode d’accès. Un horaire GTFS est requis; les positions, les prévisions et les avis sont des entrées facultatives. Déclarer un réseau ne signifie donc pas que toutes les fonctions seront disponibles.',
								},
								id: 'd4eaa81525303f0a-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les traitements communs de collecte et de normalisation reçoivent cette identité; la base et les fichiers publiés conservent le réseau auquel les données appartiennent. Les contrats de publication, le catalogue et l’interface permettent de réutiliser le même parcours de consultation. Certaines sources demandent toutefois une adaptation précise. Le paquet géographique de la STM et ses avis i3 ont leurs propres formats, tandis qu’OC Transpo fournit ses tracés dans son horaire GTFS et utilise un autre en-tête d’authentification pour le temps réel. Ces particularités doivent rester aux endroits qui les traitent.',
								},
								id: '9fdb3e51721a6086-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ajouter une ville suppose donc de vérifier les sources réelles, leurs conditions de réutilisation et l’attribution, puis de configurer les accès sans publier les secrets. Il faut aussi vérifier que les identifiants des trajets et des arrêts se rapprochent correctement entre l’horaire et les mises à jour. Un format ou une authentification non pris en charge peut demander du code supplémentaire. L’exploitation exige une base préparée, du stockage, des droits d’accès et une collecte planifiée. La configuration seule ne fournit pas ces ressources.',
								},
								id: '82531ee0fd83ca86-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La présence publique vient ensuite : identité publiée cohérente, fond de carte disponible, cadrage adapté, libellés français et anglais, liens officiels et catalogue valide. Les tests du dépôt comprennent un fournisseur synthétique distinct des deux réseaux actuels et des refus de publication lorsque sa carte ou son identité est incohérente. Ils rendent cette extension vérifiable; leur présence ne prouve pas qu’une nouvelle ville a déjà été intégrée ni que ces tests viennent d’être exécutés.',
								},
								id: '30a75cd695230613-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le stockage reste configuré pour le déploiement, avec des chemins séparés par fournisseur. Le catalogue ne permet pas à chaque contributeur de brancher son propre stockage et ses propres accès sur la même interface hébergée. Cette fédération demanderait une conception supplémentaire. D’autres limites subsistent : des fonctions communes d’affichage du temps utilisent encore <code>America/Toronto</code>, et la configuration d’exploitation par défaut conserve des paramètres et un service de nettoyage propres à la STM. Le point d’accès STM décrit plus loin représente une autre dépendance actuelle.',
								},
								id: '22b91c58591216fd-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'À terme, je souhaite que d’autres personnes puissent contribuer à ajouter des villes, des sources et les ressources nécessaires pour les exploiter. Ce travail peut porter sur une API, le stockage, les adaptations ou les vérifications. C’est une possibilité d’évolution du projet, pas un service d’inscription automatique.',
								},
								id: '6484adfc5f9f2eb8-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La géographie a aussi plusieurs fonctions. Une position situe un véhicule signalé. Les formes de l’horaire décrivent des tracés. Un fond de carte fournit le contexte visuel. Les limites et le cadrage déterminent la zone à montrer. Ottawa dispose de formes dans son horaire sans avoir besoin d’un flux géographique séparé pour chacune de ces fonctions. Confondre le fond de carte avec la provenance des positions ferait perdre cette distinction.',
								},
								id: '8b8de4570a5f6277-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour le temps, cinq repères sont utiles : la date de service du trajet, l’heure annoncée par le flux, l’heure de mesure d’une position, l’heure de capture par Transit et l’heure de publication du fichier. Une réponse recueillie à midi peut contenir une position mesurée à 11 h 56. La collecte vient d’avoir lieu, mais la position a déjà quatre minutes. Recharger la page ne change pas son âge.',
								},
								id: '07564c87ac28a90a-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les horaires de service compliquent encore le rapprochement. Une valeur comme 25:10:00 représente une heure après la fin des premières 24 heures de la journée de service. La ramener simplement à 01:10:00 sans conserver la date de service peut déplacer le trajet au mauvais jour. Le traitement conserve ces heures comme des décalages écoulés et utilise le fuseau du fournisseur. Pour les retards dérivés, le code construit son origine temporelle à partir de midi local moins douze heures afin de traiter les journées de changement d’heure selon cette convention.',
								},
								id: '8e97c4ca805aa882-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Enfin, le choix de la date dépend de la question. Certains bilans regroupent les observations par date locale de capture. D’autres rapprochements ont besoin du jour de service. Ces deux calendriers peuvent diverger après minuit. Donner le nom de la période affichée fait donc partie de la définition d’un indicateur.',
								},
								id: '737fe6d648422522-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Adding a network: identity, shared contracts and time references',
					es: 'Agregar una red: identidad, contratos compartidos y referencias de tiempo',
					fr: 'Ajouter un réseau : identité, contrats communs et repères temporels',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Transit’s on-time measure describes predicted-delay readings. For routes and daily receipts, an observation belongs to the on-time band when its delay is at least −60 seconds and less than 300 seconds. The denominator contains readings with a known delay.',
								},
								id: '20907b1a94992750-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The formula is <code>on-time percentage = 100 × readings in [−60, 300) / readings with a known delay</code>. The left bracket includes −60; the right parenthesis excludes 300. The publication calculation leaves the result unknown if the numerator is missing or the denominator is not positive:',
								},
								id: 'fd08d6716482df91-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\ndef otp_pct(on_time: SqlNumber | None, known: SqlNumber | None) -> int | None:\n    if on_time is None or not known:\n        return None\n    known_obs = float(known)\n    if known_obs <= 0:\n        return None\n    return int(round_half_away(100.0 * float(on_time) / known_obs, 0))\n```',
								},
								id: '7bdb64be17a41981-2',
								type: 'code',
							},
							{
								data: {
									text: 'Consider seven fictional readings: <strong>−60, 0, 120, 300, 600 and 7,200 seconds, plus one unknown value</strong>. They are used only to explain the calculations, not to report either network’s performance.',
								},
								id: 'bb3cf859c3cf3238-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Six readings have a known delay. The first three belong to the on-time band, giving <strong>100 × 3 / 6 = 50%</strong>. The unknown value is neither zero delay nor an on-time observation. The 7,200-second reading remains in this measure’s denominator.',
								},
								id: '9bc1b8721ca3f903-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Mean delay uses a different population: known delays from −3,600 to +3,600 seconds, including both limits. In this example, 7,200 and the unknown value are excluded. The five remaining values sum to 960 seconds: <strong>960 / 5 = 192 seconds, or 3.2 minutes</strong>. Extreme values are excluded, not replaced with 3,600 seconds. An excluded value could still reflect a real disruption: the filter defines the calculation’s population, rather than certifying the source.',
								},
								id: 'e178fb7df0f4fcce-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Severe-delay share introduces a third distinction. Its numerator counts delays strictly above 300 seconds and no greater than 3,600. For the route, one severe reading out of six known delays gives <strong>16.7%</strong>. For a stop statistic using only the eligible range, one out of five gives <strong>20%</strong>. The difference does not come from another disruption; it comes from the denominator.',
								},
								id: '0f1f492a00f5d6b0-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Exactly 300 seconds belongs to neither the on-time band nor the severe-delay numerator. The two percentages should not be added with the expectation that they cover every case.',
								},
								id: 'b51d4ab53e7e7dbe-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Combining groups also requires the right inputs. Suppose group A has 600 seconds of accumulated delay across two observations, and group B has 300 seconds across three. The pooled result is <strong>900 / 5 = 180 seconds</strong>, or three minutes. Averaging the two group means, 300 and 100 seconds, would give 200 seconds by assigning equal weight to groups of different sizes.',
								},
								id: '1090830dbd1f28f4-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That is why the summaries retain sums and counts, then convert and round the final result. An older, already-rounded mean is not enough to recover an exact sum. If a required contributing hour cannot be reconstructed, a daily summary may remain unavailable.',
								},
								id: '4764cecb8d34b0d4-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The same discipline applies to cancellations. Their rate concerns trip-days reported by the feed, grouped by trip identifier and service date, some of which were explicitly marked cancelled. It does not cover every trip in the timetable. Comparing observed and scheduled volumes is another calculation: a shortfall in counts does not identify which trips are missing.',
								},
								id: '1e20d5a93ec23283-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La puntualidad de Transit describe observaciones de retrasos previstos. Para las rutas y los balances diarios, una observación está dentro de la franja «a tiempo» cuando su retraso es de al menos −60 segundos y menor que 300 segundos. El denominador contiene las observaciones cuyo retraso se conoce.',
								},
								id: '7f355274cc8dc66a-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La fórmula es <code>puntualidad (%) = 100 × observaciones en [−60, 300) / observaciones con retraso conocido</code>. El corchete de la izquierda incluye −60; el paréntesis de la derecha excluye 300. El cálculo de publicación deja el resultado como desconocido si falta el numerador o si el denominador no es positivo:',
								},
								id: 'd23ac079afdc56b8-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\ndef otp_pct(on_time: SqlNumber | None, known: SqlNumber | None) -> int | None:\n    if on_time is None or not known:\n        return None\n    known_obs = float(known)\n    if known_obs <= 0:\n        return None\n    return int(round_half_away(100.0 * float(on_time) / known_obs, 0))\n```',
								},
								id: '7bdb64be17a41981-2',
								type: 'code',
							},
							{
								data: {
									text: 'Consideremos siete observaciones ficticias: <strong>−60, 0, 120, 300, 600 y 7.200 segundos, más un valor desconocido</strong>. Este conjunto sirve únicamente para explicar los cálculos; no describe el desempeño de ninguna de las dos redes.',
								},
								id: 'd52bfe0fb58879cb-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Seis observaciones tienen un retraso conocido. Las tres primeras pertenecen a la franja a tiempo, de modo que la puntualidad es <strong>100 × 3 / 6 = 50 %</strong>. El valor desconocido no representa un retraso de cero ni una observación puntual. El valor de 7.200 segundos permanece en el denominador de esta medida.',
								},
								id: '024e1cc85d78f38e-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El retraso promedio utiliza otra población: retrasos conocidos entre −3.600 y +3.600 segundos, con ambos límites incluidos. En el ejemplo se excluyen 7.200 y el valor desconocido. Los cinco valores restantes suman 960 segundos: <strong>960 / 5 = 192 segundos, es decir, 3,2 minutos</strong>. Los valores extremos se excluyen del cálculo; no se reemplazan por 3.600 segundos. Un valor excluido podría corresponder a una interrupción real: el filtro define la población del cálculo, pero no certifica la fuente.',
								},
								id: '8691f5a41bed02c7-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La proporción de retrasos graves introduce una tercera diferencia. Su numerador cuenta retrasos estrictamente mayores que 300 segundos y de hasta 3.600 segundos. Para la ruta, queda un caso grave entre seis retrasos conocidos, equivalente a <strong>16,7 %</strong>. Para una estadística por parada que solo usa el rango admisible, queda un caso entre cinco, equivalente a <strong>20 %</strong>. La diferencia no se debe a una nueva interrupción, sino al denominador.',
								},
								id: '6813d0f83cce3237-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un retraso de exactamente 300 segundos no está dentro de la franja a tiempo ni en el numerador de retrasos graves. Por eso, no se deben sumar ambos porcentajes suponiendo que abarcan todos los casos.',
								},
								id: 'eae058acbf012e86-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'También hay que reunir los elementos correctos antes de calcular un promedio. Supongamos que el grupo A acumula 600 segundos de retraso en dos observaciones, y el grupo B acumula 300 segundos en tres. El resultado conjunto es <strong>900 / 5 = 180 segundos</strong>, o tres minutos. Promediar los promedios de 300 y 100 segundos daría 200 segundos, al asignar el mismo peso a grupos de tamaños distintos.',
								},
								id: '3cbaa0da3b6d511a-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Por eso los resúmenes conservan sumas y conteos, y solo convierten y redondean el resultado al final. Un promedio antiguo que ya fue redondeado no permite recuperar una suma exacta. Si no se puede reconstruir una hora necesaria que contribuye al cálculo, el resumen diario puede quedar no disponible.',
								},
								id: '6a230839f6bf5a31-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La misma disciplina se aplica a las cancelaciones. Su tasa corresponde a días-recorrido reportados por el flujo, agrupados por identificador y fecha de servicio, algunos de los cuales fueron marcados explícitamente como cancelados. No abarca todos los recorridos del horario. Comparar volúmenes observados y programados sigue siendo otro cálculo: una diferencia entre conteos no identifica cuáles recorridos faltan.',
								},
								id: '1bfea75c4ce51060-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La ponctualité de Transit décrit des relevés de retard prévu. Pour les lignes et les bilans quotidiens, une observation est dans la bande « à l’heure » lorsque son retard est d’au moins −60 secondes et de moins de 300 secondes. Le dénominateur comprend les relevés dont le retard est connu.',
								},
								id: '71e07b62a68bf67d-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La formule est : <code>ponctualité (%) = 100 × relevés dans [−60, 300) / relevés à retard connu</code>. Le crochet à gauche inclut −60; la parenthèse à droite exclut 300. Le calcul de publication garde un résultat inconnu si le numérateur manque ou si le dénominateur n’est pas positif :',
								},
								id: 'c43600feafec31a3-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```python\ndef otp_pct(on_time: SqlNumber | None, known: SqlNumber | None) -> int | None:\n    if on_time is None or not known:\n        return None\n    known_obs = float(known)\n    if known_obs <= 0:\n        return None\n    return int(round_half_away(100.0 * float(on_time) / known_obs, 0))\n```',
								},
								id: '7bdb64be17a41981-2',
								type: 'code',
							},
							{
								data: {
									text: 'Considérons sept relevés fictifs : <strong>−60, 0, 120, 300, 600, 7 200 secondes et une valeur inconnue</strong>. Cet ensemble sert uniquement à expliquer les calculs; ce n’est pas une mesure de performance des réseaux.',
								},
								id: '24d329d63403e61b-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Six relevés ont un retard connu. Les trois premiers appartiennent à la bande à l’heure. La ponctualité vaut donc <strong>100 × 3 / 6 = 50 %</strong>. La valeur inconnue n’est ni un retard nul ni une observation à l’heure. La valeur de 7 200 secondes reste, dans cette mesure, au dénominateur.',
								},
								id: '4458c4e8478db264-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le retard moyen utilise une autre population : les retards connus entre −3 600 et +3 600 secondes, bornes incluses. Dans notre exemple, 7 200 et la valeur inconnue sont exclus. La somme des cinq valeurs restantes vaut 960 secondes; <strong>960 / 5 = 192 secondes, soit 3,2 minutes</strong>. Les valeurs extrêmes sont exclues du calcul, pas remplacées par une valeur de 3 600 secondes. Une valeur exclue peut néanmoins correspondre à une perturbation réelle : le filtre définit une population de calcul, il ne certifie pas la source.',
								},
								id: '582787a623ae14fd-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La part des retards graves ajoute une troisième distinction. Son numérateur compte les retards strictement supérieurs à 300 secondes et au plus égaux à 3 600. Pour la ligne, il reste un cas grave sur six retards connus, soit <strong>16,7 %</strong>. Pour une statistique par arrêt utilisant seulement la plage admissible, il reste un cas sur cinq, soit <strong>20 %</strong>. Ce changement ne vient pas d’une nouvelle perturbation; il vient du dénominateur.',
								},
								id: 'e00ef1b04e63d470-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Exactement 300 secondes n’est ni dans la bande à l’heure ni dans le numérateur des retards graves. Les deux pourcentages ne doivent donc pas être additionnés en supposant qu’ils couvrent tous les cas.',
								},
								id: '07731870ef6c0f3b-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Il faut aussi regrouper les bons éléments avant de calculer une moyenne. Imaginons un groupe A avec 600 secondes de retard cumulées sur deux observations, et un groupe B avec 300 secondes sur trois observations. Le résultat groupé est <strong>900 / 5 = 180 secondes</strong>, soit trois minutes. Faire la moyenne des moyennes de 300 et de 100 secondes donnerait 200 secondes, en accordant le même poids à des groupes de tailles différentes.',
								},
								id: '959766e487c97544-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'C’est pourquoi les résumés conservent des sommes et des comptes, puis convertissent et arrondissent le résultat à la fin. Une ancienne moyenne déjà arrondie ne suffit pas à retrouver une somme exacte. Lorsqu’une heure contributrice nécessaire ne peut pas être reconstruite, le résumé quotidien peut rester indisponible.',
								},
								id: 'd150002f5c9eeecb-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La même discipline s’applique aux annulations. Leur taux porte sur les jours-trajets rapportés par le flux, regroupés par identifiant et date de service, dont certains ont été explicitement marqués annulés. Il ne porte pas sur tous les trajets de l’horaire. La comparaison entre volumes observés et programmés reste un autre calcul : un écart de compte ne permet pas de nommer les trajets manquants.',
								},
								id: 'e60dd6d0052f3bfe-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'On-time observations, mean delay and denominators: a worked example',
					es: 'Puntualidad, retraso promedio y denominadores: un ejemplo calculado',
					fr: 'Ponctualité, retard moyen et dénominateurs : un exemple calculé',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A mean does not describe a whole distribution. Transit also uses percentiles. The median, or p50, locates the middle of the observations; p90 describes another position in their distribution. It does not promise that the next journey will stay below that value.',
								},
								id: 'af77669a6c30ee23-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For daily percentiles, known delays within −3,600 to +3,600 seconds are sorted, then the calculation interpolates between values. With four fictional values of <strong>0, 60, 180 and 600 seconds</strong>, the median lies halfway between 60 and 180: <strong>120 seconds</strong>. For p90, the position is <code>(4 − 1) × 0.9 = 2.7</code>, counting from zero. Moving 70% of the way between the third and fourth values gives <strong>180 + 0.7 × (600 − 180) = 474 seconds</strong>, or 7.9 minutes.',
								},
								id: '97831f2fa926724e-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For longer windows, pooled histograms support estimates from ranges of values. That differs from calculating an exact percentile over all the raw observations. Averaging daily p90 values cannot reconstruct a period’s p90 either. The period, population and method need to stay attached to the displayed value.',
								},
								id: 'c46e353abfc963d3-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Gaps between trips address a different question. The system uses first eligible captures within the same route, direction, service day and shift. Eligibility requires a known predicted delay between −3,600 and +3,600 seconds, inclusive. Windowed series exclude weekend service. The scheduled reference comes from the current GTFS timetable on a representative weekday. Gaps must be positive and below 240 minutes. These are appearances in the feed, not physically measured arrivals at a stop. Interrupted collection or a trip that never appears can change the sample.',
								},
								id: '82707c077d5dd8ec-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The wait model uses gap sums and squared-gap sums: <code>AWT = sum(gap²) / (2 × sum(gap))</code>, with gaps in minutes. It then subtracts half the scheduled gap and clamps a negative result to zero.',
								},
								id: 'd2808d8bb26c41d0-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A second illustrative example shows the effect. Two regular gaps of 10 and 10 minutes give <code>200 / 40 = 5 minutes</code>. Two gaps of 5 and 15 minutes have the same ten-minute mean but give <code>250 / 40 = 6.25 minutes</code>. Against a ten-minute scheduled reference, the second case has a modelled excess of 1.25 minutes, published as <strong>1.3 minutes</strong> after rounding.',
								},
								id: '89938da415a7ce59-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Squaring the gaps gives longer intervals more weight. The model assumes uniform rider arrivals during those intervals, without ridership data. It illustrates the effect of irregularity; it does not measure anyone’s actual wait. Older rows without these moments may use a different proxy based on the difference between medians. A summary that averages available shifts is also different from pooling every gap across a day.',
								},
								id: '0615cfce11b15b51-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Sampling remains central. If one trip supplies nine readings and another supplies one, the first carries nine times the weight in an observation-based measure. A percentage of 90% could therefore describe nine similar predictions for one trip. It describes neither nine passengers in ten nor a proportion of trips that arrived on time.',
								},
								id: 'a0043d17c9fcf75c-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Rankings also use sample qualifications and, in some views, Wilson bounds. The code uses <code>z = 1.96</code>; some rankings require at least 30 eligible observations. These methods account for observation volume in the calculation, but repeated predictions are not independent trials. They do not establish 95% statistical coverage for the real network. Missing occupancy data, meanwhile, remains unknown occupancy rather than evidence of an empty vehicle.',
								},
								id: 'c47e97cf840aebea-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Un promedio no describe toda una distribución. Transit también utiliza percentiles. La mediana, o p50, ubica el centro de las observaciones; el p90 describe otra posición dentro de su distribución. No promete que el siguiente desplazamiento vaya a quedar por debajo de ese valor.',
								},
								id: '5ef66aa0b6d270b9-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para los percentiles diarios se ordenan los retrasos conocidos entre −3.600 y +3.600 segundos, y el cálculo interpola entre los valores. Con cuatro valores ficticios de <strong>0, 60, 180 y 600 segundos</strong>, la mediana queda a mitad de camino entre 60 y 180: <strong>120 segundos</strong>. Para el p90, la posición es <code>(4 − 1) × 0,9 = 2,7</code>, contando desde cero. Se avanza un 70 % entre el tercer y el cuarto valor: <strong>180 + 0,7 × (600 − 180) = 474 segundos</strong>, o 7,9 minutos.',
								},
								id: '9093c034b6541d52-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para ventanas más largas, los histogramas agrupados permiten hacer estimaciones a partir de rangos de valores. Es distinto de calcular un percentil exacto sobre todas las observaciones originales. Promediar los p90 diarios tampoco reconstruye el p90 de un periodo. El periodo, la población y el método deben mantenerse asociados al valor mostrado.',
								},
								id: 'd3ff231370c9eb7a-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los intervalos entre recorridos responden a otra pregunta. El sistema utiliza primeras capturas admisibles dentro de la misma ruta, dirección, jornada de servicio y franja horaria. Una captura solo es admisible si su retraso previsto es conocido y está entre −3.600 y +3.600 segundos, con ambos límites incluidos. Las series por ventana excluyen el servicio de fin de semana. La referencia programada viene del horario GTFS actual, para un día de semana representativo. Los intervalos deben ser positivos y menores que 240 minutos. Son apariciones en el flujo, no llegadas medidas físicamente en una parada. Una interrupción de la recolección o un recorrido que nunca aparece puede cambiar la muestra.',
								},
								id: 'd864ed286f44372e-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El modelo de espera utiliza la suma de los intervalos y la suma de sus cuadrados: <code>AWT = suma(intervalo²) / (2 × suma(intervalo))</code>, con los intervalos en minutos. Luego resta la mitad del intervalo programado y lleva a cero un resultado negativo.',
								},
								id: '1ae543b4a30823bc-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un segundo ejemplo ilustrativo permite ver el efecto. Dos intervalos regulares de 10 y 10 minutos dan <code>200 / 40 = 5 minutos</code>. Dos intervalos de 5 y 15 minutos tienen el mismo promedio de diez minutos, pero dan <code>250 / 40 = 6,25 minutos</code>. Frente a una referencia programada de diez minutos, el exceso modelado del segundo caso es de 1,25 minutos, publicado como <strong>1,3 minutos</strong> después del redondeo.',
								},
								id: '572acc4e44ec779c-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Elevar al cuadrado los intervalos da más peso a los más largos. El modelo supone llegadas uniformes de personas durante esos intervalos, sin usar datos de cantidad de pasajeros. Ilustra el efecto de la irregularidad, pero no mide la espera que vivió una persona. Los registros antiguos que no tienen esas sumas pueden usar otro indicador aproximado basado en la diferencia entre medianas. Un resumen que promedia las franjas disponibles tampoco equivale a reunir todos los intervalos de un día.',
								},
								id: '3ac59ea4003aa315-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El muestreo sigue siendo decisivo. Si un recorrido aporta nueve observaciones y otro aporta una, el primero pesa nueve veces más en una medida por observaciones. Un porcentaje de 90 % podría describir nueve predicciones parecidas de un mismo recorrido. No describe nueve pasajeros de cada diez ni se convierte en una proporción de recorridos que llegaron a tiempo.',
								},
								id: '78d1bfcc93c21e17-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las clasificaciones también consideran el tamaño de la muestra y, en algunas vistas, límites de Wilson. El código usa <code>z = 1.96</code>; algunas clasificaciones requieren al menos 30 observaciones admisibles. Estas herramientas incorporan el volumen de observaciones al cálculo, pero las predicciones repetidas no son ensayos independientes. No establecen una garantía de cobertura estadística del 95 % para la red real. Por su parte, un dato de ocupación ausente sigue significando ocupación desconocida, no evidencia de un vehículo vacío.',
								},
								id: 'd7a844ac4e642e11-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Une moyenne ne décrit pas toute une distribution. Transit utilise aussi des percentiles. La médiane, ou p50, situe le milieu des observations; le p90 décrit une autre position dans leur distribution. Il ne promet pas que le prochain déplacement restera sous cette valeur.',
								},
								id: '59710d3d39fe4580-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour les percentiles quotidiens, les retards connus dans la plage de −3 600 à +3 600 secondes sont triés, puis le calcul interpole entre les valeurs. Avec les quatre valeurs fictives <strong>0, 60, 180 et 600 secondes</strong>, la médiane se situe à mi-chemin entre 60 et 180 : <strong>120 secondes</strong>. Pour le p90, la position est <code>(4 − 1) × 0,9 = 2,7</code> en comptant à partir de zéro. On avance de 70 % entre la troisième et la quatrième valeur : <strong>180 + 0,7 × (600 − 180) = 474 secondes</strong>, soit 7,9 minutes.',
								},
								id: 'ecc119ab80b45a43-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour des fenêtres plus longues, les histogrammes regroupés permettent des estimations à partir de classes. Ce n’est pas le même calcul qu’un percentile exact sur toutes les observations brutes. Faire la moyenne de p90 quotidiens ne reconstitue pas non plus le p90 de la période. La période, la population et la méthode doivent rester liées à la valeur présentée.',
								},
								id: 'eca71dd5ee677754-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les intervalles entre trajets posent une autre question. Le système retient des premières captures admissibles dans une même ligne, direction, journée de service et période horaire. Une capture n’est admissible que si son retard prédit est connu et compris entre −3 600 et +3 600 secondes, bornes incluses. Les séries par fenêtre excluent le service de fin de semaine. Le repère prévu provient de l’horaire GTFS actuel, sur une journée de semaine représentative. Les écarts doivent être positifs et inférieurs à 240 minutes. Il s’agit d’apparitions dans le flux, pas d’arrivées physiquement mesurées à un arrêt. Une collecte interrompue ou un trajet jamais signalé peut modifier l’échantillon.',
								},
								id: 'aee77138c688ba11-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le modèle d’attente utilise la somme des écarts et celle de leurs carrés : <code>AWT = somme(écart²) / (2 × somme(écart))</code>, avec les écarts en minutes. Il retranche ensuite la moitié de l’intervalle prévu et ramène un résultat négatif à zéro.',
								},
								id: 'ec572ccec3669c76-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Voici un deuxième exemple illustratif. Deux écarts réguliers de 10 et 10 minutes donnent <code>200 / 40 = 5 minutes</code>. Deux écarts de 5 et 15 minutes ont la même moyenne de dix minutes, mais donnent <code>250 / 40 = 6,25 minutes</code>. Avec un repère prévu de dix minutes, l’excès modélisé du second cas est de 1,25 minute, publié à <strong>1,3 minute</strong> après arrondi.',
								},
								id: '06338bae024b9637-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le carré donne davantage de poids aux grands intervalles. Le modèle suppose des arrivées de personnes uniformes pendant ces intervalles, sans données de fréquentation. Il illustre l’effet de l’irrégularité; il ne mesure pas une attente vécue. Les anciennes lignes sans ces moments peuvent utiliser un autre proxy fondé sur la différence des médianes. Le résumé qui fait la moyenne des périodes disponibles n’est pas non plus un calcul regroupant tous les écarts d’une journée.',
								},
								id: 'c65fe61b81f665c5-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L’échantillonnage reste déterminant. Si un trajet fournit neuf relevés et un autre un seul, le premier pèse neuf fois plus dans une mesure par observations. Un pourcentage de 90 % peut ainsi décrire neuf prédictions semblables du même trajet. Il ne décrit pas neuf voyageurs sur dix et ne devient pas une proportion de trajets ponctuels.',
								},
								id: '84343ee2b0a8b724-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les classements utilisent aussi des qualifications d’échantillon et, pour certaines vues, des bornes de Wilson. Le code emploie <code>z = 1,96</code>; certains classements demandent au moins 30 observations admissibles. Ces outils rendent le volume d’observations visible dans le calcul, mais des prédictions répétées ne sont pas des essais indépendants. Ils ne donnent pas une garantie de couverture statistique de 95 % sur le réseau réel. Une donnée absente sur l’occupation, enfin, reste une occupation inconnue, jamais la preuve d’un véhicule vide.',
								},
								id: '49d2c1401b586e73-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Variation, gaps and observation bias',
					es: 'Variación, intervalos y sesgos de observación',
					fr: 'Variabilité, intervalles et biais d’observation',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The site reads three families of data. Static data describes networks, routes, stops and geographic objects. Live data carries recent positions, predictions and states. History serves retained periods and summaries. These families have different rates of change and different ways of becoming visible.',
								},
								id: 'af1aad90ade3e85d-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Contracts describe the files’ structure. Other metadata identifies the methodology and publication generation. A schema version tells a consumer how to read a document; a methodology version identifies the meaning of its calculation; a generation identifier associates results with a publication. Combining those roles would make changes harder to interpret.',
								},
								id: 'ed0febecd653a368-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'On the PostgreSQL side, publication uses a transaction with <code>REPEATABLE READ</code> isolation. It can read a consistent database state while preparing the output. An advisory lock for each provider and publication family prevents competing publishers from taking the same lane simultaneously. This does not turn database writes and object-storage writes into one distributed transaction.',
								},
								id: 'd5be80a7854ed789-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For live data, child files are written before the manifest, which acts as a completion marker. Imagine five files to write: four are replaced, then the fifth fails. The previous manifest may remain, but some direct addresses can already return the new files. Writing the manifest last therefore does not mean that all files are replaced atomically.',
								},
								id: 'e55659fb9f9db261-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Live checks are recorded without systematically blocking availability. In the normal static path, data is checked before upload. Those are different operating policies that need to remain visible when simplifying the code.',
								},
								id: '6644eb317a74e02a-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'History uses another boundary. Child files are immutable, and their reference graph is prepared before its root is activated. The new root is activated only if the previous version still matches the expected version. This is a conditional write: if another publisher changed the root in the meantime, the operation encounters a conflict instead of silently overwriting that work.',
								},
								id: '775a594f404aee9f-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A reader following a coherent root and its immutable children can therefore use a stable generation while another is being prepared. Newly written objects may exist without belonging to the announced version. Compatibility addresses retain their own behaviour; the graph’s guarantee does not automatically extend to every URL.',
								},
								id: '1c338fdc2701c41f-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This approach lets the site serve files without asking the database to repeat its calculations for each visitor. In exchange, the system must manage publication, retained objects, failures and active references. The consistency available to a reader depends on the data family and how its references are followed.',
								},
								id: '65b1ba9d0f26cfee-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El sitio consulta tres familias de datos. Los estáticos describen, entre otras cosas, redes, rutas, paradas y objetos geográficos. Los datos en tiempo real contienen posiciones, predicciones y estados recientes. El histórico sirve los periodos conservados y los balances. Estas familias cambian a ritmos distintos y se vuelven visibles de maneras diferentes.',
								},
								id: '326becaba9351051-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los contratos describen la estructura de los archivos. Otros metadatos identifican la metodología y la generación publicada. Una versión de esquema indica cómo leer un documento; una versión de metodología sitúa el significado del cálculo; un identificador de generación asocia resultados con una publicación. Confundir esas funciones haría más difícil interpretar una evolución del sistema.',
								},
								id: 'de91479b3a51c9cd-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En PostgreSQL, la publicación trabaja dentro de una transacción con aislamiento <code>REPEATABLE READ</code>. Puede leer un estado coherente de la base mientras prepara los resultados. Un bloqueo consultivo por proveedor y familia de publicación impide que dos publicadores ocupen simultáneamente esa misma vía. Esto no convierte las escrituras en la base y en el almacenamiento de objetos en una única transacción distribuida.',
								},
								id: '505e275f155e7dca-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para los datos en tiempo real, los archivos hijos se escriben antes que el manifiesto, que sirve como referencia de finalización. Imaginemos cinco archivos por escribir: cuatro se reemplazan y el quinto falla. El manifiesto anterior puede permanecer, pero algunas direcciones directas ya pueden devolver archivos nuevos. Escribir el manifiesto al final no significa reemplazar todos los archivos de manera atómica.',
								},
								id: 'e673594832b7fbe0-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las verificaciones del tiempo real quedan registradas sin bloquear sistemáticamente su disponibilidad. En el recorrido normal de los datos estáticos, la verificación ocurre antes de subir los archivos. Son políticas de operación diferentes que deben seguir siendo visibles al simplificar el código.',
								},
								id: '71bb37b643217a86-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El histórico utiliza otro límite. Los archivos hijos son inmutables y se prepara el conjunto de referencias antes de activar su raíz. La nueva raíz solo se activa si la versión anterior todavía coincide con la esperada. Es una escritura condicional: si otro publicador cambió la raíz mientras tanto, se produce un conflicto en lugar de sobrescribir silenciosamente ese trabajo.',
								},
								id: '43b799c7731cd65e-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Quien consulta una raíz coherente y sus archivos hijos inmutables puede usar una generación estable mientras se prepara otra. Puede haber objetos nuevos escritos que todavía no pertenecen a la versión anunciada. Las direcciones de compatibilidad conservan su propio comportamiento; la garantía de ese conjunto de referencias no se extiende automáticamente a todas las URL.',
								},
								id: '09e0b30b95690f84-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Este enfoque permite entregar archivos sin pedirle a la base que repita los cálculos en cada visita. A cambio, el sistema debe gestionar la publicación, los objetos conservados, las fallas y las referencias activas. La coherencia que recibe quien consulta depende de la familia de datos y de cómo se siguen sus referencias.',
								},
								id: '9f47c7723e5f4981-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le site consulte trois familles de données. Le statique décrit notamment les réseaux, lignes, arrêts et objets géographiques. Le temps réel porte les positions, prévisions et états récents. L’historique sert les périodes conservées et les bilans. Ces familles n’ont ni le même rythme de changement ni la même manière d’être rendues visibles.',
								},
								id: 'c3f77be473f6f02b-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les contrats décrivent la forme des fichiers. D’autres métadonnées identifient la méthode et la génération publiée. Une version de structure indique comment lire un document; une version de méthode situe le sens de son calcul; un identifiant de génération associe des résultats à une publication. Confondre ces rôles rendrait une évolution plus difficile à interpréter.',
								},
								id: '5c602b1bc7d81fca-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Du côté de PostgreSQL, la publication travaille dans une transaction en isolation <code>REPEATABLE READ</code>. Elle peut lire un état cohérent de la base pendant la préparation. Un verrou consultatif par fournisseur et par famille de publication empêche deux éditeurs de prendre simultanément la même voie. Cela ne transforme pas les écritures en base et les écritures dans le stockage d’objets en une transaction distribuée unique.',
								},
								id: 'fc48ecb2ab47647c-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour le temps réel, les fichiers enfants sont écrits avant le manifeste. Ce dernier sert de repère de fin. Imaginons cinq fichiers à écrire : quatre sont remplacés, puis le cinquième échoue. Le manifeste précédent peut rester en place, mais certaines adresses directes peuvent déjà répondre avec les nouveaux fichiers. « Manifeste écrit en dernier » ne signifie donc pas « tous les fichiers remplacés atomiquement ».',
								},
								id: '60ba5a25837b204b-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les vérifications du temps réel sont enregistrées sans bloquer systématiquement sa disponibilité. Pour le statique, le parcours normal vérifie les données avant leur téléversement. Ce sont deux choix de fonctionnement distincts, qui doivent rester visibles lorsqu’on simplifie le code.',
								},
								id: 'c905bc6f6be6776d-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L’historique utilise une autre frontière. Les fichiers enfants sont immuables et le graphe qui les référence est préparé avant l’activation de sa racine. La nouvelle racine n’est activée que si la version précédente correspond encore à celle attendue. C’est une écriture conditionnelle : si quelqu’un a changé la racine entre-temps, l’opération rencontre un conflit au lieu d’écraser silencieusement son travail.',
								},
								id: 'c301eb4fc600fda4-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un lecteur qui suit une racine cohérente et ses enfants immuables dispose ainsi d’une génération stable, même si une nouvelle génération est en préparation. Les nouveaux objets non encore activés peuvent exister sans être la version annoncée. Les adresses de compatibilité conservent leur propre comportement; la garantie du graphe ne s’étend pas automatiquement à chaque URL.',
								},
								id: '3d892bb95a9eb25c-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce compromis permet de servir des fichiers sans imposer les calculs de la base à chaque visite. En retour, il faut gérer la publication, les objets conservés, les échecs et les références actives. La cohérence obtenue dépend de la famille lue et de la façon dont le lecteur suit ses références.',
								},
								id: '9653e17555bbfa02-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Publishing files: versions, visibility and partial failures',
					es: 'Publicar archivos: versiones, visibilidad y fallas parciales',
					fr: 'Publier des fichiers : versions, visibilité et échecs partiels',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The data Worker serves published objects. It does not repeat the whole normalization process on each request. That narrower responsibility allows data errors and transport errors to be handled separately.',
								},
								id: 'b22d520f969a7897-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'An <code>ETag</code> identifies an object version for conditional requests. A <code>HEAD</code> request can retrieve metadata without the contents. A range request can retrieve only the bytes needed from a map archive. The code distinguishes partial responses, failed conditions, missing objects and invalid ranges. An unrelated storage error must not be disguised as a badly requested range.',
								},
								id: '3ed025043a2eeb53-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Caching introduces several clocks: the source observation time, the publication generation time, the time intermediate work was computed and the time the page receives it. An observation from 11:56 a.m. received at noon does not become a noon observation just because an HTTP request succeeded.',
								},
								id: 'b2fc8a28e10b5ab9-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'One specific endpoint illustrates the distinction. In the reviewed code, the <code>/api/v1/kpis</code> aggregate is fixed to the STM. It is not a universal backend for both cities. Its response can carry <code>no-store</code> while being assembled from internally cached work. Vehicle data anchors availability, while the ages of trip and network data independently qualify certain derived fields. Work caching and source freshness answer different questions.',
								},
								id: 'd1ac0c1caed4f5df-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'In the web application, the first render can receive server-prepared data. The browser then continues refreshing and changing selections. Responses are validated at runtime; TypeScript types alone cannot guarantee the structure of a file received over the network.',
								},
								id: 'a3bdb81fe9e26dde-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Switching cities creates a concrete risk: a request started for Montréal may finish after someone selects Ottawa. Cancelling the first request helps, but a late response can still arrive. The resource checks a sequence token before accepting the result:',
								},
								id: 'a28a738f3605a83d-5',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n.then((value) => {\n\tif (token !== seq) return;\n\tdata = value;\n\tdataKey = activeKey;\n})\n```',
								},
								id: 'ac5b62bd114bfc2c-6',
								type: 'code',
							},
							{
								data: {
									text: 'If a new request has superseded the old one, its token is no longer current and the response is ignored. Data also belongs to a context key. A Montréal value is not retained as though it belonged to Ottawa; a refresh of the same context can keep its last usable value while loading.',
								},
								id: '90cc8a02ce7716d8-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The catalogue, URL, city selection and page links need to retain the same provider. A discovery failure must not silently display STM data under an explicit Ottawa selection. These rules give interface consistency a practical meaning: the chosen question and the visible data must continue to match, even when responses arrive out of order.',
								},
								id: '2aaebec479a3d7c9-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El Worker de datos entrega objetos publicados. No repite todo el proceso de normalización en cada solicitud. Esa responsabilidad más acotada permite tratar por separado los errores de datos y los del transporte.',
								},
								id: 'ab5a834da98d82c4-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un <code>ETag</code> identifica una versión de un objeto para las solicitudes condicionales. Una solicitud <code>HEAD</code> puede consultar metadatos sin recibir el contenido. Una solicitud por rango puede recuperar solo los bytes necesarios de un archivo cartográfico. El código distingue, entre otros casos, una respuesta parcial, una condición que no se cumple, un objeto ausente y un rango inválido. Un error cualquiera del almacenamiento no debe presentarse como si solo se hubiera pedido un rango incorrecto.',
								},
								id: '6eaa91aa3f2f9b2b-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La caché introduce varias referencias de tiempo: cuándo se produjo la observación, cuándo se generó la publicación, cuándo se calculó un resultado intermedio y cuándo lo recibió la página. Una observación de las 11:56 a. m. recibida al mediodía no se convierte en una observación del mediodía porque la solicitud HTTP haya funcionado.',
								},
								id: '6874b4eb80c5a4d8-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un caso específico muestra la diferencia. En el código revisado, el agregado <code>/api/v1/kpis</code> está fijado a la STM. No es el servicio general para ambas ciudades. Su respuesta puede indicar <code>no-store</code> y aun así construirse a partir de trabajo interno guardado en caché. Los datos de vehículos sirven como punto de apoyo para su disponibilidad; la antigüedad de los datos de recorridos y de red condiciona por separado algunos campos derivados. La caché del trabajo y la actualidad de las fuentes responden a preguntas distintas.',
								},
								id: '195f925fd0bba1fc-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En la aplicación web, la primera presentación puede recibir datos preparados en el servidor. Después, el navegador continúa las actualizaciones y los cambios de selección. Las respuestas se validan durante la ejecución; los tipos de TypeScript por sí solos no garantizan la estructura de un archivo recibido de la red.',
								},
								id: '76f20e64d1b27f54-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cambiar de ciudad introduce un riesgo concreto: una solicitud iniciada para Montreal puede terminar después de que la persona elija Ottawa. Cancelar la primera solicitud ayuda, pero una respuesta tardía todavía puede llegar. El recurso compara un identificador de secuencia antes de aceptar el resultado:',
								},
								id: '45538ca4a2abd755-5',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n.then((value) => {\n\tif (token !== seq) return;\n\tdata = value;\n\tdataKey = activeKey;\n})\n```',
								},
								id: 'ac5b62bd114bfc2c-6',
								type: 'code',
							},
							{
								data: {
									text: 'Si una nueva solicitud reemplazó a la anterior, su identificador ya no es el vigente y la respuesta se ignora. Los datos también están asociados a una clave de contexto. Un valor de Montreal no se conserva como si perteneciera a Ottawa; una actualización del mismo contexto sí puede mantener el último valor utilizable mientras carga.',
								},
								id: 'd853800c3771c469-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El catálogo, la URL, la selección de ciudad y los enlaces a las páginas deben conservar el mismo proveedor. Una falla al descubrir el catálogo no debe mostrar silenciosamente datos de la STM bajo una selección explícita de Ottawa. Estas reglas dan un significado práctico a la coherencia de la interfaz: la pregunta elegida y los datos visibles deben seguir correspondiendo, incluso cuando las respuestas llegan en otro orden.',
								},
								id: 'f88a2f22df813dd5-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le Worker de données sert des objets publiés. Il n’effectue pas à chaque requête toute la normalisation décrite plus haut. Cette responsabilité plus étroite permet de traiter séparément les erreurs de données et celles du transport.',
								},
								id: '640d88a4d1c51d3f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un <code>ETag</code> identifie une version d’objet pour les requêtes conditionnelles. Une requête <code>HEAD</code> peut demander les métadonnées sans recevoir le contenu. Une requête de plage peut récupérer seulement les octets nécessaires d’une archive cartographique. Le code distingue notamment une réponse partielle, une condition non satisfaite, un objet absent et une plage invalide. Une erreur de stockage quelconque ne doit pas être présentée comme une simple mauvaise plage demandée.',
								},
								id: 'b656efdbf76e0b1e-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le cache ajoute plusieurs horloges. Il y a la date de l’observation source, celle de la génération publiée, le moment où un résultat intermédiaire a été calculé et le moment où la page le reçoit. Une donnée de 11 h 56 reçue à midi ne devient pas une observation de midi parce qu’une réponse HTTP vient de réussir.',
								},
								id: 'ff8a630f19174581-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un cas particulier illustre cette nuance : l’agrégat <code>/api/v1/kpis</code> du code relu est fixé à la STM. Il ne constitue pas le moteur universel des deux villes. Sa réponse peut porter <code>no-store</code> tout en étant construite à partir d’un travail interne mis en cache. Les positions servent de point d’appui à sa disponibilité; l’âge des données de trajets et de réseau qualifie séparément certains champs dérivés. Le cache de travail et la fraîcheur des sources répondent donc à deux questions différentes.',
								},
								id: '3fad373b0c284695-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Dans l’application web, le premier affichage peut recevoir des données préparées côté serveur. Le navigateur poursuit ensuite les actualisations et les changements de sélection. Les réponses sont validées à l’exécution; les types TypeScript seuls ne peuvent pas garantir la forme d’un fichier reçu du réseau.',
								},
								id: '0d07b328b9b92ec3-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Changer de ville introduit un risque concret : une requête lancée pour Montréal peut se terminer après que la personne a choisi Ottawa. Annuler la première requête aide, mais une réponse tardive peut quand même arriver. La ressource compare un jeton de séquence avant d’accepter le résultat :',
								},
								id: '163e312ee6c9a147-5',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n.then((value) => {\n\tif (token !== seq) return;\n\tdata = value;\n\tdataKey = activeKey;\n})\n```',
								},
								id: 'ac5b62bd114bfc2c-6',
								type: 'code',
							},
							{
								data: {
									text: 'Si une nouvelle demande a remplacé l’ancienne, son jeton n’est plus courant et la réponse est ignorée. Les données sont aussi associées à une clé de contexte. Une valeur de Montréal n’est pas conservée comme si elle appartenait à Ottawa; une simple actualisation du même contexte peut, elle, garder la dernière valeur utilisable pendant le chargement.',
								},
								id: '7b06a1081cd5b5c1-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le catalogue, l’URL, le choix de ville et les liens vers les pages doivent conserver le même fournisseur. Une panne de découverte ne doit pas afficher silencieusement la STM sous une sélection explicite d’Ottawa. Ces règles donnent un sens concret à la cohérence d’une interface : la question choisie et les données visibles doivent continuer de correspondre, même quand les réponses arrivent dans le désordre.',
								},
								id: 'b500a301e70829d8-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'HTTP transport, caching and switching cities',
					es: 'Transporte HTTP, caché y cambio de ciudad',
					fr: 'Transport HTTP, cache et changement de ville',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The most useful checks target a behaviour that could plausibly break. In Transit, a selection test protects route predictions without an associated vehicle. A rendering test protects the unavailable-alert message. HTTP tests check conditional responses and ranges. They address different risks.',
								},
								id: '1c01a03efbfd6112-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Publication contracts also cross language boundaries. Python models produce JSON schemas, while the web consumer uses its own parsers. Conformance checks compare those representations. A generated file is not an independent second specification on its own: the producer, its export and the consumer’s acceptance or rejection of data all need attention.',
								},
								id: 'b6d7340ec77caf72-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For transactions, constraints and recovery, tests against a real database provide evidence that a simulation cannot. The repository includes a case where historical projection fails on its second step: facts, serving state and invalidations must return together to their previous state. Another checks that historical replay does not rewind the version used for live data.',
								},
								id: '92b1459b2a146a3d-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That distinction between history and current state matters. Correcting a past day may require rebuilding its derived data without replacing the vehicle positions currently being served. The code keeps selected-capture identities and processing states. Its timetable-matching policy also matters: the reviewed replay uses the current static edition and reports that choice, rather than claiming to reconstruct everything that was known at the time.',
								},
								id: '93976e7ddcfa1f3a-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Daily summaries retain their own completion dates for each metric family. One family being current does not establish that every other family is current. A correction can invalidate affected periods; exact sums, retained observations and available dates determine what can be recalculated.',
								},
								id: '3a85b50d48ba103f-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Retention is therefore a functional decision as well as a storage decision. Keeping more source material helps investigation and replay, but consumes resources. Removing it reduces cost and also reduces some reconstruction options. A dashboard can continue displaying summaries after the data needed for a more detailed correction is no longer available.',
								},
								id: 'dc6da954d19ebc7b-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Operations need to distinguish an absent feed, a failed capture, incomplete loading, delayed calculations and publication that has stopped advancing. Restarting the wrong stage may add work without addressing the cause. Processing receipts, timestamps and health checks help locate that boundary.',
								},
								id: 'eac77d23baf0b7e3-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Backups follow the same logic. An existing backup file proves that an object exists. A tested restoration into a separate temporary database provides different evidence. Recovering production is another result again. The project has separate procedures for these operations; their presence in the repository does not mean that a complete restoration has just been demonstrated.',
								},
								id: 'd2ac6ef8c83d92ba-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Finally, code tests, checks on the deployed site and tests on real devices or with assistive technologies remain complementary. They make it possible to describe what was checked without turning a local result into a general promise. They also help contain complexity: retain checks that protect a real boundary, and simplify without losing the reason those checks exist.',
								},
								id: 'c20969e8f1a0d8bd-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Las verificaciones más útiles se enfocan en un comportamiento que podría fallar de una manera plausible. En Transit, una prueba de selección protege las predicciones de ruta sin vehículo asociado. Una prueba de presentación protege el mensaje de avisos no disponibles. Las pruebas HTTP revisan respuestas condicionales y rangos. Cada una aborda un riesgo diferente.',
								},
								id: 'ac420c5dbdb4ebe0-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los contratos de publicación también cruzan lenguajes. Los modelos de Python producen esquemas JSON, mientras que el consumidor web utiliza sus propios validadores. Las verificaciones de conformidad comparan esas representaciones. Un archivo generado no es, por sí solo, una segunda especificación independiente: hay que revisar el productor, su exportación y la manera en que el consumidor acepta o rechaza los datos.',
								},
								id: '9e06eee0ec943c7a-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para las transacciones, las restricciones y las recuperaciones, las pruebas con una base real aportan evidencia que una simulación no puede ofrecer. El repositorio incluye un caso en el que una proyección histórica falla en su segundo paso: los hechos, el estado servido y las invalidaciones deben regresar juntos al estado anterior. Otro caso verifica que reprocesar datos históricos no haga retroceder la versión utilizada para el tiempo real.',
								},
								id: 'b7fb807df7c92f4c-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esa diferencia entre el histórico y el estado actual importa. Corregir un día pasado puede requerir recalcular sus derivados sin reemplazar las posiciones que se están mostrando ahora. El código conserva las identidades de las capturas seleccionadas y los estados de procesamiento. También hay que conocer la política de relación con el horario: el reprocesamiento revisado utiliza la edición estática actual e informa esa decisión, en lugar de afirmar que reconstruye exactamente todo lo que se sabía en una fecha pasada.',
								},
								id: '64cd94d7f46e7e13-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los resúmenes diarios conservan sus propias fechas de finalización por familia de medidas. Que una familia esté actualizada no demuestra que todas las demás lo estén. Una corrección puede invalidar los periodos afectados; las sumas exactas, las observaciones conservadas y las fechas disponibles determinan qué se puede recalcular.',
								},
								id: 'e5a4ed1b0aa6f8e2-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La conservación es una decisión funcional y también de almacenamiento. Guardar más material de origen ayuda a investigar y reprocesar el pasado, pero consume recursos. Eliminarlo reduce el costo y también algunas posibilidades de reconstrucción. Un tablero puede seguir mostrando sus resúmenes aunque los datos necesarios para una corrección más detallada ya no estén disponibles.',
								},
								id: 'ac5acc684e50aad0-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La operación necesita distinguir entre un flujo ausente, una captura fallida, una carga incompleta, cálculos retrasados y una publicación que dejó de avanzar. Reiniciar la etapa equivocada puede agregar trabajo sin resolver la causa. Los comprobantes de procesamiento, las marcas de tiempo y las verificaciones de estado ayudan a ubicar ese punto.',
								},
								id: '6bac4040800d39ad-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las copias de seguridad siguen la misma lógica. La presencia de un archivo de respaldo demuestra que existe un objeto. Una restauración probada en una base temporal separada aporta otra evidencia. Recuperar la producción es un resultado distinto. El proyecto tiene procedimientos separados para estas operaciones; que estén en el repositorio no significa que se acabe de demostrar una restauración completa.',
								},
								id: 'e045b948f6c85133-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Por último, las pruebas de código, las verificaciones en el sitio desplegado y los ensayos con dispositivos reales o tecnologías de asistencia se complementan. Permiten describir qué se revisó sin convertir un resultado local en una promesa general. También ayudan a contener la complejidad: conservar las verificaciones que protegen un límite real y simplificar sin borrar la razón por la que existen.',
								},
								id: '95447c548b9534d1-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les vérifications les plus utiles ciblent un comportement qui pourrait raisonnablement se briser. Dans Transit, un test de sélection protège les prévisions de ligne sans véhicule associé. Un test de rendu protège le message d’avis indisponibles. Les tests HTTP vérifient les réponses conditionnelles et les plages. Ils traitent des risques différents.',
								},
								id: '6afe9500c46384ed-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les contrats de publication traversent aussi plusieurs langages. Les modèles Python produisent des schémas JSON; le consommateur web utilise ses propres parseurs. Des contrôles de conformité comparent ces représentations. Un fichier généré n’est pas, à lui seul, une seconde spécification indépendante : il faut examiner le producteur, son export et la manière dont le consommateur accepte ou rejette les données.',
								},
								id: '4e711fab095aa43b-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour les transactions, les contraintes et les reprises, des tests sur une vraie base apportent une preuve qu’une simulation ne peut pas fournir. Le dépôt contient notamment des cas où une projection historique échoue à la deuxième étape : les faits, l’état servi et les invalidations doivent revenir ensemble à leur état antérieur. Un autre cas vérifie qu’une relecture historique ne fait pas reculer la version utilisée pour le temps réel.',
								},
								id: '419d442265066b65-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette distinction entre historique et état courant est importante. Corriger un jour passé peut exiger de recalculer ses dérivés, sans vouloir remplacer les positions actuellement servies. Le code garde des identités de captures sélectionnées et des états de traitement. Il faut aussi connaître la politique de rapprochement avec l’horaire : la relecture étudiée utilise l’édition statique courante et rapporte ce choix, plutôt que de prétendre reconstruire exactement toute la connaissance d’une époque.',
								},
								id: '9ddc9b126292cfc1-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les résumés quotidiens gardent leurs propres dates de complétion par famille de mesures. Le fait qu’une famille soit à jour n’établit pas que toutes les autres le sont. Une correction peut invalider les périodes touchées; les sommes exactes, les observations retenues et les dates disponibles déterminent ce qui peut être recalculé.',
								},
								id: 'ad3c7404a1ffea60-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La conservation est donc un choix fonctionnel autant qu’un choix de stockage. Garder plus de matière première aide à examiner et à rejouer le passé, mais consomme des ressources. Supprimer cette matière réduit le coût et réduit aussi certaines possibilités de reconstruction. Un tableau de bord peut continuer à s’afficher grâce à ses résumés alors que les données nécessaires à une correction plus fine ne sont plus disponibles.',
								},
								id: 'b57801f6f7bdd2d9-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L’exploitation doit pouvoir distinguer un flux absent, une capture en échec, un chargement incomplet, un calcul retardé et une publication qui n’avance plus. Relancer le mauvais étage peut ajouter du travail sans résoudre la cause. Les reçus de traitement, les horodatages et les contrôles de santé servent à localiser cette frontière.',
								},
								id: '70daa33095365276-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les sauvegardes suivent la même logique. Un fichier de sauvegarde présent prouve qu’un objet existe. Une restauration testée dans une base temporaire distincte apporte une autre preuve. La remise en service d’une production constitue encore un autre résultat. Le projet possède des procédures séparées pour ces opérations; leur présence dans le dépôt ne signifie pas qu’une restauration complète vient d’être démontrée.',
								},
								id: '954453f248559831-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Enfin, les tests de code, les essais sur le site déployé et les vérifications sur appareils réels ou avec des technologies d’assistance restent complémentaires. Ils permettent de décrire ce qui a été vérifié sans transformer un résultat local en promesse générale. C’est aussi une façon de contenir la complexité : conserver les contrôles qui protègent une frontière réelle, et simplifier sans effacer les raisons de leur existence.',
								},
								id: 'c0a8c5c9a7819d22-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Validation, historical corrections and operations',
					es: 'Validación, correcciones históricas y operación',
					fr: 'Validation, correction de l’historique et travail d’exploitation',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									caption: 'STM home page, upper portion. Browser capture, 8 October 2026.',
									file: {
										extension: 'jpg',
										fileId: '59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										fileURL: '/files/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										height: 723,
										name: 'portfolio-20261008-transit-f1c7d4c3cfbd-01-stm-accueil-desktop-1440x1000.jpg',
										size: '94818',
										url: '/assets/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'dd2b07b1e7ae686d',
								type: 'image',
							},
							{
								data: {
									caption: 'STM network map and reported vehicle positions. Browser capture, 8 October 2026; a snapshot, not a guarantee of continuous freshness.',
									file: {
										extension: 'jpg',
										fileId: '2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										fileURL: '/files/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										height: 1000,
										name: 'portfolio-20261008-transit-9f87721e55c3-02-stm-carte-desktop.jpg',
										size: '287945',
										url: '/assets/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '55ef6df426288aab',
								type: 'image',
							},
							{
								data: {
									caption: 'Ottawa route 48, stops and predictions, scrolled mobile viewport. Browser capture, 6 October 2026; not a physical-device test.',
									file: {
										extension: 'png',
										fileId: '9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										fileURL: '/files/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										height: 900,
										name: 'portfolio-20261008-transit-592093938e2a-03-ottawa-ligne-mobile-20261006.png',
										size: '69056',
										url: '/assets/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'b71840b350834a2a',
								type: 'image',
							},
							{
								data: {
									caption: 'Ottawa stop 464, unavailable alerts and the focused official link. Browser capture, 6 October 2026; visible focus alone is not an accessibility audit.',
									file: {
										extension: 'png',
										fileId: '47733824-7045-4e1c-9a34-50538894cc9a',
										fileURL: '/files/47733824-7045-4e1c-9a34-50538894cc9a',
										height: 900,
										name: 'portfolio-20261008-transit-3a237b3fc322-04-ottawa-avis-mobile-20261006.png',
										size: '51413',
										url: '/assets/47733824-7045-4e1c-9a34-50538894cc9a',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '947015f8c21d8514',
								type: 'image',
							},
							{
								data: {
									caption: 'Ottawa network health, partial intermediate viewport. Browser capture, 6 October 2026. The broader automated check encountered a navigation blocker.',
									file: {
										extension: 'png',
										fileId: '7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										fileURL: '/files/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										height: 900,
										name: 'portfolio-20261008-transit-b99f6be54d11-05-ottawa-reseau-intermediate-20261006.png',
										size: '130083',
										url: '/assets/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										width: 768,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '7edc8802b3b46593',
								type: 'image',
							},
							{
								data: {
									caption: 'Ottawa route 48, directions and stops, scrolled desktop viewport. Browser capture, 6 October 2026; the broader automated check encountered a navigation blocker.',
									file: {
										extension: 'png',
										fileId: 'cfead7e9-bbe0-4041-aa33-6bab6beba245',
										fileURL: '/files/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										height: 900,
										name: 'portfolio-20261008-transit-d8748fe4b554-06-ottawa-ligne-desktop-20261006.png',
										size: '150580',
										url: '/assets/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										width: 1280,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'bf381eef683f25c6',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									caption: 'Inicio de STM, parte superior. Captura de navegador del 8 de octubre de 2026.',
									file: {
										extension: 'jpg',
										fileId: '59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										fileURL: '/files/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										height: 723,
										name: 'portfolio-20261008-transit-f1c7d4c3cfbd-01-stm-accueil-desktop-1440x1000.jpg',
										size: '94818',
										url: '/assets/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '0911f0fdc259287d',
								type: 'image',
							},
							{
								data: {
									caption: 'Mapa de STM y posiciones reportadas. Captura de navegador del 8 de octubre de 2026; una instantánea, no una garantía de actualización continua.',
									file: {
										extension: 'jpg',
										fileId: '2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										fileURL: '/files/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										height: 1000,
										name: 'portfolio-20261008-transit-9f87721e55c3-02-stm-carte-desktop.jpg',
										size: '287945',
										url: '/assets/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'b28e9ee1b40a79ae',
								type: 'image',
							},
							{
								data: {
									caption: 'Línea 48 en Ottawa, paradas y predicciones, vista móvil desplazada. Captura de navegador del 6 de octubre de 2026; no es una prueba en un dispositivo físico.',
									file: {
										extension: 'png',
										fileId: '9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										fileURL: '/files/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										height: 900,
										name: 'portfolio-20261008-transit-592093938e2a-03-ottawa-ligne-mobile-20261006.png',
										size: '69056',
										url: '/assets/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '1911972e13fc5b05',
								type: 'image',
							},
							{
								data: {
									caption: 'Parada 464 en Ottawa, avisos no disponibles y enlace oficial enfocado. Captura de navegador del 6 de octubre de 2026; el foco visible por sí solo no constituye una auditoría de accesibilidad.',
									file: {
										extension: 'png',
										fileId: '47733824-7045-4e1c-9a34-50538894cc9a',
										fileURL: '/files/47733824-7045-4e1c-9a34-50538894cc9a',
										height: 900,
										name: 'portfolio-20261008-transit-3a237b3fc322-04-ottawa-avis-mobile-20261006.png',
										size: '51413',
										url: '/assets/47733824-7045-4e1c-9a34-50538894cc9a',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '7ff76ae0fc980dd5',
								type: 'image',
							},
							{
								data: {
									caption: 'Estado de la red de Ottawa, vista intermedia parcial. Captura de navegador del 6 de octubre de 2026. La comprobación automatizada más amplia encontró un bloqueo de navegación.',
									file: {
										extension: 'png',
										fileId: '7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										fileURL: '/files/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										height: 900,
										name: 'portfolio-20261008-transit-b99f6be54d11-05-ottawa-reseau-intermediate-20261006.png',
										size: '130083',
										url: '/assets/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										width: 768,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '4b350bf99b3a2d3d',
								type: 'image',
							},
							{
								data: {
									caption: 'Línea 48 en Ottawa, direcciones y paradas, vista de escritorio desplazada. Captura de navegador del 6 de octubre de 2026; la comprobación automatizada más amplia encontró un bloqueo de navegación.',
									file: {
										extension: 'png',
										fileId: 'cfead7e9-bbe0-4041-aa33-6bab6beba245',
										fileURL: '/files/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										height: 900,
										name: 'portfolio-20261008-transit-d8748fe4b554-06-ottawa-ligne-desktop-20261006.png',
										size: '150580',
										url: '/assets/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										width: 1280,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '89a4ad1e1f998808',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									caption: 'Accueil STM, partie supérieure. Capture de navigateur du 8 octobre 2026.',
									file: {
										extension: 'jpg',
										fileId: '59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										fileURL: '/files/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										height: 723,
										name: 'portfolio-20261008-transit-f1c7d4c3cfbd-01-stm-accueil-desktop-1440x1000.jpg',
										size: '94818',
										url: '/assets/59d2fa1c-0ea5-4afd-ada7-986ce074fa56',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'bacc53c2ed7a8e15',
								type: 'image',
							},
							{
								data: {
									caption: 'Carte STM et positions signalées. Capture de navigateur du 8 octobre 2026; un instantané, pas une garantie de fraîcheur permanente.',
									file: {
										extension: 'jpg',
										fileId: '2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										fileURL: '/files/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										height: 1000,
										name: 'portfolio-20261008-transit-9f87721e55c3-02-stm-carte-desktop.jpg',
										size: '287945',
										url: '/assets/2c41a9a0-34aa-4e3b-b333-5e6dcd53497c',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'ac4e09459e5976a0',
								type: 'image',
							},
							{
								data: {
									caption: 'Ligne 48 à Ottawa, arrêts et prévisions, viewport mobile défilé. Capture de navigateur du 6 octobre 2026; pas un test sur appareil physique.',
									file: {
										extension: 'png',
										fileId: '9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										fileURL: '/files/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										height: 900,
										name: 'portfolio-20261008-transit-592093938e2a-03-ottawa-ligne-mobile-20261006.png',
										size: '69056',
										url: '/assets/9c83bc5b-849e-4dc4-ac9e-1a9ee5b1434d',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '9f58be0740b83776',
								type: 'image',
							},
							{
								data: {
									caption: 'Arrêt 464 à Ottawa, avis indisponibles et lien officiel au focus. Capture de navigateur du 6 octobre 2026; le focus visible seul ne constitue pas un audit d’accessibilité.',
									file: {
										extension: 'png',
										fileId: '47733824-7045-4e1c-9a34-50538894cc9a',
										fileURL: '/files/47733824-7045-4e1c-9a34-50538894cc9a',
										height: 900,
										name: 'portfolio-20261008-transit-3a237b3fc322-04-ottawa-avis-mobile-20261006.png',
										size: '51413',
										url: '/assets/47733824-7045-4e1c-9a34-50538894cc9a',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '6f177b405c1befc1',
								type: 'image',
							},
							{
								data: {
									caption: 'Santé du réseau d’Ottawa, vue intermédiaire partielle. Capture de navigateur du 6 octobre 2026. La vérification automatisée plus large a rencontré un blocage de navigation.',
									file: {
										extension: 'png',
										fileId: '7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										fileURL: '/files/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										height: 900,
										name: 'portfolio-20261008-transit-b99f6be54d11-05-ottawa-reseau-intermediate-20261006.png',
										size: '130083',
										url: '/assets/7ecc2f70-dc27-404b-aeda-534962ddd3d4',
										width: 768,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '6f2e92286cc8fd9f',
								type: 'image',
							},
							{
								data: {
									caption: 'Ligne 48 à Ottawa, directions et arrêts, viewport bureau défilé. Capture de navigateur du 6 octobre 2026; la vérification automatisée plus large a rencontré un blocage de navigation.',
									file: {
										extension: 'png',
										fileId: 'cfead7e9-bbe0-4041-aa33-6bab6beba245',
										fileURL: '/files/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										height: 900,
										name: 'portfolio-20261008-transit-d8748fe4b554-06-ottawa-ligne-desktop-20261006.png',
										size: '150580',
										url: '/assets/cfead7e9-bbe0-4041-aa33-6bab6beba245',
										width: 1280,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '327efc7b67045415',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Images and context',
					es: 'Imágenes y contexto',
					fr: 'Images et contexte',
				},
			},
		],
		slug: 'transit-data-pipeline',
		stack: [
			'PostgreSQL',
			'Python',
			'SvelteKit',
			'TypeScript',
			'Svelte 5',
			'Docker',
			'GitHub Actions',
			'Playwright',
			'Vitest',
		],
		status: 'public',
		tags: ['etl', 'transit', 'postgresql', 'gtfs'],
		title: {
			en: 'Transit: understanding transit data',
			es: 'Transit: entender los datos de transporte',
			fr: 'Transit : comprendre les données du transport',
		},
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A Webflow-to-Shopify migration for Café Arona, a family business in Sherbrooke. Editable content, theme architecture, catalogue structure and bilingual journeys.',
						},
						id: '60b0982028155f91-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			es: {
				blocks: [
					{
						data: {
							text: 'La migración de Webflow a Shopify para Café Arona, una empresa familiar de Sherbrooke. Contenido editable, tema, catálogo y recorridos bilingües.',
						},
						id: '1e87c1305599ba80-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'La migration de Webflow vers Shopify pour Café Arona, une entreprise familiale de Sherbrooke. Contenus modifiables, thème, catalogue et parcours bilingues.',
						},
						id: '75ad6946c06b0f9a-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
		},
		environment: 'development',
		featured: true,
		image: '4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
		location: 'Sherbrooke, Québec',
		oneLiner: {
			en: 'Introducing the business now and preparing for day-to-day management.',
			es: 'Presentar el negocio hoy y preparar su administración para el futuro.',
			fr: 'Présenter l’entreprise aujourd’hui, préparer la gestion de demain.',
		},
		relatedServices: ['web-development', 'analytics-reporting'],
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A family in Sherbrooke hired me to work on the website for Café Arona, a business preparing to introduce Cameroonian coffee in Québec. They already had a story, a visual identity and people behind the project. The brief was to give those elements a clear place online and a content structure the team can manage.',
								},
								id: 'd4811d196b368d20-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The website presents the company’s history, values, team and articles supplied by the client. Its theme also contains catalogue components: collections, product pages, option selection, search and a cart. Text and images sit within sections designed to be editable through Shopify.',
								},
								id: 'b4cf3bca968f2c39-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'My work involves migrating the existing Webflow site to Shopify, organizing its content and developing the theme. At its current stage, Café Arona is an informational website in development, with sales not yet open and the Shopify handover still ahead. This is what is built, how the parts work together and the principles behind managing them.',
								},
								id: 'dfc8211932e9b47b-2',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Introducing the people behind the coffee',
								},
								id: '2cdd5d043a2054bb-3',
								type: 'header',
							},
							{
								data: {
									text: 'Café Arona’s story connects Cameroon and Québec through the people building the business. The history, values and team pages give visitors room to understand that connection.',
								},
								id: '88f690b83c5b8db3-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I organized the content into formats with different purposes. One page tells the story of the business. Another presents its values. The team page brings together a group photo, individual portraits and introductions. A blog provides a place for articles supplied by the client alongside the more permanent pages.',
								},
								id: 'a77f899c0ca9eaad-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Visitors can understand who is behind the business before exploring its products. They can spend time with an article or find a way to contact the team. That journey has a purpose of its own: the website introduces a business and its context before online sales open.',
								},
								id: '5529ac9cfb07ff18-6',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'An existing identity, editable content' },
								id: 'ec6a3a0584a54c2a-7',
								type: 'header',
							},
							{
								data: {
									text: 'The existing colours, photographs and typography provide the starting point. The migration carries that identity into a Shopify theme, with pages the client will be able to update from the administration area.',
								},
								id: '4970c88855c80dda-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The relationship between presentation and management guides the work. A heading needs both a place in the layout and an understandable place to edit it. A photograph needs to work on a small screen and be replaceable without rebuilding the page. A product page needs to present coffee information and read it from fields that can be kept current.',
								},
								id: 'c331430a1f34e9d4-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Shopify brings those content needs together with the functions intended for the future store. The theme already includes collections, product pages, search and a cart. Their presence describes the work built so far; it does not mean that the final catalogue has been loaded or sales have opened.',
								},
								id: '761825905393eb05-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The expandable sections below let readers choose their level of detail. Each explains one part of the website: its purpose, how it works and what to check when changing it.',
								},
								id: '514133a979f34f60-11',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'What is in place and what comes next' },
								id: 'b2ed717dec9a8275-12',
								type: 'header',
							},
							{
								data: {
									text: 'Café Arona has a development website, presentation pages and a theme connecting editable content, product pages, variants and a bilingual structure. The technical choices serve practical tasks: knowing where to change information, where that change appears and what to check afterwards.',
								},
								id: 'bc25db338e25dbec-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The next stage provides for integrating the final catalogue, validating the journeys intended for sales and handing the website over with documentation and training. Those additions will use the structure already built.',
								},
								id: 'b28f96bc71468b4e-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Una familia de Sherbrooke me contrató para trabajar en el sitio web de Café Arona, una empresa que busca dar a conocer el café camerunés en Quebec. El proyecto ya tenía una historia, una identidad visual y un equipo. El encargo consiste en darles un lugar claro en la web y una estructura de contenido que el equipo pueda administrar.',
								},
								id: '10781a9b20adae1c-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El sitio presenta la historia de la empresa, sus valores, su equipo y los artículos aportados por el cliente. El tema también incluye componentes de catálogo: colecciones, fichas de producto, selección de opciones, búsqueda y carrito. Los textos y las imágenes se organizan en secciones previstas para editarse desde Shopify.',
								},
								id: 'ae63b15ca051c5d0-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Mi trabajo incluye la migración del sitio existente en Webflow a Shopify, la organización de los contenidos y el desarrollo del tema. En su estado actual, Café Arona es un sitio informativo en desarrollo, sin apertura de ventas ni entrega de Shopify al cliente. Esto es lo que está construido, cómo funcionan sus partes y los principios para administrarlas.',
								},
								id: 'ab9eb79dfe7a8528-2',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Presentar a las personas detrás del café',
								},
								id: 'f0fca8a580e0ffcb-3',
								type: 'header',
							},
							{
								data: {
									text: 'La historia de Café Arona une a Camerún y Quebec a través de las personas que están construyendo la empresa. Por eso, las páginas de historia, valores y equipo tienen un lugar importante dentro del sitio.',
								},
								id: '8ce50d36349f3bc1-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Organicé estos contenidos en formatos con propósitos distintos. Una página cuenta cómo nació el proyecto. Otra presenta sus valores. La página del equipo reúne una foto de grupo, retratos y textos de presentación. El blog ofrece un espacio para los artículos que aporta el cliente y complementa las páginas de contenido más permanente.',
								},
								id: '17f8b3b0520bf8b6-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Así, cada visitante puede conocer quiénes están detrás de la empresa antes de explorar sus productos. Puede leer un artículo con calma o encontrar cómo comunicarse con el equipo. Ese recorrido tiene una utilidad propia: presentar al negocio y su contexto antes de abrir las ventas en línea.',
								},
								id: 'aeac817d092825c3-6',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Una identidad existente, contenidos editables',
								},
								id: 'aa707b22a64de7dc-7',
								type: 'header',
							},
							{
								data: {
									text: 'Los colores, las fotografías y la tipografía existentes sirven como punto de partida. La migración lleva esa identidad a un tema de Shopify, con páginas que el cliente podrá actualizar desde su administración.',
								},
								id: 'ce91e2e11b86ae5f-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La relación entre presentación y administración guía el trabajo. Un título necesita un lugar en el diseño y un sitio fácil de reconocer donde se pueda editar. Una fotografía debe funcionar en una pantalla pequeña y poder reemplazarse sin reconstruir la página. Una ficha debe presentar los datos del café y leerlos desde campos que puedan mantenerse al día.',
								},
								id: '702de2d29813fb95-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Shopify reúne esas necesidades de contenido con las funciones previstas para la futura tienda. El tema ya incluye colecciones, fichas de producto, búsqueda y carrito. Su existencia describe el trabajo construido; no significa que el catálogo definitivo esté cargado ni que las ventas estén abiertas.',
								},
								id: 'cc28e74cd0f04348-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las secciones desplegables permiten elegir el nivel de detalle. Cada una explica una parte del sitio: su propósito, cómo funciona y qué se debe revisar al modificarla.',
								},
								id: '08ef4327cbdc93e5-11',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Lo que está construido y lo que sigue' },
								id: '66fd3ed2f466f072-12',
								type: 'header',
							},
							{
								data: {
									text: 'Café Arona cuenta con un sitio de desarrollo, páginas de presentación y un tema que relaciona contenidos editables, fichas, variantes y una estructura bilingüe. Las decisiones técnicas sirven para tareas concretas: saber dónde cambiar un dato, dónde se refleja y qué revisar después.',
								},
								id: '40127eb6abc94c32-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La siguiente etapa contempla integrar el catálogo definitivo, validar los recorridos destinados a la venta y entregar el sitio con su documentación y capacitación. Esas incorporaciones utilizarán la estructura que ya está construida.',
								},
								id: 'dd508d859c27579d-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Une famille de Sherbrooke m’a confié le site de Café Arona, une entreprise qui souhaite faire découvrir le café camerounais au Québec. L’histoire, les personnes et l’identité visuelle étaient déjà là. Le mandat : leur donner une place claire sur le Web et une structure de contenu que l’équipe pourra gérer.',
								},
								id: '6a944745fedca6a1-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le site présente l’histoire de l’entreprise, ses valeurs, son équipe et les articles fournis par le client. Son thème comprend aussi les composants de catalogue : collections, fiches de produits, sélection d’options, recherche et panier. Les textes et les images s’inscrivent dans des sections prévues pour être modifiables depuis Shopify.',
								},
								id: '33a9367905d0d1e1-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Mon travail porte sur la migration du site Webflow existant vers Shopify, l’organisation des contenus et le développement du thème. Au stade actuel, Café Arona est une vitrine d’information en développement, sans ouverture des ventes ni remise au client sur Shopify. Voici ce qui est construit, comment les différentes parties fonctionnent et les principes qui encadrent leur gestion.',
								},
								id: '7ce8f6ac2cb37728-2',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Donner une place aux personnes derrière le café',
								},
								id: 'fcb9adde438adb3f-3',
								type: 'header',
							},
							{
								data: {
									text: 'Pour comprendre Café Arona, il faut rencontrer l’équipe et voir ce qu’elle souhaite transmettre entre le Cameroun et le Québec. Les pages sur l’histoire, les valeurs et les membres de l’équipe occupent donc une place importante dans le site.',
								},
								id: '5783ece60f312541-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'J’ai organisé ces contenus dans des formats qui ont chacun leur rôle. Une page raconte l’origine du projet. Une autre présente ses valeurs. La page d’équipe réunit une photo de groupe, des portraits et des textes de présentation. Le blogue offre un espace pour les articles fournis par le client, en complément des pages plus permanentes.',
								},
								id: 'd8d6a0fffaea1045-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une personne peut ainsi comprendre qui porte l’entreprise avant de s’intéresser aux produits. Elle peut lire un article ou trouver comment joindre l’équipe. Ce parcours a une utilité propre : la vitrine présente une entreprise et son univers, même avant l’ouverture des ventes.',
								},
								id: 'c114cceea041ac42-6',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Une identité existante, des contenus modifiables',
								},
								id: 'f546e2f11915ccd2-7',
								type: 'header',
							},
							{
								data: {
									text: 'Les couleurs, les photographies et la typographie existantes servent de point de départ. La migration consiste à faire vivre cette identité dans un thème Shopify, avec des pages que le client pourra mettre à jour depuis son administration.',
								},
								id: '8dd96421fd179e9a-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La distinction entre présentation et gestion guide le travail. Un titre doit avoir sa place dans la mise en page et un endroit compréhensible où le modifier. Une photo doit bien se cadrer sur un petit écran et pouvoir être remplacée sans reconstruire la page. Une fiche doit présenter les renseignements du café et les lire dans des champs qui pourront être tenus à jour.',
								},
								id: '8a443931a726271b-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Shopify réunit ces besoins de contenu avec les fonctions qui serviront à la future boutique. Le thème comprend déjà des collections, des fiches, une recherche et un panier. Leur existence décrit le travail construit; elle ne signifie pas que le catalogue définitif est chargé ou que les ventes sont ouvertes.',
								},
								id: 'd9416ef00f1ce0c2-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les sections dépliables qui suivent permettent de choisir son niveau de détail. Chacune explique une partie du site : son rôle, son fonctionnement et les points à contrôler lorsqu’on la modifie.',
								},
								id: 'fb4f59867fdb12b6-11',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Ce qui est en place et la suite prévue' },
								id: '5e4edbcee72e41bb-12',
								type: 'header',
							},
							{
								data: {
									text: 'Café Arona dispose d’une vitrine de développement, de pages de présentation et d’un thème qui relie contenus modifiables, fiches, variantes et structure bilingue. Les choix techniques servent des tâches concrètes : savoir où changer une information, comment elle se répercute et ce qu’il faut vérifier après une modification.',
								},
								id: '349600b3c78a0990-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La prochaine étape prévoit l’intégration du catalogue définitif, la validation des parcours destinés à la vente et la remise au client avec sa documentation et sa formation. Ces ajouts s’appuieront sur la structure déjà construite.',
								},
								id: '1452f77063764278-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Café Arona: a Shopify website for a family business',
					es: 'Café Arona: un sitio Shopify para una empresa familiar',
					fr: 'Café Arona : une vitrine Shopify pour une entreprise familiale',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The website uses a Shopify Liquid theme built from the Skeleton foundation. Liquid brings Shopify-managed content together with the theme’s elements. The browser then receives an HTML page, its CSS presentation and the JavaScript behaviour it needs. This organization fits the brief: an informational website whose content and future catalogue are managed in the same administration area.',
								},
								id: '37c668a390a914fa-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme has several layers. A shared layout places the header, main content and footer. JSON templates specify which sections make up a family of pages. Sections provide visible elements such as the home-page banner or team presentation. Smaller reusable components handle shared details, such as a button or a price.',
								},
								id: '54977c33d4e743b6-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Each layer has a responsibility. Changing a shared button’s styling can affect several pages. Changing a button’s wording in a section changes that section’s content. Confusing the two would either spread exceptions through the code or require development for a straightforward wording correction.',
								},
								id: 'c7c8dcb46fc1cd0a-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'What the editor makes editable' },
								id: 'b5e84f1aedaed3b1-3',
								type: 'header',
							},
							{
								data: {
									text: 'Sections declare their settings: text, images, links and options provided by the theme. The following minimal illustration was written for this article and is separate from the project’s code. It represents a heading and destination intended to be editable:',
								},
								id: '9f3badd08a53c15d-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```json\n{\n  "name": "Introduction",\n  "settings": [\n    { "type": "text", "id": "intro_title", "label": "Titre" },\n    { "type": "url", "id": "intro_destination", "label": "Lien" }\n  ]\n}\n```',
								},
								id: '22b9f3e061efcb51-5',
								type: 'code',
							},
							{
								data: {
									text: 'In this example, <code>intro_title</code> and <code>intro_destination</code> are stable identifiers. The client works with the labels shown in the editor. They can change content without having to find a line of HTML.',
								},
								id: 'bdaf1fac48648c6b-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The visual framework remains defined by the theme. Adding a new interaction or a new family of pages still requires development. The intended independence concerns recognizable tasks: correcting a sentence, replacing an image, updating an introduction or changing where a link leads.',
								},
								id: '2a9f46e8cc5da260-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'When a template is shared' },
								id: 'fd4cd058b1b3ca76-8',
								type: 'header',
							},
							{
								data: {
									text: 'If two pages use the same template, changing that template’s composition can affect both. Before editing, the person making the change needs to distinguish page-specific content from shared structure. The handover documentation should explain that scope.',
								},
								id: '79e742f149f81e6c-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A short editing map makes the distinction practical: biographies in the team section, articles in the blog, coffee information in the catalogue and custom fields. The right place depends on the type of information, not simply where it appears on the screen.',
								},
								id: '52909e36dbf16abd-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El sitio utiliza un tema Liquid de Shopify, desarrollado a partir de la base Skeleton. Liquid combina los contenidos administrados por Shopify con los elementos del tema. El navegador recibe una página HTML, su presentación en CSS y los comportamientos necesarios en JavaScript. Esta organización responde al encargo: un sitio informativo cuyos contenidos y futuro catálogo se administran desde el mismo lugar.',
								},
								id: '8c2abb79e513cdd7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El tema tiene varios niveles. Una estructura común ubica el encabezado, el contenido principal y el pie de página. Las plantillas JSON indican qué secciones componen una familia de páginas. Las secciones contienen elementos visibles, como el banner de inicio o la presentación del equipo. Otros componentes pequeños y reutilizables se encargan de detalles compartidos, como un botón o un precio.',
								},
								id: 'c6833ff7067188bc-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cada nivel tiene una responsabilidad. Cambiar el estilo de un botón compartido puede afectar varias páginas. Cambiar el texto de un botón dentro de una sección modifica el contenido de esa sección. Confundir las dos cosas llevaría a acumular excepciones en el código o a necesitar desarrollo para corregir una frase.',
								},
								id: 'fc3191a06abcdb88-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Lo que el editor permite modificar' },
								id: 'd8d6e7d3ce76d4b3-3',
								type: 'header',
							},
							{
								data: {
									text: 'Las secciones declaran su configuración: textos, imágenes, enlaces y opciones previstas por el tema. El siguiente ejemplo mínimo fue escrito para este artículo y es distinto del código del proyecto. Representa un título y una dirección que se quieren hacer editables:',
								},
								id: 'dddc6273d6841a8b-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```json\n{\n  "name": "Introduction",\n  "settings": [\n    { "type": "text", "id": "intro_title", "label": "Titre" },\n    { "type": "url", "id": "intro_destination", "label": "Lien" }\n  ]\n}\n```',
								},
								id: '22b9f3e061efcb51-5',
								type: 'code',
							},
							{
								data: {
									text: 'En el ejemplo, <code>intro_title</code> e <code>intro_destination</code> son identificadores estables. El cliente trabaja con las etiquetas visibles del editor. Puede cambiar el contenido sin tener que encontrar una línea de HTML.',
								},
								id: '9fc34e10c29ebee9-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La estructura visual sigue definida por el tema. Agregar una interacción nueva o una nueva familia de páginas requiere desarrollo. La autonomía prevista corresponde a tareas reconocibles: corregir una frase, reemplazar una imagen, actualizar una presentación o cambiar el destino de un enlace.',
								},
								id: '6c6f0e213db3e0e4-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Cuando una plantilla es compartida' },
								id: 'a642c95ae486264a-8',
								type: 'header',
							},
							{
								data: {
									text: 'Si dos páginas usan la misma plantilla, cambiar su composición puede afectar a ambas. Antes de editar, hay que distinguir el contenido propio de cada página de la estructura compartida. La documentación de entrega debe explicar ese alcance.',
								},
								id: '5f65fc067f9150ef-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un mapa breve de edición ayuda a hacerlo concreto: biografías en la sección del equipo, artículos en el blog y datos del café en el catálogo y sus campos personalizados. El lugar correcto depende del tipo de información, no solamente de dónde aparece en la pantalla.',
								},
								id: 'd2c219f80ba16a67-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le site repose sur un thème Liquid de Shopify, à partir de la base Skeleton. Liquid assemble les contenus gérés par Shopify avec les éléments du thème. Le navigateur reçoit ensuite une page HTML, sa présentation CSS et les comportements JavaScript nécessaires. Cette organisation convient au besoin du projet : une vitrine dont la gestion et le futur catalogue se trouvent dans la même administration.',
								},
								id: '6f0b3d13dc46b477-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le thème comporte plusieurs niveaux. Une enveloppe commune place l’en-tête, le contenu principal et le pied de page. Les modèles JSON indiquent quelles sections composent une famille de pages. Les sections portent les éléments visibles, comme le bandeau d’accueil ou la présentation de l’équipe. Des petits composants réutilisés prennent en charge des détails communs, par exemple un bouton ou un prix.',
								},
								id: '688247d7880898d2-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Chaque niveau a une responsabilité. Changer le style d’un bouton partagé peut modifier plusieurs pages. Changer le texte d’un bouton dans une section vise le contenu de cette section. Confondre les deux conduirait soit à multiplier les exceptions dans le code, soit à demander du développement pour une simple correction de texte.',
								},
								id: 'bc4b8437f56fd48f-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Ce que l’éditeur rend modifiable' },
								id: '88120de5d930b6b0-3',
								type: 'header',
							},
							{
								data: {
									text: 'Les sections déclarent leurs réglages : textes, images, liens et options prévues par le thème. L’exemple suivant est une illustration minimale écrite pour cet article, distincte du code du projet. Il représente un titre et une destination que l’on souhaite rendre modifiables :',
								},
								id: 'a110ce2ba0d7f0eb-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```json\n{\n  "name": "Introduction",\n  "settings": [\n    { "type": "text", "id": "intro_title", "label": "Titre" },\n    { "type": "url", "id": "intro_destination", "label": "Lien" }\n  ]\n}\n```',
								},
								id: '22b9f3e061efcb51-5',
								type: 'code',
							},
							{
								data: {
									text: 'Dans cet exemple, <code>intro_title</code> et <code>intro_destination</code> sont des identifiants stables. Le client travaille avec les libellés visibles dans l’éditeur. Il peut modifier le contenu sans avoir à retrouver une ligne de HTML.',
								},
								id: '87bb1299caf81b05-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le cadre visuel demeure défini par le thème. Ajouter une nouvelle interaction ou une nouvelle famille de pages demande encore du développement. L’autonomie visée concerne des tâches reconnaissables : corriger une phrase, remplacer une image, mettre à jour une présentation ou changer la destination d’un lien.',
								},
								id: '1d76be07002a2d0b-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Le cas d’un modèle partagé' },
								id: '831d7af4d8c7758d-8',
								type: 'header',
							},
							{
								data: {
									text: 'Si deux pages utilisent le même modèle, modifier la composition de ce modèle peut toucher les deux. Avant une modification, il faut donc distinguer le contenu propre à la page de la structure commune. La documentation de remise devra indiquer cette portée.',
								},
								id: 'bab8795bd891251c-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une courte carte d’édition suffit souvent à rendre cette distinction concrète : les biographies dans la section d’équipe, les articles dans le blogue, les renseignements sur un café dans le catalogue et les champs personnalisés. Le bon endroit dépend du type d’information, pas seulement de l’endroit où elle apparaît à l’écran.',
								},
								id: '8c066fb3f17ff605-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'How the theme separates layout from content',
					es: 'Cómo el tema separa la presentación del contenido',
					fr: 'Comment le thème sépare la mise en page du contenu',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A catalogue is more than a collection of cards with names and prices. Each object needs a clear meaning. A product holds a shared presentation. A variant identifies a specific combination of selectable options. A collection groups products for navigation. A custom field describes an additional characteristic.',
								},
								id: '02d1d92dd6b75485-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For Café Arona, the collection structure provides for green coffee, roasted coffee and merchandise. That gives the project’s categories a place; it does not announce that all those products are available. Final content and publication states must follow the client’s confirmed decisions.',
								},
								id: 'd13c127ce9b64422-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Description, option or inventory data?' },
								id: '4a04a5e0d60fe7eb-2',
								type: 'header',
							},
							{
								data: {
									text: 'A coffee’s origin and tasting notes describe the product. A package size or preparation can distinguish a variant. An available quantity refers to particular units. Mixing these details into a single paragraph can make a page look complete while leaving its management data incomplete.',
								},
								id: 'd949c979c20eb0cd-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme has an information panel that displays custom fields, treating single values and lists differently. Tasting notes can therefore appear as several items. This Liquid illustration is independent of the project code:',
								},
								id: 'b2e991272d997555-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```liquid\n{% for tasting_note in coffee_notes %}\n  <span>{{ tasting_note | escape }}</span>\n{% endfor %}\n```',
								},
								id: '5f50bc9f17c576e2-5',
								type: 'code',
							},
							{
								data: {
									text: 'Here, <code>coffee_notes</code> represents a list, and <code>tasting_note</code> one note at a time. The <code>escape</code> filter displays each value as text rather than HTML markup. The example shows how a shared presentation can receive different information. It does not decide which flavours describe the coffee: those values must come from confirmed products and approved writing.',
								},
								id: '31db1db9bbe110d6-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Not every field belongs in public. Information intended for display needs to be separated from internal working notes. Catalogue onboarding must therefore include a check of what actually appears on the product page, not only the form used to enter it.',
								},
								id: 'ec18341b5b7f077d-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A worked example of combinations' },
								id: 'c1bf82a8fb6f69e4-8',
								type: 'header',
							},
							{
								data: {
									text: 'Consider a fictional example, unrelated to Café Arona’s final package sizes: two sizes, A and B, and two preparations, whole bean or ground. That gives 2 × 2 = 4 possible combinations. If only three have been approved, the fourth should not appear as a variant that is merely sold out. It is not yet a confirmed offer.',
								},
								id: 'e8cc21d9f0126896-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The distinction also matters for images and prices. Each selection must retain the correct variant identifier, show the corresponding information and avoid silently reusing another option’s details. A cart quantity applies to the selected variant, not the coffee’s general name.',
								},
								id: 'f976438d107da58b-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This structure separates the components already built from the data they display. A confirmed catalogue can be added without rebuilding the presentation of every product page. The editing framework stays consistent, while values and variants belong to each product.',
								},
								id: '965e255857c3f2a8-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'An empty collection is different from a search with no results',
								},
								id: 'a445cb8f74699273-12',
								type: 'header',
							},
							{
								data: {
									text: 'A collection organizes access to products. Its template displays a grid, filtering controls and pagination when needed. It also provides for two situations that look similar but need different explanations: the collection contains no products, or the chosen filters produce no results.',
								},
								id: 'ad7633583f9b817b-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'In the first case, visitors need to understand what the section is for and where to continue. In the second, they need to understand that their selection limits the results and be able to change it. Using the same message for both could suggest that a filter made the catalogue disappear, or that changing options can fix an empty section.',
								},
								id: '574e4037fff8bfb5-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme represents this distinction through shared state messages. Their visual structure stays consistent while the heading, explanation and action match the situation. This is useful reuse: the component handles presentation, and the collection’s data determines the message’s meaning.',
								},
								id: '822d2c38653abe47-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Reviewing a collection therefore includes its normal display, pagination and states without content. It also includes links to product pages. Visitors move between several views of the same catalogue; consistency extends beyond an isolated product card.',
								},
								id: '1c3563b1bdc42189-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Un catálogo no se reduce a una serie de tarjetas con nombres y precios. Cada objeto necesita una definición clara. Un producto reúne una presentación común. Una variante identifica una combinación específica de opciones seleccionables. Una colección agrupa productos para la navegación. Un campo personalizado describe una característica adicional.',
								},
								id: 'f91731340b623f69-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En Café Arona, la estructura de colecciones contempla café verde, café tostado y mercancía. Esa organización les da un lugar a las categorías del proyecto; no anuncia que todos esos productos estén disponibles. El contenido definitivo y su estado de publicación deben corresponder a las decisiones confirmadas del cliente.',
								},
								id: 'c61d0b8bad546831-1',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: '¿Descripción, opción o dato de inventario?',
								},
								id: 'd697ab03db8e205f-2',
								type: 'header',
							},
							{
								data: {
									text: 'El origen y las notas de sabor describen el producto. Una presentación o preparación puede distinguir una variante. La cantidad disponible corresponde a unidades específicas. Mezclar estos datos en un solo párrafo puede hacer que la página parezca completa mientras la información necesaria para administrarla sigue incompleta.',
								},
								id: 'da93c158f2f0ba2e-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El tema tiene una ficha que muestra campos personalizados y trata de manera distinta los valores individuales y las listas. Las notas de sabor pueden aparecer como varios elementos. Este ejemplo en Liquid es independiente del código del proyecto:',
								},
								id: '66a8c9f2db3ebbb5-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```liquid\n{% for tasting_note in coffee_notes %}\n  <span>{{ tasting_note | escape }}</span>\n{% endfor %}\n```',
								},
								id: '5f50bc9f17c576e2-5',
								type: 'code',
							},
							{
								data: {
									text: 'Aquí, <code>coffee_notes</code> representa una lista y <code>tasting_note</code> una nota a la vez. El filtro <code>escape</code> muestra cada valor como texto y no como código HTML. El ejemplo explica cómo una misma presentación puede recibir información distinta. No decide cuáles sabores describen el café: esos valores deben venir de productos confirmados y textos aprobados.',
								},
								id: 'b2d46ac5edab13db-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'No todos los campos están destinados al público. La información que se mostrará debe separarse de las notas internas de trabajo. Por eso, la incorporación del catálogo debe revisar lo que realmente aparece en la ficha, además del formulario utilizado para ingresar los datos.',
								},
								id: 'd74f19e9fcd5d48d-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Un ejemplo de combinaciones' },
								id: '930d7a1a5a1e4058-8',
								type: 'header',
							},
							{
								data: {
									text: 'Tomemos un caso ficticio, sin relación con las presentaciones definitivas de Café Arona: dos tamaños, A y B, y dos preparaciones, en grano o molida. Eso da 2 × 2 = 4 combinaciones posibles. Si solo tres están aprobadas, la cuarta no debe aparecer como una variante que simplemente está agotada. Todavía no es una oferta confirmada.',
								},
								id: '612e34176bb50804-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La diferencia también importa para las imágenes y los precios. Cada selección debe conservar el identificador correcto de la variante, mostrar sus datos y evitar reutilizar silenciosamente los de otra opción. La cantidad del carrito corresponde a la variante elegida, no al nombre general del café.',
								},
								id: '3910e174c86a04d3-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esta estructura separa los componentes ya construidos de los datos que muestran. Se puede incorporar un catálogo confirmado sin reconstruir la presentación de cada ficha. El esquema de edición se mantiene, mientras los valores y las variantes corresponden a cada producto.',
								},
								id: '33a1baab16ce601c-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Una colección vacía es distinta de una búsqueda sin resultados',
								},
								id: '69ee91f608ab0ad0-12',
								type: 'header',
							},
							{
								data: {
									text: 'Una colección organiza el acceso a los productos. Su plantilla presenta una cuadrícula, controles de filtrado y paginación cuando hace falta. También contempla dos situaciones que pueden verse parecidas, pero necesitan explicaciones distintas: la colección no tiene productos o los filtros elegidos no producen resultados.',
								},
								id: 'd3e2d97ae8d220ff-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En el primer caso, la persona necesita entender para qué sirve esa sección y dónde puede continuar. En el segundo, debe comprender que su selección limita los resultados y poder modificarla. Utilizar el mismo mensaje en ambos casos podría sugerir que un filtro hizo desaparecer el catálogo o que una sección vacía se soluciona cambiando opciones.',
								},
								id: '63a89272e4ed327e-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El tema representa esa diferencia mediante mensajes de estado compartidos. Su estructura visual se mantiene, mientras el título, la explicación y la acción corresponden a cada situación. Es una reutilización útil: el componente maneja la presentación y los datos de la colección determinan el sentido del mensaje.',
								},
								id: '05537faa8d317fc9-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La revisión de una colección incluye entonces su presentación normal, la paginación y los estados sin contenido. También debe revisar los enlaces a las fichas. La persona recorre varias vistas del mismo catálogo; la coherencia va más allá de una tarjeta de producto aislada.',
								},
								id: 'da1d6457743ce142-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Un catalogue ne se résume pas à une série de cartes avec un nom et un prix. Il faut définir ce que représente chaque objet. Un produit rassemble une présentation commune. Une variante désigne une combinaison précise d’options que l’on pourra sélectionner. Une collection regroupe des produits pour la navigation. Un champ personnalisé décrit une caractéristique supplémentaire.',
								},
								id: '702c6fabcff70c2f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Dans Café Arona, la structure de collections prévoit le café vert, le café torréfié et la marchandise. Cette organisation donne une place aux catégories du projet; elle ne constitue pas une annonce de produits tous disponibles. Le contenu final et son état de publication doivent suivre les décisions confirmées du client.',
								},
								id: 'b8a737d6aa54d078-1',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Description, option ou donnée de stock?',
								},
								id: '549aa6438b4adae7-2',
								type: 'header',
							},
							{
								data: {
									text: 'L’origine d’un café et ses notes de dégustation décrivent le produit. Un format ou une préparation peut distinguer une variante. La quantité disponible correspond à des unités précises. Si ces informations sont mélangées dans un seul paragraphe, la page peut sembler complète alors que les données nécessaires à la gestion ne le sont pas.',
								},
								id: 'c9d6ba5780a47a39-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le thème possède une fiche qui affiche des champs personnalisés, avec un traitement différent pour les valeurs simples et les listes. Les notes de dégustation peuvent ainsi être présentées comme plusieurs éléments. Voici une illustration Liquid indépendante du code du projet :',
								},
								id: '2a9f25124259a4ed-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```liquid\n{% for tasting_note in coffee_notes %}\n  <span>{{ tasting_note | escape }}</span>\n{% endfor %}\n```',
								},
								id: '5f50bc9f17c576e2-5',
								type: 'code',
							},
							{
								data: {
									text: '<code>coffee_notes</code> représente ici une liste, et <code>tasting_note</code> une note à la fois. Le filtre <code>escape</code> fait afficher chaque valeur comme du texte plutôt que comme du balisage HTML. L’exemple montre comment une même présentation peut recevoir des renseignements différents. Il ne détermine pas les arômes du café : les valeurs doivent venir des produits confirmés et des textes approuvés.',
								},
								id: '35a4e92e1a205c02-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Tous les champs ne sont pas destinés au public. Les renseignements affichables doivent être distingués des notes de travail internes. La reprise du catalogue doit donc inclure une vérification de ce qui ressort réellement dans la fiche, et pas seulement du formulaire qui sert à saisir les données.',
								},
								id: '2f8a9673ec71a856-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Un exemple de combinaisons' },
								id: '73709a95d49d1a84-8',
								type: 'header',
							},
							{
								data: {
									text: 'Prenons un exemple fictif, sans rapport avec les formats définitifs de Café Arona : deux formats, A et B, et deux préparations, en grains ou moulue. Cela donne 2 × 2 = 4 combinaisons possibles. Si seulement trois ont été approuvées, la quatrième ne doit pas apparaître comme une variante simplement épuisée. Elle n’est pas encore une offre confirmée.',
								},
								id: '3897e8e577695d41-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette différence compte aussi pour les photos et les prix. Chaque sélection doit conserver le bon identifiant de variante, afficher le renseignement qui lui correspond et ne pas reprendre silencieusement celui d’une autre option. La quantité du panier concerne la variante choisie, pas le nom général du café.',
								},
								id: '732aeb325db43d69-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette structure sépare les composants déjà construits des données qu’ils affichent. Un catalogue confirmé peut y être ajouté sans recréer la présentation de chaque fiche. Le cadre d’édition reste commun, tandis que les valeurs et les variantes appartiennent à chaque produit.',
								},
								id: 'd79ef2a12b92b9be-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Une collection vide n’est pas une recherche sans résultat',
								},
								id: '973c75e53f373757-12',
								type: 'header',
							},
							{
								data: {
									text: 'Une collection organise l’accès aux produits. Son modèle affiche une grille, les contrôles de filtrage et une pagination lorsque nécessaire. Il prévoit aussi deux situations qui se ressemblent visuellement, mais qui demandent des explications différentes : aucun produit dans la collection, ou aucun résultat pour les filtres choisis.',
								},
								id: '9a4b20b2d7e20148-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Dans le premier cas, le visiteur a besoin de savoir ce que contient cette rubrique et où poursuivre sa visite. Dans le second, il doit pouvoir comprendre que sa sélection limite les résultats et la modifier. Afficher le même message dans les deux cas laisserait croire qu’un filtre a fait disparaître le catalogue, ou qu’une rubrique vide peut être réparée en changeant des options.',
								},
								id: 'c9993cc78fba5ecd-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette séparation se retrouve dans le thème sous forme de messages d’état partagés. Le cadre visuel reste commun, tandis que le titre, l’explication et l’action correspondent à la situation. C’est un exemple de réutilisation utile : le composant assure la présentation; les données de la collection déterminent le sens du message.',
								},
								id: '9a6cb06143fc82f5-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La revue d’une collection doit donc inclure son état normal, sa pagination et ses états sans contenu. Elle doit également vérifier les liens vers les fiches. Le visiteur suit un parcours entre plusieurs vues du même catalogue; la cohérence ne se limite pas à une carte de produit isolée.',
								},
								id: 'aeb2fce12037f064-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'How to represent a coffee, its information and its variants',
					es: 'Cómo representar un café, sus datos y sus variantes',
					fr: 'Comment représenter un café, ses renseignements et ses variantes',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A visible product is not necessarily purchasable. A page may introduce an upcoming offer. A variant may exist without being available. A quantity may be insufficient for a request. These situations need different messages and actions.',
								},
								id: '759b20f6860f08b5-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme prepares an initial state on Shopify’s side when the page is generated. JavaScript in the browser then responds to option choices: it finds the corresponding variant and updates the visible information. The important point is consistency between those moments. A rule applied when the page loads must continue to apply after a selection changes.',
								},
								id: '6383007630c8deed-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Making the rule explicit' },
								id: 'ed0de94b2a3cb858-2',
								type: 'header',
							},
							{
								data: {
									text: 'The following model was written for the article to explain that distinction. It represents a rule to verify before opening sales; it is not the project’s deployed code:',
								},
								id: 'a5fac9c9b9c9009f-3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```javascript\nfunction purchaseState({ salesEnabled, productApproved, variant }) {\n  if (!salesEnabled || !productApproved) return "information";\n  if (!variant) return "unavailable";\n  return variant.available ? "available" : "sold_out";\n}\n```',
								},
								id: 'eed564166260c399-4',
								type: 'code',
							},
							{
								data: {
									text: 'The model first checks whether sales and the product are authorized, then whether the variant exists, and finally whether it is available. The identifiers are illustrative. What matters is the order of reasoning: available stock should not override a decision to present a product for information only.',
								},
								id: '6b87b0621edc745f-5',
								type: 'paragraph',
							},
							{
								data: { text: 'Four situations produce different expectations:' },
								id: '27d45ae7327991a7-6',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: 'Sales are not open: the page can inform visitors without offering a purchase.',
											items: [],
										},
										{
											content: 'The product is confirmed but the combination does not exist: explain that the selection is not offered.',
											items: [],
										},
										{
											content: 'The variant exists but is unavailable: show that state without presenting it as a website error.',
											items: [],
										},
										{
											content: 'The variant is available within an authorized sales journey: allow the visitor to proceed, subject to the cart’s final validation.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'd1497da5403a3c9a-7',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'To verify this behaviour, the same rules need to be checked on initial display, after an option changes and when an addition is requested. A disabled button in a screenshot cannot demonstrate that entire journey. The useful scenario is a changing selection: its message, variant and permitted action need to stay consistent.',
								},
								id: '627108f428dc51f4-8',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A request and its response' },
								id: 'c70ba889d3f04963-9',
								type: 'header',
							},
							{
								data: {
									text: 'The browser sends an add-to-cart request and receives a response from Shopify. Until the response arrives, the interface needs to distinguish a request in progress from a confirmed addition. A quantity failure and a network problem call for different explanations.',
								},
								id: '124f2e862fb806d0-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The addition itself also needs to be distinguished from refreshing the cart display. If the addition succeeds but the counter does not refresh, automatically retrying could add the product twice. Visual feedback should follow what the system has actually confirmed.',
								},
								id: '83dd1aead637e244-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This makes validation practical: try a variant change, a missing combination, a rejected quantity and a slow response. Those behaviours cannot be checked by looking only at the page in its normal state.',
								},
								id: '308e215440cf9522-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Displayed availability also belongs to a moment in time. Stock can change while someone chooses options. Browser-side checks help guide that selection, but a request rejected by the service must remain rejected even if the button was active a moment earlier. The message needs to help the visitor resume the journey without treating the earlier display as an order confirmation.',
								},
								id: '8ea6388608ae0154-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Un producto visible no necesariamente se puede comprar. Una ficha puede presentar una oferta futura. Una variante puede existir sin estar disponible. Una cantidad puede ser insuficiente para la solicitud. Esas situaciones requieren mensajes y acciones diferentes.',
								},
								id: 'ad6f53b2a7de4e60-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El tema prepara un estado inicial del lado de Shopify cuando se genera la página. Después, el JavaScript del navegador responde a la selección de opciones: busca la variante correspondiente y actualiza la información visible. Lo importante es mantener la coherencia entre esos dos momentos. Una regla aplicada al cargar la página debe seguir aplicándose después de cambiar la selección.',
								},
								id: 'd9c6eeb7c005271e-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Expresar la regla con claridad' },
								id: '63311f1e9e40d4b4-2',
								type: 'header',
							},
							{
								data: {
									text: 'El siguiente modelo fue escrito para el artículo y explica esa diferencia. Representa una regla que debe verificarse antes de abrir las ventas; no es el código desplegado del proyecto:',
								},
								id: 'f305fd3d89e71ff2-3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```javascript\nfunction purchaseState({ salesEnabled, productApproved, variant }) {\n  if (!salesEnabled || !productApproved) return "information";\n  if (!variant) return "unavailable";\n  return variant.available ? "available" : "sold_out";\n}\n```',
								},
								id: 'eed564166260c399-4',
								type: 'code',
							},
							{
								data: {
									text: 'El modelo revisa primero si las ventas y el producto están autorizados, después si la variante existe y, por último, si está disponible. Los identificadores son ilustrativos. Lo importante es el orden del razonamiento: tener inventario disponible no debe anular la decisión de presentar un producto únicamente como información.',
								},
								id: '7a30d6d374e2b560-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cuatro situaciones producen expectativas distintas:',
								},
								id: '9d1f91ab7cbf92fd-6',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: 'Ventas sin abrir: la página puede informar sin ofrecer la compra.',
											items: [],
										},
										{
											content: 'Producto confirmado y combinación inexistente: explicar que esa selección no se ofrece.',
											items: [],
										},
										{
											content: 'Variante existente pero no disponible: comunicar ese estado sin presentarlo como un error del sitio.',
											items: [],
										},
										{
											content: 'Variante disponible dentro de un recorrido de venta autorizado: permitir continuar, sujeto a la validación final del carrito.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: 'e51d862fe0983f73-7',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Para verificar este comportamiento, hay que revisar las mismas reglas en la presentación inicial, al cambiar una opción y al solicitar agregar al carrito. Un botón desactivado en una captura no demuestra todo ese recorrido. El escenario útil es una selección que cambia: el mensaje, la variante y la acción permitida deben seguir siendo coherentes.',
								},
								id: '4fad36af82c8b713-8',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La solicitud y su respuesta' },
								id: 'ffb2d952c0a07f6f-9',
								type: 'header',
							},
							{
								data: {
									text: 'El navegador envía una solicitud para agregar al carrito y recibe una respuesta de Shopify. Mientras llega esa respuesta, la interfaz debe distinguir una solicitud en curso de una adición confirmada. Un rechazo por cantidad y un problema de red necesitan explicaciones diferentes.',
								},
								id: 'ee379b555c2fdf4f-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'También hay que diferenciar la adición del producto de la actualización visual del carrito. Si la primera funciona, pero el contador no se actualiza, repetir automáticamente la solicitud podría agregar el producto dos veces. La respuesta visual debe seguir lo que el sistema realmente confirmó.',
								},
								id: 'b7b1a6748b83743f-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esto vuelve concreta la validación: probar un cambio de variante, una combinación ausente, una cantidad rechazada y una respuesta lenta. Esos comportamientos no se comprueban mirando solamente la página en su estado normal.',
								},
								id: '0eb4742d47604e1f-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La disponibilidad mostrada también corresponde a un momento. El inventario puede cambiar mientras la persona elige las opciones. La validación del navegador ayuda a orientar esa selección, pero una solicitud rechazada por el servicio sigue rechazada aunque el botón estuviera activo un instante antes. El mensaje debe permitir retomar el recorrido sin presentar la información anterior como una confirmación de pedido.',
								},
								id: '0620e04ebca6e83a-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Un produit visible n’est pas nécessairement achetable. Une fiche peut servir à présenter une offre à venir. Une variante peut exister sans être disponible. Une quantité peut être insuffisante pour la demande. Ces situations doivent produire des messages et des actions différents.',
								},
								id: 'df1f793b2be66daa-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le thème prépare un premier état côté Shopify lorsque la page est générée. Ensuite, le JavaScript du navigateur réagit au choix des options : il cherche la variante correspondante et met à jour les renseignements visibles. Le point important est la cohérence entre ces deux moments. Une règle appliquée au chargement doit continuer à s’appliquer après un changement de sélection.',
								},
								id: '9ae30655f77cf7ff-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Rendre la règle explicite' },
								id: 'bbb9d3c4b1ec7a7b-2',
								type: 'header',
							},
							{
								data: {
									text: 'Pour expliquer cette distinction, voici un modèle illustratif écrit pour l’article. Il représente une règle à vérifier avant l’ouverture des ventes; ce n’est pas le code déployé du projet :',
								},
								id: '1138d30dfb4ee2a6-3',
								type: 'paragraph',
							},
							{
								data: {
									code: '```javascript\nfunction purchaseState({ salesEnabled, productApproved, variant }) {\n  if (!salesEnabled || !productApproved) return "information";\n  if (!variant) return "unavailable";\n  return variant.available ? "available" : "sold_out";\n}\n```',
								},
								id: 'eed564166260c399-4',
								type: 'code',
							},
							{
								data: {
									text: 'Le modèle examine d’abord si les ventes et le produit sont autorisés, puis si la variante existe, et enfin si elle est disponible. Les identifiants sont fictifs. L’intérêt est l’ordre du raisonnement : un stock disponible ne doit pas annuler une décision de présenter le produit à titre informatif.',
								},
								id: '69c8127764f41509-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Quatre situations donnent des attentes différentes :',
								},
								id: 'fd4cd8bee6371e37-6',
								type: 'paragraph',
							},
							{
								data: {
									items: [
										{
											content: 'Ventes non ouvertes : la page peut informer, sans proposer l’achat.',
											items: [],
										},
										{
											content: 'Produit confirmé, combinaison inexistante : expliquer que cette sélection n’est pas proposée.',
											items: [],
										},
										{
											content: 'Variante existante mais indisponible : annoncer son indisponibilité, sans la confondre avec une erreur du site.',
											items: [],
										},
										{
											content: 'Variante disponible dans un parcours de vente autorisé : permettre de poursuivre, sous réserve de la validation finale du panier.',
											items: [],
										},
									],
									style: 'unordered',
								},
								id: '4cbf2836192ac1a0-7',
								type: 'nestedlist',
							},
							{
								data: {
									text: 'Pour vérifier ce comportement, les mêmes règles doivent être examinées à l’affichage initial, au changement d’option et au moment de la demande d’ajout. La présence d’un bouton désactivé sur une capture ne suffit pas à démontrer tout ce parcours. Le scénario intéressant est celui où la sélection change : le message, la variante et l’action autorisée doivent rester cohérents.',
								},
								id: '0612636df388f260-8',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La demande et sa réponse' },
								id: '557e34744fac5332-9',
								type: 'header',
							},
							{
								data: {
									text: 'Le navigateur envoie une demande d’ajout au panier, puis reçoit une réponse de Shopify. Tant que cette réponse n’est pas revenue, l’interface doit distinguer une demande en cours d’un ajout confirmé. Un échec de quantité et un problème de réseau ne demandent pas la même explication.',
								},
								id: 'c6027e6b1d03dd7e-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Il faut aussi distinguer l’ajout lui-même de la mise à jour de l’affichage du panier. Si l’ajout réussit mais que le compteur ne se rafraîchit pas, relancer automatiquement la commande pourrait ajouter le produit deux fois. Le retour visuel doit donc suivre ce que le système a effectivement confirmé.',
								},
								id: '1eca49e0a041886a-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ces détails donnent un sens pratique à la validation : essayer un changement de variante, une combinaison absente, une quantité refusée et une réponse lente. Ils ne se vérifient pas en regardant seulement la page dans son état normal.',
								},
								id: '8a6b519f35b0f31a-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La disponibilité affichée sur une page correspond aussi à un moment. Pendant que la personne choisit ses options, l’état du stock peut changer. La vérification côté navigateur aide à guider la sélection, mais une demande refusée par le service doit rester un refus, même si le bouton était actif juste avant. Le message doit permettre de reprendre le parcours sans présenter l’ancien affichage comme une confirmation de commande.',
								},
								id: '9ba98ea8a403553e-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Why availability has to remain consistent throughout the journey',
					es: 'Por qué la disponibilidad debe ser coherente durante todo el recorrido',
					fr: 'Pourquoi la disponibilité doit rester cohérente pendant tout le parcours',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The theme can display a price, availability and several options. For those elements to make sense, their data needs to describe the same variant and product state. The question extends beyond appearance: what is being counted, who confirms the information and which value is used for display?',
								},
								id: 'c49fe87dba687682-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A physical unit count, reserved quantity and availability are not interchangeable. An approved description and photograph do not replace a count. Conversely, an available quantity does not confirm the commercial wording or delivery terms.',
								},
								id: 'eec1f8a4dd2611b6-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'The catalogue intake record' },
								id: 'ce114ccbe3b36bc6-2',
								type: 'header',
							},
							{
								data: {
									text: 'The catalogue intake model provides for one row per variant intended for sale. That row needs to connect its name, options, size, approved price, image, quantity and state. It should also identify who approved the information. The examples here contain none of the client’s operating data.',
								},
								id: '35928f33d50e7eb2-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Missing information remains unconfirmed. Replacing it with a plausible value would erase the distinction between a layout example and a real offer. The same rule applies to translations and flavour descriptions.',
								},
								id: '5bad6eea3a7c5ddc-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'A fictional calculation to explain the check',
								},
								id: 'becb24fb3cde55b9-5',
								type: 'header',
							},
							{
								data: {
									text: 'Imagine, solely to illustrate the method, 40 physically counted finished units, including 6 reserved units and 2 that cannot be sold. If those categories are distinct and included in the original 40, the remaining quantity would be 40 − 6 − 2 = 32. This calculation does not describe any Café Arona inventory.',
								},
								id: '44573a5417eccf72-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The point is to establish definitions. If a system already reports availability after reservations, subtracting the six units again would introduce an error. Before reconciling a spreadsheet with Shopify, each column needs a clear meaning, a corresponding variant and a time for its count.',
								},
								id: '8848d3a9a30c3960-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Integrating in controlled stages' },
								id: '7177c63aac550760-8',
								type: 'header',
							},
							{
								data: {
									text: 'The catalogue can first be integrated through a small representative set: a product page with its options, fields, images and translations. Previewing it will show what that structure actually produces. Once the entry pattern is confirmed, the remaining pages can follow the same framework.',
								},
								id: '8e59fec2cabcb1e2-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This method concerns the quality of incoming data. The presentation architecture is already built; the review follows relationships between products, collections, variants and quantities. It checks the result of data entry without confusing its appearance with its validity.',
								},
								id: 'd7d181524061a5b4-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El tema puede mostrar un precio, disponibilidad y varias opciones. Para que esos elementos tengan sentido, sus datos deben describir la misma variante y el mismo estado del producto. La pregunta va más allá de la apariencia: qué se cuenta, quién confirma la información y cuál dato se utiliza para mostrarla.',
								},
								id: '5d607742e3097204-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un conteo de unidades físicas, una cantidad reservada y la disponibilidad no son intercambiables. Una descripción y una fotografía aprobadas no reemplazan un conteo. Del mismo modo, una cantidad disponible no confirma el texto comercial ni las condiciones de envío.',
								},
								id: '423e484c6bf7228b-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La ficha de recepción del catálogo' },
								id: 'e8b731d2852ffaf4-2',
								type: 'header',
							},
							{
								data: {
									text: 'El modelo de recepción del catálogo contempla una fila por variante destinada a la venta. Esa fila debe relacionar nombre, opciones, presentación, precio aprobado, imagen, cantidad y estado. También debe permitir identificar quién confirmó la información. Los ejemplos de este artículo no incluyen datos operativos del cliente.',
								},
								id: '13be0a9bc452d418-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un dato ausente sigue pendiente de confirmación. Reemplazarlo por un valor que parezca razonable borraría la diferencia entre un ejemplo de diseño y una oferta real. La misma regla aplica a las traducciones y a las descripciones de sabor.',
								},
								id: '6a8be0a5d8209bac-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un cálculo ficticio para entender el control',
								},
								id: '32b95da3416dd384-5',
								type: 'header',
							},
							{
								data: {
									text: 'Imaginemos, únicamente para ilustrar el método, 40 unidades terminadas contadas físicamente, entre ellas 6 reservadas y 2 que no se pueden vender. Si esas categorías son distintas y están incluidas en las 40 iniciales, quedarían 40 − 6 − 2 = 32. Este cálculo no describe ningún inventario de Café Arona.',
								},
								id: '9c6cd39cf7260129-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El propósito del ejemplo es precisar las definiciones. Si un sistema ya informa la cantidad disponible después de las reservas, restar nuevamente las seis unidades introduciría un error. Antes de comparar una hoja de cálculo con Shopify, hay que verificar qué cuenta cada columna, a cuál variante corresponde y cuándo se hizo el registro.',
								},
								id: 'ae1d61e09cce4657-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Integrar por etapas controladas' },
								id: 'fe382b3574fbccdd-8',
								type: 'header',
							},
							{
								data: {
									text: 'El catálogo puede incorporarse primero con un conjunto pequeño y representativo: una ficha con sus opciones, campos, imágenes y traducciones. La vista previa permitirá revisar lo que realmente produce esa estructura. Una vez confirmado el modelo de ingreso, las demás fichas podrán seguir el mismo esquema.',
								},
								id: 'b74196544b19db9d-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Este método se refiere a la calidad de los datos recibidos. La arquitectura de presentación ya está construida; la revisión sigue las relaciones entre productos, colecciones, variantes y cantidades. Permite comprobar el resultado de un registro sin confundir su apariencia con su validez.',
								},
								id: '48f8d353cf037f30-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le thème peut afficher un prix, une disponibilité et plusieurs options. Pour que ces éléments aient un sens, les données doivent décrire la même variante et le même état du produit. La question dépasse donc l’apparence de la fiche : que compte-t-on, qui confirme l’information et quelle donnée sert à l’affichage?',
								},
								id: '2308e4457cf62187-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un nombre d’unités physiques, un nombre d’unités réservées et une disponibilité ne sont pas interchangeables. Une description et une photo approuvées ne remplacent pas un comptage. Inversement, une quantité disponible ne confirme ni le texte commercial ni les conditions de livraison.',
								},
								id: '37e1431b98e4b4ea-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La fiche de réception du catalogue' },
								id: 'bf0ad6a6d469dce1-2',
								type: 'header',
							},
							{
								data: {
									text: 'Le modèle de réception du catalogue prévoit une ligne par variante destinée à la vente. Cette ligne doit relier son nom, ses options, son format, son prix approuvé, son image, sa quantité et son état. Elle doit également permettre de savoir qui a validé ces renseignements. Les exemples présentés ici ne reprennent aucune donnée d’exploitation du client.',
								},
								id: '6110332eaca787f0-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une donnée absente reste à confirmer. La remplacer par une valeur plausible ferait perdre la distinction entre une maquette et une offre réelle. Cette règle s’applique aussi aux traductions et aux descriptions de goût.',
								},
								id: '292085b67fd801a2-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un calcul fictif pour comprendre le contrôle',
								},
								id: '551a4fe43b4603d5-5',
								type: 'header',
							},
							{
								data: {
									text: 'Imaginons, uniquement pour illustrer la méthode, 40 unités finies comptées physiquement, dont 6 réservées et 2 non commercialisables. Si ces catégories sont distinctes et que les 40 unités les incluent, le nombre restant serait 40 − 6 − 2 = 32. Ce calcul ne décrit aucun stock de Café Arona.',
								},
								id: '6311fb2f2394ef3c-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L’intérêt de l’exemple est de préciser les définitions. Si un système donne déjà la quantité disponible après réservation, retirer encore les six unités produirait une erreur. Avant de rapprocher un tableau et Shopify, il faut vérifier ce que chaque colonne compte, à quelle variante elle correspond et à quel moment le relevé a été fait.',
								},
								id: 'e1fa8c80a6292a21-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Intégrer en étapes contrôlées' },
								id: '819929555738726d-8',
								type: 'header',
							},
							{
								data: {
									text: 'Le catalogue pourra être intégré d’abord sur un petit ensemble représentatif : une fiche avec ses options, ses champs, ses images et ses traductions. La prévisualisation permettra de vérifier ce que produit réellement cette structure. Une fois ce modèle de saisie confirmé, les autres fiches pourront suivre le même cadre.',
								},
								id: 'fbabc3f16fdf4ec9-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette méthode porte sur la qualité des données reçues. L’architecture de présentation est déjà construite; la vérification suit les relations entre produits, collections, variantes et quantités. Elle permet de contrôler le résultat d’une saisie sans confondre son apparence avec sa validité.',
								},
								id: 'bfa8968a2f5839d2-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Keeping catalogue data consistent',
					es: 'Mantener coherentes los datos del catálogo',
					fr: 'Des données de catalogue cohérentes',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'French is the project’s primary language. The theme also contains language files and a switching mechanism for English. That foundation prepares for bilingual use, but several kinds of content need to remain consistent.',
								},
								id: '0b328b2f394eb3ff-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Interface text includes navigation labels, buttons and success or error messages. Editorial content includes introductions, biographies and articles. Product information includes descriptions, option names and custom-field values. Updating one family does not automatically update the others.',
								},
								id: '86c1cdb4ae2426af-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme’s switcher uses Shopify’s localization form. Its role is to request a change among the available languages. Page addresses and website actions then need to continue in the correct language context. A translated button leading into the wrong journey would leave the work incomplete.',
								},
								id: 'a7ea5ca63968b376-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Starting from a content change' },
								id: 'f6247bdc2e32b887-3',
								type: 'header',
							},
							{
								data: {
									text: 'If the client changes a French description, the English review needs to check the same information, not just whether the sentence reads well. A removed tasting note, changed package size or revised availability condition needs an accurate equivalent.',
								},
								id: '20b0ba88643ee005-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A field’s label also needs to be distinguished from its value. Translating “origin” does not necessarily translate the content that follows it. The theme reads data that Shopify can localize, so editing needs to check both the label presented to the reader and the value displayed.',
								},
								id: '341fbc1bc6a34bb9-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Reviewing a complete journey' },
								id: '09ebcb3f029c24e9-6',
								type: 'header',
							},
							{
								data: {
									text: 'The planned review follows a page in both languages, then its links, messages and less common states. It includes longer content that changes the layout and errors that are not visible when the page first loads.',
								},
								id: '4e7134be9e232143-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That approach defines bilingual delivery through reviewed content and journeys. English files in the repository are not enough to establish that every client update has been translated. Bilingual management connects the changed content, its translation and the journey in which it appears.',
								},
								id: 'c6e07a0245d1fd05-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El francés es el idioma principal del proyecto. El tema también incluye archivos de idioma y un mecanismo para cambiar a inglés. Esa base prepara el uso bilingüe, pero varias clases de contenido deben conservar su coherencia.',
								},
								id: '594889c7eca704b0-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los textos de interfaz incluyen etiquetas de navegación, botones y mensajes de resultado o error. Los contenidos editoriales incluyen presentaciones, biografías y artículos. Los datos de producto abarcan descripciones, nombres de opciones y valores de campos personalizados. Actualizar una de estas familias no actualiza automáticamente las demás.',
								},
								id: 'f550dc2c8485b1ef-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El selector del tema utiliza el formulario de localización de Shopify. Su función es solicitar un cambio entre los idiomas disponibles. Las direcciones de las páginas y las acciones del sitio deben continuar después en el idioma correspondiente. Un botón traducido que lleve al recorrido equivocado dejaría el trabajo incompleto.',
								},
								id: '46afa8211adad90c-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Partir de un cambio de contenido' },
								id: '77e663565d6aa61f-3',
								type: 'header',
							},
							{
								data: {
									text: 'Si el cliente modifica una descripción en francés, la revisión del inglés debe comprobar la misma información, no solamente que la frase suene natural. Una nota de sabor retirada, una presentación modificada o una condición de disponibilidad revisada necesitan un equivalente preciso.',
								},
								id: '91e84600109d646f-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'También hay que diferenciar la etiqueta de un campo de su valor. Traducir «origen» no traduce necesariamente el contenido que aparece después. El tema lee datos que Shopify puede localizar; por eso, la edición debe revisar tanto el nombre que ve la persona como el valor mostrado.',
								},
								id: 'af455dd350da15cb-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Revisar un recorrido completo' },
								id: '50eec5adfe4f021f-6',
								type: 'header',
							},
							{
								data: {
									text: 'La revisión prevista sigue una página en ambos idiomas, después sus enlaces, mensajes y estados menos frecuentes. Incluye los contenidos largos que alteran la presentación y los errores que no aparecen al cargar inicialmente la página.',
								},
								id: '0fbe95d25cf45ede-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Este enfoque define la entrega bilingüe mediante contenidos y recorridos revisados. La existencia de archivos en inglés en el repositorio no demuestra que todas las actualizaciones del cliente estén traducidas. La administración bilingüe relaciona el contenido modificado, su traducción y el recorrido donde aparece.',
								},
								id: 'c92e01832f046f3d-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le français est la langue principale du projet. Le thème comprend aussi les fichiers de langue et le mécanisme de changement de langue pour l’anglais. Cette base prépare le bilinguisme, mais plusieurs familles de contenu doivent rester cohérentes.',
								},
								id: 'b925358118dac92a-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les textes d’interface sont les libellés de navigation, les boutons et les messages de résultat ou d’erreur. Les contenus éditoriaux sont les présentations, les biographies et les articles. Les renseignements produits comprennent les descriptions, les noms d’options et les valeurs des champs personnalisés. Une correction dans une famille ne met pas automatiquement les autres à jour.',
								},
								id: 'c0384226498bdca2-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le sélecteur du thème s’appuie sur le formulaire de localisation de Shopify. Son rôle est de demander un changement parmi les langues disponibles. Les adresses de pages et les actions du site doivent ensuite continuer dans le bon contexte de langue. Un bouton traduit qui ramène vers le mauvais parcours laisserait le travail incomplet.',
								},
								id: '66042b9fb877e9b0-2',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un changement de contenu comme point de départ',
								},
								id: 'b69438b6dc9de18d-3',
								type: 'header',
							},
							{
								data: {
									text: 'Si le client modifie une description française, la vérification anglaise doit porter sur la même information, pas uniquement sur la fluidité de la phrase. Une note de dégustation retirée, un format changé ou une condition de disponibilité révisée doit avoir un équivalent exact.',
								},
								id: '1ccc2b2192355e84-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Il faut aussi distinguer le libellé d’un champ de sa valeur. Traduire « origine » ne traduit pas nécessairement le contenu qui suit. Le thème lit des données que Shopify peut localiser; l’édition doit donc vérifier à la fois le nom présenté au lecteur et la donnée affichée.',
								},
								id: '93060c86aaf17c07-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Vérifier un parcours complet' },
								id: '72dd2accae1012fd-6',
								type: 'header',
							},
							{
								data: {
									text: 'La revue prévue suit une page dans les deux langues, puis ses liens, ses messages et ses états moins courants. Elle inclut les contenus longs qui changent le cadrage, ainsi que les erreurs qui ne sont pas visibles au premier chargement.',
								},
								id: '06f54c6bbd90e9da-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette approche permet de définir une livraison bilingue par des contenus et des parcours vérifiés. L’existence de fichiers anglais dans le dépôt ne suffit pas à déclarer toutes les mises à jour du client traduites. La gestion bilingue relie ainsi le contenu modifié, sa traduction et le parcours où il apparaît.',
								},
								id: '2100f62b081369ea-8',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'What French and English require beyond a language switcher',
					es: 'Lo que exigen el francés y el inglés además de un selector',
					fr: 'Ce que le français et l’anglais demandent au-delà d’un sélecteur',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Café Arona’s identity uses contrasting colours, distinctive typography, photographs and a video banner. The task is to retain that presence while leaving room for content and interaction.',
								},
								id: '28c2b4495359d6ee-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The team page is a useful example. The group photograph places people together. Individual portraits allow visitors to choose a person’s introduction. At a narrow width, the composition needs to remain readable without asking visitors to navigate a grid designed only for a large screen.',
								},
								id: '7c14fcfa27e264c4-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The theme has shared behaviour for the tabbed interfaces used by the team and values sections. It connects the selected item to its content panel and handles keyboard commands. The reuse concerns a shared behaviour; the two sections retain their own content and presentation.',
								},
								id: 'f6f375c61d2e8f4b-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Focus is part of the journey' },
								id: 'b5b384cf4027931f-3',
								type: 'header',
							},
							{
								data: {
									text: 'Seeing a selected portrait and knowing where keyboard focus is located are different pieces of information. Arrow keys, the start and end of a list, and panel visibility need to work together. The project’s logic tests cover index movement and key interpretation, among other rules. They do not replace using the actual page with a keyboard.',
								},
								id: 'd27a1ad93ba79dc5-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The same distinction applies to an error message. It needs to appear in the right place and be perceivable by someone who is not following only visual changes. The theme includes announcement regions, but those regions need to be checked alongside the complete behaviour.',
								},
								id: '59bfc2522834c452-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Images, video and page weight' },
								id: '4910429ba72ec20f-6',
								type: 'header',
							},
							{
								data: {
									text: 'Main images and small thumbnails serve different purposes. The theme requests appropriate sizes and reserves some display dimensions. The banner video has a poster image, and its behaviour takes a reduced-motion preference into account. These mechanisms are present in the code; their presence alone does not establish a measured performance result.',
								},
								id: '0096e71b7e7d0b69-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'An image that looks sharp on a large screen may be heavier than the intended use needs. A successful desktop crop may cut off a face on mobile. The review needs to consider what is actually visible, the image sizes downloaded and the browser’s behaviour.',
								},
								id: '9c6161aac1c01413-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The two home-page views selected for this presentation come from a browser showing the development storefront. The mobile view represents a browser width, not a test on a physical phone. They document the interface at this stage. They do not establish validation of every screen size or page.',
								},
								id: 'd023259f02e171a1-9',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La identidad de Café Arona utiliza contrastes de color, una tipografía marcada, fotografías y un banner de video. El trabajo consiste en conservar esa presencia y dar espacio al contenido y a las interacciones.',
								},
								id: '13ceed004ad875ed-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La página del equipo es un buen ejemplo. La fotografía grupal presenta a las personas en conjunto. Los retratos permiten seleccionar una presentación individual. En una pantalla estrecha, la composición debe seguir siendo legible sin exigir recorrer una cuadrícula pensada solamente para un monitor grande.',
								},
								id: '17478f3df7c1e134-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El tema tiene un comportamiento compartido para las interfaces de pestañas del equipo y los valores. Relaciona el elemento seleccionado con su panel de contenido y maneja comandos de teclado. La reutilización corresponde a un comportamiento común; las dos secciones conservan su propio contenido y presentación.',
								},
								id: '7c98bb86f5060153-2',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'El foco también forma parte del recorrido',
								},
								id: 'a92ed2d608a18756-3',
								type: 'header',
							},
							{
								data: {
									text: 'Ver un retrato seleccionado y saber dónde está el foco del teclado son datos distintos. Las flechas, el inicio y el final de la lista y la visibilidad del panel deben funcionar de forma coherente. Las pruebas de lógica del proyecto cubren, entre otras reglas, el desplazamiento entre índices y la interpretación de teclas. No reemplazan el uso real de la página con teclado.',
								},
								id: '7c72b3571405b63a-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Lo mismo ocurre con un mensaje de error. Debe aparecer en el lugar adecuado y ser perceptible para alguien que no sigue solamente los cambios visuales. El tema incluye zonas de anuncio, pero hay que revisarlas junto con el comportamiento completo.',
								},
								id: '28ef5c7ae10daab6-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Imágenes, video y peso de la página' },
								id: '070e0f7ab174d9e2-6',
								type: 'header',
							},
							{
								data: {
									text: 'Las imágenes principales y las miniaturas tienen funciones distintas. El tema solicita tamaños adecuados y reserva algunas dimensiones de presentación. El video del banner tiene una imagen de espera y su comportamiento tiene en cuenta la preferencia de reducir el movimiento. Esos mecanismos están en el código; su existencia no demuestra por sí sola un resultado de rendimiento medido.',
								},
								id: '61670e27f318f640-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Una imagen nítida en una pantalla grande puede ser más pesada de lo necesario. Un recorte que funciona en escritorio puede cortar un rostro en móvil. La revisión debe considerar el contenido realmente visible, los tamaños descargados y el comportamiento del navegador.',
								},
								id: '87da35cc627e5898-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las dos vistas de inicio seleccionadas para esta presentación provienen del navegador en el sitio de desarrollo. La vista móvil representa un ancho de navegador, no una prueba en un teléfono físico. Documentan la interfaz en esta etapa. No demuestran la validación de todos los tamaños de pantalla ni de todas las páginas.',
								},
								id: '77613485b4f4ad01-9',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'L’identité de Café Arona utilise des contrastes de couleurs, une typographie marquée, des photographies et un bandeau vidéo. La tâche consiste à conserver cette présence tout en laissant de la place au contenu et aux interactions.',
								},
								id: '2d768ff924e19118-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une page d’équipe illustre bien ce travail. La photo de groupe situe les personnes ensemble. Les portraits permettent de choisir une présentation individuelle. À petite largeur, la composition doit rester lisible sans demander au visiteur de parcourir une grille conçue seulement pour un grand écran.',
								},
								id: '05441ae616f5d243-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le thème possède un comportement partagé pour les interfaces à onglets de l’équipe et des valeurs. Il relie l’élément sélectionné au panneau de contenu correspondant et gère des commandes de clavier. La réutilisation porte ici sur un comportement commun; les deux sections conservent leur contenu et leur présentation.',
								},
								id: 'a96630b9ae22fe52-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Le focus fait partie du parcours' },
								id: '4a2a5c1c3593c582-3',
								type: 'header',
							},
							{
								data: {
									text: 'Voir un portrait sélectionné et savoir où se trouve le clavier sont deux informations différentes. Les flèches, le début et la fin de liste, ainsi que la visibilité du panneau doivent former un ensemble cohérent. Les tests de logique du projet couvrent notamment les déplacements d’index et l’interprétation des touches. Ils ne remplacent pas l’utilisation réelle de la page au clavier.',
								},
								id: '23ade4f9b0591856-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La même distinction vaut pour un message d’erreur : il doit apparaître au bon endroit et être perceptible par une personne qui ne suit pas uniquement les changements visuels. Le thème prévoit des zones d’annonce, mais leur présence doit être vérifiée avec le comportement complet.',
								},
								id: '5cbff2b6351c7c9d-5',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Images, vidéo et poids de la page' },
								id: 'cc2c0873c397a6db-6',
								type: 'header',
							},
							{
								data: {
									text: 'Les images principales et les petites vignettes n’ont pas le même rôle. Le thème demande des tailles adaptées et réserve certaines dimensions à l’affichage. La vidéo du bandeau possède une image d’attente; le comportement tient aussi compte d’une préférence de réduction des mouvements. Ces mécanismes font partie du code construit, sans démontrer à eux seuls une performance mesurée.',
								},
								id: '7a15de752f8ddebf-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une photo nette sur un grand écran peut être trop lourde pour l’usage prévu. Un recadrage réussi sur bureau peut couper un visage sur mobile. La vérification doit regarder le contenu réellement visible, les dimensions téléchargées et le comportement du navigateur.',
								},
								id: '3e59286f4cbad613-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les deux vues de l’accueil retenues pour cette présentation proviennent du navigateur sur la vitrine de développement. La vue mobile représente une largeur de navigateur, pas un essai sur un téléphone physique. Elles documentent l’interface à ce stade. Elles ne constituent pas une validation de tous les écrans ou de toutes les pages.',
								},
								id: 'c6a4df6ebb3b39c6-9',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'What visual choices mean for screens, keyboards and loading',
					es: 'Qué implican las decisiones visuales en pantalla, con teclado y al cargar',
					fr: 'Ce que les choix visuels impliquent sur écran, au clavier et au chargement',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'For the client to maintain the website, they need to know what they are changing and what to inspect afterwards. Replacing an image, changing a shared structure and adding a variant have different scopes.',
								},
								id: '3c93043fde4651a9-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The proposed handover workflow starts by identifying the content, the person approving it and the expected result. For layout changes, a theme copy provides a preview before publication. For a product or article, the content itself also needs attention: copying a theme does not automatically duplicate all store data.',
								},
								id: '3e90d05ce0647f80-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Example: replacing a team photograph' },
								id: '2d90c67e8477f109-2',
								type: 'header',
							},
							{
								data: {
									text: 'The task goes beyond selecting a file. The correct image, permission to use it, alternative text and crop all need confirmation. The next step is to preview the complete page: group photo, portraits, nearby writing and narrow layout. If the caption changes, its English version joins the same review.',
								},
								id: '8e34f1820aa428b0-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This journey shows the value of well-defined fields. The person editing should be able to change the intended content without touching tab behaviour. Development becomes relevant when the request changes the structure or interaction.',
								},
								id: '49fd608495853bb5-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Example: preparing a product page' },
								id: 'a55353f8353912b2-5',
								type: 'header',
							},
							{
								data: {
									text: 'A representative product page makes it possible to follow the cycle: confirmed data, entry, field display, option selection, language and availability state. A missing option needs the intended result. A missing photograph should not pass unnoticed merely because the rest of the page works.',
								},
								id: 'd70d714f4179d916-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The project’s automated tests cover specific cart and tab-navigation functions. They help check precise rules, such as handling an index or classifying an error. They do not establish that photographs, data, translations and all journeys work correctly together.',
								},
								id: '06a83fb725bbd69d-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A rollback that matches the change' },
								id: '34104a7779de72ca-8',
								type: 'header',
							},
							{
								data: {
									text: 'Keeping the previous theme provides a return point for a theme change. For an incorrect description or quantity, switching back to an earlier theme does not automatically restore the data. The procedure therefore needs to preserve what was actually changed.',
								},
								id: '37edc01563b2f434-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The handover should include a practical exercise with the client: make a simple change, preview it, have it checked and find the recovery steps if the result differs from what was expected. The exercise checks a practical management capability beyond the presence of an edit button.',
								},
								id: '0fe5c990e409c2ab-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Para que el cliente pueda mantener el sitio, necesita saber qué está cambiando y qué debe revisar después. Reemplazar una fotografía, modificar una estructura compartida y agregar una variante tienen alcances diferentes.',
								},
								id: '54328e5c58ddf424-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El flujo de entrega propuesto empieza por identificar el contenido, la persona que lo aprueba y el resultado esperado. Para cambios de presentación, una copia del tema permite preparar una vista previa antes de publicar. En un producto o artículo también hay que gestionar el contenido: copiar el tema no duplica automáticamente todos los datos de la tienda.',
								},
								id: '62577ccccc8024c7-1',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Ejemplo: reemplazar una fotografía del equipo',
								},
								id: '8e10b017806fac23-2',
								type: 'header',
							},
							{
								data: {
									text: 'La tarea no termina al seleccionar el archivo. Hay que confirmar la imagen correcta, el derecho a usarla, el texto alternativo y el recorte del sujeto. Luego se revisa la página completa: fotografía grupal, retratos, textos cercanos y presentación estrecha. Si cambia la leyenda, su versión en inglés entra en la misma revisión.',
								},
								id: 'a7e1e207d01c02ea-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Este recorrido muestra la utilidad de campos bien definidos. Quien edita debe poder cambiar el contenido correspondiente sin tocar el comportamiento de las pestañas. El desarrollo interviene cuando la solicitud cambia la estructura o la interacción.',
								},
								id: '5eb14a2a21ac9dbd-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Ejemplo: preparar una ficha de producto',
								},
								id: '249b9a088e336a36-5',
								type: 'header',
							},
							{
								data: {
									text: 'Una ficha representativa permite recorrer el ciclo: datos confirmados, ingreso, presentación de campos, selección de opciones, idioma y disponibilidad. Una opción ausente debe producir el resultado previsto. Una imagen faltante no debería pasar inadvertida solo porque el resto de la página funciona.',
								},
								id: 'b64eb438e1b7bf46-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las pruebas automatizadas del proyecto cubren algunas funciones del carrito y de la navegación por pestañas. Ayudan a verificar reglas precisas, como el tratamiento de un índice o la clasificación de un error. No demuestran que las fotografías, los datos, las traducciones y todos los recorridos funcionen correctamente en conjunto.',
								},
								id: '2ed50cc5b587fb93-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Un retorno que corresponda al cambio' },
								id: 'e9a7df9c64e26c6a-8',
								type: 'header',
							},
							{
								data: {
									text: 'Conservar la versión anterior del tema ofrece un punto de retorno para un cambio al tema. Ante una descripción o cantidad equivocada, volver al tema anterior no restablece automáticamente el dato. El procedimiento debe conservar lo que realmente se modificó.',
								},
								id: 'bcbc523ed1110e5e-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La entrega debe incluir un ejercicio de este tipo con el cliente: hacer un cambio sencillo, verlo en la vista previa, pedir su revisión y encontrar los pasos de recuperación si el resultado no es el esperado. El ejercicio verifica una capacidad concreta de administración, más allá de que exista un botón para editar.',
								},
								id: '0d9527a8c7246786-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Pour que le client puisse entretenir le site, il doit savoir quel changement il fait et ce qu’il faut regarder ensuite. Remplacer une photo, modifier une structure partagée et ajouter une variante n’ont pas la même portée.',
								},
								id: '31497d7eed1bac8e-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La procédure de reprise proposée commence par nommer le contenu visé, la personne qui l’approuve et le résultat attendu. Pour un changement de mise en page, une copie du thème permet de préparer une prévisualisation avant publication. Pour un produit ou un article, il faut aussi gérer le contenu lui-même : une copie du thème ne duplique pas automatiquement toutes les données de la boutique.',
								},
								id: '79cbabff1951de27-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Exemple : remplacer une photo d’équipe' },
								id: 'f6634263f5e90d7d-2',
								type: 'header',
							},
							{
								data: {
									text: 'Le travail ne s’arrête pas à choisir le fichier. Il faut confirmer la bonne image, son droit d’utilisation, son texte alternatif et le cadrage du sujet. Ensuite, on prévisualise la page complète : photo de groupe, portraits, textes voisins et disposition étroite. Si la légende change, sa version anglaise entre dans la même revue.',
								},
								id: 'f86e0dea5214b3d9-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce parcours fait apparaître la valeur de champs bien définis. La personne qui édite doit pouvoir modifier le bon contenu sans toucher au comportement des onglets. La personne qui développe intervient si le besoin change la structure ou l’interaction.',
								},
								id: 'a7035b6b53792420-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Exemple : préparer une fiche de produit',
								},
								id: 'd9176dc351a9ce1d-5',
								type: 'header',
							},
							{
								data: {
									text: 'Une fiche représentative permet de parcourir le cycle : données confirmées, saisie, affichage des champs, sélection d’options, langue et état de disponibilité. Une option absente doit donner le résultat prévu. Une image manquante ne doit pas passer inaperçue sous prétexte que le reste de la page fonctionne.',
								},
								id: 'ae07d4bb78994942-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les tests automatisés du projet portent notamment sur certaines fonctions du panier et de la navigation par onglets. Ils aident à vérifier des règles précises, comme le traitement d’un index ou d’une erreur. Ils ne prouvent pas que les photos, les données, les traductions et tous les parcours sont corrects ensemble.',
								},
								id: 'd1c8021af105e407-7',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un retour arrière qui correspond au changement',
								},
								id: '899f3c3d16cabccf-8',
								type: 'header',
							},
							{
								data: {
									text: 'Pour une modification de thème, conserver la version précédente fournit un point de retour. Pour une erreur de description ou de stock, revenir à l’ancien thème ne rétablit pas automatiquement la donnée. La procédure doit donc conserver ce qui a réellement été modifié.',
								},
								id: 'ba4da216032d7f54-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La remise devra inclure un exercice de ce type, avec le client : effectuer un changement simple, le prévisualiser, le faire vérifier et retrouver la marche à suivre si le résultat n’est pas celui attendu. L’exercice permet de vérifier une capacité de gestion concrète, au-delà de la présence d’un bouton d’édition.',
								},
								id: '99378ba769c22261-10',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'From a content change to a checked preview',
					es: 'Del cambio de contenido a una vista previa verificada',
					fr: 'Du changement de contenu à une prévisualisation vérifiée',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The intended handover result is a website the client can manage within the agreed scope. Access alone is not sufficient. Confirmed content, a map of responsibilities and understandable maintenance tasks are also needed.',
								},
								id: '710c94d37f577202-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The client retains decisions about products, prices, quantities and writing. One person may handle routine updates while another approves them. Code changes, new behaviours and structural work call for a separate technical responsibility. A support agreement needs to define the scope of interventions and each person’s responsibility.',
								},
								id: 'd357cb0783e6ecec-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Ownership and continuity' },
								id: 'bfc759b433ddc10d-2',
								type: 'header',
							},
							{
								data: {
									text: 'The handover inventory should cover the store, domain, required access, content, media, translations, apps and documentation. It needs to establish who owns the accounts, who can recover access and who approves a significant change. No credentials or private details need to appear in a case study to explain that requirement.',
								},
								id: 'd2e9a13f9c4af4da-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The Shopify procedure depends on the exact store type and its situation at handover. A development environment’s name does not establish what can be transferred. That check belongs in preparing the transfer or, if needed, an authorized migration. The check concerns actual ownership and account rights, not the names of the accounts.',
								},
								id: 'a74635d6afca9924-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Proportionate maintenance' },
								id: 'c5716f12d0fbfa86-5',
								type: 'header',
							},
							{
								data: {
									text: 'Routine maintenance can cover outdated content, images to replace, links to check and translations to revise. Technical review will be needed after changes affecting the theme or apps. Frequency should follow actual activity and the support agreement.',
								},
								id: 'bf73295f6c593427-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For each intervention, a short record is useful: what changed, why, who approved it and what was checked. That record helps another person take over and keeps knowledge from depending entirely on the developer’s memory.',
								},
								id: '95855ae83535e43d-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El resultado esperado de la entrega es un sitio que el cliente pueda administrar dentro del alcance acordado. Los accesos no bastan. También se necesitan contenidos confirmados, un mapa de responsabilidades y tareas de mantenimiento comprensibles.',
								},
								id: 'c8f97363fbb61071-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El cliente conserva las decisiones sobre productos, precios, cantidades y textos. Una persona puede encargarse de las actualizaciones habituales y otra aprobarlas. Los cambios de código, los comportamientos nuevos y las intervenciones estructurales necesitan una responsabilidad técnica distinta. Un acuerdo de soporte debe definir el alcance de las intervenciones y la responsabilidad de cada persona.',
								},
								id: '1862caa03c1fd6ef-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Propiedad y continuidad' },
								id: '315c7193bf3de77b-2',
								type: 'header',
							},
							{
								data: {
									text: 'El inventario de entrega debe cubrir la tienda, el dominio, los accesos necesarios, los contenidos, los medios, las traducciones, las aplicaciones y la documentación. Debe quedar claro quién posee las cuentas, quién puede recuperar un acceso y quién aprueba un cambio importante. No hace falta mostrar credenciales ni datos privados en un estudio de caso para explicar esa necesidad.',
								},
								id: '1f5daf512f6ff3f5-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El procedimiento de Shopify depende del tipo exacto de tienda y de su situación al momento de la entrega. El nombre de un entorno de desarrollo no determina qué se puede transferir. Esa verificación forma parte de preparar la transferencia o, si hace falta, una migración autorizada. La verificación corresponde a la propiedad real y los permisos de las cuentas, no a sus nombres.',
								},
								id: '005db48426509901-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Un mantenimiento proporcionado' },
								id: '73e1e3b41eb89f2f-5',
								type: 'header',
							},
							{
								data: {
									text: 'El mantenimiento habitual puede reunir contenidos desactualizados, imágenes por reemplazar, enlaces por verificar y traducciones por revisar. Se necesitará una revisión técnica después de cambios que afecten al tema o a las aplicaciones. La frecuencia debe corresponder a la actividad real y al acuerdo de soporte.',
								},
								id: '10bac4a9eeb6e74b-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para cada intervención sirve un registro breve: qué cambió, por qué, quién lo aprobó y qué se verificó. Ese registro facilita que otra persona retome el sitio y evita que el conocimiento dependa únicamente de la memoria del desarrollador.',
								},
								id: 'c9b8015e9414c5c5-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le résultat attendu de la remise est un site que le client peut gérer dans le cadre prévu. Les accès seuls ne suffisent pas. Il faut aussi des contenus confirmés, une carte des responsabilités et des gestes de maintenance compréhensibles.',
								},
								id: 'e8f6f0f885d7b49c-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le client doit garder la décision sur ses produits, ses prix, ses quantités et ses textes. Une personne peut s’occuper des mises à jour courantes, et une autre les approuver. Les changements de code, les nouveaux comportements et les interventions sur la structure demandent une responsabilité technique distincte. Une entente de soutien doit préciser le périmètre des interventions et la responsabilité de chacun.',
								},
								id: '2d7f16d30037dee8-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Propriété et continuité' },
								id: 'f6f6998db4b31c61-2',
								type: 'header',
							},
							{
								data: {
									text: 'L’inventaire de remise doit couvrir la boutique, le domaine, les accès nécessaires, les contenus, les médias, les traductions, les applications et la documentation. Il faut savoir qui possède les comptes, qui peut récupérer un accès et qui approuve une modification importante. Aucun identifiant ou détail privé n’a besoin d’être montré dans une étude de cas pour expliquer cette exigence.',
								},
								id: 'aa2f86dee3857870-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La procédure Shopify dépend du type exact de boutique et de sa situation au moment de la remise. Le nom d’un environnement de développement ne suffit pas à déterminer ce qui peut être transféré. Cette vérification appartient à la préparation du transfert ou, si nécessaire, d’une migration autorisée. Le contrôle porte sur la propriété réelle et les droits des comptes, pas sur leur nom.',
								},
								id: '943281fb06468c31-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Une maintenance proportionnée' },
								id: '54f612660dff2252-5',
								type: 'header',
							},
							{
								data: {
									text: 'L’entretien courant pourra regrouper les contenus devenus inexacts, les images à remplacer, les liens à vérifier et les traductions à reprendre. Une revue technique sera nécessaire après des changements qui touchent le thème ou les applications. La fréquence doit correspondre à l’activité réelle et à l’entente de soutien.',
								},
								id: '61426cbbd2037d97-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour chaque intervention, une trace courte est utile : ce qui a changé, pourquoi, qui l’a approuvé et ce qui a été vérifié. Cette trace aide une autre personne à reprendre le site et évite que la connaissance reste seulement dans la mémoire du développeur.',
								},
								id: '92dabbd36b1d4790-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Responsibilities and long-term maintenance',
					es: 'Responsabilidades y mantenimiento a largo plazo',
					fr: 'Responsabilités et entretien à long terme',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									caption: 'Shopify development home page, desktop browser view, 8 October 2026.',
									file: {
										extension: 'jpg',
										fileId: '4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										fileURL: '/files/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										height: 715,
										name: 'portfolio-20261008-cafe-arona-7a9b64663ee5-01-accueil-dev-desktop-1440x1000.jpg',
										size: '103146',
										title: 'Green header, coffee video banner and yellow “Découvrir nos cafés” button on Café Arona’s home page.',
										url: '/assets/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										width: 1425,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'ef6c29e07790e8d9',
								type: 'image',
							},
							{
								data: {
									caption: 'Development home page in a 390 × 844 browser viewport. This view was not captured on a physical phone.',
									file: {
										extension: 'jpg',
										fileId: '136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										fileURL: '/files/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										height: 811,
										name: 'portfolio-20261008-cafe-arona-d93069dbd3ec-01-accueil-dev-mobile-390x844.jpg',
										size: '34041',
										title: 'Café Arona’s mobile home-page layout with compact navigation, centred headline and a yellow button overlaid on the video banner.',
										url: '/assets/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										width: 375,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '24424ed2bc25dd23',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									caption: 'Inicio de Shopify en desarrollo, vista de escritorio, 8 de octubre de 2026.',
									file: {
										extension: 'jpg',
										fileId: '4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										fileURL: '/files/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										height: 715,
										name: 'portfolio-20261008-cafe-arona-7a9b64663ee5-01-accueil-dev-desktop-1440x1000.jpg',
										size: '103146',
										title: 'Encabezado verde, video sobre el café y botón amarillo «Découvrir nos cafés» en la página de inicio de Café Arona.',
										url: '/assets/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										width: 1425,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '0150b45dcd2016cb',
								type: 'image',
							},
							{
								data: {
									caption: 'Inicio de desarrollo en una ventana de navegador de 390 × 844. Esta vista no fue capturada en un teléfono físico.',
									file: {
										extension: 'jpg',
										fileId: '136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										fileURL: '/files/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										height: 811,
										name: 'portfolio-20261008-cafe-arona-d93069dbd3ec-01-accueil-dev-mobile-390x844.jpg',
										size: '34041',
										title: 'Inicio de Café Arona en diseño móvil, con navegación compacta, título centrado y botón amarillo superpuesto al video.',
										url: '/assets/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										width: 375,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '77c97c0ccb607c0e',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									caption: 'Accueil Shopify de développement, vue de bureau, 8 octobre 2026.',
									file: {
										extension: 'jpg',
										fileId: '4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										fileURL: '/files/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										height: 715,
										name: 'portfolio-20261008-cafe-arona-7a9b64663ee5-01-accueil-dev-desktop-1440x1000.jpg',
										size: '103146',
										title: 'En-tête vert, bannière vidéo autour du café et bouton jaune « Découvrir nos cafés » sur l’accueil de Café Arona.',
										url: '/assets/4b396e9c-b5b5-4a24-b5a4-c8cce0a2063d',
										width: 1425,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'fe1777cd73fda6c5',
								type: 'image',
							},
							{
								data: {
									caption: 'Accueil de développement dans un navigateur à 390 × 844. Cette vue ne provient pas d’un téléphone physique.',
									file: {
										extension: 'jpg',
										fileId: '136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										fileURL: '/files/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										height: 811,
										name: 'portfolio-20261008-cafe-arona-d93069dbd3ec-01-accueil-dev-mobile-390x844.jpg',
										size: '34041',
										title: 'Accueil de Café Arona en disposition mobile, avec navigation compacte, slogan centré et bouton jaune superposé à la bannière vidéo.',
										url: '/assets/136c2bba-1646-4b27-bcbd-9c7a1e0bba46',
										width: 375,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'b8b5cc91f161d27e',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Images and context',
					es: 'Imágenes y contexto',
					fr: 'Images et contexte',
				},
			},
		],
		slug: 'cafe-arona',
		stack: [
			'Shopify',
			'Liquid',
			'Figma',
			'Bun',
			'TypeScript',
			'Playwright',
		],
		status: 'public',
		tags: ['e-commerce', 'migration', 'bilingual'],
		title: {
			en: 'Café Arona: a Shopify website for a family business',
			es: 'Café Arona: un sitio Shopify para una empresa familiar',
			fr: 'Café Arona : une vitrine Shopify familiale',
		},
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'A shared foundation for design values, interface controls and motion. How Transit and yesid.dev adopt it while keeping their own product responsibilities.',
						},
						id: 'f1d0f2802f5dcc53-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			es: {
				blocks: [
					{
						data: {
							text: 'Una base compartida para valores de diseño, componentes y movimiento. Cómo Transit y yesid.dev la adoptan sin perder sus responsabilidades de producto.',
						},
						id: 'c1efd8ed3d74e698-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Une base commune pour les valeurs de design, les composants et le mouvement. Comment Transit et yesid.dev l’adoptent en gardant leurs responsabilités.',
						},
						id: '2f1e5cdca0601754-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
		},
		featured: true,
		image: '2d257b93-bb5c-451a-9f2e-143291d881ad',
		imageLight: '71df00a9-e308-40d9-bbbd-95f2a38849d1',
		imageSecondary: '5479c71a-92e8-4b30-90d0-474ad466acf1',
		imageSecondaryLight: '66e8ada9-0c29-4036-897a-e5553d33fe47',
		oneLiner: {
			en: 'One visual foundation, room for different products',
			es: 'Una base visual común, espacio para cada producto',
			fr: 'Une base visuelle commune, une place pour chaque produit',
		},
		relatedServices: ['web-development'],
		repoPrivate: true,
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A button, a heading and a small response to a click can make separate products feel related. Keeping those details consistent becomes more involved when each product has its own content, behaviour and release schedule.',
								},
								id: '5761371b5ea403d7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I built yesid.dev-design to give my projects a common foundation while keeping those differences explicit. It brings together the visual rules, reusable controls and interaction behaviour behind the yesid brand. Transit and yesid.dev have both adopted releases from it. A separate component gallery shows how the shared pieces work together.',
								},
								id: '50fa5bae5ac80779-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is an ongoing infrastructure project with its own source, releases and responsibilities. Its purpose is to make shared decisions easier to maintain and changes easier to review.',
								},
								id: 'a46c20c2c5c76c1e-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'The project at a glance' },
								id: '8a56b5cf2b107595-3',
								type: 'header',
							},
							{
								data: { level: 4, text: 'The problem' },
								id: '661b3065ba2b485c-4',
								type: 'header',
							},
							{
								data: {
									text: 'Several products need to look related without inheriting each other&#39;s decisions. Maintaining the same visual rules in separate places makes it harder to tell whether a difference is intentional or whether the copies have drifted.',
								},
								id: '3a6ddd46e2cd7531-5',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'What I built' },
								id: '39d5bd6c70165cc8-6',
								type: 'header',
							},
							{
								data: {
									text: 'A shared foundation for design values, reusable interface controls and motion, with a gallery that makes their behaviour visible. It also includes common mechanics for quality checks, search metadata, analytics and language routing. Each part has a defined responsibility and a reviewed release path.',
								},
								id: 'ef659a7c9840d353-7',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'The products it serves' },
								id: '976cfbe8b7ea543d-8',
								type: 'header',
							},
							{
								data: {
									text: 'Transit and yesid.dev have adopted the foundation. They keep their own pages, content, data and runtime choices. The internal gallery provides neutral examples for reviewing shared behaviour before each product checks its own use.',
								},
								id: '508598a39cab61e6-9',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'The main tradeoff' },
								id: '14be291c58d8d20a-10',
								type: 'header',
							},
							{
								data: {
									text: 'Sharing more code also ties more decisions together. Transit requires flat cards; yesid.dev keeps a bevel and hover shadow. I keep those differences local, even when that leaves some duplication. Composed patterns become shared only when three independent products need the same behaviour and responsibilities.',
								},
								id: '707239ba40a3b8f6-11',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Where it stands' },
								id: 'a4879bab8e26943c-12',
								type: 'header',
							},
							{
								data: {
									text: 'The September 2, 2026 register records both products at v0.13.2. A v0.13.3 tag exists, and the reviewed main branch includes later development. Products choose their updates deliberately. Those records describe source adoption; they do not establish which version every live page currently serves.',
								},
								id: '0109b193509a4d1a-13',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'My role' },
								id: '9417b44f23fc72b4-14',
								type: 'header',
							},
							{
								data: {
									text: 'I direct the visual choices, architecture, ownership boundaries and acceptance of changes. AI assists with implementation. I review its output against the code and tests, and remain responsible for the decisions I accept.',
								},
								id: '8850fe018461081f-15',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Optional depth' },
								id: '3d8526dd7bc8c7a2-16',
								type: 'header',
							},
							{
								data: {
									text: 'Explore any of the sections below for more about the decisions, concrete examples and technical contracts:',
								},
								id: 'c91b3272893521ed-17',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="#section-1">Origins</a> · <a href="#section-2">Design values</a> · <a href="#section-3">Component behaviour</a> · <a href="#section-4">Product boundaries</a> · <a href="#section-5">Releases and adoption</a> · <a href="#section-6">Role and status</a>',
								},
								id: 'c44cb348892e7c03-18',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Un botón, un título y una pequeña respuesta al hacer clic pueden hacer que varios productos se sientan parte de la misma familia. Mantener esa coherencia requiere más cuidado cuando cada producto tiene su contenido, su comportamiento y su propio calendario de actualizaciones.',
								},
								id: '248d9857bad25e62-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Creé yesid.dev-design para darles una base común a mis proyectos y dejar claras sus diferencias. Reúne las reglas visuales, los controles reutilizables y los comportamientos de interacción de la marca yesid. Transit y yesid.dev han adoptado versiones de esta base. Una galería de componentes permite ver cómo funcionan las piezas compartidas.',
								},
								id: '1f18484cee6e5d60-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Es un proyecto de infraestructura en desarrollo, con código, versiones y responsabilidades propias. Su propósito es facilitar el mantenimiento de las decisiones comunes y la revisión de los cambios.',
								},
								id: '9ed0f3301ce72c29-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'El proyecto en breve' },
								id: 'edd01ed6362e2f1a-3',
								type: 'header',
							},
							{
								data: { level: 4, text: 'El problema' },
								id: '9a50f55e71f25267-4',
								type: 'header',
							},
							{
								data: {
									text: 'Varios productos necesitan verse relacionados sin heredar las decisiones particulares de los demás. Mantener las mismas reglas visuales en lugares separados dificulta saber si una diferencia es intencional o si las copias se han ido apartando.',
								},
								id: '2a37727272247348-5',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Qué construí' },
								id: 'eb69fcd252d52416-6',
								type: 'header',
							},
							{
								data: {
									text: 'Una base compartida para los valores de diseño, los controles reutilizables y el movimiento, con una galería que permite ver su comportamiento. También incluye mecanismos comunes de verificación de calidad, metadatos para buscadores, analítica y enrutamiento por idioma. Cada parte tiene una responsabilidad definida y un proceso de versiones revisado.',
								},
								id: '5b6adeb9c075a50b-7',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'A qué productos les sirve' },
								id: '6b36dd03d05f48a6-8',
								type: 'header',
							},
							{
								data: {
									text: 'Transit y yesid.dev han adoptado esta base. Conservan sus páginas, contenido, datos y decisiones de ejecución. La galería interna ofrece ejemplos neutros para revisar el comportamiento compartido antes de que cada producto verifique su propio uso.',
								},
								id: '765bf9d8659a4279-9',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'La principal decisión' },
								id: 'f58b4af7a1ba4044-10',
								type: 'header',
							},
							{
								data: {
									text: 'Compartir más código también conecta más decisiones. Transit requiere tarjetas planas; yesid.dev conserva un bisel y una sombra al pasar el cursor. Mantengo esas diferencias en cada producto, aunque quede algo de duplicación. Un patrón compuesto solo se comparte cuando tres productos independientes necesitan el mismo comportamiento y las mismas responsabilidades.',
								},
								id: 'aace4d036f750a25-11',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'En qué estado está' },
								id: 'e55ce35cd1f41de5-12',
								type: 'header',
							},
							{
								data: {
									text: 'El registro del 2 de septiembre de 2026 indica que ambos productos adoptaron v0.13.2. Existe una etiqueta v0.13.3 y la rama principal revisada contiene desarrollo posterior. Los productos eligen sus actualizaciones de forma deliberada. Esos registros describen la adopción del código; no establecen qué versión sirve actualmente cada página publicada.',
								},
								id: '2db5a29401a261e1-13',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Mi papel' },
								id: '36d051d702e5b636-14',
								type: 'header',
							},
							{
								data: {
									text: 'Dirijo las decisiones visuales, la arquitectura, los límites entre responsabilidades y la aceptación de cambios. La IA apoya la implementación. Reviso sus resultados frente al código y las pruebas, y sigo siendo responsable de las decisiones que acepto.',
								},
								id: '93a9ed4d69487b0a-15',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Para profundizar' },
								id: '5f175aefbe9e42c0-16',
								type: 'header',
							},
							{
								data: {
									text: 'Cada sección siguiente amplía un aspecto del proyecto con las razones de las decisiones, ejemplos concretos y los contratos técnicos:',
								},
								id: 'fce99adaf2f2bb33-17',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="#section-1">Origen</a> · <a href="#section-2">Valores de diseño</a> · <a href="#section-3">Comportamiento de componentes</a> · <a href="#section-4">Límites entre productos</a> · <a href="#section-5">Versiones y adopción</a> · <a href="#section-6">Papel y estado del proyecto</a>',
								},
								id: '69f686ccf7d9ed42-18',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Un bouton, un titre et une petite réaction au clic peuvent donner un air de famille à plusieurs produits. Garder ces détails cohérents devient plus exigeant quand chaque produit a son contenu, son fonctionnement et son propre calendrier de mises à jour.',
								},
								id: '356614603f7fdb0f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'J&#39;ai créé yesid.dev-design pour donner une base commune à mes projets, tout en gardant leurs différences explicites. Le projet rassemble les règles visuelles, les éléments d&#39;interface et les comportements d&#39;interaction de la marque yesid. Transit et yesid.dev en ont tous deux adopté des versions. Une galerie de composants permet de voir comment les éléments partagés fonctionnent ensemble.',
								},
								id: '4a95f926cafd24f0-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'C&#39;est un projet d&#39;infrastructure en évolution, avec son propre code, ses versions et ses responsabilités. Il vise à rendre les décisions communes plus faciles à maintenir et les changements plus faciles à examiner.',
								},
								id: 'ce6c9acb76d3a31e-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Le projet en bref' },
								id: '16b335ce72111d60-3',
								type: 'header',
							},
							{
								data: { level: 4, text: 'Le problème' },
								id: '1d0a3bbd039f50f0-4',
								type: 'header',
							},
							{
								data: {
									text: 'Plusieurs produits doivent avoir un air de famille sans hériter des décisions propres aux autres. Maintenir les mêmes règles visuelles à plusieurs endroits rend plus difficile la distinction entre une différence voulue et des copies qui se sont éloignées.',
								},
								id: '5e099ff88e85896f-5',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Ce que j&#39;ai construit' },
								id: '211eb33714826ee6-6',
								type: 'header',
							},
							{
								data: {
									text: 'Une base commune pour les valeurs de design, les commandes réutilisables et le mouvement, avec une galerie qui rend leur comportement visible. Elle comprend aussi des mécanismes de contrôle de qualité, de métadonnées de référencement, d&#39;analytique et de routage multilingue. Chaque partie a une responsabilité définie et un parcours de livraison révisé.',
								},
								id: 'adcde06b1beb0a79-7',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Les produits concernés' },
								id: '63edaf9efb173f50-8',
								type: 'header',
							},
							{
								data: {
									text: 'Transit et yesid.dev ont adopté cette base. Ils conservent leurs pages, leurs contenus, leurs données et leurs choix d&#39;exécution. La galerie interne fournit des exemples neutres pour examiner les comportements partagés avant que chaque produit vérifie sa propre utilisation.',
								},
								id: '7fab30b09bca8234-9',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Le principal compromis' },
								id: 'f1f73341a91e3adb-10',
								type: 'header',
							},
							{
								data: {
									text: 'Partager davantage de code relie aussi davantage de décisions. Transit exige des cartes plates; yesid.dev conserve un biseau et une ombre au survol. Je garde ces différences dans les produits, même si cela laisse une part de duplication. Un composant composé devient partagé seulement lorsque trois produits indépendants ont besoin du même comportement et des mêmes responsabilités.',
								},
								id: '96282f9fce04e0da-11',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Où en est le projet' },
								id: 'aa5df8adbe093f17-12',
								type: 'header',
							},
							{
								data: {
									text: 'Le registre du 2 septembre 2026 indique que les deux produits ont adopté v0.13.2. Une version étiquetée v0.13.3 existe, et la branche principale examinée contient du développement ultérieur. Les produits choisissent leurs mises à jour de façon délibérée. Ces relevés décrivent l&#39;adoption du code; ils ne prouvent pas la version actuellement servie par chaque page en ligne.',
								},
								id: 'ee6944e1455de744-13',
								type: 'paragraph',
							},
							{
								data: { level: 4, text: 'Mon rôle' },
								id: 'fe586bae0751534d-14',
								type: 'header',
							},
							{
								data: {
									text: 'Je dirige les choix visuels, l&#39;architecture, la répartition des responsabilités et l&#39;acceptation des changements. L&#39;IA aide à la réalisation. J&#39;examine ses résultats à partir du code et des tests, et je reste responsable des décisions que j&#39;accepte.',
								},
								id: 'e95d76644a1afd13-15',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Pour aller plus loin' },
								id: '7cbee42fa4cca364-16',
								type: 'header',
							},
							{
								data: {
									text: 'Chaque section ci-dessous approfondit un aspect du projet avec les raisons des choix, des exemples concrets et les contrats techniques :',
								},
								id: 'f0f1987ee7bf06b4-17',
								type: 'paragraph',
							},
							{
								data: {
									text: '<a href="#section-1">Origines</a> · <a href="#section-2">Valeurs de design</a> · <a href="#section-3">Comportement des composants</a> · <a href="#section-4">Limites entre produits</a> · <a href="#section-5">Versions et adoption</a> · <a href="#section-6">Rôle et état du projet</a>',
								},
								id: '2cfbbb3329703dde-18',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'A shared visual foundation for products with different jobs',
					es: 'Una base visual compartida para productos con funciones distintas',
					fr: 'Une base visuelle commune, des produits qui gardent leur rôle',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The foundation began inside yesid.dev. The first task was to extract the reusable parts without quietly redesigning the site at the same time. If a colour, spacing rule or animation changed during that move, it would become harder to tell whether the difference was intentional or an extraction mistake.',
								},
								id: '36ea528f875cf856-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That distinction shaped the first release. Version v0.1.0 preserves a specific reference from the original site, with the extraction differences documented. The recorded exceptions include rewritten import paths and keeping more specialised motion on the application side. Later changes receive new versions. The original reference stays available and its tag does not move.',
								},
								id: 'ae41cae7ecc48abb-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This gave the project two separate questions to answer: did the extraction preserve the intended baseline, and is a later design change worth adopting? Moving code and changing the experience can both be useful, but they deserve their own review.',
								},
								id: '273c30fcf9be8495-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'What the foundation serves' },
								id: 'b7f9d411513a0ad0-3',
								type: 'header',
							},
							{
								data: {
									text: 'Transit and yesid.dev need a recognisable visual relationship while doing different jobs. Their shared foundation includes colours, typography, interface controls and interaction mechanics. Each product still determines its page structure, navigation, content, data and operating environment. The foundation has no authority over Transit&#39;s data pipeline or the editorial choices on yesid.dev.',
								},
								id: 'a6c000af9b76534b-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The repository also contains a private component gallery. It uses the packages directly and makes their behaviour visible with neutral examples. This is a useful place to examine a control before putting it in a product. It is an internal integration environment, with a different role from either external product and its own version boundary.',
								},
								id: '845424d6d9d9055e-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That distinction matters to the purpose of the project. A shared button can carry a common appearance and predictable behaviour. It cannot decide what an action means in a transit tool or which message belongs on a project page. I wanted the reusable decisions to have a clear home while leaving those product decisions where they could be understood in context.',
								},
								id: '4e94e8aa561590ca-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The implementation is a Bun and Turborepo workspace, with related packages maintained together and the gallery under an application directory. That arrangement makes it possible to work across tokens, components and their examples in one repository. Distribution still happens through deliberate releases, so a workspace change does not become a product update merely because it works in the gallery.',
								},
								id: '56eda81eb98cdeb5-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La base nació dentro de yesid.dev. El primer paso fue extraer las partes reutilizables sin cambiar de paso la apariencia del sitio. Si un color, un espacio o una animación cambiaba durante ese traslado, resultaba más difícil saber si la diferencia era una decisión de diseño o un error de extracción.',
								},
								id: 'caee3ea744e6f452-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esa distinción definió la primera versión. v0.1.0 conserva un punto de referencia concreto del sitio original, con las diferencias de la extracción documentadas. Entre las excepciones registradas están los cambios en las rutas de importación y la decisión de mantener ciertos movimientos más especializados dentro de la aplicación. Los cambios posteriores reciben nuevas versiones. La referencia inicial sigue disponible y su etiqueta de versión no se mueve.',
								},
								id: '0bb7b09c06d6dc43-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Así, el proyecto podía responder dos preguntas distintas: ¿la extracción conservó la base prevista?, y ¿vale la pena adoptar un cambio de diseño posterior? Mover código y modificar la experiencia pueden ser decisiones útiles, pero cada una necesita su propia revisión.',
								},
								id: 'cac51f60eb82a90a-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A qué productos les sirve' },
								id: '7c9fa5d9b3a6631f-3',
								type: 'header',
							},
							{
								data: {
									text: 'Transit y yesid.dev necesitan una relación visual reconocible mientras cumplen funciones diferentes. Su base compartida incluye colores, tipografía, controles de interfaz y mecanismos de interacción. Cada producto sigue definiendo la estructura de sus páginas, navegación, contenido, datos y entorno de ejecución. La base no decide cómo se procesan los datos de Transit ni qué contenido editorial publica yesid.dev.',
								},
								id: '14f8b84567be5924-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El repositorio también contiene una galería privada de componentes. Usa los paquetes directamente y hace visible su comportamiento con ejemplos neutros. Es un lugar útil para examinar un control antes de incorporarlo a un producto. Se trata de un entorno interno de integración, con una función diferente a la de los dos productos externos y su propio límite de versiones.',
								},
								id: 'aefa4a8033f59cd5-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esa distinción explica el propósito del proyecto. Un botón compartido puede tener una apariencia común y un comportamiento predecible. No puede decidir qué significa una acción en una herramienta de transporte ni qué mensaje corresponde a una página de proyecto. Quería darles un lugar claro a las decisiones reutilizables y mantener las decisiones del producto donde se pudieran entender en contexto.',
								},
								id: '970379d365b55053-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La implementación usa un espacio de trabajo con Bun y Turborepo. Los paquetes relacionados se mantienen juntos y la galería está en el directorio de aplicaciones. Esa organización permite trabajar sobre los valores de diseño, los componentes y sus ejemplos en un mismo repositorio. La distribución sigue pasando por versiones deliberadas: que un cambio funcione en la galería no lo convierte automáticamente en una actualización de los productos.',
								},
								id: 'f12abba8b6a27e32-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La base se trouvait d&#39;abord dans yesid.dev. La première étape consistait à en extraire les éléments réutilisables sans refaire discrètement l&#39;apparence du site en même temps. Si une couleur, un espacement ou une animation changeait pendant ce déplacement, il devenait plus difficile de distinguer une décision de design d&#39;une erreur d&#39;extraction.',
								},
								id: 'daf42bddaf79f2aa-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette distinction a guidé la première version. La version v0.1.0 conserve un point de référence précis du site d&#39;origine, avec les différences liées à l&#39;extraction documentées. Parmi les exceptions consignées, on trouve des chemins d&#39;importation réécrits et le maintien de certains mouvements plus spécialisés dans l&#39;application. Les changements suivants reçoivent de nouveaux numéros de version. Le point de départ reste disponible et son étiquette de version ne bouge pas.',
								},
								id: 'dbb3701ba6449453-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le projet pouvait ainsi répondre à deux questions distinctes : l&#39;extraction a-t-elle préservé la base prévue, et un changement de design ultérieur mérite-t-il d&#39;être adopté? Déplacer le code et modifier l&#39;expérience peuvent être utiles, mais chaque décision demande sa propre révision.',
								},
								id: '96f41e5db853c139-2',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Les produits que la base sert' },
								id: 'ab1dbdd787f59d2f-3',
								type: 'header',
							},
							{
								data: {
									text: 'Transit et yesid.dev ont besoin d&#39;un air de famille reconnaissable tout en remplissant des rôles différents. Leur base commune comprend les couleurs, la typographie, les commandes d&#39;interface et les mécanismes d&#39;interaction. Chaque produit détermine encore la structure de ses pages, sa navigation, son contenu, ses données et son environnement d&#39;exécution. La base ne décide ni du traitement des données de Transit ni des choix éditoriaux de yesid.dev.',
								},
								id: '2713b978061d96ec-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le dépôt contient aussi une galerie de composants privée. Elle utilise directement les paquets et rend leur comportement visible avec des exemples neutres. C&#39;est un endroit utile pour examiner une commande avant de l&#39;intégrer à un produit. Cette application d&#39;intégration interne a un rôle différent de celui des deux produits externes et son propre cycle de versions.',
								},
								id: '086e595bc6d9e9ae-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette distinction explique la raison d&#39;être du projet. Un bouton partagé peut offrir une apparence commune et un comportement prévisible. Il ne peut pas déterminer le sens d&#39;une action dans un outil de transport ou le message qui convient à une page de projet. Je voulais donner une place claire aux décisions réutilisables, tout en gardant les décisions propres aux produits dans leur contexte.',
								},
								id: '098f3695a5ff203b-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La réalisation prend la forme d&#39;un espace de travail Bun et Turborepo. Les paquets connexes sont maintenus ensemble et la galerie se trouve dans le répertoire des applications. Cette organisation permet de travailler sur les valeurs de design, les composants et leurs exemples dans un même dépôt. La distribution passe quand même par des versions délibérées : un changement qui fonctionne dans la galerie ne devient pas automatiquement une mise à jour des produits.',
								},
								id: 'eb2e1fbf01a437d9-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Starting with an existing design',
					es: 'Empezar con un diseño que ya existía',
					fr: 'Partir d\'un design qui existait déjà',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The brand&#39;s visual language draws from infrastructure and wayfinding. Orange identifies interaction. Yellow provides markers and orientation. Reflective white and structural black establish contrast and character. Other semantic colours communicate states such as success or error. The intent is a recognisable vocabulary that can support several kinds of information.',
								},
								id: '9704cc2064fb91eb-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Those decisions live in structured design values, usually called tokens. A token gives a colour, text size, space, radius or animation duration a name and an agreed meaning. Components refer to those values rather than independently choosing another almost-identical one. This makes the relationship between a design decision and its uses easier to inspect.',
								},
								id: '38f2217e8e381961-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'From one source to several outputs' },
								id: 'ab85ba1c142f04e3-2',
								type: 'header',
							},
							{
								data: {
									text: 'The editable token source is a DTCG-format JSON file. DTCG provides a structured way to describe design values. Generators turn that source into the formats needed by stylesheets, motion code and the design reference. Generated files are compared with that source to catch hand-edited copies that could become a competing version of the design.',
								},
								id: '6c050454ddd76eea-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The repository&#39;s build adapter makes its four output paths explicit:',
								},
								id: '4c148371b1fb61f3-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const artifactPaths = [\n  \'DESIGN.md\',\n  \'apps/gallery/src/app.css\',\n  \'packages/motion/src/tokens.ts\',\n  \'packages/tokens/tokens.css\',\n] as const;\n```',
								},
								id: '8ff786241e6ed6da-5',
								type: 'code',
							},
							{
								data: {
									text: 'These outputs serve different readers: the design reference, the gallery stylesheet, the motion code and the shared token stylesheet. The token engine itself takes data and returns content. A repository adapter decides where to write it. A product using the engine keeps its own output paths and must identify its own source truthfully in generated headers.',
								},
								id: '061355b0b0a9d52d-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That separation avoids building knowledge of a particular application&#39;s folder structure into the shared package. It also leaves room for a product to maintain reviewed local values or output arrangements without pretending those are universal brand choices.',
								},
								id: 'e3e1d6bafa3fd95a-7',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A small change with a visible trail' },
								id: 'c18895ee16f582c7-8',
								type: 'header',
							},
							{
								data: {
									text: 'One repository test makes this concrete. In a temporary fixture, it changes the fast animation duration from 150 to 151 milliseconds. It expects the motion TypeScript and package CSS to change, and the gallery stylesheet to remain untouched. It then runs the generator in check mode and expects no further change. The one-millisecond edit is a test input, not a redesign or a measured improvement.',
								},
								id: '89023968024fc1b1-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The example checks two useful properties. A source change must reach the outputs that use it, and repeated generation must settle on the same result. The writer compares existing content before saving, so unchanged files do not need to be rewritten.',
								},
								id: '4883a28164205eac-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The surrounding checks add other layers: committed artifacts are compared with generated content, the token CI command detects differences, and an optional local commit hook rejects generated outputs staged without a relevant source change. Line endings are deliberately kept consistent across operating systems because a byte comparison also notices invisible newline differences. These mechanisms help catch drift; each has a defined scope.',
								},
								id: 'c890993d47ebacb0-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Responsive values and design-tool handoff',
								},
								id: '9d1bf1445087cf9c-12',
								type: 'header',
							},
							{
								data: {
									text: 'Some type and spacing values are fluid. They vary with available width between a defined minimum and maximum. The source keeps all three parts of the calculation, including the preferred value, and the CSS generator emits a clamp expression. This preserves the underlying decision rather than recording only the size observed in one screenshot.',
								},
								id: '8f39adcf9e556392-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Different destinations have different capabilities. The Figma export carries the clamp expression as a string; it does not turn it into a native responsive formula. The design-reference typography uses the structured maximum where its format accepts a single dimension. The Figma round trip also remains manual: export the variables, apply them through the design tooling, then verify the returned export. That is a useful connection between code and design, with explicit translation limits.',
								},
								id: 'f0e28bcb4e1f8013-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El lenguaje visual de la marca toma referencias de la infraestructura y la señalización. El naranja identifica la interacción. El amarillo sirve como marcador y orientación. El blanco reflectante y el negro estructural definen el contraste y el carácter de la paleta. Otros colores comunican estados como éxito o error. La intención es tener un vocabulario reconocible que sirva para distintos tipos de información.',
								},
								id: '6dbdd825e1c77561-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Estas decisiones se guardan en valores de diseño estructurados, conocidos como tokens. Un token le da un nombre y un significado acordado a un color, un tamaño de texto, un espacio, un radio o una duración de animación. Los componentes usan esos valores en lugar de escoger, cada uno por su cuenta, una variante casi idéntica. Así resulta más fácil revisar la relación entre una decisión de diseño y sus usos.',
								},
								id: 'c0f5614f236fa954-1',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Una fuente que produce varios resultados',
								},
								id: '2d3d4b751809547a-2',
								type: 'header',
							},
							{
								data: {
									text: 'La fuente editable es un archivo JSON en formato DTCG, una forma estructurada de describir valores de diseño. Los generadores convierten esa fuente a los formatos que necesitan las hojas de estilos, el código de movimiento y la referencia de diseño. Los archivos generados se comparan con esa fuente para detectar copias editadas a mano que podrían convertirse en una versión competidora del diseño.',
								},
								id: '22de61afde3e9089-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El adaptador de generación del repositorio deja explícitas las cuatro rutas de salida:',
								},
								id: '8a034fc3b6324d89-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const artifactPaths = [\n  \'DESIGN.md\',\n  \'apps/gallery/src/app.css\',\n  \'packages/motion/src/tokens.ts\',\n  \'packages/tokens/tokens.css\',\n] as const;\n```',
								},
								id: '8ff786241e6ed6da-5',
								type: 'code',
							},
							{
								data: {
									text: 'Los archivos cumplen funciones diferentes: referencia de diseño, estilos de la galería, valores de movimiento y hoja de estilos compartida. El motor de generación recibe datos y devuelve contenido. Un adaptador del repositorio decide dónde escribirlo. Cada producto que usa el motor conserva sus propias rutas de salida y debe identificar correctamente su fuente en los encabezados de los archivos generados.',
								},
								id: '5ddb43794cc92018-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esa separación evita que el paquete compartido tenga que conocer la estructura de carpetas de una aplicación. También permite que un producto mantenga valores locales revisados o una organización de archivos particular sin presentarlos como decisiones universales de la marca.',
								},
								id: '94bc52cbd3003606-7',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un cambio pequeño que deja un recorrido visible',
								},
								id: '981bec6eb3684219-8',
								type: 'header',
							},
							{
								data: {
									text: 'Una prueba del repositorio ofrece un ejemplo concreto. En una copia temporal preparada para la prueba, cambia la duración rápida de animación de 150 a 151 milisegundos. Espera que cambien el TypeScript de movimiento y el CSS del paquete, y que la hoja de estilos de la galería permanezca intacta. Después ejecuta el generador en modo de verificación y espera que no haya más cambios. Ese milisegundo adicional es un dato de prueba, no un rediseño ni una mejora medida.',
								},
								id: 'c97ac2ef6e1f3b63-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El ejemplo comprueba dos propiedades útiles. Un cambio en la fuente debe llegar a las salidas que lo usan, y repetir la generación debe producir el mismo resultado. La herramienta compara el contenido existente antes de guardarlo, de modo que no necesita volver a escribir los archivos que no cambiaron.',
								},
								id: '00f02565843cbcf1-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Otras verificaciones acompañan ese recorrido: los archivos guardados en el repositorio se comparan con el contenido generado, el comando de integración continua de tokens detecta diferencias y un control local opcional de commit rechaza archivos generados preparados sin un cambio pertinente en la fuente. Los finales de línea se mantienen iguales entre sistemas operativos porque una comparación byte a byte también detecta esas diferencias invisibles. Cada mecanismo ayuda a detectar desviaciones dentro de un alcance definido.',
								},
								id: '852400072d3bebb0-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Valores fluidos y conexión con las herramientas de diseño',
								},
								id: 'b962845a8b7e4268-12',
								type: 'header',
							},
							{
								data: {
									text: 'Algunos tamaños de texto y espacios son fluidos. Cambian con el ancho disponible entre un mínimo y un máximo. La fuente conserva las tres partes del cálculo, incluido el valor preferido, y el generador CSS produce una expresión clamp. Se conserva así la decisión original, en vez de guardar solo el tamaño que aparece en una captura.',
								},
								id: '5d39bc8a60423231-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los formatos de destino tienen capacidades distintas. La exportación a Figma lleva la expresión clamp como texto; no la convierte en una fórmula responsive nativa. La tipografía de la referencia de diseño usa el máximo estructurado cuando su formato solo acepta una dimensión. El recorrido de ida y vuelta con Figma también sigue siendo manual: exportar las variables, aplicarlas con las herramientas de diseño y verificar la exportación de regreso. Hay una conexión entre código y diseño, con límites de traducción explícitos.',
								},
								id: '260ba3135d00b205-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le langage visuel de la marque s&#39;inspire des infrastructures et de la signalisation. L&#39;orange identifie les interactions. Le jaune sert aux repères et à l&#39;orientation. Le blanc réfléchissant et le noir structurel donnent à la palette son contraste et son caractère. D&#39;autres couleurs expriment des états comme la réussite ou l&#39;erreur. L&#39;intention est de créer un vocabulaire reconnaissable qui puisse servir plusieurs types d&#39;information.',
								},
								id: '603f55cbe15047cf-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ces choix sont conservés dans un ensemble structuré de valeurs de design, souvent appelées tokens. Un token donne un nom et un sens convenu à une couleur, une taille de texte, un espacement, un arrondi ou une durée d&#39;animation. Les composants utilisent ces valeurs plutôt que de choisir chacun une variante presque identique. Le lien entre une décision de design et ses usages devient ainsi plus facile à examiner.',
								},
								id: '38104fe169ff0c10-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Une source, plusieurs résultats' },
								id: '137a41ea4495cb5c-2',
								type: 'header',
							},
							{
								data: {
									text: 'La source modifiable est un fichier JSON au format DTCG, une manière structurée de décrire les valeurs de design. Des générateurs transforment cette source dans les formats nécessaires aux feuilles de style, au code de mouvement et à la référence de design. Les fichiers générés sont comparés à cette source pour repérer les copies retouchées à la main qui pourraient devenir une version concurrente du design.',
								},
								id: '6ff5c15fe983401f-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;adaptateur de génération du dépôt indique précisément les quatre fichiers produits :',
								},
								id: 'e467c0ced12c4823-4',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const artifactPaths = [\n  \'DESIGN.md\',\n  \'apps/gallery/src/app.css\',\n  \'packages/motion/src/tokens.ts\',\n  \'packages/tokens/tokens.css\',\n] as const;\n```',
								},
								id: '8ff786241e6ed6da-5',
								type: 'code',
							},
							{
								data: {
									text: 'Ces fichiers répondent à des besoins différents : la référence de design, les styles de la galerie, les valeurs de mouvement et la feuille de style commune. Le moteur de génération reçoit des données et retourne du contenu. Un adaptateur propre au dépôt décide où l&#39;écrire. Chaque produit qui utilise le moteur conserve ses chemins de sortie et doit identifier correctement sa propre source dans les en-têtes des fichiers générés.',
								},
								id: 'e2e1f04d7afb200b-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette séparation évite d&#39;intégrer la structure des dossiers d&#39;une application dans le paquet partagé. Elle laisse aussi au produit la possibilité de conserver des valeurs locales révisées ou une organisation de fichiers particulière, sans les présenter comme des choix universels de la marque.',
								},
								id: '82a4ce37ca0b44ff-7',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Un petit changement dont on peut suivre le parcours',
								},
								id: 'ed5a7f7ff3dbe003-8',
								type: 'header',
							},
							{
								data: {
									text: 'Un test du dépôt donne un exemple concret. Dans une copie temporaire réservée au test, il fait passer la durée d&#39;animation rapide de 150 à 151 millisecondes. Il s&#39;attend à ce que le fichier TypeScript de mouvement et la feuille de style du paquet changent, tandis que celle de la galerie reste intacte. Il relance ensuite le générateur en mode vérification et s&#39;attend à ce qu&#39;il n&#39;y ait plus de changement. La milliseconde ajoutée sert au test; ce n&#39;est ni une refonte ni une amélioration mesurée.',
								},
								id: 'dafee307ab259700-9',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;exemple vérifie deux propriétés utiles. Un changement à la source doit atteindre les résultats qui en dépendent, et une génération répétée doit donner le même résultat. L&#39;outil compare le contenu existant avant l&#39;écriture, ce qui évite de réécrire les fichiers inchangés.',
								},
								id: '79ab301ebbca15de-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'D&#39;autres vérifications complètent ce parcours : les fichiers conservés dans le dépôt sont comparés au contenu généré, la commande de vérification continue des tokens détecte les différences, et un crochet local de commit facultatif refuse les fichiers générés préparés sans changement pertinent à la source. Les fins de ligne restent volontairement identiques entre systèmes d&#39;exploitation, car une comparaison octet par octet détecte aussi ces différences invisibles. Ces mécanismes aident à repérer les écarts, chacun dans son périmètre.',
								},
								id: '854b6f4ddc89969e-11',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Des valeurs fluides et un passage vers les outils de design',
								},
								id: '75a4028b5ae512d2-12',
								type: 'header',
							},
							{
								data: {
									text: 'Certaines tailles de texte et certains espacements sont fluides. Ils varient avec la largeur disponible entre un minimum et un maximum. La source conserve les trois parties du calcul, dont la valeur préférée, et le générateur CSS produit une expression clamp. On préserve ainsi la décision sous-jacente plutôt que la seule taille observée dans une capture.',
								},
								id: '42fa78cdf080895f-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les formats de destination n&#39;offrent pas tous les mêmes possibilités. L&#39;export Figma transporte l&#39;expression clamp sous forme de texte; il ne la transforme pas en formule responsive native. La typographie de la référence de design utilise le maximum structuré lorsque son format n&#39;accepte qu&#39;une dimension. Le passage aller-retour avec Figma reste aussi manuel : exporter les variables, les appliquer dans l&#39;outil de design, puis vérifier l&#39;export retourné. Le lien entre code et design existe, avec des limites de traduction explicites.',
								},
								id: '68404a2e07b22b3d-14',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Giving visual decisions one home',
					es: 'Darles un lugar a las decisiones visuales',
					fr: 'Donner un endroit précis aux décisions visuelles',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The component gallery renders actual package code with demonstration content. It includes buttons, tabs, a searchable selector, collapsible content, scrollable areas and other controls. It also shows the brand-specific pieces: station markers, section labels, blueprint-style frames and a terminal cursor.',
								},
								id: '2c2d378ce823bb8a-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A static default state only answers part of the question. The gallery includes disabled controls, loading, errors, overflowing content and labels supplied by the caller. Light and dark themes make it possible to inspect the same shared pieces in different visual conditions. Browser scenarios cover rendered interactions, responsive containment and accessibility-related behaviour as well as screenshot comparisons.',
								},
								id: 'cade92b91b23aaa4-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'A component&#39;s responsibility' },
								id: 'c996954d91e8d96d-2',
								type: 'header',
							},
							{
								data: {
									text: 'Here, a contract describes what a component should show, how it should behave, and which decisions stay with the product using it. That includes details that may not appear in the first screenshot.',
								},
								id: 'eae8d51d8c7f75db-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The searchable selector is a useful example. Its shared mechanics cover the open state, selected value, typed query and clearing behaviour. The caller supplies the options, stable values, visible labels, search text and accessible copy. The reviewed contract also specifies that closing resets the temporary query and that a value changed externally updates the displayed label. Those are observable behaviours a product can rely on and test.',
								},
								id: '91d8603fcc8e1c4e-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Some requirements cross the package boundary. The selector uses a minimum tap-target variable that the product must define as 44 pixels. A translated close label must come from the product when it uses a sheet. Reusing a control therefore includes setup obligations; the import alone does not establish that its surrounding page is usable.',
								},
								id: '5bb6b03e63c299c9-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The same principle applies to HTML semantics. A control acting as a link and one acting as a button expose the attributes and element reference appropriate to what they render. This helps keep the public API aligned with the actual interface instead of accepting combinations the component cannot meaningfully honour.',
								},
								id: '9cd76b7d8146809b-6',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Motion and reduced motion' },
								id: '3faa942d0c1d2fe0-7',
								type: 'header',
							},
							{
								data: {
									text: 'Motion has its own rules. Larger or continuous effects are gated by the reduced-motion preference, while some brief interaction feedback remains. The policy distinguishes pointer-following, large scale changes, continuous movement and scroll effects from smaller responses such as a colour change or a short press reaction.',
								},
								id: '7936e0c465ee146d-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For example, when the page sets up the effect, a card&#39;s pointer-following movement is disabled if reduced motion is requested or the device does not support hovering. These three guards come from the card action:',
								},
								id: '5dee6893f0ee7f5a-9',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n\tif (typeof window === \'undefined\') return { destroy: () => {} };\n\tif (isPrefersReducedMotion()) return { destroy: () => {} };\n\tif (!window.matchMedia(\'(hover: hover)\').matches) return { destroy: () => {} };\n```',
								},
								id: 'e71ef48c41fcb404-10',
								type: 'code',
							},
							{
								data: {
									text: 'The first check also lets the action do nothing in an environment without a browser. If the conditions allow the effect, it attaches pointer listeners and updates the offsets used by the card&#39;s inner elements. Leaving the card resets those offsets, and destroying the action removes the listeners.',
								},
								id: '0e19ab7138ce9b12-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The timing of the checks is part of the behaviour. This synchronous preference check runs at initialization. A changed operating-system preference takes effect on the next initialization or navigation for this policy; it is not a promise that every attached action reacts immediately. Other behaviours have their own CSS rules, such as stopping the skeleton pulse or removing a collapsible transition under reduced motion.',
								},
								id: '6b9a5a45370ac0d4-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Closed content also needs more than an animation. The shared collapsible content can remain mounted while being marked inert and hidden from assistive technology when closed. A product replacing a simpler wrapper must account for the extra structure and closed-state behaviour. The visual transition and the ability to interact with the content are separate things to review.',
								},
								id: 'df3ca2eed99496d9-13',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'What the checks can establish' },
								id: '7f832f2559d49096-14',
								type: 'header',
							},
							{
								data: {
									text: 'Package tests inspect shared contracts. The gallery examines their rendered integration. Quality engines inspect things such as colour contrast, style patterns and SEO coverage, using policy supplied by the caller. A product chooses its palette, thresholds, exclusions and expected results; the engine returns findings.',
								},
								id: '3e63a7aba377521b-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This gives a failed check somewhere specific to lead. An incorrect shared interaction belongs in the package. A product&#39;s conflicting visual requirement belongs with its local adaptation. A gallery screenshot gives evidence about the gallery. Full-page accessibility and product behaviour still need review in their actual context.',
								},
								id: '465dbd4d3f7d901a-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La galería usa el código real de los componentes con contenido de demostración. Incluye botones, pestañas, un selector con búsqueda, contenido plegable, áreas de desplazamiento y otros controles. También muestra elementos propios de la identidad: marcadores de estación, etiquetas de sección, marcos inspirados en planos técnicos y un cursor de terminal.',
								},
								id: '1733df199b3c2536-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El estado inicial de un control solo responde parte de las preguntas. La galería incluye controles deshabilitados, carga, errores, contenido que desborda su espacio y etiquetas proporcionadas por el producto. Los temas claro y oscuro permiten examinar las mismas piezas en condiciones visuales diferentes. Los escenarios en el navegador cubren las interacciones renderizadas, la adaptación del contenido al espacio disponible y comportamientos de accesibilidad, además de comparar capturas.',
								},
								id: '5eeb36424875fdf4-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La responsabilidad de un componente' },
								id: 'feab4c2c960c105a-2',
								type: 'header',
							},
							{
								data: {
									text: 'Aquí, un contrato describe qué debe mostrar un componente, cómo debe responder y qué decisiones conserva el producto que lo usa. También abarca detalles que no siempre aparecen en la primera captura.',
								},
								id: 'd1f1f305b1c1b973-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El selector con búsqueda es un ejemplo útil. Sus mecanismos compartidos manejan la apertura, el valor seleccionado, la consulta escrita y el borrado. El producto proporciona las opciones, sus valores estables, las etiquetas visibles, el texto de búsqueda y los textos de accesibilidad. El contrato revisado también indica que cerrar el selector reinicia la consulta temporal y que un cambio externo del valor actualiza la etiqueta mostrada. Son comportamientos observables que el producto puede usar y probar.',
								},
								id: '958b07456157dbc4-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Algunos requisitos atraviesan el límite del paquete. El selector usa una variable de tamaño mínimo de objetivo táctil que el producto debe definir en 44 píxeles. El producto también debe proporcionar una etiqueta de cierre traducida cuando usa un panel de tipo Sheet. Reutilizar un control incluye obligaciones de configuración; importarlo no basta para establecer que la página completa es usable.',
								},
								id: '12ba1320ca2aeab2-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El mismo principio se aplica a la semántica HTML. Un control que funciona como enlace y otro que funciona como botón exponen los atributos y la referencia del elemento que realmente renderizan. Esto mantiene la interfaz de programación alineada con la interfaz real, en vez de aceptar combinaciones que el componente no puede cumplir.',
								},
								id: '59521f65a5c36274-6',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Movimiento y movimiento reducido' },
								id: 'bb1f427a9eb5f99e-7',
								type: 'header',
							},
							{
								data: {
									text: 'El movimiento también tiene reglas. Los efectos más grandes o continuos tienen en cuenta la preferencia de movimiento reducido, mientras algunas respuestas breves a una interacción permanecen. La política distingue el seguimiento del puntero, los cambios grandes de escala, el movimiento continuo y los efectos de desplazamiento de respuestas menores, como un cambio de color o una reacción breve al presionar.',
								},
								id: '5aff659d673ae2c6-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Por ejemplo, al activar el efecto, el desplazamiento de una tarjeta que sigue el puntero se desactiva si se solicita movimiento reducido o si el dispositivo no permite pasar el puntero por encima. Estas tres verificaciones vienen del comportamiento de movimiento de la tarjeta:',
								},
								id: '1482bd191ccdd993-9',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n\tif (typeof window === \'undefined\') return { destroy: () => {} };\n\tif (isPrefersReducedMotion()) return { destroy: () => {} };\n\tif (!window.matchMedia(\'(hover: hover)\').matches) return { destroy: () => {} };\n```',
								},
								id: 'e71ef48c41fcb404-10',
								type: 'code',
							},
							{
								data: {
									text: 'La primera verificación también permite que la acción no haga nada en un entorno sin navegador. Si las condiciones permiten el efecto, el código conecta los eventos del puntero y actualiza los desplazamientos que usan los elementos dentro de la tarjeta. Salir de la tarjeta devuelve esos valores a cero, y destruir la acción retira los manejadores de eventos.',
								},
								id: '3772709b77d5109e-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El momento de las verificaciones forma parte del comportamiento. Esta lectura síncrona de la preferencia ocurre durante la inicialización. Para esta política, un cambio en la configuración del sistema operativo se aplica en la siguiente inicialización o navegación; no significa que cada acción ya conectada responda de inmediato. Otros comportamientos tienen sus propias reglas CSS, como detener el pulso de un indicador de carga tipo Skeleton o quitar la transición de un contenido plegable.',
								},
								id: 'e91863afd67fe956-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El contenido cerrado también necesita algo más que una animación. El contenido plegable compartido puede seguir montado mientras queda inerte y oculto para las tecnologías de asistencia cuando está cerrado. Un producto que reemplace una envoltura más sencilla debe tener en cuenta la estructura adicional y el comportamiento del estado cerrado. La transición visual y la posibilidad de interactuar con el contenido son asuntos distintos que deben revisarse.',
								},
								id: '88493dff98b2b44e-13',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Qué permiten establecer las verificaciones',
								},
								id: 'e6ea66b64ca85cef-14',
								type: 'header',
							},
							{
								data: {
									text: 'Las pruebas de los paquetes examinan los contratos compartidos. La galería examina su integración en una interfaz renderizada. Los motores de calidad revisan aspectos como contraste, patrones de estilo y cobertura de metadatos para buscadores, según las reglas que proporciona el producto. Este elige su paleta, umbrales, exclusiones y resultados esperados; el motor devuelve los hallazgos.',
								},
								id: '38b33f96ca40c9ee-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Así, una verificación fallida apunta a una responsabilidad concreta. Una interacción compartida incorrecta corresponde al paquete. Un requisito visual propio del producto corresponde a su adaptación local. Una captura de la galería ofrece evidencia sobre la galería. La accesibilidad de la página completa y el comportamiento del producto todavía requieren una revisión en su contexto real.',
								},
								id: 'c1b1fc3027084193-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La galerie utilise le vrai code des composants avec du contenu de démonstration. Elle présente des boutons, des onglets, un sélecteur avec recherche, des sections repliables, des zones de défilement et d&#39;autres commandes. Elle montre aussi les éléments propres à l&#39;identité visuelle : repères de station, libellés de section, cadres inspirés des plans techniques et curseur de terminal.',
								},
								id: 'a65625cdbd1ea76f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;état initial d&#39;une commande répond seulement à une partie des questions. La galerie inclut les commandes désactivées, le chargement, les erreurs, le contenu qui déborde et les libellés fournis par le produit. Les thèmes clair et sombre permettent d&#39;examiner les mêmes éléments dans des conditions visuelles différentes. Les scénarios dans le navigateur couvrent les interactions rendues, le maintien du contenu dans l&#39;espace disponible et des comportements liés à l&#39;accessibilité, en plus des comparaisons de captures.',
								},
								id: '717fdda7fca80c0e-1',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'La responsabilité d&#39;un composant' },
								id: '710b0fe0b07a92f0-2',
								type: 'header',
							},
							{
								data: {
									text: 'Ici, un contrat décrit ce qu’un composant doit afficher, comment il doit réagir et ce qui reste à décider par le produit qui l’utilise. Il comprend des détails qui ne sont pas toujours visibles dans la première capture.',
								},
								id: 'b69e3e002c31ca7f-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le sélecteur avec recherche en donne un bon exemple. Ses mécanismes partagés gèrent l&#39;ouverture, la valeur sélectionnée, la recherche saisie et l&#39;effacement. Le produit fournit les options, leurs valeurs stables, les libellés visibles, le texte de recherche et les textes d&#39;accessibilité. Le contrat examiné précise aussi que la fermeture réinitialise la recherche temporaire et qu&#39;une valeur changée de l&#39;extérieur met à jour le libellé affiché. Ce sont des comportements observables sur lesquels un produit peut s&#39;appuyer et qu&#39;il peut tester.',
								},
								id: '6a9d05d42478fb53-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Certaines exigences traversent la limite du paquet. Le sélecteur utilise une variable de taille minimale de cible tactile que le produit doit définir à 44 pixels. Le produit doit aussi fournir un libellé de fermeture traduit lorsqu&#39;il utilise un panneau de type Sheet. Réutiliser une commande comporte donc des obligations de configuration; son importation ne suffit pas à établir que la page complète est utilisable.',
								},
								id: '5134c9c17549050d-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le même principe s&#39;applique à la sémantique HTML. Une commande qui agit comme un lien et une autre qui agit comme un bouton exposent les attributs et la référence d&#39;élément correspondant à ce qu&#39;elles affichent réellement. L&#39;interface de programmation reste ainsi alignée sur l&#39;élément rendu, au lieu d&#39;accepter des combinaisons que le composant ne peut pas respecter.',
								},
								id: '9b4d50ce34559713-6',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Le mouvement et sa réduction' },
								id: '34eedf3f64faa881-7',
								type: 'header',
							},
							{
								data: {
									text: 'Le mouvement suit aussi des règles. Les effets plus importants ou continus tiennent compte de la préférence de réduction des animations, tandis que certaines réactions brèves à une interaction restent actives. La politique distingue le suivi du pointeur, les grands changements d&#39;échelle, les mouvements continus et les effets de défilement de réactions plus petites, comme un changement de couleur ou une brève réponse à un appui.',
								},
								id: '80069696e77b3c58-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Par exemple, à l’activation de l’effet, le léger déplacement d&#39;une carte qui suit le pointeur reste désactivé si la réduction des animations est demandée ou si l&#39;appareil ne prend pas en charge le survol. Ces trois vérifications viennent du comportement de déplacement de la carte :',
								},
								id: '0615011a1b33d49b-9',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\n\tif (typeof window === \'undefined\') return { destroy: () => {} };\n\tif (isPrefersReducedMotion()) return { destroy: () => {} };\n\tif (!window.matchMedia(\'(hover: hover)\').matches) return { destroy: () => {} };\n```',
								},
								id: 'e71ef48c41fcb404-10',
								type: 'code',
							},
							{
								data: {
									text: 'La première vérification permet aussi au comportement de ne rien faire dans un environnement sans navigateur. Si les conditions permettent l&#39;effet, le code attache des écouteurs de pointeur et met à jour les décalages utilisés par les éléments à l&#39;intérieur de la carte. Quitter la carte remet ces valeurs à zéro, et la destruction du comportement retire les écouteurs.',
								},
								id: 'c7e8d6ce210d280a-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le moment de la vérification fait partie du comportement. Cette lecture synchrone de la préférence se fait à l&#39;initialisation. Pour cette politique, un changement du réglage du système d&#39;exploitation prend effet à la prochaine initialisation ou navigation; chaque effet déjà attaché ne réagit donc pas nécessairement immédiatement. D&#39;autres comportements ont leurs propres règles CSS, comme l&#39;arrêt de la pulsation d&#39;un squelette de chargement ou le retrait de la transition d&#39;une section repliable.',
								},
								id: '2f4893e8a074ad14-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le contenu fermé demande aussi plus qu&#39;une animation. Le contenu repliable partagé peut rester monté tout en devenant inerte et masqué aux technologies d&#39;assistance lorsqu&#39;il est fermé. Un produit qui remplace une enveloppe plus simple doit tenir compte de cette structure supplémentaire et du comportement à l&#39;état fermé. La transition visuelle et la possibilité d&#39;interagir avec le contenu sont deux choses à réviser.',
								},
								id: 'daed8387d9903929-13',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Ce que les vérifications permettent d&#39;établir',
								},
								id: '4fb1e534c05d9c90-14',
								type: 'header',
							},
							{
								data: {
									text: 'Les tests des paquets examinent les contrats partagés. La galerie examine leur intégration dans une interface rendue. Les moteurs de contrôle examinent notamment le contraste, les motifs de style et la couverture des métadonnées de référencement, à partir de règles fournies par le produit. Celui-ci choisit sa palette, ses seuils, ses exclusions et ses résultats attendus; le moteur retourne les constats.',
								},
								id: 'e58360301308e4ac-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une vérification en échec indique ainsi une responsabilité plus précise. Une interaction commune incorrecte relève du paquet. Une exigence visuelle propre au produit relève de son adaptation locale. Une capture de la galerie renseigne sur la galerie. L&#39;accessibilité de la page complète et le comportement du produit doivent encore être examinés dans leur contexte réel.',
								},
								id: 'b6bec3ed1c0bf69a-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Making the behaviour visible',
					es: 'Ver cómo se comportan los componentes',
					fr: 'Voir les composants en contexte',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The most consequential decisions concern what each product keeps. Reuse creates a maintenance relationship: once several products depend on the same behaviour, changing it asks all of them to consider the consequences.',
								},
								id: '9180c9c0a35592ca-0',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'The card conflict' },
								id: '41d73278ac90e449-1',
								type: 'header',
							},
							{
								data: {
									text: 'Transit and yesid.dev share a foundation, but their cards do not need identical treatment. Transit&#39;s documented contract requires a flat card without shadow or edge highlight. yesid.dev keeps a bevel and a hover shadow. These are explicit, incompatible requirements, with consumer tests supporting them.',
								},
								id: '1b478192da7f2ed3-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The common surface can remain shared while a local wrapper or style owns the difference. The shared package does not check the application&#39;s name to decide which appearance to render. If a proposed abstraction requires that knowledge, the project&#39;s governance sends that behaviour back to the product.',
								},
								id: '9f2ec06a63dd6561-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is more than a preference about code style. If the bevel were added to the shared card to solve one site&#39;s need, Transit would receive a change its own tests reject. If the package accumulated named exceptions for each application, its maintainers would need to understand more product policy each time they changed a common element.',
								},
								id: '583d6df2a3df4946-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'What the rule of three actually covers' },
								id: '41340f6166070fff-5',
								type: 'header',
							},
							{
								data: {
									text: 'Composed patterns follow a rule of three: three independent consumers, meaning products that use the component, must need the same contract before the pattern is promoted into a shared package through its own release. This is a project governance rule. It is not a count of clients, a deployment target or a claim that every primitive already has three production users.',
								},
								id: '57fadd9af5fee2f9-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'CollapsibleSection illustrates the distinction. Two products can both show a heading, chevron and hidden content while differing in header composition, persistence, control signals and animation semantics. The lower-level collapsible primitives can be shared. The complete section controller stays local until there is evidence for one common contract.',
								},
								id: 'c9b3f96c0d032aa9-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Footer composition follows the same reasoning. Small shared elements can help build a footer, while its navigation, status information, attribution and arrangement remain product decisions. A familiar appearance alone does not settle who should own the whole composition.',
								},
								id: '22bb6a65d93e193b-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This leaves some duplication in place. The cost is maintaining those local pieces. The benefit is that differences remain explicit while the real requirements are still different. Promotion then becomes a decision supported by use, rather than an assumption made from two similar files.',
								},
								id: '11a075828c0fd1ca-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'State, configuration and product authority',
								},
								id: '83c0e257574a83e2-10',
								type: 'header',
							},
							{
								data: {
									text: 'A controlled view can render a state and offer callbacks without owning how that state is stored or what the action means. QuietModeButton, for example, shares two-button markup, icons and interaction geometry. The caller supplies the copy, current state, persistence and both actions. Its visual reuse does not move product control into the package.',
								},
								id: '31576355f3fee0f3-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Even configuration has a boundary. The UI class-merging vocabulary is fixed when the application starts, per loaded module graph. Equivalent initialization can repeat; conflicting initialization throws. It must not be derived from a request, user, tenant or current language. A browser bundle and a server-rendering bundle have their own initialization. This keeps a shared configuration mechanism from becoming a container for changing user-specific state.',
								},
								id: '3ca75303f881bd3d-12',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Domains beyond the visible interface' },
								id: '5dd40a9fbe68c379-13',
								type: 'header',
							},
							{
								data: {
									text: 'The foundation now includes mechanics outside styling. The SEO package builds structured metadata and sitemap entries, while the product owns page content, canonical routes, indexing choices and image templates. Locale routing shares path parsing and localization mechanics, while each product chooses its languages, published pages, fallback behaviour and framework integration.',
								},
								id: '0b91ac0a76710b25-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Analytics follows a similar boundary. The shared package supplies consent-aware state and sending mechanics. The product supplies its domain, event catalogue, consent text, storage choices and transport. In the reviewed source, consent and domain checks happen before transport loading and again before sending. Using those mechanics does not itself decide the product&#39;s privacy policy.',
								},
								id: '9f510dcd3b00f5fc-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'These domains share a reason for being here: their repeatable mechanics can serve several products. Each still has a narrow owner. Navigation, data contracts, credentials, deployment adapters and product-specific decisions stay outside the foundation.',
								},
								id: '6e3332c85f717bb7-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Las decisiones más importantes tienen que ver con lo que conserva cada producto. Reutilizar crea una relación de mantenimiento: cuando varios productos dependen del mismo comportamiento, cambiarlo les exige considerar las consecuencias.',
								},
								id: 'a8977cdb48e921f8-0',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'El conflicto entre las tarjetas' },
								id: 'a785e3762333efa8-1',
								type: 'header',
							},
							{
								data: {
									text: 'Transit y yesid.dev comparten una base, pero sus tarjetas no tienen que ser iguales. El contrato documentado de Transit exige una tarjeta plana, sin sombra ni borde resaltado. yesid.dev conserva un bisel y una sombra al pasar el cursor. Son requisitos explícitos, incompatibles y respaldados por pruebas de cada producto.',
								},
								id: 'f2a1f6ae0cbedfa9-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La superficie común puede seguir compartida mientras una adaptación o un estilo local maneja la diferencia. El paquete compartido no consulta el nombre de la aplicación para decidir qué apariencia renderizar. Si una abstracción propuesta necesita conocerlo, las reglas del proyecto devuelven ese comportamiento al producto.',
								},
								id: '6fb4d519427a9f40-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La consecuencia va más allá de una preferencia de estilo en el código. Si se añadiera el bisel a la tarjeta compartida para resolver la necesidad de un sitio, Transit recibiría un cambio que sus propias pruebas rechazan. Si el paquete acumulara excepciones con el nombre de cada aplicación, mantenerlo exigiría conocer cada vez más reglas particulares de los productos.',
								},
								id: '7d6d194d7e10868d-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Qué cubre realmente la regla de tres' },
								id: '4551098d787989f7-5',
								type: 'header',
							},
							{
								data: {
									text: 'Los patrones compuestos siguen una regla de tres: tres consumidores independientes, es decir, productos que usan el componente, deben necesitar el mismo contrato antes de promover el patrón a un paquete compartido mediante una versión deliberada. Es una regla de gobierno del proyecto. No cuenta clientes, no fija una meta de despliegues ni afirma que cada control básico ya tenga tres usos en producción.',
								},
								id: '92b01cc0b68c8b3c-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'CollapsibleSection ilustra la diferencia. Dos productos pueden mostrar un título, un chevrón y contenido oculto, y aun así diferir en la composición del encabezado, la persistencia, las señales de control y el comportamiento de las animaciones. Las piezas plegables básicas pueden compartirse. El controlador de la sección completa sigue siendo local hasta que los usos establezcan un contrato común.',
								},
								id: '7156f59582bd2f0f-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La composición del pie de página sigue el mismo razonamiento. Pequeñas piezas compartidas pueden ayudar a construirlo, mientras su navegación, información de estado, atribución y distribución siguen siendo decisiones del producto. Una apariencia familiar no determina por sí sola quién debe hacerse cargo de toda la composición.',
								},
								id: '95ec9b38dc478263-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esto deja parte de la duplicación en su lugar. El costo es mantener esas piezas locales. A cambio, las diferencias siguen siendo explícitas mientras los requisitos continúan siendo distintos. Compartir se vuelve una decisión respaldada por el uso, en lugar de una suposición basada en dos archivos parecidos.',
								},
								id: 'e5179b3015e85b31-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Estado, configuración y control del producto',
								},
								id: '47ebc188039e8ca2-10',
								type: 'header',
							},
							{
								data: {
									text: 'Una vista controlada puede mostrar un estado y ofrecer funciones de respuesta sin decidir dónde se guarda ese estado ni qué significa la acción. QuietModeButton, por ejemplo, comparte la estructura de dos botones, los íconos y las dimensiones de interacción. El producto proporciona los textos, el estado actual, la persistencia y las dos acciones. Reutilizar la apariencia no traslada el control del producto al paquete.',
								},
								id: '35fed563a8c356da-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La configuración también tiene un límite. El vocabulario que se usa para combinar clases de interfaz queda fijo al iniciar la aplicación, por cada conjunto de módulos cargado. Una inicialización equivalente puede repetirse; una configuración contradictoria genera un error. No debe depender de una solicitud, un usuario, una organización usuaria ni del idioma actual. Los módulos del navegador y los del renderizado en servidor tienen su propia inicialización. Así, una configuración compartida no se convierte en un lugar para guardar estado cambiante de una persona.',
								},
								id: '3c043284bb095a25-12',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Dominios más allá de la interfaz visible',
								},
								id: '2dc646f8654b9974-13',
								type: 'header',
							},
							{
								data: {
									text: 'La base ya incluye mecanismos que van más allá de los estilos. El paquete de SEO construye metadatos estructurados y entradas de mapas del sitio, mientras el producto conserva el contenido, las rutas canónicas, las decisiones de indexación y las plantillas de imágenes. El enrutamiento por idioma comparte mecanismos para interpretar y localizar rutas; cada producto elige sus idiomas, páginas publicadas, reglas de respaldo e integración con el framework.',
								},
								id: '702e94cc722c5f93-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La analítica tiene un límite parecido. El paquete compartido proporciona mecanismos de estado y envío que tienen en cuenta el consentimiento. El producto proporciona su dominio, catálogo de eventos, textos de consentimiento, decisiones de almacenamiento y transporte. En el código revisado, el consentimiento y el dominio se verifican antes de cargar el transporte y de nuevo antes de enviar. Usar estos mecanismos no define por sí solo la política de privacidad del producto.',
								},
								id: 'cb1a3f3f2e818459-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Estos dominios tienen una razón común para estar aquí: sus mecanismos repetibles pueden servir a varios productos. Cada uno conserva una responsabilidad acotada. La navegación, los contratos de datos, las credenciales, los adaptadores de despliegue y las decisiones propias del producto permanecen fuera de la base.',
								},
								id: '4b20a177b65557e1-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les décisions les plus importantes portent sur ce que chaque produit conserve. La réutilisation crée un lien de maintenance : quand plusieurs produits dépendent du même comportement, sa modification les oblige à en examiner les conséquences.',
								},
								id: '4c885c7b1cfa2b2b-0',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Le conflit entre les cartes' },
								id: 'f419647bbf0b9537-1',
								type: 'header',
							},
							{
								data: {
									text: 'Transit et yesid.dev partagent une base, mais leurs cartes n&#39;ont pas à être identiques. Le contrat documenté de Transit exige une carte plate, sans ombre ni bordure en relief. yesid.dev conserve un biseau et une ombre au survol. Ces exigences sont explicites, incompatibles et appuyées par des tests propres aux produits.',
								},
								id: '866464d4d856fccb-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La surface commune peut rester partagée pendant qu&#39;un composant d&#39;adaptation ou un style local prend en charge la différence. Le paquet partagé ne vérifie pas le nom de l&#39;application pour choisir l&#39;apparence à afficher. Si une abstraction proposée exige cette connaissance, les règles du projet renvoient ce comportement dans le produit.',
								},
								id: 'a7e1ab54963beec9-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La conséquence dépasse une préférence de style dans le code. Ajouter le biseau à la carte commune pour répondre au besoin d&#39;un site ferait recevoir à Transit un changement que ses propres tests refusent. Si le paquet accumulait des exceptions nommées pour chaque application, sa maintenance demanderait de connaître toujours plus de règles propres aux produits.',
								},
								id: 'eabeefccc419a65f-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Ce que couvre vraiment la règle de trois',
								},
								id: '2dd01f084184d646-5',
								type: 'header',
							},
							{
								data: {
									text: 'Les composants composés suivent une règle de trois : trois consommateurs indépendants, c&#39;est-à-dire trois produits qui utilisent le composant, doivent avoir besoin du même contrat avant sa promotion dans un paquet partagé, avec une version délibérée. C&#39;est une règle de gouvernance du projet. Elle ne compte pas les clients, ne fixe pas une cible de déploiement et ne signifie pas que chaque commande de base possède déjà trois usages en production.',
								},
								id: '130eca4535df59a0-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'CollapsibleSection illustre la distinction. Deux produits peuvent afficher un titre, un chevron et du contenu masqué tout en différant dans la composition de l&#39;en-tête, la mémorisation de l&#39;état, les signaux de contrôle et le comportement des animations. Les commandes repliables de base peuvent être partagées. Le composant qui gère toute la section reste local jusqu&#39;à ce qu&#39;un contrat commun soit établi par les usages.',
								},
								id: 'f6018b4ee40f17e8-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La composition du pied de page suit le même raisonnement. De petits éléments partagés peuvent aider à le construire, tandis que sa navigation, son état, ses mentions et son organisation restent des décisions du produit. Une apparence familière ne détermine pas à elle seule qui doit posséder toute la composition.',
								},
								id: '9483d63d06aa1099-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une partie de la duplication demeure donc volontaire. Elle coûte l&#39;entretien des éléments locaux. En échange, les différences restent explicites tant que les besoins diffèrent. La mise en commun devient une décision appuyée par l&#39;utilisation, plutôt qu&#39;une hypothèse fondée sur deux fichiers qui se ressemblent.',
								},
								id: '95a1544188303238-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'L&#39;état, la configuration et le contrôle du produit',
								},
								id: '0bd053f4e5571f5b-10',
								type: 'header',
							},
							{
								data: {
									text: 'Une vue contrôlée peut afficher un état et offrir des fonctions de rappel sans décider où cet état est conservé ni ce que l&#39;action signifie. QuietModeButton, par exemple, partage la structure de deux boutons, les icônes et les dimensions d&#39;interaction. Le produit fournit les textes, l&#39;état courant, la persistance et les deux actions. Réutiliser l&#39;apparence ne transfère pas le contrôle du produit au paquet.',
								},
								id: 'b4b411fd090ab127-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La configuration a elle aussi une limite. Le vocabulaire utilisé pour fusionner les classes de l&#39;interface est fixé au démarrage de l&#39;application, pour chaque ensemble de modules chargé. Une initialisation équivalente peut se répéter; une configuration contradictoire provoque une erreur. Elle ne doit pas dépendre d&#39;une requête, d&#39;un utilisateur, d&#39;une organisation utilisatrice ou de la langue courante. Les modules du navigateur et ceux du rendu serveur ont leur propre initialisation. Une configuration commune ne devient ainsi pas un endroit où stocker un état variable propre à une personne.',
								},
								id: 'a5bd24e13969f818-12',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Des domaines au-delà de l&#39;interface visible',
								},
								id: '5bdf531bce50787e-13',
								type: 'header',
							},
							{
								data: {
									text: 'La base comprend maintenant des mécanismes qui dépassent les styles. Le paquet de référencement construit des métadonnées structurées et des entrées de plan de site, tandis que le produit possède le contenu, les adresses canoniques, les choix d&#39;indexation et les modèles d&#39;images. Le routage multilingue partage l&#39;analyse et la localisation des chemins; chaque produit choisit ses langues, ses pages publiées, ses règles de repli et son intégration au cadre applicatif.',
								},
								id: 'b57030564dc38280-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;analytique suit une limite semblable. Le paquet partagé fournit des mécanismes d&#39;état et d&#39;envoi tenant compte du consentement. Le produit fournit son domaine, son catalogue d&#39;événements, les textes de consentement, ses choix de stockage et le transport. Dans le code examiné, le consentement et le domaine sont vérifiés avant le chargement du transport, puis de nouveau avant l&#39;envoi. L&#39;utilisation de ces mécanismes ne détermine pas à elle seule la politique de confidentialité du produit.',
								},
								id: 'e2b7f540bdd56b22-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ces domaines ont une raison commune d&#39;être ici : leurs mécanismes répétables peuvent servir plusieurs produits. Chacun garde une responsabilité limitée. La navigation, les contrats de données, les identifiants secrets, les adaptateurs de déploiement et les décisions propres au produit restent à l&#39;extérieur de la base.',
								},
								id: 'f1e2495abf28217b-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Deciding what belongs together',
					es: 'Decidir qué se comparte',
					fr: 'Déterminer ce qui doit être partagé',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Each product adopts an exact version. A release of the foundation does not automatically update every site. The unit of change is a reviewed adoption in the receiving product, with its own generated files and acceptance checks.',
								},
								id: 'e65d5ea115a97f63-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Coordinated releases and a separate tooling line',
								},
								id: 'b8af6778661d6af6-1',
								type: 'header',
							},
							{
								data: {
									text: 'Seven packages move together: tokens, motion, gates, UI, SEO mechanics, analytics and locale routing. Coordinating them gives a release one known package set. It also means that a change affecting one part still needs review within that coordinated release. The private gallery is outside this version group, and shared compiler and task configuration has its own independent release line.',
								},
								id: 'b46fc64026ada5e7-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Packages ship TypeScript and Svelte source. Products import the component families they need and explicitly opt into shared stylesheets. That makes the build integration visible: a Tailwind consumer needs to scan the installed UI source, and its stylesheet must supply the application values required by the components.',
								},
								id: '50865a3f0fa876d6-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Public-interface reports make changes to the supported API reviewable. Release fragments describe the consumer-visible change and any migration. The compatibility policy also distinguishes adding a capability, fixing a defect and removing an established contract. A stable removal requires both a documented waiting period of at least 90 days and an intervening minor release. Those are maintained rules, not a reason to assume an upgrade needs no inspection.',
								},
								id: '6101e986acae23f2-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Knowing what was installed' },
								id: 'b07134276880dbaa-5',
								type: 'header',
							},
							{
								data: {
									text: 'The adoption tool installs an exact release archive and records what it received in a manifest. The receipt identifies the tag, underlying commit, asset size and digest, included package set, adoption-tool identity and installed payload hash. In plain terms, it ties the installed files to a specific release and gives later checks something concrete to compare.',
								},
								id: '14514e10f15475a0-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Offline check mode verifies the installed payload and its receipt. It does not contact the release service to prove upstream CI, and it does not establish that the product behaves correctly. Release provenance, local integrity and product acceptance answer different questions.',
								},
								id: 'fa013a3929ed0455-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The one-direction rule follows from that structure. Products do not repair shared code by patching their installed copy. A shared defect is corrected in the foundation and delivered through a new release. A product-specific difference belongs in the product&#39;s adapter. Otherwise the version in the manifest would stop explaining the code the product actually runs.',
								},
								id: '4450bdae23ccdc25-8',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Following a change into a product' },
								id: 'd51d7e308c34e44b-9',
								type: 'header',
							},
							{
								data: {
									text: 'Consider a reviewed change to a shared animation duration. The source value changes upstream, its generated outputs are examined, and the affected package and gallery checks run. The release describes the change. Transit or yesid.dev can then choose that exact version, regenerate its own outputs and inspect where the duration appears in its interface.',
								},
								id: 'befcbaa4e27cced3-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A component change asks additional questions. Did the new markup alter a product selector? Does a local card still preserve its intended surface? Does closed content still behave correctly? Do translated labels fit? The adoption contract requires relevant product tests, type checks, a build and browser comparison across the affected themes, sizes and interaction states.',
								},
								id: '6d3b04e7669c43a6-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This adds work to delivery. It also makes the decision traceable: what changed upstream, which product accepted it and what was checked there. A passing gallery run cannot replace those answers because the gallery uses workspace packages and its own demo composition.',
								},
								id: '933678613cde015a-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Rollback follows the same deliberate path. The product adopts a previously accepted exact release, reconciles dependencies with that release&#39;s package set, regenerates its outputs and repeats its checks. Older versions may contain fewer packages. Restoring files without reviewing that dependency relationship would leave part of the upgrade decision unresolved.',
								},
								id: '7744cc8b55f7d764-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Cada producto adopta una versión exacta. Publicar una nueva versión de la base no cambia automáticamente todos los sitios. El cambio ocurre mediante una adopción revisada en el producto que la recibe, con sus propios archivos generados y verificaciones de aceptación.',
								},
								id: '25664cdc635f707a-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Versiones coordinadas y una línea distinta para las herramientas',
								},
								id: '210029d4be57a4f4-1',
								type: 'header',
							},
							{
								data: {
									text: 'Siete paquetes avanzan juntos: tokens, movimiento, verificaciones de calidad, interfaz, mecanismos de SEO, analítica y enrutamiento por idioma. Coordinarlos le da a cada versión un conjunto conocido de paquetes. También significa que un cambio limitado a una parte debe revisarse dentro de esa versión común. La galería privada queda fuera de ese grupo, y la configuración compartida de compilación y tareas tiene una línea de versiones independiente.',
								},
								id: 'c852dfa4efbee74c-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los paquetes distribuyen código fuente TypeScript y Svelte. Los productos importan las familias de componentes que necesitan y activan explícitamente las hojas de estilos compartidas. Las obligaciones de integración quedan visibles: un producto que usa Tailwind debe analizar el código fuente instalado de la interfaz, y su hoja de estilos debe definir los valores de aplicación que necesitan los componentes.',
								},
								id: '2fe1411ca3fe1c14-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los reportes de interfaz pública permiten revisar los cambios de la API. Las notas que acompañan cada cambio describen su efecto visible para el producto y cualquier migración. La política de compatibilidad también distingue entre añadir una capacidad, corregir un defecto y retirar un contrato establecido. Retirar un contrato estable exige tanto un periodo documentado de al menos 90 días como una versión menor intermedia. Son reglas que se mantienen, no una razón para omitir la revisión de una actualización.',
								},
								id: 'c51f3fa01166968f-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Saber qué se instaló' },
								id: 'dae1041304b158d6-5',
								type: 'header',
							},
							{
								data: {
									text: 'La herramienta de adopción instala el archivo de una versión exacta y guarda un registro de lo que recibió en un manifiesto. El registro identifica la etiqueta, el commit asociado, el tamaño y la huella digital del archivo, los paquetes incluidos, la identidad de la herramienta de adopción y la huella del contenido instalado. Vincula los archivos con una versión específica y les da a las verificaciones posteriores una referencia concreta.',
								},
								id: 'fac87205d86a5d06-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El modo de verificación sin conexión compara los archivos instalados con su registro. No contacta el servicio de publicación para demostrar que pasaron las verificaciones de origen ni establece que el producto funcione correctamente. La procedencia de la versión, la integridad local y la aceptación del producto responden preguntas diferentes.',
								},
								id: 'acf7dc84703cb413-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La regla de flujo en una sola dirección se desprende de esa estructura. Los productos no corrigen el código compartido modificando su copia instalada. Un defecto común se corrige en la base y se entrega en una nueva versión. Una diferencia propia del producto corresponde a su adaptación local. De lo contrario, la versión indicada en el manifiesto dejaría de explicar el código que realmente ejecuta el producto.',
								},
								id: '152ee1e9553447d8-8',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Seguir un cambio hasta el producto' },
								id: '1a44f3c2ecd7602a-9',
								type: 'header',
							},
							{
								data: {
									text: 'Pensemos en un cambio revisado de una duración de animación compartida. La fuente cambia en la base, se examinan los archivos generados y se ejecutan las verificaciones correspondientes del paquete y de la galería. La versión describe el cambio. Después, Transit o yesid.dev puede elegir esa versión exacta, regenerar sus propias salidas y revisar dónde aparece esa duración en su interfaz.',
								},
								id: '73186a3cef8e3423-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cambiar un componente plantea más preguntas. ¿La nueva estructura HTML afectó un selector del producto? ¿La tarjeta local conserva la superficie prevista? ¿El contenido cerrado sigue comportándose correctamente? ¿Caben las etiquetas traducidas? El contrato de adopción exige las pruebas pertinentes del producto, verificación de tipos, compilación y comparación en el navegador según los temas, tamaños y estados de interacción afectados.',
								},
								id: '18a62fada036af58-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Este proceso añade trabajo a una entrega. También permite seguir la decisión: qué cambió en la base, qué producto lo aceptó y qué se verificó allí. Una ejecución exitosa en la galería no reemplaza esas respuestas, porque usa los paquetes del espacio de trabajo y su propia composición de demostración.',
								},
								id: '714f22c2f07bc547-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Volver atrás sigue el mismo recorrido deliberado. El producto adopta una versión exacta aceptada anteriormente, ajusta sus dependencias al conjunto de paquetes de esa versión, regenera sus archivos y repite las verificaciones. Las versiones anteriores pueden contener menos paquetes. Restaurar archivos sin revisar esa relación de dependencias dejaría una parte de la decisión de actualización sin resolver.',
								},
								id: 'acd53feacf02c625-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Chaque produit adopte une version exacte. Une nouvelle version de la base ne modifie pas automatiquement tous les sites. Le changement se fait par une adoption révisée dans le produit qui la reçoit, avec ses propres fichiers générés et vérifications d&#39;acceptation.',
								},
								id: 'b04b2a1afd076853-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Des versions coordonnées et un cycle distinct pour l&#39;outillage',
								},
								id: '792d4c1e89f4af6a-1',
								type: 'header',
							},
							{
								data: {
									text: 'Sept paquets évoluent ensemble : les tokens, le mouvement, les contrôles de qualité, l&#39;interface, les mécanismes de référencement, l&#39;analytique et le routage multilingue. Cette coordination donne à chaque version un ensemble connu de paquets. Elle signifie aussi qu&#39;un changement limité à une partie doit être examiné dans le cadre de cette version commune. La galerie privée reste à l&#39;extérieur de ce groupe, et les réglages partagés de compilation et de tâches ont leur propre cycle de versions.',
								},
								id: 'ec3e4ed920f93bf4-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les paquets distribuent du code source TypeScript et Svelte. Les produits importent les familles de composants nécessaires et activent explicitement les feuilles de style communes. Les obligations de compilation deviennent visibles : un produit utilisant Tailwind doit analyser le code source installé de l&#39;interface, et sa feuille de style doit définir les valeurs d&#39;application attendues par les composants.',
								},
								id: '8be34d3d19764876-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les rapports d&#39;interface publique rendent les changements à l&#39;API examinables. Chaque changement s&#39;accompagne d&#39;une note qui décrit son effet visible pour le produit et la migration éventuelle. La politique de compatibilité distingue aussi l&#39;ajout d&#39;une capacité, la correction d&#39;un défaut et le retrait d&#39;un contrat établi. Le retrait d&#39;un contrat stable exige à la fois un délai documenté d&#39;au moins 90 jours et une version mineure intermédiaire. Ces règles sont maintenues; elles ne dispensent pas de réviser une mise à jour.',
								},
								id: '01a147395f789bdb-4',
								type: 'paragraph',
							},
							{
								data: { level: 3, text: 'Savoir ce qui a été installé' },
								id: '98dc2fcc5aa9baff-5',
								type: 'header',
							},
							{
								data: {
									text: 'L&#39;outil d&#39;adoption installe l&#39;archive d&#39;une version exacte et conserve un relevé de ce qu&#39;il a reçu dans un manifeste. Ce relevé identifie l&#39;étiquette de version, le commit associé, la taille et l&#39;empreinte de l&#39;archive, les paquets inclus, l&#39;identité de l&#39;outil d&#39;adoption et l&#39;empreinte des fichiers installés. Il relie les fichiers à une version précise et fournit une référence concrète aux vérifications suivantes.',
								},
								id: 'aa8d96462747a1d9-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le mode de vérification hors ligne compare les fichiers installés avec leur relevé. Il ne contacte pas le service de publication pour prouver le résultat des vérifications en amont et n&#39;établit pas que le produit fonctionne correctement. La provenance d&#39;une version, l&#39;intégrité locale et l&#39;acceptation du produit répondent à des questions différentes.',
								},
								id: '9adbd638f413aefb-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La règle de circulation à sens unique découle de cette structure. Les produits ne corrigent pas le code partagé en retouchant leur copie installée. Un défaut commun est corrigé dans la base et livré dans une nouvelle version. Une différence propre au produit appartient à son adaptation locale. Autrement, la version indiquée dans le manifeste cesserait d&#39;expliquer le code réellement exécuté.',
								},
								id: '7086314c9fc903c8-8',
								type: 'paragraph',
							},
							{
								data: {
									level: 3,
									text: 'Suivre un changement jusque dans le produit',
								},
								id: 'de7f9f619fca4986-9',
								type: 'header',
							},
							{
								data: {
									text: 'Prenons un changement révisé à une durée d&#39;animation commune. La valeur source est modifiée en amont, les fichiers générés sont examinés et les vérifications concernées du paquet et de la galerie sont exécutées. La version décrit ce changement. Transit ou yesid.dev peut ensuite choisir cette version exacte, régénérer ses propres fichiers et examiner les endroits où la durée intervient dans son interface.',
								},
								id: 'd7a03371de309e03-10',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un changement de composant pose d&#39;autres questions. La nouvelle structure HTML a-t-elle modifié un sélecteur du produit? Une carte locale conserve-t-elle la surface prévue? Le contenu fermé se comporte-t-il encore correctement? Les libellés traduits tiennent-ils dans l&#39;espace? Le contrat d&#39;adoption demande les tests pertinents du produit, les vérifications de types, une compilation et une comparaison dans le navigateur selon les thèmes, formats et états d&#39;interaction touchés.',
								},
								id: '10a723a2adb1a220-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette démarche ajoute du travail à une livraison. Elle rend aussi la décision traçable : ce qui a changé en amont, le produit qui l&#39;a accepté et ce qui y a été vérifié. Une exécution réussie dans la galerie ne remplace pas ces réponses, car elle utilise les paquets de l&#39;espace de travail et sa propre composition de démonstration.',
								},
								id: 'bd7340051284110e-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le retour en arrière suit le même parcours délibéré. Le produit adopte une version exacte déjà acceptée, ajuste ses dépendances à l&#39;ensemble de paquets de cette version, régénère ses fichiers et répète ses vérifications. Les anciennes versions peuvent contenir moins de paquets. Restaurer les fichiers sans examiner ces dépendances laisserait une partie de la décision de mise à jour en suspens.',
								},
								id: '08b2d36cdf33abea-13',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Changing the foundation deliberately',
					es: 'Actualizar la base de forma deliberada',
					fr: 'Faire évoluer la base de façon délibérée',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'My role includes visual direction, architecture, responsibility boundaries and acceptance decisions. Implementation is AI-assisted. The documented workflow includes reviewing agent output, challenging assumptions and checking claims against source and tests. I remain responsible for what I choose to accept.',
								},
								id: '3ca08ef8159283fb-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The recorded adoption baseline is v0.13.2 for Transit and yesid.dev, dated September 2, 2026. The foundation also has a v0.13.3 release tag, with subsequent hardening work on the main branch separate from that tagged release. The technical discussion here describes the reviewed source and its documented contracts. A version recorded in a product tells us which code it adopted; its deployed pages still need their own verification.',
								},
								id: '5e0c9bf3392b4b23-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The project has made ownership a concrete part of the design. A colour has a source. A component has a responsibility. A product difference has an explicit place to live. A release has an identity, and accepting it requires work in the product that receives it.',
								},
								id: '0ca9c8ca544c8387-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For a prospective client, that is the useful part of this case study: how I approach an interface that needs to keep evolving after its first launch. The visual details matter, and so does leaving the next change understandable. I am continuing to develop that practice through the decisions, checks and tradeoffs this foundation makes visible.',
								},
								id: '98c07974ea702eae-3',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Mi papel abarca la dirección de marca, la arquitectura, los límites entre responsabilidades y las decisiones de aceptación. La implementación tiene apoyo de IA. El modelo de trabajo documentado exige revisar los resultados de los agentes, cuestionar supuestos y contrastar las afirmaciones con el código y las pruebas. Sigo siendo responsable de lo que decido aceptar.',
								},
								id: 'd7dc3a26b01dc429-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El registro documenta la adopción de v0.13.2 por Transit y yesid.dev al 2 de septiembre de 2026. La base también tiene una etiqueta de versión v0.13.3. En la rama principal hay mejoras de robustez posteriores, separadas de esa versión etiquetada. La explicación técnica de esta historia describe el código revisado y sus contratos documentados. Un registro de adopción identifica el código que recibió un producto; sus páginas desplegadas todavía necesitan una verificación propia.',
								},
								id: '14018dd2a59cad61-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El proyecto convirtió la responsabilidad en una parte concreta del diseño. Un color tiene una fuente. Un componente tiene una función. Una diferencia entre productos tiene un lugar explícito. Una versión tiene una identidad, y aceptarla exige trabajo en el producto que la recibe.',
								},
								id: 'd19546e37407dbcd-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para alguien que esté considerando trabajar conmigo, esa es la parte útil de este caso de estudio: cómo abordo una interfaz que debe seguir evolucionando después del primer lanzamiento. Los detalles visuales importan, al igual que dejar comprensible el próximo cambio. Sigo desarrollando esa práctica mediante las decisiones, verificaciones y concesiones que esta base hace visibles.',
								},
								id: '5977111edb3c1197-3',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Mon rôle comprend la direction visuelle, l&#39;architecture, la délimitation des responsabilités et les décisions d&#39;acceptation. La réalisation est assistée par l&#39;IA. Le fonctionnement documenté prévoit de réviser les résultats des agents, de remettre les hypothèses en question et de vérifier les affirmations dans le code et les tests. Je reste responsable de ce que j&#39;accepte.',
								},
								id: 'fbc01659a0470656-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le registre documente l&#39;adoption de v0.13.2 par Transit et yesid.dev au 2 septembre 2026. La base possède aussi un tag de version v0.13.3. Des renforcements ultérieurs sont présents sur la branche principale, séparément de cette version étiquetée. L&#39;explication technique présentée ici porte sur le code examiné et ses contrats documentés. Un relevé d&#39;adoption indique le code reçu par un produit; ses pages en ligne demandent encore leur propre vérification.',
								},
								id: '95bfa8df68834a3a-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le projet a fait de la responsabilité une partie concrète du design. Une couleur a une source. Un composant a un rôle. Une différence entre produits a une place explicite. Une version a une identité, et son acceptation demande du travail dans le produit qui la reçoit.',
								},
								id: 'd3a17d3b5ac1fdc1-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour une personne qui envisage de me confier un projet, c&#39;est l&#39;aspect utile de cette étude de cas : ma façon d&#39;aborder une interface qui doit continuer à évoluer après sa première mise en ligne. Les détails visuels comptent, tout comme la possibilité de comprendre la prochaine modification. Je continue à développer cette pratique à travers les décisions, les vérifications et les compromis que cette base rend visibles.',
								},
								id: '6a8e1639f3541d98-3',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'My role and the project\'s current state',
					es: 'Mi papel y el estado del proyecto',
					fr: 'Mon rôle et l\'état du projet',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									caption: 'Component Gallery reference, desktop dark theme/view. Full-page browser-test image; capture date not recorded. This is a demonstration, not a current production-site capture or an interaction test.',
									file: {
										extension: 'png',
										fileId: '2d257b93-bb5c-451a-9f2e-143291d881ad',
										fileURL: '/files/2d257b93-bb5c-451a-9f2e-143291d881ad',
										height: 6626,
										name: 'portfolio-20261008-design-59b84556362d-gallery-desktop-dark-reference.png',
										size: '592079',
										url: '/assets/2d257b93-bb5c-451a-9f2e-143291d881ad',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '4bbd42404f792699',
								type: 'image',
							},
							{
								data: {
									caption: 'Component Gallery reference, desktop light theme/view. Full-page browser-test image; capture date not recorded. This is a demonstration, not a current production-site capture or an interaction test.',
									file: {
										extension: 'png',
										fileId: '71df00a9-e308-40d9-bbbd-95f2a38849d1',
										fileURL: '/files/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										height: 6626,
										name: 'portfolio-20261008-design-dd5b6091c77f-gallery-desktop-light-reference.png',
										size: '615816',
										url: '/assets/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '37eb6465d2039552',
								type: 'image',
							},
							{
								data: {
									caption: 'Component Gallery reference, mobile dark theme/view. Full-page browser-test image; capture date not recorded. This is a demonstration, not a current production-site capture or an interaction test.',
									file: {
										extension: 'png',
										fileId: '5479c71a-92e8-4b30-90d0-474ad466acf1',
										fileURL: '/files/5479c71a-92e8-4b30-90d0-474ad466acf1',
										height: 10666,
										name: 'portfolio-20261008-design-a645de4fe20c-gallery-mobile-dark-reference.png',
										size: '555550',
										url: '/assets/5479c71a-92e8-4b30-90d0-474ad466acf1',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '21cfca6f015f8f8b',
								type: 'image',
							},
							{
								data: {
									caption: 'Component Gallery reference, mobile light theme/view. Full-page browser-test image; capture date not recorded. This is a demonstration, not a current production-site capture or an interaction test.',
									file: {
										extension: 'png',
										fileId: '66e8ada9-0c29-4036-897a-e5553d33fe47',
										fileURL: '/files/66e8ada9-0c29-4036-897a-e5553d33fe47',
										height: 10666,
										name: 'portfolio-20261008-design-acd8004bbfd8-gallery-mobile-light-reference.png',
										size: '574816',
										url: '/assets/66e8ada9-0c29-4036-897a-e5553d33fe47',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'cd141bca8c8fe785',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									caption: 'Referencia de la galería de componentes, escritorio oscuro. Imagen de página completa de las pruebas del navegador; fecha no registrada. Demostración, no una captura actual de producción ni una prueba de interacción.',
									file: {
										extension: 'png',
										fileId: '2d257b93-bb5c-451a-9f2e-143291d881ad',
										fileURL: '/files/2d257b93-bb5c-451a-9f2e-143291d881ad',
										height: 6626,
										name: 'portfolio-20261008-design-59b84556362d-gallery-desktop-dark-reference.png',
										size: '592079',
										url: '/assets/2d257b93-bb5c-451a-9f2e-143291d881ad',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'b74a2eab5b9accac',
								type: 'image',
							},
							{
								data: {
									caption: 'Referencia de la galería de componentes, escritorio claro. Imagen de página completa de las pruebas del navegador; fecha no registrada. Demostración, no una captura actual de producción ni una prueba de interacción.',
									file: {
										extension: 'png',
										fileId: '71df00a9-e308-40d9-bbbd-95f2a38849d1',
										fileURL: '/files/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										height: 6626,
										name: 'portfolio-20261008-design-dd5b6091c77f-gallery-desktop-light-reference.png',
										size: '615816',
										url: '/assets/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '556b1a3f6d3e7032',
								type: 'image',
							},
							{
								data: {
									caption: 'Referencia de la galería de componentes, móvil oscuro. Imagen de página completa de las pruebas del navegador; fecha no registrada. Demostración, no una captura actual de producción ni una prueba de interacción.',
									file: {
										extension: 'png',
										fileId: '5479c71a-92e8-4b30-90d0-474ad466acf1',
										fileURL: '/files/5479c71a-92e8-4b30-90d0-474ad466acf1',
										height: 10666,
										name: 'portfolio-20261008-design-a645de4fe20c-gallery-mobile-dark-reference.png',
										size: '555550',
										url: '/assets/5479c71a-92e8-4b30-90d0-474ad466acf1',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '9800b365455d0333',
								type: 'image',
							},
							{
								data: {
									caption: 'Referencia de la galería de componentes, móvil claro. Imagen de página completa de las pruebas del navegador; fecha no registrada. Demostración, no una captura actual de producción ni una prueba de interacción.',
									file: {
										extension: 'png',
										fileId: '66e8ada9-0c29-4036-897a-e5553d33fe47',
										fileURL: '/files/66e8ada9-0c29-4036-897a-e5553d33fe47',
										height: 10666,
										name: 'portfolio-20261008-design-acd8004bbfd8-gallery-mobile-light-reference.png',
										size: '574816',
										url: '/assets/66e8ada9-0c29-4036-897a-e5553d33fe47',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '32ebdc72985fb054',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									caption: 'Référence de la galerie de composants, bureau sombre. Image pleine page issue des tests navigateur; date non consignée. Démonstration, pas une capture actuelle d’un site de production ni un test d’interaction.',
									file: {
										extension: 'png',
										fileId: '2d257b93-bb5c-451a-9f2e-143291d881ad',
										fileURL: '/files/2d257b93-bb5c-451a-9f2e-143291d881ad',
										height: 6626,
										name: 'portfolio-20261008-design-59b84556362d-gallery-desktop-dark-reference.png',
										size: '592079',
										url: '/assets/2d257b93-bb5c-451a-9f2e-143291d881ad',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '1450bb5d039b606c',
								type: 'image',
							},
							{
								data: {
									caption: 'Référence de la galerie de composants, bureau claire. Image pleine page issue des tests navigateur; date non consignée. Démonstration, pas une capture actuelle d’un site de production ni un test d’interaction.',
									file: {
										extension: 'png',
										fileId: '71df00a9-e308-40d9-bbbd-95f2a38849d1',
										fileURL: '/files/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										height: 6626,
										name: 'portfolio-20261008-design-dd5b6091c77f-gallery-desktop-light-reference.png',
										size: '615816',
										url: '/assets/71df00a9-e308-40d9-bbbd-95f2a38849d1',
										width: 1440,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'e59857706c72eea5',
								type: 'image',
							},
							{
								data: {
									caption: 'Référence de la galerie de composants, mobile sombre. Image pleine page issue des tests navigateur; date non consignée. Démonstration, pas une capture actuelle d’un site de production ni un test d’interaction.',
									file: {
										extension: 'png',
										fileId: '5479c71a-92e8-4b30-90d0-474ad466acf1',
										fileURL: '/files/5479c71a-92e8-4b30-90d0-474ad466acf1',
										height: 10666,
										name: 'portfolio-20261008-design-a645de4fe20c-gallery-mobile-dark-reference.png',
										size: '555550',
										url: '/assets/5479c71a-92e8-4b30-90d0-474ad466acf1',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '85efb28942d54017',
								type: 'image',
							},
							{
								data: {
									caption: 'Référence de la galerie de composants, mobile claire. Image pleine page issue des tests navigateur; date non consignée. Démonstration, pas une capture actuelle d’un site de production ni un test d’interaction.',
									file: {
										extension: 'png',
										fileId: '66e8ada9-0c29-4036-897a-e5553d33fe47',
										fileURL: '/files/66e8ada9-0c29-4036-897a-e5553d33fe47',
										height: 10666,
										name: 'portfolio-20261008-design-acd8004bbfd8-gallery-mobile-light-reference.png',
										size: '574816',
										url: '/assets/66e8ada9-0c29-4036-897a-e5553d33fe47',
										width: 390,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '54924f2cf200ab65',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Images and context',
					es: 'Imágenes y contexto',
					fr: 'Images et contexte',
				},
			},
		],
		slug: 'yesid-dev-design',
		stack: ['TypeScript'],
		status: 'public',
		tags: ['infrastructure', 'case-study'],
		title: {
			en: 'yesid.dev-design: a shared visual foundation',
			es: 'yesid.dev-design: una base visual compartida',
			fr: 'yesid.dev-design : une base visuelle commune',
		},
	},
	{
		description: {
			en: {
				blocks: [
					{
						data: {
							text: 'How a trilingual portfolio connects SvelteKit, Directus and a reviewed publishing pipeline, with structured content and contact journeys that preserve a draft.',
						},
						id: '63490e7a3339c4ee-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			es: {
				blocks: [
					{
						data: {
							text: 'Cómo un portafolio trilingüe conecta SvelteKit, Directus y una publicación verificada, con contenido estructurado y un formulario que conserva el borrador.',
						},
						id: '0de203e9828cf2cf-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
			fr: {
				blocks: [
					{
						data: {
							text: 'Comment un portfolio trilingue relie SvelteKit, Directus et une publication vérifiée, avec du contenu structuré et un formulaire qui conserve le brouillon.',
						},
						id: '0cb3526b1dd19747-0',
						type: 'paragraph',
					},
				],
				time: 1791442800000,
				version: '2.31.2',
			},
		},
		featured: true,
		image: '42024627-5dab-496e-9d69-18387300802e',
		impactMetric: {
			label: {
				en: 'Website languages',
				es: 'Idiomas del sitio',
				fr: 'Langues du site',
			},
			value: '3',
		},
		impactMetrics: [
			{
				label: {
					en: 'Website languages',
					es: 'Idiomas del sitio',
					fr: 'Langues du site',
				},
				value: '3',
			},
			{
				label: {
					en: 'Website framework',
					es: 'Framework del sitio',
					fr: 'Framework du site',
				},
				value: 'SvelteKit',
			},
			{
				label: {
					en: 'Content editing',
					es: 'Edición del contenido',
					fr: 'Gestion du contenu',
				},
				value: 'Directus',
			},
			{
				label: {
					en: 'CMS database hosting',
					es: 'Alojamiento de la base del CMS',
					fr: 'Hébergement de la base du CMS',
				},
				value: 'Neon',
			},
			{
				label: {
					en: 'Website hosting',
					es: 'Alojamiento del sitio',
					fr: 'Hébergement du site',
				},
				value: 'Vercel',
			},
		],
		liveUrl: 'https://yesid.dev',
		oneLiner: {
			en: 'My professional website in three languages, with an editable content system, project stories, and an interactive guide to how software fits together.',
			es: 'Mi sitio profesional en tres idiomas, con contenido editable, historias de proyectos y una guía interactiva para entender las partes de un software.',
			fr: 'Mon site professionnel en trois langues, avec du contenu modifiable, des récits de projets et un guide interactif pour comprendre les parties d\'un logiciel.',
		},
		relatedServices: ['web-development', 'database-engineering'],
		repoPrivate: true,
		repoUrl: 'https://github.com/mgkdante/yesid.dev',
		sections: [
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'My professional website in English, French, and Spanish, built to explain my work, show the projects behind it, and give people a place to start a conversation.',
								},
								id: '52d9e458bf3a7cd7-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'A site for the questions people actually have',
								},
								id: 'f036673b18062099-1',
								type: 'header',
							},
							{
								data: {
									text: 'Someone looking for help with a website or a reporting problem should not have to arrive with a list of software tools. They may know that information is being entered twice, that a report takes too much work, or that their website no longer reflects what they do. The technical choices come after understanding that situation.',
								},
								id: 'd6920900dd0139bb-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'yesid.dev is where I bring those questions together with my work as a freelance digital solutions developer in Montreal. It contains services, projects, writing, a page that explains the tools, and ways to contact me. Building it also meant deciding how I would keep those explanations current.',
								},
								id: 'a14dde7f3516989a-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is my own professional website. I own the decisions about what it says, how its parts connect, and what I am ready to put my name on.',
								},
								id: 'ef708f7597c16095-4',
								type: 'paragraph',
							},
							{
								data: { level: 2, text: 'Several ways into the work' },
								id: 'ffaf7865ab89bb09-5',
								type: 'header',
							},
							{
								data: {
									text: 'The service pages organize the work into databases and SQL, pipelines and automation, dashboards and analytics, and websites and e-commerce. Each gives someone a starting point. A visitor does not need to know which category their problem belongs to before getting in touch.',
								},
								id: 'ed0d8c93dede88b4-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Projects provide the more concrete view: what was built, which pieces were involved, and what can actually be shown. The blog leaves room for the reasoning behind a decision. Keeping those formats separate helps a project story stay focused, while a longer explanation can take the space it needs.',
								},
								id: '9f1ac6a2ef26781b-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The tools page has a different job. It explains the parts of software in ordinary terms: the interface people use, the logic behind it, the information it remembers, and the place it runs. Its interactive blueprints let visitors start with a type of project and see one possible arrangement of those parts.',
								},
								id: '5424d5f60e574466-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'These are examples to explore. A diagram is a useful opening for a discussion, but a real recommendation still depends on the requirements.',
								},
								id: '2b1ed80646c88a9a-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'What I built, and what it takes to keep it current',
								},
								id: 'd4f6b7e2abbacecb-10',
								type: 'header',
							},
							{
								data: {
									text: 'The central choice was to separate writing from page layout. Project stories, service descriptions, and translations have a place in Directus, the content editor. The SvelteKit website turns that structured material into the pages people read. I can correct an explanation without rebuilding its layout by hand, while the same display rules keep the pages connected.',
								},
								id: 'b9f110a507f80191-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The site works in English, French, and Spanish. That includes practical details such as form labels and error messages, not just three versions of a headline. The contact implementation also registers what a visitor has typed so those values can be carried through a language change. It is a specific feature for that transition, not permanent storage of an unfinished message.',
								},
								id: 'd3f753d9a7647637-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The transit-inspired design gives the site a recognisable language, but the interface still has to do ordinary work. A long explanation needs navigation. An expandable card needs to let someone select text without closing it. A contact form needs to distinguish an empty field, a request in progress, and a failed send. These choices are where the visual idea meets the person using it.',
								},
								id: 'ab8f184d49d613ff-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Publishing has a deliberate step. Saving a correction in the editor does not immediately change the public site: the content must be exported, the new site version built, and that version deployed. This suits the editorial pace of a professional website. It also makes me responsible for knowing which version is being shown when a correction has not appeared.',
								},
								id: '32254a0c149815f8-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'AI tools helped with implementation and review. I directed the architecture and examined the result, including cases where a page looked correct but still used text stored in the wrong place. Owning this project means following those connections, rather than treating the screen alone as proof that the work is complete.',
								},
								id: 'e1411c63425036b7-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That is the project as a whole: a place to explain my work, backed by an editing and publishing process I have to maintain. The sections below examine particular decisions. Each can be read on its own, whether the interest is content, languages, interface behaviour, or operations.',
								},
								id: '0b29b299e481271a-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Mi sitio profesional en español, francés e inglés. Un lugar para explicar mi trabajo, mostrar los proyectos que lo respaldan y empezar una conversación.',
								},
								id: 'd47fe5a94f1bbf10-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Empezar por las preguntas de las personas',
								},
								id: '550cb43d141de8c8-1',
								type: 'header',
							},
							{
								data: {
									text: 'Alguien que busca ayuda con una página web o con sus reportes no tiene por qué llegar con una lista de programas. Puede saber que está registrando la misma información dos veces, que preparar un reporte toma demasiado trabajo o que su sitio ya no representa lo que hace. La elección de herramientas viene después de entender esa situación.',
								},
								id: 'ce15732952114f40-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'yesid.dev reúne esas preguntas y mi trabajo como desarrollador freelance de soluciones digitales en Montreal. Incluye servicios, proyectos, artículos, una página para entender las herramientas y varias formas de contactarme. Construirlo también implicó decidir cómo mantener al día esas explicaciones.',
								},
								id: 'b673d7d1b302830f-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Es mi propio sitio profesional. Soy responsable de las decisiones sobre lo que dice, cómo se conectan sus partes y qué estoy dispuesto a publicar con mi nombre.',
								},
								id: '65ab241401e2aaeb-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Distintas formas de acercarse al trabajo',
								},
								id: 'e0e6df2457588481-5',
								type: 'header',
							},
							{
								data: {
									text: 'Los servicios están organizados en bases de datos y SQL, pipelines y automatización, tableros y analítica, y sitios web y comercio electrónico. Cada grupo ofrece un punto de partida. No hace falta saber en cuál encaja un problema antes de escribirme.',
								},
								id: 'e0f1001b0f6233ad-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los proyectos muestran algo más concreto: qué se construyó, qué partes se usaron y qué se puede enseñar. El blog permite detenerse en el razonamiento detrás de una decisión. Separar esos formatos ayuda a que la historia de un proyecto mantenga un hilo claro y a que un artículo tenga espacio para profundizar.',
								},
								id: 'bf6adfba730d6361-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La página de herramientas cumple otra función. Explica las partes de un programa en términos cotidianos: la interfaz que usamos, la lógica que hay detrás, la información que conserva y la infraestructura donde funciona. Sus diagramas interactivos permiten escoger un tipo de proyecto y ver una posible combinación de esas partes.',
								},
								id: '29087936797d6814-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Son ejemplos para explorar. Un diagrama sirve para abrir la conversación, pero una recomendación concreta sigue dependiendo de los requisitos.',
								},
								id: '93e92b355e3df7aa-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Qué construí y qué se necesita para mantenerlo al día',
								},
								id: 'c45c2c1f90b07fb6-10',
								type: 'header',
							},
							{
								data: {
									text: 'La decisión central fue separar la escritura de la distribución de las páginas. Las historias de proyectos, las descripciones de servicios y las traducciones tienen su lugar en Directus, el editor de contenido. La web en SvelteKit convierte ese material estructurado en las páginas que la gente consulta. Puedo corregir una explicación sin rehacer su presentación a mano, mientras las mismas reglas visuales conectan las páginas.',
								},
								id: '258302ecc1d1d654-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El sitio funciona en español, francés e inglés. Eso incluye detalles prácticos como las etiquetas y los errores del formulario, no solo tres versiones de un título. El formulario también registra lo que alguien escribió para poder trasladar esos valores durante un cambio de idioma. Es una función prevista para esa transición, no un almacenamiento permanente de mensajes sin terminar.',
								},
								id: 'a4d59b91ceeae453-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El diseño inspirado en el transporte público le da al sitio un lenguaje reconocible, pero la interfaz sigue teniendo tareas comunes. Un texto largo necesita navegación. Una tarjeta desplegable debe permitir seleccionar una frase sin cerrarse. Un formulario debe distinguir un campo vacío, una solicitud en curso y un envío fallido. Ahí la idea visual se encuentra con la persona que usa el sitio.',
								},
								id: '8167aaf96dcbfebc-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Publicar tiene un paso deliberado. Guardar una corrección en el editor no cambia inmediatamente la web pública: hay que exportar el contenido, construir una nueva versión y ponerla en línea. Esto corresponde al ritmo editorial de un sitio profesional. También me hace responsable de saber qué versión se está mostrando cuando una corrección todavía no aparece.',
								},
								id: '089518f17594fa0c-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las herramientas de IA ayudaron en la implementación y la revisión. Yo dirigía la arquitectura y examinaba los resultados, incluso cuando una página se veía bien pero usaba texto guardado en el lugar equivocado. Hacerse cargo de este proyecto exige seguir esas conexiones, en vez de tomar la pantalla como única prueba de que el trabajo está terminado.',
								},
								id: '68f27159ac0f9ece-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ese es el proyecto completo: un lugar para explicar mi trabajo, respaldado por un proceso de edición y publicación que debo mantener. Las siguientes secciones examinan decisiones específicas. Cada una se puede leer por separado, según el interés en contenido, idiomas, comportamiento de la interfaz u operaciones.',
								},
								id: 'f7461792b53196fe-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Mon site professionnel en français, en anglais et en espagnol. Un endroit pour présenter mon travail, montrer les projets qui l&#39;appuient et ouvrir la conversation.',
								},
								id: '9568aca6e0f290c0-0',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Partir des questions que les gens se posent',
								},
								id: 'adfd35e2ad3152df-1',
								type: 'header',
							},
							{
								data: {
									text: 'Une personne qui cherche de l&#39;aide avec son site web ou ses rapports n&#39;arrive pas nécessairement avec une liste de logiciels. Elle sait peut-être qu&#39;elle entre la même information deux fois, qu&#39;un rapport demande trop de manipulations ou que son site ne représente plus son activité. Le choix des outils vient après la compréhension du problème.',
								},
								id: '922268521fb39bb7-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'yesid.dev réunit ces questions et mon travail de développeur de solutions numériques à la pige, à Montréal. On y trouve mes services, mes projets, des articles, une page pour comprendre les outils et plusieurs façons de me joindre. Construire le site m&#39;a aussi amené à décider comment garder ces explications à jour.',
								},
								id: 'b112dc9fd923b675-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'C&#39;est mon propre site professionnel. Je suis responsable des décisions sur ce qu&#39;il raconte, sur la façon dont ses parties se relient et sur ce que je suis prêt à signer.',
								},
								id: 'c80f70304486e699-4',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Plusieurs façons de découvrir le travail',
								},
								id: '46046acd6d9f2d1c-5',
								type: 'header',
							},
							{
								data: {
									text: 'Les services sont regroupés autour des bases de données et de SQL, des pipelines et de l&#39;automatisation, des tableaux de bord et de l&#39;analytique, puis des sites web et du commerce électronique. Chaque groupe offre un point de départ. Il n&#39;est pas nécessaire de savoir où classer son problème avant de m&#39;écrire.',
								},
								id: '59c3142cf28dc7d9-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les projets donnent une vue plus concrète : ce qui a été construit, les éléments utilisés et ce qu&#39;on peut réellement montrer. Le blogue permet d&#39;expliquer plus longuement le raisonnement derrière une décision. Cette distinction laisse au récit d&#39;un projet son fil conducteur et à un article l&#39;espace nécessaire pour approfondir une question.',
								},
								id: 'bab50ff5e0bd461e-7',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La page consacrée aux outils joue un autre rôle. Elle présente les parties d&#39;un logiciel dans des mots courants : l&#39;interface qu&#39;on utilise, la logique derrière, les renseignements qu&#39;il garde et l&#39;infrastructure qui le fait fonctionner. Ses plans interactifs permettent de choisir un type de projet et de voir une façon possible d&#39;assembler ces éléments.',
								},
								id: 'aedf97bb72109574-8',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce sont des exemples à explorer. Un schéma aide à lancer la discussion, mais une recommandation dépend toujours des besoins réels.',
								},
								id: '49e1544b2434ea05-9',
								type: 'paragraph',
							},
							{
								data: {
									level: 2,
									text: 'Ce que j&#39;ai construit et ce qu&#39;il faut pour le garder à jour',
								},
								id: '9819d4abb055f0b7-10',
								type: 'header',
							},
							{
								data: {
									text: 'Le choix central consiste à séparer la rédaction de la mise en page. Les récits de projets, descriptions de services et traductions ont leur place dans Directus, l&#39;outil d&#39;édition. Le site SvelteKit transforme ce contenu structuré en pages à consulter. Je peux corriger une explication sans refaire sa disposition à la main, pendant que les mêmes règles d&#39;affichage relient les pages entre elles.',
								},
								id: '6c02dbdf4cb65e01-11',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le site fonctionne en français, en anglais et en espagnol. Cela comprend des détails pratiques comme les libellés et les erreurs du formulaire, pas seulement trois versions d&#39;un titre. Le formulaire inscrit aussi les valeurs saisies afin de pouvoir les transporter lors d&#39;un changement de langue. C&#39;est une fonction prévue pour cette transition, pas un stockage permanent des messages inachevés.',
								},
								id: 'd5b7e8972be35b46-12',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le design inspiré du transport collectif donne au site un langage reconnaissable, mais l&#39;interface conserve des tâches ordinaires. Un long texte a besoin de navigation. Une carte dépliable doit permettre de sélectionner une phrase sans se fermer. Un formulaire doit distinguer un champ vide, une requête en cours et un envoi échoué. C&#39;est là que l&#39;idée visuelle rencontre la personne qui utilise le site.',
								},
								id: 'eb68b9b9b172ac80-13',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La publication comprend une étape volontaire. Enregistrer une correction dans l&#39;éditeur ne change pas immédiatement le site public : il faut exporter le contenu, générer une nouvelle version et la mettre en ligne. Ce rythme convient à un site professionnel dont le contenu évolue de façon éditoriale. Il me rend aussi responsable de savoir quelle version est affichée lorsqu&#39;une correction n&#39;apparaît pas.',
								},
								id: '220505dfafaa358b-14',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Des outils d&#39;IA ont aidé à l&#39;implémentation et à la révision. Je dirigeais l&#39;architecture et j&#39;examinais les résultats, y compris lorsqu&#39;une page semblait correcte tout en utilisant du texte conservé au mauvais endroit. Assumer ce projet demande de suivre ces liens, plutôt que de considérer l&#39;écran seul comme preuve que le travail est terminé.',
								},
								id: 'eae86f3e4cc4fb30-15',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Voilà le projet dans son ensemble : un endroit pour expliquer mon travail, soutenu par un processus d&#39;édition et de publication que je dois entretenir. Les sections suivantes examinent des décisions précises. Chacune peut se lire seule, selon qu&#39;on s&#39;intéresse au contenu, aux langues, à l&#39;interface ou aux opérations.',
								},
								id: 'c8c81bc375313fe3-16',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'yesid.dev: explaining how the pieces fit',
					es: 'yesid.dev: explicar cómo se conectan las partes',
					fr: 'yesid.dev : expliquer comment les morceaux s\'assemblent',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The site looks like one product, but the work is divided into four domains: the public website, the editing system, the code that moves and checks content, and the shared design resources. Knowing which domain owns a change helps me avoid fixing a problem in the wrong place.',
								},
								id: '688de5cae733cfcd-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The web application, built with SvelteKit, owns the visitor&#39;s experience. It lays out a project, resolves its language, renders its content, connects navigation, and manages interactions such as opening a section. Directus is the editing system, backed by a PostgreSQL database on Neon and run on Railway. It holds structured records for projects, services, articles, translations, and shared content.',
								},
								id: 'eaf2670f00d4c750-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Between them is tooling written for the project. Fetchers read CMS records, transformations turn those records into the shapes the website expects, validators check them, and exporters generate the content modules used by the site. These steps have different jobs. A database relationship that is convenient for editing does not need to become a complicated object every page has to interpret.',
								},
								id: '1a9276ce1426f5e1-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A shared package holds the content types, runtime schemas, and pure helpers used on both sides. For example, the CMS exporter and the web application can agree on what a project section contains without maintaining separate interpretations of that structure.',
								},
								id: '5448259068c9c0e0-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The fourth domain comes from yesid.dev-design. The website consumes versioned, locally vendored design packages for interface primitives, tokens, motion, language routing, analytics, and search metadata. This site applies those resources to its own content and layouts. It is not the whole design system, and a product-specific page does not automatically belong in that shared system.',
								},
								id: 'f13a09a3098b2396-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Consider three small changes. Correcting a service description belongs in the CMS. Changing the behaviour of a project card belongs in the web application. Changing a shared motion rule belongs in the design resources and then needs adoption by the consumer. Keeping those routes separate makes the origin of a change easier to follow.',
								},
								id: '391f7b7f4d81b274-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El sitio se presenta como un solo producto, pero el trabajo está dividido en cuatro áreas: la web pública, el sistema de edición, el código que mueve y revisa el contenido, y los recursos de diseño compartidos. Saber a cuál le corresponde un cambio me ayuda a no corregir un problema en el lugar equivocado.',
								},
								id: '5ea2cbf4f0abe536-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La aplicación web, construida con SvelteKit, se encarga de la experiencia del visitante. Organiza la página de un proyecto, elige el idioma, presenta el contenido, conecta la navegación y maneja interacciones como abrir una sección. Directus es el sistema de edición, conectado a una base de datos PostgreSQL en Neon y alojado en Railway. Allí se organizan proyectos, servicios, artículos, traducciones y contenido compartido.',
								},
								id: '9c967be2974f4565-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Entre ambos hay herramientas escritas para este proyecto. Unas funciones leen los registros del CMS; otras los transforman a la estructura que espera el sitio. Los validadores revisan los datos y el exportador genera los módulos de contenido que usará la aplicación. Una relación útil para editar no tiene que convertirse en un objeto complejo que cada página deba interpretar.',
								},
								id: '09c8d9c427e5fb6a-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un paquete compartido contiene los tipos de datos, los esquemas de validación y las funciones de transformación que usan ambos lados. Por ejemplo, el exportador y la web pueden coincidir en lo que contiene una sección de proyecto sin mantener dos interpretaciones distintas de esa estructura.',
								},
								id: '0c97967f7c2ee168-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La cuarta área viene de yesid.dev-design. El sitio consume copias versionadas de paquetes de diseño para componentes básicos, valores visuales, movimiento, rutas por idioma, analítica y metadatos para buscadores. Este proyecto aplica esos recursos a sus propios contenidos y pantallas. No es, por sí solo, todo el sistema de diseño.',
								},
								id: '05f4c858d9792a72-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Tres cambios pequeños ayudan a verlo. Corregir la descripción de un servicio corresponde al CMS. Cambiar el comportamiento de una tarjeta corresponde a la aplicación web. Modificar una regla de movimiento compartida corresponde a los recursos de diseño y después requiere adoptar esa versión en el sitio. Mantener esas rutas separadas permite seguir el origen de cada cambio.',
								},
								id: '3c2e0df713e7ee40-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le site se présente comme un seul produit, mais le travail se répartit entre quatre domaines : le site public, l&#39;outil d&#39;édition, le code qui transporte et vérifie le contenu, puis les ressources de design partagées. Savoir quel domaine est responsable d&#39;un changement m&#39;aide à éviter une correction au mauvais endroit.',
								},
								id: '61d1bd9b8fb83302-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;application web, construite avec SvelteKit, prend en charge l&#39;expérience du visiteur. Elle organise la page d&#39;un projet, choisit la version linguistique, affiche le contenu, relie les éléments de navigation et gère les interactions, comme l&#39;ouverture d&#39;une section. Directus sert d&#39;outil d&#39;édition. Il est relié à une base de données PostgreSQL sur Neon et fonctionne sur Railway. On y trouve les projets, les services, les articles, les traductions et les contenus partagés.',
								},
								id: 'e7587eb108eacb49-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Entre les deux, il y a des outils écrits pour ce projet. Des fonctions lisent les enregistrements du CMS. Des transformations leur donnent la forme attendue par le site. Des validations vérifient les données, puis l&#39;export produit les modules de contenu utilisés par l&#39;application. Une relation utile dans l&#39;outil d&#39;édition n&#39;a pas besoin de devenir un objet compliqué que chaque page doit interpréter.',
								},
								id: '3b050d424a4f8992-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un paquet partagé contient les types, les schémas de validation et les fonctions de traitement communes aux deux côtés. L&#39;exporteur et l&#39;application peuvent ainsi s&#39;entendre sur le contenu d&#39;une section de projet sans maintenir deux interprétations séparées de sa structure.',
								},
								id: '1ebd503cbf843d8b-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le quatrième domaine vient de yesid.dev-design. Le site consomme des copies versionnées de paquets de design pour les composants de base, les valeurs visuelles, le mouvement, le routage linguistique, l&#39;analytique et les métadonnées de recherche. Ce projet applique ces ressources à ses propres contenus et mises en page. Il ne constitue pas à lui seul tout le système de design.',
								},
								id: 'd93155a2ac03d477-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Trois petits changements illustrent la distinction. Corriger la description d&#39;un service se fait dans le CMS. Modifier le comportement d&#39;une carte de projet se fait dans l&#39;application web. Changer une règle de mouvement partagée se fait dans les ressources de design, puis cette version doit être adoptée par le site. Ces chemins distincts permettent de suivre l&#39;origine d&#39;une modification.',
								},
								id: '54fd861fc6e7db2e-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Four domains, with different responsibilities',
					es: 'Cuatro áreas con responsabilidades diferentes',
					fr: 'Quatre domaines, avec des responsabilités différentes',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The description of a service changes. A project needs a more precise explanation. A translation needs correcting. I wanted those changes to have a home in an editing system while preserving a consistent page layout.',
								},
								id: '40f42ff055b46dcc-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A project has an identity, a title, a short line, an introduction, ordered sections, related services, technologies, tags, links, and presentation status. In Directus, some of these are related records. The export transforms them into a simpler object for the website. Section order comes from the stored sort values; links to technologies and tags are resolved through their relationships.',
								},
								id: '7780c6e116a35d56-1',
								type: 'paragraph',
							},
							{
								data: { text: 'The shared section schema is small:' },
								id: '042291c9ca1e363d-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const ProjectSectionSchema = z.object({\n\ttitle: LocalizedStringSchema,\n\tcontent: LocalizedBlockEditorDocSchema,\n});\n```',
								},
								id: 'e09df07e4860c2f5-3',
								type: 'code',
							},
							{
								data: {
									text: 'It says that a section contains a translated title and a translated rich-content document. It does not specify an orange border, a two-column layout, or an animation. Those decisions belong to the interface.',
								},
								id: '1ff9ecb2ab7f9164-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is useful when the same project needs a short introduction for a visitor browsing the portfolio and a detailed explanation for someone evaluating the work. The one-line field serves the card. The introduction establishes the problem. The ordered sections can explain a data model, an interface decision, or an operating constraint without putting all of that on the card.',
								},
								id: '9a1e9a94aaaefa49-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The model also separates the project&#39;s presentation status from repository visibility. A record mapped to a public project page does not change permissions on its source repository. A private-repository label and a live-site link are distinct pieces of information.',
								},
								id: 'be96a024d1a50161-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For a concrete editing example, imagine correcting one sentence in a project&#39;s French introduction. The intended change is in that French content document. Its project identity, Spanish version, related services, and page component do not need to change just because the sentence did. That is the practical value of the structure: a small editorial change has a specific place to live.',
								},
								id: 'da7baf8bbe53a73d-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La descripción de un servicio cambia. Un proyecto necesita una explicación más precisa. Una traducción requiere una corrección. Quería que esos cambios tuvieran un lugar en el editor sin perder una presentación consistente.',
								},
								id: '7e17486abc922d47-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un proyecto tiene una identidad, un título, una frase corta, una introducción, secciones ordenadas, servicios relacionados, tecnologías, etiquetas, enlaces y un estado de presentación. En Directus, varios de esos elementos son registros relacionados. La exportación los convierte en un objeto más sencillo para la web. El orden de las secciones viene de los valores de orden guardados; las tecnologías y etiquetas se resuelven a partir de sus relaciones.',
								},
								id: 'd37333c83029a83f-1',
								type: 'paragraph',
							},
							{
								data: { text: 'El esquema compartido de una sección es corto:' },
								id: 'f2532324ac2a2b36-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const ProjectSectionSchema = z.object({\n\ttitle: LocalizedStringSchema,\n\tcontent: LocalizedBlockEditorDocSchema,\n});\n```',
								},
								id: 'e09df07e4860c2f5-3',
								type: 'code',
							},
							{
								data: {
									text: 'Indica que una sección contiene un título traducido y un documento de contenido enriquecido traducido. No exige un borde naranja, una distribución en dos columnas ni una animación. Esas decisiones corresponden a la interfaz.',
								},
								id: 'b24ffff3cafffb7a-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La separación sirve cuando un proyecto necesita una presentación breve para quien recorre el portafolio y una explicación detallada para quien evalúa el trabajo. La frase corta va en la tarjeta. La introducción plantea el problema. Las secciones pueden explicar un modelo de datos, una decisión de interfaz o una condición de operación sin hacer que todo eso quepa en la tarjeta.',
								},
								id: '5919ede380fb3e5c-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El modelo también distingue el estado de presentación del proyecto de la visibilidad del repositorio. Un registro que se muestra como proyecto público no cambia los permisos de su código fuente. La indicación de repositorio privado y el enlace a un sitio disponible son datos distintos.',
								},
								id: '6c7d6d491a6a8c61-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Imaginemos una corrección concreta: cambiar una frase en la introducción francesa de un proyecto. El cambio esperado está en ese documento en francés. La identidad del proyecto, su versión en español, los servicios asociados y el componente de la página no necesitan cambiar por esa sola frase. Ese es el valor práctico de la estructura: una modificación editorial pequeña tiene un lugar preciso.',
								},
								id: '7e1664a590183a39-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La description d&#39;un service change. Un projet mérite une explication plus précise. Une traduction doit être corrigée. Je voulais que ces modifications aient leur place dans un outil d&#39;édition, tout en gardant une présentation cohérente.',
								},
								id: '4ddd6271c738ccc7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un projet possède une identité, un titre, une courte phrase, une introduction, des sections ordonnées, des services associés, des technologies, des mots-clés, des liens et un état de présentation. Dans Directus, plusieurs de ces éléments sont des enregistrements liés. L&#39;export les transforme en un objet plus simple pour le site. L&#39;ordre des sections vient des valeurs de tri enregistrées; les technologies et les mots-clés sont résolus à partir de leurs relations.',
								},
								id: '03de4ea4986e3678-1',
								type: 'paragraph',
							},
							{
								data: { text: 'Le schéma partagé d&#39;une section est court :' },
								id: '7850cf5f47156436-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport const ProjectSectionSchema = z.object({\n\ttitle: LocalizedStringSchema,\n\tcontent: LocalizedBlockEditorDocSchema,\n});\n```',
								},
								id: 'e09df07e4860c2f5-3',
								type: 'code',
							},
							{
								data: {
									text: 'Il indique qu&#39;une section contient un titre traduit et un document de contenu riche traduit. Il ne demande ni bordure orange, ni disposition sur deux colonnes, ni animation. Ces choix appartiennent à l&#39;interface.',
								},
								id: 'd4a83025d161e377-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette séparation est utile quand un projet doit offrir une courte présentation à la personne qui parcourt le portfolio, puis des explications plus poussées à celle qui évalue le travail. La phrase courte sert à la carte. L&#39;introduction situe le problème. Les sections ordonnées peuvent détailler un modèle de données, un choix d&#39;interface ou une contrainte d&#39;exploitation sans tout faire entrer dans la carte.',
								},
								id: 'a1fff0f89114be85-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le modèle distingue aussi l&#39;état de présentation du projet de la visibilité du dépôt. Un enregistrement associé à une page publique ne change pas les permissions de son code source. L&#39;indication d&#39;un dépôt privé et le lien vers un site accessible sont deux renseignements différents.',
								},
								id: 'ee4316bfae6e9608-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Prenons une correction concrète : une phrase de l&#39;introduction française d&#39;un projet doit être modifiée. Le changement attendu se trouve dans ce document français. L&#39;identité du projet, sa version espagnole, les services associés et le composant de page n&#39;ont pas à changer pour cette seule phrase. C&#39;est l&#39;intérêt pratique de la structure : une petite modification éditoriale a un emplacement précis.',
								},
								id: '158aaa1d70a828b2-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'A project is structured content, not one long text field',
					es: 'Un proyecto estructurado, no un solo campo de texto',
					fr: 'Un projet structuré plutôt qu\'un seul long champ de texte',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The body of a section uses BlockEditorDoc, the JSON document produced by the CMS block editor. It contains a timestamp, a version, and an ordered blocks array. Each block has an identity, a type, and data appropriate to that type.',
								},
								id: 'aea41f8380fe958d-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The supported types cover headings, paragraphs, nested lists, code, quotations, images, and separators. A paragraph carries text. A code block carries plain code text. An image carries a file reference and a caption. The renderer walks the array and sends each type to the corresponding component.',
								},
								id: '07d74704fb405460-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This makes a worked explanation possible without treating everything as a paragraph. A section can begin with a question, show a short source excerpt, explain it in ordinary language, and finish with an image. The order is part of the content. The rendering rules are shared.',
								},
								id: '31fb72c9a802db90-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Expandable cards are a separate layer. They wrap a project&#39;s section; they are not an invented “collapsible” block inside the document. The project page resolves the section&#39;s title and body for the chosen language, then places that document inside CollapsibleSection. The card supplies the trigger and open state. BlockRenderer supplies the content.',
								},
								id: '16fba2946a4ad1e5-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That distinction matters to readers. Someone can follow the problem and result without reading every implementation detail. Someone interested in the publishing pipeline can open a complete explanation of that pipeline. Each section needs enough context to make sense on its own, rather than requiring the reader to reconstruct an argument from scattered fragments.',
								},
								id: 'ea38d9aae8e62ce5-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The page also distinguishes image-gallery sections from article sections and builds navigation around them. On a wide screen, the section navigation, article, and project summary can sit beside one another. At a narrow width, the reading order is stacked and a compact navigation control helps move between sections.',
								},
								id: 'a7faf6c5c7bd294f-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Content helpers extract text and headings from the same documents. They can calculate a reading estimate using the rule ceil(words / 200), with a minimum of one minute. For illustration, 1,200 words gives six minutes; 1,201 rounds up to seven. That is a planning estimate from text length, not a measurement of how quickly a person understands code or a diagram.',
								},
								id: '6838a9a8f901ef15-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The model has limits worth respecting. A new kind of content needs a defined shape and a renderer; it does not appear just because an editor pastes unfamiliar markup. The current model has no video block. Image captions and alternative text also need more separation than the current contract gives them.',
								},
								id: '50f418f46436f322-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El cuerpo de una sección usa BlockEditorDoc, el documento JSON que produce el editor de bloques del CMS. Contiene una marca de tiempo, una versión y una lista ordenada llamada blocks. Cada bloque tiene una identidad, un tipo y los datos correspondientes a ese tipo.',
								},
								id: '9ff59a2daa5b4111-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los tipos admitidos incluyen títulos, párrafos, listas anidadas, código, citas, imágenes y separadores. Un párrafo contiene texto. Un bloque de código guarda código como texto plano. Una imagen lleva una referencia al archivo y un pie de imagen. El sistema recorre la lista y entrega cada tipo al componente que lo presenta.',
								},
								id: '5b8f78f6dc1cbfb0-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Así una explicación puede tomar varias formas sin convertirlo todo en párrafos. Una sección puede comenzar con una pregunta, mostrar un fragmento corto del programa, explicarlo con palabras comunes y cerrar con una imagen. El orden pertenece al contenido; las reglas de presentación se comparten.',
								},
								id: '51fce0f2a1a28f6f-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las tarjetas desplegables son otra capa. Rodean la sección del proyecto; no son un bloque “collapsible” inventado dentro del documento. La página elige el título y el contenido en el idioma correspondiente y luego coloca el documento en CollapsibleSection. La tarjeta aporta el control para abrir y cerrar. BlockRenderer presenta lo que hay dentro.',
								},
								id: '9c23ebf1326fb322-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La diferencia tiene valor para quien lee. Una persona puede entender el problema y la solución sin recorrer cada detalle técnico. Otra puede abrir una explicación completa del proceso de publicación. Por eso cada sección necesita contexto suficiente para entenderse sola, sin obligar a reconstruir un argumento con fragmentos dispersos.',
								},
								id: 'cdd8b0538cc3d79b-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La página también separa las secciones de galería de las secciones del artículo y organiza la navegación alrededor de ellas. En una pantalla ancha, el índice, el texto y el resumen del proyecto pueden verse uno al lado del otro. En una pantalla estrecha, se apilan en orden de lectura y un control compacto permite pasar entre secciones.',
								},
								id: '12a3163ce8bb65bf-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Otras funciones extraen texto y títulos de esos mismos documentos. La estimación de lectura usa la regla ceil(words / 200), con un mínimo de un minuto. Como ejemplo, 1.200 palabras dan seis minutos; 1.201 se redondean a siete. Es una referencia calculada a partir de la longitud, no una medición de cuánto tarda alguien en entender código o un diagrama.',
								},
								id: '438e6cb1777e1439-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El modelo tiene límites. Un tipo nuevo de contenido necesita una estructura definida y un componente que lo muestre. No aparece solo por pegar un formato desconocido en el editor. El modelo actual no tiene un bloque de video. Los pies de imagen y los textos alternativos también necesitan una separación más clara en el contrato de contenido.',
								},
								id: '0d22c74e35f5bd11-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le corps d&#39;une section utilise BlockEditorDoc, le document JSON produit par l&#39;éditeur de blocs du CMS. Il contient une date technique, une version et un tableau ordonné nommé blocks. Chaque bloc a une identité, un type et les données correspondant à ce type.',
								},
								id: 'a41ec0f87c551234-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les types pris en charge couvrent les titres, les paragraphes, les listes imbriquées, le code, les citations, les images et les séparateurs. Un paragraphe contient du texte. Un bloc de code contient du code en texte brut. Une image contient une référence de fichier et une légende. Le moteur d&#39;affichage parcourt le tableau et confie chaque type au composant correspondant.',
								},
								id: '9fcb861a1e4218e2-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une explication peut donc prendre plusieurs formes sans tout traiter comme un paragraphe. Une section peut partir d&#39;une question, montrer un court extrait du programme, l&#39;expliquer dans des mots courants et se terminer par une image. L&#39;ordre fait partie du contenu; les règles d&#39;affichage sont partagées.',
								},
								id: '2c64cf3d67827dfe-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les cartes dépliables se trouvent à un autre niveau. Elles entourent la section du projet. Ce ne sont pas des blocs « collapsible » inventés à l&#39;intérieur du document. La page choisit le titre et le corps dans la bonne langue, puis place le document dans CollapsibleSection. La carte fournit le bouton et l&#39;état ouvert ou fermé. BlockRenderer affiche le contenu.',
								},
								id: 'e8128bf352d3106b-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La distinction sert la lecture. Une personne peut suivre le problème et la solution sans lire chaque détail d&#39;implémentation. Une autre peut ouvrir une explication complète du chemin de publication. Chaque section doit donc se comprendre par elle-même, sans obliger le lecteur à reconstruire un raisonnement à partir de fragments dispersés.',
								},
								id: 'be2ee11617388957-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La page distingue également les sections de galerie des sections d&#39;article et construit sa navigation autour d&#39;elles. Sur un écran large, la navigation, le texte et le résumé du projet peuvent se côtoyer. Sur un écran étroit, ils se suivent dans l&#39;ordre de lecture, avec une commande de navigation compacte pour passer d&#39;une section à l&#39;autre.',
								},
								id: '6a04faa27a4cf7ad-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Des fonctions extraient aussi le texte et les titres de ces documents. L&#39;estimation du temps de lecture suit la règle ceil(words / 200), avec un minimum d&#39;une minute. À titre d&#39;exemple, 1 200 mots donnent six minutes; 1 201 sont arrondis à sept. C&#39;est un repère calculé à partir de la longueur, pas une mesure du temps nécessaire pour comprendre du code ou un diagramme.',
								},
								id: '4731a31387ec2a04-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le modèle impose certaines limites. Un nouveau type de contenu a besoin d&#39;une structure définie et d&#39;un composant d&#39;affichage. Il n&#39;apparaît pas simplement parce qu&#39;on colle un format inconnu dans l&#39;éditeur. Le modèle actuel n&#39;a pas de bloc vidéo. Les légendes d&#39;images et les textes alternatifs méritent aussi d&#39;être mieux séparés dans le contrat de contenu.',
								},
								id: '56b1d270026692b5-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Rich blocks inside expandable sections',
					es: 'Bloques de contenido dentro de secciones desplegables',
					fr: 'Des blocs de contenu dans des sections dépliables',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'A saved edit is not yet a new public page. For the normal live-content publishing path, the CMS data must be read, transformed, checked, written into generated content modules, built into the website, and deployed.',
								},
								id: 'f4712fab0c0e5de5-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The web package runs the content export as a prebuild step. The exporter gathers the full set of required content, including projects, services, articles, navigation, and page content. Different fetchers understand their own collection&#39;s relationships. They produce objects that the website can consume without asking Directus to reconstruct those relationships on every page visit.',
								},
								id: 'bb5f86852c7daeb1-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The project fetcher, for example, converts section translations into language maps and sorts repeated content. It then parses the resulting project array through the shared schema. A field being present in the database is not enough if its exported shape is incompatible with the application.',
								},
								id: 'dae2623542dcedbe-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Before deriving output files, the export registry checks that the complete required dataset is present. It also prepares the media variants used by the export. The output is a set of TypeScript modules and a manifest recording file hashes and whether the data came from a live read or a cache.',
								},
								id: '9b8bff493ac9f7ed-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The website build consumes those modules. SvelteKit prepares the routes that can be prerendered, and Vercel serves the resulting deployment. Some server and interactive work still exists. Preparing the site&#39;s text ahead of time does not eliminate image requests, contact submissions, or every external connection.',
								},
								id: '82808f6ac782d2d7-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Here is a useful publishing example. I correct a French project paragraph and save it in Directus. The editor now shows the correction, but the current public deployment still contains its previous exported version. A successful export and build prepare the new version. Deploying that version makes it available to visitors. Looking only at the editor, or only at a successful file-generation step, would answer the wrong question about publication.',
								},
								id: '0bb46735fd8b59ef-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This arrangement fits a site whose project stories and service descriptions change at an editorial pace. It accepts a publishing step in exchange for serving prepared content. It would need reconsideration for information that must appear instantly after every write, such as a live operational feed. The site&#39;s choice is tied to its content, not a rule I would apply to every project.',
								},
								id: 'a5012e1fb2802978-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Guardar un cambio todavía no produce una página pública nueva. En el recorrido normal de publicación con contenido reciente del CMS, hay que leer los datos, transformarlos, validarlos, generar los módulos de contenido, construir el sitio y desplegar esa nueva versión.',
								},
								id: 'fbf44f2a9b6eb23d-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El paquete web ejecuta la exportación antes de construir el sitio. El exportador reúne el conjunto completo de datos requeridos, entre ellos proyectos, servicios, artículos, navegación y contenido de las páginas. Cada función conoce las relaciones de su colección. Produce objetos que la web puede usar sin pedirle a Directus que reconstruya esas relaciones en cada visita.',
								},
								id: '8926f0a946245047-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Por ejemplo, la función de proyectos convierte las traducciones de las secciones en conjuntos de valores por idioma y ordena el contenido repetido. Después valida la lista de proyectos con el esquema compartido. Que un campo exista en la base no basta si su forma exportada es incompatible con la aplicación.',
								},
								id: '5bba1fe9b126e89f-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Antes de preparar los archivos de salida, el registro de exportación comprueba que estén todos los datos requeridos. El proceso también prepara las variantes de medios que necesita. El resultado es un conjunto de módulos TypeScript y un manifiesto que registra las huellas de los archivos y el origen de los datos: una lectura del CMS o una copia en caché.',
								},
								id: '7e18354c2a2f7273-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La construcción del sitio usa esos módulos. SvelteKit prepara las rutas que se pueden generar de antemano y Vercel sirve el despliegue. También quedan funciones de servidor e interacciones. Preparar el texto no elimina las solicitudes de imágenes, los envíos de contacto ni todas las conexiones externas.',
								},
								id: '0a3ee273899ab622-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un ejemplo permite seguir el recorrido. Corrijo un párrafo francés en Directus y lo guardo. El editor muestra la corrección, pero la versión pública todavía contiene el contenido exportado antes. Una exportación y una construcción exitosas preparan la nueva versión. Poner esa versión en línea la hace disponible para los visitantes. Mirar solo el editor, o solo la generación de archivos, no confirmaría la publicación.',
								},
								id: '234f443a6f7cadeb-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esta organización corresponde a un sitio cuyas historias de proyectos y descripciones de servicios cambian a un ritmo editorial. Acepta un paso de publicación para servir contenido ya preparado. Habría que reconsiderarla para información que debe aparecer inmediatamente después de cada escritura, como un flujo operativo en vivo. La elección responde al contenido de este sitio, no a una regla que aplicaría a todos los proyectos.',
								},
								id: '5b0e00fae0ba2f8e-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Enregistrer une modification ne crée pas encore une nouvelle page publique. Dans le parcours normal de publication avec du contenu récent du CMS, il faut lire les données, les transformer, les vérifier, produire les modules de contenu, générer le site et déployer cette nouvelle version.',
								},
								id: 'adb5c5038a45818f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le paquet web lance l&#39;export de contenu avant la génération du site. L&#39;exporteur rassemble l&#39;ensemble des contenus requis, notamment les projets, les services, les articles, la navigation et le contenu des pages. Chaque fonction de lecture connaît les relations de sa collection. Elle produit des objets que le site peut utiliser sans demander à Directus de refaire ce travail à chaque visite.',
								},
								id: 'f4b6cd4513837774-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La fonction des projets, par exemple, transforme les traductions des sections en correspondances par langue et trie les contenus répétés. Elle valide ensuite le tableau de projets avec le schéma partagé. La présence d&#39;un champ dans la base ne suffit pas si sa forme exportée ne convient pas à l&#39;application.',
								},
								id: '54117715dce9aaa7-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Avant de préparer les fichiers à écrire, le registre d&#39;export vérifie que toutes les données requises sont présentes. L&#39;export prépare également les variantes de médias dont il a besoin. Il produit des modules TypeScript et un manifeste qui indique les empreintes des fichiers ainsi que l&#39;origine des données : une lecture du CMS ou une copie en cache.',
								},
								id: 'b3c2e94146068697-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La génération du site utilise ces modules. SvelteKit prépare les routes qui peuvent l&#39;être à l&#39;avance, puis Vercel sert le déploiement. Il reste aussi des traitements côté serveur et des interactions. Préparer le texte n&#39;élimine ni les requêtes d&#39;images, ni l&#39;envoi du formulaire, ni toutes les connexions externes.',
								},
								id: '8bb3a0d61856daa8-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un exemple permet de suivre les étapes. Je corrige un paragraphe français dans Directus et je l&#39;enregistre. L&#39;éditeur montre maintenant la correction, mais le site public contient encore la version exportée auparavant. Un export et une génération réussis préparent la nouvelle version. C&#39;est sa mise en ligne qui la rend accessible aux visiteurs. Regarder seulement l&#39;éditeur, ou seulement la réussite de l&#39;export, ne permettrait pas de confirmer la publication.',
								},
								id: '8bdb36782493177d-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cette organisation convient à un site dont les récits de projets et les descriptions de services évoluent à un rythme éditorial. Elle accepte une étape de publication pour servir du contenu déjà préparé. Il faudrait réexaminer ce choix pour de l&#39;information qui doit apparaître immédiatement après chaque écriture, comme un flux opérationnel en direct. La décision dépend ici du contenu du site, pas d&#39;une règle à appliquer à tous les projets.',
								},
								id: '2fe4ca4e0aa0dd97-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'What happens between editing and publishing',
					es: 'Qué pasa entre editar y publicar',
					fr: 'Ce qui se passe entre la correction et la publication',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'There are several caches in this system, and they solve different problems. The export cache is a local snapshot of a previous CMS read. Generated modules are the content inputs committed or produced for a build. Build caching can reuse completed work. Delivery caching helps serve a deployed response. Calling all of them “the cache” would hide the question that matters: which version is being used, and why?',
								},
								id: '724d7d4edd30a5f2-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The export deliberately treats local work differently from a trusted deployment that has opted into fresh CMS content. Locally, a failed CMS read can fall back to the saved snapshot. If there is no usable snapshot, the exporter can leave existing modules untouched and report that it emitted nothing. This lets interface work continue, but the output must not be mistaken for a fresh CMS export.',
								},
								id: '7c463d7884cb2e27-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For a trusted live export, a non-live outcome is a failure. The decision is expressed directly:',
								},
								id: '225c25c1bc325da9-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport function decideExit(outcome: RunOutcome, policy: FallbackPolicy): number {\n\treturn policy === \'fail\' && outcome.source !== \'live\' ? 1 : 0;\n}\n```',
								},
								id: '9e139867f18ddc3c-3',
								type: 'code',
							},
							{
								data: {
									text: 'The number is an exit status: zero permits the command to continue successfully; one reports failure. Under the strict policy, live content gives zero, cached content gives one, and no emitted content gives one. Under the local soft policy, the command can finish with zero while clearly reporting its fallback source.',
								},
								id: '15adcd2092550735-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Imagine the CMS is unavailable while I am changing a card&#39;s spacing. Using yesterday&#39;s content locally can still be useful. Now imagine I have just corrected a public service description and expect the deployment to contain it. Quietly substituting yesterday&#39;s text would defeat that purpose. The second case needs a failed build that I can investigate, not a reassuring result with old content.',
								},
								id: '4edae6980a677548-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'An explicit skip setting is another deliberate route: CI and ordinary previews can build from committed modules without contacting the CMS. The distinction is visible in the configuration, rather than inferred from whether a command happened to finish.',
								},
								id: '2b16db3138a38a60-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The exporter also has a timeout around fetching, so a stalled read has a failure path. Its complete-data check prevents knowingly emitting a selected subset as a complete export. File emission is still a sequence of writes, not a database transaction across every file. If writing is interrupted, the output needs verification and regeneration before use. “Complete export” describes the required dataset; it should not be stretched into an unsupported guarantee about every possible disk failure.',
								},
								id: 'ff42dff74e362870-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'En este sistema hay varias cachés y cada una resuelve un problema distinto. La de exportación guarda localmente una lectura anterior del CMS. Los módulos generados son el contenido que se registra o produce para construir el sitio. La caché de construcción puede reutilizar trabajo terminado. La caché de entrega ayuda a servir una respuesta desplegada. Llamarlas a todas “la caché” escondería la pregunta importante: qué versión se está usando y por qué.',
								},
								id: '8c7f3bf606d4bb30-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La exportación trata el trabajo local de manera diferente a un despliegue autorizado que exige contenido reciente. Localmente, una lectura fallida del CMS puede recurrir a la copia guardada. Si tampoco hay una copia válida, el exportador puede dejar intactos los módulos existentes y señalar que no produjo archivos. Esto permite seguir trabajando en la interfaz, pero no convierte el resultado en una exportación reciente del CMS.',
								},
								id: '5934919a624ec15f-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En un despliegue que exige esa lectura reciente, un resultado de otro origen debe producir un fallo. La decisión está expresada directamente:',
								},
								id: 'cd998a5c81f49f09-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport function decideExit(outcome: RunOutcome, policy: FallbackPolicy): number {\n\treturn policy === \'fail\' && outcome.source !== \'live\' ? 1 : 0;\n}\n```',
								},
								id: '9e139867f18ddc3c-3',
								type: 'code',
							},
							{
								data: {
									text: 'El número es un código de salida: cero permite que la orden termine correctamente; uno señala un error. Bajo la política estricta, una lectura reciente, identificada como live, da cero; los datos de caché dan uno; y no producir contenido también da uno. Bajo la política local flexible, la orden puede terminar con cero mientras informa claramente qué alternativa utilizó.',
								},
								id: 'bf3650b3ce388898-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Imaginemos que el CMS no responde mientras ajusto el espacio de una tarjeta. El contenido de ayer todavía puede servir para ese trabajo local. Ahora imaginemos que acabo de corregir una descripción pública y espero verla en el despliegue. Sustituirla silenciosamente por el texto de ayer frustraría ese objetivo. El segundo caso necesita una construcción detenida que pueda investigar, no un resultado tranquilizador con contenido viejo.',
								},
								id: '5a29ae7ee707ed94-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Existe también una opción explícita para omitir la exportación. La integración continua y las vistas previas normales pueden construir el sitio con los módulos ya guardados en el repositorio sin contactar el CMS. La elección queda en la configuración; no se deduce únicamente de que una orden haya terminado.',
								},
								id: 'bd545a3a02e291e1-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El exportador tiene un límite de tiempo para lecturas bloqueadas. También exige el conjunto completo de datos, en lugar de presentar una selección parcial como una exportación completa. La escritura sigue siendo una secuencia de archivos, no una transacción de base de datos que los abarque a todos. Si se interrumpe, hay que verificar y regenerar el resultado antes de usarlo. La integridad del conjunto de datos no equivale a una garantía frente a cualquier fallo de disco.',
								},
								id: 'a627478afd405516-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Plusieurs caches interviennent dans ce système, avec des rôles différents. Le cache d&#39;export conserve localement une lecture précédente du CMS. Les modules générés constituent les données utilisées par une génération du site. Le cache de compilation peut réutiliser du travail déjà fait. Le cache de diffusion facilite l&#39;envoi d&#39;une réponse déployée. Les appeler tous « le cache » cacherait la question utile : quelle version est utilisée, et pourquoi?',
								},
								id: '7b78c3f8ba4d5889-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;export traite volontairement le travail local autrement qu&#39;un déploiement autorisé à lire du contenu récent. Localement, si la lecture du CMS échoue, il peut reprendre une copie sauvegardée. S&#39;il n&#39;en trouve pas de valide, il peut laisser les modules existants intacts et signaler qu&#39;il n&#39;a rien produit. Cela permet de continuer à travailler sur l&#39;interface, sans faire passer le résultat pour un nouvel export du CMS.',
								},
								id: '1f401059718d79c1-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Lorsqu&#39;un déploiement autorisé exige un export récent, un résultat provenant d&#39;ailleurs doit être un échec. La décision s&#39;écrit directement :',
								},
								id: '22447870042504ea-2',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nexport function decideExit(outcome: RunOutcome, policy: FallbackPolicy): number {\n\treturn policy === \'fail\' && outcome.source !== \'live\' ? 1 : 0;\n}\n```',
								},
								id: '9e139867f18ddc3c-3',
								type: 'code',
							},
							{
								data: {
									text: 'Le nombre est un code de sortie : zéro permet à la commande de se terminer normalement, un signale un échec. Avec la politique stricte, une lecture récente du CMS, identifiée par live, donne zéro, une copie en cache donne un et l&#39;absence de contenu produit donne un. Avec la politique locale souple, la commande peut se terminer avec zéro tout en annonçant clairement son recours au cache.',
								},
								id: '5df6fba891c34c48-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Imaginons que le CMS soit indisponible pendant que je règle l&#39;espacement d&#39;une carte. Le contenu de la veille peut encore servir au développement local. Maintenant, imaginons que je viens de corriger une description de service et que j&#39;attends cette correction dans le déploiement. Remplacer discrètement le texte par celui de la veille ferait échouer mon objectif. Ce deuxième cas exige une génération interrompue que je peux examiner, plutôt qu&#39;un résultat rassurant avec de vieux contenus.',
								},
								id: '56b69186fd7a5234-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Un réglage explicite permet aussi de sauter l&#39;export. L&#39;intégration continue et les aperçus ordinaires peuvent alors utiliser les modules déjà enregistrés dans le dépôt sans joindre le CMS. Ce choix est visible dans la configuration; il ne se déduit pas simplement de la réussite d&#39;une commande.',
								},
								id: '452e3f7e2e8a828b-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;exporteur prévoit une limite de temps pour les lectures bloquées. Il exige un ensemble complet de données avant de produire les fichiers, plutôt que de présenter une sélection partielle comme un export complet. L&#39;écriture reste toutefois une suite d&#39;opérations sur des fichiers, pas une transaction de base de données englobant tous les fichiers. Une interruption pendant l&#39;écriture demande de vérifier et de régénérer le résultat avant de l&#39;utiliser. La complétude des données ne constitue pas une garantie contre tous les problèmes de disque.',
								},
								id: '6fed704f96f9ef04-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'A cache should help development without disguising a failed publish',
					es: 'La caché ayuda al desarrollo sin ocultar una publicación fallida',
					fr: 'Le cache aide le développement sans masquer un échec de publication',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'English, French, and Spanish are working languages for me. On the website, they affect more than the opening headline: navigation, project explanations, contact labels, validation messages, and related pages also need language-aware content.',
								},
								id: '641513224cb6d28a-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'English uses the unprefixed address. French pages use /fr and Spanish pages use /es. In the content contract, translated values use the keys en, fr, and es. A project section therefore has a title map and a body-document map, rather than three unrelated copies of the entire project.',
								},
								id: 'e96d6abf2f7892a8-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The schema requires English as a base. French and Spanish are optional in the shared shape, allowing translations to be filled over time. A valid object is therefore not proof that every language version is ready. Shape validation and editorial completeness are different checks.',
								},
								id: '6b6963af92bbd4e3-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For ordinary translated strings, a blank required English value is rejected. The export reads the translation rows, keeps the recognised values, and forms the language map. Rich content has its own document schema. A translation is not interchangeable with an arbitrary string where the renderer expects an ordered set of blocks.',
								},
								id: '05e191e598251b7f-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Consider one section with a title and a body in all three languages. That is six editorial values to keep coherent: three titles and three bodies. Correcting a fact in the French body does not update the other two by itself. The identity and order can stay shared, but the meaning still has to be reviewed across the three versions.',
								},
								id: '94a7f74358fde467-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I want the versions to read naturally for their audiences. Québec French, Colombian Spanish, and Canadian English do not always use the same sentence structure or the same familiar terms. The important invariant is the underlying account: the same feature, responsibility, limitation, and example. Translating an identifier inside a source excerpt, on the other hand, would change the code rather than adapt the explanation.',
								},
								id: '511b771a9de579dc-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This gives me a more useful question than “does the language button exist?” I can ask whether someone can read the project, understand an error, follow the related link, and contact me in their chosen language. The content model supports that work, but it does not complete the editorial work on its own.',
								},
								id: 'ce25b2133bdb8ac1-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El español, el francés y el inglés son mis idiomas de trabajo. Dentro del sitio afectan mucho más que el título inicial: navegación, explicaciones de proyectos, etiquetas del formulario, mensajes de validación y páginas relacionadas también deben contemplar el idioma.',
								},
								id: '9da3f704cc56b15f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El inglés usa las direcciones sin prefijo. El francés usa /fr y el español /es. En el contrato de contenido, los valores traducidos llevan las claves en, fr y es. Una sección tiene, por tanto, un conjunto de títulos y otro de documentos por idioma, en lugar de tres copias independientes del proyecto completo.',
								},
								id: '90f3ba091bd0dd63-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El esquema exige inglés como base. Francés y español son opcionales en la estructura compartida, lo que permite completar las traducciones con el tiempo. Un objeto válido no demuestra que los tres idiomas estén listos. Validar la estructura y revisar si el contenido está completo son tareas distintas.',
								},
								id: 'a754e85e37adfa49-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Para los textos traducidos comunes, se rechaza un valor obligatorio en inglés que esté vacío o solo tenga espacios. La exportación lee los registros de traducción, conserva los valores reconocidos y forma el conjunto por idioma. El contenido enriquecido tiene su propio esquema. Una cadena cualquiera no reemplaza un documento cuando la interfaz espera una lista ordenada de bloques.',
								},
								id: 'b800265e35ffbacd-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pensemos en una sección con título y cuerpo en los tres idiomas. Son seis valores editoriales que deben mantener el mismo sentido: tres títulos y tres cuerpos. Corregir un dato en francés no actualiza por sí solo las otras dos versiones. La identidad y el orden pueden ser compartidos, pero el significado necesita revisión en cada idioma.',
								},
								id: '7f342f1ed5393c09-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Quiero que las versiones se lean de forma natural para sus públicos. El francés de Québec, el español colombiano y el inglés canadiense no siempre usan las mismas construcciones ni los mismos términos cotidianos. Lo que debe mantenerse es el relato: las mismas funciones, responsabilidades, limitaciones y ejemplos. En cambio, traducir un identificador dentro de un fragmento de código modificaría el programa en vez de adaptar la explicación.',
								},
								id: 'f2350f702b974735-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esto lleva a una pregunta más útil que “¿existe el botón de idioma?”. ¿Puede alguien leer el proyecto, entender un error, seguir un enlace relacionado y contactarme en el idioma que eligió? El modelo permite organizar ese trabajo, pero no hace por sí solo la revisión editorial.',
								},
								id: '7a69d52821e6e7e1-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le français, l&#39;anglais et l&#39;espagnol sont mes langues de travail. Dans le site, elles touchent bien plus que le titre d&#39;accueil : navigation, explications de projets, libellés du formulaire, messages de validation et pages associées doivent tenir compte de la langue.',
								},
								id: 'ba33a8df30b218a1-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;anglais utilise les adresses sans préfixe. Le français utilise /fr et l&#39;espagnol /es. Dans le contrat de contenu, les valeurs traduites portent les clés en, fr et es. Une section a donc un ensemble de titres et un ensemble de documents par langue, plutôt que trois copies indépendantes du projet entier.',
								},
								id: '96d9420097aad527-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le schéma exige l&#39;anglais comme base. Le français et l&#39;espagnol sont facultatifs dans la structure partagée, ce qui permet de les ajouter progressivement. Un objet valide ne prouve donc pas que les trois versions sont prêtes. Vérifier la structure et vérifier la complétude éditoriale sont deux tâches distinctes.',
								},
								id: 'b39a73f4742cf809-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pour les chaînes traduites ordinaires, une valeur anglaise obligatoire qui ne contient que du vide est refusée. L&#39;export lit les enregistrements de traduction, retient les valeurs reconnues et forme la correspondance par langue. Le contenu riche possède son propre schéma. Une simple chaîne ne remplace pas un document lorsque le moteur d&#39;affichage attend une liste ordonnée de blocs.',
								},
								id: '0318d7f60d883085-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Prenons une section avec un titre et un corps dans les trois langues. Il y a six valeurs éditoriales à garder cohérentes : trois titres et trois corps. Corriger un fait dans le texte français ne met pas automatiquement les deux autres à jour. L&#39;identité et l&#39;ordre peuvent rester communs, mais le sens demande une révision dans chaque version.',
								},
								id: '075d28ccde975578-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Je veux que les textes se lisent naturellement pour leurs publics. Le français québécois, l&#39;espagnol colombien et l&#39;anglais canadien n&#39;utilisent pas toujours les mêmes tournures ni les mêmes termes familiers. Ce qui doit rester équivalent, c&#39;est le récit : mêmes fonctions, responsabilités, limites et exemples. Traduire un identifiant dans un extrait de code changerait en revanche le programme plutôt que son explication.',
								},
								id: '339beea0663a2e85-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cela mène à une question plus utile que « le bouton de langue existe-t-il? ». Une personne peut-elle lire le projet, comprendre une erreur, suivre un lien associé et me joindre dans la langue choisie? Le modèle soutient ce travail, sans effectuer à lui seul toute la révision éditoriale.',
								},
								id: 'f7e3cb2bc7050099-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Three languages in the content model',
					es: 'Tres idiomas en el modelo de contenido',
					fr: 'Trois langues dans le modèle de contenu',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Imagine someone starts a message in Spanish, then changes the interface to French. The form labels should change. The words the person wrote should remain theirs.',
								},
								id: '2e6983397751fea7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A language change also changes the page address. In this implementation, the page subtree is recreated when that address changes, so values held only inside the old component would disappear with it. The contact form explicitly registers the three values that need to cross that boundary:',
								},
								id: '853066bc963a870e-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nconst name = persisted<string>(\'contact-name\', \'\');\nconst email = persisted<string>(\'contact-email\', \'\');\nconst message = persisted<string>(\'contact-message\', \'\');\n```',
								},
								id: 'bc43e89997de4f88-2',
								type: 'code',
							},
							{
								data: {
									text: 'The stable identifiers matter. “contact-message” still means the same field whether the visible label is in English, French, or Spanish. A translated label would be a poor identifier because changing language would change the key needed to find the value.',
								},
								id: 'a0faf1dae5aca82c-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Before a recognised language navigation, the handoff mechanism captures registered values together with reading position and focus information. It places a versioned record in session storage. On the new page, the registered controls can recover their values; focus and scroll are restored after the page has rendered, and the stored handoff is cleared. This is a transfer for a navigation, not a promise of permanent message drafts.',
								},
								id: '36d0d3e04ef0bb91-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The helper also seeds values before the new control paints. That avoids briefly showing a default value and then replacing it. For an expandable section, the same idea avoids opening a card for a moment before restoring its closed state.',
								},
								id: '8fa31f3bcfd9ddbf-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The implementation distinguishes a successful form submission from the translated sentences used to describe it. It can preserve the fact that submission succeeded and rebuild the confirmation in the new language. Preserving the old translated sentence would leave part of the interface in the previous language.',
								},
								id: 'd41e50c953a56520-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is a specific mechanism for registered values, not a claim that every route is seamless. A French blueprint&#39;s contact link also needs the correct French destination. Choosing that destination and keeping the visitor&#39;s message are separate responsibilities. Both matter to the person using the site.',
								},
								id: 'f15d901c7a95c8f3-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Imaginemos que alguien empieza un mensaje en español y después pasa la interfaz a francés. Las etiquetas deberían cambiar. Las palabras que escribió deben seguir siendo suyas.',
								},
								id: '61b005b3ecbb9fe3-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El cambio de idioma también modifica la dirección. En esta implementación, la parte de la interfaz que corresponde a la página se crea de nuevo cuando cambia esa dirección. Los valores que vivieran solo en el componente anterior desaparecerían con él. Por eso el formulario registra explícitamente los tres datos que debe trasladar:',
								},
								id: '49a670eb19981a7c-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nconst name = persisted<string>(\'contact-name\', \'\');\nconst email = persisted<string>(\'contact-email\', \'\');\nconst message = persisted<string>(\'contact-message\', \'\');\n```',
								},
								id: 'bc43e89997de4f88-2',
								type: 'code',
							},
							{
								data: {
									text: 'Los identificadores estables importan. “contact-message” sigue representando el mismo campo sin importar si la etiqueta visible está en español, francés o inglés. Una etiqueta traducida sería una mala clave: el cambio de idioma modificaría el nombre que se necesita para recuperar el valor.',
								},
								id: '009d5f96ec8932f6-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Antes de una navegación reconocida como cambio de idioma, el mecanismo recoge los valores registrados, la posición de lectura y la información del control activo. Guarda un registro versionado en el almacenamiento de la sesión. En la página nueva, los controles pueden recuperar sus valores; el foco y la posición se restablecen después de mostrarla y el registro de traslado se elimina. Es un paso entre páginas, no una promesa de conservar mensajes sin terminar para siempre.',
								},
								id: 'b8900f78c96eafb7-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La función también prepara los valores antes de que se vea el control nuevo. Así evita mostrar primero el valor por defecto y reemplazarlo después. En una sección desplegable, la misma idea evita abrir la tarjeta un instante antes de recuperar su estado cerrado.',
								},
								id: 'f602b85cdb4aa7a6-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La implementación distingue entre el hecho de que un envío fue exitoso y las frases traducidas que lo describen. Puede conservar ese resultado y reconstruir la confirmación en el idioma nuevo. Guardar la frase anterior dejaría una parte de la interfaz en el idioma previo.',
								},
								id: '3fe895e331bf30f4-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Es un mecanismo concreto para valores registrados, no una afirmación de que todas las rutas entre idiomas estén resueltas. El enlace de contacto de un diagrama francés también necesita llegar a la versión francesa. Elegir ese destino y conservar el mensaje son responsabilidades diferentes. Ambas importan para quien usa el sitio.',
								},
								id: '29f159a9bc13db82-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Imaginons qu&#39;une personne commence un message en espagnol, puis passe l&#39;interface en français. Les libellés devraient changer. Les mots qu&#39;elle a écrits doivent rester les siens.',
								},
								id: '7da8c94bfd044917-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le changement de langue modifie aussi l&#39;adresse. Dans cette implémentation, la partie de l&#39;interface correspondant à la page est recréée lorsque cette adresse change. Les valeurs conservées seulement dans l&#39;ancien composant disparaîtraient avec lui. Le formulaire inscrit donc explicitement les trois valeurs à transporter :',
								},
								id: '03fbc8cbe937edc8-1',
								type: 'paragraph',
							},
							{
								data: {
									code: '```typescript\nconst name = persisted<string>(\'contact-name\', \'\');\nconst email = persisted<string>(\'contact-email\', \'\');\nconst message = persisted<string>(\'contact-message\', \'\');\n```',
								},
								id: 'bc43e89997de4f88-2',
								type: 'code',
							},
							{
								data: {
									text: 'Les identifiants stables sont importants. « contact-message » désigne toujours le même champ, quelle que soit la langue de son libellé. Un libellé traduit ferait une mauvaise clé : le changement de langue changerait aussi le nom nécessaire pour retrouver la valeur.',
								},
								id: '71516f5bdcb8c880-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Avant une navigation reconnue comme un changement de langue, le mécanisme conserve les valeurs inscrites, la position de lecture et des renseignements sur l&#39;élément actif. Il place cet ensemble versionné dans le stockage de session. Sur la nouvelle page, les contrôles récupèrent leurs valeurs; le défilement et le focus sont rétablis après l&#39;affichage, puis la copie de transfert est effacée. C&#39;est un passage entre deux pages, pas une promesse de conserver indéfiniment les messages inachevés.',
								},
								id: 'c339ec066eb77a2b-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La fonction prépare aussi les valeurs avant le premier affichage du contrôle. Elle évite de montrer un contenu par défaut avant de le remplacer. Pour une section dépliable, le même principe évite qu&#39;une carte s&#39;ouvre un instant avant de retrouver son état fermé.',
								},
								id: 'ebfe0208050da7e0-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'L&#39;implémentation distingue le fait qu&#39;un envoi a réussi des phrases traduites qui le décrivent. Elle peut conserver la réussite et reconstruire la confirmation dans la nouvelle langue. Garder l&#39;ancienne phrase laisserait une partie de l&#39;interface dans la langue précédente.',
								},
								id: 'ca91c89445838b1e-6',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce mécanisme concerne les valeurs inscrites; il ne signifie pas que tous les parcours linguistiques sont réglés. Le lien de contact d&#39;un plan français doit aussi choisir la destination française. Trouver cette destination et conserver le message sont deux responsabilités différentes. Les deux comptent pour la personne qui utilise le site.',
								},
								id: '37cce7685c7bf328-7',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Keeping a message when the interface changes language',
					es: 'Conservar el mensaje cuando cambia el idioma de la interfaz',
					fr: 'Garder un message quand la langue de l\'interface change',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The site borrows from transit signage, route diagrams, technical drawings, and terminal windows. Orange and yellow recur as points of reference. Section markers and the destination board carry that interest through the pages. The reference is personal, but the components still have ordinary jobs: explain a relationship, identify an action, or make a long page easier to navigate.',
								},
								id: 'da9809c7812e4327-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Shared design tokens give those decisions names. A component can use a role such as primary colour, border, or motion duration rather than inventing another unrelated value. The website also has local styling and layout decisions. Reusing primitives does not mean every page becomes the same composition.',
								},
								id: 'd4ba4beee04e5eee-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The consumer package records where its shared resources come from. Vendored packages keep a reviewed copy available to the website, and an integrity check can compare that copy with its recorded adoption. That creates a boundary between developing the shared system and adopting it into this product. An edit made directly to a copied package is not automatically an upstream improvement.',
								},
								id: '4e0f2282c3a75e75-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The expandable card illustrates how appearance and interaction meet. Its header is a real button, with the expansion state supplied through the underlying collapsible primitive. Pointer users can also click a non-interactive part of the card. The handler deliberately leaves links, inputs, and buttons alone, avoids toggling a parent when a nested card owns the click, and ignores a click ending a text selection.',
								},
								id: '6953059e6a8a9838-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Those exceptions have a reader-facing purpose. Copying a sentence should not close the section. Following a link should follow the link. Clicking the header should toggle once, even though the surrounding card also handles clicks.',
								},
								id: 'acead6bc7690f21c-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Light and dark themes, responsive layouts, reduced-motion rules, and quiet-mode behaviour add more contexts in which the same content has to remain usable. The visual idea gives the site its character. The shared parts and interaction rules help keep that character from getting in the reader&#39;s way.',
								},
								id: '001fa18f8e83bc35-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'El sitio toma referencias de la señalización del transporte público, los planos de rutas, el dibujo técnico y las ventanas de terminal. El naranja y el amarillo aparecen como puntos de referencia. Las marcas de secciones y el tablero de destinos mantienen ese interés a lo largo de las páginas. La referencia es personal, pero los componentes tienen funciones comunes: explicar una relación, identificar una acción o facilitar el recorrido de una página larga.',
								},
								id: '258f68da603869c7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los tokens de diseño les dan nombre a decisiones compartidas. Un componente puede usar un papel como color principal, borde o duración de movimiento, en vez de inventar otro valor aislado. El sitio también tiene decisiones propias de estilo y distribución. Reutilizar componentes básicos no obliga a que todas las páginas tengan la misma composición.',
								},
								id: '609a2a2247d3d9e6-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El paquete consumidor registra de dónde vienen sus recursos compartidos. Las copias versionadas mantienen una versión revisada disponible para la web, y un control de integridad puede compararla con la adopción registrada. Así se distingue el desarrollo del sistema compartido de su incorporación a este producto. Editar directamente una copia no se convierte automáticamente en una mejora de la fuente común.',
								},
								id: '548c99400ec1f265-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La tarjeta desplegable muestra cómo se unen la apariencia y la interacción. Su encabezado es un botón real, con el estado de apertura conectado al componente base. Quien usa un puntero también puede hacer clic en una parte no interactiva de la tarjeta. El manejador deja que enlaces, campos y botones conserven su acción, evita que una tarjeta anidada cambie a su contenedora e ignora el clic que termina una selección de texto.',
								},
								id: 'b5ee0032a8dd7e2a-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Esas excepciones tienen un propósito para quien lee. Copiar una frase no debería cerrar la sección. Seguir un enlace debería abrir ese enlace. Hacer clic en el encabezado debería alternar una sola vez, aunque la tarjeta completa también procese clics.',
								},
								id: '83da875c484df324-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los temas claro y oscuro, las distribuciones adaptables, las reglas de movimiento reducido y el modo tranquilo agregan otros contextos donde el contenido debe seguir siendo utilizable. La idea visual le da personalidad al sitio. Las piezas compartidas y sus reglas de interacción ayudan a que esa personalidad no estorbe la lectura.',
								},
								id: '89e3ba157d616e1e-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Le site emprunte à la signalisation du transport collectif, aux plans de lignes, au dessin technique et aux fenêtres de terminal. L&#39;orange et le jaune reviennent comme repères. Les marqueurs de sections et le tableau de destinations prolongent cet intérêt dans les pages. La référence est personnelle, mais les composants ont des rôles ordinaires : expliquer une relation, identifier une action ou faciliter la lecture d&#39;une longue page.',
								},
								id: '2149f852f67797a7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les tokens de design donnent un nom à des décisions communes. Un composant utilise un rôle, comme une couleur principale, une bordure ou une durée de mouvement, au lieu d&#39;inventer une nouvelle valeur isolée. Le site possède aussi ses propres choix de style et de disposition. Réutiliser des composants de base n&#39;oblige pas chaque page à devenir la même composition.',
								},
								id: '2588844abb9c9554-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le paquet consommateur enregistre la provenance de ses ressources partagées. Les copies versionnées gardent une version examinée à la disposition du site, et un contrôle d&#39;intégrité peut les comparer à l&#39;adoption enregistrée. Cela distingue le développement du système partagé de son adoption dans ce produit. Modifier directement une copie ne constitue pas automatiquement une amélioration de la source commune.',
								},
								id: 'e44ef6e5ba1c6f18-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La carte dépliable montre le lien entre apparence et interaction. Son en-tête est un vrai bouton, dont l&#39;état d&#39;expansion passe par le composant de base. À la souris, on peut aussi cliquer une zone non interactive de la carte. Le gestionnaire laisse les liens, champs et boutons accomplir leur propre action. Il évite qu&#39;un clic sur une carte imbriquée ferme sa parente et ignore le clic qui termine une sélection de texte.',
								},
								id: '6e3a7612b5156785-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ces exceptions ont un but concret. Copier une phrase ne devrait pas fermer la section. Suivre un lien devrait suivre ce lien. Cliquer l&#39;en-tête devrait ouvrir ou fermer une seule fois, même si la carte entière traite aussi les clics.',
								},
								id: 'd35fdde04417d142-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les thèmes clair et sombre, les mises en page adaptatives, les règles de réduction du mouvement et le mode calme ajoutent des contextes où le même contenu doit rester utilisable. L&#39;idée visuelle donne sa personnalité au site. Les éléments partagés et leurs règles d&#39;interaction aident à ce que cette personnalité ne nuise pas à la lecture.',
								},
								id: '024f015ae3b9b7c8-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'A personal visual language built on shared parts',
					es: 'Una identidad personal construida con piezas compartidas',
					fr: 'Une identité personnelle construite avec des éléments partagés',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'The contact page offers a short form, a direct email link, and a link to book an introductory call. It also provides context about location, languages, and the kinds of problems I work on.',
								},
								id: '8f78444b6fa21125-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The form itself has a sequence. It first checks the name, email, and message. An empty value is different from an email value that fails the format check. The error messages come from translated content and refer to the corresponding field. Only a valid form reaches the sending step.',
								},
								id: 'b9056fc369c61e32-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'While a request is running, the implementation prevents another submission through the same handler and disables the send control. The button exposes its busy state and changes its visible wording. The visitor should not have to guess whether the first click did anything.',
								},
								id: '195ae0c5087064f3-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The request is sent to Web3Forms. If that service reports failure, or the request throws, the form records an error and clears its sending state. It returns before playing the success sequence. The confirmation is based on the service response, not on a separate inspection of the destination inbox.',
								},
								id: '6721465ae1052c1f-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'There is also an earlier boundary: the moment between the prepared HTML appearing and the browser attaching its JavaScript handlers. The button remains disabled until the handler is ready. The source explains the reason for that guard: without it, a native form submission could reload the page and put entered values into the address&#39;s query string. This is a concrete case where loading behaviour, privacy, and interface feedback intersect.',
								},
								id: '7cf700d86f5308cb-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Desktop and mobile versions can render different form layouts. Their element identifiers include the layout so labels and error descriptions target the correct control. The handoff identifier remains independent of that visual layout, because “the message field” is still the same conceptual value.',
								},
								id: 'bd930b84b01730ba-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Consider a slow connection. The visitor sends once, sees the pending indication, then receives an error. The useful outcome is a form that explains what happened and permits recovery. Animating a success message on a timer would be easier to draw, but it would not describe the request&#39;s outcome. The form&#39;s sequence is part of what makes the contact page a working feature.',
								},
								id: '88416c5cbda97689-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'La página de contacto ofrece un formulario corto, un correo directo y un enlace para agendar una llamada introductoria. También da contexto sobre la ciudad, los idiomas de trabajo y los tipos de problemas en los que puedo ayudar.',
								},
								id: '2097a35d01a05058-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El formulario sigue una secuencia. Primero revisa nombre, correo y mensaje. Un valor vacío es diferente de una dirección que no pasa la comprobación de formato. Los errores vienen del contenido traducido y señalan el campo correspondiente. Solo un formulario válido llega al envío.',
								},
								id: '20be8dcb39c34efa-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Mientras una solicitud está en curso, el manejador evita otro envío y desactiva el control. El botón informa que está ocupado y cambia su texto visible. La persona no debería tener que adivinar si el primer clic hizo algo.',
								},
								id: '11b2593298a6fdcb-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La solicitud se envía a Web3Forms. Si el servicio informa un fallo o la solicitud produce un error, el formulario registra el problema y termina la indicación de envío. Sale antes de mostrar la secuencia de éxito. La confirmación se basa en la respuesta del servicio, no en una inspección independiente del correo de destino.',
								},
								id: 'e393874105c886bb-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Hay además un momento anterior: el intervalo entre la aparición del HTML preparado y la activación del código JavaScript en el navegador. El botón sigue desactivado hasta que su manejador está listo. El código explica la razón: un envío nativo podría recargar la página y poner los datos ingresados en los parámetros de la dirección. El proceso de carga, la privacidad y la información visible se encuentran aquí en una decisión concreta.',
								},
								id: 'ab74a9ab91609985-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las vistas de escritorio y móvil pueden mostrar distribuciones distintas del formulario. Los identificadores de los elementos incluyen la distribución para que cada etiqueta y descripción de error apunten al control correcto. El identificador usado durante el cambio de idioma sigue siendo independiente de esa presentación: el campo del mensaje representa el mismo dato.',
								},
								id: '74c926a49099112d-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pensemos en una conexión lenta. La persona envía una vez, ve la indicación de espera y después recibe un error. El resultado útil es un formulario que explica lo ocurrido y permite recuperarse. Una animación de éxito activada por un temporizador sería más fácil de dibujar, pero no contaría el resultado de la solicitud. La secuencia forma parte de lo que hace que contacto sea una función real.',
								},
								id: 'adaa119ebb385d05-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'La page de contact propose un formulaire court, une adresse courriel et un lien pour réserver un appel d&#39;introduction. Elle donne aussi du contexte sur la ville, les langues de travail et les types de problèmes auxquels je m&#39;intéresse.',
								},
								id: 'a3ac44233c97d7c9-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le formulaire suit une séquence. Il vérifie d&#39;abord le nom, le courriel et le message. Une valeur absente n&#39;est pas la même chose qu&#39;une adresse dont le format échoue à la vérification. Les erreurs proviennent du contenu traduit et désignent le champ concerné. Seul un formulaire valide passe à l&#39;envoi.',
								},
								id: '4f124508b9cf45c5-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Pendant une requête, le gestionnaire empêche un nouvel envoi et la commande reste désactivée. Le bouton expose son état occupé et change son texte visible. La personne ne devrait pas avoir à deviner si son premier clic a fait quelque chose.',
								},
								id: '82a7530b619d3c49-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La requête est envoyée à Web3Forms. Si le service signale un échec ou si la requête provoque une erreur, le formulaire inscrit le problème et retire l&#39;état d&#39;envoi en cours. Il s&#39;arrête avant la séquence de réussite. La confirmation repose sur la réponse du service, sans inspection distincte de la boîte courriel de destination.',
								},
								id: '1fbe234e58760b6e-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Il existe aussi une étape plus tôt : le moment entre l&#39;apparition du HTML préparé et l&#39;activation des gestionnaires JavaScript dans le navigateur. Le bouton reste désactivé jusqu&#39;à ce que le gestionnaire soit prêt. Le code explique pourquoi : un envoi natif du formulaire pourrait autrement recharger la page et placer les valeurs saisies dans les paramètres de son adresse. Le chargement, la confidentialité et le retour visuel se rencontrent ici dans un choix concret.',
								},
								id: '59815797491db2b5-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les vues ordinateur et mobile peuvent afficher des dispositions différentes. Les identifiants des éléments comprennent donc la disposition pour que les libellés et les descriptions d&#39;erreur visent le bon contrôle. L&#39;identifiant utilisé lors du changement de langue reste indépendant de cette présentation : le champ du message représente toujours la même valeur.',
								},
								id: 'a768f5d786a3a639-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Prenons une connexion lente. La personne envoie une fois, voit l&#39;indication d&#39;attente, puis reçoit une erreur. Le résultat utile est un formulaire qui explique ce qui s&#39;est passé et permet de reprendre. Une animation de réussite déclenchée après un délai serait plus simple à dessiner, mais elle ne raconterait pas le résultat de la requête. Cette séquence fait partie du fonctionnement réel de la page de contact.',
								},
								id: '188d8326fc5a9ba4-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'The contact form is a small workflow',
					es: 'El formulario de contacto es un proceso pequeño',
					fr: 'Le formulaire de contact est un petit processus',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'I find these topics easier to reason about when they are connected to a particular action. For the contact form, labels need to identify fields. A field with an error uses aria-invalid and refers to its error text with aria-describedby. A submission in progress exposes aria-busy. These attributes complement visible feedback rather than replacing it.',
								},
								id: 'cad156173dac20fc-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For a long article, the section heading needs to remain a keyboard-operable control. The section navigation needs targets that correspond to the content. Expanding a card, selecting text inside it, and following a link are different actions, even when they share the same rectangle on screen.',
								},
								id: '718ce4735d3cb923-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The code examples have their own rendering boundary. The block stores source as plain text. The interface can receive highlighted HTML prepared on the server; when that is unavailable, it has a plain escaped rendering path. Copying the example uses the code body. This keeps the explanation readable without requiring the browser to treat the example as executable page markup.',
								},
								id: '45315d6162a6dab1-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ordinary rich text is a different case because the editor can store inline HTML marks. A valid BlockEditorDoc describes structure; it does not by itself establish a complete HTML-sanitisation policy. The editor&#39;s permissions, accepted markup, and render path need to be treated as their own boundary. I would not use a schema check as a substitute for that analysis.',
								},
								id: 'e478185b583103d9-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Similarly, a browser-side email check is useful feedback, but it cannot be the authority for protecting an external submission service. A build credential belongs in the build environment, not in a public article or browser bundle. And keeping a preview out of search results does not make it private: noindex is an indexing instruction, not access control.',
								},
								id: '2571b26b0a2d47ff-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'These are concrete responsibilities I can inspect and improve. They describe implementation choices, not an accessibility certification or a blanket assertion that a website is secure.',
								},
								id: '3bb59de7ed4a03cc-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Estos temas son más fáciles de analizar cuando se relacionan con una acción. En el formulario, las etiquetas deben identificar los campos. Un campo con error usa aria-invalid y enlaza su explicación mediante aria-describedby. Un envío en curso expone aria-busy. Esos atributos complementan la información visible, no la reemplazan.',
								},
								id: 'b15c8b8f25609136-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'En un artículo largo, el encabezado de una sección debe seguir siendo un control que se pueda usar con el teclado. El índice necesita destinos que correspondan al contenido. Abrir una tarjeta, seleccionar una frase y seguir un enlace son acciones distintas, aunque ocurran en el mismo rectángulo de la pantalla.',
								},
								id: '2c175b03b9ec334f-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los ejemplos de código tienen su propio tratamiento. El bloque guarda el programa como texto plano. La interfaz puede recibir el resaltado preparado en el servidor; si no está disponible, tiene una presentación simple con el texto escapado. La copia usa el cuerpo del código. Así la explicación sigue siendo legible sin pedirle al navegador que ejecute el ejemplo como parte de la página.',
								},
								id: '4ded280732bf314f-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El texto enriquecido común es otro caso, porque el editor puede guardar marcas HTML dentro del texto. Un BlockEditorDoc válido describe una estructura; no establece por sí solo una política completa de limpieza del HTML. Los permisos de edición, el marcado admitido y la forma de mostrarlo requieren su propio análisis. La validación del esquema no reemplaza esa revisión.',
								},
								id: '05b7fdfed5b570c3-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'De igual forma, comprobar el formato del correo en el navegador ayuda a llenar el formulario, pero no puede ser la autoridad que protege un servicio externo de envío. Una credencial usada para construir el sitio pertenece al entorno de construcción, no a un artículo público ni a los archivos que recibe el navegador. Y excluir una vista previa de los buscadores no la vuelve privada: noindex es una instrucción de indexación, no un control de acceso.',
								},
								id: '50045cd24f5ecb89-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Son responsabilidades concretas que puedo examinar y mejorar. Describen decisiones de implementación, no una certificación de accesibilidad ni una afirmación general de que un sitio es seguro.',
								},
								id: '8cb9964742999439-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Ces sujets deviennent plus faciles à examiner quand on les relie à une action. Dans le formulaire, les libellés doivent identifier les champs. Un champ en erreur utilise aria-invalid et pointe vers son explication avec aria-describedby. Un envoi en cours expose aria-busy. Ces attributs complètent les indications visibles, sans les remplacer.',
								},
								id: '1f74f0b1a1004c39-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Dans un long article, l&#39;en-tête d&#39;une section doit rester une commande utilisable au clavier. La navigation doit viser les bons endroits du contenu. Déplier une carte, sélectionner une phrase et suivre un lien sont trois actions, même si elles se produisent dans le même rectangle à l&#39;écran.',
								},
								id: '2060c4c5d5173d01-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les extraits de code ont leur propre traitement. Le bloc conserve le programme comme texte brut. L&#39;interface peut recevoir une coloration préparée côté serveur; sinon, elle dispose d&#39;un affichage simple où le texte est échappé. La copie utilise le corps du code. L&#39;explication peut ainsi rester lisible sans demander au navigateur d&#39;exécuter l&#39;exemple comme du contenu de page.',
								},
								id: 'fb4848544aed3d95-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le texte riche ordinaire pose une autre question, puisque l&#39;éditeur peut conserver des marques HTML à l&#39;intérieur du texte. Un BlockEditorDoc valide décrit une structure. Il ne constitue pas à lui seul une politique complète de nettoyage du HTML. Les permissions d&#39;édition, les marques acceptées et le chemin d&#39;affichage forment une frontière distincte. La validation du schéma ne remplace pas cette analyse.',
								},
								id: 'dba79cb65165f69a-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'De la même façon, vérifier le format d&#39;un courriel dans le navigateur aide la personne à remplir le formulaire, mais ne peut pas assurer la protection du service d&#39;envoi externe. Un accès nécessaire à la génération du site appartient à l&#39;environnement de génération, pas à un article public ni aux fichiers envoyés au navigateur. Et retirer un aperçu des résultats de recherche ne le rend pas privé : noindex concerne l&#39;indexation, pas le contrôle d&#39;accès.',
								},
								id: 'eba9ffb4295ed360-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ce sont des responsabilités précises que je peux examiner et améliorer. Elles décrivent des choix d&#39;implémentation, sans constituer une certification d&#39;accessibilité ni une affirmation générale selon laquelle un site serait sécurisé.',
								},
								id: '42c6809dd192b035-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Accessibility and security are decisions at specific boundaries',
					es: 'Accesibilidad y seguridad en puntos concretos',
					fr: 'Accessibilité et sécurité à des endroits précis',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'Different checks answer different questions. Type checking can catch a mismatch between what a component expects and what it receives. Runtime schemas can reject malformed CMS data. Unit tests can exercise a transformation or a failure-policy branch. Browser tests can exercise a page as an interaction.',
								},
								id: '67de1e2d148a8b4f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The shared schemas also include compile-time comparisons between their inferred types and the handwritten interfaces. That helps make a model change visible on both sides of the CMS-to-web boundary. Otherwise, a field could be added to one interpretation and disappear in another.',
								},
								id: '00cb892706b713f3-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The export tests cover cases such as an untrusted preview attempting a live export, a timeout, a missing mirrored asset, and a non-live result under strict policy. The expandable-card tests ask whether a header toggles once, whether an interactive child keeps its own action, and whether the semantic button retains its expansion state. These are useful questions because they are tied to specific mistakes.',
								},
								id: 'e79baf002ddae34b-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The web workflow checks types and unit tests, generated-content integrity, vendored design integrity, product tokens, the shared package, the build, and the client payload. It also has a browser-test lane. The CMS workflow has its own validation and operational jobs. Their presence is evidence of how the work is organised; a particular release still needs its own results.',
								},
								id: '47fc2b16b2835348-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Generated-content integrity is especially easy to overstate. The manifest records SHA-256 values for the emitted files. If a file changes without a corresponding manifest update, verification can detect the mismatch. It also records whether the export used live data or a cache.',
								},
								id: 'a8e1cfae245cd838-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'A hash does not judge the truth of a paragraph. If someone changed both a file and its recorded hash, matching them would not independently prove that the content came from the CMS. The check is valuable for detecting drift, but the publishing process and review still carry the source-of-truth responsibility.',
								},
								id: '31d63775ac5b87e0-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That is why I prefer a specific statement such as “this test exercises a failed export” over a large test count presented as a quality score. Counts do not explain which failure matters, what was checked, or what a reader can rely on.',
								},
								id: 'f903206a8ffeb04d-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Cada comprobación responde una pregunta diferente. La revisión de tipos puede detectar una diferencia entre lo que espera un componente y lo que recibe. Los esquemas pueden rechazar datos del CMS con una estructura incorrecta. Las pruebas unitarias pueden recorrer una transformación o una decisión frente a un fallo. Las pruebas de navegador pueden ejecutar una interacción.',
								},
								id: '83685df43e912910-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los esquemas compartidos también comparan, durante la compilación, los tipos que producen con las interfaces escritas por separado. Esto ayuda a hacer visible un cambio de modelo en ambos lados del paso entre CMS y web. Sin esa relación, un campo podría agregarse a una interpretación y desaparecer de la otra.',
								},
								id: '4530e4962ace8076-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las pruebas de exportación cubren casos como una vista previa no autorizada que intenta leer contenido reciente, una espera que supera el tiempo permitido, un archivo de imagen local ausente y un resultado de caché bajo la política estricta. Las pruebas de la tarjeta revisan si el encabezado cambia una sola vez, si un elemento interactivo conserva su acción y si el botón mantiene la información de apertura. Son preguntas útiles porque corresponden a errores concretos.',
								},
								id: 'a4d7fcde1051843d-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El flujo de la web revisa tipos, pruebas unitarias, integridad del contenido generado, integridad de las copias de diseño, tokens del producto, el paquete compartido, la construcción y la cantidad de código enviada al navegador. También incluye una etapa de pruebas en el navegador. El CMS tiene sus propias validaciones y operaciones. Su presencia explica cómo se organiza el trabajo; una versión particular todavía necesita sus resultados.',
								},
								id: 'd00b89b164b275b6-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La integridad del contenido generado es fácil de exagerar. El manifiesto registra una huella SHA-256 de cada archivo producido. Si un archivo cambia sin actualizar el manifiesto, la verificación puede detectar la diferencia. También queda registrado si los datos vinieron de una lectura reciente o de caché.',
								},
								id: '8978ee4b54dd070a-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Una huella no evalúa si un párrafo dice la verdad. Si alguien modificara tanto el archivo como su huella, que coincidan no demostraría de forma independiente que el contenido salió del CMS. La comprobación sirve para detectar desviaciones, pero el proceso de publicación y la revisión siguen siendo responsables de la procedencia.',
								},
								id: 'a3f7b698b4664003-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Por eso prefiero una afirmación concreta, como “esta prueba recorre un fallo de exportación”, a una cantidad grande de pruebas presentada como nota de calidad. El número no explica qué error importa, qué se revisó ni en qué puede confiar quien lee.',
								},
								id: '48a40a95b4dea727-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Les vérifications ne répondent pas toutes à la même question. Le contrôle des types peut détecter un décalage entre les données attendues et reçues par un composant. Les schémas peuvent rejeter un contenu CMS mal formé. Les tests unitaires peuvent exercer une transformation ou un choix de traitement d&#39;erreur. Les tests dans le navigateur peuvent parcourir une interaction.',
								},
								id: '822b91613c2f4e9d-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les schémas partagés comprennent aussi des comparaisons, à la compilation, entre les types qu&#39;ils produisent et les interfaces écrites séparément. Cela rend un changement de modèle visible des deux côtés du passage CMS vers site. Sans ce lien, un champ pourrait apparaître dans une interprétation et disparaître dans l&#39;autre.',
								},
								id: '5390da91a01bc00f-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les tests d&#39;export couvrent notamment un aperçu non autorisé qui tente une lecture récente, une limite de temps dépassée, un média local absent et un résultat non live soumis à la politique stricte. Les tests de la carte vérifient qu&#39;un clic d&#39;en-tête bascule une seule fois, qu&#39;un élément interactif conserve son action et que le bouton garde sa sémantique d&#39;expansion. Ces questions sont utiles parce qu&#39;elles correspondent à des erreurs identifiables.',
								},
								id: '68baf6fdfe080d0d-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le workflow web vérifie les types, les tests unitaires, l&#39;intégrité du contenu généré, l&#39;intégrité des ressources de design copiées, les tokens du produit, le paquet partagé, la génération et la quantité de code envoyée au navigateur. Il prévoit aussi une étape de tests dans le navigateur. Le CMS possède ses propres validations et opérations. Cette organisation décrit la façon de travailler; une version précise a encore besoin de ses propres résultats.',
								},
								id: '99a32b95c649cb88-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Il faut particulièrement bien expliquer l&#39;intégrité du contenu généré. Le manifeste contient une empreinte SHA-256 pour chaque fichier produit. Si le fichier change sans mise à jour correspondante, la vérification peut détecter la différence. Le manifeste indique aussi si l&#39;export utilisait des données récentes ou un cache.',
								},
								id: 'e12b0b6f890d1e96-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Une empreinte ne juge pas la justesse d&#39;un paragraphe. Si quelqu&#39;un modifiait le fichier et son empreinte, leur correspondance ne prouverait pas indépendamment que le contenu provient du CMS. Le contrôle aide à repérer les écarts; le processus de publication et la révision restent responsables de la provenance.',
								},
								id: '2e003271af7f90ee-5',
								type: 'paragraph',
							},
							{
								data: {
									text: 'C&#39;est pourquoi une affirmation précise, comme « ce test exerce un échec d&#39;export », m&#39;intéresse davantage qu&#39;un grand nombre de tests présenté comme une note de qualité. Le nombre ne dit pas quelle erreur compte, ce qui a été vérifié ni ce sur quoi le lecteur peut s&#39;appuyer.',
								},
								id: '30aed6fceac3df9b-6',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'What the checks can actually tell me',
					es: 'Qué pueden decirme las verificaciones',
					fr: 'Ce que les vérifications permettent réellement de savoir',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'When a page is wrong, I need to identify which layer is wrong before editing it. The CMS record may contain old wording. The exported module may not include the newest edit. The website may have built successfully without that export. Or the public address may still be serving a different deployment. These are different situations with different remedies.',
								},
								id: '46f959c4a5ab97c7-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'For example, suppose a corrected title appears in Directus but not on the public page. I would first establish which language record was edited, which content source the export reported, and which build and deployment the page belongs to. Rewriting the page component at that point could conceal a publishing problem rather than solve it.',
								},
								id: '3386d832788ff60b-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Schema operations deserve a separate path from ordinary editorial changes. The repository contains CMS snapshots and tooling to compare the intended configuration with a target environment. Applying a schema change can affect fields, relationships, or existing data. The workflow therefore separates validation and read-only comparisons from explicit operational actions. Changing a paragraph is not the same operation as changing the structure that stores it.',
								},
								id: 'd0c9cfd72500f0b4-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Development and production also have different purposes. A development environment is useful for inspecting a change before it reaches the public site. A production operation needs the right target, the intended scope, and evidence of what happened. A successful local demonstration should not quietly become a claim about production.',
								},
								id: '177cf6d100b75c75-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The shared design boundary adds another maintenance question. If a problem is in a primitive used across products, fixing only the consumer copy can create drift. If the problem is specific to this site&#39;s project layout, moving it into the shared package may spread a product assumption elsewhere. The location of the fix is part of the design.',
								},
								id: 'a842348d7615bf6e-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'This is the operating side of owning the website: being able to explain where content comes from, where a change belongs, what the checks establish, and what must happen before visitors see a new version.',
								},
								id: 'ca142e22431190b7-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Cuando una página está mal, primero necesito identificar en qué parte está el problema. El registro del CMS puede conservar el texto anterior. El módulo exportado puede no incluir la última edición. El sitio puede haberse construido correctamente sin ese nuevo exportado. O la dirección pública puede seguir mostrando otro despliegue. Son situaciones diferentes y requieren correcciones diferentes.',
								},
								id: '08e4966179d29611-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Supongamos que un título corregido aparece en Directus, pero no en la página pública. Primero establecería qué registro de idioma se editó, qué origen de datos informó la exportación y a qué construcción y despliegue pertenece la página. Reescribir el componente en ese momento podría esconder un problema de publicación.',
								},
								id: '3ff68c668161921b-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Las operaciones sobre el esquema requieren un recorrido distinto al de las correcciones editoriales. El repositorio contiene configuraciones del CMS y herramientas para comparar la estructura prevista con un entorno de destino. Aplicar un cambio puede afectar campos, relaciones o datos existentes. Por eso el flujo separa la validación y las comparaciones de solo lectura de las acciones operativas explícitas. Corregir un párrafo no es la misma operación que cambiar la estructura que lo almacena.',
								},
								id: 'e14e98e17dae7919-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Desarrollo y producción también tienen funciones distintas. Un entorno de desarrollo sirve para revisar un cambio antes de que llegue al sitio público. Una operación en producción necesita el destino correcto, un alcance definido y evidencia de lo ocurrido. Una demostración local exitosa no debería convertirse silenciosamente en una afirmación sobre producción.',
								},
								id: 'e5b672ebe774876d-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'El diseño compartido agrega otra pregunta de mantenimiento. Si el problema está en un componente básico usado por varios productos, corregir solo la copia de este sitio puede crear una desviación. Si el problema pertenece únicamente a la distribución de proyectos, moverlo al paquete común puede llevar una suposición del producto a otros contextos. El lugar donde se hace la corrección forma parte del diseño.',
								},
								id: '6b0a49f35e371797-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ese es el lado operativo de hacerse cargo de la web: explicar de dónde sale el contenido, dónde corresponde intervenir, qué establecen las verificaciones y qué debe pasar antes de que los visitantes vean una versión nueva.',
								},
								id: '89ef7441600507c7-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Quand une page est incorrecte, je dois d&#39;abord trouver où se situe le problème. Le CMS peut encore contenir l&#39;ancien texte. Le module exporté peut ne pas inclure la dernière modification. Le site peut avoir été généré sans cet export. Ou l&#39;adresse publique peut encore servir un autre déploiement. Ces situations demandent des corrections différentes.',
								},
								id: '4af88bbb3705cb1b-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Supposons qu&#39;un titre corrigé apparaisse dans Directus, mais pas sur la page publique. Je commencerais par identifier la langue modifiée, la source annoncée par l&#39;export et la génération ainsi que le déploiement auxquels la page appartient. Réécrire le composant à ce moment pourrait masquer un problème de publication.',
								},
								id: '163db64e35ed3b15-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les opérations sur le schéma doivent suivre un chemin distinct des changements éditoriaux. Le dépôt contient des états de configuration du CMS et des outils pour comparer la structure voulue à un environnement cible. Une modification peut toucher des champs, des relations ou des données existantes. Le workflow sépare donc les validations et comparaisons en lecture seule des actions opérationnelles explicites. Corriger un paragraphe n&#39;est pas la même opération que modifier la structure qui le conserve.',
								},
								id: '626f987ebcfa9c2e-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le développement et la production ont aussi des rôles différents. Un environnement de développement sert à examiner un changement avant son arrivée sur le site public. Une opération en production exige la bonne cible, un périmètre défini et une trace de ce qui s&#39;est passé. Une démonstration locale réussie ne devient pas automatiquement une preuve de fonctionnement en production.',
								},
								id: '941196d5c93235f6-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Le design partagé ajoute une autre question d&#39;entretien. Si le problème vient d&#39;un composant de base utilisé par plusieurs produits, corriger seulement sa copie dans ce site peut créer un écart. Si le problème concerne uniquement la mise en page des projets, déplacer la correction dans le paquet commun peut y introduire une hypothèse propre au produit. L&#39;emplacement de la correction fait partie de la décision.',
								},
								id: 'fedb5a82fe3cb27c-4',
								type: 'paragraph',
							},
							{
								data: {
									text: 'C&#39;est le côté opérationnel de la responsabilité du site : expliquer d&#39;où vient le contenu, où intervenir, ce que les vérifications établissent et ce qui doit se produire avant que les visiteurs voient une nouvelle version.',
								},
								id: '494285384cc17611-5',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Maintaining the site means locating the change',
					es: 'Mantener el sitio exige ubicar el cambio',
					fr: 'Entretenir le site, c\'est situer le changement',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									text: 'AI tools contributed to implementation and review. In my published account of this project, I describe Claude as the main implementation tool and Codex as a reviewer that also sometimes helped implement changes. I directed the architecture, maintained the project context, and reviewed what came back.',
								},
								id: '46308f0e82a1e9b2-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'One example was the content boundary. A sentence written directly inside a page component can look identical to a sentence coming from the CMS. I found shared copy still in the frontend when the chosen model said it should be editable in the CMS. Looking at the page was not enough to see that difference; I had to follow the data through the files.',
								},
								id: '29a0c9f2a0b37356-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'That example connects the domains described here. The visible result belonged to the website, the intended source belonged to the editor, and the missing connection belonged to the transformation and export path. Calling the page “finished” because it looked correct would have missed the actual requirement.',
								},
								id: '653c548f6baffeb2-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'The short code excerpts are useful for the same reason. The section schema shows what an editor-controlled section can contain. The export decision shows when fallback content must fail a build. The registered contact values show what the interface intends to carry across a language change. Each excerpt supports a limited explanation that can be checked against the surrounding implementation.',
								},
								id: 'd80196597c5723b0-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'I do not need to claim that I typed every line to take responsibility for the result. I do need to understand the decisions I am presenting, examine changes rather than accept them by appearance, and recognise where further investigation is needed. Generated code, third-party packages, shared components, and my own decisions all contribute to the product; my review has to account for their interaction.',
								},
								id: '64da2e63ac9a8184-4',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									text: 'Las herramientas de IA participaron en la implementación y la revisión. En el artículo que publiqué sobre este proyecto, describo a Claude como la herramienta principal de implementación y a Codex como una herramienta de revisión que también ayudó con algunos cambios. Yo dirigía la arquitectura, mantenía el contexto del proyecto y revisaba los resultados.',
								},
								id: 'a3f7c32d4c91df7f-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La separación del contenido ofrece un ejemplo. Una frase escrita directamente en un componente puede verse igual que una frase que llega del CMS. Encontré textos compartidos que todavía estaban en el frontend, aunque el modelo elegido indicaba que debían editarse en el CMS. Mirar la página no bastaba para encontrar la diferencia; había que seguir los datos en los archivos.',
								},
								id: '3b037d405b181558-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Ese ejemplo conecta las áreas descritas aquí. El resultado visible pertenecía a la web, la fuente prevista pertenecía al editor y el vínculo faltante correspondía a la transformación y exportación. Dar la página por terminada porque se veía bien habría dejado sin resolver el requisito real.',
								},
								id: '9f55ecb5375a9af2-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Los fragmentos cortos de código sirven por la misma razón. El esquema muestra qué puede contener una sección controlada desde el editor. La decisión de exportación muestra cuándo los datos de respaldo deben detener una construcción. Los valores registrados del formulario muestran qué información se prevé trasladar al cambiar de idioma. Cada fragmento sostiene una explicación limitada que se puede contrastar con la implementación que lo rodea.',
								},
								id: '5955bc11f20e8227-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'No necesito decir que escribí manualmente cada línea para asumir la responsabilidad del resultado. Sí necesito entender las decisiones que presento, revisar los cambios en vez de aceptarlos por su apariencia y reconocer dónde hace falta investigar más. El código generado, los paquetes externos, los componentes compartidos y mis decisiones contribuyen al producto. Mi revisión tiene que considerar cómo se relacionan.',
								},
								id: 'e36489b62c30667d-4',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									text: 'Des outils d&#39;IA ont participé à l&#39;implémentation et à la révision. Dans mon article publié sur ce projet, je présente Claude comme l&#39;outil principal d&#39;implémentation et Codex comme un outil de révision qui a aussi aidé à certaines modifications. Je dirigeais l&#39;architecture, gardais le contexte du projet et examinais les résultats.',
								},
								id: '09921b3923b9ca36-0',
								type: 'paragraph',
							},
							{
								data: {
									text: 'La frontière du contenu en donne un exemple. Une phrase inscrite directement dans un composant peut avoir exactement la même apparence qu&#39;une phrase provenant du CMS. J&#39;ai trouvé des textes partagés encore présents dans le frontend alors que le modèle choisi prévoyait leur édition dans le CMS. Regarder la page ne suffisait pas : il fallait suivre les données dans les fichiers.',
								},
								id: '8070848ab2cb0b2e-1',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Cet exemple relie les domaines décrits ici. Le résultat visible appartenait au site, la source souhaitée appartenait à l&#39;outil d&#39;édition et le lien manquant concernait le traitement ainsi que l&#39;export. Dire que la page était terminée parce qu&#39;elle semblait correcte aurait manqué l&#39;exigence.',
								},
								id: 'bdf5583fdf0eb4cf-2',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Les courts extraits de code servent le même objectif. Le schéma montre le contenu possible d&#39;une section contrôlée par l&#39;éditeur. La décision d&#39;export montre quand des données de remplacement doivent faire échouer une génération. Les valeurs inscrites du formulaire montrent ce que l&#39;interface prévoit transporter au changement de langue. Chaque extrait soutient une explication limitée, qu&#39;on peut comparer au code qui l&#39;entoure.',
								},
								id: '4d0cc91b1c962011-3',
								type: 'paragraph',
							},
							{
								data: {
									text: 'Je n&#39;ai pas besoin de prétendre avoir tapé chaque ligne pour assumer la responsabilité du résultat. Je dois comprendre les décisions présentées, examiner les modifications plutôt que les accepter à leur apparence et reconnaître ce qui demande davantage d&#39;étude. Le code généré, les paquets externes, les composants partagés et mes décisions contribuent tous au produit. Ma révision doit tenir compte de leurs interactions.',
								},
								id: 'eaffb533dba96611-4',
								type: 'paragraph',
							},
						],
						time: 1791442800000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'My role, including the tools I use',
					es: 'Mi responsabilidad y las herramientas que uso',
					fr: 'Mon rôle et les outils que j\'utilise',
				},
			},
			{
				content: {
					en: {
						blocks: [
							{
								data: {
									caption: 'English contact page, desktop viewport, empty form. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: 'd3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										fileURL: '/files/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-1d2884854b51-03-contact-en-desktop-1440x1000-production.jpg',
										size: '109160',
										url: '/assets/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'd1b67cd88b62c678',
								type: 'image',
							},
							{
								data: {
									caption: 'French contact page, intermediate viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: '228505cb-56af-4738-944a-143bb5d8480c',
										fileURL: '/files/228505cb-56af-4738-944a-143bb5d8480c',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-b9c103bb93a7-04-contact-fr-intermediate-768x1024-production.jpg',
										size: '64618',
										url: '/assets/228505cb-56af-4738-944a-143bb5d8480c',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '576cc0c9346ebcda',
								type: 'image',
							},
							{
								data: {
									caption: 'Spanish contact page, upper mobile viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: 'a6e172a5-a284-4fb6-af79-6cfe88eee815',
										fileURL: '/files/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-dfb0c3e42599-05-contact-es-mobile-390x844-production.jpg',
										size: '40517',
										url: '/assets/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '98485b03e30a07f2',
								type: 'image',
							},
							{
								data: {
									caption: 'Spanish contact page, empty form in a scrolled mobile viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: 'eac07303-eacd-48d3-ac65-632a23a4677c',
										fileURL: '/files/eac07303-eacd-48d3-ac65-632a23a4677c',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-fcea6af36630-06-contact-form-es-mobile-390x844-production.jpg',
										size: '32356',
										url: '/assets/eac07303-eacd-48d3-ac65-632a23a4677c',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '52fd284c9d6d433e',
								type: 'image',
							},
							{
								data: {
									caption: 'English tools page, mobile viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: 'c758fd83-ac47-4c2b-a293-a9051e74199d',
										fileURL: '/files/c758fd83-ac47-4c2b-a293-a9051e74199d',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-6f036fd51cb1-07-stack-en-mobile-390x844-production.jpg',
										size: '42761',
										url: '/assets/c758fd83-ac47-4c2b-a293-a9051e74199d',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'a4bc6bd4c48f8f6c',
								type: 'image',
							},
							{
								data: {
									caption: 'Spanish tools page, intermediate viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: '162f42a4-658c-438b-bdab-cf11218be18e',
										fileURL: '/files/162f42a4-658c-438b-bdab-cf11218be18e',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-66b70f580633-08-stack-es-intermediate-768x1024-production.jpg',
										size: '92980',
										url: '/assets/162f42a4-658c-438b-bdab-cf11218be18e',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'b8d781b1daf23302',
								type: 'image',
							},
							{
								data: {
									caption: 'French tools page, desktop viewport. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: '42024627-5dab-496e-9d69-18387300802e',
										fileURL: '/files/42024627-5dab-496e-9d69-18387300802e',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-d02fc26ce7ee-09-stack-fr-desktop-1440x1000-production.jpg',
										size: '138079',
										url: '/assets/42024627-5dab-496e-9d69-18387300802e',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '70ce2a2f8b48cd77',
								type: 'image',
							},
							{
								data: {
									caption: 'French Blueprint, an educational website scenario rather than a delivered client architecture. Browser capture, 8 October 2026; not a physical-device test. No form submitted.',
									file: {
										extension: 'jpg',
										fileId: 'f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										fileURL: '/files/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-01776a8a2c64-10-stack-blueprint-fr-desktop-1440x1000-production.jpg',
										size: '115299',
										url: '/assets/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '2a4d82e7391397e4',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					es: {
						blocks: [
							{
								data: {
									caption: 'Página de contacto en inglés, vista de escritorio, formulario vacío. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: 'd3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										fileURL: '/files/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-1d2884854b51-03-contact-en-desktop-1440x1000-production.jpg',
										size: '109160',
										url: '/assets/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'e7494b58ec54a54f',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de contacto en francés, vista intermedia. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: '228505cb-56af-4738-944a-143bb5d8480c',
										fileURL: '/files/228505cb-56af-4738-944a-143bb5d8480c',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-b9c103bb93a7-04-contact-fr-intermediate-768x1024-production.jpg',
										size: '64618',
										url: '/assets/228505cb-56af-4738-944a-143bb5d8480c',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'c88260d6626a74c3',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de contacto en español, parte superior de la vista móvil. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: 'a6e172a5-a284-4fb6-af79-6cfe88eee815',
										fileURL: '/files/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-dfb0c3e42599-05-contact-es-mobile-390x844-production.jpg',
										size: '40517',
										url: '/assets/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '93fddda275f7ec98',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de contacto en español, formulario vacío en una vista móvil desplazada. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: 'eac07303-eacd-48d3-ac65-632a23a4677c',
										fileURL: '/files/eac07303-eacd-48d3-ac65-632a23a4677c',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-fcea6af36630-06-contact-form-es-mobile-390x844-production.jpg',
										size: '32356',
										url: '/assets/eac07303-eacd-48d3-ac65-632a23a4677c',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '5f386c3ce180d9ae',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de herramientas en inglés, vista móvil. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: 'c758fd83-ac47-4c2b-a293-a9051e74199d',
										fileURL: '/files/c758fd83-ac47-4c2b-a293-a9051e74199d',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-6f036fd51cb1-07-stack-en-mobile-390x844-production.jpg',
										size: '42761',
										url: '/assets/c758fd83-ac47-4c2b-a293-a9051e74199d',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '3f106c912d58dec0',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de herramientas en español, vista intermedia. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: '162f42a4-658c-438b-bdab-cf11218be18e',
										fileURL: '/files/162f42a4-658c-438b-bdab-cf11218be18e',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-66b70f580633-08-stack-es-intermediate-768x1024-production.jpg',
										size: '92980',
										url: '/assets/162f42a4-658c-438b-bdab-cf11218be18e',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '8cc261b67d0aeea8',
								type: 'image',
							},
							{
								data: {
									caption: 'Página de herramientas en francés, vista de escritorio. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: '42024627-5dab-496e-9d69-18387300802e',
										fileURL: '/files/42024627-5dab-496e-9d69-18387300802e',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-d02fc26ce7ee-09-stack-fr-desktop-1440x1000-production.jpg',
										size: '138079',
										url: '/assets/42024627-5dab-496e-9d69-18387300802e',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '3e26cd925ace9a4d',
								type: 'image',
							},
							{
								data: {
									caption: 'Blueprint en francés, escenario didáctico de un sitio web, no una arquitectura entregada a un cliente. Captura de navegador del 8 de octubre de 2026; no es una prueba en un dispositivo físico. No se envió ningún formulario.',
									file: {
										extension: 'jpg',
										fileId: 'f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										fileURL: '/files/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-01776a8a2c64-10-stack-blueprint-fr-desktop-1440x1000-production.jpg',
										size: '115299',
										url: '/assets/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '07d17eb343e97779',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
					fr: {
						blocks: [
							{
								data: {
									caption: 'Page contact en anglais, viewport bureau, formulaire vide. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: 'd3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										fileURL: '/files/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-1d2884854b51-03-contact-en-desktop-1440x1000-production.jpg',
										size: '109160',
										url: '/assets/d3cbe8e0-6eef-4bd3-be7b-ec11920c85c1',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '3015baf5e6502790',
								type: 'image',
							},
							{
								data: {
									caption: 'Page contact en français, viewport intermédiaire. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: '228505cb-56af-4738-944a-143bb5d8480c',
										fileURL: '/files/228505cb-56af-4738-944a-143bb5d8480c',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-b9c103bb93a7-04-contact-fr-intermediate-768x1024-production.jpg',
										size: '64618',
										url: '/assets/228505cb-56af-4738-944a-143bb5d8480c',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'af0b8780a10c34d8',
								type: 'image',
							},
							{
								data: {
									caption: 'Page contact en espagnol, haut du viewport mobile. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: 'a6e172a5-a284-4fb6-af79-6cfe88eee815',
										fileURL: '/files/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-dfb0c3e42599-05-contact-es-mobile-390x844-production.jpg',
										size: '40517',
										url: '/assets/a6e172a5-a284-4fb6-af79-6cfe88eee815',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '40e39f26f2edb0da',
								type: 'image',
							},
							{
								data: {
									caption: 'Page contact en espagnol, formulaire vide dans un viewport mobile défilé. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: 'eac07303-eacd-48d3-ac65-632a23a4677c',
										fileURL: '/files/eac07303-eacd-48d3-ac65-632a23a4677c',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-fcea6af36630-06-contact-form-es-mobile-390x844-production.jpg',
										size: '32356',
										url: '/assets/eac07303-eacd-48d3-ac65-632a23a4677c',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '7de7661dbf0ec9ec',
								type: 'image',
							},
							{
								data: {
									caption: 'Page des outils en anglais, viewport mobile. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: 'c758fd83-ac47-4c2b-a293-a9051e74199d',
										fileURL: '/files/c758fd83-ac47-4c2b-a293-a9051e74199d',
										height: 822,
										name: 'portfolio-20261008-yesid-dev-6f036fd51cb1-07-stack-en-mobile-390x844-production.jpg',
										size: '42761',
										url: '/assets/c758fd83-ac47-4c2b-a293-a9051e74199d',
										width: 380,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '38b465747a138550',
								type: 'image',
							},
							{
								data: {
									caption: 'Page des outils en espagnol, viewport intermédiaire. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: '162f42a4-658c-438b-bdab-cf11218be18e',
										fileURL: '/files/162f42a4-658c-438b-bdab-cf11218be18e',
										height: 1011,
										name: 'portfolio-20261008-yesid-dev-66b70f580633-08-stack-es-intermediate-768x1024-production.jpg',
										size: '92980',
										url: '/assets/162f42a4-658c-438b-bdab-cf11218be18e',
										width: 758,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'c17b9e7b74dc447e',
								type: 'image',
							},
							{
								data: {
									caption: 'Page des outils en français, viewport bureau. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: '42024627-5dab-496e-9d69-18387300802e',
										fileURL: '/files/42024627-5dab-496e-9d69-18387300802e',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-d02fc26ce7ee-09-stack-fr-desktop-1440x1000-production.jpg',
										size: '138079',
										url: '/assets/42024627-5dab-496e-9d69-18387300802e',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: '006791000d1c2d4e',
								type: 'image',
							},
							{
								data: {
									caption: 'Blueprint en français, scénario pédagogique de site web, pas une architecture livrée à un client. Capture de navigateur du 8 octobre 2026; pas un test sur appareil physique. Aucun formulaire soumis.',
									file: {
										extension: 'jpg',
										fileId: 'f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										fileURL: '/files/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										height: 993,
										name: 'portfolio-20261008-yesid-dev-01776a8a2c64-10-stack-blueprint-fr-desktop-1440x1000-production.jpg',
										size: '115299',
										url: '/assets/f197e2c7-44e3-40a8-a51d-3d52bd6f92c8',
										width: 1430,
									},
									stretched: false,
									withBackground: false,
									withBorder: false,
								},
								id: 'a3645a50031b957f',
								type: 'image',
							},
						],
						time: 1791432000000,
						version: '2.31.2',
					},
				},
				title: {
					en: 'Images and context',
					es: 'Imágenes y contexto',
					fr: 'Images et contexte',
				},
			},
		],
		slug: 'yesid-dev',
		stack: [
			'SvelteKit',
			'Svelte 5',
			'TypeScript',
			'Tailwind CSS',
			'GSAP',
			'Directus',
			'Neon',
			'Bun',
			'Turbo',
			'Vercel',
			'GitHub Actions',
			'Playwright',
			'Vitest',
		],
		status: 'public',
		tags: ['portfolio', 'web', 'svelte', 'cms', 'bilingual'],
		title: {
			en: 'yesid.dev: explaining how the pieces fit',
			es: 'yesid.dev: explicar cómo se conectan las partes',
			fr: 'yesid.dev : expliquer comment les morceaux s’assemblent',
		},
	},
];
