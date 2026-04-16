# Contact Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the contact page to full-bleed edge-to-edge with Recipe 4 Edge Title Grid, resizable Paneforge split between terminals, live weather, and data layer cleanup.

**Architecture:** Recipe 4 grid (rotated edge title + accent line + content) wraps a Paneforge `ResizablePaneGroup` with two `TerminalChrome` panes. Weather is fetched server-side via shared utility extracted from About page. Mobile stacks vertically with no resize.

**Tech Stack:** SvelteKit, Paneforge (ui/resizable), TerminalChrome (brand/), OpenWeatherMap API, CSS Grid Recipe 4.

**Spec:** `docs/specs/2026-04-16-contact-page-redesign-design.md`

**Estimated sessions:** 1 session (7 tasks)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/data/weather.ts` | Shared weather fetch utility (extracted from About) |
| Create | `src/routes/contact/+page.server.ts` | Server-side weather load for contact route |
| Modify | `src/routes/about/+page.server.ts` | Refactor to use shared weather utility |
| Modify | `src/lib/data/types.ts` | Remove `status`, `availability`, `sectionLabels.status` from `ContactInfoTerminal` |
| Modify | `src/lib/data/contact-page.ts` | Remove `status`, `availability`, `sectionLabels.status` values |
| Modify | `src/routes/contact/+page.svelte` | Pass `weather` prop from server data |
| Rewrite | `src/lib/components/contact/ContactPage.svelte` | Recipe 4 grid + Paneforge resizable + weather display |
| Modify | `src/lib/components/contact/ContactPage.test.ts` | Update for new layout, add weather fallback test |

---

### Task 1: Extract shared weather utility

**Files:**
- Create: `src/lib/data/weather.ts`
- Modify: `src/routes/about/+page.server.ts`
- Test: run existing About page tests

- [ ] **Step 1: Create `src/lib/data/weather.ts`**

```typescript
// Shared weather fetch for Montreal.
// Server-side only — uses $env/dynamic/private.
// 30-minute in-memory cache to avoid hitting API on every page load.

import { env } from '$env/dynamic/private';

