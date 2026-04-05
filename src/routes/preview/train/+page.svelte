<!--
  Preview page for the stripped & repainted metro train GLB.
  Visit /preview/train to see the result.
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let canvasEl: HTMLCanvasElement;

	let cleanup: (() => void) | undefined;

	onMount(() => {
		void init();
		return () => cleanup?.();
	});

	async function init() {
		const THREE = await import('three');
		const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
		const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#141414');

		const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 200000);
		camera.position.set(5000, 4000, 15000);

		const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true });
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1.2;

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.target.set(3000, 700, 600);

		// Lighting
		const ambient = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambient);

		const directional = new THREE.DirectionalLight(0xffffff, 1.2);
		directional.position.set(10000, 8000, 5000);
		scene.add(directional);

		const fill = new THREE.DirectionalLight(0xffffff, 0.4);
		fill.position.set(-5000, 3000, -3000);
		scene.add(fill);

		// Load train model
		const loader = new GLTFLoader();
		loader.load('/src/lib/assets/montreal_metro_train.glb', (gltf) => {
			scene.add(gltf.scene);

			// Auto-center camera on model
			const box = new THREE.Box3().setFromObject(gltf.scene);
			const center = box.getCenter(new THREE.Vector3());
			const size = box.getSize(new THREE.Vector3());

			controls.target.copy(center);
			camera.position.set(
				center.x + size.x * 0.3,
				center.y + size.y * 1.5,
				center.z + size.z * 4
			);
			controls.update();
		});

		// Resize handler
		const onResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onResize);

		// Render loop
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		cleanup = () => {
			window.removeEventListener('resize', onResize);
			renderer.dispose();
		};
	}
</script>

<div class="fixed inset-0 z-50 bg-[#141414]">
	<canvas bind:this={canvasEl} class="h-full w-full"></canvas>

	<div class="absolute left-4 top-4 z-10 rounded-lg bg-black/70 p-4 backdrop-blur">
		<h2 class="text-sm font-bold text-[#E07800]">Train Preview</h2>
		<p class="text-xs text-neutral-400">Stripped & repainted with brand colors</p>
		<p class="mt-2 text-xs text-neutral-500">Orbit: drag | Zoom: scroll | Pan: right-drag</p>
	</div>
</div>
