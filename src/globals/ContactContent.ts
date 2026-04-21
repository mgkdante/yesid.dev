import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'

export const ContactContent: GlobalConfig = {
  slug: 'contact-content',
  admin: { group: 'Pages', description: '/contact page — form terminals, validation, success states, socials.' },
  access: {
    read: () => true,
    update: ({ req }) => isAdmin(req.user),
  },
  fields: [
    { name: 'pageTitle', type: 'text', required: true, localized: true },
    { name: 'stationLabel', type: 'text', required: true, localized: true },
    { name: 'sendErrorMessage', type: 'text', required: true, localized: true },
    {
      name: 'meta',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'infoTerminal',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true, admin: { description: 'Terminal window title, brand-canonical across locales.' } },
        { name: 'command', type: 'text', required: true },
        { name: 'location', type: 'text', required: true, localized: true },
        { name: 'responseTime', type: 'text', required: true, localized: true },
        {
          name: 'sectionLabels',
          type: 'group',
          fields: [
            { name: 'location', type: 'text', required: true, localized: true },
            { name: 'connect', type: 'text', required: true, localized: true },
          ],
        },
      ],
    },
    {
      name: 'formTerminal',
      type: 'group',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'command', type: 'text', required: true },
        { name: 'commandOutput', type: 'text', required: true, localized: true },
        {
          name: 'fields',
          type: 'group',
          fields: [
            {
              name: 'name',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'placeholder', type: 'text', required: true, localized: true },
              ],
            },
            {
              name: 'email',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'placeholder', type: 'text', required: true, localized: true },
              ],
            },
            {
              name: 'message',
              type: 'group',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'placeholder', type: 'text', required: true, localized: true },
              ],
            },
          ],
        },
        { name: 'submitLabel', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'validation',
      type: 'group',
      fields: [
        { name: 'required', type: 'text', required: true, localized: true, admin: { description: 'Template with {field} placeholder.' } },
        { name: 'invalidEmail', type: 'text', required: true, localized: true },
        { name: 'errorSummary', type: 'text', required: true, localized: true, admin: { description: 'Template with {count} placeholder.' } },
      ],
    },
    {
      name: 'success',
      type: 'group',
      fields: [
        { name: 'validating', type: 'text', required: true, localized: true },
        { name: 'sending', type: 'text', required: true, localized: true },
        { name: 'sent', type: 'text', required: true, localized: true },
        { name: 'responseTime', type: 'text', required: true, localized: true },
        { name: 'meanwhile', type: 'text', required: true, localized: true, admin: { description: 'Template with {work} + {blog} link placeholders.' } },
        { name: 'resetLabel', type: 'text', required: true, localized: true },
        { name: 'fieldOk', type: 'text', required: true, localized: true },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'icon', type: 'text', required: true },
      ],
    },
    { name: 'web3formsKey', type: 'text', required: true, admin: { description: 'Public web3forms endpoint ID. Not a secret (per spec Q8) despite the name.' } },
  ],
}
