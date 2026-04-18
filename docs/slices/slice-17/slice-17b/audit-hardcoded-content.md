# Hardcoded Content Audit — Slice 17b

**Generated:** 2026-04-18
**Method:** 7 parallel Sonnet 4.6 subagents, one per component directory group.
**Files audited:** ~110 (all `.svelte` in `src/lib/components/*` except `ui/`, plus `src/routes/**/*.svelte`).
**Total findings:** ~157 hardcoded user-facing strings.
**Purpose:** Inventory every hardcoded user-facing string that should live as `LocalizedString` in `src/lib/content/*.ts` so Task 17b-7 can extract them component-by-component.

---

## Summary by directory

| Directory | Files | Findings | Edge cases |
|---|---|---|---|
| `components/home/` | 24 | 14 | 5 |
| `components/blog/` | 10 | 29 | 3 |
| `components/projects/` | 13 | 30 | 3 |
| `components/services/` | 6 | 18 | 3 |
| `components/about/` + `contact/` | 12 | 12 | 3 |
| `components/brand/` + `stack/` | ~24 | 26 | 5 |
| `components/layout/` + `shared/` + `svg/` + `routes/` | ~26 | 28 | 4 |
| **Total** | ~115 | **157** | **26** |

`components/ui/` (shadcn-svelte primitives) deliberately skipped — those are generic wrappers over Bits UI with no app-specific copy.

---

## Proposed extraction sub-task breakdown for Task 17b-7

Suggested groupings. Final cut at Task 7 start.

| Sub-task | Scope | Strings | Content files touched |
|---|---|---|---|
| **17b-7a Home** | HeroTextContent, HeroSqlPanel, FeaturedProjects, HomeServices, CloserTerminalBoard, RelatedProjects | ~14 | `site-content.ts` |
| **17b-7b Blog listing** | BlogListingPage, BlogFilterMobile, BlogFilterSidebar, BlogRouteMap, BlogRow | ~16 | `blog.ts`, `nav.ts` |
| **17b-7c Blog detail** | BlogContent, BlogDetailHeader, BlogDetailPage, BlogTocPill | ~13 | `blog.ts` |
| **17b-7d Projects listing** | ProjectListingPage, ProjectFilterMobile, ProjectFilterSidebar, ProjectCard, ProjectMiniCard, ServiceBadge | ~12 | `projects.ts` |
| **17b-7e Projects detail** | ProjectDetailHeader, ProjectDetailPage, ProjectDetailSidebar, ProjectGlancePanel, ProjectGlancePanelMobile, ProjectTocPill | ~18 | `projects.ts` |
| **17b-7f Services** | ServiceListingPage, ServiceDetailPage, ServiceCard, ServiceNav, ProjectsStrip | ~18 | `services.ts`, `projects.ts`, `nav.ts` |
| **17b-7g About** | AboutPage, AboutLogos, AboutPolaroids, AboutTestimonials | ~16 | `about-page.ts` |
| **17b-7h Contact** | ContactPage | ~3 | `contact-page.ts` |
| **17b-7i Tech stack viz** | StackBottomSheet, StackConfigurator, StackDiagram, StackFilters, StackPanel, StackPanelOrientation, StackScenarioCard | ~26 | `tech-stack.ts` |
| **17b-7j Layout + shared** | Nav, Footer, MenuOverlay, FilterSummary, SearchInput, TableOfContents, StationTabs, StopLabel | ~12 | `nav.ts`, `site-content.ts` |
| **17b-7k Page meta tags** | All `+page.svelte` `<title>` + `<meta description>` tags | ~8 | per-page content files |
| **17b-7l Tech-stack page** | tech-stack/`+page.svelte` (control room hero + stats + CTA) | ~9 | new `content/tech-stack-page.ts` or extend `tech-stack.ts` |

**12 sub-tasks, 12 commits, each extracting 3–26 strings.** Reviewer can verify each commit by visual spot-check on the affected route.

