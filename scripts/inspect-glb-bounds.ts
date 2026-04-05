/**
 * Inspect GLB nodes with bounding boxes to help identify train vs station parts.
 */
import { NodeIO } from '@gltf-transform/core';

const io = new NodeIO();
const doc = await io.read('src/lib/assets/montreal_metro.glb');
const root = doc.getRoot();

interface NodeInfo {
  index: number;
  name: string;
  material: string;
  materialColor: string;
  vertexCount: number;
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

const nodes: NodeInfo[] = [];
let idx = 0;

const scene = root.listScenes()[0];
const mainGroup = scene.listChildren()[0]?.listChildren()[0]; // Collada visual scene group

if (!mainGroup) { console.log('No main group found'); process.exit(1); }

for (const node of mainGroup.listChildren()) {
  const mesh = node.getMesh();
  if (!mesh) { idx++; continue; }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let vertexCount = 0;
  let matName = '';
  let matColor = '';

  for (const prim of mesh.listPrimitives()) {
    const posAccessor = prim.getAttribute('POSITION');
    if (!posAccessor) continue;

    const positions = posAccessor.getArray();
    if (!positions) continue;

    vertexCount += positions.length / 3;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }

    const mat = prim.getMaterial();
    if (mat) {
      matName = mat.getName();
      const c = mat.getBaseColorFactor();
      const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
      matColor = `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
    }
  }

  nodes.push({
    index: idx,
    name: node.getName(),
    material: matName,
    materialColor: matColor,
    vertexCount,
    minX, maxX, minY, maxY, minZ, maxZ,
  });
  idx++;
}

// Sort by Z center (train should be along one axis)
nodes.sort((a, b) => {
  const aCenterZ = (a.minZ + a.maxZ) / 2;
  const bCenterZ = (b.minZ + b.maxZ) / 2;
  return aCenterZ - bCenterZ;
});

// Compute overall scene bounds
let sceneMinX = Infinity, sceneMaxX = -Infinity;
let sceneMinY = Infinity, sceneMaxY = -Infinity;
let sceneMinZ = Infinity, sceneMaxZ = -Infinity;
for (const n of nodes) {
  if (n.minX < sceneMinX) sceneMinX = n.minX;
  if (n.maxX > sceneMaxX) sceneMaxX = n.maxX;
  if (n.minY < sceneMinY) sceneMinY = n.minY;
  if (n.maxY > sceneMaxY) sceneMaxY = n.maxY;
  if (n.minZ < sceneMinZ) sceneMinZ = n.minZ;
  if (n.maxZ > sceneMaxZ) sceneMaxZ = n.maxZ;
}

console.log(`Scene bounds: X[${sceneMinX.toFixed(1)} to ${sceneMaxX.toFixed(1)}] Y[${sceneMinY.toFixed(1)} to ${sceneMaxY.toFixed(1)}] Z[${sceneMinZ.toFixed(1)} to ${sceneMaxZ.toFixed(1)}]`);
console.log(`Scene size: ${(sceneMaxX - sceneMinX).toFixed(1)} x ${(sceneMaxY - sceneMinY).toFixed(1)} x ${(sceneMaxZ - sceneMinZ).toFixed(1)}\n`);

// Group by material to spot patterns
const materialGroups = new Map<string, { count: number; indices: number[], sizeRange: string }>();
for (const n of nodes) {
  const key = `${n.material} (${n.materialColor})`;
  const existing = materialGroups.get(key) || { count: 0, indices: [], sizeRange: '' };
  existing.count++;
  existing.indices.push(n.index);
  materialGroups.set(key, existing);
}

console.log('=== MATERIAL GROUPS (by frequency) ===\n');
const sorted = [...materialGroups.entries()].sort((a, b) => b[1].count - a[1].count);
for (const [mat, info] of sorted) {
  console.log(`${mat}: ${info.count} nodes [indices: ${info.indices.join(',')}]`);
}

console.log('\n=== ALL NODES (sorted by Z) ===\n');
console.log('idx | name | material | color | verts | X range | Y range | Z range | sizeX | sizeY | sizeZ');
for (const n of nodes) {
  const sizeX = (n.maxX - n.minX).toFixed(1);
  const sizeY = (n.maxY - n.minY).toFixed(1);
  const sizeZ = (n.maxZ - n.minZ).toFixed(1);
  console.log(`${n.index} | ${n.name} | ${n.material} | ${n.materialColor} | ${n.vertexCount} | [${n.minX.toFixed(1)},${n.maxX.toFixed(1)}] | [${n.minY.toFixed(1)},${n.maxY.toFixed(1)}] | [${n.minZ.toFixed(1)},${n.maxZ.toFixed(1)}] | ${sizeX} | ${sizeY} | ${sizeZ}`);
}
