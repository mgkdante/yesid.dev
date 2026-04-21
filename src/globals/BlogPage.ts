import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const BlogPage: GlobalConfig = {
  slug: 'blog-page',
  admin: {
    group: 'Pages',
    description:
      '/blog route — listing page chrome (professional + personal streams) + detail page chrome.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'listing',
      type: 'group',
      admin: {
        description:
          'Blog listing page chrome (BlogListingPage, BlogFilterMobile, BlogFilterSidebar, BlogRouteMap).',
      },
      fields: [
        { name: 'mobileHeading', type: 'text', required: true, localized: true },
        { name: 'searchPlaceholder', type: 'text', required: true, localized: true },
        { name: 'resultNoun', type: 'text', required: true, localized: true },
        { name: 'noPostsMessage', type: 'text', required: true, localized: true },
        {
          name: 'filters',
          type: 'group',
          fields: [
            { name: 'filtersLabel', type: 'text', required: true, localized: true },
            { name: 'allLabel', type: 'text', required: true, localized: true },
            { name: 'language', type: 'text', required: true, localized: true },
            { name: 'dateRange', type: 'text', required: true, localized: true },
            { name: 'from', type: 'text', required: true, localized: true },
            { name: 'to', type: 'text', required: true, localized: true },
            { name: 'tags', type: 'text', required: true, localized: true },
            {
              name: 'showingPrefix',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Prefix before the active filter label in mobile status.' },
            },
          ],
        },
        {
          name: 'routeMap',
          type: 'group',
          fields: [
            { name: 'title', type: 'text', required: true, localized: true },
            { name: 'terminus', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
    {
      name: 'detail',
      type: 'group',
      admin: {
        description:
          'Blog detail page chrome (BlogContent, BlogDetailHeader, BlogDetailPage, BlogTocPill).',
      },
      fields: [
        {
          name: 'code',
          type: 'group',
          admin: { description: 'Code block copy-button chrome.' },
          fields: [
            { name: 'copyAria', type: 'text', required: true, localized: true },
            { name: 'copyLabel', type: 'text', required: true, localized: true },
            { name: 'errorLabel', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'backNav',
          type: 'group',
          admin: { description: 'Back-nav link text in BlogDetailHeader, varies by category.' },
          fields: [
            { name: 'toPersonal', type: 'text', required: true, localized: true },
            { name: 'toDispatches', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'header',
          type: 'group',
          fields: [
            { name: 'postTagsAria', type: 'text', required: true, localized: true },
            {
              name: 'readingTimeLabel',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Reading-time suffix. Template: "{minutes} min read".' },
            },
          ],
        },
        {
          name: 'page',
          type: 'group',
          admin: { description: 'Desktop TOC toggle labels + metadata panel column labels.' },
          fields: [
            { name: 'readingMode', type: 'text', required: true, localized: true },
            { name: 'tocSectionTitle', type: 'text', required: true, localized: true },
            { name: 'metaCategory', type: 'text', required: true, localized: true },
            { name: 'metaWords', type: 'text', required: true, localized: true },
            { name: 'metaReadTime', type: 'text', required: true, localized: true },
            { name: 'metaLanguage', type: 'text', required: true, localized: true },
            { name: 'metaTags', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'tocPill',
          type: 'group',
          admin: { description: 'Mobile table-of-contents pill button labels.' },
          fields: [
            { name: 'openAria', type: 'text', required: true, localized: true },
            { name: 'closeAria', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
  ],
}
