<!--
  StackPanelOrientation — Hint card shown when no stack item is selected.
  Nudges user to interact with the tech stack diagram.
-->
<div class="panel-orientation" data-testid="panel-orientation">
	<span class="orientation-label label-section font-semibold">SELECT A NODE</span>
	<p class="orientation-text">
		Click on any technology in the diagram to learn more about it — what it does,
		why it was chosen, and which projects use it.
	</p>

	<div class="orientation-hints">
		<div class="hint-item">
			<span class="hint-icon" aria-hidden="true">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="10" r="0.75" fill="currentColor"/></svg>
			</span>
			<span class="hint-text">Click a node for details</span>
		</div>
		<div class="hint-item">
			<span class="hint-icon" aria-hidden="true">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</span>
			<span class="hint-text">Hover to see connections</span>
		</div>
		<div class="hint-item">
			<span class="hint-icon" aria-hidden="true">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7h5M7 4.5v5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
			</span>
			<span class="hint-text">Use filters to explore domains</span>
		</div>
	</div>
</div>

<style>
	.panel-orientation {
		padding: 1.5rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.orientation-label {
		color: var(--primary);
	}

	.orientation-text {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--secondary-foreground);
		margin: 0;
	}

	.orientation-hints {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}

	.hint-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.hint-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--primary);
	}

	.hint-text {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--secondary-foreground);
	}
</style>
