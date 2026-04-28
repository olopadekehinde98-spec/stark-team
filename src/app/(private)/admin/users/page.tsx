'use client'
import { createClient } from '@/lib/supabase/server'
import { useEffect, useState } from 'react'

const S = {
  s1:'#FFFFFF', s2:'#F8FAFC', s3:'#EEF2F7', bd:'#E2E8F0',
  navy:'#0F1C2E', gold:'#D4A017', goldBg:'#FEF9EC', goldBd:'#F5D87A',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
  warn:'#D97706', warnBg:'#FFFBEB', warnBd:'#FCD34D',
  err:'#DC2626', errBg:'#FEF2F2', errBd:'#FCA5A5',
  blue:'#2563EB', blueBg:'#EFF6FF', blueBd:'#BFDBFE',
}

const RANKS = [
  { value:'distributor',       label:'Distributor'    },
  { value:'manager',           label:'Manager'        },
  { value:'senior_manager',    label:'Senior Manager' },
  { value:'executive_manager', label:'Executive'      },
  { value:'director',          label:'Director'       },
]

const ROLES = [
  { value:'member',  label:'Member'  },
  { value:'leader',  label:'Leader'  },
  { value:'admin',   label:'Admin'   },
]

const AVATAR_PALETTES = [
  { bg:'#EFF6FF', tx:S.blue,    bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:S.ok,      bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:S.gold,    bd:'#F5D87A' },
  { bg:'#FEF2F2', tx:S.err,     bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
]

function initials(name: string) {
  return (name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function rankLabel(rank?: string) {
  return RANKS.find(r => r.value === rank)?.label ?? rank?.replace(/_/g,' ') ?? '—'
}

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [saving, setSaving]     = useState<string | null>(null)
  const [toast, setToast]       = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const r = await fetch('/api/admin/users-list')
    if (r.ok) {
      const d = await r.json()
      setUsers(d.users ?? [])
    }
    setLoading(false)
  }

  async function updateRank(userId: string, rank: string) {
    setSaving(userId + ':rank')
    const r = await fetch(`/api/admin/users/${userId}/rank`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rank }),
    })
    if (r.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rank } : u))
      flash('Rank updated ✓')
    } else {
      const e = await r.json()
      flash('Error: ' + e.error)
    }
    setSaving(null)
  }

  async function updateRole(userId: string, role: string) {
    setSaving(userId + ':role')
    const r = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (r.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      flash('Role updated ✓')
    } else {
      const e = await r.json()
      flash('Error: ' + e.error)
    }
    setSaving(null)
  }

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Members</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Update ranks and roles after members achieve milestones in Neolife</p>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:S.gold }}>
          {users.length} members
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:999,
          background:S.navy, color:'#fff',
          padding:'10px 18px', borderRadius:8,
          fontSize:13, fontWeight:600,
          boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input
          placeholder="Search by name, email or username…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', maxWidth:380, padding:'9px 14px', borderRadius:8,
            border:`1px solid ${S.bd}`, fontSize:13, color:S.tx,
            background:S.s1, outline:'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:760 }}>
          <thead>
            <tr style={{ background:S.s2 }}>
              {['Member','Email','Rank','Role','Status','Joined'].map(h => (
                <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:S.mu, borderBottom:`1px solid ${S.bd}`, letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>Loading members…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>No members found</td></tr>
            ) : filtered.map((u, i) => {
              const pal = AVATAR_PALETTES[i % AVATAR_PALETTES.length]
              const isSavingRank = saving === u.id + ':rank'
              const isSavingRole = saving === u.id + ':role'
              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${S.bd}` : 'none' }}>
                  {/* Member */}
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:34, height:34, borderRadius:'50%', flexShrink:0,
                        background:pal.bg, border:`1px solid ${pal.bd}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:700, color:pal.tx,
                      }}>
                        {initials(u.full_name ?? '?')}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{u.full_name}</div>
                        <div style={{ fontSize:11, color:S.mu }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding:'12px 16px', fontSize:12, color:S.tx2 }}>{u.email ?? '—'}</td>

                  {/* Rank dropdown */}
                  <td style={{ padding:'12px 16px' }}>
                    <select
                      value={u.rank ?? 'distributor'}
                      disabled={isSavingRank}
                      onChange={e => updateRank(u.id, e.target.value)}
                      style={{
                        padding:'5px 10px', fontSize:12, fontWeight:600, borderRadius:6,
                        border:`1px solid ${S.goldBd}`, background:S.goldBg, color:S.gold,
                        cursor:'pointer', outline:'none',
                        opacity: isSavingRank ? 0.6 : 1,
                      }}
                    >
                      {RANKS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {isSavingRank && (
                      <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>
                    )}
                  </td>

                  {/* Role dropdown */}
                  <td style={{ padding:'12px 16px' }}>
                    <select
                      value={u.role ?? 'member'}
                      disabled={isSavingRole}
                      onChange={e => updateRole(u.id, e.target.value)}
                      style={{
                        padding:'5px 10px', fontSize:12, fontWeight:600, borderRadius:6,
                        border:`1px solid ${S.blueBd}`, background:S.blueBg, color:S.blue,
                        cursor:'pointer', outline:'none',
                        opacity: isSavingRole ? 0.6 : 1,
                      }}
                    >
                      {ROLES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {isSavingRole && (
                      <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{
                      fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
                      background: u.is_active ? S.okBg : S.errBg,
                      color:      u.is_active ? S.ok   : S.err,
                      border:    `1px solid ${u.is_active ? S.okBd : S.errBd}`,
                    }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td style={{ padding:'12px 16px', fontSize:12, color:S.tx2 }}>{fmtDate(u.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
