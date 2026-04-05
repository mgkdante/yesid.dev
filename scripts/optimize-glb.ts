/**
 * Optimize the stripped train GLB for web delivery.
 * Applies weld, simplify, quantize, dedup.
 */
import { NodeIO } from '@gltf-transform/core';
import { weld, quantize, dedup, simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;

const io = new NodeIO();
const doc = await io.read('src/lib/assets/montreal_metro_train.glb');

console.log('Applying optimizations...');

await doc.transform(
  // Merge duplicate vertices
  weld({ tolerance: 0.001 }),
  // Reduce polygon count (keep 50% of triangles - good balance)
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.01 }),
  // Deduplicate resources
  dedup(),
  // Reduce vertex data precision
  quantize(),
);

const root = doc.getRoot();
console.log(`Optimized: ${root.listNodes().length} nodes, ${root.listMeshes().length} meshes`);

await io.write('src/lib/assets/montreal_metro_train.glb', doc);

const file = Bun.file('src/lib/assets/montreal_metro_train.glb');
const sizeMB = (file.size / 1024 / 1024).toFixed(2);
console.log(`Final size: ${sizeMB} MB`);
