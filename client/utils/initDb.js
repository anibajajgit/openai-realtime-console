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
    name: "Technical Support",
    description: "Help a customer with technical issues"
  },
  {
    id: 2,
    name: "Product Inquiry",
    description: "Assist with product information and features"
  }
];

export async function initializeDb() {
  await setDbValue('roles', JSON.stringify(initialRoles));
  await setDbValue('scenarios', JSON.stringify(initialScenarios));
}