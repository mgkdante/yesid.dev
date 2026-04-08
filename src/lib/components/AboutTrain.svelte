<!--
  Train micro-widget — stopless, fun, interactive.
  A tiny metro train that loops on a circular track.
  Drag to move it manually. Respects reduced motion.
  No stop label — this card is pure delight.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	let canvas: HTMLCanvasElement | undefined = $state();
	let animId: number | undefined;
	let angle = 0;
	let isDragging = false;
	let dragAngle = 0;

	// Track params
	const SIZE = 120;
	const CENTER = SIZE / 2;
	const RADIUS = 36;
	const TRAIN_SIZE = 10;
	const SPEED = 0.008;

	function draw(ctx: CanvasRenderingContext2D) {
		ctx.clearRect(0, 0, SIZE, SIZE);

		// Track circle (dashed)
		ctx.beginPath();
		ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
		ctx.strokeStyle = 'rgba(224, 120, 0, 0.15)';
		ctx.lineWidth = 1.5;
		ctx.setLineDash([4, 4]);
		ctx.stroke();
		ctx.setLineDash([]);

		// Station dots (4 at compass points)
		for (let i = 0; i < 4; i++) {
			const a = (Math.PI / 2) * i;
			const x = CENTER + Math.cos(a) * RADIUS;
			const y = CENTER + Math.sin(a) * RADIUS;
			ctx.beginPath();
			ctx.arc(x, y, 2.5, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(224, 120, 0, 0.3)';
			ctx.fill();
		}

		// Train position
		const trainX = CENTER + Math.cos(angle) * RADIUS;
		const trainY = CENTER + Math.sin(angle) * RADIUS;

		// Train glow
		const gradient = ctx.createRadialGradient(trainX, trainY, 0, trainX, trainY, TRAIN_SIZE * 2);
		gradient.addColorStop(0, 'rgba(224, 120, 0, 0.3)');
		gradient.addColorStop(1, 'transparent');
		ctx.fillStyle = gradient;
		ctx.fillRect(trainX - TRAIN_SIZE * 2, trainY - TRAIN_SIZE * 2, TRAIN_SIZE * 4, TRAIN_SIZE * 4);

		// Train body (rounded rect)
		const trainAngle = angle + Math.PI / 2; // perpendicular to track
		ctx.save();
		ctx.translate(trainX, trainY);
		ctx.rotate(trainAngle);
		ctx.beginPath();
		ctx.roundRect(-TRAIN_SIZE / 2, -TRAIN_SIZE * 0.8, TRAIN_SIZE, TRAIN_SIZE * 1.6, 2);
		ctx.fillStyle = '#E07800';
		ctx.fill();

		// Windows
		ctx.fillStyle = '#FFB627';
		ctx.fillRect(-2, -TRAIN_SIZE * 0.4, 4, 2.5);
		ctx.fillRect(-2, TRAIN_SIZE * 0.1, 4, 2.5);
		ctx.restore();
	}

	function loop() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!isDragging) {
			angle += SPEED;
		}
		draw(ctx);
		animId = requestAnimationFrame(loop);
	}

	function handlePointerDown(e: PointerEvent) {
		isDragging = true;
		updateDragAngle(e);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || !canvas) return;
		updateDragAngle(e);
	}

	function handlePointerUp() {
		isDragging = false;
	}

	function updateDragAngle(e: PointerEvent) {
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left - CENTER;
		const y = e.clientY - rect.top - CENTER;
		angle = Math.atan2(y, x);
	}

	onMount(() => {
		if (isPrefersReducedMotion()) return;
		// Guard: canvas may not be fully supported in test environments (jsdom)
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx || typeof ctx.setLineDash !== 'function') return;
		loop();
	});

	onDestroy(() => {
		if (animId !== undefined) {
			cancelAnimationFrame(animId);
		}
	});
</script>

<div
	class="bento-card relative flex h-full items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]"
	data-testid="about-train"
>
	<canvas
		bind:this={canvas}
		width={SIZE}
		height={SIZE}
		class="cursor-grab active:cursor-grabbing"
		style="touch-action: none;"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
	></canvas>
</div>
