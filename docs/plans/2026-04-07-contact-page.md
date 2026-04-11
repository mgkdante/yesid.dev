# Contact Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/contact` as a dual-terminal page — info terminal (left) + form terminal (right) — extending the AboutCta terminal aesthetic to a full page.

**Architecture:** Single `ContactPage.svelte` component receives data from `contactContent` (data-driven, `LocalizedString`). Form uses client-side validation with inline errors. Success state uses a staggered reveal (setTimeout, ~150ms per line — GSAP timeline can replace later for polish). No backend — placeholder action until cloud infra slice.

**Tech Stack:** SvelteKit 2 + Svelte 5, TypeScript, Tailwind CSS v4, GSAP (`use:reveal` entrance), Vitest + @testing-library/svelte

**Design spec:** `docs/specs/2026-04-07-contact-page-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/lib/data/contact-page.ts` | `ContactContent` data object — all localized strings for info terminal, form terminal, validation, success |
| `src/lib/data/contact-page.test.ts` | Data layer tests — structure, required fields, LocalizedString keys |
| `src/lib/components/ContactPage.svelte` | Full contact page: dual terminal layout, form logic, validation, success state |
| `src/lib/components/ContactPage.test.ts` | Component tests — rendering, form fields, validation, success |
| `src/routes/contact/+page.svelte` | Route shell — `<svelte:head>` + `<ContactPage />` |
| `src/routes/contact/+page.server.ts` | Form action — server-side validation + Web3Forms email delivery |

### Modified Files

| File | Change |
|------|--------|
| `src/lib/data/types.ts` | Append `ContactContent` interface + sub-types |
| `src/lib/data/index.ts` | Add re-exports for contact types + data |

---

## Task 1: Contact Types

**Files:**
- Modify: `src/lib/data/types.ts` (append after `AboutContent`)

- [ ] **Step 1: Write the failing test**

Create `src/lib/data/contact-page.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { contactContent } from './contact-page.js';

describe('contactContent', () => {
	describe('stationLabel', () => {
		it('has en key', () => {
			expect(contactContent.stationLabel.en.length).toBeGreaterThan(0);
		});
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- --run src/lib/data/contact-page.test.ts`
Expected: FAIL — `contact-page.js` does not exist

- [ ] **Step 3: Add types to `types.ts`**

Append after the `AboutContent` interface (line ~288):

```typescript
// --- Contact page types ---

export interface ContactTerminalField {
	label: string;
	placeholder: LocalizedString;
}

export interface ContactInfoTerminal {
	title: string;
	command: string;
	status: LocalizedString;
	availability: LocalizedString;
	location: LocalizedString;
	responseTime: LocalizedString;
}

export interface ContactFormTerminal {
	title: string;
	command: string;
	commandOutput: LocalizedString;
	fields: {
		name: ContactTerminalField;
		email: ContactTerminalField;
		message: ContactTerminalField;
	};
	submitLabel: LocalizedString;
}

export interface ContactValidation {
	required: LocalizedString;
	invalidEmail: LocalizedString;
	errorSummary: LocalizedString;
}

export interface ContactSuccess {
	validating: LocalizedString;
	sending: LocalizedString;
	sent: LocalizedString;
	responseTime: LocalizedString;
	meanwhile: LocalizedString;
	resetLabel: LocalizedString;
}

export interface ContactContent {
	stationLabel: LocalizedString;
	infoTerminal: ContactInfoTerminal;
	formTerminal: ContactFormTerminal;
	validation: ContactValidation;
	success: ContactSuccess;
	socials: readonly { label: string; href: string; icon: string }[];
}
```

- [ ] **Step 4: Create `contact-page.ts` with content**

Create `src/lib/data/contact-page.ts`:

