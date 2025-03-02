import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { Role, Scenario, User } from './database/schema.js';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const hmrPort = process.env.HMR_PORT || 24678;
const apiKey = process.env.OPENAI_API_KEY;

// Database routes
app.get('/api/roles', async (req, res) => {
  try {
    const roles = await Role.findAll();
    console.log(`Sending ${roles.length} roles to client`);
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.get('/api/scenarios', async (req, res) => {
  const scenarios = await Scenario.findAll();
  res.json(scenarios);
});

// User authentication routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = await User.create({
      username,
      password, // In a production app, you'd hash this password
      email
    });

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password (in a real app, you'd compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user info (excluding password)
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Transcript routes
import { Client as ObjectStorageClient } from '@replit/object-storage';
import { Transcript } from './database/schema.js';

// Initialize object storage client
let objectStorage;
try {
  // Try to use the object storage client with a default bucket name
  objectStorage = new ObjectStorageClient({ bucket: process.env.REPLIT_OBJECT_STORAGE_BUCKET || 'default-bucket' });
  console.log("Object storage client initialized successfully");
} catch (error) {
  console.error("Error initializing object storage client:", error.message);
  console.log("Using in-memory transcript storage as fallback");
  
  // Create an in-memory storage for transcripts as fallback
  const inMemoryStorage = new Map();
  
  objectStorage = {
    upload_from_text: async (key, content) => { 
      console.log(`Storing transcript with key: ${key} (in-memory fallback)`);
      inMemoryStorage.set(key, content);
      return key; 
    },
    download_from_text: async (key) => { 
      console.log(`Retrieving transcript with key: ${key} (in-memory fallback)`);
      return inMemoryStorage.get(key) || JSON.stringify({
        transcript: [{
          type: "message", 
          content: "This is a fallback transcript. Object storage is not properly configured."
        }],
        scenarioName: "Default Scenario",
        roleName: "Default Role",
        timestamp: new Date().toISOString()
      }); 
    }
  };
}

// Save transcript to object storage and record in database
app.post('/api/transcripts', async (req, res) => {
  try {
    const { userId, transcript, scenarioName, roleName } = req.body;

    if (!userId || !transcript) {
      return res.status(400).json({ error: 'User ID and transcript are required' });
    }

    // Generate a unique key for the transcript
    const timestamp = new Date().toISOString();
    const storageKey = `transcripts/${userId}/${timestamp}.json`;

    // Store transcript in object storage
    await objectStorage.upload_from_text(storageKey, JSON.stringify({
      transcript,
      scenarioName,
      roleName,
      timestamp
    }));

    // Record in database
    const transcriptRecord = await Transcript.create({
      userId,
      storageKey,
      scenarioName,
      roleName
    });

    res.status(201).json({
      message: 'Transcript saved successfully',
      transcriptId: transcriptRecord.id
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    res.status(500).json({ error: 'Failed to save transcript' });
  }
});

// Get all transcripts for a user
app.get('/api/transcripts/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const transcripts = await Transcript.findAll({
      where: { userId: parseInt(userId) },
      order: [['createdAt', 'DESC']]
    });

    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

// Get a specific transcript by ID
app.get('/api/transcripts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching transcript with ID: ${id}`);

    const transcriptRecord = await Transcript.findByPk(id);

    if (!transcriptRecord) {
      console.log(`Transcript with ID ${id} not found in database`);
      return res.status(404).json({ error: 'Transcript not found' });
    }

    console.log(`Found transcript record: ${transcriptRecord.id}, storageKey: ${transcriptRecord.storageKey}`);

    try {
      // Retrieve from object storage
      const transcriptData = await objectStorage.download_from_text(transcriptRecord.storageKey);
      
      // Ensure we got valid JSON data
      let parsedData;
      try {
        parsedData = JSON.parse(transcriptData);
      } catch (jsonError) {
        console.error('Error parsing transcript JSON:', jsonError);
        console.log('Raw transcript data:', transcriptData);
        return res.status(500).json({ 
          error: 'Invalid transcript data format',
          record: transcriptRecord,
          rawData: transcriptData.substring(0, 100) + '...' // Send partial raw data for debugging
        });
      }

      res.json({
        record: transcriptRecord,
        data: parsedData
      });
    } catch (storageError) {
      console.error('Error retrieving from object storage:', storageError);
      // Return a partial response with the record but no data
      res.status(207).json({
        record: transcriptRecord,
        error: 'Storage retrieval failed',
        data: {
          transcript: [{
            type: "response.text.done",
            text: "The transcript content could not be retrieved from storage."
          }],
          scenarioName: transcriptRecord.scenarioName || "Unknown",
          roleName: transcriptRecord.roleName || "Unknown",
          timestamp: transcriptRecord.createdAt
        }
      });
    }
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: `Failed to fetch transcript: ${error.message}` });
  }
});

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { 
    middlewareMode: true,
    hmr: {
      protocol: 'ws',
      host: '0.0.0.0',
      port: 24678,
      clientPort: 24678
    }
  },
  appType: "custom",
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.headers.upgrade === 'websocket') {
    res.header('Connection', 'Upgrade');
    res.header('Upgrade', 'websocket');
  }
  next();
});

app.use(vite.middlewares);

// Initialize database and seed data
console.log("Initializing database...");
await initDatabase();
console.log("Seeding database...");
await seedDatabase();
console.log("Database setup complete");

// Verify roles in database after seeding
const rolesInDb = await Role.findAll();
console.log(`Server startup: Found ${rolesInDb.length} roles in database:`, rolesInDb.map(r => r.name).join(', '));

// API route for token generation and WebSocket upgrade
app.get("/token", async (req, res) => {
  try {
    const roleId = req.query.roleId;
    const scenarioId = req.query.scenarioId;
    const rolesResponse = await fetch('http://localhost:3000/api/roles');
    const rolesData = await rolesResponse.json();
    const scenariosResponse = await fetch('http://localhost:3000/api/scenarios');
    const scenariosData = await scenariosResponse.json();

    const selectedRole = rolesData.find(r => r.id === Number(roleId));
    const selectedScenario = scenariosData.find(s => s.id === Number(scenarioId));

    const combinedInstructions = selectedRole && selectedScenario ? 
      `${selectedRole.instructions}\n\nContext: ${selectedScenario.instructions}` : 
      (selectedRole?.instructions || '');
    console.log("Selected role:", selectedRole?.id);
    console.log("Selected scenario:", selectedScenario?.id);
    console.log("Combined instructions:", combinedInstructions);

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: selectedRole?.voice || "verse",
          instructions: combinedInstructions,
          input_audio_transcription: {
            model: "whisper-1"
          }
        }),
      },
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});