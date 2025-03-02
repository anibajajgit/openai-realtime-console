
import express from 'express';
import { initDatabase } from './database/index.js';
import { Transcript, User, Role, Scenario } from './database/schema.js';

// Initialize a small express app to test the endpoint
const app = express();
const port = 3030;

// Add the transcript GET endpoint
app.get('/api/transcripts/:userId', async (req, res) => {
  try {
    console.log(`GET /api/transcripts/${req.params.userId} requested`);
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId parameter' });
    }
    
    console.log(`Looking for transcripts with userId: ${userId}`);
    
    const transcripts = await Transcript.findAll({
      where: { userId },
      include: [
        { model: User, attributes: ['username'] },
        { model: Role, attributes: ['name'], required: false },
        { model: Scenario, attributes: ['name'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${transcripts.length} transcripts for user ${userId}`);
    
    // Return simplified transcript data
    const simplifiedTranscripts = transcripts.map(t => ({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      user: t.User ? t.User.username : null,
      role: t.Role ? t.Role.name : null,
      scenario: t.Scenario ? t.Scenario.name : null,
      contentPreview: t.content.substring(0, 100) + '...'
    }));
    
    res.json(simplifiedTranscripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Start the server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(port, () => {
      console.log(`Test server running at http://localhost:${port}`);
      console.log(`To test, visit: http://localhost:${port}/api/transcripts/1`);
    });
  } catch (error) {
    console.error('Server startup failed:', error);
  }
}

startServer();