```typescript
import type { ContactContent } from './types.js';
import { siteMeta } from './meta.js';

export const contactContent: ContactContent = {
	stationLabel: { en: 'CONTACT — NEXT STOP: YOU' },

	infoTerminal: {
		title: 'yesid@mtl ~ /info',
		command: '$ yesid --info',
		status: { en: 'Available for projects' },
		availability: { en: 'Booking Q3 2026' },
		location: { en: 'Montreal, QC, Canada' },
		responseTime: { en: '~24h response time' },
	},

	formTerminal: {
		title: 'yesid@mtl ~ /contact',
		command: '$ yesid --contact',
		commandOutput: { en: 'Opening contact form...' },
		fields: {
			name: { label: 'name', placeholder: { en: 'Your name' } },
			email: { label: 'email', placeholder: { en: 'you@company.com' } },
			message: { label: 'message', placeholder: { en: 'Tell me about your project...' } },
		},
		submitLabel: { en: 'send --message →' },
	},

	validation: {
		required: { en: 'required — {field} cannot be empty' },
		invalidEmail: { en: 'invalid — enter a valid email address' },
		errorSummary: { en: '{count} errors — fix and retry' },
	},

	success: {
		validating: { en: 'Validating fields...' },
		sending: { en: 'Sending message...' },
		sent: { en: 'Message sent successfully!' },
		responseTime: { en: "I'll get back to you within 24h" },
		meanwhile: { en: 'Meanwhile, check out my {work} or {blog}' },
		resetLabel: { en: 'reset --form' },
	},

	socials: [
		{ label: 'Email', href: `mailto:${siteMeta.links.email}`, icon: 'email' },
		{ label: 'GitHub', href: siteMeta.links.github, icon: 'github' },
		{ label: 'LinkedIn', href: siteMeta.links.linkedin ?? '', icon: 'linkedin' },
	],
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `bun run test -- --run src/lib/data/contact-page.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/data/types.ts src/lib/data/contact-page.ts src/lib/data/contact-page.test.ts
git commit -m "feat(contact): add ContactContent types and data"
```

**STOP. Ask Yesid to verify before moving to Task 2.**

---

## Task 2: Full Data Layer Tests + Re-exports

**Files:**
- Modify: `src/lib/data/contact-page.test.ts`
- Modify: `src/lib/data/index.ts`

- [ ] **Step 1: Expand tests**

Replace `src/lib/data/contact-page.test.ts` with:

```typescript
import { describe, it, expect } from 'vitest';
import { contactContent } from './contact-page.js';

