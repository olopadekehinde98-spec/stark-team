'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

type Template = {
  id: string
  name: string
  description: string | null
  proof_required: boolean
  is_active: boolean
  created_at: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1f2937', border: '1px solid #374151',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#e2e8f0',
  outline: 'none', boxSizing: 'border-box',
}

export default function AdminActivityTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [form, setForm] = useState({ name: '', description: '', proof_required: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(d => { setTemplates(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  function openCreate() {
    setForm({ name: '', description: '', proof_required: true })
    setEditing(null)
    setShowCreate(true)
    setError(null)
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, description: t.description ?? '', proof_required: t.proof_required })
    setEditing(t)
    setShowCreate(true)
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    setError(null)
    if (editing) {
      const res = await fetch(`/api/admin/templates/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, proof_required: form.proof_required }),
      })
      const data = await res.json()
      if (res.ok) { setTemplates(prev => prev.map(t => t.id === data.id ? data : t)); setShowCreate(false) }
      else setError(data.error)
    } else {
      const res = await fetch('/api/admin/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, proof_required: form.proof_required }),
      })
      const data = await res.json()
      if (res.ok) { setTemplates(prev => [...prev, data]); setShowCreate(false) }
      else setError(data.error)
    }
    setSaving(false)
  }

  async function handleToggle(t: Template) {
    const res = await fetch(`/api/admin/templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    const data = await res.json()
    if (res.ok) setTemplates(prev => prev.map(x => x.id === data.id ? data : x))
  }

  const active = templates.filter(t => t.is_active)
  const inactive = templates.filter(t => !t.is_active)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <PageHeader title="Activity Templates" subtitle="Manage the activity types members can submit" />
        {!showCreate && (
          <button onClick={openCreate} style={{
            padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, flexShrink: 0,
            background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
          }}>+ New Template</button>
        )}
      </div>

      {/* Create / Edit form */}
      {showCreate && (
        <form onSubmit={handleSave} style={{
          background: '#111827', border: '1px solid #6366f1',
          borderRadius: 14, padding: 24, marginBottom: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 18 }}>
            {editing ? 'Edit Template' : 'New Template'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sales Call" required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5 }}>Description (optional)</label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Short description of this activity type" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div onClick={() => setForm(f => ({ ...f, proof_required: !f.proof_required }))} style={{
                width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                background: form.proof_required ? '#6366f1' : '#374151', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: form.proof_required ? 21 : 3,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>Proof required for this activity type</span>
            </div>
            {error && <div style={{ fontSize: 12, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderRadius: 6, padding: '8px 12px' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13,
                background: 'transparent', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Saving…' : 'Save Template'}</button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : (
        <>
          {/* Active templates */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Active Templates ({active.length})
            </div>
            {active.length === 0 ? (
              <div style={{ fontSize: 13, color: '#4b5563' }}>No active templates.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {active.map(t => (
                  <div key={t.id} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{t.name}</span>
                        {t.proof_required && (
                          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                            Proof req.
                          </span>
                        )}
                      </div>
                      {t.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{t.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(t)} style={{
                        padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                        background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
                      }}>Edit</button>
                      <button onClick={() => handleToggle(t)} style={{
                        padding: '5px 12px', borderRadius: 7, fontSize: 12,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                        color: '#f87171', cursor: 'pointer',
                      }}>Deactivate</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive templates */}
          {inactive.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Inactive ({inactive.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inactive.map(t => (
                  <div key={t.id} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, opacity: 0.6 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: '#6b7280', textDecoration: 'line-through' }}>{t.name}</span>
                    </div>
                    <button onClick={() => handleToggle(t)} style={{
                      padding: '5px 12px', borderRadius: 7, fontSize: 12,
                      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
                      color: '#6ee7b7', cursor: 'pointer',
                    }}>Reactivate</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
