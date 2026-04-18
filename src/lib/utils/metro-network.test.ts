import { describe, it, expect } from 'vitest';
import { nodes, connections, ORIGIN_NODE_ID, getNode } from './metro-network.js';

describe('metro-network data integrity', () => {
	it('origin node exists', () => {
		const origin = getNode(ORIGIN_NODE_ID);
		expect(origin).toBeDefined();
		expect(origin!.type).toBe('hub');
	});

	it('has no duplicate node IDs', () => {
		const ids = nodes.map((n) => n.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('all connection from/to IDs reference existing nodes', () => {
		const ids = new Set(nodes.map((n) => n.id));
		for (const conn of connections) {
			expect(ids.has(conn.from), `"${conn.from}" not in nodes`).toBe(true);
			expect(ids.has(conn.to), `"${conn.to}" not in nodes`).toBe(true);
		}
	});

	it('all node coordinates are in 0-100 range', () => {
		for (const node of nodes) {
			expect(node.x, `${node.id}.x`).toBeGreaterThanOrEqual(0);
			expect(node.x, `${node.id}.x`).toBeLessThanOrEqual(100);
			expect(node.y, `${node.id}.y`).toBeGreaterThanOrEqual(0);
			expect(node.y, `${node.id}.y`).toBeLessThanOrEqual(100);
		}
	});

	it('all connection order values are positive integers', () => {
		for (const conn of connections) {
			expect(Number.isInteger(conn.order), `order for ${conn.from}->${conn.to}`).toBe(true);
			expect(conn.order, `order for ${conn.from}->${conn.to}`).toBeGreaterThan(0);
		}
	});

	it('has 40+ nodes (dense network)', () => {
		expect(nodes.length).toBeGreaterThanOrEqual(40);
	});

	it('has 6+ line segments', () => {
		expect(connections.length).toBeGreaterThanOrEqual(6);
	});

	it('getNode returns undefined for missing ID', () => {
		expect(getNode('nonexistent')).toBeUndefined();
	});
});
