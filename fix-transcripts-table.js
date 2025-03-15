
import { initDatabase } from './database/index.js';
import { Transcript } from './database/schema.js';
import sequelize from './database/index.js';

async function fixTranscriptsTable() {
  try {
    console.log("Initializing database connection...");
    await initDatabase();
    
    console.log("Backing up existing transcripts...");
    const existingTranscripts = await sequelize.query(
      "SELECT id, content, title, roleId, scenarioId, userId, createdAt, updatedAt FROM Transcripts",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`Found ${existingTranscripts.length} existing transcripts`);
    
    console.log("Dropping and recreating Transcript table...");
    await Transcript.sync({ force: true });
    
    if (existingTranscripts.length > 0) {
      console.log("Restoring transcript data...");
      await Transcript.bulkCreate(existingTranscripts);
      console.log("Transcripts restored successfully");
    }
    
    console.log("Transcript table fixed successfully!");
  } catch (error) {
    console.error("Error fixing transcript table:", error);
  } finally {
    process.exit(0);
  }
}

fixTranscriptsTable();
