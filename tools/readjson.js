
import fsp from 'fs/promises'
import path from 'path'

async function readJson(dirPath) {
  try {
    const filePath = path.resolve(dirPath);
    const data = await fsp.readFile(filePath, 'utf8');
    const dataObject = JSON.parse(data);
    return dataObject;
  } catch (error) {
    console.error('Error loading config:', error);
    return null;
  }
}

export { readJson }
