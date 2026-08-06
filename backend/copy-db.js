const { MongoClient } = require('mongodb');

// SOURCE (Atlas Cloud DB)
// You can pass your connection string via command line argument or edit below
const ATLAS_URI = process.argv[2] || "mongodb+srv://rohitbarge22_db_user:qpCELD9pb9TMYCv2@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority";

// TARGET (Local DB)
const LOCAL_URI = "mongodb://127.0.0.1:27017/transitnode";

async function copyDatabase() {
  console.log("🚀 Starting MongoDB Migration from Atlas to Local...");
  console.log(`SOURCE: ${ATLAS_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log(`TARGET: ${LOCAL_URI}`);

  let sourceClient, targetClient;

  try {
    // Connect to source (Atlas)
    console.log("\n1️⃣ Connecting to Atlas...");
    sourceClient = new MongoClient(ATLAS_URI);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();
    console.log("✅ Connected to Atlas!");

    // Connect to target (Local)
    console.log("\n2️⃣ Connecting to Local MongoDB...");
    targetClient = new MongoClient(LOCAL_URI);
    await targetClient.connect();
    const targetDb = targetClient.db();
    console.log("✅ Connected to Local MongoDB!");

    // Get collections from Atlas
    const collections = await sourceDb.listCollections().toArray();
    console.log(`\n📦 Found ${collections.length} collections in Atlas database.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      console.log(`\n⏳ Copying collection: [${colName}]...`);
      const sourceCol = sourceDb.collection(colName);
      const targetCol = targetDb.collection(colName);

      // Fetch all docs
      const docs = await sourceCol.find({}).toArray();

      if (docs.length === 0) {
        console.log(`   ℹ️ Collection [${colName}] is empty, skipping.`);
        continue;
      }

      // Wipe existing local data for this collection before copying
      await targetCol.deleteMany({});
      
      // Insert docs into local DB
      const result = await targetCol.insertMany(docs);
      console.log(`   ✅ Copied ${result.insertedCount} documents into local [${colName}].`);
    }

    console.log("\n🎉 ALL DATA COPIED SUCCESSFULLY FROM ATLAS TO LOCAL MONGODB!");

  } catch (error) {
    console.error("\n❌ Error during migration:", error.message);
    if (error.message.includes('authentication failed')) {
      console.log("\n💡 Tip: Check if the password in your Atlas connection string is correct.");
    }
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
    process.exit(0);
  }
}

copyDatabase();
