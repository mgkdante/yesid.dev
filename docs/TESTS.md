# Test Registry

Last updated: 2026-04-09
Total tests: 525
Runner: Vitest + Bun (`bun run test`)

## Test Architecture

Tests are split into two Vitest projects for performance (slice 10d+):

| Project | Environment | Setup File | Scope | Files |
|---------|-------------|------------|-------|-------|
| **data** | `node` | `src/tests/setup.data.ts` | Pure data/logic tests — no DOM | 10 |
| **dom** | `happy-dom` | `src/tests/setup.dom.ts` | Component, motion, and route tests | 47 |

### Running tests

| Command | What It Does |
|---------|-------------|
| `bun run test` | Run all projects |
| `bunx vitest run --project data` | Run only data tests |
| `bunx vitest run --project dom` | Run only DOM tests |
| `bunx vitest run src/path/to/file.test.ts` | Run specific file |

### Config

- `vite.config.ts` — `test.projects` array defines both projects
- Pool: `threads` (faster IPC than default `forks`, safe since all native deps are mocked)
- DOM environment: `happy-dom` (2-4x faster than jsdom, Svelte 5 compatible)
- Data environment: `node` (no DOM overhead for pure logic tests)

---

## Test Structure

Convention: tests live next to the code they test (co-located).

| Code Location | Test Location | Example |
|--------------|---------------|---------|
| `src/lib/components/Thing.svelte` | `src/lib/components/Thing.test.ts` | StationTabs.test.ts |
| `src/lib/data/services.ts` | `src/lib/data/data-integrity.test.ts` | Data layer validation |
| `src/lib/motion/actions/reveal.ts` | `src/lib/motion/actions/reveal.test.ts` | Action behavior |
| `src/routes/services/+page.ts` | `src/routes/services/+page.test.ts` | Route load functions |

### Naming
- File: `[ComponentName].test.ts`
- Describe block: component or module name
- It block: starts with a verb ("renders", "returns", "throws", "calls")

### Categories
- **Data integrity:** validates types, required fields, referential integrity
- **Component:** renders with props, emits events, accessibility attributes
- **Motion/actions:** verifies GSAP calls, cleanup on destroy
- **Route:** load function returns correct data, 404 on invalid params

---

# Components (`src/lib/components/`) — 28 files, 197 tests

## src/lib/components/BlogRow.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| BlogRow > renders the post title | The post title text appears in the DOM | `getByText('Test Post Title')` is truthy | Uses `makePost()` factory with minimal BlogPost fixture |
| BlogRow > renders larger padding when featured=true | Featured posts get extra padding | `article.classList.contains('p-5')` === true | `featured: true, accentColor: '#E07800'` |
| BlogRow > renders normal padding when featured=false | Non-featured posts get standard padding | `article.classList.contains('p-4')` === true | `featured: false` |
| BlogRow > renders normal padding by default when featured is not set | Default (no featured prop) uses standard padding | `article.classList.contains('p-4')` === true | Standard |
| BlogRow > renders station badge with zero-padded index | The station number badge shows the correct zero-padded number | `badge.textContent.trim()` === `'04'` for index 3 | `index: 3` — expects `(index + 1).padStart(2, '0')` |
| BlogRow > renders metro line connector below badge | A metro line element appears below the station badge | `querySelector('[data-testid="metro-line"]')` is truthy | Standard |
| BlogRow > renders tags | Tag labels from the post appear in the DOM | `getByText('sql')` and `getByText('postgres')` are truthy | `tags: ['sql', 'postgres']` |
| BlogRow > renders the post date | The post date string appears in the DOM | `getByText('2025-01-15')` is truthy | `date: '2025-01-15'` |

## src/lib/components/CollapsibleSection.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| CollapsibleSection > renders title and children when open | The section title is visible when open | `getByText('Overview')` is truthy | `title: 'Overview', open: true` |
| CollapsibleSection > renders numbered badge when index is provided | A numbered badge appears when index prop is given | `badge.textContent.trim()` === `'1'` | `index: 0` — displays index + 1 |
| CollapsibleSection > toggles body visibility on button click when collapsible | Clicking the header toggles the body between expanded and collapsed | `body.classList.contains('expanded')` toggles from true to false after click | `collapsible: true`, uses `fireEvent.click` |
| CollapsibleSection > renders as div (not button) when collapsible is false | Non-collapsible sections have no toggle button or chevron | `querySelector('button')` is null, `.section-chevron` is null | `collapsible: false` |
| CollapsibleSection > uses custom accent color | The accent color is applied as a border style | `card.style.borderColor` matches `#FFB627` or `rgb(255, 182, 39)` | `accentColor: '#FFB627'` |

## src/lib/components/FilterGroup.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| FilterGroup > renders label and all items plus "All" button | The label, "All" button, and all filter items render | `getByText('Tags')`, `getByText('All')`, `getByText('SQL')`, `getByText('Python')`, `getByText('Svelte')` all truthy | 3 filter items, `onSelect: vi.fn()` |
| FilterGroup > highlights active item | The currently active filter has the active CSS class | `getByText('Python').classList.contains('tag-active')` === true | `activeKey: 'python'` |
| FilterGroup > calls onSelect with key on click | Clicking a filter calls the callback with that filter's key | `onSelect` called with `'sql'` | `fireEvent.click(getByText('SQL'))` |
| FilterGroup > calls onSelect with null when "All" clicked | Clicking "All" resets the filter by passing null | `onSelect` called with `null` | `activeKey: 'sql'`, click "All" |
| FilterGroup > deselects active item when allowDeselect is true | Clicking the already-active filter deselects it | `onSelect` called with `null` | `activeKey: 'sql', allowDeselect: true`, click "SQL" |

## src/lib/components/Footer.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| Footer > renders a footer element | A footer landmark exists in the DOM | `getByTestId('footer')` is in document | Standard |
| Footer > renders the yesid wordmark | The wordmark link contains "yesid" | `getByTestId('footer-wordmark')` text contains `'yesid'` | Standard |
| Footer > renders the current year in copyright | The current year appears in copyright text | `getByText(/© year/)` is in document | Dynamically computes year |
| Footer > renders footer navigation with aria-label | Footer nav has accessible label | `getByRole('navigation', { name: /footer navigation/i })` | Standard |
| Footer > renders all 6 site navigation links | All 6 page links are present in footer nav | `nav.querySelectorAll('a').length` === 6 | Standard |
| Footer > renders links to Services, Work, Blog, Stack, About, Contact | Nav links have correct hrefs | Scoped `querySelectorAll` on nav, check hrefs array | Standard |
| Footer > renders GitHub social link with target=_blank | GitHub link opens externally | `href`, `target`, `rel` attributes checked | Standard |
| Footer > renders LinkedIn social link with target=_blank | LinkedIn link opens externally | `href`, `target` attributes checked | Standard |
| Footer > renders the status bar with system date | Programmatic date appears in YYYY.MM.DD format | `getByText(new RegExp(expectedDate))` | Dynamically computes date |
| Footer > renders system online status text | Status bar shows online indicator | `getByText(/system online/)` | Standard |
| Footer > renders location in an address element | Montreal appears in semantic address element | `querySelector('footer address')` text contains `'Montreal'` | Standard |
| Footer > renders the digital infrastructure tagline | Brand tagline appears | `getByText(/digital infrastructure/)` | Standard |

## src/lib/components/GradientSeparator.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| GradientSeparator > renders the gradient line div | The separator element exists in the DOM | `querySelector('[data-testid="gradient-separator"]')` is truthy | Standard |
| GradientSeparator > renders label when provided | A label appears when the label prop is set | `getByText('Test Section')` is truthy | `label: 'Test Section'` |
| GradientSeparator > does not render label when not provided | No label element appears when label prop is omitted | `querySelector('[data-testid="separator-label"]')` is null | Standard |

