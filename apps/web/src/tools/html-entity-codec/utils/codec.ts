const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': '\u00A0',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&laquo;': '«',
  '&raquo;': '»',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&bull;': '•',
  '&middot;': '·',
  '&dagger;': '†',
  '&Dagger;': '‡',
  '&permil;': '‰',
  '&sect;': '§',
  '&para;': '¶',
  '&deg;': '°',
  '&plusmn;': '±',
  '&times;': '×',
  '&divide;': '÷',
  '&frac14;': '¼',
  '&frac12;': '½',
  '&frac34;': '¾',
  '&OElig;': 'Œ',
  '&oelig;': 'œ',
  '&Scaron;': 'Š',
  '&scaron;': 'š',
  '&Yuml;': 'Ÿ',
  '&circ;': 'ˆ',
  '&tilde;': '˜',
  '&Alpha;': 'Α',
  '&Beta;': 'Β',
  '&Gamma;': 'Γ',
  '&Delta;': 'Δ',
  '&Epsilon;': 'Ε',
  '&Zeta;': 'Ζ',
  '&Eta;': 'Η',
  '&Theta;': 'Θ',
  '&Iota;': 'Ι',
  '&Kappa;': 'Κ',
  '&Lambda;': 'Λ',
  '&Mu;': 'Μ',
  '&Nu;': 'Ν',
  '&Xi;': 'Ξ',
  '&Omicron;': 'Ο',
  '&Pi;': 'Π',
  '&Rho;': 'Ρ',
  '&Sigma;': 'Σ',
  '&Tau;': 'Τ',
  '&Upsilon;': 'Υ',
  '&Phi;': 'Φ',
  '&Chi;': 'Χ',
  '&Psi;': 'Ψ',
  '&Omega;': 'Ω',
  '&alpha;': 'α',
  '&beta;': 'β',
  '&gamma;': 'γ',
  '&delta;': 'δ',
  '&epsilon;': 'ε',
  '&zeta;': 'ζ',
  '&eta;': 'η',
  '&theta;': 'θ',
  '&iota;': 'ι',
  '&kappa;': 'κ',
  '&lambda;': 'λ',
  '&mu;': 'μ',
  '&nu;': 'ν',
  '&xi;': 'ξ',
  '&omicron;': 'ο',
  '&pi;': 'π',
  '&rho;': 'ρ',
  '&sigma;': 'σ',
  '&tau;': 'τ',
  '&upsilon;': 'υ',
  '&phi;': 'φ',
  '&chi;': 'χ',
  '&psi;': 'ψ',
  '&omega;': 'ω',
};

const REVERSE_ENTITY_MAP: Record<string, string> = Object.entries(ENTITY_MAP).reduce(
  (acc: Record<string, string>, [entity, char]) => {
    acc[char] = entity;
    return acc;
  },
  {},
);

/**
 * Decode HTML entities to plain text
 */
export function decodeHtmlEntities(html: string): string {
  return html.replace(/&[a-zA-Z0-9]+;/g, (match) => {
    return ENTITY_MAP[match] || match;
  });
}

/**
 * Encode special HTML characters to entities
 */
export function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"']/g, (char) => {
    return REVERSE_ENTITY_MAP[char] || char;
  });
}
