import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ServicesPage: GlobalConfig = {
  slug: 'services-page',
  admin: {
    group: 'Pages',
    description: '/services route — listing page intro + listing chrome + detail page chrome.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    {
      name: 'meta',
      type: 'group',
      admin: { description: 'HTML <title> + <meta description> for /services.' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'listing',
      type: 'group',
      admin: {
        description: 'Services listing page chrome (ServiceListingPage, ServiceCard, ProjectsStrip).',
      },
      fields: [
        { name: 'heading', type: 'text', required: true, localized: true },
        {
          name: 'stationLabelTemplate',
          type: 'text',
          required: true,
          localized: true,
          admin: { description: 'Template: "Service {stationNum} / {totalStr}".' },
        },
        { name: 'deepDiveLabel', type: 'text', required: true, localized: true },
        {
          name: 'projectsStrip',
          type: 'group',
          fields: [
            {
              name: 'builtWithService',
              type: 'text',
              required: true,
              localized: true,
              admin: { description: 'Template with {serviceTitle} placeholder.' },
            },
            { name: 'builtWithFallback', type: 'text', required: true, localized: true },
            { name: 'projectSingular', type: 'text', required: true, localized: true },
            { name: 'projectPlural', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
    {
      name: 'detail',
      type: 'group',
      admin: {
        description: 'Service detail page chrome (ServiceDetailPage, ServiceNav).',
      },
      fields: [
        { name: 'backToServicesLabel', type: 'text', required: true, localized: true },
        { name: 'valuePropositionHeading', type: 'text', required: true, localized: true },
        { name: 'deliverablesHeading', type: 'text', required: true, localized: true },
        { name: 'relatedProjectsHeading', type: 'text', required: true, localized: true },
        { name: 'relatedProjectsNavAria', type: 'text', required: true, localized: true },
        { name: 'serviceNavAria', type: 'text', required: true, localized: true },
      ],
    },
  ],
}
