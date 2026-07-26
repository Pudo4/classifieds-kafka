export function checkPriceRange(priceCents: number, minPriceCents: number, maxPriceCents: number): string | null {
  if (priceCents < minPriceCents) {
    return `price ${priceCents} is below the minimum of ${minPriceCents}`;
  }
  if (priceCents > maxPriceCents) {
    return `price ${priceCents} is above the maximum of ${maxPriceCents}`;
  }
  return null;
}
