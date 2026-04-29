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
  { bg:'#EFF6FF', tx:S.blue,    bd:'#BFDBFE' },
  { bg:'#F0FDF4', tx:S.ok,      bd:'#86EFAC' },
  { bg:'#FEF9EC', tx:S.gold,    bd:'#F5D87A' },
  { bg:'#FEF2F2', tx:S.err,     bd:'#FCA5A5' },
  { bg:'#F5F3FF', tx:'#7C3AED', bd:'#DDD6FE' },
]

const COLS = 8 // Member | Email | Sponsor | Rank | Role | Status | Joined | Actions

function initials(name: string) {
  return (name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [saving,     setSaving]     = useState<string | null>(null)
  const [toast,      setToast]      = useState('')
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [deleting,   setDeleting]   = useState<string | null>(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const r = await fetch('/api/admin/users-list')
    if (r.ok) { const d = await r.json(); setUsers(d.users ?? []) }
    setLoading(false)
  }

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function updateRank(userId: string, rank: string) {
    setSaving(userId + ':rank')
    const r = await fetch(`/api/admin/users/${userId}/rank`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rank }),
    })
    if (r.ok) { setUsers(p => p.map(u => u.id === userId ? { ...u, rank } : u)); flash('Rank updated ✓') }
    else { const e = await r.json(); flash('Error: ' + e.error) }
    setSaving(null)
  }

  async function updateRole(userId: string, role: string) {
    setSaving(userId + ':role')
    const r = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (r.ok) { setUsers(p => p.map(u => u.id === userId ? { ...u, role } : u)); flash('Role updated ✓') }
    else { const e = await r.json(); flash('Error: ' + e.error) }
    setSaving(null)
  }

  async function updateSponsor(userId: string, sponsorId: string) {
    setSaving(userId + ':sponsor')
    const r = await fetch(`/api/admin/users/${userId}/sponsor`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsor_id: sponsorId || null }),
    })
    if (r.ok) { setUsers(p => p.map(u => u.id === userId ? { ...u, sponsor_id: sponsorId || null } : u)); flash('Sponsor updated ✓') }
    else { const e = await r.json(); flash('Error: ' + e.error) }
    setSaving(null)
  }

  async function toggleStatus(userId: string, current: boolean) {
    setSaving(userId + ':status')
    const r = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current }),
    })
    if (r.ok) { setUsers(p => p.map(u => u.id === userId ? { ...u, is_active: !current } : u)); flash(current ? 'Member deactivated' : 'Member activated') }
    else { const e = await r.json(); flash('Error: ' + e.error) }
    setSaving(null)
  }

  async function deleteUser(userId: string) {
    setDeleting(userId)
    const r = await fetch(`/api/admin/users/${userId}/delete`, { method: 'DELETE' })
    setDeleting(null); setConfirmDel(null)
    if (r.ok) { setUsers(p => p.filter(u => u.id !== userId)); flash('User deleted') }
    else { const e = await r.json(); flash('Error: ' + (e.error ?? 'Failed')) }
  }

  const filtered = users.filter(u =>
    !search ||
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  const thStyle: React.CSSProperties = {
    padding:'11px 14px', textAlign:'left', fontSize:11, fontWeight:700,
    color:S.mu, borderBottom:`1px solid ${S.bd}`,
    letterSpacing:'0.05em', textTransform:'uppercase', whiteSpace:'nowrap',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Members</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Manage sponsor, rank, role and status for every member</p>
        </div>
        <div style={{ fontSize:13, fontWeight:600, color:S.gold }}>{users.length} members</div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:999, background:S.navy, color:'#fff', padding:'10px 18px', borderRadius:8, fontSize:13, fontWeight:600, boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input
          placeholder="Search by name, email or username…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width:'100%', maxWidth:380, padding:'9px 14px', borderRadius:8, border:`1px solid ${S.bd}`, fontSize:13, color:S.tx, background:S.s1, outline:'none' }}
        />
      </div>

      {/* Table wrapper — horizontally scrollable */}
      <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, overflow:'auto', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
          <thead>
            <tr style={{ background:S.s2 }}>
              {['Member','Email','Sponsor','Rank','Role','Status','Joined','Actions'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS} style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>Loading members…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={COLS} style={{ padding:40, textAlign:'center', color:S.mu, fontSize:13 }}>No members found</td></tr>
            ) : filtered.map((u, i) => {
              const pal          = PALETTES[i % PALETTES.length]
              const isActive     = u.is_active !== false
              const isSavingRank = saving === u.id + ':rank'
              const isSavingRole = saving === u.id + ':role'
              const isSavingSpon = saving === u.id + ':sponsor'
              const isSavingStat = saving === u.id + ':status'

              return (
                <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${S.bd}` : 'none' }}>

                  {/* Member */}
                  <td style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0, background:pal.bg, border:`1px solid ${pal.bd}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:pal.tx }}>
                        {initials(u.full_name ?? '?')}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:S.tx }}>{u.full_name}</div>
                        <div style={{ fontSize:11, color:S.mu }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding:'12px 14px', fontSize:12, color:S.tx2 }}>{u.email ?? '—'}</td>

                  {/* Sponsor */}
                  <td style={{ padding:'12px 14px' }}>
                    <select
                      value={u.sponsor_id ?? ''}
                      disabled={isSavingSpon}
                      onChange={e => updateSponsor(u.id, e.target.value)}
                      style={{ padding:'5px 8px', fontSize:12, borderRadius:6, border:`1px solid ${S.bd}`, background:S.s2, color:S.tx2, cursor:'pointer', outline:'none', maxWidth:140, opacity: isSavingSpon ? 0.6 : 1 }}
                    >
                      <option value="">— None —</option>
                      {users.filter(p => p.id !== u.id).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </td>

                  {/* Rank */}
                  <td style={{ padding:'12px 14px' }}>
                    <select
                      value={u.rank ?? 'member'}
                      disabled={isSavingRank}
                      onChange={e => updateRank(u.id, e.target.value)}
                      style={{ padding:'5px 8px', fontSize:12, fontWeight:600, borderRadius:6, border:`1px solid ${S.goldBd}`, background:S.goldBg, color:S.gold, cursor:'pointer', outline:'none', opacity: isSavingRank ? 0.6 : 1 }}
                    >
                      {RANKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {isSavingRank && <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>}
                  </td>

                  {/* Role */}
                  <td style={{ padding:'12px 14px' }}>
                    <select
                      value={u.role ?? 'member'}
                      disabled={isSavingRole}
                      onChange={e => updateRole(u.id, e.target.value)}
                      style={{ padding:'5px 8px', fontSize:12, fontWeight:600, borderRadius:6, border:`1px solid ${S.blueBd}`, background:S.blueBg, color:S.blue, cursor:'pointer', outline:'none', opacity: isSavingRole ? 0.6 : 1 }}
                    >
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {isSavingRole && <span style={{ marginLeft:6, fontSize:11, color:S.mu }}>saving…</span>}
                  </td>

                  {/* Status — clickable toggle */}
                  <td style={{ padding:'12px 14px' }}>
                    <button
                      onClick={() => toggleStatus(u.id, isActive)}
                      disabled={isSavingStat}
                      title="Click to toggle"
                      style={{
                        fontSize:11, fontWeight:600, padding:'4px 12px', borderRadius:20, border:'none', cursor:'pointer',
                        background: isActive ? S.okBg  : S.errBg,
                        color:      isActive ? S.ok    : S.err,
                        outline:   `1px solid ${isActive ? S.okBd : S.errBd}`,
                        opacity: isSavingStat ? 0.6 : 1,
                        transition:'all 0.15s',
                      }}
                    >
                      {isSavingStat ? '…' : isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </td>

                  {/* Joined */}
                  <td style={{ padding:'12px 14px', fontSize:12, color:S.tx2, whiteSpace:'nowrap' }}>{fmtDate(u.created_at)}</td>

                  {/* Delete */}
                  <td style={{ padding:'12px 14px', whiteSpace:'nowrap' }}>
                    {confirmDel === u.id ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button onClick={() => deleteUser(u.id)} disabled={deleting === u.id}
                          style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:S.errBg, color:S.err, border:`1px solid ${S.errBd}`, cursor:'pointer' }}>
                          {deleting === u.id ? '…' : 'Confirm'}
                        </button>
                        <button onClick={() => setConfirmDel(null)}
                          style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:600, background:S.s3, color:S.tx2, border:`1px solid ${S.bd}`, cursor:'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDel(u.id)}
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
