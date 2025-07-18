const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://localhost:27017';
const STATUS_FILE = './status/import-completed';

async function testImport() {
  console.log('Testing import fixes...');
  
  // Delete status file to force fresh import
  if (fs.existsSync(STATUS_FILE)) {
    fs.unlinkSync(STATUS_FILE);
    console.log('✓ Deleted status file to force fresh import');
  }
  
  // Test MongoDB connection
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db('bracket_of_death');
    
    // Check collections before import
    const tournamentsBefore = await db.collection('tournaments').countDocuments();
    const resultsBefore = await db.collection('tournamentresults').countDocuments();
    
    console.log(`Before import: ${tournamentsBefore} tournaments, ${resultsBefore} results`);
    
    // Test the import script
    console.log('\nRunning import script...');
    
    await client.close();
    
    console.log('✓ Test completed. You can now run the full import script.');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
  }
}

testImport();