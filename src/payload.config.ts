import path from 'path'
import { fileURLToPath } from 'url'

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { resendAdapter } from '@payloadcms/email-resend'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { migrations } from '../migrations'
import { TechStack } from './collections/TechStack'
import { BlogPosts } from './collections/BlogPosts'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { SiteMeta } from './globals/SiteMeta'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: { titleSuffix: ' — yesid.dev CMS' },
    theme: 'dark',
  },
  editor: lexicalEditor(),
  collections: [TechStack, BlogPosts, Users, Media],
  globals: [SiteMeta],
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
    fallback: true,
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? process.env.DATABASE_URL ?? '',
    },
    push: false,
    migrationDir: path.resolve(dirname, '..', 'migrations'),
    prodMigrations: migrations,
  }),
  email: resendAdapter({
    defaultFromAddress: 'no-reply@cms.yesid.dev',
    defaultFromName: 'yesid.dev CMS',
    apiKey: process.env.RESEND_API_KEY ?? '',
  }),
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: {
        // media: true  ← uncommented in Slice 18b when uploads flip to Vercel Blob
      },
      token: process.env.BLOB_READ_WRITE_TOKEN ?? '',
    }),
    // D12 — Payload MCP plugin. Exposes site-meta as find/update tool at /api/mcp.
    // Each content collection added in 18b registers its own entry here.
    mcpPlugin({
      collections: {
        'tech-stack': {
          enabled: { find: true, update: true },
          description: 'Tech stack entries — PostgreSQL, Python, TypeScript, etc. Flat list; cross-tech relationship graph is not yet modelled.',
        },
        'blog-posts': {
          enabled: { find: true, update: true },
          description: 'Blog posts with Lexical rich-text body. Professional + personal streams.',
        },
      },
      globals: {
        'site-meta': {
          enabled: { find: true, update: true },
          description:
            'Site-wide metadata: siteName, tagline, description, and social/outreach links (email, github, linkedin, upwork).',
        },
      },
    }),
  ],
  sharp,
  onInit: async (payload) => {
    const existing = await payload.find({
      collection: 'users',
      where: { roles: { contains: 'admin' } },
      limit: 1,
    })
    if (
      existing.totalDocs === 0 &&
      process.env.PAYLOAD_ADMIN_EMAIL &&
      process.env.PAYLOAD_ADMIN_PASSWORD
    ) {
      await payload.create({
        collection: 'users',
        data: {
          email: process.env.PAYLOAD_ADMIN_EMAIL,
          password: process.env.PAYLOAD_ADMIN_PASSWORD,
          roles: ['admin'],
        },
      })
      payload.logger.info('[slice-18a] Bootstrap admin created')
    }
  },
})
