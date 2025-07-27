// Simple script to credit 9500 rupees to payalsaini user
// Run this via: curl or direct database update

console.log(`
📋 Manual Database Fix for PayalSaini User Winnings

To fix the missing winnings for payalsaini user, run these MongoDB commands:

1. Connect to your MongoDB database
2. Run the following commands:

// Find the user
db.users.findOne({fullName: /payal/i})

// Get the user ID and update their wallet
// Replace USER_ID_HERE with the actual ObjectId
db.wallets.updateOne(
  {userId: ObjectId("USER_ID_HERE")}, 
  {
    $inc: {
      winningBalance: 9500,
      totalWinnings: 9500
    }
  }
)

// Also update the total balance
db.wallets.updateOne(
  {userId: ObjectId("USER_ID_HERE")}, 
  {
    $set: {
      balance: db.wallets.findOne({userId: ObjectId("USER_ID_HERE")}).winningBalance + 
              db.wallets.findOne({userId: ObjectId("USER_ID_HERE")}).depositBalance +
              db.wallets.findOne({userId: ObjectId("USER_ID_HERE")}).bonusBalance +
              db.wallets.findOne({userId: ObjectId("USER_ID_HERE")}).commissionBalance
    }
  }
)

Or you can run the REST API endpoint to credit winnings programmatically:

POST /api/admin/management/credit-user
{
  "userId": "USER_ID_HERE",
  "amount": 9500,
  "type": "winning",
  "description": "Manual credit for missing winnings from Shriganesha game"
}
`);
