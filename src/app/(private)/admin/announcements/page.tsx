'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import AnnouncementEditor from '@/components/admin/AnnouncementEditor'

type Announcement = {
  id: string
  title: string
  body: string
  target_role: string | null
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
  author: { full_name: string } | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admins', leader: 'Leaders+', member: 'Members',
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/announcements')
    const data = await res.json()
    if (res.ok) setAnnouncements(data)
    else setError(data.error)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate(body: any) {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setAnnouncements(prev => [data, ...prev])
    setShowCreate(false)
  }

  async function handleEdit(id: string, body: any) {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setAnnouncements(prev => prev.map(a => a.id === id ? data : a))
    setEditing(null)
  }

  async function handleTogglePin(a: Announcement) {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !a.is_pinned }),
    })
    const data = await res.json()
    if (res.ok) setAnnouncements(prev => prev.map(x => x.id === a.id ? data : x))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) return
    const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <PageHeader title="Announcements" subtitle="Create and manage platform announcements" />
        {!showCreate && !editing && (
          <button onClick={() => setShowCreate(true)} style={{
            padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', flexShrink: 0,
          }}>
            + New Announcement
          </button>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>{error}</div>
      )}

      {/* Create form */}
      {showCreate && (
        <div style={{ background: '#111827', border: '1px solid #6366f1', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>New Announcement</div>
          <AnnouncementEditor
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div style={{ background: '#111827', border: '1px solid #6366f1', borderRadius: 14, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>Edit Announcement</div>
          <AnnouncementEditor
            initial={editing}
            onSave={body => handleEdit(editing.id, body)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : announcements.length === 0 ? (
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📢</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>No announcements yet. Create one above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map(a => (
            <div key={a.id} style={{
              background: '#111827',
              border: `1px solid ${a.is_pinned ? 'rgba(99,102,241,0.4)' : '#1f2937'}`,
              borderRadius: 14, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{a.title}</span>
                    {a.is_pinned && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        📌 Pinned
                      </span>
                    )}
                    {a.target_role && (
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: '#1f2937', color: '#9ca3af', border: '1px solid #374151',
                      }}>
                        {ROLE_LABELS[a.target_role] ?? a.target_role}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.body}</p>
                  <div style={{ fontSize: 11, color: '#4b5563', marginTop: 8 }}>
                    By {a.author?.full_name ?? 'Unknown'} · {timeAgo(a.created_at)}
                    {a.expires_at && ` · Expires ${new Date(a.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleTogglePin(a)}
                    title={a.is_pinned ? 'Unpin' : 'Pin to dashboard'}
                    style={{
                      padding: '6px 10px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                      background: a.is_pinned ? 'rgba(99,102,241,0.15)' : '#1f2937',
                      border: `1px solid ${a.is_pinned ? 'rgba(99,102,241,0.3)' : '#374151'}`,
                      color: a.is_pinned ? '#818cf8' : '#6b7280',
                    }}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => { setEditing(a); setShowCreate(false) }}
                    style={{
                      padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171', cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
