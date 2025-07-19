export function getCrossingCombinations(input: string, isJodaCut = false): string[] {
  const digits = input.replace(/[^\d]/g, "").split("");
  const combos = new Set<string>();

  for (let i = 0; i < digits.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      if (isJodaCut && digits[i] === digits[j]) continue; // skip 11,22,33 if jodaCut
      combos.add(digits[i] + digits[j]);
    }
  }

  return Array.from(combos);
}
