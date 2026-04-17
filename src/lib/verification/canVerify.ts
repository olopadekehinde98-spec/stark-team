// Rank order for comparison
const RANK_ORDER: Record<string, number> = {
  distributor:       1,
  manager:           2,
  senior_manager:    3,
  executive_manager: 4,
  director:          5,
}

// What each rank is allowed to verify (ranks below them only)
const VERIFICATION_PERMISSIONS: Record<string, string[]> = {
  distributor:       [],
  manager:           ['distributor'],
  senior_manager:    ['distributor', 'manager'],
  executive_manager: ['distributor', 'manager', 'senior_manager'],
  director:          ['distributor', 'manager', 'senior_manager', 'executive_manager'],
}

interface CanVerifyParams {
  verifierRole:     string   // 'admin' | 'leader' | 'member'
  verifierRank:     string
  verifierBranchId: string
  targetRank:       string
  targetBranchId:   string
}

export function canVerify(params: CanVerifyParams): { allowed: boolean; reason?: string } {
  const { verifierRole, verifierRank, verifierBranchId, targetRank, targetBranchId } = params

  // Admin can verify anyone, anywhere
  if (verifierRole === 'admin') return { allowed: true }

  // Members cannot verify
  if (verifierRole === 'member') {
    return { allowed: false, reason: 'Members do not have verification authority.' }
  }

  // Distributors cannot verify even if somehow assigned leader role
  if (verifierRank === 'distributor') {
    return { allowed: false, reason: 'Distributors cannot verify activities.' }
  }

  // Branch check — must be same branch (leaders cannot cross branches)
  if (verifierBranchId !== targetBranchId) {
    return { allowed: false, reason: 'You can only verify members within your own branch.' }
  }

  // Rank permission check
  const allowed = VERIFICATION_PERMISSIONS[verifierRank] ?? []
  if (!allowed.includes(targetRank)) {
    return {
      allowed: false,
      reason: `A ${verifierRank.replace('_', ' ')} cannot verify a ${targetRank.replace('_', ' ')}.`,
    }
  }

  return { allowed: true }
}
