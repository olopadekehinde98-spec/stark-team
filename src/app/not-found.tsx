import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F0F4F8', padding: '0 24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          width: 72, height: 72, background: '#0F1C2E', borderRadius: 14,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#D4A017', marginBottom: 24,
        }}>ST</div>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#0F1C2E', lineHeight: 1, marginBottom: 8, letterSpacing: '-0.04em' }}>
          404
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: '#475569', marginBottom: 32, lineHeight: 1.6 }}>
          This page doesn&apos;t exist or you don&apos;t have access to it.
          Check the URL or head back to your dashboard.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{
            padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: '#0F1C2E', color: '#fff', textDecoration: 'none',
          }}>
            Go to Dashboard
          </Link>
          <Link href="/activities" style={{
            padding: '11px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: '#fff', color: '#0F172A', textDecoration: 'none',
            border: '1px solid #E2E8F0',
          }}>
            My Activities
          </Link>
        </div>
      </div>
    </div>
  )
}
