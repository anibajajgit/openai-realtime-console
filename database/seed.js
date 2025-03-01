
import { Role, Scenario } from './schema.js';

export async function seedDatabase() {
  const existingRoles = await Role.findAll();
  const existingScenarios = await Scenario.findAll();
  
  console.log(`Found ${existingRoles.length} existing roles in the database`);
  if (existingRoles.length === 0) {
    console.log("Seeding roles...");
    try {
      const roles = await Role.bulkCreate([
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
    ]);
      console.log(`Created ${roles.length} roles successfully:`, roles.map(r => r.name).join(', '));
    } catch (error) {
      console.error("Error seeding roles:", error);
    }
  } else {
    console.log(`Found ${existingRoles.length} existing roles: ${existingRoles.map(r => r.name).join(', ')}`);
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
