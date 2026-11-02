<script lang="ts">
	import type { BlockEditorDoc } from '@repo/shared';
	import type { YouTubeVideo } from '#lib/utils/youtube.ts';
	import { collectProjectImages } from '#lib/projects/project-images.ts';
	import { setArticleMedia } from '#lib/media/article-media.svelte.ts';
	import MediaGallery from '../MediaGallery.svelte';
	import MediaLightbox from '../MediaLightbox.svelte';
	let { doc, videos = [] }: { doc: BlockEditorDoc; videos?: readonly YouTubeVideo[] } = $props();
	const images = $derived(collectProjectImages([doc]));
	const media = setArticleMedia(() => images, () => videos);
</script>

<MediaGallery kind="image" />
<MediaGallery kind="video" />
<MediaLightbox {media} />
