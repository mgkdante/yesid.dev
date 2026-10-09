// ----------------------------------------------------------------------
// GENERATED FILE - do not edit by hand.
//
// Block Editor body per published blog post, keyed by slug. Powers static blog.bodyBySlug + blog.html (serializeBlocksToHtml).
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { BlockEditorDoc } from '$lib/types';

export const blogBodies: Readonly<Record<string, BlockEditorDoc>> = {
	'50-to-0-an-oracle-always-free-vm': {
		blocks: [
			{
				data: {
					text: 'A worker in <a href="https://transit.yesid.dev">Transit</a> targets a 30-second start-to-start cadence as it asks the STM feeds for the latest trip and vehicle data. When Postgres ran on Neon and the worker ran on Railway, those two managed services cost me about $50 to $60 per month.',
				},
				id: 'ch5-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I moved the database and worker to an existing Oracle A1 Flex VM. As of July 2026, that VM costs me $0 under the A1 allowance attached to my PAYG account. The rest of Transit still uses infrastructure outside the VM, and Oracle\'s limits for new accounts may differ. This is a case study of my setup, not a recipe.',
				},
				id: 'ch5-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The move' },
				id: 'ch5-003',
				type: 'header',
			},
			{
				data: {
					text: 'My VM is in Montréal. It has 4 OCPUs, about 24 GB of RAM, and a 200 GB-class disk. Five services run there: Postgres with PostGIS, the realtime worker, a separate database pruner, a health API, and Caddy. The database and worker moved off Neon and Railway; the external parts of Transit did not move onto this box.',
				},
				id: 'ch5-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Low recurring cost matters because Transit is a long-lived public portfolio and civic-data project. A smaller bill makes it easier for me to keep operating it, but I did not remove cost from the system. I exchanged managed-service spend for a tighter machine boundary and more work of my own.',
				},
				id: 'ch5-005',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What 200 GB forced me to decide' },
				id: 'ch5-006',
				type: 'header',
			},
			{
				data: {
					text: 'At a historical peak, one realtime table held roughly half a billion rows and the Postgres volume reached about 139 GB. Those numbers are old scale receipts, not today\'s database size. On a 200 GB-class disk, keeping detail indefinitely was not an option.',
				},
				id: 'ch5-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The raw archive already existed. The cap forced me to make the retention budget explicit. As verified in July 2026, the live relational Silver layer keeps one day. Raw realtime GTFS-RT snapshots stay off-box in R2 for 90 days. Detailed Gold facts keep 14 days, while smaller rollups keep 730 days.',
				},
				id: 'ch5-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'A separate database pruner handles Silver and Gold cleanup outside the capture loop. It does not prune the R2 archive. For a selected archived window, I have tested rebuilding realtime Silver and its derived Gold delay facts. That proves one recovery path, not a universal rebuild.',
				},
				id: 'ch5-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Static and historic snapshots use content hashes to skip unchanged files, while the live tier publishes every cycle. Together, the storage roles are explicit: live relational data stays query-ready, raw realtime data stays replayable off-box, and smaller rollups keep the long view.',
				},
				id: 'ch5-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: '$0 is not zero work' },
				id: 'ch5-011',
				type: 'header',
			},
			{
				data: {
					text: 'Leaving managed services transferred responsibility to me. I own the backups, restore testing, monitoring, patching, capacity decisions, and incident response. The off-box logical backup intentionally excludes the largest replayable realtime Silver table, so recovery combines the backup with raw realtime replay. I have also run a restore drill against a separate database environment instead of treating the existence of a backup file as proof.',
				},
				id: 'ch5-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is still one VM. If its host fails, the database and always-on pipeline are down while I restore or move the workload. The off-box site and existing snapshots can remain available, but their live data stops refreshing. There is no automatic failover.',
				},
				id: 'ch5-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The backup and replay paths reduce data-loss risk without creating high availability. That is the actual trade: lower vendor spend transferred more operational ownership to me.',
				},
				id: 'ch5-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Rented land' },
				id: 'ch5-015',
				type: 'header',
			},
			{
				data: {
					text: 'Oracle controls the allowance and can change its terms. Anyone making a similar decision needs to check the current documentation instead of copying my July 2026 configuration.',
				},
				id: 'ch5-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I reduced the switching cost; I did not eliminate it. The VM services are containerized, database access is configuration-driven, and the raw realtime data and logical backups live off the VM. I have not yet tested a full provider migration. If Oracle changes the deal, moving will still take work, but the recovery inputs are not trapped on the host.',
				},
				id: 'ch5-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The same question shaped my website: what must stay live, and what can move out of the request path? Its content lives in a CMS that the live site never calls.',
				},
				id: 'ch5-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 5 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Previous: <a href="/blog/ai-accelerated-human-owned-my-actual-workflow">AI-accelerated, human-owned: my actual workflow</a> · Next: <a href="/blog/does-your-website-need-instant-publishing">Does your website need instant publishing?</a>.',
				},
				id: 'ch5-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400004,
		version: '2.31.2',
	},
	'accelere-par-lia-pilote-par-lhumain-mon-vrai-flux-de-travail': {
		blocks: [
			{
				data: { level: 2, text: 'Le piège' },
				id: 'ch4-fr-001',
				type: 'header',
			},
			{
				data: {
					text: 'Au début du travail sur <a href="https://yesid.dev">yesid.dev</a>, j’ai fixé une frontière claire pour le CMS : le contenu d’interface commun et répété devait venir du CMS plutôt que de rester dans les fichiers du frontend. Claude a produit l’implémentation, et j’ai vérifié les fichiers par rapport à cette frontière. J’y ai trouvé du texte partagé encore codé en dur dans le frontend. Du texte codé en dur et du texte alimenté par un CMS peuvent produire les mêmes pixels. Une vérification dans le navigateur prouve que la page s’affiche, pas quel système en est responsable. La vérification des fichiers a montré que l’implémentation ne respectait pas encore le modèle de contenu que j’avais choisi.',
				},
				id: 'ch4-fr-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La répartition du travail' },
				id: 'ch4-fr-003',
				type: 'header',
			},
			{
				data: {
					text: 'Claude était mon principal outil d’implémentation pour <a href="https://yesid.dev">yesid.dev</a> et <a href="https://transit.yesid.dev">transit.yesid.dev</a>. Codex a surtout révisé le travail et a parfois pris le relais pour l’implémentation. J’ai supervisé les deux projets de A à Z et pris les décisions d’architecture. J’ai gardé le contexte des projets, décidé comment les différentes parties devaient s’intégrer, donné des directives, inspecté les résultats, trouvé les problèmes et fait avancer le travail.',
				},
				id: 'ch4-fr-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le travail s’est rapproché de la direction de projet. Au lieu d’écrire le code moi-même pour chaque implémentation, je dirigeais les projets, gardais l’architecture en tête et vérifiais les résultats.',
				},
				id: 'ch4-fr-005',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Les contrôles en place aujourd’hui' },
				id: 'ch4-fr-006',
				type: 'header',
			},
			{
				data: {
					text: 'Le dépôt de <a href="https://yesid.dev">yesid.dev</a> comporte aujourd’hui des contrôles automatisés du contenu généré et des avertissements Svelte. Le hook de précommit et la CI des PR comparent les modules générés par le CMS au manifeste qui les répertorie. La CI des PR exécute ce contrôle pour les pull requests visant <code>main</code> ou <code>develop</code>. La comparaison détecte les écarts ordinaires entre les modules et le manifeste, mais elle vérifie leur cohérence, pas si le CMS a réellement produit les fichiers. Le hook local peut ne pas être exécuté, et une modification coordonnée d’un module et du manifeste peut tout de même les laisser cohérents.',
				},
				id: 'ch4-fr-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La vérification web utilise un verrou configurable sur le nombre d’avertissements, précisément pour Svelte. Elle échoue lorsque les avertissements signalés dépassent ce seuil. Ces vérifications couvrent des conditions reproductibles dans le dépôt. Elles ne décident pas si l’architecture du CMS est la bonne ni si un contenu appartient au frontend. Cela reste une décision liée au projet et à l’architecture.',
				},
				id: 'ch4-fr-008',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Comment cet article a été créé' },
				id: 'ch4-fr-009',
				type: 'header',
			},
			{
				data: {
					text: 'Mon processus commence par une conversation où mes idées partent dans tous les sens. L’IA organise la matière en une structure et propose des formulations bloc par bloc. Un article ne porte mon nom qu’après que j’en ai vérifié et corrigé la structure, les affirmations et le choix des mots, intégré ces corrections dans une autre ébauche produite par l’IA, lu chaque bloc de A à Z et décidé ce qui reste.',
				},
				id: 'ch4-fr-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Le test du client' },
				id: 'ch4-fr-011',
				type: 'header',
			},
			{
				data: {
					text: 'Si un client veut savoir si je comprends ce que je publie, qu’il m’interroge sur n’importe quel élément de ce site.',
				},
				id: 'ch4-fr-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L’IA est un outil parmi tant d’autres. Elle n’est pas le résultat final. Les résultats sont <a href="https://yesid.dev">yesid.dev</a>, <a href="https://transit.yesid.dev">transit.yesid.dev</a> et les systèmes qui font fonctionner leur contenu et leurs services.',
				},
				id: 'ch4-fr-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Après avoir déployé Transit, j’ai aussi dû le maintenir en fonction et payer la facture mensuelle d’infrastructure.',
				},
				id: 'ch4-fr-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 4 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Précédent : <a href="/fr/blog/penser-en-matrices">Penser en matrices</a> · Suivant : <a href="/fr/blog/de-50-a-0-une-vm-oracle-always-free">De 50 $ à 0 $ : une VM Oracle Always Free</a>.',
				},
				id: 'ch4-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400003,
		version: '2.31.2',
	},
	'acelerado-por-ia-en-manos-humanas-mi-flujo-de-trabajo-real': {
		blocks: [
			{
				data: { level: 2, text: 'La trampa' },
				id: 'ch4-es-001',
				type: 'header',
			},
			{
				data: {
					text: 'Al principio del trabajo en <a href="https://yesid.dev">yesid.dev</a>, elegí un límite claro para el CMS: el contenido compartido y recurrente de la interfaz debía venir del CMS en lugar de permanecer en archivos del frontend. Claude produjo la implementación, y yo revisé los archivos para comprobar si respetaban ese límite. Encontré texto compartido que seguía incrustado directamente en el frontend. El texto incrustado y el texto administrado por el CMS pueden producir los mismos píxeles. Una revisión en el navegador demuestra que la página se renderiza, no qué sistema es responsable del contenido. La revisión de los archivos mostró que la implementación todavía no coincidía con el modelo de contenido que yo había elegido.',
				},
				id: 'ch4-es-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La división del trabajo' },
				id: 'ch4-es-003',
				type: 'header',
			},
			{
				data: {
					text: 'Claude fue mi principal herramienta de implementación para <a href="https://yesid.dev">yesid.dev</a> y <a href="https://transit.yesid.dev">transit.yesid.dev</a>. Codex se encargó sobre todo de revisar el trabajo y, a veces, intervino como implementador de respaldo. Yo supervisé ambos proyectos de principio a fin y tomé las decisiones de arquitectura. Mantuve el contexto de los proyectos, decidí cómo debían encajar las partes, di instrucciones, inspeccioné los resultados, encontré problemas e hice avanzar el trabajo.',
				},
				id: 'ch4-es-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El trabajo pasó a ser más de gestión. En lugar de escribir yo mismo el código de cada implementación, dirigía los proyectos, mantenía la arquitectura a la vista y revisaba lo que recibía.',
				},
				id: 'ch4-es-005',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Los controles actuales' },
				id: 'ch4-es-006',
				type: 'header',
			},
			{
				data: {
					text: 'El repositorio de <a href="https://yesid.dev">yesid.dev</a> también cuenta hoy con verificaciones automatizadas del contenido generado y las advertencias de Svelte. El hook de pre-commit y la CI de los PR comparan los módulos generados por el CMS con el manifiesto registrado. La CI de los PR ejecuta esta verificación para los pull requests dirigidos a <code>main</code> o <code>develop</code>. La comparación detecta las diferencias normales entre los módulos y el manifiesto, pero comprueba su coherencia, no si el CMS realmente produjo los archivos. El hook local puede omitirse, y una edición coordinada del módulo y el manifiesto puede hacer que ambos sigan coincidiendo.',
				},
				id: 'ch4-es-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La verificación web usa un umbral configurable específicamente para las advertencias de Svelte. Falla cuando el número de advertencias reportadas supera ese umbral. Estos controles cubren condiciones reproducibles del repositorio. No deciden si la arquitectura del CMS es correcta ni si un contenido debe estar en el frontend. Esa sigue siendo una decisión de proyecto y arquitectura.',
				},
				id: 'ch4-es-008',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Cómo se hizo este artículo' },
				id: 'ch4-es-009',
				type: 'header',
			},
			{
				data: {
					text: 'Mi proceso empieza con una conversación y mis divagaciones. La IA organiza el material en un esqueleto y propone redacción por bloques. Un artículo lleva mi nombre solo después de que reviso y corrijo la estructura, las afirmaciones y la redacción, uso esas correcciones en otro borrador de IA, leo cada bloque de principio a fin y decido qué queda.',
				},
				id: 'ch4-es-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La prueba del cliente' },
				id: 'ch4-es-011',
				type: 'header',
			},
			{
				data: {
					text: 'Si un cliente quiere saber si entiendo lo que publico, que me pregunte sobre cualquier cosa de este sitio.',
				},
				id: 'ch4-es-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La IA es una herramienta entre muchas. No es el resultado final. Los resultados son <a href="https://yesid.dev">yesid.dev</a>, <a href="https://transit.yesid.dev">transit.yesid.dev</a> y los sistemas que hacen funcionar su contenido y sus servicios.',
				},
				id: 'ch4-es-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Después de desplegar Transit, también tuve que mantenerlo funcionando y pagar la factura mensual de infraestructura.',
				},
				id: 'ch4-es-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 4 de una serie de seis capítulos. Capítulos 1–3: quién soy. Capítulos 4–6: lo que construyo. Anterior: <a href="/es/blog/pensar-en-matrices">Pensar en matrices</a> · Siguiente: <a href="/es/blog/de-50-a-0-una-vm-oracle-always-free">De 50 $ a 0 $: una VM Oracle Always Free</a>.',
				},
				id: 'ch4-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400003,
		version: '2.31.2',
	},
	'ai-accelerated-human-owned-my-actual-workflow': {
		blocks: [
			{
				data: { level: 2, text: 'The catch' },
				id: 'ch4-001',
				type: 'header',
			},
			{
				data: {
					text: 'Early in the work on <a href="https://yesid.dev">yesid.dev</a>, I chose a clear CMS boundary: repeated shared interface content was supposed to come from the CMS instead of staying in frontend files. Claude produced the implementation, and I checked the files against that boundary. I found shared copy still hardcoded in the frontend. Hardcoded text and CMS-backed text can produce the same pixels. A browser check proves that the page renders, not which system owns the content. The file check showed that the implementation did not yet match the content model I had chosen.',
				},
				id: 'ch4-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The division of labor' },
				id: 'ch4-003',
				type: 'header',
			},
			{
				data: {
					text: 'Claude was my primary implementation tool for <a href="https://yesid.dev">yesid.dev</a> and <a href="https://transit.yesid.dev">transit.yesid.dev</a>. Codex mostly reviewed the work and sometimes stepped in as a backup implementer. I oversaw both projects from A to Z and made the architecture decisions. I kept the project context, decided how the parts should fit, gave direction, inspected results, found problems, and moved the work forward.',
				},
				id: 'ch4-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The work became more managerial. Instead of typing each implementation, I was directing the projects, keeping the architecture in view, and checking what came back.',
				},
				id: 'ch4-005',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The controls today' },
				id: 'ch4-006',
				type: 'header',
			},
			{
				data: {
					text: 'The <a href="https://yesid.dev">yesid.dev</a> repository also has mechanical checks today for generated content and Svelte warnings. The pre-commit hook and PR CI compare CMS-generated modules with their recorded manifest. PR CI runs this check for pull requests targeting <code>main</code> or <code>develop</code>. The comparison catches ordinary drift between the modules and manifest, but it checks consistency, not whether the CMS produced the files. The local hook can be skipped, and a coordinated module-plus-manifest edit can still agree.',
				},
				id: 'ch4-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The web check uses a configurable warning lock specifically for Svelte. It fails when reported warnings exceed that lock. These checks cover repeatable repository conditions. They do not decide whether the CMS architecture is right or whether a piece of content belongs in the frontend. That remains a project and architecture decision.',
				},
				id: 'ch4-008',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'How this article was made' },
				id: 'ch4-009',
				type: 'header',
			},
			{
				data: {
					text: 'My process starts with a conversation and my rambling. AI organizes the material into a skeleton and supplies wording in blocks. An article carries my name only after I check and correct the structure, claims, and wording, use those corrections in another AI draft, read every block from A to Z, and decide what stays.',
				},
				id: 'ch4-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The client test' },
				id: 'ch4-011',
				type: 'header',
			},
			{
				data: {
					text: 'If a client wants to know whether I understand what I publish, quiz me about anything on this site.',
				},
				id: 'ch4-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'AI is one tool among many. It is not the end result. The results are <a href="https://yesid.dev">yesid.dev</a>, <a href="https://transit.yesid.dev">transit.yesid.dev</a>, and the systems that make their content and services work.',
				},
				id: 'ch4-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'After I deployed Transit, I also had to keep it running and pay the monthly infrastructure bill.',
				},
				id: 'ch4-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 4 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Previous: <a href="/blog/thinking-in-matrices">Thinking in matrices</a> · Next: <a href="/blog/50-to-0-an-oracle-always-free-vm">$50 to $0: an Oracle Always Free VM</a>.',
				},
				id: 'ch4-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400003,
		version: '2.31.2',
	},
	'cambiar-de-idioma-sin-empezar-de-nuevo': {
		blocks: [
			{
				data: {
					text: 'Imagina que ya escribiste las primeras líneas de un mensaje y decides pasar el sitio a español. Las etiquetas cambian. El mensaje desaparece.',
				},
				id: '55dfc2aaf018ed12-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Es un ejemplo de lo que puede fallar al cambiar de idioma, aunque las traducciones sean correctas. Las palabras llegaron a la nueva versión, pero el trabajo de la persona se quedó atrás.',
				},
				id: '301c61ba439cce0a-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En <a href="http://yesid.dev">yesid.dev</a>, cada idioma tiene sus direcciones. El inglés usa la ruta principal, el francés agrega /fr y el español agrega /es. Así es posible entrar directamente a cada versión, pero la interfaz también debe contemplar el paso entre ellas.',
				},
				id: '8d7e8a081e5a9ddc-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La implementación guarda temporalmente la información que cada página haya registrado para ese cambio. Puede ser lo que alguien escribió, una opción elegida, el punto de lectura o una sección abierta. La nueva página puede recuperar esos datos. Es un traslado durante el cambio de idioma, no una promesa de guardar para siempre un mensaje sin terminar.',
				},
				id: '6296885d79e49c46-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Hay una diferencia importante. El texto de la interfaz debe cambiar de idioma. El mensaje que escribió la persona debe seguir siendo suyo. Traducir la etiqueta de un campo no es lo mismo que traducir las palabras de quien lo usa.',
				},
				id: 'cf746d5c26962601-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Lo mismo ocurre con un artículo. Si alguien ya llegó a la mitad, el sitio no debería tratarlo automáticamente como si acabara de entrar al inicio. Cuando el título y la dirección cambian entre idiomas, el sistema necesita reconocer que las páginas corresponden al mismo artículo.',
				},
				id: '1beca09fbd0c59a4-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Son detalles pequeños hasta que alguien pierde el punto donde iba.',
				},
				id: 'f929f3c6ed63ff79-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'También son comportamientos que conviene mostrar. Una revisión útil consiste en escribir texto de ejemplo sin enviarlo, cambiar de idioma y observar qué se conservó. Después se puede repetir con una sección abierta o un filtro seleccionado, y comprobar qué pasa cuando falta una traducción. Una captura de una página traducida no responde todas esas preguntas.',
				},
				id: '6eb920f68f1b4cf9-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El mecanismo solo reconoce los valores que una página registra. Agregar otro campo implica decidir qué debe acompañarlo. Tampoco puede ofrecer una traducción que no existe. Esos límites importan al definir qué se puede prometer cuando alguien cambia de idioma.',
				},
				id: '57c5e6d621532739-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Me parece una forma útil de pensar un sitio multilingüe. Cambian las palabras, pero la persona todavía tiene algo por terminar.',
				},
				id: '63158e211bf01c01-9',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/es/projects/yesid-dev">Conocer el proyecto</a>',
				},
				id: 'c53f379c87a966d1-10',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'ce-quon-peut-preparer-avant-davoir-son-catalogue-definitif': {
		blocks: [
			{
				data: {
					text: 'Un site peut présenter une entreprise avant d’inclure un catalogue complet. Le site actuel de Café Arona est informatif et permet de prendre contact. Un catalogue pourra s’ajouter plus tard.',
				},
				id: 'd1608cdfad5e7e29-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ce contexte m’amène à séparer les décisions qui peuvent avancer de celles qui dépendent encore du produit.',
				},
				id: '71152788199cb54d-1',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Commencer par ce qu’on sait' },
				id: '7263df529f4e4f8a-2',
				type: 'header',
			},
			{
				data: {
					text: 'Une entreprise peut déjà expliquer qui elle est, d’où vient son projet et comment la joindre. Elle peut préparer ses photos, réviser ses textes et décider qui sera responsable de les tenir à jour.',
				},
				id: '15ec719cfe6fdf2e-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ce travail sert aussi à découvrir ce qui manque. Une page d’équipe peut attendre un portrait. Une fiche de produit peut révéler qu’un format ou une méthode de préparation n’est pas encore confirmé. Le site devient un support de discussion concret avec le client.',
				},
				id: 'b58599fe022b1617-4',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Garder les décisions provisoires visibles',
				},
				id: '4200219fcc09fcca-5',
				type: 'header',
			},
			{
				data: {
					text: 'Une maquette donne facilement l’impression que tout est réglé. Dès qu’un nom, une photo et un prix sont réunis dans une fiche, le produit semble prêt à commander.',
				},
				id: '2fa88b632a4daf92-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Une liste simple peut préciser le statut de chaque information : confirmée, en essai ou à fournir. Cette liste évite qu’un exemple de mise en page devienne une promesse au client final.',
				},
				id: '48d25cabc8bbe854-7',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Préparer les gestes de gestion' },
				id: 'de0d8c11276c5f5b-8',
				type: 'header',
			},
			{
				data: {
					text: 'Avant l’ouverture, on peut déjà convenir de la façon dont l’équipe modifiera un texte, ajoutera une photo et vérifiera une traduction. Il faut également savoir qui approuve les prix et qui confirme les quantités disponibles.',
				},
				id: 'd0b956b73b0fa45b-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le même raisonnement s’applique aux accès. La personne qui possède la boutique, celle qui met à jour les contenus et celle qui intervient sur le code n’ont pas nécessairement le même rôle.',
				},
				id: 'd8f02a1004e49327-10',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Un site informatif doit être utile en lui-même. Des contenus clairs, des pages modifiables et des responsabilités définies préparent l’ajout d’un catalogue, quand les renseignements seront prêts.',
				},
				id: '01924848ce91336f-11',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/fr/projects/cafe-arona">Découvrir le projet</a>',
				},
				id: '3657a9802e7b77e0-12',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'changer-de-langue-sans-recommencer': {
		blocks: [
			{
				data: {
					text: 'Imaginez avoir commencé à écrire un message, puis décider de passer le site en français. Les libellés changent. Votre message disparaît.',
				},
				id: 'c98daf7387315611-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'C&#39;est un exemple de ce qu&#39;un changement de langue peut mal faire, même si les traductions sont justes. Les mots ont suivi, mais pas le travail de la personne.',
				},
				id: '8c13a29dd832eebe-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Sur <a href="http://yesid.dev">yesid.dev</a>, chaque langue a ses adresses. L&#39;anglais utilise la route principale, le français ajoute /fr et l&#39;espagnol ajoute /es. On peut ainsi accéder directement à chaque version. L&#39;interface doit aussi prévoir le passage de l&#39;une à l&#39;autre.',
				},
				id: '26ae33a6769dddcb-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L&#39;implémentation garde temporairement les éléments d&#39;état inscrits pour ce transfert. Il peut s&#39;agir d&#39;une valeur saisie, d&#39;un choix, d&#39;une position de lecture ou d&#39;une section ouverte. La nouvelle page peut ensuite rétablir les éléments pertinents. Ce mécanisme accompagne le changement de langue; il ne promet pas de conserver indéfiniment un message inachevé.',
				},
				id: 'f26716fde59f81bf-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Il y a une distinction à garder en tête. Le texte de l&#39;interface doit changer de langue. Le message écrit par la personne doit rester le sien. Traduire un libellé et traduire les mots d&#39;un visiteur sont deux gestes différents.',
				},
				id: 'cf43d52d5c18b498-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le même principe s&#39;applique à un article. Une personne rendue au milieu du texte ne devrait pas automatiquement être traitée comme si elle venait d&#39;arriver tout en haut. Si le titre et l&#39;adresse changent d&#39;une langue à l&#39;autre, le site doit reconnaître qu&#39;il s&#39;agit du même article.',
				},
				id: 'a0c8c5ae9bf14a88-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ces détails paraissent petits jusqu&#39;au moment où l&#39;on perd sa place.',
				},
				id: '64bc521242cb60cd-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ce sont aussi des comportements à montrer. Une vérification utile consiste à saisir du texte d&#39;exemple sans l&#39;envoyer, à changer de langue, puis à regarder ce qui a été conservé. On peut refaire l&#39;exercice avec une section ouverte ou un filtre choisi, et vérifier ce qui arrive lorsqu&#39;une traduction manque. Une capture d&#39;une page traduite ne répond pas à toutes ces questions.',
				},
				id: '89545366f57fdc50-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le mécanisme ne connaît que les valeurs inscrites par une page. Ajouter un champ demande donc de décider ce qui doit l&#39;accompagner. Il ne peut pas non plus fournir une traduction qui n&#39;existe pas. Ces limites comptent dans ce qu&#39;un changement de langue peut promettre.',
				},
				id: '24eac391b62595b5-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'C&#39;est une façon utile d&#39;aborder un site multilingue. Les mots changent, mais la personne a toujours quelque chose à terminer.',
				},
				id: '390e9970a7c8e7e2-9',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/fr/projects/yesid-dev">Découvrir le projet</a>',
				},
				id: '219bce8950d117bf-10',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'changing-language-should-not-mean-starting-over': {
		blocks: [
			{
				data: {
					text: 'Imagine writing the first few lines of a message, then deciding you would rather use the site in French. The labels change. Your message disappears.',
				},
				id: '733f3e29cf81c241-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That is an example of what a language switch can get wrong even when every translation is correct. The words have moved to the new language, but the person&#39;s work has been left behind.',
				},
				id: '488881b129d67a4e-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'On <a href="http://yesid.dev">yesid.dev</a>, the language versions use different addresses. English uses the main route, French adds /fr, and Spanish adds /es. That makes each version directly accessible, but the interface also has to deal with moving between them.',
				},
				id: 'f4815712aebcfe86-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The implementation keeps a temporary record of registered page state during a language change. That can include an entered value, a selected item, a reading position, or an open section. The new page can then restore the relevant state. It is a transfer for that change of language, not a promise that the site saves an unfinished message forever.',
				},
				id: '95c92a7c018dc908-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'There is an important distinction here. The interface text should change language. A message someone wrote should remain theirs. Translating a field label and translating the visitor&#39;s own words are different actions.',
				},
				id: '4ea338a7590d230f-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The same thinking applies to an article. A reader who has reached the middle of a page should not automatically be treated as someone arriving at the top for the first time. When an article has a different title and address in another language, the site needs to recognise that the two pages belong to the same article.',
				},
				id: 'c47696be58d1ba2c-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'These are small details until someone loses their place.',
				},
				id: '0858a46ad1fe28d3-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'They are also behaviours to demonstrate, not just describe in source code. A useful check is to enter harmless example text without submitting it, change language, and inspect what stayed. Repeat with an open section or a selected filter. Check the behaviour when a translation is missing. A screenshot of a translated page cannot answer all of those questions.',
				},
				id: 'f72696802e09a9ed-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The mechanism only knows about the values a page registers. Adding another field means deciding what should travel with it. It also cannot supply a translation that does not exist. These limits matter when choosing what a language switch should promise.',
				},
				id: 'cd30acdc33a2ca5b-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'For me, this is a useful way to think about a multilingual site. Translation includes the words, but the visitor still has a task to finish.',
				},
				id: '5bde8fb0a9e72a46-9',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/projects/yesid-dev">Read the project story</a>',
				},
				id: '6fdedb7263e7976f-10',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'comment-japprends-graviter-autour-dun-systeme-jusquau-declic': {
		blocks: [
			{
				data: {
					text: 'J’étudiais pour un examen de comptabilité, deux ans après le début de mon diplôme, lorsque j’ai demandé à mon colocataire de m’expliquer pourquoi l’actif est égal au passif plus les capitaux propres.',
				},
				id: 'ch2-fr-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La comptabilité avait été difficile dès le début. Après une période pénible en mathématiques au secondaire, j’avais peu de connaissances sur les stocks ou la gestion de l’argent, et les abstractions étaient difficiles à comprendre. J’étudiais cette matière, mais je ne voyais toujours pas la logique qui reliait ses différentes parties.',
				},
				id: 'ch2-fr-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Mon colocataire a repris l’équation avec moi. Pendant qu’il l’expliquait, j’ai commencé à voir qu’un changement dans une partie entraînait une conséquence correspondante ailleurs. Je m’en souviens très clairement. Tout un système s’est mis en place. J’avais l’impression d’avoir tracé une ligne qui, à un moment, rejoignait sa propre queue.',
				},
				id: 'ch2-fr-003',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Le système derrière les règles' },
				id: 'ch2-fr-004',
				type: 'header',
			},
			{
				data: {
					text: 'Le déclic n’est pas venu du fait d’avoir enfin mémorisé dans quel sens inscrire un débit ou un crédit. Certains de ces détails restaient incertains même lorsque je racontais l’histoire plus tard. Ce qui est resté clair, c’était la structure apparue sous ces détails.',
				},
				id: 'ch2-fr-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L’actif est égal au passif plus les capitaux propres. Ce n’étaient plus trois termes posés côte à côte autour d’un signe égal comme des faits distincts. Ils appartenaient à un seul modèle. Les événements consignés en comptabilité ne produisaient pas des consignes isolées. Ils avaient des conséquences correspondantes qui devaient rester cohérentes dans le système.',
				},
				id: 'ch2-fr-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'C’était ce qui me manquait. Avant cette conversation, la comptabilité ressemblait à une logique improvisée. Je pouvais recevoir une règle, puis une autre, sans comprendre pourquoi elles allaient ensemble. Une fois que j’ai vu l’interdépendance, les règles avaient un endroit où s’inscrire. Je pouvais les comprendre comme des parties d’une même structure au lieu de porter chacune comme un fait distinct.',
				},
				id: 'ch2-fr-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L’équation peut rester valide pour une entreprise en difficulté ou non rentable, alors elle ne mesure pas sa santé. Ce qui comptait pour moi, c’était la cohérence des écritures : une opération pouvait toucher des comptes de différentes façons, mais ses conséquences appartenaient toujours au même système relié. C’est cette relation, plutôt qu’un sens particulier, qui m’est restée.',
				},
				id: 'ch2-fr-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Avec le recul, voici la distinction que j’essayais de saisir : une règle peut me dire quoi faire dans un cas précis, alors qu’un système me permet de voir pourquoi cette règle va avec d’autres règles.',
				},
				id: 'ch2-fr-009',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Ce qui s’accumulait pendant ces deux années',
				},
				id: 'ch2-fr-010',
				type: 'header',
			},
			{
				data: {
					text: 'Il est tentant de donner un caractère magique à cette conversation, mais cela effacerait les deux années qui l’ont précédée. L’explication est venue après deux ans de contact avec la matière et a relié plus d’un fait. Le contexte était déjà là avant que je puisse en voir la forme. La conversation a rendu la structure visible.',
				},
				id: 'ch2-fr-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Par graviter, j’entends rester au contact d’un système assez longtemps pour que sa structure devienne visible. Dans ce souvenir, le contact s’est accumulé avant la compréhension. C’est ainsi que j’explique ce délai aujourd’hui, et non une méthode que je savais suivre à l’époque.',
				},
				id: 'ch2-fr-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Graviter n’est pas attendre passivement. Le contact compte, et la confusion ne constitue pas un accomplissement en soi. En comptabilité, j’étais resté engagé dans une matière qui demeurait abstraite pour moi. Lorsque l’équation a finalement rendu les relations visibles, l’exposition précédente leur a donné un contexte.',
				},
				id: 'ch2-fr-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La conversation n’a pas remplacé ces deux années. Elle a changé la façon dont je pouvais organiser ce que j’y avais rencontré. La matière m’était familière, mais sa forme était nouvelle pour moi. C’est ce que l’image de l’orbite nomme dans ce souvenir : une période de contact avant que je puisse voir l’ensemble. Elle laisse place à un déclic ultérieur sans prétendre que le temps seul le garantit.',
				},
				id: 'ch2-fr-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Le déclic n’arrive pas toujours' },
				id: 'ch2-fr-015',
				type: 'header',
			},
			{
				data: {
					text: 'Le français et l’anglais ne sont pas arrivés grâce à un seul déclic. Je les ai appris par immersion, au fil d’un apprentissage progressif. Je ne peux pas désigner un moment où l’une ou l’autre langue s’est mise à avoir du sens, ni une date où l’apprentissage a été achevé.',
				},
				id: 'ch2-fr-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Elles se sont installées à mon insu. À un moment, j’ai réalisé que je parlais couramment les deux langues, puis que je pouvais m’y exprimer avec éloquence, mais je ne me souviens pas du moment où cela est devenu vrai. Le changement était trop graduel pour que je puisse le séparer de l’immersion qui l’avait produit.',
				},
				id: 'ch2-fr-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cette différence remet le souvenir de la comptabilité en perspective. La comptabilité m’a donné un déclic dont je me souviens clairement. Le français et l’anglais m’ont offert une progression que je ne peux reconnaître qu’avec le recul. L’apprentissage des langues n’était pas une version incomplète de l’expérience en comptabilité. C’était simplement une autre manière d’apprendre dans mon parcours.',
				},
				id: 'ch2-fr-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le souvenir de la comptabilité est un récit fidèle, pas une formule universelle. Certaines connaissances deviennent visibles à un moment précis. Certaines aptitudes progressent si graduellement que je ne reconnais le résultat qu’après coup.',
				},
				id: 'ch2-fr-019',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Ce autour de quoi je gravite maintenant',
				},
				id: 'ch2-fr-020',
				type: 'header',
			},
			{
				data: {
					text: 'En ce moment, je gravite autour des mathématiques qui sous-tendent l’IA. Mon objectif actuel n’est pas simplement de travailler avec l’IA, mais de comprendre ce qui se trouve derrière les tokens. J’apprends ce que sont les tokens, les réseaux neuronaux et les prédictions, ainsi que les rôles des CPU et des GPU. Je peux nommer certaines parties, mais je ne peux pas encore expliquer la chaîne complète de A à Z.',
				},
				id: 'ch2-fr-021',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le déclic n’a pas encore eu lieu pour ce système. Je tourne toujours autour de la logique derrière ces sujets et j’essaie de comprendre ce qui relie une partie à une autre. J’espère finir par intégrer le processus dans son ensemble et l’expliquer clairement du début à la fin, dans mes propres mots. Pour l’instant, j’essaie de comprendre les questions une à la fois.',
				},
				id: 'ch2-fr-022',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Quand je repense à la conversation sur la comptabilité, je vois toujours la ligne rejoindre sa propre queue. Reconnaître un système a changé ma façon de remarquer les relations ailleurs, et cette évolution vers la perception de dimensions reliées marque le début de la pensée matricielle que je veux examiner ensuite.',
				},
				id: 'ch2-fr-023',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 2 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Précédent : <a href="/fr/blog/le-creneau-internet-de-deux-heures">Le créneau internet de deux heures</a> · Suivant : <a href="/fr/blog/penser-en-matrices">Penser en matrices</a>.',
				},
				id: 'ch2-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400001,
		version: '2.31.2',
	},
	'como-aprendo-orbitar-un-sistema-hasta-que-encaja': {
		blocks: [
			{
				data: {
					text: 'Estaba estudiando para un examen de contabilidad, dos años después de empezar el diploma, cuando le pedí a mi compañero de apartamento que me explicara por qué los activos son iguales a los pasivos más el patrimonio.',
				},
				id: 'ch2-es-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La contabilidad había sido difícil desde el principio. Después de una etapa complicada con las matemáticas en la secundaria, sabía poco sobre inventarios o manejo del dinero, y me costaba entender las abstracciones. Había estado estudiando la materia, pero todavía no veía la lógica que mantenía unidas sus partes.',
				},
				id: 'ch2-es-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Mi compañero repasó la ecuación conmigo. Mientras la explicaba, empecé a ver que un cambio en una parte tenía una consecuencia relacionada en otra. Lo recuerdo con mucha claridad. Todo un sistema encajó. Sentí que había estado dibujando una línea y que, en algún momento, la línea se encontraba con su propia cola.',
				},
				id: 'ch2-es-003',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'El sistema detrás de las reglas' },
				id: 'ch2-es-004',
				type: 'header',
			},
			{
				data: {
					text: 'El avance no consistió en memorizar por fin hacia qué lado va un débito o un crédito. Algunos de esos detalles seguían siendo inciertos incluso cuando volví a contar la historia. Lo que quedó claro fue la estructura que había aparecido debajo de ellos.',
				},
				id: 'ch2-es-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Los activos son iguales a los pasivos más el patrimonio. Ya no eran tres términos puestos junto a un signo igual como hechos separados. Pertenecían a un solo modelo. Los eventos registrados en la contabilidad no producían instrucciones aisladas. Tenían consecuencias emparejadas que debían mantener la coherencia dentro del sistema.',
				},
				id: 'ch2-es-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Eso era lo que me faltaba. Antes de la conversación, la contabilidad parecía una lógica improvisada. Podía recibir una regla y luego otra sin entender por qué iban juntas. Cuando vi la interdependencia, las reglas encontraron un lugar. Pude entenderlas como partes de una sola estructura, en vez de cargar cada una como un hecho separado.',
				},
				id: 'ch2-es-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La ecuación puede cumplirse para una empresa con problemas o sin rentabilidad, así que no es una prueba de salud. Lo que me importaba era la coherencia del registro: una transacción podía afectar las cuentas de distintas formas, pero sus consecuencias seguían perteneciendo al mismo sistema conectado. Esa relación, y no una dirección particular, fue lo que se me quedó.',
				},
				id: 'ch2-es-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Al mirar atrás, esta es la distinción que intentaba alcanzar: una regla puede decirme qué hacer en un caso, mientras que un sistema me permite ver por qué esa regla encaja con otras reglas.',
				},
				id: 'ch2-es-009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Lo que hicieron esos dos años' },
				id: 'ch2-es-010',
				type: 'header',
			},
			{
				data: {
					text: 'Es tentador hacer que la conversación parezca mágica, pero eso borraría los dos años anteriores. La explicación llegó después de dos años de exposición y conectó más de un hecho. El contexto ya estaba allí antes de que pudiera ver su forma. La conversación hizo visible la estructura.',
				},
				id: 'ch2-es-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cuando digo orbitar, me refiero a mantenerme en contacto con un sistema el tiempo suficiente para que su estructura se vuelva visible. En este recuerdo, el contacto se acumuló antes de que llegara la comprensión. Así entiendo ahora esa demora; no era un método que yo supiera que estaba siguiendo en ese momento.',
				},
				id: 'ch2-es-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Orbitar no es esperar de forma pasiva. El contacto importa, y la confusión por sí sola no es el logro. En contabilidad, me había mantenido involucrado con una materia que seguía siendo abstracta para mí. Cuando la ecuación por fin hizo visibles las relaciones, la exposición anterior les dio contexto.',
				},
				id: 'ch2-es-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La conversación no reemplazó los dos años. Cambió la forma en que podía organizar lo que había ido encontrando durante ese tiempo. El material me resultaba conocido, pero su forma era nueva para mí. Eso es lo que nombra la imagen de la órbita en este recuerdo: un periodo de contacto antes de que pudiera ver el conjunto. Deja espacio para que algo encaje más adelante, sin fingir que el tiempo por sí solo lo garantiza.',
				},
				id: 'ch2-es-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'No todo encaja de golpe' },
				id: 'ch2-es-015',
				type: 'header',
			},
			{
				data: {
					text: 'El francés y el inglés no llegaron a mí en un solo momento revelador. Los aprendí por inmersión y progresión. No puedo señalar un único momento en que alguno de los dos idiomas cobró sentido, ni una fecha en que el aprendizaje quedó completo.',
				},
				id: 'ch2-es-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Se fueron instalando poco a poco. En algún momento me di cuenta de que hablaba ambos idiomas con fluidez y, con el tiempo, de que podía expresarme con elocuencia en ellos, pero no recuerdo cuándo ocurrió. El cambio fue demasiado gradual para separarlo de la inmersión que lo produjo.',
				},
				id: 'ch2-es-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Esa diferencia mantiene el recuerdo de la contabilidad en su justa proporción. La contabilidad me dio un momento en que todo encajó y que recuerdo con claridad. El francés y el inglés me dieron una progresión que solo puedo reconocer al mirar atrás. La experiencia con los idiomas no fue una versión incompleta de la experiencia con la contabilidad. Simplemente fue otra forma en que ocurrió el aprendizaje en mi vida.',
				},
				id: 'ch2-es-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El recuerdo de la contabilidad es una descripción verdadera, no una fórmula universal. Algunos conocimientos se vuelven visibles en un momento particular. Algunas capacidades crecen tan gradualmente que solo reconozco el resultado después.',
				},
				id: 'ch2-es-019',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Lo que estoy orbitando ahora' },
				id: 'ch2-es-020',
				type: 'header',
			},
			{
				data: {
					text: 'Ahora mismo, estoy orbitando las matemáticas que hay detrás de la IA. Mi objetivo actual no es simplemente trabajar con IA, sino entender qué hay detrás de los tokens. Estoy aprendiendo sobre tokens, redes neuronales, predicciones y las funciones de las CPU y las GPU. Puedo nombrar algunas partes, pero todavía no puedo explicar la cadena completa de principio a fin.',
				},
				id: 'ch2-es-021',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El sistema todavía no ha encajado. Sigo dando vueltas alrededor de la lógica que hay detrás de estos temas e intentando entender qué conecta una parte con otra. Espero que algún día pueda interiorizar el proceso como un todo y explicarlo con claridad de principio a fin, con mis propias palabras. Por ahora, voy tratando de entender las preguntas una por una.',
				},
				id: 'ch2-es-022',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cuando recuerdo la conversación sobre contabilidad, todavía pienso en la línea que se encuentra con su propia cola. Reconocer un sistema cambió la forma en que notaba las relaciones en otros lugares, y ahí empieza la forma de pensar en matrices que quiero examinar después, en ese cambio hacia una visión de dimensiones conectadas.',
				},
				id: 'ch2-es-023',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 2 de una serie de seis capítulos. Capítulos 1–3: quién soy. Capítulos 4–6: lo que construyo. Anterior: <a href="/es/blog/el-turno-de-dos-horas-para-usar-internet">El turno de dos horas para usar internet</a> · Siguiente: <a href="/es/blog/pensar-en-matrices">Pensar en matrices</a>.',
				},
				id: 'ch2-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400001,
		version: '2.31.2',
	},
	'cuando-dos-componentes-parecidos-deberian-seguir-separados': {
		blocks: [
			{
				data: {
					text: 'Dos tarjetas pueden parecer de la misma familia y necesitar contratos distintos.',
				},
				id: '891f24a8b5e72cb5-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En <a href="http://yesid.dev">yesid.dev</a>-design, los requisitos documentados de Transit y <a href="http://yesid.dev">yesid.dev</a> hacen concreta esa diferencia. Transit espera una tarjeta plana, sin sombra ni borde resaltado. <a href="http://yesid.dev">yesid.dev</a> conserva un bisel y una sombra al pasar el cursor. Comparten una identidad visual. Sus requisitos siguen siendo diferentes.',
				},
				id: 'aa48870a3966ce52-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Sería fácil poner los dos comportamientos en un paquete compartido si este pudiera preguntar qué producto lo está usando. Las reglas del proyecto excluyen precisamente esa dependencia. Cuando el código común conoce cada producto por su nombre, cada excepción nueva añade otro motivo para modificar la base.',
				},
				id: '601288dab9f5a0e3-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El límite que elegí es más pequeño. El paquete se encarga del control o la superficie común. Un estilo o una adaptación del producto se encarga de la diferencia. Cada producto conserva las verificaciones que explican por qué existe su excepción.',
				},
				id: 'fe47cf828e593cfb-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Esto acepta cierta duplicación. También le da una razón y un lugar definido.',
				},
				id: '337e54f51678f7a9-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La pregunta es si las dos piezas comparten la misma responsabilidad. Su apariencia actual es una pista, pero no resuelve qué hacen, quién controla su estado ni qué cambios deberían recibir juntas.',
				},
				id: 'e1e3dcc00037f081-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Una sección plegable es otro ejemplo. En ambos productos puede tener un título, una flecha y contenido oculto. Aun así, puede cambiar la forma de recordar su estado, la composición del encabezado o el comportamiento del contenido cerrado. Compartir los controles básicos resulta útil. Compartir toda la sección también trasladaría decisiones que todavía le corresponden al producto.',
				},
				id: 'c83b704616fd4884-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El repositorio aplica una regla de tres a los patrones compuestos: tres consumidores independientes deben necesitar el mismo contrato antes de convertirlo en una pieza compartida. Es una restricción de este proyecto, no una fórmula para todos los equipos. Obliga a detenerse antes de tratar un parecido como una abstracción estable.',
				},
				id: '8f5ffe93661994d4-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'También hay una consecuencia para las actualizaciones. Una vez que un componente es compartido, un cambio afecta a varios productos. Cada uno adopta una versión exacta y revisa su comportamiento. Un ejemplo que funciona en la galería no responde todas las preguntas sobre una página real.',
				},
				id: '6ced92ac7d9b89e4-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Esta forma de pensar vuelve más concreta la reutilización. ¿Qué se repite? ¿Qué cambia? ¿Cuáles diferencias son intencionales? ¿Quién decide cuándo deben cambiar?',
				},
				id: '2992bdb2919c9850-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La respuesta puede ser un componente compartido. También puede ser una pieza básica común con una adaptación local, o dos implementaciones separadas cuyas responsabilidades todavía están evolucionando. Lo útil es poder explicar y verificar el límite elegido.',
				},
				id: 'd6af5217cafbcd5e-10',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/es/projects/yesid-dev-design">Conocer el proyecto</a>',
				},
				id: '545ee6f03e4666f3-11',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'de-50-a-0-una-vm-oracle-always-free': {
		blocks: [
			{
				data: {
					text: 'Un worker de <a href="https://transit.yesid.dev">Transit</a> busca mantener una cadencia de 30 segundos entre el inicio de un ciclo y el siguiente mientras consulta los feeds de la STM para obtener los datos más recientes de viajes y vehículos. Cuando Postgres corría en Neon y el worker en Railway, esos dos servicios administrados me costaban entre 50 $ y 60 $ al mes.',
				},
				id: 'ch5-es-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Trasladé la base de datos y el worker a una VM Oracle A1 Flex que ya tenía. En julio de 2026, esa VM me cuesta 0 $ gracias a la asignación A1 asociada a mi cuenta PAYG. El resto de Transit todavía usa infraestructura fuera de la VM, y los límites de Oracle para cuentas nuevas pueden ser distintos. Este es un estudio de caso de mi configuración, no una receta.',
				},
				id: 'ch5-es-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La migración' },
				id: 'ch5-es-003',
				type: 'header',
			},
			{
				data: {
					text: 'Mi VM está en Montreal. Tiene 4 OCPU, unos 24 GB de RAM y un disco de alrededor de 200 GB. Allí corren cinco servicios: Postgres con PostGIS, el worker en tiempo real, un proceso separado de limpieza de la base de datos, una API de salud y Caddy. La base de datos y el worker salieron de Neon y Railway; las partes externas de Transit no se trasladaron a esta máquina.',
				},
				id: 'ch5-es-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El bajo costo recurrente importa porque Transit es un proyecto público de datos cívicos que forma parte de mi portafolio y está pensado para durar. Una factura menor me facilita mantenerlo en operación, pero no eliminé los costos del sistema. Cambié el gasto en servicios administrados por una infraestructura limitada a una sola máquina y más trabajo a mi cargo.',
				},
				id: 'ch5-es-005',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Las decisiones que me impuso el límite de 200 GB',
				},
				id: 'ch5-es-006',
				type: 'header',
			},
			{
				data: {
					text: 'En un pico histórico, una tabla en tiempo real contenía cerca de quinientos millones de filas y el volumen de Postgres llegó a unos 139 GB. Esas cifras documentan una escala pasada, no el tamaño actual de la base de datos. En un disco de unos 200 GB, conservar el detalle indefinidamente no era una opción.',
				},
				id: 'ch5-es-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El archivo de datos brutos ya existía. El límite me obligó a hacer explícito el presupuesto de retención. Según la verificación de julio de 2026, la capa relacional Silver en producción conserva un día. Los snapshots brutos de GTFS-RT en tiempo real permanecen fuera de la VM, en R2, durante 90 días. Los hechos Gold detallados se conservan durante 14 días, mientras que los agregados más pequeños se guardan durante 730 días.',
				},
				id: 'ch5-es-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Un proceso separado de limpieza de la base de datos se encarga de depurar Silver y Gold fuera del ciclo de captura. No elimina datos del archivo R2. Para un periodo seleccionado dentro del archivo, probé la reconstrucción de Silver en tiempo real y de los hechos Gold derivados de retrasos. Eso demuestra una ruta de recuperación, no una reconstrucción universal.',
				},
				id: 'ch5-es-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Los snapshots estáticos e históricos usan hashes de contenido para omitir los archivos sin cambios, mientras que la capa en vivo publica en cada ciclo. En conjunto, las funciones de almacenamiento quedan claras: los datos relacionales en vivo siguen listos para consultas, los datos brutos en tiempo real se pueden reprocesar fuera de la VM y los agregados más pequeños conservan la visión a largo plazo.',
				},
				id: 'ch5-es-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: '0 $ no significa cero trabajo' },
				id: 'ch5-es-011',
				type: 'header',
			},
			{
				data: {
					text: 'Al dejar los servicios administrados, esas responsabilidades pasaron a mis manos. Quedaron a mi cargo las copias de seguridad, las pruebas de restauración, el monitoreo, la aplicación de parches, las decisiones de capacidad y la respuesta a incidentes. La copia de seguridad lógica fuera de la VM excluye intencionalmente la tabla Silver en tiempo real más grande, que se puede reconstruir mediante reprocesamiento; por eso, la recuperación combina la copia de seguridad con el reprocesamiento de los datos brutos en tiempo real. También hice un simulacro de restauración en un entorno de base de datos separado, en vez de tratar la existencia de un archivo de copia de seguridad como prueba suficiente.',
				},
				id: 'ch5-es-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Sigue siendo una sola VM. Si falla el host, la base de datos y el pipeline que corre continuamente quedan fuera de servicio mientras restauro o traslado la carga de trabajo. El sitio alojado fuera de la VM y los snapshots existentes pueden seguir disponibles, pero sus datos en vivo dejan de actualizarse. No hay failover automático.',
				},
				id: 'ch5-es-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Los mecanismos de copia de seguridad y reprocesamiento reducen el riesgo de pérdida de datos sin crear alta disponibilidad. Esa es la contrapartida real: un menor gasto en proveedores dejó más responsabilidad operativa en mis manos.',
				},
				id: 'ch5-es-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Terreno alquilado' },
				id: 'ch5-es-015',
				type: 'header',
			},
			{
				data: {
					text: 'Oracle controla la asignación y puede cambiar sus condiciones. Cualquiera que tome una decisión similar debe consultar la documentación vigente en lugar de copiar mi configuración de julio de 2026.',
				},
				id: 'ch5-es-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Reduje el costo de cambiar de proveedor; no lo eliminé. Los servicios de la VM corren en contenedores, el acceso a la base de datos se define por configuración y los datos brutos en tiempo real, junto con las copias de seguridad lógicas, están fuera de la VM. Todavía no he probado una migración completa a otro proveedor. Si Oracle cambia las condiciones, trasladar el sistema seguirá requiriendo trabajo, pero los insumos de recuperación no están atrapados en el host.',
				},
				id: 'ch5-es-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La misma pregunta dio forma a mi sitio web: ¿qué debe seguir en vivo y qué puede quedar fuera de la ruta de cada solicitud? Su contenido vive en un CMS al que el sitio en producción nunca llama.',
				},
				id: 'ch5-es-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 5 de una saga de seis capítulos. Capítulos 1 a 3: quién soy. Capítulos 4 a 6: lo que construyo. Anterior: <a href="/es/blog/acelerado-por-ia-en-manos-humanas-mi-flujo-de-trabajo-real">Acelerado por IA, en manos humanas: mi flujo de trabajo real</a> · Siguiente: <a href="/es/blog/tu-sitio-web-necesita-publicacion-instantanea">¿Tu sitio web necesita publicación instantánea?</a>.',
				},
				id: 'ch5-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400004,
		version: '2.31.2',
	},
	'de-50-a-0-une-vm-oracle-always-free': {
		blocks: [
			{
				data: {
					text: 'Un worker de <a href="https://transit.yesid.dev">Transit</a> vise une cadence de 30 secondes d’un démarrage à l’autre lorsqu’il interroge les flux de la STM pour obtenir les plus récentes données sur les trajets et les véhicules. Lorsque Postgres fonctionnait sur Neon et le worker sur Railway, ces deux services gérés me coûtaient environ 50 à 60 $ par mois.',
				},
				id: 'ch5-fr-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'J’ai déplacé la base de données et le worker vers une VM Oracle A1 Flex existante. En juillet 2026, cette VM me coûte 0 $ dans le cadre du quota A1 associé à mon compte PAYG. Le reste de Transit utilise encore de l’infrastructure à l’extérieur de la VM, et les limites d’Oracle peuvent différer pour les nouveaux comptes. Il s’agit d’une étude de cas sur ma configuration, pas d’une marche à suivre.',
				},
				id: 'ch5-fr-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La migration' },
				id: 'ch5-fr-003',
				type: 'header',
			},
			{
				data: {
					text: 'Ma VM se trouve à Montréal. Elle compte 4 OCPU, environ 24 Go de mémoire vive et un disque d’une capacité nominale d’environ 200 Go. Cinq services y fonctionnent : Postgres avec PostGIS, le worker en temps réel, un service distinct qui purge la base de données, une API d’état de santé et Caddy. La base de données et le worker ont quitté Neon et Railway; les parties externes de Transit n’ont pas été déplacées sur cette machine.',
				},
				id: 'ch5-fr-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Un faible coût récurrent compte parce que Transit est un projet public de données civiques qui fait partie de mon portfolio et qui est conçu pour durer. Une facture plus petite me permet de continuer à l’exploiter plus facilement, mais je n’ai pas supprimé les coûts du système. J’ai troqué les dépenses en services gérés contre les contraintes d’une seule machine et davantage de travail de ma part.',
				},
				id: 'ch5-fr-005',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Les décisions imposées par la limite de 200 Go',
				},
				id: 'ch5-fr-006',
				type: 'header',
			},
			{
				data: {
					text: 'À un pic historique, une table en temps réel contenait environ un demi-milliard de lignes et le volume Postgres atteignait environ 139 Go. Ces chiffres témoignent d’une échelle passée; ils ne représentent pas la taille actuelle de la base de données. Sur un disque d’environ 200 Go, conserver les données détaillées indéfiniment n’était pas une option.',
				},
				id: 'ch5-fr-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L’archive brute existait déjà. La limite m’a forcé à rendre le budget de rétention explicite. La vérification de juillet 2026 confirmait que la couche relationnelle Silver active conserve une journée. Les instantanés GTFS-RT bruts en temps réel restent hors de la VM dans R2 pendant 90 jours. Les faits Gold détaillés sont conservés pendant 14 jours, tandis que les agrégats plus petits le sont pendant 730 jours.',
				},
				id: 'ch5-fr-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Un service distinct purge les couches Silver et Gold en dehors de la boucle de capture. Il ne purge pas l’archive R2. Pour une période choisie dans les archives, j’ai testé la reconstruction de la couche Silver en temps réel et des faits Gold dérivés sur les retards. Cela démontre un chemin de reprise, pas une reconstruction universelle.',
				},
				id: 'ch5-fr-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Les instantanés statiques et historiques utilisent des hachages de contenu pour ignorer les fichiers inchangés, tandis que la couche active publie à chaque cycle. Ensemble, les rôles de stockage sont explicites : les données relationnelles actives restent prêtes à être interrogées, les données brutes en temps réel restent rejouables hors de la VM et les agrégats plus petits conservent la vue à long terme.',
				},
				id: 'ch5-fr-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: '0 $ ne veut pas dire zéro travail' },
				id: 'ch5-fr-011',
				type: 'header',
			},
			{
				data: {
					text: 'En quittant les services gérés, j’ai repris à ma charge les responsabilités qu’ils assumaient. Je suis responsable des sauvegardes, des tests de restauration, de la surveillance, des correctifs, des décisions de capacité et des interventions en cas d’incident. La sauvegarde logique hors de la VM exclut intentionnellement la plus grande table Silver en temps réel, qui peut être rejouée. La reprise combine donc la sauvegarde avec le rejeu des données brutes en temps réel. J’ai aussi exécuté un exercice de restauration dans un environnement de base de données distinct, plutôt que de considérer l’existence d’un fichier de sauvegarde comme une preuve.',
				},
				id: 'ch5-fr-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cela reste une seule VM. Si son hôte tombe en panne, la base de données et le pipeline toujours actif sont hors service pendant que je restaure ou déplace la charge de travail. Le site hors de la VM et les instantanés existants peuvent rester accessibles, mais leurs données en direct cessent de s’actualiser. Il n’y a aucun basculement automatique.',
				},
				id: 'ch5-fr-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Les chemins de sauvegarde et de rejeu réduisent le risque de perte de données sans créer de haute disponibilité. Voilà le véritable compromis : la baisse des dépenses auprès des fournisseurs m’a transféré davantage de responsabilité opérationnelle.',
				},
				id: 'ch5-fr-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Sur un terrain loué' },
				id: 'ch5-fr-015',
				type: 'header',
			},
			{
				data: {
					text: 'Oracle contrôle le quota et peut en modifier les conditions. Quiconque envisage une décision semblable doit consulter la documentation actuelle au lieu de copier ma configuration de juillet 2026.',
				},
				id: 'ch5-fr-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'J’ai réduit le coût de changement de fournisseur; je ne l’ai pas éliminé. Les services de la VM sont conteneurisés, l’accès à la base de données est piloté par la configuration, et les données brutes en temps réel ainsi que les sauvegardes logiques se trouvent hors de la VM. Je n’ai pas encore testé une migration complète vers un autre fournisseur. Si Oracle change l’entente, le déplacement demandera encore du travail, mais les éléments nécessaires à la reprise ne sont pas prisonniers de l’hôte.',
				},
				id: 'ch5-fr-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La même question a façonné mon site web : qu’est-ce qui doit rester en direct, et qu’est-ce qui peut être retiré du chemin de requête? Son contenu vit dans un CMS que le site en production n’appelle jamais.',
				},
				id: 'ch5-fr-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 5 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Précédent : <a href="/fr/blog/accelere-par-lia-pilote-par-lhumain-mon-vrai-flux-de-travail">Accéléré par l’IA, piloté par l’humain : mon vrai flux de travail</a> · Suivant : <a href="/fr/blog/votre-site-web-a-t-il-besoin-dune-publication-instantanee">Votre site web a-t-il besoin d’une publication instantanée?</a>.',
				},
				id: 'ch5-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400004,
		version: '2.31.2',
	},
	'does-your-website-need-instant-publishing': {
		blocks: [
			{
				data: {
					text: 'Before choosing how a website publishes, ask one practical question: does an update need to be public in seconds, or can it take a few minutes? The answer changes the architecture.',
				},
				id: 'ch6-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'A newsroom may need a correction visible immediately. A store may need stock and prices to be authoritative on every request. A services site, portfolio, or relatively stable business site may accept a short delay when a build-time separation between editing and serving fits its freshness and workflow needs. The right choice starts with freshness, not with a favourite tool.',
				},
				id: 'ch6-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The editor and the public site' },
				id: 'ch6-003',
				type: 'header',
			},
			{
				data: {
					text: 'The editor and the public site have different jobs. The editor gives the owner one place to edit content. The public site delivers the pages that visitors read.',
				},
				id: 'ch6-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'On <a href="https://yesid.dev">yesid.dev</a>, the current application reads generated content modules for public pages instead of asking the CMS for content during each sampled visit. In fresh production traces on July 10, 2026, the home page, Services, Blog, one published article, and the <a href="https://yesid.dev/projects/yesid-dev">yesid.dev</a> project page all returned 200. Every observed request stayed on <a href="https://yesid.dev">yesid.dev</a>, with no request to Directus or a <code>cms.*</code> host. That is evidence from five traces, not a claim about every route or every future visit.',
				},
				id: 'ch6-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This smaller CMS dependency surface has practical value. Already-published pages are designed to remain available if the editor is unavailable because those pages do not need a fresh CMS response for each reader. That expectation follows from the architecture; it has not been proven by an independent outage drill. It also does not mean the whole website cannot fail. Other hosting, code, network, and asset dependencies still exist.',
				},
				id: 'ch6-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'For the owner, there is still one editor. The separation applies to how published content is built and served.',
				},
				id: 'ch6-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What happens after Publish' },
				id: 'ch6-008',
				type: 'header',
			},
			{
				data: {
					text: 'Here is the one technical aside: the production path is Directus -&gt; build export -&gt; generated modules -&gt; SvelteKit/Vercel. The CMS supplies published content to a build, the build prepares the public files, and only a completed deployment replaces the previous version.',
				},
				id: 'ch6-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That production refresh is now enabled. On July 11, 2026, a production build logged <code>mode=live</code>, read <code>https://cms.yesid.dev</code> with a fail-closed policy, exported five published posts and five bodies, and emitted all 22 generated content modules.',
				},
				id: 'ch6-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The delay is part of the design' },
				id: 'ch6-011',
				type: 'header',
			},
			{
				data: {
					text: 'In the live-export path, refreshed content does not become public before a new deployment is ready. For the July 11 receipt, the production build started at 06:17:57.482 UTC and deployment completed at 06:19:26.603 UTC: 89.121 seconds from build start to completed deployment.',
				},
				id: 'ch6-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That is one observation, not an SLA or a promised normal range. It does prove this specific CMS change reached the public site: after completion, all five intended new article URLs returned 200 with self-canonicals and appeared in the sitemap; the three retired article URLs returned 404 and disappeared from the sitemap. This article was deliberately still a draft during that receipt, also returned 404, and was absent from the sitemap. An earlier candidate build rejected a link to this draft page and was not promoted, so the previous live deployment stayed in place until the corrected build completed.',
				},
				id: 'ch6-013',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Who should choose something else' },
				id: 'ch6-014',
				type: 'header',
			},
			{
				data: {
					text: 'This architecture is a poor fit when updates must be public in seconds. That includes newsroom-speed publishing, inventory or pricing that must be authoritative at request time, personalized applications, live dashboards, and any workflow that cannot tolerate a build before content becomes public.',
				},
				id: 'ch6-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'It can fit services sites, portfolios, documentation, and other relatively stable pages where a few minutes is acceptable. Even then, fit depends on preview needs, editorial approvals, integrations, and how much operational work the owner or developer is prepared to carry. Static delivery is not a universal recommendation.',
				},
				id: 'ch6-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'If that trade fits your site, see how the <a href="https://yesid.dev/services/web-development">Websites &amp; E-commerce service</a> approaches web projects.',
				},
				id: 'ch6-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 6 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Previous: <a href="/blog/50-to-0-an-oracle-always-free-vm">$50 to $0: an Oracle Always Free VM</a>.',
				},
				id: 'ch6-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400005,
		version: '2.31.2',
	},
	'el-turno-de-dos-horas-para-usar-internet': {
		blocks: [
			{
				data: {
					text: 'A las ocho del sábado por la mañana empezaba mi turno en la computadora familiar. Éramos seis en casa, dos padres y cuatro hijos, compartiendo una sola máquina. El horario existía para que todos tuviéramos nuestro turno. Entre semana, me correspondía de cuatro a cinco. Los fines de semana, tenía la computadora de ocho a diez. Me levantaba temprano, conectaba el router y usaba esas dos horas para jugar o explorar navegadores y programas.',
				},
				id: 'ch1-es-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Alrededor de 2001 o 2002, cuando todavía vivíamos en Colombia, mis padres compraron nuestra primera computadora para la casa. Era una máquina blanca con Windows 98. Mis hermanos mayores jugaban Age of Empires, y yo también. Mi madre seguía comprándonos CD educativos, sobre todo material para aprender inglés. No aprendimos mucho inglés con ellos, pero también teníamos Encarta, donde exploraba castillos e historia. Al mirar atrás, no estaba siguiendo un plan profesional. Simplemente era la forma en que pasaba el tiempo con la máquina que teníamos. Alrededor de 2005 o 2006, empecé a soñar con tener mi propia computadora.',
				},
				id: 'ch1-es-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Nos mudamos a Sherbrooke en 2007 y tuvimos internet en casa por primera vez. Antes de eso, conocía internet por los cibercafés. En casa, me convertí en la persona que instalaba programas nuevos y sabía moverse entre los navegadores de la computadora familiar. Personalizar páginas de perfil también fue mi primer contacto accidental con HTML y CSS. El turno del router pertenecía a esa nueva etapa: internet por fin estaba dentro de la casa, pero todavía teníamos que compartir el acceso a la única pantalla.',
				},
				id: 'ch1-es-003',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En 2009, cuando tenía unos doce años, usé Ubuntu 9.04. Todavía conservo el CD naranja. Ubuntu fue mi primer contacto real con la línea de comandos. Me acostumbré a usar <code>sudo</code>, instalé programas y controladores gráficos, y creé directorios desde la terminal. Por primera vez, hacía esas tareas escribiendo comandos.',
				},
				id: 'ch1-es-004',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'El primer sitio web' },
				id: 'ch1-es-005',
				type: 'header',
			},
			{
				data: {
					text: 'Ese mismo año, construí mi primer sitio web con PaginaWebGratis, un creador de sitios gratuito. Lo llamé Mangaka Latino. Era un sitio de fans del anime hecho con HTML, algo de CSS e imágenes enlazadas. También usaba enlaces de streaming no autorizados para el anime. Junto a esas páginas, agregué Latino TV y radio colombiana mientras vivía en Sherbrooke.',
				},
				id: 'ch1-es-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Lo mantuve de 2009 a 2011. En julio de 2026, el sitio todavía estaba en línea. Al mirar atrás, lo que más resalta es la combinación que había en esa página: el anime que seguía, televisión en español y radio de Colombia, todo armado con las herramientas limitadas que entendía en ese momento. No sabía mucho sobre desarrollo de software, pero había creado un lugar en internet y seguí volviendo para mantenerlo durante unos dos años.',
				},
				id: 'ch1-es-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Al ver esa combinación ahora, puedo ver el paso de un país a otro en la propia página. El sitio se creó en Quebec, pero parte de lo que puse allí venía de Colombia. Ahora puedo verlo en lo que sobrevivió.',
				},
				id: 'ch1-es-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En el verano de 2011, gané $600 en mi primer trabajo y usé ese dinero para comprar mi primera computadora, una Sony VAIO. Fue la primera máquina que pagué con mi propio dinero. La computadora que había querido alrededor de 2005 o 2006 por fin era mía. De 2011 a 2014, la usé sobre todo para entretenerme y para algo de experimentación técnica. Después terminé un diploma en contabilidad y gestión. Mi corazón todavía estaba con las computadoras, pero el camino de regreso no fue inmediato.',
				},
				id: 'ch1-es-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Después del diploma, construí una tienda Shopify de principio a fin. Hacerlo me mostró que detrás de una página había más que las partes que yo podía ver y personalizar. Noté esa diferencia, pero no cambió mi rumbo de inmediato. El verdadero giro llegó con otro proyecto, uno que nunca se convirtió en un producto funcional.',
				},
				id: 'ch1-es-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La aplicación que no pude crear' },
				id: 'ch1-es-011',
				type: 'header',
			},
			{
				data: {
					text: 'Un amigo propuso un sitio web que comparara los precios de productos de supermercado. Intenté construirlo, pero no llegué a entregar nada funcional. Había creado un sitio de anime y armado una tienda Shopify, pero no podía convertir esa idea en una aplicación que funcionara. Ese fracaso hizo concreto el límite de mis conocimientos. Me empujó hacia las ciencias de la computación en 2019.',
				},
				id: 'ch1-es-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Esto era distinto de personalizar una plantilla o armar una tienda en línea. La idea necesitaba un sistema funcional detrás de la página, y yo no sabía construirlo.',
				},
				id: 'ch1-es-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Terminé el programa de ciencias de la computación en diciembre de 2022. Hoy trabajo como desarrollador SQL y construyo proyectos personales. Hubo años de entretenimiento, un diploma en contabilidad, una tienda y un intento de aplicación que no llegó a ninguna parte. Estudiar ciencias de la computación fue una decisión posterior, que tomé después de encontrar algo útil que no sabía construir.',
				},
				id: 'ch1-es-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El CD naranja de Ubuntu 9.04 es de 2009 y todavía lo tengo en el piso de arriba. Al mirar atrás, las computadoras solían darme retroalimentación rápida: cambiar algo, ver qué pasaba e intentarlo de nuevo. Otros sistemas no se revelaban tan rápido. Algunos tardaron años antes de que pudiera ver su estructura.',
				},
				id: 'ch1-es-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 1 de una serie de seis capítulos. Capítulos 1–3: quién soy. Capítulos 4–6: lo que construyo. Siguiente: <a href="/es/blog/como-aprendo-orbitar-un-sistema-hasta-que-encaja">Cómo aprendo: orbitar un sistema hasta que encaja</a>.',
				},
				id: 'ch1-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400000,
		version: '2.31.2',
	},
	'how-i-learn-orbiting-a-system-until-it-clicks': {
		blocks: [
			{
				data: {
					text: 'I was studying for an accounting exam, two years into my diploma, when I asked my roommate to explain why assets equal liabilities plus equity.',
				},
				id: 'ch2-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Accounting had been hard from the start. After a rough period with math in high school, I had little knowledge of inventories or handling money, and the abstractions were hard to understand. I had been studying the subject, but I still could not see the logic holding its parts together.',
				},
				id: 'ch2-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'My roommate went over the equation with me. As he explained it, I began to see that a change in one part had a related consequence elsewhere. I remember it vividly. A whole system clicked. It felt like I had been drawing a line, and at some point the line met its tail.',
				},
				id: 'ch2-003',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The system underneath the rules' },
				id: 'ch2-004',
				type: 'header',
			},
			{
				data: {
					text: 'The breakthrough was not finally memorizing which direction a debit or credit goes. Some of those details were uncertain even when I retold the story. What stayed clear was the structure that had appeared underneath them.',
				},
				id: 'ch2-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Assets equal liabilities plus equity. Those were no longer three terms sitting beside an equals sign as separate facts. They belonged to one model. The events recorded in accounting did not produce isolated instructions. They had paired consequences that needed to remain coherent within the system.',
				},
				id: 'ch2-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That was what I had been missing. Before the conversation, accounting felt like ad hoc logic. I could receive one rule and then another without understanding why they belonged together. Once I saw the interdependence, the rules had somewhere to live. I could understand them as parts of one structure instead of carrying each one as a separate fact.',
				},
				id: 'ch2-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The equation can hold for a company that is unhealthy or unprofitable, so it is not a health test. What mattered to me was the coherence of the record: a transaction could affect accounts in different ways, but its consequences still belonged to the same connected system. That relationship, rather than any single direction, is what stayed with me.',
				},
				id: 'ch2-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Looking back, this is the distinction I was reaching for: a rule can tell me what to do in one case, while a system lets me see why that rule belongs with other rules.',
				},
				id: 'ch2-009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What the two years were doing' },
				id: 'ch2-010',
				type: 'header',
			},
			{
				data: {
					text: 'It is tempting to make the conversation sound magical, but that would erase the two years before it. The explanation came after two years of exposure and connected more than one fact. The context was there before I could see its shape. The conversation made the structure visible.',
				},
				id: 'ch2-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'By orbiting, I mean staying in contact with a system long enough for its structure to become visible. In this memory, contact accumulated before understanding did. That is how I make sense of the delay now, not a method I knew I was following at the time.',
				},
				id: 'ch2-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Orbiting is not passive waiting. The contact matters, and confusion by itself is not the achievement. In accounting, I had stayed engaged with a subject that remained abstract to me. When the equation finally made the relationships visible, the earlier exposure gave those relationships context.',
				},
				id: 'ch2-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The conversation did not replace the two years. It changed how I could organize what I had encountered during them. The material was familiar, but its shape was new to me. That is what the orbit image names in this memory: a period of contact before I could see the whole. It leaves room for a later click without pretending that time alone guarantees one.',
				},
				id: 'ch2-014',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Some things do not click' },
				id: 'ch2-015',
				type: 'header',
			},
			{
				data: {
					text: 'French and English did not arrive through one breakthrough. I learned them through immersion and progression. I cannot point to one moment when either language made sense, or to a date when the learning became complete.',
				},
				id: 'ch2-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'They crept up on me. At some point I realized that I was fluent in both languages, and eventually that I could be eloquent in them, but I do not remember when that became true. The change was too gradual for me to separate it from the immersion that produced it.',
				},
				id: 'ch2-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That difference keeps the accounting memory in proportion. Accounting gave me a click I can remember vividly. French and English gave me a progression that I can recognize only by looking back. The language experience was not an incomplete version of the accounting experience. It was simply a different way that learning happened in my life.',
				},
				id: 'ch2-018',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The accounting memory is one true description, not a universal formula. Some knowledge becomes visible in a particular moment. Some ability grows so gradually that I recognize the result only afterward.',
				},
				id: 'ch2-019',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'What I am orbiting now' },
				id: 'ch2-020',
				type: 'header',
			},
			{
				data: {
					text: 'Right now, I am orbiting the mathematics underneath AI. My current focus is not simply working with AI, but understanding what sits behind tokens. I am learning about tokens, neural networks, predictions, and the roles of CPUs and GPUs. I can name some of the parts, but I cannot yet explain the complete chain from A to Z.',
				},
				id: 'ch2-021',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The system has not clicked yet. I am still circling the logic behind these topics and trying to understand what connects one part to another. I hope I will eventually internalize the process as one whole and explain it clearly from beginning to end, in my own words. For now, I am making sense of the questions one by one.',
				},
				id: 'ch2-022',
				type: 'paragraph',
			},
			{
				data: {
					text: 'When I think back to the accounting conversation, I still think of the line meeting its tail. Recognizing one system changed how I noticed relationships elsewhere, and that shift toward seeing connected dimensions is where the matrix-like thinking I want to examine next begins.',
				},
				id: 'ch2-023',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 2 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Previous: <a href="/blog/the-two-hour-internet-slot">The two-hour internet slot</a> · Next: <a href="/blog/thinking-in-matrices">Thinking in matrices</a>.',
				},
				id: 'ch2-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400001,
		version: '2.31.2',
	},
	'le-creneau-internet-de-deux-heures': {
		blocks: [
			{
				data: {
					text: 'Le samedi matin à huit heures, mon tour sur l’ordinateur familial commençait. Nous étions six à la maison, deux parents et quatre enfants, à partager une seule machine. L’horaire était là pour que chacun puisse avoir son tour. En semaine, j’avais l’ordinateur de quatre à cinq. La fin de semaine, je l’avais de huit à dix. Je me levais tôt, je branchais le routeur et j’utilisais ces deux heures pour jouer ou explorer des navigateurs et des logiciels.',
				},
				id: 'ch1-fr-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Vers 2001 ou 2002, alors que nous vivions encore en Colombie, mes parents ont acheté notre premier ordinateur familial. C’était une machine blanche sous Windows 98. Mes frères aînés jouaient à Age of Empires, et moi aussi. Ma mère continuait à nous acheter des CD éducatifs, surtout pour apprendre l’anglais. Nous n’y avons pas appris beaucoup d’anglais, mais nous avions aussi Encarta, où j’explorais des châteaux et l’histoire. Avec le recul, je ne suivais pas un plan de carrière. C’était simplement ainsi que je passais du temps sur la machine que nous avions. Vers 2005 ou 2006, j’ai commencé à rêver d’avoir mon propre ordinateur.',
				},
				id: 'ch1-fr-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Nous avons déménagé à Sherbrooke en 2007 et avons eu internet à la maison pour la première fois. Avant cela, je connaissais internet grâce aux cafés. À la maison, je suis devenu celui qui installait de nouveaux logiciels et savait se débrouiller avec les navigateurs sur l’ordinateur familial. La personnalisation de pages de profil est aussi devenue mon premier contact accidentel avec le HTML et le CSS. Le créneau du routeur appartenait à cette nouvelle période : internet était enfin dans la maison, mais il fallait toujours partager l’accès au seul écran.',
				},
				id: 'ch1-fr-003',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En 2009, vers l’âge de douze ans, j’ai utilisé Ubuntu 9.04. J’ai encore le CD orange. Ubuntu a été ma première vraie expérience de la ligne de commande. Je me suis familiarisé avec <code>sudo</code>, j’ai installé des logiciels et des pilotes graphiques, et j’ai créé des répertoires depuis le terminal. Pour la première fois, j’accomplissais ces tâches en tapant des commandes.',
				},
				id: 'ch1-fr-004',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Le premier site web' },
				id: 'ch1-fr-005',
				type: 'header',
			},
			{
				data: {
					text: 'Cette même année, j’ai créé mon premier site web avec PaginaWebGratis, un créateur de sites gratuit. Je l’ai appelé Mangaka Latino. C’était un site de fans d’anime construit avec du HTML, un peu de CSS et des images liées. Il utilisait aussi des liens de diffusion en continu non autorisés pour les anime. À côté de ces pages, j’ai ajouté Latino TV et des radios colombiennes pendant que je vivais à Sherbrooke.',
				},
				id: 'ch1-fr-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Je l’ai maintenu de 2009 à 2011. En juillet 2026, le site était encore en ligne. Avec le recul, ce qui ressort est la combinaison présente sur cette page : les anime que je suivais, la télévision en espagnol et la radio colombienne, réunis avec les outils limités que je comprenais à l’époque. Je connaissais peu le développement logiciel, mais j’avais créé un endroit sur internet et j’y suis revenu pendant environ deux ans pour le maintenir.',
				},
				id: 'ch1-fr-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En regardant cette combinaison aujourd’hui, je peux voir le passage d’un pays à l’autre dans la page elle-même. Le site a été créé au Québec, mais une partie de ce que j’y ai mis venait de Colombie. Je le vois maintenant dans ce qui a survécu.',
				},
				id: 'ch1-fr-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'À l’été 2011, j’ai gagné 600 $ à mon premier emploi et j’ai utilisé cet argent pour acheter mon premier ordinateur, un Sony VAIO. C’était la première machine que j’avais payée moi-même. L’ordinateur que je désirais vers 2005 ou 2006 était enfin à moi. De 2011 à 2014, il a surtout servi au divertissement, avec quelques petits bricolages techniques. J’ai ensuite obtenu un diplôme en comptabilité et gestion. Mon cœur appartenait toujours aux ordinateurs, mais le chemin du retour n’a pas été immédiat.',
				},
				id: 'ch1-fr-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Après le diplôme, j’ai créé une boutique Shopify du début à la fin. Ce travail m’a montré qu’il y avait davantage derrière une page que les parties que je pouvais voir et personnaliser. J’ai remarqué cet écart, mais il n’a pas immédiatement changé ma direction. Le vrai tournant est arrivé avec un autre projet, qui n’est jamais devenu un produit fonctionnel.',
				},
				id: 'ch1-fr-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'L’application que je n’ai pas pu créer' },
				id: 'ch1-fr-011',
				type: 'header',
			},
			{
				data: {
					text: 'Un ami a proposé un site web qui comparerait les prix des produits d’épicerie. J’ai essayé de le créer, mais rien de fonctionnel n’a vu le jour. J’avais créé un site d’anime et assemblé une boutique Shopify, mais je n’arrivais pas à transformer cette idée en application fonctionnelle. Cet échec a rendu concrète la limite de mes connaissances. Il m’a poussé vers l’informatique en 2019.',
				},
				id: 'ch1-fr-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'C’était différent de personnaliser un modèle ou d’assembler une boutique en ligne. L’idée avait besoin d’un système fonctionnel derrière la page, et je n’arrivais pas à en créer un.',
				},
				id: 'ch1-fr-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'J’ai terminé le programme d’informatique en décembre 2022. Aujourd’hui, je travaille comme développeur SQL et je réalise des projets personnels. Il y a eu des années de divertissement, un diplôme en comptabilité, une boutique et une tentative d’application qui n’a mené nulle part. Étudier l’informatique a été une décision plus tardive, prise après avoir trouvé quelque chose d’utile que je ne savais pas créer.',
				},
				id: 'ch1-fr-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le CD orange d’Ubuntu 9.04 date de 2009, et je l’ai encore à l’étage. Avec le recul, les ordinateurs me donnaient souvent une rétroaction rapide : changer quelque chose, voir ce qui se passait, puis réessayer. D’autres systèmes ne se révélaient pas aussi rapidement. Pour certains, il a fallu des années avant que je puisse voir leur structure.',
				},
				id: 'ch1-fr-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 1 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Suivant : <a href="/fr/blog/comment-japprends-graviter-autour-dun-systeme-jusquau-declic">Comment j’apprends : graviter autour d’un système jusqu’au déclic</a>.',
				},
				id: 'ch1-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400000,
		version: '2.31.2',
	},
	'missing-data-is-not-zero': {
		blocks: [
			{
				data: {
					text: 'One small message in Transit captures a much larger part of the data work: OC Transpo service alerts are unavailable because no alert feed is connected here.',
				},
				id: '6a35881282f37472-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'A number might look more satisfying. The message is more precise.',
				},
				id: '84a1c9156a31ee1e-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Zero alerts would mean that a relevant source had been checked and no alerts were found within the stated scope. An unconnected feed means that the information is unavailable. Presenting those situations in the same way would give the reader confidence the system has not earned.',
				},
				id: '034f565c4ec739f0-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The same issue appears in everyday dashboards. An empty cell might mean that information has not arrived, that a measure does not apply or that a value could not be calculated. Replacing every empty cell with zero makes a table more uniform while removing part of its meaning.',
				},
				id: 'bab385eb15de6fdb-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That brings me to a question beyond the calculation: what will someone understand when they look at the result?',
				},
				id: '003280db4f0660f0-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'For Ottawa, the interface gives a straightforward answer. It says that alerts are unavailable, explains why and links to the official service notices. There is a useful next step without a claim that Transit knows whether disruptions exist.',
				},
				id: 'f6b053a91db97d7c-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Freshness needs similar care. A page that has just loaded may contain an older observation. The time someone opens a page, the time its data was published and the time a source reported an event are different things.',
				},
				id: 'bc602c867bb119d5-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'These are distinctions I’m working through with Transit. When examining an indicator, I can begin with three questions: what was observed, over which period, and what remains unknown? They help establish the meaning of a result before using it to support a conclusion.',
				},
				id: '5e7a5a28f0a92f06-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'An interface can acknowledge missing information and still be useful. It can name the gap, explain its scope and direct the reader to a source that may have the answer.',
				},
				id: '9f54c47464addf08-8',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/projects/transit-data-pipeline">Read the project story</a>',
				},
				id: '4cd6dd5c8a181f29-9',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'pensar-en-matrices': {
		blocks: [
			{
				data: {
					text: 'Cuando entendí cómo GTFS Schedule y GTFS Realtime podían funcionar juntos, vi una matriz de preguntas útiles sobre el transporte público de Montreal. GTFS Schedule aportaba la parte planificada: rutas, viajes, paradas y horarios. GTFS Realtime podía añadir actualizaciones de viajes en tiempo real, posiciones de vehículos, el retraso como valor numérico e información opcional sobre ocupación. Una fecha, un rango de fechas o un período más amplio añadía otra dimensión. <a href="https://transit.yesid.dev">transit.yesid.dev</a> surgió en parte de ver cómo esas dimensiones podían cruzarse, en lugar de tratar cada flujo de datos o métrica como un dato aislado.',
				},
				id: 'ch3-es-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Pon una ruta en un eje y el tiempo en otro; luego pregunta dónde divergen el servicio planificado y las observaciones en tiempo real. ¿Qué rutas presentan retrasos durante el período elegido? ¿Cambia el patrón cuando cambia el rango de fechas? ¿Dónde muestra la información disponible sobre ocupación un patrón distinto a cierta hora? ¿Qué viajes programados de autobús deberían estar circulando ahora, pero no tienen ningún vehículo en tiempo real correspondiente? Cada pregunta surge de una intersección distinta entre el servicio planificado, la información en tiempo real, una interpretación del producto y un control temporal. La matriz convierte una lista de campos en algo que puedo examinar.',
				},
				id: 'ch3-es-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Estas preguntas exigen mantener separadas las capas de la fuente y del producto. El retraso es numérico; «adelantado», «a tiempo», «retrasado» y «grave» son interpretaciones creadas por el producto. La ocupación es opcional y experimental, así que puede estar ausente o incompleta, y no se garantiza que forme una escala lineal. El estado «sin reporte» es distinto: es una señal derivada por el producto para un viaje programado de autobús que debería estar circulando ahora, pero no tiene un vehículo en tiempo real correspondiente; no es un valor temporal oficial de GTFS.',
				},
				id: 'ch3-es-003',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Filas y columnas, literalmente' },
				id: 'ch3-es-004',
				type: 'header',
			},
			{
				data: {
					text: 'Veo una matriz de verdad. Veo filas y columnas. Es algo visual. La granularidad puede ser una parte de la imagen: un elemento, un grupo o un nivel más amplio. Los filtros y las opciones que dejan pueden ser otra. Las decisiones, los campos de base de datos y las combinaciones ocupan el mismo tipo de espacio visual. El contenido cambia según el tema, pero sigo viendo las filas y las columnas.',
				},
				id: 'ch3-es-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Para una decisión, puedo imaginar las opciones como filas y las restricciones como columnas. Un filtro reduce las opciones; otro añade una condición. Puedo ver qué combinaciones quedan. Las entradas exactas dependen de la decisión, pero aun así veo las relaciones como una cuadrícula.',
				},
				id: 'ch3-es-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'SQL encaja con esa imagen. En una tabla, cada fila es un registro y cada columna es un campo. Los filtros seleccionan qué registros quedan a la vista, y una consulta puede combinar varias condiciones. Las relaciones me permiten pasar de un registro a los registros relacionados cuando una sola tabla no explica lo suficiente. La granularidad también cambia la imagen: un solo registro, un resultado agrupado y un conjunto más amplio responden preguntas distintas. SQL da nombres y operaciones precisos a las filas, las columnas, los filtros, los campos de base de datos y las combinaciones que veo.',
				},
				id: 'ch3-es-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La contabilidad y SQL riman' },
				id: 'ch3-es-008',
				type: 'header',
			},
			{
				data: {
					text: 'La contabilidad y SQL se conectan en mi cabeza. Antes de trabajar como desarrollador SQL, estudié contabilidad. Cuando un monto era incierto, una fecha y un monto eran un punto de partida. Eran pistas, no claves únicas garantizadas, porque otro registro podía compartir ambos valores. El contexto que los rodeaba podía estar en el flujo de caja, un presupuesto, un estado financiero o una transacción. A veces la fecha podía apuntar a la cuenta correcta; a veces el monto solo reducía la búsqueda. Podía recorrer esos registros y preguntar dónde aparecía el monto, con qué se relacionaba y si otro registro lo explicaba mejor. Los JOINs y la normalización me dieron después herramientas y un lenguaje más precisos para seguir las relaciones entre los datos. Para mí, la conexión personal está en el acto de seguir el rastro: el primer valor apunta a algún lugar, los registros relacionados reducen la incertidumbre y la respuesta completa depende del contexto.',
				},
				id: 'ch3-es-009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Tienes dos manos' },
				id: 'ch3-es-010',
				type: 'header',
			},
			{
				data: {
					text: 'Recuerdo que, cuando trabajaba lavando platos, una mujer me dijo: «Tienes dos manos. Usa las dos».',
				},
				id: 'ch3-es-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Me quedé con esa instrucción. Todavía noto cuando una mano está desocupada y ya podría estar ayudando. Una mano puede mantener una acción en marcha mientras la otra inicia la siguiente. Las dos manos pueden moverse en direcciones distintas y ocuparse de tareas diferentes. Ese hábito no se quedó en el trabajo lavando platos; lo llevé a otros trabajos físicos. Cuando trabajo o hago algo físico, busco esa oportunidad en lugar de esperar a que termine una acción. Ahorra tiempo, y me doy cuenta de que uso ese hábito todo el tiempo. El cambio es físico y específico: notar la mano desocupada, darle una parte del trabajo y dejar que las dos acciones avancen juntas.',
				},
				id: 'ch3-es-012',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Donde termina la medición' },
				id: 'ch3-es-013',
				type: 'header',
			},
			{
				data: {
					text: 'Los datos funcionan porque los campos tienen definiciones. Un retraso puede almacenarse como número, un rango de fechas tiene límites y un producto puede agrupar observaciones en categorías declaradas. Las personas no son parámetros rígidos de la misma manera. Puedes recopilar las métricas más importantes y aun así nunca medir por completo a una persona. Una puntuación, una categoría o una observación puede describir algo real, pero respalda una afirmación limitada.',
				},
				id: 'ch3-es-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El hábito de las dos manos deja clara la diferencia. Puedo describir qué cambió: ambas manos trabajan, las acciones avanzan en direcciones distintas y se ahorra tiempo. Esas mediciones pueden describir el hábito, pero no pueden contener a la persona que me lo enseñó.',
				},
				id: 'ch3-es-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Así es también como trabajo con IA: puede convertir una conversación en una estructura, pero leo cada bloque de principio a fin y tomo la decisión final.',
				},
				id: 'ch3-es-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 3 de una serie de seis capítulos. Capítulos 1–3: quién soy. Capítulos 4–6: lo que construyo. Anterior: <a href="/es/blog/como-aprendo-orbitar-un-sistema-hasta-que-encaja">Cómo aprendo: orbitar un sistema hasta que encaja</a> · Siguiente: <a href="/es/blog/acelerado-por-ia-en-manos-humanas-mi-flujo-de-trabajo-real">Acelerado por IA, en manos humanas: mi flujo de trabajo real</a>.',
				},
				id: 'ch3-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400002,
		version: '2.31.2',
	},
	'penser-en-matrices': {
		blocks: [
			{
				data: {
					text: 'Quand j’ai compris comment GTFS Schedule et GTFS Realtime pouvaient fonctionner ensemble, j’ai vu une matrice de questions utiles sur le transport collectif montréalais. GTFS Schedule fournissait le volet planifié : les lignes, les trajets, les arrêts et les horaires. GTFS Realtime pouvait ajouter les mises à jour des trajets en temps réel, la position des véhicules, la valeur numérique du retard et des renseignements facultatifs sur l’occupation. Une seule date, une plage de dates ou une période plus longue ajoutait une autre dimension. <a href="https://transit.yesid.dev">transit.yesid.dev</a> est né en partie du fait que je voyais comment ces dimensions pouvaient se croiser, plutôt que de traiter chaque flux ou chaque mesure comme un fait séparé.',
				},
				id: 'ch3-fr-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Placez une ligne sur un axe et le temps sur l’autre, puis demandez-vous où le service planifié et les observations en temps réel divergent. Quelles lignes sont en retard durant la période choisie? Le motif change-t-il lorsque la plage de dates change? À quel endroit l’information disponible sur l’occupation montre-t-elle un motif différent à une certaine heure? Quels trajets d’autobus planifiés devraient être en service maintenant, mais n’ont aucun véhicule en temps réel correspondant? Chaque question vient d’un croisement différent entre le service planifié, l’information en temps réel, une interprétation du produit et un contrôle temporel. La matrice transforme une liste de champs en quelque chose que je peux examiner.',
				},
				id: 'ch3-fr-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ces questions exigent que les couches de la source et du produit restent distinctes. Le retard est une valeur numérique, tandis que les catégories en avance, à l’heure, en retard et retard important sont des interprétations créées par le produit. Les données d’occupation sont facultatives et expérimentales : elles peuvent donc être absentes ou incomplètes, et rien ne garantit qu’elles forment une échelle linéaire. Le statut de non-transmission est distinct : c’est un signal dérivé par le produit pour un trajet d’autobus planifié qui devrait être en service maintenant, mais auquel aucun véhicule en temps réel ne correspond. Ce n’est pas une valeur temporelle officielle du standard GTFS.',
				},
				id: 'ch3-fr-003',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Des lignes et des colonnes, littéralement',
				},
				id: 'ch3-fr-004',
				type: 'header',
			},
			{
				data: {
					text: 'Je vois une vraie matrice. Je vois des lignes et des colonnes. C’est visuel. La granularité peut faire partie de l’image : un élément, un groupe ou un niveau plus large. Les filtres et les options qu’ils laissent peuvent en former une autre partie. Les décisions, les champs de base de données et les combinaisons occupent le même genre d’espace visuel. Le contenu change selon le sujet, mais les lignes et les colonnes restent visibles pour moi.',
				},
				id: 'ch3-fr-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Pour une décision, je peux imaginer les options comme des lignes et les contraintes comme des colonnes. Un filtre réduit les options; un autre ajoute une condition. Je peux voir quelles combinaisons restent. Les entrées exactes dépendent de la décision, mais je continue de voir les relations comme une grille.',
				},
				id: 'ch3-fr-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'SQL correspond à cette image. Dans une table, chaque ligne est un enregistrement et chaque colonne est un champ. Les filtres choisissent les enregistrements à afficher, et une requête peut combiner plusieurs conditions. Les relations me permettent de passer d’un enregistrement aux enregistrements associés lorsqu’une seule table ne suffit pas à expliquer la situation. La granularité change aussi l’image : un seul enregistrement, un résultat groupé et un ensemble plus large répondent à des questions différentes. SQL donne des noms et des opérations précis aux lignes, aux colonnes, aux filtres, aux champs de base de données et aux combinaisons que je vois.',
				},
				id: 'ch3-fr-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La comptabilité et SQL se font écho' },
				id: 'ch3-fr-008',
				type: 'header',
			},
			{
				data: {
					text: 'La comptabilité et SQL se rejoignent dans ma tête. Avant de travailler comme développeur SQL, j’ai étudié la comptabilité. Quand un montant était incertain, une date et un montant constituaient un point de départ. C’étaient des indices, pas des clés dont l’unicité était garantie, puisqu’un autre enregistrement pouvait partager ces deux valeurs. Le contexte pouvait se trouver dans les flux de trésorerie, un budget, un état financier ou une transaction. Parfois, la date pouvait orienter vers le bon compte; parfois, le montant ne faisait que réduire le champ de recherche. Je pouvais parcourir ces enregistrements et demander où le montant apparaissait, à quoi il était relié et si un autre enregistrement l’expliquait mieux. Les JOINs et la normalisation m’ont ensuite donné des outils et un vocabulaire plus précis pour suivre les relations dans les données. Ce qui les relie pour moi, c’est le fait de remonter une piste : la première valeur pointe quelque part, les enregistrements associés réduisent l’incertitude et la réponse complète dépend du contexte.',
				},
				id: 'ch3-fr-009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Tu as deux mains' },
				id: 'ch3-fr-010',
				type: 'header',
			},
			{
				data: {
					text: 'Je me souviens d’une femme qui, quand je travaillais à la plonge, m’a dit : « Tu as deux mains. Sers-toi des deux. »',
				},
				id: 'ch3-fr-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'J’ai gardé cette consigne. Je remarque encore quand une main est libre et pourrait déjà aider. Une main peut poursuivre un geste pendant que l’autre commence le suivant. Les deux mains peuvent aller dans des directions différentes et s’occuper de tâches différentes. Cette habitude ne s’est pas arrêtée à la plonge; je l’ai gardée dans d’autres emplois physiques. Quand je travaille ou fais quelque chose de physique, je cherche cette possibilité au lieu d’attendre qu’un geste soit terminé. Cela fait gagner du temps, et je me surprends encore à appliquer cette habitude. Le changement est physique et précis : remarquer la main libre, lui confier une partie du travail et laisser les deux gestes avancer ensemble.',
				},
				id: 'ch3-fr-012',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Là où la mesure s’arrête' },
				id: 'ch3-fr-013',
				type: 'header',
			},
			{
				data: {
					text: 'Les données fonctionnent parce que les champs ont des définitions. Un retard peut être enregistré sous forme de nombre, une plage de dates a des limites, et un produit peut regrouper des observations dans des catégories déclarées. Les gens ne sont pas des paramètres rigides de la même façon. Vous pouvez recueillir les mesures les plus importantes sans jamais mesurer pleinement une personne. Une note, une catégorie ou une observation peut décrire quelque chose de réel, mais ne peut appuyer qu’une affirmation limitée.',
				},
				id: 'ch3-fr-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'L’habitude des deux mains rend la différence claire. Je peux décrire ce qui a changé : les deux mains travaillent, les actions avancent dans des directions différentes et du temps est économisé. Ces mesures peuvent décrire l’habitude, mais elles ne peuvent contenir la personne qui me l’a enseignée.',
				},
				id: 'ch3-fr-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'C’est aussi ainsi que je travaille avec l’IA : elle peut transformer une conversation en structure, mais je lis chaque bloc du début à la fin et je prends la décision finale.',
				},
				id: 'ch3-fr-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 3 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Précédent : <a href="/fr/blog/comment-japprends-graviter-autour-dun-systeme-jusquau-declic">Comment j’apprends : graviter autour d’un système jusqu’au déclic</a> · Suivant : <a href="/fr/blog/accelere-par-lia-pilote-par-lhumain-mon-vrai-flux-de-travail">Accéléré par l’IA, piloté par l’humain : mon vrai flux de travail</a>.',
				},
				id: 'ch3-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400002,
		version: '2.31.2',
	},
	'quand-deux-composants-semblables-devraient-rester-separes': {
		blocks: [
			{
				data: {
					text: 'Deux cartes peuvent avoir un air de famille et répondre à des exigences différentes.',
				},
				id: '906aa49ceeb4dfe9-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Dans <a href="http://yesid.dev">yesid.dev</a>-design, les contrats documentés de Transit et de <a href="http://yesid.dev">yesid.dev</a> rendent cette différence concrète. Transit demande une carte plate, sans ombre ni bordure en relief. <a href="http://yesid.dev">yesid.dev</a> conserve un biseau et une ombre au survol. Les deux appartiennent à la même famille visuelle. Leurs exigences ne sont pourtant pas les mêmes.',
				},
				id: '23c19af75651ada9-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'On pourrait placer les deux comportements dans un composant partagé et lui faire vérifier le nom du produit. Les règles du projet excluent justement ce lien. Dès que le code commun connaît chaque produit par son nom, toute nouvelle exception ajoute une raison de modifier la base.',
				},
				id: '92154b8a7273c465-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La limite que j&#39;ai choisie est plus petite. Le composant partagé prend en charge la commande ou la surface commune. Un style ou une adaptation propre au produit prend en charge la différence. Chaque produit conserve les vérifications qui expliquent pourquoi son exception existe.',
				},
				id: '8e6383bb8b4f6b68-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cette décision laisse une part de duplication. Elle lui donne aussi une raison et un endroit précis.',
				},
				id: '8ef639426c239b0e-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La question est de savoir si les deux éléments ont la même responsabilité. Leur apparence actuelle donne un indice, mais elle ne dit pas tout de leur comportement, de la gestion de leur état ou des changements qu&#39;ils devraient recevoir ensemble.',
				},
				id: '1a2ea966a2c65c59-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Une section repliable en est un autre exemple. Les deux produits peuvent afficher un titre, un chevron et du contenu masqué. Ils peuvent tout de même différer dans la mémorisation de l&#39;état, la composition de l&#39;en-tête et le comportement du contenu fermé. Des commandes de base partagées restent utiles. Partager toute la section ferait aussi remonter des décisions qui appartiennent encore au produit.',
				},
				id: '5fa196268499b63d-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le dépôt applique une règle de trois aux composants composés : trois consommateurs indépendants doivent demander le même contrat avant sa mise en commun. C&#39;est une contrainte de ce projet, pas une formule universelle. Elle oblige à prendre un recul utile avant de considérer qu&#39;une ressemblance justifie une abstraction stable.',
				},
				id: 'b63715d3a989dd4c-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Il y a aussi une conséquence sur les mises à jour. Dès qu&#39;un composant devient partagé, sa modification concerne plusieurs produits. Chacun adopte une version précise et révise son propre comportement. Un exemple qui fonctionne dans la galerie ne répond pas à toutes les questions d&#39;une vraie page.',
				},
				id: 'f95bd30657a43bad-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cette façon de réfléchir rend la réutilisation plus concrète. Qu&#39;est-ce qui se répète? Qu&#39;est-ce qui diffère? Quelles différences sont voulues? Qui décide du moment où elles changent?',
				},
				id: 'b21faa9374551010-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La réponse peut être un composant commun. Elle peut aussi être un petit élément partagé avec une adaptation locale, ou deux réalisations séparées dont les responsabilités évoluent encore. Ce qui compte, c&#39;est de pouvoir expliquer et vérifier la limite choisie.',
				},
				id: 'aed04840fc8f7252-10',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/fr/projects/yesid-dev-design">Découvrir le projet</a>',
				},
				id: '0ced3869e13dc74c-11',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'que-se-puede-avanzar-antes-de-tener-el-catalogo-definitivo': {
		blocks: [
			{
				data: {
					text: 'Un sitio puede presentar una empresa antes de incluir un catálogo completo. El sitio actual de Café Arona es informativo y permite ponerse en contacto. El catálogo se puede agregar más adelante.',
				},
				id: 'd04acc38ca3a0bf4-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este contexto me lleva a separar las decisiones que se pueden tomar ahora de las que aún dependen del producto.',
				},
				id: '7a52481939c2aa12-1',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Empezar por lo que ya se conoce' },
				id: '8a3936fbe2b4b0ec-2',
				type: 'header',
			},
			{
				data: {
					text: 'Una empresa puede explicar quiénes la conforman, cómo nació el proyecto y cómo contactarla. También puede preparar sus fotografías, revisar sus textos y decidir quién mantendrá esa información al día.',
				},
				id: 'ebc0de0fc1e7b959-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ese trabajo permite identificar lo que falta. La página del equipo puede estar esperando un retrato. Una ficha de producto puede mostrar que aún no se ha confirmado una presentación o un método de preparación. El sitio se convierte en un punto de partida concreto para conversar con el cliente.',
				},
				id: '5ec8ae46b26b9970-4',
				type: 'paragraph',
			},
			{
				data: {
					level: 2,
					text: 'Identificar lo que sigue siendo provisional',
				},
				id: '800a826d598cebda-5',
				type: 'header',
			},
			{
				data: {
					text: 'Una página bien presentada puede hacer que una decisión pendiente parezca definitiva. Al reunir un nombre, una foto y un precio, el producto empieza a verse listo para pedir.',
				},
				id: '65f63d6660cfb146-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Una lista sencilla puede indicar el estado de cada dato: confirmado, en prueba o pendiente. Así se reduce el riesgo de que un ejemplo de diseño se convierta en una promesa para quien visita el sitio.',
				},
				id: 'a37fe60b8848fb0c-7',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Preparar las tareas habituales' },
				id: '189aed9345950780-8',
				type: 'header',
			},
			{
				data: {
					text: 'Antes de abrir las ventas, el equipo puede acordar cómo cambiará un texto, reemplazará una foto y revisará una traducción. También necesita definir quién aprueba los precios y quién confirma las cantidades disponibles.',
				},
				id: 'af38ff42c0b3b9e4-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Con los accesos ocurre algo parecido. La persona propietaria de la tienda, quien actualiza el contenido y quien modifica el código pueden tener responsabilidades distintas.',
				},
				id: 'ceeb33a48a2ea5e9-10',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Un sitio informativo debe ser útil por sí mismo. Los contenidos claros, las páginas editables y las responsabilidades definidas facilitan agregar un catálogo cuando su información esté lista.',
				},
				id: '608232e3564da1a1-11',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/es/projects/cafe-arona">Conocer el proyecto</a>',
				},
				id: '2dd7facab5251a55-12',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'the-two-hour-internet-slot': {
		blocks: [
			{
				data: {
					text: 'At eight on Saturday morning, my turn on the family computer began. We were six at home, two parents and four kids, sharing one machine. The schedule was there so everyone could get a turn. On weekdays, my time was from four to five. On weekends, I had the computer from eight to ten. I woke up early, plugged in the router, and used those two hours to play games or explore browsers and software.',
				},
				id: 'ch1-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Around 2001 or 2002, while we were still in Colombia, my parents bought our first home computer. It was a white machine running Windows 98. My older brothers played Age of Empires, and I played too. My mother kept buying learning CDs for us, especially English material. We did not learn much English from them, but we also had Encarta, where I explored castles and history. Looking back, I was not following a career plan. This was simply how I spent time on the machine we had. Around 2005 or 2006, I started dreaming about having a computer of my own.',
				},
				id: 'ch1-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'We moved to Sherbrooke in 2007 and got home internet for the first time. Before that, I knew the internet through cafés. At home, I became the person who installed new software and navigated browsers on the family computer. Customizing profile pages also became my first accidental contact with HTML and CSS. The router slot belonged to that new period: internet was finally inside the house, but access to the one screen still had to be shared.',
				},
				id: 'ch1-003',
				type: 'paragraph',
			},
			{
				data: {
					text: 'In 2009, when I was around twelve, I used Ubuntu 9.04. I still have the orange CD. Ubuntu was my first real exposure to the command line. I became comfortable with <code>sudo</code>, installed software and graphics drivers, and created directories from the terminal. For the first time, I was doing those tasks by typing commands.',
				},
				id: 'ch1-004',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The first website' },
				id: 'ch1-005',
				type: 'header',
			},
			{
				data: {
					text: 'That same year, I built my first website with PaginaWebGratis, a free site builder. I called it Mangaka Latino. It was an anime fan site built with HTML, some CSS, and linked images. It also used unauthorized streaming links for anime. Alongside those pages, I added Latino TV and Colombian radio while I was living in Sherbrooke.',
				},
				id: 'ch1-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I maintained it from 2009 to 2011. As of July 2026, the site was still online. Looking back, what stands out is the combination on that page: anime I followed, television in Spanish, and radio from Colombia, put together with the limited tools I understood at the time. I did not know much about building software, but I had made a place on the internet and kept returning to maintain it for about two years.',
				},
				id: 'ch1-007',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Looking at that combination now, I can see the move between countries in the page itself. The site was built in Quebec, but some of what I put on it came from Colombia. I can see it now in what survived.',
				},
				id: 'ch1-008',
				type: 'paragraph',
			},
			{
				data: {
					text: 'In summer 2011, I earned $600 at my first job and used the money to buy my first computer, a Sony VAIO. It was the first machine I had funded myself. The computer I had wanted around 2005 or 2006 was finally mine. From 2011 to 2014, the computer was mostly for entertainment, with some light tinkering. I then completed a diploma in accounting and management. My heart still belonged to computers, but the route back was not immediate.',
				},
				id: 'ch1-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'After the diploma, I built a Shopify store from start to finish. Building it showed me there was more behind a page than the parts I could see and customize. I noticed that gap, but it did not immediately change my direction. The real turn came with a different project, one that never became a working product.',
				},
				id: 'ch1-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'The app I could not build' },
				id: 'ch1-011',
				type: 'header',
			},
			{
				data: {
					text: 'A friend suggested a website that would compare grocery prices. I tried to build it, but nothing functional shipped. I had made an anime site and assembled a Shopify store, yet I could not turn this idea into a working application. That failure made the limit of my knowledge concrete. It pushed me toward computer science in 2019.',
				},
				id: 'ch1-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This was different from customizing a template or assembling a storefront. The idea needed a working system behind the page, and I could not make one.',
				},
				id: 'ch1-013',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I finished the computer science program in December 2022. Today I work as a SQL developer and build personal projects. There were years of entertainment, an accounting diploma, a store, and an app attempt that went nowhere. Studying computer science was a later decision I made after finding something useful that I could not build.',
				},
				id: 'ch1-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The orange Ubuntu 9.04 CD is from 2009, and I still have it upstairs. Looking back, computers often gave me fast feedback: change something, see what happened, and try again. Other systems did not reveal themselves that quickly. Some took years before I could see their structure.',
				},
				id: 'ch1-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 1 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Next: <a href="/blog/how-i-learn-orbiting-a-system-until-it-clicks">How I learn: orbiting a system until it clicks</a>.',
				},
				id: 'ch1-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400000,
		version: '2.31.2',
	},
	'thinking-in-matrices': {
		blocks: [
			{
				data: {
					text: 'When I understood how GTFS Schedule and GTFS Realtime could work together, I saw a matrix of useful questions about Montréal transit. GTFS Schedule supplied the planned side: routes, trips, stops, and timetables. GTFS Realtime could add live trip updates, vehicle positions, numeric delay, and optional occupancy information. A single date, a date range, or a wider period added another dimension. <a href="https://transit.yesid.dev">transit.yesid.dev</a> came about in part from seeing how those dimensions could cross instead of treating each feed or metric as a separate fact.',
				},
				id: 'ch3-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Put a route on one axis and time on another, then ask where scheduled service and live observations diverge. Which routes are late across the chosen period? Does the pattern change when the date range changes? Where does available crowding information show a different pattern at a certain time? Which scheduled bus trips should be running now but have no matching live vehicle? Each question comes from a different intersection of planned service, live information, a product interpretation, and a time control. The matrix turns a list of fields into something I can examine.',
				},
				id: 'ch3-002',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Those questions require the source and product layers to stay separate. Delay is numeric, while early, on time, late, and severe are interpretations created by the product. Occupancy is optional and experimental, so it can be absent, incomplete, and not guaranteed to form a linear scale. Not reporting is separate: it is a product-derived signal for a scheduled bus trip that should be running now but has no matching live vehicle, not an official GTFS timing value.',
				},
				id: 'ch3-003',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Rows and columns, literally' },
				id: 'ch3-004',
				type: 'header',
			},
			{
				data: {
					text: 'I see an actual matrix. I see rows and columns. It is a visual thing. Granularity can be one part of the picture: one item, a group, or a wider level. Filters and the options they leave can be another. Decisions, database fields, and combinations occupy the same kind of visual space. The contents change with the subject, but the rows and columns remain visible to me.',
				},
				id: 'ch3-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'For one decision, I can picture the options as rows and the constraints as columns. One filter narrows the options; another adds a condition. I can see which combinations remain. The exact entries depend on the decision, but I still see the relationships as a grid.',
				},
				id: 'ch3-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'SQL fits that picture. A table gives each row a record and each column a field. Filters choose which records are in view, and a query can combine several conditions. Relations let me move from one record to related records when a single table does not explain enough. Granularity also changes the picture: a single record, a grouped result, and a wider set answer different questions. SQL gives precise names and operations to the rows, columns, filters, database fields, and combinations I see.',
				},
				id: 'ch3-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Accounting and SQL rhyme' },
				id: 'ch3-008',
				type: 'header',
			},
			{
				data: {
					text: 'Accounting and SQL connect in my head. Before I worked as a SQL developer, I studied accounting. When an amount was uncertain, a date and an amount were a place to start. They were clues, not guaranteed unique keys, because another record could share both values. The surrounding context could be in cash flow, a budget, a financial statement, or a transaction. Sometimes the date could point toward the right account; sometimes the amount only narrowed the search. I could move through those records and ask where the amount appeared, what it related to, and whether another record explained it better. JOINs and normalization later gave me more precise tools and language for following relations in data. The personal connection is the act of tracing: the first value points somewhere, the related records narrow the uncertainty, and the full answer depends on context.',
				},
				id: 'ch3-009',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'You have two hands' },
				id: 'ch3-010',
				type: 'header',
			},
			{
				data: {
					text: 'I remember a woman at a dishwasher job telling me, "You have two hands. Use both hands."',
				},
				id: 'ch3-011',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I kept that instruction. I still notice when one hand is idle and could already be helping. One hand can keep an action moving while the other starts the next one. Both hands can move in different directions toward different tasks. It did not stay at the dishwasher job; I carried it into other physical work. When I work or do something with my body, I look for that opening instead of waiting for one action to finish. It saves time, and I catch myself using the habit all the time. The change is physical and specific: notice the idle hand, give it part of the work, and let the two actions move together.',
				},
				id: 'ch3-012',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Where measurement stops' },
				id: 'ch3-013',
				type: 'header',
			},
			{
				data: {
					text: 'Data works because fields have definitions. A delay can be stored as a number, a date range has boundaries, and a product can group observations into stated categories. People are not hard parameters in the same way. You can collect the biggest metrics and still never fully measure a person. A score, category, or observation can describe something real, but it supports a limited claim.',
				},
				id: 'ch3-014',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The two-handed habit makes the difference clear. I can describe what changed: both hands work, actions move in different directions, and time is saved. Those measurements can describe the habit, but they cannot contain the person who taught it.',
				},
				id: 'ch3-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That is also how I work with AI: it can turn a conversation into structure, but I read every block from start to finish and make the final call.',
				},
				id: 'ch3-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This is chapter 3 of a six-chapter epic. Chapters 1–3: who I am. Chapters 4–6: what I build. Previous: <a href="/blog/how-i-learn-orbiting-a-system-until-it-clicks">How I learn: orbiting a system until it clicks</a> · Next: <a href="/blog/ai-accelerated-human-owned-my-actual-workflow">AI-accelerated, human-owned: my actual workflow</a>.',
				},
				id: 'ch3-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400002,
		version: '2.31.2',
	},
	'tu-sitio-web-necesita-publicacion-instantanea': {
		blocks: [
			{
				data: {
					text: 'Antes de elegir cómo publicar un sitio web, hazte una pregunta práctica: ¿una actualización debe quedar visible para el público en segundos o puede tardar unos minutos? La respuesta cambia la arquitectura.',
				},
				id: 'ch6-es-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Una sala de redacción puede necesitar que una corrección se vea de inmediato. Una tienda puede necesitar que cada solicitud use los datos vigentes de inventario y precios. Un sitio de servicios, un portafolio o un sitio empresarial relativamente estable puede aceptar una breve demora si separar, en tiempo de compilación, la edición de la entrega responde a sus necesidades de actualización y flujo de trabajo. La decisión correcta parte de la frecuencia de actualización necesaria, no de una herramienta favorita.',
				},
				id: 'ch6-es-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'El editor y el sitio público' },
				id: 'ch6-es-003',
				type: 'header',
			},
			{
				data: {
					text: 'El editor y el sitio público cumplen funciones distintas. El editor le da al propietario un solo lugar para modificar el contenido. El sitio público entrega las páginas que leen los visitantes.',
				},
				id: 'ch6-es-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En <a href="https://yesid.dev">yesid.dev</a>, la aplicación actual lee módulos de contenido generados para las páginas públicas en vez de pedirle contenido al CMS durante cada visita incluida en la muestra. En trazas recientes de producción del 10 de julio de 2026, la página de inicio, Servicios, Blog, un artículo publicado y la página del proyecto <a href="https://yesid.dev/projects/yesid-dev">yesid.dev</a> devolvieron un código 200. Todas las solicitudes observadas se mantuvieron en <a href="https://yesid.dev">yesid.dev</a>, sin solicitudes a Directus ni a un host <code>cms.*</code>. Esto es evidencia de cinco trazas, no una afirmación sobre todas las rutas ni sobre cada visita futura.',
				},
				id: 'ch6-es-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Depender menos del CMS en el sitio público tiene un valor práctico. Las páginas ya publicadas están diseñadas para seguir disponibles si el editor no lo está, porque no necesitan una respuesta nueva del CMS para cada lector. Esa expectativa se desprende de la arquitectura; no se ha demostrado mediante un simulacro independiente de interrupción del servicio. El sitio completo todavía puede fallar. Siguen existiendo dependencias de hosting, código, red y recursos.',
				},
				id: 'ch6-es-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Para el propietario sigue habiendo un solo editor. La separación se aplica a la forma en que el contenido publicado se genera y se entrega.',
				},
				id: 'ch6-es-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Qué pasa después de «Publicar»' },
				id: 'ch6-es-008',
				type: 'header',
			},
			{
				data: {
					text: 'Este es el único aparte técnico: la ruta de producción es Directus -&gt; exportación durante la compilación -&gt; módulos generados -&gt; SvelteKit/Vercel. El CMS entrega el contenido publicado al proceso de compilación, la compilación prepara los archivos públicos y solo un despliegue completado reemplaza la versión anterior.',
				},
				id: 'ch6-es-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La actualización de contenido en producción ya está habilitada. El 11 de julio de 2026, una compilación de producción registró <code>mode=live</code>, leyó <code>https://cms.yesid.dev</code> con una política de fallo cerrado, exportó cinco artículos publicados y cinco cuerpos de contenido, y generó los 22 módulos de contenido.',
				},
				id: 'ch6-es-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'La demora es parte del diseño' },
				id: 'ch6-es-011',
				type: 'header',
			},
			{
				data: {
					text: 'En la ruta de exportación en vivo, el contenido actualizado no se vuelve público hasta que un nuevo despliegue está listo. Para el registro del 11 de julio, la compilación de producción comenzó a las 06:17:57.482 UTC y el despliegue terminó a las 06:19:26.603 UTC: 89.121 segundos desde el inicio de la compilación hasta el despliegue completado.',
				},
				id: 'ch6-es-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Esa es una sola observación, no un SLA ni una promesa de que ese sea el rango habitual. Sí demuestra que este cambio específico del CMS llegó al sitio público: al terminar, las cinco URL nuevas previstas devolvieron un código 200, cada una tenía una URL canónica hacia sí misma y todas aparecieron en el sitemap; las tres URL de artículos retirados devolvieron un código 404 y desaparecieron del sitemap. Este artículo seguía deliberadamente como borrador durante ese registro; también devolvió un código 404 y no aparecía en el sitemap. Una compilación candidata anterior rechazó un enlace a esta página en borrador y no fue promovida, así que el despliegue anterior siguió activo hasta que terminó la compilación corregida.',
				},
				id: 'ch6-es-013',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Quién debería elegir otra opción' },
				id: 'ch6-es-014',
				type: 'header',
			},
			{
				data: {
					text: 'Esta arquitectura encaja mal cuando las actualizaciones deben publicarse en segundos. Eso incluye la publicación al ritmo de una sala de redacción, el inventario o los precios que deban reflejar los datos vigentes al atender cada solicitud, las aplicaciones con contenido personalizado, los tableros en vivo y cualquier flujo de trabajo que no pueda tolerar una compilación antes de que el contenido se vuelva público.',
				},
				id: 'ch6-es-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Puede funcionar para sitios de servicios, portafolios, documentación y otras páginas relativamente estables donde unos minutos sean aceptables. Incluso entonces, que sea una buena opción depende de las necesidades de vista previa, las aprobaciones editoriales, las integraciones y cuánto trabajo operativo esté dispuesto a asumir el propietario o el desarrollador. La entrega estática no es una recomendación universal.',
				},
				id: 'ch6-es-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Si ese equilibrio funciona para tu sitio, mira cómo el <a href="https://yesid.dev/services/web-development">servicio de Sitios web y e-commerce</a> aborda los proyectos web.',
				},
				id: 'ch6-es-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Este es el capítulo 6 de una saga de seis capítulos. Capítulos 1 a 3: quién soy. Capítulos 4 a 6: lo que construyo. Anterior: <a href="/es/blog/de-50-a-0-una-vm-oracle-always-free">De 50 $ a 0 $: una VM Oracle Always Free</a>.',
				},
				id: 'ch6-es-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400005,
		version: '2.31.2',
	},
	'un-dato-que-falta-no-equivale-a-cero': {
		blocks: [
			{
				data: {
					text: 'En Transit hay un mensaje pequeño que resume una parte importante del trabajo con los datos: los avisos de servicio de OC Transpo no están disponibles porque no hay un flujo de avisos conectado.',
				},
				id: '52d0bbae6433e6dd-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Una cifra podría parecer más convincente. Sin embargo, el mensaje es más preciso.',
				},
				id: '169b7e85a3d7194a-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cero avisos significaría que se consultó una fuente pertinente y que no se encontraron avisos dentro del alcance indicado. Un flujo que no está conectado significa que esa información no está disponible. Mostrar ambas situaciones de la misma manera daría una certeza que el sistema no tiene.',
				},
				id: 'd6b925f25c087577-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'El mismo problema aparece en tableros de uso cotidiano. Una celda vacía puede indicar que un dato aún no ha llegado, que una medida no aplica o que no fue posible calcular un valor. Reemplazar todos esos espacios por cero hace que la tabla se vea más uniforme, pero elimina parte de su significado.',
				},
				id: 'fc1ebcd3457a8b2e-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Por eso, además de revisar el cálculo, me interesa otra pregunta: ¿qué va a entender la persona cuando vea el resultado?',
				},
				id: '515a5055ac6c4470-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'En el caso de Ottawa, la interfaz ofrece una respuesta sencilla. Indica que los avisos no están disponibles, explica la razón y enlaza los avisos oficiales. Así, la persona tiene un siguiente paso útil sin que Transit afirme conocer el estado de las interrupciones.',
				},
				id: 'c5277371b3d1239c-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La actualización de los datos exige un cuidado parecido. Una página que acaba de cargar puede contener una observación anterior. La hora de consulta, la hora de publicación y el momento en que la fuente reportó un evento son cosas distintas.',
				},
				id: 'dd5ed3e83188b79c-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Estas son algunas de las diferencias que estoy estudiando con Transit. Para revisar un indicador, puedo empezar con tres preguntas: qué se observó, durante qué periodo y qué sigue siendo desconocido. Ayudan a entender el resultado antes de usarlo para sostener una conclusión.',
				},
				id: 'e6cb7cf52423e207-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Una interfaz puede reconocer que falta información y seguir siendo útil. Puede explicar el vacío, señalar su alcance y orientar a la persona hacia una fuente que tenga la respuesta.',
				},
				id: 'cd4d2d016def3204-8',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/es/projects/transit-data-pipeline">Conocer el proyecto</a>',
				},
				id: 'af1d6ec46296cf77-9',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'une-donnee-absente-nest-pas-un-zero': {
		blocks: [
			{
				data: {
					text: 'Dans Transit, un petit message résume une bonne partie du travail sur les données : les avis de service d’OC Transpo sont indisponibles parce qu’aucun flux d’avis n’est connecté ici.',
				},
				id: '43f34f090843a56f-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ce message paraît moins satisfaisant qu’un chiffre. Pourtant, il dit quelque chose de plus précis.',
				},
				id: '1705d8f2f6023028-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Zéro avis signifierait qu’on a pu consulter une source pertinente et qu’aucun avis n’y a été trouvé dans le périmètre annoncé. Un flux non connecté signifie qu’on ne dispose pas de cette information. Présenter les deux situations de la même façon donnerait une assurance que le système n’a pas.',
				},
				id: 'a91c9c03552eaef7-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Le même problème revient dans des tableaux de bord beaucoup plus ordinaires. Une cellule vide peut désigner une donnée pas encore reçue, une mesure qui ne s’applique pas ou une valeur qu’on n’a pas réussi à calculer. Remplacer toutes ces cellules par zéro rend le tableau plus uniforme, mais efface une partie de son sens.',
				},
				id: '5dc5432e8139ada2-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Je travaille donc sur une question qui dépasse le calcul : qu’est-ce que la personne va comprendre en regardant ce résultat?',
				},
				id: '3c52495e14b7f063-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Dans le cas d’Ottawa, la réponse prend une forme simple. L’interface indique que les avis sont indisponibles, explique pourquoi et offre un lien vers les avis officiels. La personne dispose d’un prochain geste utile, sans que le site prétende connaître l’état des perturbations.',
				},
				id: '5ae0a4dca9e29f75-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'La fraîcheur demande la même attention. Une page qui vient de se charger peut contenir une observation plus ancienne. L’heure de consultation, l’heure de publication et l’heure du signal reçu ne racontent pas la même chose.',
				},
				id: '1f5ff0749f272aa2-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ces distinctions font partie de ce que j’approfondis avec Transit. Pour examiner un indicateur, je peux commencer par trois questions : qu’est-ce qui a été observé, sur quelle période, et que reste-t-il inconnu? Elles aident à comprendre le résultat avant de lui demander de soutenir une conclusion.',
				},
				id: 'a3d8b3a9a5f17c72-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Une interface claire peut afficher un manque d’information sans devenir inutile. Elle peut préciser ce manque, expliquer sa portée et orienter la personne vers une source qui en sait davantage.',
				},
				id: '50f6d3e433dcec57-8',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/fr/projects/transit-data-pipeline">Découvrir le projet</a>',
				},
				id: '3f6cf0377394fb3a-9',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'votre-site-web-a-t-il-besoin-dune-publication-instantanee': {
		blocks: [
			{
				data: {
					text: 'Avant de choisir comment un site web publie son contenu, posez une question pratique : une mise à jour doit-elle être publique en quelques secondes, ou peut-elle prendre quelques minutes? La réponse change l’architecture.',
				},
				id: 'ch6-fr-001',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Une salle de rédaction peut avoir besoin qu’une correction soit visible immédiatement. Un magasin peut avoir besoin que les stocks et les prix fassent autorité à chaque requête. Un site de services, un portfolio ou un site d’entreprise relativement stable peut accepter un court délai lorsqu’une architecture qui sépare l’édition de la diffusion au moment de la compilation convient à ses besoins de fraîcheur et à son flux de travail. Le bon choix commence par le besoin de fraîcheur, pas par un outil préféré.',
				},
				id: 'ch6-fr-002',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'L’éditeur et le site public' },
				id: 'ch6-fr-003',
				type: 'header',
			},
			{
				data: {
					text: 'L’éditeur et le site public ont des fonctions différentes. L’éditeur offre au propriétaire un seul endroit pour modifier le contenu. Le site public diffuse les pages que les visiteurs lisent.',
				},
				id: 'ch6-fr-004',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Sur <a href="https://yesid.dev">yesid.dev</a>, l’application actuelle lit des modules de contenu générés pour les pages publiques au lieu de demander le contenu au CMS lors de chacune des visites échantillonnées. Dans des traces de production récentes du 10 juillet 2026, la page d’accueil, Services, Blog, un article publié et la page du projet <a href="https://yesid.dev/projects/yesid-dev">yesid.dev</a> ont tous renvoyé un code 200. Chaque requête observée est restée sur <a href="https://yesid.dev">yesid.dev</a>, sans aucune requête vers Directus ou vers un hôte <code>cms.*</code>. Il s’agit d’une preuve tirée de cinq traces, pas d’une affirmation sur chaque route ou chaque visite future.',
				},
				id: 'ch6-fr-005',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Cette dépendance plus limitée envers le CMS a une valeur pratique. Les pages déjà publiées sont conçues pour rester accessibles si l’éditeur est indisponible, car elles n’ont pas besoin d’une nouvelle réponse du CMS pour chaque lecteur. Cette attente découle de l’architecture; elle n’a pas été démontrée par un exercice de panne indépendant. Cela ne met pas non plus l’ensemble du site web à l’abri des pannes. D’autres dépendances liées à l’hébergement, au code, au réseau et aux ressources existent encore.',
				},
				id: 'ch6-fr-006',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Pour le propriétaire, il y a toujours un seul éditeur. La séparation concerne la façon dont le contenu publié est construit et diffusé.',
				},
				id: 'ch6-fr-007',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Ce qui se passe après « Publier »' },
				id: 'ch6-fr-008',
				type: 'header',
			},
			{
				data: {
					text: 'Voici le seul aparté technique : le chemin de production est Directus -&gt; export à la compilation -&gt; modules générés -&gt; SvelteKit/Vercel. Le CMS fournit le contenu publié au processus de compilation, la compilation prépare les fichiers publics et seul un déploiement terminé remplace la version précédente.',
				},
				id: 'ch6-fr-009',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Ce rafraîchissement du contenu en production est maintenant activé. Le 11 juillet 2026, une compilation de production a consigné <code>mode=live</code>, a lu <code>https://cms.yesid.dev</code> selon une politique qui bloque en cas d’échec, a exporté cinq articles publiés et cinq corps d’article, puis a produit les 22 modules de contenu générés.',
				},
				id: 'ch6-fr-010',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Le délai fait partie de la conception' },
				id: 'ch6-fr-011',
				type: 'header',
			},
			{
				data: {
					text: 'Dans le chemin d’exportation en direct, le contenu actualisé ne devient pas public avant qu’un nouveau déploiement soit prêt. Au moment de ce relevé du 11 juillet, la compilation de production a commencé à 06:17:57.482 UTC et le déploiement s’est terminé à 06:19:26.603 UTC : 89.121 secondes entre le début de la compilation et la fin du déploiement.',
				},
				id: 'ch6-fr-012',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Il s’agit d’une observation, pas d’un SLA ni d’une fourchette habituelle garantie. Elle prouve que cette modification précise du CMS a atteint le site public : une fois le déploiement terminé, les cinq nouvelles URL d’article prévues ont renvoyé un code 200, avaient chacune une URL canonique qui pointait vers elle-même et figuraient dans le plan du site; les trois URL d’article retirées ont renvoyé un code 404 et ont disparu du plan du site. Cet article était délibérément encore à l’état de brouillon pendant ce relevé, renvoyait lui aussi un code 404 et était absent du plan du site. Une compilation candidate antérieure a rejeté un lien vers cette page à l’état de brouillon et n’a pas été promue, de sorte que le déploiement précédent est resté en ligne jusqu’à la fin de la compilation corrigée.',
				},
				id: 'ch6-fr-013',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Qui devrait choisir autre chose' },
				id: 'ch6-fr-014',
				type: 'header',
			},
			{
				data: {
					text: 'Cette architecture convient mal lorsque les mises à jour doivent être publiques en quelques secondes. Cela comprend la publication au rythme d’une salle de rédaction, les stocks ou les prix qui doivent faire autorité au moment de la requête, les applications personnalisées, les tableaux de bord en direct et tout flux de travail qui ne peut pas tolérer une compilation avant la mise en ligne du contenu.',
				},
				id: 'ch6-fr-015',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Elle peut convenir aux sites de services, aux portfolios, à la documentation et à d’autres pages relativement stables pour lesquelles quelques minutes sont acceptables. Même alors, la pertinence dépend des besoins d’aperçu, des approbations éditoriales, des intégrations et de la quantité de travail opérationnel que le propriétaire ou le développeur est prêt à prendre en charge. La livraison statique n’est pas une recommandation universelle.',
				},
				id: 'ch6-fr-016',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Si ce compromis convient à votre site, voyez comment le <a href="https://yesid.dev/services/web-development">service Sites web et commerce électronique</a> aborde les projets web.',
				},
				id: 'ch6-fr-017',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Voici le chapitre 6 d’une épopée en six chapitres. Chapitres 1 à 3 : qui je suis. Chapitres 4 à 6 : ce que je construis. Précédent : <a href="/fr/blog/de-50-a-0-une-vm-oracle-always-free">De 50 $ à 0 $ : une VM Oracle Always Free</a>.',
				},
				id: 'ch6-fr-footer',
				type: 'paragraph',
			},
		],
		time: 1783742400005,
		version: '2.31.2',
	},
	'what-can-move-forward-before-the-product-catalogue-is-final': {
		blocks: [
			{
				data: {
					text: 'A website can present a business before it includes a complete product catalogue. Café Arona’s current site focuses on information and contact. A catalogue can be added later.',
				},
				id: '62d811137cffd6d0-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'That context helps me separate decisions we can make now from decisions that depend on the product.',
				},
				id: 'de5a600b3b57a9bd-1',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Start with what is known' },
				id: 'a1da136a4dbf8b05-2',
				type: 'header',
			},
			{
				data: {
					text: 'A business can explain who is involved, where the idea came from and how to get in touch. It can prepare photographs, review its writing and decide who will keep the content current.',
				},
				id: '19992bc37ad4f30f-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This work also reveals gaps. A team page may be waiting for a portrait. A product page may show that a package size or preparation method has not been confirmed. The website becomes something concrete to discuss with the client.',
				},
				id: 'b66aa5c904225611-4',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Keep provisional decisions visible' },
				id: 'e4786278f07729db-5',
				type: 'header',
			},
			{
				data: {
					text: 'A finished-looking page can make an unfinished decision seem settled. Put a name, photograph and price together, and a product starts to look ready to order.',
				},
				id: 'a2088786f13be1d2-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'A simple list can give each piece of information a status: confirmed, being tested or still needed. That makes it less likely that a layout example will turn into a promise to a customer.',
				},
				id: '04d9668c689cf653-7',
				type: 'paragraph',
			},
			{
				data: { level: 2, text: 'Prepare the everyday work' },
				id: '094fbf516b3f6d43-8',
				type: 'header',
			},
			{
				data: {
					text: 'Before opening, the team can agree on how it will edit text, replace a photograph and check a translation. It also needs to know who approves prices and who confirms available quantities.',
				},
				id: 'f3009c1cb51e818d-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The same applies to access. The person who owns the store, the person who updates its content and the person who changes its code may have different responsibilities.',
				},
				id: 'f1b91873c64f4224-10',
				type: 'paragraph',
			},
			{
				data: {
					text: 'An informational site should be useful on its own. Clear content, editable pages and defined responsibilities provide a foundation for adding a product catalogue later, when its information is ready.',
				},
				id: '6aa18498eea1894f-11',
				type: 'paragraph',
			},
			{
				data: {},
				id: 'e6cb61bf8d706fb8-12',
				type: 'delimiter',
			},
			{
				data: {
					text: '<a href="/projects/cafe-arona">Read the project story</a>',
				},
				id: 'acc5ba0dc8ae4fc7-13',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
	'when-two-similar-components-should-stay-separate': {
		blocks: [
			{
				data: {
					text: 'Two cards can look related and still need different contracts.',
				},
				id: 'f0e109d7f4b29e0b-0',
				type: 'paragraph',
			},
			{
				data: {
					text: 'In <a href="http://yesid.dev">yesid.dev</a>-design, the recorded requirements for Transit and <a href="http://yesid.dev">yesid.dev</a> make that difference concrete. Transit expects a flat card without a shadow or highlighted edge. <a href="http://yesid.dev">yesid.dev</a> keeps a bevel and a hover shadow. Both belong to the same visual family. Their requirements still disagree.',
				},
				id: '32d667584c4c02ff-1',
				type: 'paragraph',
			},
			{
				data: {
					text: 'Putting both into a shared package would be easy if the package were allowed to ask which product was calling it. That is exactly the dependency the project&#39;s rules exclude. Once shared code knows every product by name, each new exception adds another reason to edit the foundation.',
				},
				id: '92afffd41fb4705b-2',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The boundary I chose is smaller. The package owns the common control or surface. A product-owned adapter or style owns the part that differs. Each product keeps the checks that explain why its exception exists.',
				},
				id: 'b529af048c785791-3',
				type: 'paragraph',
			},
			{
				data: {
					text: 'This accepts some duplication. It also gives that duplication a reason and a home.',
				},
				id: '9ffdc02cce29100b-4',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The question is whether two pieces share the same responsibility. Their current appearance is one clue, but it does not settle what they do, who controls their state or which changes they should receive together.',
				},
				id: '008af0740a8649d6-5',
				type: 'paragraph',
			},
			{
				data: {
					text: 'A collapsible section is another example. It may have a heading, a chevron and hidden content in both products. Yet the products can differ in persistence, header composition and how closed content behaves. Shared lower-level controls are useful there. Promoting the entire section would also promote decisions that still belong to the product.',
				},
				id: '89c89d98ca5b7ba2-6',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The repository uses a rule of three for composed patterns: three independent consumers must need the same contract before promotion. That is a constraint on this project, not a universal formula for every team. It forces a useful pause before treating resemblance as a stable abstraction.',
				},
				id: 'c7a61c2825da769b-7',
				type: 'paragraph',
			},
			{
				data: {
					text: 'There is a release consequence too. Once something becomes shared, a change has several audiences. Each product adopts an exact version and reviews its own behaviour. A passing gallery example cannot answer every question on a real product page.',
				},
				id: '9e1c0ac706052d00-8',
				type: 'paragraph',
			},
			{
				data: {
					text: 'I find this a useful way to make reuse more concrete. What repeats? What differs? Which differences are intentional? Who gets to decide when those differences change?',
				},
				id: 'fb3386c60ca5864e-9',
				type: 'paragraph',
			},
			{
				data: {
					text: 'The answer may be a shared component. It may also be a small common primitive with a local wrapper, or two separate implementations whose responsibilities are still evolving. The useful result is a boundary that can be explained and checked.',
				},
				id: '426bc218d7498bd8-10',
				type: 'paragraph',
			},
			{
				data: {
					text: '<a href="/projects/yesid-dev-design">Read the project story</a>',
				},
				id: 'b0d5561e2204c7da-11',
				type: 'paragraph',
			},
		],
		time: 1791432000000,
		version: '2.31.2',
	},
};
