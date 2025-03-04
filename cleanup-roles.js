
import sequelize from './database/index.js';
import { Role } from './database/schema.js';

async function cleanupRoles() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');
    
    // Find and delete the Sarah Johnson role (checking by name or ID)
    const sarahRoles = await Role.findAll({
      where: {
        name: 'Sarah Johnson'
      }
    });
    
    if (sarahRoles.length > 0) {
      console.log(`Found ${sarahRoles.length} Sarah Johnson roles, deleting...`);
      for (const role of sarahRoles) {
        console.log(`Deleting role ID: ${role.id}, Name: ${role.name}`);
        await role.destroy();
      }
      console.log('Sarah Johnson roles deleted successfully.');
    } else {
      console.log('No Sarah Johnson roles found by name.');
    }
    
    // Also check for role with ID 4 specifically
    const roleWithId4 = await Role.findByPk(4);
    if (roleWithId4) {
      console.log(`Found role with ID 4: ${roleWithId4.name}, deleting...`);
      await roleWithId4.destroy();
      console.log('Role with ID 4 deleted successfully.');
    } else {
      console.log('No role with ID 4 found.');
    }
    
    // Verify cleanup
    const remainingRoles = await Role.findAll();
    console.log('Remaining roles in the database:');
    remainingRoles.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id}): ${role.title}`);
    });
    
    console.log('Role cleanup completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during role cleanup:', error);
    process.exit(1);
  }
}

cleanupRoles();
