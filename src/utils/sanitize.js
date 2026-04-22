/**
 * Strips HTML tags and escapes dangerous characters from user input.
 * Prevents XSS when storing messages that may contain code snippets
 * like <script>alert("example");</script> or <h1>example</h1>.
 *
 * Bug fix: originally only escaped < and > which left &amp; double-encoded
 * on subsequent renders. Fixed by ordering replacements correctly.
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips all HTML tags entirely (used for Firestore storage).
 * React renders text nodes safely, but we also strip to be defensive
 * in case the text is ever used in a non-React context.
 */
export function stripHtml(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/<[^>]*>/g, '').trim();
}
