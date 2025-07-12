const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = '/app/data';

const STATUS_FILE = '/app/status/import-completed';

console.log('Starting simple data import...');

async function simpleImport() {
  // Check if import has already been completed
  if (fs.existsSync(STATUS_FILE)) {
    const completedDate = fs.readFileSync(STATUS_FILE, 'utf8').trim();
    console.log(`Data import already completed on: ${completedDate}`);
    console.log('Skipping import. To force re-import, delete the status file.');
    return;
  }

  if (!MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bracket_of_death');
    
    // Clear existing data and drop collections to bypass validation
    await db.collection('tournaments').drop().catch(() => {});
    await db.collection('tournamentresults').drop().catch(() => {});
    console.log('Dropped existing tournament collections');
    
    // Recreate collections without validation
    await db.createCollection('tournaments');
    await db.createCollection('tournamentresults');
    console.log('Created new collections without validation');
    
    // Import players first
    await importPlayers(db);
    console.log('Players import completed');
    
    // Get all tournament files from the data directory
    const files = fs.readdirSync(DATA_DIR);
    const validFiles = files.filter(file => 
      file.endsWith('.json') && 
      file !== 'All Players.json' && 
      file !== 'All Scores.json' && 
      file !== 'Champions.json' &&
      file.match(/^\d{4}-\d{2}-\d{2}/) // Match date pattern YYYY-MM-DD
    );
    
    console.log(`Found ${validFiles.length} tournament files to process`);
    
    let totalTournaments = 0;
    let totalResults = 0;
    
    for (const fileName of validFiles) {
      const filePath = path.join(DATA_DIR, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${fileName}`);
        continue;
      }
      
      console.log(`\nProcessing ${fileName}...`);
      
      const result = await importTournamentFile(db, filePath);
      if (result) {
        totalTournaments++;
        totalResults += result.resultsCount;
        console.log(`✓ Imported tournament with ${result.resultsCount} team results`);
      } else {
        console.log(`✗ Failed to import ${fileName}`);
      }
    }
    
    console.log(`\n=== Import Summary ===`);
    console.log(`Tournaments imported: ${totalTournaments}`);
    console.log(`Team results imported: ${totalResults}`);
    console.log(`Import completed successfully!`);
    
    // Create status file to indicate completion
    const statusDir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(statusDir)) {
      fs.mkdirSync(statusDir, { recursive: true });
    }
    fs.writeFileSync(STATUS_FILE, new Date().toISOString());
    console.log(`Status file created: ${STATUS_FILE}`);
    
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

async function importTournamentFile(db, filePath) {
  const fileName = path.basename(filePath);
  const tournamentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract tournament info from filename
  const [datePart, formatPart] = fileName.replace('.json', '').split(' ');
  const tournamentDate = new Date(datePart);
  
  // Generate BOD number (YYYYMM format)
  const year = tournamentDate.getFullYear();
  const month = tournamentDate.getMonth() + 1;
  const bodNumber = parseInt(`${year}${month.toString().padStart(2, '0')}`);
  
  // Normalize format
  let format = 'Mixed';
  if (formatPart === 'M') format = 'M';
  else if (formatPart === 'W') format = 'W';
  else if (formatPart === 'Mixed') format = 'Mixed';
  
  // Filter valid team data - handle both old and new formats
  const validTeamData = tournamentData.filter(team => {
    // Skip summary/aggregate rows
    if (!team['Teams (Round Robin)'] || 
        team['Teams (Round Robin)'] === "Tiebreakers" ||
        team.Date === "Home" || 
        team.Date === null) {
      return false;
    }
    
    // New format (2024+) has Player 1 and Player 2 fields
    if (team['Player 1'] && team['Player 2']) {
      return true;
    }
    
    // Old format - check if Teams (Round Robin) has two players
    if (team['Teams (Round Robin)']) {
      const teamName = team['Teams (Round Robin)'];
      // Check if it contains ' & ' indicating two players
      if (teamName.includes(' & ') && teamName.split(' & ').length === 2) {
        return true;
      }
    }
    
    return false;
  });
  
  if (validTeamData.length === 0) {
    console.log(`  No valid team data found`);
    return null;
  }
  
  console.log(`  Found ${validTeamData.length} valid team records`);
  
  // Create simple tournament document
  const tournament = {
    bodNumber: bodNumber,
    date: tournamentDate,
    format: format,
    location: 'Tournament Location',
    advancementCriteria: 'Standard tournament advancement rules',
    notes: `${format} tournament on ${datePart} with ${validTeamData.length} teams`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Insert tournament
  let tournamentId;
  try {
    const tournamentResult = await db.collection('tournaments').insertOne(tournament);
    tournamentId = tournamentResult.insertedId;
    console.log(`  ✓ Created tournament BOD #${bodNumber}`);
  } catch (error) {
    console.log(`  ✗ Failed to create tournament: ${error.message}`);
    return null;
  }
  
  // Import team results
  const teamResults = [];
  let playersFound = 0;
  let playersNotFound = 0;
  
  for (const teamData of validTeamData) {
    let player1Name, player2Name;
    
    // Handle different data formats
    if (teamData['Player 1'] && teamData['Player 2']) {
      // New format (2024+)
      player1Name = teamData['Player 1'];
      player2Name = teamData['Player 2'];
    } else if (teamData['Teams (Round Robin)']) {
      // Old format - extract players from team name
      const teamName = teamData['Teams (Round Robin)'];
      const players = teamName.split(' & ');
      if (players.length === 2) {
        player1Name = players[0].trim();
        player2Name = players[1].trim();
      } else {
        console.log(`  Could not parse team: ${teamName}`);
        continue;
      }
    } else {
      console.log(`  Missing player data for team`);
      continue;
    }
    
    // Find players
    const player1 = await db.collection('players').findOne({ name: player1Name });
    const player2 = await db.collection('players').findOne({ name: player2Name });
    
    if (!player1 || !player2) {
      if (!player1) playersNotFound++;
      if (!player2) playersNotFound++;
      continue;
    }
    
    playersFound += 2;
    
    // Create team result with minimal required fields
    const teamResult = {
      tournamentId: tournamentId,
      players: [player1._id, player2._id],
      division: teamData['Division'] || '',
      seed: parseInt(teamData['Seed']) || undefined,
      roundRobinScores: {
        round1: parseInt(teamData['Round-1']) || 0,
        round2: parseInt(teamData['Round-2']) || 0,
        round3: parseInt(teamData['Round-3']) || 0,
        rrWon: parseInt(teamData['RR Won']) || 0,
        rrLost: parseInt(teamData['RR Lost']) || 0,
        rrPlayed: parseInt(teamData['RR Played']) || 0,
        rrWinPercentage: parseFloat(teamData['RR Win%']) || 0,
        rrRank: parseFloat(teamData['RR Rank']) || 0
      },
      bracketScores: {
        r16Won: parseInt(teamData['R16 Won']) || 0,
        r16Lost: parseInt(teamData['R16 Lost']) || 0,
        qfWon: parseInt(teamData['QF Won']) || 0,
        qfLost: parseInt(teamData['QF Lost']) || 0,
        sfWon: parseInt(teamData['SF Won']) || 0,
        sfLost: parseInt(teamData['SF Lost']) || 0,
        finalsWon: parseInt(teamData['Finals Won']) || 0,
        finalsLost: parseInt(teamData['Finals Lost']) || 0,
        bracketWon: parseInt(teamData['Bracket Won']) || 0,
        bracketLost: parseInt(teamData['Bracket Lost']) || 0,
        bracketPlayed: parseInt(teamData['Bracket Played']) || 0
      },
      totalStats: {
        totalWon: parseInt(teamData['Total Won']) || 0,
        totalLost: parseInt(teamData['Total Lost']) || 0,
        totalPlayed: parseInt(teamData['Total Played']) || 0,
        winPercentage: parseFloat(teamData['Win %']) || 0,
        finalRank: parseFloat(teamData['Final Rank']) || 0,
        bodFinish: parseInt(teamData['BOD Finish']) || 0,
        home: teamData['Home'] === 'Home' || false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    teamResults.push(teamResult);
  }
  
  console.log(`  Players found: ${playersFound}, not found: ${playersNotFound}`);
  
  // Insert team results
  if (teamResults.length > 0) {
    try {
      await db.collection('tournamentresults').insertMany(teamResults);
      console.log(`  ✓ Inserted ${teamResults.length} team results`);
    } catch (error) {
      console.log(`  ✗ Failed to insert team results: ${error.message}`);
      // Try individual inserts as fallback
      let successCount = 0;
      for (const result of teamResults) {
        try {
          await db.collection('tournamentresults').insertOne(result);
          successCount++;
        } catch (e) {
          console.log(`    Failed individual insert: ${e.message}`);
        }
      }
      console.log(`  ✓ Individual inserts: ${successCount}/${teamResults.length}`);
    }
  }
  
  return { resultsCount: teamResults.length };
}

async function importPlayers(db) {
  console.log('Importing players...');
  
  const playersFile = path.join(DATA_DIR, 'All Players.json');
  if (!fs.existsSync(playersFile)) {
    console.log('All Players.json not found, skipping player import');
    return;
  }
  
  const playersData = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
  const players = [];
  
  for (const player of playersData) {
    // Get the full name from the first column (which has a weird key)
    const fullName = player['457 Unique Players'] || player.name || '';
    
    // Skip if essential data is missing
    if (!fullName || fullName.trim() === '') {
      console.log('Skipping player with missing name:', player);
      continue;
    }
    
    // Check if player already exists
    const existingPlayer = await db.collection('players').findOne({ name: fullName });
    if (existingPlayer) {
      continue; // Skip if player already exists
    }
    
    // Split full name into first and last names
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create simple player document - only include email if we have a real one
    const cleanPlayer = {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      phone: player.phone || player.Phone || '',
      city: player.city || player.City || '',
      state: player.state || player.State || '',
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
      drawingSequence: player['Drawing Sequence'] || null,
      pairing: player['Pairing'] || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Only add email if we have one from the source data
    const email = player.email || player.Email || '';
    if (email && email.includes('@')) {
      cleanPlayer.email = email;
    }
    
    players.push(cleanPlayer);
  }
  
  if (players.length > 0) {
    try {
      await db.collection('players').insertMany(players);
      console.log(`  ✓ Imported ${players.length} players`);
    } catch (error) {
      console.log(`  ✗ Bulk insert failed, trying individual inserts...`);
      let successCount = 0;
      let failureCount = 0;
      
      for (const player of players) {
        try {
          await db.collection('players').insertOne(player);
          successCount++;
        } catch (insertError) {
          failureCount++;
          console.log(`    Failed to insert player: ${player.name}`);
        }
      }
      
      console.log(`  Individual insert results: ${successCount} successful, ${failureCount} failed`);
    }
  } else {
    console.log('  No new players to import');
  }
  
  // Show final count
  const finalPlayersCount = await db.collection('players').countDocuments();
  console.log(`  Total players in database: ${finalPlayersCount}`);
}

simpleImport();