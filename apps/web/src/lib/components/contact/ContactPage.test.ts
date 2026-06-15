import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import ContactPage from './ContactPage.svelte';
// slice-18i Phase 7C: ContactPage now requires contactPage prop.
import { contactContent } from '$lib/content/contact-page';
// slice-34.3: the orchestrator's capture/apply API lets us drive the locale-switch
// round-trip at the unit level (registerSession is module-scoped; the component's
// persisted() fields register into the same registry on mount).
import { captureEntries, applyEntries } from '$lib/state/locale-handoff.svelte';

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
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	it('renders the station label', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getByText(/NEXT STOP: YOU/)).toBeTruthy();
	});

	it('renders info terminal', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		// Both desktop and mobile render the snippet, so 2 instances
		const terminals = screen.getAllByTestId('contact-info-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('renders form terminal', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const terminals = screen.getAllByTestId('contact-form-terminal');
		expect(terminals.length).toBeGreaterThanOrEqual(1);
	});

	it('renders all three form fields', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		// Labels appear twice (desktop + mobile), so use getAllByLabelText
		expect(screen.getAllByLabelText(/^name/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^email/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByLabelText(/^message/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders submit button', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const buttons = screen.getAllByRole('button', { name: /send/i });
		expect(buttons.length).toBeGreaterThanOrEqual(1);
	});

	it('renders social links', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		expect(screen.getAllByTestId('contact-social-email').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-github').length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByTestId('contact-social-linkedin').length).toBeGreaterThanOrEqual(1);
	});

	it('email social uses mailto link', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const emailLinks = screen.getAllByTestId('contact-social-email');
		expect(emailLinks[0].getAttribute('href')).toMatch(/^mailto:/);
	});

	it('github social opens in new tab', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const ghLinks = screen.getAllByTestId('contact-social-github');
		expect(ghLinks[0].getAttribute('target')).toBe('_blank');
	});

	it('shows validation errors on empty submit', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		const errors = screen.getAllByText(/✗/);
		expect(errors.length).toBeGreaterThanOrEqual(3);
	});

	it('shows invalid email error for bad format', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test');
		await typeInto(emailInputs[0], 'not-an-email');
		await typeInto(messageInputs[0], 'Hello');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		expect(screen.getAllByText(/invalid.*email/i).length).toBeGreaterThanOrEqual(1);
	});

	it('shows success state after valid submit', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test User');
		await typeInto(emailInputs[0], 'test@example.com');
		await typeInto(messageInputs[0], 'Hello there');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);

		// Wait for typed sequence to complete (~150ms * 9 lines)
		await new Promise((r) => setTimeout(r, 2000));

		expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1);
	});

	// slice-29: the Tech Stack Engine hands off via /contact?bp=… — the decoded
	// blueprint arrives as initialMessage and pre-fills the message field.
	it('pre-fills the message field from initialMessage (blueprint handoff)', () => {
		const prefill =
			"I'm interested in something like A data dashboard built on SvelteKit, REST API, PostgreSQL, Docker.";
		render(ContactPage, {
			props: { contactPage: contactContent, initialMessage: prefill },
		});
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(messageInputs[0].value).toBe(prefill);
	});

	it('message field stays empty without initialMessage', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(messageInputs[0].value).toBe('');
	});

	it('displays weather when provided', () => {
		render(ContactPage, {
			props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
		});
		expect(screen.getAllByText(/12°C/).length).toBeGreaterThanOrEqual(1);
		expect(screen.getAllByText(/partly cloudy/i).length).toBeGreaterThanOrEqual(1);
	});

	it('renders without weather gracefully', () => {
		render(ContactPage, { props: { contactPage: contactContent, weather: null } });
		expect(screen.queryAllByText(/°C/).length).toBe(0);
		expect(screen.getByTestId('page-contact')).toBeTruthy();
	});

	// slice-28.1 (audit #20/#122): SSR-baked weather is CDN-stale; onMount
	// refreshes from /api/weather. Default setup.dom stub returns null (no
	// fresh data) — these tests override fetch to exercise both branches.
	it('refreshes weather from /api/weather on mount', async () => {
		const prevFetch = globalThis.fetch;
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ temp: 99, condition: 'fresh breeze', icon: '01d' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		) as typeof globalThis.fetch;
		try {
			render(ContactPage, {
				props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
			});
			await waitFor(() => {
				expect(screen.getAllByText(/99°C/).length).toBeGreaterThanOrEqual(1);
			});
			expect(screen.getAllByText(/fresh breeze/i).length).toBeGreaterThanOrEqual(1);
			expect(screen.queryAllByText(/12°C/).length).toBe(0);
		} finally {
			globalThis.fetch = prevFetch;
		}
	});

	it('keeps the SSR-baked weather when /api/weather fails', async () => {
		const prevFetch = globalThis.fetch;
		globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as typeof globalThis.fetch;
		try {
			render(ContactPage, {
				props: { contactPage: contactContent, weather: { temp: 12, condition: 'partly cloudy', icon: '02d' } }
			});
			// Give the rejected refresh a microtask turn to (not) apply.
			await new Promise((r) => setTimeout(r, 20));
			expect(screen.getAllByText(/12°C/).length).toBeGreaterThanOrEqual(1);
		} finally {
			globalThis.fetch = prevFetch;
		}
	});
});

