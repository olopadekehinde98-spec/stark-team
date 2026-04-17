interface TableProps {
  headers: string[]
  rows: React.ReactNode[][]
  className?: string
}

export default function Table({ headers, rows, className }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className ?? ''}`}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
