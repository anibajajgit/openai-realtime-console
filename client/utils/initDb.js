
import { setDbValue } from './db.js';

const initialRoles = [
  {
    id: 1,
    name: "Customer Support",
    title: "Customer Support Representative",
    style: "professional",
    photoUrl: "https://placekitten.com/100/100",
    voice: "onyx",
    instructions: "You are a customer support representative helping users with their issues."
  },
  {
    id: 2, 
    name: "Sales Agent",
    title: "Sales Representative",
    style: "persuasive",
    photoUrl: "https://placekitten.com/101/101",
    voice: "nova",
    instructions: "You are a sales agent trying to close deals and build relationships."
  }
];

const initialScenarios = [
  {
    id: 1,
    name: "Cold Sales Call",
    description: "Try your hand at booking a meeting from a cold sales call",
    instructions: "this is a conversation in which the user is a sales agent who has arranged a meeting to talk to you and wants to tell you about a new product.",
    rubric: [
      "Book a follow-up: Successfully arrange a follow-up call to continue the conversation.",
      "Actively listen: Demonstrate active listening by responding thoughtfully and acknowledging key points."
    ]
  },
  {
    id: 2,
    name: "Product Demo",
    description: "Present a product demo to a potential client", 
    instructions: "this is a conversation in which the user is a sales agent who will be giving you a demo of a new product that they claim will benefit your company. this meeting was setup weeks ago",
    rubric: [
      "Feature showcase: Effectively demonstrate key product features",
      "Handle objections: Address customer concerns professionally"  
    ]
  }
];

export async function initializeDb() {
  try {
    await setDbValue('roles', JSON.stringify(initialRoles));
    await setDbValue('scenarios', JSON.stringify(initialScenarios));
    return true;
  } catch (error) {
    console.error('Failed to initialize DB:', error);
    return false;
  }
}
