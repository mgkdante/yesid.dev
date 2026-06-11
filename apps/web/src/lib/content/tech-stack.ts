// ----------------------------------------------------------------------
// GENERATED FILE — do not edit by hand.
//
// /tech-stack page chrome + tech-stack items array, both CMS-derived.
//
// Source: live Directus CMS state via `bun run export:fallbacks`
// (apps/cms/scripts/export-fallbacks.ts). Regenerated on every build via
// apps/web's `prebuild` hook. Commits surface as CMS-content diffs.
// ----------------------------------------------------------------------

import type { TechStackPageContent, TechStackItem } from '$lib/types';

export const techStackPageContent: TechStackPageContent = {
	actions: {
		getInTouch: { en: 'Get In Touch' },
		viewServices: { en: 'View Services' },
	},
	cta: {
		availability: { en: 'Available for Q2 2026' },
		headingLine1: { en: 'Found your stack' },
		headingLine2: { en: 'Let\'s build it' },
		sub: {
			en: 'Whether it\'s a data pipeline, a web app, or a mobile product — the infrastructure is ready.',
		},
	},
	hero: {
		overline: { en: 'Infrastructure Map' },
		stats: {
			technologies: { en: 'technologies' },
		},
		terminalAria: { en: 'Infrastructure overview' },
		titleLine1: { en: 'The Control' },
		titleLine2: { en: 'Room' },
	},
	meta: {
		description: {
			en: '{itemCount}+ technologies — an interactive map of how digital infrastructure gets built.',
		},
		title: { en: 'Tech Stack — yesid.' },
	},
};

