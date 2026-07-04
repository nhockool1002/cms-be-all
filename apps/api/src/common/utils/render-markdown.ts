function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Placeholder renderer: escapes HTML and converts newlines to <br>.
// Swap for a real markdown pipeline (e.g. markdown-it + a sanitizer) in a later phase.
export function renderMarkdown(markdown: string): string {
  return escapeHtml(markdown).replace(/\n/g, '<br>');
}
