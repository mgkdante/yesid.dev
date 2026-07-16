import { createCn, createTwMergeConfig } from "./create-cn";

// Future app-only vocabulary belongs in a cn-vocab.ts preset and would be
// passed to both createCn() and createTwMergeConfig() here.
export const cn = createCn();
export const twMergeConfig = createTwMergeConfig();

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