describe('contactContent', () => {
	describe('stationLabel', () => {
		it('has en key with CONTACT text', () => {
			expect(contactContent.stationLabel.en).toContain('CONTACT');
		});
	});

	describe('infoTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.infoTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.command).toContain('yesid');
		});

		it('has all LocalizedString fields with en key', () => {
			expect(contactContent.infoTerminal.status.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.availability.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.location.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.responseTime.en.length).toBeGreaterThan(0);
		});
	});

	describe('formTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.formTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.formTerminal.command).toContain('yesid');
		});

		it('has commandOutput with en key', () => {
			expect(contactContent.formTerminal.commandOutput.en.length).toBeGreaterThan(0);
		});

		it('has all three form fields with label and placeholder', () => {
			for (const key of ['name', 'email', 'message'] as const) {
				const field = contactContent.formTerminal.fields[key];
				expect(field.label.length).toBeGreaterThan(0);
				expect(field.placeholder.en.length).toBeGreaterThan(0);
			}
		});

		it('has submit label', () => {
			expect(contactContent.formTerminal.submitLabel.en.length).toBeGreaterThan(0);
		});
	});

	describe('validation', () => {
		it('has required message with {field} placeholder', () => {
			expect(contactContent.validation.required.en).toContain('{field}');
		});

		it('has invalidEmail message', () => {
			expect(contactContent.validation.invalidEmail.en.length).toBeGreaterThan(0);
		});

		it('has errorSummary with {count} placeholder', () => {
			expect(contactContent.validation.errorSummary.en).toContain('{count}');
		});
	});

	describe('success', () => {
		it('has all success messages with en key', () => {
			expect(contactContent.success.validating.en.length).toBeGreaterThan(0);
			expect(contactContent.success.sending.en.length).toBeGreaterThan(0);
			expect(contactContent.success.sent.en.length).toBeGreaterThan(0);
			expect(contactContent.success.responseTime.en.length).toBeGreaterThan(0);
			expect(contactContent.success.meanwhile.en.length).toBeGreaterThan(0);
			expect(contactContent.success.resetLabel.en.length).toBeGreaterThan(0);
		});

		it('meanwhile contains {work} and {blog} placeholders', () => {
			expect(contactContent.success.meanwhile.en).toContain('{work}');
			expect(contactContent.success.meanwhile.en).toContain('{blog}');
		});
	});

	describe('socials', () => {
		it('has at least 2 social links', () => {
			expect(contactContent.socials.length).toBeGreaterThanOrEqual(2);
		});

		it('every social has label, href, and icon', () => {
			for (const s of contactContent.socials) {
				expect(s.label.length).toBeGreaterThan(0);
				expect(s.href.length).toBeGreaterThan(0);
				expect(s.icon.length).toBeGreaterThan(0);
			}
		});

		it('email social uses mailto:', () => {
			const email = contactContent.socials.find((s) => s.icon === 'email');
			expect(email?.href).toMatch(/^mailto:/);
		});
	});
});
```

- [ ] **Step 2: Run tests**

Run: `bun run test -- --run src/lib/data/contact-page.test.ts`
Expected: All PASS

- [ ] **Step 3: Add re-exports to `index.ts`**

Add to end of `src/lib/data/index.ts`:

```typescript
// Contact page content (dual-terminal layout)
export { contactContent } from './contact-page.js';
```

Add `ContactContent, ContactInfoTerminal, ContactFormTerminal, ContactValidation, ContactSuccess, ContactTerminalField` to the type re-export line.

- [ ] **Step 4: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/contact-page.test.ts src/lib/data/index.ts
git commit -m "feat(contact): full data layer tests + re-exports"
```

**STOP. Ask Yesid to verify before moving to Task 3.**

---

## Task 3: ContactPage Component

**Files:**
- Create: `src/lib/components/ContactPage.svelte`

This is the main component. It contains both terminals, form state, validation, and the success state animation.

- [ ] **Step 1: Write the failing component test**

Create `src/lib/components/ContactPage.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import ContactPage from './ContactPage.svelte';

describe('ContactPage', () => {
	it('renders with data-testid page-contact', () => {
		render(ContactPage);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage);
		expect(screen.getByText(/CONTACT.*NEXT STOP/)).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test -- --run src/lib/components/ContactPage.test.ts`
Expected: FAIL — `ContactPage.svelte` does not exist

- [ ] **Step 3: Build `ContactPage.svelte`**

Create `src/lib/components/ContactPage.svelte`:

