import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { Role, Scenario } from './database/schema.js';

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
const hmrPort = process.env.HMR_PORT || 24678;
const apiKey = process.env.OPENAI_API_KEY;

// Database routes
app.get('/api/roles', async (req, res) => {
  const roles = await Role.findAll();
  res.json(roles);
});

app.get('/api/scenarios', async (req, res) => {
  const scenarios = await Scenario.findAll();
  res.json(scenarios);
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
await initDatabase();
await seedDatabase();

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