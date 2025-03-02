
import { initDatabase } from './database/index.js';
import { Transcript, User, Role, Scenario } from './database/schema.js';

async function queryTranscripts() {
  try {
    console.log("Initializing database connection...");
    await initDatabase();
    
    console.log("Querying all transcripts...");
    const transcripts = await Transcript.findAll({
      include: [
        { model: User, attributes: ['id', 'username', 'email'] },
        { model: Role, attributes: ['id', 'name'], required: false },
        { model: Scenario, attributes: ['id', 'name'], required: false }
      ]
    });
    
    if (transcripts.length === 0) {
      console.log("No transcripts found in database");
    } else {
      console.log(`Found ${transcripts.length} transcripts:`);
      transcripts.forEach(transcript => {
        console.log("----------------------------");
        console.log(`ID: ${transcript.id}`);
        console.log(`Title: ${transcript.title}`);
        console.log(`Created: ${transcript.createdAt}`);
        console.log(`User: ${transcript.User ? transcript.User.username : 'Unknown'} (ID: ${transcript.userId})`);
        console.log(`Role: ${transcript.Role ? transcript.Role.name : 'None'}`);
        console.log(`Scenario: ${transcript.Scenario ? transcript.Scenario.name : 'None'}`);
        console.log(`Content preview: ${transcript.content.substring(0, 100)}...`);
      });
    }
    
    // Specifically check for transcripts from user with ID 1 (testuser)
    console.log("\nChecking specifically for transcripts from testuser (user ID 1)...");
    const userTranscripts = await Transcript.findAll({
      where: { userId: 1 },
      include: [
        { model: User, attributes: ['username'] }
      ]
    });
    
    if (userTranscripts.length === 0) {
      console.log("No transcripts found for testuser (user ID 1)");
    } else {
      console.log(`Found ${userTranscripts.length} transcripts for testuser:`);
      userTranscripts.forEach(t => {
        console.log(`- ${t.title} (ID: ${t.id}, Created: ${t.createdAt})`);
      });
    }
    
  } catch (error) {
    console.error("Error querying transcripts:", error);
  } finally {
    process.exit(0);
  }
}

queryTranscripts();