---

## Findings by component (sorted by finding count, worst first)

### `src/lib/components/projects/*` (30 findings)

#### `ProjectTocPill.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 106 | `"Table of contents"` | aria-label | projects.ts | tocOpenAria |
| 123 | `"Close table of contents"` | aria-label | projects.ts | tocCloseAria |

#### `ProjectCard.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 74 | `"Tech Stack"` | inline LocalizedString | projects.ts | techStackLabel |
| 75 | `"Services"` | inline LocalizedString | projects.ts | servicesLabel |
| 168 | `"+ more"` suffix | template expression | projects.ts | stackOverflowSuffix |

#### `ProjectDetailHeader.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 113 | `"← All Projects"` | link text | projects.ts | backToProjectsLabel |

#### `ProjectDetailPage.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 157 | `"On this page"` | CollapsibleSection title prop | projects.ts | tocSectionTitle |
| 218 | `"README"` | CollapsibleSection title prop | projects.ts | readmeSectionTitle |

#### `ProjectFilterMobile.svelte` (6)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 40 | `"Filters"` | inline LocalizedString | projects.ts | filtersLabel |
| 41 | `"Services"` | inline LocalizedString | projects.ts | servicesLabel |
| 42 | `"Tags"` | inline LocalizedString | projects.ts | tagsLabel |
| 43 | `"Tech Stack"` | inline LocalizedString | projects.ts | techStackLabel |
| 44 | `"All"` | inline LocalizedString | projects.ts | allFilterLabel |
| 45 | `"Showing"` | inline LocalizedString | projects.ts | showingLabel |

#### `ProjectFilterSidebar.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 41 | `"Services"` | inline LocalizedString | projects.ts | servicesLabel |
| 42 | `"Tags"` | inline LocalizedString | projects.ts | tagsLabel |
| 43 | `"Tech Stack"` | inline LocalizedString | projects.ts | techStackLabel |
| 53 | `"Search projects..."` | placeholder | projects.ts | searchPlaceholder |

#### `ProjectGlancePanel.svelte` (7)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 49 | `"Overview"` | CollapsibleSection title | projects.ts | glanceOverviewTitle |
| 59 | `"Impact"` | CollapsibleSection title | projects.ts | glanceImpactTitle |
| 78 | `"Stack"` | CollapsibleSection title | projects.ts | glanceStackTitle |
| 91 | `"Services"` | CollapsibleSection title | projects.ts | glanceServicesTitle |
| 107 | `"Links"` | CollapsibleSection title | projects.ts | glanceLinksTitle |
| 119 | `"Live Site"` | link text | projects.ts | liveSiteLabel |
| 132 | `"GitHub"` | link text | projects.ts | githubLabel |

#### `ProjectGlancePanelMobile.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 31 | `"Project Info"` | CollapsibleSection title | projects.ts | projectInfoTitle |
| 81 | `"↗ Live Site"` | link text | projects.ts | liveSiteLabel |
| 91 | `"GitHub"` | link text | projects.ts | githubLabel |

#### `ProjectListingPage.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 181 | `"Projects"` | heading text | projects.ts | listingHeading |
| 213 | `"Search projects..."` | placeholder (SearchInput prop) | projects.ts | searchPlaceholder |

### `src/lib/components/blog/*` (29 findings)

#### `BlogContent.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 33 | `"Copy code to clipboard"` | aria-label | blog.ts | copyCodeAria |
| 42 | `"Copy"` | button text | blog.ts | copyCodeLabel |
| 47 | `"Error"` | button text (failure) | blog.ts | copyCodeErrorLabel |

#### `BlogDetailHeader.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 35 | `"← back to personal corner"` | link text | blog.ts | backToPersonalLabel |
| 36 | `"← back to dispatches"` | link text | blog.ts | backToDispatchesLabel |
| 135 | `"Post tags"` | aria-label | blog.ts | postTagsAria |
| 145 | `"{readingTime} min read"` | template text | blog.ts | readingTimeLabel |

