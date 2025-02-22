
const DB_URL = process.env.REPLIT_DB_URL;

export async function setDbValue(key, value) {
  const response = await fetch(`${DB_URL}/${key}`, {
    method: 'POST',
    body: value
  });
  return response.ok;
}

export async function getDbValue(key) {
  const response = await fetch(`${DB_URL}/${key}`);
  if (response.ok) {
    return await response.text();
  }
  return null;
}
