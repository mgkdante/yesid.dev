import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateToc, tocElement, onTocNavigate, observeActiveToc } from './toc';

afterEach(() => {
	document.body.innerHTML = '';
});

describe('TOC navigation targets', () => {
	it('lands a new fragment but leaves history restoration to the router', () => {
		document.body.innerHTML =
			'<div class="section-card"><button class="section-header">Heading</button><div inert><h3 id="nested">Nested</h3></div></div>';
		const trigger = document.querySelector<HTMLElement>('.section-header')!;
		trigger.scrollIntoView = vi.fn();
		onTocNavigate({
			type: 'enter',
			to: { url: new URL('https://example.test/project#nested') },
		});
		expect(trigger.scrollIntoView).toHaveBeenCalledOnce();
		onTocNavigate({
			type: 'popstate',
			to: { url: new URL('https://example.test/project#nested') },
		});
		onTocNavigate({
			type: 'link',
			to: { url: new URL('https://example.test/project#%invalid') },
		});
		expect(trigger.scrollIntoView).toHaveBeenCalledOnce();
	});
	it('lands an expanded nested heading and a closed ancestor trigger without changing state', () => {
		document.body.innerHTML =
			'<div data-section-index="2" class="section-card"><button class="section-header" aria-expanded="true">Heading</button><div class="section-body"><h3 id="readme-h-7">Nested heading</h3></div></div>';
		const heading = document.getElementById('readme-h-7')!;
		const trigger = document.querySelector<HTMLButtonElement>('.section-header')!;
		const headingScroll = vi.fn(),
			triggerScroll = vi.fn();
		heading.scrollIntoView = headingScroll;
		trigger.scrollIntoView = triggerScroll;
		navigateToc('readme-h-7');
		expect(headingScroll).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start',
		});
		document.querySelector('.section-body')!.setAttribute('inert', '');
		trigger.setAttribute('aria-expanded', 'false');
		navigateToc('readme-h-7');
		expect(triggerScroll).toHaveBeenCalledWith({
			behavior: 'smooth',
			block: 'start',
		});
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(headingScroll).toHaveBeenCalledTimes(1);
	});

	it('keeps section IDs stable and ignores missing targets', () => {
		document.body.innerHTML =
			'<div data-section-index="4"><button class="section-header">Section</button></div>';
		const trigger = document.querySelector<HTMLElement>('.section-header')!;
		trigger.scrollIntoView = vi.fn();
		expect(tocElement('section-4')).toBe(trigger.parentElement);
		navigateToc('section-4');
		expect(trigger.scrollIntoView).toHaveBeenCalledOnce();
		expect(() => navigateToc('missing')).not.toThrow();
	});
});

it('ignores canceled and download links and cancels pending corrections on history or another click', async () => {
	history.replaceState(null, '', '/#nested');
	document.body.innerHTML =
		'<main><div class="section-card" data-toc="card"><button class="section-header">Heading</button><div inert><h3 id="nested">Nested</h3></div></div><a href="#nested">Fragment</a><button id="other">Other action</button></main>';
	const trigger = document.querySelector<HTMLElement>('.section-header')!,
		link = document.querySelector('a')!;
	trigger.scrollIntoView = vi.fn();
	const cleanup = observeActiveToc(() => {});
	const frame = () => new Promise(requestAnimationFrame);
	const cancel = (event: Event) => event.preventDefault();
	link.addEventListener('click', cancel);
	link.click();
	await frame();
	expect(trigger.scrollIntoView).not.toHaveBeenCalled();
	link.removeEventListener('click', cancel);
	link.setAttribute('download', '');
	link.click();
	await frame();
	expect(trigger.scrollIntoView).not.toHaveBeenCalled();
	link.removeAttribute('download');
	// SvelteKit intercepts at the app root after main has seen content handlers.
	document.addEventListener('click', cancel);
	link.click();
	history.replaceState(null, '', '/#earlier');
	window.dispatchEvent(new PopStateEvent('popstate'));
	await frame();
	expect(trigger.scrollIntoView).not.toHaveBeenCalled();
	history.replaceState(null, '', '/#nested');
	link.click();
	window.dispatchEvent(new PopStateEvent('popstate', { state: { readingPosition: 750 } }));
	await frame();
	expect(trigger.scrollIntoView).not.toHaveBeenCalled();
	link.click();
	document.getElementById('other')!.click();
	await frame();
	expect(trigger.scrollIntoView).not.toHaveBeenCalled();
	link.click();
	await frame();
	expect(trigger.scrollIntoView).toHaveBeenCalledOnce();
	cleanup();
	document.removeEventListener('click', cancel);
	history.replaceState(null, '', '/');
});
