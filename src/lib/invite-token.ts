/**
 * Secure invitation token generation.
 * Uses crypto.randomUUID + timestamp to create unguessable tokens.
 */

export function generateInviteToken(): string {
  const random = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now().toString(36);
  return `${timestamp}_${random}`;
}

export function getInviteExpiryDate(): Date {
  // Invites expire after 7 days
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}
