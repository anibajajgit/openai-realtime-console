
import express from "express";
import cors from "cors";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { Transcript } from './database/schema.js';

// Create a separate Express app just for API testing
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3001;

// Add detailed logging middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  console.log('[DEBUG] Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('[DEBUG] Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Track response for logging
  const originalSend = res.send;
  res.send = function(body) {
    console.log('[DEBUG] Response:', body);
    return originalSend.call(this, body);
  };
  
  next();
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working correctly' });
});

// Add the transcript API endpoint
app.post('/api/transcripts', async (req, res) => {
  try {
    console.log('Saving transcript in debug server');
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

async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    console.log("Database initialized for debug server");
    
    // Start the debug server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Debug API server running on port ${PORT}`);
      console.log(`Test the API with: curl -X POST http://localhost:${PORT}/api/transcripts -H "Content-Type: application/json" -d '{"content":"test","userId":1}'`);
    });
  } catch (error) {
    console.error("Failed to start debug server:", error);
  }
}

startServer();
