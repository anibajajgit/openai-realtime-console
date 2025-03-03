
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
  console.log('Starting database reset process...');
  
  // Path to the database file
  const dbPath = path.join(__dirname, 'database', 'db.sqlite');
  
  try {
    // Check if database file exists
    if (fs.existsSync(dbPath)) {
      console.log(`Database file found at ${dbPath}`);
      
      // Close any open connections
      console.log('Closing any existing connections...');
      
      // Create a temporary connection to confirm we can access the file
      const tempDB = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
      });
      
      try {
        await tempDB.authenticate();
        await tempDB.close();
        console.log('Successfully closed existing connections');
      } catch (e) {
        console.log('No active connections to close');
      }
      
      // Backup the database file first
      const backupPath = `${dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Created database backup at ${backupPath}`);
      
      // Remove the existing database file
      fs.unlinkSync(dbPath);
      console.log('Removed old database file');
    } else {
      console.log('No existing database file found, will create a new one');
    }
    
    // Import necessary modules
    const { initDatabase } = await import('./database/index.js');
    const { seedDatabase } = await import('./database/seed.js');
    
    // Initialize a fresh database
    console.log('Initializing fresh database...');
    await initDatabase();
    
    // Seed with initial data
    console.log('Seeding database with initial data...');
    await seedDatabase();
    
    console.log('Database reset and initialization complete!');
  } catch (error) {
    console.error('Error during database reset:', error);
  }
}

// Run the reset function
resetDatabase();
