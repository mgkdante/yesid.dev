<!--
  Contact page — full-bleed Recipe 4 Edge Title Grid.
  Rotated "Contact." edge title + accent line + resizable dual terminals.
  Info terminal (left): location, weather, local time, response time, social links.
  Form terminal (right): name, email, message + typed success sequence.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { contactContent } from '$lib/data/contact-page.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import { TerminalChrome } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { ResizablePaneGroup, ResizablePane, ResizableHandle } from '$lib/components/ui/resizable';
	import type { WeatherData } from '$lib/data/weather.js';

	let {
		weather = null,
	}: {
		weather?: WeatherData | null;
	} = $props();

	const c = contactContent;

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
	});

	onDestroy(() => {
		if (timeInterval) clearInterval(timeInterval);
	});

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
		<!-- Station label (mobile heading + desktop subtitle) -->
		<h1 class="sr-only">Contact</h1>
		<div class="mb-6 font-mono text-caption uppercase tracking-[2px] text-[var(--muted-foreground)]">
			NEXT STOP: YOU
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
		<div class="font-mono text-body leading-relaxed">
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
				{#if localTime}
					<div class="mt-0.5 text-caption text-[var(--muted-foreground)]">
						{localTime} — {resolveLocale(c.infoTerminal.responseTime, 'en')}
					</div>
				{:else}
					<div class="mt-1 text-caption text-[var(--muted-foreground)]">{resolveLocale(c.infoTerminal.responseTime, 'en')}</div>
				{/if}
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
		<div class="font-mono text-body leading-relaxed">
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
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('name')}"
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
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 {fieldBorderClass('email')}"
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
								class="rounded border bg-[var(--background)] px-4 py-3 font-mono text-body text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors duration-200 resize-none {fieldBorderClass('message')}"
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

	/* Mobile: resizable hidden, stacked visible */
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
			height: calc(100dvh - 5rem);
			writing-mode: vertical-rl;
			transform: rotate(180deg);
			padding: 1rem 0.5rem;
		}
		.edge-title {
			font-family: var(--font-heading);
			/* "Contact." = ~8 chars, divide available height to fill the column */
			font-size: calc((100dvh - 5rem) / 7.5);
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
</style>
