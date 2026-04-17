'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Activity {
  id: string
  title: string
  activity_type: string
  activity_date: string
  proof_url?: string
  proof_type?: string
  submitted_at: string
  user_id: string
  users: { full_name: string; rank: string; username: string }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function VerificationQueue({ activities }: { activities: Activity[]; currentUserId: string }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectId, setRejectId]     = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handleVerify(id: string) {
    setProcessing(id)
    await fetch(`/api/verification/${id}/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({})
    })
    setProcessing(null)
    router.refresh()
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return
    setProcessing(id)
    await fetch(`/api/verification/${id}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: rejectReason })
    })
    setProcessing(null)
    setRejectId(null)
    setRejectReason('')
    router.refresh()
  }

  if (!activities.length) {
    return (
      <div className="rounded-[10px] py-20 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-[32px] mb-3">✓</p>
        <p className="text-[15px] font-semibold mb-1"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
          Queue is clear
        </p>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
          No pending activities to review right now.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map(a => (
        <div key={a.id}
          className="card-hover-line rounded-[10px] overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">

              {/* Member info + activity */}
              <div className="flex items-start gap-4 min-w-0 flex-1">
                {/* Avatar hexagon */}
                <div className="hexagon w-10 h-10 flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                  style={{
                    background: 'var(--gold-dim)',
                    color: 'var(--gold)',
                    fontFamily: 'Cinzel, serif',
                  }}>
                  {a.users.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[13px] font-semibold"
                      style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                      {a.users.full_name}
                    </span>
                    <span className="rank-badge" style={{ fontSize: '9px' }}>
                      {a.users.rank.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-[14px] font-medium mb-1"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                    {a.title}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-[4px]"
                      style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                      {a.activity_type}
                    </span>
                    <span className="mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {fmt(a.activity_date)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                      Submitted {timeAgo(a.submitted_at)}
                    </span>
                  </div>

                  {a.proof_url ? (
                    <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] mt-2 transition-colors"
                      style={{ color: 'var(--gold)', fontFamily: 'Outfit, sans-serif' }}>
                      ◆ View {a.proof_type} proof →
                    </a>
                  ) : (
                    <p className="text-[11px] mt-2" style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
                      ⚠ No proof attached
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleVerify(a.id)}
                  disabled={processing === a.id}
                  className="px-4 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22C55E',
                    border: '1px solid rgba(34,197,94,0.25)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  {processing === a.id ? '…' : '✓ Verify'}
                </button>
                <button
                  onClick={() => { setRejectId(a.id); setRejectReason('') }}
                  disabled={processing === a.id}
                  className="px-4 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all disabled:opacity-50"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    color: '#EF4444',
                    border: '1px solid rgba(239,68,68,0.22)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  ✗ Reject
                </button>
              </div>
            </div>
          </div>

          {/* Reject panel */}
          {rejectId === a.id && (
            <div className="px-5 pb-5 pt-0">
              <div className="rounded-[8px] p-4" style={{ background: 'var(--surface2)', border: '1px solid rgba(239,68,68,0.20)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                  style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>
                  Rejection Reason
                </p>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Explain why this activity is being rejected…"
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] resize-none rounded-[6px]"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleReject(a.id)}
                    disabled={!rejectReason.trim() || processing === a.id}
                    className="px-4 py-1.5 rounded-[6px] text-[12px] font-semibold disabled:opacity-40"
                    style={{ background: '#EF4444', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setRejectId(null)}
                    className="px-4 py-1.5 rounded-[6px] text-[12px] font-medium"
                    style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
