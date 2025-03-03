
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new Sequelize instance with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'db.sqlite'),
  logging: console.log
});

export async function initDatabase() {
  try {
    // First test the connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Import models here to avoid circular dependency
    const { User, Role, Scenario, Transcript, Feedback } = await import('./schema.js');

    try {
      // Use force:false to keep existing data, just validate structure
      console.log('Syncing User model...');
      await User.sync({ force: false });
      
      console.log('Syncing Role model...');
      await Role.sync({ force: false });
      
      console.log('Syncing Scenario model...');
      await Scenario.sync({ force: false });
      
      console.log('Syncing Transcript model...');
      await Transcript.sync({ force: false });

      // Check if Feedback table exists
      const tableExists = await sequelize.getQueryInterface().showAllTables()
        .then(tables => tables.includes('Feedbacks'));

      if (!tableExists) {
        console.log('Creating Feedbacks table...');
        await Feedback.sync({ force: true });
      } else {
        console.log('Syncing Feedback model...');
        await Feedback.sync({ force: false });
      }
    } catch (syncError) {
      console.error('Error during model sync:', syncError);
      throw syncError;
    }

    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to initialize database:', error);
    throw error;
  }
}

// Export sequelize instance as default
export default sequelize;
