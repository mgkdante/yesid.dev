<!--
  Contact page — full-bleed Recipe 4 Edge Title Grid.
  Rotated "Contact." edge title + accent line + resizable dual terminals.
  Info terminal (left): location, weather, local time, response time, social links.
  Form terminal (right): name, email, message + typed success sequence.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { fillTemplate } from '$lib/utils/labels';
	import { siteLabels } from '$lib/content';
	import type { ContactContent } from '$lib/types';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { TerminalChrome } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
	import type { WeatherData } from '$lib/utils/weather';
	import { pressBounce } from '$lib/motion/actions';

	// slice-18i Phase 7C: contactContent now flows as a prop from the server load.
	// slice-29: initialMessage carries the decoded ?bp= blueprint prefill from
	// the Tech Stack Engine handoff (computed client-side in the route so
	// CDN-cached HTML can't bake a stale blueprint in).
	let {
		contactPage,
		weather = null,
		initialMessage = null,
	}: {
		contactPage: ContactContent;
		weather?: WeatherData | null;
		initialMessage?: string | null;
	} = $props();

	const c = contactPage;
	const pageTitle = resolveLocale(c.pageTitle, locale);
	const stationLabel = resolveLocale(c.stationLabel, locale);
	const sendErrorMessage = resolveLocale(c.sendErrorMessage, locale);

	// --- Weather freshness (slice-28.1, audit #20/#122) ---
	// The `weather` prop is SSR-baked and CDN-cached with the page (up to a
	// day old). Render it immediately, then refresh from /api/weather after
	// hydration. Any failure is a graceful no-op — the baked value stays.
	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather);

	async function refreshWeather() {
		try {
			const res = await fetch('/api/weather');
			if (!res.ok) return;
			const data = (await res.json()) as WeatherData | null;
			if (data && typeof data.temp === 'number') freshWeather = data;
		} catch {
			// Keep the SSR-baked value.
		}
	}

	// --- Local time (Montreal) ---
	let localTime = $state('');
	let timeInterval: ReturnType<typeof setInterval> | undefined;

	function updateTime() {
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'America/Montreal',
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
			timeZoneName: 'short',
		});
		localTime = formatter.format(new Date());
	}

	onMount(() => {
		updateTime();
		timeInterval = setInterval(updateTime, 60_000);
		void refreshWeather();
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
	});

	// --- Form state ---
	let name = $state('');
	let email = $state('');
	let message = $state(initialMessage ?? '');

	// slice-29: late-arriving blueprint prefill (e.g. client-side ?bp= change)
	// only applies while the field is untouched — never clobber typed text.
	$effect(() => {
		if (initialMessage && message === '') message = initialMessage;
	});
	let submitted = $state(false);
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);
	let successLines = $state<{ text: string; color: string; visible: boolean }[]>([]);

	// --- Validation ---
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!name.trim()) {
			newErrors.name = resolveLocale(c.validation.required, locale).replace('{field}', 'name');
		}
		if (!email.trim()) {
			newErrors.email = resolveLocale(c.validation.required, locale).replace('{field}', 'email');
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = resolveLocale(c.validation.invalidEmail, locale);
		}
		if (!message.trim()) {
			newErrors.message = resolveLocale(c.validation.required, locale).replace('{field}', 'message');
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
					subject: fillTemplate(
						resolveLocale(siteLabels.email.contactSubjectTemplate, locale) || 'New contact from {name} via yesid.dev',
						{ name },
					),
					from_name: name,
					email,
					message,
				}),
			});
			const result = await res.json();

			if (!result.success) {
				errors = { form: sendErrorMessage };
				sending = false;
				return;
			}
		} catch {
			errors = { form: sendErrorMessage };
			sending = false;
			return;
		}

		sending = false;
		await playSuccessSequence();
	}

	// --- Success animation sequence ---
	async function playSuccessSequence() {
		const okText = resolveLocale(c.success.fieldOk, locale);
		const lines = [
			{ text: '~ $ send --message', color: 'muted' },
			{ text: `→ ${resolveLocale(c.success.validating, locale)}`, color: 'orange' },
			{ text: `✓ ${c.formTerminal.fields.name.label}: ${okText}`, color: 'green' },
			{ text: `✓ ${c.formTerminal.fields.email.label}: ${okText}`, color: 'green' },
			{ text: `✓ ${c.formTerminal.fields.message.label}: ${okText}`, color: 'green' },
			{ text: `→ ${resolveLocale(c.success.sending, locale)}`, color: 'orange' },
			{ text: `✓ ${resolveLocale(c.success.sent, locale)}`, color: 'green' },
			{ text: `→ ${resolveLocale(c.success.responseTime, locale)}`, color: 'accent' },
			{ text: `→ ${resolveLocale(c.success.meanwhile, locale)}`, color: 'muted' }
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
		return 'border-[var(--success)]';
	}

</script>

<div class="contact-grid" data-testid="page-contact">
	<!-- ═══ EDGE TITLE (desktop only) ═══ -->
	<div class="edge-title-column">
		<div class="edge-title">{pageTitle}<span class="edge-dot">.</span></div>
	</div>

	<!-- ═══ ACCENT LINE ═══ -->
	<div class="accent-rail"></div>

	<!-- ═══ CONTENT ═══ -->
	<div class="contact-content">
		<!-- Mobile: visible heading. Desktop: sr-only (rotated edge title is the heading) -->
		<h1 class="mobile-heading text-display font-bold">{pageTitle}<span class="text-[var(--primary)]">.</span></h1>
		<div class="mb-2 font-mono text-caption uppercase tracking-[2px] text-[var(--muted-foreground)]">
			{stationLabel}
		</div>

		<!-- Desktop: Resizable split -->
		<div class="desktop-terminals">
			<ResizablePaneGroup direction="horizontal" class="h-full rounded-lg">
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
		<div class="mobile-terminals">
			{@render infoTerminal()}
			{@render formTerminal()}
		</div>
	</div>
</div>

<!-- ═══ INFO TERMINAL SNIPPET ═══ -->
{#snippet infoTerminal()}
	<TerminalChrome title={c.infoTerminal.title} class="h-full" data-testid="contact-info-terminal">
		<div class="font-mono text-body leading-relaxed">
			<!-- Command line -->
			<div class="mb-4 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {c.infoTerminal.command}
			</div>

			<!-- LOCATION section -->
			<div class="mb-4">
				<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(c.infoTerminal.sectionLabels.location, locale)}</div>
				<div class="text-[var(--secondary-foreground)]">{resolveLocale(c.infoTerminal.location, locale)}</div>
				{#if currentWeather}
					<div class="mt-0.5 font-mono text-small text-[var(--accent-text)]">
						{currentWeather.temp}°C — <span class="capitalize">{currentWeather.condition}</span>
					</div>
				{/if}
				{#if localTime}
					<div class="mt-0.5 font-mono text-small text-[var(--secondary-foreground)]">
						{localTime}
					</div>
				{/if}
			</div>

			<!-- CONNECT section -->
			<div class="mb-4">
				<div class="mb-2 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(c.infoTerminal.sectionLabels.connect, locale)}</div>
				<div class="flex flex-col gap-1">
					{#each c.socials as social}
						<a
							href={social.href}
							data-testid="contact-social-{social.icon}"
							class="tap-feedback flex items-center gap-2 rounded px-2 py-3 min-h-11 text-[var(--foreground)] transition-colors duration-200 hover:bg-primary/15 active:bg-primary/25"
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
		<div class="font-mono text-body leading-relaxed">
			<!-- Command + output -->
			<div class="mb-1 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {c.formTerminal.command}
			</div>
			<div class="mb-4 text-caption text-[var(--muted-foreground)]">
				{resolveLocale(c.formTerminal.commandOutput, locale)}
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
								placeholder={resolveLocale(c.formTerminal.fields.name.placeholder, locale)}
								class="form-field tap-feedback rounded border bg-[var(--background)] px-4 py-3 min-h-11 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('name')}"
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
								placeholder={resolveLocale(c.formTerminal.fields.email.placeholder, locale)}
								class="form-field tap-feedback rounded border bg-[var(--background)] px-4 py-3 min-h-11 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('email')}"
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
								placeholder={resolveLocale(c.formTerminal.fields.message.placeholder, locale)}
								rows="6"
								class="tap-feedback form-field rounded border bg-[var(--background)] px-4 py-3 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 resize-none {fieldBorderClass('message')}"
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
								✗ {resolveLocale(c.validation.errorSummary, locale).replace('{count}', String(errorCount()))}
							</div>
						{/if}

						<!-- Submit button -->
						<span class="tap-press" use:pressBounce>
							<Button variant="default" size="cta" type="submit">
								<span class="opacity-60">~ $</span>
								{resolveLocale(c.formTerminal.submitLabel, locale)}
							</Button>
						</span>

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
									? 'text-[var(--success)]'
									: line.color === 'accent'
										? 'text-[var(--accent-text)]'
										: 'text-[var(--secondary-foreground)]'} text-small">
								{#if line.color === 'muted' && line.text.includes('{work}') && line.text.includes('{blog}')}
									{@html line.text
										.replace('{work}', `<a href="${localizeHref('/services', locale)}" class="tap-feedback text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent-text)] active:text-[var(--accent-text)] transition-colors">work</a>`)
										.replace('{blog}', `<a href="${localizeHref('/blog', locale)}" class="tap-feedback text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent-text)] active:text-[var(--accent-text)] transition-colors">blog</a>`)}
								{:else}
									{line.text}
								{/if}
							</div>
						{/if}
					{/each}

					<!-- Reset button -->
					<Button
						variant="ghost"
						onclick={handleReset}
						class="mt-4 self-start font-mono text-caption tap-feedback min-h-11 px-4"
					>
						{resolveLocale(c.success.resetLabel, locale)}
					</Button>
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
		/* Desktop: entire page fits in 100dvh (nav + content + footer) */
	}
	.edge-title-column { display: none; }
	.accent-rail { display: none; }
	.contact-content {
		min-width: 0;
		padding-inline: var(--space-page-x);
	}

	/* Mobile: resizable hidden, stacked visible */
	.desktop-terminals { display: none; }
	.mobile-terminals {
		display: flex;
		flex-direction: column;
		gap: var(--space-card-gap);
	}

	/* Mobile heading visible, hidden on desktop (rotated edge title replaces it) */
	.mobile-heading { display: block; margin-bottom: 0.5rem; }

	/* Desktop only: cap main so entire page fits in one viewport */
	@media (min-width: 1024px) {
		:global(main:has(.contact-grid)) {
			max-height: calc(100dvh - 5rem - 6rem); /* 100dvh - nav (5rem) - footer (~6rem) */
			overflow: hidden;
			padding-bottom: 1.5rem; /* breathing room above footer */
		}
		.mobile-heading { display: none; }
	}

	@media (min-width: 1024px) {
		.contact-grid {
			display: grid;
			grid-template-columns: auto 1px 1fr;
			padding-block: 0;
			height: 100%;
			/* Edge title + divider extend behind nav (same as blog/projects) */
			margin-top: -5rem;
		}
		.contact-content {
			padding-top: calc(5rem + var(--space-card-gap)); /* clear nav + breathing */
			padding-bottom: var(--space-card-gap);
			padding-inline: var(--space-page-x);
			display: flex;
			flex-direction: column;
		}
		/* Terminals max-height = 100dvh - nav - footer - 5rem */
		.desktop-terminals {
			max-height: calc(100dvh - 5rem - 6rem - 5rem);
		}
		/* Edge title starts at top, extends behind nav */
		.edge-title-column {
			display: flex;
			align-items: center;
			justify-content: center; /* centered within its own column */
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			padding: 0 1.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			font-size: clamp(6rem, 12vw, 13rem);
			font-weight: 900;
			color: var(--foreground);
			white-space: nowrap;
			line-height: 1;
			letter-spacing: -0.04em;
		}
		.edge-dot {
			color: var(--primary);
		}
		.accent-rail {
			display: block;
			background: color-mix(in srgb, var(--primary) 20%, transparent);
		}

		/* Swap visibility */
		.desktop-terminals { display: block; flex: 1; min-height: 0; }
		.mobile-terminals { display: none; }
	}

	/* ═══ iOS keyboard-overlap mitigation ═══ */
	/* Focused form fields need breathing room above the virtual keyboard */
	.form-field {
		scroll-margin-bottom: 100px;
		/* GO-w2t5: terminal-orange caret — zero-risk brand signal. */
		caret-color: var(--primary);
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
</style>
