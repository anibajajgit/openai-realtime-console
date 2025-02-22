
const DB_URL = process.env.REPLIT_DB_URL;

export async function setDbValue(key, value) {
  const response = await fetch(`${DB_URL}/${key}`, {
    method: 'POST',
    body: JSON.stringify(value)
  });
  return response.ok;
}

export async function getDbValue(key) {
  const response = await fetch(`${DB_URL}/${key}`);
  if (response.ok) {
    return JSON.parse(await response.text());
  }
  return null;
}

export async function initializeDb() {
  const { roles } = await import('../data/roles.js');
  const { scenarios } = await import('../data/scenarios.js');
  
  await setDbValue('roles', roles);
  await setDbValue('scenarios', scenarios);
}
