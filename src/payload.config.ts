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
import { Services } from './collections/Services'
import { Projects } from './collections/Projects'
import { BlogPosts } from './collections/BlogPosts'
import { StackScenarios } from './collections/StackScenarios'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { BlogPage } from './globals/BlogPage'
import { ErrorPages } from './globals/ErrorPages'
import { ProjectsPage } from './globals/ProjectsPage'
import { ServicesPage } from './globals/ServicesPage'
import { SiteMeta } from './globals/SiteMeta'
import { TechStackPage } from './globals/TechStackPage'
import { HomeContent } from './globals/HomeContent'
import { AboutContent } from './globals/AboutContent'
import { ContactContent } from './globals/ContactContent'
import { NavLinks } from './globals/NavLinks'

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
  collections: [TechStack, Services, Projects, BlogPosts, StackScenarios, Users, Media],
  globals: [
    HomeContent,
    ServicesPage,
    ProjectsPage,
    BlogPage,
    TechStackPage,
    AboutContent,
    ContactContent,
    NavLinks,
    ErrorPages,
    SiteMeta,
  ],
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
        media: true,
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
        services: {
          enabled: { find: true, update: true },
          description: 'Service offerings — SQL Development, Data Pipelines, etc. Source-of-truth for stack relationships.',
        },
        projects: {
          enabled: { find: true, update: true },
          description: 'Portfolio projects. Source-of-truth services + stack relationships; image via Media upload.',
        },
        'blog-posts': {
          enabled: { find: true, update: true },
          description: 'Blog posts with Lexical rich-text body. Professional + personal streams.',
        },
        'stack-scenarios': {
          enabled: { find: true, update: true },
          description: 'Build-Your-Stack configurator scenarios. References tech-stack + projects.',
        },
      },
      globals: {
        'home-content': {
          enabled: { find: true, update: true },
          description: 'Home page copy — hero, manifesto, journey, proof reel, services grid, closer.',
        },
        'services-page': {
          enabled: { find: true, update: true },
          description: '/services page copy — meta, listing chrome, detail chrome.',
        },
        'projects-page': {
          enabled: { find: true, update: true },
          description: '/projects page copy — meta, listing chrome, detail chrome.',
        },
        'blog-page': {
          enabled: { find: true, update: true },
          description: '/blog page copy — meta, listing chrome, detail chrome (per-stream: professional + personal).',
        },
        'tech-stack-page': {
          enabled: { find: true, update: true },
          description: '/tech-stack page copy — hero, stats, CTA, meta.',
        },
        'about-content': {
          enabled: { find: true, update: true },
          description: '/about page copy — identity, metrics, methodology, testimonials, interests, weather, CTA.',
        },
        'contact-content': {
          enabled: { find: true, update: true },
          description: '/contact page copy — form terminals, validation messages, success states, socials.',
        },
        'nav-links': {
          enabled: { find: true, update: true },
          description: 'Top navigation + menu overlay copy + shared chrome labels (aria + placeholders).',
        },
        'error-pages': {
          enabled: { find: true, update: true },
          description: 'Error page copy — 404 heading, description, suggestions.',
        },
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
