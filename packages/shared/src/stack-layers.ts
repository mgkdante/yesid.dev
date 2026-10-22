/** Canonical blueprint layers in render order: interface first, infrastructure last. */
export const STACK_LAYERS = ['interface', 'logic', 'data', 'infra'] as const;

export type StackLayer = (typeof STACK_LAYERS)[number];
