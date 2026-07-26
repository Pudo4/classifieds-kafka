const URL_PATTERN = /https?:\/\/\S+|www\.\S+/gi;

export function checkLinkCount(text: string, maxLinks: number): string | null {
  const matches = text.match(URL_PATTERN) ?? [];
  if (matches.length > maxLinks) {
    return `too many links: ${matches.length} (max ${maxLinks})`;
  }
  return null;
}
