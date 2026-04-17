'use client'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        {title && <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>{title}</h2>}
        {children}
      </div>
    </div>
  )
}