```svelte
<!--
  Contact page — dual terminal layout.
  Left: info terminal (status, location, social links).
  Right: form terminal (name, email, message).
  Success: GSAP typed sequence after submit.
-->
<script lang="ts">
	import { contactContent } from '$lib/data/contact-page.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { onMount } from 'svelte';

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

		// Build success sequence lines
		const lines = [
			{ text: `~ $ ${resolveLocale(c.formTerminal.submitLabel, 'en').replace(' →', '')}`, color: 'muted' },
			{ text: `→ ${resolveLocale(c.success.validating, 'en')}`, color: 'orange' },
			{ text: '✓ name: OK', color: 'green' },
			{ text: '✓ email: OK', color: 'green' },
			{ text: '✓ message: OK', color: 'green' },
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
		<div class="mb-2 flex items-center gap-2">
			<div class="h-2 w-2 rounded-full bg-[var(--brand-primary)]"></div>
			<span class="font-mono text-[10px] tracking-[2px] text-[var(--text-muted)]">
				{stationLabel}
			</span>
		</div>

		<!-- Hazard stripe top -->
		<div class="mb-6 h-[2px]" style="background:repeating-linear-gradient(90deg,var(--brand-primary) 0px,var(--brand-primary) 8px,transparent 8px,transparent 16px);" aria-hidden="true"></div>

		<!-- Dual terminals -->
		<div class="grid gap-4 md:grid-cols-[1fr_1.1fr]" use:reveal>

			<!-- INFO TERMINAL -->
			<div class="overflow-hidden rounded-lg border border-[var(--border)]" data-testid="contact-info-terminal">
				<!-- Title bar -->
				<div class="flex items-center gap-1.5 border-b border-[var(--border)] bg-[#1a1a1a] px-3 py-2">
					<div class="h-2 w-2 rounded-full bg-[#ff5f57]"></div>
					<div class="h-2 w-2 rounded-full bg-[#febc2e]"></div>
					<div class="h-2 w-2 rounded-full bg-[#28c840]"></div>
					<span class="ml-2 font-mono text-[10px] text-[var(--text-secondary)]">{c.infoTerminal.title}</span>
				</div>
				<!-- Body -->
				<div class="bg-[#141414] p-4 font-mono text-xs leading-relaxed">
					<div class="text-[var(--text-secondary)]">~ {c.infoTerminal.command}</div>

					<div class="mt-3 text-[10px] tracking-[1px] text-[var(--brand-primary)]">STATUS</div>
					<div class="text-[#28c840]">● {resolveLocale(c.infoTerminal.status, 'en')}</div>
					<div class="text-[var(--brand-accent)]">&nbsp;&nbsp;{resolveLocale(c.infoTerminal.availability, 'en')}</div>

					<div class="mt-3 text-[10px] tracking-[1px] text-[var(--brand-primary)]">LOCATION</div>
					<div class="text-[var(--text-secondary)]">&nbsp;&nbsp;{resolveLocale(c.infoTerminal.location, 'en')}</div>
					<div class="text-[var(--text-secondary)]">&nbsp;&nbsp;{resolveLocale(c.infoTerminal.responseTime, 'en')}</div>

					<div class="mt-3 text-[10px] tracking-[1px] text-[var(--brand-primary)]">CONNECT</div>
					{#each c.socials as social}
						<a
							href={social.href}
							target={social.icon === 'email' ? undefined : '_blank'}
							rel={social.icon === 'email' ? undefined : 'noopener noreferrer'}
							class="block cursor-pointer rounded-sm px-1 py-0.5 text-[var(--text-secondary)] transition-all duration-200 hover:bg-[rgba(224,120,0,0.15)] hover:text-[var(--text-primary)]"
							data-testid={`contact-social-${social.icon}`}
						>
							→ {social.href.replace('mailto:', '').replace('https://', '')}
						</a>
					{/each}

					<!-- Blinking cursor -->
					<div class="mt-3 flex items-center gap-1">
						<span class="text-[var(--text-secondary)]">~</span>
						<span class="inline-block h-3.5 w-[7px] animate-pulse bg-[var(--brand-primary)]"></span>
					</div>
				</div>
			</div>

			<!-- FORM TERMINAL -->
			<div class="overflow-hidden rounded-lg border border-[var(--border)]" data-testid="contact-form-terminal">
				<!-- Title bar -->
				<div class="flex items-center gap-1.5 border-b border-[var(--border)] bg-[#1a1a1a] px-3 py-2">
					<div class="h-2 w-2 rounded-full bg-[#ff5f57]"></div>
					<div class="h-2 w-2 rounded-full bg-[#febc2e]"></div>
					<div class="h-2 w-2 rounded-full bg-[#28c840]"></div>
					<span class="ml-2 font-mono text-[10px] text-[var(--text-secondary)]">{c.formTerminal.title}</span>
				</div>
				<!-- Body -->
				<div class="bg-[#141414] p-4 font-mono text-xs leading-relaxed">
					<div class="text-[var(--text-secondary)]">~ {c.formTerminal.command}</div>
					<div class="text-[var(--brand-primary)]">→ {resolveLocale(c.formTerminal.commandOutput, 'en')}</div>

					{#if !showSuccess}
						<!-- Form -->
						<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="mt-3 space-y-3">
							<!-- Name -->
							<div>
								<label for="contact-name" class="text-[var(--brand-primary)]">
									{c.formTerminal.fields.name.label}<span class="text-[var(--text-secondary)]">:</span>
								</label>
								<input
									id="contact-name"
									type="text"
									bind:value={name}
									placeholder={resolveLocale(c.formTerminal.fields.name.placeholder, 'en')}
									class="mt-1 w-full rounded border bg-[#0D0D0D] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[#555] focus:border-[var(--brand-primary)] {fieldBorderClass('name')}"
								/>
								{#if submitted && errors.name}
									<div class="mt-0.5 text-[11px] text-[#ff5f57]">✗ {errors.name}</div>
								{/if}
							</div>

							<!-- Email -->
							<div>
								<label for="contact-email" class="text-[var(--brand-primary)]">
									{c.formTerminal.fields.email.label}<span class="text-[var(--text-secondary)]">:</span>
								</label>
								<input
									id="contact-email"
									type="email"
									bind:value={email}
									placeholder={resolveLocale(c.formTerminal.fields.email.placeholder, 'en')}
									class="mt-1 w-full rounded border bg-[#0D0D0D] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[#555] focus:border-[var(--brand-primary)] {fieldBorderClass('email')}"
								/>
								{#if submitted && errors.email}
									<div class="mt-0.5 text-[11px] text-[#ff5f57]">✗ {errors.email}</div>
								{/if}
							</div>

							<!-- Message -->
							<div>
								<label for="contact-message" class="text-[var(--brand-primary)]">
									{c.formTerminal.fields.message.label}<span class="text-[var(--text-secondary)]">:</span>
								</label>
								<textarea
									id="contact-message"
									bind:value={message}
									placeholder={resolveLocale(c.formTerminal.fields.message.placeholder, 'en')}
									rows="4"
									class="mt-1 w-full resize-y rounded border bg-[#0D0D0D] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)] outline-none transition-colors duration-200 placeholder:text-[#555] focus:border-[var(--brand-primary)] {fieldBorderClass('message')}"
								></textarea>
								{#if submitted && errors.message}
									<div class="mt-0.5 text-[11px] text-[#ff5f57]">✗ {errors.message}</div>
								{/if}
							</div>

							<!-- Error summary -->
							{#if submitted && errorCount() > 0}
								<div class="text-[11px] text-[#ff5f57]">
									✗ {resolveLocale(c.validation.errorSummary, 'en').replace('{count}', String(errorCount()))}
								</div>
							{/if}

							<!-- Submit -->
							<div class="flex items-center gap-2 pt-1">
								<span class="text-[var(--text-secondary)]">~ $</span>
								<button
									type="submit"
									class="rounded bg-[var(--brand-primary)] px-5 py-2 font-mono text-xs font-semibold text-white shadow-lg shadow-[var(--brand-primary)]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--brand-primary-hover)] hover:shadow-[var(--brand-primary)]/40"
								>
									{resolveLocale(c.formTerminal.submitLabel, 'en')}
								</button>
							</div>
						</form>
					{:else}
						<!-- Success sequence -->
						<div class="mt-3 space-y-0.5" data-testid="contact-success">
							{#each successLines as line}
								{#if line.visible}
									<div class="{line.color === 'green'
										? 'text-[#28c840] font-semibold'
										: line.color === 'orange'
											? 'text-[var(--brand-primary)]'
											: line.color === 'accent'
												? 'text-[var(--brand-accent)]'
												: 'text-[var(--text-secondary)]'}">
										{#if line.text.includes('{work}')}
											→ {resolveLocale(c.success.meanwhile, 'en').split('{work}')[0]}<a href="/services" class="text-[var(--brand-primary)] underline">work</a>{resolveLocale(c.success.meanwhile, 'en').split('{work}')[1].split('{blog}')[0]}<a href="/blog" class="text-[var(--brand-primary)] underline">blog</a>
										{:else}
											{line.text}
										{/if}
									</div>
								{/if}
							{/each}

							<!-- Reset button -->
							{#if successLines.length > 0 && successLines[successLines.length - 1].visible}
								<div class="mt-3 flex items-center gap-2">
									<span class="text-[var(--text-secondary)]">~ $</span>
									<button
										type="button"
										onclick={handleReset}
										class="rounded border border-[#333] px-3 py-1 font-mono text-[10px] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
									>
										{resolveLocale(c.success.resetLabel, 'en')}
									</button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

		</div>

		<!-- Hazard stripe bottom -->
		<div class="mt-6 h-[2px]" style="background:repeating-linear-gradient(90deg,var(--brand-primary) 0px,var(--brand-primary) 8px,transparent 8px,transparent 16px);" aria-hidden="true"></div>
	</div>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test -- --run src/lib/components/ContactPage.test.ts`
