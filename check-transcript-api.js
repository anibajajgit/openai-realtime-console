
import express from 'express';
import { initDatabase } from './database/index.js';
import { Transcript, User, Role, Scenario } from './database/schema.js';
import cors from 'cors';

// Initialize a small express app to test the endpoint
const app = express();
app.use(express.json());
app.use(cors());

// Initialize database
initDatabase().then(() => {
  console.log('Database initialized successfully for API testing');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// Test endpoint to get transcripts for a specific user
app.get('/api/transcripts/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    console.log(`Fetching transcripts for user ID: ${userId}`);
    
    const transcripts = await Transcript.findAll({
      where: { userId },
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: Role, attributes: ['name', 'title'], required: false },
        { model: Scenario, attributes: ['name', 'description'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${transcripts.length} transcripts for user ${userId}`);
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generic endpoint to get all transcripts
app.get('/api/transcripts', async (req, res) => {
  try {
    const transcripts = await Transcript.findAll({
      include: [
        { model: User, attributes: ['username', 'email'] },
        { model: Role, attributes: ['name', 'title'], required: false },
        { model: Scenario, attributes: ['name', 'description'], required: false }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${transcripts.length} transcripts in total`);
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching all transcripts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API test server running on port ${PORT}`);
});

console.log('API test script loaded. Run this to test your transcript endpoints.');
