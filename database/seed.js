
import { Role, Scenario, User } from './schema.js';

export async function seedDatabase() {
  // Seed roles
  const roles = [
    {
      name: "Priya Anand",
      title: "CTO",
      style: "ASSERTIVE",
      photoUrl: "https://ui-avatars.com/api/?name=Priya+Anand&size=150&background=random",
      voice: "shimmer",
      instructions: "Your knowledge cutoff is 2023-10. You are an indian woman, born and raised in Mumbai, India and must Speak with a local Indian accent at all times. You are the CTO of a Pharmaceutical company. you are assertive, and dont like to be disturbed unless for something important, but are generally polite."
    },
    {
      name: "Michael Chen",
      title: "Product Manager",
      style: "COLLABORATIVE",
      photoUrl: "https://ui-avatars.com/api/?name=Michael+Chen&size=150&background=random",
      voice: "verse",
      instructions: "You are a product manager focused on user experience and collaboration. You are open to new ideas and appreciate detailed presentations."
    }
  ];

  // Seed scenarios
  const scenarios = [
    {
      name: "Pitch Meeting",
      description: "Present your product idea to the executive team",
      instructions: "You're about to pitch your new product idea to the executive team. Be prepared to explain the concept, market opportunity, and revenue potential.",
      rubric: JSON.stringify([
        "Clear explanation of the product concept",
        "Market analysis",
        "Revenue projections",
        "Implementation timeline"
      ])
    },
    {
      name: "Performance Review",
      description: "Annual performance evaluation discussion",
      instructions: "This is your annual performance review. Be prepared to discuss your achievements, areas for improvement, and career goals.",
      rubric: JSON.stringify([
        "Highlight key achievements",
        "Acknowledge areas for growth",
        "Present professional development plans",
        "Ask meaningful questions"
      ])
    }
  ];

  // Seed test user
  const users = [
    {
      username: "testuser",
      password: "password123",
      email: "test@example.com"
    }
  ];

  try {
    // Check if roles already exist
    const existingRolesCount = await Role.count();
    if (existingRolesCount === 0) {
      await Role.bulkCreate(roles);
      console.log('Roles seeded successfully');
    } else {
      console.log('Roles already exist, skipping seed');
    }

    // Check if scenarios already exist
    const existingScenariosCount = await Scenario.count();
    if (existingScenariosCount === 0) {
      await Scenario.bulkCreate(scenarios);
      console.log('Scenarios seeded successfully');
    } else {
      console.log('Scenarios already exist, skipping seed');
    }

    // Check if users already exist
    const existingUsersCount = await User.count();
    if (existingUsersCount === 0) {
      await User.bulkCreate(users);
      console.log('Test user seeded successfully');
    } else {
      console.log('Users already exist, skipping seed');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

export async function seedDatabase() {
  const existingRoles = await Role.findAll();
  const existingScenarios = await Scenario.findAll();
  
  console.log(`Found ${existingRoles.length} existing roles in the database`);
  
  // Define all expected roles
  const expectedRoles = [
    {
      name: "Priya Anand",
      title: "CTO",
      style: "ASSERTIVE",
      photoUrl: `https://ui-avatars.com/api/?name=Priya+Anand&size=150&background=random`,
      voice: "shimmer",
      instructions: "Your knowledge cutoff is 2023-10. You are an indian woman, born and raised in Mumbai, India and must Speak with a local Indian accent at all times. You are the CTO of a Pharmaceutical company. you are assertive, and dont like to be disturbed unless for something important, but are generally polite."
    },
    {
      name: "Michael Chen",
      title: "Product Manager",
      style: "COLLABORATIVE",
      photoUrl: `https://ui-avatars.com/api/?name=Michael+Chen&size=150&background=random`,
      voice: "verse",
      instructions: "You are a product manager focused on user experience and collaboration. You are open to new ideas and appreciate detailed presentations."
    },
    {
      name: "Sarah Johnson",
      title: "HR Director",
      style: "EMPATHETIC",
      photoUrl: `https://ui-avatars.com/api/?name=Sarah+Johnson&size=150&background=random`,
      voice: "nova",
      instructions: "You are an HR director with 15 years experience. You focus on people and company culture."
    }
  ];
  
  // Check which roles are missing
  const existingRoleNames = existingRoles.map(role => role.name);
  const missingRoles = expectedRoles.filter(role => !existingRoleNames.includes(role.name));
  
  if (missingRoles.length > 0) {
    console.log(`Adding ${missingRoles.length} missing roles...`);
    try {
      const roles = await Role.bulkCreate(missingRoles);
      console.log(`Created ${roles.length} roles successfully:`, roles.map(r => r.name).join(', '));
    } catch (error) {
      console.error("Error seeding roles:", error);
    }
  } else {
    console.log(`All expected roles are already in the database: ${existingRoleNames.join(', ')}`);
  }

  if (existingScenarios.length === 0) {
    await Scenario.bulkCreate([
    {
      name: "Cold Sales Call",
      description: "Try your hand at booking a meeting from a cold sales call",
      instructions: "this is a conversation in which the user is a sales agent who has arranged a meeting to talk to you and wants to tell you about a new product.",
      rubric: [
        "Book a follow-up: Successfully arrange a follow-up call to continue the conversation.",
        "Actively listen: Demonstrate active listening by responding thoughtfully and acknowledging key points."
      ]
    },
    {
      name: "Product Demo",
      description: "Present a product demo to a potential client",
      instructions: "this is a conversation in which the user is a sales agent who will be giving you a demo of a new product that they claim will benefit your company. this meeting was setup weeks ago",
      rubric: [
        "Feature showcase: Effectively demonstrate key product features",
        "Handle objections: Address customer concerns professionally"
      ]
    }
  ]);
  }
}
