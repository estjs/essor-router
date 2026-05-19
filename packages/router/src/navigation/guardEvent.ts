/**
 * Shared guard for navigation link click events.
 * Rejects navigation when modifier keys are held, right-click is used,
 * `target="_blank"` is set, or `preventDefault()` was called.
 */
export function guardLinkEvent(e: MouseEvent): boolean {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return false;
  if (e.defaultPrevented) return false;
  if (e.button !== undefined && e.button !== 0) return false;

  if (e.currentTarget) {
    const target = (e.currentTarget as Element).getAttribute('target');
    if (target && /\b_blank\b/i.test(target)) return false;
  }

  e.preventDefault();
  return true;
}
