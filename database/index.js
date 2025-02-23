
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database/db.sqlite',
  logging: false
});

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

export default sequelize;
