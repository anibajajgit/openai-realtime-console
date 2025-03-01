import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { initDatabase } from './database/index.js';
import { seedDatabase } from './database/seed.js';
import { Role, Scenario, User } from './database/schema.js'; // Added User import

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

// Auth API routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Create new user
    const newUser = await User.create({
      username,
      password, // In a real app, you should hash this password
      email
    });

    // Remove password from response
    const userData = { ...newUser.toJSON() };
    delete userData.password;

    res.status(201).json({ 
      user: userData,
      message: "User registered successfully" 
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password (in a real app use proper password comparison with bcrypt)
    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Remove password from response
    const userData = { ...user.toJSON() };
    delete userData.password;

    res.json({ 
      user: userData,
      message: "Login successful" 
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Existing API routes
app.get("/api/scenarios", async (req, res) => {
  const scenarios = await Scenario.findAll();
  res.json(scenarios);
});

// Configure Vite middleware for React client
async function createViteDevServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  return vite;
}

let vite;
if (process.argv.includes('--dev')) {
  createViteDevServer().then((devServer) => {
    vite = devServer;
    app.use(vite.middlewares);
    
    // Handle SPA routing for client-side routes
    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      
      try {
        // If the request is for an API route, skip rendering
        if (url.startsWith('/api/')) {
          return next();
        }
        
        // Read index.html
        let template = fs.readFileSync('./client/index.html', 'utf-8');
        
        // Apply Vite transformations
        template = await vite.transformIndexHtml(url, template);
        
        // Load the server entry module
        const { render } = await vite.ssrLoadModule('./client/entry-server.jsx');
        
        // Render the app HTML
        const { html: appHtml } = render(url);
        
        // Inject the app-rendered HTML into the template
        const finalHtml = template.replace('<!--ssr-outlet-->', appHtml);
        
        // Send the rendered HTML
        res.status(200).set({ 'Content-Type': 'text/html' }).end(finalHtml);
      } catch (e) {
        // If an error occurs, let Vite fix the stack trace for better debugging
        vite.ssrFixStacktrace(e);
        console.error(e);
        next(e);
      }
    });
  });
} else {
  // Production mode
  app.use(express.static('./dist/client'));
  
  // Handle SPA routing for client-side routes in production
  app.get('*', (req, res) => {
    res.sendFile(resolve('./dist/client/index.html'));
  });
}
// This code is redundant as we already set up vite above
/* 
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
  appType: "custom"
});
*/

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