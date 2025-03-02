import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { Role, Scenario, User, Transcript } from './database/schema.js';

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

// Transcript routes
app.post('/api/transcripts', async (req, res) => {
  try {
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
    res.status(500).json({ error: 'Failed to save transcript' });
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
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }
    
    const transcript = await Transcript.findOne({
      where: { 
        id: transcriptId,
        userId: userId 
      },
      include: [
        { model: Role, attributes: ['name'] },
        { model: Scenario, attributes: ['name'] }
      ]
    });
    
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found or access denied' });
    }
    
    res.json(transcript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
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

// OpenAI feedback endpoint
app.post('/api/openai-feedback', async (req, res) => {
  try {
    const { transcriptId, userId } = req.body;
    
    // Validate input
    if (!transcriptId || !userId) {
      return res.status(400).json({ error: 'transcriptId and userId are required' });
    }
    
    // Check if transcript exists and belongs to user
    const transcript = await Transcript.findOne({
      where: { 
        id: transcriptId,
        userId: userId 
      },
      include: [
        { model: Role, attributes: ['name', 'instructions'] },
        { model: Scenario, attributes: ['name', 'instructions', 'rubric'] }
      ]
    });
    
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found or access denied' });
    }
    
    // Check if feedback already exists
    let feedback = await TranscriptFeedback.findOne({
      where: { transcriptId }
    });
    
    // If feedback exists and is completed, return it
    if (feedback && feedback.status === 'completed') {
      return res.json({ feedback });
    }
    
    // If feedback doesn't exist, create it with pending status
    if (!feedback) {
      feedback = await TranscriptFeedback.create({
        transcriptId,
        status: 'pending'
      });
    }
    
    // Prepare the prompt with scenario and role context
    const scenario = transcript.scenario ? 
      `SCENARIO: ${transcript.scenario.name}\n${transcript.scenario.instructions}\n` : '';
    const rubric = transcript.scenario && transcript.scenario.rubric ? 
      `RUBRIC: ${transcript.scenario.rubric}\n` : '';
    const role = transcript.role ? 
      `ROLE: ${transcript.role.name}\n${transcript.role.instructions}\n` : '';
    
    const systemPrompt = `
      You are a communications coach for executives with a decade of experience. 
      Review the conversation transcript between the user and an AI and give feedback 
      on the user's communication. Evaluate their grammar, clarity, and communication quality.
      Also, make suggestions on what they could have done better - but be nice 
      and you can say they did a good job if they fulfilled the objectives. 
      Evaluate the quality of the conversation against the context of the scenario 
      and the rubric given. Your response should be in the following format:
      
      SCENARIO OBJECTIVE: <based on the scenario>
      WAS OBJECTIVE ACHIEVED: <Achieved, Not achieved, or Partially achieved>
      COMMUNICATION FEEDBACK: <bulleted feedback>
      IMPROVEMENT OPPORTUNITY: <feedback on potential improvements>
      
      ${scenario}
      ${rubric}
      ${role}
      
      TRANSCRIPT:
      ${transcript.content}
    `;
    
    try {
      // Make OpenAI API call
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: systemPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });
      
      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || openaiResponse.statusText}`);
      }
      
      const openaiData = await openaiResponse.json();
      const feedbackContent = openaiData.choices?.[0]?.message?.content;
      
      if (!feedbackContent) {
        throw new Error('No feedback content received from OpenAI');
      }
      
      // Update feedback
      await feedback.update({
        content: feedbackContent,
        status: 'completed',
        errorMessage: null
      });
      
      res.json({ feedback: { ...feedback.toJSON(), content: feedbackContent } });
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Update feedback with error
      await feedback.update({
        status: 'failed',
        errorMessage: error.message
      });
      
      res.status(500).json({ 
        error: 'Failed to generate feedback', 
        message: error.message,
        feedbackId: feedback.id
      });
    }
  } catch (error) {
    console.error('Server error in feedback generation:', error);
    res.status(500).json({ error: 'Server error in feedback generation', message: error.message });
  }
});

// Endpoint to retry failed feedback
app.post('/api/openai-feedback/:id/retry', async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const { userId } = req.body;
    
    // Find the feedback
    const feedback = await TranscriptFeedback.findByPk(feedbackId, {
      include: [{ 
        model: Transcript,
        where: { userId } // Ensure the transcript belongs to the user
      }]
    });
    
    if (!feedback || !feedback.transcript) {
      return res.status(404).json({ error: 'Feedback not found or access denied' });
    }
    
    // Update status to pending
    await feedback.update({
      status: 'pending',
      errorMessage: null
    });
    
    // Redirect to the feedback generation endpoint
    const response = await fetch(`http://localhost:${port}/api/openai-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptId: feedback.transcript.id,
        userId
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error retrying feedback:', error);
    res.status(500).json({ error: 'Error retrying feedback', message: error.message });
  }
});

// Get feedback for transcript
app.get('/api/transcripts/:id/feedback', async (req, res) => {
  try {
    const transcriptId = req.params.id;
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter is required' });
    }
    
    // Check if transcript exists and belongs to user
    const transcript = await Transcript.findOne({
      where: { 
        id: transcriptId,
        userId 
      }
    });
    
    if (!transcript) {
      return res.status(404).json({ error: 'Transcript not found or access denied' });
    }
    
    // Find feedback
    const feedback = await TranscriptFeedback.findOne({
      where: { transcriptId }
    });
    
    if (!feedback) {
      return res.json({ feedback: null });
    }
    
    res.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Error fetching feedback', message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});