
import { setDbValue } from './db';
import { roles } from '../data/roles';
import { scenarios } from '../data/scenarios';

export async function initializeDatabase() {
  try {
    await setDbValue('roles', JSON.stringify(roles));
    await setDbValue('scenarios', JSON.stringify(scenarios));
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}
