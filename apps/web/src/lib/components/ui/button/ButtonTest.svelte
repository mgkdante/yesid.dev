<script lang="ts">
	import Button, { type ButtonVariant, type ButtonSize } from './button.svelte';

	let { text, variant, size, href, disabled, type }: {
		text: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		href?: string;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
	} = $props();
</script>

<Button {variant} {size} {href} {disabled} {type}>{text}</Button>
