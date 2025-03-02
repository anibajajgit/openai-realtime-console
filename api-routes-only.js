
// This is a simplified server that only serves API routes for testing
import express from "express";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { Role, Scenario, User, Transcript, TranscriptFeedback } from './database/schema.js';
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors()); // Enable CORS for all routes
const port = 3002;

// Force all API responses to be JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API-only server is working' });
});

// Transcript save endpoint
app.post('/api/transcripts', async (req, res) => {
  try {
    console.log('Received request to save transcript on API-only server');
    console.log('Request body:', JSON.stringify(req.body));
    const { content, userId, roleId, scenarioId, title } = req.body;
    
    if (!content || !userId) {
      return res.status(400).json({ error: 'Content and userId are required' });
    }
    
    const transcript = await Transcript.create({
      content,
      userId,
      roleId,
      scenarioId,
      title: title || 'Conversation'
    });
    
    return res.status(201).json({
      message: 'Transcript saved successfully',
      transcript: {
        id: transcript.id,
        title: transcript.title,
        createdAt: transcript.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    return res.status(500).json({ error: `Failed to save transcript: ${error.message}` });
  }
});

// Initialize database and start server
async function startApiServer() {
  try {
    console.log("Initializing database for API-only server...");
    await initDatabase();
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`API-only server running on port ${port}`);
      console.log(`Test with: curl -X POST http://localhost:${port}/api/transcripts -H "Content-Type: application/json" -d '{"content":"test","userId":1}'`);
    });
  } catch (error) {
    console.error("Failed to start API-only server:", error);
  }
}

startApiServer();
