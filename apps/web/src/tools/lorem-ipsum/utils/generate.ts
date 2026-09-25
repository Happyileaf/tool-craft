import { words } from '../constants';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random word from the word list
 */
function randomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

/**
 * Generate a sentence with random number of words
 */
function generateSentence(minWords: number = 5, maxWords: number = 20): string {
  const wordCount = randomInt(minWords, maxWords);
  const sentenceWords = Array.from({ length: wordCount }, randomWord);
  // Capitalize first word
  sentenceWords[0] = sentenceWords[0].charAt(0).toUpperCase() + sentenceWords[0].slice(1);
  return sentenceWords.join(' ') + '.';
}

/**
 * Generate a paragraph with random number of sentences
 */
function generateParagraph(minSentences: number = 3, maxSentences: number = 8): string {
  const sentenceCount = randomInt(minSentences, maxSentences);
  const sentences = Array.from({ length: sentenceCount }, () => generateSentence());
  return sentences.join(' ');
}

/**
 * Generate Lorem Ipsum text
 */
export function generateLoremIpsum(paragraphs: number, sentencesPerParagraph: { min: number; max: number } = { min: 3, max: 8 }): string {
  const result = Array.from({ length: paragraphs }, () => generateParagraph(sentencesPerParagraph.min, sentencesPerParagraph.max));
  return result.join('\n\n');
}
