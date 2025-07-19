export function checkBetWinning(
  bet: any,
  declaredResults: {
    jodi: string;
    haruf: string;
    crossing: string;
    fallback: string;
  }
): boolean {
  console.log('\n🔍 Checking bet win status:', {
    betId: bet._id,
    betType: bet.betType,
    betNumber: bet.betNumber,
    betData: bet.betData,
    declaredResults
  });

  const betNumber = bet.betNumber?.toString() || '';
  const betType = bet.betType?.toLowerCase();
  const betData = bet.betData || {};

  if (!declaredResults || !betType) {
    console.warn('Missing required data for bet check:', { declaredResults, betType, betId: bet._id });
    return false;
  }

  // 🎯 Jodi bet - exact match with declared jodi result
  if (betType === 'jodi') {
    const isWin = betNumber === declaredResults.jodi;
    console.log(`🎯 Jodi check: ${betNumber} === ${declaredResults.jodi} -> ${isWin ? 'WIN' : 'LOSE'}`);
    return isWin;
  }

  // 🔢 Haruf bet - A2 → 20-29, B1 → 1, 11, 21, ...
  if (betType === 'haruf') {
    const result = declaredResults.jodi || declaredResults.crossing || declaredResults.fallback || '';
    if (!result || result.length < 2) {
      console.warn("⚠️ Result missing or too short for haruf check");
      return false;
    }

    const resultNumber = parseInt(result);
    const resultFirstDigit = Math.floor(resultNumber / 10);
    const resultLastDigit = resultNumber % 10;

    let harufDigit = '';
    let harufPosition = '';

    const match = betNumber.match(/^([AB])(\d)$/i);
    if (match) {
      harufPosition = match[1].toUpperCase();
      harufDigit = match[2];
      console.log(`📍 Haruf match: Position=${harufPosition}, Digit=${harufDigit}`);
    }

    const harufDigitInt = parseInt(harufDigit);

    if (harufPosition === 'A') {
      const isWin = resultFirstDigit === harufDigitInt;
      console.log(`🔍 Haruf A check: ${resultFirstDigit} === ${harufDigitInt} → ${isWin}`);
      return isWin;
    }

    if (harufPosition === 'B') {
      const isWin = resultLastDigit === harufDigitInt;
      console.log(`🔍 Haruf B check: ${resultLastDigit} === ${harufDigitInt} → ${isWin}`);
      return isWin;
    }

    return false;
  }

  if (betType === 'crossing') {
  const result =
    declaredResults.crossing ||
    declaredResults.jodi ||
    declaredResults.haruf ||
    declaredResults.fallback ||
    "";

  const isWin = betNumber === result;
  console.log(`🔄 Crossing check: ${betNumber} === ${result} → ${isWin}`);
  return isWin;
}


  console.warn(`Unknown bet type: ${betType}`);
  return false;
}
