import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0 overflow-hidden', sizes[size], className)}
      style={src ? {} : { background: 'var(--gold)', color: '#0A0D14' }}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : name?.[0]?.toUpperCase()
      }
    </div>
  )
}