// slice-34.3 — state across languages (the flagship contact surface).
// These assert the locale-handoff WIRING at the unit level: the three fields are
// persisted() (so a switch carries them), focus is keyed for restore, and a sent
// message can't resurrect. The full switch-restore animation (success re-shown in
// the new locale, restore-beats-?bp=) is covered by the Playwright spec, which
// drives the real beforeNavigate/afterNavigate orchestrator.
describe('ContactPage — state across languages (slice-34.3)', () => {
	beforeEach(() => {
		// Each persisted() field registers into the module-scoped registry on mount
		// and unregisters on the testing-library auto-unmount. Snapshot/clear any
		// stragglers so a leaked key from a prior test can't bleed into capture().
		applyEntries({}); // no-op, documents intent
	});

	it('the three inputs carry their stable data-handoff-focus keys', () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(nameInputs[0].getAttribute('data-handoff-focus')).toBe('contact-name');
		expect(emailInputs[0].getAttribute('data-handoff-focus')).toBe('contact-email');
		expect(messageInputs[0].getAttribute('data-handoff-focus')).toBe('contact-message');
	});

	it('registers name/email/message as session-scoped persisted state', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Ada');
		await typeInto(messageInputs[0], 'half-typed message');

		// The orchestrator can SEE the typed values via the registry — that's what
		// gets snapshotted into sessionStorage before a switch.
		const snap = captureEntries();
		expect(snap['contact-name']).toBe('Ada');
		expect(snap['contact-message']).toBe('half-typed message');
		// The persisted values are locale-free primitives (user text), never copy.
		expect(typeof snap['contact-message']).toBe('string');
	});

	it('restores a captured draft into a freshly-mounted form (the switch round-trip)', async () => {
		// First mount: type, then capture (the pre-switch snapshot).
		const first = render(ContactPage, { props: { contactPage: contactContent } });
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		await typeInto(messageInputs[0], 'carry me across the switch');
		const snap = captureEntries();
		first.unmount(); // {#key} remount destroys the old subtree

		// Second mount = the remounted page on the new locale. Apply the snapshot;
		// the persisted() fields pick it up through their registered setters.
		render(ContactPage, { props: { contactPage: contactContent } });
		applyEntries(snap);
		await tick();
		await tick();

		const restored = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(restored[0].value).toBe('carry me across the switch');
	});

	it('clears the persisted draft after a successful submit (no resurrection)', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test User');
		await typeInto(emailInputs[0], 'test@example.com');
		await typeInto(messageInputs[0], 'Hello there');

		const submitBtns = screen.getAllByRole('button', { name: /send/i });
		await submitForm(submitBtns[0]);
		// success animation fires (fetch is stubbed to success in setup.dom)
		await waitFor(() => expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1));

		// The persisted draft is now empty + the locale-free success flag is set, so
		// a subsequent switch carries an EMPTY form (the sent text can't come back)
		// while re-showing the success screen.
		const snap = captureEntries();
		expect(snap['contact-name']).toBe('');
		expect(snap['contact-email']).toBe('');
		expect(snap['contact-message']).toBe('');
		expect(snap['contact-success']).toBe(true);
	});

	it('handleReset clears the persisted draft and the success flag', async () => {
		render(ContactPage, { props: { contactPage: contactContent } });
		const nameInputs = screen.getAllByLabelText(/^name/i) as HTMLInputElement[];
		const emailInputs = screen.getAllByLabelText(/^email/i) as HTMLInputElement[];
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];

		await typeInto(nameInputs[0], 'Test User');
		await typeInto(emailInputs[0], 'test@example.com');
		await typeInto(messageInputs[0], 'Hello there');
		await submitForm(screen.getAllByRole('button', { name: /send/i })[0]);
		await waitFor(() => expect(screen.getAllByTestId('contact-success').length).toBeGreaterThanOrEqual(1));

		// "Send another" → reset back to a genuinely empty, non-success state.
		const resetBtns = screen.getAllByRole('button', { name: new RegExp(contactContent.success.resetLabel.en, 'i') });
		await fireEvent.click(resetBtns[0]);
		await tick();

		const snap = captureEntries();
		expect(snap['contact-success']).toBe(false);
		expect(snap['contact-message']).toBe('');
	});

	// slice-29 guard preserved under slice-34.3: the ?bp= prefill still lands when
	// NOT restoring (localeHandoff.restoring is false outside a switch).
	it('still pre-fills from initialMessage when not restoring', async () => {
		const prefill = "I'm interested in something like a SvelteKit dashboard.";
		render(ContactPage, { props: { contactPage: contactContent, initialMessage: prefill } });
		await tick();
		const messageInputs = screen.getAllByLabelText(/^message/i) as HTMLTextAreaElement[];
		expect(messageInputs[0].value).toBe(prefill);
	});
});
