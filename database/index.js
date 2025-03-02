
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/db.sqlite',
  logging: false
});

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    // Force sync to update schema - this will drop and recreate tables!
    await sequelize.sync({ force: true });
    console.log('Database initialized successfully with updated schema');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export default sequelize;
