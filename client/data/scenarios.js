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