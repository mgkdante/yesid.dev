// Only the Root card (`<Card>`) is composed in this codebase — consumers pass
// content as children and style via Tailwind classes. The shadcn sub-part
// components (Header/Content/Footer/Title/Description/Action) had zero consumers
// and were removed in the consolidation sweep.
import Root from "./card.svelte";

export {
	Root,
	//
	Root as Card,
};
