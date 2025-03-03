
import { initDatabase } from './database/index.js';
import { Role } from './database/schema.js';
import path from 'path';

async function updateRolePhotos() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    // Update Priya's photo
    const priyaUpdated = await Role.update(
      { photoUrl: '/attached_assets/priya.jpg' },
      { where: { name: 'Priya Anand' } }
    );
    
    // Update Michael's photo
    const michaelUpdated = await Role.update(
      { photoUrl: '/attached_assets/michael.jpg' },
      { where: { name: 'Michael Chen' } }
    );
    
    // Update Sarah's photo
    const sarahUpdated = await Role.update(
      { photoUrl: '/attached_assets/sarah.jpg' },
      { where: { name: 'Sarah Johnson' } }
    );
    
    console.log(`Updated ${priyaUpdated[0]} Priya records`);
    console.log(`Updated ${michaelUpdated[0]} Michael records`);
    console.log(`Updated ${sarahUpdated[0]} Sarah records`);
    
    // Verify the updates
    const roles = await Role.findAll();
    roles.forEach(role => {
      console.log(`${role.name}: ${role.photoUrl}`);
    });
    
    console.log('Photo updates completed successfully!');
  } catch (error) {
    console.error('Error updating role photos:', error);
  }
}

updateRolePhotos();