## src/lib/components/Hero.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| Hero > renders the heading as an h1 | The hero heading is an h1 with the correct text | `getByRole('heading', { level: 1, name })` is in document | `heading` and `subheading` props |
| Hero > renders the subheading text | The subheading text appears in the DOM | `getByText(subheading)` is in document | Standard |
| Hero > renders no CTA section when both CTAs are undefined | No CTA container appears when no CTAs are provided | `queryByTestId('hero-ctas')` not in document | No CTA props |
| Hero > renders primary CTA with correct href and label | The primary CTA link has the right URL and text | `href` === `'/work'`, text === `'See my work'` | `primaryCta: { label, href }` |
| Hero > renders secondary CTA with correct href and label | The secondary CTA link has the right URL and text | `href` === `'/contact'`, text === `'Get in touch'` | `secondaryCta: { label, href }` |
| Hero > renders only primary CTA when secondary is omitted | Only the primary CTA appears when secondary is missing | primary in document, secondary not in document | Only `primaryCta` prop |
| Hero > renders only secondary CTA when primary is omitted | Only the secondary CTA appears when primary is missing | secondary in document, primary not in document | Only `secondaryCta` prop |
| Hero > renders both CTAs when both are provided | Both CTAs appear side by side | Both `hero-primary-cta` and `hero-secondary-cta` in document | Both CTA props |

## src/lib/components/MenuOverlay.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| MenuOverlay > renders all 6 navigation links | All menu items appear as links | `getByRole('link', { name: /Services/ })` through `/Contact/` all in document | `open: true, pathname: '/'` |
| MenuOverlay > marks the active link stop as current | The active route link has aria-current | Work link has `aria-current` === `'page'` | `pathname: '/work'` |
| MenuOverlay > renders metro subtitles | Subtitle copy appears for each item | `getByText('what I build')` and `getByText('open channel')` in document | Standard |
| MenuOverlay > has dialog role and aria-modal | The overlay is an accessible modal dialog | `getByRole('dialog')` has `aria-modal` === `'true'` | Standard |
| MenuOverlay > renders the close button | A close button exists in the overlay | `getByLabelText('Close menu')` in document | Standard |
| MenuOverlay > renders bottom terminal label | The NAVIGATION label appears at bottom | `getByText(/NAVIGATION/)` in document | Standard |
| MenuOverlay > does not render when closed | Closed state produces no dialog | `queryByRole('dialog')` not in document | `open: false` |

## src/lib/components/Nav.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| Nav > renders a nav element | A navigation landmark exists | `getByTestId('nav')` is in document | Standard |
| Nav > renders wordmark linking to / | The "yesid" wordmark links to the home page | `closest('a')` has `href` === `'/'` | Standard |
| Nav > renders the period in a separate span for orange styling | The brand dot is isolated for styling | `getByTestId('nav-period')` text === `'.'` | Standard |
| Nav > renders Work link with correct href | The Work nav item links to /work | `getByRole('link', { name: 'Work' })` has `href` === `'/work'` | Standard |
| Nav > renders About link with correct href | The About nav item links to /about | `href` === `'/about'` | Standard |
| Nav > renders Contact link with correct href | The Contact nav item links to /contact | `href` === `'/contact'` | Standard |
| Nav > marks the active link with aria-current="page" | The currently active page link is announced to screen readers | Work link has `aria-current` === `'page'` | `pathname: '/work'` |
| Nav > does not mark inactive links with aria-current | Non-active links do not have aria-current | About and Contact links lack `aria-current` | `pathname: '/work'` |
| Nav > renders a hamburger button for mobile | A mobile menu toggle exists | `getByTestId('nav-hamburger')` is in document | Standard |
| Nav > has a wordmark-letters container for animation | The animated wordmark letters container exists | `getByTestId('nav-wordmark-letters')` text === `'yesid'` | Standard |

## src/lib/components/ProjectCard.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ProjectCard > renders title and one-liner | The project name and tagline are visible | `getByText('Transit Data Pipeline')` and one-liner in document | `baseProps` with title, oneLiner, slug, tags, status |
| ProjectCard > links to /work/[slug] | The card links to the correct project detail page | `href` === `'/work/transit-data-pipeline'` | Standard |
| ProjectCard > renders tags via TagList | The project tags appear as pills | `getByText('python')` and `getByText('postgresql')` in document | `tags: ['python', 'postgresql']` |
| ProjectCard > renders no status badge for public projects | Public projects have no status indicator | `queryByTestId('status-badge')` not in document | `status: 'public'` |
| ProjectCard > renders WIP badge for wip status | Work-in-progress projects show a WIP badge | `status-badge` text === `'WIP'` | `status: 'wip'` |
| ProjectCard > renders Private badge for private status | Private projects show a Private badge | `status-badge` text === `'Private'` | `status: 'private'` |
| ProjectCard > renders correctly with empty tags array | A project with no tags renders without crashing | `queryByTestId('tag-list')` not in document | `tags: []` |
| ProjectCard > handles a long title without error | Very long titles don't break the card layout | `getByRole('heading', { level: 3 })` is in document | Title repeated 5 times |

## src/lib/components/ProjectGrid.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ProjectGrid > renders the correct number of cards | Each project gets its own card element | `getAllByTestId('project-card')` has length 2 | 2 projects via `makeProject()` factory |
| ProjectGrid > renders each project title | All project titles appear in the grid | `getByText('Project A')` and `getByText('Project B')` in document | Standard |
| ProjectGrid > renders nothing when projects array is empty | An empty array produces no grid output | `queryByTestId('project-grid')` not in document | `projects: []` |
| ProjectGrid > renders a single project correctly | A grid with one project still renders properly | `getAllByTestId('project-card')` has length 1 | 1 project |

## src/lib/components/ProofStrip.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ProofStrip > renders project count | The total number of related projects is shown | `getByText('2 projects')` is truthy | 2 mock projects |
| ProofStrip > renders project titles | Each project title appears in the strip | `getByText('Transit Data Pipeline')` and `getByText('Query Optimizer')` are truthy | Standard |
| ProofStrip > links projects to /work/[slug] | Each project title is a link to its detail page | First link `href` === `'/work/transit-data-pipeline'` | Standard |
| ProofStrip > renders label text | The "Built with this" label is visible | `getByText('Built with this')` is truthy | Standard |

## src/lib/components/ScrollPrompt.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ScrollPrompt > renders without crashing | The component mounts without errors | `render(ScrollPrompt)` does not throw | Standard |
| ScrollPrompt > has accessible label for scroll action | The scroll prompt has an aria-label for assistive tech | `aria-label` === `'Scroll down'` | Standard |
| ScrollPrompt > renders an SVG chevron | A chevron SVG with a path element is rendered | `querySelector('svg')` and `querySelector('path')` in document | Standard |

## src/lib/components/SectionHeader.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| SectionHeader > renders the title as an h2 | The section title renders as an h2 heading | `getByRole('heading', { level: 2, name: 'Projects' })` in document | `title: 'Projects'` |
| SectionHeader > renders subtitle when provided | A subtitle paragraph appears below the heading | `getByText('What I offer')` in document | `subtitle: 'What I offer'` |
| SectionHeader > does not render subtitle when omitted | No extra paragraph renders when subtitle is missing | `querySelectorAll('p')` has length 0 | No subtitle prop |
| SectionHeader > handles a very long title without error | Extremely long titles don't crash the component | `getByRole('heading', { level: 2 })` in document | Title = `'A '` repeated 50 times |

## src/lib/components/ServiceCard.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ServiceCard > renders the service title | The service name appears in the card | `getByText('SQL Development & Optimization')` is truthy | Mock service with full fields |
| ServiceCard > renders the description | The service description text is visible | `getByText(description)` is truthy | Standard |
| ServiceCard > renders the station counter | The "Service NN / NN" counter is shown | `getByText('Service 01 / 06')` is truthy | `index: 0, total: 6` |
| ServiceCard > renders stack pills | Each tech in the stack array gets a pill | `getByText('PostgreSQL')`, `getByText('SQL Server')`, `getByText('T-SQL')` are truthy | `stack: ['PostgreSQL', 'SQL Server', 'T-SQL']` |
| ServiceCard > renders a "Deep dive" link with correct href | The detail link points to /services/[id] | `href` === `'/services/sql-development'` | Standard |
| ServiceCard > renders SVG container when svgContent is provided | The SVG illustration container appears when content is given | `getByTestId('service-card-svg')` is truthy | `svgContent: '<svg>...'` |

