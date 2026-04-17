import Badge from './Badge'

const rankLabels: Record<string, string> = {
  distributor:       'Distributor',
  manager:           'Manager',
  senior_manager:    'Senior Manager',
  executive_manager: 'Executive Manager',
  director:          'Director',
}

export default function RankBadge({ rank }: { rank: string }) {
  return <Badge variant="gold">{rankLabels[rank] ?? rank}</Badge>
}