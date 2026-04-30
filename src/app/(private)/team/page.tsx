'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0', bd2:'#CBD5E1',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  err:'#DC2626',
}

const RANK_LABEL: Record<string, string> = {
  e_member:'E-Member', distributor:'Distributor', manager:'Manager',
  senior_manager:'Senior Manager', executive_manager:'Executive', director:'Director',
}

const PALETTES = [
  { bg:'#EFF6FF', tx:'#2563EB', bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:'#16A34A', bd:'#86EFAC' },
  { bg:'#FEF2F2', tx:'#DC2626', bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
  { bg:'#FEF9EC', tx:'#D4A017', bd:'#F5D87A' },
  { bg:'#FFF7ED', tx:'#EA580C', bd:'#FDBA74' },
]

type Member = {
  id: string
  full_name: string
  username: string
  avatar_url?: string
  role: string
  rank: string
  is_active: boolean
  last_seen_at?: string
  invited_by?: string
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function palette(name: string) {
  return PALETTES[name.charCodeAt(0) % PALETTES.length]
}

function activityDot(lastSeen?: string) {
  if (!lastSeen) return S.err
  const days = (Date.now() - new Date(lastSeen).getTime()) / 86400000
  if (days < 7)  return S.ok
  if (days < 14) return S.warn
  return S.err
}

function activityLabel(lastSeen?: string) {
  if (!lastSeen) return 'Never active'
  const days = (Date.now() - new Date(lastSeen).getTime()) / 86400000
  if (days < 1)  return 'Active today'
  if (days < 7)  return `Active ${Math.floor(days)}d ago`
  if (days < 14) return 'Inactive ~1 week'
  return 'Inactive 14d+'
}

// Build downline map: parentId -> list of children
function buildDownlineMap(members: Member[]): Map<string, Member[]> {
  const map = new Map<string, Member[]>()
  for (const m of members) {
    if (m.invited_by) {
      const arr = map.get(m.invited_by) ?? []
      arr.push(m)
      map.set(m.invited_by, arr)
    }
  }
  return map
}

// Count all descendants recursively
function countDescendants(id: string, map: Map<string, Member[]>): number {
  const children = map.get(id) ?? []
  return children.reduce((sum, c) => sum + 1 + countDescendants(c.id, map), 0)
}

function Avatar({ m, size = 36, isMe = false }: { m: Member; size?: number; isMe?: boolean }) {
  const pal = palette(m.full_name)
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      {m.avatar_url ? (
        <img src={m.avatar_url} alt={m.full_name} width={size} height={size}
          style={{ borderRadius:'50%', objectFit:'cover', border:`2px solid ${isMe ? S.gold : S.bd}`, display:'block' }} />
      ) : (
        <div style={{
          width:size, height:size, borderRadius:'50%',
          background: isMe ? S.gold : pal.bg,
          border:`2px solid ${isMe ? '#D4A017' : pal.bd}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:size * 0.32, fontWeight:700,
          color: isMe ? S.navy : pal.tx,
        }}>{initials(m.full_name)}</div>
      )}
      <div style={{
        position:'absolute', bottom:0, right:0,
        width:9, height:9, borderRadius:'50%',
        background: activityDot(m.last_seen_at),
        border:`2px solid ${S.s1}`,
      }} />
    </div>
  )
}

// Recursive tree node
function TreeNode({ m, map, depth = 0, isMe = false }: {
  m: Member; map: Map<string, Member[]>; depth?: number; isMe?: boolean
}) {
  const [open, setOpen] = useState(depth < 2)
  const children = map.get(m.id) ?? []
  const totalDown = countDescendants(m.id, map)
  const hasChildren = children.length > 0

  return (
    <div style={{ position:'relative' }}>
      {/* Card */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        background: isMe ? S.navy : S.s1,
        border:`1px solid ${isMe ? 'transparent' : hasChildren ? S.goldBd : S.bd}`,
        borderRadius:10, padding:'10px 14px',
        boxShadow: isMe ? '0 4px 16px rgba(15,28,46,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
        cursor: hasChildren ? 'pointer' : 'default',
        userSelect:'none',
      }}
        onClick={() => hasChildren && setOpen(o => !o)}
      >
        <Avatar m={m} size={isMe ? 40 : 34} isMe={isMe} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color: isMe ? '#fff' : S.tx, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {m.full_name} {isMe && <span style={{ fontSize:10, opacity:0.6 }}>(you)</span>}
          </div>
          <div style={{ fontSize:11, color: isMe ? 'rgba(255,255,255,0.55)' : S.mu }}>
            {RANK_LABEL[m.rank] ?? m.rank} · <span style={{ textTransform:'capitalize' }}>{m.role}</span>
          </div>
        </div>
        {hasChildren && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
            <div style={{ fontSize:10, fontWeight:700, color: isMe ? S.gold : S.gold, background: isMe ? 'rgba(212,160,23,0.15)' : S.goldBg, border:`1px solid ${S.goldBd}`, borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>
              {totalDown} downline
            </div>
            <div style={{ fontSize:18, color: isMe ? 'rgba(255,255,255,0.4)' : S.bd2, lineHeight:1 }}>
              {open ? '▾' : '▸'}
            </div>
          </div>
        )}
        {!hasChildren && !isMe && (
          <div style={{ fontSize:10, color: activityDot(m.last_seen_at) === S.ok ? S.ok : S.mu }}>
            {activityLabel(m.last_seen_at)}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div style={{
          marginLeft: 24,
          marginTop: 6,
          paddingLeft: 16,
          borderLeft: `2px solid ${S.bd}`,
          display:'flex', flexDirection:'column', gap:6,
        }}>
          {children.map(child => (
            <TreeNode key={child.id} m={child} map={map} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  const [myProfile, setMyProfile] = useState<Member | null>(null)
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: me }, { data: members }] = await Promise.all([
        supabase.from('users')
          .select('id,full_name,username,avatar_url,role,rank,is_active,last_seen_at,invited_by')
          .eq('id', user.id).single(),
        supabase.from('users')
          .select('id,full_name,username,avatar_url,role,rank,is_active,last_seen_at,invited_by')
          .eq('is_active', true)
          .order('rank'),
      ])

      if (me) {
        setMyProfile(me as Member)
        setIsAdmin(me.role === 'admin')
      }
      setAllMembers((members ?? []) as Member[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:200 }}>
        <div style={{ fontSize:13, color:S.mu }}>Loading team…</div>
      </div>
    )
  }

  if (!myProfile) return null

  const downlineMap = buildDownlineMap(allMembers)

  // For admin: show full org tree (root = members with no invited_by)
  // For others: show MY downline only
  const myDownlineTotal = countDescendants(myProfile.id, downlineMap)
  const myDirectCount   = (downlineMap.get(myProfile.id) ?? []).length

  // Find users NOT in my downline and not me (for admin "other members" panel)
  function getAllDescendantIds(id: string): Set<string> {
    const set = new Set<string>()
    const children = downlineMap.get(id) ?? []
    for (const c of children) {
      set.add(c.id)
      getAllDescendantIds(c.id).forEach(x => set.add(x))
    }
    return set
  }

  const myDescendants = getAllDescendantIds(myProfile.id)
  const outsiders = allMembers.filter(m => m.id !== myProfile.id && !myDescendants.has(m.id))

  // Stats
  const activeCount = [...myDescendants].filter(id => {
    const m = allMembers.find(x => x.id === id)
    return m && activityDot(m.last_seen_at) === S.ok
  }).length

  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Team Tree</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>Your personal downline — everyone you invited and their recruits</p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Downline', value: myDownlineTotal, color: S.navy },
          { label:'Direct Recruits', value: myDirectCount, color: '#7C3AED' },
          { label:'Active This Week', value: activeCount, color: S.ok },
        ].map(stat => (
          <div key={stat.label} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:'14px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:24, fontWeight:800, color:stat.color }}>{stat.value}</div>
            <div style={{ fontSize:12, color:S.mu, marginTop:2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginBottom:16 }}>
        {[{color:S.ok,label:'Active <7d'},{color:S.warn,label:'Inactive 7-14d'},{color:S.err,label:'Inactive 14d+'}].map(l => (
          <span key={l.label} style={{ fontSize:12, color:S.tx2, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:l.color, display:'inline-block' }} />
            {l.label}
          </span>
        ))}
        {myDownlineTotal > 0 && (
          <span style={{ fontSize:12, color:S.mu, marginLeft:'auto' }}>Click a card to expand/collapse</span>
        )}
      </div>

      {/* Tree panel */}
      <div style={{ background:S.s2, border:`1px solid ${S.bd}`, borderRadius:12, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <TreeNode m={myProfile} map={downlineMap} depth={0} isMe />
        {myDownlineTotal === 0 && (
          <div style={{ marginTop:20, textAlign:'center', padding:'20px 0', fontSize:13, color:S.mu }}>
            👥 No one in your downline yet.<br />
            <span style={{ fontSize:12 }}>Share your invite link from your Profile page to recruit members.</span>
          </div>
        )}
      </div>

      {/* Other members (not in my downline) — always visible to admin, hidden for others */}
      {outsiders.length > 0 && isAdmin && (
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:11, fontWeight:700, color:S.mu, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>
            Other Members ({outsiders.length})
          </div>
          <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,0.04)' }}>
            {outsiders.map((m, i) => {
              const pal = palette(m.full_name)
              const dot = activityDot(m.last_seen_at)
              return (
                <div key={m.id} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'11px 16px',
                  borderBottom: i < outsiders.length - 1 ? `1px solid ${S.bd}` : 'none',
                }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    {m.avatar_url ? (
                      <img src={m.avatar_url} width={32} height={32}
                        style={{ borderRadius:'50%', objectFit:'cover', display:'block' }} alt="" />
                    ) : (
                      <div style={{ width:32, height:32, borderRadius:'50%', background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:pal.tx }}>
                        {initials(m.full_name)}
                      </div>
                    )}
                    <div style={{ position:'absolute', bottom:0, right:0, width:8, height:8, borderRadius:'50%', background:dot, border:`2px solid ${S.s1}` }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{m.full_name}</div>
                    <div style={{ fontSize:11, color:S.mu }}>@{m.username}</div>
                  </div>
                  <div style={{ fontSize:11, color:S.tx2, background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:20 }}>
                    {RANK_LABEL[m.rank] ?? m.rank}
                  </div>
                  <div style={{ fontSize:11, color:S.mu, minWidth:80, textAlign:'right' }}>
                    {m.invited_by ? 'Has sponsor' : 'No sponsor'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
