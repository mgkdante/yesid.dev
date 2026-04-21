import type { PayloadRequest } from 'payload'

/**
 * Type-narrowed admin check. req.user is a union of User | PayloadMcpApiKey
 * (MCP plugin adds its own auth collection). This helper narrows to User and
 * checks the roles field in one place so access rules stay concise.
 */
export function isAdmin(user: PayloadRequest['user']): boolean {
  if (!user) return false
  if (!('collection' in user) || user.collection !== 'users') return false
  if (!('roles' in user) || !Array.isArray(user.roles)) return false
  return (user.roles as string[]).includes('admin')
}