Expected: PASS

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/ContactPage.svelte src/lib/components/ContactPage.test.ts
git commit -m "feat(contact): ContactPage dual-terminal component"
```

**STOP. Ask Yesid to verify on localhost before moving to Task 4.**

---

## Task 4: Full Component Tests

**Files:**
- Modify: `src/lib/components/ContactPage.test.ts`

- [ ] **Step 1: Expand component tests**

Replace `src/lib/components/ContactPage.test.ts` with:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ContactPage from './ContactPage.svelte';

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
		await fireEvent.click(submitBtn);

		// Should show error messages
		const errors = screen.getAllByText(/✗/);
		expect(errors.length).toBeGreaterThanOrEqual(3); // name, email, message + summary
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage);
		const emailInput = screen.getByLabelText(/email/i);
		const nameInput = screen.getByLabelText(/name/i);
		const messageInput = screen.getByLabelText(/message/i);

		await fireEvent.input(nameInput, { target: { value: 'Test' } });
		await fireEvent.input(emailInput, { target: { value: 'not-an-email' } });
		await fireEvent.input(messageInput, { target: { value: 'Hello' } });

		const submitBtn = screen.getByRole('button', { name: /send/i });
		await fireEvent.click(submitBtn);

		expect(screen.getByText(/invalid.*email/i)).toBeTruthy();
	});

	it('shows success state after valid submit', async () => {
		render(ContactPage);
		const nameInput = screen.getByLabelText(/name/i);
		const emailInput = screen.getByLabelText(/email/i);
		const messageInput = screen.getByLabelText(/message/i);

		await fireEvent.input(nameInput, { target: { value: 'Test User' } });
		await fireEvent.input(emailInput, { target: { value: 'test@example.com' } });
		await fireEvent.input(messageInput, { target: { value: 'Hello there' } });

		const submitBtn = screen.getByRole('button', { name: /send/i });
		await fireEvent.click(submitBtn);

		// Wait for typed sequence to complete (~150ms * 9 lines)
		await new Promise((r) => setTimeout(r, 2000));

		expect(screen.getByTestId('contact-success')).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run tests**

Run: `bun run test -- --run src/lib/components/ContactPage.test.ts`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/ContactPage.test.ts
git commit -m "test(contact): full component tests — validation, success, links"
```

