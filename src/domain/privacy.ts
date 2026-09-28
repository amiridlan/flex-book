/**
 * Masks an email for staff list views (`aisyah@example.com` -> `a***@example.com`).
 * Staff see full contact details only where they need them; this follows the
 * data-minimisation principle of Malaysia's PDPA 2010.
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return '***';
  return `${email[0]}***${email.slice(at)}`;
}
