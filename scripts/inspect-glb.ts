/**
 * Inspect the montreal_metro.glb to understand its scene graph.
 * Lists all nodes, meshes, materials, and their hierarchy.
 */
import { NodeIO } from '@gltf-transform/core';

const io = new NodeIO();
const doc = await io.read('src/lib/assets/montreal_metro.glb');
const root = doc.getRoot();

console.log('=== SCENE GRAPH ===\n');

// List all scenes
for (const scene of root.listScenes()) {
  console.log(`Scene: "${scene.getName()}"`);
  for (const child of scene.listChildren()) {
    printNode(child, 1);
  }
}

function printNode(node: any, depth: number) {
  const indent = '  '.repeat(depth);
  const mesh = node.getMesh();
  const meshName = mesh ? ` [Mesh: "${mesh.getName()}"]` : '';
  const childCount = node.listChildren().length;
  const translation = node.getTranslation();
  const scale = node.getScale();

  console.log(`${indent}Node: "${node.getName()}"${meshName} children=${childCount} pos=[${translation.map((v: number) => v.toFixed(2))}] scale=[${scale.map((v: number) => v.toFixed(2))}]`);

  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const mat = prim.getMaterial();
      if (mat) {
        const color = mat.getBaseColorFactor();
        const hex = rgbToHex(color[0], color[1], color[2]);
        console.log(`${indent}  Material: "${mat.getName()}" color=${hex} (rgba: ${color.map((v: number) => v.toFixed(3))})`);
      }
    }
  }

  for (const child of node.listChildren()) {
    printNode(child, depth + 1);
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

console.log('\n=== MATERIALS SUMMARY ===\n');
for (const mat of root.listMaterials()) {
  const color = mat.getBaseColorFactor();
  const hex = rgbToHex(color[0], color[1], color[2]);
  console.log(`"${mat.getName()}" → ${hex} alpha=${color[3].toFixed(2)} metallic=${mat.getMetallicFactor().toFixed(2)} roughness=${mat.getRoughnessFactor().toFixed(2)}`);
}

console.log('\n=== TEXTURES ===\n');
for (const tex of root.listTextures()) {
  console.log(`"${tex.getName()}" mime=${tex.getMimeType()} size=${tex.getImage()?.byteLength ?? 0} bytes`);
}

console.log(`\nTotal: ${root.listNodes().length} nodes, ${root.listMeshes().length} meshes, ${root.listMaterials().length} materials, ${root.listTextures().length} textures`);
