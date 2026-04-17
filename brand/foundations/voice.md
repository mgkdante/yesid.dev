# foundations / voice

> The short form lives in `BRAND.md § Tone`. This is the long form — UX copy patterns, extended vocabulary, voice samples from the live site. Cross-link to `BRAND.md` for the spine.

## Posture

Write the way a senior engineer would write a transit safety notice: declarative, short, the reader knows what to do after the sentence. Adjectives are the enemy. When a number matters, show the number.

The site talks to two audiences at once — a hiring manager at Alto or CDPQ Infra looking for infrastructure competence, and a freelance client looking for a specific problem solved. The voice works for both because it says what the work is, not how it feels.

## Vocabulary — the long list

| Preferred | Avoid | Why |
|---|---|---|
| digital infrastructure | data engineering / data solutions | Broader practice. Signals durable systems. |
| projects | work / portfolio pieces | Specific and countable. |
| services | offerings / solutions / packages | Direct. No upsell language. |
| pipeline | workflow / process | Pipelines move data; workflows schedule. Name the specific one. |
| shipped | delivered / rolled out / launched | Honest about a state change. |
| built | crafted / curated / engineered | Result over posture. |
| broke X | issue / defect / incident | In post-incident copy, be direct. |
| migration | cutover / transition / modernisation | The operation, not the narrative. |
| query | ask / request (in DB context) | Database-specific. |
| reduce / remove | simplify / streamline / consolidate | Name what was cut. |
| docs / spec | documentation / specification | Shorter word wins. |
| yesid. | Yesid / YESID / Yesid. | Always lowercase. Always ends in a dot. The dot is always orange. |
| the dot is always orange | "accent dot" | A constraint, not a styling choice. |
| Montreal | the Montreal region / Québec / Quebec City | Be specific. |
| 3x faster | significantly faster / much faster | Show the number. |
| clients + employers | audience / users / stakeholders | Specific about who. |

## UX copy patterns

### Button labels

Actions, not nouns.

| Good | Bad |
|---|---|
| Deep dive → | Learn more |
| Send | Submit |
| Open contact | Contact us |
| See projects | View portfolio |

### Empty states

Say what's missing and what to do, not an apology.

| Good | Bad |
|---|---|
| No projects match these filters. Clear to see all. | Sorry, nothing here! |
| The form has no data yet. Fill it in to send. | Oops, your form is empty |

### Error states

Name the cause. Offer the next step.

| Good | Bad |
|---|---|
| Weather fetch failed. Check network or try again. | Something went wrong. |
| This blog post doesn't exist. Back to the index. | 404 Not Found |

### Metrics

Number first, label second, both on one line when space allows.

```
3x faster   AVG QUERY IMPROVEMENT
```

Never:

```
Achieved approximately 3 times query improvement
```

### Section labels

Monospace, uppercase, `--primary` accent on the prefix.

```
// 03     PROJECTS
// 02     MANIFESTO
SERVICE 01 / 06
STOP 00 — IDENTITY
```

The prefix is structural — section number, service position, stop in a sequence. The label names the content.

## Voice samples from the live site

### Hero (home)

> yesid.
> building pipelines that don't break.

Three lines. One noun, one verb, one outcome. No adjectives. The dot is orange.

### Manifesto

> If it moves, we break it. If it breaks, we ship it. If it ships, we watch it.

Cadence matters. The three clauses scale with the three activities of the practice: motion, failure, observation.

### Service card (service 01)

> SQL Development & Optimization.
> Queries that run in seconds, not minutes.
> Write, refactor, and tune SQL queries across PostgreSQL and SQL Server. From complex reporting queries to stored procedures, built for correctness and performance.
> [ PostgreSQL ] [ SQL Server ] [ T-SQL ] [ PL/pgSQL ]
> 3x faster   AVG QUERY IMPROVEMENT

Headline → outcome → how → stack → proof. Five lines do the work of a 200-word brochure.

### Contact page

> let's build something that doesn't break.
> Available for freelance work. Based in Montreal.

The "available" state is a one-liner at the top of the page, not a button. Geography is a fact, not marketing.

## Do / don't

1. **Do** name the thing. Don't hide behind adjectives.
2. **Do** show the number when a number matters. Metrics are the brand voice.
3. **Do** keep "yesid." lowercase. Never capitalize. Never drop the dot. Never recolor the dot.
4. **Don't** use marketing adjectives — *seamless*, *modern*, *robust*, *elegant*, *powerful*, *intuitive*, *innovative*. The work demonstrates these; the copy does not claim them.
5. **Don't** apologize in empty or error states. Say what's missing and what to do.
6. **Don't** write copy in sentences where a table or list would read faster.
7. **Don't** translate technical terms into consumer terms unless a specific audience requires it. Hiring managers at infrastructure companies are the primary readers; over-translating makes the site read younger than the work is.

## When to cross-link

This file narrates tone and vocabulary. For:

- The numbered principles — `BRAND.md`.
- Color token names used in "the dot is always orange" — `foundations/color.md`.
- Accessible copy + screen-reader conventions — `foundations/accessibility.md`.
- Why the voice is what it is historically — `decisions/2026-04-what-i-killed.md` (what was rejected defines the voice too).
