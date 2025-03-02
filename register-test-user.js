
import { User } from './database/schema.js';
import { initDatabase } from './database/index.js';

async function registerTestUser() {
  try {
    // Initialize the database connection
    await initDatabase();
    
    // Create a test user
    const user = await User.create({
      username: "testuser",
      password: "password123",
      email: "test@example.com"
    });
    
    console.log('Test user registered successfully:', {
      id: user.id,
      username: user.username,
      email: user.email
    });
    
    // Check the number of users
    const count = await User.count();
    console.log(`Total registered users: ${count}`);
    
  } catch (error) {
    console.error('Error registering test user:', error);
  }
}

// Run the function
registerTestUser();