export interface WeatherData {
	temp: number;
	condition: string;
	icon: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
let cachedWeather: WeatherData | null = null;
let cachedAt = 0;

/**
 * Fetch current Montreal weather from OpenWeatherMap.
 * Returns null if API key is missing or fetch fails.
 */
export async function fetchMontrealWeather(): Promise<WeatherData | null> {
	if (!env.OPENWEATHER_API_KEY) {
		return null;
	}

	const now = Date.now();
	if (cachedWeather && now - cachedAt < CACHE_TTL_MS) {
		return cachedWeather;
	}

	try {
		const res = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=Montreal,CA&units=metric&appid=${env.OPENWEATHER_API_KEY}`
		);

		if (res.ok) {
			const data = await res.json();
			cachedWeather = {
				temp: Math.round(data.main.temp),
				condition: data.weather[0]?.description ?? '',
				icon: data.weather[0]?.icon ?? '01d',
			};
			cachedAt = now;
			return cachedWeather;
		}
	} catch {
		// Silently fall back — caller shows UI without weather
	}

	return null;
}
```

- [ ] **Step 2: Refactor `src/routes/about/+page.server.ts` to use shared utility**

Replace the entire file with:

```typescript
import { aboutPageContent } from '$lib/data/about-page.js';
import { fetchMontrealWeather } from '$lib/data/weather.js';

export async function load() {
	if (!aboutPageContent.weather.enabled) {
		return { weather: null };
	}

	const weather = await fetchMontrealWeather();
	return { weather };
}
```

- [ ] **Step 3: Run `bun run check` to verify no type errors**

Expected: 0 errors. The `WeatherData` type matches the existing `{ temp: number; condition: string; icon: string }` shape used by `AboutWeather.svelte`.

- [ ] **Step 4: Run `bun run test` to verify About tests still pass**

Expected: all existing tests pass (About weather is server-side, tests mock or skip it).

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/weather.ts src/routes/about/+page.server.ts
git commit -m "refactor(slice-17d): extract shared weather utility from About page"
```

---

### Task 2: Data layer cleanup — remove status/availability

**Files:**
- Modify: `src/lib/data/types.ts` (lines ~403-414)
- Modify: `src/lib/data/contact-page.ts`

- [ ] **Step 1: Update `ContactInfoTerminal` in `src/lib/data/types.ts`**

Remove `status`, `availability`, and `sectionLabels.status`:

```typescript
export interface ContactInfoTerminal {
	title: string;
	command: string;
	location: LocalizedString;
	responseTime: LocalizedString;
	sectionLabels: {
		location: LocalizedString;
		connect: LocalizedString;
	};
}
```

- [ ] **Step 2: Update `src/lib/data/contact-page.ts`**

Remove `status`, `availability`, and `sectionLabels.status` from the data object:

```typescript
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
```

- [ ] **Step 3: Run `bun run check`**

Expected: 0 errors. The ContactPage.svelte doesn't reference `status` or `availability` — they were unused fields.

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/types.ts src/lib/data/contact-page.ts
git commit -m "chore(slice-17d): remove unused status/availability from contact data layer"
```

---

### Task 3: Add contact route server load for weather

**Files:**
- Create: `src/routes/contact/+page.server.ts`
- Modify: `src/routes/contact/+page.svelte`

- [ ] **Step 1: Create `src/routes/contact/+page.server.ts`**

```typescript
import { fetchMontrealWeather } from '$lib/data/weather.js';

export async function load() {
	const weather = await fetchMontrealWeather();
	return { weather };
}
```

- [ ] **Step 2: Update `src/routes/contact/+page.svelte` to pass weather**

```svelte
<!-- /contact route: full-bleed contact page with resizable terminals -->
<script lang="ts">
	import ContactPage from '$lib/components/contact/ContactPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Contact — yesid.</title>
	<meta name="description" content="Get in touch for freelance data engineering, database development, and digital infrastructure consulting." />
</svelte:head>

<ContactPage weather={data.weather} />
```

- [ ] **Step 3: Run `bun run check`**

Expected: type error on `ContactPage` — it doesn't accept a `weather` prop yet. This is expected and will be fixed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add src/routes/contact/+page.server.ts src/routes/contact/+page.svelte
git commit -m "feat(slice-17d): add server-side weather fetch for contact route"
```

---

### Task 4: Rewrite ContactPage — Recipe 4 grid + Paneforge

This is the main task. Rewrite `ContactPage.svelte` from contained layout to full-bleed Recipe 4 Edge Title Grid with Paneforge resizable split.

**Files:**
- Rewrite: `src/lib/components/contact/ContactPage.svelte`

- [ ] **Step 1: Rewrite `ContactPage.svelte`**

The component keeps all existing form logic (`validate`, `handleSubmit`, `handleReset`, `playSuccessSequence`, `fieldBorderClass`) and both terminal bodies. The layout wrapper changes completely.

```svelte
<!--
  Contact page — full-bleed Recipe 4 Edge Title Grid.
  Rotated "Contact." edge title + accent line + resizable dual terminals.
  Info terminal (left): location, weather, response time, social links.
  Form terminal (right): name, email, message + typed success sequence.
-->
<script lang="ts">
	import { contactContent } from '$lib/data/contact-page.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { TerminalChrome, SectionHeading } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
	import type { WeatherData } from '$lib/data/weather.js';

	let {
		weather = null,
	}: {
		weather?: WeatherData | null;
	} = $props();

	const c = contactContent;

	// --- Form state ---
	let name = $state('');
	let email = $state('');
	let message = $state('');
	let submitted = $state(false);
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);
	let successLines = $state<{ text: string; color: string; visible: boolean }[]>([]);

	// --- Validation ---
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = resolveLocale(c.validation.required, 'en').replace('{field}', 'name');
		}
		if (!email.trim()) {
			newErrors.email = resolveLocale(c.validation.required, 'en').replace('{field}', 'email');
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = resolveLocale(c.validation.invalidEmail, 'en');
		}
		if (!message.trim()) {
			newErrors.message = resolveLocale(c.validation.required, 'en').replace('{field}', 'message');
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function errorCount(): number {
		return Object.keys(errors).length;
	}

	// --- Submit (client-side — Web3Forms free tier requires client calls) ---
	let sending = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitted = true;
		if (!validate()) return;

		sending = true;
		try {
			const res = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_key: c.web3formsKey,
					subject: `New contact from ${name} via yesid.dev`,
					from_name: name,
					email,
					message,
				}),
			});
			const result = await res.json();

			if (!result.success) {
				errors = { form: 'Failed to send message. Please try again.' };
				sending = false;
				return;
			}
		} catch {
			errors = { form: 'Failed to send message. Please try again.' };
			sending = false;
			return;
		}

		sending = false;
		await playSuccessSequence();
	}

	// --- Success animation sequence ---
	async function playSuccessSequence() {
		const okText = resolveLocale(c.success.fieldOk, 'en');
		const lines = [
			{ text: '~ $ send --message', color: 'muted' },
			{ text: `→ ${resolveLocale(c.success.validating, 'en')}`, color: 'orange' },
			{ text: `✓ ${c.formTerminal.fields.name.label}: ${okText}`, color: 'green' },
			{ text: `✓ ${c.formTerminal.fields.email.label}: ${okText}`, color: 'green' },
			{ text: `✓ ${c.formTerminal.fields.message.label}: ${okText}`, color: 'green' },
			{ text: `→ ${resolveLocale(c.success.sending, 'en')}`, color: 'orange' },
			{ text: `✓ ${resolveLocale(c.success.sent, 'en')}`, color: 'green' },
			{ text: `→ ${resolveLocale(c.success.responseTime, 'en')}`, color: 'accent' },
			{ text: `→ ${resolveLocale(c.success.meanwhile, 'en')}`, color: 'muted' }
		];

		successLines = lines.map((l) => ({ ...l, visible: false }));
		showSuccess = true;

		for (let i = 0; i < successLines.length; i++) {
			await new Promise((r) => setTimeout(r, 150));
			successLines[i] = { ...successLines[i], visible: true };
		}
	}

	// --- Reset ---
	function handleReset() {
		name = '';
		email = '';
		message = '';
		submitted = false;
		errors = {};
		showSuccess = false;
		successLines = [];
	}

	// --- Helpers ---
	function fieldBorderClass(field: string): string {
		if (!submitted) return 'border-[var(--border)]';
		if (errors[field]) return 'border-[var(--destructive)]';
		return 'border-[#28c840]';
	}

	const stationLabel = resolveLocale(c.stationLabel, 'en');
