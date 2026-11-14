<!--
	The Montréal weather scene, drawn from sceneState(weather, now): seven layers
	composed at runtime over one landmark drawing (weather/places/*.svg).
	1 sky light from the sun's altitude   2 the sun or the moon, never both
	3 clouds in up to three depths        4 wind: drift, slant, lean
	5 precipitation by kind and intensity 6 atmosphere: fog, haze, smoke, dust
	7 season: foliage, snow, ice, steam; lit windows and city glow at night
	Purely decorative (aria-hidden); the card's text carries the information.
	Only transform and opacity animate. Reduced motion: a still frame of the same data.
-->
<script lang="ts">
	import { animationPaused } from '#lib/state/animation-pause.ts';
	import { PLACES, type WeatherPlaceId } from './weather-scene';
	import { loadPlace, placeSvg } from './weather/places';
	import type { SceneState } from './weather/scene-state';
	import { moonLitPath } from './weather/sky';
	import './weather/weather-scene.css';


	// Where the balise stands in each place (drawing units, foot on the ground).
	const BALISE: Record<WeatherPlaceId, readonly [number, number]> = {
		skyline: [228, 110],
		montroyal: [300, 100],
		oldport: [250, 104],
		oratoire: [205, 110],
		ring: [120, 110],
		laronde: [110, 107],
		metro: [60, 110],
		olympic: [240, 108],
		biosphere: [306, 104],
		bellcentre: [60, 108],
	};

	let {
		scene,
		place,
		reduced = false,
		pending = false,
		hidden = false,
	}: {
		scene: SceneState;
		place: WeatherPlaceId;
		reduced?: boolean;
		/** Before the browser knows the hour: draw nothing yet. */
		pending?: boolean;
		/** The page is in the background: hold every loop. */
		hidden?: boolean;
	} = $props();

	const uid = $props.id();

	// Drawings load on demand (the skyline ships with the page). Until a place has
	// arrived the last drawn one stays, so the card is never blank; the next place
	// in the rotation is fetched ahead.
	let loaded = $state(0);
	let shown = $state<WeatherPlaceId>('skyline');
	$effect(() => {
		const want = place;
		const next = PLACES[(PLACES.indexOf(want) + 1) % PLACES.length];
		if (placeSvg(want) !== undefined) shown = want;
		else
			void loadPlace(want).then(() => {
				loaded++;
				if (place === want) shown = want;
			});
		void loadPlace(next);
	});
	const drawing = (id: WeatherPlaceId) => {
		void loaded; // re-read once a drawing arrives
		return placeSvg(id) ?? '';
	};

	// Crossfade between places: keep the outgoing one for 700 ms (none under reduced motion).
	let previous = $state<WeatherPlaceId | null>(null);
	let last: WeatherPlaceId | undefined;
	$effect(() => {
		const current = shown;
		previous = last && last !== current && !reduced ? last : null;
		last = current;
		const timer = setTimeout(() => (previous = null), 700);
		return () => clearTimeout(timer);
	});

	// Rooftop steam on cold days: replace each marker with a plume leaning downwind.
	const PLUME = '<path class="wx-plume" d="M0 0c-2-3-1-6 2-7-1-4 3-7 6-5 2-3 7-2 7 2 3 0 5 3 3 6-2 2-6 2-8 0-2 3-7 3-9 0-1 2-1 3-1 4z"/>';
	function withSteam(svg: string, on: boolean, lean: number): string {
		return svg.replace(/<g class="wx-steam" transform="translate\(([-\d.]+) ([-\d.]+)\)"><\/g>/g, (_m, x, y) =>
			on ? `<g class="wx-steam" transform="translate(${x} ${y}) rotate(${lean}) scale(0.9)">${PLUME}</g>` : ''
		);
	}

	// Clouds: one cartoon shape at three depths. Each layer is a strip two cards
	// wide with the same clouds in both halves, so the drift loops seamlessly.
	const CLOUD_BODY = 'M8 34c-6 0-9-6-5-10-2-7 5-12 11-9 2-7 12-10 18-5 4-8 17-9 22-1 6-4 15-1 15 6 7-1 12 5 9 11 4 4 1 9-4 9z';
	const CLOUD_UNDER = 'M5 29c16 5 62 5 82 0 1 3-2 5-6 5H11c-3 0-5-2-6-5z';
	const LAYERS = [
		{ depth: 'far', speed: 1.6, clouds: [{ x: 6, y: 6, w: 20 }, { x: 50, y: 13, w: 16 }, { x: 78, y: 3, w: 15 }] },
		{ depth: 'mid', speed: 1.15, clouds: [{ x: 22, y: 16, w: 27 }, { x: 66, y: 22, w: 24 }] },
		{ depth: 'near', speed: 0.8, clouds: [{ x: 0, y: 25, w: 36 }, { x: 44, y: 31, w: 32 }, { x: 82, y: 23, w: 28 }] },
	] as const;
	const cloudLayers = $derived(
		LAYERS.slice(0, scene.clouds.layers).map((layer, i) => ({
			...layer,
			clouds: scene.clouds.band === 'few' && i === 0 ? layer.clouds.slice(0, 2) : layer.clouds,
		}))
	);

	// Precipitation: two tiled pattern layers (far and near), never thousands of nodes.
	const precipTile = $derived.by(() => {
		const { kind, intensity } = scene.precip;
		const n = intensity === 'heavy' ? 2 : intensity === 'moderate' ? 1 : 0;
		if (kind === 'snow') return { w: 60, h: 60, flakes: true, size: [1.1, 1.5, 2.1][n], count: [5, 8, 12][n], streak: 0 };
		if (kind === 'drizzle') return { w: 24, h: 40, flakes: false, size: 0.7, count: [4, 6, 9][n], streak: 5 };
		if (kind === 'sleet' || kind === 'freezing') return { w: 40, h: 70, flakes: true, size: 1.1, count: [5, 7, 10][n], streak: 10 };
		return { w: 30, h: 80, flakes: false, size: 1, count: [4, 7, 11][n], streak: [12, 15, 18][n] };
	});
	// Deterministic scatter inside one tile.
	const scatter = (count: number, w: number, h: number, seed: number) =>
		Array.from({ length: count }, (_, i) => ({ x: (((i * 37 + seed * 11) % 97) / 97) * w, y: (((i * 61 + seed * 29) % 89) / 89) * h }));
	const fallTime = $derived(
		scene.precip.kind === 'snow' ? 7 : scene.precip.kind === 'drizzle' ? 1.2 : scene.precip.intensity === 'heavy' ? 0.42 : 0.6
	);
	const PRECIP_LAYERS = [
		{ depth: 'far', seed: 1, scale: 0.7, speed: 1.35 },
		{ depth: 'near', seed: 2, scale: 1, speed: 1 },
	] as const;

	const playState = $derived($animationPaused || hidden ? 'paused' : 'running');
