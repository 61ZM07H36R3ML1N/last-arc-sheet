/** Local-first character portraits. No network calls or remote dependencies. */
const DB_NAME = 'last-arc-portraits';
const STORE_NAME = 'portraits';
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 768;
const MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Portrait database unavailable.'));
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Portrait storage failed.'));
      tx.onerror = () => reject(tx.error ?? new Error('Portrait storage failed.'));
    });
  } finally {
    db.close();
  }
}

export async function getPortrait(characterId: string): Promise<string | null> {
  return (await transaction<string | undefined>('readonly', store => store.get(characterId))) ?? null;
}

export async function putPortrait(characterId: string, dataUrl: string): Promise<void> {
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(dataUrl) || dataUrl.length > 1500000) {
    throw new Error('Invalid or oversized portrait data.');
  }
  await transaction('readwrite', store => store.put(dataUrl, characterId));
}

export async function removePortrait(characterId: string): Promise<void> {
  await transaction(characterId, 'readwrite', store => store.delete(characterId));
}

export async function processPortrait(file: File): Promise<string> {
  if (!MIME_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Image must be 8 MB or smaller.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing unavailable.');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.8);
  } finally {
    bitmap.close();
  }
}
