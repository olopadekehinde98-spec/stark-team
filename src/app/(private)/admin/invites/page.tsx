'use client'
import { useState, useEffect } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils/formatDate'

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ role:'member', rank:'distributor', email:'', expires_days:'7' })
  const [newLink, setNewLink] = useState('')

  useEffect(() => { loadInvites() }, [])

  async function loadInvites() {
    const r = await fetch('/api/invites')
    const d = await r.json()
    setInvites(d.invites ?? [])
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const r = await fetch('/api/invites', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        assigned_role: form.role,
        assigned_rank: form.rank,
        assigned_email: form.email||null,
        expires_days: Number(form.expires_days),
      })
    })
    const d = await r.json()
    setCreating(false)
    if (d.invite_url) {
      setNewLink(d.invite_url)
      loadInvites()
    }
  }

  return (
    <div className="p-6">
      <PageHeader title="Invite Links" subtitle="Create and manage invite links" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ color:'var(--text-secondary)' }}>Create Invite Link</h3>
          <form onSubmit={createInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Role</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }}>
                <option value="member">Member</option>
                <option value="leader">Leader</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Rank</label>
              <select value={form.rank} onChange={e=>setForm(f=>({...f,rank:e.target.value}))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }}>
                {['distributor','manager','senior_manager','executive_manager','director'].map(r=>(
                  <option key={r} value={r}>{r.replace(/_/g,' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Lock to Email (optional)</label>
              <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="user@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color:'var(--text-muted)' }}>Expires in (days)</label>
              <input type="number" min="1" max="30" value={form.expires_days} onChange={e=>setForm(f=>({...f,expires_days:e.target.value}))}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }} />
            </div>
            <Button type="submit" disabled={creating} className="w-full">{creating?'Creating…':'Create Link'}</Button>
          </form>
          {newLink && (
            <div className="mt-4 rounded-lg p-3 break-all" style={{ background:'var(--bg-surface-2)',border:'1px solid var(--gold)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color:'var(--gold)' }}>New Invite Link:</p>
              <p className="text-xs mono" style={{ color:'var(--text-primary)' }}>{newLink}</p>
            </div>
          )}
        </Card>
        <div>
          <h3 className="text-sm font-semibold mb-3" style={{ color:'var(--text-secondary)' }}>Recent Invites</h3>
          <div className="space-y-2">
            {invites.slice(0,10).map((inv:any)=>(
              <div key={inv.id} className="rounded-lg border p-3" style={{ background:'var(--bg-surface)',borderColor:'var(--border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium capitalize" style={{ color:'var(--text-primary)' }}>{inv.assigned_role} · {inv.assigned_rank?.replace(/_/g,' ')}</p>
                    <p className="text-xs" style={{ color:'var(--text-muted)' }}>Expires {formatDate(inv.expires_at)}</p>
                  </div>
                  <Badge variant={inv.used_by?'default':inv.is_active?'success':'error'}>
                    {inv.used_by?'Used':inv.is_active?'Active':'Inactive'}
                  </Badge>
                </div>
              </div>
            ))}
            {invites.length===0 && <p className="text-sm" style={{ color:'var(--text-muted)' }}>No invites yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}