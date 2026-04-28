'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
  navy:'#0F1C2E',gold:'#D4A017',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
  warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
  err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
  blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
}

type Activity = {
  id: string; title: string; activity_type: string; activity_date: string
  status: string; submitted_at: string; proof_url?: string
}
type FilterTab = 'all' | 'pending' | 'verified' | 'rejected'

function statusStyle(s: string) {
  return {
    fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, display:'inline-block',
    background: s==='verified' ? S.okBg : s==='pending' ? S.blueBg : S.errBg,
    color:      s==='verified' ? S.ok   : s==='pending' ? S.blue   : S.err,
    border:    `1px solid ${s==='verified' ? S.okBd : s==='pending' ? S.blueBd : S.errBd}`,
  }
}

function hoursLeft(submittedAt: string) {
  return Math.max(0, (24 * 3600000 - (Date.now() - new Date(submittedAt).getTime())) / 3600000)
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState<FilterTab>('all')
  const [search,     setSearch]     = useState('')

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('activities')
        .select('id,title,activity_type,activity_date,status,submitted_at,proof_url')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
      setActivities(data ?? [])
      setLoading(false)
    })()
  }, [])

  const filtered = activities.filter(a => {
    const matchTab = tab === 'all' || a.status === tab
    const matchQ   = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.activity_type.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchQ
  })

  const counts = {
    all:      activities.length,
    pending:  activities.filter(a => a.status === 'pending').length,
    verified: activities.filter(a => a.status === 'verified').length,
    rejected: activities.filter(a => a.status === 'rejected').length,
  }

  const editableItems = activities.filter(a => a.status === 'pending' && hoursLeft(a.submitted_at) > 0)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:`3px solid ${S.bd}`, borderTop:`3px solid ${S.navy}`, animation:'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Activities</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>{counts.all} total · {counts.verified} verified · {counts.pending} pending</p>
        </div>
        <Link href="/activities/submit" style={{
          padding:'9px 18px', borderRadius:8, background:S.navy,
          color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none',
        }}>+ Submit Activity</Link>
      </div>

      {/* Edit window banner */}
      {editableItems.length > 0 && (
        <div style={{ background:S.warnBg, border:`1px solid ${S.warnBd}`, borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span>⏱</span>
          <div style={{ fontSize:13, color:S.warn }}>
            <strong>{editableItems.length} pending {editableItems.length===1?'activity':'activities'}</strong> can still be edited (within 24h of submission).
          </div>
        </div>
      )}

      {/* Filter + search */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, marginBottom:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:4 }}>
            {(['all','pending','verified','rejected'] as FilterTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:600,
                background: tab===t ? S.navy : S.s3,
                color:      tab===t ? '#fff' : S.tx2,
              }}>
                {t.charAt(0).toUpperCase()+t.slice(1)} ({counts[t]})
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search activities…"
            style={{
              marginLeft:'auto', padding:'7px 12px', borderRadius:8,
              border:`1px solid ${S.bd}`, background:S.s2,
              fontSize:13, color:S.tx, width:220,
              fontFamily:"'Inter',sans-serif",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:S.s2 }}>
              {['Activity','Type','Date','Proof','Status',''].map(h => (
                <th key={h} style={{
                  padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600,
                  color:S.mu, borderBottom:`1px solid ${S.bd}`,
                  letterSpacing:'0.04em', textTransform:'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:32, textAlign:'center', color:S.mu, fontSize:13 }}>
                No activities found
              </td></tr>
            ) : filtered.map((a, i) => {
              const canEdit = a.status === 'pending' && hoursLeft(a.submitted_at) > 0
              return (
                <tr key={a.id} style={{ borderBottom: i<filtered.length-1 ? `1px solid ${S.bd}` : 'none' }}>
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{a.title}</div>
                    {canEdit && (
                      <div style={{ fontSize:10, color:S.warn, marginTop:2 }}>
                        Edit window: {Math.ceil(hoursLeft(a.submitted_at))}h left
                      </div>
                    )}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:500, color:S.tx2, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:20 }}>
                      {a.activity_type}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:S.tx2 }}>
                    {a.activity_date ? new Date(a.activity_date).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:13, textAlign:'center' }}>
                    {a.proof_url ? <span style={{ color:S.ok }}>✓</span> : <span style={{ color:S.mu }}>—</span>}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={statusStyle(a.status)}>
                      {a.status.charAt(0).toUpperCase()+a.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <Link href={`/activities/${a.id}`} style={{ fontSize:12, color:S.blue, fontWeight:600, textDecoration:'none' }}>
                      {canEdit ? 'Edit' : 'View'}
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