**STOP. Ask Yesid to verify before moving to Task 5.**

---

## Task 5: Route Shell + Integration

**Files:**
- Create: `src/routes/contact/+page.svelte`

- [ ] **Step 1: Create route shell**

Create `src/routes/contact/+page.svelte`:

```svelte
<!-- /contact route: dual-terminal contact form -->
<script lang="ts">
	import ContactPage from '$lib/components/ContactPage.svelte';
</script>

<svelte:head>
	<title>Contact — yesid.</title>
	<meta name="description" content="Get in touch for freelance data engineering, database development, and digital infrastructure consulting." />
</svelte:head>

<ContactPage />
```

- [ ] **Step 2: Run full test suite**

Run: `bun run test -- --run`
Expected: All PASS — no regressions

- [ ] **Step 3: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/routes/contact/+page.svelte
git commit -m "feat(contact): add /contact route shell"
```

**STOP. Ask Yesid to verify both terminals on localhost:5173/contact — info links, form, validation, success sequence, mobile layout.**

---

## Task 6: Email Backend — Web3Forms

**Files:**
- Create: `src/routes/contact/+page.server.ts`
- Modify: `src/lib/components/ContactPage.svelte` (use SvelteKit form action)

Web3Forms free tier: 250 submissions/month, no npm package needed, just a POST with an access key.

- [ ] **Step 1: Create `+page.server.ts` with form action**

Create `src/routes/contact/+page.server.ts`:

```typescript
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types.js';

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const message = data.get('message')?.toString().trim() ?? '';

		// Server-side validation
		const errors: Record<string, string> = {};
		if (!name) errors.name = 'Name is required';
		if (!email) errors.email = 'Email is required';
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
		if (!message) errors.message = 'Message is required';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors, name, email, message });
		}

		// Send via Web3Forms
		const apiKey = env.WEB3FORMS_ACCESS_KEY;
		if (!apiKey) {
			console.error('WEB3FORMS_ACCESS_KEY not set');
			return fail(500, { errors: { form: 'Contact form is not configured. Please email directly.' }, name, email, message });
		}

		try {
			const res = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					access_key: apiKey,
					subject: `New contact from ${name} via yesid.dev`,
					from_name: name,
					email,
					message,
				}),
			});

			const result = await res.json();

			if (!result.success) {
				return fail(500, { errors: { form: 'Failed to send message. Please try again.' }, name, email, message });
			}
		} catch {
			return fail(500, { errors: { form: 'Failed to send message. Please try again.' }, name, email, message });
		}

		return { success: true };
	},
} satisfies Actions;
```

- [ ] **Step 2: Update `ContactPage.svelte` to use form action**

Update the component's `<script>` to accept form action data and wire up `enhance`:

Add to the script block:

```typescript
import { enhance } from '$app/forms';
import type { ActionData } from '../../routes/contact/$types.js';

