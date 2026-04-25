'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'

type AlertData = {
  inactiveUsers: { id: string; full_name: string; rank: string }[]
  stalePending: number
}

export default function AdminAlertsPage() {
  const [data, setData] = useState<AlertData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/alerts')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  const total = (data?.inactiveUsers.length ?? 0) + (data?.stalePending ?? 0 ? 1 : 0)

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <PageHeader title="Alerts" subtitle="System health and attention items" />
        {!loading && total > 0 && (
          <span style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: 'rgba(239,68,68,0.12)', color: '#f87171',
            border: '1px solid rgba(239,68,68,0.25)',
          }}>{total} alert{total !== 1 ? 's' : ''}</span>
        )}
      </div>

      {loading ? (
        <div style={{ color: '#4b5563', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stale pending activities */}
          <div style={{
            background: '#111827',
            border: `1px solid ${(data?.stalePending ?? 0) > 0 ? 'rgba(245,158,11,0.35)' : '#1f2937'}`,
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>⏳</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Stale Pending Activities</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Activities pending for more than 7 days
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 24, fontWeight: 800,
                color: (data?.stalePending ?? 0) > 0 ? '#f59e0b' : '#10b981',
              }}>
                {data?.stalePending ?? 0}
              </span>
            </div>
            {(data?.stalePending ?? 0) > 0 ? (
              <div style={{
                fontSize: 12, color: '#f59e0b',
                background: 'rgba(245,158,11,0.06)', borderRadius: 8, padding: '8px 12px',
              }}>
                {data!.stalePending} activities have been waiting over a week — assign a reviewer or reject them.
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#10b981' }}>All activities reviewed within 7 days. ✓</div>
            )}
          </div>

          {/* Inactive users */}
          <div style={{
            background: '#111827',
            border: `1px solid ${(data?.inactiveUsers.length ?? 0) > 0 ? 'rgba(239,68,68,0.3)' : '#1f2937'}`,
            borderRadius: 14, padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>👤</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Inactive Members</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Active accounts with no activity in the last 7 days
                </div>
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 24, fontWeight: 800,
                color: (data?.inactiveUsers.length ?? 0) > 0 ? '#ef4444' : '#10b981',
              }}>
                {data?.inactiveUsers.length ?? 0}
              </span>
            </div>

            {(data?.inactiveUsers.length ?? 0) === 0 ? (
              <div style={{ fontSize: 12, color: '#10b981' }}>No inactive members. ✓</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data!.inactiveUsers.map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: '#1f2937', borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{u.full_name}</div>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: '#111827', color: '#9ca3af', border: '1px solid #374151',
                      textTransform: 'capitalize',
                    }}>
                      {u.rank?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All clear banner */}
          {total === 0 && (
            <div style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 14, padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>All systems operational</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>No alerts at this time.</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
