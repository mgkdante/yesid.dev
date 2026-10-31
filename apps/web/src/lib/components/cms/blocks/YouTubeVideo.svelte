<script lang="ts">
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { youtubeLabels, type YouTubeVideo } from '#lib/utils/youtube.ts';

	let { video, active = false }: { video: YouTubeVideo; active?: boolean } = $props();
	const locale = getLocale();
	const labels = $derived(youtubeLabels[locale]);
	let playingId = $state('');
</script>

<div class="youtube-video" class:youtube-video--active={active} data-testid="youtube-video">
	{#if active || playingId === video.id}
		<iframe
			src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1`}
			title={video.caption || labels.title}
			allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
			allowfullscreen
			referrerpolicy="strict-origin-when-cross-origin"
			onload={(event) => { if (!active && event.currentTarget instanceof HTMLIFrameElement) event.currentTarget.focus(); }}
		></iframe>
	{:else}
		<button type="button" class="youtube-video__preview" aria-label={`${labels.play}: ${video.caption || labels.title}`} onclick={() => { playingId = video.id; }}>
			<img src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
			<span class="youtube-video__play" aria-hidden="true">▶</span>
		</button>
	{/if}
</div>

<style>
	.youtube-video { width: 100%; min-width: 0; }
	.youtube-video iframe,
	.youtube-video__preview { display: block; width: 100%; aspect-ratio: 16 / 9; min-height: 200px; border: 0; border-radius: var(--radius-md); background: #050505; }
	.youtube-video__preview { position: relative; overflow: hidden; padding: 0; cursor: pointer; }
	.youtube-video__preview img { display: block; width: 100%; height: 100%; margin: 0; object-fit: contain; }
	.youtube-video__play { position: absolute; inset: 0; display: grid; place-items: center; font-size: 3rem; color: #fff; text-shadow: 0 2px 12px #000; }
	.youtube-video__preview:focus-visible { outline: 3px solid var(--ring); outline-offset: 3px; }
	.youtube-video--active { padding-top: 3.5rem; }
	.youtube-video--active iframe { max-height: calc(90dvh - 7rem); }
</style>
