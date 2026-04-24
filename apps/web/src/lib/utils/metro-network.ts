// Metro network topology for the hero SVG animation.
// Dense, Montreal-inspired metro map: ~45 nodes, 4 line groups.
// Coordinates are percentages of the SVG viewBox (0-100).

export interface NetworkNode {
	id: string;
	x: number;
	y: number;
	type: 'hub' | 'station' | 'terminus';
	line: string;
}

export interface NetworkConnection {
	from: string;
	to: string;
	line: string;
	order: number;
}

export const ORIGIN_NODE_ID = 'berri';

// --- ORANGE LINE (U-shape: NW → south → SE → north → NE) ---
const orangeNodes: NetworkNode[] = [
	{ id: 'o-cvertu', x: 18, y: 32, type: 'terminus', line: 'orange' },
	{ id: 'o-college', x: 21, y: 32, type: 'station', line: 'orange' },
	{ id: 'o-savane', x: 24, y: 32, type: 'station', line: 'orange' },
	{ id: 'o-namur', x: 27, y: 32, type: 'station', line: 'orange' },
	{ id: 'o-plam', x: 30, y: 32, type: 'station', line: 'orange' },
	{ id: 'o-csc', x: 32, y: 31, type: 'station', line: 'orange' },
	{ id: 'snowdon', x: 34, y: 29, type: 'hub', line: 'orange' },
	{ id: 'o-villa', x: 33, y: 34, type: 'station', line: 'orange' },
	{ id: 'o-vendome', x: 31, y: 38, type: 'station', line: 'orange' },
	{ id: 'o-psh', x: 29, y: 42, type: 'station', line: 'orange' },
	{ id: 'lionel', x: 28, y: 47, type: 'hub', line: 'orange' },
	{ id: 'o-gv', x: 31, y: 51, type: 'station', line: 'orange' },
	{ id: 'o-lucien', x: 34, y: 55, type: 'station', line: 'orange' },
	{ id: 'o-bonav', x: 37, y: 58, type: 'station', line: 'orange' },
	{ id: 'o-sqvic', x: 40, y: 60, type: 'station', line: 'orange' },
	{ id: 'o-pda', x: 43, y: 61, type: 'station', line: 'orange' },
	{ id: 'o-cdm', x: 46, y: 60, type: 'station', line: 'orange' },
	{ id: 'berri', x: 50, y: 55, type: 'hub', line: 'orange' },
	{ id: 'o-sherb', x: 53, y: 50, type: 'station', line: 'orange' },
	{ id: 'o-mroyal', x: 55, y: 46, type: 'station', line: 'orange' },
	{ id: 'o-laurier', x: 57, y: 42, type: 'station', line: 'orange' },
	{ id: 'o-rosemont', x: 59, y: 38, type: 'station', line: 'orange' },
	{ id: 'o-beaubien', x: 61, y: 35, type: 'station', line: 'orange' },
	{ id: 'jean-talon', x: 63, y: 32, type: 'hub', line: 'orange' },
	{ id: 'o-jarry', x: 65, y: 29, type: 'station', line: 'orange' },
	{ id: 'o-cremazie', x: 67, y: 26, type: 'station', line: 'orange' },
	{ id: 'o-sauve', x: 69, y: 23, type: 'station', line: 'orange' },
	{ id: 'o-hb', x: 71, y: 20, type: 'station', line: 'orange' },
	{ id: 'o-cartier', x: 72, y: 17, type: 'station', line: 'orange' },
	{ id: 'o-concorde', x: 73, y: 14, type: 'station', line: 'orange' },
	{ id: 'o-montmo', x: 74, y: 11, type: 'terminus', line: 'orange' },
];