#### `BlogDetailPage.svelte` (7)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 145 | `"Reading mode"` | toggle label | blog.ts | readingModeLabel |
| 157 | `"On this page"` | CollapsibleSection title | blog.ts | tocSectionTitle |
| 186 | `"Category"` | metadata panel label | blog.ts | metaCategoryLabel |
| 190 | `"Words"` | metadata panel label | blog.ts | metaWordsLabel |
| 193 | `"Read time"` | metadata panel label | blog.ts | metaReadTimeLabel |
| 197 | `"Language"` | metadata panel label | blog.ts | metaLanguageLabel |
| 201 | `"Tags"` | metadata panel label | blog.ts | metaTagsLabel |

#### `BlogFilterMobile.svelte` (7)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 49 | `"Filters"` | button text | blog.ts | filtersLabel |
| 55 | `"All"` | active filter display | blog.ts | filterAllLabel |
| 64 | `"Language"` | section heading | blog.ts | filterLanguageLabel |
| 70 | `"All"` | language reset button | blog.ts | filterAllLabel |
| 89 | `"Date Range"` | section heading | blog.ts | filterDateRangeLabel |
| 93 | `"From"` | date input label | blog.ts | filterDateFromLabel |
| 102 | `"To"` | date input label | blog.ts | filterDateToLabel |

#### `BlogFilterSidebar.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 63 | `"Search posts..."` | placeholder | blog.ts | searchPostsPlaceholder |
| 208 | `"Search posts..."` | placeholder (SearchInput prop) | blog.ts | searchPostsPlaceholder |

#### `BlogListingPage.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 175 | `"Blog"` | mobile heading text | blog.ts | blogMobileHeading |
| 208 | `"Search posts..."` | SearchInput placeholder | blog.ts | searchPostsPlaceholder |
| 226 | `"result"` | FilterSummary noun prop | blog.ts | filterResultNoun |
| 231 | `"No posts found. Try adjusting your filters."` | empty-state paragraph | blog.ts | noPostsFoundMessage |

#### `BlogRouteMap.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 76 | `"Route Map"` | section label | blog.ts | routeMapLabel |
| 131 | `"Terminus"` | label below SVG | blog.ts | routeMapTerminusLabel |

#### `BlogTocPill.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 86 | `"Table of contents"` | aria-label | blog.ts | tocPillAria |
| 102 | `"Close table of contents"` | aria-label | blog.ts | closeTocAria |

### `src/lib/components/layout/ + shared/ + svg/ + routes/` (28 findings)

#### `layout/Nav.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 113 | `"Close menu"` / `"Open menu"` | aria-label (conditional) | nav.ts | closeMenuAria / openMenuAria |

#### `layout/Footer.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 54 | `"// digital infrastructure"` | tagline | nav.ts or site-content.ts | footerTagline |
| 58 | `"Footer navigation"` | aria-label | nav.ts | footerNavAria |
| 88 | `"Montreal, QC · Remote"` | template text | site-content.ts | footerLocation |
| 91 | `"system online —"` | status prefix | site-content.ts | footerStatusLabel |

#### `layout/MenuOverlay.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 101 | `"Navigation menu"` | DialogPrimitive.Title (sr-only) | nav.ts | menuDialogTitle |
| 138 | `"NAVIGATION — ALL ROUTES"` | footer label | nav.ts | menuFooterLabel |

#### `shared/FilterSummary.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 26 | `"clear filters"` | button text | nav.ts | clearFiltersLabel |

#### `shared/SearchInput.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 12 | `"Search..."` | placeholder default | nav.ts | searchPlaceholder |

#### `shared/TableOfContents.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 190 | `"Toggle section"` | aria-label | nav.ts | tocToggleSectionAria |
| 225 / 261 | `"On this page"` | section heading | nav.ts | tocHeading |
| 287 | `"Table of Contents"` | mobile toggle button | nav.ts | tocMobileLabel |

