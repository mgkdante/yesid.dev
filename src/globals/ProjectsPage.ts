import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ProjectsPage: GlobalConfig = {
  slug: 'projects-page',
  admin: {
    group: 'Pages',
    description: '/projects route — listing page intro + listing chrome + detail page chrome.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'meta',
      type: 'group',
      admin: { description: 'HTML <title> + <meta description> for /projects.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'listing',
      type: 'group',
      admin: {
        description:
          'Projects listing page chrome (ProjectListingPage, ProjectFilterMobile, ProjectFilterSidebar, ProjectCard).',
      },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        { name: 'searchPlaceholder', type: 'text', required: true, localized: true },
        {
          name: 'seeAllLink',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: '"See all projects →" link — used from service detail pages.' },
        },
        {
          name: 'filters',
          type: 'group',
          fields: [
            { name: 'filtersLabel', type: 'text', required: true, localized: true },
            { name: 'services', type: 'text', required: true, localized: true },
            { name: 'tags', type: 'text', required: true, localized: true },
            { name: 'techStack', type: 'text', required: true, localized: true },
            { name: 'allLabel', type: 'text', required: true, localized: true },
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
          name: 'card',
          type: 'group',
          fields: [
            {
              name: 'stackOverflowSuffix',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Suffix after the first N stack items. Template: "+{count} more".' },
            },
          ],
        },
      ],
    },
    {
      name: 'detail',
      type: 'group',
      admin: {
        description:
          'Project detail page chrome (ProjectDetailHeader, ProjectDetailPage, ProjectGlancePanel, ProjectTocPill).',
      },
      fields: [
        { name: 'backToListingLabel', type: 'text', required: true, localized: true },
        { name: 'tocSectionTitle', type: 'text', required: true, localized: true },
        { name: 'readmeSectionTitle', type: 'text', required: true, localized: true },
        {
          name: 'glance',
          type: 'group',
          admin: { description: 'Glance panel (desktop sidebar + mobile collapsible) section headings.' },
          fields: [
            { name: 'overview', type: 'text', required: true, localized: true },
            { name: 'impact', type: 'text', required: true, localized: true },
            { name: 'stack', type: 'text', required: true, localized: true },
            { name: 'services', type: 'text', required: true, localized: true },
            { name: 'links', type: 'text', required: true, localized: true },
            {
              name: 'projectInfo',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Mobile-only rolled-up heading.' },
            },
            { name: 'liveSiteLabel', type: 'text', required: true, localized: true },
            {
              name: 'liveSiteLabelMobile',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Mobile variant: "↗ Live Site".' },
            },
            { name: 'githubLabel', type: 'text', required: true, localized: true },
          ],
        },
        {
          name: 'tocPill',
          type: 'group',
          fields: [
            { name: 'openAria', type: 'text', required: true, localized: true },
            { name: 'closeAria', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
  ],
}