</script>

<div
	class="wx weather-scene"
	class:wx-pending={pending}
	data-place={shown}
	data-time={scene.dark ? 'night' : 'day'}
	data-phase={scene.phase}
	data-scene={scene.family}
	data-weather={scene.family}
	data-weather-night={scene.dark}
	data-clouds={scene.clouds.band}
	data-cloudtint={scene.clouds.tint}
	data-precip={scene.precip.kind}
	data-intensity={scene.precip.intensity}
	data-atmosphere={scene.atmosphere.kind}
	data-foliage={scene.foliage}
	data-snow={scene.snowCover}
	data-ice={scene.riverIce}
	data-light={scene.light}
	data-warm={scene.warmLight}
	style:--sky-top={scene.sky.top}
	style:--sky-horizon={scene.sky.horizon}
	style:--sky-glow={scene.sky.glow}
	style:--sky-glow-o={scene.sky.glowStrength}
	style:--city-glow={scene.cityGlow}
	style:--stars={scene.stars}
	style:--cl-dark={scene.clouds.dark}
	style:--veil={scene.atmosphere.veil}
	style:--far-fade={scene.atmosphere.farFade}
	style:--egg={scene.balise ? 'inline' : 'none'}
	style:--ambient-play-state={playState}
	aria-hidden="true"
