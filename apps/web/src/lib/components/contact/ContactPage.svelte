<!--
  Contact page — full-bleed Recipe 4 Edge Title Grid.
  Rotated "Contact." edge title + accent line + resizable dual terminals.
  Info terminal (left): location, weather, local time, response time, social links.
  Form terminal (right): name, email, message + typed success sequence.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { computeRotatedTitleSize } from '$lib/utils/rotated-title-fit';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { fillTemplate } from '$lib/utils/labels';
	import { siteLabels } from '$lib/content';
	import { persisted } from '$lib/state/persisted.svelte';
	import { localeHandoff } from '$lib/state/locale-handoff.svelte';
	import type { ContactContent } from '$lib/types';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { TerminalChrome } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
	import type { WeatherData } from '$lib/utils/weather';
	import { escapeHtml } from '$lib/utils/code-fences';
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

	// $derived on the contactPage reads so they recompute if the prop changes:
	// a plain const captures only the initial value, which Svelte 5 flags.
	const pageTitle = $derived(resolveLocale(contactPage.pageTitle, locale));
	const stationLabel = $derived(resolveLocale(contactPage.stationLabel, locale));
	const sendErrorMessage = $derived(resolveLocale(contactPage.sendErrorMessage, locale));
	const workLinkLabel = $derived(resolveLocale(contactPage.success.workLinkLabel, locale));
	const blogLinkLabel = $derived(resolveLocale(contactPage.success.blogLinkLabel, locale));

	// --- Weather freshness (slice-28.1, audit #20/#122) ---
	// The `weather` prop is SSR-baked and CDN-cached with the page (up to a
	// day old). Render it immediately, then refresh from /api/weather after
	// hydration. Any failure is a graceful no-op — the baked value stays.
	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather);

	async function refreshWeather() {
		try {
			// Pass the active locale so OpenWeather localizes `condition` (fr/es),
			// matching AboutWeather. EN omits the param, so its /api/weather URL
			// (and CDN cache key) stays byte-identical. Without this, /fr re-fetched
			// English weather after hydration, overwriting the correct SSR-baked value.
			const url = locale === DEFAULT_LOCALE ? '/api/weather' : `/api/weather?lang=${locale}`;
			const res = await fetch(url);
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

	// Hydration gate (consolidation-deploy-honesty): the page is prerendered,
	// so the static HTML paints before handleSubmit is attached. A submit in
	// that window would fall back to a NATIVE GET submit — full reload with the
	// form values dumped into the query string. The form requires JS to send
	// (Web3Forms fetch), so the honest pre-hydration state is a disabled
	// button; it enables the moment the handler exists.
	let hydrated = $state(false);

	// Rotated edge-title fit (operator spec 2026-07-03, shared logic with the
	// home rotated titles): the label is measured and sized to exactly fill
	// the edge column's height, capped at the 13rem design max. null until
	// measured: the CSS var fallback carries first paint.
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
		updateTime();
		timeInterval = setInterval(updateTime, 60_000);
		void refreshWeather();
		recomputeEdgeFit();
		document.fonts?.ready.then(() => recomputeEdgeFit()).catch(() => {});
		window.addEventListener('resize', onEdgeResize);
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
		if (typeof window !== 'undefined') {
			cancelAnimationFrame(edgeFitRaf);
			window.removeEventListener('resize', onEdgeResize);
		}
	});

	// --- Form state ---
	// slice-34.3: the flagship "state across languages" surface — a half-typed
	// message must survive a locale switch. name/email/message are session-scoped
	// via persisted(); the orchestrator snapshots them before the {#key}-remount
	// and restores them on the new locale's page. Locale-free invariant holds:
	// these are user-typed primitives, never translated copy.
	const name = persisted<string>('contact-name', '');
	const email = persisted<string>('contact-email', '');
	const message = persisted<string>('contact-message', '');

	// slice-34.3: seed the message from a ?bp= blueprint handoff, but never on a
	// switch-restore — a restore must win over the blueprint prefill. The
	// persisted() setter assigns the restored value unconditionally, so guarding
	// here lets restore beat both the '' default and this effect.
	$effect(() => {
		if (!localeHandoff.restoring && initialMessage && message.value === '') {
			message.value = initialMessage;
		}
	});
	let submitted = $state(false);
	let errors = $state<Record<string, string>>({});
	let showSuccess = $state(false);
	let successLines = $state<{ text: string; color: string; visible: boolean }[]>([]);

	// slice-34.3: persist ONLY the locale-free "the send succeeded" bit. The
	// success lines are translated → re-derived (rebuildSuccessLines) on restore,
	// never stored. On a switch-restore of a sent form, re-show the success screen
	// in the NEW locale.
	const wasSuccessful = persisted<boolean>('contact-success', false);
	$effect(() => {
		if (localeHandoff.restoring && wasSuccessful.value && !showSuccess) {
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
		try {
			const res = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
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
		}

		sending = false;
		await playSuccessSequence();
	}

	// --- Success animation sequence ---
	// slice-34.3: the success lines are TRANSLATED — they are re-derived in the
	// current locale, never persisted. rebuildSuccessLines() rebuilds them visible
	// (used on a switch-restore); playSuccessSequence() reveals them line-by-line
	// after a real submit.
	function buildSuccessLines() {
		const okText = resolveLocale(contactPage.success.fieldOk, locale);
		return [
			{ text: '~ $ send --message', color: 'muted' },
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

	// Switch-restore path: the form already succeeded in the OTHER locale; rebuild
	// the (translated) lines fully visible in THIS locale — no typed animation.
	function rebuildSuccessLines() {
		successLines = buildSuccessLines().map((l) => ({ ...l, visible: true }));
	}

	async function playSuccessSequence() {
		// slice-34.3: the send succeeded — clear the persisted draft so a sent
		// message can't resurrect on a later locale switch, and flip the locale-free
		// success flag so a switch mid-success-screen re-shows it in the new locale.
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
		// slice-34.3: clear the persisted sessions too (incl. the success flag) so
		// "send another" starts genuinely empty and survives a later switch as empty.
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
	<TerminalChrome title={contactPage.infoTerminal.title} class="h-full" data-testid="contact-info-terminal">
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

			<!-- LANGUAGES section (homework #25): tells a bilingual Montreal market
			     which language to write in; adding ES later is one CMS edit. -->
			<div class="mb-4">
				<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--primary)]">{resolveLocale(contactPage.infoTerminal.sectionLabels.languages, locale)}</div>
				<div class="text-[var(--secondary-foreground)]">{resolveLocale(contactPage.infoTerminal.languages, locale)}</div>
			</div>

			<!-- BEST FIT section (homework #26b): the project shapes that fit best,
			     so a prospect self-qualifies before the form. Hidden until the CMS
			     columns carry content (prod regenerates from the prod CMS). -->
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
							aria-label={contactChannelLabel(social.label)}
							data-testid="contact-social-{social.icon}"
							class="tap-feedback flex items-center gap-2 rounded px-2 py-3 min-h-11 text-[var(--foreground)] transition-colors duration-200 hover:bg-primary/15 active:bg-primary/25"
							{...(social.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
						>
							<span class="text-[var(--primary)]">→</span>
							{#if social.icon === 'calendar'}
								<!-- The booking row is the site's strongest CONNECT action: the
								     human label is visible (it was aria-only) with the URL as a
								     muted suffix. Other rows keep the terminal URL treatment. -->
								<span class="text-small">{contactChannelLabel(social.label)}</span>
								<span class="text-small text-[var(--muted-foreground)]">{social.href.replace(/^https?:\/\//, '')}</span>
							{:else}
								<span class="text-small">{social.href.replace(/^mailto:|^https?:\/\//, '')}</span>
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
	</TerminalChrome>
{/snippet}

<!-- ═══ FORM TERMINAL SNIPPET ═══ -->
{#snippet formTerminal()}
	<TerminalChrome title={contactPage.formTerminal.title} class="h-full" data-testid="contact-form-terminal">
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

						<!-- Name field -->
						<div class="flex flex-col gap-1">
							<label for="contact-name" class="text-caption text-[var(--primary)]">
								{fieldLabel('name')}:
							</label>
							<input
								id="contact-name"
								name="name"
								type="text"
								data-handoff-focus="contact-name"
								bind:value={name.value}
								placeholder={resolveLocale(contactPage.formTerminal.fields.name.placeholder, locale)}
								class="form-field tap-feedback rounded border bg-[var(--background)] px-4 py-3 min-h-11 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('name')}"
							/>
							{#if submitted && errors.name}
								<div class="text-caption text-[var(--destructive)]">✗ {errors.name}</div>
							{/if}
						</div>

						<!-- Email field -->
						<div class="flex flex-col gap-1">
							<label for="contact-email" class="text-caption text-[var(--primary)]">
								{fieldLabel('email')}:
							</label>
							<input
								id="contact-email"
								name="email"
								type="email"
								data-handoff-focus="contact-email"
								bind:value={email.value}
								placeholder={resolveLocale(contactPage.formTerminal.fields.email.placeholder, locale)}
								class="form-field tap-feedback rounded border bg-[var(--background)] px-4 py-3 min-h-11 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('email')}"
							/>
							{#if submitted && errors.email}
								<div class="text-caption text-[var(--destructive)]">✗ {errors.email}</div>
							{/if}
						</div>

						<!-- Message field -->
						<div class="flex flex-col gap-1">
							<label for="contact-message" class="text-caption text-[var(--primary)]">
								{fieldLabel('message')}:
							</label>
							<textarea
								id="contact-message"
								name="message"
								data-handoff-focus="contact-message"
								bind:value={message.value}
								placeholder={resolveLocale(contactPage.formTerminal.fields.message.placeholder, locale)}
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
								✗ {resolveLocale(contactPage.validation.errorSummary, locale).replace('{count}', String(errorCount()))}
							</div>
						{/if}

						<!-- Submit button — Round 5c: THE conversion action. Yellow
						     signage treatment (bg --accent, ink --signage-bg),
						     never orange: yellow = "talk to Yesid" only.
						     In flight: disabled + label swaps to the CMS "sending"
						     line so the 1-3s Web3Forms round trip is never dead air. -->
						<span class="tap-press" use:pressBounce>
							<Button
								variant="conversion"
								size="cta"
								type="submit"
								disabled={sending || !hydrated}
								aria-busy={sending}
								data-testid="contact-submit"
							>
								<span class="opacity-60">~ $</span>
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

						<!-- Booking escape hatch (homework #21 batch): prefer a call over a
						     message. Orange mono link-row; the submit above stays the page's
						     only conversion-yellow element (Round 5c doctrine). -->
						<div class="mt-1 flex flex-wrap items-center gap-2 font-mono text-caption">
							<span class="text-[var(--secondary-foreground)]">{resolveLocale(contactPage.formTerminal.bookingPrompt, locale)}</span>
							<a
								href="https://cal.com/yesid-dev"
								target="_blank"
								rel="noopener"
								data-testid="contact-booking-link"
								class="tap-feedback rounded px-1 py-0.5 text-[var(--primary)] transition-colors duration-200 hover:bg-primary/15"
							>
								<span class="opacity-60">~ $</span>
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
										.replace('{work}', `<a href="${localizeHref('/services', locale)}" class="tap-feedback text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent-text)] active:text-[var(--accent-text)] transition-colors">${escapeHtml(workLinkLabel)}</a>`)
										.replace('{blog}', `<a href="${localizeHref('/blog', locale)}" class="tap-feedback text-[var(--primary)] underline underline-offset-2 hover:text-[var(--accent-text)] active:text-[var(--accent-text)] transition-colors">${escapeHtml(blogLinkLabel)}</a>`)}
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
						{resolveLocale(contactPage.success.resetLabel, locale)}
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
			/* Round 5: edge-title rule one step bolder, in lockstep with the
			   blog/projects listing layouts (same Recipe-4 rail voice). */
			grid-template-columns: auto 2px 1fr;
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
		/* Language-independent fit (receiver r2): the terminals keep their
		   capped size in EVERY locale; content taller than the pane (FR/ES
		   wrap longer than EN, and the info list grew) scrolls inside the
		   terminal body instead of clipping past the card. */
		.desktop-terminals :global([data-slot='terminal-chrome']) {
			height: 100%;
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
		.desktop-terminals :global([data-slot='terminal-chrome'] .terminal-body) {
			flex: 1 1 auto;
			min-height: 0;
			overflow-y: auto;
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
			/* COMPUTED fit (operator spec 2026-07-03, rotated-title-fit.ts):
			   the rendered label is measured and sized to exactly fill the
			   edge column's height, capped at the 13rem design max: as big as
			   possible, zero overflow. The var fallback only covers first
			   paint before hydration measures. */
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

	/* ═══ Resize Handle ═══
	   Taste round 2: the grab bar between the two terminals is a real
	   delimitation — visible border tone idle (var(--card) was invisible on
	   both boards), full route-set orange on hover. */
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
