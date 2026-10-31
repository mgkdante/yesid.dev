<!--
  Contact page — full-bleed Recipe 4 Edge Title Grid.
  Rotated "Contact." edge title + accent line + resizable dual terminals.
  Info terminal (left): location, weather, local time, response time, social links.
  Form terminal (right): name, email, message + typed success sequence.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { computeRotatedTitleSize } from '#lib/utils/rotated-title-fit.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { getLocale, intl } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { fillTemplate } from '#lib/utils/labels.ts';
	import { siteLabels, siteMeta } from '#lib/content/index.ts';
	import { clock, persisted } from '@yesid/ui/state';
	import type { ContactContent } from '#lib/types.ts';
	import { TerminalPanel, TerminalCursor } from '@yesid/ui/brand';
	import { Button } from '@yesid/ui/button';
	import { ResizablePaneGroup, ResizablePane } from '@yesid/ui/resizable';
	import { ResizableHandle } from '@yesid/ui/resizable';
	import type { WeatherData } from '#lib/utils/weather.ts';
	import { fetchFreshWeather } from '#lib/utils/weather-refresh.ts';
	import { escapeHtml } from '#lib/utils/code-fences.ts';
	import { isDirectContactHref } from '#lib/utils/high-intent-links.ts';
	import { pressBounce } from '@yesid/motion/actions';
	import { trackAnalyticsEvent } from '#lib/analytics/client.ts';

	let {
		contactPage,
		weather = null,
	}: {
		contactPage: ContactContent;
		weather?: WeatherData | null;
	} = $props();

	// $derived on the contactPage reads so they recompute if the prop changes:
	// a plain const captures only the initial value, which Svelte 5 flags.
	const pageTitle = $derived(resolveLocale(contactPage.pageTitle, locale));
	const stationLabel = $derived(resolveLocale(contactPage.stationLabel, locale));
	const sendErrorMessage = $derived(resolveLocale(contactPage.sendErrorMessage, locale));
	const workLinkLabel = $derived(resolveLocale(contactPage.success.workLinkLabel, locale));
	const blogLinkLabel = $derived(resolveLocale(contactPage.success.blogLinkLabel, locale));

	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather);

	// Hydration gate (consolidation-deploy-honesty): the page is prerendered,
	// so the static HTML paints before handleSubmit is attached. A submit in
	// that window would fall back to a NATIVE GET submit — full reload with the
	// form values dumped into the query string. The form requires JS to send
	// (Web3Forms fetch), so the honest pre-hydration state is a disabled
	// button; it enables the moment the handler exists.
	let hydrated = $state(false);

	// --- Local time (Montreal), client-only: the page is prerendered ---
	const montrealTime = intl.dateTime('en', {
		timeZone: 'America/Montreal',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZoneName: 'short',
	});
	const localTime = $derived(hydrated ? montrealTime.format(clock.now) : '');
	$effect(() => clock.subscribe());

	// Measure the rotated label to fit the edge column; CSS provides the first-paint fallback.
	let edgeColumnEl = $state<HTMLElement | undefined>(undefined);
	let edgeTitleSize = $state<number | null>(null);
	const edgeVar = $derived(
		edgeTitleSize === null ? undefined : `--edge-title-size: ${edgeTitleSize}px`,
	);
	let edgeFitRaf = 0;

	function recomputeEdgeFit() {
		const sample = edgeColumnEl?.querySelector('.edge-title');
		if (!sample || !edgeColumnEl) return;
		// The dot rides after the label: measure the full rendered string.
		const budget = edgeColumnEl.clientHeight * 0.95;
		if (budget <= 0) return;
		const size = computeRotatedTitleSize(sample, [`${pageTitle}.`], budget, 208);
		if (size !== null) edgeTitleSize = size;
	}

	function onEdgeResize() {
		cancelAnimationFrame(edgeFitRaf);
		edgeFitRaf = requestAnimationFrame(recomputeEdgeFit);
	}

	onMount(() => {
		hydrated = true;
		void fetchFreshWeather(locale).then((w) => { if (w) freshWeather = w; });
		recomputeEdgeFit();
		document.fonts?.ready.then(() => recomputeEdgeFit()).catch(() => {});
		window.addEventListener('resize', onEdgeResize);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			cancelAnimationFrame(edgeFitRaf);
			window.removeEventListener('resize', onEdgeResize);
		}
	});

	// --- Form state ---
	// A half-typed message survives a locale switch or a reload: name/email/message
	// are tab-scoped via persisted(). They are user-typed primitives, never copy.
	const name = persisted<string>('contact-name', '');
	const email = persisted<string>('contact-email', '');
	const message = persisted<string>('contact-message', '');
	const fields = [
		{ key: 'name', state: name },
		{ key: 'email', state: email },
		{ key: 'message', state: message },
	] as const;

	let submitted = $state(false);
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);
	let successLines = $state<{ text: string; color: string; visible: boolean }[]>([]);

	// Only the locale-free "the send succeeded" bit is stored. The success lines are
	// translated, so any mount of a sent form rebuilds them in the current locale.
	const wasSuccessful = persisted<boolean>('contact-success', false);
	$effect(() => {
		if (wasSuccessful.value && !showSuccess) {
			rebuildSuccessLines();
			showSuccess = true;
		}
	});

	// --- Validation ---
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!name.value.trim()) {
			newErrors.name = resolveLocale(contactPage.validation.required, locale).replace('{field}', fieldLabel('name'));
		}
		if (!email.value.trim()) {
			newErrors.email = resolveLocale(contactPage.validation.required, locale).replace('{field}', fieldLabel('email'));
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
			newErrors.email = resolveLocale(contactPage.validation.invalidEmail, locale);
		}
		if (!message.value.trim()) {
			newErrors.message = resolveLocale(contactPage.validation.required, locale).replace('{field}', fieldLabel('message'));
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
		if (sending) return; // in-flight guard — no double submits
		submitted = true;
		if (!validate()) return;

		sending = true;
		// A stalled provider must release the form without discarding the draft.
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 15_000);
		try {
			const res = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				signal: controller.signal,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_key: contactPage.web3formsKey,
					subject: fillTemplate(
						resolveLocale(siteLabels.email.contactSubjectTemplate, locale) || 'New contact from {name} via yesid.dev',
						{ name: name.value },
					),
					from_name: name.value,
					email: email.value,
					message: message.value,
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
		} finally {
			clearTimeout(timeout);
		}

		trackAnalyticsEvent('contact_form_success');
		sending = false;
		await playSuccessSequence();
	}

	// --- Success animation sequence ---
	// The success lines are translated, so they are re-derived in the current locale,
	// never persisted. rebuildSuccessLines() shows them at once on a later mount;
	// playSuccessSequence() reveals them line by line after a real send.
	function buildSuccessLines() {
		const okText = resolveLocale(contactPage.success.fieldOk, locale);
		return [
			{ text: resolveLocale(contactPage.success.command, locale), color: 'muted' },
			{ text: `→ ${resolveLocale(contactPage.success.validating, locale)}`, color: 'orange' },
			{ text: `✓ ${fieldLabel('name')}: ${okText}`, color: 'green' },
			{ text: `✓ ${fieldLabel('email')}: ${okText}`, color: 'green' },
			{ text: `✓ ${fieldLabel('message')}: ${okText}`, color: 'green' },
			{ text: `→ ${resolveLocale(contactPage.success.sending, locale)}`, color: 'orange' },
			{ text: `✓ ${resolveLocale(contactPage.success.sent, locale)}`, color: 'green' },
			{ text: `→ ${resolveLocale(contactPage.success.responseTime, locale)}`, color: 'accent' },
			{ text: `→ ${resolveLocale(contactPage.success.meanwhile, locale)}`, color: 'muted' }
		];
	}

	// The form already succeeded earlier in this tab: show the lines fully visible.
	function rebuildSuccessLines() {
		successLines = buildSuccessLines().map((l) => ({ ...l, visible: true }));
	}

	async function playSuccessSequence() {
		// Clear the persisted draft so a sent message can't resurrect, and flag the
		// success so a later mount re-shows the success screen.
		name.value = '';
		email.value = '';
		message.value = '';
		wasSuccessful.value = true;

		successLines = buildSuccessLines().map((l) => ({ ...l, visible: false }));
		showSuccess = true;

		for (let i = 0; i < successLines.length; i++) {
			await new Promise((r) => setTimeout(r, 150));
			successLines[i] = { ...successLines[i], visible: true };
		}
	}

	// --- Reset ---
	function handleReset() {
		// Clear the persisted sessions too (incl. the success flag) so "send another"
		// starts empty and stays empty on a later mount.
		name.value = '';
		email.value = '';
		message.value = '';
		wasSuccessful.value = false;
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

	function contactChannelLabel(label: ContactContent['socials'][number]['label']): string {
		return resolveLocale(label, locale);
	}

	function fieldLabel(field: keyof ContactContent['formTerminal']['fields']): string {
		const label = contactPage.formTerminal.fields[field].label;
		return typeof label === 'string' ? label : resolveLocale(label, locale);
	}

	function handleContactChannelClick(
		social: ContactContent['socials'][number],
	): void {
		if (social.icon === 'calendar') {
			trackAnalyticsEvent('booking_click');
			return;
		}

		if (isDirectContactHref(social.href)) {
			trackAnalyticsEvent('direct_contact_click');
		}
	}

</script>

<div class="contact-grid" data-testid="page-contact">
	<!-- ═══ EDGE TITLE (desktop only) ═══ -->
	<div class="edge-title-column" bind:this={edgeColumnEl} style={edgeVar}>
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
			<ResizablePaneGroup direction="horizontal" class="h-auto rounded-lg">
				<ResizablePane defaultSize={33} minSize={20}>
					{@render infoTerminal()}
				</ResizablePane>
				<ResizableHandle withHandle class="contact-resize-handle" />
				<ResizablePane defaultSize={67} minSize={40}>
					{@render formTerminal('desktop')}
				</ResizablePane>
			</ResizablePaneGroup>
		</div>

		<!-- Mobile: Stacked -->
		<div class="mobile-terminals">
			{@render infoTerminal()}
			{@render formTerminal('mobile')}
		</div>
	</div>
</div>

<!-- ═══ INFO TERMINAL SNIPPET ═══ -->
{#snippet infoTerminal()}
	<TerminalPanel title={contactPage.infoTerminal.title} class="h-full" data-testid="contact-info-terminal">
		<div class="font-mono text-body leading-relaxed">
			<!-- Command line -->
			<div class="mb-4 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {contactPage.infoTerminal.command}
			</div>

			<!-- LOCATION section -->
			<div class="mb-4">
				<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(contactPage.infoTerminal.sectionLabels.location, locale)}</div>
				<div class="text-[var(--secondary-foreground)]">{resolveLocale(contactPage.infoTerminal.location, locale)}</div>
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
				<!-- The 24h promise renders BEFORE submit (it previously existed in the
				     CMS but only appeared on the success screen). -->
				<div class="mt-0.5 font-mono text-small text-[var(--secondary-foreground)]">
					{resolveLocale(contactPage.infoTerminal.responseTime, locale)}
				</div>
			</div>

			<div class="mb-4">
				<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(contactPage.infoTerminal.sectionLabels.languages, locale)}</div>
				<div class="text-[var(--secondary-foreground)]">{resolveLocale(contactPage.infoTerminal.languages, locale)}</div>
			</div>

			{#if contactPage.infoTerminal.bestFit?.length}
				<div class="mb-4" data-testid="contact-best-fit">
					{#if contactPage.infoTerminal.sectionLabels.bestFit}
						<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(contactPage.infoTerminal.sectionLabels.bestFit, locale)}</div>
					{/if}
					{#each contactPage.infoTerminal.bestFit as line}
						<div class="text-[var(--secondary-foreground)]">{resolveLocale(line, locale)}</div>
					{/each}
				</div>
			{/if}

			<!-- CONNECT section -->
			<div class="mb-4">
				<div class="mb-2 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(contactPage.infoTerminal.sectionLabels.connect, locale)}</div>
				<div class="flex flex-col gap-1">
					{#each contactPage.socials as social}
						<a
							href={social.href}
							data-testid="contact-social-{social.icon}"
							onclick={() => handleContactChannelClick(social)}
							class="tap-feedback flex items-center gap-2 rounded px-2 py-3 min-h-11 text-[var(--foreground)] transition-colors duration-200 hover:bg-primary/15 active:bg-primary/25"
							{...(social.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
						>
							<span class="text-[var(--primary)]" aria-hidden="true">→</span>
							<span class="text-small">{contactChannelLabel(social.label)}</span>
							{#if social.icon === 'calendar'}
								<!-- The booking row keeps its address as a muted suffix. -->
								<span class="text-small text-[var(--muted-foreground)]">{social.href.replace(/^https?:\/\//, '')}</span>
							{/if}
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
	</TerminalPanel>
{/snippet}

<!-- ═══ FORM TERMINAL SNIPPET ═══ -->
{#snippet formTerminal(layout: 'desktop' | 'mobile')}
	<TerminalPanel title={contactPage.formTerminal.title} class="h-full" data-testid="contact-form-terminal">
		<div class="font-mono text-body leading-relaxed">
			<!-- Command + output -->
			<div class="mb-1 text-[var(--secondary-foreground)]">
				<span class="text-[var(--foreground)]">~</span> {contactPage.formTerminal.command}
			</div>
			<div class="mb-4 text-caption text-[var(--muted-foreground)]">
				{resolveLocale(contactPage.formTerminal.commandOutput, locale)}
			</div>

			{#if !showSuccess}
				<!-- ─── FORM ─── -->
				<form
					onsubmit={handleSubmit}
					class="mt-3 space-y-3"
				>
					<div class="flex flex-col gap-4">

						{#each fields as { key, state }}
							{@const id = `contact-${layout}-${key}`}
							{@const error = submitted && errors[key]}
							{@const attributes = {
								id,
								name: key,
								'data-handoff-focus': `contact-${key}`,
								'aria-invalid': error ? true : undefined,
								'aria-describedby': error ? `${id}-error` : undefined,
								placeholder: resolveLocale(contactPage.formTerminal.fields[key].placeholder, locale),
								class: `form-field tap-feedback rounded border bg-[var(--background)] px-4 py-3 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 ${key === 'message' ? 'resize-none' : 'min-h-11'} ${fieldBorderClass(key)}`,
							}}
							<div class="flex flex-col gap-1">
								<label for={id} class="text-caption text-[var(--primary)]">
									{fieldLabel(key)}:
								</label>
								{#if key === 'message'}
									<textarea {...attributes} bind:value={state.value} rows="6"></textarea>
								{:else}
									<input {...attributes} type={key === 'email' ? 'email' : 'text'} bind:value={state.value} />
								{/if}
								{#if error}
									<div id={id + '-error'} class="text-caption text-[var(--destructive)]">✗ {error}</div>
								{/if}
							</div>
						{/each}

						<!-- Server-level error -->
						{#if submitted && errors.form}
							<div class="mt-0.5 text-caption text-[var(--destructive)]">✗ {errors.form}</div>
						{/if}

						<!-- Error summary -->
						{#if submitted && errorCount() > 0}
							<div data-testid="contact-error-summary" class="rounded border border-[var(--destructive)]/30 px-3 py-2 text-caption text-[var(--destructive)]">
								✗ {resolveLocale(contactPage.validation.errorSummary, locale).replace('{count}', String(errorCount()))}
							</div>
						{/if}

						<span class="tap-press" use:pressBounce>
							<Button
								variant="conversion"
								size="cta"
								type="submit"
								disabled={sending || !hydrated}
								aria-busy={sending}
								data-testid="contact-submit"
							>
								<span aria-hidden="true">~ $</span>
								{sending
									? resolveLocale(contactPage.success.sending, locale)
									: resolveLocale(contactPage.formTerminal.submitLabel, locale)}
							</Button>
						</span>

						<!-- In-flight transmission line (terminal voice) -->
						{#if sending}
							<div class="text-caption text-[var(--primary)]" role="status" data-testid="contact-sending-line">
								→ {resolveLocale(contactPage.success.sending, locale)}
							</div>
						{/if}

						<div class="mt-1 flex flex-wrap items-center gap-2 font-mono text-caption">
							<span class="text-[var(--secondary-foreground)]">{resolveLocale(contactPage.formTerminal.bookingPrompt, locale)}</span>
							<a
								href={siteMeta.links.booking}
								target="_blank"
								rel="noopener"
								data-testid="contact-booking-link"
								onclick={() => trackAnalyticsEvent('booking_click')}
								class="tap-feedback rounded px-1 py-0.5 inline-flex min-h-11 items-center text-[var(--primary)] transition-colors duration-200 hover:bg-primary/15"
							>
								<span aria-hidden="true">~ $</span>
								{resolveLocale(contactPage.formTerminal.bookingButtonLabel, locale)}
							</a>
						</div>

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
										.replace('{work}', `<a href="${localizeHref('/services', locale)}">${escapeHtml(workLinkLabel)}</a>`)
										.replace('{blog}', `<a href="${localizeHref('/blog', locale)}">${escapeHtml(blogLinkLabel)}</a>`)}
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
						data-testid="contact-reset"
						class="mt-4 self-start font-mono text-caption tap-feedback min-h-11 px-4"
					>
						{resolveLocale(contactPage.success.resetLabel, locale)}
					</Button>
				</div>
			{/if}

		</div>
	</TerminalPanel>
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

	/* Mobile: resizable hidden, stacked visible */
	.desktop-terminals { display: none; }
	.mobile-terminals {
		display: flex;
		flex-direction: column;
		gap: var(--space-card-gap);
	}

	/* Mobile heading visible, hidden on desktop (rotated edge title replaces it) */
	.mobile-heading { display: block; margin-bottom: 0.5rem; }

	@media (--desktop-min) {
		.mobile-heading { display: none; }
		.contact-grid {
			display: grid;

			grid-template-columns: auto 2px minmax(0, 1fr);
			padding-block: 0;
			margin-top: calc(-1 * var(--nav-clearance));
		}
		.contact-content {
			padding-top: calc(var(--nav-clearance) + var(--space-card-gap));
			padding-bottom: var(--space-card-gap);
			padding-inline: var(--space-page-x);
			display: flex;
			flex-direction: column;
		}
		/* Edge title starts at top, extends behind nav */
		.edge-title-column {
			display: flex;
			position: sticky;
			top: 0;
			height: 100dvh;
			align-self: start;
			align-items: center;
			justify-content: center; /* centered within its own column */
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			padding: 0 1.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			/* The size variable is measured after hydration; its fallback covers first paint. */
			font-size: var(--edge-title-size, min(clamp(6rem, 12vw, 13rem), 11dvh));
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
			background: color-mix(in srgb, var(--primary) 35%, transparent);
		}

		.desktop-terminals { display: block; }
		.mobile-terminals { display: none; }
	}

	/* ═══ iOS keyboard-overlap mitigation ═══ */
	/* Focused form fields need breathing room above the virtual keyboard */
	.form-field {
		scroll-margin-bottom: 100px;

		caret-color: var(--primary);
	}

	.contact-grid :global(.contact-resize-handle) {
		width: 8px;
		background: var(--border);
		border-radius: var(--radius-sm);
		transition: background var(--duration-fast) var(--ease-default);
	}
	.contact-grid :global(.contact-resize-handle:hover) {
		background: var(--primary);
	}
</style>
