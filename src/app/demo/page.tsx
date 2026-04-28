export default function DemoPage() {
  const S = {
    bg:'#F0F4F8',s1:'#FFFFFF',s2:'#F8FAFC',s3:'#EEF2F7',bd:'#E2E8F0',
    navy:'#0F1C2E',navy2:'#1E3A5F',gold:'#D4A017',goldBg:'#FEF9EC',goldBd:'#F5D87A',
    tx:'#0F172A',tx2:'#475569',mu:'#94A3B8',
    ok:'#16A34A',okBg:'#F0FDF4',okBd:'#86EFAC',
    warn:'#D97706',warnBg:'#FFFBEB',warnBd:'#FCD34D',
    err:'#DC2626',errBg:'#FEF2F2',errBd:'#FCA5A5',
    blue:'#2563EB',blueBg:'#EFF6FF',blueBd:'#BFDBFE',
  }

  return (
    <div style={{ minHeight:'100vh', background:S.bg, fontFamily:"'Inter',sans-serif", color:S.tx, fontSize:13 }}>

      {/* TOP NAV */}
      <div style={{ height:58, background:S.navy, display:'flex', alignItems:'center', padding:'0 24px', flexShrink:0, boxShadow:'0 1px 3px rgba(0,0,0,0.2)', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
          <div style={{ width:32, height:32, background:S.gold, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:S.navy }}>ST</div>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-.01em', marginLeft:10, marginRight:28 }}>Stark Team</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
          {['Dashboard','Activities','Goals','Leaderboard','Team','AI Coach','Recognition','Notifications'].map((l,i) => (
            <div key={l} style={{ padding:'7px 14px', fontSize:13, fontWeight:500, color:i===0?'#fff':'rgba(255,255,255,0.55)', borderRadius:6, background:i===0?'rgba(255,255,255,0.12)':'transparent', whiteSpace:'nowrap', cursor:'pointer' }}>{l}</div>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:34, height:34, borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)', fontSize:15 }}>🔔</div>
          <div style={{ width:34, height:34, borderRadius:6, border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.6)', fontSize:15 }}>⚙</div>
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'5px 12px 5px 6px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6 }}>
            <div style={{ width:28, height:28, background:S.gold, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:S.navy }}>SC</div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:'#fff' }}>Samuel</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.45)' }}>Manager</div>
            </div>
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:10, marginLeft:2 }}>▾</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding:'28px 24px', maxWidth:1140, margin:'0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', marginBottom:4 }}>Good morning, Samuel 👋</h1>
          <p style={{ fontSize:13, color:S.tx2 }}>Manager · Beta Branch · Monday, April 28 2026</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          {[
            {icon:'📊',label:'Activities this month',value:24,sub:'5 verified',badge:'+5',bc:'#16A34A'},
            {icon:'⚡',label:'Verified rate',value:'50%',sub:'Target: 60%+',badge:'Low',bc:'#D97706'},
            {icon:'🏆',label:'Leaderboard rank',value:'#6',sub:'Monthly ranking',badge:'Live',bc:'#2563EB'},
            {icon:'⏳',label:'Pending verification',value:7,sub:'Awaiting review',badge:'Action',bc:'#DC2626'},
          ].map((s,i) => (
            <div key={i} style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:S.s3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{s.icon}</div>
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:s.bc+'18', color:s.bc }}>{s.badge}</span>
              </div>
              <div style={{ fontSize:28, fontWeight:800, color:S.tx, letterSpacing:'-0.03em', lineHeight:1, marginBottom:4 }}>{s.value}</div>
              <div style={{ fontSize:12, fontWeight:500, color:S.tx2, marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:11, color:S.mu }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Recent Activities */}
            <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Recent Activities</span>
                <span style={{ fontSize:12, color:S.blue, fontWeight:600 }}>View all →</span>
              </div>
              {[
                {title:'Client Meeting — Westside Group',date:'Apr 8',st:'verified',dot:'#16A34A'},
                {title:'Sales Call — Marcus Holt',date:'Apr 7',st:'pending',dot:'#2563EB'},
                {title:'Team Training Session',date:'Apr 6',st:'verified',dot:'#16A34A'},
                {title:'Product Demo — TechCorp',date:'Apr 5',st:'rejected',dot:'#DC2626'},
                {title:'Follow-up — Renata Cruz',date:'Apr 4',st:'pending',dot:'#94A3B8'},
              ].map((a,i,arr) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:i<arr.length-1?`1px solid ${S.bd}`:'none' }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:a.dot, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:13, fontWeight:500, color:S.tx }}>{a.title}</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.mu, marginRight:10 }}>{a.date}</span>
                  <span style={{
                    fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20,
                    background: a.st==='verified'?S.okBg:a.st==='pending'?S.blueBg:S.errBg,
                    color:      a.st==='verified'?S.ok:a.st==='pending'?S.blue:S.err,
                    border:    `1px solid ${a.st==='verified'?S.okBd:a.st==='pending'?S.blueBd:S.errBd}`,
                  }}>{a.st==='verified'?'Verified':a.st==='pending'?'Pending':'Rejected'}</span>
                </div>
              ))}
            </div>

            {/* Active Goals */}
            <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <span style={{ fontSize:14, fontWeight:700, color:S.tx }}>Active Goals</span>
                <span style={{ fontSize:12, color:S.blue, fontWeight:600 }}>+ New goal</span>
              </div>
              {[
                {title:'20 Client Calls — April',pct:65,color:'#D4A017',type:'Monthly',days:'22 days left'},
                {title:'5 New Recruits This Week',pct:40,color:'#D97706',type:'Weekly',days:'3 days left'},
              ].map((g,i) => (
                <div key={i} style={{ marginBottom:i===0?16:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:S.tx }}>{g.title}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:g.color, fontWeight:600 }}>{g.pct}%</span>
                  </div>
                  <div style={{ height:6, background:S.s3, borderRadius:3, overflow:'hidden', margin:'7px 0' }}>
                    <div style={{ width:`${g.pct}%`, height:'100%', borderRadius:3, background:g.color }} />
                  </div>
                  <div style={{ fontSize:11, color:S.mu }}>
                    <span style={{ background:S.s3, border:`1px solid ${S.bd}`, padding:'2px 8px', borderRadius:10, marginRight:7, fontSize:10, fontWeight:500 }}>{g.type}</span>
                    {g.days}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Rank card */}
            <div style={{ background:S.navy, borderRadius:10, padding:20 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em', marginBottom:14 }}>YOUR RANK</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ width:46, height:46, background:S.gold, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:S.navy, flexShrink:0 }}>M</div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:'#fff' }}>Manager</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:1 }}>68% to Senior Manager</div>
                </div>
              </div>
              <div style={{ height:6, background:'rgba(255,255,255,0.1)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                <div style={{ width:'68%', height:'100%', background:S.gold, borderRadius:3 }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>Progress</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:S.gold, fontWeight:600 }}>68%</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background:S.s1, border:`1px solid ${S.bd}`, borderRadius:10, padding:18, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:14, fontWeight:700, color:S.tx, marginBottom:12 }}>Quick Actions</div>
              {[
                {label:'+ Submit Activity',bg:S.navy,color:'#fff',border:'none'},
                {label:'+ Create Goal',bg:S.s1,color:S.tx2,border:`1px solid ${S.bd}`},
                {label:'View Leaderboard',bg:S.s1,color:S.tx2,border:`1px solid ${S.bd}`},
              ].map((b,i) => (
                <div key={i} style={{ display:'block', padding:'9px 16px', borderRadius:8, marginBottom:i<2?8:0, background:b.bg, color:b.color, border:b.border, fontSize:13, fontWeight:600, textAlign:'center' as const }}>{b.label}</div>
              ))}
            </div>

            {/* AI Coach */}
            <div style={{ background:S.navy2, borderRadius:10, padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#60A5FA' }} />
                <span style={{ fontSize:11, fontWeight:700, color:'#60A5FA', letterSpacing:'0.05em' }}>AI COACH</span>
              </div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.75)', lineHeight:1.65, marginBottom:12 }}>
                Verified rate <strong style={{ color:'#fff' }}>50%</strong> — below target. 4 pending activities have no proof attached and expire in 9 days.
              </div>
              <span style={{ fontSize:12, color:'#60A5FA', fontWeight:600 }}>Open AI Coach →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
