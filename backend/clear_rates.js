const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://rohitbarge22_db_user:qPcELD9pb9TMYCv2@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority&appName=Cluster0';

async function clearRateCards() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    const collections = await db.listCollections({ name: 'ratecards' }).toArray();
    if (collections.length > 0) {
      const result = await db.collection('ratecards').deleteMany({});
      console.log(`Deleted ${result.deletedCount} rate cards.`);
    } else {
      console.log('ratecards collection does not exist.');
    }
  } catch (error) {
    console.error('Error clearing rate cards:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearRateCards();