</script>

<div class="contact-grid" data-testid="page-contact">
	<!-- ═══ EDGE TITLE (desktop only) ═══ -->
	<div class="edge-title-column">
		<div class="edge-title">Contact<span class="edge-dot">.</span></div>
	</div>

	<!-- ═══ ACCENT LINE ═══ -->
	<div class="accent-rail"></div>

	<!-- ═══ CONTENT ═══ -->
	<div class="contact-content">
		<!-- Page heading -->
		<div class="mb-8">
			<SectionHeading heading="Contact" subheading={stationLabel} level={1} />
		</div>

		<!-- Desktop: Resizable split -->
		<div class="desktop-terminals" use:reveal>
			<ResizablePaneGroup direction="horizontal" class="min-h-[28rem] rounded-lg">
				<ResizablePane defaultSize={33} minSize={20}>
					{@render infoTerminal()}
				</ResizablePane>
				<ResizableHandle withHandle class="contact-resize-handle" />
				<ResizablePane defaultSize={67} minSize={40}>
					{@render formTerminal()}
				</ResizablePane>
			</ResizablePaneGroup>
		</div>

		<!-- Mobile: Stacked -->
		<div class="mobile-terminals" use:reveal>
			{@render infoTerminal()}
			{@render formTerminal()}
		</div>
	</div>
</div>

