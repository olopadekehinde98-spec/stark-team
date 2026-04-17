import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Bot } from 'lucide-react'
import Link from 'next/link'
interface Tip { priority:string; category:string; message:string; action:string }
export default function AICoachQuickTip({ tip }: { tip:Tip|null }) {
  if (!tip) return null
  const variant = tip.priority==='high'?'error':tip.priority==='medium'?'warning':'info'
  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Bot size={16} style={{ color:'var(--gold)' }} />
        <h3 className="text-sm font-semibold" style={{ color:'var(--text-secondary)' }}>AI Coach</h3>
        <Badge variant={variant as any}>{tip.priority}</Badge>
      </div>
      <p className="text-sm font-medium" style={{ color:'var(--text-primary)' }}>{tip.message}</p>
      <p className="text-xs mt-2" style={{ color:'var(--text-muted)' }}>{tip.action}</p>
      <Link href="/ai-coach" className="inline-block mt-3 text-xs font-medium" style={{ color:'var(--gold)' }}>Open AI Coach →</Link>
    </Card>
  )
}