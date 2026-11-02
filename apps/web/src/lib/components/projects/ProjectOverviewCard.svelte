<script lang="ts">
  import type { Project } from '#lib/types.ts';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale } from '#lib/utils/locale-context.ts';
  import { siteLabels } from '#lib/content/index.ts';
  import { CollapsibleSection, SectionIcon } from '@yesid/ui/brand';
  import BlockRenderer from '#lib/components/cms/BlockRenderer.svelte';

  let {
    project,
    sectionKey,
    codeHighlights,
  }: {
    project: Project;
    sectionKey: string;
    /** block.id → server-highlighted HTML ($lib/server/code-highlights). */
    codeHighlights?: Readonly<Record<string, string>>;
  } = $props();

  const locale = getLocale();
  const title = resolveLocale(siteLabels.projectsChrome.detail.glance.overview, locale);
</script>

<div data-testid="project-overview-card">
  <CollapsibleSection {title} {sectionKey} open={true}>
    {#snippet icon()}
      <SectionIcon name="eye" />
    {/snippet}
    <div class="glance-overview text-body leading-[1.7]">
      <BlockRenderer doc={resolveLocale(project.description, locale)} {codeHighlights} />
    </div>
  </CollapsibleSection>
</div>

<style>
  .glance-overview {
    color: var(--secondary-foreground);
  }
</style>
