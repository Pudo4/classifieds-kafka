/** Case-insensitive substring match against title + description. */
export function checkStopWords(text: string, stopWords: readonly string[]): string | null {
  const haystack = text.toLowerCase();
  const hit = stopWords.find((word) => haystack.includes(word.toLowerCase()));
  return hit ? `stop word: "${hit}"` : null;
}
