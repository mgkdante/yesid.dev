import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MermaidDiagram from './MermaidDiagram.svelte';

vi.mock('$app/env', () => ({ browser: true }));
vi.mock('mermaid', () => ({ default: { initialize: vi.fn(), render: vi.fn().mockRejectedValue(new Error('invalid diagram')) } }));

it.each([
	['en', 'The diagram could not be displayed. The explanation is available in the text.'],
	['fr', "Le diagramme n'a pas pu s'afficher. L'explication reste disponible dans le texte."],
	['es', 'No se pudo mostrar el diagrama. La explicación está disponible en el texto.'],
] as const)('localizes a forced diagram failure in %s', async (locale, message) => {
	render(MermaidDiagram, { props: { code: 'invalid' }, context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	expect(await screen.findByText(message)).toBeInTheDocument();
	expect(screen.getByText('invalid')).toBeInTheDocument();
});