>
	<!-- 1 Sky light -->
	<div class="wx-sky weather-sky"></div>

	<!-- Stars: two still tiled layers, bright and faint -->
	{#if scene.stars > 0}
		<svg class="wx-stars">
			<defs>
				<pattern id="{uid}-s1" width="137" height="91" patternUnits="userSpaceOnUse">
					<circle cx="12" cy="14" r=".9" /><circle cx="82" cy="30" r="1.1" /><circle cx="102" cy="64" r=".8" /><circle cx="44" cy="78" r=".9" />
				</pattern>
				<pattern id="{uid}-s2" width="89" height="67" patternUnits="userSpaceOnUse">
					<circle cx="20" cy="9" r=".5" /><circle cx="61" cy="22" r=".45" /><circle cx="33" cy="45" r=".5" /><circle cx="77" cy="57" r=".4" /><circle cx="5" cy="60" r=".45" />
				</pattern>
			</defs>
			<rect class="wx-stars-bright" width="100%" height="100%" fill="url(#{uid}-s1)" />
			<rect class="wx-stars-faint" width="100%" height="100%" fill="url(#{uid}-s2)" />
		</svg>
	{/if}

	<!-- 2 The sun or the moon, at its real position; never both -->
	{#if scene.body?.kind === 'sun'}
		<div class="wx-sun" data-body="sun" style:left="{scene.body.x}%" style:top="{scene.body.y}%"></div>
	{:else if scene.body?.kind === 'moon'}
		<svg class="wx-moon" viewBox="-12 -12 24 24" data-body="moon" style:left="{scene.body.x}%" style:top="{scene.body.y}%">
			<circle class="wx-moon-shine" r="10" />
			<path class="wx-moon-lit" d={moonLitPath(scene.body.fraction)} transform="rotate({scene.body.angle})" />
		</svg>
	{/if}

	<!-- 3 Clouds behind the place, 4 drifting with the wind -->
	<div class="wx-back">
		{#if scene.clouds.deck > 0}<div class="wx-deck" style:opacity={scene.clouds.deck}></div>{/if}
		{#each cloudLayers as layer (layer.depth)}
			<div class="wx-cloud-gust" class:wx-gusty={scene.wind.gust}>
				<div
					class="wx-cloud-layer wx-{layer.depth}"
					class:wx-low={scene.clouds.low}
					class:wx-ltr={scene.wind.lateral >= 0}
					style:--layer-drift="{Math.round(scene.wind.drift * layer.speed)}s"
				>
					{#each [0, 100] as offset (offset)}
						{#each layer.clouds as c, i (i)}
							<svg class="wx-cloud" viewBox="0 0 100 40" style:left="{(offset + c.x) / 2}%" style:top="{c.y}%" style:width="{c.w / 2}%">
								<path class="wx-cloud-body" d={CLOUD_BODY} />
								<path class="wx-cloud-under" d={CLOUD_UNDER} />
							</svg>
						{/each}
					{/each}
				</div>
			</div>
		{/each}
		{#if scene.thunder}
			<svg class="wx-bolt weather-bolt" viewBox="0 0 24 36"><path d="M13 0 L2 20 H9 L6 36 L22 12 H13 L18 0 Z" /></svg>
		{/if}
	</div>

	<!-- The place -->
	{#if previous}
		<svg class="wx-place wx-place-exit" viewBox="0 0 400 110" preserveAspectRatio="xMidYMax slice">
			{@html withSteam(drawing(previous), scene.steam, scene.wind.lean)}
		</svg>
	{/if}
	{#key shown}
		<svg class="wx-place weather-skyline" class:wx-place-enter={!reduced} viewBox="0 0 400 110" preserveAspectRatio="xMidYMax slice">
			{@html withSteam(drawing(shown), scene.steam, scene.wind.lean)}
			<g class="wx-egg" transform="translate({BALISE[shown][0]} {BALISE[shown][1]}) scale(0.6)">
				<path class="wx-bo" d="M-2.4-11h4.8v10h-4.8z" />
				<path class="wx-bw" d="M-2.4-10h4.8v1.3h-4.8zm0 3h4.8v1.3h-4.8zm0 3h4.8v1.3h-4.8z" />
				<path class="wx-bk" d="M-3.6-1.2h7.2V0h-7.2z" />
			</g>
		</svg>
	{/key}

	<!-- 5 Precipitation slanted by the wind, wet ground; 6 atmosphere -->
	<div class="wx-front">
		{#if scene.precip.kind !== 'none'}
			{#each PRECIP_LAYERS as layer (layer.depth)}
				<div
					class="wx-precip wx-{layer.depth}"
					class:wx-showers={scene.precip.showers}
					style:--slant="{scene.precip.slant}deg"
					style:--tile="{precipTile.h * layer.scale}px"
					style:--fall="{(fallTime * layer.speed).toFixed(2)}s"
				>
					<svg width="100%" height="100%">
						<defs>
							<pattern id="{uid}-p{layer.seed}" width={precipTile.w * layer.scale} height={precipTile.h * layer.scale} patternUnits="userSpaceOnUse">
								{#each scatter(precipTile.count, precipTile.w * layer.scale, precipTile.h * layer.scale, layer.seed) as p, i (i)}
									{#if precipTile.streak && !(precipTile.flakes && i % 2 === 0)}
										<line class="wx-streak" x1={p.x} y1={p.y} x2={p.x} y2={p.y + precipTile.streak * layer.scale} stroke-width={precipTile.size * layer.scale} />
									{:else}
										<circle class="wx-flake" cx={p.x} cy={p.y} r={precipTile.size * layer.scale * (precipTile.streak ? 0.8 : 1)} />
									{/if}
								{/each}
							</pattern>
						</defs>
						<rect width="100%" height="100%" fill="url(#{uid}-p{layer.seed})" />
					</svg>
				</div>
			{/each}
		{/if}
		{#if scene.precip.wet}<div class="wx-wet"></div>{/if}
		{#if scene.atmosphere.kind === 'fog' || scene.atmosphere.kind === 'mist'}
			<div class="wx-fogbank wx-fog-1"></div>
			<div class="wx-fogbank wx-fog-2"></div>
			<div class="wx-fogbank wx-fog-3"></div>
		{/if}
		{#if scene.atmosphere.veil > 0}<div class="wx-veil"></div>{/if}
		{#if scene.thunder}<div class="wx-flash weather-lightning"></div>{/if}
	</div>

	<!-- Soft scrims in the card colour behind the stop label, the words and the
	     pause icon: invisible over clear sky, they only quiet weather passing behind text. -->
	<div class="wx-scrim"></div>
</div>
