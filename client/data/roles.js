
import { getDbValue } from '../utils/db';

export let roles = [];

export async function fetchRoles() {
  try {
    const rolesData = await getDbValue('roles');
    if (rolesData) {
      roles = JSON.parse(rolesData);
    }
    return roles;
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
}
