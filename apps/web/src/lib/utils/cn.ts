import { createCn, createTwMergeConfig } from '@yesid/ui/cn';

// Future app-only vocabulary belongs in a cn-vocab.ts preset and would be
// passed to both createCn() and createTwMergeConfig() here.
export const cn = createCn();
export const twMergeConfig = createTwMergeConfig();

export type {
	WithoutChild,
	WithoutChildren,
	WithoutChildrenOrChild,
	WithElementRef,
} from '@yesid/ui/cn';
