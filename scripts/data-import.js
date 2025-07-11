const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = '/app/data';
const STATUS_FILE = '/app/status/import-completed';

console.log('Starting data import process...');

async function importData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('bracket_of_death');
    
    // Import players (only if they don't exist)
    await importPlayers(db);
    
    // Import tournaments and results (only if they don't exist)
    await importTournaments(db);
    
    // Mark import as completed
    fs.writeFileSync(STATUS_FILE, new Date().toISOString());
    console.log('Data import completed successfully!');
    
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
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
  
  // Check existing players count
  const existingPlayersCount = await db.collection('players').countDocuments();
  console.log(`Found ${existingPlayersCount} existing players in database`);
  
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
    
    // Parse and validate numbers with better error handling
    const gamesPlayed = parseInt(player['Games Played'] || 0) || 0;
    const gamesWon = parseInt(player['Games Won'] || 0) || 0;
    const bestResult = parseInt(player['Best Result'] || 0) || 0;
    const avgFinish = parseFloat(player['AVG Finish'] || 0) || 0;
    const winningPercentage = parseFloat(player['Winning %'] || 0) || 0;
    
    // Ensure gamesWon doesn't exceed gamesPlayed
    const validGamesWon = Math.min(gamesWon, gamesPlayed);
    
    // Ensure bestResult is not worse than avgFinish (lower is better, but handle 0 case)
    let validBestResult = bestResult;
    if (avgFinish > 0 && bestResult > 0) {
      validBestResult = Math.min(bestResult, avgFinish);
    }
    
    // Ensure winning percentage is between 0 and 1
    const validWinningPercentage = Math.max(0, Math.min(1, winningPercentage));
    
    // Handle null/undefined values for optional fields
    const drawingSeq = player['Drawing Sequence'];
    const validDrawingSequence = (drawingSeq !== null && drawingSeq !== undefined && !isNaN(drawingSeq)) ? parseFloat(drawingSeq) : null;
    
    // Clean and validate player data
    const cleanPlayer = {
      name: fullName,
      firstName: firstName,
      lastName: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@bracketofdeath.com`,
      phone: player.phone || player.Phone || '',
      city: player.city || player.City || '',
      state: player.state || player.State || '',
      gamesPlayed: gamesPlayed,
      gamesWon: validGamesWon,
      winningPercentage: gamesPlayed > 0 ? validGamesWon / gamesPlayed : validWinningPercentage,
      bodsPlayed: parseInt(player["BOD's Played"] || 0) || 0,
      bestResult: validBestResult,
      avgFinish: avgFinish,
      tournaments: parseInt(player['Tournaments'] || 0) || 0,
      individualChampionships: parseInt(player['Ind Champs'] || 0) || 0,
      divisionChampionships: parseInt(player['Div Champs'] || 0) || 0,
      totalChampionships: parseInt(player['Champs'] || 0) || 0,
      division: player['Division'] || null,
      drawingSequence: validDrawingSequence,
      pairing: player['Pairing'] || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    players.push(cleanPlayer);
  }
  
  if (players.length > 0) {
    try {
      const result = await db.collection('players').insertMany(players);
      console.log(`Imported ${result.insertedCount} new players`);
    } catch (error) {
      if (error.code === 121) {
        // Validation error - try inserting players one by one
        console.log('Bulk insert failed, trying individual inserts...');
        let successCount = 0;
        let failureCount = 0;
        
        for (const player of players) {
          try {
            await db.collection('players').insertOne(player);
            successCount++;
          } catch (insertError) {
            failureCount++;
            console.log(`Failed to insert player: ${player.name} - ${insertError.message}`);
          }
        }
        
        console.log(`Individual insert results: ${successCount} successful, ${failureCount} failed`);
      } else {
        throw error;
      }
    }
  } else {
    console.log('No new players to import');
  }
  
  // Show final count
  const finalPlayersCount = await db.collection('players').countDocuments();
  console.log(`Total players in database: ${finalPlayersCount}`);
}

async function importTournaments(db) {
  console.log('Importing tournaments and results...');
  
  const files = fs.readdirSync(DATA_DIR);
  const tournamentFiles = files.filter(file => 
    file.endsWith('.json') && 
    file !== 'All Players.json' && 
    file !== 'All Scores.json' && 
    file !== 'Champions.json' &&
    file.match(/^\d{4}-\d{2}-\d{2}/)
  );
  
  console.log(`Found ${tournamentFiles.length} tournament files`);
  
  // Check existing tournaments count
  const existingTournamentsCount = await db.collection('tournaments').countDocuments();
  console.log(`Found ${existingTournamentsCount} existing tournaments in database`);
  
  for (const file of tournamentFiles) {
    try {
      await importTournamentFile(db, path.join(DATA_DIR, file));
    } catch (error) {
      console.error(`Error importing ${file}:`, error);
    }
  }
  
  // Show final count
  const finalTournamentsCount = await db.collection('tournaments').countDocuments();
  console.log(`Total tournaments in database: ${finalTournamentsCount}`);
}

async function importTournamentFile(db, filePath) {
  const fileName = path.basename(filePath);
  console.log(`Processing ${fileName}...`);
  
  const tournamentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Extract tournament info from filename
  const [datePart, formatPart] = fileName.replace('.json', '').split(' ');
  const tournamentDate = new Date(datePart);
  
  // Determine format and BOD number
  let format = 'Mixed'; // default
  if (formatPart) {
    if (formatPart.includes('Men') || formatPart === 'M') format = 'Men';
    else if (formatPart.includes('Women') || formatPart === 'W') format = 'Women';
    else if (formatPart.includes('Mixed')) format = 'Mixed';
  }
  
  // Generate BOD number from date (YYYYMM format for schema)
  const year = tournamentDate.getFullYear();
  const month = tournamentDate.getMonth() + 1;
  const bodNumber = parseInt(`${year}${month.toString().padStart(2, '0')}`);
  
  console.log(`  Debug: Date=${datePart}, BOD=${bodNumber}, Format=${format}, TournamentDate=${tournamentDate.toISOString()}`);
  
  // Check if tournament already exists
  const existingTournament = await db.collection('tournaments').findOne({ bodNumber: bodNumber });
  if (existingTournament) {
    console.log(`  Tournament BOD #${bodNumber} already exists, skipping...`);
    return;
  }
  
  // Filter out summary/aggregate rows (null dates, "Home", "Tiebreakers", etc.)
  const validTeamData = tournamentData.filter(team => 
    team.Date && 
    team.Date !== null && 
    team.Date !== "Home" && 
    team['Teams (Round Robin)'] && 
    team['Teams (Round Robin)'] !== "Tiebreakers" &&
    team['Player 1'] && 
    team['Player 2']
  );
  
  if (validTeamData.length === 0) {
    console.log(`  No valid team data found in ${fileName}`);
    return;
  }
  
  // Normalize format to match schema enum exactly
  let normalizedFormat;
  if (format === 'Men' || format === 'M') {
    normalizedFormat = 'M';
  } else if (format === 'Women' || format === 'W') {
    normalizedFormat = 'W';
  } else if (format === 'Mixed') {
    normalizedFormat = 'Mixed';
  } else {
    normalizedFormat = 'Mixed'; // Default fallback
  }
  
  // Create tournament document
  const tournament = {
    bodNumber: bodNumber,
    date: tournamentDate,
    format: normalizedFormat,
    location: 'Tournament Location', // Required field
    advancementCriteria: 'Standard tournament advancement rules', // Required field
    notes: `${normalizedFormat} tournament on ${datePart} with ${validTeamData.length} teams`
  };
  
  // Insert tournament
  let tournamentId;
  try {
    const tournamentResult = await db.collection('tournaments').insertOne(tournament);
    tournamentId = tournamentResult.insertedId;
    console.log(`  Successfully inserted tournament BOD #${bodNumber}`);
  } catch (error) {
    console.log(`  Tournament insert failed: ${error.message}`);
    console.log(`  Tournament data:`, JSON.stringify(tournament, null, 2));
    return;
  }
  
  // Process team results
  const tournamentResults = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const teamData of validTeamData) {
    try {
      const player1Name = teamData['Player 1'];
      const player2Name = teamData['Player 2'];
      
      // Find both players
      const player1 = await db.collection('players').findOne({ name: player1Name });
      const player2 = await db.collection('players').findOne({ name: player2Name });
      
      if (!player1) {
        console.log(`  Player not found: ${player1Name}`);
        failureCount++;
      }
      if (!player2) {
        console.log(`  Player not found: ${player2Name}`);
        failureCount++;
      }
      
      // Only create team result if both players found
      if (player1 && player2) {
        const placement = parseInt(teamData['BOD Finish']) || 0;
        const totalWon = parseInt(teamData['Total Won']) || 0;
        const totalLost = parseInt(teamData['Total Lost']) || 0;
        const totalPlayed = parseInt(teamData['Total Played']) || 0;
        const winPercentage = parseFloat(teamData['Win %']) || 0;
        const seed = parseInt(teamData['Seed']) || 0;
        const division = teamData['Division'] || '';
        
        // Extract round robin stats
        const rrWon = parseInt(teamData['RR Won']) || 0;
        const rrLost = parseInt(teamData['RR Lost']) || 0;
        const rrPlayed = parseInt(teamData['RR Played']) || 0;
        const rrWinPercentage = rrPlayed > 0 ? rrWon / rrPlayed : 0;
        
        // Extract bracket stats
        const bracketWon = parseInt(teamData['Bracket Won']) || 0;
        const bracketLost = parseInt(teamData['Bracket Lost']) || 0;
        const bracketPlayed = parseInt(teamData['Bracket Played']) || 0;
        
        // Extract individual round scores
        const r16Won = parseInt(teamData['R16 Won']) || 0;
        const r16Lost = parseInt(teamData['R16 Lost']) || 0;
        const qfWon = parseInt(teamData['QF Won']) || 0;
        const qfLost = parseInt(teamData['QF Lost']) || 0;
        const sfWon = parseInt(teamData['SF Won']) || 0;
        const sfLost = parseInt(teamData['SF Lost']) || 0;
        const finalsWon = parseInt(teamData['Finals Won']) || 0;
        const finalsLost = parseInt(teamData['Finals Lost']) || 0;
        
        // Create team result with proper schema structure
        const teamResult = {
          tournamentId: tournamentId,
          players: [player1._id, player2._id],
          division: division,
          seed: seed > 0 ? seed : undefined,
          roundRobinScores: {
            round1: parseInt(teamData['Round-1']) || 0,
            round2: parseInt(teamData['Round-2']) || 0,
            round3: parseInt(teamData['Round-3']) || 0,
            rrWon: rrWon,
            rrLost: rrLost,
            rrPlayed: rrPlayed,
            rrWinPercentage: rrWinPercentage,
            rrRank: parseFloat(teamData['RR Rank']) || 0
          },
          bracketScores: {
            r16Won: r16Won,
            r16Lost: r16Lost,
            qfWon: qfWon,
            qfLost: qfLost,
            sfWon: sfWon,
            sfLost: sfLost,
            finalsWon: finalsWon,
            finalsLost: finalsLost,
            bracketWon: bracketWon,
            bracketLost: bracketLost,
            bracketPlayed: bracketPlayed
          },
          totalStats: {
            totalWon: totalWon,
            totalLost: totalLost,
            totalPlayed: totalPlayed,
            winPercentage: winPercentage,
            finalRank: parseFloat(teamData['Final Rank']) || 0,
            bodFinish: placement,
            home: teamData['Home'] === 'Home' || false
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        tournamentResults.push(teamResult);
        successCount++;
      }
    } catch (error) {
      console.log(`  Error processing team data: ${error.message}`);
      failureCount++;
    }
  }
  
  // Insert tournament results
  if (tournamentResults.length > 0) {
    try {
      await db.collection('tournamentresults').insertMany(tournamentResults);
      console.log(`  Imported ${tournamentResults.length} tournament results`);
    } catch (error) {
      // Try individual inserts if bulk fails
      console.log('  Bulk insert failed, trying individual inserts...');
      let individualSuccess = 0;
      let individualFailure = 0;
      
      for (const result of tournamentResults) {
        try {
          await db.collection('tournamentresults').insertOne(result);
          individualSuccess++;
        } catch (insertError) {
          individualFailure++;
          console.log(`  Failed to insert result for player: ${result.playerId}`);
        }
      }
      
      console.log(`  Individual insert results: ${individualSuccess} successful, ${individualFailure} failed`);
    }
  }
  
  console.log(`  Imported tournament: BOD #${bodNumber} (${format}) - ${successCount} successful, ${failureCount} failed`);
}

// Run the import
importData();