## src/lib/components/ServiceNav.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ServiceNav > renders prev and next links | Both navigation links appear | `getByTestId('service-nav-prev')` and `getByTestId('service-nav-next')` are truthy | Mock prev and next services |
| ServiceNav > renders correct hrefs | The prev/next links point to the right service pages | prev `href` === `'/services/sql-development'`, next `href` === `'/services/analytics-reporting'` | Standard |
| ServiceNav > renders service titles | Both service titles are visible | `getByText('SQL Development & Optimization')` and `getByText('Analytics & Reporting Systems')` are truthy | Standard |
| ServiceNav > omits prev when undefined | No prev link renders when there's no previous service | `queryByTestId('service-nav-prev')` is null, next is truthy | Only `next` prop |
| ServiceNav > omits next when undefined | No next link renders when there's no next service | prev is truthy, `queryByTestId('service-nav-next')` is null | Only `prev` prop |

## src/lib/components/ServiceStation.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ServiceStation > renders service title | The service title text appears | `getByText('Test Service Title')` in document | Mock service with `relatedProjects: ['yesid-dev']` |
| ServiceStation > renders service description | The service description text appears | `getByText(description)` in document | Standard |
| ServiceStation > has correct data-testid | The station wrapper has a testid with the service id | `querySelector('[data-testid="station-test-service"]')` in document | Standard |
| ServiceStation > renders Lottie player container when icon is provided | A Lottie animation container appears when icon is set | `querySelector('[data-testid="station-lottie"]')` in document | `icon: 'station-sql.json'` |
| ServiceStation > does not render Lottie container when icon is missing | No Lottie container renders when icon is absent | `station-lottie` not in document | Service without `icon` field |
| ServiceStation > renders related public project cards | Public related projects appear as cards | `getByText('yesid.dev — Portfolio Site')` in document | `relatedProjects: ['yesid-dev']` (public in seed) |
| ServiceStation > handles empty relatedProjects gracefully | A station with no related projects renders without crashing | Station testid in document, no project cards | `relatedProjects: []` |
| ServiceStation > filters out private projects from related list | Private or nonexistent projects are excluded | 0 project-card elements in DOM | `relatedProjects: ['nonexistent-project-slug']` |
| ServiceStation > renders station number derived from index | The station number badge shows zero-padded index+1 | `station-number` text === `'01'` | `index: 0` |
| ServiceStation > renders correct station number for second station | The second station shows "02" | `station-number` text === `'02'` | `index: 1` |
| ServiceStation > renders indicator light | The station indicator light element exists | `getByTestId('station-indicator')` in document | Standard |
| ServiceStation > renders Lottie in scrub mode container | The Lottie player is nested inside the station-lottie zone | `station-lottie` contains `lottie-player` | Standard |

## src/lib/components/SkillsJourney.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| SkillsJourney > renders the journey container | The skills journey wrapper exists | `getByTestId('skills-journey')` in document | Standard |
| SkillsJourney > renders a panel for each data entry | Each skills panel gets its own element | `getAllByTestId(/^journey-panel-/)` has length >= 4 | Uses seed data from `content.ts` |
| SkillsJourney > renders the CTA prompt panel | The call-to-action prompt panel exists | `getByTestId('journey-cta-prompt')` in document | Standard |
| SkillsJourney > renders the CTA button linking to /contact | The CTA button links to the contact page | `closest('a')` has `href` === `'/contact'` | Standard |
| SkillsJourney > renders skill icons in each panel | Skill icon elements exist within panels | `getAllByTestId(/^journey-skill-/)` has length >= 4 | Standard |
| SkillsJourney > renders panel labels | The panel labels with numbering are visible | `getByText('01 — FOUNDATION')` and `getByText('02 — ROUTES')` in document | Standard |

## src/lib/components/StationTabs.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| StationTabs > renders a tab for each service | Each service gets a tab element with its short name | `getByText('SQL Dev')`, `getByText('Pipeline')`, `getByText('Analytics')` are truthy | 3 mock services |
| StationTabs > renders station numbers | Each tab shows its zero-padded station number | `getByText('01')`, `getByText('02')`, `getByText('03')` are truthy | Standard |
| StationTabs > marks the active tab | The active service tab has `data-active="true"` | `station-tab-data-pipeline` has `data-active` === `'true'` | `activeId: 'data-pipeline'` |
| StationTabs > renders links in navigate mode | In navigate mode, tabs are links to /services/[id] | `closest('a')` has `href` === `'/services/data-pipeline'` | `mode: 'navigate'` |

## src/lib/components/TableOfContents.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| TableOfContents > renders desktop ToC with correct headings | All headings from the HTML appear in the desktop ToC | Desktop contains 'Introduction', 'Getting Started', 'Prerequisites', 'Usage', 'Advanced Config' | Sample HTML with h1-h4 headings |
| TableOfContents > renders mobile ToC toggle | A mobile-friendly collapsible toggle exists | `getByTestId('toc-mobile')` contains 'Table of Contents' | Standard |
| TableOfContents > expands mobile ToC on click | Clicking the toggle reveals the heading list on mobile | `mobile.querySelectorAll('ul')` goes from 0 to 1 after click | `fireEvent.click` on toggle |
| TableOfContents > exports getProcessedHtml that injects ids | The processed HTML has slug-based id attributes on headings | Processed HTML contains `id="introduction"`, `id="getting-started"`, etc. | Calls `component.getProcessedHtml()` |
| TableOfContents > preserves existing heading ids | Pre-existing ids are kept, new ones are generated | Contains `id="existing-id"` and `id="no-id-here"` | HTML with `id="existing-id"` on h2 |
| TableOfContents > handles empty HTML without crashing | Empty input renders an empty ToC without errors | Desktop has 0 `<li>` elements | `html: ''` |
| TableOfContents > handles HTML with no headings | HTML with only paragraphs produces no ToC entries | Desktop has 0 `<li>`, mobile toggle not rendered | `html: '<p>No headings here.</p>'` |
| TableOfContents > calls scrollIntoView when a ToC link is clicked | Clicking a ToC entry smoothly scrolls to that heading | `mockEl.scrollIntoView` called with `{ behavior: 'smooth' }` | Creates mock element with matching id, `fireEvent.click` |
| TableOfContents > deduplicates identical heading texts | Duplicate heading texts get unique suffixed ids | Contains `id="setup"` and `id="setup-1"` | HTML with two `<h2>Setup</h2>` |
| TableOfContents > applies custom class via class prop | A custom CSS class is added to the ToC wrapper | `desktop.className` contains `'my-custom-class'` | `class: 'my-custom-class'` |

## src/lib/components/TagList.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| TagList > renders all tags | Every tag in the array appears as text | `getByText('postgresql')`, `getByText('python')`, `getByText('etl')` in document | `tags: ['postgresql', 'python', 'etl']` |
| TagList > renders nothing when tags is empty | An empty tags array produces no output | `queryByTestId('tag-list')` not in document | `tags: []` |
| TagList > renders nothing when tags prop is omitted | Missing tags prop produces no output | `queryByTestId('tag-list')` not in document | No props |
| TagList > renders a single tag correctly | A single tag still renders as a list | `getByText('sql')` in document, `getByRole('list')` in document | `tags: ['sql']` |
| TagList > uses list semantics for accessibility | Tags use proper `<ul>` / `<li>` elements for screen readers | `getByRole('list')` and `getAllByRole('listitem')` has length 2 | `tags: ['a', 'b']` |

## src/lib/components/StackNode.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackNode | Renders item name, icon placeholder, data attributes, selected/dimmed states, onclick/keydown handlers | 9 |

## src/lib/components/StackDiagram.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackDiagram | Renders tier rows, places nodes in correct layers, skips empty layers, mobile accordion, onselect callback, dimming of non-connected nodes, selected state | 12 |

## src/lib/components/StackPanel.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackPanel > Orientation card | Shows orientation card with stats when no item selected, hides detail | 4 |
| StackPanel > Detail card | Shows detail card with name, proficiency, relations, projects, CTA, close button, relation click navigation | 8 |