<!-- ═══ INFO TERMINAL SNIPPET ═══ -->
{#snippet infoTerminal()}
	<TerminalChrome title={c.infoTerminal.title} class="h-full" data-testid="contact-info-terminal">
		<div class="font-mono text-sm leading-relaxed">
			<!-- Command line -->
			<div class="mb-4 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {c.infoTerminal.command}
			</div>

			<!-- LOCATION section -->
			<div class="mb-4">
				<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(c.infoTerminal.sectionLabels.location, 'en')}</div>
				<div class="text-[var(--secondary-foreground)]">{resolveLocale(c.infoTerminal.location, 'en')}</div>
				{#if weather}
					<div class="mt-0.5 font-mono text-small text-[var(--accent)]">
						{weather.temp}°C — <span class="capitalize">{weather.condition}</span>
					</div>
				{/if}
				<div class="mt-1 text-caption text-[var(--muted-foreground)]">{resolveLocale(c.infoTerminal.responseTime, 'en')}</div>
			</div>

			<!-- CONNECT section -->
			<div class="mb-4">
				<div class="mb-2 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(c.infoTerminal.sectionLabels.connect, 'en')}</div>
				<div class="flex flex-col gap-1">
					{#each c.socials as social}
						<a
							href={social.href}
							data-testid="contact-social-{social.icon}"
							class="flex items-center gap-2 rounded px-2 py-1.5 text-[var(--foreground)] transition-colors duration-200 hover:bg-primary/15"
							{...(social.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
						>
							<span class="text-[var(--primary)]">→</span>
							<span class="text-small">{social.href.replace(/^mailto:|^https?:\/\//, '')}</span>
						</a>
					{/each}
				</div>
			</div>

			<!-- Blinking cursor -->
			<div class="flex items-center gap-1">
				<span class="text-[var(--secondary-foreground)]">~</span>
				<TerminalCursor />
			</div>
		</div>
	</TerminalChrome>
{/snippet}

<!-- ═══ FORM TERMINAL SNIPPET ═══ -->
{#snippet formTerminal()}
	<TerminalChrome title={c.formTerminal.title} class="h-full" data-testid="contact-form-terminal">
		<div class="font-mono text-sm leading-relaxed">
			<!-- Command + output -->
			<div class="mb-1 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {c.formTerminal.command}
			</div>
			<div class="mb-4 text-caption text-[var(--muted-foreground)]">
				{resolveLocale(c.formTerminal.commandOutput, 'en')}
			</div>

			{#if !showSuccess}
				<!-- ─── FORM ─── -->
				<form
					onsubmit={handleSubmit}
					class="mt-3 space-y-3"
				>
					<div class="flex flex-col gap-4">

						<!-- Name field -->
						<div class="flex flex-col gap-1">
							<label for="contact-name" class="text-caption text-[var(--primary)]">
								{c.formTerminal.fields.name.label}:
							</label>
							<input
								id="contact-name"
								name="name"
								type="text"
								bind:value={name}
								placeholder={resolveLocale(c.formTerminal.fields.name.placeholder, 'en')}
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('name')}"
							/>
							{#if submitted && errors.name}
								<div class="text-caption text-[var(--destructive)]">✗ {errors.name}</div>
							{/if}
						</div>

						<!-- Email field -->
						<div class="flex flex-col gap-1">
							<label for="contact-email" class="text-caption text-[var(--primary)]">
								{c.formTerminal.fields.email.label}:
							</label>
							<input
								id="contact-email"
								name="email"
								type="email"
								bind:value={email}
								placeholder={resolveLocale(c.formTerminal.fields.email.placeholder, 'en')}
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('email')}"
							/>
							{#if submitted && errors.email}
								<div class="text-caption text-[var(--destructive)]">✗ {errors.email}</div>
							{/if}
						</div>

						<!-- Message field -->
						<div class="flex flex-col gap-1">
							<label for="contact-message" class="text-caption text-[var(--primary)]">
								{c.formTerminal.fields.message.label}:
							</label>
							<textarea
								id="contact-message"
								name="message"
								bind:value={message}
								placeholder={resolveLocale(c.formTerminal.fields.message.placeholder, 'en')}
								rows="6"
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 resize-none {fieldBorderClass('message')}"
							></textarea>
							{#if submitted && errors.message}
								<div class="text-caption text-[var(--destructive)]">✗ {errors.message}</div>
							{/if}
						</div>

						<!-- Server-level error -->
						{#if submitted && errors.form}
							<div class="mt-0.5 text-caption text-[var(--destructive)]">✗ {errors.form}</div>
						{/if}

						<!-- Error summary -->
						{#if submitted && errorCount() > 0}
							<div class="rounded border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-caption text-[var(--destructive)]">
								✗ {resolveLocale(c.validation.errorSummary, 'en').replace('{count}', String(errorCount()))}
							</div>
						{/if}

						<!-- Submit button -->
						<Button variant="default" size="cta-sm" type="submit">
							<span class="opacity-60">~ $</span>
							{resolveLocale(c.formTerminal.submitLabel, 'en')}
						</Button>

					</div>
				</form>

			{:else}
				<!-- ─── SUCCESS ─── -->
				<div data-testid="contact-success" class="flex flex-col gap-0.5">
					{#each successLines as line}
						{#if line.visible}
							<div class="{line.color === 'orange'
								? 'text-[var(--primary)]'
								: line.color === 'green'
									? 'text-[#28c840]'
									: line.color === 'accent'
										? 'text-[var(--accent)]'
										: 'text-[var(--secondary-foreground)]'} text-small">
								{#if line.color === 'muted' && line.text.includes('{work}') && line.text.includes('{blog}')}
									{@html line.text
										.replace('{work}', '<a href="/services" class="text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent)] transition-colors">work</a>')
										.replace('{blog}', '<a href="/blog" class="text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent)] transition-colors">blog</a>')}
								{:else}
									{line.text}
								{/if}
							</div>
						{/if}
					{/each}

					<!-- Reset button -->
					<button
						onclick={handleReset}
						class="mt-4 self-start rounded border border-[var(--border)] px-4 py-2 font-mono text-caption text-[var(--secondary-foreground)] transition-all duration-200 hover:border-[var(--primary)] hover:text-[var(--foreground)]"
					>
						{resolveLocale(c.success.resetLabel, 'en')}
					</button>
				</div>
			{/if}

		</div>
	</TerminalChrome>
{/snippet}

<style>
	/* ═══ Recipe 4: Edge Title Grid ═══ */
	.contact-grid {
		display: block;
		width: 100%;
		padding-block: var(--space-section-y);
	}
	.edge-title-column { display: none; }
	.accent-rail { display: none; }
	.contact-content {
		min-width: 0;
		padding-inline: var(--space-page-x);
	}

	/* Desktop: stacked terminals hidden */
	.desktop-terminals { display: none; }
	.mobile-terminals {
		display: flex;
		flex-direction: column;
		gap: var(--space-card-gap);
	}

	@media (min-width: 1024px) {
		.contact-grid {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			margin-top: -5rem;
			padding-block: 0;
		}
		.contact-content {
			padding-top: 5rem;
			padding-bottom: var(--space-section-y);
			padding-inline: var(--space-page-x);
		}
		.edge-title-column {
			display: flex;
			align-items: center;
			justify-content: center;
			position: sticky;
			top: 0;
			height: 100dvh;
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			padding: 1rem 1.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			font-size: clamp(8rem, 15vw, 15rem);
			font-weight: 900;
			color: var(--foreground);
			opacity: 0.06;
			white-space: nowrap;
			line-height: 1;
			letter-spacing: -0.04em;
		}
		.edge-dot {
			color: var(--primary);
			opacity: 1;
		}
		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}

		/* Swap visibility */
		.desktop-terminals { display: block; }
		.mobile-terminals { display: none; }
	}

	/* ═══ Resize Handle ═══ */
	.contact-grid :global(.contact-resize-handle) {
		width: 8px;
		background: var(--card);
		border-radius: var(--radius-sm);
		transition: background var(--duration-fast) var(--ease-default);
	}
	.contact-grid :global(.contact-resize-handle:hover) {
		background: var(--primary);
	}
	.contact-grid :global(.contact-resize-handle > div) {
		/* Override default handle bar with dot grip */
		width: 3px;
		height: auto;
		background: transparent;
		display: flex;
		flex-direction: column;
		gap: 3px;
		align-items: center;
	}
</style>
```

- [ ] **Step 2: Run `bun run check`**

Expected: 0 errors.

- [ ] **Step 3: Run `bun run test`**

Expected: most tests pass. Some may need adjustment due to Paneforge rendering in test environment (addressed in Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/contact/ContactPage.svelte
git commit -m "feat(slice-17d): rewrite contact page — Recipe 4 grid + Paneforge resizable"
```

---

### Task 5: Style the resize handle dots

The default `withHandle` renders a bar. We need a 5-dot grip pattern. The cleanest approach is to override the handle's child content via the scoped CSS already added in Task 4 and adjust the `ResizableHandle` markup if needed.

**Files:**
- Modify: `src/lib/components/contact/ContactPage.svelte` (scoped styles only)

- [ ] **Step 1: Verify handle renders correctly**

The `withHandle` prop on `ResizableHandle` renders a `<div>` child. The scoped CSS in Task 4 styles it. If the 5-dot pattern doesn't show, we may need to replace `withHandle` with a custom `{#snippet}` or adjust the handle component.

Check in browser at `http://localhost:5173/contact`:
- Handle visible between terminals
- Handle shows dots
- Handle turns orange on hover

- [ ] **Step 2: If dots don't render, adjust approach**

If the default `withHandle` div doesn't support 5 dots, remove `withHandle` and add custom dot markup via the handle's snippet/children:

```svelte
<ResizableHandle class="contact-resize-handle">
	<div class="handle-dots">
		<span></span><span></span><span></span><span></span><span></span>
	</div>
</ResizableHandle>
```

Add to scoped `<style>`:

```css
.handle-dots {
	display: flex;
	flex-direction: column;
	gap: 3px;
	align-items: center;
}
.handle-dots span {
	width: 3px;
	height: 3px;
	border-radius: 50%;
	background: var(--muted-foreground);
	transition: background var(--duration-fast) var(--ease-default);
}
.contact-grid :global(.contact-resize-handle:hover) .handle-dots span {
	background: var(--background);
}
```

- [ ] **Step 3: Visual verification at desktop and mobile**

Desktop (1440px): two terminals side-by-side, drag handle works, edge title visible.
Mobile (375px): terminals stacked, no handle, no edge title.

- [ ] **Step 4: Commit if changes were needed**

```bash
git add src/lib/components/contact/ContactPage.svelte
git commit -m "fix(slice-17d): style contact resize handle with 5-dot grip pattern"
```

---

### Task 6: Update tests

**Files:**
- Modify: `src/lib/components/contact/ContactPage.test.ts`

- [ ] **Step 1: Update test file**

The key changes:
- `ContactPage` now accepts an optional `weather` prop
- Layout wrapper changed from contained div to `.contact-grid`
- Paneforge may need mocking in jsdom (if it errors, add to `vitest.setup.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import ContactPage from './ContactPage.svelte';

async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
	el.value = value;
	await fireEvent.input(el);
	await tick();
	await tick();
}

async function submitForm(submitBtn: HTMLElement) {
	const form = submitBtn.closest('form') as HTMLFormElement;
	await fireEvent.submit(form);
	await tick();
}

describe('ContactPage', () => {
	it('renders with data-testid page-contact', () => {
		render(ContactPage);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage);
		expect(screen.getByText(/CONTACT.*NEXT STOP/)).toBeTruthy();
	});

	it('renders info terminal', () => {
		render(ContactPage);
		expect(screen.getByTestId('contact-info-terminal')).toBeTruthy();
	});

	it('renders form terminal', () => {
		render(ContactPage);
		expect(screen.getByTestId('contact-form-terminal')).toBeTruthy();
	});

	it('renders all three form fields', () => {
		render(ContactPage);
		expect(screen.getByLabelText(/name/i)).toBeTruthy();
		expect(screen.getByLabelText(/email/i)).toBeTruthy();
		expect(screen.getByLabelText(/message/i)).toBeTruthy();
	});

	it('renders submit button', () => {
		render(ContactPage);
		expect(screen.getByRole('button', { name: /send/i })).toBeTruthy();
	});

	it('renders social links', () => {
		render(ContactPage);
		expect(screen.getByTestId('contact-social-email')).toBeTruthy();
		expect(screen.getByTestId('contact-social-github')).toBeTruthy();
		expect(screen.getByTestId('contact-social-linkedin')).toBeTruthy();
	});

	it('email social uses mailto link', () => {
		render(ContactPage);
		const emailLink = screen.getByTestId('contact-social-email');
		expect(emailLink.getAttribute('href')).toMatch(/^mailto:/);
	});

	it('github social opens in new tab', () => {
		render(ContactPage);
		const ghLink = screen.getByTestId('contact-social-github');
		expect(ghLink.getAttribute('target')).toBe('_blank');
	});

	it('shows validation errors on empty submit', async () => {
		render(ContactPage);
		const submitBtn = screen.getByRole('button', { name: /send/i });
		await submitForm(submitBtn);

		const errors = screen.getAllByText(/✗/);
		expect(errors.length).toBeGreaterThanOrEqual(3);
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage);
		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
		const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

		await typeInto(nameInput, 'Test');
		await typeInto(emailInput, 'not-an-email');
		await typeInto(messageInput, 'Hello');

		await submitForm(screen.getByRole('button', { name: /send/i }));

		expect(screen.getByText(/invalid.*email/i)).toBeTruthy();
	});

	it('shows success state after valid submit', async () => {
		render(ContactPage);
		const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
		const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

		await typeInto(nameInput, 'Test User');
		await typeInto(emailInput, 'test@example.com');
		await typeInto(messageInput, 'Hello there');

		await submitForm(screen.getByRole('button', { name: /send/i }));

		// Wait for typed sequence to complete (~150ms * 9 lines)
		await new Promise((r) => setTimeout(r, 2000));

		expect(screen.getByTestId('contact-success')).toBeTruthy();
	});

	it('displays weather when provided', () => {
		render(ContactPage, {
			props: { weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		expect(screen.getByText(/12°C/)).toBeTruthy();
		expect(screen.getByText(/partly cloudy/i)).toBeTruthy();
	});

	it('renders without weather gracefully', () => {
		render(ContactPage, { props: { weather: null } });
		expect(screen.queryByText(/°C/)).toBeNull();
		// Page still renders fine
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run `bun run test`**

If Paneforge errors in jsdom (e.g., ResizeObserver not defined), add a mock to `src/tests/setup.dom.ts`:

```typescript
// Paneforge needs ResizeObserver
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
}
```

- [ ] **Step 3: Verify all tests pass**

Run: `bun run test`

Expected: all tests pass including the 2 new weather tests.

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/contact/ContactPage.test.ts
git commit -m "test(slice-17d): update contact page tests for new layout + weather"
```

---

### Task 7: Final verification

**Files:** none — verification only

- [ ] **Step 1: Run `bun run check`**

Expected: 0 errors.

- [ ] **Step 2: Run `bun run test`**

Expected: all tests pass.

- [ ] **Step 3: Visual verification — desktop (1440px)**

Check at `http://localhost:5173/contact`:
- Rotated "Contact." edge title visible, big and ghosted (opacity 0.06)
- Orange accent line between edge title and content
- SectionHeading "Contact." with station label at top
- Two terminals in resizable split (33/67 default)
- Drag handle works — resize both panes
- Handle shows dot grip, turns orange on hover
- Info terminal: location, weather (if API key configured), response time, socials, cursor
- Form terminal: name, email, message fields, submit button
- Submit → typed success sequence works
- Reset button returns to form

- [ ] **Step 4: Visual verification — mobile (375px)**

- No edge title, no accent line
- SectionHeading visible at top
- Info terminal stacked first
- Form terminal stacked second
- No resize handle
- Form validation + submit works

- [ ] **Step 5: STOP — present to Yesid for review**

Tell Yesid:
- What was built: Full-bleed contact page with Recipe 4 grid, resizable terminals, live weather
- What to check: resize the divider, submit a test message, check mobile layout
- Decisions made: (reference design decisions D218-D230)
