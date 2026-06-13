import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Round 5c: teach tailwind-merge our @theme vocabulary. Without this, the
// brand font-size utilities (text-body, text-caption, ...) are unknown to
// tw-merge, which classifies them as text COLORS — any real text color earlier
// in the list (e.g. the conversion button's text-signage-bg) got merged away.
// `theme.text` = font-size scale (--text-*), `theme.color` = color names
// (--color-*) — mirrors src/app.css @theme. Exported so tv() consumers
// (tailwind-variants runs its OWN internal merge before cn() ever sees the
// classes) can pass the same vocabulary via { twMergeConfig }.
export const twMergeConfig = {
	extend: {
		theme: {
			text: [
				"hero",
				"hero-mobile",
				"display",
				"title",
				"heading",
				"subheading",
				"body",
				"small",
				"mono",
				"caption",
				"micro",
			],
			color: [
				"signage-bg",
				"signage-text",
				"accent-text",
				"accent-hover",
				"primary-hover",
				"terminal",
				"manifesto",
				"success",
				"border-subtle",
				"border-strong",
			],
		},
	},
} as const;

const twMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type WithoutChild<T> = T extends { child?: unknown } ? Omit<T, "child"> : T;
export type WithoutChildren<T> = T extends { children?: unknown } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
