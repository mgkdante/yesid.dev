import type { BlockEditorDoc } from '@repo/shared';

export type YouTubeVideo = { id: string; caption: string };

export const youtubeLabels = {
	en: { play: 'Play video', close: 'Close video', title: 'YouTube video', gallery: 'Videos', media: 'Images and videos' },
	fr: { play: 'Lire la vidéo', close: 'Fermer la vidéo', title: 'Vidéo YouTube', gallery: 'Vidéos', media: 'Images et vidéos' },
	es: { play: 'Reproducir video', close: 'Cerrar video', title: 'Video de YouTube', gallery: 'Videos', media: 'Imágenes y videos' },
};

/** Only a standalone URL or one complete anchor becomes a player. */
export function parseYouTubeParagraph(text: string): YouTubeVideo | null {
	const value = text.trim();
	const anchor = value.match(/^<a\b([^>]*)>([\s\S]*?)<\/a>$/i);
	const href = anchor?.[1].match(/(?:^|\s)href\s*=\s*(["'])(.*?)\1/i)?.[2];
	if (anchor && (!href || /<\/?a\b/i.test(anchor[2]))) return null;
	if (!anchor && /[\s<>]/.test(value)) return null;
	try {
		const url = new URL((href ?? value).replace(/&amp;/gi, '&'));
		if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
		let id: string | null = null;
		if (url.hostname === 'youtu.be') {
			id = url.pathname.match(/^\/([\w-]+)\/?$/)?.[1] ?? null;
		} else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
			id = url.pathname === '/watch'
				? url.searchParams.get('v')
				: url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)\/?$/)?.[1] ?? null;
		}
		if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
		const caption = anchor && !/[<>]/.test(anchor[2]) ? anchor[2].trim() : '';
		return { id, caption: caption === href || caption === value ? '' : caption };
	} catch {
		return null;
	}
}

/** Different share/watch URLs for one video produce one gallery preview. */
export function collectProjectVideos(docs: readonly BlockEditorDoc[]): YouTubeVideo[] {
	const videos = new Map<string, YouTubeVideo>();
	for (const doc of docs) {
		for (const block of doc.blocks) {
			if (block.type !== 'paragraph') continue;
			const video = parseYouTubeParagraph(block.data.text);
			if (!video) continue;
			const previous = videos.get(video.id);
			if (!previous || !previous.caption) videos.set(video.id, video);
		}
	}
	return [...videos.values()];
}