## src/lib/components/StackBottomSheet.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackBottomSheet | Renders bottom sheet, displays item name/proficiency, markdown content, close/backdrop dismiss, prev/next navigation, project badges | 10 |

## src/lib/components/StackFilters.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackFilters | Renders "All" pill and domain pills, toggles active state, calls onchange with updated domains array, multi-select, horizontal scroll | 8 |

## src/lib/components/StackConfigurator.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackConfigurator | Renders domain cards with labels/descriptions, toggles selection up to 3 max, calls onchange, shows selected count, deselects on re-click | 9 |

## src/lib/components/StackScenarioCard.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| StackScenarioCard | Renders scenario summary, recommended tech list, related projects, CTA link, handles auto-generated scenarios | 6 |

## src/lib/components/HomeServices.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| HomeServices | Section renders with label, 6 cards with benefit headlines, service titles, impact metrics, SVG panels, correct /services/[id] links, view-all link | 9 |

# Data Layer (`src/lib/data/`) — 10 files, 126 tests

## src/lib/data/tech-stack.test.ts

| Describe | Summary | Count |
|----------|---------|-------|
| tech-stack data validation | All 35 items have unique IDs, valid layers/domains/proficiency, no self-refs, no dangling connectsTo refs | 10 |
| tech-stack scenario validation | All scenarios have unique IDs, valid domains, existing recommended tech IDs, non-empty summaries | 5 |
| tech-stack API | getAllTechItems, getTechItemById, getTechItemsByLayer, getTechItemsByDomain, getConnections, getIncomingConnections, getTechItemContent, getAllScenarios, getScenarioForDomains, getOutgoingRelations, getIncomingRelations | 13 |

## src/lib/data/content.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| heroContent > has non-empty English strings | All hero section text fields have content | badge, headline lines, subtitle, CTAs, SQL decoration all have length > 0 | Standard |
| aboutContent > has non-empty English strings | The about section has a name, title, bio, and interests | `name.en` === `'Yesid O.'`, title/bio/interests length > 0 | Standard |
| aboutContent > has at least 3 stack items | The tech stack list has enough entries | `stackItems.length` >= 3 | Standard |
| aboutContent > has location data | Location city and region are populated | `city.en` === `'Montreal'`, `region.en` length > 0 | Standard |
| ctaContent > has non-empty English strings | The CTA section has heading, subtitle, and button texts | heading contains `'build something'`, subtitle/buttons length > 0 | Standard |
| skillsJourneyPanels > has at least 1 panel | The skills journey has at least one panel defined | `panels.length` >= 1 | Standard |
| skillsJourneyPanels > every panel has a unique id | No two panels share the same id | `new Set(ids).size` === `ids.length` | Standard |
| skillsJourneyPanels > every panel has at least one skill | Each panel contains skill entries | `panel.skills.length` >= 1 for all panels | Standard |
| skillsJourneyPanels > every panel has at least one highlight word | Each panel has words to visually emphasize | `panel.highlightWords.length` >= 1 for all panels | Standard |
| skillsJourneyCta > has prompt and button text | The journey CTA has both prompt and button copy | `prompt.en` and `button.en` are truthy | Standard |
| services — home grid fields > every visible service has a benefitHeadline | All visible services have non-empty benefitHeadline | `service.benefitHeadline.en.length` > 0 for all | Uses `getVisibleServices()` |
| services — home grid fields > every visible service has an impactMetric with value and label | All visible services have impactMetric with value + label | `impactMetric.value.en` and `impactMetric.label.en` length > 0 | Uses `getVisibleServices()` |
| services — home grid fields > every visible service has an svg filename | All visible services have svg field | `service.svg.length` > 0 for all | Uses `getVisibleServices()` |

## src/lib/data/data-integrity.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| projects data integrity > all slugs are unique | No two projects share the same slug | `new Set(slugs).size` === `slugs.length` | Imports `projects` from seed data |
| projects data integrity > no project has an empty slug | Every project has a non-blank slug | `p.slug.trim()` !== `''` for all | Standard |
| projects data integrity > all slugs are URL-safe | Slugs only contain lowercase letters, numbers, and hyphens | Each slug matches `/^[a-z0-9-]+$/` | Standard |
| projects data integrity > all required LocalizedString fields have a non-empty English value | Title, one-liner, and description are filled in English | `title.en.trim()`, `oneLiner.en.trim()`, `description.en.trim()` !== `''` | Standard |
| projects data integrity > all status values are valid | Project status is one of the allowed enum values | `['public', 'private', 'wip']` contains each `p.status` | Standard |
| projects data integrity > all projects have at least one stack entry | Every project lists at least one technology | `p.stack.length` > 0 | Standard |
| projects data integrity > all projects have at least one tag | Every project has at least one searchable tag | `p.tags.length` > 0 | Standard |
| projects data integrity > there is at least one featured project | The home page showcase has content | `projects.filter(p => p.featured).length` > 0 | Standard |
| projects data integrity > all projects have a relatedServices array with at least one entry | Every project is linked to at least one service | `p.relatedServices.length` > 0 | Standard |
| projects data integrity > all relatedServices IDs reference existing service IDs | No project references a nonexistent service | Each service ID found in the services array | Cross-references `services` data |
| services data integrity > at least 1 service exists | The services array is not empty | `services.length` >= 1 | Standard |
| services data integrity > all services have a non-empty English title | Every service has a title | `s.title.en.trim()` !== `''` | Standard |
| services data integrity > all services have a non-empty English description | Every service has a description | `s.description.en.trim()` !== `''` | Standard |
| services data integrity > all services have a unique id | No two services share the same id | `new Set(ids).size` === `ids.length` | Standard |
| services data integrity > all service ids are non-empty strings | Every service id is non-blank | `s.id.trim()` !== `''` | Standard |
| services data integrity > all services have unique station numbers | No two services share the same station number | `new Set(stations).size` === `stations.length` | Standard |
| services data integrity > station numbers are sequential starting from 1 with no gaps | Station numbers form a gapless sequence 1, 2, 3... | Sorted stations === `[1, 2, ..., n]` | Standard |
| services data integrity > station count equals services count | Every service has exactly one station | `stationCount` === `services.length` | Standard |
| services data integrity > relatedProjects is an array on every service | The relatedProjects field is always an array | `Array.isArray(s.relatedProjects)` === true | Standard |
| services data integrity > all relatedProjects slugs exist in the projects array | No service references a nonexistent project | Each slug found in the projects array | Cross-references `projects` data |
| services data integrity > all services with svg field reference a valid filename | SVG filenames are non-empty and end with .svg | `s.svg` matches `/\.svg$/` when present | Standard |
| siteMeta data integrity > name is yesid. | The brand name is exactly "yesid." | `siteMeta.name` === `'yesid.'` | Standard |
| siteMeta data integrity > tagline has a non-empty English value | The site tagline is populated | `tagline.en.trim()` !== `''` | Standard |
| siteMeta data integrity > description has a non-empty English value | The site description is populated | `description.en.trim()` !== `''` | Standard |
| siteMeta data integrity > email link is present | An email contact link exists | `links.email.trim()` !== `''` | Standard |
| siteMeta data integrity > github link is present | A GitHub profile link exists | `links.github.trim()` !== `''` | Standard |
| blogPosts data integrity > at least 3 blog posts exist | The blog has enough content | `blogPosts.length` >= 3 | Standard |
| blogPosts data integrity > all slugs are unique | No two blog posts share the same slug | `new Set(slugs).size` === `slugs.length` | Standard |
| blogPosts data integrity > all slugs are URL-safe | Blog slugs only contain lowercase, numbers, hyphens | Each slug matches `/^[a-z0-9-]+$/` | Standard |
| blogPosts data integrity > all required LocalizedString fields have non-empty English values | Blog title and excerpt are filled in English | `title.en.trim()` and `excerpt.en.trim()` !== `''` | Standard |
| blogPosts data integrity > all dates are valid ISO date strings | Blog dates parse as real dates in YYYY-MM-DD format | Each date matches `/^\d{4}-\d{2}-\d{2}$/` and doesn't produce 'Invalid Date' | Standard |
| blogPosts data integrity > all posts have at least one tag | Every blog post is tagged | `p.tags.length` > 0 | Standard |
| blogPosts data integrity > all posts have a non-empty url | Every blog post has a URL | `p.url.trim()` !== `''` | Standard |

