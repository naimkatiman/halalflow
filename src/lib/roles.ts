const ROLE_RANK: Record<string, number> = { member: 0, admin: 1, owner: 2 };

/**
 * True when a user's org role meets or exceeds the required role
 * (owner > admin > member). Unknown roles never satisfy anything.
 */
export function roleSatisfies(userRole: string, requiredRole: string): boolean {
  const userRank = ROLE_RANK[userRole];
  const requiredRank = ROLE_RANK[requiredRole];
  if (userRank === undefined || requiredRank === undefined) return false;
  return userRank >= requiredRank;
}