export const techStackItems: readonly TechStackItem[] = [
	{
		icon: {
			iconify_id: 'logos:airflow',
			id: 'airflow',
			name: 'Apache Airflow',
			svg_override: null,
		},
		id: 'airflow',
		name: 'Apache Airflow',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Transit Operations Data Pipeline runs on Airflow — orchestrating the daily cycle of GTFS-RT feed ingestion, Python transformations, PostgreSQL loads, and Power BI dataset refreshes. Each task has retry logic, SLA alerts, and dependency chains that ensure data quality gates pass before downstream consumers see new data. Airflow\'s web UI gives the operations team visibility into pipeline health without needing to SSH into servers or read log files.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Apache Airflow is a workflow orchestration platform that lets you define, schedule, and monitor data pipelines as Python code. Instead of cron jobs or manual scripts, you write DAGs (Directed Acyclic Graphs) that declare tasks and their dependencies — "extract data, then transform it, then load it, and if any step fails, retry three times and alert me." Airflow provides a web UI for monitoring, a scheduler for timing, and integrations with virtually every data tool.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977601,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Airflow turns "a bunch of scripts that run in order" into a proper orchestration system with retries, logging, alerting, and dependency management. I use it when pipelines have multiple steps that need to run in a specific order, when failures need automatic retry logic, and when stakeholders need visibility into pipeline health. I write DAGs as Python code (not YAML configuration), which means the full power of Python is available for dynamic task generation and conditional logic.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977602,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'alembic',
			name: 'Alembic',
			svg_override: null,
		},
		id: 'alembic',
		name: 'Alembic',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline', 'database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, Alembic manages the PostgreSQL schema as the data model evolves — adding new feed types, modifying KPI calculation tables, and adjusting indexes based on query performance analysis. For the Lorem Database Migration, Alembic tracked every schema change during the MySQL-to-PostgreSQL transition, giving the team a clear audit trail and the ability to roll back any step of the migration independently.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Alembic is a database migration tool for Python, built on top of SQLAlchemy. It version-controls your database schema the same way Git version-controls your code — each change (add a column, create a table, modify a constraint) is a numbered migration file that can be applied forward or rolled back. This means your database structure is reproducible, auditable, and deployable across environments.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Database changes without migration tooling are a recipe for "it works on my machine" disasters. Alembic gives me version-controlled, reversible schema changes that I can test in staging before touching production. I write every migration with a corresponding downgrade path, and I test both directions against realistic data volumes. The autogenerate feature speeds up development, but I always review the generated SQL — auto-migration tools miss nuances like data backfills and index strategies.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977603,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:bun',
			id: 'bun',
			name: 'Bun',
			svg_override: null,
		},
		id: 'bun',
		name: 'Bun',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev runs entirely on Bun — <code>bun install</code> for dependencies, <code>bun run dev</code> for the dev server, <code>bun run test</code> for Vitest, <code>bun run check</code> for TypeScript and Svelte checks. The lockfile is <code>bun.lockb</code> (binary format, faster than JSON), and the entire development workflow uses Bun commands exclusively. The speed difference is most noticeable in CI: Bun\'s fast install and test execution keep the feedback loop tight on every push.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Bun is an all-in-one JavaScript runtime, bundler, and package manager built from scratch in Zig. It\'s designed as a drop-in replacement for Node.js — running the same JavaScript and TypeScript code — but significantly faster. Bun handles package installation (replacing npm/yarn), runs TypeScript natively without a separate compile step, includes a built-in test runner, and starts up faster than Node.js. It\'s npm-compatible, so existing packages work without changes.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977605,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Bun is my runtime for all new JavaScript/TypeScript projects. Package installation that takes 30 seconds with npm takes 2 seconds with Bun. The test runner is built in and fast. TypeScript runs without a compile step. Every day I save minutes on dependency installation, test runs, and dev server startups — and those minutes add up across hundreds of development iterations. Bun is also a learning opportunity: I chose it deliberately to stay current with the JavaScript runtime ecosystem.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977606,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:c-plusplus',
			id: 'cpp',
			name: 'C++',
			svg_override: null,
		},
		id: 'cpp',
		name: 'C++',
		relatedProjects: [],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'C++ informs my systems thinking more than my daily coding. When I\'m optimizing SQL Server query plans or understanding why a PostgreSQL index choice matters, that knowledge traces back to understanding how B-trees work at the memory level, how hash joins use memory allocation, and how CPU cache lines affect scan performance. It\'s the foundational layer that makes my higher-level optimizations more informed.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977606,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'C++ is a general-purpose systems programming language that gives you direct control over hardware and memory. It\'s the language behind operating systems, game engines, databases (including PostgreSQL itself), browsers, and performance-critical infrastructure. Modern C++ (C++17/20/23) has evolved significantly from its roots — with smart pointers, ranges, concepts, and coroutines that make it safer and more expressive while maintaining its zero-overhead abstraction principle.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977606,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'C++ gives me an understanding of how the systems I build on actually work. Knowing C++ means I understand memory layout, cache behavior, and the performance characteristics that matter when I\'m tuning database queries or designing high-throughput pipelines. It\'s foundational knowledge — even when I\'m writing Python or TypeScript, understanding what the runtime is doing under the hood helps me make better performance decisions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977607,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:c-sharp',
			id: 'csharp',
			name: 'C#',
			svg_override: null,
		},
		id: 'csharp',
		name: 'C#',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In SQL Server environments, C# is often the application layer sitting on top of the databases I tune. When I optimize stored procedures or redesign schemas for a client, I verify that their C# data access code handles the changes correctly — checking Entity Framework mappings, connection pooling settings, and transaction scopes. That full-stack awareness prevents the "the database is fine, it must be the app" finger-pointing.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977607,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'C# is a modern, statically-typed language developed by Microsoft, primarily used for building Windows applications, web APIs with ASP.NET, and game development with Unity. It runs on the .NET runtime (now cross-platform) and combines the performance of a compiled language with developer-friendly features like LINQ, async/await, and pattern matching. If an organization uses Microsoft tools, C# is likely their primary development language.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977607,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'C# connects my data work to the Microsoft enterprise ecosystem. Many of my SQL Server clients have C# applications that consume the databases I optimize — understanding both sides of that boundary means I can diagnose performance issues end-to-end. I\'ve written data access layers in C# with Entity Framework, built console tools for database maintenance, and debugged ASP.NET applications to trace slow queries back to their ORM origins.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'dax',
			name: 'DAX',
			svg_override: null,
		},
		id: 'dax',
		name: 'DAX',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Lorem Analytics Dashboard, DAX powers every KPI calculation — from department-level revenue metrics to cross-department comparisons with dynamic date ranges. The semantic layer I built uses DAX measures exclusively (no calculated columns where measures suffice) to keep the model lean and the refreshes fast. Understanding DAX at a deep level means I can diagnose "the numbers don\'t match" issues that typically take teams days to resolve.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'DAX (Data Analysis Expressions) is a formula language used in Power BI, Analysis Services, and Power Pivot. Think of it as a specialized language for writing business calculations — revenue growth, running totals, year-over-year comparisons, weighted averages — that work across filtered and sliced data. DAX operates on a columnar data model and uses concepts like filter context and row context to evaluate expressions dynamically as users interact with dashboards.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977608,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'DAX is where business logic meets data modeling, and getting it right is the difference between dashboards that perform and dashboards that lie. I write DAX measures that handle complex time intelligence (YTD, prior year comparison, rolling averages), dynamic segmentation, and what-if analysis. I understand the evaluation context deeply — filter context propagation, CALCULATE overrides, and the iterator vs. aggregator distinction that trips up most Power BI developers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'packages every service to run the same anywhere',
			es: 'empaqueta cada servicio para que corra igual en cualquier lugar',
			fr: 'emballe chaque service pour qu\'il tourne pareil partout',
		},
		icon: {
			iconify_id: 'logos:docker',
			id: 'docker',
			name: 'Docker',
			svg_override: null,
		},
		id: 'docker',
		layer: 'infra',
		name: 'Docker',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Transit Operations Data Pipeline is fully containerized with Docker — Python services, PostgreSQL, and Airflow all run as Docker containers orchestrated with Docker Compose. This means the entire pipeline can be reproduced in any environment: development laptops, CI runners, and production servers. Docker Compose defines the service dependencies, health checks, and volume mounts, so starting the full pipeline is one command.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Docker packages applications and their dependencies into containers — lightweight, portable environments that run consistently everywhere. Instead of "it works on my machine" problems, a Docker container bundles your code, runtime, libraries, and configuration into a single image. That image runs identically on your laptop, in CI/CD, and in production. Docker Compose lets you define multi-container setups (app + database + cache) in one file.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977609,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Docker eliminates environment drift — the silent killer of data pipelines and deployments. When I hand off a pipeline to a client\'s ops team, they run <code>docker compose up</code> and get the exact same environment I developed in. No missing Python packages, no wrong PostgreSQL version, no library conflicts. I use Docker for data pipeline development, integration testing (spinning up real databases for tests), and packaging applications for deployment.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977610,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:flutter',
			id: 'flutter',
			name: 'Flutter',
			svg_override: null,
		},
		id: 'flutter',
		name: 'Flutter',
		relatedProjects: [],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Flutter is part of my expanding mobile toolkit, complementing Kotlin/Jetpack Compose for native Android work. I\'m exploring it for projects where cross-platform reach matters more than platform-native feel — internal tools, data visualization apps, and client-facing dashboards that need to work on both phone platforms without maintaining two separate codebases.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977611,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Flutter is Google\'s cross-platform UI toolkit for building natively compiled applications for mobile, web, and desktop from a single Dart codebase. Instead of using platform-specific widgets, Flutter draws every pixel itself using its own rendering engine (Skia/Impeller), giving you precise control over the look and feel across iOS and Android. Hot reload lets you see changes instantly during development.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977610,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Flutter is my cross-platform exploration path. When a project needs to ship on both iOS and Android with a shared codebase, Flutter\'s widget system and Dart\'s type safety make it a compelling choice. I\'m building familiarity with its layout model (which shares concepts with CSS Flexbox) and its state management patterns. Coming from web development, Flutter\'s declarative UI approach feels natural — components are functions of state, just like Svelte.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977611,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:github-actions',
			id: 'github-actions',
			name: 'GitHub Actions',
			svg_override: null,
		},
		id: 'github-actions',
		name: 'GitHub Actions',
		relatedProjects: ['yesid-dev'],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, GitHub Actions runs the test suite (<code>bun run test</code>), type checks (<code>bun run check</code>), and triggers Vercel deployments on every push. Pull request workflows run the full test matrix and block merging if tests fail. The pipeline also handles scheduled tasks and can be extended with Playwright E2E tests as the project grows. Having CI run on every commit means I catch broken builds immediately — not after deploying to production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions is a CI/CD platform built into GitHub. You define workflows in YAML files that run automatically on events — push, pull request, schedule, or manual trigger. Each workflow runs on a virtual machine (Ubuntu, Windows, or macOS) and can execute shell commands, run tests, build code, deploy applications, or interact with any API. The marketplace offers thousands of pre-built actions for common tasks.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977611,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'GitHub Actions integrates directly with where my code lives — no separate CI service to configure, no webhooks to maintain, no additional accounts to manage. I define my test and deploy pipeline in <code>.github/workflows/</code>, and it runs on every push. The tight integration means PR checks show test results inline, deployment status appears on the commit, and I can trigger workflows from GitHub\'s UI when needed. For solo and small-team projects, it\'s the simplest path to professional CI/CD.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977612,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'simple-icons:gsap',
			id: 'gsap',
			name: 'GSAP',
			svg_override: null,
		},
		id: 'gsap',
		name: 'GSAP',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, GSAP powers every motion element. The tech stack diagram uses DrawSVGPlugin to animate connection lines being drawn between nodes, MotionPathPlugin for data packet dots traveling along those lines, and ScrollTrigger for the entrance sequence where layers boot up bottom-to-top. The services page uses GSAP timelines for station reveal animations, and the home page hero sequence choreographs text, shapes, and SVG elements through a scroll-linked timeline.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'GSAP (GreenSock Animation Platform) is a professional-grade JavaScript animation library. It animates any numeric property — CSS transforms, SVG attributes, canvas elements, even custom object values — with frame-accurate timing and buttery-smooth 60fps performance. Its plugin ecosystem includes ScrollTrigger for scroll-linked animations, DrawSVGPlugin for animating SVG path drawing, and MotionPathPlugin for moving elements along curves. GSAP is now fully free and open-source with all plugins included.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'CSS animations are fine for hover states and simple transitions, but they fall apart when you need choreographed sequences, scroll-linked timelines, or SVG path animations. GSAP gives me frame-level control with a clean API. I can build a staggered entrance animation, link it to scroll position, reverse it on exit, and respect <code>prefers-reduced-motion</code> — all in a few lines of code. The timeline API makes complex multi-element choreography composable and debuggable.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:java',
			id: 'java',
			name: 'Java',
			svg_override: null,
		},
		id: 'java',
		name: 'Java',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Java shows up in my consulting work when clients have existing Spring Boot services or Android applications. My Java experience bridges naturally to Kotlin — I understand the JVM fundamentals, the memory model, and the concurrency primitives that both languages share. When evaluating whether to modernize a Java service to Kotlin or rewrite it entirely, that dual fluency helps me make practical recommendations.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977614,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Java is a statically-typed, object-oriented programming language that runs on the Java Virtual Machine (JVM). It\'s been the backbone of enterprise software for over 25 years — powering everything from Android apps to banking systems to massive distributed services. Its "write once, run anywhere" promise means compiled Java code runs on any platform with a JVM, and its mature ecosystem includes frameworks like Spring Boot, Hibernate, and Apache Kafka.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977613,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Java is part of my backend toolkit, especially for enterprise environments where JVM-based systems are the standard. I\'m proficient with Spring Boot for web services and familiar with the broader Java ecosystem (Maven, Gradle, JUnit). When a client\'s team is Java-native, I work within that stack rather than pushing a language change. Java\'s strong typing, mature tooling, and performance characteristics make it a solid choice for long-lived systems.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977614,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'devicon:jetpackcompose',
			id: 'jetpack-compose',
			name: 'Jetpack Compose',
			svg_override: null,
		},
		id: 'jetpack-compose',
		name: 'Jetpack Compose',
		relatedProjects: [],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Jetpack Compose is part of my mobile development growth path, paired with Kotlin. The goal is to build native Android apps that connect to the same backend APIs and databases I architect for web clients — extending the digital infrastructure story from dashboard to pocket. Understanding both Compose and Flutter lets me advise clients on native vs. cross-platform tradeoffs from hands-on experience.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977615,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Jetpack Compose is Android\'s modern UI toolkit for building native interfaces with Kotlin. Instead of XML layouts, you write composable functions that describe your UI declaratively — similar to how React components or Svelte files work. The framework handles re-rendering when state changes, animation APIs are built in, and Material Design 3 components are available out of the box. Google now recommends Compose as the default way to build Android UIs.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977615,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Jetpack Compose feels like the mobile equivalent of Svelte\'s approach to UI: declarative, reactive, and close to the metal. I\'m learning it as my entry point into native Android development, specifically for building data-connected mobile applications. The composable function model maps well to my existing mental model of component-based UI, and Kotlin\'s type system catches errors the same way TypeScript does on the web side.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977615,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:kotlin',
			id: 'kotlin',
			name: 'Kotlin',
			svg_override: null,
		},
		id: 'kotlin',
		name: 'Kotlin',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Kotlin is part of my mobile development learning path, paired with Jetpack Compose for building native Android interfaces. The language\'s interoperability with Java means I can work within existing Android codebases without rewriting everything — adopting Kotlin file by file. As I expand from digital infrastructure into mobile app development, Kotlin is the bridge between my backend JVM experience and native mobile UIs.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Kotlin is a modern programming language that runs on the JVM, developed by JetBrains. It\'s fully interoperable with Java but offers a more concise and expressive syntax — null safety built into the type system, coroutines for async programming, and extension functions that make APIs feel natural. Google made it the preferred language for Android development in 2019, and it\'s increasingly used for backend services with Ktor and Spring Boot.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Kotlin is where I\'m expanding my mobile and backend capabilities. Its null safety alone prevents an entire class of runtime crashes that plague Java codebases, and coroutines make async code readable without callback hell. I\'m learning it through Jetpack Compose for Android development — building declarative UIs that feel similar to Svelte\'s component model. The JVM foundation means my Java knowledge transfers directly.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:mysql',
			id: 'mysql',
			name: 'MySQL',
			svg_override: null,
		},
		id: 'mysql',
		name: 'MySQL',
		relatedProjects: [],
		relatedServices: ['sql-development', 'database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL has been the source database in several migration projects I\'ve handled. The Lorem Database Migration started as a MySQL instance that had outgrown its schema design — I mapped every data type, converted stored procedures, and built the dual-write migration path to PostgreSQL. Understanding MySQL\'s storage engines and locking behavior was critical to planning the zero-downtime cutover.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL is one of the most widely deployed relational databases in the world, especially in web applications. It stores data in tables with defined schemas, supports transactions, and is the "M" in the classic LAMP stack (Linux, Apache, MySQL, PHP). It\'s fast for read-heavy workloads and has a massive community with extensive documentation and tooling.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977616,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'MySQL shows up in legacy systems more than in my new projects. I\'m proficient at working with it — optimizing queries, designing schemas, managing replication — but I typically recommend PostgreSQL for new work because of its richer feature set. That said, when a client\'s infrastructure is already MySQL-based, I work within that ecosystem rather than pushing an unnecessary migration. Knowing both MySQL and PostgreSQL well means I can make honest recommendations about when a migration is worth the effort.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:nextjs',
			id: 'nextjs',
			name: 'Next.js',
			svg_override: null,
		},
		id: 'nextjs',
		name: 'Next.js',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Next.js appears in my consulting work when clients have existing React codebases. My experience with both SvelteKit and Next.js gives me perspective on the tradeoffs: Next.js offers a richer ecosystem and easier hiring, while SvelteKit offers better performance defaults and less boilerplate. When a client asks "which framework should we use?", I can answer from direct experience with both, not theory.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Next.js is a React-based full-stack framework developed by Vercel. It provides file-based routing, server-side rendering, static generation, API routes, and middleware out of the box. The App Router (introduced in v13) uses React Server Components to render on the server by default, sending less JavaScript to the browser. It\'s the most popular React framework and the default choice for production React applications.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Next.js is my React framework of choice when a project requires the React ecosystem — existing component libraries, team familiarity, or third-party integrations that assume React. I\'m proficient with the App Router, server actions, and the caching model. I choose SvelteKit for my own projects because of its smaller bundle sizes and simpler mental model, but I reach for Next.js when collaborating with React-native teams or when the project benefits from React\'s massive component ecosystem.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977617,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:nodejs-icon',
			id: 'node-js',
			name: 'Node.js',
			svg_override: null,
		},
		id: 'node-js',
		name: 'Node.js',
		relatedProjects: [],
		relatedServices: ['web-development', 'internal-tooling'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Lorem Retool Admin Panel uses Node.js as its API layer — handling CRUD operations against PostgreSQL with role-based access control and automated approval routing. Node.js is also the foundation for SvelteKit\'s server-side rendering on yesid.dev, where it handles the build pipeline, server routes, and static asset generation that Vercel deploys to the edge.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Node.js is a JavaScript runtime built on Chrome\'s V8 engine that lets you run JavaScript outside the browser — on servers, command-line tools, and backend services. It uses an event-driven, non-blocking I/O model, which makes it efficient for handling many simultaneous connections. npm, its package manager, hosts the largest ecosystem of open-source libraries in any language.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Node.js is the runtime behind my internal tooling and API layers. For projects where the frontend is already JavaScript/TypeScript, using Node on the backend means the entire stack shares one language, one type system, and one set of libraries. I pair it with Express or SvelteKit\'s server routes depending on the project. For new projects I often reach for Bun instead, but Node.js remains the standard for production deployments where ecosystem compatibility matters most.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977618,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:playwright',
			id: 'playwright',
			name: 'Playwright',
			svg_override: null,
		},
		id: 'playwright',
		name: 'Playwright',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright is planned for yesid.dev\'s E2E testing layer — verifying critical user flows like navigating the tech stack diagram, opening detail panels, using filters, and the Build Your Stack configurator across Chrome, Firefox, and Safari. It integrates with GitHub Actions to run browser tests on every push, and its screenshot comparison can catch visual regressions that unit tests would never detect.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright is a browser automation framework by Microsoft for end-to-end testing. It controls real browsers (Chromium, Firefox, WebKit) programmatically — navigating pages, clicking buttons, filling forms, and asserting on page content. Unlike unit tests that test components in isolation, E2E tests verify that the entire application works as a user would experience it: real HTTP requests, real rendering, real interactions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Playwright catches the bugs that unit tests miss — the ones that only appear when components interact in a real browser with real data. I\'m building my E2E testing practice around it because it\'s the most capable browser testing tool available: auto-waiting (no flaky <code>sleep()</code> calls), multi-browser support, network interception, and built-in trace viewer for debugging failures. For visual-heavy sites like yesid.dev, Playwright can verify animations, responsive layouts, and interaction flows.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977619,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'stores and queries your data reliably',
			es: 'almacena y consulta tus datos de forma fiable',
			fr: 'stocke et interroge vos données de manière fiable',
		},
		icon: {
			iconify_id: 'logos:postgresql',
			id: 'postgresql',
			name: 'PostgreSQL',
			svg_override: null,
		},
		id: 'postgresql',
		layer: 'data',
		name: 'PostgreSQL',
		relatedProjects: ['yesid-dev', 'transit-data-pipeline'],
		relatedServices: ['sql-development', 'database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, PostgreSQL serves as the central warehouse — ingesting GTFS-RT feeds, storing transformed schedule data, and powering the KPI queries that feed Power BI dashboards. On yesid.dev, it backs the content layer and will serve as the Keystatic CMS storage when that slice ships. For the Lorem Database Migration, I moved a 500GB MySQL database to PostgreSQL with zero downtime using dual-write and shadow reads.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL is an open-source relational database that stores structured data in tables with rows and columns. Think of it as a highly organized filing system where every piece of data has a defined type, relationships are enforced by the system itself, and you can ask complex questions across millions of records in milliseconds. It supports JSON, full-text search, window functions, and extensions — making it one of the most versatile databases available.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'PostgreSQL is my default database for anything that touches production. Its query planner is excellent, CTEs and window functions make complex analytics queries readable, and the extension ecosystem (PostGIS, pg_cron, pgvector) means I rarely need a second database. I\'ve migrated clients off MySQL and SQL Server onto PostgreSQL specifically because it handles the "we also need X" requests without bolting on another tool.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977620,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:microsoft-power-bi',
			id: 'power-bi',
			name: 'Power BI',
			svg_override: null,
		},
		id: 'power-bi',
		name: 'Power BI',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'The Lorem Analytics Dashboard is a Power BI suite that tracks operational metrics across 12 departments. I built the semantic layer in DAX on top of SQL Server, designed the star schema for query performance, and configured scheduled refreshes so executives see fresh data every morning. The result: reporting time dropped from 2 days to 15 minutes. On the Transit Data Pipeline, Power BI consumes the transformed PostgreSQL data to surface KPIs for transit operations managers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Power BI is Microsoft\'s business intelligence platform for turning raw data into interactive dashboards and reports. It connects to virtually any data source (SQL Server, PostgreSQL, Excel, APIs), lets you build a semantic data model with relationships and calculations, and publishes dashboards that business users can filter, drill into, and share. It\'s the most widely adopted BI tool in enterprise environments.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Power BI is where my data engineering work becomes visible to stakeholders. I don\'t treat it as a drag-and-drop chart builder — I design proper semantic layers with DAX measures, star schemas, and row-level security so the dashboards are fast, accurate, and trustworthy. The difference between a mediocre Power BI dashboard and a great one is the data model underneath it, and that\'s where my SQL and data engineering background makes the biggest impact.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977621,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'automates the data work: ingest, clean, transform',
			es: 'automatiza el trabajo de datos: ingesta, limpieza, transformación',
			fr: 'automatise le travail des données : ingestion, nettoyage, transformation',
		},
		icon: {
			iconify_id: 'logos:python',
			id: 'python',
			name: 'Python',
			svg_override: null,
		},
		id: 'python',
		layer: 'logic',
		name: 'Python',
		relatedProjects: ['transit-data-pipeline'],
		relatedServices: ['data-pipeline', 'analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Transit Operations Data Pipeline, Python handles the entire ELT flow: ingesting GTFS-RT feeds, transforming schedule data with pandas, loading into PostgreSQL, and orchestrating the whole pipeline with Airflow. For the Lorem Query Optimizer, Python connects to SQL Server instances and analyzes execution plans programmatically. It\'s also the glue language in my analytics projects — pulling data from APIs, cleaning it, and loading it into Power BI-ready tables.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Python is a general-purpose programming language known for its readable syntax and massive ecosystem. It\'s the dominant language in data engineering, machine learning, and scripting — if you need to move data, analyze it, or automate a workflow, Python probably has a library for it. Its "batteries included" standard library and pip package manager make it fast to prototype and deploy.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Python is my primary language for anything data. pandas for transformation, SQLAlchemy for database access, Airflow for orchestration, pytest for testing — the ecosystem is unmatched for data work. I write Python that\'s production-grade: typed with mypy, tested, and structured with clear module boundaries. I don\'t write "notebook Python" for production — I write maintainable code that ops teams can debug at 3 AM.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977622,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:react',
			id: 'react',
			name: 'React',
			svg_override: null,
		},
		id: 'react',
		name: 'React',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'React shows up in client projects and collaborative work where the team is React-native. My component design principles transfer directly between React and Svelte — typed props, data-driven rendering, composition over inheritance. The mental model difference (React\'s "re-render everything, diff the virtual DOM" vs. Svelte\'s "compile to surgical DOM updates") gives me a unique perspective on performance tradeoffs when advising clients on architecture choices.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'React is a JavaScript library for building user interfaces, created by Meta. It introduced the concept of components — reusable, self-contained pieces of UI that manage their own state. React uses a virtual DOM to efficiently update only the parts of the page that changed, and JSX syntax that lets you write HTML-like code inside JavaScript. It\'s the most widely adopted frontend library in the world, powering everything from Facebook to Airbnb to Notion.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'React is the industry standard, and knowing it well makes me effective in most web teams. I understand hooks, context, suspense, and the rendering lifecycle. I use React through Next.js rather than standalone because the framework handles the hard parts — routing, SSR, code splitting — that you\'d otherwise wire up manually. My primary framework is Svelte, but React proficiency means I can step into any React codebase and contribute immediately.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977623,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'lets your interface and services talk over clean endpoints',
			es: 'permite que tu interfaz y tus servicios se comuniquen mediante endpoints claros',
			fr: 'permet à votre interface et vos services de communiquer via des points d\'accès propres',
		},
		icon: {
			iconify_id: null,
			id: 'rest-api',
			name: 'REST API',
			svg_override: null,
		},
		id: 'rest-api',
		layer: 'logic',
		name: 'REST API',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development', 'internal-tooling'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, REST endpoints power the contact form (Web3Forms integration) and will handle the Keystatic CMS API. The Lorem Retool Admin Panel exposes a REST API layer that Retool consumes — CRUD operations with role-based access control, input validation, and consistent error responses. Every API I build follows the same envelope pattern: <code>{ success, data, error, meta }</code> so clients always know what to expect.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'REST (Representational State Transfer) is an architectural style for building web APIs. Instead of inventing custom protocols, REST uses standard HTTP methods — GET to read, POST to create, PUT to update, DELETE to remove. Resources are identified by URLs, and data flows as JSON. It\'s the most common way for frontend applications, mobile apps, and services to communicate with backend systems.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'REST is my default for API design because it\'s universally understood. Every frontend framework, every mobile platform, and every integration tool speaks HTTP. I design RESTful APIs with consistent patterns: predictable URL structures, proper status codes, pagination metadata, and error envelopes. I prefer REST over GraphQL for most projects because the tooling is simpler, caching works naturally with HTTP, and the debugging experience with standard browser DevTools is better.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977624,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'mdi:language-rust',
			id: 'rust',
			name: 'Rust',
			svg_override: null,
		},
		id: 'rust',
		name: 'Rust',
		relatedProjects: [],
		relatedServices: [],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Rust is part of my long-term systems programming development. The immediate practical angle is WebAssembly — Rust compiles to WASM with excellent tooling (wasm-pack, wasm-bindgen), enabling performance-critical code to run in the browser. For a digital infrastructure consultant, that means potentially building fast client-side data processing tools, interactive visualizations, or compression utilities that run at native speed without a server round-trip.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977625,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Rust is a systems programming language focused on safety, speed, and concurrency. Its ownership system eliminates entire categories of bugs — null pointer dereferences, data races, use-after-free — at compile time, without needing a garbage collector. Rust achieves C/C++ performance levels while preventing the memory safety issues that cause the majority of security vulnerabilities in systems software. It\'s used in production at Mozilla, Cloudflare, Discord, and AWS.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977625,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Rust represents the direction I\'m growing in systems programming. Its ownership model enforces at compile time what other languages leave to programmer discipline, and its zero-cost abstractions mean you don\'t pay a performance penalty for safety. I\'m building familiarity with Rust for use cases where Python is too slow and C++ is too dangerous: high-throughput data processing, CLI tools, and WebAssembly modules that run at near-native speed in the browser.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977625,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'devicon:microsoftsqlserver',
			id: 'sql-server',
			name: 'SQL Server',
			svg_override: null,
		},
		id: 'sql-server',
		name: 'SQL Server',
		relatedProjects: [],
		relatedServices: ['sql-development', 'database-engineering'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'For the Lorem Analytics Dashboard, SQL Server is the primary data source — I built semantic layers in DAX on top of its tables to power executive KPI dashboards. On the Lorem Query Optimizer project, I wrote a Python tool that connects to SQL Server instances, captures execution plans for the heaviest queries, and generates optimization recommendations that reduced average query time by 73% across 200+ stored procedures.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SQL Server is Microsoft\'s enterprise relational database, widely used in corporate environments for transactional systems, reporting, and business intelligence. It comes with a rich ecosystem: SSMS for management, SSIS for data integration, SSRS for reporting, and tight integration with Power BI and the .NET stack. If your company runs Windows servers and Microsoft tools, SQL Server is likely already in the picture.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977626,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Most of my enterprise clients already run SQL Server — it\'s the backbone of their ERP, CRM, and financial systems. I know its query optimizer inside out, including its quirks: parameter sniffing, implicit conversions, and the execution plan cache. When I\'m tuning performance, I read the actual execution plans, not just the estimated ones. SQL Server\'s temporal tables and columnstore indexes are underused features that I regularly leverage for audit trails and analytics workloads.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'ssis',
			name: 'SSIS',
			svg_override: null,
		},
		id: 'ssis',
		name: 'SSIS',
		relatedProjects: [],
		relatedServices: ['data-pipeline'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In enterprise environments, SSIS often runs the data pipelines that feed the dashboards and reports I build. When I\'m designing a new analytics solution on SQL Server, I evaluate whether SSIS, Python, or Airflow is the right orchestration tool based on the team\'s skills and the pipeline\'s complexity. For simple SQL-to-SQL workflows, SSIS is effective. For anything involving APIs, complex logic, or cross-platform sources, I recommend Python with Airflow.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSIS (SQL Server Integration Services) is Microsoft\'s ETL platform for moving and transforming data between systems. It uses a visual workflow designer where you build packages — sequences of data flow tasks that extract from sources (databases, files, APIs), apply transformations (lookups, data type conversions, aggregations), and load into destinations. SSIS packages can be scheduled, parameterized, and monitored through SQL Server Agent.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977627,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSIS is the ETL tool I encounter most in Microsoft-stack enterprises. Many clients have years of SSIS packages running nightly — some well-designed, many not. I\'m proficient at building new packages, but my more common role is auditing and optimizing existing ones: identifying bottlenecks in data flows, replacing slow row-by-row transformations with set-based operations, and converting legacy packages to Python or Airflow when SSIS becomes a limitation.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: null,
			id: 'ssrs',
			name: 'SSRS',
			svg_override: null,
		},
		id: 'ssrs',
		name: 'SSRS',
		relatedProjects: [],
		relatedServices: ['analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'In SQL Server environments, SSRS typically handles the compliance and operational reporting that sits alongside Power BI\'s executive dashboards. I\'ve built SSRS reports that auto-generate monthly department summaries, format them as branded PDFs, and distribute them via email subscriptions — freeing analysts from the manual report compilation that used to consume days each month.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSRS (SQL Server Reporting Services) is Microsoft\'s server-based report generation platform. It produces paginated reports — the kind you print, email as PDFs, or embed in applications — with precise layout control, parameters, subreports, and drill-through links. Think of it as the "print-ready" counterpart to Power BI\'s interactive dashboards. Reports are defined in RDL (Report Definition Language) and hosted on a report server.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977628,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SSRS fills a specific niche that Power BI doesn\'t: pixel-perfect, paginated documents. Invoices, regulatory filings, audit reports, and anything that needs to be printed or archived as a PDF — that\'s SSRS territory. I build SSRS reports when the output needs exact formatting control, and I know when to recommend Power BI instead (interactive exploration) vs. SSRS (formal document generation). Many organizations need both, and I design solutions that use each tool for its strength.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:svelte',
			id: 'svelte',
			name: 'Svelte',
			svg_override: null,
		},
		id: 'svelte-5',
		name: 'Svelte 5',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Every component on yesid.dev is a Svelte 5 component using runes. The tech stack diagram uses <code>$state</code> for the selected node, <code>$derived</code> for filtered connections, and <code>$effect</code> for GSAP animation lifecycle. The CollapsibleSection component uses <code>$state</code> for open/closed state with CSS transitions. Svelte 5\'s compile-time approach means the site ships minimal JavaScript despite having complex animations, interactive diagrams, and responsive layouts.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Svelte is a UI framework that takes a fundamentally different approach from React or Vue. Instead of shipping a runtime library to the browser that interprets your components, Svelte compiles your components into efficient vanilla JavaScript at build time. Svelte 5 introduced runes — a new reactivity system using <code>$state</code>, <code>$derived</code>, and <code>$effect</code> — that makes reactive data explicit and fine-grained. The result is smaller bundles, faster updates, and code that reads almost like plain HTML with superpowers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977629,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Svelte 5\'s runes system is the cleanest reactivity model I\'ve worked with. <code>$state</code> for reactive variables, <code>$derived</code> for computed values, <code>$effect</code> for side effects — there\'s no hook rules to memorize, no dependency arrays to get wrong, no <code>useCallback</code> wrapping. Coming from a data background where I think in terms of data flow and transformations, Svelte\'s model maps naturally to how I reason about UI: data in, DOM out, no hidden re-renders.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'renders fast, app-like pages from one codebase',
			es: 'genera páginas rápidas tipo aplicación desde una sola base de código',
			fr: 'affiche des pages rapides, façon application, depuis une seule base de code',
		},
		icon: {
			iconify_id: 'logos:svelte-kit',
			id: 'sveltekit',
			name: 'SvelteKit',
			svg_override: null,
		},
		id: 'sveltekit',
		layer: 'interface',
		name: 'SvelteKit',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev is built entirely on SvelteKit 2. Every route — the portfolio, services, blog, tech stack, and contact page — is a SvelteKit page with typed load functions that pull from the data layer. The site uses SvelteKit\'s adapter-vercel for deployment, its server routes for API endpoints, and its prerendering for static pages. The Control Room diagram you\'re looking at right now is a SvelteKit page that loads 34 tech items from markdown files at build time.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'SvelteKit is a full-stack web framework built on Svelte. It handles routing, server-side rendering, data loading, and deployment — everything you need to build a complete web application. Unlike frameworks that ship a heavy JavaScript runtime to the browser, SvelteKit compiles your components into minimal, optimized JavaScript at build time. The result is fast pages with less code shipped to the user.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977630,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'SvelteKit is my primary web framework and the foundation of every new web project I build. The developer experience is the best I\'ve used: file-based routing that maps directly to URLs, load functions that keep data fetching explicit and testable, and a build step that eliminates the framework overhead. Coming from data engineering where I value predictability and observability, SvelteKit\'s "no hidden magic" philosophy resonates — I can trace exactly what runs on the server, what runs on the client, and where the data flows.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'devicon:microsoftsqlserver',
			id: 't-sql',
			name: 'T-SQL',
			svg_override: null,
		},
		id: 't-sql',
		name: 'T-SQL',
		relatedProjects: [],
		relatedServices: ['sql-development', 'analytics-reporting'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On the Lorem Analytics Dashboard, T-SQL stored procedures handle the ETL logic that feeds Power BI — aggregating transaction data, calculating derived metrics, and maintaining materialized summary tables. The Lorem Query Optimizer project uses T-SQL\'s DMVs (Dynamic Management Views) to identify slow queries, missing indexes, and execution plan anomalies programmatically. T-SQL is also the foundation of every SQL Server performance audit I conduct.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'T-SQL (Transact-SQL) is Microsoft\'s extension of standard SQL, used exclusively with SQL Server. It adds procedural programming features — variables, control flow (IF/WHILE), error handling (TRY/CATCH), and stored procedures — on top of standard SQL queries. If SQL is the language for asking questions of your data, T-SQL is the language for building complete data processing programs inside the database itself.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977631,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'T-SQL is my most battle-tested skill. I\'ve written everything from simple SELECT queries to 1000-line stored procedures that process millions of rows nightly. I know the optimizer well enough to predict when it will choose a scan over a seek, when parameter sniffing will cause plan regression, and when a CTE is better than a temp table. Performance tuning T-SQL is where I\'ve delivered the most measurable value to clients — turning 30-minute reports into 30-second queries.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:tailwindcss',
			id: 'tailwind',
			name: 'Tailwind CSS',
			svg_override: null,
		},
		id: 'tailwind',
		name: 'Tailwind CSS',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Tailwind CSS v4 handles all compositional styling. The <code>@theme</code> block in <code>app.css</code> defines brand values (orange <code>#E07800</code>, yellow <code>#FFB627</code>, Inter and JetBrains Mono fonts), while <code>tokens.css</code> provides semantic tokens like <code>--bg-primary</code> and <code>--text-muted</code> that components reference. Every component uses Tailwind utilities for layout and spacing, with scoped <code>&lt;style&gt;</code> blocks reserved for complex grid layouts or animations that would need more than three utilities on one element.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS classes like <code>.card-header</code>, you compose small utility classes directly in your HTML: <code>flex items-center gap-4 text-sm font-medium</code>. Tailwind scans your files at build time and generates only the CSS you actually use, resulting in tiny production stylesheets. Version 4 introduced a CSS-native engine with <code>@theme</code> for design tokens.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977632,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Tailwind eliminates the naming problem that plagues CSS at scale. I don\'t need to invent class names, maintain a separate stylesheet, or worry about specificity conflicts. For a component-based architecture like Svelte, co-locating styles with markup makes components truly self-contained. I pair Tailwind with semantic CSS custom properties for theming — Tailwind handles composition (spacing, flex, typography), while <code>tokens.css</code> handles meaning (what "primary background" means in light vs. dark mode).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:threejs',
			id: 'threejs',
			name: 'Three.js',
			svg_override: null,
		},
		id: 'threejs-threlte',
		name: 'Three.js / Threlte',
		relatedProjects: [],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'On yesid.dev, Three.js / Threlte powered an experimental 3D hero scene during the early build — meshes, lights, and post-processing (bloom, vignette) composed as Svelte components, with mouse- and scroll-linked interactivity on top. The scene was killed after a performance and accessibility review: WebGL init cost on low-end devices, a11y gaps on the 3D canvas, and a <code>prefers-reduced-motion</code> fallback that effectively duplicated a simpler SVG path. The brief didn\'t need it, and the SVG + GSAP stack delivered the same feel at a fraction of the cost. Killed, not parked. See <code>brand/decisions/what-i-killed.md</code> for the full rationale (ships in Slice 17h).',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
					{
						data: {
							alignment: 'left',
							caption: '',
							text: 'Scene components previously lived at <code>src/lib/motion/three/</code>; removed in the Slice 17 motion re-engineering.',
						},
						id: 'm00000002',
						type: 'quote',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Three.js is a JavaScript library that makes WebGL accessible — it provides a scene graph, camera system, lighting, materials, and geometry primitives so you can create 3D graphics in the browser without writing raw shader code. Threlte is Svelte\'s wrapper around Three.js, letting you build 3D scenes with Svelte components instead of imperative JavaScript. A <code>&lt;T.Mesh&gt;</code> component in Threlte compiles to a Three.js mesh with reactive props and automatic cleanup.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977633,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: '3D on the web is a differentiator — most portfolio sites are flat. Three.js gave me the ability to create immersive scenes that make a site memorable without requiring WebGL expertise from future maintainers. Threlte specifically fit a Svelte stack: 3D objects are components with props, they participate in Svelte\'s reactivity system, and they clean up automatically when unmounted. I paired Threlte with GSAP for animation timing and scroll-linked 3D transitions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'keeps the codebase typed, refactorable, and honest',
			es: 'mantiene el código tipado, refactorizable y confiable',
			fr: 'garde le code typé, refactorisable et fiable',
		},
		icon: {
			iconify_id: 'logos:typescript',
			id: 'typescript',
			name: 'TypeScript',
			svg_override: null,
		},
		id: 'typescript',
		layer: 'logic',
		name: 'TypeScript',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'Every file on yesid.dev is TypeScript. The data layer (projects, services, tech stack) is fully typed with interfaces like <code>TechStackItem</code>, <code>Project</code>, and <code>LocalizedString</code>. Components receive typed props, and the test suite validates data integrity at build time. When I added 34 tech stack items to the Control Room diagram, TypeScript caught every typo in connection references and domain names before I even opened a browser.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'TypeScript is JavaScript with a type system. It adds static types to the language — meaning you declare what shape your data has, and the compiler catches mistakes before your code ever runs in a browser. Every valid JavaScript file is also valid TypeScript, so adoption is gradual. TypeScript compiles down to plain JavaScript, so browsers and Node.js run it without any runtime overhead.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977634,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'I don\'t write JavaScript anymore — only TypeScript. The type system catches entire categories of bugs at compile time that would otherwise surface as runtime errors in production. For data-driven sites like this one, where components render from typed data interfaces, TypeScript ensures that adding a project or service never breaks the UI silently. The developer experience with VS Code\'s IntelliSense is also dramatically better — autocomplete, refactoring, and go-to-definition all work because the types are there.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
	},
	{
		enables: {
			en: 'ships the site globally with zero-config deploys',
			es: 'publica el sitio globalmente con despliegues sin configuración',
			fr: 'déploie le site mondialement sans configuration',
		},
		icon: {
			iconify_id: 'logos:vercel',
			id: 'vercel',
			name: 'Vercel',
			svg_override: null,
		},
		id: 'vercel',
		layer: 'infra',
		name: 'Vercel',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev deploys to Vercel on every push to main. Each feature branch gets a preview deployment with a unique URL — useful for client reviews and visual QA. Vercel\'s build pipeline runs <code>bun run build</code>, handles the SvelteKit adapter configuration, and serves the static and server-rendered pages from edge locations. The integration with GitHub Actions means tests run in CI before Vercel promotes a deployment to production.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vercel is a cloud platform for deploying web applications. Push your code to Git, and Vercel builds and deploys it automatically — with preview URLs for every pull request and production deployments on merge. It provides a global edge network (CDN), serverless functions, and framework-specific optimizations for Next.js, SvelteKit, Nuxt, and others. Vercel handles SSL, caching, and scaling without manual infrastructure management.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977635,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vercel is my deployment platform because it removes every piece of infrastructure friction. I push to GitHub, and the site is live in under a minute — with preview URLs for every branch so I can share work-in-progress with clients. The SvelteKit adapter works out of the box, automatic HTTPS is configured, and the CDN ensures fast load times globally. For a freelance developer, Vercel\'s zero-config deployment means I spend time building features instead of managing servers.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
	},
	{
		icon: {
			iconify_id: 'logos:vitest',
			id: 'vitest',
			name: 'Vitest',
			svg_override: null,
		},
		id: 'vitest',
		name: 'Vitest',
		relatedProjects: ['yesid-dev'],
		relatedServices: ['web-development'],
		what_i_use_it_for: {
			en: {
				blocks: [
					{
						data: {
							text: 'yesid.dev uses Vitest with a dual-project configuration: one project for component tests (using happy-dom for DOM simulation) and another for data-layer unit tests (pure TypeScript, no DOM needed). The test suite validates data integrity (all 34 tech items have valid connections, no dangling references), component behavior (filters, collapsible sections, stack panels), and type safety. Tests run on every commit via <code>bun run test</code> and in CI via GitHub Actions.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
		},
		what_it_is: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vitest is a fast unit testing framework built on Vite\'s transformation pipeline. It runs TypeScript and JSX natively (no separate compile step), supports ESM imports, and provides a Jest-compatible API — so if you know Jest, you already know Vitest. It includes snapshot testing, code coverage, watch mode, and a browser UI for exploring test results. For Vite-based projects (SvelteKit, React with Vite), Vitest shares the same config and plugin ecosystem.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977636,
				version: '2.31.2',
			},
		},
		why_i_use_it_instead: {
			en: {
				blocks: [
					{
						data: {
							text: 'Vitest is fast, and speed matters when you\'re running tests after every code change. It uses Vite\'s on-demand module transformation, so only the files that changed get re-processed. Combined with Bun as the runtime, test suites that took minutes with Jest now run in seconds. I pair it with <code>@testing-library/svelte</code> for component tests and use the multi-project configuration to run different test types (unit vs. component) with optimized settings for each.',
						},
						id: 'm00000001',
						type: 'paragraph',
					},
				],
				time: 1777263977637,
				version: '2.31.2',
			},
		},
	},
];
