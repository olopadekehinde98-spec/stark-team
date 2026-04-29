const S = {
  s1:'#FFFFFF', bd:'#E2E8F0', navy:'#0F1C2E', gold:'#D4A017',
  tx:'#0F172A', tx2:'#475569', mu:'#94A3B8',
  ok:'#16A34A', okBg:'#F0FDF4', okBd:'#86EFAC',
}

const RANKS = [
  {
    value: 'e_member', label: 'E-Member', points: 0,
    desc: 'Entry-level. New member who joined via invite link.',
  },
  {
    value: 'distributor', label: 'Distributor', points: 0,
    desc: 'Active distributor who has joined the team.',
  },
  {
    value: 'manager', label: 'Manager', points: 500,
    desc: 'Achieved first promotion milestone in Neolife.',
  },
  {
    value: 'senior_manager', label: 'Senior Manager', points: 2000,
    desc: 'Consistent performer with a growing downline.',
  },
  {
    value: 'executive_manager', label: 'Executive', points: 5000,
    desc: 'Top-tier performer. Recognised Executive in Neolife.',
  },
  {
    value: 'director', label: 'Director', points: 10000,
    desc: 'Highest rank. Director-level achiever in Neolife.',
  },
]

export default function AdminRankCriteriaPage() {
  return (
    <div>
      <div style={{ marginBottom:22 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Rank Criteria</h1>
        <p style={{ fontSize:13, color:S.tx2 }}>
          Neolife rank levels — update a member's rank from the Members page after they achieve it
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {RANKS.map((r, i) => (
          <div key={r.value} style={{
            background:S.s1, border:`1px solid ${S.bd}`, borderRadius:12, padding:20,
            boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
            display:'flex', alignItems:'center', gap:18,
          }}>
            {/* Step number */}
            <div style={{
              width:40, height:40, borderRadius:'50%', flexShrink:0,
              background: i === RANKS.length - 1 ? S.gold : S.navy,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, fontWeight:800, color:'#fff',
            }}>{i + 1}</div>

            {/* Info */}
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                <span style={{ fontSize:15, fontWeight:700, color:S.tx }}>{r.label}</span>
                <span style={{
                  fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:12,
                  background:S.okBg, color:S.ok, border:`1px solid ${S.okBd}`,
                }}>
                  {r.points.toLocaleString()} pts
                </span>
              </div>
              <p style={{ fontSize:13, color:S.tx2, margin:0 }}>{r.desc}</p>
            </div>

            {/* DB value */}
            <div style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.mu,
              background:'#F8FAFC', border:`1px solid ${S.bd}`, borderRadius:6,
              padding:'4px 10px', flexShrink:0,
            }}>{r.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, background:'#FEF9EC', border:'1px solid #F5D87A', borderRadius:10, padding:16, fontSize:13, color:'#92400E' }}>
        <strong>How to promote a member:</strong> Go to the <strong>Members</strong> page → find the member → change their rank dropdown. Changes save instantly.
      </div>
    </div>
  )
}
