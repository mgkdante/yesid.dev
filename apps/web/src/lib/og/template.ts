// Satori accepts a plain-object tree shaped like React.createElement output —
// no JSX runtime needed. We construct POJOs directly. Layout mirrors the
// SVG in scripts/generate-og-default.ts (dark background, wordmark + dot
// accent, eyebrow chip, footer rail with accent bar) but swaps the tagline
// slot for the per-content title.

export interface OgTreeInput {
  eyebrow: string; // 'BLOG' or 'PROJECT'
  title: string;
}

const BG = '#141414';
const ACCENT = '#E07800';
const TEXT_PRIMARY = '#F5F5F5';
const TEXT_MUTED = '#9CA3AF';
const FOOTER_LOCATION = 'Montréal · QC';
const SITE_HANDLE = 'yesid.dev';
const WORDMARK = 'yesid';

function el(
  type: string,
  props: Record<string, unknown>,
  children?: unknown,
): Record<string, unknown> {
  return { type, props: { ...props, children } };
}

export function buildOgTree(input: OgTreeInput): unknown {
  const { eyebrow, title } = input;

  return el(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        backgroundColor: BG,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        fontFamily: 'Inter',
        color: TEXT_PRIMARY,
      },
    },
    [
      // Top: eyebrow chip (mono uppercase, accent color)
      el(
        'div',
        {
          style: {
            fontFamily: 'JetBrains Mono',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: ACCENT,
          },
        },
        eyebrow,
      ),

      // Middle: wordmark + title stack
      el(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          },
        },
        [
          // Wordmark (Inter Black, accent dot)
          el(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                fontFamily: 'Inter',
                fontWeight: 900,
                fontSize: '180px',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              },
            },
            [
              el('span', { style: { color: TEXT_PRIMARY } }, WORDMARK),
              el('span', { style: { color: ACCENT } }, '.'),
            ],
          ),

          // Title (Inter Medium, muted)
          el(
            'div',
            {
              style: {
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '48px',
                letterSpacing: '-0.01em',
                color: TEXT_MUTED,
                maxWidth: '1040px',
                lineHeight: 1.15,
              },
            },
            title,
          ),
        ],
      ),

      // Bottom rail: accent bar + handle (left) / location (right)
      el(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontFamily: 'JetBrains Mono',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: TEXT_MUTED,
          },
        },
        [
          el(
            'div',
            {
              style: { display: 'flex', flexDirection: 'column', gap: '16px' },
            },
            [
              el(
                'div',
                {
                  style: {
                    width: '120px',
                    height: '3px',
                    backgroundColor: ACCENT,
                  },
                },
                '',
              ),
              el('span', {}, SITE_HANDLE),
            ],
          ),
          el('span', {}, FOOTER_LOCATION),
        ],
      ),
    ],
  );
}
