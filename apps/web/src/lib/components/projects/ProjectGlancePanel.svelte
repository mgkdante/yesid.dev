<!--
  Glance rail for the project detail page. Desktop right rail: Links / Overview /
  Stack / Services (Impact sits in the left rail). Mobile block below the sections:
  Overview / Impact / Stack / Services (Links sits above the sections), with distinct
  section keys so its open state doesn't collide with the desktop instance.
-->
<script lang="ts">
  import type { Project, Service } from '#lib/types.ts';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale } from '#lib/utils/locale-context.ts';

  const locale = getLocale();
  import { CollapsibleSection, SectionIcon } from '@yesid/ui/brand';
  import ServiceBadge from './ServiceBadge.svelte';
  import { siteLabels } from '#lib/content/index.ts';
  import BlockRenderer from '#lib/components/cms/BlockRenderer.svelte';
  import ProjectLinksCard from './ProjectLinksCard.svelte';
  import ProjectImpactCard from './ProjectImpactCard.svelte';
  import { scrollChain } from '@yesid/motion/actions';

  const glanceChrome = siteLabels.projectsChrome.detail.glance;
  const glanceOverviewTitle = resolveLocale(glanceChrome.overview, locale);
  const glanceStackTitle = resolveLocale(glanceChrome.stack, locale);
  const glanceServicesTitle = resolveLocale(glanceChrome.services, locale);
  let {
    project,
    services,
    serviceSvgContents = {},
    mobile = false,
    codeHighlights,
  }: {
    project: Project;
    services: Service[];
    serviceSvgContents?: Record<string, string>;
    /** Mobile variant: no Links (the page puts them above the sections), Impact included, own section keys. */
    mobile?: boolean;
    /** block.id → server-highlighted HTML ($lib/server/code-highlights). */
    codeHighlights?: Readonly<Record<string, string>>;
  } = $props();

  /** Scope section keys to this project, and suffix them so the mobile + desktop instances don't share open state. */
  const k = (key: string) => `${project.slug}:${mobile ? `${key}-m` : key}`;

  const hasServices = $derived(services.length > 0);
  const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl || !!project.docsUrl || !!project.repoPrivate);
</script>

<!-- Bare rail (no StickyPanel box); scrollChain keeps the nested-scroll exemption on this element. -->
<div
  class="glance-rail scrollbar-hidden reading-support"
  data-testid="project-glance-panel{mobile ? '-mobile' : ''}"
  use:scrollChain
>
    {#if hasLinks && !mobile}
      <div class="mb-4">
        <ProjectLinksCard {project} sectionKey={k('glance-links')} />
      </div>
    {/if}

    <!-- Overview -->
    <div class="mb-4">
      <CollapsibleSection title={glanceOverviewTitle} sectionKey={k('glance-overview')} open={true}>
        {#snippet icon()}
          <SectionIcon name="eye" />
        {/snippet}
        <div class="glance-overview text-body leading-[1.7]">
          <BlockRenderer doc={resolveLocale(project.description, locale)} {codeHighlights} />
        </div>
      </CollapsibleSection>
    </div>

    {#if mobile}
      <div class="mb-4"><ProjectImpactCard {project} sectionKey={k('glance-impact')} columns={1} /></div>
    {/if}

    <!-- Stack -->
    {#if project.stack.length > 0}
      <div data-toc={mobile ? 'glance-stack' : undefined} class="mb-4">
        <CollapsibleSection title="{glanceStackTitle} ({project.stack.length})" sectionKey={k('glance-stack')} open={true}>
          {#snippet icon()}
            <SectionIcon name="layers" />
          {/snippet}
          <div class="stack-pills">
            {#each project.stack as tech}
              <span class="stack-pill">{tech}</span>
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}

    <!-- Services (SVG badges with morph hover) -->
    {#if hasServices}
      <div data-toc={mobile ? 'glance-services' : undefined} class="mb-4">
        <CollapsibleSection title="{glanceServicesTitle} ({services.length})" sectionKey={k('glance-services')} open={true}>
          {#snippet icon()}
            <SectionIcon name="grid" />
          {/snippet}
          <div class="flex flex-col gap-2 px-2 py-1">
            {#each services as service}
              <ServiceBadge
                {service}
                svgContent={serviceSvgContents[service.id] ?? ''}
              />
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}
</div>

<style>
  /* Bare rail without a border/background box and no height cap. */
  .glance-rail {
    overflow-x: hidden;
    padding-bottom: 1rem;
  }

  .glance-overview {
    color: var(--secondary-foreground);
  }

  /* Stack rendered as a literal vertical STACK of connected slabs, mirroring the
     services detail page (visual pun + brand cohesion). */
  .stack-pills {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
  .stack-pill {
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    padding: 0.45rem 0.7rem;
    border: 1.5px solid var(--primary);
    border-bottom-width: 0;
    border-radius: 0;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, transparent);
    cursor: default;
  }
  .stack-pill:first-child {
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
  }
  .stack-pill:last-child {
    border-bottom-width: 1.5px;
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }
</style>
