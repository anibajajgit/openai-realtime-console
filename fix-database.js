
import { initDatabase } from './database/index.js';

async function fixDatabase() {
  try {
    console.log('Starting database repair...');
    
    // Import Feedback to check model definition after sequelize is initialized
    await initDatabase();
    
    // Now import schema after initialization to check model
    const { Feedback } = await import('./database/schema.js');
    console.log('Feedback model attributes:', Object.keys(Feedback.rawAttributes));
    
    console.log('Database repair completed successfully!');
  } catch (error) {
    console.error('Database repair failed:', error);
  }
}

fixDatabase();
