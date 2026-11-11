// Inlined before the app bundle, while server-rendered reading surfaces are usable.
(() => {
	window.addEventListener('click', (event) => {
		if (document.documentElement.hasAttribute('data-hydrated') || event.defaultPrevented ||
			event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		const link = event.target instanceof Element
			? event.target.closest('a[data-slot="language-toggle"][data-sveltekit-reset="false"]') : null;
		if (!(link instanceof HTMLAnchorElement) || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
		const destination = new URL(link.href, location.href);
		if (destination.origin !== location.origin || destination.pathname === location.pathname) return;
		const sections = [...document.querySelectorAll(
			'.sections-column [data-section-index], .sections.article-body > div > [data-toc], ' +
			'[data-testid="blog-sections"] > .blog-section-block',
		)].map((element) => {
			const box = element.getBoundingClientRect();
			const body = element.querySelector('[data-slot="collapsible-content"]');
			const bodyBox = body?.getBoundingClientRect();
			return { top: box.top, bottom: box.bottom, height: box.height, width: box.width,
				body: body && bodyBox ? { top: bodyBox.top, bottom: bodyBox.bottom, open: !body.hasAttribute('inert') } : undefined };
		}).filter((box) => box.height > 0 && box.width > 0);
		try {
			sessionStorage.setItem('yesid:early-locale', JSON.stringify({
				v: 1, to: destination.href, ts: Date.now(),
				measurement: { sections, viewportHeight: innerHeight, y: scrollY,
					bulkExpanded: document.documentElement.dataset.sectionsChoice === 'expanded' },
			}));
		} catch { /* Storage restrictions must not prevent the native language link. */ }
	});
})();