#### `shared/StationTabs.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 108 | `"Service navigation"` | aria-label | services.ts | serviceTabNavAria |

#### `routes/about/+page.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 9 | `"About — yesid."` | `<title>` meta | about-page.ts | aboutPageTitle |
| 10 | `"Freelance digital infrastructure engineer..."` | `<meta name="description">` | about-page.ts | aboutPageDescription |

#### `routes/blog/+layout.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 7 | `"Blog"` (edge title, visible) | template text | blog.ts | blogEdgeTitle |

#### `routes/blog/+page.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 17 | `"Dispatches"` | prop-passed heading | blog.ts | blogHeading |
| 18 | `"Data, SQL, and infrastructure — from the field"` | prop-passed subtitle | blog.ts | blogSubtitle |
| 20–24 | `"Personal Corner"` / `"Off the clock"` (cornerLink) | prop-passed labels | blog.ts | personalCornerLabel / personalCornerSubtitle |

#### `routes/blog/personal/+page.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 17 | `"Personal Corner"` | prop-passed heading | blog.ts | personalBlogHeading |
| 18 | `"Trains, space, and things I think about"` | prop-passed subtitle | blog.ts | personalBlogSubtitle |
| 21–24 | `"← Back to Professional"` / `"Brand dispatches"` | prop-passed labels | blog.ts | backToProfessionalLabel / backToProfessionalSubtitle |

#### `routes/contact/+page.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 8 | `"Contact — yesid."` | `<title>` meta | contact-page.ts | contactPageTitle |
| 9 | `"Get in touch for freelance data engineering..."` | `<meta name="description">` | contact-page.ts | contactPageDescription |

#### `routes/projects/+layout.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 7 | `"Projects"` (edge title) | template text | projects.ts | projectsEdgeTitle |

#### `routes/projects/+page.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 8 | `"Projects | yesid."` | `<title>` meta | projects.ts | projectsPageTitle |

#### `routes/services/+page.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 8 | `"Services — yesid."` | `<title>` meta | services.ts | servicesPageTitle |
| 9 | `"Digital infrastructure, tools, and systems..."` | `<meta name="description">` | services.ts | servicesPageDescription |

#### `routes/tech-stack/+page.svelte` (9)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 60 | `"Tech Stack — yesid."` | `<title>` meta | tech-stack.ts | techStackPageTitle |
| 62–64 | `"{itemCount}+ technologies across..."` | `<meta name="description">` | tech-stack.ts | techStackPageDescription |
| 72 | `"Infrastructure Map"` | SectionLabel text prop | tech-stack.ts | heroOverlineLabel |
| 74–76 | `"The Control Room."` | h1 heading | tech-stack.ts | heroHeading |
| 79 | `"Infrastructure overview"` | aria-label on terminal | tech-stack.ts | terminalAria |
| 103–113 | `"technologies" / "layers" / "domains" / "projects"` | stat labels (4) | tech-stack.ts | stat*Label |
| 118–119 | `"Get In Touch" / "View Services"` | button text | tech-stack.ts | getInTouchLabel / viewServicesLabel |
| 130–132 | `"Found your stack? Let's build it."` | h2 heading | tech-stack.ts | ctaHeading |
| 135 | `"Whether it's a data pipeline..."` | paragraph text | tech-stack.ts | ctaBody |
| 145 | `"Available for Q2 2026"` | availability notice | tech-stack.ts | availabilityLabel |

### `src/lib/components/brand/ + stack/` (26 findings)

#### `brand/StopLabel.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 20 | `"STOP "` prefix | template text (chrome prefix) | site-content.ts | stopLabelPrefix |

