
import { initDatabase } from './database/index.js';
import { Feedback } from './database/schema.js';

async function fixDatabase() {
  try {
    console.log('Starting database repair...');
    
    // Check Feedback model definition
    console.log('Feedback model attributes:', Object.keys(Feedback.rawAttributes));
    
    // Force initialize database
    await initDatabase();
    
    console.log('Database repair completed successfully!');
  } catch (error) {
    console.error('Database repair failed:', error);
  }
}

fixDatabase();
