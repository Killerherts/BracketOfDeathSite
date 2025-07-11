#!/usr/bin/env node

/**
 * Simple data migration script to import JSON data into MongoDB
 * Usage: node migrate-data.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bracket_of_death';
const DATA_DIR = path.join(__dirname, 'json');

console.log('🏆 Bracket of Death Data Migration Tool');
console.log('=====================================');

async function migrateData() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('❌ JSON data directory not found:', DATA_DIR);
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Import players first
    await importPlayers(db);
    
    // Import tournaments
    await importTournaments(db);
    
    console.log('\n🎉 Data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

async function importPlayers(db) {
  console.log('\n👥 Importing players...');
  
  const playersFile = path.join(DATA_DIR, 'All Players.json');
  if (!fs.existsSync(playersFile)) {
    console.log('⚠️  All Players.json not found, skipping player import');
    return;
  }

  // Clear existing players
  await db.collection('players').deleteMany({});
  console.log('🗑️  Cleared existing players');
  
  const playersData = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
  const players = [];
  
  for (const player of playersData) {
    const fullName = player['457 Unique Players'] || player.name || '';
    
    if (!fullName || fullName.trim() === '') {
      continue;
    }
    
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    const cleanPlayer = {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bracketofdeath.com`,
      gamesPlayed: parseInt(player['Games Played'] || 0) || 0,
      gamesWon: parseInt(player['Games Won'] || 0) || 0,
      winningPercentage: parseFloat(player['Winning %'] || 0) || 0,
      bodsPlayed: parseInt(player["BOD's Played"] || 0) || 0,
      bestResult: parseInt(player['Best Result'] || 0) || 0,
      avgFinish: parseFloat(player['AVG Finish'] || 0) || 0,
      tournaments: parseInt(player['Tournaments'] || 0) || 0,
      individualChampionships: parseInt(player['Ind Champs'] || 0) || 0,
      divisionChampionships: parseInt(player['Div Champs'] || 0) || 0,
      totalChampionships: parseInt(player['Champs'] || 0) || 0,
      division: player['Division'] || null,
      pairing: player['Pairing'] || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    players.push(cleanPlayer);
  }
  
  if (players.length > 0) {
    await db.collection('players').insertMany(players);
    console.log(`✅ Imported ${players.length} players`);
  } else {
    console.log('⚠️  No players to import');
  }
}

async function importTournaments(db) {
  console.log('\n🏆 Importing tournaments...');
  
  // Clear existing tournaments and results
  await db.collection('tournaments').deleteMany({});
  await db.collection('tournamentresults').deleteMany({});
  console.log('🗑️  Cleared existing tournaments and results');
  
  const files = fs.readdirSync(DATA_DIR);
  const tournamentFiles = files.filter(file => 
    file.endsWith('.json') && 
    file !== 'All Players.json' && 
    file !== 'All Scores.json' && 
    file !== 'Champions.json' &&
    file.match(/^\d{4}-\d{2}-\d{2}/) // Match date pattern YYYY-MM-DD
  );
  
  console.log(`📁 Found ${tournamentFiles.length} tournament files`);
  
  let totalTournaments = 0;
  let totalResults = 0;
  
  for (const fileName of tournamentFiles) {
    const filePath = path.join(DATA_DIR, fileName);
    console.log(`\n📄 Processing ${fileName}...`);
    
    const result = await importTournamentFile(db, filePath);
    if (result) {
      totalTournaments++;
      totalResults += result.resultsCount;
      console.log(`   ✅ Imported tournament with ${result.resultsCount} results`);
    } else {
      console.log(`   ❌ Failed to import ${fileName}`);
    }
  }
  
  console.log(`\n📊 Tournament Import Summary:`);
  console.log(`   🏆 Tournaments: ${totalTournaments}`);
  console.log(`   👥 Team Results: ${totalResults}`);
}

async function importTournamentFile(db, filePath) {
  const fileName = path.basename(filePath);
  const tournamentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract tournament info from filename
  const [datePart, formatPart] = fileName.replace('.json', '').split(' ');
  const tournamentDate = new Date(datePart);
  
  // Generate BOD number
  const year = tournamentDate.getFullYear();
  const month = tournamentDate.getMonth() + 1;
  const bodNumber = parseInt(`${year}${month.toString().padStart(2, '0')}`);
  
  // Normalize format
  let format = 'Mixed';
  if (formatPart === 'M' || formatPart === 'Men') format = 'M';
  else if (formatPart === 'W' || formatPart === 'Women') format = 'W';
  else if (formatPart === 'Mixed') format = 'Mixed';
  
  // Create tournament
  const tournament = {
    bodNumber: bodNumber,
    date: tournamentDate,
    format: format,
    location: `Tournament Location (${datePart})`,
    advancementCriteria: 'Standard tournament advancement rules',
    notes: `${format} tournament on ${datePart}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    const tournamentResult = await db.collection('tournaments').insertOne(tournament);
    const tournamentId = tournamentResult.insertedId;
    
    // Process team results (simplified)
    const validTeamData = tournamentData.filter(team => {
      return team['Teams (Round Robin)'] && 
             team['Teams (Round Robin)'] !== "Tiebreakers" &&
             team.Date !== "Home" && 
             team.Date !== null;
    });
    
    let resultsCount = 0;
    for (const teamData of validTeamData.slice(0, 10)) { // Limit for demo
      // Create simplified result
      const teamResult = {
        tournamentId: tournamentId,
        players: [], // Would need to lookup player IDs
        division: teamData['Division'] || '',
        totalStats: {
          totalWon: parseInt(teamData['Total Won']) || 0,
          totalLost: parseInt(teamData['Total Lost']) || 0,
          totalPlayed: parseInt(teamData['Total Played']) || 0,
          winPercentage: parseFloat(teamData['Win %']) || 0,
          finalRank: parseFloat(teamData['Final Rank']) || 0,
          bodFinish: parseInt(teamData['BOD Finish']) || 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('tournamentresults').insertOne(teamResult);
      resultsCount++;
    }
    
    return { resultsCount };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

// Run migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };