export const DEFAULT_SAMPLE_INPUT = '<p class="test">Hello & Welcome</p>';

export const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const REVERSE_HTML_ENTITY_MAP: Record<string, string> = Object.entries(
  HTML_ENTITY_MAP
).reduce((acc, [char, entity]) => {
  acc[entity] = char;
  return acc;
}, {} as Record<string, string>);
