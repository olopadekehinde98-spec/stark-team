import { cn } from '@/lib/utils/cn'

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg', className)}
      style={{ background: 'var(--bg-surface-2)' }}
    />
  )
}