## src/lib/data/locale.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| resolveLocale > returns the English string when locale is en | English locale returns the English translation | Result === `'Hello'` | Full `LocalizedString` with en/fr/es |
| resolveLocale > returns the French string when locale is fr and fr is present | French locale returns the French translation | Result === `'Bonjour'` | Standard |
| resolveLocale > returns the Spanish string when locale is es and es is present | Spanish locale returns the Spanish translation | Result === `'Hola'` | Standard |
| resolveLocale > falls back to English when the requested locale is missing | A missing translation falls back to English | Result === `'Hello'` for es when only en/fr exist | `LocalizedString` without es |
| resolveLocale > falls back to English when the requested locale field is an empty string | An empty-string translation falls back to English | Result === `'Hello'` when `fr: ''` | Standard |
| resolveLocale > falls back to English when the requested locale field is whitespace only | A whitespace-only translation falls back to English | Result === `'Hello'` when `fr: '   '` | Standard |
| resolveLocale > works correctly with only the required English field | English-only strings work for all locales | Result === `'English only'` for en, fr, and es | `{ en: 'English only' }` |
| resolveLocale > does not fall through to French when Spanish is missing | The fallback chain is locale -> en, not locale -> other locales -> en | Result === `'English'` (not `'French'`) for es | `{ en: 'English', fr: 'French' }` |
| locale constants > DEFAULT_LOCALE is en | The default locale constant is English | `DEFAULT_LOCALE` === `'en'` | Standard |
| locale constants > SUPPORTED_LOCALES contains en, fr, and es | All three supported locales are listed | Array contains `'en'`, `'fr'`, `'es'` and has length 3 | Standard |

## src/lib/data/metro.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| metro line > has the correct total stops | Total stop count matches services + 5 fixed sections | `TOTAL_STOPS` === `services.length + 5`, `metroStops.length` === `TOTAL_STOPS` | Imports `services` for dynamic count |
| metro line > first stop is hero with number 00 | The first metro stop is the hero departure | `type` === `'hero'`, `stopNumber` === `'00'`, `id` === `'departure'` | Standard |
| metro line > last stop is terminal | The last metro stop is the terminal | `type` === `'terminal'`, `stopNumber` === `'TERMINAL'` | Standard |
| metro line > service stops have sequential numbering starting from 01 | Service stops are numbered 01, 02, 03... sequentially | Each stop number === `String(i + 1).padStart(2, '0')`, id matches service id | Standard |
| metro line > fixed sections follow services with auto-incremented numbers | Featured, About, Blog stops follow services with correct numbers | Featured/About/Blog stopNumbers match expected auto-increment | Uses `getStopByType()` |
| metro line > every stop has a non-empty English label | All stops have a label for display | `stop.label.en.length` > 0 for all stops | Standard |
| formatStopLabel > formats a numbered stop | A numbered stop gets "STOP NN - LABEL" format | Result matches `/^STOP \d{2} — FEATURED WORK$/` | Standard |
| formatStopLabel > formats terminal stop | The terminal stop has a special format | Result === `'TERMINAL — FINAL DESTINATION'` | Standard |
| formatServicesLabel > includes correct range | The services label shows the correct stop range | Result === `'STOPS 01–NN — SERVICES'` | Standard |

## src/lib/data/metro-network.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| metro-network data integrity > origin node exists | The network has a designated origin/hub node | `getNode(ORIGIN_NODE_ID)` is defined, `type` === `'hub'` | Standard |
| metro-network data integrity > has no duplicate node IDs | All network node IDs are unique | `new Set(ids).size` === `ids.length` | Standard |
| metro-network data integrity > all connection from/to IDs reference existing nodes | No connection references a nonexistent node | Each `conn.from` and `conn.to` found in nodes set | Standard |
| metro-network data integrity > all node coordinates are in 0-100 range | Node positions stay within the normalized coordinate space | `x` and `y` both >= 0 and <= 100 for all nodes | Standard |
| metro-network data integrity > all connection order values are positive integers | Connection ordering is valid | `Number.isInteger(order)` and `order` > 0 for all | Standard |
| metro-network data integrity > has 40+ nodes (dense network) | The network has enough nodes for visual density | `nodes.length` >= 40 | Standard |
| metro-network data integrity > has 6+ line segments | The network has enough connections | `connections.length` >= 6 | Standard |
| metro-network data integrity > getNode returns undefined for missing ID | Looking up a nonexistent node returns undefined | `getNode('nonexistent')` === undefined | Standard |

## src/lib/data/projects.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| getProjectBySlug > returns the project when a valid slug is provided | A known slug returns the matching project | Result is defined, `slug` === `'yesid-dev'` | Standard |
| getProjectBySlug > returns undefined for a slug that does not exist | An unknown slug returns undefined | Result === undefined | `'this-does-not-exist'` |
| getProjectBySlug > returns undefined for an empty string | An empty string slug returns undefined | Result === undefined | `''` |
| getFeaturedProjects > returns only projects where featured is true | All returned projects have featured flag set | `p.featured` === true for all results, length > 0 | Standard |
| getFeaturedProjects > does not include non-featured projects | Non-featured projects are excluded | No non-featured slug appears in featured results | Standard |
| getPublicProjects > excludes private projects | Private projects are filtered out | `p.status` !== `'private'` for all results | Standard |
| getPublicProjects > includes projects with status public | At least one public project exists in results | `some(p => p.status === 'public')` === true | Standard |
| getPublicProjects > includes projects with status wip | Work-in-progress projects are included (not filtered) | Each wip project from seed data appears in results | Standard |
| getAllTags > returns a non-empty array | Tags are collected from all projects | `tags.length` > 0 | Standard |
| getAllTags > returns tags in alphabetical order | Tags are sorted A-Z | `tags` equals `[...tags].sort()` | Standard |
| getAllTags > returns no duplicate tags | Tags are deduplicated | `tags.length` === `new Set(tags).size` | Standard |
| getAllTags > returns no empty strings | No blank tags exist | `tag.trim()` !== `''` for all | Standard |
| getProjectsByService > returns projects linked to a given service ID | Projects related to a service are returned | Length > 0, each has `'sql-development'` in `relatedServices` | `'sql-development'` |
| getProjectsByService > excludes private projects | Private projects don't appear even if related | `p.status` !== `'private'` for all | Standard |
| getProjectsByService > returns empty array for unknown service ID | A nonexistent service returns no results | Result equals `[]` | `'nonexistent'` |
| getServiceIdsForProjects > returns deduplicated sorted service IDs from public projects | Service IDs from public projects are collected, deduped, and sorted | Length > 0, sorted, no duplicates | Standard |

## src/lib/data/schema.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| buildPersonSchema > produces valid JSON | Output is parseable JSON | `JSON.parse(schema)` does not throw | Standard |
| buildPersonSchema > sets @context to schema.org | Schema context is correct | `parsed['@context']` === `'https://schema.org'` | Standard |
| buildPersonSchema > sets @type to Person | Schema type is Person | `parsed['@type']` === `'Person'` | Standard |
| buildPersonSchema > includes owner name | Owner name present | `parsed.name` === `'Yesid O.'` | Standard |
| buildPersonSchema > includes jobTitle from English locale | Job title resolved from en | `parsed.jobTitle` === `'Digital Infrastructure Consultant'` | Standard |
| buildPersonSchema > includes url | Site URL present | `parsed.url` === `'https://yesid.dev'` | Standard |
| buildPersonSchema > includes address with locality, region, country | PostalAddress schema correct | `parsed.address` deep equals expected | Standard |
| buildPersonSchema > includes sameAs array with social links | Social profiles present | `sameAs` contains GitHub and LinkedIn URLs | Standard |
| buildPersonSchema > includes knowsAbout array | Skills listed | `knowsAbout` contains `'PostgreSQL'` and `'dbt'` | Standard |
| buildPersonSchema > includes email | Contact email present | `parsed.email` === `'contact@yesid.dev'` | Standard |

