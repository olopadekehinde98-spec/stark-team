import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const BADGE_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  star:        { color: '#E8C96A', bg: 'rgba(232,201,106,0.12)', icon: '★' },
  excellence:  { color: '#C9A84C', bg: 'rgba(201,168,76,0.12)',  icon: '◆' },
  leadership:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  icon: '▲' },
  teamwork:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: '◈' },
  consistency: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   icon: '✦' },
  innovation:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: '⚡' },
}

function BadgeTag({ type }: { type: string }) {
  const b = BADGE_STYLE[type] ?? { color: 'var(--text-muted)', bg: 'rgba(107,122,150,0.12)', icon: '◉' }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-semibold"
      style={{ color: b.color, background: b.bg, fontFamily: 'Outfit, sans-serif' }}>
      <span style={{ fontSize: 10 }}>{b.icon}</span>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  )
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function RecognitionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('users').select('role,rank').eq('id', user.id).single()

  const [myBadgesRes, wallRes] = await Promise.all([
    supabase
      .from('recognitions')
      .select('id,title,message,badge_type,created_at,is_auto')
      .eq('recipient_id', user.id)
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('recognitions')
      .select('id,title,message,badge_type,created_at,is_auto,issued_by,recipient_id,users!recognitions_recipient_id_fkey(full_name,username)')
      .eq('is_revoked', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const myBadges = myBadgesRes.data ?? []
  const wall     = wallRes.data ?? []

  const canIssue = myProfile?.role === 'leader' || myProfile?.role === 'admin'

  return (
    <div className="p-6 max-w-[1200px] mx-auto">

      {/* ── HEADER ───────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-semibold"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
            Recognition
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
            Celebrating team achievements
          </p>
        </div>
        {canIssue && (
          <Link href="/recognition/issue"
            className="px-4 py-2 rounded-[6px] text-[13px] font-semibold"
            style={{ background: 'var(--gold)', color: '#07090F', fontFamily: 'Outfit, sans-serif', boxShadow: '0 2px 10px rgba(201,168,76,0.25)' }}>
            + Issue Badge
          </Link>
        )}
      </div>

      {/* ── YOUR BADGES ──────────────────────────── */}
      {myBadges.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
            style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)' }}>
            Your Badges
          </h2>
          <div className="flex gap-3 flex-wrap">
            {myBadges.map(b => {
              const style = BADGE_STYLE[b.badge_type] ?? { color: 'var(--text-muted)', bg: 'rgba(107,122,150,0.12)', icon: '◉' }
              return (
                <div key={b.id}
                  className="card-hover-line rounded-[10px] p-4 flex flex-col items-center text-center w-32"
                  style={{ background: 'var(--surface)', border: `1px solid ${style.color}30` }}>
                  <div className="hexagon w-10 h-10 flex items-center justify-center mb-2"
                    style={{ background: style.bg }}>
                    <span style={{ fontSize: 18, color: style.color }}>{style.icon}</span>
                  </div>
                  <BadgeTag type={b.badge_type} />
                  <p className="text-[11px] mt-1.5 line-clamp-2"
                    style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.3 }}>
                    {b.title}
                  </p>
                  {b.is_auto && (
                    <span className="text-[9px] mt-1 px-1.5 py-0.5 rounded-[3px]"
                      style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                      Auto
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── RECOGNITION WALL ─────────────────────── */}
      <div>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-4"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-muted)' }}>
          Recognition Wall
        </h2>

        {wall.length === 0 ? (
          <div className="rounded-[10px] py-20 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[32px] mb-3">✦</p>
            <p className="text-[14px] font-semibold mb-1"
              style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)' }}>
              No recognitions yet
            </p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
              Leaders can issue recognitions to celebrate team members.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wall.map(r => {
              const recipient = (r as any).users
              const style     = BADGE_STYLE[r.badge_type] ?? { color: 'var(--text-muted)', bg: 'rgba(107,122,150,0.12)', icon: '◉' }
              return (
                <div key={r.id}
                  className="card-hover-line rounded-[10px] p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  {/* Recipient */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="hexagon w-10 h-10 flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                      style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontFamily: 'Cinzel, serif' }}>
                      {initials(recipient?.full_name ?? '?')}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold"
                        style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                        {recipient?.full_name ?? '—'}
                      </p>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                        @{recipient?.username ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* Badge type + auto tag */}
                  <div className="flex items-center gap-2 mb-3">
                    <BadgeTag type={r.badge_type} />
                    {r.is_auto && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-[3px]"
                        style={{ background: 'var(--surface2)', color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                        Auto
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-[13px] font-semibold mb-1"
                    style={{ color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {r.title}
                  </p>
                  {r.message && (
                    <p className="text-[12px] leading-relaxed mb-3"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                      {r.message}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3"
                    style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)', fontFamily: 'Outfit, sans-serif' }}>
                      {r.is_auto ? 'System' : 'Issued by leader'}
                    </span>
                    <span className="mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {fmt(r.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
