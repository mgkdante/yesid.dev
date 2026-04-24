/**
 * Strip the Montreal Metro GLB to train-only and repaint with yesid. brand colors.
 *
 * Strategy:
 * - KEEP nodes where Y bounds are within [300, 1100] (the train cross-section)
 * - REMOVE everything else (station walls, ceiling, tracks, platform, infrastructure)
 * - REPAINT blue body -> brand orange (#E07800)
 * - REPAINT yellow accents -> brand yellow (#FFB627)
 * - Prune unused materials/textures to reduce file size
 */
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';

// Brand colors as sRGB [0-1] (matching existing convention in the model)
const BRAND_ORANGE: [number, number, number] = [0xe0 / 255, 0x78 / 255, 0x00 / 255]; // #E07800
const BRAND_YELLOW: [number, number, number] = [0xff / 255, 0xb6 / 255, 0x27 / 255]; // #FFB627

const io = new NodeIO();
const doc = await io.read('src/lib/assets/montreal_metro.glb');
const root = doc.getRoot();
const scene = root.listScenes()[0];
const sketchfabModel = scene.listChildren()[0]; // "Sketchfab_model"
const mainGroup = sketchfabModel?.listChildren()[0]; // "Collada visual scene group"

if (!mainGroup) {
  console.error('Could not find main group node');
  process.exit(1);
}

// --- Step 1: Identify and remove station nodes ---
const TRAIN_Y_MIN = 300;
const TRAIN_Y_MAX = 1100;

let removedCount = 0;
let keptCount = 0;

// Collect nodes to remove (can't modify while iterating)
const toRemove: any[] = [];

for (const node of mainGroup.listChildren()) {
  const mesh = node.getMesh();
  if (!mesh) {
    toRemove.push(node); // Remove empty nodes
    continue;
  }

  // Compute Y bounds from vertex positions
  let minY = Infinity;
  let maxY = -Infinity;

  for (const prim of mesh.listPrimitives()) {
    const posAccessor = prim.getAttribute('POSITION');
    if (!posAccessor) continue;
    const positions = posAccessor.getArray();
    if (!positions) continue;

    for (let i = 1; i < positions.length; i += 3) {
      const y = positions[i];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  // Keep only nodes whose geometry is entirely within the train's Y cross-section
  if (minY >= TRAIN_Y_MIN && maxY <= TRAIN_Y_MAX) {
    keptCount++;
  } else {
    toRemove.push(node);
    removedCount++;
  }
}

console.log(`Removing ${removedCount} station nodes, keeping ${keptCount} train nodes`);

for (const node of toRemove) {
  node.dispose();
}

// --- Step 2: Repaint materials ---
// Map of material name -> new color
const repaintMap: Record<string, [number, number, number]> = {
  // Blue train body -> brand orange
  'Color_H10': BRAND_ORANGE,
  // Existing orange accent -> brand orange (consistent)
  'Color_C01': BRAND_ORANGE,
  // Yellow accents -> brand yellow
  'Color_D03': BRAND_YELLOW,  // Yellow stripe (#ffd660)
  'Color_D02': BRAND_YELLOW,  // Yellow line (#f4d000)
  'Color_D01_1': BRAND_YELLOW, // Yellow-gold (#ffbf00)
  // Orange detail -> brand orange
  'Color_B06': BRAND_ORANGE,  // (#f45500)
};

let repaintedCount = 0;

for (const mat of root.listMaterials()) {
  const name = mat.getName();
  const newColor = repaintMap[name];

  if (newColor) {
    const currentFactor = mat.getBaseColorFactor();
    const oldHex = rgbToHex(currentFactor[0], currentFactor[1], currentFactor[2]);
    mat.setBaseColorFactor([newColor[0], newColor[1], newColor[2], currentFactor[3]]);
    const newHex = rgbToHex(newColor[0], newColor[1], newColor[2]);
    console.log(`  Repainted "${name}": ${oldHex} -> ${newHex}`);
    repaintedCount++;
  }
}

console.log(`Repainted ${repaintedCount} materials`);

// --- Step 3: Clean up unused resources ---
console.log('Pruning unused resources...');
await doc.transform(
  prune(),  // Remove unused materials, textures, accessors
  dedup(),  // Deduplicate identical resources
);

const finalNodes = root.listNodes().length;
const finalMeshes = root.listMeshes().length;
const finalMaterials = root.listMaterials().length;
const finalTextures = root.listTextures().length;

console.log(`\nFinal model: ${finalNodes} nodes, ${finalMeshes} meshes, ${finalMaterials} materials, ${finalTextures} textures`);

// --- Step 4: Export ---
const outputPath = 'src/lib/assets/montreal_metro_train.glb';
await io.write(outputPath, doc);

// Check file size
const file = Bun.file(outputPath);
const sizeMB = (file.size / 1024 / 1024).toFixed(2);
console.log(`\nSaved to ${outputPath} (${sizeMB} MB)`);

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
