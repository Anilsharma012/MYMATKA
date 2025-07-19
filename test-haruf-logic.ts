// Define types for test cases
interface BetTestData {
  // For new format
  harufPosition?: 'first' | 'last';
  // For old format
  position?: 'andhar' | 'bahar' | 'first' | 'last';
}

interface TestCase {
  betNumber: string;
  betData: {
    harufPosition?: 'first' | 'last';
    harufDigit?: string;
    position?: 'andhar' | 'bahar' | 'first' | 'last';
  };
  declaredResult: string;
  shouldWin: boolean;
  description: string;
}

// Test function for Haruf bet logic
function testHarufLogic() {
  console.log('\n🔍 Testing Haruf Bet Logic\n' + '='.repeat(30));

  const testCases: TestCase[] = [
    // New format with betData.harufPosition and betData.harufDigit
    {
      betNumber: 'A4',
      betData: { 
        harufPosition: 'first',
        harufDigit: '4'
      },
      declaredResult: '45',
      shouldWin: true,
      description: 'First digit 4 matches'
    },
    {
      betNumber: 'B5',
      betData: { 
        harufPosition: 'last',
        harufDigit: '5'
      },
      declaredResult: '45',
      shouldWin: true,
      description: 'Last digit 5 matches'
    },
    {
      betNumber: 'A5',
      betData: { 
        harufPosition: 'first',
        harufDigit: '5'
      },
      declaredResult: '45',
      shouldWin: false,
      description: 'Wrong digit for first position'
    },
    {
      betNumber: 'B4',
      betData: { 
        harufPosition: 'last',
        harufDigit: '4'
      },
      declaredResult: '45',
      shouldWin: false,
      description: 'Wrong digit for last position'
    },
    
    // Old format with position field (for backward compatibility)
    {
      betNumber: 'A4',
      betData: { position: 'andhar' },
      declaredResult: '45',
      shouldWin: true,
      description: 'Andhar 4 matches first digit 4'
    },
    {
      betNumber: 'B5',
      betData: { position: 'bahar' },
      declaredResult: '45',
      shouldWin: true,
      description: 'Bahar 5 matches second digit 5'
    },
    
    // Test with Ghaziabad example
    {
      betNumber: 'A4',
      betData: { 
        harufPosition: 'first',
        harufDigit: '4'
      },
      declaredResult: '45',
      shouldWin: true,
      description: 'Ghaziabad example: A4 should win with first digit 4'
    },
    {
      betNumber: 'B5',
      betData: { 
        harufPosition: 'last',
        harufDigit: '5'
      },
      declaredResult: '45',
      shouldWin: true,
      description: 'Ghaziabad example: B5 should win with last digit 5'
    }
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ betNumber, betData, declaredResult, shouldWin, description }: TestCase, index: number) => {
    // Simplified version of checkBetWinning function
    const num = betNumber.toString();
    const firstDigit = declaredResult[0];
    const lastDigit = declaredResult[1];
    
    // Extract the number part from the bet (e.g., '4' from 'A4' or 'B5')
    const betNumberOnly = num.replace(/^[A-Za-z]/, '');
    
    let result = false;
    
    // Check for betData.harufPosition (new format)
    if (betData.betData?.harufPosition) {
      if (betData.betData.harufPosition === "first") {
        result = betNumberOnly === firstDigit;
      } else if (betData.betData.harufPosition === "last") {
        result = betNumberOnly === lastDigit;
      }
    } 
    // Fallback to position field (old format)
    else if (betData.position) {
      const position = betData.position.toLowerCase();
      if (position === "andhar" || position === "first") {
        result = betNumberOnly === firstDigit;
      } else if (position === "bahar" || position === "last") {
        result = betNumberOnly === lastDigit;
      }
    }
    
    const status = result === shouldWin ? '✅ PASS' : '❌ FAIL';
    
    if (result === shouldWin) passed++;
    else failed++;

    const positionInfo = betData.betData?.harufPosition 
      ? `harufPosition: ${betData.betData.harufPosition}` 
      : `position: ${betData.position || 'none'}`;
      
    console.log(`Test ${index + 1}: ${status}`);
    console.log(`  ${description}`);
    console.log(`  Bet: ${betNumber} (${positionInfo})`);
    console.log(`  Result: ${declaredResult}`);
    console.log(`  Expected: ${shouldWin ? 'Win' : 'Lose'}, Got: ${result ? 'Win' : 'Lose'}`);
    console.log(`  Details: Bet ${betNumber} on ${positionInfo} when result was ${declaredResult} should ${shouldWin ? 'WIN' : 'LOSE'}\n`);
  });

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'='.repeat(30)}\n`);
}

// Run tests
testHarufLogic();