# Motion — Actions (`src/lib/motion/actions/`) — 7 files, 50 tests

## src/lib/motion/actions/boop.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| boop action > returns an object with update and destroy methods | The action returns the Svelte action interface | `typeof result.update` === `'function'`, `typeof result.destroy` === `'function'` | `vi.useFakeTimers()`, `mockMatchMedia(false)` |
| boop action > sets transform on mouseenter | Hovering applies a scale transform | `el.style.transform` contains `'scale(1.05)'` | `scale: 1.05` |
| boop action > resets transform after the timing duration | The transform clears after the specified duration | `el.style.transform` === `''` after 300ms | `timing: 300`, `vi.advanceTimersByTime(300)` |
| boop action > includes rotation in the transform when specified | Rotation is included in the hover transform | `el.style.transform` contains `'rotate(10deg)'` | `rotation: 10` |
| boop action > clears transform on destroy cleanup | Destroying the action cleans up without errors | `action.destroy()` does not throw | Destroy before timeout fires |
| boop action > does nothing when prefers-reduced-motion is on | The boop effect is skipped for accessibility | `el.style.transform` === `''` after mouseenter | `mockMatchMedia(true)` |
| boop action > update() changes the params applied on next hover | Updating params changes the next hover effect | `el.style.transform` contains `'scale(1.2)'` | `action.update({ scale: 1.2 })` then mouseenter |

## src/lib/motion/actions/cursorGlow.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| cursorGlow > sets --glow-x and --glow-y on pointermove | Moving the cursor sets CSS custom properties for the glow position | `--glow-x` === `'150px'`, `--glow-y` === `'40px'` | Mock `getBoundingClientRect`, `PointerEvent` |
| cursorGlow > resets CSS vars on pointerleave | Leaving the element clears the glow position | `--glow-x` === `''`, `--glow-y` === `''` | Dispatch `pointerleave` |
| cursorGlow > returns no-op on touch devices | The glow effect is disabled on touch screens | `--glow-x` === `''` after pointermove | `navigator.maxTouchPoints` = 1 |
| cursorGlow > returns no-op when reduced motion is preferred | The glow effect is disabled for reduced-motion users | `--glow-x` === `''` after pointermove | Mock `isPrefersReducedMotion` returns true |

## src/lib/motion/actions/magnetic.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| magnetic action > returns update and destroy methods | The action returns the Svelte action interface | `typeof result.update` === `'function'`, `typeof result.destroy` === `'function'` | `mockMatchMedia(false)`, `mockTouchDevice(false)` |
| magnetic action > applies transform on mousemove within radius | Moving the cursor near the element pulls it toward the cursor | `el.style.transform` contains `'translate'` | Mock `getBoundingClientRect`, `strength: 3, radius: 50` |
| magnetic action > clears transform on mouseleave | Leaving the element resets its position | `el.style.transform` === `''` | Dispatch `mouseleave` after `mousemove` |
| magnetic action > clears transform on destroy | Destroying the action resets the element | `el.style.transform` === `''` | `action.destroy()` |
| magnetic action > does nothing when reduced motion is on | The magnetic effect is disabled for accessibility | `el.style.transform` === `''` | `mockMatchMedia(true)` |
| magnetic action > does nothing on touch devices | The magnetic effect is disabled on touch screens | `el.style.transform` === `''` | `mockTouchDevice(true)` |

## src/lib/motion/actions/reveal.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| reveal action > returns update and destroy methods | The action returns the Svelte action interface | `typeof result.update` and `typeof result.destroy` === `'function'` | GSAP mocked globally |
| reveal action > calls gsap.from when the action is applied | Applying the reveal action triggers a GSAP animation | `gsap.from` called with the element | Standard |
| reveal action > passes y offset for direction "up" | Revealing from below uses a positive y offset | `vars.y` > 0 | `direction: 'up'` |
| reveal action > passes y offset for direction "down" | Revealing from above uses a negative y offset | `vars.y` < 0 | `direction: 'down'` |
| reveal action > passes x offset for direction "left" | Revealing from the left uses a negative x offset | `vars.x` < 0 | `direction: 'left'` |
| reveal action > passes x offset for direction "right" | Revealing from the right uses a positive x offset | `vars.x` > 0 | `direction: 'right'` |
| reveal action > converts delay from ms to seconds for GSAP | The delay prop is converted from milliseconds to seconds | `vars.delay` close to 0.4 | `delay: 400` |
| reveal action > calls tween.kill() on destroy | Destroying the action kills the GSAP tween | `tween.kill` was called | `action.destroy()` |
| reveal action > skips gsap.from when reduced motion is on | No animation runs for reduced-motion users | `gsap.from` not called | `mockMatchMedia(true)` |
| reveal action > sets element visible when reduced motion is on | The element is immediately shown for reduced-motion users | `el.style.opacity` === `'1'` | `mockMatchMedia(true)` |

## src/lib/motion/actions/ripple.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ripple action > returns update and destroy methods | The action returns the Svelte action interface | `typeof result.update` and `typeof result.destroy` === `'function'` | `vi.useFakeTimers()`, stub `requestAnimationFrame` |
| ripple action > sets position and overflow on the host element | The element gets relative positioning and hidden overflow | `el.style.position` === `'relative'`, `el.style.overflow` === `'hidden'` | Standard |
| ripple action > appends a span child on click | Clicking creates a ripple span element | `el.querySelector('span')` is not null | Mock `getBoundingClientRect`, `MouseEvent` click |
| ripple action > removes the span after the duration | The ripple span is cleaned up after the animation | `el.querySelector('span')` is null after 400ms | `duration: 400`, `vi.advanceTimersByTime(400)` |
| ripple action > does not append a span when reduced motion is on | No ripple appears for reduced-motion users | `el.querySelector('span')` is null after click | `mockMatchMedia(true)` |
| ripple action > uses the brand orange color by default | The ripple uses the brand #E07800 color | `span.style.backgroundColor` contains `#E07800` or `rgb(224, 120, 0)` | Standard |

## src/lib/motion/actions/tilt.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| tilt action > returns update and destroy functions | The action returns the Svelte action interface | `typeof result.update` and `typeof result.destroy` === `'function'` | `mockMatchMedia(false)`, `mockTouchDevice(false)` |
| tilt action > applies 3D transform on mousemove | Moving the cursor over the element applies a perspective tilt | `transform` contains `'perspective'`, `'rotateX'`, `'rotateY'` | Mock `getBoundingClientRect` |
| tilt action > resets transform on mouseleave | Leaving the element removes the tilt | `node.style.transform` === `''` | Dispatch `mouseleave` |
| tilt action > clears transform on destroy | Destroying the action resets the element | `node.style.transform` === `''` | `result.destroy()` |
| tilt action > no-ops when prefers-reduced-motion is set | The tilt effect is disabled for accessibility | `node.style.transform` === `''` after mousemove | `mockMatchMedia(true)` |
| tilt action > no-ops on touch devices | The tilt effect is disabled on touch screens | `node.style.transform` === `''` after mousemove | `mockTouchDevice(true)` |
| tilt action > respects maxDeg parameter | The maximum tilt angle is capped at the specified degrees | `transform` contains `'rotateY(5deg)'` | `maxDeg: 5`, cursor at far edge |
| tilt action > dead zone: cursor at center produces no transform | Centering the cursor on the element produces no tilt | `node.style.transform` === `''` | Cursor at exact center (100, 100) |

## src/lib/motion/actions/wordmarkHover.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| wordmarkHover action > returns an object with a destroy method | Action returns Svelte action interface | `typeof result.destroy` === `'function'` | Mock GSAP/SplitText, `mockMatchMedia(false)` |
| wordmarkHover action > registers GSAP plugins on mount | GSAP plugins initialized | `registerGsapPlugins` called | Dynamic import |
| wordmarkHover action > creates a SplitText instance on the text element | SplitText wraps the text node | `SplitText` called with `(el, { type: 'chars' })` | Dynamic import |
| wordmarkHover action > does nothing when prefers-reduced-motion is on | Animation skipped for accessibility | `SplitText` not called | `mockMatchMedia(true)`, `mockClear()` |
| wordmarkHover action > reverts SplitText on destroy | DOM cleaned up on unmount | `splitInstance.revert` called | `mock.instances[0]` |
| wordmarkHover action > triggers animation on mouseenter | Hover fires GSAP timeline | `gsap.timeline` called after mouseenter | `dispatchEvent(MouseEvent)` |
| wordmarkHover action > accepts autoPlay option to fire on mount | First effect plays immediately | `gsap.timeline` called on init | `autoPlay: true` |

