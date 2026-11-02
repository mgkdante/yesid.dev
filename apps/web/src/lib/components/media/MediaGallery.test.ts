import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import type { BlockEditorDoc } from '@repo/shared';
import MediaHarness from './tests/MediaHarness.svelte';
import { siteLabels } from '#lib/content/site-labels.ts';

const doc: BlockEditorDoc = {
	time: 1700000000000,
	version: '2.31.2',
	blocks: ['Desktop', 'Mobile'].map((caption) => ({
		id: caption.toLowerCase(),
		type: 'image',
		data: {
			file: { url: `/images/${caption.toLowerCase()}.png`, fileURL: '', fileId: '' },
			caption,
			withBorder: true,
			withBackground: false,
			stretched: false,
		},
	})),
};

describe('MediaHarness keyboard access', () => {
	afterEach(async () => {
		cleanup();
		await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
	});

	it('opens real video previews in the existing dialog and restores focus when playback is dismissed', async () => {
		const { container } = render(MediaHarness, { props: { doc, videos: [{ id: 'M7lc1UVf-VE', caption: 'Actual walkthrough' }] } });
		expect(container.querySelector('iframe')).toBeNull();
		expect(screen.queryByText('Actual walkthrough')).toBeNull();
		const trigger = screen.getByTestId('project-video-gallery-trigger');
		expect(trigger.querySelector('img')).toHaveAttribute('src', 'https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg');
		trigger.focus();
		await fireEvent.click(trigger);
		const dialog = screen.getByRole('dialog', { name: 'Actual walkthrough' });
		expect(within(dialog).getByTitle('Actual walkthrough')).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&playsinline=1');
		expect(within(dialog).getByText('Actual walkthrough')).toBeVisible();
		const close = within(dialog).getByRole('button', { name: 'Close video' });
		await waitFor(() => expect(close).toHaveFocus());
		await fireEvent.keyDown(close, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		expect(document.querySelector('iframe')).toBeNull();
		await waitFor(() => expect(trigger).toHaveFocus());
	});

	it('shows no video previews unless the story supplies a video', () => {
		render(MediaHarness, { props: { doc } });
		expect(screen.queryByTestId('project-video-gallery-trigger')).toBeNull();
		expect(document.querySelector('iframe')).toBeNull();
	});

	it('focuses the image close control and returns to each opener after Escape', async () => {
		render(MediaHarness, { props: { doc } });
		const triggers = screen.getAllByTestId('project-image-gallery-trigger');
		const gallery = screen.getByTestId('project-image-gallery');
		expect(within(gallery).queryByText('Desktop')).not.toBeInTheDocument();
		expect(within(gallery).queryByText('Mobile')).not.toBeInTheDocument();

		for (const trigger of triggers) {
			trigger.focus();
			await fireEvent.click(trigger);
			const dialog = screen.getByRole('dialog');
			const caption = dialog.querySelector('.project-image-gallery__lightbox-caption')!;
			expect(caption).toBeVisible();
			expect(caption).toHaveTextContent(trigger.querySelector('img')!.alt);
			const image = within(dialog).getByTestId('project-image-gallery-lightbox-image');
			expect(image.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
			const close = within(dialog).getByRole('button', { name: siteLabels.a11y.projectImageClose.en });
			await waitFor(() => expect(close).toHaveFocus());
			await fireEvent.keyDown(close, { key: 'Escape' });
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			await waitFor(() => expect(trigger).toHaveFocus());
		}
		await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
	});

	it('traps forward and reverse Tab within the modal controls', async () => {
		render(MediaHarness, { props: { doc } });
		await fireEvent.click(screen.getAllByTestId('project-image-gallery-trigger')[0]!);
		const close = within(screen.getByRole('dialog')).getByRole('button', { name: siteLabels.a11y.projectImageClose.en });
		await waitFor(() => expect(close).toHaveFocus());

		const next = within(screen.getByRole('dialog')).getByRole('button', { name: 'Next' });
		for (const shiftKey of [false, true]) {
			const edge = shiftKey ? close : next;
			edge.focus();
			const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
			edge.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
			expect(shiftKey ? next : close).toHaveFocus();
		}
		await fireEvent.click(close);
		await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
		await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
	});

	it('restores its opener after backdrop and close-button dismissal on repeated opens', async () => {
		render(MediaHarness, { props: { doc } });
		const trigger = screen.getAllByTestId('project-image-gallery-trigger')[1]!;

		for (const dismiss of ['button', 'backdrop']) {
			trigger.focus();
			await fireEvent.click(trigger);
			const close = within(screen.getByRole('dialog')).getByRole('button', { name: siteLabels.a11y.projectImageClose.en });
			await waitFor(() => expect(close).toHaveFocus());
			await fireEvent.click(dismiss === 'button' ? close : screen.getByTestId('project-image-gallery-backdrop'));
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			await waitFor(() => expect(trigger).toHaveFocus());
		}
		await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
	});
	it.each(['image', 'video'] as const)('navigates %s siblings with buttons, arrows and horizontal swipes without wrapping', async (kind) => {
		render(MediaHarness, { props: { doc, videos: [{ id: 'M7lc1UVf-VE', caption: 'First video' }, { id: 'dQw4w9WgXcQ', caption: 'Second video' }] } });
		const triggers = screen.getAllByTestId(kind === 'image' ? 'project-image-gallery-trigger' : 'project-video-gallery-trigger');
		await fireEvent.click(triggers[0]!);
		const dialog = screen.getByRole('dialog');
		const previous = within(dialog).getByRole('button', { name: 'Previous' });
		const next = within(dialog).getByRole('button', { name: 'Next' });
		const counter = within(dialog).getByRole('status', { name: 'Position' });
		expect(counter).toHaveTextContent('1 / 2');
		expect(previous).toBeDisabled();
		await fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
		expect(counter).toHaveTextContent('1 / 2');
		await fireEvent.click(next);
		expect(counter).toHaveTextContent('2 / 2');
		expect(next).toBeDisabled();
		expect(previous).toBeEnabled();
		if (kind === 'image') expect(within(dialog).getByRole('img')).toHaveAttribute('alt', 'Mobile');
		else expect(within(dialog).getByTitle('Second video')).toHaveAttribute('src', expect.stringContaining('dQw4w9WgXcQ'));
		await fireEvent.keyDown(dialog, { key: 'ArrowRight' });
		expect(counter).toHaveTextContent('2 / 2');
		await fireEvent.click(previous);
		expect(counter).toHaveTextContent('1 / 2');
		await fireEvent.keyDown(dialog, { key: 'ArrowRight' });
		expect(counter).toHaveTextContent('2 / 2');
		await fireEvent.keyDown(dialog, { key: 'ArrowLeft' });
		expect(counter).toHaveTextContent('1 / 2');
		const swipe = async (dx: number, dy = 0) => {
			await fireEvent.touchStart(dialog, { touches: [{ clientX: 150, clientY: 150 }] });
			await fireEvent.touchEnd(dialog, { changedTouches: [{ clientX: 150 + dx, clientY: 150 + dy }] });
		};
		await swipe(-49);
		await swipe(-60, 100);
		expect(counter).toHaveTextContent('1 / 2');
		await swipe(-50);
		expect(counter).toHaveTextContent('2 / 2');
		await swipe(-100);
		expect(counter).toHaveTextContent('2 / 2');
		await swipe(50);
		expect(counter).toHaveTextContent('1 / 2');
		await fireEvent.click(within(dialog).getByRole('button', { name: kind === 'image' ? siteLabels.a11y.projectImageClose.en : 'Close video' }));
	});

});
