# yesid.dev
Yesid's studio site: projects, services, writing and contact, in English, French and Spanish.

## Language

**Site page**:
A route of the site that the site pages registry has switched on (published) or off. "Published" describes site pages only.
_Avoid_: route, live page

**Available**:
An entity is available in a locale when its site page is published and its status and locale allow it: listed, linked, in the sitemap and in llms.txt.
_Avoid_: published (for entities), visible, live

**Project status**:
Whether a project is public, wip or private. Public and wip projects are available; private ones never are.
_Avoid_: visibility

**Wip project**:
A project that is available but still in progress, and is always labelled as such.
_Avoid_: draft, unfinished

**LIVE hero reading**:
The hero's last complete reading from Transit, with its age still advancing. One failed check may retain that reading; a second consecutive failure switches to DEMO.
_Avoid_: real-time guarantee, fresh on every check

**DEMO hero reading**:
Clearly labelled generated example numbers, used before a usable live reading or after the live failure budget is exhausted.
_Avoid_: cached real data, zero activity

**Impact proof**:
An optional public source and/or as-of date attached to an impact metric. The date says when the number was true; an uncited metric is allowed.
_Avoid_: verified result, record edit date

**Publish site**:
The editor's deliberate request to rebuild the production site from saved content. Saving content alone does not publish it to the site.
_Avoid_: save, automatic deployment

**Publish feedback**:
A CMS notice reporting whether the public build version changed after a Publish request. A change does not prove that this request caused it.
_Avoid_: deployment attribution, guaranteed completion

**Sync identity**:
A stable identity linking a declared CMS configuration row to its environment-specific row. It is separate from that row's local identity.
_Avoid_: local ID, content ID
