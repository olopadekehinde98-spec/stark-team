'use client'
import { useState } from 'react'

type Announcement = {
  id: string
  title: string
  body: string
  target_role: string | null
  is_pinned: boolean
  published_at: string | null
  expires_at: string | null
  author?: { full_name: string } | null
  created_at: string
}

type Props = {
  initial?: Partial<Announcement>
  onSave: (data: Partial<Announcement>) => Promise<void>
  onCancel: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e2e8f0',
  outline: 'none', boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'block',
}

export default function AnnouncementEditor({ initial = {}, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial.title ?? '')
  const [body, setBody] = useState(initial.body ?? '')
  const [targetRole, setTargetRole] = useState(initial.target_role ?? '')
  const [isPinned, setIsPinned] = useState(initial.is_pinned ?? false)
  const [publishedAt, setPublishedAt] = useState(initial.published_at ? initial.published_at.slice(0, 16) : '')
  const [expiresAt, setExpiresAt] = useState(initial.expires_at ? initial.expires_at.slice(0, 16) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        target_role: targetRole || null,
        is_pinned: isPinned,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
    } catch (err: any) {
      setError(err.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Title</label>
        <input
          style={inputStyle} value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Announcement title" required
        />
      </div>

      <div>
        <label style={labelStyle}>Body</label>
        <textarea
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
          value={body} onChange={e => setBody(e.target.value)}
          placeholder="Write the announcement content…" required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Target Role</label>
          <select style={inputStyle} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
            <option value="">All members</option>
            <option value="admin">Admins only</option>
            <option value="leader">Leaders &amp; Admins</option>
            <option value="member">Members only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
          <div
            onClick={() => setIsPinned(p => !p)}
            style={{
              width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
              background: isPinned ? '#6366f1' : '#374151',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: isPinned ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>
            {isPinned ? 'Pinned to dashboard' : 'Not pinned'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Publish At (optional)</label>
          <input type="datetime-local" style={inputStyle} value={publishedAt} onChange={e => setPublishedAt(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Expires At (optional)</label>
          <input type="datetime-local" style={inputStyle} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '8px 12px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={{
          padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: 'transparent', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
        }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: saving ? '#4338ca' : '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Saving…' : 'Save Announcement'}
        </button>
      </div>
    </form>
  )
}
