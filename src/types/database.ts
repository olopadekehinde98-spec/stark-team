export type Role = 'admin' | 'leader' | 'member'
export type Rank = 'e_member' | 'distributor' | 'manager' | 'senior_manager' | 'executive_manager' | 'director'
export type ActivityStatus = 'pending' | 'verified' | 'unverified' | 'rejected'
export type GoalStatus = 'pending_approval' | 'active' | 'completed' | 'failed' | 'archived' | 'rejected'
export type GoalType = 'daily' | 'weekly' | 'monthly'
export type Period = 'daily' | 'weekly' | 'monthly' | 'alltime'
export type BadgeType = 'activity' | 'goal' | 'rank' | 'leadership' | 'custom'

export interface User {
  id: string
  email: string
  full_name: string
  username: string
  avatar_url: string | null
  bio: string | null
  role: Role
  rank: Rank
  branch_id: string | null
  invited_by: string | null
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

export interface Activity {
  id: string
  user_id: string
  goal_id: string | null
  template_id: string | null
  title: string
  description: string | null
  activity_type: string
  activity_date: string
  proof_url: string | null
  proof_type: 'image' | 'video_link' | 'document' | 'none' | null
  status: ActivityStatus
  edit_locked_at: string | null
  submitted_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  goal_type: GoalType
  target_metric: number
  current_metric: number
  deadline: string
  status: GoalStatus
  created_at: string
  updated_at: string
}