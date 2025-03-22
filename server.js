import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { Role, Scenario, User, Transcript, Feedback } from './database/schema.js';
import fs from 'fs';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// IMPORTANT: Handle API routes FIRST 
// This ensures API routes are handled before serving static files
app.use('/api', (req, res, next) => {
  console.log(`API request: ${req.method} ${req.url}`);
  next();
});

// Then handle production mode static file serving
if (process.env.NODE_ENV === 'production') {
  const distClientDir = path.join(__dirname, 'dist/client');
  console.log(`NODE_ENV=${process.env.NODE_ENV} - Serving static files from: ${distClientDir}`);
  
  // Check if directory exists
  if (!fs.existsSync(distClientDir)) {
    console.error(`Error: Static files directory ${distClientDir} does not exist!`);
    fs.mkdirSync(distClientDir, { recursive: true });
    console.log(`Created ${distClientDir} directory`);
  }
  
  // Serve static files
  app.use(express.static(distClientDir));
  
  // Make index.html the fallback for client-side routes, but AFTER all API routes
  app.get('*', (req, res) => {
    const indexPath = path.join(distClientDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Fallback route: ${req.url} -> serving index.html`);
      res.sendFile(indexPath);
    } else {
      console.error(`Error: index.html not found at ${indexPath}`);
      res.status(500).send('Error: index.html not found');
    }
  });
}

// Serve attached_assets directory
app.use('/assets', express.static(path.join(__dirname, 'client/assets')));
app.use('/attached_assets', express.static(path.join(__dirname, 'attached_assets')));

// Create client/assets directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'client/assets'))) {
  fs.mkdirSync(path.join(__dirname, 'client/assets'), { recursive: true });
}

// Serve MP3 files with the correct MIME type
app.get('/assets/*.mp3', (req, res, next) => {
  res.set('Content-Type', 'audio/mpeg');
  next();
});

// Also set MIME type for MP3 files in attached_assets
app.get('/attached_assets/*.mp3', (req, res, next) => {
  res.set('Content-Type', 'audio/mpeg');
  next();
});

// Debug route for call sound
app.get('/debug-call-sound', (req, res) => {
  const soundPath = path.join(__dirname, 'attached_assets', 'call-sound.mp3');

  if (fs.existsSync(soundPath)) {
    const stats = fs.statSync(soundPath);
    res.json({
      exists: true,
      size: stats.size,
      path: soundPath,
      url: '/attached_assets/call-sound.mp3'
    });
  } else {
    res.json({
      exists: false,
      path: soundPath,
      message: 'Call sound file not found'
    });
  }
});

// Debug route for attached assets
app.get('/debug-assets', (req, res) => {
  const assetPath = path.join(__dirname, 'attached_assets');
  const fs = require('fs');

  try {
    const files = fs.readdirSync(assetPath);

    // Check for image files specifically
    const imageFiles = files.filter(file => 
      file.endsWith('.jpg') || file.endsWith('.jpeg') || 
      file.endsWith('.png') || file.endsWith('.gif')
    );

    // Get file stats for each image
    const imageStats = imageFiles.map(file => {
      const filePath = path.join(assetPath, file);
      const stats = fs.statSync(filePath);
      return {
        file,
        size: stats.size,
        exists: true,
        url: `/attached_assets/${file}`,
        fullPath: filePath
      };
    });

    res.json({
      success: true,
      basePath: assetPath,
      files: files,
      imageFiles: imageStats,
      expressStaticPath: path.join(__dirname, 'attached_assets'),
      urls: imageFiles.map(file => `/attached_assets/${file}`)
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      basePath: assetPath
    });
  }
});

// Test route to directly serve a specific image
app.get('/test-image/:name', (req, res) => {
  const imageName = req.params.name;
  const imagePath = path.join(__dirname, 'attached_assets', `${imageName}.jpg`);

  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).send(`Image ${imageName}.jpg not found`);
  }
});

// API endpoints
const port = process.env.PORT || 3000;
const fallbackPort = 3001;
const hmrPort = process.env.HMR_PORT || 24678;
const apiKey = process.env.OPENAI_API_KEY;

console.log(`Starting server with ENV=${process.env.NODE_ENV}, PORT=${port}`);

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

// Transcript routes
app.post('/api/transcripts', async (req, res) => {
  try {
    console.log('Received request to save transcript:', req.body);
    const { content, userId, roleId, scenarioId, title } = req.body;

    if (!content || !userId) {
      console.error('Missing required fields:', { content: !!content, userId });
      return res.status(400).json({ error: 'Content and userId are required' });
    }

    // First save the transcript - this should be the primary operation
    const transcript = await Transcript.create({
      content,
      userId,
      roleId: roleId || null,
      scenarioId: scenarioId || null,
      title: title || 'Conversation'
    });

    console.log(`Transcript saved with ID: ${transcript.id}`);

    // Create a pending feedback entry in a separate try-catch block
    try {
      await Feedback.create({
        transcriptId: transcript.id,
        status: 'pending',
        content: 'Feedback generation pending...'
      });

      // Trigger OpenAI feedback request in the background
      // We use setTimeout to ensure this runs after the response is sent
      setTimeout(() => {
        generateOpenAIFeedback(transcript.id, content, roleId, scenarioId)
          .catch(error => {
            console.error('Error generating OpenAI feedback:', error);
          });
      }, 100);
    } catch (feedbackError) {
      // Log the error but don't fail the main transcript save operation
      console.error('Error creating feedback entry:', feedbackError);
    }

    // Always return success for the transcript save
    res.status(201).json({
      message: 'Transcript saved successfully',
      transcript: {
        id: transcript.id,
        title: transcript.title,
        createdAt: transcript.createdAt
      }
    });
  } catch (error) {
    console.error('Error saving transcript:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: `Failed to save transcript: ${error.message}` });
  }
});

app.get('/api/transcripts/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`Fetching transcripts for user ${userId}`);

    // First check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Include Role and Scenario models only if they exist and are properly associated
    const includeOptions = [];
    try {
      await Role.findOne(); // test if Role model is accessible
      includeOptions.push({ model: Role, attributes: ['name'], required: false });
    } catch (e) {
      console.log('Role model not properly defined or associated, skipping include');
    }

    try {
      await Scenario.findOne(); // test if Scenario model is accessible
      includeOptions.push({ model: Scenario, attributes: ['name'], required: false });
    } catch (e) {
      console.log('Scenario model not properly defined or associated, skipping include');
    }

    const transcripts = await Transcript.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: includeOptions
    });

    console.log(`Found ${transcripts.length} transcripts for user ${userId}`);
    res.json(transcripts);
  } catch (error) {
    console.error('Error fetching transcripts:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch transcripts' });
  }
});

app.get('/api/transcripts/:id', async (req, res) => {
  try {
    const transcriptId = req.params.id;
    const userId = req.query.userId;

    console.log(`Retrieving transcript ID ${transcriptId} for user ${userId}`);

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }

    // First verify the transcript exists and belongs to the user
    const transcriptExists = await Transcript.findOne({
      where: { 
        id: transcriptId,
        userId: userId 
      }
    });

    if (!transcriptExists) {
      console.log(`Transcript ID ${transcriptId} not found or does not belong to user ${userId}`);
      return res.status(404).json({ error: 'Transcript not found or access denied' });
    }

    // Now fetch with associations, but handle potential errors with each association
    let transcript;
    try {
      transcript = await Transcript.findOne({
        where: { 
          id: transcriptId,
          userId: userId 
        },
        include: [
          { model: Role, attributes: ['name', 'title'], required: false },
          { model: Scenario, attributes: ['name', 'description'], required: false },
          { model: Feedback, required: false }
        ]
      });
    } catch (associationError) {
      console.error('Error with associations, falling back to basic fetch:', associationError);
      // Fallback to just the transcript without associations
      transcript = transcriptExists;
    }

    // Check if feedback exists
    const existingFeedback = await Feedback.findOne({
      where: { transcriptId: transcript.id }
    });

    // If transcript exists but has no feedback, create a pending feedback entry
    if (!existingFeedback) {
      console.log(`No feedback found for transcript ${transcriptId}, creating a pending feedback entry`);

      try {
        const newFeedback = await Feedback.create({
          transcriptId: transcript.id,
          status: 'pending',
          content: 'Feedback generation pending...'
        });

        // Add the newly created feedback to the transcript object
        transcript.dataValues.Feedbacks = [newFeedback];

        // Trigger OpenAI feedback generation for this transcript
        setTimeout(() => {
          generateOpenAIFeedback(transcript.id, transcript.content, transcript.roleId, transcript.scenarioId)
            .catch(error => {
              console.error('Error generating OpenAI feedback:', error);
            });
        }, 100);
      } catch (feedbackError) {
        console.error('Error creating missing feedback entry:', feedbackError);
        // Create a stub feedback object to prevent client errors
        transcript.dataValues.Feedbacks = [{
          status: 'failed',
          content: 'Unable to generate feedback at this time.'
        }];
      }
    } else if (!transcript.Feedbacks) {
      // If the feedback exists but wasn't included in the query
      transcript.dataValues.Feedbacks = [existingFeedback];
    }

    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ error: `Failed to fetch transcript: ${error.message}` });
  }
});

// OpenAI feedback generation function
async function generateOpenAIFeedback(transcriptId, transcriptContent, roleId, scenarioId) {
  try {
    console.log(`Generating OpenAI feedback for transcript ${transcriptId}...`);

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      await Feedback.update(
        { status: 'failed', content: 'Error: OpenAI API key is missing' },
        { where: { transcriptId } }
      );
      return;
    }

    // Fetch scenario information if available
    let scenarioContext = '';
    let rubric = [];

    if (scenarioId) {
      const scenario = await Scenario.findByPk(scenarioId);
      if (scenario) {
        scenarioContext = scenario.instructions || '';
        rubric = scenario.rubric || [];
      }
    }

    // Construct the system prompt
    const systemPrompt = `you are a communcaitons coach for executives with a decade of expreicnce. review the conversation trasncript between the user and an AI and give feedback on the user's communcation. you need to evaualte their grammar, clarity, and communcation quality. also make suggestions on what they could have done better - but be nice and you can say you did a good job if they fulfiled the objectives. evalaute the quality of the conversation against the context of the scenario and the rubric given.
      you response should be in teh following format:
      SCENARIO OBJECTIVE: <to be based on the scenario>
      WAS OBJECTIVE ACHEIVED: <select between Achieved, Not acheived or partailly achieved>
      COMMUNICATION FEEDBACK: <give feedback on communcaition in bullets>
      IMPROVEMENT OPPORTUNITY: <give feedback on what they couldm have done better to achive the objecgive and have better communcaition>`;

    // Log request for debugging with full content
    console.log('======= OPENAI API REQUEST DETAILS =======');
    console.log('Transcript ID:', transcriptId);
    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    console.log('System prompt:', systemPrompt);
    console.log('User content:', `${transcriptContent}

    SCENARIO CONTEXT: ${scenarioContext || "No scenario context available"}
    RUBRIC: ${JSON.stringify(rubric) || "No rubric available"}`);
    console.log('Temperature:', 0.7);
    console.log('Max tokens:', 1000);
    console.log('======= END REQUEST DETAILS =======');

    // Make the OpenAI API call
    console.log('Making OpenAI API request...');
    const startTime = Date.now();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",  // Changed from gpt-4o to gpt-4 to match example
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `${transcriptContent}

            SCENARIO CONTEXT: ${scenarioContext || "No scenario context available"}
            RUBRIC: ${JSON.stringify(rubric) || "No rubric available"}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log('OpenAI API response received in', Date.now() - startTime, 'ms');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    if (!response.ok) {
      console.error('======= OPENAI API ERROR =======');
      console.error(`Status: ${response.status} ${response.statusText}`);

      let errorData;
      try {
        errorData = await response.json();
        console.error(`OpenAI API error details:`, JSON.stringify(errorData, null, 2));

        // Log specific error information if available
        if (errorData.error) {
          console.error('Error type:', errorData.error.type);
          console.error('Error message:', errorData.error.message);
          console.error('Error code:', errorData.error.code);
        }
      } catch (parseError) {
        errorData = await response.text();
        console.error(`OpenAI API error (${response.status}) - couldn't parse JSON:`, errorData);
      }

      // Update feedback status to failed with more detailed error info
      const errorMessage = typeof errorData === 'object' ? 
        (errorData.error?.message || JSON.stringify(errorData)) : 
        errorData;

      console.error('Saving error to feedback:', errorMessage);

      await Feedback.update(
        { 
          status: 'failed', 
          content: `API Error: ${response.status} - ${errorMessage}` 
        },
        { where: { transcriptId } }
      );

      return;
    }

    const data = await response.json();
    console.log('======= OPENAI API RESPONSE =======');
    console.log('Status:', data.object, 'model:', data.model);
    console.log('Response content:', data.choices && data.choices.length > 0 ? data.choices[0].message.content : 'No content');
    console.log('======= END RESPONSE =======');

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const feedbackContent = data.choices[0].message.content;

      // Update the feedback in the database
      await Feedback.update(
        { content: feedbackContent, status: 'completed' },
        { where: { transcriptId } }
      );

      console.log(`Feedback saved for transcript ${transcriptId}`);
    } else {
      console.error('Unexpected OpenAI response format:', JSON.stringify(data));
      throw new Error('No feedback content received from OpenAI or unexpected response format');
    }
  } catch (error) {
    console.error('Error in OpenAI feedback generation:', error);

    // Update feedback status to failed
    await Feedback.update(
      { status: 'failed', content: `Error: ${error.message}` },
      { where: { transcriptId } }
    );
  }
}

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

// Configure Vite middleware for React client
// __filename and __dirname are already defined above
const vite = await createViteServer({
  server: { 
    middlewareMode: true,
    hmr: false
  },
  appType: "custom",
  optimizeDeps: {
    disabled: process.env.NODE_ENV === 'production'
  }
});

// Allow CORS for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
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
    // For production, we'll use the static HTML file instead of Vite SSR
    if (process.env.NODE_ENV === 'production') {
      return res.sendFile(path.join(__dirname, 'dist/client', 'index.html'));
    }
    
    // For development, use Vite's SSR
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


// Production build serving is now handled at the top of the file


const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Express server running on *:${port} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
}).on('error', (e) => {
  console.error('Server error:', e);
});

// Let Express and HTTP server handle WebSocket upgrades automatically

// Log important environment variables at startup for debugging
console.log('Environment variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`PORT: ${process.env.PORT}`);
console.log(`__dirname: ${__dirname}`);
console.log(`Dist client dir: ${path.join(__dirname, 'dist/client')}`);
console.log(`Dist client exists: ${fs.existsSync(path.join(__dirname, 'dist/client'))}`);
console.log(`Index.html exists: ${fs.existsSync(path.join(__dirname, 'dist/client/index.html'))}`);
console.log(`Server URL: ${process.env.NODE_ENV === 'production' ? 'https://'+process.env.REPL_SLUG+'.'+process.env.REPL_OWNER+'.repl.co' : `http://localhost:${port}`}`);