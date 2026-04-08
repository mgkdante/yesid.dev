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

	// --- Submit ---
	async function handleSubmit() {
		submitted = true;
		if (!validate()) return;

		// Build typed success sequence
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
			{ text: `→ ${resolveLocale(c.success.meanwhile, 'en')}`, color: 'muted' },
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

<div class="min-h-screen bg-[var(--bg-primary)]" data-testid="page-contact">
	<div class="mx-auto max-w-[1200px] px-4 py-6 md:px-8">

		<!-- Station header -->
		<div class="mb-4 flex items-center gap-2">
			<div class="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-primary)]"></div>
			<span class="font-mono text-[11px] tracking-[2px] text-[var(--text-secondary)]">{stationLabel}</span>
		</div>

		<!-- Hazard stripe top -->
		<div class="mb-4 h-[2px]" style="background:repeating-linear-gradient(-45deg,#E07800 0px,#E07800 6px,transparent 6px,transparent 12px);" aria-hidden="true"></div>

		<!-- Two-column terminal grid -->
		<div class="grid gap-4 md:grid-cols-[1fr_1.1fr]" use:reveal>

			<!-- ═══ INFO TERMINAL (left) ═══ -->
			<div
				class="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[var(--bg-surface)]"
				data-testid="contact-info-terminal"
			>
				<!-- Title bar -->
				<div class="flex items-center gap-1.5 border-b border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
					<div class="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
					<div class="h-3 w-3 rounded-full bg-[#febc2e]"></div>
					<div class="h-3 w-3 rounded-full bg-[#28c840]"></div>
					<span class="ml-2 font-mono text-[11px] text-[var(--text-secondary)]">{c.infoTerminal.title}</span>
				</div>

				<!-- Terminal body -->
				<div class="bg-[#141414] p-4 font-mono text-sm leading-relaxed">
					<!-- Command line -->
					<div class="mb-4 text-[var(--text-secondary)]">
						<span class="text-[var(--text-primary)]">~</span> {c.infoTerminal.command}
					</div>

					<!-- STATUS section -->
					<div class="mb-4">
						<div class="mb-1 text-[10px] uppercase tracking-[2px] text-[var(--brand-primary)]">{resolveLocale(c.infoTerminal.sectionLabels.status, 'en')}</div>
						<div class="flex items-center gap-2">
							<span class="text-[#28c840]">●</span>
							<span class="text-[var(--brand-accent)]">{resolveLocale(c.infoTerminal.status, 'en')}</span>
						</div>
						<div class="mt-1 pl-4 text-[12px] text-[var(--text-secondary)]">
							{resolveLocale(c.infoTerminal.availability, 'en')}
						</div>
					</div>

					<!-- LOCATION section -->
					<div class="mb-4">
						<div class="mb-1 text-[10px] uppercase tracking-[2px] text-[var(--brand-primary)]">{resolveLocale(c.infoTerminal.sectionLabels.location, 'en')}</div>
						<div class="text-[var(--text-secondary)]">{resolveLocale(c.infoTerminal.location, 'en')}</div>
						<div class="mt-1 text-[12px] text-[var(--text-muted)]">{resolveLocale(c.infoTerminal.responseTime, 'en')}</div>
					</div>

					<!-- CONNECT section -->
					<div class="mb-4">
						<div class="mb-2 text-[10px] uppercase tracking-[2px] text-[var(--brand-primary)]">{resolveLocale(c.infoTerminal.sectionLabels.connect, 'en')}</div>
						<div class="flex flex-col gap-1">
							{#each c.socials as social}
								<a
									href={social.href}
									data-testid="contact-social-{social.icon}"
									class="flex items-center gap-2 rounded px-2 py-1.5 text-[var(--text-primary)] transition-colors duration-200 hover:bg-[rgba(224,120,0,0.15)]"
									{...(social.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
								>
									<span class="text-[var(--brand-primary)]">→</span>
									<span class="text-[13px]">{social.href.replace(/^mailto:|^https?:\/\//, '')}</span>
								</a>
							{/each}
						</div>
					</div>

					<!-- Blinking cursor -->
					<div class="flex items-center gap-1">
						<span class="text-[var(--text-secondary)]">~</span>
						<span class="inline-block h-4 w-[7px] animate-pulse bg-[var(--brand-primary)]"></span>
					</div>
				</div>
			</div>

			<!-- ═══ FORM TERMINAL (right) ═══ -->
			<div
				class="overflow-hidden rounded-lg border border-[#2a2a2a] bg-[var(--bg-surface)]"
				data-testid="contact-form-terminal"
			>
				<!-- Title bar -->
				<div class="flex items-center gap-1.5 border-b border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2">
					<div class="h-3 w-3 rounded-full bg-[#ff5f57]"></div>
					<div class="h-3 w-3 rounded-full bg-[#febc2e]"></div>
					<div class="h-3 w-3 rounded-full bg-[#28c840]"></div>
					<span class="ml-2 font-mono text-[11px] text-[var(--text-secondary)]">{c.formTerminal.title}</span>
				</div>

				<!-- Terminal body -->
				<div class="bg-[#141414] p-4 font-mono text-sm leading-relaxed">
					<!-- Command + output -->
					<div class="mb-1 text-[var(--text-secondary)]">
						<span class="text-[var(--text-primary)]">~</span> {c.formTerminal.command}
					</div>
					<div class="mb-4 text-[12px] text-[var(--text-muted)]">
						{resolveLocale(c.formTerminal.commandOutput, 'en')}
					</div>

					{#if !showSuccess}
						<!-- ─── FORM ─── -->
						<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
							<div class="flex flex-col gap-4">

								<!-- Name field -->
								<div class="flex flex-col gap-1">
									<label for="contact-name" class="text-[12px] text-[var(--brand-primary)]">
										{c.formTerminal.fields.name.label}:
									</label>
									<input
										id="contact-name"
										type="text"
										bind:value={name}
										placeholder={resolveLocale(c.formTerminal.fields.name.placeholder, 'en')}
										class="rounded border bg-[#0D0D0D] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 {fieldBorderClass('name')}"
									/>
									{#if submitted && errors.name}
										<div class="text-[11px] text-[#ff5f57]">✗ {errors.name}</div>
									{/if}
								</div>

								<!-- Email field -->
								<div class="flex flex-col gap-1">
									<label for="contact-email" class="text-[12px] text-[var(--brand-primary)]">
										{c.formTerminal.fields.email.label}:
									</label>
									<input
										id="contact-email"
										type="email"
										bind:value={email}
										placeholder={resolveLocale(c.formTerminal.fields.email.placeholder, 'en')}
										class="rounded border bg-[#0D0D0D] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 {fieldBorderClass('email')}"
									/>
									{#if submitted && errors.email}
										<div class="text-[11px] text-[#ff5f57]">✗ {errors.email}</div>
									{/if}
								</div>

								<!-- Message field -->
								<div class="flex flex-col gap-1">
									<label for="contact-message" class="text-[12px] text-[var(--brand-primary)]">
										{c.formTerminal.fields.message.label}:
									</label>
									<textarea
										id="contact-message"
										bind:value={message}
										placeholder={resolveLocale(c.formTerminal.fields.message.placeholder, 'en')}
										rows="5"
										class="rounded border bg-[#0D0D0D] px-3 py-2 font-mono text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 resize-none {fieldBorderClass('message')}"
									></textarea>
									{#if submitted && errors.message}
										<div class="text-[11px] text-[#ff5f57]">✗ {errors.message}</div>
									{/if}
								</div>

								<!-- Error summary -->
								{#if submitted && errorCount() > 0}
									<div class="rounded border border-[#ff5f57]/30 bg-[#ff5f57]/10 px-3 py-2 text-[12px] text-[#ff5f57]">
										✗ {resolveLocale(c.validation.errorSummary, 'en').replace('{count}', String(errorCount()))}
									</div>
								{/if}

								<!-- Submit button -->
								<button
									type="submit"
									class="flex items-center gap-2 self-start rounded bg-[var(--brand-primary)] px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-[var(--brand-primary)]/20 transition-all duration-200 hover:bg-[var(--brand-primary-hover)] hover:-translate-y-0.5"
								>
									<span class="text-white/60">~ $</span>
									{resolveLocale(c.formTerminal.submitLabel, 'en')}
								</button>

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
												: 'text-[var(--text-secondary)]'} text-[13px]">
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
								class="mt-4 self-start rounded border border-[var(--border)] px-4 py-2 font-mono text-[12px] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
							>
								{resolveLocale(c.success.resetLabel, 'en')}
							</button>
						</div>
					{/if}

				</div>
			</div>

		</div>

		<!-- Hazard stripe bottom -->
		<div class="mt-4 h-[2px]" style="background:repeating-linear-gradient(-45deg,#E07800 0px,#E07800 6px,transparent 6px,transparent 12px);" aria-hidden="true"></div>

	</div>
</div>