#### `stack/StackPanelOrientation.svelte` (5)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 6 | `"SELECT A NODE"` | section label | tech-stack.ts | orientationHeading |
| 7–10 | `"Click on any technology in the diagram to learn more..."` | body copy | tech-stack.ts | orientationDescription |
| 17 | `"Click a node for details"` | hint | tech-stack.ts | hintClickNode |
| 23 | `"Hover to see connections"` | hint | tech-stack.ts | hintHoverConnections |
| 29 | `"Use filters to explore domains"` | hint | tech-stack.ts | hintUseFilters |

#### `stack/StackBottomSheet.svelte` (7)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 29–31 | `"Expert" / "Proficient" / "Familiar"` (proficiencyLabel map) | script literals | tech-stack.ts | proficiencyLabels |
| 63 | `"Technology details — "` | sr-only title prefix | tech-stack.ts | bottomSheetTitlePrefix |
| 80 | `"Close"` | aria-label on close | tech-stack.ts | closeAria |
| 97 | `"Used in"` | section label | tech-stack.ts | usedInLabel |
| 147 | `"Previous technology"` | aria-label | tech-stack.ts | prevTechAria |
| 154 | `"Next technology"` | aria-label | tech-stack.ts | nextTechAria |
| 164 | `"Let's build with "` CTA prefix | template text | tech-stack.ts | ctaBuildWithPrefix |

#### `stack/StackConfigurator.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 17–25 | `DOMAIN_OPTIONS` labels/descriptions (14 strings) | script literals | tech-stack.ts | domainOptions (array) |
| 52 | `"Build Your Stack — select up to 3 domains"` | aria-label | tech-stack.ts | configuratorGroupAria |
| 54 | `"What do you need?"` | heading | tech-stack.ts | configuratorHeading |
| 56 | `"... selected"` suffix | template expression | tech-stack.ts | configuratorSelectedSuffix |

#### `stack/StackDiagram.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 140–150 | `LAYER_LABELS` values (9 strings) | script literals | tech-stack.ts | layerLabels |
| 178 | `"Infrastructure Layers"` | section label | tech-stack.ts | diagramSectionLabel |
| 187 | `"Infrastructure layers diagram"` | aria-label | tech-stack.ts | diagramAria |

#### `stack/StackFilters.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 19–27 | `DOMAIN_LABELS` (7 strings) | script literals | tech-stack.ts | domainFilterLabels |
| 49 | `"Filter by domain"` | aria-label | tech-stack.ts | filterToolbarAria |

#### `stack/StackPanel.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 28–30 | `"Expert" / "Proficient" / "Familiar"` | script literals | tech-stack.ts | proficiencyLabels (shared with BottomSheet) |
| 74 | `"Close panel"` | aria-label | tech-stack.ts | closePanelAria |
| 94 | `"Used in"` | section label | tech-stack.ts | usedInLabel |
| 149 | `"Let's build with "` CTA prefix | template text | tech-stack.ts | ctaBuildWithPrefix |

#### `stack/StackScenarioCard.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 61 | `"Proven in"` | section label | tech-stack.ts | provenInLabel |
| 73 | `"Let's build this"` | CTA button | tech-stack.ts | ctaBuildThis |

### `src/lib/components/services/*` (18 findings)

#### `ProjectsStrip.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 30 | `` `Built with ${serviceTitle}` `` | template expression | services.ts | builtWithServiceLabel |
| 30 | `"Built with this"` | fallback label | services.ts | builtWithFallbackLabel |
| 33 | `"PROJECT" / "PROJECTS"` | pluralized count | services.ts | projectCountSingular / projectCountPlural |

#### `ServiceCard.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 60 | `"Service {stationNum} / {totalStr}"` | template text (SectionLabel prop) | services.ts | stationLabelTemplate |
| 96 | `"Deep dive →"` | button text | services.ts | deepDiveLabel |
| 103 | `"Deep dive →"` | button text (mobile duplicate) | services.ts | deepDiveLabel |

