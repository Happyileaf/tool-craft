// Latin words used to generate Lorem Ipsum text
const words = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'dolor',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
];

function getRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

function generateSentence(): string {
  const wordCount = Math.floor(Math.random() * 12) + 6; // 6-17 words
  let sentence = '';
  for (let i = 0; i < wordCount; i++) {
    let word = getRandomWord();
    if (i === 0) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    sentence += word;
    if (i < wordCount - 1) {
      if (Math.random() > 0.8) {
        sentence += ',';
      }
      sentence += ' ';
    }
  }
  sentence += '.';
  return sentence;
}

function generateParagraph(): string {
  const sentenceCount = Math.floor(Math.random() * 4) + 3; // 3-6 sentences
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(' ');
}

export function generateLoremIpsum(paragraphs: number): string {
  const result: string[] = [];
  for (let i = 0; i < paragraphs; i++) {
    result.push(generateParagraph());
  }
  return result.join('\n\n');
}