# Motion — Components (`src/lib/motion/components/`) — 2 files, 13 tests

## src/lib/motion/components/LottiePlayer.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| LottiePlayer component > renders a container element with data-testid="lottie-player" | The Lottie container exists in the DOM | `getByTestId('lottie-player')` in document | `src: '/lottie/station-sql.json'` |
| LottiePlayer component > has role="img" for screen reader accessibility | The Lottie container is announced as an image | `getByRole('img')` in document | Standard |
| LottiePlayer component > has an aria-label | The Lottie animation has a text description | `getAttribute('aria-label')` is truthy | Standard |
| LottiePlayer component > accepts src prop without error | A different Lottie source renders without crashing | `render(...)` does not throw | `src: '/lottie/station-pipeline.json'` |
| LottiePlayer component > accepts trigger prop without error | The trigger prop is accepted without errors | `render(...)` does not throw | `trigger: 'scroll'` |
| LottiePlayer component > accepts loop prop without error | The loop prop is accepted without errors | `render(...)` does not throw | `loop: true` |
| LottiePlayer component > accepts speed prop without error | The speed prop is accepted without errors | `render(...)` does not throw | `speed: 0.8` |
| LottiePlayer component > renders the lottie-player div with lottie-player class | The container has the correct CSS class | `el.classList.contains('lottie-player')` === true | Standard |

## src/lib/motion/components/ScrollRail.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| ScrollRail > renders the scroll rail | The scroll rail container exists | `getByTestId('scroll-rail')` in document | Standard |
| ScrollRail > home page (pathname="/") > does not render station dots | Station dots are not shown on the home page (handled elsewhere) | `queryByTestId('station-dot')` not in document | `pathname: '/'` |
| ScrollRail > home page (pathname="/") > does not render the simple progress bar | The progress bar is not shown on the home page | `queryByTestId('scroll-rail-progress')` not in document | `pathname: '/'` |
| ScrollRail > non-home page (pathname="/work") > renders a progress bar | A scroll progress indicator appears on subpages | `getByTestId('scroll-rail-progress')` in document | `pathname: '/work'` |
| ScrollRail > non-home page (pathname="/work") > does not render station dots | Station dots are not shown on subpages | `queryByTestId('station-dot')` not in document | `pathname: '/work'` |

# Motion — Stores (`src/lib/motion/stores/`) — 2 files, 16 tests

## src/lib/motion/stores/reducedMotion.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| prefersReducedMotion store > is a readable store with a subscribe method | The store has the standard Svelte readable interface | `typeof subscribe` === `'function'` | `mockMatchMedia(false)` |
| prefersReducedMotion store > returns false when reduced motion is not set | Default OS setting (no preference) returns false | `get(store)` === false | `mockMatchMedia(false)` |
| prefersReducedMotion store > returns true when OS reduced-motion preference is on | Enabling OS reduced motion is detected | `get(store)` === true | `mockMatchMedia(true)`, `vi.resetModules()` |
| prefersReducedMotion store > registers a change event listener for reactivity | The store listens for OS preference changes | `mql.addEventListener` called with `'change'` and a function | Subscribe to trigger setup |
| prefersReducedMotion store > removes the change listener on unsubscribe | Unsubscribing cleans up the OS listener | `mql.removeEventListener` called with `'change'` | `unsub()` |
| isPrefersReducedMotion helper > returns a boolean | The helper returns a boolean type | `typeof result` === `'boolean'` | Standard |
| isPrefersReducedMotion helper > returns false when reduced motion is off | The helper correctly reports no preference | Result === false | `mockMatchMedia(false)` |
| isPrefersReducedMotion helper > returns true when reduced motion is on | The helper correctly reports the preference | Result === true | `mockMatchMedia(true)` |

## src/lib/motion/stores/scroll.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| scrollProgress store > is a readable store with a subscribe method | The store has the standard Svelte readable interface | `typeof subscribe` === `'function'` | Stubs `requestAnimationFrame`, `setScrollState(0, 1000, 600)` |
| scrollProgress store > returns a number | The store value is a number type | `typeof value` === `'number'` | Standard |
| scrollProgress store > returns 0 when at the top of the page | No scroll means 0% progress | `get(store)` === 0 | `scrollY: 0` |
| scrollProgress store > returns 1 when scrolled to the bottom | Full scroll means 100% progress | `get(store)` === 1 | `scrollY: 400, scrollHeight: 1000, innerHeight: 600` |
| scrollProgress store > returns 0.5 when scrolled halfway | Half scroll means 50% progress | `get(store)` === 0.5 | `scrollY: 200` |
| scrollProgress store > returns 0 when content fits viewport | No scrollbar means 0% progress | `get(store)` === 0 | `scrollHeight === innerHeight` |
| scrollProgress store > returns a value between 0 and 1 | Progress is always clamped to [0, 1] | Value >= 0 and <= 1 | `scrollY: 100` |
| scrollProgress store > updates when a scroll event fires | Dispatching a scroll event updates the progress | `get(store)` close to 0.5 after scrolling | `window.dispatchEvent(new Event('scroll'))` |

# Motion — SVG (`src/lib/motion/svg/`) — 4 files, 22 tests

## src/lib/motion/svg/MetroNetwork.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| MetroNetwork > renders the container div | The metro network container element exists | `querySelector('[data-testid="metro-network-container"]')` in document | SVG is fetched async — unit test only verifies container |

