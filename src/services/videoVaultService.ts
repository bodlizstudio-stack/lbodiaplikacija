import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const DB_NAME = 'GET_UP_LUKA_MEDIA_VAULT';
const STORE_NAME = 'media_blobs';

function openMediaIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves a File/Blob (video or image) into persistent IndexedDB on Web
 * and returns a vault key (`idb://media_...`), or copies to FileSystem on Native.
 */
export async function saveMediaFileToVault(file: File | Blob, prefix = 'past'): Promise<string> {
  const key = `media_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const db = await openMediaIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(file, key);
    tx.oncomplete = () => resolve(`idb://${key}`);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveNativeUriToVault(sourceUri: string, prefix = 'past'): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return sourceUri;
  }
  try {
    const vaultDir = `${FileSystem.documentDirectory}private_vault/`;
    const dirInfo = await FileSystem.getInfoAsync(vaultDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(vaultDir, { intermediates: true });
    }
    const ext = sourceUri.split('.').pop()?.split('?')[0] || 'mp4';
    const destUri = `${vaultDir}${prefix}_${Date.now()}.${ext}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch {
    return sourceUri;
  }
}

const resolvedUrlCache: Record<string, string> = {};

/**
 * Resolves a stored `idb://...` URI into a playable Object URL for `<video>` or `<img>`.
 */
export async function resolveVaultMediaUrl(uri: string): Promise<string> {
  if (!uri || !uri.startsWith('idb://')) {
    return uri;
  }
  if (resolvedUrlCache[uri]) {
    return resolvedUrlCache[uri];
  }
  const key = uri.replace('idb://', '');
  try {
    const db = await openMediaIndexedDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result instanceof Blob) {
          const objectUrl = URL.createObjectURL(req.result);
          resolvedUrlCache[uri] = objectUrl;
          resolve(objectUrl);
        } else {
          resolve('');
        }
      };
      req.onerror = () => resolve('');
    });
  } catch {
    return '';
  }
}

export async function deleteVaultMedia(uri: string): Promise<void> {
  if (!uri) return;
  if (uri.startsWith('idb://')) {
    const key = uri.replace('idb://', '');
    try {
      const db = await openMediaIndexedDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    } catch {}
  }
}
