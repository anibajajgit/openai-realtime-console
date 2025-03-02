
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/db.sqlite',
  logging: false
});

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    // Use alter instead of force to preserve data while updating schema
    await sequelize.sync({ alter: true });
    console.log('Database initialized successfully with updated schema');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export default sequelize;
