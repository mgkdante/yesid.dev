import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import type { BlockEditorDoc } from '@repo/shared';
import ProjectImageGallery from './ProjectImageGallery.svelte';

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

describe('ProjectImageGallery keyboard access', () => {
	it('focuses the image close control and returns to each opener after Escape', async () => {
		render(ProjectImageGallery, { props: { doc } });
		const triggers = screen.getAllByTestId('project-image-gallery-trigger');

		for (const trigger of triggers) {
			trigger.focus();
			await fireEvent.click(trigger);
			const dialog = screen.getByRole('dialog');
			const close = within(dialog).getByRole('button', { name: 'Close image' });
			await waitFor(() => expect(close).toHaveFocus());
			await fireEvent.keyDown(close, { key: 'Escape' });
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			await waitFor(() => expect(trigger).toHaveFocus());
		}
	});

	it('keeps forward and reverse Tab on the modal control rather than the next background image', async () => {
		render(ProjectImageGallery, { props: { doc } });
		await fireEvent.click(screen.getAllByTestId('project-image-gallery-trigger')[0]!);
		const close = within(screen.getByRole('dialog')).getByRole('button', { name: 'Close image' });
		await waitFor(() => expect(close).toHaveFocus());

		for (const shiftKey of [false, true]) {
			const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
			close.dispatchEvent(event);
			expect(event.defaultPrevented).toBe(true);
			expect(close).toHaveFocus();
		}
	});

	it('restores its opener after backdrop and close-button dismissal on repeated opens', async () => {
		render(ProjectImageGallery, { props: { doc } });
		const trigger = screen.getAllByTestId('project-image-gallery-trigger')[1]!;

		for (const dismiss of ['button', 'backdrop']) {
			trigger.focus();
			await fireEvent.click(trigger);
			const close = within(screen.getByRole('dialog')).getByRole('button', { name: 'Close image' });
			await waitFor(() => expect(close).toHaveFocus());
			await fireEvent.click(dismiss === 'button' ? close : screen.getByTestId('project-image-gallery-backdrop'));
			await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
			await waitFor(() => expect(trigger).toHaveFocus());
		}
	});
});
