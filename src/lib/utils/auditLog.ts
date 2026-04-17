import { createAdminClient } from '@/lib/supabase/admin'

export async function writeAuditLog({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
  ipAddress,
}: {
  actorId:     string
  action:      string
  targetType?: string
  targetId?:   string
  metadata?:   Record<string, unknown>
  ipAddress?:  string
}) {
  const supabase = createAdminClient()
  await supabase.from('audit_logs').insert({
    actor_id:    actorId,
    action,
    target_type: targetType,
    target_id:   targetId,
    metadata,
    ip_address:  ipAddress,
  })
}
