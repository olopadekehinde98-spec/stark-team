'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function CreateGoalPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [goalType, setGoalType] = useState('weekly')
  const [targetMetric, setTargetMetric] = useState('')
  const [deadline, setDeadline] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }
    const { error: insertError } = await supabase.from('goals').insert({
      user_id: user.id, title, description: description||null,
      goal_type: goalType, target_metric: Number(targetMetric),
      deadline, category: category||null,
    })
    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    router.push('/goals')
  }

  const minDate = new Date(Date.now()+86400000).toISOString().split('T')[0]

  return (
    <div className="p-6 max-w-xl">
      <PageHeader title="Create Goal" subtitle="Set a new performance goal" />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-lg px-4 py-3 text-sm" style={{ background:'#EF444420',color:'var(--error)',border:'1px solid var(--error)' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Title *</label>
            <Input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. 10 verified activities this week" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Goal Type</label>
            <select value={goalType} onChange={e=>setGoalType(e.target.value)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Target (number) *</label>
            <Input type="number" required min="1" value={targetMetric} onChange={e=>setTargetMetric(e.target.value)} placeholder="e.g. 10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Deadline *</label>
            <Input type="date" required min={minDate} value={deadline} onChange={e=>setDeadline(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Category</label>
            <Input value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Sales, Recruitment" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color:'var(--text-secondary)' }}>Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none"
              style={{ background:'var(--bg-surface-2)',border:'1px solid var(--border)',color:'var(--text-primary)' }} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating…' : 'Create Goal'}</Button>
        </form>
      </Card>
    </div>
  )
}