const entityMap: Record<string, string> = {
  '&nbsp;': '\u00A0',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&cent;': '¢',
  '&pound;': '£',
  '&yen;': '¥',
  '&euro;': '€',
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&times;': '×',
  '&divide;': '÷',
  '&lt;': '<',
  '&gt;': '>',
  '&le;': '≤',
  '&ge;': '≥',
  '&ne;': '≠',
  '&equiv;': '≡',
  '&plusmn;': '±',
  '&para;': '¶',
  '&bull;': '•',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’',
  '&laquo;': '«',
  '&raquo;': '»',
  '&deg;': '°',
  '&sup1;': '¹',
  '&sup2;': '²',
  '&sup3;': '³',
  '&frac14;': '¼',
  '&frac12;': '½',
  '&frac34;': '¾',
  '&OElig;': 'Œ',
  '&oelig;': 'œ',
  '&Scaron;': 'Š',
  '&scaron;': 'š',
  '&Yuml;': 'Ÿ',
  '&fnof;': 'ƒ',
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
  '&thetasym;': 'ϑ',
  '&upsih;': 'ϒ',
  '&piv;': 'ϖ',
  '&rarr;': '→',
  '&larr;': '←',
  '&uarr;': '↑',
  '&darr;': '↓',
  '&harr;': '↔',
  '&crarr;': '↵',
  '&lArr;': '⇐',
  '&rArr;': '⇒',
  '&uArr;': '⇑',
  '&dArr;': '⇓',
  '&hArr;': '⇔',
  '&nabla;': '∇',
  '&partial;': '∂',
  '&infin;': '∞',
  '&prod;': '∏',
  '&sum;': '∑',
  '&lowast;': '∗',
  '&radic;': '√',
  '&prop;': '∝',
  '&infin;': '∞',
  '&ang;': '∠',
  '&cap;': '∩',
  '&cup;': '∪',
  '&int;': '∫',
  '&there4;': '∴',
  '&sim;': '∼',
  '&cong;': '≅',
  '&asymp;': '≈',
  '&ne;': '≠',
  '&equiv;': '≡',
  '&le;': '≤',
  '&ge;': '≥',
  '&sub;': '⊂',
  '&sup;': '⊃',
  '&nsub;': '⊄',
  '&sube;': '⊆',
  '&supe;': '⊇',
  '&oplus;': '⊕',
  '&otimes;': '⊗',
  '&perp;': '⊥',
  '&sdot;': '⋅',
  '&vellip;': '⋮',
  '&lceil;': '⌈',
  '&rceil;': '⌉',
  '&lfloor;': '⌊',
  '&rfloor;': '⌋',
  '&lang;': '〈',
  '&rang;': '〉',
  '&loz;': '◊',
  '&spades;': '♠',
  '&clubs;': '♣',
  '&hearts;': '♥',
  '&diams;': '♦',
};

const reverseMap: Record<string, string> = {};
for (const [entity, char] of Object.entries(entityMap)) {
  reverseMap[char] = entity;
}

function decodeNamedEntities(html: string): string {
  return html.replace(/&[a-zA-Z0-9]+;/g, match => {
    return entityMap[match] || match;
  });
}

function decodeDecimalEntities(html: string): string {
  return html.replace(/&#(\d+);/g, (_, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
}

function decodeHexEntities(html: string): string {
  return html.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

function encodeNamedEntities(text: string): string {
  let result = text;
  for (const [char, entity] of Object.entries(reverseMap)) {
    result = result.replaceAll(char, entity);
  }
  return result;
}

export function decodeHtmlEntities(html: string): string {
  let result = html;
  result = decodeNamedEntities(result);
  result = decodeDecimalEntities(result);
  result = decodeHexEntities(result);
  return result;
}

export function encodeHtmlEntities(text: string): string {
  // First encode special characters that must be escaped
  let result = text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
  // Then encode named entities for other characters
  result = encodeNamedEntities(result);
  return result;
}
