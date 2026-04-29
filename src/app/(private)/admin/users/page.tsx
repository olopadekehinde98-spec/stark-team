'use client'
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
  { value:'member',            label:'Member'         },
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

const PALETTES = [
  { bg:'#EFF6FF', tx:S.blue,      bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:S.ok,        bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:S.gold,      bd:'#F5D87A' },
  { bg:'#FEF2F2', tx:S.err,       bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED',   bd:'#DDD6FE' },
]

function initials(name: string) {
  return (name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

const sel: React.CSSProperties = {
  padding:'5px 8px', fontSize:12, borderRadius:6,
  border:`1px solid ${S.bd}`, background:S.s2,
  color:S.tx, cursor:'pointer', outline:'none', maxWidth:150,
}

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [apiError,   setApiError]   = useState('')
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState<string | null>(null)
  const [toast,      setToast]      = useState('')
  const [toastOk,    setToastOk]    = useState(true)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    setApiError('')
    try {
      const r = await fetch('/api/admin/users-list')
      if (r.ok) {
        const d = await r.json()
        setUsers(d.users ?? [])
      } else {
        const d = await r.json().catch(() => ({}))
        setApiError(`Failed to load members: ${d.error ?? r.statusText}`)
      }
    } catch (e: any) {
      setApiError('Network error: ' + (e.message ?? 'Unknown'))
    }
    setLoading(false)
  }

  function flash(msg: string, ok = true) {
    setToast(msg); setToastOk(ok)
    setTimeout(() => setToast(''), 3000)
  }

  async function patch(userId: string, key: string, endpoint: string, body: object) {
    setSaving(userId + ':' + key)
    try {
      const r = await fetch(`/api/admin/users/${userId}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        setUsers(p => p.map(u => u.id === userId ? { ...u, ...body } : u))
        flash(key.charAt(0).toUpperCase() + key.slice(1) + ' updated ✓')
      } else {
        const e = await r.json().catch(() => ({}))
        flash('Error: ' + (e.error ?? 'Failed'), false)
      }
    } catch {
      flash('Network error', false)
    }
    setSaving(null)
  }

  async function deleteUser(userId: string) {
    setDeleting(userId)
    try {
      const r = await fetch(`/api/admin/users/${userId}/delete`, { method: 'DELETE' })
      if (r.ok) {
        setUsers(p => p.filter(u => u.id !== userId))
        flash('User deleted')
      } else {
        const e = await r.json().catch(() => ({}))
        flash('Error: ' + (e.error ?? 'Failed'), false)
      }
    } catch {
      flash('Network error', false)
    }
    setDeleting(null)
    setConfirmDel(null)
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  const thStyle: React.CSSProperties = {
    padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700,
    color:S.mu, borderBottom:`1px solid ${S.bd}`,
    letterSpacing:'0.05em', textTransform:'uppercase', whiteSpace:'nowrap',
    background:S.s2,
  }

  const tdStyle: React.CSSProperties = {
    padding:'11px 12px', verticalAlign:'middle',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Members</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Manage sponsor, rank, role and status for every member</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:600, color:S.gold }}>{users.length} members</span>
          <button onClick={loadUsers} style={{ padding:'7px 14px', fontSize:12, borderRadius:7, border:`1px solid ${S.bd}`, background:S.s1, color:S.tx2, cursor:'pointer' }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:999, padding:'10px 18px',
          borderRadius:8, fontSize:13, fontWeight:600, boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
          background: toastOk ? S.navy : S.err, color:'#fff',
        }}>
          {toast}
        </div>
      )}

      {/* API error banner */}
      {apiError && (
        <div style={{ background:S.errBg, border:`1px solid ${S.errBd}`, borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:13, color:S.err, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span>⚠ {apiError}</span>
          <button onClick={loadUsers} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${S.errBd}`, background:S.s1, color:S.err, fontSize:12, cursor:'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom:14 }}>
        <input
          placeholder="Search by name, email or username…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%', maxWidth:360, padding:'9px 14px', borderRadius:8,
            border:`1px solid ${S.bd}`, fontSize:13, color:S.tx, background:S.s1, outline:'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'auto', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:920 }}>
          <thead>
            <tr>
              {['Member','Email','Sponsor','Rank','Role','Status','Joined','Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding:48, textAlign:'center', color:S.mu, fontSize:13 }}>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${S.bd}`, borderTop:`2px solid ${S.navy}`, animation:'spin .7s linear infinite' }} />
                    Loading members…
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding:48, textAlign:'center', color:S.mu, fontSize:13 }}>
                  {apiError ? 'Failed to load — see error above.' : search ? 'No members match that search.' : 'No members found.'}
                </td>
              </tr>
            ) : filtered.map((u, i) => {
              const pal      = PALETTES[i % PALETTES.length]
              const isActive = u.is_active !== false
              const busy     = (key: string) => saving === u.id + ':' + key

              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${S.bd}` : 'none' }}>

                  {/* Member */}
                  <td style={tdStyle}>
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
                        <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{u.full_name ?? '—'}</div>
                        <div style={{ fontSize:11, color:S.mu }}>@{u.username ?? '—'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ ...tdStyle, fontSize:12, color:S.tx2, maxWidth:180 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {u.email ?? <span style={{ color:S.mu }}>—</span>}
                    </div>
                  </td>

                  {/* Sponsor */}
                  <td style={tdStyle}>
                    <select
                      value={u.sponsor_id ?? ''}
                      disabled={!!busy('sponsor_id')}
                      onChange={e => patch(u.id, 'sponsor_id', 'sponsor', { sponsor_id: e.target.value || null })}
                      style={{ ...sel, opacity: busy('sponsor_id') ? 0.5 : 1 }}
                    >
                      <option value="">— None —</option>
                      {users.filter(p => p.id !== u.id).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Rank */}
                  <td style={tdStyle}>
                    <select
                      value={u.rank ?? 'member'}
                      disabled={!!busy('rank')}
                      onChange={e => patch(u.id, 'rank', 'rank', { rank: e.target.value })}
                      style={{
                        ...sel,
                        border:`1px solid ${S.goldBd}`, background:S.goldBg, color:S.gold,
                        fontWeight:600, opacity: busy('rank') ? 0.5 : 1,
                      }}
                    >
                      {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {busy('rank') && <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>}
                  </td>

                  {/* Role */}
                  <td style={tdStyle}>
                    <select
                      value={u.role ?? 'member'}
                      disabled={!!busy('role')}
                      onChange={e => patch(u.id, 'role', 'role', { role: e.target.value })}
                      style={{
                        ...sel,
                        border:`1px solid ${S.blueBd}`, background:S.blueBg, color:S.blue,
                        fontWeight:600, opacity: busy('role') ? 0.5 : 1,
                      }}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {busy('role') && <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>}
                  </td>

                  {/* Status toggle */}
                  <td style={tdStyle}>
                    <button
                      onClick={() => patch(u.id, 'is_active', 'status', { is_active: !isActive })}
                      disabled={!!busy('is_active')}
                      title="Click to toggle active / inactive"
                      style={{
                        fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20,
                        border:'none', cursor:'pointer',
                        background: isActive ? S.okBg  : S.errBg,
                        color:      isActive ? S.ok    : S.err,
                        outline:   `1px solid ${isActive ? S.okBd : S.errBd}`,
                        opacity: busy('is_active') ? 0.5 : 1,
                        transition:'all 0.15s',
                      }}
                    >
                      {busy('is_active') ? '…' : isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </td>

                  {/* Joined */}
                  <td style={{ ...tdStyle, fontSize:12, color:S.tx2, whiteSpace:'nowrap' }}>
                    {fmtDate(u.created_at)}
                  </td>

                  {/* Delete */}
                  <td style={{ ...tdStyle, whiteSpace:'nowrap' }}>
                    {confirmDel === u.id ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={deleting === u.id}
                          style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:S.errBg, color:S.err, border:`1px solid ${S.errBd}`, cursor:'pointer' }}>
                          {deleting === u.id ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDel(null)}
                          style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:S.s3, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDel(u.id)}
                        style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:'transparent', color:S.err, border:`1px solid ${S.errBd}`, cursor:'pointer' }}>
                        🗑 Delete
                      </button>
                    )}
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
