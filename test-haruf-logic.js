// Test function for Haruf bet logic
function testHarufLogic() {
    console.log('\n🔍 Testing Haruf Bet Logic\n' + '='.repeat(30));
    var testCases = [
        // New format with betData.harufPosition
        {
            betNumber: 'A4',
            betData: { betData: { harufPosition: 'first' } },
            declaredResult: '45',
            shouldWin: true,
            description: 'First digit 4 matches'
        },
        {
            betNumber: 'B5',
            betData: { betData: { harufPosition: 'last' } },
            declaredResult: '45',
            shouldWin: true,
            description: 'Last digit 5 matches'
        },
        {
            betNumber: 'A5',
            betData: { betData: { harufPosition: 'first' } },
            declaredResult: '45',
            shouldWin: false,
            description: 'Wrong digit for first position'
        },
        {
            betNumber: 'B4',
            betData: { betData: { harufPosition: 'last' } },
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
            betData: { betData: { harufPosition: 'first' } },
            declaredResult: '45',
            shouldWin: true,
            description: 'Ghaziabad example: A4 should win with first digit 4'
        },
        {
            betNumber: 'B5',
            betData: { betData: { harufPosition: 'last' } },
            declaredResult: '45',
            shouldWin: true,
            description: 'Ghaziabad example: B5 should win with last digit 5'
        }
    ];
    var passed = 0;
    var failed = 0;
    testCases.forEach(function (_a, index) {
        var _b, _c;
        var betNumber = _a.betNumber, betData = _a.betData, declaredResult = _a.declaredResult, shouldWin = _a.shouldWin, description = _a.description;
        // Simplified version of checkBetWinning function
        var num = betNumber.toString();
        var firstDigit = declaredResult[0];
        var lastDigit = declaredResult[1];
        // Extract the number part from the bet (e.g., '4' from 'A4' or 'B5')
        var betNumberOnly = num.replace(/^[A-Za-z]/, '');
        var result = false;
        // Check for new betData structure first
        if ((_b = betData.betData) === null || _b === void 0 ? void 0 : _b.harufPosition) {
            if (betData.betData.harufPosition === "first") {
                result = betNumberOnly === firstDigit;
            }
            else if (betData.betData.harufPosition === "last") {
                result = betNumberOnly === lastDigit;
            }
        }
        // Fallback to old position field
        else if (betData.position) {
            var position = betData.position.toLowerCase();
            if (position === "andhar" || position === "first") {
                result = betNumberOnly === firstDigit;
            }
            else if (position === "bahar" || position === "last") {
                result = betNumberOnly === lastDigit;
            }
        }
        var status = result === shouldWin ? '✅ PASS' : '❌ FAIL';
        if (result === shouldWin)
            passed++;
        else
            failed++;
        var positionInfo = ((_c = betData.betData) === null || _c === void 0 ? void 0 : _c.harufPosition)
            ? "harufPosition: ".concat(betData.betData.harufPosition)
            : "position: ".concat(betData.position || 'none');
        console.log("Test ".concat(index + 1, ": ").concat(status));
        console.log("  ".concat(description));
        console.log("  Bet: ".concat(betNumber, " (").concat(positionInfo, ")"));
        console.log("  Result: ".concat(declaredResult));
        console.log("  Expected: ".concat(shouldWin ? 'Win' : 'Lose', ", Got: ").concat(result ? 'Win' : 'Lose'));
        console.log("  Details: Bet ".concat(betNumber, " on ").concat(positionInfo, " when result was ").concat(declaredResult, " should ").concat(shouldWin ? 'WIN' : 'LOSE', "\n"));
    });
    console.log('\n📊 Test Results:');
    console.log("\u2705 Passed: ".concat(passed));
    console.log("\u274C Failed: ".concat(failed));
    console.log("".concat('='.repeat(30), "\n"));
}
// Run tests
testHarufLogic();
