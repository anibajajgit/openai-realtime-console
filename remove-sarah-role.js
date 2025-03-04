
import { Role } from './database/schema.js';
import sequelize from './database/index.js';

async function removeSarahRole() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Find and delete the Sarah Johnson role
    const sarahRole = await Role.findOne({ where: { name: 'Sarah Johnson' } });
    
    if (sarahRole) {
      console.log('Found Sarah Johnson role, deleting...');
      await sarahRole.destroy();
      console.log('Sarah Johnson role deleted successfully.');
    } else {
      console.log('Sarah Johnson role not found in the database.');
    }
    
    // Verify removal
    const roles = await Role.findAll();
    console.log('Remaining roles in the database:', roles.map(r => r.name).join(', '));
    
    console.log('Role removal completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error removing Sarah Johnson role:', error);
    process.exit(1);
  }
}

removeSarahRole();
