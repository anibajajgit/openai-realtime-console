
import { User } from './database/schema.js';
import { initDatabase } from './database/index.js';

async function getUserCount() {
  try {
    // Initialize the database connection
    await initDatabase();
    
    // Count the users
    const count = await User.count();
    console.log(`Total registered users: ${count}`);
    
    // Get all users for additional info
    const users = await User.findAll();
    console.log("User details:", users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email
    })));
    
  } catch (error) {
    console.error('Error querying users:', error);
  }
}

// Run the function
getUserCount();
