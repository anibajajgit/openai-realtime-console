
import { Transcript, User, Role, Scenario } from './database/schema.js';
import { initDatabase } from './database/index.js';

async function listRecentTranscripts() {
  try {
    console.log("Initializing database connection...");
    await initDatabase();
    
    console.log("Fetching recent transcripts...");
    const transcripts = await Transcript.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [
        { model: User, attributes: ['username'] },
        { model: Role, attributes: ['name'], required: false },
        { model: Scenario, attributes: ['name'], required: false }
      ]
    });
    
    if (transcripts.length === 0) {
      console.log("No transcripts found in the database.");
      return;
    }
    
    console.log(`Found ${transcripts.length} transcripts:`);
    transcripts.forEach(transcript => {
      console.log(`\nID: ${transcript.id}`);
      console.log(`Title: ${transcript.title}`);
      console.log(`Created: ${transcript.createdAt}`);
      console.log(`User: ${transcript.User?.username || 'Unknown'}`);
      console.log(`Role: ${transcript.Role?.name || 'None'}`);
      console.log(`Scenario: ${transcript.Scenario?.name || 'None'}`);
      console.log(`Content length: ${transcript.content?.length || 0} characters`);
    });
    
    console.log("\nTranscript content for most recent transcript:");
    if (transcripts[0]?.content) {
      console.log(transcripts[0].content.substring(0, 200) + "...");
    } else {
      console.log("No content available");
    }
  } catch (error) {
    console.error("Error listing transcripts:", error);
  }
}

listRecentTranscripts();