#### `ServiceDetailPage.svelte` (9)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 51 | `"← All Services"` | inline LocalizedString | services.ts | backToServicesLabel |
| 52 | `"How This Helps You"` | inline LocalizedString | services.ts | valuePropositionHeading |
| 53 | `"Typical Deliverables"` | inline LocalizedString | services.ts | deliverablesHeading |
| 54 | `"Related Projects"` | inline LocalizedString | services.ts | relatedProjectsHeading |
| 80 | `"Service {stationNum} / {totalStr}"` | template text | services.ts | stationLabelTemplate |
| 215 | `"Related projects"` | aria-label | services.ts | relatedProjectsNavAria |
| 228 | `"See all projects →"` | link text | projects.ts | seeAllProjectsLabel |
| 246 | `"Related projects"` | aria-label (mobile) | services.ts | relatedProjectsNavAria |
| 258 | `"See all projects →"` | link text (mobile) | projects.ts | seeAllProjectsLabel |

#### `ServiceListingPage.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 76 | `"Services"` | sr-only `<h1>` | services.ts | servicesPageHeading |

#### `ServiceNav.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 25 | `"Service navigation"` | aria-label | services.ts | serviceNavAria |
| 35 | `"Previous"` | SectionLabel text prop | nav.ts | previousLabel |
| 49 | `"Next"` | SectionLabel text prop | nav.ts | nextLabel |

### `src/lib/components/home/*` (14 findings)

#### `HeroTextContent.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 27 | `"Don't Break."` | aria-label literal fragment | site-content.ts | heroDontBreakAria |

#### `HeroSqlPanel.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 56 | `"route"` | table column header | site-content.ts | sqlColRoute |
| 57 | `"avg_delay_s"` | table column header | site-content.ts | sqlColAvgDelay |
| 58 | `"vehicles"` | table column header | site-content.ts | sqlColVehicles |
| 66 | `"5 rows · {queryTime}s · updated {updatedAgo}"` | meta caption | site-content.ts | sqlMetaTemplate |

#### `FeaturedProjects.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 56 | `"Toggle color for {title}"` | aria-label fragment | site-content.ts | toggleColorForAria |

#### `HomeServices.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 85 | `"View {title} illustration"` | aria-label fragment | site-content.ts | viewIllustrationAria |
| 140 | `"View all services →"` | link text | site-content.ts | viewAllServicesLabel |

#### `CloserTerminalBoard.svelte` (4)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 23 | `"yesid@terminus:~/destinations"` | title prop (TerminalChrome) | site-content.ts | closerTerminalTitle |
| 26 | `"Montreal, QC"` | footer status text | site-content.ts | closerTerminalCity |
| 28 | `"{rows.length} destinations"` | template text | site-content.ts | closerTerminalDestinations |
| 37 | `"// where to next?"` | terminal comment | site-content.ts | closerTerminalPrompt |

#### `RelatedProjects.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 18 | `"Built with this"` | section label | site-content.ts | relatedProjectsLabel |
| 32 | `"project" / "projects"` | pluralization | site-content.ts | projectSingular / projectPlural |

### `src/lib/components/about/ + contact/` (12 findings)

#### `about/AboutLogos.svelte` (1)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 35 | `"clients served"` | MetricDisplay label | about-page.ts | clientsServedLabel |

#### `about/AboutPage.svelte` (10)

Eleven stop-label props duplicated from component defaults:

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 59 | `"IDENTITY"` | stop label prop | about-page.ts | stopLabelIdentity |
| 60 | `"METRICS"` | stop label prop | about-page.ts | stopLabelMetrics |
| 61 | `"TESTIMONIALS"` | stop label prop | about-page.ts | stopLabelTestimonials |
| 64 | `"PROCESS"` | stop label prop | about-page.ts | stopLabelProcess |
| 69 | `"STACK"` | stop label prop | about-page.ts | stopLabelStack |
| 90 | `"CLIENTS"` | stop label prop | about-page.ts | stopLabelClients |
| 91 | `"INTERESTS"` | stop label prop | about-page.ts | stopLabelInterests |
| 92 | `"SNAPSHOTS"` | stop label prop | about-page.ts | stopLabelSnapshots |
| 95 | `"LOCATION"` | stop label prop | about-page.ts | stopLabelLocation |
| 97 | `"NEXT"` | stop label prop | about-page.ts | stopLabelNext |

