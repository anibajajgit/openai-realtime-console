
import { initDatabase } from './database/index.js';
import { Role } from './database/schema.js';

async function removeSarahJohnsonRole() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('Finding Sarah Johnson role...');
    const sarah = await Role.findOne({ where: { name: 'Sarah Johnson' } });
    
    if (sarah) {
      console.log(`Found Sarah Johnson role with ID: ${sarah.id}`);
      
      // Delete the role
      const deleted = await Role.destroy({ where: { id: sarah.id } });
      
      if (deleted) {
        console.log('Successfully removed Sarah Johnson role from the database');
      } else {
        console.log('Failed to remove Sarah Johnson role');
      }
    } else {
      console.log('Sarah Johnson role not found in the database');
    }
    
    // Verify the remaining roles
    const remainingRoles = await Role.findAll();
    console.log('Remaining roles in the database:');
    remainingRoles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id})`);
    });
    
  } catch (error) {
    console.error('Error removing Sarah Johnson role:', error);
  }
}

// Run the function
removeSarahJohnsonRole();
