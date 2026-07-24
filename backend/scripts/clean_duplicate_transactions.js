const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SubscriptionTransaction = require('../src/models/NoSQL/SubscriptionTransaction');

const cleanDuplicates = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const transactions = await SubscriptionTransaction.find({}).sort({ createdAt: 1 });
    console.log(`Total transactions found: ${transactions.length}`);

    const seenMap = new Map();
    const duplicateIdsToDelete = [];

    for (const tx of transactions) {
      if (!tx.tenantId) continue;
      const key = `${tx.tenantId.toString()}_${tx.planType}`;
      
      if (seenMap.has(key)) {
        const prevTx = seenMap.get(key);
        const timeDiffMs = Math.abs(new Date(tx.createdAt) - new Date(prevTx.createdAt));
        
        // If created within 2 hours of each other for the same tenant and plan, mark the duplicate (e.g. ONLINE CHECKOUT vs CARD) for deletion
        if (timeDiffMs < 2 * 60 * 60 * 1000) {
          // Keep the newer/more specific one, delete the older incomplete one
          if (prevTx.paymentMethod === 'ONLINE CHECKOUT' && tx.paymentMethod !== 'ONLINE CHECKOUT') {
            duplicateIdsToDelete.push(prevTx._id);
            seenMap.set(key, tx); // Replace with the detailed transaction
          } else {
            duplicateIdsToDelete.push(tx._id);
          }
          continue;
        }
      }
      seenMap.set(key, tx);
    }

    if (duplicateIdsToDelete.length > 0) {
      const deleteResult = await SubscriptionTransaction.deleteMany({ _id: { $in: duplicateIdsToDelete } });
      console.log(`Cleaned up ${deleteResult.deletedCount} duplicate transaction entries.`);
    } else {
      console.log('No duplicate transactions found.');
    }

  } catch (error) {
    console.error('Error cleaning duplicates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

cleanDuplicates();