// --- GREEN LINE (E-W across the middle) ---
const greenNodes: NetworkNode[] = [
	{ id: 'g-angri', x: 5, y: 55, type: 'terminus', line: 'green' },
	{ id: 'g-monk', x: 9, y: 55, type: 'station', line: 'green' },
	{ id: 'g-joli', x: 12, y: 54, type: 'station', line: 'green' },
	{ id: 'g-verdun', x: 15, y: 53, type: 'station', line: 'green' },
	{ id: 'g-eglise', x: 18, y: 52, type: 'station', line: 'green' },
	{ id: 'g-lasalle', x: 21, y: 51, type: 'station', line: 'green' },
	{ id: 'g-charl', x: 24, y: 49, type: 'station', line: 'green' },
	// Lionel-Groulx shared with orange
	{ id: 'g-atwater', x: 32, y: 47, type: 'station', line: 'green' },
	{ id: 'g-guy', x: 35, y: 46, type: 'station', line: 'green' },
	{ id: 'g-peel', x: 38, y: 45, type: 'station', line: 'green' },
	{ id: 'g-mcgill', x: 41, y: 44, type: 'station', line: 'green' },
	{ id: 'g-pda', x: 44, y: 46, type: 'station', line: 'green' },
	{ id: 'g-stlaur', x: 47, y: 50, type: 'station', line: 'green' },
	// Berri-UQAM shared with orange
	{ id: 'g-beaudry', x: 54, y: 57, type: 'station', line: 'green' },
	{ id: 'g-papin', x: 58, y: 58, type: 'station', line: 'green' },
	{ id: 'g-front', x: 62, y: 58, type: 'station', line: 'green' },
	{ id: 'g-prefon', x: 66, y: 58, type: 'station', line: 'green' },
	{ id: 'g-joliette', x: 70, y: 57, type: 'station', line: 'green' },
	{ id: 'g-pieix', x: 74, y: 56, type: 'station', line: 'green' },
	{ id: 'g-viau', x: 78, y: 55, type: 'station', line: 'green' },
	{ id: 'g-assomp', x: 81, y: 54, type: 'station', line: 'green' },
	{ id: 'g-cadillac', x: 84, y: 53, type: 'station', line: 'green' },
	{ id: 'g-radisson', x: 87, y: 52, type: 'station', line: 'green' },
	{ id: 'g-hb', x: 91, y: 51, type: 'terminus', line: 'green' },
];

// --- BLUE LINE (E-W in the upper area) ---
const blueNodes: NetworkNode[] = [
	// Snowdon shared with orange
	{ id: 'b-cdn', x: 37, y: 27, type: 'station', line: 'blue' },
	{ id: 'b-udm', x: 40, y: 26, type: 'station', line: 'blue' },
	{ id: 'b-edouard', x: 43, y: 26, type: 'station', line: 'blue' },
	{ id: 'b-outre', x: 46, y: 27, type: 'station', line: 'blue' },
	{ id: 'b-acadie', x: 49, y: 28, type: 'station', line: 'blue' },
	{ id: 'b-parc', x: 52, y: 29, type: 'station', line: 'blue' },
	{ id: 'b-castel', x: 55, y: 30, type: 'station', line: 'blue' },
	// Jean-Talon shared with orange
	{ id: 'b-fabre', x: 66, y: 33, type: 'station', line: 'blue' },
	{ id: 'b-iber', x: 69, y: 34, type: 'station', line: 'blue' },
	{ id: 'b-stmichel', x: 72, y: 35, type: 'terminus', line: 'blue' },
];

// --- YELLOW LINE (short stub south from Berri) ---
const yellowNodes: NetworkNode[] = [
	// Berri shared with orange
	{ id: 'y-jd', x: 52, y: 65, type: 'station', line: 'yellow' },
	{ id: 'y-longueuil', x: 55, y: 73, type: 'terminus', line: 'yellow' },
];

export const nodes: readonly NetworkNode[] = [
	...orangeNodes,
	...greenNodes,
	...blueNodes,
	...yellowNodes,
] as const;

// Helper to build sequential connections along a line
function chain(ids: string[], line: string, startOrder: number): NetworkConnection[] {
	const result: NetworkConnection[] = [];
	for (let i = 0; i < ids.length - 1; i++) {
		result.push({
			from: ids[i],
			to: ids[i + 1],
			line,
			order: startOrder + Math.floor(i / 3), // group every 3 segments
		});
	}
	return result;
}

const orangeIds = orangeNodes.map((n) => n.id);
const greenWestIds = ['g-angri', 'g-monk', 'g-joli', 'g-verdun', 'g-eglise', 'g-lasalle', 'g-charl', 'lionel'];
const greenEastIds = ['lionel', 'g-atwater', 'g-guy', 'g-peel', 'g-mcgill', 'g-pda', 'g-stlaur', 'berri', 'g-beaudry', 'g-papin', 'g-front', 'g-prefon', 'g-joliette', 'g-pieix', 'g-viau', 'g-assomp', 'g-cadillac', 'g-radisson', 'g-hb'];
const blueIds = ['snowdon', 'b-cdn', 'b-udm', 'b-edouard', 'b-outre', 'b-acadie', 'b-parc', 'b-castel', 'jean-talon', 'b-fabre', 'b-iber', 'b-stmichel'];
const yellowIds = ['berri', 'y-jd', 'y-longueuil'];

export const connections: readonly NetworkConnection[] = [
	...chain(orangeIds, 'orange', 1),
	...chain(greenWestIds, 'green', 2),
	...chain(greenEastIds, 'green', 2),
	...chain(blueIds, 'blue', 3),
	...chain(yellowIds, 'yellow', 4),
] as const;

export function getNode(id: string): NetworkNode | undefined {
	return nodes.find((n) => n.id === id);
}