let { form }: { form?: ActionData } = $props();
```

Update `handleSubmit` to work with progressive enhancement:
- On successful form action (`form?.success`), trigger the typed success sequence
- On failed form action (`form?.errors`), display server-side errors
- Keep client-side validation as the first gate (instant feedback)
- The `<form>` uses `method="POST"` with `use:enhance` for progressive enhancement

Modify the `<form>` tag:

```svelte
<form
  method="POST"
  use:enhance={() => {
    // Client-side validation first (instant)
    submitted = true;
    if (!validate()) return ({ cancel: true });

    // Let SvelteKit handle the POST
    return async ({ result, update }) => {
      if (result.type === 'success') {
        await playSuccessSequence();
      } else if (result.type === 'failure') {
        // Server returned errors — show them
        await update();
      }
    };
  }}
  class="mt-3 space-y-3"
>
```

Extract the success sequence into a `playSuccessSequence()` function (move from `handleSubmit`).

- [ ] **Step 3: Update route shell to pass form data**

Update `src/routes/contact/+page.svelte`:

```svelte
<!-- /contact route: dual-terminal contact form -->
<script lang="ts">
	import ContactPage from '$lib/components/ContactPage.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Contact — yesid.</title>
	<meta name="description" content="Get in touch for freelance data engineering, database development, and digital infrastructure consulting." />
