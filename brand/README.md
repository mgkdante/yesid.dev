# yesid. brand assets

**Tagline:** Data infrastructure that moves.
**Adjectives:** Progressive. Bold. Reliable.

## Files

| File | Purpose |
|------|---------|
| `colors.json` | Color palette, all themes. Use in scripts, configs, CI. |
| `tokens.css` | CSS custom properties. Drop into any web project. |
| `tokens.json` | W3C design tokens format. For Figma plugins and design tools. |
| `tailwind.brand.js` | Tailwind config extension. Import into your tailwind.config. |
| `logo-wordmark-dark.svg` | Full wordmark for dark backgrounds. |
| `logo-wordmark-light.svg` | Full wordmark for light backgrounds. |
| `logo-monogram-dark.svg` | "Y" icon on dark rounded square. |
| `logo-monogram-light.svg` | "Y" icon on light rounded square. |
| `logo-monogram-orange.svg` | White "Y" on orange rounded square. |
| `favicon.svg` | Browser tab icon. Transparent background. |
| `yesid_brand_guide.pdf` | Full brand guide (7 pages). The source of truth. |

## Font dependencies

All SVG logos require **Inter** (weight 700) to render correctly.
Install via Google Fonts: https://fonts.google.com/specimen/Inter

Code blocks use **JetBrains Mono**: https://fonts.google.com/specimen/JetBrains+Mono

## Quick start (web project)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="tokens.css">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
```

## Quick start (Tailwind)

```js
// tailwind.config.js
import brandConfig from './brand/tailwind.brand.js';

export default {
  ...brandConfig,
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
};
```

## Logo usage rules

- The dot is always `#E07800`. No exceptions.
- Minimum clear space: height of the lowercase "y".
- Wordmark is always lowercase.
- Minimum display size: wordmark 16px, monogram 24px.
- Never stretch, rotate, skew, or add effects.

## Version

v1.0 / April 2026