#### `about/AboutPolaroids.svelte` (2)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 72 | `"Previous photo"` | aria-label | about-page.ts | polaroidPrevAria |
| 82 | `"Next photo"` | aria-label | about-page.ts | polaroidNextAria |

#### `about/AboutTestimonials.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 87 | `"Client testimonials"` | aria-label on region | about-page.ts | testimonialsRegionAria |
| 128 | `"Testimonial navigation"` | aria-label on tablist | about-page.ts | testimonialsNavAria |
| 134 | `"Show testimonial {i + 1}"` | aria-label (interpolated) | about-page.ts | showTestimonialAria |

#### `contact/ContactPage.svelte` (3)

| Line | String | Type | Content file | Key |
|---|---|---|---|---|
| 107 / 112 | `"Failed to send message. Please try again."` | error message in `<script>` | contact-page.ts | sendErrorMessage |
| 167 / 176 | `"Contact"` (with decorative `.`) | edge title | contact-page.ts | pageTitle |
| 178 | `"NEXT STOP: YOU"` | subtitle text | contact-page.ts | stationTagline (already exists but hardcoded here!) |

---

## Content-layer translation debt

Scanned approximate counts of LocalizedString objects per content file (`{ en: ... }` pattern heuristic):

| Content file | LocalizedStrings (en) | Also has fr | Also has es | Status |
|---|---|---|---|---|
| `nav.ts` | 19 | 21 | 22 | ✅ fully multilingual |
| `meta.ts` | 2 | 1 | 1 | partial (tagline, description) |
| `site-content.ts` | ~92 | 0 | 0 | ❌ en-only |
| `services.ts` | ~67 | 0 | 0 | ❌ en-only |
| `about-page.ts` | ~34 | 0 | 0 | ❌ en-only |
| `contact-page.ts` | ~20 | 0 | 0 | ❌ en-only |
| `projects.ts` | ~18 | 0 | 0 | ❌ en-only |
| `blog.ts` | 0 counted (multi-line) | — | — | tbd |
| `tech-stack.ts` | 0 counted (multi-line) | — | 2 | mostly en-only |
| `hero-data.ts` | 0 | — | — | data-only, no LocalizedString |

**Estimated total en-only LocalizedStrings in content: ~230–260.**

Only `nav.ts` is meaningfully multilingual. This is tracked as debt, not a blocker. Task 17b-8's integrity test enhancement will surface an exact report.

---

## Edge cases flagged for human review (26)

Condensed from all 7 agent reports. Grouped by theme.

### Numerical / template-composed strings (6)

1. **Home / HeroSqlPanel line 66** — `"5 rows"` where `5` matches `LIMIT 5` — could be derived from `rows.length`.
2. **Home / HeroBanner line 61** — `"30s ago"` initial default for `updatedAgo` state, transient.
3. **Projects / ProjectCard line 168** — `+{n} more` — template pattern; simple `moreLabel` vs full template.
4. **Services / ServiceCard + ServiceDetailPage lines 60/80** — `"Service {stationNum} / {totalStr}"` — format function vs plain string.
5. **About / AboutTestimonials line 98** — `"Testimonial {activeIndex + 1} of {testimonials.length}"` interpolated aria.
6. **Stack / StackBottomSheet + StackPanel lines 109/126** — `"Sends data to ({outgoing.length})"` / `"Receives from ({incoming.length})"` — composite with counts.

### Decorative / technical labels (7)

