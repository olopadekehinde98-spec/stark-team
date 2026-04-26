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

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6b7280',
  textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5,
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Template | null>(null)
  const [form, setForm]           = useState({ name: '', description: '', proof_required: true })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/admin/templates')
    const d   = await res.json()
    setTemplates(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditing(null)
    setForm({ name: '', description: '', proof_required: true })
    setShowForm(true)
    setError(null)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setForm({ name: t.name, description: t.description ?? '', proof_required: t.proof_required })
    setShowForm(true)
    setError(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    if (editing) {
      const res  = await fetch(`/api/admin/templates/${editing.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      setTemplates(prev => prev.map(t => t.id === editing.id ? data : t))
    } else {
      const res  = await fetch('/api/admin/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); setSaving(false); return }
      setTemplates(prev => [...prev, data])
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
  }

  async function handleToggleActive(t: Template) {
    const res  = await fetch(`/api/admin/templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active }),
    })
    const data = await res.json()
    if (res.ok) setTemplates(prev => prev.map(x => x.id === t.id ? data : x))
  }

  const active   = templates.filter(t => t.is_active)
  const inactive = templates.filter(t => !t.is_active)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <PageHeader title="Activity Templates" subtitle="Manage activity types available when submitting" />
        {!showForm && (
          <button onClick={openCreate} style={{
            padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, flexShrink: 0,
            background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
          }}>+ New Template</button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div style={{
          background: '#111827', border: '1px solid #6366f1', borderRadius: 14,
          padding: 24, marginBottom: 24,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 20 }}>
            {editing ? 'Edit Template' : 'New Template'}
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={form.name} required
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Sales Call" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
                <div onClick={() => setForm(f => ({ ...f, proof_required: !f.proof_required }))} style={{
                  width: 40, height: 22, borderRadius: 11, cursor: 'pointer', flexShrink: 0,
                  background: form.proof_required ? '#6366f1' : '#374151', position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute', top: 3, left: form.proof_required ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                  }} />
                </div>
                <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                  {form.proof_required ? 'Proof required' : 'No proof needed'}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Description (optional)</label>
              <input style={inputStyle} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description of what this activity involves" />
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{error}</div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13,
                background: 'transparent', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
              }}>Cancel</button>
              <button type="submit" disabled={saving} style={{
                padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Template'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : (
        <>
          {/* Active templates */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Active ({active.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {active.map(t => (
                <div key={t.id} style={{
                  background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0, marginLeft: 8,
                      background: t.proof_required ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                      color: t.proof_required ? '#818cf8' : '#34d399',
                      border: `1px solid ${t.proof_required ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`,
                    }}>{t.proof_required ? 'Proof req.' : 'No proof'}</span>
                  </div>
                  {t.description && (
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12, lineHeight: 1.5 }}>{t.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => openEdit(t)} style={{
                      flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: '#1f2937', border: '1px solid #374151', color: '#9ca3af', cursor: 'pointer',
                    }}>Edit</button>
                    <button onClick={() => handleToggleActive(t)} style={{
                      flex: 1, padding: '6px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171', cursor: 'pointer',
                    }}>Deactivate</button>
                  </div>
                </div>
              ))}
              {active.length === 0 && (
                <div style={{ gridColumn: '1/-1', color: '#4b5563', fontSize: 13, padding: '20px 0' }}>No active templates.</div>
              )}
            </div>
          </div>

          {/* Inactive templates */}
          {inactive.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Inactive ({inactive.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {inactive.map(t => (
                  <div key={t.id} style={{
                    background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10,
                    padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6,
                  }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#6b7280', textDecoration: 'line-through' }}>{t.name}</span>
                      {t.description && <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 10 }}>{t.description}</span>}
                    </div>
                    <button onClick={() => handleToggleActive(t)} style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                      background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                      color: '#34d399', cursor: 'pointer',
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
