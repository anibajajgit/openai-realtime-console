
export const scenarios = [
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
import { getDbValue } from '../utils/db';

export let scenarios = [];

export async function fetchScenarios() {
  try {
    const scenariosData = await getDbValue('scenarios');
    if (scenariosData) {
      scenarios = JSON.parse(scenariosData);
    }
    return scenarios;
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
    return [];
  }
}