## src/lib/motion/svg/Train.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| Train SVG component > renders without crashing | The Train SVG mounts without errors | `render(Train)` does not throw | Standard |
| Train SVG component > SVG has id="yesid-train" | The root SVG has the expected id | `querySelector('#yesid-train')` is in document, tag is `'svg'` | Standard |
| Train SVG component > all 7 animated group ids are present | All animation target groups exist in the SVG | Each of 7 ids (`train-glow`, `train-body`, etc.) found in document | Standard |
| Train SVG component > trainClass prop is applied to the svg element | A custom class can be added to the SVG | SVG `classList.contains('my-custom-class')` === true | `trainClass: 'my-custom-class'` |
| Train SVG component > aria-hidden is "true" | The decorative SVG is hidden from screen readers | `getAttribute('aria-hidden')` === `'true'` | Standard |
| Train SVG component > TRAIN_TARGETS selectors all resolve to at least 1 element | All selectors in the TRAIN_TARGETS map match DOM elements | Each selector resolves to >= 1 element | Imports `TRAIN_TARGETS` |
| Train SVG component > has 3 radial gradient defs with train- prefix | The SVG defines 3 radial gradients for lighting | 3 `radialGradient` elements, all ids start with `'train-'` | Standard |
| Train SVG component > has 4 wheel groups (12 circles total in #train-wheels) | The wheel geometry is correct (4 wheels x 3 concentric circles) | `#train-wheels circle` count === 12 | Standard |

## src/lib/motion/svg/TrainJourney.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| TrainJourney > renders without crashing | The TrainJourney component mounts without errors | `render(TrainJourney)` does not throw | Standard |
| TrainJourney > has data-testid="train-journey" | The journey wrapper has the correct testid | `querySelector('[data-testid="train-journey"]')` in document | Standard |
| TrainJourney > contains the top-down train SVG | An SVG element exists inside the journey container | `querySelector('[data-testid="train-journey"] svg')` in document | Standard |
| TrainJourney > renders train wrapper element | A wrapper div contains the Train SVG | `querySelector('[data-testid="train-journey"] > div')` in document | Standard |

## src/lib/motion/svg/train-path.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| getTrainMotionPath > returns a string starting with M (valid SVG path) | The generated path is valid SVG | Result matches `/^M /` | `getTrainMotionPath(4)` |
| getTrainMotionPath > works for 4 stations (default) | The path includes curve commands for 4 stations | Path contains `'C '` and `'S '` | Standard |
| getTrainMotionPath > works for 1 station | A single station generates a valid path | Result matches `/^M /` and contains `'C '` | `getTrainMotionPath(1)` |
| getTrainMotionPath > works for 8 stations | More stations produce more smooth curve segments | Count of `' S '` === 8 | `getTrainMotionPath(8)` |
| getTrainMotionPath > starts off-screen top (negative y) | The path begins above the viewport | First y coordinate < 0 | Standard |
| getTrainMotionPath > ends off-screen bottom (y > height) | The path ends below the viewport | Last y coordinate > height | `height: 1080` |
| getTrainMotionPath > x coordinates stay near right edge | The train path runs along the right side of the screen | All x values between 80% and 100% of width | `width: 1920` |
| getTrainMotionPath > accepts custom dimensions | Custom width and height work without errors | Result matches `/^M /` | `getTrainMotionPath(4, 1000, 500)` |
| getTrainMotionPath > handles 0 stations (just start and end) | Zero stations produces a simple line | Path contains `'L '` | `getTrainMotionPath(0)` |

# Motion — Utils (`src/lib/motion/utils/`) — 2 files, 19 tests

## src/lib/motion/utils/gsap.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| registerGsapPlugins > calls gsap.registerPlugin on first call | Plugin registration is triggered on first use | `gsap.registerPlugin` called 1 time | `vi.resetModules()` for fresh import |
| registerGsapPlugins > passes all plugins to registerPlugin | All 7 GSAP plugins are registered together | Called with ScrollTrigger, MotionPathPlugin, DrawSVGPlugin, CustomEase, SplitText, MorphSVGPlugin, Flip | Standard |
| registerGsapPlugins > is idempotent — calling twice only registers once | Multiple calls don't re-register | `gsap.registerPlugin` called exactly 1 time after 2 calls | Standard |
| registerGsapPlugins > re-exports gsap | The gsap instance is re-exported from the wrapper | `gsap` is defined | Standard |
| registerGsapPlugins > re-exports ScrollTrigger | ScrollTrigger is re-exported from the wrapper | `ScrollTrigger` is defined | Standard |
| registerGsapPlugins > re-exports MotionPathPlugin | MotionPathPlugin is re-exported from the wrapper | `MotionPathPlugin` is defined | Standard |
| registerGsapPlugins > re-exports DrawSVGPlugin | DrawSVGPlugin is re-exported from the wrapper | `DrawSVGPlugin` is defined | Standard |
| registerGsapPlugins > re-exports CustomEase | CustomEase is re-exported from the wrapper | `CustomEase` is defined | Standard |
| registerGsapPlugins > re-exports SplitText | SplitText is re-exported from the wrapper | `SplitText` is defined | Standard |
| registerGsapPlugins > re-exports MorphSVGPlugin | MorphSVGPlugin is re-exported from the wrapper | `MorphSVGPlugin` is defined | Standard |
| registerGsapPlugins > re-exports Flip | Flip is re-exported from the wrapper | `Flip` is defined | Standard |

## src/lib/motion/utils/stagger.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| stagger utility > returns 0 for index 0 regardless of baseDelay | The first element always animates instantly | `stagger(0, 80)` === 0 and `stagger(0, 120)` === 0 | `randomize: false` |
| stagger utility > returns baseDelay * index when randomize is false | Deterministic delays are linearly proportional to index | `stagger(1, 80)` === 80, `stagger(2, 80)` === 160, `stagger(3, 80)` === 240 | `randomize: false` |
| stagger utility > returns 0 for index 0 even with randomization enabled | The first element is instant even with randomization | Result >= 0 | Default (randomize: true) |
| stagger utility > randomized result stays within +/- randomRange of deterministic value | Randomized delays stay within the configured variance | Result within `deterministic ± baseDelay * randomRange` across 100 iterations | `randomRange: 0.15` |
| stagger utility > never returns a negative value | Stagger delays are always non-negative | Result >= 0 across 200 iterations | Standard |
| stagger utility > returns 0 when baseDelay is 0 | Zero base delay means zero delay for all indices | `stagger(5, 0)` === 0 | Standard |
| stagger utility > respects a custom randomRange option | A tighter randomRange reduces variance | Result within `deterministic ± 5` across 100 iterations | `randomRange: 0.05` |
| stagger utility > defaults to randomize: true | Without options, delays vary between calls | 50 calls produce > 1 distinct value for index 3 | Default options |

# Routes (`src/routes/`) — 2 files, 23 tests

## src/routes/error.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| 404 Error Page > renders the construction scene | The SVG construction illustration exists | `getByTestId('construction-scene')` in document | Renders `+error.svelte` |
| 404 Error Page > renders the ROUTE NOT FOUND label | The error label text is visible | `getByText('ROUTE NOT FOUND')` in document | Standard |
| 404 Error Page > renders the heading | The main heading text is visible | `getByText('This station is under construction')` in document | Standard |
| 404 Error Page > renders route suggestion links | All 3 suggestion buttons have correct hrefs | Services→`/services`, Work→`/work`, Contact→`/contact` | Standard |
| 404 Error Page > renders the terminal status line | The terminal decoration exists | `getByTestId('terminal-line')` in document | Standard |
| 404 Error Page > renders hazard tape accents | Both top and bottom hazard tapes exist | `getAllByTestId('hazard-tape')` length === 2 | Standard |

## src/routes/home.test.ts

| Test Name (describe > it) | What It Validates | Key Assertions | Setup Notes |
|---------------------------|-------------------|----------------|-------------|
| Home page > renders the app root | Page root container exists | `getByTestId('app-root')` | Standard |
| Home page > renders the hero banner | Hero section exists | `getByTestId('hero-banner')` | Standard |
| Home page > renders the metro network container in the hero | Metro SVG container exists | `getByTestId('metro-network-container')` | Standard |
| Home page > renders the hero headline | Two-line headline rendered | `hero-line1` contains `'PIPELINES THAT'`, `hero-line2` contains `"DON'T BREAK"` | Standard |
| Home page > renders the hero orange dot | Brand dot is an SVG element | `hero-dot` tagName is `svg` | Standard |
| Home page > renders hero subheadline | Subheadline text rendered | `hero-subheadline` contains `'Data that tell the truth'` | Standard |
| Home page > renders hero subtitle | Subtitle text rendered | `hero-subtitle` contains `'reliable infrastructure'` | Standard |
| Home page > renders hero CTAs | Work and contact buttons exist | `hero-cta-work`, `hero-cta-contact` | Standard |
| Home page > renders hero metric cards | 3 metric cards rendered | `hero-metrics` + `getAllByTestId('metric-card')` length 3 | Standard |
| Home page > renders hero SQL panel | SQL panel(s) rendered with query | `getAllByTestId('sql-panel')` >= 1, query contains `'SELECT'` | Desktop + mobile panels |
| Home page > renders hero refresh button | Refresh button exists | `getByTestId('hero-refresh')` | Standard |
| Home page > renders the hard-cut transition | Von Restorff divider exists | `getByTestId('hard-cut')` | Standard |
| Home page > renders the manifesto section | Manifesto section exists | `getByTestId('manifesto-section')` | Standard |
| Home page > renders manifesto capability pills | 5 capability pills rendered | `getAllByTestId('manifesto-pill')` length 5 | Standard |
| Home page > renders the proof reel section | Proof reel section exists | `getByTestId('proof-reel-section')` | Standard |
| Home page > renders 3 proof reel cards | 3 project cards rendered | `getAllByTestId('proof-card')` length 3 | Standard |
| Home page > renders the services section | Services section exists | `getByTestId('services-section')` | Standard |
| Home page > renders 6 service cards | 6 service cards rendered | `getAllByTestId('services-card')` length 6 | Standard |
| Home page > renders service benefit headlines | 6 benefit headlines rendered | `getAllByTestId('services-benefit')` length 6 | Standard |

---

## Test Run Summary

```
Runner:     Vitest v4.1.2
Timestamp:  2026-04-09 11:52
Duration:   8.40s

Test Files:  57 passed (57)
Tests:       525 passed (525)
Failures:    0
```
