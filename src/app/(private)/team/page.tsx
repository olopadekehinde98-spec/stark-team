import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const S = {
  s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',bd2:'#CBD5E1',
  navy:'#0F1C2E',gold:'#D4A017',
  tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
  ok:'#16A34A',warn:'#D97706',err:'#DC2626',blue:'#2563EB',
}

type Member = {
  id: string; full_name: string; username: string
  role: string; rank: string; is_active: boolean
  last_seen_at?: string; branch_id?: string
  branches?: { name: string } | null
}

function initials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function activityStatus(lastSeen?: string): { dot: string } {
  if (!lastSeen) return { dot: S.err }
  const d = (Date.now() - new Date(lastSeen).getTime()) / 86400000
  if (d < 7)  return { dot: S.ok   }
  if (d < 14) return { dot: S.warn }
  return           { dot: S.err   }
}

const AVATAR_PALETTES = [
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
]

function NodeCard({ m, isMe = false }: { m: Member; isMe?: boolean }) {
  const status = activityStatus(m.last_seen_at)
  const pal    = AVATAR_PALETTES[m.full_name.charCodeAt(0) % AVATAR_PALETTES.length]
  return (
    <Link href={`/profile/${m.username}`} style={{ textDecoration:'none' }}>
      <div style={{
        background: isMe ? S.navy : S.s1,
        border: `1px solid ${isMe ? 'transparent' : S.bd}`,
        borderRadius:8, padding:'10px 14px',
        display:'flex', alignItems:'center', gap:9, minWidth:130,
        boxShadow:'0 1px 2px rgba(0,0,0,0.04)',
      }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          <div style={{
            width:28, height:28, borderRadius:'50%',
            background: isMe ? S.gold : pal.bg,
            border:`1px solid ${isMe ? 'transparent' : pal.bd}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:700, color: isMe ? S.navy : pal.tx,
          }}>{initials(m.full_name)}</div>
          <div style={{
            position:'absolute', bottom:0, right:-2,
            width:7, height:7, borderRadius:'50%', background:status.dot,
            border:`1.5px solid ${isMe ? S.navy : S.s1}`,
          }} />
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:600, color: isMe ? '#fff' : S.tx, whiteSpace:'nowrap' }}>
            {m.full_name.split(' ')[0]}
          </div>
          <div style={{ fontSize:10, color: isMe ? 'rgba(255,255,255,0.5)' : S.mu, textTransform:'capitalize' }}>
            {m.rank.replace(/_/g, ' ')}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('users').select('id,full_name,rank,role,branch_id,username,last_seen_at').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('users')
    .select('id,full_name,username,role,rank,is_active,last_seen_at,branch_id,branches(name)')
    .eq('is_active', true)
    .order('rank')

  const branchId      = myProfile?.branch_id
  const branchName    = (members ?? []).find(m => m.branch_id === branchId && (m as any).branches)
  const branchMembers = (members ?? []).filter(m => m.id !== user.id && m.branch_id === branchId)
  const others        = (members ?? []).filter(m => m.id !== user.id && m.branch_id !== branchId)

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Team Tree</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          {branchName ? `${(branchName as any).branches?.name} Branch · ` : ''}Your downline structure
        </p>
      </div>

      {/* Tree */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:'32px 24px', marginBottom:16, textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center' }}>
          {myProfile && <NodeCard m={myProfile as unknown as Member} isMe />}
          {branchMembers.length > 0 && (
            <>
              <div style={{ width:1, height:24, background:S.bd2 }} />
              <div style={{ width:Math.min(branchMembers.length,5)*158, height:1, background:S.bd2, maxWidth:'90vw' }} />
              <div style={{ display:'flex', gap:16, flexWrap:'wrap', justifyContent:'center' }}>
                {branchMembers.map(m => (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <div style={{ width:1, height:20, background:S.bd2 }} />
                    <NodeCard m={m as unknown as Member} />
                  </div>
                ))}
              </div>
            </>
          )}
          {branchMembers.length === 0 && (
            <div style={{ marginTop:16, fontSize:13, color:S.mu }}>No branch members assigned</div>
          )}
        </div>
        <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:22 }}>
          {[{color:S.ok,label:'Active'},{color:S.warn,label:'Inactive 7d'},{color:S.err,label:'Inactive 14d+'}].map(l => (
            <span key={l.label} style={{ fontSize:12, color:S.tx2, display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block' }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {others.length > 0 && (
        <>
          <div style={{ fontSize:11, fontWeight:600, color:S.mu, letterSpacing:'0.06em', marginBottom:10, textTransform:'uppercase' }}>Other Branches</div>
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:S.s2 }}>
                  {['Member','Rank','Role','Branch','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:S.mu, borderBottom:`1px solid ${S.bd}`, letterSpacing:'0.04em', textTransform:'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {others.map((m, i) => {
                  const status = activityStatus((m as unknown as Member).last_seen_at)
                  const pal    = AVATAR_PALETTES[m.full_name.charCodeAt(0) % AVATAR_PALETTES.length]
                  return (
                    <tr key={m.id} style={{ borderBottom:i<others.length-1?`1px solid ${S.bd}`:'none' }}>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:pal.tx, flexShrink:0 }}>
                            {initials(m.full_name)}
                          </div>
                          <div>
                            <Link href={`/profile/${m.username}`} style={{ fontSize:13, fontWeight:600, color:S.tx, textDecoration:'none' }}>{m.full_name}</Link>
                            <div style={{ fontSize:10, color:S.mu }}>@{m.username}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:11, color:S.tx2, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:20, fontWeight:500 }}>
                          {m.rank.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:12, color:S.tx2, textTransform:'capitalize' }}>{m.role}</td>
                      <td style={{ padding:'11px 14px', fontSize:12, color:S.mu }}>{((m as any).branches as any)?.name ?? '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:7, height:7, borderRadius:'50%', background:status.dot }} />
                          <span style={{ fontSize:11, color:S.mu }}>
                            {status.dot===S.ok?'Active':status.dot===S.warn?'Inactive 7d':'Inactive 14d+'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