</svelte:head>

<ContactPage {form} />
```

- [ ] **Step 4: Add `WEB3FORMS_ACCESS_KEY` to `.env`**

```bash
echo 'WEB3FORMS_ACCESS_KEY=your_key_here' >> .env
```

Get a free API key from https://web3forms.com — enter `contact@yesid.dev` as the receiving email.

- [ ] **Step 5: Run type check**

Run: `bun run check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/routes/contact/+page.server.ts src/lib/components/ContactPage.svelte src/routes/contact/+page.svelte
git commit -m "feat(contact): Web3Forms email backend + progressive enhancement"
```

**STOP. Ask Yesid to test the form submission (requires WEB3FORMS_ACCESS_KEY in .env).**

---

## Task 7: Nav Verification + TESTS.md

**Files:**
- Modify: `docs/reference/TESTS.md` (add contact test entries)

- [ ] **Step 1: Verify nav links**

Navigate to `/contact` via the nav bar. Confirm the link works. (Nav.svelte already has `/contact` in its `links` array — no code change needed.)

- [ ] **Step 2: Verify About CTA links to `/contact`**

Navigate to `/about`, scroll to CTA, click "Send message →". Confirm it navigates to `/contact`.

- [ ] **Step 3: Update `docs/reference/TESTS.md`**

Under `## Data Layer` add:

```markdown
### `src/lib/data/contact-page.test.ts`

| Test | What it validates | Key assertions |
|------|-------------------|----------------|
| stationLabel has en key | Station header text exists | `toContain('CONTACT')` |
| infoTerminal has title and command | Terminal chrome data | `toContain('yesid')` |
| infoTerminal all LocalizedString fields | All info strings localized | `.en.length > 0` |
| formTerminal has title and command | Form terminal chrome | `toContain('yesid')` |
| formTerminal has three fields | All form fields present | label + placeholder for name/email/message |
| validation required has {field} | Template placeholder exists | `toContain('{field}')` |
| validation errorSummary has {count} | Template placeholder exists | `toContain('{count}')` |
| success messages all have en key | All success strings present | `.en.length > 0` |
| meanwhile contains {work} and {blog} | Link placeholders exist | `toContain('{work}')` |
| socials has at least 2 links | Social links present | `.length >= 2` |
| email social uses mailto | Correct protocol | `toMatch(/^mailto:/)` |
```

Under `## Components` add:

```markdown
### `src/lib/components/ContactPage.test.ts`

| Test | What it validates | Key assertions |
|------|-------------------|----------------|
| renders page-contact testid | Component mounts | `getByTestId('page-contact')` |
| renders station label | Header visible | `getByText(/CONTACT.*NEXT STOP/)` |
| renders info terminal | Left terminal present | `getByTestId('contact-info-terminal')` |
| renders form terminal | Right terminal present | `getByTestId('contact-form-terminal')` |
| renders all three form fields | Form inputs exist | `getByLabelText` for name/email/message |
| renders submit button | CTA present | `getByRole('button', { name: /send/ })` |
| renders social links | All 3 socials | `getByTestId` for email/github/linkedin |
| email social uses mailto | Correct href | `getAttribute('href').toMatch(/mailto/)` |
| github opens in new tab | External link behavior | `getAttribute('target') === '_blank'` |
| shows validation errors on empty submit | Inline errors work | `getAllByText(/✗/).length >= 3` |
| shows invalid email error | Email validation | `getByText(/invalid.*email/)` |
| shows success state after valid submit | Typed sequence fires | `getByTestId('contact-success')` |
```

- [ ] **Step 4: Commit**

```bash
git add docs/reference/TESTS.md
git commit -m "docs: add contact page test entries to TESTS.md"
```

**STOP. Ask Yesid for final review of the contact page.**