7. **Home / CloserTerminalBoard line 23** — `"UTF-8"` in terminal chrome footer.
8. **Home / ServicesBlueprint lines 53–56** — `"SEC-04 / SERVICES"`, `"DWG: AZUR-MPM10-ELEV"`, `"SCALE 1:48 | REV.A"`, `"STM / ALSTOM-BBD"` — engineering-drawing annotations.
9. **Services / ProjectsStrip line 33** — `"PROJECT" / "PROJECTS"` all-caps labels.
10. **Brand / StopLabel line 20** — `"STOP "` prefix — brand chrome metaphor.
11. **Shared / StationTabs lines 20–27** — `SHORT_LABELS` map (`'SQL Dev'`, `'Pipeline'`, etc.) — compact tab abbreviations.
12. **routes/blog/+layout + routes/projects/+layout line 7** — `"Blog"` / `"Projects"` edge titles — may reuse `menuItems` labels.
13. **routes/tech-stack/+page.svelte lines 23–28** — Terminal animation flavour strings (`"→ mapping infrastructure..."`, `"✓ successful"`).

### Accessibility-only / screen-reader (3)

14. **Blog / BlogDetailHeader line 104** — `"VOL. 01 // ISS. {padded}"` edge label (aria-hidden).
15. **Stack / StackBottomSheet line 63** — `"Technology details — "` sr-only prefix.
16. **shared/DataFlowDiagram line 136** — `"Technology stack: {stack.join(', ')}"` aria-label composite.

### Deduplication concerns (3)

17. **Projects / ProjectDetailSidebar lines 16–21** — `labels` object duplicates strings also in ProjectCard, ProjectFilterMobile, ProjectFilterSidebar, glance panels.
18. **Services / ServiceDetailPage lines 51–55** — inline `labels` object: correct LocalizedString shape, but lives in the component rather than `content/services.ts`.
19. **About / AboutPage lines 59–97** — stop labels already match component defaults; extracting creates two copies.

### Error/infrastructure copy (2)

20. **Contact / ContactPage lines 107/112** — `"Failed to send message. Please try again."` — network error fallback; some teams treat these as infrastructure copy.
21. **Blog / BlogDetailHeader lines 38–41** — `'Personal' / 'Professional' / 'Dispatch'` watermark strings — aria-hidden decorative.

### Missing `resolveLocale` usage (5)

22. Several components define inline `labels = { key: { en: "…" } }` but then render `{labels.key}` directly instead of `{resolveLocale(labels.key, locale)}`. Not a structural miss (the LocalizedString shape is correct) but currently leaks a `[object Object]` if a non-en locale is ever wired. Examples: ServiceDetailPage, ProjectDetailSidebar, BlogFilterSidebar (`labels` object pattern).
23. ContactPage line 178: `stationLabel` exists in content-layer with correct LocalizedString shape, but the component hardcodes the string directly instead of using the content value.
24. AboutPage's stop labels duplicate component defaults — best resolved by removing defaults and making content-layer the source of truth.
25. Blog / BlogFilterMobile `"All"` repeated three times — single key with consistent usage.
26. Projects filter `"Services"` / `"Tags"` / `"Tech Stack"` repeat across 3+ filter files.

---

## Recommendations

1. **Scale assessment.** 157 hardcoded strings + ~230 en-only LocalizedStrings is substantial but not unmanageable. 12 sub-tasks of 5–26 strings each, 12 commits.
2. **Grouping.** Extract by page domain, not by component — prevents half-done pages and makes visual review straightforward (one route → one commit → one `preview_snapshot`).
3. **Deduplication first.** Before extracting, pick a canonical key for repeated strings (`Services` / `Tags` / `Tech Stack` / `Filters` / `All` / `Search`) and reuse across files.
4. **Don't backfill fr/es.** Translation debt stays tracked in the integrity test (Task 17b-8). Adding translations is a post-17 slice.
5. **Skip decorative chrome.** Numbered edge cases 7–13 are judgment calls — defer unless translation pressure mounts.
