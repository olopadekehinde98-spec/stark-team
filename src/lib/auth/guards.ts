import { redirect } from 'next/navigation'
import { getSession } from './session'

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.role !== 'admin') redirect('/dashboard')
  return session
}

export async function requireLeaderOrAdmin() {
  const session = await requireAuth()
  if (session.role !== 'leader' && session.role !== 'admin') redirect('/dashboard')
  return session
}