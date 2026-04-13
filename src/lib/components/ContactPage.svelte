<!--
  Contact page — dual terminal layout.
  Left: info terminal (status, location, social links).
  Right: form terminal (name, email, message).
  Success: typed sequence after submit.
-->
<script lang="ts">
	import { contactContent } from '$lib/data/contact-page.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import TerminalCursor from './TerminalCursor.svelte';
	import { BrandButton, TerminalChrome } from '$lib/components/brand';

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

		// Typed sequence — reveal each line with delay
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
		if (!submitted) return 'border-[#333]';
		if (errors[field]) return 'border-[#ff5f57]';
		return 'border-[#28c840]';
	}

	const stationLabel = resolveLocale(c.stationLabel, 'en');
</script>

<div class="bg-[var(--bg-primary)] pb-16" data-testid="page-contact">
	<div class="mx-auto max-w-5xl px-6">

		<!-- Page header (matches Work/Blog pattern) -->
		<div class="mb-8">
			<h1 class="font-heading text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
				Contact
			</h1>
			<p class="mt-1 font-mono text-xs text-[var(--brand-primary)]">
				{stationLabel}
			</p>
		</div>

		<!-- Two-column terminal grid -->
		<div class="grid gap-4 md:grid-cols-[2fr_5fr]" use:reveal>

			<!-- ═══ INFO TERMINAL (left) ═══ -->
			<TerminalChrome title={c.infoTerminal.title} data-testid="contact-info-terminal">
				<div class="font-mono text-sm leading-relaxed">
					<!-- Command line -->
					<div class="mb-4 text-[var(--text-secondary)]">
						<span class="text-[var(--text-primary)]">~</span> {c.infoTerminal.command}
					</div>

					<!-- LOCATION section -->
					<div class="mb-4">
						<div class="mb-1 text-caption uppercase tracking-[2px] text-[var(--brand-primary)]">{resolveLocale(c.infoTerminal.sectionLabels.location, 'en')}</div>
						<div class="text-[var(--text-secondary)]">{resolveLocale(c.infoTerminal.location, 'en')}</div>
						<div class="mt-1 text-caption text-[var(--text-muted)]">{resolveLocale(c.infoTerminal.responseTime, 'en')}</div>
					</div>

					<!-- CONNECT section -->
					<div class="mb-4">
						<div class="mb-2 text-caption uppercase tracking-[2px] text-[var(--brand-primary)]">{resolveLocale(c.infoTerminal.sectionLabels.connect, 'en')}</div>
						<div class="flex flex-col gap-1">
							{#each c.socials as social}
								<a
									href={social.href}
									data-testid="contact-social-{social.icon}"
									class="flex items-center gap-2 rounded px-2 py-1.5 text-[var(--text-primary)] transition-colors duration-200 hover:bg-brand-primary/15"
									{...(social.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
								>
									<span class="text-[var(--brand-primary)]">→</span>
									<span class="text-small">{social.href.replace(/^mailto:|^https?:\/\//, '')}</span>
								</a>
							{/each}
						</div>
					</div>

					<!-- Blinking cursor -->
					<div class="flex items-center gap-1">
						<span class="text-[var(--text-secondary)]">~</span>
						<TerminalCursor />
					</div>
				</div>
			</TerminalChrome>

			<!-- ═══ FORM TERMINAL (right) ═══ -->
			<TerminalChrome title={c.formTerminal.title} data-testid="contact-form-terminal">
				<div class="font-mono text-sm leading-relaxed">
					<!-- Command + output -->
					<div class="mb-1 text-[var(--text-secondary)]">
						<span class="text-[var(--text-primary)]">~</span> {c.formTerminal.command}
					</div>
					<div class="mb-4 text-caption text-[var(--text-muted)]">
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
									<label for="contact-name" class="text-caption text-[var(--brand-primary)]">
										{c.formTerminal.fields.name.label}:
									</label>
									<input
										id="contact-name"
										name="name"
										type="text"
										bind:value={name}
										placeholder={resolveLocale(c.formTerminal.fields.name.placeholder, 'en')}
										class="rounded border bg-[#0D0D0D] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 {fieldBorderClass('name')}"
									/>
									{#if submitted && errors.name}
										<div class="text-caption text-[#ff5f57]">✗ {errors.name}</div>
									{/if}
								</div>

								<!-- Email field -->
								<div class="flex flex-col gap-1">
									<label for="contact-email" class="text-caption text-[var(--brand-primary)]">
										{c.formTerminal.fields.email.label}:
									</label>
									<input
										id="contact-email"
										name="email"
										type="email"
										bind:value={email}
										placeholder={resolveLocale(c.formTerminal.fields.email.placeholder, 'en')}
										class="rounded border bg-[#0D0D0D] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 {fieldBorderClass('email')}"
									/>
									{#if submitted && errors.email}
										<div class="text-caption text-[#ff5f57]">✗ {errors.email}</div>
									{/if}
								</div>

								<!-- Message field -->
								<div class="flex flex-col gap-1">
									<label for="contact-message" class="text-caption text-[var(--brand-primary)]">
										{c.formTerminal.fields.message.label}:
									</label>
									<textarea
										id="contact-message"
										name="message"
										bind:value={message}
										placeholder={resolveLocale(c.formTerminal.fields.message.placeholder, 'en')}
										rows="6"
										class="rounded border bg-[#0D0D0D] px-4 py-3 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 resize-none {fieldBorderClass('message')}"
									></textarea>
									{#if submitted && errors.message}
										<div class="text-caption text-[#ff5f57]">✗ {errors.message}</div>
									{/if}
								</div>

								<!-- Server-level error (e.g. Web3Forms not configured) -->
								{#if submitted && errors.form}
									<div class="mt-0.5 text-caption text-[#ff5f57]">✗ {errors.form}</div>
								{/if}

								<!-- Error summary -->
								{#if submitted && errorCount() > 0}
									<div class="rounded border border-[#ff5f57]/30 bg-[#ff5f57]/10 px-3 py-2 text-caption text-[#ff5f57]">
										✗ {resolveLocale(c.validation.errorSummary, 'en').replace('{count}', String(errorCount()))}
									</div>
								{/if}

								<!-- Submit button -->
								<BrandButton variant="primary" size="sm" type="submit">
									<span class="opacity-60">~ $</span>
									{resolveLocale(c.formTerminal.submitLabel, 'en')}
								</BrandButton>

							</div>
						</form>

					{:else}
						<!-- ─── SUCCESS ─── -->
						<div data-testid="contact-success" class="flex flex-col gap-0.5">
							{#each successLines as line}
								{#if line.visible}
									<div class="{line.color === 'orange'
										? 'text-[var(--brand-primary)]'
										: line.color === 'green'
											? 'text-[#28c840]'
											: line.color === 'accent'
												? 'text-[var(--brand-accent)]'
												: 'text-[var(--text-secondary)]'} text-small">
										{#if line.color === 'muted' && line.text.includes('{work}') && line.text.includes('{blog}')}
											<!-- meanwhile line: parse {work} and {blog} into links -->
											{@html line.text
												.replace('{work}', '<a href="/services" class="text-[var(--brand-primary)] underline underline-offset-2 hover:text-[var(--brand-accent)] transition-colors">work</a>')
												.replace('{blog}', '<a href="/blog" class="text-[var(--brand-primary)] underline underline-offset-2 hover:text-[var(--brand-accent)] transition-colors">blog</a>')}
										{:else}
											{line.text}
										{/if}
									</div>
								{/if}
							{/each}

							<!-- Reset button -->
							<button
								onclick={handleReset}
								class="mt-4 self-start rounded border border-[var(--border)] px-4 py-2 font-mono text-caption text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
							>
								{resolveLocale(c.success.resetLabel, 'en')}
							</button>
						</div>
					{/if}

				</div>
			</TerminalChrome>

		</div>

	</div>
</div>
