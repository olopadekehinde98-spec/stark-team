const RANK_ORDER: Record<string, number> = {
  e_member:          0,
  distributor:       1,
  manager:           2,
  senior_manager:    3,
  executive_manager: 4,
  director:          5,
}

// What each rank is allowed to verify (ranks below them only)
const VERIFICATION_PERMISSIONS: Record<string, string[]> = {
  e_member:          [],
  distributor:       [],
  manager:           ['e_member', 'distributor'],
  senior_manager:    ['e_member', 'distributor', 'manager'],
  executive_manager: ['e_member', 'distributor', 'manager', 'senior_manager'],
  director:          ['e_member', 'distributor', 'manager', 'senior_manager', 'executive_manager'],
}

interface CanVerifyParams {
  verifierRole:          string   // 'admin' | 'leader' | 'member'
  verifierRank:          string
  verifierId:            string
  verifierBranchId:      string | null
  targetRank:            string
  targetBranchId:        string | null
  targetInvitedById?:    string | null
  targetInvitedByRank?:  string | null
}

export function canVerify(params: CanVerifyParams): { allowed: boolean; reason?: string } {
  const {
    verifierRole, verifierRank, verifierId,
    verifierBranchId, targetRank, targetBranchId,
    targetInvitedById, targetInvitedByRank,
  } = params

  // Admin can verify anyone, anywhere
  if (verifierRole === 'admin') return { allowed: true }

  // Members cannot verify
  if (verifierRole === 'member') {
    return { allowed: false, reason: 'Members do not have verification authority.' }
  }

  // E-members and distributors cannot verify
  if (verifierRank === 'e_member' || verifierRank === 'distributor') {
    return { allowed: false, reason: 'Only managers and above can verify activities.' }
  }

  // Branch check — must be same branch
  if (verifierBranchId !== targetBranchId) {
    return { allowed: false, reason: 'You can only verify members within your own branch.' }
  }

  // Senior Manager Sub-team Protection:
  // If target was recruited by a senior_manager who is NOT this verifier,
  // only that senior_manager (or admin) should verify them.
  if (
    targetInvitedByRank === 'senior_manager' &&
    targetInvitedById   !== verifierId &&
    targetRank          !== 'senior_manager'
  ) {
    return {
      allowed: false,
      reason: "This member belongs to a Senior Manager's team. Only their Senior Manager can verify them.",
    }
  }

  // Rank permission check
  const allowed = VERIFICATION_PERMISSIONS[verifierRank] ?? []
  if (!allowed.includes(targetRank)) {
    return {
      allowed: false,
      reason: `A ${verifierRank.replace(/_/g, ' ')} cannot verify a ${targetRank.replace(/_/g, ' ')}.`,
    }
  }

  return { allowed: true }
}
