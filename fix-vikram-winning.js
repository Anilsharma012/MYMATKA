const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vikramsingh77090:Aactvujp84H2vE9a@cluster0.jxdor.mongodb.net/matka-game');
    console.log('✅ MongoDB connected');
    
    // Define Wallet schema
    const walletSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      winningBalance: { type: Number, default: 0 },
      totalWinnings: { type: Number, default: 0 },
      balance: { type: Number, default: 0 },
      depositBalance: { type: Number, default: 0 },
      bonusBalance: { type: Number, default: 0 },
      commissionBalance: { type: Number, default: 0 }
    });
    
    const Wallet = mongoose.model('Wallet', walletSchema);
    
    // Find Vikram's wallet
    const userId = '6884b27dc3bbb7dd57828479';
    const wallet = await Wallet.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!wallet) {
      console.error('❌ Wallet not found for user:', userId);
      process.exit(1);
    }
    
    console.log('📊 Current wallet state:');
    console.log('   winningBalance:', wallet.winningBalance);
    console.log('   totalWinnings:', wallet.totalWinnings);
    console.log('   balance:', wallet.balance);
    
    // Credit missing 9500 rupees
    const winningAmount = 9500;
    
    wallet.winningBalance += winningAmount;
    wallet.totalWinnings += winningAmount;
    
    await wallet.save();
    
    console.log('✅ Successfully credited ₹' + winningAmount + ' to winning balance');
    console.log('📊 Updated wallet state:');
    console.log('   winningBalance:', wallet.winningBalance);
    console.log('   totalWinnings:', wallet.totalWinnings);
    console.log('   balance:', wallet.balance);
    
    // Also create a transaction record
    const transactionSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      type: String,
      amount: Number,
      status: String,
      description: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const Transaction = mongoose.model('Transaction', transactionSchema);
    
    const transaction = new Transaction({
      userId: new mongoose.Types.ObjectId(userId),
      type: 'win',
      amount: winningAmount,
      status: 'completed',
      description: 'Manual credit for jodi bet winning (50) - ₹9500'
    });
    
    await transaction.save();
    console.log('✅ Transaction record created:', transaction._id);
    
    console.log('🎉 Vikram Singh के ₹9500 winning amount successfully credited!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

connectDB();
